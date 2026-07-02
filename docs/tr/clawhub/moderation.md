---
read_when:
    - Bir beceriyi, Plugin veya paketi bildirme
    - Tutulan, gizlenen veya engellenen bir listelemeden kurtarma
    - ClawHub moderasyonunu, yasaklamaları veya hesap durumunu anlama
sidebarTitle: Moderation and Account Safety
summary: ClawHub raporlarının, moderasyon bekletmelerinin, gizli listelemelerin, yasaklamaların ve hesap durumunun nasıl işlediği.
title: Moderasyon ve Hesap Güvenliği
x-i18n:
    generated_at: "2026-07-02T14:09:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 54c1e0860411e6599923ef4d7db65d5cd5406ec63bf67c52968b4f99d893ffef
    source_path: clawhub/moderation.md
    workflow: 16
---

# Moderasyon ve Hesap Güvenliği

ClawHub yayınlamaya açıktır, ancak herkese açık keşif ve yükleme yüzeylerinin yine de güvenlik önlemlerine ihtiyacı vardır. Raporlar, moderasyon bekletmeleri, gizli listelemeler ve hesap işlemleri; bir sürüm veya hesap güvensiz, yanıltıcı ya da politika dışı göründüğünde kullanıcıları korumaya yardımcı olur.

Bu sayfa moderasyonu ve hesap durumunu kapsar. `Pass`, `Review`, `Warn`, `Malicious` gibi denetim etiketleri ve risk düzeyi için bkz. [Güvenlik Denetimleri](/clawhub/security-audits).

Ayrıca bkz. [Güvenlik](/clawhub/security) ve [Kabul edilebilir kullanım](/clawhub/acceptable-usage). Telif hakkı veya diğer içerik haklarıyla ilgili endişeler için [İçerik Hakları Talepleri](/clawhub/content-rights) sayfasını kullanın.

## Raporlar

Oturum açmış kullanıcılar Skills, Plugin'ler ve paketler için rapor gönderebilir.

ClawHub raporlarını yalnızca güvenli olmayan pazaryeri içerikleri için kullanın, örneğin:

- kötü amaçlı listelemeler
- yanıltıcı meta veriler
- beyan edilmemiş kimlik bilgileri veya izin gereksinimleri
- şüpheli yükleme talimatları
- kimliğe bürünme
- kötü niyetli kayıtlar veya marka kötüye kullanımı
- [Kabul edilebilir kullanım](/clawhub/acceptable-usage) politikasını ihlal eden içerik

Bir Skills sayfasındaki **Skills'i raporla** düğmesini veya paketler için paket raporlama komutunu/API'sini kullanın.

Üçüncü taraf bir Skills'in veya Plugin'in kendi kaynak kodundaki güvenlik açıkları için ClawHub raporlarını kullanmayın. Bunları doğrudan yayımcıya veya listelemeden bağlantı verilen kaynak deposuna bildirin. ClawHub, üçüncü taraf Skills veya Plugin kodunu sürdürmez ya da yamalamaz.

`openclaw/clawhub` için GitHub Güvenlik Danışma Bildirimleri, ClawHub'ın kendisindeki güvenlik açıkları içindir. Örnekler arasında web sitesi, API, CLI, kayıt defteri, kimlik doğrulama, tarama, moderasyon veya indirme/yükleme güven sınırlarıyla ilgili hatalar yer alır. Üçüncü taraf Skills veya Plugin'lerdeki güvenlik açıkları için ClawHub danışma bildirimlerini kullanmayın.

İyi raporlar belirli ve eyleme dönüktür. Raporlama sisteminin kötüye kullanılması da hesap işlemine yol açabilir.

## Kuruluş ve ad alanı talepleri

Kuruluş, marka, paket kapsamı, sahip kullanıcı adı veya ad alanı sahipliği anlaşmazlıkları, ürün içi raporlama akışı ya da hesap itiraz formu yerine [Kuruluş ve Ad Alanı Talepleri](/clawhub/namespace-claims) sürecini kullanmalıdır.

ClawHub ekibinin bir ad alanının ayrılması, devredilmesi, yeniden adlandırılması, gizlenmesi, karantinaya alınması, takma ad verilmesi veya başka şekilde incelenmesi gerektiğine dair hassas olmayan kanıtları gözden geçirmesine ihtiyacınız olduğunda bu süreci kullanın. Herkese açık bir soruna sırlar, özel belgeler, özel hukuki dosyalar, kişisel kimlik belgeleri, API token'ları veya DNS doğrulama token'ları eklemeyin.

## Moderasyon bekletmeleri

Bazı ciddi bulgular veya politika sorunları, bir yayımcıyı ya da listelemeyi moderasyon bekletmesine alabilir. Bu gerçekleştiğinde, etkilenen içerik herkese açık keşiften gizlenebilir veya gelecekteki yayımlar sorun incelenene kadar gizli başlayabilir.

Moderasyon bekletmeleri, ClawHub yüksek riskli durumları çözerken kullanıcıları korumak içindir. Yanlış pozitif doğrulandığında da kaldırılabilirler.

## Gizli veya engellenmiş listelemeler

Bir listeleme herkese açık yükleme yüzeylerinde bekletilmiş, gizlenmiş, karantinaya alınmış, iptal edilmiş veya başka şekilde kullanılamaz olabilir.

Bu durumlardan birini görürseniz, sahip sorunu çözmedikçe veya moderasyon listelemeyi geri yüklemedikçe sürümü yüklemeyin.

Sahipler, kendi bekletilmiş veya gizlenmiş listelemeleri için tanı bilgilerini görmeye devam edebilir. Bu tanı bilgileri, ne olduğunu ve listelemenin herkese açık yüzeylere geri dönebilmesi için nelerin değişmesi gerektiğini açıklamaya yardımcı olur.

## Yasaklamalar ve hesap durumu

ClawHub politikasını ihlal eden hesaplar yayınlama erişimini kaybedebilir. Ciddi kötüye kullanım hesap yasaklarına, token iptaline, gizli içeriğe veya kaldırılan listelemelere yol açabilir. Yayımcı kötüye kullanım baskısı sinyalleri günlük olarak kontrol edilir. ClawHub'ın olası yasak eşiğine ulaşan sinyaller otomatik bir uyarıyı tetikleyebilir. Uyarı son tarihinden sonraki bir sonraki uygun tarama yayımcıyı hâlâ olası yasak eşiğinde gösterirse, ClawHub hesap işlemini otomatik olarak uygulayabilir. Daha düşük güvenli ve sınırlı zamansal inceleme sinyalleri otomatik yaptırımın dışında kalır.

Silinmiş, yasaklanmış veya devre dışı bırakılmış hesaplar ClawHub API token'larını kullanamaz. Hesap işleminden sonra CLI kimlik doğrulaması başarısız olmaya başlarsa, hesap durumunu gözden geçirmek için web arayüzünde oturum açın. Oturum açma veya normal CLI erişimi bir yasak ya da devre dışı bırakılmış hesap nedeniyle engellenmişse, kurtarma incelemesi için [ClawHub itiraz formunu](https://appeals.openclaw.ai/) kullanın.

Tarayıcı tarafından tetiklenen bir e-posta bir Skills veya Plugin sürümünü kötü amaçlı olarak adlandırıyorsa, engellenmiş gönderilen sürüm için saklanan tarama sonuçlarını indirin: `clawhub scan download <slug> --version <version>`. Plugin'ler için `--kind plugin` ekleyin. Tarama çıktısını gözden geçirin, listelemeyi düzeltin, sürüm numarasını artırın ve düzeltilmiş sürümü yükleyin.

## Yayımcı rehberi

Yanlış pozitifleri azaltmak ve kullanıcı güvenini artırmak için:

- adları, özetleri, etiketleri ve değişiklik günlüklerini doğru tutun
- gerekli ortam değişkenlerini ve izinleri beyan edin
- gizlenmiş yükleme komutlarından kaçının
- mümkün olduğunda kaynağa bağlantı verin
- Plugin'leri yayınlamadan önce dry run kullanın
- kullanıcılar veya moderatörler sürüm davranışı hakkında soru sorarsa açık yanıt verin
