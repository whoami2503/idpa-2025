document.addEventListener("DOMContentLoaded", function () {
    const cookieModal = document.getElementById("cookie-modal");

    // Check if user has already accepted cookies
    if (localStorage.getItem("cookieAccept") === "true") {
        cookieModal.classList.remove("fixed");
        cookieModal.classList.add("hidden");
    } else {
        cookieModal.classList.add("fixed");
        cookieModal.classList.remove("hidden");
    }
});

function setCookieAccept() {
    localStorage.setItem("cookieAccept", "true");

    // Hide the modal
    document.getElementById("cookie-modal").classList.add("hidden");
}
