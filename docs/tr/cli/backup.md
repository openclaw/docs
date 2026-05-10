---
read_when:
    - Yerel OpenClaw durumu için birinci sınıf bir yedekleme arşivi istiyorsunuz
    - Sıfırlama veya kaldırma işleminden önce hangi yolların dahil edileceğini önizlemek istiyorsunuz
summary: 'CLI başvurusu: `openclaw backup` (yerel yedek arşivleri oluşturma)'
title: Yedekleme
x-i18n:
    generated_at: "2026-05-10T19:28:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2c95cf475a563ad4f0a2dbaeda504b265580545c9d3f6f71d2f4d2a183e76a5c
    source_path: cli/backup.md
    workflow: 16
---

# `openclaw backup`

OpenClaw durumu, yapılandırması, kimlik doğrulama profilleri, kanal/sağlayıcı kimlik bilgileri, oturumları ve isteğe bağlı olarak çalışma alanları için yerel bir yedekleme arşivi oluşturun.

```bash
openclaw backup create
openclaw backup create --output ~/Backups
openclaw backup create --dry-run --json
openclaw backup create --verify
openclaw backup create --no-include-workspace
openclaw backup create --only-config
openclaw backup verify ./2026-03-09T00-00-00.000Z-openclaw-backup.tar.gz
```

## Notlar

- Arşiv, çözümlenen kaynak yollarını ve arşiv düzenini içeren bir `manifest.json` dosyası içerir.
- Varsayılan çıktı, geçerli çalışma dizininde zaman damgalı bir `.tar.gz` arşividir.
- Geçerli çalışma dizini yedeklenen bir kaynak ağacının içindeyse OpenClaw, varsayılan arşiv konumu için ana dizininize geri döner.
- Mevcut arşiv dosyalarının üzerine asla yazılmaz.
- Kaynak durum/çalışma alanı ağaçlarının içindeki çıktı yolları, kendini içermeyi önlemek için reddedilir.
- `openclaw backup verify <archive>`, arşivin tam olarak bir kök manifest içerdiğini doğrular, geçiş tarzı arşiv yollarını reddeder ve manifestte bildirilen her yükün tarball içinde bulunduğunu denetler.
- `openclaw backup create --verify`, arşiv yazıldıktan hemen sonra bu doğrulamayı çalıştırır.
- `openclaw backup create --only-config`, yalnızca etkin JSON yapılandırma dosyasını yedekler.

## Neler yedeklenir

`openclaw backup create`, yerel OpenClaw kurulumunuzdan yedekleme kaynaklarını planlar:

- OpenClaw'ın yerel durum çözümleyicisi tarafından döndürülen durum dizini, genellikle `~/.openclaw`
- Etkin yapılandırma dosyası yolu
- Durum dizininin dışında mevcut olduğunda çözümlenen `credentials/` dizini
- `--no-include-workspace` iletmediğiniz sürece geçerli yapılandırmadan keşfedilen çalışma alanı dizinleri

Model kimlik doğrulama profilleri, durum dizininin altında zaten
`agents/<agentId>/agent/auth-profiles.json` içinde yer alır, bu yüzden normalde
durum yedekleme girdisi tarafından kapsanırlar.

`--only-config` kullanırsanız OpenClaw durum, kimlik bilgileri dizini ve çalışma alanı keşfini atlar ve yalnızca etkin yapılandırma dosyası yolunu arşivler.

OpenClaw, arşivi oluşturmadan önce yolları kanonikleştirir. Yapılandırma,
kimlik bilgileri dizini veya bir çalışma alanı zaten durum dizininin içinde
bulunuyorsa bunlar ayrı üst düzey yedekleme kaynakları olarak çoğaltılmaz. Eksik
yollar atlanır.

Arşiv yükü, bu kaynak ağaçlardaki dosya içeriklerini depolar ve gömülü `manifest.json`, çözümlenen mutlak kaynak yollarını ve her varlık için kullanılan arşiv düzenini kaydeder.

Arşiv oluşturma sırasında OpenClaw, geri yükleme değeri olmayan bilinen canlı mutasyon dosyalarını atlar; bunlara etkin ajan oturum dökümleri, cron çalıştırma günlükleri, dönen günlükler, teslim kuyrukları, durum dizini altındaki soket/pid/geçici dosyalar ve ilgili dayanıklı kuyruk geçici dosyaları dahildir. JSON sonucu, otomasyonun kaç dosyanın kasıtlı olarak dışarıda bırakıldığını görebilmesi için `skippedVolatileCount` içerir.

Durum dizininin `extensions/` ağacı altındaki yüklü Plugin kaynak ve manifest
dosyaları dahil edilir, ancak iç içe `node_modules/` bağımlılık ağaçları atlanır.
Bu bağımlılıklar yeniden oluşturulabilir kurulum yapıtlarıdır; bir arşivi geri
yükledikten sonra, geri yüklenen bir Plugin eksik bağımlılık bildirirse
`openclaw plugins update <id>` kullanın veya Plugin'i
`openclaw plugins install <spec> --force` ile yeniden yükleyin.

## Geçersiz yapılandırma davranışı

`openclaw backup`, kurtarma sırasında hâlâ yardımcı olabilmesi için normal yapılandırma ön denetimini kasıtlı olarak atlar. Çalışma alanı keşfi geçerli bir yapılandırmaya bağlı olduğundan, `openclaw backup create` artık yapılandırma dosyası mevcut ancak geçersiz olduğunda ve çalışma alanı yedekleme hâlâ etkin olduğunda hızlıca başarısız olur.

Bu durumda yine de kısmi bir yedekleme istiyorsanız yeniden çalıştırın:

```bash
openclaw backup create --no-include-workspace
```

Bu, çalışma alanı keşfini tamamen atlarken durum, yapılandırma ve harici kimlik bilgileri dizinini kapsamda tutar.

Yalnızca yapılandırma dosyasının kendisinin bir kopyasına ihtiyacınız varsa, `--only-config` yapılandırma bozuk olduğunda da çalışır çünkü çalışma alanı keşfi için yapılandırmayı ayrıştırmaya dayanmaz.

## Boyut ve performans

OpenClaw, yerleşik bir en fazla yedekleme boyutu veya dosya başına boyut sınırı uygulamaz.

Pratik sınırlar yerel makineden ve hedef dosya sisteminden gelir:

- Geçici arşiv yazımı ve son arşiv için kullanılabilir alan
- Büyük çalışma alanı ağaçlarını dolaşıp bunları bir `.tar.gz` içine sıkıştırma süresi
- `openclaw backup create --verify` kullanırsanız veya `openclaw backup verify` çalıştırırsanız arşivi yeniden tarama süresi
- Hedef yoldaki dosya sistemi davranışı. OpenClaw, üzerine yazmayan bir hard link yayımlama adımını tercih eder ve hard link desteklenmediğinde özel kopyalamaya geri döner

Büyük çalışma alanları genellikle arşiv boyutunun ana belirleyicisidir. Daha küçük veya daha hızlı bir yedekleme istiyorsanız `--no-include-workspace` kullanın.

En küçük arşiv için `--only-config` kullanın.

## İlgili

- [CLI başvurusu](/tr/cli)
