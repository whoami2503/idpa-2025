import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';
const supabaseUrl = 'https://krdbfisalhgpdcgpljys.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtyZGJmaXNhbGhncGRjZ3BsanlzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzMyMTY0OTYsImV4cCI6MjA0ODc5MjQ5Nn0.uZ2dHyyUocn8kh4lC-l5FiWa9rCDP0ZFcRnG0mfyIk0';
const supabase = createClient(supabaseUrl, supabaseKey);

document.querySelectorAll('form').forEach(form => {
    const starButtons = form.querySelectorAll('button[data-rating]');
    let selectedRating = null;

    starButtons.forEach(button => {
        button.addEventListener('click', function () {
            const rating = this.getAttribute('data-rating');
            selectedRating = rating;

            // Reset star buttons
            starButtons.forEach(btn => {
                btn.classList.remove('text-yellow-400');
                btn.classList.add('text-gray-300');
            });

            // Highlight selected stars
            for (let i = 1; i <= rating; i++) {
                const starToHighlight = form.querySelector(`button[data-rating="${i}"]`);
                if (starToHighlight) {
                    starToHighlight.classList.remove('text-gray-300');
                    starToHighlight.classList.add('text-yellow-400');
                }
            }
        });
    });

    form.addEventListener('submit', async function (e) {
        e.preventDefault();

        const tempSessionId = localStorage.getItem('tempSessionId');
        if (!selectedRating) {
            return;
        } else {
            const adId = form.getAttribute('id').split("-")[1];

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
                    console.log('Error submitting rating:', error);
                    alert('Failed to submit rating.');
                } else {
                    console.log('Response data:', data);

                    form.classList.add('hidden');
                    await updateAverageRating(adId);
                }
            } catch (err) {
                console.error('Error:', err);
                alert('An error occurred while submitting your rating.');
            }
        }
    });
});

// Function to calculate avg of ratings and to display as stars
async function updateAverageRating(adId) {
    const avgContainer = document.getElementById(`avg-ad-${adId}`);

    if (!avgContainer) return;

    try {
        const { data, error } = await supabase
            .from('rating')
            .select('rating')
            .eq('ad_id', adId);

        if (error) {
            console.error('Error fetching ratings:', error);
            return;
        }

        if (data.length === 0) return;


        const totalRating = data.reduce((sum, entry) => sum + entry.rating, 0);
        const averageRating = totalRating / data.length; // Keep as float

        console.log(`Average rating for ad ${adId}:`, averageRating);

        avgContainer.classList.remove('hidden');

        const stars = avgContainer.querySelectorAll('svg');

        stars.forEach((star, index) => {
            const starIndex = index + 1;
            let fillPercentage = 0;

            if (starIndex <= averageRating) {
                fillPercentage = 100; // Fully filled star
            } else if (starIndex - 1 < averageRating) {
                fillPercentage = (averageRating - (starIndex - 1)) * 100; // Partial fill
            }

            star.innerHTML = `
                <defs>
                    <linearGradient id="grad-${adId}-${index}" gradientUnits="userSpaceOnUse" x1="0" x2="100%">
                        <stop offset="${fillPercentage}%" stop-color="#facc15"/>
                        <stop offset="${fillPercentage}%" stop-color="gray"/>
                    </linearGradient>
                </defs>
                <path fill="url(#grad-${adId}-${index})" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z"></path>
            `;
        });

        const avgText = avgContainer.querySelector('#avg');
        if (avgText) {
            avgText.textContent = `${averageRating.toFixed(1)}`;
        }

        // Update screen reader text
        const srText = avgContainer.querySelector('p.sr-only');
        if (srText) srText.textContent = `${averageRating.toFixed(1)} out of 5 stars`;

    } catch (err) {
        console.error('Error:', err);
    }
}

// Function to check wether user with tempSessionID has already voted for a certain ad
async function checkUserVotes() {
    const tempSessionId = localStorage.getItem('tempSessionId');
    if (!tempSessionId) return;
    const forms = document.querySelectorAll('form[id^="ad-"]');

    for (const form of forms) {
      const adId = form.getAttribute('id').split('-')[1];

      const { data, error } = await supabase
        .from('rating')
        .select('*')
        .eq('ad_id', adId)
        .eq('tempSessionId', tempSessionId);
      if (error) {
        console.error('Error checking existing ratings:', error);
        continue;
      }
      if (data.length > 0) {
        form.classList.add('hidden');
        await updateAverageRating(adId);
      }
    }
  }


document.addEventListener('DOMContentLoaded', async () => {
    checkUserVotes();
});