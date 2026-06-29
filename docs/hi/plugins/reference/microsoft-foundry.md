---
read_when:
    - आप microsoft-foundry Plugin को इंस्टॉल, कॉन्फ़िगर या ऑडिट कर रहे हैं
summary: OpenClaw में Microsoft Foundry मॉडल प्रदाता समर्थन जोड़ता है।
title: Microsoft Foundry Plugin
x-i18n:
    generated_at: "2026-06-28T23:46:26Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c120a68393626e5ff9f24cd80bce4612a3772faf3722b93f2ff4677f743d0252
    source_path: plugins/reference/microsoft-foundry.md
    workflow: 16
---

# Microsoft Foundry Plugin

OpenClaw में Microsoft Foundry मॉडल प्रदाता समर्थन जोड़ता है।

## वितरण

- पैकेज: `@openclaw/microsoft-foundry`
- इंस्टॉल मार्ग: OpenClaw में शामिल

## Surface

providers: microsoft-foundry; contracts: imageGenerationProviders

<!-- openclaw-plugin-reference:manual-start -->

- छवि-जनरेशन प्रदाता: `microsoft-foundry`

## आवश्यकताएँ

- deployments वाला Microsoft Foundry या Azure AI Foundry संसाधन।
- `AZURE_OPENAI_API_KEY` या कॉन्फ़िगर की गई प्रदाता API key के माध्यम से API-key auth।
- Entra ID auth के लिए, Azure CLI इंस्टॉल करें और onboarding से पहले
  `az login` चलाएँ। OpenClaw Microsoft Foundry रनटाइम टोकन को
  `az account get-access-token` के माध्यम से रीफ़्रेश करता है।

## चैट मॉडल

Microsoft Foundry चैट deployments प्रदाता मॉडल ref
`microsoft-foundry/<deployment-name>` का उपयोग करते हैं। Onboarding Azure CLI के साथ Foundry संसाधन
और deployments खोजता है, फिर चयनित deployment नाम को
मॉडल config में लिखता है।

OpenClaw समर्थित OpenAI-संगत
चैट API के लिए Foundry `/openai/v1` endpoint का उपयोग करता है:

- GPT, `o*`, `computer-use-preview`, और DeepSeek-V4 मॉडल परिवार डिफ़ॉल्ट रूप से
  `openai-responses` का उपयोग करते हैं।
- MAI-DS-R1 और अन्य chat-completion deployments `openai-completions` का उपयोग करते हैं,
  जब तक कि कोई स्पष्ट समर्थित API कॉन्फ़िगर न हो।
- MAI-DS-R1 को reasoning-capable के रूप में reasoning content के माध्यम से दर्ज किया जाता है, न कि
  `reasoning_effort` के माध्यम से। इसका context और output token metadata
  163,840 tokens है।

Microsoft Foundry में Anthropic Claude deployments Anthropic Messages
API shape का उपयोग करते हैं, OpenAI-संगत `/openai/v1` shape का नहीं। जब तक Microsoft Foundry Plugin में
native Anthropic runtime नहीं आता, उन्हें custom `anthropic-messages` प्रदाता के रूप में कॉन्फ़िगर करें। जब Foundry deployment नाम
Claude model ID से अलग हो, तो model entry पर `params.canonicalModelId` सेट करें ताकि OpenClaw
model-specific wire contracts लागू कर सके, `/think off` को सही ढंग से map कर सके, और
signed thinking को सुरक्षित रूप से संरक्षित रख सके।

## MAI छवि जनरेशन

Plugin मौजूदा
Microsoft AI image models के साथ `image_generate` के लिए `microsoft-foundry` रजिस्टर करता है:

- `MAI-Image-2.5-Flash`
- `MAI-Image-2.5`
- `MAI-Image-2e`
- `MAI-Image-2`

model ref के रूप में deployed MAI image deployment नाम का उपयोग करें। प्रदाता
default image model घोषित नहीं करता क्योंकि MAI API को request `model` field में आपका deployment
नाम चाहिए:

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

Prompt-only generation calls Microsoft Foundry's MAI generations endpoint:
`/mai/v1/images/generations`. Reference-image edits call
`/mai/v1/images/edits` and are limited to `MAI-Image-2.5-Flash` and
`MAI-Image-2.5` deployments.

Prompt-only generation केवल Foundry
endpoint कॉन्फ़िगर करके custom deployment नाम का उपयोग कर सकता है। custom deployment नाम के साथ image edits के लिए,
onboarding के माध्यम से deployment चुनें या model metadata शामिल करें ताकि OpenClaw सत्यापित कर सके
कि deployment `MAI-Image-2.5-Flash` या `MAI-Image-2.5` द्वारा backed है।

MAI image constraints:

- Output: प्रति request एक PNG image।
- Size: default `1024x1024`; width और height दोनों कम से कम 768 px होने चाहिए।
- Total pixels: width × height अधिकतम 1,048,576 होना चाहिए।
- Edits: एक PNG या JPEG input image।
- असमर्थित shared hints जैसे `aspectRatio`, `resolution`, `quality`,
  `background`, और non-PNG `outputFormat` Microsoft Foundry को नहीं भेजे जाते।

## समस्या निवारण

- `az: command not found`: Azure CLI इंस्टॉल करें या API-key auth का उपयोग करें।
- `Microsoft Foundry endpoint missing for MAI image generation`: onboarding के माध्यम से
  Foundry deployment चुनें या `models.providers.microsoft-foundry.baseUrl` जोड़ें।
- `supports MAI image deployments only`: चयनित image model एक
  non-MAI deployment की ओर इशारा करता है। `image_generate` के लिए deployed MAI image model का उपयोग करें।

<!-- openclaw-plugin-reference:manual-end -->
