---
read_when:
    - Ajan hook'larını yönetmek istiyorsunuz
    - Kanca kullanılabilirliğini incelemek veya çalışma alanı kancalarını etkinleştirmek istiyorsunuz
summary: '`openclaw hooks` için CLI başvurusu (ajan kancaları)'
title: Kancalar
x-i18n:
    generated_at: "2026-07-12T11:35:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f33d1e343771971bdc17dcafdabc6c4fc893b3080897862475a148e5f3957796
    source_path: cli/hooks.md
    workflow: 16
---

# `openclaw hooks`

Ajan hook'larını (`/new`, `/reset` gibi komutlar ve Gateway başlatma işlemi için olay güdümlü otomasyonlar) yönetin. Yalın `openclaw hooks`, `openclaw hooks list` ile eşdeğerdir.

İlgili: [Hook'lar](/tr/automation/hooks) - [Plugin hook'ları](/tr/plugins/hooks)

## Hook'ları listeleme

```bash
openclaw hooks list [--eligible] [--json] [-v|--verbose]
```

Çalışma alanı, yönetilen, ek ve paketle birlikte sunulan dizinlerde bulunan hook'ları listeler.

- `--eligible`: yalnızca gereksinimleri karşılanan hook'lar.
- `--json`: yapılandırılmış çıktı.
- `-v, --verbose`: karşılanmayan gereksinimleri içeren bir Eksik sütunu ekler.

```
Hook'lar (4/5 hazır)

Hazır:
  🚀 boot-md ✓ - Gateway başlatılırken BOOT.md dosyasını çalıştır
  📎 bootstrap-extra-files ✓ - Ajan önyüklemesi sırasında ek çalışma alanı önyükleme dosyaları ekle
  📝 command-logger ✓ - Tüm komut olaylarını merkezi bir denetim dosyasına kaydet
  💾 session-memory ✓ - /new veya /reset komutu verildiğinde oturum bağlamını belleğe kaydet
```

## Hook bilgilerini alma

```bash
openclaw hooks info <name> [--json]
```

`<name>`, hook adı veya hook anahtarıdır (örneğin `session-memory`). Kaynağı, dosya/işleyici yollarını, ana sayfayı, olayları ve gereksinim başına durumu (ikili dosyalar, ortam, yapılandırma, işletim sistemi) gösterir.

## Uygunluğu denetleme

```bash
openclaw hooks check [--json]
```

Hazır/hazır değil sayı özetini yazdırır; hazır olmayan hook'lar varsa her birini engelleme nedeniyle birlikte listeler.

## Bir hook'u etkinleştirme

```bash
openclaw hooks enable <name>
```

Yapılandırmaya `hooks.internal.entries.<name>.enabled = true` değerini ekler veya günceller ve ayrıca `hooks.internal.enabled` ana anahtarını açar (en az bir hook yapılandırılana kadar Gateway hiçbir dahili hook işleyicisini yüklemez). Hook mevcut değilse, Plugin tarafından yönetiliyorsa veya uygun değilse (gereksinimleri eksikse) başarısız olur.

Plugin tarafından yönetilen hook'lar `hooks list` içinde `plugin:<id>` olarak gösterilir ve buradan etkinleştirilemez/devre dışı bırakılamaz; bunun yerine sahibi olan Plugin'i etkinleştirin veya devre dışı bırakın.

Etkinleştirdikten sonra hook'ların yeniden yüklenmesi için Gateway'i yeniden başlatın (macOS menü çubuğu uygulamasını veya geliştirme ortamındaki Gateway işleminizi yeniden başlatın).

## Bir hook'u devre dışı bırakma

```bash
openclaw hooks disable <name>
```

`hooks.internal.entries.<name>.enabled = false` olarak ayarlar. Ardından Gateway'i yeniden başlatın.

## Hook paketlerini yükleme ve güncelleme

```bash
openclaw plugins install <package>        # varsayılan olarak npm
openclaw plugins install npm:<package>    # yalnızca npm
openclaw plugins install <package> --pin  # çözümlenen sürümü sabitle
openclaw plugins install <path>           # yerel dizin veya arşiv
openclaw plugins install -l <path>        # yerel dizini kopyalamak yerine bağla

openclaw plugins update <id>
openclaw plugins update --all
openclaw plugins update --dry-run
```

Hook paketleri birleşik Plugin yükleyicisi/güncelleyicisi aracılığıyla yüklenir; `openclaw hooks install` / `openclaw hooks update`, uyarı yazdıran ve işlemi `plugins` komutlarına ileten kullanım dışı bırakılmış takma adlar olarak çalışmaya devam eder.

- Npm belirtimleri yalnızca kayıt defteriyle sınırlıdır: paket adı ve isteğe bağlı tam sürüm veya dağıtım etiketi. Git/URL/dosya belirtimleri ve semver aralıkları reddedilir. Bağımlılık yüklemeleri proje içinde `--ignore-scripts` ile çalıştırılır.
- Yalın belirtimler ve `@latest` kararlı kanalda kalır; npm bir ön sürüm çözümlerse OpenClaw durur ve açıkça katılmanızı ister (`@beta`, `@rc` veya tam bir ön sürüm).
- Desteklenen arşivler: `.zip`, `.tgz`, `.tar.gz`, `.tar`.
- `-l, --link`, yerel bir dizini kopyalamak yerine bağlar (`hooks.internal.load.extraDirs` içine ekler); bağlı hook paketleri çalışma alanı hook'ları değil, operatör tarafından yapılandırılmış bir dizindeki yönetilen hook'lardır.
- `--pin`, npm yüklemelerini `hooks.internal.installs` içinde tam olarak çözümlenmiş bir `name@version` biçiminde kaydeder.
- Yükleme işlemi paketi `~/.openclaw/hooks/<id>` konumuna kopyalar, hook'larını `hooks.internal.entries.*` altında etkinleştirir ve yüklemeyi `hooks.internal.installs` altında kaydeder.
- Saklanan bütünlük karması indirilen yapıtla artık eşleşmiyorsa OpenClaw uyarır ve devam etmeden önce onay ister; istemi atlamak için genel `--yes` seçeneğini kullanın (örneğin CI ortamında).

## Paketle birlikte sunulan hook'lar

| Hook                  | Olaylar                                            | Yaptığı işlem                                                                                             |
| --------------------- | ------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| boot-md               | `gateway:startup`                                 | Yapılandırılmış her ajan kapsamı için Gateway başlatılırken `BOOT.md` dosyasını çalıştırır                 |
| bootstrap-extra-files | `agent:bootstrap`                                 | Ajan önyüklemesi sırasında ek önyükleme dosyaları (örneğin monorepo `AGENTS.md`/`TOOLS.md`) ekler          |
| command-logger        | `command`                                         | Komut olaylarını `~/.openclaw/logs/commands.log` dosyasına kaydeder                                       |
| compaction-notifier   | `session:compact:before`, `session:compact:after` | Oturum sıkıştırması başladığında ve tamamlandığında görünür sohbet bildirimleri gönderir                   |
| session-memory        | `command:new`, `command:reset`                    | `/new` veya `/reset` kullanıldığında oturum bağlamını belleğe kaydeder                                     |

Paketle birlikte sunulan herhangi bir hook'u `openclaw hooks enable <hook-name>` ile etkinleştirin. Tüm ayrıntılar, yapılandırma anahtarları ve varsayılanlar: [Paketle birlikte sunulan hook'lar](/tr/automation/hooks#bundled-hooks).

### command-logger günlük dosyası

```bash
tail -n 20 ~/.openclaw/logs/commands.log        # son komutlar
cat ~/.openclaw/logs/commands.log | jq .          # okunaklı yazdır
grep '"action":"new"' ~/.openclaw/logs/commands.log | jq .   # eyleme göre filtrele
```

## Notlar

- `hooks list --json`, `info --json` ve `check --json`, yapılandırılmış JSON'u doğrudan standart çıktıya yazar.

## İlgili

- [CLI başvurusu](/tr/cli)
- [Otomasyon hook'ları](/tr/automation/hooks)
