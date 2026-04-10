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

// Load mental health history from server
async function loadMentalHistory() {
    const user = getCurrentUser();
    if (!user) return [];

    try {
        const response = await fetch(`/api/mentalhealth/data/${user.id}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) {
            console.warn('No history available from server');
            return [];
        }

        const data = await response.json();
        return data.data || [];
    } catch (error) {
        console.error('Error loading mental history:', error);
        return [];
    }
}

// Save assessment to server
async function saveMentalAssessment(assessment, riskLevel = 'Low') {
    const user = getCurrentUser();
    if (!user) return;

    try {
        const response = await fetch('/api/mentalhealth/data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: user.id,
                mood: assessment.mood,
                stressLevel: assessment.overwhelmed,
                riskLevel: riskLevel,
                notes: `Sleep: ${assessment.sleep}, Bonding: ${assessment.bonding}, Support: ${assessment.support}`
            })
        });

        if (!response.ok) throw new Error('Failed to save assessment');

        return await response.json();
    } catch (error) {
        console.error('Error saving assessment:', error);
        showMentalToast('Could not save to cloud, check connection.', 'error');
        throw error;
    }
}

// Get AI Analysis from Groq
async function getAIAnalysis(assessment) {
    try {
        const response = await fetch('/api/mentalhealth/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ assessment })
        });

        if (!response.ok) throw new Error('AI Analysis failed');

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error getting AI analysis:', error);
        // Fallback risk calculation if AI fails
        const risk = assessment.overwhelmed > 7 || assessment.support === 'No' || assessment.bonding === 'Distant' ? 'High' : (assessment.overwhelmed > 4 ? 'Moderate' : 'Low');
        return {
            analysis: "We've noted your responses. Remember that your health journey is important, and we're here to help.",
            riskLevel: risk,
            recommendations: []
        };
    }
}

// Update UI with AI Analysis
function updateAIAnalysisUI(data) {
    if (!data) return;

    const riskText = document.getElementById('riskLevelText');
    const analysisText = document.getElementById('aiAnalysisText');
    const recContainer = document.getElementById('mentalRecommendationsContainer');

    // Normalize risk level string
    const risk = (data.riskLevel || 'Low').trim().toLowerCase();
    const displayRisk = risk.charAt(0).toUpperCase() + risk.slice(1);

    // Update Analysis Text
    if (analysisText) {
        analysisText.innerHTML = `"${data.analysis}"`;
    }

    // Update Risk Level & Bar
    if (riskText) {
        riskText.textContent = displayRisk;

        // Remove existing colors
        riskText.classList.remove('text-emerald-500', 'text-amber-500', 'text-red-500');

        if (risk === 'high') riskText.classList.add('text-red-500');
        else if (risk === 'moderate') riskText.classList.add('text-amber-500');
        else riskText.classList.add('text-emerald-500');

        const barLow = document.getElementById('riskBarLow');
        const barMod = document.getElementById('riskBarMod');
        const barHigh = document.getElementById('riskBarHigh');

        if (barLow && barMod && barHigh) {
            // Reset colors
            barLow.className = 'h-full bg-slate-200 dark:bg-slate-800';
            barMod.className = 'h-full bg-slate-200 dark:bg-slate-800';
            barHigh.className = 'h-full bg-slate-200 dark:bg-slate-800';

            if (risk === 'low') {
                barLow.classList.add('bg-emerald-500');
                barLow.classList.remove('bg-slate-200', 'dark:bg-slate-800');
            } else if (risk === 'moderate') {
                barLow.classList.add('bg-emerald-500'); // Optional: show progress up to mod
                barMod.classList.add('bg-amber-500');
                barMod.classList.remove('bg-slate-200', 'dark:bg-slate-800');
            } else if (risk === 'high') {
                barLow.classList.add('bg-emerald-500');
                barMod.classList.add('bg-amber-500');
                barHigh.classList.add('bg-red-500');
                barHigh.classList.remove('bg-slate-200', 'dark:bg-slate-800');
            }
        }
    }

    // Update Recommendations
    if (recContainer && data.recommendations && data.recommendations.length > 0) {
        recContainer.innerHTML = data.recommendations.map(rec => `
            <div class="group bg-white dark:bg-slate-900/50 rounded-xl p-5 border border-rose-100 dark:border-rose-900/20 shadow-sm flex items-center gap-4 hover:border-primary transition-all cursor-pointer">
                <div class="size-12 bg-rose-100 rounded-xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                    <span class="material-symbols-outlined">${rec.type === 'Meditation' ? 'filter_drama' : (rec.type === 'Breathing' ? 'air' : 'self_improvement')}</span>
                </div>
                <div class="flex-1">
                    <h4 class="font-bold text-slate-800 dark:text-slate-200">${rec.name}</h4>
                    <p class="text-xs text-slate-500">${rec.benefit}</p>
                </div>
                <span class="material-symbols-outlined text-slate-300 group-hover:text-primary transition-colors">chevron_right</span>
            </div>
        `).join('');
    }
}

// Show AI Loading State
function setAILoading(isLoading) {
    const analysisText = document.getElementById('aiAnalysisText');
    const riskText = document.getElementById('riskLevelText');

    if (isLoading) {
        if (analysisText) analysisText.innerHTML = '<span class="flex items-center gap-2 font-medium bg-rose-50 dark:bg-rose-900/10 p-4 rounded-xl border border-rose-100/50"><span class="animate-pulse">AI is analyzing your response...</span></span>';
        if (riskText) riskText.textContent = '...';
    }
}

// Display mental health history
async function displayMentalHistory() {
    const historyModal = document.getElementById('mentalHealthHistoryModal');
    const historyContent = document.getElementById('mentalHistoryContent');
    const history = await loadMentalHistory();

    if (!history || history.length === 0) {
        historyContent.innerHTML = '<p class="text-slate-500 text-center py-8">No assessments yet. Submit an assessment to see records.</p>';
        historyModal.classList.remove('hidden');
        return;
    }

    // Newest first is handled by server ORDER BY recordDate DESC


    historyContent.innerHTML = history.map((entry, index) => {
        const submitDate = new Date(entry.recordDate);
        const dateStr = submitDate.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        // Use stored riskLevel if available, otherwise fallback
        const risk = (entry.riskLevel || '').toLowerCase();
        let stressClass = 'text-emerald-600';
        let stressLabel = 'Low';

        if (risk === 'high') {
            stressClass = 'text-red-600';
            stressLabel = 'High';
        } else if (risk === 'moderate') {
            stressClass = 'text-amber-600';
            stressLabel = 'Moderate';
        } else {
            // Fallback for older records
            if (entry.stressLevel > 6) { stressLabel = 'High'; stressClass = 'text-red-600'; }
            else if (entry.stressLevel > 4) { stressLabel = 'Moderate'; stressClass = 'text-amber-600'; }
        }

        return `
            <div class="mb-6 pb-6 border-b border-rose-100 dark:border-rose-900/20 last:border-0">
                <div class="flex items-center justify-between mb-4">
                    <div>
                        <p class="font-bold text-slate-900 dark:text-slate-100">📅 ${dateStr}</p>
                        <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">Record ID: #${entry.id || (history.length - index)}</p>
                    </div>
                    <div class="text-right">
                        <p class="font-bold ${stressClass}">Stress: ${stressLabel}</p>
                        <p class="text-xs text-slate-500">😊 ${entry.mood}</p>
                    </div>
                </div>
                <div class="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/30 text-sm border border-slate-100 dark:border-slate-800">
                    <p class="text-xs text-slate-500 mb-2 font-bold uppercase tracking-widest">Detail Summary</p>
                    <p class="text-slate-800 dark:text-slate-200 leading-relaxed">${entry.notes || 'No extra notes'}</p>
                </div>
            </div>
        `;
    }).join('');

    historyModal.classList.remove('hidden');
}

// Initialize form handlers
document.addEventListener('DOMContentLoaded', async function () {
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
            showMentalToast('Individual record deletion not yet implemented in backend.', 'info');
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
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const btn = document.getElementById('submitAssessmentBtn');
            const originalText = btn.innerHTML;

            try {
                btn.disabled = true;
                btn.innerHTML = 'Analyzing with AI...';

                const overwhelmed = parseInt(document.getElementById('overwhelmedSlider')?.value || 5);

                const assessment = {
                    mood: selectedMood,
                    sleep: selectedSleep,
                    overwhelmed: overwhelmed,
                    bonding: selectedBonding,
                    support: selectedSupport
                };

                // Show loading in result area
                setAILoading(true);

                // 1. Get AI Analysis FIRST to get the intelligent risk level
                const analysisData = await getAIAnalysis(assessment);

                // 2. Save to DB with the AI's determined riskLevel
                await saveMentalAssessment(assessment, analysisData.riskLevel);

                // 3. Update UI
                updateAIAnalysisUI(analysisData);

                showMentalToast('✓ AI Analysis completed!', 'success');

                // Reset form but don't reload so user can see AI result
                form.reset();
                selectedMood = 'Happy';
                selectedSleep = 'Disturbed';
                selectedBonding = 'Normal';
                selectedSupport = 'Yes';

                // Scroll to analysis section on mobile
                const analysisCard = document.getElementById('riskLevelText');
                if (window.innerWidth < 1024 && analysisCard) {
                    analysisCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }

            } catch (err) {
                showMentalToast('Failed to complete AI analysis.', 'error');
            } finally {
                btn.disabled = false;
                btn.innerHTML = originalText;
            }
        });
    }
});
