/* The luminous hub opens existing rooms and their existing private tools. */
(function () {
  function openRoom(id, tool) {
    showScreen(id);
    if (tool === 'journal') openThinkingTool('write');
    if (tool === 'quiet') startCalmQuiet(60);
    var room = document.getElementById(id);
    var target = room && room.querySelector('h1, h2');
    if (target) {
      target.setAttribute('tabindex', '-1');
      // Keep room changes from forcing a second layout or opening a phone keyboard.
      requestAnimationFrame(function () { target.focus({preventScroll: true}); });
    }
  }
  var actions = {
    luminousRelease: function () { openRoom('rant'); },
    luminousCalm: function () { openRoom('calm'); },
    luminousThink: function () { openRoom('thinking'); },
    luminousQuiet: function () { openRoom('calm', 'quiet'); }
  };
  Object.keys(actions).forEach(function (id) {
    document.getElementById(id).addEventListener('click', actions[id]);
  });
  document.querySelectorAll('#retreat [data-view]').forEach(function (button) {
    button.addEventListener('click', function () {
      if (button.dataset.view === 'journal') openRoom('thinking', 'journal');
      else openRoom(button.dataset.view === 'breathing' ? 'calm' : 'great');
    });
  });
  // Run after the existing enhancement script creates its persistent navigation.
  function decorateNavigation() {
    var nav = document.querySelector('.mr-global-nav');
    if (!nav) return false;
    nav.classList.add('mr-luminous-nav');
    var paths = {
      home: 'M3 11 12 3l9 8M6 9v12h12V9M10 21v-7h4v7',
      map: 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z',
      back: 'm14 5-7 7 7 7M7 12h14',
      heart: 'M12 20S3 15 3 9a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 6-9 11-9 11Z'
    };
    nav.querySelectorAll('button').forEach(function (button) {
      var svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
      svg.setAttribute('viewBox','0 0 24 24');
      svg.setAttribute('fill','none');svg.setAttribute('stroke','currentColor');
      svg.setAttribute('stroke-width','1.4');svg.setAttribute('stroke-linecap','round');
      svg.setAttribute('stroke-linejoin','round');svg.setAttribute('aria-hidden','true');
      svg.classList.add('mr-nav-icon');
      var path = document.createElementNS('http://www.w3.org/2000/svg','path');
      var label = button.textContent.toLowerCase();
      var key = label.includes('home') ? 'home' : /map|great/.test(label) ? 'map' : label.includes('back') ? 'back' : 'heart';
      path.setAttribute('d',paths[key]);svg.appendChild(path);
      button.prepend(svg);
    });
    return true;
  }
  window.addEventListener('load', function () {
    if (decorateNavigation()) return;
    var observer = new MutationObserver(function () {
      if (decorateNavigation()) observer.disconnect();
    });
    observer.observe(document.body, {childList:true});
  });
})();
