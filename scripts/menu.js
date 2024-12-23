const menuButton = document.getElementById('menu-button');
const mobileMenu = document.getElementById('mobile-menu');
const menuOpenIcon = document.getElementById('menu-open-icon');
const menuCloseIcon = document.getElementById('menu-close-icon');

menuButton.addEventListener('click', () => {
    const isMenuOpen = mobileMenu.classList.contains('hidden');
    mobileMenu.classList.toggle('hidden', !isMenuOpen);
    menuOpenIcon.classList.toggle('hidden', isMenuOpen);
    menuCloseIcon.classList.toggle('hidden', !isMenuOpen);
});