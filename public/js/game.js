// Глобальные переменные
let gameCode;
let playerId;
let playerName;
let gameRef;
let playersRef;
let myCardRef;

// Список характеристик
const attributes = [
    'profession', 'health', 'hobby', 
    'baggage', 'phobia', 'character', 'fact'
];

// Списки возможных значений для характеристик
const professions = ["Врач", "Инженер", "Учитель", "Программист", "Фермер", "Повар", "Строитель", "Ученый"];
const healthStatuses = ["Здоров", "Аллергия", "Астма", "Диабет", "Гипертония", "Иммунодефицит"];
const hobbies = ["Чтение", "Рисование", "Спорт", "Готовка", "Садоводство", "Музыка", "Рыбалка"];
const baggageItems = ["Аптечка", "Книги", "Инструменты", "Семена", "Оружие", "Документы", "Фонарик"];
const phobias = ["Арахнофобия", "Клаустрофобия", "Акрофобия", "Агорафобия", "Авиафобия"];
const characters = ["Добрый", "Агрессивный", "Хитрый", "Честный", "Эгоистичный", "Альтруист"];
const facts = ["Бывший военный", "Знает 5 языков", "Веган", "Алкоголик", "Бывший заключенный"];

// Функция для генерации случайной карточки
function generateRandomCard() {
    return {
        profession: professions[Math.floor(Math.random() * professions.length)],
        health: healthStatuses[Math.floor(Math.random() * healthStatuses.length)],
        hobby: hobbies[Math.floor(Math.random() * hobbies.length)],
        baggage: baggageItems[Math.floor(Math.random() * baggageItems.length)],
        phobia: phobias[Math.floor(Math.random() * phobias.length)],
        character: characters[Math.floor(Math.random() * characters.length)],
        fact: facts[Math.floor(Math.random() * facts.length)],
        revealed: []
    };
}

// Функция для генерации случайного ID
function generateId() {
    return 'player-' + Math.random().toString(36).substr(2, 9);
}

// Инициализация главной страницы
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('createGame')) {
        initMainPage();
    } else if (document.getElementById('revealRandom')) {
        initGamePage();
    }
});

// Логика главной страницы
function initMainPage() {
    document.getElementById('createGame').addEventListener('click', createGame);
    document.getElementById('joinGame').addEventListener('click', showJoinForm);
    document.getElementById('joinWithCode').addEventListener('click', joinGame);
}

// Логика страницы игры
function initGamePage() {
    // Получаем код игры из URL
    const urlParams = new URLSearchParams(window.location.search);
    gameCode = urlParams.get('code');
    playerId = urlParams.get('player');
    
    if (!gameCode || !playerId) {
        alert('Неверная ссылка игры!');
        window.location.href = 'index.html';
        return;
    }
    
    document.getElementById('displayGameCode').textContent = gameCode;
    
    // Инициализация ссылок Firebase
    gameRef = database.ref('games/' + gameCode);
    playersRef = gameRef.child('players');
    myCardRef = playersRef.child(playerId);
    
    // Проверяем существование игры
    gameRef.once('value').then(snapshot => {
        if (!snapshot.exists()) {
            alert('Игра не найдена!');
            window.location.href = 'index.html';
        }
    });
    
    // Инициализируем карточку игрока, если ее нет
    myCardRef.once('value').then(snapshot => {
        if (!snapshot.exists()) {
            const card = generateRandomCard();
            myCardRef.set(card);
        }
    });
    
    // Слушаем изменения в списке игроков
    playersRef.on('value', updatePlayersList);
    
    // Кнопка открытия случайной характеристики
    document.getElementById('revealRandom').addEventListener('click', revealRandomAttribute);
}

// Создание новой игры
function createGame() {
    gameCode = Math.random().toString(36).substr(2, 5).toUpperCase();
    playerId = generateId();
    
    // Создаем игру в Firebase
    const gameData = {
        createdAt: firebase.database.ServerValue.TIMESTAMP,
        players: {}
    };
    
    gameData.players[playerId] = generateRandomCard();
    
    database.ref('games/' + gameCode).set(gameData).then(() => {
        // Перенаправляем на страницу игры
        window.location.href = `game.html?code=${gameCode}&player=${playerId}`;
    });
}

// Показать форму для ввода кода игры
function showJoinForm() {
    document.getElementById('gameCodeInput').classList.remove('hidden');
}

// Присоединиться к существующей игре
function joinGame() {
    const code = document.getElementById('gameCode').value.trim().toUpperCase();
    
    if (!code || code.length !== 5) {
        alert('Пожалуйста, введите корректный 5-значный код игры');
        return;
    }
    
    gameCode = code;
    playerId = generateId();
    
    // Проверяем существование игры
    database.ref('games/' + gameCode).once('value').then(snapshot => {
        if (snapshot.exists()) {
            // Добавляем нового игрока
            const card = generateRandomCard();
            database.ref(`games/${gameCode}/players/${playerId}`).set(card).then(() => {
                window.location.href = `game.html?code=${gameCode}&player=${playerId}`;
            });
        } else {
            alert('Игра с таким кодом не найдена!');
        }
    });
}

// Обновление списка игроков
function updatePlayersList(snapshot) {
    const players = snapshot.val();
    const playerCardsContainer = document.querySelector('.player-cards');
    const playerCountElement = document.getElementById('playerCount');
    
    if (!players) return;
    
    // Очищаем контейнер
    playerCardsContainer.innerHTML = '';
    
    // Обновляем счетчик игроков
    playerCountElement.textContent = Object.keys(players).length;
    
    // Добавляем карточки игроков
    Object.entries(players).forEach(([id, data]) => {
        if (id === playerId) return; // Пропускаем свою карточку
        
        const playerCard = document.createElement('div');
        playerCard.className = 'player-card';
        playerCard.innerHTML = `
            <h3>Игрок ${id.substr(0, 4)}</h3>
            <div class="card-content">
                ${generateAttributesHTML(data)}
            </div>
        `;
        playerCardsContainer.appendChild(playerCard);
    });
    
    // Обновляем свою карточку
    updateMyCard(players[playerId]);
}

// Генерация HTML для характеристик
function generateAttributesHTML(cardData) {
    let html = '';
    attributes.forEach(attr => {
        if (cardData.revealed && cardData.revealed.includes(attr)) {
            html += `
                <div class="attribute">
                    <h4>${getAttributeName(attr)}</h4>
                    <p>${cardData[attr]}</p>
                </div>
            `;
        } else {
            html += `
                <div class="attribute hidden">
                    <h4>${getAttributeName(attr)}</h4>
                    <p>Скрыто</p>
                </div>
            `;
        }
    });
    return html;
}

// Обновление своей карточки
function updateMyCard(cardData) {
    attributes.forEach(attr => {
        const element = document.querySelector(`.my-card .attribute[data-attr="${attr}"]`);
        if (element) {
            if (cardData.revealed && cardData.revealed.includes(attr)) {
                element.classList.remove('hidden');
                element.querySelector('p').textContent = cardData[attr];
            } else {
                element.classList.add('hidden');
            }
        }
    });
}

// Открытие случайной характеристики
function revealRandomAttribute() {
    myCardRef.once('value').then(snapshot => {
        const card = snapshot.val();
        const hiddenAttributes = attributes.filter(attr => 
            !card.revealed || !card.revealed.includes(attr)
        );
        
        if (hiddenAttributes.length === 0) {
            alert('Все характеристики уже открыты!');
            return;
        }
        
        const randomAttr = hiddenAttributes[Math.floor(Math.random() * hiddenAttributes.length)];
        const newRevealed = card.revealed ? [...card.revealed, randomAttr] : [randomAttr];
        
        myCardRef.update({
            revealed: newRevealed
        });
    });
}

// Получение читаемого имени характеристики
function getAttributeName(attr) {
    const names = {
        profession: 'Профессия',
        health: 'Здоровье',
        hobby: 'Хобби',
        baggage: 'Багаж',
        phobia: 'Фобия',
        character: 'Характер',
        fact: 'Доп. факт'
    };
    return names[attr] || attr;
}