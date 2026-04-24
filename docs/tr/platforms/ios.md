---
read_when:
    - iOS Node'unu eşleştirme veya yeniden bağlama
    - iOS uygulamasını kaynaktan çalıştırma
    - Gateway keşfini veya canvas komutlarını hata ayıklama
summary: 'iOS Node uygulaması: Gateway''e bağlanma, eşleştirme, canvas ve sorun giderme'
title: iOS uygulaması
x-i18n:
    generated_at: "2026-04-24T09:19:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: 87eaa706993bec9434bf22e18022af711b8398efff11c7fba4887aba46041ed3
    source_path: platforms/ios.md
    workflow: 15
---

Kullanılabilirlik: dahili önizleme. iOS uygulaması henüz herkese açık olarak dağıtılmıyor.

## Ne yapar

- Bir Gateway'e WebSocket üzerinden bağlanır (LAN veya tailnet).
- Node yeteneklerini sunar: Canvas, Screen snapshot, Camera capture, Location, Talk mode, Voice wake.
- `node.invoke` komutlarını alır ve Node durum olaylarını bildirir.

## Gereksinimler

- Başka bir cihazda çalışan Gateway (macOS, Linux veya WSL2 üzerinden Windows).
- Ağ yolu:
  - Bonjour üzerinden aynı LAN, **veya**
  - Unicast DNS-SD üzerinden tailnet (örnek alan adı: `openclaw.internal.`), **veya**
  - Manuel sunucu/port (fallback).

## Hızlı başlangıç (eşleştir + bağlan)

1. Gateway'i başlatın:

```bash
openclaw gateway --port 18789
```

2. iOS uygulamasında Ayarlar'ı açın ve keşfedilen bir gateway seçin (veya Manual Host'u etkinleştirip sunucu/port girin).

3. Eşleştirme isteğini gateway sunucusunda onaylayın:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Uygulama değişmiş auth ayrıntılarıyla (rol/kapsamlar/genel anahtar)
eşleştirmeyi yeniden denerse, önceki bekleyen istek geçersiz kılınır ve yeni bir `requestId` oluşturulur.
Onaylamadan önce `openclaw devices list` komutunu yeniden çalıştırın.

4. Bağlantıyı doğrulayın:

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## Resmi derlemeler için relay destekli push

Resmi dağıtılmış iOS derlemeleri, ham APNs
token'ını gateway'e yayınlamak yerine harici push relay kullanır.

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

Akışın işleyişi:

- iOS uygulaması, App Attest ve uygulama makbuzu kullanarak relay'e kaydolur.
- Relay, opak bir relay handle ile kayıt kapsamlı bir gönderim izni döndürür.
- iOS uygulaması eşleştirilmiş gateway kimliğini getirir ve relay destekli kaydın o belirli gateway'e devredilmesi için bunu relay kaydına dahil eder.
- Uygulama, bu relay destekli kaydı `push.apns.register` ile eşleştirilmiş gateway'e iletir.
- Gateway, `push.test`, arka plan uyanmaları ve uyanma dürtüleri için saklanan bu relay handle'ı kullanır.
- Gateway relay temel URL'si, resmi/TestFlight iOS derlemesine gömülü relay URL'siyle eşleşmelidir.
- Uygulama daha sonra farklı bir gateway'e veya farklı relay temel URL'sine sahip bir derlemeye bağlanırsa, eski bağı yeniden kullanmak yerine relay kaydını yeniler.

Bu yol için gateway'in **ihtiyacı olmayanlar**:

- Dağıtım genelinde relay token yok.
- Resmi/TestFlight relay destekli gönderimler için doğrudan APNs anahtarı yok.

Beklenen operatör akışı:

1. Resmi/TestFlight iOS derlemesini kurun.
2. Gateway üzerinde `gateway.push.apns.relay.baseUrl` ayarlayın.
3. Uygulamayı gateway ile eşleştirin ve bağlanmayı tamamlamasına izin verin.
4. Uygulama, bir APNs token'ı, operatör oturumu bağlantısı ve başarılı relay kaydı elde ettikten sonra `push.apns.register` yayınını otomatik yapar.
5. Bundan sonra `push.test`, yeniden bağlanma uyanmaları ve uyanma dürtüleri saklanan relay destekli kaydı kullanabilir.

Uyumluluk notu:

- `OPENCLAW_APNS_RELAY_BASE_URL`, gateway için geçici env geçersiz kılması olarak hâlâ çalışır.

## Kimlik doğrulama ve güven akışı

Relay, resmi iOS derlemeleri için doğrudan APNs-on-gateway yaklaşımının sağlayamadığı iki kısıtı zorlamak için vardır:

- Yalnızca Apple üzerinden dağıtılan gerçek OpenClaw iOS derlemeleri barındırılan relay'i kullanabilir.
- Bir gateway, yalnızca o belirli gateway ile eşleştirilen iOS cihazları için relay destekli push gönderebilir.

Adım adım:

1. `iOS app -> gateway`
   - Uygulama önce normal Gateway auth akışı üzerinden gateway ile eşleşir.
   - Bu, uygulamaya kimliği doğrulanmış bir Node oturumu artı kimliği doğrulanmış bir operatör oturumu verir.
   - Operatör oturumu `gateway.identity.get` çağrısı için kullanılır.

2. `iOS app -> relay`
   - Uygulama relay kayıt uç noktalarını HTTPS üzerinden çağırır.
   - Kayıt, App Attest kanıtı artı uygulama makbuzunu içerir.
   - Relay, bundle ID, App Attest kanıtı ve Apple makbuzunu doğrular ve
     resmi/üretim dağıtım yolunu zorunlu kılar.
   - Yerel Xcode/dev derlemelerinin barındırılan relay'i kullanmasını engelleyen şey budur. Yerel bir derleme
     imzalı olabilir, ancak relay'in beklediği resmi Apple dağıtım kanıtını karşılamaz.

3. `gateway identity delegation`
   - Relay kaydından önce uygulama, eşleştirilmiş gateway kimliğini
     `gateway.identity.get` üzerinden getirir.
   - Uygulama bu gateway kimliğini relay kayıt payload'una dahil eder.
   - Relay, o gateway kimliğine devredilen bir relay handle ve kayıt kapsamlı bir gönderim izni döndürür.

4. `gateway -> relay`
   - Gateway, `push.apns.register` içinden relay handle ve gönderim iznini saklar.
   - `push.test`, yeniden bağlanma uyanmaları ve uyanma dürtülerinde gateway, gönderim isteğini
     kendi cihaz kimliğiyle imzalar.
   - Relay, hem saklanan gönderim iznini hem de gateway imzasını kayıttaki devredilen
     gateway kimliğine göre doğrular.
   - Başka bir gateway, handle'ı bir şekilde ele geçirse bile bu saklanan kaydı yeniden kullanamaz.

5. `relay -> APNs`
   - Relay, üretim APNs kimlik bilgilerine ve resmi derleme için ham APNs token'ına sahiptir.
   - Gateway, relay destekli resmi derlemeler için ham APNs token'ını asla saklamaz.
   - Relay, son push'u eşleştirilmiş gateway adına APNs'e gönderir.

Bu tasarım neden oluşturuldu:

- Üretim APNs kimlik bilgilerini kullanıcı gateway'lerinin dışında tutmak için.
- Gateway üzerinde ham resmi derleme APNs token'larını saklamaktan kaçınmak için.
- Barındırılan relay kullanımına yalnızca resmi/TestFlight OpenClaw derlemeleri için izin vermek için.
- Bir gateway'in, farklı bir gateway'e ait iOS cihazlarına uyanma push'ları göndermesini önlemek için.

Yerel/manuel derlemeler doğrudan APNs üzerinde kalır. Bu derlemeleri relay olmadan test ediyorsanız,
gateway'in yine de doğrudan APNs kimlik bilgilerine ihtiyacı vardır:

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

Bunlar gateway sunucusu çalışma zamanı env değişkenleridir, Fastlane ayarları değildir. `apps/ios/fastlane/.env` yalnızca
`ASC_KEY_ID` ve `ASC_ISSUER_ID` gibi App Store Connect / TestFlight auth bilgilerini saklar; yerel iOS derlemeleri için
doğrudan APNs teslimini yapılandırmaz.

Önerilen gateway sunucusu depolaması:

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

iOS uygulaması `_openclaw-gw._tcp` kaydını `local.` üzerinde ve yapılandırıldığında aynı
wide-area DNS-SD keşif alanında tarar. Aynı LAN üzerindeki gateway'ler `local.` üzerinden otomatik görünür;
ağlar arası keşif ise beacon türünü değiştirmeden yapılandırılmış wide-area alanı kullanabilir.

### Tailnet (ağlar arası)

mDNS engellenmişse bir unicast DNS-SD zone kullanın (bir alan seçin; örnek:
`openclaw.internal.`) ve Tailscale split DNS kullanın.
CoreDNS örneği için bkz. [Bonjour](/tr/gateway/bonjour).

### Manuel sunucu/port

Ayarlar'da **Manual Host** özelliğini etkinleştirin ve gateway sunucusunu + portu girin (varsayılan `18789`).

## Canvas + A2UI

iOS Node, bir WKWebView canvas oluşturur. Bunu sürmek için `node.invoke` kullanın:

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

Notlar:

- Gateway canvas sunucusu `/__openclaw__/canvas/` ve `/__openclaw__/a2ui/` yollarını sunar.
- Bu, Gateway HTTP sunucusundan sunulur (`gateway.port` ile aynı port, varsayılan `18789`).
- iOS Node, bir canvas host URL'si bildirildiğinde bağlantıda otomatik olarak A2UI'ya gider.
- Yerleşik iskeleye dönmek için `canvas.navigate` ve `{"url":""}` kullanın.

### Canvas eval / snapshot

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## Voice wake + Talk mode

- Voice wake ve Talk mode Ayarlar içinde bulunur.
- iOS arka plan sesini askıya alabilir; uygulama etkin değilken ses özelliklerini best-effort olarak değerlendirin.

## Yaygın hatalar

- `NODE_BACKGROUND_UNAVAILABLE`: iOS uygulamasını ön plana getirin (canvas/camera/screen komutları bunu gerektirir).
- `A2UI_HOST_NOT_CONFIGURED`: Gateway bir canvas host URL'si bildirmedi; [Gateway configuration](/tr/gateway/configuration) içindeki `canvasHost` değerini kontrol edin.
- Eşleştirme istemi hiç görünmüyor: `openclaw devices list` çalıştırın ve manuel onaylayın.
- Yeniden kurulumdan sonra yeniden bağlanma başarısız: Keychain eşleştirme token'ı temizlendi; Node'u yeniden eşleştirin.

## İlgili belgeler

- [Pairing](/tr/channels/pairing)
- [Discovery](/tr/gateway/discovery)
- [Bonjour](/tr/gateway/bonjour)
