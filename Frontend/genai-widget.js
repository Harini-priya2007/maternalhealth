(function () {
  const API_BASE = 'http://localhost:5001';

  function getPageName() {
    const file = window.location.pathname.split('/').pop() || 'home.html';
    return file.replace('.html', '').toLowerCase();
  }

  function safeParse(value, fallback) {
    try {
      return JSON.parse(value);
    } catch (error) {
      return fallback;
    }
  }

  async function fetchJsonOrNull(url) {
    try {
      const response = await fetch(url);
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      return null;
    }
  }

  async function buildUserContext(page) {
    const userData = safeParse(localStorage.getItem('userData') || 'null', null) || {};
    const userEmail = userData.email || null;
    const userId = userData.id || null;

    const localHistory = {
      taskHistory: userEmail ? safeParse(localStorage.getItem(`taskHistory_${userEmail}`) || '[]', []) : [],
      checklistSubmissions: userEmail ? safeParse(localStorage.getItem(`checklist_${userEmail}`) || '[]', []) : [],
      mentalHistory: userEmail ? safeParse(localStorage.getItem(`mentalHistory_${userEmail}`) || '[]', []) : [],
      checklistState: safeParse(localStorage.getItem('homeChecklistState') || 'null', null)
    };

    // Log what was captured locally
    if (localHistory.mentalHistory.length > 0) {
      console.log(`📊 Mental History (${localHistory.mentalHistory.length} entries). Most recent:`, localHistory.mentalHistory[localHistory.mentalHistory.length - 1]);
    }
    if (localHistory.taskHistory.length > 0) {
      console.log(`📋 Task History (${localHistory.taskHistory.length} entries). Most recent:`, localHistory.taskHistory[localHistory.taskHistory.length - 1]);
    }

    const backendHistory = {
      anemia: null,
      cardio: null,
      jaundice: null,
      mentalhealth: null,
      dashboard: null
    };

    if (userId) {
      const [anemia, cardio, jaundice, mentalhealth, dashboard] = await Promise.all([
        fetchJsonOrNull(`${API_BASE}/api/anemia/hemoglobin-history/${userId}?limit=200`),
        fetchJsonOrNull(`${API_BASE}/api/cardio/heart-rate-history/${userId}?limit=200`),
        fetchJsonOrNull(`${API_BASE}/api/jaundice/data/${userId}`),
        fetchJsonOrNull(`${API_BASE}/api/mentalhealth/data/${userId}`),
        fetchJsonOrNull(`${API_BASE}/api/home/dashboard/${userId}`)
      ]);
      backendHistory.anemia = anemia;
      backendHistory.cardio = cardio;
      backendHistory.jaundice = jaundice;
      backendHistory.mentalhealth = mentalhealth;
      backendHistory.dashboard = dashboard;
    }

    return {
      page,
      capturedAt: new Date().toISOString(),
      profile: {
        id: userData.id || null,
        fullName: userData.fullName || null,
        email: userData.email || null,
        role: userData.role || null,
        createdAt: userData.createdAt || null
      },
      localHistory,
      backendHistory
    };
  }

  function createWidget() {
    const container = document.createElement('div');
    container.innerHTML = `
      <button id="genai-open-btn" style="position:fixed;right:20px;bottom:20px;z-index:9999;background:#fb7185;color:#fff;border:none;border-radius:999px;padding:12px 16px;font-weight:700;cursor:pointer;box-shadow:0 8px 20px rgba(0,0,0,0.15);">
        Ask AI
      </button>
      <div id="genai-modal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:10000;align-items:center;justify-content:center;padding:16px;">
        <div style="width:min(680px,100%);background:white;border-radius:16px;padding:16px;max-height:85vh;display:flex;flex-direction:column;gap:12px;">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <h3 style="margin:0;font-size:18px;font-weight:800;color:#111827;">Maternal Health AI</h3>
            <button id="genai-close-btn" style="border:none;background:transparent;font-size:22px;cursor:pointer;">×</button>
          </div>
          <div id="genai-chat" style="border:1px solid #f3e8ea;border-radius:12px;padding:10px;overflow:auto;min-height:220px;max-height:45vh;background:#fff9fa;"></div>
          <textarea id="genai-input" rows="3" placeholder="Ask anything about this page..." style="width:100%;border:1px solid #f3e8ea;border-radius:10px;padding:10px;resize:vertical;"></textarea>
          <div style="display:flex;justify-content:flex-end;gap:8px;">
            <button id="genai-send-btn" style="background:#fb7185;color:#fff;border:none;border-radius:10px;padding:10px 14px;font-weight:700;cursor:pointer;">Send</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(container);

    const openBtn = document.getElementById('genai-open-btn');
    const closeBtn = document.getElementById('genai-close-btn');
    const modal = document.getElementById('genai-modal');
    const sendBtn = document.getElementById('genai-send-btn');
    const input = document.getElementById('genai-input');
    const chat = document.getElementById('genai-chat');

    function appendBubble(text, mine) {
      const bubble = document.createElement('div');
      bubble.style.margin = '8px 0';
      bubble.style.display = 'flex';
      bubble.style.justifyContent = mine ? 'flex-end' : 'flex-start';
      bubble.innerHTML = `<div style="max-width:85%;padding:10px 12px;border-radius:10px;white-space:pre-wrap;background:${mine ? '#fb7185' : '#ffffff'};color:${mine ? 'white' : '#111827'};border:${mine ? 'none' : '1px solid #f3e8ea'};">${text}</div>`;
      chat.appendChild(bubble);
      chat.scrollTop = chat.scrollHeight;
    }

    async function sendMessage() {
      const message = input.value.trim();
      if (!message) return;

      appendBubble(message, true);
      input.value = '';
      sendBtn.disabled = true;
      sendBtn.textContent = 'Thinking...';

      try {
        const page = getPageName();
        const userContext = await buildUserContext(page);
        
        console.log('Sending AI message from page:', page);
        console.log('User context:', userContext);

        const response = await fetch(`${API_BASE}/api/genai/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message,
            page,
            userContext
          })
        });

        const data = await response.json();
        console.log('AI Response:', response.status, data);
        
        if (!response.ok) {
          appendBubble(`Error: ${data.error || data.details || 'Unable to get response right now.'}`, false);
          console.error('AI Error:', data);
          return;
        }

        appendBubble(data.reply || 'No response generated.', false);
      } catch (error) {
        console.error('Widget error:', error);
        appendBubble(`Error: ${error.message || 'Network error while contacting AI service.'}`, false);
      } finally {
        sendBtn.disabled = false;
        sendBtn.textContent = 'Send';
      }
    }

    openBtn.addEventListener('click', function () {
      modal.style.display = 'flex';
      if (!chat.children.length) {
        appendBubble('Hi! I am your maternal health AI assistant. How can I help you on this page?', false);
      }
      input.focus();
    });

    closeBtn.addEventListener('click', function () {
      modal.style.display = 'none';
    });

    modal.addEventListener('click', function (event) {
      if (event.target === modal) {
        modal.style.display = 'none';
      }
    });

    sendBtn.addEventListener('click', sendMessage);
    input.addEventListener('keydown', function (event) {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createWidget);
  } else {
    createWidget();
  }
  
  console.log('✅ Maternal Health AI Widget loaded');
})();
