import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const supabaseUrl = 'https://ebsqtjibhhckbciltzfb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVic3F0amliaGhja2JjaWx0emZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ5OTUyNjUsImV4cCI6MjEwMDU3MTI2NX0.FNMjDFVakfNZxp758wrIPTXQRww6p8DgipsGwMeV0do';
const supabase = createClient(supabaseUrl, supabaseKey);

const appContainer = document.getElementById('appContainer') || document.body;

function applyGlobalStyles() {
    document.documentElement.style.height = '100%';
    document.body.style.height = '100%';
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    document.body.style.background = 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)';
    document.body.style.backgroundAttachment = 'fixed';
    document.body.style.fontFamily = "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";
    document.body.style.color = 'white';
}
applyGlobalStyles();

let currentStudent = null;
let currentQuizId = null;
let currentQuizData = [];
let currentQuestionIndex = 0;
let userAnswers = {};
let timerInterval = null;
let timeLeft = 0;

function checkSavedSession() {
    const saved = localStorage.getItem('aquarius_current_student');
    if (saved) {
        try {
            currentStudent = JSON.parse(saved);
            renderStudentDashboard();
            return true;
        } catch (e) {
            localStorage.removeItem('aquarius_current_student');
        }
    }
    return false;
}

function renderAuthScreen() {
    appContainer.innerHTML = `
        <div style="min-height: 100vh; width: 100vw; display: flex; justify-content: center; align-items: center; box-sizing: border-box; padding: 20px;">
            <div style="background: rgba(255, 255, 255, 0.05); backdrop-filter: blur(16px); border: 1px solid rgba(255, 255, 255, 0.1); padding: 30px; border-radius: 20px; width: 100%; max-width: 420px; box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);">
                <div style="text-align: center; margin-bottom: 24px;">
                    <h1 style="font-size: 26px; font-weight: 700; color: #d8b4fe; margin-bottom: 8px;">🎓 Aquarius Kviz AI</h1>
                    <p style="font-size: 14px; color: #cbd5e1;">Zəhmət olmasa hesabınıza daxil olun və ya qeydiyyatdan keçin</p>
                </div>

                <div style="display: flex; gap: 10px; margin-bottom: 20px;">
                    <button id="showLoginTab" style="flex: 1; padding: 10px; background: #7e22ce; color: white; border: none; border-radius: 10px; font-weight: 600; cursor: pointer;">Giriş</button>
                    <button id="showRegisterTab" style="flex: 1; padding: 10px; background: rgba(255,255,255,0.1); color: #cbd5e1; border: none; border-radius: 10px; font-weight: 600; cursor: pointer;">Qeydiyyat</button>
                </div>

                <div id="formContainer"></div>
            </div>
        </div>
    `;

    document.getElementById('showLoginTab').addEventListener('click', (e) => {
        e.target.style.background = '#7e22ce';
        e.target.style.color = 'white';
        document.getElementById('showRegisterTab').style.background = 'rgba(255,255,255,0.1)';
        document.getElementById('showRegisterTab').style.color = '#cbd5e1';
        renderLoginForm();
    });

    document.getElementById('showRegisterTab').addEventListener('click', (e) => {
        e.target.style.background = '#7e22ce';
        e.target.style.color = 'white';
        document.getElementById('showLoginTab').style.background = 'rgba(255,255,255,0.1)';
        document.getElementById('showLoginTab').style.color = '#cbd5e1';
        renderRegisterForm();
    });

    renderLoginForm();
}

function inputStyle() {
    return "width: 100%; padding: 12px 14px; margin-bottom: 14px; background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.2); border-radius: 10px; color: white; font-size: 14px; outline: none; box-sizing: border-box; text-align: center;";
}

function buttonStyle() {
    return "width: 100%; padding: 12px; background: linear-gradient(135deg, #9333ea, #c084fc); color: white; border: none; border-radius: 10px; font-weight: 700; font-size: 15px; cursor: pointer; transition: 0.3s;";
}

function createPasswordFieldHTML(id, placeholder) {
    return `
        <div style="position: relative; width: 100%; margin-bottom: 14px;">
            <input type="password" id="${id}" placeholder="${placeholder}" required style="width: 100%; padding: 12px 45px 12px 45px; background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.2); border-radius: 10px; color: white; font-size: 14px; outline: none; box-sizing: border-box; text-align: center;">
            <span style="position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: rgba(255,255,255,0.5); font-size: 14px; user-select: none;">🔒</span>
            <span id="toggle_${id}" style="position: absolute; right: 12px; top: 50%; transform: translateY(-50%); cursor: pointer; font-size: 13px; font-weight: 600; background: rgba(255,255,255,0.1); padding: 4px 8px; border-radius: 6px; user-select: none; color: #d8b4fe;" title="Şifrəni göstər/gizlət">Göstər</span>
        </div>
    `;
}

function attachPasswordToggle(id) {
    const input = document.getElementById(id);
    const toggle = document.getElementById(`toggle_${id}`);
    
    if (input && toggle) {
        toggle.addEventListener('click', () => {
            if (input.type === "password") {
                input.type = "text";
                toggle.style.background = "#7e22ce";
                toggle.style.color = "white";
                toggle.textContent = "Gizlət";
            } else {
                input.type = "password";
                toggle.style.background = "rgba(255,255,255,0.1)";
                toggle.style.color = "#d8b4fe";
                toggle.textContent = "Göstər";
            }
        });
    }
}

function showLoadingScreen(message, callback) {
    appContainer.innerHTML = `
        <div style="min-height: 100vh; width: 100vw; display: flex; flex-direction: column; justify-content: center; align-items: center; box-sizing: border-box;">
            <div style="background: rgba(255, 255, 255, 0.05); backdrop-filter: blur(16px); border: 1px solid rgba(255, 255, 255, 0.1); padding: 40px; border-radius: 20px; text-align: center; box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);">
                <div style="border: 4px solid rgba(255, 255, 255, 0.1); border-top: 4px solid #c084fc; border-radius: 50%; width: 50px; height: 50px; animation: spin 1s linear infinite; margin: 0 auto 20px auto;"></div>
                <h3 style="font-size: 18px; color: #d8b4fe; margin: 0;">${message}</h3>
            </div>
        </div>
        <style>
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        </style>
    `;
    setTimeout(callback, 1500);
}

function renderLoginForm() {
    const container = document.getElementById('formContainer');
    container.innerHTML = `
        <form id="loginForm">
            <input type="text" id="loginName" placeholder="Adınız" required style="${inputStyle()}">
            <input type="text" id="loginSurname" placeholder="Soyadınız" required style="${inputStyle()}">
            ${createPasswordFieldHTML('loginPassword', 'Şifrəniz')}
            <button type="submit" style="${buttonStyle()}">Daxil Ol</button>
        </form>
    `;
    attachPasswordToggle('loginPassword');

    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('loginName').value.trim();
        const surname = document.getElementById('loginSurname').value.trim();
        const password = document.getElementById('loginPassword').value.trim();

        showLoadingScreen("Yüklənir...", async () => {
            try {
                const { data, error } = await supabase
                    .from('students_account')
                    .select('*')
                    .eq('name', name)
                    .eq('surname', surname)
                    .eq('password', password)
                    .single();

                if (error || !data) {
                    alert("Ad, Soyad və ya şifrə yanlışdır!");
                    renderAuthScreen();
                    return;
                }

                currentStudent = data;
                localStorage.setItem('aquarius_current_student', JSON.stringify(data));
                renderStudentDashboard();
            } catch (err) {
                alert("Giriş zamanı xəta baş verdi.");
                renderAuthScreen();
            }
        });
    });
}

function renderRegisterForm() {
    const container = document.getElementById('formContainer');
    container.innerHTML = `
        <form id="registerForm">
            <input type="text" id="regName" placeholder="Adınız" required style="${inputStyle()}">
            <input type="text" id="regSurname" placeholder="Soyadınız" required style="${inputStyle()}">
            <input type="text" id="regClass" placeholder="Sinfiniz (məsələn: 10A)" required style="${inputStyle()}">
            ${createPasswordFieldHTML('regPassword', 'Şifrə yarat')}
            <button type="submit" style="${buttonStyle()}">Qeydiyyatdan Keç</button>
        </form>
    `;
    attachPasswordToggle('regPassword');

    document.getElementById('registerForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('regName').value.trim();
        const surname = document.getElementById('regSurname').value.trim();
        const student_class = document.getElementById('regClass').value.trim();
        const password = document.getElementById('regPassword').value.trim();

        showLoadingScreen("Yüklənir...", async () => {
            try {
                const { data: existing } = await supabase
                    .from('students_account')
                    .select('*')
                    .eq('name', name)
                    .eq('surname', surname)
                    .single();

                if (existing) {
                    alert("Bu ad və soyadla artıq hesab mövcuddur. Zəhmət olmasa daxil olun.");
                    renderAuthScreen();
                    return;
                }

                const { data, error } = await supabase
                    .from('students_account')
                    .insert([{ name, surname, student_class, password }])
                    .select()
                    .single();

                if (error) throw error;

                currentStudent = data;
                localStorage.setItem('aquarius_current_student', JSON.stringify(data));
                renderStudentDashboard();
            } catch (err) {
                alert("Qeydiyyat xətası: " + err.message);
                renderAuthScreen();
            }
        });
    });
}

async function renderStudentDashboard() {
    appContainer.innerHTML = `
        <div style="min-height: 100vh; width: 100vw; box-sizing: border-box; padding: 20px;">
            <div style="width: 100%;">
                <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.05); backdrop-filter: blur(12px); padding: 16px 20px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.1); margin-bottom: 24px; box-sizing: border-box; width: 100%;">
                    <div>
                        <h2 style="font-size: 18px; color: #d8b4fe; margin: 0 0 4px 0;">Xoş gəldiniz, ${currentStudent.name} ${currentStudent.surname}</h2>
                        <p style="font-size: 13px; color: #94a3b8; margin: 0;">Sinif: ${currentStudent.student_class}</p>
                    </div>

                    <div>
                        <div id="profileCircle" class="mr-profile-container" style="width: 45px; height: 45px; border-radius: 50%; display: flex; justify-content: center; align-items: center; cursor: pointer; position: relative;" title="Profil menyusu">
                            <div class="mr-spinning-border"></div>
                            <div style="width: 100%; height: 100%; background: linear-gradient(135deg, #7e22ce, #a855f7); border-radius: 50%; display: flex; justify-content: center; align-items: center; font-weight: bold; font-size: 15px; color: white; position: relative; z-index: 2;">
                                MR
                            </div>
                        </div>
                    </div>
                </div>

                <h3 style="font-size: 18px; margin-bottom: 16px; color: #e2e8f0;">📝 Mövcud Sınaqlar</h3>
                <div id="quiz-container" style="display: flex; flex-wrap: wrap; gap: 16px; width: 100%;">
                    <p style="text-align: center; color: #94a3b8; padding: 20px; width: 100%;">Sınaqlar yüklənir...</p>
                </div>
            </div>
        </div>
        
        <div id="profileDropdown" style="display: none; position: fixed; background: rgba(20, 15, 40, 0.98); backdrop-filter: blur(16px); border: 1px solid rgba(255,255,255,0.15); border-radius: 14px; width: 200px; box-shadow: 0 10px 25px rgba(0,0,0,0.8); z-index: 99999; overflow: hidden;">
            <div style="position: relative; z-index: 2;">
                <button id="menuMyResults" style="width: 100%; padding: 12px 16px; background: none; border: none; color: white; text-align: left; cursor: pointer; font-size: 14px; border-bottom: 1px solid rgba(255,255,255,0.08); display: flex; align-items: center; gap: 10px;">
                    <img src="https://api.iconify.design/lucide:bar-chart-3.svg?color=%23a855f7" width="18" height="18" alt="Nəticələr" style="flex-shrink: 0;" /> Nəticələrim
                </button>
                <button id="menuChangePassword" style="width: 100%; padding: 12px 16px; background: none; border: none; color: white; text-align: left; cursor: pointer; font-size: 14px; border-bottom: 1px solid rgba(255,255,255,0.08); display: flex; align-items: center; gap: 10px;">
                    <img src="https://api.iconify.design/lucide:key-round.svg?color=%23a855f7" width="18" height="18" alt="Şifrə" style="flex-shrink: 0;" /> Şifrəni dəyişdir
                </button>
                <button id="menuLogout" style="width: 100%; padding: 12px 16px; background: none; border: none; color: #f87171; text-align: left; cursor: pointer; font-size: 14px; display: flex; align-items: center; gap: 10px;">
                    <img src="https://api.iconify.design/lucide:log-out.svg?color=%23f87171" width="18" height="18" alt="Çıxış" style="flex-shrink: 0;" /> Çıxış et
                </button>
            </div>
        </div>

        <style>
            @keyframes geminiGlowRotate {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            .mr-spinning-border {
                position: absolute;
                inset: -3px;
                border-radius: 50%;
                border: 3px solid transparent;
                border-top-color: #ef4444;
                border-right-color: #eab308;
                border-bottom-color: #22c55e;
                border-left-color: transparent;
                animation: geminiGlowRotate 3s cubic-bezier(0.4, 0, 0.2, 1) infinite;
                pointer-events: none;
                filter: drop-shadow(0 0 8px rgba(234, 179, 8, 0.7));
                z-index: 1;
                display: none;
            }
            .mr-profile-container:hover .mr-spinning-border {
                display: block;
            }
            .btn-disabled {
                opacity: 0.5;
                cursor: not-allowed !important;
                background: rgba(255, 255, 255, 0.08) !important;
                color: rgba(255, 255, 255, 0.4) !important;
                border: 1px solid rgba(255, 255, 255, 0.1) !important;
            }
        </style>
    `;

    const profileCircle = document.getElementById('profileCircle');
    const profileDropdown = document.getElementById('profileDropdown');

    profileCircle.addEventListener('click', (e) => {
        e.stopPropagation();
        const rect = profileCircle.getBoundingClientRect();
        if (profileDropdown.style.display === 'block') {
            profileDropdown.style.display = 'none';
        } else {
            profileDropdown.style.top = (rect.bottom + 8) + 'px';
            profileDropdown.style.right = (window.innerWidth - rect.right) + 'px';
            profileDropdown.style.display = 'block';
        }
    });

    document.addEventListener('click', (e) => {
        if (!profileCircle.contains(e.target) && !profileDropdown.contains(e.target)) {
            profileDropdown.style.display = 'none';
        }
    });

    document.getElementById('menuMyResults').addEventListener('click', () => {
        profileDropdown.style.display = 'none';
        renderStudentResultsView();
    });
    document.getElementById('menuChangePassword').addEventListener('click', () => {
        profileDropdown.style.display = 'none';
        renderChangePasswordModal();
    });
    document.getElementById('menuLogout').addEventListener('click', () => {
        profileDropdown.style.display = 'none';
        localStorage.removeItem('aquarius_current_student');
        currentStudent = null;
        renderAuthScreen();
    });

    await renderQuizCards();
}

async function renderQuizCards() {
    try {
        const [{ data: quizzes, error: quizError }, { data: results }] = await Promise.all([
            supabase.from('quizzes').select('*'),
            supabase.from('student_results').select('*').eq('student_name', currentStudent.name).eq('student_surname', currentStudent.surname)
        ]);

        const container = document.getElementById('quiz-container');

        if (quizError || !quizzes || quizzes.length === 0) {
            container.innerHTML = `<p style="text-align: center; color: #94a3b8; background: rgba(255,255,255,0.03); padding: 20px; border-radius: 12px; width: 100%;">Hazırda aktiv sınaq mövcud deyil.</p>`;
            return;
        }

        const resultMap = {};
        if (results) {
            results.forEach(r => {
                resultMap[String(r.quiz_id)] = r;
            });
        }

        container.innerHTML = '';
        quizzes.forEach(quiz => {
            const quizIdStr = String(quiz.id);
            const userResult = resultMap[quizIdStr];
            const isCompleted = !!userResult;

            const card = document.createElement('div');
            card.className = "quiz-card";
            card.style.cssText = "background: rgba(255, 255, 255, 0.05); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.1); padding: 20px; border-radius: 14px; display: flex; justify-content: space-between; align-items: center; box-sizing: border-box; width: 340px; min-height: 120px;";

            let actionButtonsHTML = '';
            if (isCompleted) {
                actionButtonsHTML = `
                    <div style="display: flex; gap: 8px; align-items: center;">
                        <button disabled class="btn-disabled" style="padding: 8px 14px; background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.4); border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; font-weight: 600; font-size: 13px; cursor: not-allowed; white-space: nowrap;">Bitdi</button>
                        <button id="view-res-btn-${quiz.id}" style="padding: 8px 14px; background: #00b4d8; color: white; border: none; border-radius: 10px; font-weight: 600; font-size: 13px; cursor: pointer; white-space: nowrap;">Nəticəm</button>
                    </div>
                `;
            } else {
                actionButtonsHTML = `
                    <button id="quiz-btn-${quiz.id}" class="start-btn" style="padding: 8px 16px; background: #7e22ce; color: white; border: none; border-radius: 10px; font-weight: 600; cursor: pointer; font-size: 13px; white-space: nowrap; flex-shrink: 0;">Sınağa Başla</button>
                `;
            }

            card.innerHTML = `
                <div style="overflow: hidden; padding-right: 10px;">
                    <h3 style="font-size: 15px; font-weight: 600; color: #f1f5f9; margin: 0 0 4px 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${quiz.title || `Test #${quiz.id}`}</h3>
                    <p style="font-size: 13px; color: #a78bfa; margin: 0;">⏱️ Müddət: ${quiz.duration ? quiz.duration + ' dəqiqə' : 'Məhdudiyyət yoxdur'}</p>
                </div>
                ${actionButtonsHTML}
            `;
            container.appendChild(card);

            if (isCompleted) {
                const resBtn = card.querySelector(`#view-res-btn-${quiz.id}`);
                if (resBtn) {
                    resBtn.addEventListener('click', () => {
                        renderDetailedReview(quiz, userResult);
                    });
                }
            } else {
                const startBtn = card.querySelector(`#quiz-btn-${quiz.id}`);
                if (startBtn) {
                    startBtn.addEventListener('click', () => startQuiz(quiz.id, startBtn));
                }
            }
        });
    } catch (err) {
        document.getElementById('quiz-container').innerHTML = `<p style="text-align: center; color: #f87171; width: 100%;">Sınaqları yükləmək mümkün olmadı.</p>`;
    }
}

function startQuiz(quizId, buttonElement) {
    if (buttonElement) {
        buttonElement.disabled = true;
        buttonElement.innerText = "Bitdi";
        buttonElement.classList.add("btn-disabled");
    }
    loadAndStartQuiz(quizId);
}

async function renderStudentResultsView() {
    appContainer.innerHTML = `
        <div style="min-height: 100vh; width: 100vw; box-sizing: border-box; padding: 20px;">
            <div style="width: 100%;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
                    <h2 style="font-size: 20px; color: #d8b4fe; margin: 0;">📊 Sənin Nəticələrin</h2>
                    <button id="backToDashboard" style="padding: 10px 18px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: white; border-radius: 10px; cursor: pointer; font-weight: 600;">Kabinetə qayıt</button>
                </div>
                <div id="resultsContainer" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; width: 100%;">
                    <p style="text-align: center; color: #94a3b8; padding: 20px; grid-column: 1 / -1;">Nəticələr yüklənir...</p>
                </div>
            </div>
        </div>
    `;

    document.getElementById('backToDashboard').addEventListener('click', renderStudentDashboard);

    try {
        const [{ data: results, error }, { data: quizzes }] = await Promise.all([
            supabase
                .from('student_results')
                .select('*')
                .eq('student_name', currentStudent.name)
                .eq('student_surname', currentStudent.surname),
            supabase.from('quizzes').select('id, title, questions_data, correct_answers')
        ]);

        const quizMap = {};
        const quizFullDataMap = {};
        if (quizzes) {
            quizzes.forEach(q => {
                quizMap[q.id] = q.title;
                quizFullDataMap[q.id] = q;
            });
        }

        const container = document.getElementById('resultsContainer');
        if (error || !results || results.length === 0) {
            container.innerHTML = `<p style="text-align: center; color: #94a3b8; background: rgba(255,255,255,0.03); padding: 20px; border-radius: 12px; grid-column: 1 / -1;">Hələ ki, heç bir sınaq nəticəniz yoxdur.</p>`;
            return;
        }

        container.innerHTML = '';
        results.forEach((res) => {
            const percent = Math.round((res.score / res.total) * 100);

            let detailsParsed = [];
            try {
                detailsParsed = typeof res.details_json === 'string' ? JSON.parse(res.details_json) : res.details_json;
            } catch(e) {}

            let correctCount = res.score;
            let incorrectCount = res.total - res.score;
            let blankCount = 0;

            if (Array.isArray(detailsParsed)) {
                correctCount = detailsParsed.filter(d => d.isCorrect).length;
                incorrectCount = detailsParsed.filter(d => !d.isCorrect && d.userAnswer !== "Cavabsız").length;
                blankCount = detailsParsed.filter(d => d.userAnswer === "Cavabsız").length;
            }

            const quizTitle = quizMap[res.quiz_id] || `Sınaq ${res.quiz_id}`;

            const cardDiv = document.createElement('div');
            cardDiv.style.cssText = "background: rgba(255, 255, 255, 0.05); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.1); padding: 20px; border-radius: 16px; display: flex; flex-direction: column; justify-content: space-between; gap: 16px; box-sizing: border-box; width: 100%; min-height: 160px;";

            cardDiv.innerHTML = `
                <div>
                    <h4 style="font-size: 16px; font-weight: 600; color: #f1f5f9; margin: 0 0 8px 0;">${quizTitle}</h4>
                    <p style="font-size: 14px; color: #cbd5e1; margin: 0 0 4px 0;">Nəticə: <b>${res.score} / ${res.total}</b></p>
                </div>
                <div style="display: flex; align-items: center; justify-content: space-between; gap: 10px;">
                    <div style="font-size: 12px; color: #94a3b8; display: flex; flex-direction: column; gap: 4px;">
                        <span style="color: #22c55e;">✅ Düz: ${correctCount}</span>
                        <span style="color: #ef4444;">❌ Səhv: ${incorrectCount}</span>
                        <span style="color: #eab308;">⚪ Boş: ${blankCount}</span>
                    </div>
                    <div style="width: 55px; height: 55px; border-radius: 50%; background: conic-gradient(#22c55e ${percent}%, #eab308 ${percent}% 80%, #ef4444 0%); display: flex; justify-content: center; align-items: center; position: relative; flex-shrink: 0;">
                        <div style="width: 43px; height: 43px; background: #18152e; border-radius: 50%; display: flex; justify-content: center; align-items: center; font-size: 12px; font-weight: bold; color: #d8b4fe;">
                            ${percent}%
                        </div>
                    </div>
                </div>
                <button data-quizid="${res.quiz_id}" data-resultid="${res.id}" class="reviewDetailsBtn" style="width: 100%; padding: 8px; background: rgba(126, 34, 206, 0.3); border: 1px solid rgba(168, 85, 247, 0.4); color: #d8b4fe; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 13px;">🔍 Suallara Bax</button>
            `;

            container.appendChild(cardDiv);
        });

        document.querySelectorAll('.reviewDetailsBtn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const quizId = e.target.getAttribute('data-quizid');
                const quizObj = quizFullDataMap[quizId];
                const resItem = results.find(r => r.id == e.target.getAttribute('data-resultid'));
                if (quizObj && resItem) {
                    renderDetailedReview(quizObj, resItem);
                } else {
                    alert("Məlumatı tapmaq mümkün olmadı.");
                }
            });
        });

    } catch (err) {
        document.getElementById('resultsContainer').innerHTML = `<p style="text-align: center; color: #f87171; grid-column: 1 / -1;">Nəticələri yükləmək mümkün olmadı.</p>`;
    }
}

function renderDetailedReview(quizObj, resultItem) {
    let questions = quizObj.questions_data;
    if (typeof questions === 'string') {
        try { questions = JSON.parse(questions); } catch(e) {}
    }

    let details = resultItem.details_json;
    if (typeof details === 'string') {
        try { details = JSON.parse(details); } catch(e) {}
    }

    let correctAnswers = quizObj.correct_answers;
    if (typeof correctAnswers === 'string') {
        try { correctAnswers = JSON.parse(correctAnswers); } catch(e) {}
    }

    let reviewHtml = `
        <div style="min-height: 100vh; width: 100vw; box-sizing: border-box; padding: 20px; display: flex; justify-content: center;">
            <div style="width: 100%; max-width: 600px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h2 style="font-size: 18px; color: #d8b4fe; margin: 0;">📋 Sınaq İcmalı: ${quizObj.title || 'Test'}</h2>
                    <button id="backToDashboardBtn" style="padding: 8px 14px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: white; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 13px;">Kabinetə qayıt</button>
                </div>
                <div style="display: flex; flex-direction: column; gap: 16px;">
    `;

    questions.forEach((q, idx) => {
        const options = q.options || q.choices || q.variants || [];
        const questionText = q.question || q.text || q.prompt || q.title || (typeof q === 'string' ? q : "");
        const explanation = q.explanation || q.izah || null;
        
        const detailItem = details ? details.find(d => d.questionIndex === idx + 1) : null;
        const userAnsText = detailItem ? detailItem.userAnswer : "Cavabsız";
        const isCorrect = detailItem ? detailItem.isCorrect : false;

        let correctAnsText = "Təyin olunmayıb";
        let rawCA = null;

        if (correctAnswers) {
            if (Array.isArray(correctAnswers) && correctAnswers[idx]) {
                rawCA = correctAnswers[idx].correctAnswerIndex !== undefined ? correctAnswers[idx].correctAnswerIndex : correctAnswers[idx].correctAnswer;
            } else if (typeof correctAnswers === 'object') {
                rawCA = correctAnswers[idx + 1] !== undefined ? correctAnswers[idx + 1] : correctAnswers[idx];
            }
        }

        if (rawCA !== null && rawCA !== undefined) {
            if (typeof rawCA === 'number' && options[rawCA]) {
                correctAnsText = options[rawCA];
            } else if (typeof rawCA === 'string') {
                const upper = rawCA.toUpperCase();
                const charCode = upper.charCodeAt(0);
                if (charCode >= 65 && charCode <= 90) {
                    const letterIdx = charCode - 65;
                    if (options[letterIdx]) {
                        correctAnsText = options[letterIdx];
                    } else {
                        correctAnsText = rawCA;
                    }
                } else {
                    correctAnsText = rawCA;
                }
            }
        } else if (q.correctAnswer !== undefined) {
            const qca = q.correctAnswer;
            if (typeof qca === 'number' && options[qca]) {
                correctAnsText = options[qca];
            } else {
                correctAnsText = qca;
            }
        }

        let optionsHtml = "";
        options.forEach((opt) => {
            let optStyle = "background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.1); color: white;";
            const isUserChoice = (userAnsText === opt);
            const isCorrectChoice = (correctAnsText === opt);

            if (isCorrectChoice) {
                optStyle = "background: rgba(34, 197, 94, 0.2); border: 1px solid #22c55e; color: #86efac; font-weight: bold;";
            } else if (isUserChoice && !isCorrect) {
                optStyle = "background: rgba(239, 68, 68, 0.2); border: 1px solid #ef4444; color: #fca5a5; font-weight: bold;";
            }

            optionsHtml += `<div style="padding: 10px 14px; margin-bottom: 6px; border-radius: 8px; font-size: 14px; ${optStyle}">${opt}</div>`;
        });

        const statusBadge = isCorrect 
            ? `<span style="background: rgba(34, 197, 94, 0.2); color: #22c55e; padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: bold;">Düzgün ✅</span>`
            : `<span style="background: rgba(239, 68, 68, 0.2); color: #ef4444; padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: bold;">Səhv ❌</span>`;

        let explanationHtml = "";
        if (explanation) {
            explanationHtml = `
                <div style="margin-top: 10px; padding: 10px 12px; background: rgba(168, 85, 247, 0.1); border: 1px solid rgba(168, 85, 247, 0.3); border-radius: 8px; font-size: 13px; color: #e9d5ff;">
                    💡 <b>Qısa izah:</b> ${explanation}
                </div>
            `;
        }

        reviewHtml += `
            <div style="background: rgba(255, 255, 255, 0.05); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.1); padding: 18px; border-radius: 14px; box-sizing: border-box;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <span style="font-size: 12px; font-weight: 600; color: #d8b4fe;">Sual ${idx + 1}</span>
                    ${statusBadge}
                </div>
                <p style="font-size: 15px; margin-bottom: 12px; color: #f1f5f9;">${questionText}</p>
                <div style="margin-bottom: 10px;">${optionsHtml}</div>
                <div style="font-size: 13px; color: #cbd5e1; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 8px; margin-top: 8px;">
                    Sizin cavab: <b style="color: ${isCorrect ? '#22c55e' : '#ef4444'};">${userAnsText}</b> | Düzgün cavab: <b style="color: #22c55e;">${correctAnsText}</b>
                </div>
                ${explanationHtml}
            </div>
        `;
    });

    reviewHtml += `
                </div>
            </div>
        </div>
    `;

    appContainer.innerHTML = reviewHtml;
    document.getElementById('backToDashboardBtn').addEventListener('click', renderStudentDashboard);
}

function renderChangePasswordModal() {
    appContainer.innerHTML = `
        <div style="min-height: 100vh; width: 100vw; box-sizing: border-box; padding: 20px; display: flex; justify-content: center; align-items: center;">
            <div style="background: rgba(255, 255, 255, 0.05); backdrop-filter: blur(16px); border: 1px solid rgba(255, 255, 255, 0.1); padding: 30px; border-radius: 20px; width: 100%; max-width: 400px;">
                <h3 style="font-size: 20px; color: #d8b4fe; margin-top: 0; margin-bottom: 20px; text-align: center;">🔑 Şifrəni Dəyişdir</h3>
                <form id="changePassForm">
                    ${createPasswordFieldHTML('oldPass', 'Köhnə şifrəniz')}
                    ${createPasswordFieldHTML('newPass', 'Yeni şifrəniz')}
                    <button type="submit" style="${buttonStyle()}; margin-bottom: 10px;">Şifrəni Yenilə</button>
                    <button type="button" id="cancelPassBtn" style="width: 100%; padding: 10px; background: rgba(255,255,255,0.1); border: none; border-radius: 10px; color: white; cursor: pointer; font-weight: 600;">Geri qayıt</button>
                </form>
            </div>
        </div>
    `;
    attachPasswordToggle('oldPass');
    attachPasswordToggle('newPass');

    document.getElementById('cancelPassBtn').addEventListener('click', renderStudentDashboard);

    document.getElementById('changePassForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const oldPass = document.getElementById('oldPass').value.trim();
        const newPass = document.getElementById('newPass').value.trim();

        if (oldPass !== currentStudent.password) {
            alert("Köhnə şifrə yanlışdır!");
            return;
        }

        try {
            const { error } = await supabase
                .from('students_account')
                .update({ password: newPass })
                .eq('id', currentStudent.id);

            if (error) throw error;

            currentStudent.password = newPass;
            localStorage.setItem('aquarius_current_student', JSON.stringify(currentStudent));
            alert("Şifrəniz uğurla yeniləndi!");
            renderStudentDashboard();
        } catch (err) {
            alert("Xəta baş verdi: " + err.message);
        }
    });
}

async function loadAndStartQuiz(quizId) {
    appContainer.innerHTML = `
        <div style="min-height: 100vh; width: 100vw; box-sizing: border-box; padding: 20px; display: flex; justify-content: center; align-items: center;">
            <div style="width: 100%; max-width: 400px; background: rgba(255, 255, 255, 0.05); backdrop-filter: blur(16px); border: 1px solid rgba(255, 255, 255, 0.1); padding: 24px; border-radius: 20px; color: white;">
                <div id="quizHeader" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                    <h2 id="quizTitle" style="font-size: 18px; color: #d8b4fe; margin: 0;">Sınaq yüklənir...</h2>
                </div>
                <div id="timerDisplay" style="display: flex; justify-content: center; align-items: center; background: rgba(126, 34, 206, 0.2); border: 1px solid rgba(168, 85, 247, 0.4); padding: 8px 16px; border-radius: 12px; font-weight: bold; color: #f87171; margin: 0 auto 16px auto; width: fit-content; font-size: 15px;"></div>
                <div id="questionBox" style="margin-bottom: 20px; font-size: 16px; line-height: 1.5;"></div>
                <div style="display: flex; justify-content: space-between; gap: 10px;">
                    <button id="prevQuestionBtn" style="flex: 1; padding: 10px; background: rgba(255,255,255,0.1); color: white; border: none; border-radius: 10px; font-weight: 600; cursor: pointer; display: none;">Geri</button>
                    <button id="nextQuestionBtn" style="flex: 1; padding: 10px; background: #7e22ce; color: white; border: none; border-radius: 10px; font-weight: 600; cursor: pointer;">Növbəti</button>
                </div>
            </div>
        </div>
    `;

    currentQuizId = quizId;
    try {
        const { data, error } = await supabase
            .from('quizzes')
            .select('title, questions_data, duration, correct_answers')
            .eq('id', quizId)
            .single();

        if (error || !data) throw new Error("Test tapılmadı.");

        document.getElementById('quizTitle').textContent = data.title || `Test #${quizId}`;

        let parsedData = data.questions_data;
        if (typeof parsedData === 'string') {
            try { parsedData = JSON.parse(parsedData); } catch(e) {}
        }

        currentQuizData = Array.isArray(parsedData) ? parsedData : [];
        if (currentQuizData.length === 0) throw new Error("Bu testdə suallar yoxdur.");

        currentQuestionIndex = 0;
        userAnswers = {};
        renderQuestion();

        const durationMinutes = data.duration || 0;
        if (durationMinutes > 0) {
            timeLeft = durationMinutes * 60;
            startTimer();
        } else {
            document.getElementById('timerDisplay').textContent = "Vaxt məhdudiyyəti yoxdur";
        }

        document.getElementById('nextQuestionBtn').addEventListener('click', handleNextQuestion);
        document.getElementById('prevQuestionBtn').addEventListener('click', handlePrevQuestion);

    } catch (err) {
        alert("Xəta: " + err.message);
        renderStudentDashboard();
    }
}

function startTimer() {
    clearInterval(timerInterval);
    const timerEl = document.getElementById('timerDisplay');
    
    timerInterval = setInterval(() => {
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            alert("Vaxt bitdi! Sınaq avtomatik təqdim olunur.");
            showResults();
            return;
        }
        timeLeft--;
        const mins = Math.floor(timeLeft / 60);
        const secs = timeLeft % 60;
        timerEl.innerHTML = `⏱️ Qalan vaxt: ${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }, 1000);
}

function renderQuestion() {
    const q = currentQuizData[currentQuestionIndex];
    let optionsHtml = "";
    const options = Array.isArray(q.options || q.choices || q.variants) ? (q.options || q.choices || q.variants) : [];

    options.forEach((opt, index) => {
        const isSelected = userAnswers[currentQuestionIndex] === index ? "background: rgba(126, 34, 206, 0.5); border-color: #a855f7;" : "background: rgba(0,0,0,0.2); border-color: rgba(255,255,255,0.1);";
        optionsHtml += `<button class="option-btn" data-index="${index}" style="width: 100%; text-align: left; padding: 12px 16px; margin-bottom: 10px; ${isSelected} border-radius: 10px; color: white; border-style: solid; border-width: 1px; cursor: pointer; transition: 0.2s; box-sizing: border-box;">${opt}</button>`;
    });

    const questionText = q.question || q.text || q.prompt || q.title || (typeof q === 'string' ? q : "");

    document.getElementById('questionBox').innerHTML = `
        <p style="margin-bottom: 8px; font-weight: 600; font-size: 13px; color: #d8b4fe;">Sual ${currentQuestionIndex + 1} / ${currentQuizData.length}</p>
        <p style="margin-bottom: 16px; font-size: 15px;">${questionText}</p>
        <div>${optionsHtml}</div>
    `;

    document.querySelectorAll('.option-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const idx = parseInt(e.currentTarget.getAttribute('data-index'));
            userAnswers[currentQuestionIndex] = idx;
            renderQuestion();
        });
    });

    const prevBtn = document.getElementById('prevQuestionBtn');
    prevBtn.style.display = currentQuestionIndex === 0 ? "none" : "block";
    document.getElementById('nextQuestionBtn').textContent = currentQuestionIndex === currentQuizData.length - 1 ? "Bitdi" : "Növbəti";
}

function handleNextQuestion() {
    if (currentQuestionIndex < currentQuizData.length - 1) {
        currentQuestionIndex++;
        renderQuestion();
    } else {
        const nextBtn = document.getElementById('nextQuestionBtn');
        if (nextBtn) {
            nextBtn.disabled = true;
            nextBtn.innerText = "Bitdi";
            nextBtn.classList.add("btn-disabled");
        }
        showResults();
    }
}

function handlePrevQuestion() {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        renderQuestion();
    }
}

async function showResults() {
    clearInterval(timerInterval);

    let score = 0;
    const total = currentQuizData.length;
    const details = [];
    const correctAnswersData = [];

    try {
        const { data: quizData, error: quizError } = await supabase
            .from('quizzes')
            .select('correct_answers')
            .eq('id', currentQuizId)
            .single();

        if (quizError) throw quizError;

        let serverCorrectAnswers = quizData.correct_answers;
        if (typeof serverCorrectAnswers === 'string') {
            try {
                serverCorrectAnswers = JSON.parse(serverCorrectAnswers);
            } catch (e) {}
        }

        currentQuizData.forEach((q, idx) => {
            const userAnsIdx = userAnswers[idx];
            const rawOptions = q.options || q.choices || q.variants || [];
            
            let correctAnsIdx = 0;
            let rawCA = null;

            if (serverCorrectAnswers) {
                if (Array.isArray(serverCorrectAnswers) && serverCorrectAnswers[idx]) {
                    rawCA = serverCorrectAnswers[idx].correctAnswerIndex !== undefined ? serverCorrectAnswers[idx].correctAnswerIndex : serverCorrectAnswers[idx].correctAnswer;
                } else if (typeof serverCorrectAnswers === 'object') {
                    rawCA = serverCorrectAnswers[idx + 1] !== undefined ? serverCorrectAnswers[idx + 1] : serverCorrectAnswers[idx];
                }
            }

            if (rawCA !== null && rawCA !== undefined) {
                if (typeof rawCA === 'number') {
                    correctAnsIdx = rawCA;
                } else if (typeof rawCA === 'string') {
                    const upper = rawCA.toUpperCase();
                    const charCode = upper.charCodeAt(0);
                    if (charCode >= 65 && charCode <= 90) {
                        correctAnsIdx = charCode - 65;
                    } else {
                        const parsedNum = parseInt(rawCA);
                        if (!isNaN(parsedNum)) correctAnsIdx = parsedNum;
                    }
                }
            } else if (q.correctAnswer !== undefined) {
                correctAnsIdx = q.correctAnswer;
            }

            const isCorrect = (userAnsIdx !== undefined && userAnsIdx === parseInt(correctAnsIdx));
            if (isCorrect) score++;

            details.push({
                questionIndex: idx + 1,
                userAnswer: userAnsIdx !== undefined ? (rawOptions[userAnsIdx] || "Cavab seçilib") : "Cavabsız",
                isCorrect: isCorrect
            });

            correctAnswersData.push({
                questionIndex: idx + 1,
                correctAnswer: rawOptions[correctAnsIdx] || "Təyin olunmayıb"
            });
        });

        await supabase.from('student_results').insert([
            {
                quiz_id: parseInt(currentQuizId) || 0,
                student_name: currentStudent.name,
                student_surname: currentStudent.surname,
                student_class: currentStudent.student_class,
                score: score,
                total: total,
                details_json: JSON.stringify(details),
                correct_answers: JSON.stringify(correctAnswersData)
            }
        ]);
    } catch (err) {
        console.error("Nəticə yoxlanılarkən və ya yazılarkən xəta:", err);
    }

    const percent = Math.round((score / total) * 100);

    appContainer.innerHTML = `
        <div style="min-height: 100vh; width: 100vw; box-sizing: border-box; padding: 20px; display: flex; justify-content: center; align-items: center;">
            <div style="width: 100%; max-width: 400px; background: rgba(255, 255, 255, 0.05); backdrop-filter: blur(16px); border: 1px solid rgba(255, 255, 255, 0.1); padding: 30px; border-radius: 20px; text-align: center; color: white;">
                <h2 style="font-size: 24px; font-weight: bold; margin-bottom: 12px; color: #22c55e;">🎉 Sınaq Tamamlandı!</h2>
                <div style="background: rgba(34, 197, 94, 0.1); border: 1px solid rgba(34, 197, 94, 0.3); padding: 20px; border-radius: 12px; margin-bottom: 20px; display: flex; flex-direction: column; align-items: center; gap: 12px;">
                    <p style="font-size: 15px; margin: 0;">İştirakçı: <b>${currentStudent.name} ${currentStudent.surname}</b></p>
                    <p style="font-size: 18px; font-weight: bold; color: #22c55e; margin: 0;">Nəticə: ${score} / ${total}</p>
                    
                    <div style="width: 70px; height: 70px; border-radius: 50%; background: conic-gradient(#22c55e ${percent}%, rgba(255,255,255,0.1) 0%); display: flex; justify-content: center; align-items: center; position: relative;">
                        <div style="width: 54px; height: 54px; background: #18152e; border-radius: 50%; display: flex; justify-content: center; align-items: center; font-size: 14px; font-weight: bold; color: #d8b4fe;">
                            ${percent}%
                        </div>
                    </div>
                </div>
                <button id="backToCabinetBtn" style="padding: 12px 24px; background: #7e22ce; color: white; border: none; border-radius: 10px; font-weight: bold; cursor: pointer; width: 100%;">Kabinetə qayıt</button>
            </div>
        </div>
    `;

    document.getElementById('backToCabinetBtn').addEventListener('click', renderStudentDashboard);
}

window.addEventListener('DOMContentLoaded', () => {
    if (!checkSavedSession()) {
        renderAuthScreen();
    }
});
