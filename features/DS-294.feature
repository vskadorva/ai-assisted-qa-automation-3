Feature: DS-294 — Program list filtering and display
  As an admin user, I want to see all programs in a clear list
  so that I can quickly find and manage them.

  # Happy paths

  Scenario: Display program list with key details
    Given a program "Data Science Fundamentals" with description "Intro to statistics and Python" exists
    When I navigate to the Programs page
    Then the Programs table shows a row for "Data Science Fundamentals"
    And that row shows the description "Intro to statistics and Python"

  Scenario: Each program in the list shows its own name and description
    Given a program "Cloud Computing Basics" with description "AWS and Azure foundations" exists
    And a program "Cybersecurity Essentials" with description "Network defence and threat modelling" exists
    When I navigate to the Programs page
    Then the "Cloud Computing Basics" row shows "AWS and Azure foundations"
    And the "Cybersecurity Essentials" row shows "Network defence and threat modelling"

  Scenario: Empty state when no programs exist
    Given no programs exist
    When I navigate to the Programs page
    Then I see "No programs yet. Create your first program to get started."
    And I see a "Create Program" button prompting me to create the first program

  Scenario: The empty-state prompt opens the New Program form
    Given no programs exist
    And I am on the Programs page
    When I click "Create Program"
    Then the New Program dialog opens

  # Negative

  Scenario: Empty state is not shown when programs exist
    Given a program "Data Science Fundamentals" with description "Intro to statistics and Python" exists
    When I navigate to the Programs page
    Then I do not see "No programs yet. Create your first program to get started."
    And I do not see the "Create Program" empty-state button

  Scenario: Programs table is not shown when no programs exist
    Given no programs exist
    When I navigate to the Programs page
    Then no Programs table is shown

  # Edge cases

  Scenario: Program without a description lists its name only
    Given a program "Machine Learning Lab" with no description exists
    When I navigate to the Programs page
    Then the Programs table shows a row for "Machine Learning Lab"

  Scenario: Special characters in name and description display as entered
    Given a program "Informatique & IA - Niveau 2" with description "Cours « avancé » : réseaux / sécurité" exists
    When I navigate to the Programs page
    Then the "Informatique & IA - Niveau 2" row shows "Cours « avancé » : réseaux / sécurité"

# Ambiguities / gaps
# - The title says "filtering", but no acceptance criterion describes a filter or search. The live page has no filter or search control. This plan covers display only.
# - "Clear list" and "quickly find" are not measurable. Assert the name and description per row only.
# - Columns are not specified. The live table has one "Program" column (name, description underneath in the same cell) and an unlabeled actions column (Edit / Delete). Assert name and description inside the row, not a dedicated Description column.
# - "No programs exist" cannot be reached safely on the shared test org (about 3,200 programs at recon time, owned by other tests). Empty-state scenarios mock GET /api/programs with `{ data: [] }` instead of deleting data.
# - The test org list is very large. Seeded names need a unique stamp so leftover rows do not collide; keep the ticket values as the readable prefix.
# - Empty-state copy wording is not in the ticket. Use the live copy observed during recon.

# UI recon
# - Tool: Playwright (chromium) via a local script using DIDAXIS_EMAIL / DIDAXIS_PASSWORD. Playwright MCP was not used in this headless CI run.
# - Date: 2026-11-06
# - Base URL: https://test.didaxis.studio
# - Paths: /login (Email, Password, Sign In) → / → /programs
# - Locator hints:
#   - Page heading: heading "Programs" level 2 (live copy). The existing POM `pageHeading` targets "Programmes" — ticket-vs-UI copy drift.
#   - Subtitle: "Manage academic programs and semesters"
#   - New Program: button "+ New Program"
#   - Table: main → table; column headers "Program" and an empty actions header
#   - Row: row containing the name; cell 1 holds the name paragraph and, when set, a description paragraph; cell 2 holds buttons "Edit {name}" and "Delete {name}"
#   - Empty state (GET /api/programs → `{ data: [] }`): paragraph "No programs yet. Create your first program to get started." and button "Create Program". No table is rendered. The existing POM `emptyStateCreateButton` targets "Create Programme" — copy drift.
#   - Clicking "Create Program" opens the dialog with heading "New Program"
# - Recon created and deleted no data; empty state was observed via route mock.
