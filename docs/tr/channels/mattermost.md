---
read_when:
    - Mattermost'u ayarlama
    - Mattermost yönlendirmesinde hata ayıklama
sidebarTitle: Mattermost
summary: Mattermost bot kurulumu ve OpenClaw yapılandırması
title: Mattermost
x-i18n:
    generated_at: "2026-07-12T12:04:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 246535ff433a678624d997db640d2531d6ce434ea064a23b98abe8a9e7e6a117
    source_path: channels/mattermost.md
    workflow: 16
---

Durum: indirilebilir Plugin (bot belirteci + WebSocket olayları). Kanallar, özel kanallar, grup DM'leri ve DM'ler desteklenir. Mattermost, kendi sunucunuzda barındırabileceğiniz bir ekip mesajlaşma platformudur ([mattermost.com](https://mattermost.com)).

## Kurulum

<Tabs>
  <Tab title="npm kayıt defteri">
    ```bash
    openclaw plugins install @openclaw/mattermost
    ```
  </Tab>
  <Tab title="Yerel çalışma kopyası">
    ```bash
    openclaw plugins install ./path/to/local/mattermost-plugin
    ```
  </Tab>
</Tabs>

Ayrıntılar: [Plugin'ler](/tr/tools/plugin)

## Hızlı kurulum

<Steps>
  <Step title="Plugin'in kullanılabilir olduğundan emin olun">
    Yukarıdaki komutla `@openclaw/mattermost` paketini kurun, ardından Gateway zaten çalışıyorsa yeniden başlatın.
  </Step>
  <Step title="Bir Mattermost botu oluşturun">
    Bir Mattermost bot hesabı oluşturun, **bot belirtecini** kopyalayın ve botu okuması gereken ekiplere ve kanallara ekleyin.
  </Step>
  <Step title="Temel URL'yi kopyalayın">
    Mattermost **temel URL'sini** kopyalayın (ör. `https://chat.example.com`). Sondaki `/api/v4` otomatik olarak kaldırılır.
  </Step>
  <Step title="OpenClaw'u yapılandırın ve Gateway'i başlatın">
    Asgari yapılandırma:

    ```json5
    {
      channels: {
        mattermost: {
          enabled: true,
          botToken: "mm-token",
          baseUrl: "https://chat.example.com",
          dmPolicy: "pairing",
        },
      },
    }
    ```

    Etkileşimsiz alternatif:

    ```bash
    openclaw channels add --channel mattermost --bot-token <token> --http-url https://chat.example.com
    ```

  </Step>
</Steps>

<Note>
Özel/LAN/tailnet adresindeki, kendi sunucunuzda barındırılan Mattermost: giden Mattermost API istekleri, özel ve dahili IP'leri varsayılan olarak engelleyen bir SSRF korumasından geçer. `channels.mattermost.network.dangerouslyAllowPrivateNetwork: true` ile açıkça izin verin (hesap başına: `channels.mattermost.accounts.<id>.network.dangerouslyAllowPrivateNetwork`).
</Note>

## Yerel eğik çizgi komutları

Yerel eğik çizgi komutları isteğe bağlıdır. Etkinleştirildiğinde OpenClaw, botun üyesi olduğu her ekipte `oc_*` eğik çizgi komutlarını kaydeder ve geri çağırma POST isteklerini Gateway HTTP sunucusunda alır.

```json5
{
  channels: {
    mattermost: {
      commands: {
        native: true,
        nativeSkills: true,
        callbackPath: "/api/channels/mattermost/command",
        // Mattermost, Gateway'e doğrudan erişemediğinde kullanın (ters proxy/genel URL).
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
    },
  },
}
```

Kayıtlı komutlar: `/oc_status`, `/oc_model`, `/oc_models`, `/oc_new`, `/oc_help`, `/oc_think`, `/oc_reasoning`, `/oc_verbose`, `/oc_queue`. `nativeSkills: true` olduğunda Skills komutları da `/oc_<skill>` biçiminde kaydedilir.

<AccordionGroup>
  <Accordion title="Davranış notları">
    - `native` ve `nativeSkills` varsayılan olarak `"auto"` değerini kullanır; bu değer Mattermost için devre dışı olarak çözümlenir. Bunları açıkça `true` olarak ayarlayın.
    - `callbackPath` varsayılan olarak `/api/channels/mattermost/command` değerini kullanır.
    - `callbackUrl` belirtilmezse OpenClaw şu adresi türetir: `http://<gateway.customBindHost or localhost>:<gateway.port, default 18789><callbackPath>`. Joker bağlama ana makineleri (`0.0.0.0`, `::`) için `localhost` kullanılır.
    - Çok hesaplı kurulumlarda `commands`, üst düzeyde veya `channels.mattermost.accounts.<id>.commands` altında ayarlanabilir (hesap değerleri üst düzey alanları geçersiz kılar).
    - Diğer entegrasyonlar tarafından aynı tetikleyiciyle oluşturulmuş mevcut eğik çizgi komutlarına dokunulmaz (kayıt sırasında atlanırlar); botun oluşturduğu komutlar, geri çağırma URL'si değiştiğinde güncellenir veya yeniden oluşturulur.
    - Komut geri çağırmaları, OpenClaw `oc_*` komutlarını kaydettiğinde Mattermost tarafından döndürülen komut başına belirteçlerle doğrulanır.
    - OpenClaw, her geri çağırmayı kabul etmeden önce mevcut Mattermost komut kaydını yeniler; böylece silinmiş veya yeniden oluşturulmuş eğik çizgi komutlarının eski belirteçleri, Gateway yeniden başlatılmadan kabul edilmemeye başlar.
    - Mattermost API komutun hâlâ güncel olduğunu doğrulayamazsa geri çağırma doğrulaması güvenli biçimde başarısız olur; başarısız doğrulamalar kısa süreliğine önbelleğe alınır, eşzamanlı sorgular birleştirilir ve yeniden oynatma baskısını sınırlamak için yeni sorgu başlatmaları komut başına hız sınırına tabi tutulur.
    - Kayıt başarısız olduğunda, başlatma kısmen tamamlandığında veya geri çağırma belirteci çözümlenen komutun kayıtlı belirteciyle eşleşmediğinde eğik çizgi geri çağırmaları güvenli biçimde başarısız olur (bir komut için geçerli olan belirteç, farklı bir komutun üst akış doğrulamasına ulaşamaz).
    - Kabul edilen geri çağırmalar, geçici bir "İşleniyor..." yanıtıyla onaylanır; asıl yanıt normal bir mesaj olarak gelir.

  </Accordion>
  <Accordion title="Erişilebilirlik gereksinimi">
    Geri çağırma uç noktasına Mattermost sunucusundan erişilebilmelidir.

    - Mattermost, OpenClaw ile aynı ana makinede/ağ ad alanında çalışmıyorsa `callbackUrl` değerini `localhost` olarak ayarlamayın.
    - Söz konusu URL, `/api/channels/mattermost/command` yolunu OpenClaw'a ters proxy ile yönlendirmiyorsa `callbackUrl` değerini Mattermost temel URL'niz olarak ayarlamayın.
    - Hızlı bir denetim için `curl https://<gateway-host>/api/channels/mattermost/command` komutunu kullanabilirsiniz; bir GET isteği `404` yerine OpenClaw'dan `405 Method Not Allowed` döndürmelidir.

  </Accordion>
  <Accordion title="Mattermost çıkış izin listesi">
    Geri çağırmanız özel/tailnet/dahili adresleri hedefliyorsa Mattermost `ServiceSettings.AllowedUntrustedInternalConnections` ayarını geri çağırma ana makinesini/alan adını içerecek şekilde yapılandırın.

    Tam URL'ler yerine ana makine/alan adı girdileri kullanın.

    - Doğru: `gateway.tailnet-name.ts.net`
    - Yanlış: `https://gateway.tailnet-name.ts.net`

  </Accordion>
</AccordionGroup>

## Ortam değişkenleri (varsayılan hesap)

Ortam değişkenlerini tercih ediyorsanız bunları Gateway ana makinesinde ayarlayın:

- `MATTERMOST_BOT_TOKEN=...`
- `MATTERMOST_URL=https://chat.example.com`

<Note>
Ortam değişkenleri yalnızca **varsayılan** hesaba (`default`) uygulanır. Diğer hesaplar yapılandırma değerlerini kullanmalıdır.

`MATTERMOST_URL`, çalışma alanındaki bir `.env` dosyasından ayarlanamaz; bkz. [Çalışma alanı .env dosyaları](/tr/gateway/security).
</Note>

## Sohbet modları

Mattermost, DM'lere otomatik olarak yanıt verir. Kanal davranışı `chatmode` ile denetlenir:

<Tabs>
  <Tab title="oncall (varsayılan)">
    Kanallarda yalnızca @bahsedildiğinde yanıt verin.
  </Tab>
  <Tab title="onmessage">
    Her kanal mesajına yanıt verin.
  </Tab>
  <Tab title="onchar">
    Bir mesaj tetikleyici önekle başladığında yanıt verin.
  </Tab>
</Tabs>

Yapılandırma örneği:

```json5
{
  channels: {
    mattermost: {
      chatmode: "onchar",
      oncharPrefixes: [">", "!"], // varsayılan
    },
  },
}
```

Notlar:

- `onchar`, açık @bahsetmelere yine yanıt verir.
- `channels.mattermost.requireMention` ayarına yine uyulur ancak `chatmode` tercih edilir. Kanal başına `groups.<channelId>.requireMention` ayarları her ikisinden de önceliklidir.
- Bot bir kanal ileti dizisinde görünür bir yanıt gönderdikten sonra, aynı ileti dizisindeki sonraki mesajlar yeni bir @bahsetme veya `onchar` öneki olmadan yanıtlanır; böylece çok turlu ileti dizisi konuşmaları kesintisiz sürer. Katılım, botun söz konusu ileti dizisine verdiği son yanıttan sonra 7 gün boyunca hatırlanır ve Gateway yeniden başlatmalarında korunur. Botun yalnızca gözlemlediği ileti dizileri bundan etkilenmez; yeniden açık bir bahsetme gerektirmek için yeni bir üst düzey mesaj başlatın.

## İleti dizileri ve oturumlar

Kanal ve grup yanıtlarının ana kanalda kalmasını mı yoksa tetikleyici gönderinin altında bir ileti dizisi başlatmasını mı belirlemek için `channels.mattermost.replyToMode` kullanın.

- `off` (varsayılan): yalnızca gelen gönderi zaten bir ileti dizisindeyse ileti dizisinde yanıt verilir.
- `first`: üst düzey kanal/grup gönderileri için gönderinin altında bir ileti dizisi başlatılır ve konuşma, ileti dizisi kapsamındaki bir oturuma yönlendirilir.
- `all` ve `batched`: Mattermost için günümüzde `first` ile aynı davranır; çünkü Mattermost'ta bir ileti dizisi kökü oluştuktan sonra sonraki parçalar ve medya aynı ileti dizisinde devam eder.
- `replyToMode` ayarlansa bile doğrudan mesajlar varsayılan olarak `off` değerini kullanır.

`direct`, `group` veya `channel` sohbetlerinde modu geçersiz kılmak için `channels.mattermost.replyToModeByChatType` kullanın. Doğrudan mesajları ileti dizilerine dâhil etmek için `direct` değerini ayarlayın:

- `off` (varsayılan): doğrudan mesajlar, tek bir devamlı oturumda ileti dizisi olmadan kalır.
- `first`, `all` veya `batched`: her üst düzey doğrudan mesaj, yeni ve bağımsız bir oturum tarafından desteklenen bir Mattermost ileti dizisi başlatır.

```json5
{
  channels: {
    mattermost: {
      replyToMode: "all",
      replyToModeByChatType: {
        direct: "first",
      },
    },
  },
}
```

Notlar:

- İleti dizisi kapsamındaki oturumlar, tetikleyici gönderi kimliğini ileti dizisi kökü olarak kullanır.
- Mattermost'ta bir ileti dizisi kökü oluştuktan sonra sonraki parçalar ve medya aynı ileti dizisinde devam ettiğinden `first` ile `all` şu anda eşdeğerdir.
- Sohbet türü başına geçersiz kılmalar `replyToMode` ayarından önceliklidir. `direct` geçersiz kılması olmadan mevcut dağıtımlar düz, ileti dizisi içermeyen DM'leri korur.

## Erişim denetimi (DM'ler)

- Varsayılan: `channels.mattermost.dmPolicy = "pairing"` (bilinmeyen gönderenler bir eşleştirme kodu alır). Diğer değerler: `allowlist`, `open`, `disabled`.
- Şu komutlarla onaylayın:
  - `openclaw pairing list mattermost`
  - `openclaw pairing approve mattermost <CODE>`
- Genel DM'ler: `channels.mattermost.dmPolicy="open"` ile birlikte `channels.mattermost.allowFrom=["*"]` kullanın (yapılandırma şeması joker karakteri zorunlu kılar).
- `channels.mattermost.allowFrom`, kullanıcı kimliklerini (önerilir) ve `accessGroup:<name>` girdilerini kabul eder. Bkz. [Erişim grupları](/tr/channels/access-groups).

## Kanallar (gruplar)

- Varsayılan: `channels.mattermost.groupPolicy = "allowlist"` (bahsetme gerekli).
- Gönderenleri `channels.mattermost.groupAllowFrom` ile izin listesine ekleyin (kullanıcı kimlikleri önerilir).
- `channels.mattermost.groupAllowFrom`, `accessGroup:<name>` girdilerini kabul eder. Bkz. [Erişim grupları](/tr/channels/access-groups).
- Kanal başına bahsetme geçersiz kılmaları `channels.mattermost.groups.<channelId>.requireMention` altında veya varsayılan değer için `channels.mattermost.groups["*"].requireMention` altında bulunur.
- `@username` eşleştirmesi değişkendir ve yalnızca `channels.mattermost.dangerouslyAllowNameMatching: true` olduğunda etkinleştirilir.
- Açık kanallar: `channels.mattermost.groupPolicy="open"` (bahsetme gerekli).
- Çözümleme sırası: `channels.mattermost.groupPolicy`, ardından `channels.defaults.groupPolicy`, ardından `"allowlist"`.
- Çalışma zamanı notu: `channels.mattermost` bölümü tamamen eksikse çalışma zamanı, grup denetimlerinde güvenli biçimde `groupPolicy="allowlist"` değerini kullanır (`channels.defaults.groupPolicy` ayarlanmış olsa bile) ve bir defalık uyarı kaydeder.

Örnek:

```json5
{
  channels: {
    mattermost: {
      groupPolicy: "open",
      groups: {
        "*": { requireMention: true },
        "team-channel-id": { requireMention: false },
      },
    },
  },
}
```

## Giden teslimat hedefleri

Bu hedef biçimlerini `openclaw message send` veya Cron/Webhook'larla kullanın:

| Hedef                               | Teslim edildiği yer                                              |
| ----------------------------------- | ---------------------------------------------------------------- |
| `channel:<id>`                      | Kimliğe göre kanal                                               |
| `channel:<name>` veya `#channel-name` | Ada göre kanal; botun ait olduğu ekiplerde aranır                |
| `user:<id>` veya `mattermost:<id>`  | Söz konusu kullanıcıyla DM                                       |
| `@username`                         | DM (kullanıcı adı Mattermost API aracılığıyla çözümlenir)        |

Giden gönderimler mesaj başına en fazla bir eki destekler; birden fazla dosyayı ayrı gönderimlere bölün.

<Warning>
Öneksiz belirsiz kimlikler (`64ifufp...` gibi) Mattermost'ta **anlamca belirsizdir** (kullanıcı kimliği veya kanal kimliği).

OpenClaw bunları **önce kullanıcı** olarak çözümler:

- Kimlik bir kullanıcı olarak mevcutsa (`GET /api/v4/users/<id>` başarılı olursa), OpenClaw doğrudan kanalı `/api/v4/channels/direct` aracılığıyla çözümleyerek bir **DM** gönderir.
- Aksi takdirde kimlik bir **kanal kimliği** olarak değerlendirilir.

Belirlenimci davranış gerekiyorsa her zaman açık önekleri (`user:<id>` / `channel:<id>`) kullanın.
</Warning>

## DM kanalı yeniden denemesi

OpenClaw bir Mattermost DM hedefine gönderim yaparken önce doğrudan kanalı çözümlemesi gerekiyorsa geçici doğrudan kanal oluşturma hatalarını varsayılan olarak yeniden dener.

Bu davranışı Mattermost Plugin'inin tamamı için ayarlamak üzere `channels.mattermost.dmChannelRetry`, tek bir hesap için ayarlamak üzere `channels.mattermost.accounts.<id>.dmChannelRetry` kullanın. Varsayılanlar:

```json5
{
  channels: {
    mattermost: {
      dmChannelRetry: {
        maxRetries: 3,
        initialDelayMs: 1000,
        maxDelayMs: 10000,
        timeoutMs: 30000,
      },
    },
  },
}
```

Notlar:

- Bu yalnızca DM kanalı oluşturma (`/api/v4/channels/direct`) için geçerlidir; tüm Mattermost API çağrıları için geçerli değildir.
- Yeniden denemeler, değişkenlik eklenmiş üstel geri çekilme kullanır ve hız sınırları, 5xx yanıtları ve ağ ya da zaman aşımı hataları gibi geçici arızalara uygulanır.
- `429` dışındaki 4xx istemci hataları kalıcı kabul edilir ve yeniden denenmez.

## Ön izleme akışı

Mattermost; düşünme sürecini, araç etkinliğini ve kısmi yanıt metnini, nihai yanıt güvenle gönderilebildiğinde yerinde son hâline getirilen bir **taslak ön izleme gönderisine** aktarır. `partial` modunda ön izleme, kanalı her parça için ayrı mesajlarla doldurmak yerine aynı gönderi kimliği üzerinde güncellenir. `block` modunda ön izleme, tamamlanmış metin ile araç etkinliği blokları arasında geçiş yapar; böylece önceki bloklar bir sonraki blok tarafından üzerine yazılmak yerine ayrı gönderiler olarak görünür kalır. Medya/hata nihai sonuçları, bekleyen ön izleme düzenlemelerini iptal eder ve geçici bir ön izleme gönderisini tamamlamak yerine normal teslimatı kullanır.

Ön izleme akışı, `partial` modunda **varsayılan olarak açıktır**. `channels.mattermost.streaming` üzerinden yapılandırın (bir mod dizesi, boolean veya `{ mode: "progress" }` gibi bir nesne):

```json5
{
  channels: {
    mattermost: {
      streaming: "partial", // off | partial | block | progress
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Akış modları">
    - `partial` (varsayılan): yanıt büyüdükçe düzenlenen ve ardından eksiksiz yanıtla son hâline getirilen tek bir ön izleme gönderisi.
    - `block`, ön izlemeyi tamamlanmış metin ile araç etkinliği blokları arasında döndürür; böylece her blok yerinde üzerine yazılmak yerine ayrı bir gönderi olarak görünür kalır. Paralel ve ardışık araç güncellemeleri, geçerli araç etkinliği gönderisini paylaşır.
    - `progress`, oluşturma sırasında bir durum ön izlemesi gösterir ve nihai yanıtı yalnızca tamamlandığında gönderir.
    - `off`, ön izleme akışını devre dışı bırakır. `blockStreaming: true` olduğunda tamamlanmış asistan blokları, birleştirilmiş tek bir nihai gönderi yerine normal blok yanıtları (ayrı gönderiler) olarak teslim edilmeye devam eder.

  </Accordion>
  <Accordion title="Akış davranışı notları">
    - Akış yerinde son hâline getirilemiyorsa (örneğin gönderi akış sırasında silindiyse), yanıtın asla kaybolmaması için OpenClaw yeni bir nihai gönderi göndermeye geri döner.
    - Yalnızca düşünme içeren yükler, `> Thinking` blok alıntısı olarak gelen metinler dâhil, kanal gönderilerinden çıkarılır. Düşünme sürecini diğer yüzeylerde görmek için `/reasoning on` ayarını kullanın; Mattermost nihai gönderisi yalnızca yanıtı içerir.
    - Kanal eşleme matrisi için [Akış](/tr/concepts/streaming#preview-streaming-modes) bölümüne bakın.

  </Accordion>
</AccordionGroup>

## Tepkiler (mesaj aracı)

- `channel=mattermost` ile `message action=react` kullanın.
- `messageId`, Mattermost gönderi kimliğidir.
- `emoji`, `thumbsup` veya `:+1:` gibi adları kabul eder (iki nokta isteğe bağlıdır).
- Bir tepkiyi kaldırmak için `remove=true` (boolean) ayarlayın.
- Tepki ekleme/kaldırma olayları, mesajlarla aynı DM/grup politikası denetimlerine tabi olarak yönlendirilen ajan oturumuna sistem olayları şeklinde iletilir.

Örnekler:

```text
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup remove=true
```

Yapılandırma:

- `channels.mattermost.actions.reactions`: tepki eylemlerini etkinleştirir/devre dışı bırakır (varsayılan: true).
- Hesap başına geçersiz kılma: `channels.mattermost.accounts.<id>.actions.reactions`.

## Etkileşimli düğmeler (mesaj aracı)

Tıklanabilir düğmeler içeren mesajlar gönderin. Bir kullanıcı düğmeye tıkladığında ajan seçimi alır ve yanıt verebilir.

Düğmeler, anlamsal `presentation` yükünden gelir (normal ajan yanıtlarında ve `message action=send` içinde). OpenClaw, değer düğmelerini Mattermost etkileşimli düğmeleri olarak işler, URL düğmelerini mesaj metninde görünür tutar ve seçim menülerini okunabilir metne indirger.

```text
message action=send channel=mattermost target=channel:<channelId> presentation={"blocks":[{"type":"buttons","buttons":[{"label":"Yes","value":"yes"},{"label":"No","value":"no"}]}]}
```

Sunum düğmesi alanları:

<ParamField path="label" type="string" required>
  Görüntüleme etiketi (takma ad: `text`).
</ParamField>
<ParamField path="value" type="string">
  Tıklandığında geri gönderilen ve eylem kimliği olarak kullanılan değer (takma adlar: `callback_data`, `callbackData`). `url` ayarlanmadığı sürece tıklanabilir bir düğme için gereklidir.
</ParamField>
<ParamField path="url" type="string">
  Bağlantı düğmesi; etkileşimli bir düğme yerine mesaj gövdesinde `label: url` metni olarak işlenir.
</ParamField>
<ParamField path="style" type='"primary" | "secondary" | "success" | "danger"'>
  Düğme stili. Mattermost, desteklemediği değerlere varsayılan biçimlendirmeyi uygular.
</ParamField>

Ajan sistem isteminde düğme desteğini bildirmek için kanal yeteneklerine `inlineButtons` ekleyin:

```json5
{
  channels: {
    mattermost: {
      capabilities: ["inlineButtons"],
    },
  },
}
```

Bir kullanıcı düğmeye tıkladığında:

<Steps>
  <Step title="Erişim denetimi">
    Tıklayan kişi, mesaj gönderenle aynı DM/grup politikası denetimlerinden geçmelidir; yetkisiz tıklamalara geçici bir bildirim gösterilir ve bunlar yok sayılır.
  </Step>
  <Step title="Düğmeler onayla değiştirilir">
    Tüm düğmeler bir onay satırıyla değiştirilir (ör. "✓ **Yes** selected by @user").
  </Step>
  <Step title="Ajan seçimi alır">
    Ajan, seçimi gelen bir mesaj (ve ayrıca bir sistem olayı) olarak alır ve yanıt verir.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Uygulama notları">
    - Düğme geri çağrıları HMAC-SHA256 doğrulamasını kullanır (otomatiktir, yapılandırma gerekmez).
    - Tıklandığında ek bloğunun tamamı değiştirilir; bu nedenle tüm düğmeler birlikte kaldırılır; kısmi kaldırma mümkün değildir.
    - Kısa çizgi veya alt çizgi içeren eylem kimlikleri otomatik olarak temizlenir (Mattermost yönlendirme sınırlaması).
    - `action_id` değeri özgün gönderideki bir eylemle eşleşmeyen tıklamalar `403` ile reddedilir ("Unknown action").

  </Accordion>
  <Accordion title="Yapılandırma ve erişilebilirlik">
    - `channels.mattermost.capabilities`: yetenek dizeleri dizisi. Ajan sistem isteminde düğmeler aracı açıklamasını etkinleştirmek için `"inlineButtons"` ekleyin.
    - `channels.mattermost.interactions.callbackBaseUrl`: düğme geri çağrıları için isteğe bağlı harici temel URL (örneğin `https://gateway.example.com`). Mattermost, bağlama ana makinesindeki Gateway'e doğrudan erişemediğinde bunu kullanın.
    - Çok hesaplı kurulumlarda aynı alanı `channels.mattermost.accounts.<id>.interactions.callbackBaseUrl` altında da ayarlayabilirsiniz.
    - `interactions.callbackBaseUrl` belirtilmezse OpenClaw geri çağrı URL'sini `gateway.customBindHost` + `gateway.port` (varsayılan 18789) değerlerinden türetir, ardından `http://localhost:<port>` adresine geri döner. Geri çağrı yolu `/mattermost/interactions/<accountId>` şeklindedir.
    - Erişilebilirlik kuralı: düğme geri çağrı URL'sine Mattermost sunucusundan erişilebilmelidir. `localhost`, yalnızca Mattermost ve OpenClaw aynı ana makine/ağ ad alanında çalıştığında kullanılabilir.
    - `channels.mattermost.interactions.allowedSourceIps`: düğme geri çağrıları için kaynak IP izin listesi. Bu ayar olmadan yalnızca local loopback kaynakları (`127.0.0.1`, `::1`) kabul edilir; dolayısıyla uzak bir Mattermost sunucusu burada izin listesine eklenmelidir, aksi takdirde tıklamaları `403` ile reddedilir. Ters proxy arkasındaysanız gerçek istemci IP'sinin iletilen üstbilgilerden türetilmesi için `gateway.trustedProxies` ayarını da yapın.
    - Geri çağrı hedefiniz özel/tailnet/dâhilî ise ana makinesini/alan adını Mattermost `ServiceSettings.AllowedUntrustedInternalConnections` ayarına ekleyin.

  </Accordion>
</AccordionGroup>

### Doğrudan API entegrasyonu (harici betikler)

Harici betikler ve Webhook'lar, ajanın `message` aracından geçmek yerine Mattermost REST API üzerinden doğrudan düğme gönderebilir. Mümkün olduğunda Plugin'deki `buildButtonAttachments()` işlevini kullanın; ham JSON gönderiyorsanız şu kurallara uyun:

**Yük yapısı:**

```json5
{
  channel_id: "<channelId>",
  message: "Choose an option:",
  props: {
    attachments: [
      {
        actions: [
          {
            id: "mybutton01", // alphanumeric only - see below
            type: "button", // required, or clicks are silently ignored
            name: "Approve", // display label
            style: "primary", // optional: "default", "primary", "danger"
            integration: {
              url: "https://gateway.example.com/mattermost/interactions/default",
              context: {
                action_id: "mybutton01", // must match button id
                action: "approve",
                // ... any custom fields ...
                _token: "<hmac>", // see HMAC section below
              },
            },
          },
        ],
      },
    ],
  },
}
```

<Warning>
**Kritik kurallar**

1. Ekler üst düzey `attachments` alanına değil, `props.attachments` alanına yerleştirilmelidir (aksi takdirde sessizce yok sayılır).
2. Her eylem `type: "button"` gerektirir; bu olmadan tıklamalar sessizce yutulur.
3. Her eylem bir `id` alanı gerektirir; Mattermost, kimliği olmayan eylemleri yok sayar.
4. Eylem `id` değeri **yalnızca alfasayısal** olmalıdır (`[a-zA-Z0-9]`). Kısa çizgiler ve alt çizgiler Mattermost'un sunucu tarafındaki eylem yönlendirmesini bozar (404 döndürür). Kullanmadan önce bunları kaldırın.
5. `context.action_id`, düğmenin `id` değeriyle eşleşmelidir; Gateway, `action_id` değeri gönderide bulunmayan tıklamaları reddeder.
6. `context.action_id` gereklidir; etkileşim işleyicisi bu alan olmadan 400 döndürür.
7. Geri çağrı kaynak IP'sine izin verilmelidir (yukarıdaki `interactions.allowedSourceIps` bölümüne bakın).

</Warning>

**HMAC belirteci oluşturma**

Gateway, düğme tıklamalarını HMAC-SHA256 ile doğrular. Harici betikler, Gateway'in doğrulama mantığıyla eşleşen belirteçler oluşturmalıdır:

<Steps>
  <Step title="Gizli anahtarı bot belirtecinden türetin">
    `HMAC-SHA256(key="openclaw-mattermost-interactions", data=botToken)`, onaltılık kodlanmış.
  </Step>
  <Step title="Bağlam nesnesini oluşturun">
    Bağlam nesnesini `_token` dışındaki tüm alanlarla oluşturun.
  </Step>
  <Step title="Sıralanmış anahtarlarla serileştirin">
    **Özyinelemeli olarak sıralanmış anahtarlarla** ve **boşluksuz** serileştirin (Gateway iç içe nesneleri de standartlaştırır ve sıkıştırılmış JSON üretir).
  </Step>
  <Step title="Yükü imzalayın">
    `HMAC-SHA256(key=secret, data=serializedContext)`
  </Step>
  <Step title="Belirteci ekleyin">
    Ortaya çıkan onaltılık özeti bağlama `_token` olarak ekleyin.
  </Step>
</Steps>

Python örneği:

```python
import hmac, hashlib, json

secret = hmac.new(
    b"openclaw-mattermost-interactions",
    bot_token.encode(), hashlib.sha256
).hexdigest()

ctx = {"action_id": "mybutton01", "action": "approve"}
payload = json.dumps(ctx, sort_keys=True, separators=(",", ":"))
token = hmac.new(secret.encode(), payload.encode(), hashlib.sha256).hexdigest()

context = {**ctx, "_token": token}
```

<AccordionGroup>
  <Accordion title="Yaygın HMAC sorunları">
    - Python'ın `json.dumps` işlevi varsayılan olarak boşluk ekler (`{"key": "val"}`). JavaScript'in sıkıştırılmış çıktısıyla (`{"key":"val"}`) eşleşmek için `separators=(",", ":")` kullanın.
    - Her zaman `_token` dışındaki **tüm** bağlam alanlarını imzalayın. Gateway önce `_token` alanını kaldırır, ardından kalan her şeyi imzalar. Bir alt kümeyi imzalamak sessiz doğrulama hatasına neden olur.
    - `sort_keys=True` kullanın; Gateway imzalamadan önce anahtarları sıralar ve Mattermost yükü saklarken bağlam alanlarını yeniden sıralayabilir.
    - Gizli anahtarı rastgele baytlardan değil, bot belirtecinden türetin (belirlenimlidir). Gizli anahtar, düğmeleri oluşturan süreç ile doğrulayan Gateway arasında aynı olmalıdır.

  </Accordion>
</AccordionGroup>

## Dizin bağdaştırıcısı

Mattermost Plugin'i, Mattermost API üzerinden kanal ve kullanıcı adlarını çözümleyen bir dizin bağdaştırıcısı içerir. Bu, `openclaw message send` ile Cron/Webhook teslimatlarında `#channel-name` ve `@username` hedeflerinin kullanılmasını sağlar.

Yapılandırma gerekmez; bağdaştırıcı, hesap yapılandırmasındaki bot belirtecini kullanır.

## Çoklu hesap

Mattermost, `channels.mattermost.accounts` altında birden fazla hesabı destekler:

```json5
{
  channels: {
    mattermost: {
      accounts: {
        default: { name: "Birincil", botToken: "mm-token", baseUrl: "https://chat.example.com" },
        alerts: { name: "Uyarılar", botToken: "mm-token-2", baseUrl: "https://alerts.example.com" },
      },
    },
  },
}
```

Hesap değerleri üst düzey alanları geçersiz kılar; `channels.mattermost.defaultAccount`, herhangi bir hesap belirtilmediğinde hangi hesabın kullanılacağını seçer.

## Sorun giderme

<AccordionGroup>
  <Accordion title="Kanallarda yanıt yok">
    Botun kanalda olduğundan emin olun ve bottan bahsedin (oncall), bir tetikleyici ön eki kullanın (onchar) veya `chatmode: "onmessage"` olarak ayarlayın.
  </Accordion>
  <Accordion title="Kimlik doğrulama veya çoklu hesap hataları">
    - Bot token'ını, temel URL'yi ve hesabın etkin olup olmadığını kontrol edin.
    - Çoklu hesap sorunları: ortam değişkenleri yalnızca `default` hesabına uygulanır.
    - Özel/LAN Mattermost sunucuları için `network.dangerouslyAllowPrivateNetwork: true` gerekir (SSRF koruması varsayılan olarak özel IP'leri engeller).

  </Accordion>
  <Accordion title="Yerel eğik çizgi komutları başarısız oluyor">
    - `Unauthorized: invalid command token.`: OpenClaw geri çağırma token'ını kabul etmedi. Yaygın nedenler:
      - eğik çizgi komutu kaydı başlangıçta başarısız oldu veya yalnızca kısmen tamamlandı
      - geri çağırma yanlış Gateway'e/hesaba ulaşıyor
      - Mattermost'ta hâlâ önceki bir geri çağırma hedefine yönlendiren eski komutlar bulunuyor
      - Gateway, eğik çizgi komutlarını yeniden etkinleştirmeden yeniden başlatıldı
    - Yerel eğik çizgi komutları çalışmayı durdurursa günlüklerde `mattermost: failed to register slash commands` veya `mattermost: native slash commands enabled but no commands could be registered` ifadelerini kontrol edin.
    - `callbackUrl` belirtilmemişse ve günlükler geri çağırmanın `http://localhost:18789/...` gibi bir local loopback URL'sine çözümlendiği konusunda uyarıyorsa, bu URL'ye büyük olasılıkla yalnızca Mattermost, OpenClaw ile aynı ana makinede/ağ ad alanında çalıştığında erişilebilir. Bunun yerine dışarıdan açıkça erişilebilen bir `commands.callbackUrl` ayarlayın.

  </Accordion>
  <Accordion title="Düğme sorunları">
    - Düğmeler beyaz kutular olarak görünüyor veya hiç görünmüyor: düğme verileri hatalı biçimlendirilmiştir. Her sunum düğmesi bir `label` ve bir `value` gerektirir (bunlardan biri eksik olan düğmeler atılır).
    - Düğmeler görüntüleniyor ancak tıklamalar hiçbir şey yapmıyor: Gateway'e Mattermost sunucusundan erişilebildiğini, Mattermost sunucusunun IP'sinin `channels.mattermost.interactions.allowedSourceIps` içinde bulunduğunu (bu olmadan yalnızca loopback kabul edilir) ve özel hedefler için `ServiceSettings.AllowedUntrustedInternalConnections` değerinin geri çağırma ana makinesini içerdiğini doğrulayın.
    - Düğmeler tıklandığında 404 döndürüyor: düğmenin `id` değeri muhtemelen kısa çizgi veya alt çizgi içeriyor. Mattermost'un eylem yönlendiricisi alfasayısal olmayan kimliklerde bozulur. Yalnızca `[a-zA-Z0-9]` kullanın.
    - Gateway günlüklerinde `rejected callback source` görülüyor: tıklama, `interactions.allowedSourceIps` dışındaki bir IP'den geldi. Mattermost sunucusunu veya giriş katmanınızı izin listesine ekleyin ve ters proxy arkasında `gateway.trustedProxies` ayarını yapın.
    - Gateway günlüklerinde `invalid _token` görülüyor: HMAC uyuşmazlığı. Tüm bağlam alanlarını (yalnızca bir alt kümeyi değil) imzaladığınızı, sıralanmış anahtarlar kullandığınızı ve sıkıştırılmış JSON (boşluksuz) kullandığınızı kontrol edin. Yukarıdaki HMAC bölümüne bakın.
    - Gateway günlüklerinde `missing _token in context` görülüyor: `_token` alanı düğmenin bağlamında değil. Entegrasyon yükünü oluştururken bu alanın eklendiğinden emin olun.
    - Gateway, tıklamayı `Unknown action` ile reddediyor: `context.action_id`, gönderideki hiçbir eylemin `id` değeriyle eşleşmiyor. Her ikisini de aynı temizlenmiş değere ayarlayın.
    - Aracı düğmeler sunmuyor: Mattermost kanal yapılandırmasına `capabilities: ["inlineButtons"]` ekleyin.

  </Accordion>
</AccordionGroup>

## İlgili

- [Kanal Yönlendirme](/tr/channels/channel-routing) - iletiler için oturum yönlendirme
- [Kanallara Genel Bakış](/tr/channels) - desteklenen tüm kanallar
- [Gruplar](/tr/channels/groups) - grup sohbeti davranışı ve bahsetme denetimi
- [Eşleştirme](/tr/channels/pairing) - DM kimlik doğrulaması ve eşleştirme akışı
- [Güvenlik](/tr/gateway/security) - erişim modeli ve sağlamlaştırma
