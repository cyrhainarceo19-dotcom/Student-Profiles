// ============================================
// ADMIN PANEL - WITH TERMS & CONDITIONS VIEW
// ============================================

// ✅ TAMANG MGA URL BATAY SA IYONG SHEET.BEST CONNECTIONS
const STUDENTS_API_URL = 'https://api.sheetbest.com/sheets/090c207b-1ec1-4403-9ae5-5fbeff38e513';
const ADMINS_API_URL = 'https://api.sheetbest.com/sheets/094c9a99-b39b-4e62-a442-a08311ece02f';

// DOM Elements - may error checking
const studentsTableBody = document.getElementById('studentsTableBody');
const adminLoadingIndicator = document.getElementById('adminLoadingIndicator');
const refreshAdminBtn = document.getElementById('refreshAdminBtn');
const searchInput = document.getElementById('searchInput');
const courseFilter = document.getElementById('courseFilter');
const termsFilter = document.getElementById('termsFilter');
const totalStudentsEl = document.getElementById('totalStudents');
const totalCoursesEl = document.getElementById('totalCourses');
const termsAcceptedCountEl = document.getElementById('termsAcceptedCount');
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
        if (adminNameDisplay) adminNameDisplay.textContent = currentAdmin.fullName || currentAdmin.email;
        if (adminNameDisplay) adminNameDisplay.classList.remove('hidden');
        if (logoutBtn) logoutBtn.classList.remove('hidden');
        if (authModal) authModal.classList.remove('show');
        
        if (adminStats) adminStats.style.display = 'grid';
        if (adminControls) adminControls.style.display = 'flex';
        if (adminTableContainer) adminTableContainer.style.display = 'block';
        
        fetchAllStudents();
    } else {
        if (adminStats) adminStats.style.display = 'none';
        if (adminControls) adminControls.style.display = 'none';
        if (adminTableContainer) adminTableContainer.style.display = 'none';
        if (adminNameDisplay) adminNameDisplay.classList.add('hidden');
        if (logoutBtn) logoutBtn.classList.add('hidden');
        showAuthModal();
    }
}

function showAuthModal() {
    if (authModal) {
        authModal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
}

// ============================================
// LOGIN FUNCTION
// ============================================
async function login() {
    const email = document.getElementById('adminEmail')?.value.trim();
    const password = document.getElementById('adminPassword')?.value;
    
    if (!email || !password) {
        alert('Please enter both email and password');
        return;
    }
    
    try {
        const response = await fetch(ADMINS_API_URL);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const admins = await response.json();
        
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
            if (authModal) authModal.classList.remove('show');
            document.body.style.overflow = 'auto';
            if (adminNameDisplay) adminNameDisplay.textContent = currentAdmin.fullName || currentAdmin.email;
            if (adminNameDisplay) adminNameDisplay.classList.remove('hidden');
            if (logoutBtn) logoutBtn.classList.remove('hidden');
            
            if (adminStats) adminStats.style.display = 'grid';
            if (adminControls) adminControls.style.display = 'flex';
            if (adminTableContainer) adminTableContainer.style.display = 'block';
            
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
    const fullName = document.getElementById('regFullName')?.value.trim();
    const email = document.getElementById('regEmail')?.value.trim();
    const password = document.getElementById('regPassword')?.value;
    const confirmPassword = document.getElementById('regConfirmPassword')?.value;
    
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
            const adminEmail = document.getElementById('adminEmail');
            if (adminEmail) adminEmail.value = email;
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
        if (lastUpdatedEl) lastUpdatedEl.textContent = now.toLocaleTimeString();
        
    } catch (error) {
        console.error('Error:', error);
        if (studentsTableBody) {
            studentsTableBody.innerHTML = `<tr><td colspan="8" class="empty-table">Error loading students: ${error.message}</td></tr>`;
        }
    } finally {
        showAdminLoading(false);
    }
}

function updateStats() {
    if (totalStudentsEl) totalStudentsEl.textContent = allStudents.length;
    const uniqueCourses = [...new Set(allStudents.map(s => s.Course))];
    if (totalCoursesEl) totalCoursesEl.textContent = uniqueCourses.length;
    
    const termsAcceptedCount = allStudents.filter(s => s.TermsAccepted === 'Yes').length;
    if (termsAcceptedCountEl) termsAcceptedCountEl.textContent = termsAcceptedCount;
}

function updateCourseFilter() {
    const courses = [...new Set(allStudents.map(s => s.Course))];
    let options = '<option value="all">All Courses</option>';
    courses.forEach(course => { options += `<option value="${course}">${course}</option>`; });
    if (courseFilter) courseFilter.innerHTML = options;
}

function renderTable() {
    if (!studentsTableBody) return;
    
    let filteredStudents = [...allStudents];
    
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
    if (searchTerm) {
        filteredStudents = filteredStudents.filter(s => 
            s.Name?.toLowerCase().includes(searchTerm) || 
            s.Course?.toLowerCase().includes(searchTerm)
        );
    }
    
    const selectedCourse = courseFilter ? courseFilter.value : 'all';
    if (selectedCourse !== 'all') {
        filteredStudents = filteredStudents.filter(s => s.Course === selectedCourse);
    }
    
    const selectedTermsFilter = termsFilter ? termsFilter.value : 'all';
    if (selectedTermsFilter === 'accepted') {
        filteredStudents = filteredStudents.filter(s => s.TermsAccepted === 'Yes');
    } else if (selectedTermsFilter === 'not_accepted') {
        filteredStudents = filteredStudents.filter(s => s.TermsAccepted !== 'Yes');
    }
    
    if (filteredStudents.length === 0) {
        studentsTableBody.innerHTML = `<tr><td colspan="8" class="empty-table">No students found</td></tr>`;
        return;
    }
    
    const tableHTML = filteredStudents.map((student, index) => {
        const termsStatus = student.TermsAccepted === 'Yes';
        const dateAccepted = student.DateAccepted ? new Date(student.DateAccepted).toLocaleString() : 'N/A';
        
        return `
            <tr data-id="${student._id || index}">
                <td>${index + 1}</td>
                <td><strong>${escapeHtml(student.Name)}</strong></td>
                <td>${escapeHtml(student.Course)}</td>
                <td>${escapeHtml(student.Year)}</td>
                <td>${escapeHtml(student.Bio?.substring(0, 50) || 'No bio')}${student.Bio?.length > 50 ? '...' : ''}</td>
                <td class="terms-status ${termsStatus ? 'accepted' : 'not-accepted'}">
                    ${termsStatus ? '✅ Yes' : '❌ No'}
                </td>
                <td>${dateAccepted}</td>
                <td><button class="delete-btn" data-id="${student._id || index}" data-name="${escapeHtml(student.Name)}">🗑️ Delete</button></td>
            </tr>
        `;
    }).join('');
    
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
                
                const searchTermVal = searchInput ? searchInput.value : '';
                if (searchTermVal) {
                    filtered = filtered.filter(s => s.Name?.toLowerCase().includes(searchTermVal.toLowerCase()));
                }
                const courseFilterVal = courseFilter ? courseFilter.value : 'all';
                if (courseFilterVal !== 'all') {
                    filtered = filtered.filter(s => s.Course === courseFilterVal);
                }
                const termsFilterVal = termsFilter ? termsFilter.value : 'all';
                if (termsFilterVal === 'accepted') {
                    filtered = filtered.filter(s => s.TermsAccepted === 'Yes');
                } else if (termsFilterVal === 'not_accepted') {
                    filtered = filtered.filter(s => s.TermsAccepted !== 'Yes');
                }
                
                const student = filtered[idx];
                if (student) showStudentDetails(student);
            }
        });
    });
}

function showStudentDetails(student) {
    const adminModalName = document.getElementById('adminModalName');
    const adminModalCourse = document.getElementById('adminModalCourse');
    const adminModalYear = document.getElementById('adminModalYear');
    const adminModalBio = document.getElementById('adminModalBio');
    const adminModalAchievements = document.getElementById('adminModalAchievements');
    const adminModalTerms = document.getElementById('adminModalTerms');
    
    if (adminModalName) adminModalName.textContent = student.Name || 'No Name';
    if (adminModalCourse) adminModalCourse.textContent = `📚 ${student.Course || 'No Course'}`;
    if (adminModalYear) adminModalYear.textContent = `🎓 ${student.Year || 'No Year'}`;
    if (adminModalBio) adminModalBio.textContent = student.Bio?.trim() || 'No bio provided';
    if (adminModalAchievements) adminModalAchievements.textContent = student.Achievements?.trim() || 'No achievements listed';
    
    const termsStatus = student.TermsAccepted === 'Yes';
    const dateAccepted = student.DateAccepted ? new Date(student.DateAccepted).toLocaleString() : 'Not accepted yet';
    if (adminModalTerms) {
        adminModalTerms.innerHTML = `
            <strong>Status:</strong> ${termsStatus ? '✅ Accepted' : '❌ Not Accepted'}<br>
            <strong>Date Accepted:</strong> ${dateAccepted}
        `;
    }
    
    const modalDeleteBtn = document.getElementById('modalDeleteBtn');
    if (modalDeleteBtn) {
        modalDeleteBtn.onclick = () => {
            if (adminStudentModal) adminStudentModal.classList.remove('show');
            showDeleteModal(student._id, student.Name);
        };
    }
    
    if (adminStudentModal) {
        adminStudentModal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
}

function showDeleteModal(id, name) {
    currentDeleteId = id;
    const deleteStudentName = document.getElementById('deleteStudentName');
    if (deleteStudentName) deleteStudentName.textContent = name;
    if (deleteModal) {
        deleteModal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
}

async function deleteStudent() {
    if (!currentDeleteId) return;
    
    try {
        let deleteIndex = -1;
        for (let i = 0; i < allStudents.length; i++) {
            if (allStudents[i]._id === currentDeleteId || allStudents[i].Name === document.getElementById('deleteStudentName')?.textContent) {
                deleteIndex = i;
                break;
            }
        }
        
        if (deleteIndex !== -1) {
            const deleteUrl = `${STUDENTS_API_URL}/${deleteIndex}`;
            const response = await fetch(deleteUrl, { method: 'DELETE' });
            
            if (response.ok) {
                alert('Student profile deleted successfully!');
                if (deleteModal) deleteModal.classList.remove('show');
                document.body.style.overflow = 'auto';
                await fetchAllStudents();
            } else {
                throw new Error('Delete failed');
            }
        }
    } catch (error) {
        console.error('Delete error:', error);
        alert('Error deleting student. Please try again.');
        if (deleteModal) deleteModal.classList.remove('show');
        document.body.style.overflow = 'auto';
    }
}

function showLoginForm() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const authModalTitle = document.getElementById('authModalTitle');
    
    if (loginForm) loginForm.style.display = 'block';
    if (registerForm) registerForm.style.display = 'none';
    if (authModalTitle) authModalTitle.innerHTML = '<i class="fas fa-lock"></i> Admin Login';
}

function showRegisterForm() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const authModalTitle = document.getElementById('authModalTitle');
    
    if (loginForm) loginForm.style.display = 'none';
    if (registerForm) registerForm.style.display = 'block';
    if (authModalTitle) authModalTitle.innerHTML = '<i class="fas fa-user-plus"></i> Admin Registration';
}

function closeModals() {
    if (deleteModal) deleteModal.classList.remove('show');
    if (adminStudentModal) adminStudentModal.classList.remove('show');
    if (authModal) authModal.classList.remove('show');
    document.body.style.overflow = 'auto';
}

function showAdminLoading(show) {
    if (adminLoadingIndicator) {
        if (show) {
            adminLoadingIndicator.classList.remove('hidden');
            if (studentsTableBody) studentsTableBody.style.opacity = '0.5';
        } else {
            adminLoadingIndicator.classList.add('hidden');
            if (studentsTableBody) studentsTableBody.style.opacity = '1';
        }
    }
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// ============================================
// EVENT LISTENERS
// ============================================
if (refreshAdminBtn) refreshAdminBtn.addEventListener('click', fetchAllStudents);
if (searchInput) searchInput.addEventListener('input', () => renderTable());
if (courseFilter) courseFilter.addEventListener('change', () => renderTable());
if (termsFilter) termsFilter.addEventListener('change', () => renderTable());
if (logoutBtn) logoutBtn.addEventListener('click', logout);

const loginSubmitBtn = document.getElementById('loginSubmitBtn');
const registerSubmitBtn = document.getElementById('registerSubmitBtn');
const showRegisterBtn = document.getElementById('showRegisterBtn');
const showLoginBtn = document.getElementById('showLoginBtn');
const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');

if (loginSubmitBtn) loginSubmitBtn.addEventListener('click', login);
if (registerSubmitBtn) registerSubmitBtn.addEventListener('click', register);
if (showRegisterBtn) showRegisterBtn.addEventListener('click', (e) => { e.preventDefault(); showRegisterForm(); });
if (showLoginBtn) showLoginBtn.addEventListener('click', (e) => { e.preventDefault(); showLoginForm(); });
if (confirmDeleteBtn) confirmDeleteBtn.addEventListener('click', deleteStudent);
if (cancelDeleteBtn) cancelDeleteBtn.addEventListener('click', closeModals);

document.querySelectorAll('.close-modal').forEach(btn => { btn.addEventListener('click', closeModals); });
window.addEventListener('click', (e) => { if (e.target.classList.contains('modal')) closeModals(); });

// Initialize
document.addEventListener('DOMContentLoaded', () => { 
    checkLoginStatus();
});