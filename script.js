// Initialize Firebase
const db = firebase.firestore();

// Auth state management
function initAuthStateListener() {
    firebase.auth().onAuthStateChanged((user) => {
        updateNavigation(user);
        protectRoutes(user);
        if (user) loadUserData(user);
    });
}

// Update navigation based on auth state
function updateNavigation(user) {
    const navLinks = document.getElementById('navLinks');
    if (!navLinks) return;

    navLinks.innerHTML = `
        <a href="index.html" class="nav-link">Home</a>
        <a href="exercises.html" class="nav-link">Exercises</a>
        <a href="shop.html" class="nav-link">Shop</a>
        <a href="calculator.html" class="nav-link">Calculator</a>
        <a href="meal-planner.html" class="nav-link">Meal Planner</a>
        <a href="emergency.html" class="nav-link">Emergency</a>
        <div class="dropdown">
            <a href="#" class="nav-link">Account ▼</a>
            <div class="dropdown-content">
                ${user ? `
                    <a href="profile.html" class="nav-link">Profile</a>
                    <a href="#" class="nav-link" onclick="logout()">Logout</a>
                ` : `
                    <a href="auth.html?type=login" class="nav-link">Sign In</a>
                    <a href="auth.html?type=register" class="nav-link">Sign Up</a>
                `}
            </div>
        </div>
    `;
}


// Protect routes that require authentication
function protectRoutes(user) {
    const protectedRoutes = ['profile.html'];
    const currentPage = window.location.pathname.split('/').pop();
    
    if (protectedRoutes.includes(currentPage)) {
        if (!user) {
            window.location.href = 'auth.html?type=login';
        }
    }
}


// Auth form handling
function setupAuthForm() {
    const authForm = document.getElementById('authForm');
    if (!authForm) return;

    const params = new URLSearchParams(window.location.search);
    const type = params.get('type') || 'login';

    document.getElementById('authTitle').textContent = 
        type === 'login' ? 'Sign In' : 'Create Account';
    document.getElementById('submitBtn').textContent = 
        type === 'login' ? 'Sign In' : 'Sign Up';
    document.getElementById('authSwitch').innerHTML = 
        type === 'login' 
        ? 'Need an account? <a href="auth.html?type=register">Sign Up</a>'
        : 'Already have an account? <a href="auth.html?type=login">Sign In</a>';

    authForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        const authAction = type === 'login' 
            ? firebase.auth().signInWithEmailAndPassword(email, password)
            : firebase.auth().createUserWithEmailAndPassword(email, password);

        authAction
            .then(() => window.location.href = 'profile.html')
            .catch(error => alert(error.message));
    });
}

// Profile management
function setupProfilePage() {
    if (!document.getElementById('profileView')) return;

    showProfileView();
    
    document.getElementById('editForm')?.addEventListener('submit', updateProfile);
}

function showProfileView() {
    const user = firebase.auth().currentUser;
    if (!user) return;

    document.getElementById('profileView').style.display = 'block';
    document.getElementById('profileEdit').style.display = 'none';
    document.getElementById('userEmail').textContent = user.email;
    document.getElementById('userName').textContent = user.displayName || 'Guest';
}

function showEditForm() {
    const user = firebase.auth().currentUser;
    if (!user) return;

    document.getElementById('profileView').style.display = 'none';
    document.getElementById('profileEdit').style.display = 'block';
    document.getElementById('editName').value = user.displayName || '';
}

async function updateProfile(e) {
    e.preventDefault();
    const user = firebase.auth().currentUser;
    if (!user) return;

    try {
        // Update authentication profile
        await user.updateProfile({
            displayName: document.getElementById('editName').value
        });

        // Update Firestore user document
        await db.collection('users').doc(user.uid).set({
            age: document.getElementById('editAge').value,
            weight: document.getElementById('editWeight').value,
            lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        showProfileView();
        alert('Profile updated successfully!');
    } catch (error) {
        alert('Error updating profile: ' + error.message);
    }
}

// Routine management
function setupIndexPage() {
    if (!document.getElementById('routineForm')) return;

    document.getElementById('routineForm')?.addEventListener('submit', saveRoutine);
}

async function saveRoutine(e) {
    e.preventDefault();
    const user = firebase.auth().currentUser;
    if (!user) return;

    const routine = {
        name: document.getElementById('routineName').value,
        focus: document.getElementById('routineFocus').value,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    };

    try {
        await db.collection('users').doc(user.uid).collection('routines').add(routine);
        alert('Routine saved successfully!');
        loadUserData(user);
        document.getElementById('routineForm').reset();
    } catch (error) {
        alert('Error saving routine: ' + error.message);
    }
}

async function loadUserData(user) {
    if (!user) return;

    try {
        // Load profile data
        const userDoc = await db.collection('users').doc(user.uid).get();
        if (userDoc.exists) {
            const data = userDoc.data();
            if (document.getElementById('userName')) {
                document.getElementById('userName').textContent = user.displayName || 'Guest';
            }
            // Update other profile fields as needed
        }

        // Load routines if on index page
        if (document.getElementById('savedRoutines')) {
            const routinesSnapshot = await db.collection('users').doc(user.uid)
                .collection('routines').orderBy('timestamp', 'desc').get();
            
            const routinesList = document.getElementById('savedRoutines');
            routinesList.innerHTML = '';
            
            routinesSnapshot.forEach(doc => {
                const data = doc.data();
                routinesList.innerHTML += `
                    <div class="routine-card">
                        <h4>${data.name}</h4>
                        <p>Type: ${data.focus}</p>
                        <small>${new Date(data.timestamp?.toDate()).toLocaleDateString()}</small>
                    </div>
                `;
            });
        }
    } catch (error) {
        console.error('Error loading data:', error);
    }
}

// Logout function
function logout() {
    firebase.auth().signOut()
        .then(() => window.location.href = 'index.html')
        .catch(error => alert(error.message));
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initAuthStateListener();
    setupAuthForm();
    setupProfilePage();
    setupIndexPage();
});
const exercises = [
    { name: "Push-Up", info: "Place hands shoulder-width apart. Lower body, then push back up." },
    { name: "Squat", info: "Stand with feet shoulder-width. Lower your body and rise back." },
    { name: "Plank", info: "Hold a push-up position while engaging core." },
    { name: "Lunge", info: "Step forward and lower until both knees are 90°." },
    { name: "Bicep Curl", info: "Lift dumbbells toward shoulders, then lower." }
  ];
  
  document.getElementById("searchInput").addEventListener("input", function() {
    const query = this.value.toLowerCase();
    const results = exercises.filter(ex => ex.name.toLowerCase().includes(query));
    const resultsDiv = document.getElementById("searchResults");
    resultsDiv.innerHTML = results.map(ex => `<strong>${ex.name}</strong>: ${ex.info}`).join("<br><br>");
  });

  const leaderboardData = [
    { name: "Alice", points: 1200 },
    { name: "Bob", points: 950 },
    { name: "Charlie", points: 870 },
    { name: "Diana", points: 700 }
  ];
  
  function renderLeaderboard() {
    const tbody = document.querySelector("#leaderboard tbody");
    tbody.innerHTML = "";
    leaderboardData
      .sort((a, b) => b.points - a.points)
      .forEach((user, i) => {
        const row = `<tr>
          <td style="padding: 10px;">${i + 1}</td>
          <td style="padding: 10px;">${user.name}</td>
          <td style="padding: 10px;">${user.points}</td>
        </tr>`;
        tbody.innerHTML += row;
      });
  }
  renderLeaderboard();
  