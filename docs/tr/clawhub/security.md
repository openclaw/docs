---
read_when:
    - ClawHub tarama ve moderasyon sonuçlarını anlama
    - Bir beceriyi veya paketi bildirme
    - Beklemeye alınmış, gizlenmiş veya engellenmiş bir listelemeden kurtarma
summary: ClawHub güven, tarama, raporlama ve moderasyon davranışı.
x-i18n:
    generated_at: "2026-05-11T22:19:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: 49e2650b23ff7657bb01c43fff50f3bb555b3bc7961b503b02a51096e2fceb27
    source_path: clawhub/security.md
    workflow: 16
---

# Güvenlik + Moderasyon

ClawHub yayımlamaya açıktır, ancak herkese açık listelemeler yine de güven,
tarama, bildirim ve moderasyon kontrollerinden geçer. Amaç pratiktir:
kullanıcıların kurdukları şeyi incelemesine yardımcı olmak, yayıncılara hatalı
pozitifler için bir düzeltme yolu sunmak ve kötüye kullanılan paketleri herkese
açık keşif alanının dışında tutmak.

Ayrıca bkz. [Kabul edilebilir kullanım](/tr/clawhub/acceptable-usage).

## Kullanıcılar neleri inceleyebilir

Bir skill veya plugin kurmadan önce, ClawHub listelemesinde şunları kontrol edin:

- sahip ve kaynak atfı
- en son sürüm ve değişiklik günlüğü
- gerekli ortam değişkenleri veya izinler
- plugin'ler için uyumluluk meta verileri
- tarama veya moderasyon durumu
- gösterildiği yerlerde raporlar, yorumlar, yıldızlar, indirmeler ve kurulum sinyalleri

Yalnızca anladığınız ve güvendiğiniz içeriği kurun.

## Tarama durumları

ClawHub herkese açık sayfalarda ve sahiplerin görebildiği tanılamalarda tarama
veya moderasyon sonuçlarını gösterebilir.

Yaygın sonuçlar şunları içerir:

- `clean`: engelleyici bir sorun bulunmadı.
- `suspicious`: sürüm dikkat veya inceleme gerektiriyor.
- `malicious`: sürüm güvensiz kabul ediliyor.
- `pending`: kontroller henüz tamamlanmadı.
- `held`, `quarantined`, `revoked` veya `hidden`: sürüm herkese açık kurulum
  yüzeylerinde tamamen kullanılabilir değildir.

Tam ifade yüzeye göre değişebilir, ancak pratik anlam aynıdır: bir sürüm
tutuluyor veya engelleniyorsa, sahip sorunu çözene ya da moderasyon sürümü geri
yükleyene kadar kullanıcılar onu kurmamalıdır.

## Skills

Skill taramaları yayımlanmış skill paketine, meta verilere, beyan edilen
gereksinimlere ve şüpheli talimatlara bakar.

ClawHub, bir skill'in beyan ettiği şey ile yaptığı görünen şey arasındaki
uyumsuzluklara özellikle dikkat eder. Örneğin, gerekli bir API anahtarına
başvuran bir skill, kullanıcıların kurmadan önce görebilmesi için bu gereksinimi
`SKILL.md` içinde beyan etmelidir.

Tarama bulguları artefakt temellidir. Beyan edilmiş API kimlik bilgileri,
localhost OAuth geri çağrıları, kapsamlı kaldırma temizliği, Basic Auth
kodlaması veya belirtilen sağlayıcıya kullanıcı tarafından seçilen dosya
yüklemeleri gibi beklenen sağlayıcı davranışları; gizli kimlik bilgisi
iletiminden, geniş özel dosya erişiminden, ilgisiz ağ hedeflerinden veya gizli
tarayıcı kötüye kullanımından farklı değerlendirilir.

Bkz. [Skill biçimi](/tr/clawhub/skill-format).

## Plugin'ler

Plugin sürümleri paket meta verilerini, kaynak atfını, uyumluluk alanlarını ve
artefakt bütünlüğü bilgilerini içerir.

OpenClaw, ClawHub üzerinde barındırılan plugin'leri kurmadan önce uyumluluğu
kontrol eder. Paket kayıtları ayrıca OpenClaw'ın indirilen artefaktları
doğrulayabilmesi için özet meta verilerini de gösterebilir. ClawScan, plugin
sürümlerini incelerken beyan edilen paket `openclaw.environment` env/config meta
verilerini içerir; böylece beyan edilen çalışma zamanı gereksinimleri gözlemlenen
davranışla karşılaştırılır.

## Raporlar

Oturum açmış kullanıcılar skill'leri, paketleri ve yorumları raporlayabilir.

Raporlar belirli ve uygulanabilir olmalıdır. Raporlamanın kötüye kullanılması da
hesap işlemine yol açabilir.

Rapor örnekleri:

- yanıltıcı meta veriler
- beyan edilmemiş kimlik bilgisi veya izin gereksinimleri
- şüpheli kurulum talimatları
- dolandırıcılık amaçlı yorumlar veya kimliğe bürünme
- kötü niyetli kayıtlar veya ticari marka kötüye kullanımı
- [Kabul edilebilir kullanım](/tr/clawhub/acceptable-usage) ilkesini ihlal eden içerik

## Yayıncı ClawScan notları

Yayıncılar, bir skill veya plugin yayımlarken isteğe bağlı bir ClawScan notu
sağlayabilir. Bu not ClawScan'e ağ erişimi, yerel ana makine erişimi veya
sağlayıcıya özgü kimlik bilgileri gibi aksi halde olağandışı görünebilecek
davranışlar için bağlam verir.

## Moderasyon Tutmaları

Statik tarayıcı yüklenen bir skill'i kötü amaçlı olarak işaretlediğinde, yayıncı
otomatik olarak bir moderasyon tutmasına alınır (`requiresModerationAt` kullanıcı
üzerinde ayarlanır). Bu, yayıncının tüm skill'lerini gizler, gelecekteki
yayımlamaların gizli başlamasına neden olur ve bir `user.moderation.auto` denetim
günlüğü girdisi oluşturur.

Statik şüpheli bulgular moderatörler için dosya/satır kanıtı olarak saklanır,
ancak tek başlarına içeriği gizlemez veya herkese açık tarama kararını belirlemez.
Yeni yüklemeler, LLM incelemesi sonuçlanana kadar inceleme/beklemede durumunda
kalır. Statik tarama yalnızca kötü amaçlı imzalar için anında engeller.
VirusTotal motor eşleşmeleri görünür güvenlik kanıtı olarak kalır, ancak
VirusTotal Code Insight/Palm kararları tavsiye niteliğindedir ve tek başına
skill'leri gizlemez. ClawScan LLM incelemeleri, amaçla uyumlu notları rehberlik
olarak korur. Orta düzey inceleme bulguları artefakt üzerinde görünür kalırken,
şüpheli filtresi yüksek etkili LLM endişeleri, kötü amaçlı bulgular veya
desteklenmiş AV motoru tespitleri için ayrılmıştır.

Yöneticiler hatalı pozitif bir tutmayı kaldırabilir:

```bash
npx convex run users:liftModerationHold '{"userId": "<user-id>", "reason": "False positive from security tool scanning"}'
```

Bu işlem `requiresModerationAt` ve `requiresModerationReason` değerlerini
temizler, kullanıcı düzeyindeki tutma nedeniyle gizlenen skill'leri geri yükler
ve bir `user.moderation.lift` denetim günlüğü girdisi yazar. Başka nedenlerle
gizlenen veya kendi statik taraması hâlâ kötü amaçlı olan skill'ler gizli kalır.

## Yasaklar ve hesap durumu

ClawHub politikasını ihlal eden hesaplar yayımlama erişimini kaybedebilir. Ağır
kötüye kullanım hesap yasaklarına, token iptaline, gizli içeriğe veya kaldırılmış
listelemelere yol açabilir.

Silinmiş, yasaklanmış veya devre dışı bırakılmış hesaplar ClawHub API token'larını
kullanamaz. CLI kimlik doğrulaması hesap işleminden sonra başarısız olmaya
başlarsa, hesap durumunu incelemek için web kullanıcı arayüzünde oturum açın.
Oturum açma veya normal CLI erişimi engellenmişse, kurtarma incelemesi için
security@openclaw.ai ile iletişime geçin.

## Yayıncı rehberi

Hatalı pozitifleri azaltmak ve kullanıcı güvenini artırmak için:

- adları, özetleri, etiketleri ve değişiklik günlüklerini doğru tutun
- gerekli ortam değişkenlerini ve izinleri beyan edin
- bir sürüm olağandışı ancak kasıtlı davranışa sahipse yayıncı ClawScan notu ekleyin
- gizlenmiş kurulum komutlarından kaçının
- mümkün olduğunda kaynağa bağlantı verin
- plugin yayımlamadan önce dry run kullanın
- kullanıcılar veya moderatörler paket davranışı hakkında soru sorarsa açık yanıt verin
