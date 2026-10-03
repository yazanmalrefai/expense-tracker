const API_URL = "http://localhost:3000/api/expenses";

let Expenses = [];
let editingId = null;
let expenseChart;

async function getExpenses() {
    try {

        const response = await fetch(API_URL);

        if (!response.ok) {
            throw new Error(`HTTP error: ${response.status}`);
        }

        return await response.json();
    }
    catch (error) {
        throw new Error(`Error fetching expenses: ${error.message}`);
    }
}

async function addExpense(data) {
    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error);
        }

        return result;
    }
    catch (error) {
        throw new Error(`Error adding expense: ${error.message}`);
    }
}

async function updateExpense(id, data) {
    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error);
        }

        return result;
    }
    catch (error) {
        throw new Error(`Error updating expense: ${error.message}`);
    }
}

async function deleteExpense(id) {
    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: "DELETE"
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error);
        }

        return result;
    }
    catch (error) {
        throw new Error(`Error deleting expense: ${error.message}`);
    }
}

function renderTable(list) {
    const tbody = document.getElementById("tbExpenses");

    tbody.innerHTML = "";

    list.forEach(expense => {
        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${expense.title}</td>
            <td>${expense.amount}</td>
            <td>${expense.category}</td>
            <td>${expense.date}</td>
            <td>
                <button 
                    class="btn btn-warning btn-sm"
                    onclick="editExpense(${expense.id})">
                    Edit
                </button>

                <button 
                    class="btn btn-danger btn-sm"
                    onclick="removeExpense(${expense.id})">
                    Delete
                </button>
            </td>
        `;

        tbody.appendChild(row);
    });
}

function renderSummary(list) {
    const totalAmountCard = document.getElementById("totalAmount");
    const numberOfExpensesCard = document.getElementById("numberOfExpenses");
    const highestExpenseCard = document.getElementById("highestExpense");
    const highestExpenseTitleCard = document.getElementById("highestExpenseTitle");

    numberOfExpensesCard.textContent = list.length;

    const totalAmount = list.reduce(
        (sum, expense) => sum + Number(expense.amount),
        0
    );

    const highestExpense = list.length > 0
    ? list.reduce((highest, expense) =>
        Number(expense.amount) > Number(highest.amount)
            ? expense
            : highest
      )
    : null;


    
    totalAmountCard.textContent = totalAmount.toFixed(2);
    highestExpenseCard.textContent = highestExpense.amount.toFixed(2);
    highestExpenseTitleCard.textContent=highestExpense.title;

}

function editExpense(id) {
    const expense = Expenses.find(expense => expense.id === id);

    if (!expense) {
        alert("Expense not found");
        return;
    }

    editingId = id;

    document.getElementById("idTitle").value = expense.title;
    document.getElementById("inputAmount").value = expense.amount;
    document.getElementById("inputCategory").value = expense.category;
    document.getElementById("inputDate").value = expense.date;

    document.getElementById("btnAddSave").textContent = "Save";
}

async function removeExpense(id) {
    try {
        await deleteExpense(id);
        await refresh();
    }
    catch (error) {
        alert(error.message);
    }
}

async function handleSubmit(event) {
    event.preventDefault();

    const data = {
        title: document.getElementById("idTitle").value,
        amount: Number(document.getElementById("inputAmount").value),
        category: document.getElementById("inputCategory").value,
        date: document.getElementById("inputDate").value
    };

    try {
        if (editingId !== null) {
            await updateExpense(editingId, data);
            editingId = null;
        }
        else {
            await addExpense(data);
        }

        clearingBoxes();
        await refresh();
    }
    catch (error) {
        alert(error.message);
    }
}

function clearingBoxes() {
    document.getElementById("idTitle").value = "";
    document.getElementById("inputAmount").value = "";
    document.getElementById("inputCategory").value = "";
    document.getElementById("inputDate").value = "";
    document.getElementById("btnAddSave").textContent = "Add Expense";
}




function renderChart(list) {
    const ctx = document.getElementById("myChart");

    const xValues = list.map(expense => expense.date).reverse();
    const yValues = list.map(expense => Number(expense.amount)).reverse();

    if (expenseChart) {
        expenseChart.destroy();
    }

    expenseChart = new Chart("myChart", {
        type: "line",
        data: {
            labels: xValues,
            datasets: [{
                label: "Expenses",  
                fill: false,
                tension: 0,
                borderWidth: 2,
                data: yValues
            }]
        },
        options: {
            plugins: {
                legend: {
                    display: true
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: "Date"

                    }

                },
                y: {
                    beginAtZero: true,

                    title: {
                        display: true,
                        text: "Amount"
                    },

                    ticks: {
                        stepSize: 2
                    }
                }
            }
        }
    });
}

async function refresh() {

    const spinner = document.getElementById("loadingSpinner");
    try {
    

        const expenses = await getExpenses();

        
        spinner.classList.remove("d-none");

        Expenses = expenses;

        renderSummary(expenses);
        renderTable(expenses);
        renderChart(expenses);
       
    }
    catch (error) {
        alert(error.message);
    }
    finally
    {
         spinner.classList.add("d-none");
    }
}


document.getElementById("expenseForm").addEventListener("submit", handleSubmit);

const downloadButton = document.getElementById("btnDownload");
downloadButton.addEventListener("click", () => {

    const table = document.getElementById("idExpenses");

    let csv = [];

    const rows = table.querySelectorAll("tr");

    rows.forEach(row => {

        const columns = row.querySelectorAll("th, td");

        const rowData = [];

        for (let i = 0; i < columns.length - 1; i++) {

            rowData.push(
                `"${columns[i].textContent.trim()}"`
            );

        }

        csv.push(rowData.join(","));
    });

    const csvFile = new Blob(
        [csv.join("\n")],
        { type: "text/csv;charset=utf-8;" }
    );

    const link = document.createElement("a");

    link.href = URL.createObjectURL(csvFile);
    link.download = "expenses.csv";

    link.click();

    URL.revokeObjectURL(link.href);
});


refresh();