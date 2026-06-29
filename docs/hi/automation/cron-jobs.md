---
read_when:
    - पृष्ठभूमि कार्यों या वेकअप का शेड्यूल बनाना
    - बाहरी ट्रिगर्स (Webhook, Gmail) को OpenClaw से जोड़ना
    - निर्धारित कार्यों के लिए Heartbeat और Cron के बीच निर्णय लेना
sidebarTitle: Scheduled tasks
summary: Gateway शेड्यूलर के लिए निर्धारित जॉब्स, webhooks, और Gmail PubSub ट्रिगर
title: निर्धारित कार्य
x-i18n:
    generated_at: "2026-06-28T22:32:15Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 97097c9809afea699caa0c60d2ab5b71cd3794f90d9e002d35d25e76ca40d63c
    source_path: automation/cron-jobs.md
    workflow: 16
---

Cron Gateway का अंतर्निहित scheduler है। यह jobs को persist करता है, सही समय पर agent को जगाता है, और output को वापस chat channel या Webhook endpoint तक पहुंचा सकता है।

## तुरंत शुरू करें

<Steps>
  <Step title="एक बार का reminder जोड़ें">
    ```bash
    openclaw cron create "2026-02-01T16:00:00Z" \
      --name "Reminder" \
      --session main \
      --system-event "Reminder: check the cron docs draft" \
      --wake now \
      --delete-after-run
    ```
  </Step>
  <Step title="अपने jobs जांचें">
    ```bash
    openclaw cron list
    openclaw cron get <job-id>
    openclaw cron show <job-id>
    ```
  </Step>
  <Step title="run history देखें">
    ```bash
    openclaw cron runs --id <job-id>
    ```
  </Step>
</Steps>

## cron कैसे काम करता है

- Cron **Gateway के अंदर** process में चलता है (model के अंदर नहीं)।
- Job definitions, runtime state, और run history OpenClaw के shared SQLite state database में persist होते हैं, इसलिए restarts schedules नहीं खोते।
- upgrade पर, legacy `~/.openclaw/cron/jobs.json`, `jobs-state.json`, और `runs/*.jsonl` files को SQLite में import करने और उन्हें `.migrated` suffix के साथ rename करने के लिए `openclaw doctor --fix` चलाएं। Malformed job rows runtime से skip किए जाते हैं और बाद की repair या review के लिए `jobs-quarantine.json` में copy किए जाते हैं।
- `cron.store` अभी भी logical cron store key और doctor import path का नाम देता है। import के बाद, उस JSON file को edit करने से active cron jobs नहीं बदलते; इसके बजाय `openclaw cron add|edit|remove` या Gateway cron RPC methods का उपयोग करें।
- सभी cron executions [background task](/hi/automation/tasks) records बनाते हैं।
- Gateway startup पर, overdue isolated agent-turn jobs को तुरंत replay करने के बजाय channel-connect window से बाहर reschedule किया जाता है, ताकि restarts के बाद Discord/Telegram startup और native-command setup responsive रहें।
- One-shot jobs (`--at`) default रूप से success के बाद auto-delete होते हैं।
- Isolated cron runs अपनी `cron:<jobId>` session के लिए tracked browser tabs/processes को run पूरा होने पर best-effort close करते हैं, ताकि detached browser automation orphaned processes पीछे न छोड़े।
- Isolated cron runs जिन्हें narrow cron self-cleanup grant मिलता है, फिर भी scheduler status, अपने current job की self-filtered list, और उस job की run history पढ़ सकते हैं, ताकि status/Heartbeat checks व्यापक cron mutation access पाए बिना अपनी schedule inspect कर सकें।
- Isolated cron runs stale acknowledgement replies से भी guard करते हैं। अगर पहला result केवल interim status update (`on it`, `pulling everything together`, और समान hints) है और कोई descendant subagent run final answer के लिए अब भी जिम्मेदार नहीं है, तो OpenClaw delivery से पहले actual result के लिए एक बार re-prompt करता है।
- Isolated cron runs embedded run से structured execution-denial metadata का उपयोग करते हैं, जिसमें node-host `UNAVAILABLE` wrappers शामिल हैं जिनका nested error message `SYSTEM_RUN_DENIED` या `INVALID_REQUEST` से शुरू होता है, ताकि blocked command को green run के रूप में report न किया जाए जबकि ordinary assistant prose को denial न माना जाए।
- Isolated cron runs run-level agent failures को भी job errors मानते हैं, भले ही कोई reply payload produce न हो, ताकि model/provider failures error counters increment करें और job को successful clear करने के बजाय failure notifications trigger करें।
- जब isolated agent-turn job `timeoutSeconds` तक पहुंचता है, cron underlying agent run को abort करता है और उसे छोटी cleanup window देता है। अगर run drain नहीं होता, तो Gateway-owned cleanup उस run की session ownership को force-clear करता है, फिर cron timeout record करता है, ताकि queued chat work stale processing session के पीछे न छूटे।
- अगर isolated agent-turn runner start होने से पहले या first model call से पहले stall हो जाता है, तो cron phase-specific timeout record करता है, जैसे `setup timed out before runner start` या `stalled before first model call (last phase: context-engine)`। ये watchdogs embedded providers और CLI-backed providers को उनके external CLI process के वास्तव में start होने से पहले cover करते हैं, और long `timeoutSeconds` values से independently capped होते हैं ताकि cold-start/auth/context failures full job budget की प्रतीक्षा करने के बजाय जल्दी surface हों।
- अगर आप `openclaw agent` चलाने के लिए system cron या कोई अन्य external scheduler उपयोग करते हैं, तो CLI के `SIGTERM`/`SIGINT` handle करने के बावजूद उसे hard-kill escalation के साथ wrap करें। Gateway-backed runs accepted runs को abort करने के लिए Gateway से कहते हैं; local और embedded fallback runs को वही abort signal मिलता है। GNU `timeout` के लिए plain `timeout 600 ...` के बजाय `timeout -k 60 600 openclaw agent ...` prefer करें; `-k` value supervisor backstop है अगर process drain नहीं हो पाता। systemd units के लिए, final kill से पहले `TimeoutStopSec` जैसी grace window के साथ `SIGTERM` stop signal का उपयोग करके वही shape रखें। अगर retry वही `--run-id` reuse करता है जबकि original Gateway run अभी भी active है, तो duplicate second run start करने के बजाय in-flight के रूप में report होता है।

<a id="maintenance"></a>

<Note>
cron के लिए task reconciliation पहले runtime-owned है, दूसरे durable-history-backed: active cron task live रहता है जब तक cron runtime उस job को running के रूप में track करता है, भले ही कोई पुरानी child session row अभी भी मौजूद हो। जब runtime job को own करना बंद कर देता है और 5-minute grace window expire हो जाती है, maintenance matching `cron:<jobId>:<startedAt>` run के लिए persisted run logs और job state जांचता है। अगर वह durable history terminal result दिखाती है, तो task ledger उससे finalized होता है; अन्यथा Gateway-owned maintenance task को `lost` mark कर सकता है। Offline CLI audit durable history से recover कर सकता है, लेकिन वह अपने empty in-process active-job set को इस proof के रूप में नहीं मानता कि Gateway-owned cron run चला गया है।
</Note>

## Schedule types

| प्रकार | CLI flag | विवरण |
| ------- | --------- | ------------------------------------------------------- |
| `at` | `--at` | One-shot timestamp (ISO 8601 या `20m` जैसा relative) |
| `every` | `--every` | Fixed interval |
| `cron` | `--cron` | optional `--tz` के साथ 5-field या 6-field cron expression |

timezone के बिना timestamps को UTC माना जाता है। local wall-clock scheduling के लिए `--tz America/New_York` जोड़ें।

Recurring top-of-hour expressions load spikes घटाने के लिए automatically 5 minutes तक stagger किए जाते हैं। precise timing force करने के लिए `--exact` या explicit window के लिए `--stagger 30s` उपयोग करें।

### Day-of-month और day-of-week OR logic का उपयोग करते हैं

Cron expressions [croner](https://github.com/Hexagon/croner) द्वारा parse किए जाते हैं। जब day-of-month और day-of-week दोनों fields non-wildcard होते हैं, croner तब match करता है जब **कोई भी** field match हो — दोनों नहीं। यह standard Vixie cron behavior है।

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

यह प्रति month 0–1 बार के बजाय ~5–6 बार fire होता है। OpenClaw यहां Croner के default OR behavior का उपयोग करता है। दोनों conditions require करने के लिए, Croner का `+` day-of-week modifier (`0 9 15 * +1`) उपयोग करें या एक field पर schedule करें और दूसरे को अपने job के prompt या command में guard करें।

## Execution styles

| Style | `--session` value | इसमें चलता है | इनके लिए सबसे अच्छा |
| --------------- | ------------------- | ------------------------ | ------------------------------- |
| Main session | `main` | Dedicated cron wake lane | Reminders, system events |
| Isolated | `isolated` | Dedicated `cron:<jobId>` | Reports, background chores |
| Current session | `current` | creation time पर bound | Context-aware recurring work |
| Custom session | `session:custom-id` | Persistent named session | history पर build होने वाले workflows |

<AccordionGroup>
  <Accordion title="Main session बनाम isolated बनाम custom">
    **Main session** jobs cron-owned run lane में system event enqueue करते हैं और optional रूप से heartbeat (`--wake now` या `--wake next-heartbeat`) को जगाते हैं। वे replies के लिए target main session के last delivery context का उपयोग कर सकते हैं, लेकिन वे routine cron turns को human chat lane में append नहीं करते और target session के लिए daily/idle reset freshness extend नहीं करते। **Isolated** jobs fresh session के साथ dedicated agent turn चलाते हैं। **Custom sessions** (`session:xxx`) runs के बीच context persist करते हैं, जिससे daily standups जैसे workflows सक्षम होते हैं जो previous summaries पर build करते हैं।

    Main-session cron events self-contained system-event reminders हैं। वे default heartbeat prompt का "Read HEARTBEAT.md" instruction automatically include नहीं करते। अगर recurring reminder को `HEARTBEAT.md` consult करना चाहिए, तो cron event text या agent के अपने instructions में उसे explicitly कहें।

  </Accordion>
  <Accordion title="isolated jobs के लिए 'fresh session' का क्या अर्थ है">
    isolated jobs के लिए, "fresh session" का अर्थ हर run के लिए नया transcript/session id है। OpenClaw thinking/fast/verbose settings, labels, और explicit user-selected model/auth overrides जैसी safe preferences carry कर सकता है, लेकिन यह पुराने cron row से ambient conversation context inherit नहीं करता: channel/group routing, send या queue policy, elevation, origin, या ACP runtime binding। जब recurring job को उसी conversation context पर जानबूझकर build करना चाहिए, तो `current` या `session:<id>` उपयोग करें।
  </Accordion>
  <Accordion title="Runtime cleanup">
    isolated jobs के लिए, runtime teardown में अब उस cron session के लिए best-effort browser cleanup शामिल है। Cleanup failures ignore किए जाते हैं ताकि actual cron result फिर भी जीते।

    Isolated cron runs job के लिए created किसी भी bundled MCP runtime instances को shared runtime-cleanup path के जरिए dispose भी करते हैं। यह उसी तरह match करता है जैसे main-session और custom-session MCP clients tear down किए जाते हैं, इसलिए isolated cron jobs runs के बीच stdio child processes या long-lived MCP connections leak नहीं करते।

  </Accordion>
  <Accordion title="Subagent और Discord delivery">
    जब isolated cron runs subagents orchestrate करते हैं, delivery stale parent interim text के ऊपर final descendant output को भी prefer करती है। अगर descendants अभी भी running हैं, तो OpenClaw उस partial parent update को announce करने के बजाय suppress करता है।

    text-only Discord announce targets के लिए, OpenClaw streamed/intermediate text payloads और final answer दोनों को replay करने के बजाय canonical final assistant text एक बार भेजता है। Media और structured Discord payloads अब भी separate payloads के रूप में delivered होते हैं ताकि attachments और components drop न हों।

  </Accordion>
</AccordionGroup>

### Command payloads

Command payloads उन deterministic scripts के लिए उपयोग करें जिन्हें model-backed isolated agent turn start किए बिना Gateway scheduler के अंदर चलना चाहिए। Command jobs Gateway host पर execute होते हैं, stdout/stderr capture करते हैं, run को cron history में record करते हैं, और isolated jobs जैसे ही `announce`, `webhook`, और `none` delivery modes reuse करते हैं।

<Note>
Command cron operator-admin Gateway automation surface है, agent `tools.exec` call नहीं। cron jobs create, update, remove, या manually run करने के लिए `operator.admin` चाहिए; scheduled command runs बाद में Gateway process के अंदर उस admin-authored automation के रूप में execute होते हैं। `tools.exec.mode`, approval prompts, और per-agent tool allowlists जैसी agent exec policy model-visible exec tools को govern करती है, command cron payloads को नहीं।
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

`--command <shell>` `argv: ["sh", "-lc", <shell>]` store करता है। जब आप shell parsing के बिना exact argv execution चाहते हैं, तो `--command-argv '["node","scripts/report.mjs"]'` उपयोग करें। Optional `--command-env KEY=VALUE`, `--command-input`, `--timeout-seconds`, `--no-output-timeout-seconds`, और `--output-max-bytes` fields process environment, stdin, और output bounds control करते हैं।

यदि stdout रिक्त नहीं है, तो वही पाठ वितरित परिणाम होता है। यदि stdout रिक्त है और stderr रिक्त नहीं है, तो stderr वितरित होता है। यदि दोनों स्ट्रीम मौजूद हैं, तो Cron एक छोटा `stdout:` / `stderr:` ब्लॉक वितरित करता है। शून्य एक्जिट कोड रन को `ok` के रूप में दर्ज करता है; गैर-शून्य एक्जिट, सिग्नल, टाइमआउट, या नो-आउटपुट टाइमआउट `error` दर्ज करता है और विफलता अलर्ट ट्रिगर कर सकता है। जो कमांड केवल `NO_REPLY` प्रिंट करता है, वह सामान्य Cron साइलेंट-टोकन सप्रेशन का उपयोग करता है और चैट में कुछ भी वापस पोस्ट नहीं करता।

### आइसोलेटेड जॉब्स के लिए पेलोड विकल्प

<ParamField path="--message" type="string" required>
  प्रॉम्प्ट टेक्स्ट (आइसोलेटेड के लिए आवश्यक)।
</ParamField>
<ParamField path="--model" type="string">
  Model ओवरराइड; जॉब के लिए चुने गए अनुमत model का उपयोग करता है।
</ParamField>
<ParamField path="--fallbacks" type="string">
  प्रति-जॉब fallback model सूची, उदाहरण के लिए `--fallbacks openrouter/gpt-4.1-mini,openai/gpt-5`। बिना fallbacks वाले सख्त रन के लिए `--fallbacks ""` पास करें।
</ParamField>
<ParamField path="--clear-fallbacks" type="boolean">
  `cron edit` पर, प्रति-जॉब fallback ओवरराइड हटाता है ताकि जॉब कॉन्फ़िगर की गई fallback प्राथमिकता का पालन करे। इसे `--fallbacks` के साथ संयोजित नहीं किया जा सकता।
</ParamField>
<ParamField path="--clear-model" type="boolean">
  `cron edit` पर, प्रति-जॉब model ओवरराइड हटाता है ताकि जॉब सामान्य Cron model-चयन प्राथमिकता का पालन करे (यदि सेट हो तो संग्रहित Cron-session ओवरराइड, अन्यथा agent/default model)। इसे `--model` के साथ संयोजित नहीं किया जा सकता।
</ParamField>
<ParamField path="--thinking" type="string">
  Thinking स्तर ओवरराइड।
</ParamField>
<ParamField path="--light-context" type="boolean">
  Workspace bootstrap फ़ाइल इंजेक्शन छोड़ें।
</ParamField>
<ParamField path="--tools" type="string">
  जॉब किन tools का उपयोग कर सकती है, उसे सीमित करें, उदाहरण के लिए `--tools exec,read`।
</ParamField>

`--model` चुने गए अनुमत model को उस जॉब के प्राथमिक model के रूप में उपयोग करता है। यह chat-session `/model` ओवरराइड जैसा नहीं है: जॉब प्राथमिक विफल होने पर भी कॉन्फ़िगर की गई fallback chains लागू होती हैं। यदि अनुरोधित model अनुमत नहीं है या resolve नहीं किया जा सकता, तो Cron जॉब के agent/default model चयन पर चुपचाप fallback करने के बजाय स्पष्ट validation error के साथ रन विफल करता है।

Cron jobs पेलोड-स्तर के `fallbacks` भी रख सकती हैं। मौजूद होने पर, वह सूची जॉब के लिए कॉन्फ़िगर की गई fallback chain को बदल देती है। जब आप ऐसा सख्त Cron रन चाहते हैं जो केवल चुने गए model को आज़माए, तो job payload/API में `fallbacks: []` का उपयोग करें। यदि किसी जॉब में `--model` है लेकिन न तो पेलोड fallbacks हैं और न ही कॉन्फ़िगर किए गए fallbacks, तो OpenClaw एक स्पष्ट खाली fallback ओवरराइड पास करता है ताकि agent प्राथमिक को छिपे हुए अतिरिक्त retry target के रूप में न जोड़ा जाए।

Local-provider preflight checks किसी Cron रन को `skipped` चिह्नित करने से पहले कॉन्फ़िगर किए गए fallbacks पर चलते हैं; `fallbacks: []` उस preflight path को सख्त रखता है।

आइसोलेटेड जॉब्स के लिए model-चयन प्राथमिकता है:

1. Gmail hook model ओवरराइड (जब रन Gmail से आया हो और वह ओवरराइड अनुमत हो)
2. प्रति-जॉब पेलोड `model`
3. उपयोगकर्ता द्वारा चुना गया संग्रहित Cron session model ओवरराइड
4. Agent/default model चयन

Fast mode भी resolved live चयन का अनुसरण करता है। यदि चुने गए model config में `params.fastMode` है, तो isolated Cron डिफ़ॉल्ट रूप से उसका उपयोग करता है। संग्रहित session `fastMode` ओवरराइड फिर भी config पर दोनों दिशाओं में प्राथमिकता रखता है। Auto mode, मौजूद होने पर, चुने गए model के `params.fastAutoOnSeconds` cutoff का उपयोग करता है, और डिफ़ॉल्ट 60 सेकंड होता है।

यदि isolated run किसी live model-switch handoff से टकराता है, तो Cron switched provider/model के साथ retry करता है और retry से पहले active run के लिए उस live selection को persist करता है। जब switch एक नया auth profile भी साथ लाता है, तो Cron active run के लिए उस auth profile override को भी persist करता है। Retries सीमित हैं: प्रारंभिक प्रयास और 2 switch retries के बाद, Cron अनंत loop करने के बजाय abort करता है।

किसी isolated Cron run के agent runner में प्रवेश करने से पहले, OpenClaw उन कॉन्फ़िगर किए गए `api: "ollama"` और `api: "openai-completions"` providers के reachable local provider endpoints की जांच करता है जिनका `baseUrl` loopback, private-network, या `.local` है। यदि वह endpoint down है, तो model call शुरू करने के बजाय रन को स्पष्ट provider/model error के साथ `skipped` के रूप में दर्ज किया जाता है। Endpoint result 5 मिनट के लिए cache होता है, इसलिए एक ही dead local Ollama, vLLM, SGLang, या LM Studio server का उपयोग करने वाली कई due jobs request storm बनाने के बजाय एक छोटा probe साझा करती हैं। Skipped provider-preflight runs execution-error backoff नहीं बढ़ाते; जब आप repeated skip notifications चाहते हैं, तो `failureAlert.includeSkipped` enable करें।

## डिलीवरी और आउटपुट

| मोड       | क्या होता है                                                        |
| ---------- | ------------------------------------------------------------------- |
| `announce` | यदि agent ने नहीं भेजा, तो अंतिम टेक्स्ट को target तक fallback-deliver करता है |
| `webhook`  | समाप्त event payload को किसी URL पर POST करता है                                |
| `none`     | कोई runner fallback delivery नहीं                                         |

Channel delivery के लिए `--announce --channel telegram --to "-1001234567890"` का उपयोग करें। Telegram forum topics के लिए, `-1001234567890:topic:123` का उपयोग करें; OpenClaw Telegram-owned `-1001234567890:123` shorthand भी स्वीकार करता है। Direct RPC/config callers `delivery.threadId` को string या number के रूप में पास कर सकते हैं। Slack/Discord/Mattermost targets को स्पष्ट prefixes (`channel:<id>`, `user:<id>`) का उपयोग करना चाहिए। Matrix room IDs case-sensitive हैं; Matrix से मिले exact room ID या `room:!room:server` form का उपयोग करें।

जब announce delivery `channel: "last"` का उपयोग करती है या `channel` छोड़ देती है, तो `telegram:123` जैसा provider-prefixed target channel चुन सकता है, इससे पहले कि Cron session history या single configured channel पर fallback करे। केवल loaded plugin द्वारा advertised prefixes provider selectors होते हैं। यदि `delivery.channel` explicit है, तो target prefix को वही provider नामित करना होगा; उदाहरण के लिए, `channel: "whatsapp"` के साथ `to: "telegram:123"` को reject किया जाता है, बजाय इसके कि WhatsApp Telegram ID को phone number के रूप में interpret करे। Target-kind और service prefixes जैसे `channel:<id>`, `user:<id>`, `imessage:<handle>`, और `sms:<number>` channel-owned target syntax ही रहते हैं, provider selectors नहीं।

Isolated jobs के लिए, chat delivery साझा होती है। यदि chat route उपलब्ध है, तो agent `message` tool का उपयोग कर सकता है, भले ही job `--no-deliver` का उपयोग करे। यदि agent configured/current target को भेजता है, तो OpenClaw fallback announce छोड़ देता है। अन्यथा `announce`, `webhook`, और `none` केवल यह नियंत्रित करते हैं कि agent turn के बाद runner final reply के साथ क्या करता है।

जब कोई agent active chat से isolated reminder बनाता है, तो OpenClaw fallback announce route के लिए preserved live delivery target संग्रहीत करता है। Internal session keys lowercase हो सकती हैं; current chat context उपलब्ध होने पर provider delivery targets उन keys से reconstructed नहीं किए जाते।

Implicit announce delivery stale targets को validate और reroute करने के लिए configured channel allowlists का उपयोग करती है। DM pairing-store approvals fallback automation recipients नहीं हैं; जब scheduled job को proactive रूप से DM पर भेजना हो, तो `delivery.to` सेट करें या channel `allowFrom` entry configure करें।

## आउटपुट भाषा

Cron jobs channel, locale, या पिछले messages से reply language infer नहीं करतीं। Scheduled message या template में language rule डालें:

```bash
openclaw cron edit <jobId> \
  --message "Summarize the updates. Respond in Chinese; keep URLs, code, and product names unchanged."
```

Template files के लिए, language instruction को rendered prompt में रखें और job चलने से पहले verify करें कि `{{language}}` जैसे placeholders भरे गए हैं। यदि output languages मिलाता है, तो rule explicit करें, उदाहरण के लिए: "Use Chinese for narrative text and keep technical terms in English."

Failure notifications एक अलग destination path का पालन करती हैं:

- `cron.failureDestination` failure notifications के लिए global default सेट करता है।
- `job.delivery.failureDestination` उसे प्रति job override करता है।
- यदि इनमें से कोई भी सेट नहीं है और job पहले से `announce` के माध्यम से deliver करती है, तो failure notifications अब उस primary announce target पर fallback करती हैं।
- `delivery.failureDestination` केवल `sessionTarget="isolated"` jobs पर समर्थित है, जब तक primary delivery mode `webhook` न हो।
- `failureAlert.includeSkipped: true` किसी job या global Cron alert policy को repeated skipped-run alerts में opt करता है। Skipped runs अलग consecutive skip counter रखते हैं, इसलिए वे execution-error backoff को प्रभावित नहीं करते।

## CLI उदाहरण

<Tabs>
  <Tab title="एक बार का reminder">
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
  <Tab title="Model और thinking ओवरराइड">
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
  <Tab title="Webhook आउटपुट">
    ```bash
    openclaw cron create "0 18 * * 1-5" \
      "Summarize today's deploys as JSON." \
      --name "Deploy digest" \
      --webhook "https://example.invalid/openclaw/cron"
    ```
  </Tab>
  <Tab title="कमांड आउटपुट">
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

Gateway बाहरी triggers के लिए HTTP webhook endpoints expose कर सकता है। Config में enable करें:

```json5
{
  hooks: {
    enabled: true,
    token: "shared-secret",
    path: "/hooks",
  },
}
```

### प्रमाणीकरण

हर request में header के माध्यम से hook token शामिल होना चाहिए:

- `Authorization: Bearer <token>` (अनुशंसित)
- `x-openclaw-token: <token>`

Query-string tokens reject किए जाते हैं।

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
      Event description।
    </ParamField>
    <ParamField path="mode" type="string" default="now">
      `now` या `next-heartbeat`।
    </ParamField>

  </Accordion>
  <Accordion title="POST /hooks/agent">
    Isolated agent turn चलाएँ:

    ```bash
    curl -X POST http://127.0.0.1:18789/hooks/agent \
      -H 'Authorization: Bearer SECRET' \
      -H 'Content-Type: application/json' \
      -d '{"message":"Summarize inbox","name":"Email","model":"openai/gpt-5.4"}'
    ```

    Fields: `message` (required), `name`, `agentId`, `wakeMode`, `deliver`, `channel`, `to`, `model`, `fallbacks`, `thinking`, `timeoutSeconds`।

  </Accordion>
  <Accordion title="Mapped hooks (POST /hooks/<name>)">
    Custom hook names config में `hooks.mappings` के माध्यम से resolve होते हैं। Mappings arbitrary payloads को templates या code transforms के साथ `wake` या `agent` actions में transform कर सकती हैं।
  </Accordion>
</AccordionGroup>

<Warning>
Hook endpoints को loopback, tailnet, या trusted reverse proxy के पीछे रखें।

- Dedicated hook token का उपयोग करें; gateway auth tokens reuse न करें।
- `hooks.path` को dedicated subpath पर रखें; `/` reject किया जाता है।
- `hooks.allowedAgentIds` सेट करें ताकि hook किस effective agent को target कर सकता है, उसे सीमित किया जा सके, जिसमें `agentId` omit होने पर default agent भी शामिल है।
- जब तक आपको caller-selected sessions की आवश्यकता न हो, `hooks.allowRequestSessionKey=false` रखें।
- यदि आप `hooks.allowRequestSessionKey` enable करते हैं, तो allowed session key shapes को constrain करने के लिए `hooks.allowedSessionKeyPrefixes` भी सेट करें।
- Hook payloads डिफ़ॉल्ट रूप से safety boundaries के साथ wrapped होते हैं।

</Warning>

## Gmail PubSub इंटीग्रेशन

Gmail इनबॉक्स ट्रिगर्स को Google PubSub के माध्यम से OpenClaw से जोड़ें.

<Note>
**पूर्वापेक्षाएँ:** `gcloud` CLI, `gog` (gogcli), OpenClaw hooks सक्षम, सार्वजनिक HTTPS endpoint के लिए Tailscale.
</Note>

### विज़ार्ड सेटअप (अनुशंसित)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

यह `hooks.gmail` कॉन्फ़िग लिखता है, Gmail preset सक्षम करता है, और push endpoint के लिए Tailscale Funnel का उपयोग करता है.

### Gateway ऑटो-स्टार्ट

जब `hooks.enabled=true` हो और `hooks.gmail.account` सेट हो, तो Gateway बूट पर `gog gmail watch serve` शुरू करता है और watch को अपने-आप नवीनीकृत करता है. इससे बाहर रहने के लिए `OPENCLAW_SKIP_GMAIL_WATCHER=1` सेट करें.

### मैनुअल एक-बार का सेटअप

<Steps>
  <Step title="Select the GCP project">
    वह GCP project चुनें जो `gog` द्वारा उपयोग किए गए OAuth client का स्वामी है:

    ```bash
    gcloud auth login
    gcloud config set project <project-id>
    gcloud services enable gmail.googleapis.com pubsub.googleapis.com
    ```

  </Step>
  <Step title="Create topic and grant Gmail push access">
    ```bash
    gcloud pubsub topics create gog-gmail-watch
    gcloud pubsub topics add-iam-policy-binding gog-gmail-watch \
      --member=serviceAccount:gmail-api-push@system.gserviceaccount.com \
      --role=roles/pubsub.publisher
    ```
  </Step>
  <Step title="Start the watch">
    ```bash
    gog gmail watch start \
      --account openclaw@gmail.com \
      --label INBOX \
      --topic projects/<project-id>/topics/gog-gmail-watch
    ```
  </Step>
</Steps>

### Gmail मॉडल ओवरराइड

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

## जॉब्स प्रबंधित करना

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

`openclaw cron run <jobId>` मैनुअल run को enqueue करने के बाद लौटता है. shutdown hooks, maintenance scripts, या ऐसी अन्य automation के लिए `--wait` का उपयोग करें जिन्हें queued run पूरा होने तक block करना आवश्यक है. Wait mode ठीक लौटाए गए `runId` को poll करता है; यह status `ok` के लिए `0` और `error`, `skipped`, या wait timeout के लिए non-zero के साथ exit करता है.

एजेंट `cron` tool `cron(action: "list")` से संक्षिप्त job summaries (`id`, `name`, `enabled`, `nextRunAtMs`, `scheduleKind`, `lastRunStatus`) लौटाता है; एक पूर्ण job definition के लिए `cron(action: "get", jobId: "...")` का उपयोग करें. Direct Gateway callers `cron.list` को `compact: true` pass कर सकते हैं; इसे छोड़ने पर delivery previews के साथ मौजूदा full response सुरक्षित रहता है.

`openclaw cron create`, `openclaw cron add` का alias है, और नए jobs positional schedule (`"0 9 * * 1"`, `"every 1h"`, `"20m"`, या ISO timestamp) के बाद positional agent prompt का उपयोग कर सकते हैं. finished run payload को HTTP endpoint पर POST करने के लिए `cron add|create` या `cron edit` पर `--webhook <url>` का उपयोग करें. Webhook delivery को `--announce`, `--channel`, `--to`, `--thread-id`, या `--account` जैसे chat delivery flags के साथ जोड़ा नहीं जा सकता. `cron edit` पर, `--clear-channel`, `--clear-to`, `--clear-thread-id`, और `--clear-account` उन routing fields को अलग-अलग unset करते हैं (प्रत्येक अपने matching set flag के साथ reject होता है), जो `--no-deliver` द्वारा runner fallback delivery disabled करने से अलग है.

<Note>
मॉडल ओवरराइड नोट:

- `openclaw cron add|edit --model ...` job के चुने हुए model को बदलता है.
- यदि model allowed है, तो वही provider/model isolated agent run तक पहुँचता है.
- यदि यह allowed नहीं है या resolve नहीं किया जा सकता, तो cron explicit validation error के साथ run fail करता है.
- API `cron.update` payload patches stored job model override clear करने के लिए `model: null` सेट कर सकते हैं.
- `openclaw cron edit <job-id> --clear-model` CLI से वह override clear करता है (`model: null` patch जैसा ही effect) और इसे `--model` के साथ जोड़ा नहीं जा सकता.
- Configured fallback chains फिर भी apply होती हैं क्योंकि cron `--model` job primary है, session `/model` override नहीं.
- `openclaw cron add|edit --fallbacks ...` payload `fallbacks` सेट करता है, उस job के लिए configured fallbacks को replace करता है; `--fallbacks ""` fallback disabled करता है और run को strict बनाता है. `openclaw cron edit <job-id> --clear-fallbacks` per-job override clear करता है.
- बिना explicit या configured fallback list वाला plain `--model`, silent extra retry target के रूप में agent primary तक fall through नहीं करता.

</Note>

## कॉन्फ़िगरेशन

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

`maxConcurrentRuns` scheduled cron dispatch और isolated agent-turn execution दोनों को limit करता है, और default 8 है. Isolated cron agent turns internally queue की dedicated `cron-nested` execution lane का उपयोग करते हैं, इसलिए इस value को बढ़ाने से independent cron LLM runs केवल अपने outer cron wrappers शुरू करने के बजाय parallel में progress कर सकते हैं. shared non-cron `nested` lane इस setting से widened नहीं होती.

`cron.store` एक logical store key और legacy doctor import path है. मौजूदा JSON stores को SQLite में import और archive करने के लिए `openclaw doctor --fix` चलाएँ; भविष्य के cron changes CLI या Gateway API से होने चाहिए.

cron disabled करें: `cron.enabled: false` या `OPENCLAW_SKIP_CRON=1`.

<AccordionGroup>
  <Accordion title="Retry behavior">
    **One-shot retry**: transient errors (rate limit, overload, network, server error) exponential backoff के साथ 3 बार तक retry करते हैं. Permanent errors तुरंत disable करते हैं.

    **Recurring retry**: retries के बीच exponential backoff (30s से 60m). Backoff अगले successful run के बाद reset होता है.

  </Accordion>
  <Accordion title="Maintenance">
    `cron.sessionRetention` (default `24h`) isolated run-session entries को prune करता है. `cron.runLog.keepLines` प्रति job retained SQLite run-history rows को limit करता है; `maxBytes` older file-backed run logs के साथ config compatibility के लिए retained है.
  </Accordion>
</AccordionGroup>

## समस्या निवारण

### कमांड सीढ़ी

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
  <Accordion title="Cron not firing">
    - `cron.enabled` और `OPENCLAW_SKIP_CRON` env var जाँचें.
    - पुष्टि करें कि Gateway लगातार चल रहा है.
    - `cron` schedules के लिए, timezone (`--tz`) बनाम host timezone verify करें.
    - run output में `reason: not-due` का अर्थ है कि manual run को `openclaw cron run <jobId> --due` से check किया गया था और job अभी due नहीं था.

  </Accordion>
  <Accordion title="Cron fired but no delivery">
    - Delivery mode `none` का अर्थ है कि कोई runner fallback send expected नहीं है. chat route उपलब्ध होने पर agent फिर भी `message` tool से सीधे send कर सकता है.
    - Delivery target missing/invalid (`channel`/`to`) का अर्थ है outbound skipped था.
    - Matrix के लिए, lowercased `delivery.to` room IDs वाले copied या legacy jobs fail हो सकते हैं क्योंकि Matrix room IDs case-sensitive हैं. job को Matrix से मिले exact `!room:server` या `room:!room:server` value पर edit करें.
    - Channel auth errors (`unauthorized`, `Forbidden`) का अर्थ है credentials द्वारा delivery blocked थी.
    - यदि isolated run केवल silent token (`NO_REPLY` / `no_reply`) लौटाता है, तो OpenClaw direct outbound delivery को suppress करता है और fallback queued summary path को भी suppress करता है, इसलिए chat पर कुछ भी post नहीं होता.
    - यदि agent को user को स्वयं message करना चाहिए, तो जाँचें कि job के पास usable route है (`channel: "last"` with a previous chat, या explicit channel/target).

  </Accordion>
  <Accordion title="Cron or heartbeat appears to prevent /new-style rollover">
    - Daily और idle reset freshness `updatedAt` पर आधारित नहीं है; [Session management](/hi/concepts/session#session-lifecycle) देखें.
    - Cron wakeups, heartbeat runs, exec notifications, और gateway bookkeeping routing/status के लिए session row update कर सकते हैं, लेकिन वे `sessionStartedAt` या `lastInteractionAt` को extend नहीं करते.
    - उन legacy rows के लिए जो इन fields के अस्तित्व से पहले बनाई गई थीं, OpenClaw file अभी भी उपलब्ध होने पर transcript JSONL session header से `sessionStartedAt` recover कर सकता है. `lastInteractionAt` के बिना legacy idle rows उस recovered start time को अपनी idle baseline के रूप में उपयोग करती हैं.

  </Accordion>
  <Accordion title="Timezone gotchas">
    - `--tz` के बिना Cron gateway host timezone का उपयोग करता है.
    - timezone के बिना `at` schedules को UTC माना जाता है.
    - Heartbeat `activeHours` configured timezone resolution का उपयोग करता है.

  </Accordion>
</AccordionGroup>

## संबंधित

- [Automation](/hi/automation) — सभी automation mechanisms एक नज़र में
- [Background Tasks](/hi/automation/tasks) — cron executions के लिए task ledger
- [Heartbeat](/hi/gateway/heartbeat) — periodic main-session turns
- [Timezone](/hi/concepts/timezone) — timezone configuration
