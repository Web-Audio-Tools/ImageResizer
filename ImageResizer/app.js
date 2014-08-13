
/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
var http = require('http');
var path = require('path');
var easyimg = require('easyimage');
var temp = require('temp');
var S = require('string');
var async = require('async');

var archiver = require('archiver');

var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser({ uploadDir: './upload' }));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(app.router);
app.use(require('stylus').middleware(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));

var sizes = [
    { name: "Icon.png", width: 57, height: 57 },
    { name: "Icon@2x.png", width: 114, height: 114 },
    { name: "Icon-60@2x.png", width: 120, height: 120 },
    { name: "Icon-72.png", width: 72, height: 72 },
    { name: "Icon-72@2x.png", width: 144, height: 144 },
    { name: "Icon-76.png", width: 76, height: 76 },
    { name: "Icon-76@2x.png", width: 152, height: 152 },
    { name: "Icon-Small.png", width: 29, height: 29 },
    { name: "Icon-Small@2x.png", width: 58, height: 58 },
    { name: "Icon-Small-40.png", width: 40, height: 40 },
    { name: "Icon-Small-40@2x.png", width: 80, height: 80 },
    { name: "Icon-Small-50.png", width: 50, height: 50 },
    { name: "Icon-Small-50@2x.png", width: 100, height: 100 },
    { name: "iTunesArtwork", width: 512, height: 512 },
    { name: "iTunesArtwork@2x", width: 1024, height: 1024 }
];

// development only
if ('development' == app.get('env'))
{
    app.use(express.errorHandler());
}

app.get('/', routes.index);

function processArray(items, process, callback) {
    var todo = items.concat();
    
    setTimeout(function () {
        process(todo.shift());
        if (todo.length > 0)
        {
            setTimeout(arguments.callee, 25);
        }
        else
        {
            callback();
        }
    }, 25);
}

app.post('/upload', function(req, res)
{
    var extension = path.extname(req.files.image.path);

    var dirName = S(req.files.image.path).replace(extension, "").replace("upload\\", "").s;

    temp.mkdir(dirName, function(err, dirPath)
    {
        var archive = archiver('zip');
        var header = {
            "Content-Type": "application/x-zip",
            "Pragma": "public",
            "Expires": "0",
            "Cache-Control": "private, must-revalidate, post-check=0, pre-check=0",
            "Content-disposition": 'attachment; filename="ios.zip"',
            "Transfer-Encoding": "chunked",
            "Content-Transfer-Encoding": "binary"
        };
        
        res.writeHead(200, header);
        archive.store = true;  // don't compress the archive
        archive.pipe(res);
        
        archive.on('error', function (err) {
            throw err;
        });
        
        archive.on('finish', function (err) {
            return res.end();
        });
        
        async.each(sizes, function (size, callback)
        {
            var thumbName = path.join(dirPath, size.name);

            if (path.extname(thumbName) != ".png")
                thumbName += ".png";

            easyimg.convert({ src: req.files.image.path, dst: thumbName, quality: 10 },
                function()
                {
                    easyimg.resize({ src: thumbName, dst: thumbName, width: size.width, height: size.height },
                        function()
                        {
                            archive.file(thumbName, { name: size.name });
                            callback();
                        });
                });
        }, function(err)
        {
            archive.finalize();
        });
    });
});

http.createServer(app).listen(app.get('port'), function()
{
    console.log('Express server listening on port ' + app.get('port'));
});
