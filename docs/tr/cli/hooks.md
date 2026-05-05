---
read_when:
    - Ajan kancalarını yönetmek istiyorsunuz
    - Hook kullanılabilirliğini incelemek veya çalışma alanı hook'larını etkinleştirmek istiyorsunuz
summary: '`openclaw hooks` için CLI referansı (ajan kancaları)'
title: Kancalar
x-i18n:
    generated_at: "2026-05-05T08:25:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8e860d4a20a09526e804fa1aff8c983a75396fcd1e6e24f742252fdf1812f6b7
    source_path: cli/hooks.md
    workflow: 16
---

# `openclaw hooks`

Ajan kancalarını yönetin (`/new`, `/reset` ve Gateway başlatma gibi komutlar için olay güdümlü otomasyonlar).

Alt komut olmadan `openclaw hooks` çalıştırmak, `openclaw hooks list` ile eşdeğerdir.

İlgili:

- Kancalar: [Kancalar](/tr/automation/hooks)
- Plugin kancaları: [Plugin kancaları](/tr/plugins/hooks)

## Tüm kancaları listele

```bash
openclaw hooks list
```

Çalışma alanı, yönetilen, ek ve birlikte gelen dizinlerden keşfedilen tüm kancaları listeleyin.
Gateway başlatma, en az bir dahili kanca yapılandırılana kadar dahili kanca işleyicilerini yüklemez.

**Seçenekler:**

- `--eligible`: Yalnızca uygun kancaları göster (gereksinimler karşılandı)
- `--json`: JSON olarak çıktı ver
- `-v, --verbose`: Eksik gereksinimler dahil ayrıntılı bilgileri göster

**Örnek çıktı:**

```
Hooks (4/4 ready)

Ready:
  🚀 boot-md ✓ - Run BOOT.md on gateway startup
  📎 bootstrap-extra-files ✓ - Inject extra workspace bootstrap files during agent bootstrap
  📝 command-logger ✓ - Log all command events to a centralized audit file
  💾 session-memory ✓ - Save session context to memory when /new or /reset command is issued
```

**Örnek (ayrıntılı):**

```bash
openclaw hooks list --verbose
```

Uygun olmayan kancalar için eksik gereksinimleri gösterir.

**Örnek (JSON):**

```bash
openclaw hooks list --json
```

Programatik kullanım için yapılandırılmış JSON döndürür.

## Kanca bilgilerini al

```bash
openclaw hooks info <name>
```

Belirli bir kanca hakkında ayrıntılı bilgi gösterin.

**Argümanlar:**

- `<name>`: Kanca adı veya kanca anahtarı (ör. `session-memory`)

**Seçenekler:**

- `--json`: JSON olarak çıktı ver

**Örnek:**

```bash
openclaw hooks info session-memory
```

**Çıktı:**

```
💾 session-memory ✓ Ready

Save session context to memory when /new or /reset command is issued

Details:
  Source: openclaw-bundled
  Path: /path/to/openclaw/hooks/bundled/session-memory/HOOK.md
  Handler: /path/to/openclaw/hooks/bundled/session-memory/handler.ts
  Homepage: https://docs.openclaw.ai/automation/hooks#session-memory
  Events: command:new, command:reset

Requirements:
  Config: ✓ workspace.dir
```

## Kanca uygunluğunu denetle

```bash
openclaw hooks check
```

Kanca uygunluk durumunun özetini gösterin (kaçının hazır, kaçının hazır olmadığı).

**Seçenekler:**

- `--json`: JSON olarak çıktı ver

**Örnek çıktı:**

```
Hooks Status

Total hooks: 4
Ready: 4
Not ready: 0
```

## Bir kancayı etkinleştir

```bash
openclaw hooks enable <name>
```

Belirli bir kancayı config dosyanıza ekleyerek etkinleştirin (varsayılan olarak `~/.openclaw/openclaw.json`).

**Not:** Çalışma alanı kancaları, burada veya config içinde etkinleştirilene kadar varsayılan olarak devre dışıdır. Plugin'ler tarafından yönetilen kancalar `openclaw hooks list` içinde `plugin:<id>` gösterir ve burada etkinleştirilemez/devre dışı bırakılamaz. Bunun yerine Plugin'i etkinleştirin/devre dışı bırakın.

**Argümanlar:**

- `<name>`: Kanca adı (ör. `session-memory`)

**Örnek:**

```bash
openclaw hooks enable session-memory
```

**Çıktı:**

```
✓ Enabled hook: 💾 session-memory
```

**Ne yapar:**

- Kancanın var olup olmadığını ve uygun olup olmadığını denetler
- Config dosyanızda `hooks.internal.entries.<name>.enabled = true` değerini günceller
- Config dosyasını diske kaydeder

Kanca `<workspace>/hooks/` kaynağından geldiyse, Gateway bunu yüklemeden önce
bu katılım adımı gereklidir.

**Etkinleştirdikten sonra:**

- Kancaların yeniden yüklenmesi için Gateway'i yeniden başlatın (macOS'ta menü çubuğu uygulamasını yeniden başlatın veya geliştirme ortamında Gateway sürecinizi yeniden başlatın).

## Bir kancayı devre dışı bırak

```bash
openclaw hooks disable <name>
```

Config dosyanızı güncelleyerek belirli bir kancayı devre dışı bırakın.

**Argümanlar:**

- `<name>`: Kanca adı (ör. `command-logger`)

**Örnek:**

```bash
openclaw hooks disable command-logger
```

**Çıktı:**

```
⏸ Disabled hook: 📝 command-logger
```

**Devre dışı bıraktıktan sonra:**

- Kancaların yeniden yüklenmesi için Gateway'i yeniden başlatın

## Notlar

- `openclaw hooks list --json`, `info --json` ve `check --json`, yapılandırılmış JSON'u doğrudan stdout'a yazar.
- Plugin tarafından yönetilen kancalar burada etkinleştirilemez veya devre dışı bırakılamaz; bunun yerine sahibi olan Plugin'i etkinleştirin veya devre dışı bırakın.

## Kanca paketlerini yükle

```bash
openclaw plugins install <package>        # npm by default
openclaw plugins install npm:<package>    # npm only
openclaw plugins install <package> --pin  # pin version
openclaw plugins install <path>           # local path
```

Birleşik plugins yükleyicisi üzerinden kanca paketleri yükleyin.

`openclaw hooks install` uyumluluk takma adı olarak çalışmaya devam eder, ancak bir
kullanımdan kaldırma uyarısı yazdırır ve `openclaw plugins install` komutuna iletir.

Npm belirtimleri **yalnızca registry** içindir (paket adı + isteğe bağlı **tam sürüm** veya
**dist-tag**). Git/URL/dosya belirtimleri ve semver aralıkları reddedilir. Bağımlılık
yüklemeleri, kabuğunuzda global npm yükleme ayarları olsa bile güvenlik için `--ignore-scripts` ile proje yerelinde çalışır.

Yalın belirtimler ve `@latest` kararlı kanalda kalır. npm bunlardan birini
ön sürüme çözümlerse OpenClaw durur ve `@beta`/`@rc` gibi bir ön sürüm etiketi
veya tam bir ön sürümle açıkça katılmanızı ister.

**Ne yapar:**

- Kanca paketini `~/.openclaw/hooks/<id>` içine kopyalar
- Yüklenen kancaları `hooks.internal.entries.*` içinde etkinleştirir
- Yüklemeyi `hooks.internal.installs` altında kaydeder

**Seçenekler:**

- `-l, --link`: Kopyalamak yerine yerel bir dizini bağla (`hooks.internal.load.extraDirs` içine ekler)
- `--pin`: npm yüklemelerini `hooks.internal.installs` içinde tam çözümlenmiş `name@version` olarak kaydet

**Desteklenen arşivler:** `.zip`, `.tgz`, `.tar.gz`, `.tar`

**Örnekler:**

```bash
# Local directory
openclaw plugins install ./my-hook-pack

# Local archive
openclaw plugins install ./my-hook-pack.zip

# NPM package
openclaw plugins install @openclaw/my-hook-pack

# Link a local directory without copying
openclaw plugins install -l ./my-hook-pack
```

Bağlı kanca paketleri, çalışma alanı kancaları olarak değil, operatör tarafından yapılandırılmış
bir dizinden gelen yönetilen kancalar olarak ele alınır.

## Kanca paketlerini güncelle

```bash
openclaw plugins update <id>
openclaw plugins update --all
```

İzlenen npm tabanlı kanca paketlerini birleşik plugins güncelleyicisi üzerinden güncelleyin.

`openclaw hooks update` uyumluluk takma adı olarak çalışmaya devam eder, ancak bir
kullanımdan kaldırma uyarısı yazdırır ve `openclaw plugins update` komutuna iletir.

**Seçenekler:**

- `--all`: İzlenen tüm kanca paketlerini güncelle
- `--dry-run`: Yazmadan neyin değişeceğini göster

Saklanan bir bütünlük hash'i varsa ve getirilen artifact hash'i değişirse,
OpenClaw bir uyarı yazdırır ve devam etmeden önce onay ister. CI/etkileşimsiz çalıştırmalarda istemleri atlamak için
global `--yes` kullanın.

## Birlikte gelen kancalar

### session-memory

`/new` veya `/reset` verdiğinizde oturum bağlamını belleğe kaydeder.

**Etkinleştir:**

```bash
openclaw hooks enable session-memory
```

**Çıktı:** Varsayılan olarak `~/.openclaw/workspace/memory/YYYY-MM-DD-HHMM.md`. Model tarafından oluşturulan dosya adı slug'ları için `hooks.internal.entries.session-memory.llmSlug: true` ayarlayın.

**Bkz.:** [session-memory belgeleri](/tr/automation/hooks#session-memory)

### bootstrap-extra-files

`agent:bootstrap` sırasında ek bootstrap dosyaları (örneğin monorepo-yerel `AGENTS.md` / `TOOLS.md`) enjekte eder.

**Etkinleştir:**

```bash
openclaw hooks enable bootstrap-extra-files
```

**Bkz.:** [bootstrap-extra-files belgeleri](/tr/automation/hooks#bootstrap-extra-files)

### command-logger

Tüm komut olaylarını merkezi bir denetim dosyasına kaydeder.

**Etkinleştir:**

```bash
openclaw hooks enable command-logger
```

**Çıktı:** `~/.openclaw/logs/commands.log`

**Günlükleri görüntüle:**

```bash
# Recent commands
tail -n 20 ~/.openclaw/logs/commands.log

# Pretty-print
cat ~/.openclaw/logs/commands.log | jq .

# Filter by action
grep '"action":"new"' ~/.openclaw/logs/commands.log | jq .
```

**Bkz.:** [command-logger belgeleri](/tr/automation/hooks#command-logger)

### boot-md

Gateway başladığında (`channels` başladıktan sonra) `BOOT.md` çalıştırır.

**Olaylar**: `gateway:startup`

**Etkinleştir**:

```bash
openclaw hooks enable boot-md
```

**Bkz.:** [boot-md belgeleri](/tr/automation/hooks#boot-md)

## İlgili

- [CLI başvurusu](/tr/cli)
- [Otomasyon kancaları](/tr/automation/hooks)
