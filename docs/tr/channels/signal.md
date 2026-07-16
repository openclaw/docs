---
read_when:
    - Signal desteğini ayarlama
    - Signal gönderme/alma sorunlarını giderme
summary: signal-cli (yerel daemon veya bbernhard container) üzerinden Signal desteği, kurulum yolları ve numara modeli
title: Signal
x-i18n:
    generated_at: "2026-07-16T17:04:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 3941a5f0cde97b87c46b27f2b865cf473093dad0a5a5ada06b1934466420a6ea
    source_path: channels/signal.md
    workflow: 16
---

Signal, indirilebilir bir kanal pluginidir (`@openclaw/signal`). Gateway, `signal-cli` ile HTTP üzerinden iletişim kurar: yerel daemon (JSON-RPC + SSE) veya [bbernhard/signal-cli-rest-api](https://github.com/bbernhard/signal-cli-rest-api) container'ı (REST + WebSocket). OpenClaw, libsignal'ı bünyesine katmaz.

## Numara modeli (önce bunu okuyun)

- Gateway bir **Signal cihazına**, yani `signal-cli` hesabına bağlanır.
- Botu **kişisel Signal hesabınızda** çalıştırmak, döngü koruması nedeniyle kendi mesajlarınızı yok saymasına yol açar.
- “Bota mesaj gönderdiğimde yanıt versin” kullanım şekli için **ayrı bir bot numarası** kullanın.

## Kurulum

```bash
openclaw plugins install @openclaw/signal
```

Yalın plugin tanımları önce ClawHub'ı, ardından yedek olarak npm'i dener. `openclaw plugins install clawhub:@openclaw/signal` veya `npm:@openclaw/signal` ile bir kaynağı zorunlu kılın. `plugins install`, plugini kaydeder ve etkinleştirir; ayrı bir `enable` adımı gerekmez. Genel kurulum kuralları için [Pluginler](/tr/tools/plugin) bölümüne bakın.

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
    Sihirbaz, `signal-cli` öğesinin `PATH` üzerinde bulunup bulunmadığını algılar ve eksikse kurmayı önerir: Linux x86-64'te resmi yerel GraalVM derlemesini indirir; macOS ve diğer mimarilerde ise Homebrew aracılığıyla kurar. Ardından bot numarasını ve `signal-cli` yolunu ister.

    Etkileşimsiz kurulum için `openclaw channels add --channel signal`, bot telefon numarası amacıyla `--signal-number <e164>`; Signal daemon uç noktası için de `--http-host <host>` ve `--http-port <port>` seçeneklerini kabul eder (varsayılan: `127.0.0.1:8080`).

  </Step>
  <Step title="Hesabı bağlayın veya kaydedin">
    - **QR ile bağlama (en hızlı):** `signal-cli link -n "OpenClaw"`, ardından Signal ile tarayın. [A yoluna](#setup-path-a-link-existing-signal-account-qr) bakın.
    - **SMS ile kayıt:** captcha + SMS doğrulaması kullanılan özel bir numara. [B yoluna](#setup-path-b-register-dedicated-bot-number-sms-linux) bakın.

  </Step>
  <Step title="Doğrulayın ve eşleştirin">
    ```bash
    openclaw gateway call channels.status --params '{"probe":true}'
    ```
    İlk DM'yi gönderin ve eşleştirmeyi onaylayın: `openclaw pairing approve signal <CODE>`.
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

| Alan         | Açıklama                                          |
| ------------ | ------------------------------------------------- |
| `account`    | E.164 biçimindeki bot telefon numarası (`+15551234567`) |
| `cliPath`    | `signal-cli` yolu (`PATH` üzerindeyse `signal-cli`)  |
| `configPath` | `--config` olarak iletilen signal-cli yapılandırma dizini        |
| `dmPolicy`   | DM erişim politikası (`pairing` önerilir)          |
| `allowFrom`  | DM göndermesine izin verilen telefon numaraları veya `uuid:<id>` değerleri |

Çoklu hesap desteği: hesap başına yapılandırma ve isteğe bağlı `name` ile `channels.signal.accounts` kullanın. Ortak kalıp için [Çoklu hesap kanalları](/tr/gateway/config-channels#multi-account-all-channels) bölümüne bakın.

## Nedir?

- Belirlenimci yönlendirme: yanıtlar her zaman Signal'e geri gönderilir.
- DM'ler agent'ın ana oturumunu paylaşır; gruplar yalıtılmıştır (`agent:<agentId>:signal:group:<groupId>`).
- Signal, varsayılan olarak `/config set|unset` tarafından tetiklenen yapılandırma güncellemelerini yazabilir (`commands.config: true` gerektirir). `channels.signal.configWrites: false` ile devre dışı bırakın.

## Kurulum yolu A: mevcut Signal hesabını bağlama (QR)

1. `signal-cli` öğesini (JVM veya yerel derleme) kurun ya da `openclaw channels add` öğesinin sizin için kurmasına izin verin.
2. Bir bot hesabını bağlayın: `signal-cli link -n "OpenClaw"`, ardından QR kodunu Signal'de tarayın.
3. Signal'i yapılandırın ve Gateway'i başlatın.

## Kurulum yolu B: özel bot numarasını kaydetme (SMS, Linux)

Mevcut bir Signal uygulama hesabını bağlamak yerine özel bir bot numarası için bunu kullanın. Aşağıdaki akış Ubuntu 24 üzerinde test edilmiştir.

1. SMS (veya sabit hatlar için sesli doğrulama) alabilen bir numara edinin. Özel bir bot numarası, hesap/oturum çakışmalarını önler.
2. Gateway ana makinesine `signal-cli` öğesini kurun:

```bash
VERSION=$(curl -Ls -o /dev/null -w %{url_effective} https://github.com/AsamK/signal-cli/releases/latest | sed -e 's/^.*\/v//')
curl -L -O "https://github.com/AsamK/signal-cli/releases/download/v${VERSION}/signal-cli-${VERSION}-Linux-native.tar.gz"
sudo tar xf "signal-cli-${VERSION}-Linux-native.tar.gz" -C /opt
sudo ln -sf /opt/signal-cli /usr/local/bin/
signal-cli --version
```

JVM derlemesini (`signal-cli-${VERSION}.tar.gz`) kullanıyorsanız önce bir JRE kurun. `signal-cli` öğesini güncel tutun; üst kaynak, Signal sunucu API'leri değiştikçe eski sürümlerin bozulabileceğini belirtir.

3. Numarayı kaydedin ve doğrulayın:

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register
```

Captcha gerekiyorsa (bu adımı tamamlamak için tarayıcı erişimi gerekir):

1. `https://signalcaptchas.org/registration/generate.html` öğesini açın.
2. Captcha'yı tamamlayın, "Open Signal" içindeki `signalcaptcha://...` bağlantı hedefini kopyalayın.
3. Mümkün olduğunda tarayıcı oturumuyla aynı harici IP üzerinden çalıştırın (captcha tokenlarının süresi hızla dolar).
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

5. DM göndericinizi eşleştirin:
   - Bot numarasına herhangi bir mesaj gönderin.
   - Sunucuda onaylayın: `openclaw pairing approve signal <PAIRING_CODE>`.
   - “Unknown contact” uyarısını önlemek için bot numarasını telefonunuza kişi olarak kaydedin.

<Warning>
Bir telefon numarası hesabını `signal-cli` ile kaydetmek, o numaranın ana Signal uygulaması oturumunun kimlik doğrulamasını kaldırabilir. Özel bir bot numarası tercih edin veya mevcut telefon uygulaması kurulumunuzu korumak için QR ile bağlama modunu kullanın.
</Warning>

Üst kaynak referansları:

- `signal-cli` README: `https://github.com/AsamK/signal-cli`
- Captcha akışı: `https://github.com/AsamK/signal-cli/wiki/Registration-with-captcha`
- Bağlama akışı: `https://github.com/AsamK/signal-cli/wiki/Linking-other-devices-(Provisioning)`

## Harici daemon modu (httpUrl)

`signal-cli` öğesini kendiniz yönetmek için (yavaş JVM soğuk başlatmaları, container başlatma işlemi, paylaşılan CPU'lar), daemon'ı ayrı olarak çalıştırın ve OpenClaw'ı ona yönlendirin:

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

Bu, otomatik başlatmayı ve OpenClaw'ın başlatma beklemesini atlar. Otomatik başlatılan yavaş süreçler için `channels.signal.startupTimeoutMs` değerini ayarlayın.

## Container modu (bbernhard/signal-cli-rest-api)

`signal-cli` öğesini yerel olarak çalıştırmak yerine, `signal-cli` öğesini bir REST + WebSocket arayüzünün arkasında sarmalayan [bbernhard/signal-cli-rest-api](https://github.com/bbernhard/signal-cli-rest-api) Docker container'ını kullanın.

Gereksinimler:

- Gerçek zamanlı mesaj alımı için container **mutlaka** `MODE=json-rpc` ile çalışmalıdır.
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

`apiMode`, OpenClaw'ın hangi protokolü kullanacağını denetler:

| Değer         | Davranış                                                                             |
| ------------- | ------------------------------------------------------------------------------------ |
| `"auto"`      | (Varsayılan) Her iki aktarımı da yoklar; akış, container WebSocket alımını doğrular    |
| `"native"`    | Yerel signal-cli kullanımını zorunlu kılar (`/api/v1/rpc` üzerinde JSON-RPC, `/api/v1/events` üzerinde SSE)         |
| `"container"` | bbernhard container'ını zorunlu kılar (`/v2/send` üzerinde REST, `/v1/receive/{account}` üzerinde WebSocket) |

`apiMode`, `"auto"` olduğunda OpenClaw, yinelenen yoklamaları önlemek için algılanan modu daemon URL'si başına 30 saniye önbelleğe alır (iki aktarım da sağlıklıysa yerel olan kazanır). Container alımı, yalnızca `/v1/receive/{account}` WebSocket'e yükseltildikten sonra akış için seçilir; bunun için `MODE=json-rpc` gerekir.

Container, eşleşen API'leri kullanıma sunduğunda container modu yerel modla aynı Signal işlemlerini destekler: gönderme, alma, ekler, yazıyor göstergeleri, okundu/görüldü bilgileri, tepkiler, gruplar ve biçimlendirilmiş metin. OpenClaw; `group.{base64(internal_id)}` grup kimlikleri ve biçimlendirilmiş metin için `text_mode: "styled"` dâhil olmak üzere yerel Signal RPC çağrılarını container'ın REST yüklerine dönüştürür.

İşletim notları:

- Container moduyla `autoStart: false` kullanın; `apiMode: "container"` seçildiğinde OpenClaw yerel bir daemon başlatmamalıdır.
- Alım için `MODE=json-rpc` kullanın. `MODE=normal`, `/v1/about` öğesinin sağlıklı görünmesini sağlayabilir ancak `/v1/receive/{account}`, WebSocket'e yükseltilmez; bu nedenle OpenClaw, `auto` modunda container alım akışını seçmez.
- `httpUrl` bbernhard REST API'sine işaret ettiğinde `apiMode: "container"`, yerel `signal-cli` JSON-RPC/SSE'ye işaret ettiğinde `"native"`, dağıtım değişebiliyorsa `"auto"` değerini ayarlayın.
- Container ek indirmeleri, yerel modla aynı medya bayt sınırlarına uyar. Sunucu `Content-Length` gönderdiğinde aşırı büyük yanıtlar tamamen arabelleğe alınmadan önce, aksi durumda ise akış sırasında reddedilir.

## Erişim denetimi (DM'ler + gruplar)

DM'ler:

- Varsayılan: `channels.signal.dmPolicy = "pairing"`.
- Bilinmeyen göndericiler bir eşleştirme kodu alır; onaylanana kadar mesajlar yok sayılır (kodların süresi 1 saat sonra dolar).
- `openclaw pairing list signal` ve `openclaw pairing approve signal <CODE>` aracılığıyla onaylayın.
- Eşleştirme, Signal DM'leri için varsayılan token alışverişidir. Ayrıntılar: [Eşleştirme](/tr/channels/pairing)
- Yalnızca UUID içeren göndericiler (`sourceUuid` üzerinden), `channels.signal.allowFrom` içinde `uuid:<id>` olarak saklanır.

Gruplar:

- `channels.signal.groupPolicy = open | allowlist | disabled`.
- `allowlist` ayarlandığında, hangi grupların veya göndericilerin grup yanıtlarını tetikleyebileceğini `channels.signal.groupAllowFrom` denetler; girdiler Signal grup kimlikleri (ham, `group:<id>` veya `signal:group:<id>`), gönderici telefon numaraları, `uuid:<id>` değerleri veya `*` olabilir.
- `channels.signal.groups["<group-id>" | "*"]`, grup davranışını `requireMention`, `tools` ve `toolsBySender` ile geçersiz kılabilir.
- Çoklu hesap kurulumlarında hesap başına geçersiz kılmalar için `channels.signal.accounts.<id>.groups` kullanın.
- Bir Signal grubunu `groupAllowFrom` aracılığıyla izin verilenler listesine eklemek, tek başına bahsetme geçidini devre dışı bırakmaz. Özel olarak yapılandırılmış bir `channels.signal.groups["<group-id>"]` girdisi, `requireMention=true` ayarlanmadığı sürece her grup mesajını işler.
- `requireMention=true` ile Signal'in yerel @bahsetmeleri, yapılandırılmış bahsetme meta verilerinden bot hesabının telefonu veya `accountUuid` ile eşleştirilir. Yapılandırılmış `mentionPatterns`, düz metin yedeği olarak kalır.
- Çalışma zamanı notu: `channels.signal` tamamen eksikse çalışma zamanı, grup denetimleri için `groupPolicy="allowlist"` değerine geri döner (`channels.defaults.groupPolicy` ayarlanmış olsa bile).

Sınırlandırılmış bağlama sahip, bahsetme geçitli grup:

```json5
{
  channels: {
    signal: {
      account: "+15551234567",
      accountUuid: "bot-signal-uuid",
      groupPolicy: "allowlist",
      groupAllowFrom: ["group:<signal-group-id>"],
      historyLimit: 8,
      groups: {
        "<signal-group-id>": { requireMention: true },
      },
    },
  },
  messages: {
    groupChat: {
      mentionPatterns: ["\\bopenclaw\\b"],
    },
  },
}
```

Bottan bahsetmeyen izin verilen grup mesajları sessiz kalır ve yalnızca sınırlı bekleyen geçmiş penceresinde tutulur. Daha sonraki yerel bir @bahsetme veya yedek metin bahsetmesi botu tetiklediğinde OpenClaw bu yakın bağlamı ekler ve aynı gruba yanıt verir. Atlanan eklerin içerikleri indirilmez; bekleyen bağlamda yalnızca kompakt medya yer tutucuları olarak görünebilirler.

## Nasıl çalışır (davranış)

- Yerel mod: `signal-cli` bir artalan hizmeti olarak çalışır; Gateway olayları SSE üzerinden okur.
- Kapsayıcı modu: Gateway REST API üzerinden gönderir ve WebSocket üzerinden alır.
- Gelen mesajlar, paylaşılan kanal zarfına normalleştirilir.
- Yanıtlar her zaman aynı numaraya veya gruba yönlendirilir.
- Arka uç gelen zaman damgasını ve yazarı kabul ettiğinde, gelen mesajlara verilen yanıtlar yerel Signal alıntı meta verilerini içerir; alıntı meta verileri eksikse veya reddedilirse OpenClaw yanıtı normal bir mesaj olarak gönderir.
- Yerel alıntı kullanımını `channels.signal.replyToMode = off | first | all | batched` ile, sohbet türüne göre geçersiz kılmaları ise `channels.signal.replyToModeByChatType.direct/group` ile yapılandırın. `channels.signal.accounts.<id>` altındaki hesap düzeyi değerler önceliklidir.

## Medya + sınırlar

- Giden metin `channels.signal.textChunkLimit` değerine göre parçalara ayrılır (varsayılan 4000).
- İsteğe bağlı yeni satıra göre parçalama: uzunluğa göre parçalamadan önce boş satırlardan (paragraf sınırlarından) bölmek için `channels.signal.streaming.chunkMode="newline"` ayarını kullanın.
- Ekler desteklenir (base64, `signal-cli` üzerinden alınır).
- Sesli not ekleri, `contentType` eksik olduğunda MIME yedeği olarak `signal-cli` dosya adını kullanır; böylece ses transkripsiyonu AAC sesli notlarını yine de sınıflandırabilir.
- Varsayılan medya sınırı: `channels.signal.mediaMaxMb` (varsayılan 8).
- Medya indirmeyi atlamak için `channels.signal.ignoreAttachments` kullanın.
- Grup geçmişi bağlamı `channels.signal.historyLimit` (veya `channels.signal.accounts.*.historyLimit`) kullanır ve bunlar yoksa `messages.groupChat.historyLimit` değerine geri döner. Devre dışı bırakmak için `0` değerini ayarlayın (varsayılan 50).

## Yazma göstergeleri + okundu bilgileri

- **Yazma göstergeleri**: OpenClaw, `signal-cli sendTyping` üzerinden yazma sinyalleri gönderir ve bir yanıt çalışırken bunları yeniler.
- **Okundu bilgileri**: `channels.signal.sendReadReceipts` true olduğunda OpenClaw, izin verilen DM'ler için okundu bilgilerini iletir.
- `signal-cli` gruplar için okundu bilgilerini sunmaz.

## Yaşam döngüsü durum tepkileri

Signal'ın gelen etkileşimlerde paylaşılan kuyruğa alındı/düşünüyor/araç/Compaction/tamamlandı/hata tepki yaşam döngüsünü göstermesine izin vermek için `messages.statusReactions.enabled: true` ayarını kullanın. Signal, tepki hedefi olarak gelen mesajın zaman damgasını kullanır; grup tepkileri, Signal grup kimliği ve hedef yazar olarak özgün gönderenle birlikte gönderilir.

Durum tepkileri ayrıca bir onay tepkisi ve eşleşen bir `messages.ackReactionScope` (`direct`, `group-all`, `group-mentions` veya `all`) gerektirir. Signal durum tepkilerini devre dışı bırakmak için `channels.signal.reactionLevel: "off"` ayarını kullanın.

`messages.removeAckAfterReply: true`, yapılandırılmış bekletme süresinden sonra son durum tepkisini temizler. Aksi takdirde Signal, son tamamlandı/hata durumundan sonra ilk onay tepkisini geri yükler.

## Tepkiler (mesaj aracı)

`message action=react` öğesini `channel=signal` ile kullanın.

- Hedefler: gönderenin E.164 numarası veya UUID'si (eşleştirme çıktısındaki `uuid:<id>` değerini kullanın; yalnızca UUID de çalışır).
- `messageId`, tepki verdiğiniz mesajın Signal zaman damgasıdır.
- Grup tepkileri `targetAuthor` veya `targetAuthorUuid` gerektirir.

```text
message action=react channel=signal target=uuid:123e4567-e89b-12d3-a456-426614174000 messageId=1737630212345 emoji=🔥
message action=react channel=signal target=+15551234567 messageId=1737630212345 emoji=🔥 remove=true
message action=react channel=signal target=signal:group:<groupId> targetAuthor=uuid:<sender-uuid> messageId=1737630212345 emoji=✅
```

Yapılandırma:

- `channels.signal.actions.reactions`: tepki eylemlerini etkinleştirir/devre dışı bırakır (varsayılan true).
- `channels.signal.reactionLevel`: `off | ack | minimal | extensive` (varsayılan `minimal`).
  - `off`/`ack`, ajan tepkilerini devre dışı bırakır (mesaj aracı `react` hata verir).
  - `minimal`/`extensive`, ajan tepkilerini etkinleştirir ve yönlendirme düzeyini ayarlar.
- Hesaba göre geçersiz kılmalar: `channels.signal.accounts.<id>.actions.reactions`, `channels.signal.accounts.<id>.reactionLevel`.

## Onay tepkileri

Signal exec ve Plugin onay istemleri, üst düzey `approvals.exec` ve `approvals.plugin` yönlendirme bloklarını kullanır. Signal'da `channels.signal.execApprovals` bloğu yoktur.

- `👍` bir kez onaylar.
- `👎` reddeder.
- Bir istek kalıcı onay seçeneği sunduğunda `/approve <id> allow-always` kullanın.

Onay tepkilerinin çözümlenmesi, `channels.signal.allowFrom`, `channels.signal.defaultTo` veya eşleşen hesap düzeyi alanlardan açıkça belirtilmiş Signal onaylayıcıları gerektirir. Aynı sohbetteki doğrudan exec onay istemleri, açıkça belirtilmiş onaylayıcılar olmadan da yinelenen yerel `/approve` yedeğini gizleyebilir; onaylayıcısı olmayan grup onaylarında yerel yedek görünür kalır.

## Teslimat hedefleri (CLI/Cron)

- DM'ler: `signal:+15551234567` (veya düz E.164).
- UUID DM'leri: `uuid:<id>` (veya yalnızca UUID).
- Gruplar: `signal:group:<groupId>`.
- Kullanıcı adları: `username:<name>` (Signal hesabınız destekliyorsa).

## Takma adlar

Tekrarlanan Signal hedeflerinde kararlı adlar kullanmak için takma adları yapılandırın. Takma adlar yalnızca OpenClaw tarafındaki yapılandırmadır; Signal kişilerini oluşturmaz veya düzenlemez.

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

Takma adları Signal teslimat hedeflerinin kabul edildiği her yerde kullanın:

```bash
openclaw message send --channel signal --target signal:ops --message "Dağıtım tamamlandı"
```

Hesaba göre takma adlar, üst düzey takma adları devralır ve ad ekleyebilir veya geçersiz kılabilir:

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

`openclaw directory peers list --channel signal` ve `openclaw directory groups list --channel signal`, yapılandırılmış takma adları listeler. Signal dizini yapılandırma desteklidir; Signal kişilerini canlı olarak sorgulamaz veya Signal hesabını değiştirmez.

## Sorun giderme

Önce şu adımları çalıştırın:

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

- Artalan hizmetine erişilebiliyor ancak yanıt yok: hesap/artalan hizmeti ayarlarını (`httpUrl`, `account`) ve alma modunu doğrulayın.
- DM'ler yok sayılıyor: gönderen eşleştirme onayı bekliyor.
- Grup mesajları yok sayılıyor: grup göndereni/bahsetme denetimi teslimatı engelliyor.
- Düzenlemelerden sonra yapılandırma doğrulama hataları: `openclaw doctor --fix` çalıştırın.
- Tanılamada Signal eksik: `channels.signal.enabled: true` değerini doğrulayın.

Ek kontroller:

```bash
openclaw pairing list signal
pgrep -af signal-cli
grep -i "signal" "/tmp/openclaw/openclaw-$(date +%Y-%m-%d).log" | tail -20
```

Önceliklendirme akışı için: [Kanal Sorunlarını Giderme](/tr/channels/troubleshooting).

## Güvenlik notları

- `signal-cli`, hesap anahtarlarını yerel olarak depolar (genellikle `~/.local/share/signal-cli/data/`).
- Sunucu taşıma veya yeniden oluşturma işleminden önce Signal hesap durumunu yedekleyin.
- Açıkça daha geniş DM erişimi istemediğiniz sürece `channels.signal.dmPolicy: "pairing"` ayarını koruyun.
- SMS doğrulaması yalnızca kayıt veya kurtarma akışları için gereklidir; ancak numaranın/hesabın denetimini kaybetmek yeniden kaydı karmaşıklaştırabilir.

## Yapılandırma başvurusu (Signal)

Tam yapılandırma: [Yapılandırma](/tr/gateway/configuration)

Sağlayıcı seçenekleri:

- `channels.signal.enabled`: kanal başlatmayı etkinleştirir/devre dışı bırakır.
- `channels.signal.apiMode`: `auto | native | container` (varsayılan: otomatik). Bkz. [Kapsayıcı modu](#container-mode-bbernhardsignal-cli-rest-api).
- `channels.signal.account`: bot hesabının E.164 numarası.
- `channels.signal.accountUuid`: yerel @bahsetme algılama ve döngü koruması için isteğe bağlı bot hesabı UUID'si.
- `channels.signal.cliPath`: `signal-cli` yolu.
- `channels.signal.configPath`: isteğe bağlı `signal-cli --config` dizini.
- `channels.signal.httpUrl`: tam artalan hizmeti URL'si (ana makine/bağlantı noktasını geçersiz kılar).
- `channels.signal.httpHost`, `channels.signal.httpPort`: artalan hizmeti bağlaması (varsayılan `127.0.0.1:8080`).
- `channels.signal.autoStart`: artalan hizmetini otomatik başlatır (`httpUrl` ayarlanmamışsa varsayılan true).
- `channels.signal.startupTimeoutMs`: ms cinsinden başlangıç bekleme zaman aşımı (en az 1000, sınır 120000; varsayılan 30000).
- `channels.signal.receiveMode`: `on-start | manual`.
- `channels.signal.ignoreAttachments`: ek indirmelerini atlar.
- `channels.signal.ignoreStories`: artalan hizmetinden gelen hikâyeleri yok sayar.
- `channels.signal.sendReadReceipts`: okundu bilgilerini iletir.
- `channels.signal.dmPolicy`: `pairing | allowlist | open | disabled` (varsayılan: eşleştirme).
- `channels.signal.allowFrom`: DM izin listesi (E.164 veya `uuid:<id>`). `open`, `"*"` gerektirir. Signal'da kullanıcı adları yoktur; telefon/UUID kimliklerini kullanın.
- `channels.signal.aliases`: DM veya grup teslimat hedefleri için OpenClaw tarafındaki takma adlar.
- `channels.signal.groupPolicy`: `open | allowlist | disabled` (varsayılan: izin listesi).
- `channels.signal.groupAllowFrom`: grup izin listesi; Signal grup kimliklerini (ham, `group:<id>` veya `signal:group:<id>`), gönderenin E.164 numaralarını veya `uuid:<id>` değerlerini kabul eder.
- `channels.signal.groups`: Signal grup kimliğine (veya `"*"`) göre anahtarlanmış grup başına geçersiz kılmalar. Desteklenen alanlar: `requireMention`, `tools`, `toolsBySender`.
- `channels.signal.accounts.<id>.groups`: çok hesaplı kurulumlar için `channels.signal.groups` ayarının hesap başına sürümü.
- `channels.signal.accounts.<id>.aliases`: üst düzey takma adlarla birleştirilen hesap başına takma adlar.
- `channels.signal.replyToMode`: yerel yanıt alıntısı modu, `off | first | all | batched` (varsayılan: `all`).
- `channels.signal.replyToModeByChatType.direct`, `channels.signal.replyToModeByChatType.group`: sohbet türüne göre yerel yanıt alıntısı geçersiz kılmaları.
- `channels.signal.accounts.<id>.replyToMode`, `channels.signal.accounts.<id>.replyToModeByChatType.direct`, `channels.signal.accounts.<id>.replyToModeByChatType.group`: hesap başına yanıt alıntısı geçersiz kılmaları.
- `channels.signal.historyLimit`: bağlam olarak eklenecek en fazla grup mesajı sayısı (0 devre dışı bırakır).
- `channels.signal.dmHistoryLimit`: kullanıcı etkileşimleri cinsinden DM geçmişi sınırı. Kullanıcı başına geçersiz kılmalar: `channels.signal.dms["<phone_or_uuid>"].historyLimit`.
- `channels.signal.textChunkLimit`: karakter cinsinden giden parça boyutu (varsayılan 4000).
- `channels.signal.streaming.chunkMode`: uzunluğa göre parçalamadan önce boş satırlardan (paragraf sınırlarından) bölmek için `length` (varsayılan) veya `newline`.
- `channels.signal.mediaMaxMb`: MB cinsinden gelen/giden medya sınırı (varsayılan 8).
- `channels.signal.reactionLevel`: `off | ack | minimal | extensive` (varsayılan `minimal`). Bkz. [Tepkiler](#reactions-message-tool).
- `channels.signal.reactionNotifications`: `off | own | all | allowlist` (varsayılan `own`) - ajan başkalarından gelen tepkiler konusunda bilgilendirildiğinde.
- `channels.signal.reactionAllowlist`: `reactionNotifications: "allowlist"` olduğunda tepkileri ajanı bilgilendiren gönderenler.
- `channels.signal.streaming.block.enabled`, `channels.signal.streaming.block.coalesce`: kanallar arasında paylaşılan blok modu akış denetimleri. Bkz. [Akış](/tr/concepts/streaming).

İlgili genel seçenekler:

- `agents.list[].groupChat.mentionPatterns` (düz metin yedeği; bot hesabı kimliği yapılandırıldığında Signal'ın yerel @bahsetmeleri yapılandırılmış meta verilerden algılanır).
- `messages.groupChat.mentionPatterns` (genel yedek).
- `messages.responsePrefix`.

## İlgili

- [Kanallara Genel Bakış](/tr/channels) - desteklenen tüm kanallar
- [Eşleştirme](/tr/channels/pairing) - DM kimlik doğrulaması ve eşleştirme akışı
- [Gruplar](/tr/channels/groups) - grup sohbeti davranışı ve bahsetme koşulu
- [Kanal Yönlendirme](/tr/channels/channel-routing) - iletiler için oturum yönlendirmesi
- [Güvenlik](/tr/gateway/security) - erişim modeli ve sıkılaştırma
