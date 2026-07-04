---
read_when:
    - Bir skill, plugin veya paketi bildirme
    - Tutulan, gizli veya engellenmiş bir listelemeden kurtarma
    - ClawHub moderasyonunu, yasakları veya hesap durumunu anlama
sidebarTitle: Moderation and Account Safety
summary: ClawHub raporlarının, moderasyon bekletmelerinin, gizli listelemelerin, yasakların ve hesap durumunun nasıl çalıştığı.
title: Moderasyon ve Hesap Güvenliği
x-i18n:
    generated_at: "2026-07-04T18:17:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 54c1e0860411e6599923ef4d7db65d5cd5406ec63bf67c52968b4f99d893ffef
    source_path: clawhub/moderation.md
    workflow: 16
---

# Moderasyon ve Hesap Güvenliği

ClawHub yayımlamaya açıktır, ancak herkese açık keşif ve kurulum yüzeyleri yine de
koruyucu sınırlara ihtiyaç duyar. Bildirimler, moderasyon bekletmeleri, gizli listelemeler ve hesap işlemleri,
bir sürüm veya hesap güvensiz, yanıltıcı ya da politika dışı göründüğünde
kullanıcıları korumaya yardımcı olur.

Bu sayfa moderasyon ve hesap durumunu kapsar. `Pass`, `Review`, `Warn`,
`Malicious` gibi denetim etiketleri ve risk düzeyi için
[Güvenlik Denetimleri](/clawhub/security-audits) bölümüne bakın.

Ayrıca [Güvenlik](/clawhub/security) ve
[Kabul edilebilir kullanım](/clawhub/acceptable-usage) bölümlerine bakın. Telif hakkı veya diğer içerik
haklarıyla ilgili endişeler için [İçerik Hakları İstekleri](/clawhub/content-rights) bölümünü kullanın.

## Bildirimler

Oturum açmış kullanıcılar skills, plugins ve paketleri bildirebilir.

ClawHub bildirimlerini yalnızca aşağıdakiler gibi güvensiz pazaryeri içerikleri için kullanın:

- kötü amaçlı listelemeler
- yanıltıcı meta veriler
- beyan edilmemiş kimlik bilgileri veya izin gereksinimleri
- şüpheli kurulum talimatları
- kimliğe bürünme
- kötü niyetli kayıtlar veya ticari marka kötüye kullanımı
- [Kabul edilebilir kullanım](/clawhub/acceptable-usage) kurallarını ihlal eden içerik

Bir skill sayfasındaki **Skill bildir** düğmesini veya paketler için paket bildirme
komutunu/API'sini kullanın.

Üçüncü taraf bir skill veya plugin'in kendi kaynak kodundaki güvenlik açıkları için
ClawHub bildirimlerini kullanmayın. Bunları doğrudan yayımcıya veya listelemede bağlantısı verilen
kaynak depoya bildirin. ClawHub üçüncü taraf skill veya plugin kodunun bakımını yapmaz
ya da yama uygulamaz.

`openclaw/clawhub` için GitHub Security Advisories, ClawHub'ın kendisindeki
güvenlik açıkları içindir. Örnekler arasında web sitesi, API, CLI, kayıt defteri, kimlik doğrulama,
tarama, moderasyon veya indirme/kurulum güven sınırlarındaki hatalar bulunur. Üçüncü taraf skills veya plugins içindeki güvenlik açıkları için ClawHub
advisory'lerini kullanmayın.

İyi bildirimler spesifik ve uygulanabilirdir. Bildirim sisteminin kötüye kullanılması da
hesap işlemine yol açabilir.

## Kuruluş ve ad alanı talepleri

Kuruluş, marka, paket kapsamı, sahip kullanıcı adı veya ad alanı sahipliği anlaşmazlıkları,
ürün içi bildirim akışını veya hesap itiraz formunu değil,
[Kuruluş ve Ad Alanı Talepleri](/clawhub/namespace-claims) sürecini kullanmalıdır.

Bir ad alanının ayrılması, devredilmesi, yeniden adlandırılması, gizlenmesi, karantinaya alınması, takma ad verilmesi
veya başka şekilde incelenmesi gerektiğine dair hassas olmayan kanıtları ClawHub ekibinin incelemesine ihtiyaç duyduğunuzda
bu süreci kullanın. Herkese açık bir issue içine sırlar, özel belgeler, özel hukuki
dosyalar, kişisel kimlik belgeleri, API token'ları veya DNS challenge token'ları eklemeyin.

## Moderasyon bekletmeleri

Bazı ciddi bulgular veya politika sorunları bir yayımcıyı ya da listelemeyi
moderasyon bekletmesine alabilir. Bu olduğunda, etkilenen içerik herkese açık
keşiften gizlenebilir veya gelecekteki yayımlar sorun incelenene kadar gizli başlayabilir.

Moderasyon bekletmeleri, ClawHub yüksek riskli vakaları çözerken kullanıcıları korumak içindir.
Yanlış pozitif doğrulandığında da kaldırılabilirler.

## Gizli veya engellenmiş listelemeler

Bir listeleme bekletilmiş, gizlenmiş, karantinaya alınmış, iptal edilmiş veya başka şekilde
herkese açık kurulum yüzeylerinde kullanılamaz olabilir.

Bu durumlardan birini görürseniz, sahip sorunu çözmedikçe veya moderasyon geri yüklemedikçe
sürümü kurmayın.

Sahipler, kendi bekletilmiş veya gizli listelemeleri için tanılamaları hâlâ görebilir. Bu
tanılamalar ne olduğunu ve listelemenin herkese açık yüzeylere dönebilmesi için neyin değişmesi gerektiğini
açıklamaya yardımcı olur.

## Yasaklar ve hesap durumu

ClawHub politikasını ihlal eden hesaplar yayımlama erişimini kaybedebilir. Ciddi kötüye kullanım,
hesap yasakları, token iptali, gizli içerik veya kaldırılmış listelemelerle sonuçlanabilir.
Yayımcı kötüye kullanım baskısı sinyalleri günlük olarak kontrol edilir. ClawHub'ın potansiyel yasak eşiğine
ulaşan sinyaller otomatik bir uyarıyı tetikleyebilir. Uyarı son tarihinden sonraki bir sonraki
uygun tarama yayımcıyı hâlâ potansiyel yasak eşiğinde tutuyorsa, ClawHub hesap işlemini otomatik olarak
uygulayabilir. Daha düşük güvenli ve sınırlı zamansal inceleme sinyalleri otomatik
yaptırımın dışında kalır.

Silinmiş, yasaklanmış veya devre dışı bırakılmış hesaplar ClawHub API token'larını kullanamaz. Hesap işleminden
sonra CLI kimlik doğrulaması başarısız olmaya başlarsa, hesap durumunu incelemek için web UI'da oturum açın.
Oturum açma veya normal CLI erişimi bir yasak ya da devre dışı bırakılmış hesap nedeniyle engellenmişse,
kurtarma incelemesi için [ClawHub itiraz formunu](https://appeals.openclaw.ai/) kullanın.

Tarayıcı tarafından tetiklenen bir e-posta bir skill veya plugin sürümünü kötü amaçlı olarak adlandırıyorsa,
engellenmiş gönderilen sürüm için saklanan tarama sonuçlarını indirin:
`clawhub scan download <slug> --version <version>`. Plugins için
`--kind plugin` ekleyin. Tarama çıktısını inceleyin, listelemeyi düzeltin, sürüm
numarasını artırın ve düzeltilmiş sürümü yükleyin.

## Yayımcı yönergeleri

Yanlış pozitifleri azaltmak ve kullanıcı güvenini artırmak için:

- adları, özetleri, etiketleri ve changelog'ları doğru tutun
- gerekli ortam değişkenlerini ve izinleri beyan edin
- gizlenmiş kurulum komutlarından kaçının
- mümkün olduğunda kaynağa bağlantı verin
- plugins yayımlamadan önce kuru çalıştırmalar kullanın
- kullanıcılar veya moderatörler sürüm davranışı hakkında soru sorarsa net yanıt verin
