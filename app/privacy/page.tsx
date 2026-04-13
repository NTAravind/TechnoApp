export default function PrivacyPolicy() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-8 text-gray-800">
      <h1 className="text-3xl font-bold mb-4">Privacy Policy</h1>
      <p><strong>Effective Date:</strong> July 1, 2025</p>
      <p className="mt-4">Last Updated: July 1, 2025</p>

      <section className="mt-6">
        <h2 className="text-xl font-semibold mb-2">1. Introduction</h2>
        <p>
          Welcome to Techno Industries (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;). We respect your
          privacy and are committed to protecting the personal information you
          share with us.
        </p>
      </section>

      <section className="mt-6">
        <h2 className="text-xl font-semibold mb-2">2. What Data We Collect</h2>
        <p>We may collect the following personal data:</p>
        <ul className="list-disc ml-6">
          <li>Phone numbers (for OTP and WhatsApp messaging)</li>
          <li>Names (optional, if provided)</li>
          <li>Order ID or related transaction details</li>
          <li>Any messages or inquiries submitted via forms or chat</li>
        </ul>
      </section>

      <section className="mt-6">
        <h2 className="text-xl font-semibold mb-2">3. How We Use Your Data</h2>
        <p>We use your data to:</p>
        <ul className="list-disc ml-6">
          <li>Send OTPs and order updates via WhatsApp</li>
          <li>Respond to your queries or customer service requests</li>
          <li>Improve our services and communication</li>
          <li>Update you on our products</li>
        </ul>
        <p className="mt-2">
          We only send WhatsApp messages with your explicit or implied consent
          (e.g., when placing an order or submitting your number).
        </p>
      </section>

      <section className="mt-6">
        <h2 className="text-xl font-semibold mb-2">4. How We Store and Protect Data</h2>
        <p>
          Your data is stored on secure servers and protected with encryption and
          access controls. We do not sell or share your data with third parties
          without your consent, except:
        </p>
        <ul className="list-disc ml-6">
          <li>Meta (WhatsApp) for delivering WhatsApp messages</li>
          <li>Government authorities, when legally required</li>
        </ul>
      </section>

      <section className="mt-6">
        <h2 className="text-xl font-semibold mb-2">5. Your Rights</h2>
        <p>
          Under the Digital Personal Data Protection Act, 2023 (India), you have
          the right to:
        </p>
        <ul className="list-disc ml-6">
          <li>Request access or correction to your data</li>
          <li>Withdraw consent at any time</li>
          <li>Request deletion of your data</li>
        </ul>
        <p className="mt-2">
          You can make requests by contacting us at:{" "}
          <a href="mailto:technoindustriesonline@gmail.com" className="text-blue-600 underline">
            technoindustriesonline@gmail.com
          </a>
        </p>
      </section>

      <section className="mt-6">
        <h2 className="text-xl font-semibold mb-2">6. Third-Party Services</h2>
        <p>
          We use WhatsApp Business API, which is governed by Meta&apos;s terms. For
          details, refer to{" "}
          <a href="https://www.facebook.com/privacy/policy" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
            Meta&apos;s Privacy Policy
          </a>.
        </p>
      </section>

      <section className="mt-6">
        <h2 className="text-xl font-semibold mb-2">7. Changes to This Policy</h2>
        <p>
          We may update this policy from time to time. Changes will be posted on
          this page with the updated date.
        </p>
      </section>

      <section className="mt-6">
        <h2 className="text-xl font-semibold mb-2">8. Contact Us</h2>
        <p>
          If you have any questions about this policy, email us at:{" "}
          <a href="mailto:technoindustriesonline@gmail.com" className="text-blue-600 underline">
            technoindustriesonline@gmail.com
          </a>
        </p>
      </section>
    </main>
  );
}
