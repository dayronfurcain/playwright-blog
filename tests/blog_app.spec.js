const { test, expect, beforeEach, describe } = require('@playwright/test')

const { loginWith, createBlog } = require('./helpers')

describe('Blog app', () => {
  beforeEach(async ({ page, request }) => {
    await request.post('/api/testing/reset')
    const response = await request.post('/api/users', {
      data: {
        name: 'Dayron Furcain',
        password: 'furcain',
        username: 'dayron'
      }
    })

    await page.goto('')
  })

  test('Login form is shown', async ({ page }) => {
    await expect(page.getByText('Log in to application')).toBeVisible()
  })

  describe('Login', () => {
    test('succeeds with correct credentials', async ({ page }) => {
      await loginWith(page, 'dayron', 'furcain')
      await expect(page.getByText('Dayron Furcain logged in')).toBeVisible()
    })

    test('fails with wrong credentials', async ({ page }) => {
      await loginWith(page, 'dayron', 'hernandez')
      const divError = page.locator('.error')

      await expect(divError).toContainText('invalid username or password')

      await expect(page.getByText('Dayron Furcain logged in')).not.toBeVisible()
    })

    describe('When logged in', () => {
      beforeEach(async ({ page }) => {
        await loginWith(page, 'dayron', 'furcain')
      })

      test('a new blog can be created', async ({ page }) => {
        await page.getByRole('button', { name: 'new note' }).click()
        await createBlog(
          page,
          'Blog 1',
          'Martin Hernandez',
          'http://blog_1.com'
        )

        const article = page.locator('article')
        await expect(article).toContainText('Blog 1 Martin Hernandez')
      })

      describe('Then to create a blog', () => {
        beforeEach(async ({ page }) => {
          await page.getByRole('button', { name: 'new note' }).click()
          await createBlog(
            page,
            'Blog 1',
            'Martin Hernandez',
            'http://blog_1.com'
          )
        })

        test('blog can be updated', async ({ page }) => {
          await page.getByRole('button', { name: 'view' }).click()
          await page.getByRole('button', { name: 'likes' }).click()
          await page.getByText('likes 1').waitFor()
          await page.getByRole('button', { name: 'likes' }).click()
          await page.getByText('likes 2').waitFor()
          await page.getByRole('button', { name: 'likes' }).click()
          await page.getByText('likes 3').waitFor()
        })

        test('blog can be removed', async ({ page }) => {
          await page.getByRole('button', { name: 'view' }).click()

          page.on('dialog', async (dialog) => {
            expect(dialog.message()).toContain(
              'Remove blog Blog 1 by Martin Hernandez'
            )
            await dialog.accept()
          })

          await page.getByRole('button', { name: 'remove' }).click()

          const article = page.locator('article')
          await expect(article).not.toBeVisible()
        })

        test('creator can see remove button', async ({ page }) => {
          await page.getByRole('button', { name: 'view' }).click()
          await expect(
            page.getByRole('button', { name: 'remove' })
          ).toBeVisible()
        })

        test.only('the blogs are organized by likes', async ({ page }) => {
          await page.getByRole('button', { name: 'view' }).click()
          await page.getByRole('button', { name: 'likes' }).click()
          await page.getByText('likes 1').waitFor()
          await page.getByRole('button', { name: 'likes' }).click()
          await page.getByText('likes 2').waitFor()
          await page.getByRole('button', { name: 'likes' }).click()
          await page.getByText('likes 3').waitFor()

          await createBlog(
            page,
            'Blog 3',
            'Martin Hernandez',
            'http://blog_3.com'
          )

          await page
            .getByRole('article')
            .getByText('Blog 3 Martin Hernandez')
            .waitFor()

          const articles = await page.locator('article').all()
          await expect(articles[0].getByText('likes 3')).toBeVisible()
        })
      })
    })
  })
})
