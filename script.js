// ============================================
// STUDENT PROFILE SYSTEM - WITH MODAL DETAILS
// Using Sheet.best - NO CORS ISSUES!
// ============================================

// Sheet.best API URL (your working endpoint)
const SHEETBEST_URL = 'https://api.sheetbest.com/sheets/090c207b-1ec1-4403-9ae5-5fbeff38e513';

// DOM Elements
const studentForm = document.getElementById('studentForm');
const submitBtn = document.getElementById('submitBtn');
const profilesContainer = document.getElementById('profilesContainer');
const loadingIndicator = document.getElementById('loadingIndicator');
const refreshBtn = document.getElementById('refreshBtn');
const formMessage = document.getElementById('formMessage');

// Modal Elements
const modal = document.getElementById('studentModal');
const closeModal = document.querySelector('.close-modal');
const modalName = document.getElementById('modalName');
const modalCourse = document.getElementById('modalCourse');
const modalYear = document.getElementById('modalYear');
const modalBio = document.getElementById('modalBio');
const modalAchievements = document.getElementById('modalAchievements');

// ============================================
// FETCH ALL STUDENT PROFILES (GET Request)
// ============================================
async function fetchAllProfiles() {
    showLoading(true);
    
    try {
        const response = await fetch(SHEETBEST_URL);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const students = await response.json();
        console.log('Fetched students:', students);
        
        if (students.length === 0) {
            displayEmptyState();
        } else {
            displayProfiles(students);
        }
        
    } catch (error) {
        console.error('Error fetching profiles:', error);
        profilesContainer.innerHTML = `
            <div class="empty-state">
                <span>⚠️</span>
                <p>Error loading profiles: ${error.message}</p>
                <p>Please check your internet connection and try again.</p>
            </div>
        `;
    } finally {
        showLoading(false);
    }
}

// ============================================
// DISPLAY PROFILES AS CARDS
// ============================================
function displayProfiles(students) {
    if (!students || students.length === 0) {
        displayEmptyState();
        return;
    }
    
    const profilesHTML = students.map((student, index) => {
        const bioText = student.Bio && student.Bio.trim() !== '' ? student.Bio : '';
        const achievementsText = student.Achievements && student.Achievements.trim() !== '' ? student.Achievements : '';
        
        return `
            <div class="student-card" data-index="${index}" data-student='${JSON.stringify(student).replace(/'/g, "&#39;")}'>
                <div class="card-header">
                    <h3 class="card-name">${escapeHtml(student.Name)}</h3>
                </div>
                <div class="card-badges">
                    <span class="badge-course">📚 ${escapeHtml(student.Course)}</span>
                    <span class="badge-year">🎓 ${escapeHtml(student.Year)}</span>
                </div>
                ${bioText ? `
                <div class="card-bio">
                    <strong>📝 Bio:</strong>
                    <p>${escapeHtml(bioText.substring(0, 100))}${bioText.length > 100 ? '...' : ''}</p>
                </div>
                ` : ''}
                <div class="card-footer">
                    <button class="view-details-btn" data-index="${index}">👁️ View Details</button>
                </div>
            </div>
        `;
    }).join('');
    
    profilesContainer.innerHTML = profilesHTML;
    
    // Add click event listeners to all "View Details" buttons
    document.querySelectorAll('.view-details-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const index = btn.getAttribute('data-index');
            openModal(students[parseInt(index)]);
        });
    });
}

// ============================================
// OPEN MODAL WITH STUDENT DETAILS
// ============================================
function openModal(student) {
    modalName.textContent = student.Name || 'No Name';
    modalCourse.textContent = `📚 ${student.Course || 'No Course'}`;
    modalYear.textContent = `🎓 ${student.Year || 'No Year'}`;
    modalBio.textContent = student.Bio && student.Bio.trim() !== '' ? student.Bio : 'No bio provided';
    modalAchievements.textContent = student.Achievements && student.Achievements.trim() !== '' ? student.Achievements : 'No achievements listed';
    
    modal.classList.add('show');
    document.body.style.overflow = 'hidden'; // Prevent scrolling when modal is open
}

// ============================================
// CLOSE MODAL
// ============================================
function closeModalFunction() {
    modal.classList.remove('show');
    document.body.style.overflow = 'auto'; // Restore scrolling
}

// ============================================
// SUBMIT STUDENT DATA (POST Request)
// ============================================
async function submitStudentData(formData) {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';
    
    try {
        const response = await fetch(SHEETBEST_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                Name: formData.name,
                Course: formData.course,
                Year: formData.year,
                Bio: formData.bio || '',
                Achievements: formData.achievements || ''
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const result = await response.json();
        console.log('Submit result:', result);
        
        showSuccessMessage('✅ Profile submitted successfully!');
        
        // Clear form
        studentForm.reset();
        
        // Refresh profiles to show the new student
        setTimeout(() => {
            fetchAllProfiles();
        }, 1000);
        
    } catch (error) {
        console.error('Error submitting:', error);
        showErrorMessage('❌ Failed to submit. Please try again.');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = '✨ Submit Profile';
    }
}

// ============================================
// DISPLAY EMPTY STATE
// ============================================
function displayEmptyState() {
    profilesContainer.innerHTML = `
        <div class="empty-state">
            <span>✨</span>
            <p>No student profiles yet. Be the first to submit!</p>
            <p style="font-size: 0.9rem; margin-top: 0.5rem;">Fill out the form above to get started.</p>
        </div>
    `;
}

// ============================================
// SHOW/HIDE LOADING INDICATOR
// ============================================
function showLoading(show) {
    if (show) {
        loadingIndicator.classList.remove('hidden');
        profilesContainer.style.opacity = '0.5';
    } else {
        loadingIndicator.classList.add('hidden');
        profilesContainer.style.opacity = '1';
    }
}

// ============================================
// VALIDATE FORM INPUTS
// ============================================
function validateForm(name, course, year) {
    let isValid = true;
    
    // Clear previous errors
    document.getElementById('nameError').textContent = '';
    document.getElementById('courseError').textContent = '';
    document.getElementById('yearError').textContent = '';
    
    // Validate Full Name
    if (!name || name.trim() === '') {
        document.getElementById('nameError').textContent = 'Full name is required';
        isValid = false;
    } else if (name.trim().length < 2) {
        document.getElementById('nameError').textContent = 'Name must be at least 2 characters';
        isValid = false;
    }
    
    // Validate Course
    if (!course || course.trim() === '') {
        document.getElementById('courseError').textContent = 'Course is required';
        isValid = false;
    } else if (course.trim().length < 2) {
        document.getElementById('courseError').textContent = 'Course must be at least 2 characters';
        isValid = false;
    }
    
    // Validate Year Level
    if (!year || year === '') {
        document.getElementById('yearError').textContent = 'Please select a year level';
        isValid = false;
    }
    
    return isValid;
}

// ============================================
// SHOW MESSAGES
// ============================================
function showSuccessMessage(message) {
    formMessage.textContent = message;
    formMessage.className = 'form-message success';
    setTimeout(() => {
        formMessage.textContent = '';
        formMessage.className = 'form-message';
    }, 4000);
}

function showErrorMessage(message) {
    formMessage.textContent = message;
    formMessage.className = 'form-message error';
    setTimeout(() => {
        formMessage.textContent = '';
        formMessage.className = 'form-message';
    }, 4000);
}

// ============================================
// HELPER: Escape HTML to prevent XSS
// ============================================
function escapeHtml(str) {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
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
    
    if (!validateForm(name, course, year)) {
        showErrorMessage('Please fill in all required fields!');
        return;
    }
    
    await submitStudentData({ name, course, year, bio, achievements });
});

refreshBtn.addEventListener('click', () => {
    fetchAllProfiles();
    showSuccessMessage('Refreshing profiles...');
});

// Modal event listeners
closeModal.addEventListener('click', closeModalFunction);
window.addEventListener('click', (e) => {
    if (e.target === modal) {
        closeModalFunction();
    }
});
// Close modal with Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('show')) {
        closeModalFunction();
    }
});

// ============================================
// INITIALIZE - Load profiles on page load
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    fetchAllProfiles();
});