---
read_when:
    - ClawHub tarama ve moderasyon sonuçlarını anlama
    - Bir beceriyi veya paketi bildirme
    - Bekletilen, gizli veya engellenmiş bir listelemeden kurtarma
summary: ClawHub güven, tarama, raporlama ve moderasyon davranışı.
x-i18n:
    generated_at: "2026-05-13T04:18:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 49e2650b23ff7657bb01c43fff50f3bb555b3bc7961b503b02a51096e2fceb27
    source_path: clawhub/security.md
    workflow: 16
---

# Güvenlik + Moderasyon

ClawHub yayımlamaya açıktır, ancak herkese açık listelemeler yine de güven,
tarama, bildirim ve moderasyon denetimlerinden geçer. Amaç pratiktir: kullanıcıların
ne kurduklarını incelemesine yardımcı olmak, yayımlayıcılara yanlış pozitifler için
bir kurtarma yolu sağlamak ve kötüye kullanılan paketleri herkese açık keşiften uzak tutmak.

Ayrıca bkz. [Kabul edilebilir kullanım](/tr/clawhub/acceptable-usage).

## Kullanıcılar neleri inceleyebilir

Bir skill veya plugin kurmadan önce, ClawHub listelemesinde şunları kontrol edin:

- sahip ve kaynak atfı
- en son sürüm ve değişiklik günlüğü
- gerekli ortam değişkenleri veya izinler
- pluginler için uyumluluk meta verileri
- tarama veya moderasyon durumu
- gösterildiği yerlerde bildirimler, yorumlar, yıldızlar, indirmeler ve kurulum sinyalleri

Yalnızca anladığınız ve güvendiğiniz içerikleri kurun.

## Tarama durumları

ClawHub, herkese açık sayfalarda ve sahibin görebildiği tanılamalarda tarama veya
moderasyon sonuçlarını gösterebilir.

Yaygın sonuçlar şunları içerir:

- `clean`: engelleyici bir sorun bulunmadı.
- `suspicious`: sürüm dikkat veya inceleme gerektirir.
- `malicious`: sürüm güvensiz kabul edilir.
- `pending`: kontroller henüz tamamlanmadı.
- `held`, `quarantined`, `revoked` veya `hidden`: sürüm herkese açık kurulum
  yüzeylerinde tam olarak kullanılabilir değildir.

Tam ifade yüzeye göre değişebilir, ancak pratik anlam aynıdır: bir sürüm bekletiliyor
veya engelleniyorsa, sahip sorunu çözene ya da moderasyon sürümü geri yükleyene kadar
kullanıcılar onu kurmamalıdır.

## Skills

Skill taramaları yayımlanan skill paketini, meta verileri, bildirilen gereksinimleri
ve şüpheli talimatları inceler.

ClawHub, bir skillin beyan ettiği şeyler ile yapıyor gibi göründüğü şeyler arasındaki
uyumsuzluklara özellikle dikkat eder. Örneğin, gerekli bir API anahtarına atıfta bulunan
bir skill, bu gereksinimi `SKILL.md` içinde beyan etmelidir; böylece kullanıcılar bunu
kurmadan önce görebilir.

Tarama bulguları artefakt temellidir. Bildirilen API kimlik bilgileri, localhost OAuth
geri çağrıları, kapsamlı kaldırma temizliği, Basic Auth kodlaması veya belirtilen sağlayıcıya
kullanıcının seçtiği dosya yüklemeleri gibi beklenen sağlayıcı davranışları; gizli kimlik
bilgisi iletme, geniş özel dosya erişimi, ilgisiz ağ hedefleri veya gizli tarayıcı kötüye
kullanımından farklı değerlendirilir.

Bkz. [Skill biçimi](/tr/clawhub/skill-format).

## Pluginler

Plugin sürümleri paket meta verilerini, kaynak atfını, uyumluluk alanlarını ve artefakt
bütünlüğü bilgilerini içerir.

OpenClaw, ClawHub tarafından barındırılan pluginleri kurmadan önce uyumluluğu kontrol eder.
Paket kayıtları, OpenClaw'ın indirilen artefaktları doğrulayabilmesi için özet meta verilerini
de açığa çıkarabilir. ClawScan, bildirilen çalışma zamanı gereksinimlerinin gözlemlenen
davranışla karşılaştırılması için plugin sürümlerini incelerken bildirilen paket
`openclaw.environment` ortam/yapılandırma meta verilerini içerir.

## Bildirimler

Oturum açmış kullanıcılar skillleri, paketleri ve yorumları bildirebilir.

Bildirimler belirli ve eyleme geçirilebilir olmalıdır. Bildirim sistemini kötüye kullanmak
da hesap işlemine yol açabilir.

Bildirim örnekleri:

- yanıltıcı meta veriler
- beyan edilmemiş kimlik bilgisi veya izin gereksinimleri
- şüpheli kurulum talimatları
- dolandırıcılık yorumları veya taklit
- kötü niyetli kayıtlar veya ticari marka kötüye kullanımı
- [Kabul edilebilir kullanım](/tr/clawhub/acceptable-usage) kurallarını ihlal eden içerik

## Yayımlayıcı ClawScan notları

Yayımlayıcılar, bir skill veya plugin yayımlarken isteğe bağlı bir ClawScan notu sağlayabilir.
Bu not, ClawScan'e ağ erişimi, yerel ana makine erişimi veya sağlayıcıya özgü kimlik bilgileri
gibi aksi halde olağandışı görünebilecek davranışlar için bağlam sağlar.

## Moderasyon Bekletmeleri

Statik tarayıcı yüklenen bir skilli kötü amaçlı olarak işaretlediğinde, yayımlayıcı otomatik
olarak moderasyon bekletmesine alınır (`requiresModerationAt` kullanıcı üzerinde ayarlanır).
Bu, yayımlayıcının tüm skilllerini gizler, gelecekteki yayımlamaların gizli başlamasına neden
olur ve bir `user.moderation.auto` denetim günlüğü girdisi oluşturur.

Statik şüpheli bulgular moderatörler için dosya/satır kanıtı olarak saklanır, ancak kendi
başlarına içeriği gizlemez veya herkese açık tarama kararını belirlemez. Yeni yüklemeler,
LLM incelemesi sonuçlanana kadar inceleme/beklemede durumunda kalır. Statik tarama yalnızca
kötü amaçlı imzalar için hemen engelleme yapar. VirusTotal motor isabetleri görünür güvenlik
kanıtı olarak kalır, ancak VirusTotal Code Insight/Palm kararları tavsiye niteliğindedir ve
skillleri kendi başlarına gizlemez. ClawScan LLM incelemeleri, amaçla uyumlu notları rehberlik
olarak tutar. Orta düzey inceleme bulguları artefakt üzerinde görünür kalırken, şüpheli filtresi
yüksek etkili LLM endişeleri, kötü amaçlı bulgular veya doğrulanmış AV motoru tespitleri için
ayrılmıştır.

Yöneticiler yanlış pozitif bir bekletmeyi kaldırabilir:

```bash
npx convex run users:liftModerationHold '{"userId": "<user-id>", "reason": "False positive from security tool scanning"}'
```

Bu işlem `requiresModerationAt` ve `requiresModerationReason` değerlerini temizler, kullanıcı
düzeyindeki bekletme nedeniyle gizlenen skillleri geri yükler ve bir `user.moderation.lift`
denetim günlüğü girdisi yazar. Başka nedenlerle gizlenen veya kendi statik taraması kötü amaçlı
olarak kalan skilller gizli kalır.

## Yasaklar ve hesap durumu

ClawHub politikasını ihlal eden hesaplar yayımlama erişimini kaybedebilir. Ağır kötüye kullanım
hesap yasaklarına, token iptaline, gizli içeriğe veya kaldırılan listelemelere yol açabilir.

Silinmiş, yasaklanmış veya devre dışı bırakılmış hesaplar ClawHub API tokenlarını kullanamaz.
Hesap işleminden sonra CLI kimlik doğrulaması başarısız olmaya başlarsa, hesap durumunu gözden
geçirmek için web kullanıcı arayüzünde oturum açın. Oturum açma veya normal CLI erişimi
engellenmişse, kurtarma incelemesi için security@openclaw.ai ile iletişime geçin.

## Yayımlayıcı rehberi

Yanlış pozitifleri azaltmak ve kullanıcı güvenini artırmak için:

- adları, özetleri, etiketleri ve değişiklik günlüklerini doğru tutun
- gerekli ortam değişkenlerini ve izinleri beyan edin
- bir sürüm olağandışı ancak kasıtlı davranışa sahipse yayımlayıcı ClawScan notu ekleyin
- karmaşıklaştırılmış kurulum komutlarından kaçının
- mümkün olduğunda kaynağa bağlantı verin
- pluginleri yayımlamadan önce deneme çalıştırmaları kullanın
- kullanıcılar veya moderatörler paket davranışı hakkında soru sorarsa net yanıt verin
