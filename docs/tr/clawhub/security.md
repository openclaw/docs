---
read_when:
    - ClawHub tarama ve moderasyon sonuçlarını anlama
    - Bir beceriyi veya paketi bildirme
    - Bekletilen, gizlenen veya engellenen bir listelemeyi kurtarma
summary: ClawHub güven, tarama, raporlama ve moderasyon davranışı.
x-i18n:
    generated_at: "2026-05-12T04:09:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 49e2650b23ff7657bb01c43fff50f3bb555b3bc7961b503b02a51096e2fceb27
    source_path: clawhub/security.md
    workflow: 16
---

# Güvenlik + Moderasyon

ClawHub yayımlamaya açıktır, ancak herkese açık listeler yine de güven,
tarama, bildirim ve moderasyon denetimlerinden geçer. Amaç pratiktir: kullanıcıların
kurdukları şeyi incelemesine yardımcı olmak, yayımlayanlara yanlış pozitifler için
bir kurtarma yolu sunmak ve kötüye kullanılan paketleri herkese açık keşif alanının
dışında tutmak.

Ayrıca bkz. [Kabul edilebilir kullanım](/tr/clawhub/acceptable-usage).

## Kullanıcılar neyi inceleyebilir?

Bir skill veya plugin kurmadan önce ClawHub listesini şunlar için kontrol edin:

- sahip ve kaynak atfı
- en son sürüm ve değişiklik günlüğü
- gerekli ortam değişkenleri veya izinler
- plugin'ler için uyumluluk meta verileri
- tarama veya moderasyon durumu
- gösterildiği yerlerde bildirimler, yorumlar, yıldızlar, indirmeler ve kurulum sinyalleri

Yalnızca anladığınız ve güvendiğiniz içerikleri kurun.

## Tarama durumları

ClawHub, herkese açık sayfalarda ve sahip tarafından görülebilen tanılamalarda
tarama veya moderasyon sonuçlarını gösterebilir.

Yaygın sonuçlar şunları içerir:

- `clean`: engelleyici bir sorun bulunmadı.
- `suspicious`: sürüm dikkat veya inceleme gerektiriyor.
- `malicious`: sürüm güvensiz kabul ediliyor.
- `pending`: kontroller henüz bitmedi.
- `held`, `quarantined`, `revoked` veya `hidden`: sürüm herkese açık kurulum
  yüzeylerinde tamamen kullanılabilir değildir.

Kesin ifade yüzeye göre değişebilir, ancak pratik anlam aynıdır: bir sürüm
bekletiliyorsa veya engellenmişse, sahip sorunu çözene ya da moderasyon sürümü
geri yükleyene kadar kullanıcılar onu kurmamalıdır.

## Skills

Skill taramaları yayımlanan skill paketine, meta verilere, bildirilen
gereksinimlere ve şüpheli talimatlara bakar.

ClawHub, bir skill'in bildirdikleriyle yapıyor gibi göründüğü şey arasındaki
uyumsuzluklara özellikle dikkat eder. Örneğin, gerekli bir API anahtarına
başvuran bir skill, kullanıcıların kurmadan önce görebilmesi için bu gereksinimi
`SKILL.md` içinde bildirmelidir.

Tarama bulguları yapıt tabanlıdır. Bildirilen API kimlik bilgileri, localhost
OAuth geri çağrıları, kapsamı belirlenmiş kaldırma temizliği, Basic Auth
kodlaması veya belirtilen sağlayıcıya kullanıcı tarafından seçilen dosya
yüklemeleri gibi beklenen sağlayıcı davranışları; gizli kimlik bilgisi iletme,
geniş özel dosya erişimi, ilgisiz ağ hedefleri veya gizli tarayıcı kötüye
kullanımı gibi durumlardan farklı ele alınır.

Bkz. [Skill biçimi](/tr/clawhub/skill-format).

## Plugin'ler

Plugin sürümleri paket meta verilerini, kaynak atfını, uyumluluk alanlarını ve
yapıt bütünlüğü bilgilerini içerir.

OpenClaw, ClawHub üzerinde barındırılan plugin'leri kurmadan önce uyumluluğu
kontrol eder. Paket kayıtları, OpenClaw'ın indirilen yapıtları doğrulayabilmesi
için özet meta verilerini de gösterebilir. ClawScan, plugin sürümlerini
incelerken bildirilen paket `openclaw.environment` env/config meta verilerini
içerir; böylece bildirilen çalışma zamanı gereksinimleri gözlemlenen davranışla
karşılaştırılır.

## Bildirimler

Oturum açmış kullanıcılar skill'leri, paketleri ve yorumları bildirebilir.

Bildirimler belirli ve uygulanabilir olmalıdır. Bildirim sisteminin kötüye
kullanılması da hesap işlemine yol açabilir.

Bildirim örnekleri:

- yanıltıcı meta veriler
- bildirilmemiş kimlik bilgisi veya izin gereksinimleri
- şüpheli kurulum talimatları
- dolandırıcılık yorumları veya kimliğe bürünme
- kötü niyetli kayıtlar veya ticari marka kötüye kullanımı
- [Kabul edilebilir kullanım](/tr/clawhub/acceptable-usage) kurallarını ihlal eden içerik

## Yayımlayan ClawScan notları

Yayımlayanlar, bir skill veya plugin yayımlarken isteğe bağlı bir ClawScan notu
sağlayabilir. Bu not, ClawScan'e ağ erişimi, yerel ana makine erişimi veya
sağlayıcıya özgü kimlik bilgileri gibi aksi halde olağandışı görünebilecek
davranışlar için bağlam sağlar.

## Moderasyon Bekletmeleri

Statik tarayıcı yüklenen bir skill'i kötü amaçlı olarak işaretlediğinde,
yayımlayan otomatik olarak bir moderasyon bekletmesine alınır (kullanıcı üzerinde
`requiresModerationAt` ayarlanır). Bu, yayımlayanın tüm skill'lerini gizler,
gelecekteki yayımlamaların gizli başlamasına neden olur ve bir
`user.moderation.auto` denetim günlüğü girdisi oluşturur.

Statik şüpheli bulgular moderatörler için dosya/satır kanıtı olarak tutulur,
ancak kendi başlarına içeriği gizlemez veya herkese açık tarama kararını
belirlemez. Yeni yüklemeler, LLM incelemesi sonuçlanana kadar inceleme/beklemede
durumunda kalır. Statik tarama yalnızca kötü amaçlı imzalar için anında
engeller. VirusTotal motor isabetleri görünür güvenlik kanıtı olarak kalır,
ancak VirusTotal Code Insight/Palm kararları danışma niteliğindedir ve kendi
başlarına skill'leri gizlemez. ClawScan LLM incelemeleri amaca uygun notları
rehberlik olarak korur. Orta düzey inceleme bulguları yapıt üzerinde görünür
kalırken, şüpheli filtresi yüksek etkili LLM endişeleri, kötü amaçlı bulgular
veya doğrulanmış AV motoru tespitleri için ayrılmıştır.

Yöneticiler yanlış pozitif bir bekletmeyi kaldırabilir:

```bash
npx convex run users:liftModerationHold '{"userId": "<user-id>", "reason": "False positive from security tool scanning"}'
```

Bu, `requiresModerationAt` ve `requiresModerationReason` alanlarını temizler,
kullanıcı düzeyi bekletme nedeniyle gizlenen skill'leri geri yükler ve bir
`user.moderation.lift` denetim günlüğü girdisi yazar. Başka nedenlerle gizlenen
veya kendi statik taraması hâlâ kötü amaçlı olan skill'ler gizli kalır.

## Yasaklar ve hesap durumu

ClawHub politikasını ihlal eden hesaplar yayımlama erişimini kaybedebilir.
Ağır kötüye kullanım hesap yasaklarına, token iptaline, gizli içeriğe veya
kaldırılmış listelere neden olabilir.

Silinmiş, yasaklanmış veya devre dışı bırakılmış hesaplar ClawHub API token'larını
kullanamaz. Hesap işleminden sonra CLI kimlik doğrulaması başarısız olmaya
başlarsa, hesap durumunu incelemek için web kullanıcı arayüzünde oturum açın.
Oturum açma veya normal CLI erişimi engellenmişse, kurtarma incelemesi için
security@openclaw.ai ile iletişime geçin.

## Yayımlayan rehberliği

Yanlış pozitifleri azaltmak ve kullanıcı güvenini artırmak için:

- adları, özetleri, etiketleri ve değişiklik günlüklerini doğru tutun
- gerekli ortam değişkenlerini ve izinleri bildirin
- bir sürüm olağandışı ancak kasıtlı davranışa sahipse yayımlayan ClawScan notu ekleyin
- gizlenmiş kurulum komutlarından kaçının
- mümkün olduğunda kaynağa bağlantı verin
- plugin'leri yayımlamadan önce deneme çalıştırmaları kullanın
- kullanıcılar veya moderatörler paket davranışı hakkında soru sorarsa net yanıt verin
