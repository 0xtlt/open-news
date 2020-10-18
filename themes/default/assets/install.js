const form = window.installForm;
const submitButton = window.submitButton;

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  submitButton.querySelector("span").style.display = "none";
  submitButton.querySelector("img").style.display = "block";
  form.querySelectorAll("input, textarea, button").forEach((element) => {
    element.disabled = true;
  });

  const response = await fetch("/json/install", {
    method: "POST", // *GET, POST, PUT, DELETE, etc.
    mode: "cors", // no-cors, cors, *same-origin
    cache: "no-cache", // *default, no-cache, reload, force-cache, only-if-cached
    credentials: "same-origin", // include, *same-origin, omit
    headers: {
      "Content-Type": "application/json",
    },
    redirect: "follow", // manual, *follow, error
    referrer: "no-referrer", // no-referrer, *client
    body: JSON.stringify(
      [...form.elements]
        .map((element) => {
          let tmp = {};
          tmp[element.name] = element.value;
          return tmp;
        })
        .reduce((accumulator, current) => ({ ...accumulator, ...current })),
    ),
  });

  const responseJSON = await response.json();

  if (!responseJSON.success) {
    submitButton.querySelector("span").style.display = "block";
    submitButton.querySelector("img").style.display = "none";
    form.querySelectorAll("input, textarea, button").forEach((element) => {
      element.disabled = false;
    });
    alert(responseJSON.message);
    return;
  }

  setCookie("opentoken", responseJSON.message, 30);
  window.location.replace("/admin");
});

function setCookie(name, value, days) {
  let d = new Date();
  d.setTime(d.getTime() + 24 * 60 * 60 * 1000 * days);
  document.cookie = name + "=" + value + ";path=/;expires=" + d.toUTCString();
}

function fakeData() {
  window.userName.value = "Zeus";
  window.userEmail.value = "zeus@lightning.com";
  window.userDescription.value = "# Super title";
  window.userPassword.value = "lightning";
  window.websiteName.value = "Lightning";
  window.websiteURL.value = "http://localhost:3030";
  window.websiteDescription.value = "# Bad weather but beautiful lightning";
  window.databaseName.value = "opennews";
  window.databaseUser.value = "opennews";
  window.databaseHost.value = "localhost";
  window.databasePassword.value = "open";
  window.submitButton.click();
}
