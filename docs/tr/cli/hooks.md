---
read_when:
    - Ajan kancalarını yönetmek istiyorsunuz
    - Kanca kullanılabilirliğini incelemek veya çalışma alanı kancalarını etkinleştirmek istiyorsunuz
summary: '`openclaw hooks` için CLI başvurusu (ajan kancaları)'
title: Kancalar
x-i18n:
    generated_at: "2026-04-24T09:02:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 84f209e90a5679b889112fc03e22ea94f486ded9db25b5238c0366283695a5b9
    source_path: cli/hooks.md
    workflow: 15
---

# `openclaw hooks`

Ajan kancalarını yönetin (`/new`, `/reset` ve Gateway başlatma gibi komutlar için olay güdümlü otomasyonlar).

Alt komut olmadan `openclaw hooks` çalıştırmak, `openclaw hooks list` ile eşdeğerdir.

İlgili:

- Kancalar: [Kancalar](/tr/automation/hooks)
- Plugin kancaları: [Plugin kancaları](/tr/plugins/architecture-internals#provider-runtime-hooks)

## Tüm Kancaları Listeleme

```bash
openclaw hooks list
```

Çalışma alanı, yönetilen, ek ve paketlenmiş dizinlerden keşfedilen tüm kancaları listeler.
Gateway başlatma, en az bir dahili kanca yapılandırılana kadar dahili kanca işleyicilerini yüklemez.

**Seçenekler:**

- `--eligible`: Yalnızca uygun kancaları göster (gereksinimler karşılandı)
- `--json`: JSON olarak çıktı ver
- `-v, --verbose`: Eksik gereksinimler dahil ayrıntılı bilgi göster

**Örnek çıktı:**

```
Kancalar (4/4 hazır)

Hazır:
  🚀 boot-md ✓ - Gateway başlatıldığında BOOT.md çalıştır
  📎 bootstrap-extra-files ✓ - Ajan bootstrap sırasında ek çalışma alanı bootstrap dosyaları enjekte et
  📝 command-logger ✓ - Tüm komut olaylarını merkezi bir denetim dosyasına kaydet
  💾 session-memory ✓ - /new veya /reset komutu verildiğinde oturum bağlamını belleğe kaydet
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

## Kanca Bilgisi Alma

```bash
openclaw hooks info <name>
```

Belirli bir kanca hakkında ayrıntılı bilgi gösterir.

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

## Kanca Uygunluğunu Denetleme

```bash
openclaw hooks check
```

Kanca uygunluk durumunun özetini gösterir (kaç tanesi hazır, kaç tanesi hazır değil).

**Seçenekler:**

- `--json`: JSON olarak çıktı ver

**Örnek çıktı:**

```
Kanca Durumu

Toplam kanca: 4
Hazır: 4
Hazır değil: 0
```

## Bir Kancayı Etkinleştirme

```bash
openclaw hooks enable <name>
```

Yapılandırmanıza ekleyerek belirli bir kancayı etkinleştirir (varsayılan olarak `~/.openclaw/openclaw.json`).

**Not:** Çalışma alanı kancaları, burada veya yapılandırmada etkinleştirilene kadar varsayılan olarak devre dışıdır. Plugin'ler tarafından yönetilen kancalar `openclaw hooks list` içinde `plugin:<id>` gösterir ve burada etkinleştirilemez/devre dışı bırakılamaz. Bunun yerine Plugin'i etkinleştirin/devre dışı bırakın.

**Argümanlar:**

- `<name>`: Kanca adı (ör. `session-memory`)

**Örnek:**

```bash
openclaw hooks enable session-memory
```

**Çıktı:**

```
✓ Kanca etkinleştirildi: 💾 session-memory
```

**Yaptığı şey:**

- Kancanın var olup olmadığını ve uygun olup olmadığını denetler
- Yapılandırmanızda `hooks.internal.entries.<name>.enabled = true` değerini günceller
- Yapılandırmayı diske kaydeder

Kanca `<workspace>/hooks/` içinden geldiyse, Gateway'in onu yüklemesi için
bu açık katılım adımı gereklidir.

**Etkinleştirdikten sonra:**

- Kancaların yeniden yüklenmesi için Gateway'i yeniden başlatın (macOS'ta menü çubuğu uygulamasını yeniden başlatın veya geliştirme ortamında Gateway sürecinizi yeniden başlatın).

## Bir Kancayı Devre Dışı Bırakma

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
⏸ Kanca devre dışı bırakıldı: 📝 command-logger
```

**Devre dışı bıraktıktan sonra:**

- Kancaların yeniden yüklenmesi için Gateway'i yeniden başlatın

## Notlar

- `openclaw hooks list --json`, `info --json` ve `check --json`, yapılandırılmış JSON'u doğrudan stdout'a yazar.
- Plugin tarafından yönetilen kancalar burada etkinleştirilemez veya devre dışı bırakılamaz; bunun yerine sahip Plugin'i etkinleştirin veya devre dışı bırakın.

## Kanca Paketlerini Kurma

```bash
openclaw plugins install <package>        # Önce ClawHub, sonra npm
openclaw plugins install <package> --pin  # sürümü sabitle
openclaw plugins install <path>           # yerel yol
```

Kanca paketlerini birleşik Plugin kurucusu üzerinden kurun.

`openclaw hooks install` hâlâ uyumluluk takma adı olarak çalışır, ancak bir
kullanımdan kaldırma uyarısı yazdırır ve `openclaw plugins install` komutuna yönlendirir.

Npm belirteçleri **yalnızca kayıt defteri içindir** (paket adı + isteğe bağlı **tam sürüm** veya
**dist-tag**). Git/URL/dosya belirteçleri ve semver aralıkları reddedilir. Bağımlılık
kurulumları güvenlik için `--ignore-scripts` ile çalıştırılır.

Çıplak belirteçler ve `@latest`, kararlı izde kalır. Npm bunlardan herhangi birini
ön sürüme çözümlerse, OpenClaw durur ve sizden `@beta`/`@rc` gibi bir
ön sürüm etiketi veya tam bir ön sürüm numarasıyla açıkça katılım sağlamanızı ister.

**Yaptığı şey:**

- Kanca paketini `~/.openclaw/hooks/<id>` içine kopyalar
- Kurulan kancaları `hooks.internal.entries.*` içinde etkinleştirir
- Kurulumu `hooks.internal.installs` altında kaydeder

**Seçenekler:**

- `-l, --link`: Kopyalamak yerine yerel bir dizini bağla (`hooks.internal.load.extraDirs` içine ekler)
- `--pin`: npm kurulumlarını `hooks.internal.installs` içinde çözümlenmiş tam `name@version` olarak kaydet

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

Bağlanmış kanca paketleri, çalışma alanı kancaları olarak değil, operatör tarafından yapılandırılmış
bir dizinden gelen yönetilen kancalar olarak ele alınır.

## Kanca Paketlerini Güncelleme

```bash
openclaw plugins update <id>
openclaw plugins update --all
```

İzlenen npm tabanlı kanca paketlerini birleşik Plugin güncelleyicisi üzerinden güncelleyin.

`openclaw hooks update` hâlâ uyumluluk takma adı olarak çalışır, ancak bir
kullanımdan kaldırma uyarısı yazdırır ve `openclaw plugins update` komutuna yönlendirir.

**Seçenekler:**

- `--all`: İzlenen tüm kanca paketlerini güncelle
- `--dry-run`: Yazmadan neyin değişeceğini göster

Depolanmış bir bütünlük hash'i varsa ve alınan yapıtın hash'i değişirse,
OpenClaw devam etmeden önce bir uyarı yazdırır ve onay ister. CI/etkileşimsiz çalıştırmalarda istemleri atlamak için
genel `--yes` kullanın.

## Paketlenmiş Kancalar

### session-memory

`/new` veya `/reset` verdiğinizde oturum bağlamını belleğe kaydeder.

**Etkinleştirme:**

```bash
openclaw hooks enable session-memory
```

**Çıktı:** `~/.openclaw/workspace/memory/YYYY-MM-DD-slug.md`

**Bkz.:** [session-memory belgeleri](/tr/automation/hooks#session-memory)

### bootstrap-extra-files

`agent:bootstrap` sırasında ek bootstrap dosyaları enjekte eder (örneğin monorepo-yerel `AGENTS.md` / `TOOLS.md`).

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

**Günlükleri görüntüleme:**

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

Gateway başladığında `BOOT.md` çalıştırır (kanallar başladıktan sonra).

**Olaylar**: `gateway:startup`

**Etkinleştirme**:

```bash
openclaw hooks enable boot-md
```

**Bkz.:** [boot-md belgeleri](/tr/automation/hooks#boot-md)

## İlgili

- [CLI başvurusu](/tr/cli)
- [Otomasyon kancaları](/tr/automation/hooks)
