# Test Plan: DS-4 — Delete program with confirmation

## Positive flows

### TC-001
**Title:** Confirmed deletion removes the program from the list

**Preconditions:**
- User is logged in as admin
- Program **Test Program** exists on the Programs page

**Steps:**
1. Navigate to the Programs page
2. Click the delete icon for **Test Program**
3. Verify confirmation dialog appears
4. Confirm deletion (e.g. **Delete** or **Confirm**)

**Gherkin:**
```gherkin
Given a program "Test Program" exists
When I click the delete icon for "Test Program"
Then I see a confirmation dialog
When I confirm deletion
Then "Test Program" is removed from the program list
```

**Expected result:** **Test Program** no longer appears in the list; count decreases by one.

**Priority:** High

---

### TC-002
**Title:** Confirmation dialog shows context for the program being deleted

**Preconditions:**
- Program **Test Program** exists with description `Used for QA delete flows`

**Steps:**
1. Click delete icon for **Test Program**
2. Read dialog content

**Gherkin:**
```gherkin
Given a program "Test Program" exists
When I click the delete icon for "Test Program"
Then I see a confirmation dialog
And the dialog references "Test Program" or warns that deletion is permanent
```

**Expected result:** User can identify which program will be deleted before confirming.

**Priority:** Medium

---

## Negative flows

### TC-003
**Title:** Canceling deletion keeps the program in the list

**Preconditions:**
- User is logged in as admin
- At least one program exists (e.g. **Test Program**)

**Steps:**
1. Click the delete icon for a program
2. When confirmation dialog appears, click **Cancel**

**Gherkin:**
```gherkin
Given I click the delete icon for a program
When I see the confirmation dialog
And I click Cancel
Then the program still exists in the list
```

**Expected result:** Dialog closes; program row unchanged; no backend delete occurred.

**Priority:** High

---

### TC-004
**Title:** Dismissing dialog via Escape or overlay click cancels deletion (if supported)

**Preconditions:**
- Program **Test Program** exists

**Steps:**
1. Open delete confirmation for **Test Program**
2. Press Escape or click outside modal (per UX spec)
3. Check list

**Gherkin:**
```gherkin
Given I opened the delete confirmation for "Test Program"
When I dismiss the dialog without confirming
Then "Test Program" still exists in the list
```

**Expected result:** Same as Cancel—no deletion.

**Priority:** Medium

---

### TC-005
**Title:** Non-admin cannot delete programs

**Preconditions:**
- User logged in as non-admin
- Program **Test Program** exists

**Steps:**
1. Navigate to Programs page
2. Attempt delete action

**Gherkin:**
```gherkin
Given I am logged in as a non-admin user
And a program "Test Program" exists
When I navigate to the Programs page
Then I do not see delete actions
Or delete attempts are rejected with an access denied message
```

**Expected result:** Program remains; no delete API success for unauthorized role.

**Priority:** High

---

### TC-006
**Title:** Program is not deleted without explicit confirmation

**Preconditions:**
- Program **Test Program** exists

**Steps:**
1. Click delete icon
2. Close browser tab before confirming (optional chaos)
3. Re-open Programs page without confirming in a normal flow: verify list still has program if dialog was never confirmed

**Gherkin:**
```gherkin
Given a program "Test Program" exists
When I click the delete icon for "Test Program"
And I do not confirm deletion
Then "Test Program" remains in the program list
```

**Expected result:** Deletion requires explicit confirm action only.

**Priority:** Medium

---

## Edge cases

### TC-007
**Title:** Deleting the only program in the system shows empty state

**Preconditions:**
- Exactly one program **Test Program** exists
- User is admin

**Steps:**
1. Delete **Test Program** with confirmation
2. Observe Programs page

**Gherkin:**
```gherkin
Given only the program "Test Program" exists
When I confirm deletion of "Test Program"
Then "Test Program" is removed from the program list
And I see the empty state for programs per DS-5
```

**Expected result:** Empty state message and create-first-program prompt appear (DS-5).

**Priority:** Medium

---

### TC-008
**Title:** Delete program with special characters in name works end-to-end

**Preconditions:**
- Program **Informatique & IA - Niveau 2** exists

**Steps:**
1. Click delete icon for that program
2. Confirm deletion

**Gherkin:**
```gherkin
Given a program "Informatique & IA - Niveau 2" exists
When I click the delete icon for "Informatique & IA - Niveau 2"
And I confirm deletion
Then "Informatique & IA - Niveau 2" is removed from the program list
```

**Expected result:** Correct row removed; no mismatch due to encoding.

**Priority:** Low

---

### TC-009
**Title:** Double-click confirm or rapid double delete does not cause errors

**Preconditions:**
- Program **Test Program** exists

**Steps:**
1. Open delete confirmation
2. Double-click **Confirm** quickly

**Gherkin:**
```gherkin
Given a program "Test Program" exists
When I confirm deletion twice in quick succession
Then "Test Program" is removed once
And I do not see a server error or duplicate delete failure
```

**Expected result:** Idempotent delete handling; single removal.

**Priority:** Low

---

### TC-010
**Title:** Delete while another user edits the same program

**Preconditions:**
- Admin A editing **Test Program**
- Admin B deletes **Test Program** with confirmation

**Steps:**
1. Admin B completes delete
2. Admin A attempts Save on edit form

**Gherkin:**
```gherkin
Given admin B deletes "Test Program" while admin A has it open for edit
When admin A clicks Save
Then admin A sees an error that the program no longer exists
And no orphaned data is recreated in the list
```

**Expected result:** Graceful handling of stale edit session.

**Priority:** Low

---

### TC-011
**Title:** Keyboard accessibility for confirmation dialog

**Preconditions:**
- Program **Test Program** exists
- Delete confirmation is open

**Steps:**
1. Tab to **Cancel** and activate
2. Re-open delete; Tab to confirm and activate with Enter

**Gherkin:**
```gherkin
Given the delete confirmation dialog is open
When I activate Cancel using the keyboard
Then the program is not deleted
When I open delete again and confirm using the keyboard
Then the program is removed from the list
```

**Expected result:** Focus trap and focus return; actions work without mouse.

**Priority:** Low

---

## Ambiguities and gaps in the ACs

- **Soft vs hard delete:** AC says "removed from list"; unclear if data is permanently purged or recoverable.
- **Cascade effects:** No AC on linked courses, cohorts, or enrollments when a program is deleted.
- **Dialog copy:** Confirm button label (**Delete** vs **OK**) and destructive styling not specified.
- **Permissions:** Delete AC does not state role; assumed admin.
- **Undo:** No mention of snackbar undo after delete.
- **List refresh:** Assumes immediate UI update; polling/error handling on failed delete not covered.
