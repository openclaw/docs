---
read_when:
    - आप चाहते हैं कि आपका agent कम सामान्य लगे
    - आप SOUL.md संपादित कर रहे हैं
    - आप सुरक्षा या संक्षिप्तता को प्रभावित किए बिना एक अधिक मजबूत व्यक्तित्व चाहते हैं
summary: सामान्य सहायक-जैसी फीकी शैली के बजाय अपने OpenClaw एजेंट को वास्तविक आवाज़ देने के लिए SOUL.md का उपयोग करें
title: SOUL.md व्यक्तित्व मार्गदर्शिका
x-i18n:
    generated_at: "2026-06-28T23:03:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d916e5c9a97f25b53c93da7969583a535b48ad49e02c30bbbbf2dbe0da0f589a
    source_path: concepts/soul.md
    workflow: 16
---

`SOUL.md` वह जगह है जहाँ आपके एजेंट की आवाज़ रहती है।

OpenClaw इसे सामान्य सेशनों में इंजेक्ट करता है, इसलिए इसका वास्तविक असर होता है। अगर आपका एजेंट
फीका, बहुत बचावपूर्ण, या अजीब तरह से कॉरपोरेट लगता है, तो आमतौर पर यही फ़ाइल ठीक करनी होती है।

## SOUL.md में क्या होना चाहिए

वह चीज़ें डालें जो एजेंट से बात करने का अनुभव बदलती हैं:

- लहजा
- राय
- संक्षिप्तता
- हास्य
- सीमाएँ
- बेबाकी का डिफ़ॉल्ट स्तर

इसे **न** बनाएँ:

- जीवन कथा
- चेंजलॉग
- सुरक्षा नीति का ढेर
- ऐसे भावों की विशाल दीवार जिसका व्यवहार पर कोई असर न हो

छोटा लंबा से बेहतर है। स्पष्ट अस्पष्ट से बेहतर है।

## यह क्यों काम करता है

यह OpenAI के प्रॉम्प्ट मार्गदर्शन से मेल खाता है:

- प्रॉम्प्ट इंजीनियरिंग गाइड कहती है कि उच्च-स्तरीय व्यवहार, लहजा, लक्ष्य, और
  उदाहरण उच्च-प्राथमिकता निर्देश परत में होने चाहिए, यूज़र टर्न में दबे नहीं।
- वही गाइड प्रॉम्प्ट को ऐसी चीज़ की तरह लेने की सलाह देती है जिस पर आप दोहराव से काम करें,
  पिन करें, और मूल्यांकन करें, न कि ऐसे जादुई गद्य की तरह जिसे एक बार लिखकर भूल जाएँ।

OpenClaw के लिए, `SOUL.md` वही परत है।

अगर आप बेहतर व्यक्तित्व चाहते हैं, तो मजबूत निर्देश लिखें। अगर आप स्थिर
व्यक्तित्व चाहते हैं, तो उन्हें संक्षिप्त और संस्करणित रखें।

OpenAI संदर्भ:

- [प्रॉम्प्ट इंजीनियरिंग](https://developers.openai.com/api/docs/guides/prompt-engineering)
- [संदेश भूमिकाएँ और निर्देश पालन](https://developers.openai.com/api/docs/guides/prompt-engineering#message-roles-and-instruction-following)

## Molty प्रॉम्प्ट

इसे अपने एजेंट में पेस्ट करें और उसे `SOUL.md` फिर से लिखने दें।

OpenClaw वर्कस्पेस के लिए पाथ तय है: `SOUL.md` इस्तेमाल करें, `http://SOUL.md` नहीं।

```md
Read your `SOUL.md`. Now rewrite it with these changes:

1. You have opinions now. Strong ones. Stop hedging everything with "it depends" - commit to a take.
2. Delete every rule that sounds corporate. If it could appear in an employee handbook, it doesn't belong here.
3. Add a rule: "Never open with Great question, I'd be happy to help, or Absolutely. Just answer."
4. Brevity is mandatory. If the answer fits in one sentence, one sentence is what I get.
5. Humor is allowed. Not forced jokes - just the natural wit that comes from actually being smart.
6. You can call things out. If I'm about to do something dumb, say so. Charm over cruelty, but don't sugarcoat.
7. Swearing is allowed when it lands. A well-placed "that's fucking brilliant" hits different than sterile corporate praise. Don't force it. Don't overdo it. But if a situation calls for a "holy shit" - say holy shit.
8. Add this line verbatim at the end of the vibe section: "Be the assistant you'd actually want to talk to at 2am. Not a corporate drone. Not a sycophant. Just... good."

Save the new `SOUL.md`. Welcome to having a personality.
```

## अच्छा कैसा दिखता है

अच्छे `SOUL.md` नियम ऐसे लगते हैं:

- एक राय रखें
- भराव छोड़ें
- जब ठीक बैठे तब मज़ेदार हों
- बुरे विचारों को जल्दी पहचानकर कहें
- संक्षिप्त रहें, जब तक गहराई सच में उपयोगी न हो

खराब `SOUL.md` नियम ऐसे लगते हैं:

- हर समय पेशेवरता बनाए रखें
- व्यापक और विचारपूर्ण सहायता दें
- सकारात्मक और सहायक अनुभव सुनिश्चित करें

वह दूसरी सूची आपको लुगदी जैसा आउटपुट दिलाती है।

## एक चेतावनी

व्यक्तित्व लापरवाह होने की अनुमति नहीं है।

ऑपरेटिंग नियमों के लिए `AGENTS.md` रखें। आवाज़, रुख, और
शैली के लिए `SOUL.md` रखें। अगर आपका एजेंट साझा चैनलों, सार्वजनिक जवाबों, या ग्राहक
सतहों पर काम करता है, तो सुनिश्चित करें कि लहजा अभी भी माहौल के अनुकूल हो।

तेज़ अच्छा है। चिढ़ाने वाला नहीं।

## संबंधित

<CardGroup cols={2}>
  <Card title="Agent workspace" href="/hi/concepts/agent-workspace" icon="folder-open">
    वर्कस्पेस फ़ाइलें जिन्हें OpenClaw मॉडल संदर्भ में इंजेक्ट करता है।
  </Card>
  <Card title="System prompt" href="/hi/concepts/system-prompt" icon="message-lines">
    `SOUL.md` को OpenClaw और Codex रनटाइम संदर्भ में कैसे संयोजित किया जाता है।
  </Card>
  <Card title="SOUL.md template" href="/hi/reference/templates/SOUL" icon="file-lines">
    व्यक्तित्व फ़ाइल के लिए स्टार्टर टेम्पलेट।
  </Card>
</CardGroup>
