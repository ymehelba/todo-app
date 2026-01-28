document.addEventListener('DOMContentLoaded', () => {
    const API_BASE_URL = 'http://127.0.0.1:5000/api/tasks';
    const todoForm = document.getElementById('todo-form');
    const todoInput = document.getElementById('todo-input');
    const todoList = document.getElementById('todo-list');
    const filterBtns = document.querySelectorAll('.filter-btn');
    
    let state = {
        tasks: [],
        currentFilter: 'All'
    };

    async function fetchTasks() {
        try {
            const response = await fetch(API_BASE_URL);
            const data = await response.json();
            state.tasks = data.tasks; // Fetch from mock backend
            renderTasks();
        } catch (error) {
            console.error('Error fetching tasks:', error);
        }
    }

    // Feature 3: "Mark Task as Complete/Incomplete"
    window.toggleTask = function(id) {
        const task = state.tasks.find(t => t.id === id);
        if (task) {
            task.completed = !task.completed;
            renderTasks();
        }
    };

    // Feature 4: Delete Task
    let taskIdToDelete = null;
    const deleteModal = document.getElementById('delete-modal');

    window.deleteTask = function(id) {
        taskIdToDelete = id;
        deleteModal.classList.remove('hidden'); // Show in-page confirmation
    };

    // Handle Modal Actions
    document.getElementById('confirm-delete-btn').addEventListener('click', () => {
        if (taskIdToDelete !== null) {
            state.tasks = state.tasks.filter(t => t.id !== taskIdToDelete);
            taskIdToDelete = null;
            deleteModal.classList.add('hidden');
            renderTasks();
        }
    });

    document.getElementById('cancel-delete-btn').addEventListener('click', () => {
        taskIdToDelete = null;
        deleteModal.classList.add('hidden');
    });

    // Feature 5: Filter Tasks
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active')); // Visual indication
            btn.classList.add('active');
            state.currentFilter = btn.dataset.filter;
            renderTasks();
        });
    });

    function renderTasks() {
        todoList.innerHTML = '';
        
        const filtered = state.tasks.filter(task => {
            if (state.currentFilter === 'Completed') return task.completed;
            if (state.currentFilter === 'Pending') return !task.completed;
            return true;
        });

        filtered.forEach(task => {
            const date = new Date(task.createdAt).toLocaleDateString();
            const li = document.createElement('li');
            li.className = `task-item ${task.completed ? 'completed' : ''}`;  // Visual distinction 
            
            li.innerHTML = `
                <div class="task-info">
                    <input type="checkbox" ${task.completed ? 'checked' : ''} onclick="toggleTask(${task.id})">
                    <span class="task-title">${task.title}</span>
                    <small>Created: ${date}</small>
                </div>
                <button class="delete-btn" onclick="deleteTask(${task.id})">Delete</button>
            `;
            todoList.appendChild(li);
        });
    }

    // Feature 1: Add New Task
    todoForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const title = todoInput.value.trim();
        if (!title) return;

        const response = await fetch(API_BASE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title })
        });
        const newTask = await response.json();
        state.tasks.push(newTask);
        todoInput.value = '';
        renderTasks();
    });

    fetchTasks();
});