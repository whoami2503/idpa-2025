import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';
const supabaseUrl = 'https://krdbfisalhgpdcgpljys.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtyZGJmaXNhbGhncGRjZ3BsanlzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzMyMTY0OTYsImV4cCI6MjA0ODc5MjQ5Nn0.uZ2dHyyUocn8kh4lC-l5FiWa9rCDP0ZFcRnG0mfyIk0';
const supabase = createClient(supabaseUrl, supabaseKey);

// Attach event listeners for each "ad-X" form
document.querySelectorAll('form[id^="ad-"]').forEach(form => {
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
      console.log('No star rating selected, skipping...');
      return;
    }

    const adId = form.getAttribute('id').split('-')[1];
    console.log(`Submitting rating for ad ${adId} by user ${tempSessionId}`);

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
        console.log('Rating submitted successfully:', data);

        // Hide the form after success
        form.classList.add('hidden');

        // Now show the updated average rating
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
  const avgContainer = document.getElementById(`avg-ad-${adId}`);
  if (!avgContainer) {
    console.warn(`No avgContainer found for ad-${adId}`);
    return;
  }

  let { data, error } = await supabase
    .from('rating')
    .select('rating')
    .eq('ad_id', adId);

  console.log('updateAverageRating => data:', data, 'error:', error);

  if (error) {
    console.error(`Error fetching ratings for ad ${adId}:`, error);
    return;
  }

  // If no ratings in DB for this ad, there's nothing to display
  if (!data || data.length === 0) {
    console.log(`No ratings found yet for ad ${adId}`);
    return;
  }

  // Calculate the average
  const totalRating = data.reduce((sum, entry) => sum + entry.rating, 0);
  const averageRating = totalRating / data.length;

  console.log(`Average rating for ad ${adId} =`, averageRating);

  // Show the container
  avgContainer.classList.remove('hidden');

  // Fill the star graphics
  const stars = avgContainer.querySelectorAll('svg');
  stars.forEach((star, index) => {
    const starIndex = index + 1;
    let fillPercentage = 0;

    if (starIndex <= averageRating) {
      fillPercentage = 100;  // full star
    } else if (starIndex - 1 < averageRating) {
      fillPercentage = (averageRating - (starIndex - 1)) * 100; // partial fill
    }

    // Apply gradient fill
    star.innerHTML = `
      <defs>
        <linearGradient id="grad-${adId}-${index}" gradientUnits="userSpaceOnUse" x1="0" x2="100%">
          <stop offset="${fillPercentage}%" stop-color="#facc15"/>
          <stop offset="${fillPercentage}%" stop-color="gray"/>
        </linearGradient>
      </defs>
      <path fill="url(#grad-${adId}-${index})"
            d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0
               l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651
               l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591
               l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637
               3.62-3.102c.635-.544.297-1.584-.536-1.65
               l-4.752-.382-1.831-4.401z">
      </path>
    `;
  });

  // Update the numerical average text
  const avgText = avgContainer.querySelector('#avg');
  if (avgText) {
    avgText.textContent = `${averageRating.toFixed(1)}`;
  }

  // Screen reader text
  const srText = avgContainer.querySelector('p.sr-only');
  if (srText) {
    srText.textContent = `${averageRating.toFixed(1)} out of 5 stars`;
  }
}

/**
 * Check if the user with this tempSessionID has already voted on each ad.
 * If so, hide the form and show the average.
 */
async function checkUserVotes() {
  const tempSessionId = localStorage.getItem('tempSessionId');
  console.log('=== checkUserVotes() start ===');
  console.log('tempSessionId =', tempSessionId);

  if (!tempSessionId) {
    console.warn('No tempSessionId in localStorage, skipping checkUserVotes()');
    return;
  }

  // Grab all rating forms that have ID like "ad-1", "ad-2", ...
  const forms = document.querySelectorAll('form[id^="ad-"]');
  console.log('Forms found:', forms);

  for (const form of forms) {
    const adId = form.getAttribute('id').split('-')[1];
    console.log(`Checking if user ${tempSessionId} has already rated ad ${adId}`);

    const { data, error } = await supabase
      .from('rating')
      .select('id, rating, tempSessionId')
      .eq('ad_id', adId)
      .eq('tempSessionId', tempSessionId);

    console.log(`checkUserVotes => ad ${adId}`, 'data:', data, 'error:', error);

    if (error) {
      console.error('Error checking existing ratings:', error);
      continue;
    }

    // If a row already exists for this user & ad
    if (data && data.length > 0) {
      console.log(`User ${tempSessionId} has already rated ad ${adId}, hiding form...`);
      form.classList.add('hidden');
      await updateAverageRating(adId);
    }
  }

  console.log('=== checkUserVotes() end ===');
}

// Immediately run checkUserVotes() now that the script loads
checkUserVotes();
