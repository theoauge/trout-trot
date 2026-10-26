# Getting Trout Trot onto your iPhone (no Mac needed)

Codemagic builds the app on its Macs, signs it with your Apple Developer account and uploads it to TestFlight. You install it on your iPhone from the TestFlight app. The build steps are already written in `codemagic.yaml`. These are the one-time account steps only you can do.

Do them in order. Steps 1 and 2 can take a day or two while Apple approves your enrollment.

## 1. Join the Apple Developer Program ($99/year)

1. Go to <https://developer.apple.com/programs/enroll/> and sign in with your Apple ID. Two-factor authentication must be on.
2. Enroll as an **Individual**. The name you enroll with is shown on the App Store as the app's seller.
3. Wait for the confirmation email. It's usually within 48 hours.

## 2. Register the app with Apple

**a. Register the bundle ID**

1. Go to <https://developer.apple.com/account/resources/identifiers/list> and click **+**.
2. Choose **App IDs**, then **App**.
3. Description: `Trout Trot`. Bundle ID: **Explicit**, `com.thomas.trouttrot`. Leave the capabilities unticked, then click **Register**.

**b. Create the app in App Store Connect**

1. Go to <https://appstoreconnect.apple.com> → **Apps** → **+** → **New App**.
2. Platform: **iOS**. Name: `Trout Trot`. If that name is taken, try something like `Trout Trot: River Flop`. This is only the store name, and the name under the icon stays "Trout Trot".
3. Bundle ID: pick `com.thomas.trouttrot`. SKU: `trouttrot`.
4. Open the new app → **App Information**, and copy the **Apple ID**. It's a 10-digit number, used in step 6.

**c. Create an API key for Codemagic**

1. In App Store Connect: **Users and Access → Integrations → App Store Connect API → Team Keys → +**.
2. Name: `Codemagic`. Access: **App Manager**.
3. **Download the `.p8` file.** Apple only lets you download it once. Keep it somewhere safe and never add it to the project folder or GitHub.
4. Note the **Issuer ID** (top of the page) and the **Key ID** (in the key's row).

## 3. Put the project on GitHub

1. Go to <https://github.com/new>. Name: `trout-trot`. Set it to **Private**, and don't add a README, .gitignore or license, because the project already has them.
2. In a terminal, run these two commands, using your GitHub username:

```
cd C:\trout-trot
git remote add origin https://github.com/YOUR-USERNAME/trout-trot.git
git push -u origin main
```

## 4. Connect Codemagic

1. Sign up at <https://codemagic.io> with your GitHub account, and allow it access to the `trout-trot` repository.
2. **Add application** → choose `trout-trot` → when asked for the project type, pick **Other**. It reads `codemagic.yaml` from the repository.
3. **Team settings → Integrations → Developer Portal → Connect**:
   - Name it exactly `Trout Trot App Store Connect`, because `codemagic.yaml` refers to it by that name.
   - Enter the Issuer ID and Key ID, and upload the `.p8` file from step 2c.

## 5. Set up signing in Codemagic

1. **Team settings → codemagic.yaml settings → Code signing identities → iOS certificates → Generate certificate**. Choose the API key from step 4 and type **Apple Distribution**. Save the certificate's password if Codemagic shows one.
2. In the Apple Developer portal, go to **Profiles → +** → **App Store Connect** (under Distribution). App ID: `com.thomas.trouttrot`. Certificate: the one Codemagic just made. Name it `Trout Trot App Store`.
3. Back in Codemagic, go to **iOS provisioning profiles → Fetch profiles** and select `Trout Trot App Store`.

## 6. Add the app's Apple ID to the build file

In `codemagic.yaml`, replace `REPLACE_WITH_10_DIGIT_APPLE_ID` with the number from step 2b, then commit and push:

```
git commit -am "Add App Store Connect app ID"
git push
```

Or give the number to Claude, which will update and commit the file. You then only run `git push`.

## 7. Build and install

1. In Codemagic, open the app → **Start new build** → workflow **iPhone build to TestFlight** → **Start**. It takes about 10–15 minutes.
2. In App Store Connect → your app → **TestFlight**, the build appears after Apple finishes processing it, usually 15–30 minutes. Answer any compliance question that appears.
3. Under **Internal Testing**, create a group, add yourself, and add the build.
4. On your iPhone, install **TestFlight** from the App Store, open the invite email, and tap **Install**.

Every later update repeats only step 7. Codemagic gives each upload the next build number automatically.

## If a build fails

Open the failed build in Codemagic and download the logs. Paste the error into Claude.
