(function () {
    // Configuration
    const NOTIFICATIONS = [
        { id: 1, title: 'Welcome to Pink Maternal!', message: 'Start your journey by completing your first PPG scan.', time: 'Just now', icon: 'celebration', read: false },
        { id: 2, title: 'Hydration Reminder', message: 'It is time for a glass of water to keep you and baby healthy.', time: '2h ago', icon: 'water_drop', read: false },
        { id: 3, title: 'Upcoming Appointment', message: 'You have a checkup with Dr. Emily Chen on Oct 24.', time: 'Yesterday', icon: 'calendar_month', read: true }
    ];

    function injectStyles() {
        if (document.getElementById('nav-system-styles')) return;
        const style = document.createElement('style');
        style.id = 'nav-system-styles';
        style.textContent = `
            .dropdown-panel {
                transform-origin: top right;
                transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
            }
            .dropdown-panel.hidden {
                display: none;
                opacity: 0;
                transform: scale(0.95);
            }
            .dropdown-panel.active {
                display: block;
                opacity: 1;
                transform: scale(1);
            }
            .notification-dot {
                position: absolute;
                top: 8px;
                right: 8px;
                width: 8px;
                height: 8px;
                background-color: #fb7185;
                border: 2px solid white;
                border-radius: 50%;
            }
        `;
        document.head.appendChild(style);
    }

    function injectHeaderElements() {
        const header = document.querySelector('header');
        if (!header) {
            console.error('❌ NavSystem: Header not found');
            return;
        }

        // Broaden search for the navigation container
        let navContainer = header.querySelector('.flex.items-center.gap-4') || 
                           header.querySelector('.flex.items-center.justify-between > div:last-child') ||
                           header.querySelector('.flex.items-center:last-child');

        if (!navContainer) {
            console.error('❌ NavSystem: Nav container not found');
            return;
        }

        // Ensure container is relative for absolute positioning of dropdowns
        navContainer.style.position = 'relative';

        // Ensure IDs exist
        let notifBtn = navContainer.querySelector('#notificationBtn');
        if (!notifBtn) {
            const icons = navContainer.querySelectorAll('.material-symbols-outlined');
            icons.forEach(i => {
                if (i.textContent.trim() === 'notifications') notifBtn = i.closest('button');
            });
        }

        let avatarBtn = navContainer.querySelector('#profileAvatarBtn');
        if (!avatarBtn) {
            avatarBtn = navContainer.querySelector('.rounded-full.border-2') || 
                        navContainer.querySelector('.avatar-image') ||
                        navContainer.querySelector('div[style*="background-image"]');
        }

        if (notifBtn) {
            notifBtn.id = 'notificationBtn';
            notifBtn.style.position = 'relative';
            if (!notifBtn.querySelector('.notification-dot')) {
                const dot = document.createElement('div');
                dot.className = 'notification-dot';
                notifBtn.appendChild(dot);
            }
        } else {
            console.warn('⚠️ NavSystem: Notification button not identified');
        }

        if (avatarBtn) {
            avatarBtn.id = 'profileAvatarBtn';
            avatarBtn.style.cursor = 'pointer';
        } else {
            console.warn('⚠️ NavSystem: Avatar button not identified');
        }

        // Inject Notification Dropdown if not exists
        if (!document.getElementById('notificationDropdown')) {
            const notifDropdown = document.createElement('div');
            notifDropdown.id = 'notificationDropdown';
            notifDropdown.className = 'hidden dropdown-panel absolute top-12 right-0 w-80 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-rose-100 dark:border-rose-900/30 z-[70] overflow-hidden';
            notifDropdown.innerHTML = `
                <div class="px-6 py-4 border-b border-rose-50 dark:border-rose-900/20 flex items-center justify-between">
                    <h3 class="font-bold text-slate-900 dark:text-white">Notifications</h3>
                    <span class="text-[10px] font-bold text-primary uppercase bg-primary/10 px-2 py-1 rounded-full">3 New</span>
                </div>
                <div class="max-h-96 overflow-y-auto">
                    ${NOTIFICATIONS.map(n => `
                        <div class="px-6 py-4 hover:bg-rose-50/50 dark:hover:bg-slate-800 transition-colors border-b border-rose-50 dark:border-rose-900/10 cursor-pointer">
                            <div class="flex gap-4">
                                <div class="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                                    <span class="material-symbols-outlined text-xl">${n.icon}</span>
                                </div>
                                <div>
                                    <p class="text-sm font-bold text-slate-900 dark:text-white ${!n.read ? 'relative' : ''}">
                                        ${n.title}
                                        ${!n.read ? '<span class="absolute top-1 -right-2 size-1.5 bg-primary rounded-full"></span>' : ''}
                                    </p>
                                    <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">${n.message}</p>
                                    <p class="text-[10px] text-slate-400 mt-2 font-medium capitalize">${n.time}</p>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
                <div class="p-3 text-center border-t border-rose-50 dark:border-rose-900/10">
                    <button class="text-xs font-bold text-primary hover:underline">Mark all as read</button>
                </div>
            `;
            navContainer.appendChild(notifDropdown);
        }

        // Inject Profile Dropdown if not exists
        if (!document.getElementById('profileDropdown')) {
            const profileDropdown = document.createElement('div');
            profileDropdown.id = 'profileDropdown';
            profileDropdown.className = 'hidden dropdown-panel absolute top-12 right-0 w-72 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-rose-100 dark:border-rose-900/30 z-[70] overflow-hidden';
            profileDropdown.innerHTML = `
                <div class="p-6 border-b border-rose-50 dark:border-rose-900/20">
                    <div class="flex items-center gap-4 mb-3">
                        <div class="size-12 rounded-full border-2 border-primary bg-center bg-cover avatar-image" style="background-image: url('https://lh3.googleusercontent.com/aida-public/AB6AXuBuozhymEJVd41ejzHmyPix6N2CMJlXvaPvlhKa-ewZoyQMGNCpNCPPHk0UGpFX47iORD1cd0uQe4mnf740e9FwjF9g4kIlXSmyyfHkY70ATGEts3WVzpd1SqCgkJNKG3PBZyq1oVaTDX7fShZyjkh44yKPWvVF2hmLEkrK3LmJA0n2wAK5XQTB0noLosx_yYKzkEMkLI9HX0IrxG4edSsRNK1egGdUB-5FKhM41OwszQyNjjPozYUX8P6acK9GFlP6PYyh3hj-tyU')"></div>
                        <div class="min-w-0">
                            <h4 class="font-bold text-slate-900 dark:text-white truncate profile-name">User Name</h4>
                            <p class="text-xs text-slate-500 dark:text-slate-400 truncate profile-email">user@example.com</p>
                        </div>
                    </div>
                    <span class="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary uppercase profile-role">User</span>
                </div>
                <div class="p-4 space-y-1">
                    <button class="nav-opt-btn w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors text-sm font-semibold text-left" data-action="edit-profile">
                        <span class="material-symbols-outlined text-lg">person</span>
                        <span>Edit Profile</span>
                    </button>
                    <button class="nav-opt-btn w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors text-sm font-semibold text-left" data-action="settings">
                        <span class="material-symbols-outlined text-lg">settings</span>
                        <span>Settings</span>
                    </button>
                    <button class="nav-opt-btn w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors text-sm font-semibold text-left" data-action="help">
                        <span class="material-symbols-outlined text-lg">help</span>
                        <span>Help & Support</span>
                    </button>
                </div>
                <div class="px-4 py-4 border-t border-rose-50 dark:border-rose-900/20">
                    <button class="nav-opt-btn w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-50 dark:bg-red-900/20 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors font-bold text-sm" data-action="logout">
                        <span class="material-symbols-outlined text-lg">logout</span>
                        <span>Logout</span>
                    </button>
                </div>
            `;
            navContainer.appendChild(profileDropdown);
        }
        // Inject Modal Template
        if (!document.getElementById('navSystemModal')) {
            const modal = document.createElement('div');
            modal.id = 'navSystemModal';
            modal.className = 'hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4';
            modal.innerHTML = `
                <div class="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-rose-100 dark:border-rose-900/20">
                    <div class="px-8 py-6 border-b border-rose-50 dark:border-rose-900/20 flex items-center justify-between">
                        <h2 id="navModalTitle" class="text-2xl font-black text-slate-900 dark:text-white leading-tight">Title</h2>
                        <button id="closeNavModal" class="p-2 rounded-full hover:bg-rose-50 dark:hover:bg-slate-800 text-slate-400 transition-colors">
                            <span class="material-symbols-outlined">close</span>
                        </button>
                    </div>
                    <div id="navModalContent" class="px-8 py-8 overflow-y-auto max-h-[70vh]">
                        <!-- Content Injected Dynamically -->
                    </div>
                    <div id="navModalFooter" class="px-8 py-6 border-t border-rose-50 dark:border-rose-900/20 flex justify-end gap-3 hidden">
                        <button id="navModalCancel" class="px-6 py-2 rounded-lg font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">Cancel</button>
                        <button id="navModalConfirm" class="px-6 py-2 bg-primary text-white font-bold rounded-lg hover:opacity-90 transition-opacity">Save Changes</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        }
    }

    function updateProfileData() {
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        const containers = document.querySelectorAll('#profileDropdown');

        containers.forEach(container => {
            const nameEl = container.querySelector('.profile-name');
            const emailEl = container.querySelector('.profile-email');
            const roleEl = container.querySelector('.profile-role');
            const avatarEl = container.querySelector('.avatar-image');

            if (nameEl) nameEl.textContent = userData.fullName || 'User';
            if (emailEl) emailEl.textContent = userData.email || 'user@example.com';
            if (roleEl) roleEl.textContent = userData.role || 'User';
            if (avatarEl && userData.avatar) avatarEl.style.backgroundImage = `url('${userData.avatar}')`;
        });
    }

    function showNavModal(title, content, showFooter = false, onConfirm = null) {
        const modal = document.getElementById('navSystemModal');
        const titleEl = document.getElementById('navModalTitle');
        const contentEl = document.getElementById('navModalContent');
        const footerEl = document.getElementById('navModalFooter');
        const confirmBtn = document.getElementById('navModalConfirm');

        if (!modal) return;

        titleEl.textContent = title;
        contentEl.innerHTML = content;
        footerEl.classList.toggle('hidden', !showFooter);

        if (onConfirm) {
            confirmBtn.onclick = () => {
                onConfirm();
                modal.classList.add('hidden');
            };
        }

        modal.classList.remove('hidden');
    }

    function setupInteractions() {
        const notifBtn = document.getElementById('notificationBtn');
        const avatarBtn = document.getElementById('profileAvatarBtn');
        const notifDropdown = document.getElementById('notificationDropdown');
        const profileDropdown = document.getElementById('profileDropdown');
        const modal = document.getElementById('navSystemModal');
        const closeModalBtn = document.getElementById('closeNavModal');
        const cancelModalBtn = document.getElementById('navModalCancel');

        const closeAll = () => {
            if (notifDropdown) notifDropdown.classList.add('hidden');
            if (profileDropdown) profileDropdown.classList.add('hidden');
        };

        if (notifBtn) {
            console.log('✅ NavSystem: Notification handler attached');
            notifBtn.onclick = (e) => {
                e.stopPropagation();
                const wasHidden = notifDropdown.classList.contains('hidden');
                closeAll();
                if (wasHidden) notifDropdown.classList.remove('hidden');
                // Remove dot if we opened it
                const dot = notifBtn.querySelector('.notification-dot');
                if (dot) dot.remove();
            };
        }

        if (avatarBtn) {
            console.log('✅ NavSystem: Profile handler attached');
            avatarBtn.onclick = (e) => {
                e.stopPropagation();
                const wasHidden = profileDropdown.classList.contains('hidden');
                closeAll();
                if (wasHidden) profileDropdown.classList.remove('hidden');
            };
        }

        document.addEventListener('click', (e) => {
            if (!e.target.closest('.dropdown-panel') && !e.target.closest('#notificationBtn') && !e.target.closest('#profileAvatarBtn')) {
                closeAll();
            }
        });

        // Handle profile actions
        document.querySelectorAll('.nav-opt-btn').forEach(btn => {
            btn.onclick = () => {
                const action = btn.dataset.action;
                closeAll();

                if (action === 'logout') {
                    if (confirm('Are you sure you want to logout?')) {
                        localStorage.removeItem('userData');
                        localStorage.removeItem('userToken');
                        window.location.href = 'Login.html';
                    }
                } else if (action === 'edit-profile') {
                    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
                    const content = `
                        <div class="space-y-4">
                            <div>
                                <label class="block text-xs font-bold uppercase text-slate-400 mb-2">Display Name</label>
                                <input type="text" id="edit-name" value="${userData.fullName || ''}" class="w-full px-4 py-3 rounded-xl border border-rose-100 dark:border-rose-900/20 bg-rose-50/30 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold">
                            </div>
                            <div>
                                <label class="block text-xs font-bold uppercase text-slate-400 mb-2">Email Address</label>
                                <input type="email" id="edit-email" value="${userData.email || ''}" disabled class="w-full px-4 py-3 rounded-xl border border-rose-100 dark:border-rose-900/20 bg-slate-100 dark:bg-slate-900 text-slate-400 font-semibold cursor-not-allowed">
                            </div>
                        </div>
                    `;
                    showNavModal('Edit Profile', content, true, () => {
                        const newName = document.getElementById('edit-name').value;
                        userData.fullName = newName;
                        localStorage.setItem('userData', JSON.stringify(userData));
                        updateProfileData();
                        location.reload(); // Refresh to update all UI
                    });
                } else if (action === 'settings') {
                    const content = `
                        <div class="space-y-6">
                            <div class="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                                <div>
                                    <p class="font-bold text-slate-900 dark:text-white">Dark Mode</p>
                                    <p class="text-xs text-slate-500">Toggle dark/light theme</p>
                                </div>
                                <button id="theme-toggle" class="size-12 rounded-full border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                                    <span class="material-symbols-outlined">${document.documentElement.classList.contains('dark') ? 'light_mode' : 'dark_mode'}</span>
                                </button>
                            </div>
                            <div class="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                                <div>
                                    <p class="font-bold text-slate-900 dark:text-white">Push Notifications</p>
                                    <p class="text-xs text-slate-500">Enable daily tips</p>
                                </div>
                                <div class="w-12 h-6 bg-primary rounded-full relative cursor-pointer">
                                    <div class="absolute right-1 top-1 size-4 bg-white rounded-full"></div>
                                </div>
                            </div>
                        </div>
                    `;
                    showNavModal('Settings', content);
                    setTimeout(() => {
                        const toggle = document.getElementById('theme-toggle');
                        if (toggle) {
                            toggle.onclick = () => {
                                document.documentElement.classList.toggle('dark');
                                toggle.querySelector('span').textContent = document.documentElement.classList.contains('dark') ? 'light_mode' : 'dark_mode';
                            };
                        }
                    }, 0);
                } else if (action === 'help') {
                    const content = `
                        <div class="space-y-6">
                            <div class="p-6 bg-rose-50 dark:bg-rose-900/10 rounded-2xl border border-rose-100 dark:border-rose-900/20">
                                <h4 class="font-bold text-primary mb-2">Frequently Asked Questions</h4>
                                <ul class="space-y-3 text-sm text-slate-600 dark:text-slate-400">
                                    <li>• <b>How do I take a PPG scan?</b> Place your finger over both the camera and flash lens.</li>
                                    <li>• <b>How often should I scan?</b> We recommend once in the morning and once at night.</li>
                                    <li>• <b>Is my data safe?</b> Yes, all health data is encrypted and local to your device.</li>
                                </ul>
                            </div>
                            <div class="text-center pb-4">
                                <p class="text-slate-500 text-sm mb-4">Still need help?</p>
                                <a href="mailto:support@pinkmaternal.com" class="px-8 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold inline-block">Contact Support</a>
                            </div>
                        </div>
                    `;
                    showNavModal('Help & Support', content);
                }
            };
        });

        if (closeModalBtn) closeModalBtn.onclick = () => modal.classList.add('hidden');
        if (cancelModalBtn) cancelModalBtn.onclick = () => modal.classList.add('hidden');
        if (modal) modal.onclick = (e) => { if (e.target === modal) modal.classList.add('hidden'); };
    }

    function init() {
        injectStyles();
        injectHeaderElements();
        updateProfileData();
        setupInteractions();
        console.log('🚀 Navigation System Initialized');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
