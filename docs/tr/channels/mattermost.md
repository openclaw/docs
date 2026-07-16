---
read_when:
    - Mattermost'u ayarlama
    - Mattermost yönlendirmesinde hata ayıklama
sidebarTitle: Mattermost
summary: Mattermost bot kurulumu ve OpenClaw yapılandırması
title: Mattermost
x-i18n:
    generated_at: "2026-07-16T16:50:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: e7d2233e26c6c0a510a264001a1e0d3e528d8645ffbe2affa3f1672304185ef5
    source_path: channels/mattermost.md
    workflow: 16
---

Durum: indirilebilir plugin (bot belirteci + WebSocket olayları). Kanallar, özel kanallar, grup DM'leri ve DM'ler desteklenir. Mattermost, kendi sunucunuzda barındırılabilen bir ekip mesajlaşma platformudur ([mattermost.com](https://mattermost.com)).

## Kurulum

<Tabs>
  <Tab title="npm kayıt deposu">
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

Ayrıntılar: [Pluginler](/tr/tools/plugin)

## Hızlı kurulum

<Steps>
  <Step title="Pluginin kullanılabilir olduğundan emin olun">
    Yukarıdaki komutla `@openclaw/mattermost` öğesini kurun, ardından Gateway zaten çalışıyorsa yeniden başlatın.
  </Step>
  <Step title="Bir Mattermost botu oluşturun">
    Bir Mattermost bot hesabı oluşturun, **bot belirtecini** kopyalayın ve botu okuması gereken ekiplere ve kanallara ekleyin.
  </Step>
  <Step title="Temel URL'yi kopyalayın">
    Mattermost **temel URL'sini** (ör. `https://chat.example.com`) kopyalayın. Sondaki `/api/v4` otomatik olarak kaldırılır.
  </Step>
  <Step title="OpenClaw'u yapılandırın ve Gateway'i başlatın">
    En küçük yapılandırma:

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
Özel/LAN/tailnet adresindeki, kendi sunucunuzda barındırılan Mattermost: giden Mattermost API istekleri, özel ve dahili IP'leri varsayılan olarak engelleyen bir SSRF korumasından geçer. `channels.mattermost.network.dangerouslyAllowPrivateNetwork: true` ile etkinleştirin (hesap başına: `channels.mattermost.accounts.<id>.network.dangerouslyAllowPrivateNetwork`).
</Note>

## Yerel eğik çizgi komutları

Yerel eğik çizgi komutları isteğe bağlıdır. Etkinleştirildiğinde OpenClaw, botun üyesi olduğu her ekipte `oc_*` eğik çizgi komutlarını kaydeder ve Gateway HTTP sunucusunda geri çağırma POST isteklerini alır.

```json5
{
  channels: {
    mattermost: {
      commands: {
        native: true,
        nativeSkills: true,
        callbackPath: "/api/channels/mattermost/command",
        // Mattermost Gateway'e doğrudan erişemediğinde kullanın (ters proxy/genel URL).
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
    },
  },
}
```

Kayıtlı komutlar: `/oc_status`, `/oc_model`, `/oc_models`, `/oc_new`, `/oc_help`, `/oc_think`, `/oc_reasoning`, `/oc_verbose`, `/oc_queue`. `nativeSkills: true` kullanıldığında Skills komutları da `/oc_<skill>` olarak kaydedilir.

<AccordionGroup>
  <Accordion title="Davranış notları">
    - `native` ve `nativeSkills` varsayılan olarak `"auto"` değerini kullanır; bu değer Mattermost için devre dışı olarak çözümlenir. Bunları açıkça `true` olarak ayarlayın.
    - `callbackPath` varsayılan olarak `/api/channels/mattermost/command` değerini kullanır.
    - `callbackUrl` atlanırsa OpenClaw, `http://<gateway.customBindHost or localhost>:<gateway.port, default 18789><callbackPath>` değerini türetir. Joker karakterli bağlama ana makineleri (`0.0.0.0`, `::`) `localhost` değerine geri döner.
    - Çok hesaplı kurulumlarda `commands`, üst düzeyde veya `channels.mattermost.accounts.<id>.commands` altında ayarlanabilir (hesap değerleri üst düzey alanları geçersiz kılar).
    - Diğer entegrasyonlar tarafından aynı tetikleyiciyle oluşturulan mevcut eğik çizgi komutlarına dokunulmaz (kayıt işlemi bunları atlar); botun oluşturduğu komutlar, geri çağırma URL'si değiştiğinde güncellenir veya yeniden oluşturulur.
    - Komut geri çağırmaları, OpenClaw `oc_*` komutlarını kaydettiğinde Mattermost tarafından döndürülen komut başına belirteçlerle doğrulanır.
    - OpenClaw, her geri çağırmayı kabul etmeden önce mevcut Mattermost komut kaydını yeniler; böylece silinen veya yeniden oluşturulan eğik çizgi komutlarının eski belirteçleri, Gateway yeniden başlatılmadan kabul edilmeyi bırakır.
    - Mattermost API'si komutun hâlâ güncel olduğunu doğrulayamazsa geri çağırma doğrulaması güvenli biçimde başarısız olur; başarısız doğrulamalar kısa süreliğine önbelleğe alınır, eşzamanlı aramalar birleştirilir ve yeniden oynatma baskısını sınırlamak için yeni arama başlatmaları komut başına hız sınırına tabi tutulur.
    - Kayıt başarısız olduğunda, başlatma kısmi olduğunda veya geri çağırma belirteci çözümlenen komutun kayıtlı belirteciyle eşleşmediğinde eğik çizgi geri çağırmaları güvenli biçimde başarısız olur (bir komut için geçerli olan belirteç, farklı bir komutun üst akış doğrulamasına ulaşamaz).
    - Kabul edilen geri çağırmalar, geçici bir "İşleniyor..." yanıtıyla onaylanır; gerçek yanıt normal bir mesaj olarak gelir.

  </Accordion>
  <Accordion title="Erişilebilirlik gereksinimi">
    Geri çağırma uç noktasına Mattermost sunucusundan erişilebilmelidir.

    - Mattermost, OpenClaw ile aynı ana makinede/ağ ad alanında çalışmadığı sürece `callbackUrl` değerini `localhost` olarak ayarlamayın.
    - Bu URL, `/api/channels/mattermost/command` yolunu OpenClaw'a ters proxy ile yönlendirmediği sürece `callbackUrl` değerini Mattermost temel URL'nize ayarlamayın.
    - Hızlı bir denetim için `curl https://<gateway-host>/api/channels/mattermost/command` kullanabilirsiniz; bir GET isteği `404` değil, OpenClaw'dan `405 Method Not Allowed` döndürmelidir.

  </Accordion>
  <Accordion title="Mattermost çıkış izin listesi">
    Geri çağırma hedefiniz özel/tailnet/dahili adreslerse Mattermost `ServiceSettings.AllowedUntrustedInternalConnections` değerini geri çağırma ana makinesini/etki alanını içerecek şekilde ayarlayın.

    Tam URL'ler yerine ana makine/etki alanı girdileri kullanın.

    - Doğru: `gateway.tailnet-name.ts.net`
    - Yanlış: `https://gateway.tailnet-name.ts.net`

  </Accordion>
</AccordionGroup>

## Ortam değişkenleri (varsayılan hesap)

Ortam değişkenlerini tercih ediyorsanız bunları Gateway ana makinesinde ayarlayın:

- `MATTERMOST_BOT_TOKEN=...`
- `MATTERMOST_URL=https://chat.example.com`

<Note>
Ortam değişkenleri yalnızca **varsayılan** hesap (`default`) için geçerlidir. Diğer hesaplar yapılandırma değerlerini kullanmalıdır.

`MATTERMOST_URL`, çalışma alanındaki bir `.env` dosyasından ayarlanamaz; bkz. [Çalışma alanı .env dosyaları](/tr/gateway/security).
</Note>

## Sohbet modları

Mattermost, DM'lere otomatik olarak yanıt verir. Kanal davranışı `chatmode` tarafından denetlenir:

<Tabs>
  <Tab title="oncall (varsayılan)">
    Yalnızca kanallarda @bahsedildiğinde yanıt verin.
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
- `channels.mattermost.requireMention` hâlâ dikkate alınır, ancak `chatmode` tercih edilir. Kanal başına `groups.<channelId>.requireMention` ayarları her ikisinden de önceliklidir.
- Bot bir kanal ileti dizisinde görünür bir yanıt gönderdikten sonra aynı ileti dizisindeki sonraki mesajlar, yeni bir @bahsetme veya `onchar` öneki olmadan yanıtlanır; böylece çok turlu ileti dizisi konuşmaları kesintisiz devam eder. Katılım, botun söz konusu ileti dizisindeki son yanıtından sonra 7 gün boyunca hatırlanır ve Gateway yeniden başlatmaları boyunca korunur. Botun yalnızca gözlemlediği ileti dizileri etkilenmez; yeniden açık bir bahsetme gerektirmek için yeni bir üst düzey mesaj başlatın.

## İleti dizileri ve oturumlar

Kanal ve grup yanıtlarının ana kanalda kalmasını mı yoksa tetikleyen gönderinin altında bir ileti dizisi başlatmasını mı denetlemek için `channels.mattermost.replyToMode` kullanın.

- `off` (varsayılan): yalnızca gelen gönderi zaten bir ileti dizisindeyse ileti dizisinde yanıt verin.
- `first`: üst düzey kanal/grup gönderileri için bu gönderinin altında bir ileti dizisi başlatın ve konuşmayı ileti dizisi kapsamlı bir oturuma yönlendirin.
- `all` ve `batched`: günümüzde Mattermost için `first` ile aynı davranışı gösterir; çünkü Mattermost'ta bir ileti dizisi kökü oluştuğunda sonraki parçalar ve medya aynı ileti dizisinde devam eder.
- Doğrudan mesajlar, `replyToMode` ayarlanmış olsa bile varsayılan olarak `off` değerini kullanır.

`direct`, `group` veya `channel` sohbetlerinin modunu geçersiz kılmak için `channels.mattermost.replyToModeByChatType` kullanın. Doğrudan mesajlarda ileti dizilerini etkinleştirmek için `direct` değerini ayarlayın:

- `off` (varsayılan): doğrudan mesajlar, sürekli ilerleyen tek bir oturumda ileti dizisiz kalır.
- `first`, `all` veya `batched`: her üst düzey doğrudan mesaj, yeni ve bağımsız bir oturumla desteklenen bir Mattermost ileti dizisi başlatır.

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

- İleti dizisi kapsamlı oturumlar, tetikleyen gönderi kimliğini ileti dizisi kökü olarak kullanır.
- `first` ve `all` şu anda eşdeğerdir; çünkü Mattermost'ta bir ileti dizisi kökü oluştuğunda sonraki parçalar ve medya aynı ileti dizisinde devam eder.
- Sohbet türü başına geçersiz kılmalar, `replyToMode` değerinden önceliklidir. Bir `direct` geçersiz kılması olmadığında mevcut dağıtımlar düz, ileti dizisiz DM'leri korur.

## Erişim denetimi (DM'ler)

- Varsayılan: `channels.mattermost.dmPolicy = "pairing"` (bilinmeyen gönderenler bir eşleştirme kodu alır). Diğer değerler: `allowlist`, `open`, `disabled`.
- Şunlarla onaylayın:
  - `openclaw pairing list mattermost`
  - `openclaw pairing approve mattermost <CODE>`
- Herkese açık DM'ler: `channels.mattermost.dmPolicy="open"` ve `channels.mattermost.allowFrom=["*"]` (yapılandırma şeması joker karakteri zorunlu kılar).
- `channels.mattermost.allowFrom`, kullanıcı kimliklerini (önerilir) ve `accessGroup:<name>` girdilerini kabul eder. Bkz. [Erişim grupları](/tr/channels/access-groups).

## Kanallar (gruplar)

- Varsayılan: `channels.mattermost.groupPolicy = "allowlist"` (bahsetme gerekli).
- Gönderenleri `channels.mattermost.groupAllowFrom` ile izin listesine alın (kullanıcı kimlikleri önerilir).
- `channels.mattermost.groupAllowFrom`, `accessGroup:<name>` girdilerini kabul eder. Bkz. [Erişim grupları](/tr/channels/access-groups).
- Kanal başına bahsetme geçersiz kılmaları `channels.mattermost.groups.<channelId>.requireMention` altında, varsayılan değer ise `channels.mattermost.groups["*"].requireMention` altında bulunur.
- `@username` eşleştirmesi değişkendir ve yalnızca `channels.mattermost.dangerouslyAllowNameMatching: true` olduğunda etkinleştirilir.
- Açık kanallar: `channels.mattermost.groupPolicy="open"` (bahsetme gerekli).
- Çözümleme sırası: `channels.mattermost.groupPolicy`, ardından `channels.defaults.groupPolicy`, ardından `"allowlist"`.
- Çalışma zamanı notu: `channels.mattermost` bölümü tamamen eksikse çalışma zamanı, grup denetimleri için (`channels.defaults.groupPolicy` ayarlanmış olsa bile) güvenli biçimde `groupPolicy="allowlist"` değerine döner ve tek seferlik bir uyarı günlüğe kaydeder.

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

`openclaw message send` veya cron/webhook'larla şu hedef biçimlerini kullanın:

| Hedef                               | Teslim edildiği yer                                            |
| ----------------------------------- | -------------------------------------------------------------- |
| `channel:<id>`                      | Kimliğe göre kanal                                             |
| `channel:<name>` veya `#channel-name` | Ada göre kanal; botun üyesi olduğu ekiplerin tamamında aranır  |
| `user:<id>` veya `mattermost:<id>`    | İlgili kullanıcıyla DM                                         |
| `@username`                         | DM (kullanıcı adı Mattermost API aracılığıyla çözümlenir)      |

Giden gönderimler mesaj başına en fazla bir eki destekler; birden fazla dosyayı ayrı gönderimlere bölün.

<Warning>
Öneksiz opak kimlikler (`64ifufp...` gibi) Mattermost'ta **belirsizdir** (kullanıcı kimliği veya kanal kimliği).

OpenClaw bunları **önce kullanıcı** yaklaşımıyla çözümler:

- Kimlik bir kullanıcı olarak mevcutsa (`GET /api/v4/users/<id>` başarılı olursa), OpenClaw doğrudan kanalı `/api/v4/channels/direct` aracılığıyla çözümleyerek bir **DM** gönderir.
- Aksi takdirde kimlik bir **kanal kimliği** olarak değerlendirilir.

Belirlenimci davranış gerekiyorsa her zaman açık önekleri (`user:<id>` / `channel:<id>`) kullanın.
</Warning>

## DM kanalı yeniden denemesi

OpenClaw bir Mattermost DM hedefine gönderim yaptığında ve önce doğrudan kanalı çözümlemesi gerektiğinde, geçici doğrudan kanal oluşturma hatalarını varsayılan olarak yeniden dener.

Bu davranışı Mattermost Plugin'i için genel olarak ayarlamak üzere `channels.mattermost.dmChannelRetry`, tek bir hesap içinse `channels.mattermost.accounts.<id>.dmChannelRetry` kullanın. Varsayılanlar:

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

- Bu, her Mattermost API çağrısına değil, yalnızca DM kanalı oluşturmaya (`/api/v4/channels/direct`) uygulanır.
- Yeniden denemeler, değişken gecikmeli üstel geri çekilme kullanır ve hız sınırları, 5xx yanıtları, ağ ya da zaman aşımı hataları gibi geçici hatalara uygulanır.
- `429` dışındaki 4xx istemci hataları kalıcı kabul edilir ve yeniden denenmez.

## Önizleme akışı

Mattermost; düşünmeyi, araç etkinliğini ve kısmi yanıt metnini, son yanıtın gönderilmesi güvenli olduğunda yerinde son hâline getirilen bir **taslak önizleme gönderisine** aktarır. `partial` modunda önizleme, kanalı her parça için ayrı mesajlarla doldurmak yerine aynı gönderi kimliği üzerinde güncellenir. `block` modunda önizleme, tamamlanan metin ile araç etkinliği blokları arasında dönüşümlü ilerler; böylece önceki bloklar bir sonraki blok tarafından üzerlerine yazılmak yerine ayrı gönderiler olarak görünür kalır. Medya/hata nihai yanıtları, bekleyen önizleme düzenlemelerini iptal eder ve kullanılıp atılacak bir önizleme gönderisini tamamlamak yerine normal teslimatı kullanır.

Önizleme akışı, `partial` modunda **varsayılan olarak açıktır**. `channels.mattermost.streaming.mode` aracılığıyla yapılandırın (eski skaler/boolean `streaming` değerleri `openclaw doctor --fix` tarafından taşınır):

```json5
{
  channels: {
    mattermost: {
      streaming: { mode: "partial" }, // off | partial | block | progress
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Akış modları">
    - `partial` (varsayılan): yanıt büyüdükçe düzenlenen ve ardından eksiksiz yanıtla son hâline getirilen tek bir önizleme gönderisi.
    - `block`, önizlemeyi tamamlanan metin ile araç etkinliği blokları arasında dönüşümlü ilerletir; böylece her blok yerinde üzerine yazılmak yerine ayrı bir gönderi olarak görünür kalır. Paralel ve ardışık araç güncellemeleri, geçerli araç etkinliği gönderisini paylaşır.
    - `progress`, oluşturma sırasında bir durum önizlemesi gösterir ve yalnızca tamamlandığında nihai yanıtı gönderir.
    - `off`, önizleme akışını devre dışı bırakır. `streaming.block.enabled: true` ile tamamlanan asistan blokları, birleştirilmiş tek bir nihai gönderi yerine normal blok yanıtları (ayrı gönderiler) olarak teslim edilmeye devam eder.

  </Accordion>
  <Accordion title="Akış davranışı notları">
    - Akış yerinde son hâline getirilemezse (örneğin gönderi akış sırasında silinirse), yanıtın hiçbir zaman kaybolmaması için OpenClaw yeni bir nihai gönderi göndermeye geri döner.
    - Yalnızca düşünme içeren yüklerin kanal gönderilerinde görünmesi engellenir; buna `> Thinking` blok alıntısı olarak gelen metin de dahildir. Düşünmeyi diğer yüzeylerde görmek için `/reasoning on` ayarlayın; Mattermost nihai gönderisi yalnızca yanıtı içerir.
    - Kanal eşleme matrisi için [Akış](/tr/concepts/streaming#preview-streaming-modes) bölümüne bakın.

  </Accordion>
</AccordionGroup>

## Tepkiler (mesaj aracı)

- `message action=react` öğesini `channel=mattermost` ile kullanın.
- `messageId`, Mattermost gönderi kimliğidir.
- `emoji`, `thumbsup` veya `:+1:` gibi adları kabul eder (iki nokta isteğe bağlıdır).
- Bir tepkiyi kaldırmak için `remove=true` (boolean) değerini ayarlayın.
- Tepki ekleme/kaldırma olayları, mesajlarla aynı DM/grup politikası denetimlerine tabi olarak yönlendirilen ajan oturumuna sistem olayları şeklinde iletilir.

Örnekler:

```text
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup remove=true
```

Yapılandırma:

- `channels.mattermost.actions.reactions`: tepki eylemlerini etkinleştirin/devre dışı bırakın (varsayılan true).
- Hesap başına geçersiz kılma: `channels.mattermost.accounts.<id>.actions.reactions`.

## Etkileşimli düğmeler (mesaj aracı)

Tıklanabilir düğmeler içeren mesajlar gönderin. Bir kullanıcı bir düğmeye tıkladığında ajan seçimi alır ve yanıt verebilir.

Düğmeler, anlamsal `presentation` yükünden gelir (normal ajan yanıtlarında ve `message action=send` içinde). OpenClaw, değer düğmelerini Mattermost etkileşimli düğmeleri olarak işler, URL düğmelerini mesaj metninde görünür tutar ve seçim menülerini okunabilir metne indirger.

```text
message action=send channel=mattermost target=channel:<channelId> presentation={"blocks":[{"type":"buttons","buttons":[{"label":"Yes","value":"yes"},{"label":"No","value":"no"}]}]}
```

Sunum düğmesi alanları:

<ParamField path="label" type="string" required>
  Görünen etiket (diğer ad: `text`).
</ParamField>
<ParamField path="value" type="string">
  Tıklama sırasında geri gönderilen ve eylem kimliği olarak kullanılan değer (diğer adlar: `callback_data`, `callbackData`). `url` ayarlanmadığı sürece tıklanabilir bir düğme için gereklidir.
</ParamField>
<ParamField path="url" type="string">
  Bağlantı düğmesi; etkileşimli bir düğme yerine mesaj gövdesinde `label: url` metni olarak işlenir.
</ParamField>
<ParamField path="style" type='"primary" | "secondary" | "success" | "danger"'>
  Düğme stili. Mattermost, desteklemediği değerlere varsayılan stili uygular.
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

Bir kullanıcı bir düğmeye tıkladığında:

<Steps>
  <Step title="Erişim denetimi">
    Tıklayan kişi, mesaj gönderenle aynı DM/grup politikası denetimlerinden geçmelidir; yetkisiz tıklamalar geçici bir bildirim alır ve yok sayılır.
  </Step>
  <Step title="Düğmeler onayla değiştirilir">
    Tüm düğmeler bir onay satırıyla değiştirilir (ör. "✓ **Yes**, @user tarafından seçildi").
  </Step>
  <Step title="Ajan seçimi alır">
    Ajan, seçimi gelen bir mesaj (ve ayrıca bir sistem olayı) olarak alır ve yanıt verir.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Uygulama notları">
    - Düğme geri çağrıları HMAC-SHA256 doğrulaması kullanır (otomatiktir, yapılandırma gerekmez).
    - Tıklama sırasında ek bloğunun tamamı değiştirilir; bu nedenle tüm düğmeler birlikte kaldırılır ve kısmi kaldırma mümkün değildir.
    - Kısa çizgi veya alt çizgi içeren eylem kimlikleri otomatik olarak arındırılır (Mattermost yönlendirme sınırlaması).
    - `action_id` değeri özgün gönderideki bir eylemle eşleşmeyen tıklamalar, `403` ("Bilinmeyen eylem") ile reddedilir.

  </Accordion>
  <Accordion title="Yapılandırma ve erişilebilirlik">
    - `channels.mattermost.capabilities`: yetenek dizgileri dizisi. Ajan sistem isteminde düğmeler aracı açıklamasını etkinleştirmek için `"inlineButtons"` ekleyin.
    - `channels.mattermost.interactions.callbackBaseUrl`: düğme geri çağrıları için isteğe bağlı harici temel URL (örneğin `https://gateway.example.com`). Mattermost, Gateway'e bağlama ana makinesi üzerinden doğrudan erişemediğinde bunu kullanın.
    - Çok hesaplı kurulumlarda aynı alanı `channels.mattermost.accounts.<id>.interactions.callbackBaseUrl` altında da ayarlayabilirsiniz.
    - `interactions.callbackBaseUrl` belirtilmezse OpenClaw, geri çağrı URL'sini `gateway.customBindHost` + `gateway.port` (varsayılan 18789) değerlerinden türetir, ardından `http://localhost:<port>` değerine geri döner. Geri çağrı yolu `/mattermost/interactions/<accountId>` şeklindedir.
    - Erişilebilirlik kuralı: düğme geri çağrı URL'sine Mattermost sunucusundan erişilebilmelidir. `localhost` yalnızca Mattermost ve OpenClaw aynı ana makinede/ağ ad alanında çalıştığında kullanılabilir.
    - `channels.mattermost.interactions.allowedSourceIps`: düğme geri çağrıları için kaynak IP izin listesi. Bu olmadan yalnızca geri döngü kaynakları (`127.0.0.1`, `::1`) kabul edilir; bu nedenle uzak bir Mattermost sunucusu burada izin listesine eklenmelidir, aksi takdirde tıklamaları `403` ile reddedilir. Ters proxy arkasında, gerçek istemci IP'sinin iletilen üstbilgilerden türetilmesi için ayrıca `gateway.trustedProxies` ayarlayın.
    - Geri çağrı hedefiniz özel/tailnet/dahili ise ana makinesini/alan adını Mattermost `ServiceSettings.AllowedUntrustedInternalConnections` öğesine ekleyin.

  </Accordion>
</AccordionGroup>

### Doğrudan API entegrasyonu (harici betikler)

Harici betikler ve Webhook'lar, ajanın `message` aracından geçmek yerine Mattermost REST API aracılığıyla doğrudan düğme gönderebilir. OpenClaw'ın `message` aracını tercih edin. Doğrudan entegrasyonlar için `@openclaw/mattermost/api.js` içinden `buildButtonAttachments` içe aktarın; ham JSON gönderiyorsanız şu kurallara uyun:

**Yük yapısı:**

```json5
{
  channel_id: "<channelId>",
  message: "Bir seçenek belirleyin:",
  props: {
    attachments: [
      {
        actions: [
          {
            id: "mybutton01", // yalnızca alfasayısal - aşağıya bakın
            type: "button", // gereklidir; aksi takdirde tıklamalar sessizce yok sayılır
            name: "Onayla", // görünen etiket
            style: "primary", // isteğe bağlı: "default", "primary", "danger"
            integration: {
              url: "https://gateway.example.com/mattermost/interactions/default",
              context: {
                action_id: "mybutton01", // düğme kimliğiyle eşleşmelidir
                action: "approve",
                // ... özel alanlar ...
                _token: "<hmac>", // aşağıdaki HMAC bölümüne bakın
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

1. Ekler, üst düzey `attachments` içine değil, `props.attachments` içine yerleştirilir (aksi takdirde sessizce yok sayılır).
2. Her eylem için `type: "button"` gereklidir; bu olmadan tıklamalar sessizce yutulur.
3. Her eylem için bir `id` alanı gereklidir; Mattermost, kimliği olmayan eylemleri yok sayar.
4. Eylem `id` değeri **yalnızca alfasayısal** olmalıdır (`[a-zA-Z0-9]`). Kısa çizgiler ve alt çizgiler Mattermost'un sunucu tarafı eylem yönlendirmesini bozar (404 döndürür). Kullanmadan önce bunları kaldırın.
5. `context.action_id`, düğmenin `id` değeriyle eşleşmelidir; Gateway, `action_id` değeri gönderide bulunmayan tıklamaları reddeder.
6. `context.action_id` gereklidir; etkileşim işleyicisi bu olmadan 400 döndürür.
7. Geri çağrı kaynak IP'sine izin verilmelidir (yukarıdaki `interactions.allowedSourceIps` bölümüne bakın).

</Warning>

**HMAC belirteci oluşturma**

Gateway, düğme tıklamalarını HMAC-SHA256 ile doğrular. Harici betikler, Gateway'in doğrulama mantığıyla eşleşen belirteçler oluşturmalıdır:

<Steps>
  <Step title="Gizli anahtarı bot belirtecinden türetin">
    `HMAC-SHA256(key="openclaw-mattermost-interactions", data=botToken)`, onaltılık olarak kodlanmış.
  </Step>
  <Step title="Bağlam nesnesini oluşturun">
    Bağlam nesnesini `_token` **hariç** tüm alanlarla oluşturun.
  </Step>
  <Step title="Sıralanmış anahtarlarla serileştirin">
    **Özyinelemeli olarak sıralanmış anahtarlarla** ve **boşluk kullanmadan** serileştirin (Gateway, iç içe nesneleri de standartlaştırır ve sıkıştırılmış JSON üretir).
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
  <Accordion title="Yaygın HMAC tuzakları">
    - Python'ın `json.dumps` işlevi varsayılan olarak boşluk ekler (`{"key": "val"}`). JavaScript'in sıkıştırılmış çıktısıyla eşleşmesi için `separators=(",", ":")` kullanın (`{"key":"val"}`).
    - Her zaman **tüm** bağlam alanlarını (`_token` hariç) imzalayın. Gateway, `_token` alanını kaldırır ve ardından kalan her şeyi imzalar. Bir alt kümeyi imzalamak, herhangi bir uyarı vermeden doğrulamanın başarısız olmasına neden olur.
    - `sort_keys=True` kullanın; Gateway, imzalamadan önce anahtarları sıralar ve Mattermost, yükü depolarken bağlam alanlarını yeniden sıralayabilir.
    - Gizli anahtarı rastgele baytlardan değil, bot token'ından (belirlenimsel olarak) türetin. Gizli anahtar, düğmeleri oluşturan süreçte ve doğrulamayı yapan Gateway'de aynı olmalıdır.

  </Accordion>
</AccordionGroup>

## Dizin bağdaştırıcısı

Mattermost Plugin'i, kanal ve kullanıcı adlarını Mattermost API'si aracılığıyla çözümleyen bir dizin bağdaştırıcısı içerir. Bu, `openclaw message send` içindeki `#channel-name` ve `@username` hedeflerinin yanı sıra cron/webhook teslimatlarını etkinleştirir.

Yapılandırma gerekmez; bağdaştırıcı, hesap yapılandırmasındaki bot token'ını kullanır.

## Birden çok hesap

Mattermost, `channels.mattermost.accounts` altında birden çok hesabı destekler:

```json5
{
  channels: {
    mattermost: {
      accounts: {
        default: { name: "Primary", botToken: "mm-token", baseUrl: "https://chat.example.com" },
        alerts: { name: "Alerts", botToken: "mm-token-2", baseUrl: "https://alerts.example.com" },
      },
    },
  },
}
```

Hesap değerleri üst düzey alanları geçersiz kılar; herhangi bir hesap belirtilmediğinde hangi hesabın kullanılacağını `channels.mattermost.defaultAccount` seçer.

## Sorun giderme

<AccordionGroup>
  <Accordion title="Kanallarda yanıt yok">
    Botun kanalda olduğundan emin olun ve bottan bahsedin (oncall), bir tetikleyici öneki kullanın (onchar) veya `chatmode: "onmessage"` ayarını yapın.
  </Accordion>
  <Accordion title="Kimlik doğrulama veya birden çok hesap hataları">
    - Bot token'ını, temel URL'yi ve hesabın etkin olup olmadığını kontrol edin.
    - Birden çok hesap sorunları: ortam değişkenleri yalnızca `default` hesabına uygulanır.
    - Özel/LAN Mattermost ana makineleri `network.dangerouslyAllowPrivateNetwork: true` gerektirir (SSRF koruması varsayılan olarak özel IP'leri engeller).

  </Accordion>
  <Accordion title="Yerel eğik çizgi komutları başarısız oluyor">
    - `Unauthorized: invalid command token.`: OpenClaw geri çağırma token'ını kabul etmedi. Tipik nedenler:
      - eğik çizgi komutu kaydı başlangıçta başarısız oldu veya yalnızca kısmen tamamlandı
      - geri çağırma yanlış Gateway'e/hesaba ulaşıyor
      - Mattermost'ta hâlâ önceki bir geri çağırma hedefini gösteren eski komutlar bulunuyor
      - Gateway, eğik çizgi komutlarını yeniden etkinleştirmeden yeniden başlatıldı
    - Yerel eğik çizgi komutları çalışmayı durdurursa günlüklerde `mattermost: failed to register slash commands` veya `mattermost: native slash commands enabled but no commands could be registered` ifadelerini kontrol edin.
    - `callbackUrl` belirtilmemişse ve günlükler geri çağırmanın `http://localhost:18789/...` gibi bir geri döngü URL'sine çözümlendiği konusunda uyarıyorsa bu URL'ye muhtemelen yalnızca Mattermost, OpenClaw ile aynı ana makinede/ağ ad alanında çalıştığında erişilebilir. Bunun yerine dışarıdan erişilebilen açık bir `commands.callbackUrl` ayarlayın.

  </Accordion>
  <Accordion title="Düğme sorunları">
    - Düğmeler beyaz kutular olarak görünüyor veya hiç görünmüyor: düğme verileri hatalı biçimlendirilmiştir. Her sunum düğmesi bir `label` ve bir `value` gerektirir (bunlardan biri eksik olan düğmeler kaldırılır).
    - Düğmeler görüntüleniyor ancak tıklamalar hiçbir şey yapmıyor: Gateway'e Mattermost sunucusundan erişilebildiğini, Mattermost sunucusunun IP'sinin `channels.mattermost.interactions.allowedSourceIps` içinde yer aldığını (bu ayar olmadan yalnızca geri döngü kabul edilir) ve özel hedefler için `ServiceSettings.AllowedUntrustedInternalConnections` değerinin geri çağırma ana makinesini içerdiğini doğrulayın.
    - Düğmeler tıklandığında 404 döndürüyor: düğmenin `id` değeri muhtemelen kısa çizgi veya alt çizgi içeriyor. Mattermost'un eylem yönlendiricisi alfasayısal olmayan kimliklerle çalışmaz. Yalnızca `[a-zA-Z0-9]` kullanın.
    - Gateway günlüklerinde `rejected callback source` görünüyor: tıklama, `interactions.allowedSourceIps` dışındaki bir IP'den geldi. Mattermost sunucusunu veya giriş noktanızı izin verilenler listesine ekleyin ve ters proxy arkasında `gateway.trustedProxies` ayarını yapın.
    - Gateway günlüklerinde `invalid _token` görünüyor: HMAC uyuşmazlığı. Tüm bağlam alanlarını (bir alt kümeyi değil) imzaladığınızı, sıralanmış anahtarlar kullandığınızı ve sıkıştırılmış JSON (boşluksuz) kullandığınızı kontrol edin. Yukarıdaki HMAC bölümüne bakın.
    - Gateway günlüklerinde `missing _token in context` görünüyor: `_token` alanı düğmenin bağlamında değil. Entegrasyon yükü oluşturulurken bu alanın eklendiğinden emin olun.
    - Gateway, tıklamayı `Unknown action` ile reddediyor: `context.action_id`, gönderideki hiçbir eylem `id` değeriyle eşleşmiyor. Her ikisini de aynı arındırılmış değere ayarlayın.
    - Agent düğme sunmuyor: Mattermost kanal yapılandırmasına `capabilities: ["inlineButtons"]` ekleyin.

  </Accordion>
</AccordionGroup>

## İlgili

- [Kanal Yönlendirme](/tr/channels/channel-routing) - iletiler için oturum yönlendirmesi
- [Kanallara Genel Bakış](/tr/channels) - desteklenen tüm kanallar
- [Gruplar](/tr/channels/groups) - grup sohbeti davranışı ve bahsetme denetimi
- [Eşleştirme](/tr/channels/pairing) - doğrudan mesaj kimlik doğrulaması ve eşleştirme akışı
- [Güvenlik](/tr/gateway/security) - erişim modeli ve sağlamlaştırma
