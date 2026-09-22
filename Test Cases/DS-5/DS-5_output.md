# Test Plan: DS-5 — Program list filtering and display

## Positive flows

### TC-001
**Title:** Programs page lists each program's name and description

**Preconditions:**
- User is logged in as admin
- At least two programs exist, e.g.:
  - **Web Development 2026** — `Full-stack web development program`
  - **Data Science 2026** — `Python, statistics, and ML foundations`

**Steps:**
1. Navigate to the Programs page
2. Review each row/card in the list

**Gherkin:**
```gherkin
Given programs exist in the system
When I navigate to the Programs page
Then I see a list showing each program's name and description
```

**Expected result:** Every program shows visible **name** and **description** text (or empty description indicator if blank).

**Priority:** High

---

### TC-002
**Title:** Empty state appears when no programs exist

**Preconditions:**
- User is logged in as admin
- No programs exist in the system (fresh tenant or all deleted)

**Steps:**
1. Navigate to the Programs page

**Gherkin:**
```gherkin
Given no programs exist
When I navigate to the Programs page
Then I see a message indicating no programs have been created
And I see a prompt to create the first program
```

**Expected result:** Empty state copy is clear; primary action (e.g. **+ New Program** or **Create your first program**) is visible and navigates to creation flow.

**Priority:** High

---

### TC-003
**Title:** Newly created program appears in the list without manual refresh

**Preconditions:**
- User is admin
- Programs page was empty or had existing rows

**Steps:**
1. Create program **Mobile Apps 2026** with description `iOS and Android`
2. Return to or remain on Programs list view

**Gherkin:**
```gherkin
Given I am on the Programs page
When I create a program "Mobile Apps 2026" with description "iOS and Android"
Then the list shows "Mobile Apps 2026" with description "iOS and Android"
```

**Expected result:** List updates to include the new entry (integrates with DS-1).

**Priority:** High

---

### TC-004
**Title:** List reflects edits and deletions from other flows

**Preconditions:**
- **Web Development 2026** exists

**Steps:**
1. Edit name to **Web Development 2026 - Updated** (DS-2)
2. Verify list on Programs page
3. Delete a test program (DS-4) and verify row removal

**Gherkin:**
```gherkin
Given I am on the Programs page
When a program is updated or deleted elsewhere in the app
Then the program list displays the current name and description
And deleted programs no longer appear
```

**Expected result:** List is consistent with backend state.

**Priority:** Medium

---

## Negative flows

### TC-005
**Title:** Programs page does not show programs the user is not authorized to view

**Preconditions:**
- RBAC or tenant scoping applies (if applicable)
- Programs exist outside user's scope

**Steps:**
1. Log in as restricted user
2. Navigate to Programs page

**Gherkin:**
```gherkin
Given programs exist that my role cannot access
When I navigate to the Programs page
Then I do not see unauthorized programs
Or I see an access denied state instead of partial data
```

**Expected result:** No leakage of names/descriptions from other scopes.

**Priority:** High

---

### TC-006
**Title:** Failed load shows error state instead of misleading empty state

**Preconditions:**
- Simulate API/network failure loading programs

**Steps:**
1. Navigate to Programs page while backend returns 500 or network error

**Gherkin:**
```gherkin
Given the programs API fails to load
When I navigate to the Programs page
Then I see an error message with retry option
And I do not see the "no programs created" empty state
```

**Expected result:** Distinct error UI vs true empty state.

**Priority:** Medium

---

## Edge cases

### TC-007
**Title:** Long program names and descriptions display without breaking layout

**Preconditions:**
- Program with 200-character name and 500-character description exists

**Steps:**
1. Open Programs page
2. Inspect truncation, wrapping, or expand behavior

**Gherkin:**
```gherkin
Given a program with a very long name and description exists
When I navigate to the Programs page
Then the name and description are readable
And the list layout remains usable
```

**Expected result:** Ellipsis with tooltip, multi-line wrap, or detail view—no overlap with action icons.

**Priority:** Medium

---

### TC-008
**Title:** Programs with empty description still show name clearly

**Preconditions:**
- Program **DevOps 2026** exists with blank Description

**Steps:**
1. Navigate to Programs page

**Gherkin:**
```gherkin
Given a program "DevOps 2026" exists with an empty description
When I navigate to the Programs page
Then I see "DevOps 2026" in the list
And the description area shows blank, em dash, or "No description" per design
```

**Expected result:** Row is not hidden; empty description handled consistently.

**Priority:** Medium

---

### TC-009
**Title:** Special characters in list display match stored values

**Preconditions:**
- Program **Informatique & IA - Niveau 2** exists

**Steps:**
1. View Programs list

**Gherkin:**
```gherkin
Given a program "Informatique & IA - Niveau 2" exists
When I navigate to the Programs page
Then I see the name and description rendered correctly without HTML injection
```

**Expected result:** Literal display of `&`, accents, hyphens.

**Priority:** Medium

---

### TC-010
**Title:** Large number of programs remains usable (scroll/pagination)

**Preconditions:**
- 50+ programs seeded (or paginated API)

**Steps:**
1. Navigate to Programs page
2. Scroll or use pagination controls if present

**Gherkin:**
```gherkin
Given many programs exist in the system
When I navigate to the Programs page
Then I can view all programs via scrolling or pagination
And each visible row shows name and description
```

**Expected result:** Performance acceptable; no missing rows without navigation.

**Priority:** Low

---

### TC-011
**Title:** Filter by name substring (if filtering is in scope for ticket title)

**Preconditions:**
- Programs **Web Development 2026**, **Web Design 2026**, **Data Science 2026** exist
- Search/filter input exists on Programs page

**Steps:**
1. Enter `Web` in filter/search
2. Observe list

**Gherkin:**
```gherkin
Given multiple programs exist including "Web Development 2026" and "Data Science 2026"
When I filter the program list by "Web"
Then I see only programs whose names contain "Web"
And I do not see "Data Science 2026"
```

**Expected result:** Filtering matches ticket title "filtering and display" if feature shipped; otherwise test documents gap.

**Priority:** Medium

---

### TC-012
**Title:** Filter with no matches shows appropriate empty search state

**Preconditions:**
- At least one program exists
- Filter control available

**Steps:**
1. Filter by `ZZZ_NONEXISTENT_123`

**Gherkin:**
```gherkin
Given programs exist in the system
When I filter the program list by "ZZZ_NONEXISTENT_123"
Then I see a message that no programs match the filter
And clearing the filter restores the full list
```

**Expected result:** Distinct from global empty state (programs exist but hidden by filter).

**Priority:** Low

---

### TC-013
**Title:** Sort order is consistent (e.g. alphabetical by name)

**Preconditions:**
- Multiple programs with distinct names exist

**Steps:**
1. Load Programs page
2. Note order of rows
3. Refresh page

**Gherkin:**
```gherkin
Given programs "Alpha Track", "Beta Track", and "Gamma Track" exist
When I navigate to the Programs page
Then programs appear in a consistent documented order
And refreshing the page preserves that order
```

**Expected result:** Default sort documented (alphabetical, created date, etc.).

**Priority:** Low

---

## Ambiguities and gaps in the ACs

- **Filtering:** Ticket title mentions filtering; ACs only cover full list and empty state—search/filter/sort behavior is unspecified.
- **List layout:** Table vs cards vs responsive behavior not defined.
- **Actions on list:** Edit/delete icons assumed from other DS tickets but not in DS-5 ACs.
- **Empty state CTA:** "Prompt to create the first program" does not specify exact copy or button vs link.
- **Description optional:** Display rules for missing description not in ACs.
- **Pagination:** No AC for many programs or performance expectations.
- **Non-admin view:** Whether read-only list differs from admin list is unclear.
