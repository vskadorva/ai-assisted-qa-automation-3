Feature: DS-2 — Edit existing program details
  As an admin user, I want to edit an existing program's details so that I can correct or update program information after creation.

  # Happy paths

  Scenario: Open program for editing
    Given I am on the Programs page
    And a program "Web Development 2026" exists
    When I click the edit icon on "Web Development 2026"
    Then I see the edit form pre-populated with the program's current data

  Scenario: Successfully edit a program name
    Given I am editing "Web Development 2026"
    When I change the Name to "Web Development 2026 - Updated"
    And I click Save
    Then the modal closes
    And the program list immediately shows "Web Development 2026 - Updated"

  Scenario: Edit preserves unchanged fields
    Given I am editing a program
    When I only change the Description
    And I click Save
    Then the Name and other fields remain unchanged

  Scenario: Both name and description can be updated in a single save
    Given I am editing "UX Design 2026"
    When I change the Name to "UX/UI Design 2026"
    And I change the Description to "Research, wireframes, and usability testing"
    And I click Save
    Then the modal closes
    And the program list shows "UX/UI Design 2026" with the updated description

  # Negative

  Scenario: Empty program name prevents save on edit
    Given I am editing "Web Development 2026"
    When I clear the Name field
    Then the Save button is disabled
    Or I see a validation error and the program is not updated

  Scenario: Canceling edit discards unsaved changes
    Given I am editing "Web Development 2026"
    When I change the Name to "Should Not Persist"
    And I cancel the edit form
    Then the modal closes
    And the program list still shows "Web Development 2026"

  Scenario: Duplicate program name on edit is rejected
    Given I am editing "Data Science 2026"
    And a program "Web Development 2026" already exists
    When I change the Name to "Web Development 2026"
    And I click Save
    Then I see an error indicating the name already exists
    And the program list still shows "Data Science 2026"

  Scenario: Non-admin cannot edit programs
    Given I am logged in as a non-admin user
    When I navigate to the Programs page
    Then I do not see edit actions on programs
    Or edit attempts are denied with an appropriate message

  # Edge cases

  Scenario: Whitespace-only name on edit is treated as empty
    Given I am editing "Web Development 2026"
    When I change the Name to "   "
    And I click Save
    Then the form is not submitted
    And the program list still shows "Web Development 2026"

  Scenario: Special characters in edited name are accepted
    Given I am editing "Informatique Base"
    When I change the Name to "Informatique & IA - Niveau 2"
    And I click Save
    Then the modal closes
    And the program list shows "Informatique & IA - Niveau 2"

  Scenario: Concurrent edit last save wins or conflict is surfaced
    Given two admins edit the same program concurrently
    When both attempt to save different descriptions
    Then the system either applies the last successful save
    Or shows a conflict message and prevents silent data loss

  Scenario: Maximum-length name on edit behaves like create validation
    Given I am editing a program
    When I change the Name to exceed the maximum allowed length
    And I click Save
    Then the program is not updated
    And I see a validation message for Name

# Ambiguities and gaps in the acceptance criteria
# - Field labels: AC uses "Name" on edit vs "Program Name" on create; live UI uses Program Name in the Edit Program dialog.
# - Save disabled vs error-on-click when name is empty is not specified in Jira ACs.
# - Duplicate names on edit are not in DS-2 ACs but align with DS-3; test env may still allow duplicates (GAP vs Jira).
# - "Immediately" in the list does not define optimistic UI vs refetch.
# - AI Generation Config exists on edit form but is not mentioned in ACs.
# - Permissions: edit flows assume admin like DS-1.
