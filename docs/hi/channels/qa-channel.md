---
read_when:
    - आप सिंथेटिक QA ट्रांसपोर्ट को स्थानीय या CI परीक्षण रन में जोड़ रहे हैं
    - आपको बंडल किए गए qa-channel कॉन्फ़िगरेशन सतह की आवश्यकता है
    - आप एंड-टू-एंड QA ऑटोमेशन को क्रमिक रूप से सुधार रहे हैं
summary: नियतात्मक OpenClaw QA परिदृश्यों के लिए कृत्रिम Slack-श्रेणी चैनल Plugin
title: QA चैनल
x-i18n:
    generated_at: "2026-06-28T22:39:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8f28962032bc5f6b228de731ae6bd9a22831604b506b7073aeffba19ac22e0e8
    source_path: channels/qa-channel.md
    workflow: 16
---

`qa-channel` स्वचालित OpenClaw QA के लिए bundled synthetic message transport है। यह production channel नहीं है - यह वास्तविक transports द्वारा उपयोग की जाने वाली उसी channel Plugin सीमा का अभ्यास कराने के लिए मौजूद है, जबकि state को deterministic और पूरी तरह inspectable रखता है।

## यह क्या करता है

- Slack-वर्ग target grammar:
  - `dm:<user>`
  - `channel:<room>`
  - `group:<room>`
  - `thread:<room>/<thread>`
- साझा `channel:` और `group:` conversations agents को group/channel room turns के रूप में दिखाई जाती हैं, इसलिए वे Discord, Slack, Telegram और समान transports द्वारा उपयोग की जाने वाली उसी visible-reply और message-tool routing policy का अभ्यास कराती हैं।
- inbound message injection, outbound transcript capture, thread creation, reactions, edits, deletes, और search/read actions के लिए HTTP-backed synthetic bus।
- Host-side self-check runner जो `.artifacts/qa-e2e/` में Markdown report लिखता है।

## Config

```json
{
  "channels": {
    "qa-channel": {
      "baseUrl": "http://127.0.0.1:43123",
      "botUserId": "openclaw",
      "botDisplayName": "OpenClaw QA",
      "allowFrom": ["*"],
      "pollTimeoutMs": 1000
    }
  }
}
```

Account keys:

- `enabled` - इस account के लिए master toggle।
- `name` - वैकल्पिक display label।
- `baseUrl` - synthetic bus URL।
- `botUserId` - target grammar में उपयोग की जाने वाली Matrix-style bot user id।
- `botDisplayName` - outbound messages के लिए display name।
- `pollTimeoutMs` - long-poll wait window। 100 और 30000 के बीच integer।
- `allowFrom` - sender allowlist (user ids या `"*"`). Direct messages और
  allowlisted group policy दोनों इन synthetic sender ids का उपयोग करते हैं।
- `groupPolicy` - shared-room policy: `"open"` (default), `"allowlist"`, या
  `"disabled"`।
- `groupAllowFrom` - वैकल्पिक shared-room sender allowlist। `"allowlist"` के अंतर्गत
  omit होने पर, QA Channel `allowFrom` पर fallback करता है।
- `groups.<room>.requireMention` - किसी specific group/channel room में reply करने से पहले bot mention आवश्यक करें। `groups."*"` default set करता है।
- `defaultTo` - जब कोई target supplied न हो तो fallback target।
- `actions.messages` / `actions.reactions` / `actions.search` / `actions.threads` - per-action tool gating।

Top level पर multi-account keys:

- `accounts` - account id द्वारा keyed named per-account overrides का record।
- `defaultAccount` - multiple accounts configured होने पर preferred account id।

## Runners

Host-side self-check (`.artifacts/qa-e2e/` के अंतर्गत Markdown report लिखता है):

```bash
pnpm qa:e2e
```

यह `qa-lab` के माध्यम से route करता है, in-repo QA bus शुरू करता है, bundled `qa-channel` runtime slice boot करता है, और deterministic self-check चलाता है।

Full repo-backed scenario suite:

```bash
pnpm openclaw qa suite
```

QA Gateway lane के विरुद्ध scenarios parallel में चलाता है। Scenarios, profiles, और provider modes के लिए [QA overview](/hi/concepts/qa-e2e-automation) देखें।

Docker-backed QA site (एक stack में Gateway + QA Lab debugger UI):

```bash
pnpm qa:lab:up
```

QA site build करता है, Docker-backed Gateway + QA Lab stack शुरू करता है, और QA Lab URL print करता है। वहां से आप scenarios चुन सकते हैं, model lane चुन सकते हैं, individual runs launch कर सकते हैं, और results live देख सकते हैं। QA Lab debugger shipped Control UI bundle से अलग है।

## Related

- [QA overview](/hi/concepts/qa-e2e-automation) - overall stack, transport adapters, scenario authoring
- [Matrix QA](/hi/concepts/qa-matrix) - example live-transport runner जो real channel drive करता है
- [Pairing](/hi/channels/pairing)
- [Groups](/hi/channels/groups)
- [Channels overview](/hi/channels)
