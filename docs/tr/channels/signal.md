---
read_when:
    - Signal desteğini ayarlama
    - Signal gönderme/alma hata ayıklama
summary: '`signal-cli` (JSON-RPC + SSE) üzerinden Signal desteği, kurulum yolları ve numara modeli'
title: Signal
x-i18n:
    generated_at: "2026-04-24T08:59:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8fb4f08f8607dbe923fdc24d9599623165e1f1268c7fc48ecb457ce3d61172d2
    source_path: channels/signal.md
    workflow: 15
---

# Signal (`signal-cli`)

Durum: harici CLI entegrasyonu. Gateway, `signal-cli` ile HTTP JSON-RPC + SSE üzerinden konuşur.

## Önkoşullar

- Sunucunuza OpenClaw kurulmuş olmalı (aşağıdaki Linux akışı Ubuntu 24 üzerinde test edilmiştir).
- Gateway'in çalıştığı host üzerinde `signal-cli` kullanılabilir olmalı.
- Bir doğrulama SMS'i alabilecek bir telefon numarası (SMS kayıt yolu için).
- Kayıt sırasında Signal captcha için tarayıcı erişimi (`signalcaptchas.org`).

## Hızlı kurulum (başlangıç)

1. Bot için **ayrı bir Signal numarası** kullanın (önerilir).
2. `signal-cli` kurun (`JVM` derlemesini kullanıyorsanız Java gerekir).
3. Bir kurulum yolu seçin:
   - **Yol A (QR bağlantısı):** `signal-cli link -n "OpenClaw"` ve Signal ile tarayın.
   - **Yol B (SMS ile kayıt):** captcha + SMS doğrulamasıyla özel bir numara kaydedin.
4. OpenClaw'ı yapılandırın ve Gateway'i yeniden başlatın.
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

| Alan        | Açıklama                                         |
| ----------- | ------------------------------------------------ |
| `account`   | E.164 biçiminde bot telefon numarası (`+15551234567`) |
| `cliPath`   | `signal-cli` yolu (`PATH` üzerindeyse `signal-cli`) |
| `dmPolicy`  | DM erişim ilkesi (`pairing` önerilir)            |
| `allowFrom` | DM göndermesine izin verilen telefon numaraları veya `uuid:<id>` değerleri |

## Nedir

- `signal-cli` üzerinden Signal kanalıdır (gömülü libsignal değil).
- Deterministik yönlendirme: yanıtlar her zaman Signal'e geri gider.
- DM'ler agent'in ana oturumunu paylaşır; gruplar yalıtılmıştır (`agent:<agentId>:signal:group:<groupId>`).

## Yapılandırma yazımları

Varsayılan olarak Signal'in, `/config set|unset` tarafından tetiklenen yapılandırma güncellemelerini yazmasına izin verilir (`commands.config: true` gerektirir).

Şununla devre dışı bırakın:

```json5
{
  channels: { signal: { configWrites: false } },
}
```

## Numara modeli (önemli)

- Gateway bir **Signal cihazına** bağlanır (`signal-cli` hesabı).
- Botu **kişisel Signal hesabınızda** çalıştırırsanız, kendi mesajlarınızı yok sayar (döngü koruması).
- "Ben bota mesaj atayım, o da yanıtlasın" istiyorsanız **ayrı bir bot numarası** kullanın.

## Kurulum yolu A: mevcut Signal hesabını bağlama (QR)

1. `signal-cli` kurun (`JVM` veya yerel derleme).
2. Bir bot hesabı bağlayın:
   - `signal-cli link -n "OpenClaw"` çalıştırın, ardından QR kodunu Signal ile tarayın.
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

Çoklu hesap desteği: hesap başına yapılandırma ve isteğe bağlı `name` için `channels.signal.accounts` kullanın. Paylaşılan desen için [`gateway/configuration`](/tr/gateway/config-channels#multi-account-all-channels) sayfasına bakın.

## Kurulum yolu B: özel bot numarası kaydetme (SMS, Linux)

Bunu, mevcut bir Signal uygulaması hesabını bağlamak yerine özel bir bot numarası istediğinizde kullanın.

1. SMS alabilen bir numara edinin (veya sabit hatlar için sesli doğrulama).
   - Hesap/oturum çakışmalarını önlemek için özel bir bot numarası kullanın.
2. Gateway host'una `signal-cli` kurun:

```bash
VERSION=$(curl -Ls -o /dev/null -w %{url_effective} https://github.com/AsamK/signal-cli/releases/latest | sed -e 's/^.*\/v//')
curl -L -O "https://github.com/AsamK/signal-cli/releases/download/v${VERSION}/signal-cli-${VERSION}-Linux-native.tar.gz"
sudo tar xf "signal-cli-${VERSION}-Linux-native.tar.gz" -C /opt
sudo ln -sf /opt/signal-cli /usr/local/bin/
signal-cli --version
```

`JVM` derlemesini (`signal-cli-${VERSION}.tar.gz`) kullanıyorsanız önce JRE 25+ kurun.
`signal-cli`'yi güncel tutun; upstream, Signal sunucu API'leri değiştikçe eski sürümlerin bozulabileceğini belirtir.

3. Numarayı kaydedin ve doğrulayın:

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register
```

Captcha gerekiyorsa:

1. `https://signalcaptchas.org/registration/generate.html` adresini açın.
2. Captcha'yı tamamlayın, "Open Signal" içindeki `signalcaptcha://...` bağlantı hedefini kopyalayın.
3. Mümkünse tarayıcı oturumuyla aynı dış IP'den çalıştırın.
4. Kaydı hemen yeniden çalıştırın (captcha token'ları hızlıca sona erer):

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register --captcha '<SIGNALCAPTCHA_URL>'
signal-cli -a +<BOT_PHONE_NUMBER> verify <VERIFICATION_CODE>
```

4. OpenClaw'ı yapılandırın, Gateway'i yeniden başlatın, kanalı doğrulayın:

```bash
# Gateway'i bir kullanıcı systemd servisi olarak çalıştırıyorsanız:
systemctl --user restart openclaw-gateway.service

# Ardından doğrulayın:
openclaw doctor
openclaw channels status --probe
```

5. DM göndereninizi eşleştirin:
   - Bot numarasına herhangi bir mesaj gönderin.
   - Sunucuda kodu onaylayın: `openclaw pairing approve signal <PAIRING_CODE>`.
   - "Bilinmeyen kişi" uyarısını önlemek için bot numarasını telefonunuza kişi olarak kaydedin.

Önemli: Bir telefon numarası hesabını `signal-cli` ile kaydetmek, o numara için ana Signal uygulaması oturumunun yetkisini kaldırabilir. Ayrı bir bot numarasını tercih edin veya mevcut telefon uygulaması kurulumunuzu korumanız gerekiyorsa QR bağlantı modunu kullanın.

Upstream başvuruları:

- `signal-cli` README: `https://github.com/AsamK/signal-cli`
- Captcha akışı: `https://github.com/AsamK/signal-cli/wiki/Registration-with-captcha`
- Bağlama akışı: `https://github.com/AsamK/signal-cli/wiki/Linking-other-devices-(Provisioning)`

## Harici daemon modu (`httpUrl`)

`signal-cli`'yi kendiniz yönetmek istiyorsanız (yavaş `JVM` cold start, container init veya paylaşılan CPU'lar), daemon'u ayrı çalıştırın ve OpenClaw'ı ona yönlendirin:

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
- Bilinmeyen gönderenler bir eşleştirme kodu alır; onaylanana kadar mesajlar yok sayılır (kodlar 1 saat sonra sona erer).
- Şununla onaylayın:
  - `openclaw pairing list signal`
  - `openclaw pairing approve signal <CODE>`
- Eşleştirme, Signal DM'leri için varsayılan token değişimidir. Ayrıntılar: [Pairing](/tr/channels/pairing)
- Yalnızca UUID gönderenleri (`sourceUuid` üzerinden), `channels.signal.allowFrom` içinde `uuid:<id>` olarak saklanır.

Gruplar:

- `channels.signal.groupPolicy = open | allowlist | disabled`.
- `channels.signal.groupAllowFrom`, `allowlist` ayarlı olduğunda gruplarda kimlerin tetikleme yapabileceğini denetler.
- `channels.signal.groups["<group-id>" | "*"]`, grup davranışını `requireMention`, `tools` ve `toolsBySender` ile geçersiz kılabilir.
- Çoklu hesap kurulumlarında hesap başına geçersiz kılmalar için `channels.signal.accounts.<id>.groups` kullanın.
- Çalışma zamanı notu: `channels.signal` tamamen yoksa, çalışma zamanı grup denetimleri için `groupPolicy="allowlist"` değerine geri döner (`channels.defaults.groupPolicy` ayarlı olsa bile).

## Nasıl çalışır (davranış)

- `signal-cli` bir daemon olarak çalışır; Gateway olayları SSE üzerinden okur.
- Gelen mesajlar, paylaşılan kanal zarfına normalize edilir.
- Yanıtlar her zaman aynı numaraya veya gruba yönlendirilir.

## Medya + sınırlar

- Giden metin, `channels.signal.textChunkLimit` değerine göre bölünür (varsayılan 4000).
- İsteğe bağlı yeni satırla bölme: uzunluk bölmeden önce boş satırlarda (paragraf sınırları) bölmek için `channels.signal.chunkMode="newline"` ayarlayın.
- Ekler desteklenir (`signal-cli` üzerinden alınan base64).
- Varsayılan medya üst sınırı: `channels.signal.mediaMaxMb` (varsayılan 8).
- Medya indirmeyi atlamak için `channels.signal.ignoreAttachments` kullanın.
- Grup geçmişi bağlamı `channels.signal.historyLimit` (veya `channels.signal.accounts.*.historyLimit`) kullanır; yoksa `messages.groupChat.historyLimit` değerine geri düşer. Devre dışı bırakmak için `0` ayarlayın (varsayılan 50).

## Yazıyor göstergeleri + okundu bilgileri

- **Yazıyor göstergeleri**: OpenClaw, `signal-cli sendTyping` üzerinden yazıyor sinyalleri gönderir ve bir yanıt çalışırken bunları yeniler.
- **Okundu bilgileri**: `channels.signal.sendReadReceipts` true olduğunda, OpenClaw izin verilen DM'ler için okundu bilgilerini iletir.
- `signal-cli`, gruplar için okundu bilgilerini göstermez.

## Tepkiler (mesaj aracı)

- `channel=signal` ile `message action=react` kullanın.
- Hedefler: gönderen E.164 veya UUID (`pairing` çıktısından `uuid:<id>` kullanın; çıplak UUID de çalışır).
- `messageId`, tepki verdiğiniz mesajın Signal zaman damgasıdır.
- Grup tepkileri için `targetAuthor` veya `targetAuthorUuid` gerekir.

Örnekler:

```
message action=react channel=signal target=uuid:123e4567-e89b-12d3-a456-426614174000 messageId=1737630212345 emoji=🔥
message action=react channel=signal target=+15551234567 messageId=1737630212345 emoji=🔥 remove=true
message action=react channel=signal target=signal:group:<groupId> targetAuthor=uuid:<sender-uuid> messageId=1737630212345 emoji=✅
```

Yapılandırma:

- `channels.signal.actions.reactions`: tepki eylemlerini etkinleştir/devre dışı bırak (varsayılan true).
- `channels.signal.reactionLevel`: `off | ack | minimal | extensive`.
  - `off`/`ack`, agent tepkilerini devre dışı bırakır (`react` mesaj aracı hata verir).
  - `minimal`/`extensive`, agent tepkilerini etkinleştirir ve yönlendirme düzeyini ayarlar.
- Hesap başına geçersiz kılmalar: `channels.signal.accounts.<id>.actions.reactions`, `channels.signal.accounts.<id>.reactionLevel`.

## Teslim hedefleri (CLI/Cron)

- DM'ler: `signal:+15551234567` (veya düz E.164).
- UUID DM'leri: `uuid:<id>` (veya çıplak UUID).
- Gruplar: `signal:group:<groupId>`.
- Kullanıcı adları: `username:<name>` (Signal hesabınız destekliyorsa).

## Sorun giderme

Önce şu sırayı çalıştırın:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Gerekiyorsa ardından DM eşleştirme durumunu doğrulayın:

```bash
openclaw pairing list signal
```

Yaygın hatalar:

- Daemon erişilebilir ama yanıt yok: hesap/daemon ayarlarını (`httpUrl`, `account`) ve alma modunu doğrulayın.
- DM'ler yok sayılıyor: gönderen eşleştirme onayı bekliyor.
- Grup mesajları yok sayılıyor: grup göndereni/bahsetme geçitlemesi teslimi engelliyor.
- Düzenlemelerden sonra yapılandırma doğrulama hataları: `openclaw doctor --fix` çalıştırın.
- Signal tanılamalarda görünmüyor: `channels.signal.enabled: true` değerini doğrulayın.

Ek denetimler:

```bash
openclaw pairing list signal
pgrep -af signal-cli
grep -i "signal" "/tmp/openclaw/openclaw-$(date +%Y-%m-%d).log" | tail -20
```

Triage akışı için: [/channels/troubleshooting](/tr/channels/troubleshooting).

## Güvenlik notları

- `signal-cli`, hesap anahtarlarını yerel olarak depolar (genellikle `~/.local/share/signal-cli/data/`).
- Sunucu taşıma veya yeniden kurma öncesinde Signal hesap durumunu yedekleyin.
- Açıkça daha geniş DM erişimi istemiyorsanız `channels.signal.dmPolicy: "pairing"` kullanmaya devam edin.
- SMS doğrulaması yalnızca kayıt veya kurtarma akışları için gereklidir, ancak numara/hesap denetiminin kaybedilmesi yeniden kayıt sürecini zorlaştırabilir.

## Yapılandırma başvurusu (Signal)

Tam yapılandırma: [Configuration](/tr/gateway/configuration)

Sağlayıcı seçenekleri:

- `channels.signal.enabled`: kanal başlangıcını etkinleştir/devre dışı bırak.
- `channels.signal.account`: bot hesabı için E.164.
- `channels.signal.cliPath`: `signal-cli` yolu.
- `channels.signal.httpUrl`: tam daemon URL'si (host/port'u geçersiz kılar).
- `channels.signal.httpHost`, `channels.signal.httpPort`: daemon bağlama adresi (varsayılan 127.0.0.1:8080).
- `channels.signal.autoStart`: daemon'u otomatik başlat (varsayılan: `httpUrl` ayarlı değilse true).
- `channels.signal.startupTimeoutMs`: ms cinsinden başlangıç bekleme zaman aşımı (üst sınır 120000).
- `channels.signal.receiveMode`: `on-start | manual`.
- `channels.signal.ignoreAttachments`: ek indirmelerini atla.
- `channels.signal.ignoreStories`: daemon'dan gelen hikayeleri yok say.
- `channels.signal.sendReadReceipts`: okundu bilgilerini ilet.
- `channels.signal.dmPolicy`: `pairing | allowlist | open | disabled` (varsayılan: pairing).
- `channels.signal.allowFrom`: DM izin listesi (E.164 veya `uuid:<id>`). `open` için `"*"` gerekir. Signal'de kullanıcı adı yoktur; telefon/UUID kimlikleri kullanın.
- `channels.signal.groupPolicy`: `open | allowlist | disabled` (varsayılan: allowlist).
- `channels.signal.groupAllowFrom`: grup göndereni izin listesi.
- `channels.signal.groups`: Signal grup kimliğine (veya `"*"`) göre anahtarlanan grup başına geçersiz kılmalar. Desteklenen alanlar: `requireMention`, `tools`, `toolsBySender`.
- `channels.signal.accounts.<id>.groups`: çoklu hesap kurulumları için `channels.signal.groups` alanının hesap başına sürümü.
- `channels.signal.historyLimit`: bağlam olarak dahil edilecek maksimum grup mesajı sayısı (`0` devre dışı bırakır).
- `channels.signal.dmHistoryLimit`: kullanıcı turu cinsinden DM geçmişi sınırı. Kullanıcı başına geçersiz kılmalar: `channels.signal.dms["<phone_or_uuid>"].historyLimit`.
- `channels.signal.textChunkLimit`: giden parça boyutu (karakter).
- `channels.signal.chunkMode`: uzunluk bölmeden önce boş satırlarda (paragraf sınırları) bölmek için `length` (varsayılan) veya `newline`.
- `channels.signal.mediaMaxMb`: gelen/giden medya üst sınırı (MB).

İlgili genel seçenekler:

- `agents.list[].groupChat.mentionPatterns` (Signal yerel bahsetmeleri desteklemez).
- `messages.groupChat.mentionPatterns` (genel fallback).
- `messages.responsePrefix`.

## İlgili

- [Channels Overview](/tr/channels) — desteklenen tüm kanallar
- [Pairing](/tr/channels/pairing) — DM kimlik doğrulaması ve eşleştirme akışı
- [Groups](/tr/channels/groups) — grup sohbeti davranışı ve bahsetme geçitlemesi
- [Channel Routing](/tr/channels/channel-routing) — mesajlar için oturum yönlendirmesi
- [Security](/tr/gateway/security) — erişim modeli ve sağlamlaştırma
