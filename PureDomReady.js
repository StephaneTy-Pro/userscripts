/*
https://stackoverflow.com/questions/2304941/what-is-the-non-jquery-equivalent-of-document-ready#21814964
*/


(function(exports, d) {
  function domReady(fn, context) {

    function onReady(event) {
      d.removeEventListener("DOMContentLoaded", onReady);
      fn.call(context || exports, event);
    }

    function onReadyIe(event) {
      if (d.readyState === "complete") {
        d.detachEvent("onreadystatechange", onReadyIe);
        fn.call(context || exports, event);
      }
    }

    d.addEventListener && d.addEventListener("DOMContentLoaded", onReady) ||
    d.attachEvent      && d.attachEvent("onreadystatechange", onReadyIe);
  }

  exports.domReady = domReady;
})(window, document);

/*
usage
How to use it

<script src="domready.js"></script>
<script>
  domReady(function(event) {
    alert("dom is ready!");
  });
</script>

You can also change the context in which the callback runs by passing a second argument

function init(event) {
  alert("check the console");
  this.log(event);
}

domReady(init, console);

*/
