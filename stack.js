"use strict";
// Determine if a word is a palindrome
var letters = [];
var word = "racecar";
var rword = "";

// put letters of word into a stack

for (var i = 0; i < word.length; i++) {
  letters.push(word[i]);
}
console.log(letters);

// pop the stack(letters) in reverse order

for (var i = 0; i < word.length; i++) {
  rword += letters.pop();
}
console.log(rword);

if (word === rword) {
  console.log(word + " " + "is a palindrome");
} else {
  console.log(word + "is not a palindrome");
}

var s = "aaaaa";
var letters = [];
var rword = "";
var isPalindrome = function (s) {
  var lowers = s.toLowerCase();
  lowers = lowers.replace(/[^a-zA-Z0-9]/g, "").replace(/\s/g, "");
  //   console.log(lowers);
  for (i = 0; i < lowers.length; i++) {
    letters.push(lowers[i]);
  }
  //   console.log(letters);

  for (i = 0; i < lowers.length; i++) {
    rword += letters.pop();
    // console.log(rword);
  }
  if (lowers === rword || s.length === 1) {
    return true;
  } else {
    return false;
  }
};
var result = isPalindrome(s);
console.log(result);

// function that determin if a number is even or odd
var numarr = [2, 4, 6];

var detnum = function (num) {
  if (num % 2 == 0) {
    if (numarr.includes(num)) {
      console.log(numarr);
      return num + " " + "already in array";
    } else {
      console.log(num + " " + "already not in array but will be included now");
      numarr.push(num);
    }

    return num + " " + "is even";
  } else {
    return num + " " + "is odd";
  }
};
var number = detnum(88);
console.log(number);
console.log(numarr);
