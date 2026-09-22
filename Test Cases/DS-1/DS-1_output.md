# Test Plan: DS-1 — Create new academic program

## Positive flows

### TC-001
**Title:** Admin can open the program creation form from the Programs page

**Preconditions:**
- User is logged in as admin
- At least one program may or may not exist in the system

**Steps:**
1. Navigate to the Programs page
2. Click "+ New Program"

**Gherkin:**
```gherkin
Given I am logged in as admin
When I navigate to the Programs page
And I click "+ New Program"
Then I see the program creation form with fields: Program Name, Description
```

**Expected result:** A program creation modal (or form) opens showing **Program Name** and **Description** fields and a **Create** action.

**Priority:** High

---

### TC-002
**Title:** A valid program is created and appears in the program list

**Preconditions:**
- User is logged in as admin
- Program creation form is open

**Steps:**
1. Enter `Web Development 2026` in Program Name
2. Enter `Full-stack web development program` in Description
3. Click **Create**

**Gherkin:**
```gherkin
Given I am on the program creation form
When I fill in Program Name with "Web Development 2026"
And I fill in Description with "Full-stack web development program"
And I click Create
Then the modal closes
And the program list shows "Web Development 2026"
```

**Expected result:** The creation modal closes; the Programs list includes **Web Development 2026** with the saved description visible (per list display rules in DS-5).

**Priority:** High

---

### TC-003
**Title:** Program can be created with description left empty if the field is optional

**Preconditions:**
- User is logged in as admin
- Program creation form is open
- Description is not marked required in the UI

**Steps:**
1. Enter `Data Science Fundamentals` in Program Name
2. Leave Description empty
3. Click **Create**

**Gherkin:**
```gherkin
Given I am on the program creation form
When I fill in Program Name with "Data Science Fundamentals"
And I leave Description empty
And I click Create
Then the modal closes
And the program list shows "Data Science Fundamentals"
```

**Expected result:** Program is created successfully; list shows the new name (description empty or shown as blank/em dash per product convention).

**Priority:** Medium

---

## Negative flows

### TC-004
**Title:** Create action is unavailable when Program Name is empty

**Preconditions:**
- User is logged in as admin
- Program creation form is open

**Steps:**
1. Leave Program Name empty
2. Optionally fill Description with any text
3. Observe the **Create** button state

**Gherkin:**
```gherkin
Given I am on the program creation form
When I leave the Program Name field empty
Then the Create button is disabled
```

**Expected result:** **Create** is disabled; no program is created; modal remains open.

**Priority:** High

---

### TC-005
**Title:** Program is not created when user dismisses the form without saving

**Preconditions:**
- User is logged in as admin
- Program creation form is open

**Steps:**
1. Enter `Temporary Draft Program` in Program Name
2. Close the modal via Cancel, X, or Escape (whichever the UI supports)
3. Review the Programs list

**Gherkin:**
```gherkin
Given I am on the program creation form
When I fill in Program Name with "Temporary Draft Program"
And I dismiss the program creation form without saving
Then the modal closes
And the program list does not show "Temporary Draft Program"
```

**Expected result:** No new program record appears in the list.

**Priority:** Medium

---

### TC-006
**Title:** Non-admin user cannot access program creation

**Preconditions:**
- User is logged in with a role other than admin (if role-based access exists)

**Steps:**
1. Navigate to the Programs page
2. Attempt to open program creation (+ New Program or equivalent)

**Gherkin:**
```gherkin
Given I am logged in as a non-admin user
When I navigate to the Programs page
Then I do not see "+ New Program"
Or I see an access denied message when attempting to create a program
```

**Expected result:** Program creation is not available to unauthorized users; no create API/form submission succeeds.

**Priority:** High

---

## Edge cases

### TC-007
**Title:** Program name at maximum allowed length is accepted

**Preconditions:**
- User is logged in as admin
- Maximum Program Name length is defined (e.g. 255 characters)

**Steps:**
1. Open program creation form
2. Enter a Program Name of exactly the maximum allowed length (e.g. 255 `A` characters)
3. Enter `Boundary length name test` in Description
4. Click **Create**

**Gherkin:**
```gherkin
Given I am on the program creation form
When I fill in Program Name with a string of maximum allowed length
And I fill in Description with "Boundary length name test"
And I click Create
Then the modal closes
And the program list shows the program with the full name
```

**Expected result:** Program is created; full name is stored and displayed without truncation errors.

**Priority:** Medium

---

### TC-008
**Title:** Program name exceeding maximum length is rejected

**Preconditions:**
- User is logged in as admin
- Maximum Program Name length is known

**Steps:**
1. Open program creation form
2. Enter a Program Name one character over the maximum
3. Click **Create**

**Gherkin:**
```gherkin
Given I am on the program creation form
When I fill in Program Name with a string one character over the maximum allowed length
And I click Create
Then the program is not created
And I see a validation message for Program Name
```

**Expected result:** Form is not submitted; inline or toast validation explains the length limit.

**Priority:** Medium

---

### TC-009
**Title:** Description accepts long text and special characters

**Preconditions:**
- User is logged in as admin
- Program creation form is open

**Steps:**
1. Enter `Cybersecurity 2026` in Program Name
2. Enter `Covers OWASP Top 10, TLS 1.3, & "secure by design" — 100% hands-on.` in Description
3. Click **Create**

**Gherkin:**
```gherkin
Given I am on the program creation form
When I fill in Program Name with "Cybersecurity 2026"
And I fill in Description with "Covers OWASP Top 10, TLS 1.3, & \"secure by design\" — 100% hands-on."
And I click Create
Then the modal closes
And the program list shows "Cybersecurity 2026"
```

**Expected result:** Program is created; description is persisted and displayed correctly (encoding/HTML safety handled server-side).

**Priority:** Low

---

### TC-010
**Title:** Leading and trailing spaces in Program Name are handled consistently

**Preconditions:**
- User is logged in as admin
- Program creation form is open

**Steps:**
1. Enter `  Mobile Apps 2026  ` in Program Name (leading/trailing spaces)
2. Fill Description with `iOS and Android track`
3. Click **Create**

**Gherkin:**
```gherkin
Given I am on the program creation form
When I fill in Program Name with "  Mobile Apps 2026  "
And I fill in Description with "iOS and Android track"
And I click Create
Then either the program is created with trimmed name "Mobile Apps 2026"
Or validation prevents submission with a clear message
```

**Expected result:** Behavior matches DS-3 trimming rules; no duplicate-looking names due to invisible whitespace.

**Priority:** Medium

---

## Ambiguities and gaps in the ACs

- **Description requiredness:** ACs always fill Description on success paths; unclear whether Description is optional or required.
- **Modal vs full page:** AC refers to a modal closing; layout (modal vs dedicated page) is unspecified.
- **Duplicate names on create:** Not covered in DS-1 ACs (covered in DS-3); interaction between disabled Create and server-side duplicate errors is unclear.
- **Permissions:** Only admin is mentioned for navigation AC; other roles are not specified.
- **Max length and character set:** No limits stated for Program Name or Description in DS-1 ACs.
- **Post-create feedback:** AC implies list update only; no mention of success toast or default sort order for the new row.
