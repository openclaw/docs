---
read_when:
    - बैकग्राउंड जॉब या वेकअप शेड्यूल करना
    - बाहरी ट्रिगर (Webhook, Gmail) को OpenClaw में जोड़ना
    - अनुसूचित कार्यों के लिए Heartbeat और Cron के बीच निर्णय लेना
sidebarTitle: Scheduled tasks
summary: Gateway शेड्यूलर के लिए निर्धारित कार्य, Webhook, और Gmail PubSub ट्रिगर
title: निर्धारित कार्य
x-i18n:
    generated_at: "2026-07-01T08:02:32Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2f75b8d1e5ac558a02b895e1cd1b92b05af549a2bd63d4ce3ddafcaf9e94b88e
    source_path: automation/cron-jobs.md
    workflow: 16
---

Cron, Gateway का अंतर्निहित शेड्यूलर है। यह जॉब्स को स्थायी रखता है, सही समय पर एजेंट को जगाता है, और आउटपुट को चैट चैनल या Webhook एंडपॉइंट पर वापस पहुंचा सकता है।

## त्वरित शुरुआत

<Steps>
  <Step title="Add a one-shot reminder">
    ```bash
    openclaw cron create "2026-02-01T16:00:00Z" \
      --name "Reminder" \
      --session main \
      --system-event "Reminder: check the cron docs draft" \
      --wake now \
      --delete-after-run
    ```
  </Step>
  <Step title="Check your jobs">
    ```bash
    openclaw cron list
    openclaw cron get <job-id>
    openclaw cron show <job-id>
    ```
  </Step>
  <Step title="See run history">
    ```bash
    openclaw cron runs --id <job-id>
    ```
  </Step>
</Steps>

## Cron कैसे काम करता है

- Cron **Gateway के अंदर** प्रक्रिया में चलता है (मॉडल के अंदर नहीं)।
- जॉब परिभाषाएं, रनटाइम स्थिति, और रन इतिहास OpenClaw के साझा SQLite स्थिति डेटाबेस में स्थायी रहते हैं, ताकि रीस्टार्ट होने पर शेड्यूल न खोएं।
- अपग्रेड पर, पुराने `~/.openclaw/cron/jobs.json`, `jobs-state.json`, और `runs/*.jsonl` फ़ाइलों को SQLite में आयात करने और उन्हें `.migrated` प्रत्यय के साथ नाम बदलने के लिए `openclaw doctor --fix` चलाएं। खराब जॉब पंक्तियां रनटाइम से छोड़ दी जाती हैं और बाद की मरम्मत या समीक्षा के लिए `jobs-quarantine.json` में कॉपी की जाती हैं।
- `cron.store` अब भी तार्किक Cron स्टोर कुंजी और doctor आयात पथ का नाम देता है। आयात के बाद, उस JSON फ़ाइल को संपादित करने से सक्रिय Cron जॉब्स नहीं बदलते; इसके बजाय `openclaw cron add|edit|remove` या Gateway Cron RPC विधियों का उपयोग करें।
- सभी Cron निष्पादन [पृष्ठभूमि कार्य](/hi/automation/tasks) रिकॉर्ड बनाते हैं।
- Gateway स्टार्टअप पर, समय से पीछे चल रहे अलग-थलग एजेंट-टर्न जॉब्स को तुरंत दोहराने के बजाय चैनल-कनेक्ट विंडो से बाहर फिर से शेड्यूल किया जाता है, ताकि रीस्टार्ट के बाद Discord/Telegram स्टार्टअप और नेटिव-कमांड सेटअप प्रतिक्रियाशील रहें।
- वन-शॉट जॉब्स (`--at`) सफलता के बाद डिफ़ॉल्ट रूप से अपने-आप हट जाते हैं।
- अलग-थलग Cron रन पूरे होने पर अपने `cron:<jobId>` सेशन के लिए ट्रैक किए गए ब्राउज़र टैब/प्रोसेस को सर्वोत्तम प्रयास के आधार पर बंद करते हैं, ताकि अलग हुई ब्राउज़र ऑटोमेशन अनाथ प्रोसेस पीछे न छोड़े।
- संकीर्ण Cron सेल्फ-क्लीनअप अनुमति पाने वाले अलग-थलग Cron रन अब भी शेड्यूलर स्थिति, अपने मौजूदा जॉब की स्वयं-फ़िल्टर की गई सूची, और उस जॉब का रन इतिहास पढ़ सकते हैं, ताकि स्थिति/Heartbeat जांचें व्यापक Cron म्यूटेशन पहुंच पाए बिना अपना शेड्यूल देख सकें।
- अलग-थलग Cron रन पुराने acknowledgment replies से भी बचाव करते हैं। यदि पहला परिणाम केवल एक अंतरिम स्थिति अपडेट है (`on it`, `pulling everything together`, और समान संकेत) और कोई descendant subagent रन अब भी अंतिम उत्तर के लिए जिम्मेदार नहीं है, तो OpenClaw डिलीवरी से पहले वास्तविक परिणाम के लिए एक बार फिर प्रॉम्प्ट करता है।
- अलग-थलग Cron रन एम्बेडेड रन से संरचित execution-denial metadata का उपयोग करते हैं, जिसमें node-host `UNAVAILABLE` wrappers भी शामिल हैं जिनका nested error message `SYSTEM_RUN_DENIED` या `INVALID_REQUEST` से शुरू होता है, ताकि ब्लॉक किया गया कमांड हरे रन के रूप में रिपोर्ट न हो जबकि सामान्य सहायक गद्य को denial न माना जाए।
- अलग-थलग Cron रन run-level agent failures को भी जॉब त्रुटि मानते हैं, भले ही कोई reply payload न बना हो, ताकि model/provider failures error counters बढ़ाएं और जॉब को सफल मानकर साफ करने के बजाय failure notifications ट्रिगर करें।
- जब कोई अलग-थलग एजेंट-टर्न जॉब `timeoutSeconds` तक पहुंचता है, Cron अंतर्निहित agent run को abort करता है और उसे एक छोटी cleanup window देता है। यदि रन drain नहीं होता, तो Gateway-स्वामित्व वाला cleanup उस रन की session ownership को force-clear करता है, उसके बाद Cron timeout रिकॉर्ड करता है, ताकि queued chat work किसी stale processing session के पीछे न छूटे।
- यदि कोई अलग-थलग agent-turn runner शुरू होने से पहले या पहले model call से पहले stall करता है, तो Cron phase-specific timeout रिकॉर्ड करता है, जैसे `setup timed out before runner start` या `stalled before first model call (last phase: context-engine)`। ये watchdogs embedded providers और CLI-backed providers को उनके external CLI process के सच में शुरू होने से पहले cover करते हैं, और लंबे `timeoutSeconds` values से स्वतंत्र रूप से capped होते हैं, ताकि cold-start/auth/context failures पूरे job budget का इंतजार करने के बजाय जल्दी surface हों।
- यदि आप `openclaw agent` चलाने के लिए system cron या कोई दूसरा external scheduler उपयोग करते हैं, तो उसे hard-kill escalation के साथ wrap करें, भले ही CLI `SIGTERM`/`SIGINT` संभालता हो। Gateway-backed runs accepted runs को abort करने के लिए Gateway से कहते हैं; local और embedded fallback runs को वही abort signal मिलता है। GNU `timeout` के लिए, साधारण `timeout 600 ...` के बजाय `timeout -k 60 600 openclaw agent ...` को प्राथमिकता दें; `-k` value supervisor backstop है यदि process drain नहीं हो सकता। systemd units के लिए, `SIGTERM` stop signal और अंतिम kill से पहले `TimeoutStopSec` जैसे grace window का उपयोग करके वही shape रखें। यदि retry किसी `--run-id` को फिर से उपयोग करता है जबकि मूल Gateway run अब भी active है, तो duplicate को दूसरा run शुरू करने के बजाय in-flight के रूप में report किया जाता है।

<a id="maintenance"></a>

<Note>
Cron के लिए task reconciliation पहले runtime-owned है, फिर durable-history-backed: एक active Cron task तब तक live रहता है जब तक Cron runtime उस job को running के रूप में track करता है, भले ही कोई पुरानी child session row अब भी मौजूद हो। जब runtime job का मालिक नहीं रहता और 5-minute grace window समाप्त हो जाती है, maintenance matching `cron:<jobId>:<startedAt>` run के लिए persisted run logs और job state जांचता है। यदि वह durable history terminal result दिखाती है, तो task ledger उससे finalized होता है; अन्यथा Gateway-owned maintenance task को `lost` mark कर सकता है। Offline CLI audit durable history से recover कर सकता है, लेकिन वह अपने खाली in-process active-job set को इस बात का proof नहीं मानता कि Gateway-owned Cron run चला गया है।
</Note>

## शेड्यूल प्रकार

| प्रकार | CLI flag | विवरण |
| ------- | --------- | ------------------------------------------------------- |
| `at`    | `--at`    | वन-शॉट timestamp (ISO 8601 या `20m` जैसा relative)    |
| `every` | `--every` | Fixed interval                                          |
| `cron`  | `--cron`  | optional `--tz` के साथ 5-field या 6-field Cron expression |

बिना timezone वाले timestamps को UTC माना जाता है। local wall-clock scheduling के लिए `--tz America/New_York` जोड़ें।

Recurring top-of-hour expressions को load spikes घटाने के लिए अपने-आप 5 minutes तक stagger किया जाता है। सटीक timing force करने के लिए `--exact` या explicit window के लिए `--stagger 30s` उपयोग करें।

### Day-of-month और day-of-week OR logic का उपयोग करते हैं

Cron expressions को [croner](https://github.com/Hexagon/croner) द्वारा parse किया जाता है। जब day-of-month और day-of-week दोनों fields non-wildcard हों, तो croner तब match करता है जब **किसी भी** field का match हो — दोनों का नहीं। यह standard Vixie cron behavior है।

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

यह प्रति माह 0–1 बार के बजाय लगभग 5–6 बार fire करता है। OpenClaw यहां Croner के default OR behavior का उपयोग करता है। दोनों conditions required करने के लिए, Croner के `+` day-of-week modifier (`0 9 15 * +1`) का उपयोग करें या एक field पर schedule करें और दूसरे को अपने job के prompt या command में guard करें।

## निष्पादन शैलियां

| शैली | `--session` value | इसमें चलता है | इनके लिए सबसे उपयुक्त |
| --------------- | ------------------- | ------------------------ | ------------------------------- |
| Main session    | `main`              | Dedicated Cron wake lane | Reminders, system events        |
| Isolated        | `isolated`          | Dedicated `cron:<jobId>` | Reports, background chores      |
| Current session | `current`           | Creation time पर bound   | Context-aware recurring work    |
| Custom session  | `session:custom-id` | Persistent named session | History पर build होने वाले workflows |

<AccordionGroup>
  <Accordion title="Main session vs isolated vs custom">
    **Main session** jobs किसी Cron-owned run lane में system event enqueue करते हैं और वैकल्पिक रूप से Heartbeat (`--wake now` या `--wake next-heartbeat`) को जगाते हैं। वे replies के लिए target main session के last delivery context का उपयोग कर सकते हैं, लेकिन वे routine Cron turns को human chat lane में append नहीं करते और target session के लिए daily/idle reset freshness को extend नहीं करते। **Isolated** jobs fresh session के साथ dedicated agent turn चलाते हैं। **Custom sessions** (`session:xxx`) runs के बीच context persist करते हैं, जिससे daily standups जैसे workflows संभव होते हैं जो previous summaries पर build करते हैं।

    Main-session Cron events self-contained system-event reminders हैं। वे
    default Heartbeat prompt के "Read
    HEARTBEAT.md" instruction को अपने-आप include नहीं करते। यदि कोई recurring reminder
    `HEARTBEAT.md` consult करे, तो Cron event text या
    agent के अपने instructions में यह स्पष्ट रूप से कहें।

  </Accordion>
  <Accordion title="What 'fresh session' means for isolated jobs">
    अलग-थलग jobs के लिए, "fresh session" का मतलब हर run के लिए नया transcript/session id है। OpenClaw सोच/fast/verbose settings, labels, और explicit user-selected model/auth overrides जैसी safe preferences carry कर सकता है, लेकिन पुराने Cron row से ambient conversation context inherit नहीं करता: channel/group routing, send या queue policy, elevation, origin, या ACP runtime binding। जब recurring job को जानबूझकर उसी conversation context पर build करना हो, तो `current` या `session:<id>` का उपयोग करें।
  </Accordion>
  <Accordion title="Runtime cleanup">
    अलग-थलग jobs के लिए, runtime teardown में अब उस Cron session के लिए best-effort browser cleanup शामिल है। Cleanup failures को ignore किया जाता है, ताकि actual Cron result अब भी wins करे।

    अलग-थलग Cron runs shared runtime-cleanup path के through job के लिए बनाए गए किसी भी bundled MCP runtime instances को भी dispose करते हैं। यह main-session और custom-session MCP clients के teardown से match करता है, ताकि अलग-थलग Cron jobs runs के बीच stdio child processes या long-lived MCP connections leak न करें।

  </Accordion>
  <Accordion title="Subagent and Discord delivery">
    जब अलग-थलग Cron runs subagents orchestrate करते हैं, delivery stale parent interim text के बजाय final descendant output को भी prefer करती है। यदि descendants अब भी running हैं, तो OpenClaw उस partial parent update को announce करने के बजाय suppress करता है।

    Text-only Discord announce targets के लिए, OpenClaw streamed/intermediate text payloads और final answer दोनों को replay करने के बजाय canonical final assistant text एक बार भेजता है। Media और structured Discord payloads अब भी अलग payloads के रूप में deliver होते हैं ताकि attachments और components drop न हों।

  </Accordion>
</AccordionGroup>

### Command payloads

Deterministic scripts के लिए command payloads उपयोग करें जिन्हें model-backed isolated agent turn शुरू किए बिना Gateway scheduler के अंदर चलना चाहिए। Command jobs Gateway host पर execute होते हैं, stdout/stderr capture करते हैं, run को Cron history में record करते हैं, और isolated jobs जैसे ही `announce`, `webhook`, और `none` delivery modes reuse करते हैं।

<Note>
Command Cron एक operator-admin Gateway automation surface है, agent
`tools.exec` call नहीं। Cron jobs create, update, remove, या manually run करने के लिए
`operator.admin` चाहिए; scheduled command runs बाद में
Gateway process के अंदर उसी admin-authored automation के रूप में execute होते हैं। Agent exec policy जैसे
`tools.exec.mode`, approval prompts, और per-agent tool allowlists
model-visible exec tools को govern करते हैं, command Cron payloads को नहीं।
</Note>

```bash
openclaw cron create "*/15 * * * *" \
  --name "Queue depth probe" \
  --command "scripts/check-queue.sh" \
  --command-cwd "/srv/app" \
  --announce \
  --channel telegram \
  --to "-1001234567890"
```

`--command <shell>` `argv: ["sh", "-lc", <shell>]` store करता है। जब आप shell parsing के बिना exact argv execution चाहते हैं, तो `--command-argv '["node","scripts/report.mjs"]'` उपयोग करें। Optional `--command-env KEY=VALUE`, `--command-input`, `--timeout-seconds`, `--no-output-timeout-seconds`, और `--output-max-bytes` fields process environment, stdin, और output bounds को control करते हैं।

यदि stdout खाली नहीं है, तो वही पाठ डिलीवर किया गया परिणाम है। यदि stdout खाली है और stderr खाली नहीं है, तो stderr डिलीवर किया जाता है। यदि दोनों स्ट्रीम मौजूद हैं, तो cron एक छोटा `stdout:` / `stderr:` ब्लॉक डिलीवर करता है। शून्य exit code रन को `ok` के रूप में दर्ज करता है; non-zero exit, signal, timeout, या no-output timeout `error` दर्ज करता है और failure alerts ट्रिगर कर सकता है। कोई command जो केवल `NO_REPLY` प्रिंट करता है, सामान्य cron silent-token suppression का उपयोग करता है और chat में कुछ भी वापस पोस्ट नहीं करता।

### isolated jobs के लिए payload options

<ParamField path="--message" type="string" required>
  Prompt text (isolated के लिए आवश्यक).
</ParamField>
<ParamField path="--model" type="string">
  Model override; job के लिए चुने गए allowed model का उपयोग करता है.
</ParamField>
<ParamField path="--fallbacks" type="string">
  Per-job fallback model list, उदाहरण के लिए `--fallbacks openrouter/gpt-4.1-mini,openai/gpt-5`. बिना fallbacks वाले strict run के लिए `--fallbacks ""` पास करें.
</ParamField>
<ParamField path="--clear-fallbacks" type="boolean">
  `cron edit` पर, per-job fallback override हटाता है ताकि job configured fallback precedence का पालन करे. `--fallbacks` के साथ जोड़ा नहीं जा सकता.
</ParamField>
<ParamField path="--clear-model" type="boolean">
  `cron edit` पर, per-job model override हटाता है ताकि job सामान्य cron model-selection precedence का पालन करे (यदि सेट है तो stored cron-session override, अन्यथा agent/default model). `--model` के साथ जोड़ा नहीं जा सकता.
</ParamField>
<ParamField path="--thinking" type="string">
  Thinking level override.
</ParamField>
<ParamField path="--clear-thinking" type="boolean">
  `cron edit` पर, per-job thinking override हटाता है ताकि job सामान्य cron thinking precedence का पालन करे. `--thinking` के साथ जोड़ा नहीं जा सकता.
</ParamField>
<ParamField path="--light-context" type="boolean">
  Workspace bootstrap file injection छोड़ें.
</ParamField>
<ParamField path="--tools" type="string">
  job किन tools का उपयोग कर सकता है, इसे सीमित करें, उदाहरण के लिए `--tools exec,read`.
</ParamField>

`--model` चुने गए allowed model को उस job के primary model के रूप में उपयोग करता है। यह chat-session `/model` override जैसा नहीं है: जब job primary fail होता है, तो configured fallback chains फिर भी लागू होती हैं। यदि requested model allowed नहीं है या resolve नहीं किया जा सकता, तो cron चुपचाप job के agent/default model selection पर fallback करने के बजाय explicit validation error के साथ run fail करता है।

Cron jobs payload-level `fallbacks` भी रख सकते हैं। मौजूद होने पर, यह list job के लिए configured fallback chain को replace करती है। जब आप ऐसा strict cron run चाहते हैं जो केवल selected model आजमाए, तो job payload/API में `fallbacks: []` का उपयोग करें। यदि किसी job में `--model` है लेकिन payload या configured fallbacks नहीं हैं, तो OpenClaw explicit empty fallback override पास करता है ताकि agent primary hidden extra retry target के रूप में append न हो।

Local-provider preflight checks, cron run को `skipped` mark करने से पहले configured fallbacks को walk करते हैं; `fallbacks: []` उस preflight path को strict रखता है।

isolated jobs के लिए model-selection precedence है:

1. Gmail hook model override (जब run Gmail से आया हो और वह override allowed हो)
2. Per-job payload `model`
3. User-selected stored cron session model override
4. Agent/default model selection

Fast mode भी resolved live selection का पालन करता है। यदि selected model config में `params.fastMode` है, तो isolated cron default रूप से उसका उपयोग करता है। Stored session `fastMode` override अभी भी दोनों दिशाओं में config पर प्राथमिकता रखता है। Auto mode, मौजूद होने पर selected model के `params.fastAutoOnSeconds` cutoff का उपयोग करता है, default 60 seconds है।

यदि isolated run live model-switch handoff से टकराता है, तो cron switched provider/model के साथ retry करता है और retry से पहले active run के लिए उस live selection को persist करता है। जब switch नया auth profile भी लाता है, तो cron active run के लिए उस auth profile override को भी persist करता है। Retries सीमित हैं: initial attempt plus 2 switch retries के बाद, cron अंतहीन loop करने के बजाय abort करता है।

isolated cron run के agent runner में प्रवेश करने से पहले, OpenClaw configured `api: "ollama"` और `api: "openai-completions"` providers के reachable local provider endpoints जांचता है जिनका `baseUrl` loopback, private-network, या `.local` है। यदि वह endpoint down है, तो run model call शुरू करने के बजाय स्पष्ट provider/model error के साथ `skipped` के रूप में record होता है। Endpoint result 5 minutes के लिए cached रहता है, इसलिए same dead local Ollama, vLLM, SGLang, या LM Studio server का उपयोग करने वाले कई due jobs request storm बनाने के बजाय एक छोटा probe share करते हैं। Skipped provider-preflight runs execution-error backoff नहीं बढ़ाते; जब आप repeated skip notifications चाहते हों तो `failureAlert.includeSkipped` enable करें।

## Delivery और output

| Mode       | क्या होता है                                                        |
| ---------- | ------------------------------------------------------------------- |
| `announce` | यदि agent ने नहीं भेजा, तो final text target को fallback-deliver करता है |
| `webhook`  | finished event payload को URL पर POST करता है                                |
| `none`     | कोई runner fallback delivery नहीं                                         |

Channel delivery के लिए `--announce --channel telegram --to "-1001234567890"` उपयोग करें। Telegram forum topics के लिए, `-1001234567890:topic:123` उपयोग करें; OpenClaw Telegram-owned `-1001234567890:123` shorthand भी स्वीकार करता है। Direct RPC/config callers `delivery.threadId` को string या number के रूप में पास कर सकते हैं। Slack/Discord/Mattermost targets को explicit prefixes (`channel:<id>`, `user:<id>`) का उपयोग करना चाहिए। Matrix room IDs case-sensitive हैं; Matrix से exact room ID या `room:!room:server` form का उपयोग करें।

जब announce delivery `channel: "last"` का उपयोग करती है या `channel` छोड़ती है, तो `telegram:123` जैसा provider-prefixed target, cron के session history या single configured channel पर fallback करने से पहले channel select कर सकता है। Loaded plugin द्वारा advertised prefixes ही provider selectors होते हैं। यदि `delivery.channel` explicit है, तो target prefix को वही provider नाम देना होगा; उदाहरण के लिए, `channel: "whatsapp"` के साथ `to: "telegram:123"` rejected होता है, बजाय इसके कि WhatsApp Telegram ID को phone number समझे। Target-kind और service prefixes जैसे `channel:<id>`, `user:<id>`, `imessage:<handle>`, और `sms:<number>` channel-owned target syntax ही रहते हैं, provider selectors नहीं।

isolated jobs के लिए, chat delivery shared होती है। यदि chat route उपलब्ध है, तो agent `message` tool का उपयोग कर सकता है, भले ही job `--no-deliver` उपयोग करे। यदि agent configured/current target को भेजता है, तो OpenClaw fallback announce छोड़ देता है। अन्यथा `announce`, `webhook`, और `none` केवल यह नियंत्रित करते हैं कि agent turn के बाद runner final reply के साथ क्या करता है।

जब agent active chat से isolated reminder बनाता है, तो OpenClaw fallback announce route के लिए preserved live delivery target store करता है। Internal session keys lowercase हो सकती हैं; जब current chat context उपलब्ध होता है, तो provider delivery targets उन keys से reconstruct नहीं किए जाते।

Implicit announce delivery, stale targets को validate और reroute करने के लिए configured channel allowlists का उपयोग करती है। DM pairing-store approvals fallback automation recipients नहीं हैं; जब scheduled job को proactive रूप से DM पर भेजना चाहिए, तो `delivery.to` set करें या channel `allowFrom` entry configure करें।

## Output language

Cron jobs channel, locale, या previous
messages से reply language infer नहीं करते। Scheduled message या template में language rule डालें:

```bash
openclaw cron edit <jobId> \
  --message "Summarize the updates. Respond in Chinese; keep URLs, code, and product names unchanged."
```

Template files के लिए, rendered prompt में language instruction रखें और
job run होने से पहले verify करें कि `{{language}}` जैसे placeholders भरे गए हैं। यदि
output languages mix करता है, तो rule explicit करें, उदाहरण के लिए: "Use Chinese
for narrative text and keep technical terms in English."

Failure notifications अलग destination path का पालन करती हैं:

- `cron.failureDestination` failure notifications के लिए global default set करता है।
- `job.delivery.failureDestination` उसे per job override करता है।
- यदि दोनों में से कोई set नहीं है और job पहले से `announce` के जरिए deliver करता है, तो failure notifications अब उस primary announce target पर fallback करती हैं।
- `delivery.failureDestination` केवल `sessionTarget="isolated"` jobs पर supported है, जब तक कि primary delivery mode `webhook` न हो।
- `failureAlert.includeSkipped: true` job या global cron alert policy को repeated skipped-run alerts में opt in करता है। Skipped runs अलग consecutive skip counter रखते हैं, इसलिए वे execution-error backoff को affect नहीं करते।

## CLI examples

<Tabs>
  <Tab title="One-shot reminder">
    ```bash
    openclaw cron add \
      --name "Calendar check" \
      --at "20m" \
      --session main \
      --system-event "Next heartbeat: check calendar." \
      --wake now
    ```
  </Tab>
  <Tab title="Recurring isolated job">
    ```bash
    openclaw cron create "0 7 * * *" \
      "Summarize overnight updates." \
      --name "Morning brief" \
      --tz "America/Los_Angeles" \
      --session isolated \
      --announce \
      --channel slack \
      --to "channel:C1234567890"
    ```
  </Tab>
  <Tab title="Model and thinking override">
    ```bash
    openclaw cron add \
      --name "Deep analysis" \
      --cron "0 6 * * 1" \
      --tz "America/Los_Angeles" \
      --session isolated \
      --message "Weekly deep analysis of project progress." \
      --model "opus" \
      --thinking high \
      --announce
    ```
  </Tab>
  <Tab title="Webhook output">
    ```bash
    openclaw cron create "0 18 * * 1-5" \
      "Summarize today's deploys as JSON." \
      --name "Deploy digest" \
      --webhook "https://example.invalid/openclaw/cron"
    ```
  </Tab>
  <Tab title="Command output">
    ```bash
    openclaw cron create "*/15 * * * *" \
      --name "Queue depth probe" \
      --command "scripts/check-queue.sh" \
      --command-cwd "/srv/app" \
      --announce \
      --channel telegram \
      --to "-1001234567890"
    ```
  </Tab>
</Tabs>

## Webhooks

Gateway external triggers के लिए HTTP webhook endpoints expose कर सकता है। Config में enable करें:

```json5
{
  hooks: {
    enabled: true,
    token: "shared-secret",
    path: "/hooks",
  },
}
```

### Authentication

हर request में header के जरिए hook token शामिल होना चाहिए:

- `Authorization: Bearer <token>` (recommended)
- `x-openclaw-token: <token>`

Query-string tokens rejected हैं।

<AccordionGroup>
  <Accordion title="POST /hooks/wake">
    Main session के लिए system event enqueue करें:

    ```bash
    curl -X POST http://127.0.0.1:18789/hooks/wake \
      -H 'Authorization: Bearer SECRET' \
      -H 'Content-Type: application/json' \
      -d '{"text":"New email received","mode":"now"}'
    ```

    <ParamField path="text" type="string" required>
      Event description.
    </ParamField>
    <ParamField path="mode" type="string" default="now">
      `now` या `next-heartbeat`.
    </ParamField>

  </Accordion>
  <Accordion title="POST /hooks/agent">
    isolated agent turn चलाएं:

    ```bash
    curl -X POST http://127.0.0.1:18789/hooks/agent \
      -H 'Authorization: Bearer SECRET' \
      -H 'Content-Type: application/json' \
      -d '{"message":"Summarize inbox","name":"Email","model":"openai/gpt-5.4"}'
    ```

    Fields: `message` (required), `name`, `agentId`, `wakeMode`, `deliver`, `channel`, `to`, `model`, `fallbacks`, `thinking`, `timeoutSeconds`.

  </Accordion>
  <Accordion title="Mapped hooks (POST /hooks/<name>)">
    Custom hook names config में `hooks.mappings` के जरिए resolve होते हैं। Mappings arbitrary payloads को templates या code transforms के साथ `wake` या `agent` actions में transform कर सकती हैं।
  </Accordion>
</AccordionGroup>

<Warning>
Hook endpoints को loopback, tailnet, या trusted reverse proxy के पीछे रखें।

- समर्पित hook token का उपयोग करें; gateway auth tokens का पुनः उपयोग न करें।
- `hooks.path` को समर्पित subpath पर रखें; `/` अस्वीकार किया जाता है।
- `hooks.allowedAgentIds` सेट करें ताकि यह सीमित हो सके कि कोई hook किस प्रभावी agent को target कर सकता है, जिसमें `agentId` छोड़े जाने पर default agent भी शामिल है।
- `hooks.allowRequestSessionKey=false` रखें, जब तक आपको caller-selected sessions की आवश्यकता न हो।
- यदि आप `hooks.allowRequestSessionKey` सक्षम करते हैं, तो अनुमत session key shapes को सीमित करने के लिए `hooks.allowedSessionKeyPrefixes` भी सेट करें।
- Hook payloads default रूप से safety boundaries के साथ wrap किए जाते हैं।

</Warning>

## Gmail PubSub integration

Google PubSub के माध्यम से Gmail inbox triggers को OpenClaw से जोड़ें।

<Note>
**पूर्वापेक्षाएँ:** `gcloud` CLI, `gog` (gogcli), OpenClaw hooks सक्षम, public HTTPS endpoint के लिए Tailscale।
</Note>

### Wizard setup (अनुशंसित)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

यह `hooks.gmail` config लिखता है, Gmail preset सक्षम करता है, और push endpoint के लिए Tailscale Funnel का उपयोग करता है।

### Gateway auto-start

जब `hooks.enabled=true` हो और `hooks.gmail.account` सेट हो, तो Gateway boot पर `gog gmail watch serve` शुरू करता है और watch को auto-renew करता है। opt out करने के लिए `OPENCLAW_SKIP_GMAIL_WATCHER=1` सेट करें।

### Manual one-time setup

<Steps>
  <Step title="GCP project चुनें">
    वह GCP project चुनें जिसके पास `gog` द्वारा उपयोग किया गया OAuth client है:

    ```bash
    gcloud auth login
    gcloud config set project <project-id>
    gcloud services enable gmail.googleapis.com pubsub.googleapis.com
    ```

  </Step>
  <Step title="Topic बनाएँ और Gmail push access दें">
    ```bash
    gcloud pubsub topics create gog-gmail-watch
    gcloud pubsub topics add-iam-policy-binding gog-gmail-watch \
      --member=serviceAccount:gmail-api-push@system.gserviceaccount.com \
      --role=roles/pubsub.publisher
    ```
  </Step>
  <Step title="Watch शुरू करें">
    ```bash
    gog gmail watch start \
      --account openclaw@gmail.com \
      --label INBOX \
      --topic projects/<project-id>/topics/gog-gmail-watch
    ```
  </Step>
</Steps>

### Gmail model override

```json5
{
  hooks: {
    gmail: {
      model: "openrouter/meta-llama/llama-3.3-70b-instruct:free",
      thinking: "off",
    },
  },
}
```

## Jobs प्रबंधित करना

```bash
# List all jobs
openclaw cron list

# Get one stored job as JSON
openclaw cron get <jobId>

# Show one job, including resolved delivery route
openclaw cron show <jobId>

# Edit a job
openclaw cron edit <jobId> --message "Updated prompt" --model "opus"

# Force run a job now
openclaw cron run <jobId>

# Force run a job now and wait for its terminal status
openclaw cron run <jobId> --wait --wait-timeout 10m --poll-interval 2s

# Run only if due
openclaw cron run <jobId> --due

# View run history
openclaw cron runs --id <jobId> --limit 50

# View one exact run
openclaw cron runs --id <jobId> --run-id <runId>

# Delete a job
openclaw cron remove <jobId>

# Agent selection (multi-agent setups)
openclaw cron create "0 6 * * *" "Check ops queue" --name "Ops sweep" --session isolated --agent ops
openclaw cron edit <jobId> --clear-agent
```

`openclaw cron run <jobId>` manual run को enqueue करने के बाद लौटता है। shutdown hooks, maintenance scripts, या ऐसी अन्य automation के लिए `--wait` का उपयोग करें जिसे queued run समाप्त होने तक block करना आवश्यक हो। Wait mode ठीक लौटाए गए `runId` को poll करता है; यह status `ok` के लिए `0` और `error`, `skipped`, या wait timeout के लिए non-zero के साथ exit करता है।

Agent `cron` tool `cron(action: "list")` से compact job summaries (`id`, `name`, `enabled`, `nextRunAtMs`, `scheduleKind`, `lastRunStatus`) लौटाता है; एक पूरी job definition के लिए `cron(action: "get", jobId: "...")` का उपयोग करें। Direct Gateway callers `cron.list` को `compact: true` pass कर सकते हैं; इसे छोड़ने पर delivery previews के साथ मौजूदा full response सुरक्षित रहता है।

`openclaw cron create`, `openclaw cron add` का alias है, और नई jobs positional schedule (`"0 9 * * 1"`, `"every 1h"`, `"20m"`, या ISO timestamp) के बाद positional agent prompt का उपयोग कर सकती हैं। finished run payload को HTTP endpoint पर POST करने के लिए `cron add|create` या `cron edit` पर `--webhook <url>` का उपयोग करें। Webhook delivery को `--announce`, `--channel`, `--to`, `--thread-id`, या `--account` जैसे chat delivery flags के साथ combine नहीं किया जा सकता। `cron edit` पर, `--clear-channel`, `--clear-to`, `--clear-thread-id`, और `--clear-account` उन routing fields को अलग-अलग unset करते हैं (हर एक अपने matching set flag के साथ अस्वीकार होता है), जो `--no-deliver` द्वारा runner fallback delivery disable करने से अलग है।

<Note>
Model override note:

- `openclaw cron add|edit --model ...` job के selected model को बदलता है।
- यदि model allowed है, तो वही exact provider/model isolated agent run तक पहुँचता है।
- यदि यह allowed नहीं है या resolve नहीं किया जा सकता, तो cron explicit validation error के साथ run को fail करता है।
- API `cron.update` payload patches stored job model override clear करने के लिए `model: null` सेट कर सकते हैं।
- `openclaw cron edit <job-id> --clear-model` CLI से उस override को clear करता है (`model: null` patch जैसा ही प्रभाव) और इसे `--model` के साथ combine नहीं किया जा सकता।
- Configured fallback chains अभी भी लागू होती हैं क्योंकि cron `--model` job primary है, session `/model` override नहीं।
- `openclaw cron add|edit --fallbacks ...` payload `fallbacks` सेट करता है, जो उस job के लिए configured fallbacks को replace करता है; `--fallbacks ""` fallback disable करता है और run को strict बनाता है। `openclaw cron edit <job-id> --clear-fallbacks` per-job override clear करता है।
- बिना explicit या configured fallback list वाला plain `--model`, silent extra retry target के रूप में agent primary पर fall through नहीं करता।

</Note>

## Configuration

```json5
{
  cron: {
    enabled: true,
    store: "~/.openclaw/cron/jobs.json",
    maxConcurrentRuns: 8,
    retry: {
      maxAttempts: 3,
      backoffMs: [60000, 120000, 300000],
      retryOn: ["rate_limit", "overloaded", "network", "server_error"],
    },
    webhookToken: "replace-with-dedicated-webhook-token",
    sessionRetention: "24h",
    runLog: { maxBytes: "2mb", keepLines: 2000 },
  },
}
```

`maxConcurrentRuns` scheduled cron dispatch और isolated agent-turn execution, दोनों को सीमित करता है, और default 8 है। Isolated cron agent turns internally queue की dedicated `cron-nested` execution lane का उपयोग करते हैं, इसलिए इस value को बढ़ाने से independent cron LLM runs केवल अपने outer cron wrappers शुरू करने के बजाय parallel में आगे बढ़ सकते हैं। shared non-cron `nested` lane इस setting से widened नहीं होती।

`cron.store` एक logical store key और legacy doctor import path है। मौजूदा JSON stores को SQLite में import और archive करने के लिए `openclaw doctor --fix` चलाएँ; भविष्य के cron changes CLI या Gateway API के माध्यम से होने चाहिए।

Cron disable करें: `cron.enabled: false` या `OPENCLAW_SKIP_CRON=1`।

<AccordionGroup>
  <Accordion title="Retry behavior">
    **One-shot retry**: transient errors (rate limit, overload, network, server error) exponential backoff के साथ 3 बार तक retry होते हैं। Permanent errors तुरंत disable कर देते हैं।

    **Recurring retry**: retries के बीच exponential backoff (30s से 60m)। अगले successful run के बाद backoff reset होता है।

  </Accordion>
  <Accordion title="Maintenance">
    `cron.sessionRetention` (default `24h`) isolated run-session entries prune करता है। `cron.runLog.keepLines` प्रति job retained SQLite run-history rows को सीमित करता है; `maxBytes` पुराने file-backed run logs के साथ config compatibility के लिए retained है।
  </Accordion>
</AccordionGroup>

## Troubleshooting

### Command ladder

```bash
openclaw status
openclaw gateway status
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
openclaw doctor
```

<AccordionGroup>
  <Accordion title="Cron fire नहीं हो रहा">
    - `cron.enabled` और `OPENCLAW_SKIP_CRON` env var जाँचें।
    - पुष्टि करें कि Gateway लगातार चल रहा है।
    - `cron` schedules के लिए, timezone (`--tz`) बनाम host timezone verify करें।
    - run output में `reason: not-due` का मतलब है कि manual run को `openclaw cron run <jobId> --due` के साथ check किया गया था और job अभी due नहीं था।

  </Accordion>
  <Accordion title="Cron fire हुआ लेकिन delivery नहीं हुई">
    - Delivery mode `none` का मतलब है कि runner fallback send expected नहीं है। chat route उपलब्ध होने पर agent अभी भी `message` tool के साथ सीधे send कर सकता है।
    - Delivery target missing/invalid (`channel`/`to`) का मतलब है outbound skip किया गया।
    - Matrix के लिए, lowercased `delivery.to` room IDs वाली copied या legacy jobs fail हो सकती हैं क्योंकि Matrix room IDs case-sensitive होते हैं। job को Matrix से exact `!room:server` या `room:!room:server` value पर edit करें।
    - Channel auth errors (`unauthorized`, `Forbidden`) का मतलब है कि credentials ने delivery block की।
    - यदि isolated run केवल silent token (`NO_REPLY` / `no_reply`) लौटाता है, तो OpenClaw direct outbound delivery suppress करता है और fallback queued summary path भी suppress करता है, इसलिए chat पर कुछ भी वापस post नहीं होता।
    - यदि agent को स्वयं user को message करना चाहिए, तो जाँचें कि job के पास usable route है (`channel: "last"` with a previous chat, या explicit channel/target)।

  </Accordion>
  <Accordion title="Cron या Heartbeat /new-style rollover को रोकता हुआ दिखता है">
    - Daily और idle reset freshness `updatedAt` पर आधारित नहीं है; [Session management](/hi/concepts/session#session-lifecycle) देखें।
    - Cron wakeups, heartbeat runs, exec notifications, और gateway bookkeeping routing/status के लिए session row update कर सकते हैं, लेकिन वे `sessionStartedAt` या `lastInteractionAt` को extend नहीं करते।
    - उन fields के exist करने से पहले बनाए गए legacy rows के लिए, file अभी उपलब्ध होने पर OpenClaw transcript JSONL session header से `sessionStartedAt` recover कर सकता है। `lastInteractionAt` के बिना legacy idle rows अपने idle baseline के रूप में उसी recovered start time का उपयोग करते हैं।

  </Accordion>
  <Accordion title="Timezone gotchas">
    - `--tz` के बिना Cron gateway host timezone का उपयोग करता है।
    - timezone के बिना `at` schedules को UTC माना जाता है।
    - Heartbeat `activeHours` configured timezone resolution का उपयोग करता है।

  </Accordion>
</AccordionGroup>

## Related

- [Automation](/hi/automation) — सभी automation mechanisms एक नज़र में
- [Background Tasks](/hi/automation/tasks) — cron executions के लिए task ledger
- [Heartbeat](/hi/gateway/heartbeat) — periodic main-session turns
- [Timezone](/hi/concepts/timezone) — timezone configuration
