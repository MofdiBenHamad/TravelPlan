import { validateEmailStrict } from '../src/lib/emailValidator.js'

async function runTests() {
  const testCases = [
    { email: 'mofdibenhamed79@gmail.com', shouldBeValid: true },
    { email: 'ahmed@email.com', shouldBeValid: true },
    { email: 'admin@travelplan.tn', shouldBeValid: true },
    { email: 'invalid-email-without-at', shouldBeValid: false },
    { email: 'user@', shouldBeValid: false },
    { email: 'user@fakedomainnotexists123456789.xyz', shouldBeValid: false },
    { email: 'user@gmail..com', shouldBeValid: false },
    { email: 'user@gnail.cmo', shouldBeValid: false },
    { email: 'user@subdomain.nonexistent123domain.net', shouldBeValid: false },
  ]

  console.log('🧪 Testing validateEmailStrict...\n')
  for (const tc of testCases) {
    const result = await validateEmailStrict(tc.email)
    const passed = result.isValid === tc.shouldBeValid
    console.log(
      `${passed ? '✅' : '❌'} Email: "${tc.email}" -> isValid: ${result.isValid} ${result.error ? `(Error: ${result.error})` : ''}`
    )
    if (!passed) {
      throw new Error(`Test failed for ${tc.email}`)
    }
  }
  console.log('\n🎉 All email validation tests passed!')
}

runTests().catch(console.error)
