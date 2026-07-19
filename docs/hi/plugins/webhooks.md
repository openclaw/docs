---
read_when:
    - आप किसी बाहरी सिस्टम से TaskFlows को ट्रिगर या संचालित करना चाहते हैं
    - आप बंडल किए गए webhooks Plugin को कॉन्फ़िगर कर रहे हैं
summary: 'Webhooks Plugin: विश्वसनीय बाहरी ऑटोमेशन के लिए प्रमाणीकृत TaskFlow इनग्रेस'
title: Webhooks Plugin
x-i18n:
    generated_at: "2026-07-19T09:26:00Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 77e455450d6183635c76a1e8002feeb287deb4ff242dbd555ef9d0f2b21ce5f6
    source_path: plugins/webhooks.md
    workflow: 16
---

Webhooks Plugin प्रमाणित HTTP रूट जोड़ता है, ताकि कोई विश्वसनीय बाहरी
सिस्टम (Zapier, n8n, कोई CI जॉब, कोई आंतरिक सेवा) कस्टम Plugin लिखे बिना
HTTP के माध्यम से प्रबंधित OpenClaw TaskFlows बना और संचालित कर सके।

Plugin Gateway प्रक्रिया के भीतर चलता है। किसी दूरस्थ Gateway के लिए, इसे
उस होस्ट पर इंस्टॉल और कॉन्फ़िगर करें, फिर Gateway पुनः आरंभ करें। यह बिना किसी
कॉन्फ़िगर किए गए रूट के आता है, इसलिए कम-से-कम एक रूट जोड़ने तक यह कोई कार्य नहीं करता।

## रूट कॉन्फ़िगर करें

`plugins.entries.webhooks.config` के अंतर्गत कॉन्फ़िग सेट करें:

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

रूट फ़ील्ड:

| फ़ील्ड          | आवश्यक | डिफ़ॉल्ट                       | टिप्पणियाँ                                         |
| -------------- | -------- | ----------------------------- | --------------------------------------------- |
| `enabled`      | नहीं       | `true`                        |                                               |
| `path`         | नहीं       | `/plugins/webhooks/<routeId>` | सभी रूट में अद्वितीय होना चाहिए।                 |
| `sessionKey`   | हाँ      | -                             | वह सत्र, जिसके पास संबद्ध TaskFlows का स्वामित्व है।        |
| `secret`       | हाँ      | -                             | सामान्य स्ट्रिंग या SecretRef (नीचे)।          |
| `controllerId` | नहीं       | `webhooks/<routeId>`          | डिफ़ॉल्ट `create_flow` नियंत्रक के रूप में उपयोग किया जाता है। |
| `description`  | नहीं       | -                             | केवल ऑपरेटर टिप्पणी।                           |

`secret` सामान्य स्ट्रिंग या SecretRef स्वीकार करता है: `{ source: "env" | "file" | "exec", provider: "default", id: "..." }`।

SecretRefs का समाधान Gateway के स्टार्टअप कॉन्फ़िग स्नैपशॉट में किया जाता है। जब किसी रूट का
सीक्रेट हल नहीं हो पाता, तब Gateway चलता रहता है और वही रूट
पंजीकृत लेकिन निष्क्रिय रहता है: अनुरोधों को एक सामान्य प्रमाणीकरण विफलता (`401`) मिलती है।
अन्य रूट उपलब्ध रहते हैं। SecretRef स्रोत ठीक करें, फिर नया स्नैपशॉट
सक्रिय करने के लिए Gateway को पुनः लोड या पुनः आरंभ करें। सार्वजनिक अनुरोध पथ पर
SecretRef मानों का समाधान कभी नहीं किया जाता।

## सुरक्षा मॉडल

हर रूट अपने कॉन्फ़िगर किए गए `sessionKey` के TaskFlow प्राधिकार के साथ कार्य करता है: वह
उस सत्र के स्वामित्व वाले किसी भी TaskFlow का निरीक्षण और परिवर्तन कर सकता है। TaskFlow अभिगम
हमेशा `api.runtime.tasks.managedFlows.bindSession(...)` के माध्यम से होता है, इसलिए कोई
रूट अपने संबद्ध सत्र के बाहर कभी कार्य नहीं कर सकता। प्रभाव-क्षेत्र सीमित करने के लिए:

- हर रूट के लिए एक मज़बूत, अद्वितीय सीक्रेट उपयोग करें।
- इनलाइन सामान्य-पाठ सीक्रेट के बजाय SecretRef को प्राथमिकता दें।
- रूट को कार्यप्रवाह के अनुकूल सबसे सीमित सत्र से संबद्ध करें।
- केवल वही विशिष्ट Webhook पथ उजागर करें जिसकी आपको आवश्यकता है।

हर पथ के लिए अनुरोध प्रबंधन का क्रम: HTTP विधि (केवल `POST`) और
`Content-Type: application/json` जाँच, फिर निश्चित-विंडो दर सीमा (प्रति पथ+क्लाइंट-IP कुंजी प्रति
60-सेकंड विंडो में 120 अनुरोध, अधिकतम 4,096 ट्रैक की गई
कुंजियाँ), फिर प्रगति पर मौजूद अनुरोधों की सीमा (प्रति कुंजी 8 समवर्ती अनुरोध, अधिकतम
4,096 ट्रैक की गई कुंजियाँ), फिर साझा-सीक्रेट प्रमाणीकरण, और फिर 256 KB /
15-सेकंड JSON बॉडी पठन। जो अनुरोध किसी आरंभिक जाँच में विफल होते हैं, वे
बाद की जाँचों तक कभी नहीं पहुँचते।

## अनुरोध प्रारूप

`Content-Type: application/json` और `Authorization: Bearer <secret>` या `x-openclaw-webhook-secret: <secret>` में से किसी एक के साथ
`POST` अनुरोध भेजें:

```bash
curl -X POST https://gateway.example.com/plugins/webhooks/zapier \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_SHARED_SECRET' \
  -d '{"action":"create_flow","goal":"इनबाउंड कतार की समीक्षा करें"}'
```

## समर्थित क्रियाएँ

| क्रिया             | उद्देश्य                                                            |
| ------------------ | ------------------------------------------------------------------ |
| `create_flow`      | रूट के सत्र के लिए प्रबंधित TaskFlow बनाएँ।                 |
| `get_flow`         | आईडी द्वारा एक TaskFlow प्राप्त करें।                                          |
| `list_flows`       | रूट के सत्र के TaskFlows सूचीबद्ध करें।                            |
| `find_latest_flow` | सबसे हाल में अपडेट किया गया TaskFlow प्राप्त करें।                          |
| `resolve_flow`     | अपारदर्शी टोकन द्वारा TaskFlow का समाधान करें।                                |
| `get_task_summary` | किसी TaskFlow के लिए कार्य सारांश प्राप्त करें।                             |
| `set_waiting`      | वैकल्पिक स्थिति/प्रतीक्षा डेटा के साथ TaskFlow को प्रतीक्षारत चिह्नित करें।            |
| `resume_flow`      | प्रतीक्षारत/अवरुद्ध TaskFlow पुनः शुरू करें।                                 |
| `finish_flow`      | TaskFlow को समाप्त चिह्नित करें।                                          |
| `fail_flow`        | TaskFlow को विफल चिह्नित करें।                                            |
| `request_cancel`   | सहयोगात्मक रद्दीकरण का अनुरोध करें।                                  |
| `cancel_flow`      | TaskFlow रद्द करें (यदि चाइल्ड अभी भी सक्रिय हैं, तो `202` लौट सकता है)। |
| `run_task`         | किसी मौजूदा TaskFlow के भीतर प्रबंधित चाइल्ड कार्य बनाएँ।           |

परिवर्तनकारी क्रियाओं (`set_waiting`, `resume_flow`, `finish_flow`, `fail_flow`,
`request_cancel`) को आशावादी समवर्ती नियंत्रण के लिए `flowId` और
`expectedRevision` की आवश्यकता होती है; पुराना संशोधन `409 revision_conflict` लौटाता है।

### `create_flow`

```json
{
  "action": "create_flow",
  "goal": "इनबाउंड कतार की समीक्षा करें",
  "status": "queued",
  "notifyPolicy": "done_only"
}
```

### `run_task`

अनुमत `runtime` मान: `subagent`, `acp`। `startedAt`, `lastEventAt`, और
`progressSummary` केवल तभी मान्य हैं जब `status`, `"running"` हो; इन्हें
किसी अन्य स्थिति के साथ भेजने पर `400 invalid_request` लौटता है।

```json
{
  "action": "run_task",
  "flowId": "flow_123",
  "runtime": "acp",
  "childSessionKey": "agent:main:acp:worker",
  "task": "अगले संदेश बैच का निरीक्षण करें"
}
```

## प्रतिक्रिया संरचना

```json
{
  "ok": true,
  "routeId": "zapier",
  "result": {}
}
```

```json
{
  "ok": false,
  "routeId": "zapier",
  "code": "not_found",
  "error": "TaskFlow नहीं मिला।",
  "result": {}
}
```

प्रवाह और कार्य दृश्य में कभी भी स्वामी/सत्र मेटाडेटा शामिल नहीं होता, इसलिए प्रतिक्रियाएँ
रूट के संबद्ध `sessionKey` को उजागर नहीं कर सकतीं। `code` मानों में `not_found`,
`not_managed`, `revision_conflict`, `persist_failed`, `cancel_requested`,
`cancel_pending`, `terminal`, `invalid_request`, `request_rejected`, और
क्रिया-विशिष्ट फ़ॉलबैक कोड (`mutation_rejected`, `create_rejected`,
`task_not_created`, `cancel_rejected`) शामिल हैं, जब किसी परिवर्तन को ऐसे
कारण से अस्वीकार किया जाता है जिसे ऊपर दिए गए नामित कोड कवर नहीं करते।

## संबंधित

- [हुक](/hi/automation/hooks) - आंतरिक घटना-संचालित हुक बनाम यह HTTP-आधारित TaskFlow ब्रिज
- [Gateway Webhooks (`hooks.*` कॉन्फ़िग)](/hi/automation/cron-jobs#webhooks) - अलग सामान्य Gateway HTTP एंडपॉइंट सुविधा; इस Plugin के रूट के समान नहीं
- [Plugin रनटाइम SDK](/hi/plugins/sdk-runtime)
- [CLI Webhooks](/hi/cli/webhooks)
