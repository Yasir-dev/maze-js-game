/**
 * Return an shuffled array
 * @param {Array} array
 */
const shuffleArray = array => {
    let counter = array.length;
    while (counter > 0) {
        const index = Math.floor(Math.random() * counter);
        counter--;
        // get value at counter
        const temp = array[counter];
        // set new value for counter based on random index
        array[counter] = array[index];
        // swap value for index with new value
        array[index] = temp;
    }

    return array;
};