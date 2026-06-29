---
read_when:
    - Mac मेनू UI या स्थिति लॉजिक में बदलाव
summary: मेनू बार स्थिति लॉजिक और उपयोगकर्ताओं को क्या दिखाया जाता है
title: मेनू बार
x-i18n:
    generated_at: "2026-06-28T23:28:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c569ced20b2f6a639d52d373cc8b55a42d7c015a0b234d5154ce67ac03c2eaf6
    source_path: platforms/mac/menu-bar.md
    workflow: 16
---

## क्या दिखाया जाता है

- हम मौजूदा agent कार्य स्थिति को menu bar icon में और menu की पहली status row में दिखाते हैं।
- काम सक्रिय होने पर health status छिपा रहता है; सभी sessions idle होने पर यह वापस आ जाता है।
- root "Context" submenu में recent sessions होते हैं, उन्हें सीधे root menu में expand नहीं किया जाता।
- root menu में "Nodes" block केवल **devices** सूचीबद्ध करता है (`node.list` के ज़रिए paired nodes), client/presence entries नहीं।
- provider usage snapshots उपलब्ध होने पर Context के नीचे root "Usage" section दिखाई देता है, और उपलब्ध होने पर उसके बाद usage-cost details आती हैं।

## State model

- Sessions: events `runId` (per-run) और payload में `sessionKey` के साथ आते हैं। "main" session की key `main` है; अगर वह मौजूद न हो, तो हम सबसे हाल में updated session पर fall back करते हैं।
- Priority: main हमेशा जीतता है। अगर main active है, तो उसकी state तुरंत दिखाई जाती है। अगर main idle है, तो सबसे हाल में active रहा non-main session दिखाया जाता है। हम mid-activity में flip-flop नहीं करते; हम केवल तब switch करते हैं जब current session idle हो जाता है या main active हो जाता है।
- Activity kinds:
  - `job`: high-level command execution (`state: started|streaming|done|error`)।
  - `tool`: `toolName` और `meta/args` के साथ `phase: start|result`।

## IconState enum (Swift)

- `idle`
- `workingMain(ActivityKind)`
- `workingOther(ActivityKind)`
- `overridden(ActivityKind)` (debug override)

### ActivityKind → glyph

- `exec` → 💻
- `read` → 📄
- `write` → ✍️
- `edit` → 📝
- `attach` → 📎
- default → 🛠️

### Visual mapping

- `idle`: सामान्य critter।
- `workingMain`: glyph वाला badge, full tint, leg "working" animation।
- `workingOther`: glyph वाला badge, muted tint, कोई scurry नहीं।
- `overridden`: activity की परवाह किए बिना चुना गया glyph/tint इस्तेमाल करता है।

## Context submenu

- root menu एक session count/status के साथ एक "Context" row दिखाता है और submenu खोलता है।
- Context submenu header पिछले 24 hours के लिए active session count दिखाता है।
- हर session row अपना token bar, age, preview, thinking/verbose, reset, compact, और delete actions रखती है।
- Loading, disconnected, और session-load error messages Context submenu के अंदर दिखाई देते हैं।
- Provider usage और usage-cost details Context के नीचे root-level पर रहते हैं ताकि submenu खोले बिना वे एक नज़र में दिख सकें।

## Status row text (menu)

- काम सक्रिय होने पर: `<Session role> · <activity label>`
  - Examples: `Main · exec: pnpm test`, `Other · read: apps/macos/Sources/OpenClaw/AppState.swift`.
- idle होने पर: health summary पर fall back करता है।

## Event ingestion

- Source: control-channel `agent` events (`ControlChannel.handleAgentEvent`)।
- Parsed fields:
  - start/stop के लिए `data.state` के साथ `stream: "job"`।
  - `data.phase`, `name`, optional `meta`/`args` के साथ `stream: "tool"`।
- Labels:
  - `exec`: `args.command` की पहली line।
  - `read`/`write`: छोटा किया गया path।
  - `edit`: path और `meta`/diff counts से inferred change kind।
  - fallback: tool name।

## Debug override

- Settings ▸ Debug ▸ "Icon override" picker:
  - `System (auto)` (default)
  - `Working: main` (per tool kind)
  - `Working: other` (per tool kind)
  - `Idle`
- `@AppStorage("iconOverride")` के ज़रिए stored; `IconState.overridden` पर mapped।

## Testing checklist

- main session job trigger करें: verify करें कि icon तुरंत switch होता है और status row main label दिखाती है।
- main idle रहते हुए non-main session job trigger करें: icon/status non-main दिखाता है; खत्म होने तक stable रहता है।
- other active रहते हुए main start करें: icon तुरंत main पर flip होता है।
- Rapid tool bursts: सुनिश्चित करें कि badge flicker नहीं करता (tool results पर TTL grace)।
- सभी sessions idle होने पर health row फिर से दिखाई देती है।

## Related

- [macOS app](/hi/platforms/macos)
- [Menu bar icon](/hi/platforms/mac/icon)
