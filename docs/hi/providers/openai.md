---
read_when:
    - आप OpenClaw में OpenAI मॉडल का उपयोग करना चाहते हैं
    - आप API कुंजियों के बजाय Codex सदस्यता प्रमाणीकरण चाहते हैं
    - आपको अधिक सख्त GPT-5 एजेंट निष्पादन व्यवहार चाहिए
summary: OpenClaw में API कुंजियों या Codex सदस्यता के माध्यम से OpenAI का उपयोग करें
title: OpenAI
x-i18n:
    generated_at: "2026-07-01T08:08:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7078798b1d73bd1efca4820eae6d3fb6510e802b2c9193d0c135d8ab28c58fca
    source_path: providers/openai.md
    workflow: 16
---

OpenAI GPT मॉडलों के लिए डेवलपर API प्रदान करता है, और Codex OpenAI के Codex क्लाइंट्स के माध्यम से
ChatGPT-प्लान कोडिंग एजेंट के रूप में भी उपलब्ध है। OpenClaw दोनों auth आकारों के लिए एक
provider id, `openai`, का उपयोग करता है।

OpenClaw कैननिकल OpenAI मॉडल रूट के रूप में `openai/*` का उपयोग करता है। OpenAI मॉडलों पर एम्बेडेड एजेंट
turns डिफ़ॉल्ट रूप से native Codex app-server runtime के माध्यम से चलते हैं;
direct OpenAI API-key auth images, embeddings, speech, और realtime जैसी non-agent OpenAI
surfaces के लिए उपलब्ध रहता है।

- **एजेंट मॉडल** - Codex runtime के माध्यम से `openai/*` मॉडल; ChatGPT/Codex subscription उपयोग के लिए
  Codex auth से साइन इन करें, या जब आप जानबूझकर API-key auth चाहते हों तब Codex-compatible
  OpenAI API-key backup कॉन्फ़िगर करें।
- **Non-agent OpenAI APIs** - `OPENAI_API_KEY` या OpenAI API-key onboarding के माध्यम से usage-based
  billing के साथ direct OpenAI Platform access।
- **Legacy config** - legacy Codex model refs को
  `openclaw doctor --fix` द्वारा `openai/*` और Codex runtime में सुधारा जाता है।

OpenAI OpenClaw जैसे external tools और workflows में subscription OAuth उपयोग को स्पष्ट रूप से support करता है।

Provider, model, runtime, और channel अलग-अलग layers हैं। अगर ये labels
आपस में मिल रहे हैं, तो config बदलने से पहले [Agent runtimes](/hi/concepts/agent-runtimes) पढ़ें।

## त्वरित चयन

| लक्ष्य                                                 | उपयोग                                                      | नोट्स                                                                 |
| ---------------------------------------------------- | -------------------------------------------------------- | --------------------------------------------------------------------- |
| native Codex runtime के साथ ChatGPT/Codex subscription | `openai/gpt-5.5`                                         | डिफ़ॉल्ट OpenAI agent setup। Codex auth से साइन इन करें।                  |
| GPT-5.6 limited preview                              | `openai/gpt-5.6-sol`, `-terra`, या `-luna`               | OpenAI-approved API organization या Codex workspace आवश्यक है।      |
| agent models के लिए direct API-key billing              | `openai/gpt-5.5` और Codex-compatible API-key profile | backup को subscription auth के बाद रखने के लिए `auth.order.openai` का उपयोग करें।  |
| explicit OpenClaw के माध्यम से direct API-key billing     | `openai/gpt-5.5` और provider/model runtime `openclaw`  | सामान्य `openai` API-key profile चुनें।                             |
| नवीनतम ChatGPT Instant API alias                     | `openai/chat-latest`                                     | केवल direct API-key। प्रयोगों के लिए moving alias, डिफ़ॉल्ट नहीं।   |
| OpenClaw के माध्यम से ChatGPT/Codex subscription auth     | `openai/gpt-5.5` और provider/model runtime `openclaw`  | compatibility route के लिए `openai` OAuth profile चुनें।         |
| Image generation या editing                          | `openai/gpt-image-2`                                     | `OPENAI_API_KEY` या OpenAI Codex OAuth, दोनों के साथ काम करता है।             |
| Transparent-background images                        | `openai/gpt-image-1.5`                                   | `outputFormat=png` या `webp` और `openai.background=transparent` का उपयोग करें। |

## नामकरण मैप

नाम समान हैं लेकिन interchangeable नहीं हैं:

| दिखने वाला नाम                            | Layer             | अर्थ                                                                                           |
| --------------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------- |
| `openai`                                | Provider prefix   | कैननिकल OpenAI model route; agent turns Codex runtime का उपयोग करते हैं।                                  |
| legacy OpenAI Codex prefix              | Legacy prefix     | पुराना model/profile namespace। `openclaw doctor --fix` इसे `openai` में migrate करता है।                   |
| `codex` plugin                          | Plugin            | bundled OpenClaw Plugin जो native Codex app-server runtime और `/codex` chat controls प्रदान करता है। |
| provider/model `agentRuntime.id: codex` | Agent runtime     | matching embedded turns के लिए native Codex app-server harness को force करें।                            |
| `/codex ...`                            | Chat command set  | conversation से Codex app-server threads को bind/control करें।                                        |
| `runtime: "acp", agentId: "codex"`      | ACP session route | explicit fallback path जो Codex को ACP/acpx के माध्यम से चलाता है।                                          |

इसका अर्थ है कि कोई config जानबूझकर `openai/*` model refs रख सकता है, जबकि auth
profiles API-key या ChatGPT/Codex OAuth credentials में से किसी एक की ओर point करते हैं। config के लिए
`auth.order.openai` का उपयोग करें; `openclaw doctor --fix` legacy
legacy Codex model refs, legacy Codex auth profile ids, और
legacy Codex auth order को canonical OpenAI route में rewrite करता है।

<Note>
GPT-5.5 direct OpenAI Platform API-key access और subscription/OAuth routes, दोनों के माध्यम से उपलब्ध है। ChatGPT/Codex subscription और native Codex
execution के लिए, `openai/gpt-5.5` का उपयोग करें; unset runtime config अब OpenAI agent turns के लिए Codex
harness चुनता है। OpenAI API-key profiles का उपयोग केवल तब करें जब आप किसी OpenAI agent model के लिए
direct API-key auth चाहते हों।
</Note>

## GPT-5.6 limited preview

OpenClaw तीन public GPT-5.6 model ids को पहचानता है:

- `openai/gpt-5.6-sol`
- `openai/gpt-5.6-terra`
- `openai/gpt-5.6-luna`

वर्तमान Codex app-server catalog में तीनों `max` reasoning expose करते हैं। OpenAI
launch announcement Sol को flagship tier, Terra को balanced tier, और Luna को fast, lower-cost tier के रूप में describe करता है। देखें
[GPT-5.6 launch announcement](https://openai.com/index/previewing-gpt-5-6-sol/)
और [preview access guide](https://help.openai.com/en/articles/20001325-a-preview-of-gpt-5-6-sol-terra-and-luna)।

preview के दौरान access allowlisted है और API तथा Codex के लिए अलग-अलग grant किया जा सकता है।
केवल paid ChatGPT plan access grant नहीं करता। OpenClaw
`openai/gpt-5.5` को डिफ़ॉल्ट रखता है; access के बिना GPT-5.6 ref चुनने पर
silent fallback के बजाय upstream access error return होता है।

<Note>
OpenAI agent model turns के लिए bundled Codex app-server Plugin आवश्यक है। Explicit
OpenClaw runtime config opt-in compatibility route के रूप में उपलब्ध रहता है। जब OpenClaw को
`openai` OAuth profile के साथ explicitly select किया जाता है, OpenClaw
public model ref को `openai/*` के रूप में रखता है और internally Codex-auth
transport के माध्यम से route करता है। stale
legacy Codex model refs, `codex-cli/*`, या explicit runtime config से नहीं आने वाले पुराने runtime session pins को repair करने के लिए `openclaw doctor --fix` चलाएं।
</Note>

## OpenClaw feature coverage

| OpenAI capability         | OpenClaw surface                                                                              | स्थिति                                                                 |
| ------------------------- | --------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Chat / Responses          | `openai/<model>` model provider                                                               | हां                                                                    |
| Codex subscription models | OpenAI OAuth के साथ `openai/<model>`                                                            | हां                                                                    |
| Legacy Codex model refs   | legacy Codex model refs या `codex-cli/<model>`                                                | doctor द्वारा `openai/<model>` में सुधारा गया                                 |
| Codex app-server harness  | omitted runtime या provider/model `agentRuntime.id: codex` के साथ `openai/<model>`              | हां                                                                    |
| Server-side web search    | Native OpenAI Responses tool                                                                  | हां, जब web search enabled हो और कोई provider pinned न हो                 |
| Images                    | `image_generate`                                                                              | हां                                                                    |
| Videos                    | `video_generate`                                                                              | हां                                                                    |
| Text-to-speech            | `messages.tts.provider: "openai"` / `tts`                                                     | हां                                                                    |
| Batch speech-to-text      | `tools.media.audio` / media understanding                                                     | हां                                                                    |
| Streaming speech-to-text  | Voice Call `streaming.provider: "openai"`                                                     | हां                                                                    |
| Realtime voice            | Voice Call `realtime.provider: "openai"` / Control UI Talk `talk.realtime.provider: "openai"` | हां (OpenAI Platform credits आवश्यक हैं, Codex/ChatGPT subscription नहीं) |
| Embeddings                | memory embedding provider                                                                     | हां                                                                    |

<Note>
  OpenAI Realtime voice (Voice Call के `realtime.provider: "openai"` और
  Control UI Talk में `talk.realtime.provider: "openai"` द्वारा उपयोग किया गया) public **OpenAI Platform Realtime API** के माध्यम से जाता है,
  जिसका billing Codex/ChatGPT subscription quota के बजाय OpenAI
  Platform credits के विरुद्ध होता है। ऐसा account
  जिसमें healthy OpenAI OAuth हो और जो Codex-backed chat models बिना समस्या चलाता हो,
  उसे भी Realtime voice के लिए funded
  Platform billing के साथ OpenAI API-key auth profile या Platform API key चाहिए।

Fix: अपने realtime credentials को back करने वाले organization के लिए
[platform.openai.com/account/billing](https://platform.openai.com/account/billing)
पर Platform credits top up करें। Realtime voice `openclaw onboard --auth-choice openai-api-key` द्वारा बनाया गया
`openai` API-key auth profile,
Control UI Talk के लिए `talk.realtime.providers.openai.apiKey` के माध्यम से configured Platform `OPENAI_API_KEY`,
Voice Call के लिए `plugins.entries.voice-call.config.realtime.providers.openai.apiKey`,
या `OPENAI_API_KEY` environment variable स्वीकार करता है। OpenAI OAuth
profiles उसी OpenClaw install में Codex-backed `openai/*` chat models अब भी चला सकते हैं,
लेकिन वे Realtime voice configure नहीं करते।
</Note>

## Memory embeddings

OpenClaw `memory_search` indexing और query embeddings के लिए OpenAI, या OpenAI-compatible embedding endpoint का उपयोग कर सकता है:

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

OpenAI-compatible endpoints के लिए जिन्हें asymmetric embedding labels की आवश्यकता होती है,
`memorySearch` के अंतर्गत `queryInputType` और `documentInputType` set करें। OpenClaw इन्हें
provider-specific `input_type` request fields के रूप में forward करता है: query embeddings
`queryInputType` का उपयोग करते हैं; indexed memory chunks और batch indexing
`documentInputType` का उपयोग करते हैं। पूरे example के लिए [Memory configuration reference](/hi/reference/memory-config#provider-specific-config) देखें।

## शुरू करना

अपनी पसंदीदा auth method चुनें और setup steps follow करें।

<Tabs>
  <Tab title="API key (OpenAI Platform)">
    **इनके लिए सर्वश्रेष्ठ:** direct API access और usage-based billing।

    <Steps>
      <Step title="अपनी API key प्राप्त करें">
        [OpenAI Platform dashboard](https://platform.openai.com/api-keys) से API key बनाएं या copy करें।
      </Step>
      <Step title="onboarding चलाएं">
        ```bash
        openclaw onboard --auth-choice openai-api-key
        ```

        या key को सीधे pass करें:

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

    | मॉडल रेफ              | रनटाइम कॉन्फ़िग             | रूट                       | ऑथ             |
    | ---------------------- | -------------------------- | --------------------------- | ---------------- |
    | `openai/gpt-5.5`      | छोड़ा गया / provider/model `agentRuntime.id: "codex"` | Codex app-server हार्नेस | Codex-संगत OpenAI प्रोफ़ाइल |
    | `openai/gpt-5.4-mini` | छोड़ा गया / provider/model `agentRuntime.id: "codex"` | Codex app-server हार्नेस | Codex-संगत OpenAI प्रोफ़ाइल |
    | `openai/gpt-5.5`      | provider/model `agentRuntime.id: "openclaw"`              | OpenClaw एम्बेडेड रनटाइम      | चुनी गई `openai` प्रोफ़ाइल |

    <Note>
    `openai/*` एजेंट मॉडल Codex app-server हार्नेस का उपयोग करते हैं। किसी एजेंट मॉडल के लिए API-key
    ऑथ का उपयोग करने के लिए, Codex-संगत API-key प्रोफ़ाइल बनाएं और उसे
    `auth.order.openai` के साथ क्रमबद्ध करें; `OPENAI_API_KEY` गैर-एजेंट OpenAI API सतहों के लिए
    सीधा फ़ॉलबैक बना रहता है। पुराने
    लेगेसी Codex ऑथ क्रम प्रविष्टियों को माइग्रेट करने के लिए `openclaw doctor --fix` चलाएं।
    </Note>

    ### कॉन्फ़िग उदाहरण

    ```json5
    {
      env: { OPENAI_API_KEY: "example-openai-key-not-real" },
      agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
    }
    ```

    OpenAI API से ChatGPT के वर्तमान Instant मॉडल को आज़माने के लिए, मॉडल
    को `openai/chat-latest` पर सेट करें:

    ```json5
    {
      env: { OPENAI_API_KEY: "example-openai-key-not-real" },
      agents: { defaults: { model: { primary: "openai/chat-latest" } } },
    }
    ```

    `chat-latest` एक बदलता हुआ एलियस है। OpenAI इसे ChatGPT में उपयोग होने वाला नवीनतम Instant
    मॉडल बताता है और उत्पादन API उपयोग के लिए `gpt-5.5` की अनुशंसा करता है, इसलिए
    जब तक आप स्पष्ट रूप से उस एलियस व्यवहार को नहीं चाहते, `openai/gpt-5.5` को स्थिर डिफ़ॉल्ट के रूप में
    रखें। एलियस वर्तमान में केवल `medium` टेक्स्ट वर्बोसिटी स्वीकार करता है, इसलिए
    OpenClaw इस मॉडल के लिए असंगत OpenAI टेक्स्ट-वर्बोसिटी ओवरराइड को सामान्यीकृत करता है।

    <Warning>
    OpenClaw सीधे OpenAI API-key रूट पर `gpt-5.3-codex-spark` को एक्सपोज़ **नहीं** करता। यह केवल Codex सदस्यता कैटलॉग प्रविष्टियों के माध्यम से उपलब्ध है, जब आपका साइन-इन किया हुआ खाता इसे एक्सपोज़ करता है।
    </Warning>

  </Tab>

  <Tab title="Codex सदस्यता">
    **इसके लिए सर्वोत्तम:** अलग API key के बजाय अपने ChatGPT/Codex सदस्यता का उपयोग नेटिव Codex app-server निष्पादन के साथ करना। Codex क्लाउड के लिए ChatGPT साइन-इन आवश्यक है।

    <Steps>
      <Step title="Codex OAuth चलाएं">
        ```bash
        openclaw onboard --auth-choice openai
        ```

        या OAuth को सीधे चलाएं:

        ```bash
        openclaw models auth login --provider openai
        ```

        हेडलेस या callback-होस्टाइल सेटअप के लिए, localhost ब्राउज़र कॉलबैक के बजाय ChatGPT device-code फ़्लो से साइन इन करने के लिए `--device-code` जोड़ें:

        ```bash
        openclaw models auth login --provider openai --device-code
        ```
      </Step>
      <Step title="कैनॉनिकल OpenAI मॉडल रूट का उपयोग करें">
        ```bash
        openclaw config set agents.defaults.model.primary openai/gpt-5.5
        ```

        डिफ़ॉल्ट पाथ के लिए कोई रनटाइम कॉन्फ़िग आवश्यक नहीं है। OpenAI एजेंट टर्न
        अपने-आप नेटिव Codex app-server रनटाइम चुनते हैं, और यह रूट चुने जाने पर OpenClaw
        बंडल किए गए Codex Plugin को इंस्टॉल या रिपेयर करता है।
      </Step>
      <Step title="सत्यापित करें कि Codex ऑथ उपलब्ध है">
        ```bash
        openclaw models list --provider openai
        ```

        Gateway चलने के बाद, नेटिव app-server रनटाइम सत्यापित करने के लिए चैट में `/codex status` या `/codex models`
        भेजें।
      </Step>
    </Steps>

    ### रूट सारांश

    | मॉडल रेफ | रनटाइम कॉन्फ़िग | रूट | ऑथ |
    |-----------|----------------|-------|------|
    | `openai/gpt-5.5` | छोड़ा गया / provider/model `agentRuntime.id: "codex"` | नेटिव Codex app-server हार्नेस | Codex साइन-इन या क्रमबद्ध `openai` ऑथ प्रोफ़ाइल |
    | `openai/gpt-5.5` | provider/model `agentRuntime.id: "openclaw"` | आंतरिक Codex-ऑथ ट्रांसपोर्ट के साथ OpenClaw एम्बेडेड रनटाइम | चुनी गई `openai` OAuth प्रोफ़ाइल |
    | लेगेसी Codex GPT-5.5 रेफ | doctor द्वारा रिपेयर किया गया | लेगेसी रूट `openai/gpt-5.5` पर फिर से लिखा गया | माइग्रेट की गई OpenAI OAuth प्रोफ़ाइल |
    | `codex-cli/gpt-5.5` | doctor द्वारा रिपेयर किया गया | लेगेसी CLI रूट `openai/gpt-5.5` पर फिर से लिखा गया | Codex app-server ऑथ |

    <Warning>
    नई सदस्यता-समर्थित एजेंट कॉन्फ़िग के लिए `openai/gpt-5.5` को प्राथमिकता दें। पुराने
    लेगेसी Codex GPT रेफ लेगेसी OpenClaw रूट हैं, नेटिव Codex रनटाइम
    पाथ नहीं; जब आप उन्हें कैनॉनिकल
    `openai/*` रेफ पर माइग्रेट करना चाहें, तो `openclaw doctor --fix` चलाएं। `gpt-5.3-codex-spark` उन खातों तक सीमित रहता है जिनका
    Codex सदस्यता कैटलॉग उस मॉडल का विज्ञापन करता है; इसके लिए सीधे OpenAI API-key और
    Azure रेफ दबे रहते हैं।
    </Warning>

    <Note>
    लेगेसी Codex मॉडल प्रीफ़िक्स लेगेसी कॉन्फ़िग है जिसे doctor रिपेयर करता है। सामान्य
    सदस्यता और नेटिव रनटाइम सेटअप के लिए, Codex ऑथ से साइन इन करें
    लेकिन मॉडल रेफ को `openai/gpt-5.5` के रूप में रखें। नई कॉन्फ़िग में OpenAI
    एजेंट ऑथ क्रम `auth.order.openai` के अंतर्गत रखना चाहिए; doctor पुराने
    लेगेसी Codex ऑथ क्रम प्रविष्टियों को माइग्रेट करता है।
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

    API-key बैकअप के साथ, मॉडल को `openai/gpt-5.5` पर रखें और
    ऑथ क्रम को `openai` के अंतर्गत रखें। OpenClaw पहले सदस्यता को आज़माएगा, फिर
    API key को, जबकि Codex हार्नेस पर बना रहेगा:

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
    ऑनबोर्डिंग अब `~/.codex` से OAuth सामग्री आयात नहीं करती। ब्राउज़र OAuth (डिफ़ॉल्ट) या ऊपर दिए गए device-code फ़्लो से साइन इन करें — OpenClaw परिणामी क्रेडेंशियल्स को अपने स्वयं के एजेंट ऑथ स्टोर में प्रबंधित करता है।
    </Note>

    ### Codex OAuth रूटिंग की जांच और रिकवरी

    यह देखने के लिए इन कमांडों का उपयोग करें कि आपका डिफ़ॉल्ट
    एजेंट कौन सा मॉडल, रनटाइम और ऑथ रूट उपयोग कर रहा है:

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

    यदि किसी पुराने कॉन्फ़िग में अभी भी लेगेसी Codex GPT रेफ या स्पष्ट रनटाइम कॉन्फ़िग के बिना बासी OpenAI रनटाइम
    सेशन पिन है, तो उसे रिपेयर करें:

    ```bash
    openclaw doctor --fix
    openclaw config validate
    ```

    यदि `models auth list --provider openai` कोई उपयोगी प्रोफ़ाइल नहीं दिखाता, तो
    फिर से साइन इन करें:

    ```bash
    openclaw models auth login --provider openai
    openclaw models status --probe --probe-provider openai
    ```

    जब आप एक ही
    एजेंट में कई Codex OAuth लॉगिन चाहते हैं और बाद में उन्हें ऑथ क्रम या `/model ...@<profileId>` के माध्यम से नियंत्रित करना चाहते हैं, तो `--profile-id` का उपयोग करें:

    ```bash
    openclaw models auth login --provider openai --profile-id openai:ritsuko
    openclaw models auth login --provider openai --profile-id openai:lain
    ```

    `openai/*` Codex के माध्यम से OpenAI एजेंट टर्न के लिए मॉडल रूट है। पुराने लेगेसी OpenAI Codex प्रीफ़िक्स प्रोफ़ाइल ids और
    क्रम प्रविष्टियों को माइग्रेट करने के लिए `openclaw doctor --fix` चलाएं, उसके बाद ही प्रोफ़ाइल क्रम पर निर्भर रहें।

    ### स्थिति संकेतक

    चैट `/status` दिखाता है कि वर्तमान सेशन के लिए कौन सा मॉडल रनटाइम सक्रिय है।
    बंडल किया गया Codex app-server हार्नेस OpenAI एजेंट मॉडल टर्न के लिए `Runtime: OpenAI Codex` के रूप में
    दिखाई देता है। बासी OpenAI रनटाइम सेशन पिन Codex में रिपेयर किए जाते हैं, जब तक
    कॉन्फ़िग स्पष्ट रूप से OpenClaw को पिन न करे।

    ### Doctor चेतावनी

    यदि लेगेसी Codex मॉडल रेफ या बासी OpenAI रनटाइम पिन कॉन्फ़िग या
    सेशन स्थिति में बचे रहते हैं, तो `openclaw doctor --fix` उन्हें Codex रनटाइम के साथ
    `openai/*` में फिर से लिखता है, जब तक OpenClaw स्पष्ट रूप से कॉन्फ़िग न किया गया हो।

    ### कॉन्टेक्स्ट विंडो कैप

    OpenClaw मॉडल मेटाडेटा और रनटाइम कॉन्टेक्स्ट कैप को अलग-अलग मानों के रूप में मानता है।

    Codex OAuth कैटलॉग के माध्यम से `openai/gpt-5.5` के लिए:

    - नेटिव `contextWindow`: `1000000`
    - डिफ़ॉल्ट रनटाइम `contextTokens` कैप: `272000`

    छोटा डिफ़ॉल्ट कैप व्यवहार में बेहतर लेटेंसी और गुणवत्ता विशेषताएं देता है। इसे `contextTokens` से ओवरराइड करें:

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
    नेटिव मॉडल मेटाडेटा घोषित करने के लिए `contextWindow` का उपयोग करें। रनटाइम कॉन्टेक्स्ट बजट सीमित करने के लिए `contextTokens` का उपयोग करें।
    </Note>

    ### कैटलॉग रिकवरी

    OpenClaw `gpt-5.5` के लिए upstream Codex कैटलॉग मेटाडेटा का उपयोग करता है, जब वह
    मौजूद हो। यदि खाता ऑथेंटिकेटेड होने के बावजूद लाइव Codex डिस्कवरी
    `gpt-5.5` पंक्ति को छोड़ देती है, तो OpenClaw उस OAuth मॉडल पंक्ति को सिंथेसाइज़ करता है ताकि
    cron, sub-agent, और कॉन्फ़िग किए गए डिफ़ॉल्ट-मॉडल रन
    `Unknown model` के साथ विफल न हों।

  </Tab>
</Tabs>

## नेटिव Codex app-server ऑथ

नेटिव Codex app-server हार्नेस `openai/*` मॉडल रेफ और छोड़े गए
रनटाइम कॉन्फ़िग या provider/model `agentRuntime.id: "codex"` का उपयोग करता है, लेकिन इसका ऑथ
अब भी account-based है। OpenClaw इस क्रम में ऑथ चुनता है:

1. एजेंट के लिए क्रमबद्ध OpenAI ऑथ प्रोफ़ाइल, प्राथमिकता से
   `auth.order.openai` के अंतर्गत। पुराने
   लेगेसी Codex ऑथ प्रोफ़ाइल ids और लेगेसी Codex ऑथ क्रम को माइग्रेट करने के लिए `openclaw doctor --fix` चलाएं।
2. app-server का मौजूदा खाता, जैसे स्थानीय Codex CLI ChatGPT साइन-इन।
3. केवल स्थानीय stdio app-server लॉन्च के लिए, `CODEX_API_KEY`, फिर
   `OPENAI_API_KEY`, जब app-server कोई खाता रिपोर्ट नहीं करता और अब भी
   OpenAI ऑथ मांगता है।

इसका अर्थ है कि स्थानीय ChatGPT/Codex सदस्यता साइन-इन केवल इसलिए बदला नहीं जाता
क्योंकि Gateway प्रोसेस के पास सीधे OpenAI मॉडल
या embeddings के लिए `OPENAI_API_KEY` भी है। Env API-key फ़ॉलबैक केवल स्थानीय stdio no-account पाथ है; इसे
WebSocket app-server कनेक्शनों को नहीं भेजा जाता। जब सदस्यता-शैली Codex
प्रोफ़ाइल चुनी जाती है, OpenClaw spawned stdio app-server child से `CODEX_API_KEY` और `OPENAI_API_KEY`
को भी बाहर रखता है और चुने गए क्रेडेंशियल्स
app-server login RPC के माध्यम से भेजता है। जब वह सदस्यता प्रोफ़ाइल
Codex उपयोग सीमा से ब्लॉक होती है, OpenClaw चुने गए मॉडल को बदले बिना या Codex
हार्नेस से बाहर निकले बिना अगले क्रमबद्ध `openai:*` API-key
प्रोफ़ाइल पर रोटेट कर सकता है। सदस्यता रीसेट समय बीत जाने पर, सदस्यता प्रोफ़ाइल
फिर से पात्र हो जाती है।

## इमेज जनरेशन

बंडल किया गया `openai` Plugin `image_generate` टूल के माध्यम से इमेज जनरेशन रजिस्टर करता है।
यह OpenAI API-key इमेज जनरेशन और Codex OAuth इमेज
जनरेशन, दोनों को एक ही `openai/gpt-image-2` मॉडल रेफ के माध्यम से सपोर्ट करता है।

| क्षमता                  | OpenAI API कुंजी                   | Codex OAuth                          |
| ------------------------- | ---------------------------------- | ------------------------------------ |
| मॉडल ref                 | `openai/gpt-image-2`               | `openai/gpt-image-2`                 |
| प्रमाणीकरण                      | `OPENAI_API_KEY`                   | OpenAI Codex OAuth साइन-इन           |
| ट्रांसपोर्ट                 | OpenAI Images API                  | Codex Responses बैकएंड              |
| प्रति अनुरोध अधिकतम इमेज    | 4                                  | 4                                    |
| संपादन मोड                 | सक्षम (5 तक संदर्भ इमेज) | सक्षम (5 तक संदर्भ इमेज)   |
| आकार ओवरराइड            | समर्थित, 2K/4K आकारों सहित   | समर्थित, 2K/4K आकारों सहित     |
| आस्पेक्ट अनुपात / रिज़ॉल्यूशन | OpenAI Images API को आगे नहीं भेजा गया | सुरक्षित होने पर समर्थित आकार में मैप किया गया |

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
साझा टूल पैरामीटर, प्रदाता चयन, और फेलओवर व्यवहार के लिए [इमेज जनरेशन](/hi/tools/image-generation) देखें।
</Note>

`gpt-image-2` OpenAI टेक्स्ट-से-इमेज जनरेशन और इमेज
संपादन दोनों के लिए डिफ़ॉल्ट है। `gpt-image-1.5`, `gpt-image-1`, और `gpt-image-1-mini`
स्पष्ट मॉडल ओवरराइड के रूप में उपयोग योग्य बने रहते हैं। पारदर्शी-पृष्ठभूमि
PNG/WebP आउटपुट के लिए `openai/gpt-image-1.5` का उपयोग करें; मौजूदा `gpt-image-2` API
`background: "transparent"` को अस्वीकार करता है।

पारदर्शी-पृष्ठभूमि अनुरोध के लिए, एजेंटों को `image_generate` को
`model: "openai/gpt-image-1.5"`, `outputFormat: "png"` या `"webp"`, और
`background: "transparent"` के साथ कॉल करना चाहिए; पुराना `openai.background` प्रदाता विकल्प
अभी भी स्वीकार किया जाता है। OpenClaw सार्वजनिक OpenAI और
OpenAI Codex OAuth मार्गों की भी सुरक्षा करता है, डिफ़ॉल्ट `openai/gpt-image-2` पारदर्शी
अनुरोधों को `gpt-image-1.5` में फिर से लिखकर; Azure और कस्टम OpenAI-संगत एंडपॉइंट
अपने कॉन्फ़िगर किए गए डिप्लॉयमेंट/मॉडल नाम रखते हैं।

हेडलेस CLI रन के लिए वही सेटिंग उपलब्ध है:

```bash
openclaw infer image generate \
  --model openai/gpt-image-1.5 \
  --output-format png \
  --background transparent \
  --prompt "A simple red circle sticker on a transparent background" \
  --json
```

इनपुट फ़ाइल से शुरू करते समय `openclaw infer image edit` के साथ वही
`--output-format` और `--background` फ़्लैग उपयोग करें।
`--openai-background` OpenAI-विशिष्ट उपनाम के रूप में उपलब्ध रहता है।
OpenAI Images गुणवत्ता और लागत नियंत्रित करने की आवश्यकता होने पर
`--quality low|medium|high|auto` का उपयोग करें। `image generate` या `image edit` से OpenAI का
प्रदाता-विशिष्ट मॉडरेशन संकेत पास करने के लिए `--openai-moderation low|auto` का उपयोग करें।

ChatGPT/Codex OAuth इंस्टॉल के लिए, वही `openai/gpt-image-2` ref रखें। जब कोई
`openai` OAuth प्रोफ़ाइल कॉन्फ़िगर की जाती है, OpenClaw उस संग्रहीत OAuth
एक्सेस टोकन को हल करता है और Codex Responses बैकएंड के माध्यम से इमेज अनुरोध भेजता है। यह
उस अनुरोध के लिए पहले `OPENAI_API_KEY` आज़माता नहीं है या चुपचाप API कुंजी पर वापस नहीं जाता।
जब आप इसके बजाय सीधे OpenAI Images API
मार्ग चाहते हैं, तो `models.providers.openai` को API कुंजी,
कस्टम बेस URL, या Azure एंडपॉइंट के साथ स्पष्ट रूप से कॉन्फ़िगर करें।
यदि वह कस्टम इमेज एंडपॉइंट किसी विश्वसनीय LAN/निजी पते पर है, तो
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true` भी सेट करें; OpenClaw निजी/आंतरिक OpenAI-संगत
इमेज एंडपॉइंट को तब तक ब्लॉक रखता है जब तक यह ऑप्ट-इन मौजूद न हो।

जनरेट करें:

```
/tool image_generate model=openai/gpt-image-2 prompt="A polished launch poster for OpenClaw on macOS" size=3840x2160 count=1
```

पारदर्शी PNG जनरेट करें:

```
/tool image_generate model=openai/gpt-image-1.5 prompt="A simple red circle sticker on a transparent background" outputFormat=png background=transparent
```

संपादित करें:

```
/tool image_generate model=openai/gpt-image-2 prompt="Preserve the object shape, change the material to translucent glass" image=/path/to/reference.png size=1024x1536
```

## वीडियो जनरेशन

बंडल किया गया `openai` Plugin `video_generate` टूल के माध्यम से वीडियो जनरेशन पंजीकृत करता है।

| क्षमता       | मान                                                                             |
| ---------------- | --------------------------------------------------------------------------------- |
| डिफ़ॉल्ट मॉडल    | `openai/sora-2`                                                                   |
| मोड            | टेक्स्ट-से-वीडियो, इमेज-से-वीडियो, एकल-वीडियो संपादन                                  |
| संदर्भ इनपुट | 1 इमेज या 1 वीडियो                                                                |
| आकार ओवरराइड   | टेक्स्ट-से-वीडियो और इमेज-से-वीडियो के लिए समर्थित                                    |
| अन्य ओवरराइड  | `aspectRatio`, `resolution`, `audio`, `watermark` को टूल चेतावनी के साथ अनदेखा किया जाता है |

OpenAI इमेज-से-वीडियो अनुरोध इमेज
`input_reference` के साथ `POST /v1/videos` का उपयोग करते हैं। एकल-वीडियो संपादन
`video` फ़ील्ड में अपलोड किए गए वीडियो के साथ `POST /v1/videos/edits` का उपयोग करते हैं।

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
साझा टूल पैरामीटर, प्रदाता चयन, और फेलओवर व्यवहार के लिए [वीडियो जनरेशन](/hi/tools/video-generation) देखें।
</Note>

## GPT-5 प्रॉम्प्ट योगदान

OpenClaw, OpenClaw-असेंबल किए गए प्रॉम्प्ट सरफ़ेस पर GPT-5-फ़ैमिली रन के लिए साझा GPT-5 प्रॉम्प्ट योगदान जोड़ता है। यह मॉडल id के आधार पर लागू होता है, इसलिए OpenClaw/प्रदाता मार्ग जैसे लेगेसी प्री-रिपेयर refs (लेगेसी Codex GPT-5.5 ref), `openrouter/openai/gpt-5.5`, `opencode/gpt-5.5`, और अन्य संगत GPT-5 refs को वही ओवरले मिलता है। पुराने GPT-4.x मॉडल नहीं मिलते।

बंडल किए गए नेटिव Codex हार्नेस को Codex app-server डेवलपर निर्देशों के माध्यम से यह OpenClaw GPT-5 ओवरले नहीं मिलता। नेटिव Codex, Codex-स्वामित्व वाले बेस, मॉडल, और प्रोजेक्ट-डॉक व्यवहार को रखता है, जबकि OpenClaw नेटिव थ्रेड के लिए Codex की बिल्ट-इन पर्सनैलिटी को अक्षम करता है ताकि एजेंट वर्कस्पेस पर्सनैलिटी फ़ाइलें प्राधिकृत रहें। OpenClaw केवल रनटाइम संदर्भ जैसे चैनल डिलीवरी, OpenClaw डायनेमिक टूल, ACP डेलीगेशन, वर्कस्पेस संदर्भ, और OpenClaw Skills का योगदान करता है।

GPT-5 योगदान, मेल खाते OpenClaw-असेंबल किए गए प्रॉम्प्ट पर व्यक्तित्व स्थायित्व, निष्पादन सुरक्षा, टूल अनुशासन, आउटपुट आकार, पूर्णता जांच, और सत्यापन के लिए टैग किया हुआ व्यवहार अनुबंध जोड़ता है। चैनल-विशिष्ट उत्तर और साइलेंट-मैसेज व्यवहार साझा OpenClaw सिस्टम प्रॉम्प्ट और आउटबाउंड डिलीवरी नीति में रहता है। मित्रवत इंटरैक्शन-स्टाइल लेयर अलग और कॉन्फ़िगर करने योग्य है।

| मान                  | प्रभाव                                      |
| ---------------------- | ------------------------------------------- |
| `"friendly"` (डिफ़ॉल्ट) | मित्रवत इंटरैक्शन-स्टाइल लेयर सक्षम करें |
| `"on"`                 | `"friendly"` के लिए उपनाम                      |
| `"off"`                | केवल मित्रवत शैली लेयर अक्षम करें       |

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
रनटाइम पर मान केस-असंवेदनशील हैं, इसलिए `"Off"` और `"off"` दोनों मित्रवत शैली लेयर को अक्षम करते हैं।
</Tip>

<Note>
जब साझा `agents.defaults.promptOverlays.gpt5.personality` सेटिंग सेट नहीं होती, तो लेगेसी `plugins.entries.openai.config.personality` अभी भी संगतता फॉलबैक के रूप में पढ़ी जाती है।
</Note>

## वॉइस और स्पीच

<AccordionGroup>
  <Accordion title="स्पीच सिंथेसिस (TTS)">
    बंडल किया गया `openai` Plugin `messages.tts` सरफ़ेस के लिए स्पीच सिंथेसिस पंजीकृत करता है।

    | सेटिंग | कॉन्फ़िग पथ | डिफ़ॉल्ट |
    |---------|------------|---------|
    | मॉडल | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | वॉइस | `messages.tts.providers.openai.speakerVoice` | `coral` |
    | गति | `messages.tts.providers.openai.speed` | (अनसेट) |
    | निर्देश | `messages.tts.providers.openai.instructions` | (अनसेट, केवल `gpt-4o-mini-tts`) |
    | फ़ॉर्मैट | `messages.tts.providers.openai.responseFormat` | वॉइस नोट्स के लिए `opus`, फ़ाइलों के लिए `mp3` |
    | API कुंजी | `messages.tts.providers.openai.apiKey` | `OPENAI_API_KEY` पर वापस जाता है |
    | बेस URL | `messages.tts.providers.openai.baseUrl` | `https://api.openai.com/v1` |
    | अतिरिक्त बॉडी | `messages.tts.providers.openai.extraBody` / `extra_body` | (अनसेट) |

    उपलब्ध मॉडल: `gpt-4o-mini-tts`, `tts-1`, `tts-1-hd`। उपलब्ध वॉइस: `alloy`, `ash`, `ballad`, `cedar`, `coral`, `echo`, `fable`, `juniper`, `marin`, `onyx`, `nova`, `sage`, `shimmer`, `verse`।

    `extraBody` को OpenClaw के जनरेट किए गए फ़ील्ड के बाद `/audio/speech` अनुरोध JSON में मर्ज किया जाता है, इसलिए इसे उन OpenAI-संगत एंडपॉइंट के लिए उपयोग करें जिन्हें `lang` जैसी अतिरिक्त कुंजियों की आवश्यकता होती है। प्रोटोटाइप कुंजियां अनदेखी की जाती हैं।

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
    चैट API एंडपॉइंट को प्रभावित किए बिना TTS बेस URL ओवरराइड करने के लिए `OPENAI_TTS_BASE_URL` सेट करें। OpenAI TTS और Realtime वॉइस दोनों OpenAI Platform API कुंजी के माध्यम से कॉन्फ़िगर होते हैं; केवल OAuth वाले इंस्टॉल अभी भी Codex-समर्थित चैट मॉडल उपयोग कर सकते हैं, लेकिन OpenAI लाइव टॉक-बैक नहीं।
    </Note>

  </Accordion>

  <Accordion title="स्पीच-से-टेक्स्ट">
    बंडल किया गया `openai` Plugin OpenClaw के मीडिया-अंडरस्टैंडिंग ट्रांसक्रिप्शन सरफ़ेस के माध्यम से
    बैच स्पीच-से-टेक्स्ट पंजीकृत करता है।

    - डिफ़ॉल्ट मॉडल: `gpt-4o-transcribe`
    - एंडपॉइंट: OpenAI REST `/v1/audio/transcriptions`
    - इनपुट पथ: मल्टीपार्ट ऑडियो फ़ाइल अपलोड
    - OpenClaw द्वारा वहां समर्थित जहां भी इनबाउंड ऑडियो ट्रांसक्रिप्शन
      `tools.media.audio` का उपयोग करता है, जिसमें Discord वॉइस-चैनल सेगमेंट और चैनल
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

    भाषा और प्रॉम्प्ट संकेत OpenAI को आगे भेजे जाते हैं जब वे साझा
    ऑडियो मीडिया कॉन्फ़िग या प्रति-कॉल ट्रांसक्रिप्शन अनुरोध द्वारा प्रदान किए जाते हैं।

  </Accordion>

  <Accordion title="रीयलटाइम ट्रांसक्रिप्शन">
    बंडल किया गया `openai` Plugin Voice Call Plugin के लिए रीयलटाइम ट्रांसक्रिप्शन पंजीकृत करता है।

    | सेटिंग | कॉन्फ़िग पथ | डिफ़ॉल्ट |
    |---------|------------|---------|
    | मॉडल | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | भाषा | `...openai.language` | (अनसेट) |
    | प्रॉम्प्ट | `...openai.prompt` | (अनसेट) |
    | मौन अवधि | `...openai.silenceDurationMs` | `800` |
    | VAD थ्रेशहोल्ड | `...openai.vadThreshold` | `0.5` |
    | प्रमाणीकरण | `...openai.apiKey`, `OPENAI_API_KEY`, या `openai` OAuth | API कुंजियां सीधे कनेक्ट करती हैं; OAuth रीयलटाइम ट्रांसक्रिप्शन क्लाइंट सीक्रेट जारी करता है |

    <Note>
    G.711 u-law (`g711_ulaw` / `audio/pcmu`) ऑडियो के साथ `wss://api.openai.com/v1/realtime` पर WebSocket कनेक्शन का उपयोग करता है। जब केवल `openai` OAuth कॉन्फ़िगर होता है, तो Gateway WebSocket खोलने से पहले एक अल्पकालिक रीयलटाइम ट्रांसक्रिप्शन क्लाइंट सीक्रेट जारी करता है। यह स्ट्रीमिंग प्रदाता Voice Call के रीयलटाइम ट्रांसक्रिप्शन पथ के लिए है; Discord वॉइस वर्तमान में छोटे सेगमेंट रिकॉर्ड करता है और इसके बजाय बैच `tools.media.audio` ट्रांसक्रिप्शन पथ का उपयोग करता है।
    </Note>

  </Accordion>

  <Accordion title="रीयलटाइम वॉइस">
    बंडल किया गया `openai` Plugin Voice Call Plugin के लिए रीयलटाइम वॉइस पंजीकृत करता है।

    | सेटिंग | कॉन्फ़िग पथ | डिफ़ॉल्ट |
    |---------|------------|---------|
    | मॉडल | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-2` |
    | आवाज़ | `...openai.voice` | `alloy` |
    | तापमान (Azure डिप्लॉयमेंट ब्रिज) | `...openai.temperature` | `0.8` |
    | VAD थ्रेशोल्ड | `...openai.vadThreshold` | `0.5` |
    | मौन अवधि | `...openai.silenceDurationMs` | `500` |
    | प्रीफ़िक्स पैडिंग | `...openai.prefixPaddingMs` | `300` |
    | रीजनिंग प्रयास | `...openai.reasoningEffort` | (सेट नहीं) |
    | प्रमाणीकरण | `openai` API-key प्रमाणीकरण प्रोफ़ाइल, `...openai.apiKey`, या `OPENAI_API_KEY` | OpenAI Platform API कुंजी आवश्यक है; OpenAI OAuth Realtime आवाज़ कॉन्फ़िगर नहीं करता |

    `gpt-realtime-2` के लिए उपलब्ध बिल्ट-इन Realtime आवाज़ें: `alloy`, `ash`,
    `ballad`, `coral`, `echo`, `sage`, `shimmer`, `verse`, `marin`, `cedar`.
    OpenAI सर्वोत्तम Realtime गुणवत्ता के लिए `marin` और `cedar` की सिफ़ारिश करता है। यह
    ऊपर दी गई टेक्स्ट-टू-स्पीच आवाज़ों से अलग सेट है; यह न मानें कि `fable`, `nova`,
    या `onyx` जैसी TTS आवाज़ Realtime सत्रों के लिए मान्य है।

    <Note>
    बैकएंड OpenAI realtime ब्रिज GA Realtime WebSocket सत्र आकार का उपयोग करते हैं, जो `session.temperature` स्वीकार नहीं करता। Azure OpenAI डिप्लॉयमेंट `azureEndpoint` और `azureDeployment` के माध्यम से उपलब्ध रहते हैं और डिप्लॉयमेंट-संगत सत्र आकार बनाए रखते हैं। द्विदिश टूल कॉलिंग और G.711 u-law ऑडियो का समर्थन करता है।
    </Note>

    <Note>
    Realtime आवाज़ तब चुनी जाती है जब सत्र बनाया जाता है। OpenAI बाद में अधिकांश
    सत्र फ़ील्ड बदलने की अनुमति देता है, लेकिन उस सत्र में मॉडल द्वारा ऑडियो उत्सर्जित
    करने के बाद आवाज़ नहीं बदली जा सकती। OpenClaw अभी बिल्ट-इन Realtime
    आवाज़ ids को स्ट्रिंग के रूप में प्रदर्शित करता है।
    </Note>

    <Note>
    Control UI Talk Gateway द्वारा minted
    ephemeral क्लाइंट सीक्रेट और OpenAI Realtime API के विरुद्ध सीधे ब्राउज़र WebRTC SDP एक्सचेंज
    के साथ OpenAI ब्राउज़र realtime सत्रों का उपयोग करता है। Gateway उस क्लाइंट सीक्रेट को चुनी गई
    `openai` API-key प्रमाणीकरण प्रोफ़ाइल या कॉन्फ़िगर की गई OpenAI Platform API कुंजी के साथ mint करता है। Gateway
    relay और Voice Call बैकएंड realtime WebSocket ब्रिज नेटिव OpenAI endpoints के लिए वही
    केवल-API-key प्रमाणीकरण पथ उपयोग करते हैं। Maintainer live
    सत्यापन इसके साथ उपलब्ध है
    `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`;
    OpenAI legs secrets लॉग किए बिना बैकएंड WebSocket ब्रिज और ब्राउज़र
    WebRTC SDP एक्सचेंज, दोनों सत्यापित करते हैं।
    </Note>

  </Accordion>
</AccordionGroup>

## Azure OpenAI endpoints

बंडल किया गया `openai` provider बेस URL को override करके image
generation के लिए Azure OpenAI resource को target कर सकता है। image-generation पथ पर, OpenClaw
`models.providers.openai.baseUrl` पर Azure hostnames का पता लगाता है और
स्वचालित रूप से Azure के request shape पर स्विच करता है।

<Note>
Realtime आवाज़ एक अलग कॉन्फ़िगरेशन पथ
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
का उपयोग करती है और `models.providers.openai.baseUrl` से प्रभावित नहीं होती। उसकी Azure
settings के लिए [आवाज़ और speech](#voice-and-speech) के अंतर्गत **Realtime
आवाज़** accordion देखें।
</Note>

Azure OpenAI का उपयोग तब करें जब:

- आपके पास पहले से Azure OpenAI subscription, quota, या enterprise agreement हो
- आपको Azure द्वारा दिए जाने वाले regional data residency या compliance controls चाहिए
- आप traffic को मौजूदा Azure tenancy के भीतर रखना चाहते हों

### कॉन्फ़िगरेशन

बंडल किए गए `openai` provider के माध्यम से Azure image generation के लिए,
`models.providers.openai.baseUrl` को अपने Azure resource पर point करें और `apiKey` को
Azure OpenAI key पर सेट करें (OpenAI Platform key नहीं):

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
route के लिए इन Azure host suffixes को पहचानता है:

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

पहचाने गए Azure host पर image-generation requests के लिए, OpenClaw:

- `Authorization: Bearer` के बजाय `api-key` header भेजता है
- deployment-scoped paths (`/openai/deployments/{deployment}/...`) का उपयोग करता है
- प्रत्येक request में `?api-version=...` जोड़ता है
- Azure image-generation calls के लिए 600s default request timeout का उपयोग करता है।
  प्रति-call `timeoutMs` values अब भी इस default को override करती हैं।

अन्य base URLs (public OpenAI, OpenAI-compatible proxies) standard
OpenAI image request shape बनाए रखते हैं।

<Note>
`openai` provider के image-generation पथ के लिए Azure routing को
OpenClaw 2026.4.22 या बाद का संस्करण चाहिए। पुराने संस्करण किसी भी custom
`openai.baseUrl` को public OpenAI endpoint की तरह treat करते हैं और Azure
image deployments के विरुद्ध fail होंगे।
</Note>

### API version

Azure image-generation पथ के लिए किसी specific Azure preview या GA version
को pin करने के लिए `AZURE_OPENAI_API_VERSION` सेट करें:

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

जब variable unset हो, default `2024-12-01-preview` है।

### मॉडल नाम deployment names होते हैं

Azure OpenAI models को deployments से bind करता है। बंडल किए गए `openai` provider
के माध्यम से routed Azure image-generation requests के लिए, OpenClaw में `model` field
**Azure deployment name** होना चाहिए जिसे आपने Azure portal में कॉन्फ़िगर किया है,
public OpenAI model id नहीं।

यदि आप `gpt-image-2-prod` नाम का deployment बनाते हैं जो `gpt-image-2` serve करता है:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

यही deployment-name rule बंडल किए गए `openai` provider के माध्यम से routed
image-generation calls पर लागू होता है।

### क्षेत्रीय उपलब्धता

Azure image generation अभी केवल regions के subset में उपलब्ध है
(उदाहरण के लिए `eastus2`, `swedencentral`, `polandcentral`, `westus3`,
`uaenorth`)। deployment बनाने से पहले Microsoft की वर्तमान region list देखें,
और पुष्टि करें कि specific model आपके region में उपलब्ध है।

### पैरामीटर अंतर

Azure OpenAI और public OpenAI हमेशा वही image parameters स्वीकार नहीं करते।
Azure उन options को reject कर सकता है जिनकी public OpenAI अनुमति देता है (उदाहरण के लिए
`gpt-image-2` पर कुछ `background` values) या उन्हें केवल specific model
versions पर expose कर सकता है। ये अंतर Azure और underlying model से आते हैं,
OpenClaw से नहीं। यदि Azure request validation error के साथ fail होती है, तो
Azure portal में अपने specific deployment और API version द्वारा supported
parameter set देखें।

<Note>
Azure OpenAI native transport और compat behavior का उपयोग करता है लेकिन
OpenClaw के hidden attribution headers प्राप्त नहीं करता — [उन्नत कॉन्फ़िगरेशन](#advanced-configuration)
के अंतर्गत **Native vs OpenAI-compatible
routes** accordion देखें।

Azure पर chat या Responses traffic के लिए (image generation से परे), onboarding
flow या dedicated Azure provider config का उपयोग करें — केवल `openai.baseUrl`
Azure API/auth shape नहीं चुनता। एक अलग
`azure-openai-responses/*` provider मौजूद है; नीचे Server-side compaction accordion देखें।
</Note>

## उन्नत कॉन्फ़िगरेशन

<AccordionGroup>
  <Accordion title="Transport (WebSocket vs SSE)">
    OpenClaw `openai/*` के लिए SSE fallback (`"auto"`) के साथ WebSocket-first उपयोग करता है।

    `"auto"` mode में, OpenClaw:
    - SSE पर fallback करने से पहले एक शुरुआती WebSocket failure को retry करता है
    - failure के बाद, WebSocket को ~60 seconds के लिए degraded mark करता है और cool-down के दौरान SSE उपयोग करता है
    - retries और reconnects के लिए stable session और turn identity headers attach करता है
    - transport variants में usage counters (`input_tokens` / `prompt_tokens`) normalize करता है

    | मान | व्यवहार |
    |-------|----------|
    | `"auto"` (डिफ़ॉल्ट) | पहले WebSocket, SSE fallback |
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

    enabled होने पर, OpenClaw fast mode को OpenAI priority processing (`service_tier = "priority"`) पर map करता है। मौजूदा `service_tier` values preserved रहती हैं, और fast mode `reasoning` या `text.verbosity` को rewrite नहीं करता। `fastMode: "auto"` auto cutoff तक नए model calls को fast start करता है, फिर बाद के retry, fallback, tool-result, या continuation calls को fast mode के बिना start करता है। cutoff default 60 seconds है; इसे बदलने के लिए active model पर `params.fastAutoOnSeconds` सेट करें।

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
    Session overrides config पर प्राथमिकता लेते हैं। Sessions UI में session override clear करने से session configured default पर लौट आता है।
    </Note>

  </Accordion>

  <Accordion title="Priority processing (service_tier)">
    OpenAI की API `service_tier` के माध्यम से priority processing expose करती है। इसे OpenClaw में प्रति model सेट करें:

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
    `serviceTier` केवल native OpenAI endpoints (`api.openai.com`) और native Codex endpoints (`chatgpt.com/backend-api`) पर forward किया जाता है। यदि आप किसी भी provider को proxy के माध्यम से route करते हैं, तो OpenClaw `service_tier` को untouched छोड़ता है।
    </Warning>

  </Accordion>

  <Accordion title="Server-side compaction (Responses API)">
    direct OpenAI Responses models (`api.openai.com` पर `openai/*`) के लिए, OpenAI Plugin का OpenClaw stream wrapper server-side compaction को auto-enable करता है:

    - `store: true` force करता है (जब तक model compat `supportsStore: false` सेट न करे)
    - `context_management: [{ type: "compaction", compact_threshold: ... }]` inject करता है
    - Default `compact_threshold`: `contextWindow` का 70% (या unavailable होने पर `80000`)

    यह built-in OpenClaw runtime path और embedded runs द्वारा उपयोग किए गए OpenAI provider hooks पर लागू होता है। native Codex app-server harness Codex के माध्यम से अपना context manage करता है और OpenAI के default agent route या provider/model runtime policy द्वारा configured होता है।

    <Tabs>
      <Tab title="स्पष्ट रूप से enable करें">
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
    `responsesServerCompaction` केवल `context_management` injection को control करता है। direct OpenAI Responses models अब भी `store: true` force करते हैं, जब तक compat `supportsStore: false` सेट न करे।
    </Note>

  </Accordion>

  <Accordion title="Strict-agentic GPT मोड">
    `openai/*` पर GPT-5-फ़ैमिली रन के लिए, OpenClaw एक अधिक सख्त एम्बेडेड निष्पादन अनुबंध का उपयोग कर सकता है:

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
    - महत्वपूर्ण काम के लिए `update_plan` को अपने-आप सक्षम करता है
    - संरचनात्मक रूप से खाली या केवल-रीज़निंग वाले टर्न को दृश्य-उत्तर निरंतरता के साथ फिर से आज़माता है
    - चयनित हार्नेस द्वारा उपलब्ध कराए जाने पर स्पष्ट हार्नेस प्लान इवेंट का उपयोग करता है

    OpenClaw यह तय करने के लिए असिस्टेंट गद्य को वर्गीकृत नहीं करता कि कोई टर्न प्लान, प्रगति अपडेट या अंतिम उत्तर है।

    <Note>
    केवल OpenAI और Codex GPT-5-फ़ैमिली रन तक सीमित। अन्य प्रदाता और पुराने मॉडल परिवार डिफ़ॉल्ट व्यवहार बनाए रखते हैं।
    </Note>

  </Accordion>

  <Accordion title="नेटिव बनाम OpenAI-compatible रूट">
    OpenClaw सीधे OpenAI, Codex और Azure OpenAI एंडपॉइंट को सामान्य OpenAI-compatible `/v1` प्रॉक्सी से अलग मानता है:

    **नेटिव रूट** (`openai/*`, Azure OpenAI):
    - केवल उन मॉडल के लिए `reasoning: { effort: "none" }` रखता है जो OpenAI `none` effort का समर्थन करते हैं
    - उन मॉडल या प्रॉक्सी के लिए अक्षम reasoning को छोड़ देता है जो `reasoning.effort: "none"` को अस्वीकार करते हैं
    - टूल स्कीमा को डिफ़ॉल्ट रूप से strict मोड में रखता है
    - केवल सत्यापित नेटिव होस्ट पर छिपे हुए attribution हेडर जोड़ता है
    - OpenAI-only अनुरोध आकार-निर्धारण (`service_tier`, `store`, reasoning-compat, prompt-cache hints) बनाए रखता है

    **प्रॉक्सी/compatible रूट:**
    - अधिक ढीला compat व्यवहार उपयोग करते हैं
    - non-native `openai-completions` पेलोड से Completions `store` हटाते हैं
    - OpenAI-compatible Completions प्रॉक्सी के लिए उन्नत `params.extra_body`/`params.extraBody` pass-through JSON स्वीकार करते हैं
    - vLLM जैसे OpenAI-compatible Completions प्रॉक्सी के लिए `params.chat_template_kwargs` स्वीकार करते हैं
    - strict टूल स्कीमा या native-only हेडर बाध्य नहीं करते

    Azure OpenAI नेटिव ट्रांसपोर्ट और compat व्यवहार का उपयोग करता है, लेकिन उसे छिपे हुए attribution हेडर नहीं मिलते।

  </Accordion>
</AccordionGroup>

## संबंधित

<CardGroup cols={2}>
  <Card title="मॉडल चयन" href="/hi/concepts/model-providers" icon="layers">
    प्रदाता, मॉडल refs और failover व्यवहार चुनना।
  </Card>
  <Card title="छवि जनरेशन" href="/hi/tools/image-generation" icon="image">
    साझा छवि टूल पैरामीटर और प्रदाता चयन।
  </Card>
  <Card title="वीडियो जनरेशन" href="/hi/tools/video-generation" icon="video">
    साझा वीडियो टूल पैरामीटर और प्रदाता चयन।
  </Card>
  <Card title="OAuth और auth" href="/hi/gateway/authentication" icon="key">
    auth विवरण और credential पुनः उपयोग नियम।
  </Card>
</CardGroup>
