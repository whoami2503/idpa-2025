
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';
const supabaseUrl = 'https://krdbfisalhgpdcgpljys.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtyZGJmaXNhbGhncGRjZ3BsanlzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzMyMTY0OTYsImV4cCI6MjA0ODc5MjQ5Nn0.uZ2dHyyUocn8kh4lC-l5FiWa9rCDP0ZFcRnG0mfyIk0';
const supabase = createClient(supabaseUrl, supabaseKey);

console.log('Supabase client:', supabase);

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
            alert('Please select a rating before submitting.');
            return;
        }

        const adId = form.getAttribute('id').split("-")[1]


        const payload = {
            rating: parseInt(selectedRating),
            ad_id: parseInt(adId),
            tempSessionId: tempSessionId,
        };
        console.log(payload);
        try {
            const { data, error } = await supabase
                .from('rating')
                .insert([payload]);

            if (error) {
                console.log('Error submitting rating:', error);
                alert('Failed to submit rating.');
            } else {
                alert('Rating submitted successfully!');
                console.log('Response data:', data);
            }
        } catch (err) {
            console.error('Error:', err);
            alert('An error occurred while submitting your rating.');
        }
    });
});
