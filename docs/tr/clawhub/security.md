---
read_when:
    - ClawHub tarama ve moderasyon sonuçlarını anlama
    - Bir Skill veya paketi bildirme
    - Askıya alınmış, gizlenmiş veya engellenmiş bir listelemeden kurtarma
summary: ClawHub güven, tarama, raporlama ve moderasyon davranışı.
x-i18n:
    generated_at: "2026-05-12T23:29:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 49e2650b23ff7657bb01c43fff50f3bb555b3bc7961b503b02a51096e2fceb27
    source_path: clawhub/security.md
    workflow: 16
---

# Güvenlik + Moderasyon

ClawHub yayıma açıktır, ancak herkese açık listelemeler yine de güven,
tarama, raporlama ve moderasyon kontrollerinden geçer. Amaç pratiktir: kullanıcıların
yükledikleri şeyi incelemesine yardımcı olmak, yayıncılara yanlış pozitifler için bir kurtarma yolu
sunmak ve kötüye kullanıma yönelik paketleri herkese açık keşiften uzak tutmak.

Ayrıca bkz. [Kabul edilebilir kullanım](/tr/clawhub/acceptable-usage).

## Kullanıcılar neleri inceleyebilir?

Bir skill veya plugin yüklemeden önce ClawHub listelemesinde şunları kontrol edin:

- sahip ve kaynak atfı
- en son sürüm ve değişiklik günlüğü
- gerekli ortam değişkenleri veya izinler
- plugin'ler için uyumluluk meta verileri
- tarama veya moderasyon durumu
- gösterildiği yerlerde raporlar, yorumlar, yıldızlar, indirmeler ve yükleme sinyalleri

Yalnızca anladığınız ve güvendiğiniz içerikleri yükleyin.

## Tarama durumları

ClawHub, herkese açık sayfalarda ve sahip tarafından görülebilen tanılamalarda
tarama veya moderasyon sonuçları gösterebilir.

Yaygın sonuçlar şunları içerir:

- `clean`: engelleyici bir sorun bulunmadı.
- `suspicious`: sürüm dikkat veya inceleme gerektirir.
- `malicious`: sürüm güvensiz kabul edilir.
- `pending`: kontroller henüz bitmedi.
- `held`, `quarantined`, `revoked` veya `hidden`: sürüm herkese açık
  yükleme yüzeylerinde tam olarak kullanılabilir değildir.

Kesin ifade yüzeye göre değişebilir, ancak pratik anlam aynıdır: bir
sürüm bekletiliyor veya engelleniyorsa, sahip sorunu çözene ya da moderasyon
onu geri yükleyene kadar kullanıcılar bunu yüklememelidir.

## Skills

Skill taramaları, yayımlanan skill paketine, meta verilere, beyan edilen
gereksinimlere ve şüpheli talimatlara bakar.

ClawHub, bir skill'in beyan ettikleri ile yapıyor gibi göründükleri arasındaki
uyuşmazlıklara özel önem verir. Örneğin, gerekli bir API anahtarına başvuran
bir skill, kullanıcıların yüklemeden önce görebilmesi için bu gereksinimi
`SKILL.md` içinde beyan etmelidir.

Tarama bulguları yapıt tabanlıdır. Beyan edilen API kimlik bilgileri, localhost
OAuth geri çağrıları, kapsamlı kaldırma temizliği, Basic Auth kodlaması veya
belirtilen sağlayıcıya kullanıcı tarafından seçilen dosya yüklemeleri gibi beklenen
sağlayıcı davranışları; gizli kimlik bilgisi iletimi, geniş özel dosya erişimi,
ilgisiz ağ hedefleri veya gizli tarayıcı kötüye kullanımı gibi davranışlardan
farklı ele alınır.

Bkz. [Skill biçimi](/tr/clawhub/skill-format).

## Plugin'ler

Plugin sürümleri paket meta verileri, kaynak atfı, uyumluluk alanları ve
yapıt bütünlüğü bilgilerini içerir.

OpenClaw, ClawHub'ta barındırılan plugin'leri yüklemeden önce uyumluluğu kontrol eder. Paket
kayıtları, OpenClaw'ın indirilen yapıtları doğrulayabilmesi için özet meta verileri de
sunabilir. ClawScan, plugin sürümlerini incelerken beyan edilen çalışma zamanı
gereksinimlerinin gözlemlenen davranışla karşılaştırılması için beyan edilen paket
`openclaw.environment` env/config meta verilerini dahil eder.

## Raporlar

Oturum açmış kullanıcılar skill'leri, paketleri ve yorumları raporlayabilir.

Raporlar belirli ve uygulanabilir olmalıdır. Raporlamanın kötüye kullanımı
hesap işlemine yol açabilir.

Rapor örnekleri:

- yanıltıcı meta veriler
- beyan edilmemiş kimlik bilgisi veya izin gereksinimleri
- şüpheli yükleme talimatları
- dolandırıcılık yorumları veya taklit
- kötü niyetli kayıtlar veya ticari marka kötüye kullanımı
- [Kabul edilebilir kullanım](/tr/clawhub/acceptable-usage) ihlali yapan içerik

## Yayıncı ClawScan notları

Yayıncılar, bir skill veya plugin yayımlarken isteğe bağlı bir ClawScan notu sağlayabilir.
Bu not, ClawScan'e ağ erişimi, yerel ana makine erişimi veya sağlayıcıya özel
kimlik bilgileri gibi normalde olağandışı görünebilecek davranışlar için bağlam sağlar.

## Moderasyon bekletmeleri

Statik tarayıcı, yüklenen bir skill'i kötü amaçlı olarak işaretlediğinde yayıncı
otomatik olarak bir moderasyon bekletmesine alınır (kullanıcıda `requiresModerationAt`
ayarlanır). Bu, yayıncının tüm skill'lerini gizler, gelecekteki yayımlamaların
gizli başlamasına neden olur ve bir `user.moderation.auto` denetim günlüğü girdisi oluşturur.

Statik şüpheli bulgular moderatörler için dosya/satır kanıtı olarak saklanır,
ancak tek başlarına içeriği gizlemez veya herkese açık tarama sonucunu belirlemez.
Yeni yüklemeler, LLM incelemesi sonuçlanana kadar inceleme/beklemede durumunda kalır. Statik
tarama yalnızca kötü amaçlı imzalar için hemen engeller. VirusTotal motor
isabetleri görünür güvenlik kanıtı olarak kalır, ancak VirusTotal Code Insight/Palm
kararları tavsiye niteliğindedir ve skill'leri tek başlarına gizlemez. ClawScan LLM incelemeleri,
amaçla uyumlu notları rehberlik olarak tutar. Orta düzey inceleme bulguları
yapıtta görünür kalırken, şüpheli filtresi yüksek etkili LLM endişeleri,
kötü amaçlı bulgular veya doğrulanmış AV motoru tespitleri için ayrılmıştır.

Yöneticiler yanlış pozitif bekletmeyi kaldırabilir:

```bash
npx convex run users:liftModerationHold '{"userId": "<user-id>", "reason": "False positive from security tool scanning"}'
```

Bu, `requiresModerationAt` ve `requiresModerationReason` değerlerini temizler,
kullanıcı düzeyindeki bekletme nedeniyle gizlenen skill'leri geri yükler ve bir
`user.moderation.lift` denetim günlüğü girdisi yazar. Başka nedenlerle gizlenen
veya kendi statik taraması kötü amaçlı kalmaya devam eden skill'ler gizli kalır.

## Yasaklar ve hesap durumu

ClawHub politikasını ihlal eden hesaplar yayımlama erişimini kaybedebilir. Ağır kötüye kullanım
hesap yasaklarına, token iptaline, gizli içeriğe veya kaldırılmış
listelemelere neden olabilir.

Silinen, yasaklanan veya devre dışı bırakılan hesaplar ClawHub API token'larını kullanamaz. Hesap işleminden
sonra CLI kimlik doğrulaması başarısız olmaya başlarsa, hesap durumunu incelemek için web UI'da
oturum açın. Oturum açma veya normal CLI erişimi engellenmişse, kurtarma incelemesi için
security@openclaw.ai ile iletişime geçin.

## Yayıncı rehberliği

Yanlış pozitifleri azaltmak ve kullanıcı güvenini artırmak için:

- adları, özetleri, etiketleri ve değişiklik günlüklerini doğru tutun
- gerekli ortam değişkenlerini ve izinleri beyan edin
- bir sürümde olağandışı ancak kasıtlı davranış varsa yayıncı ClawScan notu ekleyin
- gizlenmiş yükleme komutlarından kaçının
- mümkün olduğunda kaynağa bağlantı verin
- plugin yayımlamadan önce deneme çalıştırmaları kullanın
- kullanıcılar veya moderatörler paket davranışı hakkında soru sorarsa net yanıt verin
