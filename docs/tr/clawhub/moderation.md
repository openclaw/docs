---
read_when:
    - Beceri, Plugin veya paket bildirme
    - Tutulan, gizli veya engellenmiş bir listeden kurtarma
    - ClawHub moderasyonunu, yasakları veya hesap durumunu anlama
sidebarTitle: Moderation and Account Safety
summary: ClawHub bildirimleri, moderasyon bekletmeleri, gizli listelemeler, yasaklamalar ve hesap durumu nasıl çalışır.
title: Moderasyon ve Hesap Güvenliği
x-i18n:
    generated_at: "2026-07-03T02:53:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 54c1e0860411e6599923ef4d7db65d5cd5406ec63bf67c52968b4f99d893ffef
    source_path: clawhub/moderation.md
    workflow: 16
---

# Moderasyon ve Hesap Güvenliği

ClawHub yayımlamaya açıktır, ancak herkese açık keşif ve yükleme yüzeyleri yine de
koruyucu önlemlere ihtiyaç duyar. Raporlar, moderasyon bekletmeleri, gizli listelemeler ve hesap işlemleri,
bir sürüm veya hesap güvensiz, yanıltıcı ya da politika dışı göründüğünde kullanıcıları
korumaya yardımcı olur.

Bu sayfa moderasyonu ve hesap durumunu kapsar. `Pass`, `Review`, `Warn`, `Malicious`
gibi denetim etiketleri ve risk düzeyi için
[Güvenlik Denetimleri](/clawhub/security-audits) bölümüne bakın.

Ayrıca [Güvenlik](/clawhub/security) ve
[Kabul edilebilir kullanım](/clawhub/acceptable-usage) bölümlerine bakın. Telif hakkı veya diğer içerik
haklarıyla ilgili endişeler için [İçerik Hakları Talepleri](/clawhub/content-rights) bölümünü kullanın.

## Raporlar

Oturum açmış kullanıcılar skills, plugins ve paketleri raporlayabilir.

ClawHub raporlarını yalnızca aşağıdakiler gibi güvensiz pazar yeri içerikleri için kullanın:

- kötü amaçlı listelemeler
- yanıltıcı metadata
- beyan edilmemiş kimlik bilgileri veya izin gereksinimleri
- şüpheli yükleme talimatları
- kimliğe bürünme
- kötü niyetli kayıtlar veya ticari marka kötüye kullanımı
- [Kabul edilebilir kullanım](/clawhub/acceptable-usage) politikasını ihlal eden içerik

Bir skill sayfasındaki **Skill bildir** düğmesini veya paketler için paket raporlama
komutunu/API'sini kullanın.

ClawHub raporlarını üçüncü taraf bir skill veya
plugin’in kendi kaynak kodundaki güvenlik açıkları için kullanmayın. Bunları doğrudan yayımcıya veya listelemede bağlantısı verilen kaynak
deposuna bildirin. ClawHub üçüncü taraf skill veya plugin kodunun bakımını yapmaz ya da yama uygulamaz.

`openclaw/clawhub` için GitHub Security Advisories, ClawHub’ın kendisindeki güvenlik açıkları içindir.
Örnekler arasında web sitesi, API, CLI, registry, auth,
tarama, moderasyon veya indirme/yükleme güven sınırlarındaki hatalar bulunur. ClawHub
advisories’i üçüncü taraf skills veya plugins içindeki güvenlik açıkları için kullanmayın.

İyi raporlar belirli ve eyleme dönüktür. Raporlama özelliğinin kötüye kullanımı da
hesap işlemine yol açabilir.

## Kuruluş ve namespace talepleri

Kuruluş, marka, paket kapsamı, sahip kullanıcı adı veya namespace sahipliği anlaşmazlıkları,
ürün içi rapor akışı veya hesap itiraz formu yerine
[Kuruluş ve Namespace Talepleri](/clawhub/namespace-claims) sürecini kullanmalıdır.

ClawHub ekibinin bir namespace’in ayrılması, aktarılması, yeniden adlandırılması, gizlenmesi, karantinaya alınması, alias verilmesi
veya başka şekilde incelenmesi gerektiğine dair hassas olmayan kanıtları gözden geçirmesine ihtiyaç duyduğunuzda bu süreci kullanın.
Herkese açık bir issue içine sırlar, özel belgeler, özel hukuki
dosyalar, kişisel kimlik belgeleri, API token’ları veya DNS challenge token’ları eklemeyin.

## Moderasyon bekletmeleri

Bazı ağır bulgular veya politika sorunları, bir yayımcıyı ya da listelemeyi
moderasyon bekletmesine alabilir. Bu olduğunda, etkilenen içerik herkese açık
keşiften gizlenebilir veya gelecekteki yayımlar sorun incelenene kadar gizli başlayabilir.

Moderasyon bekletmeleri, ClawHub yüksek riskli
vakaları çözerken kullanıcıları korumayı amaçlar. Yanlış pozitif doğrulandığında da kaldırılabilirler.

## Gizli veya engellenmiş listelemeler

Bir listeleme bekletilmiş, gizlenmiş, karantinaya alınmış, iptal edilmiş veya başka şekilde
herkese açık yükleme yüzeylerinde kullanılamaz olabilir.

Bu durumlardan birini görürseniz, sahip sorunu çözene veya moderasyon bunu geri yükleyene kadar
sürümü yüklemeyin.

Sahipler, kendi bekletilmiş veya gizli listelemeleri için tanı bilgilerini hâlâ görebilir. Bu
tanı bilgileri ne olduğunu ve listelemenin herkese açık yüzeylere dönebilmesi için
neyin değişmesi gerektiğini açıklamaya yardımcı olur.

## Yasaklar ve hesap durumu

ClawHub politikasını ihlal eden hesaplar yayımlama erişimini kaybedebilir. Ağır kötüye kullanım
hesap yasaklarına, token iptaline, gizli içeriğe veya kaldırılmış listelemelere yol açabilir.
Yayımcı kötüye kullanım baskısı sinyalleri günlük olarak kontrol edilir. ClawHub’ın olası yasak eşiğine
ulaşan sinyaller otomatik bir uyarıyı tetikleyebilir. Uyarı son tarihinden sonraki
bir sonraki uygun tarama yayımcıyı hâlâ olası yasak
eşiğinde konumlandırıyorsa, ClawHub hesap işlemini otomatik olarak uygulayabilir.
Daha düşük güvenli ve sınırlı zamansal inceleme sinyalleri otomatik
yaptırımın dışında kalır.

Silinmiş, yasaklanmış veya devre dışı bırakılmış hesaplar ClawHub API token’larını kullanamaz. CLI auth,
hesap işleminden sonra başarısız olmaya başlarsa, hesap
durumunu incelemek için web UI’da oturum açın. Oturum açma veya normal CLI erişimi bir yasak ya da devre dışı bırakılmış hesap nedeniyle engellenirse,
kurtarma incelemesi için [ClawHub itiraz formunu](https://appeals.openclaw.ai/) kullanın.

Tarayıcı tarafından tetiklenen bir e-posta bir skill veya plugin sürümünü kötü amaçlı olarak adlandırıyorsa,
engellenmiş gönderilen sürüm için saklanan tarama sonuçlarını indirin:
`clawhub scan download <slug> --version <version>`. Plugins için
`--kind plugin` ekleyin. Tarama çıktısını inceleyin, listelemeyi düzeltin, sürüm
numarasını artırın ve düzeltilmiş sürümü yükleyin.

## Yayımcı rehberi

Yanlış pozitifleri azaltmak ve kullanıcı güvenini artırmak için:

- adları, özetleri, etiketleri ve changelog’ları doğru tutun
- gerekli ortam değişkenlerini ve izinleri beyan edin
- gizlenmiş yükleme komutlarından kaçının
- mümkün olduğunda kaynağa bağlantı verin
- plugins yayımlamadan önce dry run kullanın
- kullanıcılar veya moderatörler sürüm davranışı hakkında soru sorarsa açık yanıt verin
