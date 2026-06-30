/* =====================================================
   ULTRA UI ENGINE — ADVANCED EDITION
   Modular • Premium • Smooth Navigation System
===================================================== */

(() => {

"use strict";

/* =====================================================
   Utils
===================================================== */

const $  = (s,p=document)=>p.querySelector(s);
const $$ = (s,p=document)=>[...p.querySelectorAll(s)];

const prefersReduced =
window.matchMedia("(prefers-reduced-motion: reduce)").matches;


/* =====================================================
   THEME SYSTEM
===================================================== */

function initTheme(){

    const root = document.documentElement;

    const saved =
    localStorage.getItem("theme");

    if(saved){

        root.setAttribute("data-theme",saved);
    }
}

window.toggleTheme = function(){

    const root = document.documentElement;

    const current =
    root.getAttribute("data-theme") || "dark";

    const next =
    current === "dark"
    ? "light"
    : "dark";

    root.setAttribute("data-theme",next);

    localStorage.setItem("theme",next);
};


/* =====================================================
   ACCORDION
===================================================== */

function setExpanded(content,expanded){

    content.classList.toggle("active",expanded);

    const trigger =
    document.querySelector(
    `[aria-controls="${content.id}"]`
    );

    if(trigger){

        trigger.setAttribute(
        "aria-expanded",
        String(expanded)
        );
    }
}

window.toggleContent = function(id){

    const content =
    document.getElementById(id);

    if(!content) return;

    const willOpen =
    !content.classList.contains("active");

    $$(".content-box.active").forEach(box=>{

        if(
            box!==content &&
            !box.classList.contains("always-open")
        ){

            setExpanded(box,false);
        }

    });

    setExpanded(content,willOpen);
};


/* =====================================================
   IMAGE MODAL
===================================================== */

let lastFocused = null;

window.openImage = function(img){

    const modal    = $("#imageModal");
    const modalImg = $("#modalImg");

    if(!modal || !modalImg) return;

    lastFocused = document.activeElement;

    modalImg.src = img.src;
    modalImg.alt = img.alt || "";

    modal.classList.add("active");

    document.body.style.overflow="hidden";

    modal.focus();
};

window.closeImage = function(){

    const modal = $("#imageModal");

    if(!modal) return;

    modal.classList.remove("active");

    document.body.style.overflow="";

    const modalImg = $("#modalImg");

    if(modalImg){

        setTimeout(()=>{
            modalImg.src="";
        },200);
    }

    if(lastFocused){

        lastFocused.focus();
        lastFocused=null;
    }
};


/* =====================================================
   SCROLL REVEAL
===================================================== */

function initReveal(){

    const elements =
    $$(".menu-item,.grid-item,.step-card");

    if(!elements.length) return;

    const observer =
    new IntersectionObserver(entries=>{

        entries.forEach(entry=>{

            if(!entry.isIntersecting) return;

            entry.target.classList.add("reveal");

            observer.unobserve(entry.target);

        });

    },{
        threshold:.12
    });

    elements.forEach(el=>observer.observe(el));
}


/* =====================================================
   MAGNETIC 3D EFFECT
===================================================== */

function initMagnetic(){

    if(prefersReduced) return;

    const elements =
    $$(".menu-item,.btn-start,.theme-toggle");

    elements.forEach(el=>{

        el.addEventListener("mousemove",e=>{

            const r =
            el.getBoundingClientRect();

            const x =
            (e.clientX-r.left)/r.width-.5;

            const y =
            (e.clientY-r.top)/r.height-.5;

            el.style.transform =
            `
            rotateX(${ -y*8 }deg)
            rotateY(${ x*8 }deg)
            scale(1.03)
            `;
        });

        el.addEventListener("mouseleave",()=>{

            el.style.transform="";
        });

    });
}


/* =====================================================
   CURSOR SPOTLIGHT
===================================================== */

function initSpotlight(){

    if(prefersReduced) return;

    const glow =
    document.createElement("div");

    glow.className = "cursor-spotlight";

    Object.assign(glow.style,{

        position:"fixed",
        width:"320px",
        height:"320px",
        borderRadius:"50%",
        pointerEvents:"none",
        zIndex:"0",

        background:
        "radial-gradient(circle, rgba(251,191,36,.15), transparent 60%)",

        filter:"blur(55px)",
        transform:"translate(-50%,-50%)"

    });

    document.body.appendChild(glow);

    window.addEventListener("mousemove",e=>{

        glow.style.left = e.clientX+"px";
        glow.style.top  = e.clientY+"px";

    },{passive:true});
}


/* =====================================================
   LAZY LOAD IMAGES
===================================================== */

function initLazyImages(){

    const imgs =
    $$("img[data-src]");

    if(!imgs.length) return;

    const observer =
    new IntersectionObserver(entries=>{

        entries.forEach(entry=>{

            if(!entry.isIntersecting) return;

            const img = entry.target;

            img.src = img.dataset.src;

            img.removeAttribute("data-src");

            observer.unobserve(img);

        });

    },{
        rootMargin:"250px"
    });

    imgs.forEach(img=>observer.observe(img));
}


/* =====================================================
   GPU BOOST
===================================================== */

function enableGPU(){

    const els =
    $$(".menu-item,.grid-item,.step-card,.btn-start");

    els.forEach(el=>{

        el.style.willChange="transform";
        el.style.transform="translateZ(0)";

    });
}


/* =====================================================
   PAGE REVEAL
===================================================== */

function initPageReveal(){

    document.body.classList.add("page-enter");

    window.addEventListener("load",()=>{

        requestAnimationFrame(()=>{

            document.body.classList.remove("page-enter");

        });

    });
}


/* =====================================================
   PAGE TRANSITIONS
===================================================== */

function initPageTransitions(){

    if(prefersReduced) return;

    document.addEventListener("click",e=>{

        const link =
        e.target.closest("a");

        if(!link) return;

        const href = link.getAttribute("href");

        if(
            !href ||
            href.startsWith("#") ||
            href.startsWith("javascript:") ||
            link.target === "_blank"
        ) return;

        e.preventDefault();

        document.body.classList.add("page-leave");

        setTimeout(()=>{

            window.location.href = href;

        },350);

    });
}


/* =====================================================
   SMOOTH ROUTER
===================================================== */

function initSmoothRouter(){

    window.addEventListener("popstate",()=>{

        document.body.animate([
            {
                opacity:.7,
                transform:"translateY(8px)"
            },
            {
                opacity:1,
                transform:"translateY(0)"
            }
        ],{
            duration:400,
            easing:"ease"
        });

    });

}


/* =====================================================
   VIEW ANIMATIONS
===================================================== */

function initViewAnimations(){

    if(prefersReduced) return;

    const sections =
    $$("section,.menu-item,.step-card");

    const observer =
    new IntersectionObserver(entries=>{

        entries.forEach(entry=>{

            if(entry.isIntersecting){

                entry.target.animate([
                    {
                        opacity:0,
                        transform:
                        "translateY(30px) scale(.98)"
                    },
                    {
                        opacity:1,
                        transform:
                        "translateY(0) scale(1)"
                    }
                ],{
                    duration:700,
                    easing:
                    "cubic-bezier(.22,.61,.36,1)",
                    fill:"forwards"
                });

                observer.unobserve(entry.target);
            }

        });

    },{
        threshold:.08
    });

    sections.forEach(el=>observer.observe(el));
}


/* =====================================================
   ANALYTICS HOOKS
===================================================== */

function initAnalyticsHooks(){

    /* page view */

    console.log(
    "[Analytics] Page View:",
    location.pathname
    );

    /* clicks */

    document.addEventListener("click",e=>{

        const target =
        e.target.closest(
        "a,button,.menu-item,.btn-start"
        );

        if(!target) return;

        console.log(
        "[Analytics] Click:",
        {
            text:
            target.innerText?.trim(),
            class:
            target.className
        }
        );

    });

}


/* =====================================================
   MODAL EVENTS
===================================================== */

function initModalEvents(){

    const modal = $("#imageModal");

    if(!modal) return;

    modal.setAttribute("tabindex","-1");

    modal.addEventListener("click",e=>{

        if(e.target===modal){

            closeImage();
        }

    });

}


/* =====================================================
   ESC KEY
===================================================== */

document.addEventListener("keydown",e=>{

    if(e.key==="Escape"){

        closeImage();
    }

});


/* =====================================================
   INIT ENGINE
===================================================== */

document.addEventListener("DOMContentLoaded",()=>{

    initTheme();

    initReveal();

    initMagnetic();

    initSpotlight();

    initLazyImages();

    enableGPU();

    initPageReveal();

    initPageTransitions();

    initSmoothRouter();

    initViewAnimations();

    initAnalyticsHooks();

    initModalEvents();

});


})();
