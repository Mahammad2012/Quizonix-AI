import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const supabaseUrl = 'https://ebsqtjibhhckbciltzfb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVic3F0amliaGhja2JjaWx0emZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ5OTUyNjUsImV4cCI6MjEwMDU3MTI2NX0.FNMjDFVakfNZxp758wrIPTXQRww6p8DgipsGwMeV0do';

const supabase = createClient(supabaseUrl, supabaseKey);

// DOM elementləri
const studentNameInput = document.getElementById("studentNameInput");
const studentSurnameInput = document.getElementById("studentSurnameInput");
const studentClassInput = document.getElementById("studentClassInput");
const studentPasswordInput = document.getElementById("studentPasswordInput"); // Yeni şifrə xanası

const registerBtn = document.getElementById("registerBtn"); // Qeydiyyat düyməsi
const loginBtn = document.getElementById("loginBtn");       // Daxil ol düyməsi

const searchSection = document.getElementById("searchSection");
const quizContainer = document.getElementById("quizContainer");
const loading = document.getElementById("loading");
const quizTitle = document.getElementById("quizTitle");
const questionBox = document.getElementById("questionBox");
const prevQuestionBtn = document.getElementById("prevQuestionBtn");
const nextQuestionBtn = document.getElementById("nextQuestionBtn");

let currentQuizId = null;
let currentQuizData = [];
let currentQuestionIndex = 0;
let userAnswers = {};
let studentInfo = {};
let timerInterval = null;
let timeLeft = 0;

// URL-dən Test ID-ni avtomatik oxuyuruq (məsələn: ?quizId=1)
window.addEventListener("DOMContentLoaded", () => {
    const urlParams = new URLSearchParams(window.location.search);
    currentQuizId = urlParams.get("quizId") || urlParams.get("id");
});

// 1. QEYDİYYATDAN KEÇ
registerBtn.addEventListener("click", async () => {
    const name = studentNameInput.value.trim();
    const surname = studentSurnameInput.value.trim();
    const studentClass = studentClassInput.value.trim();
    const password = studentPasswordInput.value.trim();

    if (!name || !surname || !studentClass || !password) {
        return alert("Zəhmət olmasa bütün sahələri (Ad, Soyad, Sinif və Şifrə) doldurun!");
    }

    try {
        loading.classList.remove("hidden");
        // Əvvəlcə belə istifadəçinin olub-olmadığını yoxlaya bilərik və ya birbaşa qeydiyyat edərik
        const { error } = await supabase.from('students_account').insert([
            { name, surname, student_class: studentClass, password }
        ]);

        if (error) throw error;

        alert("Uğurla qeydiyyatdan keçdiniz! İndi 'Daxil ol' düyməsini sıxın.");
    } catch (err) {
        alert("Qeydiyyat xətası: " + err.message);
    } finally {
        loading.classList.add("hidden");
    }
});

// 2. DAXİL OL
loginBtn.addEventListener("click", async () => {
    const name = studentNameInput.value.trim();
    const surname = studentSurnameInput.value.trim();
    const studentClass = studentClassInput.value.trim();
    const password = studentPasswordInput.value.trim();

    if (!name || !surname || !studentClass || !password) {
        return alert("Daxil olmaq üçün Ad, Soyad, Sinif və Şifrənizi daxil edin!");
    }

    try {
        loading.classList.remove("hidden");
        
        // students_account cədvəlində məlumatları yoxlayırıq
        const { data, error } = await supabase
            .from('students_account')
            .select('*')
            .eq('name', name)
            .eq('surname', surname)
            .eq('student_class', studentClass)
            .eq('password', password)
            .single();

        if (error || !data) {
            alert("Belə bir hesab tapılmadı və ya şifrə səhvdir! Zəhmət olmasa əvvəlcə qeydiyyatdan keçin.");
            return;
        }

        studentInfo = { name, surname, class: studentClass };
        
        // Əgər URL-də test ID yoxdursa default olaraq 1 götürürük
        if (!currentQuizId) currentQuizId = 1; 

        loadQuizFromDatabase(currentQuizId);

    } catch (err) {
        alert("Giriş xətası: Hesab tapılmadı və ya məlumatlar yanlışdır.");
    } finally {
        loading.classList.add("hidden");
    }
});

async function loadQuizFromDatabase(quizId) {
    loading.classList.remove("hidden");
    try {
        const { data, error } = await supabase
            .from('quizzes')
            .select('title, questions_data, duration')
            .eq('id', quizId)
            .single();

        if (error || !data) throw new Error("Test tapılmadı.");

        quizTitle.textContent = data.title || `Test #${quizId}`;

        let parsedData = data.questions_data;
        if (typeof parsedData === 'string') {
            try { parsedData = JSON.parse(parsedData); } catch(e) {}
        }

        currentQuizData = Array.isArray(parsedData) ? parsedData : [];
        if (currentQuizData.length === 0) throw new Error("Bu testdə suallar mövcud deyil.");

        currentQuestionIndex = 0;
        userAnswers = {};
        searchSection.classList.add("hidden");
        quizContainer.classList.remove("hidden");
        
        renderQuestion();

        const durationMinutes = data.duration || 0;
        if (durationMinutes > 0) {
            timeLeft = durationMinutes * 60;
            startTimer();
        } else {
            let timerEl = document.getElementById('timerDisplay');
            if (!timerEl) {
                timerEl = document.createElement('div');
                timerEl.id = 'timerDisplay';
                timerEl.style.cssText = "display: flex; justify-content: center; align-items: center; background: rgba(126, 34, 206, 0.2); border: 1px solid rgba(168, 85, 247, 0.4); padding: 8px 16px; border-radius: 12px; font-weight: bold; color: #f87171; margin: 0 auto 16px auto; width: fit-content; font-size: 15px;";
                timerEl.textContent = "Vaxt məhdudiyyəti yoxdur";
                quizContainer.prepend(timerEl);
            }
        }
    } catch (err) {
        alert("Xəta: " + err.message);
    } finally {
        loading.classList.add("hidden");
    }
}

function startTimer() {
    clearInterval(timerInterval);
    let timerEl = document.getElementById('timerDisplay');
    if (!timerEl) {
        timerEl = document.createElement('div');
        timerEl.id = 'timerDisplay';
        quizContainer.prepend(timerEl);
    }
    
    timerEl.style.cssText = "display: flex; justify-content: center; align-items: center; background: rgba(126, 34, 206, 0.2); border: 1px solid rgba(168, 85, 247, 0.4); padding: 8px 16px; border-radius: 12px; font-weight: bold; color: #f87171; margin: 0 auto 16px auto; width: fit-content; font-size: 15px;";

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
    if (!currentQuizData || currentQuizData.length === 0) return;
    const q = currentQuizData[currentQuestionIndex];
    let optionsHtml = "";
    const rawOptions = q.options || q.choices || q.variants || [];
    const options = Array.isArray(rawOptions) ? rawOptions : [];

    options.forEach((opt, index) => {
        const isSelected = userAnswers[currentQuestionIndex] === index ? "selected" : "";
        optionsHtml += `<button class="option-btn ${isSelected}" onclick="selectOption(${index})">${opt}</button>`;
    });

    const questionText = q.question || q.text || q.prompt || q.title || (typeof q === 'string' ? q : null);

    questionBox.innerHTML = `
        <p style="margin-bottom: 8px; font-weight: 600; font-size: 13px; color: #d8b4fe;">Sual ${currentQuestionIndex + 1} / ${currentQuizData.length}</p>
        <p style="margin-bottom: 12px;">${questionText || ""}</p>
        ${optionsHtml}
    `;

    prevQuestionBtn.style.display = currentQuestionIndex === 0 ? "none" : "block";
    nextQuestionBtn.textContent = currentQuestionIndex === currentQuizData.length - 1 ? "Bitir" : "Növbəti";
}

window.selectOption = function(optionIndex) {
    userAnswers[currentQuestionIndex] = optionIndex;
    renderQuestion();
};

nextQuestionBtn.addEventListener("click", () => {
    if (currentQuestionIndex < currentQuizData.length - 1) {
        currentQuestionIndex++;
        renderQuestion();
    } else {
        showResults();
    }
});

prevQuestionBtn.addEventListener("click", () => {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        renderQuestion();
    }
});

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
        student: studentInfo,
        score: score,
        total: total,
        details: details
    };

    try {
        await supabase.from('student_results').insert([
            {
                quiz_id: parseInt(currentQuizId) || 0,
                student_name: studentInfo.name,
                student_surname: studentInfo.surname,
                student_class: studentInfo.class,
                score: score,
                total: total,
                details_json: JSON.stringify(details)
            }
        ]);
    } catch (err) {
        console.error("Nəticə yazılmadı:", err);
    }

    if (window.AndroidBridge && typeof window.AndroidBridge.onQuizFinished === 'function') {
        window.AndroidBridge.onQuizFinished(JSON.stringify(resultPayload));
    }

    quizContainer.innerHTML = `
        <div style="text-align: center; color: white; padding: 20px;">
            <h2 style="font-size: 24px; font-weight: bold; margin-bottom: 12px; color: #a855f7;">🎉 Sınaq Tamamlandı!</h2>
            <div style="background: rgba(126, 34, 206, 0.2); border: 1px solid rgba(168, 85, 247, 0.4); padding: 16px; border-radius: 12px; margin-bottom: 20px;">
                <p style="font-size: 18px; margin-bottom: 6px;">Ad Soyad: <b>${studentInfo.name} ${studentInfo.surname} (${studentInfo.class})</b></p>
                <p style="font-size: 20px; font-weight: bold; color: #4ade80;">Nəticə: ${score} / ${total}</p>
            </div>
            <button onclick="location.reload()" style="background: #7e22ce; color: white; border: none; padding: 10px 20px; border-radius: 8px; font-weight: bold; cursor: pointer;">Yeni Sınaq</button>
        </div>
    `;
}
