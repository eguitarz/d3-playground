import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';

moduleForComponent('calendar-view', 'Integration | Component | calendar view', {
  integration: true
});

test('it renders', function(assert) {
  this.render(hbs`{{calendar-view}}`);
  assert.equal(this.$().text().trim(), 'Calendar View');
});
