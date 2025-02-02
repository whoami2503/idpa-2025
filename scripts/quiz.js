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

  const totalRating = data.reduce((sum, entry) => sum + entry.rating, 0);
  const averageRating = totalRating / data.length;


  avgContainer.classList.remove('hidden');

  const stars = avgContainer.querySelectorAll('svg');
  stars.forEach((star, index) => {
    const starIndex = index + 1;
    let fillPercentage = 0;

    if (starIndex <= averageRating) {
      fillPercentage = 100;  // full star
    } else if (starIndex - 1 < averageRating) {
      fillPercentage = (averageRating - (starIndex - 1)) * 100; // partial fill
    }

    star.innerHTML = `
      <defs>
        <linearGradient id="grvid-${adId}-${index}" gradientUnits="userSpaceOnUse" x1="0" x2="100%">
          <stop offset="${fillPercentage}%" stop-color="#facc15"/>
          <stop offset="${fillPercentage}%" stop-color="gray"/>
        </linearGradient>
      </defs>
      <path fill="url(#grvid-${adId}-${index})"
            d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0
               l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651
               l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591
               l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637
               3.62-3.102c.635-.544.297-1.584-.536-1.65
               l-4.752-.382-1.831-4.401z">
      </path>
    `;
  });

  const avgText = avgContainer.querySelector('#avg');
  if (avgText) {
    avgText.textContent = `${averageRating.toFixed(1)}`;
  }

  const srText = avgContainer.querySelector('p.sr-only');
  if (srText) {
    srText.textContent = `${averageRating.toFixed(1)} out of 5 stars`;
  }
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
      await updateAverageRating(adId);
    }
  }

}

checkUserVotes();
