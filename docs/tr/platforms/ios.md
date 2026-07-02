---
read_when:
    - iOS düğümünü eşleştirme veya yeniden bağlama
    - iOS uygulamasını kaynaktan çalıştırma
    - Gateway keşfini veya tuval komutlarını hata ayıklama
summary: 'iOS node uygulaması: Gateway’e bağlanma, eşleştirme, canvas ve sorun giderme'
title: iOS uygulaması
x-i18n:
    generated_at: "2026-07-02T22:45:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 150349a06488ecb36a4456d323738cca329c47d83ef6006e6f8de5e39ebb4902
    source_path: platforms/ios.md
    workflow: 16
---

Kullanılabilirlik: iPhone uygulama derlemeleri, bir sürüm için etkinleştirildiğinde Apple kanalları üzerinden dağıtılır. Yerel geliştirme derlemeleri de kaynaktan çalıştırılabilir.

## Ne yapar

- WebSocket üzerinden bir Gateway'e bağlanır (LAN veya tailnet).
- Node yeteneklerini sunar: Canvas, ekran anlık görüntüsü, kamera yakalama, konum, konuşma modu, sesle uyandırma.
- `node.invoke` komutlarını alır ve Node durum olaylarını bildirir.

## Gereksinimler

- Başka bir cihazda çalışan Gateway (macOS, Linux veya WSL2 üzerinden Windows).
- Ağ yolu:
  - Bonjour üzerinden aynı LAN, **veya**
  - Unicast DNS-SD üzerinden tailnet (örnek etki alanı: `openclaw.internal.`), **veya**
  - Manuel host/port (yedek).

## Hızlı başlangıç (eşleştir + bağlan)

1. Gateway'i başlatın:

```bash
openclaw gateway --port 18789
```

2. iOS uygulamasında Ayarlar'ı açın ve keşfedilen bir gateway seçin (veya Manuel Host'u etkinleştirip host/port girin).

3. Eşleştirme isteğini gateway host'unda onaylayın:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Uygulama değişen kimlik doğrulama ayrıntılarıyla (rol/kapsamlar/açık anahtar)
eşleştirmeyi yeniden denerse, önceki bekleyen istek geçersiz kılınır ve yeni bir `requestId` oluşturulur.
Onaydan önce `openclaw devices list` komutunu yeniden çalıştırın.

İsteğe bağlı: iOS Node her zaman sıkı denetlenen bir alt ağdan bağlanıyorsa,
açık CIDR'ler veya tam IP'lerle ilk kez Node otomatik onayını etkinleştirebilirsiniz:

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

Bu varsayılan olarak devre dışıdır. Yalnızca istenen kapsam bulunmayan yeni `role: node`
eşleştirmeleri için geçerlidir. Operatör/tarayıcı eşleştirmesi ve herhangi bir rol, kapsam, metadata veya
açık anahtar değişikliği yine manuel onay gerektirir.

4. Bağlantıyı doğrulayın:

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## Resmi derlemeler için aktarıcı destekli anlık bildirim

Resmi olarak dağıtılan iOS derlemeleri, ham APNs token'ını gateway'e yayımlamak yerine
harici anlık bildirim aktarıcısını kullanır.

Herkese açık sürüm hattındaki resmi App Store derlemeleri, `https://ios-push-relay.openclaw.ai` adresindeki barındırılan aktarıcıyı kullanır.

Özel aktarıcı dağıtımları, aktarıcı URL'si gateway aktarıcı URL'siyle eşleşen, özellikle ayrı bir iOS derleme/dağıtım yolu gerektirir. Herkese açık App Store sürüm hattı özel aktarıcı URL geçersiz kılmalarını kabul etmez. Özel bir aktarıcı derlemesi kullanıyorsanız, eşleşen gateway aktarıcı URL'sini ayarlayın:

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

- iOS uygulaması, App Attest ve StoreKit uygulama işlem JWS'si kullanarak aktarıcıya kaydolur.
- Aktarıcı, opak bir aktarıcı tanıtıcısı ve kayıt kapsamlı bir gönderme izni döndürür.
- iOS uygulaması eşleştirilmiş gateway kimliğini alır ve bunu aktarıcı kaydına dahil eder; böylece aktarıcı destekli kayıt söz konusu gateway'e devredilir.
- Uygulama, bu aktarıcı destekli kaydı `push.apns.register` ile eşleştirilmiş gateway'e iletir.
- Gateway, bu saklanan aktarıcı tanıtıcısını `push.test`, arka plan uyandırmaları ve uyandırma tetiklemeleri için kullanır.
- Özel gateway aktarıcı URL'leri, iOS derlemesine gömülü aktarıcı URL'siyle eşleşmelidir.
- Uygulama daha sonra farklı bir gateway'e veya farklı bir aktarıcı temel URL'sine sahip bir derlemeye bağlanırsa, eski bağlamayı yeniden kullanmak yerine aktarıcı kaydını yeniler.

Bu yol için gateway'in **ihtiyaç duymadığı** şeyler:

- Dağıtım genelinde aktarıcı token'ı yoktur.
- Resmi App Store aktarıcı destekli gönderimleri için doğrudan APNs anahtarı yoktur.

Beklenen operatör akışı:

1. Resmi iOS uygulamasını yükleyin.
2. İsteğe bağlı: `gateway.push.apns.relay.baseUrl` değerini gateway'de yalnızca özellikle ayrı bir özel aktarıcı derlemesi kullanırken ayarlayın.
3. Uygulamayı gateway ile eşleştirin ve bağlantıyı tamamlamasına izin verin.
4. Uygulama, bir APNs token'ı aldıktan, operatör oturumu bağlandıktan ve aktarıcı kaydı başarılı olduktan sonra `push.apns.register` yayımlar.
5. Bundan sonra `push.test`, yeniden bağlanma uyandırmaları ve uyandırma tetiklemeleri saklanan aktarıcı destekli kaydı kullanabilir.

## Arka plan canlılık sinyalleri

iOS uygulamayı sessiz anlık bildirim, arka plan yenilemesi veya önemli konum olayı için uyandırdığında, uygulama
kısa bir Node yeniden bağlantısı dener ve ardından `event: "node.presence.alive"` ile `node.event` çağırır.
Gateway, bunu yalnızca kimliği doğrulanmış Node cihaz kimliği bilindikten sonra eşleştirilmiş Node/cihaz metadata'sında
`lastSeenAtMs`/`lastSeenReason` olarak kaydeder.

Uygulama, arka plan uyandırmasını yalnızca gateway yanıtı `handled: true` içerdiğinde başarıyla kaydedilmiş sayar.
Eski gateway'ler `node.event` çağrısını `{ "ok": true }` ile onaylayabilir; bu yanıt uyumludur
ancak kalıcı bir son görülme güncellemesi olarak sayılmaz.

Uyumluluk notu:

- `OPENCLAW_APNS_RELAY_BASE_URL`, gateway için geçici bir env geçersiz kılması olarak hâlâ çalışır.
- Herkese açık App Store sürüm hattı, iOS derlemeleri için `OPENCLAW_PUSH_RELAY_BASE_URL` değerini reddeder.

## Kimlik doğrulama ve güven akışı

Aktarıcı, resmi iOS derlemeleri için doğrudan gateway üzerinde APNs kullanımının sağlayamadığı iki kısıtı
uygulamak için vardır:

- Yalnızca Apple üzerinden dağıtılan gerçek OpenClaw iOS derlemeleri barındırılan aktarıcıyı kullanabilir.
- Bir gateway, yalnızca söz konusu gateway ile eşleştirilmiş iOS cihazları için aktarıcı destekli anlık bildirimler gönderebilir.

Adım adım:

1. `iOS app -> gateway`
   - Uygulama önce normal Gateway kimlik doğrulama akışı üzerinden gateway ile eşleşir.
   - Bu, uygulamaya kimliği doğrulanmış bir Node oturumu ve kimliği doğrulanmış bir operatör oturumu verir.
   - Operatör oturumu `gateway.identity.get` çağırmak için kullanılır.

2. `iOS app -> relay`
   - Uygulama, aktarıcı kayıt uç noktalarını HTTPS üzerinden çağırır.
   - Kayıt, App Attest kanıtı ve StoreKit uygulama işlem JWS'si içerir.
   - Aktarıcı, bundle ID'yi, App Attest kanıtını ve Apple dağıtım kanıtını doğrular ve
     resmi/üretim dağıtım yolunu gerektirir.
   - Barındırılan aktarıcıyı yerel Xcode/dev derlemelerinin kullanmasını engelleyen budur. Yerel bir derleme
     imzalanmış olabilir, ancak aktarıcının beklediği resmi Apple dağıtım kanıtını karşılamaz.

3. `gateway identity delegation`
   - Aktarıcı kaydından önce uygulama, eşleştirilmiş gateway kimliğini
     `gateway.identity.get` üzerinden alır.
   - Uygulama, bu gateway kimliğini aktarıcı kayıt yüküne dahil eder.
   - Aktarıcı, bu gateway kimliğine devredilmiş bir aktarıcı tanıtıcısı ve kayıt kapsamlı gönderme izni döndürür.

4. `gateway -> relay`
   - Gateway, `push.apns.register` üzerinden gelen aktarıcı tanıtıcısını ve gönderme iznini saklar.
   - `push.test`, yeniden bağlanma uyandırmaları ve uyandırma tetiklemelerinde gateway, gönderme isteğini
     kendi cihaz kimliğiyle imzalar.
   - Aktarıcı, hem saklanan gönderme iznini hem de gateway imzasını kayıttan devredilen
     gateway kimliğine göre doğrular.
   - Başka bir gateway, tanıtıcıyı bir şekilde elde etse bile bu saklanan kaydı yeniden kullanamaz.

5. `relay -> APNs`
   - Aktarıcı, üretim APNs kimlik bilgilerine ve resmi derlemenin ham APNs token'ına sahiptir.
   - Gateway, aktarıcı destekli resmi derlemeler için ham APNs token'ını hiçbir zaman saklamaz.
   - Aktarıcı, son anlık bildirimi eşleştirilmiş gateway adına APNs'e gönderir.

Bu tasarımın oluşturulma nedenleri:

- Üretim APNs kimlik bilgilerini kullanıcı gateway'lerinin dışında tutmak.
- Ham resmi derleme APNs token'larını gateway'de saklamaktan kaçınmak.
- Barındırılan aktarıcı kullanımına yalnızca resmi OpenClaw iOS derlemeleri için izin vermek.
- Bir gateway'in farklı bir gateway'e ait iOS cihazlarına uyandırma anlık bildirimleri göndermesini önlemek.

Yerel/manuel derlemeler doğrudan APNs üzerinde kalır. Bu derlemeleri aktarıcı olmadan test ediyorsanız,
gateway'in yine de doğrudan APNs kimlik bilgilerine ihtiyacı vardır:

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

Bunlar gateway host'u çalışma zamanı env vars değerleridir, Fastlane ayarları değildir. `apps/ios/fastlane/.env` yalnızca
`APP_STORE_CONNECT_KEY_ID` ve `APP_STORE_CONNECT_ISSUER_ID` gibi App Store Connect kimlik doğrulamasını saklar;
yerel iOS derlemeleri için doğrudan APNs teslimini yapılandırmaz.

Önerilen gateway host'u depolaması:

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

iOS uygulaması `_openclaw-gw._tcp` değerini `local.` üzerinde ve yapılandırıldığında aynı
geniş alan DNS-SD keşif etki alanında tarar. Aynı LAN'daki gateway'ler `local.` üzerinden otomatik görünür;
ağlar arası keşif, beacon türünü değiştirmeden yapılandırılmış geniş alan etki alanını kullanabilir.

### Tailnet (ağlar arası)

mDNS engellenmişse bir unicast DNS-SD bölgesi kullanın (bir etki alanı seçin; örnek:
`openclaw.internal.`) ve Tailscale split DNS kullanın.
CoreDNS örneği için [Bonjour](/tr/gateway/bonjour) bölümüne bakın.

### Manuel host/port

Ayarlar'da **Manuel Host** seçeneğini etkinleştirin ve gateway host + port değerini girin (varsayılan `18789`).

## Canvas + A2UI

iOS Node bir WKWebView canvas oluşturur. Bunu yönetmek için `node.invoke` kullanın:

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

Notlar:

- Gateway canvas host'u `/__openclaw__/canvas/` ve `/__openclaw__/a2ui/` yollarını sunar.
- Gateway HTTP sunucusundan sunulur (`gateway.port` ile aynı port, varsayılan `18789`).
- iOS Node, yerleşik iskeleti bağlı varsayılan görünüm olarak tutar. `canvas.a2ui.push` ve `canvas.a2ui.reset`, paketlenmiş uygulama sahipli A2UI sayfasını kullanır.
- Uzak Gateway A2UI sayfaları iOS'ta yalnızca render içindir; yerel A2UI düğme eylemleri yalnızca paketlenmiş uygulama sahipli sayfalardan kabul edilir.
- Yerleşik iskelete `canvas.navigate` ve `{"url":""}` ile dönün.

## Computer Use ilişkisi

iOS uygulaması bir mobil Node yüzeyidir, Codex Computer Use arka ucu değildir. Codex
Computer Use ve `cua-driver mcp`, MCP araçları üzerinden yerel bir macOS masaüstünü
kontrol eder; iOS uygulaması ise `canvas.*`, `camera.*`, `screen.*`, `location.*` ve `talk.*`
gibi OpenClaw Node komutları üzerinden iPhone yeteneklerini sunar.

Agent'lar OpenClaw üzerinden Node komutlarını çağırarak iOS uygulamasını yine de çalıştırabilir,
ancak bu çağrılar gateway Node protokolünden geçer ve iOS ön plan/arka plan sınırlarına uyar.
Yerel masaüstü kontrolü için [Codex Computer Use](/tr/plugins/codex-computer-use) sayfasını,
iOS Node yetenekleri için bu sayfayı kullanın.

### Canvas eval / anlık görüntü

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## Sesle uyandırma + konuşma modu

- Sesle uyandırma ve konuşma modu Ayarlar'da kullanılabilir.
- OpenAI gerçek zamanlı konuşma, `talk.realtime.transport` değeri `webrtc` olduğunda istemci sahipli WebRTC kullanır; açık bir `gateway-relay` yapılandırması Gateway sahipli olmaya devam eder. Bkz. [Konuşma modu](/tr/nodes/talk).
- Konuşma destekli iOS Node'lar `talk` yeteneğini duyurur ve
  `talk.ptt.start`, `talk.ptt.stop`, `talk.ptt.cancel` ve `talk.ptt.once` bildirebilir;
  Gateway, güvenilen konuşma destekli Node'lar için bu bas-konuş komutlarına varsayılan olarak izin verir.
- iOS arka plan sesini askıya alabilir; uygulama etkin olmadığında ses özelliklerini en iyi çaba olarak değerlendirin.

## Yaygın hatalar

- `NODE_BACKGROUND_UNAVAILABLE`: iOS uygulamasını ön plana getirin (canvas/kamera/ekran komutları bunu gerektirir).
- `A2UI_HOST_UNAVAILABLE`: paketlenmiş A2UI sayfasına uygulama WebView içinde erişilemedi; uygulamayı Ekran sekmesinde ön planda tutun ve yeniden deneyin.
- Eşleştirme istemi hiç görünmüyor: `openclaw devices list` çalıştırın ve manuel olarak onaylayın.
- Yeniden yüklemeden sonra yeniden bağlanma başarısız oluyor: Keychain eşleştirme token'ı temizlenmiştir; Node'u yeniden eşleştirin.

## İlgili belgeler

- [Eşleştirme](/tr/channels/pairing)
- [Keşif](/tr/gateway/discovery)
- [Bonjour](/tr/gateway/bonjour)
