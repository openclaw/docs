---
read_when:
    - Signal desteğini ayarlama
    - Signal gönderme/alma hata ayıklaması
summary: signal-cli aracılığıyla Signal desteği (yerel daemon veya bbernhard container), kurulum yolları ve numara modeli
title: Signal
x-i18n:
    generated_at: "2026-07-03T17:38:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 862afe3764e89aa026d245f57134b8e8e157539f24975ca341d67296fb8852d0
    source_path: channels/signal.md
    workflow: 16
---

Durum: harici CLI entegrasyonu. Gateway, `signal-cli` ile HTTP üzerinden konuşur — yerel daemon (JSON-RPC + SSE) veya bbernhard/signal-cli-rest-api container (REST + WebSocket).

## Önkoşullar

- Sunucunuzda OpenClaw kurulu (aşağıdaki Linux akışı Ubuntu 24 üzerinde test edildi).
- Şunlardan biri:
  - Ana makinede `signal-cli` kullanılabilir (yerel mod), **veya**
  - `bbernhard/signal-cli-rest-api` Docker container (container modu).
- Bir doğrulama SMS'i alabilen bir telefon numarası (SMS kayıt yolu için).
- Kayıt sırasında Signal captcha (`signalcaptchas.org`) için tarayıcı erişimi.

## Hızlı kurulum (başlangıç)

1. Bot için **ayrı bir Signal numarası** kullanın (önerilir).
2. OpenClaw plugin'ini kurun:

```bash
openclaw plugins install @openclaw/signal
```

3. `signal-cli` kurun (JVM derlemesini kullanıyorsanız Java gerekir).
4. Bir kurulum yolu seçin:
   - **Yol A (QR bağlantısı):** `signal-cli link -n "OpenClaw"` ve Signal ile tarayın.
   - **Yol B (SMS kaydı):** captcha + SMS doğrulaması ile ayrılmış bir numara kaydedin.
5. OpenClaw'ı yapılandırın ve gateway'i yeniden başlatın.
6. İlk DM'yi gönderin ve eşleştirmeyi onaylayın (`openclaw pairing approve signal <CODE>`).

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

| Alan         | Açıklama                                                  |
| ------------ | --------------------------------------------------------- |
| `account`    | E.164 biçiminde bot telefon numarası (`+15551234567`)     |
| `cliPath`    | `signal-cli` yolu (`PATH` üzerindeyse `signal-cli`)       |
| `configPath` | `--config` olarak geçirilen signal-cli yapılandırma dizini |
| `dmPolicy`   | DM erişim ilkesi (`pairing` önerilir)                     |
| `allowFrom`  | DM göndermesine izin verilen telefon numaraları veya `uuid:<id>` değerleri |

## Nedir

- `signal-cli` üzerinden Signal kanalı (gömülü libsignal değil).
- Deterministik yönlendirme: yanıtlar her zaman Signal'a geri gider.
- DM'ler agent'ın ana oturumunu paylaşır; gruplar yalıtılır (`agent:<agentId>:signal:group:<groupId>`).

## Yapılandırma yazımları

Varsayılan olarak Signal, `/config set|unset` tarafından tetiklenen yapılandırma güncellemelerini yazabilir (`commands.config: true` gerekir).

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
   - `signal-cli link -n "OpenClaw"` ardından QR'ı Signal içinde tarayın.
3. Signal'ı yapılandırın ve gateway'i başlatın.

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

Çoklu hesap desteği: hesap başına yapılandırma ve isteğe bağlı `name` ile `channels.signal.accounts` kullanın. Paylaşılan desen için [`gateway/configuration`](/tr/gateway/config-channels#multi-account-all-channels) bölümüne bakın.

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
`signal-cli` aracını güncel tutun; upstream, Signal sunucu API'leri değiştikçe eski sürümlerin bozulabileceğini belirtir.

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
`signal-cli` ile bir telefon numarası hesabı kaydetmek, o numara için ana Signal uygulaması oturumunun yetkisini kaldırabilir. Ayrılmış bir bot numarası tercih edin veya mevcut telefon uygulaması kurulumunuzu korumanız gerekiyorsa QR bağlantı modunu kullanın.
</Warning>

Upstream başvuruları:

- `signal-cli` README: `https://github.com/AsamK/signal-cli`
- Captcha akışı: `https://github.com/AsamK/signal-cli/wiki/Registration-with-captcha`
- Bağlama akışı: `https://github.com/AsamK/signal-cli/wiki/Linking-other-devices-(Provisioning)`

## Harici daemon modu (httpUrl)

`signal-cli` aracını kendiniz yönetmek istiyorsanız (yavaş JVM soğuk başlatmaları, container başlangıcı veya paylaşılan CPU'lar), daemon'u ayrı çalıştırın ve OpenClaw'ı ona yönlendirin:

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

Bu, otomatik başlatmayı ve OpenClaw içindeki başlangıç beklemesini atlar. Otomatik başlatma sırasında yavaş başlangıçlar için `channels.signal.startupTimeoutMs` ayarlayın.

## Container modu (bbernhard/signal-cli-rest-api)

`signal-cli` aracını yerel olarak çalıştırmak yerine [bbernhard/signal-cli-rest-api](https://github.com/bbernhard/signal-cli-rest-api) Docker container'ını kullanabilirsiniz. Bu, `signal-cli` aracını bir REST API ve WebSocket arayüzünün arkasına sarar.

Gereksinimler:

- Gerçek zamanlı mesaj almak için container **mutlaka** `MODE=json-rpc` ile çalışmalıdır.
- OpenClaw'a bağlanmadan önce Signal hesabınızı container içinde kaydedin veya bağlayın.

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
      apiMode: "container", // veya otomatik algılama için "auto"
    },
  },
}
```

`apiMode` alanı, OpenClaw'ın hangi protokolü kullanacağını denetler:

| Değer         | Davranış                                                                                       |
| ------------- | ---------------------------------------------------------------------------------------------- |
| `"auto"`      | (Varsayılan) İki aktarımı da yoklar; akış, container WebSocket alımını doğrular                 |
| `"native"`    | Yerel signal-cli'yi zorlar (`/api/v1/rpc` üzerinde JSON-RPC, `/api/v1/events` üzerinde SSE)     |
| `"container"` | bbernhard container'ını zorlar (`/v2/send` üzerinde REST, `/v1/receive/{account}` üzerinde WebSocket) |

`apiMode` `"auto"` olduğunda OpenClaw, tekrar eden yoklamaları önlemek için algılanan modu 30 saniye önbelleğe alır. Container alımı, yalnızca `/v1/receive/{account}` WebSocket'e yükseldikten sonra akış için seçilir; bu da `MODE=json-rpc` gerektirir.

Container modu, container eşleşen API'leri sunduğunda yerel modla aynı Signal kanalı işlemlerini destekler: gönderimler, alımlar, ekler, yazıyor göstergeleri, okundu/görüldü alındıları, tepkiler, gruplar ve stilli metin. OpenClaw, yerel Signal RPC çağrılarını container'ın REST yüklerine çevirir; buna `group.{base64(internal_id)}` grup kimlikleri ve biçimlendirilmiş metin için `text_mode: "styled"` dahildir.

Operasyonel notlar:

- Container moduyla `autoStart: false` kullanın. `apiMode: "container"` seçildiğinde OpenClaw yerel bir daemon başlatmamalıdır.
- Alım için `MODE=json-rpc` kullanın. `MODE=normal`, `/v1/about` için sağlıklı görünebilir, ancak `/v1/receive/{account}` WebSocket'e yükselmez; bu yüzden OpenClaw `auto` modunda container alım akışını seçmez.
- `httpUrl` değerinin bbernhard'ın REST API'sine işaret ettiğini biliyorsanız `apiMode: "container"` ayarlayın. Yerel `signal-cli` JSON-RPC/SSE'ye işaret ettiğini biliyorsanız `apiMode: "native"` ayarlayın. Dağıtım değişebiliyorsa `"auto"` kullanın.
- Container ek indirmeleri, yerel modla aynı medya bayt sınırlarına uyar. Sunucu `Content-Length` gönderdiğinde aşırı büyük yanıtlar tam olarak arabelleğe alınmadan önce, aksi halde akış sırasında reddedilir.

## Erişim denetimi (DM'ler + gruplar)

DM'ler:

- Varsayılan: `channels.signal.dmPolicy = "pairing"`.
- Bilinmeyen gönderenler bir eşleştirme kodu alır; mesajlar onaylanana kadar yok sayılır (kodlar 1 saat sonra sona erer).
- Şununla onaylayın:
  - `openclaw pairing list signal`
  - `openclaw pairing approve signal <CODE>`
- Eşleştirme, Signal DM'leri için varsayılan token değişimidir. Ayrıntılar: [Eşleştirme](/tr/channels/pairing)
- Yalnızca UUID gönderenler (`sourceUuid` üzerinden), `channels.signal.allowFrom` içinde `uuid:<id>` olarak saklanır.

Gruplar:

- `channels.signal.groupPolicy = open | allowlist | disabled`.
- `channels.signal.groupAllowFrom`, `allowlist` ayarlandığında hangi grupların veya gönderenlerin grup yanıtlarını tetikleyebileceğini denetler; girdiler Signal grup kimlikleri (ham, `group:<id>` veya `signal:group:<id>`), gönderen telefon numaraları, `uuid:<id>` değerleri veya `*` olabilir.
- `channels.signal.groups["<group-id>" | "*"]`, `requireMention`, `tools` ve `toolsBySender` ile grup davranışını geçersiz kılabilir.
- Çoklu hesap kurulumlarında hesap başına geçersiz kılmalar için `channels.signal.accounts.<id>.groups` kullanın.
- Bir Signal grubunu `groupAllowFrom` üzerinden izin listesine almak, kendi başına bahsetme geçidini devre dışı bırakmaz. Özellikle yapılandırılmış bir `channels.signal.groups["<group-id>"]` girdisi, `requireMention=true` ayarlanmadıkça her grup mesajını işler.
- Çalışma zamanı notu: `channels.signal` tamamen eksikse, çalışma zamanı grup denetimleri için `groupPolicy="allowlist"` değerine geri döner (`channels.defaults.groupPolicy` ayarlı olsa bile).

## Nasıl çalışır (davranış)

- Yerel mod: `signal-cli` daemon olarak çalışır; gateway olayları SSE üzerinden okur.
- Container modu: gateway REST API üzerinden gönderir ve WebSocket üzerinden alır.
- Gelen mesajlar paylaşılan kanal zarfına normalize edilir.
- Yanıtlar her zaman aynı numaraya veya gruba geri yönlendirilir.

## Medya + sınırlar

- Giden metin `channels.signal.textChunkLimit` değerine göre parçalara ayrılır (varsayılan 4000).
- İsteğe bağlı yeni satır parçalama: uzunluğa göre parçalamadan önce boş satırlardan (paragraf sınırları) bölmek için `channels.signal.chunkMode="newline"` ayarlayın.
- Ekler desteklenir (`signal-cli` üzerinden base64 olarak alınır).
- Sesli not ekleri, `contentType` eksik olduğunda MIME yedeği olarak `signal-cli` dosya adını kullanır; böylece ses transkripsiyonu AAC sesli notlarını yine de sınıflandırabilir.
- Varsayılan medya sınırı: `channels.signal.mediaMaxMb` (varsayılan 8).
- Medya indirmeyi atlamak için `channels.signal.ignoreAttachments` kullanın.
- Grup geçmişi bağlamı `channels.signal.historyLimit` (veya `channels.signal.accounts.*.historyLimit`) kullanır, yoksa `messages.groupChat.historyLimit` değerine geri döner. Devre dışı bırakmak için `0` ayarlayın (varsayılan 50).

## Yazıyor + okundu alındıları

- **Yazma göstergeleri**: OpenClaw, `signal-cli sendTyping` aracılığıyla yazma sinyalleri gönderir ve bir yanıt çalışırken bunları yeniler.
- **Okundu bilgileri**: `channels.signal.sendReadReceipts` true olduğunda OpenClaw, izin verilen DM'ler için okundu bilgilerini iletir.
- signal-cli, gruplar için okundu bilgilerini sunmaz.

## Yaşam döngüsü durumu tepkileri

Signal'in gelen turlarda paylaşılan
kuyrukta/düşünüyor/araç/Compaction/tamamlandı/hata tepki yaşam döngüsünü göstermesine izin vermek için `messages.statusReactions.enabled: true` ayarlayın.
Signal, gelen ileti zaman damgasını tepki hedefi olarak kullanır; grup
tepkileri, hedef yazar olarak Signal grup kimliği ve özgün gönderen ile gönderilir.

Durum tepkileri ayrıca bir ack tepkisi ve eşleşen bir
`messages.ackReactionScope` (`direct`, `group-all`, `group-mentions` veya `all`) gerektirir.
Signal durum tepkilerini devre dışı bırakmak için `channels.signal.reactionLevel: "off"` ayarlayın.
İleti aracı `react` eylemi daha katı kalır: `reactionLevel: "minimal"` veya `"extensive"` gerektirir.

`messages.removeAckAfterReply: true`, yapılandırılmış bekletme süresinden sonra son durum tepkisini temizler.
Aksi halde Signal, son done/error durumundan sonra ilk ack tepkisini geri yükler.

## Tepkiler (ileti aracı)

- `channel=signal` ile `message action=react` kullanın.
- Hedefler: gönderen E.164 veya UUID (eşleştirme çıktısından `uuid:<id>` kullanın; yalın UUID de çalışır).
- `messageId`, tepki verdiğiniz iletinin Signal zaman damgasıdır.
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
  - `off`/`ack`, ajan tepkilerini devre dışı bırakır (ileti aracı `react` hata verir).
  - `minimal`/`extensive`, ajan tepkilerini etkinleştirir ve yönlendirme düzeyini ayarlar.
- Hesap bazlı geçersiz kılmalar: `channels.signal.accounts.<id>.actions.reactions`, `channels.signal.accounts.<id>.reactionLevel`.

## Onay tepkileri

Signal exec ve Plugin onay istemleri üst düzey `approvals.exec` ve
`approvals.plugin` yönlendirme bloklarını kullanır. Signal'de
`channels.signal.execApprovals` bloğu yoktur.

- `👍` bir kez onaylar.
- `👎` reddeder.
- Bir istek kalıcı onay sunduğunda `/approve <id> allow-always` kullanın.

Onay tepkisi çözümlemesi, `channels.signal.allowFrom`, `channels.signal.defaultTo` veya eşleşen hesap düzeyi alanlardan açık Signal onaylayıcıları gerektirir.
Doğrudan aynı sohbet exec onay istemleri, açık onaylayıcılar olmadan da yinelenen yerel `/approve` yedeğini bastırabilir; onaylayıcısız grup onayları yerel yedeği görünür tutar.

## Teslim hedefleri (CLI/cron)

- DM'ler: `signal:+15551234567` (veya düz E.164).
- UUID DM'leri: `uuid:<id>` (veya yalın UUID).
- Gruplar: `signal:group:<groupId>`.
- Kullanıcı adları: `username:<name>` (Signal hesabınız destekliyorsa).

## Takma adlar

Yinelenen Signal hedefleri için kararlı adlar istediğinizde takma adları yapılandırın.
Takma adlar yalnızca OpenClaw tarafı yapılandırmadır; Signal kişileri oluşturmaz veya düzenlemez.

```json5
{
  channels: {
    signal: {
      aliases: {
        me: "+15557654321",
        jane: "uuid:123e4567-e89b-12d3-a456-426614174000",
        ops: "group:<groupId>",
      },
      defaultTo: "signal:me",
    },
  },
}
```

Signal teslim hedeflerinin kabul edildiği her yerde takma adları kullanın:

```bash
openclaw message send --channel signal --target signal:ops --message "Deployment is complete"
```

Hesap bazlı takma adlar üst düzey takma adları devralır ve ad ekleyebilir veya geçersiz kılabilir:

```json5
{
  channels: {
    signal: {
      aliases: {
        me: "+15557654321",
      },
      accounts: {
        work: {
          aliases: {
            ops: "group:<workGroupId>",
          },
        },
      },
    },
  },
}
```

`openclaw directory peers list --channel signal` ve
`openclaw directory groups list --channel signal` yapılandırılmış takma adları listeler. Signal dizini yapılandırma desteklidir; Signal kişilerini canlı sorgulamaz veya Signal hesabını değiştirmez.

## Sorun giderme

Önce bu basamağı çalıştırın:

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
- Grup iletileri yok sayılıyor: grup göndereninden/mention geçitleri teslimi engelliyor.
- Düzenlemelerden sonra yapılandırma doğrulama hataları: `openclaw doctor --fix` çalıştırın.
- Signal tanılarda eksik: `channels.signal.enabled: true` olduğunu doğrulayın.

Ek kontroller:

```bash
openclaw pairing list signal
pgrep -af signal-cli
grep -i "signal" "/tmp/openclaw/openclaw-$(date +%Y-%m-%d).log" | tail -20
```

Triage akışı için: [/channels/troubleshooting](/tr/channels/troubleshooting).

## Güvenlik notları

- `signal-cli`, hesap anahtarlarını yerel olarak saklar (genellikle `~/.local/share/signal-cli/data/`).
- Sunucu geçişi veya yeniden oluşturma öncesinde Signal hesap durumunu yedekleyin.
- Daha geniş DM erişimini açıkça istemediğiniz sürece `channels.signal.dmPolicy: "pairing"` olarak tutun.
- SMS doğrulaması yalnızca kayıt veya kurtarma akışları için gereklidir, ancak numaranın/hesabın denetimini kaybetmek yeniden kaydı zorlaştırabilir.

## Yapılandırma başvurusu (Signal)

Tam yapılandırma: [Yapılandırma](/tr/gateway/configuration)

Sağlayıcı seçenekleri:

- `channels.signal.enabled`: kanal başlangıcını etkinleştir/devre dışı bırak.
- `channels.signal.apiMode`: `auto | native | container` (varsayılan: auto). Bkz. [Container modu](#container-mode-bbernhardsignal-cli-rest-api).
- `channels.signal.account`: bot hesabı için E.164.
- `channels.signal.cliPath`: `signal-cli` yolu.
- `channels.signal.configPath`: isteğe bağlı `signal-cli --config` dizini.
- `channels.signal.httpUrl`: tam daemon URL'si (host/port değerlerini geçersiz kılar).
- `channels.signal.httpHost`, `channels.signal.httpPort`: daemon bağlaması (varsayılan 127.0.0.1:8080).
- `channels.signal.autoStart`: daemon'ı otomatik başlat (varsayılan true, `httpUrl` ayarlanmamışsa).
- `channels.signal.startupTimeoutMs`: ms cinsinden başlangıç bekleme zaman aşımı (üst sınır 120000).
- `channels.signal.receiveMode`: `on-start | manual`.
- `channels.signal.ignoreAttachments`: ek indirmelerini atla.
- `channels.signal.ignoreStories`: daemon'dan gelen story'leri yok say.
- `channels.signal.sendReadReceipts`: okundu bilgilerini ilet.
- `channels.signal.dmPolicy`: `pairing | allowlist | open | disabled` (varsayılan: pairing).
- `channels.signal.allowFrom`: DM izin listesi (E.164 veya `uuid:<id>`). `open`, `"*"` gerektirir. Signal'de kullanıcı adları yoktur; telefon/UUID kimlikleri kullanın.
- `channels.signal.aliases`: DM veya grup teslim hedefleri için OpenClaw tarafı takma adlar.
- `channels.signal.groupPolicy`: `open | allowlist | disabled` (varsayılan: allowlist).
- `channels.signal.groupAllowFrom`: grup izin listesi; Signal grup kimliklerini (ham, `group:<id>` veya `signal:group:<id>`), gönderen E.164 numaralarını veya `uuid:<id>` değerlerini kabul eder.
- `channels.signal.groups`: Signal grup kimliğine (veya `"*"`) göre anahtarlanmış grup bazlı geçersiz kılmalar. Desteklenen alanlar: `requireMention`, `tools`, `toolsBySender`.
- `channels.signal.accounts.<id>.groups`: çok hesaplı kurulumlar için `channels.signal.groups` değerinin hesap bazlı sürümü.
- `channels.signal.accounts.<id>.aliases`: üst düzey takma adlarla birleştirilen hesap bazlı takma adlar.
- `channels.signal.historyLimit`: bağlam olarak eklenecek en fazla grup iletisi (0 devre dışı bırakır).
- `channels.signal.dmHistoryLimit`: kullanıcı turları cinsinden DM geçmiş sınırı. Kullanıcı bazlı geçersiz kılmalar: `channels.signal.dms["<phone_or_uuid>"].historyLimit`.
- `channels.signal.textChunkLimit`: giden parça boyutu (karakter).
- `channels.signal.chunkMode`: uzunluğa göre parçalamadan önce boş satırlarda (paragraf sınırları) bölmek için `length` (varsayılan) veya `newline`.
- `channels.signal.mediaMaxMb`: gelen/giden medya üst sınırı (MB).

İlgili genel seçenekler:

- `agents.list[].groupChat.mentionPatterns` (Signal yerel mention'ları desteklemez).
- `messages.groupChat.mentionPatterns` (genel yedek).
- `messages.responsePrefix`.

## İlgili

- [Kanallara Genel Bakış](/tr/channels) — desteklenen tüm kanallar
- [Eşleştirme](/tr/channels/pairing) — DM kimlik doğrulaması ve eşleştirme akışı
- [Gruplar](/tr/channels/groups) — grup sohbeti davranışı ve mention geçidi
- [Kanal Yönlendirme](/tr/channels/channel-routing) — iletiler için oturum yönlendirmesi
- [Güvenlik](/tr/gateway/security) — erişim modeli ve sağlamlaştırma
