---
read_when:
    - Bir skill'i, plugin'i veya paketi bildirme
    - Bekletilen, gizlenen veya engellenen bir listelemeyi kurtarma
    - ClawHub moderasyonunu, yasaklamaları veya hesap durumunu anlama
sidebarTitle: Moderation and Account Safety
summary: ClawHub bildirimlerinin, moderasyon bekletmelerinin, gizli listelemelerin, yasaklamaların ve hesap durumunun nasıl işlediği.
title: Moderasyon ve Hesap Güvenliği
x-i18n:
    generated_at: "2026-07-12T12:06:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 54c1e0860411e6599923ef4d7db65d5cd5406ec63bf67c52968b4f99d893ffef
    source_path: clawhub/moderation.md
    workflow: 16
---

# Moderasyon ve Hesap Güvenliği

ClawHub yayımlamaya açıktır, ancak herkese açık keşif ve kurulum yüzeylerinde yine de
koruyucu önlemler gerekir. Bildirimler, moderasyon bekletmeleri, gizli listelemeler ve hesap işlemleri;
bir sürüm veya hesap güvensiz, yanıltıcı ya da politikalara aykırı göründüğünde kullanıcıların
korunmasına yardımcı olur.

Bu sayfa moderasyonu ve hesap durumunu ele alır. `Pass`, `Review`, `Warn`,
`Malicious` gibi denetim etiketleri ve risk düzeyi için
[Güvenlik Denetimleri](/clawhub/security-audits) bölümüne bakın.

Ayrıca [Güvenlik](/tr/clawhub/security) ve
[Kabul edilebilir kullanım](/clawhub/acceptable-usage) bölümlerine bakın. Telif hakkı veya diğer içerik
haklarıyla ilgili sorunlar için [İçerik Hakları Talepleri](/clawhub/content-rights) sürecini kullanın.

## Bildirimler

Oturum açmış kullanıcılar Skills, plugin'leri ve paketleri bildirebilir.

ClawHub bildirimlerini yalnızca aşağıdakiler gibi güvenli olmayan pazar yeri içerikleri için kullanın:

- kötü amaçlı listelemeler
- yanıltıcı meta veriler
- beyan edilmemiş kimlik bilgileri veya izin gereksinimleri
- şüpheli kurulum talimatları
- kimliğe bürünme
- kötü niyetli kayıtlar veya ticari markanın kötüye kullanılması
- [Kabul edilebilir kullanım](/clawhub/acceptable-usage) kurallarını ihlal eden içerikler

Bir Skills sayfasındaki **Skills'i bildir** düğmesini veya paketler için paket bildirme
komutunu/API'sini kullanın.

ClawHub bildirimlerini üçüncü taraf bir Skills'in veya
plugin'in kendi kaynak kodundaki güvenlik açıkları için kullanmayın. Bunları doğrudan yayımcıya veya
listelemede bağlantısı verilen kaynak deposuna bildirin. ClawHub, üçüncü taraf Skills veya plugin
kodunun bakımını yapmaz ya da bu kodu yamamaz.

`openclaw/clawhub` için GitHub Güvenlik Bildirimleri, ClawHub'ın
kendisindeki güvenlik açıkları içindir. Web sitesi, API, CLI, kayıt defteri, kimlik doğrulama,
tarama, moderasyon veya indirme/kurulum güven sınırlarındaki hatalar buna örnek verilebilir. ClawHub
bildirimlerini üçüncü taraf Skills veya plugin'lerdeki güvenlik açıkları için kullanmayın.

İyi bildirimler belirli ve uygulanabilir niteliktedir. Bildirim sisteminin kötüye kullanılması da
hesap işlemine yol açabilir.

## Kuruluş ve ad alanı talepleri

Kuruluş, marka, paket kapsamı, sahip kullanıcı adı veya ad alanı mülkiyeti anlaşmazlıklarında,
ürün içi bildirim akışı ya da hesap itiraz formu yerine
[Kuruluş ve Ad Alanı Talepleri](/clawhub/namespace-claims) süreci kullanılmalıdır.

Bir ad alanının rezerve edilmesi, devredilmesi, yeniden adlandırılması, gizlenmesi, karantinaya
alınması, diğer adla eşlenmesi veya başka bir şekilde incelenmesi gerektiğini gösteren hassas olmayan
kanıtların ClawHub personeli tarafından incelenmesine ihtiyaç duyduğunuzda bu süreci kullanın.
Herkese açık bir kayda gizli bilgiler, özel belgeler, özel hukuki dosyalar, kişisel kimlik belgeleri,
API token'ları veya DNS doğrulama token'ları eklemeyin.

## Moderasyon bekletmeleri

Bazı ciddi bulgular veya politika sorunları, bir yayımcının ya da listelemenin moderasyon kapsamında
bekletilmesine neden olabilir. Bu durumda, etkilenen içerik herkese açık keşiften gizlenebilir veya
gelecekteki yayımlar sorun incelenene kadar gizli olarak başlayabilir.

Moderasyon bekletmeleri, ClawHub yüksek riskli vakaları çözümlerken kullanıcıları korumayı amaçlar.
Yanlış pozitifin doğrulanması durumunda bu bekletmeler kaldırılabilir.

## Gizli veya engellenmiş listelemeler

Bir listeleme bekletilebilir, gizlenebilir, karantinaya alınabilir, iptal edilebilir veya herkese açık
kurulum yüzeylerinde başka bir şekilde kullanılamaz hâle getirilebilir.

Bu durumlardan birini görürseniz, sahip sorunu çözmedikçe veya moderasyon listelemeyi geri
yüklemedikçe sürümü kurmayın.

Sahipler, kendilerine ait bekletilen veya gizlenen listelemelerin tanılama bilgilerini görmeye devam
edebilir. Bu tanılama bilgileri, ne olduğunu ve listelemenin herkese açık yüzeylere geri dönebilmesi
için nelerin değişmesi gerektiğini açıklar.

## Yasaklamalar ve hesap durumu

ClawHub politikasını ihlal eden hesaplar yayımlama erişimini kaybedebilir. Ciddi kötüye kullanım;
hesabın yasaklanmasına, token'ların iptal edilmesine, içeriğin gizlenmesine veya listelemelerin
kaldırılmasına yol açabilir. Yayımcı kötüye kullanım baskısı sinyalleri günlük olarak kontrol edilir.
ClawHub'ın olası yasaklama eşiğine ulaşan sinyaller otomatik bir uyarıyı tetikleyebilir. Uyarı
süresinin bitiminden sonraki ilk uygun tarama, yayımcıyı hâlâ olası yasaklama eşiğinde gösterirse
ClawHub hesap işlemini otomatik olarak uygulayabilir. Daha düşük güven düzeyine sahip ve sınırlı
zaman aralıklı inceleme sinyalleri otomatik yaptırımın dışında tutulur.

Silinmiş, yasaklanmış veya devre dışı bırakılmış hesaplar ClawHub API token'larını kullanamaz. Hesap
işleminden sonra CLI kimlik doğrulaması başarısız olmaya başlarsa hesap durumunu incelemek için web
arayüzünde oturum açın. Oturum açma veya normal CLI erişimi bir yasak ya da devre dışı bırakılmış
hesap nedeniyle engelleniyorsa kurtarma incelemesi için
[ClawHub itiraz formunu](https://appeals.openclaw.ai/) kullanın.

Tarayıcı tarafından tetiklenen bir e-postada bir Skills veya plugin sürümü kötü amaçlı olarak
belirtiliyorsa engellenen gönderilmiş sürümün saklanan tarama sonuçlarını indirin:
`clawhub scan download <slug> --version <version>`. Plugin'ler için
`--kind plugin` seçeneğini ekleyin. Tarama çıktısını inceleyin, listelemeyi düzeltin, sürüm numarasını
artırın ve düzeltilmiş sürümü yükleyin.

## Yayımcı yönergeleri

Yanlış pozitifleri azaltmak ve kullanıcı güvenini artırmak için:

- adları, özetleri, etiketleri ve değişiklik günlüklerini doğru tutun
- gerekli ortam değişkenlerini ve izinleri beyan edin
- anlaşılması güç hâle getirilmiş kurulum komutlarından kaçının
- mümkün olduğunda kaynak koduna bağlantı verin
- plugin'leri yayımlamadan önce deneme çalıştırmaları kullanın
- kullanıcılar veya moderatörler sürüm davranışı hakkında soru sorarsa açıkça yanıt verin
