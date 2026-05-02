---
read_when:
    - /new, /reset, /stop ve ajan yaşam döngüsü olayları için olay güdümlü otomasyon istiyorsunuz
    - Kancalar oluşturmak, yüklemek veya hata ayıklamak istiyorsunuz
summary: 'Kancalar: komutlar ve yaşam döngüsü olayları için olay odaklı otomasyon'
title: Kancalar
x-i18n:
    generated_at: "2026-05-02T20:41:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 00ebf65dce03c8643fc1eac84c3915aaa00133c7f007a22483a845e61f055d6b
    source_path: automation/hooks.md
    workflow: 16
---

Hook'lar, Gateway içinde bir şey olduğunda çalışan küçük betiklerdir. Dizinlerden keşfedilebilir ve `openclaw hooks` ile incelenebilirler. Gateway, dahili hook'ları yalnızca hook'ları etkinleştirdikten veya en az bir hook girdisi, hook paketi, eski işleyici ya da ek hook dizini yapılandırdıktan sonra yükler.

OpenClaw'da iki tür hook vardır:

- **Dahili hook'lar** (bu sayfa): `/new`, `/reset`, `/stop` veya yaşam döngüsü olayları gibi ajan olayları tetiklendiğinde Gateway içinde çalışır.
- **Webhooks**: diğer sistemlerin OpenClaw'da iş tetiklemesini sağlayan harici HTTP uç noktalarıdır. Bkz. [Webhooks](/tr/automation/cron-jobs#webhooks).

Hook'lar Plugin'ler içinde de paketlenebilir. `openclaw hooks list` hem bağımsız hook'ları hem de Plugin tarafından yönetilen hook'ları gösterir.

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
| `agent:bootstrap`        | Çalışma alanı bootstrap dosyaları enjekte edilmeden önce         |
| `gateway:startup`        | Kanallar başlatıldıktan ve hook'lar yüklendikten sonra           |
| `gateway:shutdown`       | Gateway kapatma işlemi başladığında                             |
| `gateway:pre-restart`    | Beklenen bir Gateway yeniden başlatmasından önce                 |
| `message:received`       | Herhangi bir kanaldan gelen ileti                                |
| `message:transcribed`    | Ses transkripsiyonu tamamlandıktan sonra                         |
| `message:preprocessed`   | Medya ve bağlantı ön işleme tamamlandıktan veya atlandıktan sonra |
| `message:sent`           | Giden ileti teslim edildiğinde                                  |

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

**Metadata alanları** (`metadata.openclaw`):

| Alan       | Açıklama                                             |
| ---------- | ---------------------------------------------------- |
| `emoji`    | CLI için görüntülenecek emoji                        |
| `events`   | Dinlenecek olaylar dizisi                            |
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

Her olay şunları içerir: `type`, `action`, `sessionKey`, `timestamp`, `messages` (kullanıcıya göndermek için push edin) ve `context` (olaya özgü veri). Ajan ve araç Plugin hook bağlamları ayrıca, Plugin'lerin OTEL korelasyonu için yapılandırılmış günlüklerine iletebileceği salt okunur W3C uyumlu tanılama iz bağlamı olan `trace` içerebilir.

### Olay bağlamı öne çıkanları

**Komut olayları** (`command:new`, `command:reset`): `context.sessionEntry`, `context.previousSessionEntry`, `context.commandSource`, `context.workspaceDir`, `context.cfg`.

**İleti olayları** (`message:received`): `context.from`, `context.content`, `context.channelId`, `context.metadata` (`senderId`, `senderName`, `guildId` dahil sağlayıcıya özgü veri). `context.content`, komut benzeri iletiler için boş olmayan bir komut gövdesini tercih eder, ardından ham gelen gövdeye ve genel gövdeye geri döner; iş parçacığı geçmişi veya bağlantı özetleri gibi yalnızca ajana yönelik zenginleştirmeleri içermez.

**İleti olayları** (`message:sent`): `context.to`, `context.content`, `context.success`, `context.channelId`.

**İleti olayları** (`message:transcribed`): `context.transcript`, `context.from`, `context.channelId`, `context.mediaPath`.

**İleti olayları** (`message:preprocessed`): `context.bodyForAgent` (son zenginleştirilmiş gövde), `context.from`, `context.channelId`.

**Bootstrap olayları** (`agent:bootstrap`): `context.bootstrapFiles` (değiştirilebilir dizi), `context.agentId`.

**Oturum yama olayları** (`session:patch`): `context.sessionEntry`, `context.patch` (yalnızca değişen alanlar), `context.cfg`. Yama olaylarını yalnızca ayrıcalıklı istemciler tetikleyebilir.

**Compaction olayları**: `session:compact:before`, `messageCount`, `tokenCount` içerir. `session:compact:after`, `compactedCount`, `summaryLength`, `tokensBefore`, `tokensAfter` ekler.

`command:stop`, kullanıcının `/stop` vermesini gözlemler; bu bir iptal/komut yaşam döngüsüdür, ajan sonlandırma kapısı değildir. Doğal bir son yanıtı incelemesi ve ajandan bir geçiş daha istemesi gereken Plugin'ler bunun yerine yazımlı Plugin hook'u `before_agent_finalize` kullanmalıdır. Bkz. [Plugin hook'ları](/tr/plugins/hooks).

**Gateway yaşam döngüsü olayları**: `gateway:shutdown`, `reason` ve `restartExpectedMs` içerir ve Gateway kapatma işlemi başladığında tetiklenir. `gateway:pre-restart` aynı bağlamı içerir ancak yalnızca kapatma işlemi beklenen bir yeniden başlatmanın parçası olduğunda ve sonlu bir `restartExpectedMs` değeri sağlandığında tetiklenir. Kapatma sırasında, her yaşam döngüsü hook beklemesi en iyi çaba ilkesine göre yapılır ve sınırlandırılır; böylece bir işleyici takılsa bile kapatma devam eder.

## Hook keşfi

Hook'lar, artan geçersiz kılma önceliği sırasıyla şu dizinlerden keşfedilir:

1. **Paketlenmiş hook'lar**: OpenClaw ile birlikte gönderilir
2. **Plugin hook'ları**: kurulu Plugin'lerin içinde paketlenmiş hook'lar
3. **Yönetilen hook'lar**: `~/.openclaw/hooks/` (kullanıcı tarafından kurulmuş, çalışma alanları arasında paylaşılan). `hooks.internal.load.extraDirs` kaynaklı ek dizinler bu önceliği paylaşır.
4. **Çalışma alanı hook'ları**: `<workspace>/hooks/` (ajan başına, açıkça etkinleştirilene kadar varsayılan olarak devre dışıdır)

Çalışma alanı hook'ları yeni hook adları ekleyebilir ancak aynı ada sahip paketlenmiş, yönetilen veya Plugin tarafından sağlanan hook'ları geçersiz kılamaz.

Gateway, dahili hook'lar yapılandırılana kadar başlangıçta dahili hook keşfini atlar. Katılmak için paketlenmiş veya yönetilen bir hook'u `openclaw hooks enable <name>` ile etkinleştirin, bir hook paketi kurun veya `hooks.internal.enabled=true` ayarlayın. Adlandırılmış tek bir hook'u etkinleştirdiğinizde Gateway yalnızca o hook'un işleyicisini yükler; `hooks.internal.enabled=true`, ek hook dizinleri ve eski işleyiciler geniş keşfe katılır.

### Hook paketleri

Hook paketleri, `package.json` içinde `openclaw.hooks` aracılığıyla hook dışa aktaran npm paketleridir. Şununla kurun:

```bash
openclaw plugins install <path-or-spec>
```

Npm belirtimleri yalnızca registry içindir (paket adı + isteğe bağlı tam sürüm veya dist-tag). Git/URL/file belirtimleri ve semver aralıkları reddedilir.

## Paketle gelen kancalar

| Kanca                 | Olaylar                        | Ne yapar                                             |
| --------------------- | ------------------------------ | ---------------------------------------------------- |
| session-memory        | `command:new`, `command:reset` | Oturum bağlamını `<workspace>/memory/` içine kaydeder |
| bootstrap-extra-files | `agent:bootstrap`              | Glob desenlerinden ek bootstrap dosyaları enjekte eder |
| command-logger        | `command`                      | Tüm komutları `~/.openclaw/logs/commands.log` dosyasına kaydeder |
| boot-md               | `gateway:startup`              | Gateway başladığında `BOOT.md` çalıştırır            |

Paketle gelen herhangi bir kancayı etkinleştirin:

```bash
openclaw hooks enable <hook-name>
```

<a id="session-memory"></a>

### session-memory ayrıntıları

Son 15 kullanıcı/asistan mesajını çıkarır, LLM ile açıklayıcı bir dosya adı slug'ı oluşturur ve ana makinenin yerel tarihini kullanarak `<workspace>/memory/YYYY-MM-DD-slug.md` içine kaydeder. `workspace.dir` yapılandırılmış olmalıdır.

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

Yollar workspace'e göre çözümlenir. Yalnızca tanınan bootstrap taban adları yüklenir (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`, `MEMORY.md`).

<a id="command-logger"></a>

### command-logger ayrıntıları

Her slash komutunu `~/.openclaw/logs/commands.log` dosyasına kaydeder.

<a id="boot-md"></a>

### boot-md ayrıntıları

Gateway başladığında etkin workspace'ten `BOOT.md` çalıştırır.

## Plugin kancaları

Plugin'ler, daha derin entegrasyon için Plugin SDK üzerinden türlendirilmiş kancalar kaydedebilir:
araç çağrılarını yakalama, prompt'ları değiştirme, mesaj akışını denetleme ve daha fazlası.
`before_tool_call`, `before_agent_reply`, `before_install` veya diğer işlem içi yaşam döngüsü kancalarına ihtiyacınız olduğunda Plugin kancalarını kullanın.

Eksiksiz Plugin kancası referansı için [Plugin kancaları](/tr/plugins/hooks) bölümüne bakın.

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
Eski `hooks.internal.handlers` dizi yapılandırma biçimi geriye dönük uyumluluk için hala desteklenir, ancak yeni kancalar keşif tabanlı sistemi kullanmalıdır.
</Note>

## CLI referansı

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

- **Handler'ları hızlı tutun.** Kancalar komut işleme sırasında çalışır. Ağır işleri `void processInBackground(event)` ile başlatıp arka planda bırakın.
- **Hataları zarifçe ele alın.** Riskli işlemleri try/catch içine alın; diğer handler'ların çalışabilmesi için hata fırlatmayın.
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

Eksik ikili dosyaları (PATH), ortam değişkenlerini, yapılandırma değerlerini veya işletim sistemi uyumluluğunu kontrol edin.

### Kanca yürütülmüyor

1. Kancanın etkin olduğunu doğrulayın: `openclaw hooks list`
2. Kancaların yeniden yüklenmesi için Gateway işleminizi yeniden başlatın.
3. Gateway günlüklerini kontrol edin: `./scripts/clawlog.sh | grep hook`

## İlgili

- [CLI Başvurusu: hooks](/tr/cli/hooks)
- [Webhook'lar](/tr/automation/cron-jobs#webhooks)
- [Plugin kancaları](/tr/plugins/hooks) — işlem içi Plugin yaşam döngüsü kancaları
- [Yapılandırma](/tr/gateway/configuration-reference#hooks)
