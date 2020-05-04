/**
 * Constants
 */

const WEB_PROTOCOLS = ['http:', 'https:'];
const MAX_TABS_PER_WEBSITE = 4; // Should be 4, according to this tweet: https://twitter.com/margarinemargie/status/1257336701703389196/
const LIST_SEPARATOR = `\n- `;

/**
 * Helper functions
 */

// Give a URL string, get a URL object
function getParsedUrl(urlString) {
  try {
    return new URL(urlString);
  } catch {
    return null;
  }
}

// Give an array of URL strings, get an array of URL objects
function getParsedUrls(urlStrings) {
  return urlStrings.map(urlString => getParsedUrl(urlString));
}

// Give a URL object, get its hostname (or empty string if one does not exist)
function getHostName(parsedUrl) {
  return parsedUrl && parsedUrl.hostname ? parsedUrl.hostname : '';
}

// Give an array of URL objects, get an array of their hostnames (or empty string if one does not exist)
function getHostNames(parsedUrls) {
  return parsedUrls.map(parsedUrl => getHostName(parsedUrl));
}

// Give a URL object, get whether it's likely on the web (protocol listed in WEB_PROTOCOLS)
function isWebsite(parsedUrl) {
  return parsedUrl && parsedUrl.protocol && WEB_PROTOCOLS.includes(parsedUrl.protocol);
}

// Give the results of a tabs query, get object with hostname as key and number of tabs with matching hostname as value
function getTabsPerWebsite(tabsQueryResults) {
  const numberOfTabsPerWebsite = {};

  const urlStrings = tabsQueryResults.map(result => result.url);

  const parsedUrls = getParsedUrls(urlStrings);

  const parsedUrlsOnWeb = parsedUrls.filter(parsedUrl => isWebsite(parsedUrl));

  const hostNamesOnWeb = getHostNames(parsedUrlsOnWeb).filter(hostName => hostName.length);

  for (const hostName of hostNamesOnWeb) {
    if (!numberOfTabsPerWebsite.hasOwnProperty(hostName)) {
      numberOfTabsPerWebsite[hostName] = 0;
    }

    numberOfTabsPerWebsite[hostName]++;
  }

  return numberOfTabsPerWebsite;
}

/**
 * Main function
*/

let lastNumberOfTabsPerWebsite = {};

function run() {
  // Get all tabs
  chrome.tabs.query({}, results => {
    // Get count of how many tabs for each website (hostname)
    const numberOfTabsPerWebsite = getTabsPerWebsite(results);

    // Get names of websites to alert (newly meets or exceeds MAX_TABS_PER_WEBSITE compared to lastNumberOfTabsPerWebsite)
    const websitesToAlert = Object.entries(numberOfTabsPerWebsite)
      .filter(([hostname, count]) => {
        return count == MAX_TABS_PER_WEBSITE && (!lastNumberOfTabsPerWebsite.hasOwnProperty(hostname) || lastNumberOfTabsPerWebsite[hostname] < MAX_TABS_PER_WEBSITE);
      })
      .map(([hostname, count]) => hostname);

    // Alert if any match MAX_TABS_PER_WEBSITE
    if (websitesToAlert.length) {
      alert(
        `You have ${ MAX_TABS_PER_WEBSITE } tabs open for:${ LIST_SEPARATOR }${ websitesToAlert.join(LIST_SEPARATOR) }`
      );
    }

    // Update lastNumberOfTabsPerWebsite
    lastNumberOfTabsPerWebsite = numberOfTabsPerWebsite;
  });
}

/**
 * Event listeners
 */

// Run main script when a tab is created
chrome.tabs.onCreated.addListener((tab) => {
  run();
});

// Run main script when a tab is removed
chrome.tabs.onRemoved.addListener((tab) => {
  run();
});

// Run main script when a tab is updated (e.g. navigating to a new page)
chrome.tabs.onUpdated.addListener((tab) => {
  run();
});
