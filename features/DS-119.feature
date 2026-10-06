Feature: DS-119 — Dasha: Dashboard displaying the right components
  As an admin user, I want to see the correct dashboard so that I can reach key areas of Didaxis Studio quickly.

  # Happy paths

  Scenario: Navigate to the Dashboard
    Given I am logged in as admin
    When I navigate to the Dashboard page
    Then I see the Dashboard with the right blocks: Programs, Calendar, Validation, AI Assist

  Scenario: Successfully navigate to Program Page
    Given I am on the Dashboard
    When I click on Programs card
    Then I navigate to the Programs page

  Scenario: Successfully navigate to Calendar Page
    Given I am on the Dashboard
    When I click on Calendar card
    Then I navigate to the Calendar page

  Scenario: Successfully navigate to Validation Page
    Given I am on the Dashboard
    When I click on Validation card
    Then I navigate to the Validation page

  Scenario: Successfully navigate to AI Assist Page
    Given I am on the Dashboard
    When I click on AI Assist card
    Then I navigate to the AI Assist page

  Scenario: Dashboard shows welcome context for signed-in admin
    Given I am logged in as admin
    When I navigate to the Dashboard page
    Then I see the heading "Dashboard"
    And I see welcome copy for Didaxis Studio
    And I see a Connected status indicator

  Scenario: Programs card shows program count
    Given I am logged in as admin
    And programs exist in the system
    When I navigate to the Dashboard page
    Then the Programs card displays a numeric program count

  # Negative

  Scenario: Unauthenticated user cannot view the Dashboard
    Given I am not logged in
    When I open the Dashboard page
    Then I am redirected to the sign-in page
    And I do not see the Programs, Calendar, Validation, or AI Assist cards

  Scenario: Dashboard does not show modules outside the four primary cards
    Given I am logged in as admin
    When I navigate to the Dashboard page
    Then I see cards for Programs, Calendar, Validation, and AI Assist
    And I do not see Scheduler or Export as primary dashboard cards

  # Edge cases

  Scenario: Sidebar Dashboard navigation returns to the same dashboard view
    Given I am logged in as admin
    When I navigate to the Programs page
    And I click Dashboard in the sidebar
    Then I navigate to the Dashboard page
    And I see the Dashboard with the right blocks: Programs, Calendar, Validation, AI Assist

  Scenario: Browser back from a card destination returns to the Dashboard
    Given I am on the Dashboard
    When I click on Calendar card
    And I navigate back in the browser
    Then I navigate to the Dashboard page

  Scenario: Quick Start guidance is visible without blocking card navigation
    Given I am logged in as admin
    When I navigate to the Dashboard page
    Then I see Quick Start steps on the Dashboard
    When I click on Programs card
    Then I navigate to the Programs page

# Ambiguities and gaps in the acceptance criteria
# - Jira AC typo: preconditions say "Dashboardx" instead of "Dashboard".
# - Route: AC says "Dashboard page"; live app uses route `/` with sidebar label Dashboard.
# - AI Assist destination: card navigates to `/cli` with heading "AI Assist" (not a `/ai-assist` path).
# - Programs card count: UI shows a live count (e.g. 6457); AC does not require count accuracy vs backend.
# - Quick Start steps 1–5, Connected badge, and welcome copy are on live UI but not in Jira ACs.
# - Non-admin dashboard: only admin is specified; other roles may see the same shell via sidebar.
# - Scheduler, Export, and Settings exist in the app shell but are not listed as dashboard blocks in DS-119.
