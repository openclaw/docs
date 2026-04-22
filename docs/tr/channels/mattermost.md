---
read_when:
    - Mattermost kurulumu
    - Mattermost yönlendirmesinde hata ayıklama
summary: Mattermost bot kurulumu ve OpenClaw yapılandırması
title: Mattermost
x-i18n:
    generated_at: "2026-04-22T04:19:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: dd3059c5e64f417edc02c3e850ddd066e38decda0cbdcea31e1c57136e6bcb1d
    source_path: channels/mattermost.md
    workflow: 15
---

# Mattermost

Durum: paketle birlikte gelen plugin (bot token + WebSocket olayları). Kanallar, gruplar ve DM'ler desteklenir.
Mattermost, kendi kendine barındırılabilen bir ekip mesajlaşma platformudur; ürün ayrıntıları ve indirmeler için
resmi site olan [mattermost.com](https://mattermost.com) adresine bakın.

## Paketle birlikte gelen plugin

Mattermost, güncel OpenClaw sürümlerinde paketle birlikte gelen bir plugin olarak sunulur; bu nedenle normal
paketlenmiş derlemelerde ayrı bir kurulum gerekmez.

Eski bir derlemeyi veya Mattermost'u içermeyen özel bir kurulumu kullanıyorsanız,
onu manuel olarak kurun:

CLI ile kurulum (npm registry):

```bash
openclaw plugins install @openclaw/mattermost
```

Yerel checkout (bir git deposundan çalıştırırken):

```bash
openclaw plugins install ./path/to/local/mattermost-plugin
```

Ayrıntılar: [Plugins](/tr/tools/plugin)

## Hızlı kurulum

1. Mattermost plugin'inin kullanılabilir olduğundan emin olun.
   - Güncel paketlenmiş OpenClaw sürümleri bunu zaten paketle birlikte sunar.
   - Eski/özel kurulumlar bunu yukarıdaki komutlarla manuel olarak ekleyebilir.
2. Bir Mattermost bot hesabı oluşturun ve **bot token** değerini kopyalayın.
3. Mattermost **base URL** değerini kopyalayın (ör. `https://chat.example.com`).
4. OpenClaw'u yapılandırın ve Gateway'i başlatın.

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

## Yerel slash komutları

Yerel slash komutları isteğe bağlıdır. Etkinleştirildiğinde OpenClaw,
Mattermost API üzerinden `oc_*` slash komutlarını kaydeder ve Gateway HTTP sunucusunda callback POST'larını alır.

```json5
{
  channels: {
    mattermost: {
      commands: {
        native: true,
        nativeSkills: true,
        callbackPath: "/api/channels/mattermost/command",
        // Mattermost Gateway'e doğrudan ulaşamadığında kullanın (reverse proxy/public URL).
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
    },
  },
}
```

Notlar:

- `native: "auto"` Mattermost için varsayılan olarak devre dışıdır. Etkinleştirmek için `native: true` ayarlayın.
- `callbackUrl` atlanırsa OpenClaw, Gateway host/port + `callbackPath` üzerinden bir değer türetir.
- Çoklu hesap kurulumlarında `commands` üst düzeyde veya
  `channels.mattermost.accounts.<id>.commands` altında ayarlanabilir (hesap değerleri üst düzey alanları geçersiz kılar).
- Komut callback'leri, OpenClaw'un `oc_*` komutlarını kaydederken Mattermost'un döndürdüğü
  komut başına token'larla doğrulanır.
- Kayıt başarısız olduğunda, başlangıç kısmi kaldığında veya
  callback token'ı kayıtlı komutlardan biriyle eşleşmediğinde slash callback'leri kapalı-güvenli şekilde başarısız olur.
- Erişilebilirlik gereksinimi: callback uç noktası Mattermost sunucusundan erişilebilir olmalıdır.
  - Mattermost, OpenClaw ile aynı host/ağ namespace'inde çalışmıyorsa `callbackUrl` için `localhost` ayarlamayın.
  - Bu URL `/api/channels/mattermost/command` yolunu OpenClaw'a reverse-proxy etmiyorsa, `callbackUrl` için Mattermost base URL'nizi ayarlamayın.
  - Hızlı bir kontrol için `curl https://<gateway-host>/api/channels/mattermost/command` kullanın; bir GET isteği `404` değil, OpenClaw'dan `405 Method Not Allowed` döndürmelidir.
- Mattermost çıkış allowlist gereksinimi:
  - Callback'iniz private/tailnet/internal adresleri hedefliyorsa, Mattermost
    `ServiceSettings.AllowedUntrustedInternalConnections` ayarını callback host/domain'ini içerecek şekilde yapılandırın.
  - Tam URL'ler değil, host/domain girdileri kullanın.
    - İyi: `gateway.tailnet-name.ts.net`
    - Kötü: `https://gateway.tailnet-name.ts.net`

## Ortam değişkenleri (varsayılan hesap)

Ortam değişkenlerini tercih ediyorsanız bunları Gateway host'unda ayarlayın:

- `MATTERMOST_BOT_TOKEN=...`
- `MATTERMOST_URL=https://chat.example.com`

Ortam değişkenleri yalnızca **varsayılan** hesap (`default`) için geçerlidir. Diğer hesaplarda yapılandırma değerleri kullanılmalıdır.

## Sohbet modları

Mattermost, DM'lere otomatik olarak yanıt verir. Kanal davranışı `chatmode` ile kontrol edilir:

- `oncall` (varsayılan): kanallarda yalnızca @mention yapıldığında yanıt ver.
- `onmessage`: her kanal mesajına yanıt ver.
- `onchar`: bir mesaj bir tetikleyici önek ile başladığında yanıt ver.

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
- `channels.mattermost.requireMention` eski yapılandırmalarda dikkate alınır, ancak `chatmode` tercih edilir.

## Thread'ler ve oturumlar

Kanal ve grup yanıtlarının ana kanalda mı kalacağını yoksa tetikleyen gönderinin altında bir thread mi başlatacağını
kontrol etmek için `channels.mattermost.replyToMode` kullanın.

- `off` (varsayılan): yalnızca gelen gönderi zaten bir thread içindeyse thread içinde yanıt ver.
- `first`: üst düzey kanal/grup gönderileri için, o gönderinin altında bir thread başlat ve konuşmayı
  thread kapsamlı bir oturuma yönlendir.
- `all`: bugün Mattermost için `first` ile aynı davranış.
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

- Thread kapsamlı oturumlar, tetikleyen gönderi kimliğini thread kökü olarak kullanır.
- `first` ve `all` şu anda eşdeğerdir; çünkü Mattermost bir thread köküne sahip olduktan sonra,
  devam eden parçalar ve medya aynı thread içinde sürer.

## Erişim denetimi (DM'ler)

- Varsayılan: `channels.mattermost.dmPolicy = "pairing"` (bilinmeyen göndericiler bir eşleştirme kodu alır).
- Şununla onaylayın:
  - `openclaw pairing list mattermost`
  - `openclaw pairing approve mattermost <CODE>`
- Herkese açık DM'ler: `channels.mattermost.dmPolicy="open"` artı `channels.mattermost.allowFrom=["*"]`.

## Kanallar (gruplar)

- Varsayılan: `channels.mattermost.groupPolicy = "allowlist"` (mention geçitli).
- Göndericileri `channels.mattermost.groupAllowFrom` ile allowlist'e ekleyin (kullanıcı kimlikleri önerilir).
- Kanal başına mention geçersiz kılmaları `channels.mattermost.groups.<channelId>.requireMention`
  veya varsayılan için `channels.mattermost.groups["*"].requireMention` altında bulunur.
- `@username` eşleştirmesi değişkendir ve yalnızca `channels.mattermost.dangerouslyAllowNameMatching: true` olduğunda etkinleşir.
- Açık kanallar: `channels.mattermost.groupPolicy="open"` (mention geçitli).
- Çalışma zamanı notu: `channels.mattermost` tamamen eksikse, çalışma zamanı grup kontrolleri için
  `groupPolicy="allowlist"` değerine geri döner (`channels.defaults.groupPolicy` ayarlı olsa bile).

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

Düz opak kimlikler (ör. `64ifufp...`) Mattermost'ta **belirsizdir** (kullanıcı kimliği mi kanal kimliği mi).

OpenClaw bunları **önce kullanıcı** olacak şekilde çözer:

- Kimlik bir kullanıcı olarak varsa (`GET /api/v4/users/<id>` başarılı olursa), OpenClaw
  doğrudan kanalı `/api/v4/channels/direct` üzerinden çözerek bir **DM** gönderir.
- Aksi halde kimlik bir **kanal kimliği** olarak ele alınır.

Belirli davranış gerekiyorsa her zaman açık önekleri kullanın (`user:<id>` / `channel:<id>`).

## DM kanal yeniden denemesi

OpenClaw bir Mattermost DM hedefine gönderim yaptığında ve önce doğrudan kanalı çözmesi gerektiğinde,
varsayılan olarak geçici doğrudan kanal oluşturma hatalarını yeniden dener.

Bu davranışı Mattermost plugin'i için genel olarak ayarlamak üzere `channels.mattermost.dmChannelRetry`,
tek bir hesap için ise `channels.mattermost.accounts.<id>.dmChannelRetry` kullanın.

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
- Yeniden denemeler; oran sınırlamaları, 5xx yanıtları ve ağ veya zaman aşımı hataları gibi geçici hatalara uygulanır.
- `429` dışındaki 4xx istemci hataları kalıcı kabul edilir ve yeniden denenmez.

## Önizleme akışı

Mattermost; düşünme, araç etkinliği ve kısmi yanıt metnini tek bir **taslak önizleme gönderisi** içinde akıtır; bu gönderi, son yanıt güvenle gönderilebildiğinde yerinde kesinleştirilir. Önizleme, kanalın parça başına mesajlarla doldurulması yerine aynı gönderi kimliği üzerinde güncellenir. Medya/hata sonlandırmaları bekleyen önizleme düzenlemelerini iptal eder ve geçici bir önizleme gönderisini boşaltmak yerine normal teslimatı kullanır.

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

- `partial` genellikle tercih edilen seçenektir: yanıt büyüdükçe düzenlenen tek bir önizleme gönderisi, ardından tam yanıtla kesinleştirme.
- `block`, önizleme gönderisi içinde eklemeli taslak parçaları kullanır.
- `progress`, üretim sırasında bir durum önizlemesi gösterir ve son yanıtı yalnızca tamamlandığında gönderir.
- `off`, önizleme akışını devre dışı bırakır.
- Akış yerinde kesinleştirilemezse (örneğin gönderi akış sırasında silinirse), OpenClaw yanıtın asla kaybolmaması için yeni bir son gönderi göndermeye geri döner.
- Kanal eşleme matrisi için [Streaming](/tr/concepts/streaming#preview-streaming-modes) bölümüne bakın.

## Tepkiler (message aracı)

- `channel=mattermost` ile `message action=react` kullanın.
- `messageId`, Mattermost gönderi kimliğidir.
- `emoji`, `thumbsup` veya `:+1:` gibi adları kabul eder (iki nokta üst üste işaretleri isteğe bağlıdır).
- Bir tepkiyi kaldırmak için `remove=true` (boolean) ayarlayın.
- Tepki ekleme/kaldırma olayları, yönlendirilmiş agent oturumuna sistem olayları olarak iletilir.

Örnekler:

```
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup remove=true
```

Yapılandırma:

- `channels.mattermost.actions.reactions`: tepki eylemlerini etkinleştir/devre dışı bırak (varsayılan true).
- Hesap başına geçersiz kılma: `channels.mattermost.accounts.<id>.actions.reactions`.

## Etkileşimli düğmeler (message aracı)

Tıklanabilir düğmeler içeren mesajlar gönderin. Bir kullanıcı bir düğmeye tıkladığında, agent seçimi alır
ve yanıt verebilir.

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

`buttons` parametresiyle `message action=send` kullanın. Düğmeler 2D bir dizidir (düğme satırları):

```
message action=send channel=mattermost target=channel:<channelId> buttons=[[{"text":"Yes","callback_data":"yes"},{"text":"No","callback_data":"no"}]]
```

Düğme alanları:

- `text` (gerekli): görüntüleme etiketi.
- `callback_data` (gerekli): tıklamada geri gönderilen değer (eylem kimliği olarak kullanılır).
- `style` (isteğe bağlı): `"default"`, `"primary"` veya `"danger"`.

Bir kullanıcı bir düğmeye tıkladığında:

1. Tüm düğmeler bir onay satırıyla değiştirilir (ör. "✓ **Yes** @user tarafından seçildi").
2. Agent seçimi gelen bir mesaj olarak alır ve yanıt verir.

Notlar:

- Düğme callback'leri HMAC-SHA256 doğrulaması kullanır (otomatik, yapılandırma gerekmez).
- Mattermost, API yanıtlarından callback verilerini çıkarır (güvenlik özelliği), bu nedenle tıklamada tüm düğmeler kaldırılır — kısmi kaldırma mümkün değildir.
- Tire veya alt çizgi içeren eylem kimlikleri otomatik olarak temizlenir
  (Mattermost yönlendirme sınırlaması).

Yapılandırma:

- `channels.mattermost.capabilities`: yetenek dizeleri dizisi. Agent sistem isteminde düğmeler aracı açıklamasını
  etkinleştirmek için `"inlineButtons"` ekleyin.
- `channels.mattermost.interactions.callbackBaseUrl`: düğme callback'leri için isteğe bağlı dış base URL
  (örneğin `https://gateway.example.com`). Mattermost, Gateway'e doğrudan
  bind host'u üzerinden ulaşamadığında bunu kullanın.
- Çoklu hesap kurulumlarında aynı alanı
  `channels.mattermost.accounts.<id>.interactions.callbackBaseUrl` altında da ayarlayabilirsiniz.
- `interactions.callbackBaseUrl` atlanırsa OpenClaw callback URL'yi
  `gateway.customBindHost` + `gateway.port` üzerinden türetir, ardından `http://localhost:<port>` değerine geri döner.
- Erişilebilirlik kuralı: düğme callback URL'si Mattermost sunucusundan erişilebilir olmalıdır.
  `localhost` yalnızca Mattermost ve OpenClaw aynı host/ağ namespace'inde çalışıyorsa işe yarar.
- Callback hedefiniz private/tailnet/internal ise host/domain'ini Mattermost
  `ServiceSettings.AllowedUntrustedInternalConnections` ayarına ekleyin.

### Doğrudan API entegrasyonu (harici betikler)

Harici betikler ve Webhook'lar, agent'ın `message` aracı üzerinden gitmek yerine düğmeleri doğrudan Mattermost REST API üzerinden gönderebilir.
Mümkün olduğunda extension içindeki `buildButtonAttachments()` işlevini kullanın; ham JSON gönderiyorsanız şu kurallara uyun:

**Payload yapısı:**

```json5
{
  channel_id: "<channelId>",
  message: "Choose an option:",
  props: {
    attachments: [
      {
        actions: [
          {
            id: "mybutton01", // yalnızca alfanümerik — aşağıya bakın
            type: "button", // gerekli, aksi halde tıklamalar sessizce yok sayılır
            name: "Approve", // görüntüleme etiketi
            style: "primary", // isteğe bağlı: "default", "primary", "danger"
            integration: {
              url: "https://gateway.example.com/mattermost/interactions/default",
              context: {
                action_id: "mybutton01", // düğme kimliğiyle eşleşmelidir (ad araması için)
                action: "approve",
                // ... herhangi bir özel alan ...
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

1. Ekler üst düzey `attachments` içinde değil, `props.attachments` içinde yer alır (aksi halde sessizce yok sayılır).
2. Her eylem için `type: "button"` gerekir — bu olmadan tıklamalar sessizce yutulur.
3. Her eylem için bir `id` alanı gerekir — Mattermost kimliksiz eylemleri yok sayar.
4. Eylem `id` değeri **yalnızca alfanümerik** olmalıdır (`[a-zA-Z0-9]`). Tire ve alt çizgi
   Mattermost'un sunucu tarafı eylem yönlendirmesini bozar (`404` döndürür). Kullanmadan önce bunları çıkarın.
5. `context.action_id`, düğme adı
   (örneğin "Approve") ham kimlik yerine onay mesajında görünsün diye düğmenin `id` değeriyle eşleşmelidir.
6. `context.action_id` zorunludur — etkileşim işleyicisi bu alan olmadan `400` döndürür.

**HMAC token oluşturma:**

Gateway, düğme tıklamalarını HMAC-SHA256 ile doğrular. Harici betikler,
Gateway'in doğrulama mantığıyla eşleşen token'lar üretmelidir:

1. Gizli anahtarı bot token'dan türetin:
   `HMAC-SHA256(key="openclaw-mattermost-interactions", data=botToken)`
2. Bağlam nesnesini `_token` dışındaki tüm alanlarla oluşturun.
3. **Sıralanmış anahtarlarla** ve **boşluksuz** serileştirin (Gateway, sıralanmış anahtarlarla
   `JSON.stringify` kullanır; bu da sıkılaştırılmış çıktı üretir).
4. İmzalayın: `HMAC-SHA256(key=secret, data=serializedContext)`
5. Elde edilen hex özeti bağlama `_token` olarak ekleyin.

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

- Python'un `json.dumps` işlevi varsayılan olarak boşluk ekler (`{"key": "val"}`). JavaScript'in sıkılaştırılmış çıktısıyla (`{"key":"val"}`) eşleşmesi için
  `separators=(",", ":")` kullanın.
- Her zaman **tüm** bağlam alanlarını (`_token` hariç) imzalayın. Gateway `_token` alanını çıkarır,
  ardından kalan her şeyi imzalar. Bir alt kümeyi imzalamak sessiz doğrulama hatasına neden olur.
- `sort_keys=True` kullanın — Gateway imzalamadan önce anahtarları sıralar ve Mattermost
  payload'u saklarken bağlam alanlarını yeniden sıralayabilir.
- Gizli anahtarı rastgele baytlardan değil, bot token'dan türetin (deterministik).
  Düğmeleri oluşturan süreç ile doğrulayan Gateway için gizli anahtar aynı olmalıdır.

## Dizin bağdaştırıcısı

Mattermost plugin'i, kanal ve kullanıcı adlarını
Mattermost API üzerinden çözen bir dizin bağdaştırıcısı içerir. Bu, `openclaw message send` ve
Cron/Webhook teslimatlarında `#channel-name` ve `@username` hedeflerini etkinleştirir.

Yapılandırma gerekmez — bağdaştırıcı, hesap yapılandırmasındaki bot token'ı kullanır.

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

- Kanallarda yanıt yok: botun kanalda olduğundan emin olun ve ondan söz edin (`oncall`), bir tetikleyici önek kullanın (`onchar`) veya `chatmode: "onmessage"` ayarlayın.
- Kimlik doğrulama hataları: bot token'ı, base URL'yi ve hesabın etkin olup olmadığını kontrol edin.
- Çoklu hesap sorunları: ortam değişkenleri yalnızca `default` hesabı için geçerlidir.
- Yerel slash komutları `Unauthorized: invalid command token.` döndürüyor: OpenClaw
  callback token'ını kabul etmedi. Tipik nedenler:
  - slash komutu kaydı başarısız oldu veya başlangıçta yalnızca kısmen tamamlandı
  - callback yanlış Gateway/hesaba gidiyor
  - Mattermost hâlâ önceki bir callback hedefine işaret eden eski komutlara sahip
  - Gateway, slash komutlarını yeniden etkinleştirmeden yeniden başlatıldı
- Yerel slash komutları çalışmayı bırakırsa şu günlükleri kontrol edin:
  `mattermost: failed to register slash commands` veya
  `mattermost: native slash commands enabled but no commands could be registered`.
- `callbackUrl` atlanmışsa ve günlüklerde callback'in
  `http://127.0.0.1:18789/...` olarak çözümlendiğine dair bir uyarı varsa, bu URL muhtemelen yalnızca
  Mattermost, OpenClaw ile aynı host/ağ namespace'inde çalıştığında erişilebilirdir. Bunun yerine
  açıkça dışarıdan erişilebilir bir `commands.callbackUrl` ayarlayın.
- Düğmeler beyaz kutular olarak görünüyor: agent hatalı biçimlendirilmiş düğme verileri gönderiyor olabilir. Her düğmede hem `text` hem `callback_data` alanlarının bulunduğunu kontrol edin.
- Düğmeler görüntüleniyor ama tıklamalar hiçbir şey yapmıyor: Mattermost sunucu yapılandırmasında `AllowedUntrustedInternalConnections` içine `127.0.0.1 localhost` eklendiğini ve ServiceSettings içinde `EnablePostActionIntegration` değerinin `true` olduğunu doğrulayın.
- Düğmeler tıklamada 404 döndürüyor: düğme `id` değeri büyük olasılıkla tire veya alt çizgi içeriyor. Mattermost'un eylem yönlendiricisi alfanümerik olmayan kimliklerde bozulur. Yalnızca `[a-zA-Z0-9]` kullanın.
- Gateway günlüklerinde `invalid _token`: HMAC uyuşmazlığı. Tüm bağlam alanlarını (bir alt küme değil) imzaladığınızı, sıralanmış anahtarlar kullandığınızı ve sıkılaştırılmış JSON kullandığınızı (boşluksuz) kontrol edin. Yukarıdaki HMAC bölümüne bakın.
- Gateway günlüklerinde `missing _token in context`: `_token` alanı düğmenin bağlamında yok. Entegrasyon payload'unu oluştururken bunun eklendiğinden emin olun.
- Onay, düğme adı yerine ham kimliği gösteriyor: `context.action_id`, düğmenin `id` değeriyle eşleşmiyor. İkisini de aynı temizlenmiş değere ayarlayın.
- Agent düğmelerden habersiz: Mattermost kanal yapılandırmasına `capabilities: ["inlineButtons"]` ekleyin.

## İlgili

- [Channels Overview](/tr/channels) — desteklenen tüm kanallar
- [Pairing](/tr/channels/pairing) — DM kimlik doğrulaması ve eşleştirme akışı
- [Groups](/tr/channels/groups) — grup sohbeti davranışı ve mention geçitleme
- [Channel Routing](/tr/channels/channel-routing) — mesajlar için oturum yönlendirme
- [Security](/tr/gateway/security) — erişim modeli ve sağlamlaştırma
