document.addEventListener("DOMContentLoaded", function () {
  new FlipBook("FlipBook", {
    nextButton: document.getElementById("flipbook-next"),
    previousButton: document.getElementById("flipbook-prev"),
    canClose: false,
    arrowKeys: true,
    initialActivePage: 0,
    onPageTurn: function () {},
    initialCall: false,
    width: "1100px",
    height: "310px",
  });
});
