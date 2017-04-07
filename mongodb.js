var mongoose = require('mongoose');
//建立用户信息模型
var userinfoSchema = new mongoose.Schema({
    openid: String,
    nickname: String,
    sex: Number,
    province: String,
    city: String,
    country: String,
    headimgurl: String,
    privilege: Object,
    unionid: String
})
var Userinfo = mongoose.model('userinfo', userinfoSchema);

module.exports = Userinfo;
