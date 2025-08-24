// Google Photos Picker API implementation
declare global {
  interface Window {
    gapi: any;
    google: any;
  }
}

interface PickerConfig {
  clientId: string;
  appId: string;
  scope: string;
  onPick: (photos: any[]) => void;
  onCancel?: () => void;
}

class GooglePhotosPicker {
  private pickerApiLoaded = false;
  private oauthToken: string | null = null;

  async init(clientId: string) {
    return new Promise((resolve, reject) => {
      if (!window.gapi) {
        reject(new Error('Google API not loaded'));
        return;
      }

      window.gapi.load('client:picker', () => {
        window.gapi.client.init({
          clientId: clientId,
          scope: 'https://www.googleapis.com/auth/photoslibrary.readonly',
        }).then(() => {
          this.pickerApiLoaded = true;
          resolve(true);
        }).catch(reject);
      });
    });
  }

  async getAuthToken(): Promise<string> {
    return new Promise((resolve, reject) => {
      window.gapi.auth2.getAuthInstance().signIn().then((user: any) => {
        const authResponse = user.getAuthResponse();
        this.oauthToken = authResponse.access_token;
        resolve(authResponse.access_token);
      }).catch(reject);
    });
  }

  async openPicker(config: PickerConfig) {
    if (!this.pickerApiLoaded) {
      await this.init(config.clientId);
    }

    // Get the OAuth token from the current session
    const token = this.oauthToken || await this.getAuthToken();

    // Create and configure the picker
    const picker = new window.google.picker.PickerBuilder()
      .addView(window.google.picker.ViewId.PHOTO_ALBUMS)
      .addView(window.google.picker.ViewId.PHOTOS)
      .setOAuthToken(token)
      .setDeveloperKey(config.appId)
      .setCallback((data: any) => {
        if (data.action === window.google.picker.Action.PICKED) {
          const photos = data.docs || [];
          config.onPick(photos);
        } else if (data.action === window.google.picker.Action.CANCEL) {
          config.onCancel?.();
        }
      })
      .setTitle('Välj foton från Google Photos')
      .build();

    picker.setVisible(true);
  }

  // For using the user's existing auth token from our OAuth login
  setAuthToken(token: string) {
    this.oauthToken = token;
  }
}

export const googlePhotosPicker = new GooglePhotosPicker();