---
read_when:
    - iOS Node'unu eşleme veya yeniden bağlama
    - iOS uygulamasını kaynak koddan çalıştırma
    - Gateway keşfi veya tuval komutlarında hata ayıklama
summary: 'iOS Node uygulaması: Gateway’e bağlanma, eşleştirme, canvas ve sorun giderme'
title: iOS uygulaması
x-i18n:
    generated_at: "2026-04-30T09:32:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6fdbe578f15d2641d1bcb147fee7626486210cceae0cc355a92b3b2dd6291c35
    source_path: platforms/ios.md
    workflow: 16
---

Kullanılabilirlik: dahili önizleme. iOS uygulaması henüz herkese açık olarak dağıtılmıyor.

## Ne yapar

- WebSocket üzerinden bir Gateway'e bağlanır (LAN veya tailnet).
- Düğüm yeteneklerini sunar: Canvas, ekran anlık görüntüsü, kamera yakalama, konum, konuşma modu, sesle uyandırma.
- `node.invoke` komutlarını alır ve düğüm durum olaylarını bildirir.

## Gereksinimler

- Başka bir cihazda çalışan Gateway (macOS, Linux veya WSL2 üzerinden Windows).
- Ağ yolu:
  - Bonjour üzerinden aynı LAN, **veya**
  - Unicast DNS-SD üzerinden tailnet (örnek etki alanı: `openclaw.internal.`), **veya**
  - El ile host/port (yedek).

## Hızlı başlangıç (eşleştir + bağlan)

1. Gateway'i başlatın:

```bash
openclaw gateway --port 18789
```

2. iOS uygulamasında Ayarlar'ı açın ve keşfedilen bir gateway seçin (veya Manual Host'u etkinleştirip host/port girin).

3. Gateway host'unda eşleştirme isteğini onaylayın:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Uygulama değişen kimlik doğrulama ayrıntılarıyla (rol/kapsamlar/açık anahtar)
eşleştirmeyi yeniden denerse, önceki bekleyen istek geçersiz kılınır ve yeni bir `requestId` oluşturulur.
Onaydan önce `openclaw devices list` komutunu yeniden çalıştırın.

İsteğe bağlı: iOS düğümü her zaman sıkı denetlenen bir alt ağdan bağlanıyorsa,
açık CIDR'ler veya tam IP'lerle ilk kez düğüm otomatik onayını etkinleştirebilirsiniz:

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

Bu varsayılan olarak devre dışıdır. Yalnızca istenen kapsam olmayan yeni `role: node`
eşleştirmeleri için geçerlidir. Operatör/tarayıcı eşleştirmesi ve herhangi bir rol, kapsam,
meta veri veya açık anahtar değişikliği yine de el ile onay gerektirir.

4. Bağlantıyı doğrulayın:

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## Resmi derlemeler için relay destekli push

Resmi olarak dağıtılan iOS derlemeleri, ham APNs token'ını gateway'e yayımlamak yerine
harici push relay'ini kullanır.

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

- iOS uygulaması, App Attest ve StoreKit uygulama işlem JWS'si kullanarak relay'e kaydolur.
- Relay, opak bir relay tanıtıcısı ve kayıt kapsamlı bir gönderme izni döndürür.
- iOS uygulaması, eşleştirilmiş gateway kimliğini alır ve relay kaydına ekler; böylece relay destekli kayıt söz konusu gateway'e devredilir.
- Uygulama, bu relay destekli kaydı `push.apns.register` ile eşleştirilmiş gateway'e iletir.
- Gateway, `push.test`, arka plan uyandırmaları ve uyandırma dürtmeleri için bu saklanan relay tanıtıcısını kullanır.
- Gateway relay temel URL'si, resmi/TestFlight iOS derlemesine gömülü relay URL'siyle eşleşmelidir.
- Uygulama daha sonra farklı bir gateway'e veya farklı relay temel URL'sine sahip bir derlemeye bağlanırsa, eski bağlamayı yeniden kullanmak yerine relay kaydını yeniler.

Gateway'in bu yol için ihtiyaç duymadığı şeyler:

- Dağıtım genelinde relay token'ı yoktur.
- Resmi/TestFlight relay destekli gönderimler için doğrudan APNs anahtarı yoktur.

Beklenen operatör akışı:

1. Resmi/TestFlight iOS derlemesini yükleyin.
2. Gateway üzerinde `gateway.push.apns.relay.baseUrl` değerini ayarlayın.
3. Uygulamayı gateway ile eşleştirin ve bağlantıyı tamamlamasına izin verin.
4. Uygulama, APNs token'ına sahip olduktan, operatör oturumu bağlandıktan ve relay kaydı başarılı olduktan sonra `push.apns.register` değerini otomatik olarak yayımlar.
5. Bundan sonra `push.test`, yeniden bağlanma uyandırmaları ve uyandırma dürtmeleri saklanan relay destekli kaydı kullanabilir.

## Arka plan alive işaretleri

iOS, sessiz push, arka plan yenileme veya önemli konum olayı için uygulamayı uyandırdığında, uygulama
kısa bir düğüm yeniden bağlantısı dener ve ardından `event: "node.presence.alive"` ile `node.event`
çağırır. Gateway bunu, yalnızca kimliği doğrulanmış düğüm cihaz kimliği bilindikten sonra
eşleştirilmiş düğüm/cihaz meta verilerinde `lastSeenAtMs`/`lastSeenReason` olarak kaydeder.

Uygulama, bir arka plan uyandırmasını yalnızca gateway yanıtı `handled: true` içerdiğinde
başarıyla kaydedilmiş kabul eder. Eski gateway'ler `node.event` çağrısını `{ "ok": true }` ile
onaylayabilir; bu yanıt uyumludur ancak kalıcı bir son görülme güncellemesi olarak sayılmaz.

Uyumluluk notu:

- `OPENCLAW_APNS_RELAY_BASE_URL`, gateway için geçici env geçersiz kılması olarak çalışmaya devam eder.

## Kimlik doğrulama ve güven akışı

Relay, doğrudan gateway üzerinde APNs kullanımının resmi iOS derlemeleri için sağlayamayacağı
iki kısıtı uygulamak için vardır:

- Yalnızca Apple üzerinden dağıtılan gerçek OpenClaw iOS derlemeleri barındırılan relay'i kullanabilir.
- Bir gateway, yalnızca o belirli gateway ile eşleştirilmiş iOS cihazları için relay destekli push gönderebilir.

Adım adım:

1. `iOS app -> gateway`
   - Uygulama önce normal Gateway kimlik doğrulama akışı üzerinden gateway ile eşleşir.
   - Bu, uygulamaya kimliği doğrulanmış bir düğüm oturumu ve kimliği doğrulanmış bir operatör oturumu sağlar.
   - Operatör oturumu `gateway.identity.get` çağrısı için kullanılır.

2. `iOS app -> relay`
   - Uygulama relay kayıt uç noktalarını HTTPS üzerinden çağırır.
   - Kayıt, App Attest kanıtı ve StoreKit uygulama işlem JWS'si içerir.
   - Relay, bundle ID'yi, App Attest kanıtını ve Apple dağıtım kanıtını doğrular ve
     resmi/üretim dağıtım yolunu zorunlu kılar.
   - Bu, yerel Xcode/dev derlemelerinin barındırılan relay'i kullanmasını engelleyen şeydir. Yerel bir derleme
     imzalanmış olabilir, ancak relay'in beklediği resmi Apple dağıtım kanıtını karşılamaz.

3. `gateway identity delegation`
   - Relay kaydından önce uygulama, eşleştirilmiş gateway kimliğini
     `gateway.identity.get` üzerinden alır.
   - Uygulama bu gateway kimliğini relay kayıt yüküne ekler.
   - Relay, bu gateway kimliğine devredilen bir relay tanıtıcısı ve kayıt kapsamlı bir gönderme izni döndürür.

4. `gateway -> relay`
   - Gateway, `push.apns.register` üzerinden gelen relay tanıtıcısını ve gönderme iznini saklar.
   - `push.test`, yeniden bağlanma uyandırmaları ve uyandırma dürtmeleri sırasında gateway, gönderme isteğini kendi
     cihaz kimliğiyle imzalar.
   - Relay, hem saklanan gönderme iznini hem de gateway imzasını, kayıttan gelen devredilmiş
     gateway kimliğine göre doğrular.
   - Başka bir gateway, tanıtıcıyı bir şekilde elde etse bile bu saklanan kaydı yeniden kullanamaz.

5. `relay -> APNs`
   - Relay, resmi derleme için üretim APNs kimlik bilgilerine ve ham APNs token'ına sahiptir.
   - Gateway, relay destekli resmi derlemeler için ham APNs token'ını asla saklamaz.
   - Relay, son push'u eşleştirilmiş gateway adına APNs'ye gönderir.

Bu tasarımın oluşturulma nedeni:

- Üretim APNs kimlik bilgilerini kullanıcı gateway'lerinden uzak tutmak.
- Ham resmi derleme APNs token'larını gateway üzerinde saklamaktan kaçınmak.
- Barındırılan relay kullanımına yalnızca resmi/TestFlight OpenClaw derlemeleri için izin vermek.
- Bir gateway'in farklı bir gateway'e ait iOS cihazlarına uyandırma push'ları göndermesini önlemek.

Yerel/el ile derlemeler doğrudan APNs üzerinde kalır. Bu derlemeleri relay olmadan test ediyorsanız,
gateway'in yine de doğrudan APNs kimlik bilgilerine ihtiyacı vardır:

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

Bunlar gateway host çalışma zamanı env değişkenleridir, Fastlane ayarları değildir. `apps/ios/fastlane/.env` yalnızca
`ASC_KEY_ID` ve `ASC_ISSUER_ID` gibi App Store Connect / TestFlight kimlik doğrulamasını saklar; yerel iOS derlemeleri için
doğrudan APNs teslimatını yapılandırmaz.

Önerilen gateway host saklama konumu:

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

iOS uygulaması `local.` üzerinde `_openclaw-gw._tcp` ve yapılandırıldığında aynı
geniş alan DNS-SD keşif etki alanını tarar. Aynı LAN gateway'leri `local.` üzerinden otomatik olarak görünür;
ağlar arası keşif, beacon türünü değiştirmeden yapılandırılmış geniş alan etki alanını kullanabilir.

### Tailnet (ağlar arası)

mDNS engellenmişse, unicast DNS-SD bölgesi (bir etki alanı seçin; örnek:
`openclaw.internal.`) ve Tailscale split DNS kullanın.
CoreDNS örneği için [Bonjour](/tr/gateway/bonjour) bölümüne bakın.

### El ile host/port

Ayarlar'da **Manual Host** seçeneğini etkinleştirin ve gateway host + port değerini girin (varsayılan `18789`).

## Canvas + A2UI

iOS düğümü bir WKWebView canvas işler. Bunu yönetmek için `node.invoke` kullanın:

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

Notlar:

- Gateway canvas host'u `/__openclaw__/canvas/` ve `/__openclaw__/a2ui/` sunar.
- Gateway HTTP sunucusundan sunulur (`gateway.port` ile aynı port, varsayılan `18789`).
- Bir canvas host URL'si duyurulduğunda iOS düğümü bağlantı sırasında otomatik olarak A2UI'ye gider.
- Yerleşik iskelete dönmek için `canvas.navigate` ve `{"url":""}` kullanın.

## Computer Use ilişkisi

iOS uygulaması bir mobil düğüm yüzeyidir, Codex Computer Use backend'i değildir. Codex
Computer Use ve `cua-driver mcp`, MCP araçları üzerinden yerel bir macOS masaüstünü kontrol eder;
iOS uygulaması ise `canvas.*`, `camera.*`, `screen.*`, `location.*` ve `talk.*` gibi
OpenClaw düğüm komutları üzerinden iPhone yeteneklerini sunar.

Agent'lar, düğüm komutlarını çağırarak OpenClaw üzerinden iOS uygulamasını yine de çalıştırabilir,
ancak bu çağrılar gateway düğüm protokolünden geçer ve iOS ön plan/arka plan sınırlarına uyar.
Yerel masaüstü kontrolü için [Codex Computer Use](/tr/plugins/codex-computer-use), iOS düğüm yetenekleri için bu sayfayı kullanın.

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
- `A2UI_HOST_NOT_CONFIGURED`: Gateway bir canvas host URL'si duyurmadı; [Gateway yapılandırması](/tr/gateway/configuration) içinde `canvasHost` değerini kontrol edin.
- Eşleştirme istemi hiç görünmüyor: `openclaw devices list` çalıştırın ve el ile onaylayın.
- Yeniden yüklemeden sonra yeniden bağlanma başarısız oluyor: Keychain eşleştirme token'ı temizlenmiştir; düğümü yeniden eşleştirin.

## İlgili belgeler

- [Eşleştirme](/tr/channels/pairing)
- [Keşif](/tr/gateway/discovery)
- [Bonjour](/tr/gateway/bonjour)
