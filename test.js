/**
 * Created by as on 2017/5/12.
 */

let o = 10000, T = 500, l = 32, r = 12;
// interval[i]: 第i个时隙开始的时间
let interval = [10000];
let n = l * r;
for (var i = 1; i < 2 * n; i ++) {
    interval[i] = interval[i - 1] + T;
}

console.log(interval.length);

let A = [], B = [];

// 随机函数，从0到2n-1中随机选出n个不同的数
function groupA(n) {
    let A = [];
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
for (var i = 0; i < 2 * n; i ++) {
    var flag = 0;
    for (let j = 0; j < n; j ++) {
        if (i === A[j]) {
            flag = 1;
            break;
        }
    }
    if (flag === 0) {
        B.push(i);
    }
}

B.sort(function () {
    return 0.5 - Math.random();
});

console.log(B.length === A.length);
// 判断是否有重复
function f(arr) {
    for (var i = 0; i < arr.length; i ++) {
        for (var j = i + 1; j < arr.length; j ++) {
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
let pNum = 8000, A1 = [], B1 = [];
for (var i = 0; i < pNum; i ++) {
    let temp = {};
    // 数据包的绝对时间戳
    temp.t1 = Math.round(Math.random() * 2 * n * T + o);
    // 计算数据包的所属时隙
    for (var j = 0; j < interval.length -1; j ++) {
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
console.log(A1.length + ' ' + B1.length);
// 致此分组完成

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
            sum += (group[i].t1 - o) % T;
            cnt ++;
        }
    }
    if (cnt === 0) {
        return T / 2;
    }
    return sum / cnt;
}

let c = [];
for (let i = 0; i < 2 * n; i ++) {
    c.push(cent(i, A1.concat(B1), T));
}
// console.log(c);

let sum = 0;
for (let i = 0; i < pNum; i ++) {
    sum += (A1.concat(B1)[i].t1 - o) % T;
}
console.log(sum / pNum);

// 求Ai的时隙质心
let A2 = [], B2 = [];
for (let i = 0; i < A.length;) {
    // 求得每个Ai和Bi的时隙编号
    let j, temp1 = [], temp2 = [];
    for (j = i; j < i + r; j ++) {
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
            let t1  = {id: A2[i][j], pkg: [], num: 0};
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