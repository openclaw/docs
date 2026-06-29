---
read_when:
    - आप किसी बाहरी सिस्टम से TaskFlows को ट्रिगर या संचालित करना चाहते हैं
    - आप बंडल किए गए webhooks Plugin को कॉन्फ़िगर कर रहे हैं
summary: 'Webhooks Plugin: विश्वसनीय बाहरी ऑटोमेशन के लिए प्रमाणित TaskFlow ingress'
title: Webhooks Plugin
x-i18n:
    generated_at: "2026-06-28T23:55:06Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9d21d96f680fa24d4a53c1ed5759f800d3cfdc3336789c42c15266edd8ce9e80
    source_path: plugins/webhooks.md
    workflow: 16
---

Webhooks Plugin प्रमाणीकृत HTTP routes जोड़ता है जो बाहरी
automation को OpenClaw TaskFlows से bind करते हैं।

इसे तब उपयोग करें जब आप Zapier, n8n, CI job, या किसी
internal service जैसी trusted system से managed TaskFlows बनवाना और चलवाना चाहते हों, बिना पहले custom
Plugin लिखे।

## यह कहाँ चलता है

Webhooks Plugin Gateway process के अंदर चलता है।

यदि आपका Gateway किसी दूसरी machine पर चलता है, तो Plugin को उस
Gateway host पर install और configure करें, फिर Gateway को restart करें।

## routes configure करें

`plugins.entries.webhooks.config` के अंतर्गत config सेट करें:

```json5
{
  plugins: {
    entries: {
      webhooks: {
        enabled: true,
        config: {
          routes: {
            zapier: {
              path: "/plugins/webhooks/zapier",
              sessionKey: "agent:main:main",
              secret: {
                source: "env",
                provider: "default",
                id: "OPENCLAW_WEBHOOK_SECRET",
              },
              controllerId: "webhooks/zapier",
              description: "Zapier TaskFlow bridge",
            },
          },
        },
      },
    },
  },
}
```

Route fields:

- `enabled`: वैकल्पिक, default `true` है
- `path`: वैकल्पिक, default `/plugins/webhooks/<routeId>` है
- `sessionKey`: आवश्यक session जो bound TaskFlows का owner होता है
- `secret`: आवश्यक shared secret या SecretRef
- `controllerId`: बनाए गए managed flows के लिए वैकल्पिक controller id
- `description`: वैकल्पिक operator note

Supported `secret` inputs:

- Plain string
- SecretRef जिसमें `source: "env" | "file" | "exec"` हो

यदि secret-backed route startup पर अपना secret resolve नहीं कर पाता, तो Plugin
broken endpoint expose करने के बजाय उस route को skip करता है और warning log करता है।

## Security model

हर route को अपने configured
`sessionKey` की TaskFlow authority के साथ act करने के लिए trusted माना जाता है।

इसका अर्थ है कि route उस session के owned TaskFlows को inspect और mutate कर सकता है, इसलिए
आपको चाहिए:

- प्रति route strong unique secret उपयोग करें
- inline plaintext secrets के बजाय secret references को प्राथमिकता दें
- routes को workflow के लिए उपयुक्त सबसे narrow session से bind करें
- केवल वही specific Webhook path expose करें जिसकी आपको जरूरत है

Plugin लागू करता है:

- Shared-secret authentication
- Request body size और timeout guards
- Fixed-window rate limiting
- In-flight request limiting
- `api.runtime.tasks.managedFlows.bindSession(...)` के माध्यम से owner-bound TaskFlow access

## Request format

इनके साथ `POST` requests भेजें:

- `Content-Type: application/json`
- `Authorization: Bearer <secret>` या `x-openclaw-webhook-secret: <secret>`

Example:

```bash
curl -X POST https://gateway.example.com/plugins/webhooks/zapier \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_SHARED_SECRET' \
  -d '{"action":"create_flow","goal":"Review inbound queue"}'
```

## Supported actions

Plugin वर्तमान में ये JSON `action` values स्वीकार करता है:

- `create_flow`
- `get_flow`
- `list_flows`
- `find_latest_flow`
- `resolve_flow`
- `get_task_summary`
- `set_waiting`
- `resume_flow`
- `finish_flow`
- `fail_flow`
- `request_cancel`
- `cancel_flow`
- `run_task`

### `create_flow`

Route के bound session के लिए managed TaskFlow बनाता है।

Example:

```json
{
  "action": "create_flow",
  "goal": "Review inbound queue",
  "status": "queued",
  "notifyPolicy": "done_only"
}
```

### `run_task`

मौजूदा managed TaskFlow के अंदर managed child task बनाता है।

Allowed runtimes हैं:

- `subagent`
- `acp`

Example:

```json
{
  "action": "run_task",
  "flowId": "flow_123",
  "runtime": "acp",
  "childSessionKey": "agent:main:acp:worker",
  "task": "Inspect the next message batch"
}
```

## Response shape

Successful responses return:

```json
{
  "ok": true,
  "routeId": "zapier",
  "result": {}
}
```

Rejected requests return:

```json
{
  "ok": false,
  "routeId": "zapier",
  "code": "not_found",
  "error": "TaskFlow not found.",
  "result": {}
}
```

Plugin जानबूझकर Webhook responses से owner/session metadata scrub करता है।

## संबंधित docs

- [Plugin runtime SDK](/hi/plugins/sdk-runtime)
- [Hooks और webhooks overview](/hi/automation/hooks)
- [CLI webhooks](/hi/cli/webhooks)
