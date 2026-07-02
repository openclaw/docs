---
read_when:
    - Bir Skills, Plugin veya paketi bildirme
    - Bekletilen, gizli veya engellenmiş bir listelemeden kurtarma
    - ClawHub moderasyonunu, yasaklamaları veya hesap durumunu anlama
sidebarTitle: Moderation and Account Safety
summary: ClawHub raporlarının, moderasyon bekletmelerinin, gizli listelemelerin, yasaklamaların ve hesap durumunun nasıl çalıştığı.
title: Moderasyon ve Hesap Güvenliği
x-i18n:
    generated_at: "2026-07-02T01:10:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 54c1e0860411e6599923ef4d7db65d5cd5406ec63bf67c52968b4f99d893ffef
    source_path: clawhub/moderation.md
    workflow: 16
---

# Moderasyon ve Hesap Güvenliği

ClawHub yayınlamaya açıktır, ancak herkese açık keşif ve kurulum yüzeyleri yine de
koruyucu sınırlara ihtiyaç duyar. Raporlar, moderasyon bekletmeleri, gizli listelemeler ve hesap işlemleri,
bir sürüm veya hesap güvensiz, yanıltıcı ya da politika dışı göründüğünde kullanıcıları
korumaya yardımcı olur.

Bu sayfa moderasyonu ve hesap durumunu kapsar. `Pass`, `Review`, `Warn`,
`Malicious` gibi denetim etiketleri ve risk düzeyi için
[Güvenlik Denetimleri](/clawhub/security-audits) bölümüne bakın.

Ayrıca [Güvenlik](/clawhub/security) ve
[Kabul edilebilir kullanım](/clawhub/acceptable-usage) bölümlerine bakın. Telif hakkı veya diğer içerik
haklarıyla ilgili endişeler için [İçerik Hakları Talepleri](/clawhub/content-rights) bölümünü kullanın.

## Raporlar

Oturum açmış kullanıcılar Skills, Plugin'ler ve paketleri raporlayabilir.

ClawHub raporlarını yalnızca güvenli olmayan pazar yeri içerikleri için kullanın, örneğin:

- kötü amaçlı listelemeler
- yanıltıcı metadata
- beyan edilmemiş kimlik bilgileri veya izin gereksinimleri
- şüpheli kurulum talimatları
- kimliğe bürünme
- kötü niyetli kayıtlar veya ticari marka kötüye kullanımı
- [Kabul edilebilir kullanım](/clawhub/acceptable-usage) ihlali yapan içerik

Bir skill sayfasındaki **Skill raporla** düğmesini veya paketler için paket raporlama
komutunu/API'sini kullanın.

ClawHub raporlarını üçüncü taraf bir skill veya Plugin'in kendi kaynak kodundaki güvenlik açıkları için
kullanmayın. Bunları doğrudan yayıncıya veya listelemeden bağlantı verilen kaynak
deposuna bildirin. ClawHub üçüncü taraf skill veya Plugin kodunu bakımını yapmaz ya da yamaz.

`openclaw/clawhub` için GitHub Security Advisories, ClawHub'ın
kendisindeki güvenlik açıkları içindir. Örnekler arasında web sitesi, API, CLI, kayıt defteri, kimlik doğrulama,
tarama, moderasyon veya indirme/kurulum güven sınırlarındaki hatalar bulunur. ClawHub
danışmanlıklarını üçüncü taraf Skills veya Plugin'lerdeki güvenlik açıkları için kullanmayın.

İyi raporlar belirli ve eyleme geçirilebilirdir. Raporlamanın kötüye kullanımı da
hesap işlemine yol açabilir.

## Kuruluş ve namespace talepleri

Kuruluş, marka, paket kapsamı, sahip kullanıcı adı veya namespace sahipliği anlaşmazlıkları,
ürün içi raporlama akışı ya da hesap itiraz formu yerine
[Kuruluş ve Namespace Talepleri](/clawhub/namespace-claims) sürecini kullanmalıdır.

Bir namespace'in ayrılması, devredilmesi, yeniden adlandırılması, gizlenmesi, karantinaya alınması, takma ad verilmesi
veya başka şekilde incelenmesi gerektiğine dair hassas olmayan kanıtları ClawHub personelinin incelemesine ihtiyaç duyduğunuzda
bu süreci kullanın. Herkese açık bir issue içine sırlar, özel belgeler, özel hukuki
dosyalar, kişisel kimlik belgeleri, API token'ları veya DNS challenge token'ları eklemeyin.

## Moderasyon bekletmeleri

Bazı ciddi bulgular veya politika sorunları, bir yayıncıyı ya da listelemeyi
moderasyon bekletmesine alabilir. Bu olduğunda, etkilenen içerik herkese açık
keşiften gizlenebilir veya gelecekteki yayınlar sorun incelenene kadar gizli başlayabilir.

Moderasyon bekletmeleri, ClawHub yüksek riskli vakaları çözerken kullanıcıları korumayı
amaçlar. Yanlış pozitif doğrulandığında bunlar kaldırılabilir.

## Gizli veya engellenmiş listelemeler

Bir listeleme, herkese açık kurulum yüzeylerinde bekletilmiş, gizlenmiş, karantinaya alınmış, iptal edilmiş
veya başka şekilde kullanılamaz durumda olabilir.

Bu durumlardan birini görürseniz, sahibi sorunu çözmedikçe veya moderasyon
listelemeyi geri yüklemedikçe sürümü kurmayın.

Sahipler, kendi bekletilen veya gizli listelemeleri için tanılamaları hâlâ görebilir. Bu
tanılamalar ne olduğunu ve listelemenin herkese açık yüzeylere dönebilmesi için nelerin
değişmesi gerektiğini açıklamaya yardımcı olur.

## Yasaklar ve hesap durumu

ClawHub politikasını ihlal eden hesaplar yayınlama erişimini kaybedebilir. Ciddi kötüye kullanım
hesap yasakları, token iptali, gizli içerik veya kaldırılmış listelemelerle sonuçlanabilir.
Yayıncı kötüye kullanım baskısı sinyalleri günlük olarak kontrol edilir. ClawHub'ın
olası-yasak eşiğine ulaşan sinyaller otomatik bir uyarıyı tetikleyebilir. Uyarı son tarihinden sonraki
bir sonraki uygun tarama yayıncıyı hâlâ olası-yasak eşiğine yerleştirirse,
ClawHub hesap işlemini otomatik olarak uygulayabilir.
Daha düşük güvenli ve sınırlı zamansal inceleme sinyalleri otomatik
yaptırım dışında kalır.

Silinmiş, yasaklanmış veya devre dışı bırakılmış hesaplar ClawHub API token'larını kullanamaz. CLI kimlik doğrulaması
hesap işleminden sonra başarısız olmaya başlarsa, hesap durumunu incelemek için web kullanıcı arayüzünde
oturum açın. Oturum açma veya normal CLI erişimi bir yasak ya da devre dışı bırakılmış hesap nedeniyle engellenirse,
kurtarma incelemesi için [ClawHub itiraz formunu](https://appeals.openclaw.ai/) kullanın.

Tarayıcı tarafından tetiklenen bir e-posta bir skill veya Plugin sürümünü kötü amaçlı olarak adlandırıyorsa,
engellenen gönderilmiş sürüm için saklanan tarama sonuçlarını indirin:
`clawhub scan download <slug> --version <version>`. Plugin'ler için
`--kind plugin` ekleyin. Tarama çıktısını inceleyin, listelemeyi düzeltin, sürüm
numarasını artırın ve düzeltilmiş sürümü yükleyin.

## Yayıncı rehberi

Yanlış pozitifleri azaltmak ve kullanıcı güvenini artırmak için:

- adları, özetleri, etiketleri ve değişiklik günlüklerini doğru tutun
- gerekli ortam değişkenlerini ve izinleri beyan edin
- gizlenmiş kurulum komutlarından kaçının
- mümkün olduğunda kaynağa bağlantı verin
- Plugin'leri yayınlamadan önce kuru çalıştırmaları kullanın
- kullanıcılar veya moderatörler sürüm davranışı hakkında soru sorarsa net yanıt verin
