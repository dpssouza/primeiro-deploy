// Interações do site do laboratório CETEP-I.
function openEnvironmentModal() {
    const modal = document.getElementById("environment-modal");
    if (!modal) return;
    modal.hidden = false;
    document.body.classList.add("modal-open");
    const closeButton = modal.querySelector("[data-close-modal]");
    if (closeButton) closeButton.focus();
}

function closeEnvironmentModal() {
    const modal = document.getElementById("environment-modal");
    if (!modal) return;
    modal.hidden = true;
    document.body.classList.remove("modal-open");
    const trigger = document.querySelector(".hero-actions .btn-outline");
    if (trigger) trigger.focus();
}

// O painel apresenta a arquitetura documentada; não consulta métricas em tempo real.
function updateStatus() {
    openEnvironmentModal();
}

function showInfo() {
    openEnvironmentModal();
}

document.addEventListener("DOMContentLoaded", () => {
    const menuToggle = document.getElementById("menu-toggle");
    const navMenu = document.getElementById("nav-menu");

    if (menuToggle && navMenu) {
        menuToggle.addEventListener("click", () => {
            const isOpen = navMenu.classList.toggle("open");
            menuToggle.setAttribute("aria-expanded", String(isOpen));
            menuToggle.setAttribute("aria-label", isOpen ? "Fechar menu" : "Abrir menu");
        });

        navMenu.querySelectorAll("a").forEach(link => {
            link.addEventListener("click", () => {
                navMenu.classList.remove("open");
                menuToggle.setAttribute("aria-expanded", "false");
                menuToggle.setAttribute("aria-label", "Abrir menu");
            });
        });
    }

    const modal = document.getElementById("environment-modal");
    if (modal) {
        modal.querySelectorAll("[data-close-modal]").forEach(button => {
            button.addEventListener("click", closeEnvironmentModal);
        });
        modal.addEventListener("click", event => {
            if (event.target === modal) closeEnvironmentModal();
        });
        document.addEventListener("keydown", event => {
            if (event.key === "Escape" && !modal.hidden) closeEnvironmentModal();
        });
    }

    console.log("CETEP-I Itaparica | Laboratório de Tecnologia carregado.");
});
