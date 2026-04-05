---
read_when:
    - iOS düğümünü eşleştirirken veya yeniden bağlarken
    - iOS uygulamasını kaynaktan çalıştırırken
    - Gateway keşfini veya canvas komutlarını hata ayıklarken
summary: 'iOS düğüm uygulaması: Gateway''e bağlanma, eşleştirme, canvas ve sorun giderme'
title: iOS Uygulaması
x-i18n:
    generated_at: "2026-04-05T14:00:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1e9d9cec58afd4003dff81d3e367bfbc6a634c1b229e433e08fd78fbb5f2e5a9
    source_path: platforms/ios.md
    workflow: 15
---

# iOS Uygulaması (Düğüm)

Kullanılabilirlik: dahili önizleme. iOS uygulaması henüz herkese açık olarak dağıtılmıyor.

## Ne yapar

- Bir Gateway'e WebSocket üzerinden bağlanır (LAN veya tailnet).
- Düğüm yeteneklerini sunar: Canvas, Ekran anlık görüntüsü, Kamera yakalama, Konum, Konuşma modu, Sesle uyandırma.
- `node.invoke` komutlarını alır ve düğüm durum olaylarını bildirir.

## Gereksinimler

- Başka bir cihazda çalışan Gateway (macOS, Linux veya WSL2 üzerinden Windows).
- Ağ yolu:
  - Aynı LAN üzerinde Bonjour üzerinden, **veya**
  - Unicast DNS-SD üzerinden tailnet (örnek alan adı: `openclaw.internal.`), **veya**
  - Manuel ana makine/port (yedek seçenek).

## Hızlı başlangıç (eşleştir + bağlan)

1. Gateway'i başlatın:

```bash
openclaw gateway --port 18789
```

2. iOS uygulamasında Ayarlar'ı açın ve keşfedilen bir gateway seçin (veya Manual Host'u etkinleştirip ana makine/port girin).

3. Gateway ana makinesinde eşleştirme isteğini onaylayın:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Uygulama değiştirilmiş kimlik doğrulama ayrıntılarıyla (rol/kapsamlar/genel anahtar)
eşleştirmeyi yeniden denerse, önceki bekleyen istek geçersiz kılınır ve yeni bir `requestId` oluşturulur.
Onaylamadan önce `openclaw devices list` komutunu yeniden çalıştırın.

4. Bağlantıyı doğrulayın:

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## Resmi yapılar için relay destekli push

Resmi olarak dağıtılan iOS yapıları, ham APNs token'ını gateway'e yayımlamak yerine
harici push relay'i kullanır.

Gateway tarafı gereksinimi:

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

Akışın çalışma şekli:

- iOS uygulaması, App Attest ve uygulama makbuzunu kullanarak relay'e kaydolur.
- Relay, opak bir relay tanıtıcısı ile kayıt kapsamlı bir gönderim izni döndürür.
- iOS uygulaması eşleştirilmiş gateway kimliğini alır ve bunu relay kaydına dahil eder; böylece relay destekli kayıt bu belirli gateway'e devredilir.
- Uygulama bu relay destekli kaydı `push.apns.register` ile eşleştirilmiş gateway'e iletir.
- Gateway, `push.test`, arka plan uyandırmaları ve uyandırma dürtmeleri için depolanan bu relay tanıtıcısını kullanır.
- Gateway relay temel URL'si, resmi/TestFlight iOS yapısına gömülü relay URL'siyle eşleşmelidir.
- Uygulama daha sonra farklı bir gateway'e veya farklı relay temel URL'sine sahip bir yapıya bağlanırsa, eski bağı yeniden kullanmak yerine relay kaydını yeniler.

Gateway'in bu yol için **ihtiyaç duymadığı** şeyler:

- Dağıtım genelinde bir relay token'ı yoktur.
- Resmi/TestFlight relay destekli gönderimler için doğrudan APNs anahtarı yoktur.

Beklenen operatör akışı:

1. Resmi/TestFlight iOS yapısını yükleyin.
2. Gateway üzerinde `gateway.push.apns.relay.baseUrl` değerini ayarlayın.
3. Uygulamayı gateway ile eşleştirin ve bağlanmayı tamamlamasına izin verin.
4. Uygulama, APNs token'ına sahip olduktan, operatör oturumu bağlandıktan ve relay kaydı başarılı olduktan sonra `push.apns.register` işlemini otomatik olarak yayımlar.
5. Bundan sonra `push.test`, yeniden bağlanma uyandırmaları ve uyandırma dürtmeleri depolanan relay destekli kaydı kullanabilir.

Uyumluluk notu:

- `OPENCLAW_APNS_RELAY_BASE_URL`, gateway için geçici ortam değişkeni geçersiz kılması olarak hâlâ çalışır.

## Kimlik doğrulama ve güven akışı

Relay, resmi iOS yapıları için doğrudan gateway üzerinde APNs'in sağlayamadığı iki kısıtı
uygulamak için vardır:

- Yalnızca Apple üzerinden dağıtılan gerçek OpenClaw iOS yapıları barındırılan relay'i kullanabilir.
- Bir gateway, yalnızca o belirli gateway ile eşleştirilmiş iOS cihazları için relay destekli push gönderebilir.

Adım adım:

1. `iOS app -> gateway`
   - Uygulama önce normal Gateway kimlik doğrulama akışı üzerinden gateway ile eşleştirilir.
   - Bu, uygulamaya kimliği doğrulanmış bir düğüm oturumu ve kimliği doğrulanmış bir operatör oturumu verir.
   - Operatör oturumu, `gateway.identity.get` çağrısı için kullanılır.

2. `iOS app -> relay`
   - Uygulama, relay kayıt uç noktalarını HTTPS üzerinden çağırır.
   - Kayıt, App Attest kanıtını ve uygulama makbuzunu içerir.
   - Relay, paket kimliğini, App Attest kanıtını ve Apple makbuzunu doğrular ve
     resmi/üretim dağıtım yolunu zorunlu kılar.
   - Barındırılan relay'in yerel Xcode/geliştirme yapılarınca kullanılmasını engelleyen şey budur. Yerel bir yapı
     imzalanmış olabilir, ancak relay'in beklediği resmi Apple dağıtım kanıtını sağlamaz.

3. `gateway kimliği devri`
   - Relay kaydından önce uygulama, eşleştirilmiş gateway kimliğini
     `gateway.identity.get` üzerinden alır.
   - Uygulama bu gateway kimliğini relay kayıt yüküne dahil eder.
   - Relay, bu gateway kimliğine devredilmiş bir relay tanıtıcısı ve kayıt kapsamlı
     bir gönderim izni döndürür.

4. `gateway -> relay`
   - Gateway, `push.apns.register` içindeki relay tanıtıcısını ve gönderim iznini depolar.
   - `push.test`, yeniden bağlanma uyandırmaları ve uyandırma dürtmelerinde gateway, gönderim isteğini
     kendi cihaz kimliğiyle imzalar.
   - Relay, hem depolanan gönderim iznini hem de gateway imzasını, kayıttaki devredilmiş
     gateway kimliğine karşı doğrular.
   - Başka bir gateway, tanıtıcıyı bir şekilde ele geçirse bile bu depolanan kaydı yeniden kullanamaz.

5. `relay -> APNs`
   - Relay, resmi yapı için üretim APNs kimlik bilgilerine ve ham APNs token'ına sahiptir.
   - Gateway, relay destekli resmi yapılar için ham APNs token'ını hiçbir zaman depolamaz.
   - Relay, son push'u eşleştirilmiş gateway adına APNs'e gönderir.

Bu tasarımın oluşturulma nedeni:

- Üretim APNs kimlik bilgilerini kullanıcı gateway'lerinden uzak tutmak.
- Ham resmi yapı APNs token'larını gateway üzerinde depolamaktan kaçınmak.
- Barındırılan relay kullanımına yalnızca resmi/TestFlight OpenClaw yapılarında izin vermek.
- Bir gateway'in, farklı bir gateway'e ait iOS cihazlarına uyandırma push'ları göndermesini önlemek.

Yerel/manüel yapılar doğrudan APNs üzerinde kalır. Relay olmadan bu yapıları test ediyorsanız,
gateway'in yine de doğrudan APNs kimlik bilgilerine ihtiyacı vardır:

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

## Keşif yolları

### Bonjour (LAN)

iOS uygulaması, `local.` üzerinde `_openclaw-gw._tcp` kaydına göz atar ve yapılandırıldığında aynı
geniş alan DNS-SD keşif alanına da göz atar. Aynı LAN üzerindeki gateway'ler `local.` üzerinden otomatik olarak görünür;
ağlar arası keşif, beacon türünü değiştirmeden yapılandırılmış geniş alan alanını kullanabilir.

### Tailnet (ağlar arası)

mDNS engellenmişse, bir unicast DNS-SD bölgesi kullanın (bir alan seçin; örnek:
`openclaw.internal.`) ve Tailscale split DNS kullanın.
CoreDNS örneği için bkz. [Bonjour](/tr/gateway/bonjour).

### Manuel ana makine/port

Ayarlar'da **Manual Host** seçeneğini etkinleştirin ve gateway ana makinesi + port girin (varsayılan `18789`).

## Canvas + A2UI

iOS düğümü bir WKWebView canvas oluşturur. Bunu yönlendirmek için `node.invoke` kullanın:

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

Notlar:

- Gateway canvas ana makinesi `/__openclaw__/canvas/` ve `/__openclaw__/a2ui/` yollarını sunar.
- Gateway HTTP sunucusundan sunulur (gateway.port ile aynı port, varsayılan `18789`).
- iOS düğümü, bir canvas ana makinesi URL'si duyurulduğunda bağlanırken otomatik olarak A2UI'ye gider.
- Yerleşik iskeleye geri dönmek için `canvas.navigate` ve `{"url":""}` kullanın.

### Canvas eval / anlık görüntü

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## Sesle uyandırma + konuşma modu

- Sesle uyandırma ve konuşma modu Ayarlar'da kullanılabilir.
- iOS arka plan sesini askıya alabilir; uygulama etkin değilken ses özelliklerini en iyi çaba olarak değerlendirin.

## Yaygın hatalar

- `NODE_BACKGROUND_UNAVAILABLE`: iOS uygulamasını ön plana getirin (canvas/kamera/ekran komutları bunu gerektirir).
- `A2UI_HOST_NOT_CONFIGURED`: Gateway bir canvas ana makinesi URL'si duyurmadı; [Gateway configuration](/tr/gateway/configuration) içindeki `canvasHost` değerini kontrol edin.
- Eşleştirme istemi hiç görünmüyor: `openclaw devices list` komutunu çalıştırın ve manuel olarak onaylayın.
- Yeniden yüklemeden sonra yeniden bağlanma başarısız oluyor: Keychain eşleştirme token'ı temizlendi; düğümü yeniden eşleştirin.

## İlgili belgeler

- [Eşleştirme](/tr/channels/pairing)
- [Keşif](/tr/gateway/discovery)
- [Bonjour](/tr/gateway/bonjour)
