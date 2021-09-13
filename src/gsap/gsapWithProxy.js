import gsap from 'gsap';
import { ScrollTrigger } from "gsap/ScrollTrigger";
import LocomotiveScroll from 'locomotive-scroll';


gsap.registerPlugin(ScrollTrigger);

// handle smooth scroll and update planes positions
const smoothScroll = new LocomotiveScroll({
    el: document.getElementById('page-content'),
    smooth: true,
    inertia: 0.5,
    passive: true,
});
smoothScroll.on("scroll", () => ScrollTrigger.update);

// tell ScrollTrigger to use these proxy methods for the ".smooth-scroll" element since Locomotive Scroll is hijacking things
ScrollTrigger.scrollerProxy(document.body, {
  scrollTop(value) {
    return arguments.length ? smoothScroll.scrollTo(value, 0, 0) : smoothScroll.scroll.instance.scroll.y;
  }, // we don't have to define a scrollLeft because we're only scrolling vertically.
  getBoundingClientRect() {
    return {top: 0, left: 0, width: window.innerWidth, height: window.innerHeight};
  },
  // LocomotiveScroll handles things completely differently on mobile devices - it doesn't even transform the container at all! So to get the correct behavior and avoid jitters, we should pin things with position: fixed on mobile. We sense it by checking to see if there's a transform applied to the container (the LocomotiveScroll-controlled element).
  pinType: document.querySelector(".smooth-scroll").style.transform ? "transform" : "fixed"
});

  ScrollTrigger.addEventListener("refresh", () => smoothScroll.update());

  // after everything is set up, refresh() ScrollTrigger and update LocomotiveScroll because padding may have been added for pinning, etc.
  ScrollTrigger.refresh();

export { smoothScroll, gsap, ScrollTrigger};