---
read_when:
    - कमांड अनुमतियों के लिए auto, ask, allowlist, full, या deny चुनना
    - tools.exec.mode के माध्यम से Codex Guardian-समीक्षित अनुमोदन कॉन्फ़िगर करना
    - OpenClaw exec अनुमोदनों की ACPX harness अनुमतियों से तुलना
summary: होस्ट exec, Codex Guardian अनुमोदनों, और ACPX हार्नेस सत्रों के लिए अनुमति मोड
title: अनुमति मोड
x-i18n:
    generated_at: "2026-06-29T00:22:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6ce89cadb45b3b96ce9ab62b35c06610d02f0ff02f15ef7d2128c59fbebb325a
    source_path: tools/permission-modes.md
    workflow: 16
---

अनुमति मोड तय करते हैं कि कोई एजेंट होस्ट कमांड चलाने, फ़ाइलें लिखने, या अतिरिक्त पहुँच के लिए बैकएंड हार्नेस से अनुरोध करने से पहले कितने अधिकार रखता है। जब आप चाहते हैं कि OpenClaw पहले allowlists का उपयोग करे, फिर छूटे हुए मामलों के लिए Codex नेटिव auto-review या मानव स्वीकृति मार्ग अपनाए, तो `tools.exec.mode: "auto"` से शुरू करें।

<Note>
  अनुमति मोड `tools.exec.host=auto` से अलग है। `tools.exec.host`
  चुनता है कि कमांड कहाँ चलेगी। `tools.exec.mode` चुनता है कि होस्ट exec को
  कैसे स्वीकृत किया जाएगा।
</Note>

## अनुशंसित डिफ़ॉल्ट

उन कोडिंग एजेंटों के लिए `auto` का उपयोग करें जिन्हें हर छूटे हुए मामले को मानव prompt बनाए बिना उपयोगी होस्ट पहुँच चाहिए:

```bash
openclaw config set tools.exec.mode auto
openclaw approvals get
openclaw gateway restart
```

फिर प्रभावी नीति सत्यापित करें:

```bash
openclaw exec-policy show
```

`auto` मोड में, OpenClaw निर्धारक allowlist मिलानों को सीधे चलाता है। स्वीकृति से छूटे हुए मामले पहले OpenClaw के नेटिव auto reviewer से गुजरते हैं, फिर आवश्यकता होने पर कॉन्फ़िगर किए गए मानव स्वीकृति मार्ग पर वापस जाते हैं।

## OpenClaw होस्ट exec मोड

`tools.exec.mode` होस्ट `exec` के लिए सामान्यीकृत नीति सतह है।

| मोड        | व्यवहार                                     | कब उपयोग करें                                              |
| ----------- | -------------------------------------------- | ----------------------------------------------------- |
| `deny`      | होस्ट exec को ब्लॉक करें।                             | कोई होस्ट कमांड अनुमत नहीं है।                         |
| `allowlist` | केवल allowlisted कमांड चलाएँ।               | आपके पास ज्ञात-सुरक्षित कमांड सेट है।                    |
| `ask`       | allowlist मिलान चलाएँ और छूटे मामलों पर पूछें।     | किसी मानव को नई कमांड की समीक्षा करनी चाहिए।                   |
| `auto`      | allowlist मिलान चलाएँ, फिर auto-review का उपयोग करें। | कोडिंग सत्रों को व्यावहारिक सुरक्षित पहुँच चाहिए।        |
| `full`      | बिना prompts के होस्ट exec चलाएँ।               | इस विश्वसनीय होस्ट/सत्र को स्वीकृति gates छोड़ देने चाहिए। |

पूरी होस्ट exec नीति, स्थानीय approvals फ़ाइल, allowlist schema, safe bins, और forwarding व्यवहार के लिए, [Exec approvals](/hi/tools/exec-approvals) देखें।

## Codex Guardian मैपिंग

नेटिव Codex app-server सत्रों के लिए, जब स्थानीय Codex आवश्यकताएँ इसकी अनुमति देती हैं, `tools.exec.mode: "auto"` Codex Guardian-समीक्षित approvals से मैप होता है। OpenClaw आमतौर पर भेजता है:

| Codex फ़ील्ड         | सामान्य मान     |
| ------------------- | ----------------- |
| `approvalPolicy`    | `on-request`      |
| `approvalsReviewer` | `auto_review`     |
| `sandbox`           | `workspace-write` |

`auto` मोड में, OpenClaw पुराने असुरक्षित Codex overrides जैसे `approvalPolicy: "never"` या `sandbox: "danger-full-access"` को संरक्षित नहीं करता। `tools.exec.mode: "full"` का उपयोग केवल तब करें जब आप जानबूझकर बिना-स्वीकृति वाली स्थिति चाहते हों।

app-server setup, auth order, और नेटिव Codex runtime विवरण के लिए, [Codex harness](/hi/plugins/codex-harness) देखें।

## ACPX हार्नेस अनुमतियाँ

ACPX सत्र non-interactive होते हैं, इसलिए वे TTY permission prompt पर क्लिक नहीं कर सकते। ACPX `plugins.entries.acpx.config` के अंतर्गत अलग harness-level settings का उपयोग करता है:

| सेटिंग                     | सामान्य मान    | अर्थ                                     |
| --------------------------- | --------------- | ------------------------------------------- |
| `permissionMode`            | `approve-reads` | केवल reads को auto-approve करें।                    |
| `permissionMode`            | `approve-all`   | writes और shell commands को auto-approve करें।     |
| `permissionMode`            | `deny-all`      | सभी permission prompts अस्वीकार करें।                |
| `nonInteractivePermissions` | `fail`          | जब prompt आवश्यक हो, तो abort करें।      |
| `nonInteractivePermissions` | `deny`          | prompt अस्वीकार करें और संभव होने पर जारी रखें। |

ACPX अनुमतियाँ OpenClaw exec approvals से अलग सेट करें:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
openclaw gateway restart
```

बिना-prompt हार्नेस सत्र के ACPX break-glass समकक्ष के रूप में `approve-all` का उपयोग करें। setup विवरण और failure modes के लिए, [ACP agents setup](/hi/tools/acp-agents-setup#permission-configuration) देखें।

## मोड चुनना

| लक्ष्य                                          | कॉन्फ़िगर करें                                                   |
| --------------------------------------------- | ----------------------------------------------------------- |
| होस्ट कमांड पूरी तरह ब्लॉक करें                | `tools.exec.mode: "deny"`                                   |
| केवल ज्ञात-सुरक्षित कमांड चलने दें              | `tools.exec.mode: "allowlist"`                              |
| हर नई कमांड shape के लिए मानव से पूछें       | `tools.exec.mode: "ask"`                                    |
| मानवों से पहले Codex/OpenClaw auto-review का उपयोग करें  | `tools.exec.mode: "auto"`                                   |
| होस्ट exec approvals पूरी तरह छोड़ें             | `tools.exec.mode: "full"` plus matching host approvals file |
| non-interactive ACPX सत्रों को write/exec करने दें | `plugins.entries.acpx.config.permissionMode: "approve-all"` |

यदि मोड बदलने के बाद भी कोई कमांड prompt करती है या विफल होती है, तो दोनों layers जाँचें:

```bash
openclaw approvals get
openclaw exec-policy show
```

होस्ट exec OpenClaw config और host-local approvals फ़ाइल के अधिक सख्त परिणाम का उपयोग करता है। ACPX हार्नेस अनुमतियाँ होस्ट exec approvals को ढीला नहीं करतीं, और होस्ट exec approvals ACPX हार्नेस prompts को ढीला नहीं करते।

## संबंधित

- [Exec approvals](/hi/tools/exec-approvals)
- [Exec approvals - advanced](/hi/tools/exec-approvals-advanced)
- [Codex harness](/hi/plugins/codex-harness)
- [ACP agents setup](/hi/tools/acp-agents-setup#permission-configuration)
