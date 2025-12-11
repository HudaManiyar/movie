// client/public/worker.js
self.onmessage = function(e) {
    // Simulating a background task
    console.log('Worker received:', e.data);
    postMessage("Background task complete: " + e.data);
}