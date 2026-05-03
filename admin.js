// ============================================
// ADMIN PANEL - CORRECTED URLs
// ============================================

// ✅ TAMANG MGA URL BATAY SA IYONG SHEET.BEST CONNECTIONS
const STUDENTS_API_URL = 'https://api.sheetbest.com/sheets/090c207b-1ec1-4403-9ae5-5fbeff38e513';
const ADMINS_API_URL = 'https://api.sheetbest.com/sheets/094c9a99-b39b-4e62-a442-a08311ece02f';

// ⚠️ KUNG MAY SEPARATE TABS/SHEETS, GAMITIN ITO:
// const STUDENTS_API_URL = 'https://api.sheetbest.com/sheets/090c207b-1ec1-4403-9ae5-5fbeff38e513/tabs/StudentProfiles';
// const ADMINS_API_URL = 'https://api.sheetbest.com/sheets/eb123668-421d-44ac-a2d4-50176734acec/tabs/AdminUsers';

// DOM Elements
const studentsTableBody = document.getElementById('studentsTableBody');
const adminLoadingIndicator = document.getElementById('adminLoadingIndicator');
const refreshAdminBtn = document.getElementById('refreshAdminBtn');
const searchInput = document.getElementById('searchInput');
const courseFilter = document.getElementById('courseFilter');
const totalStudentsEl = document.getElementById('totalStudents');
const totalCoursesEl = document.getElementById('totalCourses');
const lastUpdatedEl = document.getElementById('lastUpdated');
const logoutBtn = document.getElementById('logoutBtn');
const adminNameDisplay = document.getElementById('adminNameDisplay');
const adminStats = document.getElementById('adminStats');
const adminControls = document.getElementById('adminControls');
const adminTableContainer = document.getElementById('adminTableContainer');

// Modal Elements
const authModal = document.getElementById('authModal');
const deleteModal = document.getElementById('deleteModal');
const adminStudentModal = document.getElementById('adminStudentModal');

// Variables
let allStudents = [];
let currentDeleteId = null;
let currentAdmin = null;

// ============================================
// CHECK LOGIN STATUS
// ============================================
function checkLoginStatus() {
    const loggedInAdmin = sessionStorage.getItem('currentAdmin');
    if (loggedInAdmin) {
        currentAdmin = JSON.parse(loggedInAdmin);
        adminNameDisplay.textContent = currentAdmin.fullName || currentAdmin.email;
        adminNameDisplay.classList.remove('hidden');
        logoutBtn.classList.remove('hidden');
        authModal.classList.remove('show');
        
        adminStats.style.display = 'grid';
        adminControls.style.display = 'flex';
        adminTableContainer.style.display = 'block';
        
        fetchAllStudents();
    } else {
        adminStats.style.display = 'none';
        adminControls.style.display = 'none';
        adminTableContainer.style.display = 'none';
        adminNameDisplay.classList.add('hidden');
        logoutBtn.classList.add('hidden');
        showAuthModal();
    }
}

function showAuthModal() {
    authModal.classList.add('show');
    document.body.style.overflow = 'hidden';
}

// ============================================
// LOGIN FUNCTION
// ============================================
async function login() {
    const email = document.getElementById('adminEmail').value.trim();
    const password = document.getElementById('adminPassword').value;
    
    console.log('Logging in with:', email);
    console.log('Using Admins API:', ADMINS_API_URL);
    
    if (!email || !password) {
        alert('Please enter both email and password');
        return;
    }
    
    try {
        const response = await fetch(ADMINS_API_URL);
        
        console.log('Response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const admins = await response.json();
        console.log('Admins found:', admins);
        
        if (!admins || admins.length === 0) {
            alert('No admin accounts found! Please add an admin to your AdminUsers sheet.');
            return;
        }
        
        const admin = admins.find(a => a.Email === email && a.Password === password);
        
        if (admin) {
            currentAdmin = {
                email: admin.Email,
                fullName: admin.FullName,
                role: admin.Role || 'admin',
                dateCreated: admin.DateCreated
            };
            sessionStorage.setItem('currentAdmin', JSON.stringify(currentAdmin));
            authModal.classList.remove('show');
            document.body.style.overflow = 'auto';
            adminNameDisplay.textContent = currentAdmin.fullName || currentAdmin.email;
            adminNameDisplay.classList.remove('hidden');
            logoutBtn.classList.remove('hidden');
            
            adminStats.style.display = 'grid';
            adminControls.style.display = 'flex';
            adminTableContainer.style.display = 'block';
            
            fetchAllStudents();
        } else {
            alert('Invalid email or password!');
        }
    } catch (error) {
        console.error('Login error:', error);
        alert(`Error: ${error.message}\n\nMake sure your AdminUsers sheet has data.`);
    }
}

// ============================================
// REGISTER FUNCTION
// ============================================
async function register() {
    const fullName = document.getElementById('regFullName').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPassword').value;
    const confirmPassword = document.getElementById('regConfirmPassword').value;
    
    if (!fullName || !email || !password) {
        alert('Please fill in all fields');
        return;
    }
    
    if (password !== confirmPassword) {
        alert('Passwords do not match!');
        return;
    }
    
    if (password.length < 6) {
        alert('Password must be at least 6 characters');
        return;
    }
    
    try {
        const response = await fetch(ADMINS_API_URL);
        const admins = await response.json();
        
        if (admins.find(a => a.Email === email)) {
            alert('Email already registered! Please login instead.');
            return;
        }
        
        const registerResponse = await fetch(ADMINS_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                Email: email,
                Password: password,
                FullName: fullName,
                DateCreated: new Date().toISOString(),
                Role: 'admin'
            })
        });
        
        if (registerResponse.ok) {
            alert('Registration successful! Please login.');
            showLoginForm();
            document.getElementById('adminEmail').value = email;
        } else {
            alert('Registration failed. Please try again.');
        }
    } catch (error) {
        console.error('Registration error:', error);
        alert('Error connecting to server. Please try again.');
    }
}

function logout() {
    sessionStorage.removeItem('currentAdmin');
    currentAdmin = null;
    window.location.reload();
}

// ============================================
// FETCH ALL STUDENTS
// ============================================
async function fetchAllStudents() {
    showAdminLoading(true);
    
    try {
        const response = await fetch(STUDENTS_API_URL);
        
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        allStudents = await response.json();
        console.log('Fetched students:', allStudents.length);
        
        updateStats();
        updateCourseFilter();
        renderTable();
        
        const now = new Date();
        lastUpdatedEl.textContent = now.toLocaleTimeString();
        
    } catch (error) {
        console.error('Error:', error);
        studentsTableBody.innerHTML = `<tr><td colspan="6" class="empty-table">Error loading students: ${error.message}</td></tr>`;
    } finally {
        showAdminLoading(false);
    }
}

function updateStats() {
    totalStudentsEl.textContent = allStudents.length;
    const uniqueCourses = [...new Set(allStudents.map(s => s.Course))];
    totalCoursesEl.textContent = uniqueCourses.length;
}

function updateCourseFilter() {
    const courses = [...new Set(allStudents.map(s => s.Course))];
    let options = '<option value="all">All Courses</option>';
    courses.forEach(course => { options += `<option value="${course}">${course}</option>`; });
    courseFilter.innerHTML = options;
}

function renderTable() {
    let filteredStudents = [...allStudents];
    
    const searchTerm = searchInput.value.toLowerCase();
    if (searchTerm) {
        filteredStudents = filteredStudents.filter(s => 
            s.Name?.toLowerCase().includes(searchTerm) || 
            s.Course?.toLowerCase().includes(searchTerm)
        );
    }
    
    const selectedCourse = courseFilter.value;
    if (selectedCourse !== 'all') {
        filteredStudents = filteredStudents.filter(s => s.Course === selectedCourse);
    }
    
    if (filteredStudents.length === 0) {
        studentsTableBody.innerHTML = `<tr><td colspan="6" class="empty-table">No students found</td></tr>`;
        return;
    }
    
    const tableHTML = filteredStudents.map((student, index) => `
        <tr data-id="${student._id || index}">
            <td>${index + 1}</td>
            <td><strong>${escapeHtml(student.Name)}</strong></td>
            <td>${escapeHtml(student.Course)}</td>
            <td>${escapeHtml(student.Year)}</td>
            <td>${escapeHtml(student.Bio?.substring(0, 50) || 'No bio')}${student.Bio?.length > 50 ? '...' : ''}</td>
            <td><button class="delete-btn" data-id="${student._id || index}" data-name="${escapeHtml(student.Name)}">🗑️ Delete</button></td>
        </tr>
    `).join('');
    
    studentsTableBody.innerHTML = tableHTML;
    
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = btn.getAttribute('data-id');
            const name = btn.getAttribute('data-name');
            showDeleteModal(id, name);
        });
    });
    
    document.querySelectorAll('#studentsTableBody tr').forEach(row => {
        row.addEventListener('click', (e) => {
            if (e.target.classList.contains('delete-btn')) return;
            const rowIndex = row.querySelector('td:first-child')?.textContent;
            if (rowIndex) {
                const idx = parseInt(rowIndex) - 1;
                let filtered = [...allStudents];
                if (searchInput.value) {
                    filtered = filtered.filter(s => s.Name?.toLowerCase().includes(searchInput.value.toLowerCase()));
                }
                if (courseFilter.value !== 'all') {
                    filtered = filtered.filter(s => s.Course === courseFilter.value);
                }
                const student = filtered[idx];
                if (student) showStudentDetails(student);
            }
        });
    });
}

function showStudentDetails(student) {
    document.getElementById('adminModalName').textContent = student.Name || 'No Name';
    document.getElementById('adminModalCourse').textContent = `📚 ${student.Course || 'No Course'}`;
    document.getElementById('adminModalYear').textContent = `🎓 ${student.Year || 'No Year'}`;
    document.getElementById('adminModalBio').textContent = student.Bio?.trim() || 'No bio provided';
    document.getElementById('adminModalAchievements').textContent = student.Achievements?.trim() || 'No achievements listed';
    
    const modalDeleteBtn = document.getElementById('modalDeleteBtn');
    modalDeleteBtn.onclick = () => {
        adminStudentModal.classList.remove('show');
        showDeleteModal(student._id, student.Name);
    };
    
    adminStudentModal.classList.add('show');
    document.body.style.overflow = 'hidden';
}

function showDeleteModal(id, name) {
    currentDeleteId = id;
    document.getElementById('deleteStudentName').textContent = name;
    deleteModal.classList.add('show');
    document.body.style.overflow = 'hidden';
}

async function deleteStudent() {
    if (!currentDeleteId) return;
    
    try {
        let deleteIndex = -1;
        for (let i = 0; i < allStudents.length; i++) {
            if (allStudents[i]._id === currentDeleteId || allStudents[i].Name === document.getElementById('deleteStudentName').textContent) {
                deleteIndex = i;
                break;
            }
        }
        
        if (deleteIndex !== -1) {
            const deleteUrl = `${STUDENTS_API_URL}/${deleteIndex}`;
            const response = await fetch(deleteUrl, { method: 'DELETE' });
            
            if (response.ok) {
                alert('Student profile deleted successfully!');
                deleteModal.classList.remove('show');
                document.body.style.overflow = 'auto';
                await fetchAllStudents();
            } else {
                throw new Error('Delete failed');
            }
        }
    } catch (error) {
        console.error('Delete error:', error);
        alert('Error deleting student. Please try again.');
        deleteModal.classList.remove('show');
        document.body.style.overflow = 'auto';
    }
}

function showLoginForm() {
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('registerForm').style.display = 'none';
    document.getElementById('authModalTitle').innerHTML = '<i class="fas fa-lock"></i> Admin Login';
}

function showRegisterForm() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerForm').style.display = 'block';
    document.getElementById('authModalTitle').innerHTML = '<i class="fas fa-user-plus"></i> Admin Registration';
}

function closeModals() {
    deleteModal.classList.remove('show');
    adminStudentModal.classList.remove('show');
    authModal.classList.remove('show');
    document.body.style.overflow = 'auto';
}

function showAdminLoading(show) {
    if (show) {
        adminLoadingIndicator.classList.remove('hidden');
        studentsTableBody.style.opacity = '0.5';
    } else {
        adminLoadingIndicator.classList.add('hidden');
        studentsTableBody.style.opacity = '1';
    }
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// Event Listeners
refreshAdminBtn?.addEventListener('click', fetchAllStudents);
searchInput?.addEventListener('input', () => renderTable());
courseFilter?.addEventListener('change', () => renderTable());
logoutBtn?.addEventListener('click', logout);

document.getElementById('loginSubmitBtn')?.addEventListener('click', login);
document.getElementById('registerSubmitBtn')?.addEventListener('click', register);
document.getElementById('showRegisterBtn')?.addEventListener('click', (e) => { e.preventDefault(); showRegisterForm(); });
document.getElementById('showLoginBtn')?.addEventListener('click', (e) => { e.preventDefault(); showLoginForm(); });
document.getElementById('confirmDeleteBtn')?.addEventListener('click', deleteStudent);
document.getElementById('cancelDeleteBtn')?.addEventListener('click', closeModals);

document.querySelectorAll('.close-modal').forEach(btn => { btn.addEventListener('click', closeModals); });
window.addEventListener('click', (e) => { if (e.target.classList.contains('modal')) closeModals(); });

// Initialize
document.addEventListener('DOMContentLoaded', () => { checkLoginStatus(); });