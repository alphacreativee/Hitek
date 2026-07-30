const toggleButtons = document.querySelectorAll(".toggle-password");

toggleButtons.forEach((toggle) => {
  toggle.addEventListener("click", () => {
    // tìm input gần nhất trong cùng .form-row
    const passwordInput = toggle.parentElement.querySelector(".pass-input");
    const isPassword = passwordInput.getAttribute("type") === "password";

    passwordInput.setAttribute("type", isPassword ? "text" : "password");
    toggle.textContent = isPassword ? "Hide" : "Show";
  });
});
