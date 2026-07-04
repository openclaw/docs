---
read_when:
    - Bir beceriyi, Plugin'i veya paketi bildirme
    - Tutulan, gizli veya engellenmiş bir listeden kurtarma
    - ClawHub moderasyonunu, yasaklamaları veya hesap durumunu anlama
sidebarTitle: Moderation and Account Safety
summary: ClawHub raporlarının, moderasyon bekletmelerinin, gizli listelemelerin, yasaklamaların ve hesap durumunun nasıl çalıştığı.
title: Moderasyon ve Hesap Güvenliği
x-i18n:
    generated_at: "2026-07-04T15:31:15Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 54c1e0860411e6599923ef4d7db65d5cd5406ec63bf67c52968b4f99d893ffef
    source_path: clawhub/moderation.md
    workflow: 16
---

# Moderasyon ve Hesap Güvenliği

ClawHub yayımlamaya açıktır, ancak herkese açık keşif ve kurulum yüzeyleri yine de koruyucu önlemlere ihtiyaç duyar. Raporlar, moderasyon bekletmeleri, gizli listelemeler ve hesap işlemleri; bir sürüm veya hesap güvensiz, yanıltıcı ya da politika dışı göründüğünde kullanıcıları korumaya yardımcı olur.

Bu sayfa moderasyonu ve hesap durumunu kapsar. `Pass`, `Review`, `Warn`, `Malicious` gibi denetim etiketleri ve risk düzeyi için bkz. [Güvenlik Denetimleri](/clawhub/security-audits).

Ayrıca bkz. [Güvenlik](/clawhub/security) ve [Kabul edilebilir kullanım](/clawhub/acceptable-usage). Telif hakkı veya diğer içerik haklarıyla ilgili kaygılar için [İçerik Hakları Talepleri](/clawhub/content-rights) bölümünü kullanın.

## Raporlar

Oturum açmış kullanıcılar Skills, plugin'ler ve paketleri raporlayabilir.

ClawHub raporlarını yalnızca aşağıdakiler gibi güvenli olmayan pazar yeri içerikleri için kullanın:

- kötü amaçlı listelemeler
- yanıltıcı meta veriler
- beyan edilmemiş kimlik bilgileri veya izin gereksinimleri
- şüpheli kurulum talimatları
- kimliğe bürünme
- kötü niyetli kayıtlar veya ticari marka kötüye kullanımı
- [Kabul edilebilir kullanım](/clawhub/acceptable-usage) kurallarını ihlal eden içerik

Bir Skill sayfasındaki **Skill'i bildir** düğmesini veya paketler için paket raporlama komutunu/API'sini kullanın.

ClawHub raporlarını üçüncü taraf bir Skill'in veya plugin'in kendi kaynak kodundaki güvenlik açıkları için kullanmayın. Bunları doğrudan yayımcıya veya listelemeden bağlantısı verilen kaynak deposuna bildirin. ClawHub üçüncü taraf Skill veya plugin kodunu sürdürmez ya da yamalamaz.

`openclaw/clawhub` için GitHub Security Advisories, ClawHub'ın kendisindeki güvenlik açıkları içindir. Örnekler arasında web sitesi, API, CLI, kayıt defteri, kimlik doğrulama, tarama, moderasyon veya indirme/kurulum güven sınırlarındaki hatalar bulunur. Üçüncü taraf Skills veya plugin'lerdeki güvenlik açıkları için ClawHub advisory'lerini kullanmayın.

İyi raporlar belirli ve uygulanabilirdir. Raporlamanın kötüye kullanılması da hesap işlemine yol açabilir.

## Kuruluş ve ad alanı talepleri

Kuruluş, marka, paket kapsamı, sahip tanıtıcısı veya ad alanı sahipliği anlaşmazlıkları, ürün içi rapor akışı ya da hesap itiraz formu yerine [Kuruluş ve Ad Alanı Talepleri](/clawhub/namespace-claims) sürecini kullanmalıdır.

Bir ad alanının ayrılması, devredilmesi, yeniden adlandırılması, gizlenmesi, karantinaya alınması, takma ad verilmesi veya başka şekilde incelenmesi gerektiğine dair hassas olmayan kanıtları ClawHub ekibinin incelemesi gerekiyorsa bu süreci kullanın. Herkese açık bir issue'ya sırlar, özel belgeler, özel yasal dosyalar, kişisel kimlik belgeleri, API token'ları veya DNS challenge token'ları eklemeyin.

## Moderasyon bekletmeleri

Bazı ağır bulgular veya politika sorunları, bir yayımcıyı ya da listelemeyi moderasyon bekletmesine alabilir. Bu olduğunda, etkilenen içerik herkese açık keşiften gizlenebilir veya gelecekteki yayımlamalar sorun incelenene kadar gizli başlayabilir.

Moderasyon bekletmeleri, ClawHub yüksek riskli vakaları çözerken kullanıcıları korumayı amaçlar. Yanlış pozitif doğrulandığında da kaldırılabilirler.

## Gizli veya engellenmiş listelemeler

Bir listeleme bekletilmiş, gizlenmiş, karantinaya alınmış, iptal edilmiş veya herkese açık kurulum yüzeylerinde başka bir şekilde kullanılamaz durumda olabilir.

Bu durumlardan birini görürseniz, sahibi sorunu çözmedikçe veya moderasyon listelemeyi geri yüklemedikçe sürümü kurmayın.

Sahipler, kendi bekletilmiş veya gizli listelemeleri için tanılamaları hâlâ görebilir. Bu tanılamalar ne olduğunu ve listelemenin herkese açık yüzeylere dönebilmesi için nelerin değişmesi gerektiğini açıklamaya yardımcı olur.

## Yasaklar ve hesap durumu

ClawHub politikasını ihlal eden hesaplar yayımlama erişimini kaybedebilir. Ağır kötüye kullanım; hesap yasaklarına, token iptaline, gizli içeriğe veya kaldırılmış listelemelere yol açabilir. Yayımcı kötüye kullanım baskısı sinyalleri günlük olarak kontrol edilir. ClawHub'ın olası yasak eşiğine ulaşan sinyaller otomatik bir uyarıyı tetikleyebilir. Uyarı son tarihinden sonraki ilk uygun tarama yayımcıyı hâlâ olası yasak eşiğinde konumlandırıyorsa ClawHub hesap işlemini otomatik olarak uygulayabilir. Daha düşük güvenilirlikli ve sınırlı zamansal inceleme sinyalleri otomatik yaptırımın dışında kalır.

Silinmiş, yasaklanmış veya devre dışı bırakılmış hesaplar ClawHub API token'larını kullanamaz. Hesap işleminden sonra CLI kimlik doğrulaması başarısız olmaya başlarsa hesap durumunu incelemek için web UI'da oturum açın. Oturum açma veya normal CLI erişimi bir yasak ya da devre dışı bırakılmış hesap nedeniyle engelleniyorsa kurtarma incelemesi için [ClawHub itiraz formunu](https://appeals.openclaw.ai/) kullanın.

Tarayıcı tarafından tetiklenen bir e-posta, bir Skill veya plugin sürümünü kötü amaçlı olarak adlandırıyorsa engellenen gönderilmiş sürüm için saklanan tarama sonuçlarını indirin: `clawhub scan download <slug> --version <version>`. Plugin'ler için `--kind plugin` ekleyin. Tarama çıktısını inceleyin, listelemeyi düzeltin, sürüm numarasını artırın ve düzeltilmiş sürümü yükleyin.

## Yayımcı rehberi

Yanlış pozitifleri azaltmak ve kullanıcı güvenini artırmak için:

- adları, özetleri, etiketleri ve değişiklik günlüklerini doğru tutun
- gerekli ortam değişkenlerini ve izinleri beyan edin
- karmaşıklaştırılmış kurulum komutlarından kaçının
- mümkün olduğunda kaynağa bağlantı verin
- plugin'leri yayımlamadan önce kuru çalıştırmaları kullanın
- kullanıcılar veya moderatörler sürüm davranışı hakkında soru sorarsa açıkça yanıt verin
