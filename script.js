document.addEventListener('DOMContentLoaded', () => {

    // ---------------------------------------------------------
    // Validation Forge Scroll Animation Logic
    // ---------------------------------------------------------
    const forgeSection = document.getElementById('validation-forge');
    const progressLine = document.getElementById('progress-line');
    const forgeSteps = document.querySelectorAll('.forge-step');

    function updateProgress() {
        if (!forgeSection) return;

        // Calculate section position relative to viewport
        const sectionRect = forgeSection.getBoundingClientRect();
        const sectionTop = sectionRect.top;
        const sectionHeight = sectionRect.height;
        const windowHeight = window.innerHeight;

        // Calculate progress: when section enters at bottom (windowHeight), progress = 0
        // when section exits at top (-sectionHeight), progress = 100
        let progress = 0;
        if (sectionTop < windowHeight && sectionTop + sectionHeight > 0) {
            progress = Math.max(0, Math.min(100, ((windowHeight - sectionTop) / (windowHeight + sectionHeight)) * 100));
        } else if (sectionTop + sectionHeight <= 0) {
            progress = 100;
        }

        // Update progress line
        if (progressLine) {
            progressLine.style.height = progress + '%';
        }

        // Update step states based on position in viewport
        forgeSteps.forEach((step, index) => {
            const stepRect = step.getBoundingClientRect();
            const stepCenter = stepRect.top + stepRect.height / 2;
            const isActive = stepCenter > 0 && stepCenter < windowHeight * 0.7;

            if (isActive) {
                step.setAttribute('data-active', '');
            } else {
                step.removeAttribute('data-active');
            }
        });
    }

    // Throttled scroll handler
    let scrollTimeout;
    window.addEventListener('scroll', () => {
        if (scrollTimeout) {
            window.cancelAnimationFrame(scrollTimeout);
        }
        scrollTimeout = window.requestAnimationFrame(updateProgress);
    });

    // Initial update
    updateProgress();

    // ---------------------------------------------------------
    // Mobile Menu Toggle
    // ---------------------------------------------------------
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    
    if (mobileMenuBtn && mobileMenu) {
        mobileMenuBtn.addEventListener('click', () => {
            mobileMenu.classList.toggle('hidden');
            mobileMenu.classList.toggle('flex');
        });
    }
    
    // ---------------------------------------------------------
    // Authentication State & Modals
    // ---------------------------------------------------------
    const authModal = document.getElementById('auth-modal');
    const loginBtns = document.querySelectorAll('.login-btn');
    const closeAuthModalBtn = document.getElementById('close-auth-modal');
    const loginForm = document.getElementById('login-form');
    
    const userState = {
        isLoggedIn: localStorage.getItem('isLoggedIn') === 'true',
        username: localStorage.getItem('username') || ''
    };
    
    // UI Elements dependent on auth state
    const chatbotContainer = document.getElementById('chatbot-container');
    const navAuthButtons = document.getElementById('nav-auth-buttons');
    const navUserButtons = document.getElementById('nav-user-buttons');
    const userNameDisplay = document.getElementById('user-name-display');
    const logoutBtn = document.getElementById('logout-btn');

    function updateUIAuthState() {
        const mobileAuthContainer = document.querySelector('#mobile-menu .mt-4.pt-4');
        const mobileLoginBtn = document.querySelector('#mobile-menu .login-btn');
        
        // Make sure we have a mobile logout button
        let mobileLogoutBtn = document.getElementById('mobile-logout-btn');
        if (!mobileLogoutBtn && mobileAuthContainer) {
            mobileLogoutBtn = document.createElement('button');
            mobileLogoutBtn.id = 'mobile-logout-btn';
            mobileLogoutBtn.className = 'text-left py-2 font-headline font-bold text-error';
            mobileLogoutBtn.textContent = 'Logout';
            mobileLogoutBtn.style.display = 'none';
            mobileLogoutBtn.addEventListener('click', () => {
                if (logoutBtn) logoutBtn.click();
            });
            mobileAuthContainer.appendChild(mobileLogoutBtn);
        }

        if (userState.isLoggedIn) {
            if(chatbotContainer) chatbotContainer.classList.remove('hidden');
            if(navAuthButtons) {
                navAuthButtons.style.setProperty('display', 'none', 'important');
            }
            if(navUserButtons) {
                navUserButtons.classList.remove('hidden');
                navUserButtons.classList.add('flex');
                navUserButtons.style.display = 'flex';
            }
            if(userNameDisplay) userNameDisplay.textContent = userState.username || 'Founder';
            
            if (mobileLoginBtn) mobileLoginBtn.style.display = 'none';
            if (mobileLogoutBtn) mobileLogoutBtn.style.display = 'block';

        } else {
            if(chatbotContainer) chatbotContainer.classList.add('hidden');
            if(navAuthButtons) {
                navAuthButtons.style.display = '';
            }
            if(navUserButtons) {
                navUserButtons.classList.add('hidden');
                navUserButtons.classList.remove('flex');
                navUserButtons.style.display = 'none';
            }
            handleChatbotToggle(false); // Close chat if open
            
            if (mobileLoginBtn) mobileLoginBtn.style.display = 'block';
            if (mobileLogoutBtn) mobileLogoutBtn.style.display = 'none';
        }
    }

    if (loginBtns && authModal && closeAuthModalBtn) {
        loginBtns.forEach(btn => btn.addEventListener('click', () => {
             authModal.classList.remove('hidden');
             authModal.classList.add('flex');
             if(mobileMenu) {
                 mobileMenu.classList.add('hidden');
                 mobileMenu.classList.remove('flex');
             }
        }));
        
        closeAuthModalBtn.addEventListener('click', () => {
            authModal.classList.add('hidden');
            authModal.classList.remove('flex');
        });
    }

    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const emailInput = document.getElementById('email').value;
            // Simulate login
            userState.isLoggedIn = true;
            userState.username = emailInput.split('@')[0] || 'Founder';
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('username', userState.username);
            
            // Close modal
            authModal.classList.add('hidden');
            authModal.classList.remove('flex');
            
            // Update UI
            updateUIAuthState();
            
            // Welcome message in chat
            setTimeout(() => {
                if(!chatOpenedBefore) {
                    handleChatbotToggle(true, true);
                    addChatMessage(`Welcome back, <b>${userState.username}</b>! Let's validate your next big idea. What would you like to do?`, 'bot', true);
                    setTimeout(() => {
                        addOptions(["Validate my idea", "Check Pricing", "How it works"]);
                    }, 400);
                }
            }, 800);
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            userState.isLoggedIn = false;
            userState.username = '';
            localStorage.setItem('isLoggedIn', 'false');
            localStorage.removeItem('username');
            updateUIAuthState();
        });
    }

    // Initialize UI on load
    updateUIAuthState();

    // ---------------------------------------------------------
    // Chatbot Logic
    // ---------------------------------------------------------
    const chatbotBubble = document.getElementById('chatbot-bubble');
    const chatbotWindow = document.getElementById('chatbot-window');
    const chatbotClose = document.getElementById('chatbot-close');
    const chatInput = document.getElementById('chat-input');
    const chatSendBtn = document.getElementById('chat-send-btn');
    const chatMessages = document.getElementById('chat-messages');
    let chatOpenedBefore = false;

    function handleChatbotToggle(open, isAutoGreeting = false) {
        if (!chatbotWindow) return;
        if (open) {
            chatbotWindow.classList.remove('hidden');
            chatbotWindow.classList.add('flex');
            chatbotBubble.classList.add('hidden');
            
            if (!chatOpenedBefore && !isAutoGreeting && chatMessages.children.length === 0) {
                simulateBotResponse(() => {
                    let nameStr = userState.isLoggedIn && userState.username ? ` <b>${userState.username}</b>` : '';
                    addChatMessage(`Hello${nameStr}! I'm Pitchsap Bot. Ready to validate your next big idea?`, 'bot', true);
                    setTimeout(() => {
                        window.addOptions(["Validate my idea", "Check Pricing", "How it works"]);
                    }, 400);
                }, 400);
            }
            chatOpenedBefore = true;
        } else {
            chatbotWindow.classList.add('hidden');
            chatbotWindow.classList.remove('flex');
            chatbotBubble.classList.remove('hidden');
        }
    }

    if (chatbotBubble) {
        chatbotBubble.addEventListener('click', () => handleChatbotToggle(true));
    }
    if (chatbotClose) {
        chatbotClose.addEventListener('click', () => handleChatbotToggle(false));
    }

    function addChatMessage(message, sender, isHtml = false) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `chat-message mb-3 flex flex-col w-full ${sender === 'user' ? 'items-end' : 'items-start'}`;
        
        const contentDiv = document.createElement('div');
        contentDiv.className = `max-w-[85%] rounded-xl px-4 py-3 text-sm leading-relaxed ${sender === 'user' ? 'bg-primary text-on-primary rounded-tr-none shadow-md' : 'bg-surface-container-highest text-on-surface rounded-tl-none border border-outline-variant/30 shadow-sm'}`;
        
        if (isHtml) {
            contentDiv.innerHTML = message;
        } else {
            contentDiv.textContent = message;
        }
        
        msgDiv.appendChild(contentDiv);
        chatMessages.appendChild(msgDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    let chatState = 'idle';

    // Make addOptions global within DOMContentLoaded to be called from the welcome timer
    window.addOptions = function(options) {
        const optionsDiv = document.createElement('div');
        optionsDiv.className = 'w-full flex flex-wrap gap-2 mt-2 justify-start pl-2 mb-3';
        
        options.forEach(opt => {
            const btn = document.createElement('button');
            btn.className = 'text-[11px] bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-full px-3 py-1.5 transition-colors font-bold cursor-pointer shadow-sm';
            btn.textContent = opt;
            btn.onclick = () => {
                optionsDiv.classList.add('opacity-50', 'pointer-events-none');
                addChatMessage(opt, 'user');
                processBotLogic(opt);
            };
            optionsDiv.appendChild(btn);
        });
        
        chatMessages.appendChild(optionsDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    };

    function simulateBotResponse(callback, delay = 800) {
        const typingId = 'typing-' + Date.now();
        const typingDiv = document.createElement('div');
        typingDiv.id = typingId;
        typingDiv.className = `chat-message mb-3 flex justify-start w-full`;
        typingDiv.innerHTML = `<div class="max-w-[80%] rounded-xl px-4 py-3 text-sm bg-surface-container-highest text-on-surface rounded-tl-none border border-outline-variant/30 flex space-x-1.5 items-center h-10 shadow-sm">
            <div class="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce"></div>
            <div class="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
            <div class="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce" style="animation-delay: 0.4s"></div>
        </div>`;
        chatMessages.appendChild(typingDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        setTimeout(() => {
            document.getElementById(typingId)?.remove();
            callback();
        }, delay + Math.random() * 500);
    }

    function processBotLogic(userMsg) {
        const msg = userMsg.toLowerCase();
        
        if (chatState === 'validating_industry') {
            simulateBotResponse(() => {
                addChatMessage(`Great. The <b>${userMsg}</b> sector is seeing a 24% YoY growth in AI integration. Who is your target audience?`, 'bot', true);
                chatState = 'validating_audience';
                window.addOptions(["Enterprise/B2B", "Small Businesses", "Consumers/B2C"]);
            });
            return;
        }

        if (chatState === 'validating_audience') {
            simulateBotResponse(() => {
                addChatMessage(`Understood. Targeting <b>${userMsg}</b>. I'm running your concept through 10,000+ simulation scenarios...`, 'bot', true);
                
                setTimeout(() => {
                    simulateBotResponse(() => {
                        addChatMessage(`<b>Validation Complete!</b><br>Score: <b>87/100</b> (High Potential)<br><i>Recommendation:</i> Proceed to MVP. Focus heavily on integration capabilities.`, 'bot', true);
                        chatState = 'idle';
                        window.addOptions(["Validate another idea", "Check Pricing", "Talk to an Expert"]);
                    }, 1500);
                }, 1000);
            });
            return;
        }

        let response = "";
        let options = [];
        let htmlResponse = false;

        if (msg.includes('hello') || msg.includes('hi') || msg.includes('hey')) {
            response = `Hello! I'm Pitchsap Bot. How can I assist with your startup validation today?`;
            options = ["Validate my idea", "Check Pricing", "How does this work?"];
        } else if(msg.includes('pricing') || msg.includes('cost')) {
            response = `We have three tiers:<br><br>• <b>Spark:</b> $0/mo (Entry)<br>• <b>Alpha:</b> $49/mo (Pro)<br>• <b>Nebula:</b> $199/mo (Enterprise)<br><br>The Forge highly recommends the Alpha tier!`;
            htmlResponse = true;
            options = ["Start Alpha Trial", "Compare Features", "Back to Menu"];
        } else if(msg.includes('validate') || msg.includes('idea')) {
            response = `Validating ideas is my specialty! Let's start the process. What industry is your startup in?`;
            chatState = 'validating_industry';
            options = ["SaaS / Software", "Fintech", "HealthTech", "E-commerce", "EdTech"];
        } else if (msg.includes('work') || msg.includes('how')) {
            response = `It's simple! We break down your concept, harvest real-world market signals, stress-test it with AI, and give you a forged verdict on its potential.`;
            options = ["Validate my idea", "View Demo"];
        } else if (msg.includes('competitor') || msg.includes('competition') || msg.includes('market')) {
            response = `Our Competitive Monitoring autonomously scans patents, news velocity, and hidden funding rounds in your exact niche. You see the landscape before launching.`;
            options = ["Validate my idea", "View Demo"];
        } else if (msg.includes('contact') || msg.includes('support') || msg.includes('expert')) {
            response = `You can connect directly with vetted industry veterans and our support team through our Expert Feedback Loop. Available across Pro plans.`;
            options = ["Contact Sales", "Check Pricing", "Community Discord"];
        } else if (msg.includes('feature') || msg.includes('capabilities') || msg.includes('what can')) {
            response = `Pitchsap equips you with deep Market Penetration Visuals, AI Stress Testing, Competitive Signal Monitoring, and direct Expert Feedback.`;
            options = ["Validate my idea", "Check Pricing"];
        } else {
            const dummyResponses = [
                "Interesting insight. Did you know the AI simulation stress tests are showing strong demand for nuanced tools like that?",
                "Let me analyze that request... The signals tell me we should focus on core validation first.",
                "That's a great point. How about we run a quick validation sprint on your core concept?",
                "I'm tracking thousands of data points on that. Should we start a deep market scan?"
            ];
            response = dummyResponses[Math.floor(Math.random() * dummyResponses.length)];
            options = ["Validate my idea", "Ask something else", "Help"];
        }

        simulateBotResponse(() => {
            addChatMessage(response, 'bot', htmlResponse);
            if (options.length > 0) {
                setTimeout(() => {
                   window.addOptions(options);
                }, 300);
            }
        });
    }

    if(chatSendBtn && chatInput) {
        const sendAction = () => {
            const val = chatInput.value.trim();
            if(val) {
                addChatMessage(val, 'user');
                chatInput.value = '';
                processBotLogic(val);
            }
        };

        chatSendBtn.addEventListener('click', sendAction);

        chatInput.addEventListener('keypress', (e) => {
            if(e.key === 'Enter') {
                e.preventDefault();
                sendAction();
            }
        });
    }
});
