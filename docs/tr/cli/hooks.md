---
read_when:
    - Ajan kancalarını yönetmek istiyorsunuz
    - Kanca kullanılabilirliğini incelemek veya çalışma alanı kancalarını etkinleştirmek istiyorsunuz
summary: '`openclaw hooks` için CLI referansı (ajan kancaları)'
title: Kancalar
x-i18n:
    generated_at: "2026-05-06T17:53:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: 56dd1ef82458dde3280e2cdfb4f3835211726517416e90625d3272d128eb9e0e
    source_path: cli/hooks.md
    workflow: 16
    postprocess_version: locale-links-v1
---

# `openclaw hooks`

Ajan kancalarını yönetin (`/new`, `/reset` ve Gateway başlangıcı gibi komutlar için olay güdümlü otomasyonlar).

`openclaw hooks` komutunu alt komut olmadan çalıştırmak, `openclaw hooks list` ile eşdeğerdir.

İlgili:

- Kancalar: [Kancalar](/tr/automation/hooks)
- Plugin kancaları: [Plugin kancaları](/tr/plugins/hooks)

## Tüm kancaları listeleme

```bash
openclaw hooks list
```

Çalışma alanı, yönetilen, ek ve paketle gelen dizinlerden keşfedilen tüm kancaları listeler.
Gateway başlangıcı, en az bir dahili kanca yapılandırılana kadar dahili kanca işleyicilerini yüklemez.

**Seçenekler:**

- `--eligible`: Yalnızca uygun kancaları gösterir (gereksinimler karşılanmış)
- `--json`: JSON olarak çıktı verir
- `-v, --verbose`: Eksik gereksinimler dahil ayrıntılı bilgileri gösterir

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

Programlı kullanım için yapılandırılmış JSON döndürür.

## Kanca bilgilerini alma

```bash
openclaw hooks info <name>
```

Belirli bir kanca hakkında ayrıntılı bilgi gösterir.

**Argümanlar:**

- `<name>`: Kanca adı veya kanca anahtarı (ör. `session-memory`)

**Seçenekler:**

- `--json`: JSON olarak çıktı verir

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

## Kancaların uygunluğunu denetleme

```bash
openclaw hooks check
```

Kanca uygunluk durumunun özetini gösterir (kaç tanesi hazır, kaç tanesi hazır değil).

**Seçenekler:**

- `--json`: JSON olarak çıktı verir

**Örnek çıktı:**

```
Hooks Status

Total hooks: 4
Ready: 4
Not ready: 0
```

## Bir kancayı etkinleştirme

```bash
openclaw hooks enable <name>
```

Yapılandırmanıza ekleyerek belirli bir kancayı etkinleştirir (varsayılan olarak `~/.openclaw/openclaw.json`).

**Not:** Çalışma alanı kancaları, burada veya yapılandırmada etkinleştirilene kadar varsayılan olarak devre dışıdır. Plugin tarafından yönetilen kancalar `openclaw hooks list` içinde `plugin:<id>` gösterir ve buradan etkinleştirilemez/devre dışı bırakılamaz. Bunun yerine Plugin'i etkinleştirin/devre dışı bırakın.

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
- Yapılandırmanızda `hooks.internal.entries.<name>.enabled = true` değerini günceller
- Yapılandırmayı diske kaydeder

Kanca `<workspace>/hooks/` içinden geldiyse, Gateway'in bunu yüklemesinden önce
bu katılım adımı gerekir.

**Etkinleştirdikten sonra:**

- Kancaların yeniden yüklenmesi için gateway'i yeniden başlatın (macOS'ta menü çubuğu uygulamasını yeniden başlatın veya geliştirmede gateway sürecinizi yeniden başlatın).

## Bir kancayı devre dışı bırakma

```bash
openclaw hooks disable <name>
```

Yapılandırmanızı güncelleyerek belirli bir kancayı devre dışı bırakır.

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

- Kancaların yeniden yüklenmesi için gateway'i yeniden başlatın

## Notlar

- `openclaw hooks list --json`, `info --json` ve `check --json`, yapılandırılmış JSON'u doğrudan stdout'a yazar.
- Plugin tarafından yönetilen kancalar burada etkinleştirilemez veya devre dışı bırakılamaz; bunun yerine sahibi olan Plugin'i etkinleştirin veya devre dışı bırakın.

## Kanca paketlerini yükleme

```bash
openclaw plugins install <package>        # npm by default
openclaw plugins install npm:<package>    # npm only
openclaw plugins install <package> --pin  # pin version
openclaw plugins install <path>           # local path
```

Kanca paketlerini birleşik plugins yükleyicisi üzerinden yükleyin.

`openclaw hooks install` uyumluluk takma adı olarak çalışmaya devam eder, ancak bir
kullanımdan kaldırma uyarısı yazdırır ve `openclaw plugins install` komutuna yönlendirir.

Npm tanımları **yalnızca registry** kapsamındadır (paket adı + isteğe bağlı **tam sürüm** veya
**dist-tag**). Git/URL/file tanımları ve semver aralıkları reddedilir. Bağımlılık
yüklemeleri, kabuğunuzda global npm yükleme ayarları olsa bile güvenlik için
`--ignore-scripts` ile proje yerelinde çalışır.

Çıplak tanımlar ve `@latest` kararlı kanalda kalır. npm bunlardan herhangi birini
ön sürüme çözümlerse OpenClaw durur ve `@beta`/`@rc` gibi bir ön sürüm etiketiyle
veya tam bir ön sürüm numarasıyla açıkça katılmanızı ister.

**Ne yapar:**

- Kanca paketini `~/.openclaw/hooks/<id>` içine kopyalar
- Yüklü kancaları `hooks.internal.entries.*` içinde etkinleştirir
- Yüklemeyi `hooks.internal.installs` altında kaydeder

**Seçenekler:**

- `-l, --link`: Yerel bir dizini kopyalamak yerine bağlar (`hooks.internal.load.extraDirs` içine ekler)
- `--pin`: npm yüklemelerini `hooks.internal.installs` içinde tam çözümlenmiş `name@version` olarak kaydeder

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

Bağlanan kanca paketleri, çalışma alanı kancaları olarak değil, operatör tarafından yapılandırılmış
bir dizinden gelen yönetilen kancalar olarak değerlendirilir.

## Kanca paketlerini güncelleme

```bash
openclaw plugins update <id>
openclaw plugins update --all
```

İzlenen npm tabanlı kanca paketlerini birleşik plugins güncelleyicisi üzerinden güncelleyin.

`openclaw hooks update` uyumluluk takma adı olarak çalışmaya devam eder, ancak bir
kullanımdan kaldırma uyarısı yazdırır ve `openclaw plugins update` komutuna yönlendirir.

**Seçenekler:**

- `--all`: İzlenen tüm kanca paketlerini günceller
- `--dry-run`: Yazmadan neyin değişeceğini gösterir

Saklanan bir bütünlük hash'i varsa ve getirilen yapıt hash'i değişirse,
OpenClaw bir uyarı yazdırır ve devam etmeden önce onay ister. CI/etkileşimsiz çalıştırmalarda istemleri atlamak için
global `--yes` kullanın.

## Paketle gelen kancalar

### session-memory

`/new` veya `/reset` verdiğinizde oturum bağlamını belleğe kaydeder.

**Etkinleştir:**

```bash
openclaw hooks enable session-memory
```

**Çıktı:** Varsayılan olarak `~/.openclaw/workspace/memory/YYYY-MM-DD-HHMM.md`. Model tarafından oluşturulan dosya adı slug'ları için `hooks.internal.entries.session-memory.llmSlug: true` ayarlayın.

**Ayrıca bakın:** [session-memory belgeleri](/tr/automation/hooks#session-memory)

### bootstrap-extra-files

`agent:bootstrap` sırasında ek bootstrap dosyaları (örneğin monorepo yerelinde `AGENTS.md` / `TOOLS.md`) enjekte eder.

**Etkinleştir:**

```bash
openclaw hooks enable bootstrap-extra-files
```

**Ayrıca bakın:** [bootstrap-extra-files belgeleri](/tr/automation/hooks#bootstrap-extra-files)

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

**Ayrıca bakın:** [command-logger belgeleri](/tr/automation/hooks#command-logger)

### boot-md

Gateway başladığında (kanallar başladıktan sonra) `BOOT.md` çalıştırır.

**Olaylar**: `gateway:startup`

**Etkinleştir**:

```bash
openclaw hooks enable boot-md
```

**Ayrıca bakın:** [boot-md belgeleri](/tr/automation/hooks#boot-md)

## İlgili

- [CLI başvurusu](/tr/cli)
- [Otomasyon kancaları](/tr/automation/hooks)
