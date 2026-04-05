---
read_when:
    - Aracı hook'larını yönetmek istiyorsunuz
    - Hook kullanılabilirliğini incelemek veya çalışma alanı hook'larını etkinleştirmek istiyorsunuz
summary: '`openclaw hooks` için CLI başvurusu (aracı hook''ları)'
title: hook'lar
x-i18n:
    generated_at: "2026-04-05T13:49:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8dc9144e9844e9c3cdef2514098eb170543746fcc55ca5a1cc746c12d80209e7
    source_path: cli/hooks.md
    workflow: 15
---

# `openclaw hooks`

Aracı hook'larını yönetin (`/new`, `/reset` ve gateway başlatma gibi komutlar için olay güdümlü otomasyonlar).

Alt komut olmadan `openclaw hooks` çalıştırmak, `openclaw hooks list` ile eşdeğerdir.

İlgili:

- Hook'lar: [Hooks](/tr/automation/hooks)
- Plugin hook'ları: [Plugin hooks](/plugins/architecture#provider-runtime-hooks)

## Tüm Hook'ları Listele

```bash
openclaw hooks list
```

Çalışma alanı, yönetilen, ek ve paketlenmiş dizinlerden keşfedilen tüm hook'ları listeler.

**Seçenekler:**

- `--eligible`: Yalnızca uygun hook'ları gösterir (gereksinimler karşılanmış)
- `--json`: Çıktıyı JSON olarak verir
- `-v, --verbose`: Eksik gereksinimler dahil ayrıntılı bilgi gösterir

**Örnek çıktı:**

```
Hook'lar (4/4 hazır)

Hazır:
  🚀 boot-md ✓ - Gateway başlatılırken BOOT.md dosyasını çalıştır
  📎 bootstrap-extra-files ✓ - Aracı bootstrap sırasında ek çalışma alanı bootstrap dosyaları ekle
  📝 command-logger ✓ - Tüm komut olaylarını merkezi bir denetim dosyasına kaydet
  💾 session-memory ✓ - /new veya /reset komutu verildiğinde oturum bağlamını belleğe kaydet
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

## Hook Bilgilerini Al

```bash
openclaw hooks info <name>
```

Belirli bir hook hakkında ayrıntılı bilgi gösterir.

**Bağımsız değişkenler:**

- `<name>`: Hook adı veya hook anahtarı (ör. `session-memory`)

**Seçenekler:**

- `--json`: Çıktıyı JSON olarak verir

**Örnek:**

```bash
openclaw hooks info session-memory
```

**Çıktı:**

```
💾 session-memory ✓ Hazır

/new veya /reset komutu verildiğinde oturum bağlamını belleğe kaydet

Ayrıntılar:
  Kaynak: openclaw-bundled
  Yol: /path/to/openclaw/hooks/bundled/session-memory/HOOK.md
  İşleyici: /path/to/openclaw/hooks/bundled/session-memory/handler.ts
  Ana sayfa: https://docs.openclaw.ai/automation/hooks#session-memory
  Olaylar: command:new, command:reset

Gereksinimler:
  Yapılandırma: ✓ workspace.dir
```

## Hook Uygunluğunu Denetle

```bash
openclaw hooks check
```

Hook uygunluk durumunun özetini gösterir (kaç tanesi hazır, kaçı hazır değil).

**Seçenekler:**

- `--json`: Çıktıyı JSON olarak verir

**Örnek çıktı:**

```
Hook Durumu

Toplam hook: 4
Hazır: 4
Hazır değil: 0
```

## Bir Hook'u Etkinleştir

```bash
openclaw hooks enable <name>
```

Belirli bir hook'u yapılandırmanıza ekleyerek etkinleştirin (varsayılan olarak `~/.openclaw/openclaw.json`).

**Not:** Çalışma alanı hook'ları, burada veya yapılandırmada etkinleştirilene kadar varsayılan olarak devre dışıdır. Plugin'ler tarafından yönetilen hook'lar `openclaw hooks list` içinde `plugin:<id>` olarak gösterilir ve burada etkinleştirilemez/devre dışı bırakılamaz. Bunun yerine plugin'i etkinleştirin/devre dışı bırakın.

**Bağımsız değişkenler:**

- `<name>`: Hook adı (ör. `session-memory`)

**Örnek:**

```bash
openclaw hooks enable session-memory
```

**Çıktı:**

```
✓ Hook etkinleştirildi: 💾 session-memory
```

**Yaptıkları:**

- Hook'un var olup olmadığını ve uygun olup olmadığını denetler
- Yapılandırmanızda `hooks.internal.entries.<name>.enabled = true` değerini günceller
- Yapılandırmayı diske kaydeder

Hook `<workspace>/hooks/` içinden geldiyse, Gateway'in onu yüklemesi için bu
isteğe bağlı katılım adımı gereklidir.

**Etkinleştirdikten sonra:**

- Hook'ların yeniden yüklenmesi için gateway'i yeniden başlatın (macOS'ta menü çubuğu uygulamasını yeniden başlatın veya geliştirme ortamında gateway işleminizi yeniden başlatın).

## Bir Hook'u Devre Dışı Bırak

```bash
openclaw hooks disable <name>
```

Belirli bir hook'u yapılandırmanızı güncelleyerek devre dışı bırakın.

**Bağımsız değişkenler:**

- `<name>`: Hook adı (ör. `command-logger`)

**Örnek:**

```bash
openclaw hooks disable command-logger
```

**Çıktı:**

```
⏸ Hook devre dışı bırakıldı: 📝 command-logger
```

**Devre dışı bıraktıktan sonra:**

- Hook'ların yeniden yüklenmesi için gateway'i yeniden başlatın

## Notlar

- `openclaw hooks list --json`, `info --json` ve `check --json`, yapılandırılmış JSON'u doğrudan stdout'a yazar.
- Plugin tarafından yönetilen hook'lar burada etkinleştirilemez veya devre dışı bırakılamaz; bunun yerine sahibi olan plugin'i etkinleştirin veya devre dışı bırakın.

## Hook Paketlerini Yükle

```bash
openclaw plugins install <package>        # Önce ClawHub, sonra npm
openclaw plugins install <package> --pin  # sürümü sabitle
openclaw plugins install <path>           # yerel yol
```

Hook paketlerini birleşik plugin yükleyicisi üzerinden yükleyin.

`openclaw hooks install` hâlâ bir uyumluluk takma adı olarak çalışır, ancak bir
kullanımdan kaldırma uyarısı yazdırır ve `openclaw plugins install` komutuna yönlendirir.

Npm belirtimleri **yalnızca registry içindir** (paket adı + isteğe bağlı **tam sürüm** veya
**dist-tag**). Git/URL/dosya belirtimleri ve semver aralıkları reddedilir. Bağımlılık
yüklemeleri güvenlik için `--ignore-scripts` ile çalıştırılır.

Boş belirtimler ve `@latest`, kararlı iz üzerinde kalır. npm bunlardan
birini ön sürüme çözerse, OpenClaw durur ve sizden `@beta`/`@rc` gibi bir
ön sürüm etiketi veya tam bir ön sürüm numarasıyla açıkça katılmanızı ister.

**Yaptıkları:**

- Hook paketini `~/.openclaw/hooks/<id>` içine kopyalar
- Yüklenen hook'ları `hooks.internal.entries.*` içinde etkinleştirir
- Yüklemeyi `hooks.internal.installs` altında kaydeder

**Seçenekler:**

- `-l, --link`: Kopyalamak yerine yerel bir dizini bağlar (`hooks.internal.load.extraDirs` içine ekler)
- `--pin`: npm yüklemelerini `hooks.internal.installs` içinde çözümlenmiş tam `name@version` olarak kaydeder

**Desteklenen arşivler:** `.zip`, `.tgz`, `.tar.gz`, `.tar`

**Örnekler:**

```bash
# Yerel dizin
openclaw plugins install ./my-hook-pack

# Yerel arşiv
openclaw plugins install ./my-hook-pack.zip

# NPM paketi
openclaw plugins install @openclaw/my-hook-pack

# Kopyalamadan yerel bir dizini bağla
openclaw plugins install -l ./my-hook-pack
```

Bağlı hook paketleri, çalışma alanı hook'ları olarak değil,
operatör tarafından yapılandırılmış bir dizinden gelen yönetilen hook'lar olarak ele alınır.

## Hook Paketlerini Güncelle

```bash
openclaw plugins update <id>
openclaw plugins update --all
```

İzlenen npm tabanlı hook paketlerini birleşik plugin güncelleyicisi üzerinden güncelleyin.

`openclaw hooks update` hâlâ bir uyumluluk takma adı olarak çalışır, ancak bir
kullanımdan kaldırma uyarısı yazdırır ve `openclaw plugins update` komutuna yönlendirir.

**Seçenekler:**

- `--all`: İzlenen tüm hook paketlerini günceller
- `--dry-run`: Yazmadan neyin değişeceğini gösterir

Kayıtlı bir bütünlük karması mevcutsa ve alınan yapıt karması değişirse,
OpenClaw devam etmeden önce bir uyarı yazdırır ve onay ister. CI/etkileşimsiz çalıştırmalarda istemleri atlamak için
global `--yes` kullanın.

## Paketlenmiş Hook'lar

### session-memory

`/new` veya `/reset` verdiğinizde oturum bağlamını belleğe kaydeder.

**Etkinleştirme:**

```bash
openclaw hooks enable session-memory
```

**Çıktı:** `~/.openclaw/workspace/memory/YYYY-MM-DD-slug.md`

**Bkz.:** [session-memory belgeleri](/tr/automation/hooks#session-memory)

### bootstrap-extra-files

`agent:bootstrap` sırasında ek bootstrap dosyalarını (örneğin monorepo-yerel `AGENTS.md` / `TOOLS.md`) ekler.

**Etkinleştirme:**

```bash
openclaw hooks enable bootstrap-extra-files
```

**Bkz.:** [bootstrap-extra-files belgeleri](/tr/automation/hooks#bootstrap-extra-files)

### command-logger

Tüm komut olaylarını merkezi bir denetim dosyasına kaydeder.

**Etkinleştirme:**

```bash
openclaw hooks enable command-logger
```

**Çıktı:** `~/.openclaw/logs/commands.log`

**Günlükleri görüntüle:**

```bash
# Son komutlar
tail -n 20 ~/.openclaw/logs/commands.log

# Biçimli yazdır
cat ~/.openclaw/logs/commands.log | jq .

# İşleme göre filtrele
grep '"action":"new"' ~/.openclaw/logs/commands.log | jq .
```

**Bkz.:** [command-logger belgeleri](/tr/automation/hooks#command-logger)

### boot-md

Gateway başladığında `BOOT.md` dosyasını çalıştırır (kanallar başladıktan sonra).

**Olaylar**: `gateway:startup`

**Etkinleştirme**:

```bash
openclaw hooks enable boot-md
```

**Bkz.:** [boot-md belgeleri](/tr/automation/hooks#boot-md)
