---
read_when:
    - iOS node को पेयर या फिर से कनेक्ट करना
    - स्रोत से iOS ऐप चलाना
    - Gateway खोज या कैनवास कमांड डीबग करना
summary: 'iOS Node ऐप: Gateway से कनेक्ट करना, पेयरिंग, कैनवास, और समस्या निवारण'
title: iOS ऐप
x-i18n:
    generated_at: "2026-06-28T23:27:17Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1a93381fd2b95316e05a555bee45b9aed5572679b4b1f10f7f9e40c1a69faf17
    source_path: platforms/ios.md
    workflow: 16
---

उपलब्धता: iPhone ऐप बिल्ड किसी रिलीज़ के लिए सक्षम होने पर Apple चैनलों के माध्यम से वितरित किए जाते हैं। स्थानीय विकास बिल्ड स्रोत से भी चल सकते हैं।

## यह क्या करता है

- WebSocket (LAN या tailnet) पर Gateway से कनेक्ट करता है।
- नोड क्षमताएं उजागर करता है: Canvas, Screen snapshot, Camera capture, Location, Talk mode, Voice wake।
- `node.invoke` कमांड प्राप्त करता है और नोड स्थिति इवेंट रिपोर्ट करता है।

## आवश्यकताएं

- किसी अन्य डिवाइस (macOS, Linux, या WSL2 के माध्यम से Windows) पर चल रहा Gateway।
- नेटवर्क पथ:
  - Bonjour के माध्यम से वही LAN, **या**
  - unicast DNS-SD के माध्यम से tailnet (उदाहरण डोमेन: `openclaw.internal.`), **या**
  - मैन्युअल होस्ट/पोर्ट (fallback).

## त्वरित शुरुआत (पेयर + कनेक्ट)

1. Gateway शुरू करें:

```bash
openclaw gateway --port 18789
```

2. iOS ऐप में, Settings खोलें और खोजे गए Gateway को चुनें (या Manual Host सक्षम करें और होस्ट/पोर्ट दर्ज करें)।

3. Gateway होस्ट पर पेयरिंग अनुरोध स्वीकृत करें:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

यदि ऐप बदले हुए auth विवरण (role/scopes/public key) के साथ पेयरिंग दोबारा प्रयास करता है,
तो पिछला लंबित अनुरोध बदल दिया जाता है और नया `requestId` बनाया जाता है।
स्वीकृति से पहले `openclaw devices list` फिर से चलाएं।

वैकल्पिक: यदि iOS नोड हमेशा कड़ाई से नियंत्रित subnet से कनेक्ट होता है, तो आप
स्पष्ट CIDR या सटीक IP के साथ पहली बार के नोड auto-approval को opt in कर सकते हैं:

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

यह डिफ़ॉल्ट रूप से अक्षम है। यह केवल बिना अनुरोधित scopes वाली नई `role: node` पेयरिंग पर लागू होता है। Operator/browser पेयरिंग और कोई भी role, scope, metadata, या
public-key परिवर्तन फिर भी मैन्युअल स्वीकृति मांगता है।

4. कनेक्शन सत्यापित करें:

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## आधिकारिक बिल्ड के लिए relay-backed push

आधिकारिक रूप से वितरित iOS बिल्ड raw APNs token को Gateway पर प्रकाशित करने के बजाय बाहरी push relay का उपयोग करते हैं।

सार्वजनिक App Store रिलीज़ lane से आधिकारिक/TestFlight बिल्ड `https://ios-push-relay.openclaw.ai` पर hosted relay का उपयोग करते हैं।

Custom relay deployments के लिए जानबूझकर अलग iOS build/deployment path चाहिए, जिसका relay URL Gateway relay URL से मेल खाता हो। सार्वजनिक App Store release lane custom relay URL overrides स्वीकार नहीं करता। यदि आप custom relay build का उपयोग कर रहे हैं, तो matching Gateway relay URL सेट करें:

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

- iOS ऐप App Attest और StoreKit app transaction JWS का उपयोग करके relay के साथ पंजीकरण करता है।
- relay एक opaque relay handle और registration-scoped send grant लौटाता है।
- iOS ऐप paired Gateway identity fetch करता है और उसे relay registration में शामिल करता है, ताकि relay-backed registration उसी विशिष्ट Gateway को delegated हो।
- ऐप उस relay-backed registration को `push.apns.register` के साथ paired Gateway को forward करता है।
- Gateway उस stored relay handle का उपयोग `push.test`, background wakes, और wake nudges के लिए करता है।
- Custom Gateway relay URLs का iOS build में baked relay URL से मेल खाना आवश्यक है।
- यदि ऐप बाद में किसी अलग Gateway या अलग relay base URL वाले build से कनेक्ट करता है, तो वह पुराने binding को reuse करने के बजाय relay registration refresh करता है।

इस path के लिए Gateway को जिन चीज़ों की **आवश्यकता नहीं** होती:

- कोई deployment-wide relay token नहीं।
- आधिकारिक/TestFlight relay-backed sends के लिए कोई direct APNs key नहीं।

अपेक्षित operator flow:

1. आधिकारिक/TestFlight iOS build इंस्टॉल करें।
2. वैकल्पिक: Gateway पर `gateway.push.apns.relay.baseUrl` केवल तब सेट करें जब जानबूझकर अलग custom relay build का उपयोग कर रहे हों।
3. ऐप को Gateway से pair करें और उसे connecting पूरा करने दें।
4. APNs token मिलने, operator session connected होने, और relay registration सफल होने के बाद ऐप अपने-आप `push.apns.register` प्रकाशित करता है।
5. इसके बाद, `push.test`, reconnect wakes, और wake nudges stored relay-backed registration का उपयोग कर सकते हैं।

## Background alive beacons

जब iOS ऐप को silent push, background refresh, या significant-location event के लिए जगाता है, तो ऐप
एक छोटा node reconnect प्रयास करता है और फिर `event: "node.presence.alive"` के साथ `node.event` कॉल करता है।
Authenticated node device identity ज्ञात होने के बाद ही Gateway इसे paired node/device metadata पर
`lastSeenAtMs`/`lastSeenReason` के रूप में रिकॉर्ड करता है।

ऐप background wake को सफलतापूर्वक recorded केवल तब मानता है जब Gateway response में
`handled: true` शामिल हो। पुराने Gateways `{ "ok": true }` के साथ `node.event` acknowledge कर सकते हैं; वह response
compatible है लेकिन durable last-seen update के रूप में नहीं गिना जाता।

Compatibility note:

- `OPENCLAW_APNS_RELAY_BASE_URL` अब भी Gateway के लिए temporary env override के रूप में काम करता है।
- सार्वजनिक App Store release lane iOS builds के लिए `OPENCLAW_PUSH_RELAY_BASE_URL` को reject करता है।

## Authentication और trust flow

relay दो constraints लागू करने के लिए मौजूद है, जिन्हें direct APNs-on-Gateway
आधिकारिक iOS builds के लिए प्रदान नहीं कर सकता:

- Apple के माध्यम से वितरित genuine OpenClaw iOS builds ही hosted relay का उपयोग कर सकते हैं।
- Gateway relay-backed pushes केवल उन iOS devices के लिए भेज सकता है जिन्होंने उसी विशिष्ट
  Gateway के साथ pair किया हो।

Hop by hop:

1. `iOS app -> gateway`
   - ऐप पहले सामान्य Gateway auth flow के माध्यम से Gateway के साथ pair करता है।
   - इससे ऐप को authenticated node session और authenticated operator session मिलता है।
   - operator session का उपयोग `gateway.identity.get` कॉल करने के लिए किया जाता है।

2. `iOS app -> relay`
   - ऐप HTTPS पर relay registration endpoints कॉल करता है।
   - Registration में App Attest proof और StoreKit app transaction JWS शामिल होता है।
   - relay bundle ID, App Attest proof, और Apple distribution proof validate करता है, और
     official/production distribution path की आवश्यकता रखता है।
   - यही local Xcode/dev builds को hosted relay का उपयोग करने से रोकता है। local build
     signed हो सकता है, लेकिन वह relay द्वारा अपेक्षित official Apple distribution proof को satisfy नहीं करता।

3. `gateway identity delegation`
   - relay registration से पहले, ऐप paired Gateway identity को
     `gateway.identity.get` से fetch करता है।
   - ऐप उस Gateway identity को relay registration payload में शामिल करता है।
   - relay एक relay handle और registration-scoped send grant लौटाता है, जो
     उस Gateway identity को delegated होते हैं।

4. `gateway -> relay`
   - Gateway `push.apns.register` से relay handle और send grant store करता है।
   - `push.test`, reconnect wakes, और wake nudges पर, Gateway अपने
     device identity के साथ send request sign करता है।
   - relay stored send grant और Gateway signature, दोनों को registration से delegated
     Gateway identity के विरुद्ध verify करता है।
   - कोई दूसरा Gateway उस stored registration को reuse नहीं कर सकता, भले ही वह किसी तरह handle प्राप्त कर ले।

5. `relay -> APNs`
   - relay official build के लिए production APNs credentials और raw APNs token own करता है।
   - relay-backed official builds के लिए Gateway raw APNs token कभी store नहीं करता।
   - relay paired Gateway की ओर से अंतिम push APNs को भेजता है।

यह design क्यों बनाया गया:

- production APNs credentials को user Gateways से बाहर रखने के लिए।
- Gateway पर raw official-build APNs tokens store करने से बचने के लिए।
- hosted relay usage को केवल official/TestFlight OpenClaw builds के लिए अनुमति देने के लिए।
- एक Gateway को किसी अलग Gateway के स्वामित्व वाले iOS devices को wake pushes भेजने से रोकने के लिए।

Local/manual builds direct APNs पर रहते हैं। यदि आप relay के बिना उन builds का testing कर रहे हैं, तो
Gateway को अब भी direct APNs credentials चाहिए:

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

ये Gateway-host runtime env vars हैं, Fastlane settings नहीं। `apps/ios/fastlane/.env` केवल
App Store Connect / TestFlight auth जैसे `APP_STORE_CONNECT_KEY_ID` और
`APP_STORE_CONNECT_ISSUER_ID` store करता है; यह local iOS builds के लिए direct APNs delivery configure नहीं करता।

Recommended Gateway-host storage:

```bash
mkdir -p ~/.openclaw/credentials/apns
chmod 700 ~/.openclaw/credentials/apns
mv /path/to/AuthKey_KEYID.p8 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
chmod 600 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
export OPENCLAW_APNS_PRIVATE_KEY_PATH="$HOME/.openclaw/credentials/apns/AuthKey_KEYID.p8"
```

`.p8` file commit न करें या उसे repo checkout के अंतर्गत न रखें।

## Discovery paths

### Bonjour (LAN)

iOS ऐप `local.` पर `_openclaw-gw._tcp` browse करता है और, configured होने पर, वही
wide-area DNS-SD discovery domain भी। Same-LAN Gateways `local.` से अपने-आप दिखाई देते हैं;
cross-network discovery beacon type बदले बिना configured wide-area domain का उपयोग कर सकती है।

### Tailnet (cross-network)

यदि mDNS blocked है, तो unicast DNS-SD zone (एक domain चुनें; उदाहरण:
`openclaw.internal.`) और Tailscale split DNS का उपयोग करें।
CoreDNS example के लिए [Bonjour](/hi/gateway/bonjour) देखें।

### Manual host/port

Settings में, **Manual Host** सक्षम करें और Gateway host + port दर्ज करें (default `18789`)।

## Canvas + A2UI

iOS node एक WKWebView canvas render करता है। इसे drive करने के लिए `node.invoke` का उपयोग करें:

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

Notes:

- Gateway canvas host `/__openclaw__/canvas/` और `/__openclaw__/a2ui/` serve करता है।
- यह Gateway HTTP server से serve होता है (`gateway.port` जैसा ही port, default `18789`)।
- iOS node built-in scaffold को connected default view के रूप में रखता है। `canvas.a2ui.push` और `canvas.a2ui.reset` bundled app-owned A2UI page का उपयोग करते हैं।
- Remote Gateway A2UI pages iOS पर render-only हैं; native A2UI button actions केवल bundled app-owned pages से स्वीकार किए जाते हैं।
- `canvas.navigate` और `{"url":""}` के साथ built-in scaffold पर वापस जाएं।

## Computer Use संबंध

iOS ऐप एक mobile node surface है, Codex Computer Use backend नहीं। Codex
Computer Use और `cua-driver mcp` MCP tools के माध्यम से local macOS desktop को control करते हैं;
iOS ऐप OpenClaw node commands के माध्यम से iPhone capabilities expose करता है
जैसे `canvas.*`, `camera.*`, `screen.*`, `location.*`, और `talk.*`।

Agents अब भी node commands invoke करके OpenClaw के माध्यम से iOS ऐप operate कर सकते हैं,
लेकिन वे calls Gateway node protocol से गुजरती हैं और iOS foreground/background limits का पालन करती हैं। local desktop control के लिए [Codex Computer Use](/hi/plugins/codex-computer-use)
और iOS node capabilities के लिए यह page उपयोग करें।

### Canvas eval / snapshot

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## Voice wake + talk mode

- Voice wake और talk mode Settings में उपलब्ध हैं।
- Talk-capable iOS nodes `talk` capability advertise करते हैं और
  `talk.ptt.start`, `talk.ptt.stop`, `talk.ptt.cancel`, और `talk.ptt.once` declare कर सकते हैं;
  Gateway trusted Talk-capable nodes के लिए उन push-to-talk commands को default रूप से allow करता है।
- iOS background audio suspend कर सकता है; ऐप active न होने पर voice features को best-effort मानें।

## Common errors

- `NODE_BACKGROUND_UNAVAILABLE`: iOS ऐप को foreground में लाएं (canvas/camera/screen commands को इसकी आवश्यकता होती है)।
- `A2UI_HOST_UNAVAILABLE`: bundled A2UI page ऐप WebView में reachable नहीं था; ऐप को Screen tab पर foregrounded रखें और retry करें।
- Pairing prompt कभी नहीं दिखता: `openclaw devices list` चलाएं और manually approve करें।
- Reinstall के बाद reconnect fail होता है: Keychain pairing token clear हो गया था; node को फिर से pair करें।

## Related docs

- [Pairing](/hi/channels/pairing)
- [Discovery](/hi/gateway/discovery)
- [Bonjour](/hi/gateway/bonjour)
