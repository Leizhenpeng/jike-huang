import { describe, expect, it } from 'vitest'

import { toCamelCase } from '../src/utils'

describe('util', () => {
  it('should return true', () => {
    expect(true).toBe(true)
    expect(toCamelCase('ORIGINAL_POST')).toBe('originalPost')
    expect(toCamelCase('REPOST')).toBe('repost')
  })
})
