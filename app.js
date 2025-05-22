const express = require("express");
const path = require("path");
const session = require("express-session");
const mongoose = require("mongoose");
const http = require("http"); 
const { Server } = require("socket.io");
const bcrypt = require("bcrypt");

const app = express();
const server = http.createServer(app); 
const io = new Server(server);


mongoose.connect("mongodb+srv://noelpignar:noel.P07@node.ybbxtpc.mongodb.net/test")
    .then(() => console.log("MongoDB connected!"))
    .catch(err => console.error("MongoDB connection error:", err));

app.use(express.urlencoded({ extended: true }));

app.use(
    session
    ({
        secret: "your-secret-key",
        resave: false,
        saveUninitialized: false,
        cookie: { secure: false },
    })
);

const userSchema = new mongoose.Schema
({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
});

const User = mongoose.model("User", userSchema);

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, "views", "nodeIndex.html"));
})

app.get('/Registracija.html', (req, res) => {
    res.sendFile(path.join(__dirname, "views", "Registracija.html"));
})

app.get('/Prijava.html', (req, res) => {
    res.sendFile(path.join(__dirname, "views", "Prijava.html"));
})

app.get('/klepetalnica.html', (req, res) => {
    res.sendFile(path.join(__dirname, "views", "klepetalnica.html"));
})

app.get("/dashboard", (req, res) => 
    {
    if (req.session.user) 
    {
        res.status(200).send("User is logged in");
    } 
    else 
    {
        res.status(401).send("Unauthorized. Please log in.");
    }
});

app.get("/logout", (req, res) => 
{
    req.session.destroy((err) => 
    {
        if (err) 
        {
            console.error("Error during logout:", err);
            return res.status(500).send("Error during logout.");
        }
        res.redirect("/");
    });
});

app.post("/Registracija", async (req, res) => 
{
    const { username, email, password } = req.body;

    try 
    {
        const existingUser = await User.findOne({ $or: [{ username }, { email }] });
        if (existingUser) 
        {
            return res.status(400).send("Username or email is already in use.");
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = new User({
            username: username,
            email: email,
            password: hashedPassword,
        });

        console.log("User data before saving:", user); 
        await user.save();
        console.log("User data saved successfully:", user);
        req.session.user = { username: user.username, email: user.email };
        res.sendFile(path.join(__dirname, "views", "nodeIndex.html"));
    } 
    catch (err)
    {
        console.error("Error saving user data:", err);
        res.status(500).send("Error saving user data:" + err.message);
    }
});

app.post("/Prijava", async (req, res) => 
{
    const { username, password } = req.body;

    try 
    {
        const user = await User.findOne({ username: username });
        console.log("User found:", user); 
        if (user && await bcrypt.compare(password, user.password)) 
        {
            req.session.user = { username: user.username, email: user.email };
            res.sendFile(path.join(__dirname, "views", "nodeIndex.html"));
        } 
        else 
        {
            res.status(401).send("Invalid username or password");
        }
    } 
    catch (err) 
    {
        console.error("Error during login:", err);
        res.status(500).send("Error during login.");
    }
});

io.on("connection", (socket) => {
    console.log("Uporabnik povezan.");

    socket.on("chat message", (msg) => {
        io.emit("chat message", msg);
    });

    socket.on("disconnect", () => {
        console.log("Uporabnik je prekinil povezavo.");
    });
});

server.listen(3000, () => {
    console.log("Server is running on port 3000");
});