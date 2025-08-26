import { getAuth, signInWithPopup, GoogleAuthProvider, signOut } from "firebase/auth";

const auth = getAuth();
const provider = new GoogleAuthProvider();

// Элементы DOM
const signInButton = document.getElementById('signInButton');
const signOutButton = document.getElementById('signOutButton');
const userInfo = document.getElementById('userInfo');
const userPhoto = document.getElementById('userPhoto');
const userName = document.getElementById('userName');

// Вход через Google
signInButton.addEventListener('click', () => {
  signInWithPopup(auth, provider)
    .then((result) => {
      updateUI(result.user);
    }).catch((error) => {
      console.error("Ошибка входа:", error);
    });
});

// Выход
signOutButton.addEventListener('click', () => {
  signOut(auth).then(() => {
    userInfo.classList.add('hidden');
    signInButton.style.display = 'block';
  });
});

// Отслеживание состояния входа
auth.onAuthStateChanged((user) => {
  if (user) {
    updateUI(user);
  }
});

// Обновление интерфейса
function updateUI(user) {
  userPhoto.src = user.photoURL || 'images/default-avatar.png';
  userName.textContent = user.displayName;
  userInfo.classList.remove('hidden');
  signInButton.style.display = 'none';
}

export function getCurrentUser() {
    return window.auth?.currentUser;
}

export function requireAuth() {
    if (!window.auth?.currentUser) {
        alert('Для продолжения необходимо войти в систему');
        return false;
    }
    return true;
}