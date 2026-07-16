---
read_when:
    - आप microsoft-foundry Plugin को इंस्टॉल, कॉन्फ़िगर या ऑडिट कर रहे हैं
summary: OpenClaw में Microsoft Foundry मॉडल प्रदाता का समर्थन जोड़ता है।
title: Microsoft Foundry Plugin
x-i18n:
    generated_at: "2026-07-16T16:31:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f2ea554ce16cffeb4cc315e53d986d6f07b5e113fbb844c61c6575f19f8ad291
    source_path: plugins/reference/microsoft-foundry.md
    workflow: 16
---

# Microsoft Foundry Plugin

OpenClaw में Microsoft Foundry मॉडल प्रदाता समर्थन जोड़ता है।

## वितरण

- पैकेज: `@openclaw/microsoft-foundry`
- इंस्टॉल मार्ग: OpenClaw में शामिल

## सतह

प्रदाता: `microsoft-foundry`; अनुबंध: `imageGenerationProviders`

<!-- openclaw-plugin-reference:manual-start -->

- इमेज-जनरेशन प्रदाता: `microsoft-foundry`

## आवश्यकताएँ

- डिप्लॉयमेंट वाला Microsoft Foundry या Azure AI Foundry संसाधन।
- `AZURE_OPENAI_API_KEY` के माध्यम से API-कुंजी प्रमाणीकरण या कॉन्फ़िगर की गई प्रदाता API कुंजी।
- Entra ID प्रमाणीकरण के लिए, Azure CLI इंस्टॉल करें और ऑनबोर्डिंग से पहले
  `az login` चलाएँ। OpenClaw, Microsoft Foundry रनटाइम टोकन को
  `az account get-access-token` के माध्यम से रीफ़्रेश करता है।

## चैट मॉडल

Microsoft Foundry चैट डिप्लॉयमेंट प्रदाता मॉडल संदर्भ
`microsoft-foundry/<deployment-name>` का उपयोग करते हैं। ऑनबोर्डिंग Azure CLI की सहायता से Foundry संसाधनों
और डिप्लॉयमेंट का पता लगाती है, फिर चयनित डिप्लॉयमेंट का नाम
मॉडल कॉन्फ़िगरेशन में लिखती है।

OpenClaw समर्थित OpenAI-संगत चैट API के लिए Foundry
`/openai/v1` एंडपॉइंट का उपयोग करता है:

- GPT, `o*`, `computer-use-preview`, और DeepSeek-V4 मॉडल परिवारों के लिए डिफ़ॉल्ट
  `openai-responses` है।
- MAI-DS-R1 और अन्य चैट-कम्प्लीशन डिप्लॉयमेंट `openai-completions` का उपयोग करते हैं,
  जब तक कि कोई स्पष्ट समर्थित API कॉन्फ़िगर न की गई हो।
- MAI-DS-R1 को `reasoning_effort` के माध्यम से नहीं, बल्कि रीजनिंग सामग्री के माध्यम से
  रीजनिंग-सक्षम के रूप में दर्ज किया जाता है। इसका संदर्भ और आउटपुट टोकन मेटाडेटा
  163,840 टोकन है।

Microsoft Foundry में Anthropic Claude डिप्लॉयमेंट, OpenAI-संगत
`/openai/v1` आकार के बजाय Anthropic Messages API आकार का उपयोग करते हैं। Microsoft Foundry Plugin में
मूल Anthropic रनटाइम आने तक इन्हें कस्टम `anthropic-messages` प्रदाता के रूप में
कॉन्फ़िगर करें। जब Foundry डिप्लॉयमेंट का नाम Claude मॉडल ID से अलग हो, तो
मॉडल प्रविष्टि पर `params.canonicalModelId` सेट करें, ताकि OpenClaw
मॉडल-विशिष्ट वायर अनुबंध लागू कर सके, `/think off` को सही ढंग से मैप कर सके, और
हस्ताक्षरित थिंकिंग को सुरक्षित रूप से संरक्षित कर सके।

## MAI इमेज जनरेशन

Plugin मौजूदा Microsoft AI इमेज मॉडल के साथ `image_generate` के लिए
`microsoft-foundry` पंजीकृत करता है:

- `MAI-Image-2.5-Flash`
- `MAI-Image-2.5`
- `MAI-Image-2e`
- `MAI-Image-2`

डिप्लॉय किए गए MAI इमेज डिप्लॉयमेंट नाम को मॉडल संदर्भ के रूप में उपयोग करें। प्रदाता
किसी डिफ़ॉल्ट इमेज मॉडल की घोषणा नहीं करता, क्योंकि MAI API को अनुरोध के
`model` फ़ील्ड में आपके डिप्लॉयमेंट नाम की आवश्यकता होती है:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "microsoft-foundry/<deployment-name>",
        timeoutMs: 600000,
      },
    },
  },
}
```

केवल-प्रॉम्प्ट जनरेशन Microsoft Foundry के MAI जनरेशन एंडपॉइंट को कॉल करता है:
`/mai/v1/images/generations`। संदर्भ-इमेज संपादन
`/mai/v1/images/edits` को कॉल करते हैं और `MAI-Image-2.5-Flash` तथा
`MAI-Image-2.5` डिप्लॉयमेंट तक सीमित हैं।

केवल-प्रॉम्प्ट जनरेशन केवल Foundry एंडपॉइंट कॉन्फ़िगर करके कस्टम डिप्लॉयमेंट नाम का उपयोग कर सकता है।
कस्टम डिप्लॉयमेंट नाम के साथ इमेज संपादन के लिए, ऑनबोर्डिंग के माध्यम से
डिप्लॉयमेंट चुनें या मॉडल मेटाडेटा शामिल करें, ताकि OpenClaw सत्यापित कर सके
कि डिप्लॉयमेंट `MAI-Image-2.5-Flash` या `MAI-Image-2.5` द्वारा समर्थित है।

MAI इमेज सीमाएँ:

- आउटपुट: प्रति अनुरोध एक PNG इमेज।
- आकार: डिफ़ॉल्ट `1024x1024`; चौड़ाई और ऊँचाई दोनों कम-से-कम 768 px होनी चाहिए।
- कुल पिक्सेल: चौड़ाई × ऊँचाई अधिकतम 1,048,576 होनी चाहिए।
- संपादन: एक PNG या JPEG इनपुट इमेज।
- `aspectRatio`, `resolution`, `quality`,
  `background`, और गैर-PNG `outputFormat` जैसे असमर्थित साझा संकेत Microsoft Foundry को नहीं भेजे जाते।

## समस्या निवारण

- `az: command not found`: Azure CLI इंस्टॉल करें या API-कुंजी प्रमाणीकरण का उपयोग करें।
- `Microsoft Foundry endpoint missing for MAI image generation`: ऑनबोर्डिंग के माध्यम से
  Foundry डिप्लॉयमेंट चुनें या `models.providers.microsoft-foundry.baseUrl` जोड़ें।
- `supports MAI image deployments only`: चयनित इमेज मॉडल किसी
  गैर-MAI डिप्लॉयमेंट की ओर इंगित करता है। `image_generate` के लिए डिप्लॉय किया गया MAI इमेज मॉडल उपयोग करें।

<!-- openclaw-plugin-reference:manual-end -->
