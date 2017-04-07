var express = require('express');
var mongoose = require('mongoose');
var cors = require('cors');
var req_promise = require('request-promise');
var body_parser = require('body-parser');
var multipart = require('connect-multiparty');

var Userinfo = require('./mongodb');
//设置公众号appid,secret，声明授权code码，用户openID，以及access_token
var APPID = 'wxf04aea445ebac25b';
var SECRET = '310ab21f528bdd50412a386a04d41de1';
var CODE, OPENID, ACCESSTOKEN;
//新建一个express服务
var app = express();
//链接数据库
mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost/');
//定义模板引入路径，并定义模板引擎为jade
app.set('views', './view');
app.set('view engine', 'jade');
//定义监听端口为80
app.set('port', process.env.PORT || 80);

//引入跨域请求中间件cors
app.use(cors());
//引入获取request payload数据的multipart中间件
app.use(multipart());
//引入body-parser中间件
app.use(body_parser.urlencoded({
    extended: false
}));
app.use(body_parser.json());


/**
 * 定义路由
 */


//获取授权登录的code码,并调用微信api获取用户基本信息
app.get('/', function(req, res) {
    CODE = req.query.code;
    //生成accesstoken_url的方法
    var make_accesstoken_url = function(appid, code, secret) {
        var rooturl = 'https://api.weixin.qq.com/sns/oauth2/access_token';
        var queryappid = 'appid=' + appid;
        var querycode = 'code=' + code;
        var querysecret = 'secret=' + secret;
        var querygranttype = 'grant_type=authorization_code';
        return rooturl + '?' + queryappid + '&' + querysecret + '&' + querycode + '&' + querygranttype;
    }
    //生成userinfo_url的方法
    var userinfo_url = function(accesstoken, openid) {
        var rooturl = 'https://api.weixin.qq.com/sns/userinfo';
        var queryaccesstoken = 'access_token=' + accesstoken;
        var queryopenid = 'openid=' + openid;
        var querylang = 'lang=zh_CN';
        return rooturl + '?' + queryaccesstoken + '&' + queryopenid + '&' + querylang;
    }
    //调用生成accesstoken_url的方法，调用微信api获取access_token
    var userinfo = {};
    req_promise(make_accesstoken_url(APPID, CODE, SECRET)).then(
        (data) => {
            var obj = JSON.parse(data);
            OPENID = obj.openid;
            ACCESSTOKEN = obj.access_token;
            //调用生成userinfo_url的方法，调用微信api获取用户信息
            return req_promise(userinfo_url(ACCESSTOKEN, OPENID));
        }).then(
        (data) => {
            var obj = JSON.parse(data);
            userinfo = obj
            Userinfo.findOne({
                openid: OPENID
            }, function(err, msg) {
                if (err) {
                    res.send(err);
                    return console.err(err);
                }
                if (!msg) {
                    var user = new Userinfo({
                        openid: userinfo.openid,
                        nickname: userinfo.nickname,
                        sex: userinfo.sex,
                        province: userinfo.province,
                        city: userinfo.city,
                        country: userinfo.country,
                        headimgurl: userinfo.headimgurl,
                        privilege: userinfo.privilege,
                        unionid: userinfo.unionid
                    });

                    user.save(function(err, user) {
                        if (err) return console.log(err, '错误信息');
                    });
                }
                res.render('welecome');
            })
        });
});
//获取基本信息页
app.get('/baseinfo', function(req, res) {
    Userinfo.findOne({
        openid: OPENID
    }, function(err, msg) {
        if (err) return console.err(err);

        res.render('baseinfo', {
            headimgurl: msg.headimgurl,
            nickname: msg.nickname,
            sex: (msg.sex == 1 ? '男' : '女')
        });
    });
})

//获取详细信息页
app.get('/detailinfo', function(req, res) {
    Userinfo.findOne({
        openid: OPENID
    }, function(err, msg) {
        if (err) return console.err(err);

        res.render('detailinfo', {
            nickname: msg.nickname,
            sex: (msg.sex == 1 ? '男' : '女'),
            headimgurl: msg.headimgurl,
            OPENID: msg.openid,
            country: msg.country,
            province: msg.province,
            city: msg.city
        });
    });
})

//启动服务，开始监听端口
app.listen(app.get('port'), function() {
    console.log('服务已启动，请通过 http://localhost:' + app.get('port') + '访问。')
});
