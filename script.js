import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const supabaseUrl = 'https://ebsqtjibhhckbciltzfb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVic3F0amliaGhja2JjaWx0emZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ5OTUyNjUsImV4cCI6MjEwMDU3MTI2NX0.FNMjDFVakfNZxp758wrIPTXQRww6p8DgipsGwMeV0do';
const supabase = createClient(supabaseUrl, supabaseKey);

// DOM Elementləri
const appContainer = document.getElementById('appContainer') || document.body;

let currentStudent = null;
let currentQuizId = null;
let currentQuizData = [];
let currentQuestionIndex = 0;
let userAnswers = {};
let timerInterval = null;
let timeLeft = 0;

// Başlanğıc ekranını render edirik (Qeydiyyat və Giriş seçimi)
function renderAuthScreen() {
    appContainer.innerHTML = `
        <div style="min-height: 100vh; display: flex; justify-content: center; align-items: center; background: linear-gradient(135deg, #0f0c29, #302b63, #24243e); font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px;">
            <div style="background: rgba(255, 255, 255, 0.05); backdrop-filter: blur(16px); border: 1px solid rgba(255, 255, 255, 0.1); padding: 30px; border-radius: 20px; width: 100%; max-width: 420px; box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37); color: white;">
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
    return "width: 100%; padding: 12px 14px; margin-bottom: 14px; background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.2); border-radius: 10px; color: white; font-size: 14px; outline: none;";
}

function buttonStyle() {
    return "width: 100%; padding: 12px; background: linear-gradient(135deg, #9333ea, #c084fc); color: white; border: none; border-radius: 10px; font-weight: 700; font-size: 15px; cursor: pointer; transition: 0.3s;";
}

function renderLoginForm() {
    const container = document.getElementById('formContainer');
    container.innerHTML = `
        <form id="loginForm">
            <input type="text" id="loginName" placeholder="Adınız" required style="${inputStyle()}">
            <input type="text" id="loginSurname" placeholder="Soyadınız" required style="${inputStyle()}">
            <input type="password" id="loginPassword" placeholder="Şifrəniz (məsələn: P@ss123)" required style="${inputStyle()}">
            <button type="submit" style="${buttonStyle()}">Daxil Ol</button>
        </form>
    `;

    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('loginName').value.trim();
        const surname = document.getElementById('loginSurname').value.trim();
        const password = document.getElementById('loginPassword').value.trim();

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
                return;
            }

            currentStudent = data;
            renderStudentDashboard();
        } catch (err) {
            alert("Giriş zamanı xəta baş verdi. Zəhmət olmasa yenidən yoxlayın.");
        }
    });
}

function renderRegisterForm() {
    const container = document.getElementById('formContainer');
    container.innerHTML = `
        <form id="registerForm">
            <input type="text" id="regName" placeholder="Adınız" required style="${inputStyle()}">
            <input type="text" id="regSurname" placeholder="Soyadınız" required style="${inputStyle()}">
            <input type="text" id="regClass" placeholder="Sinfiniz (məsələn: 10A)" required style="${inputStyle()}">
            <input type="password" id="regPassword" placeholder="Şifrə yarat (məsələn: P@ss123)" required style="${inputStyle()}">
            <button type="submit" style="${buttonStyle()}">Qeydiyyatdan Keç</button>
        </form>
    `;

    document.getElementById('registerForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('regName').value.trim();
        const surname = document.getElementById('regSurname').value.trim();
        const student_class = document.getElementById('regClass').value.trim();
        const password = document.getElementById('regPassword').value.trim();

        try {
            // Əvvəlcə belə hesabın olub-olmadığını yoxlayaq
            const { data: existing } = await supabase
                .from('students_account')
                .select('*')
                .eq('name', name)
                .eq('surname', surname)
                .single();

            if (existing) {
                alert("Bu ad və soyadla artıq hesab mövcuddur. Zəhmət olmasa daxil olun.");
                return;
            }

            const { data, error } = await supabase
                .from('students_account')
                .insert([{ name, surname, student_class, password }])
                .select()
                .single();

            if (error) throw error;

            alert("Qeydiyyat uğurla tamamlandı! Hesabınıza daxil olursunuz.");
            currentStudent = data;
            renderStudentDashboard();
        } catch (err) {
            alert("Qeydiyyat xətası: " + err.message);
        }
    });
}

// Şagird Kabineti (Aktiv sınaqların siyahısı)
async function renderStudentDashboard() {
    appContainer.innerHTML = `
        <div style="min-height: 100vh; background: linear-gradient(135deg, #0f0c29, #302b63, #24243e); font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; color: white;">
            <div style="max-width: 700px; margin: 0 auto;">
                <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.05); backdrop-filter: blur(12px); padding: 20px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.1); margin-bottom: 24px;">
                    <div>
                        <h2 style="font-size: 20px; color: #d8b4fe; margin-bottom: 4px;">Xoş gəldiniz, ${currentStudent.name} ${currentStudent.surname}</h2>
                        <p style="font-size: 13px; color: #94a3b8;">Sinif: ${currentStudent.student_class}</p>
                    </div>
                    <button id="logoutBtn" style="padding: 8px 16px; background: rgba(239, 68, 68, 0.2); border: 1px solid rgba(239, 68, 68, 0.4); color: #f87171; border-radius: 8px; cursor: pointer; font-weight: 600;">Çıxış</button>
                </div>

                <h3 style="font-size: 18px; margin-bottom: 16px; color: #e2e8f0;">📝 Mövcud Sınaqlar</h3>
                <div id="quizzesList" style="display: flex; flex-direction: column; gap: 12px;">
                    <p style="text-align: center; color: #94a3b8; padding: 20px;">Sınaqlar yüklənir...</p>
                </div>
            </div>
        </div>
    `;

    document.getElementById('logoutBtn').addEventListener('click', () => {
        currentStudent = null;
        renderAuthScreen();
    });

    try {
        const { data: quizzes, error } = await supabase
            .from('quizzes')
            .select('id, title, duration');

        const listContainer = document.getElementById('quizzesList');

        if (error || !quizzes || quizzes.length === 0) {
            listContainer.innerHTML = `<p style="text-align: center; color: #94a3b8; background: rgba(255,255,255,0.03); padding: 20px; border-radius: 12px;">Hazırda aktiv sınaq mövcud deyil.</p>`;
            return;
        }

        listContainer.innerHTML = '';
        quizzes.forEach(quiz => {
            const card = document.createElement('div');
            card.style.cssText = "background: rgba(255, 255, 255, 0.05); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.1); padding: 18px; border-radius: 14px; display: flex; justify-content: space-between; align-items: center; transition: 0.3s;";
            card.innerHTML = `
                <div>
                    <h4 style="font-size: 16px; font-weight: 600; color: #f1f5f9; margin-bottom: 4px;">${quiz.title || `Test #${quiz.id}`}</h4>
                    <p style="font-size: 13px; color: #a78bfa;">⏱️ Müddət: ${quiz.duration ? quiz.duration + ' dəqiqə' : 'Məhdudiyyət yoxdur'}</p>
                </div>
                <button data-id="${quiz.id}" class="startQuizBtn" style="padding: 10px 20px; background: #7e22ce; color: white; border: none; border-radius: 10px; font-weight: 600; cursor: pointer;">Sınağa Başla</button>
            `;
            listContainer.appendChild(card);
        });

        document.querySelectorAll('.startQuizBtn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const quizId = e.target.getAttribute('data-id');
                loadAndStartQuiz(quizId);
            });
        });

    } catch (err) {
        document.getElementById('quizzesList').innerHTML = `<p style="text-align: center; color: #f87171;">Sınaqları yükləmək mümkün olmadı.</p>`;
    }
}

// Sınaq interfeysi
async function loadAndStartQuiz(quizId) {
    appContainer.innerHTML = `
        <div style="min-height: 100vh; background: linear-gradient(135deg, #0f0c29, #302b63, #24243e); font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; display: flex; justify-content: center; align-items: center;">
            <div style="width: 100%; max-width: 600px; background: rgba(255, 255, 255, 0.05); backdrop-filter: blur(16px); border: 1px solid rgba(255, 255, 255, 0.1); padding: 24px; border-radius: 20px; color: white;">
                <div id="quizHeader" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                    <h2 id="quizTitle" style="font-size: 18px; color: #d8b4fe;">Sınaq yüklənir...</h2>
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
            .select('title, questions_data, duration')
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
        optionsHtml += `<button class="option-btn" data-index="${index}" style="width: 100%; text-align: left; padding: 12px 16px; margin-bottom: 10px; ${isSelected} border-radius: 10px; color: white; border-style: solid; border-width: 1px; cursor: pointer; transition: 0.2s;">${opt}</button>`;
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
    document.getElementById('nextQuestionBtn').textContent = currentQuestionIndex === currentQuizData.length - 1 ? "Bitir" : "Növbəti";
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

    currentQuizData.forEach((q, idx) => {
        const userAnsIdx = userAnswers[idx];
        const correctAnsIdx = q.correctAnswer !== undefined ? q.correctAnswer : q.correct;
        const isCorrect = userAnsIdx === correctAnsIdx;
        if (isCorrect) score++;

        const rawOptions = q.options || q.choices || q.variants || [];
        details.push({
            questionIndex: idx + 1,
            userAnswer: userAnsIdx !== undefined ? (rawOptions[userAnsIdx] || "Cavab seçilib") : "Cavabsız",
            isCorrect: isCorrect
        });
    });

    const resultPayload = {
        student: currentStudent,
        score: score,
        total: total,
        details: details
    };

    // Supabase student_results cədvəlinə yazırıq
    try {
        await supabase.from('student_results').insert([
            {
                quiz_id: parseInt(currentQuizId) || 0,
                student_name: currentStudent.name,
                student_surname: currentStudent.surname,
                student_class: currentStudent.student_class,
                score: score,
                total: total,
                details_json: JSON.stringify(details)
            }
        ]);
    } catch (err) {
        console.error("Nəticə yazılarkən xəta:", err);
    }

    if (window.AndroidBridge && typeof window.AndroidBridge.onQuizFinished === 'function') {
        window.AndroidBridge.onQuizFinished(JSON.stringify(resultPayload));
    }

    appContainer.innerHTML = `
        <div style="min-height: 100vh; background: linear-gradient(135deg, #0f0c29, #302b63, #24243e); font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; display: flex; justify-content: center; align-items: center;">
            <div style="width: 100%; max-width: 450px; background: rgba(255, 255, 255, 0.05); backdrop-filter: blur(16px); border: 1px solid rgba(255, 255, 255, 0.1); padding: 30px; border-radius: 20px; text-align: center; color: white;">
                <h2 style="font-size: 24px; font-weight: bold; margin-bottom: 12px; color: #a855f7;">🎉 Sınaq Tamamlandı!</h2>
                <div style="background: rgba(126, 34, 206, 0.2); border: 1px solid rgba(168, 85, 247, 0.4); padding: 16px; border-radius: 12px; margin-bottom: 20px;">
                    <p style="font-size: 16px; margin-bottom: 6px;">İştirakçı: <b>${currentStudent.name} ${currentStudent.surname} (${currentStudent.student_class})</b></p>
                    <p style="font-size: 20px; font-weight: bold; color: #4ade80;">Nəticə: ${score} / ${total}</p>
                </div>
                <button id="backToCabinetBtn" style="padding: 12px 24px; background: #7e22ce; color: white; border: none; border-radius: 10px; font-weight: bold; cursor: pointer; width: 100%;">Kabinetə qayıt</button>
            </div>
        </div>
    `;

    document.getElementById('backToCabinetBtn').addEventListener('click', () => {
        renderStudentDashboard();
    });
}

// Tətbiq başladığı zaman auth səhifəsini çağırırıq
window.addEventListener('DOMContentLoaded', () => {
    renderAuthScreen();
});
