export function getUTMParams(): Record<string, string> {
  const params = new URLSearchParams(window.location.search);
  const utmParams: Record<string, string> = {};
  
  // Lista de parâmetros UTM comuns
  const utmKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];
  
  utmKeys.forEach(key => {
    const value = params.get(key);
    if (value) {
      utmParams[key] = value;
    }
  });

  return utmParams;
}

export function addUTMsToLinks() {
  const currentURL = window.location.href;
  
  function updateLinks(links: NodeListOf<Element>) {
    links.forEach((linkElement) => {
      if (linkElement instanceof HTMLAnchorElement) {
        const url = linkElement.getAttribute("href");
        if (url) {
          const params = new URLSearchParams(window.location.search);
          if (params.toString()) {
            if (url.includes("?")) {
              linkElement.href = `${url}&${params.toString()}`;
            } else {
              linkElement.href = `${url}?${params.toString()}`;
            }
          }
        }
      }
    });
  }

  if (currentURL.includes("?")) {
    updateLinks(document.querySelectorAll("a"));
    
    new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === "childList") {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE && node instanceof HTMLElement) {
              updateLinks(node.querySelectorAll("a"));
            }
          });
        }
      });
    }).observe(document.body, { childList: true, subtree: true });
  } else {
    console.log("Nenhum parâmetro encontrado na URL atual.");
  }
} 