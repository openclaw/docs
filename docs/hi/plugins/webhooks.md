---
read_when:
    - आप किसी बाहरी सिस्टम से TaskFlows को ट्रिगर या संचालित करना चाहते हैं
    - आप बंडल किए गए Webhook Plugin को कॉन्फ़िगर कर रहे हैं
summary: 'Webhooks Plugin: विश्वसनीय बाहरी स्वचालन के लिए प्रमाणीकृत TaskFlow प्रवेश मार्ग'
title: Webhooks Plugin
x-i18n:
    generated_at: "2026-07-16T16:48:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 081ccbb4ca60234b20f4db7379395bdc51e7203caad4c0a88f292989ca18b28e
    source_path: plugins/webhooks.md
    workflow: 16
---

Webhooks Plugin प्रमाणित HTTP रूट जोड़ता है, ताकि कोई विश्वसनीय बाहरी
सिस्टम (Zapier, n8n, कोई CI जॉब, कोई आंतरिक सेवा) कस्टम Plugin लिखे बिना
HTTP के माध्यम से प्रबंधित OpenClaw TaskFlows बना और संचालित कर सके।

Plugin Gateway प्रक्रिया के अंदर चलता है। किसी दूरस्थ Gateway के लिए, इसे
उस होस्ट पर इंस्टॉल और कॉन्फ़िगर करें, फिर Gateway पुनः आरंभ करें। यह बिना किसी
कॉन्फ़िगर किए गए रूट के आता है, इसलिए कम-से-कम एक रूट जोड़ने तक यह कोई कार्रवाई नहीं करता।

## रूट कॉन्फ़िगर करें

`plugins.entries.webhooks.config` के अंतर्गत कॉन्फ़िगरेशन सेट करें:

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
              description: "Zapier TaskFlow सेतु",
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
| `path`         | नहीं       | `/plugins/webhooks/<routeId>` | सभी रूट में अद्वितीय होना आवश्यक है।                 |
| `sessionKey`   | हाँ      | -                             | वह सत्र, जिसके स्वामित्व में संबद्ध TaskFlows हैं।        |
| `secret`       | हाँ      | -                             | सादा स्ट्रिंग या SecretRef (नीचे)।          |
| `controllerId` | नहीं       | `webhooks/<routeId>`          | डिफ़ॉल्ट `create_flow` नियंत्रक के रूप में उपयोग किया जाता है। |
| `description`  | नहीं       | -                             | केवल ऑपरेटर टिप्पणी।                           |

`secret` सादा स्ट्रिंग या SecretRef स्वीकार करता है: `{ source: "env" | "file" | "exec", provider: "default", id: "..." }`।

प्रत्येक कॉन्फ़िगर किया गया रूट स्टार्टअप पर पंजीकृत होता है, भले ही उसका सीक्रेट
वर्तमान में रिज़ॉल्व हो सके या नहीं। रिज़ॉल्व न हो सकने वाला सीक्रेट रूट को अक्षम
नहीं करता या छोड़ता नहीं है—जब तक सीक्रेट रिज़ॉल्व नहीं हो जाता, उस पर किए गए अनुरोधों का
प्रमाणीकरण विफल (`401`) होता है। SecretRef मान प्रत्येक अनुरोध पर फिर से
रिज़ॉल्व किए जाते हैं, इसलिए अंतर्निहित सीक्रेट (पर्यावरण वेरिएबल, फ़ाइल या exec आउटपुट)
को बदलना Gateway पुनः आरंभ किए बिना प्रभावी हो जाता है।

## सुरक्षा मॉडल

प्रत्येक रूट अपने कॉन्फ़िगर किए गए `sessionKey` के TaskFlow प्राधिकार के साथ कार्य करता है:
यह उस सत्र के स्वामित्व वाले किसी भी TaskFlow का निरीक्षण और परिवर्तन कर सकता है। TaskFlow पहुँच
हमेशा `api.runtime.tasks.managedFlows.bindSession(...)` के माध्यम से होती है, इसलिए कोई
रूट अपने संबद्ध सत्र के बाहर कभी कार्य नहीं कर सकता। प्रभाव का दायरा सीमित करने के लिए:

- प्रत्येक रूट के लिए एक मजबूत, अद्वितीय सीक्रेट उपयोग करें।
- इनलाइन प्लेनटेक्स्ट सीक्रेट के बजाय SecretRef को प्राथमिकता दें।
- रूट को वर्कफ़्लो के अनुकूल सबसे सीमित सत्र से संबद्ध करें।
- केवल आवश्यक विशिष्ट Webhook पथ को उजागर करें।

प्रत्येक पथ के लिए अनुरोध प्रबंधन का क्रम: HTTP विधि (केवल `POST`) और
`Content-Type: application/json` जाँच, फिर निश्चित-विंडो दर सीमा (प्रति path+client-IP कुंजी
प्रत्येक 60-सेकंड विंडो में 120 अनुरोध, अधिकतम 4,096 ट्रैक की गई
कुंजियाँ), फिर जारी अनुरोध सीमा (प्रति कुंजी 8 समवर्ती अनुरोध, अधिकतम
4,096 ट्रैक की गई कुंजियाँ), फिर साझा-सीक्रेट प्रमाणीकरण, फिर 256 KB /
15-सेकंड JSON बॉडी रीड। पहले की किसी जाँच में विफल अनुरोध बाद की
जाँचों तक कभी नहीं पहुँचते।

## अनुरोध प्रारूप

`Content-Type: application/json` और `Authorization: Bearer <secret>` या `x-openclaw-webhook-secret: <secret>` में से किसी एक के साथ
`POST` अनुरोध भेजें:

```bash
curl -X POST https://gateway.example.com/plugins/webhooks/zapier \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_SHARED_SECRET' \
  -d '{"action":"create_flow","goal":"आने वाली कतार की समीक्षा करें"}'
```

## समर्थित कार्रवाइयाँ

| कार्रवाई             | उद्देश्य                                                            |
| ------------------ | ------------------------------------------------------------------ |
| `create_flow`      | रूट के सत्र के लिए एक प्रबंधित TaskFlow बनाएँ।                 |
| `get_flow`         | आईडी द्वारा एक TaskFlow प्राप्त करें।                                          |
| `list_flows`       | रूट के सत्र के TaskFlows सूचीबद्ध करें।                            |
| `find_latest_flow` | सबसे हाल में अपडेट किया गया TaskFlow प्राप्त करें।                          |
| `resolve_flow`     | अपारदर्शी टोकन द्वारा TaskFlow रिज़ॉल्व करें।                                |
| `get_task_summary` | किसी TaskFlow का कार्य सारांश प्राप्त करें।                             |
| `set_waiting`      | वैकल्पिक स्थिति/प्रतीक्षा डेटा के साथ TaskFlow को प्रतीक्षारत चिह्नित करें।            |
| `resume_flow`      | प्रतीक्षारत/अवरुद्ध TaskFlow फिर से शुरू करें।                                 |
| `finish_flow`      | TaskFlow को समाप्त चिह्नित करें।                                          |
| `fail_flow`        | TaskFlow को विफल चिह्नित करें।                                            |
| `request_cancel`   | सहकारी रद्दीकरण का अनुरोध करें।                                  |
| `cancel_flow`      | TaskFlow रद्द करें (यदि चाइल्ड अभी भी सक्रिय हैं, तो `202` लौटाया जा सकता है)। |
| `run_task`         | किसी मौजूदा TaskFlow के अंदर एक प्रबंधित चाइल्ड टास्क बनाएँ।           |

परिवर्तनकारी कार्रवाइयों (`set_waiting`, `resume_flow`, `finish_flow`, `fail_flow`,
`request_cancel`) के लिए आशावादी समवर्ती नियंत्रण हेतु `flowId` और
`expectedRevision` आवश्यक हैं; पुराना रिवीजन `409 revision_conflict` लौटाता है।

### `create_flow`

```json
{
  "action": "create_flow",
  "goal": "आने वाली कतार की समीक्षा करें",
  "status": "queued",
  "notifyPolicy": "done_only"
}
```

### `run_task`

अनुमत `runtime` मान: `subagent`, `acp`। `startedAt`, `lastEventAt`, और
`progressSummary` केवल तभी मान्य हैं जब `status`, `"running"` हो; उन्हें
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

फ़्लो और टास्क दृश्यों में कभी स्वामी/सत्र मेटाडेटा शामिल नहीं होता, इसलिए प्रतिक्रियाएँ
रूट के संबद्ध `sessionKey` को उजागर नहीं कर सकतीं। `code` मानों में `not_found`,
`not_managed`, `revision_conflict`, `persist_failed`, `cancel_requested`,
`cancel_pending`, `terminal`, `invalid_request`, `request_rejected`, और
कार्रवाई-विशिष्ट फ़ॉलबैक कोड (`mutation_rejected`, `create_rejected`,
`task_not_created`, `cancel_rejected`) शामिल हैं, जब किसी परिवर्तन को ऐसे
कारण से अस्वीकार किया जाता है जिसे ऊपर दिए गए नामित कोड कवर नहीं करते।

## संबंधित

- [Hooks](/hi/automation/hooks) - आंतरिक घटना-संचालित हुक बनाम यह HTTP-आधारित TaskFlow सेतु
- [Gateway Webhooks (`hooks.*` कॉन्फ़िगरेशन)](/hi/automation/cron-jobs#webhooks) - अलग सामान्य Gateway HTTP एंडपॉइंट सुविधा; इस Plugin के रूट के समान नहीं
- [Plugin रनटाइम SDK](/hi/plugins/sdk-runtime)
- [CLI Webhooks](/hi/cli/webhooks)
