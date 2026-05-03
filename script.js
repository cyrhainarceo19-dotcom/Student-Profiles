// ============================================
// STUDENT VIEW - WITH SOCIAL MEDIA LINKS
// ============================================

// 🔴 PALITAN ANG URL NA ITO - Gamitin ang iyong Sheet.best URL para sa StudentProfiles
const STUDENTS_API_URL = 'https://api.sheetbest.com/sheets/090c207b-1ec1-4403-9ae5-5fbeff38e513';

// DOM Elements
const studentForm = document.getElementById('studentForm');
const submitBtn = document.getElementById('submitBtn');
const profilesContainer = document.getElementById('profilesContainer');
const loadingIndicator = document.getElementById('loadingIndicator');
const refreshBtn = document.getElementById('refreshBtn');
const adminPanelBtn = document.getElementById('adminPanelBtn');
const formMessage = document.getElementById('formMessage');
const filterResultText = document.getElementById('filterResultText');
const courseFiltersDiv = document.getElementById('courseFilters');

// Modal Elements
const modal = document.getElementById('studentModal');
const closeModal = document.querySelectorAll('.close-modal');
const modalName = document.getElementById('modalName');
const modalCourse = document.getElementById('modalCourse');
const modalYear = document.getElementById('modalYear');
const modalBio = document.getElementById('modalBio');
const modalAchievements = document.getElementById('modalAchievements');
const modalSocialSection = document.getElementById('modalSocialSection');
const modalSocialLinks = document.getElementById('modalSocialLinks');

// Variables
let allStudents = [];
let currentFilter = 'all';

// ============================================
// FETCH ALL PROFILES
// ============================================
async function fetchAllProfiles() {
    showLoading(true);
    
    try {
        const response = await fetch(STUDENTS_API_URL);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        allStudents = await response.json();
        console.log('Fetched students:', allStudents.length);
        
        updateCourseFilters();
        applyFilter();
        
    } catch (error) {
        console.error('Error:', error);
        profilesContainer.innerHTML = `
            <div class="empty-state">
                <span>⚠️</span>
                <p>Error loading profiles: ${error.message}</p>
                <p>Please check your internet connection and refresh.</p>
            </div>
        `;
    } finally {
        showLoading(false);
    }
}

// ============================================
// UPDATE COURSE FILTERS
// ============================================
function updateCourseFilters() {
    const courses = [...new Set(allStudents.map(s => s.Course).filter(c => c))];
    
    let filtersHTML = `<button class="filter-btn active" data-course="all">📚 All Courses</button>`;
    
    courses.forEach(course => {
        filtersHTML += `<button class="filter-btn" data-course="${course}">${course}</button>`;
    });
    
    courseFiltersDiv.innerHTML = filtersHTML;
    
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.getAttribute('data-course');
            applyFilter();
        });
    });
}

// ============================================
// APPLY FILTER
// ============================================
function applyFilter() {
    let filteredStudents;
    
    if (currentFilter === 'all') {
        filteredStudents = allStudents;
        filterResultText.textContent = `Showing all ${filteredStudents.length} students`;
    } else {
        filteredStudents = allStudents.filter(student => student.Course === currentFilter);
        filterResultText.textContent = `Showing ${filteredStudents.length} student(s) from ${currentFilter}`;
    }
    
    if (filteredStudents.length === 0) {
        displayEmptyState(currentFilter);
    } else {
        displayProfiles(filteredStudents);
    }
}

// ============================================
// DISPLAY PROFILES WITH SOCIAL ICONS
// ============================================
function displayProfiles(students) {
    const profilesHTML = students.map((student, index) => {
        const bioText = student.Bio && student.Bio.trim() !== '' ? student.Bio.substring(0, 100) : '';
        
        // Build social icons HTML
        let socialIconsHTML = '';
        if (student.Facebook) {
            socialIconsHTML += `<a href="${escapeHtml(student.Facebook)}" target="_blank" class="social-icon" title="Facebook"><i class="fab fa-facebook"></i></a>`;
        }
        if (student.Instagram) {
            socialIconsHTML += `<a href="${escapeHtml(student.Instagram)}" target="_blank" class="social-icon" title="Instagram"><i class="fab fa-instagram"></i></a>`;
        }
        
        return `
            <div class="student-card" data-index="${index}">
                <div class="card-header">
                    <h3 class="card-name">${escapeHtml(student.Name)}</h3>
                </div>
                <div class="card-badges">
                    <span class="badge-course">📚 ${escapeHtml(student.Course)}</span>
                    <span class="badge-year">🎓 ${escapeHtml(student.Year)}</span>
                </div>
                ${bioText ? `<div class="card-bio"><p>${escapeHtml(bioText)}${student.Bio.length > 100 ? '...' : ''}</p></div>` : '<div class="card-bio"><em>No bio provided</em></div>'}
                ${socialIconsHTML ? `<div class="card-social">${socialIconsHTML}</div>` : ''}
                <button class="view-details-btn" data-index="${index}">👁️ View Full Details</button>
            </div>
        `;
    }).join('');
    
    profilesContainer.innerHTML = profilesHTML;
    
    document.querySelectorAll('.view-details-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const index = parseInt(btn.getAttribute('data-index'));
            let student;
            
            if (currentFilter === 'all') {
                student = allStudents[index];
            } else {
                const filtered = allStudents.filter(s => s.Course === currentFilter);
                student = filtered[index];
            }
            
            if (student) openModal(student);
        });
    });
}

// ============================================
// OPEN MODAL WITH SOCIAL MEDIA
// ============================================
function openModal(student) {
    modalName.textContent = student.Name || 'No Name';
    modalCourse.textContent = `📚 ${student.Course || 'No Course'}`;
    modalYear.textContent = `🎓 ${student.Year || 'No Year'}`;
    modalBio.textContent = student.Bio?.trim() || 'No bio provided';
    modalAchievements.textContent = student.Achievements?.trim() || 'No achievements listed';
    
    // Handle social media links
    let hasSocial = false;
    let socialHTML = '';
    
    if (student.Facebook && student.Facebook.trim() !== '') {
        socialHTML += `
            <a href="${escapeHtml(student.Facebook)}" target="_blank" class="social-link">
                <i class="fab fa-facebook"></i> Facebook
            </a>
        `;
        hasSocial = true;
    }
    
    if (student.Instagram && student.Instagram.trim() !== '') {
        socialHTML += `
            <a href="${escapeHtml(student.Instagram)}" target="_blank" class="social-link">
                <i class="fab fa-instagram"></i> Instagram
            </a>
        `;
        hasSocial = true;
    }
    
    if (hasSocial) {
        modalSocialLinks.innerHTML = socialHTML;
        modalSocialSection.style.display = 'block';
    } else {
        modalSocialSection.style.display = 'none';
    }
    
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
}

// ============================================
// DISPLAY EMPTY STATE
// ============================================
function displayEmptyState(courseFilter) {
    if (courseFilter === 'all') {
        profilesContainer.innerHTML = `<div class="empty-state"><span>✨</span><p>No student profiles yet. Be the first to submit!</p></div>`;
    } else {
        profilesContainer.innerHTML = `<div class="empty-state"><span>🔍</span><p>No students found in ${escapeHtml(courseFilter)}</p><p>Try selecting a different course!</p></div>`;
    }
}

function closeModalFunction() {
    modal.classList.remove('show');
    document.body.style.overflow = 'auto';
}

// ============================================
// SUBMIT STUDENT DATA (WITH SOCIAL MEDIA)
// ============================================
async function submitStudentData(formData) {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';
    
    try {
        const response = await fetch(STUDENTS_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                Name: formData.name,
                Course: formData.course,
                Year: formData.year,
                Bio: formData.bio || '',
                Achievements: formData.achievements || '',
                Facebook: formData.facebook || '',
                Instagram: formData.instagram || ''
            })
        });
        
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        showSuccessMessage('✅ Profile submitted successfully!');
        studentForm.reset();
        setTimeout(() => fetchAllProfiles(), 1000);
        
    } catch (error) {
        showErrorMessage('❌ Failed to submit. Please try again.');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = '✨ Submit Profile';
    }
}

// ============================================
// VALIDATE FORM
// ============================================
function validateForm(name, course, year) {
    let isValid = true;
    
    document.getElementById('nameError').textContent = '';
    document.getElementById('courseError').textContent = '';
    document.getElementById('yearError').textContent = '';
    
    if (!name?.trim()) {
        document.getElementById('nameError').textContent = 'Full name is required';
        isValid = false;
    }
    if (!course) {
        document.getElementById('courseError').textContent = 'Please select a course';
        isValid = false;
    }
    if (!year) {
        document.getElementById('yearError').textContent = 'Please select a year level';
        isValid = false;
    }
    
    return isValid;
}

// ============================================
// MESSAGES & UTILITIES
// ============================================
function showSuccessMessage(msg) {
    formMessage.textContent = msg;
    formMessage.className = 'form-message success';
    setTimeout(() => { formMessage.textContent = ''; formMessage.className = 'form-message'; }, 4000);
}

function showErrorMessage(msg) {
    formMessage.textContent = msg;
    formMessage.className = 'form-message error';
    setTimeout(() => { formMessage.textContent = ''; formMessage.className = 'form-message'; }, 4000);
}

function showLoading(show) {
    if (show) {
        loadingIndicator.classList.remove('hidden');
        profilesContainer.style.opacity = '0.5';
    } else {
        loadingIndicator.classList.add('hidden');
        profilesContainer.style.opacity = '1';
    }
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// ============================================
// EVENT LISTENERS
// ============================================
studentForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('fullName').value;
    const course = document.getElementById('course').value;
    const year = document.getElementById('yearLevel').value;
    const bio = document.getElementById('bio').value;
    const achievements = document.getElementById('achievements').value;
    const facebook = document.getElementById('facebook').value;
    const instagram = document.getElementById('instagram').value;
    
    if (!validateForm(name, course, year)) {
        showErrorMessage('Please fill in all required fields!');
        return;
    }
    await submitStudentData({ name, course, year, bio, achievements, facebook, instagram });
});

refreshBtn.addEventListener('click', () => { fetchAllProfiles(); showSuccessMessage('Refreshing profiles...'); });
adminPanelBtn.addEventListener('click', () => { window.location.href = 'admin.html'; });

closeModal.forEach(btn => btn.addEventListener('click', closeModalFunction));
window.addEventListener('click', (e) => { if (e.target === modal) closeModalFunction(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && modal.classList.contains('show')) closeModalFunction(); });

// Initialize
document.addEventListener('DOMContentLoaded', () => { fetchAllProfiles(); });