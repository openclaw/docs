---
read_when:
    - बैकग्राउंड exec व्यवहार जोड़ना या संशोधित करना
    - लंबे समय तक चलने वाले exec कार्यों की डिबगिंग
summary: पृष्ठभूमि exec निष्पादन और प्रक्रिया प्रबंधन
title: पृष्ठभूमि निष्पादन और प्रक्रिया उपकरण
x-i18n:
    generated_at: "2026-06-28T23:05:13Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5822c1e26b0144c5216ae6e59e279ccc506cf4c0a42b8cd6c386f535fe458bd3
    source_path: gateway/background-process.md
    workflow: 16
---

OpenClaw `exec` टूल के माध्यम से शेल कमांड चलाता है और लंबे समय तक चलने वाले कार्यों को मेमरी में रखता है। `process` टूल उन पृष्ठभूमि सत्रों को प्रबंधित करता है।

## exec टूल

मुख्य पैरामीटर:

- `command` (आवश्यक)
- `yieldMs` (डिफ़ॉल्ट 10000): इस विलंब के बाद अपने-आप पृष्ठभूमि में चला जाता है
- `background` (bool): तुरंत पृष्ठभूमि में चलाएं
- `timeout` (सेकंड, डिफ़ॉल्ट `tools.exec.timeoutSec`): इस टाइमआउट के बाद प्रक्रिया को समाप्त करें; केवल उस कॉल के लिए exec प्रक्रिया टाइमआउट अक्षम करने हेतु `timeout: 0` सेट करें
- `elevated` (bool): यदि elevated मोड सक्षम/अनुमत है, तो sandbox के बाहर चलाएं (डिफ़ॉल्ट रूप से `gateway`, या जब exec लक्ष्य `node` हो तो `node`)
- वास्तविक TTY चाहिए? `pty: true` सेट करें।
- `workdir`, `env`

व्यवहार:

- अग्रभूमि में चलने वाली प्रक्रियाएं सीधे आउटपुट लौटाती हैं।
- पृष्ठभूमि में जाने पर (स्पष्ट रूप से या टाइमआउट से), टूल `status: "running"` + `sessionId` और एक छोटा tail लौटाता है।
- पृष्ठभूमि और `yieldMs` रन `tools.exec.timeoutSec` विरासत में लेते हैं, जब तक कॉल स्पष्ट `timeout` प्रदान नहीं करती।
- आउटपुट सत्र के पोल या साफ़ किए जाने तक मेमरी में रखा जाता है।
- यदि `process` टूल अनुमत नहीं है, तो `exec` समकालिक रूप से चलता है और `yieldMs`/`background` को अनदेखा करता है।
- Spawn किए गए exec कमांड context-aware शेल/profile नियमों के लिए `OPENCLAW_SHELL=exec` प्राप्त करते हैं।
- लंबे समय तक चलने वाले ऐसे काम के लिए जो अभी शुरू होता है, उसे एक बार शुरू करें और सक्षम होने पर automatic
  completion wake पर भरोसा करें, जब कमांड आउटपुट देता है या विफल होता है।
- यदि automatic completion wake उपलब्ध नहीं है, या आपको ऐसे कमांड के लिए quiet-success
  पुष्टि चाहिए जो बिना आउटपुट के साफ़ तौर पर समाप्त हुआ, तो पूर्णता की पुष्टि के लिए `process`
  का उपयोग करें।
- reminders या विलंबित follow-ups को `sleep` loops या बार-बार
  polling से emulate न करें; भविष्य के काम के लिए cron का उपयोग करें।

## चाइल्ड प्रोसेस ब्रिजिंग

exec/process टूल्स के बाहर लंबे समय तक चलने वाली child processes spawn करते समय (उदाहरण के लिए, CLI respawns या gateway helpers), child-process bridge helper जोड़ें ताकि termination signals forward किए जाएं और exit/error पर listeners अलग किए जाएं। इससे systemd पर orphaned processes से बचाव होता है और shutdown व्यवहार platforms में सुसंगत रहता है।

Environment overrides:

- `OPENCLAW_BASH_YIELD_MS`: डिफ़ॉल्ट yield (ms)
- `OPENCLAW_BASH_MAX_OUTPUT_CHARS`: in-memory output cap (chars)
- `OPENCLAW_BASH_PENDING_MAX_OUTPUT_CHARS`: प्रति stream pending stdout/stderr cap (chars)
- `OPENCLAW_BASH_JOB_TTL_MS`: finished sessions के लिए TTL (ms, 1m–3h तक bounded)
- `OPENCLAW_PROCESS_INPUT_WAIT_IDLE_MS`: writable background sessions को संभवतः input की प्रतीक्षा में चिह्नित करने से पहले idle-output threshold (डिफ़ॉल्ट 15000 ms)

Config (preferred):

- `tools.exec.backgroundMs` (डिफ़ॉल्ट 10000)
- `tools.exec.timeoutSec` (डिफ़ॉल्ट 1800)
- `tools.exec.cleanupMs` (डिफ़ॉल्ट 1800000)
- `tools.exec.notifyOnExit` (डिफ़ॉल्ट true): जब backgrounded exec exit करता है, तो system event enqueue करें + Heartbeat request करें।
- `tools.exec.notifyOnExitEmptySuccess` (डिफ़ॉल्ट false): true होने पर, उन successful backgrounded runs के लिए भी completion events enqueue करें जिन्होंने कोई output नहीं बनाया।

## process टूल

क्रियाएं:

- `list`: running + finished sessions
- `poll`: किसी session के लिए नया output drain करें (exit status भी report करता है)
- `log`: aggregated output पढ़ें और input recovery hints दिखाएं (`offset` + `limit` समर्थित)
- `write`: stdin भेजें (`data`, वैकल्पिक `eof`)
- `send-keys`: PTY-backed session को explicit key tokens या bytes भेजें
- `submit`: PTY-backed session को Enter / carriage return भेजें
- `paste`: literal text भेजें, वैकल्पिक रूप से bracketed paste mode में wrapped
- `kill`: background session समाप्त करें
- `clear`: finished session को मेमरी से हटाएं
- `remove`: running हो तो kill करें, अन्यथा finished हो तो clear करें

नोट्स:

- केवल backgrounded sessions मेमरी में listed/persisted होते हैं।
- process restart पर sessions खो जाते हैं (disk persistence नहीं)।
- Session logs केवल तब chat history में save होते हैं जब आप `process poll/log` चलाते हैं और tool result record होता है।
- `process` प्रति agent scoped है; यह केवल उस agent द्वारा शुरू किए गए sessions देखता है।
- automatic completion wake अनुपलब्ध होने पर status, logs, quiet-success confirmation, या
  completion confirmation के लिए `poll` / `log` का उपयोग करें।
- interactive CLI recover करने से पहले `log` का उपयोग करें ताकि वर्तमान transcript,
  stdin state, और input-wait hint साथ में दिखाई दें।
- जब आपको input या intervention की आवश्यकता हो, तो `write` / `send-keys` / `submit` / `paste` / `kill` का उपयोग करें।
- `process list` quick scans के लिए derived `name` (command verb + target) शामिल करता है।
- `process list`, `poll`, और `log` `waitingForInput` केवल तब report करते हैं
  जब session में अभी भी writable stdin हो और वह input-wait threshold से अधिक समय तक idle रहा हो।
- `process log` line-based `offset`/`limit` का उपयोग करता है।
- जब `offset` और `limit` दोनों छोड़े जाते हैं, तो यह अंतिम 200 lines लौटाता है और paging hint शामिल करता है।
- जब `offset` दिया जाता है और `limit` छोड़ा जाता है, तो यह `offset` से अंत तक लौटाता है (200 तक capped नहीं)।
- Polling on-demand status के लिए है, wait-loop scheduling के लिए नहीं। यदि काम बाद में होना चाहिए,
  तो इसके बजाय cron का उपयोग करें।

## उदाहरण

लंबा task चलाएं और बाद में poll करें:

```json
{ "tool": "exec", "command": "sleep 5 && echo done", "yieldMs": 1000 }
```

```json
{ "tool": "process", "action": "poll", "sessionId": "<id>" }
```

input भेजने से पहले interactive session inspect करें:

```json
{ "tool": "process", "action": "log", "sessionId": "<id>" }
```

तुरंत पृष्ठभूमि में शुरू करें:

```json
{ "tool": "exec", "command": "npm run build", "background": true }
```

stdin भेजें:

```json
{ "tool": "process", "action": "write", "sessionId": "<id>", "data": "y\n" }
```

PTY keys भेजें:

```json
{ "tool": "process", "action": "send-keys", "sessionId": "<id>", "keys": ["C-c"] }
```

वर्तमान line submit करें:

```json
{ "tool": "process", "action": "submit", "sessionId": "<id>" }
```

literal text paste करें:

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## संबंधित

- [Exec टूल](/hi/tools/exec)
- [Exec approvals](/hi/tools/exec-approvals)
