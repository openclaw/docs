---
read_when:
    - ClawHub tarama ve moderasyon sonuçlarını anlama
    - Beceri veya paket bildirme
    - Bekletilen, gizlenen veya engellenen bir listelemeden kurtarma
summary: ClawHub güven, tarama, raporlama, itiraz ve moderasyon davranışı.
x-i18n:
    generated_at: "2026-05-10T19:27:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 83d68ab910ad4812ae79e887d52ff1c5b8248542e1d27d54a81a18cbd821debf
    source_path: clawhub/security.md
    workflow: 16
---

# Güvenlik + Moderasyon

ClawHub yayımlamaya açıktır, ancak herkese açık listelemeler yine de güven,
tarama, raporlama ve moderasyon kontrollerinden geçer. Amaç pratiktir:
kullanıcıların ne yüklediklerini incelemesine yardımcı olmak, yayımcılara yanlış
pozitifler için bir kurtarma yolu sunmak ve kötüye kullanılan paketleri herkese
açık keşif alanlarının dışında tutmak.

Ayrıca bkz. [Kabul edilebilir kullanım](/tr/clawhub/acceptable-usage).

## Kullanıcılar neleri inceleyebilir

Bir Skills veya plugin yüklemeden önce, ClawHub listelemesinde şunları kontrol edin:

- sahip ve kaynak atfı
- en son sürüm ve değişiklik günlüğü
- gerekli ortam değişkenleri veya izinler
- pluginler için uyumluluk meta verileri
- tarama veya moderasyon durumu
- gösterildiği yerlerde raporlar, yorumlar, yıldızlar, indirmeler ve yükleme sinyalleri

Yalnızca anladığınız ve güvendiğiniz içerikleri yükleyin.

## Tarama durumları

ClawHub, herkese açık sayfalarda ve sahiplere görünen tanılarda tarama veya
moderasyon sonuçlarını gösterebilir.

Yaygın sonuçlar şunları içerir:

- `clean`: engelleyici bir sorun bulunmadı.
- `suspicious`: sürüm dikkat veya inceleme gerektirir.
- `malicious`: sürüm güvensiz kabul edilir.
- `pending`: kontroller henüz tamamlanmadı.
- `held`, `quarantined`, `revoked` veya `hidden`: sürüm, herkese açık yükleme
  yüzeylerinde tam olarak kullanılamaz.

Tam ifade yüzeye göre değişebilir, ancak pratik anlam aynıdır: bir sürüm
bekletiliyor veya engelleniyorsa, sahip sorunu çözene ya da moderasyon sürümü
geri yükleyene kadar kullanıcılar onu yüklememelidir.

## Skills

Skills taramaları yayımlanan Skills paketine, meta verilere, beyan edilen
gereksinimlere ve şüpheli talimatlara bakar.

ClawHub, bir Skills'in ne beyan ettiği ile ne yapıyor göründüğü arasındaki
uyuşmazlıklara özellikle dikkat eder. Örneğin, gerekli bir API anahtarına
başvuran bir Skills, bu gereksinimi `SKILL.md` içinde beyan etmelidir; böylece
kullanıcılar yüklemeden önce bunu görebilir.

Tarama bulguları yapıt tabanlıdır. Beyan edilmiş API kimlik bilgileri, localhost
OAuth geri çağrıları, kapsamlı kaldırma temizliği, Basic Auth kodlaması veya
belirtilen sağlayıcıya kullanıcı tarafından seçilen dosya yüklemeleri gibi
beklenen sağlayıcı davranışları; gizli kimlik bilgisi yönlendirme, geniş özel
dosya erişimi, ilgisiz ağ hedefleri veya gizli tarayıcı kötüye kullanımı gibi
durumlardan farklı ele alınır.

Bkz. [Skills biçimi](/tr/clawhub/skill-format).

## Pluginler

Plugin sürümleri paket meta verilerini, kaynak atfını, uyumluluk alanlarını ve
yapıt bütünlüğü bilgilerini içerir.

OpenClaw, ClawHub tarafından barındırılan pluginleri yüklemeden önce uyumluluğu
kontrol eder. Paket kayıtları ayrıca özet meta verilerini de sunabilir; böylece
OpenClaw indirilen yapıtları doğrulayabilir. ClawScan, plugin sürümlerini
incelerken beyan edilen paket `openclaw.environment` env/config meta verilerini
dahil eder; böylece beyan edilen çalışma zamanı gereksinimleri gözlemlenen
davranışla karşılaştırılır.

## Raporlar

Oturum açmış kullanıcılar Skills'leri, paketleri ve yorumları raporlayabilir.

Raporlar spesifik ve eyleme geçirilebilir olmalıdır. Raporlamanın kötüye
kullanılması da hesap işlemine yol açabilir.

Rapor örnekleri:

- yanıltıcı meta veriler
- beyan edilmemiş kimlik bilgisi veya izin gereksinimleri
- şüpheli yükleme talimatları
- dolandırıcılık yorumları veya kimliğe bürünme
- kötü niyetli kayıtlar veya ticari marka kötüye kullanımı
- [Kabul edilebilir kullanım](/tr/clawhub/acceptable-usage) kurallarını ihlal eden içerik

## Kötü niyetli veya ticari marka raporları

ClawHub, kötü niyetli kayıtlar, kimliğe bürünme ve ticari markayla ilgili
uyuşmazlıklar için aynı rapor ve personel moderasyon hattını kullanır. Bu
raporlar, personelin hak sahibini, ihtilaflı listelemeyi ve istenen işlemi
belirleyebilmesi için yeterli bağlama ihtiyaç duyar.

Şunları ekleyin:

- kanonik ClawHub Skills veya paket URL'si ve sahip kullanıcı adı
- ihtilaf konusu ticari marka, proje, şirket veya ürün adı
- hak sahibinin mülkiyetine veya yetkisine dair herkese açık kanıt
- mevcut sahibin bu ad altında yayımlama yetkisinin neden olmadığı
- inceleme süresince gizleme, sahipliği devretme, yeniden adlandırma veya
  kaldırma gibi istenen işlem

Herkese açık raporlara özel sırlar veya hassas yasal belgeler koymayın. Hassas
olmayan kanıtlarla bir GitHub issue açın ve gerektiğinde özel bir devir yolu için
bakımcılara başvurun.

## İtirazlar ve yeniden taramalar

Sahipler, bir Skills veya paketin hatalı şekilde bekletildiğine ya da
işaretlendiğine inanıyorsa yeniden tarama isteyebilir. Platform moderatörleri ve
yöneticileri, raporları veya destek isteklerini ele alırken herhangi bir Skills
veya paket için yeniden tarama isteyebilir:

```bash
clawhub skill rescan <slug>
clawhub package rescan <name>
```

Moderasyona alınmış içeriklerde sahipler, sahiplerin görebildiği ClawHub
yüzeylerinden bir itiraz gönderebilir. İtirazlar, neyin değiştiğini veya
işaretlemenin neden hatalı olduğunu açıklamalıdır.

## Moderasyon Bekletmeleri

Statik tarayıcı yüklenen bir Skills'i kötü amaçlı olarak işaretlediğinde,
yayımcı otomatik olarak bir moderasyon bekletmesine alınır (kullanıcı üzerinde
`requiresModerationAt` ayarlanır). Bu, yayımcının tüm Skills'lerini gizler,
gelecekteki yayımlamaların gizli başlamasına neden olur ve bir
`user.moderation.auto` denetim günlüğü girdisi oluşturur.

Statik şüpheli bulgular moderatörler için dosya/satır kanıtı olarak saklanır,
ancak tek başlarına içeriği gizlemez veya herkese açık tarama kararını
belirlemezler. Yeni yüklemeler, VirusTotal ve LLM incelemeleri sonuçlanana kadar
inceleme/beklemede durumunda kalır; statik tarama yalnızca kötü amaçlı imzalar
için hemen engeller. ClawScan LLM incelemeleri, rehberlik amacıyla amaca uygun
notları tutar; yalnızca yapılandırılmış inceleme önemli bir endişe içerdiğinde
Review/suspicious kararı döndürür.

Yöneticiler yanlış pozitif bekletmeyi kaldırabilir:

```bash
npx convex run users:liftModerationHold '{"userId": "<user-id>", "reason": "False positive from security tool scanning"}'
```

Bu, `requiresModerationAt` ve `requiresModerationReason` değerlerini temizler,
kullanıcı düzeyindeki bekletme nedeniyle gizlenen Skills'leri geri yükler ve bir
`user.moderation.lift` denetim günlüğü girdisi yazar. Başka nedenlerle gizlenen
veya kendi statik taraması kötü amaçlı olmaya devam eden Skills'ler gizli kalır.

## Yasaklar ve hesap durumu

ClawHub politikasını ihlal eden hesaplar yayımlama erişimini kaybedebilir. Ciddi
kötüye kullanım hesap yasaklarına, token iptaline, gizli içeriğe veya kaldırılan
listelemelere yol açabilir.

Silinmiş, yasaklanmış veya devre dışı bırakılmış hesaplar ClawHub API tokenlarını
kullanamaz. Hesap işleminden sonra CLI kimlik doğrulaması başarısız olmaya
başlarsa, hesap durumunu gözden geçirmek için web arayüzünde oturum açın veya
beklenen proje destek kanalı üzerinden bakımcılarla iletişime geçin.

## Yayımcı rehberi

Yanlış pozitifleri azaltmak ve kullanıcı güvenini artırmak için:

- adları, özetleri, etiketleri ve değişiklik günlüklerini doğru tutun
- gerekli ortam değişkenlerini ve izinleri beyan edin
- gizlenmiş yükleme komutlarından kaçının
- mümkün olduğunda kaynağa bağlantı verin
- pluginleri yayımlamadan önce deneme çalıştırmaları kullanın
- kullanıcılar veya moderatörler paket davranışı hakkında soru sorarsa net yanıt verin
