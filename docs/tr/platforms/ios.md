---
read_when:
    - iOS Node'unu eşleştirme veya yeniden bağlama
    - iOS uygulamasını kaynaktan çalıştırma
    - Gateway keşfinde veya canvas komutlarında hata ayıklama
summary: 'iOS düğüm uygulaması: Gateway''e bağlanma, eşleştirme, tuval ve sorun giderme'
title: iOS uygulaması
x-i18n:
    generated_at: "2026-05-06T09:21:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: aaa8c11d9fda32c743d2ff0d1c6fd5574bcd396aef43aa2e4e9b0cc7b55e5d21
    source_path: platforms/ios.md
    workflow: 16
---

Kullanılabilirlik: dahili önizleme. iOS uygulaması henüz herkese açık dağıtılmıyor.

## Ne yapar

- WebSocket üzerinden bir Gateway'e bağlanır (LAN veya tailnet).
- Node yeteneklerini sunar: Canvas, ekran anlık görüntüsü, kamera yakalama, konum, konuşma modu, sesle uyandırma.
- `node.invoke` komutlarını alır ve Node durum olaylarını bildirir.

## Gereksinimler

- Başka bir cihazda çalışan Gateway (macOS, Linux veya WSL2 üzerinden Windows).
- Ağ yolu:
  - Bonjour üzerinden aynı LAN, **veya**
  - Unicast DNS-SD üzerinden tailnet (örnek etki alanı: `openclaw.internal.`), **veya**
  - Manuel ana makine/bağlantı noktası (yedek).

## Hızlı başlangıç (eşleştir + bağlan)

1. Gateway'i başlatın:

```bash
openclaw gateway --port 18789
```

2. iOS uygulamasında Settings'i açın ve keşfedilen bir gateway seçin (veya Manual Host'u etkinleştirip ana makine/bağlantı noktası girin).

3. Gateway ana makinesinde eşleştirme isteğini onaylayın:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Uygulama değişen kimlik doğrulama ayrıntılarıyla (rol/kapsamlar/açık anahtar)
eşleştirmeyi yeniden denerse, önceki bekleyen isteğin yerine yenisi geçer ve yeni bir `requestId` oluşturulur.
Onaydan önce `openclaw devices list` komutunu yeniden çalıştırın.

İsteğe bağlı: iOS Node'u her zaman sıkı şekilde denetlenen bir alt ağdan bağlanıyorsa,
açık CIDR'ler veya tam IP'lerle ilk seferde Node otomatik onayını etkinleştirebilirsiniz:

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

Bu varsayılan olarak devre dışıdır. Yalnızca istenen kapsamı olmayan yeni `role: node`
eşleştirmesi için geçerlidir. Operatör/tarayıcı eşleştirmesi ve herhangi bir rol, kapsam, metadata veya
açık anahtar değişikliği yine manuel onay gerektirir.

4. Bağlantıyı doğrulayın:

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## Resmi derlemeler için aktarıcı destekli anlık bildirim

Resmi olarak dağıtılan iOS derlemeleri, ham APNs token'ını gateway'e yayımlamak yerine harici anlık bildirim aktarıcısını kullanır.

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

Akışın çalışma biçimi:

- iOS uygulaması, App Attest ve bir StoreKit uygulama işlem JWS'si kullanarak aktarıcıya kaydolur.
- Aktarıcı opak bir aktarıcı tanıtıcısı ve kayda özgü bir gönderme izni döndürür.
- iOS uygulaması eşleştirilmiş Gateway kimliğini alır ve bunu aktarıcı kaydına ekler; böylece aktarıcı destekli kayıt o belirli Gateway'e devredilir.
- Uygulama, aktarıcı destekli bu kaydı `push.apns.register` ile eşleştirilmiş Gateway'e iletir.
- Gateway, `push.test`, arka plan uyandırmaları ve uyandırma dürtmeleri için saklanan bu aktarıcı tanıtıcısını kullanır.
- Gateway aktarıcı temel URL'si, resmi/TestFlight iOS derlemesine gömülen aktarıcı URL'siyle eşleşmelidir.
- Uygulama daha sonra farklı bir Gateway'e veya farklı aktarıcı temel URL'sine sahip bir derlemeye bağlanırsa, eski bağlamayı yeniden kullanmak yerine aktarıcı kaydını yeniler.

Gateway'in bu yol için **gereksinim duymadığı** şeyler:

- Dağıtım genelinde aktarıcı token'ı yok.
- Resmi/TestFlight aktarıcı destekli gönderimler için doğrudan APNs anahtarı yok.

Beklenen operatör akışı:

1. Resmi/TestFlight iOS derlemesini yükleyin.
2. Gateway üzerinde `gateway.push.apns.relay.baseUrl` değerini ayarlayın.
3. Uygulamayı Gateway ile eşleştirin ve bağlanmayı tamamlamasına izin verin.
4. Uygulama, bir APNs token'ına sahip olduktan, operatör oturumu bağlandıktan ve aktarıcı kaydı başarılı olduktan sonra `push.apns.register` komutunu otomatik olarak yayımlar.
5. Bundan sonra `push.test`, yeniden bağlanma uyandırmaları ve uyandırma dürtmeleri saklanan aktarıcı destekli kaydı kullanabilir.

## Arka plan canlılık işaretleri

iOS uygulamayı sessiz anlık bildirim, arka plan yenilemesi veya önemli konum olayı için uyandırdığında, uygulama
kısa bir Node yeniden bağlanması dener ve ardından `event: "node.presence.alive"` ile `node.event` çağırır.
Gateway bunu, yalnızca kimliği doğrulanmış Node cihaz kimliği bilindikten sonra eşleştirilmiş Node/cihaz metadata'sı üzerinde
`lastSeenAtMs`/`lastSeenReason` olarak kaydeder.

Uygulama, arka plan uyandırmasının başarıyla kaydedildiğini yalnızca Gateway yanıtı
`handled: true` içerdiğinde kabul eder. Eski Gateway'ler `node.event` çağrısını `{ "ok": true }` ile onaylayabilir; bu yanıt
uyumludur ancak kalıcı bir son görülme güncellemesi sayılmaz.

Uyumluluk notu:

- `OPENCLAW_APNS_RELAY_BASE_URL`, Gateway için geçici env geçersiz kılması olarak hâlâ çalışır.

## Kimlik doğrulama ve güven akışı

Aktarıcı, resmi iOS derlemeleri için doğrudan Gateway üzerinde APNs yolunun sağlayamayacağı iki kısıtı uygulamak amacıyla vardır:

- Yalnızca Apple üzerinden dağıtılan özgün OpenClaw iOS derlemeleri barındırılan aktarıcıyı kullanabilir.
- Bir Gateway, yalnızca o belirli Gateway ile eşleştirilmiş iOS cihazları için aktarıcı destekli anlık bildirim gönderebilir.

Adım adım:

1. `iOS app -> gateway`
   - Uygulama önce normal Gateway kimlik doğrulama akışıyla Gateway ile eşleşir.
   - Bu, uygulamaya kimliği doğrulanmış bir Node oturumu ve kimliği doğrulanmış bir operatör oturumu sağlar.
   - Operatör oturumu `gateway.identity.get` çağrısı için kullanılır.

2. `iOS app -> relay`
   - Uygulama, aktarıcı kayıt uç noktalarını HTTPS üzerinden çağırır.
   - Kayıt, App Attest kanıtı ve bir StoreKit uygulama işlem JWS'si içerir.
   - Aktarıcı paket kimliğini, App Attest kanıtını ve Apple dağıtım kanıtını doğrular ve
     resmi/üretim dağıtım yolunu gerektirir.
   - Barındırılan aktarıcıyı yerel Xcode/geliştirme derlemelerinin kullanmasını engelleyen budur. Yerel bir derleme
     imzalanmış olabilir, ancak aktarıcının beklediği resmi Apple dağıtım kanıtını karşılamaz.

3. `gateway identity delegation`
   - Aktarıcı kaydından önce uygulama, eşleştirilmiş Gateway kimliğini
     `gateway.identity.get` üzerinden alır.
   - Uygulama bu Gateway kimliğini aktarıcı kayıt yüküne ekler.
   - Aktarıcı, bu Gateway kimliğine devredilmiş bir aktarıcı tanıtıcısı ve kayda özgü bir gönderme izni döndürür.

4. `gateway -> relay`
   - Gateway, `push.apns.register` üzerinden gelen aktarıcı tanıtıcısını ve gönderme iznini saklar.
   - `push.test`, yeniden bağlanma uyandırmaları ve uyandırma dürtmelerinde Gateway, gönderme isteğini
     kendi cihaz kimliğiyle imzalar.
   - Aktarıcı, hem saklanan gönderme iznini hem de Gateway imzasını, kayıttan gelen devredilmiş
     Gateway kimliğine karşı doğrular.
   - Başka bir Gateway, tanıtıcıyı bir şekilde ele geçirse bile saklanan bu kaydı yeniden kullanamaz.

5. `relay -> APNs`
   - Aktarıcı, resmi derleme için üretim APNs kimlik bilgilerine ve ham APNs token'ına sahiptir.
   - Gateway, aktarıcı destekli resmi derlemeler için ham APNs token'ını hiçbir zaman saklamaz.
   - Aktarıcı, eşleştirilmiş Gateway adına son anlık bildirimi APNs'ye gönderir.

Bu tasarımın oluşturulma nedenleri:

- Üretim APNs kimlik bilgilerini kullanıcı Gateway'lerinden uzak tutmak.
- Resmi derleme ham APNs token'larını Gateway'de saklamaktan kaçınmak.
- Barındırılan aktarıcı kullanımını yalnızca resmi/TestFlight OpenClaw derlemelerine izinli kılmak.
- Bir Gateway'in farklı bir Gateway'e ait iOS cihazlarına uyandırma anlık bildirimi göndermesini önlemek.

Yerel/manuel derlemeler doğrudan APNs üzerinde kalır. Bu derlemeleri aktarıcı olmadan test ediyorsanız,
Gateway'in yine de doğrudan APNs kimlik bilgilerine ihtiyacı vardır:

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

Bunlar Gateway ana makinesi çalışma zamanı env var'larıdır, Fastlane ayarları değildir. `apps/ios/fastlane/.env` yalnızca
`ASC_KEY_ID` ve `ASC_ISSUER_ID` gibi App Store Connect / TestFlight kimlik doğrulamasını saklar; yerel iOS derlemeleri için
doğrudan APNs teslimini yapılandırmaz.

Önerilen Gateway ana makinesi depolaması:

```bash
mkdir -p ~/.openclaw/credentials/apns
chmod 700 ~/.openclaw/credentials/apns
mv /path/to/AuthKey_KEYID.p8 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
chmod 600 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
export OPENCLAW_APNS_PRIVATE_KEY_PATH="$HOME/.openclaw/credentials/apns/AuthKey_KEYID.p8"
```

`.p8` dosyasını commit etmeyin veya repo checkout'unun altına koymayın.

## Keşif yolları

### Bonjour (LAN)

iOS uygulaması `local.` üzerinde `_openclaw-gw._tcp` ve yapılandırıldığında aynı
geniş alan DNS-SD keşif etki alanını tarar. Aynı LAN Gateway'leri `local.` üzerinden otomatik olarak görünür;
ağlar arası keşif, beacon türünü değiştirmeden yapılandırılan geniş alan etki alanını kullanabilir.

### Tailnet (ağlar arası)

mDNS engellenmişse bir unicast DNS-SD bölgesi kullanın (bir etki alanı seçin; örnek:
`openclaw.internal.`) ve Tailscale split DNS kullanın.
CoreDNS örneği için [Bonjour](/tr/gateway/bonjour) sayfasına bakın.

### Manuel ana makine/bağlantı noktası

Settings içinde **Manual Host** seçeneğini etkinleştirin ve Gateway ana makinesi + bağlantı noktasını girin (varsayılan `18789`).

## Canvas + A2UI

iOS Node'u bir WKWebView canvas işler. Onu sürmek için `node.invoke` kullanın:

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

Notlar:

- Gateway canvas ana makinesi `/__openclaw__/canvas/` ve `/__openclaw__/a2ui/` sunar.
- Gateway HTTP sunucusundan sunulur (`gateway.port` ile aynı bağlantı noktası, varsayılan `18789`).
- Bir canvas ana makinesi URL'si duyurulduğunda iOS Node'u bağlantıda A2UI'ye otomatik olarak gider.
- Yerleşik iskeleye `canvas.navigate` ve `{"url":""}` ile dönün.

## Computer Use ilişkisi

iOS uygulaması bir mobil Node yüzeyidir, Codex Computer Use arka ucu değildir. Codex
Computer Use ve `cua-driver mcp`, MCP araçları üzerinden yerel bir macOS masaüstünü denetler;
iOS uygulaması ise OpenClaw Node komutları üzerinden iPhone yeteneklerini sunar:
`canvas.*`, `camera.*`, `screen.*`, `location.*` ve `talk.*`.

Agents, Node komutlarını çağırarak OpenClaw üzerinden iOS uygulamasını yine de çalıştırabilir,
ancak bu çağrılar Gateway Node protokolünden geçer ve iOS ön plan/arka plan sınırlarına uyar.
Yerel masaüstü denetimi için [Codex Computer Use](/tr/plugins/codex-computer-use), iOS Node yetenekleri için bu sayfayı kullanın.

### Canvas eval / anlık görüntü

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## Sesle uyandırma + konuşma modu

- Sesle uyandırma ve konuşma modu Settings içinde kullanılabilir.
- Konuşma destekli iOS Node'ları `talk` yeteneğini duyurur ve
  `talk.ptt.start`, `talk.ptt.stop`, `talk.ptt.cancel` ve `talk.ptt.once` bildirebilir;
  Gateway, güvenilir konuşma destekli Node'lar için bu bas-konuş komutlarına varsayılan olarak izin verir.
- iOS arka plan sesini askıya alabilir; uygulama etkin değilken ses özelliklerini en iyi çaba olarak değerlendirin.

## Yaygın hatalar

- `NODE_BACKGROUND_UNAVAILABLE`: iOS uygulamasını ön plana getirin (canvas/kamera/ekran komutları bunu gerektirir).
- `A2UI_HOST_NOT_CONFIGURED`: Gateway bir canvas ana makinesi URL'si duyurmadı; [Gateway yapılandırması](/tr/gateway/configuration) içinde `canvasHost` değerini kontrol edin.
- Eşleştirme istemi hiç görünmüyor: `openclaw devices list` çalıştırın ve manuel olarak onaylayın.
- Yeniden yüklemeden sonra yeniden bağlanma başarısız oluyor: Keychain eşleştirme token'ı temizlenmiştir; Node'u yeniden eşleştirin.

## İlgili dokümanlar

- [Pairing](/tr/channels/pairing)
- [Discovery](/tr/gateway/discovery)
- [Bonjour](/tr/gateway/bonjour)
