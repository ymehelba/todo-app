import os
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from datetime import datetime, timezone

app = Flask(__name__, static_folder='.', static_url_path='')
CORS(app)

# Mock data structure as per PRD
tasks = [
    {"id": 1, "title": "Complete project documentation", "completed": False, "createdAt": "2025-01-10T09:00:00Z"},
    {"id": 2, "title": "Review pull requests", "completed": True, "createdAt": "2025-01-09T14:30:00Z"},
    {"id": 3, "title": "Setup development environment", "completed": True, "createdAt": "2025-01-08T10:15:00Z"},
    {"id": 4, "title": "Write unit tests", "completed": False, "createdAt": "2025-01-11T11:00:00Z"},
    {"id": 5, "title": "Deploy to staging server", "completed": False, "createdAt": "2025-01-12T16:45:00Z"}
]

@app.route("/")
def index():
    return send_from_directory(app.static_folder, 'index.html')

@app.route("/api/tasks", methods=["GET"])
def get_tasks():
    return jsonify({"tasks": tasks})

@app.route("/api/tasks", methods=["POST"])
def add_task():
    data = request.json
    if not data.get("title"): # Validation: empty tasks not allowed
        return jsonify({"error": "Title is required"}), 400
    new_task = {
        "id": len(tasks) + 1,
        "title": data["title"],
        "completed": False,
        "createdAt": datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z')
    }
    tasks.append(new_task)
    return jsonify(new_task), 201

if __name__ == '__main__':
    app.run(debug=True, port=5000)