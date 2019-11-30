var showResults = debounce(function (arg) {
  var value = arg.trim();
  if (value == "" || value.length <= 0) {
    $("#search-results").fadeOut();
    return;
  } else {
    $("#search-results").fadeIn();
  };
  var jqxhr = $.get('/search?q=' + value, function (data) {
      $("#search-results").html("");
    })
    .done(function (data) {
      console.log(data);
      if (data.length === 0) {
        $("#search-results").append('<p>No results</p>');
      } else {
        data.forEach(x => {
          $("#search-results").append(`<p><a class="anyclass" href="/restaurants/${x._id}">${x.name}</a></p><br>`);//search result
        });
        $('.anyclass').click(function() {
          $("#search-results").fadeOut();
        });
      }
    })
    .fail(function (err) {
      console.log(err);
    })
}, 300);

function debounce(func, wait, immediate) {
  var timeout;
  return function () {
    var context = this,
      args = arguments;
    var later = function () {
      timeout = null;
      if (!immediate) func.apply(context, args);
    };
    var callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func.apply(context, args);
  };
};
