---
read_when:
    - Gateway'i bir tarayıcıdan yönetmek istiyorsunuz
    - SSH tünelleri olmadan Tailnet erişimi istiyorsunuz
summary: Gateway için tarayıcı tabanlı kontrol arayüzü (sohbet, düğümler, config)
title: Kontrol Arayüzü
x-i18n:
    generated_at: "2026-04-05T14:15:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1568680a07907343352dbb3a2e6a1b896826404a7d8baba62512f03eac28e3d7
    source_path: web/control-ui.md
    workflow: 15
---

# Kontrol Arayüzü (tarayıcı)

Kontrol Arayüzü, Gateway tarafından sunulan küçük bir **Vite + Lit** tek sayfalı uygulamadır:

- varsayılan: `http://<host>:18789/`
- isteğe bağlı önek: `gateway.controlUi.basePath` ayarlayın (ör. `/openclaw`)

Aynı bağlantı noktası üzerindeki **Gateway WebSocket** ile **doğrudan** konuşur.

## Hızlı açılış (yerel)

Gateway aynı bilgisayarda çalışıyorsa şunu açın:

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (veya [http://localhost:18789/](http://localhost:18789/))

Sayfa yüklenemezse önce Gateway'i başlatın: `openclaw gateway`.

Kimlik doğrulama, WebSocket el sıkışması sırasında şu yollarla sağlanır:

- `connect.params.auth.token`
- `connect.params.auth.password`
- `gateway.auth.allowTailscale: true` olduğunda Tailscale Serve kimlik başlıkları
- `gateway.auth.mode: "trusted-proxy"` olduğunda güvenilir proxy kimlik başlıkları

Gösterge paneli ayarlar paneli, geçerli tarayıcı sekmesi oturumu için bir token'ı
ve seçilen gateway URL'sini saklar; parolalar kalıcı olarak saklanmaz. İlk bağlantıda
paylaşılan gizli anahtar kimlik doğrulaması için onboarding genellikle bir gateway
token'ı üretir, ancak `gateway.auth.mode` `"password"` olduğunda parola tabanlı
kimlik doğrulama da çalışır.

## Cihaz eşleştirme (ilk bağlantı)

Kontrol Arayüzü'ne yeni bir tarayıcıdan veya cihazdan bağlandığınızda, Gateway
aynı Tailnet üzerinde `gateway.auth.allowTailscale: true` olsa bile
**tek seferlik bir eşleştirme onayı** gerektirir. Bu, yetkisiz erişimi önlemek için
bir güvenlik önlemidir.

**Göreceğiniz şey:** "disconnected (1008): pairing required"

**Cihazı onaylamak için:**

```bash
# Bekleyen istekleri listeleyin
openclaw devices list

# İstek kimliğine göre onaylayın
openclaw devices approve <requestId>
```

Tarayıcı eşleştirmeyi değişmiş kimlik doğrulama ayrıntılarıyla (rol/kapsamlar/public
key) yeniden denerse, önceki bekleyen istek geçersiz kılınır ve yeni bir `requestId`
oluşturulur. Onaylamadan önce `openclaw devices list` komutunu yeniden çalıştırın.

Onaylandıktan sonra cihaz hatırlanır ve
`openclaw devices revoke --device <id> --role <role>` ile iptal etmediğiniz sürece yeniden onay gerektirmez. Token döndürme ve iptal etme için
[Devices CLI](/cli/devices) bölümüne bakın.

**Notlar:**

- Doğrudan yerel local loopback tarayıcı bağlantıları (`127.0.0.1` / `localhost`)
  otomatik olarak onaylanır.
- Tailnet ve LAN tarayıcı bağlantıları, aynı makineden gelseler bile
  yine açık onay gerektirir.
- Her tarayıcı profili benzersiz bir cihaz kimliği üretir; bu nedenle tarayıcı değiştirmek veya
  tarayıcı verilerini temizlemek yeniden eşleştirme gerektirir.

## Dil desteği

Kontrol Arayüzü ilk yüklemede tarayıcı yerel ayarınıza göre kendini yerelleştirebilir ve bunu daha sonra Erişim kartındaki dil seçicisinden geçersiz kılabilirsiniz.

- Desteklenen yerel ayarlar: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`
- İngilizce dışındaki çeviriler tarayıcıda tembel yüklenir.
- Seçilen yerel ayar tarayıcı depolamasına kaydedilir ve sonraki ziyaretlerde yeniden kullanılır.
- Eksik çeviri anahtarları İngilizceye geri döner.

## Neler yapabilir (bugün)

- Gateway WS üzerinden modelle sohbet (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`)
- Sohbet içinde araç çağrılarını ve canlı araç çıktı kartlarını akış olarak gösterme (aracı olayları)
- Kanallar: yerleşik ve paketlenmiş/harici plugin kanalları için durum, QR girişi ve kanal başına config (`channels.status`, `web.login.*`, `config.patch`)
- Örnekler: durum listesi + yenileme (`system-presence`)
- Oturumlar: liste + oturum başına model/düşünme/hızlı/ayrıntılı/akıl yürütme geçersiz kılmaları (`sessions.list`, `sessions.patch`)
- Cron işleri: listeleme/ekleme/düzenleme/çalıştırma/etkinleştirme/devre dışı bırakma + çalıştırma geçmişi (`cron.*`)
- Skills: durum, etkinleştirme/devre dışı bırakma, kurulum, API anahtarı güncellemeleri (`skills.*`)
- Düğümler: liste + sınırlar (`node.list`)
- `exec host=gateway/node` için yürütme onayları: gateway veya düğüm izin listelerini düzenleme + ilke sorma (`exec.approvals.*`)
- Config: `~/.openclaw/openclaw.json` görüntüleme/düzenleme (`config.get`, `config.set`)
- Config: doğrulamayla birlikte uygulama + yeniden başlatma (`config.apply`) ve son etkin oturumu uyandırma
- Config yazımları, eşzamanlı düzenlemelerin üzerine yazmayı önlemek için bir temel hash koruması içerir
- Config yazımları (`config.set`/`config.apply`/`config.patch`), gönderilen config yükündeki başvurular için etkin SecretRef çözümlemesini de ön kontrol olarak yapar; çözümlenmemiş etkin gönderilmiş başvurular yazmadan önce reddedilir
- Config şeması + form oluşturma (`config.schema` / `config.schema.lookup`,
  alan `title` / `description`, eşleşen arayüz ipuçları, doğrudan alt öğe
  özetleri, iç içe nesne/joker karakter/dizi/bileşim düğümlerinde doküman meta verileri
  ve mevcut olduğunda plugin + kanal şemaları dahil); Ham JSON düzenleyicisi
  yalnızca güvenli bir ham gidiş-dönüş mümkün olduğunda kullanılabilir
- Bir anlık görüntü ham metni güvenli şekilde gidiş-dönüş yapamıyorsa, Kontrol Arayüzü Form modunu zorunlu kılar ve o anlık görüntü için Ham modu devre dışı bırakır
- Yapılandırılmış SecretRef nesne değerleri, nesneden dizeye yanlışlıkla bozulmayı önlemek için form metin girişlerinde salt okunur olarak işlenir
- Hata ayıklama: durum/sağlık/model anlık görüntüleri + olay günlüğü + manuel RPC çağrıları (`status`, `health`, `models.list`)
- Günlükler: filtreleme/dışa aktarma ile gateway dosya günlüklerinin canlı takibi (`logs.tail`)
- Güncelleme: paket/git güncellemesi + yeniden başlatma çalıştırma (`update.run`) ve yeniden başlatma raporu

Cron işleri paneli notları:

- Yalıtılmış işler için teslim varsayılan olarak duyuru özetidir. Yalnızca dahili çalıştırmalar istiyorsanız bunu hiçbiri olarak değiştirebilirsiniz.
- Duyuru seçildiğinde kanal/hedef alanları görünür.
- Webhook modu `delivery.mode = "webhook"` kullanır ve `delivery.to` geçerli bir HTTP(S) webhook URL'si olarak ayarlanır.
- Ana oturum işleri için webhook ve none teslim modları kullanılabilir.
- Gelişmiş düzenleme denetimleri arasında çalıştırma sonrası silme, aracı geçersiz kılmasını temizleme, cron exact/stagger seçenekleri,
  aracı model/düşünme geçersiz kılmaları ve imkanlar dahilinde teslim anahtarları bulunur.
- Form doğrulaması alan düzeyi hatalarla satır içidir; geçersiz değerler düzeltilene kadar kaydet düğmesi devre dışı kalır.
- Ayrı bir bearer token göndermek için `cron.webhookToken` ayarlayın; atlanırsa webhook kimlik doğrulama başlığı olmadan gönderilir.
- Kullanımdan kaldırılmış yedek: `notify: true` içeren saklanan eski işler, taşınana kadar yine de `cron.webhook` kullanabilir.

## Sohbet davranışı

- `chat.send` **bloklamaz**: hemen `{ runId, status: "started" }` ile onay verir ve yanıt `chat` olayları üzerinden akış halinde gelir.
- Aynı `idempotencyKey` ile yeniden göndermek, çalışma sırasında `{ status: "in_flight" }`, tamamlandıktan sonra ise `{ status: "ok" }` döndürür.
- `chat.history` yanıtları, arayüz güvenliği için boyutla sınırlıdır. Döküm girdileri çok büyük olduğunda Gateway uzun metin alanlarını kısaltabilir, ağır meta veri bloklarını atlayabilir ve aşırı büyük mesajları bir yer tutucuyla değiştirebilir (`[chat.history omitted: message too large]`).
- `chat.history`, görünür assistant metninden yalnızca görüntüleme amaçlı satır içi yönerge etiketlerini de kaldırır (örneğin `[[reply_to_*]]` ve `[[audio_as_voice]]`), düz metin tool-call XML yüklerini (`<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` ve kesilmiş tool-call blokları dahil) ve sızmış ASCII/tam genişlikli model kontrol belirteçlerini de kaldırır; ayrıca görünür metninin tamamı yalnızca tam sessiz belirteç `NO_REPLY` / `no_reply` olan assistant girdilerini atlar.
- `chat.inject`, oturum dökümüne bir assistant notu ekler ve yalnızca arayüz güncellemeleri için bir `chat` olayı yayınlar (aracı çalıştırması yok, kanal teslimi yok).
- Sohbet üstbilgisindeki model ve düşünme seçicileri etkin oturumu `sessions.patch` ile hemen yamar; bunlar tek dönüşlük gönderim seçenekleri değil, kalıcı oturum geçersiz kılmalarıdır.
- Durdurma:
  - **Durdur** düğmesine tıklayın (`chat.abort` çağırır)
  - Bant dışı iptal için `/stop` yazın (veya `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop` gibi bağımsız iptal ifadeleri kullanın)
  - `chat.abort`, o oturum için tüm etkin çalıştırmaları iptal etmek üzere `{ sessionKey }` desteği sunar (`runId` yok)
- İptal edilen kısmi içeriğin korunması:
  - Bir çalıştırma iptal edildiğinde, kısmi assistant metni yine de arayüzde gösterilebilir
  - Gateway, arabelleğe alınmış çıktı varsa iptal edilen kısmi assistant metnini döküm geçmişine kalıcı olarak yazar
  - Kalıcı girdiler, döküm tüketicilerinin iptal edilmiş kısmi içerikleri normal tamamlanma çıktısından ayırabilmesi için iptal meta verileri içerir

## Tailnet erişimi (önerilir)

### Tümleşik Tailscale Serve (tercih edilir)

Gateway'i loopback üzerinde tutun ve Tailscale Serve'ın bunu HTTPS ile proxy etmesini sağlayın:

```bash
openclaw gateway --tailscale serve
```

Şunu açın:

- `https://<magicdns>/` (veya yapılandırılmış `gateway.controlUi.basePath`)

Varsayılan olarak, Kontrol Arayüzü/WebSocket Serve istekleri
`gateway.auth.allowTailscale` `true` olduğunda Tailscale kimlik başlıkları (`tailscale-user-login`) ile kimlik doğrulaması yapabilir. OpenClaw,
`x-forwarded-for` adresini `tailscale whois` ile çözümleyip başlıkla eşleştirerek kimliği doğrular ve bunları yalnızca istek
Tailscale'in `x-forwarded-*` başlıklarıyla birlikte loopback'e ulaştığında kabul eder. Açık paylaşılan gizli anahtar
kimlik bilgilerini zorunlu kılmak istiyorsanız `gateway.auth.allowTailscale: false` ayarlayın. Sonra `gateway.auth.mode: "token"` veya
`"password"` kullanın.
Bu eşzamansız Serve kimlik yolunda, aynı istemci IP'si
ve kimlik doğrulama kapsamı için başarısız kimlik doğrulama denemeleri, hız sınırı yazımlarından önce serileştirilir. Bu nedenle aynı tarayıcıdan gelen eşzamanlı hatalı yeniden denemeler,
paralel yarışan iki düz uyuşmazlık yerine ikinci istekte `retry later` gösterebilir.
Tokensız Serve kimlik doğrulaması, gateway ana bilgisayarının güvenilir olduğunu varsayar. O ana bilgisayarda güvenilmeyen yerel kod çalışabiliyorsa, token/parola kimlik doğrulamasını zorunlu kılın.

### Tailnet'e bağlan + token

```bash
openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
```

Ardından şunu açın:

- `http://<tailscale-ip>:18789/` (veya yapılandırılmış `gateway.controlUi.basePath`)

Eşleşen paylaşılan gizli anahtarı arayüz ayarlarına yapıştırın (`connect.params.auth.token` veya `connect.params.auth.password`
olarak gönderilir).

## Güvensiz HTTP

Gösterge panelini düz HTTP üzerinden açarsanız (`http://<lan-ip>` veya `http://<tailscale-ip>`),
tarayıcı **güvenli olmayan bir bağlamda** çalışır ve WebCrypto'yu engeller. Varsayılan olarak,
OpenClaw cihaz kimliği olmadan Kontrol Arayüzü bağlantılarını **engeller**.

Belgelenmiş istisnalar:

- `gateway.controlUi.allowInsecureAuth=true` ile yalnızca localhost için güvensiz HTTP uyumluluğu
- `gateway.auth.mode: "trusted-proxy"` üzerinden başarılı operatör Kontrol Arayüzü kimlik doğrulaması
- acil durum için `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**Önerilen düzeltme:** HTTPS kullanın (Tailscale Serve) veya arayüzü yerel olarak açın:

- `https://<magicdns>/` (Serve)
- `http://127.0.0.1:18789/` (gateway ana bilgisayarında)

**Güvensiz kimlik doğrulama anahtarı davranışı:**

```json5
{
  gateway: {
    controlUi: { allowInsecureAuth: true },
    bind: "tailnet",
    auth: { mode: "token", token: "replace-me" },
  },
}
```

`allowInsecureAuth` yalnızca yerel bir uyumluluk anahtarıdır:

- Güvenli olmayan HTTP bağlamlarında localhost Kontrol Arayüzü oturumlarının cihaz kimliği olmadan ilerlemesine izin verir.
- Eşleştirme denetimlerini atlamaz.
- Uzak (localhost dışı) cihaz kimliği gereksinimlerini gevşetmez.

**Yalnızca acil durum için:**

```json5
{
  gateway: {
    controlUi: { dangerouslyDisableDeviceAuth: true },
    bind: "tailnet",
    auth: { mode: "token", token: "replace-me" },
  },
}
```

`dangerouslyDisableDeviceAuth`, Kontrol Arayüzü cihaz kimliği denetimlerini devre dışı bırakır ve
ciddi bir güvenlik düşüşüdür. Acil kullanım sonrası bunu hızla geri alın.

Güvenilir proxy notu:

- başarılı güvenilir proxy kimlik doğrulaması, cihaz kimliği olmadan **operatör** Kontrol Arayüzü oturumlarını kabul edebilir
- bu durum düğüm rolündeki Kontrol Arayüzü oturumlarına **uzanmaz**
- aynı ana bilgisayardaki loopback ters proxy'leri yine de güvenilir proxy kimlik doğrulamasını karşılamaz; bkz.
  [Trusted Proxy Auth](/tr/gateway/trusted-proxy-auth)

HTTPS kurulum rehberliği için [Tailscale](/tr/gateway/tailscale) bölümüne bakın.

## Arayüzü derleme

Gateway, `dist/control-ui` dizininden statik dosyalar sunar. Bunları şu komutla derleyin:

```bash
pnpm ui:build # ilk çalıştırmada arayüz bağımlılıklarını otomatik kurar
```

İsteğe bağlı mutlak taban (sabit varlık URL'leri istediğinizde):

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

Yerel geliştirme için (ayrı geliştirme sunucusu):

```bash
pnpm ui:dev # ilk çalıştırmada arayüz bağımlılıklarını otomatik kurar
```

Ardından arayüzü Gateway WS URL'nize yönlendirin (ör. `ws://127.0.0.1:18789`).

## Hata ayıklama/test etme: geliştirme sunucusu + uzak Gateway

Kontrol Arayüzü statik dosyalardır; WebSocket hedefi yapılandırılabilir ve
HTTP kaynağından farklı olabilir. Bu, Vite geliştirme sunucusunu yerelde kullanmak
ama Gateway'i başka bir yerde çalıştırmak istediğinizde kullanışlıdır.

1. Arayüz geliştirme sunucusunu başlatın: `pnpm ui:dev`
2. Şunun gibi bir URL açın:

```text
http://localhost:5173/?gatewayUrl=ws://<gateway-host>:18789
```

İsteğe bağlı tek seferlik kimlik doğrulama (gerekirse):

```text
http://localhost:5173/?gatewayUrl=wss://<gateway-host>:18789#token=<gateway-token>
```

Notlar:

- `gatewayUrl` yüklendikten sonra localStorage'da saklanır ve URL'den kaldırılır.
- `token` mümkün olduğunda URL parçası (`#token=...`) ile geçirilmelidir. Parçalar sunucuya gönderilmez; bu da istek günlüğü ve Referer sızıntısını önler. Eski `?token=` sorgu parametreleri uyumluluk için yine bir kez içe aktarılır, ancak yalnızca yedek olarak ve önyüklemeden hemen sonra kaldırılır.
- `password` yalnızca bellekte tutulur.
- `gatewayUrl` ayarlandığında, arayüz config veya ortam kimlik bilgilerine geri dönmez.
  `token` (veya `password`) açıkça sağlanmalıdır. Açık kimlik bilgilerinin eksik olması bir hatadır.
- Gateway TLS arkasındaysa `wss://` kullanın (Tailscale Serve, HTTPS proxy vb.).
- Tıklama sahtekarlığını önlemek için `gatewayUrl` yalnızca üst düzey pencerede kabul edilir (gömülü olarak değil).
- Loopback olmayan Kontrol Arayüzü dağıtımları `gateway.controlUi.allowedOrigins`
  değerini açıkça ayarlamalıdır (tam origin'ler). Buna uzak geliştirme kurulumları da dahildir.
- Sıkı denetimli yerel testler dışında `gateway.controlUi.allowedOrigins: ["*"]` kullanmayın.
  Bu, “kullandığım ana bilgisayarla eşleştir” değil, herhangi bir tarayıcı origin'ine izin ver anlamına gelir.
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true`, Host başlığı origin geri dönüş modunu etkinleştirir, ancak bu tehlikeli bir güvenlik modudur.

Örnek:

```json5
{
  gateway: {
    controlUi: {
      allowedOrigins: ["http://localhost:5173"],
    },
  },
}
```

Uzak erişim kurulum ayrıntıları: [Remote access](/tr/gateway/remote).

## İlgili

- [Dashboard](/web/dashboard) — gateway gösterge paneli
- [WebChat](/web/webchat) — tarayıcı tabanlı sohbet arayüzü
- [TUI](/web/tui) — terminal kullanıcı arayüzü
- [Health Checks](/tr/gateway/health) — gateway sağlık izleme
