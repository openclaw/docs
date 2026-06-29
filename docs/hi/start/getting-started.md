---
read_when:
    - पहली बार शून्य से सेटअप
    - आप काम करने वाली चैट तक पहुँचने का सबसे तेज़ तरीका चाहते हैं
summary: OpenClaw इंस्टॉल करें और मिनटों में अपनी पहली चैट चलाएँ।
title: शुरुआत करें
x-i18n:
    generated_at: "2026-06-29T00:13:32Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 579ed2b4797dc851b0293b96a4177cc356641b6842fe45c4d48f4e8c224eef75
    source_path: start/getting-started.md
    workflow: 16
---

OpenClaw इंस्टॉल करें, ऑनबोर्डिंग चलाएँ, और अपने AI सहायक से चैट करें — सब कुछ
लगभग 5 मिनट में। अंत तक आपके पास चलता हुआ Gateway, कॉन्फ़िगर किया गया प्रमाणीकरण,
और एक काम करता हुआ चैट सत्र होगा।

## आपको क्या चाहिए

- **Node.js** — Node 24 अनुशंसित है (Node 22.19+ भी समर्थित है)
- मॉडल प्रदाता (Anthropic, OpenAI, Google, आदि) से **एक API key** — ऑनबोर्डिंग आपसे पूछेगी

<Tip>
अपना Node संस्करण `node --version` से जाँचें।
**Windows उपयोगकर्ता:** नेटिव Windows Hub ऐप सबसे आसान डेस्कटॉप मार्ग है। 
PowerShell इंस्टॉलर और WSL2 Gateway मार्ग भी समर्थित हैं। [Windows](/hi/platforms/windows) देखें।
Node इंस्टॉल करना है? [Node सेटअप](/hi/install/node) देखें।
</Tip>

## त्वरित सेटअप

<Steps>
  <Step title="Install OpenClaw">
    <Tabs>
      <Tab title="macOS / Linux">
        ```bash
        curl -fsSL https://openclaw.ai/install.sh | bash
        ```
        <img
  src="/assets/install-script.svg"
  alt="Install Script Process"
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
    अन्य इंस्टॉल तरीके (Docker, Nix, npm): [इंस्टॉल](/hi/install)।
    </Note>

  </Step>
  <Step title="Run onboarding">
    ```bash
    openclaw onboard --install-daemon
    ```

    विज़ार्ड आपको मॉडल प्रदाता चुनने, API key सेट करने,
    और Gateway कॉन्फ़िगर करने की प्रक्रिया से गुज़ारता है। QuickStart में आम तौर पर केवल कुछ मिनट लगते हैं, लेकिन
    प्रदाता साइन-इन, चैनल पेयरिंग, daemon इंस्टॉल, नेटवर्क डाउनलोड, Skills,
    या वैकल्पिक Plugin पूरी ऑनबोर्डिंग को अधिक समय लेवा बना सकते हैं। आप वैकल्पिक
    चरण छोड़ सकते हैं और बाद में `openclaw configure` के साथ वापस आ सकते हैं।

    पूर्ण संदर्भ के लिए [ऑनबोर्डिंग (CLI)](/hi/start/wizard) देखें।

  </Step>
  <Step title="Verify the Gateway is running">
    ```bash
    openclaw gateway status
    ```

    आपको Gateway को पोर्ट 18789 पर सुनते हुए दिखना चाहिए।

  </Step>
  <Step title="Open the dashboard">
    ```bash
    openclaw dashboard
    ```

    यह आपके ब्राउज़र में Control UI खोलता है। यदि यह लोड हो जाता है, तो सब कुछ काम कर रहा है।

  </Step>
  <Step title="Send your first message">
    Control UI चैट में एक संदेश टाइप करें और आपको AI उत्तर मिलना चाहिए।

    इसके बजाय अपने फ़ोन से चैट करना चाहते हैं? सेट अप करने के लिए सबसे तेज़ चैनल
    [Telegram](/hi/channels/telegram) है (बस एक bot token)। सभी विकल्पों के लिए [चैनल](/hi/channels)
    देखें।

  </Step>
</Steps>

<Accordion title="Advanced: mount a custom Control UI build">
  यदि आप स्थानीयकृत या अनुकूलित डैशबोर्ड बिल्ड बनाए रखते हैं, तो
  `gateway.controlUi.root` को ऐसी डायरेक्टरी पर इंगित करें जिसमें आपकी बनी हुई static
  assets और `index.html` हो।

```bash
mkdir -p "$HOME/.openclaw/control-ui-custom"
# Copy your built static files into that directory.
```

फिर सेट करें:

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

Gateway को रीस्टार्ट करें और डैशबोर्ड फिर से खोलें:

```bash
openclaw gateway restart
openclaw dashboard
```

</Accordion>

## आगे क्या करें

<Columns>
  <Card title="Connect a channel" href="/hi/channels" icon="message-square">
    Discord, Feishu, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo, और अन्य।
  </Card>
  <Card title="Pairing and safety" href="/hi/channels/pairing" icon="shield">
    नियंत्रित करें कि आपके एजेंट को कौन संदेश भेज सकता है।
  </Card>
  <Card title="Configure the Gateway" href="/hi/gateway/configuration" icon="settings">
    मॉडल, टूल, sandbox, और उन्नत सेटिंग्स।
  </Card>
  <Card title="Browse tools" href="/hi/tools" icon="wrench">
    ब्राउज़र, exec, वेब खोज, Skills, और Plugin।
  </Card>
</Columns>

<Accordion title="Advanced: environment variables">
  यदि आप OpenClaw को service account के रूप में चलाते हैं या कस्टम पाथ चाहते हैं:

- `OPENCLAW_HOME` — आंतरिक पाथ रिज़ॉल्यूशन के लिए होम डायरेक्टरी
- `OPENCLAW_STATE_DIR` — state डायरेक्टरी को ओवरराइड करें
- `OPENCLAW_CONFIG_PATH` — config file पाथ को ओवरराइड करें

पूर्ण संदर्भ: [Environment variables](/hi/help/environment)।
</Accordion>

## संबंधित

- [इंस्टॉल अवलोकन](/hi/install)
- [चैनल अवलोकन](/hi/channels)
- [सेटअप](/hi/start/setup)
