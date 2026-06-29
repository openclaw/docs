---
read_when:
    - macOS UI के बिना Node पेयरिंग अनुमोदन लागू करना
    - दूरस्थ नोड्स को अनुमोदित करने के लिए CLI फ्लो जोड़ना
    - Node प्रबंधन के साथ Gateway प्रोटोकॉल का विस्तार
summary: iOS और अन्य रिमोट नोड्स के लिए Gateway-स्वामित्व वाली नोड पेयरिंग (विकल्प B)
title: Gateway-स्वामित्व वाली पेयरिंग
x-i18n:
    generated_at: "2026-06-28T23:11:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: aefddafaef419fc59b04ee17dae8ef21685b4f514f4286530bf07362663a8996
    source_path: gateway/pairing.md
    workflow: 16
---

Gateway-स्वामित्व वाली पेयरिंग में, **Gateway** सत्य का स्रोत है कि किन नोड्स
को जुड़ने की अनुमति है। यूआई (macOS ऐप, भविष्य के क्लाइंट) केवल फ्रंटएंड हैं जो
लंबित अनुरोधों को अनुमोदित या अस्वीकार करते हैं.

**महत्वपूर्ण:** WS नोड्स `connect` के दौरान **डिवाइस पेयरिंग** (role `node`) का उपयोग करते हैं।
`node.pair.*` एक अलग पेयरिंग स्टोर है और WS हैंडशेक को गेट **नहीं** करता।
केवल वे क्लाइंट जो स्पष्ट रूप से `node.pair.*` कॉल करते हैं, इस फ्लो का उपयोग करते हैं.

## अवधारणाएँ

- **लंबित अनुरोध**: किसी नोड ने जुड़ने का अनुरोध किया; अनुमोदन आवश्यक है.
- **पेयर किया गया नोड**: जारी किए गए auth टोकन वाला अनुमोदित नोड.
- **ट्रांसपोर्ट**: Gateway WS endpoint अनुरोधों को फॉरवर्ड करता है लेकिन
  सदस्यता तय नहीं करता। (लेगेसी TCP bridge समर्थन हटा दिया गया है.)

## पेयरिंग कैसे काम करती है

1. कोई नोड Gateway WS से कनेक्ट होता है और पेयरिंग का अनुरोध करता है.
2. Gateway एक **लंबित अनुरोध** स्टोर करता है और `node.pair.requested` emit करता है.
3. आप अनुरोध को अनुमोदित या अस्वीकार करते हैं (CLI या UI).
4. अनुमोदन पर, Gateway एक **नया टोकन** जारी करता है (re-pair पर टोकन rotate होते हैं).
5. नोड टोकन का उपयोग करके फिर से कनेक्ट होता है और अब "paired" है.

लंबित अनुरोध **5 मिनट** के बाद अपने-आप समाप्त हो जाते हैं.

## CLI वर्कफ्लो (headless friendly)

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes status
openclaw nodes remove --node <id|name|ip>
openclaw nodes rename --node <id|name|ip> --name "Living Room iPad"
```

`nodes status` पेयर किए गए/कनेक्टेड नोड्स और उनकी क्षमताएँ दिखाता है.

## API सतह (gateway protocol)

इवेंट:

- `node.pair.requested` - जब नया लंबित अनुरोध बनाया जाता है तब emit होता है.
- `node.pair.resolved` - जब कोई अनुरोध अनुमोदित/अस्वीकृत/समाप्त होता है तब emit होता है.

मेथड:

- `node.pair.request` - लंबित अनुरोध बनाएँ या पुनः उपयोग करें.
- `node.pair.list` - लंबित + पेयर किए गए नोड्स सूचीबद्ध करें (`operator.pairing`).
- `node.pair.approve` - लंबित अनुरोध अनुमोदित करें (टोकन जारी करता है).
- `node.pair.reject` - लंबित अनुरोध अस्वीकार करें.
- `node.pair.remove` - पेयर किया गया नोड हटाएँ। डिवाइस-समर्थित पेयरिंग के लिए यह
  डिवाइस की `node` भूमिका revoke करता है: यह `devices/paired.json` को mutate करता है और
  उस डिवाइस के node-role sessions को अमान्य/डिस्कनेक्ट करता है। एक **mixed-role**
  डिवाइस (उदा. उसके पास `operator` भी है) अपनी row रखता है और केवल `node`
  भूमिका खोता है; node-only डिवाइस row delete हो जाती है। यह कोई matching legacy
  gateway-owned node pairing entry भी हटाता है। Authz: `operator.pairing` non-operator
  node rows हटा सकता है; किसी mixed-role डिवाइस पर अपनी **own** node role revoke करने वाले
  device-token caller को अतिरिक्त रूप से `operator.admin` चाहिए.
- `node.pair.verify` - `{ nodeId, token }` verify करें.

नोट्स:

- `node.pair.request` प्रति नोड idempotent है: बार-बार कॉल वही
  लंबित अनुरोध लौटाते हैं.
- उसी लंबित नोड के लिए दोहराए गए अनुरोध stored node metadata और operator visibility के लिए latest allowlisted declared command snapshot भी refresh करते हैं.
- अनुमोदन **हमेशा** fresh token बनाता है; `node.pair.request` से कभी कोई token return नहीं होता.
- Operator scope levels और approval-time checks का सारांश
  [ऑपरेटर स्कोप](/hi/gateway/operator-scopes) में है.
- auto-approval flows के लिए संकेत के रूप में अनुरोधों में `silent: true` शामिल हो सकता है.
- `node.pair.approve` अतिरिक्त approval scopes enforce करने के लिए लंबित अनुरोध के declared commands का उपयोग करता है:
  - commandless request: `operator.pairing`
  - non-exec command request: `operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which` request:
    `operator.pairing` + `operator.admin`

<Warning>
Node pairing trust और identity flow है, साथ ही token issuance भी है। यह प्रति नोड live node command surface को pin **नहीं** करता.

- Live node commands वही होते हैं जो node connect पर declare करता है, gateway की global node command policy (`gateway.nodes.allowCommands` और `denyCommands`) apply होने के बाद.
- Per-node `system.run` allow और ask policy node पर `exec.approvals.node.*` में रहती है, pairing record में नहीं.

</Warning>

## Node command gating (2026.3.31+)

<Warning>
**Breaking change:** `2026.3.31` से शुरू होकर, node commands तब तक disabled रहते हैं जब तक node pairing approve न हो। केवल device pairing अब declared node commands expose करने के लिए पर्याप्त नहीं है.
</Warning>

जब कोई node पहली बार connect करता है, pairing अपने-आप request होती है। जब तक pairing request approve नहीं होती, उस node से आने वाले सभी pending node commands filter हो जाते हैं और execute नहीं होंगे। Pairing approval के जरिए trust establish होने के बाद, node के declared commands normal command policy के अधीन available हो जाते हैं.

इसका अर्थ है:

- जो nodes पहले commands expose करने के लिए केवल device pairing पर निर्भर थे, उन्हें अब node pairing complete करनी होगी.
- Pairing approval से पहले queued commands drop हो जाते हैं, defer नहीं होते.

## Node event trust boundaries (2026.3.31+)

<Warning>
**Breaking change:** Node-originated runs अब reduced trusted surface पर रहते हैं.
</Warning>

Node-originated summaries और संबंधित session events intended trusted surface तक restricted हैं। Notification-driven या node-triggered flows जो पहले broader host या session tool access पर निर्भर थे, उन्हें adjustment की आवश्यकता हो सकती है। यह hardening सुनिश्चित करती है कि node events node की trust boundary से आगे host-level tool access में escalate नहीं हो सकते.

Durable node presence updates भी वही identity boundary follow करते हैं। `node.presence.alive` event
केवल authenticated node device sessions से accepted है और pairing metadata केवल तब update करता है जब
device/node identity पहले से paired हो। Self-declared `client.id` values last-seen state लिखने के लिए
पर्याप्त नहीं हैं.

## Auto-approval (macOS app)

macOS ऐप वैकल्पिक रूप से **silent approval** का प्रयास कर सकता है जब:

- request को `silent` mark किया गया हो, और
- app उसी user का उपयोग करके gateway host से SSH connection verify कर सके.

यदि silent approval fail होता है, तो यह normal "Approve/Reject" prompt पर वापस आ जाता है.

## Trusted-CIDR device auto-approval

`role: node` के लिए WS device pairing default रूप से manual रहती है। Private
node networks के लिए जहाँ Gateway पहले से network path पर trust करता है, operators
explicit CIDRs या exact IPs के साथ opt in कर सकते हैं:

```json5
{
  gateway: {
    nodes: {
      pairing: {
        autoApproveCidrs: ["192.168.1.0/24"],
      },
    },
  },
}
```

सुरक्षा सीमा:

- `gateway.nodes.pairing.autoApproveCidrs` unset होने पर disabled.
- कोई blanket LAN या private-network auto-approve mode मौजूद नहीं है.
- केवल fresh `role: node` device pairing, जिसमें requested scopes न हों, eligible है.
- Operator, browser, Control UI, और WebChat clients manual रहते हैं.
- Role, scope, metadata, और public-key upgrades manual रहते हैं.
- Same-host loopback trusted-proxy header paths eligible नहीं हैं क्योंकि उस
  path को local callers spoof कर सकते हैं.

## Metadata-upgrade auto-approval

जब पहले से paired device केवल non-sensitive metadata changes
(उदाहरण के लिए, display name या client platform hints) के साथ reconnect करता है, OpenClaw उसे
`metadata-upgrade` के रूप में treat करता है। Silent auto-approval narrow है: यह केवल
trusted non-browser local reconnects पर apply होता है, जिन्होंने local
या shared credentials का possession पहले ही prove किया हो, जिसमें OS
version metadata changes के बाद same-host native app reconnects शामिल हैं। Browser/Control UI clients और remote clients अभी भी
explicit re-approval flow का उपयोग करते हैं। Scope upgrades (read to write/admin) और
public key changes metadata-upgrade auto-approval के लिए eligible **नहीं** हैं -
वे explicit re-approval requests ही रहते हैं.

## QR pairing helpers

`/pair qr` pairing payload को structured media के रूप में render करता है ताकि mobile और
browser clients उसे सीधे scan कर सकें.

Device delete करने से उस
device id के लिए कोई भी stale pending pairing requests भी sweep हो जाते हैं, इसलिए revoke के बाद `nodes pending` orphaned rows नहीं दिखाता.

## Locality और forwarded headers

Gateway pairing किसी connection को loopback केवल तब treat करती है जब raw socket
और कोई upstream proxy evidence दोनों सहमत हों। यदि कोई request loopback पर आती है लेकिन
`Forwarded`, कोई `X-Forwarded-*`, या `X-Real-IP` header evidence लाती है, तो वह
forwarded-header evidence loopback locality claim को disqualify कर देता है। Pairing
path तब request को same-host connect मानकर silently treat करने के बजाय explicit approval
मांगता है। Operator auth पर equivalent rule के लिए [Trusted Proxy Auth](/hi/gateway/trusted-proxy-auth) देखें.

## Storage (local, private)

Pairing state Gateway state directory (default `~/.openclaw`) के अंतर्गत stored है:

- `~/.openclaw/nodes/paired.json`
- `~/.openclaw/nodes/pending.json`

यदि आप `OPENCLAW_STATE_DIR` override करते हैं, तो `nodes/` folder उसके साथ move होता है.

सुरक्षा नोट्स:

- Tokens secrets हैं; `paired.json` को sensitive मानें.
- Token rotate करने के लिए re-approval (या node entry delete करना) आवश्यक है.

## Transport behavior

- Transport **stateless** है; यह membership store नहीं करता.
- यदि Gateway offline है या pairing disabled है, तो nodes pair नहीं कर सकते.
- यदि Gateway remote mode में है, तो pairing फिर भी remote Gateway के store के विरुद्ध होती है.

## संबंधित

- [Channel pairing](/hi/channels/pairing)
- [Nodes](/hi/nodes)
- [Devices CLI](/hi/cli/devices)
