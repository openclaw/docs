---
read_when:
    - ClawHub tarama ve moderasyon sonuçlarını anlama
    - Bir beceri veya paket bildirme
    - Beklemeye alınmış, gizlenmiş veya engellenmiş bir listelemeyi kurtarma
summary: ClawHub güven, tarama, raporlama ve moderasyon davranışı.
x-i18n:
    generated_at: "2026-05-12T00:57:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 49e2650b23ff7657bb01c43fff50f3bb555b3bc7961b503b02a51096e2fceb27
    source_path: clawhub/security.md
    workflow: 16
---

# Güvenlik + Moderasyon

ClawHub yayımlamaya açıktır, ancak herkese açık listelemeler yine de güven,
tarama, raporlama ve moderasyon denetimlerinden geçer. Amaç pratiktir:
kullanıcıların ne kurduklarını incelemesine yardımcı olmak, yayıncılara yanlış
pozitifler için bir kurtarma yolu sunmak ve kötüye kullanım amaçlı paketleri
herkese açık keşif alanlarının dışında tutmak.

Ayrıca bkz. [Kabul edilebilir kullanım](/tr/clawhub/acceptable-usage).

## Kullanıcıların inceleyebilecekleri

Bir skill veya Plugin kurmadan önce, ClawHub listelemesinde şunları kontrol edin:

- sahip ve kaynak atfı
- en son sürüm ve değişiklik günlüğü
- gerekli ortam değişkenleri veya izinler
- Plugin'ler için uyumluluk meta verileri
- tarama veya moderasyon durumu
- gösterildiği yerlerde raporlar, yorumlar, yıldızlar, indirmeler ve kurulum sinyalleri

Yalnızca anladığınız ve güvendiğiniz içerikleri kurun.

## Tarama durumları

ClawHub, herkese açık sayfalarda ve sahiplerin görebildiği tanılamalarda tarama
veya moderasyon sonuçları gösterebilir.

Yaygın sonuçlar şunları içerir:

- `clean`: engelleyici bir sorun bulunmadı.
- `suspicious`: sürüm dikkat veya inceleme gerektiriyor.
- `malicious`: sürüm güvensiz kabul ediliyor.
- `pending`: kontroller henüz tamamlanmadı.
- `held`, `quarantined`, `revoked` veya `hidden`: sürüm herkese açık kurulum
  yüzeylerinde tam olarak kullanılabilir değildir.

Tam ifadeler yüzeye göre değişebilir, ancak pratik anlam aynıdır: bir sürüm
bekletiliyorsa veya engellenmişse, sahibi sorunu çözene ya da moderasyon sürümü
geri yükleyene kadar kullanıcılar onu kurmamalıdır.

## Skills

Skill taramaları yayımlanmış skill paketini, meta verileri, beyan edilen
gereksinimleri ve şüpheli yönergeleri inceler.

ClawHub, bir skill'in beyan ettiği şeylerle yapıyor gibi göründüğü şeyler
arasındaki uyuşmazlıklara özellikle dikkat eder. Örneğin, gerekli bir API
anahtarına başvuran bir skill, bu gereksinimi `SKILL.md` içinde beyan etmelidir;
böylece kullanıcılar kurulumdan önce bunu görebilir.

Tarama bulguları artefakt temellidir. Beyan edilmiş API kimlik bilgileri,
localhost OAuth geri çağrıları, kapsamlı kaldırma temizliği, Basic Auth
kodlaması veya belirtilen sağlayıcıya kullanıcı tarafından seçilen dosya
yüklemeleri gibi beklenen sağlayıcı davranışları; gizli kimlik bilgisi iletme,
geniş kapsamlı özel dosya erişimi, ilgisiz ağ hedefleri veya gizli tarayıcı
kötüye kullanımı gibi davranışlardan farklı şekilde ele alınır.

Bkz. [Skill biçimi](/tr/clawhub/skill-format).

## Plugin'ler

Plugin sürümleri paket meta verilerini, kaynak atfını, uyumluluk alanlarını ve
artefakt bütünlüğü bilgilerini içerir.

OpenClaw, ClawHub tarafından barındırılan Plugin'leri kurmadan önce uyumluluğu
kontrol eder. Paket kayıtları ayrıca OpenClaw'ın indirilen artefaktları
doğrulayabilmesi için özet meta verilerini de açığa çıkarabilir. ClawScan,
Plugin sürümlerini incelerken beyan edilen paket `openclaw.environment`
env/config meta verilerini içerir; böylece beyan edilen çalışma zamanı
gereksinimleri gözlemlenen davranışla karşılaştırılır.

## Raporlar

Oturum açmış kullanıcılar skill'leri, paketleri ve yorumları raporlayabilir.

Raporlar belirli ve uygulanabilir olmalıdır. Raporlamanın kötüye kullanılması da
hesap işlemine yol açabilir.

Rapor örnekleri:

- yanıltıcı meta veriler
- beyan edilmemiş kimlik bilgisi veya izin gereksinimleri
- şüpheli kurulum yönergeleri
- dolandırıcılık yorumları veya kimliğe bürünme
- kötü niyetli kayıtlar veya ticari marka kötüye kullanımı
- [Kabul edilebilir kullanım](/tr/clawhub/acceptable-usage) kurallarını ihlal eden içerik

## Yayıncı ClawScan notları

Yayıncılar bir skill veya Plugin yayımlarken isteğe bağlı bir ClawScan notu
sağlayabilir. Bu not, ağ erişimi, yerel ana makine erişimi veya sağlayıcıya özgü
kimlik bilgileri gibi aksi halde alışılmadık görünebilecek davranışlar için
ClawScan'e bağlam sağlar.

## Moderasyon Bekletmeleri

Statik tarayıcı yüklenen bir skill'i kötü amaçlı olarak işaretlediğinde, yayıncı
otomatik olarak bir moderasyon bekletmesine alınır (kullanıcıda
`requiresModerationAt` ayarlanır). Bu, yayıncının tüm skill'lerini gizler,
gelecekteki yayımların gizli başlamasına neden olur ve bir
`user.moderation.auto` denetim günlüğü girdisi oluşturur.

Statik şüpheli bulgular moderatörler için dosya/satır kanıtı olarak saklanır,
ancak içerikleri tek başlarına gizlemez veya herkese açık tarama kararını
belirlemez. Yeni yüklemeler, LLM incelemesi sonuçlanana kadar incelemede/beklemede
durumunda kalır. Statik tarama yalnızca kötü amaçlı imzalar için anında engeller.
VirusTotal motor eşleşmeleri görünür güvenlik kanıtı olarak kalır, ancak
VirusTotal Code Insight/Palm kararları tavsiye niteliğindedir ve skill'leri tek
başlarına gizlemez. ClawScan LLM incelemeleri amaca uygun notları rehberlik
olarak tutar. Orta düzey inceleme bulguları artefaktta görünür kalırken, şüpheli
filtresi yüksek etkili LLM endişeleri, kötü amaçlı bulgular veya doğrulanmış AV
motoru tespitleri için ayrılmıştır.

Yöneticiler yanlış pozitif bekletmesini kaldırabilir:

```bash
npx convex run users:liftModerationHold '{"userId": "<user-id>", "reason": "False positive from security tool scanning"}'
```

Bu, `requiresModerationAt` ve `requiresModerationReason` değerlerini temizler,
kullanıcı düzeyi bekletme nedeniyle gizlenen skill'leri geri yükler ve bir
`user.moderation.lift` denetim günlüğü girdisi yazar. Başka nedenlerle gizlenen
veya kendi statik taraması kötü amaçlı kalmaya devam eden skill'ler gizli kalır.

## Yasaklar ve hesap durumu

ClawHub politikasını ihlal eden hesaplar yayımlama erişimini kaybedebilir. Ağır
kötüye kullanım hesap yasaklarına, token iptaline, gizli içeriğe veya kaldırılmış
listelemelere neden olabilir.

Silinmiş, yasaklanmış veya devre dışı bırakılmış hesaplar ClawHub API token'larını
kullanamaz. Hesap işleminden sonra CLI kimlik doğrulaması başarısız olmaya
başlarsa, hesap durumunu gözden geçirmek için web UI'da oturum açın. Oturum açma
veya normal CLI erişimi engellenmişse, kurtarma incelemesi için
security@openclaw.ai ile iletişime geçin.

## Yayıncı kılavuzu

Yanlış pozitifleri azaltmak ve kullanıcı güvenini artırmak için:

- adları, özetleri, etiketleri ve değişiklik günlüklerini doğru tutun
- gerekli ortam değişkenlerini ve izinleri beyan edin
- bir sürümde alışılmadık ancak kasıtlı davranış varsa yayıncı ClawScan notu ekleyin
- gizlenmiş kurulum komutlarından kaçının
- mümkün olduğunda kaynağa bağlantı verin
- Plugin'leri yayımlamadan önce deneme çalıştırmaları kullanın
- kullanıcılar veya moderatörler paket davranışı hakkında soru sorarsa açık yanıt verin
