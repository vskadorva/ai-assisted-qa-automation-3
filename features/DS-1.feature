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
    And the program list shows "Full-stack web development program" on that program

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

  Scenario: Reject a duplicate program name
    Given a program "Web Development 2026" already exists
    When I try to create a new program with the same name
    And I fill in Description with "Full-stack web development program"
    And I click Create
    Then I see an error indicating the name already exists
    And the New Program dialog stays open
    And the program list still contains exactly one "Web Development 2026"

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

  Scenario: Program name longer than 100 characters is rejected
    Given I am on the program creation form
    When I enter a program name of 101 characters
    And I click Create
    Then the form is not submitted
    And I see an error indicating the name exceeds the maximum length of 100 characters
    And the New Program dialog stays open

  Scenario: Description of exactly 500 characters is accepted
    Given I am on the program creation form
    When I fill in Program Name with "Web Development 2026"
    And I enter a Description of exactly 500 characters
    And I click Create
    Then the modal closes
    And the program list shows "Web Development 2026"

  Scenario: Description longer than 500 characters is rejected
    Given I am on the program creation form
    When I fill in Program Name with "Web Development 2026"
    And I enter a Description of 501 characters
    And I click Create
    Then the form is not submitted
    And I see an error indicating the description exceeds the maximum length of 500 characters
    And the New Program dialog stays open

  Scenario: Accept a program name that contains special characters
    Given I am on the program creation form
    When I fill in Program Name with "Informatique & IA - Niveau 2"
    And I fill in Description with "Full-stack web development program"
    And I click Create
    Then the modal closes
    And the program list shows "Informatique & IA - Niveau 2"

# Ambiguities / gaps
# - Ticket AC lists the Create button. Program Setup — Overview's CRUD table says the create flow ends on "Save". Program Setup — UI Behavior and the ticket both say "Create". Scenarios follow the ticket and UI Behavior.
# - Description is optional (Program Setup — Field Definitions: not required, default empty, max 500). The ticket's success scenario fills it. The empty-description scenario covers the documented optional field. Do not require AI Generation Config fields; they are outside DS-1.
# - Empty name: ticket and Field Definitions say Create is disabled, with no error message. Whitespace-only: Validation Rules say the name is trimmed and submission is blocked, modal stays open. Assert the button stays disabled and no POST /api/programs is sent. Do not require an error string for the empty or whitespace cases.
# - Duplicate name and max lengths are not in the DS-1 acceptance criteria. They come from Program Setup — Validation Rules and Field Definitions: name unique per organization and max 100 characters; description max 500. Duplicate and over-max scenarios expect a visible error. Do not lock the assertion to one sentence.
# - Prior DS-3 recon (2026-10-26, not repeated this run) recorded that a duplicate create returned HTTP 201 with "Program created", no alert, and the dialog closed, and that Program Name has no maxlength so 101 characters left Create enabled. These scenarios still expect the documented rules. Do not mark them test.fixme.
# - Name must be unique per organization. Shared data may already contain "Web Development 2026". Specs may append a unique stamp to the ticket's example names. Assertions must use the exact string the test submitted, and that string must still contain the ticket text ("Web Development 2026" or "Informatique & IA - Niveau 2") and, when set, "Full-stack web development program".
# - Viewer read-only behavior is in the Overview and is not in DS-1. No viewer scenario.
# - Delete and semester panel are out of scope.

# UI recon
# - Skipped recon. DIDAXIS_EMAIL and DIDAXIS_PASSWORD are unset, and there is no .env file. Live login was not attempted.
# - Date: 2026-11-03
# - Base URL that would have been used: DIDAXIS_URL, otherwise https://test.didaxis.studio
# - Paths from the ticket and Program Setup docs (not observed this run): /login, then /programs
# - Locator hints from existing page objects in this repo (not confirmed against the live UI this run):
#   - Programs heading: getByRole heading "Programs" level 2
#   - New Program: button "+ New Program"
#   - Dialog heading: "New Program"
#   - Program Name: getByLabel "Program Name"
#   - Description: getByLabel "Description"
#   - Create: button "Create"
#   - Cancel: button "Cancel"
#   - Program row: main table row filtered by the program name
# - Docs: Program Setup — Overview (Confluence 233046017), Field Definitions (233078785), Validation Rules (233111553), UI Behavior (233111568)
