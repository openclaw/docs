---
read_when:
    - Yerel OpenClaw durumu için birinci sınıf bir yedek arşivi istiyorsunuz
    - Sıfırlama veya kaldırma öncesinde hangi yolların dahil edileceğini önizlemek istiyorsunuz
summary: '`openclaw backup` için CLI referansı (yerel yedek arşivleri oluşturma)'
title: Yedekleme
x-i18n:
    generated_at: "2026-04-30T09:10:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5c16f953bb32a1613181448f0e4c6ba8777383bce95bddc856dc7e1c3afe8550
    source_path: cli/backup.md
    workflow: 16
---

# `openclaw backup`

OpenClaw durumu, yapılandırması, kimlik doğrulama profilleri, kanal/sağlayıcı kimlik bilgileri, oturumlar ve isteğe bağlı olarak çalışma alanları için yerel bir yedek arşivi oluşturun.

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

- Arşiv, çözümlenmiş kaynak yollarını ve arşiv düzenini içeren bir `manifest.json` dosyası içerir.
- Varsayılan çıktı, geçerli çalışma dizininde zaman damgalı bir `.tar.gz` arşividir.
- Geçerli çalışma dizini yedeklenen bir kaynak ağacının içindeyse, OpenClaw varsayılan arşiv konumu için ana dizininize geri döner.
- Mevcut arşiv dosyalarının üzerine asla yazılmaz.
- Kaynak durum/çalışma alanı ağaçlarının içindeki çıktı yolları, kendi kendini dahil etmeyi önlemek için reddedilir.
- `openclaw backup verify <archive>`, arşivin tam olarak bir kök manifest içerdiğini doğrular, geçiş tarzı arşiv yollarını reddeder ve manifestte bildirilen her yükün tarball içinde bulunduğunu denetler.
- `openclaw backup create --verify`, arşivi yazdıktan hemen sonra bu doğrulamayı çalıştırır.
- `openclaw backup create --only-config`, yalnızca etkin JSON yapılandırma dosyasını yedekler.

## Neler yedeklenir

`openclaw backup create`, yerel OpenClaw kurulumunuzdan yedek kaynaklarını planlar:

- OpenClaw'ın yerel durum çözücüsünün döndürdüğü durum dizini, genellikle `~/.openclaw`
- Etkin yapılandırma dosyası yolu
- Durum dizininin dışında mevcut olduğunda çözümlenmiş `credentials/` dizini
- `--no-include-workspace` iletmediğiniz sürece geçerli yapılandırmadan keşfedilen çalışma alanı dizinleri

Model kimlik doğrulama profilleri zaten durum dizininin altında
`agents/<agentId>/agent/auth-profiles.json` içinde yer alır, bu nedenle normalde
durum yedeği girdisi tarafından kapsanır.

`--only-config` kullanırsanız OpenClaw durum, kimlik bilgileri dizini ve çalışma alanı keşfini atlar ve yalnızca etkin yapılandırma dosyası yolunu arşivler.

OpenClaw, arşivi oluşturmadan önce yolları kanonikleştirir. Yapılandırma,
kimlik bilgileri dizini veya bir çalışma alanı zaten durum dizininin içindeyse,
ayrı üst düzey yedek kaynakları olarak çoğaltılmazlar. Eksik yollar
atlanır.

Arşiv yükü, bu kaynak ağaçlardaki dosya içeriklerini depolar ve gömülü `manifest.json`, çözümlenmiş mutlak kaynak yollarını ve her varlık için kullanılan arşiv düzenini kaydeder.

Durum dizininin `extensions/` ağacı altındaki yüklü Plugin kaynak ve manifest
dosyaları dahil edilir, ancak iç içe `node_modules/` bağımlılık
ağaçları atlanır. Bu bağımlılıklar yeniden oluşturulabilir kurulum yapıtlarıdır; bir
arşivi geri yükledikten sonra, geri yüklenen bir Plugin eksik bağımlılıklar
bildirirse `openclaw plugins update <id>` kullanın veya Plugin'i
`openclaw plugins install <spec> --force` ile yeniden yükleyin.

## Geçersiz yapılandırma davranışı

`openclaw backup`, kurtarma sırasında yine de yardımcı olabilmesi için normal yapılandırma ön denetimini kasıtlı olarak atlar. Çalışma alanı keşfi geçerli bir yapılandırmaya bağlı olduğundan, yapılandırma dosyası mevcut ancak geçersizse ve çalışma alanı yedeği hâlâ etkinse `openclaw backup create` artık hızlıca başarısız olur.

Bu durumda yine de kısmi bir yedek istiyorsanız yeniden çalıştırın:

```bash
openclaw backup create --no-include-workspace
```

Bu, çalışma alanı keşfini tamamen atlarken durum, yapılandırma ve harici kimlik bilgileri dizinini kapsamda tutar.

Yalnızca yapılandırma dosyasının kendisinin bir kopyasına ihtiyacınız varsa, `--only-config` yapılandırma hatalı biçimlendirilmiş olduğunda da çalışır, çünkü çalışma alanı keşfi için yapılandırmayı ayrıştırmaya dayanmaz.

## Boyut ve performans

OpenClaw yerleşik bir en yüksek yedek boyutu veya dosya başına boyut sınırı uygulamaz.

Pratik sınırlar yerel makineden ve hedef dosya sisteminden gelir:

- Geçici arşiv yazımı ve son arşiv için kullanılabilir alan
- Büyük çalışma alanı ağaçlarını dolaşma ve bunları bir `.tar.gz` içine sıkıştırma süresi
- `openclaw backup create --verify` kullanırsanız veya `openclaw backup verify` çalıştırırsanız arşivi yeniden tarama süresi
- Hedef yoldaki dosya sistemi davranışı. OpenClaw, üzerine yazmayan bir hard link yayımlama adımını tercih eder ve hard linkler desteklenmediğinde özel kopyalamaya geri döner

Büyük çalışma alanları genellikle arşiv boyutunun ana belirleyicisidir. Daha küçük veya daha hızlı bir yedek istiyorsanız `--no-include-workspace` kullanın.

En küçük arşiv için `--only-config` kullanın.

## İlgili

- [CLI başvurusu](/tr/cli)
