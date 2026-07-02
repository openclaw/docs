---
read_when:
    - iOS Node को पेयर या फिर से कनेक्ट करना
    - स्रोत से iOS ऐप चलाना
    - Gateway खोज या कैनवास कमांड की डिबगिंग
summary: 'iOS Node ऐप: Gateway से कनेक्ट करना, पेयरिंग, कैनवास, और समस्या निवारण'
title: iOS ऐप
x-i18n:
    generated_at: "2026-07-02T08:18:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 26f58f5a3a4c6f918ddca493367554c2df5a34292deeb112296103dce2203743
    source_path: platforms/ios.md
    workflow: 16
---

उपलब्धता: रिलीज़ के लिए सक्षम होने पर iPhone app बिल्ड Apple चैनलों के माध्यम से वितरित किए जाते हैं। स्थानीय डेवलपमेंट बिल्ड स्रोत से भी चल सकते हैं।

## यह क्या करता है

- WebSocket (LAN या tailnet) पर Gateway से कनेक्ट करता है।
- node क्षमताएँ उपलब्ध कराता है: Canvas, Screen snapshot, Camera capture, Location, Talk mode, Voice wake।
- `node.invoke` कमांड प्राप्त करता है और node स्थिति ईवेंट रिपोर्ट करता है।

## आवश्यकताएँ

- किसी अन्य डिवाइस पर चल रहा Gateway (macOS, Linux, या WSL2 के माध्यम से Windows)।
- नेटवर्क पथ:
  - Bonjour के माध्यम से वही LAN, **या**
  - unicast DNS-SD के माध्यम से Tailnet (उदाहरण डोमेन: `openclaw.internal.`), **या**
  - मैन्युअल host/port (fallback)।

## त्वरित शुरुआत (pair + connect)

1. Gateway शुरू करें:

```bash
openclaw gateway --port 18789
```

2. iOS app में, Settings खोलें और खोजे गए gateway को चुनें (या Manual Host सक्षम करें और host/port दर्ज करें)।

3. gateway host पर pairing अनुरोध को स्वीकृत करें:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

यदि app बदले हुए auth विवरणों (role/scopes/public key) के साथ pairing फिर से आज़माता है,
तो पिछला pending अनुरोध supersede हो जाता है और नया `requestId` बनाया जाता है।
स्वीकृति से पहले `openclaw devices list` फिर से चलाएँ।

वैकल्पिक: यदि iOS node हमेशा कड़े नियंत्रण वाले subnet से कनेक्ट होता है, तो आप
स्पष्ट CIDR या exact IPs के साथ पहली बार node auto-approval में opt in कर सकते हैं:

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

यह default रूप से disabled है। यह केवल नए `role: node` pairing पर लागू होता है जिसमें
कोई requested scopes नहीं हैं। Operator/browser pairing और किसी भी role, scope, metadata, या
public-key बदलाव के लिए अभी भी manual approval चाहिए।

4. कनेक्शन सत्यापित करें:

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## official builds के लिए relay-backed push

आधिकारिक रूप से वितरित iOS builds, raw APNs token को gateway पर प्रकाशित करने के बजाय external push relay का उपयोग करते हैं।

public release lane से official App Store builds hosted relay `https://ios-push-relay.openclaw.ai` का उपयोग करते हैं।

Custom relay deployments के लिए जानबूझकर अलग iOS build/deployment path चाहिए, जिसका relay URL gateway relay URL से मेल खाता हो। public App Store release lane custom relay URL overrides स्वीकार नहीं करता। यदि आप custom relay build का उपयोग कर रहे हैं, तो matching gateway relay URL सेट करें:

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

- iOS app, App Attest और StoreKit app transaction JWS का उपयोग करके relay के साथ register करता है।
- relay एक opaque relay handle और registration-scoped send grant लौटाता है।
- iOS app paired gateway identity fetch करता है और उसे relay registration में शामिल करता है, ताकि relay-backed registration उस विशिष्ट gateway को delegated हो।
- app उस relay-backed registration को paired gateway पर `push.apns.register` के साथ forward करता है।
- gateway उस stored relay handle का उपयोग `push.test`, background wakes, और wake nudges के लिए करता है।
- Custom gateway relay URLs को iOS build में baked relay URL से मेल खाना चाहिए।
- यदि app बाद में किसी अलग gateway या अलग relay base URL वाले build से कनेक्ट होता है, तो यह पुराने binding को reuse करने के बजाय relay registration refresh करता है।

इस path के लिए gateway को क्या **नहीं** चाहिए:

- कोई deployment-wide relay token नहीं।
- official App Store relay-backed sends के लिए कोई direct APNs key नहीं।

अपेक्षित operator flow:

1. official iOS app install करें।
2. वैकल्पिक: `gateway.push.apns.relay.baseUrl` gateway पर केवल तब सेट करें जब जानबूझकर अलग custom relay build का उपयोग कर रहे हों।
3. app को gateway से pair करें और उसे connect पूरा करने दें।
4. APNs token मिलने, operator session connected होने, और relay registration सफल होने के बाद app स्वचालित रूप से `push.apns.register` publish करता है।
5. उसके बाद, `push.test`, reconnect wakes, और wake nudges stored relay-backed registration का उपयोग कर सकते हैं।

## Background alive beacons

जब iOS silent push, background refresh, या significant-location event के लिए app को wake करता है, तो app
एक छोटा node reconnect आज़माता है और फिर `event: "node.presence.alive"` के साथ `node.event` call करता है।
Gateway इसे paired node/device metadata पर `lastSeenAtMs`/`lastSeenReason` के रूप में केवल
authenticated node device identity ज्ञात होने के बाद record करता है।

app background wake को successfully recorded केवल तब मानता है जब gateway response में
`handled: true` शामिल हो। पुराने gateways `{ "ok": true }` के साथ `node.event` acknowledge कर सकते हैं; वह response
compatible है, लेकिन durable last-seen update के रूप में count नहीं होता।

Compatibility note:

- `OPENCLAW_APNS_RELAY_BASE_URL` अब भी gateway के लिए temporary env override के रूप में काम करता है।
- public App Store release lane iOS builds के लिए `OPENCLAW_PUSH_RELAY_BASE_URL` reject करता है।

## Authentication और trust flow

relay दो constraints enforce करने के लिए मौजूद है, जिन्हें direct APNs-on-gateway
official iOS builds के लिए उपलब्ध नहीं करा सकता:

- Apple के माध्यम से वितरित केवल genuine OpenClaw iOS builds hosted relay का उपयोग कर सकते हैं।
- gateway relay-backed pushes केवल उन iOS devices के लिए भेज सकता है जो उस विशिष्ट
  gateway के साथ paired हैं।

Hop by hop:

1. `iOS app -> gateway`
   - app पहले normal Gateway auth flow के माध्यम से gateway के साथ pair करता है।
   - इससे app को authenticated node session और authenticated operator session मिलता है।
   - operator session का उपयोग `gateway.identity.get` call करने के लिए किया जाता है।

2. `iOS app -> relay`
   - app HTTPS पर relay registration endpoints call करता है।
   - Registration में App Attest proof और StoreKit app transaction JWS शामिल होते हैं।
   - relay bundle ID, App Attest proof, और Apple distribution proof validate करता है, और
     official/production distribution path की आवश्यकता रखता है।
   - यही local Xcode/dev builds को hosted relay का उपयोग करने से रोकता है। local build signed हो सकता है,
     लेकिन वह relay द्वारा अपेक्षित official Apple distribution proof पूरा नहीं करता।

3. `gateway identity delegation`
   - relay registration से पहले, app paired gateway identity को
     `gateway.identity.get` से fetch करता है।
   - app उस gateway identity को relay registration payload में शामिल करता है।
   - relay एक relay handle और registration-scoped send grant लौटाता है, जो
     उस gateway identity को delegated होते हैं।

4. `gateway -> relay`
   - gateway `push.apns.register` से relay handle और send grant store करता है।
   - `push.test`, reconnect wakes, और wake nudges पर, gateway send request को अपनी
     खुद की device identity से sign करता है।
   - relay stored send grant और gateway signature दोनों को registration से delegated
     gateway identity के विरुद्ध verify करता है।
   - दूसरा gateway उस stored registration को reuse नहीं कर सकता, भले ही उसे किसी तरह handle मिल जाए।

5. `relay -> APNs`
   - relay official build के लिए production APNs credentials और raw APNs token का owner है।
   - gateway relay-backed official builds के लिए raw APNs token कभी store नहीं करता।
   - relay paired gateway की ओर से final push APNs को भेजता है।

यह design क्यों बनाया गया:

- production APNs credentials को user gateways से बाहर रखने के लिए।
- gateway पर raw official-build APNs tokens store करने से बचने के लिए।
- hosted relay usage को केवल official OpenClaw iOS builds के लिए अनुमति देने के लिए।
- एक gateway को किसी दूसरे gateway के स्वामित्व वाले iOS devices को wake pushes भेजने से रोकने के लिए।

Local/manual builds direct APNs पर रहते हैं। यदि आप relay के बिना उन builds को test कर रहे हैं, तो
gateway को अभी भी direct APNs credentials चाहिए:

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

ये gateway-host runtime env vars हैं, Fastlane settings नहीं। `apps/ios/fastlane/.env` केवल
App Store Connect auth जैसे `APP_STORE_CONNECT_KEY_ID` और
`APP_STORE_CONNECT_ISSUER_ID` store करता है; यह local iOS builds के लिए direct APNs delivery configure नहीं करता।

Recommended gateway-host storage:

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

iOS app `_openclaw-gw._tcp` को `local.` पर browse करता है और, configured होने पर, वही
wide-area DNS-SD discovery domain भी। Same-LAN gateways `local.` से automatically दिखाई देते हैं;
cross-network discovery configured wide-area domain का उपयोग beacon type बदले बिना कर सकता है।

### Tailnet (cross-network)

यदि mDNS blocked है, तो unicast DNS-SD zone (कोई domain चुनें; उदाहरण:
`openclaw.internal.`) और Tailscale split DNS का उपयोग करें।
CoreDNS example के लिए [Bonjour](/hi/gateway/bonjour) देखें।

### Manual host/port

Settings में, **Manual Host** सक्षम करें और gateway host + port दर्ज करें (default `18789`)।

## Canvas + A2UI

iOS node WKWebView canvas render करता है। इसे drive करने के लिए `node.invoke` का उपयोग करें:

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

Notes:

- Gateway canvas host `/__openclaw__/canvas/` और `/__openclaw__/a2ui/` serve करता है।
- यह Gateway HTTP server से serve होता है (`gateway.port` के समान port, default `18789`)।
- iOS node built-in scaffold को connected default view के रूप में रखता है। `canvas.a2ui.push` और `canvas.a2ui.reset` bundled app-owned A2UI page का उपयोग करते हैं।
- Remote Gateway A2UI pages iOS पर render-only हैं; native A2UI button actions केवल bundled app-owned pages से स्वीकार किए जाते हैं।
- `canvas.navigate` और `{"url":""}` के साथ built-in scaffold पर लौटें।

## Computer Use संबंध

iOS app एक mobile node surface है, Codex Computer Use backend नहीं। Codex
Computer Use और `cua-driver mcp` MCP tools के माध्यम से local macOS desktop को control करते हैं;
iOS app OpenClaw node commands जैसे `canvas.*`, `camera.*`, `screen.*`, `location.*`, और `talk.*` के माध्यम से iPhone capabilities expose करता है।

Agents अब भी node commands invoke करके OpenClaw के माध्यम से iOS app operate कर सकते हैं,
लेकिन वे calls gateway node protocol से गुजरते हैं और iOS foreground/background limits का पालन करते हैं।
local desktop control के लिए [Codex Computer Use](/hi/plugins/codex-computer-use) और iOS node capabilities के लिए यह page उपयोग करें।

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
  Gateway trusted Talk-capable nodes के लिए इन push-to-talk commands को default रूप से allow करता है।
- iOS background audio suspend कर सकता है; जब app active न हो तो voice features को best-effort मानें।

## Common errors

- `NODE_BACKGROUND_UNAVAILABLE`: iOS app को foreground में लाएँ (canvas/camera/screen commands को इसकी आवश्यकता होती है)।
- `A2UI_HOST_UNAVAILABLE`: bundled A2UI page app WebView में reachable नहीं था; app को Screen tab पर foregrounded रखें और retry करें।
- Pairing prompt कभी दिखाई नहीं देता: `openclaw devices list` चलाएँ और manually approve करें।
- Reinstall के बाद reconnect fail होता है: Keychain pairing token clear हो गया था; node को फिर से pair करें।

## Related docs

- [Pairing](/hi/channels/pairing)
- [Discovery](/hi/gateway/discovery)
- [Bonjour](/hi/gateway/bonjour)
