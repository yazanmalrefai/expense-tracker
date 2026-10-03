// Expense Tracker - backend (Express API + PostgreSQL)
//
// PHASE 1
// Setup:
//   1. Create a database named expense_tracker and run schema.sql on it.
//   2. Copy .env.example to a new file named .env and write your PostgreSQL password.
//   3. npm install express cors pg dotenv
// Run:    node server.js   (restart it every time you change this file)
//
// Endpoints you need to build:
//   GET    /api/expenses        return all expenses
//   GET    /api/expenses/:id    return one expense (404 if not found)
//   POST   /api/expenses        add an expense (201, or 400 if the data is invalid)
//   PUT    /api/expenses/:id    update an expense (200, 400, or 404)
//   DELETE /api/expenses/:id    delete an expense (200, or 404)
//
// Tips:
//   - Create one Pool (from the "pg" library) with the values from .env,
//     and use pool.query(...) in every route.
//   - ALWAYS send the values as parameters: pool.query("... WHERE id = $1", [id]).
//     NEVER build the SQL text by joining strings with data from the user.
//   - Use RETURNING to get the new (or updated) row back from INSERT and UPDATE.
//   - The database creates the id. The client never sends one.
//   - pg returns NUMERIC as text and DATE as a JavaScript Date, so fix both in your SELECT.
//     Hint: amount::float8 and to_char(date, 'YYYY-MM-DD').
//   - Validate the data before the query, and answer 400 with a message that explains the problem.
//   - Check the id before the query. A text like "abc" makes PostgreSQL throw an error.
//   - Enable CORS so the frontend can talk to the server.
//   - Test every endpoint with Thunder Client BEFORE you connect the frontend.


const path = require("path");
const express = require("express");
const cors = require("cors");
const pg = require("pg");

require("dotenv").config({ path: path.join(__dirname, ".env") });

const pool = new pg.Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: process.env.PGPORT ,
});

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get("/api/expenses", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, title,  amount::float8 AS amount,category, to_char(date, 'YYYY-MM-DD') AS date FROM expenses ORDER BY date DESC"
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Database error:", err.message);
    res.status(500).json({ 
      error: "Internal server error", 
      details: err.message 
    });
  }
});


app.get("/api/expenses/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid expense ID" });
    }
    const result = await pool.query(
      "SELECT id, title,  amount::float8 AS amount,category, to_char(date, 'YYYY-MM-DD') AS date FROM expenses WHERE id = $1",
      [id]
    );

    if(result.rows.length === 0) {
      return res.status(404).json({ error: "Expense not found" });
    }

    res.json(result.rows);
  } catch (err) {
    console.error("Database error:", err.message);
    res.status(500).json({ 
      error: "Internal server error", 
      details: err.message 
    });
  }
});



app.post("/api/expenses" , async (req, res) => {
  try{  
    const title = req.body.title;
    const amount = parseFloat(req.body.amount);
    const category = req.body.category;
    const date = req.body.date;

    let errorMessages = [];
    let valid = true;

    

    if (!title )
       {
        errorMessages.push("Invalid expense title");
        valid = false;
       }
    if (isNaN(amount) || amount <= 0)
      {
        errorMessages.push("Invalid expense amount");
        valid = false;
      }
    if (!category )
      {
        errorMessages.push("Invalid expense category");
        valid = false;
      }
    if (!date || isNaN(Date.parse(date)))
      {
        errorMessages.push("Invalid expense date");
        valid = false;
      }

    if (!valid) {
      return res.status(400).json({ errors: errorMessages });
    }



    const query = `
      INSERT INTO expenses (title, amount, category, date)
      VALUES ($1, $2, $3, $4)
      RETURNING id`;

    const result =  await pool.query(query, [title, amount, category, date]);
    const newExpenseId = result.rows[0].id;

    if (newExpenseId >0 ) {
    res.status(201).json({ id: newExpenseId });
    }
    else
    {
      res.status(500).json({ error: "Failed to create expense" });
    }

  }catch(err){
    
    res.status(500).json({
      error: "Internal server error", 
      details: err.message 
    });
  }
});


  
app.put("/api/expenses/:id", async (req, res) => 
{
  const id = parseInt(req.params.id, 10);

  
    let errorMessages = [];
    let valid = true;

    const title = req.body.title;
    const amount = parseFloat(req.body.amount);
    const category = req.body.category;
    const date = req.body.date;


    if (isNaN(id))
       {
        errorMessages.push("Invalid expense ID");
        valid = false;
      }
    if (!title )
       {
        errorMessages.push("Invalid expense title");
        valid = false;
       }
    if (isNaN(amount) || amount <= 0)
      {
        errorMessages.push("Invalid expense amount");
        valid = false;
      }
    if (!category )
      {
        errorMessages.push("Invalid expense category");
        valid = false;
      }
    if (!date || isNaN(Date.parse(date)))
      {
        errorMessages.push("Invalid expense date");
        valid = false;
      }

    if (!valid)
      {
      return res.status(400).json({ errors: errorMessages });
      }

  try
  { 
    const query  = 'UPDATE expenses SET title = $1, amount = $2, category = $3, date = $4 WHERE id = $5 RETURNING *';
    const valuse = [title,parseFloat(amount),category , date , id];
      
    const resul = await pool.query(query, valuse);

    if (resul.rows.length === 0) {
      return res.status(404).json({ error: "Expense not found" });
    }

     res.status(200).json({ message: "Expense updated successfully" });


  }
  catch(err)
  {
    console.error("Database error:", err.message);
    res.status(500).json({ 
      error: "Internal server error", 
      details: err.message 
    });
  }


})


app.delete('/api/expenses/:id', async (req, res) =>   
  {
    const id  = req.params.id;
    if (isNaN(parseInt(id, 10))) 
    {
      return res.status(400).json({ error: "Invalid expense ID" });
    }

    try
    {
      const query = 'delete from expenses where id = $1 returning *';
      const result = await pool.query(query, [id]);

      if (result.rows.length === 0) { 
        return res.status(404).json({ error: "Expense not found to delete" });
      }

      res.status(200).json({ message: "Expense deleted successfully" });

    }
    catch(err)
    {
      console.error("Database error:", err.message);
      res.status(500).json({ 
        error: "Internal server error", 
        details: err.message 
      });
    } 

  })






app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});


