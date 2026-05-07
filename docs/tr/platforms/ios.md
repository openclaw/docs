---
read_when:
    - iOS Node'unu eşleştirme veya yeniden bağlama
    - iOS uygulamasını kaynak koddan çalıştırma
    - Gateway keşfinde veya canvas komutlarında hata ayıklama
summary: 'iOS düğüm uygulaması: Gateway''e bağlanma, eşleştirme, tuval ve sorun giderme'
title: iOS uygulaması
x-i18n:
    generated_at: "2026-05-07T13:21:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 707f8b97156e800f89bc00265c1889c9cbade347fde35f037a302065956346f4
    source_path: platforms/ios.md
    workflow: 16
---

Kullanılabilirlik: dahili önizleme. iOS uygulaması henüz herkese açık olarak dağıtılmıyor.

## Ne yapar?

- WebSocket üzerinden bir Gateway'e bağlanır (LAN veya tailnet).
- Node yeteneklerini sunar: Canvas, ekran anlık görüntüsü, kamera yakalama, konum, konuşma modu, sesle uyandırma.
- `node.invoke` komutlarını alır ve Node durum olaylarını bildirir.

## Gereksinimler

- Başka bir cihazda çalışan Gateway (macOS, Linux veya WSL2 üzerinden Windows).
- Ağ yolu:
  - Bonjour ile aynı LAN, **veya**
  - Tek noktaya yayın DNS-SD ile tailnet (örnek alan adı: `openclaw.internal.`), **veya**
  - Manuel ana makine/bağlantı noktası (yedek).

## Hızlı başlangıç (eşleştir + bağlan)

1. Gateway'i başlatın:

```bash
openclaw gateway --port 18789
```

2. iOS uygulamasında Ayarlar'ı açın ve keşfedilen bir Gateway seçin (veya Manuel Ana Makine'yi etkinleştirip ana makine/bağlantı noktasını girin).

3. Gateway ana makinesinde eşleştirme isteğini onaylayın:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Uygulama değişen kimlik doğrulama ayrıntılarıyla (rol/kapsamlar/açık anahtar) eşleştirmeyi yeniden denerse,
önceki bekleyen istek geçersiz kılınır ve yeni bir `requestId` oluşturulur.
Onaylamadan önce `openclaw devices list` komutunu yeniden çalıştırın.

İsteğe bağlı: iOS Node her zaman sıkı denetlenen bir alt ağdan bağlanıyorsa, açık CIDR'ler veya tam IP'lerle
ilk kez Node otomatik onayını etkinleştirebilirsiniz:

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

Bu varsayılan olarak devre dışıdır. Yalnızca istenen kapsamı olmayan yeni `role: node` eşleştirmelerine uygulanır. Operatör/tarayıcı eşleştirmesi ve rol, kapsam, metadata veya açık anahtar değişiklikleri yine manuel onay gerektirir.

4. Bağlantıyı doğrulayın:

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## Resmi derlemeler için röle destekli push

Resmi olarak dağıtılan iOS derlemeleri, ham APNs token'ını Gateway'e yayımlamak yerine harici push rölesini kullanır.

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

- iOS uygulaması, App Attest ve StoreKit uygulama işlem JWS'si kullanarak röleye kaydolur.
- Röle, opak bir röle tanıtıcısı ve kayıt kapsamlı bir gönderme izni döndürür.
- iOS uygulaması eşleştirilmiş Gateway kimliğini alır ve röle kaydına dahil eder; böylece röle destekli kayıt bu belirli Gateway'e devredilir.
- Uygulama, bu röle destekli kaydı `push.apns.register` ile eşleştirilmiş Gateway'e iletir.
- Gateway, `push.test`, arka plan uyandırmaları ve uyandırma dürtmeleri için saklanan bu röle tanıtıcısını kullanır.
- Gateway röle temel URL'si, resmi/TestFlight iOS derlemesine gömülü röle URL'siyle eşleşmelidir.
- Uygulama daha sonra farklı bir Gateway'e veya farklı röle temel URL'sine sahip bir derlemeye bağlanırsa eski bağlamayı yeniden kullanmak yerine röle kaydını yeniler.

Bu yol için Gateway'in **ihtiyaç duymadığı** şeyler:

- Dağıtım genelinde röle token'ı yoktur.
- Resmi/TestFlight röle destekli gönderimler için doğrudan APNs anahtarı gerekmez.

Beklenen operatör akışı:

1. Resmi/TestFlight iOS derlemesini yükleyin.
2. Gateway'de `gateway.push.apns.relay.baseUrl` değerini ayarlayın.
3. Uygulamayı Gateway ile eşleştirin ve bağlanmayı tamamlamasına izin verin.
4. Uygulama, APNs token'ına sahip olduktan, operatör oturumu bağlandıktan ve röle kaydı başarılı olduktan sonra `push.apns.register` otomatik olarak yayımlar.
5. Bundan sonra `push.test`, yeniden bağlanma uyandırmaları ve uyandırma dürtmeleri saklanan röle destekli kaydı kullanabilir.

## Arka plan canlılık sinyalleri

iOS uygulamayı sessiz push, arka plan yenilemesi veya önemli konum olayı için uyandırdığında, uygulama kısa bir Node yeniden bağlantısı dener ve ardından `event: "node.presence.alive"` ile `node.event` çağırır.
Gateway bunu, yalnızca kimliği doğrulanmış Node cihaz kimliği bilindikten sonra eşleştirilmiş Node/cihaz metadata'sında `lastSeenAtMs`/`lastSeenReason` olarak kaydeder.

Uygulama, bir arka plan uyandırmasının başarıyla kaydedildiğini yalnızca Gateway yanıtı `handled: true` içerdiğinde kabul eder. Eski Gateway'ler `node.event` çağrısını `{ "ok": true }` ile onaylayabilir; bu yanıt uyumludur ancak kalıcı bir son görülme güncellemesi sayılmaz.

Uyumluluk notu:

- `OPENCLAW_APNS_RELAY_BASE_URL`, Gateway için geçici env geçersiz kılması olarak hâlâ çalışır.

## Kimlik doğrulama ve güven akışı

Röle, resmi iOS derlemeleri için doğrudan Gateway üzerinde APNs'nin sağlayamayacağı iki kısıtı uygulatmak için vardır:

- Barındırılan röleyi yalnızca Apple üzerinden dağıtılan gerçek OpenClaw iOS derlemeleri kullanabilir.
- Bir Gateway, röle destekli push'ları yalnızca o belirli Gateway ile eşleşmiş iOS cihazlarına gönderebilir.

Adım adım:

1. `iOS app -> gateway`
   - Uygulama önce normal Gateway kimlik doğrulama akışıyla Gateway ile eşleşir.
   - Bu, uygulamaya kimliği doğrulanmış bir Node oturumu ve kimliği doğrulanmış bir operatör oturumu verir.
   - Operatör oturumu `gateway.identity.get` çağırmak için kullanılır.

2. `iOS app -> relay`
   - Uygulama, HTTPS üzerinden röle kayıt uç noktalarını çağırır.
   - Kayıt, App Attest kanıtı ve StoreKit uygulama işlem JWS'si içerir.
   - Röle, bundle ID'yi, App Attest kanıtını ve Apple dağıtım kanıtını doğrular ve resmi/production dağıtım yolunu zorunlu kılar.
   - Yerel Xcode/dev derlemelerinin barındırılan röleyi kullanmasını engelleyen şey budur. Yerel bir derleme imzalanmış olabilir, ancak rölenin beklediği resmi Apple dağıtım kanıtını karşılamaz.

3. `gateway identity delegation`
   - Röle kaydından önce uygulama, eşleştirilmiş Gateway kimliğini `gateway.identity.get` üzerinden alır.
   - Uygulama, bu Gateway kimliğini röle kayıt yüküne dahil eder.
   - Röle, bu Gateway kimliğine devredilmiş bir röle tanıtıcısı ve kayıt kapsamlı gönderme izni döndürür.

4. `gateway -> relay`
   - Gateway, `push.apns.register` tarafından gelen röle tanıtıcısını ve gönderme iznini saklar.
   - `push.test`, yeniden bağlanma uyandırmaları ve uyandırma dürtmelerinde Gateway, gönderme isteğini kendi cihaz kimliğiyle imzalar.
   - Röle, hem saklanan gönderme iznini hem de Gateway imzasını kayıttaki devredilmiş Gateway kimliğine göre doğrular.
   - Başka bir Gateway, tanıtıcıyı bir şekilde ele geçirse bile saklanan bu kaydı yeniden kullanamaz.

5. `relay -> APNs`
   - Röle, production APNs kimlik bilgilerine ve resmi derleme için ham APNs token'ına sahiptir.
   - Gateway, röle destekli resmi derlemeler için ham APNs token'ını asla saklamaz.
   - Röle, eşleştirilmiş Gateway adına son push'u APNs'ye gönderir.

Bu tasarımın oluşturulma nedenleri:

- Production APNs kimlik bilgilerini kullanıcı Gateway'lerinin dışında tutmak.
- Ham resmi derleme APNs token'larını Gateway'de saklamaktan kaçınmak.
- Barındırılan röle kullanımına yalnızca resmi/TestFlight OpenClaw derlemeleri için izin vermek.
- Bir Gateway'in farklı bir Gateway'e ait iOS cihazlarına uyandırma push'ları göndermesini önlemek.

Yerel/manuel derlemeler doğrudan APNs üzerinde kalır. Bu derlemeleri röle olmadan test ediyorsanız Gateway'in hâlâ doğrudan APNs kimlik bilgilerine ihtiyacı vardır:

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

Bunlar Gateway ana makinesi çalışma zamanı env vars değerleridir, Fastlane ayarları değildir. `apps/ios/fastlane/.env` yalnızca `ASC_KEY_ID` ve `ASC_ISSUER_ID` gibi App Store Connect / TestFlight kimlik doğrulamasını saklar; yerel iOS derlemeleri için doğrudan APNs teslimini yapılandırmaz.

Önerilen Gateway ana makinesi depolaması:

```bash
mkdir -p ~/.openclaw/credentials/apns
chmod 700 ~/.openclaw/credentials/apns
mv /path/to/AuthKey_KEYID.p8 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
chmod 600 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
export OPENCLAW_APNS_PRIVATE_KEY_PATH="$HOME/.openclaw/credentials/apns/AuthKey_KEYID.p8"
```

`.p8` dosyasını commit etmeyin veya repo checkout'u altına koymayın.

## Keşif yolları

### Bonjour (LAN)

iOS uygulaması `_openclaw-gw._tcp` öğesini `local.` üzerinde ve yapılandırıldığında aynı geniş alan DNS-SD keşif alanında tarar. Aynı LAN üzerindeki Gateway'ler `local.` üzerinden otomatik görünür; ağlar arası keşif, beacon türünü değiştirmeden yapılandırılan geniş alan alan adını kullanabilir.

### Tailnet (ağlar arası)

mDNS engellenmişse tek noktaya yayın DNS-SD bölgesi kullanın (bir alan adı seçin; örnek:
`openclaw.internal.`) ve Tailscale split DNS.
CoreDNS örneği için [Bonjour](/tr/gateway/bonjour) bölümüne bakın.

### Manuel ana makine/bağlantı noktası

Ayarlar'da **Manuel Ana Makine**'yi etkinleştirin ve Gateway ana makinesini + bağlantı noktasını girin (varsayılan `18789`).

## Canvas + A2UI

iOS Node bir WKWebView canvas işler. Bunu yönlendirmek için `node.invoke` kullanın:

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

Notlar:

- Gateway canvas ana makinesi `/__openclaw__/canvas/` ve `/__openclaw__/a2ui/` sunar.
- Gateway HTTP sunucusundan sunulur (`gateway.port` ile aynı bağlantı noktası, varsayılan `18789`).
- iOS Node, bir canvas ana makine URL'si duyurulduğunda bağlantı sırasında otomatik olarak A2UI'ye gider.
- Yerleşik iskelete `canvas.navigate` ve `{"url":""}` ile dönün.

## Computer Use ilişkisi

iOS uygulaması bir mobil Node yüzeyidir, Codex Computer Use arka ucu değildir. Codex
Computer Use ve `cua-driver mcp`, MCP araçları üzerinden yerel bir macOS masaüstünü denetler; iOS uygulaması ise `canvas.*`, `camera.*`, `screen.*`, `location.*` ve `talk.*` gibi OpenClaw Node komutları üzerinden iPhone yeteneklerini sunar.

Agent'lar, Node komutlarını çağırarak iOS uygulamasını OpenClaw üzerinden yine çalıştırabilir; ancak bu çağrılar Gateway Node protokolünden geçer ve iOS ön plan/arka plan sınırlarına uyar. Yerel masaüstü denetimi için [Codex Computer Use](/tr/plugins/codex-computer-use) bölümünü, iOS Node yetenekleri için bu sayfayı kullanın.

### Canvas eval / anlık görüntü

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## Sesle uyandırma + konuşma modu

- Sesle uyandırma ve konuşma modu Ayarlar'da kullanılabilir.
- Konuşma destekli iOS Node'ları `talk` yeteneğini duyurur ve `talk.ptt.start`, `talk.ptt.stop`, `talk.ptt.cancel` ve `talk.ptt.once` bildirebilir;
  Gateway, güvenilir konuşma destekli Node'lar için bu bas-konuş komutlarına varsayılan olarak izin verir.
- iOS arka plan sesini askıya alabilir; uygulama etkin değilken ses özelliklerini en iyi çaba olarak değerlendirin.

## Yaygın hatalar

- `NODE_BACKGROUND_UNAVAILABLE`: iOS uygulamasını ön plana getirin (canvas/kamera/ekran komutları bunu gerektirir).
- `A2UI_HOST_NOT_CONFIGURED`: Gateway, Canvas Plugin yüzey URL'sini duyurmadı; [Gateway yapılandırması](/tr/gateway/configuration) içindeki `plugins.entries.canvas.config.host` değerini kontrol edin.
- Eşleştirme istemi hiç görünmüyor: `openclaw devices list` çalıştırın ve manuel olarak onaylayın.
- Yeniden yüklemeden sonra yeniden bağlanma başarısız oluyor: Keychain eşleştirme token'ı temizlenmiş; Node'u yeniden eşleştirin.

## İlgili belgeler

- [Eşleştirme](/tr/channels/pairing)
- [Keşif](/tr/gateway/discovery)
- [Bonjour](/tr/gateway/bonjour)
