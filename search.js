// dom loaded event
document.addEventListener('DOMContentLoaded', (event) => {
    document.getElementById("searchInput").focus();
    window.current_page = "";
    window.previous_page = "";
});

//form submit event
let searchForm = document.getElementById("searchForm");
searchForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearSuggestions();
    let formData = new FormData(searchForm);
    let URLSearchParamsCreated = new URLSearchParams(formData);
    doSearch(URLSearchParamsCreated.toString());
});

//suggestion click event
function loadSuggestionEvents() {
    let suggestionResults = document.querySelectorAll(".search_suggestion_link");
    suggestionResults.forEach((suggestion) => {
        suggestion.addEventListener("click", async (event) => {
            event.preventDefault();
            clearSuggestions();
            doSearch(buildSearchParamsFromString(event.target.dataset.result));
        });
    });
    loadKeySuggestionKeyDownEvent();
}

/**
 * loadKeySuggestionKeyDownEvent
 */
function loadKeySuggestionKeyDownEvent() {
    let searchInput = document.getElementById("searchInput");
    searchInput.addEventListener('keydown', function (event) {
        if (event.key === "ArrowDown") {
            event.preventDefault();
            let top_suggestion = document.querySelector("#suggestions_response li:nth-child(1) a");
            top_suggestion.focus();
        }
    });
}

/**
 * handle the back button
 */
document.getElementById("back_button").addEventListener("click", (event) => {
    doSearch(window.previous_page);
});

/**
 * loadlLinkHandlers
 */
function loadlLinkHandlers() {
    let results = document.getElementById("results_wrapper");
    results.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", async (event) => {
            event.preventDefault();
            let href = (typeof event.target.href !== "undefined") ? event.target.href : event.target.closest("a").href;
            if (href.indexOf("File:") > -1) {
                openInNewTab(href);
            } else if (href.split("/").splice(href.split("/").length - 1)[0].indexOf("#") > -1) {
                let hash = href.split("/").splice(href.split("/").length - 1)[0].split('#')[1];
                window.location.hash = hash;
            } else if (href.indexOf("https://ashesofcreation") === -1) {
                openInNewTab(href);
            } else {
                let searchParams = buildSearchParamsFromString(href.split("/").splice(3).join("/"));
                doSearch(searchParams.toString());
            }
        })
    });
}

/**
 * openInNewTab
 * @param {*} href 
 */
function openInNewTab(href) {
    Object.assign(document.createElement('a'), {
        target: '_blank',
        href: href,
    }).click();
}

// dom loaded event
document.addEventListener('DOMContentLoaded', (event) => {
    document.getElementById("searchInput").focus();
});

/**
 * buildSearchParamsFromString
 * @param {buildSearchParamsFromString} search_string
 * @returns {URLSearchParams}
 */
function buildSearchParamsFromString(search_string) {
    let formData = new FormData();
    formData.set("search", search_string);
    formData.set("go", "Go");
    let urlSearchParams = new URLSearchParams(formData);
    return urlSearchParams.toString();
}

/**
 * searchSuggestions
 */
let searchInput = document.getElementById("searchInput");
searchForm.addEventListener("input", async (event) => {
    if (event.target.value.length > 2) {
        loadSuggestions(event.target.value);
    } else {
        clearSuggestions();
    }
});

/**
 * doSearch
 * @param {string} searchString
 */
function doSearch(searchString) {
    window.scrollTo(0, 0);
    showLoading(true);
    let search_result = fetch(`https://ashesofcreation.wiki/index.php?${searchString}`);
    hideDuringLoad();
    search_result.then(response => response.text())
        .then((body) => {
            let node = new DOMParser().parseFromString(body, "text/html").body;
            let content = node.querySelector("#mw-content-text");
            document.getElementById("searchInput").focus();
            showLoading(false);
            hideIntro();
            if (typeof content !== "undefined") {
                let content_determined = determineContentType(content);
                loadLinks(content_determined);
                loadHeaderImage(content_determined);
                loadImages(content_determined);
                let intro = loadIntro(content_determined);
                loadContent(content_determined, intro);
                loadTOC(content_determined);
                loadlLinkHandlers();
                window.previous_page = window.current_page;
                showBackButton(window.previous_page);
                window.current_page = searchString;
            }
        }).catch((error) => {
            console.log(error);
        });
}

/**
 * 
 */
function hideDuringLoad() {
    document.getElementById("searchInput").value = "";
    document.querySelector("#results").style.display = "none";
    document.querySelector("#nav button").style.display = "none";
    document.querySelector("#content_from_url").style.display = "none";
}

/**
 * showBackButton
 * @param {string} search 
 */
document.getElementById("back_button").addEventListener("click", (event) => {
    doSearch(window.previous_search.toString());
});
function showBackButton(search) {
    if(window.previous_page !== ""){
        document.getElementById("back_button").style.display = "block";
    }
}

/**
 * showLoading
 * @param {boolean} show 
 */
function showLoading(show) {
    if (show) {
        document.getElementById("loading").style.display = "block";
    } else {
        document.getElementById("loading").style.display = "none";
    }
}

/**
 * clearSuggestions
 */
function clearSuggestions() {
    let suggestion_container = document.querySelector("#suggestions_response");
    suggestion_container.innerHTML = "";
}

/**
 * loadSuggestions
 * @param {string} input
 */
function loadSuggestions(input) {
    let search_result = fetch(`https://ashesofcreation.wiki/api.php?action=opensearch&format=json&formatversion=2&search=${input}&namespace=0&limit=10&suggest=true`);
    search_result.then(response => response.text())
        .then((suggestions_response) => {
            buildSuggestionsContainer(JSON.parse(suggestions_response));
        });
}

/**
 * buildSuggestionsContainer
 * @param {array} suggestions_response
 */
function buildSuggestionsContainer(suggestions_response) {
    clearSuggestions();
    let suggestion_container = document.querySelector("#suggestions_response");
    if (suggestions_response[1].length > 0) {
        suggestions_response[1].forEach((suggestion, index) => {
            suggestion_container.innerHTML += `<li><a tabindex="${index}" class="search_suggestion_link" href="${suggestions_response[3][index]}" data-result="${suggestion}">${suggestion}</a></li>`;
        });
    } else {
        suggestion_container.innerHTML = "Sorry, no suggestions. Press enter to try a search."
    }
    loadSuggestionEvents();
    suggestion_container.style.display = "block";
}

/**
 * determineContentType
 * @param {DOM} node
 */
function determineContentType(node) {
    let search_results = node.querySelector(".searchresults");
    let page_content = node.querySelector(".mw-parser-output");
    if (search_results !== null) {
        return search_results;
    } else if (page_content !== null) {
        setGoTo(node);
        return page_content;
    }
}

/**
 * setGoTo
 * @param {DOM} node
 */
function setGoTo(node) {
    let selfLink = node.querySelector('.selflink');
    if (selfLink !== null) {
        let url = "https://ashesofcreation.wiki/" + selfLink.innerText;
        let go_to_url_text = document.querySelector("#content_from_url div");
        if (go_to_url_text !== null) {
            go_to_url_text.innerHTML = `<a href="${url}" target="_blank">${url}</a>`;
            document.querySelector("#content_from_url").style.display = "block";
        }
    }
}

/**
 * loadLinks
 * @param {DOM} node 
 */
function loadLinks(node) {
    node.querySelectorAll("a").forEach(item => {
        if (item.classList.contains("selflink")) {
            item.href = "https://ashesofcreation.wiki/" + item.innerText;
            item.target = "_blank";
        } else if (item.href.split("/")[0] == "chrome-extension:") {
            if (item.href.split("/").splice(item.href.split("/").length - 1)[0].indexOf("#") === -1) {
                item.href = "https://ashesofcreation.wiki/" + item.href.split("/").splice(3).join('/');
                item.target = "_blank";
            }
        }
    });
}

function loadHeaderImage(node) {
    //header image
    let image = node.querySelector(".thumb.tright a img");
    if (image !== null) {
        let image_src = "https://ashesofcreation.wiki/" + image.src.split('/').splice(3).join('/');
        let results_header = document.getElementById("results_header");
        results_header.innerHTML = `<img src="${image_src}" width="450"/>`;
    }
}

/**
 * LoadHeader
 * @param {DOM} node 
 */
function loadImages(content) {
    //other images
    content.querySelectorAll("img").forEach((image) => {
        let image_split = image.src.split("/");
        if (image_split[0] == "chrome-extension:") {
            image.src = "https://ashesofcreation.wiki/" + image_split.splice(3).join('/');
        }
    });
}

/**
 * LoadIntro
 * @param {DOM} node 
 */
function loadIntro(node) {
    let intro = node.querySelector(".thumb.tright+p");
    if (intro !== null) {
        let results_intro = document.getElementById("results_intro");
        results_intro.style.display = "block";
        results_intro.innerHTML = intro.innerHTML;
        return intro.innerHTML;
    }
    return false;
}

/**
 * hideIntro
 */
function hideIntro() {
    let results_intro = document.getElementById("results_intro");
    results_intro.style.display = "none";
}

/**
 * loadContent
 * @param {DOM} node
 */
function loadContent(content, intro) {
    let show_button = document.getElementById(`results_button`);
    document.getElementById("results").style.display = "block";
    show_button.style.display = "inline-block";
    let content_html = '';
    let side_html = '';
    let valid_element_array = ["DIV", "UL", "P", "BLOCKQUOTE", "H2", "H3"];
    for (let element of content.children) {
        if (valid_element_array.includes(element.tagName)) {
            if (element.classList.contains("thumb") || element.classList.contains("gallery")) {
                side_html += element.outerHTML;
            } else if (element.innerHTML != intro) {
                content_html += element.outerHTML;
            }
        }
    }
    let results_content = document.getElementById("results_content");
    results_content.innerHTML = content_html;
    loadAsideContent(side_html);
    registerClickEventHandlers();
}

/**
 * loadAsideContent
 * @param {DOM} node
 */
function loadAsideContent(side_content) {
    if (side_content.length > 0) {
        let show_button = document.getElementById(`aside_button`);
        show_button.style.display = "inline-block";
        let results_content = document.getElementById("aside");
        results_content.innerHTML = side_content;
    }
}

/**
 * loadTOC
 * @param {DOM} node
 */
function loadTOC(node) {
    if (node.querySelector("#toc")) {
        let show_button = document.getElementById(`toc_button`);
        show_button.style.display = "inline-block";
    }
}

/**
 * showTab
 * @param {*} tab 
 */
function showTab(tab) {
    document.getElementById("results").style.display = "none";
    document.getElementById("aside").style.display = "none";
    document.getElementById(tab).style.display = "block";
}

/**
 * registerClickEventHandlers
 */
function registerClickEventHandlers() {
    document.getElementById("results_button").addEventListener("click", (event) => {
        showTab("results");
        window.scrollTo(0, 0);
    });
    document.getElementById("aside_button").addEventListener("click", (event) => {
        showTab("aside");
        window.scrollTo(0, 0);
    });
    document.getElementById("toc_button").addEventListener("click", (event) => {
        showTab("results");
        window.location.hash = "toc";
        window.scrollBy(0, -50);
    });
}

/**
 * 
 * @param {Function} func 
 * @param {integer} wait 
 * @param {boolean} immediate 
 * @returns 
 */
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

