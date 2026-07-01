---
read_when:
    - Skills, Plugin veya paket bildirme
    - Tutulan, gizli veya engellenmiş bir listelemeden kurtarma
    - ClawHub moderasyonunu, yasaklamaları veya hesap durumunu anlama
sidebarTitle: Moderation and Account Safety
summary: ClawHub raporlarının, moderasyon bekletmelerinin, gizli listelemelerin, yasakların ve hesap durumunun nasıl çalıştığı.
title: Moderasyon ve Hesap Güvenliği
x-i18n:
    generated_at: "2026-07-01T13:16:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 54c1e0860411e6599923ef4d7db65d5cd5406ec63bf67c52968b4f99d893ffef
    source_path: clawhub/moderation.md
    workflow: 16
---

# Moderasyon ve Hesap Güvenliği

ClawHub yayımlamaya açıktır, ancak herkese açık keşif ve kurulum yüzeyleri yine de güvenlik sınırlarına ihtiyaç duyar. Bildirimler, moderasyon bekletmeleri, gizli listelemeler ve hesap işlemleri, bir sürüm veya hesap güvensiz, yanıltıcı ya da politika dışı göründüğünde kullanıcıları korumaya yardımcı olur.

Bu sayfa moderasyonu ve hesap durumunu kapsar. `Pass`, `Review`, `Warn`, `Malicious` gibi denetim etiketleri ve risk düzeyi için [Güvenlik Denetimleri](/clawhub/security-audits) bölümüne bakın.

Ayrıca [Güvenlik](/clawhub/security) ve [Kabul edilebilir kullanım](/clawhub/acceptable-usage) bölümlerine de bakın. Telif hakkı veya diğer içerik haklarıyla ilgili endişeler için [İçerik Hakları Talepleri](/clawhub/content-rights) bölümünü kullanın.

## Bildirimler

Oturum açmış kullanıcılar Skills, Plugin'ler ve paketleri bildirebilir.

ClawHub bildirimlerini yalnızca aşağıdakiler gibi güvensiz pazar yeri içerikleri için kullanın:

- kötü amaçlı listelemeler
- yanıltıcı metadata
- beyan edilmemiş kimlik bilgileri veya izin gereksinimleri
- şüpheli kurulum talimatları
- kimliğe bürünme
- kötü niyetli kayıtlar veya marka kötüye kullanımı
- [Kabul edilebilir kullanım](/clawhub/acceptable-usage) kurallarını ihlal eden içerik

Bir Skills sayfasındaki **Skills'i bildir** düğmesini veya paketler için paket bildirme komutunu/API'sini kullanın.

ClawHub bildirimlerini üçüncü taraf bir Skills'in veya Plugin'in kendi kaynak kodundaki güvenlik açıkları için kullanmayın. Bunları doğrudan yayıncıya veya listelemede bağlantısı verilen kaynak deposuna bildirin. ClawHub üçüncü taraf Skills veya Plugin kodunu sürdürmez ya da yamalamaz.

`openclaw/clawhub` için GitHub Security Advisories, ClawHub'ın kendisindeki güvenlik açıkları içindir. Örnekler arasında web sitesi, API, CLI, kayıt defteri, kimlik doğrulama, tarama, moderasyon veya indirme/kurulum güven sınırlarındaki hatalar yer alır. Üçüncü taraf Skills veya Plugin'lerdeki güvenlik açıkları için ClawHub advisories kullanmayın.

İyi bildirimler belirli ve eyleme geçirilebilirdir. Bildirim sisteminin kötüye kullanılması da hesap işlemine yol açabilir.

## Kuruluş ve ad alanı talepleri

Kuruluş, marka, paket kapsamı, sahip kullanıcı adı veya ad alanı sahipliği anlaşmazlıkları ürün içi bildirim akışını ya da hesap itiraz formunu değil, [Kuruluş ve Ad Alanı Talepleri](/clawhub/namespace-claims) sürecini kullanmalıdır.

Bir ad alanının ayrılması, devredilmesi, yeniden adlandırılması, gizlenmesi, karantinaya alınması, alias verilmesi veya başka şekilde incelenmesi gerektiğine dair hassas olmayan kanıtları ClawHub ekibinin incelemesine ihtiyaç duyduğunuzda bu süreci kullanın. Herkese açık bir issue'ya sırlar, özel belgeler, özel hukuki dosyalar, kişisel kimlik belgeleri, API token'ları veya DNS challenge token'ları eklemeyin.

## Moderasyon bekletmeleri

Bazı ciddi bulgular veya politika sorunları bir yayıncıyı ya da listelemeyi moderasyon bekletmesine alabilir. Bu olduğunda, etkilenen içerik herkese açık keşiften gizlenebilir veya gelecekteki yayımlar sorun incelenene kadar gizli başlayabilir.

Moderasyon bekletmeleri, ClawHub yüksek riskli vakaları çözerken kullanıcıları korumayı amaçlar. Yanlış pozitif doğrulandığında da kaldırılabilirler.

## Gizli veya engellenmiş listelemeler

Bir listeleme bekletilebilir, gizlenebilir, karantinaya alınabilir, iptal edilebilir veya herkese açık kurulum yüzeylerinde başka şekilde kullanılamaz olabilir.

Bu durumlardan birini görürseniz, sahip sorunu çözmedikçe veya moderasyon listelemeyi geri yüklemedikçe sürümü kurmayın.

Sahipler kendi bekletilmiş veya gizlenmiş listelemeleri için tanılamaları yine de görebilir. Bu tanılamalar ne olduğunu ve listelemenin herkese açık yüzeylere geri dönebilmesi için nelerin değişmesi gerektiğini açıklamaya yardımcı olur.

## Yasaklar ve hesap durumu

ClawHub politikasını ihlal eden hesaplar yayımlama erişimini kaybedebilir. Ciddi kötüye kullanım; hesap yasaklarına, token iptaline, gizli içeriğe veya kaldırılmış listelemelere yol açabilir. Yayıncı kötüye kullanım baskısı sinyalleri günlük olarak kontrol edilir. ClawHub'ın olası yasak eşiğine ulaşan sinyaller otomatik bir uyarıyı tetikleyebilir. Uyarı son tarihinden sonraki ilk uygun tarama yayıncıyı hâlâ olası yasak eşiğinde gösteriyorsa ClawHub hesap işlemini otomatik olarak uygulayabilir. Daha düşük güvenli ve sınırlı zamansal inceleme sinyalleri otomatik yaptırımın dışında kalır.

Silinmiş, yasaklanmış veya devre dışı bırakılmış hesaplar ClawHub API token'larını kullanamaz. Hesap işleminden sonra CLI kimlik doğrulaması başarısız olmaya başlarsa hesap durumunu incelemek için web kullanıcı arayüzünde oturum açın. Oturum açma veya normal CLI erişimi bir yasak ya da devre dışı bırakılmış hesap tarafından engelleniyorsa kurtarma incelemesi için [ClawHub itiraz formunu](https://appeals.openclaw.ai/) kullanın.

Tarayıcı tarafından tetiklenen bir e-posta bir Skills veya Plugin sürümünü kötü amaçlı olarak adlandırıyorsa, engellenen gönderilmiş sürüm için saklanan tarama sonuçlarını indirin: `clawhub scan download <slug> --version <version>`. Plugin'ler için `--kind plugin` ekleyin. Tarama çıktısını inceleyin, listelemeyi düzeltin, sürüm numarasını artırın ve düzeltilmiş sürümü yükleyin.

## Yayıncı rehberi

Yanlış pozitifleri azaltmak ve kullanıcı güvenini iyileştirmek için:

- adları, özetleri, etiketleri ve değişiklik günlüklerini doğru tutun
- gerekli ortam değişkenlerini ve izinleri beyan edin
- gizlenmiş kurulum komutlarından kaçının
- mümkün olduğunda kaynağa bağlantı verin
- Plugin'leri yayımlamadan önce dry run kullanın
- kullanıcılar veya moderatörler sürüm davranışı hakkında soru sorarsa açık yanıt verin
