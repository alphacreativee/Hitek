const togglePassword = document.getElementById("togglePassword");
const passwordInput = document.getElementById("pass");

togglePassword.addEventListener("click", () => {
  const isPassword = passwordInput.getAttribute("type") === "password";
  passwordInput.setAttribute("type", isPassword ? "text" : "password");
  togglePassword.textContent = isPassword ? "Hide" : "Show";
});
