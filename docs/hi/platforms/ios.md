---
read_when:
    - iOS नोड को पेयर करना या फिर से कनेक्ट करना
    - स्रोत से iOS ऐप चलाना
    - Gateway खोज या कैनवास कमांड डीबग करना
summary: 'iOS नोड ऐप: Gateway से कनेक्ट करना, पेयरिंग, कैनवास, और समस्या निवारण'
title: iOS ऐप
x-i18n:
    generated_at: "2026-07-02T22:34:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 150349a06488ecb36a4456d323738cca329c47d83ef6006e6f8de5e39ebb4902
    source_path: platforms/ios.md
    workflow: 16
---

उपलब्धता: किसी रिलीज़ के लिए सक्षम होने पर iPhone ऐप बिल्ड Apple चैनलों के माध्यम से वितरित किए जाते हैं। स्थानीय डेवलपमेंट बिल्ड स्रोत से भी चल सकते हैं।

## यह क्या करता है

- WebSocket पर Gateway से कनेक्ट करता है (LAN या tailnet)।
- नोड क्षमताएँ उपलब्ध कराता है: Canvas, Screen snapshot, Camera capture, Location, Talk mode, Voice wake।
- `node.invoke` कमांड प्राप्त करता है और नोड स्थिति इवेंट रिपोर्ट करता है।

## आवश्यकताएँ

- किसी दूसरे डिवाइस पर चलता हुआ Gateway (macOS, Linux, या WSL2 के माध्यम से Windows)।
- नेटवर्क पथ:
  - Bonjour के माध्यम से वही LAN, **या**
  - unicast DNS-SD के माध्यम से Tailnet (उदाहरण डोमेन: `openclaw.internal.`), **या**
  - मैन्युअल होस्ट/पोर्ट (fallback)।

## त्वरित शुरुआत (pair + connect)

1. Gateway शुरू करें:

```bash
openclaw gateway --port 18789
```

2. iOS ऐप में, Settings खोलें और खोजा गया Gateway चुनें (या Manual Host सक्षम करें और host/port दर्ज करें)।

3. Gateway होस्ट पर pairing अनुरोध मंज़ूर करें:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

यदि ऐप बदले हुए auth विवरणों (role/scopes/public key) के साथ pairing दोबारा आज़माता है,
तो पिछला लंबित अनुरोध supersede हो जाता है और नया `requestId` बनाया जाता है।
मंज़ूरी से पहले `openclaw devices list` फिर से चलाएँ।

वैकल्पिक: यदि iOS नोड हमेशा किसी सख्ती से नियंत्रित subnet से कनेक्ट होता है, तो आप
स्पष्ट CIDRs या exact IPs के साथ पहली बार के नोड auto-approval को opt in कर सकते हैं:

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

यह default रूप से अक्षम है। यह केवल ताज़ा `role: node` pairing पर लागू होता है, जिसमें
कोई requested scopes नहीं होते। Operator/browser pairing और किसी भी role, scope, metadata, या
public-key बदलाव के लिए अब भी मैन्युअल approval चाहिए।

4. कनेक्शन सत्यापित करें:

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## आधिकारिक बिल्ड के लिए relay-backed push

आधिकारिक रूप से वितरित iOS बिल्ड raw APNs token को Gateway पर प्रकाशित करने के बजाय बाहरी push relay का उपयोग करते हैं।

public release lane से आने वाले आधिकारिक App Store बिल्ड `https://ios-push-relay.openclaw.ai` पर hosted relay का उपयोग करते हैं।

Custom relay deployments के लिए जानबूझकर अलग iOS build/deployment path चाहिए, जिसकी relay URL Gateway relay URL से मेल खाती हो। public App Store release lane custom relay URL overrides स्वीकार नहीं करती। यदि आप custom relay build का उपयोग कर रहे हैं, तो matching Gateway relay URL सेट करें:

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

flow इस तरह काम करता है:

- iOS ऐप App Attest और StoreKit app transaction JWS का उपयोग करके relay के साथ register करता है।
- relay एक opaque relay handle और registration-scoped send grant लौटाता है।
- iOS ऐप paired Gateway identity fetch करता है और उसे relay registration में शामिल करता है, ताकि relay-backed registration उसी विशिष्ट Gateway को delegated हो।
- ऐप उस relay-backed registration को `push.apns.register` के साथ paired Gateway को forward करता है।
- Gateway `push.test`, background wakes, और wake nudges के लिए उस stored relay handle का उपयोग करता है।
- Custom Gateway relay URLs को iOS build में baked relay URL से मेल खाना चाहिए।
- यदि ऐप बाद में किसी अलग Gateway से या अलग relay base URL वाले build से कनेक्ट होता है, तो वह पुरानी binding को reuse करने के बजाय relay registration refresh करता है।

इस path के लिए Gateway को जिन चीज़ों की **ज़रूरत नहीं** है:

- कोई deployment-wide relay token नहीं।
- आधिकारिक App Store relay-backed sends के लिए कोई direct APNs key नहीं।

अपेक्षित operator flow:

1. आधिकारिक iOS ऐप install करें।
2. वैकल्पिक: Gateway पर `gateway.push.apns.relay.baseUrl` केवल तब सेट करें जब आप जानबूझकर अलग custom relay build का उपयोग कर रहे हों।
3. ऐप को Gateway से pair करें और उसे connection पूरा करने दें।
4. APNs token मिलने, operator session connected होने, और relay registration सफल होने के बाद ऐप automatically `push.apns.register` प्रकाशित करता है।
5. उसके बाद, `push.test`, reconnect wakes, और wake nudges stored relay-backed registration का उपयोग कर सकते हैं।

## Background alive beacons

जब iOS silent push, background refresh, या significant-location event के लिए ऐप को wake करता है, तो ऐप
एक छोटा नोड reconnect करने का प्रयास करता है और फिर `event: "node.presence.alive"` के साथ `node.event` call करता है।
Gateway इसे paired node/device metadata पर `lastSeenAtMs`/`lastSeenReason` के रूप में केवल तब record करता है
जब authenticated node device identity ज्ञात हो जाती है।

ऐप background wake को सफलतापूर्वक recorded केवल तब मानता है जब Gateway response में
`handled: true` शामिल हो। पुराने Gateways `{ "ok": true }` के साथ `node.event` acknowledge कर सकते हैं; वह response
compatible है लेकिन durable last-seen update के रूप में count नहीं होता।

Compatibility note:

- `OPENCLAW_APNS_RELAY_BASE_URL` अब भी Gateway के लिए temporary env override के रूप में काम करता है।
- public App Store release lane iOS builds के लिए `OPENCLAW_PUSH_RELAY_BASE_URL` reject करती है।

## Authentication और trust flow

relay दो constraints लागू करने के लिए मौजूद है, जिन्हें direct APNs-on-Gateway
आधिकारिक iOS builds के लिए प्रदान नहीं कर सकता:

- केवल Apple के माध्यम से वितरित genuine OpenClaw iOS builds hosted relay का उपयोग कर सकते हैं।
- कोई Gateway relay-backed pushes केवल उन iOS devices के लिए भेज सकता है जो उसी विशिष्ट
  Gateway से paired हैं।

hop by hop:

1. `iOS app -> gateway`
   - ऐप पहले normal Gateway auth flow के माध्यम से Gateway से pair करता है।
   - इससे ऐप को authenticated node session और authenticated operator session मिलता है।
   - operator session का उपयोग `gateway.identity.get` call करने के लिए किया जाता है।

2. `iOS app -> relay`
   - ऐप HTTPS पर relay registration endpoints call करता है।
   - Registration में App Attest proof और StoreKit app transaction JWS शामिल होते हैं।
   - relay bundle ID, App Attest proof, और Apple distribution proof validate करता है, और
     official/production distribution path की आवश्यकता रखता है।
   - यही local Xcode/dev builds को hosted relay का उपयोग करने से रोकता है। local build
     signed हो सकता है, लेकिन वह relay द्वारा अपेक्षित official Apple distribution proof पूरा नहीं करता।

3. `gateway identity delegation`
   - relay registration से पहले, ऐप paired Gateway identity को
     `gateway.identity.get` से fetch करता है।
   - ऐप उस Gateway identity को relay registration payload में शामिल करता है।
   - relay एक relay handle और registration-scoped send grant लौटाता है, जो
     उस Gateway identity को delegated होते हैं।

4. `gateway -> relay`
   - Gateway `push.apns.register` से relay handle और send grant store करता है।
   - `push.test`, reconnect wakes, और wake nudges पर, Gateway send request को अपनी
     device identity से sign करता है।
   - relay stored send grant और Gateway signature दोनों को registration से delegated
     Gateway identity के विरुद्ध verify करता है।
   - कोई दूसरा Gateway उस stored registration को reuse नहीं कर सकता, भले ही उसे किसी तरह handle मिल जाए।

5. `relay -> APNs`
   - relay production APNs credentials और आधिकारिक build के raw APNs token का owner है।
   - Gateway relay-backed आधिकारिक builds के लिए raw APNs token कभी store नहीं करता।
   - relay paired Gateway की ओर से final push APNs को भेजता है।

यह design क्यों बनाया गया:

- production APNs credentials को user Gateways से बाहर रखने के लिए।
- Gateway पर raw official-build APNs tokens store करने से बचने के लिए।
- hosted relay usage को केवल आधिकारिक OpenClaw iOS builds के लिए allow करने के लिए।
- किसी एक Gateway को अलग Gateway के ownership वाले iOS devices पर wake pushes भेजने से रोकने के लिए।

Local/manual builds direct APNs पर बने रहते हैं। यदि आप relay के बिना उन builds को test कर रहे हैं, तो
Gateway को अब भी direct APNs credentials चाहिए:

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

ये Gateway-host runtime env vars हैं, Fastlane settings नहीं। `apps/ios/fastlane/.env` केवल
App Store Connect auth जैसे `APP_STORE_CONNECT_KEY_ID` और
`APP_STORE_CONNECT_ISSUER_ID` store करता है; यह local iOS builds के लिए direct APNs delivery configure नहीं करता।

Recommended Gateway-host storage:

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

iOS ऐप `_openclaw-gw._tcp` को `local.` पर browse करता है और configured होने पर वही
wide-area DNS-SD discovery domain भी browse करता है। Same-LAN Gateways `local.` से automatically दिखाई देते हैं;
cross-network discovery configured wide-area domain का उपयोग beacon type बदले बिना कर सकती है।

### Tailnet (cross-network)

यदि mDNS blocked है, तो unicast DNS-SD zone (एक domain चुनें; उदाहरण:
`openclaw.internal.`) और Tailscale split DNS का उपयोग करें।
CoreDNS उदाहरण के लिए [Bonjour](/hi/gateway/bonjour) देखें।

### Manual host/port

Settings में, **Manual Host** सक्षम करें और Gateway host + port दर्ज करें (default `18789`)।

## Canvas + A2UI

iOS नोड WKWebView canvas render करता है। इसे drive करने के लिए `node.invoke` का उपयोग करें:

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

Notes:

- Gateway canvas host `/__openclaw__/canvas/` और `/__openclaw__/a2ui/` serve करता है।
- यह Gateway HTTP server से serve होता है (`gateway.port` जैसा same port, default `18789`)।
- iOS नोड built-in scaffold को connected default view के रूप में रखता है। `canvas.a2ui.push` और `canvas.a2ui.reset` bundled app-owned A2UI page का उपयोग करते हैं।
- Remote Gateway A2UI pages iOS पर render-only हैं; native A2UI button actions केवल bundled app-owned pages से स्वीकार किए जाते हैं।
- `canvas.navigate` और `{"url":""}` के साथ built-in scaffold पर लौटें।

## Computer Use relationship

iOS ऐप एक mobile node surface है, Codex Computer Use backend नहीं। Codex
Computer Use और `cua-driver mcp` MCP tools के माध्यम से local macOS desktop को control करते हैं;
iOS ऐप OpenClaw node commands के माध्यम से iPhone capabilities expose करता है
जैसे `canvas.*`, `camera.*`, `screen.*`, `location.*`, और `talk.*`।

Agents अब भी node commands invoke करके OpenClaw के माध्यम से iOS ऐप operate कर सकते हैं,
लेकिन वे calls Gateway node protocol से होकर जाते हैं और iOS foreground/background limits का पालन करते हैं।
local desktop control के लिए [Codex Computer Use](/hi/plugins/codex-computer-use)
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
- OpenAI realtime Talk client-owned WebRTC का उपयोग करता है जब `talk.realtime.transport` `webrtc` हो; explicit `gateway-relay` configuration Gateway-owned रहता है। [Talk mode](/hi/nodes/talk) देखें।
- Talk-capable iOS nodes `talk` capability advertise करते हैं और
  `talk.ptt.start`, `talk.ptt.stop`, `talk.ptt.cancel`, और `talk.ptt.once` declare कर सकते हैं;
  Gateway trusted Talk-capable nodes के लिए इन push-to-talk commands को default रूप से allow करता है।
- iOS background audio suspend कर सकता है; जब ऐप active न हो, तो voice features को best-effort मानें।

## Common errors

- `NODE_BACKGROUND_UNAVAILABLE`: iOS ऐप को foreground में लाएँ (canvas/camera/screen commands को इसकी आवश्यकता होती है)।
- `A2UI_HOST_UNAVAILABLE`: bundled A2UI page ऐप WebView में reachable नहीं था; ऐप को Screen tab पर foregrounded रखें और retry करें।
- Pairing prompt कभी नहीं दिखता: `openclaw devices list` चलाएँ और manually approve करें।
- reinstall के बाद reconnect fail होता है: Keychain pairing token cleared हो गया था; node को फिर से pair करें।

## Related docs

- [पेयरिंग](/hi/channels/pairing)
- [डिस्कवरी](/hi/gateway/discovery)
- [Bonjour](/hi/gateway/bonjour)
