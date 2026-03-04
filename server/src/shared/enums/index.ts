export enum EventNames {
  SendMail = 'send.mail',
  SendSms = 'send.sms',
  SendPush = 'send.push',
  SendInApp = 'send.in-app',
  SendNotification = 'send.notification', // use when you want message for push and in app to be the same
  LiveEndingSoon = 'live.ending-soon',
  LiveEnded = 'live.ended',
}
