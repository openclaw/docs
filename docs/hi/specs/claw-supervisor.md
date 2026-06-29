---
read_when:
    - Codex फ्लीट पर्यवेक्षण डिज़ाइन करना
    - ऐसे OpenClaw टूल बनाना जो Codex सत्रों को पढ़ें, निर्देशित करें या प्रारंभ करें
    - पर्यवेक्षित Codex के लिए स्थानीय, Cloudflare, और VPS डिप्लॉयमेंट के बीच चयन
summary: OpenClaw द्वारा नियंत्रित Codex app-server सत्रों के लिए फ़्लीट पर्यवेक्षण योजना।
title: Claw पर्यवेक्षक
x-i18n:
    generated_at: "2026-06-29T00:13:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ecdd58730011c94796c6df1d757606aad7112d2f36f30921541ac7f5d46ad91f
    source_path: specs/claw-supervisor.md
    workflow: 16
---

# Claw पर्यवेक्षक

## लक्ष्य

Claw पर्यवेक्षक एक हमेशा चालू रहने वाले OpenClaw इंस्टेंस को सामान्य Codex उपयोगकर्ता अनुभव बदले बिना Codex सत्रों के बेड़े की निगरानी और संचालन करने देता है। कोई उपयोगकर्ता किसी होस्ट में SSH कर सकता है, Codex शुरू कर सकता है, TUI में काम कर सकता है, और फिर भी पर्यवेक्षक सत्र पढ़ सकता है, उसे दिशा दे सकता है, उसे बाधित कर सकता है, संबंधित सत्र शुरू कर सकता है, और हैंडऑफ़ स्वीकार कर सकता है। Codex सत्र MCP के माध्यम से OpenClaw में वापस कॉल भी कर सकते हैं।

## उत्पाद मॉडल

Codex प्राथमिक कार्य सतह बना रहता है। OpenClaw, Codex को किसी अपारदर्शी OpenClaw सबएजेंट के भीतर छिपाने के बजाय उसका पर्यवेक्षण करता है।

OpenClaw Plugin का नाम `codex-supervisor` है। `crabfleet` पुन: प्रयोज्य Plugin नाम के बजाय CRAB मशीनों के लिए डिप्लॉयमेंट
और होस्ट-बेड़ा प्रोफ़ाइल बना रहता है।

मॉडल की तीन भूमिकाएँ हैं:

- मानव-संलग्न Codex: साझा ऐप-सर्वर के माध्यम से लॉन्च किया गया सामान्य इंटरैक्टिव Codex TUI।
- स्वायत्त Codex: पर्यवेक्षक द्वारा शुरू किया गया Codex ऐप-सर्वर थ्रेड, जिससे कोई मानव बाद में जुड़ सकता है।
- पर्यवेक्षक Claw: बेड़ा स्थिति, ट्रांसक्रिप्ट पढ़ने, दिशा देने, बाधा डालने, सत्र शुरू करने, और हैंडऑफ़ के टूल्स वाला हमेशा चालू OpenClaw एजेंट।

OpenClaw आंतरिक रूप से अपनी मौजूदा सबएजेंट प्रणाली का उपयोग कर सकता है, लेकिन बाहरी अनुबंध एक Codex थ्रेड id वाला जुड़ने योग्य Codex सत्र है।

## आर्किटेक्चर

```text
user SSH session
  -> codex --remote unix://... or ws://...
      -> local codex app-server daemon
          <-> host sidecar / supervisor connector
              <-> OpenClaw fleet supervisor
                  <-> supervisor MCP exposed back to Codex
```

हर Codex-सक्षम होस्ट चलाता है:

- Codex ऐप-सर्वर डेमन।
- ऐसा लॉन्चर जो हमेशा इंटरैक्टिव Codex को `--remote` के साथ शुरू करता है।
- ऐसा कनेक्टर जो ऐप-सर्वर एंडपॉइंट और लाइव थ्रेड्स को पर्यवेक्षक के साथ पंजीकृत करता है।

पर्यवेक्षक चलाता है:

- एंडपॉइंट रजिस्ट्री।
- सत्र रजिस्ट्री।
- Codex ऐप-सर्वर JSON-RPC क्लाइंट पूल।
- Codex-से-Claw कॉल्स के लिए MCP सर्वर।
- Claw-से-Codex नियंत्रण के लिए OpenClaw टूल्स।
- स्वायत्त कार्रवाइयों, स्वीकृतियों, और लूप रोकथाम के लिए नीति इंजन।

## Codex ऐप-सर्वर अनुबंध

Codex ऐप-सर्वर APIs को canonical नियंत्रण plane के रूप में उपयोग करें:

- `initialize`, `initialized`
- `thread/loaded/list`
- `thread/list`
- `thread/read`
- `thread/resume`
- `thread/start`
- `turn/start`
- `turn/steer`
- `turn/interrupt`
- `model/list`

इंटरैक्टिव Codex को `codex --remote <endpoint>` के साथ लॉन्च किया जाना चाहिए ताकि TUI और पर्यवेक्षक उसी ऐप-सर्वर से जुड़ें। स्वतंत्र `codex exec` आज live-shared सत्र नहीं है; जब तक Codex `exec --remote` का समर्थन नहीं करता, स्वायत्त कार्य के लिए ऐप-सर्वर APIs का उपयोग करें।

## सत्र रजिस्ट्री

पर्यवेक्षक प्रत्येक देखे गए Codex थ्रेड के लिए एक रिकॉर्ड संग्रहीत करता है:

```json
{
  "sessionId": "codex-thread-id",
  "endpointId": "host-a",
  "host": "host-a.example",
  "workspace": "/workspace/repo",
  "repo": "owner/repo",
  "branch": "feature/example",
  "source": "vscode",
  "status": "idle",
  "humanAttached": true,
  "lastSeenAt": "2026-05-28T10:00:00.000Z",
  "summary": "Short working-state summary"
}
```

स्थानीय implementation अधिकांश fields को Codex थ्रेड metadata से derive कर सकता है। Fleet deployment को records को host identity, user attachment state, git state, और sidecar health के साथ enrich करना चाहिए।

## Codex के लिए MCP सतह

हर supervised Codex को `openclaw-codex-supervisor` नाम वाला MCP server मिलता है।

टूल्स:

- `codex_sessions_list`: दिखाई देने वाले Codex सत्रों की सूची बनाएँ।
- `codex_session_read`: एक ट्रांसक्रिप्ट पढ़ें।
- `codex_session_send`: idle thread को संदेश भेजें या active thread को दिशा दें।
- `codex_session_interrupt`: active turn को interrupt करें।
- `codex_endpoint_probe`: endpoint connectivity सत्यापित करें।
- `claw_report_progress`: वर्तमान task state को supervisor पर प्रकाशित करें।
- `claw_ask`: सहायता या delegation के लिए supervisor से पूछें।
- `codex_spawn`: नया autonomous Codex सत्र बनाएँ।
- `codex_handoff`: human या peer takeover का अनुरोध करें।

संसाधन:

- `codex://sessions`
- `codex://sessions/{sessionId}`
- `codex://sessions/{sessionId}/transcript`

## Claw नियंत्रण सतह

हमेशा चालू Claw को internal tools जैसे ही primitives मिलते हैं:

- sessions और endpoints की सूची बनाना
- transcripts पढ़ना
- text भेजना/दिशा देना
- active work को interrupt करना
- नए sessions शुरू करना
- sessions का सारांश बनाना और assign करना
- filtered group को instructions broadcast करना
- sessions को blocked, done, या abandoned के रूप में mark करना

Tool behavior:

- यदि target thread idle है, तो `codex_session_send` `turn/start` पर map होता है।
- यदि target thread active है और in-progress turn id visible है, तो यह `turn/steer` पर map होता है।
- यदि active turn पहचाना नहीं जा सकता, तो tool unrelated turn बनाने के बजाय fail closed करता है।
- Codex-exposed MCP write controls तब तक disabled रहते हैं जब तक trusted supervisor-only policy उन्हें enable न करे।
- Raw transcript reads तब तक disabled रहते हैं जब तक trusted supervisor-only policy उन्हें enable न करे।
- Autonomous approval defaults tool/file approvals को deny करते हैं जब तक explicit policy अन्यथा न कहे।

## लॉन्च flow

Interactive host login:

1. उपयोगकर्ता CRAB host में SSH करता है।
2. SSH service `codex app-server daemon start` शुरू करती है या verify करती है।
3. Login wrapper `codex --remote unix:// --cd <workspace>` लॉन्च करता है।
4. Host connector endpoint और loaded thread को register करता है।
5. Supervisor high-priority fleet event emit करता है: नया Codex session, workspace, human-attached state, current task preview।
6. Supervisor Claw तुरंत read और steer कर सकता है।

Autonomous spawn:

1. Supervisor host और workspace चुनता है।
2. Host connector Codex app-server thread खोलता या resume करता है।
3. Supervisor task text और MCP config के साथ first turn शुरू करता है।
4. Session registry इसे autonomous और attachable mark करती है।
5. Codex द्वारा उस exact UX का समर्थन करने के बाद, human बाद में `codex --remote <endpoint> resume <threadId>` से attach कर सकता है, या उसी app-server पर current resume flow के माध्यम से।

## डिप्लॉयमेंट

Preferred control plane:

- Host connectors supervisor से outbound WebSocket connections बनाए रखते हैं।
- Supervisor state OpenClaw Gateway storage में रहती है।
- Codex app-server प्रत्येक host पर local रहता है; raw unauthenticated app-server को public internet पर कभी expose न करें।

Cloudflare viability:

- Registry, durable objects, WebSocket fan-in, lightweight event routing, और public MCP/gateway endpoints के लिए अच्छा।
- Direct private host control के लिए अपने आप पर्याप्त नहीं, क्योंकि Workers arbitrary private Unix sockets या local loopback app-servers को dial नहीं कर सकते।
- Cloudflare का उपयोग तब करें जब हर host connector outbound WebSocket पर phones home करता हो।

VPS fallback:

- जब long-lived process control, SSH tunnels, private network routing, या local filesystem access की जरूरत हो, तो Hetzner service का उपयोग करें।
- वही protocol रखें: host connectors outbound, supervisor registry central, Codex app-server local।

## सुरक्षा

- Default bind local Unix socket है।
- Remote app-server token या signed bearer auth का उपयोग करता है।
- Host connector scoped host token से supervisor के साथ authenticate करता है।
- Supervisor tools per-session policy enforce करते हैं: read, steer, interrupt, spawn, approval।
- Cross-agent messages में `originSessionId` शामिल होता है; self-echo drop कर दिया जाता है।
- Broadcast के लिए explicit filter और bounded target count आवश्यक है।
- Transcript reads OpenClaw boundary पर secrets redact करते हैं।
- Approval requests supervisor-originated turns के लिए default रूप से deny होती हैं जब तक policy उन्हें allow न करे।

## Implementation plan

Phase 1: Local supervisor MVP

- stdio proxy और WebSocket endpoints के लिए Codex app-server JSON-RPC client जोड़ें।
- supervisor endpoint/session registry जोड़ें।
- MCP tools जोड़ें: list, read, send, interrupt, probe।
- endpoints के लिए local env config जोड़ें।
- fake app-server tests और एक live local app-server smoke जोड़ें।

Phase 2: OpenClaw integration

- `codex-supervisor` Plugin में supervisor tools register करें।
- Supervisor MCP को Codex thread config में inject करें।
- agent context में session summaries जोड़ें।
- नए Codex threads दिखने पर event notifications जोड़ें।
- autonomous send/interrupt/spawn के लिए policy config जोड़ें।

Phase 3: Fleet connector

- Host sidecar app-server endpoint, host metadata, git/workspace metadata, और human attachment state register करता है।
- Cloudflare या VPS control plane के लिए outbound WebSocket connector जोड़ें।
- reconnect, Heartbeat, और stale-session cleanup जोड़ें।
- CRAB SSH launcher wrapper जोड़ें।

Phase 4: Autonomous operation

- spawn/resume/takeover flows जोड़ें।
- broadcast और delegation जोड़ें।
- progress reports और task-state summaries जोड़ें।
- loop prevention और rate limits जोड़ें।
- dashboard views जोड़ें।

Phase 5: Multi-Claw

- sessions को group के आधार पर shard करें।
- प्रत्येक session के लिए leadership/lease जोड़ें।
- audit log और replay जोड़ें।
- Claw groups के बीच escalation जोड़ें।

## Acceptance tests

- कोई human साझा app-server के माध्यम से Codex TUI लॉन्च करता है।
- Supervisor `thread/loaded/list` के माध्यम से live thread सूचीबद्ध करता है।
- Supervisor `thread/read` के माध्यम से transcript पढ़ता है।
- Supervisor `turn/start` के माध्यम से idle thread को text भेजता है।
- Supervisor `turn/steer` के माध्यम से active thread को steer करता है।
- Supervisor interrupt `turn/interrupt` के माध्यम से active turn रोकता है।
- Codex supervisor MCP को call करता है और peer sessions सूचीबद्ध करता है।
- Autonomous Codex spawn किया जाता है और बाद में human-attached होता है।
- Lost host connector sessions को history delete किए बिना stale mark करता है।

## खुले प्रश्न

- TUI के बिना spawn किए गए app-server thread के लिए exact Codex TUI attach UX।
- क्या Codex को headless live-shared runs के लिए `exec --remote` जोड़ना चाहिए।
- Durable state owner: OpenClaw Gateway DB, Cloudflare Durable Object, या VPS database।
- supervisor-originated turns के लिए approval policy granularity।
- कितना transcript summary हमेशा चालू Claw context में inject किया जाना चाहिए बनाम tool/resource के रूप में रखा जाना चाहिए।
