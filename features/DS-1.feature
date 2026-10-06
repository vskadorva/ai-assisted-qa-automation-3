Feature: DS-1 — Create new academic program
  As an admin user, I want to create a new academic program so that I can begin designing its curriculum structure.

  # Happy paths

  Scenario: Navigate to program creation form
    Given I am logged in as admin
    When I navigate to the Programs page
    And I click "+ New Program"
    Then I see the program creation form with fields: Program Name, Description

  Scenario: Successfully create a program
    Given I am on the program creation form
    When I fill in Program Name with "Web Development 2026"
    And I fill in Description with "Full-stack web development program"
    And I click Create
    Then the modal closes
    And the program list shows "Web Development 2026"

  Scenario: Program can be created with description left empty
    Given I am on the program creation form
    When I fill in Program Name with "Data Science Fundamentals"
    And I leave Description empty
    And I click Create
    Then the modal closes
    And the program list shows "Data Science Fundamentals"

  # Negative

  Scenario: Validation prevents empty program name
    Given I am on the program creation form
    When I leave the Program Name field empty
    Then the Create button is disabled

  Scenario: Program is not created when user cancels the form
    Given I am on the program creation form
    When I fill in Program Name with "Temporary Draft Program"
    And I click Cancel
    Then the modal closes
    And the program list does not show "Temporary Draft Program"

  Scenario: Non-admin user cannot access program creation
    Given I am logged in as a non-admin user
    When I navigate to the Programs page
    Then I do not see "+ New Program"
    Or I see an access denied message when attempting to create a program

  # Edge cases

  Scenario: Whitespace-only program name is treated as empty
    Given I am on the program creation form
    When I enter "   " as the program name
    Then the Create button is disabled

  Scenario: Description accepts long text and special characters
    Given I am on the program creation form
    When I fill in Program Name with "Cybersecurity 2026"
    And I fill in Description with "Covers OWASP Top 10, TLS 1.3, & \"secure by design\" — 100% hands-on."
    And I click Create
    Then the modal closes
    And the program list shows "Cybersecurity 2026"

  Scenario: Leading and trailing spaces in Program Name are trimmed on save
    Given I am on the program creation form
    When I fill in Program Name with "  Mobile Apps 2026  "
    And I fill in Description with "iOS and Android track"
    And I click Create
    Then the modal closes
    And the program list shows "Mobile Apps 2026" without leading or trailing spaces

  Scenario: Very long program names are accepted when no maxlength is enforced
    Given I am on the program creation form
    When I fill in Program Name with a string longer than 255 characters
    And I click Create
    Then the modal closes
    And the program list includes the program with the full name

  Scenario: AI Generation Config can be expanded without blocking create
    Given I am on the program creation form
    When I expand the AI Generation Config section
    And I fill in Program Name with "Cloud Engineering 2026"
    And I click Create
    Then the modal closes
    And the program list shows "Cloud Engineering 2026"

# Ambiguities and gaps in the acceptance criteria
# - Description requiredness: Jira happy path always fills Description; live UI allows empty Description (optional).
# - Dismiss controls: Cancel closes the modal; Escape may not dismiss on test env; no header close control observed.
# - Duplicate program names: Not specified in DS-1 (see DS-3); test env may allow duplicates and case variants.
# - Max length: Not in DS-1 ACs; test env may accept 300+ character names with no validation message.
# - Permissions: Only admin is specified; non-admin behavior requires separate test credentials.
# - Post-create feedback: No success toast specified; list update is the primary observable outcome.
# - AI Generation Config: Present in UI but not mentioned in Jira acceptance criteria.
