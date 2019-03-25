

/**

Here's a pure Javascript function which allows you to wait for anything. Set the interval longer to take less CPU resource.

SRC : https://stackoverflow.com/questions/5525071/how-to-wait-until-an-element-exists#13709125

**/ 
/**
 * @brief Wait for something to be ready before triggering a timeout
 * @param {callback} isready Function which returns true when the thing we're waiting for has happened
 * @param {callback} success Function to call when the thing is ready
 * @param {callback} error Function to call if we time out before the event becomes ready
 * @param {int} count Number of times to retry the timeout (default 300 or 6s)
 * @param {int} interval Number of milliseconds to wait between attempts (default 20ms)
 */
function waitUntil(isready, success, error, count, interval){
    if (count === undefined) {
        count = 300;
    }
    if (interval === undefined) {
        interval = 20;
    }
    if (isready()) {
        success();
        return;
    }
    // The call back isn't ready. We need to wait for it
    setTimeout(function(){
        if (!count) {
            // We have run out of retries
            if (error !== undefined) {
                error();
            }
        } else {
            // Try again
            waitUntil(isready, success, error, count -1, interval);
        }
    }, interval);
}
/**
To call this, for example in jQuery, use something like:

waitUntil(function(){
    return $('#myelement').length > 0;
}, function(){
    alert("myelement now exists");
}, function(){
    alert("I'm bored. I give up.");
});

**/
