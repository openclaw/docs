---
read_when:
    - फ़ाइल पहुँच, आर्काइव निष्कर्षण, कार्यस्थान संग्रहण या Plugin फ़ाइल सिस्टम हेल्पर बदलना
summary: OpenClaw स्थानीय फ़ाइल एक्सेस को सुरक्षित रूप से कैसे संभालता है, और वैकल्पिक fs-safe Python सहायक डिफ़ॉल्ट रूप से बंद क्यों होता है
title: सुरक्षित फ़ाइल संचालन
x-i18n:
    generated_at: "2026-06-28T23:13:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 19d5b31ec2f2c7ab1033bdb55a701c60468dfac58142f726ecbc9ac933f68e30
    source_path: gateway/security/secure-file-operations.md
    workflow: 16
---

OpenClaw सुरक्षा-संवेदनशील स्थानीय फ़ाइल संचालन के लिए [`@openclaw/fs-safe`](https://github.com/openclaw/fs-safe) का उपयोग करता है: root-बाउंडेड पढ़ना/लिखना, atomic replacement, archive extraction, अस्थायी workspaces, JSON state, और secret-file handling.

लक्ष्य विश्वसनीय OpenClaw कोड के लिए एक सुसंगत **library guardrail** है, जिसे अविश्वसनीय path names मिलते हैं। यह sandbox नहीं है। host filesystem permissions, OS users, containers, और agent/tool policy अब भी वास्तविक blast radius को परिभाषित करते हैं।

## डिफ़ॉल्ट: कोई Python सहायक नहीं

OpenClaw fs-safe POSIX Python सहायक को डिफ़ॉल्ट रूप से **off** रखता है।

क्यों:

- Gateway को persistent Python sidecar तब तक spawn नहीं करना चाहिए जब तक कोई operator उसमें opt in न करे;
- कई installs को अतिरिक्त parent-directory mutation hardening की आवश्यकता नहीं होती;
- Python अक्षम रखने से desktop, Docker, CI, और bundled app environments में package/runtime व्यवहार अधिक पूर्वानुमेय रहता है।

OpenClaw केवल डिफ़ॉल्ट बदलता है। यदि आप स्पष्ट रूप से कोई mode सेट करते हैं, तो fs-safe उसका सम्मान करता है:

```bash
# Default OpenClaw behavior: Node-only fs-safe fallbacks.
OPENCLAW_FS_SAFE_PYTHON_MODE=off

# Opt into the helper when available, falling back if unavailable.
OPENCLAW_FS_SAFE_PYTHON_MODE=auto

# Fail closed if the helper cannot start.
OPENCLAW_FS_SAFE_PYTHON_MODE=require

# Optional explicit interpreter.
OPENCLAW_FS_SAFE_PYTHON=/usr/bin/python3
```

सामान्य fs-safe नाम भी काम करते हैं: `FS_SAFE_PYTHON_MODE` और `FS_SAFE_PYTHON`.

## Python के बिना क्या सुरक्षित रहता है

सहायक off होने पर भी, OpenClaw इन चीज़ों के लिए fs-safe के Node paths का उपयोग करता है:

- `..`, absolute paths, और path separators जैसे relative-path escapes को अस्वीकार करना, जहाँ केवल names की अनुमति है;
- ad-hoc `path.resolve(...).startsWith(...)` checks के बजाय trusted root handle के माध्यम से operations resolve करना;
- उन APIs पर symlink और hardlink patterns अस्वीकार करना जिन्हें उस policy की आवश्यकता होती है;
- जहाँ API file contents लौटाता या consume करता है, वहाँ identity checks के साथ files खोलना;
- state/config files के लिए atomic sibling-temp writes;
- reads और archive extraction के लिए byte limits;
- secrets और state files के लिए private modes, जहाँ API उन्हें आवश्यक बनाता है।

ये protections सामान्य OpenClaw threat model को cover करते हैं: trusted Gateway code, जो एक ही trusted operator boundary के अंदर untrusted model/plugin/channel path input संभालता है।

## Python क्या जोड़ता है

POSIX पर, fs-safe का वैकल्पिक सहायक एक persistent Python process रखता है और rename, remove, mkdir, stat/list, और कुछ write paths जैसे parent-directory mutations के लिए fd-relative filesystem operations का उपयोग करता है।

यह same-UID race windows को कम करता है, जहाँ दूसरा process validation और mutation के बीच parent directory को swap कर सकता है। यह उन hosts के लिए defense in depth है जहाँ untrusted local processes वही directories modify कर सकते हैं जिनमें OpenClaw operate कर रहा है।

यदि आपके deployment में यह जोखिम है और Python का मौजूद होना guaranteed है, तो उपयोग करें:

```bash
OPENCLAW_FS_SAFE_PYTHON_MODE=require
```

जब सहायक आपके security posture का हिस्सा हो, तो `auto` के बजाय `require` का उपयोग करें; यदि सहायक उपलब्ध नहीं है, तो `auto` जानबूझकर Node-only व्यवहार पर fallback करता है।

## Plugin और core मार्गदर्शन

- Plugin-facing file access को raw `fs` के बजाय `openclaw/plugin-sdk/*` helpers से जाना चाहिए, जब path किसी message, model output, config, या plugin input से आता है।
- Core code को `src/infra/*` के अंतर्गत local fs-safe wrappers का उपयोग करना चाहिए, ताकि OpenClaw की process policy सुसंगत रूप से लागू हो।
- Archive extraction को स्पष्ट size, entry-count, link, और destination limits के साथ fs-safe archive helpers का उपयोग करना चाहिए।
- Secrets को OpenClaw secret helpers या fs-safe secret/private-state helpers का उपयोग करना चाहिए; `fs.writeFile` के आसपास mode checks हाथ से न बनाएँ।
- यदि आपको hostile local-user isolation चाहिए, तो केवल fs-safe पर निर्भर न रहें। अलग OS users/hosts के अंतर्गत अलग Gateways चलाएँ या sandboxing का उपयोग करें।

संबंधित: [सुरक्षा](/hi/gateway/security), [Sandboxing](/hi/gateway/sandboxing), [Exec अनुमोदन](/hi/tools/exec-approvals), [Secrets](/hi/gateway/secrets).
