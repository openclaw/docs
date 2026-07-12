---
read_when:
    - Signal desteğini ayarlama
    - Signal gönderme/alma sorunlarını ayıklama
summary: signal-cli (yerel daemon veya bbernhard konteyneri) üzerinden Signal desteği, kurulum yolları ve numara modeli
title: Signal
x-i18n:
    generated_at: "2026-07-12T11:30:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: db2497d0d6dcdc61cf9f7388929f9ee107602c9ed97bd248e20e67519e878b8b
    source_path: channels/signal.md
    workflow: 16
---

Signal, indirilebilir bir kanal pluginidir (`@openclaw/signal`). Gateway, `signal-cli` ile HTTP üzerinden iletişim kurar: yerel daemon (JSON-RPC + SSE) veya [bbernhard/signal-cli-rest-api](https://github.com/bbernhard/signal-cli-rest-api) konteyneri (REST + WebSocket). OpenClaw, libsignal'ı yerleşik olarak içermez.

## Numara modeli (önce bunu okuyun)

- Gateway bir **Signal cihazına**, yani `signal-cli` hesabına bağlanır.
- Botu **kişisel Signal hesabınızda** çalıştırmak, kendi mesajlarınızı yok saymasına neden olur (döngü koruması).
- "Bota mesaj gönderiyorum ve yanıt veriyor" senaryosu için **ayrı bir bot numarası** kullanın.

## Kurulum

```bash
openclaw plugins install @openclaw/signal
```

Kaynak belirtilmeyen plugin tanımları önce ClawHub'ı, ardından yedek olarak npm'i dener. `openclaw plugins install clawhub:@openclaw/signal` veya `npm:@openclaw/signal` ile kaynağı zorunlu kılın. `plugins install`, plugini kaydeder ve etkinleştirir; ayrı bir `enable` adımı gerekmez. Genel kurulum kuralları için [Pluginler](/tr/tools/plugin) bölümüne bakın.

## Hızlı kurulum

<Steps>
  <Step title="Bir numara seçin">
    Bot için **ayrı bir Signal numarası** kullanın (önerilir).
  </Step>
  <Step title="Plugini kurun">
    ```bash
    openclaw plugins install @openclaw/signal
    ```
  </Step>
  <Step title="Yönlendirmeli kurulumu çalıştırın">
    ```bash
    openclaw channels add
    ```
    Sihirbaz, `signal-cli` aracının `PATH` içinde olup olmadığını algılar ve eksikse kurmayı önerir: Linux x86-64'te resmi yerel GraalVM derlemesini indirir; macOS ve diğer mimarilerde ise Homebrew aracılığıyla kurar. Ardından bot numarasını ve `signal-cli` yolunu sorar.
  </Step>
  <Step title="Hesabı bağlayın veya kaydedin">
    - **QR ile bağlama (en hızlı):** `signal-cli link -n "OpenClaw"` komutunu çalıştırın, ardından Signal ile tarayın. [A Yolu](#setup-path-a-link-existing-signal-account-qr) bölümüne bakın.
    - **SMS ile kayıt:** captcha + SMS doğrulamasıyla ayrılmış bir numara kullanın. [B Yolu](#setup-path-b-register-dedicated-bot-number-sms-linux) bölümüne bakın.

  </Step>
  <Step title="Doğrulayın ve eşleştirin">
    ```bash
    openclaw gateway call channels.status --params '{"probe":true}'
    ```
    İlk doğrudan mesajı gönderin ve eşleştirmeyi onaylayın: `openclaw pairing approve signal <CODE>`.
  </Step>
</Steps>

Asgari yapılandırma:

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

| Alan         | Açıklama                                                          |
| ------------ | ----------------------------------------------------------------- |
| `account`    | E.164 biçimindeki bot telefon numarası (`+15551234567`)            |
| `cliPath`    | `signal-cli` yolu (`PATH` içindeyse `signal-cli`)                  |
| `configPath` | `--config` olarak iletilen signal-cli yapılandırma dizini          |
| `dmPolicy`   | Doğrudan mesaj erişim politikası (`pairing` önerilir)              |
| `allowFrom`  | Doğrudan mesaj göndermesine izin verilen telefon numaraları veya `uuid:<id>` değerleri |

Çoklu hesap desteği: hesap başına yapılandırma ve isteğe bağlı `name` ile `channels.signal.accounts` kullanın. Paylaşılan kalıp için [Çoklu hesap kanalları](/tr/gateway/config-channels#multi-account-all-channels) bölümüne bakın.

## Nedir?

- Belirlenimci yönlendirme: yanıtlar her zaman Signal'a geri gider.
- Doğrudan mesajlar aracının ana oturumunu paylaşır; gruplar yalıtılmıştır (`agent:<agentId>:signal:group:<groupId>`).
- Signal, varsayılan olarak `/config set|unset` tarafından tetiklenen yapılandırma güncellemelerini yazabilir (`commands.config: true` gerektirir). `channels.signal.configWrites: false` ile devre dışı bırakın.

## A kurulum yolu: mevcut Signal hesabını bağlama (QR)

1. `signal-cli` aracını (JVM veya yerel derleme) kurun ya da `openclaw channels add` komutunun sizin için kurmasına izin verin.
2. Bir bot hesabını bağlayın: `signal-cli link -n "OpenClaw"` komutunu çalıştırın, ardından QR kodunu Signal'da tarayın.
3. Signal'ı yapılandırın ve Gateway'i başlatın.

## B kurulum yolu: ayrılmış bot numarasını kaydetme (SMS, Linux)

Mevcut bir Signal uygulaması hesabını bağlamak yerine ayrılmış bir bot numarası için bunu kullanın. Aşağıdaki akış Ubuntu 24 üzerinde test edilmiştir.

1. SMS alabilen bir numara edinin (veya sabit hatlar için sesli doğrulama kullanın). Ayrılmış bir bot numarası, hesap/oturum çakışmalarını önler.
2. Gateway ana makinesine `signal-cli` aracını kurun:

```bash
VERSION=$(curl -Ls -o /dev/null -w %{url_effective} https://github.com/AsamK/signal-cli/releases/latest | sed -e 's/^.*\/v//')
curl -L -O "https://github.com/AsamK/signal-cli/releases/download/v${VERSION}/signal-cli-${VERSION}-Linux-native.tar.gz"
sudo tar xf "signal-cli-${VERSION}-Linux-native.tar.gz" -C /opt
sudo ln -sf /opt/signal-cli /usr/local/bin/
signal-cli --version
```

JVM derlemesini (`signal-cli-${VERSION}.tar.gz`) kullanıyorsanız önce bir JRE kurun. `signal-cli` aracını güncel tutun; üst proje, Signal sunucu API'leri değiştikçe eski sürümlerin çalışmayabileceğini belirtmektedir.

3. Numarayı kaydedin ve doğrulayın:

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register
```

Captcha gerekiyorsa (bu adımı tamamlamak için tarayıcı erişimi gerekir):

1. `https://signalcaptchas.org/registration/generate.html` adresini açın.
2. Captcha'yı tamamlayın ve "Open Signal" öğesindeki `signalcaptcha://...` bağlantı hedefini kopyalayın.
3. Mümkünse komutu tarayıcı oturumuyla aynı harici IP'den çalıştırın (captcha belirteçlerinin süresi hızla dolar).
4. Hemen kaydedin ve doğrulayın:

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register --captcha '<SIGNALCAPTCHA_URL>'
signal-cli -a +<BOT_PHONE_NUMBER> verify <VERIFICATION_CODE>
```

4. OpenClaw'ı yapılandırın, Gateway'i yeniden başlatın ve kanalı doğrulayın:

```bash
# Gateway'i kullanıcıya ait bir systemd hizmeti olarak çalıştırıyorsanız:
systemctl --user restart openclaw-gateway.service

# Ardından doğrulayın:
openclaw doctor
openclaw channels status --probe
```

5. Doğrudan mesaj gönderen hesabınızı eşleştirin:
   - Bot numarasına herhangi bir mesaj gönderin.
   - Sunucuda onaylayın: `openclaw pairing approve signal <PAIRING_CODE>`.
   - "Unknown contact" uyarısını önlemek için bot numarasını telefonunuza kişi olarak kaydedin.

<Warning>
Bir telefon numarası hesabını `signal-cli` ile kaydetmek, bu numaranın ana Signal uygulaması oturumunun kimlik doğrulamasını kaldırabilir. Ayrılmış bir bot numarası tercih edin veya mevcut telefon uygulaması kurulumunuzu korumak için QR bağlantı modunu kullanın.
</Warning>

Üst proje kaynakları:

- `signal-cli` README dosyası: `https://github.com/AsamK/signal-cli`
- Captcha akışı: `https://github.com/AsamK/signal-cli/wiki/Registration-with-captcha`
- Bağlama akışı: `https://github.com/AsamK/signal-cli/wiki/Linking-other-devices-(Provisioning)`

## Harici daemon modu (httpUrl)

`signal-cli` aracını kendiniz yönetmek için (yavaş JVM soğuk başlatmaları, konteyner başlatma işlemi, paylaşılan CPU'lar), daemon'ı ayrı çalıştırın ve OpenClaw'ı ona yönlendirin:

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

Bu, otomatik süreç oluşturmayı ve OpenClaw'ın başlangıç beklemesini atlar. Otomatik oluşturulan yavaş başlangıçlar için `channels.signal.startupTimeoutMs` değerini ayarlayın.

## Konteyner modu (bbernhard/signal-cli-rest-api)

`signal-cli` aracını yerel olarak çalıştırmak yerine, `signal-cli` aracını bir REST + WebSocket arayüzünün arkasında sarmalayan [bbernhard/signal-cli-rest-api](https://github.com/bbernhard/signal-cli-rest-api) Docker konteynerini kullanın.

Gereksinimler:

- Gerçek zamanlı mesaj alımı için konteyner **mutlaka** `MODE=json-rpc` ile çalışmalıdır.
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
      apiMode: "container", // or "auto" to detect automatically
    },
  },
}
```

`apiMode`, OpenClaw'ın hangi protokolü kullanacağını denetler:

| Değer         | Davranış                                                                                                   |
| ------------- | ---------------------------------------------------------------------------------------------------------- |
| `"auto"`      | (Varsayılan) Her iki aktarımı da yoklar; akış, konteynerin WebSocket alımını doğrular                       |
| `"native"`    | Yerel signal-cli kullanımını zorunlu kılar (`/api/v1/rpc` üzerinde JSON-RPC, `/api/v1/events` üzerinde SSE) |
| `"container"` | bbernhard konteynerini zorunlu kılar (`/v2/send` üzerinde REST, `/v1/receive/{account}` üzerinde WebSocket) |

`apiMode` değeri `"auto"` olduğunda OpenClaw, yinelenen yoklamaları önlemek için algılanan modu daemon URL'si başına 30 saniye önbelleğe alır (her iki aktarım da sağlıklıysa yerel mod önceliklidir). Konteyner alımı, yalnızca `/v1/receive/{account}` WebSocket'e yükseltildikten sonra akış için seçilir; bunun için `MODE=json-rpc` gerekir.

Konteyner modu, konteynerin eşleşen API'leri sunduğu durumlarda yerel modla aynı Signal işlemlerini destekler: gönderme, alma, ekler, yazıyor göstergeleri, okundu/görüldü alındıları, tepkiler, gruplar ve biçemli metin. OpenClaw, yerel Signal RPC çağrılarını biçimlendirilmiş metin için `group.{base64(internal_id)}` grup kimlikleri ve `text_mode: "styled"` dâhil olmak üzere konteynerin REST yüklerine çevirir.

İşletim notları:

- Konteyner moduyla `autoStart: false` kullanın; `apiMode: "container"` seçildiğinde OpenClaw yerel bir daemon oluşturmamalıdır.
- Alım için `MODE=json-rpc` kullanın. `MODE=normal`, `/v1/about` uç noktasının sağlıklı görünmesine neden olabilir ancak `/v1/receive/{account}` WebSocket'e yükseltilmez; bu nedenle OpenClaw, `auto` modunda konteyner alım akışını seçmez.
- `httpUrl`, bbernhard REST API'sine yöneliyorsa `apiMode: "container"`; yerel `signal-cli` JSON-RPC/SSE'ye yöneliyorsa `"native"`; dağıtım değişebiliyorsa `"auto"` ayarını kullanın.
- Konteyner ek indirmeleri, yerel modla aynı medya bayt sınırlarına uyar. Sunucu `Content-Length` gönderdiğinde aşırı büyük yanıtlar tamamen arabelleğe alınmadan önce, aksi durumda ise akış sırasında reddedilir.

## Erişim denetimi (doğrudan mesajlar + gruplar)

Doğrudan mesajlar:

- Varsayılan: `channels.signal.dmPolicy = "pairing"`.
- Bilinmeyen gönderenler bir eşleştirme kodu alır; onay verilene kadar mesajlar yok sayılır (kodların süresi 1 saat sonra dolar).
- `openclaw pairing list signal` ve `openclaw pairing approve signal <CODE>` aracılığıyla onaylayın.
- Eşleştirme, Signal doğrudan mesajları için varsayılan belirteç değişimidir. Ayrıntılar: [Eşleştirme](/tr/channels/pairing)
- Yalnızca UUID'ye sahip gönderenler (`sourceUuid` kaynağından), `channels.signal.allowFrom` içinde `uuid:<id>` olarak saklanır.

Gruplar:

- `channels.signal.groupPolicy = open | allowlist | disabled`.
- `channels.signal.groupAllowFrom`, `allowlist` ayarlandığında hangi grupların veya gönderenlerin grup yanıtlarını tetikleyebileceğini denetler; girdiler Signal grup kimlikleri (ham, `group:<id>` veya `signal:group:<id>`), gönderen telefon numaraları, `uuid:<id>` değerleri ya da `*` olabilir.
- `channels.signal.groups["<group-id>" | "*"]`, `requireMention`, `tools` ve `toolsBySender` ile grup davranışını geçersiz kılabilir.
- Çoklu hesap kurulumlarında hesap başına geçersiz kılmalar için `channels.signal.accounts.<id>.groups` kullanın.
- Bir gruba `groupAllowFrom` aracılığıyla izin vermek, söz edilme gereksinimini kendiliğinden devre dışı bırakmaz. Özel olarak yapılandırılmış bir `channels.signal.groups["<group-id>"]` girdisi, `requireMention: true` açıkça ayarlanmadığı sürece her grup mesajını işler.
- Çalışma zamanı notu: `channels.signal` tamamen eksikse çalışma zamanı, grup denetimleri için `groupPolicy="allowlist"` değerine geri döner (`channels.defaults.groupPolicy` ayarlanmış olsa bile).

## Nasıl çalışır? (davranış)

- Yerel mod: `signal-cli` bir daemon olarak çalışır; Gateway olayları SSE aracılığıyla okur.
- Konteyner modu: Gateway REST API aracılığıyla gönderir ve WebSocket aracılığıyla alır.
- Gelen mesajlar, paylaşılan kanal zarfına normalleştirilir.
- Yanıtlar her zaman aynı numaraya veya gruba geri yönlendirilir.
- Gelen mesajlara verilen yanıtlar, arka uç gelen zaman damgasını ve yazarı kabul ettiğinde yerel Signal alıntı meta verilerini içerir; alıntı meta verileri eksikse veya reddedilirse OpenClaw yanıtı normal mesaj olarak gönderir.
- Yerel alıntı kullanımını `channels.signal.replyToMode = off | first | all | batched` ile veya sohbet türüne göre geçersiz kılmalar için `channels.signal.replyToModeByChatType.direct/group` ile yapılandırın. `channels.signal.accounts.<id>` altındaki hesap düzeyi değerler önceliklidir.

## Medya + sınırlar

- Giden metin, `channels.signal.textChunkLimit` değerine göre parçalara ayrılır (varsayılan 4000).
- İsteğe bağlı yeni satır parçalama: uzunluğa göre parçalamadan önce boş satırlarda (paragraf sınırlarında) bölmek için `channels.signal.chunkMode="newline"` ayarını kullanın.
- Ekler desteklenir (`signal-cli` üzerinden base64 olarak alınır).
- `contentType` eksik olduğunda sesli not ekleri, MIME yedeği olarak `signal-cli` dosya adını kullanır; böylece ses transkripsiyonu AAC sesli notlarını yine de sınıflandırabilir.
- Varsayılan medya sınırı: `channels.signal.mediaMaxMb` (varsayılan 8).
- Medya indirmeyi atlamak için `channels.signal.ignoreAttachments` kullanın.
- Grup geçmişi bağlamı, `messages.groupChat.historyLimit` değerini yedek olarak kullanarak `channels.signal.historyLimit` (veya `channels.signal.accounts.*.historyLimit`) değerini kullanır. Devre dışı bırakmak için `0` olarak ayarlayın (varsayılan 50).

## Yazıyor göstergeleri + okundu bilgileri

- **Yazıyor göstergeleri**: OpenClaw, `signal-cli sendTyping` aracılığıyla yazıyor sinyalleri gönderir ve yanıt hazırlanırken bunları yeniler.
- **Okundu bilgileri**: `channels.signal.sendReadReceipts` true olduğunda OpenClaw, izin verilen doğrudan mesajlar için okundu bilgilerini iletir.
- `signal-cli`, gruplar için okundu bilgilerini sunmaz.

## Yaşam döngüsü durumu tepkileri

Signal'ın gelen etkileşimlerde ortak sıraya alındı/düşünüyor/araç/Compaction/tamamlandı/hata tepki yaşam döngüsünü göstermesi için `messages.statusReactions.enabled: true` olarak ayarlayın. Signal, tepki hedefi olarak gelen mesajın zaman damgasını kullanır; grup tepkileri, Signal grup kimliği ve hedef yazar olarak özgün gönderen ile gönderilir.

Durum tepkileri ayrıca bir onay tepkisi ve eşleşen bir `messages.ackReactionScope` (`direct`, `group-all`, `group-mentions` veya `all`) gerektirir. Signal durum tepkilerini devre dışı bırakmak için `channels.signal.reactionLevel: "off"` olarak ayarlayın.

`messages.removeAckAfterReply: true`, yapılandırılan bekletme süresinin ardından son durum tepkisini temizler. Aksi takdirde Signal, son tamamlandı/hata durumundan sonra ilk onay tepkisini geri yükler.

## Tepkiler (mesaj aracı)

`channel=signal` ile `message action=react` kullanın.

- Hedefler: gönderenin E.164 numarası veya UUID'si (eşleştirme çıktısındaki `uuid:<id>` biçimini kullanın; yalın UUID de çalışır).
- `messageId`, tepki verdiğiniz mesajın Signal zaman damgasıdır.
- Grup tepkileri `targetAuthor` veya `targetAuthorUuid` gerektirir.

```text
message action=react channel=signal target=uuid:123e4567-e89b-12d3-a456-426614174000 messageId=1737630212345 emoji=🔥
message action=react channel=signal target=+15551234567 messageId=1737630212345 emoji=🔥 remove=true
message action=react channel=signal target=signal:group:<groupId> targetAuthor=uuid:<sender-uuid> messageId=1737630212345 emoji=✅
```

Yapılandırma:

- `channels.signal.actions.reactions`: tepki eylemlerini etkinleştirin/devre dışı bırakın (varsayılan true).
- `channels.signal.reactionLevel`: `off | ack | minimal | extensive` (varsayılan `minimal`).
  - `off`/`ack`, ajan tepkilerini devre dışı bırakır (mesaj aracındaki `react` hata verir).
  - `minimal`/`extensive`, ajan tepkilerini etkinleştirir ve yönlendirme düzeyini belirler.
- Hesap başına geçersiz kılmalar: `channels.signal.accounts.<id>.actions.reactions`, `channels.signal.accounts.<id>.reactionLevel`.

## Onay tepkileri

Signal çalıştırma ve Plugin onay istemleri, üst düzey `approvals.exec` ve `approvals.plugin` yönlendirme bloklarını kullanır. Signal'da `channels.signal.execApprovals` bloğu yoktur.

- `👍` bir kez onaylar.
- `👎` reddeder.
- Bir istek kalıcı onay sunduğunda `/approve <id> allow-always` kullanın.

Onay tepkilerinin çözümlenmesi, `channels.signal.allowFrom`, `channels.signal.defaultTo` veya eşleşen hesap düzeyi alanlarından açıkça belirtilmiş Signal onaylayıcıları gerektirir. Aynı doğrudan mesaj sohbetindeki çalıştırma onayı istemleri, açıkça belirtilmiş onaylayıcılar olmasa bile yinelenen yerel `/approve` yedeğini gizleyebilir; onaylayıcısı olmayan grup onaylarında yerel yedek görünür kalır.

## Teslim hedefleri (CLI/Cron)

- Doğrudan mesajlar: `signal:+15551234567` (veya yalın E.164).
- UUID doğrudan mesajları: `uuid:<id>` (veya yalın UUID).
- Gruplar: `signal:group:<groupId>`.
- Kullanıcı adları: `username:<name>` (Signal hesabınız destekliyorsa).

## Takma adlar

Yinelenen Signal hedefleri için kararlı adlar sağlayan takma adlar yapılandırın. Takma adlar yalnızca OpenClaw tarafındaki yapılandırmadır; Signal kişileri oluşturmaz veya düzenlemez.

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

Hesap başına takma adlar, üst düzey takma adları devralır ve ad ekleyebilir veya geçersiz kılabilir:

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

`openclaw directory peers list --channel signal` ve `openclaw directory groups list --channel signal`, yapılandırılmış takma adları listeler. Signal dizini yapılandırma tabanlıdır; Signal kişilerini canlı olarak sorgulamaz veya Signal hesabını değiştirmez.

## Sorun giderme

Önce şu adımları çalıştırın:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Ardından gerekirse doğrudan mesaj eşleştirme durumunu doğrulayın:

```bash
openclaw pairing list signal
```

Yaygın hatalar:

- Arka plan hizmetine erişilebiliyor ancak yanıt yok: hesap/arka plan hizmeti ayarlarını (`httpUrl`, `account`) ve alma modunu doğrulayın.
- Doğrudan mesajlar yok sayılıyor: gönderen, eşleştirme onayı bekliyor.
- Grup mesajları yok sayılıyor: grup göndereni/bahsetme geçidi teslimi engelliyor.
- Düzenlemelerden sonra yapılandırma doğrulama hataları: `openclaw doctor --fix` komutunu çalıştırın.
- Signal tanılamalarda görünmüyor: `channels.signal.enabled: true` ayarını doğrulayın.

Ek denetimler:

```bash
openclaw pairing list signal
pgrep -af signal-cli
grep -i "signal" "/tmp/openclaw/openclaw-$(date +%Y-%m-%d).log" | tail -20
```

Önceliklendirme akışı için: [Kanal Sorunlarını Giderme](/tr/channels/troubleshooting).

## Güvenlik notları

- `signal-cli`, hesap anahtarlarını yerel olarak saklar (genellikle `~/.local/share/signal-cli/data/`).
- Sunucu taşıma veya yeniden oluşturma işleminden önce Signal hesap durumunu yedekleyin.
- Açıkça daha geniş doğrudan mesaj erişimi istemiyorsanız `channels.signal.dmPolicy: "pairing"` ayarını koruyun.
- SMS doğrulaması yalnızca kayıt veya kurtarma akışları için gereklidir; ancak numaranın/hesabın denetimini kaybetmek yeniden kaydı zorlaştırabilir.

## Yapılandırma referansı (Signal)

Tam yapılandırma: [Yapılandırma](/tr/gateway/configuration)

Sağlayıcı seçenekleri:

- `channels.signal.enabled`: kanal başlangıcını etkinleştirin/devre dışı bırakın.
- `channels.signal.apiMode`: `auto | native | container` (varsayılan: auto). [Kapsayıcı modu](#container-mode-bbernhardsignal-cli-rest-api) bölümüne bakın.
- `channels.signal.account`: bot hesabının E.164 numarası.
- `channels.signal.cliPath`: `signal-cli` yolu.
- `channels.signal.configPath`: isteğe bağlı `signal-cli --config` dizini.
- `channels.signal.httpUrl`: tam arka plan hizmeti URL'si (ana makine/bağlantı noktası ayarlarını geçersiz kılar).
- `channels.signal.httpHost`, `channels.signal.httpPort`: arka plan hizmeti bağlama adresi (varsayılan `127.0.0.1:8080`).
- `channels.signal.autoStart`: arka plan hizmetini otomatik başlatın (`httpUrl` ayarlanmamışsa varsayılan true).
- `channels.signal.startupTimeoutMs`: ms cinsinden başlangıç bekleme zaman aşımı (en az 1000, en fazla 120000; varsayılan 30000).
- `channels.signal.receiveMode`: `on-start | manual`.
- `channels.signal.ignoreAttachments`: ek indirmelerini atlayın.
- `channels.signal.ignoreStories`: arka plan hizmetinden gelen hikâyeleri yok sayın.
- `channels.signal.sendReadReceipts`: okundu bilgilerini iletin.
- `channels.signal.dmPolicy`: `pairing | allowlist | open | disabled` (varsayılan: pairing).
- `channels.signal.allowFrom`: doğrudan mesaj izin listesi (E.164 veya `uuid:<id>`). `open`, `"*"` gerektirir. Signal'da kullanıcı adları yoktur; telefon/UUID kimliklerini kullanın.
- `channels.signal.aliases`: doğrudan mesaj veya grup teslim hedefleri için OpenClaw tarafındaki takma adlar.
- `channels.signal.groupPolicy`: `open | allowlist | disabled` (varsayılan: allowlist).
- `channels.signal.groupAllowFrom`: grup izin listesi; Signal grup kimliklerini (yalın, `group:<id>` veya `signal:group:<id>`), gönderenin E.164 numaralarını ya da `uuid:<id>` değerlerini kabul eder.
- `channels.signal.groups`: Signal grup kimliğine (veya `"*"`) göre anahtarlanan grup başına geçersiz kılmalar. Desteklenen alanlar: `requireMention`, `tools`, `toolsBySender`.
- `channels.signal.accounts.<id>.groups`: çok hesaplı kurulumlar için `channels.signal.groups` ayarının hesap başına sürümü.
- `channels.signal.accounts.<id>.aliases`: üst düzey takma adlarla birleştirilen hesap başına takma adlar.
- `channels.signal.replyToMode`: yerel yanıt alıntısı modu, `off | first | all | batched` (varsayılan: `all`).
- `channels.signal.replyToModeByChatType.direct`, `channels.signal.replyToModeByChatType.group`: sohbet türüne göre yerel yanıt alıntısı geçersiz kılmaları.
- `channels.signal.accounts.<id>.replyToMode`, `channels.signal.accounts.<id>.replyToModeByChatType.direct`, `channels.signal.accounts.<id>.replyToModeByChatType.group`: hesap başına yanıt alıntısı geçersiz kılmaları.
- `channels.signal.historyLimit`: bağlama eklenecek en fazla grup mesajı sayısı (0 devre dışı bırakır).
- `channels.signal.dmHistoryLimit`: kullanıcı etkileşimleri cinsinden doğrudan mesaj geçmişi sınırı. Kullanıcı başına geçersiz kılmalar: `channels.signal.dms["<phone_or_uuid>"].historyLimit`.
- `channels.signal.textChunkLimit`: giden parçanın karakter cinsinden boyutu (varsayılan 4000).
- `channels.signal.chunkMode`: uzunluğa göre parçalamadan önce boş satırlarda (paragraf sınırlarında) bölmek için `length` (varsayılan) veya `newline`.
- `channels.signal.mediaMaxMb`: MB cinsinden gelen/giden medya sınırı (varsayılan 8).
- `channels.signal.reactionLevel`: `off | ack | minimal | extensive` (varsayılan `minimal`). [Tepkiler](#reactions-message-tool) bölümüne bakın.
- `channels.signal.reactionNotifications`: `off | own | all | allowlist` (varsayılan `own`) — ajanın başkalarından gelen tepkiler konusunda ne zaman bilgilendirileceğini belirler.
- `channels.signal.reactionAllowlist`: `reactionNotifications: "allowlist"` olduğunda tepkileri ajanı bilgilendiren gönderenler.
- `channels.signal.blockStreaming`, `channels.signal.blockStreamingCoalesce`: kanallar arasında paylaşılan blok modu akış denetimleri. [Akış](/tr/concepts/streaming) bölümüne bakın.

İlgili genel seçenekler:

- `agents.list[].groupChat.mentionPatterns` (Signal yerel bahsetmeleri desteklemez).
- `messages.groupChat.mentionPatterns` (genel yedek).
- `messages.responsePrefix`.

## İlgili

- [Kanallara Genel Bakış](/tr/channels) - desteklenen tüm kanallar
- [Eşleştirme](/tr/channels/pairing) - doğrudan mesaj kimlik doğrulaması ve eşleştirme akışı
- [Gruplar](/tr/channels/groups) - grup sohbeti davranışı ve bahsetme geçidi
- [Kanal Yönlendirme](/tr/channels/channel-routing) - mesajlar için oturum yönlendirmesi
- [Güvenlik](/tr/gateway/security) - erişim modeli ve sağlamlaştırma
