const form = document.getElementById("todo-form");
const input = document.getElementById("todo-input");
const dateInput = document.getElementById("todo-date");
const list = document.getElementById("todo-list");
const messageBox = document.getElementById("message");
const sortBtn = document.getElementById("sort-btn");
const deleteAllBtn = document.getElementById("delete-all-btn");
const userCardsContainer = document.getElementById("user-cards");
const API_URL = 'https://todo-api-n3ds.onrender.com/todos/';
// const API_URL = 'http://localhost:8000/todos/';

let todos = [];

function loadTodos() {
  fetch(API_URL)
    .then(res => res.json())
    .then(data => {
      todos = data;
      renderTodos();
    })
    .catch(err => {
      showMessage("Failed to load todos.", "error");
      console.error("GET /todos/ failed:", err);
    });
}

loadTodos();

let isSortedAsc = true;

form.addEventListener("submit", function (e) {
  e.preventDefault();

  const text = input.value.trim();
  const date = dateInput.value;

  if (!text || !date) {
    showMessage("Please enter both a to-do and a date.", "error");
    return;
  }

  const newTodo = { text, date };

  fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(newTodo)
  })
    .then(res => {
      if (!res.ok) throw new Error("Failed to add to-do");
      return res.json();
    })
    .then(addedTodo => {
      showMessage("To-do added ✅", "success");
      form.reset();
      loadTodos(); // ⬅️ refresh the list from backend
    })
    .catch(err => {
      console.error("POST /todos/ failed:", err);
      showMessage("Error adding to-do", "error");
    });
});

function renderTodos() {
  // Clear the current list
  list.innerHTML = "";

  // Iterate through all todos and create DOM elements for each
  todos.forEach(todo => {
    // Create the list item
    const li = document.createElement("li");

    // ---------- CHECKBOX ----------
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "todo-checkbox";
    checkbox.checked = todo.completed; // Reflect backend status
    // When checkbox changes, update backend and UI
    checkbox.addEventListener("change", () => {
      toggleCompleted(todo.id, checkbox.checked);
    });

    // ---------- TODO TEXT ----------
    const span = document.createElement("span");
    span.className = "todo-text";
    span.textContent = todo.text;

    // ---------- DATE ----------
    const date = document.createElement("span");
    date.className = "todo-date";
    date.textContent = todo.date;

    // ---------- ACTION BUTTONS ----------
    const actions = document.createElement("div");
    actions.className = "todo-actions";

    const editBtn = document.createElement("button");
    editBtn.textContent = "Edit";
    editBtn.classList.add("edit");
    editBtn.onclick = () => editTodo(todo.id); // edit function elsewhere

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Delete";
    deleteBtn.classList.add("delete");
    deleteBtn.onclick = () => deleteTodo(todo.id); // delete function elsewhere

    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);

    // ---------- STRIKETHROUGH LOGIC ----------
    if (todo.completed) {
      span.classList.add("completed");  // strike through the text
    } else {
      span.classList.remove("completed");
    }

    // ---------- APPEND ALL TO li ----------
    li.appendChild(checkbox);
    li.appendChild(span);
    li.appendChild(date);
    li.appendChild(actions);

    // Append the list item to the UL
    list.appendChild(li);
  });
}


async function toggleCompleted(id, isCompleted) {
  try {
    // Find the current todo's text and date
    const currentTodo = todos.find(todo => todo.id === id);

    // Prepare updated payload with completed status and required fields
    const updatedTodo = {
      text: currentTodo.text,
      date: currentTodo.date,
      completed: isCompleted
    };

    // Send PUT request to update the todo on backend
    const res = await fetch(`${API_URL}${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(updatedTodo)
    });

    if (!res.ok) throw new Error("Failed to update todo");

    const data = await res.json();

    // Update local todos array to reflect backend state
    todos = todos.map(todo => (todo.id === id ? data : todo));

    // Re-render the list to update checkbox + strikethrough
    renderTodos();
  } catch (err) {
    console.error("PUT /todos/{id} failed:", err);
    showMessage("Failed to update todo status", "error");
  }
}

// function editTodo(id) {
//   const todo = todos.find(t => t.id === id);
//   const newText = prompt("Edit the to-do:", todo.text);
//   const newDate = prompt("Edit the date:", todo.date);

//   if (!newText || !newDate) {
//     showMessage("Edit canceled or invalid input.", "error");
//     return;
//   }

//   todo.text = newText.trim();
//   todo.date = newDate;
//   saveTodos();
//   renderTodos();
//   showMessage("To-do updated ✏️", "success");
// }

async function editTodo(id) {
  const todo = todos.find(t => t.id === id);

  // Prompt the user to edit the text
  const newText = prompt("Edit the to-do:", todo.text);
  if (!newText) {
    showMessage("Text edit canceled or invalid.", "error");
    return;
  }

  // Prompt to edit the date
  const newDate = prompt("Edit the date (YYYY-MM-DD):", todo.date);
  if (!newDate) {
    showMessage("Date edit canceled or invalid.", "error");
    return;
  }

  // Prompt to edit completed status (true/false)
  const newCompletedInput = prompt("Is it completed? (yes/no)", todo.completed ? "yes" : "no");
  if (!newCompletedInput) {
    showMessage("Completed status edit canceled or invalid.", "error");
    return;
  }

  const newCompleted = newCompletedInput.trim().toLowerCase() === "yes";

  // Construct the updated to-do object
  const updatedTodo = {
    text: newText.trim(),
    date: newDate,
    completed: newCompleted
  };

  try {
    const res = await fetch(`${API_URL}${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(updatedTodo)
    });

    if (!res.ok) throw new Error("Failed to update to-do");

    const data = await res.json();

    showMessage("To-do updated ✏️", "success");
    loadTodos(); // Refresh the list with updated values
  } catch (err) {
    console.error("PUT /todos/{id} failed:", err);
    showMessage("Error updating to-do", "error");
  }
}


// function deleteTodo(id) {
//   todos = todos.filter(t => t.id !== id);
//   saveTodos();
//   renderTodos();
//   showMessage("To-do deleted 🗑️", "success");
// }

async function deleteTodo(id) {
  try {
    const res = await fetch(`${API_URL}${id}`, {
      method: "DELETE"
    });

    if (!res.ok) throw new Error("Failed to delete");

    showMessage("To-do deleted 🗑️", "success");
    loadTodos(); // Reload updated list from backend
  } catch (err) {
    console.error("DELETE failed:", err);
    showMessage("Error deleting to-do", "error");
  }
}


sortBtn.addEventListener("click", () => {
  todos.sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    return isSortedAsc ? dateA - dateB : dateB - dateA;
  });
  isSortedAsc = !isSortedAsc;
  renderTodos();
  showMessage(`Sorted ${isSortedAsc ? "ascending" : "descending"} 📅`);
});

deleteAllBtn.addEventListener("click", () => {
  if (todos.length === 0) {
    showMessage("No to-dos to delete.", "error");
    return;
  }
  if (!confirm("Are you sure you want to delete all to-dos?")) {
    return;
  }
  // todos = [];
  // saveTodos();
  // renderTodos();
  // showMessage("All to-dos deleted 🧹", "success");
  // 🔽 REPLACE THIS WITH BACKEND CALL
  deleteAllTodos(); // new function we'll define next
});

async function deleteAllTodos() {
  try {
    const res = await fetch(`${API_URL}all`, {
      method: "DELETE"
    });

    if (!res.ok) throw new Error("Failed to delete all");

    const result = await res.json();
    showMessage(`Deleted ${result.deleted_count} to-dos 🧹`, "success");
    loadTodos();
  } catch (err) {
    console.error("DELETE /todos/all failed:", err);
    showMessage("Failed to delete all to-dos", "error");
  }
}

function fetchUsers() {
  fetch("https://dummyjson.com/users?limit=10")
    .then(res => res.json())
    .then(data => {
      const users = data.users;

      users.forEach(user => {
        const card = document.createElement("div");
        card.className = "card";

        const img = document.createElement("img");
        img.src = user.image;
        img.alt = `${user.firstName} ${user.lastName}`;

        const name = document.createElement("h4");
        name.textContent = `${user.firstName} ${user.lastName}`;

        const email = document.createElement("p");
        email.textContent = user.email;

        card.appendChild(img);
        card.appendChild(name);
        card.appendChild(email);

        userCardsContainer.appendChild(card);
      });
    })
    .catch(err => {
      showMessage("Failed to load users.", "error");
      console.error("Error fetching users:", err);
    });
}


function showMessage(msg, type = "success") {
  messageBox.textContent = msg;
  messageBox.style.color = type === "error" ? "red" : "green";
  setTimeout(() => {
    messageBox.textContent = "";
  }, 3000);
}
// This function is not needed anymore since we are fetching from backend

// function saveTodos() {
//   localStorage.setItem("todos", JSON.stringify(todos));
// }

fetchUsers();

