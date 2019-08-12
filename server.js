var express = require('express');
var app = express();
var sqlite3 = require('sqlite3');
var db = new sqlite3.Database('codeshare.db'); 
var bodyParser = require('body-parser');
var fs = require('fs');
var upload = require('express-fileupload');
app.use(upload());
var port = 3000;
var passwordHash = require('password-hash');
app.set("view engine", "ejs");
app.set("views", __dirname + "/views");
app.set("view options", { layout: false });
app.use(bodyParser.urlencoded({ extended: true }));
app.listen(port, function () {
    console.log("Listening on port " + port);
});
// Enabling CORS
app.use(function (req, res, next) {

    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});
// Registering new user. Adds to Auth table 
var user;
app.post('/register', function (req, res) {
    console.log("new user " + req.body.username);
    db.all('SELECT * from Auth  where Username=$user',
        {
            $user: req.body.username
        },
        function (err, rows) {
            console.log(rows);
            if (rows.length > 0) {
               console.log("User already exists");
               res.render('login', { loginmsg: "", regmsg: "Username already taken" });
           }
            else {
                db.run('INSERT into Auth (Username,Password) VALUES (?,?)', [req.body.username, passwordHash.generate(req.body.password)], function (err) {
                    if (err)
                        console.log(err.message);
                    else {
                        console.log("User added");
                        fs.mkdir(__dirname+`/upload/${req.body.username}`, { recursive: true }, (err) => {
                            if (err) throw err;
                            else
                                console.log("folder created");
                        });
                        user = req.body.username;
                        // afterlogin(req, res);
                        res.render("app.ejs", { msg: "" ,text:"" });
                    }
                });
           }
        });

});
// Check login data
var check = false;
app.post('/login', function (req, res) {
    db.get('SELECT Password from Auth  where Username=$user',
        {
            $user: req.body.username
        },
        function (err, rows) {
            console.log(rows);
            console.log(req.body.username);
            //  console.log(rows.Password);
            if (passwordHash.verify(req.body.password, rows.Password)) {
                console.log("Login Successful");
                user = req.body.username;
                // afterlogin(req, res);
                res.render("app.ejs", { msg: "", text:"" });
            }

            else {
                console.log("fail");
                res.render('login', { loginmsg: "Incorrect username/password", regmsg: "" });
            }
        });
    console.log(check);
});
// Login page on localhost:3000
app.get('/', function (req, res) {
    res.render('login', { loginmsg: "", regmsg: "" });
});
// Logout
app.get('/logout', function (req, res) {
    res.clearCookie('username');
    res.render('login', { loginmsg: "", regmsg: "" });
});
var filename;
var filedata;
app.post('/upload', function (req, res) {
    
    if (req.files) {
        var file = req.files.filename;
        filename = file.name;
        filedata = file.data;
            res.render("app.ejs", { msg: "File uploaded successfully", text: file.data });   
    }
    
});
var userview = "";
var fls = [];
app.get('/viewuser', function (req, res) {
    fls = [];
    userview = req.query.user;
    db.all('SELECT * from Auth  where Username=$user',
        {
            $user: req.query.user
        },
        function (err, rows) {
            if (rows.length > 0) {
                console.log("User exists");
                db.all('SELECT Filename from Files where Username=$uname', { $uname: req.query.user }, function (err, rows) {
                    if (err)
                        console.log(err.message);
                    else {
                        fls = rows;
                        console.log(fls);
                        console.log(rows);
                        if (fls.length>0)
                            res.render("view.ejs", { files: fls , message:"" });
                        else
                            res.render("view.ejs", { files: [] , message:"No files uploaded yet"});
                    }
                });
            }
            else {
                res.render("view.ejs", { files: [] , message:"Invalid Username" });
            }
        });
});
     

app.get('/view', function (req, res) {
    res.render('view.ejs', { files: [], message:"" });
});
var getid;
app.get('/getfile', function (req, res) {
    getid = req.query.id;
    fs.readFile(__dirname + `/upload/${userview}/${getid}`, function (err, data) {
        res.send(data);
    })
});
var fn="";
app.post('/gettypefile', function (req, res) {
    
    var code = req.body.src;
    if (filename) {
        console.log(datetime);
        fs.writeFile("C:/Users/Anuj/Desktop/ecell/upload/" + user + "/" + filename, code, function (err) {
            if (err)
                console.log(err.message);
            else
                res.render("app.ejs", { msg: "File saved successfully", text: "" });
        });
        db.run('INSERT into Files values (?,?)', [user, filename], function (err) {
            if (err)
                console.log(err.message);
            else
                console.log("file added in db");
        })
    }
    else {
        console.log(datetime);
        var datetime = new Date().getTime();
        console.log(datetime);
        fn = "";
        fn = fn.concat("myfile");
        fn = fn.concat(datetime);
        console.log(fn);
        fs.writeFile("C:/Users/Anuj/Desktop/ecell/upload/" + user + "/myfile"+datetime, code, function (err) {
            if (err)
                console.log(err.message);
            else
                res.render("app.ejs", { msg: "File saved successfully", text: "" });
        });
        db.run('INSERT into Files values (?,?)', [user, fn], function (err) {
            if (err)
                console.log(err.message);
            else
                console.log("file added in db");
        })
    }
})
app.get('/back', function (req, res) {
    res.render("app.ejs", { msg: "", text: "" });
});