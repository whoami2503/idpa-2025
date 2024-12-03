function setSessionToken(){
    if (!localStorage.getItem('tempSessionId')) {
        localStorage.setItem('tempSessionId', generateRandomId());
      }
      
      const tempSessionId = localStorage.getItem('tempSessionId');
      
      function generateRandomId() {
        return Math.random().toString(36).substring(2, 9);
      }
}