---
read_when:
    - आप OpenClaw, Codex, ACP या किसी अन्य नेटिव एजेंट रनटाइम में से चुन रहे हैं
    - आप status या config में provider/model/runtime लेबल से भ्रमित हैं
    - आप किसी नेटिव हार्नेस के लिए समर्थन समानता का दस्तावेज़ीकरण कर रहे हैं
summary: OpenClaw मॉडल प्रदाताओं, मॉडलों, चैनलों और एजेंट रनटाइम्स को कैसे अलग करता है
title: एजेंट रनटाइम
x-i18n:
    generated_at: "2026-06-28T22:55:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fb818e682ffb11a073ee0053c0e7b7e2ea60239141aab7f96cd82520ded9d22f
    source_path: concepts/agent-runtimes.md
    workflow: 16
---

एक **एजेंट रनटाइम** वह घटक है जो एक तैयार मॉडल लूप का स्वामी होता है: यह
प्रॉम्प्ट प्राप्त करता है, मॉडल आउटपुट चलाता है, नेटिव टूल कॉल संभालता है, और
पूरा हुआ टर्न OpenClaw को लौटाता है.

रनटाइम को providers के साथ भ्रमित करना आसान है, क्योंकि दोनों मॉडल
कॉन्फ़िगरेशन के पास दिखाई देते हैं. ये अलग-अलग परतें हैं:

| परत          | उदाहरण                                      | इसका अर्थ                                                            |
| ------------- | -------------------------------------------- | ------------------------------------------------------------------- |
| Provider      | `openai`, `anthropic`, `github-copilot`      | OpenClaw कैसे प्रमाणित करता है, मॉडल खोजता है, और मॉडल refs को नाम देता है. |
| मॉडल         | `gpt-5.5`, `claude-opus-4-6`                 | एजेंट टर्न के लिए चुना गया मॉडल.                              |
| एजेंट रनटाइम | `openclaw`, `codex`, `copilot`, `claude-cli` | निम्न-स्तरीय लूप या backend जो तैयार टर्न निष्पादित करता है.      |
| चैनल        | Telegram, Discord, Slack, WhatsApp           | जहां संदेश OpenClaw में आते और बाहर जाते हैं.                            |

आपको कोड में **harness** शब्द भी दिखाई देगा. harness वह implementation है
जो एजेंट रनटाइम उपलब्ध कराता है. उदाहरण के लिए, bundled Codex harness
`codex` रनटाइम लागू करता है. सार्वजनिक config provider या model entries पर
`agentRuntime.id` का उपयोग करता है; पूरे-एजेंट runtime keys legacy हैं और अनदेखे किए जाते हैं.
`openclaw doctor --fix` पुराने पूरे-एजेंट runtime pins हटाता है और जहां ज़रूरत हो
legacy runtime model refs को canonical provider/model refs और model-scoped
runtime policy में फिर से लिखता है.

दो runtime families हैं:

- **Embedded harnesses** OpenClaw के तैयार agent loop के अंदर चलते हैं. आज इसमें
  built-in `openclaw` runtime और registered plugin harnesses जैसे
  `codex` और `copilot` शामिल हैं.
- **CLI backends** model ref को canonical रखते हुए स्थानीय CLI process चलाते हैं.
  उदाहरण के लिए, `anthropic/claude-opus-4-8` के साथ
  model-scoped `agentRuntime.id: "claude-cli"` का अर्थ है "Anthropic
  मॉडल चुनें, Claude CLI के माध्यम से execute करें." `claude-cli` embedded harness id नहीं है
  और इसे AgentHarness selection को नहीं दिया जाना चाहिए.

`copilot` harness GitHub Copilot CLI के लिए अलग, opt-in external plugin harness है;
PI, Codex, और GitHub Copilot agent runtime के बीच user-facing decision के लिए
[GitHub Copilot agent runtime](/hi/plugins/copilot) देखें.

## Codex surfaces

अधिकांश भ्रम Codex नाम साझा करने वाली कई अलग-अलग surfaces से आता है:

| Surface                                          | OpenClaw नाम/config                 | यह क्या करता है                                                                                                   |
| ------------------------------------------------ | ------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| Native Codex app-server runtime                  | `openai/*` model refs                | Codex app-server के माध्यम से OpenAI embedded agent turns चलाता है. यह सामान्य ChatGPT/Codex subscription setup है. |
| Codex OAuth auth profiles                        | `openai` OAuth profiles              | ChatGPT/Codex subscription auth संग्रहीत करता है जिसे Codex app-server harness consume करता है.                             |
| Codex ACP adapter                                | `runtime: "acp"`, `agentId: "codex"` | external ACP/acpx control plane के माध्यम से Codex चलाता है. केवल तब उपयोग करें जब ACP/acpx स्पष्ट रूप से मांगा गया हो.            |
| Native Codex chat-control command set            | `/codex ...`                         | chat से Codex app-server threads को bind, resume, steer, stop, और inspect करता है.                                |
| non-agent surfaces के लिए OpenAI Platform API route | `openai/*` plus API-key auth         | images, embeddings, speech, और realtime जैसे direct OpenAI APIs के लिए उपयोग किया जाता है.                                  |

ये surfaces जानबूझकर स्वतंत्र हैं. `codex` plugin enable करने से
native app-server features उपलब्ध हो जाते हैं; `openclaw doctor --fix` legacy
legacy Codex route repair और stale session pin cleanup का स्वामी है. किसी agent model के लिए
`openai/*` चुनने का अब अर्थ है "इसे Codex के माध्यम से चलाएं", जब तक कि कोई
non-agent OpenAI API surface उपयोग में न हो.

सामान्य ChatGPT/Codex subscription setup auth के लिए Codex OAuth का उपयोग करता है, लेकिन
model ref को `openai/*` रखता है और `codex` runtime चुनता है:

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
    },
  },
}
```

इसका अर्थ है कि OpenClaw एक OpenAI model ref चुनता है, फिर Codex app-server
runtime से embedded agent turn चलाने को कहता है. इसका अर्थ "API billing का उपयोग करें" नहीं है, और
इसका अर्थ यह नहीं है कि channel, model provider catalog, या OpenClaw session store
Codex बन जाता है.

जब bundled `codex` plugin enabled हो, natural-language Codex control को
ACP के बजाय native `/codex` command surface (`/codex bind`, `/codex threads`,
`/codex resume`, `/codex steer`, `/codex stop`) का उपयोग करना चाहिए. Codex के लिए ACP
केवल तब उपयोग करें जब user स्पष्ट रूप से ACP/acpx मांगे या ACP
adapter path test कर रहा हो. Claude Code, Gemini CLI, OpenCode, Cursor, और समान external
harnesses अभी भी ACP का उपयोग करते हैं.

यह agent-facing decision tree है:

1. यदि user **Codex bind/control/thread/resume/steer/stop** मांगता है, तो bundled `codex` plugin enabled होने पर
   native `/codex` command surface का उपयोग करें.
2. यदि user **Codex as the embedded runtime** मांगता है या सामान्य
   subscription-backed Codex agent experience चाहता है, तो `openai/<model>` का उपयोग करें.
3. यदि user स्पष्ट रूप से **OpenClaw for an OpenAI model** चुनता है, तो model ref
   को `openai/<model>` रखें और provider/model runtime policy को
   `agentRuntime.id: "openclaw"` पर set करें. चुनी गई `openai` OAuth profile को
   internally OpenClaw के Codex-auth transport के माध्यम से route किया जाता है.
4. यदि legacy config में अभी भी **legacy Codex model refs** हैं, तो इसे
   `openai/<model>` में `openclaw doctor --fix` के साथ repair करें; doctor पुराने model ref से implied होने पर
   provider/model-scoped `agentRuntime.id: "codex"` जोड़कर Codex auth
   route बनाए रखता है.
   Legacy **`codex-cli/*` model refs** उसी `openai/<model>` Codex
   app-server route में repair होते हैं; OpenClaw अब bundled Codex CLI backend नहीं रखता.
5. यदि user स्पष्ट रूप से **ACP**, **acpx**, या **Codex ACP adapter** कहता है, तो
   `runtime: "acp"` और `agentId: "codex"` के साथ ACP का उपयोग करें.
6. यदि request **Claude Code, Gemini CLI, OpenCode, Cursor, Droid, या
   किसी अन्य external harness** के लिए है, तो native sub-agent runtime नहीं, ACP/acpx का उपयोग करें.

| आपका मतलब है...                        | उपयोग करें...                                  |
| --------------------------------------- | -------------------------------------------- |
| Codex app-server chat/thread control    | bundled `codex` plugin से `/codex ...` |
| Codex app-server embedded agent runtime | `openai/*` agent model refs                  |
| OpenAI Codex OAuth                      | `openai` OAuth profiles                      |
| Claude Code या अन्य external harness   | ACP/acpx                                     |

OpenAI-family prefix split के लिए, [OpenAI](/hi/providers/openai) और
[Model providers](/hi/concepts/model-providers) देखें. Codex runtime support
contract के लिए, [Codex harness runtime](/hi/plugins/codex-harness-runtime#v1-support-contract) देखें.

## Runtime ownership

अलग-अलग runtimes loop के अलग-अलग हिस्सों के स्वामी होते हैं.

| Surface                     | OpenClaw embedded                             | Codex app-server                                                            |
| --------------------------- | --------------------------------------------- | --------------------------------------------------------------------------- |
| Model loop owner            | OpenClaw embedded runner के माध्यम से OpenClaw | Codex app-server                                                            |
| Canonical thread state      | OpenClaw transcript                           | Codex thread, साथ में OpenClaw transcript mirror                               |
| OpenClaw dynamic tools      | Native OpenClaw tool loop                     | Codex adapter के माध्यम से bridged                                           |
| Native shell and file tools | OpenClaw path                                 | Codex-native tools, समर्थित होने पर native hooks के माध्यम से bridged            |
| Context engine              | Native OpenClaw context assembly              | OpenClaw projects context को Codex turn में assemble करता है                     |
| Compaction                  | OpenClaw या selected context engine           | Codex-native compaction, OpenClaw notifications और mirror maintenance के साथ |
| Channel delivery            | OpenClaw                                      | OpenClaw                                                                    |

यह ownership split मुख्य design rule है:

- यदि OpenClaw surface का स्वामी है, तो OpenClaw सामान्य plugin hook behavior उपलब्ध करा सकता है.
- यदि native runtime surface का स्वामी है, तो OpenClaw को runtime events या native hooks चाहिए.
- यदि native runtime canonical thread state का स्वामी है, तो OpenClaw को context mirror और project करना चाहिए, unsupported internals फिर से नहीं लिखने चाहिए.

## Runtime selection

OpenClaw provider और model resolution के बाद embedded runtime चुनता है:

1. Model-scoped runtime policy जीतती है. यह configured provider
   model entry में या `agents.defaults.models["provider/model"].agentRuntime` /
   `agents.list[].models["provider/model"].agentRuntime` में रह सकती है. `agents.defaults.models["vllm/*"].agentRuntime` जैसा provider wildcard exact
   model policy के बाद लागू होता है, ताकि dynamically discovered provider models एक
   runtime share कर सकें बिना exact per-model exceptions override किए.
2. Provider-scoped runtime policy अगली आती है
   `models.providers.<provider>.agentRuntime` पर.
3. `auto` mode में, registered plugin runtimes supported provider/model
   pairs claim कर सकते हैं.
4. यदि `auto` mode में कोई runtime turn claim नहीं करता, तो OpenClaw
   compatibility runtime के रूप में `openclaw` का उपयोग करता है. जब run strict होना चाहिए,
   explicit runtime id का उपयोग करें.

Whole-session और whole-agent runtime pins अनदेखे किए जाते हैं. इसमें
`OPENCLAW_AGENT_RUNTIME`, session `agentHarnessId`/`agentRuntimeOverride` state,
`agents.defaults.agentRuntime`, और `agents.list[].agentRuntime` शामिल हैं. stale whole-agent runtime config हटाने और
जहां OpenClaw intent preserve कर सकता है वहां legacy runtime model refs convert करने के लिए
`openclaw doctor --fix` चलाएं.

Explicit provider/model plugin runtimes fail closed करते हैं. उदाहरण के लिए,
provider या model पर `agentRuntime.id: "codex"` का अर्थ Codex या स्पष्ट
selection/runtime error है; इसे कभी भी चुपचाप वापस OpenClaw को route नहीं किया जाता.

CLI backend aliases embedded harness ids से अलग हैं. Preferred
Claude CLI form यह है:

```json5
{
  agents: {
    defaults: {
      model: "anthropic/claude-opus-4-8",
      models: {
        "anthropic/claude-opus-4-8": {
          agentRuntime: { id: "claude-cli" },
        },
      },
    },
  },
}
```

`claude-cli/claude-opus-4-7` जैसे legacy refs compatibility के लिए supported रहते हैं,
लेकिन नई config को provider/model canonical रखना चाहिए और execution backend को
provider/model runtime policy में रखना चाहिए.

Legacy `codex-cli/*` refs अलग हैं: doctor उन्हें `openai/*` में migrate करता है ताकि
वे Codex CLI backend preserve करने के बजाय Codex app-server harness के माध्यम से चलें.

`auto` mode अधिकांश providers के लिए जानबूझकर conservative है. OpenAI agent
models exception हैं: unset runtime और `auto` दोनों Codex
harness में resolve होते हैं. Explicit OpenClaw runtime config
`openai/*` agent turns के लिए opt-in compatibility route बनी रहती है; जब इसे चुनी हुई `openai` OAuth profile के साथ pair किया जाता है,
OpenClaw उस path को internally Codex-auth transport के माध्यम से route करता है जबकि
public model ref को `openai/*` रखता है. Stale OpenAI runtime session pins
runtime selection द्वारा अनदेखे किए जाते हैं और `openclaw doctor --fix` से साफ किए जा सकते हैं.

यदि `openclaw doctor` चेतावनी देता है कि `codex` Plugin सक्षम है जबकि
लेगेसी Codex मॉडल रेफ config में बने हुए हैं, तो इसे लेगेसी रूट अवस्था मानें। इसे Codex रनटाइम के साथ
`openai/*` में फिर से लिखने के लिए `openclaw doctor --fix` चलाएं।

## GitHub Copilot एजेंट रनटाइम

बाहरी `@openclaw/copilot` Plugin एक वैकल्पिक `copilot` रनटाइम पंजीकृत करता है
जो GitHub Copilot CLI (`@github/copilot-sdk`) पर आधारित है। यह
कैननिकल सब्सक्रिप्शन `github-copilot` प्रदाता का दावा करता है और `auto` द्वारा **कभी** चयनित नहीं होता।
`agentRuntime.id` के जरिए प्रति-मॉडल या प्रति-प्रदाता विकल्प चुनें:

```json5
{
  agents: {
    defaults: {
      model: "github-copilot/gpt-5.5",
      models: {
        "github-copilot/gpt-5.5": {
          agentRuntime: { id: "copilot" },
        },
      },
    },
  },
}
```

हार्नेस अपने प्रदाता, रनटाइम, CLI सेशन कुंजी, और auth प्रोफाइल
उपसर्ग का दावा `extensions/copilot/doctor-contract-api.ts` में करता है, जिसे
`openclaw doctor` स्वतः लोड करता है। कॉन्फ़िगरेशन, auth, ट्रांसक्रिप्ट मिररिंग,
Compaction, घोषणात्मक doctor अनुबंध, और व्यापक PI बनाम Codex बनाम
Copilot SDK निर्णय के लिए, [GitHub Copilot एजेंट रनटाइम](/hi/plugins/copilot) देखें।

## संगतता अनुबंध

जब कोई रनटाइम OpenClaw नहीं होता, तो उसे दस्तावेज़ित करना चाहिए कि वह किन OpenClaw सतहों का समर्थन करता है।
रनटाइम दस्तावेज़ों के लिए यह आकार इस्तेमाल करें:

| प्रश्न                               | यह क्यों महत्वपूर्ण है                                                                                    |
| -------------------------------------- | ------------------------------------------------------------------------------------------------- |
| मॉडल लूप का स्वामी कौन है?               | यह निर्धारित करता है कि retries, टूल continuation, और अंतिम उत्तर के निर्णय कहां होते हैं।                   |
| कैननिकल थ्रेड इतिहास का स्वामी कौन है?     | यह निर्धारित करता है कि OpenClaw इतिहास को संपादित कर सकता है या केवल उसे मिरर कर सकता है।                                   |
| क्या OpenClaw डायनेमिक टूल काम करते हैं?        | मैसेजिंग, सेशन, cron, और OpenClaw-स्वामित्व वाले टूल इस पर निर्भर करते हैं।                                 |
| क्या डायनेमिक टूल hooks काम करते हैं?            | Plugins OpenClaw-स्वामित्व वाले टूल के आसपास `before_tool_call`, `after_tool_call`, और middleware की अपेक्षा करते हैं। |
| क्या नेटिव टूल hooks काम करते हैं?             | Shell, patch, और रनटाइम-स्वामित्व वाले टूल को नीति और अवलोकन के लिए नेटिव hook समर्थन चाहिए।        |
| क्या context engine lifecycle चलता है? | Memory और context Plugins assemble, ingest, after-turn, और Compaction lifecycle पर निर्भर करते हैं।      |
| कौन सा Compaction डेटा उजागर होता है?       | कुछ Plugins को केवल सूचनाएं चाहिए होती हैं, जबकि दूसरों को रखे/छोड़े गए metadata की जरूरत होती है।                    |
| क्या जानबूझकर असमर्थित है?     | उपयोगकर्ताओं को वहां OpenClaw समानता नहीं माननी चाहिए जहां नेटिव रनटाइम अधिक अवस्था का स्वामी है।            |

Codex रनटाइम समर्थन अनुबंध
[Codex हार्नेस रनटाइम](/hi/plugins/codex-harness-runtime#v1-support-contract) में दस्तावेज़ित है।

## स्थिति लेबल

स्थिति आउटपुट `Execution` और `Runtime` दोनों लेबल दिखा सकता है। इन्हें
diagnostics के रूप में पढ़ें, प्रदाता नामों के रूप में नहीं।

- `openai/gpt-5.5` जैसा मॉडल रेफ आपको चयनित प्रदाता/मॉडल बताता है।
- `codex` जैसी रनटाइम id आपको बताती है कि कौन सा लूप turn निष्पादित कर रहा है।
- Telegram या Discord जैसा चैनल लेबल आपको बताता है कि बातचीत कहां हो रही है।

यदि कोई run अब भी अप्रत्याशित रनटाइम दिखाता है, तो पहले चयनित प्रदाता/मॉडल
रनटाइम नीति की जांच करें। लेगेसी सेशन रनटाइम pins अब routing तय नहीं करते।

## संबंधित

- [Codex हार्नेस](/hi/plugins/codex-harness)
- [Codex हार्नेस रनटाइम](/hi/plugins/codex-harness-runtime)
- [GitHub Copilot एजेंट रनटाइम](/hi/plugins/copilot)
- [OpenAI](/hi/providers/openai)
- [एजेंट हार्नेस Plugins](/hi/plugins/sdk-agent-harness)
- [एजेंट लूप](/hi/concepts/agent-loop)
- [मॉडल](/hi/concepts/models)
- [स्थिति](/hi/cli/status)
