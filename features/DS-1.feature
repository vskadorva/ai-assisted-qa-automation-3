Feature: DS-1 — Create new academic program
  As an admin user, I want to create a new academic program
  so that I can begin designing its curriculum structure.

  # Happy paths

  Scenario: Navigate to program creation form
    Given I am logged in as admin
    When I navigate to the Programs page
    And I click "+ New Program"
    Then I see the "New Program" dialog
    And I see a "Program Name" field
    And I see a "Description" field

  Scenario: Successfully create a program
    Given I am on the program creation form
    When I fill in Program Name with "Web Development 2026"
    And I fill in Description with "Full-stack web development program"
    And I click Create
    Then the modal closes
    And the program list shows "Web Development 2026"
    And that row shows "Full-stack web development program"

  Scenario: Create a program when Description is left empty
    Given I am on the program creation form
    When I fill in Program Name with "Web Development 2026"
    And I leave Description empty
    And I click Create
    Then the modal closes
    And the program list shows "Web Development 2026"

  # Negative

  Scenario: Validation prevents empty program name
    Given I am on the program creation form
    When I leave the Program Name field empty
    Then the Create button is disabled
    And no program is created

  Scenario: Description without a program name does not enable Create
    Given I am on the program creation form
    When I leave the Program Name field empty
    And I fill in Description with "Full-stack web development program"
    Then the Create button is disabled
    And no program is created

  Scenario: Cancel does not create a program
    Given I am on the program creation form
    When I fill in Program Name with "Web Development 2026"
    And I fill in Description with "Full-stack web development program"
    And I click Cancel
    Then the modal closes
    And the program list does not show a program created by this attempt

  # Edge cases

  Scenario: Program name of only spaces is not submitted
    Given I am on the program creation form
    When I enter "   " as the program name
    And I click Create
    Then the form is not submitted
    And the Create button stays disabled
    And the New Program dialog stays open

  Scenario: Program name of exactly 100 characters is accepted
    Given I am on the program creation form
    When I enter a program name of exactly 100 characters
    And I fill in Description with "Full-stack web development program"
    And I click Create
    Then the modal closes
    And that 100-character name appears in the program list

  Scenario: Accept a program name that contains special characters
    Given I am on the program creation form
    When I fill in Program Name with "Informatique & IA - Niveau 2"
    And I fill in Description with "Full-stack web development program"
    And I click Create
    Then the modal closes
    And the program list shows "Informatique & IA - Niveau 2"

# Ambiguities / gaps
# - Description is optional on the live form. The success AC fills it. The empty-description scenario records the observed behavior. Do not require AI Generation Config fields.
# - Empty and whitespace-only names keep Create disabled. No alert is shown. Assert the button stays disabled and no POST /api/programs is sent.
# - The dialog closes after the create response, not in the same instant. Wait with a retrying visibility assertion.
# - Duplicate names and a 100-character maximum are not in the DS-1 acceptance criteria. Live UI on 2026-11-03 accepted a second program with the same name (HTTP 201, dialog closed, no alert) and accepted a 101-character name (HTTP 201, no alert). Do not assert rejection for those cases in this plan. DS-3 owns duplicate and max-length rules.
# - Shared data already contains "Web Development 2026". Append a unique stamp to example names. Assertions must use the exact string submitted, and that string must still contain the ticket text ("Web Development 2026" or "Informatique & IA - Niveau 2") and, when set, "Full-stack web development program".
# - Track the created program id and delete only that id. The New Program dialog already has an axe scan in tests/programs.a11y.spec.ts. Do not add another scan here.
# - The dialog header close control is an icon button with no accessible name. Use Cancel to dismiss.

# UI recon
# - Tool: Playwright MCP opened https://test.didaxis.studio/login. The MCP browser cannot read process.env, so login and the rest of the walk used a local Playwright script with DIDAXIS_EMAIL and DIDAXIS_PASSWORD.
# - Date: 2026-11-03
# - Base URL: https://test.didaxis.studio
# - Paths: /login (Email, Password, Sign In) → /programs
# - Locator hints:
#   - Heading: getByRole heading "Programs" level 2
#   - Subtitle text: "Manage academic programs and semesters"
#   - New Program: button "+ New Program"
#   - Dialog: role dialog, heading "New Program"
#   - Program Name: getByLabel "Program Name" (placeholder "e.g. Computer Science BSc", no maxlength)
#   - Description: getByLabel "Description" (placeholder "Brief description", no maxlength, not required)
#   - Create: button "Create" — disabled when the name is empty or only spaces; enabled when the name is non-blank, including when Description is empty
#   - Cancel: button "Cancel"
#   - Program row: main table row; name and description are paragraphs in the first cell
#   - Edit control on the row: button accessible name "Edit {program name}"
# - Cleanup: recon programs were deleted with DELETE /api/programs/{id} (HTTP 200).
