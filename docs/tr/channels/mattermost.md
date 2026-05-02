---
read_when:
    - Mattermost'u ayarlama
    - Mattermost yönlendirmesinde hata ayıklama
sidebarTitle: Mattermost
summary: Mattermost bot kurulumu ve OpenClaw yapılandırması
title: Mattermost
x-i18n:
    generated_at: "2026-05-02T08:47:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 319af8ba1cb8ff1aa5b52a57e809e6c76d3723012dc9cae7c456b89687dd6810
    source_path: channels/mattermost.md
    workflow: 16
---

Durum: indirilebilir Plugin (bot belirteci + WebSocket olayları). Kanallar, gruplar ve DM’ler desteklenir. Mattermost, kendi sunucunuzda barındırılabilen bir ekip mesajlaşma platformudur; ürün ayrıntıları ve indirmeler için resmi siteye [mattermost.com](https://mattermost.com) adresinden bakın.

## Kurulum

Kanalı yapılandırmadan önce Mattermost’u kurun:

<Tabs>
  <Tab title="npm registry">
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

Ayrıntılar: [Plugins](/tr/tools/plugin)

## Hızlı kurulum

<Steps>
  <Step title="Plugin’in kullanılabilir olduğundan emin olun">
    Mevcut paketlenmiş OpenClaw sürümleri bunu zaten paketler. Daha eski/özel kurulumlar yukarıdaki komutlarla bunu elle ekleyebilir.
  </Step>
  <Step title="Bir Mattermost botu oluşturun">
    Bir Mattermost bot hesabı oluşturun ve **bot belirtecini** kopyalayın.
  </Step>
  <Step title="Temel URL’yi kopyalayın">
    Mattermost **temel URL’sini** kopyalayın (ör. `https://chat.example.com`).
  </Step>
  <Step title="OpenClaw’u yapılandırın ve gateway’i başlatın">
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

  </Step>
</Steps>

## Yerel slash komutları

Yerel slash komutları isteğe bağlıdır. Etkinleştirildiğinde OpenClaw, Mattermost API aracılığıyla `oc_*` slash komutlarını kaydeder ve Gateway HTTP sunucusunda geri çağırma POST’ları alır.

```json5
{
  channels: {
    mattermost: {
      commands: {
        native: true,
        nativeSkills: true,
        callbackPath: "/api/channels/mattermost/command",
        // Mattermost gateway’e doğrudan erişemediğinde kullanın (ters proxy/genel URL).
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Davranış notları">
    - `native: "auto"` Mattermost için varsayılan olarak devre dışıdır. Etkinleştirmek için `native: true` ayarlayın.
    - `callbackUrl` atlanırsa OpenClaw, Gateway ana makinesi/bağlantı noktası + `callbackPath` üzerinden bir tane türetir.
    - Çok hesaplı kurulumlarda `commands`, üst düzeyde veya `channels.mattermost.accounts.<id>.commands` altında ayarlanabilir (hesap değerleri üst düzey alanları geçersiz kılar).
    - Komut geri çağırmaları, OpenClaw `oc_*` komutlarını kaydettiğinde Mattermost tarafından döndürülen komut başına belirteçlerle doğrulanır.
    - OpenClaw, silinmiş veya yeniden oluşturulmuş slash komutlarından kalan eski belirteçlerin Gateway yeniden başlatılmadan kabul edilmesini durdurmak için her geri çağırmayı kabul etmeden önce mevcut Mattermost komut kaydını yeniler.
    - Mattermost API komutun hâlâ güncel olduğunu doğrulayamazsa geri çağırma doğrulaması kapalı başarısız olur; başarısız doğrulamalar kısa süreliğine önbelleğe alınır, eşzamanlı sorgular birleştirilir ve yeni sorgu başlangıçları yeniden yürütme baskısını sınırlamak için komut başına hız sınırına tabi tutulur.
    - Kayıt başarısız olduysa, başlangıç kısmi olduysa veya geri çağırma belirteci çözümlenen komutun kayıtlı belirteciyle eşleşmiyorsa slash geri çağırmaları kapalı başarısız olur (bir komut için geçerli bir belirteç, farklı bir komut için upstream doğrulamaya ulaşamaz).

  </Accordion>
  <Accordion title="Erişilebilirlik gereksinimi">
    Geri çağırma uç noktasına Mattermost sunucusundan erişilebilmelidir.

    - Mattermost, OpenClaw ile aynı ana makinede/ağ ad alanında çalışmıyorsa `callbackUrl` değerini `localhost` olarak ayarlamayın.
    - Bu URL `/api/channels/mattermost/command` yolunu OpenClaw’a ters proxy ile yönlendirmiyorsa `callbackUrl` değerini Mattermost temel URL’niz olarak ayarlamayın.
    - Hızlı bir kontrol `curl https://<gateway-host>/api/channels/mattermost/command` komutudur; GET, `404` değil OpenClaw’dan `405 Method Not Allowed` döndürmelidir.

  </Accordion>
  <Accordion title="Mattermost çıkış izin listesi">
    Geri çağırmanız özel/tailnet/dahili adresleri hedefliyorsa Mattermost `ServiceSettings.AllowedUntrustedInternalConnections` değerini geri çağırma ana makinesini/alan adını içerecek şekilde ayarlayın.

    Tam URL değil, ana makine/alan adı girdileri kullanın.

    - Doğru: `gateway.tailnet-name.ts.net`
    - Yanlış: `https://gateway.tailnet-name.ts.net`

  </Accordion>
</AccordionGroup>

## Ortam değişkenleri (varsayılan hesap)

Env vars tercih ediyorsanız bunları Gateway ana makinesinde ayarlayın:

- `MATTERMOST_BOT_TOKEN=...`
- `MATTERMOST_URL=https://chat.example.com`

<Note>
Env vars yalnızca **varsayılan** hesap (`default`) için geçerlidir. Diğer hesaplar yapılandırma değerlerini kullanmalıdır.

`MATTERMOST_URL`, bir çalışma alanı `.env` dosyasından ayarlanamaz; bkz. [Çalışma alanı `.env` dosyaları](/tr/gateway/security).
</Note>

## Sohbet modları

Mattermost, DM’lere otomatik olarak yanıt verir. Kanal davranışı `chatmode` tarafından denetlenir:

<Tabs>
  <Tab title="oncall (varsayılan)">
    Kanallarda yalnızca @mention edildiğinde yanıt ver.
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

- `onchar` açık @mention’lara yine yanıt verir.
- Eski yapılandırmalar için `channels.mattermost.requireMention` dikkate alınır, ancak `chatmode` tercih edilir.

## Thread’ler ve oturumlar

Kanal ve grup yanıtlarının ana kanalda kalıp kalmayacağını veya tetikleyen gönderinin altında bir thread başlatıp başlatmayacağını denetlemek için `channels.mattermost.replyToMode` kullanın.

- `off` (varsayılan): yalnızca gelen gönderi zaten bir thread içindeyse thread içinde yanıt ver.
- `first`: üst düzey kanal/grup gönderileri için, o gönderinin altında bir thread başlat ve konuşmayı thread kapsamlı bir oturuma yönlendir.
- `all`: bugün Mattermost için `first` ile aynı davranış.
- Doğrudan mesajlar bu ayarı yok sayar ve thread’siz kalır.

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

- Thread kapsamlı oturumlar, tetikleyen gönderi kimliğini thread kökü olarak kullanır.
- `first` ve `all` şu anda eşdeğerdir; çünkü Mattermost’ta bir thread kökü oluştuğunda takip parçaları ve medya aynı thread içinde devam eder.

## Erişim denetimi (DM’ler)

- Varsayılan: `channels.mattermost.dmPolicy = "pairing"` (bilinmeyen gönderenler eşleştirme kodu alır).
- Şununla onaylayın:
  - `openclaw pairing list mattermost`
  - `openclaw pairing approve mattermost <CODE>`
- Genel DM’ler: `channels.mattermost.dmPolicy="open"` artı `channels.mattermost.allowFrom=["*"]`.

## Kanallar (gruplar)

- Varsayılan: `channels.mattermost.groupPolicy = "allowlist"` (mention kapılı).
- Gönderenleri `channels.mattermost.groupAllowFrom` ile izin listesine alın (kullanıcı kimlikleri önerilir).
- Kanal başına mention geçersiz kılmaları, varsayılan için `channels.mattermost.groups.<channelId>.requireMention` veya `channels.mattermost.groups["*"].requireMention` altında bulunur.
- `@username` eşleştirmesi değişkendir ve yalnızca `channels.mattermost.dangerouslyAllowNameMatching: true` olduğunda etkinleştirilir.
- Açık kanallar: `channels.mattermost.groupPolicy="open"` (mention kapılı).
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

## Giden teslimat hedefleri

Bu hedef biçimlerini `openclaw message send` veya cron/webhook’lar ile kullanın:

- Bir kanal için `channel:<id>`
- Bir DM için `user:<id>`
- Bir DM için `@username` (Mattermost API aracılığıyla çözümlenir)

<Warning>
Çıplak opak kimlikler (`64ifufp...` gibi) Mattermost’ta **belirsizdir** (kullanıcı kimliği veya kanal kimliği).

OpenClaw bunları **önce kullanıcı** olarak çözer:

- Kimlik bir kullanıcı olarak varsa (`GET /api/v4/users/<id>` başarılı olursa), OpenClaw doğrudan kanalı `/api/v4/channels/direct` aracılığıyla çözerek bir **DM** gönderir.
- Aksi durumda kimlik bir **kanal kimliği** olarak ele alınır.

Deterministik davranış gerekiyorsa her zaman açık önekleri kullanın (`user:<id>` / `channel:<id>`).
</Warning>

## DM kanalı yeniden denemesi

OpenClaw bir Mattermost DM hedefine gönderim yaptığında ve önce doğrudan kanalı çözmesi gerektiğinde, geçici doğrudan kanal oluşturma hatalarını varsayılan olarak yeniden dener.

Bu davranışı Mattermost Plugin’i için genel olarak ayarlamak üzere `channels.mattermost.dmChannelRetry`, tek bir hesap için `channels.mattermost.accounts.<id>.dmChannelRetry` kullanın.

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

- Bu, her Mattermost API çağrısına değil yalnızca DM kanalı oluşturma işlemine (`/api/v4/channels/direct`) uygulanır.
- Yeniden denemeler hız sınırları, 5xx yanıtları ve ağ ya da zaman aşımı hataları gibi geçici hatalara uygulanır.
- `429` dışındaki 4xx istemci hataları kalıcı kabul edilir ve yeniden denenmez.

## Önizleme akışı

Mattermost düşünmeyi, araç etkinliğini ve kısmi yanıt metnini tek bir **taslak önizleme gönderisine** akıtır; son yanıt gönderilmeye güvenli olduğunda yerinde sonlandırılır. Önizleme, kanalı parça başına mesajlarla doldurmak yerine aynı gönderi kimliği üzerinde güncellenir. Medya/hata finalleri bekleyen önizleme düzenlemelerini iptal eder ve tek kullanımlık bir önizleme gönderisini boşaltmak yerine normal teslimatı kullanır.

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
    - `partial` olağan seçimdir: yanıt büyüdükçe düzenlenen ve ardından tam yanıtla sonlandırılan tek bir önizleme gönderisi.
    - `block`, önizleme gönderisi içinde ekleme tarzı taslak parçaları kullanır.
    - `progress`, oluşturma sırasında bir durum önizlemesi gösterir ve yalnızca tamamlandığında son yanıtı gönderir.
    - `off`, önizleme akışını devre dışı bırakır.

  </Accordion>
  <Accordion title="Akış davranışı notları">
    - Akış yerinde sonlandırılamazsa (örneğin gönderi akış sırasında silindiyse), OpenClaw yanıtın asla kaybolmaması için yeni bir final gönderisi göndermeye geri döner.
    - Yalnızca akıl yürütme yükleri kanal gönderilerinden bastırılır; buna `> Reasoning:` blockquote olarak gelen metin de dahildir. Düşünmeyi diğer yüzeylerde görmek için `/reasoning on` ayarlayın; Mattermost final gönderisi yalnızca yanıtı tutar.
    - Kanal eşleme matrisi için bkz. [Akış](/tr/concepts/streaming#preview-streaming-modes).

  </Accordion>
</AccordionGroup>

## Tepkiler (message aracı)

- `channel=mattermost` ile `message action=react` kullanın.
- `messageId`, Mattermost gönderi kimliğidir.
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

## Etkileşimli düğmeler (message aracı)

Tıklanabilir düğmelerle mesaj gönderin. Bir kullanıcı bir düğmeye tıkladığında ajan seçimi alır ve yanıt verebilir.

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

`buttons` parametresiyle `message action=send` kullanın. Düğmeler 2B bir dizidir (düğme satırları):

```
message action=send channel=mattermost target=channel:<channelId> buttons=[[{"text":"Yes","callback_data":"yes"},{"text":"No","callback_data":"no"}]]
```

Düğme alanları:

<ParamField path="text" type="string" required>
  Görüntüleme etiketi.
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
  <Step title="Agent seçimi alır">
    Agent seçimi gelen ileti olarak alır ve yanıt verir.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Uygulama notları">
    - Düğme geri çağrıları HMAC-SHA256 doğrulaması kullanır (otomatik, yapılandırma gerekmez).
    - Mattermost, API yanıtlarından geri çağrı verilerini çıkarır (güvenlik özelliği), bu yüzden tıklamada tüm düğmeler kaldırılır — kısmi kaldırma mümkün değildir.
    - Kısa çizgi veya alt çizgi içeren eylem kimlikleri otomatik olarak temizlenir (Mattermost yönlendirme sınırlaması).

  </Accordion>
  <Accordion title="Yapılandırma ve erişilebilirlik">
    - `channels.mattermost.capabilities`: yetenek dizelerinden oluşan dizi. Agent sistem isteminde düğmeler aracı açıklamasını etkinleştirmek için `"inlineButtons"` ekleyin.
    - `channels.mattermost.interactions.callbackBaseUrl`: düğme geri çağrıları için isteğe bağlı harici temel URL (örneğin `https://gateway.example.com`). Mattermost, Gateway'e bağlandığı ana bilgisayardan doğrudan erişemediğinde bunu kullanın.
    - Çok hesaplı kurulumlarda aynı alanı `channels.mattermost.accounts.<id>.interactions.callbackBaseUrl` altında da ayarlayabilirsiniz.
    - `interactions.callbackBaseUrl` atlanırsa OpenClaw, geri çağrı URL'sini `gateway.customBindHost` + `gateway.port` değerlerinden türetir, ardından `http://localhost:<port>` değerine geri döner.
    - Erişilebilirlik kuralı: düğme geri çağrı URL'sine Mattermost sunucusundan erişilebilmelidir. `localhost` yalnızca Mattermost ve OpenClaw aynı ana bilgisayarda/ağ ad alanında çalıştığında işe yarar.
    - Geri çağrı hedefiniz özel/tailnet/dahili ise ana bilgisayarını/alan adını Mattermost `ServiceSettings.AllowedUntrustedInternalConnections` öğesine ekleyin.

  </Accordion>
</AccordionGroup>

### Doğrudan API entegrasyonu (harici betikler)

Harici betikler ve webhooks, agent'ın `message` aracını kullanmak yerine düğmeleri doğrudan Mattermost REST API üzerinden gönderebilir. Mümkün olduğunda Plugin'den `buildButtonAttachments()` kullanın; ham JSON gönderiyorsanız şu kurallara uyun:

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
            id: "mybutton01", // alphanumeric only — see below
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

1. Ekler üst düzey `attachments` içine değil, `props.attachments` içine konur (sessizce yok sayılır).
2. Her eylem `type: "button"` gerektirir — yoksa tıklamalar sessizce yutulur.
3. Her eylem bir `id` alanı gerektirir — Mattermost kimliği olmayan eylemleri yok sayar.
4. Eylem `id` değeri **yalnızca alfasayısal** olmalıdır (`[a-zA-Z0-9]`). Kısa çizgiler ve alt çizgiler Mattermost'un sunucu tarafı eylem yönlendirmesini bozar (404 döndürür). Kullanmadan önce bunları çıkarın.
5. Onay iletisinin ham kimlik yerine düğme adını (ör. "Approve") göstermesi için `context.action_id`, düğmenin `id` değeriyle eşleşmelidir.
6. `context.action_id` zorunludur — etkileşim işleyicisi bu olmadan 400 döndürür.

</Warning>

**HMAC belirteci üretimi**

Gateway, düğme tıklamalarını HMAC-SHA256 ile doğrular. Harici betikler, Gateway'in doğrulama mantığıyla eşleşen belirteçler üretmelidir:

<Steps>
  <Step title="Gizli anahtarı bot belirtecinden türetin">
    `HMAC-SHA256(key="openclaw-mattermost-interactions", data=botToken)`
  </Step>
  <Step title="Bağlam nesnesini oluşturun">
    Bağlam nesnesini `_token` **hariç** tüm alanlarla oluşturun.
  </Step>
  <Step title="Sıralanmış anahtarlarla seri hale getirin">
    **Sıralanmış anahtarlarla** ve **boşluksuz** seri hale getirin (Gateway, sıralanmış anahtarlarla `JSON.stringify` kullanır; bu da kompakt çıktı üretir).
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
    - Python'ın `json.dumps` işlevi varsayılan olarak boşluk ekler (`{"key": "val"}`). JavaScript'in kompakt çıktısıyla (`{"key":"val"}`) eşleşmek için `separators=(",", ":")` kullanın.
    - Her zaman **tüm** bağlam alanlarını (`_token` hariç) imzalayın. Gateway, `_token` öğesini çıkarır ve kalan her şeyi imzalar. Bir alt kümenin imzalanması sessiz doğrulama hatasına neden olur.
    - `sort_keys=True` kullanın — Gateway imzalamadan önce anahtarları sıralar ve Mattermost yükü saklarken bağlam alanlarını yeniden sıralayabilir.
    - Gizli anahtarı rastgele baytlardan değil, bot belirtecinden türetin (deterministik). Gizli anahtar, düğmeleri oluşturan süreç ile doğrulayan Gateway arasında aynı olmalıdır.

  </Accordion>
</AccordionGroup>

## Dizin bağdaştırıcısı

Mattermost Plugin, Mattermost API üzerinden kanal ve kullanıcı adlarını çözen bir dizin bağdaştırıcısı içerir. Bu, `openclaw message send` ve cron/webhook teslimatlarında `#channel-name` ve `@username` hedeflerini etkinleştirir.

Yapılandırma gerekmez — bağdaştırıcı, hesap yapılandırmasındaki bot belirtecini kullanır.

## Çok hesaplı

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
    Botun kanalda olduğundan emin olun ve ondan bahsedin (oncall), bir tetikleyici ön eki kullanın (onchar) veya `chatmode: "onmessage"` ayarlayın.
  </Accordion>
  <Accordion title="Kimlik doğrulama veya çok hesaplı hatalar">
    - Bot belirtecini, temel URL'yi ve hesabın etkin olup olmadığını kontrol edin.
    - Çok hesaplı sorunlar: ortam değişkenleri yalnızca `default` hesabına uygulanır.

  </Accordion>
  <Accordion title="Yerel slash komutları başarısız oluyor">
    - `Unauthorized: invalid command token.`: OpenClaw geri çağrı belirtecini kabul etmedi. Tipik nedenler:
      - slash komutu kaydı başlangıçta başarısız oldu veya yalnızca kısmen tamamlandı
      - geri çağrı yanlış Gateway/hesaba ulaşıyor
      - Mattermost hâlâ önceki bir geri çağrı hedefine işaret eden eski komutlara sahip
      - Gateway, slash komutlarını yeniden etkinleştirmeden yeniden başlatıldı
    - Yerel slash komutları çalışmayı durdurursa günlüklerde `mattermost: failed to register slash commands` veya `mattermost: native slash commands enabled but no commands could be registered` olup olmadığını kontrol edin.
    - `callbackUrl` atlanırsa ve günlükler geri çağrının `http://127.0.0.1:18789/...` olarak çözümlendiğine dair uyarı verirse bu URL'ye muhtemelen yalnızca Mattermost, OpenClaw ile aynı ana bilgisayarda/ağ ad alanında çalıştığında erişilebilir. Bunun yerine açıkça harici olarak erişilebilir bir `commands.callbackUrl` ayarlayın.

  </Accordion>
  <Accordion title="Düğme sorunları">
    - Düğmeler beyaz kutular olarak görünüyor: agent hatalı biçimlendirilmiş düğme verisi gönderiyor olabilir. Her düğmede hem `text` hem de `callback_data` alanlarının olduğunu kontrol edin.
    - Düğmeler işleniyor ama tıklamalar hiçbir şey yapmıyor: Mattermost sunucu yapılandırmasındaki `AllowedUntrustedInternalConnections` öğesinin `127.0.0.1 localhost` içerdiğini ve ServiceSettings içinde `EnablePostActionIntegration` değerinin `true` olduğunu doğrulayın.
    - Düğmeler tıklamada 404 döndürüyor: düğme `id` değeri büyük olasılıkla kısa çizgi veya alt çizgi içeriyor. Mattermost'un eylem yönlendiricisi alfasayısal olmayan kimliklerde bozulur. Yalnızca `[a-zA-Z0-9]` kullanın.
    - Gateway günlüklerinde `invalid _token`: HMAC uyuşmazlığı. Tüm bağlam alanlarını (bir alt küme değil) imzaladığınızı, sıralanmış anahtarlar kullandığınızı ve kompakt JSON (boşluksuz) kullandığınızı kontrol edin. Yukarıdaki HMAC bölümüne bakın.
    - Gateway günlüklerinde `missing _token in context`: `_token` alanı düğmenin bağlamında değil. Entegrasyon yükünü oluştururken dahil edildiğinden emin olun.
    - Onay, düğme adı yerine ham kimlik gösteriyor: `context.action_id`, düğmenin `id` değeriyle eşleşmiyor. Her ikisini de aynı temizlenmiş değere ayarlayın.
    - Agent düğmelerden haberdar değil: Mattermost kanal yapılandırmasına `capabilities: ["inlineButtons"]` ekleyin.

  </Accordion>
</AccordionGroup>

## İlgili

- [Kanal Yönlendirme](/tr/channels/channel-routing) — iletiler için oturum yönlendirmesi
- [Kanallara Genel Bakış](/tr/channels) — desteklenen tüm kanallar
- [Gruplar](/tr/channels/groups) — grup sohbeti davranışı ve bahsetme kapısı
- [Eşleştirme](/tr/channels/pairing) — DM kimlik doğrulaması ve eşleştirme akışı
- [Güvenlik](/tr/gateway/security) — erişim modeli ve güçlendirme
