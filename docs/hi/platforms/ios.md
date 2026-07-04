---
read_when:
    - iOS Node को पेयर करना या फिर से कनेक्ट करना
    - स्रोत से iOS ऐप चलाना
    - Gateway डिस्कवरी या कैनवास कमांड्स की डीबगिंग
summary: 'iOS Node ऐप: Gateway से कनेक्ट करना, पेयरिंग, कैनवास, और समस्या निवारण'
title: iOS ऐप
x-i18n:
    generated_at: "2026-07-04T18:00:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ad6d272518b36564562256f55ffc320c0c4d2b954914ac73c23e450fa7acee0b
    source_path: platforms/ios.md
    workflow: 16
---

उपलब्धता: iPhone ऐप बिल्ड किसी रिलीज़ के लिए सक्षम होने पर Apple चैनलों के माध्यम से वितरित किए जाते हैं। स्थानीय डेवलपमेंट बिल्ड स्रोत से भी चल सकते हैं।

## यह क्या करता है

- WebSocket पर Gateway से कनेक्ट करता है (LAN या tailnet)।
- नोड क्षमताएं उजागर करता है: Canvas, स्क्रीन स्नैपशॉट, Camera कैप्चर, Location, Talk मोड, Voice wake।
- `node.invoke` कमांड प्राप्त करता है और नोड स्थिति इवेंट रिपोर्ट करता है।

## आवश्यकताएं

- किसी अन्य डिवाइस पर चल रहा Gateway (macOS, Linux, या WSL2 के माध्यम से Windows)।
- नेटवर्क पथ:
  - Bonjour के माध्यम से वही LAN, **या**
  - unicast DNS-SD के माध्यम से tailnet (उदाहरण डोमेन: `openclaw.internal.`), **या**
  - मैनुअल होस्ट/पोर्ट (fallback)।

## त्वरित शुरुआत (पेयर + कनेक्ट)

1. ऐसे रूट के साथ authenticated Gateway शुरू करें, जिस तक आपका फोन पहुंच सके। Tailscale
   Serve अनुशंसित रिमोट पथ है:

```bash
openclaw gateway --port 18789 --tailscale serve
```

विश्वसनीय same-LAN सेटअप के लिए, इसके बजाय authenticated `gateway.bind: "lan"`
का उपयोग करें। डिफ़ॉल्ट loopback bind फोन से पहुंच योग्य नहीं है। यदि
Gateway अभी तक कॉन्फ़िगर नहीं किया गया है, तो पहले `openclaw onboard` चलाएं ताकि setup-code
बनाने के लिए token या password auth पथ हो।

2. [Control UI](/hi/web/control-ui) खोलें, **नोड्स** चुनें, और
   **डिवाइस** कार्ड में **मोबाइल डिवाइस पेयर करें** पर क्लिक करें।

3. iOS ऐप में, **सेटिंग्स** → **Gateway** खोलें, QR कोड स्कैन करें (या
   setup code पेस्ट करें), और कनेक्ट करें।

4. आधिकारिक ऐप अपने-आप कनेक्ट हो जाता है। यदि **डिवाइस** कोई pending
   अनुरोध दिखाता है, तो उसे approve करने से पहले उसकी role और scopes की समीक्षा करें।

Control UI बटन के लिए `operator.admin` के साथ पहले से paired session आवश्यक है।
टर्मिनल fallback के रूप में, iOS ऐप में कोई discovered gateway चुनें (या
Manual Host सक्षम करें और host/port दर्ज करें), फिर Gateway host पर अनुरोध approve करें:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

यदि ऐप बदली हुई auth जानकारी (role/scopes/public key) के साथ pairing फिर से प्रयास करता है,
तो पिछला pending अनुरोध supersede हो जाता है और नया `requestId` बनाया जाता है।
approval से पहले `openclaw devices list` फिर से चलाएं।

वैकल्पिक: यदि iOS नोड हमेशा कड़े नियंत्रण वाले subnet से कनेक्ट करता है, तो आप
explicit CIDRs या exact IPs के साथ first-time node auto-approval में opt in कर सकते हैं:

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

यह डिफ़ॉल्ट रूप से disabled है। यह केवल बिना requested scopes वाली ताज़ा `role: node` pairing पर लागू होता है।
Operator/browser pairing और किसी भी role, scope, metadata, या
public-key बदलाव के लिए अभी भी manual approval आवश्यक है।

5. कनेक्शन verify करें:

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## आधिकारिक बिल्ड के लिए relay-backed push

आधिकारिक रूप से वितरित iOS बिल्ड raw APNs token को gateway पर प्रकाशित करने के बजाय external push relay का उपयोग करते हैं।

public release lane से आने वाले आधिकारिक App Store बिल्ड `https://ios-push-relay.openclaw.ai` पर hosted relay का उपयोग करते हैं।

Custom relay deployments के लिए जानबूझकर अलग iOS build/deployment पथ की आवश्यकता होती है, जिसकी relay URL gateway relay URL से मेल खाती हो। public App Store release lane custom relay URL overrides स्वीकार नहीं करता। यदि आप custom relay build का उपयोग कर रहे हैं, तो matching gateway relay URL सेट करें:

```json5
{
  gateway: {
    push: {
      apns: {
        relay: {
          baseUrl: "https://relay.example.com",
        },
      },
    },
  },
}
```

flow कैसे काम करता है:

- iOS ऐप App Attest और StoreKit app transaction JWS का उपयोग करके relay के साथ register करता है।
- relay एक opaque relay handle और registration-scoped send grant लौटाता है।
- iOS ऐप paired gateway identity fetch करता है और उसे relay registration में शामिल करता है, इसलिए relay-backed registration उस विशिष्ट gateway को delegated होती है।
- ऐप उस relay-backed registration को `push.apns.register` के साथ paired gateway को forward करता है।
- gateway `push.test`, background wakes, और wake nudges के लिए उस stored relay handle का उपयोग करता है।
- Custom gateway relay URLs को iOS build में baked relay URL से मेल खाना चाहिए।
- यदि ऐप बाद में किसी अलग gateway या अलग relay base URL वाले build से कनेक्ट करता है, तो वह पुराने binding को reuse करने के बजाय relay registration refresh करता है।

इस पथ के लिए gateway को किन चीज़ों की **आवश्यकता नहीं** है:

- कोई deployment-wide relay token नहीं।
- आधिकारिक App Store relay-backed sends के लिए कोई direct APNs key नहीं।

अपेक्षित operator flow:

1. आधिकारिक iOS ऐप install करें।
2. वैकल्पिक: gateway पर `gateway.push.apns.relay.baseUrl` केवल तब सेट करें जब जानबूझकर अलग custom relay build का उपयोग कर रहे हों।
3. ऐप को gateway से pair करें और उसे connecting पूरा करने दें।
4. ऐप APNs token मिलने, operator session connected होने, और relay registration सफल होने के बाद अपने-आप `push.apns.register` publish करता है।
5. इसके बाद, `push.test`, reconnect wakes, और wake nudges stored relay-backed registration का उपयोग कर सकते हैं।

## Background alive beacons

जब iOS silent push, background refresh, या significant-location event के लिए ऐप को wake करता है, तो ऐप
एक छोटा node reconnect प्रयास करता है और फिर `event: "node.presence.alive"` के साथ `node.event` call करता है।
Gateway इसे paired node/device metadata पर `lastSeenAtMs`/`lastSeenReason` के रूप में केवल
authenticated node device identity ज्ञात होने के बाद record करता है।

ऐप background wake को सफलतापूर्वक recorded केवल तब मानता है जब gateway response में
`handled: true` शामिल हो। पुराने gateways `{ "ok": true }` के साथ `node.event` acknowledge कर सकते हैं; वह response
compatible है, लेकिन durable last-seen update के रूप में count नहीं होता।

Compatibility note:

- `OPENCLAW_APNS_RELAY_BASE_URL` अभी भी gateway के लिए temporary env override के रूप में काम करता है।
- public App Store release lane iOS builds के लिए `OPENCLAW_PUSH_RELAY_BASE_URL` reject करता है।

## Authentication और trust flow

relay दो constraints enforce करने के लिए मौजूद है, जिन्हें direct APNs-on-gateway
आधिकारिक iOS builds के लिए प्रदान नहीं कर सकता:

- केवल Apple के माध्यम से वितरित genuine OpenClaw iOS builds hosted relay का उपयोग कर सकते हैं।
- gateway केवल उन iOS devices के लिए relay-backed pushes भेज सकता है जो उसी विशिष्ट
  gateway के साथ paired हैं।

hop by hop:

1. `iOS app -> gateway`
   - ऐप पहले सामान्य Gateway auth flow के माध्यम से gateway के साथ pair करता है।
   - इससे ऐप को authenticated node session और authenticated operator session मिलता है।
   - operator session का उपयोग `gateway.identity.get` call करने के लिए किया जाता है।

2. `iOS app -> relay`
   - ऐप HTTPS पर relay registration endpoints call करता है।
   - Registration में App Attest proof और StoreKit app transaction JWS शामिल होते हैं।
   - relay bundle ID, App Attest proof, और Apple distribution proof validate करता है, और
     official/production distribution path आवश्यक करता है।
   - यही local Xcode/dev builds को hosted relay का उपयोग करने से रोकता है। local build
     signed हो सकता है, लेकिन वह relay द्वारा अपेक्षित official Apple distribution proof satisfy नहीं करता।

3. `gateway identity delegation`
   - relay registration से पहले, ऐप paired gateway identity को
     `gateway.identity.get` से fetch करता है।
   - ऐप उस gateway identity को relay registration payload में शामिल करता है।
   - relay एक relay handle और registration-scoped send grant लौटाता है, जो
     उस gateway identity को delegated होते हैं।

4. `gateway -> relay`
   - gateway `push.apns.register` से relay handle और send grant store करता है।
   - `push.test`, reconnect wakes, और wake nudges पर, gateway send request को अपनी
     device identity से sign करता है।
   - relay stored send grant और gateway signature, दोनों को registration से delegated
     gateway identity के विरुद्ध verify करता है।
   - कोई दूसरा gateway उस stored registration को reuse नहीं कर सकता, भले ही उसे handle किसी तरह मिल जाए।

5. `relay -> APNs`
   - relay production APNs credentials और official build के raw APNs token का owner होता है।
   - gateway relay-backed official builds के लिए raw APNs token कभी store नहीं करता।
   - relay paired gateway की ओर से APNs को final push भेजता है।

यह design क्यों बनाया गया:

- production APNs credentials को user gateways से बाहर रखने के लिए।
- gateway पर raw official-build APNs tokens store करने से बचने के लिए।
- hosted relay usage को केवल official OpenClaw iOS builds के लिए allow करने के लिए।
- एक gateway को किसी अलग gateway के owned iOS devices पर wake pushes भेजने से रोकने के लिए।

Local/manual builds direct APNs पर बने रहते हैं। यदि आप relay के बिना उन builds को test कर रहे हैं, तो
gateway को अभी भी direct APNs credentials की आवश्यकता है:

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

ये gateway-host runtime env vars हैं, Fastlane settings नहीं। `apps/ios/fastlane/.env` केवल
App Store Connect auth जैसे `APP_STORE_CONNECT_KEY_ID` और
`APP_STORE_CONNECT_ISSUER_ID` store करता है; यह local iOS builds के लिए direct APNs delivery configure नहीं करता।

अनुशंसित gateway-host storage:

```bash
mkdir -p ~/.openclaw/credentials/apns
chmod 700 ~/.openclaw/credentials/apns
mv /path/to/AuthKey_KEYID.p8 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
chmod 600 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
export OPENCLAW_APNS_PRIVATE_KEY_PATH="$HOME/.openclaw/credentials/apns/AuthKey_KEYID.p8"
```

`.p8` file commit न करें या उसे repo checkout के अंदर न रखें।

## Discovery paths

### Bonjour (LAN)

iOS ऐप `local.` पर `_openclaw-gw._tcp` browse करता है और, configure होने पर, वही
wide-area DNS-SD discovery domain भी। Same-LAN gateways `local.` से अपने-आप दिखाई देते हैं;
cross-network discovery beacon type बदले बिना configured wide-area domain का उपयोग कर सकती है।

### Tailnet (cross-network)

यदि mDNS blocked है, तो unicast DNS-SD zone (कोई domain चुनें; उदाहरण:
`openclaw.internal.`) और Tailscale split DNS का उपयोग करें।
CoreDNS example के लिए [Bonjour](/hi/gateway/bonjour) देखें।

### Manual host/port

Settings में, **मैनुअल होस्ट** सक्षम करें और gateway host + port दर्ज करें (default `18789`)।

## Canvas + A2UI

iOS node WKWebView canvas render करता है। इसे drive करने के लिए `node.invoke` का उपयोग करें:

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

नोट्स:

- Gateway canvas host `/__openclaw__/canvas/` और `/__openclaw__/a2ui/` serve करता है।
- यह Gateway HTTP server से serve किया जाता है (`gateway.port` के समान port, default `18789`)।
- iOS node built-in scaffold को connected default view के रूप में रखता है। `canvas.a2ui.push` और `canvas.a2ui.reset` bundled app-owned A2UI page का उपयोग करते हैं।
- Remote Gateway A2UI pages iOS पर render-only हैं; native A2UI button actions केवल bundled app-owned pages से accepted हैं।
- `canvas.navigate` और `{"url":""}` के साथ built-in scaffold पर लौटें।

## Computer Use संबंध

iOS ऐप एक mobile node surface है, Codex Computer Use backend नहीं। Codex
Computer Use और `cua-driver mcp` MCP tools के माध्यम से local macOS desktop को control करते हैं;
iOS ऐप OpenClaw node commands जैसे `canvas.*`, `camera.*`, `screen.*`, `location.*`, और `talk.*` के माध्यम से
iPhone capabilities expose करता है।

Agents अब भी node commands invoke करके OpenClaw के माध्यम से iOS ऐप operate कर सकते हैं,
लेकिन वे calls gateway node protocol से गुजरते हैं और iOS foreground/background limits का पालन करते हैं।
local desktop control के लिए [Codex Computer Use](/hi/plugins/codex-computer-use)
और iOS node capabilities के लिए इस page का उपयोग करें।

### Canvas eval / snapshot

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## Voice wake + talk mode

- वॉइस वेक और बातचीत मोड सेटिंग्स में उपलब्ध हैं।
- OpenAI realtime बातचीत `talk.realtime.transport` के `webrtc` होने पर क्लाइंट-स्वामित्व वाले WebRTC का उपयोग करती है; स्पष्ट `gateway-relay` कॉन्फ़िगरेशन Gateway-स्वामित्व वाला बना रहता है। देखें [बातचीत मोड](/hi/nodes/talk)।
- बातचीत-सक्षम iOS नोड `talk` क्षमता विज्ञापित करते हैं और
  `talk.ptt.start`, `talk.ptt.stop`, `talk.ptt.cancel`, और `talk.ptt.once` घोषित कर सकते हैं;
  Gateway भरोसेमंद बातचीत-सक्षम नोड के लिए उन push-to-talk कमांड को डिफ़ॉल्ट रूप से अनुमति देता है।
- iOS बैकग्राउंड ऑडियो को निलंबित कर सकता है; ऐप सक्रिय न होने पर वॉइस सुविधाओं को सर्वोत्तम-प्रयास मानें।

## सामान्य त्रुटियां

- `NODE_BACKGROUND_UNAVAILABLE`: iOS ऐप को अग्रभूमि में लाएं (कैनवास/कैमरा/स्क्रीन कमांड के लिए यह आवश्यक है)।
- `A2UI_HOST_UNAVAILABLE`: बंडल किया गया A2UI पेज ऐप WebView में उपलब्ध नहीं था; ऐप को स्क्रीन टैब पर अग्रभूमि में रखें और फिर से प्रयास करें।
- पेयरिंग प्रॉम्प्ट कभी दिखाई नहीं देता: `openclaw devices list` चलाएं और मैन्युअल रूप से स्वीकृत करें।
- फिर से इंस्टॉल करने के बाद रीकनेक्ट विफल होता है: Keychain पेयरिंग टोकन साफ़ कर दिया गया था; नोड को फिर से पेयर करें।

## संबंधित दस्तावेज़

- [पेयरिंग](/hi/channels/pairing)
- [डिस्कवरी](/hi/gateway/discovery)
- [Bonjour](/hi/gateway/bonjour)
