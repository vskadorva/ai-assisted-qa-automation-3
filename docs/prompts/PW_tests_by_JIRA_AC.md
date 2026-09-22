You are a senior QA automation engineer. Based on the acceptance criteria below,write Playwright tests for the "Create New Academic Program" feature.
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

Scenario: Validation prevents empty program name
  Given I am on the program creation form
  When I leave the Program Name field empty
  Then the Create button is disabled
- Write one test per acceptance criterion
- Use descriptive test names that describe behavior, not actions
(e.g., "should show error when program name is empty" not "test empty name")
- Use role-based Playwright locators (getByRole, getByLabel, getByText)
— no CSS selectors
- Each test should be independent — no shared state between tests
- Add a comment at the top: // Jira: DS-1 — Create new academic program
- Use unique test data with Date.now() suffix to avoid collisions
- Do NOT use page.waitForTimeout() — use web-first assertions instead
- Return the complete .spec.ts file
- After the code, list any assumptions you made about the UI