---
read_when:
    - Mattermost kurulumu
    - Mattermost yönlendirmesinde hata ayıklama
sidebarTitle: Mattermost
summary: Mattermost bot kurulumu ve OpenClaw yapılandırması
title: Mattermost
x-i18n:
    generated_at: "2026-05-10T19:22:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: b58feb699238107c5f61ca0edf204d08b1b7e4e55444f037e8f02ea4147b8fec
    source_path: channels/mattermost.md
    workflow: 16
---

Status: indirilebilir plugin (bot token'ı + WebSocket olayları). Kanallar, gruplar ve DM'ler desteklenir. Mattermost, kendi sunucunuzda barındırılabilen bir ekip mesajlaşma platformudur; ürün ayrıntıları ve indirmeler için resmi siteye [mattermost.com](https://mattermost.com) adresinden bakın.

## Kurulum

Kanalı yapılandırmadan önce Mattermost'u kurun:

<Tabs>
  <Tab title="npm kayıt defteri">
    ```bash
    openclaw plugins install @openclaw/mattermost
    ```
  </Tab>
  <Tab title="Yerel checkout">
    ```bash
    openclaw plugins install ./path/to/local/mattermost-plugin
    ```
  </Tab>
</Tabs>

Ayrıntılar: [Plugin'ler](/tr/tools/plugin)

## Hızlı kurulum

<Steps>
  <Step title="Plugin'in kullanılabilir olduğundan emin olun">
    Mevcut paketlenmiş OpenClaw sürümleri bunu zaten paketler. Daha eski/özel kurulumlar, yukarıdaki komutlarla bunu elle ekleyebilir.
  </Step>
  <Step title="Bir Mattermost bot'u oluşturun">
    Bir Mattermost bot hesabı oluşturun ve **bot token'ını** kopyalayın.
  </Step>
  <Step title="Temel URL'yi kopyalayın">
    Mattermost **temel URL'sini** kopyalayın (ör. `https://chat.example.com`).
  </Step>
  <Step title="OpenClaw'ı yapılandırın ve Gateway'i başlatın">
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

Yerel slash komutları isteğe bağlıdır. Etkinleştirildiğinde OpenClaw, Mattermost API üzerinden `oc_*` slash komutlarını kaydeder ve Gateway HTTP sunucusunda callback POST'larını alır.

```json5
{
  channels: {
    mattermost: {
      commands: {
        native: true,
        nativeSkills: true,
        callbackPath: "/api/channels/mattermost/command",
        // Mattermost Gateway'e doğrudan ulaşamadığında kullanın (reverse proxy/genel URL).
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Davranış notları">
    - `native: "auto"` Mattermost için varsayılan olarak devre dışıdır. Etkinleştirmek için `native: true` ayarlayın.
    - `callbackUrl` atlanırsa OpenClaw, Gateway host/port + `callbackPath` üzerinden bir tane türetir.
    - Çok hesaplı kurulumlarda `commands` üst düzeyde veya `channels.mattermost.accounts.<id>.commands` altında ayarlanabilir (hesap değerleri üst düzey alanları geçersiz kılar).
    - Komut callback'leri, OpenClaw `oc_*` komutlarını kaydettiğinde Mattermost tarafından döndürülen komut başına token'larla doğrulanır.
    - OpenClaw, her callback'i kabul etmeden önce mevcut Mattermost komut kaydını yeniler; böylece silinmiş veya yeniden oluşturulmuş slash komutlarından kalan eski token'lar Gateway yeniden başlatılmadan kabul edilmeyi durdurur.
    - Mattermost API komutun hâlâ güncel olduğunu doğrulayamazsa callback doğrulaması kapalı başarısız olur; başarısız doğrulamalar kısa süreliğine önbelleğe alınır, eşzamanlı aramalar birleştirilir ve tekrar baskısını sınırlamak için yeni arama başlangıçları komut başına hız sınırlamasına tabi tutulur.
    - Kayıt başarısız olduğunda, başlatma kısmi olduğunda veya callback token'ı çözümlenen komutun kayıtlı token'ıyla eşleşmediğinde slash callback'leri kapalı başarısız olur (bir komut için geçerli olan token, farklı bir komut için üst akış doğrulamasına ulaşamaz).

  </Accordion>
  <Accordion title="Erişilebilirlik gereksinimi">
    Callback uç noktası Mattermost sunucusundan erişilebilir olmalıdır.

    - Mattermost, OpenClaw ile aynı host/ağ ad alanında çalışmıyorsa `callbackUrl` değerini `localhost` olarak ayarlamayın.
    - Bu URL `/api/channels/mattermost/command` yolunu OpenClaw'a reverse proxy yapmıyorsa `callbackUrl` değerini Mattermost temel URL'niz olarak ayarlamayın.
    - Hızlı bir kontrol `curl https://<gateway-host>/api/channels/mattermost/command` komutudur; GET, `404` değil, OpenClaw'dan `405 Method Not Allowed` döndürmelidir.

  </Accordion>
  <Accordion title="Mattermost çıkış izin listesi">
    Callback'iniz özel/tailnet/dahili adresleri hedefliyorsa Mattermost `ServiceSettings.AllowedUntrustedInternalConnections` değerini callback host'unu/domain'ini içerecek şekilde ayarlayın.

    Tam URL'ler değil, host/domain girdileri kullanın.

    - Doğru: `gateway.tailnet-name.ts.net`
    - Yanlış: `https://gateway.tailnet-name.ts.net`

  </Accordion>
</AccordionGroup>

## Ortam değişkenleri (varsayılan hesap)

Env vars tercih ediyorsanız bunları Gateway host'unda ayarlayın:

- `MATTERMOST_BOT_TOKEN=...`
- `MATTERMOST_URL=https://chat.example.com`

<Note>
Env vars yalnızca **varsayılan** hesaba (`default`) uygulanır. Diğer hesaplar yapılandırma değerlerini kullanmalıdır.

`MATTERMOST_URL`, çalışma alanı `.env` dosyasından ayarlanamaz; bkz. [Çalışma alanı `.env` dosyaları](/tr/gateway/security).
</Note>

## Sohbet modları

Mattermost DM'lere otomatik olarak yanıt verir. Kanal davranışı `chatmode` tarafından denetlenir:

<Tabs>
  <Tab title="oncall (varsayılan)">
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

- `onchar` açık @bahsetmelere yine yanıt verir.
- `channels.mattermost.requireMention` eski yapılandırmalar için dikkate alınır, ancak `chatmode` tercih edilir.

## Thread'ler ve oturumlar

Kanal ve grup yanıtlarının ana kanalda mı kalacağını yoksa tetikleyen gönderinin altında bir thread mi başlatacağını denetlemek için `channels.mattermost.replyToMode` kullanın.

- `off` (varsayılan): yalnızca gelen gönderi zaten bir thread içindeyse thread içinde yanıt ver.
- `first`: üst düzey kanal/grup gönderileri için, o gönderinin altında bir thread başlat ve konuşmayı thread kapsamlı bir oturuma yönlendir.
- `all`: Mattermost için bugün `first` ile aynı davranış.
- Doğrudan mesajlar bu ayarı yok sayar ve thread'siz kalır.

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

- Thread kapsamlı oturumlar, thread kökü olarak tetikleyen gönderi kimliğini kullanır.
- `first` ve `all` şu anda eşdeğerdir; çünkü Mattermost bir thread köküne sahip olduğunda, devam parçaları ve medya aynı thread içinde devam eder.

## Erişim denetimi (DM'ler)

- Varsayılan: `channels.mattermost.dmPolicy = "pairing"` (bilinmeyen gönderenler bir eşleştirme kodu alır).
- Şununla onaylayın:
  - `openclaw pairing list mattermost`
  - `openclaw pairing approve mattermost <CODE>`
- Genel DM'ler: `channels.mattermost.dmPolicy="open"` artı `channels.mattermost.allowFrom=["*"]`.
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

## Giden teslimat için hedefler

Bu hedef biçimlerini `openclaw message send` veya cron/webhook'larla kullanın:

- Bir kanal için `channel:<id>`
- Bir DM için `user:<id>`
- Bir DM için `@username` (Mattermost API üzerinden çözümlenir)

<Warning>
Çıplak opak ID'ler (`64ifufp...` gibi) Mattermost'ta **belirsizdir** (kullanıcı ID'si ile kanal ID'si).

OpenClaw bunları **önce kullanıcı** olarak çözer:

- ID bir kullanıcı olarak varsa (`GET /api/v4/users/<id>` başarılı olursa), OpenClaw doğrudan kanalı `/api/v4/channels/direct` üzerinden çözerek bir **DM** gönderir.
- Aksi takdirde ID bir **kanal ID'si** olarak değerlendirilir.

Deterministik davranış gerekiyorsa her zaman açık önekleri (`user:<id>` / `channel:<id>`) kullanın.
</Warning>

## DM kanalı yeniden denemesi

OpenClaw bir Mattermost DM hedefine gönderirken önce doğrudan kanalı çözmesi gerektiğinde, geçici doğrudan kanal oluşturma hatalarını varsayılan olarak yeniden dener.

Bu davranışı Mattermost plugin'i için genel olarak ayarlamak üzere `channels.mattermost.dmChannelRetry` kullanın veya tek bir hesap için `channels.mattermost.accounts.<id>.dmChannelRetry` kullanın.

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

- Bu yalnızca DM kanalı oluşturmaya (`/api/v4/channels/direct`) uygulanır, her Mattermost API çağrısına değil.
- Yeniden denemeler; hız limitleri, 5xx yanıtları ve ağ ya da zaman aşımı hataları gibi geçici hatalara uygulanır.
- `429` dışındaki 4xx istemci hataları kalıcı kabul edilir ve yeniden denenmez.

## Önizleme akışı

Mattermost; düşünmeyi, araç etkinliğini ve kısmi yanıt metnini tek bir **taslak önizleme gönderisine** akıtır; nihai yanıt göndermek için güvenli olduğunda bu gönderi yerinde sonlandırılır. Önizleme, kanalı parça başına mesajlarla doldurmak yerine aynı gönderi kimliği üzerinde güncellenir. Medya/hata final'leri bekleyen önizleme düzenlemelerini iptal eder ve atılacak bir önizleme gönderisini göndermek yerine normal teslimatı kullanır.

`channels.mattermost.streaming` ile etkinleştirin:

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
    - `partial` olağan seçimdir: yanıt büyüdükçe düzenlenen ve ardından eksiksiz yanıtla sonlandırılan tek bir önizleme gönderisi.
    - `block`, önizleme gönderisi içinde ekleme tarzı taslak parçaları kullanır.
    - `progress`, oluşturma sırasında bir durum önizlemesi gösterir ve yalnızca tamamlandığında nihai yanıtı gönderir.
    - `off` önizleme akışını devre dışı bırakır.

  </Accordion>
  <Accordion title="Akış davranışı notları">
    - Akış yerinde sonlandırılamazsa (örneğin gönderi akışın ortasında silindiyse), OpenClaw yanıtın asla kaybolmaması için yeni bir nihai gönderi göndermeye geri döner.
    - Yalnızca akıl yürütme içeren payload'lar, `> Reasoning:` blok alıntısı olarak gelen metin dahil olmak üzere kanal gönderilerinden bastırılır. Düşünmeyi diğer yüzeylerde görmek için `/reasoning on` ayarlayın; Mattermost nihai gönderisi yalnızca yanıtı tutar.
    - Kanal eşleme matrisi için bkz. [Akış](/tr/concepts/streaming#preview-streaming-modes).

  </Accordion>
</AccordionGroup>

## Tepkiler (mesaj aracı)

- `channel=mattermost` ile `message action=react` kullanın.
- `messageId`, Mattermost gönderi kimliğidir.
- `emoji`, `thumbsup` veya `:+1:` gibi adları kabul eder (iki nokta üst üste isteğe bağlıdır).
- Bir tepkiyi kaldırmak için `remove=true` (boolean) ayarlayın.
- Tepki ekleme/kaldırma olayları, yönlendirilen agent oturumuna sistem olayları olarak iletilir.

Örnekler:

```
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup remove=true
```

Yapılandırma:

- `channels.mattermost.actions.reactions`: tepki eylemlerini etkinleştir/devre dışı bırak (varsayılan true).
- Hesap başına geçersiz kılma: `channels.mattermost.accounts.<id>.actions.reactions`.

## Etkileşimli düğmeler (mesaj aracı)

Tıklanabilir düğmeler içeren mesajlar gönderin. Bir kullanıcı düğmeye tıkladığında agent seçimi alır ve yanıt verebilir.

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
  Görüntü etiketi.
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
    Tüm düğmeler bir onay satırıyla değiştirilir (ör. "✓ **Yes** selected by @user").
  </Step>
  <Step title="Ajan seçimi alır">
    Ajan seçimi gelen ileti olarak alır ve yanıtlar.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Uygulama notları">
    - Düğme geri çağrıları HMAC-SHA256 doğrulaması kullanır (otomatik, yapılandırma gerekmez).
    - Mattermost, API yanıtlarından geri çağrı verilerini çıkarır (güvenlik özelliği), bu yüzden tıklamada tüm düğmeler kaldırılır - kısmi kaldırma mümkün değildir.
    - Tire veya alt çizgi içeren eylem kimlikleri otomatik olarak temizlenir (Mattermost yönlendirme sınırlaması).

  </Accordion>
  <Accordion title="Yapılandırma ve erişilebilirlik">
    - `channels.mattermost.capabilities`: yetenek dizelerinin dizisi. Ajan sistem isteminde düğmeler aracı açıklamasını etkinleştirmek için `"inlineButtons"` ekleyin.
    - `channels.mattermost.interactions.callbackBaseUrl`: düğme geri çağrıları için isteğe bağlı harici taban URL (örneğin `https://gateway.example.com`). Mattermost, bağlama ana makinesindeki Gateway'e doğrudan ulaşamadığında bunu kullanın.
    - Çok hesaplı kurulumlarda, aynı alanı `channels.mattermost.accounts.<id>.interactions.callbackBaseUrl` altında da ayarlayabilirsiniz.
    - `interactions.callbackBaseUrl` atlanırsa, OpenClaw geri çağrı URL'sini `gateway.customBindHost` + `gateway.port` üzerinden türetir, ardından `http://localhost:<port>` adresine geri döner.
    - Erişilebilirlik kuralı: düğme geri çağrı URL'sine Mattermost sunucusundan erişilebilmelidir. `localhost` yalnızca Mattermost ve OpenClaw aynı ana makinede/ağ ad alanında çalıştığında çalışır.
    - Geri çağrı hedefiniz özel/tailnet/dahili ise, ana makinesini/alan adını Mattermost `ServiceSettings.AllowedUntrustedInternalConnections` listesine ekleyin.

  </Accordion>
</AccordionGroup>

### Doğrudan API entegrasyonu (harici betikler)

Harici betikler ve Webhook'lar, ajanın `message` aracından geçmek yerine Mattermost REST API üzerinden doğrudan düğme gönderebilir. Mümkün olduğunda Plugin'den `buildButtonAttachments()` kullanın; ham JSON gönderiyorsanız şu kuralları izleyin:

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
                action_id: "mybutton01", // must match button id (for name lookup)
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

1. Ekler üst düzey `attachments` içine değil, `props.attachments` içine gider (sessizce yok sayılır).
2. Her eylem `type: "button"` gerektirir - bu olmadan tıklamalar sessizce yutulur.
3. Her eylem bir `id` alanı gerektirir - Mattermost, kimliği olmayan eylemleri yok sayar.
4. Eylem `id` değeri **yalnızca alfanümerik** olmalıdır (`[a-zA-Z0-9]`). Tireler ve alt çizgiler Mattermost'un sunucu tarafı eylem yönlendirmesini bozar (404 döndürür). Kullanmadan önce bunları kaldırın.
5. Onay iletisinin ham kimlik yerine düğme adını (ör. "Approve") göstermesi için `context.action_id`, düğmenin `id` değeriyle eşleşmelidir.
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
  <Step title="Sıralı anahtarlarla serileştirin">
    **Sıralı anahtarlarla** ve **boşluksuz** serileştirin (Gateway, kompakt çıktı üreten sıralı anahtarlarla `JSON.stringify` kullanır).
  </Step>
  <Step title="Yükü imzalayın">
    `HMAC-SHA256(key=secret, data=serializedContext)`
  </Step>
  <Step title="Belirteci ekleyin">
    Ortaya çıkan onaltılık özeti bağlamda `_token` olarak ekleyin.
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
    - Python'ın `json.dumps` işlevi varsayılan olarak boşluk ekler (`{"key": "val"}`). JavaScript'in kompakt çıktısıyla (`{"key":"val"}`) eşleşmek için `separators=(",", ":")` kullanın.
    - Her zaman **tüm** bağlam alanlarını imzalayın (`_token` hariç). Gateway `_token` alanını çıkarır, sonra kalan her şeyi imzalar. Bir alt kümeyi imzalamak sessiz doğrulama hatasına neden olur.
    - `sort_keys=True` kullanın - Gateway imzalamadan önce anahtarları sıralar ve Mattermost yükü saklarken bağlam alanlarını yeniden sıralayabilir.
    - Gizli anahtarı rastgele baytlardan değil, bot belirtecinden türetin (deterministik). Gizli anahtar, düğmeleri oluşturan süreç ile doğrulayan Gateway arasında aynı olmalıdır.

  </Accordion>
</AccordionGroup>

## Dizin bağdaştırıcısı

Mattermost Plugin'i, Mattermost API üzerinden kanal ve kullanıcı adlarını çözen bir dizin bağdaştırıcısı içerir. Bu, `openclaw message send` ve cron/webhook teslimatlarında `#channel-name` ve `@username` hedeflerini etkinleştirir.

Yapılandırma gerekmez - bağdaştırıcı hesap yapılandırmasındaki bot belirtecini kullanır.

## Çok hesap

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
  <Accordion title="Kimlik doğrulama veya çok hesap hataları">
    - Bot belirtecini, taban URL'yi ve hesabın etkin olup olmadığını kontrol edin.
    - Çok hesap sorunları: ortam değişkenleri yalnızca `default` hesabına uygulanır.

  </Accordion>
  <Accordion title="Yerel eğik çizgi komutları başarısız oluyor">
    - `Unauthorized: invalid command token.`: OpenClaw geri çağrı belirtecini kabul etmedi. Tipik nedenler:
      - eğik çizgi komutu kaydı başlangıçta başarısız oldu veya yalnızca kısmen tamamlandı
      - geri çağrı yanlış Gateway/hesaba gidiyor
      - Mattermost hâlâ önceki bir geri çağrı hedefini işaret eden eski komutlara sahip
      - Gateway, eğik çizgi komutlarını yeniden etkinleştirmeden yeniden başlatıldı
    - Yerel eğik çizgi komutları çalışmayı durdurursa, günlüklerde `mattermost: failed to register slash commands` veya `mattermost: native slash commands enabled but no commands could be registered` arayın.
    - `callbackUrl` atlanırsa ve günlükler geri çağrının `http://127.0.0.1:18789/...` olarak çözümlendiği konusunda uyarırsa, bu URL muhtemelen yalnızca Mattermost, OpenClaw ile aynı ana makinede/ağ ad alanında çalıştığında erişilebilirdir. Bunun yerine açıkça harici olarak erişilebilir bir `commands.callbackUrl` ayarlayın.

  </Accordion>
  <Accordion title="Düğme sorunları">
    - Düğmeler beyaz kutular olarak görünür: ajan hatalı biçimlendirilmiş düğme verileri gönderiyor olabilir. Her düğmede hem `text` hem de `callback_data` alanlarının bulunduğunu kontrol edin.
    - Düğmeler oluşturulur ama tıklamalar hiçbir şey yapmaz: Mattermost sunucu yapılandırmasındaki `AllowedUntrustedInternalConnections` değerinin `127.0.0.1 localhost` içerdiğini ve ServiceSettings içinde `EnablePostActionIntegration` değerinin `true` olduğunu doğrulayın.
    - Düğmeler tıklamada 404 döndürür: düğme `id` değeri muhtemelen tire veya alt çizgi içeriyor. Mattermost'un eylem yönlendiricisi alfanümerik olmayan kimliklerde bozulur. Yalnızca `[a-zA-Z0-9]` kullanın.
    - Gateway günlükleri `invalid _token`: HMAC uyumsuzluğu. Tüm bağlam alanlarını (bir alt küme değil) imzaladığınızı, sıralı anahtarlar kullandığınızı ve kompakt JSON (boşluksuz) kullandığınızı kontrol edin. Yukarıdaki HMAC bölümüne bakın.
    - Gateway günlükleri `missing _token in context`: `_token` alanı düğmenin bağlamında yok. Entegrasyon yükü oluşturulurken dahil edildiğinden emin olun.
    - Onay, düğme adı yerine ham kimlik gösteriyor: `context.action_id`, düğmenin `id` değeriyle eşleşmiyor. Her ikisini de aynı temizlenmiş değere ayarlayın.
    - Ajan düğmeleri bilmiyor: Mattermost kanal yapılandırmasına `capabilities: ["inlineButtons"]` ekleyin.

  </Accordion>
</AccordionGroup>

## İlgili

- [Kanal Yönlendirme](/tr/channels/channel-routing) - iletiler için oturum yönlendirmesi
- [Kanallara Genel Bakış](/tr/channels) - desteklenen tüm kanallar
- [Gruplar](/tr/channels/groups) - grup sohbeti davranışı ve bahsetme geçidi
- [Eşleştirme](/tr/channels/pairing) - DM kimlik doğrulaması ve eşleştirme akışı
- [Güvenlik](/tr/gateway/security) - erişim modeli ve sağlamlaştırma
