document.documentElement.classList.add("js");

(() => {
  const body = document.body;
  const header = document.querySelector(".site-header");
  const menuToggle = document.querySelector(".menu-toggle");
  const mobileMenu = document.getElementById("mobile-menu");
  const mobileLinks = mobileMenu ? mobileMenu.querySelectorAll("a") : [];
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const journey = document.querySelector(".journey-line");
  const journeySteps = journey ? [...journey.querySelectorAll(".journey-step")] : [];
  const chatWidget = document.querySelector("[data-chat-widget]");
  const chatLauncher = chatWidget?.querySelector(".chat-widget-launcher");
  const chatPanel = chatWidget?.querySelector(".chat-widget-panel");
  const chatClose = chatWidget?.querySelector(".chat-widget-close");
  const chatMessages = chatWidget?.querySelector("[data-chat-messages]");
  const chatStatus = chatWidget?.querySelector("[data-chat-status]");
  let chatTypingTimeout = null;
  let chatMessageTimeout = null;

  const setScrolled = () => {
    header?.classList.toggle("is-scrolled", window.scrollY > 24);
  };

  const closeMenu = () => {
    body.classList.remove("menu-open");
    menuToggle?.setAttribute("aria-expanded", "false");
    mobileMenu?.setAttribute("aria-hidden", "true");
  };

  const openMenu = () => {
    body.classList.add("menu-open");
    menuToggle?.setAttribute("aria-expanded", "true");
    mobileMenu?.setAttribute("aria-hidden", "false");
  };

  menuToggle?.addEventListener("click", () => {
    body.classList.contains("menu-open") ? closeMenu() : openMenu();
  });

  mobileLinks.forEach((link) => link.addEventListener("click", closeMenu));
  window.addEventListener("resize", () => {
    if (window.innerWidth > 1080) closeMenu();
  });
  window.addEventListener("scroll", setScrolled, { passive: true });
  setScrolled();

  const revealTargets = [
    ...document.querySelectorAll(".reveal"),
    ...document.querySelectorAll(".reveal-group > *")
  ];

  const showReveal = (element, delay = 0) => {
    if (delay) element.style.transitionDelay = `${delay}s`;
    element.classList.add("is-visible");
  };

  const updateJourneyProgress = () => {
    if (!journey) return;
    const rect = journey.getBoundingClientRect();
    const vh = window.innerHeight || 1;
    const progress = Math.min(1, Math.max(0, (vh - rect.top) / (rect.height + vh * 0.35)));
    journey.style.setProperty("--journey-progress", `${progress * 100}%`);
    const activeCount = Math.round(progress * journeySteps.length);
    journeySteps.forEach((step, index) => {
      step.classList.toggle("is-active", index < activeCount);
    });
  };

  const runGsap = () => {
    if (!window.gsap || !window.ScrollTrigger || reduceMotion) return false;
    window.gsap.registerPlugin(window.ScrollTrigger);
    window.gsap.set(revealTargets, { y: 40, autoAlpha: 0 });
    document.querySelectorAll(".reveal-group").forEach((group) => {
      window.gsap.to(group.children, {
        y: 0,
        autoAlpha: 1,
        duration: 0.8,
        ease: "expo.out",
        stagger: 0.08,
        scrollTrigger: { trigger: group, start: "top 84%" }
      });
    });
    document.querySelectorAll(".reveal").forEach((item) => {
      window.gsap.to(item, {
        y: 0,
        autoAlpha: 1,
        duration: 0.8,
        ease: "expo.out",
        scrollTrigger: { trigger: item, start: "top 86%" }
      });
    });
    if (journey) {
      window.gsap.to(journey, {
        "--journey-progress": "100%",
        ease: "none",
        scrollTrigger: {
          trigger: journey,
          start: "top 82%",
          end: "bottom 45%",
          scrub: true,
          onUpdate: updateJourneyProgress
        }
      });
    }
    return true;
  };

  const runFallbackReveal = () => {
    if (reduceMotion) {
      revealTargets.forEach((node) => showReveal(node));
      journeySteps.forEach((step) => step.classList.add("is-active"));
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const siblings = entry.target.parentElement?.matches(".reveal-group") ? [...entry.target.parentElement.children] : null;
        if (siblings) {
          siblings.forEach((node, index) => showReveal(node, index * 0.08));
          siblings.forEach((node) => observer.unobserve(node));
          return;
        }
        showReveal(entry.target);
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.2, rootMargin: "0px 0px -10% 0px" });
    revealTargets.forEach((node) => observer.observe(node));
  };

  const initSmoothScroll = () => {
    if (!window.Lenis || reduceMotion) return;
    const lenis = new window.Lenis({ lerp: 0.1, smoothWheel: true });
    const raf = (time) => {
      lenis.raf(time);
      requestAnimationFrame(raf);
    };
    requestAnimationFrame(raf);
  };

  const initMarquee = () => {
    const marquee = document.querySelector("[data-marquee]");
    const track = marquee?.querySelector("[data-track]");
    if (!marquee || !track) return;
    track.innerHTML += track.innerHTML;
    let x = 0;
    let paused = false;
    let lastTouchX = null;
    const speed = 0.45;

    const setPaused = (value) => { paused = value; };
    marquee.addEventListener("mouseenter", () => setPaused(true));
    marquee.addEventListener("mouseleave", () => setPaused(false));
    marquee.addEventListener("touchstart", (event) => {
      setPaused(true);
      lastTouchX = event.touches[0]?.clientX ?? null;
    }, { passive: true });
    marquee.addEventListener("touchmove", (event) => {
      const currentX = event.touches[0]?.clientX;
      if (currentX == null || lastTouchX == null) return;
      x += (currentX - lastTouchX) * 0.8;
      lastTouchX = currentX;
      track.style.transform = `translateX(${x}px)`;
    }, { passive: true });
    marquee.addEventListener("touchend", () => {
      lastTouchX = null;
      setPaused(false);
    });

    const tick = () => {
      const loopWidth = track.scrollWidth / 2;
      if (!paused) {
        x -= speed;
        if (Math.abs(x) >= loopWidth) x = 0;
        track.style.transform = `translateX(${x}px)`;
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  const clearChatTimers = () => {
    if (chatTypingTimeout) {
      window.clearTimeout(chatTypingTimeout);
      chatTypingTimeout = null;
    }
    if (chatMessageTimeout) {
      window.clearTimeout(chatMessageTimeout);
      chatMessageTimeout = null;
    }
  };

  const resetChat = () => {
    clearChatTimers();
    if (chatMessages) chatMessages.innerHTML = "";
    if (chatStatus) chatStatus.textContent = "";
  };

  const addTypingBubble = () => {
    if (!chatMessages) return null;
    const typing = document.createElement("div");
    typing.className = "chat-widget-typing";
    typing.setAttribute("aria-hidden", "true");
    typing.innerHTML = "<span></span><span></span><span></span>";
    chatMessages.appendChild(typing);
    return typing;
  };

  const addClinicMessage = () => {
    if (!chatMessages) return;
    const message = document.createElement("article");
    message.className = "chat-widget-message is-clinic";
    message.innerHTML = "<p>Oi! Seja muito bem-vindo(a) a Sorria Mais. Deseja falar com qual clinica?</p>";
    chatMessages.appendChild(message);

    const actions = document.createElement("div");
    actions.className = "chat-widget-actions";
    actions.innerHTML = `
      <a class="button button-primary chat-widget-action" href="https://wa.me/553433520661" target="_blank" rel="noreferrer">Uberaba</a>
      <a class="button button-secondary chat-widget-action" href="https://api.whatsapp.com/send/?phone=553433362313&amp;text=Oie%2C+vim+do+instagram+e+gostaria+de+agendar+uma+avalia%C3%A7%C3%A3o%21+&amp;type=phone_number&amp;app_absent=0&amp;utm_source=ig" target="_blank" rel="noreferrer">Uberlandia</a>
    `;
    chatMessages.appendChild(actions);
    if (chatStatus) chatStatus.textContent = "Recepcao online";
  };

  const startChatFlow = () => {
    resetChat();
    if (chatStatus) chatStatus.textContent = "Recepcao digitando...";
    const typing = addTypingBubble();
    const typingDelay = reduceMotion ? 150 : 650;
    const messageDelay = reduceMotion ? 220 : 950;

    chatTypingTimeout = window.setTimeout(() => {
      typing?.remove();
    }, typingDelay);

    chatMessageTimeout = window.setTimeout(() => {
      typing?.remove();
      addClinicMessage();
    }, messageDelay);
  };

  const closeChat = () => {
    chatWidget?.classList.remove("is-open");
    chatLauncher?.setAttribute("aria-expanded", "false");
    chatPanel?.setAttribute("aria-hidden", "true");
    clearChatTimers();
  };

  const openChat = () => {
    chatWidget?.classList.add("is-open");
    chatLauncher?.setAttribute("aria-expanded", "true");
    chatPanel?.setAttribute("aria-hidden", "false");
    startChatFlow();
  };

  chatLauncher?.addEventListener("click", () => {
    if (chatWidget?.classList.contains("is-open")) {
      closeChat();
      return;
    }
    openChat();
  });

  chatClose?.addEventListener("click", closeChat);

  window.addEventListener("scroll", updateJourneyProgress, { passive: true });
  window.addEventListener("resize", updateJourneyProgress);
  updateJourneyProgress();

  initSmoothScroll();
  if (!runGsap()) runFallbackReveal();
  initMarquee();
})();
