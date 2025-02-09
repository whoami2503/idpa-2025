import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';
const supabaseUrl = 'https://krdbfisalhgpdcgpljys.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtyZGJmaXNhbGhncGRjZ3BsanlzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzMyMTY0OTYsImV4cCI6MjA0ODc5MjQ5Nn0.uZ2dHyyUocn8kh4lC-l5FiWa9rCDP0ZFcRnG0mfyIk0';
const supabase = createClient(supabaseUrl, supabaseKey);

// Attach event listeners for each "vid-X" form
document.querySelectorAll('form[id^="vid-"]').forEach(form => {
  const starButtons = form.querySelectorAll('button[data-rating]');
  let selectedRating = null;

  // Star selection logic
  starButtons.forEach(button => {
    button.addEventListener('click', function () {
      const rating = this.getAttribute('data-rating');
      selectedRating = rating;

      // Reset all star buttons for this form
      starButtons.forEach(btn => {
        btn.classList.remove('text-yellow-400');
        btn.classList.add('text-gray-300');
      });

      // Highlight from star #1 up to this star
      for (let i = 1; i <= rating; i++) {
        const starToHighlight = form.querySelector(`button[data-rating="${i}"]`);
        if (starToHighlight) {
          starToHighlight.classList.remove('text-gray-300');
          starToHighlight.classList.add('text-yellow-400');
        }
      }
    });
  });

  // On submit, insert the rating, hide the form, then show avg
  form.addEventListener('submit', async function (e) {
    e.preventDefault();

    const tempSessionId = localStorage.getItem('tempSessionId');
    if (!selectedRating) {
      return;
    }

    const adId = form.getAttribute('id').split('-')[1];

    const payload = {
      rating: parseInt(selectedRating),
      ad_id: parseInt(adId),
      tempSessionId: tempSessionId,
    };

    try {
      const { data, error } = await supabase
        .from('rating')
        .insert([payload]);

      if (error) {
        console.error('Error submitting rating:', error);
        alert('Failed to submit rating.');
      } else {
        form.classList.remove('md:flex');
        form.classList.add('hidden');

        await updateAverageRating(adId);
      }
    } catch (err) {
      console.error('Error:', err);
      alert('An error occurred while submitting your rating.');
    }
  });
});

/**
 * Fetch all ratings for a given ad, compute average, then show the stars
 */
async function updateAverageRating(adId) {
  const avgContainer = document.getElementById(`avg-vid-${adId}`);
  if (!avgContainer) {
    console.warn(`No avgContainer found for vid-${adId}`);
    return;
  }

  let { data, error } = await supabase
    .from('rating')
    .select('rating')
    .eq('ad_id', adId);

  if (error) {
    console.error(`Error fetching ratings for ad ${adId}:`, error);
    return;
  }

  if (!data || data.length === 0) {
    return;
  }

  const totalRatings = data.length;
  const totalRatingSum = data.reduce((sum, entry) => sum + entry.rating, 0);
  const averageRating = totalRatingSum / totalRatings;

  avgContainer.classList.remove('hidden');

  const avgText = avgContainer.querySelector('#avg');
  if (avgText) {
    avgText.textContent = `${averageRating.toFixed(1)}`;
  }

  const srText = avgContainer.querySelector('p.sr-only');
  if (srText) {
    srText.textContent = `${averageRating.toFixed(1)} out of 5 stars`;
  }

  // Generate rating distribution chart
  renderRatingDistributionChart(adId, data);
}


// Store chart instances to prevent multiple overlays
const chartInstances = {};

/**
 * Generates a bar chart showing the distribution of ratings (1-star, 2-star, ..., 5-star).
 */
function renderRatingDistributionChart(adId, ratingData) {
  const chartContainerId = `rating-distribution-${adId}`;

  // Check if a canvas already exists, otherwise create one
  let chartContainer = document.getElementById(chartContainerId);
  if (!chartContainer) {
    chartContainer = document.createElement('canvas');
    chartContainer.id = chartContainerId;
    chartContainer.style.marginTop = "20px";
    chartContainer.style.marginLeft = "16px";
    chartContainer.style.maxWidth = "400px";  // Fix: Set max width
    chartContainer.style.maxHeight = "300px"; // Fix: Set max height
    document.getElementById(`avg-vid-${adId}`).appendChild(chartContainer);
  } else {
    // Destroy the previous chart instance if it exists
    if (chartInstances[adId]) {
      chartInstances[adId].destroy();
    }
  }

  // Count occurrences of each rating (1-5)
  const ratingCounts = [0, 0, 0, 0, 0]; // Index 0 = 1-star, Index 4 = 5-star

  ratingData.forEach(entry => {
    if (entry.rating >= 1 && entry.rating <= 5) {
      ratingCounts[entry.rating - 1] += 1;
    }
  });

  // Create the Chart.js bar chart
  const newChart = new Chart(chartContainer, {
    type: 'bar',
    data: {
      labels: ['1 Stern', '2 Sterne', '3 Sterne', '4 Sterne', '5 Sterne'],
      datasets: [
        {
          label: 'Anzahl Bewertungen',
          data: ratingCounts,
          backgroundColor: ['#FF3D00', '#FF9100', '#FFC107', '#4CAF50', '#1B5E20'],
          borderColor: ['#B71C1C', '#E65100', '#FFA000', '#388E3C', '#0D5302'],
          borderWidth: 1,
        }
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1,
          },
        },
      },
      plugins: {
        legend: {
          display: false,
        },
      },
    },
  });

  // Save the new chart instance
  chartInstances[adId] = newChart;
}


/**
 * Check if the user with this tempSessionID has already voted on each ad.
 */
async function checkUserVotes() {
  const tempSessionId = localStorage.getItem('tempSessionId');

  if (!tempSessionId) {
    console.warn('No tempSessionId in localStorage, skipping checkUserVotes()');
    return;
  }

  const forms = document.querySelectorAll('form[id^="vid-"]');

  for (const form of forms) {
    const adId = form.getAttribute('id').split('-')[1];

    const { data, error } = await supabase
      .from('rating')
      .select('id, rating, tempSessionId')
      .eq('ad_id', adId)
      .eq('tempSessionId', tempSessionId);


    if (error) {
      console.error('Error checking existing ratings:', error);
      continue;
    }

    if (data && data.length > 0) {
      form.classList.add('hidden');
      form.classList.remove('md:flex');
      await updateAverageRating(adId);
    }
  }

}

checkUserVotes();
