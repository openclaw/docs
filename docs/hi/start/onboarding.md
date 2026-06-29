---
read_when:
    - macOS ऑनबोर्डिंग सहायक को डिज़ाइन करना
    - प्रमाणीकरण या पहचान सेटअप लागू करना
sidebarTitle: 'Onboarding: macOS App'
summary: OpenClaw के लिए पहली बार चलाने का सेटअप प्रवाह (macOS ऐप)
title: ऑनबोर्डिंग (macOS ऐप)
x-i18n:
    generated_at: "2026-06-29T00:14:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 73f902bcbb7ef782d4a5fbe442a8855a8fcb426d45167c4d2fc1fc050263b5f1
    source_path: start/onboarding.md
    workflow: 16
---

यह दस्तावेज़ **वर्तमान** पहली बार चलने वाले सेटअप फ़्लो का वर्णन करता है। लक्ष्य एक
सरल "day 0" अनुभव है: चुनें कि Gateway कहाँ चलता है, auth कनेक्ट करें, wizard चलाएँ,
और agent को खुद को bootstrap करने दें।
onboarding पथों के सामान्य अवलोकन के लिए, [Onboarding Overview](/hi/start/onboarding-overview) देखें।

<Steps>
<Step title="macOS चेतावनी स्वीकृत करें">
<Frame>
<img src="/assets/macos-onboarding/01-macos-warning.jpeg" alt="" />
</Frame>
</Step>
<Step title="स्थानीय नेटवर्क खोजने की अनुमति दें">
<Frame>
<img src="/assets/macos-onboarding/02-local-networks.jpeg" alt="" />
</Frame>
</Step>
<Step title="स्वागत और सुरक्षा सूचना">
<Frame caption="प्रदर्शित सुरक्षा सूचना पढ़ें और उसके अनुसार निर्णय लें">
<img src="/assets/macos-onboarding/03-security-notice.png" alt="" />
</Frame>

सुरक्षा विश्वास मॉडल:

- डिफ़ॉल्ट रूप से, OpenClaw एक व्यक्तिगत agent है: एक विश्वसनीय operator सीमा।
- साझा/बहु-उपयोगकर्ता सेटअप के लिए lock-down आवश्यक है (trust boundaries अलग करें, tool access न्यूनतम रखें, और [Security](/hi/gateway/security) का पालन करें)।
- स्थानीय onboarding अब नए configs को डिफ़ॉल्ट रूप से `tools.profile: "coding"` पर सेट करता है ताकि नए स्थानीय सेटअप unrestricted `full` profile को बाध्य किए बिना filesystem/runtime tools रख सकें।
- यदि hooks/webhooks या अन्य अविश्वसनीय content feeds सक्षम हैं, तो एक मजबूत आधुनिक model tier का उपयोग करें और सख्त tool policy/sandboxing रखें।

</Step>
<Step title="स्थानीय बनाम रिमोट">
<Frame>
<img src="/assets/macos-onboarding/04-choose-gateway.png" alt="" />
</Frame>

**Gateway** कहाँ चलता है?

- **यह Mac (केवल स्थानीय):** onboarding auth configure कर सकता है और credentials
  स्थानीय रूप से लिख सकता है।
- **रिमोट (SSH/Tailnet के ज़रिए):** onboarding स्थानीय auth configure **नहीं** करता;
  credentials gateway host पर मौजूद होने चाहिए। remote gateway token field
  macOS app द्वारा उस Gateway से connect करने के लिए उपयोग किया गया token store करता है; मौजूदा
  non-plaintext `gateway.remote.token` values तब तक सुरक्षित रखे जाते हैं जब तक आप उन्हें replace
  नहीं करते।
- **बाद में configure करें:** setup छोड़ें और app को unconfigured रहने दें।

<Tip>
**Gateway auth सुझाव:**

- wizard अब loopback के लिए भी एक **token** generate करता है, इसलिए local WS clients को authenticate करना होगा।
- यदि आप auth disable करते हैं, तो कोई भी local process connect कर सकता है; इसका उपयोग केवल पूरी तरह विश्वसनीय machines पर करें।
- multi-machine access या non-loopback binds के लिए **token** का उपयोग करें।

</Tip>
</Step>
<Step title="अनुमतियाँ">
<Frame caption="चुनें कि आप OpenClaw को कौन-सी अनुमतियाँ देना चाहते हैं">
<img src="/assets/macos-onboarding/05-permissions.png" alt="" />
</Frame>

Onboarding इन कार्यों के लिए आवश्यक TCC अनुमतियाँ मांगता है:

- Automation (AppleScript)
- Notifications
- Accessibility
- Screen Recording
- Microphone
- Speech Recognition
- Camera
- Location

</Step>
<Step title="CLI">
  <Info>यह चरण वैकल्पिक है</Info>
  app npm, pnpm, या bun के ज़रिए वैश्विक `openclaw` CLI install कर सकता है।
  यह पहले npm को प्राथमिकता देता है, फिर pnpm को, फिर bun को यदि वही एकमात्र detect किया गया
  package manager है। Gateway runtime के लिए, Node अनुशंसित path बना रहता है।
</Step>
<Step title="Onboarding Chat (समर्पित session)">
  setup के बाद, app एक समर्पित onboarding chat session खोलता है ताकि agent
  अपना परिचय दे सके और अगले steps guide कर सके। यह first-run guidance को आपकी सामान्य conversation से
  अलग रखता है। पहले agent run के दौरान gateway host पर क्या होता है, इसके लिए
  [Bootstrapping](/hi/start/bootstrapping) देखें।
</Step>
</Steps>

## संबंधित

- [Onboarding overview](/hi/start/onboarding-overview)
- [Getting started](/hi/start/getting-started)
