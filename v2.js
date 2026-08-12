(function () {
  var reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var revealEls = Array.prototype.slice.call(document.querySelectorAll('[data-reveal]'));
  revealEls.forEach(function (el) {
    var delay = parseInt(el.getAttribute('data-delay') || '0', 10);
    el.style.setProperty('--reveal-delay', delay + 'ms');
  });

  if (!reducedMotion && 'IntersectionObserver' in window) {
    var revealObserver = new IntersectionObserver(function (entries, observer) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -5% 0px' });
    revealEls.forEach(function (el) { revealObserver.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
  }

  var reelVideos = Array.prototype.slice.call(document.querySelectorAll('video[data-video-reel]'));
  if (reelVideos.length) {
    Promise.all(Array.from({ length: 12 }, function (_, index) { return String(index + 1).padStart(2, '0'); }).map(function (part) {
      return fetch('assets/reel/reel-' + part + '.txt', { cache: 'force-cache' }).then(function (response) {
        if (!response.ok) throw new Error('Workshop reel part failed: ' + part);
        return response.text();
      });
    })).then(function (parts) {
      var reelSrc = 'data:video/mp4;base64,' + parts.join('').replace(/\s+/g, '');
      reelVideos.forEach(function (video) {
        video.src = reelSrc;
        video.load();
        if (!reducedMotion) {
          var promise = video.play();
          if (promise && promise.catch) promise.catch(function () {});
        }
      });
    }).catch(function () {});
  }

  var videos = Array.prototype.slice.call(document.querySelectorAll('.js-autoplay'));
  if ('IntersectionObserver' in window && !reducedMotion) {
    var videoObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var video = entry.target;
        if (entry.isIntersecting) {
          var promise = video.play();
          if (promise && promise.catch) promise.catch(function () {});
        } else {
          video.pause();
        }
      });
    }, { threshold: 0.28, rootMargin: '140px 0px' });
    videos.forEach(function (video) { videoObserver.observe(video); });
  } else {
    videos.forEach(function (video) { video.pause(); });
  }

  if (!reducedMotion && window.matchMedia && window.matchMedia('(pointer:fine)').matches) {
    document.querySelectorAll('[data-tilt]').forEach(function (card) {
      card.addEventListener('pointermove', function (event) {
        var rect = card.getBoundingClientRect();
        var x = (event.clientX - rect.left) / rect.width - 0.5;
        var y = (event.clientY - rect.top) / rect.height - 0.5;
        card.style.setProperty('--ry', (x * 3.2).toFixed(2) + 'deg');
        card.style.setProperty('--rx', (-y * 2.6).toFixed(2) + 'deg');
      });
      card.addEventListener('pointerleave', function () {
        card.style.setProperty('--ry', '0deg');
        card.style.setProperty('--rx', '0deg');
      });
    });
  }

  var route = document.querySelector('[data-route]');
  function updateRoute() {
    if (!route || reducedMotion) return;
    var rect = route.getBoundingClientRect();
    var vh = window.innerHeight || document.documentElement.clientHeight;
    var progress = (vh * 0.82 - rect.top) / (rect.height + vh * 0.35);
    progress = Math.max(0.08, Math.min(1, progress));
    route.style.setProperty('--route-progress', progress.toFixed(3));
  }
  if (route && !reducedMotion) {
    updateRoute();
    window.addEventListener('scroll', updateRoute, { passive: true });
    window.addEventListener('resize', updateRoute);
  }

  document.addEventListener('click', function (event) {
    var target = event.target && event.target.closest ? event.target.closest('.ga-track[data-ga-event]') : null;
    if (!target || typeof window.gtag !== 'function') return;
    var area = target.closest('header, nav, section, footer');
    window.gtag('event', target.getAttribute('data-ga-event'), {
      link_location: area ? (area.id || area.tagName.toLowerCase()) : 'page'
    });
  }, true);
})();
