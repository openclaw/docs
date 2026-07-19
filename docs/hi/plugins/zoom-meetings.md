---
read_when:
    - आप चाहते हैं कि कोई OpenClaw एजेंट Zoom मीटिंग में शामिल हो
    - आप Zoom मीटिंग में प्रत्युत्तर देने के लिए Chrome, BlackHole, या SoX कॉन्फ़िगर कर रहे हैं
summary: 'Zoom मीटिंग Plugin: Chrome ब्राउज़र अतिथि के रूप में मीटिंग में शामिल हों'
title: Zoom मीटिंग Plugin
x-i18n:
    generated_at: "2026-07-19T09:10:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: a647a135e908b8f56eacaaefd4b42ca87161f611edb8eac335553414850ebec2
    source_path: plugins/zoom-meetings.md
    workflow: 16
---

`zoom-meetings` Plugin, OpenClaw Chrome प्रोफ़ाइल में Zoom Web App के माध्यम से अतिथि के रूप में Zoom मीटिंग लिंक से जुड़ता है। यह `zoom.us/j/...` के अंतर्गत मीटिंग लिंक और `example.zoom.us/j/...` जैसे खाता सबडोमेन स्वीकार करता है। यह मीटिंग बनाता नहीं है, डायल इन नहीं करता है, Zoom Meeting SDK का उपयोग नहीं करता है और मीटिंग रिकॉर्ड नहीं करता है।

## सेटअप

वापस बोलने की सुविधा के लिए [Google Meet Plugin](/hi/plugins/google-meet) जैसी ही स्थानीय ऑडियो पूर्वापेक्षाएँ आवश्यक हैं: macOS, `BlackHole 2ch` वर्चुअल ऑडियो डिवाइस और SoX।

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
      "zoom-meetings": {
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
openclaw zoommeetings setup
openclaw zoommeetings join 'https://zoom.us/j/1234567890'
```

युग्मित macOS Node पर Chrome, BlackHole और SoX चलाने के लिए `chromeNode.node` का उपयोग करें। Node को `zoommeetings.chrome` और `browser.proxy` की अनुमति देनी होगी।

## मोड

| मोड         | व्यवहार                                                                    |
| ------------ | --------------------------------------------------------------------------- |
| `agent`      | रीयल-टाइम ट्रांसक्रिप्शन कॉन्फ़िगर किए गए OpenClaw एजेंट से परामर्श करता है; TTS उत्तर देता है। |
| `bidi`       | रीयल-टाइम वॉइस मॉडल सीधे सुनता और उत्तर देता है।                        |
| `transcribe` | लाइव-कैप्शन ट्रांसक्रिप्ट स्नैपशॉट के साथ केवल-अवलोकन हेतु जुड़ता है।                   |

ट्रांसक्राइब मोड प्रवेश मिलने के बाद Zoom लाइव कैप्शन सक्षम करता है और सीमित कैप्शन डिस्प्ले कैप्चर करता है। `transcript` कार्रवाई सक्रिय OpenClaw मीटिंग सत्र के लिए कैप्शन बफ़र लौटाती है।

## अतिथि के रूप में जुड़ने की सीमाएँ

ब्राउज़र अडैप्टर **Join from browser** चुनता है, अतिथि का नाम भरता है, कैमरा बंद करता है, चयनित मोड के लिए माइक्रोफ़ोन कॉन्फ़िगर करता है और **Join** पर क्लिक करता है। Zoom Web App, `app.zoom.us` के अंतर्गत चलता है; Plugin नेविगेशन से पहले उस ओरिजिन को माइक्रोफ़ोन और स्पीकर-चयन अनुमतियाँ देता है। कॉल के दौरान की स्थिति Zoom के Leave नियंत्रण का उपयोग करती है। लॉबी, साइन-इन, पासकोड, CAPTCHA और डिवाइस-अनुमति स्थितियाँ स्पष्ट मैन्युअल-कार्रवाई कारण लौटाती हैं।

Zoom होस्ट और खाता नीति ब्राउज़र से जुड़ना अक्षम कर सकती है, प्रमाणीकरण या ईमेल सत्यापन आवश्यक कर सकती है, CAPTCHA दिखा सकती है या होस्ट की प्रवेश-स्वीकृति आवश्यक कर सकती है। OpenClaw Chrome प्रोफ़ाइल में वह चरण पूरा करें, फिर स्थिति या वाक् सुविधा का पुनः प्रयास करें। Plugin Zoom नीति को बायपास नहीं करता है।

Zoom Web App को आधिकारिक Zoom परीक्षण मीटिंग के साथ ऐप इंटरस्टिशियल, iframe में अतिथि-नाम प्रविष्टि, शामिल होने से पहले माइक्रोफ़ोन और कैमरा नियंत्रण, मीटिंग से जुड़ने, ब्राउज़र और macOS मीडिया अनुमतियों, कॉल के दौरान होने की पहचान, लाइव-कैप्शन सक्षमता और होस्ट द्वारा मीटिंग समाप्त किए जाने की पहचान के लिए लाइव सत्यापित किया गया है। लॉबी और प्रमाणीकरण स्थितियाँ होस्ट नीति पर निर्भर करती हैं और कोई स्थिर DOM पहचानकर्ता उपलब्ध न होने पर टेक्स्ट फ़ॉलबैक बनाए रखती हैं।

## टूल और Gateway सतह

`zoom_meetings` एजेंट टूल, `join`, `leave`, `status`, `transcript` और `speak` का समर्थन करता है। Gateway विधियाँ `zoommeetings.*` उपसर्ग का उपयोग करती हैं। Node कमांड `zoommeetings.chrome` है।

## संबंधित

- [मीटिंग Plugin का अवलोकन](/plugins/meeting-plugins)
