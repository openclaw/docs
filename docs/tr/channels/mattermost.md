---
read_when:
    - Mattermost'u ayarlama
    - Mattermost yönlendirmesinde hata ayıklama
sidebarTitle: Mattermost
summary: Mattermost bot kurulumu ve OpenClaw yapılandırması
title: Mattermost
x-i18n:
    generated_at: "2026-06-28T00:13:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 31ed1c6aaffc4b7a61a06c81a516c2dba6c31ebf31e0e922bbba884f8bf2b661
    source_path: channels/mattermost.md
    workflow: 16
---

Durum: indirilebilir Plugin (bot belirteci + WebSocket olayları). Kanallar, gruplar ve DM'ler desteklenir. Mattermost, kendi sunucunuzda barındırılabilen bir ekip mesajlaşma platformudur; ürün ayrıntıları ve indirmeler için resmi siteye [mattermost.com](https://mattermost.com) adresinden bakın.

## Kurulum

Kanalı yapılandırmadan önce Mattermost'u kurun:

<Tabs>
  <Tab title="npm registry">
    ```bash
    openclaw plugins install @openclaw/mattermost
    ```
  </Tab>
  <Tab title="Local checkout">
    ```bash
    openclaw plugins install ./path/to/local/mattermost-plugin
    ```
  </Tab>
</Tabs>

Ayrıntılar: [Plugins](/tr/tools/plugin)

## Hızlı kurulum

<Steps>
  <Step title="Plugin'in kullanılabilir olduğundan emin olun">
    Yukarıdaki komutla `@openclaw/mattermost` yükleyin, ardından Gateway zaten çalışıyorsa yeniden başlatın.
  </Step>
  <Step title="Bir Mattermost botu oluşturun">
    Bir Mattermost bot hesabı oluşturun ve **bot belirtecini** kopyalayın.
  </Step>
  <Step title="Temel URL'yi kopyalayın">
    Mattermost **temel URL**'sini kopyalayın (ör. `https://chat.example.com`).
  </Step>
  <Step title="OpenClaw'u yapılandırın ve gateway'i başlatın">
    Minimal yapılandırma:

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

  </Step>
</Steps>

## Yerel slash komutları

Yerel slash komutları isteğe bağlıdır. Etkinleştirildiğinde OpenClaw, Mattermost API'si üzerinden `oc_*` slash komutlarını kaydeder ve gateway HTTP sunucusunda callback POST'ları alır.

```json5
{
  channels: {
    mattermost: {
      commands: {
        native: true,
        nativeSkills: true,
        callbackPath: "/api/channels/mattermost/command",
        // Use when Mattermost cannot reach the gateway directly (reverse proxy/public URL).
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Davranış notları">
    - `native: "auto"` Mattermost için varsayılan olarak devre dışıdır. Etkinleştirmek için `native: true` ayarlayın.
    - `callbackUrl` atlanırsa OpenClaw, gateway host/port + `callbackPath` üzerinden bir tane türetir.
    - Çok hesaplı kurulumlarda `commands`, üst düzeyde veya `channels.mattermost.accounts.<id>.commands` altında ayarlanabilir (hesap değerleri üst düzey alanları geçersiz kılar).
    - Komut callback'leri, OpenClaw `oc_*` komutlarını kaydettiğinde Mattermost tarafından döndürülen komut başına belirteçlerle doğrulanır.
    - OpenClaw, her callback'i kabul etmeden önce geçerli Mattermost komut kaydını yeniler; böylece silinmiş veya yeniden oluşturulmuş slash komutlarından kalan eski belirteçler gateway yeniden başlatması olmadan kabul edilmez.
    - Mattermost API'si komutun hâlâ güncel olduğunu doğrulayamazsa callback doğrulaması kapalı kalacak şekilde başarısız olur; başarısız doğrulamalar kısa süreliğine önbelleğe alınır, eşzamanlı aramalar birleştirilir ve yeniden oynatma baskısını sınırlamak için yeni arama başlangıçları komut başına hız sınırına tabi tutulur.
    - Kayıt başarısız olduğunda, başlangıç kısmi olduğunda veya callback belirteci çözümlenen komutun kayıtlı belirteciyle eşleşmediğinde slash callback'leri kapalı kalacak şekilde başarısız olur (bir komut için geçerli olan belirteç, farklı bir komut için upstream doğrulamaya ulaşamaz).

  </Accordion>
  <Accordion title="Erişilebilirlik gereksinimi">
    Callback uç noktası Mattermost sunucusundan erişilebilir olmalıdır.

    - Mattermost, OpenClaw ile aynı host/ağ ad alanında çalışmıyorsa `callbackUrl` değerini `localhost` olarak ayarlamayın.
    - Bu URL, `/api/channels/mattermost/command` yolunu OpenClaw'a reverse proxy yapmıyorsa `callbackUrl` değerini Mattermost temel URL'niz olarak ayarlamayın.
    - Hızlı bir kontrol `curl https://<gateway-host>/api/channels/mattermost/command` komutudur; GET, OpenClaw'dan `404` değil `405 Method Not Allowed` döndürmelidir.

  </Accordion>
  <Accordion title="Mattermost çıkış izin listesi">
    Callback hedefiniz özel/tailnet/dahili adreslere gidiyorsa Mattermost `ServiceSettings.AllowedUntrustedInternalConnections` değerini callback host/domain'i içerecek şekilde ayarlayın.

    Tam URL'ler değil, host/domain girdileri kullanın.

    - İyi: `gateway.tailnet-name.ts.net`
    - Kötü: `https://gateway.tailnet-name.ts.net`

  </Accordion>
</AccordionGroup>

## Ortam değişkenleri (varsayılan hesap)

Env var'ları tercih ediyorsanız bunları gateway host'unda ayarlayın:

- `MATTERMOST_BOT_TOKEN=...`
- `MATTERMOST_URL=https://chat.example.com`

<Note>
Env var'lar yalnızca **varsayılan** hesaba (`default`) uygulanır. Diğer hesaplar yapılandırma değerlerini kullanmalıdır.

`MATTERMOST_URL` bir çalışma alanı `.env` dosyasından ayarlanamaz; bkz. [Çalışma alanı `.env` dosyaları](/tr/gateway/security).
</Note>

## Sohbet modları

Mattermost DM'lere otomatik yanıt verir. Kanal davranışı `chatmode` ile kontrol edilir:

<Tabs>
  <Tab title="oncall (default)">
    Kanallarda yalnızca @bahsedildiğinde yanıt ver.
  </Tab>
  <Tab title="onmessage">
    Her kanal mesajına yanıt ver.
  </Tab>
  <Tab title="onchar">
    Bir mesaj tetikleyici önekle başladığında yanıt ver.
  </Tab>
</Tabs>

Yapılandırma örneği:

```json5
{
  channels: {
    mattermost: {
      chatmode: "onchar",
      oncharPrefixes: [">", "!"],
    },
  },
}
```

Notlar:

- `onchar`, açık @bahsetmelere yine de yanıt verir.
- `channels.mattermost.requireMention` eski yapılandırmalar için dikkate alınır ancak `chatmode` tercih edilir.
- Bot bir kanal iş parçacığında görünür bir yanıt gönderdikten sonra, aynı iş parçacığındaki sonraki mesajlar yeni bir @bahsetme veya `onchar` öneki olmadan yanıtlanır; böylece çok turlu iş parçacığı konuşmaları akmaya devam eder. Katılım, 7 günlük iş parçacığı hareketsizliği boyunca hatırlanır (her yanıtta yenilenir) ve gateway yeniden başlatmaları arasında kalıcıdır. Botun yalnızca gözlemlediği iş parçacıkları etkilenmez; yeniden açık bir bahsetme gerektirmek için yeni bir üst düzey mesaj başlatın.

## İş parçacıkları ve oturumlar

Kanal ve grup yanıtlarının ana kanalda mı kalacağını yoksa tetikleyen gönderinin altında bir iş parçacığı mı başlatacağını kontrol etmek için `channels.mattermost.replyToMode` kullanın.

- `off` (varsayılan): yalnızca gelen gönderi zaten bir iş parçacığındaysa bir iş parçacığında yanıt ver.
- `first`: üst düzey kanal/grup gönderileri için bu gönderinin altında bir iş parçacığı başlat ve konuşmayı iş parçacığı kapsamlı bir oturuma yönlendir.
- `all`: bugün Mattermost için `first` ile aynı davranış.
- Doğrudan mesajlar bu ayarı yok sayar ve iş parçacığı kullanılmadan kalır.

Yapılandırma örneği:

```json5
{
  channels: {
    mattermost: {
      replyToMode: "all",
    },
  },
}
```

Notlar:

- İş parçacığı kapsamlı oturumlar, tetikleyen gönderi id'sini iş parçacığı kökü olarak kullanır.
- `first` ve `all` şu anda eşdeğerdir çünkü Mattermost bir iş parçacığı köküne sahip olduğunda devam parçaları ve medya aynı iş parçacığında devam eder.

## Erişim kontrolü (DM'ler)

- Varsayılan: `channels.mattermost.dmPolicy = "pairing"` (bilinmeyen gönderenler bir eşleştirme kodu alır).
- Şununla onaylayın:
  - `openclaw pairing list mattermost`
  - `openclaw pairing approve mattermost <CODE>`
- Herkese açık DM'ler: `channels.mattermost.dmPolicy="open"` artı `channels.mattermost.allowFrom=["*"]`.
- `channels.mattermost.allowFrom`, `accessGroup:<name>` girdilerini kabul eder. Bkz. [Erişim grupları](/tr/channels/access-groups).

## Kanallar (gruplar)

- Varsayılan: `channels.mattermost.groupPolicy = "allowlist"` (bahsetme kapılı).
- Gönderenleri `channels.mattermost.groupAllowFrom` ile izin listesine alın (kullanıcı ID'leri önerilir).
- `channels.mattermost.groupAllowFrom`, `accessGroup:<name>` girdilerini kabul eder. Bkz. [Erişim grupları](/tr/channels/access-groups).
- Kanal başına bahsetme geçersiz kılmaları `channels.mattermost.groups.<channelId>.requireMention` altında veya varsayılan için `channels.mattermost.groups["*"].requireMention` altında bulunur.
- `@username` eşleştirmesi değişkendir ve yalnızca `channels.mattermost.dangerouslyAllowNameMatching: true` olduğunda etkinleştirilir.
- Açık kanallar: `channels.mattermost.groupPolicy="open"` (bahsetme kapılı).
- Çalışma zamanı notu: `channels.mattermost` tamamen eksikse çalışma zamanı, grup kontrolleri için `groupPolicy="allowlist"` değerine geri döner (`channels.defaults.groupPolicy` ayarlanmış olsa bile).

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

Bu hedef biçimlerini `openclaw message send` veya Cron/Webhook'lar ile kullanın:

- Bir kanal için `channel:<id>`
- Bir DM için `user:<id>`
- Bir DM için `@username` (Mattermost API'si üzerinden çözümlenir)

<Warning>
Çıplak opak ID'ler (`64ifufp...` gibi) Mattermost'ta **belirsizdir** (kullanıcı ID'si veya kanal ID'si).

OpenClaw bunları **önce kullanıcı** olarak çözer:

- ID bir kullanıcı olarak varsa (`GET /api/v4/users/<id>` başarılı olursa), OpenClaw doğrudan kanalı `/api/v4/channels/direct` üzerinden çözerek bir **DM** gönderir.
- Aksi takdirde ID bir **kanal ID'si** olarak değerlendirilir.

Deterministik davranış gerekiyorsa her zaman açık önekleri (`user:<id>` / `channel:<id>`) kullanın.
</Warning>

## DM kanalı yeniden denemesi

OpenClaw bir Mattermost DM hedefine gönderirken önce doğrudan kanalı çözmesi gerektiğinde, varsayılan olarak geçici doğrudan kanal oluşturma hatalarını yeniden dener.

Bu davranışı Mattermost Plugin'i için genel olarak ayarlamak üzere `channels.mattermost.dmChannelRetry` kullanın veya tek bir hesap için `channels.mattermost.accounts.<id>.dmChannelRetry` kullanın.

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

- Bu yalnızca DM kanalı oluşturma (`/api/v4/channels/direct`) için geçerlidir, her Mattermost API çağrısı için değil.
- Yeniden denemeler hız sınırları, 5xx yanıtları ve ağ veya zaman aşımı hataları gibi geçici hatalara uygulanır.
- `429` dışındaki 4xx istemci hataları kalıcı kabul edilir ve yeniden denenmez.

## Önizleme akışı

Mattermost düşünme, araç etkinliği ve kısmi yanıt metnini tek bir **taslak önizleme gönderisine** aktarır; son yanıt gönderilmeye güvenli olduğunda bu gönderi yerinde kesinleşir. Önizleme, kanalı parça başına mesajlarla doldurmak yerine aynı gönderi id'si üzerinde güncellenir. Medya/hata nihai sonuçları bekleyen önizleme düzenlemelerini iptal eder ve tek kullanımlık bir önizleme gönderisini boşaltmak yerine normal teslimatı kullanır.

`channels.mattermost.streaming` üzerinden etkinleştirin:

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
    - `partial` olağan seçimdir: yanıt büyüdükçe düzenlenen, ardından tam yanıtla kesinleştirilen tek bir önizleme gönderisi.
    - `block`, önizleme gönderisi içinde ekleme tarzı taslak parçaları kullanır.
    - `progress`, oluşturma sırasında bir durum önizlemesi gösterir ve yalnızca tamamlandığında son yanıtı gönderir.
    - `off`, önizleme akışını devre dışı bırakır.

  </Accordion>
  <Accordion title="Akış davranışı notları">
    - Akış yerinde kesinleştirilemiyorsa (örneğin gönderi akış ortasında silindiyse), OpenClaw yanıtın asla kaybolmaması için yeni bir nihai gönderi göndermeye geri döner.
    - Yalnızca düşünme içeren yükler, `> Thinking` blok alıntısı olarak gelen metin dahil kanal gönderilerinden bastırılır. Diğer yüzeylerde düşünmeyi görmek için `/reasoning on` ayarlayın; Mattermost nihai gönderisi yalnızca yanıtı tutar.
    - Kanal eşleme matrisi için bkz. [Akış](/tr/concepts/streaming#preview-streaming-modes).

  </Accordion>
</AccordionGroup>

## Tepkiler (mesaj aracı)

- `channel=mattermost` ile `message action=react` kullanın.
- `messageId`, Mattermost gönderi id'sidir.
- `emoji`, `thumbsup` veya `:+1:` gibi adları kabul eder (iki nokta üst üste isteğe bağlıdır).
- Bir tepkiyi kaldırmak için `remove=true` (boolean) ayarlayın.
- Tepki ekleme/kaldırma olayları, yönlendirilen ajan oturumuna sistem olayları olarak iletilir.

Örnekler:

```
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup remove=true
```

Yapılandırma:

- `channels.mattermost.actions.reactions`: tepki eylemlerini etkinleştir/devre dışı bırak (varsayılan true).
- Hesap başına geçersiz kılma: `channels.mattermost.accounts.<id>.actions.reactions`.

## Etkileşimli düğmeler (mesaj aracı)

Tıklanabilir düğmelerle mesajlar gönderin. Bir kullanıcı bir düğmeye tıkladığında ajan seçimi alır ve yanıt verebilir.

Normal ajan yanıtları anlamsal `presentation` yükleri de içerebilir. OpenClaw, değer düğmelerini Mattermost etkileşimli düğmeleri olarak işler, URL düğmelerini ileti metninde görünür tutar ve seçim menülerini okunabilir metne düşürür.

Kanal yeteneklerine `inlineButtons` ekleyerek düğmeleri etkinleştirin:

```json5
{
  channels: {
    mattermost: {
      capabilities: ["inlineButtons"],
    },
  },
}
```

`buttons` parametresiyle `message action=send` kullanın. Düğmeler 2B dizidir (düğme satırları):

```
message action=send channel=mattermost target=channel:<channelId> buttons=[[{"text":"Yes","callback_data":"yes"},{"text":"No","callback_data":"no"}]]
```

Düğme alanları:

<ParamField path="text" type="string" required>
  Görünen etiket.
</ParamField>
<ParamField path="callback_data" type="string" required>
  Tıklamada geri gönderilen değer (eylem kimliği olarak kullanılır).
</ParamField>
<ParamField path="style" type='"default" | "primary" | "danger"'>
  Düğme stili.
</ParamField>

Bir kullanıcı bir düğmeye tıkladığında:

<Steps>
  <Step title="Düğmeler onayla değiştirilir">
    Tüm düğmeler bir onay satırıyla değiştirilir (örn. "✓ **Yes** selected by @user").
  </Step>
  <Step title="Ajan seçimi alır">
    Ajan seçimi gelen ileti olarak alır ve yanıtlar.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Uygulama notları">
    - Düğme geri çağırmaları HMAC-SHA256 doğrulaması kullanır (otomatik, yapılandırma gerekmez).
    - Mattermost, API yanıtlarından geri çağırma verilerini çıkarır (güvenlik özelliği), bu nedenle tıklamada tüm düğmeler kaldırılır - kısmi kaldırma mümkün değildir.
    - Tire veya alt çizgi içeren eylem kimlikleri otomatik olarak temizlenir (Mattermost yönlendirme sınırlaması).

  </Accordion>
  <Accordion title="Yapılandırma ve erişilebilirlik">
    - `channels.mattermost.capabilities`: yetenek dizelerinin dizisi. Ajan sistem isteminde düğmeler aracı açıklamasını etkinleştirmek için `"inlineButtons"` ekleyin.
    - `channels.mattermost.interactions.callbackBaseUrl`: düğme geri çağırmaları için isteğe bağlı harici temel URL (örneğin `https://gateway.example.com`). Mattermost, Gateway'e bağlandığı host üzerinden doğrudan erişemediğinde bunu kullanın.
    - Çok hesaplı kurulumlarda, aynı alanı `channels.mattermost.accounts.<id>.interactions.callbackBaseUrl` altında da ayarlayabilirsiniz.
    - `interactions.callbackBaseUrl` atlanırsa OpenClaw, geri çağırma URL'sini `gateway.customBindHost` + `gateway.port` üzerinden türetir, ardından `http://localhost:<port>` değerine geri döner.
    - Erişilebilirlik kuralı: düğme geri çağırma URL'si Mattermost sunucusundan erişilebilir olmalıdır. `localhost` yalnızca Mattermost ve OpenClaw aynı host/ağ ad alanında çalıştığında işe yarar.
    - Geri çağırma hedefiniz özel/tailnet/dahili ise, host'unu/alan adını Mattermost `ServiceSettings.AllowedUntrustedInternalConnections` alanına ekleyin.

  </Accordion>
</AccordionGroup>

### Doğrudan API entegrasyonu (harici betikler)

Harici betikler ve Webhook'lar, ajanın `message` aracından geçmek yerine düğmeleri doğrudan Mattermost REST API üzerinden gönderebilir. Mümkün olduğunda Plugin'den `buildButtonAttachments()` kullanın; ham JSON gönderiyorsanız şu kuralları izleyin:

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
            id: "mybutton01", // yalnızca alfanümerik - aşağıya bakın
            type: "button", // zorunlu, yoksa tıklamalar sessizce yok sayılır
            name: "Approve", // görünen etiket
            style: "primary", // isteğe bağlı: "default", "primary", "danger"
            integration: {
              url: "https://gateway.example.com/mattermost/interactions/default",
              context: {
                action_id: "mybutton01", // düğme kimliğiyle eşleşmelidir (ad araması için)
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

1. Ekler üst düzey `attachments` içinde değil, `props.attachments` içinde yer alır (sessizce yok sayılır).
2. Her eylem `type: "button"` gerektirir - bu olmadan tıklamalar sessizce yutulur.
3. Her eylem bir `id` alanı gerektirir - Mattermost kimliği olmayan eylemleri yok sayar.
4. Eylem `id` değeri **yalnızca alfanümerik** olmalıdır (`[a-zA-Z0-9]`). Tireler ve alt çizgiler Mattermost'un sunucu tarafı eylem yönlendirmesini bozar (404 döndürür). Kullanmadan önce bunları çıkarın.
5. `context.action_id`, onay iletisinde ham kimlik yerine düğme adının (örn. "Approve") gösterilmesi için düğmenin `id` değeriyle eşleşmelidir.
6. `context.action_id` zorunludur - etkileşim işleyicisi bu olmadan 400 döndürür.

</Warning>

**HMAC belirteci oluşturma**

Gateway, düğme tıklamalarını HMAC-SHA256 ile doğrular. Harici betikler, Gateway'in doğrulama mantığıyla eşleşen belirteçler oluşturmalıdır:

<Steps>
  <Step title="Gizli anahtarı bot belirtecinden türetin">
    `HMAC-SHA256(key="openclaw-mattermost-interactions", data=botToken)`
  </Step>
  <Step title="Bağlam nesnesini oluşturun">
    Bağlam nesnesini `_token` **hariç** tüm alanlarla oluşturun.
  </Step>
  <Step title="Sıralanmış anahtarlarla serileştirin">
    **Sıralanmış anahtarlar** ve **boşluksuz** serileştirin (Gateway, kompakt çıktı üreten sıralı anahtarlarla `JSON.stringify` kullanır).
  </Step>
  <Step title="Yükü imzalayın">
    `HMAC-SHA256(key=secret, data=serializedContext)`
  </Step>
  <Step title="Belirteci ekleyin">
    Ortaya çıkan hex özeti bağlama `_token` olarak ekleyin.
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
    - Python'un `json.dumps` işlevi varsayılan olarak boşluk ekler (`{"key": "val"}`). JavaScript'in kompakt çıktısıyla (`{"key":"val"}`) eşleşmek için `separators=(",", ":")` kullanın.
    - Her zaman **tüm** bağlam alanlarını (`_token` hariç) imzalayın. Gateway `_token` alanını çıkarır ve kalan her şeyi imzalar. Bir alt kümeyi imzalamak sessiz doğrulama hatasına neden olur.
    - `sort_keys=True` kullanın - Gateway imzalamadan önce anahtarları sıralar ve Mattermost yükü depolarken bağlam alanlarını yeniden sıralayabilir.
    - Gizli anahtarı rastgele baytlardan değil, bot belirtecinden türetin (deterministik). Gizli anahtar, düğmeleri oluşturan süreç ile doğrulayan Gateway arasında aynı olmalıdır.

  </Accordion>
</AccordionGroup>

## Dizin bağdaştırıcısı

Mattermost Plugin'i, Mattermost API aracılığıyla kanal ve kullanıcı adlarını çözen bir dizin bağdaştırıcısı içerir. Bu, `openclaw message send` ve Cron/Webhook teslimatlarında `#channel-name` ve `@username` hedeflerini etkinleştirir.

Yapılandırma gerekmez - bağdaştırıcı, hesap yapılandırmasındaki bot belirtecini kullanır.

## Çoklu hesap

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

## Sorun giderme

<AccordionGroup>
  <Accordion title="Kanallarda yanıt yok">
    Botun kanalda olduğundan emin olun ve ondan bahsedin (oncall), bir tetikleyici öneki kullanın (onchar) veya `chatmode: "onmessage"` ayarlayın.
  </Accordion>
  <Accordion title="Kimlik doğrulama veya çoklu hesap hataları">
    - Bot belirtecini, temel URL'yi ve hesabın etkin olup olmadığını kontrol edin.
    - Çoklu hesap sorunları: env var'lar yalnızca `default` hesabına uygulanır.

  </Accordion>
  <Accordion title="Yerel eğik çizgi komutları başarısız oluyor">
    - `Unauthorized: invalid command token.`: OpenClaw geri çağırma belirtecini kabul etmedi. Tipik nedenler:
      - eğik çizgi komut kaydı başlangıçta başarısız oldu veya yalnızca kısmen tamamlandı
      - geri çağırma yanlış Gateway/hesaba ulaşıyor
      - Mattermost hâlâ önceki bir geri çağırma hedefine işaret eden eski komutlara sahip
      - Gateway, eğik çizgi komutlarını yeniden etkinleştirmeden yeniden başlatıldı
    - Yerel eğik çizgi komutları çalışmayı durdurursa günlüklerde `mattermost: failed to register slash commands` veya `mattermost: native slash commands enabled but no commands could be registered` arayın.
    - `callbackUrl` atlanmışsa ve günlükler geri çağırmanın `http://127.0.0.1:18789/...` olarak çözüldüğü konusunda uyarıyorsa, bu URL muhtemelen yalnızca Mattermost, OpenClaw ile aynı host/ağ ad alanında çalıştığında erişilebilirdir. Bunun yerine açıkça harici olarak erişilebilir bir `commands.callbackUrl` ayarlayın.

  </Accordion>
  <Accordion title="Düğme sorunları">
    - Düğmeler beyaz kutular olarak görünür: ajan hatalı biçimlendirilmiş düğme verileri gönderiyor olabilir. Her düğmede hem `text` hem de `callback_data` alanlarının bulunduğunu kontrol edin.
    - Düğmeler işleniyor ancak tıklamalar hiçbir şey yapmıyor: Mattermost sunucu yapılandırmasında `AllowedUntrustedInternalConnections` değerinin `127.0.0.1 localhost` içerdiğini ve ServiceSettings içinde `EnablePostActionIntegration` değerinin `true` olduğunu doğrulayın.
    - Düğmeler tıklamada 404 döndürüyor: düğme `id` değeri büyük olasılıkla tire veya alt çizgi içeriyor. Mattermost'un eylem yönlendiricisi alfanümerik olmayan kimliklerde bozulur. Yalnızca `[a-zA-Z0-9]` kullanın.
    - Gateway günlüklerinde `invalid _token`: HMAC uyuşmazlığı. Tüm bağlam alanlarını (bir alt küme değil) imzaladığınızı, sıralı anahtarlar kullandığınızı ve kompakt JSON (boşluksuz) kullandığınızı kontrol edin. Yukarıdaki HMAC bölümüne bakın.
    - Gateway günlüklerinde `missing _token in context`: `_token` alanı düğmenin bağlamında yok. Entegrasyon yükünü oluştururken dahil edildiğinden emin olun.
    - Onay, düğme adı yerine ham kimliği gösteriyor: `context.action_id`, düğmenin `id` değeriyle eşleşmiyor. Her ikisini de aynı temizlenmiş değere ayarlayın.
    - Ajan düğmelerden haberdar değil: Mattermost kanal yapılandırmasına `capabilities: ["inlineButtons"]` ekleyin.

  </Accordion>
</AccordionGroup>

## İlgili

- [Kanal Yönlendirme](/tr/channels/channel-routing) - iletiler için oturum yönlendirmesi
- [Kanallara Genel Bakış](/tr/channels) - desteklenen tüm kanallar
- [Gruplar](/tr/channels/groups) - grup sohbeti davranışı ve bahsetme kapısı
- [Eşleştirme](/tr/channels/pairing) - DM kimlik doğrulaması ve eşleştirme akışı
- [Güvenlik](/tr/gateway/security) - erişim modeli ve sertleştirme
