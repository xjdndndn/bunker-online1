// public/js/init-firebase.js

async function initializeFirebase() {
    try {
        console.log('Начинаем инициализацию Firebase...');
        
        // Показываем загрузку
        const loadingElement = document.getElementById('loading');
        if (loadingElement) {
            loadingElement.style.display = 'block';
            loadingElement.innerHTML = '<p>Загрузка Firebase...</p>';
        }

        // Ждем загрузки Firebase SDK
        if (typeof firebase === 'undefined') {
            console.log('Firebase SDK еще не загружен, ждем...');
            
            // Создаем promise для ожидания загрузки Firebase
            await new Promise((resolve, reject) => {
                let checkCount = 0;
                const checkFirebase = () => {
                    checkCount++;
                    if (typeof firebase !== 'undefined') {
                        resolve();
                    } else if (checkCount > 50) { // 5 секунд timeout
                        reject(new Error('Firebase SDK не загрузился'));
                    } else {
                        setTimeout(checkFirebase, 100);
                    }
                };
                checkFirebase();
            });
        }

        console.log('Firebase SDK загружен, получаем конфиг...');

        // Получаем конфигурацию
        let config;
        try {
            const response = await fetch('/api/firebase-config');
            if (response.ok) {
                config = await response.json();
                console.log('Конфиг получен с сервера');
            } else {
                throw new Error('Сервер не ответил');
            }
        } catch (serverError) {
            console.log('Серверный endpoint недоступен, используем fallback конфиг');
            // Fallback конфиг БЕЗ apiKey (только для демонстрации)
            config = {
                authDomain: "bunker-gameee.firebaseapp.com",
                databaseURL: "https://bunker-gameee-default-rtdb.firebaseio.com",
                projectId: "bunker-gameee",
                storageBucket: "bunker-gameee.appspot.com", 
                messagingSenderId: "123456789",
                appId: "1:123456789:web:abcdef123456"
            };
        }

        // Проверяем, что firebase доступен
        if (typeof firebase === 'undefined') {
            throw new Error('Firebase SDK не загрузился после ожидания');
        }

        console.log('Инициализируем Firebase с конфигом:', config);

        // Инициализируем Firebase
        const app = firebase.initializeApp(config);
        
        // Делаем доступным для других скриптов
        window.firebaseApp = app;
        window.database = firebase.database();
        window.auth = firebase.auth();

// Для совместимости с ES6 модулями (если будете использовать)
window.firebaseModules = {
    initializeApp: firebase.initializeApp,
    getAuth: () => firebase.auth(),
    getDatabase: () => firebase.database(),
    GoogleAuthProvider: firebase.auth.GoogleAuthProvider
};

// Инициализация аутентификации
console.log('Аутентификация инициализирована');

// Можно добавить отслеживание состояния аутентификации
window.auth.onAuthStateChanged((user) => {
    if (user) {
        console.log('Пользователь авторизован:', user.email);
        // Здесь можно обновить UI
        updateAuthUI(user);
    } else {
        console.log('Пользователь не авторизован');
        updateAuthUI(null);
    }
});

function updateAuthUI(user) {
    const authContainer = document.getElementById('auth-container');
    if (!authContainer) return;
    
    if (user) {
        authContainer.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px;">
                <img src="${user.photoURL}" width="30" height="30" style="border-radius: 50%;">
                <span>${user.displayName}</span>
                <button onclick="logout()">Выйти</button>
            </div>
        `;
    } else {
        authContainer.innerHTML = `
            <button onclick="loginWithGoogle()">Войти через Google</button>
        `;
    }
}

// Глобальные функции для кнопок
window.loginWithGoogle = async function() {
    try {
        const provider = new firebase.auth.GoogleAuthProvider();
        await window.auth.signInWithPopup(provider);
    } catch (error) {
        console.error('Ошибка входа:', error);
        alert('Ошибка входа: ' + error.message);
    }
};

window.logout = function() {
    window.auth.signOut();
};

        console.log('Firebase инициализирован успешно');

        // Скрываем загрузку
        if (loadingElement) {
            loadingElement.style.display = 'none';
        }

        // Загружаем основной скрипт игры
        loadGameScript();

    } catch (error) {
        console.error('Ошибка инициализации Firebase:', error);
        showError(error);
    }
}

function loadGameScript() {
    try {
        const script = document.createElement('script');
        script.src = 'js/game.js';
        script.onload = () => console.log('Game script loaded successfully');
        script.onerror = (err) => {
            console.error('Error loading game script:', err);
            showError(new Error('Не удалось загрузить игру'));
        };
        document.body.appendChild(script);
    } catch (error) {
        console.error('Error creating script element:', error);
    }
}

function showError(error) {
    console.error('Showing error:', error);
    
    let errorDiv = document.getElementById('loading');
    if (!errorDiv) {
        errorDiv = document.createElement('div');
        errorDiv.id = 'loading';
        document.body.appendChild(errorDiv);
    }
    
    errorDiv.innerHTML = `
        <div style="color: red; padding: 20px; text-align: center; background: #ffeeee; border: 1px solid #ff0000; border-radius: 5px; margin: 20px;">
            <h3>Ошибка загрузки игры</h3>
            <p><strong>${error.message || 'Неизвестная ошибка'}</strong></p>
            <p>Попробуйте перезагрузить страницу или проверьте консоль для деталей.</p>
            <button onclick="location.reload()" style="padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer;">
                Перезагрузить страницу
            </button>
        </div>
    `;
    errorDiv.style.display = 'block';
}

// Ожидаем полной загрузки страницы и Firebase SDK
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        // Даем время на загрузку Firebase SDK
        setTimeout(initializeFirebase, 100);
    });
} else {
    setTimeout(initializeFirebase, 100);}