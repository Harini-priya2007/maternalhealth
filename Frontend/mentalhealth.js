// Mental Health Assessment Form Handler

// Toast notification
function showMentalToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `fixed bottom-6 right-6 px-6 py-3 rounded-lg font-bold text-white text-sm z-[9999]`;
    toast.textContent = message;
    
    if (type === 'success') toast.style.backgroundColor = '#10b981';
    else if (type === 'error') toast.style.backgroundColor = '#ef4444';
    else toast.style.backgroundColor = '#3b82f6';
    
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

let selectedMood = 'Happy';
let selectedSleep = 'Disturbed';
let selectedBonding = 'Normal';
let selectedSupport = 'Yes';

// Get current user
function getCurrentUser() {
    const userData = localStorage.getItem('userData');
    if (!userData) {
        window.location.href = 'Login.html';
        return null;
    }
    return JSON.parse(userData);
}

// Load mental health history
function loadMentalHistory() {
    const user = getCurrentUser();
    if (!user) return [];

    const historyKey = `mentalHistory_${user.email}`;
    return JSON.parse(localStorage.getItem(historyKey) || '[]');
}

// Save assessment
function saveMentalAssessment(assessment) {
    const user = getCurrentUser();
    if (!user) return;

    const historyKey = `mentalHistory_${user.email}`;
    const history = loadMentalHistory();
    
    history.push({
        mood: assessment.mood,
        sleep: assessment.sleep,
        overwhelmed: assessment.overwhelmed,
        bonding: assessment.bonding,
        support: assessment.support,
        submittedAt: new Date().toISOString()
    });

    localStorage.setItem(historyKey, JSON.stringify(history));
}

// Display mental health history
function displayMentalHistory() {
    const historyModal = document.getElementById('mentalHealthHistoryModal');
    const historyContent = document.getElementById('mentalHistoryContent');
    const history = loadMentalHistory();

    if (history.length === 0) {
        historyContent.innerHTML = '<p class="text-slate-500 text-center py-8">No assessments yet. Submit an assessment to see records.</p>';
        historyModal.classList.remove('hidden');
        return;
    }

    // Sort by submission time (newest first)
    const sorted = [...history].reverse();

    historyContent.innerHTML = sorted.map((entry, index) => {
        const submitDate = new Date(entry.submittedAt);
        const dateStr = submitDate.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        // Determine stress level based on overwhelmed score
        let stressLevel = 'Low';
        let stressColor = 'text-green-600';
        if (entry.overwhelmed > 6) stressLevel = 'High', stressColor = 'text-red-600';
        else if (entry.overwhelmed > 4) stressLevel = 'Moderate', stressColor = 'text-amber-600';

        return `
            <div class="mb-6 pb-6 border-b border-rose-100 dark:border-rose-900/20 last:border-0">
                <div class="flex items-center justify-between mb-4">
                    <div>
                        <p class="font-bold text-slate-900 dark:text-slate-100">📅 ${dateStr}</p>
                        <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">Assessment #${history.length - index}</p>
                    </div>
                    <div class="text-right">
                        <p class="font-bold ${stressColor}">Stress: ${stressLevel}</p>
                        <p class="text-xs text-slate-500">😊 ${entry.mood}</p>
                    </div>
                </div>
                <div class="grid grid-cols-2 gap-3 text-sm">
                    <div class="p-3 rounded bg-slate-50 dark:bg-slate-800/30">
                        <p class="text-xs text-slate-500">Sleep Quality</p>
                        <p class="font-bold text-slate-900 dark:text-slate-100">${entry.sleep || '-'}</p>
                    </div>
                    <div class="p-3 rounded bg-slate-50 dark:bg-slate-800/30">
                        <p class="text-xs text-slate-500">Overwhelm Level</p>
                        <p class="font-bold text-slate-900 dark:text-slate-100">${entry.overwhelmed}/10</p>
                    </div>
                    <div class="p-3 rounded bg-slate-50 dark:bg-slate-800/30">
                        <p class="text-xs text-slate-500">Baby Connection</p>
                        <p class="font-bold text-slate-900 dark:text-slate-100">${entry.bonding}</p>
                    </div>
                    <div class="p-3 rounded bg-slate-50 dark:bg-slate-800/30">
                        <p class="text-xs text-slate-500">Support Available</p>
                        <p class="font-bold text-slate-900 dark:text-slate-100">${entry.support || '-'}</p>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    historyModal.classList.remove('hidden');
}

// Initialize form handlers
document.addEventListener('DOMContentLoaded', function() {
    const user = getCurrentUser();
    if (!user) return;

    // Mood buttons
    const moodBtns = document.querySelectorAll('.mood-btn');
    moodBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            moodBtns.forEach(b => {
                b.classList.remove('border-primary', 'bg-rose-50', 'border-2');
                b.classList.add('border-rose-100', 'bg-white');
            });
            btn.classList.add('border-primary', 'bg-rose-50', 'border-2');
            btn.classList.remove('border-rose-100', 'bg-white');
            selectedMood = btn.getAttribute('data-mood') || 'Happy';
        });
    });

    // History button
    const historyBtn = document.getElementById('historyMentalBtn');
    if (historyBtn) {
        historyBtn.addEventListener('click', displayMentalHistory);
    }

    // Close history modal
    const closeHistoryBtn = document.getElementById('closeHistoryMentalBtn');
    const historyModal = document.getElementById('mentalHealthHistoryModal');
    if (closeHistoryBtn && historyModal) {
        closeHistoryBtn.addEventListener('click', () => {
            historyModal.classList.add('hidden');
        });
        historyModal.addEventListener('click', (e) => {
            if (e.target === historyModal) {
                historyModal.classList.add('hidden');
            }
        });
    }

    // Clear history
    const clearHistoryBtn = document.getElementById('clearMentalHistoryBtn');
    if (clearHistoryBtn) {
        clearHistoryBtn.addEventListener('click', () => {
            if (window.confirm('Are you sure? This will delete all assessment history permanently.')) {
                const historyKey = `mentalHistory_${user.email}`;
                localStorage.removeItem(historyKey);
                showMentalToast('Mental health history cleared.');
                if (historyModal) historyModal.classList.add('hidden');
                setTimeout(() => window.location.reload(), 1000);
            }
        });
    }

    // Sleep buttons
    const sleepBtns = document.querySelectorAll('.sleepBtn');
    sleepBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            sleepBtns.forEach(b => {
                b.classList.remove('border-primary', 'bg-primary', 'text-white', 'font-bold', 'shadow-md');
                b.classList.add('border-rose-200', 'bg-white', 'text-slate-600');
            });
            btn.classList.add('border-primary', 'bg-primary', 'text-white', 'font-bold', 'shadow-md');
            btn.classList.remove('border-rose-200', 'bg-white', 'text-slate-600');
            selectedSleep = btn.getAttribute('data-value');
        });
    });

    // Support buttons
    const supportBtns = document.querySelectorAll('.supportBtn');
    supportBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            supportBtns.forEach(b => {
                b.classList.remove('border-primary', 'bg-primary', 'text-white');
                b.classList.add('border-rose-200', 'bg-white', 'text-slate-600');
            });
            btn.classList.add('border-primary', 'bg-primary', 'text-white');
            btn.classList.remove('border-rose-200', 'bg-white', 'text-slate-600');
            selectedSupport = btn.getAttribute('data-value');
        });
    });

    // Bonding radio buttons
    document.getElementById('bondingVeryStrong')?.addEventListener('change', () => { selectedBonding = 'Very Strong'; });
    document.getElementById('bondingNormal')?.addEventListener('change', () => { selectedBonding = 'Normal'; });
    document.getElementById('bondingDistant')?.addEventListener('change', () => { selectedBonding = 'Distant'; });

    // Form submission
    const form = document.getElementById('mentalHealthForm');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            
            if (!selectedSleep || !selectedSupport) {
                showMentalToast('Please answer all questions.', 'error');
                return;
            }

            const overwhelmed = parseInt(document.getElementById('overwhelmedSlider')?.value || 5);
            
            const assessment = {
                mood: selectedMood,
                sleep: selectedSleep,
                overwhelmed: overwhelmed,
                bonding: selectedBonding,
                support: selectedSupport
            };

            saveMentalAssessment(assessment);
            showMentalToast('✓ Assessment saved successfully!', 'success');

            // Reset form
            form.reset();
            selectedMood = 'Happy';
            selectedSleep = null;
            selectedBonding = 'Normal';
            selectedSupport = null;
            
            setTimeout(() => {
                window.location.reload();
            }, 1500);
        });
    }
});
