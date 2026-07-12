---
read_when:
    - /new, /reset, /stop ve ajan yaşam döngüsü olayları için olay güdümlü otomasyon istiyorsunuz
    - Hook'lar oluşturmak, yüklemek veya hatalarını ayıklamak istiyorsunuz
summary: 'Hook''lar: komutlar ve yaşam döngüsü olayları için olay güdümlü otomasyon'
title: Kancalar
x-i18n:
    generated_at: "2026-07-12T12:01:29Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ba09acf45cc09d4ce84b9dda36af2a720ccefbfaed23a1558dd36358ce56701a
    source_path: automation/hooks.md
    workflow: 16
---

Hook'lar, ajan olayları tetiklendiğinde Gateway içinde çalışan küçük betiklerdir: `/new`, `/reset`, `/stop` gibi komutlar, oturum sıkıştırması, Gateway yaşam döngüsü ve mesaj akışı. Dizinlerden keşfedilir ve `openclaw hooks` ile yönetilirler. Gateway, dahili Hook'ları yalnızca Hook'ları etkinleştirdikten veya en az bir Hook girdisi, Hook paketi, eski işleyici ya da ek Hook dizini yapılandırdıktan sonra yükler.

OpenClaw'da iki tür Hook vardır:

- **Dahili Hook'lar** (bu sayfa): ajan olayları tetiklendiğinde Gateway içinde çalışır.
- **Webhook'lar**: diğer sistemlerin OpenClaw'da iş tetiklemesine olanak tanıyan harici HTTP uç noktalarıdır. Bkz. [Webhook'lar](/tr/automation/cron-jobs#webhooks).

Hook'lar, Plugin'lerin içinde de paketlenebilir. `openclaw hooks list`, hem bağımsız Hook'ları hem de Plugin tarafından yönetilen Hook'ları (`plugin:<id>` olarak gösterilir) listeler.

## Doğru yüzeyi seçme

OpenClaw, birbirine benzeyen ancak farklı sorunları çözen çeşitli genişletme yüzeylerine sahiptir:

| Şunu yapmak istiyorsanız...                                                                                                        | Şunu kullanın...                                      | Nedeni                                                                                                        |
| ---------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `/new` sırasında anlık görüntü kaydetmek, `/reset` olayını günlüğe yazmak, `message:sent` sonrasında harici API çağırmak veya genel operatör otomasyonu eklemek | Dahili Hook'lar (`HOOK.md`, bu sayfa)                 | Dosya tabanlı Hook'lar, operatör tarafından yönetilen yan etkiler ve komut/yaşam döngüsü otomasyonu içindir   |
| İstemleri yeniden yazmak, araçları engellemek, giden mesajları iptal etmek veya sıralı ara katman/politika eklemek                   | `api.on(...)` aracılığıyla tür belirtilmiş Plugin Hook'ları | Tür belirtilmiş Hook'ların açık sözleşmeleri, öncelikleri, birleştirme kuralları ve engelleme/iptal semantiği vardır |
| Yalnızca telemetri dışa aktarımı veya gözlemlenebilirlik eklemek                                                                    | Tanılama olayları                                     | Gözlemlenebilirlik ayrı bir olay veri yoludur; politika Hook yüzeyi değildir                                 |

Küçük ve kurulu bir entegrasyon gibi davranan otomasyon istediğinizde dahili Hook'ları kullanın. Çalışma zamanı yaşam döngüsü denetimine ihtiyaç duyduğunuzda tür belirtilmiş Plugin Hook'larını kullanın.

## Hızlı başlangıç

```bash
# Kullanılabilir Hook'ları listele
openclaw hooks list

# Bir Hook'u etkinleştir
openclaw hooks enable session-memory

# Hook durumunu denetle
openclaw hooks check

# Ayrıntılı bilgi al
openclaw hooks info session-memory
```

## Olay türleri

Hook'lar bu tablodaki belirli bir anahtara veya ilgili ailedeki tüm eylemleri
almak için yalnızca aile adına (`command`, `session`, `agent`, `gateway`,
`message`) abone olur. OpenClaw çekirdeği bunların dışında hiçbir şey yaymaz;
bu nedenle başka herhangi bir ad, neredeyse her zaman Hook'un hiçbir uyarı
vermeden çalışmamasına neden olan bir yazım hatasıdır (yalnızca özel olay
yayan bir Plugin bunu tetikleyebilir). Hook yükleyicisi bu tür adlar için
(örneğin `command:nwe`) uyarı kaydeder ve `openclaw hooks info <name>` bunları
işaretler; böylece hiç çalışmayan bir Hook tanılanabilir.

| Olay                     | Tetiklendiği zaman                                            |
| ------------------------ | ------------------------------------------------------------- |
| `command:new`            | `/new` komutu verildiğinde                                    |
| `command:reset`          | `/reset` komutu verildiğinde                                  |
| `command:stop`           | `/stop` komutu verildiğinde                                   |
| `command`                | Herhangi bir komut olayında (genel dinleyici)                 |
| `session:compact:before` | Compaction geçmişi özetlemeden önce                           |
| `session:compact:after`  | Compaction tamamlandıktan sonra                               |
| `session:patch`          | Oturum özellikleri değiştirildiğinde                          |
| `agent:bootstrap`        | Çalışma alanı önyükleme dosyaları eklenmeden önce             |
| `gateway:startup`        | Kanallar başlatıldıktan ve Hook'lar yüklendikten sonra        |
| `gateway:shutdown`       | Gateway kapatma işlemi başladığında                           |
| `gateway:pre-restart`    | Beklenen bir Gateway yeniden başlatmasından önce              |
| `message:received`       | Herhangi bir kanaldan gelen mesajda                           |
| `message:transcribed`    | Ses dökümü tamamlandıktan sonra                               |
| `message:preprocessed`   | Medya ve bağlantı ön işlemesi tamamlandıktan veya atlandıktan sonra |
| `message:sent`           | Giden gönderim denendiğinde (sonuç `context.success` içindedir) |

## Hook yazma

### Hook yapısı

Her Hook, iki dosya içeren bir dizindir:

```text
my-hook/
├── HOOK.md          # Meta veriler + belgeler
└── handler.ts       # İşleyici uygulaması
```

İşleyici dosyası `handler.ts`, `handler.js`, `index.ts` veya `index.js` olabilir.

### HOOK.md biçimi

```markdown
---
name: my-hook
description: "Bu Hook'un ne yaptığının kısa açıklaması"
metadata:
  { "openclaw": { "emoji": "🔗", "events": ["command:new"], "requires": { "bins": ["node"] } } }
---

# Hook'um

Ayrıntılı belgeler buraya gelir.
```

**Meta veri alanları** (`metadata.openclaw`):

| Alan       | Açıklama                                                   |
| ---------- | ---------------------------------------------------------- |
| `emoji`    | CLI için görüntüleme emojisi                               |
| `events`   | Dinlenecek olay dizisi                                     |
| `export`   | Kullanılacak adlandırılmış dışa aktarım (varsayılan: `"default"`) |
| `os`       | Gerekli platformlar (ör. `["darwin", "linux"]`)            |
| `requires` | Gerekli `bins`, `anyBins`, `env` veya `config` yolları     |
| `always`   | Uygunluk denetimlerini atla (boole)                        |
| `hookKey`  | Yapılandırma anahtarı geçersiz kılma değeri (varsayılan: Hook adı) |
| `homepage` | `openclaw hooks info` tarafından gösterilen belge URL'si   |
| `install`  | Kurulum yöntemleri                                         |

### İşleyici uygulaması

```typescript
const handler = async (event) => {
  if (event.type !== "command" || event.action !== "new") {
    return;
  }

  console.log(`[my-hook] New command triggered`);
  // Your logic here

  // Optionally send a reply on replyable surfaces
  event.messages.push("Hook executed!");
};

export default handler;
```

Her olay şunları içerir: `type`, `action`, `sessionKey`, `timestamp`, `messages` ve `context` (olaya özgü veriler). Ajan ve araç Hook'ları için tür belirtilmiş Plugin Hook bağlamları, Plugin'lerin OTEL bağıntısı amacıyla yapılandırılmış günlüklere aktarabileceği, salt okunur ve W3C uyumlu bir tanılama izleme bağlamı olan `trace` alanını da içerebilir.

`event.messages` öğesine eklenen dizeler yalnızca `command:new` ve
`command:reset` için (kaynak konuşmaya yanıt olarak yönlendirilir) ve
`session:compact:before` / `session:compact:after` için (Compaction durum
bildirimleri olarak gönderilir) sohbete geri iletilir. `command:stop`,
`message:*`, `agent:bootstrap`, `session:patch` ve `gateway:*` dahil olmak
üzere diğer tüm olaylar eklenen mesajları yok sayar.

### Olay bağlamının öne çıkanları

**Komut olayları** (`command:new`, `command:reset`): `context.sessionEntry`, `context.previousSessionEntry`, `context.commandSource`, `context.senderId`, `context.workspaceDir`, `context.cfg`.

**Komut olayları** (`command:stop`): `context.sessionEntry`, `context.sessionId`, `context.commandSource`, `context.senderId`.

**Mesaj olayları** (`message:received`): `context.from`, `context.content`, `context.channelId`, `context.metadata` (`senderId`, `senderName`, `guildId` dahil sağlayıcıya özgü veriler). `context.content`, komut benzeri mesajlarda öncelikle boş olmayan komut gövdesini kullanır; ardından ham gelen gövdeye ve genel gövdeye geri döner. İş parçacığı geçmişi veya bağlantı özetleri gibi yalnızca ajana yönelik zenginleştirmeleri içermez.

**Mesaj olayları** (`message:sent`): `context.to`, `context.content`, `context.success`, `context.channelId` ve gönderim başarısız olduğunda ayrıca `context.error`.

**Mesaj olayları** (`message:transcribed`): `context.transcript`, `context.from`, `context.channelId`, `context.mediaPath`.

**Mesaj olayları** (`message:preprocessed`): `context.bodyForAgent` (son zenginleştirilmiş gövde), `context.from`, `context.channelId`.

**Önyükleme olayları** (`agent:bootstrap`): `context.bootstrapFiles` (değiştirilebilir dizi), `context.agentId`.

**Oturum yama olayları** (`session:patch`): `context.sessionEntry`, `context.patch` (yalnızca değiştirilen alanlar), `context.cfg`. Yama olaylarını yalnızca ayrıcalıklı istemciler tetikleyebilir; bağlam bir kopyadır, bu nedenle işleyiciler canlı oturum girdisini değiştiremez.

**Compaction olayları**: `session:compact:before`, `messageCount` ve `tokenCount` alanlarını içerir. `session:compact:after`, bunlara `compactedCount`, `summaryLength`, `tokensBefore` ve `tokensAfter` alanlarını ekler.

`command:stop`, kullanıcının `/stop` komutunu vermesini gözlemler; bu bir
iptal/komut yaşam döngüsü olayıdır, ajan sonlandırma geçidi değildir. Doğal
bir nihai yanıtı inceleyip ajandan bir geçiş daha yapmasını istemesi gereken
Plugin'ler bunun yerine tür belirtilmiş `before_agent_finalize` Plugin
Hook'unu kullanmalıdır. Bkz. [Plugin Hook'ları](/tr/plugins/hooks).

**Gateway yaşam döngüsü olayları**: `gateway:shutdown`, `reason` ve `restartExpectedMs` alanlarını içerir ve Gateway kapatma işlemi başladığında tetiklenir. `gateway:pre-restart` aynı bağlamı içerir ancak yalnızca kapatma işlemi beklenen bir yeniden başlatmanın parçası olduğunda ve sonlu bir `restartExpectedMs` değeri sağlandığında tetiklenir. Kapatma sırasında, bir işleyici takılırsa kapatma işleminin devam edebilmesi için her yaşam döngüsü Hook beklemesi en iyi çaba esaslı ve sınırlıdır. Varsayılan bekleme bütçesi `gateway:shutdown` için 5 saniye, `gateway:pre-restart` için 10 saniyedir.

Kanallar hâlâ kullanılabilirken kısa yeniden başlatma bildirimleri göndermek için `gateway:pre-restart` kullanın:

```typescript
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export default async function handler(event) {
  if (event.type !== "gateway" || event.action !== "pre-restart") {
    return;
  }

  const restartInSeconds = Math.ceil(event.context.restartExpectedMs / 1000);
  await execFileAsync("openclaw", [
    "system",
    "event",
    "--mode",
    "now",
    "--text",
    `Gateway restarting in ~${restartInSeconds}s (${event.context.reason}). Checkpoint now.`,
  ]);
}
```

`gateway:shutdown` (veya `gateway:pre-restart`) olayı ile kapatma dizisinin geri kalanı arasında Gateway, süreç durduğunda hâlâ etkin olan her oturum için tür belirtilmiş bir `session_end` Plugin Hook'u da tetikler. Olayın `reason` değeri, normal bir SIGTERM/SIGINT durdurması için `shutdown`, kapatma işlemi beklenen bir yeniden başlatmanın parçası olarak zamanlandıysa `restart` olur. Bu boşaltma işlemi sınırlıdır; böylece yavaş bir `session_end` işleyicisi sürecin çıkışını engelleyemez. Çift tetiklemeyi önlemek için değiştirme / sıfırlama / silme / Compaction yoluyla zaten sonlandırılmış oturumlar atlanır.

## Hook keşfi

Hook'lar dört kaynaktan keşfedilir:

1. **Paketlenmiş Hook'lar**: OpenClaw ile birlikte sunulur
2. **Plugin Hook'ları**: kurulu Plugin'lerin içinde paketlenir; aynı ada sahip paketlenmiş Hook'ları geçersiz kılabilir
3. **Yönetilen Hook'lar**: `~/.openclaw/hooks/` (kullanıcı tarafından kurulur, çalışma alanları arasında paylaşılır); paketlenmiş ve Plugin Hook'larını geçersiz kılabilir. `hooks.internal.load.extraDirs` içindeki ek dizinler de bu önceliği paylaşır.
4. **Çalışma alanı Hook'ları**: `<workspace>/hooks/` (ajan başına, açıkça etkinleştirilene kadar varsayılan olarak devre dışıdır)

Çalışma alanı Hook'ları yeni Hook adları ekleyebilir ancak aynı ada sahip paketlenmiş, yönetilen veya Plugin tarafından sağlanan Hook'ları geçersiz kılamaz.

Gateway, dahili Hook'lar yapılandırılana kadar başlangıç sırasında dahili Hook keşfini atlar. Katılmak için `openclaw hooks enable <name>` ile paketlenmiş veya yönetilen bir Hook'u etkinleştirin, bir Hook paketi kurun ya da `hooks.internal.enabled=true` değerini ayarlayın. Adlandırılmış bir Hook'u etkinleştirdiğinizde Gateway yalnızca o Hook'un işleyicisini yükler; `hooks.internal.enabled=true`, ek Hook dizinleri ve eski işleyiciler geniş kapsamlı keşfi etkinleştirir.

### Hook paketleri

Hook paketleri, `package.json` içindeki `openclaw.hooks` aracılığıyla Hook'ları dışa aktaran npm paketleridir. Şununla kurun:

```bash
openclaw plugins install <path-or-spec>
```

Npm belirtimleri yalnızca kayıt defteriyle sınırlıdır (paket adı + isteğe bağlı tam sürüm veya dist-tag). Git/URL/dosya belirtimleri ve semver aralıkları reddedilir. Eski `openclaw hooks install` ve `openclaw hooks update` komutları, `openclaw plugins install` / `openclaw plugins update` için kullanımdan kaldırılmış takma adlardır.

## Paketle gelen hook'lar

| Hook                  | Olaylar                                            | İşlevi                                                                  |
| --------------------- | ------------------------------------------------- | ----------------------------------------------------------------------- |
| session-memory        | `command:new`, `command:reset`                    | Oturum bağlamını `<workspace>/memory/` konumuna kaydeder                 |
| bootstrap-extra-files | `agent:bootstrap`                                 | Glob kalıplarından ek önyükleme dosyaları ekler                          |
| command-logger        | `command`                                         | Tüm komutları `~/.openclaw/logs/commands.log` dosyasına kaydeder         |
| compaction-notifier   | `session:compact:before`, `session:compact:after` | Oturum Compaction işlemi başladığında/sona erdiğinde görünür sohbet bildirimleri gönderir |
| boot-md               | `gateway:startup`                                 | Gateway başladığında `BOOT.md` dosyasını çalıştırır                      |

Paketle gelen herhangi bir hook'u etkinleştirin:

```bash
openclaw hooks enable <hook-name>
```

<a id="session-memory"></a>

### session-memory ayrıntıları

Son kullanıcı/asistan mesajlarını çıkarır (varsayılan 15; `hooks.internal.entries.session-memory.messages` ile yapılandırılabilir) ve ana makinenin yerel tarihini kullanarak `<workspace>/memory/YYYY-MM-DD-HHMM.md` konumuna kaydeder. Bellek yakalama arka planda çalışır; böylece `/new` ve `/reset` onayları, döküm okumaları veya isteğe bağlı kısa ad oluşturma nedeniyle gecikmez. Açıklayıcı dosya adı kısa adları oluşturmak için `hooks.internal.entries.session-memory.llmSlug: true` ayarını yapın ve isteğe bağlı olarak `hooks.internal.entries.session-memory.model` değerini `sonnet` gibi yapılandırılmış bir takma ada, ajanın varsayılan sağlayıcısındaki yalın bir model kimliğine veya bir `provider/model` başvurusuna ayarlayın. Kısa ad oluşturma, `model` belirtilmediğinde ajanın varsayılan modelini kullanır ve bu model kullanılamıyorsa zaman damgalı kısa adlara geri döner. `workspace.dir` yapılandırılmış olmalıdır.

<a id="bootstrap-extra-files"></a>

### bootstrap-extra-files yapılandırması

```json
{
  "hooks": {
    "internal": {
      "entries": {
        "bootstrap-extra-files": {
          "enabled": true,
          "paths": ["packages/*/AGENTS.md", "packages/*/TOOLS.md"]
        }
      }
    }
  }
}
```

`patterns` ve `files`, `paths` için takma ad olarak kabul edilir. Yollar çalışma alanına göre çözümlenir ve çalışma alanının içinde kalmalıdır. Yalnızca tanınan önyükleme temel dosya adları yüklenir (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`, `MEMORY.md`).

<a id="command-logger"></a>

### command-logger ayrıntıları

Her eğik çizgi komutunu bir JSON satırı (zaman damgası, eylem, oturum anahtarı, gönderen kimliği, kaynak) olarak `~/.openclaw/logs/commands.log` dosyasına kaydeder.

<a id="compaction-notifier"></a>

### compaction-notifier ayrıntıları

OpenClaw oturum dökümünü sıkıştırmaya başladığında ve sıkıştırmayı tamamladığında mevcut konuşmaya kısa durum mesajları gönderir. Böylece kullanıcı, asistanın bağlamı özetlediğini ve Compaction sonrasında devam edeceğini görebildiğinden, sohbet yüzeylerindeki uzun turlar daha az kafa karıştırıcı olur.

<a id="boot-md"></a>

### boot-md ayrıntıları

Dosya ajanın çözümlenmiş çalışma alanında mevcutsa, yapılandırılmış her ajan kapsamı için Gateway başlangıcında `BOOT.md` dosyasını çalıştırır.

## Plugin hook'ları

Plugin'ler daha derin entegrasyon için Plugin SDK aracılığıyla tür belirtilmiş hook'lar kaydedebilir:
araç çağrılarını engelleme, istemleri değiştirme, mesaj akışını denetleme ve daha fazlası.
`before_tool_call`, `before_agent_reply`, `before_install` veya diğer işlem içi yaşam döngüsü hook'larına ihtiyaç duyduğunuzda Plugin hook'larını kullanın.

Plugin tarafından yönetilen dahili hook'lar farklıdır: Bu sayfadaki genel komut/yaşam döngüsü olay sistemine katılır ve `openclaw hooks list` içinde `plugin:<id>` olarak görünür. Bunları sıralı ara yazılım veya ilke geçitleri için değil, yan etkiler ve hook paketleriyle uyumluluk için kullanın.

Eksiksiz Plugin hook'u başvurusu için [Plugin hook'ları](/tr/plugins/hooks) bölümüne bakın.

## Yapılandırma

```json
{
  "hooks": {
    "internal": {
      "enabled": true,
      "entries": {
        "session-memory": { "enabled": true },
        "command-logger": { "enabled": false }
      }
    }
  }
}
```

Hook başına ortam değerleri, bir hook'un `requires.env` uygunluk denetimlerini (işlem ortamıyla birlikte) karşılar ve işleyiciler bunları kendi hook yapılandırma girdilerinden okuyabilir:

```json
{
  "hooks": {
    "internal": {
      "entries": {
        "my-hook": {
          "enabled": true,
          "env": { "MY_CUSTOM_VAR": "value" }
        }
      }
    }
  }
}
```

Ek hook dizinleri:

```json
{
  "hooks": {
    "internal": {
      "load": {
        "extraDirs": ["/path/to/more/hooks"]
      }
    }
  }
}
```

<Note>
Eski `hooks.internal.handlers` dizi yapılandırma biçimi geriye dönük uyumluluk için hâlâ desteklenmektedir, ancak yeni hook'lar keşfe dayalı sistemi kullanmalıdır.
</Note>

## CLI başvurusu

```bash
# Tüm hook'ları listele (--eligible, --verbose veya --json ekleyin)
openclaw hooks list

# Bir hook hakkında ayrıntılı bilgi göster
openclaw hooks info <hook-name>

# Uygunluk özetini göster
openclaw hooks check

# Etkinleştir/devre dışı bırak
openclaw hooks enable <hook-name>
openclaw hooks disable <hook-name>
```

## En iyi uygulamalar

- **İşleyicileri hızlı tutun.** Hook'lar komut işleme sırasında çalışır. Ağır işleri `void processInBackground(event)` ile başlatıp sonucunu beklemeden devam edin.
- **Hataları kontrollü biçimde yönetin.** Riskli işlemleri try/catch içine alın; diğer işleyicilerin çalışabilmesi için hata fırlatmayın.
- **Olayları erkenden filtreleyin.** Olay türü/eylemi ilgili değilse hemen dönün.
- **Belirli olay anahtarları kullanın.** Ek yükü azaltmak için `"events": ["command"]` yerine `"events": ["command:new"]` tercih edin.

## Sorun giderme

### Hook keşfedilmiyor

```bash
# Dizin yapısını doğrula
ls -la ~/.openclaw/hooks/my-hook/
# Şunları göstermelidir: HOOK.md, handler.ts

# Keşfedilen tüm hook'ları listele
openclaw hooks list
```

### Hook uygun değil

```bash
openclaw hooks info my-hook
```

Eksik ikili dosyaları (PATH), ortam değişkenlerini, yapılandırma değerlerini veya işletim sistemi uyumluluğunu kontrol edin.

### Hook çalışmıyor

1. Hook'un etkinleştirildiğini doğrulayın: `openclaw hooks list`
2. Hook'ların yeniden yüklenmesi için Gateway işleminizi yeniden başlatın.
3. Gateway günlüklerini kontrol edin: `openclaw logs --follow | grep -i hook`

## İlgili

- [CLI Başvurusu: hook'lar](/tr/cli/hooks)
- [Webhook'lar](/tr/automation/cron-jobs#webhooks)
- [Plugin hook'ları](/tr/plugins/hooks) — işlem içi Plugin yaşam döngüsü hook'ları
- [Yapılandırma](/tr/gateway/configuration-reference#hooks)
