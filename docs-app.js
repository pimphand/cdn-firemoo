// Documentation App - Sidebar Navigation and Content Rendering
(function() {
    'use strict';

    // Get DOM elements
    const sidebar = document.getElementById('sidebar');
    const sidebarNav = document.getElementById('sidebarNav');
    const contentContainer = document.getElementById('contentContainer');
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const mobileOverlay = document.getElementById('mobileOverlay');
    let currentSection = null;

    // Initialize app
    function init() {
        renderSidebar();
        loadSectionFromHash();
        setupEventListeners();
    }

    // Render sidebar navigation
    function renderSidebar() {
        if (!sidebarNav || !docsData || !docsData.sections) return;

        // Group sections by category (if needed) or render as single group
        const navHtml = `
            <div class="sidebar-group">
                <div class="sidebar-group-label px-2 py-1.5 mb-1">Dokumentasi</div>
                <div class="space-y-1">
                    ${docsData.sections.map(section => `
                        <a href="#${section.id}"
                           class="sidebar-link flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium"
                           data-section="${section.id}">
                            <span>${section.title}</span>
                        </a>
                    `).join('')}
                </div>
            </div>
        `;

        sidebarNav.innerHTML = navHtml;

        // Add click handlers to sidebar links
        const links = sidebarNav.querySelectorAll('.sidebar-link');
        links.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const sectionId = link.getAttribute('data-section');
                loadSection(sectionId);
                closeMobileMenu();
            });
        });
    }

    // Load section from hash or default to first section
    function loadSectionFromHash() {
        const hash = window.location.hash.replace('#', '');
        if (hash && docsData.sections.find(s => s.id === hash)) {
            loadSection(hash);
        } else {
            loadSection(docsData.sections[0].id);
        }
    }

    // Load section content
    function loadSection(sectionId) {
        const section = docsData.sections.find(s => s.id === sectionId);
        if (!section) return;

        // Update URL hash
        window.history.replaceState(null, '', `#${sectionId}`);

        // Update active sidebar link
        updateActiveSidebarLink(sectionId);

        // Render content
        if (contentContainer) {
            contentContainer.innerHTML = `
                <section id="${section.id}" class="bg-white rounded-lg shadow-sm p-6 lg:p-8">
                    <h2 class="text-3xl font-bold text-gray-900 mb-6 pb-3 border-b-2 border-gray-900">${section.title}</h2>
                    <div class="prose max-w-none">
                        ${section.content}
                    </div>
                </section>
            `;
        }

        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });

        currentSection = sectionId;
    }

    // Update active sidebar link
    function updateActiveSidebarLink(sectionId) {
        const links = sidebarNav.querySelectorAll('.sidebar-link');
        links.forEach(link => {
            if (link.getAttribute('data-section') === sectionId) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }

    // Setup event listeners
    function setupEventListeners() {
        // Mobile menu toggle
        if (mobileMenuBtn) {
            mobileMenuBtn.addEventListener('click', toggleMobileMenu);
        }

        // Close mobile menu when overlay is clicked
        if (mobileOverlay) {
            mobileOverlay.addEventListener('click', closeMobileMenu);
        }

        // Handle hash changes (browser back/forward)
        window.addEventListener('hashchange', () => {
            const hash = window.location.hash.replace('#', '');
            if (hash && docsData.sections.find(s => s.id === hash)) {
                loadSection(hash);
            }
        });

        // Close mobile menu on window resize (if resized to desktop)
        window.addEventListener('resize', () => {
            if (window.innerWidth >= 1024) {
                closeMobileMenu();
            }
        });
    }

    // Toggle mobile menu
    function toggleMobileMenu() {
        if (sidebar) {
            sidebar.classList.toggle('-translate-x-full');
        }
        if (mobileOverlay) {
            mobileOverlay.classList.toggle('active');
        }
    }

    // Close mobile menu
    function closeMobileMenu() {
        if (sidebar) {
            sidebar.classList.add('-translate-x-full');
        }
        if (mobileOverlay) {
            mobileOverlay.classList.remove('active');
        }
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();

