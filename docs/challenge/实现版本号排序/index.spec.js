const compareVersions = require('./index')

describe('main', () => {
  it('happy path', () => {
    const versions = ['0.1.1', '2.3.3', '0.302.1', '4.2', '4.3.5', '4.3.4.5']
    expect(compareVersions(versions)).toStrictEqual([
      '0.1.1',
      '0.302.1',
      '2.3.3',
      '4.2',
      '4.3.4.5',
      '4.3.5'
    ])
  })
})
