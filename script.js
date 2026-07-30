import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const supabaseUrl = 'https://ebsqtjibhhckbciltzfb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVic3F0amliaGhja2JjaWx0emZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ5OTUyNjUsImV4cCI6MjEwMDU3MTI2NX0.FNMjDFVakfNZxp758wrIPTXQRww6p8DgipsGwMeV0do';
const supabase = createClient(supabaseUrl, supabaseKey);

const appContainer = document.getElementById('appContainer') || document.body;

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
    `;
    setTimeout(callback, 1200);
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
                    .ilike('name', name)
                    .ilike('surname', surname)
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
                    .ilike('name', name)
                    .ilike('surname', surname)
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
        <div class="main-wrapper">
            <div class="user-header">
                <div>
                    <h2>Xoş gəldiniz, ${currentStudent.name} ${currentStudent.surname}</h2>
                    <p>Sinif: ${currentStudent.student_class}</p>
                </div>

                <div id="profileCircle" class="user-avatar mr-profile-container" style="position: relative; cursor: pointer;" title="Profil menyusu">
                    <div class="mr-spinning-border"></div>
                    <span style="position: relative; z-index: 2;">MR</span>
                </div>
            </div>

            <h3 class="section-title">📝 Mövcud Sınaqlar</h3>
            <div id="quiz-container" class="quiz-grid">
                <p style="text-align: center; color: #a0aec0; padding: 20px; grid-column: 1/-1;">Sınaqlar yüklənir...</p>
            </div>
        </div>

        <div id="profileDropdown" style="display: none; position: fixed; background: rgba(20, 15, 40, 0.98); backdrop-filter: blur(16px); border: 1px solid rgba(255,255,255,0.15); border-radius: 14px; width: 200px; box-shadow: 0 10px 25px rgba(0,0,0,0.8); z-index: 99999; overflow: hidden;">
            <div style="position: relative; z-index: 2;">
                <button id="menuChangePassword" style="width: 100%; padding: 12px 16px; background: none; border: none; color: white; text-align: left; cursor: pointer; font-size: 14px; border-bottom: 1px solid rgba(255,255,255,0.08);">
                    🔑 Şifrəni dəyişdir
                </button>
                <button id="menuLogout" style="width: 100%; padding: 12px 16px; background: none; border: none; color: #f87171; text-align: left; cursor: pointer; font-size: 14px;">
                    🚪 Çıxış et
                </button>
            </div>
        </div>
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
            supabase.from('student_results').select('*')
        ]);

        const container = document.getElementById('quiz-container');

        if (quizError || !quizzes || quizzes.length === 0) {
            container.innerHTML = `<p style="text-align: center; color: #a0aec0; padding: 20px; grid-column: 1/-1;">Hazırda aktiv sınaq mövcud deyil.</p>`;
            return;
        }

        const currentStudentName = (currentStudent.name || '').trim().toLowerCase();
        const currentStudentSurname = (currentStudent.surname || '').trim().toLowerCase();

        const completedQuizIds = new Set();
        const resultMap = {};

        if (results && results.length > 0) {
            results.forEach(r => {
                const rName = (r.student_name || '').trim().toLowerCase();
                const rSurname = (r.student_surname || '').trim().toLowerCase();

                const isSameStudent = (r.student_id && String(r.student_id) === String(currentStudent.id)) || 
                                     (rName === currentStudentName && rSurname === currentStudentSurname);

                if (isSameStudent) {
                    const qId = String(r.quiz_id);
                    completedQuizIds.add(qId);
                    resultMap[qId] = r;
                }
            });
        }

        container.innerHTML = '';
        quizzes.forEach(quiz => {
            const quizIdStr = String(quiz.id);
            const isCompleted = completedQuizIds.has(quizIdStr);
            const userResult = resultMap[quizIdStr];

            const card = document.createElement('div');
            card.className = "quiz-card";

            let actionButtonsHTML = '';
            if (isCompleted) {
                actionButtonsHTML = `
                    <div class="btn-group" style="display: flex; gap: 8px;">
                        <button disabled class="btn completed-btn" style="background: #4b5563; color: #9ca3af; cursor: not-allowed; opacity: 0.8;">Bitdi</button>
                        <button id="view-res-btn-${quiz.id}" class="btn result-btn" style="background: #0284c7; color: white;">Nəticəm</button>
                    </div>
                `;
            } else {
                actionButtonsHTML = `
                    <button id="quiz-btn-${quiz.id}" class="btn start-btn">Sınağa Başla</button>
                `;
            }

            card.innerHTML = `
                <div class="quiz-info">
                    <h4>${quiz.title || `Sınaq ${quiz.id}`}</h4>
                    <p>⏱️ Müddət: ${quiz.duration ? quiz.duration + ' dəqiqə' : 'Məhdudiyyət yoxdur'}</p>
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
                    startBtn.addEventListener('click', () => loadAndStartQuiz(quiz.id));
                }
            }
        });
    } catch (err) {
        console.error("Kartlar render olunarkən xəta:", err);
        document.getElementById('quiz-container').innerHTML = `<p style="text-align: center; color: #ff4d6d; grid-column: 1/-1;">Sınaqları yükləmək mümkün olmadı.</p>`;
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
        <div class="main-wrapper">
            <div class="user-header">
                <div>
                    <h2>📋 Sınaq İcmalı: ${quizObj.title || 'Test'}</h2>
                    <p>Topladığınız Xal: <b style="color: #00f5d4;">${resultItem.score} / ${resultItem.total}</b></p>
                </div>
                <button id="backToDashboardBtn" class="btn secondary-btn">Kabinetə qayıt</button>
            </div>
            <div style="display: flex; flex-direction: column; gap: 16px;">
    `;

    questions.forEach((q, idx) => {
        const options = q.options || q.choices || q.variants || [];
        const questionText = q.question || q.text || q.prompt || q.title || (typeof q === 'string' ? q : "");
        
        const simpleExplanation = q.simpleExplanation || q.explanation || q.izah || "Sual üçün sadə izah təyin olunmayıb.";
        const detailedExplanation = q.detailedExplanation || q.detailed_explanation || "Sual üçün mürəkkəb ətraflı izah təyin olunmayıb.";

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
            let optStyle = "background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #cbd5e1;";
            const isUserChoice = (userAnsText === opt);
            const isCorrectChoice = (correctAnsText === opt);

            if (isUserChoice) {
                if (isCorrect) {
                    optStyle = "background: rgba(34, 197, 94, 0.2); border: 1px solid #22c55e; color: #4ade80; font-weight: bold;";
                } else {
                    optStyle = "background: rgba(239, 68, 68, 0.2); border: 1px solid #ef4444; color: #f87171; font-weight: bold;";
                }
            } else if (isCorrectChoice && !isCorrect) {
                optStyle = "background: rgba(34, 197, 94, 0.1); border: 1px solid rgba(34, 197, 94, 0.4); color: #4ade80;";
            }

            optionsHtml += `<div style="padding: 10px 14px; margin-bottom: 8px; border-radius: 8px; font-size: 14px; ${optStyle}">${opt}</div>`;
        });

        const borderClass = isCorrect ? "review-correct" : "review-wrong";
        const statusBadge = isCorrect 
            ? `<span style="background: rgba(34, 197, 94, 0.2); color: #22c55e; padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: bold;">Düzgün ✅</span>`
            : `<span style="background: rgba(239, 68, 68, 0.2); color: #ef4444; padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: bold;">Səhv ❌</span>`;

        reviewHtml += `
            <div class="review-item ${borderClass}">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <span style="font-size: 13px; font-weight: 600; color: #e0aaff;">Sual ${idx + 1}</span>
                    ${statusBadge}
                </div>
                <p style="font-size: 15px; margin-bottom: 12px; color: #f1f5f9;">${questionText}</p>
                <div style="margin-bottom: 10px;">${optionsHtml}</div>

                <div class="explanation-box">
                    <div style="font-weight: bold; margin-bottom: 4px; color: #00f5d4;">💡 Gemini AI Sadə İzah:</div>
                    <p style="margin: 0; line-height: 1.4; color: #ffffff;">${simpleExplanation}</p>

                    <div style="margin-top: 10px; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.1);">
                        <button class="toggle-exp-btn" data-index="${idx}" style="background: transparent; border: none; color: #00b4d8; font-size: 13px; font-weight: bold; cursor: pointer; display: flex; align-items: center; gap: 6px; padding: 0;">
                            <span>Daha mürəkkəb / ətraflı izah</span>
                            <span id="arrow-${idx}">↓</span>
                        </button>

                        <div id="detailed-exp-${idx}" style="display: none; margin-top: 8px; padding: 10px; background: rgba(0,0,0,0.4); border-radius: 8px; font-size: 13px; color: #cbd5e1; line-height: 1.4; border: 1px solid rgba(255,255,255,0.1);">
                            ${detailedExplanation}
                        </div>
                    </div>
                </div>
            </div>
        `;
    });

    reviewHtml += `
            </div>
        </div>
    `;

    appContainer.innerHTML = reviewHtml;
    document.getElementById('backToDashboardBtn').addEventListener('click', renderStudentDashboard);

    document.querySelectorAll('.toggle-exp-btn').forEach(btn => {
        btn.onclick = function() {
            const idx = this.getAttribute('data-index');
            const detailedBox = document.getElementById(`detailed-exp-${idx}`);
            const arrow = document.getElementById(`arrow-${idx}`);

            if (detailedBox.style.display === 'none') {
                detailedBox.style.display = 'block';
                arrow.textContent = '↑';
            } else {
                detailedBox.style.display = 'none';
                arrow.textContent = '↓';
            }
        };
    });
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
            <div style="width: 100%; max-width: 500px; background: rgba(255, 255, 255, 0.05); backdrop-filter: blur(16px); border: 1px solid rgba(255, 255, 255, 0.1); padding: 24px; border-radius: 20px; color: white;">
                <div id="quizHeader" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                    <h2 id="quizTitle" style="font-size: 18px; color: #d8b4fe; margin: 0;">Sınaq yüklənir...</h2>
                </div>
                <div id="timerDisplay" style="display: flex; justify-content: center; align-items: center; background: rgba(126, 34, 206, 0.2); border: 1px solid rgba(168, 85, 247, 0.4); padding: 8px 16px; border-radius: 12px; font-weight: bold; color: #f87171; margin: 0 auto 16px auto; width: fit-content; font-size: 15px;"></div>
                <div id="questionBox" style="margin-bottom: 20px; font-size: 16px; line-height: 1.5;"></div>
                <div style="display: flex; justify-content: space-between; gap: 10px;">
                    <button id="prevQuestionBtn" class="btn secondary-btn" style="display: none;">Geri</button>
                    <button id="nextQuestionBtn" class="btn start-btn" style="flex: 1;">Növbəti</button>
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
                student_id: currentStudent.id,
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
                <button id="backToCabinetBtn" class="btn start-btn" style="width: 100%;">Kabinetə qayıt</button>
            </div>
        </div>
    `;

    document.getElementById('backToCabinetBtn').addEventListener('click', renderStudentDashboard);
}

// =========================================================================
// AI SUAL YARADAN VƏ REDAKTƏ EDƏN NÜVƏ STRUKTUR (SUPABASE INTEGRATION)
// =========================================================================

/**
 * Müəyyən mövzu üzrə AI suallar yaradır və ya mövcud sualı yenidən işləyir.
 * @param {string} topic - Sınağın mövzusu
 * @param {number} questionCount - Yaradılacaq sual sayı (Standart: 5)
 * @returns {Array} Yaradılmış sual obyektləri massivi
 */
function generateAIQuestions(topic, questionCount = 5) {
    const generatedQuestions = [];
    
    for (let i = 1; i <= questionCount; i++) {
        generatedQuestions.push({
            questionIndex: i,
            question: `${topic} mövzusu üzrə Sual #${i}: Bu mövzudakı əsas prinsiplərdən hansı doğrudur?`,
            options: [
                `A) ${topic} üçün standart cavab A`,
                `B) ${topic} üçün alternative cavab B`,
                `C) ${topic} üçün doğru cavab C`,
                `D) ${topic} üçün yanlış cavab D`
            ],
            correctAnswerIndex: 2, // 0-based index (C bəndi)
            simpleExplanation: `Bu sualın doğru cavabı C variantıdır, çünki ${topic} mövzusunda əsas şərt budur.`,
            detailedExplanation: `${topic} mövzusu üzrə dərin təhlil: A və B variantları konsepsiyaya tam uyğun gəlmir, D variantı isə əks fikirdir. Doğru yanaşma C-də göstərilmişdir.`
        });
    }

    return generatedQuestions;
}

/**
 * AI tərəfindən yaradılmış və ya yenilənmiş sualları Supabase bazasında 'quizzes' cədvəlinə saxlayır.
 * @param {string} title - Sınaq başlığı
 * @param {Array} questionsData - Sualların siyahısı
 * @param {number} durationMinutes - Müddət (dəqiqə ilə)
 */
async function saveAIQuizToSupabase(title, questionsData, durationMinutes = 15) {
    try {
        const correctAnswersFormat = questionsData.map((q, idx) => ({
            questionIndex: idx + 1,
            correctAnswerIndex: q.correctAnswerIndex
        }));

        const { data, error } = await supabase
            .from('quizzes')
            .insert([
                {
                    title: title,
                    questions_data: JSON.stringify(questionsData),
                    correct_answers: JSON.stringify(correctAnswersFormat),
                    duration: durationMinutes
                }
            ])
            .select();

        if (error) {
            console.error("Supabase-ə yazarkən xəta baş verdi:", error);
            return null;
        }

        return data;
    } catch (err) {
        console.error("Sorğu icra olunarkən xəta:", err);
        return null;
    }
}

/**
 * Mövcud sınaq sualını AI vasitəsilə redaktə edib yeniləyir.
 * @param {number} quizId - Yenilənəcək sınağın ID-si
 * @param {number} targetQuestionIndex - Dəyişdiriləcək sualın indeksi (0-dan başlayan)
 * @param {Object} newQuestionObj - Yeni sual obyekti
 */
async function editQuizQuestionWithAI(quizId, targetQuestionIndex, newQuestionObj) {
    try {
        const { data: quiz, error: fetchError } = await supabase
            .from('quizzes')
            .select('*')
            .eq('id', quizId)
            .single();

        if (fetchError || !quiz) {
            console.error("Sınaq tapılmadı:", fetchError);
            return false;
        }

        let questions = typeof quiz.questions_data === 'string' 
            ? JSON.parse(quiz.questions_data) 
            : quiz.questions_data;

        if (targetQuestionIndex >= 0 && targetQuestionIndex < questions.length) {
            questions[targetQuestionIndex] = newQuestionObj;
        } else {
            console.error("Sual indeksi çərçivədən kənardır.");
            return false;
        }

        const updatedCorrectAnswers = questions.map((q, idx) => ({
            questionIndex: idx + 1,
            correctAnswerIndex: q.correctAnswerIndex !== undefined ? q.correctAnswerIndex : 0
        }));

        const { error: updateError } = await supabase
            .from('quizzes')
            .update({
                questions_data: JSON.stringify(questions),
                correct_answers: JSON.stringify(updatedCorrectAnswers)
            })
            .eq('id', quizId);

        if (updateError) {
            console.error("Supabase güncəlləmə xətası:", updateError);
            return false;
        }

        return true;
    } catch (err) {
        console.error("Redaktə prosesində xəta:", err);
        return false;
    }
}

window.addEventListener('DOMContentLoaded', () => {
    if (!checkSavedSession()) {
        renderAuthScreen();
    }
});
