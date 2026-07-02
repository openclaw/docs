---
read_when:
    - Skills, Plugin veya paket bildirme
    - Tutulan, gizli veya engellenmiş bir listelemeden kurtarma
    - ClawHub moderasyonunu, yasaklamaları veya hesap durumunu anlama
sidebarTitle: Moderation and Account Safety
summary: ClawHub raporlarının, moderasyon bekletmelerinin, gizli listelemelerin, yasaklamaların ve hesap durumunun nasıl çalıştığı.
title: Moderasyon ve Hesap Güvenliği
x-i18n:
    generated_at: "2026-07-02T22:44:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 54c1e0860411e6599923ef4d7db65d5cd5406ec63bf67c52968b4f99d893ffef
    source_path: clawhub/moderation.md
    workflow: 16
---

# Moderasyon ve Hesap Güvenliği

ClawHub yayınlamaya açıktır, ancak herkese açık keşif ve kurulum yüzeylerinin yine de koruma sınırlarına ihtiyacı vardır. Raporlar, moderasyon bekletmeleri, gizli liste kayıtları ve hesap işlemleri; bir sürüm veya hesap güvensiz, yanıltıcı ya da politika dışı göründüğünde kullanıcıları korumaya yardımcı olur.

Bu sayfa moderasyonu ve hesap durumunu kapsar. `Pass`, `Review`, `Warn`, `Malicious` gibi denetim etiketleri ve risk düzeyi için [Güvenlik Denetimleri](/clawhub/security-audits) bölümüne bakın.

Ayrıca [Güvenlik](/clawhub/security) ve [Kabul edilebilir kullanım](/clawhub/acceptable-usage) bölümlerine de bakın. Telif hakkı veya diğer içerik haklarıyla ilgili endişeler için [İçerik Hakları Talepleri](/clawhub/content-rights) bölümünü kullanın.

## Raporlar

Oturum açmış kullanıcılar becerileri, plugin’leri ve paketleri raporlayabilir.

ClawHub raporlarını yalnızca aşağıdakiler gibi güvenli olmayan pazar yeri içerikleri için kullanın:

- kötü amaçlı liste kayıtları
- yanıltıcı metadata
- beyan edilmemiş kimlik bilgileri veya izin gereksinimleri
- şüpheli kurulum talimatları
- kimliğe bürünme
- kötü niyetli kayıtlar veya ticari marka kötüye kullanımı
- [Kabul edilebilir kullanım](/clawhub/acceptable-usage) kurallarını ihlal eden içerik

Bir beceri sayfasındaki **Beceriyi raporla** düğmesini veya paketler için paket raporlama komutunu/API’sini kullanın.

Üçüncü taraf bir becerinin veya plugin’in kendi kaynak kodundaki güvenlik açıkları için ClawHub raporlarını kullanmayın. Bunları doğrudan yayımcıya veya liste kaydından bağlantı verilen kaynak deposuna raporlayın. ClawHub üçüncü taraf beceri veya plugin kodunu sürdürmez ya da yamamaz.

`openclaw/clawhub` için GitHub Security Advisories, ClawHub’ın kendisindeki güvenlik açıkları içindir. Örnekler arasında web sitesi, API, CLI, kayıt defteri, kimlik doğrulama, tarama, moderasyon veya indirme/kurulum güven sınırlarındaki hatalar yer alır. Üçüncü taraf becerilerdeki veya plugin’lerdeki güvenlik açıkları için ClawHub güvenlik bildirimlerini kullanmayın.

İyi raporlar belirli ve uygulanabilirdir. Raporlama kötüye kullanımı, tek başına hesap işlemine yol açabilir.

## Kuruluş ve namespace talepleri

Kuruluş, marka, paket kapsamı, sahip kullanıcı adı veya namespace sahipliği anlaşmazlıkları; ürün içi rapor akışını ya da hesap itiraz formunu değil, [Kuruluş ve Namespace Talepleri](/clawhub/namespace-claims) sürecini kullanmalıdır.

ClawHub personelinin bir namespace’in ayrılması, devredilmesi, yeniden adlandırılması, gizlenmesi, karantinaya alınması, diğer ad atanması veya başka şekilde incelenmesi gerektiğine dair hassas olmayan kanıtı incelemesi gerektiğinde bu süreci kullanın. Herkese açık bir issue içine gizli bilgiler, özel belgeler, özel hukuki dosyalar, kişisel kimlik belgeleri, API token’ları veya DNS challenge token’ları eklemeyin.

## Moderasyon bekletmeleri

Bazı ciddi bulgular veya politika sorunları, bir yayımcıyı ya da liste kaydını moderasyon bekletmesine alabilir. Bu olduğunda, etkilenen içerik herkese açık keşiften gizlenebilir veya gelecekteki yayınlar sorun incelenene kadar gizli başlayabilir.

Moderasyon bekletmeleri, ClawHub yüksek riskli durumları çözerken kullanıcıları korumak içindir. Yanlış pozitif doğrulandığında bunlar kaldırılabilir.

## Gizli veya engellenmiş liste kayıtları

Bir liste kaydı; bekletilmiş, gizlenmiş, karantinaya alınmış, iptal edilmiş veya herkese açık kurulum yüzeylerinde başka şekilde kullanılamaz durumda olabilir.

Bu durumlardan birini görürseniz, sahip sorunu çözmedikçe veya moderasyon kaydı geri yüklemedikçe sürümü kurmayın.

Sahipler, kendi bekletilmiş veya gizli liste kayıtları için tanılamaları yine de görebilir. Bu tanılamalar ne olduğunu ve liste kaydının herkese açık yüzeylere geri dönebilmesi için neyin değişmesi gerektiğini açıklamaya yardımcı olur.

## Yasaklar ve hesap durumu

ClawHub politikasını ihlal eden hesaplar yayınlama erişimini kaybedebilir. Ağır kötüye kullanım; hesap yasaklarına, token iptaline, gizli içeriğe veya kaldırılmış liste kayıtlarına yol açabilir. Yayımcı kötüye kullanım baskısı sinyalleri günlük olarak denetlenir. ClawHub’ın olası yasak eşiğine ulaşan sinyaller otomatik bir uyarıyı tetikleyebilir. Uyarı son tarihinden sonraki ilk uygun tarama yayımcıyı hâlâ olası yasak eşiğine yerleştiriyorsa, ClawHub hesap işlemini otomatik olarak uygulayabilir. Daha düşük güvenli ve sınırlı zamansal inceleme sinyalleri otomatik yaptırımın dışında kalır.

Silinmiş, yasaklanmış veya devre dışı bırakılmış hesaplar ClawHub API token’larını kullanamaz. CLI kimlik doğrulaması hesap işleminden sonra başarısız olmaya başlarsa, hesap durumunu incelemek için web arayüzünde oturum açın. Oturum açma veya normal CLI erişimi bir yasak ya da devre dışı bırakılmış hesap nedeniyle engellenmişse, kurtarma incelemesi için [ClawHub itiraz formunu](https://appeals.openclaw.ai/) kullanın.

Tarayıcı tarafından tetiklenen bir e-posta bir beceri veya plugin sürümünü kötü amaçlı olarak adlandırıyorsa, engellenen gönderilmiş sürüm için saklanan tarama sonuçlarını indirin: `clawhub scan download <slug> --version <version>`. Plugin’ler için `--kind plugin` ekleyin. Tarama çıktısını inceleyin, liste kaydını düzeltin, sürüm numarasını artırın ve düzeltilmiş sürümü yükleyin.

## Yayımcı rehberi

Yanlış pozitifleri azaltmak ve kullanıcı güvenini artırmak için:

- adları, özetleri, etiketleri ve değişiklik günlüklerini doğru tutun
- gerekli ortam değişkenlerini ve izinleri beyan edin
- gizlenmiş kurulum komutlarından kaçının
- mümkün olduğunda kaynağa bağlantı verin
- plugin’leri yayınlamadan önce deneme çalıştırmaları kullanın
- kullanıcılar veya moderatörler sürüm davranışı hakkında soru sorarsa açık yanıt verin
