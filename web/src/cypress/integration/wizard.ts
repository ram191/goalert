import { Chance } from 'chance'
import { testScreen } from '../support'
import users from '../fixtures/users.json'
const c = new Chance()

const keys = [
  {
    label: 'Generic API',
    value: 'generic',
  },
  {
    label: 'Grafana Webhook URL',
    value: 'grafana',
  },
  {
    label: 'Email',
    value: 'email',
  },
]

function testWizard(): void {
  describe('Wizard Page', () => {
    beforeEach(() => cy.visit('/wizard'))

    // used for setting users on regular and fts rotations
    const setUsers = (name: string): void => {
      cy.get(`input[name="${name}"]`).selectByLabel(users[0].name)
      cy.get(`input[name="${name}"]`).parent().should('contain', users[0].name)
      cy.get(`input[name="${name}"]`).selectByLabel(users[1].name)
      cy.get(`input[name="${name}"]`).parent().should('contain', users[1].name)
    }

    // used for setting primary and secondary schedule fields
    const setScheduleFields = (key: string): void => {
      // set tz
      cy.get(`input[name="${key}.timeZone"]`).selectByLabel('America/Chicago')
      cy.get(`input[name="${key}.timeZone"]`).should(
        'have.value',
        'America/Chicago',
      )

      // set users
      setUsers(`${key}.users`)

      // set never
      cy.get(`label[data-cy="${key}.rotationType.never"]`).click()
      cy.get(`label[data-cy="${key}.rotationType.never"]`)
        .find('input')
        .should('be.checked')
      cy.get(`label[data-cy="${key}.rotationType.weekly"]`)
        .find('input')
        .should('not.be.checked')
      cy.get(`label[data-cy="${key}.rotationType.daily"]`)
        .find('input')
        .should('not.be.checked')

      // set weekly
      cy.get(`label[data-cy="${key}.rotationType.weekly"]`).click()
      cy.get(`label[data-cy="${key}.rotationType.weekly"]`)
        .find('input')
        .should('be.checked')
      cy.get(`label[data-cy="${key}.rotationType.never"]`)
        .find('input')
        .should('not.be.checked')
      cy.get(`label[data-cy="${key}.rotationType.daily"]`)
        .find('input')
        .should('not.be.checked')

      // set daily
      cy.get(`label[data-cy="${key}.rotationType.daily"]`).click()
      cy.get(`label[data-cy="${key}.rotationType.daily"]`)
        .find('input')
        .should('be.checked')
      cy.get(`label[data-cy="${key}.rotationType.never"]`)
        .find('input')
        .should('not.be.checked')
      cy.get(`label[data-cy="${key}.rotationType.weekly"]`)
        .find('input')
        .should('not.be.checked')

      // set handoff time
      // todo but can use default time

      // set fts yes
      cy.get(`label[data-cy="${key}.fts.yes"]`).click()
      cy.get(`label[data-cy="${key}.fts.yes"]`)
        .find('input')
        .should('be.checked')

      // set fts users
      setUsers(`${key}.followTheSunRotation.users`)

      // set fts tz
      cy.get(
        `input[name="${key}.followTheSunRotation.timeZone"]`,
      ).selectByLabel('Asia/Kolkata')
      cy.get(`input[name="${key}.followTheSunRotation.timeZone"]`).should(
        'have.value',
        'Asia/Kolkata',
      )
    }

    it('should set all fields of wizard and submit', () => {
      // set team name
      const teamName = c.word()
      cy.get('input[name="teamName"]').type(teamName)
      cy.get('input[name="teamName"]').should('have.value', teamName)

      // set primary schedule fields
      setScheduleFields('primarySchedule')

      // set secondary schedule fields
      cy.get('label[data-cy="secondary.yes"]').click()
      setScheduleFields('secondarySchedule')

      // set ep delay
      const delay = c.integer({ min: 1, max: 9000 }).toString()
      cy.get('input[name="delayMinutes"]').type(delay)
      cy.get('input[name="delayMinutes"]').should('have.value', delay)

      // set ep repeat
      const repeat = c.integer({ min: 1, max: 5 }).toString()
      cy.get('input[name="repeat"]').type(repeat)
      cy.get('input[name="repeat"]').should('have.value', repeat)

      // set key type
      const key = c.pickone(keys)
      cy.get('input[name="key"]').selectByLabel(key.label)
      cy.get('input[name="key"]').should('have.value', key.label)

      cy.get('body').contains('button', 'Submit').click()

      cy.get('body').should('contain', 'Success')
      cy.get('body').contains('button', 'Close').click()

      cy.get('body').should('contain', teamName)
      cy.get('body').should('contain', teamName)

      const verify = (route: string, name: string): void => {
        cy.visit(route)
        cy.pageSearch(name)
        cy.get('body')
          .should('contain', name)
          .should('contain', 'Generated by Setup Wizard')
      }

      verify('/services', teamName)
      verify('/escalation-policies', teamName)
      verify('/schedules', teamName + ' Primary')
      verify('/schedules', teamName + ' Secondary')
      verify('/rotations', teamName + ' Primary America-Chicago')
      verify('/rotations', teamName + ' Secondary America-Chicago')
      verify('/rotations', teamName + ' Primary Asia-Kolkata')
      verify('/rotations', teamName + ' Secondary Asia-Kolkata')
    })

    // handles disabling rotation fields for primary/secondary schedules
    const hideRotationFields = (key: string): void => {
      setUsers(`${key}.users`)
      cy.get(`label[data-cy="${key}.rotationType.weekly"]`).click()
      cy.get(`label[data-cy="${key}.fts.yes"]`).click() // show all fields to ensure everything gets hidden

      cy.get(`label[data-cy="${key}.rotationType.never"]`).click() // select never rotating

      // assert hidden fields
      cy.get(`input[name="${key}.rotation.startDate"]`).should('not.exist') // start date
      cy.get(`input[name="${key}.fts"]`).should('not.exist') // fts yes and no buttons

      cy.get(`input[name="${key}.followTheSunRotation.users"]`).should(
        'not.exist',
      ) // fts users select
      cy.get(`input[name="${key}.followTheSunRotation.timeZone"]`).should(
        'not.exist',
      ) // fts time zone select
    }

    it('should hide rotation fields if set to never rotate (primary)', () => {
      hideRotationFields('primarySchedule')
    })

    it('should hide rotation fields if set to never rotate (secondary)', () => {
      cy.get('label[data-cy="secondary.yes"]').click()
      hideRotationFields('secondarySchedule')
    })

    it('should show follow the sun tooltip on hover', () => {
      setUsers('primarySchedule.users')
      cy.get('label[data-cy="primarySchedule.rotationType.weekly"]').click()
      cy.get('svg[data-cy="fts-tooltip"]').trigger('mouseover')
      cy.get('div[data-cy="fts-tooltip-popper"]').should('be.visible')
    })

    // handles asserting when follow the sun fields should exist for primary/secondary schedules
    const showFTSFields = (key: string): void => {
      setUsers(`${key}.users`)
      cy.get(`label[data-cy="${key}.rotationType.weekly"]`).click()
      cy.get(`label[data-cy="${key}.fts.yes"]`).click()
      cy.get(`input[name="${key}.followTheSunRotation.users"]`).should(
        'be.visible',
      ) // fts users select
      cy.get(`input[name="${key}.followTheSunRotation.timeZone"]`).should(
        'be.visible',
      ) // fts time zone select
    }

    it('should handle showing fts fields (primary)', () => {
      showFTSFields('primarySchedule')
    })

    it('should handle showing fts fields (secondary)', () => {
      cy.get('label[data-cy="secondary.yes"]').click()
      showFTSFields('secondarySchedule')
    })

    // handles asserting when follow the sun fields shouldn't exist for primary/secondary schedules
    const dontShowFTSFields = (key: string): void => {
      setUsers(`${key}.users`)
      cy.get(`label[data-cy="${key}.rotationType.weekly"]`).click()
      cy.get(`label[data-cy="${key}.fts.no"]`).click()
      cy.get(`input[name="${key}.followTheSunRotation.users"]`).should(
        'not.exist',
      ) // fts users select
      cy.get(`input[name="${key}.followTheSunRotation.timeZone"]`).should(
        'not.exist',
      ) // fts time zone select
    }

    it('should not show fts fields if not selected (primary)', () => {
      dontShowFTSFields('primarySchedule')
    })

    it('should not show fts fields if not selected (secondary)', () => {
      cy.get('label[data-cy="secondary.yes"]').click()
      dontShowFTSFields('secondarySchedule')
    })
  })
}

testScreen('Wizard', testWizard)
