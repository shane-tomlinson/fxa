/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import AvatarMixin from '../mixins/avatar-mixin';
import Cocktail from 'cocktail';
import DisableFormMixin from '../mixins/disable-form-mixin';
import FormView from '../form';
import SettingsPanelMixin from '../mixins/settings-panel-mixin';
import Template from 'templates/settings/display_name.mustache';
// eslint-disable-next-line
import React from 'react';
import ReactDOM from 'react-dom';

const t = msg => msg;

function InputComponent () {
  return (
    <input name="display_name" type="text" placeholder="Display name" />
  );
}
function DisplayNameComponent() {
  return (
    <div>
      This is a react rendered display name
      <InputComponent />
    </div>
  );
}

const View = FormView.extend({
  template: Template,
  className: 'display-name',
  viewName: 'settings.display-name',

  onProfileUpdate () {
    this.render();
  },

  setInitialContext (context) {
    context.set('displayName', this._displayName);
  },

  beforeRender () {
    var account = this.getSignedInAccount();
    return account.fetchProfile()
      .then(() => {
        this.user.setAccount(account);
        this._displayName = account.get('displayName');
      });
  },

  afterVisible () {
    ReactDOM.render(
      <DisplayNameComponent />,
      this.$el.get(0)
    );
  },

  isValidStart () {
    // if no display name set then we still do not want to activate the change button
    var accountDisplayName = this.getSignedInAccount().get('displayName') || '';
    var displayName = this.getElementValue('input.display-name').trim();

    return accountDisplayName !== displayName;
  },

  submit () {
    const start = Date.now();
    const account = this.getSignedInAccount();
    const displayName = this.getElementValue('input.display-name').trim();

    return account.postDisplayName(displayName)
      .then(() => {
        this.logViewEvent('success');
        this.updateDisplayName(displayName);
        this.displaySuccess(t('Display name updated'));
        this.logFlowEvent(`timing.displayName.change.${Date.now() - start}`);
        this.navigate('settings');
      });
  }
});

Cocktail.mixin(
  View,
  AvatarMixin,
  DisableFormMixin,
  SettingsPanelMixin,
);

export default View;
