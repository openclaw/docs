---
read_when:
    - Mattermost kurulumu
    - Mattermost yönlendirme hatalarını ayıklama
summary: Mattermost bot kurulumu ve OpenClaw yapılandırması
title: Mattermost
x-i18n:
    generated_at: "2026-04-24T08:58:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 09c91790a2ea0149c179031b6c08e06358cb4efa5a027778cec87b38444d7718
    source_path: channels/mattermost.md
    workflow: 15
---

Durum: paketle gelen Plugin (bot token + WebSocket olayları). Kanallar, gruplar ve DM'ler desteklenir.
Mattermost, kendi kendine barındırılabilen bir ekip mesajlaşma platformudur; ürün ayrıntıları ve indirmeler için resmi site olan
[mattermost.com](https://mattermost.com) adresine bakın.

## Paketle gelen Plugin

Mattermost, güncel OpenClaw sürümlerinde paketle gelen bir Plugin olarak gelir; bu nedenle normal
paketlenmiş yapılarda ayrı bir kurulum gerekmez.

Eski bir yapı veya Mattermost'u hariç tutan özel bir kurulum kullanıyorsanız,
elle yükleyin:

CLI ile yükleme (npm kayıt defteri):

```bash
openclaw plugins install @openclaw/mattermost
```

Yerel checkout (bir git deposundan çalışırken):

```bash
openclaw plugins install ./path/to/local/mattermost-plugin
```

Ayrıntılar: [Plugins](/tr/tools/plugin)

## Hızlı kurulum

1. Mattermost Plugin'inin kullanılabilir olduğundan emin olun.
   - Güncel paketlenmiş OpenClaw sürümleri bunu zaten paket halinde içerir.
   - Eski/özel kurulumlar yukarıdaki komutlarla bunu elle ekleyebilir.
2. Bir Mattermost bot hesabı oluşturun ve **bot token** değerini kopyalayın.
3. Mattermost **base URL** değerini kopyalayın (ör. `https://chat.example.com`).
4. OpenClaw'ı yapılandırın ve gateway'i başlatın.

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

## Yerel slash komutları

Yerel slash komutları isteğe bağlıdır. Etkinleştirildiğinde OpenClaw,
Mattermost API üzerinden `oc_*` slash komutlarını kaydeder ve gateway HTTP sunucusunda callback `POST` istekleri alır.

```json5
{
  channels: {
    mattermost: {
      commands: {
        native: true,
        nativeSkills: true,
        callbackPath: "/api/channels/mattermost/command",
        // Mattermost gateway'e doğrudan ulaşamıyorsa kullanın (ters proxy/genel URL).
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
    },
  },
}
```

Notlar:

- `native: "auto"` varsayılan olarak Mattermost için devre dışıdır. Etkinleştirmek için `native: true` ayarlayın.
- `callbackUrl` atlanırsa OpenClaw, gateway host/port + `callbackPath` üzerinden bir URL türetir.
- Çok hesaplı kurulumlarda `commands` üst düzeyde veya
  `channels.mattermost.accounts.<id>.commands` altında ayarlanabilir (hesap değerleri üst düzey alanları geçersiz kılar).
- Komut callback'leri, OpenClaw `oc_*` komutlarını kaydettiğinde Mattermost tarafından döndürülen
  komut başına token'larla doğrulanır.
- Kayıt başarısız olduysa, başlatma kısmi kaldıysa veya
  callback token'ı kayıtlı komutlardan biriyle eşleşmiyorsa slash callback'leri kapalı varsayımla başarısız olur.
- Erişilebilirlik gereksinimi: callback uç noktası Mattermost sunucusundan erişilebilir olmalıdır.
  - Mattermost, OpenClaw ile aynı host/ağ ad alanında çalışmıyorsa `callbackUrl` değerini `localhost` olarak ayarlamayın.
  - Bu URL, `/api/channels/mattermost/command` yolunu OpenClaw'a ters proxy'lemiyorsa `callbackUrl` değerini Mattermost base URL'niz olarak ayarlamayın.
  - Hızlı bir kontrol için `curl https://<gateway-host>/api/channels/mattermost/command`; bir GET isteği `404` değil, OpenClaw'dan `405 Method Not Allowed` döndürmelidir.
- Mattermost çıkış izin listesi gereksinimi:
  - Callback'iniz özel/tailnet/dahili adresleri hedefliyorsa, callback host/domain bilgisini içerecek şekilde Mattermost
    `ServiceSettings.AllowedUntrustedInternalConnections` ayarını yapılandırın.
  - Tam URL değil, host/domain girdileri kullanın.
    - İyi: `gateway.tailnet-name.ts.net`
    - Kötü: `https://gateway.tailnet-name.ts.net`

## Ortam değişkenleri (varsayılan hesap)

Ortam değişkenlerini tercih ediyorsanız bunları gateway host'ta ayarlayın:

- `MATTERMOST_BOT_TOKEN=...`
- `MATTERMOST_URL=https://chat.example.com`

Ortam değişkenleri yalnızca **varsayılan** hesap (`default`) için geçerlidir. Diğer hesaplar yapılandırma değerleri kullanmalıdır.

`MATTERMOST_URL`, bir çalışma alanı `.env` dosyasından ayarlanamaz; bkz. [Çalışma alanı `.env` dosyaları](/tr/gateway/security).

## Sohbet modları

Mattermost, DM'lere otomatik olarak yanıt verir. Kanal davranışı `chatmode` ile denetlenir:

- `oncall` (varsayılan): kanallarda yalnızca @-bahsedildiğinde yanıt ver.
- `onmessage`: her kanal mesajına yanıt ver.
- `onchar`: mesaj bir tetikleyici önekiyle başladığında yanıt ver.

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

- `onchar`, açık @-bahsetmelere yine de yanıt verir.
- `channels.mattermost.requireMention`, eski yapılandırmalarda dikkate alınır ancak `chatmode` tercih edilir.

## İleti dizileri ve oturumlar

Kanal ve grup yanıtlarının
ana kanalda mı kalacağını yoksa tetikleyen gönderinin altında bir ileti dizisi mi başlatacağını denetlemek için `channels.mattermost.replyToMode` kullanın.

- `off` (varsayılan): yalnızca gelen gönderi zaten bir ileti dizisindeyse bir ileti dizisinde yanıt ver.
- `first`: üst düzey kanal/grup gönderileri için bu gönderinin altında bir ileti dizisi başlatır ve
  konuşmayı ileti dizisi kapsamlı bir oturuma yönlendirir.
- `all`: bugün Mattermost için `first` ile aynı davranış.
- Doğrudan mesajlar bu ayarı yok sayar ve ileti dizisiz kalır.

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

- İleti dizisi kapsamlı oturumlar, ileti dizisi kökü olarak tetikleyen gönderi kimliğini kullanır.
- `first` ve `all` şu anda eşdeğerdir; çünkü Mattermost bir ileti dizisi köküne sahip olduğunda,
  takip parçaları ve medya aynı ileti dizisinde devam eder.

## Erişim denetimi (DM'ler)

- Varsayılan: `channels.mattermost.dmPolicy = "pairing"` (bilinmeyen gönderenler bir eşleştirme kodu alır).
- Şununla onaylayın:
  - `openclaw pairing list mattermost`
  - `openclaw pairing approve mattermost <CODE>`
- Genel DM'ler: `channels.mattermost.dmPolicy="open"` artı `channels.mattermost.allowFrom=["*"]`.

## Kanallar (gruplar)

- Varsayılan: `channels.mattermost.groupPolicy = "allowlist"` (@-bahsetme kapılı).
- Gönderenleri `channels.mattermost.groupAllowFrom` ile izin listesine ekleyin (kullanıcı kimlikleri önerilir).
- Kanal başına @-bahsetme geçersiz kılmaları `channels.mattermost.groups.<channelId>.requireMention`
  altında veya varsayılan için `channels.mattermost.groups["*"].requireMention` altında yer alır.
- `@username` eşleşmesi değişkendir ve yalnızca `channels.mattermost.dangerouslyAllowNameMatching: true` olduğunda etkinleştirilir.
- Açık kanallar: `channels.mattermost.groupPolicy="open"` (@-bahsetme kapılı).
- Çalışma zamanı notu: `channels.mattermost` tamamen yoksa çalışma zamanı, grup denetimleri için `groupPolicy="allowlist"` varsayımına döner (`channels.defaults.groupPolicy` ayarlanmış olsa bile).

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
- Bir DM için `@username` (Mattermost API üzerinden çözülür)

Önek içermeyen opak kimlikler (ör. `64ifufp...`) Mattermost'ta **belirsizdir** (kullanıcı kimliği mi kanal kimliği mi).

OpenClaw bunları **önce kullanıcı** olarak çözümler:

- Kimlik bir kullanıcı olarak varsa (`GET /api/v4/users/<id>` başarılı olursa), OpenClaw doğrudan kanalı `/api/v4/channels/direct` üzerinden çözümleyerek bir **DM** gönderir.
- Aksi halde kimlik bir **kanal kimliği** olarak değerlendirilir.

Deterministik davranışa ihtiyacınız varsa her zaman açık önekleri kullanın (`user:<id>` / `channel:<id>`).

## DM kanal yeniden denemesi

OpenClaw bir Mattermost DM hedefine gönderim yaptığında ve önce doğrudan kanalı çözümlemesi gerektiğinde,
varsayılan olarak geçici doğrudan kanal oluşturma hatalarını yeniden dener.

Bu davranışı Mattermost Plugin'i genelinde ayarlamak için `channels.mattermost.dmChannelRetry`,
tek bir hesap için ayarlamak üzere `channels.mattermost.accounts.<id>.dmChannelRetry` kullanın.

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

- Bu yalnızca DM kanal oluşturma (`/api/v4/channels/direct`) için geçerlidir, her Mattermost API çağrısı için değil.
- Yeniden denemeler; hız sınırları, 5xx yanıtları ve ağ veya zaman aşımı hataları gibi geçici hatalara uygulanır.
- `429` dışındaki 4xx istemci hataları kalıcı kabul edilir ve yeniden denenmez.

## Önizleme akışı

Mattermost; düşünmeyi, araç etkinliğini ve kısmi yanıt metnini tek bir **taslak önizleme gönderisinde** akıtır; nihai yanıt güvenle gönderilebildiğinde bu gönderi yerinde tamamlanır. Önizleme, kanalı parça başına mesajlarla doldurmak yerine aynı gönderi kimliğinde güncellenir. Medya/hata sonlandırmaları bekleyen önizleme düzenlemelerini iptal eder ve gereksiz bir önizleme gönderisini boşaltmak yerine normal teslimat kullanır.

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

Notlar:

- `partial` genellikle tercih edilen seçenektir: yanıt büyüdükçe düzenlenen tek bir önizleme gönderisi, ardından tam yanıtla sonlandırılır.
- `block`, önizleme gönderisi içinde ekleme tarzı taslak parçaları kullanır.
- `progress`, üretim sırasında bir durum önizlemesi gösterir ve nihai yanıtı yalnızca tamamlandığında gönderir.
- `off`, önizleme akışını devre dışı bırakır.
- Akış yerinde sonlandırılamazsa (örneğin gönderi akış sırasında silinmişse), OpenClaw yeni bir nihai gönderi göndermeye geri döner; böylece yanıt asla kaybolmaz.
- Yalnızca muhakeme içeren yükler kanal gönderilerinden bastırılır; buna `> Reasoning:` blok alıntısı olarak gelen metin de dahildir. Düşünmeyi diğer yüzeylerde görmek için `/reasoning on` ayarlayın; Mattermost nihai gönderisi yalnızca yanıtı içerir.
- Kanal eşleme matrisi için [Akış](/tr/concepts/streaming#preview-streaming-modes) sayfasına bakın.

## Tepkiler (mesaj aracı)

- `channel=mattermost` ile `message action=react` kullanın.
- `messageId`, Mattermost gönderi kimliğidir.
- `emoji`, `thumbsup` veya `:+1:` gibi adları kabul eder (iki nokta üst üste işaretleri isteğe bağlıdır).
- Bir tepkiyi kaldırmak için `remove=true` (boolean) ayarlayın.
- Tepki ekleme/kaldırma olayları, yönlendirilmiş aracı oturumuna sistem olayları olarak iletilir.

Örnekler:

```
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup remove=true
```

Yapılandırma:

- `channels.mattermost.actions.reactions`: tepki eylemlerini etkinleştirir/devre dışı bırakır (varsayılan true).
- Hesap başına geçersiz kılma: `channels.mattermost.accounts.<id>.actions.reactions`.

## Etkileşimli düğmeler (mesaj aracı)

Tıklanabilir düğmeler içeren mesajlar gönderin. Bir kullanıcı bir düğmeye tıkladığında aracı
seçimi alır ve yanıt verebilir.

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

`buttons` parametresi ile `message action=send` kullanın. Düğmeler 2B bir dizidir (düğme satırları):

```
message action=send channel=mattermost target=channel:<channelId> buttons=[[{"text":"Yes","callback_data":"yes"},{"text":"No","callback_data":"no"}]]
```

Düğme alanları:

- `text` (zorunlu): görüntüleme etiketi.
- `callback_data` (zorunlu): tıklama sonrası geri gönderilen değer (eylem kimliği olarak kullanılır).
- `style` (isteğe bağlı): `"default"`, `"primary"` veya `"danger"`.

Bir kullanıcı bir düğmeye tıkladığında:

1. Tüm düğmeler bir onay satırıyla değiştirilir (ör. "✓ **Yes** @user tarafından seçildi").
2. Aracı seçimi gelen mesaj olarak alır ve yanıt verir.

Notlar:

- Düğme callback'leri HMAC-SHA256 doğrulaması kullanır (otomatik, yapılandırma gerekmez).
- Mattermost, API yanıtlarından callback verilerini çıkarır (güvenlik özelliği), bu nedenle tüm düğmeler tıklamada kaldırılır — kısmi kaldırma mümkün değildir.
- Tire veya alt çizgi içeren eylem kimlikleri otomatik olarak temizlenir
  (Mattermost yönlendirme sınırlaması).

Yapılandırma:

- `channels.mattermost.capabilities`: yetenek dizeleri dizisi. Aracı sistem isteminde düğme araç açıklamasını etkinleştirmek için
  `"inlineButtons"` ekleyin.
- `channels.mattermost.interactions.callbackBaseUrl`: düğme
  callback'leri için isteğe bağlı harici base URL (örneğin `https://gateway.example.com`). Bunu, Mattermost
  gateway'e bağlandığı host üzerinden doğrudan ulaşamadığında kullanın.
- Çok hesaplı kurulumlarda aynı alanı
  `channels.mattermost.accounts.<id>.interactions.callbackBaseUrl` altında da ayarlayabilirsiniz.
- `interactions.callbackBaseUrl` atlanırsa OpenClaw, callback URL'sini
  `gateway.customBindHost` + `gateway.port` üzerinden türetir, ardından `http://localhost:<port>` değerine döner.
- Erişilebilirlik kuralı: düğme callback URL'si Mattermost sunucusundan erişilebilir olmalıdır.
  `localhost` yalnızca Mattermost ve OpenClaw aynı host/ağ ad alanında çalışıyorsa işe yarar.
- Callback hedefiniz private/tailnet/internal ise, host/domain bilgisini Mattermost
  `ServiceSettings.AllowedUntrustedInternalConnections` ayarına ekleyin.

### Doğrudan API entegrasyonu (harici betikler)

Harici betikler ve Webhook'lar, aracı `message` aracı üzerinden gitmek yerine
düğmeleri doğrudan Mattermost REST API ile gönderebilir. Mümkün olduğunda Plugin içindeki `buildButtonAttachments()` işlevini kullanın;
ham JSON gönderiyorsanız şu kuralları izleyin:

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
            id: "mybutton01", // yalnızca alfasayısal — aşağıya bakın
            type: "button", // zorunlu, yoksa tıklamalar sessizce yok sayılır
            name: "Onayla", // görüntüleme etiketi
            style: "primary", // isteğe bağlı: "default", "primary", "danger"
            integration: {
              url: "https://gateway.example.com/mattermost/interactions/default",
              context: {
                action_id: "mybutton01", // düğme id ile eşleşmelidir (ad araması için)
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

**Kritik kurallar:**

1. Ekler üst düzey `attachments` içinde değil, `props.attachments` içine gider (aksi halde sessizce yok sayılır).
2. Her eylem için `type: "button"` gerekir — aksi halde tıklamalar sessizce yutulur.
3. Her eylem için bir `id` alanı gerekir — Mattermost id'siz eylemleri yok sayar.
4. Eylem `id` değeri **yalnızca alfasayısal** olmalıdır (`[a-zA-Z0-9]`). Tire ve alt çizgiler
   Mattermost'un sunucu tarafı eylem yönlendirmesini bozar (`404` döndürür). Kullanmadan önce bunları çıkarın.
5. `context.action_id`, onay mesajının
   ham bir kimlik yerine düğme adını (ör. "Onayla") göstermesi için düğmenin `id` değeriyle eşleşmelidir.
6. `context.action_id` zorunludur — etkileşim işleyicisi bu olmadan `400` döndürür.

**HMAC token oluşturma:**

Gateway, düğme tıklamalarını HMAC-SHA256 ile doğrular. Harici betikler,
gateway doğrulama mantığıyla eşleşen token'lar üretmelidir:

1. Gizli anahtarı bot token'dan türetin:
   `HMAC-SHA256(key="openclaw-mattermost-interactions", data=botToken)`
2. `_token` hariç tüm alanlarla bağlam nesnesini oluşturun.
3. **Sıralanmış anahtarlarla** ve **boşluksuz** biçimde serileştirin (gateway, sıralanmış anahtarlarla
   `JSON.stringify` kullanır; bu da kompakt çıktı üretir).
4. İmzalama: `HMAC-SHA256(key=secret, data=serializedContext)`
5. Ortaya çıkan hex digest'i bağlama `_token` olarak ekleyin.

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

Yaygın HMAC tuzakları:

- Python'daki `json.dumps` varsayılan olarak boşluk ekler (`{"key": "val"}`). JavaScript'in kompakt çıktısıyla (`{"key":"val"}`) eşleşmesi için
  `separators=(",", ":")` kullanın.
- Her zaman **tüm** bağlam alanlarını (`_token` hariç) imzalayın. Gateway `_token` alanını çıkarır, ardından
  geriye kalan her şeyi imzalar. Bir alt kümeyi imzalamak sessiz doğrulama başarısızlığına neden olur.
- `sort_keys=True` kullanın — gateway imzalamadan önce anahtarları sıralar ve Mattermost,
  yükü depolarken bağlam alanlarını yeniden sıralayabilir.
- Gizli anahtarı rastgele baytlardan değil, bot token'dan türetin (deterministik). Gizli anahtar,
  düğmeleri oluşturan süreç ile doğrulayan gateway arasında aynı olmalıdır.

## Dizin bağdaştırıcısı

Mattermost Plugin'i, kanal ve kullanıcı adlarını
Mattermost API üzerinden çözen bir dizin bağdaştırıcısı içerir. Bu sayede
`openclaw message send` ve Cron/Webhook teslimatlarında `#channel-name` ve `@username` hedefleri kullanılabilir.

Yapılandırma gerekmez — bağdaştırıcı hesap yapılandırmasındaki bot token'ı kullanır.

## Çok hesap

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

- Kanallarda yanıt yok: botun kanalda olduğundan emin olun ve ondan bahsedin (`oncall`), bir tetikleyici öneki kullanın (`onchar`) veya `chatmode: "onmessage"` ayarlayın.
- Kimlik doğrulama hataları: bot token'ı, base URL'yi ve hesabın etkin olup olmadığını kontrol edin.
- Çok hesaplı sorunlar: ortam değişkenleri yalnızca `default` hesabı için geçerlidir.
- Yerel slash komutları `Unauthorized: invalid command token.` döndürüyor: OpenClaw
  callback token'ını kabul etmedi. Tipik nedenler:
  - slash komut kaydı başarısız oldu veya başlangıçta yalnızca kısmen tamamlandı
  - callback yanlış gateway/hesaba gidiyor
  - Mattermost hâlâ önceki callback hedefine işaret eden eski komutlara sahip
  - gateway, slash komutlarını yeniden etkinleştirmeden yeniden başlatıldı
- Yerel slash komutları çalışmayı durdurursa, günlüklerde
  `mattermost: failed to register slash commands` veya
  `mattermost: native slash commands enabled but no commands could be registered` kayıtlarını kontrol edin.
- `callbackUrl` atlanmışsa ve günlükler callback'in
  `http://127.0.0.1:18789/...` olarak çözümlendiği uyarısını veriyorsa, bu URL muhtemelen yalnızca
  Mattermost OpenClaw ile aynı host/ağ ad alanında çalıştığında erişilebilirdir. Bunun yerine
  açıkça harici olarak erişilebilir bir `commands.callbackUrl` ayarlayın.
- Düğmeler beyaz kutular olarak görünüyorsa: aracı bozuk düğme verisi gönderiyor olabilir. Her düğmede hem `text` hem `callback_data` alanlarının bulunduğunu kontrol edin.
- Düğmeler işleniyor ama tıklamalar hiçbir şey yapmıyor: Mattermost sunucu yapılandırmasında `AllowedUntrustedInternalConnections` içine `127.0.0.1 localhost` eklendiğini ve `ServiceSettings` içinde `EnablePostActionIntegration` değerinin `true` olduğunu doğrulayın.
- Düğmeler tıklamada `404` döndürüyor: düğme `id` değeri muhtemelen tire veya alt çizgi içeriyor. Mattermost'un eylem yönlendiricisi alfasayısal olmayan kimliklerde bozulur. Yalnızca `[a-zA-Z0-9]` kullanın.
- Gateway günlüklerinde `invalid _token`: HMAC uyuşmazlığı. Tüm bağlam alanlarını imzaladığınızı (bir alt kümeyi değil), sıralı anahtarlar kullandığınızı ve kompakt JSON kullandığınızı (boşluksuz) kontrol edin. Yukarıdaki HMAC bölümüne bakın.
- Gateway günlüklerinde `missing _token in context`: düğmenin bağlamında `_token` alanı yok. Entegrasyon yükünü oluştururken bunun eklendiğinden emin olun.
- Onay, düğme adı yerine ham kimlik gösteriyor: `context.action_id`, düğmenin `id` değeriyle eşleşmiyor. İkisini de aynı temizlenmiş değere ayarlayın.
- Aracı düğmelerden haberdar değil: Mattermost kanal yapılandırmasına `capabilities: ["inlineButtons"]` ekleyin.

## İlgili

- [Kanal Genel Bakış](/tr/channels) — desteklenen tüm kanallar
- [Eşleştirme](/tr/channels/pairing) — DM kimlik doğrulaması ve eşleştirme akışı
- [Gruplar](/tr/channels/groups) — grup sohbeti davranışı ve bahsetme kapısı
- [Kanal Yönlendirme](/tr/channels/channel-routing) — mesajlar için oturum yönlendirmesi
- [Güvenlik](/tr/gateway/security) — erişim modeli ve sağlamlaştırma
