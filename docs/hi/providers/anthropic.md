---
read_when:
    - आप OpenClaw में Anthropic मॉडल का उपयोग करना चाहते हैं
summary: OpenClaw में API कुंजियों या Claude CLI के माध्यम से Anthropic Claude का उपयोग करें
title: Anthropic
x-i18n:
    generated_at: "2026-07-04T15:17:10Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0e6fd143b85bb448f65d5d1b35ce465cce7c6f41987b39b9665910cf71761032
    source_path: providers/anthropic.md
    workflow: 16
---

Anthropic **Claude** मॉडल परिवार बनाता है। OpenClaw दो auth routes का समर्थन करता है:

- **API key** — usage-based billing के साथ direct Anthropic API access (`anthropic/*` models)
- **Claude CLI** — उसी host पर मौजूदा Claude Code login का पुनः उपयोग

<Warning>
OpenClaw का Claude CLI backend installed Claude Code CLI को
non-interactive print mode में चलाता है। Anthropic के मौजूदा Claude Code docs
`claude -p` को Agent SDK/programmatic usage के रूप में बताते हैं। Anthropic के 15 जून, 2026 support
update ने घोषित Agent SDK billing change को रोक दिया। अभी के लिए, Anthropic कहता है कि
Claude Agent SDK, `claude -p`, और third-party app usage अभी भी
subscription की usage limits से draw करते हैं। पहले घोषित monthly Agent SDK credit
Anthropic द्वारा उस plan को revise करने तक उपलब्ध नहीं है।

Interactive Claude Code अभी भी signed-in Claude plan limits से draw करता है। API
key auth direct pay-as-you-go API billing रहता है। long-lived gateway hosts,
shared automation, और predictable production spend के लिए, Anthropic API key का उपयोग करें।

subscription billing behavior पर निर्भर होने से पहले Anthropic के मौजूदा support articles देखें:

- [Claude Code CLI reference](https://code.claude.com/docs/en/cli-usage)
- [अपने Claude plan के साथ Claude Agent SDK का उपयोग करें](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan)
- [अपने Pro या Max plan के साथ Claude Code का उपयोग करें](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan)
- [अपने Team या Enterprise plan के साथ Claude Code का उपयोग करें](https://support.claude.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan)
- [Claude Code costs प्रबंधित करें](https://code.claude.com/docs/en/costs)

</Warning>

## शुरू करना

<Tabs>
  <Tab title="API key">
    **इसके लिए सर्वोत्तम:** standard API access और usage-based billing.

    <Steps>
      <Step title="अपनी API key प्राप्त करें">
        [Anthropic Console](https://console.anthropic.com/) में API key बनाएँ।
      </Step>
      <Step title="onboarding चलाएँ">
        ```bash
        openclaw onboard
        # choose: Anthropic API key
        ```

        या key सीधे pass करें:

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
        इसके साथ verify करें:

        ```bash
        claude --version
        ```
      </Step>
      <Step title="onboarding चलाएँ">
        ```bash
        openclaw onboard
        # choose: Claude CLI
        ```

        OpenClaw मौजूदा Claude CLI credentials का पता लगाता है और उनका पुनः उपयोग करता है।
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
    Claude CLI reuse अपेक्षा करता है कि OpenClaw process उसी host पर चले जहाँ
    Claude CLI login है। Docker installs container home को persist कर सकते हैं और वहाँ
    Claude Code में log in कर सकते हैं; देखें
    [Docker में Claude CLI backend](/hi/install/docker#claude-cli-backend-in-docker)।
    अन्य container installs जैसे [Podman](/hi/install/podman) setup या runtime में host
    `~/.claude` को mount नहीं करते; वहाँ Anthropic API key का उपयोग करें, या
    OpenClaw-managed OAuth वाले provider को चुनें, जैसे
    [OpenAI Codex](/hi/providers/openai)।
    </Warning>

    ### Config example

    canonical Anthropic model ref और CLI runtime override को prefer करें:

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

    Legacy `claude-cli/claude-opus-4-7` model refs compatibility के लिए अभी भी काम करते हैं,
    लेकिन new config में provider/model selection को
    `anthropic/*` रखना चाहिए और execution backend को provider/model runtime policy में रखना चाहिए।

    ### Billing और `claude -p`

    OpenClaw Claude CLI runs के लिए Claude Code के non-interactive `claude -p` path का उपयोग करता है।
    Anthropic currently उस path को Agent SDK/programmatic usage के रूप में treat करता है:

    - Anthropic के 15 जून, 2026 support update ने पहले घोषित
      अलग Agent SDK credit plan को रोक दिया।
    - अभी के लिए, subscription-plan Claude Agent SDK, `claude -p`, और third-party
      app usage अभी भी signed-in subscription की usage limits से draw करते हैं।
    - पहले घोषित monthly Agent SDK credit Anthropic द्वारा उस plan को revise करने तक उपलब्ध नहीं है।
    - Console/API-key logins pay-as-you-go API billing का उपयोग करते हैं और
      subscription Agent SDK credit प्राप्त नहीं करते।

    pause notice के लिए Anthropic का [Agent SDK plan
    article](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan)
    देखें, और subscription behavior के लिए Claude Code plan articles
    [Pro/Max](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan)
    और
    [Team/Enterprise](https://support.claude.com/en/articles/11845131-use-claude-code-with-your-team-or-enterprise-plan)
    देखें।

    Anthropic OpenClaw release के बिना Claude Code billing और rate-limit behavior बदल सकता है।
    billing predictability महत्वपूर्ण होने पर `claude auth status`, `/status`, और
    Anthropic के linked docs देखें।

    <Tip>
    shared production automation के लिए, Claude CLI के बजाय Anthropic API key का उपयोग करें।
    OpenClaw [OpenAI Codex](/hi/providers/openai), [Qwen Cloud](/hi/providers/qwen),
    [MiniMax](/hi/providers/minimax), और [Z.AI / GLM](/hi/providers/zai) से subscription-style options का भी समर्थन करता है।
    </Tip>

  </Tab>
</Tabs>

## Thinking defaults (Claude Fable 5, 4.8, और 4.6)

`anthropic/claude-fable-5` हमेशा adaptive thinking का उपयोग करता है और `high`
effort पर default करता है। क्योंकि Anthropic इस model के लिए thinking को disabled करने की अनुमति नहीं देता,
`/think off` और `/think minimal` `low` effort का उपयोग करते हैं। OpenClaw Fable 5 requests के लिए custom
temperature values भी omit करता है।

Claude Opus 4.8 में OpenClaw में thinking default रूप से off रहती है। जब आप `/think high|xhigh|max` से adaptive thinking स्पष्ट रूप से enable करते हैं, तो OpenClaw Anthropic के Opus 4.8 effort values भेजता है; Claude 4.6 models `adaptive` पर default करते हैं।

per-message `/think:<level>` से या model params में override करें:

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

## Safety refusal fallback (Claude Fable 5)

<Warning>
Claude Fable 5 का उपयोग करने का मतलब Claude Opus 4.8 का भी उपयोग करना है। Fable 5 ऐसे
safety classifiers के साथ ship होता है जो request को decline कर सकते हैं, और Anthropic की sanctioned
recovery यह है कि `claude-opus-4-8` उस turn को serve करे। OpenClaw direct API-key requests के लिए इसमें
automatically opt in करता है, इसलिए कुछ Fable turns का उत्तर
Claude Opus 4.8 के रूप में दिया और bill किया जाता है। यदि आपकी policy या budget
Opus-served turns स्वीकार नहीं कर सकता, तो `anthropic/claude-fable-5` select न करें।
</Warning>

### यह क्यों मौजूद है

Fable 5 classifiers restricted domains में requests पर `stop_reason: "refusal"` return करते हैं,
और benign-adjacent work (security tooling, life sciences, या model से उसकी raw
reasoning reproduce करने को कहना) पर भी false-positive करते हैं। fallback के बिना,
turn error के साथ मर जाता है, भले ही दूसरा Claude model उसे खुशी से serve कर देता —
Anthropic का अपना refusal message API integrators को fallback model configure करने को कहता है।

### यह कैसे काम करता है

1. `anthropic/claude-fable-5` के हर direct API-key request के लिए, OpenClaw
   Anthropic का server-side fallback opt-in भेजता है: 
   `server-side-fallback-2026-06-01` beta header plus
   `fallbacks: [{"model": "claude-opus-4-8"}]`। Claude Opus 4.8 ही Fable 5 के लिए Anthropic द्वारा permitted एकमात्र
   fallback target है।
2. केवल safety-classifier decline fallback trigger करता है। Rate limits,
   overloads, और server errors पहले की तरह ही behave करते हैं और
   OpenClaw के normal [model failover](/hi/concepts/model-failover) से गुजरते हैं।
3. rescue उसी call के अंदर होता है। किसी भी output से पहले decline
   latency के अलावा invisible है; पूरा answer Opus 4.8 से आता है। mid-stream decline पर partial text को prefix के रूप में रखा जाता है जिससे fallback
   model continue करता है, जबकि declined model की reasoning और tool calls
   Anthropic के replay rules के अनुसार discard कर दी जाती हैं (उन्हें वापस echo या
   execute नहीं किया जाना चाहिए)।
4. यदि Claude Opus 4.8 भी decline करता है, तो turn refusal को
   error के रूप में surface करता है, बिल्कुल इस feature से पहले की तरह।

fallback Anthropic API level पर होता है, इसलिए `claude-opus-4-8` को
आपकी configured model list या fallback chain में होना जरूरी नहीं है — Fable-capable
API key हमेशा Opus serve कर सकती है।

### Observability और billing

- fallback-served turn assistant message पर `provider_fallback` diagnostic record करता है,
  जिसमें `fromModel` और `toModel` का नाम होता है, और message का
  `responseModel` `claude-opus-4-8` report करता है।
- Anthropic per attempt bill करता है: output से पहले decline free है, और rescue
  Claude Opus 4.8 rates पर bill होता है (currently Fable 5 rates का आधा)। OpenClaw का
  per-turn cost estimate fallback-served turns को match करने के लिए Opus rates पर price करता है।
- mid-stream decline additionally पहले से streamed Fable partial को Anthropic की तरफ से bill करता है;
  वह portion API के per-attempt usage में report होता है लेकिन OpenClaw के per-turn estimate में folded नहीं होता।

### Scope

`api.anthropic.com` के विरुद्ध API-key auth के साथ `anthropic/claude-fable-5` पर लागू होता है।
OAuth (Claude CLI subscription reuse), proxy base URLs,
Bedrock, Vertex, और Foundry requests unchanged हैं और वहाँ refusals को errors के रूप में ही surface करते हैं।

Live verified: Fable 5 से अपनी raw chain of
thought reproduce करने को कहने वाला benign prompt fallbacks के बिना भेजे जाने पर
`category: "reasoning_extraction"` के साथ decline होता है, और OpenClaw के माध्यम से वही prompt
`provider_fallback` diagnostic attached के साथ normal Opus-served
answer return करता है।

underlying behavior के लिए Anthropic की [refusals and fallback
guide](https://platform.claude.com/docs/en/build-with-claude/refusals-and-fallback)
देखें।

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
    model-level params को अपनी baseline के रूप में use करें, फिर `agents.list[].params` के माध्यम से specific agents override करें:

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

    कॉन्फ़िग मर्ज क्रम:

    1. `agents.defaults.models["provider/model"].params`
    2. `agents.list[].params` (मेल खाते `id`, कुंजी के आधार पर ओवरराइड करता है)

    इससे एक एजेंट लंबी अवधि वाला कैश रख सकता है, जबकि उसी मॉडल पर दूसरा एजेंट अधिक आवृत्ति वाले/कम पुनः-उपयोग वाले ट्रैफ़िक के लिए कैशिंग बंद कर सकता है।

  </Accordion>

  <Accordion title="Bedrock Claude नोट्स">
    - Bedrock पर Anthropic Claude मॉडल (`amazon-bedrock/*anthropic.claude*`) कॉन्फ़िगर किए जाने पर `cacheRetention` पास-थ्रू स्वीकार करते हैं।
    - गैर-Anthropic Bedrock मॉडल रनटाइम पर `cacheRetention: "none"` पर बाध्य किए जाते हैं।
    - API-कुंजी स्मार्ट डिफ़ॉल्ट भी Claude-on-Bedrock refs के लिए, जब कोई स्पष्ट मान सेट न हो, `cacheRetention: "short"` सीड करते हैं।

  </Accordion>
</AccordionGroup>

## उन्नत कॉन्फ़िगरेशन

<AccordionGroup>
  <Accordion title="तेज़ मोड">
    OpenClaw का साझा `/fast` टॉगल सीधे Anthropic ट्रैफ़िक (`api.anthropic.com` के लिए API-कुंजी और OAuth) का समर्थन करता है।

    | कमांड | इसमें मैप होता है |
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
    - केवल सीधे `api.anthropic.com` अनुरोधों के लिए इंजेक्ट किया जाता है। प्रॉक्सी रूट `service_tier` को अपरिवर्तित छोड़ते हैं।
    - स्पष्ट `serviceTier` या `service_tier` params, दोनों सेट होने पर, `/fast` को ओवरराइड करते हैं।
    - Priority Tier क्षमता के बिना खातों पर, `service_tier: "auto"` `standard` में रिज़ॉल्व हो सकता है।

    </Note>

  </Accordion>

  <Accordion title="मीडिया समझ (छवि और PDF)">
    बंडल किया गया Anthropic Plugin छवि और PDF समझ को पंजीकृत करता है। OpenClaw
    कॉन्फ़िगर किए गए Anthropic auth से मीडिया क्षमताओं को अपने-आप रिज़ॉल्व करता है — किसी
    अतिरिक्त कॉन्फ़िग की आवश्यकता नहीं है।

    | प्रॉपर्टी        | मान                 |
    | --------------- | --------------------- |
    | डिफ़ॉल्ट मॉडल   | `claude-opus-4-8`     |
    | समर्थित इनपुट | छवियाँ, PDF दस्तावेज़ |

    जब किसी बातचीत में कोई छवि या PDF संलग्न होती है, तो OpenClaw उसे स्वचालित रूप से
    Anthropic मीडिया समझ प्रदाता के माध्यम से रूट करता है।

  </Accordion>

  <Accordion title="1M संदर्भ विंडो">
    Anthropic की 1M संदर्भ विंडो GA-सक्षम Claude 4.x मॉडलों पर उपलब्ध है,
    जैसे Opus 4.8, Opus 4.7, Opus 4.6, और Sonnet 4.6। OpenClaw उन मॉडलों को
    स्वचालित रूप से 1M पर आकार देता है:

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

    पुराने कॉन्फ़िग `params.context1m: true` रख सकते हैं, लेकिन OpenClaw अब
    सेवानिवृत्त `context-1m-2025-08-07` beta हेडर नहीं भेजता। उस मान वाली पुरानी `anthropicBeta` कॉन्फ़िग
    प्रविष्टियों को अनुरोध हेडर रिज़ॉल्यूशन के दौरान अनदेखा किया जाता है और
    असमर्थित पुराने Claude मॉडल अपनी सामान्य संदर्भ विंडो पर रहते हैं।

    `params.context1m: true` पात्र GA-सक्षम Opus और Sonnet मॉडलों के लिए Claude CLI बैकएंड
    (`claude-cli/*`) पर भी लागू होता है, जिससे उन CLI सत्रों की रनटाइम संदर्भ विंडो
    direct-API व्यवहार से मेल खाने के लिए संरक्षित रहती है।

    <Warning>
    आपके Anthropic क्रेडेंशियल पर long-context एक्सेस आवश्यक है। OAuth/subscription token auth अपने आवश्यक Anthropic beta हेडर बनाए रखता है, लेकिन यदि सेवानिवृत्त 1M beta हेडर पुराने कॉन्फ़िग में बचा रहता है तो OpenClaw उसे हटा देता है।
    </Warning>

  </Accordion>

  <Accordion title="Claude Opus 4.8 1M संदर्भ">
    `anthropic/claude-opus-4-8` और उसके `claude-cli` वैरिएंट में डिफ़ॉल्ट रूप से 1M संदर्भ
    विंडो होती है — `params.context1m: true` की आवश्यकता नहीं।
  </Accordion>
</AccordionGroup>

## समस्या निवारण

<AccordionGroup>
  <Accordion title="401 त्रुटियाँ / टोकन अचानक अमान्य">
    Anthropic token auth की समय-सीमा समाप्त होती है और इसे रद्द किया जा सकता है। नए सेटअप के लिए, इसके बजाय Anthropic API कुंजी का उपयोग करें।
  </Accordion>

  <Accordion title='प्रदाता "anthropic" के लिए कोई API कुंजी नहीं मिली'>
    Anthropic auth **प्रति एजेंट** है — नए एजेंट मुख्य एजेंट की कुंजियाँ इनहेरिट नहीं करते। उस एजेंट के लिए onboarding दोबारा चलाएँ (या Gateway होस्ट पर API कुंजी कॉन्फ़िगर करें), फिर `openclaw models status` से सत्यापित करें।
  </Accordion>

  <Accordion title='प्रोफ़ाइल "anthropic:default" के लिए कोई क्रेडेंशियल नहीं मिला'>
    कौन-सी auth प्रोफ़ाइल सक्रिय है यह देखने के लिए `openclaw models status` चलाएँ। onboarding दोबारा चलाएँ, या उस प्रोफ़ाइल पथ के लिए API कुंजी कॉन्फ़िगर करें।
  </Accordion>

  <Accordion title="कोई उपलब्ध auth प्रोफ़ाइल नहीं (सभी cooldown में)">
    `auth.unusableProfiles` के लिए `openclaw models status --json` जाँचें। Anthropic rate-limit cooldown मॉडल-स्कोप्ड हो सकते हैं, इसलिए कोई sibling Anthropic मॉडल अभी भी उपयोगी हो सकता है। एक और Anthropic प्रोफ़ाइल जोड़ें या cooldown का इंतज़ार करें।
  </Accordion>
</AccordionGroup>

<Note>
अधिक सहायता: [समस्या निवारण](/hi/help/troubleshooting) और [FAQ](/hi/help/faq)।
</Note>

## संबंधित

<CardGroup cols={2}>
  <Card title="मॉडल चयन" href="/hi/concepts/model-providers" icon="layers">
    प्रदाता, मॉडल refs, और failover व्यवहार चुनना।
  </Card>
  <Card title="CLI बैकएंड" href="/hi/gateway/cli-backends" icon="terminal">
    Claude CLI बैकएंड सेटअप और रनटाइम विवरण।
  </Card>
  <Card title="प्रॉम्प्ट कैशिंग" href="/hi/reference/prompt-caching" icon="database">
    प्रदाताओं में प्रॉम्प्ट कैशिंग कैसे काम करती है।
  </Card>
  <Card title="OAuth और auth" href="/hi/gateway/authentication" icon="key">
    Auth विवरण और क्रेडेंशियल पुनः-उपयोग नियम।
  </Card>
</CardGroup>
