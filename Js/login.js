var body = document.querySelector("body");
var signInButton = document.querySelector("#signIn");
var signUpButton = document.querySelector("#signUp");

body.onload = function(){
    body.className = "on-load";
}

signInButton.addEventListener("click", function(){
    body.className = "sign-in";
})

signUpButton.addEventListener("click", function(){
    body.className = "sign-up";
})