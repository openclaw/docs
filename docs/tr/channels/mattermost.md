---
read_when:
    - Mattermost kurulumu
    - Mattermost yönlendirmesinde hata ayıklama
sidebarTitle: Mattermost
summary: Mattermost bot kurulumu ve OpenClaw yapılandırması
title: Mattermost
x-i18n:
    generated_at: "2026-04-26T11:23:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 22916fcff2eeccf53055f2ebf60fc621d595991d0ca4cd148015b61cce09c52f
    source_path: channels/mattermost.md
    workflow: 15
---

Durum: paketle birlikte gelen Plugin (bot token + WebSocket olayları). Kanallar, gruplar ve DM'ler desteklenir. Mattermost, kendi kendine barındırılabilen bir ekip mesajlaşma platformudur; ürün ayrıntıları ve indirmeler için resmi siteye [mattermost.com](https://mattermost.com) adresinden bakın.

## Paketle birlikte gelen Plugin

<Note>
Mattermost, mevcut OpenClaw sürümlerinde paketle birlikte gelen bir Plugin olarak gelir; bu nedenle normal paketli kurulumlar ayrı bir yükleme gerektirmez.
</Note>

Eski bir derlemedeyseniz veya Mattermost'u içermeyen özel bir kurulum kullanıyorsanız, manuel olarak yükleyin:

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

Ayrıntılar: [Plugins](/tr/tools/plugin)

## Hızlı kurulum

<Steps>
  <Step title="Plugin'in kullanılabilir olduğundan emin olun">
    Mevcut paketli OpenClaw sürümleri bunu zaten içerir. Eski/özel kurulumlar yukarıdaki komutlarla manuel olarak ekleyebilir.
  </Step>
  <Step title="Bir Mattermost botu oluşturun">
    Bir Mattermost bot hesabı oluşturun ve **bot token** değerini kopyalayın.
  </Step>
  <Step title="Temel URL'yi kopyalayın">
    Mattermost **base URL** değerini kopyalayın (ör. `https://chat.example.com`).
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
        // Mattermost Gateway'e doğrudan ulaşamıyorsa kullanın (ters proxy/genel URL).
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Davranış notları">
    - `native: "auto"` varsayılan olarak Mattermost için devre dışıdır. Etkinleştirmek için `native: true` ayarlayın.
    - `callbackUrl` atlanırsa OpenClaw, Gateway host/port + `callbackPath` üzerinden bir değer türetir.
    - Çok hesaplı kurulumlarda `commands`, üst düzeyde veya `channels.mattermost.accounts.<id>.commands` altında ayarlanabilir (hesap değerleri üst düzey alanları geçersiz kılar).
    - Komut callback'leri, OpenClaw `oc_*` komutlarını kaydettiğinde Mattermost'un döndürdüğü komut başına token'larla doğrulanır.
    - Kayıt başarısız olduysa, başlangıç kısmi kaldıysa veya callback token kayıtlı komutlardan biriyle eşleşmiyorsa slash callback'leri kapalı güvenlik modeliyle başarısız olur.
  </Accordion>
  <Accordion title="Erişilebilirlik gereksinimi">
    Callback uç noktası Mattermost sunucusundan erişilebilir olmalıdır.

    - Mattermost, OpenClaw ile aynı host/ağ namespace'inde çalışmıyorsa `callbackUrl` değerini `localhost` olarak ayarlamayın.
    - Bu URL, `/api/channels/mattermost/command` yolunu OpenClaw'a ters proxy ile yönlendirmiyorsa `callbackUrl` değerini Mattermost base URL'niz olarak ayarlamayın.
    - Hızlı bir kontrol için `curl https://<gateway-host>/api/channels/mattermost/command`; bir GET isteği `404` yerine OpenClaw'dan `405 Method Not Allowed` döndürmelidir.

  </Accordion>
  <Accordion title="Mattermost çıkış izin listesi">
    Callback'iniz private/tailnet/internal adresleri hedefliyorsa, callback host/domain'ini içerecek şekilde Mattermost `ServiceSettings.AllowedUntrustedInternalConnections` ayarını yapılandırın.

    Tam URL değil, host/domain girdileri kullanın.

    - İyi: `gateway.tailnet-name.ts.net`
    - Kötü: `https://gateway.tailnet-name.ts.net`

  </Accordion>
</AccordionGroup>

## Ortam değişkenleri (varsayılan hesap)

Ortam değişkenlerini tercih ediyorsanız bunları Gateway host'unda ayarlayın:

- `MATTERMOST_BOT_TOKEN=...`
- `MATTERMOST_URL=https://chat.example.com`

<Note>
Ortam değişkenleri yalnızca **varsayılan** hesap (`default`) için geçerlidir. Diğer hesaplar yapılandırma değerlerini kullanmalıdır.

`MATTERMOST_URL`, çalışma alanı `.env` dosyasından ayarlanamaz; bkz. [Çalışma alanı `.env` dosyaları](/tr/gateway/security).
</Note>

## Sohbet modları

Mattermost, DM'lere otomatik olarak yanıt verir. Kanal davranışı `chatmode` ile denetlenir:

<Tabs>
  <Tab title="oncall (varsayılan)">
    Yalnızca kanallarda @mention yapıldığında yanıt verir.
  </Tab>
  <Tab title="onmessage">
    Kanaldaki her mesaja yanıt verir.
  </Tab>
  <Tab title="onchar">
    Bir mesaj tetikleyici bir önekle başladığında yanıt verir.
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
- `channels.mattermost.requireMention`, eski yapılandırmalar için dikkate alınır ancak `chatmode` tercih edilir.

## Başlıklar ve oturumlar

Kanal ve grup yanıtlarının ana kanalda mı kalacağını yoksa tetikleyici gönderinin altında bir başlık mı başlatacağını denetlemek için `channels.mattermost.replyToMode` kullanın.

- `off` (varsayılan): yalnızca gelen gönderi zaten bir başlık içindeyse başlıkta yanıt ver.
- `first`: üst düzey kanal/grup gönderileri için o gönderinin altında bir başlık başlat ve konuşmayı başlık kapsamlı bir oturuma yönlendir.
- `all`: bugün Mattermost için `first` ile aynı davranış.
- Doğrudan mesajlar bu ayarı yok sayar ve başlıksız kalır.

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

- Başlık kapsamlı oturumlar, tetikleyici gönderi kimliğini başlık kökü olarak kullanır.
- `first` ve `all` şu anda eşdeğerdir çünkü Mattermost bir başlık köküne sahip olduğunda, sonraki parçalar ve medya aynı başlıkta devam eder.

## Erişim denetimi (DM'ler)

- Varsayılan: `channels.mattermost.dmPolicy = "pairing"` (bilinmeyen gönderenler bir eşleştirme kodu alır).
- Şununla onaylayın:
  - `openclaw pairing list mattermost`
  - `openclaw pairing approve mattermost <CODE>`
- Herkese açık DM'ler: `channels.mattermost.dmPolicy="open"` artı `channels.mattermost.allowFrom=["*"]`.

## Kanallar (gruplar)

- Varsayılan: `channels.mattermost.groupPolicy = "allowlist"` (mention geçitlemeli).
- `channels.mattermost.groupAllowFrom` ile gönderenleri izin listesine alın (kullanıcı ID'leri önerilir).
- Kanal başına mention geçersiz kılmaları `channels.mattermost.groups.<channelId>.requireMention` altında veya varsayılan için `channels.mattermost.groups["*"].requireMention` altında bulunur.
- `@username` eşleştirmesi değişkendir ve yalnızca `channels.mattermost.dangerouslyAllowNameMatching: true` olduğunda etkinleştirilir.
- Açık kanallar: `channels.mattermost.groupPolicy="open"` (mention geçitlemeli).
- Çalışma zamanı notu: `channels.mattermost` tamamen yoksa, çalışma zamanı grup kontrolleri için `groupPolicy="allowlist"` değerine geri döner (`channels.defaults.groupPolicy` ayarlanmış olsa bile).

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

Bu hedef biçimlerini `openclaw message send` veya cron/webhook'larla kullanın:

- Bir kanal için `channel:<id>`
- Bir DM için `user:<id>`
- Bir DM için `@username` (Mattermost API üzerinden çözümlenir)

<Warning>
Öneksiz opak ID'ler (`64ifufp...` gibi), Mattermost'ta **belirsizdir** (kullanıcı ID'si mi kanal ID'si mi).

OpenClaw bunları **önce kullanıcı** olarak çözümler:

- ID bir kullanıcı olarak varsa (`GET /api/v4/users/<id>` başarılıysa), OpenClaw `/api/v4/channels/direct` üzerinden doğrudan kanalı çözümleyerek bir **DM** gönderir.
- Aksi takdirde ID bir **kanal ID'si** olarak ele alınır.

Kararlı davranışa ihtiyacınız varsa her zaman açık önekleri kullanın (`user:<id>` / `channel:<id>`).
</Warning>

## DM kanal yeniden denemesi

OpenClaw bir Mattermost DM hedefine gönderim yaptığında ve önce doğrudan kanalı çözümlemesi gerektiğinde, varsayılan olarak geçici doğrudan kanal oluşturma hatalarını yeniden dener.

Bu davranışı Mattermost Plugin için genel olarak ayarlamak üzere `channels.mattermost.dmChannelRetry`, tek bir hesap için ise `channels.mattermost.accounts.<id>.dmChannelRetry` kullanın.

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

- Bu yalnızca DM kanal oluşturma (`/api/v4/channels/direct`) için geçerlidir, tüm Mattermost API çağrıları için değil.
- Yeniden denemeler; oran sınırları, 5xx yanıtları ve ağ veya zaman aşımı hataları gibi geçici hatalara uygulanır.
- `429` dışındaki 4xx istemci hataları kalıcı kabul edilir ve yeniden denenmez.

## Önizleme akışı

Mattermost; düşünme, araç etkinliği ve kısmi yanıt metnini, son yanıt gönderilmeye uygun olduğunda yerinde tamamlanan tek bir **taslak önizleme gönderisi** içinde akıtır. Önizleme, kanalın parça başına mesajlarla spamlenmesi yerine aynı gönderi kimliğinde güncellenir. Medya/hata final durumları, bekleyen önizleme düzenlemelerini iptal eder ve tek kullanımlık bir önizleme gönderisini boşaltmak yerine normal teslimatı kullanır.

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
    - `partial` genellikle en uygun seçimdir: yanıt büyüdükçe düzenlenen tek bir önizleme gönderisi, ardından tam yanıtla tamamlanır.
    - `block`, önizleme gönderisi içinde eklemeli taslak parçaları kullanır.
    - `progress`, üretim sırasında bir durum önizlemesi gösterir ve yalnızca tamamlandığında son yanıtı gönderir.
    - `off`, önizleme akışını devre dışı bırakır.
  </Accordion>
  <Accordion title="Akış davranışı notları">
    - Akış yerinde tamamlanamazsa (örneğin gönderi akış sırasında silindiyse), OpenClaw yeni bir son gönderi göndermeye geri döner; böylece yanıt asla kaybolmaz.
    - Yalnızca muhakeme içeren yükler, `> Reasoning:` alıntı bloğu olarak gelen metinler dahil, kanal gönderilerinden bastırılır. Düşünmeyi diğer yüzeylerde görmek için `/reasoning on` ayarlayın; Mattermost son gönderisi yalnızca yanıtı içerir.
    - Kanal eşleme matrisi için [Akış](/tr/concepts/streaming#preview-streaming-modes) bölümüne bakın.
  </Accordion>
</AccordionGroup>

## Tepkiler (mesaj aracı)

- `channel=mattermost` ile `message action=react` kullanın.
- `messageId`, Mattermost gönderi kimliğidir.
- `emoji`, `thumbsup` veya `:+1:` gibi adları kabul eder (iki nokta üst üste işaretleri isteğe bağlıdır).
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

Tıklanabilir düğmeler içeren mesajlar gönderin. Bir kullanıcı bir düğmeye tıkladığında, ajan seçimi alır ve yanıt verebilir.

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

`buttons` parametresiyle `message action=send` kullanın. Düğmeler 2 boyutlu bir dizidir (düğme satırları):

```
message action=send channel=mattermost target=channel:<channelId> buttons=[[{"text":"Yes","callback_data":"yes"},{"text":"No","callback_data":"no"}]]
```

Düğme alanları:

<ParamField path="text" type="string" required>
  Görünen etiket.
</ParamField>
<ParamField path="callback_data" type="string" required>
  Tıklamada geri gönderilen değer (eylem ID'si olarak kullanılır).
</ParamField>
<ParamField path="style" type='"default" | "primary" | "danger"'>
  Düğme stili.
</ParamField>

Bir kullanıcı bir düğmeye tıkladığında:

<Steps>
  <Step title="Düğmeler onayla değiştirilir">
    Tüm düğmeler bir onay satırıyla değiştirilir (ör. "✓ **Yes** @user tarafından seçildi").
  </Step>
  <Step title="Ajan seçimi alır">
    Ajan, seçimi gelen bir mesaj olarak alır ve yanıt verir.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Uygulama notları">
    - Düğme callback'leri HMAC-SHA256 doğrulaması kullanır (otomatik, yapılandırma gerekmez).
    - Mattermost, API yanıtlarından callback verisini çıkarır (güvenlik özelliği), bu yüzden tıklamada tüm düğmeler kaldırılır — kısmi kaldırma mümkün değildir.
    - Tire veya alt çizgi içeren eylem ID'leri otomatik olarak temizlenir (Mattermost yönlendirme kısıtlaması).
  </Accordion>
  <Accordion title="Yapılandırma ve erişilebilirlik">
    - `channels.mattermost.capabilities`: yetenek dizgilerinden oluşan dizi. Ajan sistem isteminde düğmeler araç açıklamasını etkinleştirmek için `"inlineButtons"` ekleyin.
    - `channels.mattermost.interactions.callbackBaseUrl`: düğme callback'leri için isteğe bağlı dış base URL (örneğin `https://gateway.example.com`). Mattermost, Gateway'e bağlama host'u üzerinden doğrudan ulaşamıyorsa bunu kullanın.
    - Çok hesaplı kurulumlarda aynı alanı `channels.mattermost.accounts.<id>.interactions.callbackBaseUrl` altında da ayarlayabilirsiniz.
    - `interactions.callbackBaseUrl` atlanırsa OpenClaw, callback URL'sini `gateway.customBindHost` + `gateway.port` üzerinden türetir, ardından `http://localhost:<port>` değerine geri döner.
    - Erişilebilirlik kuralı: düğme callback URL'sine Mattermost sunucusundan erişilebilmelidir. `localhost` yalnızca Mattermost ve OpenClaw aynı host/ağ namespace'inde çalıştığında işe yarar.
    - Callback hedefiniz private/tailnet/internal ise host/domain'ini Mattermost `ServiceSettings.AllowedUntrustedInternalConnections` ayarına ekleyin.
  </Accordion>
</AccordionGroup>

### Doğrudan API entegrasyonu (harici betikler)

Harici betikler ve Webhook'lar, ajanın `message` aracı üzerinden gitmek yerine doğrudan Mattermost REST API aracılığıyla düğme gönderebilir. Mümkün olduğunda Plugin içindeki `buildButtonAttachments()` işlevini kullanın; ham JSON gönderiyorsanız şu kurallara uyun:

**Yük yapısı:**

```json5
{
  channel_id: "<channelId>",
  message: "Bir seçenek seçin:",
  props: {
    attachments: [
      {
        actions: [
          {
            id: "mybutton01", // yalnızca alfasayısal — aşağıya bakın
            type: "button", // zorunlu, yoksa tıklamalar sessizce yok sayılır
            name: "Onayla", // görünen etiket
            style: "primary", // isteğe bağlı: "default", "primary", "danger"
            integration: {
              url: "https://gateway.example.com/mattermost/interactions/default",
              context: {
                action_id: "mybutton01", // düğme id'siyle eşleşmelidir (ad araması için)
                action: "approve",
                // ... herhangi özel alan ...
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

1. Ekler üst düzey `attachments` içine değil, `props.attachments` içine yerleştirilir (aksi halde sessizce yok sayılır).
2. Her eylem `type: "button"` gerektirir — bu olmadan tıklamalar sessizce yutulur.
3. Her eylem bir `id` alanı gerektirir — Mattermost ID'si olmayan eylemleri yok sayar.
4. Eylem `id` değeri **yalnızca alfasayısal** olmalıdır (`[a-zA-Z0-9]`). Tire ve alt çizgi Mattermost'un sunucu tarafı eylem yönlendirmesini bozar (`404` döndürür). Kullanmadan önce bunları kaldırın.
5. `context.action_id`, onay mesajının ham ID yerine düğme adını göstermesi için düğmenin `id` değeriyle eşleşmelidir (ör. "Onayla").
6. `context.action_id` zorunludur — etkileşim işleyicisi bu olmadan `400` döndürür.
   </Warning>

**HMAC token oluşturma**

Gateway, düğme tıklamalarını HMAC-SHA256 ile doğrular. Harici betikler, Gateway'in doğrulama mantığıyla eşleşen token'lar üretmelidir:

<Steps>
  <Step title="Bot token'dan gizli anahtarı türetin">
    `HMAC-SHA256(key="openclaw-mattermost-interactions", data=botToken)`
  </Step>
  <Step title="Context nesnesini oluşturun">
    Tüm alanlarla birlikte, ancak `_token` hariç olacak şekilde context nesnesini oluşturun.
  </Step>
  <Step title="Sıralı anahtarlarla serileştirin">
    **Sıralı anahtarlarla** ve **boşluksuz** serileştirin (Gateway sıralı anahtarlarla `JSON.stringify` kullanır ve bu da kompakt çıktı üretir).
  </Step>
  <Step title="Yükü imzalayın">
    `HMAC-SHA256(key=secret, data=serializedContext)`
  </Step>
  <Step title="Token'ı ekleyin">
    Ortaya çıkan hex özeti, context içine `_token` olarak ekleyin.
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
  <Accordion title="Yaygın HMAC hataları">
    - Python'ın `json.dumps` işlevi varsayılan olarak boşluk ekler (`{"key": "val"}`). JavaScript'in kompakt çıktısıyla (`{"key":"val"}`) eşleşmesi için `separators=(",", ":")` kullanın.
    - Her zaman **tüm** context alanlarını (`_token` hariç) imzalayın. Gateway `_token` alanını çıkarır, sonra geriye kalan her şeyi imzalar. Yalnızca bir alt kümeyi imzalamak sessiz doğrulama başarısızlığına neden olur.
    - `sort_keys=True` kullanın — Gateway imzalamadan önce anahtarları sıralar ve Mattermost yükü saklarken context alanlarını yeniden sıralayabilir.
    - Gizli anahtarı rastgele baytlardan değil, bot token'dan türetin (deterministik). Düğmeleri oluşturan süreçle doğrulayan Gateway'de aynı gizli anahtar kullanılmalıdır.
  </Accordion>
</AccordionGroup>

## Dizin bağdaştırıcısı

Mattermost Plugin, kanal ve kullanıcı adlarını Mattermost API aracılığıyla çözen bir dizin bağdaştırıcısı içerir. Bu, `openclaw message send` ile cron/Webhook teslimatlarında `#channel-name` ve `@username` hedeflerini etkinleştirir.

Yapılandırma gerekmez — bağdaştırıcı, hesap yapılandırmasındaki bot token'ı kullanır.

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

## Sorun giderme

<AccordionGroup>
  <Accordion title="Kanallarda yanıt yok">
    Botun kanalda olduğundan emin olun ve botu mention'layın (oncall), bir tetikleyici önek kullanın (onchar) veya `chatmode: "onmessage"` ayarlayın.
  </Accordion>
  <Accordion title="Kimlik doğrulama veya çok hesap hataları">
    - Bot token'ı, base URL'yi ve hesabın etkin olup olmadığını kontrol edin.
    - Çok hesap sorunları: ortam değişkenleri yalnızca `default` hesabına uygulanır.
  </Accordion>
  <Accordion title="Yerel slash komutları başarısız oluyor">
    - `Unauthorized: invalid command token.`: OpenClaw callback token'ını kabul etmedi. Tipik nedenler:
      - slash komutu kaydı başlangıçta başarısız oldu veya yalnızca kısmen tamamlandı
      - callback yanlış Gateway/hesabı vuruyor
      - Mattermost hâlâ önceki bir callback hedefine işaret eden eski komutlara sahip
      - Gateway, slash komutlarını yeniden etkinleştirmeden yeniden başlatıldı
    - Yerel slash komutları çalışmayı bırakırsa günlüklerde `mattermost: failed to register slash commands` veya `mattermost: native slash commands enabled but no commands could be registered` kayıtlarını kontrol edin.
    - `callbackUrl` atlanmışsa ve günlükler callback'in `http://127.0.0.1:18789/...` olarak çözümlendiği konusunda uyarıyorsa, bu URL muhtemelen yalnızca Mattermost OpenClaw ile aynı host/ağ namespace'inde çalıştığında erişilebilirdir. Bunun yerine açıkça dışarıdan erişilebilir bir `commands.callbackUrl` ayarlayın.
  </Accordion>
  <Accordion title="Düğme sorunları">
    - Düğmeler beyaz kutular olarak görünüyor: ajan hatalı biçimlendirilmiş düğme verisi gönderiyor olabilir. Her düğmede hem `text` hem `callback_data` alanlarının olduğunu kontrol edin.
    - Düğmeler görüntüleniyor ama tıklamalar hiçbir şey yapmıyor: Mattermost sunucu yapılandırmasında `AllowedUntrustedInternalConnections` değerinin `127.0.0.1 localhost` içerdiğini ve `ServiceSettings` içinde `EnablePostActionIntegration` değerinin `true` olduğunu doğrulayın.
    - Tıklamada düğmeler `404` döndürüyor: düğme `id` değeri muhtemelen tire veya alt çizgi içeriyor. Mattermost'un eylem yönlendiricisi alfasayısal olmayan ID'lerde bozulur. Yalnızca `[a-zA-Z0-9]` kullanın.
    - Gateway günlüklerinde `invalid _token`: HMAC eşleşmiyor. Tüm context alanlarını imzaladığınızı (bir alt kümesini değil), sıralı anahtarlar kullandığınızı ve kompakt JSON kullandığınızı (boşluksuz) kontrol edin. Yukarıdaki HMAC bölümüne bakın.
    - Gateway günlüklerinde `missing _token in context`: `_token` alanı düğmenin context'inde yok. Entegrasyon yükü oluşturulurken eklendiğinden emin olun.
    - Onay, düğme adı yerine ham ID gösteriyor: `context.action_id`, düğmenin `id` değeriyle eşleşmiyor. Her ikisini de aynı temizlenmiş değere ayarlayın.
    - Ajan düğmelerden haberdar değil: Mattermost kanal yapılandırmasına `capabilities: ["inlineButtons"]` ekleyin.
  </Accordion>
</AccordionGroup>

## İlgili

- [Kanal Yönlendirmesi](/tr/channels/channel-routing) — mesajlar için oturum yönlendirmesi
- [Kanallara Genel Bakış](/tr/channels) — desteklenen tüm kanallar
- [Gruplar](/tr/channels/groups) — grup sohbeti davranışı ve mention geçitlemesi
- [Eşleştirme](/tr/channels/pairing) — DM kimlik doğrulaması ve eşleştirme akışı
- [Güvenlik](/tr/gateway/security) — erişim modeli ve sağlamlaştırma
