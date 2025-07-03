// Add accurate timer constructor function
function Timer(callback, timeInterval, options = {}) {
  this.timeInterval = timeInterval;
  // Track if the timer has been stopped so "round" can exit early and avoid rescheduling
  this._stopped = false;
  // Add method to start timer
  this.start = () => {
    // Set the expected time. The moment in time we start the timer plus whatever the time interval is.
    this.expected = Date.now() + this.timeInterval;
    // Start the timeout and save the id in a property, so we can cancel it later
    this.theTimeout = null;
    if (options.immediate) {
      callback();
    }
    this.timeout = setTimeout(this.round, this.timeInterval);
  };
  // Add method to stop timer
  this.stop = () => {
    this._stopped = true;
    clearTimeout(this.timeout);
  };
  // Round method that takes care of running the callback and adjusting the time
  this.round = () => {
    // If the timer has been stopped, do not execute callback or schedule further rounds
    if (this._stopped) return;
    // The drift will be the current moment in time for this round minus the expected time..
    let drift = Date.now() - this.expected;
    // Run error callback if drift is greater than time interval, and if the callback is provided
    if (drift > this.timeInterval) {
      // If error callback is provided
      if (options.errorCallback) {
        options.errorCallback();
      }
    }
    callback();
    // If the timer was stopped during the callback execution, exit before scheduling next round
    if (this._stopped) return;
    // Increment expected time by time interval for every round after running the callback function.
    this.expected += this.timeInterval;
    // Run timeout again and set the timeInterval of the next iteration to the original time interval minus the drift.
    this.timeout = setTimeout(this.round, this.timeInterval - drift);
  };
}

export default Timer; 