// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    // Set today's date as default
    const dateInput = document.getElementById('date');
    const today = new Date().toISOString().split('T')[0];
    dateInput.value = today;
    dateInput.max = today;

    // Load saved entries from localStorage
    loadEntries();
    updateSummary();

    // Handle form submission
    const studyForm = document.getElementById('studyForm');
    studyForm.addEventListener('submit', handleFormSubmit);

    // Handle clear all button
    const clearAllBtn = document.getElementById('clearAllBtn');
    clearAllBtn.addEventListener('click', showConfirmModal);

    // Handle modal buttons
    document.getElementById('cancelBtn').addEventListener('click', hideConfirmModal);
    document.getElementById('confirmBtn').addEventListener('click', clearAllData);

    // Handle filter and sort
    document.getElementById('filterCategory').addEventListener('change', applyFilters);
    document.getElementById('sortBy').addEventListener('change', applyFilters);
});

// Handle form submission
function handleFormSubmit(e) {
    e.preventDefault();

    // Get form values
    const entry = {
        id: Date.now(),
        date: document.getElementById('date').value,
        problems: parseInt(document.getElementById('problems').value),
        hours: parseFloat(document.getElementById('hours').value),
        topic: document.getElementById('topic').value,
        category: document.getElementById('category').value,
        notes: document.getElementById('notes').value
    };

    // Save entry
    saveEntry(entry);

    // Reset form
    document.getElementById('studyForm').reset();
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('date').value = today;

    // Update display
    loadEntries();
    updateSummary();
}

// Save entry to localStorage
function saveEntry(entry) {
    let entries = getEntries();
    entries.unshift(entry);
    localStorage.setItem('studyEntries', JSON.stringify(entries));
}

// Get all entries from localStorage
function getEntries() {
    const entries = localStorage.getItem('studyEntries');
    return entries ? JSON.parse(entries) : [];
}

// Delete single entry
function deleteEntry(id) {
    let entries = getEntries();
    entries = entries.filter(entry => entry.id !== id);
    localStorage.setItem('studyEntries', JSON.stringify(entries));
    loadEntries();
    updateSummary();
}

// Load and display entries
function loadEntries() {
    const entries = getEntries();
    const entryHistory = document.getElementById('entryHistory');
    const clearAllBtn = document.getElementById('clearAllBtn');
    const filterSection = document.getElementById('filterSection');

    if (entries.length === 0) {
        entryHistory.innerHTML = '<p class="no-entries">No entries yet. Start tracking your progress!</p>';
        clearAllBtn.style.display = 'none';
        filterSection.style.display = 'none';
        return;
    }

    clearAllBtn.style.display = 'block';
    filterSection.style.display = 'flex';
    applyFilters();
}

// Apply filters and sorting
function applyFilters() {
    const entries = getEntries();
    const categoryFilter = document.getElementById('filterCategory').value;
    const sortBy = document.getElementById('sortBy').value;
    const entryHistory = document.getElementById('entryHistory');

    // Filter entries
    let filteredEntries = entries;
    if (categoryFilter !== 'all') {
        filteredEntries = entries.filter(entry => entry.category === categoryFilter);
    }

    // Sort entries
    switch(sortBy) {
        case 'newest':
            filteredEntries.sort((a, b) => new Date(b.date) - new Date(a.date));
            break;
        case 'oldest':
            filteredEntries.sort((a, b) => new Date(a.date) - new Date(b.date));
            break;
        case 'mostProblems':
            filteredEntries.sort((a, b) => b.problems - a.problems);
            break;
        case 'mostHours':
            filteredEntries.sort((a, b) => b.hours - a.hours);
            break;
    }

    // Display filtered entries
    if (filteredEntries.length === 0) {
        entryHistory.innerHTML = '<p class="no-entries">No entries found for this filter.</p>';
        return;
    }

    entryHistory.innerHTML = '';
    filteredEntries.forEach(entry => {
        const entryElement = createEntryElement(entry);
        entryHistory.appendChild(entryElement);
    });
}

// Create HTML element for an entry
function createEntryElement(entry) {
    const div = document.createElement('div');
    div.className = 'entry-item';

    const formattedDate = formatDate(entry.date);

    div.innerHTML = `
        <button class="entry-delete-btn" onclick="deleteEntry(${entry.id})">Delete</button>
        <div class="entry-header">
            <span class="entry-date">${formattedDate}</span>
            <span class="entry-category">${entry.category}</span>
        </div>
        <div class="entry-topic">${entry.topic}</div>
        <div class="entry-stats">
            <span class="entry-stat"><strong>${entry.problems}</strong> problems</span>
            <span class="entry-stat"><strong>${entry.hours}</strong> hours</span>
        </div>
        ${entry.notes ? `<div class="entry-notes">${entry.notes}</div>` : ''}
    `;

    return div;
}

// Format date to readable format
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('en-US', options);
}

// Update weekly summary
function updateSummary() {
    const entries = getEntries();
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    // Filter entries from last 7 days
    const weekEntries = entries.filter(entry => {
        const entryDate = new Date(entry.date + 'T00:00:00');
        return entryDate >= weekAgo;
    });

    // Calculate totals
    const totalProblems = weekEntries.reduce((sum, entry) => sum + entry.problems, 0);
    const totalHours = weekEntries.reduce((sum, entry) => sum + entry.hours, 0);
    const totalDays = new Set(weekEntries.map(entry => entry.date)).size;

    // Calculate streak
    const streak = calculateStreak(entries);

    // Update display
    document.getElementById('totalProblems').textContent = totalProblems;
    document.getElementById('totalHours').textContent = totalHours.toFixed(1);
    document.getElementById('studyStreak').textContent = streak;
    document.getElementById('totalDays').textContent = totalDays;
}

// Calculate study streak
function calculateStreak(entries) {
    if (entries.length === 0) return 0;

    // Sort entries by date (newest first)
    const sortedEntries = [...entries].sort((a, b) => 
        new Date(b.date) - new Date(a.date)
    );

    // Get unique dates
    const uniqueDates = [...new Set(sortedEntries.map(entry => entry.date))];

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < uniqueDates.length; i++) {
        const entryDate = new Date(uniqueDates[i] + 'T00:00:00');
        const expectedDate = new Date(today);
        expectedDate.setDate(today.getDate() - i);
        expectedDate.setHours(0, 0, 0, 0);

        if (entryDate.getTime() === expectedDate.getTime()) {
            streak++;
        } else {
            break;
        }
    }

    return streak;
}

// Show confirmation modal
function showConfirmModal() {
    document.getElementById('confirmModal').classList.add('show');
}

// Hide confirmation modal
function hideConfirmModal() {
    document.getElementById('confirmModal').classList.remove('show');
}

// Clear all data
function clearAllData() {
    localStorage.removeItem('studyEntries');
    hideConfirmModal();
    loadEntries();
    updateSummary();
}

// Export data as JSON
function exportData() {
    const entries = getEntries();
    const dataStr = JSON.stringify(entries, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'skilltracker-data.json';
    link.click();
    URL.revokeObjectURL(url);
}