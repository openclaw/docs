---
read_when:
    - Signal desteğini ayarlama
    - Signal gönderme/alma işlemlerinde hata ayıklama
summary: signal-cli aracılığıyla Signal desteği (yerel artalan süreci veya bbernhard konteyneri), kurulum yolları ve numara modeli
title: Signal
x-i18n:
    generated_at: "2026-05-10T19:23:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8d92f94f6c1363a795366501bb5c6d5f09756c03f156b482d17021c276e3577c
    source_path: channels/signal.md
    workflow: 16
---

Durum: harici CLI entegrasyonu. Gateway, `signal-cli` ile HTTP üzerinden konuşur; ya yerel daemon (JSON-RPC + SSE) ya da bbernhard/signal-cli-rest-api konteyneri (REST + WebSocket).

## Önkoşullar

- OpenClaw sunucunuza kurulmuş olmalı (aşağıdaki Linux akışı Ubuntu 24 üzerinde test edildi).
- Şunlardan biri:
  - Ana makinede `signal-cli` kullanılabilir olmalı (yerel mod), **veya**
  - `bbernhard/signal-cli-rest-api` Docker konteyneri (konteyner modu).
- Bir doğrulama SMS'i alabilen bir telefon numarası (SMS kayıt yolu için).
- Kayıt sırasında Signal captcha'sı (`signalcaptchas.org`) için tarayıcı erişimi.

## Hızlı kurulum (başlangıç)

1. Bot için **ayrı bir Signal numarası** kullanın (önerilir).
2. `signal-cli` kurun (JVM derlemesini kullanıyorsanız Java gerekir).
3. Bir kurulum yolu seçin:
   - **Yol A (QR bağlantısı):** `signal-cli link -n "OpenClaw"` ve Signal ile tarayın.
   - **Yol B (SMS kaydı):** captcha + SMS doğrulamasıyla ayrılmış bir numara kaydedin.
4. OpenClaw'ı yapılandırın ve gateway'i yeniden başlatın.
5. İlk DM'yi gönderin ve eşleştirmeyi onaylayın (`openclaw pairing approve signal <CODE>`).

Minimal yapılandırma:

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

| Alan        | Açıklama                                                  |
| ----------- | --------------------------------------------------------- |
| `account`   | E.164 biçiminde bot telefon numarası (`+15551234567`)     |
| `cliPath`   | `signal-cli` yolu (`PATH` üzerindeyse `signal-cli`)       |
| `dmPolicy`  | DM erişim politikası (`pairing` önerilir)                 |
| `allowFrom` | DM göndermesine izin verilen telefon numaraları veya `uuid:<id>` değerleri |

## Nedir

- `signal-cli` üzerinden Signal kanalı (gömülü libsignal değil).
- Belirleyici yönlendirme: yanıtlar her zaman Signal'e geri gider.
- DM'ler aracının ana oturumunu paylaşır; gruplar yalıtılmıştır (`agent:<agentId>:signal:group:<groupId>`).

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
- "Bota mesaj atıyorum ve yanıt veriyor" için **ayrı bir bot numarası** kullanın.

## Kurulum yolu A: mevcut Signal hesabını bağlama (QR)

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

Çoklu hesap desteği: hesap başına yapılandırma ve isteğe bağlı `name` ile `channels.signal.accounts` kullanın. Paylaşılan kalıp için [`gateway/configuration`](/tr/gateway/config-channels#multi-account-all-channels) bölümüne bakın.

## Kurulum yolu B: ayrılmış bot numarası kaydetme (SMS, Linux)

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
4. Kaydı hemen yeniden çalıştırın (captcha token'ları hızlı sona erer):

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
Bir telefon numarası hesabını `signal-cli` ile kaydetmek, o numara için ana Signal uygulama oturumunun yetkisini kaldırabilir. Ayrılmış bir bot numarası tercih edin veya mevcut telefon uygulaması kurulumunuzu korumanız gerekiyorsa QR bağlantı modunu kullanın.
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

Bu, OpenClaw içindeki otomatik başlatmayı ve başlangıç beklemesini atlar. Otomatik başlatma sırasında yavaş başlangıçlar için `channels.signal.startupTimeoutMs` ayarlayın.

## Konteyner modu (bbernhard/signal-cli-rest-api)

`signal-cli` yerel olarak çalıştırmak yerine [bbernhard/signal-cli-rest-api](https://github.com/bbernhard/signal-cli-rest-api) Docker konteynerini kullanabilirsiniz. Bu, `signal-cli` aracını bir REST API ve WebSocket arayüzünün arkasında sarmalar.

Gereksinimler:

- Gerçek zamanlı mesaj alımı için konteyner **`MODE=json-rpc` ile** çalışmalıdır.
- OpenClaw'ı bağlamadan önce Signal hesabınızı konteyner içinde kaydedin veya bağlayın.

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
      apiMode: "container", // or "auto" to detect automatically
    },
  },
}
```

`apiMode` alanı OpenClaw'ın hangi protokolü kullanacağını denetler:

| Değer         | Davranış                                                                                  |
| ------------- | ----------------------------------------------------------------------------------------- |
| `"auto"`      | (Varsayılan) Her iki aktarımı yoklar; akış, konteyner WebSocket alımını doğrular          |
| `"native"`    | Yerel signal-cli'ı zorlar (`/api/v1/rpc` üzerinde JSON-RPC, `/api/v1/events` üzerinde SSE) |
| `"container"` | bbernhard konteynerini zorlar (`/v2/send` üzerinde REST, `/v1/receive/{account}` üzerinde WebSocket) |

`apiMode` `"auto"` olduğunda, OpenClaw tekrarlanan yoklamaları önlemek için algılanan modu 30 saniye önbelleğe alır. Konteyner alımı, yalnızca `/v1/receive/{account}` WebSocket'e yükseltildikten sonra akış için seçilir; bu da `MODE=json-rpc` gerektirir.

Konteyner modu, konteynerin eşleşen API'leri sunduğu durumlarda yerel modla aynı Signal kanal işlemlerini destekler: gönderimler, alımlar, ekler, yazıyor göstergeleri, okundu/görüldü alındıları, tepkiler, gruplar ve biçimli metin. OpenClaw, yerel Signal RPC çağrılarını konteynerin REST yüklerine çevirir; buna `group.{base64(internal_id)}` grup kimlikleri ve biçimlendirilmiş metin için `text_mode: "styled"` dahildir.

Operasyonel notlar:

- Konteyner modunda `autoStart: false` kullanın. `apiMode: "container"` seçildiğinde OpenClaw yerel bir daemon başlatmamalıdır.
- Alım için `MODE=json-rpc` kullanın. `MODE=normal`, `/v1/about` uç noktasını sağlıklı gösterebilir, ancak `/v1/receive/{account}` WebSocket'e yükselmez; bu yüzden OpenClaw `auto` modunda konteyner alım akışını seçmez.
- `httpUrl` değerinin bbernhard'ın REST API'sine işaret ettiğini biliyorsanız `apiMode: "container"` ayarlayın. Yerel `signal-cli` JSON-RPC/SSE'ye işaret ettiğini biliyorsanız `apiMode: "native"` ayarlayın. Dağıtım değişebiliyorsa `"auto"` kullanın.
- Konteyner ek indirmeleri, yerel modla aynı medya bayt sınırlarına uyar. Sunucu `Content-Length` gönderdiğinde fazla büyük yanıtlar tamamen arabelleğe alınmadan önce reddedilir; aksi halde akış sırasında reddedilir.

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
- Çoklu hesap kurulumlarında hesap başına geçersiz kılmalar için `channels.signal.accounts.<id>.groups` kullanın.
- Bir Signal grubunu `groupAllowFrom` üzerinden izin listesine almak, tek başına bahsetme kapısını devre dışı bırakmaz. Özel olarak yapılandırılmış bir `channels.signal.groups["<group-id>"]` girdisi, `requireMention=true` ayarlanmadıkça her grup mesajını işler.
- Çalışma zamanı notu: `channels.signal` tamamen eksikse, çalışma zamanı grup kontrolleri için `groupPolicy="allowlist"` değerine geri döner (`channels.defaults.groupPolicy` ayarlanmış olsa bile).

## Nasıl çalışır (davranış)

- Yerel mod: `signal-cli` daemon olarak çalışır; gateway olayları SSE üzerinden okur.
- Konteyner modu: gateway REST API üzerinden gönderir ve WebSocket üzerinden alır.
- Gelen mesajlar paylaşılan kanal zarfına normalleştirilir.
- Yanıtlar her zaman aynı numaraya veya gruba geri yönlendirilir.

## Medya + sınırlar

- Giden metin `channels.signal.textChunkLimit` değerine göre parçalara bölünür (varsayılan 4000).
- İsteğe bağlı yeni satır parçalama: uzunluk parçalamadan önce boş satırlara (paragraf sınırları) göre bölmek için `channels.signal.chunkMode="newline"` ayarlayın.
- Ekler desteklenir (`signal-cli` üzerinden base64 olarak alınır).
- Ses notu ekleri, `contentType` eksik olduğunda MIME yedeği olarak `signal-cli` dosya adını kullanır; böylece ses transkripsiyonu AAC ses notlarını yine de sınıflandırabilir.
- Varsayılan medya üst sınırı: `channels.signal.mediaMaxMb` (varsayılan 8).
- Medya indirmeyi atlamak için `channels.signal.ignoreAttachments` kullanın.
- Grup geçmişi bağlamı `channels.signal.historyLimit` (veya `channels.signal.accounts.*.historyLimit`) kullanır; `messages.groupChat.historyLimit` değerine geri döner. Devre dışı bırakmak için `0` ayarlayın (varsayılan 50).

## Yazıyor + okundu alındıları

- **Yazıyor göstergeleri**: OpenClaw, `signal-cli sendTyping` üzerinden yazıyor sinyalleri gönderir ve bir yanıt çalışırken bunları yeniler.
- **Okundu alındıları**: `channels.signal.sendReadReceipts` true olduğunda, OpenClaw izin verilen DM'ler için okundu alındılarını iletir.
- Signal-cli, gruplar için okundu alındılarını sunmaz.

## Tepkiler (mesaj aracı)

- `channel=signal` ile `message action=react` kullanın.
- Hedefler: gönderenin E.164 değeri veya UUID'si (eşleştirme çıktısından `uuid:<id>` kullanın; yalın UUID de çalışır).
- `messageId`, tepki verdiğiniz iletinin Signal zaman damgasıdır.
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
  - `off`/`ack` ajan tepkilerini devre dışı bırakır (`react` ileti aracı hata verir).
  - `minimal`/`extensive` ajan tepkilerini etkinleştirir ve yönlendirme düzeyini ayarlar.
- Hesap başına geçersiz kılmalar: `channels.signal.accounts.<id>.actions.reactions`, `channels.signal.accounts.<id>.reactionLevel`.

## Teslim hedefleri (CLI/Cron)

- DM'ler: `signal:+15551234567` (veya düz E.164).
- UUID DM'leri: `uuid:<id>` (veya yalın UUID).
- Gruplar: `signal:group:<groupId>`.
- Kullanıcı adları: `username:<name>` (Signal hesabınız tarafından destekleniyorsa).

## Sorun giderme

Önce şu sırayı çalıştırın:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Gerekirse ardından DM eşleştirme durumunu doğrulayın:

```bash
openclaw pairing list signal
```

Yaygın hatalar:

- Daemon erişilebilir ama yanıt yok: hesap/daemon ayarlarını (`httpUrl`, `account`) ve alma modunu doğrulayın.
- DM'ler yok sayılıyor: gönderen eşleştirme onayı bekliyor.
- Grup iletileri yok sayılıyor: grup göndereni/bahsetme geçidi teslimi engelliyor.
- Düzenlemelerden sonra yapılandırma doğrulama hataları: `openclaw doctor --fix` çalıştırın.
- Signal tanılamalarda eksik: `channels.signal.enabled: true` olduğunu doğrulayın.

Ek kontroller:

```bash
openclaw pairing list signal
pgrep -af signal-cli
grep -i "signal" "/tmp/openclaw/openclaw-$(date +%Y-%m-%d).log" | tail -20
```

Triyaj akışı için: [/channels/troubleshooting](/tr/channels/troubleshooting).

## Güvenlik notları

- `signal-cli` hesap anahtarlarını yerel olarak depolar (genellikle `~/.local/share/signal-cli/data/`).
- Sunucu taşıma veya yeniden kurma işleminden önce Signal hesap durumunu yedekleyin.
- Daha geniş DM erişimini açıkça istemiyorsanız `channels.signal.dmPolicy: "pairing"` değerini koruyun.
- SMS doğrulaması yalnızca kayıt veya kurtarma akışları için gereklidir, ancak numaranın/hesabın kontrolünü kaybetmek yeniden kaydı karmaşıklaştırabilir.

## Yapılandırma başvurusu (Signal)

Tam yapılandırma: [Yapılandırma](/tr/gateway/configuration)

Sağlayıcı seçenekleri:

- `channels.signal.enabled`: kanal başlangıcını etkinleştirir/devre dışı bırakır.
- `channels.signal.apiMode`: `auto | native | container` (varsayılan: auto). Bkz. [Konteyner modu](#container-mode-bbernhardsignal-cli-rest-api).
- `channels.signal.account`: bot hesabı için E.164.
- `channels.signal.cliPath`: `signal-cli` yolu.
- `channels.signal.httpUrl`: tam daemon URL'si (host/port değerlerini geçersiz kılar).
- `channels.signal.httpHost`, `channels.signal.httpPort`: daemon bağlaması (varsayılan 127.0.0.1:8080).
- `channels.signal.autoStart`: daemon'u otomatik başlatır (`httpUrl` ayarlanmamışsa varsayılan true).
- `channels.signal.startupTimeoutMs`: ms cinsinden başlangıç bekleme zaman aşımı (üst sınır 120000).
- `channels.signal.receiveMode`: `on-start | manual`.
- `channels.signal.ignoreAttachments`: ek indirmelerini atlar.
- `channels.signal.ignoreStories`: daemon'dan gelen hikayeleri yok sayar.
- `channels.signal.sendReadReceipts`: okundu bilgilerini iletir.
- `channels.signal.dmPolicy`: `pairing | allowlist | open | disabled` (varsayılan: pairing).
- `channels.signal.allowFrom`: DM izin listesi (E.164 veya `uuid:<id>`). `open`, `"*"` gerektirir. Signal'de kullanıcı adları yoktur; telefon/UUID kimliklerini kullanın.
- `channels.signal.groupPolicy`: `open | allowlist | disabled` (varsayılan: allowlist).
- `channels.signal.groupAllowFrom`: grup izin listesi; Signal grup kimliklerini (ham, `group:<id>` veya `signal:group:<id>`), gönderen E.164 numaralarını veya `uuid:<id>` değerlerini kabul eder.
- `channels.signal.groups`: Signal grup kimliğine (veya `"*"`) göre anahtarlanan grup başına geçersiz kılmalar. Desteklenen alanlar: `requireMention`, `tools`, `toolsBySender`.
- `channels.signal.accounts.<id>.groups`: çok hesaplı kurulumlar için `channels.signal.groups` değerinin hesap başına sürümü.
- `channels.signal.historyLimit`: bağlam olarak eklenecek en fazla grup iletisi sayısı (0 devre dışı bırakır).
- `channels.signal.dmHistoryLimit`: kullanıcı dönüşleri cinsinden DM geçmiş sınırı. Kullanıcı başına geçersiz kılmalar: `channels.signal.dms["<phone_or_uuid>"].historyLimit`.
- `channels.signal.textChunkLimit`: giden parça boyutu (karakter).
- `channels.signal.chunkMode`: uzunluğa göre parçalamadan önce boş satırlara (paragraf sınırlarına) göre bölmek için `length` (varsayılan) veya `newline`.
- `channels.signal.mediaMaxMb`: gelen/giden medya üst sınırı (MB).

İlgili genel seçenekler:

- `agents.list[].groupChat.mentionPatterns` (Signal yerel bahsetmeleri desteklemez).
- `messages.groupChat.mentionPatterns` (genel geri dönüş).
- `messages.responsePrefix`.

## İlgili

- [Kanallara Genel Bakış](/tr/channels) — desteklenen tüm kanallar
- [Eşleştirme](/tr/channels/pairing) — DM kimlik doğrulaması ve eşleştirme akışı
- [Gruplar](/tr/channels/groups) — grup sohbeti davranışı ve bahsetme geçidi
- [Kanal Yönlendirme](/tr/channels/channel-routing) — iletiler için oturum yönlendirmesi
- [Güvenlik](/tr/gateway/security) — erişim modeli ve sıkılaştırma
