---
read_when:
    - Skills, plugin veya paket bildirme
    - Tutulan, gizli veya engellenmiş bir listelemeden kurtarma
    - ClawHub moderasyonunu, yasaklamaları veya hesap durumunu anlama
sidebarTitle: Moderation and Account Safety
summary: ClawHub raporlarının, moderasyon bekletmelerinin, gizli listelemelerin, yasaklamaların ve hesap durumunun nasıl çalıştığı.
title: Moderasyon ve Hesap Güvenliği
x-i18n:
    generated_at: "2026-06-28T08:16:13Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 54c1e0860411e6599923ef4d7db65d5cd5406ec63bf67c52968b4f99d893ffef
    source_path: clawhub/moderation.md
    workflow: 16
---

# Moderasyon ve Hesap Güvenliği

ClawHub yayımlamaya açıktır, ancak genel keşif ve kurulum yüzeylerinin yine de
koruyucu önlemlere ihtiyacı vardır. Raporlar, moderasyon bekletmeleri, gizli
listelemeler ve hesap işlemleri; bir sürüm veya hesap güvensiz, yanıltıcı ya da
politika dışı göründüğünde kullanıcıları korumaya yardımcı olur.

Bu sayfa moderasyon ve hesap durumunu kapsar. `Pass`, `Review`, `Warn`,
`Malicious` gibi denetim etiketleri ve risk düzeyi için
[Güvenlik Denetimleri](/tr/clawhub/security-audits) bölümüne bakın.

Ayrıca [Güvenlik](/tr/clawhub/security) ve
[Kabul edilebilir kullanım](/tr/clawhub/acceptable-usage) bölümlerine bakın. Telif
hakkı veya diğer içerik haklarıyla ilgili endişeler için
[İçerik Hakları Talepleri](/tr/clawhub/content-rights) bölümünü kullanın.

## Raporlar

Oturum açmış kullanıcılar Skills, plugins ve paketleri raporlayabilir.

ClawHub raporlarını yalnızca aşağıdakiler gibi güvenli olmayan pazar yeri
içerikleri için kullanın:

- kötü amaçlı listelemeler
- yanıltıcı metadata
- beyan edilmemiş kimlik bilgileri veya izin gereksinimleri
- şüpheli kurulum talimatları
- kimliğe bürünme
- kötü niyetli kayıtlar veya ticari marka kötüye kullanımı
- [Kabul edilebilir kullanım](/tr/clawhub/acceptable-usage) kurallarını ihlal eden içerik

Bir skill sayfasındaki **Skill bildir** düğmesini veya paketler için paket
raporlama komutunu/API'sini kullanın.

ClawHub raporlarını üçüncü taraf bir skill veya plugin'in kendi kaynak kodundaki
güvenlik açıkları için kullanmayın. Bunları doğrudan yayımcıya veya listelemede
bağlantısı verilen kaynak deposuna bildirin. ClawHub üçüncü taraf skill veya
plugin kodunu bakımını yapmaz ya da yamalamaz.

`openclaw/clawhub` için GitHub Security Advisories, ClawHub'ın kendisindeki
güvenlik açıkları içindir. Örnekler arasında web sitesi, API, CLI, registry,
kimlik doğrulama, tarama, moderasyon veya indirme/kurulum güven sınırlarındaki
hatalar bulunur. ClawHub advisories'i üçüncü taraf Skills veya plugins içindeki
güvenlik açıkları için kullanmayın.

İyi raporlar spesifik ve uygulanabilirdir. Raporlamanın kötüye kullanılması da
hesap işlemine yol açabilir.

## Kuruluş ve namespace talepleri

Kuruluş, marka, paket kapsamı, sahip kullanıcı adı veya namespace sahipliği
anlaşmazlıklarında ürün içi raporlama akışı ya da hesap itiraz formu yerine
[Kuruluş ve Namespace Talepleri](/tr/clawhub/namespace-claims) süreci
kullanılmalıdır.

Bir namespace'in ayrılması, devredilmesi, yeniden adlandırılması, gizlenmesi,
karantinaya alınması, alias verilmesi veya başka şekilde incelenmesi gerektiğine
dair hassas olmayan kanıtları ClawHub ekibinin incelemesine ihtiyaç duyduğunuzda
bu süreci kullanın. Herkese açık bir issue içinde sırlar, özel belgeler, özel
hukuki dosyalar, kişisel kimlik belgeleri, API token'ları veya DNS challenge
token'ları eklemeyin.

## Moderasyon bekletmeleri

Bazı ciddi bulgular veya politika sorunları bir yayımcıyı ya da listelemeyi
moderasyon bekletmesine alabilir. Bu gerçekleştiğinde, etkilenen içerik genel
keşiften gizlenebilir veya gelecekteki yayımlar sorun incelenene kadar gizli
başlayabilir.

Moderasyon bekletmeleri, ClawHub yüksek riskli vakaları çözerken kullanıcıları
korumayı amaçlar. Yanlış pozitif doğrulandığında da kaldırılabilirler.

## Gizli veya engellenmiş listelemeler

Bir listeleme genel kurulum yüzeylerinde bekletilmiş, gizlenmiş, karantinaya
alınmış, iptal edilmiş veya başka şekilde kullanılamaz olabilir.

Bu durumlardan birini görürseniz, sahip sorunu çözene veya moderasyon geri
yükleyene kadar sürümü kurmayın.

Sahipler, kendi bekletilmiş veya gizlenmiş listelemeleri için hâlâ tanılamaları
görebilir. Bu tanılamalar ne olduğunu ve listelemenin genel yüzeylere
dönebilmesi için neyin değişmesi gerektiğini açıklamaya yardımcı olur.

## Yasaklar ve hesap durumu

ClawHub politikasını ihlal eden hesaplar yayımlama erişimini kaybedebilir. Ciddi
kötüye kullanım hesap yasaklarına, token iptaline, gizli içeriğe veya kaldırılmış
listelemelere yol açabilir. Yayımcı kötüye kullanım baskısı sinyalleri günlük
olarak kontrol edilir. ClawHub'ın olası yasak eşiğine ulaşan sinyaller otomatik
bir uyarıyı tetikleyebilir. Uyarı son tarihinden sonraki bir sonraki uygun tarama
yayımcıyı hâlâ olası yasak eşiğine yerleştirirse, ClawHub hesap işlemini
otomatik olarak uygulayabilir. Daha düşük güvenli ve sınırlı zamansal inceleme
sinyalleri otomatik yaptırım dışında kalır.

Silinmiş, yasaklanmış veya devre dışı bırakılmış hesaplar ClawHub API token'larını
kullanamaz. Hesap işleminden sonra CLI kimlik doğrulaması başarısız olmaya
başlarsa, hesap durumunu incelemek için web UI'ında oturum açın. Oturum açma
veya normal CLI erişimi bir yasak ya da devre dışı bırakılmış hesap nedeniyle
engellenmişse, kurtarma incelemesi için
[ClawHub itiraz formunu](https://appeals.openclaw.ai/) kullanın.

Tarayıcı tarafından tetiklenen bir e-posta bir skill veya plugin sürümünü kötü
amaçlı olarak adlandırıyorsa, engellenen gönderilmiş sürüm için saklanan tarama
sonuçlarını indirin:
`clawhub scan download <slug> --version <version>`. Plugins için
`--kind plugin` ekleyin. Tarama çıktısını inceleyin, listelemeyi düzeltin, sürüm
numarasını artırın ve düzeltilmiş sürümü yükleyin.

## Yayımcı rehberi

Yanlış pozitifleri azaltmak ve kullanıcı güvenini artırmak için:

- adları, özetleri, etiketleri ve değişiklik günlüklerini doğru tutun
- gerekli ortam değişkenlerini ve izinleri beyan edin
- gizlenmiş kurulum komutlarından kaçının
- mümkün olduğunda kaynağa bağlantı verin
- plugins yayımlamadan önce deneme çalıştırmaları kullanın
- kullanıcılar veya moderatörler sürüm davranışı hakkında soru sorarsa açıkça yanıt verin
