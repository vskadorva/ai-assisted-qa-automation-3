Feature: DS-5 — Program list filtering and display
  As an admin user, I want to see all programs in a clear list so that I can quickly find and manage them.

  # Happy paths

  Scenario: Display program list with key details
    Given programs exist in the system
    When I navigate to the Programs page
    Then I see a list showing each program's name and description

  Scenario: Empty state when no programs exist
    Given no programs exist
    When I navigate to the Programs page
    Then I see a message indicating no programs have been created
    And I see a prompt to create the first program

  Scenario: Newly created program appears in the list without manual refresh
    Given I am on the Programs page
    When I create a program "Mobile Apps 2026" with description "iOS and Android"
    Then the list shows "Mobile Apps 2026" with description "iOS and Android"

  Scenario: List reflects edits and deletions from other flows
    Given I am on the Programs page
    And a program "Web Development 2026" exists
    When the program is renamed to "Web Development 2026 - Updated"
    Then the program list shows "Web Development 2026 - Updated"
    When the program "Web Development 2026 - Updated" is deleted
    Then the program list does not show "Web Development 2026 - Updated"

  # Negative

  Scenario: Programs page does not show programs the user is not authorized to view
    Given programs exist that my role cannot access
    When I navigate to the Programs page
    Then I do not see unauthorized programs
    Or I see an access denied state instead of partial data

  Scenario: Failed load shows error state instead of misleading empty state
    Given the programs API fails to load
    When I navigate to the Programs page
    Then I see an error message with retry option
    And I do not see the "no programs created" empty state

  # Edge cases

  Scenario: Long program names and descriptions display without breaking layout
    Given a program with a very long name and description exists
    When I navigate to the Programs page
    Then the name and description are readable
    And the list layout remains usable

  Scenario: Programs with empty description still show name clearly
    Given a program "DevOps 2026" exists with an empty description
    When I navigate to the Programs page
    Then I see "DevOps 2026" in the list
    And the description area shows blank, em dash, or "No description" per design

  Scenario: Special characters in list display match stored values
    Given a program "Informatique & IA - Niveau 2" exists
    When I navigate to the Programs page
    Then I see the name and description rendered correctly without HTML injection

  Scenario: Large number of programs remains usable via scroll or pagination
    Given many programs exist in the system
    When I navigate to the Programs page
    Then I can view all programs via scrolling or pagination
    And each visible row shows name and description

  Scenario: Filter by name substring when search is available
    Given multiple programs exist including "Web Development 2026" and "Data Science 2026"
    When I filter the program list by "Web"
    Then I see only programs whose names contain "Web"
    And I do not see "Data Science 2026"

  Scenario: Filter with no matches shows appropriate empty search state
    Given programs exist in the system
    When I filter the program list by "ZZZ_NONEXISTENT_123"
    Then I see a message that no programs match the filter
    When I clear the filter
    Then I see the full program list again

  Scenario: Sort order is consistent across page loads
    Given programs "Alpha Track", "Beta Track", and "Gamma Track" exist
    When I navigate to the Programs page
    Then programs appear in a consistent documented order
    When I refresh the Programs page
    Then programs appear in the same order as before

# Ambiguities and gaps in the acceptance criteria
# - Filtering: Ticket title mentions filtering; Jira ACs only cover full list and empty state—search/filter/sort may not be implemented.
# - List layout: Table vs cards vs responsive behavior not defined (test env uses a table with a Program column).
# - Actions on list: Edit/delete controls relate to DS-2/DS-4 but are not in DS-5 ACs.
# - Empty state CTA: "Prompt to create the first program" does not specify exact copy or control type (+ New Program vs link).
# - Description optional: Display rules for missing description not in ACs.
# - Pagination: No AC for many programs or performance expectations.
# - Non-admin view: Whether read-only list differs from admin list is unclear.
# - Error vs empty: API failure UI is unspecified in Jira ACs.
