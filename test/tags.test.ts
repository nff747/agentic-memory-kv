import { describe, it, expect } from 'vitest';
import { TagIndex } from '../src/tags';

describe('TagIndex', () => {
  it('indexes keys by multiple tags and performs intersection queries', () => {
    const index = new TagIndex();
    index.tag('mem_1', ['session:100', 'role:user', 'topic:billing']);
    index.tag('mem_2', ['session:100', 'role:agent', 'topic:billing']);
    index.tag('mem_3', ['session:200', 'role:user']);

    expect(index.getKeysByTag('topic:billing')).toEqual(['mem_1', 'mem_2']);
    expect(index.getKeysByAllTags(['session:100', 'role:user'])).toEqual(['mem_1']);
  });

  it('removes keys cleanly and updates tag sets', () => {
    const index = new TagIndex();
    index.tag('mem_del', ['t1']);
    expect(index.getKeysByTag('t1')).toEqual(['mem_del']);
    index.removeKey('mem_del');
    expect(index.getKeysByTag('t1')).toEqual([]);
  });
});
