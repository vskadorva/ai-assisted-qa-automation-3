Feature: Dashboard — open validation
  As a signed-in user, I want to open the conflict check from the Dashboard
  so that I cannot run validation until a semester is selected.

  # Why this flow
  # Validation is the highest-value uncovered Dashboard path because it guards schedule conflicts, and no spec opens it or asserts that Re-validate stays disabled until a semester is selected.

  # Happy path

  Scenario: Choosing a program from the Dashboard unlocks the Semester field
    Given I am signed in on the Dashboard page
    When I choose "Check for conflicts"
    And I choose the first program in the Program list
    Then the path is /validation
    And the heading "Validation" is visible
    And the Program field shows that program's name
    And the Semester field is enabled
    And the Semester placeholder is "Select a semester"

  # Edge case

  Scenario: Re-validate stays disabled when the program has no semester
    Given I am signed in on the Dashboard page
    When I choose "Check for conflicts"
    Then the Semester field is disabled
    And the Semester placeholder is "Select a program first"
    And the "Re-validate" button is disabled
    And I see "No semester selected"
    When I choose the first program in the Program list
    And I open the Semester field
    Then no semester option is shown
    And the "Re-validate" button is disabled
    And I see "No semester selected"
    And I see "Select a program and semester above to run validation."

  # UI recon
  # - Tool: Playwright aria snapshot (a11y tree). No Playwright MCP server is attached in this session.
  # - Date: 2026-11-02
  # - Base URL: https://test.didaxis.studio
  # - Paths: /login → / (Dashboard) → /validation
  # - Locator hints:
  #   - Dashboard heading: heading "Dashboard" level 2. Post-login path is /.
  #   - Validation card: not a button. Paragraph "Check for conflicts" sits in a pointer div with "Check" and "Validation".
  #   - Same destination from nav button "✅ Validation" (accessible name includes the emoji).
  #   - Validation heading: heading "Validation" level 2.
  #   - Subtitle: paragraph "Check schedule for conflicts and constraint violations".
  #   - Program: textbox "Program", placeholder "Select a program". While programs load it is disabled with placeholder "Loading programs...".
  #   - Program list: listbox "Program" with option rows. Live list had 945 options. Choose the first option; do not hardcode its name.
  #   - Semester before a program: textbox "Semester" disabled, placeholder "Select a program first".
  #   - Semester after a program: enabled, placeholder "Select a semester". While semesters load it is disabled with placeholder "Loading semesters...".
  #   - Empty semester list: opening Semester shows no listbox and no option. GET /api/programs/{id}/semesters was 200 with an empty list for every program checked.
  #   - Re-validate: button "Re-validate", disabled until a semester is selected. This recon never saw it enabled and did not click it.
  #   - Empty copy: paragraphs "No semester selected" and "Select a program and semester above to run validation."
  # - Covered already: tests/ds3-program-name-validation.spec.ts, tests/programs.a11y.spec.ts, tests/programs-api-edge-cases.spec.ts (Programs page only).
  # - Not picked this run: Programs count card, Calendar card, AI Assist card, Scheduler, Export, Settings, Sign out, Quick Start text.
