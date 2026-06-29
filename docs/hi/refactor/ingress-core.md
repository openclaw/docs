---
read_when:
    - चैनल इनग्रेस रिफैक्टर ने बहुत अधिक कोड क्यों जोड़ा, इसका ऑडिट करना
    - बंडल किए गए Plugins से रूट, कमांड, इवेंट, सक्रियण, या एक्सेस-ग्रुप नीति को कोर में ले जाना
    - यह समीक्षा करना कि क्या कोई चैनल इनग्रेस helper वास्तव में बंडल किया गया Plugin कोड हटाता है
sidebarTitle: Ingress core deletion
summary: दोहराए गए चैनल इनग्रेस ग्लू को कोर में ले जाने के लिए डिलीशन-फर्स्ट योजना।
title: Ingress कोर हटाने की योजना
x-i18n:
    generated_at: "2026-06-29T00:05:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1fdf1e7c9636d02c48c4b5d2b4a51470317dd64e2270c7fae779777c0d787afc
    source_path: refactor/ingress-core.md
    workflow: 16
---

# Ingress कोर हटाने की योजना

Ingress refactor तब तक स्वस्थ नहीं है जब तक यह हजारों शुद्ध लाइनें जोड़ता है। कोर
केंद्रीकरण तभी मायने रखता है जब बंडल किए गए Plugin उत्पादन कोड छोटे हों और
पुरानी तृतीय-पक्ष SDK संगतता SDK/कोर शिम तक सीमित हो।

वांछित रनटाइम आकार:

```text
bundled plugin event
  -> extract platform facts locally
  -> resolve shared ingress once when facts are available
  -> branch on generic ingress projections/outcomes
  -> perform platform side effects locally

old third-party helper
  -> SDK compatibility shim
  -> shared ingress-compatible projection where possible
  -> old return shape preserved
```

बंडल किए गए Plugins को ingress को वापस स्थानीय `AccessResult`,
`GroupAccessDecision`, `CommandAuthDecision`, `DmCommandAccess`, या
`{ allowed, reasonCode }` आकारों में अनुवाद नहीं करना चाहिए, जब तक वह प्रकार सार्वजनिक Plugin API न हो।

## बजट

`origin/main` के साथ PR merge-base के विरुद्ध मापा गया, जिसमें untracked
फाइलें शामिल हैं।

```text
merge-base            1671e7532adb

current:
core production       +3,922 / -546    = +3,376
docs                  +601 / -17       = +584
other                 +145 / -2        = +143
plugin production     +4,148 / -5,388  = -1,240
tests                 +2,326 / -2,414  = -88
total                 +11,142 / -8,367 = +2,775

required:
plugin production     <= -1,500
core production       <= +1,500, or paid for by larger plugin deletion
tests                 <= +1,000
total                 <= +2,000

stretch:
plugin production     <= -2,500
core production       <= +1,200
total                 <= 0
```

न्यूनतम शेष सफाई:

```text
plugin production     needs 260 more net deleted lines
total                 needs 775 more net deleted lines
core production       still +1,876 over standalone budget, unless paid down by plugin deletion
```

केवल टिप्पणी हटाना सफाई में नहीं गिना जाता। पिछला बजट पास
बहुत उदार था क्योंकि उसमें बहाल की गई QQBot व्याख्यात्मक टिप्पणियां शामिल थीं; यह
दस्तावेज केवल executable/docs/test कोड मूवमेंट को ट्रैक करता है।

प्रत्येक cleanup wave के बाद फिर मापें:

```sh
base=$(git merge-base HEAD origin/main)
git diff --shortstat "$base"
git diff --numstat "$base" -- src/channels/message-access src/plugin-sdk extensions | sort -nr -k1 | head -n 80
pnpm lint:extensions:no-deprecated-channel-access
```

## निदान

पहले पास ने साझा ingress kernel जोड़ा, फिर उसके साथ बहुत अधिक Plugin-स्थानीय
authorization छोड़ दिया:

```text
platform facts
  -> shared ingress state and decision
  -> plugin-local DTO or legacy projection
  -> plugin-local if/else ladder
```

यह मॉडल को दोहराता है। कोर उत्पादन लगभग 3,376 लाइनों से बढ़ा, जबकि
बंडल किए गए Plugin उत्पादन 1,240 लाइन छोटा है। यह पहले
पास से बेहतर है, लेकिन यह न्यूनतम बजट के भीतर नहीं है। सुधार अब भी deletion-first है:

- उन Plugin DTOs को हटाएं जो केवल ingress fields का नाम बदलते हैं
- उन tests को हटाएं जो केवल wrapper shape assert करते हैं
- core helpers केवल तब जोड़ें जब वही patch बंडल किए गए Plugin code को हटाए
- पुरानी SDK compatibility केवल SDK/core shims में रखें
- wrapper deletion से stable shape खुलने के बाद core को repack करें

## हॉटस्पॉट

सकारात्मक बंडल उत्पादन फाइलें जिन्हें अभी भी छोटा करना है:

```text
extensions/telegram/src/ingress.ts                        +126
extensions/discord/src/monitor/dm-command-auth.ts         +101
extensions/signal/src/monitor/access-policy.ts             +92
extensions/feishu/src/policy.ts                            +85
extensions/slack/src/monitor/auth.ts                       +64
extensions/googlechat/src/monitor-access.ts                +59
extensions/nextcloud-talk/src/inbound.ts                   +51
extensions/matrix/src/matrix/monitor/access-state.ts       +49
extensions/irc/src/inbound.ts                              +44
extensions/imessage/src/monitor/inbound-processing.ts      +36
extensions/qa-channel/src/inbound.ts                       +34
extensions/qqbot/src/bridge/sdk-adapter.ts                 +33
extensions/tlon/src/monitor/utils.ts                       +30
extensions/twitch/src/access-control.ts                    +22
extensions/qqbot/src/engine/commands/slash-command-handler.ts +20
extensions/telegram/src/bot-handlers.runtime.ts            +19
```

branch अभी न्यूनतम बजट के भीतर नहीं है। शेष review-relevant
काम को एक और core abstraction जोड़ने से पहले repeated authorization flow, turn scaffolding,
या wrapper tests हटाने चाहिए।

## वर्तमान कोड पढ़ना

स्वस्थ core seam पहले से `src/channels/message-access/runtime.ts` में मौजूद है:
यह identity adapters, effective allowlists, pairing-store reads, route
descriptors, command/event presets, access groups, और अंतिम resolved
`ResolvedChannelMessageIngress` projection का मालिक है।

शेष वृद्धि अधिकतर उस seam के ऊपर layered Plugin glue है:

- `extensions/telegram/src/ingress.ts` core decisions को Telegram-specific
  command/event helpers में wrap करता है, फिर call sites अब भी precomputed normalized
  allowlists और owner lists पास करते हैं।
- `extensions/discord/src/monitor/dm-command-auth.ts`,
  `extensions/feishu/src/policy.ts`, `extensions/googlechat/src/monitor-access.ts`,
  और `extensions/matrix/src/matrix/monitor/access-state.ts` अब भी
  local policy DTOs या legacy decision names को ingress के साथ रखते हैं।
- `extensions/signal/src/monitor/access-policy.ts` Signal
  identity normalization और pairing replies को सही तरह local रखता है, लेकिन अब भी एक wrapper
  seam है जिसे direct ingress consumption में collapse होना चाहिए।
- `extensions/nextcloud-talk/src/inbound.ts`, `extensions/irc/src/inbound.ts`,
  `extensions/qa-channel/src/inbound.ts`, `extensions/zalo/src/monitor.ts`, और
  `extensions/zalouser/src/monitor.ts` अब भी route/envelope/turn
  assembly दोहराते हैं जो ingress kernel के बाहर shared turn helpers में जा सकती है।

निष्कर्ष: अधिक code को core में ले जाना केवल तभी उपयोगी है जब यह उसी
patch में इन Plugin wrapper layers को हटाए। wrapper returns को छोड़े रखते हुए
एक और abstraction जोड़ना वही गलती दोहराता है।

## सीमा

Core generic policy का मालिक है:

- allowlist normalization और matching
- access-group expansion और diagnostics
- pairing-store DM allowlist reads
- route, sender, command, event, और activation gates
- admission mapping: dispatch, drop, skip, observe, pairing
- redacted state, decisions, diagnostics, और SDK compatibility projections
- identity, route, command, event, activation,
  और outcomes के लिए reusable generic descriptors

Plugins transport facts और side effects के मालिक हैं:

- webhook/socket/request authenticity
- platform identity extraction और API lookups
- channel-specific policy defaults
- pairing challenge delivery, replies, acks, reactions, typing, media, history,
  setup, doctor, status, logs, और user-facing copy

Core channel-agnostic रहना चाहिए: कोई Discord, Slack, Telegram, Matrix, room,
guild, space, API client, या plugin-specific default
`src/channels/message-access` में नहीं।

## स्वीकृति नियम

हर नया core helper तुरंत बंडल किए गए Plugin उत्पादन कोड को हटाए।

```text
one bundled caller        reject; keep plugin-local
two bundled callers       accept only if plugin production LOC drops
three or more callers     plugin deletion must be at least 2x new core LOC
compatibility-only helper SDK/core shim only; never bundled hot paths
```

रुकें और फिर से design करें यदि:

- Plugin production LOC बढ़ता है
- tests production shrink से तेज बढ़ते हैं
- कोई बंडल किया गया hot path ऐसा DTO return करता है जो केवल `ResolvedChannelMessageIngress` का नाम बदलता है
- कोई core helper channel id, platform object, API client, या
  channel-specific default मांगता है

## कार्य पैकेज

1. बजट freeze करें।
   PR में LOC रखें, deprecated-ingress lint green रखें, और cleanup commits में before/after
   LOC शामिल करें।

2. thin DTO seams हटाएं।
   Plugin-local wrapper returns को `ResolvedChannelMessageIngress`,
   `senderAccess`, `commandAccess`, `routeAccess`, या `ingress` से सीधे बदलें। शुरुआत
   QQBot, Telegram, Slack, Discord, Signal, Feishu, Matrix, iMessage, और
   Tlon से करें। wrapper-shape tests हटाएं; behavior tests रखें।

3. outcome classification केवल deletions के साथ जोड़ें।
   एक generic classifier `dispatch`, `pairing-required`,
   `skip-activation`, `drop-command`, `drop-route`, `drop-sender`, और
   `drop-ingress` expose कर सकता है। इसे decision graph से derive होना चाहिए, reason strings से नहीं,
   और उसी patch में कम से कम तीन Plugins migrate करने चाहिए।

4. route descriptor builders केवल deletions के साथ जोड़ें।
   Generic route target और route sender helpers तभी स्वीकार्य हैं जब वे
   route-heavy Plugins को तुरंत छोटा करें: Google Chat, IRC, Microsoft Teams,
   Nextcloud Talk, Mattermost, Slack, Zalo, और Zalo Personal।

5. command/event presets केवल deletions के साथ जोड़ें।
   text-command, native-command, callback, और origin-subject shapes को centralize करें।
   Command consumers को unauthorized पर default करना चाहिए जब कोई command gate न चला हो;
   events को pairing शुरू नहीं करनी चाहिए।

6. identity presets केवल वहां जोड़ें जहां वे boilerplate हटाते हैं।
   Stable-id, stable-id-plus-aliases, phone/e164, और multi-identifier helpers
   तब allowed हैं जब raw values केवल adapter input में जाएं और redacted state
   opaque ids/counts रखे।

7. authorized turn assembly साझा करें।
   ingress kernel के बाहर, QA Channel, IRC, Nextcloud Talk, Zalo, और Zalo Personal से
   repeated route/envelope/context/reply
   scaffolding हटाएं। Core route/session/envelope/dispatch sequencing का मालिक हो सकता है; Plugins
   delivery और channel-specific context रखें।

8. compatibility को quarantine करें।
   Deprecated SDK helpers source-compatible रहें, लेकिन बंडल किए गए hot paths को
   deprecated ingress या command-auth facades import नहीं करने चाहिए। Compatibility tests को
   fake third-party plugins का उपयोग करना चाहिए, bundled-plugin internals का नहीं।

9. core को repack करें।
   wrapper deletion के बाद, one-use modules collapse करें, unused exports हटाएं, compatibility projection को
   hot paths से बाहर ले जाएं, और identity,
   route, command/event, activation, access groups, और compatibility shims के लिए focused tests रखें।

## Deletion Waves

इन्हें क्रम में चलाएं। हर wave को bundled production LOC घटाना चाहिए।

1. Wrapper collapse, अपेक्षित plugin delta: -400 से -600।
   Plugin-local `resolveXAccess`, `resolveXCommandAccess`, और
   `accessFromIngress` result types को
   `ResolvedChannelMessageIngress` से direct reads से बदलें। पहले targets: Discord DM command auth,
   Feishu policy, Matrix access state, Telegram ingress, Signal access policy,
   QQBot SDK adapter।

2. Shared outcome helpers, अपेक्षित plugin delta: -200 से -350।
   एक generic classifier केवल तभी जोड़ें जब वह कम से कम तीन Plugins में repeated
   `shouldBlockControlCommand`, pairing, activation skip, route block, और sender
   block ladders हटाए।

3. Route descriptor builders, अपेक्षित plugin delta: -200 से -350।
   repeated route target और route sender descriptor assembly को core
   helpers में move करें। पहले targets: Google Chat, IRC, Microsoft Teams, Nextcloud Talk,
   Mattermost, Slack, Zalo, Zalo Personal।

4. Turn assembly sharing, अपेक्षित plugin delta: -250 से -450।
   simple inbound Plugins के लिए common route/session/envelope/dispatch sequencing का उपयोग करें।
   पहले targets: QA Channel, IRC, Nextcloud Talk, Zalo, Zalo Personal।

5. Core repack, अपेक्षित core delta: -300 से -700।
   Plugins के runtime projections को direct consume करने के बाद, one-use modules हटाएं,
   tiny files को वापस `runtime.ts` या focused siblings में merge करें, और SDK
   compatibility files को bundled hot paths से अलग रखें।

6. Test pruning, अपेक्षित test delta: -300 से -600।
   उन tests को हटाएं जो केवल removed wrapper shapes assert करते हैं। command denial,
   group fallback, origin-subject matching, activation skip,
   access groups, pairing, और redaction के लिए behavior tests रखें।

इन waves के बाद अपेक्षित न्यूनतम landing shape:

```text
plugin production     <= -1,500
core production       about +1,800 to +2,200 before final repack
tests                 <= +500
total                 <= +2,000
```

## न ले जाएं

प्लेटफ़ॉर्म config defaults, setup UX, doctor/fix copy, API lookups,
Slack owner-presence checks, Matrix alias/verification handling, Telegram
callback parsing, command syntax parsing, native command registration, reaction
payload parsing, pairing replies, command replies, acks, typing, media, history,
या logs को स्थानांतरित न करें।

## सत्यापन

लक्षित स्थानीय लूप:

```sh
pnpm lint:extensions:no-deprecated-channel-access
pnpm test src/channels/message-access/message-access.test.ts src/plugin-sdk/channel-ingress-runtime.test.ts src/plugin-sdk/access-groups.test.ts
pnpm test extensions/<changed-plugin>/src/...
pnpm plugin-sdk:api:check
pnpm config:docs:check
pnpm check:docs
git diff --check
```

LOC रुझान बजट के भीतर आने के बाद व्यापक changed gates/full-suite प्रमाण के लिए Testbox का उपयोग करें।

प्रत्येक work package दर्ज करता है:

- श्रेणी के अनुसार पहले/बाद का LOC
- हटाए गए plugin wrappers
- नया core helper LOC, यदि कोई हो
- चलाए गए लक्षित tests
- शेष hotspot सूची

## निकास मानदंड

- bundled production imports में कोई deprecated channel-access या command-auth facades नहीं हैं
- compatibility code SDK/core seams तक सीमित है
- bundled plugins सीधे ingress projections या generic outcomes का उपभोग करते हैं
- plugin production LOC `origin/main` की तुलना में कम से कम 1,500 net negative है
- core production LOC `<= +1,500` है, या किसी भी अतिरिक्त का भुगतान किया गया है जबकि कुल `<= +2,000` रहता है
- representative tests redaction, route, command/event, activation,
  access-group, और channel-specific fallback behavior को कवर करते हैं
