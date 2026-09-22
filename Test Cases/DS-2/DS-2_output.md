# Test Plan: DS-2 — Edit existing program details

## Positive flows

### TC-001
**Title:** Edit form opens with current program data pre-populated

**Preconditions:**
- User is logged in as admin
- Program **Web Development 2026** exists with a known description (e.g. `Full-stack web development program`)

**Steps:**
1. Navigate to the Programs page
2. Click the edit icon on **Web Development 2026**

**Gherkin:**
```gherkin
Given I am on the Programs page
And a program "Web Development 2026" exists
When I click the edit icon on "Web Development 2026"
Then I see the edit form pre-populated with the program's current data
```

**Expected result:** Edit modal/form shows **Name** (or Program Name) and **Description** matching the existing program values.

**Priority:** High

---

### TC-002
**Title:** Program name change is saved and reflected immediately in the list

**Preconditions:**
- User is logged in as admin
- Program **Web Development 2026** exists
- Edit form is open for that program

**Steps:**
1. Change Name to `Web Development 2026 - Updated`
2. Click **Save**

**Gherkin:**
```gherkin
Given I am editing "Web Development 2026"
When I change the Name to "Web Development 2026 - Updated"
And I click Save
Then the modal closes
And the program list immediately shows "Web Development 2026 - Updated"
```

**Expected result:** Modal closes; list row title updates without full page reload (or with acceptable SPA refresh); old name no longer appears.

**Priority:** High

---

### TC-003
**Title:** Unchanged fields remain the same when only description is edited

**Preconditions:**
- User is logged in as admin
- Program exists with Name `Cloud Engineering 2026` and Description `AWS and Azure fundamentals`

**Steps:**
1. Open edit for **Cloud Engineering 2026**
2. Change Description to `AWS, Azure, and GCP fundamentals`
3. Leave Name unchanged
4. Click **Save**

**Gherkin:**
```gherkin
Given I am editing a program
When I only change the Description
And I click Save
Then the Name and other fields remain unchanged
```

**Expected result:** Name stays **Cloud Engineering 2026**; only Description updates in the list/detail view.

**Priority:** High

---

### TC-004
**Title:** Both name and description can be updated in a single save

**Preconditions:**
- User is logged in as admin
- Program **UX Design 2026** exists

**Steps:**
1. Open edit for **UX Design 2026**
2. Set Name to `UX/UI Design 2026`
3. Set Description to `Research, wireframes, and usability testing`
4. Click **Save**

**Gherkin:**
```gherkin
Given I am editing "UX Design 2026"
When I change the Name to "UX/UI Design 2026"
And I change the Description to "Research, wireframes, and usability testing"
And I click Save
Then the modal closes
And the program list shows "UX/UI Design 2026" with the updated description
```

**Expected result:** Both fields persist; list reflects both changes.

**Priority:** Medium

---

## Negative flows

### TC-005
**Title:** Empty program name prevents save on edit

**Preconditions:**
- User is logged in as admin
- Program **Web Development 2026** exists
- Edit form is open

**Steps:**
1. Clear the Name field completely
2. Attempt to click **Save**

**Gherkin:**
```gherkin
Given I am editing "Web Development 2026"
When I clear the Name field
Then the Save button is disabled
Or I see a validation error and the program is not updated
```

**Expected result:** No save occurs; original program data remains in the list.

**Priority:** High

---

### TC-006
**Title:** Canceling edit discards unsaved changes

**Preconditions:**
- User is logged in as admin
- Program **Web Development 2026** exists with original description

**Steps:**
1. Open edit for **Web Development 2026**
2. Change Name to `Should Not Persist`
3. Click **Cancel** (or dismiss modal)

**Gherkin:**
```gherkin
Given I am editing "Web Development 2026"
When I change the Name to "Should Not Persist"
And I cancel the edit form
Then the modal closes
And the program list still shows "Web Development 2026"
```

**Expected result:** List still shows original name and description.

**Priority:** Medium

---

### TC-007
**Title:** Duplicate program name on edit is rejected

**Preconditions:**
- Programs **Web Development 2026** and **Data Science 2026** exist
- User is editing **Data Science 2026**

**Steps:**
1. Change Name to `Web Development 2026`
2. Click **Save**

**Gherkin:**
```gherkin
Given I am editing "Data Science 2026"
And a program "Web Development 2026" already exists
When I change the Name to "Web Development 2026"
And I click Save
Then I see an error indicating the name already exists
And the program list still shows "Data Science 2026"
```

**Expected result:** Save blocked; error message matches DS-3 duplicate rules; no partial update.

**Priority:** High

---

### TC-008
**Title:** Non-admin cannot edit programs

**Preconditions:**
- User is logged in as non-admin (if RBAC applies)
- At least one program exists

**Steps:**
1. Navigate to Programs page
2. Attempt to use edit icon or API

**Gherkin:**
```gherkin
Given I am logged in as a non-admin user
When I navigate to the Programs page
Then I do not see edit actions on programs
Or edit attempts are denied with an appropriate message
```

**Expected result:** Program data cannot be modified by unauthorized users.

**Priority:** High

---

## Edge cases

### TC-009
**Title:** Whitespace-only name on edit is treated as empty

**Preconditions:**
- User is logged in as admin
- Program **Web Development 2026** exists
- Edit form is open

**Steps:**
1. Replace Name with `     ` (spaces only)
2. Click **Save**

**Gherkin:**
```gherkin
Given I am editing "Web Development 2026"
When I change the Name to "   "
And I click Save
Then the form is not submitted
And the program list still shows "Web Development 2026"
```

**Expected result:** Aligns with DS-3 trim/empty rules; Save disabled or validation shown.

**Priority:** Medium

---

### TC-010
**Title:** Special characters in edited name are accepted

**Preconditions:**
- User is logged in as admin
- Program **Informatique Base** exists

**Steps:**
1. Open edit form
2. Set Name to `Informatique & IA - Niveau 2`
3. Click **Save**

**Gherkin:**
```gherkin
Given I am editing "Informatique Base"
When I change the Name to "Informatique & IA - Niveau 2"
And I click Save
Then the modal closes
And the program list shows "Informatique & IA - Niveau 2"
```

**Expected result:** Name with `&`, hyphen, and accents saves and displays correctly.

**Priority:** Medium

---

### TC-011
**Title:** Concurrent edit: last save wins or conflict is surfaced

**Preconditions:**
- Two admin sessions (or tabs) open on the same program

**Steps:**
1. Session A opens edit for **Web Development 2026**, changes Description to `Version A`
2. Session B opens edit for the same program, changes Description to `Version B` and saves
3. Session A saves Name unchanged with Description `Version A`

**Gherkin:**
```gherkin
Given two admins edit the same program concurrently
When both attempt to save different descriptions
Then the system either applies the last successful save
Or shows a conflict message and prevents silent data loss
```

**Expected result:** Documented behavior—no corrupted record; user aware if overwrite occurred.

**Priority:** Low

---

### TC-012
**Title:** Maximum-length name on edit behaves like create validation

**Preconditions:**
- User is logged in as admin
- Program exists with a short name

**Steps:**
1. Open edit
2. Set Name to max-length + 1 characters
3. Click **Save**

**Gherkin:**
```gherkin
Given I am editing a program
When I change the Name to exceed the maximum allowed length
And I click Save
Then the program is not updated
And I see a validation message for Name
```

**Expected result:** Same max-length rules as create (DS-1 edge cases).

**Priority:** Low

---

## Ambiguities and gaps in the ACs

- **Field labels:** AC uses "Name" in edit scenarios vs "Program Name" on create; assumed same field.
- **Save button disabled state:** Create AC disables button when name empty; edit AC does not specify Save disabled vs error-on-click.
- **Duplicate names on edit:** Not in DS-2 ACs but logically tied to DS-3; behavior should be explicit.
- **Immediate list update:** "Immediately" does not define optimistic UI vs refetch; test should allow either if visually instant.
- **Other fields:** "Other fields remain unchanged" implies only Name and Description exist—confirm no hidden metadata (dates, IDs).
- **Permissions:** Edit AC does not state required role; assumed admin like DS-1.
