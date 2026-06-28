---
read_when:
    - iOS düğümünü eşleştirme veya yeniden bağlama
    - iOS uygulamasını kaynaktan çalıştırma
    - Gateway keşfini veya canvas komutlarını hata ayıklama
summary: 'iOS node uygulaması: Gateway''e bağlanma, eşleştirme, canvas ve sorun giderme'
title: iOS uygulaması
x-i18n:
    generated_at: "2026-06-28T00:48:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1a93381fd2b95316e05a555bee45b9aed5572679b4b1f10f7f9e40c1a69faf17
    source_path: platforms/ios.md
    workflow: 16
---

Kullanılabilirlik: iPhone app derlemeleri, bir sürüm için etkinleştirildiğinde Apple kanalları üzerinden dağıtılır. Yerel geliştirme derlemeleri kaynak koddan da çalıştırılabilir.

## Ne yapar

- WebSocket üzerinden bir Gateway'e bağlanır (LAN veya tailnet).
- Node yeteneklerini sunar: Canvas, Screen snapshot, Camera capture, Location, Talk mode, Voice wake.
- `node.invoke` komutlarını alır ve node durum olaylarını bildirir.

## Gereksinimler

- Başka bir cihazda çalışan Gateway (macOS, Linux veya WSL2 üzerinden Windows).
- Ağ yolu:
  - Bonjour üzerinden aynı LAN, **veya**
  - Tek noktaya yayın DNS-SD üzerinden tailnet (örnek alan adı: `openclaw.internal.`), **veya**
  - Manuel host/port (geri dönüş).

## Hızlı başlangıç (eşleştir + bağlan)

1. Gateway'i başlatın:

```bash
openclaw gateway --port 18789
```

2. iOS app içinde Settings'i açın ve keşfedilen bir gateway seçin (veya Manual Host'u etkinleştirip host/port girin).

3. Gateway host'unda eşleştirme isteğini onaylayın:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

App değişen auth ayrıntılarıyla (role/scopes/public key) eşleştirmeyi yeniden denerse,
önceki bekleyen istek geçersiz kılınır ve yeni bir `requestId` oluşturulur.
Onaydan önce `openclaw devices list` komutunu tekrar çalıştırın.

İsteğe bağlı: iOS node her zaman sıkı denetlenen bir alt ağdan bağlanıyorsa, açık CIDR'ler veya tam IP'lerle ilk kez node otomatik onayına dahil olabilirsiniz:

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

Bu varsayılan olarak devre dışıdır. Yalnızca istenen scope bulunmayan yeni `role: node` eşleştirmeleri için geçerlidir. Operator/browser eşleştirmesi ve role, scope, metadata veya public-key değişikliği yine manuel onay gerektirir.

4. Bağlantıyı doğrulayın:

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## Resmi derlemeler için relay destekli push

Resmi dağıtılan iOS derlemeleri, ham APNs token'ını gateway'e yayımlamak yerine harici push relay kullanır.

Public App Store sürüm hattındaki resmi/TestFlight derlemeleri `https://ios-push-relay.openclaw.ai` adresindeki barındırılan relay'i kullanır.

Özel relay dağıtımları, relay URL'si gateway relay URL'siyle eşleşen kasıtlı olarak ayrı bir iOS derleme/dağıtım yolu gerektirir. Public App Store sürüm hattı özel relay URL geçersiz kılmalarını kabul etmez. Özel bir relay derlemesi kullanıyorsanız, eşleşen gateway relay URL'sini ayarlayın:

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

Akış şöyle çalışır:

- iOS app, App Attest ve StoreKit app transaction JWS kullanarak relay'e kaydolur.
- Relay, opak bir relay handle ve kayıt kapsamlı gönderim izni döndürür.
- iOS app eşleştirilmiş gateway kimliğini alır ve relay kaydına ekler; böylece relay destekli kayıt bu belirli gateway'e devredilir.
- App bu relay destekli kaydı `push.apns.register` ile eşleştirilmiş gateway'e iletir.
- Gateway, `push.test`, arka plan uyandırmaları ve uyandırma dürtmeleri için saklanan bu relay handle'ını kullanır.
- Özel gateway relay URL'leri, iOS derlemesine gömülü relay URL'siyle eşleşmelidir.
- App daha sonra farklı bir gateway'e veya farklı relay base URL'sine sahip bir derlemeye bağlanırsa, eski bağlamayı yeniden kullanmak yerine relay kaydını yeniler.

Bu yol için gateway'in **ihtiyaç duymadığı** şeyler:

- Dağıtım genelinde relay token'ı yoktur.
- Resmi/TestFlight relay destekli gönderimler için doğrudan APNs anahtarı yoktur.

Beklenen operatör akışı:

1. Resmi/TestFlight iOS derlemesini yükleyin.
2. İsteğe bağlı: `gateway.push.apns.relay.baseUrl` değerini gateway üzerinde yalnızca kasıtlı olarak ayrı bir özel relay derlemesi kullanırken ayarlayın.
3. App'i gateway ile eşleştirin ve bağlantıyı tamamlamasına izin verin.
4. App, APNs token'ına sahip olduktan, operator oturumu bağlandıktan ve relay kaydı başarılı olduktan sonra `push.apns.register` yayımlamasını otomatik yapar.
5. Bundan sonra `push.test`, yeniden bağlanma uyandırmaları ve uyandırma dürtmeleri saklanan relay destekli kaydı kullanabilir.

## Arka plan canlılık işaretleri

iOS app'i sessiz push, arka plan yenilemesi veya önemli konum olayı için uyandırdığında, app kısa bir node yeniden bağlantısı denemesi yapar ve ardından `event: "node.presence.alive"` ile `node.event` çağırır.
Gateway bunu, yalnızca kimliği doğrulanmış node cihaz kimliği bilindikten sonra eşleştirilmiş node/cihaz metadata'sında `lastSeenAtMs`/`lastSeenReason` olarak kaydeder.

App, bir arka plan uyandırmasını ancak gateway yanıtı `handled: true` içerdiğinde başarıyla kaydedilmiş kabul eder. Eski gateway'ler `node.event` çağrısını `{ "ok": true }` ile onaylayabilir; bu yanıt uyumludur ancak kalıcı last-seen güncellemesi sayılmaz.

Uyumluluk notu:

- `OPENCLAW_APNS_RELAY_BASE_URL`, gateway için geçici env geçersiz kılması olarak hâlâ çalışır.
- Public App Store sürüm hattı, iOS derlemeleri için `OPENCLAW_PUSH_RELAY_BASE_URL` değerini reddeder.

## Kimlik doğrulama ve güven akışı

Relay, doğrudan gateway üzerinde APNs kullanımının resmi iOS derlemeleri için sağlayamayacağı iki kısıtlamayı uygulamak için vardır:

- Barındırılan relay'i yalnızca Apple üzerinden dağıtılan gerçek OpenClaw iOS derlemeleri kullanabilir.
- Bir gateway, relay destekli push'ları yalnızca o belirli gateway ile eşleştirilmiş iOS cihazları için gönderebilir.

Adım adım:

1. `iOS app -> gateway`
   - App önce normal Gateway auth akışı üzerinden gateway ile eşleşir.
   - Bu, app'e kimliği doğrulanmış bir node oturumu ve kimliği doğrulanmış bir operator oturumu verir.
   - Operator oturumu `gateway.identity.get` çağırmak için kullanılır.

2. `iOS app -> relay`
   - App relay kayıt endpoint'lerini HTTPS üzerinden çağırır.
   - Kayıt, App Attest kanıtı ve StoreKit app transaction JWS içerir.
   - Relay bundle ID'yi, App Attest kanıtını ve Apple dağıtım kanıtını doğrular ve resmi/production dağıtım yolunu zorunlu kılar.
   - Yerel Xcode/dev derlemelerinin barındırılan relay'i kullanmasını engelleyen şey budur. Yerel bir derleme imzalı olabilir, ancak relay'in beklediği resmi Apple dağıtım kanıtını karşılamaz.

3. `gateway kimliği devri`
   - Relay kaydından önce app, eşleştirilmiş gateway kimliğini `gateway.identity.get` üzerinden alır.
   - App bu gateway kimliğini relay kayıt payload'una ekler.
   - Relay, bu gateway kimliğine devredilmiş bir relay handle ve kayıt kapsamlı gönderim izni döndürür.

4. `gateway -> relay`
   - Gateway, `push.apns.register` tarafından gelen relay handle'ını ve gönderim iznini saklar.
   - `push.test`, yeniden bağlanma uyandırmaları ve uyandırma dürtmelerinde gateway, gönderim isteğini kendi cihaz kimliğiyle imzalar.
   - Relay hem saklanan gönderim iznini hem de gateway imzasını, kayıttaki devredilmiş gateway kimliğine göre doğrular.
   - Başka bir gateway, handle'ı bir şekilde ele geçirse bile bu saklanan kaydı yeniden kullanamaz.

5. `relay -> APNs`
   - Relay, resmi derleme için production APNs kimlik bilgilerine ve ham APNs token'ına sahiptir.
   - Gateway, relay destekli resmi derlemeler için ham APNs token'ını asla saklamaz.
   - Relay, eşleştirilmiş gateway adına son push'u APNs'ye gönderir.

Bu tasarımın oluşturulma nedenleri:

- Production APNs kimlik bilgilerini kullanıcı gateway'lerinin dışında tutmak.
- Ham resmi derleme APNs token'larını gateway üzerinde saklamaktan kaçınmak.
- Barındırılan relay kullanımına yalnızca resmi/TestFlight OpenClaw derlemeleri için izin vermek.
- Bir gateway'in farklı bir gateway'e ait iOS cihazlarına uyandırma push'ları göndermesini önlemek.

Yerel/manuel derlemeler doğrudan APNs üzerinde kalır. Bu derlemeleri relay olmadan test ediyorsanız, gateway'in hâlâ doğrudan APNs kimlik bilgilerine ihtiyacı vardır:

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

Bunlar gateway-host çalışma zamanı env vars değerleridir, Fastlane ayarları değildir. `apps/ios/fastlane/.env` yalnızca `APP_STORE_CONNECT_KEY_ID` ve `APP_STORE_CONNECT_ISSUER_ID` gibi App Store Connect / TestFlight auth bilgilerini saklar; yerel iOS derlemeleri için doğrudan APNs teslimatını yapılandırmaz.

Önerilen gateway-host depolaması:

```bash
mkdir -p ~/.openclaw/credentials/apns
chmod 700 ~/.openclaw/credentials/apns
mv /path/to/AuthKey_KEYID.p8 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
chmod 600 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
export OPENCLAW_APNS_PRIVATE_KEY_PATH="$HOME/.openclaw/credentials/apns/AuthKey_KEYID.p8"
```

`.p8` dosyasını commit etmeyin veya repo checkout altına koymayın.

## Keşif yolları

### Bonjour (LAN)

iOS app, `_openclaw-gw._tcp` değerini `local.` üzerinde ve yapılandırıldığında aynı geniş alan DNS-SD keşif alan adında tarar. Aynı LAN gateway'leri `local.` üzerinden otomatik görünür; ağlar arası keşif, beacon türünü değiştirmeden yapılandırılmış geniş alan alan adını kullanabilir.

### Tailnet (ağlar arası)

mDNS engellenmişse, tek noktaya yayın DNS-SD zone'u (bir alan adı seçin; örnek:
`openclaw.internal.`) ve Tailscale split DNS kullanın.
CoreDNS örneği için [Bonjour](/tr/gateway/bonjour) sayfasına bakın.

### Manuel host/port

Settings içinde **Manual Host**'u etkinleştirin ve gateway host + port değerini girin (varsayılan `18789`).

## Canvas + A2UI

iOS node bir WKWebView canvas oluşturur. Bunu çalıştırmak için `node.invoke` kullanın:

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

Notlar:

- Gateway canvas host'u `/__openclaw__/canvas/` ve `/__openclaw__/a2ui/` servis eder.
- Gateway HTTP server üzerinden servis edilir (`gateway.port` ile aynı port, varsayılan `18789`).
- iOS node, yerleşik scaffold'u bağlı varsayılan görünüm olarak korur. `canvas.a2ui.push` ve `canvas.a2ui.reset`, paketlenmiş app'e ait A2UI sayfasını kullanır.
- Remote Gateway A2UI sayfaları iOS üzerinde yalnızca render içindir; native A2UI button actions yalnızca paketlenmiş app'e ait sayfalardan kabul edilir.
- `canvas.navigate` ve `{"url":""}` ile yerleşik scaffold'a dönün.

## Computer Use ilişkisi

iOS app, bir Codex Computer Use backend'i değil, mobil node yüzeyidir. Codex
Computer Use ve `cua-driver mcp`, MCP tools üzerinden yerel bir macOS masaüstünü denetler; iOS app ise `canvas.*`, `camera.*`, `screen.*`, `location.*` ve `talk.*` gibi OpenClaw node komutları üzerinden iPhone yeteneklerini sunar.

Agents, node komutlarını çağırarak iOS app'i OpenClaw üzerinden yine çalıştırabilir, ancak bu çağrılar gateway node protokolünden geçer ve iOS foreground/background sınırlarını izler. Yerel masaüstü denetimi için [Codex Computer Use](/tr/plugins/codex-computer-use) sayfasını, iOS node yetenekleri için bu sayfayı kullanın.

### Canvas eval / snapshot

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## Voice wake + talk mode

- Voice wake ve talk mode Settings içinde kullanılabilir.
- Talk özellikli iOS node'lar `talk` yeteneğini duyurur ve `talk.ptt.start`, `talk.ptt.stop`, `talk.ptt.cancel` ve `talk.ptt.once` bildirebilir; Gateway, güvenilir Talk özellikli node'lar için bu push-to-talk komutlarına varsayılan olarak izin verir.
- iOS arka plan sesini askıya alabilir; app etkin değilken voice özelliklerini best-effort olarak değerlendirin.

## Yaygın hatalar

- `NODE_BACKGROUND_UNAVAILABLE`: iOS app'i foreground'a getirin (canvas/camera/screen komutları bunu gerektirir).
- `A2UI_HOST_UNAVAILABLE`: paketlenmiş A2UI sayfasına app WebView içinde ulaşılamadı; app'i Screen sekmesinde foreground'da tutun ve tekrar deneyin.
- Eşleştirme istemi hiç görünmüyor: `openclaw devices list` çalıştırın ve manuel olarak onaylayın.
- Yeniden yüklemeden sonra yeniden bağlanma başarısız: Keychain eşleştirme token'ı temizlenmiş; node'u yeniden eşleştirin.

## İlgili dokümanlar

- [Pairing](/tr/channels/pairing)
- [Discovery](/tr/gateway/discovery)
- [Bonjour](/tr/gateway/bonjour)
