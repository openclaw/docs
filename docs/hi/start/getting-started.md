---
read_when:
    - शून्य से पहली बार सेटअप करना
    - आप एक कार्यशील चैट तक पहुँचने का सबसे तेज़ तरीका चाहते हैं
summary: OpenClaw इंस्टॉल करें और कुछ ही मिनटों में अपनी पहली चैट शुरू करें।
title: शुरुआत करना
x-i18n:
    generated_at: "2026-07-16T17:28:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8f50073b059477636b94e128cec90b41dcc21c8bb132e34900e68409cacf70eb
    source_path: start/getting-started.md
    workflow: 16
---

OpenClaw इंस्टॉल करें, ऑनबोर्डिंग चलाएँ और लगभग 5 मिनट में अपने AI सहायक से चैट करें। अंत तक आपके पास चलता हुआ Gateway, कॉन्फ़िगर किया गया प्रमाणीकरण और एक कार्यशील चैट सत्र होगा।

## आपको क्या चाहिए

- **Node.js 22.22.3+, 24.15+, या 25.9+** (24 अनुशंसित डिफ़ॉल्ट है)
- किसी मॉडल प्रदाता (Anthropic, OpenAI, Google आदि) की **API कुंजी** — ऑनबोर्डिंग के दौरान आपसे इसे दर्ज करने के लिए कहा जाएगा

<Tip>
`node --version` से अपना Node संस्करण जाँचें।
**Windows उपयोगकर्ता:** नेटिव Windows Hub ऐप सबसे आसान डेस्कटॉप विकल्प है। PowerShell इंस्टॉलर और WSL2 Gateway विकल्प भी समर्थित हैं। [Windows](/hi/platforms/windows) देखें।
Node इंस्टॉल करना है? [Node सेटअप](/hi/install/node) देखें।
</Tip>

## त्वरित सेटअप

<Steps>
  <Step title="OpenClaw इंस्टॉल करें">
    <Tabs>
      <Tab title="macOS / Linux">
        ```bash
        curl -fsSL https://openclaw.ai/install.sh | bash
        ```
        <img
  src="/assets/install-script.svg"
  alt="इंस्टॉल स्क्रिप्ट प्रक्रिया"
  className="rounded-lg"
/>
      </Tab>
      <Tab title="Windows (PowerShell)">
        ```powershell
        iwr -useb https://openclaw.ai/install.ps1 | iex
        ```
      </Tab>
    </Tabs>

    <Note>
    इंस्टॉल करने के अन्य तरीके (Docker, Nix, npm): [इंस्टॉल करें](/hi/install)।
    </Note>

  </Step>
  <Step title="ऑनबोर्डिंग चलाएँ">
    ```bash
    openclaw onboard --install-daemon
    ```

    विज़ार्ड आपको मॉडल प्रदाता चुनने, API कुंजी सेट करने और Gateway कॉन्फ़िगर करने की प्रक्रिया से गुज़ारता है। QuickStart में आमतौर पर केवल कुछ मिनट लगते हैं, लेकिन प्रदाता में साइन-इन, चैनल पेयरिंग, डेमन इंस्टॉलेशन, नेटवर्क डाउनलोड, Skills या वैकल्पिक plugins के कारण पूरी ऑनबोर्डिंग में अधिक समय लग सकता है। वैकल्पिक चरण छोड़ दें और बाद में `openclaw configure` के साथ वापस आएँ।

    संपूर्ण संदर्भ के लिए [ऑनबोर्डिंग (CLI)](/hi/start/wizard) देखें।

  </Step>
  <Step title="सत्यापित करें कि Gateway चल रहा है">
    ```bash
    openclaw gateway status
    ```

    आपको Gateway को पोर्ट 18789 पर सुनते हुए देखना चाहिए।

  </Step>
  <Step title="डैशबोर्ड खोलें">
    ```bash
    openclaw dashboard
    ```

    इससे आपके ब्राउज़र में Control UI खुलता है। यदि यह लोड हो जाता है, तो सब कुछ काम कर रहा है।

  </Step>
  <Step title="अपना पहला संदेश भेजें">
    Control UI चैट में कोई संदेश टाइप करें और आपको AI से उत्तर मिलना चाहिए।

    इसके बजाय अपने फ़ोन से चैट करना चाहते हैं? सेटअप करने के लिए सबसे तेज़ चैनल [Telegram](/hi/channels/telegram) है (केवल एक बॉट टोकन)। सभी विकल्पों के लिए [चैनल](/hi/channels) देखें।

  </Step>
</Steps>

<Accordion title="उन्नत: कस्टम Control UI बिल्ड माउंट करें">
  यदि आप स्थानीयकृत या अनुकूलित डैशबोर्ड बिल्ड बनाए रखते हैं, तो `gateway.controlUi.root` को उस डायरेक्टरी की ओर इंगित करें जिसमें आपकी बिल्ड की गई स्थिर एसेट और `index.html` मौजूद हों।

```bash
mkdir -p "$HOME/.openclaw/control-ui-custom"
# अपनी बिल्ड की गई स्थिर फ़ाइलें उस डायरेक्टरी में कॉपी करें।
```

फिर यह सेट करें:

```json
{
  "gateway": {
    "controlUi": {
      "enabled": true,
      "root": "$HOME/.openclaw/control-ui-custom"
    }
  }
}
```

Gateway पुनः आरंभ करें और डैशबोर्ड दोबारा खोलें:

```bash
openclaw gateway restart
openclaw dashboard
```

</Accordion>

## आगे क्या करें

<Columns>
  <Card title="कोई चैनल कनेक्ट करें" href="/hi/channels" icon="message-square">
    Discord, Feishu, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo और अन्य।
  </Card>
  <Card title="पेयरिंग और सुरक्षा" href="/hi/channels/pairing" icon="shield">
    नियंत्रित करें कि आपके एजेंट को कौन संदेश भेज सकता है।
  </Card>
  <Card title="Gateway कॉन्फ़िगर करें" href="/hi/gateway/configuration" icon="settings">
    मॉडल, टूल, सैंडबॉक्स और उन्नत सेटिंग।
  </Card>
  <Card title="टूल ब्राउज़ करें" href="/hi/tools" icon="wrench">
    ब्राउज़र, exec, वेब खोज, Skills और plugins।
  </Card>
</Columns>

<Accordion title="उन्नत: पर्यावरण चर">
  यदि आप OpenClaw को किसी सेवा खाते के रूप में चलाते हैं या कस्टम पाथ चाहते हैं:

- `OPENCLAW_HOME` — आंतरिक पाथ रिज़ॉल्यूशन के लिए होम डायरेक्टरी
- `OPENCLAW_STATE_DIR` — स्टेट डायरेक्टरी को ओवरराइड करें
- `OPENCLAW_CONFIG_PATH` — कॉन्फ़िगरेशन फ़ाइल के पाथ को ओवरराइड करें

संपूर्ण संदर्भ: [पर्यावरण चर](/hi/help/environment)।
</Accordion>

## संबंधित

- [इंस्टॉलेशन का अवलोकन](/hi/install)
- [चैनलों का अवलोकन](/hi/channels)
- [सेटअप](/hi/start/setup)
