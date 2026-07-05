---
read_when:
    - Bir skill, Plugin veya paketi bildirme
    - Bekletilen, gizlenen veya engellenen bir listeden kurtarma
    - ClawHub moderasyonunu, yasaklamaları veya hesap durumunu anlama
sidebarTitle: Moderation and Account Safety
summary: ClawHub raporlarının, moderasyon bekletmelerinin, gizli listelemelerin, yasaklamaların ve hesap durumunun nasıl çalıştığı.
title: Moderasyon ve Hesap Güvenliği
x-i18n:
    generated_at: "2026-07-05T08:03:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 54c1e0860411e6599923ef4d7db65d5cd5406ec63bf67c52968b4f99d893ffef
    source_path: clawhub/moderation.md
    workflow: 16
---

# Moderasyon ve Hesap Güvenliği

ClawHub yayınlamaya açıktır, ancak herkese açık keşif ve kurulum yüzeyleri yine de koruyucu önlemlere ihtiyaç duyar. Raporlar, moderasyon bekletmeleri, gizli listelemeler ve hesap işlemleri, bir sürüm veya hesap güvensiz, yanıltıcı ya da politika dışı göründüğünde kullanıcıları korumaya yardımcı olur.

Bu sayfa moderasyonu ve hesap durumunu kapsar. `Pass`, `Review`, `Warn`, `Malicious` ve risk düzeyi gibi denetim etiketleri için [Güvenlik Denetimleri](/clawhub/security-audits) bölümüne bakın.

Ayrıca [Güvenlik](/tr/clawhub/security) ve [Kabul Edilebilir Kullanım](/clawhub/acceptable-usage) bölümlerine de bakın. Telif hakkı veya diğer içerik haklarıyla ilgili endişeler için [İçerik Hakları Talepleri](/clawhub/content-rights) bölümünü kullanın.

## Raporlar

Oturum açmış kullanıcılar Skills, plugins ve paketleri raporlayabilir.

ClawHub raporlarını yalnızca aşağıdakiler gibi güvensiz pazar yeri içerikleri için kullanın:

- kötü amaçlı listelemeler
- yanıltıcı metadata
- beyan edilmemiş kimlik bilgileri veya izin gereksinimleri
- şüpheli kurulum yönergeleri
- kimliğe bürünme
- kötü niyetli kayıtlar veya ticari marka kötüye kullanımı
- [Kabul Edilebilir Kullanım](/clawhub/acceptable-usage) ilkesini ihlal eden içerik

Bir skill sayfasındaki **Skill bildir** düğmesini veya paketler için paket raporlama komutunu/API'sini kullanın.

ClawHub raporlarını üçüncü taraf bir skill veya plugin'in kendi kaynak kodundaki güvenlik açıkları için kullanmayın. Bunları doğrudan yayıncıya veya listelemeden bağlantı verilen kaynak deposuna bildirin. ClawHub üçüncü taraf skill veya plugin kodunun bakımını yapmaz ya da yamalarını sağlamaz.

`openclaw/clawhub` için GitHub Güvenlik Önerileri, ClawHub'ın kendisindeki güvenlik açıkları içindir. Örnekler arasında web sitesi, API, CLI, kayıt defteri, kimlik doğrulama, tarama, moderasyon veya indirme/kurulum güven sınırlarındaki hatalar bulunur. ClawHub önerilerini üçüncü taraf Skills veya plugins içindeki güvenlik açıkları için kullanmayın.

İyi raporlar belirli ve uygulanabilirdir. Raporlamanın kötüye kullanılması da hesap işlemine yol açabilir.

## Kuruluş ve Namespace Talepleri

Kuruluş, marka, paket kapsamı, sahip kullanıcı adı veya namespace sahipliği anlaşmazlıkları, ürün içi raporlama akışı ya da hesap itiraz formu yerine [Kuruluş ve Namespace Talepleri](/clawhub/namespace-claims) sürecini kullanmalıdır.

ClawHub personelinin bir namespace'in ayrılması, devredilmesi, yeniden adlandırılması, gizlenmesi, karantinaya alınması, takma ad verilmesi veya başka şekilde incelenmesi gerektiğine dair hassas olmayan kanıtları incelemesine ihtiyaç duyduğunuzda bu süreci kullanın. Herkese açık bir issue'ya gizli bilgiler, özel belgeler, özel hukuki dosyalar, kişisel kimlik belgeleri, API tokenları veya DNS challenge tokenları eklemeyin.

## Moderasyon Bekletmeleri

Bazı ciddi bulgular veya politika sorunları, bir yayıncıyı ya da listelemeyi moderasyon bekletmesine alabilir. Bu olduğunda, etkilenen içerik herkese açık keşiften gizlenebilir veya gelecekteki yayınlar sorun incelenene kadar gizli olarak başlayabilir.

Moderasyon bekletmeleri, ClawHub yüksek riskli vakaları çözerken kullanıcıları korumayı amaçlar. Yanlış pozitif doğrulandığında da kaldırılabilirler.

## Gizli veya Engellenmiş Listelemeler

Bir listeleme herkese açık kurulum yüzeylerinde bekletilmiş, gizlenmiş, karantinaya alınmış, iptal edilmiş veya başka şekilde kullanılamaz olabilir.

Bu durumlardan birini görürseniz, sahip sorunu çözmedikçe veya moderasyon listelemeyi geri yüklemedikçe sürümü kurmayın.

Sahipler, kendi bekletilmiş veya gizli listelemeleri için tanılamaları yine de görebilir. Bu tanılamalar ne olduğunu ve listelemenin herkese açık yüzeylere dönebilmesi için nelerin değişmesi gerektiğini açıklamaya yardımcı olur.

## Yasaklar ve Hesap Durumu

ClawHub politikasını ihlal eden hesaplar yayınlama erişimini kaybedebilir. Ciddi kötüye kullanım hesap yasakları, token iptali, gizli içerik veya kaldırılmış listelemelerle sonuçlanabilir. Yayıncı kötüye kullanım baskısı sinyalleri günlük olarak kontrol edilir. ClawHub'ın olası yasak eşiğine ulaşan sinyaller otomatik bir uyarıyı tetikleyebilir. Uyarı son tarihinden sonraki bir sonraki uygun tarama yayıncıyı hâlâ olası yasak eşiğine yerleştirirse, ClawHub hesap işlemini otomatik olarak uygulayabilir. Daha düşük güvenli ve sınırlı zamansal inceleme sinyalleri otomatik yaptırımın dışında kalır.

Silinmiş, yasaklanmış veya devre dışı bırakılmış hesaplar ClawHub API tokenlarını kullanamaz. Hesap işleminden sonra CLI kimlik doğrulaması başarısız olmaya başlarsa, hesap durumunu incelemek için web UI'ına giriş yapın. Giriş veya normal CLI erişimi bir yasak ya da devre dışı bırakılmış hesap tarafından engelleniyorsa, kurtarma incelemesi için [ClawHub itiraz formunu](https://appeals.openclaw.ai/) kullanın.

Tarayıcı tarafından tetiklenen bir e-posta bir skill veya plugin sürümünü kötü amaçlı olarak adlandırıyorsa, engellenen gönderilmiş sürüm için saklanan tarama sonuçlarını indirin: `clawhub scan download <slug> --version <version>`. Plugins için `--kind plugin` ekleyin. Tarama çıktısını inceleyin, listelemeyi düzeltin, sürüm numarasını artırın ve düzeltilmiş sürümü yükleyin.

## Yayıncı Rehberi

Yanlış pozitifleri azaltmak ve kullanıcı güvenini artırmak için:

- adları, özetleri, etiketleri ve değişiklik günlüklerini doğru tutun
- gerekli ortam değişkenlerini ve izinleri beyan edin
- karmaşıklaştırılmış kurulum komutlarından kaçının
- mümkün olduğunda kaynağa bağlantı verin
- plugins yayınlamadan önce kuru çalışmalar kullanın
- kullanıcılar veya moderatörler sürüm davranışı hakkında soru sorarsa net yanıt verin
