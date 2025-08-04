/**
 * Basic test to verify Jest configuration is working
 */
describe('Jest Configuration', () => {
  it('should be able to run basic tests', () => {
    expect(1 + 1).toBe(2)
  })

  it('should have access to environment variables', () => {
    expect(process.env.NODE_ENV).toBe('test')
  })

  it('should be able to import TypeScript modules', () => {
    const testFunction = (x: number): number => x * 2
    expect(testFunction(5)).toBe(10)
  })
})