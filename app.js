const   express                 =                      require('express'),
        path                    =                      require('path'),
        favicon                 =                      require('serve-favicon'),
        logger                  =                      require('morgan'),
        cookieParser            =                      require('cookie-parser'),
        session                 =                      require('express-session'),
        bodyParser              =                      require('body-parser'),
        debug                   =                      require('debug')('app'),
        http                    =                      require('http'),
        config                  =                      require('./global/config.js'),
        app                     =                      express(),
        mainRouter              =                      require("./routes/mainRouter");

let port = normalizePort(process.env.PORT || config.port);
let server = http.createServer(app);

require("body-parser-xml")(bodyParser);

app.set('port', port);

/**
 * Listen on provided port, on all network interfaces.
 */
server.listen(port);

// view engine setup
// app.set('views', path.join(__dirname, 'views'));
// app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.xml({
    limit: "5mb",
    xmlParseOptions: {
        explicitArray: false
    }
}));

app.use(bodyParser.json({
    limit: "5mb"
}));

app.use(bodyParser.urlencoded({
    extended: false,
    limit: "5mb"
}));

app.use(cookieParser());
app.use(session({
    secret: "hbLqpY3aDsIAf3OtTiNzs63p5FbCnU4zEFXIhXmSpyNBWxDZpn0Db3cdxNv3M5l3RR1wENAH8AYPQppbDfLqvgPskg2Zy6bbpELsXm5IGQNa4OYA8mces7W02DDqFEaZ", // 建议使用 128 个字符的随机字符串
    resave: true,
    saveUninitialized: false,
    cookie: {
        maxAge: 60 * 1000 * 60
    }
}));

app.use(express.static(path.join(__dirname, 'files')));

app.use( "/", mainRouter );

app.use("/", express.static(path.join(__dirname, 'public')));

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    let err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handler
app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

server.on( "error", error => {
    let bind = typeof port === "string" ? "Pipe " + port : "Port " + port;
    if( error.syscall !== "listen" ){
        throw error;
    }

    switch( error.code ){
        case "EACCES":
            console.error( bind + " requires elevated privileges" );
            process.exit( 1 );
        break;

        case "EADDRINUSE":
            console.error( bind + " is already in use" );
            process.exit( 1 );
        break;

        default:
            throw error;
    }
});

server.on( "listening", ( ) => {
    let addr = server.address(),
        bind = typeof addr === "string" ? "Pipe " + addr : "Port " + addr.port;

    console.log( "Listening on " + bind );
});

function normalizePort(val) {
    let port = parseInt(val, 10);

    if (isNaN(port)) {
        // named pipe
        return val;
    }

    if (port >= 0) {
        // port number
        return port;
    }

    return false;
}

module.exports = app;