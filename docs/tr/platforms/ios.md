---
read_when:
    - iOS düğümünü eşleştirme veya yeniden bağlama
    - iOS uygulamasını kaynaktan çalıştırma
    - Gateway keşfini veya canvas komutlarını hata ayıklama
summary: 'iOS düğüm uygulaması: Gateway’e bağlanma, eşleştirme, tuval ve sorun giderme'
title: iOS uygulaması
x-i18n:
    generated_at: "2026-07-02T08:43:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 26f58f5a3a4c6f918ddca493367554c2df5a34292deeb112296103dce2203743
    source_path: platforms/ios.md
    workflow: 16
---

Kullanılabilirlik: iPhone uygulama derlemeleri, bir sürüm için etkinleştirildiğinde Apple kanalları üzerinden dağıtılır. Yerel geliştirme derlemeleri de kaynaktan çalıştırılabilir.

## Ne yapar

- WebSocket üzerinden bir Gateway'e bağlanır (LAN veya tailnet).
- Düğüm yeteneklerini sunar: Canvas, ekran anlık görüntüsü, kamera yakalama, konum, konuşma modu, sesle uyandırma.
- `node.invoke` komutlarını alır ve düğüm durumu olaylarını bildirir.

## Gereksinimler

- Başka bir cihazda çalışan Gateway (macOS, Linux veya WSL2 üzerinden Windows).
- Ağ yolu:
  - Bonjour üzerinden aynı LAN, **veya**
  - Tekil yayın DNS-SD üzerinden tailnet (örnek etki alanı: `openclaw.internal.`), **veya**
  - Manuel ana makine/bağlantı noktası (geri dönüş).

## Hızlı başlangıç (eşleştir + bağlan)

1. Gateway'i başlatın:

```bash
openclaw gateway --port 18789
```

2. iOS uygulamasında Ayarlar'ı açın ve keşfedilen bir gateway seçin (veya Manuel Ana Makine'yi etkinleştirip ana makine/bağlantı noktası girin).

3. Gateway ana makinesinde eşleştirme isteğini onaylayın:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Uygulama değişen kimlik doğrulama ayrıntılarıyla (rol/kapsamlar/açık anahtar)
eşleştirmeyi yeniden denerse, önceki bekleyen istek geçersiz kılınır ve yeni bir `requestId` oluşturulur.
Onaylamadan önce `openclaw devices list` komutunu tekrar çalıştırın.

İsteğe bağlı: iOS düğümü her zaman sıkı denetlenen bir alt ağdan bağlanıyorsa, açık CIDR'ler veya tam IP'lerle
ilk kez düğüm otomatik onayına dahil olmayı seçebilirsiniz:

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

Bu varsayılan olarak devre dışıdır. Yalnızca istenen kapsamı olmayan yeni `role: node` eşleştirmesi için geçerlidir.
Operatör/tarayıcı eşleştirmesi ve herhangi bir rol, kapsam, meta veri veya açık anahtar değişikliği yine de manuel onay gerektirir.

4. Bağlantıyı doğrulayın:

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## Resmi derlemeler için relay destekli push

Resmi olarak dağıtılan iOS derlemeleri, ham APNs belirtecini gateway'e yayımlamak yerine harici push relay kullanır.

Herkese açık sürüm hattındaki resmi App Store derlemeleri, `https://ios-push-relay.openclaw.ai` konumundaki barındırılan relay'i kullanır.

Özel relay dağıtımları, relay URL'si gateway relay URL'siyle eşleşen, bilinçli olarak ayrı bir iOS derleme/dağıtım yolu gerektirir. Herkese açık App Store sürüm hattı, özel relay URL geçersiz kılmalarını kabul etmez. Özel bir relay derlemesi kullanıyorsanız, eşleşen gateway relay URL'sini ayarlayın:

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

- iOS uygulaması, App Attest ve StoreKit uygulama işlemi JWS'si kullanarak relay'e kaydolur.
- Relay, opak bir relay tanıtıcısı ve kayıt kapsamlı bir gönderim izni döndürür.
- iOS uygulaması eşleştirilmiş gateway kimliğini alır ve relay kaydına dahil eder; böylece relay destekli kayıt, o belirli gateway'e devredilir.
- Uygulama, bu relay destekli kaydı `push.apns.register` ile eşleştirilmiş gateway'e iletir.
- Gateway, bu saklanan relay tanıtıcısını `push.test`, arka plan uyandırmaları ve uyandırma dürtmeleri için kullanır.
- Özel gateway relay URL'leri, iOS derlemesine gömülü relay URL'siyle eşleşmelidir.
- Uygulama daha sonra farklı bir gateway'e veya farklı relay temel URL'sine sahip bir derlemeye bağlanırsa, eski bağlamayı yeniden kullanmak yerine relay kaydını yeniler.

Bu yol için gateway'in **ihtiyaç duymadığı** şeyler:

- Dağıtım genelinde relay belirteci yok.
- Resmi App Store relay destekli gönderimleri için doğrudan APNs anahtarı yok.

Beklenen operatör akışı:

1. Resmi iOS uygulamasını yükleyin.
2. İsteğe bağlı: `gateway.push.apns.relay.baseUrl` değerini gateway'de yalnızca bilinçli olarak ayrı bir özel relay derlemesi kullanırken ayarlayın.
3. Uygulamayı gateway ile eşleştirin ve bağlanmayı tamamlamasına izin verin.
4. Uygulama, APNs belirteci aldıktan, operatör oturumu bağlandıktan ve relay kaydı başarılı olduktan sonra `push.apns.register` öğesini otomatik olarak yayımlar.
5. Bundan sonra `push.test`, yeniden bağlanma uyandırmaları ve uyandırma dürtmeleri saklanan relay destekli kaydı kullanabilir.

## Arka plan canlılık işaretleri

iOS uygulamayı sessiz push, arka plan yenilemesi veya önemli konum olayı için uyandırdığında, uygulama
kısa bir düğüm yeniden bağlantısı dener ve ardından `event: "node.presence.alive"` ile `node.event` çağırır.
Gateway bunu, yalnızca kimliği doğrulanmış düğüm cihaz kimliği bilindikten sonra eşleştirilmiş düğüm/cihaz meta verilerinde
`lastSeenAtMs`/`lastSeenReason` olarak kaydeder.

Uygulama, arka plan uyandırmasını yalnızca gateway yanıtı `handled: true` içerdiğinde başarıyla kaydedilmiş sayar.
Daha eski gateway'ler `node.event` çağrısını `{ "ok": true }` ile onaylayabilir; bu yanıt uyumludur ancak kalıcı bir son görülme güncellemesi sayılmaz.

Uyumluluk notu:

- `OPENCLAW_APNS_RELAY_BASE_URL`, gateway için geçici bir ortam değişkeni geçersiz kılması olarak hâlâ çalışır.
- Herkese açık App Store sürüm hattı, iOS derlemeleri için `OPENCLAW_PUSH_RELAY_BASE_URL` değerini reddeder.

## Kimlik doğrulama ve güven akışı

Relay, resmi iOS derlemeleri için gateway üzerinde doğrudan APNs'in sağlayamayacağı iki kısıtı uygulamak için vardır:

- Yalnızca Apple üzerinden dağıtılan gerçek OpenClaw iOS derlemeleri barındırılan relay'i kullanabilir.
- Bir gateway, yalnızca o belirli gateway ile eşleştirilmiş iOS cihazları için relay destekli push gönderebilir.

Atlamadan atlamaya:

1. `iOS app -> gateway`
   - Uygulama önce normal Gateway kimlik doğrulama akışı üzerinden gateway ile eşleşir.
   - Bu, uygulamaya kimliği doğrulanmış bir düğüm oturumu ve kimliği doğrulanmış bir operatör oturumu sağlar.
   - Operatör oturumu `gateway.identity.get` çağrısı yapmak için kullanılır.

2. `iOS app -> relay`
   - Uygulama, HTTPS üzerinden relay kayıt uç noktalarını çağırır.
   - Kayıt, App Attest kanıtı ile bir StoreKit uygulama işlemi JWS'si içerir.
   - Relay, paket kimliğini, App Attest kanıtını ve Apple dağıtım kanıtını doğrular ve
     resmi/üretim dağıtım yolunu gerektirir.
   - Barındırılan relay'i yerel Xcode/geliştirme derlemelerinin kullanmasını engelleyen şey budur. Yerel bir derleme
     imzalanmış olabilir, ancak relay'in beklediği resmi Apple dağıtım kanıtını karşılamaz.

3. `gateway identity delegation`
   - Relay kaydından önce uygulama, eşleşmiş gateway kimliğini
     `gateway.identity.get` üzerinden alır.
   - Uygulama bu gateway kimliğini relay kayıt yüküne ekler.
   - Relay, bu gateway kimliğine devredilmiş bir relay tanıtıcısı ve kayıt kapsamlı bir gönderim izni döndürür.

4. `gateway -> relay`
   - Gateway, `push.apns.register` içinden gelen relay tanıtıcısını ve gönderim iznini saklar.
   - `push.test`, yeniden bağlanma uyandırmaları ve uyandırma dürtmelerinde gateway, gönderim isteğini
     kendi cihaz kimliğiyle imzalar.
   - Relay, hem saklanan gönderim iznini hem de gateway imzasını kayıttan devredilen
     gateway kimliğine göre doğrular.
   - Başka bir gateway, tanıtıcıyı bir şekilde elde etse bile bu saklanan kaydı yeniden kullanamaz.

5. `relay -> APNs`
   - Relay, resmi derleme için üretim APNs kimlik bilgilerine ve ham APNs belirtecine sahiptir.
   - Gateway, relay destekli resmi derlemeler için ham APNs belirtecini asla saklamaz.
   - Relay, eşleşmiş gateway adına son anlık bildirimi APNs'ye gönderir.

Bu tasarımın oluşturulma nedeni:

- Üretim APNs kimlik bilgilerini kullanıcı gateway'lerinin dışında tutmak.
- Ham resmi derleme APNs belirteçlerini gateway üzerinde saklamaktan kaçınmak.
- Barındırılan relay kullanımına yalnızca resmi OpenClaw iOS derlemeleri için izin vermek.
- Bir gateway'in, farklı bir gateway'e ait iOS cihazlarına uyandırma anlık bildirimleri göndermesini önlemek.

Yerel/manuel derlemeler doğrudan APNs üzerinde kalır. Bu derlemeleri relay olmadan test ediyorsanız,
gateway yine de doğrudan APNs kimlik bilgilerine ihtiyaç duyar:

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

Bunlar gateway ana makinesi çalışma zamanı ortam değişkenleridir, Fastlane ayarları değildir. `apps/ios/fastlane/.env` yalnızca
`APP_STORE_CONNECT_KEY_ID` ve
`APP_STORE_CONNECT_ISSUER_ID` gibi App Store Connect kimlik doğrulamasını saklar; yerel iOS derlemeleri için doğrudan APNs teslimatını yapılandırmaz.

Önerilen gateway ana makinesi depolaması:

```bash
mkdir -p ~/.openclaw/credentials/apns
chmod 700 ~/.openclaw/credentials/apns
mv /path/to/AuthKey_KEYID.p8 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
chmod 600 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
export OPENCLAW_APNS_PRIVATE_KEY_PATH="$HOME/.openclaw/credentials/apns/AuthKey_KEYID.p8"
```

`.p8` dosyasını commit'lemeyin veya repo checkout'u altına yerleştirmeyin.

## Keşif yolları

### Bonjour (LAN)

iOS uygulaması `local.` üzerinde `_openclaw-gw._tcp` öğesine ve yapılandırıldığında aynı
geniş alan DNS-SD keşif etki alanına göz atar. Aynı LAN'daki gateway'ler `local.` üzerinden otomatik görünür;
ağlar arası keşif, işaret türünü değiştirmeden yapılandırılmış geniş alan etki alanını kullanabilir.

### Tailnet (ağlar arası)

mDNS engelleniyorsa tek noktaya yayın DNS-SD bölgesi kullanın (bir etki alanı seçin; örnek:
`openclaw.internal.`) ve Tailscale split DNS.
CoreDNS örneği için [Bonjour](/tr/gateway/bonjour) bölümüne bakın.

### Manuel ana makine/bağlantı noktası

Ayarlar'da **Manuel Ana Makine** seçeneğini etkinleştirin ve gateway ana makinesi + bağlantı noktasını girin (varsayılan `18789`).

## Canvas + A2UI

iOS düğümü bir WKWebView canvas'ı işler. Bunu sürmek için `node.invoke` kullanın:

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

Notlar:

- Gateway canvas ana makinesi `/__openclaw__/canvas/` ve `/__openclaw__/a2ui/` sunar.
- Gateway HTTP sunucusundan sunulur (`gateway.port` ile aynı bağlantı noktası, varsayılan `18789`).
- iOS düğümü, yerleşik iskeleti bağlı varsayılan görünüm olarak korur. `canvas.a2ui.push` ve `canvas.a2ui.reset`, paketlenmiş uygulama sahibi A2UI sayfasını kullanır.
- Uzak Gateway A2UI sayfaları iOS'ta yalnızca işleme amaçlıdır; yerel A2UI düğme eylemleri yalnızca paketlenmiş uygulama sahibi sayfalardan kabul edilir.
- `canvas.navigate` ve `{"url":""}` ile yerleşik iskelete dönün.

## Computer Use ilişkisi

iOS uygulaması bir mobil düğüm yüzeyidir, Codex Computer Use arka ucu değildir. Codex
Computer Use ve `cua-driver mcp`, MCP araçları üzerinden yerel bir macOS masaüstünü denetler; iOS uygulaması iPhone yeteneklerini `canvas.*`, `camera.*`, `screen.*`, `location.*` ve `talk.*` gibi OpenClaw düğüm komutları üzerinden sunar.

Aracılar OpenClaw üzerinden düğüm komutlarını çağırarak iOS uygulamasını yine de çalıştırabilir,
ancak bu çağrılar gateway düğüm protokolünden geçer ve iOS ön plan/arka plan sınırlarını izler. Yerel masaüstü denetimi için [Codex Computer Use](/tr/plugins/codex-computer-use)
ve iOS düğüm yetenekleri için bu sayfayı kullanın.

### Canvas eval / snapshot

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## Sesle uyandırma + konuşma modu

- Sesle uyandırma ve konuşma modu Ayarlar'da kullanılabilir.
- Konuşma özellikli iOS düğümleri `talk` yeteneğini ilan eder ve
  `talk.ptt.start`, `talk.ptt.stop`, `talk.ptt.cancel` ve `talk.ptt.once` bildirebilir;
  Gateway, bu bas-konuş komutlarına güvenilir
  konuşma özellikli düğümler için varsayılan olarak izin verir.
- iOS arka plan sesini askıya alabilir; uygulama etkin değilken ses özelliklerini en iyi çaba olarak değerlendirin.

## Yaygın hatalar

- `NODE_BACKGROUND_UNAVAILABLE`: iOS uygulamasını ön plana getirin (canvas/kamera/ekran komutları bunu gerektirir).
- `A2UI_HOST_UNAVAILABLE`: paketlenmiş A2UI sayfasına uygulama WebView'ında ulaşılamadı; uygulamayı Ekran sekmesinde ön planda tutun ve yeniden deneyin.
- Eşleştirme istemi hiç görünmez: `openclaw devices list` çalıştırın ve manuel olarak onaylayın.
- Yeniden yüklemeden sonra yeniden bağlanma başarısız olur: Keychain eşleştirme belirteci temizlendi; düğümü yeniden eşleştirin.

## İlgili belgeler

- [Eşleştirme](/tr/channels/pairing)
- [Keşif](/tr/gateway/discovery)
- [Bonjour](/tr/gateway/bonjour)
