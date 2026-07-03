---
read_when:
    - सामान्य सेटअप, इंस्टॉल, ऑनबोर्डिंग, या runtime सहायता प्रश्नों के उत्तर देना
    - गहन डिबगिंग से पहले उपयोगकर्ता द्वारा रिपोर्ट की गई समस्याओं का प्राथमिकता निर्धारण
summary: OpenClaw सेटअप, कॉन्फ़िगरेशन और उपयोग के बारे में अक्सर पूछे जाने वाले प्रश्न
title: अक्सर पूछे जाने वाले प्रश्न
x-i18n:
    generated_at: "2026-07-03T15:26:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4d55385d187c20dfce05022b76fcaa054c19fc22e46da66d4a24e2538dd95708
    source_path: help/faq.md
    workflow: 16
---

वास्तविक सेटअप (स्थानीय dev, VPS, multi-agent, OAuth/API keys, model failover) के लिए त्वरित उत्तर और गहरी troubleshooting। runtime diagnostics के लिए, [Troubleshooting](/hi/gateway/troubleshooting) देखें। पूर्ण config reference के लिए, [Configuration](/hi/gateway/configuration) देखें।

## अगर कुछ टूटा है तो पहले 60 सेकंड

1. **त्वरित स्थिति (पहली जांच)**

   ```bash
   openclaw status
   ```

   तेज स्थानीय सारांश: OS + update, gateway/service reachability, agents/sessions, provider config + runtime issues (जब gateway reachable हो)।

2. **चिपकाने योग्य रिपोर्ट (साझा करने के लिए सुरक्षित)**

   ```bash
   openclaw status --all
   ```

   log tail के साथ read-only diagnosis (tokens redacted)।

3. **Daemon + port state**

   ```bash
   openclaw gateway status
   ```

   supervisor runtime बनाम RPC reachability, probe target URL, और service ने संभवतः कौन-सा config इस्तेमाल किया, दिखाता है।

4. **गहरे probes**

   ```bash
   openclaw status --deep
   ```

   live gateway health probe चलाता है, समर्थित होने पर channel probes सहित
   (reachable gateway की आवश्यकता होती है)। [Health](/hi/gateway/health) देखें।

5. **नवीनतम log tail करें**

   ```bash
   openclaw logs --follow
   ```

   अगर RPC down है, तो fallback करें:

   ```bash
   tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
   ```

   File logs, service logs से अलग हैं; [Logging](/hi/logging) और [Troubleshooting](/hi/gateway/troubleshooting) देखें।

6. **doctor चलाएं (repairs)**

   ```bash
   openclaw doctor
   ```

   config/state को repairs/migrates करता है + health checks चलाता है। [Doctor](/hi/gateway/doctor) देखें।

7. **Gateway snapshot**

   ```bash
   openclaw health --json
   openclaw health --verbose   # shows the target URL + config path on errors
   ```

   running gateway से full snapshot मांगता है (केवल WS)। [Health](/hi/gateway/health) देखें।

## Quick start और first-run setup

First-run Q&A — install, onboard, auth routes, subscriptions, initial failures —
[First-run FAQ](/hi/help/faq-first-run) पर उपलब्ध है।

## OpenClaw क्या है?

<AccordionGroup>
  <Accordion title="OpenClaw क्या है, एक paragraph में?">
    OpenClaw एक personal AI assistant है जिसे आप अपने devices पर चलाते हैं। यह उन messaging surfaces पर replies देता है जिन्हें आप पहले से इस्तेमाल करते हैं (WhatsApp, Telegram, Slack, Mattermost, Discord, Google Chat, Signal, iMessage, WebChat, और bundled channel plugins जैसे QQ Bot) और supported platforms पर voice + live Canvas भी कर सकता है। **Gateway** हमेशा चालू रहने वाला control plane है; assistant product है।
  </Accordion>

  <Accordion title="Value proposition">
    OpenClaw "सिर्फ Claude wrapper" नहीं है। यह एक **local-first control plane** है जो आपको **अपने hardware** पर एक सक्षम assistant चलाने देता है, जो आपके पहले से इस्तेमाल किए जाने वाले chat apps से reachable है, जिसमें stateful sessions, memory, और tools हैं - बिना अपने workflows का control hosted SaaS को सौंपे।

    मुख्य बातें:

    - **आपके devices, आपका data:** Gateway जहां चाहें चलाएं (Mac, Linux, VPS) और workspace + session history local रखें।
    - **वास्तविक channels, web sandbox नहीं:** WhatsApp/Telegram/Slack/Discord/Signal/iMessage/etc,
      साथ ही supported platforms पर mobile voice और Canvas।
    - **Model-agnostic:** Anthropic, OpenAI, MiniMax, OpenRouter, etc. का इस्तेमाल करें, per-agent routing
      और failover के साथ।
    - **Local-only option:** local models चलाएं ताकि अगर आप चाहें तो **सारा data आपके device पर रह सके**।
    - **Multi-agent routing:** हर channel, account, या task के लिए अलग agents, प्रत्येक के अपने
      workspace और defaults के साथ।
    - **Open source और hackable:** vendor lock-in के बिना inspect, extend, और self-host करें।

    Docs: [Gateway](/hi/gateway), [Channels](/hi/channels), [Multi-agent](/hi/concepts/multi-agent),
    [Memory](/hi/concepts/memory).

  </Accordion>

  <Accordion title="मैंने अभी setup किया है - पहले क्या करूं?">
    अच्छे first projects:

    - Website बनाएं (WordPress, Shopify, या simple static site)।
    - Mobile app prototype करें (outline, screens, API plan)।
    - Files और folders व्यवस्थित करें (cleanup, naming, tagging)।
    - Gmail connect करें और summaries या follow ups automate करें।

    यह बड़े tasks संभाल सकता है, लेकिन जब आप उन्हें phases में बांटते हैं और
    parallel work के लिए sub agents इस्तेमाल करते हैं, तब यह सबसे अच्छा काम करता है।

  </Accordion>

  <Accordion title="OpenClaw के top five everyday use cases क्या हैं?">
    रोजमर्रा की जीत आमतौर पर ऐसी दिखती है:

    - **Personal briefings:** inbox, calendar, और आपके लिए अहम news की summaries।
    - **Research और drafting:** emails या docs के लिए quick research, summaries, और first drafts।
    - **Reminders और follow ups:** cron या heartbeat driven nudges और checklists।
    - **Browser automation:** forms भरना, data collect करना, और web tasks दोहराना।
    - **Cross device coordination:** अपने phone से task भेजें, Gateway को server पर चलने दें, और result chat में वापस पाएं।

  </Accordion>

  <Accordion title="क्या OpenClaw lead gen, outreach, ads, और SaaS के blogs में मदद कर सकता है?">
    हां, **research, qualification, और drafting** के लिए। यह sites scan कर सकता है, shortlists बना सकता है,
    prospects summarize कर सकता है, और outreach या ad copy drafts लिख सकता है।

    **Outreach या ad runs** के लिए, human को loop में रखें। spam से बचें, local laws और
    platform policies का पालन करें, और भेजने से पहले हर चीज review करें। सबसे सुरक्षित pattern है कि
    OpenClaw draft करे और आप approve करें।

    Docs: [Security](/hi/gateway/security).

  </Accordion>

  <Accordion title="Web development के लिए Claude Code की तुलना में advantages क्या हैं?">
    OpenClaw एक **personal assistant** और coordination layer है, IDE replacement नहीं। repo के अंदर सबसे तेज direct coding loop के लिए
    Claude Code या Codex इस्तेमाल करें। OpenClaw तब इस्तेमाल करें जब आपको
    durable memory, cross-device access, और tool orchestration चाहिए।

    Advantages:

    - Sessions के across **Persistent memory + workspace**
    - **Multi-platform access** (WhatsApp, Telegram, TUI, WebChat)
    - **Tool orchestration** (browser, files, scheduling, hooks)
    - **Always-on Gateway** (VPS पर चलाएं, कहीं से भी interact करें)
    - Local browser/screen/camera/exec के लिए **Nodes**

    Showcase: [https://openclaw.ai/showcase](https://openclaw.ai/showcase)

  </Accordion>
</AccordionGroup>

## Skills और automation

<AccordionGroup>
  <Accordion title="Repo dirty रखे बिना skills को customize कैसे करूं?">
    repo copy edit करने के बजाय managed overrides इस्तेमाल करें। अपने changes `~/.openclaw/skills/<name>/SKILL.md` में रखें (या `~/.openclaw/openclaw.json` में `skills.load.extraDirs` के जरिए folder जोड़ें)। Precedence है `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → bundled → `skills.load.extraDirs`, इसलिए managed overrides git को छुए बिना bundled skills पर फिर भी जीतते हैं। अगर skill globally installed चाहिए लेकिन केवल कुछ agents को visible हो, तो shared copy `~/.openclaw/skills` में रखें और visibility को `agents.defaults.skills` और `agents.list[].skills` से control करें। केवल upstream-worthy edits ही repo में रहने चाहिए और PRs के रूप में जाने चाहिए।
  </Accordion>

  <Accordion title="क्या मैं custom folder से skills load कर सकता हूं?">
    हां। `~/.openclaw/openclaw.json` में `skills.load.extraDirs` के जरिए extra directories जोड़ें (सबसे कम precedence)। Default precedence है `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → bundled → `skills.load.extraDirs`। `clawhub` default रूप से `./skills` में install करता है, जिसे OpenClaw अगले session में `<workspace>/skills` के रूप में treat करता है। अगर skill केवल कुछ agents को visible होनी चाहिए, तो इसे `agents.defaults.skills` या `agents.list[].skills` के साथ pair करें।
  </Accordion>

  <Accordion title="मैं अलग-अलग tasks के लिए अलग models या settings कैसे इस्तेमाल कर सकता हूं?">
    आज supported patterns हैं:

    - **Cron jobs**: isolated jobs हर job के लिए `model` override set कर सकते हैं।
    - **Agents**: tasks को अलग agents तक route करें जिनके default models, thinking levels, और stream params अलग हों।
    - **On-demand switch**: current session model को किसी भी समय switch करने के लिए `/model` इस्तेमाल करें।

    उदाहरण के लिए, अलग per-agent settings के साथ वही model इस्तेमाल करें:

    ```json5
    {
      agents: {
        list: [
          {
            id: "coder",
            model: "xiaomi/mimo-v2.5-pro",
            thinkingDefault: "high",
            params: { temperature: 0.1 },
          },
          {
            id: "chat",
            model: "xiaomi/mimo-v2.5-pro",
            thinkingDefault: "off",
            params: { temperature: 0.8 },
          },
        ],
      },
    }
    ```

    Shared per-model defaults को `agents.defaults.models["provider/model"].params` में रखें, फिर agent-specific overrides को flat `agents.list[].params` में रखें। उसी model के लिए अलग nested `agents.list[].models["provider/model"].params` entries define न करें; `agents.list[].models` per-agent model catalog और runtime overrides के लिए है।

    [Cron jobs](/hi/automation/cron-jobs), [Multi-Agent Routing](/hi/concepts/multi-agent), [Configuration](/hi/gateway/config-agents), और [Slash commands](/hi/tools/slash-commands) देखें।

  </Accordion>

  <Accordion title="भारी काम करते समय bot freeze हो जाता है। मैं इसे offload कैसे करूं?">
    लंबे या parallel tasks के लिए **sub-agents** इस्तेमाल करें। Sub-agents अपने session में चलते हैं,
    summary return करते हैं, और आपकी main chat responsive रखते हैं।

    अपने bot से कहें "spawn a sub-agent for this task" या `/subagents` इस्तेमाल करें।
    Gateway अभी क्या कर रहा है (और क्या वह busy है) देखने के लिए chat में `/status` इस्तेमाल करें।

    Token tip: लंबे tasks और sub-agents दोनों tokens consume करते हैं। अगर cost चिंता है, तो
    `agents.defaults.subagents.model` के जरिए sub-agents के लिए cheaper model set करें।

    Docs: [Sub-agents](/hi/tools/subagents), [Background Tasks](/hi/automation/tasks).

  </Accordion>

  <Accordion title="Discord पर thread-bound subagent sessions कैसे काम करते हैं?">
    thread bindings इस्तेमाल करें। आप Discord thread को subagent या session target से bind कर सकते हैं ताकि उस thread में follow-up messages उसी bound session पर बने रहें।

    Basic flow:

    - `sessions_spawn` के साथ `thread: true` इस्तेमाल करके spawn करें (और persistent follow-up के लिए optionally `mode: "session"`)।
    - या `/focus <target>` से manually bind करें।
    - binding state inspect करने के लिए `/agents` इस्तेमाल करें।
    - auto-unfocus control करने के लिए `/session idle <duration|off>` और `/session max-age <duration|off>` इस्तेमाल करें।
    - thread detach करने के लिए `/unfocus` इस्तेमाल करें।

    Required config:

    - Global defaults: `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
    - Discord overrides: `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours`.
    - Spawn पर auto-bind: `channels.discord.threadBindings.spawnSessions` default रूप से `true` है; thread-bound session spawns disable करने के लिए इसे `false` set करें।

    Docs: [Sub-agents](/hi/tools/subagents), [Discord](/hi/channels/discord), [Configuration Reference](/hi/gateway/configuration-reference), [Slash commands](/hi/tools/slash-commands).

  </Accordion>

  <Accordion title="एक subagent finish हुआ, लेकिन completion update गलत जगह गया या कभी post नहीं हुआ। मुझे क्या check करना चाहिए?">
    पहले resolved requester route check करें:

    - Completion-mode subagent delivery किसी भी bound thread या conversation route को prefer करती है जब वह मौजूद हो।
    - अगर completion origin केवल channel carry करता है, तो OpenClaw requester session के stored route (`lastChannel` / `lastTo` / `lastAccountId`) पर fallback करता है ताकि direct delivery फिर भी succeed कर सके।
    - अगर न bound route है और न usable stored route, तो direct delivery fail हो सकती है और result तुरंत chat में post होने के बजाय queued session delivery पर fallback करता है।
    - Invalid या stale targets फिर भी queue fallback या final delivery failure force कर सकते हैं।
    - अगर child का last visible assistant reply exact silent token `NO_REPLY` / `no_reply`, या exactly `ANNOUNCE_SKIP` है, तो OpenClaw stale earlier progress post करने के बजाय announce को intentionally suppress करता है।
    - Tool/toolResult output को child result text में promote नहीं किया जाता; result child का latest visible assistant reply है।

    Debug:

    ```bash
    openclaw tasks show <runId-or-sessionKey>
    ```

    दस्तावेज़: [Sub-agents](/hi/tools/subagents), [Background Tasks](/hi/automation/tasks), [Session Tools](/hi/concepts/session-tool).

  </Accordion>

  <Accordion title="Cron या रिमाइंडर चालू नहीं होते। मुझे क्या जांचना चाहिए?">
    Cron Gateway प्रक्रिया के अंदर चलता है। अगर Gateway लगातार नहीं चल रहा है,
    तो शेड्यूल किए गए जॉब नहीं चलेंगे।

    चेकलिस्ट:

    - पुष्टि करें कि cron सक्षम है (`cron.enabled`) और `OPENCLAW_SKIP_CRON` सेट नहीं है।
    - जांचें कि Gateway 24/7 चल रहा है (कोई स्लीप/रीस्टार्ट नहीं)।
    - जॉब के लिए टाइमज़ोन सेटिंग सत्यापित करें (`--tz` बनाम होस्ट टाइमज़ोन)।

    Debug:

    ```bash
    openclaw cron run <jobId>
    openclaw cron runs --id <jobId> --limit 50
    ```

    दस्तावेज़: [Cron jobs](/hi/automation/cron-jobs), [Automation](/hi/automation).

  </Accordion>

  <Accordion title="Cron चला, लेकिन चैनल पर कुछ नहीं भेजा गया। क्यों?">
    पहले डिलीवरी मोड जांचें:

    - `--no-deliver` / `delivery.mode: "none"` का मतलब है कि कोई रनर फ़ॉलबैक भेजना अपेक्षित नहीं है।
    - गुम या अमान्य घोषणा लक्ष्य (`channel` / `to`) का मतलब है कि रनर ने आउटबाउंड डिलीवरी छोड़ दी।
    - चैनल ऑथ विफलताएं (`unauthorized`, `Forbidden`) का मतलब है कि रनर ने डिलीवर करने की कोशिश की लेकिन क्रेडेंशियल्स ने उसे रोक दिया।
    - एक मौन पृथक परिणाम (केवल `NO_REPLY` / `no_reply`) को जानबूझकर नॉन-डिलीवरबल माना जाता है, इसलिए रनर कतारबद्ध फ़ॉलबैक डिलीवरी को भी दबा देता है।

    पृथक cron जॉब के लिए, चैट रूट उपलब्ध होने पर एजेंट अभी भी `message`
    टूल से सीधे भेज सकता है। `--announce` केवल उस अंतिम टेक्स्ट के लिए रनर
    फ़ॉलबैक पाथ नियंत्रित करता है जिसे एजेंट ने पहले से नहीं भेजा था।

    Debug:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    दस्तावेज़: [Cron jobs](/hi/automation/cron-jobs), [Background Tasks](/hi/automation/tasks).

  </Accordion>

  <Accordion title="एक पृथक cron रन ने मॉडल क्यों बदला या एक बार फिर प्रयास क्यों किया?">
    यह आमतौर पर लाइव मॉडल-स्विच पाथ होता है, डुप्लिकेट शेड्यूलिंग नहीं।

    पृथक cron सक्रिय रन द्वारा `LiveSessionModelSwitchError` फेंके जाने पर रनटाइम
    मॉडल हैंडऑफ़ को सहेज सकता है और फिर से प्रयास कर सकता है। रीट्राई बदले गए
    प्रोवाइडर/मॉडल को बनाए रखता है, और अगर स्विच में नया ऑथ प्रोफ़ाइल ओवरराइड था,
    तो cron रीट्राई से पहले उसे भी सहेजता है।

    संबंधित चयन नियम:

    - लागू होने पर Gmail हुक मॉडल ओवरराइड पहले जीतता है।
    - फिर प्रति-जॉब `model`.
    - फिर कोई भी संग्रहीत cron-session मॉडल ओवरराइड।
    - फिर सामान्य एजेंट/डिफ़ॉल्ट मॉडल चयन।

    रीट्राई लूप सीमित है। शुरुआती प्रयास और 2 स्विच रीट्राई के बाद,
    cron अनंत लूप के बजाय अबॉर्ट कर देता है।

    Debug:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    दस्तावेज़: [Cron jobs](/hi/automation/cron-jobs), [cron CLI](/hi/cli/cron).

  </Accordion>

  <Accordion title="मैं Linux पर Skills कैसे इंस्टॉल करूं?">
    मूल `openclaw skills` कमांड इस्तेमाल करें या skills को अपने वर्कस्पेस में डालें। macOS Skills UI Linux पर उपलब्ध नहीं है।
    skills [https://clawhub.ai](https://clawhub.ai) पर ब्राउज़ करें।

    ```bash
    openclaw skills search "calendar"
    openclaw skills search --limit 20
    openclaw skills install @owner/<skill-slug>
    openclaw skills install @owner/<skill-slug> --version <version>
    openclaw skills install @owner/<skill-slug> --force
    openclaw skills install @owner/<skill-slug> --global
    openclaw skills update --all
    openclaw skills update --all --global
    openclaw skills list --eligible
    openclaw skills check
    ```

    मूल `openclaw skills install` डिफ़ॉल्ट रूप से सक्रिय वर्कस्पेस की `skills/`
    डायरेक्टरी में लिखता है। सभी लोकल एजेंटों के लिए साझा प्रबंधित
    skills डायरेक्टरी में इंस्टॉल करने के लिए `--global` जोड़ें। अलग `clawhub` CLI
    केवल तभी इंस्टॉल करें जब आप अपनी skills प्रकाशित या सिंक करना चाहते हों। अगर आप यह सीमित करना चाहते हैं
    कि कौन से एजेंट साझा skills देख सकते हैं, तो `agents.defaults.skills` या `agents.list[].skills`
    का इस्तेमाल करें।

  </Accordion>

  <Accordion title="क्या OpenClaw बैकग्राउंड में शेड्यूल पर या लगातार टास्क चला सकता है?">
    हां। Gateway शेड्यूलर इस्तेमाल करें:

    - शेड्यूल किए गए या आवर्ती टास्क के लिए **Cron jobs** (रीस्टार्ट के बाद भी बने रहते हैं)।
    - "मुख्य सेशन" के आवधिक चेक के लिए **Heartbeat**।
    - सारांश पोस्ट करने या चैट्स में डिलीवर करने वाले स्वायत्त एजेंटों के लिए **पृथक जॉब**।

    दस्तावेज़: [Cron jobs](/hi/automation/cron-jobs), [Automation](/hi/automation),
    [Heartbeat](/hi/gateway/heartbeat).

  </Accordion>

  <Accordion title="क्या मैं Linux से Apple macOS-only skills चला सकता हूं?">
    सीधे नहीं। macOS skills `metadata.openclaw.os` और आवश्यक बाइनरीज़ से गेट होती हैं, और skills सिस्टम प्रॉम्प्ट में केवल तब दिखाई देती हैं जब वे **Gateway होस्ट** पर पात्र हों। Linux पर, `darwin`-only skills (जैसे `apple-notes`, `apple-reminders`, `things-mac`) तब तक लोड नहीं होंगी जब तक आप गेटिंग को ओवरराइड न करें।

    आपके पास तीन समर्थित पैटर्न हैं:

    **विकल्प A - Gateway को Mac पर चलाएं (सबसे आसान)।**
    Gateway को वहां चलाएं जहां macOS बाइनरीज़ मौजूद हैं, फिर Linux से [रिमोट मोड](#gateway-ports-already-running-and-remote-mode) में या Tailscale पर कनेक्ट करें। skills सामान्य रूप से लोड होती हैं क्योंकि Gateway होस्ट macOS है।

    **विकल्प B - macOS node इस्तेमाल करें (SSH नहीं)।**
    Gateway को Linux पर चलाएं, macOS node (menubar app) पेयर करें, और Mac पर **Node Run Commands** को "Always Ask" या "Always Allow" पर सेट करें। OpenClaw macOS-only skills को पात्र मान सकता है जब आवश्यक बाइनरीज़ node पर मौजूद हों। एजेंट उन skills को `nodes` टूल के ज़रिए चलाता है। अगर आप "Always Ask" चुनते हैं, तो प्रॉम्प्ट में "Always Allow" को मंज़ूरी देना उस कमांड को allowlist में जोड़ देता है।

    **विकल्प C - SSH पर macOS बाइनरीज़ प्रॉक्सी करें (उन्नत)।**
    Gateway को Linux पर रखें, लेकिन आवश्यक CLI बाइनरीज़ को ऐसे SSH wrappers पर resolve कराएं जो Mac पर चलें। फिर skill को Linux अनुमति देने के लिए ओवरराइड करें ताकि वह पात्र बनी रहे।

    1. बाइनरी के लिए SSH wrapper बनाएं (उदाहरण: Apple Notes के लिए `memo`):

       ```bash
       #!/usr/bin/env bash
       set -euo pipefail
       exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
       ```

    2. wrapper को Linux होस्ट पर `PATH` में रखें (उदाहरण के लिए `~/bin/memo`)।
    3. Linux अनुमति देने के लिए skill metadata (workspace या `~/.openclaw/skills`) ओवरराइड करें:

       ```markdown
       ---
       name: apple-notes
       description: Manage Apple Notes via the memo CLI on macOS.
       metadata: { "openclaw": { "os": ["darwin", "linux"], "requires": { "bins": ["memo"] } } }
       ---
       ```

    4. नया सेशन शुरू करें ताकि skills snapshot रिफ़्रेश हो।

  </Accordion>

  <Accordion title="क्या आपके पास Notion या HeyGen इंटीग्रेशन है?">
    आज बिल्ट-इन नहीं है।

    विकल्प:

    - **कस्टम skill / plugin:** भरोसेमंद API एक्सेस के लिए सबसे अच्छा (Notion/HeyGen दोनों के पास APIs हैं)।
    - **ब्राउज़र ऑटोमेशन:** बिना कोड के काम करता है लेकिन धीमा और अधिक नाज़ुक है।

    अगर आप प्रति क्लाइंट संदर्भ रखना चाहते हैं (एजेंसी वर्कफ़्लो), तो एक सरल पैटर्न है:

    - प्रति क्लाइंट एक Notion पेज (संदर्भ + प्राथमिकताएं + सक्रिय काम)।
    - सेशन की शुरुआत में एजेंट से वह पेज fetch करने को कहें।

    अगर आप नेटिव इंटीग्रेशन चाहते हैं, तो फीचर अनुरोध खोलें या उन APIs
    को लक्षित करने वाली skill बनाएं।

    skills इंस्टॉल करें:

    ```bash
    openclaw skills install @owner/<skill-slug>
    openclaw skills update --all
    ```

    नेटिव इंस्टॉल सक्रिय वर्कस्पेस की `skills/` डायरेक्टरी में जाते हैं। सभी लोकल एजेंटों के लिए साझा skills के लिए, `openclaw skills install @owner/<skill-slug> --global` इस्तेमाल करें (या उन्हें मैन्युअल रूप से `~/.openclaw/skills/<name>/SKILL.md` में रखें)। अगर केवल कुछ एजेंटों को साझा इंस्टॉल दिखना चाहिए, तो `agents.defaults.skills` या `agents.list[].skills` कॉन्फ़िगर करें। कुछ skills Homebrew के ज़रिए इंस्टॉल की गई बाइनरीज़ की अपेक्षा करती हैं; Linux पर इसका मतलब Linuxbrew है (ऊपर Homebrew Linux FAQ प्रविष्टि देखें)। [Skills](/hi/tools/skills), [Skills config](/hi/tools/skills-config), और [ClawHub](/hi/clawhub) देखें।

  </Accordion>

  <Accordion title="मैं OpenClaw के साथ अपने मौजूदा साइन-इन Chrome का उपयोग कैसे करूं?">
    बिल्ट-इन `user` ब्राउज़र प्रोफ़ाइल इस्तेमाल करें, जो Chrome DevTools MCP के ज़रिए अटैच होती है:

    ```bash
    openclaw browser --browser-profile user tabs
    openclaw browser --browser-profile user snapshot
    ```

    अगर आप कस्टम नाम चाहते हैं, तो स्पष्ट MCP प्रोफ़ाइल बनाएं:

    ```bash
    openclaw browser create-profile --name chrome-live --driver existing-session
    openclaw browser --browser-profile chrome-live tabs
    ```

    यह पाथ local host ब्राउज़र या connected browser node का उपयोग कर सकता है। अगर Gateway कहीं और चलता है, तो या तो ब्राउज़र मशीन पर node host चलाएं या remote CDP इस्तेमाल करें।

    `existing-session` / `user` पर मौजूदा सीमाएं:

    - actions ref-driven हैं, CSS-selector driven नहीं
    - uploads के लिए `ref` / `inputRef` चाहिए और वर्तमान में एक बार में एक फ़ाइल सपोर्ट करते हैं
    - `responsebody`, PDF export, download interception, और batch actions को अभी भी managed browser या raw CDP profile चाहिए

  </Accordion>
</AccordionGroup>

## सैंडबॉक्सिंग और मेमरी

<AccordionGroup>
  <Accordion title="क्या कोई dedicated sandboxing doc है?">
    हां। [Sandboxing](/hi/gateway/sandboxing) देखें। Docker-specific setup (Docker में full gateway या sandbox images) के लिए, [Docker](/hi/install/docker) देखें।
  </Accordion>

  <Accordion title="Docker सीमित लगता है - मैं full features कैसे सक्षम करूं?">
    डिफ़ॉल्ट image सुरक्षा-प्रथम है और `node` user के रूप में चलता है, इसलिए इसमें
    system packages, Homebrew, या bundled browsers शामिल नहीं होते। अधिक पूर्ण setup के लिए:

    - `/home/node` को `OPENCLAW_HOME_VOLUME` के साथ persist करें ताकि caches बने रहें।
    - `OPENCLAW_IMAGE_APT_PACKAGES` के साथ system deps को image में bake करें।
    - bundled CLI के ज़रिए Playwright browsers इंस्टॉल करें:
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - `PLAYWRIGHT_BROWSERS_PATH` सेट करें और सुनिश्चित करें कि path persist हो।

    दस्तावेज़: [Docker](/hi/install/docker), [Browser](/hi/tools/browser).

  </Accordion>

  <Accordion title="क्या मैं DMs को personal रख सकता हूं लेकिन groups को एक agent के साथ public/sandboxed बना सकता हूं?">
    हां - अगर आपका private traffic **DMs** है और आपका public traffic **groups** है।

    `agents.defaults.sandbox.mode: "non-main"` इस्तेमाल करें ताकि group/channel sessions (non-main keys) configured sandbox backend में चलें, जबकि main DM session on-host रहे। अगर आप कोई backend नहीं चुनते, तो Docker default backend है। फिर `tools.sandbox.tools` के ज़रिए sandboxed sessions में उपलब्ध tools को restrict करें।

    Setup walkthrough + example config: [Groups: personal DMs + public groups](/hi/channels/groups#pattern-personal-dms-public-groups-single-agent)

    Key config reference: [Gateway configuration](/hi/gateway/config-agents#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="मैं sandbox में host folder कैसे bind करूं?">
    `agents.defaults.sandbox.docker.binds` को `["host:path:mode"]` पर सेट करें (जैसे, `"/home/user/src:/src:ro"`)। Global + per-agent binds merge होते हैं; `scope: "shared"` होने पर per-agent binds ignore होते हैं। संवेदनशील किसी भी चीज़ के लिए `:ro` इस्तेमाल करें और याद रखें कि binds sandbox filesystem walls को bypass करते हैं।

    OpenClaw bind sources को normalized path और deepest existing ancestor के माध्यम से resolved canonical path, दोनों के विरुद्ध validate करता है। इसका मतलब है कि symlink-parent escapes तब भी fail closed होते हैं जब last path segment अभी मौजूद नहीं है, और allowed-root checks symlink resolution के बाद भी लागू होते हैं।

    examples और safety notes के लिए [Sandboxing](/hi/gateway/sandboxing#custom-bind-mounts) और [Sandbox vs Tool Policy vs Elevated](/hi/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check) देखें।

  </Accordion>

  <Accordion title="memory कैसे काम करती है?">
    OpenClaw memory agent workspace में सिर्फ Markdown files है:

    - `memory/YYYY-MM-DD.md` में daily notes
    - `MEMORY.md` में curated long-term notes (केवल main/private sessions)

    OpenClaw auto-compaction से पहले durable notes लिखने के लिए model को याद दिलाने हेतु
    **silent pre-compaction memory flush** भी चलाता है। यह केवल तब चलता है जब workspace
    writable हो (read-only sandboxes इसे skip करते हैं)। [Memory](/hi/concepts/memory) देखें।

  </Accordion>

  <Accordion title="मेमोरी बातें भूलती रहती है। मैं इसे स्थायी कैसे बनाऊं?">
    बॉट से **तथ्य को मेमोरी में लिखने** के लिए कहें। दीर्घकालिक नोट्स `MEMORY.md` में होते हैं,
    अल्पकालिक संदर्भ `memory/YYYY-MM-DD.md` में जाता है।

    यह अब भी एक ऐसा क्षेत्र है जिसे हम बेहतर बना रहे हैं। मॉडल को मेमोरी संग्रहीत करने की याद दिलाने से मदद मिलती है;
    उसे पता होगा कि क्या करना है। अगर वह भूलता रहता है, तो सत्यापित करें कि Gateway हर रन पर वही
    workspace इस्तेमाल कर रहा है।

    दस्तावेज़: [मेमोरी](/hi/concepts/memory), [एजेंट workspace](/hi/concepts/agent-workspace).

  </Accordion>

  <Accordion title="क्या मेमोरी हमेशा बनी रहती है? सीमाएं क्या हैं?">
    मेमोरी फाइलें डिस्क पर रहती हैं और तब तक बनी रहती हैं जब तक आप उन्हें हटाते नहीं। सीमा आपका
    स्टोरेज है, मॉडल नहीं। **सेशन संदर्भ** अब भी मॉडल की संदर्भ विंडो से सीमित है,
    इसलिए लंबी बातचीत compact या truncate हो सकती है। इसी वजह से
    मेमोरी खोज मौजूद है - यह केवल प्रासंगिक हिस्सों को वापस संदर्भ में खींचती है।

    दस्तावेज़: [मेमोरी](/hi/concepts/memory), [संदर्भ](/hi/concepts/context).

  </Accordion>

  <Accordion title="क्या सिमेंटिक मेमोरी खोज के लिए OpenAI API key चाहिए?">
    केवल तब, जब आप **OpenAI embeddings** इस्तेमाल करते हैं। Codex OAuth chat/completions को कवर करता है और
    embeddings access **नहीं** देता, इसलिए **Codex से साइन इन करना (OAuth या
    Codex CLI login)** सिमेंटिक मेमोरी खोज में मदद नहीं करता। OpenAI embeddings के लिए
    अब भी वास्तविक API key (`OPENAI_API_KEY` या `models.providers.openai.apiKey`) चाहिए।

    अगर आप provider स्पष्ट रूप से सेट नहीं करते, तो OpenClaw OpenAI embeddings इस्तेमाल करता है। पुराने
    configs जिनमें अब भी `memorySearch.provider = "auto"` है, वे भी OpenAI पर resolve होते हैं।
    अगर कोई OpenAI API key उपलब्ध नहीं है, तो सिमेंटिक मेमोरी खोज तब तक अनुपलब्ध रहती है
    जब तक आप key configure नहीं करते या स्पष्ट रूप से दूसरा provider नहीं चुनते।

    अगर आप local रहना पसंद करते हैं, तो `memorySearch.provider = "local"` सेट करें (और वैकल्पिक रूप से
    `memorySearch.fallback = "none"`). अगर आप Gemini embeddings चाहते हैं, तो
    `memorySearch.provider = "gemini"` सेट करें और `GEMINI_API_KEY` (या
    `memorySearch.remote.apiKey`) दें। हम **OpenAI, OpenAI-compatible, Gemini,
    Voyage, Mistral, Bedrock, Ollama, LM Studio, GitHub Copilot, DeepInfra, या local**
    embedding models का समर्थन करते हैं - setup विवरण के लिए [मेमोरी](/hi/concepts/memory) देखें।

  </Accordion>
</AccordionGroup>

## डिस्क पर चीजें कहां रहती हैं

<AccordionGroup>
  <Accordion title="क्या OpenClaw के साथ इस्तेमाल किया गया सारा डेटा locally सहेजा जाता है?">
    नहीं - **OpenClaw की state local होती है**, लेकिन **बाहरी सेवाएं अब भी वह देखती हैं जो आप उन्हें भेजते हैं**।

    - **डिफॉल्ट रूप से local:** sessions, memory files, config, और workspace Gateway host पर रहते हैं
      (`~/.openclaw` + आपकी workspace directory).
    - **आवश्यकता के कारण remote:** model providers (Anthropic/OpenAI/etc.) को भेजे गए संदेश
      उनके APIs पर जाते हैं, और chat platforms (WhatsApp/Telegram/Slack/etc.) message data को अपने
      servers पर store करते हैं।
    - **footprint आपके नियंत्रण में है:** local models इस्तेमाल करने से prompts आपकी मशीन पर रहते हैं, लेकिन channel
      traffic अब भी channel के servers से होकर जाता है।

    संबंधित: [एजेंट workspace](/hi/concepts/agent-workspace), [मेमोरी](/hi/concepts/memory).

  </Accordion>

  <Accordion title="OpenClaw अपना डेटा कहां store करता है?">
    सब कुछ `$OPENCLAW_STATE_DIR` के अंतर्गत रहता है (default: `~/.openclaw`):

    | Path                                                            | उद्देश्य                                                           |
    | --------------------------------------------------------------- | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                             | मुख्य config (JSON5)                                               |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                    | legacy OAuth import (पहले उपयोग पर auth profiles में copy किया गया) |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | Auth profiles (OAuth, API keys, और वैकल्पिक `keyRef`/`tokenRef`)   |
    | `$OPENCLAW_STATE_DIR/secrets.json`                              | `file` SecretRef providers के लिए वैकल्पिक file-backed secret payload |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`          | legacy compatibility file (static `api_key` entries scrubbed)      |
    | `$OPENCLAW_STATE_DIR/credentials/`                              | Provider state (जैसे `whatsapp/<accountId>/creds.json`)            |
    | `$OPENCLAW_STATE_DIR/agents/`                                   | प्रति-agent state (agentDir + sessions)                            |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                | बातचीत का history और state (प्रति agent)                           |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`   | Session metadata (प्रति agent)                                     |

    legacy single-agent path: `~/.openclaw/agent/*` (`openclaw doctor` द्वारा migrated).

    आपका **workspace** (AGENTS.md, memory files, skills, आदि) अलग है और `agents.defaults.workspace` के जरिए configured है (default: `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title="AGENTS.md / SOUL.md / USER.md / MEMORY.md कहां रहने चाहिए?">
    ये फाइलें **agent workspace** में रहती हैं, `~/.openclaw` में नहीं।

    - **Workspace (प्रति agent)**: `AGENTS.md`, `SOUL.md`, `IDENTITY.md`, `USER.md`,
      `MEMORY.md`, `memory/YYYY-MM-DD.md`, वैकल्पिक `HEARTBEAT.md`.
      Lowercase root `memory.md` केवल legacy repair input है; `openclaw doctor --fix`
      दोनों फाइलें मौजूद होने पर इसे `MEMORY.md` में merge कर सकता है।
    - **State dir (`~/.openclaw`)**: config, channel/provider state, auth profiles, sessions, logs,
      और shared skills (`~/.openclaw/skills`).

    Default workspace `~/.openclaw/workspace` है, जिसे इससे configure किया जा सकता है:

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    अगर restart के बाद बॉट "भूल" जाता है, तो पुष्टि करें कि Gateway हर launch पर वही
    workspace इस्तेमाल कर रहा है (और याद रखें: remote mode **gateway host के**
    workspace का उपयोग करता है, आपके local laptop का नहीं).

    सुझाव: अगर आप durable behavior या preference चाहते हैं, तो chat history पर निर्भर रहने के बजाय बॉट से उसे
    **AGENTS.md या MEMORY.md में लिखने** के लिए कहें।

    [एजेंट workspace](/hi/concepts/agent-workspace) और [मेमोरी](/hi/concepts/memory) देखें।

  </Accordion>

  <Accordion title="क्या मैं SOUL.md को बड़ा बना सकता हूं?">
    हां। `SOUL.md` workspace bootstrap files में से एक है जिसे
    agent context में inject किया जाता है। default per-file injection limit `20000` characters है,
    और files के बीच total bootstrap budget `60000` characters है।

    अपने OpenClaw config में shared defaults बदलें:

    ```json5
    {
      agents: {
        defaults: {
          bootstrapMaxChars: 50000,
          bootstrapTotalMaxChars: 300000,
        },
      },
    }
    ```

    या एक agent को override करें:

    ```json5
    {
      agents: {
        list: [
          {
            id: "main",
            bootstrapMaxChars: 50000,
            bootstrapTotalMaxChars: 300000,
          },
        ],
      },
    }
    ```

    raw बनाम injected sizes और truncation हुआ या नहीं, जांचने के लिए `/context` इस्तेमाल करें।
    `SOUL.md` को voice, stance, और personality पर केंद्रित रखें; operating rules
    `AGENTS.md` में और durable facts memory में रखें।

    [संदर्भ](/hi/concepts/context) और [Agent config](/hi/gateway/config-agents) देखें।

  </Accordion>

  <Accordion title="अनुशंसित backup रणनीति">
    अपने **agent workspace** को **private** git repo में रखें और उसे किसी
    private जगह (उदाहरण के लिए GitHub private) पर backup करें। इससे memory + AGENTS/SOUL/USER
    files capture होती हैं, और आप बाद में assistant के "mind" को restore कर सकते हैं।

    `~/.openclaw` के अंतर्गत कुछ भी commit **न करें** (credentials, sessions, tokens, या encrypted secrets payloads).
    अगर आपको full restore चाहिए, तो workspace और state directory दोनों को
    अलग-अलग backup करें (ऊपर migration question देखें).

    दस्तावेज़: [एजेंट workspace](/hi/concepts/agent-workspace).

  </Accordion>

  <Accordion title="मैं OpenClaw को पूरी तरह uninstall कैसे करूं?">
    समर्पित guide देखें: [Uninstall](/hi/install/uninstall).
  </Accordion>

  <Accordion title="क्या agents workspace के बाहर काम कर सकते हैं?">
    हां। workspace **default cwd** और memory anchor है, hard sandbox नहीं।
    Relative paths workspace के अंदर resolve होते हैं, लेकिन absolute paths दूसरे
    host locations तक access कर सकते हैं, जब तक sandboxing enabled न हो। अगर आपको isolation चाहिए, तो
    [`agents.defaults.sandbox`](/hi/gateway/sandboxing) या per-agent sandbox settings इस्तेमाल करें। अगर आप
    किसी repo को default working directory बनाना चाहते हैं, तो उस agent के
    `workspace` को repo root पर point करें। OpenClaw repo सिर्फ source code है; workspace को
    अलग रखें जब तक आप जानबूझकर agent को उसके अंदर काम कराना न चाहते हों।

    उदाहरण (repo as default cwd):

    ```json5
    {
      agents: {
        defaults: {
          workspace: "~/Projects/my-repo",
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Remote mode: session store कहां है?">
    Session state का owner **gateway host** है। अगर आप remote mode में हैं, तो आपके लिए महत्वपूर्ण session store remote machine पर है, आपके local laptop पर नहीं। [Session management](/hi/concepts/session) देखें।
  </Accordion>
</AccordionGroup>

## Config basics

<AccordionGroup>
  <Accordion title="config का format क्या है? यह कहां है?">
    OpenClaw `$OPENCLAW_CONFIG_PATH` से वैकल्पिक **JSON5** config पढ़ता है (default: `~/.openclaw/openclaw.json`):

    ```
    $OPENCLAW_CONFIG_PATH
    ```

    अगर file missing है, तो यह safe-ish defaults इस्तेमाल करता है (जिसमें `~/.openclaw/workspace` का default workspace शामिल है).

  </Accordion>

  <Accordion title='मैंने gateway.bind: "lan" (या "tailnet") सेट किया और अब कुछ listen नहीं करता / UI unauthorized कहता है'>
    Non-loopback binds के लिए **valid gateway auth path आवश्यक है**। व्यवहार में इसका मतलब है:

    - shared-secret auth: token या password
    - सही तरह configured identity-aware reverse proxy के पीछे `gateway.auth.mode: "trusted-proxy"`

    ```json5
    {
      gateway: {
        bind: "lan",
        auth: {
          mode: "token",
          token: "replace-me",
        },
      },
    }
    ```

    नोट्स:

    - `gateway.remote.token` / `.password` अपने आप local gateway auth enable **नहीं** करते।
    - Local call paths `gateway.auth.*` unset होने पर ही fallback के रूप में `gateway.remote.*` इस्तेमाल कर सकते हैं।
    - Password auth के लिए, इसके बजाय `gateway.auth.mode: "password"` plus `gateway.auth.password` (या `OPENCLAW_GATEWAY_PASSWORD`) सेट करें।
    - अगर `gateway.auth.token` / `gateway.auth.password` SecretRef के जरिए स्पष्ट रूप से configured है और unresolved है, तो resolution fails closed होता है (कोई remote fallback masking नहीं).
    - Shared-secret Control UI setups `connect.params.auth.token` या `connect.params.auth.password` (app/UI settings में stored) के जरिए authenticate करते हैं। Tailscale Serve या `trusted-proxy` जैसे identity-bearing modes इसके बजाय request headers इस्तेमाल करते हैं। URLs में shared secrets डालने से बचें।
    - `gateway.auth.mode: "trusted-proxy"` के साथ, same-host loopback reverse proxies के लिए explicit `gateway.auth.trustedProxy.allowLoopback = true` और `gateway.trustedProxies` में loopback entry चाहिए।

  </Accordion>

  <Accordion title="अब मुझे localhost पर token की जरूरत क्यों है?">
    OpenClaw default रूप से gateway auth enforce करता है, loopback सहित। सामान्य default path में इसका मतलब token auth है: अगर कोई explicit auth path configured नहीं है, तो gateway startup token mode पर resolve होता है और उस startup के लिए runtime-only token generate करता है, इसलिए **local WS clients को authenticate करना होगा**। जब clients को restarts के बीच stable secret चाहिए, तो `gateway.auth.token`, `gateway.auth.password`, `OPENCLAW_GATEWAY_TOKEN`, या `OPENCLAW_GATEWAY_PASSWORD` स्पष्ट रूप से configure करें। यह दूसरे local processes को Gateway call करने से रोकता है।

    यदि आप कोई अलग auth पथ पसंद करते हैं, तो आप स्पष्ट रूप से password mode चुन सकते हैं (या, identity-aware reverse proxies के लिए, `trusted-proxy`)। यदि आप **वास्तव में** open loopback चाहते हैं, तो अपने config में `gateway.auth.mode: "none"` स्पष्ट रूप से सेट करें। Doctor आपके लिए किसी भी समय token बना सकता है: `openclaw doctor --generate-gateway-token`.

  </Accordion>

  <Accordion title="क्या config बदलने के बाद मुझे restart करना होगा?">
    Gateway config को watch करता है और hot-reload का समर्थन करता है:

    - `gateway.reload.mode: "hybrid"` (default): सुरक्षित बदलाव hot-apply करें, महत्वपूर्ण बदलावों के लिए restart करें
    - `hot`, `restart`, `off` भी समर्थित हैं

  </Accordion>

  <Accordion title="मैं मजेदार CLI taglines कैसे बंद करूं?">
    config में `cli.banner.taglineMode` सेट करें:

    ```json5
    {
      cli: {
        banner: {
          taglineMode: "off", // random | default | off
        },
      },
    }
    ```

    - `off`: tagline text छिपाता है लेकिन banner title/version line रखता है।
    - `default`: हर बार `All your chats, one OpenClaw.` का उपयोग करता है।
    - `random`: घूमती हुई मजेदार/मौसमी taglines (default व्यवहार)।
    - यदि आप कोई banner बिल्कुल नहीं चाहते, तो env `OPENCLAW_HIDE_BANNER=1` सेट करें।

  </Accordion>

  <Accordion title="मैं web search (और web fetch) कैसे enable करूं?">
    `web_fetch` API key के बिना काम करता है। `web_search` आपके चुने हुए
    provider पर निर्भर करता है:

    - Brave, Exa, Firecrawl, Gemini, Kimi, MiniMax Search, Perplexity, और Tavily जैसे API-backed providers को उनके सामान्य API key setup की आवश्यकता होती है।
    - Grok model auth से xAI OAuth का पुनः उपयोग कर सकता है, या `XAI_API_KEY` / plugin web-search config पर fall back कर सकता है।
    - Ollama Web Search key-free है, लेकिन यह आपके configured Ollama host का उपयोग करता है और `ollama signin` की आवश्यकता होती है।
    - DuckDuckGo key-free है, लेकिन यह एक unofficial HTML-based integration है।
    - SearXNG key-free/self-hosted है; `SEARXNG_BASE_URL` या `plugins.entries.searxng.config.webSearch.baseUrl` configure करें।

    **अनुशंसित:** `openclaw configure --section web` चलाएं और कोई provider चुनें।
    Environment alternatives:

    - Brave: `BRAVE_API_KEY`
    - Exa: `EXA_API_KEY`
    - Firecrawl: `FIRECRAWL_API_KEY`
    - Gemini: `GEMINI_API_KEY`
    - Grok: xAI OAuth, `XAI_API_KEY`
    - Kimi: `KIMI_API_KEY` या `MOONSHOT_API_KEY`
    - MiniMax Search: `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`, या `MINIMAX_API_KEY`
    - Perplexity: `PERPLEXITY_API_KEY` या `OPENROUTER_API_KEY`
    - SearXNG: `SEARXNG_BASE_URL`
    - Tavily: `TAVILY_API_KEY`

    ```json5
    {
      plugins: {
        entries: {
          brave: {
            config: {
              webSearch: {
                apiKey: "BRAVE_API_KEY_HERE",
              },
            },
          },
        },
        },
        tools: {
          web: {
            search: {
              enabled: true,
              provider: "brave",
              maxResults: 5,
            },
            fetch: {
              enabled: true,
              provider: "firecrawl", // optional; omit for auto-detect
            },
          },
        },
    }
    ```

    Provider-specific web-search config अब `plugins.entries.<plugin>.config.webSearch.*` के अंतर्गत रहता है।
    Legacy `tools.web.search.*` provider paths compatibility के लिए अभी अस्थायी रूप से load होते हैं, लेकिन उन्हें नए configs के लिए उपयोग नहीं करना चाहिए।
    Firecrawl web-fetch fallback config `plugins.entries.firecrawl.config.webFetch.*` के अंतर्गत रहता है।

    Notes:

    - यदि आप allowlists का उपयोग करते हैं, तो `web_search`/`web_fetch`/`x_search` या `group:web` जोड़ें।
    - `web_fetch` default रूप से enabled है (जब तक स्पष्ट रूप से disabled न हो)।
    - यदि `tools.web.fetch.provider` omitted है, तो OpenClaw उपलब्ध credentials से पहला ready fetch fallback provider auto-detect करता है। Official Firecrawl plugin वह fallback प्रदान करता है।
    - Daemons env vars को `~/.openclaw/.env` (या service environment) से पढ़ते हैं।

    Docs: [Web tools](/hi/tools/web).

  </Accordion>

  <Accordion title="config.apply ने मेरा config मिटा दिया। मैं इसे कैसे recover करूं और इससे कैसे बचूं?">
    `config.apply` **पूरे config** को replace करता है। यदि आप partial object भेजते हैं, तो बाकी सब
    remove हो जाता है।

    Current OpenClaw कई accidental clobbers से बचाता है:

    - OpenClaw-owned config writes लिखने से पहले full post-change config validate करते हैं।
    - Invalid या destructive OpenClaw-owned writes reject कर दिए जाते हैं और `openclaw.json.rejected.*` के रूप में save होते हैं।
    - यदि direct edit startup या hot reload तोड़ देता है, तो Gateway fail closed होता है या reload skip करता है; यह `openclaw.json` rewrite नहीं करता।
    - `openclaw doctor --fix` repair का owner है और rejected file को `openclaw.json.clobbered.*` के रूप में save करते हुए last-known-good restore कर सकता है।

    Recover करें:

    - `Invalid config at`, `Config write rejected:`, या `config reload skipped (invalid config)` के लिए `openclaw logs --follow` check करें।
    - Active config के पास सबसे नए `openclaw.json.clobbered.*` या `openclaw.json.rejected.*` को inspect करें।
    - `openclaw config validate` और `openclaw doctor --fix` चलाएं।
    - केवल intended keys को `openclaw config set` या `config.patch` के साथ वापस copy करें।
    - यदि आपके पास कोई last-known-good या rejected payload नहीं है, तो backup से restore करें, या `openclaw doctor` दोबारा चलाएं और channels/models reconfigure करें।
    - यदि यह unexpected था, तो bug file करें और अपना last known config या कोई backup शामिल करें।
    - एक local coding agent अक्सर logs या history से working config reconstruct कर सकता है।

    इससे बचें:

    - छोटे बदलावों के लिए `openclaw config set` का उपयोग करें।
    - Interactive edits के लिए `openclaw configure` का उपयोग करें।
    - जब आप exact path या field shape के बारे में sure न हों, तो पहले `config.schema.lookup` का उपयोग करें; यह drill-down के लिए shallow schema node और immediate child summaries लौटाता है।
    - Partial RPC edits के लिए `config.patch` का उपयोग करें; `config.apply` को केवल full-config replacement के लिए रखें।
    - यदि आप agent run से agent-facing `gateway` tool का उपयोग कर रहे हैं, तो यह फिर भी `tools.exec.ask` / `tools.exec.security` (legacy `tools.bash.*` aliases सहित, जो उन्हीं protected exec paths में normalize होते हैं) पर writes reject करेगा।

    Docs: [Config](/hi/cli/config), [Configure](/hi/cli/configure), [Gateway troubleshooting](/hi/gateway/troubleshooting#gateway-rejected-invalid-config), [Doctor](/hi/gateway/doctor).

  </Accordion>

  <Accordion title="मैं devices पर specialized workers के साथ central Gateway कैसे चलाऊं?">
    Common pattern **एक Gateway** (जैसे Raspberry Pi) plus **nodes** और **agents** है:

    - **Gateway (central):** channels (Signal/WhatsApp), routing, और sessions का owner होता है।
    - **Nodes (devices):** Macs/iOS/Android peripherals के रूप में connect होते हैं और local tools (`system.run`, `canvas`, `camera`) expose करते हैं।
    - **Agents (workers):** special roles (जैसे "Hetzner ops", "Personal data") के लिए separate brains/workspaces।
    - **Sub-agents:** जब आप parallelism चाहते हैं, तो main agent से background work spawn करें।
    - **TUI:** Gateway से connect करें और agents/sessions switch करें।

    Docs: [Nodes](/hi/nodes), [Remote access](/hi/gateway/remote), [Multi-Agent Routing](/hi/concepts/multi-agent), [Sub-agents](/hi/tools/subagents), [TUI](/hi/web/tui).

  </Accordion>

  <Accordion title="क्या OpenClaw browser headless चल सकता है?">
    हां। यह एक config option है:

    ```json5
    {
      browser: { headless: true },
      agents: {
        defaults: {
          sandbox: { browser: { headless: true } },
        },
      },
    }
    ```

    Default `false` (headful) है। Headless कुछ sites पर anti-bot checks trigger करने की अधिक संभावना रखता है। [Browser](/hi/tools/browser) देखें।

    Headless **उसी Chromium engine** का उपयोग करता है और अधिकांश automation (forms, clicks, scraping, logins) के लिए काम करता है। मुख्य अंतर:

    - कोई visible browser window नहीं (यदि आपको visuals चाहिए तो screenshots का उपयोग करें)।
    - कुछ sites headless mode में automation को लेकर अधिक strict होती हैं (CAPTCHAs, anti-bot)।
      उदाहरण के लिए, X/Twitter अक्सर headless sessions block करता है।

  </Accordion>

  <Accordion title="मैं browser control के लिए Brave का उपयोग कैसे करूं?">
    `browser.executablePath` को अपने Brave binary (या किसी भी Chromium-based browser) पर set करें और Gateway restart करें।
    Full config examples [Browser](/hi/tools/browser#use-brave-or-another-chromium-based-browser) में देखें।
  </Accordion>
</AccordionGroup>

## Remote gateways और nodes

<AccordionGroup>
  <Accordion title="Telegram, gateway, और nodes के बीच commands कैसे propagate होते हैं?">
    Telegram messages **gateway** द्वारा handle किए जाते हैं। gateway agent चलाता है और
    node tool की आवश्यकता होने पर ही **Gateway WebSocket** पर nodes को call करता है:

    Telegram → Gateway → Agent → `node.*` → Node → Gateway → Telegram

    Nodes inbound provider traffic नहीं देखते; वे केवल node RPC calls receive करते हैं।

  </Accordion>

  <Accordion title="यदि Gateway remotely hosted है, तो मेरा agent मेरे computer को कैसे access कर सकता है?">
    संक्षिप्त उत्तर: **अपने computer को node के रूप में pair करें**। Gateway कहीं और चलता है, लेकिन यह
    Gateway WebSocket पर आपकी local machine पर `node.*` tools (screen, camera, system) call कर सकता है।

    Typical setup:

    1. Always-on host (VPS/home server) पर Gateway चलाएं।
    2. Gateway host + अपने computer को same tailnet पर रखें।
    3. Ensure करें कि Gateway WS reachable है (tailnet bind या SSH tunnel)।
    4. macOS app को locally खोलें और **Remote over SSH** mode (या direct tailnet) में connect करें
       ताकि वह node के रूप में register हो सके।
    5. Gateway पर node approve करें:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    अलग TCP bridge की आवश्यकता नहीं है; nodes Gateway WebSocket पर connect होते हैं।

    Security reminder: macOS node pair करने से उस machine पर `system.run` की अनुमति मिलती है। केवल
    उन devices को pair करें जिन पर आप trust करते हैं, और [Security](/hi/gateway/security) review करें।

    Docs: [Nodes](/hi/nodes), [Gateway protocol](/hi/gateway/protocol), [macOS remote mode](/hi/platforms/mac/remote), [Security](/hi/gateway/security).

  </Accordion>

  <Accordion title="Tailscale connected है लेकिन मुझे replies नहीं मिल रहे। अब क्या करूं?">
    Basics check करें:

    - Gateway running है: `openclaw gateway status`
    - Gateway health: `openclaw status`
    - Channel health: `openclaw channels status`

    फिर auth और routing verify करें:

    - यदि आप Tailscale Serve का उपयोग करते हैं, तो सुनिश्चित करें कि `gateway.auth.allowTailscale` सही तरह set है।
    - यदि आप SSH tunnel के जरिए connect करते हैं, तो confirm करें कि local tunnel up है और right port की ओर point करता है।
    - Confirm करें कि आपकी allowlists (DM या group) में आपका account शामिल है।

    Docs: [Tailscale](/hi/gateway/tailscale), [Remote access](/hi/gateway/remote), [Channels](/hi/channels).

  </Accordion>

  <Accordion title="क्या दो OpenClaw instances एक-दूसरे से बात कर सकते हैं (local + VPS)?">
    हां। कोई built-in "bot-to-bot" bridge नहीं है, लेकिन आप इसे कुछ
    reliable तरीकों से wire up कर सकते हैं:

    **सबसे सरल:** कोई normal chat channel उपयोग करें जिसे दोनों bots access कर सकें (Telegram/Slack/WhatsApp)।
    Bot A से Bot B को message भेजवाएं, फिर Bot B को usual तरीके से reply करने दें।

    **CLI bridge (generic):** ऐसा script चलाएं जो दूसरे Gateway को
    `openclaw agent --message ... --deliver` के साथ call करे, ऐसे chat को target करते हुए जहां दूसरा bot
    listen करता है। यदि एक bot remote VPS पर है, तो अपने CLI को SSH/Tailscale के जरिए उस remote Gateway
    पर point करें ([Remote access](/hi/gateway/remote) देखें)।

    Example pattern (ऐसी machine से चलाएं जो target Gateway तक पहुंच सके):

    ```bash
    openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    Tip: guardrail जोड़ें ताकि दोनों bots endlessly loop न करें (mention-only, channel
    allowlists, या "bot messages का reply न करें" rule)।

    Docs: [Remote access](/hi/gateway/remote), [Agent CLI](/hi/cli/agent), [Agent send](/hi/tools/agent-send).

  </Accordion>

  <Accordion title="क्या मुझे multiple agents के लिए separate VPSes चाहिए?">
    नहीं। एक Gateway multiple agents host कर सकता है, प्रत्येक का अपना workspace, model defaults,
    और routing होता है। यही normal setup है और यह प्रति agent एक VPS चलाने से बहुत cheaper और simpler है।

    Separate VPSes का उपयोग केवल तब करें जब आपको hard isolation (security boundaries) या बहुत
    अलग configs चाहिए जिन्हें आप share नहीं करना चाहते। अन्यथा, एक Gateway रखें और
    multiple agents या sub-agents का उपयोग करें।

  </Accordion>

  <Accordion title="क्या VPS से SSH करने के बजाय मेरे व्यक्तिगत लैपटॉप पर node इस्तेमाल करने का कोई लाभ है?">
    हां - nodes दूरस्थ Gateway से आपके लैपटॉप तक पहुंचने का प्रथम-श्रेणी तरीका हैं, और वे
    shell access से अधिक क्षमताएं खोलते हैं। Gateway macOS/Linux (WSL2 के माध्यम से Windows) पर चलता है और
    हल्का है (छोटा VPS या Raspberry Pi-श्रेणी का बॉक्स ठीक है; 4 GB RAM पर्याप्त है), इसलिए एक सामान्य
    सेटअप हमेशा-चालू host और आपके लैपटॉप को node के रूप में रखना है।

    - **इनबाउंड SSH की आवश्यकता नहीं।** Nodes Gateway WebSocket से बाहर की ओर कनेक्ट होते हैं और device pairing का उपयोग करते हैं।
    - **सुरक्षित execution controls।** `system.run` उस लैपटॉप पर node allowlists/approvals द्वारा नियंत्रित होता है।
    - **अधिक device tools।** Nodes `system.run` के अतिरिक्त `canvas`, `camera`, और `screen` उपलब्ध कराते हैं।
    - **स्थानीय browser automation।** Gateway को VPS पर रखें, लेकिन लैपटॉप पर node host के माध्यम से Chrome स्थानीय रूप से चलाएं, या Chrome MCP के जरिए host पर स्थानीय Chrome से जुड़ें।

    SSH तदर्थ shell access के लिए ठीक है, लेकिन ongoing agent workflows और
    device automation के लिए nodes अधिक सरल हैं।

    Docs: [Nodes](/hi/nodes), [Nodes CLI](/hi/cli/nodes), [Browser](/hi/tools/browser).

  </Accordion>

  <Accordion title="क्या nodes gateway service चलाते हैं?">
    नहीं। प्रति host केवल **एक gateway** चलना चाहिए, जब तक कि आप जानबूझकर isolated profiles न चला रहे हों (देखें [Multiple gateways](/hi/gateway/multiple-gateways)). Nodes peripherals हैं जो gateway से कनेक्ट होते हैं
    (iOS/Android nodes, या menubar app में macOS "node mode"). headless node
    hosts और CLI control के लिए, देखें [Node host CLI](/hi/cli/node).

    `gateway`, `discovery`, और hosted plugin surface changes के लिए full restart आवश्यक है।

  </Accordion>

  <Accordion title="क्या config apply करने का कोई API / RPC तरीका है?">
    हां।

    - `config.schema.lookup`: लिखने से पहले एक config subtree को उसके shallow schema node, matched UI hint, और immediate child summaries के साथ inspect करें
    - `config.get`: current snapshot + hash fetch करें
    - `config.patch`: सुरक्षित partial update (अधिकांश RPC edits के लिए पसंदीदा); संभव होने पर hot-reload करता है और आवश्यक होने पर restart करता है
    - `config.apply`: full config को validate + replace करें; संभव होने पर hot-reload करता है और आवश्यक होने पर restart करता है
    - agent-facing `gateway` runtime tool अभी भी `tools.exec.ask` / `tools.exec.security` को rewrite करने से मना करता है; legacy `tools.bash.*` aliases उसी protected exec paths में normalize होते हैं

  </Accordion>

  <Accordion title="पहले install के लिए न्यूनतम समझदार config">
    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
      channels: { whatsapp: { allowFrom: ["+15555550123"] } },
    }
    ```

    यह आपका workspace सेट करता है और यह सीमित करता है कि bot को कौन trigger कर सकता है।

  </Accordion>

  <Accordion title="मैं VPS पर Tailscale कैसे set up करूं और अपने Mac से कैसे connect करूं?">
    न्यूनतम steps:

    1. **VPS पर install + login करें**

       ```bash
       curl -fsSL https://tailscale.com/install.sh | sh
       sudo tailscale up
       ```

    2. **अपने Mac पर install + login करें**
       - Tailscale app का उपयोग करें और उसी tailnet में sign in करें।
    3. **MagicDNS enable करें (recommended)**
       - Tailscale admin console में, MagicDNS enable करें ताकि VPS का stable name हो।
    4. **tailnet hostname का उपयोग करें**
       - SSH: `ssh user@your-vps.tailnet-xxxx.ts.net`
       - Gateway WS: `ws://your-vps.tailnet-xxxx.ts.net:18789`

    यदि आप SSH के बिना Control UI चाहते हैं, तो VPS पर Tailscale Serve का उपयोग करें:

    ```bash
    openclaw gateway --tailscale serve
    ```

    यह gateway को loopback से bound रखता है और Tailscale के जरिए HTTPS expose करता है। देखें [Tailscale](/hi/gateway/tailscale).

  </Accordion>

  <Accordion title="मैं Mac node को remote Gateway (Tailscale Serve) से कैसे connect करूं?">
    Serve **Gateway Control UI + WS** को expose करता है। Nodes उसी Gateway WS endpoint पर connect होते हैं।

    Recommended setup:

    1. **सुनिश्चित करें कि VPS + Mac एक ही tailnet पर हैं**।
    2. **Remote mode में macOS app का उपयोग करें** (SSH target tailnet hostname हो सकता है)।
       app Gateway port को tunnel करेगा और node के रूप में connect करेगा।
    3. gateway पर **node approve करें**:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Docs: [Gateway protocol](/hi/gateway/protocol), [Discovery](/hi/gateway/discovery), [macOS remote mode](/hi/platforms/mac/remote).

  </Accordion>

  <Accordion title="क्या मुझे दूसरे लैपटॉप पर install करना चाहिए या बस node add करना चाहिए?">
    यदि आपको दूसरे लैपटॉप पर केवल **local tools** (screen/camera/exec) चाहिए, तो उसे
    **node** के रूप में add करें। इससे single Gateway रहता है और duplicated config से बचा जाता है। Local node tools
    फिलहाल केवल macOS पर हैं, लेकिन हम उन्हें अन्य OSes तक बढ़ाने की योजना रखते हैं।

    दूसरा Gateway केवल तभी install करें जब आपको **hard isolation** या दो पूरी तरह अलग bots चाहिए हों।

    Docs: [Nodes](/hi/nodes), [Nodes CLI](/hi/cli/nodes), [Multiple gateways](/hi/gateway/multiple-gateways).

  </Accordion>
</AccordionGroup>

## Env vars और .env loading

<AccordionGroup>
  <Accordion title="OpenClaw environment variables कैसे load करता है?">
    OpenClaw parent process (shell, launchd/systemd, CI, आदि) से env vars पढ़ता है और अतिरिक्त रूप से load करता है:

    - current working directory से `.env`
    - `~/.openclaw/.env` (अर्थात `$OPENCLAW_STATE_DIR/.env`) से global fallback `.env`

    कोई भी `.env` file मौजूदा env vars को override नहीं करती।
    Provider credential variables workspace `.env` के लिए exception हैं: जैसे keys
    `GEMINI_API_KEY`, `XAI_API_KEY`, या `MISTRAL_API_KEY` workspace
    `.env` से ignore की जाती हैं और process environment, `~/.openclaw/.env`, या config `env` में होनी चाहिए।

    आप config में inline env vars भी define कर सकते हैं (केवल process env से missing होने पर apply होते हैं):

    ```json5
    {
      env: {
        OPENROUTER_API_KEY: "sk-or-...",
        vars: { GROQ_API_KEY: "gsk-..." },
      },
    }
    ```

    full precedence और sources के लिए देखें [/environment](/hi/help/environment).

  </Accordion>

  <Accordion title="मैंने service के जरिए Gateway start किया और मेरे env vars गायब हो गए। अब क्या?">
    दो सामान्य fixes:

    1. missing keys को `~/.openclaw/.env` में रखें ताकि वे तब भी pick up हों जब service आपके shell env को inherit नहीं करती।
    2. shell import enable करें (opt-in convenience):

    ```json5
    {
      env: {
        shellEnv: {
          enabled: true,
          timeoutMs: 15000,
        },
      },
    }
    ```

    यह आपकी login shell चलाता है और केवल missing expected keys import करता है (कभी override नहीं करता)। Env var equivalents:
    `OPENCLAW_LOAD_SHELL_ENV=1`, `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`.

  </Accordion>

  <Accordion title='मैंने COPILOT_GITHUB_TOKEN set किया, लेकिन models status "Shell env: off." दिखाता है। क्यों?'>
    `openclaw models status` बताता है कि **shell env import** enabled है या नहीं। "Shell env: off"
    का मतलब यह **नहीं** है कि आपके env vars missing हैं - इसका मतलब सिर्फ इतना है कि OpenClaw
    आपकी login shell को automatically load नहीं करेगा।

    यदि Gateway service (launchd/systemd) के रूप में चलता है, तो यह आपके shell
    environment को inherit नहीं करेगा। इनमें से एक करके fix करें:

    1. token को `~/.openclaw/.env` में रखें:

       ```
       COPILOT_GITHUB_TOKEN=...
       ```

    2. या shell import enable करें (`env.shellEnv.enabled: true`)।
    3. या इसे अपने config `env` block में add करें (केवल missing होने पर apply होता है)।

    फिर gateway restart करें और recheck करें:

    ```bash
    openclaw models status
    ```

    Copilot tokens `COPILOT_GITHUB_TOKEN` (साथ ही `GH_TOKEN` / `GITHUB_TOKEN`) से read किए जाते हैं।
    देखें [/concepts/model-providers](/hi/concepts/model-providers) और [/environment](/hi/help/environment).

  </Accordion>
</AccordionGroup>

## Sessions और कई chats

<AccordionGroup>
  <Accordion title="मैं fresh conversation कैसे start करूं?">
    standalone message के रूप में `/new` या `/reset` भेजें। देखें [Session management](/hi/concepts/session).
  </Accordion>

  <Accordion title="यदि मैं कभी /new नहीं भेजता, तो क्या sessions automatically reset होते हैं?">
    Sessions `session.idleMinutes` के बाद expire हो सकते हैं, लेकिन यह **default रूप से disabled** है (default **0**)।
    idle expiry enable करने के लिए इसे positive value पर set करें। Enabled होने पर, idle period के बाद **अगला**
    message उस chat key के लिए fresh session id start करता है।
    यह transcripts delete नहीं करता - यह बस new session start करता है।

    ```json5
    {
      session: {
        idleMinutes: 240,
      },
    }
    ```

  </Accordion>

  <Accordion title="क्या OpenClaw instances की team बनाने का कोई तरीका है (एक CEO और कई agents)?">
    हां, **multi-agent routing** और **sub-agents** के जरिए। आप एक coordinator
    agent और अपने workspaces तथा models वाले कई worker agents बना सकते हैं।

    फिर भी, इसे **मजेदार experiment** के रूप में देखना बेहतर है। यह token heavy है और अक्सर
    separate sessions वाले एक bot का उपयोग करने से कम efficient होता है। हम जिस typical model की
    कल्पना करते हैं, वह एक bot है जिससे आप बात करते हैं, parallel work के लिए different sessions के साथ। वह
    bot जरूरत पड़ने पर sub-agents भी spawn कर सकता है।

    Docs: [Multi-agent routing](/hi/concepts/multi-agent), [Sub-agents](/hi/tools/subagents), [Agents CLI](/hi/cli/agents).

  </Accordion>

  <Accordion title="context mid-task में truncate क्यों हो गया? मैं इसे कैसे रोकूं?">
    Session context model window से limited होता है। Long chats, large tool outputs, या कई
    files compaction या truncation trigger कर सकते हैं।

    क्या मदद करता है:

    - bot से current state summarize करने और उसे file में write करने को कहें।
    - long tasks से पहले `/compact`, और topics switch करते समय `/new` का उपयोग करें।
    - महत्वपूर्ण context workspace में रखें और bot से उसे read back करने को कहें।
    - long या parallel work के लिए sub-agents का उपयोग करें ताकि main chat छोटा रहे।
    - यदि यह अक्सर होता है तो larger context window वाला model चुनें।

  </Accordion>

  <Accordion title="मैं OpenClaw को पूरी तरह reset कैसे करूं लेकिन installed रखूं?">
    reset command का उपयोग करें:

    ```bash
    openclaw reset
    ```

    Non-interactive full reset:

    ```bash
    openclaw reset --scope full --yes --non-interactive
    ```

    फिर setup दोबारा चलाएं:

    ```bash
    openclaw onboard --install-daemon
    ```

    Notes:

    - यदि onboarding existing config देखता है तो वह **Reset** भी offer करता है। देखें [Onboarding (CLI)](/hi/start/wizard).
    - यदि आपने profiles (`--profile` / `OPENCLAW_PROFILE`) का उपयोग किया है, तो प्रत्येक state dir reset करें (defaults `~/.openclaw-<profile>` हैं)।
    - Dev reset: `openclaw gateway --dev --reset` (dev-only; dev config + credentials + sessions + workspace wipe करता है)।

  </Accordion>

  <Accordion title='मुझे "context too large" errors मिल रहे हैं - मैं reset या compact कैसे करूं?'>
    इनमें से एक का उपयोग करें:

    - **Compact** (conversation रखता है लेकिन older turns summarize करता है):

      ```
      /compact
      ```

      या summary guide करने के लिए `/compact <instructions>`।

    - **Reset** (same chat key के लिए fresh session ID):

      ```
      /new
      /reset
      ```

    यदि यह चलता रहता है:

    - old tool output trim करने के लिए **session pruning** (`agents.defaults.contextPruning`) enable या tune करें।
    - larger context window वाला model उपयोग करें।

    Docs: [Compaction](/hi/concepts/compaction), [Session pruning](/hi/concepts/session-pruning), [Session management](/hi/concepts/session).

  </Accordion>

  <Accordion title='मुझे "LLM request rejected: messages.content.tool_use.input field required" क्यों दिख रहा है?'>
    यह provider validation error है: model ने required
    `input` के बिना `tool_use` block emit किया। आमतौर पर इसका मतलब है कि session history stale या corrupted है (अक्सर long threads
    या tool/schema change के बाद)।

    Fix: `/new` (standalone message) के साथ fresh session start करें।

  </Accordion>

  <Accordion title="मुझे हर 30 minutes heartbeat messages क्यों मिल रहे हैं?">
    Heartbeats default रूप से हर **30m** पर चलते हैं (OAuth auth का उपयोग करते समय **1h**)। उन्हें tune या disable करें:

    ```json5
    {
      agents: {
        defaults: {
          heartbeat: {
            every: "2h", // or "0m" to disable
          },
        },
      },
    }
    ```

    यदि `HEARTBEAT.md` मौजूद है लेकिन प्रभावी रूप से खाली है (सिर्फ़ खाली पंक्तियां,
    Markdown/HTML टिप्पणियां, `# Heading` जैसी Markdown हेडिंग, फ़ेंस मार्कर,
    या खाली चेकलिस्ट स्टब), तो OpenClaw API कॉल बचाने के लिए Heartbeat रन छोड़ देता है.
    यदि फ़ाइल गायब है, तो Heartbeat फिर भी चलता है और मॉडल तय करता है कि क्या करना है.

    प्रति-एजेंट ओवरराइड `agents.list[].heartbeat` का उपयोग करते हैं. दस्तावेज़: [Heartbeat](/hi/gateway/heartbeat).

  </Accordion>

  <Accordion title='क्या मुझे WhatsApp समूह में "बॉट खाता" जोड़ना होगा?'>
    नहीं. OpenClaw **आपके अपने खाते** पर चलता है, इसलिए यदि आप समूह में हैं, तो OpenClaw उसे देख सकता है.
    डिफ़ॉल्ट रूप से, समूह जवाब तब तक ब्लॉक रहते हैं जब तक आप भेजने वालों को अनुमति नहीं देते (`groupPolicy: "allowlist"`).

    यदि आप चाहते हैं कि केवल **आप** समूह जवाब ट्रिगर कर सकें:

    ```json5
    {
      channels: {
        whatsapp: {
          groupPolicy: "allowlist",
          groupAllowFrom: ["+15551234567"],
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="मैं WhatsApp समूह का JID कैसे पाऊं?">
    विकल्प 1 (सबसे तेज़): लॉग टेल करें और समूह में एक परीक्षण संदेश भेजें:

    ```bash
    openclaw logs --follow --json
    ```

    `@g.us` पर समाप्त होने वाला `chatId` (या `from`) देखें, जैसे:
    `1234567890-1234567890@g.us`.

    विकल्प 2 (यदि पहले से कॉन्फ़िगर/अनुमति-सूचीबद्ध है): कॉन्फ़िग से समूहों की सूची लें:

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    दस्तावेज़: [WhatsApp](/hi/channels/whatsapp), [डायरेक्टरी](/hi/cli/directory), [लॉग](/hi/cli/logs).

  </Accordion>

  <Accordion title="OpenClaw समूह में जवाब क्यों नहीं देता?">
    दो सामान्य कारण:

    - मेंशन गेटिंग चालू है (डिफ़ॉल्ट). आपको बॉट को @mention करना होगा (या `mentionPatterns` से मिलान करना होगा).
    - आपने `channels.whatsapp.groups` को `"*"` के बिना कॉन्फ़िगर किया है और समूह अनुमति-सूचीबद्ध नहीं है.

    [समूह](/hi/channels/groups) और [समूह संदेश](/hi/channels/group-messages) देखें.

  </Accordion>

  <Accordion title="क्या समूह/थ्रेड DM के साथ संदर्भ साझा करते हैं?">
    प्रत्यक्ष चैट डिफ़ॉल्ट रूप से मुख्य सत्र में समाहित हो जाती हैं. समूह/चैनल की अपनी सत्र कुंजियां होती हैं, और Telegram टॉपिक / Discord थ्रेड अलग सत्र होते हैं. [समूह](/hi/channels/groups) और [समूह संदेश](/hi/channels/group-messages) देखें.
  </Accordion>

  <Accordion title="मैं कितने वर्कस्पेस और एजेंट बना सकता हूं?">
    कोई कठोर सीमा नहीं. दर्जनों (यहां तक कि सैकड़ों) ठीक हैं, लेकिन इन पर नज़र रखें:

    - **डिस्क वृद्धि:** सत्र + ट्रांसक्रिप्ट `~/.openclaw/agents/<agentId>/sessions/` के अंतर्गत रहते हैं.
    - **टोकन लागत:** अधिक एजेंट का मतलब अधिक समवर्ती मॉडल उपयोग.
    - **ऑप्स ओवरहेड:** प्रति-एजेंट प्रमाणीकरण प्रोफ़ाइल, वर्कस्पेस, और चैनल रूटिंग.

    सुझाव:

    - प्रति एजेंट एक **सक्रिय** वर्कस्पेस रखें (`agents.defaults.workspace`).
    - यदि डिस्क बढ़ती है तो पुराने सत्रों को छांटें (JSONL या स्टोर प्रविष्टियां हटाएं).
    - भटके हुए वर्कस्पेस और प्रोफ़ाइल बेमेलियों को पहचानने के लिए `openclaw doctor` उपयोग करें.

  </Accordion>

  <Accordion title="क्या मैं एक ही समय में कई बॉट या चैट चला सकता हूं (Slack), और मुझे इसे कैसे सेट करना चाहिए?">
    हां. कई पृथक एजेंट चलाने और आने वाले संदेशों को
    चैनल/खाता/पीयर के आधार पर रूट करने के लिए **मल्टी-एजेंट रूटिंग** उपयोग करें. Slack एक चैनल के रूप में समर्थित है और विशिष्ट एजेंटों से बांधा जा सकता है.

    ब्राउज़र एक्सेस शक्तिशाली है, लेकिन "मानव जो कुछ भी कर सकता है वह सब करें" नहीं है - एंटी-बॉट, CAPTCHA, और MFA
    अभी भी ऑटोमेशन को रोक सकते हैं. सबसे भरोसेमंद ब्राउज़र नियंत्रण के लिए, होस्ट पर लोकल Chrome MCP उपयोग करें,
    या उस मशीन पर CDP उपयोग करें जो वास्तव में ब्राउज़र चलाती है.

    सर्वोत्तम अभ्यास सेटअप:

    - हमेशा चालू Gateway होस्ट (VPS/Mac mini).
    - प्रति भूमिका एक एजेंट (बाइंडिंग).
    - उन एजेंटों से बंधे Slack चैनल.
    - आवश्यकता होने पर Chrome MCP या किसी नोड के माध्यम से लोकल ब्राउज़र.

    दस्तावेज़: [मल्टी-एजेंट रूटिंग](/hi/concepts/multi-agent), [Slack](/hi/channels/slack),
    [ब्राउज़र](/hi/tools/browser), [नोड](/hi/nodes).

  </Accordion>
</AccordionGroup>

## मॉडल, फेलओवर, और प्रमाणीकरण प्रोफ़ाइल

मॉडल प्रश्नोत्तर — डिफ़ॉल्ट, चयन, उपनाम, स्विचिंग, फेलओवर, प्रमाणीकरण प्रोफ़ाइल —
[मॉडल FAQ](/hi/help/faq-models) पर है.

## Gateway: पोर्ट, "पहले से चल रहा है", और रिमोट मोड

<AccordionGroup>
  <Accordion title="Gateway कौन सा पोर्ट उपयोग करता है?">
    `gateway.port` WebSocket + HTTP (कंट्रोल UI, हुक, आदि) के लिए एकल मल्टीप्लेक्स्ड पोर्ट नियंत्रित करता है.

    प्राथमिकता:

    ```
    --port > OPENCLAW_GATEWAY_PORT > gateway.port > default 18789
    ```

  </Accordion>

  <Accordion title='openclaw gateway status "Runtime: running" लेकिन "Connectivity probe: failed" क्यों कहता है?'>
    क्योंकि "running" **सुपरवाइज़र** का दृष्टिकोण है (launchd/systemd/schtasks). कनेक्टिविटी प्रोब CLI है जो वास्तव में Gateway WebSocket से जुड़ रहा है.

    `openclaw gateway status` उपयोग करें और इन पंक्तियों पर भरोसा करें:

    - `Probe target:` (वह URL जिसे प्रोब ने वास्तव में उपयोग किया)
    - `Listening:` (पोर्ट पर वास्तव में क्या बाउंड है)
    - `Last gateway error:` (जब प्रक्रिया जीवित है लेकिन पोर्ट सुन नहीं रहा होता, तब सामान्य मूल कारण)

  </Accordion>

  <Accordion title='openclaw gateway status में "Config (cli)" और "Config (service)" अलग क्यों दिखते हैं?'>
    आप एक कॉन्फ़िग फ़ाइल संपादित कर रहे हैं जबकि सेवा दूसरी चला रही है (अक्सर `--profile` / `OPENCLAW_STATE_DIR` बेमेली).

    ठीक करें:

    ```bash
    openclaw gateway install --force
    ```

    इसे उसी `--profile` / वातावरण से चलाएं जिसे आप सेवा द्वारा उपयोग कराना चाहते हैं.

  </Accordion>

  <Accordion title='"another gateway instance is already listening" का क्या मतलब है?'>
    OpenClaw स्टार्टअप पर WebSocket लिस्नर को तुरंत बांधकर रनटाइम लॉक लागू करता है (डिफ़ॉल्ट `ws://127.0.0.1:18789`). यदि बाइंड `EADDRINUSE` के साथ विफल होता है, तो यह `GatewayLockError` फेंकता है जो बताता है कि कोई दूसरा इंस्टेंस पहले से सुन रहा है.

    ठीक करें: दूसरा इंस्टेंस रोकें, पोर्ट खाली करें, या `openclaw gateway --port <port>` के साथ चलाएं.

  </Accordion>

  <Accordion title="मैं OpenClaw को रिमोट मोड में कैसे चलाऊं (क्लाइंट कहीं और मौजूद Gateway से जुड़े)?">
    `gateway.mode: "remote"` सेट करें और साझा-सीक्रेट रिमोट क्रेडेंशियल के साथ वैकल्पिक रूप से किसी रिमोट WebSocket URL की ओर इंगित करें:

    ```json5
    {
      gateway: {
        mode: "remote",
        remote: {
          url: "ws://gateway.tailnet:18789",
          token: "your-token",
          password: "your-password",
        },
      },
    }
    ```

    नोट:

    - `openclaw gateway` केवल तब शुरू होता है जब `gateway.mode` `local` हो (या आप ओवरराइड फ़्लैग पास करें).
    - macOS ऐप कॉन्फ़िग फ़ाइल देखता है और इन मानों के बदलने पर लाइव मोड बदलता है.
    - `gateway.remote.token` / `.password` केवल क्लाइंट-साइड रिमोट क्रेडेंशियल हैं; वे अपने आप लोकल Gateway प्रमाणीकरण सक्षम नहीं करते.

  </Accordion>

  <Accordion title='कंट्रोल UI "unauthorized" कहता है (या बार-बार फिर से जुड़ता रहता है). अब क्या करें?'>
    आपका Gateway प्रमाणीकरण पथ और UI की प्रमाणीकरण विधि मेल नहीं खाते.

    तथ्य (कोड से):

    - कंट्रोल UI वर्तमान ब्राउज़र टैब सत्र और चुने गए Gateway URL के लिए टोकन को `sessionStorage` में रखता है, इसलिए वही-टैब रिफ़्रेश लंबे समय तक रहने वाले localStorage टोकन पर्सिस्टेंस को बहाल किए बिना काम करते रहते हैं.
    - `AUTH_TOKEN_MISMATCH` पर, भरोसेमंद क्लाइंट कैश किए गए डिवाइस टोकन के साथ एक सीमित रीट्राई का प्रयास कर सकते हैं जब Gateway रीट्राई संकेत लौटाता है (`canRetryWithDeviceToken=true`, `recommendedNextStep=retry_with_device_token`).
    - वह कैश्ड-टोकन रीट्राई अब डिवाइस टोकन के साथ संग्रहीत कैश्ड स्वीकृत स्कोप को फिर से उपयोग करता है. स्पष्ट `deviceToken` / स्पष्ट `scopes` कॉलर अभी भी कैश्ड स्कोप विरासत में लेने के बजाय अपना अनुरोधित स्कोप सेट रखते हैं.
    - उस रीट्राई पथ के बाहर, कनेक्ट प्रमाणीकरण प्राथमिकता पहले स्पष्ट साझा टोकन/पासवर्ड, फिर स्पष्ट `deviceToken`, फिर संग्रहीत डिवाइस टोकन, फिर बूटस्ट्रैप टोकन है.
    - बिल्ट-इन सेटअप-कोड बूटस्ट्रैप `scopes: []` के साथ एक नोड डिवाइस टोकन और भरोसेमंद मोबाइल ऑनबोर्डिंग के लिए एक सीमित ऑपरेटर हैंडऑफ़ टोकन लौटाता है. ऑपरेटर हैंडऑफ़ सेटअप-समय की नेटिव कॉन्फ़िगरेशन पढ़ सकता है, लेकिन पेयरिंग म्यूटेशन स्कोप या `operator.admin` नहीं देता.

    ठीक करें:

    - सबसे तेज़: `openclaw dashboard` (डैशबोर्ड URL प्रिंट + कॉपी करता है, खोलने की कोशिश करता है; हेडलेस होने पर SSH संकेत दिखाता है).
    - यदि आपके पास अभी टोकन नहीं है: `openclaw doctor --generate-gateway-token`.
    - यदि रिमोट है, तो पहले टनल करें: `ssh -N -L 18789:127.0.0.1:18789 user@host` फिर `http://127.0.0.1:18789/` खोलें.
    - साझा-सीक्रेट मोड: `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` या `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` सेट करें, फिर मेल खाता सीक्रेट कंट्रोल UI सेटिंग्स में पेस्ट करें.
    - Tailscale Serve मोड: सुनिश्चित करें कि `gateway.auth.allowTailscale` सक्षम है और आप Serve URL खोल रहे हैं, कोई कच्चा लूपबैक/tailnet URL नहीं जो Tailscale पहचान हेडर को बायपास करता हो.
    - भरोसेमंद-प्रॉक्सी मोड: सुनिश्चित करें कि आप कॉन्फ़िगर किए गए पहचान-जागरूक प्रॉक्सी से आ रहे हैं, कच्चे Gateway URL से नहीं. उसी-होस्ट लूपबैक प्रॉक्सी को भी `gateway.auth.trustedProxy.allowLoopback = true` चाहिए.
    - यदि एक रीट्राई के बाद भी बेमेली बनी रहती है, तो पेयर्ड डिवाइस टोकन घुमाएं/फिर से स्वीकृत करें:
      - `openclaw devices list`
      - `openclaw devices rotate --device <id> --role operator`
    - यदि वह रोटेट कॉल कहता है कि उसे अस्वीकार किया गया, तो दो चीज़ें जांचें:
      - पेयर्ड-डिवाइस सत्र केवल अपने **स्वयं** के डिवाइस को घुमा सकते हैं, जब तक उनके पास `operator.admin` भी न हो
      - स्पष्ट `--scope` मान कॉलर के वर्तमान ऑपरेटर स्कोप से अधिक नहीं हो सकते
    - अभी भी अटके हैं? `openclaw status --all` चलाएं और [समस्या निवारण](/hi/gateway/troubleshooting) का पालन करें. प्रमाणीकरण विवरण के लिए [डैशबोर्ड](/hi/web/dashboard) देखें.

  </Accordion>

  <Accordion title="मैंने gateway.bind tailnet सेट किया लेकिन यह बाइंड नहीं कर सकता और कुछ भी नहीं सुनता">
    `tailnet` बाइंड आपके नेटवर्क इंटरफ़ेस (100.64.0.0/10) से Tailscale IP चुनता है. यदि मशीन Tailscale पर नहीं है (या इंटरफ़ेस बंद है), तो बाइंड करने के लिए कुछ नहीं है.

    ठीक करें:

    - उस होस्ट पर Tailscale शुरू करें (ताकि उसके पास 100.x पता हो), या
    - `gateway.bind: "loopback"` / `"lan"` पर स्विच करें.

    नोट: `tailnet` स्पष्ट है. `auto` लूपबैक को प्राथमिकता देता है; जब आप केवल-tailnet बाइंड चाहते हों तो `gateway.bind: "tailnet"` उपयोग करें.

  </Accordion>

  <Accordion title="क्या मैं एक ही होस्ट पर कई Gateway चला सकता हूं?">
    आमतौर पर नहीं - एक Gateway कई मैसेजिंग चैनल और एजेंट चला सकता है. कई Gateway केवल तब उपयोग करें जब आपको रिडंडेंसी (उदा: रेस्क्यू बॉट) या कठोर पृथक्करण चाहिए.

    हां, लेकिन आपको अलग करना होगा:

    - `OPENCLAW_CONFIG_PATH` (प्रति-इंस्टेंस कॉन्फ़िग)
    - `OPENCLAW_STATE_DIR` (प्रति-इंस्टेंस स्थिति)
    - `agents.defaults.workspace` (वर्कस्पेस पृथक्करण)
    - `gateway.port` (अद्वितीय पोर्ट)

    त्वरित सेटअप (अनुशंसित):

    - प्रति इंस्टेंस `openclaw --profile <name> ...` उपयोग करें (स्वचालित रूप से `~/.openclaw-<name>` बनाता है).
    - प्रत्येक प्रोफ़ाइल कॉन्फ़िग में अद्वितीय `gateway.port` सेट करें (या मैनुअल रन के लिए `--port` पास करें).
    - प्रति-प्रोफ़ाइल सेवा इंस्टॉल करें: `openclaw --profile <name> gateway install`.

    प्रोफ़ाइल सेवा नामों में प्रत्यय भी जोड़ती हैं (`ai.openclaw.<profile>`; लेगेसी `com.openclaw.*`, `openclaw-gateway-<profile>.service`, `OpenClaw Gateway (<profile>)`).
    पूरा मार्गदर्शक: [कई Gateway](/hi/gateway/multiple-gateways).

  </Accordion>

  <Accordion title='"invalid handshake" / कोड 1008 का क्या मतलब है?'>
    Gateway एक **WebSocket सर्वर** है, और यह अपेक्षा करता है कि सबसे पहला संदेश
    `connect` फ़्रेम हो. यदि इसे कुछ और मिलता है, तो यह कनेक्शन को
    **कोड 1008** (नीति उल्लंघन) के साथ बंद कर देता है.

    सामान्य कारण:

    - आपने WS क्लाइंट के बजाय ब्राउज़र में **HTTP** URL खोला (`http://...`).
    - आपने गलत पोर्ट या पथ उपयोग किया.
    - किसी प्रॉक्सी या टनल ने प्रमाणीकरण हेडर हटा दिए या गैर-Gateway अनुरोध भेजा.

    त्वरित सुधार:

    1. WS URL उपयोग करें: `ws://<host>:18789` (या HTTPS होने पर `wss://...`).
    2. WS पोर्ट को सामान्य ब्राउज़र टैब में न खोलें.
    3. यदि प्रमाणीकरण चालू है, तो `connect` फ़्रेम में टोकन/पासवर्ड शामिल करें.

    यदि आप CLI या TUI उपयोग कर रहे हैं, तो URL ऐसा दिखना चाहिए:

    ```
    openclaw tui --url ws://<host>:18789 --token <token>
    ```

    प्रोटोकॉल विवरण: [Gateway प्रोटोकॉल](/hi/gateway/protocol).

  </Accordion>
</AccordionGroup>

## लॉगिंग और डिबगिंग

<AccordionGroup>
  <Accordion title="लॉग कहां हैं?">
    फ़ाइल लॉग (संरचित):

    ```
    /tmp/openclaw/openclaw-YYYY-MM-DD.log
    ```

    आप `logging.file` के जरिए एक स्थिर पथ सेट कर सकते हैं। फ़ाइल लॉग स्तर `logging.level` से नियंत्रित होता है। कंसोल वर्बोसिटी `--verbose` और `logging.consoleLevel` से नियंत्रित होती है।

    सबसे तेज़ लॉग टेल:

    ```bash
    openclaw logs --follow
    ```

    सेवा/supervisor लॉग (जब gateway launchd/systemd के जरिए चलता है):

    - macOS launchd stdout: `~/Library/Logs/openclaw/gateway.log` (प्रोफ़ाइल `gateway-<profile>.log` का उपयोग करती हैं; stderr दबा दिया जाता है)
    - Linux: `journalctl --user -u openclaw-gateway[-<profile>].service -n 200 --no-pager`
    - Windows: `schtasks /Query /TN "OpenClaw Gateway (<profile>)" /V /FO LIST`

    अधिक जानकारी के लिए [समस्या निवारण](/hi/gateway/troubleshooting) देखें।

  </Accordion>

  <Accordion title="मैं Gateway सेवा को कैसे शुरू/बंद/रीस्टार्ट करूं?">
    Gateway हेल्पर का उपयोग करें:

    ```bash
    openclaw gateway status
    openclaw gateway restart
    ```

    यदि आप gateway को मैन्युअल रूप से चलाते हैं, तो `openclaw gateway --force` पोर्ट वापस ले सकता है। [Gateway](/hi/gateway) देखें।

  </Accordion>

  <Accordion title="मैंने Windows पर अपना टर्मिनल बंद कर दिया - मैं OpenClaw को कैसे रीस्टार्ट करूं?">
    **तीन Windows इंस्टॉल मोड** हैं:

    **1) Windows Hub स्थानीय सेटअप:** नेटिव ऐप एक स्थानीय ऐप-स्वामित्व वाला WSL Gateway प्रबंधित करता है।

    Start मेनू या ट्रे से **OpenClaw Companion** खोलें, फिर
    **Gateway Setup** या Connections टैब का उपयोग करें।

    **2) मैन्युअल WSL2 Gateway:** Gateway Linux के अंदर चलता है।

    PowerShell खोलें, WSL में जाएं, फिर रीस्टार्ट करें:

    ```powershell
    wsl
    openclaw gateway status
    openclaw gateway restart
    ```

    यदि आपने सेवा कभी इंस्टॉल नहीं की, तो इसे foreground में शुरू करें:

    ```bash
    openclaw gateway run
    ```

    **3) नेटिव Windows CLI/Gateway:** Gateway सीधे Windows में चलता है।

    PowerShell खोलें और चलाएं:

    ```powershell
    openclaw gateway status
    openclaw gateway restart
    ```

    यदि आप इसे मैन्युअल रूप से चलाते हैं (कोई सेवा नहीं), तो उपयोग करें:

    ```powershell
    openclaw gateway run
    ```

    दस्तावेज़: [Windows](/hi/platforms/windows), [Gateway सेवा रनबुक](/hi/gateway).

  </Accordion>

  <Accordion title="Gateway चालू है लेकिन जवाब कभी नहीं आते। मुझे क्या जांचना चाहिए?">
    एक त्वरित स्वास्थ्य जांच से शुरू करें:

    ```bash
    openclaw status
    openclaw models status
    openclaw channels status
    openclaw logs --follow
    ```

    सामान्य कारण:

    - मॉडल auth **gateway host** पर लोड नहीं हुआ है (`models status` जांचें)।
    - चैनल pairing/allowlist जवाबों को रोक रही है (चैनल config + logs जांचें)।
    - WebChat/Dashboard सही token के बिना खुला है।

    यदि आप remote हैं, तो पुष्टि करें कि tunnel/Tailscale कनेक्शन चालू है और
    Gateway WebSocket पहुंच योग्य है।

    दस्तावेज़: [चैनल](/hi/channels), [समस्या निवारण](/hi/gateway/troubleshooting), [remote access](/hi/gateway/remote).

  </Accordion>

  <Accordion title='"Gateway से डिस्कनेक्ट किया गया: कोई कारण नहीं" - अब क्या?'>
    इसका आमतौर पर मतलब है कि UI ने WebSocket कनेक्शन खो दिया। जांचें:

    1. क्या Gateway चल रहा है? `openclaw gateway status`
    2. क्या Gateway स्वस्थ है? `openclaw status`
    3. क्या UI के पास सही token है? `openclaw dashboard`
    4. यदि remote है, तो क्या tunnel/Tailscale लिंक चालू है?

    फिर logs tail करें:

    ```bash
    openclaw logs --follow
    ```

    दस्तावेज़: [Dashboard](/hi/web/dashboard), [remote access](/hi/gateway/remote), [समस्या निवारण](/hi/gateway/troubleshooting).

  </Accordion>

  <Accordion title="Telegram setMyCommands विफल होता है। मुझे क्या जांचना चाहिए?">
    logs और channel status से शुरू करें:

    ```bash
    openclaw channels status
    openclaw channels logs --channel telegram
    ```

    फिर त्रुटि से मिलान करें:

    - `BOT_COMMANDS_TOO_MUCH`: Telegram मेनू में बहुत अधिक entries हैं। OpenClaw पहले से Telegram सीमा तक trim करता है और कम commands के साथ retry करता है, लेकिन कुछ menu entries को अभी भी हटाना होगा। plugin/skill/custom commands घटाएं, या यदि आपको menu की आवश्यकता नहीं है तो `channels.telegram.commands.native` अक्षम करें।
    - `TypeError: fetch failed`, `Network request for 'setMyCommands' failed!`, या समान network errors: यदि आप VPS पर हैं या proxy के पीछे हैं, तो पुष्टि करें कि outbound HTTPS अनुमत है और `api.telegram.org` के लिए DNS काम करता है।

    यदि Gateway remote है, तो सुनिश्चित करें कि आप Gateway host पर logs देख रहे हैं।

    दस्तावेज़: [Telegram](/hi/channels/telegram), [चैनल समस्या निवारण](/hi/channels/troubleshooting).

  </Accordion>

  <Accordion title="TUI कोई output नहीं दिखाता। मुझे क्या जांचना चाहिए?">
    पहले पुष्टि करें कि Gateway पहुंच योग्य है और agent चल सकता है:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    TUI में, वर्तमान स्थिति देखने के लिए `/status` का उपयोग करें। यदि आप किसी chat
    channel में replies की अपेक्षा करते हैं, तो सुनिश्चित करें कि delivery सक्षम है (`/deliver on`)।

    दस्तावेज़: [TUI](/hi/web/tui), [slash commands](/hi/tools/slash-commands).

  </Accordion>

  <Accordion title="मैं Gateway को पूरी तरह बंद करके फिर शुरू कैसे करूं?">
    यदि आपने सेवा इंस्टॉल की है:

    ```bash
    openclaw gateway stop
    openclaw gateway start
    ```

    यह **supervised service** को stop/start करता है (macOS पर launchd, Linux पर systemd)।
    इसका उपयोग तब करें जब Gateway background में daemon के रूप में चलता हो।

    यदि आप foreground में चला रहे हैं, तो Ctrl-C से रोकें, फिर:

    ```bash
    openclaw gateway run
    ```

    दस्तावेज़: [Gateway सेवा रनबुक](/hi/gateway).

  </Accordion>

  <Accordion title="ELI5: openclaw gateway restart बनाम openclaw gateway">
    - `openclaw gateway restart`: **background service** (launchd/systemd) को रीस्टार्ट करता है।
    - `openclaw gateway`: इस terminal session के लिए gateway को **foreground में** चलाता है।

    यदि आपने सेवा इंस्टॉल की है, तो gateway commands का उपयोग करें। `openclaw gateway` का उपयोग तब करें जब
    आप एक बार का, foreground run चाहते हों।

  </Accordion>

  <Accordion title="जब कुछ विफल हो तो अधिक विवरण पाने का सबसे तेज़ तरीका">
    अधिक console detail पाने के लिए Gateway को `--verbose` के साथ शुरू करें। फिर channel auth, model routing, और RPC errors के लिए log file देखें।
  </Accordion>
</AccordionGroup>

## मीडिया और attachments

<AccordionGroup>
  <Accordion title="मेरी skill ने एक image/PDF बनाया, लेकिन कुछ भेजा नहीं गया">
    agent से outgoing attachments को `media`, `mediaUrl`, `path`, या `filePath` जैसे structured media fields का उपयोग करना होगा। [OpenClaw assistant setup](/hi/start/openclaw) और [Agent send](/hi/tools/agent-send) देखें।

    CLI भेजना:

    ```bash
    openclaw message send --target +15555550123 --message "Here you go" --media /path/to/file.png
    ```

    यह भी जांचें:

    - target channel outbound media का समर्थन करता है और allowlists से blocked नहीं है।
    - फ़ाइल provider की size limits के भीतर है (images को max 2048px तक resize किया जाता है)।
    - `tools.fs.workspaceOnly=true` local-path sends को workspace, temp/media-store, और sandbox-validated files तक सीमित रखता है।
    - `tools.fs.workspaceOnly=false` structured local media sends को host-local files उपयोग करने देता है जिन्हें agent पहले से पढ़ सकता है, लेकिन केवल media और safe document types के लिए (images, audio, video, PDF, Office docs, और validated text documents जैसे Markdown/MD, TXT, JSON, YAML, और YML)। यह secret scanner नहीं है: agent-readable `secret.txt` या `config.json` तब attach किया जा सकता है जब extension और content validation match करें। sensitive files को agent-readable paths से बाहर रखें, या stricter local-path sends के लिए `tools.fs.workspaceOnly=true` रखें।

    [Images](/hi/nodes/images) देखें।

  </Accordion>
</AccordionGroup>

## सुरक्षा और access control

<AccordionGroup>
  <Accordion title="क्या OpenClaw को inbound DMs के लिए expose करना सुरक्षित है?">
    inbound DMs को untrusted input मानें। defaults risk घटाने के लिए design किए गए हैं:

    - DM-capable channels पर default behavior **pairing** है:
      - अज्ञात senders को pairing code मिलता है; bot उनका message process नहीं करता।
      - approve करें: `openclaw pairing approve --channel <channel> [--account <id>] <code>`
      - pending requests **3 per channel** तक capped हैं; यदि code नहीं आया तो `openclaw pairing list --channel <channel> [--account <id>]` जांचें।
    - DMs को publicly खोलने के लिए explicit opt-in चाहिए (`dmPolicy: "open"` और allowlist `"*"`).

    risky DM policies surface करने के लिए `openclaw doctor` चलाएं।

  </Accordion>

  <Accordion title="क्या prompt injection केवल public bots के लिए चिंता है?">
    नहीं। Prompt injection **untrusted content** के बारे में है, केवल इस बारे में नहीं कि bot को DM कौन कर सकता है।
    यदि आपका assistant external content पढ़ता है (web search/fetch, browser pages, emails,
    docs, attachments, pasted logs), तो उस content में ऐसी instructions हो सकती हैं जो model
    को hijack करने की कोशिश करें। यह तब भी हो सकता है जब **केवल आप ही sender हों**।

    सबसे बड़ा risk तब होता है जब tools enabled हों: model को आपके behalf पर
    context exfiltrate करने या tools call करने के लिए trick किया जा सकता है। blast radius घटाएं:

    - untrusted content summarize करने के लिए read-only या tool-disabled "reader" agent का उपयोग करके
    - tool-enabled agents के लिए `web_search` / `web_fetch` / `browser` off रखकर
    - decoded file/document text को भी untrusted मानकर: OpenResponses
      `input_file` और media-attachment extraction दोनों extracted text को raw file text
      pass करने के बजाय explicit external-content boundary markers में wrap करते हैं
    - sandboxing और strict tool allowlists

    विवरण: [Security](/hi/gateway/security).

  </Accordion>

  <Accordion title="क्या OpenClaw इसलिए कम सुरक्षित है क्योंकि यह Rust/WASM के बजाय TypeScript/Node का उपयोग करता है?">
    भाषा और runtime मायने रखते हैं, लेकिन वे personal
    agent के लिए मुख्य risk नहीं हैं। व्यावहारिक OpenClaw risks हैं gateway exposure, bot को कौन message कर सकता है,
    prompt injection, tool scope, credential handling, browser access, exec
    access, और third-party skill या plugin trust।

    Rust और WASM कुछ code classes के लिए stronger isolation दे सकते हैं, लेकिन
    वे prompt injection, खराब allowlists, public gateway exposure,
    overbroad tools, या ऐसे browser profile को solve नहीं करते जो पहले से sensitive
    accounts में logged in है। इन्हें primary controls मानें:

    - Gateway को private या authenticated रखें
    - DMs और groups के लिए pairing और allowlists का उपयोग करें
    - untrusted inputs के लिए risky tools को deny या sandbox करें
    - केवल trusted plugins और skills install करें
    - config changes के बाद `openclaw security audit --deep` चलाएं

    विवरण: [Security](/hi/gateway/security), [Sandboxing](/hi/gateway/sandboxing).

  </Accordion>

  <Accordion title="मैंने exposed OpenClaw instances के बारे में reports देखीं। मुझे क्या जांचना चाहिए?">
    पहले अपना actual deployment जांचें:

    ```bash
    openclaw security audit --deep
    openclaw gateway status
    ```

    एक safer baseline है:

    - Gateway `loopback` से bound हो, या केवल authenticated private
      access जैसे tailnet, SSH tunnel, token/password auth, या correctly
      configured trusted proxy के जरिए exposed हो
    - DMs `pairing` या `allowlist` mode में हों
    - groups allowlisted और mention-gated हों, जब तक हर member trusted न हो
    - high-risk tools (`exec`, `browser`, `gateway`, `cron`) denied या tightly
      scoped हों उन agents के लिए जो untrusted content पढ़ते हैं
    - जहां tool execution को smaller blast radius चाहिए, वहां sandboxing enabled हो

    auth के बिना public binds, tools के साथ open DMs/groups, और exposed browser
    control वे findings हैं जिन्हें पहले fix करना चाहिए। विवरण:
    [Security audit checklist](/hi/gateway/security#security-audit-checklist).

  </Accordion>

  <Accordion title="क्या ClawHub skills और third-party plugins install करना सुरक्षित है?">
    third-party skills और plugins को ऐसे code की तरह मानें जिस पर आप trust करना चुन रहे हैं।
    ClawHub skill pages install से पहले scan state expose करते हैं, लेकिन scans
    complete security boundary नहीं हैं। OpenClaw plugin या skill install/update flows के दौरान built-in local
    dangerous-code blocking नहीं चलाता; local allow/block decisions के लिए
    operator-owned `security.installPolicy` का उपयोग करें।

    सुरक्षित pattern:

    - trusted authors और pinned versions को प्राथमिकता दें
    - skill या plugin enable करने से पहले उसे पढ़ें
    - plugin और skill allowlists narrow रखें
    - untrusted-input workflows को minimal tools वाले sandbox में चलाएं
    - third-party code को broad filesystem, exec, browser, या secret access देने से बचें

    विवरण: [Skills](/hi/tools/skills), [Plugin](/hi/tools/plugin),
    [सुरक्षा](/hi/gateway/security).

  </Accordion>

  <Accordion title="क्या मेरे bot का अपना email, GitHub account, या phone number होना चाहिए?">
    हाँ, अधिकांश setup के लिए। bot को अलग accounts और phone numbers के साथ अलग रखने से
    कुछ गलत होने पर प्रभाव का दायरा कम होता है। इससे credentials rotate करना या access revoke करना भी आसान होता है,
    बिना आपके personal accounts को प्रभावित किए।

    छोटा शुरू करें। केवल उन tools और accounts तक access दें जिनकी आपको सच में जरूरत है, और
    जरूरत पड़ने पर बाद में बढ़ाएँ।

    Docs: [सुरक्षा](/hi/gateway/security), [Pairing](/hi/channels/pairing).

  </Accordion>

  <Accordion title="क्या मैं इसे अपने text messages पर autonomy दे सकता हूँ और क्या यह सुरक्षित है?">
    हम आपके personal messages पर पूरी autonomy की **सिफारिश नहीं** करते। सबसे सुरक्षित pattern है:

    - DMs को **pairing mode** या कड़ी allowlist में रखें।
    - यदि आप चाहते हैं कि यह आपकी ओर से message करे, तो **अलग number या account** इस्तेमाल करें।
    - इसे draft करने दें, फिर **भेजने से पहले approve करें**।

    यदि आप प्रयोग करना चाहते हैं, तो इसे dedicated account पर करें और इसे isolated रखें। देखें
    [सुरक्षा](/hi/gateway/security).

  </Accordion>

  <Accordion title="क्या मैं personal assistant tasks के लिए सस्ते models इस्तेमाल कर सकता हूँ?">
    हाँ, **यदि** agent केवल chat-only है और input trusted है। छोटे tiers
    instruction hijacking के प्रति अधिक संवेदनशील होते हैं, इसलिए tool-enabled agents के लिए
    या untrusted content पढ़ते समय उनसे बचें। यदि आपको छोटा model इस्तेमाल करना ही है, तो
    tools को lock down करें और sandbox के अंदर चलाएँ। देखें [सुरक्षा](/hi/gateway/security).
  </Accordion>

  <Accordion title="मैंने Telegram में /start चलाया लेकिन pairing code नहीं मिला">
    Pairing codes **केवल** तब भेजे जाते हैं जब कोई unknown sender bot को message करता है और
    `dmPolicy: "pairing"` enabled होता है। `/start` अपने आप code generate नहीं करता।

    pending requests देखें:

    ```bash
    openclaw pairing list telegram
    ```

    यदि आप immediate access चाहते हैं, तो अपने sender id को allowlist करें या उस account के लिए
    `dmPolicy: "open"` set करें।

  </Accordion>

  <Accordion title="WhatsApp: क्या यह मेरे contacts को message करेगा? Pairing कैसे काम करती है?">
    नहीं। default WhatsApp DM policy **pairing** है। Unknown senders को केवल pairing code मिलता है और उनका message **process नहीं होता**। OpenClaw केवल उन chats का reply करता है जिन्हें वह receive करता है या उन explicit sends का जिन्हें आप trigger करते हैं।

    Pairing approve करें:

    ```bash
    openclaw pairing approve whatsapp <code>
    ```

    pending requests list करें:

    ```bash
    openclaw pairing list whatsapp
    ```

    Wizard phone number prompt: इसका उपयोग आपकी **allowlist/owner** set करने के लिए होता है ताकि आपके अपने DMs permitted हों। इसका उपयोग auto-sending के लिए नहीं होता। यदि आप अपने personal WhatsApp number पर run करते हैं, तो वही number use करें और `channels.whatsapp.selfChatMode` enable करें।

  </Accordion>
</AccordionGroup>

## Chat commands, tasks abort करना, और "यह नहीं रुकेगा"

<AccordionGroup>
  <Accordion title="मैं internal system messages को chat में दिखने से कैसे रोकूँ?">
    अधिकतर internal या tool messages केवल तब दिखाई देते हैं जब उस session के लिए **verbose**, **trace**, या **reasoning** enabled हो।

    जिस chat में आप इसे देखते हैं, वहाँ fix करें:

    ```
    /verbose off
    /trace off
    /reasoning off
    ```

    यदि यह अभी भी noisy है, तो Control UI में session settings देखें और verbose को
    **inherit** पर set करें। यह भी confirm करें कि आप config में `verboseDefault` को
    `on` set वाले bot profile का उपयोग नहीं कर रहे हैं।

    Docs: [Thinking और verbose](/hi/tools/thinking), [सुरक्षा](/hi/gateway/security/index#reasoning-and-verbose-output-in-groups).

  </Accordion>

  <Accordion title="मैं चल रहे task को कैसे stop/cancel करूँ?">
    इनमें से कोई भी **standalone message के रूप में** भेजें (slash नहीं):

    ```
    stop
    stop action
    stop current action
    stop run
    stop current run
    stop agent
    stop the agent
    stop openclaw
    openclaw stop
    stop don't do anything
    stop do not do anything
    stop doing anything
    please stop
    stop please
    abort
    esc
    wait
    exit
    interrupt
    ```

    ये abort triggers हैं (slash commands नहीं)।

    background processes के लिए (exec tool से), आप agent से यह run करने को कह सकते हैं:

    ```
    process action:kill sessionId:XXX
    ```

    Slash commands overview: देखें [Slash commands](/hi/tools/slash-commands).

    अधिकतर commands को `/` से शुरू होने वाले **standalone** message के रूप में भेजना जरूरी है, लेकिन कुछ shortcuts (जैसे `/status`) allowlisted senders के लिए inline भी काम करते हैं।

  </Accordion>

  <Accordion title='मैं Telegram से Discord message कैसे भेजूँ? ("Cross-context messaging denied")'>
    OpenClaw default रूप से **cross-provider** messaging block करता है। यदि कोई tool call
    Telegram से bound है, तो जब तक आप explicit रूप से allow नहीं करते, वह Discord को send नहीं करेगा।

    agent के लिए cross-provider messaging enable करें:

    ```json5
    {
      tools: {
        message: {
          crossContext: {
            allowAcrossProviders: true,
            marker: { enabled: true, prefix: "[from {channel}] " },
          },
        },
      },
    }
    ```

    config edit करने के बाद gateway restart करें।

  </Accordion>

  <Accordion title='ऐसा क्यों लगता है कि bot rapid-fire messages को "ignore" करता है?'>
    Mid-run prompts default रूप से active run में steer किए जाते हैं। active-run behavior चुनने के लिए `/queue` use करें:

    - `steer` - अगले model boundary पर active run को guide करें
    - `followup` - messages queue करें और current run खत्म होने के बाद उन्हें एक-एक करके run करें
    - `collect` - compatible messages queue करें और current run खत्म होने के बाद एक बार reply करें
    - `interrupt` - current run abort करें और fresh start करें

    Default mode `steer` है। queued modes के लिए आप `debounce:0.5s cap:25 drop:summarize` जैसे options जोड़ सकते हैं। देखें [Command queue](/hi/concepts/queue) और [Steering queue](/hi/concepts/queue-steering).

  </Accordion>
</AccordionGroup>

## विविध

<AccordionGroup>
  <Accordion title='API key के साथ Anthropic के लिए default model क्या है?'>
    OpenClaw में, credentials और model selection अलग हैं। `ANTHROPIC_API_KEY` set करना (या auth profiles में Anthropic API key store करना) authentication enable करता है, लेकिन actual default model वही होता है जिसे आप `agents.defaults.model.primary` में configure करते हैं (उदाहरण के लिए, `anthropic/claude-sonnet-4-6` या `anthropic/claude-opus-4-6`)। यदि आपको `No credentials found for profile "anthropic:default"` दिखता है, तो इसका मतलब है कि Gateway running agent के लिए expected `auth-profiles.json` में Anthropic credentials नहीं ढूंढ सका।
  </Accordion>
</AccordionGroup>

---

अभी भी अटके हैं? [Discord](https://discord.com/invite/clawd) में पूछें या [GitHub discussion](https://github.com/openclaw/openclaw/discussions) खोलें।

## संबंधित

- [First-run FAQ](/hi/help/faq-first-run) — install, onboard, auth, subscriptions, शुरुआती failures
- [Models FAQ](/hi/help/faq-models) — model selection, failover, auth profiles
- [Troubleshooting](/hi/help/troubleshooting) — symptom-first triage
