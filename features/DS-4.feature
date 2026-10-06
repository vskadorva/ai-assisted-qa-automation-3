Feature: DS-4 — Delete program with confirmation
  As an admin user, I want to delete a program I no longer need, with a confirmation step to prevent accidental deletion.

  # Happy paths

  Scenario: Delete program with confirmation
    Given a program "Test Program" exists
    When I click the delete icon for "Test Program"
    Then I see a confirmation dialog
    When I confirm deletion
    Then "Test Program" is removed from the program list

  Scenario: Confirmation dialog shows context for the program being deleted
    Given a program "Test Program" exists
    When I click the delete icon for "Test Program"
    Then I see a confirmation dialog
    And the dialog references "Test Program" or warns that deletion is permanent

  # Negative

  Scenario: Cancel program deletion
    Given I click the delete icon for a program
    When I see the confirmation dialog
    And I click Cancel
    Then the program still exists in the list

  Scenario: Dismissing confirmation without confirming keeps the program
    Given I opened the delete confirmation for "Test Program"
    When I dismiss the dialog without confirming
    Then "Test Program" still exists in the list

  Scenario: Non-admin cannot delete programs
    Given I am logged in as a non-admin user
    And a program "Test Program" exists
    When I navigate to the Programs page
    Then I do not see delete actions
    Or delete attempts are rejected with an access denied message

  Scenario: Program is not deleted without explicit confirmation
    Given a program "Test Program" exists
    When I click the delete icon for "Test Program"
    And I do not confirm deletion
    Then "Test Program" remains in the program list

  # Edge cases

  Scenario: Deleting the only program shows empty state
    Given only the program "Test Program" exists
    When I confirm deletion of "Test Program"
    Then "Test Program" is removed from the program list
    And I see the empty state for programs per DS-5

  Scenario: Delete program with special characters in name works end-to-end
    Given a program "Informatique & IA - Niveau 2" exists
    When I click the delete icon for "Informatique & IA - Niveau 2"
    And I confirm deletion
    Then "Informatique & IA - Niveau 2" is removed from the program list

  Scenario: Double confirm or rapid confirm does not cause errors
    Given a program "Test Program" exists
    When I confirm deletion twice in quick succession
    Then "Test Program" is removed once
    And I do not see a server error or duplicate delete failure

  Scenario: Save after another admin deleted the program shows a graceful error
    Given admin B deletes "Test Program" while admin A has it open for edit
    When admin A clicks Save
    Then admin A sees an error that the program no longer exists
    And no orphaned data is recreated in the list

  Scenario: Keyboard accessibility for confirmation dialog
    Given the delete confirmation dialog is open
    When I activate Cancel using the keyboard
    Then the program is not deleted
    When I open delete again and confirm using the keyboard
    Then the program is removed from the list

# Ambiguities and gaps in the acceptance criteria
# - Live UI uses a native browser confirm, not an in-app modal with a Cancel button; message warns semesters and courses are removed.
# - Soft vs hard delete and cascade to semesters/courses are not defined in Jira ACs.
# - Confirm button label and destructive styling are unspecified for native confirm.
# - Undo snackbar after delete is not mentioned.
# - Failed delete / list refresh error handling is not covered.
# - Permissions assume admin; non-admin credentials may be required to automate RBAC cases.
