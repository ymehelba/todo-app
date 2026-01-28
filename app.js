document.addEventListener('DOMContentLoaded', () => {

    const API_BASE_URL = '/api/tasks'; 
    let state = {
        currentUserId: null,
        currentUserName: null,
        currentView: 'team-member',
        currentFilter: 'All', // Feature 5: Added filter state [cite: 26-27]
        tasks: [] 
    };
    let taskIdToDelete = null;

    // DOM Elements
    const currentUserSelect = document.getElementById('current-user-select');
    const teamMemberDashboard = document.getElementById('team-member-dashboard');
    const requesterDashboard = document.getElementById('requester-dashboard');
    const teamMemberViewBtn = document.getElementById('team-member-view-btn');
    const requesterViewBtn = document.getElementById('requester-view-btn');
    const myTasksList = document.getElementById('my-tasks-list');
    const allTasksList = document.getElementById('all-tasks-list');
    const createTaskForm = document.getElementById('create-task-form');
    const creatorNameInput = document.getElementById('creator-name-input');
    const teamMemberTitle = document.getElementById('team-member-title');
    const toastContainer = document.getElementById('toast-container');
    
    // Modal elements
    const modal = document.getElementById('task-modal');
    const deleteModal = document.getElementById('delete-modal'); 
    const modalForm = document.getElementById('modal-form');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    const modalTaskIdInput = document.getElementById('modal-task-id');
    const modalSubmitBtn = document.getElementById('modal-submit-btn');
    const closeModalBtn = document.querySelector('.close-btn');

    function showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        toastContainer.appendChild(toast);
        setTimeout(() => toast.classList.add('show'), 100);
        setTimeout(() => {
            toast.classList.remove('show');
            toast.addEventListener('transitionend', () => toast.remove());
        }, 3000);
    }

    // Features 2 & 3: View all tasks with visual distinction
    function createTaskListItem(task) {
        const li = document.createElement('li');
        li.className = `task-item ${task.completed ? 'completed' : ''}`;
        li.dataset.taskId = task.id;

        li.innerHTML = `
            <div class="task-card-content">
                <h3>${task.title}</h3>
                <p class="status-badge">${task.completed ? 'Completed' : 'Pending'}</p>
                <small>Added: ${new Date(task.createdAt).toLocaleDateString()}</small>
                <button class="delete-btn-inline" onclick="event.stopPropagation(); window.confirmDelete('${task.id}')">Delete</button>
            </div>
        `;
        return li;
    }

    async function refreshData() {
        try {
            const response = await fetch(API_BASE_URL);
            const data = await response.json();
            state.tasks = data.tasks; 
            updateUI();
        } catch (error) {
            console.error('Error fetching tasks:', error);
            showToast('Error loading tasks.', 'error');
        }
    }

    // Helper to filter tasks based on the active status filter
    function applyStatusFilter(tasks) {
        if (state.currentFilter === 'Completed') return tasks.filter(t => t.completed === true);
        if (state.currentFilter === 'Pending') return tasks.filter(t => t.completed === false);
        return tasks; // 'All'
    }

function updateUI() {
        if (state.currentView === 'team-member') {
            teamMemberDashboard.classList.remove('hidden');
            requesterDashboard.classList.add('hidden');
            teamMemberViewBtn.classList.add('active');
            requesterViewBtn.classList.remove('active');
            teamMemberTitle.textContent = `${state.currentUserName}'s Assigned Tasks`;
            
            myTasksList.innerHTML = '';
            // Apply both User and Status filters
            let myTasks = state.tasks.filter(t => t.assigned_to_user_id === state.currentUserId);
            myTasks = applyStatusFilter(myTasks);

            if (myTasks.length === 0) {
                myTasksList.innerHTML = '<li>No tasks found for this filter.</li>';
            } else {
                myTasks.forEach(task => myTasksList.appendChild(createTaskListItem(task)));
            }
        } else {
            teamMemberDashboard.classList.add('hidden');
            requesterDashboard.classList.remove('hidden');
            teamMemberViewBtn.classList.remove('active');
            requesterViewBtn.classList.add('active');
            
            allTasksList.innerHTML = '';
            // Apply Status filter to all system tasks [cite: 26-27]
            let allTasks = applyStatusFilter(state.tasks);
            if (allTasks.length === 0) {
                allTasksList.innerHTML = '<li>No tasks found.</li>';
            } else {
                allTasks.forEach(task => allTasksList.appendChild(createTaskListItem(task)));
            }
        }
    }

    // Feature 5: Event Listeners for Filter Buttons [cite: 28]
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Remove active class from all buttons and add to the clicked one
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            const filterType = e.target.getAttribute('data-filter');
            
            // Sync active state for buttons in both dashboards
            document.querySelectorAll(`.filter-btn[data-filter="${filterType}"]`).forEach(b => b.classList.add('active'));
            
            state.currentFilter = filterType;
            updateUI();
        });
    });

    // Feature 4: Persistent Delete Logic [cite: 23-25]
    window.confirmDelete = function(id) {
        taskIdToDelete = id;
        deleteModal.classList.remove('hidden');
    };

    document.getElementById('confirm-delete-btn').addEventListener('click', async () => {
        if (!taskIdToDelete) return;
        
        try {
            const response = await fetch(`${API_BASE_URL}/${taskIdToDelete}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                showToast('Task deleted permanently.', 'error');
                deleteModal.classList.add('hidden');
                refreshData(); // Reload tasks from server [cite: 19]
            } else {
                throw new Error('Delete failed');
            }
        } catch (error) {
            showToast('Failed to delete task.', 'error');
        }
    });

    document.getElementById('cancel-delete-btn').addEventListener('click', () => {
        deleteModal.classList.add('hidden');
        taskIdToDelete = null;
    });

    // Feature 1: Add New Task
    async function handleCreateTask(event) {
        event.preventDefault();
        const taskData = {
            title: document.getElementById('title').value,
            description: document.getElementById('description').value,
            assigned_to_user_id: parseInt(document.getElementById('assign-to').value),
            creator_name: creatorNameInput.value,
            requester_date: document.getElementById('requester-date').value
        };

        try {
            const response = await fetch(API_BASE_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(taskData),
            });
            if (!response.ok) throw new Error('Failed to create task');
            showToast('Task created successfully!');
            createTaskForm.reset();
            refreshData();
        } catch (error) {
            showToast('Failed to create task.', 'error');
        }
    }
    
    async function openTaskDetailsModal(taskId) {
        try {
            const response = await fetch(`${API_BASE_URL}/${taskId}`);
            const task = await response.json();

            modalTitle.textContent = `Details: ${task.title}`;
            
            let historyHtml = '<h4>History:</h4>';
            task.history.forEach(h => {
                historyHtml += `<div class="history-item"><p>${h.change_description}</p><small>${h.changed_by_user_name} - ${new Date(h.change_date).toLocaleString()}</small></div>`;
            });

            // Feature 3: Toggle completion status
            let actionsHtml = `<div class="task-actions" data-task-id="${task.id}">
                <button class="reassign-btn">Reassign</button>
                <button class="resolve-btn">${task.completed ? 'Re-open' : 'Mark as Complete'}</button>
                <button class="comment-btn">Comment</button>
            </div>`;

            modalBody.innerHTML = `
                <div class="task-details-content">
                    <p><strong>Status:</strong> <span class="status ${task.completed ? 'Closed' : 'Open'}">${task.completed ? 'Completed' : 'Pending'}</span></p>
                    <p><strong>Description:</strong> ${task.description || 'N/A'}</p>
                    <hr>${historyHtml}${actionsHtml}
                </div>
            `;
            modalSubmitBtn.style.display = 'none';
            modal.style.display = 'block';
        } catch (error) {
            showToast('Error loading details.', 'error');
        }
    }

    async function toggleTaskStatus(taskId) {
        const task = state.tasks.find(t => t.id === taskId);
        const nextStatus = task.completed ? "Open" : "Closed";
        
        try {
            const response = await fetch(`${API_BASE_URL}/${taskId}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    new_status: nextStatus,
                    changed_by_user_id: state.currentUserId 
                })
            });
            if (response.ok) {
                showToast(`Task ${task.completed ? 're-opened' : 'completed'}!`);
                modal.style.display = 'none';
                refreshData();
            }
        } catch (error) {
            showToast('Error updating status.', 'error');
        }
    }

    // Feature 4: In-page delete logic
    window.confirmDelete = function(id) {
        taskIdToDelete = id;
        deleteModal.classList.remove('hidden');
    };

    document.getElementById('confirm-delete-btn').addEventListener('click', () => {
        state.tasks = state.tasks.filter(t => t.id !== taskIdToDelete);
        deleteModal.classList.add('hidden');
        showToast('Task removed from list.', 'error');
        updateUI();
    });

    document.getElementById('cancel-delete-btn').addEventListener('click', () => {
        deleteModal.classList.add('hidden');
        taskIdToDelete = null;
    });

    function openActionModal(taskId, action) {
        currentAction = action;
        modalTaskIdInput.value = taskId;
        modalSubmitBtn.style.display = 'block';

        if (action === 'reassign') {
            modalTitle.textContent = 'Reassign Task';
            modalBody.innerHTML = `<select id="modal-select" required><option value="1">Team Member 1</option><option value="2">Team Member 2</option><option value="3">Team Member 3</option></select>`;
        } else if (action === 'comment') {
            modalTitle.textContent = 'Add Comment';
            modalBody.innerHTML = `<textarea id="modal-select" rows="3" required placeholder="Type comment..."></textarea>`;
        }
        modal.style.display = 'block';
    }

    async function handleModalSubmit(event) {
        event.preventDefault();
        const taskId = modalTaskIdInput.value;
        const val = document.getElementById('modal-select').value;
        let endpoint = '';
        let payload = { changed_by_user_id: state.currentUserId };
        let method = 'PUT';

        if (currentAction === 'reassign') {
            endpoint = `${API_BASE_URL}/${taskId}/assign`;
            payload.new_user_id = parseInt(val);
        } else if (currentAction === 'comment') {
            endpoint = `${API_BASE_URL}/${taskId}/comment`;
            method = 'POST';
            payload.comment = val;
            payload.user_id = state.currentUserId;
        }

        const response = await fetch(endpoint, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            showToast('Updated successfully!');
            modal.style.display = 'none';
            refreshData();
        }
    }

    // Event listeners
    currentUserSelect.addEventListener('change', (e) => {
        state.currentUserId = parseInt(e.target.value);
        state.currentUserName = e.target.options[e.target.selectedIndex].text;
        updateUI();
    });

    teamMemberViewBtn.addEventListener('click', () => { state.currentView = 'team-member'; updateUI(); });
    requesterViewBtn.addEventListener('click', () => { state.currentView = 'requester'; updateUI(); });
    createTaskForm.addEventListener('submit', handleCreateTask);
    modalForm.addEventListener('submit', handleModalSubmit);
    
    closeModalBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    window.addEventListener('click', (event) => {
        if (event.target == modal) modal.style.display = 'none';
        if (event.target == deleteModal) deleteModal.classList.add('hidden');
    });

    document.querySelector('main').addEventListener('click', (e) => {
        const item = e.target.closest('.task-item');
        if (item) openTaskDetailsModal(item.dataset.taskId);
    });

    modalBody.addEventListener('click', (e) => {
        const btn = e.target;
        if (!btn.matches('button')) return;
        const taskId = btn.closest('.task-actions').dataset.taskId;
        if (btn.classList.contains('reassign-btn')) openActionModal(taskId, 'reassign');
        if (btn.classList.contains('resolve-btn')) toggleTaskStatus(taskId); 
        if (btn.classList.contains('comment-btn')) openActionModal(taskId, 'comment');
    });

    // Initialize
    state.currentUserId = parseInt(currentUserSelect.value);
    state.currentUserName = currentUserSelect.options[currentUserSelect.selectedIndex].text;
    refreshData();
});