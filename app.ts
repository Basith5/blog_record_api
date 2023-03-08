import express, { Request, Response } from "express";
import bodyParser from "body-parser";
import mysql, { OkPacket } from "mysql2/promise";
import { z } from "zod";

const app = express();

// Parse request body as JSON
app.use(bodyParser.json());

// MySQL connection pool
const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  database: "projects",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Schema for validating request body
const schema = z.object({
  record_key: z.string(),
  record_value: z.string(),
});

// Add a new record to the "record" table
app.post("/addRecord", async (req: Request, res: Response) => {
  try {
    // Validate request body using the schema
    const { record_key, record_value } = schema.parse(req.body);

    // Insert data into MySQL database
    const [result] = await pool.query(
      "INSERT INTO record (record_key, record_value, created_on) VALUES (?, ?, NOW())",
      [record_key, record_value]
    );
    res.status(201).json({id: (result as OkPacket).insertId,message: "Record created successfully",});
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

// Read all Records
//-----------------------------------------------------------------------------------------
app.get('/readRecord', async (req: Request, res: Response) => {
    try {
      // Fetch data from MySQL database
      const [rows] = await pool.query('SELECT * FROM record');
  
      res.status(200).json(rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Something went wrong' });
    }
});

//single Record
//-----------------------------------------------------------------------------------------
app.get('/readRecord/:id', async (req, res) => {
    const id = req.params.id;
    try {
      const [rows] = await pool.execute('SELECT * FROM record WHERE id = ?', [id]);
      if (Array.isArray(rows) && rows.length > 0) {
        res.json(rows[0]);
      } else {
        res.status(404).send('Record not found');
      }
    } catch (error) {
      console.error('Error:', error);
      res.status(500).send('Error retrieving Record ');
    }
});

// Update a Record
//-----------------------------------------------------------------------------------------
app.put('/updateRecord/:id', async (req: Request, res: Response) => {
    try {
      const id = req.params.id;
      const { record_key, record_value } = schema.parse(req.body);
  
      // Update  updated_on columns
      const [result] = await pool.query(
        'UPDATE record SET record_key = ?,record_value = ?,updated_on = NOW() WHERE id = ?',
        [record_key,record_value ,id]
      );
  
      if ((result as any).affectedRows === 0) {
        // If no rows were affected, return a 404 status code
        res.status(404).json({ error: 'Record not found' });
      } else {
        // Otherwise, return a success message
        res.status(200).json({ message: 'Record updated successfully' });
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Something went wrong' });
    }
});

// Delete a record
//-----------------------------------------------------------------------------------------
app.delete('/deleteRecord/:id', async (req: Request, res: Response) => {
    try {
      const id = req.params.id;
  
      // Query the database to delete the Record with the specified ID
      const [result] = await pool.query('DELETE FROM record WHERE id = ?', [id]);
  
      if ((result as any).affectedRows === 0) {
        // If no record was deleted with the specified ID, return a 404 status code
        res.status(404).json({ error: 'Record not found' });
      } else {
        // Otherwise, return a success message
        res.status(200).json({ message: 'Record deleted successfully' });
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Something went wrong' });
    }
  });

// Start the server
//-----------------------------------------------------------------------------------------
app.listen(5000, () => {
  console.log("Server started on port 5000");
});
