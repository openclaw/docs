---
read_when:
    - Mattermost kurulumu
    - Mattermost yönlendirmesinde hata ayıklama
sidebarTitle: Mattermost
summary: Mattermost bot kurulumu ve OpenClaw yapılandırması
title: Mattermost
x-i18n:
    generated_at: "2026-04-30T09:07:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1926a1d7347ff35ed60f8d5c3e0b26a064863ada213ad0e171776af5a84d8475
    source_path: channels/mattermost.md
    workflow: 16
---

Durum: paketle birlikte gelen Plugin (bot token + WebSocket etkinlikleri). Kanallar, gruplar ve DM'ler desteklenir. Mattermost, kendi ortamınızda barındırılabilen bir ekip mesajlaşma platformudur; ürün ayrıntıları ve indirmeler için resmi siteye [mattermost.com](https://mattermost.com) adresinden bakın.

## Paketle birlikte gelen Plugin

<Note>
Mattermost, güncel OpenClaw sürümlerinde paketle birlikte gelen bir Plugin olarak gelir; bu nedenle normal paketlenmiş derlemeler ayrı bir kurulum gerektirmez.
</Note>

Mattermost'u hariç tutan eski bir derlemede veya özel kurulumdaysanız, yayımlandığında güncel bir npm paketi kurun:

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

npm, OpenClaw'a ait paketi kullanımdan kaldırılmış olarak bildirirse, daha yeni bir npm paketi yayımlanana kadar güncel paketlenmiş bir OpenClaw derlemesi veya yerel checkout yolunu kullanın.

Ayrıntılar: [Plugins](/tr/tools/plugin)

## Hızlı kurulum

<Steps>
  <Step title="Ensure plugin is available">
    Güncel paketlenmiş OpenClaw sürümleri bunu zaten içerir. Eski/özel kurulumlar yukarıdaki komutlarla bunu elle ekleyebilir.
  </Step>
  <Step title="Create a Mattermost bot">
    Bir Mattermost bot hesabı oluşturun ve **bot token**'ı kopyalayın.
  </Step>
  <Step title="Copy the base URL">
    Mattermost **base URL**'sini kopyalayın (ör. `https://chat.example.com`).
  </Step>
  <Step title="Configure OpenClaw and start the gateway">
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

## Yerel eğik çizgi komutları

Yerel eğik çizgi komutları isteğe bağlıdır. Etkinleştirildiğinde OpenClaw, Mattermost API üzerinden `oc_*` eğik çizgi komutlarını kaydeder ve Gateway HTTP sunucusunda callback POST'larını alır.

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
  <Accordion title="Behavior notes">
    - `native: "auto"` Mattermost için varsayılan olarak devre dışıdır. Etkinleştirmek için `native: true` ayarlayın.
    - `callbackUrl` atlanırsa OpenClaw, Gateway host/port + `callbackPath` değerinden bir URL türetir.
    - Çok hesaplı kurulumlarda `commands` üst düzeyde veya `channels.mattermost.accounts.<id>.commands` altında ayarlanabilir (hesap değerleri üst düzey alanları geçersiz kılar).
    - Komut callback'leri, OpenClaw `oc_*` komutlarını kaydettiğinde Mattermost tarafından döndürülen komuta özel token'larla doğrulanır.
    - Kayıt başarısız olduğunda, başlangıç kısmi olduğunda veya callback token'ı kayıtlı komutlardan biriyle eşleşmediğinde eğik çizgi callback'leri kapalı biçimde başarısız olur.

  </Accordion>
  <Accordion title="Reachability requirement">
    Callback uç noktası Mattermost sunucusundan erişilebilir olmalıdır.

    - Mattermost, OpenClaw ile aynı ana makinede/ağ ad alanında çalışmıyorsa `callbackUrl` değerini `localhost` olarak ayarlamayın.
    - Bu URL, `/api/channels/mattermost/command` yolunu OpenClaw'a ters proxy ile yönlendirmiyorsa `callbackUrl` değerini Mattermost base URL'niz olarak ayarlamayın.
    - Hızlı bir kontrol `curl https://<gateway-host>/api/channels/mattermost/command` komutudur; GET, `404` değil, OpenClaw'dan `405 Method Not Allowed` döndürmelidir.

  </Accordion>
  <Accordion title="Mattermost egress allowlist">
    Callback hedefleriniz özel/tailnet/dahili adreslerse Mattermost `ServiceSettings.AllowedUntrustedInternalConnections` değerini callback host/domain'ini içerecek şekilde ayarlayın.

    Tam URL'ler değil, host/domain girdileri kullanın.

    - İyi: `gateway.tailnet-name.ts.net`
    - Kötü: `https://gateway.tailnet-name.ts.net`

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

Mattermost, DM'lere otomatik olarak yanıt verir. Kanal davranışı `chatmode` ile kontrol edilir:

<Tabs>
  <Tab title="oncall (default)">
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

- `onchar`, açık @mention'lara yine de yanıt verir.
- `channels.mattermost.requireMention` eski yapılandırmalar için dikkate alınır ancak `chatmode` tercih edilir.

## İş parçacıkları ve oturumlar

Kanal ve grup yanıtlarının ana kanalda mı kalacağını yoksa tetikleyen gönderinin altında bir iş parçacığı mı başlatacağını kontrol etmek için `channels.mattermost.replyToMode` kullanın.

- `off` (varsayılan): yalnızca gelen gönderi zaten bir iş parçacığındaysa bir iş parçacığında yanıt ver.
- `first`: üst düzey kanal/grup gönderileri için, o gönderinin altında bir iş parçacığı başlat ve konuşmayı iş parçacığı kapsamlı bir oturuma yönlendir.
- `all`: bugün Mattermost için `first` ile aynı davranış.
- Doğrudan mesajlar bu ayarı yok sayar ve iş parçacığı olmadan kalır.

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

- İş parçacığı kapsamlı oturumlar, iş parçacığı kökü olarak tetikleyen gönderi kimliğini kullanır.
- `first` ve `all` şu anda eşdeğerdir çünkü Mattermost bir iş parçacığı köküne sahip olduktan sonra takip parçaları ve medya aynı iş parçacığında devam eder.

## Erişim denetimi (DM'ler)

- Varsayılan: `channels.mattermost.dmPolicy = "pairing"` (bilinmeyen gönderenler bir eşleştirme kodu alır).
- Şununla onaylayın:
  - `openclaw pairing list mattermost`
  - `openclaw pairing approve mattermost <CODE>`
- Herkese açık DM'ler: `channels.mattermost.dmPolicy="open"` ve `channels.mattermost.allowFrom=["*"]`.

## Kanallar (gruplar)

- Varsayılan: `channels.mattermost.groupPolicy = "allowlist"` (bahsetme kapılı).
- Gönderenleri `channels.mattermost.groupAllowFrom` ile izin listesine alın (kullanıcı kimlikleri önerilir).
- Kanal başına bahsetme geçersiz kılmaları, bir varsayılan için `channels.mattermost.groups.<channelId>.requireMention` veya `channels.mattermost.groups["*"].requireMention` altında bulunur.
- `@username` eşleştirmesi değişebilirdir ve yalnızca `channels.mattermost.dangerouslyAllowNameMatching: true` olduğunda etkinleştirilir.
- Açık kanallar: `channels.mattermost.groupPolicy="open"` (bahsetme kapılı).
- Çalışma zamanı notu: `channels.mattermost` tamamen eksikse, çalışma zamanı grup denetimleri için `groupPolicy="allowlist"` değerine geri döner (`channels.defaults.groupPolicy` ayarlanmış olsa bile).

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

- Bir kanal için `channel:<id>`
- Bir DM için `user:<id>`
- Bir DM için `@username` (Mattermost API aracılığıyla çözümlenir)

<Warning>
Çıplak opak kimlikler (`64ifufp...` gibi) Mattermost'ta **belirsizdir** (kullanıcı kimliği ile kanal kimliği).

OpenClaw bunları **önce kullanıcı** olarak çözümler:

- Kimlik bir kullanıcı olarak varsa (`GET /api/v4/users/<id>` başarılı olursa), OpenClaw `/api/v4/channels/direct` aracılığıyla doğrudan kanalı çözümleyerek bir **DM** gönderir.
- Aksi takdirde kimlik bir **kanal kimliği** olarak ele alınır.

Deterministik davranış gerekiyorsa her zaman açık önekleri kullanın (`user:<id>` / `channel:<id>`).
</Warning>

## DM kanalı yeniden denemesi

OpenClaw bir Mattermost DM hedefine gönderirken önce doğrudan kanalı çözümlemesi gerektiğinde, varsayılan olarak geçici doğrudan kanal oluşturma hatalarını yeniden dener.

Bu davranışı Mattermost Plugin'i için genel olarak ayarlamak üzere `channels.mattermost.dmChannelRetry`, tek bir hesap içinse `channels.mattermost.accounts.<id>.dmChannelRetry` kullanın.

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
- Yeniden denemeler hız sınırları, 5xx yanıtları ve ağ ya da zaman aşımı hataları gibi geçici hatalara uygulanır.
- `429` dışındaki 4xx istemci hataları kalıcı kabul edilir ve yeniden denenmez.

## Önizleme akışı

Mattermost, düşünmeyi, araç etkinliğini ve kısmi yanıt metnini tek bir **taslak önizleme gönderisine** aktarır; bu gönderi, son yanıtın gönderilmesi güvenli olduğunda yerinde sonlandırılır. Önizleme, kanalı parça başına iletilerle doldurmak yerine aynı gönderi kimliği üzerinde güncellenir. Medya/hata sonları bekleyen önizleme düzenlemelerini iptal eder ve kullan-at bir önizleme gönderisini boşaltmak yerine normal teslimatı kullanır.

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
    - `partial` olağan seçimdir: yanıt büyüdükçe düzenlenen, ardından eksiksiz yanıtla sonlandırılan tek bir önizleme gönderisi.
    - `block`, önizleme gönderisi içinde ekleme tarzı taslak parçaları kullanır.
    - `progress`, oluşturma sırasında bir durum önizlemesi gösterir ve yalnızca tamamlandığında son yanıtı gönderir.
    - `off`, önizleme akışını devre dışı bırakır.

  </Accordion>
  <Accordion title="Akış davranışı notları">
    - Akış yerinde sonlandırılamazsa (örneğin gönderi akışın ortasında silindiyse), OpenClaw yanıtın asla kaybolmaması için yeni bir son gönderi göndermeye geri döner.
    - Yalnızca akıl yürütme içeren yükler, `> Reasoning:` blok alıntısı olarak gelen metin de dahil olmak üzere kanal gönderilerinden bastırılır. Diğer yüzeylerde düşünmeyi görmek için `/reasoning on` ayarlayın; Mattermost son gönderisi yalnızca yanıtı tutar.
    - Kanal eşleme matrisi için [Akış](/tr/concepts/streaming#preview-streaming-modes) bölümüne bakın.

  </Accordion>
</AccordionGroup>

## Tepkiler (ileti aracı)

- `channel=mattermost` ile `message action=react` kullanın.
- `messageId`, Mattermost gönderi kimliğidir.
- `emoji`, `thumbsup` veya `:+1:` gibi adları kabul eder (iki nokta üst üste isteğe bağlıdır).
- Bir tepkiyi kaldırmak için `remove=true` (boolean) ayarlayın.
- Tepki ekleme/kaldırma olayları, yönlendirilen aracı oturumuna sistem olayları olarak iletilir.

Örnekler:

```
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup remove=true
```

Yapılandırma:

- `channels.mattermost.actions.reactions`: tepki eylemlerini etkinleştir/devre dışı bırak (varsayılan true).
- Hesap başına geçersiz kılma: `channels.mattermost.accounts.<id>.actions.reactions`.

## Etkileşimli düğmeler (ileti aracı)

Tıklanabilir düğmelerle iletiler gönderin. Bir kullanıcı bir düğmeye tıkladığında, aracı seçimi alır ve yanıt verebilir.

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
  <Step title="Düğmeler onayla değiştirildi">
    Tüm düğmeler bir onay satırıyla değiştirilir (ör. "@user tarafından ✓ **Evet** seçildi").
  </Step>
  <Step title="Aracı seçimi alır">
    Aracı seçimi gelen ileti olarak alır ve yanıtlar.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Uygulama notları">
    - Düğme geri çağrıları HMAC-SHA256 doğrulaması kullanır (otomatik, yapılandırma gerekmez).
    - Mattermost, API yanıtlarından geri çağrı verilerini çıkarır (güvenlik özelliği), bu nedenle tıklamada tüm düğmeler kaldırılır — kısmi kaldırma mümkün değildir.
    - Kısa çizgi veya alt çizgi içeren eylem kimlikleri otomatik olarak temizlenir (Mattermost yönlendirme sınırlaması).

  </Accordion>
  <Accordion title="Yapılandırma ve erişilebilirlik">
    - `channels.mattermost.capabilities`: yetenek dizgilerinden oluşan dizi. Aracı sistem isteminde düğmeler aracı açıklamasını etkinleştirmek için `"inlineButtons"` ekleyin.
    - `channels.mattermost.interactions.callbackBaseUrl`: düğme geri çağrıları için isteğe bağlı harici temel URL (örneğin `https://gateway.example.com`). Mattermost, Gateway'e bağlandığı ana makineden doğrudan erişemediğinde bunu kullanın.
    - Çok hesaplı kurulumlarda aynı alanı `channels.mattermost.accounts.<id>.interactions.callbackBaseUrl` altında da ayarlayabilirsiniz.
    - `interactions.callbackBaseUrl` atlanırsa OpenClaw, geri çağrı URL'sini `gateway.customBindHost` + `gateway.port` değerinden türetir, ardından `http://localhost:<port>` değerine geri döner.
    - Erişilebilirlik kuralı: düğme geri çağrı URL'si Mattermost sunucusundan erişilebilir olmalıdır. `localhost` yalnızca Mattermost ve OpenClaw aynı ana makinede/ağ ad alanında çalıştığında çalışır.
    - Geri çağrı hedefiniz özel/tailnet/dahili ise ana makinesini/etki alanını Mattermost `ServiceSettings.AllowedUntrustedInternalConnections` içine ekleyin.

  </Accordion>
</AccordionGroup>

### Doğrudan API entegrasyonu (harici betikler)

Harici betikler ve Webhook'lar, aracının `message` aracından geçmek yerine düğmeleri doğrudan Mattermost REST API üzerinden gönderebilir. Mümkün olduğunda Plugin'den `buildButtonAttachments()` kullanın; ham JSON gönderiyorsanız şu kuralları izleyin:

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
2. Her eylemin `type: "button"` değerine ihtiyacı vardır — bu olmadan tıklamalar sessizce yutulur.
3. Her eylemin bir `id` alanına ihtiyacı vardır — Mattermost kimliği olmayan eylemleri yok sayar.
4. Eylem `id` değeri **yalnızca alfanümerik** olmalıdır (`[a-zA-Z0-9]`). Kısa çizgiler ve alt çizgiler Mattermost'un sunucu tarafı eylem yönlendirmesini bozar (404 döndürür). Kullanmadan önce bunları çıkarın.
5. Onay iletisinin ham kimlik yerine düğme adını (ör. "Approve") göstermesi için `context.action_id`, düğmenin `id` değeriyle eşleşmelidir.
6. `context.action_id` zorunludur — etkileşim işleyicisi onsuz 400 döndürür.

</Warning>

**HMAC belirteci oluşturma**

Gateway, düğme tıklamalarını HMAC-SHA256 ile doğrular. Harici betikler, Gateway'in doğrulama mantığıyla eşleşen belirteçler oluşturmalıdır:

<Steps>
  <Step title="Gizli anahtarı bot belirtecinden türetin">
    `HMAC-SHA256(key="openclaw-mattermost-interactions", data=botToken)`
  </Step>
  <Step title="Bağlam nesnesini oluşturun">
    `_token` **hariç** tüm alanlarla bağlam nesnesini oluşturun.
  </Step>
  <Step title="Sıralanmış anahtarlarla serileştirin">
    **Sıralanmış anahtarlar** ve **boşluksuz** serileştirin (Gateway, sıralanmış anahtarlarla `JSON.stringify` kullanır; bu da kompakt çıktı üretir).
  </Step>
  <Step title="Yükü imzalayın">
    `HMAC-SHA256(key=secret, data=serializedContext)`
  </Step>
  <Step title="Belirteci ekleyin">
    Ortaya çıkan hex özetini bağlama `_token` olarak ekleyin.
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
    - Her zaman **tüm** bağlam alanlarını (`_token` hariç) imzalayın. Gateway `_token` değerini çıkarır ve kalan her şeyi imzalar. Bir alt kümeyi imzalamak sessiz doğrulama hatasına neden olur.
    - `sort_keys=True` kullanın — Gateway imzalamadan önce anahtarları sıralar ve Mattermost yükü depolarken bağlam alanlarını yeniden sıralayabilir.
    - Gizli anahtarı rastgele baytlardan değil, bot belirtecinden (deterministik) türetin. Gizli anahtar, düğmeleri oluşturan süreç ile doğrulayan Gateway arasında aynı olmalıdır.

  </Accordion>
</AccordionGroup>

## Dizin bağdaştırıcısı

Mattermost Plugin'i, kanal ve kullanıcı adlarını Mattermost API üzerinden çözen bir dizin bağdaştırıcısı içerir. Bu, `openclaw message send` ve cron/Webhook teslimatlarında `#channel-name` ve `@username` hedeflerini etkinleştirir.

Yapılandırma gerekmez — bağdaştırıcı, hesap yapılandırmasındaki bot belirtecini kullanır.

## Çoklu hesap

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
    Botun kanalda olduğundan emin olun ve ondan bahsedin (oncall), bir tetik öneki kullanın (onchar) veya `chatmode: "onmessage"` ayarlayın.
  </Accordion>
  <Accordion title="Kimlik doğrulama veya çoklu hesap hataları">
    - Bot belirtecini, temel URL'yi ve hesabın etkin olup olmadığını kontrol edin.
    - Çoklu hesap sorunları: ortam değişkenleri yalnızca `default` hesabına uygulanır.

  </Accordion>
  <Accordion title="Yerel slash komutları başarısız oluyor">
    - `Unauthorized: invalid command token.`: OpenClaw geri çağrı belirtecini kabul etmedi. Tipik nedenler:
      - slash komutu kaydı başlangıçta başarısız oldu veya yalnızca kısmen tamamlandı
      - geri çağrı yanlış Gateway/hesaba gidiyor
      - Mattermost'ta hâlâ önceki bir geri çağrı hedefini gösteren eski komutlar var
      - Gateway slash komutlarını yeniden etkinleştirmeden yeniden başlatıldı
    - Yerel slash komutları çalışmayı durdurursa günlüklerde `mattermost: failed to register slash commands` veya `mattermost: native slash commands enabled but no commands could be registered` ifadelerini kontrol edin.
    - `callbackUrl` atlanırsa ve günlükler geri çağrının `http://127.0.0.1:18789/...` olarak çözüldüğü konusunda uyarıyorsa, bu URL'ye muhtemelen yalnızca Mattermost, OpenClaw ile aynı ana makinede/ağ ad alanında çalıştığında erişilebilir. Bunun yerine açıkça harici olarak erişilebilir bir `commands.callbackUrl` ayarlayın.

  </Accordion>
  <Accordion title="Düğme sorunları">
    - Düğmeler beyaz kutular olarak görünür: aracı hatalı biçimlendirilmiş düğme verileri gönderiyor olabilir. Her düğmede hem `text` hem de `callback_data` alanları olduğunu kontrol edin.
    - Düğmeler işleniyor ancak tıklamalar hiçbir şey yapmıyor: Mattermost sunucu yapılandırmasındaki `AllowedUntrustedInternalConnections` değerinin `127.0.0.1 localhost` içerdiğini ve ServiceSettings içinde `EnablePostActionIntegration` değerinin `true` olduğunu doğrulayın.
    - Düğmeler tıklamada 404 döndürüyor: düğme `id` değeri muhtemelen kısa çizgiler veya alt çizgiler içeriyor. Mattermost'un eylem yönlendiricisi alfanümerik olmayan kimliklerde bozulur. Yalnızca `[a-zA-Z0-9]` kullanın.
    - Gateway günlüklerinde `invalid _token`: HMAC uyuşmazlığı. Tüm bağlam alanlarını (bir alt küme değil) imzaladığınızı, sıralanmış anahtarlar kullandığınızı ve kompakt JSON (boşluksuz) kullandığınızı kontrol edin. Yukarıdaki HMAC bölümüne bakın.
    - Gateway günlüklerinde `missing _token in context`: `_token` alanı düğmenin bağlamında değil. Entegrasyon yükünü oluştururken bunun dahil edildiğinden emin olun.
    - Onay düğme adı yerine ham kimlik gösteriyor: `context.action_id`, düğmenin `id` değeriyle eşleşmiyor. İkisini de aynı temizlenmiş değere ayarlayın.
    - Aracı düğmelerden haberdar değil: Mattermost kanal yapılandırmasına `capabilities: ["inlineButtons"]` ekleyin.

  </Accordion>
</AccordionGroup>

## İlgili

- [Kanal Yönlendirme](/tr/channels/channel-routing) — iletiler için oturum yönlendirme
- [Kanallara Genel Bakış](/tr/channels) — desteklenen tüm kanallar
- [Gruplar](/tr/channels/groups) — grup sohbeti davranışı ve bahsetme kapısı
- [Eşleştirme](/tr/channels/pairing) — DM kimlik doğrulaması ve eşleştirme akışı
- [Güvenlik](/tr/gateway/security) — erişim modeli ve sağlamlaştırma
