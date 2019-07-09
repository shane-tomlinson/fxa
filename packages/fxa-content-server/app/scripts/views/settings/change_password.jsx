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
      mail: props.account.get('email') || '',
      newPass: '',
      newVPass: '',
      oldPass: ''
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
     if (this.state.newPass !== this.state.newVPass) {
       const err = AuthErrors.toError('PASSWORDS_DO_NOT_MATCH');
       this.props.showValidationError('#new_vpassword', err);
     }
   }
   componentDidUpdate () {
     this._input.focus();
   }
   componentWillUnmount () {
     return this.state.newPass === this.state.newVPass;
   }
   handleSubmit = event => {
     event.preventDefault();
     this.setState({
       newPass: document.querySelectorAll('#new_password')[0].value,
       newVPass: document.querySelectorAll('#new_vpassword')[0].value,
       oldPass: document.querySelectorAll('#old_password')[0].value
     }, () => {
       if (this.state.newPass !== this.state.newVPass) {
         const err = AuthErrors.toError('PASSWORDS_DO_NOT_MATCH');
         this.props.showValidationError('#new_vpassword', err);
       } else {
         this.props.submit(this.state.oldPass, this.state.newPass).then(() => 
         this.setState({newPass: '', newVPass: '', oldPass: ''}),
         document.querySelectorAll('#new_password')[0].value = '',
         document.querySelectorAll('#new_vpassword')[0].value = '',
         document.querySelectorAll('#old_password')[0].value =''
         );
       }
     });
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
               onChange={this.getNewVPassword}
             />
           </div>

           <div className="button-row">
             <button type="submit" className="settings-button primary-button">{t('Change')}</button>
             <button className="settings-button secondary-button cancel">{t('Cancel')}</button>
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
  template: '<div />',
  className: 'change-password',
  viewName: 'settings.change-password',

  render () {
    return Promise.resolve(translator.fetch()).then(() => {
      ReactDOM.render(
        <ChangePassword
          account={this.getSignedInAccount()}
          submit={(oldPassword, newPassword)=>this.submit(oldPassword, newPassword)}
          showValidationError={(id,err)=>this.showValidationError(this.$(id),err)}
        />,
        this.$el.get(0)
      );
      return true;
    });
  },

  openPanel () {
    // force a re-render so that the input element is focused.
    return this.render();
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

      return this.render();
    }).catch((err) => {
      if (AuthErrors.is(err, 'INCORRECT_PASSWORD')) {
        return this.showValidationError(this.$('#old_password'), err);
      } else if (AuthErrors.is(err, 'PASSWORDS_MUST_BE_DIFFERENT')) {
        return this.showValidationError(this.$('#new_password'), err);
      }
      throw err;
    })
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
