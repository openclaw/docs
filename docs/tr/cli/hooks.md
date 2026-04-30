---
read_when:
    - Ajan kancalarını yönetmek istiyorsunuz
    - Kanca kullanılabilirliğini incelemek veya çalışma alanı kancalarını etkinleştirmek istiyorsunuz
summary: '`openclaw hooks` (ajan kancaları) için CLI referansı'
title: Kancalar
x-i18n:
    generated_at: "2026-04-30T09:12:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: 63ab6b014923dd4776767a6a0333129b85f51d008c63bb9fbdff06228d4c2f4b
    source_path: cli/hooks.md
    workflow: 16
---

# `openclaw hooks`

Ajan hook'larını yönetin (`/new`, `/reset` ve Gateway başlatma gibi komutlar için olay güdümlü otomasyonlar).

Alt komut olmadan `openclaw hooks` çalıştırmak, `openclaw hooks list` ile eşdeğerdir.

İlgili:

- Hook'lar: [Hook'lar](/tr/automation/hooks)
- Plugin hook'ları: [Plugin hook'ları](/tr/plugins/hooks)

## Tüm hook'ları listeleme

```bash
openclaw hooks list
```

Çalışma alanı, yönetilen, ek ve paketle gelen dizinlerden bulunan tüm hook'ları listeleyin.
Gateway başlatma, en az bir dahili hook yapılandırılana kadar dahili hook işleyicilerini yüklemez.

**Seçenekler:**

- `--eligible`: Yalnızca uygun hook'ları göster (gereksinimler karşılandı)
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

Uygun olmayan hook'lar için eksik gereksinimleri gösterir.

**Örnek (JSON):**

```bash
openclaw hooks list --json
```

Programatik kullanım için yapılandırılmış JSON döndürür.

## Hook bilgilerini alma

```bash
openclaw hooks info <name>
```

Belirli bir hook hakkında ayrıntılı bilgi gösterin.

**Argümanlar:**

- `<name>`: Hook adı veya hook anahtarı (ör. `session-memory`)

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

## Hook uygunluğunu denetleme

```bash
openclaw hooks check
```

Hook uygunluk durumunun özetini gösterin (kaçının hazır, kaçının hazır olmadığı).

**Seçenekler:**

- `--json`: JSON olarak çıktı ver

**Örnek çıktı:**

```
Hooks Status

Total hooks: 4
Ready: 4
Not ready: 0
```

## Bir Hook'u etkinleştirme

```bash
openclaw hooks enable <name>
```

Yapılandırmanıza (`~/.openclaw/openclaw.json` varsayılan olarak) ekleyerek belirli bir hook'u etkinleştirin.

**Not:** Çalışma alanı hook'ları, burada veya yapılandırmada etkinleştirilene kadar varsayılan olarak devre dışıdır. Plugin'ler tarafından yönetilen hook'lar `openclaw hooks list` içinde `plugin:<id>` gösterir ve burada etkinleştirilemez/devre dışı bırakılamaz. Bunun yerine Plugin'i etkinleştirin/devre dışı bırakın.

**Argümanlar:**

- `<name>`: Hook adı (ör. `session-memory`)

**Örnek:**

```bash
openclaw hooks enable session-memory
```

**Çıktı:**

```
✓ Enabled hook: 💾 session-memory
```

**Ne yapar:**

- Hook'un var olup olmadığını ve uygun olup olmadığını denetler
- Yapılandırmanızda `hooks.internal.entries.<name>.enabled = true` değerini günceller
- Yapılandırmayı diske kaydeder

Hook `<workspace>/hooks/` içinden geldiyse, Gateway'in bunu yüklemesinden önce
bu açık katılım adımı gerekir.

**Etkinleştirdikten sonra:**

- Hook'ların yeniden yüklenmesi için Gateway'i yeniden başlatın (macOS'te menü çubuğu uygulamasını yeniden başlatın veya geliştirmede Gateway sürecinizi yeniden başlatın).

## Bir Hook'u devre dışı bırakma

```bash
openclaw hooks disable <name>
```

Yapılandırmanızı güncelleyerek belirli bir hook'u devre dışı bırakın.

**Argümanlar:**

- `<name>`: Hook adı (ör. `command-logger`)

**Örnek:**

```bash
openclaw hooks disable command-logger
```

**Çıktı:**

```
⏸ Disabled hook: 📝 command-logger
```

**Devre dışı bıraktıktan sonra:**

- Hook'ların yeniden yüklenmesi için Gateway'i yeniden başlatın

## Notlar

- `openclaw hooks list --json`, `info --json` ve `check --json`, yapılandırılmış JSON'u doğrudan stdout'a yazar.
- Plugin tarafından yönetilen hook'lar burada etkinleştirilemez veya devre dışı bırakılamaz; bunun yerine sahip olan Plugin'i etkinleştirin veya devre dışı bırakın.

## Hook paketlerini yükleme

```bash
openclaw plugins install <package>        # Önce ClawHub, sonra npm
openclaw plugins install npm:<package>    # Yalnızca npm
openclaw plugins install <package> --pin  # sürümü sabitle
openclaw plugins install <path>           # yerel yol
```

Birleşik Plugin yükleyicisi üzerinden hook paketlerini yükleyin.

`openclaw hooks install` uyumluluk takma adı olarak hâlâ çalışır, ancak bir
kullanımdan kaldırma uyarısı yazdırır ve `openclaw plugins install` komutuna yönlendirir.

Npm belirtimleri **yalnızca registry** içindir (paket adı + isteğe bağlı **tam sürüm** veya
**dist-tag**). Git/URL/dosya belirtimleri ve semver aralıkları reddedilir. Bağımlılık
yüklemeleri, kabuğunuzda global npm yükleme ayarları olsa bile güvenlik için
`--ignore-scripts` ile proje yerelinde çalışır.

Yalın belirtimler ve `@latest` kararlı hatta kalır. npm bunlardan herhangi birini
ön sürüme çözerse OpenClaw durur ve `@beta`/`@rc` gibi bir ön sürüm etiketiyle
veya tam bir ön sürümle açıkça katılmanızı ister.

**Ne yapar:**

- Hook paketini `~/.openclaw/hooks/<id>` içine kopyalar
- Yüklenen hook'ları `hooks.internal.entries.*` içinde etkinleştirir
- Yüklemeyi `hooks.internal.installs` altında kaydeder

**Seçenekler:**

- `-l, --link`: Kopyalamak yerine yerel bir dizine bağlantı ver (`hooks.internal.load.extraDirs` içine ekler)
- `--pin`: npm yüklemelerini `hooks.internal.installs` içinde tam çözümlenmiş `name@version` olarak kaydet

**Desteklenen arşivler:** `.zip`, `.tgz`, `.tar.gz`, `.tar`

**Örnekler:**

```bash
# Yerel dizin
openclaw plugins install ./my-hook-pack

# Yerel arşiv
openclaw plugins install ./my-hook-pack.zip

# NPM paketi
openclaw plugins install @openclaw/my-hook-pack

# Kopyalamadan yerel dizine bağlantı ver
openclaw plugins install -l ./my-hook-pack
```

Bağlantılı hook paketleri, çalışma alanı hook'ları olarak değil, operatör tarafından yapılandırılmış
bir dizinden gelen yönetilen hook'lar olarak ele alınır.

## Hook paketlerini güncelleme

```bash
openclaw plugins update <id>
openclaw plugins update --all
```

İzlenen npm tabanlı hook paketlerini birleşik Plugin güncelleyicisi üzerinden güncelleyin.

`openclaw hooks update` uyumluluk takma adı olarak hâlâ çalışır, ancak bir
kullanımdan kaldırma uyarısı yazdırır ve `openclaw plugins update` komutuna yönlendirir.

**Seçenekler:**

- `--all`: İzlenen tüm hook paketlerini güncelle
- `--dry-run`: Yazmadan neyin değişeceğini göster

Depolanan bir bütünlük karması varsa ve getirilen yapıtın karması değişirse,
OpenClaw bir uyarı yazdırır ve devam etmeden önce onay ister. CI/etkileşimsiz çalıştırmalarda istemleri atlamak için
global `--yes` kullanın.

## Paketle gelen hook'lar

### session-memory

`/new` veya `/reset` verdiğinizde oturum bağlamını belleğe kaydeder.

**Etkinleştir:**

```bash
openclaw hooks enable session-memory
```

**Çıktı:** `~/.openclaw/workspace/memory/YYYY-MM-DD-slug.md`

**Bkz.:** [session-memory belgeleri](/tr/automation/hooks#session-memory)

### bootstrap-extra-files

`agent:bootstrap` sırasında ek bootstrap dosyaları (örneğin monorepo yerelindeki `AGENTS.md` / `TOOLS.md`) enjekte eder.

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
# Son komutlar
tail -n 20 ~/.openclaw/logs/commands.log

# Güzel yazdır
cat ~/.openclaw/logs/commands.log | jq .

# Eyleme göre filtrele
grep '"action":"new"' ~/.openclaw/logs/commands.log | jq .
```

**Bkz.:** [command-logger belgeleri](/tr/automation/hooks#command-logger)

### boot-md

Gateway başladığında (kanallar başladıktan sonra) `BOOT.md` çalıştırır.

**Olaylar**: `gateway:startup`

**Etkinleştir**:

```bash
openclaw hooks enable boot-md
```

**Bkz.:** [boot-md belgeleri](/tr/automation/hooks#boot-md)

## İlgili

- [CLI başvurusu](/tr/cli)
- [Otomasyon hook'ları](/tr/automation/hooks)
