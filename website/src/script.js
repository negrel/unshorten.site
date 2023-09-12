const isLocalServer = window.location.hostname === 'localhost'
const apiEndpoint = "/api/v1"

const html = {
  sizeIndicator: `<div class="flex items-center justify-center fixed top-0 right-0 mt-12 mr-8 z-50 w-8 h-8 rounded-full text-gray-700 text-sm uppercase bg-gray-200 sm:bg-orange-200 md:bg-green-200 lg:bg-purple-200 xl:bg-red-200">
        <span class="block sm:hidden">all</span>
        <span class="hidden sm:block md:hidden">sm</span>
        <span class="hidden md:block lg:hidden">md</span>
        <span class="hidden lg:block xl:hidden">lg</span>
        <span class="hidden xl:block">xl</span>
    </div>`,
  clipboardIcon: `<svg xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 0 384 512"><!--! Font Awesome Free 6.4.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc. --><style>svg{fill:#ffffff}</style><path d="M280 64h40c35.3 0 64 28.7 64 64V448c0 35.3-28.7 64-64 64H64c-35.3 0-64-28.7-64-64V128C0 92.7 28.7 64 64 64h40 9.6C121 27.5 153.3 0 192 0s71 27.5 78.4 64H280zM64 112c-8.8 0-16 7.2-16 16V448c0 8.8 7.2 16 16 16H320c8.8 0 16-7.2 16-16V128c0-8.8-7.2-16-16-16H304v24c0 13.3-10.7 24-24 24H192 104c-13.3 0-24-10.7-24-24V112H64zm128-8a24 24 0 1 0 0-48 24 24 0 1 0 0 48z"/></svg>`,
  checkIcon: `<svg xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 0 384 512"><!--! Font Awesome Free 6.4.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc. --><style>svg{fill:#ffffff}</style><path d="M438.6 105.4c12.5 12.5 12.5 32.8 0 45.3l-256 256c-12.5 12.5-32.8 12.5-45.3 0l-128-128c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L160 338.7 393.4 105.4c12.5-12.5 32.8-12.5 45.3 0z"/></svg>`,
  loadingSpinner: `<div class="lds-ring"><div></div><div></div><div></div><div></div></div>`
}

function copyResult(event, url) {
  if (document.queryCommandSupported('copy')) {
    const input = document.createElement("input")
    input.value = url
    document.body.appendChild(input)
    input.select()
    document.execCommand('copy')
    document.body.removeChild(input)

    event.srcElement.innerHTML = html.checkIcon

    setTimeout(() => {
      event.srcElement.innerHTML = html.clipboardIcon
    }, 3000)

    return
  }

  alert('copy not supported')
}

document.addEventListener('DOMContentLoaded', () => {
  if (isLocalServer) {
    // Add size indicator in dev mode.
    document.body.innerHTML += html.sizeIndicator
  }

  const elements = {
    results: document.querySelector('#results'),
    resultsSection: document.querySelector('#results-section'),
    urlsInput: document.querySelector('#urls-input'),
    unshortenBtn: document.querySelector('#unshorten-btn'),
    clearBtn: document.querySelector('#clear-btn')
  }

  const buildResultHTML = (result) => {
    if (result.error) {
      console.error(result.error)
      return ``
    }

    return `
      <div class="bg-white border-2 mb-2 rounded-md flex justify-stretch items-center overflow-hidden">
        <a class="flex-1 pl-2 underline" href="${result.url}">${result.url}</a>
        <button class="bg-black border-l-2 p-2" onclick="copyResult(event, ${"'" + result.url + "'" })">
          ${html.clipboardIcon}
        </button>
      </div>
    `
  }

  const displayResults = ({ results }) => {
    elements.resultsSection.classList.remove('hidden')
    elements.results.innerHTML = results.map(buildResultHTML).join('\n')
  }

  elements.unshortenBtn.addEventListener('click', async () => {
    const urls = elements.urlsInput.value.split('\n').map(s => s.trim()).filter(s => s.length > 0)

    // Replace text with a spinner.
    elements.unshortenBtn.innerHTML = html.loadingSpinner

    try {
      const response = await fetch(`${apiEndpoint}/unshorten`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ urls })
      })

      if (!response.ok) {
        throw new Error("response is not ok")
      }

      const results = await response.json()
      displayResults(results)

    } catch (err) {
      console.error("failed to fetch result", err)
      elements.results.innerHTML = `<p class="text-red-500 font-bold">Failed to unshorten URLs</p>`
      elements.resultsSection.classList.remove('hidden')
    } finally {
      elements.unshortenBtn.innerHTML = "Unshorten URLs"
    }
  })

  elements.clearBtn.addEventListener('click', () => {
    setTimeout(() => {
      elements.resultsSection.classList.add('hidden')
    }, 300)
  })
})
