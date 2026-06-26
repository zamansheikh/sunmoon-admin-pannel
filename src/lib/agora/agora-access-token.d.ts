declare module "agora-access-token" {
  export const RtcRole: {
    PUBLISHER: number;
    SUBSCRIBER: number;
    ATTENDEE: number;
    ADMIN: number;
  };

  export class RtcTokenBuilder {
    static buildTokenWithUid(
      appId: string,
      appCertificate: string,
      channelName: string,
      uid: number,
      role: number,
      privilegeExpiredTs: number
    ): string;
    static buildTokenWithAccount(
      appId: string,
      appCertificate: string,
      channelName: string,
      account: string,
      role: number,
      privilegeExpiredTs: number
    ): string;
  }

  export class RtmTokenBuilder {
    static buildToken(
      appId: string,
      appCertificate: string,
      account: string,
      privilegeExpiredTs: number
    ): string;
  }
}
