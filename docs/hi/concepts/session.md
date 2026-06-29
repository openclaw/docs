---
read_when:
    - आप सत्र रूटिंग और अलगाव को समझना चाहते हैं
    - आप बहु-उपयोगकर्ता सेटअप के लिए DM दायरा कॉन्फ़िगर करना चाहते हैं
    - आप दैनिक या निष्क्रिय सत्र रीसेट डीबग कर रहे हैं
summary: OpenClaw बातचीत सत्रों को कैसे प्रबंधित करता है
title: सत्र प्रबंधन
x-i18n:
    generated_at: "2026-06-28T23:03:37Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f65249b17c8b45f569531134471683e9f458015b02af29ddf4aa6e1e5c2eac05
    source_path: concepts/session.md
    workflow: 16
---

OpenClaw बातचीत को **सत्रों** में व्यवस्थित करता है। प्रत्येक संदेश को उसके स्रोत के आधार पर किसी
सत्र में रूट किया जाता है -- DMs, समूह चैट, Cron जॉब्स, आदि।

## संदेश कैसे रूट किए जाते हैं

| स्रोत           | व्यवहार                  |
| --------------- | ------------------------- |
| सीधे संदेश | डिफ़ॉल्ट रूप से साझा सत्र |
| समूह चैट     | प्रति समूह अलग        |
| रूम/चैनल  | प्रति रूम अलग         |
| Cron जॉब्स       | प्रत्येक रन के लिए नया सत्र     |
| Webhooks        | प्रति hook अलग         |

## DM अलगाव

डिफ़ॉल्ट रूप से, निरंतरता के लिए सभी DMs एक सत्र साझा करते हैं। यह
एकल-उपयोगकर्ता सेटअप के लिए ठीक है।

<Warning>
यदि कई लोग आपके एजेंट को संदेश भेज सकते हैं, तो DM अलगाव सक्षम करें। इसके बिना, सभी
उपयोगकर्ता वही बातचीत संदर्भ साझा करते हैं -- Alice के निजी संदेश
Bob को दिखाई देंगे।
</Warning>

**समाधान:**

```json5
{
  session: {
    dmScope: "per-channel-peer", // isolate by channel + sender
  },
}
```

अन्य विकल्प:

- `main` (डिफ़ॉल्ट) -- सभी DMs एक सत्र साझा करते हैं।
- `per-peer` -- प्रेषक के आधार पर अलग करें (चैनलों के पार)।
- `per-channel-peer` -- चैनल + प्रेषक के आधार पर अलग करें (अनुशंसित)।
- `per-account-channel-peer` -- खाते + चैनल + प्रेषक के आधार पर अलग करें।

<Tip>
यदि वही व्यक्ति कई चैनलों से आपसे संपर्क करता है, तो उनकी पहचानों को लिंक करने के लिए
`session.identityLinks` का उपयोग करें ताकि वे एक सत्र साझा करें।
</Tip>

### लिंक किए गए चैनल डॉक करें

Dock कमांड किसी उपयोगकर्ता को नया सत्र शुरू किए बिना मौजूदा direct-chat सत्र के reply route को
किसी दूसरे लिंक किए गए चैनल में ले जाने देते हैं। उदाहरण, कॉन्फ़िगरेशन और
समस्या निवारण के लिए [चैनल डॉकिंग](/hi/concepts/channel-docking) देखें।

`openclaw security audit` से अपना सेटअप सत्यापित करें।

## सत्र जीवनचक्र

सत्रों का पुनः उपयोग तब तक किया जाता है जब तक वे समाप्त नहीं हो जाते:

- **दैनिक रीसेट** (डिफ़ॉल्ट) -- Gateway होस्ट पर स्थानीय समयानुसार सुबह 4:00 बजे नया सत्र।
  दैनिक ताज़गी मौजूदा `sessionId` शुरू होने के समय पर आधारित होती है, बाद की
  metadata writes पर नहीं।
- **निष्क्रिय रीसेट** (वैकल्पिक) -- निष्क्रियता की अवधि के बाद नया सत्र। सेट करें
  `session.reset.idleMinutes`। निष्क्रिय ताज़गी अंतिम वास्तविक
  उपयोगकर्ता/चैनल इंटरैक्शन पर आधारित होती है, इसलिए Heartbeat, Cron, और exec सिस्टम इवेंट्स
  सत्र को जीवित नहीं रखते।
- **मैनुअल रीसेट** -- चैट में `/new` या `/reset` टाइप करें। `/new <model>` मॉडल भी
  बदलता है।

जब दैनिक और निष्क्रिय दोनों रीसेट कॉन्फ़िगर किए गए हों, तो जो पहले समाप्त होता है वही लागू होता है।
Heartbeat, Cron, exec, और अन्य सिस्टम-इवेंट टर्न सत्र metadata लिख सकते हैं,
लेकिन वे writes दैनिक या निष्क्रिय रीसेट ताज़गी को नहीं बढ़ाते। जब कोई रीसेट
सत्र को रोल करता है, तो पुराने सत्र के लिए queued सिस्टम-इवेंट नोटिस
हटा दिए जाते हैं ताकि पुराने background updates नए सत्र के पहले prompt के आगे
न जोड़े जाएँ।

सक्रिय provider-owned CLI सत्र वाले सत्रों को implicit
दैनिक डिफ़ॉल्ट द्वारा काटा नहीं जाता। जब उन सत्रों को timer पर समाप्त होना चाहिए, तो `/reset` उपयोग करें या `session.reset` स्पष्ट रूप से कॉन्फ़िगर करें।

## स्टेट कहाँ रहता है

सभी सत्र स्टेट का स्वामित्व **Gateway** के पास होता है। UI क्लाइंट सत्र डेटा के लिए Gateway से क्वेरी करते हैं।

- **Store:** `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- **Transcripts:** `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`

`sessions.json` अलग-अलग जीवनचक्र timestamps रखता है:

- `sessionStartedAt`: जब मौजूदा `sessionId` शुरू हुआ; दैनिक रीसेट इसका उपयोग करता है।
- `lastInteractionAt`: अंतिम उपयोगकर्ता/चैनल इंटरैक्शन जो निष्क्रिय lifetime को बढ़ाता है।
- `updatedAt`: अंतिम store-row mutation; listing और pruning के लिए उपयोगी, लेकिन
  दैनिक/निष्क्रिय रीसेट ताज़गी के लिए authoritative नहीं।

`sessionStartedAt` के बिना पुराने rows को उपलब्ध होने पर transcript JSONL
session header से resolve किया जाता है। यदि किसी पुराने row में `lastInteractionAt` भी नहीं है,
तो निष्क्रिय ताज़गी उस सत्र start time पर fallback करती है, बाद की bookkeeping
writes पर नहीं।

## सत्र रखरखाव

OpenClaw समय के साथ session storage को अपने आप सीमित रखता है। डिफ़ॉल्ट रूप से, यह
`enforce` मोड में चलता है और maintenance के दौरान cleanup लागू करता है। Store/files को बदले बिना क्या साफ़ किया जाएगा यह report करने के लिए
`session.maintenance.mode` को `"warn"` पर सेट करें:

```json5
{
  session: {
    maintenance: {
      mode: "enforce",
      pruneAfter: "30d",
      maxEntries: 500,
    },
  },
}
```

Production-size `maxEntries` सीमाओं के लिए, Gateway runtime writes एक छोटे high-water buffer का उपयोग करते हैं और batches में configured cap तक वापस साफ़ करते हैं। Gateway startup के दौरान session store reads entries को prune या cap नहीं करते। इससे हर startup या isolated Cron session पर full store cleanup चलाने से बचा जाता है। `openclaw sessions cleanup --enforce` cap को तुरंत लागू करता है।

Gateway model-run probe sessions डिफ़ॉल्ट रूप से short-lived होते हैं। सख्त explicit keys जैसे
`agent:*:explicit:model-run-<uuid>` से मेल खाने वाले rows fixed `24h`
retention का उपयोग करते हैं, लेकिन cleanup pressure-gated है: यह stale probe rows को केवल तब हटाता है जब
session-entry maintenance/cap pressure पहुँचता है। जब model-run cleanup चलता है,
तो यह broader stale-entry age cutoff और entry cap से पहले चलता है। सामान्य direct,
group, thread, Cron, hook, Heartbeat, ACP, और sub-agent sessions इस
24h retention को inherit नहीं करते।

Maintenance durable external conversation pointers को सुरक्षित रखता है, जिसमें group
sessions और thread-scoped chat sessions शामिल हैं, जबकि synthetic Cron,
hook, Heartbeat, ACP, और sub-agent entries को age out होने देता है।

यदि आपने पहले direct-message isolation उपयोग किया था और बाद में
`session.dmScope` को `main` पर वापस किया, तो stale peer-keyed DM rows को
`openclaw sessions cleanup --dry-run --fix-dm-scope` से preview करें। वही flag लागू करने पर
वे पुराने direct-DM rows retire हो जाते हैं और उनके transcripts deleted
archives के रूप में रखे जाते हैं।

`openclaw sessions cleanup --dry-run` से preview करें।

## सत्रों का निरीक्षण

- `openclaw status` -- session store path और हाल की गतिविधि।
- `openclaw sessions --json` -- सभी सत्र (`--active <minutes>` से filter करें)।
- चैट में `/status` -- context usage, model, और toggles।
- `/context list` -- system prompt में क्या है।

## आगे पढ़ें

- [सत्र Pruning](/hi/concepts/session-pruning) -- tool results को trim करना
- [Compaction](/hi/concepts/compaction) -- लंबी बातचीत को summarize करना
- [सत्र Tools](/hi/concepts/session-tool) -- cross-session work के लिए agent tools
- [सत्र प्रबंधन Deep Dive](/hi/reference/session-management-compaction) --
  store schema, transcripts, send policy, origin metadata, और advanced config
- [Multi-Agent](/hi/concepts/multi-agent) — agents के पार routing और session isolation
- [Background Tasks](/hi/automation/tasks) — detached work session references के साथ task records कैसे बनाता है
- [Channel Routing](/hi/channels/channel-routing) — inbound messages sessions में कैसे routed होते हैं

## संबंधित

- [सत्र pruning](/hi/concepts/session-pruning)
- [सत्र tools](/hi/concepts/session-tool)
- [Command queue](/hi/concepts/queue)
