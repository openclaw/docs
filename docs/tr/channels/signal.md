---
read_when:
    - Signal desteği kurulurken
    - Signal gönderme/alma sorunlarını giderirken
summary: signal-cli aracılığıyla Signal desteği (JSON-RPC + SSE), kurulum yolları ve numara modeli
title: Signal
x-i18n:
    generated_at: "2026-04-05T13:46:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: cdd855eb353aca6a1c2b04d14af0e3da079349297b54fa8243562c52b29118d9
    source_path: channels/signal.md
    workflow: 15
---

# Signal (signal-cli)

Durum: harici CLI entegrasyonu. Gateway, `signal-cli` ile HTTP JSON-RPC + SSE üzerinden iletişim kurar.

## Ön koşullar

- Sunucunuzda OpenClaw kurulu olmalı (aşağıdaki Linux akışı Ubuntu 24 üzerinde test edilmiştir).
- Gateway’in çalıştığı ana makinede `signal-cli` kullanılabilir olmalı.
- Bir doğrulama SMS’i alabilecek bir telefon numarası (SMS kayıt yolu için).
- Kayıt sırasında Signal captcha için tarayıcı erişimi (`signalcaptchas.org`).

## Hızlı kurulum (başlangıç seviyesi)

1. Bot için **ayrı bir Signal numarası** kullanın (önerilir).
2. `signal-cli` kurun (`JVM` derlemesini kullanıyorsanız Java gerekir).
3. Bir kurulum yolu seçin:
   - **Yol A (QR bağlantısı):** `signal-cli link -n "OpenClaw"` komutunu çalıştırın ve Signal ile tarayın.
   - **Yol B (SMS ile kayıt):** özel bir numarayı captcha + SMS doğrulaması ile kaydedin.
4. OpenClaw’ı yapılandırın ve gateway’i yeniden başlatın.
5. İlk DM’i gönderin ve eşlemeyi onaylayın (`openclaw pairing approve signal <CODE>`).

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

- `signal-cli` aracılığıyla Signal kanalı (gömülü libsignal değil).
- Belirlenimli yönlendirme: yanıtlar her zaman Signal’e geri gider.
- DM’ler agent’ın ana oturumunu paylaşır; gruplar izoledir (`agent:<agentId>:signal:group:<groupId>`).

## Yapılandırma yazmaları

Varsayılan olarak Signal’in, `/config set|unset` tarafından tetiklenen yapılandırma güncellemelerini yazmasına izin verilir (`commands.config: true` gerekir).

Şununla devre dışı bırakın:

```json5
{
  channels: { signal: { configWrites: false } },
}
```

## Numara modeli (önemli)

- Gateway bir **Signal cihazına** bağlanır (`signal-cli` hesabı).
- Botu **kişisel Signal hesabınızda** çalıştırırsanız, kendi mesajlarınızı yok sayar (döngü koruması).
- “Ben bota mesaj atayım ve o yanıt versin” senaryosu için **ayrı bir bot numarası** kullanın.

## Kurulum yolu A: mevcut Signal hesabını bağlama (QR)

1. `signal-cli` kurun (`JVM` veya yerel derleme).
2. Bir bot hesabı bağlayın:
   - `signal-cli link -n "OpenClaw"` komutunu çalıştırın, ardından QR kodunu Signal ile tarayın.
3. Signal’i yapılandırın ve gateway’i başlatın.

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

Çoklu hesap desteği: hesap başına yapılandırma ve isteğe bağlı `name` için `channels.signal.accounts` kullanın. Ortak desen için [`gateway/configuration`](/gateway/configuration-reference#multi-account-all-channels) bölümüne bakın.

## Kurulum yolu B: özel bot numarası kaydı (SMS, Linux)

Mevcut bir Signal uygulama hesabını bağlamak yerine özel bir bot numarası istediğinizde bunu kullanın.

1. SMS alabilen bir numara edinin (veya sabit hatlar için sesli doğrulama).
   - Hesap/oturum çakışmalarını önlemek için özel bir bot numarası kullanın.
2. Gateway ana makinesine `signal-cli` kurun:

```bash
VERSION=$(curl -Ls -o /dev/null -w %{url_effective} https://github.com/AsamK/signal-cli/releases/latest | sed -e 's/^.*\/v//')
curl -L -O "https://github.com/AsamK/signal-cli/releases/download/v${VERSION}/signal-cli-${VERSION}-Linux-native.tar.gz"
sudo tar xf "signal-cli-${VERSION}-Linux-native.tar.gz" -C /opt
sudo ln -sf /opt/signal-cli /usr/local/bin/
signal-cli --version
```

`JVM` derlemesini kullanıyorsanız (`signal-cli-${VERSION}.tar.gz`), önce JRE 25+ kurun.
`signal-cli` uygulamasını güncel tutun; upstream, Signal sunucu API’leri değiştikçe eski sürümlerin bozulabileceğini belirtiyor.

3. Numarayı kaydedin ve doğrulayın:

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register
```

Captcha gerekiyorsa:

1. `https://signalcaptchas.org/registration/generate.html` adresini açın.
2. Captcha’yı tamamlayın, “Open Signal” içindeki `signalcaptcha://...` bağlantı hedefini kopyalayın.
3. Mümkünse tarayıcı oturumuyla aynı harici IP’den çalıştırın.
4. Kayıt işlemini hemen yeniden çalıştırın (captcha belirteçlerinin süresi hızla dolar):

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register --captcha '<SIGNALCAPTCHA_URL>'
signal-cli -a +<BOT_PHONE_NUMBER> verify <VERIFICATION_CODE>
```

4. OpenClaw’ı yapılandırın, gateway’i yeniden başlatın, kanalı doğrulayın:

```bash
# Gateway'i bir kullanıcı systemd hizmeti olarak çalıştırıyorsanız:
systemctl --user restart openclaw-gateway.service

# Ardından doğrulayın:
openclaw doctor
openclaw channels status --probe
```

5. DM göndereninizi eşleyin:
   - Bot numarasına herhangi bir mesaj gönderin.
   - Sunucuda kodu onaylayın: `openclaw pairing approve signal <PAIRING_CODE>`.
   - “Unknown contact” uyarısını önlemek için bot numarasını telefonunuza kişi olarak kaydedin.

Önemli: bir telefon numarası hesabını `signal-cli` ile kaydetmek, bu numara için ana Signal uygulaması oturumunun yetkisini kaldırabilir. Özel bir bot numarası tercih edin veya mevcut telefon uygulaması kurulumunuzu korumanız gerekiyorsa QR bağlantı modunu kullanın.

Upstream başvuruları:

- `signal-cli` README: `https://github.com/AsamK/signal-cli`
- Captcha akışı: `https://github.com/AsamK/signal-cli/wiki/Registration-with-captcha`
- Bağlama akışı: `https://github.com/AsamK/signal-cli/wiki/Linking-other-devices-(Provisioning)`

## Harici daemon modu (httpUrl)

`signal-cli` uygulamasını kendiniz yönetmek istiyorsanız (yavaş `JVM` soğuk başlangıçları, container init veya paylaşılan CPU’lar), daemon’u ayrı çalıştırın ve OpenClaw’ı ona yönlendirin:

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

Bu, OpenClaw içindeki otomatik başlatmayı ve başlangıç beklemesini atlar. Otomatik başlatmada yavaş açılışlar için `channels.signal.startupTimeoutMs` değerini ayarlayın.

## Erişim denetimi (DM’ler + gruplar)

DM’ler:

- Varsayılan: `channels.signal.dmPolicy = "pairing"`.
- Bilinmeyen gönderenlere bir eşleme kodu verilir; onaylanana kadar mesajlar yok sayılır (kodların süresi 1 saat sonra dolar).
- Şununla onaylayın:
  - `openclaw pairing list signal`
  - `openclaw pairing approve signal <CODE>`
- Eşleme, Signal DM’leri için varsayılan belirteç değişimidir. Ayrıntılar: [Pairing](/tr/channels/pairing)
- Yalnızca UUID gönderenler (`sourceUuid` içinden) `channels.signal.allowFrom` içinde `uuid:<id>` olarak saklanır.

Gruplar:

- `channels.signal.groupPolicy = open | allowlist | disabled`.
- `channels.signal.groupAllowFrom`, `allowlist` ayarlı olduğunda gruplarda kimlerin tetikleyebileceğini denetler.
- `channels.signal.groups["<group-id>" | "*"]`, `requireMention`, `tools` ve `toolsBySender` ile grup davranışını geçersiz kılabilir.
- Çoklu hesap kurulumlarında hesap başına geçersiz kılmalar için `channels.signal.accounts.<id>.groups` kullanın.
- Çalışma zamanı notu: `channels.signal` tamamen yoksa, çalışma zamanı grup denetimleri için `groupPolicy="allowlist"` değerine geri döner (`channels.defaults.groupPolicy` ayarlı olsa bile).

## Nasıl çalışır (davranış)

- `signal-cli` bir daemon olarak çalışır; gateway olayları SSE üzerinden okur.
- Gelen mesajlar paylaşılan kanal zarfına normalize edilir.
- Yanıtlar her zaman aynı numaraya veya gruba yönlendirilir.

## Medya + sınırlar

- Giden metin, `channels.signal.textChunkLimit` değerine göre parçalanır (varsayılan 4000).
- İsteğe bağlı yeni satır parçalama: uzunluk parçalamadan önce boş satırlarda (paragraf sınırlarında) bölmek için `channels.signal.chunkMode="newline"` ayarlayın.
- Ekler desteklenir (`signal-cli` içinden getirilen base64).
- Varsayılan medya sınırı: `channels.signal.mediaMaxMb` (varsayılan 8).
- Medya indirmeyi atlamak için `channels.signal.ignoreAttachments` kullanın.
- Grup geçmişi bağlamı, `channels.signal.historyLimit` (veya `channels.signal.accounts.*.historyLimit`) kullanır; `messages.groupChat.historyLimit` değerine geri düşer. Devre dışı bırakmak için `0` ayarlayın (varsayılan 50).

## Yazıyor + okundu bilgileri

- **Yazıyor göstergeleri**: OpenClaw, `signal-cli sendTyping` aracılığıyla yazıyor sinyalleri gönderir ve bir yanıt çalışırken bunları yeniler.
- **Okundu bilgileri**: `channels.signal.sendReadReceipts` true olduğunda, OpenClaw izin verilen DM’ler için okundu bilgilerini iletir.
- Signal-cli gruplar için okundu bilgilerini sunmaz.

## Tepkiler (mesaj aracı)

- `channel=signal` ile `message action=react` kullanın.
- Hedefler: gönderenin E.164 numarası veya UUID’si (`uuid:<id>` değerini eşleme çıktısından kullanın; çıplak UUID de çalışır).
- `messageId`, tepki verdiğiniz mesajın Signal zaman damgasıdır.
- Grup tepkileri için `targetAuthor` veya `targetAuthorUuid` gerekir.

Örnekler:

```
message action=react channel=signal target=uuid:123e4567-e89b-12d3-a456-426614174000 messageId=1737630212345 emoji=🔥
message action=react channel=signal target=+15551234567 messageId=1737630212345 emoji=🔥 remove=true
message action=react channel=signal target=signal:group:<groupId> targetAuthor=uuid:<sender-uuid> messageId=1737630212345 emoji=✅
```

Yapılandırma:

- `channels.signal.actions.reactions`: tepki eylemlerini etkinleştirir/devre dışı bırakır (varsayılan true).
- `channels.signal.reactionLevel`: `off | ack | minimal | extensive`.
  - `off`/`ack`, agent tepkilerini devre dışı bırakır (`react` mesaj aracı hata verir).
  - `minimal`/`extensive`, agent tepkilerini etkinleştirir ve yönlendirme düzeyini ayarlar.
- Hesap başına geçersiz kılmalar: `channels.signal.accounts.<id>.actions.reactions`, `channels.signal.accounts.<id>.reactionLevel`.

## Teslim hedefleri (CLI/cron)

- DM’ler: `signal:+15551234567` (veya düz E.164).
- UUID DM’ler: `uuid:<id>` (veya çıplak UUID).
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

Ardından gerekirse DM eşleme durumunu doğrulayın:

```bash
openclaw pairing list signal
```

Yaygın hatalar:

- Daemon erişilebilir ama yanıt yok: hesap/daemon ayarlarını (`httpUrl`, `account`) ve alma modunu doğrulayın.
- DM’ler yok sayılıyor: gönderen, eşleme onayı bekliyor.
- Grup mesajları yok sayılıyor: grup göndereni/bahsetme geçidi teslimatı engelliyor.
- Düzenlemelerden sonra yapılandırma doğrulama hataları: `openclaw doctor --fix` çalıştırın.
- Signal tanılamalarda görünmüyor: `channels.signal.enabled: true` olduğunu doğrulayın.

Ek denetimler:

```bash
openclaw pairing list signal
pgrep -af signal-cli
grep -i "signal" "/tmp/openclaw/openclaw-$(date +%Y-%m-%d).log" | tail -20
```

Triage akışı için: [/channels/troubleshooting](/channels/troubleshooting).

## Güvenlik notları

- `signal-cli`, hesap anahtarlarını yerel olarak depolar (genellikle `~/.local/share/signal-cli/data/`).
- Sunucu taşıma veya yeniden kurma öncesinde Signal hesap durumunu yedekleyin.
- Daha geniş DM erişimi istemiyorsanız `channels.signal.dmPolicy: "pairing"` ayarını koruyun.
- SMS doğrulaması yalnızca kayıt veya kurtarma akışları için gerekir, ancak numara/hesap denetimini kaybetmek yeniden kayıt sürecini karmaşıklaştırabilir.

## Yapılandırma başvurusu (Signal)

Tam yapılandırma: [Configuration](/gateway/configuration)

Sağlayıcı seçenekleri:

- `channels.signal.enabled`: kanal başlangıcını etkinleştirir/devre dışı bırakır.
- `channels.signal.account`: bot hesabı için E.164.
- `channels.signal.cliPath`: `signal-cli` yolu.
- `channels.signal.httpUrl`: tam daemon URL’si (host/port değerini geçersiz kılar).
- `channels.signal.httpHost`, `channels.signal.httpPort`: daemon bağlama adresi (varsayılan 127.0.0.1:8080).
- `channels.signal.autoStart`: daemon’u otomatik başlatır (`httpUrl` ayarlı değilse varsayılan true).
- `channels.signal.startupTimeoutMs`: ms cinsinden başlangıç bekleme zaman aşımı (üst sınır 120000).
- `channels.signal.receiveMode`: `on-start | manual`.
- `channels.signal.ignoreAttachments`: ek indirmelerini atlar.
- `channels.signal.ignoreStories`: daemon’dan gelen hikayeleri yok sayar.
- `channels.signal.sendReadReceipts`: okundu bilgilerini iletir.
- `channels.signal.dmPolicy`: `pairing | allowlist | open | disabled` (varsayılan: pairing).
- `channels.signal.allowFrom`: DM izin listesi (E.164 veya `uuid:<id>`). `open`, `"*"` gerektirir. Signal’in kullanıcı adı yoktur; telefon/UUID kimlikleri kullanın.
- `channels.signal.groupPolicy`: `open | allowlist | disabled` (varsayılan: allowlist).
- `channels.signal.groupAllowFrom`: grup gönderen izin listesi.
- `channels.signal.groups`: Signal grup kimliğine göre anahtarlanmış grup başına geçersiz kılmalar (veya `"*"`). Desteklenen alanlar: `requireMention`, `tools`, `toolsBySender`.
- `channels.signal.accounts.<id>.groups`: çoklu hesap kurulumları için `channels.signal.groups` alanının hesap başına sürümü.
- `channels.signal.historyLimit`: bağlama dahil edilecek en fazla grup mesajı sayısı (`0` devre dışı bırakır).
- `channels.signal.dmHistoryLimit`: kullanıcı dönüşleri cinsinden DM geçmişi sınırı. Kullanıcı başına geçersiz kılmalar: `channels.signal.dms["<phone_or_uuid>"].historyLimit`.
- `channels.signal.textChunkLimit`: giden parça boyutu (karakter).
- `channels.signal.chunkMode`: uzunluk parçalamadan önce boş satırlarda (paragraf sınırlarında) bölmek için `length` (varsayılan) veya `newline`.
- `channels.signal.mediaMaxMb`: gelen/giden medya sınırı (MB).

İlgili genel seçenekler:

- `agents.list[].groupChat.mentionPatterns` (Signal yerel bahsetmeleri desteklemez).
- `messages.groupChat.mentionPatterns` (genel geri dönüş).
- `messages.responsePrefix`.

## İlgili

- [Channels Overview](/tr/channels) — desteklenen tüm kanallar
- [Pairing](/tr/channels/pairing) — DM kimlik doğrulaması ve eşleme akışı
- [Groups](/tr/channels/groups) — grup sohbeti davranışı ve bahsetme geçidi
- [Channel Routing](/tr/channels/channel-routing) — mesajlar için oturum yönlendirmesi
- [Security](/gateway/security) — erişim modeli ve sağlamlaştırma
