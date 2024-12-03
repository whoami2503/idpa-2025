function postAnswer(id, rating, sessionId){
    fetch("https://jsonplaceholder.typicode.com/todos", {
        method: "POST",
        body: JSON.stringify({
          id: id,
          rating: rating,
          sessionId: localStorage.getItem('tempSessionId')
        }),
        headers: {
          "Content-type": "application/json; charset=UTF-8"
        }
      });
}

async function getAverageRating(id){
      const url = "https://example.org/products.json";
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Response status: ${response.status}`);
        }
    
        const json = await response.json();
        console.log(json);
      } catch (error) {
        console.error(error.message);
      }
}