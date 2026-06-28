---
read_when:
    - Bir skill, Plugin veya paket bildirme
    - Tutulan, gizlenen veya engellenen bir listelemeden kurtarma
    - ClawHub moderasyonunu, yasaklamaları veya hesap durumunu anlama
sidebarTitle: Moderation and Account Safety
summary: ClawHub bildirimleri, moderasyon bekletmeleri, gizli listelemeler, yasaklamalar ve hesap durumunun nasıl çalıştığı.
title: Moderasyon ve Hesap Güvenliği
x-i18n:
    generated_at: "2026-06-28T07:41:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 54c1e0860411e6599923ef4d7db65d5cd5406ec63bf67c52968b4f99d893ffef
    source_path: clawhub/moderation.md
    workflow: 16
---

# Moderasyon ve Hesap Güvenliği

ClawHub yayınlamaya açıktır, ancak herkese açık keşif ve kurulum yüzeylerinin
yine de koruma önlemlerine ihtiyacı vardır. Raporlar, moderasyon bekletmeleri,
gizli listelemeler ve hesap işlemleri; bir sürüm veya hesap güvensiz, yanıltıcı
ya da politika dışı göründüğünde kullanıcıları korumaya yardımcı olur.

Bu sayfa moderasyon ve hesap durumunu kapsar. `Pass`, `Review`, `Warn`,
`Malicious` gibi denetim etiketleri ve risk düzeyi için bkz.
[Güvenlik Denetimleri](/tr/clawhub/security-audits).

Ayrıca bkz. [Güvenlik](/tr/clawhub/security) ve
[Kabul edilebilir kullanım](/tr/clawhub/acceptable-usage). Telif hakkı veya diğer
içerik haklarıyla ilgili endişeler için [İçerik Hakları Talepleri](/tr/clawhub/content-rights)
sayfasını kullanın.

## Raporlar

Oturum açmış kullanıcılar Skills, Plugin'ler ve paketleri raporlayabilir.

ClawHub raporlarını yalnızca aşağıdakiler gibi güvensiz pazar yeri içerikleri
için kullanın:

- kötü amaçlı listelemeler
- yanıltıcı meta veriler
- beyan edilmemiş kimlik bilgileri veya izin gereksinimleri
- şüpheli kurulum talimatları
- kimliğe bürünme
- kötü niyetli kayıtlar veya ticari marka kötüye kullanımı
- [Kabul edilebilir kullanım](/tr/clawhub/acceptable-usage) politikasını ihlal eden içerik

Bir Skill sayfasındaki **Skill'i raporla** düğmesini veya paketler için paket
raporlama komutunu/API'sini kullanın.

ClawHub raporlarını üçüncü taraf bir Skill veya Plugin'in kendi kaynak kodundaki
güvenlik açıkları için kullanmayın. Bunları doğrudan yayıncıya veya listelemede
bağlantısı verilen kaynak deposuna bildirin. ClawHub, üçüncü taraf Skill veya
Plugin kodunu bakımını yapmaz ya da yamalamaz.

`openclaw/clawhub` için GitHub Güvenlik Danışmaları, ClawHub'ın kendisindeki
güvenlik açıkları içindir. Örnekler arasında web sitesi, API, CLI, kayıt
defteri, kimlik doğrulama, tarama, moderasyon veya indirme/kurulum güven
sınırlarındaki hatalar bulunur. ClawHub danışmalarını üçüncü taraf Skills veya
Plugin'lerdeki güvenlik açıkları için kullanmayın.

İyi raporlar belirli ve uygulanabilirdir. Raporlamanın kötüye kullanılması da
hesap işlemine yol açabilir.

## Kuruluş ve ad alanı talepleri

Kuruluş, marka, paket kapsamı, sahip kullanıcı adı veya ad alanı sahipliği
anlaşmazlıkları; ürün içi rapor akışı ya da hesap itiraz formu yerine
[Kuruluş ve Ad Alanı Talepleri](/tr/clawhub/namespace-claims) sürecini kullanmalıdır.

Bir ad alanının ayrılması, aktarılması, yeniden adlandırılması, gizlenmesi,
karantinaya alınması, takma ad verilmesi veya başka şekilde incelenmesi gerektiğine
dair hassas olmayan kanıtları ClawHub personelinin incelemesine ihtiyaç duyduğunuzda
bu süreci kullanın. Herkese açık bir soruna sırlar, özel belgeler, özel hukuki
dosyalar, kişisel kimlik belgeleri, API token'ları veya DNS doğrulama token'ları
eklemeyin.

## Moderasyon bekletmeleri

Bazı ciddi bulgular veya politika sorunları bir yayıncıyı ya da listelemeyi
moderasyon bekletmesine alabilir. Bu olduğunda, etkilenen içerik herkese açık
keşiften gizlenebilir veya gelecekteki yayınlar sorun incelenene kadar gizli
başlayabilir.

Moderasyon bekletmeleri, ClawHub yüksek riskli vakaları çözerken kullanıcıları
korumak içindir. Yanlış pozitif doğrulandığında da kaldırılabilirler.

## Gizli veya engellenmiş listelemeler

Bir listeleme bekletilmiş, gizlenmiş, karantinaya alınmış, iptal edilmiş veya
herkese açık kurulum yüzeylerinde başka şekilde kullanılamaz olabilir.

Bu durumlardan birini görürseniz, sahip sorunu çözene veya moderasyon onu geri
yükleyene kadar sürümü kurmayın.

Sahipler, kendi bekletilmiş veya gizli listelemeleri için tanılamaları hâlâ
görebilir. Bu tanılamalar ne olduğunu ve listelemenin herkese açık yüzeylere
dönebilmesi için nelerin değişmesi gerektiğini açıklamaya yardımcı olur.

## Yasaklar ve hesap durumu

ClawHub politikasını ihlal eden hesaplar yayınlama erişimini kaybedebilir. Ciddi
kötüye kullanım; hesap yasaklarına, token iptaline, gizli içeriğe veya kaldırılmış
listelemelere yol açabilir. Yayıncı kötüye kullanım baskısı sinyalleri günlük
olarak kontrol edilir. ClawHub'ın olası yasak eşiğine ulaşan sinyaller otomatik
bir uyarıyı tetikleyebilir. Uyarı son tarihinden sonraki uygun ilk tarama
yayıncıyı hâlâ olası yasak eşiğine yerleştirirse ClawHub hesap işlemini otomatik
olarak uygulayabilir. Daha düşük güvenli ve sınırlı zamansal inceleme sinyalleri
otomatik yaptırımın dışında kalır.

Silinmiş, yasaklanmış veya devre dışı bırakılmış hesaplar ClawHub API token'larını
kullanamaz. Hesap işleminden sonra CLI kimlik doğrulaması başarısız olmaya
başlarsa, hesap durumunu incelemek için web arayüzünde oturum açın. Oturum açma
veya normal CLI erişimi bir yasak ya da devre dışı bırakılmış hesap nedeniyle
engelleniyorsa, kurtarma incelemesi için [ClawHub itiraz formunu](https://appeals.openclaw.ai/)
kullanın.

Tarayıcı tarafından tetiklenen bir e-posta bir Skill veya Plugin sürümünü kötü
amaçlı olarak adlandırıyorsa, engellenen gönderilmiş sürüm için saklanan tarama
sonuçlarını indirin:
`clawhub scan download <slug> --version <version>`. Plugin'ler için
`--kind plugin` ekleyin. Tarama çıktısını inceleyin, listelemeyi düzeltin, sürüm
numarasını artırın ve düzeltilmiş sürümü yükleyin.

## Yayıncı rehberi

Yanlış pozitifleri azaltmak ve kullanıcı güvenini iyileştirmek için:

- adları, özetleri, etiketleri ve değişiklik günlüklerini doğru tutun
- gerekli ortam değişkenlerini ve izinleri beyan edin
- gizlenmiş kurulum komutlarından kaçının
- mümkün olduğunda kaynağa bağlantı verin
- Plugin'leri yayımlamadan önce deneme çalıştırmaları kullanın
- kullanıcılar veya moderatörler sürüm davranışı hakkında soru sorarsa açıkça yanıt verin
