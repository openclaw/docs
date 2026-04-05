---
read_when:
    - /new, /reset, /stop ve agent yaşam döngüsü olayları için olay odaklı otomasyon istiyorsunuz
    - Hook'lar oluşturmak, yüklemek veya hata ayıklamak istiyorsunuz
summary: 'Hooks: komutlar ve yaşam döngüsü olayları için olay odaklı otomasyon'
title: Hooks
x-i18n:
    generated_at: "2026-04-05T13:42:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 66eb75bb2b3b2ad229bf3da24fdb0fe021ed08f812fd1d13c69b3bd9df0218e5
    source_path: automation/hooks.md
    workflow: 15
---

# Hooks

Hooks, Gateway içinde bir şey olduğunda çalışan küçük betiklerdir. Dizinlerden otomatik olarak bulunurlar ve `openclaw hooks` ile incelenebilirler.

OpenClaw içinde iki tür hook vardır:

- **Dahili hook'lar** (bu sayfa): `/new`, `/reset`, `/stop` veya yaşam döngüsü olayları gibi agent olayları tetiklendiğinde Gateway içinde çalışır.
- **Webhooks**: diğer sistemlerin OpenClaw içinde iş tetiklemesini sağlayan harici HTTP uç noktalarıdır. Bkz. [Webhooks](/automation/cron-jobs#webhooks).

Hook'lar ayrıca plugin'lerin içine paketlenebilir. `openclaw hooks list`, hem bağımsız hook'ları hem de plugin tarafından yönetilen hook'ları gösterir.

## Hızlı başlangıç

```bash
# Kullanılabilir hook'ları listele
openclaw hooks list

# Bir hook'u etkinleştir
openclaw hooks enable session-memory

# Hook durumunu kontrol et
openclaw hooks check

# Ayrıntılı bilgi al
openclaw hooks info session-memory
```

## Olay türleri

| Olay                     | Ne zaman tetiklenir                             |
| ------------------------ | ----------------------------------------------- |
| `command:new`            | `/new` komutu verildiğinde                      |
| `command:reset`          | `/reset` komutu verildiğinde                    |
| `command:stop`           | `/stop` komutu verildiğinde                     |
| `command`                | Herhangi bir komut olayı (genel dinleyici)      |
| `session:compact:before` | Sıkıştırma geçmişi özetlemeden önce             |
| `session:compact:after`  | Sıkıştırma tamamlandıktan sonra                 |
| `session:patch`          | Oturum özellikleri değiştirildiğinde            |
| `agent:bootstrap`        | Çalışma alanı bootstrap dosyaları eklenmeden önce |
| `gateway:startup`        | Kanallar başlatılıp hook'lar yüklendikten sonra |
| `message:received`       | Herhangi bir kanaldan gelen mesaj               |
| `message:transcribed`    | Ses dökümü tamamlandıktan sonra                 |
| `message:preprocessed`   | Tüm medya ve bağlantı anlama işlemleri tamamlandıktan sonra |
| `message:sent`           | Giden mesaj teslim edildiğinde                  |

## Hook yazma

### Hook yapısı

Her hook, iki dosya içeren bir dizindir:

```
my-hook/
├── HOOK.md          # Meta veriler + dokümantasyon
└── handler.ts       # Handler uygulaması
```

### HOOK.md biçimi

```markdown
---
name: my-hook
description: "Bu hook'un ne yaptığının kısa açıklaması"
metadata:
  { "openclaw": { "emoji": "🔗", "events": ["command:new"], "requires": { "bins": ["node"] } } }
---

# My Hook

Ayrıntılı dokümantasyon buraya gelir.
```

**Meta veri alanları** (`metadata.openclaw`):

| Alan       | Açıklama                                             |
| ---------- | ---------------------------------------------------- |
| `emoji`    | CLI için görüntülenecek emoji                        |
| `events`   | Dinlenecek olayların dizisi                          |
| `export`   | Kullanılacak adlandırılmış export (varsayılan `"default"`) |
| `os`       | Gerekli platformlar (örn. `["darwin", "linux"]`)     |
| `requires` | Gerekli `bins`, `anyBins`, `env` veya `config` yolları |
| `always`   | Uygunluk kontrollerini atlar (boolean)               |
| `install`  | Kurulum yöntemleri                                   |

### Handler uygulaması

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

Her olay şunları içerir: `type`, `action`, `sessionKey`, `timestamp`, `messages` (kullanıcıya göndermek için push edin) ve `context` (olaya özel veriler).

### Olay bağlamındaki öne çıkanlar

**Komut olayları** (`command:new`, `command:reset`): `context.sessionEntry`, `context.previousSessionEntry`, `context.commandSource`, `context.workspaceDir`, `context.cfg`.

**Mesaj olayları** (`message:received`): `context.from`, `context.content`, `context.channelId`, `context.metadata` (`senderId`, `senderName`, `guildId` dahil sağlayıcıya özgü veriler).

**Mesaj olayları** (`message:sent`): `context.to`, `context.content`, `context.success`, `context.channelId`.

**Mesaj olayları** (`message:transcribed`): `context.transcript`, `context.from`, `context.channelId`, `context.mediaPath`.

**Mesaj olayları** (`message:preprocessed`): `context.bodyForAgent` (son zenginleştirilmiş gövde), `context.from`, `context.channelId`.

**Bootstrap olayları** (`agent:bootstrap`): `context.bootstrapFiles` (değiştirilebilir dizi), `context.agentId`.

**Oturum yaması olayları** (`session:patch`): `context.sessionEntry`, `context.patch` (yalnızca değişen alanlar), `context.cfg`. Yalnızca ayrıcalıklı istemciler yama olaylarını tetikleyebilir.

**Sıkıştırma olayları**: `session:compact:before`, `messageCount`, `tokenCount` içerir. `session:compact:after` buna ek olarak `compactedCount`, `summaryLength`, `tokensBefore`, `tokensAfter` ekler.

## Hook keşfi

Hook'lar, artan geçersiz kılma önceliği sırasına göre şu dizinlerden bulunur:

1. **Paketli hook'lar**: OpenClaw ile birlikte gelir
2. **Plugin hook'ları**: yüklü plugin'lerin içine paketlenmiş hook'lar
3. **Yönetilen hook'lar**: `~/.openclaw/hooks/` (kullanıcı tarafından yüklenen, çalışma alanları arasında paylaşılan). `hooks.internal.load.extraDirs` içinden ek dizinler de bu önceliği paylaşır.
4. **Çalışma alanı hook'ları**: `<workspace>/hooks/` (agent başına, açıkça etkinleştirilene kadar varsayılan olarak devre dışı)

Çalışma alanı hook'ları yeni hook adları ekleyebilir, ancak aynı ada sahip paketli, yönetilen veya plugin tarafından sağlanan hook'ları geçersiz kılamaz.

### Hook paketleri

Hook paketleri, `package.json` içinde `openclaw.hooks` aracılığıyla hook export eden npm paketleridir. Şununla yükleyin:

```bash
openclaw plugins install <path-or-spec>
```

Npm spec'leri yalnızca registry içindir (paket adı + isteğe bağlı tam sürüm veya dist-tag). Git/URL/dosya spec'leri ve semver aralıkları reddedilir.

## Paketli hook'lar

| Hook                  | Olaylar                        | Ne yapar                                              |
| --------------------- | ------------------------------ | ----------------------------------------------------- |
| session-memory        | `command:new`, `command:reset` | Oturum bağlamını `<workspace>/memory/` içine kaydeder |
| bootstrap-extra-files | `agent:bootstrap`              | Glob desenlerinden ek bootstrap dosyaları ekler       |
| command-logger        | `command`                      | Tüm komutları `~/.openclaw/logs/commands.log` içine kaydeder |
| boot-md               | `gateway:startup`              | Gateway başladığında `BOOT.md` dosyasını çalıştırır   |

Herhangi bir paketli hook'u etkinleştirin:

```bash
openclaw hooks enable <hook-name>
```

### session-memory ayrıntıları

Son 15 kullanıcı/assistant mesajını çıkarır, açıklayıcı bir dosya adı slug'ını LLM ile oluşturur ve `<workspace>/memory/YYYY-MM-DD-slug.md` içine kaydeder. `workspace.dir` yapılandırılmış olmalıdır.

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

## Plugin hook'ları

Plugin'ler, daha derin entegrasyon için Plugin SDK üzerinden hook kaydedebilir: araç çağrılarını kesmek, istemleri değiştirmek, mesaj akışını kontrol etmek ve daha fazlası. Plugin SDK; model çözümleme, agent yaşam döngüsü, mesaj akışı, araç yürütme, alt agent koordinasyonu ve gateway yaşam döngüsünü kapsayan 28 hook sunar.

`before_tool_call`, `before_agent_reply`, `before_install` ve diğer tüm plugin hook'larını içeren tam plugin hook başvurusu için bkz. [Plugin Architecture](/plugins/architecture#provider-runtime-hooks).

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
Eski `hooks.internal.handlers` dizi yapılandırma biçimi geriye dönük uyumluluk için hâlâ desteklenir, ancak yeni hook'lar keşif tabanlı sistemi kullanmalıdır.
</Note>

## CLI referansı

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

- **Handler'ları hızlı tutun.** Hook'lar komut işleme sırasında çalışır. Ağır işleri `void processInBackground(event)` ile fire-and-forget olarak başlatın.
- **Hataları zarif şekilde ele alın.** Riskli işlemleri try/catch içine alın; diğer handler'ların çalışabilmesi için throw etmeyin.
- **Olayları erken filtreleyin.** Olay türü/eylemi ilgili değilse hemen dönün.
- **Belirli olay anahtarları kullanın.** Ek yükü azaltmak için `"events": ["command"]` yerine `"events": ["command:new"]` tercih edin.

## Sorun giderme

### Hook bulunamadı

```bash
# Dizin yapısını doğrulayın
ls -la ~/.openclaw/hooks/my-hook/
# Şunları göstermelidir: HOOK.md, handler.ts

# Bulunan tüm hook'ları listeleyin
openclaw hooks list
```

### Hook uygun değil

```bash
openclaw hooks info my-hook
```

Eksik ikili dosyaları (PATH), ortam değişkenlerini, yapılandırma değerlerini veya işletim sistemi uyumluluğunu kontrol edin.

### Hook çalışmıyor

1. Hook'un etkin olduğunu doğrulayın: `openclaw hooks list`
2. Hook'ların yeniden yüklenmesi için gateway sürecinizi yeniden başlatın.
3. Gateway günlüklerini kontrol edin: `./scripts/clawlog.sh | grep hook`

## İlgili

- [CLI Reference: hooks](/cli/hooks)
- [Webhooks](/automation/cron-jobs#webhooks)
- [Plugin Architecture](/plugins/architecture#provider-runtime-hooks) — tam plugin hook başvurusu
- [Configuration](/gateway/configuration-reference#hooks)
