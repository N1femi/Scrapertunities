/* ============================================================
   SCRAPERTUNITIES — app.js
   Search, filter, sort, and UI interactivity (no dependencies)
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {
  // ── Element references ──────────────────────────────────────
  const searchInput = document.getElementById("search-input")
  const searchClear = document.getElementById("search-clear")
  const typeSelect = document.getElementById("filter-type")
  const locSelect = document.getElementById("filter-location")
  const deadlineSelect = document.getElementById("filter-deadline")
  const sortSelect = document.getElementById("sort-by")
  const resetBtn = document.getElementById("filter-reset")
  const emptyResetBtn = document.getElementById("empty-reset")
  const resultsCount = document.getElementById("results-count")
  const activePills = document.getElementById("active-filters")
  const emptyState = document.getElementById("empty-state")
  const listings = document.querySelector(".listings")

  const statTotal = document.getElementById("stat-total")
  const statInternships = document.getElementById("stat-internships")
  const statScholarships = document.getElementById("stat-scholarships")

  const navToggle = document.querySelector(".nav-toggle")
  const navLinks = document.querySelector(".nav-links")

  const paginationContainer = document.getElementById("pagination")
  const paginationPrev = document.getElementById("pagination-prev")
  const paginationNext = document.getElementById("pagination-next")
  const paginationNumbers = document.getElementById("pagination-numbers")
  const paginationInfo = document.getElementById("pagination-info")

  // All cards — updated once listings are loaded
  let cards = []
  const ITEMS_PER_PAGE = 12
  let currentPage = 1

  const URGENT_DAYS = 14

  function markUrgent() {
    const now = new Date()
    now.setHours(0, 0, 0, 0)

    cards.forEach((card) => {
      const deadline = new Date(card.dataset.deadline)
      const msLeft = deadline - now
      const daysLeft = msLeft / (1000 * 60 * 60 * 24)
      const deadlineEl = card.querySelector(".card-deadline")
      if (deadlineEl) {
        deadlineEl.classList.toggle(
          "urgent",
          daysLeft >= 0 && daysLeft <= URGENT_DAYS,
        )
      }
    })
  }

  function createCardElement(listing) {
    const deadline = new Date(listing.deadline)
    const deadlineDisplay = deadline.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
    })

    const card = document.createElement("article")
    card.className = "card"
    card.dataset.type = listing.type
    card.dataset.location = listing.location
    card.dataset.deadline = listing.deadline
    card.dataset.added = listing.added || new Date().toISOString()
    card.dataset.title = `${listing.role} ${listing.company}`.toLowerCase()

    card.innerHTML = `
      <div class="card-header">
        <span class="badge ${listing.type === "scholarship" ? "badge-scholarship" : "badge-internship"}">${listing.type === "scholarship" ? "Scholarship" : "Internship"}</span>
        <span class="card-deadline">Due ${deadlineDisplay}</span>
      </div>
      <div class="card-body">
        <h3 class="card-title">${listing.role}</h3>
        <p class="card-org">${listing.company} · ${listing.location}</p>
        <p class="card-description">Scraped opportunity listing.</p>
      </div>
      <div class="card-footer">
        <a href="${listing.url}" class="btn btn-primary btn-sm" target="_blank" rel="noopener">Apply Now</a>
      </div>
    `

    return card
  }

  async function loadListings() {
    listings.innerHTML = '<p class="loading">Loading opportunities…</p>'

    try {
      const res = await fetch("listings.json", { cache: "no-store" })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()

      if (!Array.isArray(data) || data.length === 0) {
        listings.innerHTML =
          '<p class="loading">No opportunities found. Run <code>python main.py</code> to refresh.</p>'
        cards = []
        applyFilters()
        return
      }

      listings.innerHTML = ""
      cards = data.map(createCardElement)
      cards.forEach((card) => listings.appendChild(card))

      markUrgent()
      applyFilters()
    } catch (err) {
      listings.innerHTML = `<p class="loading">Unable to load opportunities. Make sure <code>listings.json</code> exists and is valid.<br>${err}</p>`
      cards = []
      applyFilters()
    }
  }

  // ── Stats bar ────────────────────────────────────────────────
  function updateStats() {
    const visibleCards = cards.filter((c) => !c.hidden)
    const internships = visibleCards.filter(
      (c) => c.dataset.type === "internship",
    )
    const scholarships = visibleCards.filter(
      (c) => c.dataset.type === "scholarship",
    )

    statTotal.textContent = visibleCards.length
    statInternships.textContent = internships.length
    statScholarships.textContent = scholarships.length
  }

  // ── Results count ────────────────────────────────────────────
  function updateResultsCount() {
    const visible = cards.filter((c) => !c.hidden).length
    resultsCount.textContent = visible
  }

  // ── Pagination ──────────────────────────────────────────────
  function updatePagination() {
    // Get cards that passed the filter (hidden = false)
    const visibleCards = cards.filter((c) => !c.hidden)
    const totalPages = Math.ceil(visibleCards.length / ITEMS_PER_PAGE) || 1

    // Determine which cards should be shown on current page
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    const end = start + ITEMS_PER_PAGE
    const cardsToShowOnPage = new Set(visibleCards.slice(start, end))

    // Apply pagination: hide/show based on whether card is on current page
    cards.forEach((card) => {
      // If already hidden by filter, keep it hidden
      if (card.hidden) return
      // Otherwise, show if on current page, hide if not
      card.style.display = cardsToShowOnPage.has(card) ? "" : "none"
    })

    // Update pagination controls
    paginationContainer.hidden = totalPages <= 1
    paginationPrev.disabled = currentPage === 1
    paginationNext.disabled = currentPage === totalPages

    // Update page numbers (show only 3 at a time)
    paginationNumbers.innerHTML = ""
    const maxButtons = 3
    let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2))
    let endPage = startPage + maxButtons - 1

    // Adjust if we're near the end
    if (endPage > totalPages) {
      endPage = totalPages
      startPage = Math.max(1, endPage - maxButtons + 1)
    }

    for (let i = startPage; i <= endPage; i++) {
      const btn = document.createElement("button")
      btn.className = `pagination-btn ${i === currentPage ? "active" : ""}`
      btn.textContent = i

      // If this is the current page, make it clickable to edit
      if (i === currentPage) {
        btn.addEventListener("click", () => {
          // Replace button with input field
          const input = document.createElement("input")
          input.type = "text"
          input.className = "pagination-input"
          input.value = currentPage
          input.style.width = "40px"
          input.style.height = "40px"
          input.style.textAlign = "center"

          btn.replaceWith(input)
          input.focus()
          input.select()

          const handleSubmit = () => {
            const pageNum = parseInt(input.value, 10)
            // Validate input
            if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
              currentPage = pageNum
              updatePagination()
              window.scrollTo({
                top: listings.offsetTop - 100,
                behavior: "smooth",
              })
            } else {
              // Invalid input, restore button
              input.replaceWith(btn)
            }
          }

          input.addEventListener("keypress", (e) => {
            if (e.key === "Enter") {
              handleSubmit()
            }
          })

          input.addEventListener("blur", () => {
            // Restore button on blur if input still exists
            if (input.parentNode) {
              input.replaceWith(btn)
            }
          })
        })
      } else {
        btn.addEventListener("click", () => {
          currentPage = i
          updatePagination()
          window.scrollTo({ top: listings.offsetTop - 100, behavior: "smooth" })
        })
      }

      paginationNumbers.appendChild(btn)
    }

    // Update info text
    if (visibleCards.length > 0) {
      const displayStart = (currentPage - 1) * ITEMS_PER_PAGE + 1
      const displayEnd = Math.min(
        currentPage * ITEMS_PER_PAGE,
        visibleCards.length,
      )
      paginationInfo.textContent = `${displayStart}–${displayEnd} of ${visibleCards.length}`
    }
  }

  // ── Results count ────────────────────────────────────────────
  function updateResultsCount() {
    const visible = cards.filter((c) => !c.hidden).length
    resultsCount.textContent = visible
  }

  // ── Empty state ──────────────────────────────────────────────
  function updateEmptyState() {
    const visible = cards.filter((c) => !c.hidden).length
    emptyState.hidden = visible > 0
    listings.style.display = visible === 0 ? "none" : ""
  }

  // ── Active filter pills ──────────────────────────────────────
  const FILTER_LABELS = {
    type: {
      id: "filter-type",
      label: (val) =>
        val === "all"
          ? null
          : val === "internship"
            ? "Internship"
            : "Scholarship",
    },
    location: {
      id: "filter-location",
      label: (val) =>
        val === "all"
          ? null
          : { remote: "Remote", onsite: "On-site", hybrid: "Hybrid" }[val] ||
            val,
    },
    deadline: {
      id: "filter-deadline",
      label: (val) => (val === "all" ? null : `Next ${val} days`),
    },
  }

  function updatePills() {
    activePills.innerHTML = ""
    Object.entries(FILTER_LABELS).forEach(([key, { id, label }]) => {
      const el = document.getElementById(id)
      const text = label(el.value)
      if (!text) return

      const pill = document.createElement("button")
      pill.className = "filter-pill"
      pill.setAttribute("aria-label", `Remove ${text} filter`)
      pill.innerHTML = `${text} <span aria-hidden="true">×</span>`
      pill.addEventListener("click", () => {
        el.value = "all"
        applyFilters()
      })
      activePills.appendChild(pill)
    })
  }

  // ── Core filter function ─────────────────────────────────────
  function applyFilters() {
    const q = searchInput.value.trim().toLowerCase()
    const type = typeSelect.value
    const loc = locSelect.value
    const daysRaw = deadlineSelect.value
    const maxDays = daysRaw === "all" ? Infinity : parseInt(daysRaw)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    cards.forEach((card) => {
      const title = (card.dataset.title || "").toLowerCase()
      const deadline = new Date(card.dataset.deadline)
      const daysLeft = (deadline - today) / (1000 * 60 * 60 * 24)

      const matchSearch = !q || title.includes(q)
      const matchType = type === "all" || card.dataset.type === type
      const matchLoc = loc === "all" || card.dataset.location === loc
      const matchDeadline = daysLeft <= maxDays

      card.hidden = !(matchSearch && matchType && matchLoc && matchDeadline)
    })

    // Reset to page 1 when filters change
    currentPage = 1
    applySort()
    updatePagination()
    updateResultsCount()
    updateEmptyState()
    updateStats()
    updatePills()
  }

  // ── Sort function ────────────────────────────────────────────
  function applySort() {
    const sort = sortSelect.value

    const sorted = [...cards].sort((a, b) => {
      switch (sort) {
        case "deadline-asc":
          return new Date(a.dataset.deadline) - new Date(b.dataset.deadline)
        case "deadline-desc":
          return new Date(b.dataset.deadline) - new Date(a.dataset.deadline)
        default:
          return 0
      }
    })

    sorted.forEach((card) => listings.appendChild(card))
    cards = sorted
  }

  // ── Reset ────────────────────────────────────────────────────
  function resetFilters() {
    searchInput.value = ""
    typeSelect.value = "all"
    locSelect.value = "all"
    deadlineSelect.value = "all"
    sortSelect.value = "deadline-asc"
    searchClear.hidden = true
    applyFilters()
  }

  // ── Event listeners ──────────────────────────────────────────
  searchInput.addEventListener("input", () => {
    searchClear.hidden = searchInput.value.length === 0
    applyFilters()
  })

  searchClear.addEventListener("click", () => {
    searchInput.value = ""
    searchClear.hidden = true
    searchInput.focus()
    applyFilters()
  })

  typeSelect.addEventListener("change", applyFilters)
  locSelect.addEventListener("change", applyFilters)
  deadlineSelect.addEventListener("change", applyFilters)
  sortSelect.addEventListener("change", applyFilters)

  resetBtn.addEventListener("click", resetFilters)
  emptyResetBtn.addEventListener("click", resetFilters)

  // ── Pagination event listeners ─────────────────────────────────
  paginationPrev.addEventListener("click", () => {
    if (currentPage > 1) {
      currentPage--
      updatePagination()
      window.scrollTo({ top: listings.offsetTop - 100, behavior: "smooth" })
    }
  })

  paginationNext.addEventListener("click", () => {
    const visibleCards = cards.filter((c) => !c.hidden)
    const totalPages = Math.ceil(visibleCards.length / ITEMS_PER_PAGE)
    if (currentPage < totalPages) {
      currentPage++
      updatePagination()
      window.scrollTo({ top: listings.offsetTop - 100, behavior: "smooth" })
    }
  })

  // ── Mobile nav toggle ─────────────────────────────────────────
  if (navToggle && navLinks) {
    navToggle.addEventListener("click", () => {
      const isOpen = navLinks.classList.toggle("nav-open")
      navToggle.setAttribute("aria-expanded", isOpen)
    })

    // Close nav when a link is clicked
    navLinks.querySelectorAll(".nav-link").forEach((link) => {
      link.addEventListener("click", () => {
        navLinks.classList.remove("nav-open")
        navToggle.setAttribute("aria-expanded", "false")
      })
    })
  }

  // ── Initial render ────────────────────────────────────────────
  loadListings()
})
