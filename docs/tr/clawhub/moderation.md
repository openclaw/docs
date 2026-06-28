---
read_when:
    - Bir Skill, Plugin veya paketi bildirme
    - Beklemeye alınmış, gizlenmiş veya engellenmiş bir listeyi kurtarma
    - ClawHub moderasyonunu, yasaklamaları veya hesap durumunu anlama
sidebarTitle: Moderation and Account Safety
summary: ClawHub bildirimlerinin, moderasyon bekletmelerinin, gizli listelemelerin, yasaklamaların ve hesap durumunun nasıl çalıştığı.
title: Moderasyon ve Hesap Güvenliği
x-i18n:
    generated_at: "2026-06-28T00:18:40Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 54c1e0860411e6599923ef4d7db65d5cd5406ec63bf67c52968b4f99d893ffef
    source_path: clawhub/moderation.md
    workflow: 16
---

# Moderasyon ve Hesap Güvenliği

ClawHub yayımlamaya açıktır, ancak herkese açık keşif ve yükleme yüzeyleri yine de
koruma önlemlerine ihtiyaç duyar. Raporlar, moderasyon bekletmeleri, gizli listelemeler ve hesap işlemleri,
bir sürüm veya hesap güvensiz, yanıltıcı ya da politika dışı göründüğünde
kullanıcıları korumaya yardımcı olur.

Bu sayfa moderasyonu ve hesap durumunu kapsar. `Pass`, `Review`, `Warn`, `Malicious`
gibi denetim etiketleri ve risk düzeyi için
[Güvenlik Denetimleri](/tr/clawhub/security-audits) sayfasına bakın.

Ayrıca [Güvenlik](/tr/clawhub/security) ve
[Kabul edilebilir kullanım](/tr/clawhub/acceptable-usage) sayfalarına bakın. Telif hakkı veya diğer içerik
haklarıyla ilgili endişeler için [İçerik Hakları Talepleri](/tr/clawhub/content-rights) sayfasını kullanın.

## Raporlar

Oturum açmış kullanıcılar Skills, plugins ve paketleri raporlayabilir.

ClawHub raporlarını yalnızca aşağıdakiler gibi güvenli olmayan pazar yeri içeriği için kullanın:

- kötü amaçlı listelemeler
- yanıltıcı meta veriler
- beyan edilmemiş kimlik bilgileri veya izin gereksinimleri
- şüpheli yükleme talimatları
- kimliğe bürünme
- kötü niyetli kayıtlar veya ticari marka kötüye kullanımı
- [Kabul edilebilir kullanım](/tr/clawhub/acceptable-usage) politikasını ihlal eden içerik

Bir skill sayfasındaki **Skill bildir** düğmesini veya paketler için paket raporlama
komutunu/API’sini kullanın.

ClawHub raporlarını üçüncü taraf bir skill veya
plugin’in kendi kaynak kodundaki güvenlik açıkları için kullanmayın. Bunları doğrudan yayımcıya veya listelemede bağlantısı verilen kaynak
deposuna bildirin. ClawHub üçüncü taraf skill veya plugin kodunun bakımını yapmaz ya da yama uygulamaz.

`openclaw/clawhub` için GitHub Güvenlik Tavsiyeleri,
ClawHub’ın kendisindeki güvenlik açıkları içindir. Örnekler; web sitesi, API, CLI, kayıt defteri, kimlik doğrulama,
tarama, moderasyon veya indirme/yükleme güven sınırlarındaki hataları içerir. ClawHub
tavsiyelerini üçüncü taraf Skills veya plugins içindeki güvenlik açıkları için kullanmayın.

İyi raporlar spesifik ve uygulanabilirdir. Raporlamanın kötüye kullanılması da
hesap işlemine yol açabilir.

## Kuruluş ve ad alanı talepleri

Kuruluş, marka, paket kapsamı, sahip kullanıcı adı veya ad alanı sahipliği anlaşmazlıkları,
ürün içi rapor akışını ya da hesap itiraz formunu değil,
[Kuruluş ve Ad Alanı Talepleri](/tr/clawhub/namespace-claims) sürecini kullanmalıdır.

Bir ad alanının ayrılması, devredilmesi, yeniden adlandırılması, gizlenmesi, karantinaya alınması, takma ad verilmesi
veya başka şekilde incelenmesi gerektiğine dair hassas olmayan kanıtı
ClawHub ekibinin incelemesi gerektiğinde bu süreci kullanın. Herkese açık bir issue içine gizli bilgiler, özel belgeler, özel hukuki
dosyalar, kişisel kimlik belgeleri, API token’ları veya DNS challenge token’ları
eklemeyin.

## Moderasyon bekletmeleri

Bazı ciddi bulgular veya politika sorunları, bir yayımcıyı ya da listelemeyi
moderasyon bekletmesine alabilir. Bu gerçekleştiğinde, etkilenen içerik herkese açık
keşiften gizlenebilir veya gelecekteki yayımlar sorun incelenene kadar gizli başlayabilir.

Moderasyon bekletmeleri, ClawHub yüksek riskli
vakalara çözüm getirirken kullanıcıları korumayı amaçlar. Yanlış pozitif doğrulandığında da kaldırılabilirler.

## Gizli veya engellenmiş listelemeler

Bir listeleme; herkese açık yükleme yüzeylerinde bekletilmiş, gizlenmiş, karantinaya alınmış, iptal edilmiş veya başka şekilde kullanılamaz durumda olabilir.

Bu durumlardan birini görürseniz, sahip sorunu çözmedikçe
veya moderasyon listelemeyi geri yüklemedikçe sürümü yüklemeyin.

Sahipler, kendi bekletilmiş veya gizlenmiş listelemeleri için tanılamaları hâlâ görebilir. Bu
tanılamalar, ne olduğunu ve listelemenin herkese açık yüzeylere geri dönebilmesi için
neyin değişmesi gerektiğini açıklamaya yardımcı olur.

## Yasaklamalar ve hesap durumu

ClawHub politikasını ihlal eden hesaplar yayımlama erişimini kaybedebilir. Ciddi kötüye kullanım,
hesap yasakları, token iptali, gizli içerik veya kaldırılmış listelemelerle
sonuçlanabilir. Yayımcı kötüye kullanım baskısı sinyalleri günlük olarak kontrol edilir.
ClawHub’ın olası yasak eşiğine ulaşan sinyaller otomatik bir uyarıyı tetikleyebilir.
Uyarı son tarihinden sonraki bir sonraki uygun tarama yayımcıyı hâlâ
olası yasak eşiğine yerleştirirse, ClawHub hesap işlemini otomatik olarak uygulayabilir.
Daha düşük güvenli ve sınırlı zamansal inceleme sinyalleri otomatik
yaptırımın dışında kalır.

Silinmiş, yasaklanmış veya devre dışı bırakılmış hesaplar ClawHub API token’larını kullanamaz. Hesap işleminden sonra CLI kimlik doğrulaması
başarısız olmaya başlarsa, hesap durumunu incelemek için web kullanıcı arayüzünde oturum açın.
Oturum açma veya normal CLI erişimi bir yasak ya da devre dışı bırakılmış hesap tarafından engelleniyorsa,
kurtarma incelemesi için [ClawHub itiraz formunu](https://appeals.openclaw.ai/) kullanın.

Tarayıcı tarafından tetiklenen bir e-posta bir skill veya plugin sürümünü kötü amaçlı olarak adlandırıyorsa,
engellenen gönderilmiş sürüm için saklanan tarama sonuçlarını indirin:
`clawhub scan download <slug> --version <version>`. Plugins için
`--kind plugin` ekleyin. Tarama çıktısını inceleyin, listelemeyi düzeltin, sürüm
numarasını artırın ve düzeltilmiş sürümü yükleyin.

## Yayımcı rehberi

Yanlış pozitifleri azaltmak ve kullanıcı güvenini artırmak için:

- adları, özetleri, etiketleri ve değişiklik günlüklerini doğru tutun
- gerekli ortam değişkenlerini ve izinleri beyan edin
- gizlenmiş yükleme komutlarından kaçının
- mümkün olduğunda kaynağa bağlantı verin
- plugins yayımlamadan önce kuru çalıştırmalar kullanın
- kullanıcılar veya moderatörler sürüm davranışı hakkında soru sorarsa net yanıt verin
