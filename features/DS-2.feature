Feature: DS-2 — Edit existing program details
  As an admin user, I want to edit an existing program's details
  so that I can correct or update program information after creation.

  # Happy paths

  Scenario: Open program for editing
    Given I am on the Programs page
    And a program "Web Development 2026" exists with description "Full-stack web development program"
    When I click the edit control on "Web Development 2026"
    Then I see the "Edit Program" dialog
    And Program Name is pre-filled with "Web Development 2026"
    And Description is pre-filled with "Full-stack web development program"

  Scenario: Successfully edit a program name
    Given I am editing "Web Development 2026" with description "Full-stack web development program"
    When I change the Name to "Web Development 2026 - Updated"
    And I click Save
    Then the modal closes
    And the program list shows "Web Development 2026 - Updated"
    And the program list no longer shows the previous name on that program
    And the description on that row is still "Full-stack web development program"

  Scenario: Edit preserves unchanged fields
    Given I am editing "Web Development 2026" with description "Full-stack web development program"
    When I only change the Description to "Updated curriculum overview"
    And I click Save
    Then the modal closes
    And the program list still shows "Web Development 2026"
    And that row shows "Updated curriculum overview"

  # Negative

  Scenario: Empty program name cannot be saved
    Given I am editing "Web Development 2026"
    When I clear the Program Name
    Then the Save button is disabled
    And the program is not updated

  Scenario: Cancel discards a name change
    Given I am editing "Web Development 2026"
    When I change the Name to "Web Development 2026 - Updated"
    And I click Cancel
    Then the modal closes
    And the program list still shows "Web Development 2026"
    And the program list does not show "Web Development 2026 - Updated"

  # Edge cases

  Scenario: Program name of only spaces cannot be saved
    Given I am editing "Web Development 2026"
    When I replace the Program Name with "   "
    Then the Save button is disabled
    And the program is not updated

  Scenario: Clearing the description keeps the program name
    Given I am editing "Web Development 2026" with description "Full-stack web development program"
    When I clear the Description
    And I click Save
    Then the modal closes
    And the program list still shows "Web Development 2026"
    And that row does not show "Full-stack web development program"

  Scenario: Edit Program dialog has no WCAG 2 A or AA violations in its subtree
    Given I am editing "Web Development 2026"
    When the Edit Program dialog is scanned with axe for WCAG 2 A and AA
    Then the scan is recorded with the project's accessibility helper

# Ambiguities / gaps
# - The ticket says "edit icon". The live control is a button whose accessible name is "Edit {program name}". There is no separate text label "edit".
# - "Other fields" in the preserve-unchanged AC are not listed. The edit form shows Program Name and Description, plus a collapsed "Show AI Generation Config" control. This plan treats Description as the field that changes and Program Name as the field that must stay. Do not open AI Generation Config.
# - Save stays disabled when Program Name is empty or only spaces. No alert is shown. Assert Save is disabled and no PATCH /api/programs/{id} is sent. Do not click a disabled Save button.
# - Description is optional. Clearing it and saving is accepted (PATCH 200) and the name stays.
# - The dialog closes after the PATCH response, not in the same instant. The programs table also refreshes after the response. Wait with retrying visibility assertions.
# - Duplicate names and a max length are not in the DS-2 acceptance criteria. Do not assert that renaming onto an existing name is rejected, and do not submit a 255-character name. Prior comments on DS-2 describe those as separate defects.
# - Shared data already contains "Web Development 2026". Create a fresh program for each scenario and append a unique stamp. The submitted strings must still contain the ticket text ("Web Development 2026", "Web Development 2026 - Updated", or "Full-stack web development program"). Assert the exact strings the test used.
# - Track only the program this test created and delete that id.
# - The Edit Program header close control is an icon button with no accessible name. Use Cancel to dismiss. The accessibility scenario must scope axe to the dialog with .include(). Do not disable rules to hide a real violation. Use support/axeAssert.ts assertNoAxeViolations, which records violations and does not fail the job on CI.

# UI recon
# - Tool: Playwright MCP opened https://test.didaxis.studio/login. The MCP browser cannot read process.env, so login and the rest of the walk used a local Playwright script with DIDAXIS_EMAIL and DIDAXIS_PASSWORD.
# - Date: 2026-11-03
# - Base URL: https://test.didaxis.studio
# - Paths: /login (Email, Password, Sign In) → /programs
# - Locator hints:
#   - Heading: getByRole heading "Programs" level 2
#   - Create seed data with "+ New Program", Program Name, Description, button "Create"
#   - Edit control: button accessible name "Edit {program name}" on the program row (aria-label). Scope it to the row when more than one row could match.
#   - Dialog: role dialog, heading "Edit Program"
#   - Program Name: getByLabel "Program Name" — pre-filled with the current name; no maxlength
#   - Description: getByLabel "Description" — pre-filled with the current description; empty description leaves Save enabled
#   - Save: button "Save" — disabled when the name is empty or only spaces
#   - Cancel: button "Cancel"
#   - Program row: main table row; name and description are paragraphs in the first cell
#   - Rename PATCH returned 200 with message "Program updated" and the new name in data.name. The list then showed the new name without a manual reload.
#   - Description-only PATCH returned 200, data.name unchanged, data.description set to the new text.
# - Cleanup: recon programs were deleted with DELETE /api/programs/{id} (HTTP 200).
