---
read_when:
    - Signal desteğini ayarlama
    - Signal gönderme/alma işlemlerinde hata ayıklama
summary: signal-cli (JSON-RPC + SSE) aracılığıyla Signal desteği, kurulum yolları ve numara modeli
title: Signal
x-i18n:
    generated_at: "2026-05-06T09:03:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: b0290318ed0cda8f258a96da379b9774418fd888e1b78271a051c98b327a2f45
    source_path: channels/signal.md
    workflow: 16
---

Durum: harici CLI entegrasyonu. Gateway, HTTP JSON-RPC + SSE üzerinden `signal-cli` ile konuşur.

## Ön koşullar

- Sunucunuzda OpenClaw kurulu (aşağıdaki Linux akışı Ubuntu 24 üzerinde test edildi).
- Gateway'in çalıştığı makinede `signal-cli` kullanılabilir.
- Bir doğrulama SMS'i alabilecek bir telefon numarası (SMS kayıt yolu için).
- Kayıt sırasında Signal captcha'sı (`signalcaptchas.org`) için tarayıcı erişimi.

## Hızlı kurulum (başlangıç)

1. Bot için **ayrı bir Signal numarası** kullanın (önerilir).
2. `signal-cli` kurun (JVM derlemesini kullanıyorsanız Java gerekir).
3. Bir kurulum yolu seçin:
   - **Yol A (QR bağlantısı):** `signal-cli link -n "OpenClaw"` ve Signal ile tarayın.
   - **Yol B (SMS kaydı):** captcha + SMS doğrulamasıyla özel bir numara kaydedin.
4. OpenClaw'ı yapılandırın ve Gateway'i yeniden başlatın.
5. İlk DM'i gönderin ve eşleştirmeyi onaylayın (`openclaw pairing approve signal <CODE>`).

Minimum yapılandırma:

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

| Alan        | Açıklama                                          |
| ----------- | ------------------------------------------------- |
| `account`   | E.164 biçiminde bot telefon numarası (`+15551234567`) |
| `cliPath`   | `signal-cli` yolu (`PATH` üzerindeyse `signal-cli`) |
| `dmPolicy`  | DM erişim ilkesi (`pairing` önerilir)             |
| `allowFrom` | DM göndermesine izin verilen telefon numaraları veya `uuid:<id>` değerleri |

## Nedir

- `signal-cli` üzerinden Signal kanalı (gömülü libsignal değil).
- Belirleyici yönlendirme: yanıtlar her zaman Signal'e geri gider.
- DM'ler aracının ana oturumunu paylaşır; gruplar yalıtılmıştır (`agent:<agentId>:signal:group:<groupId>`).

## Yapılandırma yazımları

Varsayılan olarak Signal'in `/config set|unset` tarafından tetiklenen yapılandırma güncellemelerini yazmasına izin verilir (`commands.config: true` gerekir).

Şununla devre dışı bırakın:

```json5
{
  channels: { signal: { configWrites: false } },
}
```

## Numara modeli (önemli)

- Gateway bir **Signal cihazına** (`signal-cli` hesabı) bağlanır.
- Botu **kişisel Signal hesabınızda** çalıştırırsanız kendi mesajlarınızı yok sayar (döngü koruması).
- "Bota mesaj atıyorum ve yanıtlıyor" için **ayrı bir bot numarası** kullanın.

## Kurulum yolu A: mevcut Signal hesabını bağlama (QR)

1. `signal-cli` kurun (JVM veya yerel derleme).
2. Bir bot hesabı bağlayın:
   - `signal-cli link -n "OpenClaw"` ardından QR'ı Signal'de tarayın.
3. Signal'i yapılandırın ve Gateway'i başlatın.

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

## Kurulum yolu B: özel bot numarası kaydetme (SMS, Linux)

Mevcut bir Signal uygulama hesabını bağlamak yerine özel bir bot numarası istediğinizde bunu kullanın.

1. SMS alabilen bir numara edinin (veya sabit hatlar için sesli doğrulama).
   - Hesap/oturum çakışmalarını önlemek için özel bir bot numarası kullanın.
2. Gateway makinesine `signal-cli` kurun:

```bash
VERSION=$(curl -Ls -o /dev/null -w %{url_effective} https://github.com/AsamK/signal-cli/releases/latest | sed -e 's/^.*\/v//')
curl -L -O "https://github.com/AsamK/signal-cli/releases/download/v${VERSION}/signal-cli-${VERSION}-Linux-native.tar.gz"
sudo tar xf "signal-cli-${VERSION}-Linux-native.tar.gz" -C /opt
sudo ln -sf /opt/signal-cli /usr/local/bin/
signal-cli --version
```

JVM derlemesini (`signal-cli-${VERSION}.tar.gz`) kullanıyorsanız önce JRE 25+ kurun.
`signal-cli` güncel tutun; yukarı akış, Signal sunucu API'leri değiştikçe eski sürümlerin bozulabileceğini belirtir.

3. Numarayı kaydedin ve doğrulayın:

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register
```

Captcha gerekiyorsa:

1. `https://signalcaptchas.org/registration/generate.html` adresini açın.
2. Captcha'yı tamamlayın, "Open Signal" öğesinden `signalcaptcha://...` bağlantı hedefini kopyalayın.
3. Mümkün olduğunda tarayıcı oturumuyla aynı harici IP'den çalıştırın.
4. Kaydı hemen tekrar çalıştırın (captcha belirteçleri hızla sona erer):

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register --captcha '<SIGNALCAPTCHA_URL>'
signal-cli -a +<BOT_PHONE_NUMBER> verify <VERIFICATION_CODE>
```

4. OpenClaw'ı yapılandırın, Gateway'i yeniden başlatın, kanalı doğrulayın:

```bash
# If you run the gateway as a user systemd service:
systemctl --user restart openclaw-gateway.service

# Then verify:
openclaw doctor
openclaw channels status --probe
```

5. DM göndericinizi eşleştirin:
   - Bot numarasına herhangi bir mesaj gönderin.
   - Sunucuda kodu onaylayın: `openclaw pairing approve signal <PAIRING_CODE>`.
   - "Bilinmeyen kişi" uyarısını önlemek için bot numarasını telefonunuza kişi olarak kaydedin.

<Warning>
Bir telefon numarası hesabını `signal-cli` ile kaydetmek, o numara için ana Signal uygulama oturumunun yetkisini kaldırabilir. Özel bir bot numarası tercih edin veya mevcut telefon uygulaması kurulumunuzu korumanız gerekiyorsa QR bağlantı modunu kullanın.
</Warning>

Yukarı akış başvuruları:

- `signal-cli` README: `https://github.com/AsamK/signal-cli`
- Captcha akışı: `https://github.com/AsamK/signal-cli/wiki/Registration-with-captcha`
- Bağlama akışı: `https://github.com/AsamK/signal-cli/wiki/Linking-other-devices-(Provisioning)`

## Harici daemon modu (httpUrl)

`signal-cli` öğesini kendiniz yönetmek istiyorsanız (yavaş JVM soğuk başlatmaları, container başlatma veya paylaşılan CPU'lar), daemon'ı ayrı çalıştırın ve OpenClaw'ı ona yönlendirin:

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

Bu, otomatik başlatmayı ve OpenClaw içindeki başlatma beklemesini atlar. Otomatik başlatmada yavaş başlangıçlar için `channels.signal.startupTimeoutMs` ayarlayın.

## Erişim denetimi (DM'ler + gruplar)

DM'ler:

- Varsayılan: `channels.signal.dmPolicy = "pairing"`.
- Bilinmeyen göndericiler bir eşleştirme kodu alır; onaylanana kadar mesajlar yok sayılır (kodların süresi 1 saat sonra dolar).
- Şununla onaylayın:
  - `openclaw pairing list signal`
  - `openclaw pairing approve signal <CODE>`
- Eşleştirme, Signal DM'leri için varsayılan belirteç değişimidir. Ayrıntılar: [Eşleştirme](/tr/channels/pairing)
- UUID'ye özel göndericiler (`sourceUuid` öğesinden), `channels.signal.allowFrom` içinde `uuid:<id>` olarak saklanır.

Gruplar:

- `channels.signal.groupPolicy = open | allowlist | disabled`.
- `channels.signal.groupAllowFrom`, `allowlist` ayarlandığında hangi grupların veya göndericilerin grup yanıtlarını tetikleyebileceğini denetler; girdiler Signal grup kimlikleri (ham, `group:<id>` veya `signal:group:<id>`), gönderici telefon numaraları, `uuid:<id>` değerleri veya `*` olabilir.
- `channels.signal.groups["<group-id>" | "*"]`, `requireMention`, `tools` ve `toolsBySender` ile grup davranışını geçersiz kılabilir.
- Çok hesaplı kurulumlarda hesap başına geçersiz kılmalar için `channels.signal.accounts.<id>.groups` kullanın.
- Bir Signal grubunu `groupAllowFrom` üzerinden izin listesine almak, kendi başına bahsetme kapısını devre dışı bırakmaz. Özel olarak yapılandırılmış bir `channels.signal.groups["<group-id>"]` girdisi, `requireMention=true` ayarlanmadıkça her grup mesajını işler.
- Çalışma zamanı notu: `channels.signal` tamamen eksikse, çalışma zamanı grup denetimleri için `groupPolicy="allowlist"` değerine geri döner (`channels.defaults.groupPolicy` ayarlı olsa bile).

## Nasıl çalışır (davranış)

- `signal-cli` daemon olarak çalışır; Gateway olayları SSE üzerinden okur.
- Gelen mesajlar paylaşılan kanal zarfına normalleştirilir.
- Yanıtlar her zaman aynı numaraya veya gruba geri yönlendirilir.

## Medya + sınırlar

- Giden metin `channels.signal.textChunkLimit` değerine göre parçalara ayrılır (varsayılan 4000).
- İsteğe bağlı yeni satır parçalama: uzunluğa göre parçalamadan önce boş satırlara (paragraf sınırları) göre bölmek için `channels.signal.chunkMode="newline"` ayarlayın.
- Ekler desteklenir (`signal-cli` öğesinden base64 olarak alınır).
- Sesli not ekleri, `contentType` eksik olduğunda MIME yedeği olarak `signal-cli` dosya adını kullanır; böylece ses deşifresi AAC sesli notları yine de sınıflandırabilir.
- Varsayılan medya sınırı: `channels.signal.mediaMaxMb` (varsayılan 8).
- Medya indirmeyi atlamak için `channels.signal.ignoreAttachments` kullanın.
- Grup geçmişi bağlamı `channels.signal.historyLimit` (veya `channels.signal.accounts.*.historyLimit`) kullanır ve `messages.groupChat.historyLimit` değerine geri döner. Devre dışı bırakmak için `0` ayarlayın (varsayılan 50).

## Yazıyor göstergeleri + okundu bilgileri

- **Yazıyor göstergeleri**: OpenClaw, `signal-cli sendTyping` aracılığıyla yazıyor sinyalleri gönderir ve bir yanıt çalışırken bunları yeniler.
- **Okundu bilgileri**: `channels.signal.sendReadReceipts` true olduğunda, OpenClaw izin verilen DM'ler için okundu bilgilerini iletir.
- Signal-cli gruplar için okundu bilgilerini açığa çıkarmaz.

## Tepkiler (mesaj aracı)

- `channel=signal` ile `message action=react` kullanın.
- Hedefler: gönderen E.164 veya UUID (eşleştirme çıktısından `uuid:<id>` kullanın; çıplak UUID de çalışır).
- `messageId`, tepki verdiğiniz mesajın Signal zaman damgasıdır.
- Grup tepkileri `targetAuthor` veya `targetAuthorUuid` gerektirir.

Örnekler:

```
message action=react channel=signal target=uuid:123e4567-e89b-12d3-a456-426614174000 messageId=1737630212345 emoji=🔥
message action=react channel=signal target=+15551234567 messageId=1737630212345 emoji=🔥 remove=true
message action=react channel=signal target=signal:group:<groupId> targetAuthor=uuid:<sender-uuid> messageId=1737630212345 emoji=✅
```

Yapılandırma:

- `channels.signal.actions.reactions`: tepki eylemlerini etkinleştir/devre dışı bırak (varsayılan true).
- `channels.signal.reactionLevel`: `off | ack | minimal | extensive`.
  - `off`/`ack` aracı tepkilerini devre dışı bırakır (mesaj aracı `react` hata verir).
  - `minimal`/`extensive` aracı tepkilerini etkinleştirir ve yönlendirme düzeyini ayarlar.
- Hesap başına geçersiz kılmalar: `channels.signal.accounts.<id>.actions.reactions`, `channels.signal.accounts.<id>.reactionLevel`.

## Teslimat hedefleri (CLI/cron)

- DM'ler: `signal:+15551234567` (veya düz E.164).
- UUID DM'leri: `uuid:<id>` (veya çıplak UUID).
- Gruplar: `signal:group:<groupId>`.
- Kullanıcı adları: `username:<name>` (Signal hesabınız tarafından destekleniyorsa).

## Sorun giderme

Önce şu merdiveni çalıştırın:

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
- Grup mesajları yok sayılıyor: grup göndereni/bahsetme kapısı teslimatı engelliyor.
- Düzenlemelerden sonra yapılandırma doğrulama hataları: `openclaw doctor --fix` çalıştırın.
- Tanılarda Signal eksik: `channels.signal.enabled: true` değerini doğrulayın.

Ek denetimler:

```bash
openclaw pairing list signal
pgrep -af signal-cli
grep -i "signal" "/tmp/openclaw/openclaw-$(date +%Y-%m-%d).log" | tail -20
```

Triyaj akışı için: [/channels/troubleshooting](/tr/channels/troubleshooting).

## Güvenlik notları

- `signal-cli` hesap anahtarlarını yerel olarak saklar (genellikle `~/.local/share/signal-cli/data/`).
- Sunucu taşıma veya yeniden oluşturma öncesinde Signal hesap durumunu yedekleyin.
- Daha geniş DM erişimini açıkça istemediğiniz sürece `channels.signal.dmPolicy: "pairing"` değerini koruyun.
- SMS doğrulaması yalnızca kayıt veya kurtarma akışları için gerekir, ancak numara/hesap üzerindeki denetimi kaybetmek yeniden kaydı karmaşıklaştırabilir.

## Yapılandırma başvurusu (Signal)

Tam yapılandırma: [Yapılandırma](/tr/gateway/configuration)

Sağlayıcı seçenekleri:

- `channels.signal.enabled`: kanal başlatmayı etkinleştir/devre dışı bırak.
- `channels.signal.account`: bot hesabı için E.164.
- `channels.signal.cliPath`: `signal-cli` yolu.
- `channels.signal.httpUrl`: tam daemon URL'si (host/port değerlerini geçersiz kılar).
- `channels.signal.httpHost`, `channels.signal.httpPort`: daemon bağlama adresi (varsayılan 127.0.0.1:8080).
- `channels.signal.autoStart`: daemon'ı otomatik başlat (varsayılan, `httpUrl` ayarlanmamışsa true).
- `channels.signal.startupTimeoutMs`: ms cinsinden başlatma bekleme zaman aşımı (üst sınır 120000).
- `channels.signal.receiveMode`: `on-start | manual`.
- `channels.signal.ignoreAttachments`: ek indirmelerini atla.
- `channels.signal.ignoreStories`: daemon'dan gelen hikayeleri yok say.
- `channels.signal.sendReadReceipts`: okundu bilgilerini ilet.
- `channels.signal.dmPolicy`: `pairing | allowlist | open | disabled` (varsayılan: pairing).
- `channels.signal.allowFrom`: DM izin listesi (E.164 veya `uuid:<id>`). `open`, `"*"` gerektirir. Signal kullanıcı adlarını desteklemez; telefon/UUID kimlikleri kullanın.
- `channels.signal.groupPolicy`: `open | allowlist | disabled` (varsayılan: allowlist).
- `channels.signal.groupAllowFrom`: grup izin listesi; Signal grup kimliklerini (ham, `group:<id>` veya `signal:group:<id>`), gönderen E.164 numaralarını ya da `uuid:<id>` değerlerini kabul eder.
- `channels.signal.groups`: Signal grup kimliğine (veya `"*"`) göre anahtarlanan grup başına geçersiz kılmalar. Desteklenen alanlar: `requireMention`, `tools`, `toolsBySender`.
- `channels.signal.accounts.<id>.groups`: çok hesaplı kurulumlar için `channels.signal.groups` ayarının hesap başına sürümü.
- `channels.signal.historyLimit`: bağlam olarak eklenecek en fazla grup mesajı sayısı (0 devre dışı bırakır).
- `channels.signal.dmHistoryLimit`: kullanıcı turları cinsinden DM geçmiş sınırı. Kullanıcı başına geçersiz kılmalar: `channels.signal.dms["<phone_or_uuid>"].historyLimit`.
- `channels.signal.textChunkLimit`: giden parça boyutu (karakter).
- `channels.signal.chunkMode`: uzunluğa göre parçalamadan önce boş satırlardan (paragraf sınırları) bölmek için `length` (varsayılan) veya `newline`.
- `channels.signal.mediaMaxMb`: gelen/giden medya üst sınırı (MB).

İlgili global seçenekler:

- `agents.list[].groupChat.mentionPatterns` (Signal yerel bahsetmeleri desteklemez).
- `messages.groupChat.mentionPatterns` (global yedek).
- `messages.responsePrefix`.

## İlgili

- [Kanallara Genel Bakış](/tr/channels) — desteklenen tüm kanallar
- [Eşleştirme](/tr/channels/pairing) — DM kimlik doğrulaması ve eşleştirme akışı
- [Gruplar](/tr/channels/groups) — grup sohbeti davranışı ve bahsetme kapısı
- [Kanal Yönlendirme](/tr/channels/channel-routing) — mesajlar için oturum yönlendirmesi
- [Güvenlik](/tr/gateway/security) — erişim modeli ve sağlamlaştırma
