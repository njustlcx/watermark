/**
 * Created by as on 2017/5/22.
 */
function changeArray(arr) {
    for (let i in arr) {
        arr[i] += 1;
    }
}
arr = [1, 2, 3];

changeArray(arr);

console.log(arr);