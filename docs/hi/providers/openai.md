---
read_when:
    - आप OpenClaw में OpenAI मॉडल का उपयोग करना चाहते हैं
    - आप API कुंजियों के बजाय Codex सदस्यता प्रमाणीकरण चाहते हैं
    - आपको GPT-5 एजेंट के निष्पादन के लिए अधिक सख़्त व्यवहार चाहिए
summary: OpenClaw में API कुंजियों या Codex सदस्यता के माध्यम से OpenAI का उपयोग करें
title: OpenAI
x-i18n:
    generated_at: "2026-07-16T16:45:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 18efddc44f2b06ae9592cdbc01c0aadc4621ddf99e818793a4d835c741a2464e
    source_path: providers/openai.md
    workflow: 16
---

OpenClaw प्रत्यक्ष API-कुंजी प्रमाणीकरण और
ChatGPT/Codex सदस्यता प्रमाणीकरण, दोनों के लिए एक ही प्रदाता आईडी, `openai`, का उपयोग करता है। `openai/*` प्रामाणिक मॉडल रूट है।
रनटाइम नीति अनिर्धारित या `auto` वाले एम्बेडेड एजेंट टर्न के लिए, OpenAI के रूट
तथ्य तय करते हैं कि OpenClaw बंडल किए गए Codex ऐप-सर्वर रनटाइम को
अप्रत्यक्ष रूप से चुन सकता है या नहीं। केवल `openai/*` उपसर्ग रनटाइम नहीं चुनता।

- **एजेंट मॉडल** - स्पष्ट
  `agentRuntime` कॉन्फ़िगरेशन या OpenAI की अप्रत्यक्ष रूट नीति द्वारा चुने गए रनटाइम के माध्यम से `openai/*`। ChatGPT/Codex सदस्यता के उपयोग के लिए Codex
  प्रमाणीकरण से साइन इन करें, या जब कुंजी-आधारित बिलिंग चाहिए तब API-कुंजी प्रमाणीकरण
  प्रोफ़ाइल कॉन्फ़िगर करें।
- **गैर-एजेंट OpenAI API** - `OPENAI_API_KEY` या किसी `openai` API-कुंजी प्रमाणीकरण प्रोफ़ाइल के माध्यम से, प्रति उपयोग बिल किए जाने वाला प्रत्यक्ष OpenAI Platform एक्सेस।
- **लीगेसी कॉन्फ़िगरेशन** - `codex/*` और `openai-codex/*` संदर्भों को
  `openclaw doctor --fix` द्वारा `openai/*` और मॉडल-स्कोप वाले `agentRuntime.id: "codex"` में
  सुधारा जाता है।

OpenAI बाहरी टूल और OpenClaw जैसे वर्कफ़्लो में सदस्यता OAuth के उपयोग का स्पष्ट रूप से समर्थन करता है।

## उपयोग और लागत ट्रैकिंग

OpenClaw सदस्यता कोटा और Platform API बिलिंग को अलग रखता है:

- ChatGPT/Codex OAuth सदस्यता योजना, कोटा विंडो और क्रेडिट शेष दिखाता है।
- `OPENAI_ADMIN_KEY` Control UI के **उपयोग** में प्रदाता द्वारा रिपोर्ट की गई 30 दिनों की संगठन लागत और पूर्णता उपयोग दिखाता है, जिसमें दैनिक खर्च, अनुरोध/टोकन योग, शीर्ष मॉडल और लागत श्रेणियाँ शामिल हैं।
- `OPENAI_PROJECT_ID` वैकल्पिक रूप से Admin API इतिहास को एक प्रोजेक्ट तक सीमित करता है।
- OpenClaw संगठन API को कभी भी `OPENAI_API_KEY` या `openai` अनुमान प्रोफ़ाइल नहीं भेजता; वे क्रेडेंशियल कस्टम, Azure या एजेंट-स्थानीय एंडपॉइंट के हो सकते हैं।

स्पष्ट Admin कुंजी को OAuth पर प्राथमिकता मिलती है। प्रदाता द्वारा रिपोर्ट किए गए इतिहास को OpenClaw की सत्र-व्युत्पन्न अनुमानित लागत के साथ मर्ज नहीं किया जाता; इसमें अन्य क्लाइंट की API गतिविधि और प्रदाता-पक्ष के बिलिंग समायोजन शामिल हो सकते हैं।

OpenAI के [API उपयोग डैशबोर्ड](https://help.openai.com/en/articles/10478918) दस्तावेज़ उपयोग डेटा के लिए संगठन-स्वामी और स्पष्ट Usage Dashboard अनुमति आवश्यकताओं का वर्णन करते हैं।

प्रदाता, मॉडल, रनटाइम और चैनल अलग-अलग परतें हैं। यदि वे लेबल
आपस में मिल रहे हैं, तो कॉन्फ़िगरेशन बदलने से पहले [एजेंट रनटाइम](/hi/concepts/agent-runtimes)
पढ़ें।

## त्वरित चयन

| लक्ष्य                                              | उपयोग                                                                | टिप्पणियाँ                                                               |
| ------------------------------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------- |
| ChatGPT/Codex सदस्यता, नेटिव Codex रनटाइम  | `openai/gpt-5.6-sol`                                               | नई सदस्यता सेटअप; Codex प्रमाणीकरण से साइन इन करें।                  |
| एजेंट टर्न के लिए प्रत्यक्ष API-कुंजी बिलिंग            | `openai/gpt-5.6` और एक क्रमित API-कुंजी प्रमाणीकरण प्रोफ़ाइल              | नया API-कुंजी सेटअप; केवल प्रत्यक्ष-API आईडी Sol में रिज़ॉल्व होती है।        |
| सटीक GPT-5.6 टियर चुनें                      | `openai/gpt-5.6-sol`, `-terra`, या `-luna`                         | इस खाते के लिए उपलब्ध टियर हेतु `models list` जाँचें।        |
| GPT-5.6 एक्सेस के बिना खाता                    | `openai/gpt-5.5`                                                   | स्पष्ट पुनर्प्राप्ति विकल्प; OpenClaw बिना बताए डाउनग्रेड नहीं करता।     |
| प्रत्यक्ष API-कुंजी बिलिंग, स्पष्ट OpenClaw रनटाइम | `openai/gpt-5.6` और प्रदाता/मॉडल `agentRuntime.id: "openclaw"` | सामान्य `openai` API-कुंजी प्रोफ़ाइल चुनें।                           |
| नवीनतम ChatGPT Instant मॉडल उपनाम                | `openai/chat-latest`                                               | केवल प्रत्यक्ष API-कुंजी; बदलता हुआ उपनाम, स्थिर डिफ़ॉल्ट नहीं।          |
| छवि निर्माण या संपादन                       | `openai/gpt-image-2`                                               | `OPENAI_API_KEY` या Codex OAuth के साथ काम करता है।                         |
| पारदर्शी-पृष्ठभूमि वाली छवियाँ                     | `openai/gpt-image-1.5`                                             | `outputFormat` को `png` या `webp` और `background=transparent` पर सेट करें। |

## नामकरण मानचित्र

| दिखाई देने वाला नाम                            | परत             | अर्थ                                                                                  |
| --------------------------------------- | ----------------- | ---------------------------------------------------------------------------------------- |
| `openai`                                | प्रदाता उपसर्ग   | प्रामाणिक OpenAI मॉडल रूट; रूट तथ्य अप्रत्यक्ष रनटाइम निर्धारित करते हैं।                |
| `codex` Plugin                          | Plugin            | नेटिव Codex ऐप-सर्वर रनटाइम और `/codex` चैट नियंत्रण प्रदान करने वाला बंडल किया गया Plugin। |
| प्रदाता/मॉडल `agentRuntime.id: codex` | एजेंट रनटाइम     | मेल खाने वाले एम्बेडेड टर्न के लिए नेटिव Codex ऐप-सर्वर हार्नेस बाध्य करें।                   |
| `/codex ...`                            | चैट कमांड सेट  | किसी वार्तालाप से Codex ऐप-सर्वर थ्रेड बाँधें/नियंत्रित करें।                               |
| `runtime: "acp", agentId: "codex"`      | ACP सत्र रूट | Codex को ACP/acpx के माध्यम से चलाने वाला स्पष्ट फ़ॉलबैक पथ।                                 |

## अप्रत्यक्ष एजेंट रनटाइम

जब प्रदाता/मॉडल `agentRuntime` नीति अनिर्धारित या `auto` हो, तब OpenAI की
प्रदाता-स्वामित्व वाली रूट नीति प्रभावी
एंडपॉइंट और अडैप्टर से अप्रत्यक्ष रनटाइम चुनती है:

| प्रभावी रूट तथ्य                                                                                                                                                  | अप्रत्यक्ष रनटाइम      |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- |
| `openai-responses` वाला सटीक आधिकारिक Platform HTTPS एंडपॉइंट, या `openai-chatgpt-responses` वाला सटीक आधिकारिक ChatGPT HTTPS एंडपॉइंट; कोई लिखित अनुरोध ओवरराइड नहीं | Codex चुना जा सकता है |
| लिखित `openai-completions` अडैप्टर                                                                                                                                  | OpenClaw              |
| कस्टम एंडपॉइंट                                                                                                                                                        | OpenClaw              |
| HTTP का उपयोग करने वाला स्पष्ट सटीक आधिकारिक एंडपॉइंट                                                                                                                            | अस्वीकृत              |
| लिखित प्रदाता/मॉडल अनुरोध ओवरराइड वाला रूट                                                                                                                 | OpenClaw              |

स्पष्ट गैर-डिफ़ॉल्ट प्रदाता/मॉडल `agentRuntime.id` प्रामाणिक रहता है।
उदाहरण के लिए, `agentRuntime.id: "openclaw"` अन्यथा Codex-योग्य
रूट को OpenClaw पर रखता है, जबकि `agentRuntime.id: "codex"` को Codex आवश्यक है और प्रभावी रूट के Codex-संगत घोषित न होने पर
बंद रहते हुए विफल होता है।
रनटाइम चयन क्रेडेंशियल प्रकार या बिलिंग नहीं बदलता: Platform API-कुंजी
प्रमाणीकरण और ChatGPT/Codex सदस्यता प्रमाणीकरण अलग रहते हैं।

`openclaw doctor --fix` लीगेसी `codex/*` और `openai-codex/*` मॉडल
संदर्भों, लीगेसी Codex प्रमाणीकरण प्रोफ़ाइल आईडी और लीगेसी Codex प्रमाणीकरण-क्रम प्रविष्टियों को
प्रामाणिक `openai` रूट में माइग्रेट करता है। माइग्रेट किए गए मॉडल संदर्भों को मॉडल-स्कोप वाला
`agentRuntime.id: "codex"` मिलता है; नए प्रमाणीकरण-क्रम कॉन्फ़िगरेशन के लिए `auth.order.openai` का उपयोग करें।

<Note>
नई OpenAI सेटअप केवल तभी GPT-5.6 प्राथमिक मॉडल लागू करती है, जब कोई प्राथमिक मॉडल
कॉन्फ़िगर न हो। OpenAI प्रमाणीकरण जोड़ने या रीफ़्रेश करने पर मौजूदा स्पष्ट
चयन सुरक्षित रहता है, जिसमें `openai/gpt-5.5` भी शामिल है, जब तक कि आप स्पष्ट रूप से
`models auth login --set-default` या `models set` का उपयोग न करें। API-कुंजी प्रमाणीकरण प्रोफ़ाइल का उपयोग
केवल तभी करें, जब एजेंट मॉडल के लिए API-कुंजी प्रमाणीकरण चाहिए।
</Note>

## GPT-5.6 सीमित पूर्वावलोकन

OpenClaw सटीक `openai/gpt-5.6-sol`,
`openai/gpt-5.6-terra` और `openai/gpt-5.6-luna` मॉडल आईडी पहचानता है। वर्तमान कैटलॉग में तीनों
`xhigh` और `max` रीजनिंग उपलब्ध कराते हैं। OpenAI Sol को
फ़्लैगशिप टियर, Terra को संतुलित टियर और Luna को तेज़,
कम-लागत वाला टियर बताता है। 
[GPT-5.6 लॉन्च घोषणा](https://openai.com/index/previewing-gpt-5-6-sol/)
और [एक्सेस गाइड](https://help.openai.com/en/articles/20001325-a-preview-of-gpt-5-6-sol-terra-and-luna) देखें।

प्रत्यक्ष OpenAI API-कुंजी प्रमाणीकरण के साथ, केवल `openai/gpt-5.6` आईडी Sol का उपनाम
और नई सेटअप का डिफ़ॉल्ट है। नेटिव Codex कैटलॉग उस प्रत्यक्ष-API उपनाम को
क्लाइंट-पक्ष पर लागू नहीं करता; वर्कस्पेस एक्सेस के आधार पर, यह
सटीक Sol, Terra और Luna आईडी दिखा सकता है। इसलिए नई ChatGPT/Codex OAuth सेटअप
`openai/gpt-5.6-sol` का उपयोग करती है। वर्तमान खाता इससे जाँचें:

```bash
openclaw models list --provider openai
```

API संगठन और Codex वर्कस्पेस एक्सेस अलग हो सकते हैं। यदि GPT-5.6
उपलब्ध नहीं है, तो स्पष्ट रूप से GPT-5.5 चुनें:

```bash
openclaw models set openai/gpt-5.5
```

OpenClaw अपस्ट्रीम एक्सेस त्रुटि दिखाता है और GPT-5.6 चयन को बिना बताए
GPT-5.5 से प्रतिस्थापित नहीं करता।

<Note>
रनटाइम नीति अनिर्धारित या `auto` होने पर योग्य सटीक आधिकारिक HTTPS रूट बंडल किए गए Codex ऐप-सर्वर
Plugin को चुन सकते हैं; लिखित Completions रूट,
कस्टम एंडपॉइंट और अनुरोध-ट्रांसपोर्ट ओवरराइड OpenClaw पर बने रहते हैं। प्लेनटेक्स्ट
आधिकारिक HTTP एंडपॉइंट अस्वीकार किए जाते हैं। स्पष्ट प्रदाता/मॉडल रनटाइम कॉन्फ़िगरेशन
प्रामाणिक रहता है। पुराने लीगेसी Codex मॉडल
संदर्भों, `codex-cli/*` संदर्भों या स्पष्ट रनटाइम कॉन्फ़िगरेशन द्वारा सेट न किए गए पुराने रनटाइम सत्र पिनों को सुधारने के लिए `openclaw doctor --fix` चलाएँ।
</Note>

## OpenClaw सुविधा कवरेज

| OpenAI क्षमता             | OpenClaw सतह                                                                                  | स्थिति                                                          |
| ------------------------- | --------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| चैट / Responses           | `openai/<model>` मॉडल प्रदाता                                                               | हाँ                                                             |
| Codex सदस्यता मॉडल        | OpenAI OAuth के साथ `openai/<model>`                                                        | हाँ                                                             |
| पुराने Codex मॉडल संदर्भ  | पुराने Codex मॉडल संदर्भ, `codex-cli/<model>`                                                  | doctor द्वारा `openai/<model>` में सुधारित                    |
| Codex app-server हार्नेस   | रनटाइम अनसेट/`auto` के साथ Codex-संगत HTTPS रूट, या स्पष्ट `agentRuntime.id: codex`     | हाँ                                                             |
| सर्वर-साइड वेब खोज        | मूल OpenAI Responses टूल                                                                      | हाँ, जब वेब खोज सक्षम हो और कोई अन्य प्रदाता पिन न किया गया हो |
| इमेज                      | `image_generate`                                                                            | हाँ                                                             |
| वीडियो                    | `video_generate`                                                                            | हाँ                                                             |
| टेक्स्ट-टू-स्पीच          | `messages.tts.provider: "openai"` / `tts`                                                       | हाँ                                                             |
| बैच स्पीच-टू-टेक्स्ट      | `tools.media.audio` / मीडिया समझ                                                               | हाँ                                                             |
| स्ट्रीमिंग स्पीच-टू-टेक्स्ट | Voice Call `streaming.provider: "openai"`                                                               | हाँ                                                             |
| रीयलटाइम वॉइस             | Voice Call `realtime.provider: "openai"` / Control UI Talk `talk.realtime.provider: "openai"`                            | हाँ (OpenAI Platform API कुंजी)                                 |
| एम्बेडिंग                 | मेमोरी एम्बेडिंग प्रदाता                                                                      | हाँ                                                             |

<Note>
OpenAI रीयलटाइम वॉइस सार्वजनिक **OpenAI Platform Realtime
API** के माध्यम से संचालित होती है और इसके लिए Platform API कुंजी आवश्यक है। इसके
विपरीत, Codex OAuth टोकन ChatGPT Codex बैकएंड को प्रमाणित करते हैं; सार्वजनिक
Realtime एंडपॉइंट के लिए उन्हें Platform API कुंजियों के स्थान पर उपयोग नहीं किया जा सकता।

यदि API-कुंजी प्रमाणीकरण अनुपलब्ध बिलिंग की सूचना देता है, तो API-कुंजी
प्रमाणीकरण का उपयोग करते समय आपके रीयलटाइम क्रेडेंशियल का आधार बनने वाले संगठन के लिए
[platform.openai.com/account/billing](https://platform.openai.com/account/billing)
पर Platform क्रेडिट टॉप अप करें। रीयलटाइम वॉइस
`openclaw onboard --auth-choice openai-api-key` द्वारा बनाई गई `openai` API-कुंजी प्रमाणीकरण प्रोफ़ाइल,
Control UI Talk के लिए `talk.realtime.providers.openai.apiKey` के माध्यम से सेट की गई Platform API कुंजी,
Voice Call के लिए `plugins.entries.voice-call.config.realtime.providers.openai.apiKey`,
या `OPENAI_API_KEY` पर्यावरण चर स्वीकार करती है।
</Note>

## मेमोरी एम्बेडिंग

OpenClaw, `memory_search` अनुक्रमण और क्वेरी एम्बेडिंग के लिए OpenAI
या OpenAI-संगत एम्बेडिंग एंडपॉइंट का उपयोग कर सकता है:

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "openai",
        model: "text-embedding-3-small",
      },
    },
  },
}
```

असममित एम्बेडिंग लेबल की आवश्यकता वाले OpenAI-संगत एंडपॉइंट के लिए,
`memorySearch` के अंतर्गत `queryInputType` और `documentInputType` सेट करें। OpenClaw
इन्हें प्रदाता-विशिष्ट `input_type` अनुरोध फ़ील्ड के रूप में अग्रेषित करता है: क्वेरी
एम्बेडिंग `queryInputType` का उपयोग करती हैं; अनुक्रमित मेमोरी खंड और बैच अनुक्रमण
`documentInputType` का उपयोग करते हैं। पूर्ण उदाहरण के लिए
[मेमोरी कॉन्फ़िगरेशन संदर्भ](/hi/reference/memory-config#provider-specific-config)
देखें।

## शुरुआत करना

<Tabs>
  <Tab title="API कुंजी (OpenAI Platform)">
    **इसके लिए सर्वोत्तम:** सीधे API एक्सेस और उपयोग-आधारित बिलिंग।

    <Steps>
      <Step title="अपनी API कुंजी प्राप्त करें">
        [OpenAI Platform डैशबोर्ड](https://platform.openai.com/api-keys) से API कुंजी बनाएँ या कॉपी करें।
      </Step>
      <Step title="ऑनबोर्डिंग चलाएँ">
        ```bash
        openclaw onboard --auth-choice openai-api-key
        ```

        या कुंजी सीधे पास करें:

        ```bash
        openclaw onboard --openai-api-key "$OPENAI_API_KEY"
        ```
      </Step>
      <Step title="सत्यापित करें कि मॉडल उपलब्ध है">
        ```bash
        openclaw models list --provider openai
        ```
      </Step>
    </Steps>

    ### रूट सारांश

    | मॉडल संदर्भ       | रनटाइम नीति या रूट संबंधी तथ्य                               | रूट                       | प्रमाणीकरण                              |
    | ---------------- | ------------------------------------------------------------- | ------------------------- | --------------------------------------- |
    | `openai/gpt-5.6` | अनसेट/`auto`, सटीक आधिकारिक HTTPS मूल रूट, कोई अनुरोध ओवरराइड नहीं | Codex चुना जा सकता है     | क्रमबद्ध API-कुंजी प्रमाणीकरण प्रोफ़ाइल |
    | `openai/gpt-5.6` | प्रदाता/मॉडल `agentRuntime.id: "openclaw"`                              | OpenClaw एम्बेडेड रनटाइम  | चयनित `openai` API-कुंजी प्रोफ़ाइल |
    | `openai/gpt-5.5` | स्पष्ट प्रदाता/मॉडल `agentRuntime.id`                       | चयनित एजेंट रनटाइम        | चयनित OpenAI API-कुंजी प्रोफ़ाइल       |
    | `openai/*` | लिखित Completions, कस्टम, या अनुरोध ओवरराइड                  | OpenClaw एम्बेडेड रनटाइम  | क्रेडेंशियल प्रकार अपरिवर्तित रहता है  |
    | `openai/*` | प्लेनटेक्स्ट आधिकारिक HTTP एंडपॉइंट                           | अस्वीकृत                  | क्रेडेंशियल नहीं भेजा जाता              |

    <Note>
    रनटाइम अनसेट या `auto` होने पर, केवल एक योग्य सटीक आधिकारिक HTTPS मूल
    रूट ही Codex app-server हार्नेस को अप्रत्यक्ष रूप से चुन सकता है। किसी एजेंट मॉडल पर
    API-कुंजी प्रमाणीकरण के लिए, `openai` API-कुंजी प्रमाणीकरण प्रोफ़ाइल बनाएँ और
    उसे `auth.order.openai` के साथ क्रमबद्ध करें; गैर-एजेंट OpenAI API सतहों के लिए
    `OPENAI_API_KEY` प्रत्यक्ष फ़ॉलबैक बना रहता है। पुराने Codex प्रमाणीकरण-क्रम
    प्रविष्टियों को माइग्रेट करने के लिए `openclaw doctor --fix` चलाएँ।
    </Note>

    ### कॉन्फ़िगरेशन उदाहरण

    ```json5
    {
      env: { OPENAI_API_KEY: "example-openai-key-not-real" },
      agents: { defaults: { model: { primary: "openai/gpt-5.6" } } },
    }
    ```

    केवल प्रत्यक्ष-API वाला `gpt-5.6` आईडी Sol टियर में रिज़ॉल्व होता है। यदि यह API
    संगठन GPT-5.6 उपलब्ध नहीं कराता, तो प्राइमरी को स्पष्ट रूप से
    `openai/gpt-5.5` पर सेट करें।

    OpenAI API से ChatGPT के वर्तमान Instant मॉडल को आज़माने के लिए, मॉडल को
    `openai/chat-latest` पर सेट करें:

    ```json5
    {
      env: { OPENAI_API_KEY: "example-openai-key-not-real" },
      agents: { defaults: { model: { primary: "openai/chat-latest" } } },
    }
    ```

    `chat-latest` एक परिवर्तनीय उपनाम है। इसके बजाय नया OpenAI API-कुंजी सेटअप
    `openai/gpt-5.6` का उपयोग करता है, जिसका केवल प्रत्यक्ष-API वाला आईडी Sol में रिज़ॉल्व
    होता है। `openai/gpt-5.5` सहित मौजूदा स्पष्ट प्राइमरी अपरिवर्तित रहते हैं।
    `chat-latest` उपनाम केवल `medium` टेक्स्ट वर्बोसिटी स्वीकार करता है;
    OpenClaw इस मॉडल के लिए अनुरोध की गई किसी भी अन्य वर्बोसिटी को
    `medium` पर बाध्य करता है।

    <Warning>
    OpenClaw प्रत्यक्ष OpenAI API-कुंजी रूट पर `gpt-5.3-codex-spark` उपलब्ध
    **नहीं** कराता। यह केवल Codex सदस्यता कैटलॉग प्रविष्टियों के माध्यम से उपलब्ध
    होता है, जब आपका साइन-इन किया हुआ खाता इसे उपलब्ध कराता है।
    </Warning>

  </Tab>

  <Tab title="Codex सदस्यता">
    **इसके लिए सर्वोत्तम:** अलग API कुंजी के बजाय मूल Codex app-server
    निष्पादन के साथ आपकी ChatGPT/Codex सदस्यता का उपयोग। Codex क्लाउड के लिए
    ChatGPT साइन-इन आवश्यक है।

    <Steps>
      <Step title="Codex OAuth चलाएँ">
        ```bash
        openclaw onboard --auth-choice openai
        ```

        या OAuth सीधे चलाएँ:

        ```bash
        openclaw models auth login --provider openai
        ```

        हेडलेस या कॉलबैक-अनुकूल न होने वाले सेटअप के लिए, localhost ब्राउज़र
        कॉलबैक के बजाय ChatGPT डिवाइस-कोड फ़्लो से साइन इन करने हेतु
        `--device-code` जोड़ें:

        ```bash
        openclaw models auth login --provider openai --device-code
        ```
      </Step>
      <Step title="कैनोनिकल OpenAI मॉडल रूट का उपयोग करें">
        ```bash
        openclaw config set agents.defaults.model.primary openai/gpt-5.6-sol
        ```

        इस सटीक आधिकारिक HTTPS मूल रूट के लिए किसी रनटाइम कॉन्फ़िगरेशन की आवश्यकता
        नहीं है। यह Codex app-server रनटाइम को स्वचालित रूप से चुन सकता है, और
        उस रनटाइम के चुने जाने पर OpenClaw बंडल किए गए Codex Plugin को इंस्टॉल
        या सुधारता है।
      </Step>
      <Step title="सत्यापित करें कि Codex प्रमाणीकरण उपलब्ध है">
        ```bash
        openclaw models list --provider openai
        ```

        Gateway चलने के बाद, मूल app-server रनटाइम को सत्यापित करने के लिए चैट में
        `/codex status` या `/codex models` भेजें।
      </Step>
    </Steps>

    ### रूट सारांश

    | मॉडल संदर्भ             | रनटाइम नीति या रूट संबंधी तथ्य                               | रूट                                                      | प्रमाणीकरण                                                |
    | ----------------------- | ------------------------------------------------------------- | --------------------------------------------------------- | --------------------------------------------------------- |
    | `openai/gpt-5.6-sol`      | अनसेट/`auto`, सटीक आधिकारिक HTTPS मूल रूट, कोई अनुरोध ओवरराइड नहीं | Codex चुना जा सकता है                                    | Codex साइन-इन, या क्रमबद्ध `openai` प्रमाणीकरण प्रोफ़ाइल |
    | `openai/gpt-5.6-terra`      | अनसेट/`auto`, सटीक आधिकारिक HTTPS मूल रूट, कोई अनुरोध ओवरराइड नहीं | Codex चुना जा सकता है                                    | कैटलॉग द्वारा Terra उपलब्ध कराने पर Codex साइन-इन        |
    | `openai/gpt-5.6-luna`      | अनसेट/`auto`, सटीक आधिकारिक HTTPS मूल रूट, कोई अनुरोध ओवरराइड नहीं | Codex चुना जा सकता है                                    | कैटलॉग द्वारा Luna उपलब्ध कराने पर Codex साइन-इन         |
    | `openai/gpt-5.6-sol`      | प्रदाता/मॉडल `agentRuntime.id: "openclaw"`                              | OpenClaw एम्बेडेड रनटाइम, आंतरिक Codex-प्रमाणीकरण ट्रांसपोर्ट | चयनित `openai` OAuth प्रोफ़ाइल                 |
    | `openai/gpt-5.5`      | स्पष्ट प्रदाता/मॉडल `agentRuntime.id`                       | चयनित एजेंट रनटाइम                                       | चयनित OpenAI प्रमाणीकरण प्रोफ़ाइल                         |
    | `openai/*`      | लिखित Completions, कस्टम, या अनुरोध ओवरराइड                  | OpenClaw एम्बेडेड रनटाइम                                 | क्रेडेंशियल आवश्यकता रूट-विशिष्ट रहती है                 |
    | `openai/*`      | प्लेनटेक्स्ट आधिकारिक HTTP एंडपॉइंट                           | अस्वीकृत                                                 | क्रेडेंशियल नहीं भेजा जाता                                |
    | पुराना Codex GPT-5.5 संदर्भ | doctor द्वारा सुधारित                                    | `openai/gpt-5.5` में पुनर्लिखित                        | माइग्रेट की गई OpenAI OAuth प्रोफ़ाइल                     |
    | `codex-cli/gpt-5.5`      | doctor द्वारा सुधारित                                         | `openai/gpt-5.5` में पुनर्लिखित                        | Codex app-server प्रमाणीकरण                               |

    <Warning>
    नई सदस्यता-समर्थित सेटअप सटीक `openai/gpt-5.6-sol` का उपयोग करती है; मूल
    Codex कैटलॉग सटीक Terra या Luna संदर्भ भी उपलब्ध करा सकता है। यदि
    खाता GPT-5.6 उपलब्ध नहीं कराता है, तो स्पष्ट रूप से `openai/gpt-5.5` चुनें। पुराने
    Codex GPT संदर्भ विरासती OpenClaw रूट हैं, मूल Codex रनटाइम
    पथ नहीं; किसी मौजूदा स्पष्ट GPT-5.5 चयन को अपग्रेड किए बिना उन्हें
    माइग्रेट करने के लिए `openclaw doctor --fix` चलाएँ। `gpt-5.3-codex-spark` केवल
    उन खातों तक सीमित रहता है जिनका Codex सदस्यता कैटलॉग इसे उपलब्ध बताता है; इसके लिए प्रत्यक्ष OpenAI
    API-कुंजी और Azure संदर्भ उपलब्ध नहीं कराए जाते।
    </Warning>

    <Note>
    नई कॉन्फ़िगरेशन में OpenAI एजेंट प्रमाणीकरण क्रम को `auth.order.openai` के अंतर्गत रखना चाहिए;
    doctor पुराने विरासती Codex प्रमाणीकरण-क्रम प्रविष्टियों को माइग्रेट करता है।
    </Note>

    ### कॉन्फ़िगरेशन उदाहरण

    ```json5
    {
      plugins: { entries: { codex: { enabled: true } } },
      agents: {
        defaults: {
          model: { primary: "openai/gpt-5.6-sol" },
        },
      },
    }
    ```

    API-कुंजी बैकअप के साथ, चयनित मॉडल को `openai/*` के अंतर्गत रखें और
    प्रमाणीकरण क्रम को `openai` के अंतर्गत रखें। OpenClaw पहले सदस्यता, फिर
    API कुंजी आज़माता है और इस दौरान Codex हार्नेस पर बना रहता है:

    ```json5
    {
      plugins: { entries: { codex: { enabled: true } } },
      agents: {
        defaults: {
          model: { primary: "openai/gpt-5.6-sol" },
        },
      },
      auth: {
        order: {
          openai: [
            "openai:user@example.com",
            "openai:api-key-backup",
          ],
        },
      },
    }
    ```

    <Note>
    ऑनबोर्डिंग अब `~/.codex` से OAuth सामग्री आयात नहीं करती। ब्राउज़र
    OAuth (डिफ़ॉल्ट) या ऊपर दिए गए डिवाइस-कोड प्रवाह से साइन इन करें; OpenClaw परिणामी
    क्रेडेंशियल को अपने एजेंट प्रमाणीकरण स्टोर में प्रबंधित करता है।
    </Note>

    ### Codex OAuth रूटिंग की जाँच और पुनर्प्राप्ति

    ```bash
    openclaw models status
    openclaw models auth list --provider openai
    openclaw config get agents.defaults.model --json
    openclaw config get models.providers.openai.agentRuntime --json
    ```

    किसी विशिष्ट एजेंट के लिए, `--agent <id>` जोड़ें:

    ```bash
    openclaw models status --agent <id>
    openclaw models auth list --agent <id> --provider openai
    ```

    यदि किसी पुरानी कॉन्फ़िगरेशन में अब भी विरासती Codex GPT संदर्भ हैं, या स्पष्ट रनटाइम
    कॉन्फ़िगरेशन के बिना कोई पुराना OpenAI रनटाइम सत्र पिन है, तो उसे सुधारें:

    ```bash
    openclaw doctor --fix
    openclaw config validate
    ```

    यदि `models auth list --provider openai` कोई उपयोग योग्य प्रोफ़ाइल नहीं दिखाता है, तो
    फिर से साइन इन करें:

    ```bash
    openclaw models auth login --provider openai
    openclaw models status --probe --probe-provider openai
    ```

    एक ही एजेंट में अनेक Codex OAuth लॉगिन के लिए `--profile-id` का उपयोग करें, फिर
    उन्हें प्रमाणीकरण क्रम या `/model ...@<profileId>` के माध्यम से नियंत्रित करें:

    ```bash
    openclaw models auth login --provider openai --profile-id openai:ritsuko
    openclaw models auth login --provider openai --profile-id openai:lain
    ```

    प्रोफ़ाइल क्रम पर निर्भर होने से पहले पुराने विरासती OpenAI Codex उपसर्ग वाले
    प्रोफ़ाइल आईडी और क्रम प्रविष्टियों को माइग्रेट करने के लिए `openclaw doctor --fix` चलाएँ।

    ### स्थिति संकेतक

    चैट `/status` दिखाता है कि वर्तमान सत्र के लिए कौन-सा मॉडल रनटाइम
    सक्रिय है। जब कोई योग्य अंतर्निहित रूट या स्पष्ट
    प्रदाता/मॉडल रनटाइम नीति इसे चुनती है, तो बंडल किया हुआ Codex ऐप-सर्वर हार्नेस
    `Runtime: OpenAI Codex` के रूप में दिखाई देता है।

    ### Doctor चेतावनी

    यदि विरासती Codex मॉडल संदर्भ या पुराने OpenAI रनटाइम पिन कॉन्फ़िगरेशन
    या सत्र स्थिति में बने रहते हैं, तो OpenClaw को स्पष्ट रूप से कॉन्फ़िगर किए जाने को छोड़कर
    `openclaw doctor --fix` उन्हें Codex रनटाइम के साथ `openai/*` में पुनर्लिखता है।

    ### संदर्भ विंडो सीमा

    OpenClaw मॉडल मेटाडेटा और रनटाइम संदर्भ सीमा को अलग-अलग
    मान मानता है। Codex OAuth कैटलॉग के माध्यम से `openai/gpt-5.5` के लिए:

    - मूल `contextWindow`: `400000`
    - डिफ़ॉल्ट रनटाइम `contextTokens` सीमा: `272000`

    व्यवहार में छोटी डिफ़ॉल्ट सीमा बेहतर विलंबता और गुणवत्ता
    विशेषताएँ देती है। इसे `contextTokens` से ओवरराइड करें:

    ```json5
    {
      models: {
        providers: {
          openai: {
            models: [{ id: "gpt-5.5", contextTokens: 160000 }],
          },
        },
      },
    }
    ```

    <Note>
    मूल मॉडल मेटाडेटा घोषित करने के लिए `contextWindow` का उपयोग करें। रनटाइम
    संदर्भ बजट सीमित करने के लिए `contextTokens` का उपयोग करें। प्रत्यक्ष OpenAI API-कुंजी रूट
    `gpt-5.5` के लिए एक बड़ी मूल `contextWindow` (`1000000`) रिपोर्ट करता है; दोनों
    रूट अलग-अलग ट्रैक किए जाते हैं क्योंकि अपस्ट्रीम कैटलॉग अलग हैं।
    </Note>

    ### कैटलॉग पुनर्प्राप्ति

    उपलब्ध होने पर OpenClaw `gpt-5.5` के लिए अपस्ट्रीम Codex कैटलॉग मेटाडेटा का
    उपयोग करता है। यदि खाता प्रमाणीकृत होने के बावजूद लाइव Codex खोज
    `gpt-5.5` पंक्ति छोड़ देती है, तो OpenClaw उस OAuth मॉडल पंक्ति को संश्लेषित करता है ताकि Cron,
    उप-एजेंट और कॉन्फ़िगर किए गए डिफ़ॉल्ट-मॉडल रन
    `Unknown model` के साथ विफल न हों।

  </Tab>
</Tabs>

## मूल Codex ऐप-सर्वर प्रमाणीकरण

मूल Codex ऐप-सर्वर हार्नेस `openai/*` मॉडल संदर्भों का उपयोग करता है, जब कोई योग्य
सटीक आधिकारिक HTTPS रूट इसे अंतर्निहित रूप से चुनता है, या जब प्रदाता/मॉडल
`agentRuntime.id: "codex"` इसे स्पष्ट रूप से चुनता है। इसका प्रमाणीकरण अभी भी
खाता-आधारित है। OpenClaw इस क्रम में प्रमाणीकरण चुनता है:

1. एजेंट के लिए क्रमबद्ध OpenAI प्रमाणीकरण प्रोफ़ाइल, अधिमानतः
   `auth.order.openai` के अंतर्गत। पुराने विरासती Codex प्रमाणीकरण प्रोफ़ाइल आईडी
   और प्रमाणीकरण क्रम को माइग्रेट करने के लिए `openclaw doctor --fix` चलाएँ।
2. ऐप-सर्वर का मौजूदा खाता, जैसे स्थानीय Codex CLI ChatGPT
   साइन-इन। डिफ़ॉल्ट पृथक एजेंट होम के लिए, OpenClaw उस मूल
   CLI खाते को अपने लॉगिन RPC के माध्यम से ऐप-सर्वर से जोड़ता है; यह
   CLI की कॉन्फ़िगरेशन, plugins या थ्रेड स्टोर साझा नहीं करता।
3. केवल स्थानीय stdio ऐप-सर्वर लॉन्च के लिए, और केवल तब जब ऐप-सर्वर
   कोई खाता रिपोर्ट नहीं करता: `CODEX_API_KEY`, फिर `OPENAI_API_KEY`।

स्थानीय ChatGPT/Codex सदस्यता साइन-इन को केवल इसलिए प्रतिस्थापित नहीं किया जाता क्योंकि
Gateway प्रक्रिया के पास प्रत्यक्ष OpenAI मॉडल या एम्बेडिंग के लिए
`OPENAI_API_KEY` भी है। पर्यावरण API-कुंजी फ़ॉलबैक केवल स्थानीय stdio बिना-खाता
पथ पर लागू होता है; इसे WebSocket ऐप-सर्वर कनेक्शन पर कभी नहीं भेजा जाता। जब कोई
सदस्यता-शैली Codex प्रोफ़ाइल चुनी जाती है, तो OpenClaw
`CODEX_API_KEY` और `OPENAI_API_KEY` को आरंभ की गई stdio ऐप-सर्वर चाइल्ड प्रक्रिया से बाहर भी रखता है
और इसके बजाय चयनित क्रेडेंशियल को ऐप-सर्वर लॉगिन RPC के माध्यम से भेजता है।

जब वह सदस्यता प्रोफ़ाइल Codex उपयोग सीमा से अवरुद्ध होती है, तो OpenClaw
प्रोफ़ाइल को Codex द्वारा बताए गए रीसेट समय तक अवरुद्ध चिह्नित करता है और प्रमाणीकरण
क्रम को अगले `openai:*` प्रोफ़ाइल पर जाने देता है, बिना चयनित
मॉडल को बदले या Codex हार्नेस से बाहर निकले। रीसेट समय बीतने के बाद,
सदस्यता प्रोफ़ाइल फिर से योग्य हो जाती है।

## छवि जनरेशन

बंडल किया हुआ `openai` Plugin
`image_generate` टूल के माध्यम से छवि जनरेशन पंजीकृत करता है। यह एक ही
`openai/gpt-image-2` मॉडल संदर्भ के माध्यम से OpenAI API-कुंजी और Codex OAuth, दोनों से छवि
जनरेशन का समर्थन करता है।

| क्षमता                    | OpenAI API कुंजी                    | Codex OAuth                          |
| ------------------------- | ---------------------------------- | ------------------------------------ |
| मॉडल संदर्भ               | `openai/gpt-image-2`               | `openai/gpt-image-2`                 |
| प्रमाणीकरण                | `OPENAI_API_KEY`                   | OpenAI Codex OAuth साइन-इन           |
| परिवहन                   | OpenAI Images API                  | Codex Responses बैकएंड               |
| प्रति अनुरोध अधिकतम छवियाँ | 4                                  | 4                                    |
| संपादन मोड                | सक्षम (अधिकतम 5 संदर्भ छवियाँ)     | सक्षम (अधिकतम 5 संदर्भ छवियाँ)       |
| आकार ओवरराइड             | समर्थित, 2K/4K आकार सहित           | समर्थित, 2K/4K आकार सहित             |
| आस्पेक्ट अनुपात / रिज़ॉल्यूशन | OpenAI Images API को अग्रेषित नहीं किया जाता | सुरक्षित होने पर समर्थित आकार में मैप किया जाता है |

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: { primary: "openai/gpt-image-2" },
    },
  },
}
```

<Note>
साझा टूल पैरामीटर, प्रदाता चयन और फ़ेलओवर व्यवहार के लिए
[छवि जनरेशन](/hi/tools/image-generation) देखें।
</Note>

`gpt-image-2` OpenAI टेक्स्ट-से-छवि जनरेशन और छवि
संपादन के लिए डिफ़ॉल्ट है। `gpt-image-1.5`, `gpt-image-1` और `gpt-image-1-mini`
स्पष्ट मॉडल ओवरराइड के रूप में उपयोग योग्य बने रहते हैं।
पारदर्शी-पृष्ठभूमि PNG/WebP आउटपुट के लिए `openai/gpt-image-1.5` का उपयोग करें; वर्तमान `gpt-image-2` API
`background: "transparent"` को अस्वीकार करता है।

पारदर्शी-पृष्ठभूमि अनुरोध के लिए, `image_generate` को
`model: "openai/gpt-image-1.5"`, `outputFormat: "png"` या `"webp"`, और
`background: "transparent"` के साथ कॉल करें; पुराना `openai.background` प्रदाता विकल्प
अब भी स्वीकार किया जाता है। OpenClaw डिफ़ॉल्ट `openai/gpt-image-2` पारदर्शी अनुरोधों को
`gpt-image-1.5` में पुनर्लिखकर सार्वजनिक OpenAI और OpenAI Codex OAuth
रूट की भी रक्षा करता है; Azure और कस्टम OpenAI-संगत एंडपॉइंट अपने
कॉन्फ़िगर किए गए डिप्लॉयमेंट/मॉडल नाम बनाए रखते हैं।

यही सेटिंग हेडलेस CLI रन के लिए भी उपलब्ध है:

```bash
openclaw infer image generate \
  --model openai/gpt-image-1.5 \
  --output-format png \
  --background transparent \
  --prompt "पारदर्शी पृष्ठभूमि पर एक साधारण लाल गोल स्टिकर" \
  --json
```

इनपुट फ़ाइल से शुरू करते समय `openclaw infer image edit` के साथ वही
`--output-format` और `--background` फ़्लैग उपयोग करें।
`--openai-background` OpenAI-विशिष्ट उपनाम के रूप में उपलब्ध रहता है। OpenAI Images की गुणवत्ता और लागत
नियंत्रित करने के लिए `--quality low|medium|high|auto` का उपयोग करें।
`image generate` या `image edit` में से किसी से OpenAI का मॉडरेशन संकेत
पास करने के लिए `--openai-moderation low|auto` का उपयोग करें।

ChatGPT/Codex OAuth इंस्टॉलेशन के लिए, वही `openai/gpt-image-2` संदर्भ रखें। जब
कोई `openai` OAuth प्रोफ़ाइल कॉन्फ़िगर होती है, तो OpenClaw उस संग्रहीत OAuth
एक्सेस टोकन को रिज़ॉल्व करता है और छवि अनुरोध Codex Responses बैकएंड के माध्यम से भेजता है; यह
पहले `OPENAI_API_KEY` नहीं आज़माता और न ही चुपचाप API कुंजी पर फ़ॉलबैक करता है।
जब आप इसके बजाय प्रत्यक्ष OpenAI Images API रूट चाहते हैं, तो API कुंजी, कस्टम बेस
URL या Azure एंडपॉइंट के साथ `models.providers.openai` को स्पष्ट रूप से कॉन्फ़िगर करें।
यदि वह कस्टम छवि एंडपॉइंट किसी विश्वसनीय LAN/निजी पते पर है,
तो `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true` भी सेट करें; इस ऑप्ट-इन के बिना OpenClaw
निजी/आंतरिक OpenAI-संगत छवि एंडपॉइंट को अवरुद्ध रखता है।

जनरेट करें:

```
/tool image_generate model=openai/gpt-image-2 prompt="macOS पर OpenClaw के लिए एक परिष्कृत लॉन्च पोस्टर" size=3840x2160 count=1
```

पारदर्शी PNG जनरेट करें:

```
/tool image_generate model=openai/gpt-image-1.5 prompt="पारदर्शी पृष्ठभूमि पर एक साधारण लाल गोल स्टिकर" outputFormat=png background=transparent
```

संपादित करें:

```
/tool image_generate model=openai/gpt-image-2 prompt="वस्तु का आकार बनाए रखें, सामग्री को पारभासी काँच में बदलें" image=/path/to/reference.png size=1024x1536
```

## वीडियो जनरेशन

बंडल किया हुआ `openai` Plugin
`video_generate` टूल के माध्यम से वीडियो जनरेशन पंजीकृत करता है।

| क्षमता            | मान                                                                                |
| ---------------- | ---------------------------------------------------------------------------------- |
| डिफ़ॉल्ट मॉडल     | `openai/sora-2`                                                                    |
| मोड               | टेक्स्ट-से-वीडियो, छवि-से-वीडियो, एकल-वीडियो संपादन                              |
| संदर्भ इनपुट      | 1 छवि या 1 वीडियो                                                                  |
| आकार ओवरराइड      | टेक्स्ट-से-वीडियो और छवि-से-वीडियो के लिए समर्थित                                 |
| आस्पेक्ट अनुपात   | निकटतम समर्थित आकार में परिवर्तित किया जाता है, अपरिष्कृत रूप में अग्रेषित नहीं किया जाता |
| अन्य ओवरराइड      | `resolution`, `audio`, `watermark` असमर्थित हैं और टूल चेतावनी के साथ हटा दिए जाते हैं |

OpenAI इमेज-से-वीडियो अनुरोध किसी इमेज
`input_reference` के साथ `POST /v1/videos` का उपयोग करते हैं। एकल-वीडियो संपादन में अपलोड किए गए वीडियो के साथ
`video` फ़ील्ड में `POST /v1/videos/edits` का उपयोग किया जाता है।

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: { primary: "openai/sora-2" },
    },
  },
}
```

<Note>
साझा टूल पैरामीटर, प्रदाता चयन और फ़ेलओवर व्यवहार के लिए [वीडियो जनरेशन](/hi/tools/video-generation) देखें।

OpenAI प्रदाता `supportsSize` घोषित करता है, लेकिन `supportsAspectRatio` या
`supportsResolution` नहीं। अनुरोध प्रदाता तक पहुँचने से पहले OpenClaw की साझा सामान्यीकरण परत अनुरोधित
`aspectRatio` को सबसे निकट मेल खाने वाले OpenAI `size` में बदल देती है, इसलिए आस्पेक्ट-अनुपात अनुरोध सामान्यतः फिर भी काम करते हैं।
`resolution` के लिए कोई आकार फ़ॉलबैक नहीं है और इसे हटा दिया जाता है तथा कॉलर को
`Ignored unsupported overrides for openai/<model>: resolution=<value>` के रूप में दिखाया जाता है।
</Note>

## GPT-5 प्रॉम्प्ट योगदान

OpenClaw, `openai` प्रदाता पर GPT-5-परिवार के मॉडल के लिए एक साझा GPT-5 प्रॉम्प्ट योगदान जोड़ता है
(इसमें पुराने, मरम्मत-पूर्व Codex संदर्भ भी शामिल हैं, जो
`openai/*` में सामान्यीकृत होते हैं)। OpenRouter या opencode रूट जैसे अन्य प्रदाता, जो GPT-5-परिवार की मॉडल आईडी भी प्रदान करते हैं, यह ओवरले प्राप्त नहीं करते; यह केवल मॉडल आईडी पर नहीं, बल्कि प्रदाता आईडी
`openai` पर निर्भर है। पुराने GPT-4.x मॉडल इसे कभी प्राप्त नहीं करते।

मूल Codex ऐप-सर्वर हार्नेस को डेवलपर निर्देशों के माध्यम से पर्सोना/टूल-
अनुशासन व्यवहार अनुबंध या मैत्रीपूर्ण इंटरैक्शन-शैली ओवरले प्राप्त नहीं होता; मूल Codex, Codex के स्वामित्व वाले आधार, मॉडल और
प्रोजेक्ट-दस्तावेज़ व्यवहार को बनाए रखता है, और OpenClaw मूल थ्रेड के लिए Codex के अंतर्निहित व्यक्तित्व को अक्षम करता है
ताकि एजेंट कार्यक्षेत्र की व्यक्तित्व फ़ाइलें ही प्रामाणिक रहें।
OpenClaw मूल Codex थ्रेड में केवल रनटाइम संदर्भ का योगदान करता है: चैनल
डिलीवरी, OpenClaw डायनेमिक टूल, ACP प्रत्यायोजन, कार्यक्षेत्र संदर्भ और
OpenClaw Skills। इसी योगदान का Heartbeat-मार्गदर्शन टेक्स्ट
एकमात्र अपवाद है: मूल Codex Heartbeat टर्न को यह मिलता है, जिसे साझा प्रॉम्प्ट-योगदान
हुक के बजाय समर्पित सहयोग निर्देशों के रूप में इंजेक्ट किया जाता है।

GPT-5 योगदान, मेल खाने वाले OpenClaw-संयोजित प्रॉम्प्ट के लिए पर्सोना
स्थायित्व, निष्पादन सुरक्षा, टूल अनुशासन, आउटपुट स्वरूप, पूर्णता
जाँच और सत्यापन हेतु एक टैग किया गया व्यवहार अनुबंध जोड़ता है। चैनल-
विशिष्ट उत्तर और मौन-संदेश व्यवहार साझा OpenClaw सिस्टम
प्रॉम्प्ट और आउटबाउंड डिलीवरी नीति में बने रहते हैं। मैत्रीपूर्ण इंटरैक्शन-शैली परत
अलग और कॉन्फ़िगर करने योग्य है।

| मान                  | प्रभाव                                      |
| ---------------------- | ------------------------------------------- |
| `"friendly"` (डिफ़ॉल्ट) | मैत्रीपूर्ण इंटरैक्शन-शैली परत सक्षम करें |
| `"on"`                 | `"friendly"` का उपनाम                      |
| `"off"`                | केवल मैत्रीपूर्ण शैली परत अक्षम करें       |

<Tabs>
  <Tab title="कॉन्फ़िगरेशन">
    ```json5
    {
      agents: {
        defaults: {
          promptOverlays: {
            gpt5: { personality: "friendly" },
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="CLI">
    ```bash
    openclaw config set agents.defaults.promptOverlays.gpt5.personality off
    ```
  </Tab>
</Tabs>

<Tip>
रनटाइम पर मानों में बड़े-छोटे अक्षरों का भेद नहीं होता, इसलिए `"Off"` और `"off"` दोनों
मैत्रीपूर्ण शैली परत को अक्षम करते हैं।
</Tip>

<Note>
जब साझा
`agents.defaults.promptOverlays.gpt5.personality` सेटिंग अनसेट होती है, तब पुराने `plugins.entries.openai.config.personality` को अभी भी
संगतता फ़ॉलबैक के रूप में पढ़ा जाता है।
</Note>

## आवाज़ और वाक्

<AccordionGroup>
  <Accordion title="वाक् संश्लेषण (TTS)">
    बंडल किया गया `openai` Plugin,
    `messages.tts` सतह के लिए वाक् संश्लेषण पंजीकृत करता है।

    | सेटिंग      | कॉन्फ़िगरेशन पथ                                            | डिफ़ॉल्ट                          |
    | ------------- | --------------------------------------------------------- | ----------------------------------- |
    | मॉडल        | `messages.tts.providers.openai.model`                  | `gpt-4o-mini-tts`                |
    | आवाज़        | `messages.tts.providers.openai.speakerVoice`           | `coral`                          |
    | गति        | `messages.tts.providers.openai.speed`                  | (अनसेट)                          |
    | निर्देश | `messages.tts.providers.openai.instructions`           | (अनसेट, केवल `gpt-4o-mini-tts`)  |
    | प्रारूप       | `messages.tts.providers.openai.responseFormat`         | वॉइस नोट के लिए `opus`, फ़ाइलों के लिए `mp3` |
    | API कुंजी      | `messages.tts.providers.openai.apiKey`                 | `OPENAI_API_KEY` पर फ़ॉलबैक करता है   |
    | आधार URL     | `messages.tts.providers.openai.baseUrl`                | `https://api.openai.com/v1`      |
    | अतिरिक्त बॉडी   | `messages.tts.providers.openai.extraBody` / `extra_body` | (अनसेट)                        |

    उपलब्ध मॉडल: `gpt-4o-mini-tts`, `tts-1`, `tts-1-hd`। उपलब्ध आवाज़ें:
    `alloy`, `ash`, `ballad`, `cedar`, `coral`, `echo`, `fable`, `juniper`,
    `marin`, `onyx`, `nova`, `sage`, `shimmer`, `verse`।

    OpenClaw द्वारा जनरेट किए गए फ़ील्ड के बाद `extraBody` को `/audio/speech` अनुरोध JSON में मर्ज किया जाता है,
    इसलिए `lang` जैसी अतिरिक्त कुंजियों की आवश्यकता वाले OpenAI-संगत एंडपॉइंट के लिए इसका उपयोग करें।
    प्रोटोटाइप कुंजियों को अनदेखा किया जाता है।

    ```json5
    {
      messages: {
        tts: {
          providers: {
            openai: { model: "gpt-4o-mini-tts", speakerVoice: "coral" },
          },
        },
      },
    }
    ```

    <Note>
    चैट API एंडपॉइंट को प्रभावित किए बिना TTS आधार URL को ओवरराइड करने के लिए `OPENAI_TTS_BASE_URL` सेट करें।
    OpenAI TTS और Realtime आवाज़, दोनों को OpenAI Platform API कुंजी के माध्यम से कॉन्फ़िगर किया जाता है; केवल OAuth वाले इंस्टॉलेशन अब भी
    Codex-समर्थित चैट मॉडल का उपयोग कर सकते हैं, लेकिन OpenAI लाइव प्रत्युत्तर का नहीं।
    </Note>

  </Accordion>

  <Accordion title="वाक्-से-टेक्स्ट">
    बंडल किया गया `openai` Plugin, OpenClaw की मीडिया-समझ ट्रांसक्रिप्शन सतह के माध्यम से
    बैच वाक्-से-टेक्स्ट पंजीकृत करता है।

    - डिफ़ॉल्ट मॉडल: `gpt-4o-transcribe`
    - एंडपॉइंट: OpenAI REST `/v1/audio/transcriptions`
    - इनपुट पथ: मल्टीपार्ट ऑडियो फ़ाइल अपलोड
    - जहाँ भी इनबाउंड ऑडियो ट्रांसक्रिप्शन `tools.media.audio` पढ़ता है, वहाँ उपयोग किया जाता है,
      जिसमें Discord वॉइस-चैनल खंड और चैनल ऑडियो अटैचमेंट शामिल हैं

    इनबाउंड ऑडियो ट्रांसक्रिप्शन के लिए OpenAI को अनिवार्य करने हेतु:

    ```json5
    {
      tools: {
        media: {
          audio: {
            models: [
              {
                type: "provider",
                provider: "openai",
                model: "gpt-4o-transcribe",
              },
            ],
          },
        },
      },
    }
    ```

    साझा ऑडियो मीडिया कॉन्फ़िगरेशन या प्रति-कॉल ट्रांसक्रिप्शन अनुरोध द्वारा दिए जाने पर
    भाषा और प्रॉम्प्ट संकेत OpenAI को अग्रेषित किए जाते हैं।

  </Accordion>

  <Accordion title="रीयलटाइम ट्रांसक्रिप्शन">
    बंडल किया गया `openai` Plugin, Voice Call Plugin के लिए
    रीयलटाइम ट्रांसक्रिप्शन पंजीकृत करता है।

    | सेटिंग          | कॉन्फ़िगरेशन पथ                                                          | डिफ़ॉल्ट |
    | ----------------- | ----------------------------------------------------------------------- | --------- |
    | मॉडल            | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | भाषा         | `...openai.language`                                                 | (अनसेट) |
    | प्रॉम्प्ट           | `...openai.prompt`                                                   | (अनसेट) |
    | मौन अवधि | `...openai.silenceDurationMs`                                        | `800`   |
    | VAD थ्रेशोल्ड    | `...openai.vadThreshold`                                             | `0.5`   |
    | प्रमाणीकरण             | `...openai.apiKey`, `OPENAI_API_KEY`, या `openai` API-कुंजी प्रोफ़ाइल    | Platform API कुंजी आवश्यक |

    <Note>
    G.711 u-law (`g711_ulaw` / `audio/pcmu`) ऑडियो के साथ
    `wss://api.openai.com/v1/realtime` से WebSocket कनेक्शन का उपयोग करता है। `openai` API-कुंजी
    प्रोफ़ाइल के लिए, Gateway WebSocket खोलने से पहले एक अस्थायी Realtime ट्रांसक्रिप्शन क्लाइंट
    सीक्रेट बनाता है। यह स्ट्रीमिंग प्रदाता Voice
    Call के रीयलटाइम ट्रांसक्रिप्शन पथ के लिए है; वर्तमान में Discord वॉइस छोटे
    खंड रिकॉर्ड करता है और इसके बजाय बैच `tools.media.audio` ट्रांसक्रिप्शन पथ का उपयोग करता है।
    </Note>

  </Accordion>

  <Accordion title="रीयलटाइम आवाज़">
    बंडल किया गया `openai` Plugin, Voice Call
    Plugin के लिए रीयलटाइम आवाज़ पंजीकृत करता है।

    | सेटिंग                               | कॉन्फ़िगरेशन पथ                                                              | डिफ़ॉल्ट             |
    | --------------------------------------- | ---------------------------------------------------------------------------- | ---------------------- |
    | मॉडल                                  | `plugins.entries.voice-call.config.realtime.providers.openai.model`     | `gpt-realtime-2.1`  |
    | आवाज़                                  | `...openai.voice`                                                       | `alloy`             |
    | तापमान (Azure डिप्लॉयमेंट ब्रिज)  | `...openai.temperature`                                                 | `0.8`               |
    | VAD थ्रेशोल्ड                          | `...openai.vadThreshold`                                                | `0.5`                |
    | मौन अवधि                       | `...openai.silenceDurationMs`                                           | `500`                |
    | प्रीफ़िक्स पैडिंग                         | `...openai.prefixPaddingMs`                                             | `300`                |
    | रीजनिंग प्रयास                       | `...openai.reasoningEffort`                                             | (अनसेट)              |
    | प्रमाणीकरण                                   | `openai` API-कुंजी प्रोफ़ाइल, `...openai.apiKey`, या `OPENAI_API_KEY` | OpenAI Platform API कुंजी आवश्यक |

    `gpt-realtime-2.1` के लिए उपलब्ध अंतर्निहित Realtime आवाज़ें: `alloy`, `ash`,
    `ballad`, `coral`, `echo`, `sage`, `shimmer`, `verse`, `marin`, `cedar`।
    सर्वोत्तम Realtime गुणवत्ता के लिए OpenAI, `marin` और `cedar` की अनुशंसा करता है। यह
    ऊपर दी गई टेक्स्ट-से-वाक् आवाज़ों से अलग सेट है; केवल TTS वाली आवाज़,
    जैसे `fable`, `nova`, या `onyx`, Realtime सत्रों के लिए मान्य नहीं है।
    यदि आप छोटे, कम लागत वाले Realtime 2.1 संस्करण को प्राथमिकता देते हैं, तो मॉडल को स्पष्ट रूप से
    `gpt-realtime-2.1-mini` पर सेट करें।

    <Note>
    **GPT-Live (आगामी)।** OpenAI के फ़ुल-डुप्लेक्स `gpt-live-1` और
    `gpt-live-1-mini` मॉडल ने जुलाई 2026 में ChatGPT वॉइस मोड को प्रतिस्थापित किया; डेवलपर API को
    आरंभिक-पहुँच वाले संगठनों के लिए धीरे-धीरे उपलब्ध कराया जा रहा है। OpenClaw
    मॉडल परिवार को पहचानता है, लेकिन अभी इसे चलाता नहीं है: GPT-Live सत्र
    केवल WebRTC पर चलते हैं, अपना टर्न-टेकिंग स्वयं संभालते हैं (कोई VAD नहीं), और एजेंट कार्य को
    हैंडऑफ़ इवेंट प्रोटोकॉल के माध्यम से प्रत्यायोजित करते हैं, जिसे OpenClaw के रीयलटाइम ट्रांसपोर्ट अभी
    लागू नहीं करते। `gpt-live-*` मॉडल कॉन्फ़िगर करने पर चुपचाप
    एजेंट पहुँच के बिना ऑडियो कनेक्ट करने के बजाय WebSocket ब्रिज और Talk ब्राउज़र सत्र, दोनों के बारे में मार्गदर्शन देते हुए
    सुरक्षित रूप से विफलता होती है। आरंभिक पहुँच के दौरान API पहुँच भी
    प्रति OpenAI संगठन नियंत्रित होती है। GPT-Live समर्थन आने तक `gpt-realtime-2.1` (डिफ़ॉल्ट)
    बनाए रखें।
    </Note>

    <Note>
    बैकएंड OpenAI रीयलटाइम ब्रिज GA Realtime WebSocket सत्र
    संरचना का उपयोग करते हैं, जो `session.temperature` स्वीकार नहीं करती। Azure OpenAI
    डिप्लॉयमेंट `azureEndpoint` और `azureDeployment` के माध्यम से उपलब्ध रहते हैं और
    डिप्लॉयमेंट-संगत सत्र संरचना (`temperature` सहित) बनाए रखते हैं।
    द्विदिश टूल कॉलिंग और G.711 u-law ऑडियो का समर्थन करता है।
    </Note>

    <Note>
    सत्र बनाते समय रीयलटाइम वॉइस चुनी जाती है। OpenAI अधिकांश
    सत्र फ़ील्ड बाद में बदलने की अनुमति देता है, लेकिन उस सत्र में मॉडल द्वारा
    ऑडियो उत्सर्जित किए जाने के बाद वॉइस नहीं बदली जा सकती। OpenClaw वर्तमान में
    अंतर्निहित रीयलटाइम वॉइस आईडी को स्ट्रिंग के रूप में उपलब्ध कराता है।
    </Note>

    <Note>
    Control UI Talk, Gateway द्वारा जारी अस्थायी क्लाइंट सीक्रेट और
    OpenAI Realtime API के साथ सीधे ब्राउज़र WebRTC SDP विनिमय वाली OpenAI
    ब्राउज़र रीयलटाइम सत्रों का उपयोग करता है। Gateway उस क्लाइंट सीक्रेट को
    चुने गए `openai` क्रेडेंशियल से जारी करता है। कॉन्फ़िगर की गई कुंजियों, API-कुंजी प्रोफ़ाइलों और
    `OPENAI_API_KEY` को प्राथमिकता मिलती है; `openai` OAuth प्रोफ़ाइल या बाहरी
    Codex लॉगिन फ़ॉलबैक है। Gateway रिले और Voice Call बैकएंड रीयलटाइम
    WebSocket ब्रिज, मूल OpenAI एंडपॉइंट के लिए समान क्रेडेंशियल क्रम का उपयोग करते हैं।
    मेंटेनर लाइव सत्यापन
    `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` के साथ उपलब्ध है;
    OpenAI चरण, सीक्रेट लॉग किए बिना बैकएंड WebSocket ब्रिज और ब्राउज़र
    WebRTC SDP विनिमय दोनों को सत्यापित करते हैं।
    Google क्रेडेंशियल के बिना उन दोनों चरणों को चलाने के लिए `--openai-only` पास करें।
    </Note>

  </Accordion>
</AccordionGroup>

## Azure OpenAI एंडपॉइंट

बंडल किया गया `openai` प्रदाता, बेस URL को ओवरराइड करके इमेज
जनरेशन के लिए किसी Azure OpenAI संसाधन को लक्षित कर सकता है। इमेज-जनरेशन पथ पर, OpenClaw
`models.providers.openai.baseUrl` पर Azure होस्टनाम का पता लगाता है और
स्वचालित रूप से Azure के अनुरोध प्रारूप पर स्विच करता है।

<Note>
रीयलटाइम वॉइस एक अलग कॉन्फ़िगरेशन पथ
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
का उपयोग करती है और `models.providers.openai.baseUrl` से प्रभावित नहीं होती। इसकी Azure
सेटिंग के लिए [वॉइस और स्पीच](#voice-and-speech) के अंतर्गत **रीयलटाइम
वॉइस** अकॉर्डियन देखें।
</Note>

Azure OpenAI का उपयोग तब करें जब:

- आपके पास पहले से Azure OpenAI सदस्यता, कोटा या एंटरप्राइज़
  अनुबंध हो
- आपको Azure द्वारा प्रदान किए जाने वाले क्षेत्रीय डेटा रेज़िडेंसी या अनुपालन नियंत्रणों की आवश्यकता हो
- आप ट्रैफ़िक को किसी मौजूदा Azure टेनेंसी के भीतर रखना चाहते हों

### कॉन्फ़िगरेशन

बंडल किए गए `openai` प्रदाता के माध्यम से Azure इमेज जनरेशन के लिए,
`models.providers.openai.baseUrl` को अपने Azure संसाधन पर इंगित करें और `apiKey` को
Azure OpenAI कुंजी पर सेट करें (OpenAI Platform कुंजी पर नहीं):

```json5
{
  models: {
    providers: {
      openai: {
        baseUrl: "https://<your-resource>.openai.azure.com",
        apiKey: "<azure-openai-api-key>",
      },
    },
  },
}
```

OpenClaw, Azure इमेज-जनरेशन रूट के लिए इन Azure होस्ट प्रत्ययों को
पहचानता है:

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

किसी पहचाने गए Azure होस्ट पर इमेज-जनरेशन अनुरोधों के लिए, OpenClaw:

- `Authorization: Bearer` के बजाय `api-key` हेडर भेजता है
- डिप्लॉयमेंट-स्कोप वाले पथों (`/openai/deployments/{deployment}/...`) का उपयोग करता है
- प्रत्येक अनुरोध में `?api-version=...` जोड़ता है
- Azure इमेज-जनरेशन कॉल के लिए 600s की डिफ़ॉल्ट अनुरोध समय-सीमा का उपयोग करता है।
  प्रति-कॉल `timeoutMs` मान अब भी इस डिफ़ॉल्ट को ओवरराइड करते हैं।

अन्य बेस URL (सार्वजनिक OpenAI, OpenAI-संगत प्रॉक्सी) मानक
OpenAI इमेज अनुरोध प्रारूप बनाए रखते हैं।

<Note>
`openai` प्रदाता के इमेज-जनरेशन पथ के लिए Azure रूटिंग हेतु
OpenClaw 2026.4.22 या बाद का संस्करण आवश्यक है। पुराने संस्करण किसी भी कस्टम
`openai.baseUrl` को सार्वजनिक OpenAI एंडपॉइंट की तरह मानते हैं और Azure इमेज
डिप्लॉयमेंट के साथ विफल होते हैं।
</Note>

### API संस्करण

Azure इमेज-जनरेशन पथ के लिए किसी विशिष्ट Azure प्रीव्यू या GA संस्करण को
स्थिर करने हेतु `AZURE_OPENAI_API_VERSION` सेट करें:

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

वेरिएबल सेट न होने पर डिफ़ॉल्ट `2024-12-01-preview` है।

### मॉडल नाम डिप्लॉयमेंट नाम होते हैं

Azure OpenAI मॉडल को डिप्लॉयमेंट से बाँधता है। बंडल किए गए
`openai` प्रदाता के माध्यम से रूट किए गए Azure इमेज-जनरेशन अनुरोधों के लिए, OpenClaw में
`model` फ़ील्ड वह **Azure डिप्लॉयमेंट नाम** होना चाहिए जिसे आपने Azure पोर्टल में
कॉन्फ़िगर किया है, न कि सार्वजनिक OpenAI मॉडल आईडी।

यदि आप `gpt-image-2` प्रस्तुत करने वाला `gpt-image-2-prod` नामक डिप्लॉयमेंट बनाते हैं:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="एक साफ़-सुथरा पोस्टर" size=1024x1024 count=1
```

यही डिप्लॉयमेंट-नाम नियम बंडल किए गए `openai` प्रदाता के माध्यम से
रूट की गई प्रत्येक इमेज-जनरेशन कॉल पर लागू होता है।

### क्षेत्रीय उपलब्धता

Azure इमेज जनरेशन वर्तमान में केवल कुछ क्षेत्रों में उपलब्ध है
(उदाहरण के लिए `eastus2`, `swedencentral`, `polandcentral`, `westus3`,
`uaenorth`)। डिप्लॉयमेंट बनाने से पहले Microsoft की वर्तमान क्षेत्र सूची देखें,
और पुष्टि करें कि विशिष्ट मॉडल आपके क्षेत्र में उपलब्ध है।

### पैरामीटर अंतर

Azure OpenAI और सार्वजनिक OpenAI हमेशा समान इमेज पैरामीटर स्वीकार नहीं करते।
Azure उन विकल्पों को अस्वीकार कर सकता है जिन्हें सार्वजनिक OpenAI अनुमति देता है (उदाहरण के लिए
`gpt-image-2` पर कुछ `background` मान), या उन्हें केवल विशिष्ट मॉडल
संस्करणों पर उपलब्ध करा सकता है। ये अंतर Azure और अंतर्निहित मॉडल से आते हैं,
OpenClaw से नहीं। यदि कोई Azure अनुरोध सत्यापन त्रुटि के साथ विफल होता है, तो Azure
पोर्टल में अपने विशिष्ट डिप्लॉयमेंट और API संस्करण द्वारा समर्थित
पैरामीटर सेट जाँचें।

<Note>
Azure OpenAI मूल ट्रांसपोर्ट और संगतता व्यवहार का उपयोग करता है, लेकिन उसे
OpenClaw के छिपे हुए एट्रिब्यूशन हेडर प्राप्त नहीं होते—[उन्नत कॉन्फ़िगरेशन](#advanced-configuration) के अंतर्गत **मूल बनाम OpenAI-संगत
रूट** अकॉर्डियन देखें।

Azure पर चैट या Responses ट्रैफ़िक (इमेज जनरेशन के अतिरिक्त) के लिए,
ऑनबोर्डिंग प्रवाह या समर्पित Azure प्रदाता कॉन्फ़िगरेशन का उपयोग करें; केवल `openai.baseUrl`
Azure API/प्रमाणीकरण प्रारूप नहीं अपनाता। एक अलग
`azure-openai-responses/*` प्रदाता मौजूद है; नीचे सर्वर-साइड Compaction
अकॉर्डियन देखें।
</Note>

## उन्नत कॉन्फ़िगरेशन

नीचे दिए गए प्रति-मॉडल `params` उदाहरण OpenClaw के एम्बेडेड प्रदाता
अनुरोध को आकार देते हैं। इन्हें कॉन्फ़िगर करना लेखित अनुरोध व्यवहार है, इसलिए अन्यथा योग्य
`auto` रूट, Codex को अप्रत्यक्ष रूप से चुनने के बजाय OpenClaw पर बना रहता है। मूल
Codex ऐप-सर्वर हार्नेस अपने ट्रांसपोर्ट और अनुरोध सेटिंग का स्वयं स्वामी है; प्रभावी रूट के
Codex-संगत घोषित न होने पर स्पष्ट
`agentRuntime.id: "codex"` सुरक्षित रूप से विफल होता है।

<AccordionGroup>
  <Accordion title="ट्रांसपोर्ट (WebSocket बनाम SSE)">
    OpenClaw, `openai/*` के लिए SSE फ़ॉलबैक (`"auto"`) के साथ WebSocket-प्रथम का उपयोग करता है।

    `"auto"` मोड में, OpenClaw:
    - SSE पर फ़ॉलबैक करने से पहले एक शुरुआती WebSocket विफलता पर पुनः प्रयास करता है
    - विफलता के बाद, WebSocket को 60 सेकंड के लिए अवनत चिह्नित करता है और कूल-डाउन
      के दौरान SSE का उपयोग करता है
    - पुनः प्रयासों और पुनः कनेक्शन के लिए स्थिर सत्र और टर्न पहचान हेडर
      संलग्न करता है
    - ट्रांसपोर्ट प्रकारों में उपयोग काउंटरों (`input_tokens` / `prompt_tokens`) को
      सामान्यीकृत करता है

    | मान                | व्यवहार                          |
    | ---------------------- | ------------------------------------ |
    | `"auto"` (डिफ़ॉल्ट)   | पहले WebSocket, SSE फ़ॉलबैक     |
    | `"sse"`              | केवल SSE को बाध्य करें                    |
    | `"websocket"`        | केवल WebSocket को बाध्य करें              |

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": {
              params: { transport: "auto" },
            },
          },
        },
      },
    }
    ```

    संबंधित OpenAI दस्तावेज़:
    - [WebSocket के साथ Realtime API](https://platform.openai.com/docs/guides/realtime-websocket)
    - [स्ट्रीमिंग API प्रतिक्रियाएँ (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="तेज़ मोड">
    OpenClaw, `openai/*` के लिए साझा तेज़-मोड टॉगल उपलब्ध कराता है:

    - **चैट/UI:** `/fast status|auto|on|off`
    - **कॉन्फ़िगरेशन:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    सक्षम होने पर, OpenClaw तेज़ मोड को OpenAI प्राथमिकता प्रोसेसिंग
    (`service_tier = "priority"`) पर मैप करता है। मौजूदा `service_tier` मान
    संरक्षित रहते हैं, और तेज़ मोड `reasoning` या
    `text.verbosity` को दोबारा नहीं लिखता। `fastMode: "auto"` स्वचालित कटऑफ़ तक नई मॉडल कॉल को
    तेज़ शुरू करता है, फिर बाद की पुनः प्रयास, फ़ॉलबैक, टूल-परिणाम या
    निरंतरता कॉल को तेज़ मोड के बिना शुरू करता है। कटऑफ़ का डिफ़ॉल्ट 60 सेकंड है;
    इसे बदलने के लिए सक्रिय मॉडल पर `params.fastAutoOnSeconds` सेट करें।

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": { params: { fastMode: "auto", fastAutoOnSeconds: 30 } },
          },
        },
      },
    }
    ```

    <Note>
    सत्र ओवरराइड को कॉन्फ़िगरेशन पर प्राथमिकता मिलती है। Sessions UI में सत्र
    ओवरराइड साफ़ करने पर सत्र कॉन्फ़िगर किए गए डिफ़ॉल्ट पर लौट जाता है।
    </Note>

  </Accordion>

  <Accordion title="प्राथमिकता प्रोसेसिंग (service_tier)">
    OpenAI का API `service_tier` के माध्यम से प्राथमिकता प्रोसेसिंग उपलब्ध कराता है। इसे OpenClaw में
    प्रति मॉडल सेट करें:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": { params: { serviceTier: "priority" } },
          },
        },
      },
    }
    ```

    समर्थित मान: `auto`, `default`, `flex`, `priority`।

    <Warning>
    `serviceTier` केवल मूल OpenAI एंडपॉइंट
    (`api.openai.com`) और मूल Codex एंडपॉइंट (`chatgpt.com/backend-api`) को अग्रेषित किया जाता है।
    यदि आप किसी भी प्रदाता को प्रॉक्सी के माध्यम से रूट करते हैं, तो OpenClaw
    `service_tier` को अपरिवर्तित छोड़ देता है।
    </Warning>

  </Accordion>

  <Accordion title="सर्वर-साइड Compaction (Responses API)">
    सीधे OpenAI Responses मॉडल (`api.openai.com` पर `openai/*`) के लिए,
    OpenAI Plugin का OpenClaw स्ट्रीम रैपर सर्वर-साइड
    Compaction को स्वतः सक्षम करता है:

    - `store: true` को बाध्य करता है (जब तक मॉडल संगतता `supportsStore: false` सेट न करे)
    - `context_management: [{ type: "compaction", compact_threshold: ... }]` अंतःक्षेपित करता है
    - डिफ़ॉल्ट `compact_threshold`: `contextWindow` का 70% (या अनुपलब्ध होने पर `80000`)

    यह अंतर्निहित OpenClaw रनटाइम पथ और एम्बेडेड रन द्वारा उपयोग किए जाने वाले OpenAI प्रदाता
    हुक पर लागू होता है। मूल Codex ऐप-सर्वर हार्नेस
    Codex के माध्यम से अपने कॉन्टेक्स्ट को स्वयं प्रबंधित करता है और इस सेटिंग से प्रभावित नहीं होता।

    <Tabs>
      <Tab title="स्पष्ट रूप से सक्षम करें">
        Azure OpenAI Responses जैसे संगत एंडपॉइंट के लिए उपयोगी:

        ```json5
        {
          agents: {
            defaults: {
              models: {
                "azure-openai-responses/gpt-5.5": {
                  params: { responsesServerCompaction: true },
                },
              },
            },
          },
        }
        ```
      </Tab>
      <Tab title="कस्टम थ्रेशोल्ड">
        ```json5
        {
          agents: {
            defaults: {
              models: {
                "openai/gpt-5.5": {
                  params: {
                    responsesServerCompaction: true,
                    responsesCompactThreshold: 120000,
                  },
                },
              },
            },
          },
        }
        ```
      </Tab>
      <Tab title="अक्षम करें">
        ```json5
        {
          agents: {
            defaults: {
              models: {
                "openai/gpt-5.5": {
                  params: { responsesServerCompaction: false },
                },
              },
            },
          },
        }
        ```
      </Tab>
    </Tabs>

    <Note>
    `responsesServerCompaction` केवल `context_management` अंतःक्षेपण नियंत्रित करता है।
    सीधे OpenAI Responses मॉडल अब भी `store: true` को बाध्य करते हैं, जब तक संगतता
    `supportsStore: false` सेट न करे।
    </Note>

  </Accordion>

  <Accordion title="सख़्त-एजेंटिक GPT मोड">
    OpenClaw के एम्बेडेड रनटाइम के माध्यम से चलाए जाने वाले `openai` प्रदाता के GPT-5-परिवार मॉडल के लिए,
    OpenClaw पहले से ही `strict-agentic` नामक अधिक सख़्त निष्पादन अनुबंध को
    डिफ़ॉल्ट बनाता है। जब भी समाधान किया गया प्रदाता
    `openai` हो और मॉडल आईडी GPT-5 परिवार से मेल खाए, यह स्वतः सक्रिय हो जाता है, जब तक कॉन्फ़िगरेशन
    स्पष्ट रूप से इससे बाहर निकलने का विकल्प न चुने:

    ```json5
    {
      agents: {
        defaults: {
          embeddedAgent: { executionContract: "default" },
        },
      },
    }
    ```

    `"strict-agentic"` को स्पष्ट रूप से सेट करना समर्थित लेन पर कोई प्रभाव नहीं डालता (यह
    पहले से ही डिफ़ॉल्ट है) और असमर्थित प्रदाता/मॉडल युग्मों पर निष्क्रिय रहता है।

    `strict-agentic` सक्रिय होने पर, OpenClaw:
    - महत्वपूर्ण कार्य के लिए `update_plan` को स्वतः सक्षम करता है
    - संरचनात्मक रूप से रिक्त या केवल तर्क वाले टर्न को दृश्यमान-उत्तर
      निरंतरता के साथ पुनः प्रयास करता है
    - चयनित हार्नेस द्वारा उपलब्ध कराए जाने पर स्पष्ट हार्नेस योजना इवेंट का
      उपयोग करता है

    OpenClaw यह तय करने के लिए सहायक के गद्य को वर्गीकृत नहीं करता कि कोई टर्न
    योजना, प्रगति अपडेट या अंतिम उत्तर है।

    <Note>
    यह अनुबंध पूरी तरह OpenClaw के एम्बेडेड एजेंट रनर में रहता है। यह
    मूल Codex ऐप-सर्वर हार्नेस पर लागू नहीं होता, जो अपने टर्न और योजना
    व्यवहार को स्वयं प्रबंधित करता है; मूल Codex रन के लिए
    निष्पादन-अनुबंध सेटिंग की तुलना में हार्नेस का चयन अधिक महत्वपूर्ण है।
    </Note>

  </Accordion>

  <Accordion title="मूल बनाम OpenAI-संगत रूट">
    OpenClaw सीधे OpenAI, Codex और Azure OpenAI एंडपॉइंट को
    सामान्य OpenAI-संगत `/v1` प्रॉक्सी से अलग मानता है:

    **मूल रूट** (`openai/*`, Azure OpenAI):
    - `reasoning: { effort: "none" }` को केवल उन मॉडल के लिए रखता है जो
      OpenAI `none` प्रयास का समर्थन करते हैं
    - उन मॉडल या प्रॉक्सी के लिए अक्षम तर्क को छोड़ देता है जो
      `reasoning.effort: "none"` को अस्वीकार करते हैं
    - टूल स्कीमा को डिफ़ॉल्ट रूप से सख्त मोड में रखता है
    - छिपे हुए एट्रिब्यूशन हेडर केवल सत्यापित मूल होस्ट पर संलग्न करता है (Azure
      OpenAI को ये हेडर नहीं मिलते, भले ही वह एक मूल रूट है)
    - केवल OpenAI के लिए अनुरोध आकार-निर्धारण (`service_tier`, `store`,
      तर्क-संगतता, प्रॉम्प्ट-कैश संकेत) बनाए रखता है

    **प्रॉक्सी/संगत रूट:**
    - अधिक शिथिल संगतता व्यवहार का उपयोग करते हैं
    - गैर-मूल `openai-completions` पेलोड से Completions `store` हटाते हैं
    - OpenAI-संगत Completions प्रॉक्सी के लिए उन्नत
      `params.extra_body`/`params.extraBody` पास-थ्रू JSON स्वीकार करते हैं
    - vLLM जैसे OpenAI-संगत Completions
      प्रॉक्सी के लिए `params.chat_template_kwargs` स्वीकार करते हैं
    - सख्त टूल स्कीमा या केवल-मूल हेडर बाध्य नहीं करते

  </Accordion>
</AccordionGroup>

## संबंधित

<CardGroup cols={2}>
  <Card title="मॉडल चयन" href="/hi/concepts/model-providers" icon="layers">
    प्रदाताओं, मॉडल संदर्भों और फ़ेलओवर व्यवहार का चयन।
  </Card>
  <Card title="छवि निर्माण" href="/hi/tools/image-generation" icon="image">
    साझा छवि टूल पैरामीटर और प्रदाता चयन।
  </Card>
  <Card title="वीडियो निर्माण" href="/hi/tools/video-generation" icon="video">
    साझा वीडियो टूल पैरामीटर और प्रदाता चयन।
  </Card>
  <Card title="OAuth और प्रमाणीकरण" href="/hi/gateway/authentication" icon="key">
    प्रमाणीकरण विवरण और क्रेडेंशियल के पुनः उपयोग के नियम।
  </Card>
</CardGroup>
