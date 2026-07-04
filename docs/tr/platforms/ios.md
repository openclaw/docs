---
read_when:
    - iOS düğümünü eşleme veya yeniden bağlama
    - iOS uygulamasını kaynak koddan çalıştırma
    - Gateway keşfini veya tuval komutlarını hata ayıklama
summary: 'iOS Node uygulaması: Gateway’e bağlanma, eşleştirme, tuval ve sorun giderme'
title: iOS uygulaması
x-i18n:
    generated_at: "2026-07-04T18:18:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ad6d272518b36564562256f55ffc320c0c4d2b954914ac73c23e450fa7acee0b
    source_path: platforms/ios.md
    workflow: 16
---

Kullanılabilirlik: iPhone uygulama derlemeleri, bir sürüm için etkinleştirildiğinde Apple kanalları üzerinden dağıtılır. Yerel geliştirme derlemeleri kaynaktan da çalıştırılabilir.

## Ne yapar

- WebSocket üzerinden bir Gateway'e bağlanır (LAN veya tailnet).
- Düğüm yeteneklerini sunar: Canvas, ekran anlık görüntüsü, kamera yakalama, konum, konuşma modu, sesle uyandırma.
- `node.invoke` komutlarını alır ve düğüm durum olaylarını bildirir.

## Gereksinimler

- Başka bir cihazda çalışan Gateway (macOS, Linux veya WSL2 üzerinden Windows).
- Ağ yolu:
  - Bonjour üzerinden aynı LAN, **veya**
  - Tek noktaya yayın DNS-SD üzerinden tailnet (örnek alan adı: `openclaw.internal.`), **veya**
  - Elle host/port (yedek).

## Hızlı başlangıç (eşleştir + bağlan)

1. Telefonunuzun erişebileceği bir rota ile kimliği doğrulanmış bir Gateway başlatın. Önerilen uzak yol Tailscale
   Serve'dür:

```bash
openclaw gateway --port 18789 --tailscale serve
```

Güvenilir bir aynı-LAN kurulumu için bunun yerine kimliği doğrulanmış `gateway.bind: "lan"`
kullanın. Varsayılan local loopback bağlama bir telefondan erişilemez. Gateway
henüz yapılandırılmadıysa, kurulum kodu oluşturmanın token veya parola kimlik doğrulama yolu olması için önce `openclaw onboard` çalıştırın.

2. [Control UI](/tr/web/control-ui) öğesini açın, **Düğümler**'i seçin ve
   **Cihazlar** kartında **Mobil cihazı eşleştir**'e tıklayın.

3. iOS uygulamasında **Ayarlar** → **Gateway**'i açın, QR kodunu tarayın (veya
   kurulum kodunu yapıştırın) ve bağlanın.

4. Resmi uygulama otomatik olarak bağlanır. **Cihazlar** bekleyen bir
   istek gösteriyorsa, onaylamadan önce rolünü ve kapsamlarını inceleyin.

Control UI düğmesi, `operator.admin` ile zaten eşleştirilmiş bir oturum gerektirir.
Terminal yedeği olarak iOS uygulamasında keşfedilen bir gateway seçin (veya
Elle Host'u etkinleştirip host/port girin), ardından isteği Gateway host'unda onaylayın:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Uygulama değişen kimlik doğrulama ayrıntılarıyla (rol/kapsamlar/açık anahtar)
eşleştirmeyi yeniden denerse, önceki bekleyen istek geçersiz kılınır ve yeni bir `requestId` oluşturulur.
Onaydan önce `openclaw devices list` komutunu tekrar çalıştırın.

İsteğe bağlı: iOS düğümü her zaman sıkı denetimli bir alt ağdan bağlanıyorsa,
açık CIDR'lar veya tam IP'lerle ilk kez düğüm otomatik onayına katılabilirsiniz:

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

Bu varsayılan olarak devre dışıdır. Yalnızca istenen kapsam olmadan yeni `role: node` eşleştirmesi için geçerlidir. Operatör/tarayıcı eşleştirmesi ve herhangi bir rol, kapsam, metadata veya
açık anahtar değişikliği yine de elle onay gerektirir.

5. Bağlantıyı doğrulayın:

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## Resmi derlemeler için relay destekli push

Resmi dağıtılan iOS derlemeleri, ham APNs token'ını gateway'e yayımlamak yerine harici push relay'i kullanır.

Genel sürüm hattındaki resmi App Store derlemeleri, `https://ios-push-relay.openclaw.ai` adresindeki barındırılan relay'i kullanır.

Özel relay dağıtımları, relay URL'si gateway relay URL'siyle eşleşen bilinçli olarak ayrı bir iOS derleme/dağıtım yolu gerektirir. Genel App Store sürüm hattı özel relay URL geçersiz kılmalarını kabul etmez. Özel bir relay derlemesi kullanıyorsanız, eşleşen gateway relay URL'sini ayarlayın:

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

- iOS uygulaması, App Attest ve StoreKit uygulama işlem JWS'si kullanarak relay'e kaydolur.
- Relay, opak bir relay tanıtıcısı ve kayıt kapsamlı bir gönderme izni döndürür.
- iOS uygulaması eşleştirilmiş gateway kimliğini alır ve relay kaydına dahil eder; böylece relay destekli kayıt o belirli gateway'e devredilir.
- Uygulama, bu relay destekli kaydı `push.apns.register` ile eşleştirilmiş gateway'e iletir.
- Gateway, bu saklanan relay tanıtıcısını `push.test`, arka plan uyandırmaları ve uyandırma dürtmeleri için kullanır.
- Özel gateway relay URL'leri, iOS derlemesine gömülen relay URL'siyle eşleşmelidir.
- Uygulama daha sonra farklı bir gateway'e veya farklı relay temel URL'si olan bir derlemeye bağlanırsa, eski bağlamayı yeniden kullanmak yerine relay kaydını yeniler.

Bu yol için gateway'in **gereksinim duymadığı** şeyler:

- Dağıtım genelinde relay token'ı yok.
- Resmi App Store relay destekli göndermeleri için doğrudan APNs anahtarı yok.

Beklenen operatör akışı:

1. Resmi iOS uygulamasını yükleyin.
2. İsteğe bağlı: `gateway.push.apns.relay.baseUrl` değerini gateway'de yalnızca bilinçli olarak ayrı bir özel relay derlemesi kullanırken ayarlayın.
3. Uygulamayı gateway ile eşleştirin ve bağlanmayı bitirmesine izin verin.
4. Uygulama bir APNs token'ına sahip olduktan, operatör oturumu bağlandıktan ve relay kaydı başarılı olduktan sonra `push.apns.register` öğesini otomatik olarak yayımlar.
5. Bundan sonra `push.test`, yeniden bağlantı uyandırmaları ve uyandırma dürtmeleri saklanan relay destekli kaydı kullanabilir.

## Arka plan canlılık işaretleri

iOS uygulamayı sessiz push, arka plan yenilemesi veya önemli konum olayı için uyandırdığında, uygulama
kısa bir düğüm yeniden bağlantısı dener ve ardından `event: "node.presence.alive"` ile `node.event` çağırır.
Gateway, bunu eşleştirilmiş düğüm/cihaz metadata'sında `lastSeenAtMs`/`lastSeenReason` olarak yalnızca
kimliği doğrulanmış düğüm cihaz kimliği bilindikten sonra kaydeder.

Uygulama, bir arka plan uyandırmasını yalnızca gateway yanıtı `handled: true` içerdiğinde başarıyla kaydedilmiş sayar. Eski gateway'ler `node.event` öğesini `{ "ok": true }` ile onaylayabilir; bu yanıt
uyumludur ancak kalıcı son görülme güncellemesi olarak sayılmaz.

Uyumluluk notu:

- `OPENCLAW_APNS_RELAY_BASE_URL` gateway için geçici env geçersiz kılması olarak hâlâ çalışır.
- Genel App Store sürüm hattı, iOS derlemeleri için `OPENCLAW_PUSH_RELAY_BASE_URL` öğesini reddeder.

## Kimlik doğrulama ve güven akışı

Relay, resmi iOS derlemeleri için gateway üzerinde doğrudan APNs'in sağlayamayacağı iki kısıtı uygulamak için vardır:

- Yalnızca Apple üzerinden dağıtılan gerçek OpenClaw iOS derlemeleri barındırılan relay'i kullanabilir.
- Bir gateway, relay destekli push'ları yalnızca o belirli gateway ile eşleştirilmiş iOS cihazları için gönderebilir.

Adım adım:

1. `iOS app -> gateway`
   - Uygulama önce normal Gateway kimlik doğrulama akışı üzerinden gateway ile eşleşir.
   - Bu, uygulamaya kimliği doğrulanmış bir düğüm oturumu ve kimliği doğrulanmış bir operatör oturumu verir.
   - Operatör oturumu `gateway.identity.get` çağırmak için kullanılır.

2. `iOS app -> relay`
   - Uygulama relay kayıt uç noktalarını HTTPS üzerinden çağırır.
   - Kayıt, App Attest kanıtı ve StoreKit uygulama işlem JWS'si içerir.
   - Relay, bundle ID'yi, App Attest kanıtını ve Apple dağıtım kanıtını doğrular ve
     resmi/üretim dağıtım yolunu gerektirir.
   - Barındırılan relay'i yerel Xcode/dev derlemelerinin kullanmasını engelleyen şey budur. Yerel bir derleme
     imzalanmış olabilir, ancak relay'in beklediği resmi Apple dağıtım kanıtını karşılamaz.

3. `gateway identity delegation`
   - Relay kaydından önce uygulama, eşleştirilmiş gateway kimliğini
     `gateway.identity.get` öğesinden alır.
   - Uygulama bu gateway kimliğini relay kayıt yüküne dahil eder.
   - Relay, bu gateway kimliğine devredilen bir relay tanıtıcısı ve kayıt kapsamlı bir gönderme izni döndürür.

4. `gateway -> relay`
   - Gateway, `push.apns.register` öğesinden relay tanıtıcısını ve gönderme iznini saklar.
   - `push.test`, yeniden bağlantı uyandırmaları ve uyandırma dürtmelerinde gateway gönderme isteğini kendi
     cihaz kimliğiyle imzalar.
   - Relay, hem saklanan gönderme iznini hem de gateway imzasını kayıttan devredilen
     gateway kimliğine göre doğrular.
   - Başka bir gateway, tanıtıcıyı bir şekilde elde etse bile bu saklanan kaydı yeniden kullanamaz.

5. `relay -> APNs`
   - Relay, resmi derleme için üretim APNs kimlik bilgilerine ve ham APNs token'ına sahiptir.
   - Gateway, relay destekli resmi derlemeler için ham APNs token'ını asla saklamaz.
   - Relay, son push'u eşleştirilmiş gateway adına APNs'e gönderir.

Bu tasarımın oluşturulma nedeni:

- Üretim APNs kimlik bilgilerini kullanıcı gateway'lerinin dışında tutmak.
- Resmi derleme ham APNs token'larını gateway'de saklamaktan kaçınmak.
- Barındırılan relay kullanımına yalnızca resmi OpenClaw iOS derlemeleri için izin vermek.
- Bir gateway'in farklı bir gateway'e ait iOS cihazlarına uyandırma push'ları göndermesini önlemek.

Yerel/elle derlemeler doğrudan APNs üzerinde kalır. Bu derlemeleri relay olmadan test ediyorsanız,
gateway'in hâlâ doğrudan APNs kimlik bilgilerine ihtiyacı vardır:

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

Bunlar gateway-host çalışma zamanı env var'larıdır, Fastlane ayarları değildir. `apps/ios/fastlane/.env` yalnızca
`APP_STORE_CONNECT_KEY_ID` ve
`APP_STORE_CONNECT_ISSUER_ID` gibi App Store Connect kimlik doğrulamasını saklar; yerel iOS derlemeleri için doğrudan APNs teslimini yapılandırmaz.

Önerilen gateway-host depolaması:

```bash
mkdir -p ~/.openclaw/credentials/apns
chmod 700 ~/.openclaw/credentials/apns
mv /path/to/AuthKey_KEYID.p8 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
chmod 600 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
export OPENCLAW_APNS_PRIVATE_KEY_PATH="$HOME/.openclaw/credentials/apns/AuthKey_KEYID.p8"
```

`.p8` dosyasını commit etmeyin veya repo checkout'u altına yerleştirmeyin.

## Keşif yolları

### Bonjour (LAN)

iOS uygulaması `local.` üzerinde `_openclaw-gw._tcp` öğesine ve yapılandırıldığında aynı
geniş alan DNS-SD keşif alanına göz atar. Aynı-LAN gateway'leri `local.` üzerinden otomatik görünür;
ağlar arası keşif, beacon türünü değiştirmeden yapılandırılmış geniş alan adını kullanabilir.

### Tailnet (ağlar arası)

mDNS engellenmişse, tek noktaya yayın DNS-SD bölgesi (bir alan adı seçin; örnek:
`openclaw.internal.`) ve Tailscale split DNS kullanın.
CoreDNS örneği için [Bonjour](/tr/gateway/bonjour) sayfasına bakın.

### Elle host/port

Ayarlar'da **Elle Host**'u etkinleştirin ve gateway host + port değerini girin (varsayılan `18789`).

## Canvas + A2UI

iOS düğümü bir WKWebView canvas işler. Onu sürmek için `node.invoke` kullanın:

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

Notlar:

- Gateway canvas host'u `/__openclaw__/canvas/` ve `/__openclaw__/a2ui/` sunar.
- Gateway HTTP sunucusundan sunulur (`gateway.port` ile aynı port, varsayılan `18789`).
- iOS düğümü, yerleşik iskeleti bağlı varsayılan görünüm olarak tutar. `canvas.a2ui.push` ve `canvas.a2ui.reset`, paketli uygulama sahipli A2UI sayfasını kullanır.
- Uzak Gateway A2UI sayfaları iOS'ta yalnızca işleme amaçlıdır; yerel A2UI düğme eylemleri yalnızca paketli uygulama sahipli sayfalardan kabul edilir.
- `canvas.navigate` ve `{"url":""}` ile yerleşik iskelete dönün.

## Computer Use ilişkisi

iOS uygulaması mobil bir düğüm yüzeyidir, Codex Computer Use arka ucu değildir. Codex
Computer Use ve `cua-driver mcp`, MCP araçları üzerinden yerel bir macOS masaüstünü kontrol eder;
iOS uygulaması iPhone yeteneklerini `canvas.*`, `camera.*`, `screen.*`, `location.*` ve `talk.*` gibi OpenClaw düğüm komutları üzerinden sunar.

Agent'lar düğüm komutlarını çağırarak iOS uygulamasını OpenClaw üzerinden hâlâ işletebilir,
ancak bu çağrılar gateway düğüm protokolünden geçer ve iOS ön plan/arka plan sınırlarını izler. Yerel masaüstü kontrolü için [Codex Computer Use](/tr/plugins/codex-computer-use) sayfasını,
iOS düğüm yetenekleri için bu sayfayı kullanın.

### Canvas değerlendirme / anlık görüntü

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## Sesle uyandırma + konuşma modu

- Sesle uyandırma ve konuşma modu Ayarlar’da kullanılabilir.
- OpenAI gerçek zamanlı Konuşma, `talk.realtime.transport` değeri `webrtc` olduğunda istemciye ait WebRTC kullanır; açık bir `gateway-relay` yapılandırması Gateway’e ait kalır. Bkz. [Konuşma modu](/tr/nodes/talk).
- Talk özellikli iOS düğümleri `talk` yeteneğini duyurur ve
  `talk.ptt.start`, `talk.ptt.stop`, `talk.ptt.cancel` ve `talk.ptt.once` bildirebilir;
  Gateway, bu bas-konuş komutlarına güvenilir
  Talk özellikli düğümler için varsayılan olarak izin verir.
- iOS arka plan sesini askıya alabilir; uygulama etkin değilken ses özelliklerini en iyi çaba esasına göre değerlendirin.

## Yaygın hatalar

- `NODE_BACKGROUND_UNAVAILABLE`: iOS uygulamasını ön plana getirin (tuval/kamera/ekran komutları bunu gerektirir).
- `A2UI_HOST_UNAVAILABLE`: paketle gelen A2UI sayfasına uygulama WebView’unda erişilemedi; uygulamayı Ekran sekmesinde ön planda tutun ve yeniden deneyin.
- Eşleştirme istemi hiç görünmüyor: `openclaw devices list` komutunu çalıştırın ve elle onaylayın.
- Yeniden kurulumdan sonra yeniden bağlanma başarısız oluyor: Keychain eşleştirme belirteci temizlenmiş; düğümü yeniden eşleştirin.

## İlgili belgeler

- [Eşleştirme](/tr/channels/pairing)
- [Keşif](/tr/gateway/discovery)
- [Bonjour](/tr/gateway/bonjour)
