Feature: DS-3 — Program name validation and duplicate prevention
  As an admin user, I want the system to prevent invalid or duplicate program names so that data integrity is maintained.

  # Happy paths

  Scenario: Accept program name with special characters
    Given I am on the program creation form
    When I enter "Informatique & IA - Niveau 2" as the program name
    And I fill other required fields
    And I click Create
    Then the program is created successfully

  Scenario: Same name with different casing is handled per product duplicate rules
    Given a program "Web Development 2026" already exists
    When I try to create a new program with the name "web development 2026"
    Then either I see an error indicating the name already exists
    Or the program is created if duplicates are case-insensitive allowed

  Scenario: Renaming a program to its current name succeeds without false duplicate error
    Given I am editing "Web Development 2026"
    When I keep the name as "Web Development 2026"
    And I update the Description
    And I click Save
    Then the save succeeds
    And I do not see a duplicate name error

  # Negative

  Scenario: Reject program name with only whitespace
    Given I am on the program creation form
    When I enter "   " as the program name
    And I click Create
    Then the form is not submitted
    And the name is trimmed and treated as empty

  Scenario: Reject duplicate program name
    Given a program "Web Development 2026" already exists
    When I try to create a new program with the same name
    Then I see an error indicating the name already exists

  Scenario: Empty program name cannot be submitted via create
    Given I am on the program creation form
    When I leave the Program Name field empty
    Then the Create button is disabled
    And the form is not submitted

  Scenario: Duplicate name on edit is rejected while editing another program
    Given a program "Web Development 2026" already exists
    And I am editing "AI Bootcamp 2026"
    When I change the name to "Web Development 2026"
    And I click Save
    Then I see an error indicating the name already exists
    And "AI Bootcamp 2026" remains in the list

  # Edge cases

  Scenario: Leading and trailing whitespace around a valid name is trimmed before duplicate check
    Given a program "Web Development 2026" already exists
    When I try to create a new program with the name "  Web Development 2026  "
    Then I see an error indicating the name already exists
    Or the form treats the trimmed name as duplicate

  Scenario: Program names with Unicode and emoji are validated consistently
    Given a program "Programme 🎓 2026" already exists
    When I try to create another program named "Programme 🎓 2026"
    Then I see an error indicating the name already exists

  Scenario: Names with only tabs or mixed whitespace are treated as empty
    Given I am on the program creation form
    When I enter only tab and space characters as the program name
    And I click Create
    Then the form is not submitted
    And the name is treated as empty after trimming

  Scenario: Maximum-length boundary name does not break duplicate detection
    Given a program exists with a name at maximum length
    When I try to create a program with the identical name
    Then I see a duplicate name error
    When I create a program with a name that differs by one character at the boundary
    Then the program is created successfully if no other validation fails

  Scenario: SQL-like characters in name do not break validation or storage
    Given I am on the program creation form
    When I enter "Test'; DROP TABLE programs;--" as the program name
    And I fill other required fields
    And I click Create
    Then the program is created successfully
    And the name is displayed literally in the list

# Ambiguities and gaps in the acceptance criteria
# - Case sensitivity: duplicate AC uses exact string; case-insensitive duplicates not specified.
# - Trim scope: whitespace-only AC implies trim; unclear if all names are trimmed on save (DS-1 tests expect trim on create).
# - Error UX: message text and field-level vs global error are unspecified.
# - Live test env GAP: duplicate and case-variant names may still be allowed despite Jira ACs.
# - Unicode normalization and homoglyphs are not addressed.
# - Description uniqueness is out of scope; only program name is specified.
