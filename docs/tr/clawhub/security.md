---
read_when:
    - ClawHub tarama ve moderasyon sonuçlarını anlama
    - Bir beceri veya paketi bildirme
    - Bekletilen, gizli veya engellenmiş bir listelemeyi kurtarma
summary: ClawHub güven, tarama, raporlama ve moderasyon davranışı.
x-i18n:
    generated_at: "2026-05-12T08:44:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 49e2650b23ff7657bb01c43fff50f3bb555b3bc7961b503b02a51096e2fceb27
    source_path: clawhub/security.md
    workflow: 16
---

# Güvenlik + Moderasyon

ClawHub yayımlamaya açıktır, ancak herkese açık listelemeler yine de güven,
tarama, raporlama ve moderasyon kontrollerinden geçer. Amaç pratiktir:
kullanıcıların ne yüklediklerini incelemesine yardımcı olmak, yayıncılara yanlış
pozitifler için bir kurtarma yolu sunmak ve kötüye kullanıma yönelik paketleri
herkese açık keşif alanlarının dışında tutmak.

Ayrıca bkz. [Kabul edilebilir kullanım](/tr/clawhub/acceptable-usage).

## Kullanıcılar neleri inceleyebilir

Bir Skills veya Plugin yüklemeden önce, ClawHub listesini şu bilgiler için kontrol edin:

- sahip ve kaynak atfı
- en son sürüm ve değişiklik günlüğü
- gerekli ortam değişkenleri veya izinler
- Plugin'ler için uyumluluk meta verileri
- tarama veya moderasyon durumu
- gösterildiği yerlerde raporlar, yorumlar, yıldızlar, indirmeler ve yükleme sinyalleri

Yalnızca anladığınız ve güvendiğiniz içerikleri yükleyin.

## Tarama durumları

ClawHub herkese açık sayfalarda ve sahiplerin görebildiği tanılamalarda tarama
veya moderasyon sonuçlarını gösterebilir.

Yaygın sonuçlar şunları içerir:

- `clean`: engelleyici bir sorun bulunmadı.
- `suspicious`: sürüm dikkat veya inceleme gerektiriyor.
- `malicious`: sürüm güvensiz kabul ediliyor.
- `pending`: kontroller henüz tamamlanmadı.
- `held`, `quarantined`, `revoked` veya `hidden`: sürüm herkese açık yükleme
  yüzeylerinde tam olarak kullanılamaz.

Kesin ifade yüzeye göre değişebilir, ancak pratik anlam aynıdır: Bir sürüm
bekletiliyor veya engelleniyorsa, sahip sorunu çözene ya da moderasyon sürümü
geri yükleyene kadar kullanıcılar onu yüklememelidir.

## Skills

Skills taramaları yayımlanan Skills paketini, meta verileri, beyan edilen
gereksinimleri ve şüpheli talimatları inceler.

ClawHub, bir Skills'in ne beyan ettiği ile ne yapıyor gibi göründüğü arasındaki
uyumsuzluklara özellikle dikkat eder. Örneğin, gerekli bir API anahtarına
başvuran bir Skills, bu gereksinimi `SKILL.md` içinde beyan etmelidir; böylece
kullanıcılar bunu yüklemeden önce görebilir.

Tarama bulguları yapıta dayalıdır. Beyan edilen API kimlik bilgileri,
localhost OAuth geri çağrıları, kapsamlı kaldırma temizliği, Basic Auth
kodlaması veya belirtilen sağlayıcıya kullanıcı tarafından seçilen dosya
yüklemeleri gibi beklenen sağlayıcı davranışları; gizli kimlik bilgisi
yönlendirme, geniş özel dosya erişimi, ilgisiz ağ hedefleri veya gizli tarayıcı
kötüye kullanımı gibi davranışlardan farklı değerlendirilir.

Bkz. [Skills biçimi](/tr/clawhub/skill-format).

## Plugin'ler

Plugin sürümleri paket meta verilerini, kaynak atfını, uyumluluk alanlarını ve
yapıt bütünlüğü bilgilerini içerir.

OpenClaw, ClawHub üzerinde barındırılan Plugin'leri yüklemeden önce uyumluluğu
kontrol eder. Paket kayıtları ayrıca OpenClaw'ın indirilen yapıtları
doğrulayabilmesi için özet meta verilerini gösterebilir. ClawScan, Plugin
sürümlerini incelerken beyan edilen paket `openclaw.environment` env/config
meta verilerini dahil eder; böylece beyan edilen çalışma zamanı gereksinimleri
gözlemlenen davranışla karşılaştırılır.

## Raporlar

Oturum açmış kullanıcılar Skills, paketler ve yorumları raporlayabilir.

Raporlar belirli ve eyleme geçirilebilir olmalıdır. Raporlamanın kötüye
kullanımı da hesap işlemine yol açabilir.

Rapor örnekleri:

- yanıltıcı meta veriler
- beyan edilmemiş kimlik bilgisi veya izin gereksinimleri
- şüpheli yükleme talimatları
- dolandırıcılık yorumları veya kimliğe bürünme
- kötü niyetli kayıtlar veya marka kötüye kullanımı
- [Kabul edilebilir kullanım](/tr/clawhub/acceptable-usage) kurallarını ihlal eden içerik

## Yayıncı ClawScan notları

Yayıncılar, bir Skills veya Plugin yayımlarken isteğe bağlı bir ClawScan notu
sağlayabilir. Bu not, ClawScan'e ağ erişimi, yerel ana makine erişimi veya
sağlayıcıya özgü kimlik bilgileri gibi aksi halde olağandışı görünebilecek
davranışlar için bağlam sağlar.

## Moderasyon Bekletmeleri

Statik tarayıcı yüklenen bir Skills'i kötü amaçlı olarak işaretlediğinde,
yayıncı otomatik olarak bir moderasyon bekletmesine alınır (`requiresModerationAt`
kullanıcı üzerinde ayarlanır). Bu, yayıncının tüm Skills'lerini gizler, gelecekteki
yayınların gizli başlamasına neden olur ve bir `user.moderation.auto` denetim
günlüğü girdisi oluşturur.

Statik şüpheli bulgular moderatörler için dosya/satır kanıtı olarak saklanır,
ancak içerikleri tek başına gizlemez veya herkese açık tarama sonucuna karar
vermez. Yeni yüklemeler, LLM incelemesi sonuçlanana kadar inceleme/beklemede
durumunda kalır. Statik tarama yalnızca kötü amaçlı imzalar için hemen engeller.
VirusTotal motor isabetleri görünür güvenlik kanıtı olarak kalır, ancak
VirusTotal Code Insight/Palm kararları tavsiye niteliğindedir ve Skills'leri tek
başına gizlemez. ClawScan LLM incelemeleri, amaçla uyumlu notları rehberlik
olarak tutar. Orta düzey inceleme bulguları yapıtta görünür kalırken, şüpheli
filtresi yüksek etkili LLM kaygıları, kötü amaçlı bulgular veya doğrulanmış
AV motoru tespitleri için ayrılır.

Yöneticiler yanlış pozitif bir bekletmeyi kaldırabilir:

```bash
npx convex run users:liftModerationHold '{"userId": "<user-id>", "reason": "False positive from security tool scanning"}'
```

Bu işlem `requiresModerationAt` ve `requiresModerationReason` değerlerini
temizler, kullanıcı düzeyi bekletme nedeniyle gizlenen Skills'leri geri yükler
ve bir `user.moderation.lift` denetim günlüğü girdisi yazar. Başka nedenlerle
gizlenen veya kendi statik taraması hâlâ kötü amaçlı olan Skills'ler gizli kalır.

## Yasaklar ve hesap durumu

ClawHub politikasını ihlal eden hesaplar yayımlama erişimini kaybedebilir.
Ağır kötüye kullanım hesap yasakları, token iptali, gizli içerik veya kaldırılan
listelemelerle sonuçlanabilir.

Silinen, yasaklanan veya devre dışı bırakılan hesaplar ClawHub API token'larını
kullanamaz. Hesap işleminden sonra CLI kimlik doğrulaması başarısız olmaya
başlarsa, hesap durumunu gözden geçirmek için web kullanıcı arayüzünde oturum
açın. Oturum açma veya normal CLI erişimi engellendiyse, kurtarma incelemesi
için security@openclaw.ai ile iletişime geçin.

## Yayıncı rehberliği

Yanlış pozitifleri azaltmak ve kullanıcı güvenini artırmak için:

- adları, özetleri, etiketleri ve değişiklik günlüklerini doğru tutun
- gerekli ortam değişkenlerini ve izinleri beyan edin
- bir sürümde olağandışı ancak kasıtlı davranış varsa yayıncı ClawScan notu ekleyin
- gizlenmiş yükleme komutlarından kaçının
- mümkün olduğunda kaynağa bağlantı verin
- Plugin'leri yayımlamadan önce deneme çalıştırmaları kullanın
- kullanıcılar veya moderatörler paket davranışı hakkında soru sorarsa net yanıt verin
