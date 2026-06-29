---
read_when:
    - आप OpenClaw में Anthropic मॉडल का उपयोग करना चाहते हैं
summary: OpenClaw में API कुंजियों या Claude CLI के माध्यम से Anthropic Claude का उपयोग करें
title: Anthropic
x-i18n:
    generated_at: "2026-06-28T23:55:55Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 48a2792e464175b3ebe6acd92606c20231fd31940f56e2432bb45657eb0a68d7
    source_path: providers/anthropic.md
    workflow: 16
---

Anthropic **Claude** मॉडल परिवार बनाता है। OpenClaw दो auth routes का समर्थन करता है:

- **API key** — usage-based billing के साथ सीधे Anthropic API access (`anthropic/*` models)
- **Claude CLI** — उसी host पर मौजूदा Claude Code login का पुनः उपयोग

<Warning>
OpenClaw का Claude CLI backend installed Claude Code CLI को
non-interactive print mode में चलाता है। Anthropic के मौजूदा Claude Code docs
`claude -p` को Agent SDK/programmatic usage के रूप में बताते हैं। Anthropic के 15 जून, 2026 support
update ने घोषित Agent SDK billing change को रोक दिया। फिलहाल, Anthropic कहता है कि
Claude Agent SDK, `claude -p`, और third-party app usage अभी भी
subscription की usage limits से draw करते हैं। पहले घोषित monthly Agent SDK credit
Anthropic द्वारा उस plan को revise करते समय उपलब्ध नहीं है।

Interactive Claude Code अभी भी signed-in Claude plan limits से draw करता है। API
key auth direct pay-as-you-go API billing ही रहता है। लंबे समय तक चलने वाले gateway hosts,
shared automation, और predictable production spend के लिए Anthropic API key का उपयोग करें।

subscription billing behavior पर निर्भर करने से पहले Anthropic के मौजूदा support articles देखें:

- [Claude Code CLI reference](https://code.claude.com/docs/en/cli-usage)
- [Use the Claude Agent SDK with your Claude plan](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan)
- [Use Claude Code with your Pro or Max plan](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan)
- [Use Claude Code with your Team or Enterprise plan](https://support.claude.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan)
- [Manage Claude Code costs](https://code.claude.com/docs/en/costs)

</Warning>

## शुरू करना

<Tabs>
  <Tab title="API key">
    **इसके लिए सर्वोत्तम:** standard API access और usage-based billing.

    <Steps>
      <Step title="अपनी API key प्राप्त करें">
        [Anthropic Console](https://console.anthropic.com/) में API key बनाएं।
      </Step>
      <Step title="onboarding चलाएं">
        ```bash
        openclaw onboard
        # choose: Anthropic API key
        ```

        या key को सीधे pass करें:

        ```bash
        openclaw onboard --anthropic-api-key "$ANTHROPIC_API_KEY"
        ```
      </Step>
      <Step title="सत्यापित करें कि model उपलब्ध है">
        ```bash
        openclaw models list --provider anthropic
        ```
      </Step>
    </Steps>

    ### Config example

    ```json5
    {
      env: { ANTHROPIC_API_KEY: "example-anthropic-key-not-real" },
      agents: { defaults: { model: { primary: "anthropic/claude-opus-4-8" } } },
    }
    ```

  </Tab>

  <Tab title="Claude CLI">
    **इसके लिए सर्वोत्तम:** अलग API key के बिना मौजूदा Claude CLI login का पुनः उपयोग।

    <Steps>
      <Step title="सुनिश्चित करें कि Claude CLI installed है और logged in है">
        इससे verify करें:

        ```bash
        claude --version
        ```
      </Step>
      <Step title="onboarding चलाएं">
        ```bash
        openclaw onboard
        # choose: Claude CLI
        ```

        OpenClaw मौजूदा Claude CLI credentials का पता लगाकर उनका पुनः उपयोग करता है।
      </Step>
      <Step title="सत्यापित करें कि model उपलब्ध है">
        ```bash
        openclaw models list --provider anthropic
        ```
      </Step>
    </Steps>

    <Note>
    Claude CLI backend के setup और runtime details [CLI Backends](/hi/gateway/cli-backends) में हैं।
    </Note>

    <Warning>
    Claude CLI reuse अपेक्षा करता है कि OpenClaw process उसी host पर चले जहां
    Claude CLI login है। Docker installs container home को persist कर सकते हैं और वहां
    Claude Code में log in कर सकते हैं; देखें
    [Claude CLI backend in Docker](/hi/install/docker#claude-cli-backend-in-docker)।
    अन्य container installs जैसे [Podman](/hi/install/podman) host
    `~/.claude` को setup या runtime में mount नहीं करते; वहां Anthropic API key का उपयोग करें, या
    OpenClaw-managed OAuth वाले provider को चुनें जैसे
    [OpenAI Codex](/hi/providers/openai)।
    </Warning>

    ### Config example

    canonical Anthropic model ref और CLI runtime override को प्राथमिकता दें:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "anthropic/claude-opus-4-8" },
          models: {
            "anthropic/claude-opus-4-8": {
              agentRuntime: { id: "claude-cli" },
            },
          },
        },
      },
    }
    ```

    Legacy `claude-cli/claude-opus-4-7` model refs अभी भी
    compatibility के लिए काम करते हैं, लेकिन नए config में provider/model selection को
    `anthropic/*` के रूप में रखना चाहिए और execution backend को provider/model runtime policy में रखना चाहिए।

    ### Billing और `claude -p`

    OpenClaw Claude CLI runs के लिए Claude Code के non-interactive `claude -p` path का उपयोग करता है। Anthropic वर्तमान में उस path को Agent SDK/programmatic usage मानता है:

    - Anthropic के 15 जून, 2026 support update ने पहले घोषित
      अलग Agent SDK credit plan को रोक दिया।
    - फिलहाल, subscription-plan Claude Agent SDK, `claude -p`, और third-party
      app usage अभी भी signed-in subscription की usage limits से draw करते हैं।
    - पहले घोषित monthly Agent SDK credit उपलब्ध नहीं है, जब तक
      Anthropic उस plan को revise कर रहा है।
    - Console/API-key logins pay-as-you-go API billing का उपयोग करते हैं और उन्हें
      subscription Agent SDK credit नहीं मिलता।

    pause notice के लिए Anthropic का [Agent SDK plan
    article](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan) देखें, और
    subscription behavior के लिए Claude Code plan articles
    [Pro/Max](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan)
    और
    [Team/Enterprise](https://support.claude.com/en/articles/11845131-use-claude-code-with-your-team-or-enterprise-plan)
    देखें।

    Anthropic OpenClaw release के बिना Claude Code billing और rate-limit behavior बदल सकता है।
    जब billing predictability महत्वपूर्ण हो, तो `claude auth status`, `/status`, और
    Anthropic के linked docs देखें।

    <Tip>
    shared production automation के लिए Claude CLI के बजाय Anthropic API key का उपयोग करें।
    OpenClaw [OpenAI Codex](/hi/providers/openai), [Qwen Cloud](/hi/providers/qwen),
    [MiniMax](/hi/providers/minimax), और [Z.AI / GLM](/hi/providers/zai) से
    subscription-style options का भी समर्थन करता है।
    </Tip>

  </Tab>
</Tabs>

## Thinking defaults (Claude Fable 5, 4.8, और 4.6)

`anthropic/claude-fable-5` हमेशा adaptive thinking का उपयोग करता है और default रूप से `high`
effort पर रहता है। क्योंकि Anthropic इस model के लिए thinking को disable करने की अनुमति नहीं देता,
`/think off` और `/think minimal` `low` effort का उपयोग करते हैं। OpenClaw Fable 5 requests के लिए custom
temperature values भी omit करता है।

Claude Opus 4.8 OpenClaw में default रूप से thinking off रखता है। जब आप `/think high|xhigh|max` से adaptive thinking को स्पष्ट रूप से enable करते हैं, OpenClaw Anthropic के Opus 4.8 effort values भेजता है; Claude 4.6 models default रूप से `adaptive` होते हैं।

Per-message override `/think:<level>` से करें या model params में:

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-8": {
          params: { thinking: "high" },
        },
      },
    },
  },
}
```

<Note>
संबंधित Anthropic docs:
- [Adaptive thinking](https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking)
- [Extended thinking](https://platform.claude.com/docs/en/build-with-claude/extended-thinking)

</Note>

## Prompt caching

OpenClaw API-key auth के लिए Anthropic की prompt caching feature का समर्थन करता है।

| Value               | Cache duration | Description                            |
| ------------------- | -------------- | -------------------------------------- |
| `"short"` (default) | 5 minutes      | API-key auth के लिए automatically applied |
| `"long"`            | 1 hour         | Extended cache                         |
| `"none"`            | No caching     | prompt caching disable करें                 |

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": {
          params: { cacheRetention: "long" },
        },
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Per-agent cache overrides">
    model-level params को baseline के रूप में उपयोग करें, फिर specific agents को `agents.list[].params` के जरिए override करें:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "anthropic/claude-opus-4-6" },
          models: {
            "anthropic/claude-opus-4-6": {
              params: { cacheRetention: "long" },
            },
          },
        },
        list: [
          { id: "research", default: true },
          { id: "alerts", params: { cacheRetention: "none" } },
        ],
      },
    }
    ```

    Config merge order:

    1. `agents.defaults.models["provider/model"].params`
    2. `agents.list[].params` (matching `id`, key द्वारा overrides)

    यह एक agent को long-lived cache रखने देता है, जबकि same model पर दूसरा agent bursty/low-reuse traffic के लिए caching disable करता है।

  </Accordion>

  <Accordion title="Bedrock Claude notes">
    - Bedrock पर Anthropic Claude models (`amazon-bedrock/*anthropic.claude*`) configured होने पर `cacheRetention` pass-through accept करते हैं।
    - Non-Anthropic Bedrock models runtime पर `cacheRetention: "none"` पर forced होते हैं।
    - API-key smart defaults Claude-on-Bedrock refs के लिए भी `cacheRetention: "short"` seed करते हैं, जब explicit value set नहीं है।

  </Accordion>
</AccordionGroup>

## Advanced configuration

<AccordionGroup>
  <Accordion title="Fast mode">
    OpenClaw का shared `/fast` toggle direct Anthropic traffic (API-key और OAuth to `api.anthropic.com`) का समर्थन करता है।

    | Command | Maps to |
    |---------|---------|
    | `/fast on` | `service_tier: "auto"` |
    | `/fast off` | `service_tier: "standard_only"` |

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "anthropic/claude-sonnet-4-6": {
              params: { fastMode: true },
            },
          },
        },
      },
    }
    ```

    <Note>
    - केवल direct `api.anthropic.com` requests के लिए injected। Proxy routes `service_tier` को untouched छोड़ते हैं।
    - Explicit `serviceTier` या `service_tier` params `/fast` को override करते हैं जब दोनों set हों।
    - Priority Tier capacity के बिना accounts पर, `service_tier: "auto"` `standard` पर resolve हो सकता है।

    </Note>

  </Accordion>

  <Accordion title="Media understanding (image and PDF)">
    bundled Anthropic plugin image और PDF understanding register करता है। OpenClaw
    configured Anthropic auth से media capabilities को auto-resolve करता है — कोई
    अतिरिक्त config आवश्यक नहीं है।

    | Property        | Value                 |
    | --------------- | --------------------- |
    | Default model   | `claude-opus-4-8`     |
    | Supported input | Images, PDF documents |

    जब किसी conversation में image या PDF attached होती है, OpenClaw automatically
    उसे Anthropic media understanding provider के माध्यम से route करता है।

  </Accordion>

  <Accordion title="1M context window">
    Anthropic की 1M context window GA-capable Claude 4.x models पर उपलब्ध है,
    जैसे Opus 4.8, Opus 4.7, Opus 4.6, और Sonnet 4.6। OpenClaw उन models को
    automatically 1M पर size करता है:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "anthropic/claude-opus-4-6": {},
          },
        },
      },
    }
    ```

    पुराने configs `params.context1m: true` रख सकते हैं, लेकिन OpenClaw अब
    retired `context-1m-2025-08-07` beta header नहीं भेजता। उस value वाली पुरानी `anthropicBeta` config
    entries request header resolution के दौरान ignore की जाती हैं और
    unsupported पुराने Claude models अपने normal context window पर रहते हैं।

    `params.context1m: true` Claude CLI backend
    (`claude-cli/*`) पर भी eligible GA-capable Opus और Sonnet models के लिए apply होता है, जिससे
    उन CLI sessions के लिए runtime context window direct-API behavior से match करने के लिए preserve रहता है।

    <Warning>
    आपके Anthropic credential पर long-context access आवश्यक है। OAuth/subscription token auth अपने required Anthropic beta headers रखता है, लेकिन OpenClaw पुराने config में मौजूद होने पर retired 1M beta header को strip कर देता है।
    </Warning>

  </Accordion>

  <Accordion title="Claude Opus 4.8 1M संदर्भ">
    `anthropic/claude-opus-4-8` और इसके `claude-cli` वैरिएंट में डिफ़ॉल्ट रूप से 1M संदर्भ
    विंडो होती है — `params.context1m: true` की आवश्यकता नहीं।
  </Accordion>
</AccordionGroup>

## समस्या निवारण

<AccordionGroup>
  <Accordion title="401 त्रुटियाँ / टोकन अचानक अमान्य">
    Anthropic टोकन प्रमाणीकरण समाप्त हो जाता है और निरस्त किया जा सकता है। नए सेटअप के लिए, इसके बजाय Anthropic API कुंजी का उपयोग करें।
  </Accordion>

  <Accordion title='प्रदाता "anthropic" के लिए कोई API कुंजी नहीं मिली'>
    Anthropic प्रमाणीकरण **प्रति एजेंट** होता है — नए एजेंट मुख्य एजेंट की कुंजियाँ इनहेरिट नहीं करते। उस एजेंट के लिए ऑनबोर्डिंग फिर से चलाएँ (या Gateway होस्ट पर API कुंजी कॉन्फ़िगर करें), फिर `openclaw models status` से सत्यापित करें।
  </Accordion>

  <Accordion title='प्रोफ़ाइल "anthropic:default" के लिए कोई क्रेडेंशियल नहीं मिले'>
    कौन-सी प्रमाणीकरण प्रोफ़ाइल सक्रिय है, यह देखने के लिए `openclaw models status` चलाएँ। ऑनबोर्डिंग फिर से चलाएँ, या उस प्रोफ़ाइल पथ के लिए API कुंजी कॉन्फ़िगर करें।
  </Accordion>

  <Accordion title="कोई उपलब्ध प्रमाणीकरण प्रोफ़ाइल नहीं (सभी कूलडाउन में)">
    `auth.unusableProfiles` के लिए `openclaw models status --json` देखें। Anthropic दर-सीमा कूलडाउन मॉडल-स्कोप्ड हो सकते हैं, इसलिए कोई संबद्ध Anthropic मॉडल अभी भी उपयोग योग्य हो सकता है। कोई अन्य Anthropic प्रोफ़ाइल जोड़ें या कूलडाउन की प्रतीक्षा करें।
  </Accordion>
</AccordionGroup>

<Note>
अधिक सहायता: [समस्या निवारण](/hi/help/troubleshooting) और [अक्सर पूछे जाने वाले प्रश्न](/hi/help/faq)।
</Note>

## संबंधित

<CardGroup cols={2}>
  <Card title="मॉडल चयन" href="/hi/concepts/model-providers" icon="layers">
    प्रदाता, मॉडल संदर्भ और फ़ेलओवर व्यवहार चुनना।
  </Card>
  <Card title="CLI बैकएंड" href="/hi/gateway/cli-backends" icon="terminal">
    Claude CLI बैकएंड सेटअप और रनटाइम विवरण।
  </Card>
  <Card title="प्रॉम्प्ट कैशिंग" href="/hi/reference/prompt-caching" icon="database">
    प्रदाताओं में प्रॉम्प्ट कैशिंग कैसे काम करती है।
  </Card>
  <Card title="OAuth और प्रमाणीकरण" href="/hi/gateway/authentication" icon="key">
    प्रमाणीकरण विवरण और क्रेडेंशियल पुन: उपयोग नियम।
  </Card>
</CardGroup>
