Feature: DS-2 — Edit existing program details
  As an admin user, I want to edit an existing program's details
  so that I can correct or update program information after creation.

  # Happy paths

  Scenario: Open program for editing
    Given I am on the Programs page
    And a program "Web Development 2026" exists with description "Full-stack web development program"
    When I click the edit icon on "Web Development 2026"
    Then I see the "Edit Program" dialog
    And the Program Name field shows "Web Development 2026"
    And the Description field shows "Full-stack web development program"

  Scenario: Successfully edit a program name
    Given I am editing "Web Development 2026"
    When I change the Name to "Web Development 2026 - Updated"
    And I click Save
    Then the modal closes
    And the program list immediately shows "Web Development 2026 - Updated"
    And the program list does not show the previous name "Web Development 2026"

  Scenario: Edit preserves unchanged fields
    Given I am editing a program "Web Development 2026" with description "Full-stack web development program"
    When I only change the Description to "Evening cohort for working adults"
    And I click Save
    Then the modal closes
    And the program list still shows the name "Web Development 2026"
    And the program list shows the description "Evening cohort for working adults"
    And reopening the edit form shows Program Name "Web Development 2026"

  Scenario: Edit Program dialog has no WCAG 2 A or AA violations
    Given I am editing "Web Development 2026"
    When the Edit Program dialog is scanned for WCAG 2 A and AA
    Then the scan reports no violations inside that dialog

  # Negative

  Scenario: Save stays disabled when the program name is cleared
    Given I am editing "Web Development 2026"
    When I clear the Program Name field
    Then the Save button is disabled
    And the program list still shows "Web Development 2026"

  Scenario: Cancel discards a name change
    Given I am editing "Web Development 2026"
    When I change the Name to "Web Development 2026 - Updated"
    And I click Cancel
    Then the modal closes
    And the program list still shows "Web Development 2026"
    And the program list does not show "Web Development 2026 - Updated"

  Scenario: Reject editing a program to a duplicate name
    Given a program "Web Development 2026" exists
    And a program "Informatique & IA - Niveau 2" exists
    When I edit "Web Development 2026" and change the Name to "Informatique & IA - Niveau 2"
    And I click Save
    Then I see an error indicating the name already exists
    And the Edit Program dialog stays open
    And the program list still shows "Web Development 2026"
    And the program list still shows "Informatique & IA - Niveau 2"

  # Edge cases

  Scenario: Whitespace-only program name is not saved
    Given I am editing "Web Development 2026"
    When I change the Name to "   "
    And I click Save
    Then the form is not submitted
    And the Save button stays disabled
    And the Edit Program dialog stays open
    And the program list still shows "Web Development 2026"

  Scenario: Edited program name of exactly 100 characters is accepted
    Given I am editing "Web Development 2026"
    When I change the Name to a value of exactly 100 characters
    And I click Save
    Then the modal closes
    And that 100-character name appears in the program list
    And the program list does not show "Web Development 2026"

  Scenario: Edited program name longer than 100 characters is rejected
    Given I am editing "Web Development 2026"
    When I change the Name to a value of 101 characters
    And I click Save
    Then the form is not submitted
    And I see an error indicating the name exceeds the maximum length of 100 characters
    And the Edit Program dialog stays open
    And the program list still shows "Web Development 2026"

  Scenario: Edited description of exactly 500 characters is accepted
    Given I am editing "Web Development 2026" with description "Full-stack web development program"
    When I only change the Description to a value of exactly 500 characters
    And I click Save
    Then the modal closes
    And the program list still shows the name "Web Development 2026"

  Scenario: Edited description longer than 500 characters is rejected
    Given I am editing "Web Development 2026"
    When I change the Description to a value of 501 characters
    And I click Save
    Then the form is not submitted
    And I see an error indicating the description exceeds the maximum length of 500 characters
    And the Edit Program dialog stays open
    And the program list still shows "Web Development 2026"

  Scenario: Accept an edited name that contains special characters
    Given I am editing "Web Development 2026"
    When I change the Name to "Informatique & IA - Niveau 2"
    And I click Save
    Then the modal closes
    And the program list immediately shows "Informatique & IA - Niveau 2"
    And the program list does not show "Web Development 2026"

# Ambiguities / gaps
# - The ticket does not name the original description. Scenarios that need a known description use "Full-stack web development program" from the DS-1 create example, and "Evening cohort for working adults" as the replacement description.
# - "Other fields remain unchanged" is not enumerated. Program Setup — UI Behavior shows Program Name and Description as the always-visible fields. Assert those. Do not open or assert AI Generation Config; those fields are outside DS-2.
# - Empty name: Program Setup — UI Behavior says Save is disabled when Program Name is empty, with no error message. Whitespace-only: Validation Rules say the name is trimmed and submission is blocked, modal stays open. Assert Save stays disabled and no PATCH /api/programs/ is sent.
# - Duplicate name and max lengths are not in the DS-2 acceptance criteria. They come from Program Setup — Validation Rules and Field Definitions: name unique per organization and max 100 characters; description max 500. Expect a visible error. Do not lock the assertion to one sentence.
# - Prior DS-3 recon (2026-10-26, not repeated this run) recorded that a duplicate create returned HTTP 201 and that Program Name has no maxlength. These edit scenarios still expect the documented rules. Do not mark them test.fixme.
# - Names must be unique per organization. Specs may append a unique stamp to "Web Development 2026", "Web Development 2026 - Updated", and "Informatique & IA - Niveau 2". Assertions must use the exact string the test submitted, and that string must still contain the ticket text.
# - Edit control: Program Setup docs say the pencil icon on the row. Existing page object uses a button whose accessible name is "Edit {program name}". This run did not confirm that against the live UI.
# - Delete, semester panel, and viewer read-only behavior are out of scope.
# - Accessibility: the Edit Program dialog is a distinct surface and does not yet have an axe scan in tests/programs.a11y.spec.ts. Scope the scan to the dialog. Do not disable axe rules unless a comment names a known false positive and the fix that removes it.

# UI recon
# - Skipped recon. DIDAXIS_EMAIL and DIDAXIS_PASSWORD are unset, and there is no .env file. Live login was not attempted.
# - Date: 2026-11-03
# - Base URL that would have been used: DIDAXIS_URL, otherwise https://test.didaxis.studio
# - Paths from the ticket and Program Setup docs (not observed this run): /login, then /programs
# - Locator hints from existing page objects in this repo (not confirmed against the live UI this run):
#   - Programs heading: getByRole heading "Programs" level 2
#   - Edit control: button "Edit {program name}"
#   - Dialog heading: "Edit Program"
#   - Program Name: getByLabel "Program Name"
#   - Description: getByLabel "Description"
#   - Save: button "Save"
#   - Cancel: button "Cancel"
#   - Program row: main table row filtered by the program name
#   - axe include: EditProgramModal.axeIncludeSelector()
# - Docs: Program Setup — Overview (Confluence 233046017), Field Definitions (233078785), Validation Rules (233111553), UI Behavior (233111568)
