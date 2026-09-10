// ===============================
// CGPA CALCULATOR
// ===============================

function calculateCGPA() {

    let marks = Number(document.getElementById("marks").value);

    if (marks === 0 || isNaN(marks)) {
        document.getElementById("result").innerHTML =
            "Please enter your marks.";
        return;
    }

    let cgpa = marks / 10;

    document.getElementById("result").innerHTML =
        "Your CGPA is: " + cgpa.toFixed(2);
}


// ===============================
// AI NOTES GENERATOR
// ===============================

async function generateNotes() {

    let topic = document.getElementById("topic").value.trim();
    let resultBox = document.getElementById("notesResult");

    if (topic === "") {
        resultBox.innerHTML =
            "<p>Please enter a topic first.</p>";
        return;
    }

    resultBox.innerHTML =
        "<p>🤖 AIVORA AI is creating your notes...</p>";

    try {

        let response = await fetch(
            "https://aivora-ai.vanshikagoel089.workers.dev/",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    mode: "study",

                    text:
                        "Create short, clear and exam-friendly study notes on: "
                        + topic
                })
            }
        );

        let data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.details?.error?.message ||
                data.error ||
                "AI request failed"
            );
        }

        if (!data.answer) {
            throw new Error(
                "No answer received from AI."
            );
        }

        let answer = data.answer;

        // Escape HTML
        answer = answer
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");

        // Remove escaped Markdown symbols
        answer = answer.replace(
            /\\([#*_`-])/g,
            "$1"
        );

        // Code blocks
        answer = answer.replace(
            /```(?:\w+)?\s*([\s\S]*?)```/g,
            "<pre class='ai-code'><code>$1</code></pre>"
        );

        // Headings
        answer = answer.replace(
            /^### (.*)$/gm,
            "<h4>$1</h4>"
        );

        answer = answer.replace(
            /^## (.*)$/gm,
            "<h3>$1</h3>"
        );

        answer = answer.replace(
            /^# (.*)$/gm,
            "<h2>$1</h2>"
        );

        // Bold
        answer = answer.replace(
            /\*\*(.*?)\*\*/g,
            "<strong>$1</strong>"
        );

        // Bullet points
        answer = answer.replace(
            /^\s*[\*\-]\s+(.*)$/gm,
            "<li>$1</li>"
        );

        // Line breaks
        answer = answer.replace(
            /\n/g,
            "<br>"
        );

        // Display AI Notes
        resultBox.innerHTML =
            "<h3>📝 AIVORA AI Notes</h3>" +
            "<div class='ai-answer'>" +
            answer +
            "</div>";

        // Add activity to dashboard
        addActivity(
            "AI Notes",
            "Topic: " + topic,
            "📝"
        );
        updateProgressStat("notes");

    } catch (error) {

        console.error(
            "AIVORA Notes Error:",
            error
        );

        resultBox.innerHTML =
            "<div class='ai-error'>" +
            "❌ <strong>AI Error:</strong><br>" +
            error.message +
            "</div>";
    }
}
// ===============================
// AI QUIZ GENERATOR
// ===============================

let quizData = [];
let currentQuestion = 0;
let quizScore = 0;
let quizTopic = "";

async function generateQuiz() {

    let topic =
        document.getElementById("quizTopic").value.trim();

    let resultBox =
        document.getElementById("quizResult");

    if (topic === "") {
        resultBox.innerHTML =
            "<p>Please enter a quiz topic first.</p>";
        return;
    }

    resultBox.innerHTML =
        "<div class='ai-answer'>" +
        "<h3>🤖 AIVORA AI is creating your quiz...</h3>" +
        "<p>Generating questions for you...</p>" +
        "</div>";

    try {

        let response = await fetch(
            "https://aivora-ai.vanshikagoel089.workers.dev/",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({

                    mode: "study",

                    text:
                        "Create a quiz on the topic: " +
                        topic +
                        ". Create exactly 5 multiple-choice questions. " +
                        "Return ONLY valid JSON in this exact format: " +
                        '[{"question":"Question text","options":["Option A","Option B","Option C","Option D"],"correctAnswer":0,"explanation":"Short explanation"}]. ' +
                        "correctAnswer must be the index 0, 1, 2, or 3 of the correct option. " +
                        "Do not use markdown. Do not add any text outside the JSON."
                })
            }
        );

        let data = await response.json();

        if (!response.ok) {

            throw new Error(
                data.details?.error?.message ||
                data.error ||
                "AI request failed"
            );
        }

        if (!data.answer) {

            throw new Error(
                "No quiz received from AI."
            );
        }

        let rawQuiz = data.answer.trim();

        rawQuiz = rawQuiz
            .replace(/^```json\s*/i, "")
            .replace(/^```\s*/i, "")
            .replace(/\s*```$/i, "")
            .trim();

        quizData = JSON.parse(rawQuiz);

        quizTopic = topic;

        if (!Array.isArray(quizData) || quizData.length === 0) {

            throw new Error(
                "Invalid quiz format received."
            );
        }

        currentQuestion = 0;
        quizScore = 0;

        showQuestion();

    } catch (error) {

        console.error(
            "AIVORA Quiz Error:",
            error
        );

       resultBox.innerHTML =
    "<div class='ai-error quiz-limit-message'>" +
    "<h3>⚡ AIVORA AI is taking a short break</h3>" +
    "<p>You've reached today's AI quiz limit.</p>" +
    "<p>✨ Please try again later.</p>" +
    "</div>";
    }
}


// ===============================
// SHOW QUIZ QUESTION
// ===============================

function showQuestion() {

    let resultBox =
        document.getElementById("quizResult");

    let q =
        quizData[currentQuestion];

    if (!q) {
        showFinalScore();
        return;
    }

    let optionsHTML = "";

    q.options.forEach(function(option, index) {

        optionsHTML +=

            "<button class='quiz-option' " +
            "onclick='selectQuizAnswer(" +
            index +
            ")'>" +
            option +
            "</button>";
    });

    resultBox.innerHTML =

        "<div class='ai-answer quiz-box'>" +

        "<div class='quiz-progress'>" +
        "Question " +
        (currentQuestion + 1) +
        " of " +
        quizData.length +
        "</div>" +

        "<h3>" +
        q.question +
        "</h3>" +

        "<div class='quiz-options'>" +
        optionsHTML +
        "</div>" +

        "<div id='quizFeedback'></div>" +

        "</div>";
}


// ===============================
// SELECT ANSWER
// ===============================
// ===============================
// SELECT ANSWER
// ===============================

function selectQuizAnswer(selectedIndex) {

    let q = quizData[currentQuestion];

    let feedbackBox =
        document.getElementById("quizFeedback");

    let buttons =
        document.querySelectorAll(".quiz-option");

    buttons.forEach(function(button) {
        button.disabled = true;
    });

    if (selectedIndex === q.correctAnswer) {

        quizScore++;

        feedbackBox.innerHTML =
            "<div class='quiz-correct'>" +
            "✅ Correct!<br>" +
            q.explanation +
            "</div>";

    } else {

        feedbackBox.innerHTML =
            "<div class='quiz-wrong'>" +
            "❌ Not quite.<br>" +
            "Correct answer: " +
            q.options[q.correctAnswer] +
            "<br><br>" +
            q.explanation +
            "</div>";
    }

    if (currentQuestion < quizData.length - 1) {

        feedbackBox.innerHTML +=
            "<button class='button quiz-next' " +
            "onclick='nextQuestion()'>" +
            "Next Question ➜" +
            "</button>";

    } else {

        feedbackBox.innerHTML +=
            "<button class='button quiz-next' " +
            "onclick='showFinalScore()'>" +
            "See Final Score 🎯" +
            "</button>";
    }
}
function nextQuestion() {

    currentQuestion++;

    showQuestion();
}

function showFinalScore() {

    let resultBox =
        document.getElementById("quizResult");

    let percentage =
        Math.round(
            (quizScore / quizData.length) * 100
        );

    let message = "";

    if (percentage >= 80) {

        message =
            "🔥 Excellent! You really know this topic.";

    } else if (percentage >= 60) {

        message =
            "👍 Good job! A little more revision will help.";

    } else {

        message =
            "📚 Keep learning! Try the quiz again after revising.";
    }

    resultBox.innerHTML =

        "<div class='ai-answer quiz-final'>" +

        "<h2>🎯 Quiz Completed!</h2>" +

        "<h3>Your Score</h3>" +

        "<div class='big-score'>" +
        quizScore +
        " / " +
        quizData.length +
        "</div>" +

        "<p>" +
        percentage +
        "%</p>" +

        "<p>" +
        message +
        "</p>" +

        "<button class='button quiz-next' " +
        "onclick='generateQuiz()'>" +
        "🔄 Generate New Quiz" +
        "</button>" +

        "</div>";

    addActivity(
        "AI Quiz",
        "Topic: " + quizTopic,
        "🧠"
    );

    localStorage.setItem(
        "aivoraLastQuizScore",
        percentage
    );

    localStorage.setItem(
        "aivoraLastQuizTopic",
        quizTopic
    );

    let quizHistory = JSON.parse(
        localStorage.getItem("aivoraQuizHistory") || "[]"
    );

    quizHistory.push({
        topic: quizTopic,
        score: percentage,
        date: new Date().toLocaleDateString()
    });

    localStorage.setItem(
        "aivoraQuizHistory",
        JSON.stringify(quizHistory)
    );
    updateProgressStat("quizzes");
renderAchievements();
}
// ===============================
// AI STUDY BUDDY
// ===============================

async function askStudyBuddy() {

    let question =
        document.getElementById("studyQuestion").value.trim();

    let resultBox =
        document.getElementById("studyResult");

    if (question === "") {
        resultBox.innerHTML =
            "<p>Please ask a question first.</p>";
        return;
    }

    resultBox.innerHTML =
        "<p>🤖 AIVORA AI is thinking...</p>";

    try {

        let response = await fetch(
            "https://aivora-ai.vanshikagoel089.workers.dev/",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    mode: "study",
                    text: question
                })
            }
        );

        let data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.details?.error?.message ||
                data.error ||
                "AI request failed"
            );
        }

        if (!data.answer) {
            throw new Error(
                "No answer received from AI."
            );
        }

        let answer = data.answer;

        answer = answer
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");

        answer = answer.replace(
            /\\([#*_`-])/g,
            "$1"
        );

        answer = answer.replace(
            /```(?:\w+)?\s*([\s\S]*?)```/g,
            "<pre class='ai-code'><code>$1</code></pre>"
        );

        answer = answer.replace(
            /^### (.*)$/gm,
            "<h4>$1</h4>"
        );

        answer = answer.replace(
            /^## (.*)$/gm,
            "<h3>$1</h3>"
        );

        answer = answer.replace(
            /^# (.*)$/gm,
            "<h2>$1</h2>"
        );

        answer = answer.replace(
            /\*\*(.*?)\*\*/g,
            "<strong>$1</strong>"
        );

        answer = answer.replace(
            /^\s*[\*\-]\s+(.*)$/gm,
            "<li>$1</li>"
        );

        answer = answer.replace(
            /\n/g,
            "<br>"
        );

        resultBox.innerHTML =
            "<h3>🤖 AIVORA Study Buddy</h3>" +
            "<div class='ai-answer'>" +
            answer +
            "</div>";
        addActivity(
    "Study Buddy",
    "Question: " + question,
    "🤖"
);

    } catch (error) {

        console.error(
            "AIVORA Study Buddy Error:",
            error
        );

        resultBox.innerHTML =
            "<div class='ai-error'>" +
            "❌ <strong>AI Error:</strong><br>" +
            error.message +
            "</div>";
    }
}

// ===============================
// AI CODE HELPER
// ===============================

async function helpWithCode() {

    let code =
        document.getElementById("codeInput").value.trim();

    let resultBox =
        document.getElementById("codeResult");

    if (code === "") {

        resultBox.innerHTML =
            "<p>Please paste your code first.</p>";

        return;
    }

    resultBox.innerHTML =
        "<p>🤖 AIVORA AI is analyzing your code...</p>";

    try {

        let response = await fetch(
            "https://aivora-ai.vanshikagoel089.workers.dev/",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    code: code
                })
            }
        );

        let data =
            await response.json();

        if (!response.ok) {

            throw new Error(
                data.details?.error?.message ||
                data.error ||
                "AI request failed"
            );
        }

        if (!data.answer) {

            throw new Error(
                "No answer received from AI."
            );
        }

        let answer = data.answer;

        answer = answer
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");

        answer = answer.replace(
            /\\([#*_`-])/g,
            "$1"
        );

        answer = answer.replace(
            /```(?:\w+)?\s*([\s\S]*?)```/g,
            "<pre class='ai-code'><code>$1</code></pre>"
        );

        answer = answer.replace(
            /^### (.*)$/gm,
            "<h4>$1</h4>"
        );

        answer = answer.replace(
            /^## (.*)$/gm,
            "<h3>$1</h3>"
        );

        answer = answer.replace(
            /^# (.*)$/gm,
            "<h2>$1</h2>"
        );

        answer = answer.replace(
            /\*\*(.*?)\*\*/g,
            "<strong>$1</strong>"
        );

        answer = answer.replace(
            /^\s*[\*\-]\s+(.*)$/gm,
            "<li>$1</li>"
        );

        answer = answer.replace(
            /\n/g,
            "<br>"
        );

        resultBox.innerHTML =
            "<h3>🤖 AIVORA AI</h3>" +
            "<div class='ai-answer'>" +
            answer +
            "</div>";

        addActivity(
            "Code Helper",
            "Code analyzed",
            "💻"
        );
updateProgressStat("codes");
    } catch (error) {

        console.error(
            "AIVORA Code Helper Error:",
            error
        );

        resultBox.innerHTML =
            "<div class='ai-error'>" +
            "❌ <strong>AI Error:</strong><br>" +
            error.message +
            "</div>";
    }
}
// ===============================
// STUDY PLANNER
// ===============================
let tasks = [];


// ===============================
// ADD STUDY TASK
// ===============================

function addTask() {

    let task =
        document.getElementById("taskInput").value.trim();

    let fileInput =
        document.getElementById("assignmentFile");

    if (task === "") {
        alert("Please enter a study task!");
        return;
    }

    let fileName = "";
    let fileURL = "";

    if (fileInput.files.length > 0) {

        let file = fileInput.files[0];

        fileName = file.name;

        fileURL =
            URL.createObjectURL(file);
    }

    tasks.push({
        task: task,
        fileName: fileName,
        fileURL: fileURL,
        completed: false
    });

    addActivity(
        "Study Planner",
        "Task: " + task,
        "📅"
    );

    document.getElementById("taskInput").value = "";

    fileInput.value = "";

    showTasks();
}


// ===============================
// SHOW TASKS
// ===============================

function showTasks() {

    let list = "";

    tasks.forEach(function(item, index) {

        list +=

            "<div class='task-card'>" +

            "<div class='task-info'>" +

            "<h3>📚 " +
            item.task +
            "</h3>" +

            (
                item.fileName !== ""

                ?

                "<p>📎 " +
                item.fileName +
                "</p>" +

                "<a href='" +
                item.fileURL +
                "' target='_blank' class='open-file'>" +
                "📖 Open Assignment" +
                "</a>"

                :

                "<p>📎 No assignment attached</p>"
            ) +

            "</div>" +

            "<div class='task-actions'>" +

            "<button onclick='completeTask(" +
            index +
            ")'>✅</button>" +

            "<button onclick='deleteTask(" +
            index +
            ")'>🗑️</button>" +

            "</div>" +

            "</div>";
    });

    document.getElementById("taskList").innerHTML =
        list;
}


// ===============================
// COMPLETE TASK
// ===============================

function completeTask(index) {

    if (!tasks[index].completed) {
        updateProgressStat("tasksCompleted");
        renderProgress();
    }

    tasks[index].completed =
        !tasks[index].completed;

    showTasks();
}

// ===============================
// DELETE TASK
// ===============================

function deleteTask(index) {

    tasks.splice(index, 1);

    showTasks();
}
// ===============================
// AI EXAM PREP MODE
// ===============================

async function generateExamPlan() {

    let subject =
        document.getElementById("examSubject").value.trim();

    let examDate =
        document.getElementById("examDate").value;

    let studyHours =
        document.getElementById("studyHours").value;

    let resultBox =
        document.getElementById("examPrepResult");

    if (subject === "" || examDate === "" || studyHours === "") {

        resultBox.innerHTML =
            "<p>Please fill all the details first.</p>";

        return;
    }

    resultBox.innerHTML =
        "<p>🤖 AIVORA AI is creating your exam preparation plan...</p>";

    try {

        let response = await fetch(
            "https://aivora-ai.vanshikagoel089.workers.dev/",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({

                    mode: "study",

                    text:
                        "Create a practical exam preparation plan for a student. " +
                        "Subject: " + subject +
                        ". Exam date: " + examDate +
                        ". Available study time: " +
                        studyHours +
                        " hours per day. " +
                        "Give a day-wise study plan, important topics, " +
                        "revision strategy, practice strategy and final revision tips. " +
                        "Keep it clear, realistic and student-friendly."
                })
            }
        );

        let data =
            await response.json();

        if (!response.ok) {

            throw new Error(
                data.details?.error?.message ||
                data.error ||
                "AI request failed"
            );
        }

        if (!data.answer) {

            throw new Error(
                "No study plan received from AI."
            );
        }

        let answer = data.answer;

        answer = answer
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");

        answer = answer.replace(
            /\*\*(.*?)\*\*/g,
            "<strong>$1</strong>"
        );

        answer = answer.replace(
            /^### (.*)$/gm,
            "<h4>$1</h4>"
        );

        answer = answer.replace(
            /^## (.*)$/gm,
            "<h3>$1</h3>"
        );

        answer = answer.replace(
            /\n/g,
            "<br>"
        );

        resultBox.innerHTML =
            "<h3>🚀 Your AI Exam Plan</h3>" +
            "<div class='ai-answer'>" +
            answer +
            "</div>";

        addActivity(
            "AI Exam Prep",
            "Subject: " + subject,
            "🚀"
        );

    } catch (error) {

        console.error(
            "AIVORA Exam Prep Error:",
            error
        );

        resultBox.innerHTML =
            "<div class='ai-error'>" +
            "❌ <strong>AI Error:</strong><br>" +
            error.message +
            "</div>";
    }
}
/* ================= AIVORA ACTIVITY SYSTEM ================= */

function addActivity(toolName, description, icon) {

    const activity = {
        name: toolName,
        description: description,
        icon: icon,
        time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit"
        })
    };

    let activities = JSON.parse(
        localStorage.getItem("aivoraActivities") || "[]"
    );

    activities.unshift(activity);

    activities = activities.slice(0, 3);

    localStorage.setItem(
        "aivoraActivities",
        JSON.stringify(activities)
    );

    renderActivities();
}


function renderActivities() {

    const panel = document.getElementById("activityPanel");

    if (!panel) return;

    const activities = JSON.parse(
        localStorage.getItem("aivoraActivities") || "[]"
    );

    if (activities.length === 0) return;

    const heading = panel.querySelector(".panel-heading");

    panel.innerHTML = "";

    panel.appendChild(heading);

    activities.forEach(activity => {

        const item = document.createElement("div");

        item.className = "activity-item";

        item.innerHTML = `
            <div class="activity-icon">${activity.icon}</div>

            <div>
                <strong>${activity.name}</strong>
                <p>${activity.description}</p>
            </div>

            <span>${activity.time}</span>
        `;

        panel.appendChild(item);
    });
}


document.addEventListener("DOMContentLoaded", function () {
    renderActivities();
});
/* ===============================
   NAVBAR ACTIVE LINK
================================ */

document.addEventListener("DOMContentLoaded", function () {

    const navLinks = document.querySelectorAll(".navbar a");

    navLinks.forEach(link => {

        link.addEventListener("click", function () {

            navLinks.forEach(item => {
                item.classList.remove("active");
            });

            this.classList.add("active");

        });

    });

});
/* ===============================
   AIVORA PROGRESS COUNTERS
================================ */
function showLevelUpNotification(level) {

    const old = document.getElementById("levelUpNotification");

    if (old) old.remove();

    const notification = document.createElement("div");

    notification.id = "levelUpNotification";

    notification.innerHTML = `
        <div class="level-up-icon">⚡</div>
        <div>
            <strong>LEVEL UP!</strong>
            <p>You reached Level ${level} 🎉</p>
        </div>
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.classList.add("show");
    }, 50);

    setTimeout(() => {
        notification.classList.remove("show");

        setTimeout(() => {
            notification.remove();
        }, 500);

    }, 3500);
}
function updateProgressStat(statName) {

    let stats = JSON.parse(
        localStorage.getItem("aivoraStats") || "{}"
    );

    stats[statName] = (stats[statName] || 0) + 1;

    let xp = Number(localStorage.getItem("aivoraXP") || 0);
    xp += 10;
    let oldLevel = Math.floor((xp - 10) / 100) + 1;
let newLevel = Math.floor(xp / 100) + 1;

if (newLevel > oldLevel) {
    showLevelUpNotification(newLevel);
}

    localStorage.setItem("aivoraXP", xp);

    localStorage.setItem(
        "aivoraStats",
        JSON.stringify(stats)
    );

    renderProgress();
    renderAivoraInsight();

    /* Achievement Notification */

    if (statName === "notes" && stats.notes === 1) {
        showAchievementNotification(
            "Note Maker",
            "You generated your first AI notes!"
        );
    }

    if (statName === "codes" && stats.codes === 1) {
        showAchievementNotification(
            "Code Master",
            "You used AI Code Helper!"
        );
    }

    if (statName === "quizzes" && stats.quizzes === 1) {
        showAchievementNotification(
            "First Quiz",
            "You completed your first quiz!"
        );
    }
}

function renderProgress() {

    let stats = JSON.parse(
        localStorage.getItem("aivoraStats") || "{}"
    );

    let quiz = document.getElementById("quizCount");
    let notes = document.getElementById("notesCount");
    let code = document.getElementById("codeCount");
    let tasks = document.getElementById("taskCount");
    let xp = document.getElementById("xpCount");
	let streak = document.getElementById("streakCount");
    if (quiz)
        quiz.textContent = stats.quizzes || 0;

    if (notes)
        notes.textContent = stats.notes || 0;

    if (code)
        code.textContent = stats.codes || 0;

    if (tasks)
        tasks.textContent = stats.tasksCompleted || 0;
    if (xp)
    xp.textContent = localStorage.getItem("aivoraXP") || 0;
    let currentXP = Number(localStorage.getItem("aivoraXP") || 0);
let level = Math.floor(currentXP / 100) + 1;
    
	let levelText = document.getElementById("levelText");
    let xpFill = document.getElementById("xpFill");
let xpProgressText = document.getElementById("xpProgressText");

let currentLevelXP = currentXP % 100;
let xpPercentage = currentLevelXP;

if (xpFill)
    xpFill.style.width = xpPercentage + "%";

if (xpProgressText)
    xpProgressText.textContent =
        currentLevelXP + " / 100 XP";
    

if (levelText)
    levelText.textContent = "Level " + level;

    let streakData = JSON.parse(
    localStorage.getItem("aivoraStreak") || "{}"
);

if (streak)
    streak.textContent = streakData.streak || 0;
    // Update Profile Learning Overview
    
    // Update Profile Study Minutes

const profileStudyMinutes =
    document.getElementById("profileStudyMinutes");

if (profileStudyMinutes) {

    let history = JSON.parse(
        localStorage.getItem("aivoraStudyHistory") || "[]"
    );

    let totalMinutes = history.reduce(function(total, session) {
        return total + Number(session.duration || 0);
    }, 0);

    profileStudyMinutes.textContent = totalMinutes;
}

const profileQuiz = document.getElementById("profileQuizCount");
const profileNotes = document.getElementById("profileNotesCount");
const profileCode = document.getElementById("profileCodeCount");
const profileTask = document.getElementById("profileTaskCount");
const profileStreak = document.getElementById("profileStreakCount");

if (profileQuiz)
    profileQuiz.textContent = stats.quizzes || 0;

if (profileNotes)
    profileNotes.textContent = stats.notes || 0;

if (profileCode)
    profileCode.textContent = stats.codes || 0;

if (profileTask)
    profileTask.textContent = stats.tasksCompleted || 0;

if (profileStreak)
    profileStreak.textContent = streakData.streak || 0;
}

document.addEventListener(
    "DOMContentLoaded",
    function () {
        updateStudyStreak();
        renderProgress();
        renderAivoraInsight();
        renderQuizPerformance();
        renderQuizInsights();
        renderScoreTrend();
        renderQuizImprovement();
        renderAchievements();
        renderDailyGoal();
       renderStudyHistory();
        renderProfile();
    }
);
function renderAivoraInsight() {

    let xp = Number(
        localStorage.getItem("aivoraXP") || 0
    );

    let lastScore = Number(
        localStorage.getItem("aivoraLastQuizScore") || 0
    );

    let lastTopic =
        localStorage.getItem("aivoraLastQuizTopic") || "";

    let insightBox =
        document.getElementById("insightContent");

    if (!insightBox) return;

    /* No activity yet */
    if (xp === 0) {

        insightBox.innerHTML =
            "<p>Start using AIVORA to unlock your personalized learning insights.</p>";

        return;
    }

    /* Quiz-based insight */
    if (lastTopic) {

        let message = "";

        if (lastScore >= 80) {

            message =
                "🔥 Excellent work! Your performance in " +
                lastTopic +
                " is strong. Keep pushing further!";

        } else if (lastScore >= 50) {

            message =
                "📚 You're making progress in " +
                lastTopic +
                ". A little more revision can take you higher!";

        } else {

            message =
                "💡 " +
                lastTopic +
                " needs some more practice. Revise the basics and try another quiz!";
        }

        insightBox.innerHTML =
            "<p>" +
            message +
            "</p>" +

            "<p>⚡ AIVORA XP: <strong>" +
            xp +
            "</strong></p>" +

            "<p>🧠 Last quiz score: <strong>" +
            lastScore +
            "%</strong></p>";

    } else {

        insightBox.innerHTML =
            "<p>⚡ You have earned <strong>" +
            xp +
            " XP</strong>.</p>" +

            "<p>Start taking quizzes to unlock personalized insights.</p>";
    }
}
/* ===============================
   AIVORA STUDY STREAK
================================ */
/* ================= STUDY SESSION TIMER ================= */

let studyTimerInterval = null;
let studySeconds = 0;

function startStudySession() {

    if (studyTimerInterval) return;

    document.getElementById("sessionStatus").textContent =
        "📚 Study session is running...";

    studyTimerInterval = setInterval(function () {

        studySeconds++;

        let minutes = Math.floor(studySeconds / 60);
        let seconds = studySeconds % 60;

        document.getElementById("studyTimer").textContent =
            String(minutes).padStart(2, "0") +
            ":" +
            String(seconds).padStart(2, "0");

    }, 1000);
}

function stopStudySession() {

    if (!studyTimerInterval) return;

    clearInterval(studyTimerInterval);
    studyTimerInterval = null;

    let minutesStudied = studySeconds / 60;
    let history = JSON.parse(
    localStorage.getItem("aivoraStudyHistory") || "[]"
);

history.unshift({
    date: new Date().toLocaleDateString(),
    duration: Math.floor(minutesStudied)
});

localStorage.setItem(
    "aivoraStudyHistory",
    JSON.stringify(history)
);

renderStudyHistory();
    addStudyTime(minutesStudied);
    renderProgress();

    let today = new Date().toLocaleDateString();

    let goalData = JSON.parse(
        localStorage.getItem("aivoraDailyGoal") || "{}"
    );

    if (goalData.date !== today) {
        goalData = {
            date: today,
            minutes: 0
        };
    }

    goalData.minutes += minutesStudied;

    localStorage.setItem(
        "aivoraDailyGoal",
        JSON.stringify(goalData)
    );

    renderDailyGoal();

    document.getElementById("sessionStatus").textContent =
        "✅ Session completed! " +
        Math.floor(minutesStudied) +
        " minute(s) studied.";

}
function updateStudyStreak() {

    const today = new Date().toDateString();

    let streakData = JSON.parse(
        localStorage.getItem("aivoraStreak") || "{}"
    );

    if (!streakData.lastStudyDate) {
        streakData.lastStudyDate = today;
        streakData.streak = 1;
    } 
    else if (streakData.lastStudyDate !== today) {

        const lastDate = new Date(streakData.lastStudyDate);
        const currentDate = new Date(today);

        const difference =
            Math.floor(
                (currentDate - lastDate) /
                (1000 * 60 * 60 * 24)
            );

        if (difference === 1) {
            streakData.streak =
                (streakData.streak || 0) + 1;
        } 
        else if (difference > 1) {
            streakData.streak = 1;
        }

        streakData.lastStudyDate = today;
    }

    localStorage.setItem(
        "aivoraStreak",
        JSON.stringify(streakData)
    );
}
function renderQuizPerformance() {

    let history = JSON.parse(
        localStorage.getItem("aivoraQuizHistory") || "[]"
    );

    let total = history.length;

    let totalQuizzes =
        document.getElementById("totalQuizzes");

    let averageScore =
        document.getElementById("averageScore");

    let bestScore =
        document.getElementById("bestScore");

    let historyList =
        document.getElementById("quizHistoryList");

    if (totalQuizzes)
        totalQuizzes.textContent = total;

    if (total === 0) {
        if (averageScore)
            averageScore.textContent = "0%";

        if (bestScore)
            bestScore.textContent = "0%";

        return;
    }

    let scores = history.map(function(item) {
        return Number(item.score) || 0;
    });

    let average =
        Math.round(
            scores.reduce(function(a, b) {
                return a + b;
            }, 0) / scores.length
        );

    let best =
        Math.max(...scores);

    if (averageScore)
        averageScore.textContent = average + "%";

    if (bestScore)
        bestScore.textContent = best + "%";

    if (historyList) {

        historyList.innerHTML = "";

        history.slice(-5).reverse().forEach(function(item) {

            historyList.innerHTML +=
                "<div class='quiz-history-item'>" +
                "<strong>🧠 " +
                item.topic +
                "</strong>" +
                "<span>" +
                item.score +
                "% · " +
                item.date +
                "</span>" +
                "</div>";
        });
    }
}
function renderQuizInsights() {

    let history = JSON.parse(
        localStorage.getItem("aivoraQuizHistory") || "[]"
    );

    let insightBox =
        document.getElementById("quizHistoryList");

    if (!insightBox || history.length === 0) return;

    let topicScores = {};

    history.forEach(function(item) {

        let topic = item.topic || "Unknown";
        let score = Number(item.score) || 0;

        if (!topicScores[topic]) {
            topicScores[topic] = [];
        }

        topicScores[topic].push(score);
    });

    let bestTopic = "";
    let bestScore = -1;

    let weakTopic = "";
    let weakScore = 101;

    Object.keys(topicScores).forEach(function(topic) {

        let scores = topicScores[topic];

        let total = scores.reduce(function(sum, score) {
            return sum + score;
        }, 0);

        let average = Math.round(total / scores.length);

        if (average > bestScore) {
            bestScore = average;
            bestTopic = topic;
        }

        if (average < weakScore) {
            weakScore = average;
            weakTopic = topic;
        }
    });

    insightBox.innerHTML +=
        "<div class='quiz-insight'>" +
        "<strong>🎯 Strongest Topic</strong>" +
        "<p>" +
        bestTopic +
        " — " +
        bestScore +
        "% average</p>" +
        "</div>";

    insightBox.innerHTML +=
        "<div class='quiz-insight'>" +
        "<strong>⚠️ Needs More Practice</strong>" +
        "<p>" +
        weakTopic +
        " — " +
        weakScore +
        "% average</p>" +
        "</div>";
}
function renderQuizImprovement() {

    let history = JSON.parse(
        localStorage.getItem("aivoraQuizHistory") || "[]"
    );

    let box = document.getElementById("quizImprovement");

    if (!box) return;

    if (history.length < 2) {
        box.innerHTML =
            "<p>Complete at least 2 quizzes to see your improvement.</p>";
        return;
    }

    let previous = Number(history[history.length - 2].score) || 0;
    let latest = Number(history[history.length - 1].score) || 0;

    let difference = latest - previous;

    if (difference > 0) {

        box.innerHTML =
            "<strong>📈 You're Improving!</strong>" +
            "<p>Your latest score improved by " +
            difference +
            "% compared to your previous quiz.</p>";

    } else if (difference < 0) {

        box.innerHTML =
            "<strong>📉 Needs More Focus</strong>" +
            "<p>Your latest score is " +
            Math.abs(difference) +
            "% lower than your previous quiz.</p>";

    } else {

        box.innerHTML =
            "<strong>➡️ Steady Performance</strong>" +
            "<p>Your latest score is the same as your previous quiz.</p>";
    }
}
function showAchievementNotification(title, description) {
    let old = document.getElementById("achievementNotification");

    if (old) {
        old.remove();
    }

    let notification = document.createElement("div");
    notification.id = "achievementNotification";

    notification.innerHTML = `
        <div class="achievement-icon">🏆</div>
        <div class="achievement-text">
            <small>ACHIEVEMENT UNLOCKED</small>
            <strong>${title}</strong>
            <span>${description}</span>
        </div>
    `;

    document.body.appendChild(notification);

    setTimeout(function () {
        notification.classList.add("show");
    }, 100);

    setTimeout(function () {
        notification.classList.remove("show");
    }, 3500);

    setTimeout(function () {
        notification.remove();
    }, 4000);
}
function renderAchievements() {

    let quizHistory = JSON.parse(
        localStorage.getItem("aivoraQuizHistory") || "[]"
    );

    let stats = JSON.parse(
        localStorage.getItem("aivoraStats") || "{}"
    );

    let cards = document.querySelectorAll(".achievement-card");

    if (!cards.length) return;

    /* First Quiz */
    if (quizHistory.length >= 1) {
        cards[0].classList.add("unlocked");
    }

    /* Note Maker */
    if ((stats.notes || 0) >= 1) {
        cards[1].classList.add("unlocked");
    }

    /* Code Master */
    if ((stats.codes || 0) >= 1) {
        cards[2].classList.add("unlocked");
    }

    /* Quiz Champion */
    let champion = quizHistory.some(function(item) {
        return Number(item.score) >= 80;
    });

    if (champion) {
        cards[3].classList.add("unlocked");
    }
}
function renderScoreTrend() {

    let history = JSON.parse(
        localStorage.getItem("aivoraQuizHistory") || "[]"
    );

    let trendBox = document.getElementById("scoreTrend");

    if (!trendBox) return;

    if (history.length === 0) {
        trendBox.innerHTML =
            "<p>No score trend available yet.</p>";
        return;
    }

    let recent = history.slice(-7);

    let html =
        "<div class='score-trend-chart'>" +
        "<div class='trend-y-axis'>" +
        "<span>100%</span>" +
        "<span>75%</span>" +
        "<span>50%</span>" +
        "<span>25%</span>" +
        "<span>0%</span>" +
        "</div>" +

        "<div class='trend-main'>" +
        "<div class='trend-grid'>" +
        "<span></span><span></span><span></span><span></span><span></span>" +
        "</div>" +

        "<div class='trend-points'>";

    recent.forEach(function(item, index) {

        let score = Number(item.score) || 0;

        let left =
            recent.length === 1
                ? 50
                : (index / (recent.length - 1)) * 100;

        let top = 100 - score;

        html +=
            "<div class='trend-point' " +
            "style='left:" + left + "%; top:" + top + "%'>" +
            "<span class='trend-score'>" +
            score +
            "%</span>" +
            "<span class='trend-dot'></span>" +
            "</div>";
    });

    html +=
        "</div>" +
        "</div>" +
        "</div>" +

        "<div class='trend-labels'>";

    recent.forEach(function(item) {

        let topic = item.topic || "Quiz";

        html +=
            "<span title='" +
            topic +
            "'>" +
            topic +
            "</span>";
    });

    html += "</div>";

    trendBox.innerHTML = html;
}
function addStudyTime(minutes) {

    let today = new Date().toLocaleDateString();

    let goalData = JSON.parse(
        localStorage.getItem("aivoraDailyGoal") || "{}"
    );

    if (goalData.date !== today) {
        goalData = {
            date: today,
            minutes: 0
        };
    }

    goalData.minutes += minutes;

    if (goalData.minutes > 60) {
        goalData.minutes = 60;
    }

    localStorage.setItem(
        "aivoraDailyGoal",
        JSON.stringify(goalData)
    );

    renderDailyGoal();
}
function resetDailyGoal() {

    let today = new Date().toLocaleDateString();

    let goalData = {
        date: today,
        minutes: 0
    };

    localStorage.setItem(
        "aivoraDailyGoal",
        JSON.stringify(goalData)
    );

    renderDailyGoal();
}

function renderStudyHistory() {

    let history = JSON.parse(
        localStorage.getItem("aivoraStudyHistory") || "[]"
    );

    let historyList =
        document.getElementById("studyHistoryList");

    if (!historyList) return;

    if (history.length === 0) {

        historyList.innerHTML =
            '<p class="empty-history">No study sessions recorded yet.</p>';

        return;
    }

    historyList.innerHTML = history.map(function(session) {

        return `
            <div class="study-history-item">
                <div>
                    <strong>📚 Study Session</strong>
                    <p>${session.date}</p>
                </div>

                <span>${session.duration} min</span>
            </div>
        `;

    }).join("");
}
function renderDailyGoal() {

    let today = new Date().toLocaleDateString();

    let goalData = JSON.parse(
        localStorage.getItem("aivoraDailyGoal") || "{}"
    );

    if (goalData.date !== today) {
        goalData = {
            date: today,
            minutes: 0
        };

        localStorage.setItem(
            "aivoraDailyGoal",
            JSON.stringify(goalData)
        );
    }

    let minutes = goalData.minutes || 0;

    let text = document.getElementById("dailyGoalText");
    let fill = document.getElementById("dailyGoalFill");

    if (!text || !fill) return;

    text.textContent = minutes + " / 60 minutes";

    let percentage = Math.min(
        (minutes / 60) * 100,
        100
    );

    fill.style.width = percentage + "%";
}
function saveStudyHistory(minutes) {

    let history = JSON.parse(
        localStorage.getItem("aivoraStudyHistory") || "[]"
    );

    let today = new Date().toLocaleDateString();

    history.push({
        date: today,
        minutes: Math.floor(minutes)
    });

    localStorage.setItem(
        "aivoraStudyHistory",
        JSON.stringify(history)
    );
}
/* ================= USER PROFILE SYSTEM ================= */

function toggleProfileEdit() {

    const box = document.getElementById("profileEditBox");

    if (!box) return;

    if (box.style.display === "block") {
        box.style.display = "none";
    } else {
        box.style.display = "block";

        document.getElementById("profileNameInput").value =
            localStorage.getItem("aivoraProfileName") || "";

        document.getElementById("profileCollegeInput").value =
            localStorage.getItem("aivoraProfileCollege") || "";

        document.getElementById("profileCourseInput").value =
            localStorage.getItem("aivoraProfileCourse") || "";

        document.getElementById("profileYearInput").value =
            localStorage.getItem("aivoraProfileYear") || "";
    }
}


function saveProfile() {

    const name =
        document.getElementById("profileNameInput").value.trim();

    const college =
        document.getElementById("profileCollegeInput").value.trim();

    const course =
        document.getElementById("profileCourseInput").value.trim();

    const year =
        document.getElementById("profileYearInput").value.trim();
   const subjects =
    document.getElementById("profileSubjectsInput").value.trim();

const interests =
    document.getElementById("profileInterestsInput").value.trim();

localStorage.setItem("aivoraProfileName", name);
localStorage.setItem("aivoraProfileCollege", college);
localStorage.setItem("aivoraProfileCourse", course);
localStorage.setItem("aivoraProfileYear", year);
localStorage.setItem("aivoraProfileSubjects", subjects);
localStorage.setItem("aivoraProfileInterests", interests);

    renderProfile();

    document.getElementById("profileEditBox").style.display = "none";
}


function renderProfile() {

    const name =
        localStorage.getItem("aivoraProfileName") || "Your Name";

    const college =
        localStorage.getItem("aivoraProfileCollege") || "Your College";

    const course =
        localStorage.getItem("aivoraProfileCourse") ||
        "B.Tech Computer Science";

    const year =
        localStorage.getItem("aivoraProfileYear") ||
        "Your Year / Semester";

    document.getElementById("profileName").textContent = name;

    document.getElementById("profileCollege").textContent =
        "🎓 " + college;

    document.getElementById("profileCourse").textContent =
        "💻 " + course;

    document.getElementById("profileYear").textContent =
        "📚 " + year;

    const xp =
        Number(localStorage.getItem("aivoraXP") || 0);

    document.getElementById("profileScore").textContent = xp;

    const level =
        Math.floor(xp / 100) + 1;

    document.getElementById("profileLevel").textContent = level;
}
/* ================= USER PROFILE SYSTEM ================= */

function renderProfile() {

    const name =
        localStorage.getItem("aivoraProfileName") || "Your Name";

    const college =
        localStorage.getItem("aivoraProfileCollege") || "Your College";

    const course =
        localStorage.getItem("aivoraProfileCourse") ||
        "B.Tech Computer Science";

    const year =
        localStorage.getItem("aivoraProfileYear") ||
        "Your Year / Semester";

    const interests =
        localStorage.getItem("aivoraProfileInterests") ||
        "AI • Machine Learning • Python";

    document.getElementById("profileName").textContent = name;

    document.getElementById("profileCollege").textContent =
        "🎓 " + college;

    document.getElementById("profileCourse").textContent =
        "💻 " + course;

    document.getElementById("profileYear").textContent =
        "📚 " + year;

    document.getElementById("profileInterests").textContent =
        interests;

    const xp =
        Number(localStorage.getItem("aivoraXP") || 0);

    document.getElementById("profileScore").textContent = xp;

    const level =
        Math.floor(xp / 100) + 1;

    document.getElementById("profileLevel").textContent = level;
}