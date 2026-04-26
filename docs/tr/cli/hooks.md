---
read_when:
    - Ajan kancalarını yönetmek istiyorsunuz
    - Kanca kullanılabilirliğini incelemek veya çalışma alanı kancalarını etkinleştirmek istiyorsunuz
summary: '`openclaw hooks` için CLI başvurusu (ajan kancaları)'
title: Kancalar
x-i18n:
    generated_at: "2026-04-26T11:26:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: 874c3c7e7b603066209857e8b8b39bbe23eb8d1eda148025c74907c05bacd8f2
    source_path: cli/hooks.md
    workflow: 15
---

# `openclaw hooks`

Ajan kancalarını yönetin (`/new`, `/reset` ve gateway başlangıcı gibi komutlar için olay güdümlü otomasyonlar).

Alt komut olmadan `openclaw hooks` çalıştırmak, `openclaw hooks list` ile aynıdır.

İlgili:

- Kancalar: [Kancalar](/tr/automation/hooks)
- Plugin kancaları: [Plugin kancaları](/tr/plugins/hooks)

## Tüm Kancaları Listele

```bash
openclaw hooks list
```

Çalışma alanı, yönetilen, ek ve birlikte gelen dizinlerden keşfedilen tüm kancaları listeler.
Gateway başlangıcı, en az bir dahili kanca yapılandırılana kadar dahili kanca işleyicilerini yüklemez.

**Seçenekler:**

- `--eligible`: Yalnızca uygun kancaları gösterir (gereksinimler karşılanmış)
- `--json`: JSON olarak çıktı verir
- `-v, --verbose`: Eksik gereksinimler dahil ayrıntılı bilgi gösterir

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

## Kanca Bilgisi Al

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
💾 session-memory ✓ Hazır

/new veya /reset komutu verildiğinde oturum bağlamını belleğe kaydeder

Ayrıntılar:
  Kaynak: openclaw-bundled
  Yol: /path/to/openclaw/hooks/bundled/session-memory/HOOK.md
  İşleyici: /path/to/openclaw/hooks/bundled/session-memory/handler.ts
  Ana sayfa: https://docs.openclaw.ai/automation/hooks#session-memory
  Olaylar: command:new, command:reset

Gereksinimler:
  Yapılandırma: ✓ workspace.dir
```

## Kanca Uygunluğunu Kontrol Et

```bash
openclaw hooks check
```

Kanca uygunluk durumunun özetini gösterir (kaçının hazır olduğu ve kaçının hazır olmadığı).

**Seçenekler:**

- `--json`: JSON olarak çıktı verir

**Örnek çıktı:**

```
Hooks Status

Total hooks: 4
Ready: 4
Not ready: 0
```

## Bir Kancayı Etkinleştir

```bash
openclaw hooks enable <name>
```

Belirli bir kancayı yapılandırmanıza ekleyerek etkinleştirir (varsayılan olarak `~/.openclaw/openclaw.json`).

**Not:** Çalışma alanı kancaları, burada veya yapılandırmada etkinleştirilene kadar varsayılan olarak devre dışıdır. Plugin'ler tarafından yönetilen kancalar `openclaw hooks list` içinde `plugin:<id>` olarak görünür ve burada etkinleştirilemez/devre dışı bırakılamaz. Bunun yerine Plugin'i etkinleştirin/devre dışı bırakın.

**Argümanlar:**

- `<name>`: Kanca adı (ör. `session-memory`)

**Örnek:**

```bash
openclaw hooks enable session-memory
```

**Çıktı:**

```
✓ Etkinleştirilen kanca: 💾 session-memory
```

**Yaptıkları:**

- Kancanın var olup olmadığını ve uygun olup olmadığını kontrol eder
- Yapılandırmanızda `hooks.internal.entries.<name>.enabled = true` değerini günceller
- Yapılandırmayı diske kaydeder

Kanca `<workspace>/hooks/` dizininden geldiyse, Gateway'in onu yüklemesi için
bu açık katılım adımı gereklidir.

**Etkinleştirdikten sonra:**

- Kancaların yeniden yüklenmesi için gateway'i yeniden başlatın (macOS'ta menü çubuğu uygulamasını yeniden başlatın veya geliştirmede gateway sürecinizi yeniden başlatın).

## Bir Kancayı Devre Dışı Bırak

```bash
openclaw hooks disable <name>
```

Belirli bir kancayı yapılandırmanızı güncelleyerek devre dışı bırakır.

**Argümanlar:**

- `<name>`: Kanca adı (ör. `command-logger`)

**Örnek:**

```bash
openclaw hooks disable command-logger
```

**Çıktı:**

```
⏸ Devre dışı bırakılan kanca: 📝 command-logger
```

**Devre dışı bıraktıktan sonra:**

- Kancaların yeniden yüklenmesi için gateway'i yeniden başlatın

## Notlar

- `openclaw hooks list --json`, `info --json` ve `check --json`, yapılandırılmış JSON'u doğrudan stdout'a yazar.
- Plugin tarafından yönetilen kancalar burada etkinleştirilemez veya devre dışı bırakılamaz; bunun yerine sahibi olan Plugin'i etkinleştirin veya devre dışı bırakın.

## Kanca Paketlerini Kur

```bash
openclaw plugins install <package>        # Önce ClawHub, sonra npm
openclaw plugins install <package> --pin  # sürümü sabitle
openclaw plugins install <path>           # yerel yol
```

Kanca paketlerini birleşik Plugin kurucusu üzerinden kurun.

`openclaw hooks install` hâlâ bir uyumluluk takma adı olarak çalışır, ancak bir
kullanımdan kaldırma uyarısı yazdırır ve `openclaw plugins install` komutuna yönlendirir.

Npm belirtimleri **yalnızca kayıt defteri** içindir (paket adı + isteğe bağlı **tam sürüm** veya
**dist-tag**). Git/URL/dosya belirtimleri ve semver aralıkları reddedilir. Bağımlılık
kurulumları, kabuğunuzda genel npm kurulum ayarları olsa bile güvenlik için proje yerelinde `--ignore-scripts` ile çalışır.

Çıplak belirtimler ve `@latest`, kararlı iz üzerinde kalır. Npm bunlardan
birini ön sürüme çözümlerse, OpenClaw durur ve sizden `@beta`/`@rc` gibi bir
ön sürüm etiketi veya tam bir ön sürüm numarasıyla açıkça izin vermenizi ister.

**Yaptıkları:**

- Kanca paketini `~/.openclaw/hooks/<id>` içine kopyalar
- Kurulu kancaları `hooks.internal.entries.*` içinde etkinleştirir
- Kurulumu `hooks.internal.installs` altında kaydeder

**Seçenekler:**

- `-l, --link`: Yerel dizini kopyalamak yerine bağlar (`hooks.internal.load.extraDirs` içine ekler)
- `--pin`: npm kurulumlarını `hooks.internal.installs` içinde tam çözümlenmiş `name@version` olarak kaydeder

**Desteklenen arşivler:** `.zip`, `.tgz`, `.tar.gz`, `.tar`

**Örnekler:**

```bash
# Yerel dizin
openclaw plugins install ./my-hook-pack

# Yerel arşiv
openclaw plugins install ./my-hook-pack.zip

# NPM paketi
openclaw plugins install @openclaw/my-hook-pack

# Yerel dizini kopyalamadan bağla
openclaw plugins install -l ./my-hook-pack
```

Bağlı kanca paketleri, çalışma alanı kancaları olarak değil, operatör yapılandırmalı
bir dizinden gelen yönetilen kancalar olarak değerlendirilir.

## Kanca Paketlerini Güncelle

```bash
openclaw plugins update <id>
openclaw plugins update --all
```

İzlenen npm tabanlı kanca paketlerini birleşik Plugin güncelleyicisi üzerinden güncelleyin.

`openclaw hooks update` hâlâ bir uyumluluk takma adı olarak çalışır, ancak bir
kullanımdan kaldırma uyarısı yazdırır ve `openclaw plugins update` komutuna yönlendirir.

**Seçenekler:**

- `--all`: İzlenen tüm kanca paketlerini güncelle
- `--dry-run`: Yazmadan neyin değişeceğini göster

Kayıtlı bir bütünlük karması mevcutsa ve getirilen yapıt karması değişmişse,
OpenClaw devam etmeden önce bir uyarı yazdırır ve onay ister. CI/etkileşimsiz çalıştırmalarda istemleri atlamak için genel `--yes` kullanın.

## Birlikte Gelen Kancalar

### session-memory

`/new` veya `/reset` verdiğinizde oturum bağlamını belleğe kaydeder.

**Etkinleştir:**

```bash
openclaw hooks enable session-memory
```

**Çıktı:** `~/.openclaw/workspace/memory/YYYY-MM-DD-slug.md`

**Bkz.:** [session-memory belgeleri](/tr/automation/hooks#session-memory)

### bootstrap-extra-files

`agent:bootstrap` sırasında ek bootstrap dosyalarını (örneğin monorepo-yerel `AGENTS.md` / `TOOLS.md`) enjekte eder.

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

# Güzel biçimlendirme
cat ~/.openclaw/logs/commands.log | jq .

# Eyleme göre filtrele
grep '"action":"new"' ~/.openclaw/logs/commands.log | jq .
```

**Bkz.:** [command-logger belgeleri](/tr/automation/hooks#command-logger)

### boot-md

Gateway başladığında `BOOT.md` dosyasını çalıştırır (kanallar başladıktan sonra).

**Olaylar**: `gateway:startup`

**Etkinleştir**:

```bash
openclaw hooks enable boot-md
```

**Bkz.:** [boot-md belgeleri](/tr/automation/hooks#boot-md)

## İlgili

- [CLI başvurusu](/tr/cli)
- [Otomasyon kancaları](/tr/automation/hooks)
