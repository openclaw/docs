---
read_when:
    - Bir skill, plugin veya paketi bildirme
    - Bekletilen, gizli veya engellenmiş bir listeden kurtarma
    - ClawHub moderasyonunu, yasaklamaları veya hesap durumunu anlama
sidebarTitle: Moderation and Account Safety
summary: ClawHub raporlarının, moderasyon bekletmelerinin, gizli listelemelerin, yasaklamaların ve hesap durumunun nasıl çalıştığı.
title: Moderasyon ve Hesap Güvenliği
x-i18n:
    generated_at: "2026-07-02T17:45:05Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 54c1e0860411e6599923ef4d7db65d5cd5406ec63bf67c52968b4f99d893ffef
    source_path: clawhub/moderation.md
    workflow: 16
---

# Moderasyon ve Hesap Güvenliği

ClawHub yayımlamaya açıktır, ancak herkese açık keşif ve kurulum yüzeyleri yine de güvenlik önlemlerine ihtiyaç duyar. Raporlar, moderasyon bekletmeleri, gizli listeler ve hesap işlemleri; bir sürüm veya hesap güvensiz, yanıltıcı ya da politika dışı göründüğünde kullanıcıları korumaya yardımcı olur.

Bu sayfa moderasyon ve hesap durumunu kapsar. `Pass`, `Review`, `Warn`, `Malicious` gibi denetim etiketleri ve risk seviyesi için bkz. [Güvenlik Denetimleri](/clawhub/security-audits).

Ayrıca bkz. [Güvenlik](/clawhub/security) ve [Kabul Edilebilir Kullanım](/clawhub/acceptable-usage). Telif hakkı veya diğer içerik haklarıyla ilgili endişeler için [İçerik Hakları Talepleri](/clawhub/content-rights) sayfasını kullanın.

## Raporlar

Oturum açmış kullanıcılar Skills, Plugin’leri ve paketleri raporlayabilir.

ClawHub raporlarını yalnızca aşağıdakiler gibi güvenli olmayan pazaryeri içerikleri için kullanın:

- kötü amaçlı listeler
- yanıltıcı meta veriler
- beyan edilmemiş kimlik bilgileri veya izin gereksinimleri
- şüpheli kurulum talimatları
- kimliğe bürünme
- kötü niyetli kayıtlar veya ticari marka kötüye kullanımı
- [Kabul Edilebilir Kullanım](/clawhub/acceptable-usage) politikasını ihlal eden içerik

Bir Skills sayfasındaki **Skills raporla** düğmesini veya paketler için paket raporlama komutunu/API’sini kullanın.

ClawHub raporlarını, üçüncü taraf bir Skills veya Plugin’in kendi kaynak kodundaki güvenlik açıkları için kullanmayın. Bunları doğrudan yayıncıya veya listeden bağlantı verilen kaynak deposuna bildirin. ClawHub üçüncü taraf Skills veya Plugin kodunun bakımını yapmaz ya da yamalamaz.

`openclaw/clawhub` için GitHub Security Advisories, ClawHub’ın kendisindeki güvenlik açıkları içindir. Örnekler arasında web sitesi, API, CLI, kayıt defteri, kimlik doğrulama, tarama, moderasyon veya indirme/kurulum güven sınırlarıyla ilgili hatalar yer alır. Üçüncü taraf Skills veya Plugin’lerdeki güvenlik açıkları için ClawHub advisories kullanmayın.

İyi raporlar belirli ve eyleme geçirilebilirdir. Raporlamanın kötüye kullanılması da hesap işlemine yol açabilir.

## Kuruluş ve ad alanı talepleri

Kuruluş, marka, paket kapsamı, sahip kullanıcı adı veya ad alanı sahipliği anlaşmazlıkları, ürün içi raporlama akışı ya da hesap itiraz formu yerine [Kuruluş ve Ad Alanı Talepleri](/clawhub/namespace-claims) sürecini kullanmalıdır.

Bir ad alanının ayrılması, devredilmesi, yeniden adlandırılması, gizlenmesi, karantinaya alınması, takma ad atanması veya başka şekilde incelenmesi gerektiğine dair hassas olmayan kanıtları ClawHub personelinin incelemesi gerektiğinde bu süreci kullanın. Herkese açık bir issue’ya sırlar, özel belgeler, özel hukuki dosyalar, kişisel kimlik belgeleri, API token’ları veya DNS challenge token’ları eklemeyin.

## Moderasyon bekletmeleri

Bazı ciddi bulgular veya politika sorunları, bir yayıncıyı ya da listeyi moderasyon bekletmesine alabilir. Bu olduğunda, etkilenen içerik herkese açık keşiften gizlenebilir veya gelecekteki yayımlar sorun incelenene kadar gizli başlayabilir.

Moderasyon bekletmeleri, ClawHub yüksek riskli vakaları çözerken kullanıcıları korumayı amaçlar. Yanlış pozitif doğrulandığında da kaldırılabilirler.

## Gizli veya engellenmiş listeler

Bir liste bekletilmiş, gizlenmiş, karantinaya alınmış, iptal edilmiş veya herkese açık kurulum yüzeylerinde başka şekilde kullanılamaz olabilir.

Bu durumlardan birini görürseniz, sahip sorunu çözene veya moderasyon listeyi geri yükleyene kadar sürümü kurmayın.

Sahipler kendi bekletilmiş veya gizli listeleri için tanılamaları görmeye devam edebilir. Bu tanılamalar, ne olduğunu ve listenin herkese açık yüzeylere geri dönebilmesi için nelerin değişmesi gerektiğini açıklamaya yardımcı olur.

## Yasaklar ve hesap durumu

ClawHub politikasını ihlal eden hesaplar yayımlama erişimini kaybedebilir. Ciddi kötüye kullanım; hesap yasaklarına, token iptaline, gizli içeriğe veya kaldırılmış listelere neden olabilir. Yayıncı kötüye kullanım baskısı sinyalleri günlük olarak kontrol edilir. ClawHub’ın olası yasak eşiğine ulaşan sinyaller otomatik bir uyarıyı tetikleyebilir. Uyarı son tarihinden sonraki ilk uygun tarama yayıncıyı hâlâ olası yasak eşiğine yerleştiriyorsa, ClawHub hesap işlemini otomatik olarak uygulayabilir. Daha düşük güvenli ve sınırlı zamansal inceleme sinyalleri otomatik yaptırımın dışında kalır.

Silinmiş, yasaklanmış veya devre dışı bırakılmış hesaplar ClawHub API token’larını kullanamaz. Hesap işleminden sonra CLI kimlik doğrulaması başarısız olmaya başlarsa, hesap durumunu incelemek için web kullanıcı arayüzünde oturum açın. Oturum açma veya normal CLI erişimi bir yasak ya da devre dışı bırakılmış hesap nedeniyle engelleniyorsa, kurtarma incelemesi için [ClawHub itiraz formunu](https://appeals.openclaw.ai/) kullanın.

Tarayıcı tarafından tetiklenen bir e-posta bir Skills veya Plugin sürümünü kötü amaçlı olarak adlandırıyorsa, engellenen gönderilmiş sürüm için saklanan tarama sonuçlarını indirin: `clawhub scan download <slug> --version <version>`. Plugin’ler için `--kind plugin` ekleyin. Tarama çıktısını inceleyin, listeyi düzeltin, sürüm numarasını artırın ve düzeltilmiş sürümü yükleyin.

## Yayıncı yönergeleri

Yanlış pozitifleri azaltmak ve kullanıcı güvenini artırmak için:

- adları, özetleri, etiketleri ve değişiklik günlüklerini doğru tutun
- gerekli ortam değişkenlerini ve izinleri beyan edin
- anlaşılması güçleştirilmiş kurulum komutlarından kaçının
- mümkün olduğunda kaynağa bağlantı verin
- Plugin yayımlamadan önce deneme çalıştırmaları kullanın
- kullanıcılar veya moderatörler sürüm davranışı hakkında soru sorarsa açık şekilde yanıt verin
