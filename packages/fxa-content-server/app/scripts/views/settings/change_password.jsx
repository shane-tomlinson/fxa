/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import AuthErrors from '../../lib/auth-errors';
import BackMixin from '../mixins/back-mixin';
import Cocktail from 'cocktail';
import FormView from '../form';
import ExperimentMixin from '../mixins/experiment-mixin';
import PasswordMixin from '../mixins/password-mixin';
import PasswordStrengthMixin from '../mixins/password-strength-mixin';
import ServiceMixin from '../mixins/service-mixin';
import SettingsPanelMixin from '../mixins/settings-panel-mixin';
// import Template from 'templates/settings/change_password.mustache';
// eslint-disable-next-line
 import React from 'react';
import ReactDOM from 'react-dom';
import Translator from '../../lib/translator';

const translator = new Translator();

const t = msg => translator.get(msg);

function ChangePassword(props){
  return (
    <div id="change-password" className="settings-unit">
      <ChangePasswordHeader />
      <ChangePasswordForm
        account={props.account}
        submit={props.submit}
        displayError={props.displayError}
        isPanelOpen={props.isPanelOpen}
        showValidationError={props.showValidationError}
      />
    </div>
  );
}

export function ChangePasswordHeader(){
  return (
    <div className="settings-unit-stub">
      <header className="settings-unit-summary">
        <h2 className="settings-unit-title">{t('Password')}</h2>
      </header>
      <button className="settings-button secondary-button settings-unit-toggle" data-href="settings/change_password">{t('Change...')}</button>
    </div>
  );
}

export class ChangePasswordForm extends React.Component{
  constructor(props) {
    super(props);

    this.state = {
      hasFocused: false,
      mail: props.account.get('email') || '',
      newPass: '',
      newVPass: '',
      oldPass: '',
    };
  }
   getOldPassword = event => {
     this.setState({
       oldPass: event.target.value
     });
   }

   getNewPassword = event => {
     this.setState({
       newPass: event.target.value
     }, ()=>{
       this.showValidationErrorsEnd();
     });
   }

   getNewVPassword = event => {
     this.setState({
       newVPass: event.target.value
     }, ()=>{
       this.showValidationErrorsEnd();
     });
   }
   showValidationErrorsEnd () {
     if (this.state.newVPass && this.state.newPass !== this.state.newVPass) {
       const err = AuthErrors.toError('PASSWORDS_DO_NOT_MATCH');
       this.props.showValidationError('#new_vpassword', err);
     }
   }
   componentDidUpdate () {
     console.log('componentDidUpdate', this.state.hasFocused, this.props.isPanelOpen)
     if (!this.state.hasFocused && this.props.isPanelOpen) {
      this._input.focus();
      this.setState({hasFocused: true});
     }
   }
   componentWillUnmount () {
     return this.state.newPass === this.state.newVPass;
   }

   setFocus = () => {
     console.log('setFocus')
     this.setState({
       hasFocused: false
     }, () => {
       this.componentDidUpdate();
     });
   }

   handleSubmit = event => {
     event.preventDefault();
    if (this.state.newPass !== this.state.newVPass) {
      const err = AuthErrors.toError('PASSWORDS_DO_NOT_MATCH');
      this.props.showValidationError('#new_vpassword', err);
    } else {
      this.props.submit(this.state.oldPass, this.state.newPass)
      .then(() => {
        this.setState({newPass: '', newVPass: '', oldPass: '', hasFocused: false});
      }, (err) => {
        if (AuthErrors.is(err, 'INCORRECT_PASSWORD')) {
          this.props.showValidationError('#old_password', err);
        } else if (AuthErrors.is(err, 'PASSWORDS_MUST_BE_DIFFERENT')) {
          this.props.showValidationError('#new_password', err);
        } else {
          this.props.displayError(err);
        }
      });
       }
   };

   render(){
     return (
       <div className="settings-unit-details">
         <div className="error"></div>

         <form noValidate onSubmit={this.handleSubmit}>
           <p>
             {t('Once you\'re finished, use your new password to sign in on all of your devices.')}
           </p>
           {/* hidden email field is to allow Fx password manager to correctly save the updated password.
           Without it, the password manager saves the old_password as the username. */}
           <input type="email" defaultValue={this.state.mail} className="hidden" />
           <div className="input-row password-row">
             <input
               type="password"
               className="password"
               id="old_password"
               placeholder={t('Old password')}
               onChange={this.getOldPassword}
               required pattern=".{8,}"
               value={this.state.oldPass}
               ref={input => (this._input = input)}
             />
             <div className="input-help input-help-forgot-pw links centered"><a href="/reset_password" className="reset-password">{t('Forgot password?')}</a></div>
           </div>

           <div className="input-row password-row">
             <input
               type="password"
               className="password check-password tooltip-below"
               id="new_password"
               placeholder={t('New password')}
               required pattern=".{8,}"
               data-synchronize-show="true"
               value={this.state.newPass}
               onChange={this.getNewPassword}
             />
             <div className="helper-balloon"></div>
           </div>

           <div className="input-row password-row">
             <input
               type="password"
               className="password check-password tooltip-below"
               id="new_vpassword"
               placeholder={t('Re-enter password')}
               required pattern=".{8,}"
               data-synchronize-show="true"
               value={this.state.newVPass}
               onChange={this.getNewVPassword}
             />
           </div>

           <div className="button-row">
             <button type="submit" className="settings-button primary-button">{t('Change')}</button>
             <button className="settings-button secondary-button cancel" onClick={this.setFocus}>{t('Cancel')}</button>
           </div>
         </form>
       </div>
     );
   }
}

/* Need FormView because some functions like showValidationError
 * is used here and to avoid same code multiple times we have
 * extended the View from FormView */

const View = FormView.extend({
  className: 'change-password',
  viewName: 'settings.change-password',

  getAccount () {
    return this.getSignedInAccount();
  },

  initialize (...args) {
    FormView.prototype.initialize(...args);
    this.listenTo(this.model, 'change', this.renderReactComponent);
  },

  renderReactComponent () {
    console.log('rendering react component')
    return Promise.resolve(translator.fetch()).then(() => {
      ReactDOM.render(
        <ChangePassword
          account={this.getAccount()}
          submit={(oldPassword, newPassword)=>this.submit(oldPassword, newPassword)}
          displayError={(err)=>this.displayError(err)}
          isPanelOpen={this.isPanelOpen()}
          showValidationError={(id,err)=>this.showValidationError(this.$(id),err)}
        />,
        this.$el.get(0)
      );
    });
  },

  openPanel () {
    // force a re-render so that the input element is focused.
    return this.renderReactComponent();
  },

   /* It causes form submission multiple times so to avoid
   * that we have overwritten the defination of onFormSubmit */
  onFormSubmit () {},

  submit (oldPassword, newPassword) {
    var account = this.getSignedInAccount();

    this.hideError();

    return this.user.changeAccountPassword(
      account,
      oldPassword,
      newPassword,
      this.relier
    ).then(() => {
      this.logViewEvent('success');
      return this.invokeBrokerMethod('afterChangePassword', account);
    }).then(() => {
      this.displaySuccess(t('Password changed successfully'));
      this.navigate('settings');
    });
  },
});

Cocktail.mixin(
  View,
  ExperimentMixin,
  PasswordMixin,
  PasswordStrengthMixin({
    balloonEl: '.helper-balloon',
    passwordEl: '#new_password'
  }),
  SettingsPanelMixin,
  ServiceMixin,
  BackMixin
);

export default View;
