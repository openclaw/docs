---
read_when:
    - /new, /reset, /stop ve ajan yaşam döngüsü olayları için olay güdümlü otomasyon istiyorsunuz
    - Kancalar oluşturmak, yüklemek veya hata ayıklamak istiyorsunuz
summary: 'Kancalar: komutlar ve yaşam döngüsü olayları için olay odaklı otomasyon'
title: Kancalar
x-i18n:
    generated_at: "2026-05-11T20:20:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 02f44dd117d52040ea1205521c6ecd4eb410510175e2312e2584a15e6df27d96
    source_path: automation/hooks.md
    workflow: 16
---

Hooks, Gateway içinde bir şey olduğunda çalışan küçük betiklerdir. Dizinlerden keşfedilebilir ve `openclaw hooks` ile incelenebilirler. Gateway, dahili hooks öğelerini yalnızca hooks öğelerini etkinleştirdikten veya en az bir hook girdisi, hook paketi, eski handler ya da ek hook dizini yapılandırdıktan sonra yükler.

OpenClaw içinde iki tür hooks vardır:

- **Dahili hooks** (bu sayfa): `/new`, `/reset`, `/stop` veya yaşam döngüsü olayları gibi agent olayları tetiklendiğinde Gateway içinde çalışır.
- **Webhooks**: diğer sistemlerin OpenClaw içinde iş tetiklemesini sağlayan harici HTTP uç noktaları. Bkz. [Webhooks](/tr/automation/cron-jobs#webhooks).

Hooks, plugins içinde de paketlenebilir. `openclaw hooks list` hem bağımsız hooks öğelerini hem de plugin tarafından yönetilen hooks öğelerini gösterir.

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

| Olay                     | Ne zaman tetiklenir                                        |
| ------------------------ | ---------------------------------------------------------- |
| `command:new`            | `/new` komutu verildi                                      |
| `command:reset`          | `/reset` komutu verildi                                    |
| `command:stop`           | `/stop` komutu verildi                                     |
| `command`                | Herhangi bir komut olayı (genel dinleyici)                 |
| `session:compact:before` | Compaction geçmişi özetlemeden önce                        |
| `session:compact:after`  | Compaction tamamlandıktan sonra                            |
| `session:patch`          | Oturum özellikleri değiştirildiğinde                       |
| `agent:bootstrap`        | Çalışma alanı bootstrap dosyaları enjekte edilmeden önce    |
| `gateway:startup`        | Kanallar başladıktan ve hooks yüklendikten sonra           |
| `gateway:shutdown`       | Gateway kapatması başladığında                             |
| `gateway:pre-restart`    | Beklenen bir gateway yeniden başlatmasından önce            |
| `message:received`       | Herhangi bir kanaldan gelen ileti                          |
| `message:transcribed`    | Ses transkripsiyonu tamamlandıktan sonra                   |
| `message:preprocessed`   | Medya ve bağlantı ön işlemesi tamamlandıktan veya atlandıktan sonra |
| `message:sent`           | Giden ileti teslim edildi                                  |

## Hooks yazma

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

**Metadata alanları** (`metadata.openclaw`):

| Alan       | Açıklama                                             |
| ---------- | ---------------------------------------------------- |
| `emoji`    | CLI için görüntüleme emojisi                         |
| `events`   | Dinlenecek olaylar dizisi                            |
| `export`   | Kullanılacak adlandırılmış export (varsayılan `"default"`) |
| `os`       | Gerekli platformlar (örn. `["darwin", "linux"]`)     |
| `requires` | Gerekli `bins`, `anyBins`, `env` veya `config` yolları |
| `always`   | Uygunluk kontrollerini atla (boolean)                |
| `install`  | Kurulum yöntemleri                                   |

### Handler uygulaması

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

Her olay şunları içerir: `type`, `action`, `sessionKey`, `timestamp`, `messages` (kullanıcıya göndermek için push edin) ve `context` (olaya özgü veriler). Agent ve araç plugin hook bağlamları ayrıca `trace` içerebilir; bu, plugins öğelerinin OTEL korelasyonu için yapılandırılmış günlüklere aktarabileceği salt okunur W3C uyumlu bir tanılama izleme bağlamıdır.

### Olay bağlamı öne çıkanları

**Komut olayları** (`command:new`, `command:reset`): `context.sessionEntry`, `context.previousSessionEntry`, `context.commandSource`, `context.workspaceDir`, `context.cfg`.

**İleti olayları** (`message:received`): `context.from`, `context.content`, `context.channelId`, `context.metadata` (`senderId`, `senderName`, `guildId` dahil sağlayıcıya özgü veriler). `context.content`, komut benzeri iletiler için boş olmayan bir komut gövdesini tercih eder, ardından ham gelen gövdeye ve genel gövdeye geri döner; thread geçmişi veya bağlantı özetleri gibi yalnızca agent'a ait zenginleştirmeleri içermez.

**İleti olayları** (`message:sent`): `context.to`, `context.content`, `context.success`, `context.channelId`.

**İleti olayları** (`message:transcribed`): `context.transcript`, `context.from`, `context.channelId`, `context.mediaPath`.

**İleti olayları** (`message:preprocessed`): `context.bodyForAgent` (son zenginleştirilmiş gövde), `context.from`, `context.channelId`.

**Bootstrap olayları** (`agent:bootstrap`): `context.bootstrapFiles` (değiştirilebilir dizi), `context.agentId`.

**Oturum patch olayları** (`session:patch`): `context.sessionEntry`, `context.patch` (yalnızca değişen alanlar), `context.cfg`. Patch olaylarını yalnızca ayrıcalıklı istemciler tetikleyebilir.

**Compaction olayları**: `session:compact:before`, `messageCount`, `tokenCount` içerir. `session:compact:after`, `compactedCount`, `summaryLength`, `tokensBefore`, `tokensAfter` ekler.

`command:stop`, kullanıcının `/stop` vermesini gözlemler; bu, bir agent sonlandırma kapısı değil, iptal/komut yaşam döngüsüdür. Doğal bir son yanıtı incelemesi ve agent'tan bir geçiş daha istemesi gereken plugins, bunun yerine typed plugin hook `before_agent_finalize` kullanmalıdır. Bkz. [Plugin hooks](/tr/plugins/hooks).

**Gateway yaşam döngüsü olayları**: `gateway:shutdown`, `reason` ve `restartExpectedMs` içerir ve gateway kapatması başladığında tetiklenir. `gateway:pre-restart` aynı bağlamı içerir, ancak yalnızca kapatma beklenen bir yeniden başlatmanın parçası olduğunda ve sonlu bir `restartExpectedMs` değeri sağlandığında tetiklenir. Kapatma sırasında, her yaşam döngüsü hook beklemesi best-effort ve sınırlıdır; böylece bir handler takılsa bile kapatma devam eder.

`gateway:shutdown` (veya `gateway:pre-restart`) olayı ile kapatma dizisinin geri kalanı arasında, gateway ayrıca süreç durduğunda hâlâ etkin olan her oturum için typed `session_end` plugin hook tetikler. Olayın `reason` değeri, düz bir SIGTERM/SIGINT durdurması için `shutdown`, kapatma beklenen bir yeniden başlatmanın parçası olarak zamanlandıysa `restart` olur. Bu boşaltma sınırlıdır; böylece yavaş bir `session_end` handler süreç çıkışını engelleyemez ve replace / reset / delete / compaction üzerinden zaten sonlandırılmış oturumlar çift tetiklemeyi önlemek için atlanır.

## Hook keşfi

Hooks, artan override önceliği sırasıyla şu dizinlerden keşfedilir:

1. **Paketlenmiş hooks**: OpenClaw ile gönderilir
2. **Plugin hooks**: kurulu plugins içinde paketlenmiş hooks
3. **Yönetilen hooks**: `~/.openclaw/hooks/` (kullanıcı tarafından kurulur, çalışma alanları arasında paylaşılır). `hooks.internal.load.extraDirs` üzerinden gelen ek dizinler bu önceliği paylaşır.
4. **Çalışma alanı hooks**: `<workspace>/hooks/` (agent başına, açıkça etkinleştirilene kadar varsayılan olarak devre dışı)

Çalışma alanı hooks yeni hook adları ekleyebilir, ancak aynı ada sahip paketlenmiş, yönetilen veya plugin tarafından sağlanan hooks öğelerini override edemez.

Gateway, dahili hooks yapılandırılana kadar başlangıçta dahili hook keşfini atlar. Katılmak için `openclaw hooks enable <name>` ile paketlenmiş veya yönetilen bir hook etkinleştirin, bir hook paketi kurun ya da `hooks.internal.enabled=true` ayarlayın. Adlandırılmış bir hook etkinleştirdiğinizde Gateway yalnızca o hook'un handler öğesini yükler; `hooks.internal.enabled=true`, ek hook dizinleri ve eski handlers geniş keşfe katılır.

### Hook paketleri

Hook paketleri, `package.json` içindeki `openclaw.hooks` üzerinden hooks export eden npm paketleridir. Şununla kurun:

```bash
openclaw plugins install <path-or-spec>
```

Npm spec'leri yalnızca registry'dendir (paket adı + isteğe bağlı tam sürüm veya dist-tag). Git/URL/file spec'leri ve semver aralıkları reddedilir.

## Paketlenmiş hooks

| Hook                  | Olaylar                                           | Ne yapar                                                       |
| --------------------- | ------------------------------------------------- | -------------------------------------------------------------- |
| session-memory        | `command:new`, `command:reset`                    | Oturum bağlamını `<workspace>/memory/` içine kaydeder          |
| bootstrap-extra-files | `agent:bootstrap`                                 | Glob desenlerinden ek bootstrap dosyaları enjekte eder         |
| command-logger        | `command`                                         | Tüm komutları `~/.openclaw/logs/commands.log` içine günlüğe kaydeder |
| compaction-notifier   | `session:compact:before`, `session:compact:after` | Oturum compaction başladığında/bittiğinde görünür sohbet bildirimleri gönderir |
| boot-md               | `gateway:startup`                                 | Gateway başladığında `BOOT.md` çalıştırır                     |

Herhangi bir paketlenmiş hook etkinleştirin:

```bash
openclaw hooks enable <hook-name>
```

<a id="session-memory"></a>

### session-memory ayrıntıları

Son 15 kullanıcı/assistant iletisini çıkarır ve host yerel tarihini kullanarak `<workspace>/memory/YYYY-MM-DD-HHMM.md` içine kaydeder. Bellek yakalama arka planda çalışır; böylece `/new` ve `/reset` onayları transcript okumaları veya isteğe bağlı slug üretimi nedeniyle gecikmez. Yapılandırılmış modelle açıklayıcı dosya adı slug'ları oluşturmak için `hooks.internal.entries.session-memory.llmSlug: true` ayarlayın. `workspace.dir` yapılandırılmış olmalıdır.

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

Yollar çalışma alanına göre çözülür. Yalnızca tanınan bootstrap basename'leri yüklenir (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`, `MEMORY.md`).

<a id="command-logger"></a>

### command-logger ayrıntıları

Her slash komutunu `~/.openclaw/logs/commands.log` içine günlüğe kaydeder.

<a id="compaction-notifier"></a>

### compaction-notifier ayrıntıları

OpenClaw oturum transcript'ini compact etmeye başladığında ve bitirdiğinde mevcut konuşmaya kısa durum iletileri gönderir. Bu, sohbet yüzeylerinde uzun turları daha az kafa karıştırıcı hale getirir; çünkü kullanıcı, assistant'ın bağlamı özetlediğini ve compaction sonrasında devam edeceğini görebilir.

<a id="boot-md"></a>

### boot-md ayrıntıları

Gateway başladığında etkin çalışma alanından `BOOT.md` çalıştırır.

## Plugin hooks

Plugins daha derin entegrasyon için Plugin SDK üzerinden typed hooks kaydedebilir:
araç çağrılarını yakalama, prompt'ları değiştirme, ileti akışını denetleme ve daha fazlası.
`before_tool_call`, `before_agent_reply`, `before_install` veya diğer süreç içi yaşam döngüsü hooks gerektiğinde plugin hooks kullanın.

Eksiksiz plugin hook başvurusu için bkz. [Plugin hooks](/tr/plugins/hooks).

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

Hook başına ortam değişkenleri:

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

- **İşleyicileri hızlı tutun.** Kancalar komut işleme sırasında çalışır. Ağır işleri `void processInBackground(event)` ile başlatıp arka planda bırakın.
- **Hataları düzgün şekilde ele alın.** Riskli işlemleri try/catch içine alın; diğer işleyicilerin çalışabilmesi için hata fırlatmayın.
- **Olayları erken filtreleyin.** Olay türü/eylemi ilgili değilse hemen dönün.
- **Belirli olay anahtarlarını kullanın.** Ek yükü azaltmak için `"events": ["command"]` yerine `"events": ["command:new"]` tercih edin.

## Sorun giderme

### Kanca keşfedilmiyor

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

Eksik ikili dosyaları (PATH), ortam değişkenlerini, yapılandırma değerlerini veya işletim sistemi uyumluluğunu kontrol edin.

### Kanca yürütülmüyor

1. Kancanın etkin olduğunu doğrulayın: `openclaw hooks list`
2. Kancaların yeniden yüklenmesi için gateway işleminizi yeniden başlatın.
3. Gateway günlüklerini kontrol edin: `./scripts/clawlog.sh | grep hook`

## İlgili

- [CLI Başvurusu: kancalar](/tr/cli/hooks)
- [Webhook'lar](/tr/automation/cron-jobs#webhooks)
- [Plugin kancaları](/tr/plugins/hooks) — işlem içi plugin yaşam döngüsü kancaları
- [Yapılandırma](/tr/gateway/configuration-reference#hooks)
