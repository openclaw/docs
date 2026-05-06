---
read_when:
    - Mattermost kurulumu
    - Mattermost yönlendirmesinde hata ayıklama
sidebarTitle: Mattermost
summary: Mattermost bot kurulumu ve OpenClaw yapılandırması
title: Mattermost
x-i18n:
    generated_at: "2026-05-06T09:03:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 784138a30529971b4f80a1a764eef8992f6a8290a6032e34abae864e52dc212b
    source_path: channels/mattermost.md
    workflow: 16
---

Status: indirilebilir Plugin (bot token'ı + WebSocket olayları). Kanallar, gruplar ve DM'ler desteklenir. Mattermost, kendi ortamınızda barındırılabilen bir ekip mesajlaşma platformudur; ürün ayrıntıları ve indirmeler için [mattermost.com](https://mattermost.com) adresindeki resmi siteye bakın.

## Yükleme

Kanalı yapılandırmadan önce Mattermost'u yükleyin:

<Tabs>
  <Tab title="npm kayıt deposu">
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

Ayrıntılar: [Pluginler](/tr/tools/plugin)

## Hızlı kurulum

<Steps>
  <Step title="Plugin'in kullanılabilir olduğundan emin olun">
    Geçerli paketlenmiş OpenClaw sürümleri bunu zaten birlikte sunar. Daha eski/özel yüklemeler, yukarıdaki komutlarla bunu elle ekleyebilir.
  </Step>
  <Step title="Bir Mattermost botu oluşturun">
    Bir Mattermost bot hesabı oluşturun ve **bot token'ını** kopyalayın.
  </Step>
  <Step title="Temel URL'yi kopyalayın">
    Mattermost **temel URL'sini** kopyalayın (örn. `https://chat.example.com`).
  </Step>
  <Step title="OpenClaw'ı yapılandırın ve Gateway'i başlatın">
    Minimum yapılandırma:

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

Yerel slash komutları isteğe bağlıdır. Etkinleştirildiğinde OpenClaw, Mattermost API üzerinden `oc_*` slash komutlarını kaydeder ve Gateway HTTP sunucusunda callback POST'ları alır.

```json5
{
  channels: {
    mattermost: {
      commands: {
        native: true,
        nativeSkills: true,
        callbackPath: "/api/channels/mattermost/command",
        // Mattermost Gateway'e doğrudan ulaşamadığında kullanın (ters proxy/herkese açık URL).
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Davranış notları">
    - `native: "auto"` Mattermost için varsayılan olarak devre dışıdır. Etkinleştirmek için `native: true` ayarlayın.
    - `callbackUrl` atlanırsa OpenClaw, Gateway host/port + `callbackPath` değerinden bir tane türetir.
    - Çok hesaplı kurulumlarda `commands`, üst düzeyde veya `channels.mattermost.accounts.<id>.commands` altında ayarlanabilir (hesap değerleri üst düzey alanları geçersiz kılar).
    - Komut callback'leri, OpenClaw `oc_*` komutlarını kaydettiğinde Mattermost tarafından döndürülen komut başına token'larla doğrulanır.
    - OpenClaw, her callback'i kabul etmeden önce mevcut Mattermost komut kaydını yeniler; böylece silinen veya yeniden oluşturulan slash komutlarından kalan eski token'lar Gateway yeniden başlatılmadan kabul edilmeyi bırakır.
    - Mattermost API komutun hâlâ güncel olduğunu doğrulayamazsa callback doğrulaması kapalı şekilde başarısız olur; başarısız doğrulamalar kısa süreliğine önbelleğe alınır, eşzamanlı aramalar birleştirilir ve yeni arama başlangıçları tekrar baskısını sınırlamak için komut başına hız sınırına tabi tutulur.
    - Kayıt başarısız olduğunda, başlangıç kısmi olduğunda veya callback token'ı çözümlenen komutun kayıtlı token'ıyla eşleşmediğinde slash callback'leri kapalı şekilde başarısız olur (bir komut için geçerli olan token, farklı bir komut için upstream doğrulamaya ulaşamaz).

  </Accordion>
  <Accordion title="Erişilebilirlik gereksinimi">
    Callback uç noktasına Mattermost sunucusundan erişilebilmelidir.

    - Mattermost, OpenClaw ile aynı host/ağ ad alanında çalışmıyorsa `callbackUrl` değerini `localhost` olarak ayarlamayın.
    - Bu URL `/api/channels/mattermost/command` yolunu OpenClaw'a ters proxy ile yönlendirmiyorsa `callbackUrl` değerini Mattermost temel URL'niz olarak ayarlamayın.
    - Hızlı bir kontrol `curl https://<gateway-host>/api/channels/mattermost/command` komutudur; bir GET, `404` değil OpenClaw'dan `405 Method Not Allowed` döndürmelidir.

  </Accordion>
  <Accordion title="Mattermost çıkış izin listesi">
    Callback hedefiniz özel/tailnet/dahili adreslerse Mattermost `ServiceSettings.AllowedUntrustedInternalConnections` değerini callback host/domain'ini içerecek şekilde ayarlayın.

    Tam URL'ler değil, host/domain girişleri kullanın.

    - İyi: `gateway.tailnet-name.ts.net`
    - Kötü: `https://gateway.tailnet-name.ts.net`

  </Accordion>
</AccordionGroup>

## Ortam değişkenleri (varsayılan hesap)

Env var'ları tercih ediyorsanız bunları Gateway host'unda ayarlayın:

- `MATTERMOST_BOT_TOKEN=...`
- `MATTERMOST_URL=https://chat.example.com`

<Note>
Env var'lar yalnızca **varsayılan** hesap (`default`) için geçerlidir. Diğer hesaplar yapılandırma değerlerini kullanmalıdır.

`MATTERMOST_URL` bir çalışma alanı `.env` dosyasından ayarlanamaz; bkz. [Çalışma alanı `.env` dosyaları](/tr/gateway/security).
</Note>

## Sohbet modları

Mattermost, DM'lere otomatik olarak yanıt verir. Kanal davranışı `chatmode` ile denetlenir:

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

- `onchar`, açık @bahsetmelere yine yanıt verir.
- `channels.mattermost.requireMention` eski yapılandırmalar için desteklenir, ancak `chatmode` tercih edilir.

## İş parçacıkları ve oturumlar

Kanal ve grup yanıtlarının ana kanalda mı kalacağını yoksa tetikleyen gönderinin altında bir iş parçacığı mı başlatacağını denetlemek için `channels.mattermost.replyToMode` kullanın.

- `off` (varsayılan): yalnızca gelen gönderi zaten bir iş parçacığındaysa iş parçacığında yanıt ver.
- `first`: üst düzey kanal/grup gönderileri için, o gönderinin altında bir iş parçacığı başlat ve konuşmayı iş parçacığı kapsamlı bir oturuma yönlendir.
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

- İş parçacığı kapsamlı oturumlar, tetikleyen gönderi kimliğini iş parçacığı kökü olarak kullanır.
- `first` ve `all` şu anda eşdeğerdir; çünkü Mattermost bir iş parçacığı köküne sahip olduğunda, takip parçaları ve medya aynı iş parçacığında devam eder.

## Erişim denetimi (DM'ler)

- Varsayılan: `channels.mattermost.dmPolicy = "pairing"` (bilinmeyen gönderenler bir eşleştirme kodu alır).
- Şununla onaylayın:
  - `openclaw pairing list mattermost`
  - `openclaw pairing approve mattermost <CODE>`
- Herkese açık DM'ler: `channels.mattermost.dmPolicy="open"` artı `channels.mattermost.allowFrom=["*"]`.

## Kanallar (gruplar)

- Varsayılan: `channels.mattermost.groupPolicy = "allowlist"` (bahsetme kapılı).
- Gönderenleri `channels.mattermost.groupAllowFrom` ile izin listesine ekleyin (kullanıcı ID'leri önerilir).
- Kanal başına bahsetme geçersiz kılmaları, varsayılan için `channels.mattermost.groups.<channelId>.requireMention` veya `channels.mattermost.groups["*"].requireMention` altında bulunur.
- `@username` eşleştirmesi değişkendir ve yalnızca `channels.mattermost.dangerouslyAllowNameMatching: true` olduğunda etkinleştirilir.
- Açık kanallar: `channels.mattermost.groupPolicy="open"` (bahsetme kapılı).
- Çalışma zamanı notu: `channels.mattermost` tamamen eksikse çalışma zamanı grup kontrolleri için `groupPolicy="allowlist"` değerine geri döner (`channels.defaults.groupPolicy` ayarlanmış olsa bile).

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

Bu hedef biçimlerini `openclaw message send` veya Cron/Webhook'larla kullanın:

- Bir kanal için `channel:<id>`
- Bir DM için `user:<id>`
- Bir DM için `@username` (Mattermost API üzerinden çözümlenir)

<Warning>
Çıplak opak ID'ler (`64ifufp...` gibi) Mattermost'ta **belirsizdir** (kullanıcı ID'si ile kanal ID'si).

OpenClaw bunları **önce kullanıcı** olarak çözümler:

- ID bir kullanıcı olarak varsa (`GET /api/v4/users/<id>` başarılı olur), OpenClaw doğrudan kanalı `/api/v4/channels/direct` üzerinden çözümleyerek bir **DM** gönderir.
- Aksi halde ID bir **kanal ID'si** olarak ele alınır.

Belirleyici davranış gerekiyorsa her zaman açık önekleri kullanın (`user:<id>` / `channel:<id>`).
</Warning>

## DM kanalı yeniden denemesi

OpenClaw bir Mattermost DM hedefine gönderirken önce doğrudan kanalı çözümlemesi gerektiğinde, geçici doğrudan kanal oluşturma hatalarını varsayılan olarak yeniden dener.

Bu davranışı Mattermost Plugin'i için genel olarak ayarlamak üzere `channels.mattermost.dmChannelRetry` veya tek bir hesap için `channels.mattermost.accounts.<id>.dmChannelRetry` kullanın.

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
- Yeniden denemeler hız sınırları, 5xx yanıtları ve ağ veya zaman aşımı hataları gibi geçici hatalara uygulanır.
- `429` dışındaki 4xx istemci hataları kalıcı kabul edilir ve yeniden denenmez.

## Önizleme akışı

Mattermost düşünmeyi, araç etkinliğini ve kısmi yanıt metnini, son yanıt göndermek için güvenli olduğunda yerinde tamamlanan tek bir **taslak önizleme gönderisine** aktarır. Önizleme, kanalı parça başına mesajlarla doldurmak yerine aynı gönderi kimliği üzerinde güncellenir. Medya/hata sonları bekleyen önizleme düzenlemelerini iptal eder ve tek kullanımlık bir önizleme gönderisini boşaltmak yerine normal teslimatı kullanır.

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
    - `partial` olağan seçimdir: yanıt büyüdükçe düzenlenen ve ardından tam yanıtla sonlandırılan tek bir önizleme gönderisi.
    - `block`, önizleme gönderisinin içinde ekleme tarzı taslak parçalar kullanır.
    - `progress`, oluşturma sırasında bir durum önizlemesi gösterir ve yalnızca tamamlandığında son yanıtı gönderir.
    - `off`, önizleme akışını devre dışı bırakır.

  </Accordion>
  <Accordion title="Akış davranışı notları">
    - Akış yerinde sonlandırılamazsa (örneğin gönderi akış ortasında silindiyse), OpenClaw yanıtın asla kaybolmaması için yeni bir son gönderi göndermeye geri döner.
    - Yalnızca akıl yürütme yükleri, `> Reasoning:` blok alıntısı olarak gelen metin dahil olmak üzere kanal gönderilerinden bastırılır. Düşünmeyi diğer yüzeylerde görmek için `/reasoning on` ayarlayın; Mattermost son gönderisi yalnızca yanıtı tutar.
    - Kanal eşleme matrisi için bkz. [Akış](/tr/concepts/streaming#preview-streaming-modes).

  </Accordion>
</AccordionGroup>

## Tepkiler (mesaj aracı)

- `channel=mattermost` ile `message action=react` kullanın.
- `messageId`, Mattermost gönderi kimliğidir.
- `emoji`, `thumbsup` veya `:+1:` gibi adları kabul eder (iki nokta isteğe bağlıdır).
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

Tıklanabilir düğmeler içeren mesajlar gönderin. Bir kullanıcı bir düğmeye tıkladığında ajan seçimi alır ve yanıt verebilir.

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
  Görüntülenecek etiket.
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
  <Step title="Aracı seçimi alır">
    Aracı seçimi gelen ileti olarak alır ve yanıtlar.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Uygulama notları">
    - Düğme geri çağırmaları HMAC-SHA256 doğrulaması kullanır (otomatik, yapılandırma gerekmez).
    - Mattermost, API yanıtlarından geri çağırma verilerini çıkarır (güvenlik özelliği), bu yüzden tıklamada tüm düğmeler kaldırılır - kısmi kaldırma mümkün değildir.
    - Kısa çizgi veya alt çizgi içeren eylem kimlikleri otomatik olarak temizlenir (Mattermost yönlendirme sınırlaması).

  </Accordion>
  <Accordion title="Yapılandırma ve erişilebilirlik">
    - `channels.mattermost.capabilities`: yetenek dizelerinden oluşan dizi. Aracı sistem isteminde düğmeler araç açıklamasını etkinleştirmek için `"inlineButtons"` ekleyin.
    - `channels.mattermost.interactions.callbackBaseUrl`: düğme geri çağırmaları için isteğe bağlı harici temel URL (örneğin `https://gateway.example.com`). Mattermost, Gateway'e bağlandığı host üzerinden doğrudan erişemediğinde bunu kullanın.
    - Çok hesaplı kurulumlarda, aynı alanı `channels.mattermost.accounts.<id>.interactions.callbackBaseUrl` altında da ayarlayabilirsiniz.
    - `interactions.callbackBaseUrl` atlanırsa OpenClaw geri çağırma URL'sini `gateway.customBindHost` + `gateway.port` üzerinden türetir, ardından `http://localhost:<port>` değerine geri döner.
    - Erişilebilirlik kuralı: düğme geri çağırma URL'sine Mattermost sunucusundan erişilebilmelidir. `localhost` yalnızca Mattermost ve OpenClaw aynı host/ağ ad alanında çalıştığında işe yarar.
    - Geri çağırma hedefiniz özel/tailnet/dahili ise host/alan adını Mattermost `ServiceSettings.AllowedUntrustedInternalConnections` listesine ekleyin.

  </Accordion>
</AccordionGroup>

### Doğrudan API entegrasyonu (harici betikler)

Harici betikler ve Webhook'lar, aracının `message` aracı üzerinden gitmek yerine düğmeleri doğrudan Mattermost REST API aracılığıyla gönderebilir. Mümkün olduğunda Plugin'den `buildButtonAttachments()` kullanın; ham JSON gönderiyorsanız şu kuralları izleyin:

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
3. Her eylem bir `id` alanı gerektirir - Mattermost kimliği olmayan eylemleri yok sayar.
4. Eylem `id` değeri **yalnızca alfanümerik** olmalıdır (`[a-zA-Z0-9]`). Kısa çizgiler ve alt çizgiler Mattermost'un sunucu tarafı eylem yönlendirmesini bozar (404 döndürür). Kullanmadan önce bunları kaldırın.
5. Onay iletisinin ham kimlik yerine düğme adını (örn. "Approve") göstermesi için `context.action_id`, düğmenin `id` değeriyle eşleşmelidir.
6. `context.action_id` zorunludur - etkileşim işleyicisi bu olmadan 400 döndürür.

</Warning>

**HMAC token üretimi**

Gateway, düğme tıklamalarını HMAC-SHA256 ile doğrular. Harici betikler, Gateway'in doğrulama mantığıyla eşleşen token'lar üretmelidir:

<Steps>
  <Step title="Gizli değeri bot token'ından türetin">
    `HMAC-SHA256(key="openclaw-mattermost-interactions", data=botToken)`
  </Step>
  <Step title="Bağlam nesnesini oluşturun">
    Bağlam nesnesini `_token` **hariç** tüm alanlarla oluşturun.
  </Step>
  <Step title="Sıralanmış anahtarlarla serileştirin">
    **Sıralanmış anahtarlarla** ve **boşluksuz** serileştirin (Gateway, sıralanmış anahtarlarla `JSON.stringify` kullanır; bu da kompakt çıktı üretir).
  </Step>
  <Step title="Yükü imzalayın">
    `HMAC-SHA256(key=secret, data=serializedContext)`
  </Step>
  <Step title="Token'ı ekleyin">
    Ortaya çıkan onaltılık özeti bağlam içinde `_token` olarak ekleyin.
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
    - Bağlam alanlarının **tümünü** (`_token` hariç) her zaman imzalayın. Gateway `_token` değerini çıkarır, ardından kalan her şeyi imzalar. Bir alt kümenin imzalanması sessiz doğrulama hatasına neden olur.
    - `sort_keys=True` kullanın - Gateway imzalamadan önce anahtarları sıralar ve Mattermost yükü saklarken bağlam alanlarını yeniden sıralayabilir.
    - Gizli değeri rastgele baytlardan değil, bot token'ından türetin (deterministik). Gizli değer, düğmeleri oluşturan süreçte ve doğrulayan Gateway'de aynı olmalıdır.

  </Accordion>
</AccordionGroup>

## Dizin adaptörü

Mattermost Plugin'i, kanal ve kullanıcı adlarını Mattermost API aracılığıyla çözen bir dizin adaptörü içerir. Bu, `openclaw message send` ve Cron/Webhook teslimatlarında `#channel-name` ve `@username` hedeflerini etkinleştirir.

Yapılandırma gerekmez - adaptör hesap yapılandırmasındaki bot token'ını kullanır.

## Çok hesap

Mattermost, `channels.mattermost.accounts` altında birden fazla hesabı destekler:

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
    - Bot token'ını, temel URL'yi ve hesabın etkin olup olmadığını kontrol edin.
    - Çok hesap sorunları: ortam değişkenleri yalnızca `default` hesabı için geçerlidir.

  </Accordion>
  <Accordion title="Yerel eğik çizgi komutları başarısız oluyor">
    - `Unauthorized: invalid command token.`: OpenClaw geri çağırma token'ını kabul etmedi. Tipik nedenler:
      - eğik çizgi komutu kaydı başlangıçta başarısız oldu veya yalnızca kısmen tamamlandı
      - geri çağırma yanlış Gateway/hesaba gidiyor
      - Mattermost hâlâ önceki bir geri çağırma hedefine işaret eden eski komutlara sahip
      - Gateway eğik çizgi komutlarını yeniden etkinleştirmeden yeniden başlatıldı
    - Yerel eğik çizgi komutları çalışmayı durdurursa günlüklerde `mattermost: failed to register slash commands` veya `mattermost: native slash commands enabled but no commands could be registered` arayın.
    - `callbackUrl` atlanırsa ve günlükler geri çağırmanın `http://127.0.0.1:18789/...` olarak çözüldüğüne dair uyarı verirse, bu URL'ye büyük olasılıkla yalnızca Mattermost, OpenClaw ile aynı host/ağ ad alanında çalıştığında erişilebilir. Bunun yerine açıkça harici olarak erişilebilir bir `commands.callbackUrl` ayarlayın.

  </Accordion>
  <Accordion title="Düğme sorunları">
    - Düğmeler beyaz kutular olarak görünüyor: aracı hatalı biçimlendirilmiş düğme verisi gönderiyor olabilir. Her düğmede hem `text` hem de `callback_data` alanlarının bulunduğunu kontrol edin.
    - Düğmeler işleniyor ancak tıklamalar hiçbir şey yapmıyor: Mattermost sunucu yapılandırmasındaki `AllowedUntrustedInternalConnections` değerinin `127.0.0.1 localhost` içerdiğini ve ServiceSettings içinde `EnablePostActionIntegration` değerinin `true` olduğunu doğrulayın.
    - Düğmeler tıklamada 404 döndürüyor: düğme `id` değeri muhtemelen kısa çizgi veya alt çizgi içeriyor. Mattermost'un eylem yönlendiricisi alfanümerik olmayan kimliklerde bozulur. Yalnızca `[a-zA-Z0-9]` kullanın.
    - Gateway günlüklerinde `invalid _token`: HMAC uyuşmazlığı. Tüm bağlam alanlarını (bir alt küme değil) imzaladığınızı, sıralanmış anahtarlar kullandığınızı ve kompakt JSON (boşluksuz) kullandığınızı kontrol edin. Yukarıdaki HMAC bölümüne bakın.
    - Gateway günlüklerinde `missing _token in context`: `_token` alanı düğmenin bağlamında yok. Entegrasyon yükünü oluştururken bunun dahil edildiğinden emin olun.
    - Onay düğme adı yerine ham kimlik gösteriyor: `context.action_id`, düğmenin `id` değeriyle eşleşmiyor. Her ikisini de aynı temizlenmiş değere ayarlayın.
    - Aracı düğmelerden haberdar değil: Mattermost kanal yapılandırmasına `capabilities: ["inlineButtons"]` ekleyin.

  </Accordion>
</AccordionGroup>

## İlgili

- [Kanal Yönlendirme](/tr/channels/channel-routing) - iletiler için oturum yönlendirmesi
- [Kanallara Genel Bakış](/tr/channels) - desteklenen tüm kanallar
- [Gruplar](/tr/channels/groups) - grup sohbeti davranışı ve bahsetme kapısı
- [Eşleştirme](/tr/channels/pairing) - DM kimlik doğrulaması ve eşleştirme akışı
- [Güvenlik](/tr/gateway/security) - erişim modeli ve sağlamlaştırma
