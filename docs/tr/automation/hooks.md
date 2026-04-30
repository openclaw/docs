---
read_when:
    - /new, /reset, /stop ve ajan yaşam döngüsü olayları için olay güdümlü otomasyon istiyorsunuz
    - Kancaları oluşturmak, yüklemek veya hata ayıklamak istiyorsunuz
summary: 'Kancalar: komutlar ve yaşam döngüsü olayları için olay güdümlü otomasyon'
title: Kancalar
x-i18n:
    generated_at: "2026-04-30T09:04:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: a6c567ab79fbff8228d174816e9fb4613f0544ea15a99b5917190a4066af0f57
    source_path: automation/hooks.md
    workflow: 16
---

Kancalar, Gateway içinde bir şey olduğunda çalışan küçük betiklerdir. Dizinlerden keşfedilebilir ve `openclaw hooks` ile incelenebilirler. Gateway dahili kancaları yalnızca kancaları etkinleştirdikten veya en az bir kanca girdisi, kanca paketi, eski işleyici ya da ek kanca dizini yapılandırdıktan sonra yükler.

OpenClaw'da iki tür kanca vardır:

- **Dahili kancalar** (bu sayfa): `/new`, `/reset`, `/stop` veya yaşam döngüsü olayları gibi aracı olayları tetiklendiğinde Gateway içinde çalışır.
- **Webhooks**: diğer sistemlerin OpenClaw'da iş tetiklemesine izin veren harici HTTP uç noktaları. Bkz. [Webhooks](/tr/automation/cron-jobs#webhooks).

Kancalar plugin'lerin içinde de paketlenebilir. `openclaw hooks list` hem bağımsız kancaları hem de plugin tarafından yönetilen kancaları gösterir.

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

| Olay                     | Ne zaman tetiklenir                                         |
| ------------------------ | ----------------------------------------------------------- |
| `command:new`            | `/new` komutu verildiğinde                                  |
| `command:reset`          | `/reset` komutu verildiğinde                                |
| `command:stop`           | `/stop` komutu verildiğinde                                 |
| `command`                | Herhangi bir komut olayı (genel dinleyici)                  |
| `session:compact:before` | Compaction geçmişi özetlemeden önce                         |
| `session:compact:after`  | Compaction tamamlandıktan sonra                             |
| `session:patch`          | Oturum özellikleri değiştirildiğinde                        |
| `agent:bootstrap`        | Çalışma alanı önyükleme dosyaları enjekte edilmeden önce    |
| `gateway:startup`        | Kanallar başladıktan ve kancalar yüklendikten sonra         |
| `gateway:shutdown`       | Gateway kapatması başladığında                              |
| `gateway:pre-restart`    | Beklenen bir Gateway yeniden başlatmasından önce            |
| `message:received`       | Herhangi bir kanaldan gelen ileti                           |
| `message:transcribed`    | Ses transkripsiyonu tamamlandıktan sonra                    |
| `message:preprocessed`   | Medya ve bağlantı ön işleme tamamlandıktan veya atlandıktan sonra |
| `message:sent`           | Giden ileti teslim edildiğinde                              |

## Kanca yazma

### Kanca yapısı

Her kanca, iki dosya içeren bir dizindir:

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
| `export`   | Kullanılacak adlandırılmış dışa aktarma (varsayılan `"default"`) |
| `os`       | Gerekli platformlar (örn. `["darwin", "linux"]`)     |
| `requires` | Gerekli `bins`, `anyBins`, `env` veya `config` yolları |
| `always`   | Uygunluk kontrollerini atla (boolean)                |
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

Her olay şunları içerir: `type`, `action`, `sessionKey`, `timestamp`, `messages` (kullanıcıya göndermek için push edin) ve `context` (olaya özgü veri). Aracı ve araç plugin kanca bağlamları ayrıca `trace` içerebilir; bu, plugin'lerin OTEL korelasyonu için yapılandırılmış günlüklere aktarabileceği, salt okunur W3C uyumlu bir tanılama iz bağlamıdır.

### Olay bağlamı öne çıkanları

**Komut olayları** (`command:new`, `command:reset`): `context.sessionEntry`, `context.previousSessionEntry`, `context.commandSource`, `context.workspaceDir`, `context.cfg`.

**İleti olayları** (`message:received`): `context.from`, `context.content`, `context.channelId`, `context.metadata` (`senderId`, `senderName`, `guildId` dahil sağlayıcıya özgü veriler).

**İleti olayları** (`message:sent`): `context.to`, `context.content`, `context.success`, `context.channelId`.

**İleti olayları** (`message:transcribed`): `context.transcript`, `context.from`, `context.channelId`, `context.mediaPath`.

**İleti olayları** (`message:preprocessed`): `context.bodyForAgent` (son zenginleştirilmiş gövde), `context.from`, `context.channelId`.

**Önyükleme olayları** (`agent:bootstrap`): `context.bootstrapFiles` (değiştirilebilir dizi), `context.agentId`.

**Oturum yama olayları** (`session:patch`): `context.sessionEntry`, `context.patch` (yalnızca değişen alanlar), `context.cfg`. Yama olaylarını yalnızca ayrıcalıklı istemciler tetikleyebilir.

**Compaction olayları**: `session:compact:before`, `messageCount` ve `tokenCount` içerir. `session:compact:after`, `compactedCount`, `summaryLength`, `tokensBefore`, `tokensAfter` ekler.

`command:stop`, kullanıcının `/stop` vermesini gözlemler; bu, bir aracı sonlandırma kapısı değil, iptal/komut yaşam döngüsüdür. Doğal bir son yanıtı incelemesi ve aracıdan bir geçiş daha istemesi gereken plugin'ler bunun yerine yazımlı plugin kancası `before_agent_finalize` kullanmalıdır. Bkz. [Plugin kancaları](/tr/plugins/hooks).

**Gateway yaşam döngüsü olayları**: `gateway:shutdown`, `reason` ve `restartExpectedMs` içerir ve Gateway kapatması başladığında tetiklenir. `gateway:pre-restart` aynı bağlamı içerir ancak yalnızca kapatma beklenen bir yeniden başlatmanın parçası olduğunda ve sonlu bir `restartExpectedMs` değeri sağlandığında tetiklenir. Kapatma sırasında, her yaşam döngüsü kancası beklemesi en iyi çaba ilkesine göre ve sınırlı olarak yapılır; böylece bir işleyici takılırsa kapatma devam eder.

## Kanca keşfi

Kancalar şu dizinlerden, artan geçersiz kılma önceliği sırasına göre keşfedilir:

1. **Paketlenmiş kancalar**: OpenClaw ile birlikte gelir
2. **Plugin kancaları**: kurulu plugin'lerin içinde paketlenmiş kancalar
3. **Yönetilen kancalar**: `~/.openclaw/hooks/` (kullanıcı tarafından kurulan, çalışma alanları arasında paylaşılan). `hooks.internal.load.extraDirs` içindeki ek dizinler bu önceliği paylaşır.
4. **Çalışma alanı kancaları**: `<workspace>/hooks/` (aracı başına, açıkça etkinleştirilene kadar varsayılan olarak devre dışı)

Çalışma alanı kancaları yeni kanca adları ekleyebilir ancak aynı ada sahip paketlenmiş, yönetilen veya plugin tarafından sağlanan kancaları geçersiz kılamaz.

Gateway, dahili kancalar yapılandırılana kadar başlangıçta dahili kanca keşfini atlar. Katılmak için `openclaw hooks enable <name>` ile paketlenmiş veya yönetilen bir kancayı etkinleştirin, bir kanca paketi kurun ya da `hooks.internal.enabled=true` ayarlayın. Bir adlandırılmış kancayı etkinleştirdiğinizde Gateway yalnızca o kancanın işleyicisini yükler; `hooks.internal.enabled=true`, ek kanca dizinleri ve eski işleyiciler geniş keşfe katılır.

### Kanca paketleri

Kanca paketleri, `package.json` içindeki `openclaw.hooks` aracılığıyla kancaları dışa aktaran npm paketleridir. Şununla kurun:

```bash
openclaw plugins install <path-or-spec>
```

Npm belirtimleri yalnızca kayıt defteri içindir (paket adı + isteğe bağlı tam sürüm veya dist-tag). Git/URL/dosya belirtimleri ve semver aralıkları reddedilir.

## Paketlenmiş kancalar

| Kanca                 | Olaylar                        | Ne yapar                                              |
| --------------------- | ------------------------------ | ----------------------------------------------------- |
| session-memory        | `command:new`, `command:reset` | Oturum bağlamını `<workspace>/memory/` içine kaydeder |
| bootstrap-extra-files | `agent:bootstrap`              | Glob kalıplarından ek önyükleme dosyaları enjekte eder |
| command-logger        | `command`                      | Tüm komutları `~/.openclaw/logs/commands.log` içine günlüğe yazar |
| boot-md               | `gateway:startup`              | Gateway başladığında `BOOT.md` çalıştırır             |

Herhangi bir paketlenmiş kancayı etkinleştirin:

```bash
openclaw hooks enable <hook-name>
```

<a id="session-memory"></a>

### session-memory ayrıntıları

Son 15 kullanıcı/asistan iletisini çıkarır, LLM aracılığıyla açıklayıcı bir dosya adı kısa adı oluşturur ve ana makinenin yerel tarihini kullanarak `<workspace>/memory/YYYY-MM-DD-slug.md` içine kaydeder. `workspace.dir` yapılandırılmış olmalıdır.

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

Yollar çalışma alanına göre çözümlenir. Yalnızca tanınan önyükleme temel adları yüklenir (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`, `MEMORY.md`).

<a id="command-logger"></a>

### command-logger ayrıntıları

Her eğik çizgi komutunu `~/.openclaw/logs/commands.log` içine günlüğe yazar.

<a id="boot-md"></a>

### boot-md ayrıntıları

Gateway başladığında etkin çalışma alanındaki `BOOT.md` dosyasını çalıştırır.

## Plugin kancaları

Plugin'ler daha derin entegrasyon için Plugin SDK üzerinden yazımlı kancalar kaydedebilir:
araç çağrılarını yakalama, istemleri değiştirme, ileti akışını denetleme ve daha fazlası.
`before_tool_call`, `before_agent_reply`, `before_install` veya diğer süreç içi yaşam döngüsü kancalarına ihtiyacınız olduğunda plugin kancalarını kullanın.

Eksiksiz plugin kancası başvurusu için bkz. [Plugin kancaları](/tr/plugins/hooks).

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

- **İşleyicileri hızlı tutun.** Kancalar komut işleme sırasında çalışır. Ağır işleri `void processInBackground(event)` ile başlatıp beklemeden bırakın.
- **Hataları zarifçe işleyin.** Riskli işlemleri try/catch içine sarın; diğer işleyicilerin çalışabilmesi için throw etmeyin.
- **Olayları erken filtreleyin.** Olay türü/eylemi ilgili değilse hemen return edin.
- **Belirli olay anahtarları kullanın.** Yükü azaltmak için `"events": ["command"]` yerine `"events": ["command:new"]` tercih edin.

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

### Kanca çalışmıyor

1. Kancanın etkin olduğunu doğrulayın: `openclaw hooks list`
2. Kancaların yeniden yüklenmesi için Gateway sürecinizi yeniden başlatın.
3. Gateway günlüklerini kontrol edin: `./scripts/clawlog.sh | grep hook`

## İlgili

- [CLI Başvurusu: kancalar](/tr/cli/hooks)
- [Webhook'lar](/tr/automation/cron-jobs#webhooks)
- [Plugin kancaları](/tr/plugins/hooks) — işlem içi Plugin yaşam döngüsü kancaları
- [Yapılandırma](/tr/gateway/configuration-reference#hooks)
