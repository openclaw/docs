---
read_when:
    - आप OpenClaw में OpenAI मॉडल का उपयोग करना चाहते हैं
    - आप API कुंजियों के बजाय Codex सब्सक्रिप्शन auth चाहते हैं
    - आपको अधिक सख्त GPT-5 एजेंट निष्पादन व्यवहार चाहिए
summary: OpenClaw में API कुंजियों या Codex सदस्यता के माध्यम से OpenAI का उपयोग करें
title: OpenAI
x-i18n:
    generated_at: "2026-06-29T00:01:10Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3f5346c6bb85341c4e1709e3023dee8b32a413189d5564778e9c919b7eaa78f1
    source_path: providers/openai.md
    workflow: 16
---

OpenAI GPT मॉडलों के लिए डेवलपर API प्रदान करता है, और Codex OpenAI के Codex क्लाइंट के माध्यम से ChatGPT-प्लान कोडिंग एजेंट के रूप में भी उपलब्ध है। OpenClaw दोनों प्रमाणीकरण आकृतियों के लिए एक ही provider id, `openai`, का उपयोग करता है।

OpenClaw कैननिकल OpenAI मॉडल रूट के रूप में `openai/*` का उपयोग करता है। OpenAI मॉडलों पर एम्बेडेड एजेंट टर्न डिफ़ॉल्ट रूप से नेटिव Codex ऐप-सर्वर रनटाइम के माध्यम से चलते हैं; इमेज, एम्बेडिंग, स्पीच और रियलटाइम जैसे गैर-एजेंट OpenAI सतहों के लिए प्रत्यक्ष OpenAI API-key प्रमाणीकरण उपलब्ध रहता है।

- **एजेंट मॉडल** - Codex रनटाइम के माध्यम से `openai/*` मॉडल; ChatGPT/Codex सब्सक्रिप्शन उपयोग के लिए Codex प्रमाणीकरण से साइन इन करें, या जब आप जानबूझकर API-key प्रमाणीकरण चाहते हों, तब Codex-संगत OpenAI API-key बैकअप कॉन्फ़िगर करें।
- **गैर-एजेंट OpenAI API** - `OPENAI_API_KEY` या OpenAI API-key ऑनबोर्डिंग के माध्यम से उपयोग-आधारित बिलिंग के साथ प्रत्यक्ष OpenAI Platform पहुंच।
- **लेगेसी कॉन्फ़िग** - लेगेसी Codex मॉडल संदर्भों को `openclaw doctor --fix` द्वारा `openai/*` और Codex रनटाइम में सुधारा जाता है।

OpenAI स्पष्ट रूप से OpenClaw जैसे बाहरी टूल और वर्कफ़्लो में सब्सक्रिप्शन OAuth उपयोग का समर्थन करता है।

Provider, मॉडल, रनटाइम और चैनल अलग-अलग परतें हैं। यदि ये लेबल आपस में मिल रहे हैं, तो कॉन्फ़िग बदलने से पहले [एजेंट रनटाइम](/hi/concepts/agent-runtimes) पढ़ें।

## तुरंत चयन

| लक्ष्य                                                 | उपयोग                                                      | नोट्स                                                                 |
| ---------------------------------------------------- | -------------------------------------------------------- | --------------------------------------------------------------------- |
| नेटिव Codex रनटाइम के साथ ChatGPT/Codex सब्सक्रिप्शन | `openai/gpt-5.5`                                         | डिफ़ॉल्ट OpenAI एजेंट सेटअप। Codex प्रमाणीकरण से साइन इन करें।                  |
| एजेंट मॉडलों के लिए प्रत्यक्ष API-key बिलिंग              | `openai/gpt-5.5` और Codex-संगत API-key प्रोफ़ाइल | सब्सक्रिप्शन प्रमाणीकरण के बाद बैकअप रखने के लिए `auth.order.openai` का उपयोग करें।  |
| स्पष्ट OpenClaw के माध्यम से प्रत्यक्ष API-key बिलिंग     | `openai/gpt-5.5` और provider/model रनटाइम `openclaw`  | सामान्य `openai` API-key प्रोफ़ाइल चुनें।                             |
| नवीनतम ChatGPT Instant API ऐलियस                     | `openai/chat-latest`                                     | केवल प्रत्यक्ष API-key। प्रयोगों के लिए बदलता ऐलियस, डिफ़ॉल्ट नहीं।   |
| OpenClaw के माध्यम से ChatGPT/Codex सब्सक्रिप्शन प्रमाणीकरण     | `openai/gpt-5.5` और provider/model रनटाइम `openclaw`  | संगतता रूट के लिए `openai` OAuth प्रोफ़ाइल चुनें।         |
| इमेज बनाना या संपादित करना                          | `openai/gpt-image-2`                                     | `OPENAI_API_KEY` या OpenAI Codex OAuth, दोनों के साथ काम करता है।             |
| पारदर्शी-बैकग्राउंड इमेज                        | `openai/gpt-image-1.5`                                   | `outputFormat=png` या `webp` और `openai.background=transparent` का उपयोग करें। |

## नामकरण मैप

नाम समान हैं, लेकिन परस्पर बदलने योग्य नहीं हैं:

| दिखने वाला नाम                            | परत             | अर्थ                                                                                           |
| --------------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------- |
| `openai`                                | Provider प्रीफ़िक्स   | कैननिकल OpenAI मॉडल रूट; एजेंट टर्न Codex रनटाइम का उपयोग करते हैं।                                  |
| लेगेसी OpenAI Codex प्रीफ़िक्स              | लेगेसी प्रीफ़िक्स     | पुराना मॉडल/प्रोफ़ाइल नेमस्पेस। `openclaw doctor --fix` इसे `openai` में माइग्रेट करता है।                   |
| `codex` Plugin                          | Plugin            | बंडल किया गया OpenClaw Plugin जो नेटिव Codex ऐप-सर्वर रनटाइम और `/codex` चैट नियंत्रण प्रदान करता है। |
| provider/model `agentRuntime.id: codex` | एजेंट रनटाइम     | मेल खाते एम्बेडेड टर्न के लिए नेटिव Codex ऐप-सर्वर हार्नेस को बाध्य करें।                            |
| `/codex ...`                            | चैट कमांड सेट  | बातचीत से Codex ऐप-सर्वर थ्रेड को बाइंड/नियंत्रित करें।                                        |
| `runtime: "acp", agentId: "codex"`      | ACP सेशन रूट | स्पष्ट फ़ॉलबैक पथ जो ACP/acpx के माध्यम से Codex चलाता है।                                          |

इसका अर्थ है कि कोई कॉन्फ़िग जानबूझकर `openai/*` मॉडल संदर्भ रख सकता है, जबकि प्रमाणीकरण प्रोफ़ाइल API-key या ChatGPT/Codex OAuth क्रेडेंशियल में से किसी पर इंगित कर सकती हैं। कॉन्फ़िग के लिए `auth.order.openai` का उपयोग करें; `openclaw doctor --fix` लेगेसी Codex मॉडल संदर्भों, लेगेसी Codex प्रमाणीकरण प्रोफ़ाइल id और लेगेसी Codex प्रमाणीकरण क्रम को कैननिकल OpenAI रूट में फिर से लिखता है।

<Note>
GPT-5.5 प्रत्यक्ष OpenAI Platform API-key पहुंच और सब्सक्रिप्शन/OAuth रूट, दोनों के माध्यम से उपलब्ध है। ChatGPT/Codex सब्सक्रिप्शन और नेटिव Codex निष्पादन के लिए, `openai/gpt-5.5` का उपयोग करें; रनटाइम कॉन्फ़िग अनसेट होने पर अब OpenAI एजेंट टर्न के लिए Codex हार्नेस चुना जाता है। OpenAI एजेंट मॉडल के लिए प्रत्यक्ष API-key प्रमाणीकरण चाहिए तभी OpenAI API-key प्रोफ़ाइल का उपयोग करें।
</Note>

<Note>
OpenAI एजेंट मॉडल टर्न के लिए बंडल किया गया Codex ऐप-सर्वर Plugin आवश्यक है। स्पष्ट OpenClaw रनटाइम कॉन्फ़िग ऑप्ट-इन संगतता रूट के रूप में उपलब्ध रहता है। जब `openai` OAuth प्रोफ़ाइल के साथ OpenClaw स्पष्ट रूप से चुना जाता है, तो OpenClaw सार्वजनिक मॉडल संदर्भ को `openai/*` के रूप में रखता है और आंतरिक रूप से Codex-प्रमाणीकरण ट्रांसपोर्ट के माध्यम से रूट करता है। पुराने लेगेसी Codex मॉडल संदर्भ, `codex-cli/*`, या स्पष्ट रनटाइम कॉन्फ़िग से न आने वाले पुराने रनटाइम सेशन पिन सुधारने के लिए `openclaw doctor --fix` चलाएँ।
</Note>

## OpenClaw सुविधा कवरेज

| OpenAI क्षमता         | OpenClaw सतह                                                                              | स्थिति                                                                 |
| ------------------------- | --------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| चैट / Responses          | `openai/<model>` मॉडल provider                                                               | हाँ                                                                    |
| Codex सब्सक्रिप्शन मॉडल | OpenAI OAuth के साथ `openai/<model>`                                                            | हाँ                                                                    |
| लेगेसी Codex मॉडल संदर्भ   | लेगेसी Codex मॉडल संदर्भ या `codex-cli/<model>`                                                | doctor द्वारा `openai/<model>` में सुधारा गया                                 |
| Codex ऐप-सर्वर हार्नेस  | छोड़े गए रनटाइम या provider/model `agentRuntime.id: codex` के साथ `openai/<model>`              | हाँ                                                                    |
| सर्वर-साइड वेब खोज    | नेटिव OpenAI Responses टूल                                                                  | हाँ, जब वेब खोज सक्षम हो और कोई provider पिन न हो                 |
| इमेज                    | `image_generate`                                                                              | हाँ                                                                    |
| वीडियो                    | `video_generate`                                                                              | हाँ                                                                    |
| टेक्स्ट-टू-स्पीच            | `messages.tts.provider: "openai"` / `tts`                                                     | हाँ                                                                    |
| बैच स्पीच-टू-टेक्स्ट      | `tools.media.audio` / मीडिया समझ                                                     | हाँ                                                                    |
| स्ट्रीमिंग स्पीच-टू-टेक्स्ट  | Voice Call `streaming.provider: "openai"`                                                     | हाँ                                                                    |
| रियलटाइम वॉइस            | Voice Call `realtime.provider: "openai"` / Control UI Talk `talk.realtime.provider: "openai"` | हाँ (OpenAI Platform क्रेडिट चाहिए, Codex/ChatGPT सब्सक्रिप्शन नहीं) |
| एम्बेडिंग                | मेमोरी एम्बेडिंग provider                                                                     | हाँ                                                                    |

<Note>
  OpenAI Realtime वॉइस (Voice Call के `realtime.provider: "openai"` और
  `talk.realtime.provider: "openai"` के साथ Control UI Talk द्वारा उपयोग) सार्वजनिक **OpenAI Platform Realtime API** से होकर जाती है, जिसकी बिलिंग Codex/ChatGPT सब्सक्रिप्शन कोटा के बजाय OpenAI Platform क्रेडिट के विरुद्ध होती है। स्वस्थ OpenAI OAuth वाला खाता, जो Codex-समर्थित चैट मॉडल बिना समस्या चलाता है, फिर भी Realtime वॉइस के लिए OpenAI API-key प्रमाणीकरण प्रोफ़ाइल या वित्तपोषित Platform बिलिंग वाली Platform API key चाहता है।

सुधार: अपने रियलटाइम क्रेडेंशियल का समर्थन करने वाले संगठन के लिए
[platform.openai.com/account/billing](https://platform.openai.com/account/billing)
पर Platform क्रेडिट टॉप अप करें। Realtime वॉइस `openclaw onboard --auth-choice openai-api-key` द्वारा बनाई गई `openai` API-key प्रमाणीकरण प्रोफ़ाइल, Control UI Talk के लिए `talk.realtime.providers.openai.apiKey` के माध्यम से कॉन्फ़िगर की गई Platform `OPENAI_API_KEY`, Voice Call के लिए `plugins.entries.voice-call.config.realtime.providers.openai.apiKey`, या `OPENAI_API_KEY` एनवायरनमेंट वैरिएबल स्वीकार करती है। OpenAI OAuth प्रोफ़ाइल उसी OpenClaw इंस्टॉल में Codex-समर्थित `openai/*` चैट मॉडल फिर भी चला सकती हैं, लेकिन वे Realtime वॉइस कॉन्फ़िगर नहीं करतीं।
</Note>

## मेमोरी एम्बेडिंग

OpenClaw `memory_search` इंडेक्सिंग और क्वेरी एम्बेडिंग के लिए OpenAI या OpenAI-संगत एम्बेडिंग एंडपॉइंट का उपयोग कर सकता है:

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

ऐसे OpenAI-संगत एंडपॉइंट जिनमें असममित एम्बेडिंग लेबल चाहिए, उनके लिए `memorySearch` के अंतर्गत `queryInputType` और `documentInputType` सेट करें। OpenClaw इन्हें provider-विशिष्ट `input_type` अनुरोध फ़ील्ड के रूप में आगे भेजता है: क्वेरी एम्बेडिंग `queryInputType` का उपयोग करती हैं; इंडेक्स किए गए मेमोरी खंड और बैच इंडेक्सिंग `documentInputType` का उपयोग करते हैं। पूरे उदाहरण के लिए [मेमोरी कॉन्फ़िगरेशन संदर्भ](/hi/reference/memory-config#provider-specific-config) देखें।

## शुरू करना

अपनी पसंदीदा प्रमाणीकरण विधि चुनें और सेटअप चरणों का पालन करें।

<Tabs>
  <Tab title="API key (OpenAI Platform)">
    **सबसे उपयुक्त:** प्रत्यक्ष API पहुंच और उपयोग-आधारित बिलिंग।

    <Steps>
      <Step title="अपनी API key प्राप्त करें">
        [OpenAI Platform dashboard](https://platform.openai.com/api-keys) से API key बनाएँ या कॉपी करें।
      </Step>
      <Step title="ऑनबोर्डिंग चलाएँ">
        ```bash
        openclaw onboard --auth-choice openai-api-key
        ```

        या key सीधे पास करें:

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

    | मॉडल संदर्भ              | रनटाइम कॉन्फ़िग             | रूट                       | प्रमाणीकरण             |
    | ---------------------- | -------------------------- | --------------------------- | ---------------- |
    | `openai/gpt-5.5`      | छोड़ा गया / provider/model `agentRuntime.id: "codex"` | Codex ऐप-सर्वर हार्नेस | Codex-संगत OpenAI प्रोफ़ाइल |
    | `openai/gpt-5.4-mini` | छोड़ा गया / provider/model `agentRuntime.id: "codex"` | Codex ऐप-सर्वर हार्नेस | Codex-संगत OpenAI प्रोफ़ाइल |
    | `openai/gpt-5.5`      | provider/model `agentRuntime.id: "openclaw"`              | OpenClaw एम्बेडेड रनटाइम      | चुनी गई `openai` प्रोफ़ाइल |

    <Note>
    `openai/*` एजेंट मॉडल Codex ऐप-सर्वर हार्नेस का उपयोग करते हैं। किसी एजेंट मॉडल के लिए API-की
    auth उपयोग करने के लिए, Codex-संगत API-की प्रोफ़ाइल बनाएं और उसे
    `auth.order.openai` के साथ क्रम दें; `OPENAI_API_KEY`, गैर-एजेंट OpenAI API सतहों के लिए
    सीधा fallback बना रहता है। पुराने
    legacy Codex auth क्रम प्रविष्टियों को माइग्रेट करने के लिए `openclaw doctor --fix` चलाएं।
    </Note>

    ### कॉन्फ़िग उदाहरण

    ```json5
    {
      env: { OPENAI_API_KEY: "example-openai-key-not-real" },
      agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
    }
    ```

    OpenAI API से ChatGPT का मौजूदा Instant मॉडल आज़माने के लिए, मॉडल को
    `openai/chat-latest` पर सेट करें:

    ```json5
    {
      env: { OPENAI_API_KEY: "example-openai-key-not-real" },
      agents: { defaults: { model: { primary: "openai/chat-latest" } } },
    }
    ```

    `chat-latest` एक बदलता हुआ alias है। OpenAI इसे ChatGPT में उपयोग होने वाले नवीनतम Instant
    मॉडल के रूप में दस्तावेज़ित करता है और उत्पादन API उपयोग के लिए `gpt-5.5` की अनुशंसा करता है, इसलिए
    जब तक आपको स्पष्ट रूप से वह alias व्यवहार नहीं चाहिए, `openai/gpt-5.5` को स्थिर default के रूप में
    रखें। यह alias अभी केवल `medium` text verbosity स्वीकार करता है, इसलिए
    OpenClaw इस मॉडल के लिए असंगत OpenAI text-verbosity overrides को normalize करता है।

    <Warning>
    OpenClaw सीधे OpenAI API-की route पर `gpt-5.3-codex-spark` को expose **नहीं** करता। यह केवल Codex subscription catalog प्रविष्टियों के माध्यम से उपलब्ध है, जब आपका signed-in account इसे expose करता है।
    </Warning>

  </Tab>

  <Tab title="Codex subscription">
    **इसके लिए सबसे अच्छा:** अलग API की के बजाय native Codex ऐप-सर्वर execution के साथ अपनी ChatGPT/Codex subscription का उपयोग करना। Codex cloud के लिए ChatGPT sign-in आवश्यक है।

    <Steps>
      <Step title="Run Codex OAuth">
        ```bash
        openclaw onboard --auth-choice openai
        ```

        या सीधे OAuth चलाएं:

        ```bash
        openclaw models auth login --provider openai
        ```

        Headless या callback-विरोधी setups के लिए, localhost browser callback के बजाय ChatGPT device-code flow से sign in करने के लिए `--device-code` जोड़ें:

        ```bash
        openclaw models auth login --provider openai --device-code
        ```
      </Step>
      <Step title="Use the canonical OpenAI model route">
        ```bash
        openclaw config set agents.defaults.model.primary openai/gpt-5.5
        ```

        default path के लिए कोई runtime config आवश्यक नहीं है। OpenAI agent turns
        native Codex ऐप-सर्वर runtime को अपने आप चुनते हैं, और जब यह route चुना जाता है तो OpenClaw
        bundled Codex plugin install या repair करता है।
      </Step>
      <Step title="Verify Codex auth is available">
        ```bash
        openclaw models list --provider openai
        ```

        gateway चलने के बाद, native ऐप-सर्वर runtime सत्यापित करने के लिए chat में `/codex status` या `/codex models`
        भेजें।
      </Step>
    </Steps>

    ### Route सारांश

    | मॉडल ref | Runtime config | Route | Auth |
    |-----------|----------------|-------|------|
    | `openai/gpt-5.5` | छोड़ा गया / provider/model `agentRuntime.id: "codex"` | Native Codex ऐप-सर्वर हार्नेस | Codex sign-in या ordered `openai` auth profile |
    | `openai/gpt-5.5` | provider/model `agentRuntime.id: "openclaw"` | internal Codex-auth transport के साथ OpenClaw embedded runtime | चुनी गई `openai` OAuth profile |
    | legacy Codex GPT-5.5 ref | doctor द्वारा repaired | Legacy route को `openai/gpt-5.5` में rewritten किया गया | Migrated OpenAI OAuth profile |
    | `codex-cli/gpt-5.5` | doctor द्वारा repaired | Legacy CLI route को `openai/gpt-5.5` में rewritten किया गया | Codex ऐप-सर्वर auth |

    <Warning>
    नई subscription-backed agent config के लिए `openai/gpt-5.5` को प्राथमिकता दें। पुराने
    legacy Codex GPT refs legacy OpenClaw routes हैं, native Codex runtime
    path नहीं; जब आप उन्हें canonical
    `openai/*` refs में migrate करना चाहें तो `openclaw doctor --fix` चलाएं। `gpt-5.3-codex-spark` उन accounts तक सीमित रहता है जिनका
    Codex subscription catalog उस मॉडल का विज्ञापन करता है; उसके लिए direct OpenAI API-की और
    Azure refs suppressed रहते हैं।
    </Warning>

    <Note>
    legacy Codex model prefix legacy config है जिसे doctor repair करता है। सामान्य
    subscription plus native runtime setup के लिए, Codex auth से sign in करें
    लेकिन model ref को `openai/gpt-5.5` रखें। New config को OpenAI
    agent auth order को `auth.order.openai` के अंतर्गत रखना चाहिए; doctor पुराने
    legacy Codex auth order entries को migrate करता है।
    </Note>

    ### कॉन्फ़िग उदाहरण

    ```json5
    {
      plugins: { entries: { codex: { enabled: true } } },
      agents: {
        defaults: {
          model: { primary: "openai/gpt-5.5" },
        },
      },
    }
    ```

    API-की backup के साथ, model को `openai/gpt-5.5` पर रखें और
    auth order को `openai` के अंतर्गत रखें। OpenClaw पहले subscription आज़माएगा, फिर
    API key, और Codex harness पर ही रहेगा:

    ```json5
    {
      plugins: { entries: { codex: { enabled: true } } },
      agents: {
        defaults: {
          model: { primary: "openai/gpt-5.5" },
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
    Onboarding अब `~/.codex` से OAuth material import नहीं करता। Browser OAuth (default) या ऊपर दिए device-code flow से sign in करें — OpenClaw बनने वाले credentials को अपने agent auth store में manage करता है।
    </Note>

    ### Codex OAuth routing जांचें और recover करें

    ये commands उपयोग करके देखें कि आपका default agent कौन सा model, runtime, और auth route
    उपयोग कर रहा है:

    ```bash
    openclaw models status
    openclaw models auth list --provider openai
    openclaw config get agents.defaults.model --json
    openclaw config get models.providers.openai.agentRuntime --json
    ```

    किसी विशिष्ट agent के लिए, `--agent <id>` जोड़ें:

    ```bash
    openclaw models status --agent <id>
    openclaw models auth list --agent <id> --provider openai
    ```

    अगर पुराने config में अब भी legacy Codex GPT refs या explicit runtime config के बिना stale OpenAI runtime
    session pin है, तो उसे repair करें:

    ```bash
    openclaw doctor --fix
    openclaw config validate
    ```

    अगर `models auth list --provider openai` कोई usable profile नहीं दिखाता, तो
    फिर से sign in करें:

    ```bash
    openclaw models auth login --provider openai
    openclaw models status --probe --probe-provider openai
    ```

    जब आपको एक ही agent में कई Codex OAuth logins चाहिए और बाद में उन्हें auth ordering या `/model ...@<profileId>` के माध्यम से control करना हो, तो `--profile-id` उपयोग करें:

    ```bash
    openclaw models auth login --provider openai --profile-id openai:ritsuko
    openclaw models auth login --provider openai --profile-id openai:lain
    ```

    `openai/*`, Codex के माध्यम से OpenAI agent turns के लिए model route है। Profile ordering पर निर्भर होने से पहले
    पुराने legacy OpenAI Codex prefix profile ids और
    order entries को migrate करने के लिए `openclaw doctor --fix` चलाएं।

    ### स्थिति संकेतक

    Chat `/status` दिखाता है कि वर्तमान session के लिए कौन सा model runtime active है।
    Bundled Codex ऐप-सर्वर हार्नेस OpenAI agent model turns के लिए `Runtime: OpenAI Codex` के रूप में
    दिखाई देता है। Stale OpenAI runtime session pins को Codex में repair किया जाता है, जब तक
    config स्पष्ट रूप से OpenClaw pin नहीं करता।

    ### Doctor चेतावनी

    अगर legacy Codex model refs या stale OpenAI runtime pins config या
    session state में बने रहते हैं, तो `openclaw doctor --fix` उन्हें
    Codex runtime के साथ `openai/*` में rewrite करता है, जब तक OpenClaw स्पष्ट रूप से configured न हो।

    ### Context window cap

    OpenClaw model metadata और runtime context cap को अलग-अलग values मानता है।

    Codex OAuth catalog के माध्यम से `openai/gpt-5.5` के लिए:

    - Native `contextWindow`: `1000000`
    - Default runtime `contextTokens` cap: `272000`

    छोटा default cap व्यवहार में बेहतर latency और quality characteristics देता है। इसे `contextTokens` से override करें:

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
    Native model metadata घोषित करने के लिए `contextWindow` उपयोग करें। Runtime context budget सीमित करने के लिए `contextTokens` उपयोग करें।
    </Note>

    ### Catalog recovery

    OpenClaw `gpt-5.5` के लिए upstream Codex catalog metadata का उपयोग करता है, जब वह
    मौजूद होता है। अगर account authenticated होने पर live Codex discovery `gpt-5.5` row छोड़ देता है, तो OpenClaw उस OAuth model row को synthesize करता है ताकि
    cron, sub-agent, और configured default-model runs
    `Unknown model` के साथ fail न हों।

  </Tab>
</Tabs>

## Native Codex ऐप-सर्वर auth

Native Codex ऐप-सर्वर हार्नेस `openai/*` model refs plus omitted
runtime config या provider/model `agentRuntime.id: "codex"` उपयोग करता है, लेकिन इसका auth
अब भी account-based है। OpenClaw इस क्रम में auth चुनता है:

1. Agent के लिए ordered OpenAI auth profiles, बेहतर है
   `auth.order.openai` के अंतर्गत। पुराने
   legacy Codex auth profile ids और legacy Codex auth order migrate करने के लिए `openclaw doctor --fix` चलाएं।
2. ऐप-सर्वर का मौजूदा account, जैसे local Codex CLI ChatGPT sign-in।
3. केवल local stdio ऐप-सर्वर launches के लिए, `CODEX_API_KEY`, फिर
   `OPENAI_API_KEY`, जब ऐप-सर्वर कोई account report नहीं करता और फिर भी
   OpenAI auth मांगता है।

इसका मतलब है कि local ChatGPT/Codex subscription sign-in को सिर्फ इसलिए replace नहीं किया जाता
क्योंकि gateway process के पास direct OpenAI models
या embeddings के लिए `OPENAI_API_KEY` भी है। Env API-की fallback केवल local stdio no-account path है; इसे
WebSocket ऐप-सर्वर connections को नहीं भेजा जाता। जब subscription-style Codex
profile चुनी जाती है, OpenClaw spawned stdio ऐप-सर्वर child से `CODEX_API_KEY` और `OPENAI_API_KEY`
भी बाहर रखता है और चुने गए credentials को
ऐप-सर्वर login RPC के माध्यम से भेजता है। जब वह subscription profile किसी
Codex usage limit से blocked होती है, OpenClaw selected model बदले बिना या Codex
harness से बाहर निकले बिना अगले ordered `openai:*` API-की
profile पर rotate कर सकता है। Subscription reset time बीत जाने के बाद, subscription profile फिर से
eligible हो जाती है।

## Image generation

Bundled `openai` plugin `image_generate` tool के माध्यम से image generation register करता है।
यह उसी `openai/gpt-image-2` model ref के माध्यम से OpenAI API-की image generation और Codex OAuth image
generation दोनों को support करता है।

| Capability                | OpenAI API key                     | Codex OAuth                          |
| ------------------------- | ---------------------------------- | ------------------------------------ |
| Model ref                 | `openai/gpt-image-2`               | `openai/gpt-image-2`                 |
| Auth                      | `OPENAI_API_KEY`                   | OpenAI Codex OAuth sign-in           |
| Transport                 | OpenAI Images API                  | Codex Responses backend              |
| Max images per request    | 4                                  | 4                                    |
| Edit mode                 | Enabled (up to 5 reference images) | Enabled (up to 5 reference images)   |
| Size overrides            | Supported, including 2K/4K sizes   | Supported, including 2K/4K sizes     |
| Aspect ratio / resolution | OpenAI Images API को forward नहीं किया गया | सुरक्षित होने पर supported size से mapped |

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
Shared tool parameters, provider selection, और failover behavior के लिए [Image Generation](/hi/tools/image-generation) देखें।
</Note>

`gpt-image-2`, OpenAI text-to-image generation और image
editing दोनों के लिए default है। `gpt-image-1.5`, `gpt-image-1`, और `gpt-image-1-mini` explicit model overrides के रूप में
usable रहते हैं। Transparent-background
PNG/WebP output के लिए `openai/gpt-image-1.5` उपयोग करें; मौजूदा `gpt-image-2` API
`background: "transparent"` reject करता है।

पारदर्शी-पृष्ठभूमि अनुरोध के लिए, एजेंटों को `image_generate` को
`model: "openai/gpt-image-1.5"`, `outputFormat: "png"` या `"webp"`, और
`background: "transparent"` के साथ कॉल करना चाहिए; पुराना `openai.background` प्रदाता विकल्प
अब भी स्वीकार किया जाता है। OpenClaw सार्वजनिक OpenAI और
OpenAI Codex OAuth रूट्स को भी सुरक्षित रखता है, डिफ़ॉल्ट `openai/gpt-image-2` पारदर्शी
अनुरोधों को `gpt-image-1.5` में फिर से लिखकर; Azure और कस्टम OpenAI-संगत एंडपॉइंट
अपने कॉन्फ़िगर किए गए डिप्लॉयमेंट/मॉडल नाम बनाए रखते हैं।

यही सेटिंग हेडलेस CLI रन के लिए भी उपलब्ध है:

```bash
openclaw infer image generate \
  --model openai/gpt-image-1.5 \
  --output-format png \
  --background transparent \
  --prompt "A simple red circle sticker on a transparent background" \
  --json
```

इनपुट फ़ाइल से शुरू करते समय `openclaw infer image edit` के साथ वही
`--output-format` और `--background` फ़्लैग इस्तेमाल करें।
`--openai-background` OpenAI-विशिष्ट उपनाम के रूप में उपलब्ध रहता है।
जब आपको OpenAI Images की गुणवत्ता और लागत नियंत्रित करनी हो, तो
`--quality low|medium|high|auto` इस्तेमाल करें। `image generate` या `image edit` में से
OpenAI का प्रदाता-विशिष्ट मॉडरेशन संकेत पास करने के लिए `--openai-moderation low|auto` इस्तेमाल करें।

ChatGPT/Codex OAuth इंस्टॉल के लिए, वही `openai/gpt-image-2` रेफ़ रखें। जब कोई
`openai` OAuth प्रोफ़ाइल कॉन्फ़िगर होती है, OpenClaw उस संग्रहीत OAuth
एक्सेस टोकन को रिज़ॉल्व करता है और Codex Responses बैकएंड के ज़रिए इमेज अनुरोध भेजता है। यह
उस अनुरोध के लिए पहले `OPENAI_API_KEY` आज़माता नहीं है या चुपचाप API कुंजी पर वापस नहीं जाता।
जब आपको इसके बजाय सीधा OpenAI Images API
रूट चाहिए, तो `models.providers.openai` को API कुंजी,
कस्टम बेस URL, या Azure एंडपॉइंट के साथ स्पष्ट रूप से कॉन्फ़िगर करें।
अगर वह कस्टम इमेज एंडपॉइंट किसी भरोसेमंद LAN/निजी पते पर है, तो
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true` भी सेट करें; OpenClaw
निजी/आंतरिक OpenAI-संगत इमेज एंडपॉइंट को तब तक ब्लॉक रखता है जब तक यह ऑप्ट-इन
मौजूद न हो।

जनरेट करें:

```
/tool image_generate model=openai/gpt-image-2 prompt="A polished launch poster for OpenClaw on macOS" size=3840x2160 count=1
```

एक पारदर्शी PNG जनरेट करें:

```
/tool image_generate model=openai/gpt-image-1.5 prompt="A simple red circle sticker on a transparent background" outputFormat=png background=transparent
```

संपादित करें:

```
/tool image_generate model=openai/gpt-image-2 prompt="Preserve the object shape, change the material to translucent glass" image=/path/to/reference.png size=1024x1536
```

## वीडियो जनरेशन

बंडल किया गया `openai` Plugin `video_generate` टूल के ज़रिए वीडियो जनरेशन पंजीकृत करता है।

| क्षमता           | मान                                                                               |
| ---------------- | --------------------------------------------------------------------------------- |
| डिफ़ॉल्ट मॉडल    | `openai/sora-2`                                                                   |
| मोड              | टेक्स्ट-से-वीडियो, इमेज-से-वीडियो, एकल-वीडियो संपादन                             |
| संदर्भ इनपुट     | 1 इमेज या 1 वीडियो                                                                |
| आकार ओवरराइड     | टेक्स्ट-से-वीडियो और इमेज-से-वीडियो के लिए समर्थित                               |
| अन्य ओवरराइड     | `aspectRatio`, `resolution`, `audio`, `watermark` टूल चेतावनी के साथ अनदेखे किए जाते हैं |

OpenAI इमेज-से-वीडियो अनुरोध इमेज
`input_reference` के साथ `POST /v1/videos` इस्तेमाल करते हैं। एकल-वीडियो संपादन
अपलोड किए गए वीडियो को `video` फ़ील्ड में रखकर `POST /v1/videos/edits` इस्तेमाल करते हैं।

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
साझा टूल पैरामीटर, प्रदाता चयन, और फ़ेलओवर व्यवहार के लिए [वीडियो जनरेशन](/hi/tools/video-generation) देखें।
</Note>

## GPT-5 प्रॉम्प्ट योगदान

OpenClaw, OpenClaw-असेंबल किए गए प्रॉम्प्ट सतहों पर GPT-5-परिवार रन के लिए एक साझा GPT-5 प्रॉम्प्ट योगदान जोड़ता है। यह मॉडल id के आधार पर लागू होता है, इसलिए OpenClaw/प्रदाता रूट जैसे लेगेसी प्री-रिपेयर रेफ़ (लेगेसी Codex GPT-5.5 रेफ़), `openrouter/openai/gpt-5.5`, `opencode/gpt-5.5`, और अन्य संगत GPT-5 रेफ़ को वही ओवरले मिलता है। पुराने GPT-4.x मॉडल को नहीं।

बंडल किए गए नेटिव Codex हार्नेस को Codex ऐप-सर्वर डेवलपर निर्देशों के ज़रिए यह OpenClaw GPT-5 ओवरले नहीं मिलता। नेटिव Codex, Codex-स्वामित्व वाले बेस, मॉडल, और प्रोजेक्ट-डॉक व्यवहार को बनाए रखता है, जबकि OpenClaw नेटिव थ्रेड्स के लिए Codex की बिल्ट-इन पर्सनैलिटी अक्षम करता है ताकि एजेंट वर्कस्पेस पर्सनैलिटी फ़ाइलें प्रामाणिक रहें। OpenClaw केवल रनटाइम संदर्भ योगदान करता है, जैसे चैनल डिलीवरी, OpenClaw डायनेमिक टूल्स, ACP डेलिगेशन, वर्कस्पेस संदर्भ, और OpenClaw Skills।

GPT-5 योगदान मेल खाते OpenClaw-असेंबल किए गए प्रॉम्प्ट पर पर्सोना स्थायित्व, निष्पादन सुरक्षा, टूल अनुशासन, आउटपुट आकार, पूर्णता जाँच, और सत्यापन के लिए टैग किया हुआ व्यवहार अनुबंध जोड़ता है। चैनल-विशिष्ट उत्तर और साइलेंट-मैसेज व्यवहार साझा OpenClaw सिस्टम प्रॉम्प्ट और आउटबाउंड डिलीवरी नीति में रहता है। मैत्रीपूर्ण इंटरैक्शन-शैली परत अलग और कॉन्फ़िगर करने योग्य है।

| मान                    | प्रभाव                                      |
| ---------------------- | ------------------------------------------- |
| `"friendly"` (डिफ़ॉल्ट) | मैत्रीपूर्ण इंटरैक्शन-शैली परत सक्षम करें |
| `"on"`                 | `"friendly"` का उपनाम                      |
| `"off"`                | केवल मैत्रीपूर्ण शैली परत अक्षम करें       |

<Tabs>
  <Tab title="कॉन्फ़िग">
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
रनटाइम पर मान केस-असंवेदनशील होते हैं, इसलिए `"Off"` और `"off"` दोनों मैत्रीपूर्ण शैली परत को अक्षम करते हैं।
</Tip>

<Note>
जब साझा `agents.defaults.promptOverlays.gpt5.personality` सेटिंग सेट नहीं होती, तब लेगेसी `plugins.entries.openai.config.personality` अब भी संगतता फ़ॉलबैक के रूप में पढ़ी जाती है।
</Note>

## आवाज़ और वाणी

<AccordionGroup>
  <Accordion title="वाणी संश्लेषण (TTS)">
    बंडल किया गया `openai` Plugin `messages.tts` सतह के लिए वाणी संश्लेषण पंजीकृत करता है।

    | सेटिंग | कॉन्फ़िग पथ | डिफ़ॉल्ट |
    |---------|------------|---------|
    | मॉडल | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | आवाज़ | `messages.tts.providers.openai.speakerVoice` | `coral` |
    | गति | `messages.tts.providers.openai.speed` | (सेट नहीं) |
    | निर्देश | `messages.tts.providers.openai.instructions` | (सेट नहीं, केवल `gpt-4o-mini-tts`) |
    | फ़ॉर्मैट | `messages.tts.providers.openai.responseFormat` | वॉइस नोट्स के लिए `opus`, फ़ाइलों के लिए `mp3` |
    | API कुंजी | `messages.tts.providers.openai.apiKey` | `OPENAI_API_KEY` पर वापस जाता है |
    | बेस URL | `messages.tts.providers.openai.baseUrl` | `https://api.openai.com/v1` |
    | अतिरिक्त बॉडी | `messages.tts.providers.openai.extraBody` / `extra_body` | (सेट नहीं) |

    उपलब्ध मॉडल: `gpt-4o-mini-tts`, `tts-1`, `tts-1-hd`। उपलब्ध आवाज़ें: `alloy`, `ash`, `ballad`, `cedar`, `coral`, `echo`, `fable`, `juniper`, `marin`, `onyx`, `nova`, `sage`, `shimmer`, `verse`।

    OpenClaw के जनरेट किए गए फ़ील्ड के बाद `extraBody` को `/audio/speech` अनुरोध JSON में मर्ज किया जाता है, इसलिए इसे उन OpenAI-संगत एंडपॉइंट के लिए इस्तेमाल करें जिन्हें `lang` जैसी अतिरिक्त कुंजियों की आवश्यकता होती है। प्रोटोटाइप कुंजियाँ अनदेखी की जाती हैं।

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
    चैट API एंडपॉइंट को प्रभावित किए बिना TTS बेस URL ओवरराइड करने के लिए `OPENAI_TTS_BASE_URL` सेट करें। OpenAI TTS और Realtime voice दोनों OpenAI Platform API कुंजी के ज़रिए कॉन्फ़िगर होते हैं; केवल-OAuth इंस्टॉल अब भी Codex-समर्थित चैट मॉडल इस्तेमाल कर सकते हैं, लेकिन OpenAI लाइव टॉक-बैक नहीं।
    </Note>

  </Accordion>

  <Accordion title="वाणी-से-पाठ">
    बंडल किया गया `openai` Plugin
    OpenClaw की मीडिया-अंडरस्टैंडिंग ट्रांसक्रिप्शन सतह के ज़रिए बैच वाणी-से-पाठ पंजीकृत करता है।

    - डिफ़ॉल्ट मॉडल: `gpt-4o-transcribe`
    - एंडपॉइंट: OpenAI REST `/v1/audio/transcriptions`
    - इनपुट पथ: मल्टीपार्ट ऑडियो फ़ाइल अपलोड
    - OpenClaw में जहाँ भी इनबाउंड ऑडियो ट्रांसक्रिप्शन
      `tools.media.audio` इस्तेमाल करता है, वहाँ समर्थित, जिसमें Discord वॉइस-चैनल सेगमेंट और चैनल
      ऑडियो अटैचमेंट शामिल हैं

    इनबाउंड ऑडियो ट्रांसक्रिप्शन के लिए OpenAI को बाध्य करने हेतु:

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

    साझा ऑडियो मीडिया कॉन्फ़िग या प्रति-कॉल ट्रांसक्रिप्शन अनुरोध द्वारा दिए जाने पर
    भाषा और प्रॉम्प्ट संकेत OpenAI को अग्रेषित किए जाते हैं।

  </Accordion>

  <Accordion title="Realtime ट्रांसक्रिप्शन">
    बंडल किया गया `openai` Plugin Voice Call Plugin के लिए Realtime ट्रांसक्रिप्शन पंजीकृत करता है।

    | सेटिंग | कॉन्फ़िग पथ | डिफ़ॉल्ट |
    |---------|------------|---------|
    | मॉडल | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | भाषा | `...openai.language` | (सेट नहीं) |
    | प्रॉम्प्ट | `...openai.prompt` | (सेट नहीं) |
    | मौन अवधि | `...openai.silenceDurationMs` | `800` |
    | VAD थ्रेशोल्ड | `...openai.vadThreshold` | `0.5` |
    | Auth | `...openai.apiKey`, `OPENAI_API_KEY`, या `openai` OAuth | API कुंजियाँ सीधे कनेक्ट करती हैं; OAuth एक Realtime ट्रांसक्रिप्शन क्लाइंट सीक्रेट जारी करता है |

    <Note>
    G.711 u-law (`g711_ulaw` / `audio/pcmu`) ऑडियो के साथ `wss://api.openai.com/v1/realtime` पर WebSocket कनेक्शन इस्तेमाल करता है। जब केवल `openai` OAuth कॉन्फ़िगर होता है, Gateway WebSocket खोलने से पहले एक अस्थायी Realtime ट्रांसक्रिप्शन क्लाइंट सीक्रेट जारी करता है। यह स्ट्रीमिंग प्रदाता Voice Call के Realtime ट्रांसक्रिप्शन पथ के लिए है; Discord voice वर्तमान में छोटे सेगमेंट रिकॉर्ड करता है और इसके बजाय बैच `tools.media.audio` ट्रांसक्रिप्शन पथ इस्तेमाल करता है।
    </Note>

  </Accordion>

  <Accordion title="Realtime voice">
    बंडल किया गया `openai` Plugin Voice Call Plugin के लिए Realtime voice पंजीकृत करता है।

    | सेटिंग | कॉन्फ़िग पथ | डिफ़ॉल्ट |
    |---------|------------|---------|
    | मॉडल | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-2` |
    | आवाज़ | `...openai.voice` | `alloy` |
    | तापमान (Azure डिप्लॉयमेंट ब्रिज) | `...openai.temperature` | `0.8` |
    | VAD थ्रेशोल्ड | `...openai.vadThreshold` | `0.5` |
    | मौन अवधि | `...openai.silenceDurationMs` | `500` |
    | प्रीफ़िक्स पैडिंग | `...openai.prefixPaddingMs` | `300` |
    | रीजनिंग प्रयास | `...openai.reasoningEffort` | (सेट नहीं) |
    | Auth | `openai` API-कुंजी auth प्रोफ़ाइल, `...openai.apiKey`, या `OPENAI_API_KEY` | OpenAI Platform API कुंजी आवश्यक; OpenAI OAuth Realtime voice कॉन्फ़िगर नहीं करता |

    `gpt-realtime-2` के लिए उपलब्ध बिल्ट-इन Realtime आवाज़ें: `alloy`, `ash`,
    `ballad`, `coral`, `echo`, `sage`, `shimmer`, `verse`, `marin`, `cedar`।
    OpenAI सर्वोत्तम Realtime गुणवत्ता के लिए `marin` और `cedar` की अनुशंसा करता है। यह
    ऊपर की Text-to-speech आवाज़ों से अलग सेट है; यह न मानें कि `fable`, `nova`, या `onyx` जैसी TTS
    आवाज़ Realtime सेशन के लिए मान्य है।

    <Note>
    बैकएंड OpenAI Realtime ब्रिज GA Realtime WebSocket सेशन आकार इस्तेमाल करते हैं, जो `session.temperature` स्वीकार नहीं करता। Azure OpenAI डिप्लॉयमेंट `azureEndpoint` और `azureDeployment` के ज़रिए उपलब्ध रहते हैं और डिप्लॉयमेंट-संगत सेशन आकार बनाए रखते हैं। द्विदिश टूल कॉलिंग और G.711 u-law ऑडियो का समर्थन करता है।
    </Note>

    <Note>
    Realtime voice सेशन बनाते समय चुनी जाती है। OpenAI अधिकांश
    सेशन फ़ील्ड को बाद में बदलने देता है, लेकिन उस सेशन में
    मॉडल द्वारा ऑडियो उत्सर्जित करने के बाद आवाज़ नहीं बदली जा सकती। OpenClaw वर्तमान में
    बिल्ट-इन Realtime voice ids को स्ट्रिंग्स के रूप में उजागर करता है।
    </Note>

    <Note>
    Control UI Talk OpenAI ब्राउज़र रीयलटाइम सत्रों का उपयोग करता है, जिसमें Gateway द्वारा जारी
    अल्पकालिक क्लाइंट सीक्रेट और OpenAI Realtime API के विरुद्ध सीधे ब्राउज़र WebRTC SDP एक्सचेंज होता है।
    Gateway उस क्लाइंट सीक्रेट को चयनित
    `openai` API-key auth प्रोफ़ाइल या कॉन्फ़िगर की गई OpenAI Platform API key के साथ जारी करता है। Gateway
    relay और Voice Call बैकएंड रीयलटाइम WebSocket ब्रिज नेटिव OpenAI endpoints के लिए उसी
    केवल API-key auth path का उपयोग करते हैं। Maintainer live
    verification इसके साथ उपलब्ध है:
    `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`;
    OpenAI legs secrets लॉग किए बिना बैकएंड WebSocket bridge और ब्राउज़र
    WebRTC SDP exchange, दोनों को verify करते हैं।
    </Note>

  </Accordion>
</AccordionGroup>

## Azure OpenAI endpoints

बंडल किया गया `openai` provider base URL override करके image
generation के लिए Azure OpenAI resource को target कर सकता है। image-generation path पर, OpenClaw
`models.providers.openai.baseUrl` पर Azure hostnames detect करता है और अपने-आप
Azure के request shape पर switch करता है।

<Note>
Realtime voice एक अलग configuration path
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
का उपयोग करता है और `models.providers.openai.baseUrl` से प्रभावित नहीं होता। इसके Azure
settings के लिए [Voice and speech](#voice-and-speech) के अंतर्गत **Realtime
voice** accordion देखें।
</Note>

Azure OpenAI का उपयोग करें जब:

- आपके पास पहले से Azure OpenAI subscription, quota, या enterprise agreement हो
- आपको Azure द्वारा दिए जाने वाले regional data residency या compliance controls चाहिए
- आप traffic को मौजूदा Azure tenancy के अंदर रखना चाहते हों

### Configuration

बंडल किए गए `openai` provider के माध्यम से Azure image generation के लिए,
`models.providers.openai.baseUrl` को अपने Azure resource पर point करें और `apiKey` को
Azure OpenAI key पर set करें (OpenAI Platform key नहीं):

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

OpenClaw Azure image-generation
route के लिए ये Azure host suffixes पहचानता है:

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

पहचाने गए Azure host पर image-generation requests के लिए, OpenClaw:

- `Authorization: Bearer` के बजाय `api-key` header भेजता है
- deployment-scoped paths (`/openai/deployments/{deployment}/...`) का उपयोग करता है
- हर request में `?api-version=...` जोड़ता है
- Azure image-generation calls के लिए 600s default request timeout का उपयोग करता है।
  Per-call `timeoutMs` values अब भी इस default को override करती हैं।

अन्य base URLs (public OpenAI, OpenAI-compatible proxies) standard
OpenAI image request shape रखते हैं।

<Note>
`openai` provider के image-generation path के लिए Azure routing को
OpenClaw 2026.4.22 या बाद का संस्करण चाहिए। पुराने versions किसी भी custom
`openai.baseUrl` को public OpenAI endpoint जैसा मानते हैं और Azure
image deployments के विरुद्ध fail होंगे।
</Note>

### API version

Azure image-generation path के लिए कोई specific Azure preview या GA version
pin करने हेतु `AZURE_OPENAI_API_VERSION` set करें:

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

Variable unset होने पर default `2024-12-01-preview` है।

### Model names are deployment names

Azure OpenAI models को deployments से bind करता है। बंडल किए गए `openai` provider
के माध्यम से route की गई Azure image-generation requests के लिए, OpenClaw में
`model` field वह **Azure deployment name** होना चाहिए जिसे आपने Azure portal में configured किया है,
public OpenAI model id नहीं।

यदि आप `gpt-image-2-prod` नाम का deployment बनाते हैं जो `gpt-image-2` serve करता है:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

यही deployment-name rule बंडल किए गए `openai` provider के माध्यम से route की गई
image-generation calls पर लागू होता है।

### Regional availability

Azure image generation अभी केवल regions के subset में उपलब्ध है
(उदाहरण के लिए `eastus2`, `swedencentral`, `polandcentral`, `westus3`,
`uaenorth`)। Deployment बनाने से पहले Microsoft की current region list देखें,
और confirm करें कि specific model आपके region में offered है।

### Parameter differences

Azure OpenAI और public OpenAI हमेशा समान image parameters accept नहीं करते।
Azure उन options को reject कर सकता है जिन्हें public OpenAI allow करता है (उदाहरण के लिए
`gpt-image-2` पर कुछ `background` values) या उन्हें केवल specific model
versions पर expose कर सकता है। ये differences Azure और underlying model से आते हैं,
OpenClaw से नहीं। यदि कोई Azure request validation error के साथ fail होती है, तो
Azure portal में अपने specific deployment और API version द्वारा supported
parameter set देखें।

<Note>
Azure OpenAI native transport और compat behavior का उपयोग करता है, लेकिन उसे
OpenClaw के hidden attribution headers नहीं मिलते — [Advanced configuration](#advanced-configuration) के अंतर्गत **Native vs OpenAI-compatible
routes** accordion देखें।

Azure पर chat या Responses traffic (image generation से आगे) के लिए,
onboarding flow या dedicated Azure provider config का उपयोग करें — केवल `openai.baseUrl`
Azure API/auth shape नहीं अपनाता। एक अलग
`azure-openai-responses/*` provider मौजूद है; नीचे Server-side compaction accordion देखें।
</Note>

## Advanced configuration

<AccordionGroup>
  <Accordion title="Transport (WebSocket vs SSE)">
    OpenClaw `openai/*` के लिए SSE fallback (`"auto"`) के साथ WebSocket-first का उपयोग करता है।

    `"auto"` mode में, OpenClaw:
    - SSE पर fallback करने से पहले एक early WebSocket failure retry करता है
    - Failure के बाद, WebSocket को ~60 seconds के लिए degraded mark करता है और cool-down के दौरान SSE उपयोग करता है
    - Retries और reconnects के लिए stable session और turn identity headers attach करता है
    - Transport variants में usage counters (`input_tokens` / `prompt_tokens`) normalize करता है

    | Value | Behavior |
    |-------|----------|
    | `"auto"` (default) | पहले WebSocket, SSE fallback |
    | `"sse"` | केवल SSE force करें |
    | `"websocket"` | केवल WebSocket force करें |

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

    संबंधित OpenAI docs:
    - [WebSocket के साथ Realtime API](https://platform.openai.com/docs/guides/realtime-websocket)
    - [Streaming API responses (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="Fast mode">
    OpenClaw `openai/*` के लिए shared fast-mode toggle expose करता है:

    - **Chat/UI:** `/fast status|auto|on|off`
    - **Config:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    Enabled होने पर, OpenClaw fast mode को OpenAI priority processing (`service_tier = "priority"`) पर map करता है। मौजूदा `service_tier` values preserve रहती हैं, और fast mode `reasoning` या `text.verbosity` को rewrite नहीं करता। `fastMode: "auto"` auto cutoff तक new model calls fast शुरू करता है, फिर बाद की retry, fallback, tool-result, या continuation calls को fast mode के बिना शुरू करता है। Cutoff default 60 seconds है; इसे बदलने के लिए active model पर `params.fastAutoOnSeconds` set करें।

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
    Session overrides config पर प्राथमिकता रखते हैं। Sessions UI में session override clear करने से session configured default पर लौट आता है।
    </Note>

  </Accordion>

  <Accordion title="Priority processing (service_tier)">
    OpenAI की API `service_tier` के माध्यम से priority processing expose करती है। OpenClaw में इसे per model set करें:

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

    Supported values: `auto`, `default`, `flex`, `priority`.

    <Warning>
    `serviceTier` केवल native OpenAI endpoints (`api.openai.com`) और native Codex endpoints (`chatgpt.com/backend-api`) को forward किया जाता है। यदि आप किसी भी provider को proxy से route करते हैं, तो OpenClaw `service_tier` को untouched छोड़ता है।
    </Warning>

  </Accordion>

  <Accordion title="Server-side compaction (Responses API)">
    Direct OpenAI Responses models (`openai/*` on `api.openai.com`) के लिए, OpenAI plugin का OpenClaw stream wrapper server-side compaction auto-enable करता है:

    - `store: true` force करता है (जब तक model compat `supportsStore: false` set न करे)
    - `context_management: [{ type: "compaction", compact_threshold: ... }]` inject करता है
    - Default `compact_threshold`: `contextWindow` का 70% (या unavailable होने पर `80000`)

    यह built-in OpenClaw runtime path और embedded runs द्वारा उपयोग किए गए OpenAI provider hooks पर लागू होता है। Native Codex app-server harness अपना context Codex के माध्यम से खुद manage करता है और OpenAI के default agent route या provider/model runtime policy द्वारा configured होता है।

    <Tabs>
      <Tab title="Enable explicitly">
        Azure OpenAI Responses जैसे compatible endpoints के लिए उपयोगी:

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
      <Tab title="Custom threshold">
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
      <Tab title="Disable">
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
    `responsesServerCompaction` केवल `context_management` injection को control करता है। Direct OpenAI Responses models अब भी `store: true` force करते हैं, जब तक compat `supportsStore: false` set न करे।
    </Note>

  </Accordion>

  <Accordion title="Strict-agentic GPT mode">
    `openai/*` पर GPT-5-family runs के लिए, OpenClaw एक stricter embedded execution contract का उपयोग कर सकता है:

    ```json5
    {
      agents: {
        defaults: {
          embeddedAgent: { executionContract: "strict-agentic" },
        },
      },
    }
    ```

    `strict-agentic` के साथ, OpenClaw:
    - substantial work के लिए `update_plan` auto-enable करता है
    - structurally empty या reasoning-only turns को visible-answer continuation के साथ retry करता है
    - selected harness द्वारा provide किए जाने पर explicit harness plan events का उपयोग करता है

    OpenClaw यह decide करने के लिए assistant prose classify नहीं करता कि कोई turn plan है, progress update है, या final answer है।

    <Note>
    केवल OpenAI और Codex GPT-5-family runs तक scoped। अन्य providers और पुराने model families default behavior रखते हैं।
    </Note>

  </Accordion>

  <Accordion title="Native vs OpenAI-compatible routes">
    OpenClaw direct OpenAI, Codex, और Azure OpenAI endpoints को generic OpenAI-compatible `/v1` proxies से अलग तरह से treat करता है:

    **Native routes** (`openai/*`, Azure OpenAI):
    - केवल उन models के लिए `reasoning: { effort: "none" }` रखता है जो OpenAI `none` effort support करते हैं
    - उन models या proxies के लिए disabled reasoning omit करता है जो `reasoning.effort: "none"` reject करते हैं
    - Tool schemas को default रूप से strict mode में रखता है
    - केवल verified native hosts पर hidden attribution headers attach करता है
    - OpenAI-only request shaping (`service_tier`, `store`, reasoning-compat, prompt-cache hints) रखता है

    **प्रॉक्सी/संगत रूट:**
    - अधिक ढीला संगत व्यवहार उपयोग करें
    - गैर-नेटिव `openai-completions` पेलोड से Completions `store` हटाएं
    - OpenAI-संगत Completions प्रॉक्सी के लिए उन्नत `params.extra_body`/`params.extraBody` पास-थ्रू JSON स्वीकार करें
    - vLLM जैसे OpenAI-संगत Completions प्रॉक्सी के लिए `params.chat_template_kwargs` स्वीकार करें
    - सख्त टूल स्कीमा या केवल-नेटिव हेडर बाध्य न करें

    Azure OpenAI नेटिव ट्रांसपोर्ट और संगत व्यवहार का उपयोग करता है, लेकिन उसे छिपे हुए एट्रिब्यूशन हेडर नहीं मिलते।

  </Accordion>
</AccordionGroup>

## संबंधित

<CardGroup cols={2}>
  <Card title="मॉडल चयन" href="/hi/concepts/model-providers" icon="layers">
    प्रदाता, मॉडल रेफ़ और फ़ेलओवर व्यवहार चुनना।
  </Card>
  <Card title="छवि जनरेशन" href="/hi/tools/image-generation" icon="image">
    साझा छवि टूल पैरामीटर और प्रदाता चयन।
  </Card>
  <Card title="वीडियो जनरेशन" href="/hi/tools/video-generation" icon="video">
    साझा वीडियो टूल पैरामीटर और प्रदाता चयन।
  </Card>
  <Card title="OAuth और auth" href="/hi/gateway/authentication" icon="key">
    auth विवरण और क्रेडेंशियल पुन: उपयोग नियम।
  </Card>
</CardGroup>
