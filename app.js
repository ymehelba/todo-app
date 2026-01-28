document.addEventListener('DOMContentLoaded', () => {
    const API_BASE_URL = 'http://127.0.0.1:5000/api/tasks';
    const todoForm = document.getElementById('todo-form');
    const todoInput = document.getElementById('todo-input');
    const todoList = document.getElementById('todo-list');
    
    let state = {
        tasks: [],
        currentFilter: 'All'
    };

    // Fetch tasks from mock backend
    async function fetchTasks() {
        try {
            const response = await fetch(API_BASE_URL);
            const data = await response.json();
            state.tasks = data.tasks; // Backend returns { "tasks": [...] }
            renderTasks();
        } catch (error) {
            console.error('Error fetching tasks:', error);
        }
    }

    // Feature 1: Add new task
    todoForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const title = todoInput.value.trim();
        if (!title) return; // Basic validation

        try {
            const response = await fetch(API_BASE_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title })
            });
            const newTask = await response.json();
            state.tasks.push(newTask);
            todoInput.value = '';
            renderTasks();
        } catch (error) {
            console.error('Error adding task:', error);
        }
    });

    // Feature 3: "Mark Task as Complete/Incomplete"
    window.toggleTask = function(id) {
        const task = state.tasks.find(t => t.id === id);
        if (task) {
            task.completed = !task.completed;
            renderTasks();
        }
    };

    // Feature 2
    function renderTasks() {
        todoList.innerHTML = '';
        
        state.tasks.forEach(task => {
            const date = new Date(task.createdAt).toLocaleDateString();
            const li = document.createElement('li');
            li.className = `task-item ${task.completed ? 'completed' : ''}`; // Visual distinction 
            
            li.innerHTML = `
                <div class="task-content">
                    <input type="checkbox" ${task.completed ? 'checked' : ''} 
                           onclick="toggleTask(${task.id})">
                    <span class="task-title">${task.title}</span>
                    <small class="task-date">${date}</small>
                </div>
            `;
            todoList.appendChild(li);
        });
    }

    fetchTasks();
});