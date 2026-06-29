---
read_when:
    - IPC अनुबंधों या मेनू बार ऐप IPC को संपादित करना
summary: OpenClaw ऐप, Gateway नोड ट्रांसपोर्ट, और PeekabooBridge के लिए macOS IPC आर्किटेक्चर
title: macOS IPC
x-i18n:
    generated_at: "2026-06-28T23:30:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 436ea0a01dc544d246b4f2f506a2950fd05b36a8cf79f6f03cffe2843eef8c0d
    source_path: platforms/mac/xpc.md
    workflow: 16
---

# OpenClaw macOS IPC आर्किटेक्चर

**वर्तमान मॉडल:** एक स्थानीय Unix सॉकेट **node host service** को exec approvals + `system.run` के लिए **macOS app** से जोड़ता है। discovery/connect जांचों के लिए एक `openclaw-mac` debug CLI मौजूद है; agent actions अब भी Gateway WebSocket और `node.invoke` से होकर प्रवाहित होते हैं। UI automation PeekabooBridge का उपयोग करता है।

## लक्ष्य

- एकल GUI app instance जो सभी TCC-facing work (notifications, screen recording, mic, speech, AppleScript) का स्वामी हो।
- automation के लिए एक छोटा surface: Gateway + node commands, साथ में UI automation के लिए PeekabooBridge।
- अनुमानयोग्य permissions: हमेशा वही signed bundle ID, launchd द्वारा लॉन्च किया गया, ताकि TCC grants टिके रहें।

## यह कैसे काम करता है

### Gateway + node transport

- app Gateway (local mode) चलाता है और उससे node के रूप में जुड़ता है।
- Agent actions `node.invoke` के माध्यम से किए जाते हैं (जैसे `system.run`, `system.notify`, `canvas.*`)।
- सामान्य Mac node commands में `canvas.*`, `camera.snap`, `camera.clip`,
  `screen.snapshot`, `screen.record`, `system.run`, और `system.notify` शामिल हैं।
- node एक `permissions` map रिपोर्ट करता है ताकि agents देख सकें कि screen,
  camera, microphone, speech, automation, या accessibility access उपलब्ध है या नहीं।

### Node service + app IPC

- एक headless node host service Gateway WebSocket से जुड़ती है।
- `system.run` requests स्थानीय Unix socket पर macOS app को forward किए जाते हैं।
- app UI context में exec करता है, आवश्यकता होने पर prompts दिखाता है, और output लौटाता है।

Diagram (SCI):

```
Agent -> Gateway -> Node Service (WS)
                      |  IPC (UDS + token + HMAC + TTL)
                      v
                  Mac App (UI + TCC + system.run)
```

### PeekabooBridge (UI automation)

- UI automation `bridge.sock` नामक अलग UNIX socket और PeekabooBridge JSON protocol का उपयोग करता है।
- Host preference order (client-side): Peekaboo.app → Claude.app → OpenClaw.app → local execution।
- Security: bridge hosts के लिए allowed TeamID आवश्यक है; DEBUG-only same-UID escape hatch `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` (Peekaboo convention) द्वारा guarded है।
- विवरण के लिए देखें: [PeekabooBridge usage](/hi/platforms/mac/peekaboo)।

## Operational flows

- Restart/rebuild: `SIGN_IDENTITY="Apple Development: <Developer Name> (<TEAMID>)" scripts/restart-mac.sh`
  - मौजूदा instances को kill करता है
  - Swift build + package
  - LaunchAgent को लिखता/bootstraps/kickstarts करता है
- Single instance: यदि उसी bundle ID वाला कोई दूसरा instance चल रहा हो, तो app जल्दी exit कर जाता है।

## Hardening notes

- सभी privileged surfaces के लिए TeamID match आवश्यक रखना बेहतर है।
- PeekabooBridge: `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` (DEBUG-only) local development के लिए same-UID callers को अनुमति दे सकता है।
- सभी communication local-only रहती है; कोई network sockets expose नहीं किए जाते।
- TCC prompts केवल GUI app bundle से originate होते हैं; rebuilds में signed bundle ID stable रखें।
- IPC hardening: socket mode `0600`, token, peer-UID checks, HMAC challenge/response, short TTL।

## Related

- [macOS app](/hi/platforms/macos)
- [macOS IPC flow (Exec approvals)](/hi/tools/exec-approvals-advanced#macos-ipc-flow)
