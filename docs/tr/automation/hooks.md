---
read_when:
    - '`/new`, `/reset`, `/stop` ve ajan yaşam döngüsü olayları için olay güdümlü otomasyon istiyorsunuz'
    - Kancaları oluşturmak, yüklemek veya hata ayıklamak istiyorsunuz
summary: 'Kancalar: komutlar ve yaşam döngüsü olayları için olay güdümlü otomasyon'
title: Kancalar
x-i18n:
    generated_at: "2026-04-26T11:22:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: cf40a64449347ef750b4b0e0a83b80e2e8fdef87d92daa71f028d2bf6a3d3d22
    source_path: automation/hooks.md
    workflow: 15
---

Kancalar, Gateway içinde bir şey olduğunda çalışan küçük betiklerdir. Dizinlerden keşfedilebilir ve `openclaw hooks` ile incelenebilirler. Gateway, yalnızca kancaları etkinleştirdikten veya en az bir kanca girdisi, kanca paketi, eski işleyici ya da ek kanca dizini yapılandırdıktan sonra dahili kancaları yükler.

OpenClaw içinde iki tür kanca vardır:

- **Dahili kancalar** (bu sayfa): `/new`, `/reset`, `/stop` veya yaşam döngüsü olayları gibi ajan olayları tetiklendiğinde Gateway içinde çalışır.
- **Webhooks**: diğer sistemlerin OpenClaw içinde iş tetiklemesine izin veren harici HTTP uç noktalarıdır. Bkz. [Webhooks](/tr/automation/cron-jobs#webhooks).

Kancalar ayrıca Plugin'lerin içinde de paketlenebilir. `openclaw hooks list`, hem bağımsız kancaları hem de plugin tarafından yönetilen kancaları gösterir.

## Hızlı başlangıç

```bash
# Kullanılabilir kancaları listele
openclaw hooks list

# Bir kancayı etkinleştir
openclaw hooks enable session-memory

# Kanca durumunu denetle
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
| `session:compact:before` | Compaction geçmişi özetlemeden önce             |
| `session:compact:after`  | Compaction tamamlandıktan sonra                 |
| `session:patch`          | Oturum özellikleri değiştirildiğinde            |
| `agent:bootstrap`        | Çalışma alanı bootstrap dosyaları eklenmeden önce |
| `gateway:startup`        | Kanallar başladıktan ve kancalar yüklendikten sonra |
| `message:received`       | Herhangi bir kanaldan gelen mesaj               |
| `message:transcribed`    | Ses transkripsiyonu tamamlandıktan sonra        |
| `message:preprocessed`   | Tüm medya ve bağlantı anlama işlemleri tamamlandıktan sonra |
| `message:sent`           | Giden mesaj teslim edildiğinde                  |

## Kanca yazma

### Kanca yapısı

Her kanca iki dosya içeren bir dizindir:

```
my-hook/
├── HOOK.md          # Metadata + dokümantasyon
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

# Kancam

Ayrıntılı dokümantasyon buraya gelir.
```

**Metadata alanları** (`metadata.openclaw`):

| Alan       | Açıklama                                              |
| ---------- | ----------------------------------------------------- |
| `emoji`    | CLI için görüntülenecek emoji                         |
| `events`   | Dinlenecek olayların dizisi                           |
| `export`   | Kullanılacak adlandırılmış export (`"default"` varsayılan) |
| `os`       | Gerekli platformlar (örn. `["darwin", "linux"]`)      |
| `requires` | Gerekli `bins`, `anyBins`, `env` veya `config` yolları |
| `always`   | Uygunluk denetimlerini atla (boolean)                 |
| `install`  | Yükleme yöntemleri                                    |

### İşleyici uygulaması

```typescript
const handler = async (event) => {
  if (event.type !== "command" || event.action !== "new") {
    return;
  }

  console.log(`[my-hook] New command triggered`);
  // Mantığınız buraya

  // İsteğe bağlı olarak kullanıcıya mesaj gönder
  event.messages.push("Kanca çalıştırıldı!");
};

export default handler;
```

Her olay şunları içerir: `type`, `action`, `sessionKey`, `timestamp`, `messages` (kullanıcıya göndermek için buraya ekleyin) ve `context` (olaya özgü veriler). Ajan ve araç plugin kanca bağlamları ayrıca, plugin'lerin OTEL korelasyonu için yapılandırılmış günlük kayıtlarına aktarabileceği, yalnızca okunabilir W3C uyumlu bir tanılama iz bağlamı olan `trace` içerebilir.

### Olay bağlamı öne çıkanları

**Komut olayları** (`command:new`, `command:reset`): `context.sessionEntry`, `context.previousSessionEntry`, `context.commandSource`, `context.workspaceDir`, `context.cfg`.

**Mesaj olayları** (`message:received`): `context.from`, `context.content`, `context.channelId`, `context.metadata` (`senderId`, `senderName`, `guildId` dahil sağlayıcıya özgü veriler).

**Mesaj olayları** (`message:sent`): `context.to`, `context.content`, `context.success`, `context.channelId`.

**Mesaj olayları** (`message:transcribed`): `context.transcript`, `context.from`, `context.channelId`, `context.mediaPath`.

**Mesaj olayları** (`message:preprocessed`): `context.bodyForAgent` (nihai zenginleştirilmiş gövde), `context.from`, `context.channelId`.

**Bootstrap olayları** (`agent:bootstrap`): `context.bootstrapFiles` (değiştirilebilir dizi), `context.agentId`.

**Oturum yama olayları** (`session:patch`): `context.sessionEntry`, `context.patch` (yalnızca değişen alanlar), `context.cfg`. Yalnızca ayrıcalıklı istemciler yama olaylarını tetikleyebilir.

**Compaction olayları**: `session:compact:before`, `messageCount`, `tokenCount` içerir. `session:compact:after` ise buna ek olarak `compactedCount`, `summaryLength`, `tokensBefore`, `tokensAfter` ekler.

`command:stop`, kullanıcının `/stop` vermesini gözlemler; bu, ajan sonlandırma geçidi değil, iptal/komut yaşam döngüsüdür. Doğal bir nihai yanıtı incelemesi ve ajandan bir geçiş daha istemesi gereken Plugin'ler bunun yerine yazılı plugin kancası `before_agent_finalize` kullanmalıdır. Bkz. [Plugin hooks](/tr/plugins/hooks).

## Kanca keşfi

Kancalar, artan geçersiz kılma önceliği sırasıyla şu dizinlerden keşfedilir:

1. **Paketlenmiş kancalar**: OpenClaw ile birlikte gönderilir
2. **Plugin kancaları**: yüklü plugin'lerin içinde paketlenmiş kancalar
3. **Yönetilen kancalar**: `~/.openclaw/hooks/` (kullanıcı tarafından yüklenen, çalışma alanları arasında paylaşılan). `hooks.internal.load.extraDirs` içindeki ek dizinler de bu önceliği paylaşır.
4. **Çalışma alanı kancaları**: `<workspace>/hooks/` (ajan başına, açıkça etkinleştirilene kadar varsayılan olarak devre dışı)

Çalışma alanı kancaları yeni kanca adları ekleyebilir, ancak aynı adlı paketlenmiş, yönetilen veya plugin tarafından sağlanan kancaların yerine geçemez.

Gateway, dahili kancalar yapılandırılana kadar başlangıçta dahili kanca keşfini atlar. Bir paketlenmiş veya yönetilen kancayı `openclaw hooks enable <name>` ile etkinleştirin, bir kanca paketi yükleyin veya katılmak için `hooks.internal.enabled=true` ayarlayın. Adlandırılmış bir kancayı etkinleştirdiğinizde Gateway yalnızca o kancanın işleyicisini yükler; `hooks.internal.enabled=true`, ek kanca dizinleri ve eski işleyiciler geniş kapsamlı keşfe katılır.

### Kanca paketleri

Kanca paketleri, `package.json` içinde `openclaw.hooks` üzerinden kancalar export eden npm paketleridir. Şununla yükleyin:

```bash
openclaw plugins install <path-or-spec>
```

Npm belirtimleri yalnızca kayıt defteri içindir (paket adı + isteğe bağlı tam sürüm veya dist-tag). Git/URL/dosya belirtimleri ve semver aralıkları reddedilir.

## Paketlenmiş kancalar

| Kanca                 | Olaylar                        | Ne yapar                                               |
| --------------------- | ------------------------------ | ------------------------------------------------------ |
| session-memory        | `command:new`, `command:reset` | Oturum bağlamını `<workspace>/memory/` içine kaydeder  |
| bootstrap-extra-files | `agent:bootstrap`              | Glob kalıplarından ek bootstrap dosyaları ekler        |
| command-logger        | `command`                      | Tüm komutları `~/.openclaw/logs/commands.log` dosyasına kaydeder |
| boot-md               | `gateway:startup`              | Gateway başladığında `BOOT.md` çalıştırır              |

Herhangi bir paketlenmiş kancayı etkinleştirin:

```bash
openclaw hooks enable <hook-name>
```

<a id="session-memory"></a>

### session-memory ayrıntıları

Son 15 kullanıcı/asistan mesajını çıkarır, LLM aracılığıyla açıklayıcı bir dosya adı slug'ı oluşturur ve `<workspace>/memory/YYYY-MM-DD-slug.md` içine kaydeder. `workspace.dir` yapılandırılmış olmalıdır.

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

## Plugin kancaları

Plugin'ler, daha derin entegrasyon için Plugin SDK aracılığıyla yazılı kancalar kaydedebilir:
araç çağrılarını yakalama, istemleri değiştirme, mesaj akışını kontrol etme ve daha fazlası.
`before_tool_call`, `before_agent_reply`,
`before_install` veya diğer işlem içi yaşam döngüsü kancalarına ihtiyaç duyduğunuzda plugin kancalarını kullanın.

Plugin kancalarına ilişkin tam başvuru için bkz. [Plugin hooks](/tr/plugins/hooks).

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
# Tüm kancaları listele (`--eligible`, `--verbose` veya `--json` ekleyin)
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

- **İşleyicileri hızlı tutun.** Kancalar komut işleme sırasında çalışır. Ağır işleri `void processInBackground(event)` ile ateşle-ve-unut olarak çalıştırın.
- **Hataları zarif şekilde ele alın.** Riskli işlemleri try/catch içine alın; diğer işleyiciler çalışabilsin diye hata fırlatmayın.
- **Olayları erken filtreleyin.** Olay türü/eylem ilgili değilse hemen dönün.
- **Belirli olay anahtarları kullanın.** Yükü azaltmak için `"events": ["command"]` yerine `"events": ["command:new"]` tercih edin.

## Sorun giderme

### Kanca keşfedilmiyor

```bash
# Dizin yapısını doğrula
ls -la ~/.openclaw/hooks/my-hook/
# Şunları göstermelidir: HOOK.md, handler.ts

# Keşfedilen tüm kancaları listele
openclaw hooks list
```

### Kanca uygun değil

```bash
openclaw hooks info my-hook
```

Eksik binary'leri (PATH), ortam değişkenlerini, yapılandırma değerlerini veya işletim sistemi uyumluluğunu kontrol edin.

### Kanca çalışmıyor

1. Kancanın etkin olduğundan emin olun: `openclaw hooks list`
2. Kancaların yeniden yüklenmesi için gateway sürecinizi yeniden başlatın.
3. Gateway günlüklerini kontrol edin: `./scripts/clawlog.sh | grep hook`

## İlgili

- [CLI Reference: hooks](/tr/cli/hooks)
- [Webhooks](/tr/automation/cron-jobs#webhooks)
- [Plugin hooks](/tr/plugins/hooks) — işlem içi plugin yaşam döngüsü kancaları
- [Configuration](/tr/gateway/configuration-reference#hooks)
