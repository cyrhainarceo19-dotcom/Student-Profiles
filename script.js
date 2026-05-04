// ============================================
// STUDENT VIEW - WITH SOCIAL MEDIA AUTO-FORMAT
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

// Terms and Conditions Elements
const termsModal = document.getElementById('termsModal');
const showTermsLink = document.getElementById('showTermsLink');
const closeTermsModal = document.getElementById('closeTermsModal');
const acceptTermsBtn = document.getElementById('acceptTermsBtn');
const acceptTermsCheckbox = document.getElementById('acceptTermsCheckbox');
const termsError = document.getElementById('termsError');

// Variables
let allStudents = [];
let currentFilter = 'all';
let termsAccepted = false;

// ============================================
// HELPER FUNCTION: FORMAT SOCIAL MEDIA URL
// ============================================
function formatSocialMediaUrl(input, platform) {
    if (!input || input.trim() === '') {
        return '';
    }
    
    let url = input.trim();
    
    // Remove @ sign if present at the beginning
    if (url.startsWith('@')) {
        url = url.substring(1);
    }
    
    // Remove any trailing slashes
    while (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    
    // Check if it's already a valid full URL
    if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
    }
    
    // Check if it's facebook.com or instagram.com format without https
    if (url.includes('facebook.com') || url.includes('instagram.com')) {
        return 'https://' + url;
    }
    
    // Otherwise, construct the full URL
    if (platform === 'facebook') {
        return `https://facebook.com/${url}`;
    } else if (platform === 'instagram') {
        return `https://instagram.com/${url}`;
    }
    
    return url;
}

// ============================================
// REAL-TIME URL PREVIEW
// ============================================
function updateFacebookPreview() {
    const facebookInput = document.getElementById('facebook');
    const preview = document.getElementById('facebookPreview');
    if (preview && facebookInput) {
        const formatted = formatSocialMediaUrl(facebookInput.value, 'facebook');
        if (formatted) {
            preview.textContent = `✓ Magiging: ${formatted}`;
            preview.style.display = 'block';
        } else {
            preview.style.display = 'none';
        }
    }
}

function updateInstagramPreview() {
    const instagramInput = document.getElementById('instagram');
    const preview = document.getElementById('instagramPreview');
    if (preview && instagramInput) {
        const formatted = formatSocialMediaUrl(instagramInput.value, 'instagram');
        if (formatted) {
            preview.textContent = `✓ Magiging: ${formatted}`;
            preview.style.display = 'block';
        } else {
            preview.style.display = 'none';
        }
    }
}

// ============================================
// TERMS AND CONDITIONS FUNCTIONS
// ============================================
function showTermsModal() {
    termsModal.classList.add('show');
    document.body.style.overflow = 'hidden';
}

function closeTermsModalFunc() {
    termsModal.classList.remove('show');
    document.body.style.overflow = 'auto';
}

function acceptTerms() {
    acceptTermsCheckbox.checked = true;
    termsAccepted = true;
    termsError.textContent = '';
    closeTermsModalFunc();
    showSuccessMessage('✓ Terms accepted! You can now submit your profile.');
}

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
        
        let socialIconsHTML = '';
        if (student.Facebook && student.Facebook.trim() !== '') {
            socialIconsHTML += `<a href="${escapeHtml(student.Facebook)}" target="_blank" class="social-icon" title="Facebook"><i class="fab fa-facebook"></i></a>`;
        }
        if (student.Instagram && student.Instagram.trim() !== '') {
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
    
    let hasSocial = false;
    let socialHTML = '';
    
    if (student.Facebook && student.Facebook.trim() !== '') {
        socialHTML += `
            <a href="${escapeHtml(student.Facebook)}" target="_blank" class="social-link">
                <i class="fab fa-facebook"></i> Facebook Profile
            </a>
        `;
        hasSocial = true;
    }
    
    if (student.Instagram && student.Instagram.trim() !== '') {
        socialHTML += `
            <a href="${escapeHtml(student.Instagram)}" target="_blank" class="social-link">
                <i class="fab fa-instagram"></i> Instagram Profile
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
// SUBMIT STUDENT DATA (WITH URL FORMATTING)
// ============================================
async function submitStudentData(formData) {
    // Check if terms are accepted
    if (!acceptTermsCheckbox.checked && !termsAccepted) {
        termsError.textContent = 'Please read and accept the Terms and Conditions first';
        showTermsModal();
        return;
    }
    
    termsError.textContent = '';
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';
    
    // FORMAT SOCIAL MEDIA URLS
    let facebookUrl = '';
    let instagramUrl = '';
    
    if (formData.facebook && formData.facebook.trim() !== '') {
        facebookUrl = formatSocialMediaUrl(formData.facebook, 'facebook');
    }
    
    if (formData.instagram && formData.instagram.trim() !== '') {
        instagramUrl = formatSocialMediaUrl(formData.instagram, 'instagram');
    }
    
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
                Facebook: facebookUrl,
                Instagram: instagramUrl,
                TermsAccepted: 'Yes',
                DateAccepted: new Date().toISOString(),
                DateSubmitted: new Date().toISOString()
            })
        });
        
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        showSuccessMessage('✅ Profile submitted successfully! Thank you for accepting our Terms.');
        studentForm.reset();
        acceptTermsCheckbox.checked = false;
        termsAccepted = false;
        
        // Clear previews
        const fbPreview = document.getElementById('facebookPreview');
        const igPreview = document.getElementById('instagramPreview');
        if (fbPreview) fbPreview.style.display = 'none';
        if (igPreview) igPreview.style.display = 'none';
        
        setTimeout(() => fetchAllProfiles(), 1000);
        
    } catch (error) {
        console.error('Submit error:', error);
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
    } else if (name.trim().length < 2) {
        document.getElementById('nameError').textContent = 'Name must be at least 2 characters';
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

// Social Media Preview Listeners
const facebookInput = document.getElementById('facebook');
const instagramInput = document.getElementById('instagram');
if (facebookInput) facebookInput.addEventListener('input', updateFacebookPreview);
if (instagramInput) instagramInput.addEventListener('input', updateInstagramPreview);

// Terms Modal Event Listeners
showTermsLink?.addEventListener('click', (e) => {
    e.preventDefault();
    showTermsModal();
});
closeTermsModal?.addEventListener('click', closeTermsModalFunc);
acceptTermsBtn?.addEventListener('click', acceptTerms);

// Close modals
closeModal.forEach(btn => btn.addEventListener('click', closeModalFunction));
window.addEventListener('click', (e) => { 
    if (e.target === modal) closeModalFunction();
    if (e.target === termsModal) closeTermsModalFunc();
});
document.addEventListener('keydown', (e) => { 
    if (e.key === 'Escape') {
        if (modal.classList.contains('show')) closeModalFunction();
        if (termsModal.classList.contains('show')) closeTermsModalFunc();
    }
});

// Initialize
document.addEventListener('DOMContentLoaded', () => { 
    fetchAllProfiles();
});