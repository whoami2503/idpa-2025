
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

            const adId = form.getAttribute('id').split("-")[1]


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
                    updateAverageRating(ad_id)
                }
            } catch (err) {
                console.error('Error:', err);
                alert('An error occurred while submitting your rating.');
            }
        }

    });
});

async function updateAverageRating(adId) {
    const avgContainer = document.getElementById(`avg-ad-${adId}`);
    if (!avgContainer) return;

    try {

        const { data, error } = await supabase
        .from('rating')
        .select('rating')
        .eq('ad_id', 1);

        if (error) {
            console.error('Error fetching ratings:', error);
            return;
        }

        if (data.length === 0) return; // No ratings available

        // Calculate the average rating
        const totalRating = data.reduce((sum, entry) => sum + entry.rating, 0);
        const averageRating = totalRating / data.length; // Keep as float

        console.log(`Average rating for ad ${adId}:`, averageRating);

        // Update the stars dynamically
        const stars = avgContainer.querySelectorAll('svg');

        stars.forEach((star, index) => {
            const starIndex = index + 1;
            let fillPercentage = 0;

            if (starIndex <= averageRating) {
                fillPercentage = 100; // Fully filled star
            } else if (starIndex - 1 < averageRating) {
                fillPercentage = (averageRating - (starIndex - 1)) * 100; // Partial fill
            }

            // Apply fill logic with gradient
            star.innerHTML = `
                <defs>
                    <linearGradient id="grad-${adId}-${index}" gradientUnits="userSpaceOnUse" x1="0" x2="100%">
                        <stop offset="${fillPercentage}%" stop-color="yellow"/>
                        <stop offset="${fillPercentage}%" stop-color="gray"/>
                    </linearGradient>
                </defs>
                <path fill="url(#grad-${adId}-${index})" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z"></path>
            `;
        });

        // Update screen reader text
        const srText = avgContainer.querySelector('p.sr-only');
        if (srText) srText.textContent = `${averageRating.toFixed(1)} out of 5 stars`;

    } catch (err) {
        console.error('Error:', err);
    }

}

// Fetch and display average rating for all ads on page load
document.addEventListener('DOMContentLoaded', async () => {
    document.querySelectorAll('[id^="avg-ad-"]').forEach(container => {
        const adId = container.id.split('-')[2]; // Extract ad ID
        updateAverageRating(adId);
    });
});
