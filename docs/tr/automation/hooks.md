---
read_when:
    - /new, /reset, /stop ve ajan yaşam döngüsü olayları için olay odaklı otomasyon istiyorsunuz
    - Kancaları oluşturmak, yüklemek veya hata ayıklamak istiyorsunuz
summary: 'Hooks: komutlar ve yaşam döngüsü olayları için olay odaklı otomasyon'
title: Kancalar
x-i18n:
    generated_at: "2026-06-28T00:10:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0259739b0547ba4826b540d392c6d6b72c6bec24fd50d5e297817694fd728438
    source_path: automation/hooks.md
    workflow: 16
---

Hook'lar, Gateway içinde bir şey olduğunda çalışan küçük betiklerdir. Dizinlerden keşfedilebilir ve `openclaw hooks` ile incelenebilirler. Gateway, dahili hook'ları yalnızca hook'ları etkinleştirdikten veya en az bir hook girdisi, hook paketi, eski işleyici ya da ek hook dizini yapılandırdıktan sonra yükler.

OpenClaw içinde iki tür hook vardır:

- **Dahili hook'lar** (bu sayfa): `/new`, `/reset`, `/stop` gibi ajan olayları veya yaşam döngüsü olayları tetiklendiğinde Gateway içinde çalışır.
- **Webhook'lar**: diğer sistemlerin OpenClaw içinde iş tetiklemesini sağlayan harici HTTP uç noktalarıdır. Bkz. [Webhook'lar](/tr/automation/cron-jobs#webhooks).

Hook'lar Plugin'lerin içine de paketlenebilir. `openclaw hooks list` hem bağımsız hook'ları hem de Plugin tarafından yönetilen hook'ları gösterir.

## Doğru yüzeyi seçin

OpenClaw, benzer görünen ancak farklı sorunları çözen birkaç genişletme yüzeyine sahiptir:

| Şunu yapmak istiyorsanız...                                                                                              | Şunu kullanın...                         | Neden                                                                                                   |
| ------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `/new` sırasında anlık görüntü kaydetmek, `/reset` kaydetmek, `message:sent` sonrasında harici API çağırmak veya kaba operatör otomasyonu eklemek | Dahili hook'lar (`HOOK.md`, bu sayfa)    | Dosya tabanlı hook'lar, operatör tarafından yönetilen yan etkiler ve komut/yaşam döngüsü otomasyonu içindir |
| İstemleri yeniden yazmak, araçları engellemek, giden mesajları iptal etmek veya sıralı ara katman/politika eklemek       | `api.on(...)` üzerinden tipli Plugin hook'ları | Tipli hook'ların açık sözleşmeleri, öncelikleri, birleştirme kuralları ve engelleme/iptal semantiği vardır |
| Yalnızca telemetri dışa aktarımı veya gözlemlenebilirlik eklemek                                                         | Tanılama olayları                        | Gözlemlenebilirlik ayrı bir olay veri yoludur, politika hook yüzeyi değildir                            |

Küçük bir kurulu entegrasyon gibi davranan otomasyon istediğinizde dahili hook'ları kullanın. Çalışma zamanı yaşam döngüsü denetimine ihtiyacınız olduğunda tipli Plugin hook'larını kullanın.

## Hızlı başlangıç

```bash
# List available hooks
openclaw hooks list

# Enable a hook
openclaw hooks enable session-memory

# Check hook status
openclaw hooks check

# Get detailed information
openclaw hooks info session-memory
```

## Olay türleri

| Olay                     | Ne zaman tetiklenir                                       |
| ------------------------ | ---------------------------------------------------------- |
| `command:new`            | `/new` komutu verildiğinde                                |
| `command:reset`          | `/reset` komutu verildiğinde                              |
| `command:stop`           | `/stop` komutu verildiğinde                               |
| `command`                | Herhangi bir komut olayı (genel dinleyici)                |
| `session:compact:before` | Compaction geçmişi özetlemeden önce                       |
| `session:compact:after`  | Compaction tamamlandıktan sonra                           |
| `session:patch`          | Oturum özellikleri değiştirildiğinde                      |
| `agent:bootstrap`        | Çalışma alanı başlangıç dosyaları enjekte edilmeden önce   |
| `gateway:startup`        | Kanallar başladıktan ve hook'lar yüklendikten sonra        |
| `gateway:shutdown`       | Gateway kapatma işlemi başladığında                       |
| `gateway:pre-restart`    | Beklenen bir Gateway yeniden başlatmasından önce           |
| `message:received`       | Herhangi bir kanaldan gelen mesaj                         |
| `message:transcribed`    | Ses yazıya dökümü tamamlandıktan sonra                    |
| `message:preprocessed`   | Medya ve bağlantı ön işleme tamamlandıktan veya atlandıktan sonra |
| `message:sent`           | Giden mesaj teslim edildiğinde                            |

## Hook yazma

### Hook yapısı

Her hook, iki dosya içeren bir dizindir:

```
my-hook/
├── HOOK.md          # Metadata + documentation
└── handler.ts       # Handler implementation
```

### HOOK.md biçimi

```markdown
---
name: my-hook
description: "Short description of what this hook does"
metadata:
  { "openclaw": { "emoji": "🔗", "events": ["command:new"], "requires": { "bins": ["node"] } } }
---

# My Hook

Detailed documentation goes here.
```

**Meta veri alanları** (`metadata.openclaw`):

| Alan       | Açıklama                                             |
| ---------- | ---------------------------------------------------- |
| `emoji`    | CLI için görüntü emojisi                             |
| `events`   | Dinlenecek olaylar dizisi                            |
| `export`   | Kullanılacak adlandırılmış dışa aktarım (varsayılan `"default"`) |
| `os`       | Gerekli platformlar (örn. `["darwin", "linux"]`)     |
| `requires` | Gerekli `bins`, `anyBins`, `env` veya `config` yolları |
| `always`   | Uygunluk denetimlerini atla (boolean)                |
| `install`  | Kurulum yöntemleri                                   |

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

Her olay şunları içerir: `type`, `action`, `sessionKey`, `timestamp`, `messages` (yanıt verilebilir yüzeylerde yanıtları buraya itin) ve `context` (olaya özgü veri). Ajan ve araç Plugin hook bağlamları ayrıca, Plugin'lerin OTEL korelasyonu için yapılandırılmış günlüklere geçirebileceği salt okunur W3C uyumlu tanılama iz bağlamı olan `trace` içerebilir.

`event.messages` yalnızca `command:*` ve `message:received` gibi yanıt verilebilir yüzeylerde otomatik olarak teslim edilir. `agent:bootstrap`, `session:*`, `gateway:*` veya `message:sent` gibi yalnızca yaşam döngüsü olaylarının yanıt kanalı yoktur ve itilen mesajları yok sayar.

### Olay bağlamı öne çıkanları

**Komut olayları** (`command:new`, `command:reset`): `context.sessionEntry`, `context.previousSessionEntry`, `context.commandSource`, `context.workspaceDir`, `context.cfg`.

**Mesaj olayları** (`message:received`): `context.from`, `context.content`, `context.channelId`, `context.metadata` (`senderId`, `senderName`, `guildId` dahil sağlayıcıya özgü veriler). `context.content`, komut benzeri mesajlar için önce boş olmayan bir komut gövdesini tercih eder, ardından ham gelen gövdeye ve genel gövdeye geri döner; ileti geçmişi veya bağlantı özetleri gibi yalnızca ajana özgü zenginleştirmeleri içermez.

**Mesaj olayları** (`message:sent`): `context.to`, `context.content`, `context.success`, `context.channelId`.

**Mesaj olayları** (`message:transcribed`): `context.transcript`, `context.from`, `context.channelId`, `context.mediaPath`.

**Mesaj olayları** (`message:preprocessed`): `context.bodyForAgent` (son zenginleştirilmiş gövde), `context.from`, `context.channelId`.

**Bootstrap olayları** (`agent:bootstrap`): `context.bootstrapFiles` (değiştirilebilir dizi), `context.agentId`.

**Oturum yaması olayları** (`session:patch`): `context.sessionEntry`, `context.patch` (yalnızca değişen alanlar), `context.cfg`. Yama olaylarını yalnızca ayrıcalıklı istemciler tetikleyebilir.

**Compaction olayları**: `session:compact:before`, `messageCount`, `tokenCount` içerir. `session:compact:after`, `compactedCount`, `summaryLength`, `tokensBefore`, `tokensAfter` ekler.

`command:stop`, kullanıcının `/stop` vermesini gözlemler; bu, iptal/komut yaşam döngüsüdür, ajan sonlandırma kapısı değildir. Doğal bir son yanıtı incelemesi ve ajandan bir tur daha istemesi gereken Plugin'ler bunun yerine tipli Plugin hook'u `before_agent_finalize` kullanmalıdır. Bkz. [Plugin hook'ları](/tr/plugins/hooks).

**Gateway yaşam döngüsü olayları**: `gateway:shutdown`, `reason` ve `restartExpectedMs` içerir ve Gateway kapatma işlemi başladığında tetiklenir. `gateway:pre-restart` aynı bağlamı içerir ancak yalnızca kapatma beklenen bir yeniden başlatmanın parçası olduğunda ve sonlu bir `restartExpectedMs` değeri sağlandığında tetiklenir. Kapatma sırasında her yaşam döngüsü hook beklemesi en iyi çabadır ve sınırlıdır; böylece bir işleyici takılırsa kapatma devam eder. Varsayılan bekleme bütçesi `gateway:shutdown` için 5 saniye, `gateway:pre-restart` için 10 saniyedir.

Kanallar hâlâ kullanılabilirken kısa yeniden başlatma bildirimleri için `gateway:pre-restart` kullanın:

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

`gateway:shutdown` (veya `gateway:pre-restart`) olayı ile kapatma dizisinin geri kalanı arasında Gateway, süreç durduğunda hâlâ etkin olan her oturum için tipli bir `session_end` Plugin hook'u da tetikler. Olayın `reason` değeri düz bir SIGTERM/SIGINT durdurması için `shutdown`, kapatma beklenen bir yeniden başlatmanın parçası olarak zamanlandığında `restart` olur. Bu boşaltma sınırlıdır; bu nedenle yavaş bir `session_end` işleyicisi süreç çıkışını engelleyemez ve değiştirme / sıfırlama / silme / Compaction yoluyla zaten sonlandırılmış oturumlar çift tetiklemeyi önlemek için atlanır.

## Hook keşfi

Hook'lar, artan geçersiz kılma önceliği sırasıyla şu dizinlerden keşfedilir:

1. **Paketle gelen hook'lar**: OpenClaw ile gönderilir
2. **Plugin hook'ları**: kurulu Plugin'lerin içine paketlenmiş hook'lar
3. **Yönetilen hook'lar**: `~/.openclaw/hooks/` (kullanıcı tarafından kurulur, çalışma alanları arasında paylaşılır). `hooks.internal.load.extraDirs` içindeki ek dizinler bu önceliği paylaşır.
4. **Çalışma alanı hook'ları**: `<workspace>/hooks/` (ajan başına, açıkça etkinleştirilene kadar varsayılan olarak devre dışı)

Çalışma alanı hook'ları yeni hook adları ekleyebilir ancak aynı ada sahip paketle gelen, yönetilen veya Plugin tarafından sağlanan hook'ları geçersiz kılamaz.

Gateway, dahili hook'lar yapılandırılana kadar başlangıçta dahili hook keşfini atlar. Dahili veya yönetilen bir hook'u `openclaw hooks enable <name>` ile etkinleştirin, bir hook paketi kurun veya katılmak için `hooks.internal.enabled=true` ayarlayın. Bir adlandırılmış hook'u etkinleştirdiğinizde Gateway yalnızca o hook'un işleyicisini yükler; `hooks.internal.enabled=true`, ek hook dizinleri ve eski işleyiciler geniş keşfe katılır.

### Hook paketleri

Hook paketleri, `package.json` içinde `openclaw.hooks` üzerinden hook dışa aktaran npm paketleridir. Şununla kurun:

```bash
openclaw plugins install <path-or-spec>
```

Npm belirtimleri yalnızca kayıt defteriyle sınırlıdır (paket adı + isteğe bağlı tam sürüm veya dist-tag). Git/URL/dosya belirtimleri ve semver aralıkları reddedilir.

## Paketle gelen hook'lar

| Kanca                 | Olaylar                                           | Ne yapar                                                       |
| --------------------- | ------------------------------------------------- | -------------------------------------------------------------- |
| session-memory        | `command:new`, `command:reset`                    | Oturum bağlamını `<workspace>/memory/` içine kaydeder          |
| bootstrap-extra-files | `agent:bootstrap`                                 | Glob desenlerinden ek bootstrap dosyaları enjekte eder         |
| command-logger        | `command`                                         | Tüm komutları `~/.openclaw/logs/commands.log` içine kaydeder   |
| compaction-notifier   | `session:compact:before`, `session:compact:after` | Oturum Compaction başladığında/bittiğinde görünür sohbet bildirimleri gönderir |
| boot-md               | `gateway:startup`                                 | Gateway başladığında `BOOT.md` çalıştırır                     |

Herhangi bir paketli kancayı etkinleştirin:

```bash
openclaw hooks enable <hook-name>
```

<a id="session-memory"></a>

### session-memory ayrıntıları

Son 15 kullanıcı/asistan mesajını çıkarır ve ana makinenin yerel tarihini kullanarak `<workspace>/memory/YYYY-MM-DD-HHMM.md` dosyasına kaydeder. Bellek yakalama arka planda çalışır, böylece `/new` ve `/reset` onayları transkript okumaları veya isteğe bağlı slug üretimi nedeniyle gecikmez. Yapılandırılmış modelle açıklayıcı dosya adı slug'ları oluşturmak için `hooks.internal.entries.session-memory.llmSlug: true` ayarlayın. `workspace.dir` yapılandırılmış olmalıdır.

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

Yollar çalışma alanına göre çözümlenir. Yalnızca tanınan bootstrap temel adları yüklenir (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`, `MEMORY.md`).

<a id="command-logger"></a>

### command-logger ayrıntıları

Her slash komutunu `~/.openclaw/logs/commands.log` içine kaydeder.

<a id="compaction-notifier"></a>

### compaction-notifier ayrıntıları

OpenClaw oturum transkriptini Compaction işlemine başlattığında ve bitirdiğinde mevcut konuşmaya kısa durum mesajları gönderir. Bu, sohbet yüzeylerinde uzun dönüşleri daha az kafa karıştırıcı hale getirir; çünkü kullanıcı asistanın bağlamı özetlediğini ve Compaction sonrasında devam edeceğini görebilir.

<a id="boot-md"></a>

### boot-md ayrıntıları

Gateway başladığında etkin çalışma alanından `BOOT.md` çalıştırır.

## Plugin kancaları

Plugin'ler, daha derin entegrasyon için Plugin SDK üzerinden türlenmiş kancalar kaydedebilir:
araç çağrılarını yakalama, istemleri değiştirme, mesaj akışını denetleme ve daha fazlası.
`before_tool_call`, `before_agent_reply`, `before_install` veya diğer süreç içi yaşam döngüsü kancalarına ihtiyaç duyduğunuzda Plugin kancalarını kullanın.

Plugin tarafından yönetilen dahili kancalar farklıdır: bu sayfanın kaba komut/yaşam döngüsü olay sistemine katılırlar ve `openclaw hooks list` içinde `plugin:<id>` olarak görünürler. Bunları sıralı middleware veya ilke kapıları için değil, yan etkiler ve kanca paketleriyle uyumluluk için kullanın.

Eksiksiz Plugin kancası başvurusu için [Plugin kancaları](/tr/plugins/hooks) bölümüne bakın.

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

Kanca başına ortam değişkenleri:

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

Ek kanca dizinleri:

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
Eski `hooks.internal.handlers` dizi yapılandırma biçimi geriye dönük uyumluluk için hâlâ desteklenir, ancak yeni kancalar keşif tabanlı sistemi kullanmalıdır.
</Note>

## CLI başvurusu

```bash
# List all hooks (add --eligible, --verbose, or --json)
openclaw hooks list

# Show detailed info about a hook
openclaw hooks info <hook-name>

# Show eligibility summary
openclaw hooks check

# Enable/disable
openclaw hooks enable <hook-name>
openclaw hooks disable <hook-name>
```

## En iyi uygulamalar

- **İşleyicileri hızlı tutun.** Kancalar komut işleme sırasında çalışır. Ağır işleri `void processInBackground(event)` ile başlatıp sonucu beklemeden sürdürün.
- **Hataları zarifçe ele alın.** Riskli işlemleri try/catch ile sarın; diğer işleyicilerin çalışabilmesi için hata fırlatmayın.
- **Olayları erken filtreleyin.** Olay türü/eylemi ilgili değilse hemen dönün.
- **Belirli olay anahtarları kullanın.** Ek yükü azaltmak için `"events": ["command"]` yerine `"events": ["command:new"]` tercih edin.

## Sorun giderme

### Kanca keşfedilmedi

```bash
# Verify directory structure
ls -la ~/.openclaw/hooks/my-hook/
# Should show: HOOK.md, handler.ts

# List all discovered hooks
openclaw hooks list
```

### Kanca uygun değil

```bash
openclaw hooks info my-hook
```

Eksik ikili dosyaları (PATH), ortam değişkenlerini, yapılandırma değerlerini veya işletim sistemi uyumluluğunu denetleyin.

### Kanca çalışmıyor

1. Kancanın etkin olduğunu doğrulayın: `openclaw hooks list`
2. Kancaların yeniden yüklenmesi için Gateway sürecinizi yeniden başlatın.
3. Gateway günlüklerini denetleyin: `./scripts/clawlog.sh | grep hook`

## İlgili

- [CLI Başvurusu: hooks](/tr/cli/hooks)
- [Webhook'lar](/tr/automation/cron-jobs#webhooks)
- [Plugin kancaları](/tr/plugins/hooks) — süreç içi Plugin yaşam döngüsü kancaları
- [Yapılandırma](/tr/gateway/configuration-reference#hooks)
