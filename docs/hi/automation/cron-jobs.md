---
read_when:
    - बैकग्राउंड जॉब या वेकअप शेड्यूल करना
    - OpenClaw में बाहरी ट्रिगर्स (Webhook, Gmail) जोड़ना
    - निर्धारित कार्यों के लिए Heartbeat और Cron के बीच निर्णय लेना
sidebarTitle: Scheduled tasks
summary: Gateway शेड्यूलर के लिए शेड्यूल किए गए जॉब, Webhook, और Gmail PubSub ट्रिगर
title: निर्धारित कार्य
x-i18n:
    generated_at: "2026-07-02T08:15:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2f75b8d1e5ac558a02b895e1cd1b92b05af549a2bd63d4ce3ddafcaf9e94b88e
    source_path: automation/cron-jobs.md
    workflow: 16
---

Cron Gateway का बिल्ट-इन scheduler है। यह jobs को persist करता है, सही समय पर agent को जगाता है, और output को chat channel या Webhook endpoint पर वापस deliver कर सकता है।

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

## cron कैसे काम करता है

- Cron **Gateway के अंदर** process में चलता है (model के अंदर नहीं)।
- Job definitions, runtime state, और run history OpenClaw के shared SQLite state database में persist होते हैं, इसलिए restarts schedules नहीं खोते।
- Upgrade पर, legacy `~/.openclaw/cron/jobs.json`, `jobs-state.json`, और `runs/*.jsonl` files को SQLite में import करने और उन्हें `.migrated` suffix के साथ rename करने के लिए `openclaw doctor --fix` चलाएँ। Malformed job rows को runtime से skip किया जाता है और बाद में repair या review के लिए `jobs-quarantine.json` में copy किया जाता है।
- `cron.store` अभी भी logical cron store key और doctor import path को name करता है। Import के बाद, उस JSON file को edit करने से active cron jobs अब नहीं बदलते; इसके बजाय `openclaw cron add|edit|remove` या Gateway cron RPC methods का उपयोग करें।
- सभी cron executions [background task](/hi/automation/tasks) records बनाते हैं।
- Gateway startup पर, overdue isolated agent-turn jobs को तुरंत replay करने के बजाय channel-connect window से बाहर reschedule किया जाता है, ताकि restarts के बाद Discord/Telegram startup और native-command setup responsive रहें।
- One-shot jobs (`--at`) default रूप से success के बाद auto-delete हो जाते हैं।
- Isolated cron runs, run पूरा होने पर अपने `cron:<jobId>` session के लिए tracked browser tabs/processes को best-effort close करते हैं, ताकि detached browser automation orphaned processes पीछे न छोड़े।
- Narrow cron self-cleanup grant पाने वाले isolated cron runs अब भी scheduler status, अपनी current job की self-filtered list, और उस job की run history पढ़ सकते हैं, ताकि status/Heartbeat checks broader cron mutation access पाए बिना अपना schedule inspect कर सकें।
- Isolated cron runs stale acknowledgement replies से भी guard करते हैं। अगर पहला result सिर्फ interim status update (`on it`, `pulling everything together`, और समान hints) है और कोई descendant subagent run final answer के लिए अभी responsible नहीं है, तो OpenClaw delivery से पहले actual result के लिए एक बार फिर prompt करता है।
- Isolated cron runs embedded run से structured execution-denial metadata का उपयोग करते हैं, जिसमें node-host `UNAVAILABLE` wrappers शामिल हैं जिनका nested error message `SYSTEM_RUN_DENIED` या `INVALID_REQUEST` से शुरू होता है, ताकि blocked command को green run की तरह report न किया जाए जबकि ordinary assistant prose को denial न माना जाए।
- Isolated cron runs run-level agent failures को भी job errors मानते हैं, भले ही कोई reply payload produce न हो, ताकि model/provider failures error counters increment करें और job को successful clear करने के बजाय failure notifications trigger करें।
- जब isolated agent-turn job `timeoutSeconds` तक पहुँचता है, cron underlying agent run को abort करता है और उसे एक छोटी cleanup window देता है। अगर run drain नहीं होता, तो Gateway-owned cleanup cron द्वारा timeout record करने से पहले उस run की session ownership को force-clear करता है, ताकि queued chat work stale processing session के पीछे न छूटे।
- अगर isolated agent-turn runner start होने से पहले या first model call से पहले stall करता है, तो cron phase-specific timeout record करता है, जैसे `setup timed out before runner start` या `stalled before first model call (last phase: context-engine)`। ये watchdogs embedded providers और CLI-backed providers को उनके external CLI process के वास्तव में start होने से पहले cover करते हैं, और लंबे `timeoutSeconds` values से independent cap होते हैं ताकि cold-start/auth/context failures full job budget का इंतज़ार करने के बजाय जल्दी surface हों।
- अगर आप `openclaw agent` चलाने के लिए system cron या कोई दूसरा external scheduler उपयोग करते हैं, तो उसे hard-kill escalation के साथ wrap करें, भले ही CLI `SIGTERM`/`SIGINT` handle करता हो। Gateway-backed runs accepted runs को abort करने के लिए Gateway से कहते हैं; local और embedded fallback runs को वही abort signal मिलता है। GNU `timeout` के लिए, plain `timeout 600 ...` के बजाय `timeout -k 60 600 openclaw agent ...` prefer करें; अगर process drain नहीं हो पाता, तो `-k` value supervisor backstop होती है। systemd units के लिए, final kill से पहले `SIGTERM` stop signal और `TimeoutStopSec` जैसी grace window का उपयोग करके वही shape रखें। अगर retry किसी `--run-id` को reuse करता है जबकि original Gateway run अभी भी active है, तो duplicate को second run start करने के बजाय in-flight report किया जाता है।

<a id="maintenance"></a>

<Note>
Cron के लिए task reconciliation पहले runtime-owned, फिर durable-history-backed है: active cron task तब तक live रहता है जब तक cron runtime उस job को running के रूप में track करता है, भले ही कोई पुराना child session row अभी भी मौजूद हो। Runtime के job owning बंद करने और 5-minute grace window expire होने के बाद, maintenance matching `cron:<jobId>:<startedAt>` run के लिए persisted run logs और job state check करता है। अगर वह durable history terminal result दिखाती है, तो task ledger उससे finalized होता है; अन्यथा Gateway-owned maintenance task को `lost` mark कर सकता है। Offline CLI audit durable history से recover कर सकता है, लेकिन वह अपने empty in-process active-job set को इस बात का proof नहीं मानता कि Gateway-owned cron run gone है।
</Note>

## Schedule types

| Kind    | CLI flag  | Description                                             |
| ------- | --------- | ------------------------------------------------------- |
| `at`    | `--at`    | One-shot timestamp (ISO 8601 या relative जैसे `20m`)    |
| `every` | `--every` | Fixed interval                                          |
| `cron`  | `--cron`  | Optional `--tz` के साथ 5-field या 6-field cron expression |

Timezone के बिना timestamps को UTC माना जाता है। Local wall-clock scheduling के लिए `--tz America/New_York` जोड़ें।

Recurring top-of-hour expressions load spikes घटाने के लिए automatically 5 minutes तक stagger किए जाते हैं। Precise timing force करने के लिए `--exact` या explicit window के लिए `--stagger 30s` उपयोग करें।

### Day-of-month और day-of-week OR logic उपयोग करते हैं

Cron expressions [croner](https://github.com/Hexagon/croner) द्वारा parse किए जाते हैं। जब day-of-month और day-of-week दोनों fields non-wildcard हों, तो croner तब match करता है जब **कोई भी** field match करे — दोनों नहीं। यह standard Vixie cron behavior है।

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

यह प्रति month 0–1 बार के बजाय ~5–6 बार fire करता है। OpenClaw यहाँ Croner का default OR behavior उपयोग करता है। दोनों conditions require करने के लिए, Croner का `+` day-of-week modifier (`0 9 15 * +1`) उपयोग करें या एक field पर schedule करें और दूसरी को अपने job के prompt या command में guard करें।

## Execution styles

| Style           | `--session` value   | Runs in                  | Best for                        |
| --------------- | ------------------- | ------------------------ | ------------------------------- |
| Main session    | `main`              | Dedicated cron wake lane | Reminders, system events        |
| Isolated        | `isolated`          | Dedicated `cron:<jobId>` | Reports, background chores      |
| Current session | `current`           | Bound at creation time   | Context-aware recurring work    |
| Custom session  | `session:custom-id` | Persistent named session | Workflows जो history पर build करते हैं |

<AccordionGroup>
  <Accordion title="Main session vs isolated vs custom">
    **Main session** jobs cron-owned run lane में system event enqueue करते हैं और optional रूप से Heartbeat (`--wake now` या `--wake next-heartbeat`) को wake करते हैं। वे replies के लिए target main session के last delivery context का उपयोग कर सकते हैं, लेकिन वे routine cron turns को human chat lane में append नहीं करते और target session के लिए daily/idle reset freshness extend नहीं करते। **Isolated** jobs fresh session के साथ dedicated agent turn चलाते हैं। **Custom sessions** (`session:xxx`) runs के बीच context persist करते हैं, जिससे daily standups जैसे workflows enable होते हैं जो previous summaries पर build करते हैं।

    Main-session cron events self-contained system-event reminders हैं। वे
    default Heartbeat prompt के "Read
    HEARTBEAT.md" instruction को automatically include नहीं करते। अगर recurring reminder को
    `HEARTBEAT.md` consult करना चाहिए, तो cron event text में या
    agent के अपने instructions में इसे explicitly कहें।

  </Accordion>
  <Accordion title="What 'fresh session' means for isolated jobs">
    Isolated jobs के लिए, "fresh session" का अर्थ है हर run के लिए नया transcript/session id। OpenClaw thinking/fast/verbose settings, labels, और explicit user-selected model/auth overrides जैसी safe preferences carry कर सकता है, लेकिन वह पुराने cron row से ambient conversation context inherit नहीं करता: channel/group routing, send या queue policy, elevation, origin, या ACP runtime binding। जब recurring job को जानबूझकर उसी conversation context पर build करना चाहिए, तो `current` या `session:<id>` उपयोग करें।
  </Accordion>
  <Accordion title="Runtime cleanup">
    Isolated jobs के लिए, runtime teardown में अब उस cron session के लिए best-effort browser cleanup शामिल है। Cleanup failures ignore किए जाते हैं ताकि actual cron result ही प्राथमिक रहे।

    Isolated cron runs job के लिए बनाए गए किसी भी bundled MCP runtime instances को shared runtime-cleanup path के माध्यम से dispose भी करते हैं। यह main-session और custom-session MCP clients के tear down होने के तरीके से match करता है, इसलिए isolated cron jobs runs के बीच stdio child processes या long-lived MCP connections leak नहीं करते।

  </Accordion>
  <Accordion title="Subagent and Discord delivery">
    जब isolated cron runs subagents orchestrate करते हैं, तो delivery stale parent interim text के बजाय final descendant output को भी prefer करती है। अगर descendants अभी भी running हैं, तो OpenClaw उस partial parent update को announce करने के बजाय suppress करता है।

    Text-only Discord announce targets के लिए, OpenClaw streamed/intermediate text payloads और final answer दोनों को replay करने के बजाय canonical final assistant text एक बार भेजता है। Media और structured Discord payloads अब भी separate payloads के रूप में delivered होते हैं ताकि attachments और components drop न हों।

  </Accordion>
</AccordionGroup>

### Command payloads

Command payloads का उपयोग deterministic scripts के लिए करें जिन्हें model-backed isolated agent turn start किए बिना Gateway scheduler के अंदर चलना चाहिए। Command jobs Gateway host पर execute होते हैं, stdout/stderr capture करते हैं, cron history में run record करते हैं, और isolated jobs जैसे ही `announce`, `webhook`, और `none` delivery modes reuse करते हैं।

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

यदि stdout खाली नहीं है, तो वही पाठ डिलीवर किया गया परिणाम होता है। यदि stdout खाली है और stderr खाली नहीं है, तो stderr डिलीवर किया जाता है। यदि दोनों स्ट्रीम मौजूद हैं, तो cron एक छोटा `stdout:` / `stderr:` ब्लॉक डिलीवर करता है। शून्य एग्ज़िट कोड रन को `ok` के रूप में रिकॉर्ड करता है; गैर-शून्य एग्ज़िट, सिग्नल, टाइमआउट, या नो-आउटपुट टाइमआउट `error` रिकॉर्ड करता है और विफलता अलर्ट ट्रिगर कर सकता है। कोई कमांड जो केवल `NO_REPLY` प्रिंट करता है, सामान्य cron साइलेंट-टोकन सप्रेशन का उपयोग करता है और चैट में कुछ भी वापस पोस्ट नहीं करता।

### आइसोलेटेड जॉब्स के लिए पेलोड विकल्प

<ParamField path="--message" type="string" required>
  प्रॉम्प्ट पाठ (आइसोलेटेड के लिए आवश्यक)।
</ParamField>
<ParamField path="--model" type="string">
  Model ओवरराइड; जॉब के लिए चयनित अनुमत model का उपयोग करता है।
</ParamField>
<ParamField path="--fallbacks" type="string">
  प्रति-जॉब फ़ॉलबैक model सूची, उदाहरण के लिए `--fallbacks openrouter/gpt-4.1-mini,openai/gpt-5`। बिना फ़ॉलबैक वाले सख्त रन के लिए `--fallbacks ""` पास करें।
</ParamField>
<ParamField path="--clear-fallbacks" type="boolean">
  `cron edit` पर, प्रति-जॉब फ़ॉलबैक ओवरराइड हटाता है ताकि जॉब कॉन्फ़िगर की गई फ़ॉलबैक प्राथमिकता का पालन करे। `--fallbacks` के साथ संयोजित नहीं किया जा सकता।
</ParamField>
<ParamField path="--clear-model" type="boolean">
  `cron edit` पर, प्रति-जॉब model ओवरराइड हटाता है ताकि जॉब सामान्य cron model-चयन प्राथमिकता का पालन करे (यदि सेट हो तो संग्रहीत cron-session ओवरराइड, अन्यथा agent/default model)। `--model` के साथ संयोजित नहीं किया जा सकता।
</ParamField>
<ParamField path="--thinking" type="string">
  Thinking स्तर ओवरराइड।
</ParamField>
<ParamField path="--clear-thinking" type="boolean">
  `cron edit` पर, प्रति-जॉब thinking ओवरराइड हटाता है ताकि जॉब सामान्य cron thinking प्राथमिकता का पालन करे। `--thinking` के साथ संयोजित नहीं किया जा सकता।
</ParamField>
<ParamField path="--light-context" type="boolean">
  वर्कस्पेस बूटस्ट्रैप फ़ाइल इंजेक्शन छोड़ें।
</ParamField>
<ParamField path="--tools" type="string">
  जॉब किन टूल्स का उपयोग कर सकता है, इसे सीमित करें, उदाहरण के लिए `--tools exec,read`।
</ParamField>

`--model` चयनित अनुमत model को उस जॉब के प्राथमिक model के रूप में उपयोग करता है। यह चैट-सेशन `/model` ओवरराइड जैसा नहीं है: जॉब प्राथमिक विफल होने पर भी कॉन्फ़िगर की गई फ़ॉलबैक चेन लागू रहती हैं। यदि अनुरोधित model अनुमत नहीं है या रिज़ॉल्व नहीं किया जा सकता, तो cron चुपचाप जॉब के agent/default model चयन पर वापस जाने के बजाय स्पष्ट वैलिडेशन त्रुटि के साथ रन विफल करता है।

Cron जॉब्स पेलोड-स्तर `fallbacks` भी रख सकती हैं। मौजूद होने पर, वह सूची जॉब के लिए कॉन्फ़िगर की गई फ़ॉलबैक चेन को बदल देती है। जब आप ऐसा सख्त cron रन चाहते हैं जो केवल चयनित model आज़माए, तो जॉब पेलोड/API में `fallbacks: []` का उपयोग करें। यदि किसी जॉब में `--model` है लेकिन न पेलोड फ़ॉलबैक हैं और न कॉन्फ़िगर किए गए फ़ॉलबैक, तो OpenClaw एक स्पष्ट खाली फ़ॉलबैक ओवरराइड पास करता है ताकि agent प्राथमिक को छिपे हुए अतिरिक्त रीट्राई लक्ष्य के रूप में न जोड़ा जाए।

किसी cron रन को `skipped` चिह्नित करने से पहले local-provider प्रीफ़्लाइट जांचें कॉन्फ़िगर किए गए फ़ॉलबैक पर चलती हैं; `fallbacks: []` उस प्रीफ़्लाइट पथ को सख्त रखता है।

आइसोलेटेड जॉब्स के लिए model-चयन प्राथमिकता है:

1. Gmail hook model ओवरराइड (जब रन Gmail से आया हो और वह ओवरराइड अनुमत हो)
2. प्रति-जॉब पेलोड `model`
3. उपयोगकर्ता-चयनित संग्रहीत cron सेशन model ओवरराइड
4. Agent/default model चयन

Fast मोड भी रिज़ॉल्व किए गए लाइव चयन का पालन करता है। यदि चयनित model कॉन्फ़िग में `params.fastMode` है, तो आइसोलेटेड cron डिफ़ॉल्ट रूप से उसका उपयोग करता है। संग्रहीत सेशन `fastMode` ओवरराइड किसी भी दिशा में कॉन्फ़िग पर अभी भी प्राथमिकता रखता है। Auto मोड मौजूद होने पर चयनित model के `params.fastAutoOnSeconds` कटऑफ़ का उपयोग करता है, जिसका डिफ़ॉल्ट 60 सेकंड है।

यदि कोई आइसोलेटेड रन लाइव model-switch हैंडऑफ़ तक पहुँचता है, तो cron बदले गए provider/model के साथ दोबारा प्रयास करता है और रीट्राई से पहले सक्रिय रन के लिए उस लाइव चयन को कायम रखता है। जब स्विच नया auth profile भी साथ लाता है, तो cron सक्रिय रन के लिए वह auth profile ओवरराइड भी कायम रखता है। रीट्राई सीमित हैं: प्रारंभिक प्रयास के बाद 2 switch रीट्राई तक, उसके बाद cron अंतहीन लूप के बजाय अबॉर्ट करता है।

किसी आइसोलेटेड cron रन के agent runner में प्रवेश करने से पहले, OpenClaw कॉन्फ़िगर किए गए `api: "ollama"` और `api: "openai-completions"` providers के लिए पहुँच योग्य local provider endpoints जांचता है, जिनका `baseUrl` loopback, निजी-नेटवर्क, या `.local` है। यदि वह endpoint डाउन है, तो रन model कॉल शुरू करने के बजाय स्पष्ट provider/model त्रुटि के साथ `skipped` के रूप में रिकॉर्ड किया जाता है। endpoint परिणाम 5 मिनट के लिए कैश किया जाता है, ताकि समान मृत local Ollama, vLLM, SGLang, या LM Studio सर्वर का उपयोग करने वाली कई देय जॉब्स अनुरोधों की बाढ़ बनाने के बजाय एक छोटी probe साझा करें। छोड़े गए provider-preflight रन execution-error backoff नहीं बढ़ाते; जब आप बार-बार skip सूचनाएं चाहते हों, तो `failureAlert.includeSkipped` सक्षम करें।

## डिलीवरी और आउटपुट

| मोड       | क्या होता है                                                        |
| ---------- | ------------------------------------------------------------------- |
| `announce` | यदि agent ने नहीं भेजा, तो अंतिम पाठ लक्ष्य तक फ़ॉलबैक-डिलीवर करता है |
| `webhook`  | समाप्त event पेलोड को URL पर POST करता है                                |
| `none`     | कोई runner फ़ॉलबैक डिलीवरी नहीं                                         |

चैनल डिलीवरी के लिए `--announce --channel telegram --to "-1001234567890"` का उपयोग करें। Telegram forum topics के लिए, `-1001234567890:topic:123` का उपयोग करें; OpenClaw Telegram-स्वामित्व वाला `-1001234567890:123` शॉर्टहैंड भी स्वीकार करता है। Direct RPC/config callers `delivery.threadId` को string या number के रूप में पास कर सकते हैं। Slack/Discord/Mattermost लक्ष्यों को स्पष्ट prefixes (`channel:<id>`, `user:<id>`) का उपयोग करना चाहिए। Matrix room IDs case-sensitive हैं; Matrix से सटीक room ID या `room:!room:server` रूप का उपयोग करें।

जब announce डिलीवरी `channel: "last"` का उपयोग करती है या `channel` छोड़ती है, तो `telegram:123` जैसा provider-prefixed लक्ष्य cron के session history या एकल कॉन्फ़िगर किए गए channel पर वापस जाने से पहले channel चुन सकता है। केवल loaded plugin द्वारा विज्ञापित prefixes provider selectors हैं। यदि `delivery.channel` स्पष्ट है, तो target prefix को वही provider नामित करना होगा; उदाहरण के लिए, `channel: "whatsapp"` के साथ `to: "telegram:123"` अस्वीकार किया जाता है, बजाय इसके कि WhatsApp Telegram ID को phone number के रूप में व्याख्यायित करे। `channel:<id>`, `user:<id>`, `imessage:<handle>`, और `sms:<number>` जैसे target-kind और service prefixes channel-स्वामित्व वाले target syntax बने रहते हैं, provider selectors नहीं।

आइसोलेटेड जॉब्स के लिए, चैट डिलीवरी साझा होती है। यदि चैट route उपलब्ध है, तो agent `message` tool का उपयोग कर सकता है, भले ही जॉब `--no-deliver` का उपयोग करे। यदि agent कॉन्फ़िगर किए गए/वर्तमान target को भेजता है, तो OpenClaw फ़ॉलबैक announce छोड़ देता है। अन्यथा `announce`, `webhook`, और `none` केवल यह नियंत्रित करते हैं कि agent turn के बाद runner अंतिम reply के साथ क्या करता है।

जब कोई agent सक्रिय चैट से आइसोलेटेड reminder बनाता है, तो OpenClaw फ़ॉलबैक announce route के लिए संरक्षित live delivery target संग्रहीत करता है। Internal session keys lowercase हो सकती हैं; वर्तमान चैट context उपलब्ध होने पर provider delivery targets उन keys से फिर से निर्मित नहीं किए जाते।

Implicit announce delivery पुराने targets को validate और reroute करने के लिए कॉन्फ़िगर की गई channel allowlists का उपयोग करती है। DM pairing-store approvals फ़ॉलबैक automation recipients नहीं हैं; जब कोई scheduled job DM को सक्रिय रूप से भेजनी चाहिए, तो `delivery.to` सेट करें या channel `allowFrom` entry कॉन्फ़िगर करें।

## आउटपुट भाषा

Cron जॉब्स channel, locale, या पिछले messages से reply भाषा का अनुमान नहीं लगातीं। भाषा नियम scheduled message या template में रखें:

```bash
openclaw cron edit <jobId> \
  --message "Summarize the updates. Respond in Chinese; keep URLs, code, and product names unchanged."
```

Template files के लिए, भाषा निर्देश rendered prompt में रखें और जॉब चलने से पहले सत्यापित करें कि `{{language}}` जैसे placeholders भरे गए हैं। यदि output भाषाएं मिलाता है, तो नियम स्पष्ट करें, उदाहरण के लिए: "Use Chinese for narrative text and keep technical terms in English."

Failure notifications एक अलग destination path का पालन करती हैं:

- `cron.failureDestination` failure notifications के लिए global default सेट करता है।
- `job.delivery.failureDestination` उसे प्रति जॉब ओवरराइड करता है।
- यदि कोई भी सेट नहीं है और जॉब पहले से `announce` के माध्यम से डिलीवर करती है, तो failure notifications अब उस primary announce target पर वापस जाती हैं।
- `delivery.failureDestination` केवल `sessionTarget="isolated"` जॉब्स पर समर्थित है, जब तक कि primary delivery mode `webhook` न हो।
- `failureAlert.includeSkipped: true` किसी जॉब या global cron alert policy को बार-बार skipped-run alerts में शामिल करता है। छोड़े गए रन अलग consecutive skip counter रखते हैं, इसलिए वे execution-error backoff को प्रभावित नहीं करते।

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

Gateway बाहरी triggers के लिए HTTP webhook endpoints उजागर कर सकता है। config में सक्षम करें:

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

हर request में header के माध्यम से hook token शामिल होना चाहिए:

- `Authorization: Bearer <token>` (अनुशंसित)
- `x-openclaw-token: <token>`

Query-string tokens अस्वीकार किए जाते हैं।

<AccordionGroup>
  <Accordion title="POST /hooks/wake">
    main session के लिए system event enqueue करें:

    ```bash
    curl -X POST http://127.0.0.1:18789/hooks/wake \
      -H 'Authorization: Bearer SECRET' \
      -H 'Content-Type: application/json' \
      -d '{"text":"New email received","mode":"now"}'
    ```

    <ParamField path="text" type="string" required>
      Event विवरण।
    </ParamField>
    <ParamField path="mode" type="string" default="now">
      `now` या `next-heartbeat`।
    </ParamField>

  </Accordion>
  <Accordion title="POST /hooks/agent">
    आइसोलेटेड agent turn चलाएं:

    ```bash
    curl -X POST http://127.0.0.1:18789/hooks/agent \
      -H 'Authorization: Bearer SECRET' \
      -H 'Content-Type: application/json' \
      -d '{"message":"Summarize inbox","name":"Email","model":"openai/gpt-5.4"}'
    ```

    फ़ील्ड्स: `message` (आवश्यक), `name`, `agentId`, `wakeMode`, `deliver`, `channel`, `to`, `model`, `fallbacks`, `thinking`, `timeoutSeconds`।

  </Accordion>
  <Accordion title="Mapped hooks (POST /hooks/<name>)">
    Custom hook names config में `hooks.mappings` के माध्यम से resolve किए जाते हैं। Mappings arbitrary payloads को templates या code transforms के साथ `wake` या `agent` actions में बदल सकती हैं।
  </Accordion>
</AccordionGroup>

<Warning>
Hook endpoints को loopback, tailnet, या trusted reverse proxy के पीछे रखें।

- समर्पित हुक टोकन का उपयोग करें; Gateway auth टोकन दोबारा उपयोग न करें।
- `hooks.path` को समर्पित सबपाथ पर रखें; `/` अस्वीकार किया जाता है।
- `hooks.allowedAgentIds` सेट करें ताकि सीमित किया जा सके कि हुक किस प्रभावी एजेंट को लक्ष्य कर सकता है, जिसमें `agentId` छोड़े जाने पर डिफ़ॉल्ट एजेंट भी शामिल है।
- जब तक आपको कॉलर-चुने हुए सेशन की आवश्यकता न हो, `hooks.allowRequestSessionKey=false` रखें।
- यदि आप `hooks.allowRequestSessionKey` सक्षम करते हैं, तो अनुमत सेशन-की आकारों को सीमित करने के लिए `hooks.allowedSessionKeyPrefixes` भी सेट करें।
- हुक पेलोड डिफ़ॉल्ट रूप से सुरक्षा सीमाओं के साथ रैप किए जाते हैं।

</Warning>

## Gmail PubSub इंटीग्रेशन

Google PubSub के ज़रिए Gmail इनबॉक्स ट्रिगर को OpenClaw से जोड़ें।

<Note>
**पूर्वापेक्षाएँ:** `gcloud` CLI, `gog` (gogcli), OpenClaw हुक सक्षम, सार्वजनिक HTTPS एंडपॉइंट के लिए Tailscale।
</Note>

### विज़र्ड सेटअप (अनुशंसित)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

यह `hooks.gmail` कॉन्फ़िग लिखता है, Gmail प्रीसेट सक्षम करता है, और पुश एंडपॉइंट के लिए Tailscale Funnel का उपयोग करता है।

### Gateway ऑटो-स्टार्ट

जब `hooks.enabled=true` हो और `hooks.gmail.account` सेट हो, तो Gateway बूट पर `gog gmail watch serve` शुरू करता है और वॉच को अपने-आप रिन्यू करता है। बाहर रहने के लिए `OPENCLAW_SKIP_GMAIL_WATCHER=1` सेट करें।

### मैनुअल वन-टाइम सेटअप

<Steps>
  <Step title="Select the GCP project">
    वह GCP प्रोजेक्ट चुनें जिसके पास `gog` द्वारा उपयोग किया गया OAuth क्लाइंट है:

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

`openclaw cron run <jobId>` मैनुअल रन को एनक्यू करने के बाद लौटता है। शटडाउन हुक, मेंटेनेंस स्क्रिप्ट, या ऐसी अन्य ऑटोमेशन के लिए `--wait` का उपयोग करें जिसे क्यू किए गए रन के समाप्त होने तक ब्लॉक करना ज़रूरी है। वेट मोड लौटाए गए सटीक `runId` को पोल करता है; यह `ok` स्थिति के लिए `0` और `error`, `skipped`, या वेट टाइमआउट के लिए नॉन-ज़ीरो के साथ बाहर निकलता है।

एजेंट `cron` टूल `cron(action: "list")` से संक्षिप्त जॉब सारांश (`id`, `name`, `enabled`, `nextRunAtMs`, `scheduleKind`, `lastRunStatus`) लौटाता है; एक पूर्ण जॉब परिभाषा के लिए `cron(action: "get", jobId: "...")` का उपयोग करें। सीधे Gateway कॉलर `cron.list` को `compact: true` पास कर सकते हैं; इसे छोड़ने पर डिलीवरी प्रीव्यू के साथ मौजूदा पूर्ण रिस्पॉन्स सुरक्षित रहता है।

`openclaw cron create`, `openclaw cron add` का alias है, और नए जॉब positional शेड्यूल (`"0 9 * * 1"`, `"every 1h"`, `"20m"`, या ISO timestamp) के बाद positional एजेंट प्रॉम्प्ट का उपयोग कर सकते हैं। समाप्त रन पेलोड को HTTP एंडपॉइंट पर POST करने के लिए `cron add|create` या `cron edit` पर `--webhook <url>` का उपयोग करें। Webhook डिलीवरी को `--announce`, `--channel`, `--to`, `--thread-id`, या `--account` जैसे चैट डिलीवरी फ़्लैग के साथ जोड़ा नहीं जा सकता। `cron edit` पर, `--clear-channel`, `--clear-to`, `--clear-thread-id`, और `--clear-account` उन रूटिंग फ़ील्ड को अलग-अलग अनसेट करते हैं (हर एक अपने मिलते-जुलते सेट फ़्लैग के साथ अस्वीकार किया जाता है), जो `--no-deliver` द्वारा रनर फॉलबैक डिलीवरी अक्षम करने से अलग है।

<Note>
मॉडल ओवरराइड नोट:

- `openclaw cron add|edit --model ...` जॉब का चुना हुआ मॉडल बदलता है।
- यदि मॉडल अनुमत है, तो वही सटीक provider/model isolated एजेंट रन तक पहुंचता है।
- यदि यह अनुमत नहीं है या रिज़ॉल्व नहीं किया जा सकता, तो Cron स्पष्ट वैलिडेशन त्रुटि के साथ रन को विफल करता है।
- API `cron.update` पेलोड पैच संग्रहित जॉब मॉडल ओवरराइड साफ़ करने के लिए `model: null` सेट कर सकते हैं।
- `openclaw cron edit <job-id> --clear-model` CLI से वह ओवरराइड साफ़ करता है (`model: null` पैच जैसा ही प्रभाव) और इसे `--model` के साथ जोड़ा नहीं जा सकता।
- कॉन्फ़िगर की गई फॉलबैक चेन अब भी लागू होती हैं क्योंकि Cron `--model` जॉब प्राइमरी है, सेशन `/model` ओवरराइड नहीं।
- `openclaw cron add|edit --fallbacks ...` पेलोड `fallbacks` सेट करता है, जिससे उस जॉब के लिए कॉन्फ़िगर किए गए फॉलबैक बदल जाते हैं; `--fallbacks ""` फॉलबैक अक्षम करता है और रन को strict बनाता है। `openclaw cron edit <job-id> --clear-fallbacks` प्रति-जॉब ओवरराइड साफ़ करता है।
- बिना स्पष्ट या कॉन्फ़िगर की गई फॉलबैक सूची वाला साधारण `--model`, silent अतिरिक्त retry target के रूप में एजेंट प्राइमरी पर fall through नहीं करता।

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

`maxConcurrentRuns` शेड्यूल किए गए Cron dispatch और isolated एजेंट-turn execution दोनों को सीमित करता है, और डिफ़ॉल्ट 8 है। Isolated Cron एजेंट turns आंतरिक रूप से queue की समर्पित `cron-nested` execution lane का उपयोग करते हैं, इसलिए इस मान को बढ़ाने से स्वतंत्र Cron LLM runs केवल अपने outer Cron wrappers शुरू करने के बजाय समानांतर रूप से आगे बढ़ सकते हैं। साझा non-Cron `nested` lane इस सेटिंग से widened नहीं होती।

`cron.store` एक logical store key और legacy doctor import path है। मौजूदा JSON stores को SQLite में import और archive करने के लिए `openclaw doctor --fix` चलाएं; भविष्य के Cron बदलाव CLI या Gateway API से होने चाहिए।

Cron अक्षम करें: `cron.enabled: false` या `OPENCLAW_SKIP_CRON=1`।

<AccordionGroup>
  <Accordion title="Retry behavior">
    **वन-शॉट retry**: transient त्रुटियां (rate limit, overload, network, server error) exponential backoff के साथ 3 बार तक retry करती हैं। permanent त्रुटियां तुरंत अक्षम कर देती हैं।

    **Recurring retry**: retries के बीच exponential backoff (30s से 60m)। अगला सफल रन होने के बाद backoff reset हो जाता है।

  </Accordion>
  <Accordion title="Maintenance">
    `cron.sessionRetention` (डिफ़ॉल्ट `24h`) isolated run-session entries को prune करता है। `cron.runLog.keepLines` प्रति जॉब retained SQLite run-history rows को सीमित करता है; पुराने file-backed run logs के साथ config compatibility के लिए `maxBytes` रखा गया है।
  </Accordion>
</AccordionGroup>

## समस्या निवारण

### कमांड लैडर

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
    - `cron.enabled` और `OPENCLAW_SKIP_CRON` env var जांचें।
    - पुष्टि करें कि Gateway लगातार चल रहा है।
    - `cron` शेड्यूल के लिए, timezone (`--tz`) बनाम host timezone सत्यापित करें।
    - run output में `reason: not-due` का अर्थ है कि manual run को `openclaw cron run <jobId> --due` के साथ जांचा गया था और जॉब अभी due नहीं था।

  </Accordion>
  <Accordion title="Cron fired but no delivery">
    - डिलीवरी मोड `none` का अर्थ है कि कोई runner fallback send अपेक्षित नहीं है। चैट route उपलब्ध होने पर एजेंट अब भी `message` tool से सीधे भेज सकता है।
    - डिलीवरी target missing/invalid (`channel`/`to`) का अर्थ है कि outbound skip किया गया।
    - Matrix के लिए, lowercased `delivery.to` room IDs वाले copied या legacy jobs विफल हो सकते हैं क्योंकि Matrix room IDs case-sensitive होते हैं। जॉब को Matrix से मिले सटीक `!room:server` या `room:!room:server` value पर edit करें।
    - Channel auth errors (`unauthorized`, `Forbidden`) का अर्थ है कि delivery credentials द्वारा blocked थी।
    - यदि isolated run केवल silent token (`NO_REPLY` / `no_reply`) लौटाता है, तो OpenClaw direct outbound delivery को suppress करता है और fallback queued summary path को भी suppress करता है, इसलिए chat पर कुछ भी post नहीं होता।
    - यदि एजेंट को user को स्वयं message करना चाहिए, तो जांचें कि जॉब के पास usable route है (`channel: "last"` with previous chat, या explicit channel/target)।

  </Accordion>
  <Accordion title="Cron or heartbeat appears to prevent /new-style rollover">
    - Daily और idle reset freshness `updatedAt` पर आधारित नहीं है; [Session management](/hi/concepts/session#session-lifecycle) देखें।
    - Cron wakeups, Heartbeat runs, exec notifications, और Gateway bookkeeping routing/status के लिए session row update कर सकते हैं, लेकिन वे `sessionStartedAt` या `lastInteractionAt` को extend नहीं करते।
    - उन legacy rows के लिए जो इन fields के मौजूद होने से पहले बनाई गई थीं, जब file अब भी उपलब्ध हो तो OpenClaw transcript JSONL session header से `sessionStartedAt` recover कर सकता है। `lastInteractionAt` के बिना legacy idle rows उस recovered start time को अपने idle baseline के रूप में उपयोग करती हैं।

  </Accordion>
  <Accordion title="Timezone gotchas">
    - `--tz` के बिना Cron gateway host timezone का उपयोग करता है।
    - timezone के बिना `at` schedules को UTC माना जाता है।
    - Heartbeat `activeHours` configured timezone resolution का उपयोग करता है।

  </Accordion>
</AccordionGroup>

## संबंधित

- [Automation](/hi/automation) — सभी ऑटोमेशन mechanisms एक नज़र में
- [Background Tasks](/hi/automation/tasks) — Cron executions के लिए task ledger
- [Heartbeat](/hi/gateway/heartbeat) — periodic main-session turns
- [Timezone](/hi/concepts/timezone) — timezone configuration
