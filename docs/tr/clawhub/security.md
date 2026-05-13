---
read_when:
    - ClawHub tarama ve moderasyon sonuçlarını anlama
    - Bir beceriyi veya paketi bildirme
    - Beklemeye alınmış, gizlenmiş veya engellenmiş bir listelemeyi kurtarma
summary: ClawHub güven, tarama, raporlama ve moderasyon davranışı.
x-i18n:
    generated_at: "2026-05-13T05:33:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 49e2650b23ff7657bb01c43fff50f3bb555b3bc7961b503b02a51096e2fceb27
    source_path: clawhub/security.md
    workflow: 16
---

# Güvenlik + Moderasyon

ClawHub yayımlamaya açıktır, ancak herkese açık listelemeler yine de güven,
tarama, raporlama ve moderasyon denetimlerinden geçer. Amaç pratiktir: kullanıcıların
yüklediklerini incelemesine yardımcı olmak, yayıncılara yanlış pozitifler için
bir kurtarma yolu sunmak ve kötüye kullanım amaçlı paketleri herkese açık
keşif alanlarının dışında tutmak.

Ayrıca bkz. [Kabul edilebilir kullanım](/tr/clawhub/acceptable-usage).

## Kullanıcıların inceleyebilecekleri

Bir skill veya plugin yüklemeden önce, ClawHub listesini şunlar için kontrol edin:

- sahip ve kaynak atfı
- en son sürüm ve değişiklik günlüğü
- gerekli ortam değişkenleri veya izinler
- plugin'ler için uyumluluk meta verileri
- tarama veya moderasyon durumu
- gösterildiği yerlerde raporlar, yorumlar, yıldızlar, indirmeler ve yükleme sinyalleri

Yalnızca anladığınız ve güvendiğiniz içerikleri yükleyin.

## Tarama durumları

ClawHub herkese açık sayfalarda ve sahiplerin görebildiği tanılamalarda tarama
veya moderasyon sonuçlarını gösterebilir.

Yaygın sonuçlar şunları içerir:

- `clean`: engelleyici bir sorun bulunmadı.
- `suspicious`: sürüm dikkat veya inceleme gerektirir.
- `malicious`: sürüm güvensiz kabul edilir.
- `pending`: kontroller henüz tamamlanmadı.
- `held`, `quarantined`, `revoked` veya `hidden`: sürüm herkese açık yükleme
  yüzeylerinde tamamen kullanılabilir değildir.

Tam ifade yüzeye göre değişebilir, ancak pratik anlam aynıdır: bir sürüm
bekletiliyorsa veya engellenmişse, kullanıcılar sahip sorunu çözene ya da
moderasyon sürümü geri yükleyene kadar onu yüklememelidir.

## Skills

Skill taramaları yayımlanan skill paketini, meta verileri, bildirilen
gereksinimleri ve şüpheli talimatları inceler.

ClawHub bir skill'in bildirdikleri ile yapıyor göründükleri arasındaki
uyumsuzluklara özellikle dikkat eder. Örneğin, gerekli bir API anahtarına
atıfta bulunan bir skill, kullanıcıların yüklemeden önce görebilmesi için bu
gereksinimi `SKILL.md` içinde bildirmelidir.

Tarama bulguları yapıt temellidir. Bildirilmiş API kimlik bilgileri, localhost
OAuth geri çağrıları, kapsamlı kaldırma temizliği, Basic Auth kodlaması veya
belirtilen sağlayıcıya kullanıcı tarafından seçilen dosya yüklemeleri gibi
beklenen sağlayıcı davranışları; gizli kimlik bilgisi yönlendirme, geniş özel
dosya erişimi, ilgisiz ağ hedefleri veya gizli tarayıcı kötüye kullanımından
farklı değerlendirilir.

Bkz. [Skill biçimi](/tr/clawhub/skill-format).

## Plugins

Plugin sürümleri paket meta verilerini, kaynak atfını, uyumluluk alanlarını ve
yapıt bütünlüğü bilgilerini içerir.

OpenClaw, ClawHub tarafından barındırılan plugin'leri yüklemeden önce
uyumluluğu kontrol eder. Paket kayıtları, OpenClaw'ın indirilen yapıtları
doğrulayabilmesi için özet meta verilerini de açığa çıkarabilir. ClawScan,
plugin sürümlerini incelerken bildirilen paket `openclaw.environment` env/config
meta verilerini içerir; böylece bildirilen çalışma zamanı gereksinimleri
gözlemlenen davranışla karşılaştırılır.

## Raporlar

Oturum açmış kullanıcılar skill'leri, paketleri ve yorumları raporlayabilir.

Raporlar belirli ve uygulanabilir olmalıdır. Raporlamanın kötüye kullanımı da
hesap işlemine yol açabilir.

Rapor örnekleri:

- yanıltıcı meta veriler
- bildirilmemiş kimlik bilgisi veya izin gereksinimleri
- şüpheli yükleme talimatları
- dolandırıcılık yorumları veya kimliğe bürünme
- kötü niyetli kayıtlar veya ticari marka kötüye kullanımı
- [Kabul edilebilir kullanım](/tr/clawhub/acceptable-usage) ilkesini ihlal eden içerik

## Yayıncı ClawScan notları

Yayıncılar bir skill veya plugin yayımlarken isteğe bağlı bir ClawScan notu
sağlayabilir. Bu not, ClawScan'e ağ erişimi, yerel host erişimi veya
sağlayıcıya özgü kimlik bilgileri gibi aksi halde olağandışı görünebilecek
davranışlar için bağlam sağlar.

## Moderasyon bekletmeleri

Statik tarayıcı yüklenen bir skill'i kötü amaçlı olarak işaretlediğinde,
yayıncı otomatik olarak moderasyon bekletmesine alınır (`requiresModerationAt`
kullanıcı üzerinde ayarlanır). Bu, yayıncının tüm skill'lerini gizler, gelecekteki
yayımlamaların gizli başlamasına neden olur ve bir `user.moderation.auto`
denetim günlüğü girdisi oluşturur.

Statik şüpheli bulgular moderatörler için dosya/satır kanıtı olarak saklanır,
ancak tek başlarına içeriği gizlemez veya herkese açık tarama kararını belirlemez.
Yeni yüklemeler, LLM incelemesi sonuçlanana kadar incelemede/beklemede durumunda
kalır. Statik tarama yalnızca kötü amaçlı imzalar için hemen engeller.
VirusTotal motor isabetleri görünür güvenlik kanıtı olarak kalır, ancak
VirusTotal Code Insight/Palm kararları tavsiye niteliğindedir ve tek başlarına
skill'leri gizlemez. ClawScan LLM incelemeleri, amaçla uyumlu notları rehberlik
olarak tutar. Orta düzey inceleme bulguları yapıt üzerinde görünür kalırken,
şüpheli filtresi yüksek etkili LLM endişeleri, kötü amaçlı bulgular veya
desteklenen AV motoru tespitleri için ayrılmıştır.

Yöneticiler yanlış pozitif bekletmesini kaldırabilir:

```bash
npx convex run users:liftModerationHold '{"userId": "<user-id>", "reason": "False positive from security tool scanning"}'
```

Bu, `requiresModerationAt` ve `requiresModerationReason` alanlarını temizler,
kullanıcı düzeyindeki bekletme nedeniyle gizlenen skill'leri geri yükler ve
bir `user.moderation.lift` denetim günlüğü girdisi yazar. Başka nedenlerle
gizlenen veya kendi statik taraması kötü amaçlı kalmaya devam eden skill'ler
gizli kalır.

## Yasaklar ve hesap durumu

ClawHub ilkesini ihlal eden hesaplar yayımlama erişimini kaybedebilir. Ağır
kötüye kullanım hesap yasaklarına, token iptaline, gizli içeriğe veya kaldırılan
listelemelere yol açabilir.

Silinmiş, yasaklanmış veya devre dışı bırakılmış hesaplar ClawHub API token'larını
kullanamaz. CLI kimlik doğrulaması hesap işleminden sonra başarısız olmaya
başlarsa, hesap durumunu gözden geçirmek için web UI'da oturum açın. Oturum
açma veya normal CLI erişimi engellenmişse, kurtarma incelemesi için
security@openclaw.ai ile iletişime geçin.

## Yayıncı rehberliği

Yanlış pozitifleri azaltmak ve kullanıcı güvenini artırmak için:

- adları, özetleri, etiketleri ve değişiklik günlüklerini doğru tutun
- gerekli ortam değişkenlerini ve izinleri bildirin
- bir sürümde olağandışı ancak amaçlı davranış varsa yayıncı ClawScan notu ekleyin
- gizlenmiş yükleme komutlarından kaçının
- mümkün olduğunda kaynağa bağlantı verin
- plugin'leri yayımlamadan önce dry run kullanın
- kullanıcılar veya moderatörler paket davranışı hakkında soru sorarsa açık yanıt verin
