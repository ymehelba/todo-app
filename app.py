@app.route("/api/tasks", methods=["POST"])
def add_task():
    data = request.get_json()
    if not data or not data.get('title'):
        return jsonify({"error": "Empty tasks not allowed"}), 400
    
    new_task = {
        "id": uuid.uuid4().hex,
        "title": data['title'],
        "completed": False,
        "createdAt": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
    }
    TASKS.insert(0, new_task)
    return jsonify(new_task), 201