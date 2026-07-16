---
read_when:
    - Hostinger पर OpenClaw सेट अप करना
    - OpenClaw के लिए प्रबंधित VPS खोज रहे हैं
    - Hostinger 1-क्लिक OpenClaw का उपयोग करना
summary: Hostinger पर OpenClaw होस्ट करें
title: Hostinger
x-i18n:
    generated_at: "2026-07-16T15:26:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 7dc49e741f8581928553e2426ed91f92df6e7b0c31dd8780c0d6e891a07be263
    source_path: install/hostinger.md
    workflow: 16
---

[Hostinger](https://www.hostinger.com/openclaw) पर एक स्थायी OpenClaw Gateway चलाएँ, या तो प्रबंधित **1-Click** परिनियोजन के रूप में या ऐसे **VPS** इंस्टॉलेशन के रूप में जिसे आप स्वयं प्रशासित करते हैं।

## पूर्वापेक्षाएँ

- Hostinger खाता ([साइन अप](https://www.hostinger.com/openclaw))
- लगभग 5-10 मिनट

## विकल्प A: 1-Click OpenClaw

Hostinger इन्फ़्रास्ट्रक्चर, Docker और स्वचालित अपडेट संभालता है। चालू इंस्टेंस पाने का सबसे तेज़ तरीका।

<Steps>
  <Step title="खरीदें और लॉन्च करें">
    1. [Hostinger OpenClaw पेज](https://www.hostinger.com/openclaw) से कोई Managed OpenClaw प्लान चुनें और चेकआउट पूरा करें।

    <Note>
    चेकआउट के दौरान आप पहले से खरीदे गए और OpenClaw के भीतर तुरंत एकीकृत होने वाले **Ready-to-Use AI** क्रेडिट चुन सकते हैं -- अन्य प्रदाताओं के किसी बाहरी खाते या API कुंजी की आवश्यकता नहीं है। आप तुरंत चैट करना शुरू कर सकते हैं। वैकल्पिक रूप से, सेटअप के दौरान Anthropic, OpenAI, Google Gemini या xAI की अपनी कुंजी दें।
    </Note>

  </Step>

  <Step title="मैसेजिंग चैनल चुनें">
    कनेक्ट करने के लिए एक या अधिक चैनल चुनें:

    - **WhatsApp** -- सेटअप विज़ार्ड में दिखाया गया QR कोड स्कैन करें।
    - **Telegram** -- [BotFather](https://t.me/BotFather) से मिला बॉट टोकन पेस्ट करें।

  </Step>

  <Step title="इंस्टॉलेशन पूरा करें">
    इंस्टेंस परिनियोजित करने के लिए **Finish** पर क्लिक करें। तैयार होने पर, hPanel में **OpenClaw Overview** से OpenClaw डैशबोर्ड खोलें।
  </Step>

</Steps>

## विकल्प B: VPS पर OpenClaw

सर्वर पर अधिक नियंत्रण। Hostinger आपके VPS पर Docker के माध्यम से OpenClaw परिनियोजित करता है; आप इसे hPanel में **Docker Manager** के माध्यम से प्रबंधित करते हैं।

<Steps>
  <Step title="VPS खरीदें">
    1. [Hostinger OpenClaw पेज](https://www.hostinger.com/openclaw) से OpenClaw on VPS प्लान चुनें और चेकआउट पूरा करें।

    <Note>
    आप चेकआउट के दौरान **Ready-to-Use AI** क्रेडिट चुन सकते हैं -- ये पहले से खरीदे गए होते हैं और OpenClaw के भीतर तुरंत एकीकृत हो जाते हैं, इसलिए आप अन्य प्रदाताओं के किसी बाहरी खाते या API कुंजी के बिना चैट करना शुरू कर सकते हैं।
    </Note>

  </Step>

  <Step title="OpenClaw कॉन्फ़िगर करें">
    VPS का प्रावधान हो जाने पर कॉन्फ़िगरेशन फ़ील्ड भरें:

    - **Gateway टोकन** -- स्वतः जनरेट होता है; बाद में उपयोग के लिए इसे सहेजें।
    - **WhatsApp नंबर** -- देश कोड सहित आपका नंबर (वैकल्पिक)।
    - **Telegram बॉट टोकन** -- [BotFather](https://t.me/BotFather) से (वैकल्पिक)।
    - **API कुंजियाँ** -- केवल तभी आवश्यक हैं, जब आपने चेकआउट के दौरान Ready-to-Use AI क्रेडिट नहीं चुने हों।

  </Step>

  <Step title="OpenClaw शुरू करें">
    **Deploy** पर क्लिक करें। चालू होने पर, **Open** पर क्लिक करके hPanel से OpenClaw डैशबोर्ड खोलें।
  </Step>

</Steps>

लॉग, रीस्टार्ट और अपडेट hPanel के Docker Manager इंटरफ़ेस से चलाए जाते हैं। अपडेट करने के लिए नवीनतम इमेज पुल करने हेतु Docker Manager में **Update** दबाएँ।

## अपने सेटअप की पुष्टि करें

कनेक्ट किए गए चैनल पर अपने सहायक को "नमस्ते" भेजें। OpenClaw उत्तर देता है और शुरुआती प्राथमिकताएँ तय करने में आपका मार्गदर्शन करता है।

## समस्या निवारण

**डैशबोर्ड लोड नहीं हो रहा है** -- कंटेनर का प्रावधान पूरा होने के लिए कुछ मिनट प्रतीक्षा करें, फिर hPanel में Docker Manager के लॉग जाँचें।

**Docker कंटेनर बार-बार रीस्टार्ट हो रहा है** -- Docker Manager के लॉग खोलें और कॉन्फ़िगरेशन त्रुटियाँ खोजें (टोकन मौजूद न होना, अमान्य API कुंजियाँ)।

**Telegram बॉट उत्तर नहीं दे रहा है** -- यदि DM पेयरिंग आवश्यक है, तो किसी अज्ञात प्रेषक को उत्तर के बजाय एक छोटा पेयरिंग कोड मिलता है। इसे OpenClaw डैशबोर्ड चैट से अनुमोदित करें, या यदि आपके पास कंटेनर की शेल एक्सेस है, तो `openclaw pairing approve telegram <CODE>` से अनुमोदित करें। [पेयरिंग](/hi/channels/pairing) देखें।

## अगले चरण

- [चैनल](/hi/channels) -- Telegram, WhatsApp, Discord और अन्य सेवाएँ कनेक्ट करें
- [Gateway कॉन्फ़िगरेशन](/hi/gateway/configuration) -- सभी कॉन्फ़िगरेशन विकल्प

## संबंधित

- [इंस्टॉलेशन अवलोकन](/hi/install)
- [VPS होस्टिंग](/hi/vps)
- [DigitalOcean](/hi/install/digitalocean)
