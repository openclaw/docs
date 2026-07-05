---
read_when:
    - Bir beceriyi, Plugin'i veya paketi bildirme
    - Engellenmiş, gizlenmiş veya beklemeye alınmış bir listelemeden kurtarma
    - ClawHub moderasyonunu, yasaklamaları veya hesap durumunu anlama
sidebarTitle: Moderation and Account Safety
summary: ClawHub raporlarının, moderasyon bekletmelerinin, gizli listelemelerin, yasaklamaların ve hesap durumunun nasıl çalıştığı.
title: Moderasyon ve Hesap Güvenliği
x-i18n:
    generated_at: "2026-07-05T05:29:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 54c1e0860411e6599923ef4d7db65d5cd5406ec63bf67c52968b4f99d893ffef
    source_path: clawhub/moderation.md
    workflow: 16
---

# Moderasyon ve Hesap Güvenliği

ClawHub yayımlamaya açıktır, ancak herkese açık keşif ve kurulum yüzeylerinin yine de
koruyucu sınırlara ihtiyacı vardır. Raporlar, moderasyon bekletmeleri, gizli listeler ve hesap işlemleri,
bir sürüm veya hesap güvensiz, yanıltıcı ya da politika dışı göründüğünde kullanıcıları korumaya
yardımcı olur.

Bu sayfa moderasyonu ve hesap durumunu kapsar. `Pass`, `Review`, `Warn`, `Malicious`
gibi denetim etiketleri ve risk seviyesi için bkz.
[Güvenlik Denetimleri](/clawhub/security-audits).

Ayrıca bkz. [Güvenlik](/clawhub/security) ve
[Kabul edilebilir kullanım](/clawhub/acceptable-usage). Telif hakkı veya diğer içerik
haklarıyla ilgili endişeler için [İçerik Hakları Talepleri](/clawhub/content-rights) sayfasını kullanın.

## Raporlar

Oturum açmış kullanıcılar Skills, plugins ve paketleri raporlayabilir.

ClawHub raporlarını yalnızca aşağıdakiler gibi güvensiz pazar yeri içerikleri için kullanın:

- kötü amaçlı listeler
- yanıltıcı meta veriler
- beyan edilmemiş kimlik bilgileri veya izin gereksinimleri
- şüpheli kurulum talimatları
- kimliğe bürünme
- kötü niyetli kayıtlar veya ticari marka kötüye kullanımı
- [Kabul edilebilir kullanım](/clawhub/acceptable-usage) kurallarını ihlal eden içerik

Bir skill sayfasındaki **Skill'i bildir** düğmesini veya paketler için paket raporlama
komutunu/API'sini kullanın.

ClawHub raporlarını üçüncü taraf bir skill veya Plugin'in kendi kaynak kodundaki güvenlik açıkları için kullanmayın.
Bunları doğrudan yayımcıya veya listeden bağlantısı verilen kaynak deposuna bildirin.
ClawHub üçüncü taraf skill veya Plugin kodunun bakımını yapmaz ya da bunlara yama uygulamaz.

`openclaw/clawhub` için GitHub Security Advisories, ClawHub'ın kendisindeki güvenlik açıkları içindir.
Örnekler arasında web sitesi, API, CLI, kayıt defteri, kimlik doğrulama,
tarama, moderasyon veya indirme/kurulum güven sınırlarındaki hatalar bulunur. ClawHub
duyurularını üçüncü taraf Skills veya plugins içindeki güvenlik açıkları için kullanmayın.

İyi raporlar belirli ve uygulanabilirdir. Raporlamanın kötüye kullanımı da
hesap işlemine yol açabilir.

## Organizasyon ve ad alanı talepleri

Organizasyon, marka, paket kapsamı, sahip tanıtıcısı veya ad alanı sahipliği anlaşmazlıkları,
ürün içi rapor akışı ya da hesap itiraz formu yerine
[Organizasyon ve Ad Alanı Talepleri](/clawhub/namespace-claims) sürecini kullanmalıdır.

Bir ad alanının ayrılması, devredilmesi, yeniden adlandırılması, gizlenmesi, karantinaya alınması, takma adla eşlenmesi
veya başka şekilde incelenmesi gerektiğine dair hassas olmayan kanıtları ClawHub personelinin incelemesi gerektiğinde
bu süreci kullanın. Herkese açık bir konuya gizli bilgiler, özel belgeler, özel yasal dosyalar,
kişisel kimlik belgeleri, API token'ları veya DNS challenge token'ları eklemeyin.

## Moderasyon bekletmeleri

Bazı ciddi bulgular veya politika sorunları, bir yayımcıyı ya da listeyi
moderasyon bekletmesine alabilir. Bu gerçekleştiğinde, etkilenen içerik herkese açık
keşiften gizlenebilir veya gelecekteki yayımlar sorun incelenene kadar gizli başlayabilir.

Moderasyon bekletmeleri, ClawHub yüksek riskli vakaları çözerken kullanıcıları korumayı amaçlar.
Yanlış pozitif doğrulandığında da kaldırılabilirler.

## Gizli veya engellenmiş listeler

Bir liste herkese açık kurulum yüzeylerinde bekletilmiş, gizlenmiş, karantinaya alınmış, iptal edilmiş
veya başka şekilde kullanılamaz durumda olabilir.

Bu durumlardan birini görürseniz, sahip sorunu çözmedikçe veya moderasyon listeyi geri yüklemedikçe
sürümü kurmayın.

Sahipler, kendi bekletilen veya gizlenen listeleri için tanılamaları yine de görebilir. Bu
tanılamalar, ne olduğunu ve listenin herkese açık yüzeylere dönebilmesi için nelerin
değişmesi gerektiğini açıklamaya yardımcı olur.

## Yasaklamalar ve hesap durumu

ClawHub politikasını ihlal eden hesaplar yayımlama erişimini kaybedebilir. Ciddi kötüye kullanım,
hesap yasaklarına, token iptaline, gizli içeriğe veya kaldırılmış listelere yol açabilir.
Yayımcı kötüye kullanım baskısı sinyalleri günlük olarak kontrol edilir. ClawHub'ın olası yasaklama
eşiğine ulaşan sinyaller otomatik bir uyarıyı tetikleyebilir. Uyarı son tarihinden sonraki
bir sonraki uygun tarama yayımcıyı hâlâ olası yasaklama eşiğinde gösteriyorsa, ClawHub
hesap işlemini otomatik olarak uygulayabilir. Daha düşük güvenilirlikli ve sınırlı zamansal inceleme
sinyalleri otomatik yaptırımın dışında kalır.

Silinmiş, yasaklanmış veya devre dışı bırakılmış hesaplar ClawHub API token'larını kullanamaz. Hesap
işleminden sonra CLI kimlik doğrulaması başarısız olmaya başlarsa, hesap durumunu incelemek için web UI'da
oturum açın. Oturum açma veya normal CLI erişimi bir yasak ya da devre dışı hesap nedeniyle engellenmişse,
kurtarma incelemesi için [ClawHub itiraz formunu](https://appeals.openclaw.ai/) kullanın.

Tarayıcı tarafından tetiklenen bir e-posta bir skill veya Plugin sürümünü kötü amaçlı olarak adlandırıyorsa,
engellenen gönderilmiş sürüm için saklanan tarama sonuçlarını indirin:
`clawhub scan download <slug> --version <version>`. Plugins için
`--kind plugin` ekleyin. Tarama çıktısını inceleyin, listeyi düzeltin, sürüm
numarasını artırın ve düzeltilmiş sürümü yükleyin.

## Yayımcı kılavuzu

Yanlış pozitifleri azaltmak ve kullanıcı güvenini artırmak için:

- adları, özetleri, etiketleri ve değişiklik günlüklerini doğru tutun
- gerekli ortam değişkenlerini ve izinleri beyan edin
- gizlenmiş kurulum komutlarından kaçının
- mümkün olduğunda kaynağa bağlantı verin
- plugins yayımlamadan önce kuru çalıştırmalar kullanın
- kullanıcılar veya moderatörler sürüm davranışı hakkında soru sorarsa net yanıt verin
