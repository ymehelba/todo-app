import os
import uuid
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from datetime import datetime, timezone

app = Flask(__name__, static_folder='.', static_url_path='')
CORS(app)

# Data store for added feature - team-based task management
USERS = [
    {"id": 1, "name": "Team Member 1"},
    {"id": 2, "name": "Team Member 2"},
    {"id": 3, "name": "Team Member 3"}
]

TASKS = [
{
        "id": "1",
        "title": "Complete project documentation",
        "completed": False, 
        "createdAt": "2025-01-10T09:00:00Z",
        "description": "Finalize PRD and technical specs.",
        "assigned_to_user_id": 1,
        "history": []
    },
    {
        "id": "2",
        "title": "Review pull requests",
        "completed": True, 
        "createdAt": "2025-01-09T14:30:00Z",
        "description": "Review code quality.",
        "assigned_to_user_id": 1,
        "history": []
    }
]

# Helper functions

def get_user_by_id(user_id):
    return next((user for user in USERS if user["id"] == user_id), None)

def get_task_by_id(task_id):
    return next((task for task in TASKS if task["id"] == task_id), None)

def add_history_entry(task, description, user_id, user_name=None):
    if user_name is None:
        user = get_user_by_id(user_id)
        final_user_name = user['name'] if user else "Unknown User"
    else:
        final_user_name = user_name

    history_entry = {
        "change_date": datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z'),
        "change_description": description,
        "changed_by_user_id": user_id,
        "changed_by_user_name": final_user_name
    }
    task["history"].append(history_entry)

# API endpoints

@app.route("/")
def index():
    return send_from_directory(app.static_folder, 'index.html')

@app.route("/api/tasks", methods=["GET"])
def get_all_tasks():
    return jsonify({"tasks": TASKS})

@app.route("/api/tasks", methods=["POST"])
def create_task():
    data = request.get_json()
    # Feature 1: Validation
    required = ['title', 'assigned_to_user_id', 'creator_name']
    if not data or not all(k in data for k in required) or not data['title'].strip():
        return jsonify({"error": "Missing required fields or empty title"}), 400

    assigned_user = get_user_by_id(data['assigned_to_user_id'])
    if not assigned_user:
        return jsonify({"error": "Assigned user not found"}), 404

    new_task = {
        "id": uuid.uuid4().hex,
        "title": data["title"],
        "completed": False, # Always starts as false
        "createdAt": datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z'), 
        "description": data.get("description", ""),
        "assigned_to_user_id": data.get("assigned_to_user_id", 1),
        "history": [{"date": datetime.now(timezone.utc).isoformat(), "msg": "Created"}]
    }

    add_history_entry(new_task, f"Task created.", None, data['creator_name'])
    TASKS.append(new_task)
    return jsonify(new_task), 201

@app.route("/api/tasks/<string:task_id>/status", methods=["PUT"])
def update_task_status(task_id):
    task = get_task_by_id(task_id)
    if not task: return jsonify({"error": "Task not found"}), 404
    
    data = request.get_json()
    new_status = data.get('new_status') 
    
    # Feature 3: Mark Task as Complete/Incomplete
    task["completed"] = (new_status == "Closed")
    task["status"] = new_status
    
    add_history_entry(task, f"Status changed to {new_status}.", data.get('changed_by_user_id'))
    return jsonify(task)

@app.route("/api/tasks/<string:task_id>/toggle", methods=["PUT"])
def toggle_task(task_id):
    task = next((t for t in TASKS if t["id"] == task_id), None)
    if not task: return jsonify({"error": "Not found"}), 404
    
    # Feature 3: Toggle status
    task["completed"] = not task["completed"]
    return jsonify(task)

@app.route("/api/tasks/<string:task_id>/comment", methods=["POST"])
def add_comment(task_id):
    task = get_task_by_id(task_id)
    if not task: return jsonify({"error": "Task not found"}), 404
    data = request.get_json()
    if not data or 'comment' not in data: return jsonify({"error": "Missing comment field"}), 400
    comment = data['comment']
    user_id = data.get('user_id')
    user_name = data.get('user_name')
    if user_name:
        add_history_entry(task, f"Comment added: '{comment}'", user_id=None, user_name=user_name)
    elif user_id:
        add_history_entry(task, f"Comment added: '{comment}'", user_id=user_id)
    else:
        return jsonify({"error": "Missing user_id or user_name for comment"}), 400
    return jsonify(task)

@app.route("/api/tasks/<string:task_id>/set-date", methods=["PUT"])
def set_assignee_date(task_id):
    task = get_task_by_id(task_id)
    if not task: return jsonify({"error": "Task not found"}), 404
    data = request.get_json()
    if not data or not all(k in data for k in ['assignee_date', 'changed_by_user_id']): return jsonify({"error": "Missing required fields"}), 400
    assignee_date = data['assignee_date']
    task['expected_date_assignee'] = assignee_date
    add_history_entry(task, f"Assignee updated their expected completion date to {assignee_date}.", data['changed_by_user_id'])
    return jsonify(task)

@app.route("/api/tasks/<string:task_id>/assign", methods=["PUT"])
def assign_task(task_id):
    task = get_task_by_id(task_id)
    if not task: return jsonify({"error": "Task not found"}), 404
    data = request.get_json()
    if not data or not all(k in data for k in ['new_user_id', 'changed_by_user_id']): return jsonify({"error": "Missing required fields"}), 400
    new_user = get_user_by_id(data['new_user_id'])
    if not new_user: return jsonify({"error": "New user not found"}), 404
    old_user_name = get_user_by_id(task.get('assigned_to_user_id'))['name'] if task.get('assigned_to_user_id') else "Unassigned"
    task["assigned_to_user_id"] = new_user["id"]
    add_history_entry(task, f"Task reassigned from {old_user_name} to {new_user['name']}.", data['changed_by_user_id'])
    return jsonify(task)

@app.route("/api/tasks/user/<int:user_id>", methods=["GET"])
def get_tasks_for_user(user_id):
    user_tasks = [task for task in TASKS if task.get("assigned_to_user_id") == user_id]
    return jsonify(user_tasks)

@app.route("/api/tasks/<string:task_id>", methods=["GET"])
def get_task(task_id):
    task = get_task_by_id(task_id)
    return jsonify(task) if task else (jsonify({"error": "Task not found"}), 404)

@app.route("/api/tasks/<string:task_id>", methods=["DELETE"])
def delete_task(task_id):
    global TASKS
    task = get_task_by_id(task_id)
    if not task:
        return jsonify({"error": "Task not found"}), 404
    
    # Remove the task from the list
    TASKS = [t for t in TASKS if t["id"] != task_id]
    return jsonify({"message": "Task deleted successfully"}), 200

if __name__ == '__main__':
    app.run(debug=True, port=5000)