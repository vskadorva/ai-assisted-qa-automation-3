# Test Plan: DS-3 — Program name validation and duplicate prevention

## Positive flows

### TC-001
**Title:** Program name containing special characters and accents is accepted

**Preconditions:**
- User is logged in as admin
- No existing program named `Informatique & IA - Niveau 2`
- Program creation form is available

**Steps:**
1. Open program creation form
2. Enter `Informatique & IA - Niveau 2` as Program Name
3. Enter `Advanced track with ML electives` in Description
4. Click **Create**

**Gherkin:**
```gherkin
Given I am on the program creation form
When I enter "Informatique & IA - Niveau 2" as the program name
And I fill other required fields
And I click Create
Then the program is created successfully
```

**Expected result:** Program appears in the list with the exact display name (HTML-encoded safely in UI).

**Priority:** High

---

### TC-002
**Title:** Same name with different casing is handled per product duplicate rules

**Preconditions:**
- Program **Web Development 2026** exists
- Duplicate check policy (case-sensitive vs case-insensitive) is documented

**Steps:**
1. Open create form
2. Enter `web development 2026` as Program Name
3. Fill Description and click **Create**

**Gherkin:**
```gherkin
Given a program "Web Development 2026" already exists
When I try to create a new program with the name "web development 2026"
Then either I see an error indicating the name already exists
Or the program is created if duplicates are case-insensitive allowed
```

**Expected result:** Behavior matches defined rule; no ambiguous duplicate rows in the list.

**Priority:** Medium

---

## Negative flows

### TC-003
**Title:** Whitespace-only program name is not submitted

**Preconditions:**
- User is logged in as admin
- Program creation form is open

**Steps:**
1. Enter `   ` (spaces only) in Program Name
2. Enter `Valid description` in Description
3. Click **Create**

**Gherkin:**
```gherkin
Given I am on the program creation form
When I enter "   " as the program name
And I click Create
Then the form is not submitted
And the name is trimmed and treated as empty
```

**Expected result:** No new program; **Create** disabled or validation error; list unchanged.

**Priority:** High

---

### TC-004
**Title:** Exact duplicate program name on create shows an error

**Preconditions:**
- Program **Web Development 2026** already exists
- User is on program creation form

**Steps:**
1. Enter `Web Development 2026` as Program Name
2. Fill Description with `Duplicate attempt`
3. Click **Create**

**Gherkin:**
```gherkin
Given a program "Web Development 2026" already exists
When I try to create a new program with the same name
Then I see an error indicating the name already exists
```

**Expected result:** Error is visible (inline under Name and/or toast); modal stays open; no second row with the same name.

**Priority:** High

---

### TC-005
**Title:** Empty program name cannot be submitted via create

**Preconditions:**
- User is logged in as admin
- Program creation form is open

**Steps:**
1. Leave Program Name empty
2. Click **Create** if enabled

**Gherkin:**
```gherkin
Given I am on the program creation form
When I leave the Program Name field empty
Then the Create button is disabled
And the form is not submitted
```

**Expected result:** Consistent with DS-1; aligns with trim-to-empty for whitespace-only.

**Priority:** High

---

### TC-006
**Title:** Duplicate name on edit is rejected while editing another program

**Preconditions:**
- **Web Development 2026** and **AI Bootcamp 2026** exist
- User opens edit for **AI Bootcamp 2026**

**Steps:**
1. Change Name to `Web Development 2026`
2. Click **Save**

**Gherkin:**
```gherkin
Given a program "Web Development 2026" already exists
And I am editing "AI Bootcamp 2026"
When I change the name to "Web Development 2026"
And I click Save
Then I see an error indicating the name already exists
And "AI Bootcamp 2026" remains in the list
```

**Expected result:** Duplicate check excludes self on rename-to-same-name but blocks collision with other programs.

**Priority:** High

---

### TC-007
**Title:** Renaming a program to its current name succeeds without false duplicate error

**Preconditions:**
- Program **Web Development 2026** exists

**Steps:**
1. Open edit for **Web Development 2026**
2. Change Description only, leave Name as `Web Development 2026`
3. Click **Save**

**Gherkin:**
```gherkin
Given I am editing "Web Development 2026"
When I keep the name as "Web Development 2026"
And I update the Description
And I click Save
Then the save succeeds
And I do not see a duplicate name error
```

**Expected result:** Save succeeds; no erroneous duplicate validation.

**Priority:** Medium

---

## Edge cases

### TC-008
**Title:** Leading/trailing whitespace around a valid name is trimmed before duplicate check

**Preconditions:**
- Program **Web Development 2026** exists

**Steps:**
1. On create form, enter `  Web Development 2026  ` as Program Name
2. Click **Create**

**Gherkin:**
```gherkin
Given a program "Web Development 2026" already exists
When I try to create a new program with the name "  Web Development 2026  "
Then I see an error indicating the name already exists
Or the form treats the trimmed name as duplicate
```

**Expected result:** Trimmed value participates in uniqueness check; user cannot bypass duplicate rule with spaces.

**Priority:** High

---

### TC-009
**Title:** Program names with Unicode and emoji are validated consistently

**Preconditions:**
- User is logged in as admin
- No program named `Programme 🎓 2026`

**Steps:**
1. Create program with Name `Programme 🎓 2026` and valid Description
2. Attempt to create second program with the same Name

**Gherkin:**
```gherkin
Given a program "Programme 🎓 2026" already exists
When I try to create another program named "Programme 🎓 2026"
Then I see an error indicating the name already exists
```

**Expected result:** Unicode names supported; duplicate detection works on full Unicode string.

**Priority:** Low

---

### TC-010
**Title:** Names with only tabs or mixed whitespace are treated as empty

**Preconditions:**
- Program creation form is open

**Steps:**
1. Enter `\t\t` or `\t \t` in Program Name
2. Click **Create**

**Gherkin:**
```gherkin
Given I am on the program creation form
When I enter only tab and space characters as the program name
And I click Create
Then the form is not submitted
And the name is treated as empty after trimming
```

**Expected result:** Same as spaces-only AC; no ghost programs.

**Priority:** Medium

---

### TC-011
**Title:** Maximum-length boundary name does not break duplicate detection

**Preconditions:**
- Max name length N is known
- Program A exists with an N-character name

**Steps:**
1. Attempt create with identical N-character name
2. Attempt create with N-character name differing only in last character

**Gherkin:**
```gherkin
Given a program exists with a name at maximum length
When I try to create a program with the identical name
Then I see a duplicate name error
When I create a program with a name that differs by one character at the boundary
Then the program is created successfully if no other validation fails
```

**Expected result:** Length and uniqueness validations work together.

**Priority:** Low

---

### TC-012
**Title:** SQL/script-like characters in name do not break validation or storage

**Preconditions:**
- Program creation form is open
- Name `Test'; DROP TABLE programs;--` is not already used

**Steps:**
1. Enter the script-like string as Program Name
2. Fill Description and click **Create**

**Gherkin:**
```gherkin
Given I am on the program creation form
When I enter "Test'; DROP TABLE programs;--" as the program name
And I fill other required fields
And I click Create
Then the program is created successfully
And the name is displayed literally in the list
```

**Expected result:** Stored safely; no injection; duplicate rules still apply on exact match.

**Priority:** Medium

---

## Ambiguities and gaps in the ACs

- **Case sensitivity:** Duplicate AC uses exact string; case-insensitive duplicates not specified.
- **Trim scope:** AC mentions trim for whitespace-only; unclear if all names are trimmed on save.
- **Error UX:** Message text, field-level vs global error, and whether **Create** stays enabled after duplicate attempt are unspecified.
- **Edit vs create:** Duplicate AC is create-only; edit/rename collisions should be explicitly in scope (covered in extended cases).
- **Normalization:** Unicode normalization (é vs e\u0301), invisible characters, and homoglyphs not addressed.
- **Description uniqueness:** Only program name uniqueness is specified.
