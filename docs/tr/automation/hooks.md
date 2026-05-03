---
read_when:
    - /new, /reset, /stop ve ajan yaşam döngüsü olayları için olay odaklı otomasyon istiyorsunuz
    - Hook'ları derlemek, yüklemek veya hata ayıklamak istiyorsunuz
summary: 'Kancalar: komutlar ve yaşam döngüsü olayları için olay odaklı otomasyon'
title: Kancalar
x-i18n:
    generated_at: "2026-05-03T21:27:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 15f0d120ccf7314a991da5d66e65e5c78375222a846ba01d7a04ddfe1f02cb32
    source_path: automation/hooks.md
    workflow: 16
---

Kancalar, Gateway içinde bir şey gerçekleştiğinde çalışan küçük betiklerdir. Dizinlerden keşfedilebilir ve `openclaw hooks` ile incelenebilirler. Gateway, dahili kancaları yalnızca kancaları etkinleştirdikten veya en az bir kanca girişi, kanca paketi, eski işleyici ya da ek kanca dizini yapılandırdıktan sonra yükler.

OpenClaw'da iki tür kanca vardır:

- **Dahili kancalar** (bu sayfa): `/new`, `/reset`, `/stop` gibi ajan olayları veya yaşam döngüsü olayları tetiklendiğinde Gateway içinde çalışır.
- **Webhook'lar**: diğer sistemlerin OpenClaw'da iş tetiklemesini sağlayan harici HTTP uç noktalarıdır. Bkz. [Webhook'lar](/tr/automation/cron-jobs#webhooks).

Kancalar Plugin'lerin içinde de paketlenebilir. `openclaw hooks list`, hem bağımsız kancaları hem de Plugin tarafından yönetilen kancaları gösterir.

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

| Olay                     | Ne zaman tetiklenir                                             |
| ------------------------ | --------------------------------------------------------------- |
| `command:new`            | `/new` komutu verildiğinde                                      |
| `command:reset`          | `/reset` komutu verildiğinde                                    |
| `command:stop`           | `/stop` komutu verildiğinde                                     |
| `command`                | Herhangi bir komut olayı (genel dinleyici)                      |
| `session:compact:before` | Compaction geçmişi özetlemeden önce                             |
| `session:compact:after`  | Compaction tamamlandıktan sonra                                 |
| `session:patch`          | Oturum özellikleri değiştirildiğinde                            |
| `agent:bootstrap`        | Çalışma alanı başlangıç dosyaları enjekte edilmeden önce         |
| `gateway:startup`        | Kanallar başlatıldıktan ve kancalar yüklendikten sonra          |
| `gateway:shutdown`       | Gateway kapatma işlemi başladığında                             |
| `gateway:pre-restart`    | Beklenen bir Gateway yeniden başlatmasından önce                 |
| `message:received`       | Herhangi bir kanaldan gelen ileti                               |
| `message:transcribed`    | Ses transkripsiyonu tamamlandıktan sonra                        |
| `message:preprocessed`   | Medya ve bağlantı ön işlemesi tamamlandıktan veya atlandıktan sonra |
| `message:sent`           | Giden ileti teslim edildiğinde                                  |

## Kanca yazma

### Kanca yapısı

Her kanca iki dosya içeren bir dizindir:

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
| `emoji`    | CLI için görüntülenecek emoji                        |
| `events`   | Dinlenecek olayların dizisi                          |
| `export`   | Kullanılacak adlandırılmış dışa aktarım (varsayılan `"default"`) |
| `os`       | Gerekli platformlar (örn. `["darwin", "linux"]`)     |
| `requires` | Gerekli `bins`, `anyBins`, `env` veya `config` yolları |
| `always`   | Uygunluk kontrollerini atla (boole)                  |
| `install`  | Kurulum yöntemleri                                   |

### İşleyici uygulaması

```typescript
const handler = async (event) => {
  if (event.type !== "command" || event.action !== "new") {
    return;
  }

  console.log(`[my-hook] New command triggered`);
  // Your logic here

  // Optionally send message to user
  event.messages.push("Hook executed!");
};

export default handler;
```

Her olay şunları içerir: `type`, `action`, `sessionKey`, `timestamp`, `messages` (kullanıcıya göndermek için içine ekleyin) ve `context` (olaya özgü veri). Ajan ve araç Plugin kancası bağlamları ayrıca `trace` içerebilir; bu, Plugin'lerin OTEL korelasyonu için yapılandırılmış günlüklere aktarabileceği salt okunur, W3C uyumlu bir tanılama izleme bağlamıdır.

### Olay bağlamı öne çıkanları

**Komut olayları** (`command:new`, `command:reset`): `context.sessionEntry`, `context.previousSessionEntry`, `context.commandSource`, `context.workspaceDir`, `context.cfg`.

**İleti olayları** (`message:received`): `context.from`, `context.content`, `context.channelId`, `context.metadata` (`senderId`, `senderName`, `guildId` dahil sağlayıcıya özgü veri). `context.content`, komut benzeri iletiler için boş olmayan bir komut gövdesini tercih eder, ardından ham gelen gövdeye ve genel gövdeye geri döner; iş parçacığı geçmişi veya bağlantı özetleri gibi yalnızca ajana yönelik zenginleştirmeleri içermez.

**İleti olayları** (`message:sent`): `context.to`, `context.content`, `context.success`, `context.channelId`.

**İleti olayları** (`message:transcribed`): `context.transcript`, `context.from`, `context.channelId`, `context.mediaPath`.

**İleti olayları** (`message:preprocessed`): `context.bodyForAgent` (son zenginleştirilmiş gövde), `context.from`, `context.channelId`.

**Başlangıç olayları** (`agent:bootstrap`): `context.bootstrapFiles` (değiştirilebilir dizi), `context.agentId`.

**Oturum yama olayları** (`session:patch`): `context.sessionEntry`, `context.patch` (yalnızca değişen alanlar), `context.cfg`. Yama olaylarını yalnızca ayrıcalıklı istemciler tetikleyebilir.

**Compaction olayları**: `session:compact:before`, `messageCount` ve `tokenCount` içerir. `session:compact:after`, `compactedCount`, `summaryLength`, `tokensBefore`, `tokensAfter` ekler.

`command:stop`, kullanıcının `/stop` vermesini gözlemler; bu bir iptal/komut
yaşam döngüsüdür, ajan sonlandırma kapısı değildir. Doğal bir son yanıtı
incelemesi ve ajandan bir geçiş daha istemesi gereken Plugin'ler bunun yerine
türlü Plugin kancası `before_agent_finalize` kullanmalıdır. Bkz. [Plugin kancaları](/tr/plugins/hooks).

**Gateway yaşam döngüsü olayları**: `gateway:shutdown`, `reason` ve `restartExpectedMs` içerir ve Gateway kapatma işlemi başladığında tetiklenir. `gateway:pre-restart` aynı bağlamı içerir ancak yalnızca kapatma işlemi beklenen bir yeniden başlatmanın parçası olduğunda ve sonlu bir `restartExpectedMs` değeri sağlandığında tetiklenir. Kapatma sırasında, her yaşam döngüsü kancası beklemesi en iyi çaba düzeyindedir ve bir işleyici takılırsa kapatma işleminin devam etmesi için sınırlıdır.

## Kanca keşfi

Kancalar, geçersiz kılma önceliği artacak sırayla şu dizinlerden keşfedilir:

1. **Paketlenmiş kancalar**: OpenClaw ile gönderilir
2. **Plugin kancaları**: kurulu Plugin'lerin içinde paketlenmiş kancalar
3. **Yönetilen kancalar**: `~/.openclaw/hooks/` (kullanıcı tarafından kurulan, çalışma alanları arasında paylaşılan). `hooks.internal.load.extraDirs` içindeki ek dizinler bu önceliği paylaşır.
4. **Çalışma alanı kancaları**: `<workspace>/hooks/` (ajan başına, açıkça etkinleştirilene kadar varsayılan olarak devre dışı)

Çalışma alanı kancaları yeni kanca adları ekleyebilir ancak aynı ada sahip paketlenmiş, yönetilen veya Plugin tarafından sağlanan kancaları geçersiz kılamaz.

Gateway, dahili kancalar yapılandırılana kadar başlangıçta dahili kanca keşfini atlar. Bir paketlenmiş veya yönetilen kancayı `openclaw hooks enable <name>` ile etkinleştirin, bir kanca paketi kurun ya da dahil olmak için `hooks.internal.enabled=true` ayarlayın. Adlandırılmış bir kancayı etkinleştirdiğinizde Gateway yalnızca o kancanın işleyicisini yükler; `hooks.internal.enabled=true`, ek kanca dizinleri ve eski işleyiciler geniş keşfe dahil olur.

### Kanca paketleri

Kanca paketleri, kancaları `package.json` içindeki `openclaw.hooks` üzerinden dışa aktaran npm paketleridir. Şununla kurun:

```bash
openclaw plugins install <path-or-spec>
```

Npm belirtimleri yalnızca kayıt deposu içindir (paket adı + isteğe bağlı tam sürüm veya dağıtım etiketi). Git/URL/dosya belirtimleri ve semver aralıkları reddedilir.

## Paketlenmiş kancalar

| Kanca                 | Olaylar                                           | Ne yapar                                                       |
| --------------------- | ------------------------------------------------- | -------------------------------------------------------------- |
| session-memory        | `command:new`, `command:reset`                    | Oturum bağlamını `<workspace>/memory/` içine kaydeder          |
| bootstrap-extra-files | `agent:bootstrap`                                 | Glob desenlerinden ek başlangıç dosyaları enjekte eder         |
| command-logger        | `command`                                         | Tüm komutları `~/.openclaw/logs/commands.log` içine günlüğe kaydeder |
| compaction-notifier   | `session:compact:before`, `session:compact:after` | Oturum Compaction başladığında/bittiğinde görünür sohbet bildirimleri gönderir |
| boot-md               | `gateway:startup`                                 | Gateway başladığında `BOOT.md` çalıştırır                     |

Herhangi bir paketlenmiş kancayı etkinleştirin:

```bash
openclaw hooks enable <hook-name>
```

<a id="session-memory"></a>

### session-memory ayrıntıları

Son 15 kullanıcı/asistan iletisini çıkarır, LLM aracılığıyla açıklayıcı bir dosya adı kısaltması oluşturur ve ana makinenin yerel tarihini kullanarak `<workspace>/memory/YYYY-MM-DD-slug.md` içine kaydeder. `workspace.dir` yapılandırılmış olmalıdır.

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

Yollar çalışma alanına göre çözümlenir. Yalnızca tanınan başlangıç temel adları yüklenir (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`, `MEMORY.md`).

<a id="command-logger"></a>

### command-logger ayrıntıları

Her eğik çizgi komutunu `~/.openclaw/logs/commands.log` içine günlüğe kaydeder.

<a id="compaction-notifier"></a>

### compaction-notifier ayrıntıları

OpenClaw oturum transkriptini sıkıştırmaya başladığında ve bitirdiğinde geçerli konuşmaya kısa durum iletileri gönderir. Bu, sohbet yüzeylerinde uzun işlemleri daha az kafa karıştırıcı yapar çünkü kullanıcı asistanın bağlamı özetlediğini ve Compaction sonrasında devam edeceğini görebilir.

<a id="boot-md"></a>

### boot-md ayrıntıları

Gateway başladığında etkin çalışma alanından `BOOT.md` çalıştırır.

## Plugin kancaları

Plugin'ler daha derin entegrasyon için Plugin SDK üzerinden türlü kancalar kaydedebilir:
araç çağrılarını araya alma, istemleri değiştirme, ileti akışını denetleme ve daha fazlası.
`before_tool_call`, `before_agent_reply`,
`before_install` veya diğer süreç içi yaşam döngüsü kancalarına ihtiyaç duyduğunuzda Plugin kancalarını kullanın.

Tam Plugin kancası başvurusu için bkz. [Plugin kancaları](/tr/plugins/hooks).

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

- **İşleyicileri hızlı tutun.** Hooks, komut işleme sırasında çalışır. Ağır işleri `void processInBackground(event)` ile başlatıp beklemeden devam edin.
- **Hataları zarifçe ele alın.** Riskli işlemleri try/catch içine alın; diğer işleyicilerin çalışabilmesi için throw etmeyin.
- **Olayları erken filtreleyin.** Olay türü/eylemi ilgili değilse hemen dönün.
- **Belirli olay anahtarları kullanın.** Ek yükü azaltmak için `"events": ["command"]` yerine `"events": ["command:new"]` tercih edin.

## Sorun Giderme

### Hook bulunmadı

```bash
# Dizin yapısını doğrulayın
ls -la ~/.openclaw/hooks/my-hook/
# Şunu göstermeli: HOOK.md, handler.ts

# Bulunan tüm hook'ları listeleyin
openclaw hooks list
```

### Hook uygun değil

```bash
openclaw hooks info my-hook
```

Eksik ikili dosyalar (PATH), ortam değişkenleri, yapılandırma değerleri veya işletim sistemi uyumluluğunu kontrol edin.

### Hook yürütülmüyor

1. Hook'un etkin olduğunu doğrulayın: `openclaw hooks list`
2. Hook'ların yeniden yüklenmesi için gateway işleminizi yeniden başlatın.
3. Gateway günlüklerini kontrol edin: `./scripts/clawlog.sh | grep hook`

## İlgili

- [CLI Referansı: hooks](/tr/cli/hooks)
- [Webhook](/tr/automation/cron-jobs#webhooks)
- [Plugin hook'ları](/tr/plugins/hooks) — işlem içi plugin yaşam döngüsü hook'ları
- [Yapılandırma](/tr/gateway/configuration-reference#hooks)
