---
read_when:
    - आप OpenClaw को WeChat या Weixin से कनेक्ट करना चाहते हैं
    - आप openclaw-weixin चैनल Plugin इंस्टॉल कर रहे हैं या उसकी समस्या का निवारण कर रहे हैं
    - आपको यह समझना होगा कि बाहरी चैनल Plugin Gateway के साथ कैसे चलते हैं
summary: बाहरी openclaw-weixin Plugin के माध्यम से WeChat चैनल सेटअप
title: WeChat
x-i18n:
    generated_at: "2026-07-19T08:54:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 98faf95f9fb76deedb7df9adf3092083722a77bdd793de98c41a6f715cc0d14a
    source_path: channels/wechat.md
    workflow: 16
---

OpenClaw, Tencent के बाहरी
`@tencent-weixin/openclaw-weixin` चैनल Plugin के माध्यम से WeChat से कनेक्ट होता है।

स्थिति: बाहरी Plugin, जिसका रखरखाव Tencent Weixin टीम करती है। सीधे चैट और
मीडिया समर्थित हैं। समूह चैट को Plugin क्षमता
मेटाडेटा में प्रदर्शित नहीं किया गया है (यह केवल सीधे चैट घोषित करता है)।

## नामकरण

- **WeChat** इन दस्तावेज़ों में उपयोगकर्ता को दिखाई देने वाला नाम है।
- **Weixin** Tencent के पैकेज और Plugin आईडी द्वारा उपयोग किया जाने वाला नाम है।
- `openclaw-weixin` OpenClaw चैनल आईडी है (`weixin` और `wechat` उपनाम के रूप में काम करते हैं)।
- `@tencent-weixin/openclaw-weixin` npm पैकेज है।

CLI कमांड और कॉन्फ़िगरेशन पथों में `openclaw-weixin` का उपयोग करें।

## यह कैसे काम करता है

WeChat कोड OpenClaw के मुख्य रिपॉज़िटरी में नहीं रहता। OpenClaw
सामान्य चैनल Plugin अनुबंध प्रदान करता है, और बाहरी Plugin
WeChat-विशिष्ट रनटाइम प्रदान करता है:

1. `openclaw plugins install`, `@tencent-weixin/openclaw-weixin` को इंस्टॉल करता है।
2. Gateway, Plugin मेनिफ़ेस्ट का पता लगाता है और Plugin प्रवेश-बिंदु लोड करता है।
3. Plugin, चैनल आईडी `openclaw-weixin` पंजीकृत करता है।
4. `openclaw channels login --channel openclaw-weixin`, QR लॉगिन शुरू करता है।
5. Plugin, OpenClaw स्थिति डायरेक्टरी के अंतर्गत खाते के क्रेडेंशियल संग्रहीत करता है
   (डिफ़ॉल्ट रूप से `~/.openclaw`)।
6. Gateway शुरू होने पर, Plugin प्रत्येक
   कॉन्फ़िगर किए गए खाते के लिए अपना Weixin मॉनिटर शुरू करता है।
7. आने वाले WeChat संदेशों को चैनल अनुबंध के माध्यम से सामान्यीकृत किया जाता है, चयनित
   OpenClaw एजेंट तक रूट किया जाता है और Plugin के आउटबाउंड पथ के माध्यम से वापस भेजा जाता है।

यह पृथक्करण महत्वपूर्ण है: OpenClaw का मुख्य भाग चैनल-अज्ञेय रहता है। WeChat लॉगिन,
Tencent iLink API कॉल, मीडिया अपलोड/डाउनलोड, संदर्भ टोकन और खाते की
निगरानी का स्वामित्व बाहरी Plugin के पास है।

## इंस्टॉल करना

त्वरित इंस्टॉल:

```bash
npx -y @tencent-weixin/openclaw-weixin-cli install
```

मैन्युअल इंस्टॉल:

```bash
openclaw plugins install "@tencent-weixin/openclaw-weixin"
openclaw config set plugins.entries.openclaw-weixin.enabled true
```

इंस्टॉल करने के बाद Gateway पुनः आरंभ करें:

```bash
openclaw gateway restart
```

## लॉगिन

QR लॉगिन उसी मशीन पर चलाएँ जिस पर Gateway चलता है:

```bash
openclaw channels login --channel openclaw-weixin
```

अपने फ़ोन पर WeChat से QR कोड स्कैन करें और लॉगिन की पुष्टि करें। सफलतापूर्वक स्कैन होने के बाद Plugin
खाता टोकन को स्थानीय रूप से सहेजता है।

एक और WeChat खाता जोड़ने के लिए, वही लॉगिन कमांड फिर से चलाएँ। एकाधिक
खातों के लिए, सीधे-संदेश सत्रों को खाते, चैनल और प्रेषक के अनुसार अलग करें:

```bash
openclaw config set session.dmScope per-account-channel-peer
```

## अभिगम नियंत्रण

सीधे संदेश चैनल
Plugins के लिए सामान्य OpenClaw पेयरिंग और अनुमत-सूची मॉडल का उपयोग करते हैं।

नए प्रेषकों को स्वीकृत करें:

```bash
openclaw pairing list openclaw-weixin
openclaw pairing approve openclaw-weixin <CODE>
```

संपूर्ण अभिगम-नियंत्रण मॉडल के लिए, [पेयरिंग](/hi/channels/pairing) देखें।

## संगतता

Plugin आरंभ होने पर होस्ट OpenClaw संस्करण की जाँच करता है।

| Plugin शृंखला | OpenClaw संस्करण                                                | npm टैग  |
| ----------- | --------------------------------------------------------------- | -------- |
| `2.x`       | `>=2026.5.12` (वर्तमान 2.4.6; शुरुआती 2.x ने `>=2026.3.22` स्वीकार किया) | `latest` |
| `1.x`       | `>=2026.1.0 <2026.3.22`                                         | `legacy` |

यदि Plugin बताता है कि आपका OpenClaw संस्करण बहुत पुराना है, तो या तो
OpenClaw अपडेट करें या पुरानी Plugin शृंखला इंस्टॉल करें:

```bash
openclaw plugins install @tencent-weixin/openclaw-weixin@legacy
```

## साइडकार प्रक्रिया

Tencent iLink API की निगरानी करते समय WeChat Plugin, Gateway के साथ-साथ
सहायक कार्य चला सकता है। समस्या #68451 में, उस सहायक पथ ने OpenClaw की
सामान्य पुराने-Gateway सफ़ाई में एक बग उजागर किया: कोई चाइल्ड प्रक्रिया पैरेंट
Gateway प्रक्रिया की सफ़ाई करने का प्रयास कर सकती थी, जिससे systemd जैसे प्रक्रिया प्रबंधकों के अंतर्गत पुनः आरंभ लूप उत्पन्न होते थे।

OpenClaw की वर्तमान स्टार्टअप सफ़ाई मौजूदा प्रक्रिया और उसके पूर्वजों को शामिल नहीं करती,
इसलिए कोई चैनल सहायक उस Gateway को समाप्त नहीं कर सकता जिसने उसे शुरू किया था। यह सुधार
सामान्य है; यह मुख्य भाग में WeChat-विशिष्ट पथ नहीं है।

## समस्या निवारण

इंस्टॉल और स्थिति जाँचें:

```bash
openclaw plugins list
openclaw channels status --probe
openclaw --version
```

यदि चैनल इंस्टॉल हुआ दिखता है लेकिन कनेक्ट नहीं होता, तो पुष्टि करें कि Plugin
सक्षम है और फिर पुनः आरंभ करें:

```bash
openclaw config set plugins.entries.openclaw-weixin.enabled true
openclaw gateway restart
```

यदि WeChat सक्षम करने के बाद Gateway बार-बार पुनः आरंभ होता है, तो OpenClaw और
Plugin दोनों को अपडेट करें:

```bash
npm view @tencent-weixin/openclaw-weixin version
openclaw plugins install "@tencent-weixin/openclaw-weixin" --force
openclaw gateway restart
```

यदि स्टार्टअप बताता है कि इंस्टॉल किया गया Plugin पैकेज `requires compiled runtime
output for TypeScript entry`, तो npm पैकेज उन संकलित
JavaScript रनटाइम फ़ाइलों के बिना प्रकाशित किया गया था जिनकी OpenClaw को आवश्यकता है। Plugin
प्रकाशक द्वारा सुधारा गया पैकेज जारी करने के बाद अपडेट/पुनः इंस्टॉल करें, या Plugin को अस्थायी रूप से अक्षम/अनइंस्टॉल करें।

अस्थायी रूप से अक्षम करना:

```bash
openclaw config set plugins.entries.openclaw-weixin.enabled false
openclaw gateway restart
```

## संबंधित दस्तावेज़

- चैनल अवलोकन: [चैट चैनल](/hi/channels)
- पेयरिंग: [पेयरिंग](/hi/channels/pairing)
- चैनल रूटिंग: [चैनल रूटिंग](/hi/channels/channel-routing)
- Plugin आर्किटेक्चर: [Plugin आर्किटेक्चर](/hi/plugins/architecture)
- चैनल Plugin SDK: [चैनल Plugin SDK](/hi/plugins/sdk-channel-plugins)
- बाहरी पैकेज: [@tencent-weixin/openclaw-weixin](https://www.npmjs.com/package/@tencent-weixin/openclaw-weixin)
