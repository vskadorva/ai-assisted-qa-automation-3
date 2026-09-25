# Test Plan: TodoMVC

App: https://demo.playwright.dev/todomvc/

## Positive flows

### TC-001
**Title:** "Buy milk" appears in the list as an active item

**Preconditions:**
- TodoMVC is open
- The list is empty

**Steps:**
1. Click the **What needs to be done?** input
2. Type `Buy milk`
3. Press Enter

**Expected result:** `Buy milk` is listed as active (checkbox unchecked, text not struck through). The footer shows **1 item left**.

---

### TC-002
**Title:** Completed item is struck through and no longer counted as left

**Preconditions:**
- An active item `Buy milk` is in the list

**Steps:**
1. Click the checkbox on `Buy milk`

**Expected result:** `Buy milk` is marked completed (checkbox checked, text struck through). The footer shows **0 items left**.

---

### TC-003
**Title:** Deleted item is removed and the remaining count updates

**Preconditions:**
- Active items `Buy milk` and `Walk dog` are in the list

**Steps:**
1. Hover `Buy milk`
2. Click its destroy (×) button

**Expected result:** `Buy milk` is gone. `Walk dog` remains active. The footer shows **1 item left**.

---

## Negative flows

### TC-004
**Title:** Empty Enter does not add a blank item

**Preconditions:**
- TodoMVC is open
- The list is empty
- The **What needs to be done?** input is empty

**Steps:**
1. Press Enter

**Expected result:** The list stays empty. No blank row appears. The footer stays hidden.

---

### TC-005
**Title:** Text stays in the input until Enter is pressed

**Preconditions:**
- The list is empty

**Steps:**
1. Type `Buy milk` in **What needs to be done?**
2. Do not press Enter

**Expected result:** No item is added. `Buy milk` remains in the input.

---

### TC-006
**Title:** Completing one item leaves the others active

**Preconditions:**
- Active items `Buy milk` and `Walk dog` are in the list

**Steps:**
1. Click the checkbox on `Buy milk` only

**Expected result:** `Buy milk` is completed. `Walk dog` stays active. The footer shows **1 item left**.

---

### TC-007
**Title:** Deleting one item leaves the others in place

**Preconditions:**
- Active items `Buy milk` and `Walk dog` are in the list

**Steps:**
1. Hover `Walk dog` and click its destroy button

**Expected result:** `Walk dog` is removed. `Buy milk` is still active. The footer shows **1 item left**.

---

## Edge cases

### TC-008
**Title:** A one-character title is saved and shown

**Preconditions:**
- The list is empty

**Steps:**
1. Type `A` in **What needs to be done?**
2. Press Enter

**Expected result:** `A` appears as an active item. The footer shows **1 item left**.

---

### TC-009
**Title:** Whitespace-only input is not added

**Preconditions:**
- The list is empty

**Steps:**
1. Type three spaces in **What needs to be done?**
2. Press Enter

**Expected result:** No item is added. The list stays empty.

---

### TC-010
**Title:** Leading and trailing spaces are trimmed from the title

**Preconditions:**
- The list is empty

**Steps:**
1. Type `  Buy milk  ` in **What needs to be done?**
2. Press Enter

**Expected result:** The item title is `Buy milk`, without the surrounding spaces.

---

### TC-011
**Title:** Special characters are stored and displayed as typed

**Preconditions:**
- The list is empty

**Steps:**
1. Type `Buy milk & eggs — "2%" <urgent>` in **What needs to be done?**
2. Press Enter

**Expected result:** The list shows `Buy milk & eggs — "2%" <urgent>` exactly, as plain text.

---

### TC-012
**Title:** Two items with the same title both remain in the list

**Preconditions:**
- The list is empty

**Steps:**
1. Add `Buy milk`
2. Add `Buy milk` again

**Expected result:** Two separate active items titled `Buy milk` are shown. The footer shows **2 items left**.

---

### TC-013
**Title:** A very long title is accepted and shown in full

**Preconditions:**
- The list is empty

**Steps:**
1. Type a 200-character title: `Buy milk ` repeated until the text is 200 characters
2. Press Enter

**Expected result:** The item is added. The full title is visible (it may wrap). The footer shows **1 item left**.

---

## Ambiguities and gaps

- **Max length** is not defined. The input has no `maxlength`, so TC-013 uses 200 characters as a practical check, not a specified limit.
- **Duplicates** are not mentioned. The app allows them (TC-012). It is unclear whether that is intended.
- **Empty and whitespace** behavior is not in the ACs. The app trims the title and ignores a blank result (TC-004, TC-009, TC-010).
- **Complete** does not say what “done” looks like, or whether the items-left count should change.
- **Delete** does not say the control appears only on hover, or how the count should change.
- **Out of scope for these ACs, but present in the UI:** double-click edit, Mark all as complete, Clear completed, and the All / Active / Completed filters.
- **Persistence** across reload is not specified.
