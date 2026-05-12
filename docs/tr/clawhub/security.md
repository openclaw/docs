---
read_when:
    - ClawHub taraması ve moderasyon sonuçlarını anlama
    - Bir beceri veya paketi bildirme
    - Askıya alınmış, gizlenmiş veya engellenmiş bir listelemeyi kurtarma
summary: ClawHub güven, tarama, raporlama ve moderasyon davranışı.
x-i18n:
    generated_at: "2026-05-12T12:49:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 49e2650b23ff7657bb01c43fff50f3bb555b3bc7961b503b02a51096e2fceb27
    source_path: clawhub/security.md
    workflow: 16
---

# Güvenlik + Moderasyon

ClawHub yayıma açıktır, ancak herkese açık listelemeler yine de güven,
tarama, raporlama ve moderasyon kontrollerinden geçer. Amaç pratiktir:
kullanıcıların ne yüklediklerini incelemesine yardımcı olmak, yayıncılara yanlış
pozitifler için bir kurtarma yolu sunmak ve kötüye kullanım amaçlı paketleri
herkese açık keşif alanından uzak tutmak.

Ayrıca bkz. [Kabul edilebilir kullanım](/tr/clawhub/acceptable-usage).

## Kullanıcılar neleri inceleyebilir

Bir skill veya plugin yüklemeden önce, ClawHub listelemesinde şunları kontrol edin:

- sahip ve kaynak atfı
- en son sürüm ve değişiklik günlüğü
- gerekli ortam değişkenleri veya izinler
- plugin'ler için uyumluluk meta verileri
- tarama veya moderasyon durumu
- gösterildiği yerlerde raporlar, yorumlar, yıldızlar, indirmeler ve yükleme sinyalleri

Yalnızca anladığınız ve güvendiğiniz içerikleri yükleyin.

## Tarama durumları

ClawHub, herkese açık sayfalarda ve sahip tarafından görülebilen tanı
bilgilerinde tarama veya moderasyon sonuçları gösterebilir.

Yaygın sonuçlar şunları içerir:

- `clean`: engelleyici bir sorun bulunmadı.
- `suspicious`: sürüm dikkat veya inceleme gerektirir.
- `malicious`: sürüm güvensiz kabul edilir.
- `pending`: kontroller henüz tamamlanmadı.
- `held`, `quarantined`, `revoked` veya `hidden`: sürüm, herkese açık
  yükleme yüzeylerinde tamamen kullanılabilir değildir.

Tam ifade yüzeye göre değişebilir, ancak pratik anlam aynıdır: bir sürüm
bekletiliyor veya engelleniyorsa, sahip sorunu çözene ya da moderasyon sürümü
geri getirene kadar kullanıcılar onu yüklememelidir.

## Skills

Skill taramaları yayımlanan skill paketini, meta verileri, bildirilen
gereksinimleri ve şüpheli talimatları inceler.

ClawHub, bir skill'in bildirdiği şeylerle yapıyor gibi göründüğü şeyler
arasındaki uyumsuzluklara özellikle dikkat eder. Örneğin, gerekli bir API
anahtarına başvuran bir skill, kullanıcıların yüklemeden önce görebilmesi için
bu gereksinimi `SKILL.md` içinde bildirmelidir.

Tarama bulguları artefakt temellidir. Bildirilen API kimlik bilgileri,
localhost OAuth geri çağrıları, kapsamlı kaldırma temizliği, Basic Auth
kodlaması veya belirtilen sağlayıcıya kullanıcı tarafından seçilen dosya
yüklemeleri gibi beklenen sağlayıcı davranışları; gizli kimlik bilgisi
yönlendirme, geniş özel dosya erişimi, alakasız ağ hedefleri veya gizli tarayıcı
kötüye kullanımı gibi davranışlardan farklı değerlendirilir.

Bkz. [Skill biçimi](/tr/clawhub/skill-format).

## Plugin'ler

Plugin sürümleri paket meta verilerini, kaynak atfını, uyumluluk alanlarını ve
artefakt bütünlüğü bilgilerini içerir.

OpenClaw, ClawHub üzerinde barındırılan plugin'leri yüklemeden önce uyumluluğu
kontrol eder. Paket kayıtları, OpenClaw'ın indirilen artefaktları doğrulayabilmesi
için özet meta verilerini de sunabilir. ClawScan, plugin sürümlerini incelerken
bildirilen paket `openclaw.environment` ortam/yapılandırma meta verilerini dahil
eder; böylece bildirilen çalışma zamanı gereksinimleri gözlemlenen davranışla
karşılaştırılır.

## Raporlar

Oturum açmış kullanıcılar Skills, paketler ve yorumları raporlayabilir.

Raporlar belirli ve eyleme geçirilebilir olmalıdır. Raporlama sisteminin kötüye
kullanılması da hesap işlemine yol açabilir.

Rapor örnekleri:

- yanıltıcı meta veriler
- bildirilmemiş kimlik bilgisi veya izin gereksinimleri
- şüpheli yükleme talimatları
- dolandırıcılık amaçlı yorumlar veya kimliğe bürünme
- kötü niyetli kayıtlar veya ticari marka kötüye kullanımı
- [Kabul edilebilir kullanım](/tr/clawhub/acceptable-usage) kurallarını ihlal eden içerik

## Yayıncı ClawScan notları

Yayıncılar, bir skill veya plugin yayımlarken isteğe bağlı bir ClawScan notu
sağlayabilir. Bu not, ağ erişimi, yerel ana makine erişimi veya sağlayıcıya özel
kimlik bilgileri gibi aksi halde olağan dışı görünebilecek davranışlar için
ClawScan'e bağlam sağlar.

## Moderasyon Bekletmeleri

Statik tarayıcı yüklenen bir skill'i kötü amaçlı olarak işaretlediğinde, yayıncı
otomatik olarak moderasyon bekletmesine alınır (kullanıcı üzerinde
`requiresModerationAt` ayarlanır). Bu, yayıncının tüm Skills öğelerini gizler,
gelecekteki yayımların gizli başlamasına neden olur ve bir `user.moderation.auto`
denetim günlüğü girdisi oluşturur.

Statik şüpheli bulgular moderatörler için dosya/satır kanıtı olarak saklanır,
ancak tek başlarına içeriği gizlemez veya herkese açık tarama kararını belirlemez.
Yeni yüklemeler, LLM incelemesi sonuçlanana kadar inceleme/beklemede durumunda
kalır. Statik tarama yalnızca kötü amaçlı imzalar için hemen engeller.
VirusTotal motor isabetleri görünür güvenlik kanıtı olarak kalır, ancak
VirusTotal Code Insight/Palm kararları tavsiye niteliğindedir ve tek başına
Skills öğelerini gizlemez. ClawScan LLM incelemeleri, amaçla uyumlu notları
rehberlik olarak tutar. Orta düzey inceleme bulguları artefakt üzerinde görünür
kalırken, şüpheli filtresi yüksek etkili LLM endişeleri, kötü amaçlı bulgular
veya desteklenen AV motoru tespitleri için ayrılmıştır.

Yöneticiler yanlış pozitif bekletmeyi kaldırabilir:

```bash
npx convex run users:liftModerationHold '{"userId": "<user-id>", "reason": "False positive from security tool scanning"}'
```

Bu işlem `requiresModerationAt` ve `requiresModerationReason` değerlerini
temizler, kullanıcı düzeyindeki bekletme nedeniyle gizlenen Skills öğelerini geri
getirir ve bir `user.moderation.lift` denetim günlüğü girdisi yazar. Başka
nedenlerle gizlenen veya kendi statik taraması kötü amaçlı kalmaya devam eden
Skills öğeleri gizli kalır.

## Yasaklar ve hesap durumu

ClawHub politikasını ihlal eden hesaplar yayımlama erişimini kaybedebilir. Ağır
kötüye kullanım; hesap yasakları, token iptali, gizli içerik veya kaldırılmış
listelemelerle sonuçlanabilir.

Silinmiş, yasaklanmış veya devre dışı bırakılmış hesaplar ClawHub API token'larını
kullanamaz. Hesap işleminden sonra CLI kimlik doğrulaması başarısız olmaya
başlarsa, hesap durumunu incelemek için web kullanıcı arayüzünde oturum açın.
Oturum açma veya normal CLI erişimi engellenmişse, kurtarma incelemesi için
security@openclaw.ai ile iletişime geçin.

## Yayıncı rehberliği

Yanlış pozitifleri azaltmak ve kullanıcı güvenini artırmak için:

- adları, özetleri, etiketleri ve değişiklik günlüklerini doğru tutun
- gerekli ortam değişkenlerini ve izinleri bildirin
- bir sürümde olağan dışı ama kasıtlı davranış varsa yayıncı ClawScan notu ekleyin
- gizlenmiş yükleme komutlarından kaçının
- mümkün olduğunda kaynağa bağlantı verin
- plugin yayımlamadan önce deneme çalıştırmaları kullanın
- kullanıcılar veya moderatörler paket davranışı hakkında soru sorarsa net yanıt verin
