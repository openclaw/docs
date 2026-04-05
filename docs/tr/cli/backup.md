---
read_when:
    - Yerel OpenClaw durumu için birinci sınıf bir yedek arşivi istiyorsunuz
    - Sıfırlama veya kaldırma işleminden önce hangi yolların dahil edileceğini önizlemek istiyorsunuz
summary: '`openclaw backup` için CLI başvurusu (yerel yedek arşivleri oluşturma)'
title: backup
x-i18n:
    generated_at: "2026-04-05T13:47:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 700eda8f9eac1cc93a854fa579f128e5e97d4e6dfc0da75b437c0fb2a898a37d
    source_path: cli/backup.md
    workflow: 15
---

# `openclaw backup`

OpenClaw durumu, yapılandırma, auth profilleri, kanal/sağlayıcı kimlik bilgileri, oturumlar ve isteğe bağlı olarak çalışma alanları için yerel bir yedek arşivi oluşturun.

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

- Arşiv, çözümlenen kaynak yolları ve arşiv düzenini içeren bir `manifest.json` dosyası içerir.
- Varsayılan çıktı, geçerli çalışma dizininde zaman damgalı bir `.tar.gz` arşividir.
- Geçerli çalışma dizini yedeklenen bir kaynak ağacının içindeyse, OpenClaw varsayılan arşiv konumu için ana dizininize geri döner.
- Mevcut arşiv dosyalarının üzerine asla yazılmaz.
- Kaynak durum/çalışma alanı ağaçları içindeki çıktı yolları, kendi kendine dahil etmeyi önlemek için reddedilir.
- `openclaw backup verify <archive>`, arşivin tam olarak bir kök manifest içerdiğini doğrular, traversal tarzı arşiv yollarını reddeder ve manifest tarafından bildirilen her payload'ın tarball içinde bulunduğunu kontrol eder.
- `openclaw backup create --verify`, arşiv yazıldıktan hemen sonra bu doğrulamayı çalıştırır.
- `openclaw backup create --only-config`, yalnızca etkin JSON yapılandırma dosyasını yedekler.

## Neler yedeklenir

`openclaw backup create`, yerel OpenClaw kurulumunuzdan yedek kaynaklarını planlar:

- OpenClaw'ın yerel durum çözümleyicisinden dönen durum dizini; genellikle `~/.openclaw`
- Etkin yapılandırma dosyası yolu
- Durum dizininin dışında bulunduğunda çözümlenen `credentials/` dizini
- `--no-include-workspace` geçmediğiniz sürece, geçerli yapılandırmadan keşfedilen çalışma alanı dizinleri

Model auth profilleri zaten durum dizininde
`agents/<agentId>/agent/auth-profiles.json` altında yer alır; bu nedenle normalde
durum yedek girdisi kapsamında bulunurlar.

`--only-config` kullanırsanız, OpenClaw durum, kimlik bilgileri dizini ve çalışma alanı keşfini atlar ve yalnızca etkin yapılandırma dosyası yolunu arşivler.

OpenClaw arşivi oluşturmadan önce yolları kanonikleştirir. Yapılandırma, kimlik bilgileri dizini veya bir çalışma alanı zaten durum dizininin içindeyse, ayrı üst düzey yedek kaynakları olarak yinelenmezler. Eksik yollar atlanır.

Arşiv payload'ı bu kaynak ağaçlardan dosya içeriklerini saklar ve gömülü `manifest.json`, çözümlenen mutlak kaynak yollarını ve her varlık için kullanılan arşiv düzenini kaydeder.

## Geçersiz yapılandırma davranışı

`openclaw backup`, kurtarma sırasında yine de yardımcı olabilmesi için normal yapılandırma ön denetimini kasıtlı olarak atlar. Çalışma alanı keşfi geçerli bir yapılandırmaya bağlı olduğundan, `openclaw backup create`, yapılandırma dosyası mevcut ama geçersizse ve çalışma alanı yedeği hâlâ etkinse artık hızlıca hata verir.

Bu durumda yine de kısmi bir yedek istiyorsanız, şunu yeniden çalıştırın:

```bash
openclaw backup create --no-include-workspace
```

Bu, çalışma alanı keşfini tamamen atlayarak durum, yapılandırma ve harici kimlik bilgileri dizinini kapsam içinde tutar.

Yalnızca yapılandırma dosyasının kendisinin bir kopyasına ihtiyacınız varsa, `--only-config` de yapılandırma bozuk olduğunda çalışır; çünkü çalışma alanı keşfi için yapılandırmayı ayrıştırmaya dayanmaz.

## Boyut ve performans

OpenClaw yerleşik bir azami yedek boyutu veya dosya başına boyut sınırı uygulamaz.

Pratik sınırlar yerel makine ve hedef dosya sisteminden kaynaklanır:

- Geçici arşiv yazımı ve son arşiv için kullanılabilir alan
- Büyük çalışma alanı ağaçlarını dolaşıp bunları bir `.tar.gz` içine sıkıştırmak için gereken süre
- `openclaw backup create --verify` kullanırsanız veya `openclaw backup verify` çalıştırırsanız arşivi yeniden taramak için gereken süre
- Hedef yoldaki dosya sistemi davranışı. OpenClaw, üzerine yazmayan bir hard-link yayımlama adımını tercih eder ve hard linkler desteklenmiyorsa özel kopyaya geri döner

Büyük çalışma alanları genellikle arşiv boyutunun ana belirleyicisidir. Daha küçük veya daha hızlı bir yedek istiyorsanız `--no-include-workspace` kullanın.

En küçük arşiv için `--only-config` kullanın.
