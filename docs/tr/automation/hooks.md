---
read_when:
    - '`/new`, `/reset`, `/stop` ve ajan yaşam döngüsü olayları için olay odaklı otomasyon istiyorsunuz'
    - Kancaları oluşturmak, yüklemek veya hatalarını ayıklamak istiyorsunuz
summary: 'Kancalar: komutlar ve yaşam döngüsü olayları için olay odaklı otomasyon'
title: Kancalar
x-i18n:
    generated_at: "2026-04-11T02:44:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 14296398e4042d442ebdf071a07c6be99d4afda7cbf3c2b934e76dc5539742c7
    source_path: automation/hooks.md
    workflow: 15
---

# Kancalar

Kancalar, Gateway içinde bir şey olduğunda çalışan küçük betiklerdir. Dizinlerden otomatik olarak keşfedilirler ve `openclaw hooks` ile incelenebilirler.

OpenClaw içinde iki tür kanca vardır:

- **Dahili kancalar** (bu sayfa): `/new`, `/reset`, `/stop` veya yaşam döngüsü olayları gibi ajan olayları tetiklendiğinde Gateway içinde çalışır.
- **Webhooks**: diğer sistemlerin OpenClaw içinde iş tetiklemesine izin veren harici HTTP uç noktalarıdır. Bkz. [Webhooks](/tr/automation/cron-jobs#webhooks).

Kancalar eklentilerin içine de paketlenebilir. `openclaw hooks list`, hem bağımsız kancaları hem de eklenti tarafından yönetilen kancaları gösterir.

## Hızlı başlangıç

```bash
# Kullanılabilir kancaları listele
openclaw hooks list

# Bir kancayı etkinleştir
openclaw hooks enable session-memory

# Kanca durumunu kontrol et
openclaw hooks check

# Ayrıntılı bilgi al
openclaw hooks info session-memory
```

## Olay türleri

| Olay                     | Tetiklendiği zaman                               |
| ------------------------ | ------------------------------------------------ |
| `command:new`            | `/new` komutu verildiğinde                       |
| `command:reset`          | `/reset` komutu verildiğinde                     |
| `command:stop`           | `/stop` komutu verildiğinde                      |
| `command`                | Herhangi bir komut olayı (genel dinleyici)       |
| `session:compact:before` | Sıkıştırma geçmişi özetlemeden önce              |
| `session:compact:after`  | Sıkıştırma tamamlandıktan sonra                  |
| `session:patch`          | Oturum özellikleri değiştirildiğinde             |
| `agent:bootstrap`        | Çalışma alanı bootstrap dosyaları eklenmeden önce |
| `gateway:startup`        | Kanallar başladıktan ve kancalar yüklendikten sonra |
| `message:received`       | Herhangi bir kanaldan gelen mesaj                |
| `message:transcribed`    | Ses dökümü tamamlandıktan sonra                  |
| `message:preprocessed`   | Tüm medya ve bağlantı anlama tamamlandıktan sonra |
| `message:sent`           | Giden mesaj teslim edildiğinde                   |

## Kanca yazma

### Kanca yapısı

Her kanca, iki dosya içeren bir dizindir:

```
my-hook/
├── HOOK.md          # Meta veriler + belgeler
└── handler.ts       # İşleyici uygulaması
```

### HOOK.md biçimi

```markdown
---
name: my-hook
description: "Bu kancanın ne yaptığının kısa açıklaması"
metadata:
  { "openclaw": { "emoji": "🔗", "events": ["command:new"], "requires": { "bins": ["node"] } } }
---

# Benim Kancam

Ayrıntılı belgeler buraya gelir.
```

**Meta veri alanları** (`metadata.openclaw`):

| Alan       | Açıklama                                             |
| ---------- | ---------------------------------------------------- |
| `emoji`    | CLI için görüntüleme emojisi                         |
| `events`   | Dinlenecek olayların dizisi                          |
| `export`   | Kullanılacak adlandırılmış dışa aktarım (`"default"` varsayılandır) |
| `os`       | Gerekli platformlar (ör. `["darwin", "linux"]`)      |
| `requires` | Gerekli `bins`, `anyBins`, `env` veya `config` yolları |
| `always`   | Uygunluk kontrollerini atla (boolean)                |
| `install`  | Yükleme yöntemleri                                   |

### İşleyici uygulaması

```typescript
const handler = async (event) => {
  if (event.type !== "command" || event.action !== "new") {
    return;
  }

  console.log(`[my-hook] New command triggered`);
  // Mantığınız burada

  // İsteğe bağlı olarak kullanıcıya mesaj gönder
  event.messages.push("Hook executed!");
};

export default handler;
```

Her olay şunları içerir: `type`, `action`, `sessionKey`, `timestamp`, `messages` (kullanıcıya göndermek için push edin) ve `context` (olaya özgü veriler).

### Olay bağlamı öne çıkanları

**Komut olayları** (`command:new`, `command:reset`): `context.sessionEntry`, `context.previousSessionEntry`, `context.commandSource`, `context.workspaceDir`, `context.cfg`.

**Mesaj olayları** (`message:received`): `context.from`, `context.content`, `context.channelId`, `context.metadata` ( `senderId`, `senderName`, `guildId` dahil sağlayıcıya özgü veriler).

**Mesaj olayları** (`message:sent`): `context.to`, `context.content`, `context.success`, `context.channelId`.

**Mesaj olayları** (`message:transcribed`): `context.transcript`, `context.from`, `context.channelId`, `context.mediaPath`.

**Mesaj olayları** (`message:preprocessed`): `context.bodyForAgent` (son zenginleştirilmiş içerik), `context.from`, `context.channelId`.

**Bootstrap olayları** (`agent:bootstrap`): `context.bootstrapFiles` (değiştirilebilir dizi), `context.agentId`.

**Oturum yaması olayları** (`session:patch`): `context.sessionEntry`, `context.patch` (yalnızca değişen alanlar), `context.cfg`. Yalnızca ayrıcalıklı istemciler yama olaylarını tetikleyebilir.

**Sıkıştırma olayları**: `session:compact:before`, `messageCount`, `tokenCount` içerir. `session:compact:after` buna `compactedCount`, `summaryLength`, `tokensBefore`, `tokensAfter` ekler.

## Kanca keşfi

Kancalar, artan geçersiz kılma önceliği sırasıyla şu dizinlerden keşfedilir:

1. **Paketlenmiş kancalar**: OpenClaw ile birlikte gönderilir
2. **Eklenti kancaları**: yüklü eklentilerin içinde paketlenmiş kancalar
3. **Yönetilen kancalar**: `~/.openclaw/hooks/` (kullanıcı tarafından yüklenen, çalışma alanları arasında paylaşılan). `hooks.internal.load.extraDirs` içindeki ek dizinler de bu önceliği paylaşır.
4. **Çalışma alanı kancaları**: `<workspace>/hooks/` (ajan başına, açıkça etkinleştirilene kadar varsayılan olarak devre dışı)

Çalışma alanı kancaları yeni kanca adları ekleyebilir, ancak aynı ada sahip paketlenmiş, yönetilen veya eklenti tarafından sağlanan kancaları geçersiz kılamaz.

### Kanca paketleri

Kanca paketleri, `package.json` içinde `openclaw.hooks` aracılığıyla kanca dışa aktaran npm paketleridir. Şununla yükleyin:

```bash
openclaw plugins install <path-or-spec>
```

Npm spec'leri yalnızca registry tabanlıdır (paket adı + isteğe bağlı tam sürüm veya dist-tag). Git/URL/file spec'leri ve semver aralıkları reddedilir.

## Paketlenmiş kancalar

| Kanca                 | Olaylar                        | Ne yapar                                              |
| --------------------- | ------------------------------ | ----------------------------------------------------- |
| session-memory        | `command:new`, `command:reset` | Oturum bağlamını `<workspace>/memory/` içine kaydeder |
| bootstrap-extra-files | `agent:bootstrap`              | Glob desenlerinden ek bootstrap dosyaları ekler       |
| command-logger        | `command`                      | Tüm komutları `~/.openclaw/logs/commands.log` dosyasına kaydeder |
| boot-md               | `gateway:startup`              | Gateway başladığında `BOOT.md` çalıştırır             |

Herhangi bir paketlenmiş kancayı etkinleştirin:

```bash
openclaw hooks enable <hook-name>
```

<a id="session-memory"></a>

### session-memory ayrıntıları

Son 15 kullanıcı/asistan mesajını çıkarır, LLM aracılığıyla açıklayıcı bir dosya adı slug'ı üretir ve `<workspace>/memory/YYYY-MM-DD-slug.md` içine kaydeder. `workspace.dir` yapılandırılmış olmalıdır.

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

Yollar çalışma alanına göre çözülür. Yalnızca tanınan bootstrap temel adları yüklenir (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`, `MEMORY.md`).

<a id="command-logger"></a>

### command-logger ayrıntıları

Her slash komutunu `~/.openclaw/logs/commands.log` dosyasına kaydeder.

<a id="boot-md"></a>

### boot-md ayrıntıları

Gateway başladığında etkin çalışma alanındaki `BOOT.md` dosyasını çalıştırır.

## Eklenti kancaları

Eklentiler, daha derin entegrasyon için Plugin SDK aracılığıyla kancalar kaydedebilir: araç çağrılarını kesmek, istemleri değiştirmek, mesaj akışını kontrol etmek ve daha fazlası. Plugin SDK; model çözümleme, ajan yaşam döngüsü, mesaj akışı, araç yürütme, alt ajan koordinasyonu ve gateway yaşam döngüsünü kapsayan 28 kanca sunar.

`before_tool_call`, `before_agent_reply`, `before_install` ve diğer tüm eklenti kancalarını içeren tam eklenti kanca başvurusu için bkz. [Plugin Architecture](/tr/plugins/architecture#provider-runtime-hooks).

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
Eski `hooks.internal.handlers` dizi yapılandırma biçimi geriye dönük uyumluluk için hâlâ desteklenmektedir, ancak yeni kancalar keşif tabanlı sistemi kullanmalıdır.
</Note>

## CLI başvurusu

```bash
# Tüm kancaları listele (--eligible, --verbose veya --json ekleyin)
openclaw hooks list

# Bir kanca hakkında ayrıntılı bilgi göster
openclaw hooks info <hook-name>

# Uygunluk özetini göster
openclaw hooks check

# Etkinleştir/devre dışı bırak
openclaw hooks enable <hook-name>
openclaw hooks disable <hook-name>
```

## En iyi uygulamalar

- **İşleyicileri hızlı tutun.** Kancalar komut işleme sırasında çalışır. Ağır işleri `void processInBackground(event)` ile fire-and-forget şeklinde başlatın.
- **Hataları zarif şekilde ele alın.** Riskli işlemleri try/catch ile sarın; diğer işleyicilerin çalışabilmesi için hata fırlatmayın.
- **Olayları erken filtreleyin.** Olay türü/eylem ilgili değilse hemen dönün.
- **Belirli olay anahtarlarını kullanın.** Ek yükü azaltmak için `"events": ["command"]` yerine `"events": ["command:new"]` tercih edin.

## Sorun giderme

### Kanca keşfedilmiyor

```bash
# Dizin yapısını doğrulayın
ls -la ~/.openclaw/hooks/my-hook/
# Şunları göstermeli: HOOK.md, handler.ts

# Keşfedilen tüm kancaları listeleyin
openclaw hooks list
```

### Kanca uygun değil

```bash
openclaw hooks info my-hook
```

Eksik binary'leri (PATH), ortam değişkenlerini, yapılandırma değerlerini veya işletim sistemi uyumluluğunu kontrol edin.

### Kanca çalışmıyor

1. Kancanın etkin olduğunu doğrulayın: `openclaw hooks list`
2. Kancaların yeniden yüklenmesi için gateway sürecinizi yeniden başlatın.
3. Gateway günlüklerini kontrol edin: `./scripts/clawlog.sh | grep hook`

## İlgili

- [CLI Reference: hooks](/cli/hooks)
- [Webhooks](/tr/automation/cron-jobs#webhooks)
- [Plugin Architecture](/tr/plugins/architecture#provider-runtime-hooks) — tam eklenti kanca başvurusu
- [Configuration](/tr/gateway/configuration-reference#hooks)
