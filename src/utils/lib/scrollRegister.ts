/**
 * container must be scrollable.
 * if not, nothing happens
 */
const scrollRegister = (container?: HTMLElement | null) => {
  const doc = container || document;
  const aTags = doc.getElementsByTagName("a");
  for (const a of aTags) {
    if (a.href.startsWith("javascript:#")) {
      const id = a.href.slice("javascript:#".length, a.href.length - 1);
      a.addEventListener("click", (evt) => {
        evt.preventDefault();
        const target = container || window;
        const targetY =
          container?.getBoundingClientRect().top || window.scrollY * -1;

        target.scrollTo({
          left: 0,
          top:
            (document.getElementById(id)?.getBoundingClientRect().top ||
              targetY + 5) -
            targetY -
            5,
          behavior: "smooth",
        });
      });
    }
  }
};

export default scrollRegister;
