---
read_when:
    - OpenClaw एजेंट रनटाइम कोड या परीक्षणों पर कार्य करना
    - एजेंट-रनटाइम लिंट, टाइपचेक और लाइव परीक्षण प्रवाह चलाना
summary: 'OpenClaw एजेंट रनटाइम के लिए डेवलपर कार्यप्रवाह: बिल्ड, परीक्षण और लाइव सत्यापन'
title: OpenClaw एजेंट रनटाइम कार्यप्रवाह
x-i18n:
    generated_at: "2026-07-16T15:40:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 044f05779bef4ad18478081ba44d84356723c8a0be764440aa9d2b976d167324
    source_path: openclaw-agent-runtime.md
    workflow: 16
---

OpenClaw रेपो में एजेंट रनटाइम (`src/agents/`) के लिए डेवलपर वर्कफ़्लो।

## टाइप जाँच और लिंटिंग

- डिफ़ॉल्ट स्थानीय गेट: `pnpm check` (टाइप जाँच, लिंट, नीति सुरक्षा-जाँच)
- बिल्ड गेट: जब परिवर्तन बिल्ड आउटपुट, पैकेजिंग या लेज़ी-लोडिंग/मॉड्यूल सीमाओं को प्रभावित कर सकता हो, तब `pnpm build`
- पुश से पहले का पूर्ण गेट: `pnpm build && pnpm check && pnpm check:test-types && pnpm test`

## एजेंट रनटाइम परीक्षण चलाना

एजेंट रनटाइम यूनिट सुइट चलाएँ:

```bash
pnpm test \
  "src/agents/agent-*.test.ts" \
  "src/agents/embedded-agent-*.test.ts" \
  "src/agents/agent-hooks/**/*.test.ts"
```

पहला ग्लॉब `agent-tools*`, `agent-settings`, और
`agent-tool-definition-adapter*` सुइट को भी कवर करता है।

लाइव परीक्षण यूनिट कॉन्फ़िगरेशन से बाहर रखे गए हैं; उन्हें लाइव
रैपर के माध्यम से चलाएँ (`OPENCLAW_LIVE_TEST=1` सेट करता है और प्रदाता क्रेडेंशियल आवश्यक हैं):

```bash
pnpm test:live src/agents/embedded-agent-runner-extraparams.live.test.ts
```

## मैन्युअल परीक्षण

- Gateway को डेवलपमेंट मोड में चलाएँ (`OPENCLAW_SKIP_CHANNELS=1` के माध्यम से चैनल कनेक्शन छोड़ देता है): `pnpm gateway:dev`
- Gateway के माध्यम से एजेंट का एक टर्न ट्रिगर करें: `pnpm openclaw agent --message "Hello" --thinking low`
- इंटरैक्टिव डीबगिंग के लिए TUI का उपयोग करें: `pnpm tui`

टूल कॉल के व्यवहार के लिए, किसी `read` या `exec` कार्रवाई का प्रॉम्प्ट दें, ताकि आप
टूल स्ट्रीमिंग और पेलोड प्रबंधन देख सकें।

## पूरी तरह रीसेट करना

स्टेट OpenClaw स्टेट डायरेक्टरी में रहता है: डिफ़ॉल्ट रूप से `~/.openclaw`, या
सेट होने पर `$OPENCLAW_STATE_DIR`। उस डायरेक्टरी के सापेक्ष पाथ:

| पाथ                                           | इसमें क्या रहता है                                                              |
| ---------------------------------------------- | ------------------------------------------------------------------ |
| `openclaw.json`                                | कॉन्फ़िगरेशन                                                             |
| `state/openclaw.sqlite`                        | साझा रनटाइम स्टेट डेटाबेस                                      |
| `agents/<agentId>/agent/openclaw-agent.sqlite` | प्रत्येक एजेंट के मॉडल प्रमाणीकरण प्रोफ़ाइल (API कुंजियाँ + OAuth) और रनटाइम स्टेट |
| `credentials/`                                 | प्रमाणीकरण प्रोफ़ाइल स्टोर के बाहर प्रदाता/चैनल क्रेडेंशियल        |
| `agents/<agentId>/sessions/`                   | ट्रांसक्रिप्ट इतिहास और लेगेसी सेशन माइग्रेशन स्रोत            |
| `sessions/`                                    | लेगेसी एकल-एजेंट सेशन स्टोर (केवल पुराने इंस्टॉलेशन)              |
| `workspace/`                                   | डिफ़ॉल्ट एजेंट वर्कस्पेस (अतिरिक्त एजेंट `workspace-<agentId>` का उपयोग करते हैं)   |

पूर्ण रीसेट के लिए उन पाथ को हटाएँ। अधिक सीमित रीसेट:

- केवल सेशन: `agents/<agentId>/agent/openclaw-agent.sqlite` को न हटाएँ; सेशन पंक्तियाँ अन्य प्रति-एजेंट स्टेट के साथ वहीं रहती हैं। किसी एक चैट के लिए नया सेशन शुरू करने हेतु `/new` या `/reset`, और सेशन रखरखाव के लिए `openclaw sessions cleanup` का उपयोग करें।
- प्रमाणीकरण बनाए रखें: `agents/<agentId>/agent/openclaw-agent.sqlite` और `credentials/` को यथास्थान रहने दें।

लेगेसी `auth-profiles.json` फ़ाइलें अब रनटाइम पर नहीं पढ़ी जातीं;
`openclaw doctor --fix` उन्हें SQLite स्टोर में आयात करता है।

## संदर्भ

- [परीक्षण](/hi/help/testing)
- [आरंभ करना](/hi/start/getting-started)

## संबंधित

- [OpenClaw एजेंट रनटाइम आर्किटेक्चर](/hi/agent-runtime-architecture)
