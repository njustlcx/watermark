/**
 * Created by as on 2017/5/6.
 */
let fs = require('fs');
module.exports = {
    'POST /figure': async (ctx, next) => {
        let mu = parseInt(ctx.request.body.mu, 10);
        let sigma = parseInt(ctx.request.body.sigma, 10);
        let num = parseInt(ctx.request.body.num, 10);
        let N = function (mu, sigma, x) {
            return 10000000 / (Math.sqrt(2 * Math.PI) * sigma) * Math.exp(-(x - mu) * (x - mu) / (2 * sigma * sigma));
        };
        var fx = [], x = [], T = 1000, fx2 = [], x3 = [];
        for (var i = 0; i < 1000; i++) {
            fx2[i] = 0;
        }
        var x1 = mu - 3 * sigma, x2 = mu + 3 * sigma;
        for (var i = 0; i < 1000; i++) {
            x3.push(i);
        }
        for (var i = x1; i <= x2; i += Math.round(6 * sigma / num)) {
            x.push(i);
            var temp = i + Math.random() * i / 50000 - i / 100000;
            fx.push(N(mu, sigma, temp));
            fx2[Math.round(temp) % T]++;
        }
        let data = {};
        data.x = x;
        data.fx = fx;
        data.x3 = x3;
        data.fx2 = fx2;
        ctx.response.type = 'application/json';
        ctx.response.body = JSON.stringify(data, null, 4);
    },

    'POST /ISBW': async (ctx, next) => {
        // 生成水印编码
        let waterMark = [];
        for (let i = 0; i < 32; i++) {
            let temp = Math.round(Math.random());
            if (temp === 0)
                temp = -1;
            waterMark.push(temp);
        }
        let o = 10000, T = parseInt(ctx.request.body.T, 10), l = 32, r = parseInt(ctx.request.body.r, 10);
        // interval[i]: 第i个时隙开始的时间
        let interval = [10000];
        let n = l * r;
        for (var i = 1; i < 2 * n; i++) {
            interval[i] = interval[i - 1] + T;
        }

        console.log(interval.length);

        let A = [], B = [];

        // 随机函数，从0到2n-1中随机选出n个不同的数
        function groupA(n) {
            var A = [];
            for (var i = 0; i < 2 * n; i++) {
                A.push(i);
            }
            A.sort(
                function () {
                    return 0.5 - Math.random();
                }
            );
            A.length = n;
            return A;
        }

        A = groupA(n);
        for (var i = 0; i < 2 * n; i++) {
            var flag = 0;
            for (let j = 0; j < n; j++) {
                if (i === A[j]) {
                    flag = 1;
                    break;
                }
            }
            if (flag === 0) {
                B.push(i);
            }
        }

        console.log(B.length === A.length);
        // 判断是否有重复
        function f(arr) {
            for (var i = 0; i < arr.length; i++) {
                for (var j = i + 1; j < arr.length; j++) {
                    if (arr[i] === arr[j]) {
                        return false;
                    }
                }
            }
            return true;
        }

        console.log(f(A) + ' ' + f(B) + ' ' + f(A.concat(B)));
        var flag = 1;
        for (var i in A) {
            for (var j in B) {
                if (A[i] === B[j]) {
                    flag = 0;
                    break;
                }
            }
            if (flag === 0)
                break;
        }
        console.log(flag);
        console.log(A.length === l * r);

        // 获取数据包
        // 数据包数量以及数据包对象组成的数组
        let pNum = T * r * 2 * l * 0.03, A1 = [], B1 = [];
        for (var i = 0; i < pNum; i++) {
            let temp = {};
            // 数据包的绝对时间戳
            temp.t1 = Math.round(Math.random() * 2 * n * T) + o;
            // 计算数据包的所属时隙
            for (var j = 0; j < interval.length - 1; j++) {
                if (temp.t1 >= interval[j] && temp.t1 < interval[j + 1]) {
                    temp.index = j;
                    break;
                }
            }
            // 判断数据包的分组
            temp.group = 'B';
            for (var j in A) {
                if (temp.index === A[j]) {
                    temp.group = 'A';
                    break;
                }
            }
            if (temp.group === 'A') {
                A1.push(temp);
            } else {
                B1.push(temp);
            }
        }
        var x = [], fx = [];
        for (var i = 0; i < T; i++) {
            x[i] = i;
            fx[i] = 0;
        }
        let pkg = A1.concat(B1);
        for (var i in pkg) {
            fx[(pkg[i].t1 - o) % T]++;
        }
        let data = {
            x: x,
            fx: fx
        };
        let sum = 0;
        for (let i = 0; i < T; i++) {
            sum += x[i] * fx[i];
        }
        console.log(sum / pNum);

        // 计算时隙i的时隙质心
        /**
         * @param index 要计算的时隙质心对应时隙的编号
         * @param group 时隙分组
         * @param T 时隙长度
         * @returns {number}
         */
        function cent(index, group, T) {
            // 找出该时隙内的所有数据包
            let sum = 0, cnt = 0;
            for (i in group) {
                if (group[i].index === index) {
                    sum += group[i].t1;
                    cnt++;
                }
            }
            if (cnt === 0) {
                return T / 2;
            }
            return sum / cnt;
        }

        // 求Ai的时隙质心
        let A2 = [], B2 = [];
        for (let i = 0; i < A.length;) {
            // 求得每个Ai和Bi的时隙编号
            let j, temp1 = [], temp2 = [];
            for (j = i; j < i + r; j++) {
                temp1.push(A[j]);
                temp2.push(B[j]);
            }
            A2.push(temp1);
            B2.push(temp2);
            i = j;
        }
        // console.log(A2);
        // console.log(B2);
        // console.log(A2[0].length);
        // 求出各时隙对应的数据包
        let GroupA = [], GroupB = [];

        function group2(A2, A1) {
            let GroupA = [];
            for (let i in A2) {
                let t = [];
                for (let j in A2[i]) {
                    let t1 = {id: A2[i][j], pkg: [], num: 0};
                    for (let k in A1) {
                        if (A2[i][j] === A1[k].index) {
                            t1.pkg.push(A1[k]);
                        }
                    }
                    t1.num = t1.pkg.length;
                    t.push(t1);
                }
                GroupA.push(t);
            }
            return GroupA;
        }

        GroupA = group2(A2, A1);
        GroupB = group2(B2, B1);
        data.groupA = GroupA;
        data.groupB = GroupB;

        // 水印编码，求时隙质心
        function Cent(GroupA) {
            let centA = [];
            for (let i in GroupA) {
                let sum = 0, cnt = 0;
                for (let j in GroupA[i]) {
                    let sum2 = 0;
                    let obj = GroupA[i][j];
                    for (let k in obj.pkg) {
                        sum2 += (obj.pkg[k].t1 - o) % T;
                        obj.pkg[k].deltaT = (obj.pkg[k].t1 - o) % T;
                    }
                    cnt += obj.num;
                    sum += sum2;
                }
                sum /= cnt;
                centA.push(sum);
            }
            return centA;
        }

        let centA = Cent(GroupA);
        let centB = Cent(GroupB);
        console.log(centA);
        console.log(centB);
        let Y = [];
        for (let i in centA) {
            Y.push(centA[i] - centB[i]);
        }
        console.log(Y);
        let s = 0;
        for (let i in Y) {
            s += Y[i];
        }
        console.log(s / 32);
        // 进行延时处理
// 延时函数
        function myDelay(group, index, a) {
            for (let j in group[index]) {
                let obj = group[index][j];
                for (let k in obj.pkg) {
                    obj.pkg[k].deltaT = a + (T - a) * obj.pkg[k].deltaT / T;
                }
            }
        }

// 求出延时后的时隙质心
        function Cent2(GroupA) {
            let centA = [];
            for (let i in GroupA) {
                let sum = 0, cnt = 0;
                for (let j in GroupA[i]) {
                    let sum2 = 0;
                    let obj = GroupA[i][j];
                    for (let k in obj.pkg) {
                        // sum2 += (obj.pkg[k].t1 - o) % T;
                        // obj.pkg[k].deltaT = (obj.pkg[k].t1 - o) % T;
                        sum2 += obj.pkg[k].deltaT;
                    }
                    cnt += obj.num;
                    sum += sum2;
                }
                sum /= cnt;
                centA.push(sum);
            }
            return centA;
        }

        let a = parseInt(ctx.request.body.a, 10);
        for (let i in waterMark) {
            // 如果要嵌入的水印编码是1，那么对时隙组Ai进行时延
            if (waterMark[i] === 1) {
                myDelay(GroupA, i, a);
            } else if (waterMark[i] === -1) {
                myDelay(GroupB, i, a);
            }
        }

        let centA1 = Cent2(GroupA);
        let centB1 = Cent2(GroupB);
        let Y1 = [], waterMark2 = [];
        for (let i in centA1) {
            Y1.push(centA1[i] - centB1[i]);
            if (centA1[i] - centB1[i] < 0) {
                waterMark2.push(-1);
            } else {
                waterMark2.push(1);
            }
        }
        console.log(waterMark.length + ' ' + waterMark2.length);
        console.log(JSON.stringify(waterMark));
        console.log(JSON.stringify(waterMark2));
        let ans = 0;
        for (let i in waterMark2) {
            if (waterMark2[i] != waterMark[i]) {
                ans++;
            }
        }
        console.log(ans);
        ctx.response.type = 'application/json';
        ctx.response.body = JSON.stringify(data, null, 4);
        await next();
    },

    'POST /ISBW2': async (ctx, next) => {

        let R = [1, 2, 3, 4, 5, 6, 7, 8, 9];
        let result = [];
        let result1 = [0, 0, 0, 0, 0, 0];
        let tot = 100;
        while (tot--) {
            // 生成水印编码
            let waterMark = [];
            for (let i = 0; i < 32; i++) {
                let temp = Math.round(Math.random());
                if (temp === 0)
                    temp = -1;
                waterMark.push(temp);
            }
            let o = 10000, T = parseInt(ctx.request.body.T, 10), l = 32,
                r = parseInt(ctx.request.body.r, 10), a = parseInt(ctx.request.body.a, 10);;
            // interval[i]: 第i个时隙开始的时间
            let interval = [10000];
            let n = l * r;
            for (var i = 1; i < 2 * n; i++) {
                interval[i] = interval[i - 1] + T;
            }

            let A = [], B = [];

            // 随机函数，从0到2n-1中随机选出n个不同的数
            function groupA(n) {
                var A = [];
                for (var i = 0; i < 2 * n; i++) {
                    A.push(i);
                }
                A.sort(
                    function () {
                        return 0.5 - Math.random();
                    }
                );
                A.length = n;
                return A;
            }

            A = groupA(n);
            for (var i = 0; i < 2 * n; i++) {
                var flag = 0;
                for (let j = 0; j < n; j++) {
                    if (i === A[j]) {
                        flag = 1;
                        break;
                    }
                }
                if (flag === 0) {
                    B.push(i);
                }
            }

            // 判断是否有重复
            function f(arr) {
                for (var i = 0; i < arr.length; i++) {
                    for (var j = i + 1; j < arr.length; j++) {
                        if (arr[i] === arr[j]) {
                            return false;
                        }
                    }
                }
                return true;
            }

            var flag = 1;
            for (var i in A) {
                for (var j in B) {
                    if (A[i] === B[j]) {
                        flag = 0;
                        break;
                    }
                }
                if (flag === 0)
                    break;
            }

            // 获取数据包
            // 数据包数量以及数据包对象组成的数组
            let pNum = T * r * 2 * l * 0.03, A1 = [], B1 = [];
            for (var i = 0; i < pNum; i++) {
                let temp = {};
                // 数据包的绝对时间戳
                temp.t1 = Math.round(Math.random() * 2 * n * T) + o;
                // 计算数据包的所属时隙
                for (var j = 0; j < interval.length - 1; j++) {
                    if (temp.t1 >= interval[j] && temp.t1 < interval[j + 1]) {
                        temp.index = j;
                        break;
                    }
                }
                // 判断数据包的分组
                temp.group = 'B';
                for (var j in A) {
                    if (temp.index === A[j]) {
                        temp.group = 'A';
                        break;
                    }
                }
                if (temp.group === 'A') {
                    A1.push(temp);
                } else {
                    B1.push(temp);
                }
            }
            var x = [], fx = [];
            for (var i = 0; i < T; i++) {
                x[i] = i;
                fx[i] = 0;
            }
            let pkg = A1.concat(B1);
            for (var i in pkg) {
                fx[(pkg[i].t1 - o) % T]++;
            }
            let data = {
                x: x,
                fx: fx
            };
            let sum = 0;
            for (let i = 0; i < T; i++) {
                sum += x[i] * fx[i];
            }

            // 计算时隙i的时隙质心
            /**
             * @param index 要计算的时隙质心对应时隙的编号
             * @param group 时隙分组
             * @param T 时隙长度
             * @returns {number}
             */
            function cent(index, group, T) {
                // 找出该时隙内的所有数据包
                let sum = 0, cnt = 0;
                for (i in group) {
                    if (group[i].index === index) {
                        sum += group[i].t1;
                        cnt++;
                    }
                }
                if (cnt === 0) {
                    return T / 2;
                }
                return sum / cnt;
            }

            // 求Ai的时隙质心
            let A2 = [], B2 = [];
            for (let i = 0; i < A.length;) {
                // 求得每个Ai和Bi的时隙编号
                let j, temp1 = [], temp2 = [];
                for (j = i; j < i + r; j++) {
                    temp1.push(A[j]);
                    temp2.push(B[j]);
                }
                A2.push(temp1);
                B2.push(temp2);
                i = j;
            }
            // console.log(A2);
            // console.log(B2);
            // console.log(A2[0].length);
            // 求出各时隙对应的数据包
            let GroupA = [], GroupB = [];

            function group2(A2, A1) {
                let GroupA = [];
                for (let i in A2) {
                    let t = [];
                    for (let j in A2[i]) {
                        let t1 = {id: A2[i][j], pkg: [], num: 0};
                        for (let k in A1) {
                            if (A2[i][j] === A1[k].index) {
                                t1.pkg.push(A1[k]);
                            }
                        }
                        t1.num = t1.pkg.length;
                        t.push(t1);
                    }
                    GroupA.push(t);
                }
                return GroupA;
            }

            GroupA = group2(A2, A1);
            GroupB = group2(B2, B1);
            data.groupA = GroupA;
            data.groupB = GroupB;

            // 水印编码，求时隙质心
            function Cent(GroupA) {
                let centA = [];
                for (let i in GroupA) {
                    let sum = 0, cnt = 0;
                    for (let j in GroupA[i]) {
                        let sum2 = 0;
                        let obj = GroupA[i][j];
                        for (let k in obj.pkg) {
                            sum2 += (obj.pkg[k].t1 - o) % T;
                            obj.pkg[k].deltaT = (obj.pkg[k].t1 - o) % T;
                        }
                        cnt += obj.num;
                        sum += sum2;
                    }
                    sum /= cnt;
                    centA.push(sum);
                }
                return centA;
            }

            let centA = Cent(GroupA);
            let centB = Cent(GroupB);
            let Y = [];
            for (let i in centA) {
                Y.push(centA[i] - centB[i]);
            }
            let s = 0;
            for (let i in Y) {
                s += Y[i];
            }
            // 进行延时处理
// 延时函数
            function myDelay(group, index, a) {
                for (let j in group[index]) {
                    let obj = group[index][j];
                    for (let k in obj.pkg) {
                        obj.pkg[k].deltaT = a + (T - a) * obj.pkg[k].deltaT / T;
                    }
                }
            }

// 求出延时后的时隙质心
            function Cent2(GroupA) {
                let centA = [];
                for (let i in GroupA) {
                    let sum = 0, cnt = 0;
                    for (let j in GroupA[i]) {
                        let sum2 = 0;
                        let obj = GroupA[i][j];
                        for (let k in obj.pkg) {
                            // sum2 += (obj.pkg[k].t1 - o) % T;
                            // obj.pkg[k].deltaT = (obj.pkg[k].t1 - o) % T;
                            sum2 += obj.pkg[k].deltaT;
                        }
                        cnt += obj.num;
                        sum += sum2;
                    }
                    sum /= cnt;
                    centA.push(sum);
                }
                return centA;
            }


            for (let i in waterMark) {
                // 如果要嵌入的水印编码是1，那么对时隙组Ai进行时延
                if (waterMark[i] === 1) {
                    myDelay(GroupA, i, a);
                } else if (waterMark[i] === -1) {
                    myDelay(GroupB, i, a);
                }
            }

            let centA1 = Cent2(GroupA);
            let centB1 = Cent2(GroupB);
            console.log('延时后的A、B两组的时隙质心：');
            console.log(centA1);
            console.log(centB1);
            let Y1 = [], waterMark2 = [];
            for (let i in centA1) {
                Y1.push(centA1[i] - centB1[i]);
                if (centA1[i] - centB1[i] < 0) {
                    waterMark2.push(-1);
                } else {
                    waterMark2.push(1);
                }
            }
            console.log(waterMark.length + ' ' + waterMark2.length);
            console.log(JSON.stringify(waterMark));
            console.log(JSON.stringify(waterMark2));
            let ans = 0;
            for (let i in waterMark2) {
                if (waterMark2[i] != waterMark[i]) {
                    ans ++;
                }
            }
            // 和海明阈值比较
            let h = [2, 3, 4, 5, 6, 7];
            for (let i = 0; i < 6; i ++) {
                if (ans <= h[i]) {
                    result1[i] ++;
                }
            }
        }
        console.log(result1);
        ctx.response.type = 'application/json';
        ctx.response.body = JSON.stringify(result1, null, 4);
        await next();
    },

    // 冗余度的影响
    'POST /ISBW3': async (ctx, next) => {
        let R = [1, 2, 3, 4, 5, 6, 7, 8, 9];
        let result = [];
// let result1 = [0, 0, 0, 0, 0, 0];

        let o = 10000, T = 500, l = 32,
            a = 100;
// let ii = 2;
        for (let ii = 0; ii < 9; ii ++) {
            let result1 = [0, 0, 0, 0, 0, 0], r = R[ii];
            let tot = 100;
            while (tot--) {
                // 生成水印编码
                let waterMark = [];
                for (let i = 0; i < 32; i++) {
                    let temp = Math.round(Math.random());
                    if (temp === 0)
                        temp = -1;
                    waterMark.push(temp);
                }
                // interval[i]: 第i个时隙开始的时间
                let interval = [10000];
                let n = l * r;
                for (var i = 1; i < 2 * n; i++) {
                    interval[i] = interval[i - 1] + T;
                }

                let A = [], B = [];

                // 随机函数，从0到2n-1中随机选出n个不同的数
                function groupA(n) {
                    var A = [];
                    for (var i = 0; i < 2 * n; i++) {
                        A.push(i);
                    }
                    A.sort(
                        function () {
                            return 0.5 - Math.random();
                        }
                    );
                    A.length = n;
                    return A;
                }

                A = groupA(n);
                for (var i = 0; i < 2 * n; i++) {
                    var flag = 0;
                    for (let j = 0; j < n; j++) {
                        if (i === A[j]) {
                            flag = 1;
                            break;
                        }
                    }
                    if (flag === 0) {
                        B.push(i);
                    }
                }

                // 判断是否有重复
                function f(arr) {
                    for (var i = 0; i < arr.length; i++) {
                        for (var j = i + 1; j < arr.length; j++) {
                            if (arr[i] === arr[j]) {
                                return false;
                            }
                        }
                    }
                    return true;
                }

                var flag = 1;
                for (var i in A) {
                    for (var j in B) {
                        if (A[i] === B[j]) {
                            flag = 0;
                            break;
                        }
                    }
                    if (flag === 0)
                        break;
                }

                // 获取数据包
                // 数据包数量以及数据包对象组成的数组
                let pNum = T * r * 2 * l * 0.03, A1 = [], B1 = [];
                for (var i = 0; i < pNum; i++) {
                    let temp = {};
                    // 数据包的绝对时间戳
                    temp.t1 = Math.round(Math.random() * 2 * n * T) + o;
                    // 计算数据包的所属时隙
                    for (var j = 0; j < interval.length - 1; j++) {
                        if (temp.t1 >= interval[j] && temp.t1 < interval[j + 1]) {
                            temp.index = j;
                            break;
                        }
                    }
                    // 判断数据包的分组
                    temp.group = 'B';
                    for (var j in A) {
                        if (temp.index === A[j]) {
                            temp.group = 'A';
                            break;
                        }
                    }
                    if (temp.group === 'A') {
                        A1.push(temp);
                    } else {
                        B1.push(temp);
                    }
                }
                var x = [], fx = [];
                for (var i = 0; i < T; i++) {
                    x[i] = i;
                    fx[i] = 0;
                }
                let pkg = A1.concat(B1);
                for (var i in pkg) {
                    fx[(pkg[i].t1 - o) % T]++;
                }
                let data = {
                    x: x,
                    fx: fx
                };
                let sum = 0;
                for (let i = 0; i < T; i++) {
                    sum += x[i] * fx[i];
                }

                // 计算时隙i的时隙质心
                /**
                 * @param index 要计算的时隙质心对应时隙的编号
                 * @param group 时隙分组
                 * @param T 时隙长度
                 * @returns {number}
                 */
                function cent(index, group, T) {
                    // 找出该时隙内的所有数据包
                    let sum = 0, cnt = 0;
                    for (i in group) {
                        if (group[i].index === index) {
                            sum += group[i].t1;
                            cnt++;
                        }
                    }
                    if (cnt === 0) {
                        return T / 2;
                    }
                    return sum / cnt;
                }

                // 求Ai的时隙质心
                let A2 = [], B2 = [];
                for (let i = 0; i < A.length;) {
                    // 求得每个Ai和Bi的时隙编号
                    let j, temp1 = [], temp2 = [];
                    for (j = i; j < i + r; j++) {
                        temp1.push(A[j]);
                        temp2.push(B[j]);
                    }
                    A2.push(temp1);
                    B2.push(temp2);
                    i = j;
                }
                // console.log(A2);
                // console.log(B2);
                // console.log(A2[0].length);
                // 求出各时隙对应的数据包
                let GroupA = [], GroupB = [];

                function group2(A2, A1) {
                    let GroupA = [];
                    for (let i in A2) {
                        let t = [];
                        for (let j in A2[i]) {
                            let t1 = {id: A2[i][j], pkg: [], num: 0};
                            for (let k in A1) {
                                if (A2[i][j] === A1[k].index) {
                                    t1.pkg.push(A1[k]);
                                }
                            }
                            t1.num = t1.pkg.length;
                            t.push(t1);
                        }
                        GroupA.push(t);
                    }
                    return GroupA;
                }

                GroupA = group2(A2, A1);
                GroupB = group2(B2, B1);
                data.groupA = GroupA;
                data.groupB = GroupB;

                // 水印编码，求时隙质心
                function Cent(GroupA) {
                    let centA = [];
                    for (let i in GroupA) {
                        let sum = 0, cnt = 0;
                        for (let j in GroupA[i]) {
                            let sum2 = 0;
                            let obj = GroupA[i][j];
                            for (let k in obj.pkg) {
                                sum2 += (obj.pkg[k].t1 - o) % T;
                                obj.pkg[k].deltaT = (obj.pkg[k].t1 - o) % T;
                            }
                            cnt += obj.num;
                            sum += sum2;
                        }
                        sum /= cnt;
                        centA.push(sum);
                    }
                    return centA;
                }

                let centA = Cent(GroupA);
                let centB = Cent(GroupB);
                let Y = [];
                for (let i in centA) {
                    Y.push(centA[i] - centB[i]);
                }
                let s = 0;
                for (let i in Y) {
                    s += Y[i];
                }
                // 进行延时处理
// 延时函数
                function myDelay(group, index, a) {
                    for (let j in group[index]) {
                        let obj = group[index][j];
                        for (let k in obj.pkg) {
                            obj.pkg[k].deltaT = a + (T - a) * obj.pkg[k].deltaT / T;
                        }
                    }
                }

// 求出延时后的时隙质心
                function Cent2(GroupA) {
                    let centA = [];
                    for (let i in GroupA) {
                        let sum = 0, cnt = 0;
                        for (let j in GroupA[i]) {
                            let sum2 = 0;
                            let obj = GroupA[i][j];
                            for (let k in obj.pkg) {
                                // sum2 += (obj.pkg[k].t1 - o) % T;
                                // obj.pkg[k].deltaT = (obj.pkg[k].t1 - o) % T;
                                sum2 += obj.pkg[k].deltaT;
                            }
                            cnt += obj.num;
                            sum += sum2;
                        }
                        sum /= cnt;
                        centA.push(sum);
                    }
                    return centA;
                }


                for (let i in waterMark) {
                    // 如果要嵌入的水印编码是1，那么对时隙组Ai进行时延
                    if (waterMark[i] === 1) {
                        myDelay(GroupA, i, a);
                    } else if (waterMark[i] === -1) {
                        myDelay(GroupB, i, a);
                    }
                }

                let centA1 = Cent2(GroupA);
                let centB1 = Cent2(GroupB);
                // console.log('延时后的A、B两组的时隙质心：');
                // console.log(centA1);
                // console.log(centB1);
                let Y1 = [], waterMark2 = [];
                for (let i in centA1) {
                    Y1.push(centA1[i] - centB1[i]);
                    if (centA1[i] - centB1[i] < 0) {
                        waterMark2.push(-1);
                    } else {
                        waterMark2.push(1);
                    }
                }
                console.log(waterMark.length + ' ' + waterMark2.length);
                console.log(JSON.stringify(waterMark));
                console.log(JSON.stringify(waterMark2));
                let ans = 0;
                for (let i in waterMark2) {
                    if (waterMark2[i] != waterMark[i]) {
                        ans ++;
                    }
                }
                // 和海明阈值比较
                let h = [2, 3, 4, 5, 6, 7];
                for (let i = 0; i < 7; i ++) {
                    if (ans <= h[i]) {
                        result1[i] ++;
                    }
                }
            }
            result.push(result1);
        }
        console.log(result);
        console.log(result.length);
        let data = {
            categories: R,
            series: []
        };
        for (let i = 0; i < result[0].length; i ++) {
            let temp = {
                name: 'HD = ' + (i + 2),
                data: []
            };
            for (let j = 0; j < result.length; j ++) {
                temp.data.push(result[j][i]);
            }
            data.series.push(temp);
        }
        console.log(data);
        ctx.response.type = 'application/json';
        ctx.response.body = JSON.stringify(data, null, 4);
        next();
    },

    // 时隙长度的影响
    'POST /ISBW4': async (ctx, next) => {
        let t = [];
        for (let i = 350; i <= 1200; i += 50) {
            t.push(i);
        }
        let result = [];
// let result1 = [0, 0, 0, 0, 0, 0];

        let o = 10000, r = 4, l = 32,
            a = 100;
// let ii = 2;
        for (let ii = t.length -1; ii >= 0; ii --) {
            let result1 = [0, 0, 0, 0, 0, 0], T = t[ii];
            let tot = 100;
            while (tot--) {
                // 生成水印编码
                let waterMark = [];
                for (let i = 0; i < 32; i++) {
                    let temp = Math.round(Math.random());
                    if (temp === 0)
                        temp = -1;
                    waterMark.push(temp);
                }
                // interval[i]: 第i个时隙开始的时间
                let interval = [10000];
                let n = l * r;
                for (var i = 1; i < 2 * n; i++) {
                    interval[i] = interval[i - 1] + T;
                }

                let A = [], B = [];

                // 随机函数，从0到2n-1中随机选出n个不同的数
                function groupA(n) {
                    var A = [];
                    for (var i = 0; i < 2 * n; i++) {
                        A.push(i);
                    }
                    A.sort(
                        function () {
                            return 0.5 - Math.random();
                        }
                    );
                    A.length = n;
                    return A;
                }

                A = groupA(n);
                for (var i = 0; i < 2 * n; i++) {
                    var flag = 0;
                    for (let j = 0; j < n; j++) {
                        if (i === A[j]) {
                            flag = 1;
                            break;
                        }
                    }
                    if (flag === 0) {
                        B.push(i);
                    }
                }

                // 判断是否有重复
                function f(arr) {
                    for (var i = 0; i < arr.length; i++) {
                        for (var j = i + 1; j < arr.length; j++) {
                            if (arr[i] === arr[j]) {
                                return false;
                            }
                        }
                    }
                    return true;
                }

                var flag = 1;
                for (var i in A) {
                    for (var j in B) {
                        if (A[i] === B[j]) {
                            flag = 0;
                            break;
                        }
                    }
                    if (flag === 0)
                        break;
                }

                // 获取数据包
                // 数据包数量以及数据包对象组成的数组
                let pNum = T * r * 2 * l * 0.03, A1 = [], B1 = [];
                for (var i = 0; i < pNum; i++) {
                    let temp = {};
                    // 数据包的绝对时间戳
                    temp.t1 = Math.round(Math.random() * 2 * n * T) + o;
                    // 计算数据包的所属时隙
                    for (var j = 0; j < interval.length - 1; j++) {
                        if (temp.t1 >= interval[j] && temp.t1 < interval[j + 1]) {
                            temp.index = j;
                            break;
                        }
                    }
                    // 判断数据包的分组
                    temp.group = 'B';
                    for (var j in A) {
                        if (temp.index === A[j]) {
                            temp.group = 'A';
                            break;
                        }
                    }
                    if (temp.group === 'A') {
                        A1.push(temp);
                    } else {
                        B1.push(temp);
                    }
                }
                var x = [], fx = [];
                for (var i = 0; i < T; i++) {
                    x[i] = i;
                    fx[i] = 0;
                }
                let pkg = A1.concat(B1);
                for (var i in pkg) {
                    fx[(pkg[i].t1 - o) % T]++;
                }
                let data = {
                    x: x,
                    fx: fx
                };
                let sum = 0;
                for (let i = 0; i < T; i++) {
                    sum += x[i] * fx[i];
                }

                // 计算时隙i的时隙质心
                /**
                 * @param index 要计算的时隙质心对应时隙的编号
                 * @param group 时隙分组
                 * @param T 时隙长度
                 * @returns {number}
                 */
                function cent(index, group, T) {
                    // 找出该时隙内的所有数据包
                    let sum = 0, cnt = 0;
                    for (i in group) {
                        if (group[i].index === index) {
                            sum += group[i].t1;
                            cnt++;
                        }
                    }
                    if (cnt === 0) {
                        return T / 2;
                    }
                    return sum / cnt;
                }

                // 求Ai的时隙质心
                let A2 = [], B2 = [];
                for (let i = 0; i < A.length;) {
                    // 求得每个Ai和Bi的时隙编号
                    let j, temp1 = [], temp2 = [];
                    for (j = i; j < i + r; j++) {
                        temp1.push(A[j]);
                        temp2.push(B[j]);
                    }
                    A2.push(temp1);
                    B2.push(temp2);
                    i = j;
                }
                // console.log(A2);
                // console.log(B2);
                // console.log(A2[0].length);
                // 求出各时隙对应的数据包
                let GroupA = [], GroupB = [];

                function group2(A2, A1) {
                    let GroupA = [];
                    for (let i in A2) {
                        let t = [];
                        for (let j in A2[i]) {
                            let t1 = {id: A2[i][j], pkg: [], num: 0};
                            for (let k in A1) {
                                if (A2[i][j] === A1[k].index) {
                                    t1.pkg.push(A1[k]);
                                }
                            }
                            t1.num = t1.pkg.length;
                            t.push(t1);
                        }
                        GroupA.push(t);
                    }
                    return GroupA;
                }

                GroupA = group2(A2, A1);
                GroupB = group2(B2, B1);
                data.groupA = GroupA;
                data.groupB = GroupB;

                // 水印编码，求时隙质心
                function Cent(GroupA) {
                    let centA = [];
                    for (let i in GroupA) {
                        let sum = 0, cnt = 0;
                        for (let j in GroupA[i]) {
                            let sum2 = 0;
                            let obj = GroupA[i][j];
                            for (let k in obj.pkg) {
                                sum2 += (obj.pkg[k].t1 - o) % T;
                                obj.pkg[k].deltaT = (obj.pkg[k].t1 - o) % T;
                            }
                            cnt += obj.num;
                            sum += sum2;
                        }
                        sum /= cnt;
                        centA.push(sum);
                    }
                    return centA;
                }

                let centA = Cent(GroupA);
                let centB = Cent(GroupB);
                let Y = [];
                for (let i in centA) {
                    Y.push(centA[i] - centB[i]);
                }
                let s = 0;
                for (let i in Y) {
                    s += Y[i];
                }
                // 进行延时处理
// 延时函数
                function myDelay(group, index, a) {
                    for (let j in group[index]) {
                        let obj = group[index][j];
                        for (let k in obj.pkg) {
                            obj.pkg[k].deltaT = a + (T - a) * obj.pkg[k].deltaT / T;
                        }
                    }
                }

// 求出延时后的时隙质心
                function Cent2(GroupA) {
                    let centA = [];
                    for (let i in GroupA) {
                        let sum = 0, cnt = 0;
                        for (let j in GroupA[i]) {
                            let sum2 = 0;
                            let obj = GroupA[i][j];
                            for (let k in obj.pkg) {
                                // sum2 += (obj.pkg[k].t1 - o) % T;
                                // obj.pkg[k].deltaT = (obj.pkg[k].t1 - o) % T;
                                sum2 += obj.pkg[k].deltaT;
                            }
                            cnt += obj.num;
                            sum += sum2;
                        }
                        sum /= cnt;
                        centA.push(sum);
                    }
                    return centA;
                }


                for (let i in waterMark) {
                    // 如果要嵌入的水印编码是1，那么对时隙组Ai进行时延
                    if (waterMark[i] === 1) {
                        myDelay(GroupA, i, a);
                    } else if (waterMark[i] === -1) {
                        myDelay(GroupB, i, a);
                    }
                }

                let centA1 = Cent2(GroupA);
                let centB1 = Cent2(GroupB);
                // console.log('延时后的A、B两组的时隙质心：');
                // console.log(centA1);
                // console.log(centB1);
                let Y1 = [], waterMark2 = [];
                for (let i in centA1) {
                    Y1.push(centA1[i] - centB1[i]);
                    if (centA1[i] - centB1[i] < 0) {
                        waterMark2.push(-1);
                    } else {
                        waterMark2.push(1);
                    }
                }
                console.log(waterMark.length + ' ' + waterMark2.length);
                console.log(JSON.stringify(waterMark));
                console.log(JSON.stringify(waterMark2));
                let ans = 0;
                for (let i in waterMark2) {
                    if (waterMark2[i] != waterMark[i]) {
                        ans ++;
                    }
                }
                // 和海明阈值比较
                let h = [2, 3, 4, 5, 6, 7];
                for (let i = 0; i < 7; i ++) {
                    if (ans <= h[i]) {
                        result1[i] ++;
                    }
                }
            }
            result.push(result1);
        }
        console.log(result);
        console.log(result.length);
        let data = {
            categories: t,
            series: []
        };
        for (let i = 0; i < result[0].length; i ++) {
            let temp = {
                name: 'HD = ' + (i + 2),
                data: []
            };
            for (let j = 0; j < result.length; j ++) {
                temp.data.push(result[j][i]);
            }
            data.series.push(temp);
        }
        console.log(data);
        ctx.response.type = 'application/json';
        ctx.response.body = JSON.stringify(data, null, 4);
        next();
    },
    // 延时
    'POST /ISBW5': async (ctx, next) => {
        let AA = [];
        for (let i = 50; i <= 400; i += 25) {
            AA.push(i);
        }
        let result = [];
// let result1 = [0, 0, 0, 0, 0, 0];

        let o = 10000, r = 4, l = 32,
            T = 500;
// let ii = 2;
        for (let ii = 0; ii <= AA.length; ii ++) {
            let result1 = [0, 0, 0, 0, 0, 0], a = AA[ii];
            let tot = 100;
            while (tot--) {
                // 生成水印编码
                let waterMark = [];
                for (let i = 0; i < 32; i++) {
                    let temp = Math.round(Math.random());
                    if (temp === 0)
                        temp = -1;
                    waterMark.push(temp);
                }
                // interval[i]: 第i个时隙开始的时间
                let interval = [10000];
                let n = l * r;
                for (var i = 1; i < 2 * n; i++) {
                    interval[i] = interval[i - 1] + T;
                }

                let A = [], B = [];

                // 随机函数，从0到2n-1中随机选出n个不同的数
                function groupA(n) {
                    var A = [];
                    for (var i = 0; i < 2 * n; i++) {
                        A.push(i);
                    }
                    A.sort(
                        function () {
                            return 0.5 - Math.random();
                        }
                    );
                    A.length = n;
                    return A;
                }

                A = groupA(n);
                for (var i = 0; i < 2 * n; i++) {
                    var flag = 0;
                    for (let j = 0; j < n; j++) {
                        if (i === A[j]) {
                            flag = 1;
                            break;
                        }
                    }
                    if (flag === 0) {
                        B.push(i);
                    }
                }

                // 判断是否有重复
                function f(arr) {
                    for (var i = 0; i < arr.length; i++) {
                        for (var j = i + 1; j < arr.length; j++) {
                            if (arr[i] === arr[j]) {
                                return false;
                            }
                        }
                    }
                    return true;
                }

                var flag = 1;
                for (var i in A) {
                    for (var j in B) {
                        if (A[i] === B[j]) {
                            flag = 0;
                            break;
                        }
                    }
                    if (flag === 0)
                        break;
                }

                // 获取数据包
                // 数据包数量以及数据包对象组成的数组
                let pNum = T * r * 2 * l * 0.03, A1 = [], B1 = [];
                for (var i = 0; i < pNum; i++) {
                    let temp = {};
                    // 数据包的绝对时间戳
                    temp.t1 = Math.round(Math.random() * 2 * n * T) + o;
                    // 计算数据包的所属时隙
                    for (var j = 0; j < interval.length - 1; j++) {
                        if (temp.t1 >= interval[j] && temp.t1 < interval[j + 1]) {
                            temp.index = j;
                            break;
                        }
                    }
                    // 判断数据包的分组
                    temp.group = 'B';
                    for (var j in A) {
                        if (temp.index === A[j]) {
                            temp.group = 'A';
                            break;
                        }
                    }
                    if (temp.group === 'A') {
                        A1.push(temp);
                    } else {
                        B1.push(temp);
                    }
                }
                var x = [], fx = [];
                for (var i = 0; i < T; i++) {
                    x[i] = i;
                    fx[i] = 0;
                }
                let pkg = A1.concat(B1);
                for (var i in pkg) {
                    fx[(pkg[i].t1 - o) % T]++;
                }
                let data = {
                    x: x,
                    fx: fx
                };
                let sum = 0;
                for (let i = 0; i < T; i++) {
                    sum += x[i] * fx[i];
                }

                // 计算时隙i的时隙质心
                /**
                 * @param index 要计算的时隙质心对应时隙的编号
                 * @param group 时隙分组
                 * @param T 时隙长度
                 * @returns {number}
                 */
                function cent(index, group, T) {
                    // 找出该时隙内的所有数据包
                    let sum = 0, cnt = 0;
                    for (i in group) {
                        if (group[i].index === index) {
                            sum += group[i].t1;
                            cnt++;
                        }
                    }
                    if (cnt === 0) {
                        return T / 2;
                    }
                    return sum / cnt;
                }

                // 求Ai的时隙质心
                let A2 = [], B2 = [];
                for (let i = 0; i < A.length;) {
                    // 求得每个Ai和Bi的时隙编号
                    let j, temp1 = [], temp2 = [];
                    for (j = i; j < i + r; j++) {
                        temp1.push(A[j]);
                        temp2.push(B[j]);
                    }
                    A2.push(temp1);
                    B2.push(temp2);
                    i = j;
                }
                // console.log(A2);
                // console.log(B2);
                // console.log(A2[0].length);
                // 求出各时隙对应的数据包
                let GroupA = [], GroupB = [];

                function group2(A2, A1) {
                    let GroupA = [];
                    for (let i in A2) {
                        let t = [];
                        for (let j in A2[i]) {
                            let t1 = {id: A2[i][j], pkg: [], num: 0};
                            for (let k in A1) {
                                if (A2[i][j] === A1[k].index) {
                                    t1.pkg.push(A1[k]);
                                }
                            }
                            t1.num = t1.pkg.length;
                            t.push(t1);
                        }
                        GroupA.push(t);
                    }
                    return GroupA;
                }

                GroupA = group2(A2, A1);
                GroupB = group2(B2, B1);
                data.groupA = GroupA;
                data.groupB = GroupB;

                // 水印编码，求时隙质心
                function Cent(GroupA) {
                    let centA = [];
                    for (let i in GroupA) {
                        let sum = 0, cnt = 0;
                        for (let j in GroupA[i]) {
                            let sum2 = 0;
                            let obj = GroupA[i][j];
                            for (let k in obj.pkg) {
                                sum2 += (obj.pkg[k].t1 - o) % T;
                                obj.pkg[k].deltaT = (obj.pkg[k].t1 - o) % T;
                            }
                            cnt += obj.num;
                            sum += sum2;
                        }
                        sum /= cnt;
                        centA.push(sum);
                    }
                    return centA;
                }

                let centA = Cent(GroupA);
                let centB = Cent(GroupB);
                let Y = [];
                for (let i in centA) {
                    Y.push(centA[i] - centB[i]);
                }
                let s = 0;
                for (let i in Y) {
                    s += Y[i];
                }
                // 进行延时处理
// 延时函数
                function myDelay(group, index, a) {
                    for (let j in group[index]) {
                        let obj = group[index][j];
                        for (let k in obj.pkg) {
                            obj.pkg[k].deltaT = a + (T - a) * obj.pkg[k].deltaT / T;
                        }
                    }
                }

// 求出延时后的时隙质心
                function Cent2(GroupA) {
                    let centA = [];
                    for (let i in GroupA) {
                        let sum = 0, cnt = 0;
                        for (let j in GroupA[i]) {
                            let sum2 = 0;
                            let obj = GroupA[i][j];
                            for (let k in obj.pkg) {
                                // sum2 += (obj.pkg[k].t1 - o) % T;
                                // obj.pkg[k].deltaT = (obj.pkg[k].t1 - o) % T;
                                sum2 += obj.pkg[k].deltaT;
                            }
                            cnt += obj.num;
                            sum += sum2;
                        }
                        sum /= cnt;
                        centA.push(sum);
                    }
                    return centA;
                }


                for (let i in waterMark) {
                    // 如果要嵌入的水印编码是1，那么对时隙组Ai进行时延
                    if (waterMark[i] === 1) {
                        myDelay(GroupA, i, a);
                    } else if (waterMark[i] === -1) {
                        myDelay(GroupB, i, a);
                    }
                }

                let centA1 = Cent2(GroupA);
                let centB1 = Cent2(GroupB);
                // console.log('延时后的A、B两组的时隙质心：');
                // console.log(centA1);
                // console.log(centB1);
                let Y1 = [], waterMark2 = [];
                for (let i in centA1) {
                    Y1.push(centA1[i] - centB1[i]);
                    if (centA1[i] - centB1[i] < 0) {
                        waterMark2.push(-1);
                    } else {
                        waterMark2.push(1);
                    }
                }
                console.log(waterMark.length + ' ' + waterMark2.length);
                console.log(JSON.stringify(waterMark));
                console.log(JSON.stringify(waterMark2));
                let ans = 0;
                for (let i in waterMark2) {
                    if (waterMark2[i] != waterMark[i]) {
                        ans ++;
                    }
                }
                // 和海明阈值比较
                let h = [2, 3, 4, 5, 6, 7];
                for (let i = 0; i < h.length; i ++) {
                    if (ans <= h[i]) {
                        result1[i] ++;
                    }
                }
            }
            result.push(result1);
        }
        console.log(result);
        console.log(result.length);
        let data = {
            categories: AA,
            series: []
        };
        for (let i = 0; i < result[0].length; i ++) {
            let temp = {
                name: 'HD = ' + (i + 2),
                data: []
            };
            for (let j = 0; j < result.length - 1; j ++) {
                temp.data.push(result[j][i]);
            }
            data.series.push(temp);
        }
        console.log(JSON.stringify(data, null, 4));
        ctx.response.type = 'application/json';
        ctx.response.body = JSON.stringify(data, null, 4);
        next();
    }
};