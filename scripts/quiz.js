document.querySelectorAll('form').forEach(form => {
    const starButtons = form.querySelectorAll('button[data-rating]');
    let selectedRating = null;

    // Attach event listeners to star buttons
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

    // Submit form data to Supabase
    form.addEventListener('submit', async function (e) {
        e.preventDefault(); // Prevent default form submission

        const tempSessionId = localStorage.getItem('tempSessionId');
        const adId = form.getAttribute('id'); // e.g., "ad-1"

        if (!selectedRating) {
            alert('Please select a rating before submitting.');
            return;
        }

        // Payload to send to Supabase
        const payload = {
            rating: selectedRating,
            id: adId,
            tempSessionId: tempSessionId,
        };

        console.log(payload)

        // try {
        //     const response = await fetch('https://your-supabase-project-url.supabase.co/rest/v1/ratings', {
        //         method: 'POST',
        //         headers: {
        //             'Content-Type': 'application/json',
        //             'apikey': 'your-supabase-api-key', // Replace with your actual Supabase API key
        //         },
        //         body: JSON.stringify(payload),
        //     });

        //     if (response.ok) {
        //         alert('Rating submitted successfully!');
        //     } else {
        //         const error = await response.json();
        //         console.error('Error submitting rating:', error);
        //         alert('Failed to submit rating.');
        //     }
        // } catch (err) {
        //     console.error('Error:', err);
        //     alert('An error occurred while submitting your rating.');
        // }
    });
});
