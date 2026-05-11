---
read_when:
    - ClawHub tarama ve moderasyon sonuçlarını anlama
    - Bir beceriyi veya paketi bildirme
    - Beklemeye alınmış, gizlenmiş veya engellenmiş bir listelemeyi kurtarma
summary: ClawHub güven, tarama, raporlama, itiraz ve moderasyon davranışı.
x-i18n:
    generated_at: "2026-05-11T20:24:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: cf88073ce581f25c93b2fe0067ebd2bb1a481c8c927d65a06943a38d33e3425e
    source_path: clawhub/security.md
    workflow: 16
---

# Güvenlik + Moderasyon

ClawHub yayınlamaya açıktır, ancak herkese açık listelemeler yine de güven,
tarama, raporlama ve moderasyon denetimlerinden geçer. Amaç pratiktir: kullanıcıların
yükledikleri şeyi incelemesine yardımcı olmak, yayıncılara yanlış pozitifler için bir kurtarma yolu sunmak
ve kötüye kullanılan paketleri herkese açık keşif alanlarının dışında tutmak.

Ayrıca bkz. [Kabul edilebilir kullanım](/tr/clawhub/acceptable-usage).

## Kullanıcılar neleri inceleyebilir

Bir skill veya plugin yüklemeden önce, ClawHub listelemesinde şunları kontrol edin:

- sahip ve kaynak atfı
- en son sürüm ve değişiklik günlüğü
- gerekli ortam değişkenleri veya izinler
- pluginler için uyumluluk meta verileri
- tarama veya moderasyon durumu
- gösterildiği yerlerde raporlar, yorumlar, yıldızlar, indirmeler ve yükleme sinyalleri

Yalnızca anladığınız ve güvendiğiniz içerikleri yükleyin.

## Tarama durumları

ClawHub, herkese açık sayfalarda ve sahibin görebildiği tanılarda tarama veya moderasyon sonuçlarını gösterebilir.

Yaygın sonuçlar şunları içerir:

- `clean`: engelleyici bir sorun bulunmadı.
- `suspicious`: sürüm dikkat veya inceleme gerektiriyor.
- `malicious`: sürüm güvensiz kabul ediliyor.
- `pending`: kontroller henüz tamamlanmadı.
- `held`, `quarantined`, `revoked` veya `hidden`: sürüm herkese açık yükleme yüzeylerinde tamamen
  kullanılamaz.

Tam ifadeler yüzeye göre değişebilir, ancak pratik anlam aynıdır: bir sürüm
bekletiliyor veya engelleniyorsa, sahip sorunu çözene ya da moderasyon onu geri yükleyene kadar kullanıcılar
onu yüklememelidir.

## Skills

Skill taramaları yayımlanan skill paketini, meta verileri, bildirilen
gereksinimleri ve şüpheli talimatları inceler.

ClawHub, bir skill’in bildirdiği şey ile yaptığı görünen şey arasındaki uyumsuzluklara özel dikkat gösterir.
Örneğin, gerekli bir API anahtarına referans veren bir skill, bu gereksinimi `SKILL.md` içinde bildirmelidir;
böylece kullanıcılar yüklemeden önce bunu görebilir.

Tarama bulguları yapıta dayalıdır. Bildirilen API kimlik bilgileri, localhost OAuth geri çağrıları,
kapsamlı kaldırma temizliği, Basic Auth kodlaması veya belirtilen sağlayıcıya kullanıcı tarafından seçilen dosya yüklemeleri gibi beklenen sağlayıcı davranışları;
gizli kimlik bilgisi iletimi, geniş özel dosya erişimi,
ilgisi olmayan ağ hedefleri veya gizli tarayıcı kötüye kullanımı gibi durumlardan farklı ele alınır.

Bkz. [Skill biçimi](/tr/clawhub/skill-format).

## Pluginler

Plugin sürümleri paket meta verilerini, kaynak atfını, uyumluluk
alanlarını ve yapı bütünlüğü bilgilerini içerir.

OpenClaw, ClawHub tarafından barındırılan pluginleri yüklemeden önce uyumluluğu kontrol eder. Paket
kayıtları, OpenClaw’ın indirilen yapıtları doğrulayabilmesi için özet meta verilerini de gösterebilir.
ClawScan, plugin sürümlerini incelerken bildirilen paket `openclaw.environment` env/config
meta verilerini içerir; böylece bildirilen çalışma zamanı gereksinimleri
gözlemlenen davranışla karşılaştırılır.

## Raporlar

Oturum açmış kullanıcılar skill’leri, paketleri ve yorumları raporlayabilir.

Raporlar spesifik ve eyleme dönüştürülebilir olmalıdır. Raporlamanın kötüye kullanılması da
hesap işlemine yol açabilir.

Rapor örnekleri:

- yanıltıcı meta veriler
- bildirilmemiş kimlik bilgisi veya izin gereksinimleri
- şüpheli yükleme talimatları
- dolandırıcılık yorumları veya kimliğe bürünme
- kötü niyetli kayıtlar veya ticari marka kötüye kullanımı
- [Kabul edilebilir kullanım](/tr/clawhub/acceptable-usage) kurallarını ihlal eden içerik

## Kötü niyetli veya ticari marka raporları

ClawHub, kötü niyetli kayıtlar, kimliğe bürünme ve ticari markayla ilgili anlaşmazlıklar için aynı rapor ve ekip moderasyon hattını kullanır. Bu raporların,
ekibin talep sahibini, ihtilaflı listelemeyi ve istenen eylemi belirleyebilmesi için
yeterli bağlam içermesi gerekir.

Şunları ekleyin:

- kanonik ClawHub skill veya paket URL’si ve sahip kullanıcı adı
- söz konusu ticari marka, proje, şirket veya ürün adı
- talep sahibinin sahipliğine veya yetkisine dair herkese açık kanıt
- mevcut sahibin bu ad altında yayın yapmaya neden yetkili olmadığı
- inceleme beklerken gizleme, sahipliği devretme, yeniden adlandırma
  veya kaldırma gibi istenen eylem

Herkese açık raporlara özel sırlar veya hassas hukuki belgeler koymayın. Hassas olmayan kanıtlarla bir GitHub issue açın ve gerektiğinde özel
devir yolu için bakımcılara danışın.

## İtirazlar ve yeniden taramalar

Sahipler, bir skill veya paketin yanlışlıkla bekletildiğini ya da işaretlendiğini düşündüklerinde
yeniden tarama isteyebilir. Platform moderatörleri ve yöneticileri, raporları veya destek isteklerini ele alırken herhangi bir
skill veya paket için yeniden tarama isteyebilir:

```bash
clawhub skill rescan <slug>
clawhub package rescan <name>
```

Moderasyona alınmış içerikler için sahipler, sahibin görebildiği ClawHub yüzeylerinden bir itiraz gönderebilir. İtirazlar neyin değiştiğini veya
işaretin neden yanlış olduğunu açıklamalıdır.

## Moderasyon Bekletmeleri

Statik tarayıcı, yüklenen bir skill’i kötü amaçlı olarak işaretlediğinde, yayıncı
otomatik olarak bir moderasyon bekletmesine alınır (`requiresModerationAt`, kullanıcı üzerinde ayarlanır).
Bu, yayıncının tüm skill’lerini gizler, gelecekteki yayımların
gizli başlamasına neden olur ve bir `user.moderation.auto` denetim günlüğü girdisi oluşturur.

Statik şüpheli bulgular moderatörler için dosya/satır kanıtı olarak saklanır,
ancak tek başlarına içeriği gizlemez veya herkese açık tarama kararını belirlemez.
Yeni yüklemeler, LLM incelemesi sonuçlanana kadar incelemede/beklemede kalır. Statik
tarama yalnızca kötü amaçlı imzalar için hemen engeller. VirusTotal motor
isabetleri görünür güvenlik kanıtı olarak kalır, ancak VirusTotal Code Insight/Palm
kararları tavsiye niteliğindedir ve tek başına skill’leri gizlemez. ClawScan LLM incelemeleri
amaca uygun notları rehberlik olarak tutar. Orta düzey inceleme bulguları
yapıt üzerinde görünür kalırken, şüpheli filtresi yüksek etkili LLM
kaygıları, kötü amaçlı bulgular veya doğrulanmış AV motoru tespitleri için ayrılmıştır.

Yöneticiler yanlış pozitif bekletmesini kaldırabilir:

```bash
npx convex run users:liftModerationHold '{"userId": "<user-id>", "reason": "False positive from security tool scanning"}'
```

Bu işlem `requiresModerationAt` ve `requiresModerationReason` değerlerini temizler, kullanıcı düzeyindeki bekletme nedeniyle gizlenen
skill’leri geri yükler ve bir `user.moderation.lift` denetim
günlüğü girdisi yazar. Başka nedenlerle gizlenen veya kendi statik taraması hâlâ
kötü amaçlı olan skill’ler gizli kalır.

## Yasaklar ve hesap durumu

ClawHub politikasını ihlal eden hesaplar yayımlama erişimini kaybedebilir. Ciddi kötüye kullanım
hesap yasaklarına, token iptaline, gizli içeriğe veya kaldırılan
listelemelere yol açabilir.

Silinmiş, yasaklanmış veya devre dışı bırakılmış hesaplar ClawHub API token’larını kullanamaz. CLI kimlik doğrulaması
hesap işleminden sonra başarısız olmaya başlarsa, hesap
durumunu incelemek için web UI’da oturum açın veya beklenen proje destek kanalı üzerinden bakımcılarla iletişime geçin.

## Yayıncı rehberi

Yanlış pozitifleri azaltmak ve kullanıcı güvenini artırmak için:

- adları, özetleri, etiketleri ve değişiklik günlüklerini doğru tutun
- gerekli ortam değişkenlerini ve izinleri bildirin
- gizlenmiş yükleme komutlarından kaçının
- mümkün olduğunda kaynağa bağlantı verin
- pluginleri yayımlamadan önce deneme çalıştırmaları kullanın
- kullanıcılar veya moderatörler paket davranışı hakkında soru sorarsa açıkça yanıt verin
