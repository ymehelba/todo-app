# TODO App and Task Tracker

A full-stack TODO application built with **Flask** (Python) and **JavaScript**. This project was developed to provide teams with a transparent way to manage daily tasks individually or collaboratively.

## Core Features

* **Feature 1: Add New Task** – Create tasks with mandatory titles and automatic creation timestamps.
* **Feature 2: View All Tasks** – A task dashboard displaying titles, creation dates, and statuses fetched from the backend.
* **Feature 3: Complete/Incomplete Toggle** – Quick-access toggles on every card with visual strikethrough and color distinction for completed items.
* **Feature 4: Task Deletion** – Permanent removal of tasks with a secure confirmation modal.
* **Feature 5: Status Filtering** – Filter views by **All**, **Pending**, or **Completed** with clear visual indicators of the active filter.

## Extended Features Added

To enhance the user experience beyond the core requirements, I implemented the following:

* **Audit Trail/History**: Every task tracks status changes, reassignments, and comments with a History record.
* **Task Comments**: Users can leave specific notes and feedback on tasks.
* **Team Assignment**: Integrated a mock user system to assign tasks to specific team members.

## Stack

* **Backend**: Flask (Python)
* **Frontend**: JavaScript, HTML, CSS
* **API**: RESTful JSON API

## Installation & Setup

Clone the repository:
   git clone [https://github.com/ymehelba/todo-app.git](https://github.com/ymehelba/todo-app.git)
   cd todo-task-tracker
   
Install dependencies:
pip install -r requirements.txt

Run the application:
python app.py

Access:
Open http://localhost:5000 in your browser.


Project Structure

app.py - Flask server and REST API endpoints.

index.html - Main application structure and dashboard views.

app.js - Frontend state management and DOM manipulation.

style.css - Custom UI styling and visual indicators.
