---
read_when:
    - Signal desteğini ayarlama
    - Signal gönderme/alma hata ayıklaması
summary: signal-cli aracılığıyla Signal desteği (yerel daemon veya bbernhard container), kurulum yolları ve numara modeli
title: Signal
x-i18n:
    generated_at: "2026-06-28T00:15:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7f4d82f43a11494d371a9af9a8e55b227364594a5a144b5a4d8690e865d9ade8
    source_path: channels/signal.md
    workflow: 16
---

Durum: harici CLI entegrasyonu. Gateway, `signal-cli` ile HTTP üzerinden konuşur: yerel daemon (JSON-RPC + SSE) veya bbernhard/signal-cli-rest-api konteyneri (REST + WebSocket).

## Ön koşullar

- Sunucunuzda OpenClaw kurulu (aşağıdaki Linux akışı Ubuntu 24 üzerinde test edilmiştir).
- Şunlardan biri:
  - Ana makinede `signal-cli` kullanılabilir durumda (yerel mod), **veya**
  - `bbernhard/signal-cli-rest-api` Docker konteyneri (konteyner modu).
- Bir doğrulama SMS'i alabilen bir telefon numarası (SMS kayıt yolu için).
- Kayıt sırasında Signal captcha (`signalcaptchas.org`) için tarayıcı erişimi.

## Hızlı kurulum (başlangıç)

1. Bot için **ayrı bir Signal numarası** kullanın (önerilir).
2. OpenClaw Plugin'ini kurun:

```bash
openclaw plugins install @openclaw/signal
```

3. `signal-cli` kurun (JVM derlemesini kullanıyorsanız Java gerekir).
4. Bir kurulum yolu seçin:
   - **Yol A (QR bağlantısı):** `signal-cli link -n "OpenClaw"` ve Signal ile tarayın.
   - **Yol B (SMS kaydı):** captcha + SMS doğrulamasıyla ayrılmış bir numara kaydedin.
5. OpenClaw'ı yapılandırın ve gateway'i yeniden başlatın.
6. İlk DM'yi gönderin ve eşleştirmeyi onaylayın (`openclaw pairing approve signal <CODE>`).

En küçük yapılandırma:

```json5
{
  channels: {
    signal: {
      enabled: true,
      account: "+15551234567",
      cliPath: "signal-cli",
      dmPolicy: "pairing",
      allowFrom: ["+15557654321"],
    },
  },
}
```

Alan başvurusu:

| Alan         | Açıklama                                                     |
| ------------ | ------------------------------------------------------------ |
| `account`    | E.164 biçiminde bot telefon numarası (`+15551234567`)        |
| `cliPath`    | `signal-cli` yolu (`PATH` üzerindeyse `signal-cli`)          |
| `configPath` | `--config` olarak geçirilen signal-cli yapılandırma dizini   |
| `dmPolicy`   | DM erişim ilkesi (`pairing` önerilir)                        |
| `allowFrom`  | DM göndermesine izin verilen telefon numaraları veya `uuid:<id>` değerleri |

## Nedir

- `signal-cli` üzerinden Signal kanalı (gömülü libsignal değil).
- Belirleyici yönlendirme: yanıtlar her zaman Signal'e geri gider.
- DM'ler aracının ana oturumunu paylaşır; gruplar yalıtılır (`agent:<agentId>:signal:group:<groupId>`).

## Yapılandırma yazımları

Varsayılan olarak Signal'in `/config set|unset` tarafından tetiklenen yapılandırma güncellemelerini yazmasına izin verilir (`commands.config: true` gerektirir).

Şununla devre dışı bırakın:

```json5
{
  channels: { signal: { configWrites: false } },
}
```

## Numara modeli (önemli)

- Gateway bir **Signal cihazına** (`signal-cli` hesabı) bağlanır.
- Botu **kişisel Signal hesabınızda** çalıştırırsanız, kendi mesajlarınızı yok sayar (döngü koruması).
- "Bota mesaj atıyorum ve yanıtlıyor" için **ayrı bir bot numarası** kullanın.

## Kurulum yolu A: Mevcut Signal hesabını bağlama (QR)

1. `signal-cli` kurun (JVM veya yerel derleme).
2. Bir bot hesabı bağlayın:
   - `signal-cli link -n "OpenClaw"` ardından Signal'deki QR'ı tarayın.
3. Signal'i yapılandırın ve gateway'i başlatın.

Örnek:

```json5
{
  channels: {
    signal: {
      enabled: true,
      account: "+15551234567",
      cliPath: "signal-cli",
      dmPolicy: "pairing",
      allowFrom: ["+15557654321"],
    },
  },
}
```

Çok hesaplı destek: hesap başına yapılandırma ve isteğe bağlı `name` ile `channels.signal.accounts` kullanın. Paylaşılan kalıp için [`gateway/configuration`](/tr/gateway/config-channels#multi-account-all-channels) bölümüne bakın.

## Kurulum yolu B: Ayrılmış bot numarası kaydetme (SMS, Linux)

Mevcut bir Signal uygulama hesabını bağlamak yerine ayrılmış bir bot numarası istediğinizde bunu kullanın.

1. SMS alabilen bir numara edinin (veya sabit hatlar için sesli doğrulama).
   - Hesap/oturum çakışmalarını önlemek için ayrılmış bir bot numarası kullanın.
2. Gateway ana makinesine `signal-cli` kurun:

```bash
VERSION=$(curl -Ls -o /dev/null -w %{url_effective} https://github.com/AsamK/signal-cli/releases/latest | sed -e 's/^.*\/v//')
curl -L -O "https://github.com/AsamK/signal-cli/releases/download/v${VERSION}/signal-cli-${VERSION}-Linux-native.tar.gz"
sudo tar xf "signal-cli-${VERSION}-Linux-native.tar.gz" -C /opt
sudo ln -sf /opt/signal-cli /usr/local/bin/
signal-cli --version
```

JVM derlemesini (`signal-cli-${VERSION}.tar.gz`) kullanıyorsanız önce JRE 25+ kurun.
`signal-cli` güncel tutun; upstream, Signal sunucu API'leri değiştikçe eski sürümlerin bozulabileceğini belirtir.

3. Numarayı kaydedin ve doğrulayın:

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register
```

Captcha gerekiyorsa:

1. `https://signalcaptchas.org/registration/generate.html` adresini açın.
2. Captcha'yı tamamlayın, "Open Signal" içinden `signalcaptcha://...` bağlantı hedefini kopyalayın.
3. Mümkün olduğunda tarayıcı oturumuyla aynı harici IP'den çalıştırın.
4. Kaydı hemen yeniden çalıştırın (captcha token'ları hızlıca sona erer):

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register --captcha '<SIGNALCAPTCHA_URL>'
signal-cli -a +<BOT_PHONE_NUMBER> verify <VERIFICATION_CODE>
```

4. OpenClaw'ı yapılandırın, gateway'i yeniden başlatın, kanalı doğrulayın:

```bash
# Gateway'i kullanıcı systemd hizmeti olarak çalıştırıyorsanız:
systemctl --user restart openclaw-gateway.service

# Ardından doğrulayın:
openclaw doctor
openclaw channels status --probe
```

5. DM göndereninizi eşleştirin:
   - Bot numarasına herhangi bir mesaj gönderin.
   - Sunucuda kodu onaylayın: `openclaw pairing approve signal <PAIRING_CODE>`.
   - "Bilinmeyen kişi" uyarısını önlemek için bot numarasını telefonunuzda kişi olarak kaydedin.

<Warning>
`signal-cli` ile bir telefon numarası hesabı kaydetmek, o numaranın ana Signal uygulama oturumunun yetkisini kaldırabilir. Ayrılmış bir bot numarası tercih edin veya mevcut telefon uygulaması kurulumunuzu korumanız gerekiyorsa QR bağlantı modunu kullanın.
</Warning>

Upstream başvuruları:

- `signal-cli` README: `https://github.com/AsamK/signal-cli`
- Captcha akışı: `https://github.com/AsamK/signal-cli/wiki/Registration-with-captcha`
- Bağlama akışı: `https://github.com/AsamK/signal-cli/wiki/Linking-other-devices-(Provisioning)`

## Harici daemon modu (httpUrl)

`signal-cli` yönetimini kendiniz yapmak istiyorsanız (yavaş JVM soğuk başlatmaları, konteyner başlatma veya paylaşılan CPU'lar), daemon'ı ayrı çalıştırın ve OpenClaw'ı ona yönlendirin:

```json5
{
  channels: {
    signal: {
      httpUrl: "http://127.0.0.1:8080",
      autoStart: false,
    },
  },
}
```

Bu, OpenClaw içindeki otomatik başlatmayı ve başlangıç beklemesini atlar. Otomatik başlatmada yavaş başlangıçlar için `channels.signal.startupTimeoutMs` ayarlayın.

## Konteyner modu (bbernhard/signal-cli-rest-api)

`signal-cli` yerel olarak çalıştırmak yerine [bbernhard/signal-cli-rest-api](https://github.com/bbernhard/signal-cli-rest-api) Docker konteynerini kullanabilirsiniz. Bu, `signal-cli` için bir REST API ve WebSocket arayüzü sağlar.

Gereksinimler:

- Gerçek zamanlı mesaj alma için konteyner **mutlaka** `MODE=json-rpc` ile çalışmalıdır.
- OpenClaw'a bağlanmadan önce Signal hesabınızı konteyner içinde kaydedin veya bağlayın.

Örnek `docker-compose.yml` hizmeti:

```yaml
signal-cli:
  image: bbernhard/signal-cli-rest-api:latest
  environment:
    MODE: json-rpc
  ports:
    - "8080:8080"
  volumes:
    - signal-cli-data:/home/.local/share/signal-cli
```

OpenClaw yapılandırması:

```json5
{
  channels: {
    signal: {
      enabled: true,
      account: "+15551234567",
      httpUrl: "http://signal-cli:8080",
      autoStart: false,
      apiMode: "container", // veya otomatik algılamak için "auto"
    },
  },
}
```

`apiMode` alanı OpenClaw'ın hangi protokolü kullanacağını denetler:

| Değer         | Davranış                                                                             |
| ------------- | ------------------------------------------------------------------------------------ |
| `"auto"`      | (Varsayılan) İki aktarımı da yoklar; akış konteyner WebSocket alımını doğrular       |
| `"native"`    | Yerel signal-cli'ı zorlar (`/api/v1/rpc` üzerinde JSON-RPC, `/api/v1/events` üzerinde SSE) |
| `"container"` | bbernhard konteynerini zorlar (`/v2/send` üzerinde REST, `/v1/receive/{account}` üzerinde WebSocket) |

`apiMode` `"auto"` olduğunda OpenClaw, yinelenen yoklamaları önlemek için algılanan modu 30 saniye önbelleğe alır. Konteyner alma, yalnızca `/v1/receive/{account}` WebSocket'e yükseltildikten sonra akış için seçilir; bu `MODE=json-rpc` gerektirir.

Konteyner modu, konteyner eşleşen API'leri sunduğunda yerel modla aynı Signal kanalı işlemlerini destekler: gönderimler, alımlar, ekler, yazıyor göstergeleri, okundu/görüldü alındıları, tepkiler, gruplar ve stilli metin. OpenClaw, yerel Signal RPC çağrılarını konteynerin REST yüklerine çevirir; buna `group.{base64(internal_id)}` grup kimlikleri ve biçimlendirilmiş metin için `text_mode: "styled"` dahildir.

Operasyonel notlar:

- Konteyner moduyla `autoStart: false` kullanın. `apiMode: "container"` seçiliyken OpenClaw yerel bir daemon başlatmamalıdır.
- Alma için `MODE=json-rpc` kullanın. `MODE=normal`, `/v1/about` yolunu sağlıklı gösterebilir, ancak `/v1/receive/{account}` WebSocket'e yükselmez; bu nedenle OpenClaw `auto` modunda konteyner alma akışını seçmez.
- `httpUrl` değerinin bbernhard'ın REST API'sine işaret ettiğini biliyorsanız `apiMode: "container"` ayarlayın. Yerel `signal-cli` JSON-RPC/SSE'ye işaret ettiğini biliyorsanız `apiMode: "native"` ayarlayın. Dağıtım değişebiliyorsa `"auto"` kullanın.
- Konteyner ek indirmeleri, yerel modla aynı medya bayt sınırlarına uyar. Sunucu `Content-Length` gönderdiğinde aşırı büyük yanıtlar tamamen arabelleğe alınmadan önce, aksi halde akış sırasında reddedilir.

## Erişim denetimi (DM'ler + gruplar)

DM'ler:

- Varsayılan: `channels.signal.dmPolicy = "pairing"`.
- Bilinmeyen gönderenler bir eşleştirme kodu alır; onaylanana kadar mesajlar yok sayılır (kodlar 1 saat sonra sona erer).
- Şununla onaylayın:
  - `openclaw pairing list signal`
  - `openclaw pairing approve signal <CODE>`
- Eşleştirme, Signal DM'leri için varsayılan token değişimidir. Ayrıntılar: [Eşleştirme](/tr/channels/pairing)
- Yalnızca UUID gönderenler (`sourceUuid` üzerinden), `channels.signal.allowFrom` içinde `uuid:<id>` olarak saklanır.

Gruplar:

- `channels.signal.groupPolicy = open | allowlist | disabled`.
- `channels.signal.groupAllowFrom`, `allowlist` ayarlandığında hangi grupların veya gönderenlerin grup yanıtlarını tetikleyebileceğini denetler; girdiler Signal grup kimlikleri (ham, `group:<id>` veya `signal:group:<id>`), gönderen telefon numaraları, `uuid:<id>` değerleri veya `*` olabilir.
- `channels.signal.groups["<group-id>" | "*"]`, grup davranışını `requireMention`, `tools` ve `toolsBySender` ile geçersiz kılabilir.
- Çok hesaplı kurulumlarda hesap başına geçersiz kılmalar için `channels.signal.accounts.<id>.groups` kullanın.
- Bir Signal grubunu `groupAllowFrom` üzerinden izin listesine almak, söz edilme kapısını tek başına devre dışı bırakmaz. Özellikle yapılandırılmış bir `channels.signal.groups["<group-id>"]` girdisi, `requireMention=true` ayarlanmadıkça her grup mesajını işler.
- Çalışma zamanı notu: `channels.signal` tamamen eksikse çalışma zamanı, grup denetimleri için `groupPolicy="allowlist"` değerine geri döner (`channels.defaults.groupPolicy` ayarlı olsa bile).

## Nasıl çalışır (davranış)

- Yerel mod: `signal-cli` daemon olarak çalışır; gateway olayları SSE üzerinden okur.
- Konteyner modu: gateway REST API üzerinden gönderir ve WebSocket üzerinden alır.
- Gelen mesajlar paylaşılan kanal zarfına normalleştirilir.
- Yanıtlar her zaman aynı numaraya veya gruba geri yönlendirilir.

## Medya + sınırlar

- Giden metin `channels.signal.textChunkLimit` değerine göre parçalara ayrılır (varsayılan 4000).
- İsteğe bağlı yeni satır parçalama: uzunluğa göre parçalamadan önce boş satırlarda (paragraf sınırları) bölmek için `channels.signal.chunkMode="newline"` ayarlayın.
- Ekler desteklenir (`signal-cli` üzerinden base64 alınır).
- Sesli not ekleri, `contentType` eksik olduğunda MIME yedeği olarak `signal-cli` dosya adını kullanır; böylece ses transkripsiyonu AAC sesli notlarını yine de sınıflandırabilir.
- Varsayılan medya sınırı: `channels.signal.mediaMaxMb` (varsayılan 8).
- Medya indirmeyi atlamak için `channels.signal.ignoreAttachments` kullanın.
- Grup geçmişi bağlamı `channels.signal.historyLimit` (veya `channels.signal.accounts.*.historyLimit`) kullanır; `messages.groupChat.historyLimit` değerine geri döner. Devre dışı bırakmak için `0` ayarlayın (varsayılan 50).

## Yazıyor + okundu alındıları

- **Yazma göstergeleri**: OpenClaw, `signal-cli sendTyping` aracılığıyla yazma sinyalleri gönderir ve bir yanıt çalışırken bunları yeniler.
- **Okundu bilgileri**: `channels.signal.sendReadReceipts` true olduğunda OpenClaw, izin verilen DM'ler için okundu bilgilerini iletir.
- Signal-cli, gruplar için okundu bilgilerini sunmaz.

## Tepkiler (message aracı)

- `channel=signal` ile `message action=react` kullanın.
- Hedefler: gönderen E.164 veya UUID (`uuid:<id>` değerini eşleştirme çıktısından kullanın; çıplak UUID de çalışır).
- `messageId`, tepki verdiğiniz mesajın Signal zaman damgasıdır.
- Grup tepkileri `targetAuthor` veya `targetAuthorUuid` gerektirir.

Örnekler:

```
message action=react channel=signal target=uuid:123e4567-e89b-12d3-a456-426614174000 messageId=1737630212345 emoji=🔥
message action=react channel=signal target=+15551234567 messageId=1737630212345 emoji=🔥 remove=true
message action=react channel=signal target=signal:group:<groupId> targetAuthor=uuid:<sender-uuid> messageId=1737630212345 emoji=✅
```

Yapılandırma:

- `channels.signal.actions.reactions`: tepki eylemlerini etkinleştirir/devre dışı bırakır (varsayılan true).
- `channels.signal.reactionLevel`: `off | ack | minimal | extensive`.
  - `off`/`ack`, ajan tepkilerini devre dışı bırakır (`react` message aracı hata verir).
  - `minimal`/`extensive`, ajan tepkilerini etkinleştirir ve rehberlik düzeyini ayarlar.
- Hesap başına geçersiz kılmalar: `channels.signal.accounts.<id>.actions.reactions`, `channels.signal.accounts.<id>.reactionLevel`.

## Onay tepkileri

Signal exec ve Plugin onay istemleri, üst düzey `approvals.exec` ve
`approvals.plugin` yönlendirme bloklarını kullanır. Signal'de
`channels.signal.execApprovals` bloğu yoktur.

- `👍` bir kez onaylar.
- `👎` reddeder.
- Bir istek kalıcı onay sunuyorsa `/approve <id> allow-always` kullanın.

Onay tepkisi çözümlemesi, `channels.signal.allowFrom`, `channels.signal.defaultTo`
veya eşleşen hesap düzeyi alanlardan açık Signal onaylayıcıları gerektirir.
Aynı sohbetteki doğrudan exec onay istemleri, açık onaylayıcılar olmadan da yinelenen yerel `/approve` yedeğini bastırabilir; onaylayıcısız grup onayları yerel yedeği görünür tutar.

## Teslim hedefleri (CLI/Cron)

- DM'ler: `signal:+15551234567` (veya düz E.164).
- UUID DM'leri: `uuid:<id>` (veya çıplak UUID).
- Gruplar: `signal:group:<groupId>`.
- Kullanıcı adları: `username:<name>` (Signal hesabınız destekliyorsa).

## Sorun giderme

Önce şu basamakları çalıştırın:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Ardından gerekirse DM eşleştirme durumunu doğrulayın:

```bash
openclaw pairing list signal
```

Yaygın hatalar:

- Daemon erişilebilir ama yanıt yok: hesap/daemon ayarlarını (`httpUrl`, `account`) ve alma modunu doğrulayın.
- DM'ler yok sayılıyor: gönderenin eşleştirme onayı beklemede.
- Grup mesajları yok sayılıyor: grup göndereni/bahsetme kapıları teslimi engelliyor.
- Düzenlemelerden sonra yapılandırma doğrulama hataları: `openclaw doctor --fix` çalıştırın.
- Signal tanılamalarda eksik: `channels.signal.enabled: true` değerini doğrulayın.

Ek denetimler:

```bash
openclaw pairing list signal
pgrep -af signal-cli
grep -i "signal" "/tmp/openclaw/openclaw-$(date +%Y-%m-%d).log" | tail -20
```

Triyaj akışı için: [/channels/troubleshooting](/tr/channels/troubleshooting).

## Güvenlik notları

- `signal-cli`, hesap anahtarlarını yerel olarak saklar (genellikle `~/.local/share/signal-cli/data/`).
- Sunucu geçişi veya yeniden kurulumdan önce Signal hesap durumunu yedekleyin.
- Daha geniş DM erişimini açıkça istemiyorsanız `channels.signal.dmPolicy: "pairing"` değerini koruyun.
- SMS doğrulaması yalnızca kayıt veya kurtarma akışları için gerekir, ancak numaranın/hesabın denetimini kaybetmek yeniden kaydı zorlaştırabilir.

## Yapılandırma referansı (Signal)

Tam yapılandırma: [Yapılandırma](/tr/gateway/configuration)

Sağlayıcı seçenekleri:

- `channels.signal.enabled`: kanal başlangıcını etkinleştirir/devre dışı bırakır.
- `channels.signal.apiMode`: `auto | native | container` (varsayılan: auto). Bkz. [Konteyner modu](#container-mode-bbernhardsignal-cli-rest-api).
- `channels.signal.account`: bot hesabı için E.164.
- `channels.signal.cliPath`: `signal-cli` yolu.
- `channels.signal.configPath`: isteğe bağlı `signal-cli --config` dizini.
- `channels.signal.httpUrl`: tam daemon URL'si (host/port değerlerini geçersiz kılar).
- `channels.signal.httpHost`, `channels.signal.httpPort`: daemon bind değeri (varsayılan 127.0.0.1:8080).
- `channels.signal.autoStart`: daemon'ı otomatik başlatır (`httpUrl` ayarlanmamışsa varsayılan true).
- `channels.signal.startupTimeoutMs`: ms cinsinden başlangıç bekleme zaman aşımı (üst sınır 120000).
- `channels.signal.receiveMode`: `on-start | manual`.
- `channels.signal.ignoreAttachments`: ek indirmelerini atlar.
- `channels.signal.ignoreStories`: daemon'dan gelen hikayeleri yok sayar.
- `channels.signal.sendReadReceipts`: okundu bilgilerini iletir.
- `channels.signal.dmPolicy`: `pairing | allowlist | open | disabled` (varsayılan: pairing).
- `channels.signal.allowFrom`: DM izin listesi (E.164 veya `uuid:<id>`). `open`, `"*"` gerektirir. Signal'de kullanıcı adı yoktur; telefon/UUID kimlikleri kullanın.
- `channels.signal.groupPolicy`: `open | allowlist | disabled` (varsayılan: allowlist).
- `channels.signal.groupAllowFrom`: grup izin listesi; Signal grup kimliklerini (ham, `group:<id>` veya `signal:group:<id>`), gönderen E.164 numaralarını veya `uuid:<id>` değerlerini kabul eder.
- `channels.signal.groups`: Signal grup kimliğine (veya `"*"`) göre anahtarlanan grup başına geçersiz kılmalar. Desteklenen alanlar: `requireMention`, `tools`, `toolsBySender`.
- `channels.signal.accounts.<id>.groups`: çok hesaplı kurulumlar için `channels.signal.groups` değerinin hesap başına sürümü.
- `channels.signal.historyLimit`: bağlam olarak dahil edilecek en fazla grup mesajı (0 devre dışı bırakır).
- `channels.signal.dmHistoryLimit`: kullanıcı turları cinsinden DM geçmiş sınırı. Kullanıcı başına geçersiz kılmalar: `channels.signal.dms["<phone_or_uuid>"].historyLimit`.
- `channels.signal.textChunkLimit`: giden parça boyutu (karakter).
- `channels.signal.chunkMode`: uzunluğa göre parçalamadan önce boş satırlardan (paragraf sınırları) bölmek için `length` (varsayılan) veya `newline`.
- `channels.signal.mediaMaxMb`: gelen/giden medya üst sınırı (MB).

İlgili genel seçenekler:

- `agents.list[].groupChat.mentionPatterns` (Signal yerel bahsetmeleri desteklemez).
- `messages.groupChat.mentionPatterns` (genel yedek).
- `messages.responsePrefix`.

## İlgili

- [Kanallara Genel Bakış](/tr/channels) — desteklenen tüm kanallar
- [Eşleştirme](/tr/channels/pairing) — DM kimlik doğrulaması ve eşleştirme akışı
- [Gruplar](/tr/channels/groups) — grup sohbeti davranışı ve bahsetme kapıları
- [Kanal Yönlendirme](/tr/channels/channel-routing) — mesajlar için oturum yönlendirme
- [Güvenlik](/tr/gateway/security) — erişim modeli ve sağlamlaştırma
