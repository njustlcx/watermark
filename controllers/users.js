/**
 * Created by as on 2017/5/5.
 */
const Sequelize = require('sequelize');
const config = require('../config');

var sequelize = new Sequelize(config.database, config.username, config.password, {
    host:config.host,
    dialect: 'mysql',
    pool: {
        max: 5,
        min: 0,
        idle: 30000
    }
});

module.exports = {
    'POST /signin': async (ctx, next) => {
        let username = ctx.request.body.username;
        let password = ctx.request.body.password;
        let gender = ctx.request.body.gender;
        let tel = ctx.request.body.tel;
        let birthday = ctx.request.body.birthday;
        let User = sequelize.define('users', {
            username: {
                type: Sequelize.STRING(50),
                primaryKey: true
            },
            password: Sequelize.STRING(50),
            gender: Sequelize.STRING(50),
            tel: Sequelize.STRING(11),
            birthday: Sequelize.DATE
        }, {
            timestamps: false
        });

        let user = await User.create({
            username: username,
            password: password,
            gender: gender,
            tel: tel,
            birthday: birthday
        });
        console.log(JSON.stringify(user, null, 4));
        ctx.response.type = 'application/json';
        ctx.response.body = JSON.stringify(user, null, 4);
    }
};