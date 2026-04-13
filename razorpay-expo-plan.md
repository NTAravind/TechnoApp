# Razorpay Integration Plan — Expo App

## ⚠️ Critical Expo Constraint

Expo does not support native code natively, so `react-native-razorpay` **cannot** be used directly in Expo Go.
Official Razorpay workaround: load checkout in a WebView + callback URL logic.
**Better path: `expo prebuild` + native module via EAS Build (recommended below).**

---

## Options

| Option | How | When to use |
|---|---|---|
| **A: expo prebuild** | Generates `android/` + `ios/` folders, enables native SDK | EAS Build, production |
| **B: WebView fallback** | Load Razorpay hosted checkout in `<WebView>` | Expo Go, quick prototype |

---

## Option A — Full Plan (Recommended)

### Phase 1 — Backend: Order Creation

Add two API routes to your server (Next.js or standalone):

```
POST /api/razorpay/create-order
POST /api/razorpay/verify-payment
```

**create-order**

```ts
import Razorpay from 'razorpay'

const rzp = new Razorpay({
  key_id: process.env.RZP_KEY_ID,
  key_secret: process.env.RZP_KEY_SECRET,
})

const order = await rzp.orders.create({
  amount: price * 100,       // paise
  currency: 'INR',
  receipt: `rcpt_${Date.now()}`,
  payment_capture: 1,
  notes: { storeId, userId },
})

return { orderId: order.id, amount: order.amount }
```

**verify-payment**

```ts
import crypto from 'crypto'

const hmac = crypto.createHmac('sha256', process.env.RZP_KEY_SECRET!)
hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`)
const digest = hmac.digest('hex')

if (digest !== razorpay_signature) {
  throw new Error('Payment verification failed')
}

// mark order as paid in DB
```

---

### Phase 2 — Expo App Setup

```bash
npx expo install react-native-razorpay
npx expo prebuild
```

**Android — add to `android/app/proguard-rules.pro`:**

```
-keepattributes *Annotation*
-dontwarn com.razorpay.**
-keep class com.razorpay.** {*;}
-optimizations !method/inlining/
-keepclasseswithmembers class * { public void onPayment*(...); }
```

**iOS — `ios/Podfile`:**

```ruby
platform :ios, '10.0'   # bump from 9.0
```

Then run:

```bash
cd ios && pod install && cd ..
```

---

### Phase 3 — Checkout Hook

```ts
// hooks/useRazorpayCheckout.ts
import RazorpayCheckout from 'react-native-razorpay'

interface CheckoutParams {
  orderId: string
  amount: number   // paise
  name: string
  email: string
  contact: string
}

export function useRazorpayCheckout() {
  const openCheckout = async ({
    orderId,
    amount,
    name,
    email,
    contact,
  }: CheckoutParams) => {
    const options = {
      key: process.env.EXPO_PUBLIC_RZP_KEY_ID,
      amount: String(amount),
      currency: 'INR',
      order_id: orderId,
      name: 'Your Store Name',
      description: 'Order Payment',
      prefill: { email, contact, name },
      theme: { color: '#000000' },
    }

    try {
      const data = await RazorpayCheckout.open(options)
      // data = { razorpay_payment_id, razorpay_order_id, razorpay_signature }
      return { success: true, data }
    } catch (err: any) {
      // err = { code, description }
      return { success: false, error: err }
    }
  }

  return { openCheckout }
}
```

---

### Phase 4 — Wire into Checkout Screen

```tsx
// app/checkout.tsx
import { useRazorpayCheckout } from '@/hooks/useRazorpayCheckout'

export default function CheckoutScreen() {
  const { openCheckout } = useRazorpayCheckout()

  const handlePay = async () => {
    // 1. Create order on server
    const { orderId, amount } = await fetch('/api/razorpay/create-order', {
      method: 'POST',
      body: JSON.stringify({ storeId, cartTotal }),
    }).then(r => r.json())

    // 2. Open Razorpay checkout
    const result = await openCheckout({
      orderId,
      amount,
      name: user.name,
      email: user.email,
      contact: user.phone,
    })

    if (!result.success) {
      // handle failure
      return
    }

    // 3. Verify on server
    await fetch('/api/razorpay/verify-payment', {
      method: 'POST',
      body: JSON.stringify(result.data),
    })

    // 4. Navigate to success screen
    router.replace('/order-success')
  }

  return (
    // ... your checkout UI
    <Button onPress={handlePay} title="Pay Now" />
  )
}
```

---

### Phase 5 — UPI Intent (iOS, optional)

Modify `ios/<AppName>/Info.plist` to add UPI app schemes:

```xml
<key>LSApplicationQueriesSchemes</key>
<array>
  <string>tez</string>
  <string>phonepe</string>
  <string>paytmmp</string>
</array>
```

> Note: Only works in standalone builds, not Metro/Expo Go.

---

### Phase 6 — EAS Build

```bash
# Install EAS CLI
npm install -g eas-cli
eas login

# Configure
eas build:configure

# Test build (Android)
eas build --platform android --profile preview

# Production
eas build --platform android --profile production
eas build --platform ios --profile production
```

**`eas.json` example:**

```json
{
  "build": {
    "preview": {
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "app-bundle"
      }
    }
  }
}
```

---

### Phase 7 — Env Variables

```bash
# .env.local (server)
RZP_KEY_ID=rzp_test_xxxxxxxxxxxx
RZP_KEY_SECRET=xxxxxxxxxxxxxxxxxxxx

# .env (expo app)
EXPO_PUBLIC_RZP_KEY_ID=rzp_test_xxxxxxxxxxxx
```

> Never expose `RZP_KEY_SECRET` to the client.

---

## Option B — WebView Fallback

For quick testing without prebuild:

```tsx
import { WebView } from 'react-native-webview'

const razorpayHtml = `
  <html>
    <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
    <script>
      var options = {
        key: "${RZP_KEY_ID}",
        order_id: "${orderId}",
        amount: "${amount}",
        currency: "INR",
        handler: function(response) {
          window.ReactNativeWebView.postMessage(JSON.stringify(response));
        }
      };
      var rzp = new Razorpay(options);
      rzp.open();
    </script>
  </html>
`

<WebView
  source={{ html: razorpayHtml }}
  onMessage={(e) => {
    const data = JSON.parse(e.nativeEvent.data)
    // verify payment with server
  }}
/>
```

---

## Summary Checklist

- [ ] `POST /api/razorpay/create-order` — server route
- [ ] `POST /api/razorpay/verify-payment` — server route (HMAC)
- [ ] `npx expo prebuild`
- [ ] Proguard rules (Android)
- [ ] Podfile platform bump + `pod install` (iOS)
- [ ] `useRazorpayCheckout` hook
- [ ] Wire into checkout screen
- [ ] UPI intent schemes in `Info.plist` (iOS)
- [ ] EAS Build setup
- [ ] Swap test keys → live keys before release

---

## Test Cards

| Card | Number |
|---|---|
| Visa | `4111 1111 1111 1111` |
| Mastercard | `5267 3181 8797 5449` |

Expiry: any future date · CVV: any 3 digits · OTP: `1234`
