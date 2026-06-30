---
read_when:
    - Bir skill, plugin veya paketi bildirme
    - Gizli, engellenmiş veya beklemeye alınmış bir listelemeden kurtarma
    - ClawHub moderasyonunu, yasaklamaları veya hesap durumunu anlama
sidebarTitle: Moderation and Account Safety
summary: ClawHub raporlarının, moderasyon bekletmelerinin, gizli listelemelerin, yasakların ve hesap durumunun nasıl çalıştığı.
title: Moderasyon ve Hesap Güvenliği
x-i18n:
    generated_at: "2026-06-30T22:28:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 54c1e0860411e6599923ef4d7db65d5cd5406ec63bf67c52968b4f99d893ffef
    source_path: clawhub/moderation.md
    workflow: 16
---

# Moderasyon ve Hesap Güvenliği

ClawHub yayımlamaya açıktır, ancak herkese açık keşif ve kurulum yüzeyleri yine de
koruyucu sınırlara ihtiyaç duyar. Bildirimler, moderasyon bekletmeleri, gizli listeler ve hesap işlemleri,
bir sürüm veya hesap güvensiz, yanıltıcı ya da politika dışı göründüğünde
kullanıcıları korumaya yardımcı olur.

Bu sayfa moderasyonu ve hesap durumunu kapsar. `Pass`, `Review`, `Warn`,
`Malicious` gibi denetim etiketleri ve risk düzeyi için
[Güvenlik Denetimleri](/clawhub/security-audits) bölümüne bakın.

Ayrıca [Güvenlik](/clawhub/security) ve
[Kabul edilebilir kullanım](/clawhub/acceptable-usage) bölümlerine bakın. Telif hakkı veya diğer içerik
haklarıyla ilgili endişeler için [İçerik Hakları Talepleri](/clawhub/content-rights) bölümünü kullanın.

## Bildirimler

Oturum açmış kullanıcılar Skills, Plugin’leri ve paketleri bildirebilir.

ClawHub bildirimlerini yalnızca aşağıdakiler gibi güvenli olmayan pazar yeri içerikleri için kullanın:

- kötü amaçlı listeler
- yanıltıcı meta veriler
- beyan edilmemiş kimlik bilgileri veya izin gereksinimleri
- şüpheli kurulum talimatları
- kimliğe bürünme
- kötü niyetli kayıtlar veya ticari marka kötüye kullanımı
- [Kabul edilebilir kullanım](/clawhub/acceptable-usage) politikasını ihlal eden içerik

Bir skill sayfasındaki **Skill bildir** düğmesini veya paketler için paket bildirme
komutunu/API’sini kullanın.

ClawHub bildirimlerini üçüncü taraf bir skill’in veya
Plugin’in kendi kaynak kodundaki güvenlik açıkları için kullanmayın. Bunları doğrudan yayımcıya veya listeden bağlantı verilen kaynak
deposuna bildirin. ClawHub üçüncü taraf skill veya Plugin kodunun bakımını yapmaz ya da yama uygulamaz.

`openclaw/clawhub` için GitHub Security Advisories, ClawHub’ın
kendisindeki güvenlik açıkları içindir. Örnekler arasında web sitesi, API, CLI, kayıt defteri, kimlik doğrulama,
tarama, moderasyon veya indirme/kurulum güven sınırlarındaki hatalar bulunur. ClawHub
güvenlik danışmanlıklarını üçüncü taraf Skills veya Plugin’lerdeki güvenlik açıkları için kullanmayın.

İyi bildirimler belirli ve eyleme geçirilebilirdir. Bildirim sisteminin kötüye kullanılması da
hesap işlemine yol açabilir.

## Kuruluş ve ad alanı talepleri

Kuruluş, marka, paket kapsamı, sahip kullanıcı adı veya ad alanı sahipliği anlaşmazlıkları,
ürün içi bildirim akışı ya da hesap itiraz formu yerine
[Kuruluş ve Ad Alanı Talepleri](/clawhub/namespace-claims) sürecini kullanmalıdır.

ClawHub ekibinin bir ad alanının ayrılması, devredilmesi, yeniden adlandırılması, gizlenmesi, karantinaya alınması, takma ad verilmesi
veya başka şekilde incelenmesi gerektiğine dair hassas olmayan kanıtları incelemesi gerektiğinde bu süreci kullanın. Herkese açık bir issue içine sırlar, özel belgeler, özel hukuki
dosyalar, kişisel kimlik belgeleri, API token’ları veya DNS challenge token’ları eklemeyin.

## Moderasyon bekletmeleri

Bazı ciddi bulgular veya politika sorunları bir yayımcıyı ya da listeyi
moderasyon bekletmesine alabilir. Bu olduğunda, etkilenen içerik herkese açık
keşiften gizlenebilir veya gelecekteki yayımlar sorun incelenene kadar gizli başlayabilir.

Moderasyon bekletmeleri, ClawHub yüksek riskli
vaka çözümlerini yaparken kullanıcıları korumak içindir. Yanlış pozitif doğrulandığında bunlar kaldırılabilir.

## Gizli veya engellenmiş listeler

Bir liste bekletilmiş, gizlenmiş, karantinaya alınmış, iptal edilmiş veya başka şekilde herkese açık
kurulum yüzeylerinde kullanılamaz durumda olabilir.

Bu durumlardan birini görürseniz, sahip sorunu çözmedikçe
veya moderasyon listeyi geri yüklemedikçe sürümü kurmayın.

Sahipler, kendi bekletilmiş veya gizli listeleri için tanılamaları hâlâ görebilir. Bu
tanılamalar ne olduğunu ve listenin herkese açık yüzeylere dönebilmesi için
neyin değişmesi gerektiğini açıklamaya yardımcı olur.

## Yasaklar ve hesap durumu

ClawHub politikasını ihlal eden hesaplar yayımlama erişimini kaybedebilir. Ciddi kötüye kullanım
hesap yasaklarına, token iptaline, gizli içeriğe veya kaldırılmış listelere yol açabilir.
Yayımcı kötüye kullanım baskısı sinyalleri günlük olarak denetlenir. ClawHub’ın olası yasak eşiğine
ulaşan sinyaller otomatik bir uyarıyı tetikleyebilir. Uyarı son tarihinden sonraki ilk
uygun tarama yayımcıyı hâlâ olası yasak eşiğinde gösterirse, ClawHub hesap işlemini otomatik olarak
uygulayabilir. Daha düşük güvenli ve sınırlı zamansal inceleme sinyalleri otomatik
yaptırımın dışında kalır.

Silinmiş, yasaklanmış veya devre dışı bırakılmış hesaplar ClawHub API token’larını kullanamaz. CLI kimlik doğrulaması
hesap işleminden sonra başarısız olmaya başlarsa, hesap
durumunu incelemek için web arayüzünde oturum açın. Oturum açma veya normal CLI erişimi bir yasak ya da devre dışı bırakılmış hesap nedeniyle engellenirse,
kurtarma incelemesi için [ClawHub itiraz formunu](https://appeals.openclaw.ai/) kullanın.

Tarayıcı tarafından tetiklenen bir e-posta bir skill veya Plugin sürümünü kötü amaçlı olarak adlandırıyorsa,
engellenen gönderilmiş sürüm için saklanan tarama sonuçlarını indirin:
`clawhub scan download <slug> --version <version>`. Plugin’ler için
`--kind plugin` ekleyin. Tarama çıktısını inceleyin, listeyi düzeltin, sürüm
numarasını artırın ve düzeltilmiş sürümü yükleyin.

## Yayımcı rehberi

Yanlış pozitifleri azaltmak ve kullanıcı güvenini artırmak için:

- adları, özetleri, etiketleri ve değişiklik günlüklerini doğru tutun
- gerekli ortam değişkenlerini ve izinleri beyan edin
- gizlenmiş kurulum komutlarından kaçının
- mümkün olduğunda kaynağa bağlantı verin
- Plugin’leri yayımlamadan önce kuru çalıştırmalar kullanın
- kullanıcılar veya moderatörler sürüm davranışı hakkında soru sorarsa net yanıt verin
