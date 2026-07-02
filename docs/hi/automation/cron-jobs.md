---
read_when:
    - पृष्ठभूमि जॉब या वेकअप शेड्यूल करना
    - बाहरी ट्रिगर (webhooks, Gmail) को OpenClaw में जोड़ना
    - निर्धारित कार्यों के लिए Heartbeat और Cron के बीच निर्णय लेना
sidebarTitle: Scheduled tasks
summary: Gateway शेड्यूलर के लिए अनुसूचित जॉब्स, Webhook और Gmail PubSub ट्रिगर
title: निर्धारित कार्य
x-i18n:
    generated_at: "2026-07-02T00:54:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 314b02ed3002843afe9d96e948de362b6111e648eb0e7106ec2ccc230cf50692
    source_path: automation/cron-jobs.md
    workflow: 16
---

Cron Gateway का अंतर्निर्मित शेड्यूलर है। यह jobs को स्थायी रूप से सहेजता है, सही समय पर agent को जगाता है, और आउटपुट को chat channel या Webhook endpoint पर वापस भेज सकता है।

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

- Cron **Gateway के अंदर** process में चलता है (model के अंदर नहीं)।
- Job definitions, runtime state, और run history OpenClaw के shared SQLite state database में स्थायी रूप से सहेजे जाते हैं, ताकि restarts से schedules न खोएँ।
- Upgrade पर, legacy `~/.openclaw/cron/jobs.json`, `jobs-state.json`, और `runs/*.jsonl` files को SQLite में import करने और उन्हें `.migrated` suffix के साथ rename करने के लिए `openclaw doctor --fix` चलाएँ। Malformed job rows को runtime से skip किया जाता है और बाद की repair या review के लिए `jobs-quarantine.json` में copy किया जाता है।
- `cron.store` अब भी logical cron store key और doctor import path का नाम देता है। Import के बाद, उस JSON file को edit करने से active cron jobs अब नहीं बदलते; इसके बजाय `openclaw cron add|edit|remove` या Gateway cron RPC methods का उपयोग करें।
- सभी cron executions [पृष्ठभूमि task](/hi/automation/tasks) records बनाते हैं।
- Gateway startup पर, overdue isolated agent-turn jobs को तुरंत replay करने के बजाय channel-connect window से बाहर reschedule किया जाता है, ताकि restarts के बाद Discord/Telegram startup और native-command setup responsive रहें।
- One-shot jobs (`--at`) default रूप से success के बाद auto-delete हो जाते हैं।
- Isolated cron runs पूरा होने पर अपने `cron:<jobId>` session के लिए tracked browser tabs/processes को best-effort close करते हैं, ताकि detached browser automation orphaned processes पीछे न छोड़े।
- वे isolated cron runs जिन्हें narrow cron self-cleanup grant मिलता है, फिर भी scheduler status, अपने current job की self-filtered list, और उस job की run history पढ़ सकते हैं, ताकि status/heartbeat checks व्यापक cron mutation access पाए बिना अपने schedule की जाँच कर सकें।
- Isolated cron runs stale acknowledgement replies से भी बचाव करते हैं। यदि पहला result केवल interim status update (`on it`, `pulling everything together`, और समान hints) है और कोई descendant subagent run final answer के लिए अब भी जिम्मेदार नहीं है, तो OpenClaw delivery से पहले वास्तविक result के लिए एक बार फिर prompt करता है।
- Isolated cron runs embedded run से structured execution-denial metadata का उपयोग करते हैं, जिसमें node-host `UNAVAILABLE` wrappers शामिल हैं जिनका nested error message `SYSTEM_RUN_DENIED` या `INVALID_REQUEST` से शुरू होता है, ताकि blocked command को green run के रूप में report न किया जाए और साधारण assistant prose को denial न माना जाए।
- Isolated cron runs run-level agent failures को भी job errors मानते हैं, भले ही कोई reply payload न बना हो, ताकि model/provider failures error counters बढ़ाएँ और job को successful के रूप में clear करने के बजाय failure notifications trigger करें।
- जब isolated agent-turn job `timeoutSeconds` तक पहुँचता है, तो cron underlying agent run को abort करता है और उसे छोटी cleanup window देता है। यदि run drain नहीं होता, तो Gateway-owned cleanup cron द्वारा timeout record करने से पहले उस run की session ownership को force-clear करता है, ताकि queued chat work stale processing session के पीछे न छूटे।
- यदि isolated agent-turn runner start होने से पहले या first model call से पहले stall हो जाता है, तो cron phase-specific timeout record करता है, जैसे `setup timed out before runner start` या `stalled before first model call (last phase: context-engine)`। ये watchdogs embedded providers और CLI-backed providers को उनके external CLI process के वास्तविक रूप से start होने से पहले cover करते हैं, और लंबे `timeoutSeconds` values से स्वतंत्र रूप से capped होते हैं ताकि cold-start/auth/context failures full job budget की प्रतीक्षा करने के बजाय जल्दी surface हों।
- यदि आप `openclaw agent` चलाने के लिए system cron या कोई अन्य external scheduler उपयोग करते हैं, तो उसे hard-kill escalation से wrap करें, भले ही CLI `SIGTERM`/`SIGINT` handle करता हो। Gateway-backed runs accepted runs को abort करने के लिए Gateway से अनुरोध करते हैं; local और embedded fallback runs को वही abort signal मिलता है। GNU `timeout` के लिए, plain `timeout 600 ...` के बजाय `timeout -k 60 600 openclaw agent ...` को prefer करें; यदि process drain नहीं हो सकता, तो `-k` value supervisor backstop है। systemd units के लिए, `SIGTERM` stop signal और final kill से पहले `TimeoutStopSec` जैसी grace window का उपयोग करके वही shape रखें। यदि कोई retry वही `--run-id` फिर से उपयोग करता है जबकि original Gateway run अब भी active है, तो duplicate को second run शुरू करने के बजाय in-flight के रूप में report किया जाता है।

<a id="maintenance"></a>

<Note>
Cron के लिए task reconciliation पहले runtime-owned है, दूसरे स्थान पर durable-history-backed: एक active cron task live रहता है जब तक cron runtime उस job को running के रूप में track करता है, भले ही कोई पुरानी child session row अब भी मौजूद हो। जब runtime job की ownership छोड़ देता है और 5-minute grace window expire हो जाती है, maintenance matching `cron:<jobId>:<startedAt>` run के लिए persisted run logs और job state check करता है। यदि वह durable history terminal result दिखाती है, तो task ledger उससे finalize होता है; अन्यथा Gateway-owned maintenance task को `lost` mark कर सकता है। Offline CLI audit durable history से recover कर सकता है, लेकिन वह अपने खाली in-process active-job set को इस बात का proof नहीं मानता कि Gateway-owned cron run gone है।
</Note>

## Schedule types

| प्रकार    | CLI flag  | विवरण                                             |
| ------- | --------- | ------------------------------------------------------- |
| `at`    | `--at`    | One-shot timestamp (ISO 8601 या relative जैसे `20m`)    |
| `every` | `--every` | Fixed interval                                          |
| `cron`  | `--cron`  | Optional `--tz` के साथ 5-field या 6-field cron expression |

Timezone के बिना timestamps को UTC माना जाता है। Local wall-clock scheduling के लिए `--tz America/New_York` जोड़ें।

Recurring top-of-hour expressions को load spikes कम करने के लिए automatically 5 minutes तक stagger किया जाता है। Precise timing force करने के लिए `--exact` या explicit window के लिए `--stagger 30s` उपयोग करें।

### Day-of-month और day-of-week OR logic उपयोग करते हैं

Cron expressions को [croner](https://github.com/Hexagon/croner) द्वारा parse किया जाता है। जब day-of-month और day-of-week fields दोनों non-wildcard होते हैं, तो croner तब match करता है जब **कोई भी** field match करता है — दोनों नहीं। यह standard Vixie cron behavior है।

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

यह प्रति महीने 0–1 बार के बजाय लगभग 5–6 बार fire करता है। OpenClaw यहाँ Croner का default OR behavior उपयोग करता है। दोनों conditions require करने के लिए, Croner का `+` day-of-week modifier (`0 9 15 * +1`) उपयोग करें या एक field पर schedule करें और दूसरे को अपने job के prompt या command में guard करें।

## Execution styles

| Style           | `--session` value   | इसमें चलता है                  | इनके लिए सर्वोत्तम                       |
| --------------- | ------------------- | ------------------------ | ------------------------------ |
| Main session    | `main`              | Dedicated cron wake lane | Reminders, system events       |
| Isolated        | `isolated`          | Dedicated `cron:<jobId>` | Reports, background chores     |
| Current session | `current`           | Detached cron run        | Context-aware recurring work   |
| Custom session  | `session:custom-id` | Detached cron run        | Known chat/session को target करना |

<AccordionGroup>
  <Accordion title="Main session vs isolated vs custom">
    **Main session** jobs cron-owned run lane में system event enqueue करते हैं और optional रूप से heartbeat (`--wake now` या `--wake next-heartbeat`) को जगाते हैं। वे replies के लिए target main session के last delivery context का उपयोग कर सकते हैं, लेकिन वे routine cron turns को human chat lane में append नहीं करते और target session के लिए daily/idle reset freshness को extend नहीं करते। **Isolated** jobs fresh session के साथ dedicated agent turn चलाते हैं। **Current** और **custom** session jobs (`current`, `session:xxx`) delivery context और safe preference seeding के लिए selected chat/session का उपयोग कर सकते हैं, लेकिन हर run अब भी detached cron session में execute होता है ताकि scheduled work live conversation transcript को block या pollute न करे।

    Main-session cron events self-contained system-event reminders हैं। वे
    default heartbeat prompt की "Read
    HEARTBEAT.md" instruction को automatically include नहीं करते। यदि recurring reminder को
    `HEARTBEAT.md` consult करना चाहिए, तो cron event text या
    agent की अपनी instructions में यह स्पष्ट रूप से कहें।

  </Accordion>
  <Accordion title="What 'fresh session' means for detached jobs">
    Isolated, current-session, और custom-session jobs के लिए, "fresh session" का अर्थ हर run के लिए नया transcript/session id है। OpenClaw safe preferences जैसे thinking/fast/verbose settings, labels, और explicit user-selected model/auth overrides carry कर सकता है। Detached runs पुराने cron row से ambient conversation context inherit नहीं करते: channel/group routing, send या queue policy, elevation, origin, या ACP runtime binding। Durable recurring-work state को live chat transcript पर cron memory की तरह rely करने के बजाय prompt, workspace files, tools, या उस system में रखें जिस पर job operate करता है।
  </Accordion>
  <Accordion title="Runtime cleanup">
    Isolated jobs के लिए, runtime teardown में अब उस cron session के लिए best-effort browser cleanup शामिल है। Cleanup failures ignore किए जाते हैं ताकि actual cron result ही प्रभावी रहे।

    Isolated cron runs shared runtime-cleanup path के माध्यम से job के लिए बनाए गए किसी भी bundled MCP runtime instances को भी dispose करते हैं। यह main-session और custom-session MCP clients के teardown जैसा है, इसलिए isolated cron jobs runs के बीच stdio child processes या long-lived MCP connections leak नहीं करते।

  </Accordion>
  <Accordion title="Subagent and Discord delivery">
    जब isolated cron runs subagents orchestrate करते हैं, delivery stale parent interim text के बजाय final descendant output को भी prefer करती है। यदि descendants अब भी running हैं, तो OpenClaw उस partial parent update को announce करने के बजाय suppress करता है।

    Text-only Discord announce targets के लिए, OpenClaw streamed/intermediate text payloads और final answer दोनों replay करने के बजाय canonical final assistant text एक बार भेजता है। Media और structured Discord payloads अब भी separate payloads के रूप में deliver होते हैं ताकि attachments और components drop न हों।

  </Accordion>
</AccordionGroup>

### Command payloads

Command payloads का उपयोग deterministic scripts के लिए करें जिन्हें model-backed isolated agent turn शुरू किए बिना Gateway scheduler के अंदर चलना चाहिए। Command jobs Gateway host पर execute होते हैं, stdout/stderr capture करते हैं, run को cron history में record करते हैं, और isolated jobs जैसे ही `announce`, `webhook`, और `none` delivery modes reuse करते हैं।

<Note>
Command cron operator-admin Gateway automation surface है, agent
`tools.exec` call नहीं। Cron jobs create, update, remove, या manually run करने के लिए
`operator.admin` आवश्यक है; scheduled command runs बाद में
Gateway process के अंदर उस admin-authored automation के रूप में execute होते हैं। Agent exec policy जैसे
`tools.exec.mode`, approval prompts, और per-agent tool allowlists
model-visible exec tools को govern करते हैं, command cron payloads को नहीं।
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

यदि stdout खाली नहीं है, तो वही टेक्स्ट डिलीवर किया गया परिणाम है। यदि stdout खाली है और stderr खाली नहीं है, तो stderr डिलीवर किया जाता है। यदि दोनों स्ट्रीम मौजूद हैं, तो cron एक छोटा `stdout:` / `stderr:` ब्लॉक डिलीवर करता है। शून्य एग्जिट कोड रन को `ok` के रूप में रिकॉर्ड करता है; गैर-शून्य एग्जिट, सिग्नल, टाइमआउट, या नो-आउटपुट टाइमआउट `error` रिकॉर्ड करता है और विफलता अलर्ट ट्रिगर कर सकता है। ऐसा कमांड जो केवल `NO_REPLY` प्रिंट करता है, सामान्य cron साइलेंट-टोकन सप्रेशन का उपयोग करता है और चैट में कुछ भी वापस पोस्ट नहीं करता।

### आइसोलेटेड जॉब के लिए पेलोड विकल्प

<ParamField path="--message" type="string" required>
  प्रॉम्प्ट टेक्स्ट (आइसोलेटेड के लिए आवश्यक)।
</ParamField>
<ParamField path="--model" type="string">
  मॉडल ओवरराइड; जॉब के लिए चुने गए अनुमत मॉडल का उपयोग करता है।
</ParamField>
<ParamField path="--fallbacks" type="string">
  प्रति-जॉब फॉलबैक मॉडल सूची, उदाहरण के लिए `--fallbacks openrouter/gpt-4.1-mini,openai/gpt-5`। बिना फॉलबैक वाले सख्त रन के लिए `--fallbacks ""` पास करें।
</ParamField>
<ParamField path="--clear-fallbacks" type="boolean">
  `cron edit` पर, प्रति-जॉब फॉलबैक ओवरराइड हटाता है ताकि जॉब कॉन्फ़िगर की गई फॉलबैक प्राथमिकता का पालन करे। `--fallbacks` के साथ संयोजित नहीं किया जा सकता।
</ParamField>
<ParamField path="--clear-model" type="boolean">
  `cron edit` पर, प्रति-जॉब मॉडल ओवरराइड हटाता है ताकि जॉब सामान्य cron मॉडल-चयन प्राथमिकता का पालन करे (यदि सेट हो तो संग्रहीत cron-session ओवरराइड, अन्यथा एजेंट/डिफ़ॉल्ट मॉडल)। `--model` के साथ संयोजित नहीं किया जा सकता।
</ParamField>
<ParamField path="--thinking" type="string">
  थिंकिंग लेवल ओवरराइड।
</ParamField>
<ParamField path="--clear-thinking" type="boolean">
  `cron edit` पर, प्रति-जॉब थिंकिंग ओवरराइड हटाता है ताकि जॉब सामान्य cron थिंकिंग प्राथमिकता का पालन करे। `--thinking` के साथ संयोजित नहीं किया जा सकता।
</ParamField>
<ParamField path="--light-context" type="boolean">
  वर्कस्पेस बूटस्ट्रैप फ़ाइल इंजेक्शन छोड़ें।
</ParamField>
<ParamField path="--tools" type="string">
  जॉब किन टूल्स का उपयोग कर सकता है, इसे सीमित करें, उदाहरण के लिए `--tools exec,read`।
</ParamField>

`--model` चुने गए अनुमत मॉडल को उस जॉब के प्राथमिक मॉडल के रूप में उपयोग करता है। यह चैट-सेशन `/model` ओवरराइड जैसा नहीं है: जॉब प्राथमिक विफल होने पर भी कॉन्फ़िगर की गई फॉलबैक चेन लागू होती हैं। यदि अनुरोधित मॉडल अनुमत नहीं है या रिज़ॉल्व नहीं किया जा सकता, तो cron चुपचाप जॉब के एजेंट/डिफ़ॉल्ट मॉडल चयन पर वापस जाने के बजाय स्पष्ट वैलिडेशन त्रुटि के साथ रन विफल करता है।

Cron जॉब पेलोड-लेवल `fallbacks` भी रख सकते हैं। मौजूद होने पर, यह सूची जॉब के लिए कॉन्फ़िगर की गई फॉलबैक चेन को बदल देती है। जब आप ऐसा सख्त cron रन चाहते हैं जो केवल चुने गए मॉडल को आज़माए, तो जॉब पेलोड/API में `fallbacks: []` का उपयोग करें। यदि किसी जॉब में `--model` है लेकिन न पेलोड और न ही कॉन्फ़िगर किए गए फॉलबैक हैं, तो OpenClaw स्पष्ट खाली फॉलबैक ओवरराइड पास करता है ताकि एजेंट प्राथमिक छिपे हुए अतिरिक्त रीट्राई लक्ष्य के रूप में न जोड़ा जाए।

लोकल-प्रोवाइडर प्रीफ्लाइट जाँचें cron रन को `skipped` चिह्नित करने से पहले कॉन्फ़िगर किए गए फॉलबैक पर चलती हैं; `fallbacks: []` उस प्रीफ्लाइट पथ को सख्त रखता है।

आइसोलेटेड जॉब के लिए मॉडल-चयन प्राथमिकता है:

1. Gmail hook मॉडल ओवरराइड (जब रन Gmail से आया हो और वह ओवरराइड अनुमत हो)
2. प्रति-जॉब पेलोड `model`
3. उपयोगकर्ता-चयनित संग्रहीत cron सेशन मॉडल ओवरराइड
4. एजेंट/डिफ़ॉल्ट मॉडल चयन

फास्ट मोड भी रिज़ॉल्व किए गए लाइव चयन का पालन करता है। यदि चुने गए मॉडल कॉन्फ़िग में `params.fastMode` है, तो आइसोलेटेड cron डिफ़ॉल्ट रूप से उसका उपयोग करता है। संग्रहीत सेशन `fastMode` ओवरराइड दोनों दिशाओं में कॉन्फ़िग पर प्राथमिकता रखता है। ऑटो मोड मौजूद होने पर चुने गए मॉडल के `params.fastAutoOnSeconds` कटऑफ का उपयोग करता है, डिफ़ॉल्ट 60 सेकंड है।

यदि किसी आइसोलेटेड रन में लाइव मॉडल-स्विच हैंडऑफ़ आता है, तो cron स्विच किए गए प्रोवाइडर/मॉडल के साथ रीट्राई करता है और रीट्राई करने से पहले उस लाइव चयन को सक्रिय रन के लिए पर्सिस्ट करता है। जब स्विच में नया auth प्रोफ़ाइल भी होता है, तो cron उस auth प्रोफ़ाइल ओवरराइड को भी सक्रिय रन के लिए पर्सिस्ट करता है। रीट्राई सीमित हैं: प्रारंभिक प्रयास के बाद 2 स्विच रीट्राई के बाद, cron हमेशा लूप करने के बजाय अबॉर्ट कर देता है।

किसी आइसोलेटेड cron रन के एजेंट रनर में प्रवेश करने से पहले, OpenClaw कॉन्फ़िगर किए गए `api: "ollama"` और `api: "openai-completions"` प्रोवाइडरों के लिए पहुंच योग्य स्थानीय प्रोवाइडर एंडपॉइंट जाँचता है जिनका `baseUrl` loopback, निजी-नेटवर्क, या `.local` है। यदि वह एंडपॉइंट डाउन है, तो मॉडल कॉल शुरू करने के बजाय रन स्पष्ट प्रोवाइडर/मॉडल त्रुटि के साथ `skipped` के रूप में रिकॉर्ड किया जाता है। एंडपॉइंट परिणाम 5 मिनट के लिए कैश किया जाता है, इसलिए उसी बंद स्थानीय Ollama, vLLM, SGLang, या LM Studio सर्वर का उपयोग करने वाली कई देय जॉब अनुरोधों का तूफ़ान बनाने के बजाय एक छोटा प्रोब साझा करती हैं। स्किप किए गए प्रोवाइडर-प्रीफ्लाइट रन निष्पादन-त्रुटि बैकऑफ़ नहीं बढ़ाते; जब आप दोहराई गई स्किप सूचनाएँ चाहते हैं तो `failureAlert.includeSkipped` सक्षम करें।

## डिलीवरी और आउटपुट

| मोड       | क्या होता है                                                        |
| ---------- | ------------------------------------------------------------------- |
| `announce` | यदि एजेंट ने नहीं भेजा तो अंतिम टेक्स्ट को लक्ष्य पर फॉलबैक-डिलीवर करें |
| `webhook`  | समाप्त इवेंट पेलोड को URL पर POST करें                                |
| `none`     | कोई रनर फॉलबैक डिलीवरी नहीं                                         |

चैनल डिलीवरी के लिए `--announce --channel telegram --to "-1001234567890"` का उपयोग करें। Telegram फ़ोरम टॉपिक के लिए, `-1001234567890:topic:123` का उपयोग करें; OpenClaw Telegram-स्वामित्व वाले `-1001234567890:123` शॉर्टहैंड को भी स्वीकार करता है। डायरेक्ट RPC/कॉन्फ़िग कॉलर `delivery.threadId` को स्ट्रिंग या संख्या के रूप में पास कर सकते हैं। Slack/Discord/Mattermost लक्ष्यों को स्पष्ट प्रीफ़िक्स (`channel:<id>`, `user:<id>`) का उपयोग करना चाहिए। Matrix रूम ID केस-सेंसिटिव होते हैं; Matrix से मिले सटीक रूम ID या `room:!room:server` फ़ॉर्म का उपयोग करें।

जब अनाउंस डिलीवरी `channel: "last"` का उपयोग करती है या `channel` छोड़ देती है, तो `telegram:123` जैसा प्रोवाइडर-प्रीफ़िक्स्ड लक्ष्य cron के सेशन इतिहास या एकल कॉन्फ़िगर किए गए चैनल पर वापस जाने से पहले चैनल चुन सकता है। केवल लोड किए गए Plugin द्वारा विज्ञापित प्रीफ़िक्स प्रोवाइडर चयनकर्ता होते हैं। यदि `delivery.channel` स्पष्ट है, तो लक्ष्य प्रीफ़िक्स को उसी प्रोवाइडर का नाम देना होगा; उदाहरण के लिए, `channel: "whatsapp"` के साथ `to: "telegram:123"` को अस्वीकार किया जाता है, बजाय इसके कि WhatsApp Telegram ID को फ़ोन नंबर के रूप में समझे। लक्ष्य-प्रकार और सेवा प्रीफ़िक्स जैसे `channel:<id>`, `user:<id>`, `imessage:<handle>`, और `sms:<number>` चैनल-स्वामित्व वाली लक्ष्य सिंटैक्स ही रहते हैं, प्रोवाइडर चयनकर्ता नहीं।

आइसोलेटेड जॉब के लिए, चैट डिलीवरी साझा होती है। यदि चैट रूट उपलब्ध है, तो एजेंट `message` टूल का उपयोग कर सकता है, भले ही जॉब `--no-deliver` का उपयोग करती हो। यदि एजेंट कॉन्फ़िगर/वर्तमान लक्ष्य पर भेजता है, तो OpenClaw फॉलबैक अनाउंस छोड़ देता है। अन्यथा `announce`, `webhook`, और `none` केवल यह नियंत्रित करते हैं कि एजेंट टर्न के बाद अंतिम उत्तर के साथ रनर क्या करता है।

जब कोई एजेंट सक्रिय चैट से आइसोलेटेड रिमाइंडर बनाता है, तो OpenClaw फॉलबैक अनाउंस रूट के लिए संरक्षित लाइव डिलीवरी लक्ष्य संग्रहीत करता है। आंतरिक सेशन कुंजियाँ लोअरकेस हो सकती हैं; वर्तमान चैट संदर्भ उपलब्ध होने पर प्रोवाइडर डिलीवरी लक्ष्य उन कुंजियों से पुनर्निर्मित नहीं किए जाते।

इम्प्लिसिट अनाउंस डिलीवरी पुराने लक्ष्यों को वैलिडेट और री-रूट करने के लिए कॉन्फ़िगर किए गए चैनल अलाउलिस्ट का उपयोग करती है। DM पेयरिंग-स्टोर अप्रूवल फॉलबैक ऑटोमेशन प्राप्तकर्ता नहीं हैं; जब किसी शेड्यूल्ड जॉब को DM पर सक्रिय रूप से भेजना चाहिए, तो `delivery.to` सेट करें या चैनल `allowFrom` एंट्री कॉन्फ़िगर करें।

## आउटपुट भाषा

Cron जॉब चैनल, लोकेल, या पिछले
संदेशों से उत्तर भाषा का अनुमान नहीं लगाते। भाषा नियम को शेड्यूल किए गए संदेश या टेम्पलेट में रखें:

```bash
openclaw cron edit <jobId> \
  --message "Summarize the updates. Respond in Chinese; keep URLs, code, and product names unchanged."
```

टेम्पलेट फ़ाइलों के लिए, रेंडर किए गए प्रॉम्प्ट में भाषा निर्देश रखें और
सत्यापित करें कि जॉब चलने से पहले `{{language}}` जैसे प्लेसहोल्डर भरे गए हैं। यदि
आउटपुट भाषाओं को मिलाता है, तो नियम को स्पष्ट करें, उदाहरण के लिए: "वर्णनात्मक
टेक्स्ट के लिए चीनी का उपयोग करें और तकनीकी शब्दों को अंग्रेज़ी में रखें।"

विफलता सूचनाएं एक अलग गंतव्य पथ का अनुसरण करती हैं:

- `cron.failureDestination` विफलता सूचनाओं के लिए वैश्विक डिफ़ॉल्ट सेट करता है।
- `job.delivery.failureDestination` उसे प्रति जॉब ओवरराइड करता है।
- यदि दोनों में से कोई सेट नहीं है और जॉब पहले से `announce` के माध्यम से डिलीवर होता है, तो विफलता सूचनाएं अब उस प्राथमिक announce लक्ष्य पर वापस चली जाती हैं।
- `delivery.failureDestination` केवल `sessionTarget="isolated"` जॉब्स पर समर्थित है, जब तक कि प्राथमिक डिलीवरी मोड `webhook` न हो।
- `failureAlert.includeSkipped: true` किसी जॉब या वैश्विक cron अलर्ट नीति को बार-बार स्किप किए गए रन अलर्ट में ऑप्ट इन करता है। स्किप किए गए रन एक अलग लगातार स्किप काउंटर रखते हैं, इसलिए वे निष्पादन-त्रुटि backoff को प्रभावित नहीं करते।

## CLI उदाहरण

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

Gateway बाहरी ट्रिगर्स के लिए HTTP webhook एंडपॉइंट्स एक्सपोज़ कर सकता है। कॉन्फ़िग में सक्षम करें:

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

हर अनुरोध में हेडर के माध्यम से hook token शामिल होना चाहिए:

- `Authorization: Bearer <token>` (अनुशंसित)
- `x-openclaw-token: <token>`

क्वेरी-स्ट्रिंग tokens अस्वीकार किए जाते हैं।

<AccordionGroup>
  <Accordion title="POST /hooks/wake">
    मुख्य सेशन के लिए सिस्टम इवेंट को कतार में डालें:

    ```bash
    curl -X POST http://127.0.0.1:18789/hooks/wake \
      -H 'Authorization: Bearer SECRET' \
      -H 'Content-Type: application/json' \
      -d '{"text":"New email received","mode":"now"}'
    ```

    <ParamField path="text" type="string" required>
      इवेंट विवरण।
    </ParamField>
    <ParamField path="mode" type="string" default="now">
      `now` या `next-heartbeat`।
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

    फ़ील्ड: `message` (आवश्यक), `name`, `agentId`, `wakeMode`, `deliver`, `channel`, `to`, `model`, `fallbacks`, `thinking`, `timeoutSeconds`।

  </Accordion>
  <Accordion title="Mapped hooks (POST /hooks/<name>)">
    कस्टम hook नाम कॉन्फ़िग में `hooks.mappings` के माध्यम से हल किए जाते हैं। Mappings टेम्पलेट्स या कोड ट्रांसफ़ॉर्म के साथ मनमाने payloads को `wake` या `agent` actions में बदल सकते हैं।
  </Accordion>
</AccordionGroup>

<Warning>
hook endpoints को loopback, tailnet, या trusted reverse proxy के पीछे रखें।

- एक समर्पित हुक टोकन का उपयोग करें; gateway auth tokens का पुनः उपयोग न करें।
- `hooks.path` को एक समर्पित उप-पथ पर रखें; `/` अस्वीकार किया जाता है।
- `hooks.allowedAgentIds` सेट करें ताकि यह सीमित हो कि हुक किस प्रभावी एजेंट को लक्षित कर सकता है, जिसमें `agentId` छोड़े जाने पर डिफ़ॉल्ट एजेंट भी शामिल है।
- जब तक आपको कॉलर-चयनित सत्रों की आवश्यकता न हो, `hooks.allowRequestSessionKey=false` रखें।
- यदि आप `hooks.allowRequestSessionKey` सक्षम करते हैं, तो अनुमत सत्र कुंजी संरचनाओं को सीमित करने के लिए `hooks.allowedSessionKeyPrefixes` भी सेट करें।
- हुक पेलोड डिफ़ॉल्ट रूप से सुरक्षा सीमाओं के साथ लपेटे जाते हैं।

</Warning>

## Gmail PubSub एकीकरण

Google PubSub के माध्यम से Gmail इनबॉक्स ट्रिगर को OpenClaw से जोड़ें।

<Note>
**पूर्वापेक्षाएँ:** `gcloud` CLI, `gog` (gogcli), OpenClaw हुक सक्षम, सार्वजनिक HTTPS endpoint के लिए Tailscale।
</Note>

### विज़र्ड सेटअप (अनुशंसित)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

यह `hooks.gmail` config लिखता है, Gmail preset सक्षम करता है, और push endpoint के लिए Tailscale Funnel का उपयोग करता है।

### Gateway auto-start

जब `hooks.enabled=true` हो और `hooks.gmail.account` सेट हो, तो Gateway boot पर `gog gmail watch serve` शुरू करता है और watch को स्वतः नवीनीकृत करता है। बाहर निकलने के लिए `OPENCLAW_SKIP_GMAIL_WATCHER=1` सेट करें।

### मैनुअल एक-बार सेटअप

<Steps>
  <Step title="Select the GCP project">
    वह GCP project चुनें जिसके पास `gog` द्वारा उपयोग किया गया OAuth client है:

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

### Gmail मॉडल override

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

## जॉब प्रबंधन

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

`openclaw cron run <jobId>` मैनुअल रन को enqueue करने के बाद लौटता है। shutdown hooks, maintenance scripts, या अन्य automation के लिए `--wait` का उपयोग करें जिन्हें queued run समाप्त होने तक block करना आवश्यक है। Wait mode ठीक लौटाए गए `runId` को poll करता है; यह status `ok` के लिए `0` और `error`, `skipped`, या wait timeout के लिए non-zero के साथ exit करता है।

एजेंट `cron` tool `cron(action: "list")` से संक्षिप्त जॉब summaries (`id`, `name`, `enabled`, `nextRunAtMs`, `scheduleKind`, `lastRunStatus`) लौटाता है; एक पूर्ण जॉब definition के लिए `cron(action: "get", jobId: "...")` का उपयोग करें। सीधे Gateway callers `cron.list` को `compact: true` पास कर सकते हैं; इसे छोड़ने पर delivery previews के साथ मौजूदा पूर्ण response संरक्षित रहता है।

`openclaw cron create`, `openclaw cron add` का alias है, और नए जॉब positional schedule (`"0 9 * * 1"`, `"every 1h"`, `"20m"`, या ISO timestamp) के बाद positional agent prompt का उपयोग कर सकते हैं। पूर्ण run payload को HTTP endpoint पर POST करने के लिए `cron add|create` या `cron edit` पर `--webhook <url>` का उपयोग करें। Webhook delivery को `--announce`, `--channel`, `--to`, `--thread-id`, या `--account` जैसे chat delivery flags के साथ combine नहीं किया जा सकता। `cron edit` पर, `--clear-channel`, `--clear-to`, `--clear-thread-id`, और `--clear-account` उन routing fields को अलग-अलग unset करते हैं (हर एक अपने matching set flag के साथ अस्वीकार किया जाता है), जो runner fallback delivery को disable करने वाले `--no-deliver` से अलग है।

<Note>
मॉडल override नोट:

- `openclaw cron add|edit --model ...` जॉब के चयनित मॉडल को बदलता है।
- यदि मॉडल अनुमत है, तो वही सटीक provider/model isolated agent run तक पहुँचता है।
- यदि यह अनुमत नहीं है या resolve नहीं किया जा सकता, तो cron स्पष्ट validation error के साथ run को fail करता है।
- API `cron.update` payload patches stored job model override को clear करने के लिए `model: null` सेट कर सकते हैं।
- `openclaw cron edit <job-id> --clear-model` CLI से उस override को clear करता है (`model: null` patch जैसा ही प्रभाव) और इसे `--model` के साथ combine नहीं किया जा सकता।
- Configured fallback chains अभी भी लागू रहती हैं क्योंकि cron `--model` एक job primary है, session `/model` override नहीं।
- `openclaw cron add|edit --fallbacks ...` payload `fallbacks` सेट करता है, जिससे उस जॉब के लिए configured fallbacks replace हो जाते हैं; `--fallbacks ""` fallback को disable करता है और run को strict बनाता है। `openclaw cron edit <job-id> --clear-fallbacks` per-job override को clear करता है।
- बिना explicit या configured fallback list वाला सादा `--model` silent extra retry target के रूप में agent primary तक fall through नहीं करता।

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

`maxConcurrentRuns` scheduled cron dispatch और isolated agent-turn execution, दोनों को सीमित करता है, और डिफ़ॉल्ट 8 है। Isolated cron agent turns आंतरिक रूप से queue की समर्पित `cron-nested` execution lane का उपयोग करते हैं, इसलिए इस value को बढ़ाने से स्वतंत्र cron LLM runs केवल अपने outer cron wrappers शुरू करने के बजाय parallel में आगे बढ़ सकते हैं। साझा non-cron `nested` lane इस setting से widened नहीं होती।

`cron.store` एक logical store key और legacy doctor import path है। मौजूदा JSON stores को SQLite में import और archive करने के लिए `openclaw doctor --fix` चलाएँ; भविष्य के cron changes CLI या Gateway API के माध्यम से होने चाहिए।

cron disable करें: `cron.enabled: false` या `OPENCLAW_SKIP_CRON=1`।

<AccordionGroup>
  <Accordion title="Retry behavior">
    **One-shot retry**: transient errors (rate limit, overload, network, server error) exponential backoff के साथ 3 बार तक retry करते हैं। Permanent errors तुरंत disable कर देते हैं।

    **Recurring retry**: retries के बीच exponential backoff (30s से 60m)। अगले सफल run के बाद backoff reset हो जाता है।

  </Accordion>
  <Accordion title="Maintenance">
    `cron.sessionRetention` (default `24h`) isolated run-session entries को prune करता है। `cron.runLog.keepLines` प्रति जॉब retained SQLite run-history rows को सीमित करता है; `maxBytes` पुराने file-backed run logs के साथ config compatibility के लिए retained है।
  </Accordion>
</AccordionGroup>

## समस्या निवारण

### कमांड ladder

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
    - `cron.enabled` और `OPENCLAW_SKIP_CRON` env var जाँचें।
    - पुष्टि करें कि Gateway लगातार चल रहा है।
    - `cron` schedules के लिए, timezone (`--tz`) बनाम host timezone सत्यापित करें।
    - run output में `reason: not-due` का अर्थ है कि manual run को `openclaw cron run <jobId> --due` के साथ checked किया गया था और जॉब अभी due नहीं था।

  </Accordion>
  <Accordion title="Cron fired but no delivery">
    - Delivery mode `none` का अर्थ है कि कोई runner fallback send अपेक्षित नहीं है। chat route उपलब्ध होने पर agent अभी भी `message` tool के साथ सीधे send कर सकता है।
    - Delivery target missing/invalid (`channel`/`to`) का अर्थ है कि outbound skipped था।
    - Matrix के लिए, copied या legacy jobs जिनमें lowercased `delivery.to` room IDs हैं, fail हो सकते हैं क्योंकि Matrix room IDs case-sensitive होते हैं। जॉब को Matrix से exact `!room:server` या `room:!room:server` value पर edit करें।
    - Channel auth errors (`unauthorized`, `Forbidden`) का अर्थ है कि credentials ने delivery block कर दी।
    - यदि isolated run केवल silent token (`NO_REPLY` / `no_reply`) लौटाता है, तो OpenClaw direct outbound delivery को suppress करता है और fallback queued summary path को भी suppress करता है, इसलिए chat पर कुछ भी वापस post नहीं होता।
    - यदि agent को user को स्वयं message करना चाहिए, तो जाँचें कि जॉब के पास usable route है (`channel: "last"` with a previous chat, या explicit channel/target)।

  </Accordion>
  <Accordion title="Cron or heartbeat appears to prevent /new-style rollover">
    - Daily और idle reset freshness `updatedAt` पर आधारित नहीं है; [Session management](/hi/concepts/session#session-lifecycle) देखें।
    - Cron wakeups, Heartbeat runs, exec notifications, और gateway bookkeeping routing/status के लिए session row update कर सकते हैं, लेकिन वे `sessionStartedAt` या `lastInteractionAt` को extend नहीं करते।
    - उन legacy rows के लिए जो इन fields के अस्तित्व में आने से पहले बनाई गई थीं, OpenClaw transcript JSONL session header से `sessionStartedAt` recover कर सकता है जब file अभी भी उपलब्ध हो। `lastInteractionAt` के बिना legacy idle rows उस recovered start time को अपने idle baseline के रूप में उपयोग करती हैं।

  </Accordion>
  <Accordion title="Timezone gotchas">
    - `--tz` के बिना Cron gateway host timezone का उपयोग करता है।
    - timezone के बिना `at` schedules को UTC माना जाता है।
    - Heartbeat `activeHours` configured timezone resolution का उपयोग करता है।

  </Accordion>
</AccordionGroup>

## संबंधित

- [Automation](/hi/automation) — सभी automation mechanisms एक नज़र में
- [Background Tasks](/hi/automation/tasks) — cron executions के लिए task ledger
- [Heartbeat](/hi/gateway/heartbeat) — periodic main-session turns
- [Timezone](/hi/concepts/timezone) — timezone configuration
