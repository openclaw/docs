---
read_when:
    - Signal desteğini ayarlama
    - Signal gönderme/alma işleminde hata ayıklama
summary: signal-cli aracılığıyla Signal desteği (JSON-RPC + SSE), kurulum yolları ve numara modeli
title: Signal
x-i18n:
    generated_at: "2026-04-30T09:08:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: d450454550a86cbf0e2b7231bb149f78275a756517db1f20d7a07e3d298febee
    source_path: channels/signal.md
    workflow: 16
---

Durum: harici CLI entegrasyonu. Gateway, HTTP JSON-RPC + SSE üzerinden `signal-cli` ile konuşur.

## Ön koşullar

- Sunucunuzda OpenClaw kurulu olmalı (aşağıdaki Linux akışı Ubuntu 24 üzerinde test edildi).
- Gateway'in çalıştığı ana makinede `signal-cli` kullanılabilir olmalı.
- Bir doğrulama SMS'i alabilecek bir telefon numarası (SMS kayıt yolu için).
- Kayıt sırasında Signal captcha (`signalcaptchas.org`) için tarayıcı erişimi.

## Hızlı kurulum (başlangıç)

1. Bot için **ayrı bir Signal numarası** kullanın (önerilir).
2. `signal-cli` yükleyin (JVM derlemesini kullanıyorsanız Java gerekir).
3. Bir kurulum yolu seçin:
   - **Yol A (QR bağlantısı):** `signal-cli link -n "OpenClaw"` ve Signal ile tarayın.
   - **Yol B (SMS kaydı):** captcha + SMS doğrulamasıyla özel bir numara kaydedin.
4. OpenClaw'ı yapılandırın ve Gateway'i yeniden başlatın.
5. İlk DM'i gönderin ve eşleştirmeyi onaylayın (`openclaw pairing approve signal <CODE>`).

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

| Alan        | Açıklama                                                        |
| ----------- | --------------------------------------------------------------- |
| `account`   | E.164 biçiminde bot telefon numarası (`+15551234567`)           |
| `cliPath`   | `signal-cli` yolu (`PATH` üzerindeyse `signal-cli`)             |
| `dmPolicy`  | DM erişim ilkesi (`pairing` önerilir)                           |
| `allowFrom` | DM göndermesine izin verilen telefon numaraları veya `uuid:<id>` değerleri |

## Nedir

- `signal-cli` üzerinden Signal kanalı (gömülü libsignal değil).
- Belirleyici yönlendirme: yanıtlar her zaman Signal'e geri gider.
- DM'ler aracının ana oturumunu paylaşır; gruplar yalıtılmıştır (`agent:<agentId>:signal:group:<groupId>`).

## Yapılandırma yazımları

Varsayılan olarak Signal, `/config set|unset` tarafından tetiklenen yapılandırma güncellemelerini yazabilir (`commands.config: true` gerektirir).

Şununla devre dışı bırakın:

```json5
{
  channels: { signal: { configWrites: false } },
}
```

## Numara modeli (önemli)

- Gateway bir **Signal cihazına** bağlanır (`signal-cli` hesabı).
- Botu **kişisel Signal hesabınızda** çalıştırırsanız kendi mesajlarınızı yok sayar (döngü koruması).
- "Ben bota mesaj atayım ve yanıt versin" için **ayrı bir bot numarası** kullanın.

## Kurulum yolu A: mevcut Signal hesabını bağlama (QR)

1. `signal-cli` yükleyin (JVM veya yerel derleme).
2. Bir bot hesabı bağlayın:
   - `signal-cli link -n "OpenClaw"` ardından Signal'de QR'ı tarayın.
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
2. Gateway ana makinesine `signal-cli` yükleyin:

```bash
VERSION=$(curl -Ls -o /dev/null -w %{url_effective} https://github.com/AsamK/signal-cli/releases/latest | sed -e 's/^.*\/v//')
curl -L -O "https://github.com/AsamK/signal-cli/releases/download/v${VERSION}/signal-cli-${VERSION}-Linux-native.tar.gz"
sudo tar xf "signal-cli-${VERSION}-Linux-native.tar.gz" -C /opt
sudo ln -sf /opt/signal-cli /usr/local/bin/
signal-cli --version
```

JVM derlemesini (`signal-cli-${VERSION}.tar.gz`) kullanıyorsanız önce JRE 25+ yükleyin.
`signal-cli` güncel tutun; upstream, eski sürümlerin Signal sunucu API'leri değiştikçe bozulabileceğini belirtir.

3. Numarayı kaydedin ve doğrulayın:

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register
```

Captcha gerekiyorsa:

1. `https://signalcaptchas.org/registration/generate.html` sayfasını açın.
2. Captcha'yı tamamlayın, "Open Signal" içinden `signalcaptcha://...` bağlantı hedefini kopyalayın.
3. Mümkün olduğunda tarayıcı oturumuyla aynı harici IP'den çalıştırın.
4. Kaydı hemen yeniden çalıştırın (captcha token'larının süresi hızla dolar):

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register --captcha '<SIGNALCAPTCHA_URL>'
signal-cli -a +<BOT_PHONE_NUMBER> verify <VERIFICATION_CODE>
```

4. OpenClaw'ı yapılandırın, Gateway'i yeniden başlatın, kanalı doğrulayın:

```bash
# Gateway'i bir kullanıcı systemd hizmeti olarak çalıştırıyorsanız:
systemctl --user restart openclaw-gateway.service

# Ardından doğrulayın:
openclaw doctor
openclaw channels status --probe
```

5. DM göndereninizi eşleştirin:
   - Bot numarasına herhangi bir mesaj gönderin.
   - Sunucuda kodu onaylayın: `openclaw pairing approve signal <PAIRING_CODE>`.
   - "Bilinmeyen kişi" durumunu önlemek için bot numarasını telefonunuzda kişi olarak kaydedin.

<Warning>
Bir telefon numarası hesabını `signal-cli` ile kaydetmek, o numara için ana Signal uygulama oturumunun yetkisini kaldırabilir. Özel bir bot numarası tercih edin veya mevcut telefon uygulaması kurulumunuzu korumanız gerekiyorsa QR bağlantı modunu kullanın.
</Warning>

Upstream başvuruları:

- `signal-cli` README: `https://github.com/AsamK/signal-cli`
- Captcha akışı: `https://github.com/AsamK/signal-cli/wiki/Registration-with-captcha`
- Bağlama akışı: `https://github.com/AsamK/signal-cli/wiki/Linking-other-devices-(Provisioning)`

## Harici daemon modu (httpUrl)

`signal-cli` yönetimini kendiniz yapmak istiyorsanız (yavaş JVM soğuk başlatmaları, container init veya paylaşılan CPU'lar), daemon'ı ayrı çalıştırın ve OpenClaw'ı ona yönlendirin:

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

## Erişim denetimi (DM'ler + gruplar)

DM'ler:

- Varsayılan: `channels.signal.dmPolicy = "pairing"`.
- Bilinmeyen gönderenler bir eşleştirme kodu alır; onaylanana kadar mesajlar yok sayılır (kodların süresi 1 saat sonra dolar).
- Şununla onaylayın:
  - `openclaw pairing list signal`
  - `openclaw pairing approve signal <CODE>`
- Eşleştirme, Signal DM'leri için varsayılan token değişimidir. Ayrıntılar: [Eşleştirme](/tr/channels/pairing)
- Yalnızca UUID gönderenler (`sourceUuid` üzerinden) `channels.signal.allowFrom` içinde `uuid:<id>` olarak saklanır.

Gruplar:

- `channels.signal.groupPolicy = open | allowlist | disabled`.
- `channels.signal.groupAllowFrom`, `allowlist` ayarlandığında gruplarda kimin tetikleyebileceğini denetler.
- `channels.signal.groups["<group-id>" | "*"]`, `requireMention`, `tools` ve `toolsBySender` ile grup davranışını geçersiz kılabilir.
- Çok hesaplı kurulumlarda hesap başına geçersiz kılmalar için `channels.signal.accounts.<id>.groups` kullanın.
- Çalışma zamanı notu: `channels.signal` tamamen eksikse çalışma zamanı, grup kontrolleri için `groupPolicy="allowlist"` değerine geri döner (`channels.defaults.groupPolicy` ayarlanmış olsa bile).

## Nasıl çalışır (davranış)

- `signal-cli` daemon olarak çalışır; Gateway olayları SSE üzerinden okur.
- Gelen mesajlar paylaşılan kanal zarfına normalleştirilir.
- Yanıtlar her zaman aynı numaraya veya gruba geri yönlendirilir.

## Medya + sınırlar

- Giden metin `channels.signal.textChunkLimit` değerine göre parçalara ayrılır (varsayılan 4000).
- İsteğe bağlı yeni satır parçalama: uzunluğa göre parçalamadan önce boş satırlarda (paragraf sınırlarında) bölmek için `channels.signal.chunkMode="newline"` ayarlayın.
- Ekler desteklenir (`signal-cli` üzerinden base64 olarak alınır).
- Sesli not ekleri, `contentType` eksik olduğunda MIME yedeği olarak `signal-cli` dosya adını kullanır; böylece ses transkripsiyonu AAC sesli notlarını yine de sınıflandırabilir.
- Varsayılan medya sınırı: `channels.signal.mediaMaxMb` (varsayılan 8).
- Medya indirmeyi atlamak için `channels.signal.ignoreAttachments` kullanın.
- Grup geçmişi bağlamı `channels.signal.historyLimit` (veya `channels.signal.accounts.*.historyLimit`) kullanır, yoksa `messages.groupChat.historyLimit` değerine geri döner. Devre dışı bırakmak için `0` ayarlayın (varsayılan 50).

## Yazıyor + okundu bilgileri

- **Yazıyor göstergeleri**: OpenClaw, `signal-cli sendTyping` üzerinden yazıyor sinyalleri gönderir ve bir yanıt çalışırken bunları yeniler.
- **Okundu bilgileri**: `channels.signal.sendReadReceipts` true olduğunda OpenClaw, izin verilen DM'ler için okundu bilgilerini iletir.
- Signal-cli gruplar için okundu bilgilerini dışa açmaz.

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

## Teslim hedefleri (CLI/Cron)

- DM'ler: `signal:+15551234567` (veya düz E.164).
- UUID DM'leri: `uuid:<id>` (veya çıplak UUID).
- Gruplar: `signal:group:<groupId>`.
- Kullanıcı adları: `username:<name>` (Signal hesabınız destekliyorsa).

## Sorun giderme

Önce bu merdiveni çalıştırın:

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
- Grup mesajları yok sayılıyor: grup göndereni/bahsetme kapıları teslimi engelliyor.
- Düzenlemelerden sonra yapılandırma doğrulama hataları: `openclaw doctor --fix` çalıştırın.
- Tanılamada Signal eksik: `channels.signal.enabled: true` olduğunu doğrulayın.

Ek kontroller:

```bash
openclaw pairing list signal
pgrep -af signal-cli
grep -i "signal" "/tmp/openclaw/openclaw-$(date +%Y-%m-%d).log" | tail -20
```

Triyaj akışı için: [/channels/troubleshooting](/tr/channels/troubleshooting).

## Güvenlik notları

- `signal-cli` hesap anahtarlarını yerel olarak saklar (genellikle `~/.local/share/signal-cli/data/`).
- Sunucu taşıması veya yeniden oluşturma öncesinde Signal hesap durumunu yedekleyin.
- Daha geniş DM erişimini açıkça istemiyorsanız `channels.signal.dmPolicy: "pairing"` değerini koruyun.
- SMS doğrulaması yalnızca kayıt veya kurtarma akışları için gerekir, ancak numaranın/hesabın denetimini kaybetmek yeniden kaydı zorlaştırabilir.

## Yapılandırma başvurusu (Signal)

Tam yapılandırma: [Yapılandırma](/tr/gateway/configuration)

Sağlayıcı seçenekleri:

- `channels.signal.enabled`: kanal başlatmayı etkinleştir/devre dışı bırak.
- `channels.signal.account`: bot hesabı için E.164.
- `channels.signal.cliPath`: `signal-cli` yolu.
- `channels.signal.httpUrl`: tam daemon URL'si (host/port değerlerini geçersiz kılar).
- `channels.signal.httpHost`, `channels.signal.httpPort`: daemon bağlama adresi (varsayılan 127.0.0.1:8080).
- `channels.signal.autoStart`: daemon'ı otomatik başlat (varsayılan, `httpUrl` ayarlanmamışsa true).
- `channels.signal.startupTimeoutMs`: başlangıç bekleme zaman aşımı, ms cinsinden (üst sınır 120000).
- `channels.signal.receiveMode`: `on-start | manual`.
- `channels.signal.ignoreAttachments`: ek indirmelerini atla.
- `channels.signal.ignoreStories`: daemon'dan gelen hikayeleri yok say.
- `channels.signal.sendReadReceipts`: okundu bilgilerini ilet.
- `channels.signal.dmPolicy`: `pairing | allowlist | open | disabled` (varsayılan: pairing).
- `channels.signal.allowFrom`: DM izin listesi (E.164 veya `uuid:<id>`). `open`, `"*"` gerektirir. Signal'de kullanıcı adları yoktur; telefon/UUID kimliklerini kullanın.
- `channels.signal.groupPolicy`: `open | allowlist | disabled` (varsayılan: allowlist).
- `channels.signal.groupAllowFrom`: grup göndereni izin listesi.
- `channels.signal.groups`: Signal grup kimliğine (veya `"*"`) göre anahtarlanan grup başına geçersiz kılmalar. Desteklenen alanlar: `requireMention`, `tools`, `toolsBySender`.
- `channels.signal.accounts.<id>.groups`: çok hesaplı kurulumlar için `channels.signal.groups` değerinin hesap başına sürümü.
- `channels.signal.historyLimit`: bağlam olarak eklenecek en fazla grup mesajı sayısı (0 devre dışı bırakır).
- `channels.signal.dmHistoryLimit`: kullanıcı dönüşleri cinsinden DM geçmişi sınırı. Kullanıcı başına geçersiz kılmalar: `channels.signal.dms["<phone_or_uuid>"].historyLimit`.
- `channels.signal.textChunkLimit`: giden parça boyutu (karakter).
- `channels.signal.chunkMode`: uzunluğa göre parçalamadan önce boş satırlardan (paragraf sınırları) bölmek için `length` (varsayılan) veya `newline`.
- `channels.signal.mediaMaxMb`: gelen/giden medya sınırı (MB).

İlgili genel seçenekler:

- `agents.list[].groupChat.mentionPatterns` (Signal yerel mention desteği sunmaz).
- `messages.groupChat.mentionPatterns` (genel yedek).
- `messages.responsePrefix`.

## İlgili

- [Kanallara Genel Bakış](/tr/channels) — desteklenen tüm kanallar
- [Eşleştirme](/tr/channels/pairing) — DM kimlik doğrulaması ve eşleştirme akışı
- [Gruplar](/tr/channels/groups) — grup sohbeti davranışı ve mention geçidi
- [Kanal Yönlendirme](/tr/channels/channel-routing) — mesajlar için oturum yönlendirmesi
- [Güvenlik](/tr/gateway/security) — erişim modeli ve sağlamlaştırma
