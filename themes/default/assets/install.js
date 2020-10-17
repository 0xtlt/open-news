const form = window.installForm;
const submitButton = window.submitButton;

form.addEventListener("submit", (event) => {
  event.preventDefault();

  submitButton.querySelector("span").style.display = "none";
  submitButton.querySelector("img").style.display = "block";
});
