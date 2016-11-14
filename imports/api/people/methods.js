import { Meteor } from 'meteor/meteor';
import { ValidatedMethod } from 'meteor/mdg:validated-method';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';
import { DDPRateLimiter } from 'meteor/ddp-rate-limiter';
import { _ } from 'meteor/underscore';

import { People } from './people.js';
import { Relationships } from '../relationships/relationships.js';

export const insert = new ValidatedMethod({
  name: 'person.insert',
  validate: new SimpleSchema({
    person: { type: Object },
    'person.firstname': { type: String },
    'person.lastname': { type: String },
  }).validator(),
  run({ person }) {
    if (Meteor.userId()) {
      const exists = People.findOne({ firstname: person.firstname, lastname: person.lastname });
      if (!exists) {
        const newperson = person;
        newperson.addedBy = Meteor.userId();
        const addedperson = People.insert(newperson);
        return addedperson._id;
      }
      return exists._id;
    }
    return false;
  },
});

export const remove = new ValidatedMethod({
  name: 'people.remove',
  validate: new SimpleSchema({
    personId: { type: String },
  }).validator(),
  run({ personId }) {
    const person = People.findOne(personId);
    if (Meteor.userId) {
      Relationships.remove({ people: person._id });
      People.remove(personId);
    }
  },
});


const POEPLE_METHODS = _.pluck([
  insert,
  remove,
], 'name');

if (Meteor.isServer) {
  DDPRateLimiter.addRule({
    name(name) {
      return _.contains(POEPLE_METHODS, name);
    },
    coonnectionId() { return true; },
  }, 5, 1000);
}
