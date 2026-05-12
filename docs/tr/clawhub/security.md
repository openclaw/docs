---
read_when:
    - ClawHub tarama ve moderasyon sonuçlarını anlama
    - Bir beceriyi veya paketi bildirme
    - Beklemeye alınmış, gizlenmiş veya engellenmiş bir listelemeyi kurtarma
summary: ClawHub güven, tarama, raporlama ve moderasyon davranışı.
x-i18n:
    generated_at: "2026-05-12T15:42:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 49e2650b23ff7657bb01c43fff50f3bb555b3bc7961b503b02a51096e2fceb27
    source_path: clawhub/security.md
    workflow: 16
---

# Güvenlik + Moderasyon

ClawHub yayımlamaya açıktır, ancak herkese açık listelemeler yine de güven,
tarama, raporlama ve moderasyon denetimlerinden geçer. Hedef pratiktir:
kullanıcıların yüklediklerini incelemesine yardımcı olmak, yayıncılara yanlış
pozitifler için bir kurtarma yolu sunmak ve kötüye kullanılan paketleri herkese
açık keşif alanlarının dışında tutmak.

Ayrıca bkz. [Kabul edilebilir kullanım](/tr/clawhub/acceptable-usage).

## Kullanıcıların inceleyebilecekleri

Bir beceri veya plugin yüklemeden önce, ClawHub listelemesinde şunları kontrol edin:

- sahip ve kaynak atfı
- en son sürüm ve değişiklik günlüğü
- gerekli ortam değişkenleri veya izinler
- pluginler için uyumluluk meta verileri
- tarama veya moderasyon durumu
- gösterildiği yerlerde raporlar, yorumlar, yıldızlar, indirmeler ve yükleme sinyalleri

Yalnızca anladığınız ve güvendiğiniz içerikleri yükleyin.

## Tarama durumları

ClawHub, herkese açık sayfalarda ve sahip tarafından görülebilen tanılarda
tarama veya moderasyon sonuçlarını gösterebilir.

Yaygın sonuçlar şunlardır:

- `clean`: engelleyici bir sorun bulunmadı.
- `suspicious`: sürüm dikkat veya inceleme gerektirir.
- `malicious`: sürüm güvensiz kabul edilir.
- `pending`: kontroller henüz tamamlanmadı.
- `held`, `quarantined`, `revoked` veya `hidden`: sürüm herkese açık yükleme
  yüzeylerinde tam olarak kullanılabilir değildir.

Tam ifadeler yüzeye göre değişebilir, ancak pratik anlam aynıdır: bir sürüm
tutuluyorsa veya engellenmişse, sahip sorunu çözene ya da moderasyon sürümü geri
yükleyene kadar kullanıcılar bunu yüklememelidir.

## Skills

Beceri taramaları yayımlanan beceri paketini, meta verileri, bildirilen
gereksinimleri ve şüpheli talimatları inceler.

ClawHub, bir becerinin bildirdiği şey ile yapıyor gibi göründüğü şey arasındaki
uyumsuzluklara özellikle dikkat eder. Örneğin, gerekli bir API anahtarına
başvuran bir beceri, kullanıcıların yüklemeden önce görebilmesi için bu
gereksinimi `SKILL.md` içinde bildirmelidir.

Tarama bulguları yapıt temellidir. Bildirilen API kimlik bilgileri, localhost
OAuth geri çağrıları, kapsamlı kaldırma temizliği, Basic Auth kodlaması veya
kullanıcı tarafından belirtilen sağlayıcıya seçilmiş dosya yüklemeleri gibi
beklenen sağlayıcı davranışları; gizli kimlik bilgisi iletimi, geniş kapsamlı
özel dosya erişimi, ilgisiz ağ hedefleri veya gizli tarayıcı kötüye kullanımı
gibi davranışlardan farklı değerlendirilir.

Bkz. [Beceri biçimi](/tr/clawhub/skill-format).

## Pluginler

Plugin sürümleri paket meta verilerini, kaynak atfını, uyumluluk alanlarını ve
yapıt bütünlüğü bilgilerini içerir.

OpenClaw, ClawHub üzerinde barındırılan pluginleri yüklemeden önce uyumluluğu
kontrol eder. Paket kayıtları, OpenClaw'ın indirilen yapıtları doğrulayabilmesi
için özet meta verilerini de sunabilir. ClawScan, plugin sürümlerini incelerken
bildirilen paket `openclaw.environment` ortam/yapılandırma meta verilerini
içerir; böylece bildirilen çalışma zamanı gereksinimleri gözlemlenen davranışla
karşılaştırılır.

## Raporlar

Oturum açmış kullanıcılar becerileri, paketleri ve yorumları raporlayabilir.

Raporlar belirli ve eyleme dönüştürülebilir olmalıdır. Raporlamanın kötüye
kullanılması da hesap işlemine yol açabilir.

Rapor örnekleri:

- yanıltıcı meta veriler
- bildirilmemiş kimlik bilgisi veya izin gereksinimleri
- şüpheli yükleme talimatları
- dolandırıcılık amaçlı yorumlar veya kimliğe bürünme
- kötü niyetli kayıtlar veya marka hakkı kötüye kullanımı
- [Kabul edilebilir kullanım](/tr/clawhub/acceptable-usage) koşullarını ihlal eden içerik

## Yayıncı ClawScan notları

Yayıncılar, bir beceri veya plugin yayımlarken isteğe bağlı bir ClawScan notu
sağlayabilir. Bu not, ClawScan'e ağ erişimi, yerel ana makine erişimi veya
sağlayıcıya özgü kimlik bilgileri gibi aksi halde olağan dışı görünebilecek
davranışlar için bağlam sağlar.

## Moderasyon tutmaları

Statik tarayıcı yüklenen bir beceriyi kötü amaçlı olarak işaretlediğinde,
yayıncı otomatik olarak bir moderasyon tutmasına alınır (kullanıcı üzerinde
`requiresModerationAt` ayarlanır). Bu, yayıncının tüm becerilerini gizler,
gelecekteki yayımlamaların gizli başlamasına neden olur ve bir
`user.moderation.auto` denetim günlüğü girdisi oluşturur.

Statik şüpheli bulgular moderatörler için dosya/satır kanıtı olarak saklanır,
ancak tek başlarına içeriği gizlemez veya herkese açık tarama kararını
belirlemezler. Yeni yüklemeler, LLM incelemesi sonuçlanana kadar
inceleme/beklemede durumunda kalır. Statik tarama yalnızca kötü amaçlı imzalar
için anında engeller. VirusTotal motor isabetleri görünür güvenlik kanıtı olarak
kalır, ancak VirusTotal Code Insight/Palm kararları danışma niteliğindedir ve
tek başına becerileri gizlemez. ClawScan LLM incelemeleri, amaca uygun notları
rehberlik olarak tutar. Orta düzey inceleme bulguları yapıt üzerinde görünür
kalırken, şüpheli filtresi yüksek etkili LLM endişeleri, kötü amaçlı bulgular
veya doğrulanmış AV motoru tespitleri için ayrılmıştır.

Yöneticiler yanlış pozitif bir tutmayı kaldırabilir:

```bash
npx convex run users:liftModerationHold '{"userId": "<user-id>", "reason": "False positive from security tool scanning"}'
```

Bu işlem `requiresModerationAt` ve `requiresModerationReason` alanlarını
temizler, kullanıcı düzeyi tutma nedeniyle gizlenen becerileri geri yükler ve
bir `user.moderation.lift` denetim günlüğü girdisi yazar. Başka nedenlerle
gizlenmiş olan veya kendi statik taraması hâlâ kötü amaçlı kalan beceriler gizli
kalır.

## Yasaklar ve hesap durumu

ClawHub politikasını ihlal eden hesaplar yayımlama erişimini kaybedebilir. Ağır
kötüye kullanım hesap yasaklarına, token iptaline, gizli içeriğe veya kaldırılmış
listelemelere yol açabilir.

Silinmiş, yasaklanmış veya devre dışı bırakılmış hesaplar ClawHub API tokenlarını
kullanamaz. Hesap işleminden sonra CLI kimlik doğrulaması başarısız olmaya
başlarsa, hesap durumunu gözden geçirmek için web arayüzünde oturum açın. Oturum
açma veya normal CLI erişimi engellenmişse, kurtarma incelemesi için
security@openclaw.ai ile iletişime geçin.

## Yayıncı rehberi

Yanlış pozitifleri azaltmak ve kullanıcı güvenini artırmak için:

- adları, özetleri, etiketleri ve değişiklik günlüklerini doğru tutun
- gerekli ortam değişkenlerini ve izinleri bildirin
- bir sürümde olağan dışı ancak kasıtlı davranış varsa yayıncı ClawScan notu ekleyin
- gizlenmiş yükleme komutlarından kaçının
- mümkün olduğunda kaynağa bağlantı verin
- plugin yayımlamadan önce deneme çalıştırmaları kullanın
- kullanıcılar veya moderatörler paket davranışı hakkında soru sorarsa açık yanıt verin
