---
read_when:
    - आप टर्मिनल से संग्रहीत ट्रांसक्रिप्ट सारांश पढ़ना चाहते हैं
    - आपको प्रतिलेखों के Markdown सारांश का पथ चाहिए
    - आप मुख्य प्रतिलेख संग्रहण लेआउट को डीबग कर रहे हैं
summary: '`openclaw transcripts` के लिए CLI संदर्भ (संग्रहीत ट्रांसक्रिप्ट की सूची बनाना, दिखाना और उनका स्थान पता लगाना)'
title: प्रतिलेख CLI
x-i18n:
    generated_at: "2026-06-28T22:54:10Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ae6010cfb4e051182f1c48d0d728b30d054542e1e7983ff15a2432840193f9c0
    source_path: cli/transcripts.md
    workflow: 16
---

# `openclaw transcripts`

OpenClaw के core `transcripts` tool द्वारा लिखे गए transcripts का निरीक्षण करें। यह CLI
केवल-पढ़ने योग्य है; capture, import, और summarization agent tool और
कॉन्फ़िगर किए गए auto-start sources के स्वामित्व में हैं।

CLI का उपयोग तब करें जब आप कल के notes ढूंढना चाहते हों, Markdown file को
किसी editor में खोलना चाहते हों, किसी transcript को दूसरे tool में देना चाहते हों, या debug करना चाहते हों कि कोई session
disk पर कहाँ रखा गया। यह capture शुरू या बंद नहीं करता।

Artifacts OpenClaw state directory के अंतर्गत रहते हैं:

```text
$OPENCLAW_STATE_DIR/transcripts/YYYY-MM-DD/<session>/
  metadata.json
  transcript.jsonl
  summary.json
  summary.md
```

Default state directory `~/.openclaw` है; अलग directory उपयोग करने के लिए `OPENCLAW_STATE_DIR` set करें।
date directory session start time से आती है, और
session directory session id से निकला हुआ एक सुरक्षित filesystem segment है।

## Commands

```bash
openclaw transcripts list
openclaw transcripts show <session>
openclaw transcripts show YYYY-MM-DD/<session>
openclaw transcripts path <session>
openclaw transcripts path YYYY-MM-DD/<session>
openclaw transcripts path <session> --dir
openclaw transcripts path <session> --metadata
openclaw transcripts path <session> --transcript
openclaw transcripts list --json
openclaw transcripts show <session> --json
openclaw transcripts path <session> --json
```

- `list`: stored sessions, date-qualified selector, start time, title, और `summary.md` path सूचीबद्ध करें।
- `show <session>`: stored `summary.md` print करें।
- `path <session>`: `summary.md` path print करें।
- `path <session> --dir`: session directory print करें।
- `path <session> --metadata`: `metadata.json` print करें।
- `path <session> --transcript`: `transcript.jsonl` print करें।
- `--json`: machine-readable output print करें।

जब कोई human session id कई दिनों में दोहराया जाता है, तो `list` से date-qualified selector का उपयोग करें,
उदाहरण के लिए `openclaw transcripts show 2026-05-22/standup`।
Default session ids में timestamp और random suffix शामिल होते हैं; fixed
session ids केवल तब configure करें जब वे दिन के भीतर unique हों।

## Output

`list` प्रति line एक session print करता है:

```text
2026-05-22/standup  2026-05-22T09:00:00.000Z  Weekly standup  /Users/alex/.openclaw/transcripts/2026-05-22/standup/summary.md
```

Output tab-separated है। Columns selector, start time, title, और
summary path हैं। Selector `show` या `path` को वापस pass करने के लिए सबसे सुरक्षित value है।

`list --json` इनके साथ objects print करता है:

- `sessionId`
- `selector`
- `date`
- `title`
- `startedAt`
- `stoppedAt`
- `source`
- `path`
- `summaryPath`
- `hasSummary`

`show --json` stored session metadata, selector, session directory,
summary path, और summary Markdown text लौटाता है। `path --json` selected path
और यह कि वह file मौजूद है या नहीं, लौटाता है।

## दिन में कई meetings

Transcripts sessions को date के अनुसार, फिर session id के अनुसार group करता है। एक
दिन में दस meetings दस sibling folders बन जाती हैं:

```text
~/.openclaw/transcripts/2026-05-22/
  transcript-2026-05-22T09-00-00-000Z-a1b2c3d4/
  transcript-2026-05-22T10-30-00-000Z-b2c3d4e5/
  standup/
```

अधिकांश automation के लिए default generated ids का उपयोग करें। `standup` जैसा fixed id
केवल तब उपयोग करें जब वही id उसी date पर दो बार उपयोग नहीं होगा।

## Missing summaries

Live sessions session बंद होने पर `summary.md` लिखते हैं। Imported transcripts
import के तुरंत बाद `summary.md` लिखते हैं। कोई session अभी भी
`list` में summary के बिना दिखाई दे सकता है जब capture active हो, stop के दौरान provider fail हुआ हो,
या किसी भी utterances के आने से पहले metadata लिखा गया हो।

append-only transcript का निरीक्षण करने के लिए `path <session> --transcript` का उपयोग करें, और
Markdown summary दोबारा generate करने के लिए `transcripts` tool action `summarize` का उपयोग करें।

## Configuration

Transcript capture opt-in है क्योंकि live sources meeting
audio में शामिल होकर उसे record कर सकते हैं। Top-level `transcripts.enabled` के साथ tool enable करें:

```json
{
  "transcripts": {
    "enabled": true,
    "maxUtterances": 2000
  }
}
```

`openclaw.json` में `transcripts.autoStart` के साथ auto-start sources configure करें।
हर entry मौजूद होने से enabled होती है; किसी source को disable करने के लिए उसकी entry छोड़ दें।

```json
{
  "transcripts": {
    "enabled": true,
    "autoStart": [
      {
        "providerId": "discord-voice",
        "guildId": "1234567890",
        "channelId": "2345678901"
      },
      {
        "providerId": "slack-huddle",
        "accountId": "workspace",
        "channelId": "C123"
      }
    ]
  }
}
```
