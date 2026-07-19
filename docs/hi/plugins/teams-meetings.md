---
read_when:
    - आप चाहते हैं कि OpenClaw एजेंट Microsoft Teams मीटिंग में शामिल हो
    - आप Teams मीटिंग में जवाबी बातचीत के लिए Chrome, BlackHole, या SoX कॉन्फ़िगर कर रहे हैं
summary: 'Microsoft Teams मीटिंग Plugin: Chrome ब्राउज़र अतिथि के रूप में कार्यस्थल या उपभोक्ता मीटिंग में शामिल हों'
title: Microsoft Teams मीटिंग Plugin
x-i18n:
    generated_at: "2026-07-19T09:25:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: ff20854cca39dcf66d2916eff19c00e08136bf944dfb0274cf8f7cb3c8e77730
    source_path: plugins/teams-meetings.md
    workflow: 16
---

`teams-meetings` Plugin, OpenClaw Chrome प्रोफ़ाइल में अतिथि के रूप में Microsoft Teams लिंक से जुड़ता है। यह `teams.microsoft.com/l/meetup-join/...` के अंतर्गत कार्यस्थल लिंक और `teams.live.com/meet/...` के अंतर्गत उपभोक्ता लिंक स्वीकार करता है। यह मीटिंग बनाता नहीं है, डायल इन नहीं करता, Microsoft Graph को कॉल नहीं करता और मीटिंग रिकॉर्ड नहीं करता।

## सेटअप

बोलकर जवाब देने की सुविधा उन्हीं स्थानीय ऑडियो पूर्वापेक्षाओं का उपयोग करती है जिनका [Google Meet Plugin](/hi/plugins/google-meet) करता है: macOS, `BlackHole 2ch` वर्चुअल ऑडियो डिवाइस और SoX।

```bash
brew install blackhole-2ch sox
sudo reboot
system_profiler SPAudioDataType | grep -i BlackHole
command -v sox
```

Plugin सक्षम करें, फिर सेटअप जाँचें:

```json5
{
  plugins: {
    entries: {
      "teams-meetings": {
        enabled: true,
        config: {
          defaultMode: "agent",
          chrome: { guestName: "OpenClaw Agent" },
        },
      },
    },
  },
}
```

```bash
openclaw teamsmeetings setup
openclaw teamsmeetings join 'https://teams.microsoft.com/l/meetup-join/...'
```

युग्मित macOS Node पर Chrome, BlackHole और SoX चलाने के लिए `chromeNode.node` का उपयोग करें। Node को `teamsmeetings.chrome` और `browser.proxy` की अनुमति देनी होगी।

## मोड

| मोड         | व्यवहार                                                                    |
| ------------ | --------------------------------------------------------------------------- |
| `agent`      | रीयल-टाइम ट्रांसक्रिप्शन कॉन्फ़िगर किए गए OpenClaw एजेंट से परामर्श करता है; TTS उत्तर देता है। |
| `bidi`       | रीयल-टाइम वॉइस मॉडल सुनता है और सीधे उत्तर देता है।                        |
| `transcribe` | लाइव-कैप्शन ट्रांसक्रिप्ट स्नैपशॉट के साथ केवल-अवलोकन हेतु जुड़ता है।                   |

ट्रांसक्राइब मोड प्रवेश मिलने के बाद Teams लाइव कैप्शन सक्षम करता है और वक्ता के नाम वाली कैप्शन पंक्तियाँ कैप्चर करता है। `transcript` कार्रवाई सक्रिय OpenClaw मीटिंग सत्र के लिए सीमित कैप्शन बफ़र लौटाती है।

## अतिथि के रूप में जुड़ने की सीमाएँ

ब्राउज़र अडैप्टर ऐप इंटरस्टिशियल को बंद करता है, अतिथि नाम भरता है, कैमरा बंद करता है, चयनित मोड के लिए माइक्रोफ़ोन कॉन्फ़िगर करता है और जुड़ने के बटन पर क्लिक करता है। कॉल में होने की स्थिति में कॉल समाप्त करने वाले नियंत्रण का उपयोग किया जाता है; लॉबी, टेनेंट साइन-इन और डिवाइस-अनुमति स्थितियाँ मैन्युअल कार्रवाई की स्पष्ट वजहें लौटाती हैं। उपभोक्ता मीटिंग लॉन्चर के रीडायरेक्ट और Chrome द्वारा दिखाए गए `BlackHole 2ch (Virtual)` लेबल समर्थित हैं।

Teams टेनेंट नीति साइन-इन, ईमेल सत्यापन या आयोजक की स्वीकृति अनिवार्य कर सकती है। उस चरण को OpenClaw Chrome प्रोफ़ाइल में पूरा करें, फिर स्थिति या वाक् क्रिया को पुनः आज़माएँ। Plugin टेनेंट नीति को बायपास नहीं करता।

उपभोक्ता Teams वेब क्लाइंट को ऐप इंटरस्टिशियल, अतिथि-नाम प्रविष्टि, मीटिंग में जुड़ने से पहले माइक्रोफ़ोन/कैमरा टॉगल, मीटिंग में जुड़ना, लॉबी से प्रवेश, मीडिया अनुमतियाँ, कॉल में होने की पहचान, लाइव कैप्शन, BlackHole इनपुट/आउटपुट रूटिंग, कॉल छोड़ना और कॉल के बाद की स्थिति की पहचान के लिए लाइव सत्यापित किया गया है। कार्यस्थल टेनेंट अलग साइन-इन, ईमेल-सत्यापन, प्रवेश और कॉल छोड़ने की पुष्टि संबंधी नीति लागू कर सकते हैं; रिपोर्ट की गई किसी भी मैन्युअल कार्रवाई को OpenClaw Chrome प्रोफ़ाइल में पूरा करें।

## टूल और Gateway सतह

`teams_meetings` एजेंट टूल `join`, `leave`, `status`, `transcript` और `speak` का समर्थन करता है। Gateway विधियाँ `teamsmeetings.*` उपसर्ग का उपयोग करती हैं। Node कमांड `teamsmeetings.chrome` है।

## संबंधित

- [मीटिंग Plugin का अवलोकन](/hi/plugins/meeting-plugins)
- [Microsoft Teams चैनल](/hi/channels/msteams)
