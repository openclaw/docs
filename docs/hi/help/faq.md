---
read_when:
    - सामान्य सेटअप, इंस्टॉल, ऑनबोर्डिंग, या रनटाइम सहायता प्रश्नों के उत्तर देना
    - गहरी डिबगिंग से पहले उपयोगकर्ता द्वारा रिपोर्ट की गई समस्याओं की ट्रायेज करना
summary: OpenClaw सेटअप, कॉन्फ़िगरेशन, और उपयोग के बारे में अक्सर पूछे जाने वाले प्रश्न
title: अक्सर पूछे जाने वाले प्रश्न
x-i18n:
    generated_at: "2026-06-28T23:16:06Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 40b32792c202944576cd983ecf8bf794551bc50986d6b5c985a8ddfe0ecf0b34
    source_path: help/faq.md
    workflow: 16
---

वास्तविक दुनिया की सेटअप स्थितियों (स्थानीय विकास, VPS, मल्टी-एजेंट, OAuth/API keys, मॉडल failover) के लिए त्वरित उत्तर और गहन समस्या निवारण। रनटाइम निदान के लिए, [समस्या निवारण](/hi/gateway/troubleshooting) देखें। पूर्ण config संदर्भ के लिए, [कॉन्फ़िगरेशन](/hi/gateway/configuration) देखें।

## अगर कुछ टूट गया है तो पहले 60 सेकंड

1. **त्वरित स्थिति (पहली जांच)**

   ```bash
   openclaw status
   ```

   तेज़ स्थानीय सारांश: OS + update, gateway/service पहुंच, agents/sessions, provider config + runtime समस्याएं (जब gateway पहुंच योग्य हो)।

2. **चिपकाने योग्य रिपोर्ट (साझा करने के लिए सुरक्षित)**

   ```bash
   openclaw status --all
   ```

   log tail के साथ read-only निदान (tokens redacted)।

3. **Daemon + port स्थिति**

   ```bash
   openclaw gateway status
   ```

   supervisor runtime बनाम RPC पहुंच, probe target URL, और service ने संभवतः कौन-सा config उपयोग किया, दिखाता है।

4. **गहन probes**

   ```bash
   openclaw status --deep
   ```

   समर्थित होने पर channel probes सहित, live gateway health probe चलाता है
   (एक पहुंच योग्य gateway आवश्यक है)। [Health](/hi/gateway/health) देखें।

5. **नवीनतम log tail करें**

   ```bash
   openclaw logs --follow
   ```

   अगर RPC बंद है, तो इस पर fallback करें:

   ```bash
   tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
   ```

   File logs service logs से अलग हैं; [Logging](/hi/logging) और [समस्या निवारण](/hi/gateway/troubleshooting) देखें।

6. **doctor चलाएं (मरम्मत)**

   ```bash
   openclaw doctor
   ```

   config/state की मरम्मत/माइग्रेशन करता है + health checks चलाता है। [Doctor](/hi/gateway/doctor) देखें।

7. **Gateway snapshot**

   ```bash
   openclaw health --json
   openclaw health --verbose   # errors पर target URL + config path दिखाता है
   ```

   चल रहे gateway से पूर्ण snapshot मांगता है (केवल WS)। [Health](/hi/gateway/health) देखें।

## त्वरित शुरुआत और first-run setup

First-run Q&A — install, onboard, auth routes, subscriptions, शुरुआती failures —
[First-run FAQ](/hi/help/faq-first-run) पर उपलब्ध है।

## OpenClaw क्या है?

<AccordionGroup>
  <Accordion title="OpenClaw क्या है, एक पैराग्राफ में?">
    OpenClaw एक निजी AI assistant है जिसे आप अपने स्वयं के devices पर चलाते हैं। यह उन messaging surfaces पर जवाब देता है जिन्हें आप पहले से उपयोग करते हैं (WhatsApp, Telegram, Slack, Mattermost, Discord, Google Chat, Signal, iMessage, WebChat, और QQ Bot जैसे bundled channel plugins) और समर्थित platforms पर voice + live Canvas भी कर सकता है। **Gateway** हमेशा चालू रहने वाला control plane है; assistant ही product है।
  </Accordion>

  <Accordion title="Value proposition">
    OpenClaw "सिर्फ़ Claude wrapper" नहीं है। यह एक **local-first control plane** है जो आपको **अपने स्वयं के hardware** पर एक सक्षम assistant चलाने देता है, उन chat apps से पहुंच योग्य जिन्हें आप पहले से उपयोग करते हैं, stateful sessions, memory, और tools के साथ - अपने workflows का control किसी hosted SaaS को सौंपे बिना।

    मुख्य बातें:

    - **आपके devices, आपका data:** Gateway को जहां चाहें चलाएं (Mac, Linux, VPS) और workspace + session history को स्थानीय रखें।
    - **वास्तविक channels, web sandbox नहीं:** WhatsApp/Telegram/Slack/Discord/Signal/iMessage/etc,
      साथ ही समर्थित platforms पर mobile voice और Canvas।
    - **Model-agnostic:** Anthropic, OpenAI, MiniMax, OpenRouter, आदि का उपयोग करें, per-agent routing
      और failover के साथ।
    - **Local-only विकल्प:** local models चलाएं ताकि चाहें तो **सारा data आपके device पर रह सके**।
    - **Multi-agent routing:** channel, account, या task के अनुसार अलग agents, प्रत्येक का अपना
      workspace और defaults।
    - **Open source और hackable:** vendor lock-in के बिना inspect, extend, और self-host करें।

    Docs: [Gateway](/hi/gateway), [Channels](/hi/channels), [Multi-agent](/hi/concepts/multi-agent),
    [Memory](/hi/concepts/memory).

  </Accordion>

  <Accordion title="मैंने अभी इसे set up किया है - मुझे पहले क्या करना चाहिए?">
    अच्छे first projects:

    - एक website बनाएं (WordPress, Shopify, या simple static site)।
    - mobile app का prototype बनाएं (outline, screens, API plan)।
    - files और folders व्यवस्थित करें (cleanup, naming, tagging)।
    - Gmail connect करें और summaries या follow ups automate करें।

    यह बड़े tasks संभाल सकता है, लेकिन सबसे अच्छा तब काम करता है जब आप उन्हें phases में बांटते हैं और
    parallel work के लिए sub agents का उपयोग करते हैं।

  </Accordion>

  <Accordion title="OpenClaw के शीर्ष पांच रोज़मर्रा के use cases क्या हैं?">
    रोज़मर्रा की जीत आमतौर पर ऐसी दिखती है:

    - **Personal briefings:** inbox, calendar, और आपकी रुचि की news के summaries।
    - **Research और drafting:** emails या docs के लिए quick research, summaries, और first drafts।
    - **Reminders और follow ups:** Cron या Heartbeat driven nudges और checklists।
    - **Browser automation:** forms भरना, data collect करना, और web tasks दोहराना।
    - **Cross device coordination:** अपने phone से task भेजें, Gateway को server पर चलने दें, और result chat में वापस पाएं।

  </Accordion>

  <Accordion title="क्या OpenClaw SaaS के लिए lead gen, outreach, ads, और blogs में मदद कर सकता है?">
    **research, qualification, और drafting** के लिए हाँ। यह sites scan कर सकता है, shortlists बना सकता है,
    prospects summarize कर सकता है, और outreach या ad copy drafts लिख सकता है।

    **outreach या ad runs** के लिए, human को loop में रखें। spam से बचें, local laws और
    platform policies का पालन करें, और भेजने से पहले हर चीज़ review करें। सबसे सुरक्षित pattern है कि
    OpenClaw draft करे और आप approve करें।

    Docs: [Security](/hi/gateway/security).

  </Accordion>

  <Accordion title="web development के लिए Claude Code की तुलना में क्या फायदे हैं?">
    OpenClaw एक **personal assistant** और coordination layer है, IDE replacement नहीं। repo के अंदर सबसे तेज़ direct coding loop के लिए
    Claude Code या Codex का उपयोग करें। OpenClaw तब उपयोग करें जब आपको
    durable memory, cross-device access, और tool orchestration चाहिए।

    फायदे:

    - sessions के पार **Persistent memory + workspace**
    - **Multi-platform access** (WhatsApp, Telegram, TUI, WebChat)
    - **Tool orchestration** (browser, files, scheduling, hooks)
    - **Always-on Gateway** (VPS पर चलाएं, कहीं से भी interact करें)
    - local browser/screen/camera/exec के लिए **Nodes**

    Showcase: [https://openclaw.ai/showcase](https://openclaw.ai/showcase)

  </Accordion>
</AccordionGroup>

## Skills और automation

<AccordionGroup>
  <Accordion title="repo को dirty रखे बिना skills को customize कैसे करूं?">
    repo copy edit करने के बजाय managed overrides का उपयोग करें। अपने changes `~/.openclaw/skills/<name>/SKILL.md` में रखें (या `~/.openclaw/openclaw.json` में `skills.load.extraDirs` के जरिए folder जोड़ें)। precedence है `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → bundled → `skills.load.extraDirs`, इसलिए managed overrides git को छुए बिना भी bundled skills पर जीतते हैं। अगर skill globally installed चाहिए लेकिन केवल कुछ agents को visible हो, तो shared copy `~/.openclaw/skills` में रखें और visibility को `agents.defaults.skills` और `agents.list[].skills` से control करें। केवल upstream-worthy edits repo में रहने चाहिए और PRs के रूप में जाने चाहिए।
  </Accordion>

  <Accordion title="क्या मैं custom folder से skills load कर सकता हूं?">
    हाँ। `~/.openclaw/openclaw.json` में `skills.load.extraDirs` के जरिए extra directories जोड़ें (सबसे कम precedence)। Default precedence है `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → bundled → `skills.load.extraDirs`। `clawhub` default रूप से `./skills` में install करता है, जिसे OpenClaw अगले session में `<workspace>/skills` मानता है। अगर skill केवल कुछ agents को visible होनी चाहिए, तो इसे `agents.defaults.skills` या `agents.list[].skills` के साथ जोड़ें।
  </Accordion>

  <Accordion title="अलग-अलग tasks के लिए अलग models या settings कैसे उपयोग कर सकता हूं?">
    आज supported patterns ये हैं:

    - **Cron jobs**: isolated jobs per job एक `model` override set कर सकते हैं।
    - **Agents**: अलग default models, thinking levels, और stream params वाले अलग agents को tasks route करें।
    - **On-demand switch**: किसी भी समय current session model switch करने के लिए `/model` का उपयोग करें।

    उदाहरण के लिए, अलग per-agent settings के साथ वही model उपयोग करें:

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

    shared per-model defaults को `agents.defaults.models["provider/model"].params` में रखें, फिर agent-specific overrides को flat `agents.list[].params` में रखें। उसी model के लिए अलग nested `agents.list[].models["provider/model"].params` entries define न करें; `agents.list[].models` per-agent model catalog और runtime overrides के लिए है।

    [Cron jobs](/hi/automation/cron-jobs), [Multi-Agent Routing](/hi/concepts/multi-agent), [Configuration](/hi/gateway/config-agents), और [Slash commands](/hi/tools/slash-commands) देखें।

  </Accordion>

  <Accordion title="heavy work करते समय bot freeze हो जाता है। इसे offload कैसे करूं?">
    लंबे या parallel tasks के लिए **sub-agents** का उपयोग करें। Sub-agents अपने session में चलते हैं,
    summary return करते हैं, और आपकी main chat responsive रखते हैं।

    अपने bot से "spawn a sub-agent for this task" कहें या `/subagents` का उपयोग करें।
    Gateway अभी क्या कर रहा है (और क्या यह busy है) देखने के लिए chat में `/status` उपयोग करें।

    Token tip: लंबे tasks और sub-agents दोनों tokens consume करते हैं। अगर cost concern है, तो
    `agents.defaults.subagents.model` के जरिए sub-agents के लिए cheaper model set करें।

    Docs: [Sub-agents](/hi/tools/subagents), [Background Tasks](/hi/automation/tasks).

  </Accordion>

  <Accordion title="Discord पर thread-bound subagent sessions कैसे काम करते हैं?">
    thread bindings का उपयोग करें। आप Discord thread को subagent या session target से bind कर सकते हैं ताकि उस thread में follow-up messages उसी bound session पर रहें।

    Basic flow:

    - `sessions_spawn` के साथ `thread: true` उपयोग करके spawn करें (और persistent follow-up के लिए वैकल्पिक रूप से `mode: "session"`)।
    - या `/focus <target>` से manually bind करें।
    - binding state inspect करने के लिए `/agents` उपयोग करें।
    - auto-unfocus control करने के लिए `/session idle <duration|off>` और `/session max-age <duration|off>` उपयोग करें।
    - thread detach करने के लिए `/unfocus` उपयोग करें।

    Required config:

    - Global defaults: `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
    - Discord overrides: `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours`.
    - Auto-bind on spawn: `channels.discord.threadBindings.spawnSessions` default रूप से `true` है; thread-bound session spawns disable करने के लिए इसे `false` set करें।

    Docs: [Sub-agents](/hi/tools/subagents), [Discord](/hi/channels/discord), [Configuration Reference](/hi/gateway/configuration-reference), [Slash commands](/hi/tools/slash-commands).

  </Accordion>

  <Accordion title="एक subagent finished हुआ, लेकिन completion update wrong place पर गया या कभी post नहीं हुआ। मुझे क्या check करना चाहिए?">
    पहले resolved requester route check करें:

    - Completion-mode subagent delivery किसी bound thread या conversation route को prefer करती है जब वह मौजूद हो।
    - अगर completion origin केवल channel carry करता है, तो OpenClaw requester session के stored route (`lastChannel` / `lastTo` / `lastAccountId`) पर fallback करता है ताकि direct delivery फिर भी succeed कर सके।
    - अगर न bound route मौजूद है और न usable stored route, तो direct delivery fail हो सकती है और result chat में तुरंत post होने के बजाय queued session delivery पर fallback करता है।
    - invalid या stale targets अभी भी queue fallback या final delivery failure force कर सकते हैं।
    - अगर child का last visible assistant reply exact silent token `NO_REPLY` / `no_reply`, या ठीक `ANNOUNCE_SKIP` है, तो OpenClaw stale earlier progress post करने के बजाय announce को intentionally suppress करता है।
    - Tool/toolResult output child result text में promoted नहीं होता; result child का latest visible assistant reply होता है।

    Debug:

    ```bash
    openclaw tasks show <runId-or-sessionKey>
    ```

    दस्तावेज़: [Sub-agents](/hi/tools/subagents), [Background Tasks](/hi/automation/tasks), [Session Tools](/hi/concepts/session-tool).

  </Accordion>

  <Accordion title="Cron या रिमाइंडर नहीं चलते। मुझे क्या जांचना चाहिए?">
    Cron Gateway प्रक्रिया के अंदर चलता है। यदि Gateway लगातार नहीं चल रहा है,
    तो शेड्यूल किए गए जॉब नहीं चलेंगे।

    चेकलिस्ट:

    - पुष्टि करें कि cron सक्षम है (`cron.enabled`) और `OPENCLAW_SKIP_CRON` सेट नहीं है।
    - जांचें कि Gateway 24/7 चल रहा है (कोई स्लीप/रीस्टार्ट नहीं)।
    - जॉब के लिए टाइमज़ोन सेटिंग्स सत्यापित करें (`--tz` बनाम होस्ट टाइमज़ोन)।

    Debug:

    ```bash
    openclaw cron run <jobId>
    openclaw cron runs --id <jobId> --limit 50
    ```

    दस्तावेज़: [Cron jobs](/hi/automation/cron-jobs), [Automation](/hi/automation).

  </Accordion>

  <Accordion title="Cron चला, लेकिन चैनल पर कुछ नहीं भेजा गया। क्यों?">
    पहले डिलीवरी मोड जांचें:

    - `--no-deliver` / `delivery.mode: "none"` का मतलब है कि कोई रनर fallback send अपेक्षित नहीं है।
    - अनुपस्थित या अमान्य announce target (`channel` / `to`) का मतलब है कि रनर ने आउटबाउंड डिलीवरी छोड़ दी।
    - चैनल auth failures (`unauthorized`, `Forbidden`) का मतलब है कि रनर ने डिलीवर करने की कोशिश की लेकिन credentials ने उसे रोक दिया।
    - एक silent isolated result (केवल `NO_REPLY` / `no_reply`) को जानबूझकर non-deliverable माना जाता है, इसलिए रनर queued fallback delivery को भी दबा देता है।

    isolated cron jobs के लिए, एजेंट अब भी `message`
    tool के साथ सीधे भेज सकता है जब chat route उपलब्ध हो। `--announce` केवल उस final text
    के लिए runner fallback path नियंत्रित करता है जिसे एजेंट ने पहले से नहीं भेजा है।

    Debug:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    दस्तावेज़: [Cron jobs](/hi/automation/cron-jobs), [Background Tasks](/hi/automation/tasks).

  </Accordion>

  <Accordion title="एक isolated cron run ने मॉडल क्यों बदला या एक बार retry क्यों किया?">
    यह आमतौर पर live model-switch path होता है, duplicate scheduling नहीं।

    Isolated cron एक runtime model handoff को persist कर सकता है और active
    run द्वारा `LiveSessionModelSwitchError` फेंकने पर retry कर सकता है। Retry switched
    provider/model को बनाए रखता है, और यदि switch में नया auth profile override था, तो cron
    retry करने से पहले उसे भी persist करता है।

    संबंधित selection rules:

    - लागू होने पर Gmail hook model override पहले जीतता है।
    - फिर per-job `model`.
    - फिर कोई stored cron-session model override.
    - फिर सामान्य agent/default model selection.

    Retry loop bounded है। प्रारंभिक प्रयास और 2 switch retries के बाद,
    cron हमेशा के लिए loop करने के बजाय abort कर देता है।

    Debug:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    दस्तावेज़: [Cron jobs](/hi/automation/cron-jobs), [cron CLI](/hi/cli/cron).

  </Accordion>

  <Accordion title="मैं Linux पर Skills कैसे install करूं?">
    native `openclaw skills` commands का उपयोग करें या skills को अपने workspace में डालें। macOS Skills UI Linux पर उपलब्ध नहीं है।
    skills ब्राउज़ करें [https://clawhub.ai](https://clawhub.ai) पर।

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

    Native `openclaw skills install` डिफ़ॉल्ट रूप से active workspace `skills/`
    directory में लिखता है। सभी local agents के लिए shared managed
    skills directory में install करने के लिए `--global` जोड़ें। अलग `clawhub` CLI
    केवल तभी install करें जब आप अपनी skills publish या sync करना चाहते हों। यदि आप यह सीमित करना चाहते हैं
    कि कौन से agents shared skills देख सकते हैं, तो
    `agents.defaults.skills` या `agents.list[].skills` का उपयोग करें।

  </Accordion>

  <Accordion title="क्या OpenClaw schedule पर या background में लगातार tasks चला सकता है?">
    हां। Gateway scheduler का उपयोग करें:

    - scheduled या recurring tasks के लिए **Cron jobs** (restarts के पार persist करते हैं)।
    - "main session" periodic checks के लिए **Heartbeat**।
    - summaries post करने या chats में deliver करने वाले autonomous agents के लिए **Isolated jobs**।

    दस्तावेज़: [Cron jobs](/hi/automation/cron-jobs), [Automation](/hi/automation),
    [Heartbeat](/hi/gateway/heartbeat).

  </Accordion>

  <Accordion title="क्या मैं Linux से Apple macOS-only skills चला सकता हूं?">
    सीधे नहीं। macOS skills `metadata.openclaw.os` और required binaries से gated हैं, और skills system prompt में केवल तब दिखाई देती हैं जब वे **Gateway host** पर eligible हों। Linux पर, `darwin`-only skills (जैसे `apple-notes`, `apple-reminders`, `things-mac`) तब तक load नहीं होंगी जब तक आप gating override नहीं करते।

    आपके पास तीन supported patterns हैं:

    **Option A - Gateway को Mac पर चलाएं (सबसे सरल)।**
    Gateway को वहां चलाएं जहां macOS binaries मौजूद हैं, फिर Linux से [remote mode](#gateway-ports-already-running-and-remote-mode) में या Tailscale पर connect करें। skills सामान्य रूप से load होती हैं क्योंकि Gateway host macOS है।

    **Option B - macOS node का उपयोग करें (SSH नहीं)।**
    Gateway को Linux पर चलाएं, macOS node (menubar app) pair करें, और Mac पर **Node Run Commands** को "Always Ask" या "Always Allow" पर set करें। OpenClaw macOS-only skills को eligible मान सकता है जब required binaries node पर मौजूद हों। एजेंट उन skills को `nodes` tool के जरिए चलाता है। यदि आप "Always Ask" चुनते हैं, तो prompt में "Always Allow" approve करने से वह command allowlist में जुड़ जाती है।

    **Option C - SSH पर macOS binaries proxy करें (advanced)।**
    Gateway को Linux पर रखें, लेकिन required CLI binaries को ऐसे SSH wrappers में resolve कराएं जो Mac पर चलते हों। फिर skill को Linux allow करने के लिए override करें ताकि वह eligible बनी रहे।

    1. binary के लिए SSH wrapper बनाएं (उदाहरण: Apple Notes के लिए `memo`):

       ```bash
       #!/usr/bin/env bash
       set -euo pipefail
       exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
       ```

    2. Linux host पर wrapper को `PATH` पर रखें (उदाहरण के लिए `~/bin/memo`)।
    3. Linux allow करने के लिए skill metadata (workspace या `~/.openclaw/skills`) override करें:

       ```markdown
       ---
       name: apple-notes
       description: Manage Apple Notes via the memo CLI on macOS.
       metadata: { "openclaw": { "os": ["darwin", "linux"], "requires": { "bins": ["memo"] } } }
       ---
       ```

    4. नया session शुरू करें ताकि skills snapshot refresh हो जाए।

  </Accordion>

  <Accordion title="क्या आपके पास Notion या HeyGen integration है?">
    आज built-in नहीं है।

    विकल्प:

    - **Custom skill / Plugin:** reliable API access के लिए सबसे अच्छा (Notion/HeyGen दोनों के पास APIs हैं)।
    - **Browser automation:** code के बिना काम करता है लेकिन धीमा और अधिक fragile है।

    यदि आप प्रति client context रखना चाहते हैं (agency workflows), तो एक simple pattern है:

    - प्रति client एक Notion page (context + preferences + active work)।
    - session की शुरुआत में agent से वह page fetch करने को कहें।

    यदि आप native integration चाहते हैं, तो feature request खोलें या उन APIs
    को target करने वाली skill बनाएं।

    Skills install करें:

    ```bash
    openclaw skills install @owner/<skill-slug>
    openclaw skills update --all
    ```

    Native installs active workspace `skills/` directory में land होते हैं। सभी local agents में shared skills के लिए, `openclaw skills install @owner/<skill-slug> --global` का उपयोग करें (या उन्हें manually `~/.openclaw/skills/<name>/SKILL.md` में रखें)। यदि केवल कुछ agents को shared install दिखना चाहिए, तो `agents.defaults.skills` या `agents.list[].skills` configure करें। कुछ skills Homebrew के जरिए installed binaries expect करती हैं; Linux पर इसका मतलब Linuxbrew है (ऊपर Homebrew Linux FAQ entry देखें)। [Skills](/hi/tools/skills), [Skills config](/hi/tools/skills-config), और [ClawHub](/hi/clawhub) देखें।

  </Accordion>

  <Accordion title="मैं OpenClaw के साथ अपना मौजूदा signed-in Chrome कैसे उपयोग करूं?">
    built-in `user` browser profile का उपयोग करें, जो Chrome DevTools MCP के जरिए attach होता है:

    ```bash
    openclaw browser --browser-profile user tabs
    openclaw browser --browser-profile user snapshot
    ```

    यदि आप custom name चाहते हैं, तो explicit MCP profile बनाएं:

    ```bash
    openclaw browser create-profile --name chrome-live --driver existing-session
    openclaw browser --browser-profile chrome-live tabs
    ```

    यह path local host browser या connected browser node का उपयोग कर सकता है। यदि Gateway कहीं और चलता है, तो या तो browser machine पर node host चलाएं या remote CDP का उपयोग करें।

    `existing-session` / `user` पर मौजूदा limits:

    - actions ref-driven हैं, CSS-selector driven नहीं
    - uploads को `ref` / `inputRef` चाहिए और फिलहाल एक बार में एक file support करते हैं
    - `responsebody`, PDF export, download interception, और batch actions को अब भी managed browser या raw CDP profile चाहिए

  </Accordion>
</AccordionGroup>

## Sandboxing और memory

<AccordionGroup>
  <Accordion title="क्या dedicated sandboxing doc है?">
    हां। [Sandboxing](/hi/gateway/sandboxing) देखें। Docker-specific setup (Docker में full gateway या sandbox images) के लिए, [Docker](/hi/install/docker) देखें।
  </Accordion>

  <Accordion title="Docker सीमित लगता है - मैं full features कैसे enable करूं?">
    default image security-first है और `node` user के रूप में चलती है, इसलिए इसमें
    system packages, Homebrew, या bundled browsers शामिल नहीं होते। अधिक fuller setup के लिए:

    - `/home/node` को `OPENCLAW_HOME_VOLUME` के साथ persist करें ताकि caches बचे रहें।
    - `OPENCLAW_IMAGE_APT_PACKAGES` के साथ system deps image में bake करें।
    - bundled CLI के जरिए Playwright browsers install करें:
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - `PLAYWRIGHT_BROWSERS_PATH` set करें और सुनिश्चित करें कि path persisted है।

    दस्तावेज़: [Docker](/hi/install/docker), [Browser](/hi/tools/browser).

  </Accordion>

  <Accordion title="क्या मैं DMs को personal रखते हुए groups को एक agent के साथ public/sandboxed बना सकता हूं?">
    हां - यदि आपका private traffic **DMs** है और आपका public traffic **groups** है।

    `agents.defaults.sandbox.mode: "non-main"` का उपयोग करें ताकि group/channel sessions (non-main keys) configured sandbox backend में चलें, जबकि main DM session on-host रहे। यदि आप कोई backend नहीं चुनते हैं तो Docker default backend है। फिर sandboxed sessions में उपलब्ध tools को `tools.sandbox.tools` के जरिए restrict करें।

    Setup walkthrough + example config: [Groups: personal DMs + public groups](/hi/channels/groups#pattern-personal-dms-public-groups-single-agent)

    मुख्य config reference: [Gateway configuration](/hi/gateway/config-agents#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="मैं sandbox में host folder कैसे bind करूं?">
    `agents.defaults.sandbox.docker.binds` को `["host:path:mode"]` पर set करें (उदाहरण, `"/home/user/src:/src:ro"`)। Global + per-agent binds merge होते हैं; `scope: "shared"` होने पर per-agent binds ignored होते हैं। किसी भी sensitive चीज़ के लिए `:ro` का उपयोग करें और याद रखें कि binds sandbox filesystem walls को bypass करते हैं।

    OpenClaw bind sources को normalized path और deepest existing ancestor के जरिए resolved canonical path, दोनों के विरुद्ध validate करता है। इसका मतलब है कि symlink-parent escapes तब भी fail closed होते हैं जब last path segment अभी मौजूद नहीं है, और allowed-root checks symlink resolution के बाद भी apply होते हैं।

    उदाहरणों और safety notes के लिए [Sandboxing](/hi/gateway/sandboxing#custom-bind-mounts) और [Sandbox vs Tool Policy vs Elevated](/hi/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check) देखें।

  </Accordion>

  <Accordion title="memory कैसे काम करती है?">
    OpenClaw memory agent workspace में केवल Markdown files है:

    - Daily notes `memory/YYYY-MM-DD.md` में
    - Curated long-term notes `MEMORY.md` में (केवल main/private sessions)

    OpenClaw auto-compaction से पहले durable notes लिखने के लिए model
    को याद दिलाने हेतु **silent pre-compaction memory flush** भी चलाता है। यह केवल तब चलता है जब workspace
    writable हो (read-only sandboxes इसे skip करते हैं)। [Memory](/hi/concepts/memory) देखें।

  </Accordion>

  <Accordion title="मेमोरी चीज़ें भूलती रहती है। मैं इसे स्थायी कैसे बनाऊं?">
    बॉट से **तथ्य को मेमोरी में लिखने** के लिए कहें। दीर्घकालिक नोट्स `MEMORY.md` में होने चाहिए,
    अल्पकालिक संदर्भ `memory/YYYY-MM-DD.md` में जाता है।

    यह अभी भी ऐसा क्षेत्र है जिसे हम बेहतर बना रहे हैं। मॉडल को यादें संग्रहीत करने की याद दिलाने से मदद मिलती है;
    उसे पता होगा कि क्या करना है। यदि वह भूलता रहता है, तो सत्यापित करें कि Gateway हर रन में वही
    कार्यक्षेत्र उपयोग कर रहा है।

    दस्तावेज़: [मेमोरी](/hi/concepts/memory), [एजेंट कार्यक्षेत्र](/hi/concepts/agent-workspace).

  </Accordion>

  <Accordion title="क्या मेमोरी हमेशा बनी रहती है? सीमाएं क्या हैं?">
    मेमोरी फ़ाइलें डिस्क पर रहती हैं और तब तक बनी रहती हैं जब तक आप उन्हें हटा नहीं देते। सीमा आपकी
    स्टोरेज है, मॉडल नहीं। **सत्र संदर्भ** अभी भी मॉडल की संदर्भ विंडो से सीमित है,
    इसलिए लंबी बातचीत compact या truncate हो सकती है। इसी वजह से
    मेमोरी खोज मौजूद है - यह केवल प्रासंगिक हिस्सों को वापस संदर्भ में खींचती है।

    दस्तावेज़: [मेमोरी](/hi/concepts/memory), [संदर्भ](/hi/concepts/context).

  </Accordion>

  <Accordion title="क्या semantic मेमोरी खोज के लिए OpenAI API key चाहिए?">
    केवल तभी जब आप **OpenAI embeddings** उपयोग करते हैं। Codex OAuth चैट/कम्प्लीशंस को कवर करता है और
    embeddings access **नहीं** देता, इसलिए **Codex से साइन इन करना (OAuth या
    Codex CLI login)** semantic मेमोरी खोज में मदद नहीं करता। OpenAI embeddings को
    अब भी वास्तविक API key (`OPENAI_API_KEY` या `models.providers.openai.apiKey`) चाहिए।

    यदि आप कोई provider स्पष्ट रूप से सेट नहीं करते, तो OpenClaw OpenAI embeddings उपयोग करता है। पुराने
    configs जिनमें अब भी `memorySearch.provider = "auto"` है, वे भी OpenAI पर resolve होते हैं।
    यदि कोई OpenAI API key उपलब्ध नहीं है, तो semantic मेमोरी खोज तब तक अनुपलब्ध रहती है
    जब तक आप key configure नहीं करते या कोई दूसरा provider स्पष्ट रूप से नहीं चुनते।

    यदि आप local ही रहना चाहते हैं, तो `memorySearch.provider = "local"` सेट करें (और वैकल्पिक रूप से
    `memorySearch.fallback = "none"`). यदि आप Gemini embeddings चाहते हैं, तो
    `memorySearch.provider = "gemini"` सेट करें और `GEMINI_API_KEY` (या
    `memorySearch.remote.apiKey`) दें। हम **OpenAI, OpenAI-compatible, Gemini,
    Voyage, Mistral, Bedrock, Ollama, LM Studio, GitHub Copilot, DeepInfra, या local**
    embedding models का समर्थन करते हैं - setup details के लिए [मेमोरी](/hi/concepts/memory) देखें।

  </Accordion>
</AccordionGroup>

## डिस्क पर चीज़ें कहां रहती हैं

<AccordionGroup>
  <Accordion title="क्या OpenClaw के साथ उपयोग किया गया सारा डेटा local रूप से save होता है?">
    नहीं - **OpenClaw की state local है**, लेकिन **external services अब भी वह देखती हैं जो आप उन्हें भेजते हैं**।

    - **Default रूप से local:** sessions, memory files, config, और workspace Gateway host पर रहते हैं
      (`~/.openclaw` + आपकी workspace directory).
    - **आवश्यकता के कारण remote:** model providers (Anthropic/OpenAI/etc.) को भेजे गए messages उनकी
      APIs पर जाते हैं, और chat platforms (WhatsApp/Telegram/Slack/etc.) message data अपने
      servers पर store करते हैं।
    - **Footprint आपके नियंत्रण में है:** local models उपयोग करने से prompts आपकी machine पर रहते हैं, लेकिन channel
      traffic अब भी channel के servers से होकर जाता है।

    संबंधित: [एजेंट कार्यक्षेत्र](/hi/concepts/agent-workspace), [मेमोरी](/hi/concepts/memory).

  </Accordion>

  <Accordion title="OpenClaw अपना डेटा कहां store करता है?">
    सब कुछ `$OPENCLAW_STATE_DIR` के अंतर्गत रहता है (default: `~/.openclaw`):

    | पथ                                                             | उद्देश्य                                                           |
    | --------------------------------------------------------------- | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                             | मुख्य config (JSON5)                                               |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                    | Legacy OAuth import (पहली बार उपयोग पर auth profiles में copy किया गया) |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | Auth profiles (OAuth, API keys, और वैकल्पिक `keyRef`/`tokenRef`)  |
    | `$OPENCLAW_STATE_DIR/secrets.json`                              | `file` SecretRef providers के लिए वैकल्पिक file-backed secret payload |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`          | Legacy compatibility file (static `api_key` entries scrubbed)      |
    | `$OPENCLAW_STATE_DIR/credentials/`                              | Provider state (जैसे `whatsapp/<accountId>/creds.json`)            |
    | `$OPENCLAW_STATE_DIR/agents/`                                   | प्रति-एजेंट state (agentDir + sessions)                            |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                | बातचीत का इतिहास और state (प्रति एजेंट)                            |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`   | Session metadata (प्रति एजेंट)                                     |

    Legacy single-agent path: `~/.openclaw/agent/*` (`openclaw doctor` द्वारा migrate किया गया).

    आपका **workspace** (AGENTS.md, memory files, skills, आदि) अलग है और `agents.defaults.workspace` के ज़रिए configure होता है (default: `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title="AGENTS.md / SOUL.md / USER.md / MEMORY.md कहां होने चाहिए?">
    ये files **agent workspace** में रहती हैं, `~/.openclaw` में नहीं।

    - **Workspace (प्रति एजेंट)**: `AGENTS.md`, `SOUL.md`, `IDENTITY.md`, `USER.md`,
      `MEMORY.md`, `memory/YYYY-MM-DD.md`, वैकल्पिक `HEARTBEAT.md`.
      Lowercase root `memory.md` केवल legacy repair input है; `openclaw doctor --fix`
      दोनों files मौजूद होने पर इसे `MEMORY.md` में merge कर सकता है।
    - **State dir (`~/.openclaw`)**: config, channel/provider state, auth profiles, sessions, logs,
      और shared skills (`~/.openclaw/skills`).

    Default workspace `~/.openclaw/workspace` है, जिसे इसके ज़रिए configure किया जा सकता है:

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    यदि restart के बाद बॉट "भूल" जाता है, तो पुष्टि करें कि Gateway हर launch पर वही
    workspace उपयोग कर रहा है (और याद रखें: remote mode **gateway host का**
    workspace उपयोग करता है, आपके local laptop का नहीं).

    सुझाव: यदि आप कोई टिकाऊ behavior या preference चाहते हैं, तो chat history पर निर्भर रहने के बजाय
    बॉट से उसे **AGENTS.md या MEMORY.md में लिखने** के लिए कहें।

    [एजेंट कार्यक्षेत्र](/hi/concepts/agent-workspace) और [मेमोरी](/hi/concepts/memory) देखें।

  </Accordion>

  <Accordion title="क्या मैं SOUL.md को बड़ा बना सकता हूं?">
    हां। `SOUL.md` उन workspace bootstrap files में से एक है जिन्हें
    agent context में inject किया जाता है। Default प्रति-file injection limit `20000` characters है,
    और files में कुल bootstrap budget `60000` characters है।

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

    Raw बनाम injected sizes और truncation हुआ या नहीं जांचने के लिए `/context` उपयोग करें।
    `SOUL.md` को voice, stance, और personality पर focused रखें; operating rules
    `AGENTS.md` में और टिकाऊ facts memory में रखें।

    [संदर्भ](/hi/concepts/context) और [एजेंट config](/hi/gateway/config-agents) देखें।

  </Accordion>

  <Accordion title="अनुशंसित backup strategy">
    अपने **agent workspace** को **private** git repo में रखें और उसे किसी private जगह
    backup करें (उदाहरण के लिए GitHub private). इससे memory + AGENTS/SOUL/USER
    files capture होती हैं, और बाद में assistant का "mind" restore किया जा सकता है।

    `~/.openclaw` के अंतर्गत कुछ भी commit **न करें** (credentials, sessions, tokens, या encrypted secrets payloads).
    यदि आपको full restore चाहिए, तो workspace और state directory दोनों को
    अलग-अलग backup करें (ऊपर migration question देखें).

    दस्तावेज़: [एजेंट कार्यक्षेत्र](/hi/concepts/agent-workspace).

  </Accordion>

  <Accordion title="मैं OpenClaw को पूरी तरह uninstall कैसे करूं?">
    समर्पित guide देखें: [Uninstall](/hi/install/uninstall).
  </Accordion>

  <Accordion title="क्या agents workspace के बाहर काम कर सकते हैं?">
    हां। Workspace **default cwd** और memory anchor है, कोई hard sandbox नहीं।
    Relative paths workspace के अंदर resolve होते हैं, लेकिन absolute paths अन्य
    host locations तक पहुंच सकते हैं, जब तक sandboxing enabled न हो। यदि आपको isolation चाहिए, तो
    [`agents.defaults.sandbox`](/hi/gateway/sandboxing) या प्रति-agent sandbox settings उपयोग करें। यदि आप
    किसी repo को default working directory बनाना चाहते हैं, तो उस agent के
    `workspace` को repo root पर point करें। OpenClaw repo केवल source code है; workspace को
    अलग रखें, जब तक आप जानबूझकर agent को उसके अंदर काम कराना नहीं चाहते।

    उदाहरण (repo को default cwd के रूप में):

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
    Session state **gateway host** के स्वामित्व में है। यदि आप remote mode में हैं, तो जिस session store की आपको परवाह है वह remote machine पर है, आपके local laptop पर नहीं। [Session management](/hi/concepts/session) देखें।
  </Accordion>
</AccordionGroup>

## Config basics

<AccordionGroup>
  <Accordion title="Config किस format में है? यह कहां है?">
    OpenClaw `$OPENCLAW_CONFIG_PATH` से वैकल्पिक **JSON5** config पढ़ता है (default: `~/.openclaw/openclaw.json`):

    ```
    $OPENCLAW_CONFIG_PATH
    ```

    यदि file मौजूद नहीं है, तो यह safe-ish defaults उपयोग करता है (जिसमें `~/.openclaw/workspace` का default workspace शामिल है).

  </Accordion>

  <Accordion title='मैंने gateway.bind: "lan" (या "tailnet") सेट किया और अब कुछ भी listen नहीं करता / UI unauthorized कहता है'>
    Non-loopback binds के लिए **valid gateway auth path आवश्यक है**। व्यवहार में इसका अर्थ है:

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
    - Local call paths `gateway.auth.*` unset होने पर ही fallback के रूप में `gateway.remote.*` उपयोग कर सकते हैं।
    - Password auth के लिए, इसके बजाय `gateway.auth.mode: "password"` के साथ `gateway.auth.password` (या `OPENCLAW_GATEWAY_PASSWORD`) सेट करें।
    - यदि `gateway.auth.token` / `gateway.auth.password` SecretRef के ज़रिए स्पष्ट रूप से configure है और unresolved है, तो resolution fails closed होता है (कोई remote fallback masking नहीं).
    - Shared-secret Control UI setups `connect.params.auth.token` या `connect.params.auth.password` (app/UI settings में stored) के ज़रिए authenticate करते हैं। Tailscale Serve या `trusted-proxy` जैसे identity-bearing modes इसके बजाय request headers उपयोग करते हैं। Shared secrets को URLs में डालने से बचें।
    - `gateway.auth.mode: "trusted-proxy"` के साथ, same-host loopback reverse proxies को explicit `gateway.auth.trustedProxy.allowLoopback = true` और `gateway.trustedProxies` में loopback entry चाहिए।

  </Accordion>

  <Accordion title="अब localhost पर token क्यों चाहिए?">
    OpenClaw default रूप से gateway auth enforce करता है, जिसमें loopback भी शामिल है। सामान्य default path में इसका अर्थ token auth है: यदि कोई explicit auth path configured नहीं है, तो gateway startup token mode पर resolve होता है और उस startup के लिए runtime-only token generate करता है, इसलिए **local WS clients को authenticate करना होगा**। जब clients को restarts के बीच stable secret चाहिए, तो `gateway.auth.token`, `gateway.auth.password`, `OPENCLAW_GATEWAY_TOKEN`, या `OPENCLAW_GATEWAY_PASSWORD` स्पष्ट रूप से configure करें। यह अन्य local processes को Gateway call करने से रोकता है।

    यदि आप कोई अलग auth पथ पसंद करते हैं, तो आप स्पष्ट रूप से password mode (या, identity-aware reverse proxies के लिए, `trusted-proxy`) चुन सकते हैं। यदि आप **वास्तव में** खुला loopback चाहते हैं, तो अपनी config में `gateway.auth.mode: "none"` स्पष्ट रूप से सेट करें। Doctor आपके लिए किसी भी समय token जनरेट कर सकता है: `openclaw doctor --generate-gateway-token`.

  </Accordion>

  <Accordion title="क्या config बदलने के बाद मुझे restart करना होगा?">
    Gateway config को watch करता है और hot-reload का समर्थन करता है:

    - `gateway.reload.mode: "hybrid"` (default): सुरक्षित बदलावों को hot-apply करें, critical बदलावों के लिए restart करें
    - `hot`, `restart`, `off` भी समर्थित हैं

  </Accordion>

  <Accordion title="मैं मज़ेदार CLI taglines कैसे disable करूँ?">
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
    - `random`: बदलती हुई मज़ेदार/seasonal taglines (default behavior)।
    - यदि आप कोई banner बिल्कुल नहीं चाहते, तो env `OPENCLAW_HIDE_BANNER=1` सेट करें।

  </Accordion>

  <Accordion title="मैं web search (और web fetch) कैसे enable करूँ?">
    `web_fetch` API key के बिना काम करता है। `web_search` आपके चुने हुए
    provider पर निर्भर करता है:

    - Brave, Exa, Firecrawl, Gemini, Kimi, MiniMax Search, Perplexity, और Tavily जैसे API-backed providers को उनके सामान्य API key setup की आवश्यकता होती है।
    - Grok model auth से xAI OAuth का पुनः उपयोग कर सकता है, या `XAI_API_KEY` / plugin web-search config पर वापस जा सकता है।
    - Ollama Web Search key-free है, लेकिन यह आपके configured Ollama host का उपयोग करता है और `ollama signin` की आवश्यकता होती है।
    - DuckDuckGo key-free है, लेकिन यह एक अनौपचारिक HTML-based integration है।
    - SearXNG key-free/self-hosted है; `SEARXNG_BASE_URL` या `plugins.entries.searxng.config.webSearch.baseUrl` configure करें।

    **अनुशंसित:** `openclaw configure --section web` चलाएँ और एक provider चुनें।
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
    Legacy `tools.web.search.*` provider paths compatibility के लिए अभी भी अस्थायी रूप से load होते हैं, लेकिन नई configs के लिए उनका उपयोग नहीं किया जाना चाहिए।
    Firecrawl web-fetch fallback config `plugins.entries.firecrawl.config.webFetch.*` के अंतर्गत रहता है।

    नोट्स:

    - यदि आप allowlists का उपयोग करते हैं, तो `web_search`/`web_fetch`/`x_search` या `group:web` जोड़ें।
    - `web_fetch` default रूप से enabled है (जब तक स्पष्ट रूप से disabled न हो)।
    - यदि `tools.web.fetch.provider` छोड़ा गया है, तो OpenClaw उपलब्ध credentials से पहले ready fetch fallback provider को auto-detect करता है। आधिकारिक Firecrawl plugin वह fallback देता है।
    - Daemons env vars को `~/.openclaw/.env` (या service environment) से पढ़ते हैं।

    दस्तावेज़: [Web tools](/hi/tools/web).

  </Accordion>

  <Accordion title="config.apply ने मेरी config मिटा दी। मैं इसे कैसे recover करूँ और इससे कैसे बचूँ?">
    `config.apply` **पूरी config** को replace करता है। यदि आप partial object भेजते हैं, तो बाकी
    सब कुछ हटा दिया जाता है।

    वर्तमान OpenClaw कई accidental clobbers से बचाता है:

    - OpenClaw-owned config writes लिखने से पहले पूरी post-change config को validate करते हैं।
    - Invalid या destructive OpenClaw-owned writes reject कर दिए जाते हैं और `openclaw.json.rejected.*` के रूप में save किए जाते हैं।
    - यदि कोई direct edit startup या hot reload तोड़ देता है, तो Gateway fail closed करता है या reload skip करता है; यह `openclaw.json` को rewrite नहीं करता।
    - `openclaw doctor --fix` repair का owner है और rejected file को `openclaw.json.clobbered.*` के रूप में save करते हुए last-known-good restore कर सकता है।

    Recover करें:

    - `Invalid config at`, `Config write rejected:`, या `config reload skipped (invalid config)` के लिए `openclaw logs --follow` देखें।
    - active config के पास नवीनतम `openclaw.json.clobbered.*` या `openclaw.json.rejected.*` inspect करें।
    - `openclaw config validate` और `openclaw doctor --fix` चलाएँ।
    - केवल intended keys को `openclaw config set` या `config.patch` के साथ वापस copy करें।
    - यदि आपके पास कोई last-known-good या rejected payload नहीं है, तो backup से restore करें, या `openclaw doctor` फिर से चलाएँ और channels/models फिर से configure करें।
    - यदि यह unexpected था, तो bug file करें और अपनी last known config या कोई backup शामिल करें।
    - एक local coding agent अक्सर logs या history से working config reconstruct कर सकता है।

    इससे बचें:

    - छोटे बदलावों के लिए `openclaw config set` का उपयोग करें।
    - interactive edits के लिए `openclaw configure` का उपयोग करें।
    - जब आप exact path या field shape के बारे में निश्चित न हों, तो पहले `config.schema.lookup` का उपयोग करें; यह drill-down के लिए shallow schema node और immediate child summaries लौटाता है।
    - partial RPC edits के लिए `config.patch` का उपयोग करें; `config.apply` को केवल full-config replacement के लिए रखें।
    - यदि आप agent run से agent-facing `gateway` tool का उपयोग कर रहे हैं, तो यह अभी भी `tools.exec.ask` / `tools.exec.security` (legacy `tools.bash.*` aliases सहित, जो उसी protected exec paths में normalize होते हैं) पर writes reject करेगा।

    दस्तावेज़: [Config](/hi/cli/config), [Configure](/hi/cli/configure), [Gateway troubleshooting](/hi/gateway/troubleshooting#gateway-rejected-invalid-config), [Doctor](/hi/gateway/doctor).

  </Accordion>

  <Accordion title="मैं devices पर specialized workers के साथ central Gateway कैसे चलाऊँ?">
    सामान्य pattern **एक Gateway** (जैसे Raspberry Pi) और **nodes** तथा **agents** है:

    - **Gateway (central):** channels (Signal/WhatsApp), routing, और sessions का owner होता है।
    - **Nodes (devices):** Macs/iOS/Android peripherals के रूप में connect होते हैं और local tools (`system.run`, `canvas`, `camera`) expose करते हैं।
    - **Agents (workers):** special roles (जैसे "Hetzner ops", "Personal data") के लिए अलग brains/workspaces।
    - **Sub-agents:** जब आप parallelism चाहते हैं, तो main agent से background work spawn करें।
    - **TUI:** Gateway से connect करें और agents/sessions switch करें।

    दस्तावेज़: [Nodes](/hi/nodes), [Remote access](/hi/gateway/remote), [Multi-Agent Routing](/hi/concepts/multi-agent), [Sub-agents](/hi/tools/subagents), [TUI](/hi/web/tui).

  </Accordion>

  <Accordion title="क्या OpenClaw browser headless चल सकता है?">
    हाँ। यह एक config option है:

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

    - कोई visible browser window नहीं (यदि आपको visuals चाहिए, तो screenshots का उपयोग करें)।
    - कुछ sites headless mode में automation के बारे में अधिक strict होती हैं (CAPTCHAs, anti-bot)।
      उदाहरण के लिए, X/Twitter अक्सर headless sessions block करता है।

  </Accordion>

  <Accordion title="मैं browser control के लिए Brave का उपयोग कैसे करूँ?">
    `browser.executablePath` को अपने Brave binary (या किसी भी Chromium-based browser) पर सेट करें और Gateway restart करें।
    पूरे config examples [Browser](/hi/tools/browser#use-brave-or-another-chromium-based-browser) में देखें।
  </Accordion>
</AccordionGroup>

## Remote gateways और nodes

<AccordionGroup>
  <Accordion title="Telegram, gateway, और nodes के बीच commands कैसे propagate होते हैं?">
    Telegram messages को **gateway** handle करता है। gateway agent चलाता है और
    केवल तब **Gateway WebSocket** पर nodes को call करता है जब node tool की आवश्यकता होती है:

    Telegram → Gateway → Agent → `node.*` → Node → Gateway → Telegram

    Nodes inbound provider traffic नहीं देखते; उन्हें केवल node RPC calls मिलते हैं।

  </Accordion>

  <Accordion title="यदि Gateway remotely hosted है, तो मेरा agent मेरे computer को कैसे access कर सकता है?">
    संक्षिप्त उत्तर: **अपने computer को node के रूप में pair करें**। Gateway कहीं और चलता है, लेकिन यह
    Gateway WebSocket पर आपकी local machine पर `node.*` tools (screen, camera, system) call कर सकता है।

    सामान्य setup:

    1. Gateway को always-on host (VPS/home server) पर चलाएँ।
    2. Gateway host + अपने computer को उसी tailnet पर रखें।
    3. सुनिश्चित करें कि Gateway WS reachable है (tailnet bind या SSH tunnel)।
    4. macOS app को locally खोलें और **Remote over SSH** mode (या direct tailnet) में connect करें
       ताकि यह node के रूप में register हो सके।
    5. Gateway पर node approve करें:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    अलग TCP bridge की आवश्यकता नहीं है; nodes Gateway WebSocket पर connect होते हैं।

    Security reminder: macOS node pair करने से उस machine पर `system.run` की अनुमति मिलती है। केवल
    trusted devices pair करें, और [Security](/hi/gateway/security) review करें।

    दस्तावेज़: [Nodes](/hi/nodes), [Gateway protocol](/hi/gateway/protocol), [macOS remote mode](/hi/platforms/mac/remote), [Security](/hi/gateway/security).

  </Accordion>

  <Accordion title="Tailscale connected है लेकिन मुझे replies नहीं मिल रहे। अब क्या करूँ?">
    basics जांचें:

    - Gateway चल रहा है: `openclaw gateway status`
    - Gateway health: `openclaw status`
    - Channel health: `openclaw channels status`

    फिर auth और routing verify करें:

    - यदि आप Tailscale Serve का उपयोग करते हैं, तो सुनिश्चित करें कि `gateway.auth.allowTailscale` सही ढंग से set है।
    - यदि आप SSH tunnel के माध्यम से connect करते हैं, तो confirm करें कि local tunnel up है और सही port की ओर point करता है।
    - Confirm करें कि आपकी allowlists (DM या group) में आपका account शामिल है।

    दस्तावेज़: [Tailscale](/hi/gateway/tailscale), [Remote access](/hi/gateway/remote), [Channels](/hi/channels).

  </Accordion>

  <Accordion title="क्या दो OpenClaw instances आपस में बात कर सकते हैं (local + VPS)?">
    हाँ। कोई built-in "bot-to-bot" bridge नहीं है, लेकिन आप इसे कुछ
    reliable तरीकों से wire up कर सकते हैं:

    **सबसे सरल:** एक normal chat channel का उपयोग करें जिसे दोनों bots access कर सकते हैं (Telegram/Slack/WhatsApp)।
    Bot A से Bot B को message भेजें, फिर Bot B को सामान्य रूप से reply करने दें।

    **CLI bridge (generic):** एक script चलाएँ जो दूसरे Gateway को
    `openclaw agent --message ... --deliver` के साथ call करे, ऐसे chat को target करते हुए जहाँ दूसरा bot
    सुनता है। यदि एक bot remote VPS पर है, तो अपनी CLI को SSH/Tailscale के माध्यम से उस remote Gateway
    की ओर point करें ([Remote access](/hi/gateway/remote) देखें)।

    Example pattern (ऐसी machine से चलाएँ जो target Gateway तक पहुँच सकती हो):

    ```bash
    openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    Tip: guardrail जोड़ें ताकि दोनों bots endless loop न करें (mention-only, channel
    allowlists, या "bot messages का reply न करें" rule)।

    दस्तावेज़: [Remote access](/hi/gateway/remote), [Agent CLI](/hi/cli/agent), [Agent send](/hi/tools/agent-send).

  </Accordion>

  <Accordion title="क्या मुझे multiple agents के लिए अलग VPSes चाहिए?">
    नहीं। एक Gateway multiple agents host कर सकता है, प्रत्येक अपने workspace, model defaults,
    और routing के साथ। यह normal setup है और प्रति agent एक VPS चलाने की तुलना में बहुत सस्ता और सरल है।

    अलग VPSes केवल तब उपयोग करें जब आपको hard isolation (security boundaries) या बहुत
    अलग configs चाहिए जिन्हें आप share नहीं करना चाहते। अन्यथा, एक Gateway रखें और
    multiple agents या sub-agents का उपयोग करें।

  </Accordion>

  <Accordion title="क्या VPS से SSH के बजाय मेरे निजी लैपटॉप पर Node इस्तेमाल करने का कोई लाभ है?">
    हाँ - दूरस्थ Gateway से आपके लैपटॉप तक पहुँचने का प्रथम-श्रेणी तरीका Nodes हैं, और वे
    shell पहुँच से अधिक सुविधाएँ खोलते हैं। Gateway macOS/Linux पर चलता है (Windows via WSL2) और
    हल्का है (एक छोटा VPS या Raspberry Pi-स्तर का बॉक्स ठीक है; 4 GB RAM पर्याप्त है), इसलिए एक सामान्य
    सेटअप हमेशा चालू रहने वाला host और आपका लैपटॉप Node के रूप में होता है।

    - **इनबाउंड SSH आवश्यक नहीं।** Nodes Gateway WebSocket से बाहर की ओर कनेक्ट होते हैं और device pairing का उपयोग करते हैं।
    - **अधिक सुरक्षित execution controls।** `system.run` उस लैपटॉप पर Node allowlists/approvals द्वारा gate किया जाता है।
    - **अधिक device tools।** Nodes `system.run` के अलावा `canvas`, `camera`, और `screen` expose करते हैं।
    - **स्थानीय browser automation।** Gateway को VPS पर रखें, लेकिन लैपटॉप पर Node host के जरिए Chrome locally चलाएँ, या Chrome MCP के जरिए host पर local Chrome से attach करें।

    ad-hoc shell access के लिए SSH ठीक है, लेकिन लगातार agent workflows और
    device automation के लिए Nodes सरल हैं।

    दस्तावेज़: [Nodes](/hi/nodes), [Nodes CLI](/hi/cli/nodes), [ब्राउज़र](/hi/tools/browser).

  </Accordion>

  <Accordion title="क्या Nodes gateway service चलाते हैं?">
    नहीं। जब तक आप जानबूझकर isolated profiles नहीं चलाते (देखें [कई gateways](/hi/gateway/multiple-gateways)), प्रति host केवल **एक gateway** चलना चाहिए। Nodes peripherals हैं जो
    gateway से connect होते हैं (iOS/Android Nodes, या menubar app में macOS "node mode")। headless Node
    hosts और CLI control के लिए, देखें [Node host CLI](/hi/cli/node).

    `gateway`, `discovery`, और hosted Plugin surface बदलावों के लिए full restart आवश्यक है।

  </Accordion>

  <Accordion title="क्या config लागू करने का API / RPC तरीका है?">
    हाँ।

    - `config.schema.lookup`: लिखने से पहले एक config subtree को उसके shallow schema node, matched UI hint, और immediate child summaries के साथ inspect करें
    - `config.get`: current snapshot + hash fetch करें
    - `config.patch`: सुरक्षित partial update (अधिकांश RPC edits के लिए preferred); संभव होने पर hot-reload करता है और आवश्यक होने पर restart करता है
    - `config.apply`: full config validate + replace करें; संभव होने पर hot-reload करता है और आवश्यक होने पर restart करता है
    - agent-facing `gateway` runtime tool अभी भी `tools.exec.ask` / `tools.exec.security` को rewrite करने से इनकार करता है; legacy `tools.bash.*` aliases उसी protected exec paths में normalize होते हैं

  </Accordion>

  <Accordion title="पहले install के लिए न्यूनतम समझदार config">
    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
      channels: { whatsapp: { allowFrom: ["+15555550123"] } },
    }
    ```

    यह आपका workspace set करता है और restrict करता है कि bot को कौन trigger कर सकता है।

  </Accordion>

  <Accordion title="मैं VPS पर Tailscale कैसे set up करूँ और अपने Mac से कैसे connect करूँ?">
    न्यूनतम चरण:

    1. **VPS पर install + login करें**

       ```bash
       curl -fsSL https://tailscale.com/install.sh | sh
       sudo tailscale up
       ```

    2. **अपने Mac पर install + login करें**
       - Tailscale app का उपयोग करें और उसी tailnet में sign in करें।
    3. **MagicDNS enable करें (recommended)**
       - Tailscale admin console में MagicDNS enable करें ताकि VPS का stable name हो।
    4. **tailnet hostname का उपयोग करें**
       - SSH: `ssh user@your-vps.tailnet-xxxx.ts.net`
       - Gateway WS: `ws://your-vps.tailnet-xxxx.ts.net:18789`

    यदि आप SSH के बिना Control UI चाहते हैं, तो VPS पर Tailscale Serve का उपयोग करें:

    ```bash
    openclaw gateway --tailscale serve
    ```

    यह gateway को loopback से bound रखता है और Tailscale के जरिए HTTPS expose करता है। देखें [Tailscale](/hi/gateway/tailscale).

  </Accordion>

  <Accordion title="मैं Mac Node को remote Gateway (Tailscale Serve) से कैसे connect करूँ?">
    Serve **Gateway Control UI + WS** expose करता है। Nodes उसी Gateway WS endpoint पर connect होते हैं।

    recommended setup:

    1. **सुनिश्चित करें कि VPS + Mac एक ही tailnet पर हैं**।
    2. **macOS app को Remote mode में उपयोग करें** (SSH target tailnet hostname हो सकता है)।
       app Gateway port को tunnel करेगा और Node के रूप में connect होगा।
    3. gateway पर **Node approve करें**:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    दस्तावेज़: [Gateway protocol](/hi/gateway/protocol), [Discovery](/hi/gateway/discovery), [macOS remote mode](/hi/platforms/mac/remote).

  </Accordion>

  <Accordion title="क्या मुझे दूसरे लैपटॉप पर install करना चाहिए या सिर्फ Node जोड़ना चाहिए?">
    यदि आपको दूसरे लैपटॉप पर केवल **local tools** (screen/camera/exec) चाहिए, तो उसे
    **Node** के रूप में जोड़ें। इससे एक ही Gateway रहता है और duplicated config से बचता है। Local Node tools
    currently केवल macOS के लिए हैं, लेकिन हम इन्हें अन्य OSes तक extend करने की योजना रखते हैं।

    दूसरा Gateway केवल तब install करें जब आपको **hard isolation** या दो पूरी तरह अलग bots चाहिए हों।

    दस्तावेज़: [Nodes](/hi/nodes), [Nodes CLI](/hi/cli/nodes), [कई gateways](/hi/gateway/multiple-gateways).

  </Accordion>
</AccordionGroup>

## Env vars और .env loading

<AccordionGroup>
  <Accordion title="OpenClaw environment variables कैसे load करता है?">
    OpenClaw parent process (shell, launchd/systemd, CI, आदि) से env vars पढ़ता है और अतिरिक्त रूप से load करता है:

    - current working directory से `.env`
    - `~/.openclaw/.env` से global fallback `.env` (अर्थात `$OPENCLAW_STATE_DIR/.env`)

    कोई भी `.env` file existing env vars override नहीं करती।
    Provider credential variables workspace `.env` के लिए exception हैं: जैसे keys
    `GEMINI_API_KEY`, `XAI_API_KEY`, या `MISTRAL_API_KEY` workspace
    `.env` से ignore की जाती हैं और process environment, `~/.openclaw/.env`, या config `env` में रहनी चाहिए।

    आप config में inline env vars भी define कर सकते हैं (केवल process env में missing होने पर applied):

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
    दो common fixes:

    1. missing keys को `~/.openclaw/.env` में रखें ताकि service द्वारा आपका shell env inherit न करने पर भी वे picked up हों।
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

    यह आपका login shell चलाता है और केवल missing expected keys import करता है (कभी override नहीं करता)। Env var equivalents:
    `OPENCLAW_LOAD_SHELL_ENV=1`, `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`.

  </Accordion>

  <Accordion title='मैंने COPILOT_GITHUB_TOKEN set किया, लेकिन models status "Shell env: off." दिखाता है। क्यों?'>
    `openclaw models status` report करता है कि **shell env import** enabled है या नहीं। "Shell env: off"
    का अर्थ यह **नहीं** है कि आपके env vars missing हैं - इसका बस अर्थ है कि OpenClaw
    आपका login shell automatically load नहीं करेगा।

    यदि Gateway service (launchd/systemd) के रूप में चलता है, तो यह आपका shell
    environment inherit नहीं करेगा। इनमें से एक करके fix करें:

    1. token को `~/.openclaw/.env` में रखें:

       ```
       COPILOT_GITHUB_TOKEN=...
       ```

    2. या shell import enable करें (`env.shellEnv.enabled: true`)।
    3. या इसे अपने config `env` block में जोड़ें (केवल missing होने पर apply होता है)।

    फिर gateway restart करें और दोबारा check करें:

    ```bash
    openclaw models status
    ```

    Copilot tokens `COPILOT_GITHUB_TOKEN` (साथ ही `GH_TOKEN` / `GITHUB_TOKEN`) से read किए जाते हैं।
    देखें [/concepts/model-providers](/hi/concepts/model-providers) और [/environment](/hi/help/environment).

  </Accordion>
</AccordionGroup>

## Sessions और multiple chats

<AccordionGroup>
  <Accordion title="मैं fresh conversation कैसे start करूँ?">
    standalone message के रूप में `/new` या `/reset` भेजें। देखें [Session management](/hi/concepts/session).
  </Accordion>

  <Accordion title="यदि मैं कभी /new नहीं भेजता, तो क्या sessions automatically reset होते हैं?">
    Sessions `session.idleMinutes` के बाद expire हो सकते हैं, लेकिन यह **default रूप से disabled** है (default **0**)।
    idle expiry enable करने के लिए इसे positive value पर set करें। Enabled होने पर, idle period के बाद **अगला**
    message उस chat key के लिए fresh session id start करता है।
    यह transcripts delete नहीं करता - यह बस नया session start करता है।

    ```json5
    {
      session: {
        idleMinutes: 240,
      },
    }
    ```

  </Accordion>

  <Accordion title="क्या OpenClaw instances की team बनाने का कोई तरीका है (एक CEO और कई agents)?">
    हाँ, **multi-agent routing** और **sub-agents** के जरिए। आप एक coordinator
    agent और कई worker agents उनके अपने workspaces और models के साथ बना सकते हैं।

    फिर भी, इसे **मज़ेदार experiment** के रूप में देखना सबसे बेहतर है। यह token heavy है और अक्सर
    अलग sessions वाले एक bot का उपयोग करने से कम efficient होता है। typical model जिसे हम
    envision करते हैं वह एक bot है जिससे आप बात करते हैं, parallel work के लिए अलग sessions के साथ। वह
    bot जरूरत पड़ने पर sub-agents भी spawn कर सकता है।

    दस्तावेज़: [Multi-agent routing](/hi/concepts/multi-agent), [Sub-agents](/hi/tools/subagents), [Agents CLI](/hi/cli/agents).

  </Accordion>

  <Accordion title="Context mid-task truncate क्यों हो गया? मैं इसे कैसे रोकूँ?">
    Session context model window द्वारा limited होता है। Long chats, large tool outputs, या कई
    files compaction या truncation trigger कर सकते हैं।

    क्या मदद करता है:

    - bot से current state summarize करने और इसे file में लिखने को कहें।
    - long tasks से पहले `/compact` का उपयोग करें, और topics switch करते समय `/new` का उपयोग करें।
    - important context workspace में रखें और bot से उसे वापस read करने को कहें।
    - long या parallel work के लिए sub-agents का उपयोग करें ताकि main chat छोटा रहे।
    - यदि यह अक्सर होता है तो larger context window वाला model चुनें।

  </Accordion>

  <Accordion title="मैं OpenClaw को पूरी तरह reset कैसे करूँ लेकिन installed रहने दूँ?">
    reset command का उपयोग करें:

    ```bash
    openclaw reset
    ```

    Non-interactive full reset:

    ```bash
    openclaw reset --scope full --yes --non-interactive
    ```

    फिर setup दोबारा चलाएँ:

    ```bash
    openclaw onboard --install-daemon
    ```

    Notes:

    - यदि onboarding existing config देखता है, तो वह **Reset** भी offer करता है। देखें [Onboarding (CLI)](/hi/start/wizard).
    - यदि आपने profiles (`--profile` / `OPENCLAW_PROFILE`) उपयोग किए हैं, तो प्रत्येक state dir reset करें (defaults `~/.openclaw-<profile>` हैं)।
    - Dev reset: `openclaw gateway --dev --reset` (केवल dev; dev config + credentials + sessions + workspace wipe करता है)।

  </Accordion>

  <Accordion title='मुझे "context too large" errors मिल रहे हैं - मैं reset या compact कैसे करूँ?'>
    इनमें से एक का उपयोग करें:

    - **Compact** (conversation रखता है लेकिन पुराने turns summarize करता है):

      ```
      /compact
      ```

      या summary guide करने के लिए `/compact <instructions>`।

    - **Reset** (same chat key के लिए fresh session ID):

      ```
      /new
      /reset
      ```

    यदि यह होता रहता है:

    - पुराने tool output trim करने के लिए **session pruning** (`agents.defaults.contextPruning`) enable या tune करें।
    - larger context window वाले model का उपयोग करें।

    दस्तावेज़: [Compaction](/hi/concepts/compaction), [Session pruning](/hi/concepts/session-pruning), [Session management](/hi/concepts/session).

  </Accordion>

  <Accordion title='मैं "LLM request rejected: messages.content.tool_use.input field required" क्यों देख रहा हूँ?'>
    यह provider validation error है: model ने required
    `input` के बिना `tool_use` block emit किया। इसका आम तौर पर अर्थ है कि session history stale या corrupted है (अक्सर long threads
    या tool/schema change के बाद)।

    Fix: `/new` (standalone message) के साथ fresh session start करें।

  </Accordion>

  <Accordion title="मुझे हर 30 minutes में heartbeat messages क्यों मिल रहे हैं?">
    Heartbeats default रूप से हर **30m** चलते हैं (OAuth auth उपयोग करते समय **1h**)। इन्हें tune या disable करें:

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

    यदि `HEARTBEAT.md` मौजूद है लेकिन प्रभावी रूप से खाली है (केवल खाली पंक्तियां,
    Markdown/HTML टिप्पणियां, `# Heading` जैसी Markdown हेडिंग, fence markers,
    या खाली checklist stubs), तो OpenClaw API कॉल बचाने के लिए Heartbeat रन छोड़ देता है.
    अगर फ़ाइल मौजूद नहीं है, तो Heartbeat फिर भी चलता है और मॉडल तय करता है कि क्या करना है.

    प्रति-agent overrides `agents.list[].heartbeat` का उपयोग करते हैं. दस्तावेज़: [Heartbeat](/hi/gateway/heartbeat).

  </Accordion>

  <Accordion title='क्या मुझे WhatsApp समूह में "bot account" जोड़ने की जरूरत है?'>
    नहीं. OpenClaw **आपके अपने account** पर चलता है, इसलिए अगर आप समूह में हैं, तो OpenClaw उसे देख सकता है.
    डिफ़ॉल्ट रूप से, समूह replies तब तक blocked रहती हैं जब तक आप senders को अनुमति नहीं देते (`groupPolicy: "allowlist"`).

    अगर आप चाहते हैं कि केवल **आप** समूह replies trigger कर सकें:

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

  <Accordion title="मैं WhatsApp समूह का JID कैसे प्राप्त करूं?">
    विकल्प 1 (सबसे तेज): logs tail करें और समूह में एक test message भेजें:

    ```bash
    openclaw logs --follow --json
    ```

    `@g.us` पर समाप्त होने वाला `chatId` (या `from`) ढूंढें, जैसे:
    `1234567890-1234567890@g.us`.

    विकल्प 2 (अगर पहले से configured/allowlisted है): config से समूह list करें:

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    दस्तावेज़: [WhatsApp](/hi/channels/whatsapp), [Directory](/hi/cli/directory), [Logs](/hi/cli/logs).

  </Accordion>

  <Accordion title="OpenClaw समूह में reply क्यों नहीं करता?">
    दो सामान्य कारण:

    - Mention gating चालू है (डिफ़ॉल्ट). आपको bot को @mention करना होगा (या `mentionPatterns` से match करना होगा).
    - आपने `channels.whatsapp.groups` को `"*"` के बिना configured किया है और समूह allowlisted नहीं है.

    [Groups](/hi/channels/groups) और [Group messages](/hi/channels/group-messages) देखें.

  </Accordion>

  <Accordion title="क्या groups/threads DMs के साथ context साझा करते हैं?">
    Direct chats डिफ़ॉल्ट रूप से मुख्य session में collapse हो जाते हैं. Groups/channels की अपनी session keys होती हैं, और Telegram topics / Discord threads अलग sessions होते हैं. [Groups](/hi/channels/groups) और [Group messages](/hi/channels/group-messages) देखें.
  </Accordion>

  <Accordion title="मैं कितने workspaces और agents बना सकता हूं?">
    कोई hard limits नहीं. दर्जनों (यहां तक कि सैकड़ों) ठीक हैं, लेकिन इन पर ध्यान दें:

    - **Disk growth:** sessions + transcripts `~/.openclaw/agents/<agentId>/sessions/` के अंतर्गत रहते हैं.
    - **Token cost:** अधिक agents का मतलब अधिक concurrent model usage है.
    - **Ops overhead:** प्रति-agent auth profiles, workspaces, और channel routing.

    सुझाव:

    - प्रति agent एक **active** workspace रखें (`agents.defaults.workspace`).
    - अगर disk बढ़ती है तो पुराने sessions prune करें (JSONL या store entries हटाएं).
    - stray workspaces और profile mismatches पहचानने के लिए `openclaw doctor` का उपयोग करें.

  </Accordion>

  <Accordion title="क्या मैं एक ही समय में कई bots या chats चला सकता हूं (Slack), और मुझे इसे कैसे set up करना चाहिए?">
    हां. कई isolated agents चलाने और inbound messages को
    channel/account/peer के आधार पर route करने के लिए **Multi-Agent Routing** का उपयोग करें. Slack एक channel के रूप में समर्थित है और विशिष्ट agents से bind किया जा सकता है.

    Browser access शक्तिशाली है, लेकिन यह "इंसान जो कुछ कर सकता है वह सब करें" नहीं है - anti-bot, CAPTCHAs, और MFA
    अभी भी automation को block कर सकते हैं. सबसे विश्वसनीय browser control के लिए, host पर local Chrome MCP का उपयोग करें,
    या उस machine पर CDP का उपयोग करें जो वास्तव में browser चलाती है.

    Best-practice setup:

    - Always-on Gateway host (VPS/Mac mini).
    - प्रति role एक agent (bindings).
    - उन agents से bound Slack channel(s).
    - जरूरत पड़ने पर Chrome MCP या किसी Node के जरिए local browser.

    दस्तावेज़: [Multi-Agent Routing](/hi/concepts/multi-agent), [Slack](/hi/channels/slack),
    [Browser](/hi/tools/browser), [Nodes](/hi/nodes).

  </Accordion>
</AccordionGroup>

## Models, failover, और auth profiles

Model प्रश्नोत्तर — defaults, selection, aliases, switching, failover, auth profiles —
[Models FAQ](/hi/help/faq-models) पर उपलब्ध है.

## Gateway: ports, "पहले से running", और remote mode

<AccordionGroup>
  <Accordion title="Gateway कौन सा port उपयोग करता है?">
    `gateway.port` WebSocket + HTTP (Control UI, hooks, आदि) के लिए एकल multiplexed port नियंत्रित करता है.

    प्राथमिकता:

    ```
    --port > OPENCLAW_GATEWAY_PORT > gateway.port > default 18789
    ```

  </Accordion>

  <Accordion title='openclaw gateway status "Runtime: running" लेकिन "Connectivity probe: failed" क्यों कहता है?'>
    क्योंकि "running" **supervisor** का view है (launchd/systemd/schtasks). connectivity probe CLI का वास्तव में gateway WebSocket से connect करना है.

    `openclaw gateway status` का उपयोग करें और इन पंक्तियों पर भरोसा करें:

    - `Probe target:` (probe ने वास्तव में जो URL उपयोग किया)
    - `Listening:` (port पर वास्तव में क्या bound है)
    - `Last gateway error:` (जब process alive है लेकिन port listening नहीं है, तब common root cause)

  </Accordion>

  <Accordion title='openclaw gateway status में "Config (cli)" और "Config (service)" अलग क्यों दिखते हैं?'>
    आप एक config file edit कर रहे हैं जबकि service दूसरी चला रही है (अक्सर `--profile` / `OPENCLAW_STATE_DIR` mismatch).

    समाधान:

    ```bash
    openclaw gateway install --force
    ```

    इसे उसी `--profile` / environment से चलाएं जिसका उपयोग आप service से करवाना चाहते हैं.

  </Accordion>

  <Accordion title='"another gateway instance is already listening" का क्या अर्थ है?'>
    OpenClaw startup पर तुरंत WebSocket listener bind करके runtime lock लागू करता है (डिफ़ॉल्ट `ws://127.0.0.1:18789`). अगर bind `EADDRINUSE` के साथ fail होता है, तो यह `GatewayLockError` throw करता है, जो बताता है कि दूसरा instance पहले से listening है.

    समाधान: दूसरा instance stop करें, port free करें, या `openclaw gateway --port <port>` के साथ चलाएं.

  </Accordion>

  <Accordion title="मैं OpenClaw को remote mode में कैसे चलाऊं (client कहीं और मौजूद Gateway से connect करता है)?">
    `gateway.mode: "remote"` set करें और remote WebSocket URL की ओर point करें, वैकल्पिक shared-secret remote credentials के साथ:

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

    Notes:

    - `openclaw gateway` केवल तब start होता है जब `gateway.mode` `local` हो (या आप override flag pass करें).
    - macOS app config file watch करता है और ये values बदलने पर live modes switch करता है.
    - `gateway.remote.token` / `.password` केवल client-side remote credentials हैं; वे अपने आप local gateway auth enable नहीं करते.

  </Accordion>

  <Accordion title='Control UI "unauthorized" कहता है (या reconnect करता रहता है). अब क्या करें?'>
    आपका gateway auth path और UI की auth method match नहीं करते.

    तथ्य (कोड से):

    - Control UI token को current browser tab session और selected gateway URL के लिए `sessionStorage` में रखता है, इसलिए same-tab refreshes long-lived localStorage token persistence restore किए बिना काम करते रहते हैं.
    - `AUTH_TOKEN_MISMATCH` पर, trusted clients cached device token के साथ एक bounded retry attempt कर सकते हैं जब gateway retry hints return करता है (`canRetryWithDeviceToken=true`, `recommendedNextStep=retry_with_device_token`).
    - वह cached-token retry अब device token के साथ stored cached approved scopes को reuse करता है. explicit `deviceToken` / explicit `scopes` callers अभी भी cached scopes inherit करने के बजाय अपना requested scope set रखते हैं.
    - उस retry path के बाहर, connect auth precedence है: पहले explicit shared token/password, फिर explicit `deviceToken`, फिर stored device token, फिर bootstrap token.
    - Built-in setup-code bootstrap केवल node-only है. approval के बाद, यह `scopes: []` के साथ एक node device token return करता है और handed-off operator token return नहीं करता.

    समाधान:

    - सबसे तेज: `openclaw dashboard` (dashboard URL print + copy करता है, open करने की कोशिश करता है; headless होने पर SSH hint दिखाता है).
    - अगर आपके पास अभी token नहीं है: `openclaw doctor --generate-gateway-token`.
    - अगर remote है, पहले tunnel करें: `ssh -N -L 18789:127.0.0.1:18789 user@host` फिर `http://127.0.0.1:18789/` खोलें.
    - Shared-secret mode: `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` या `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` set करें, फिर matching secret को Control UI settings में paste करें.
    - Tailscale Serve mode: सुनिश्चित करें कि `gateway.auth.allowTailscale` enabled है और आप Serve URL खोल रहे हैं, raw loopback/tailnet URL नहीं जो Tailscale identity headers bypass करता है.
    - Trusted-proxy mode: सुनिश्चित करें कि आप configured identity-aware proxy के जरिए आ रहे हैं, raw gateway URL से नहीं. Same-host loopback proxies को भी `gateway.auth.trustedProxy.allowLoopback = true` चाहिए.
    - अगर एक retry के बाद भी mismatch बना रहता है, paired device token rotate/re-approve करें:
      - `openclaw devices list`
      - `openclaw devices rotate --device <id> --role operator`
    - अगर वह rotate call कहता है कि इसे deny किया गया, तो दो चीजें check करें:
      - paired-device sessions केवल अपने **own** device को rotate कर सकते हैं, जब तक उनके पास `operator.admin` भी न हो
      - explicit `--scope` values caller के current operator scopes से अधिक नहीं हो सकतीं
    - अभी भी अटके हैं? `openclaw status --all` चलाएं और [Troubleshooting](/hi/gateway/troubleshooting) follow करें. auth details के लिए [Dashboard](/hi/web/dashboard) देखें.

  </Accordion>

  <Accordion title="मैंने gateway.bind tailnet set किया लेकिन यह bind नहीं कर पाता और कुछ भी listen नहीं करता">
    `tailnet` bind आपके network interfaces (100.64.0.0/10) से Tailscale IP चुनता है. अगर machine Tailscale पर नहीं है (या interface down है), तो bind करने के लिए कुछ नहीं है.

    समाधान:

    - उस host पर Tailscale start करें (ताकि उसके पास 100.x address हो), या
    - `gateway.bind: "loopback"` / `"lan"` पर switch करें.

    Note: `tailnet` explicit है. `auto` loopback को prefer करता है; जब आप tailnet-only bind चाहते हैं तो `gateway.bind: "tailnet"` उपयोग करें.

  </Accordion>

  <Accordion title="क्या मैं एक ही host पर कई Gateways चला सकता हूं?">
    आम तौर पर नहीं - एक Gateway कई messaging channels और agents चला सकता है. कई Gateways केवल तब उपयोग करें जब आपको redundancy (उदाहरण: rescue bot) या hard isolation चाहिए.

    हां, लेकिन आपको isolate करना होगा:

    - `OPENCLAW_CONFIG_PATH` (per-instance config)
    - `OPENCLAW_STATE_DIR` (per-instance state)
    - `agents.defaults.workspace` (workspace isolation)
    - `gateway.port` (unique ports)

    त्वरित setup (अनुशंसित):

    - प्रति instance `openclaw --profile <name> ...` उपयोग करें (auto-creates `~/.openclaw-<name>`).
    - हर profile config में unique `gateway.port` set करें (या manual runs के लिए `--port` pass करें).
    - per-profile service install करें: `openclaw --profile <name> gateway install`.

    Profiles service names में suffix भी जोड़ते हैं (`ai.openclaw.<profile>`; legacy `com.openclaw.*`, `openclaw-gateway-<profile>.service`, `OpenClaw Gateway (<profile>)`).
    पूरी guide: [Multiple gateways](/hi/gateway/multiple-gateways).

  </Accordion>

  <Accordion title='"invalid handshake" / code 1008 का क्या अर्थ है?'>
    Gateway एक **WebSocket server** है, और यह अपेक्षा करता है कि सबसे पहला message
    एक `connect` frame हो. अगर इसे कुछ और मिलता है, तो यह connection को
    **code 1008** (policy violation) के साथ close कर देता है.

    सामान्य कारण:

    - आपने WS client के बजाय browser में **HTTP** URL खोला (`http://...`).
    - आपने गलत port या path उपयोग किया.
    - किसी proxy या tunnel ने auth headers strip कर दिए या non-Gateway request भेजी.

    त्वरित समाधान:

    1. WS URL उपयोग करें: `ws://<host>:18789` (या HTTPS होने पर `wss://...`).
    2. WS port को सामान्य browser tab में न खोलें.
    3. अगर auth on है, तो `connect` frame में token/password शामिल करें.

    अगर आप CLI या TUI उपयोग कर रहे हैं, तो URL ऐसा दिखना चाहिए:

    ```
    openclaw tui --url ws://<host>:18789 --token <token>
    ```

    Protocol details: [Gateway protocol](/hi/gateway/protocol).

  </Accordion>
</AccordionGroup>

## Logging और debugging

<AccordionGroup>
  <Accordion title="Logs कहां हैं?">
    File logs (structured):

    ```
    /tmp/openclaw/openclaw-YYYY-MM-DD.log
    ```

    आप `logging.file` के माध्यम से एक स्थिर पाथ सेट कर सकते हैं। फ़ाइल लॉग स्तर `logging.level` से नियंत्रित होता है। कंसोल वर्बोसिटी `--verbose` और `logging.consoleLevel` से नियंत्रित होती है।

    सबसे तेज़ लॉग टेल:

    ```bash
    openclaw logs --follow
    ```

    सेवा/सुपरवाइज़र लॉग (जब Gateway launchd/systemd के माध्यम से चलता है):

    - macOS launchd stdout: `~/Library/Logs/openclaw/gateway.log` (प्रोफ़ाइल `gateway-<profile>.log` का उपयोग करती हैं; stderr दबा दिया जाता है)
    - Linux: `journalctl --user -u openclaw-gateway[-<profile>].service -n 200 --no-pager`
    - Windows: `schtasks /Query /TN "OpenClaw Gateway (<profile>)" /V /FO LIST`

    अधिक जानकारी के लिए [समस्या निवारण](/hi/gateway/troubleshooting) देखें।

  </Accordion>

  <Accordion title="मैं Gateway सेवा को कैसे शुरू/रोक/रीस्टार्ट करूं?">
    Gateway हेल्पर का उपयोग करें:

    ```bash
    openclaw gateway status
    openclaw gateway restart
    ```

    यदि आप Gateway को मैन्युअल रूप से चलाते हैं, तो `openclaw gateway --force` पोर्ट वापस ले सकता है। [Gateway](/hi/gateway) देखें।

  </Accordion>

  <Accordion title="मैंने Windows पर अपना टर्मिनल बंद कर दिया - OpenClaw को कैसे रीस्टार्ट करूं?">
    **तीन Windows इंस्टॉल मोड** हैं:

    **1) Windows Hub स्थानीय सेटअप:** नेटिव ऐप स्थानीय ऐप-स्वामित्व वाला WSL Gateway प्रबंधित करता है।

    Start मेनू या ट्रे से **OpenClaw Companion** खोलें, फिर
    **Gateway Setup** या Connections टैब का उपयोग करें।

    **2) मैन्युअल WSL2 Gateway:** Gateway Linux के अंदर चलता है।

    PowerShell खोलें, WSL में प्रवेश करें, फिर रीस्टार्ट करें:

    ```powershell
    wsl
    openclaw gateway status
    openclaw gateway restart
    ```

    यदि आपने सेवा कभी इंस्टॉल नहीं की है, तो इसे फ़ोरग्राउंड में शुरू करें:

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
    त्वरित हेल्थ स्वीप से शुरू करें:

    ```bash
    openclaw status
    openclaw models status
    openclaw channels status
    openclaw logs --follow
    ```

    सामान्य कारण:

    - मॉडल ऑथ **Gateway होस्ट** पर लोड नहीं है (`models status` जांचें)।
    - चैनल पेयरिंग/अलाउलिस्ट जवाबों को रोक रही है (चैनल कॉन्फ़िग + लॉग जांचें)।
    - WebChat/Dashboard सही टोकन के बिना खुला है।

    यदि आप रिमोट हैं, तो पुष्टि करें कि टनल/Tailscale कनेक्शन चालू है और
    Gateway WebSocket पहुंच योग्य है।

    दस्तावेज़: [चैनल](/hi/channels), [समस्या निवारण](/hi/gateway/troubleshooting), [रिमोट एक्सेस](/hi/gateway/remote).

  </Accordion>

  <Accordion title='"Gateway से डिस्कनेक्ट: कोई कारण नहीं" - अब क्या?'>
    इसका आमतौर पर मतलब है कि UI ने WebSocket कनेक्शन खो दिया। जांचें:

    1. क्या Gateway चल रहा है? `openclaw gateway status`
    2. क्या Gateway स्वस्थ है? `openclaw status`
    3. क्या UI के पास सही टोकन है? `openclaw dashboard`
    4. यदि रिमोट है, तो क्या टनल/Tailscale लिंक चालू है?

    फिर लॉग टेल करें:

    ```bash
    openclaw logs --follow
    ```

    दस्तावेज़: [Dashboard](/hi/web/dashboard), [रिमोट एक्सेस](/hi/gateway/remote), [समस्या निवारण](/hi/gateway/troubleshooting).

  </Accordion>

  <Accordion title="Telegram setMyCommands विफल होता है। मुझे क्या जांचना चाहिए?">
    लॉग और चैनल स्थिति से शुरू करें:

    ```bash
    openclaw channels status
    openclaw channels logs --channel telegram
    ```

    फिर त्रुटि से मिलान करें:

    - `BOT_COMMANDS_TOO_MUCH`: Telegram मेनू में बहुत अधिक प्रविष्टियां हैं। OpenClaw पहले से ही Telegram सीमा तक काटता है और कम कमांड के साथ दोबारा कोशिश करता है, लेकिन कुछ मेनू प्रविष्टियां फिर भी हटानी होंगी। Plugin/Skill/कस्टम कमांड घटाएं, या यदि आपको मेनू की जरूरत नहीं है तो `channels.telegram.commands.native` अक्षम करें।
    - `TypeError: fetch failed`, `Network request for 'setMyCommands' failed!`, या समान नेटवर्क त्रुटियां: यदि आप VPS पर हैं या प्रॉक्सी के पीछे हैं, तो पुष्टि करें कि आउटबाउंड HTTPS अनुमत है और DNS `api.telegram.org` के लिए काम करता है।

    यदि Gateway रिमोट है, तो सुनिश्चित करें कि आप Gateway होस्ट पर लॉग देख रहे हैं।

    दस्तावेज़: [Telegram](/hi/channels/telegram), [चैनल समस्या निवारण](/hi/channels/troubleshooting).

  </Accordion>

  <Accordion title="TUI कोई आउटपुट नहीं दिखाता। मुझे क्या जांचना चाहिए?">
    पहले पुष्टि करें कि Gateway पहुंच योग्य है और एजेंट चल सकता है:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    TUI में, मौजूदा स्थिति देखने के लिए `/status` का उपयोग करें। यदि आप चैट
    चैनल में जवाबों की अपेक्षा करते हैं, तो सुनिश्चित करें कि डिलीवरी सक्षम है (`/deliver on`)।

    दस्तावेज़: [TUI](/hi/web/tui), [स्लैश कमांड](/hi/tools/slash-commands).

  </Accordion>

  <Accordion title="मैं Gateway को पूरी तरह रोककर फिर कैसे शुरू करूं?">
    यदि आपने सेवा इंस्टॉल की है:

    ```bash
    openclaw gateway stop
    openclaw gateway start
    ```

    यह **निगरानी वाली सेवा** को रोकता/शुरू करता है (macOS पर launchd, Linux पर systemd)।
    जब Gateway बैकग्राउंड में डेमन के रूप में चलता है, तब इसका उपयोग करें।

    यदि आप फ़ोरग्राउंड में चला रहे हैं, तो Ctrl-C से रोकें, फिर:

    ```bash
    openclaw gateway run
    ```

    दस्तावेज़: [Gateway सेवा रनबुक](/hi/gateway).

  </Accordion>

  <Accordion title="सरल व्याख्या: openclaw gateway restart बनाम openclaw gateway">
    - `openclaw gateway restart`: **बैकग्राउंड सेवा** को रीस्टार्ट करता है (launchd/systemd)।
    - `openclaw gateway`: इस टर्मिनल सत्र के लिए Gateway को **फ़ोरग्राउंड में** चलाता है।

    यदि आपने सेवा इंस्टॉल की है, तो Gateway कमांड का उपयोग करें। जब
    आप एक बार का फ़ोरग्राउंड रन चाहते हैं, तो `openclaw gateway` का उपयोग करें।

  </Accordion>

  <Accordion title="किसी चीज़ के विफल होने पर अधिक विवरण पाने का सबसे तेज़ तरीका">
    अधिक कंसोल विवरण पाने के लिए Gateway को `--verbose` के साथ शुरू करें। फिर चैनल ऑथ, मॉडल रूटिंग, और RPC त्रुटियों के लिए लॉग फ़ाइल देखें।
  </Accordion>
</AccordionGroup>

## मीडिया और अटैचमेंट

<AccordionGroup>
  <Accordion title="मेरे Skill ने एक इमेज/PDF जनरेट किया, लेकिन कुछ भी भेजा नहीं गया">
    एजेंट से आउटबाउंड अटैचमेंट को `media`, `mediaUrl`, `path`, या `filePath` जैसे संरचित मीडिया फ़ील्ड का उपयोग करना चाहिए। [OpenClaw असिस्टेंट सेटअप](/hi/start/openclaw) और [एजेंट भेजना](/hi/tools/agent-send) देखें।

    CLI से भेजना:

    ```bash
    openclaw message send --target +15555550123 --message "Here you go" --media /path/to/file.png
    ```

    यह भी जांचें:

    - लक्षित चैनल आउटबाउंड मीडिया का समर्थन करता है और अलाउलिस्ट से ब्लॉक नहीं है।
    - फ़ाइल प्रदाता की आकार सीमाओं के भीतर है (इमेज अधिकतम 2048px तक रिसाइज़ की जाती हैं)।
    - `tools.fs.workspaceOnly=true` स्थानीय-पाथ भेजने को workspace, temp/media-store, और sandbox-validated फ़ाइलों तक सीमित रखता है।
    - `tools.fs.workspaceOnly=false` संरचित स्थानीय मीडिया भेजने को होस्ट-स्थानीय फ़ाइलों का उपयोग करने देता है जिन्हें एजेंट पहले से पढ़ सकता है, लेकिन केवल मीडिया और सुरक्षित दस्तावेज़ प्रकारों के लिए (इमेज, ऑडियो, वीडियो, PDF, Office दस्तावेज़, और Markdown/MD, TXT, JSON, YAML, और YML जैसे सत्यापित टेक्स्ट दस्तावेज़)। यह कोई सीक्रेट स्कैनर नहीं है: यदि एक्सटेंशन और सामग्री सत्यापन मेल खाते हैं, तो एजेंट-पठनीय `secret.txt` या `config.json` अटैच किया जा सकता है। संवेदनशील फ़ाइलों को एजेंट-पठनीय पाथ से बाहर रखें, या कठोर स्थानीय-पाथ भेजने के लिए `tools.fs.workspaceOnly=true` रखें।

    [इमेज](/hi/nodes/images) देखें।

  </Accordion>
</AccordionGroup>

## सुरक्षा और एक्सेस नियंत्रण

<AccordionGroup>
  <Accordion title="क्या OpenClaw को इनबाउंड DM के लिए एक्सपोज़ करना सुरक्षित है?">
    इनबाउंड DM को अविश्वसनीय इनपुट मानें। डिफ़ॉल्ट जोखिम घटाने के लिए डिज़ाइन किए गए हैं:

    - DM-सक्षम चैनलों पर डिफ़ॉल्ट व्यवहार **पेयरिंग** है:
      - अज्ञात भेजने वालों को पेयरिंग कोड मिलता है; बॉट उनका संदेश प्रोसेस नहीं करता।
      - इससे स्वीकृत करें: `openclaw pairing approve --channel <channel> [--account <id>] <code>`
      - लंबित अनुरोध **प्रति चैनल 3** तक सीमित हैं; यदि कोड नहीं आया तो `openclaw pairing list --channel <channel> [--account <id>]` जांचें।
    - DM को सार्वजनिक रूप से खोलने के लिए स्पष्ट ऑप्ट-इन चाहिए (`dmPolicy: "open"` और अलाउलिस्ट `"*"`).

    जोखिमपूर्ण DM नीतियां सामने लाने के लिए `openclaw doctor` चलाएं।

  </Accordion>

  <Accordion title="क्या प्रॉम्प्ट इंजेक्शन केवल सार्वजनिक बॉट के लिए चिंता है?">
    नहीं। प्रॉम्प्ट इंजेक्शन **अविश्वसनीय सामग्री** के बारे में है, केवल यह नहीं कि बॉट को DM कौन कर सकता है।
    यदि आपका असिस्टेंट बाहरी सामग्री पढ़ता है (वेब खोज/फ़ेच, ब्राउज़र पेज, ईमेल,
    दस्तावेज़, अटैचमेंट, पेस्ट किए गए लॉग), तो उस सामग्री में ऐसे निर्देश हो सकते हैं जो
    मॉडल को हाईजैक करने की कोशिश करते हैं। यह तब भी हो सकता है जब **आप ही एकमात्र भेजने वाले हों**।

    सबसे बड़ा जोखिम तब होता है जब टूल सक्षम होते हैं: मॉडल को संदर्भ बाहर भेजने
    या आपकी ओर से टूल कॉल करने के लिए भ्रमित किया जा सकता है। प्रभाव क्षेत्र घटाने के लिए:

    - अविश्वसनीय सामग्री का सारांश बनाने के लिए रीड-ओनली या टूल-अक्षम "रीडर" एजेंट का उपयोग करें
    - टूल-सक्षम एजेंटों के लिए `web_search` / `web_fetch` / `browser` बंद रखें
    - डीकोड किए गए फ़ाइल/दस्तावेज़ टेक्स्ट को भी अविश्वसनीय मानें: OpenResponses
      `input_file` और मीडिया-अटैचमेंट एक्सट्रैक्शन दोनों निकाले गए टेक्स्ट को
      कच्चा फ़ाइल टेक्स्ट पास करने के बजाय स्पष्ट बाहरी-सामग्री सीमा मार्कर में लपेटते हैं
    - सैंडबॉक्सिंग और सख्त टूल अलाउलिस्ट

    विवरण: [सुरक्षा](/hi/gateway/security).

  </Accordion>

  <Accordion title="क्या OpenClaw कम सुरक्षित है क्योंकि यह Rust/WASM के बजाय TypeScript/Node का उपयोग करता है?">
    भाषा और रनटाइम मायने रखते हैं, लेकिन वे व्यक्तिगत
    एजेंट के लिए मुख्य जोखिम नहीं हैं। व्यावहारिक OpenClaw जोखिम हैं Gateway एक्सपोज़र, बॉट को कौन संदेश भेज सकता है,
    प्रॉम्प्ट इंजेक्शन, टूल दायरा, क्रेडेंशियल हैंडलिंग, ब्राउज़र एक्सेस, exec
    एक्सेस, और तृतीय-पक्ष Skill या Plugin भरोसा।

    Rust और WASM कुछ कोड वर्गों के लिए मजबूत आइसोलेशन दे सकते हैं, लेकिन
    वे प्रॉम्प्ट इंजेक्शन, खराब अलाउलिस्ट, सार्वजनिक Gateway एक्सपोज़र,
    बहुत व्यापक टूल, या ऐसे ब्राउज़र प्रोफ़ाइल को हल नहीं करते जो पहले से संवेदनशील
    खातों में लॉग इन है। इन्हें प्राथमिक नियंत्रण मानें:

    - Gateway को निजी या प्रमाणित रखें
    - DM और समूहों के लिए पेयरिंग और अलाउलिस्ट का उपयोग करें
    - अविश्वसनीय इनपुट के लिए जोखिमपूर्ण टूल अस्वीकार करें या सैंडबॉक्स करें
    - केवल विश्वसनीय Plugin और Skills इंस्टॉल करें
    - कॉन्फ़िग बदलावों के बाद `openclaw security audit --deep` चलाएं

    विवरण: [सुरक्षा](/hi/gateway/security), [सैंडबॉक्सिंग](/hi/gateway/sandboxing).

  </Accordion>

  <Accordion title="मैंने एक्सपोज़ किए गए OpenClaw इंस्टेंस के बारे में रिपोर्ट देखीं। मुझे क्या जांचना चाहिए?">
    पहले अपनी वास्तविक डिप्लॉयमेंट जांचें:

    ```bash
    openclaw security audit --deep
    openclaw gateway status
    ```

    अधिक सुरक्षित बेसलाइन है:

    - Gateway `loopback` से बंधा हो, या केवल प्रमाणित निजी
      एक्सेस जैसे tailnet, SSH टनल, टोकन/पासवर्ड ऑथ, या सही ढंग से
      कॉन्फ़िगर किए गए विश्वसनीय प्रॉक्सी के माध्यम से एक्सपोज़ हो
    - DM `pairing` या `allowlist` मोड में हों
    - समूह अलाउलिस्टेड और मेंशन-गेटेड हों, जब तक हर सदस्य विश्वसनीय न हो
    - उच्च-जोखिम टूल (`exec`, `browser`, `gateway`, `cron`) उन एजेंटों के लिए अस्वीकार या कड़ाई से
      सीमित हों जो अविश्वसनीय सामग्री पढ़ते हैं
    - जहां टूल निष्पादन को छोटा प्रभाव क्षेत्र चाहिए, वहां सैंडबॉक्सिंग सक्षम हो

    ऑथ के बिना सार्वजनिक बाइंड, टूल के साथ खुले DM/समूह, और एक्सपोज़ ब्राउज़र
    नियंत्रण वे निष्कर्ष हैं जिन्हें पहले ठीक करना चाहिए। विवरण:
    [सुरक्षा ऑडिट चेकलिस्ट](/hi/gateway/security#security-audit-checklist).

  </Accordion>

  <Accordion title="क्या ClawHub Skills और तृतीय-पक्ष Plugin इंस्टॉल करना सुरक्षित है?">
    तृतीय-पक्ष Skills और Plugin को ऐसे कोड के रूप में मानें जिस पर आप भरोसा करना चुन रहे हैं।
    ClawHub Skill पेज इंस्टॉल से पहले स्कैन स्थिति दिखाते हैं, लेकिन स्कैन कोई
    पूर्ण सुरक्षा सीमा नहीं हैं। OpenClaw Plugin या Skill इंस्टॉल/अपडेट फ़्लो के दौरान बिल्ट-इन स्थानीय
    खतरनाक-कोड ब्लॉकिंग नहीं चलाता; स्थानीय अनुमति/ब्लॉक निर्णयों के लिए
    ऑपरेटर-स्वामित्व वाली `security.installPolicy` का उपयोग करें।

    अधिक सुरक्षित पैटर्न:

    - विश्वसनीय लेखकों और पिन किए गए संस्करणों को प्राथमिकता दें
    - सक्षम करने से पहले Skill या Plugin पढ़ें
    - Plugin और Skill अलाउलिस्ट संकीर्ण रखें
    - अविश्वसनीय-इनपुट वर्कफ़्लो न्यूनतम टूल वाले सैंडबॉक्स में चलाएं
    - तृतीय-पक्ष कोड को व्यापक फ़ाइलसिस्टम, exec, ब्राउज़र, या सीक्रेट एक्सेस देने से बचें

    विवरण: [Skills](/hi/tools/skills), [Plugins](/hi/tools/plugin),
    [सुरक्षा](/hi/gateway/security).

  </Accordion>

  <Accordion title="क्या मेरे bot का अपना email, GitHub account, या phone number होना चाहिए?">
    हाँ, अधिकतर setup के लिए। bot को अलग accounts और phone numbers के साथ अलग-थलग रखने से
    कुछ गलत होने पर प्रभाव-क्षेत्र कम हो जाता है। इससे credentials घुमाना या access revoke करना भी
    आसान हो जाता है, बिना आपके personal accounts को प्रभावित किए।

    छोटी शुरुआत करें। केवल उन tools और accounts को access दें जिनकी आपको सच में जरूरत है, और
    जरूरत पड़ने पर बाद में विस्तार करें।

    Docs: [सुरक्षा](/hi/gateway/security), [पेयरिंग](/hi/channels/pairing).

  </Accordion>

  <Accordion title="क्या मैं इसे अपने text messages पर autonomy दे सकता हूँ और क्या यह सुरक्षित है?">
    हम आपके personal messages पर पूरी autonomy की अनुशंसा **नहीं** करते। सबसे सुरक्षित pattern है:

    - DMs को **pairing mode** या सख्त allowlist में रखें।
    - अगर आप चाहते हैं कि यह आपकी ओर से message भेजे, तो **अलग number या account** का उपयोग करें।
    - इसे draft करने दें, फिर **भेजने से पहले approve** करें।

    अगर आप प्रयोग करना चाहते हैं, तो इसे dedicated account पर करें और अलग-थलग रखें। देखें
    [सुरक्षा](/hi/gateway/security).

  </Accordion>

  <Accordion title="क्या मैं personal assistant tasks के लिए सस्ते models का उपयोग कर सकता हूँ?">
    हाँ, **अगर** agent केवल chat-only है और input trusted है। छोटे tiers
    instruction hijacking के प्रति अधिक संवेदनशील होते हैं, इसलिए tool-enabled agents
    या untrusted content पढ़ते समय उनसे बचें। अगर आपको छोटा model उपयोग करना ही है, तो
    tools को lock down करें और sandbox के अंदर चलाएँ। देखें [सुरक्षा](/hi/gateway/security).
  </Accordion>

  <Accordion title="मैंने Telegram में /start चलाया लेकिन pairing code नहीं मिला">
    Pairing codes **केवल** तब भेजे जाते हैं जब कोई unknown sender bot को message करता है और
    `dmPolicy: "pairing"` enabled होता है। `/start` अपने आप code generate नहीं करता।

    pending requests जाँचें:

    ```bash
    openclaw pairing list telegram
    ```

    अगर आप तुरंत access चाहते हैं, तो अपने sender id को allowlist करें या उस account के लिए
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

    Wizard phone number prompt: इसका उपयोग आपकी **allowlist/owner** set करने के लिए होता है ताकि आपकी अपनी DMs permitted हों। इसका उपयोग auto-sending के लिए नहीं होता। अगर आप अपने personal WhatsApp number पर चलाते हैं, तो वही number उपयोग करें और `channels.whatsapp.selfChatMode` enable करें।

  </Accordion>
</AccordionGroup>

## Chat commands, tasks abort करना, और "यह रुक नहीं रहा"

<AccordionGroup>
  <Accordion title="मैं internal system messages को chat में दिखने से कैसे रोकूँ?">
    अधिकतर internal या tool messages केवल तब दिखाई देते हैं जब उस session के लिए **verbose**, **trace**, या **reasoning** enabled हो।

    जिस chat में आप इसे देख रहे हैं, वहाँ fix करें:

    ```
    /verbose off
    /trace off
    /reasoning off
    ```

    अगर यह अब भी noisy है, तो Control UI में session settings जाँचें और verbose को
    **inherit** पर set करें। यह भी confirm करें कि आप ऐसा bot profile उपयोग नहीं कर रहे हैं जिसमें config में `verboseDefault`
    `on` पर set हो।

    Docs: [Thinking और verbose](/hi/tools/thinking), [सुरक्षा](/hi/gateway/security/index#reasoning-and-verbose-output-in-groups).

  </Accordion>

  <Accordion title="मैं running task को कैसे रोकूँ/cancel करूँ?">
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

    background processes के लिए (exec tool से), आप agent से चलाने को कह सकते हैं:

    ```
    process action:kill sessionId:XXX
    ```

    Slash commands overview: देखें [Slash commands](/hi/tools/slash-commands).

    अधिकांश commands को **standalone** message के रूप में भेजना होता है जो `/` से शुरू होता है, लेकिन कुछ shortcuts (जैसे `/status`) allowlisted senders के लिए inline भी काम करते हैं।

  </Accordion>

  <Accordion title='मैं Telegram से Discord message कैसे भेजूँ? ("Cross-context messaging denied")'>
    OpenClaw default रूप से **cross-provider** messaging block करता है। अगर tool call
    Telegram से bound है, तो वह Discord को नहीं भेजेगा जब तक आप इसे explicit रूप से allow न करें।

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
    Mid-run prompts default रूप से active run में steer किए जाते हैं। active-run behavior चुनने के लिए `/queue` उपयोग करें:

    - `steer` - अगले model boundary पर active run को guide करें
    - `followup` - messages queue करें और current run समाप्त होने के बाद उन्हें एक-एक करके चलाएँ
    - `collect` - compatible messages queue करें और current run समाप्त होने के बाद एक बार reply करें
    - `interrupt` - current run abort करें और fresh start करें

    Default mode `steer` है। queued modes के लिए आप `debounce:0.5s cap:25 drop:summarize` जैसे options जोड़ सकते हैं। देखें [Command queue](/hi/concepts/queue) और [Steering queue](/hi/concepts/queue-steering).

  </Accordion>
</AccordionGroup>

## विविध

<AccordionGroup>
  <Accordion title='API key के साथ Anthropic के लिए default model क्या है?'>
    OpenClaw में credentials और model selection अलग-अलग हैं। `ANTHROPIC_API_KEY` set करना (या auth profiles में Anthropic API key store करना) authentication enable करता है, लेकिन actual default model वही होता है जिसे आप `agents.defaults.model.primary` में configure करते हैं (उदाहरण के लिए, `anthropic/claude-sonnet-4-6` या `anthropic/claude-opus-4-6`)। अगर आपको `No credentials found for profile "anthropic:default"` दिखता है, तो इसका मतलब है कि Gateway running agent के लिए expected `auth-profiles.json` में Anthropic credentials नहीं ढूँढ सका।
  </Accordion>
</AccordionGroup>

---

अब भी अटके हैं? [Discord](https://discord.com/invite/clawd) में पूछें या [GitHub discussion](https://github.com/openclaw/openclaw/discussions) खोलें।

## संबंधित

- [First-run FAQ](/hi/help/faq-first-run) — install, onboard, auth, subscriptions, शुरुआती failures
- [Models FAQ](/hi/help/faq-models) — model selection, failover, auth profiles
- [Troubleshooting](/hi/help/troubleshooting) — symptom-first triage
