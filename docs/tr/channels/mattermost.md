---
read_when:
    - Mattermost kurulurken
    - Mattermost yönlendirmesinde hata ayıklarken
summary: Mattermost bot kurulumu ve OpenClaw yapılandırması
title: Mattermost
x-i18n:
    generated_at: "2026-04-05T13:46:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: f21dc7543176fda0b38b00fab60f0daae38dffcf68fa1cf7930a9f14ec57cb5a
    source_path: channels/mattermost.md
    workflow: 15
---

# Mattermost

Durum: paketlenmiş eklenti (bot token + WebSocket olayları). Kanallar, gruplar ve DM'ler desteklenir.
Mattermost, kendi barındırılabilen bir ekip mesajlaşma platformudur; ürün ayrıntıları ve indirmeler için resmi site olan
[mattermost.com](https://mattermost.com) adresine bakın.

## Paketlenmiş eklenti

Mattermost, güncel OpenClaw sürümlerinde paketlenmiş bir eklenti olarak gelir; bu nedenle normal
paketlenmiş derlemelerde ayrı bir kurulum gerekmez.

Daha eski bir derlemedeyseniz veya Mattermost'u içermeyen özel bir kurulum kullanıyorsanız,
elle yükleyin:

CLI ile yükleme (npm kayıt defteri):

```bash
openclaw plugins install @openclaw/mattermost
```

Yerel checkout (bir git deposundan çalıştırırken):

```bash
openclaw plugins install ./path/to/local/mattermost-plugin
```

Ayrıntılar: [Eklentiler](/tools/plugin)

## Hızlı kurulum

1. Mattermost eklentisinin kullanılabilir olduğundan emin olun.
   - Güncel paketlenmiş OpenClaw sürümleri bunu zaten içerir.
   - Daha eski/özel kurulumlar bunu yukarıdaki komutlarla elle ekleyebilir.
2. Bir Mattermost bot hesabı oluşturun ve **bot token** değerini kopyalayın.
3. Mattermost **temel URL**'sini kopyalayın (örneğin `https://chat.example.com`).
4. OpenClaw'ı yapılandırın ve ağ geçidini başlatın.

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
Mattermost API üzerinden `oc_*` slash komutlarını kaydeder ve ağ geçidi HTTP sunucusunda
geri çağırım POST isteklerini alır.

```json5
{
  channels: {
    mattermost: {
      commands: {
        native: true,
        nativeSkills: true,
        callbackPath: "/api/channels/mattermost/command",
        // Mattermost ağ geçidine doğrudan ulaşamadığında kullanın (ters proxy/genel URL).
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
    },
  },
}
```

Notlar:

- `native: "auto"` Mattermost için varsayılan olarak devre dışıdır. Etkinleştirmek için `native: true` ayarlayın.
- `callbackUrl` atlanırsa OpenClaw bunu ağ geçidi ana makinesi/portunun ve `callbackPath` değerinin birleşiminden türetir.
- Çoklu hesap kurulumlarında `commands`, üst düzeyde veya
  `channels.mattermost.accounts.<id>.commands` altında ayarlanabilir (hesap değerleri üst düzey alanları geçersiz kılar).
- Komut geri çağırımları, OpenClaw'ın `oc_*` komutlarını kaydederken
  Mattermost'un döndürdüğü komut başına token'larla doğrulanır.
- Slash geri çağırımları; kayıt başarısız olduysa, başlangıç kısmi kaldıysa veya
  geri çağırım token'ı kayıtlı komutlardan biriyle eşleşmiyorsa kapalı başarısız olur.
- Erişilebilirlik gereksinimi: geri çağırım uç noktasına Mattermost sunucusundan erişilebilmelidir.
  - Mattermost, OpenClaw ile aynı ana makinede/ağ ad alanında çalışmıyorsa `callbackUrl` için `localhost` ayarlamayın.
  - Bu URL, `/api/channels/mattermost/command` yolunu OpenClaw'a ters proxy ile yönlendirmiyorsa `callbackUrl` için Mattermost temel URL'nizi ayarlamayın.
  - Hızlı bir kontrol olarak `curl https://<gateway-host>/api/channels/mattermost/command` çalıştırabilirsiniz; bir GET isteği `404` değil, OpenClaw'dan `405 Method Not Allowed` döndürmelidir.
- Mattermost çıkış allowlist gereksinimi:
  - Geri çağırımınız private/tailnet/internal adresleri hedefliyorsa, geri çağırım ana makinesini/alan adını içerecek şekilde Mattermost
    `ServiceSettings.AllowedUntrustedInternalConnections` ayarını yapın.
  - Tam URL değil, ana makine/alan adı girdileri kullanın.
    - İyi: `gateway.tailnet-name.ts.net`
    - Kötü: `https://gateway.tailnet-name.ts.net`

## Ortam değişkenleri (varsayılan hesap)

Ortam değişkenlerini tercih ediyorsanız bunları ağ geçidi ana makinesinde ayarlayın:

- `MATTERMOST_BOT_TOKEN=...`
- `MATTERMOST_URL=https://chat.example.com`

Ortam değişkenleri yalnızca **varsayılan** hesap (`default`) için geçerlidir. Diğer hesaplar yapılandırma değerlerini kullanmalıdır.

## Sohbet kipleri

Mattermost, DM'lere otomatik olarak yanıt verir. Kanal davranışı `chatmode` ile kontrol edilir:

- `oncall` (varsayılan): kanallarda yalnızca @mention yapıldığında yanıt verir.
- `onmessage`: her kanal mesajına yanıt verir.
- `onchar`: bir mesaj tetikleyici önekle başladığında yanıt verir.

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
- `channels.mattermost.requireMention` eski yapılandırmalarda dikkate alınır ancak `chatmode` tercih edilir.

## Threading ve oturumlar

Kanal ve grup yanıtlarının ana kanalda mı kalacağını
yoksa tetikleyici gönderinin altında bir thread mi başlatacağını kontrol etmek için `channels.mattermost.replyToMode` kullanın.

- `off` (varsayılan): yalnızca gelen gönderi zaten bir thread içindeyse bir thread içinde yanıt verir.
- `first`: üst düzey kanal/grup gönderileri için bu gönderinin altında bir thread başlatır ve
  konuşmayı thread kapsamlı bir oturuma yönlendirir.
- `all`: bugün Mattermost için `first` ile aynı davranışı gösterir.
- Doğrudan mesajlar bu ayarı yok sayar ve thread kullanılmadan kalır.

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

- Thread kapsamlı oturumlar, tetikleyici gönderi kimliğini thread kökü olarak kullanır.
- `first` ve `all` şu anda eşdeğerdir çünkü Mattermost bir thread köküne sahip olduğunda
  devam parçaları ve medya aynı thread içinde sürer.

## Erişim denetimi (DM'ler)

- Varsayılan: `channels.mattermost.dmPolicy = "pairing"` (bilinmeyen göndericiler bir eşleştirme kodu alır).
- Onaylama:
  - `openclaw pairing list mattermost`
  - `openclaw pairing approve mattermost <CODE>`
- Herkese açık DM'ler: `channels.mattermost.dmPolicy="open"` ve `channels.mattermost.allowFrom=["*"]`.

## Kanallar (gruplar)

- Varsayılan: `channels.mattermost.groupPolicy = "allowlist"` (mention geçitli).
- `channels.mattermost.groupAllowFrom` ile göndericileri allowlist'e ekleyin (kullanıcı kimlikleri önerilir).
- Kanal başına mention geçersiz kılmaları `channels.mattermost.groups.<channelId>.requireMention`
  altında veya varsayılan için `channels.mattermost.groups["*"].requireMention` altında bulunur.
- `@username` eşleştirmesi değişkendir ve yalnızca `channels.mattermost.dangerouslyAllowNameMatching: true` olduğunda etkindir.
- Açık kanallar: `channels.mattermost.groupPolicy="open"` (mention geçitli).
- Çalışma zamanı notu: `channels.mattermost` tamamen yoksa, çalışma zamanı grup kontrolleri için `groupPolicy="allowlist"` varsayımına döner (`channels.defaults.groupPolicy` ayarlı olsa bile).

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
- Bir DM için `@username` (Mattermost API üzerinden çözülür)

Çıplak opak kimlikler (`64ifufp...` gibi) Mattermost'ta **belirsizdir** (kullanıcı kimliği mi kanal kimliği mi).

OpenClaw bunları **önce kullanıcı** olacak şekilde çözümler:

- Kimlik bir kullanıcı olarak varsa (`GET /api/v4/users/<id>` başarılı olursa), OpenClaw `/api/v4/channels/direct` üzerinden doğrudan kanalı çözümleyerek bir **DM** gönderir.
- Aksi halde kimlik bir **kanal kimliği** olarak değerlendirilir.

Belirlenimli davranış istiyorsanız her zaman açık önekleri kullanın (`user:<id>` / `channel:<id>`).

## DM kanal yeniden denemesi

OpenClaw bir Mattermost DM hedefine gönderim yaparken önce doğrudan kanalı çözümlemek zorundaysa,
geçici doğrudan kanal oluşturma hatalarını varsayılan olarak yeniden dener.

Bu davranışı Mattermost eklentisi genelinde ayarlamak için `channels.mattermost.dmChannelRetry`,
tek bir hesap için ayarlamak için `channels.mattermost.accounts.<id>.dmChannelRetry` kullanın.

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

- Bu yalnızca DM kanal oluşturma işlemi (`/api/v4/channels/direct`) için geçerlidir, her Mattermost API çağrısı için değil.
- Yeniden denemeler; hız sınırları, 5xx yanıtları ve ağ veya zaman aşımı hataları gibi geçici hatalara uygulanır.
- `429` dışındaki 4xx istemci hataları kalıcı kabul edilir ve yeniden denenmez.

## Tepkiler (mesaj aracı)

- `channel=mattermost` ile `message action=react` kullanın.
- `messageId`, Mattermost gönderi kimliğidir.
- `emoji`, `thumbsup` veya `:+1:` gibi adları kabul eder (iki nokta üst üste işaretleri isteğe bağlıdır).
- Bir tepkiyi kaldırmak için `remove=true` (boolean) ayarlayın.
- Tepki ekleme/kaldırma olayları, yönlendirilen aracı oturumuna sistem olayları olarak iletilir.

Örnekler:

```
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup remove=true
```

Yapılandırma:

- `channels.mattermost.actions.reactions`: tepki eylemlerini etkinleştirir/devre dışı bırakır (varsayılan true).
- Hesap başına geçersiz kılma: `channels.mattermost.accounts.<id>.actions.reactions`.

## Etkileşimli düğmeler (mesaj aracı)

Tıklanabilir düğmeler içeren mesajlar gönderin. Kullanıcı bir düğmeye tıkladığında aracı seçimi alır
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

`buttons` parametresiyle `message action=send` kullanın. Düğmeler 2 boyutlu bir dizidir (düğme satırları):

```
message action=send channel=mattermost target=channel:<channelId> buttons=[[{"text":"Yes","callback_data":"yes"},{"text":"No","callback_data":"no"}]]
```

Düğme alanları:

- `text` (gerekli): görüntülenecek etiket.
- `callback_data` (gerekli): tıklama sırasında geri gönderilen değer (eylem kimliği olarak kullanılır).
- `style` (isteğe bağlı): `"default"`, `"primary"` veya `"danger"`.

Kullanıcı bir düğmeye tıkladığında:

1. Tüm düğmeler bir onay satırıyla değiştirilir (örneğin, "✓ **Yes** @user tarafından seçildi").
2. Aracı seçimi gelen mesaj olarak alır ve yanıt verir.

Notlar:

- Düğme geri çağırımları HMAC-SHA256 doğrulaması kullanır (otomatik, yapılandırma gerekmez).
- Mattermost, API yanıtlarından callback verilerini çıkarır (güvenlik özelliği), bu nedenle tıklamada tüm düğmeler kaldırılır — kısmi kaldırma mümkün değildir.
- Tire veya alt çizgi içeren eylem kimlikleri otomatik olarak temizlenir
  (Mattermost yönlendirme sınırlaması).

Yapılandırma:

- `channels.mattermost.capabilities`: yetenek dizgesi dizisi. Aracı sistem isteminde
  düğmeler aracı açıklamasını etkinleştirmek için `"inlineButtons"` ekleyin.
- `channels.mattermost.interactions.callbackBaseUrl`: düğme geri çağırımları için isteğe bağlı harici temel URL
  (örneğin `https://gateway.example.com`). Mattermost ağ geçidine
  doğrudan bağlandığı ana makineden erişemediğinde bunu kullanın.
- Çoklu hesap kurulumlarında aynı alanı
  `channels.mattermost.accounts.<id>.interactions.callbackBaseUrl` altında da ayarlayabilirsiniz.
- `interactions.callbackBaseUrl` atlanırsa OpenClaw geri çağırım URL'sini
  `gateway.customBindHost` + `gateway.port` değerlerinden türetir, ardından `http://localhost:<port>` değerine döner.
- Erişilebilirlik kuralı: düğme geri çağırım URL'sine Mattermost sunucusundan erişilebilmelidir.
  `localhost` yalnızca Mattermost ve OpenClaw aynı ana makinede/ağ ad alanında çalışıyorsa işe yarar.
- Geri çağırım hedefiniz private/tailnet/internal ise, onun ana makinesini/alan adını Mattermost
  `ServiceSettings.AllowedUntrustedInternalConnections` ayarına ekleyin.

### Doğrudan API entegrasyonu (harici betikler)

Harici betikler ve webhook'lar, aracının `message` aracı üzerinden gitmek yerine
düğmeleri doğrudan Mattermost REST API üzerinden gönderebilir. Mümkün olduğunda uzantıdaki
`buildButtonAttachments()` işlevini kullanın; ham JSON gönderiyorsanız şu kurallara uyun:

**Payload yapısı:**

```json5
{
  channel_id: "<channelId>",
  message: "Bir seçenek belirleyin:",
  props: {
    attachments: [
      {
        actions: [
          {
            id: "mybutton01", // yalnızca alfanümerik — aşağıya bakın
            type: "button", // gerekli, aksi halde tıklamalar sessizce yok sayılır
            name: "Approve", // görüntülenecek etiket
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

1. Attachment'lar üst düzey `attachments` içinde değil, `props.attachments` içinde olmalıdır (aksi halde sessizce yok sayılır).
2. Her eylem `type: "button"` içermelidir — bu olmadan tıklamalar sessizce yutulur.
3. Her eylem bir `id` alanına ihtiyaç duyar — Mattermost kimlik olmadan eylemleri yok sayar.
4. Eylem `id` değeri **yalnızca alfanümerik** olmalıdır (`[a-zA-Z0-9]`). Tire ve alt çizgi
   Mattermost'un sunucu tarafı eylem yönlendirmesini bozar (404 döndürür). Kullanmadan önce bunları çıkarın.
5. `context.action_id`, düğmenin `id` değeriyle eşleşmelidir; böylece onay mesajında
   ham kimlik yerine düğme adı görünür (örneğin "Approve").
6. `context.action_id` gereklidir — etkileşim işleyicisi bu olmadan 400 döndürür.

**HMAC token oluşturma:**

Ağ geçidi, düğme tıklamalarını HMAC-SHA256 ile doğrular. Harici betikler, ağ geçidinin doğrulama mantığıyla eşleşen
token'lar üretmelidir:

1. Gizli anahtarı bot token'dan türetin:
   `HMAC-SHA256(key="openclaw-mattermost-interactions", data=botToken)`
2. `_token` hariç tüm alanlarla bağlam nesnesini oluşturun.
3. **Sıralanmış anahtarlar** ve **boşluksuz** olacak şekilde serileştirin (ağ geçidi sıralanmış anahtarlarla `JSON.stringify`
   kullanır; bu da sıkıştırılmış çıktı üretir).
4. İmzalama: `HMAC-SHA256(key=secret, data=serializedContext)`
5. Ortaya çıkan hex özetini bağlam içine `_token` olarak ekleyin.

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

- Python'un `json.dumps` işlevi varsayılan olarak boşluk ekler (`{"key": "val"}`). JavaScript'in sıkıştırılmış çıktısıyla (`{"key":"val"}`) eşleşmesi için
  `separators=(",", ":")` kullanın.
- Her zaman **tüm** bağlam alanlarını (`_token` hariç) imzalayın. Ağ geçidi `_token` alanını çıkarır,
  sonra kalan her şeyi imzalar. Bir alt kümenin imzalanması sessiz doğrulama hatasına yol açar.
- `sort_keys=True` kullanın — ağ geçidi imzalamadan önce anahtarları sıralar ve Mattermost
  payload'u saklarken bağlam alanlarının sırasını değiştirebilir.
- Gizli anahtarı rastgele baytlardan değil, bot token'dan türetin (belirlenimli). Gizli anahtar,
  düğmeleri oluşturan işlemle doğrulayan ağ geçidinde aynı olmalıdır.

## Dizin bağdaştırıcısı

Mattermost eklentisi, kanal ve kullanıcı adlarını
Mattermost API üzerinden çözen bir dizin bağdaştırıcısı içerir. Bu sayede
`openclaw message send` ve cron/webhook teslimatlarında `#channel-name` ve `@username` hedefleri kullanılabilir.

Yapılandırma gerekmez — bağdaştırıcı hesap yapılandırmasındaki bot token'ı kullanır.

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

- Kanallarda yanıt yok: botun kanalda olduğundan emin olun ve onu mention yapın (`oncall`), bir tetikleyici önek kullanın (`onchar`) veya `chatmode: "onmessage"` ayarlayın.
- Kimlik doğrulama hataları: bot token'ı, temel URL'yi ve hesabın etkin olup olmadığını kontrol edin.
- Çoklu hesap sorunları: ortam değişkenleri yalnızca `default` hesabı için geçerlidir.
- Yerel slash komutları `Unauthorized: invalid command token.` döndürüyor: OpenClaw
  geri çağırım token'ını kabul etmedi. Tipik nedenler:
  - slash komutu kaydı başarısız oldu veya başlangıçta yalnızca kısmen tamamlandı
  - geri çağırım yanlış ağ geçidine/hesaba gidiyor
  - Mattermost hâlâ önceki bir geri çağırım hedefine işaret eden eski komutlara sahip
  - ağ geçidi, slash komutlarını yeniden etkinleştirmeden yeniden başlatıldı
- Yerel slash komutları çalışmayı bırakırsa şu günlük girdilerini kontrol edin:
  `mattermost: failed to register slash commands` veya
  `mattermost: native slash commands enabled but no commands could be registered`.
- `callbackUrl` atlanırsa ve günlüklerde geri çağırımın
  `http://127.0.0.1:18789/...` olarak çözümlendiğine dair uyarı varsa, bu URL muhtemelen yalnızca
  Mattermost, OpenClaw ile aynı ana makinede/ağ ad alanında çalıştığında erişilebilirdir. Bunun yerine
  açıkça dışarıdan erişilebilir bir `commands.callbackUrl` ayarlayın.
- Düğmeler beyaz kutular olarak görünüyor: aracı bozuk düğme verileri gönderiyor olabilir. Her düğmede hem `text` hem de `callback_data` alanlarının bulunduğunu kontrol edin.
- Düğmeler görüntüleniyor ama tıklamalar hiçbir şey yapmıyor: Mattermost sunucu yapılandırmasında `AllowedUntrustedInternalConnections` değerinin `127.0.0.1 localhost` içerdiğini ve ServiceSettings içinde `EnablePostActionIntegration` değerinin `true` olduğunu doğrulayın.
- Düğmeler tıklamada 404 döndürüyor: düğme `id` değeri muhtemelen tire veya alt çizgi içeriyor. Mattermost'un eylem yönlendiricisi alfanümerik olmayan kimliklerde bozulur. Yalnızca `[a-zA-Z0-9]` kullanın.
- Ağ geçidi günlüklerinde `invalid _token`: HMAC uyuşmazlığı. Tüm bağlam alanlarını (bir alt küme değil) imzaladığınızı, sıralanmış anahtarlar kullandığınızı ve sıkıştırılmış JSON (boşluksuz) kullandığınızı kontrol edin. Yukarıdaki HMAC bölümüne bakın.
- Ağ geçidi günlüklerinde `missing _token in context`: `_token` alanı düğmenin bağlamında yok. Entegrasyon payload'unu oluştururken bunun dahil edildiğinden emin olun.
- Onayda düğme adı yerine ham kimlik görünüyor: `context.action_id`, düğmenin `id` değeriyle eşleşmiyor. Her ikisini de aynı temizlenmiş değere ayarlayın.
- Aracı düğmelerden haberdar değil: Mattermost kanal yapılandırmasına `capabilities: ["inlineButtons"]` ekleyin.

## İlgili

- [Kanallara Genel Bakış](/tr/channels) — desteklenen tüm kanallar
- [Eşleştirme](/tr/channels/pairing) — DM kimlik doğrulaması ve eşleştirme akışı
- [Gruplar](/tr/channels/groups) — grup sohbeti davranışı ve mention geçitleme
- [Kanal Yönlendirme](/tr/channels/channel-routing) — mesajlar için oturum yönlendirme
- [Güvenlik](/gateway/security) — erişim modeli ve sertleştirme
