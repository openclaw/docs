---
read_when:
    - Bir skill, plugin veya paketi bildirme
    - Beklemeye alınmış, gizlenmiş veya engellenmiş bir listelemeyi kurtarma
    - ClawHub moderasyonunu, yasaklamaları veya hesap durumunu anlama
sidebarTitle: Moderation and Account Safety
summary: ClawHub raporlarının, moderasyon bekletmelerinin, gizli listelemelerin, yasaklamaların ve hesap durumunun nasıl çalıştığı.
title: Moderasyon ve Hesap Güvenliği
x-i18n:
    generated_at: "2026-07-01T18:18:22Z"
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

Bu sayfa moderasyonu ve hesap durumunu kapsar. `Pass`, `Review`, `Warn`,
`Malicious` gibi denetim etiketleri ve risk seviyesi için
[Güvenlik Denetimleri](/clawhub/security-audits) bölümüne bakın.

Ayrıca [Güvenlik](/clawhub/security) ve
[Kabul edilebilir kullanım](/clawhub/acceptable-usage) bölümlerine de bakın.
Telif hakkı veya diğer içerik haklarıyla ilgili endişeler için
[İçerik Hakları Talepleri](/clawhub/content-rights) bölümünü kullanın.

## Raporlar

Oturum açmış kullanıcılar skill'leri, Plugin'leri ve paketleri raporlayabilir.

ClawHub raporlarını yalnızca aşağıdakiler gibi güvensiz pazar yeri içerikleri
için kullanın:

- kötü amaçlı listelemeler
- yanıltıcı meta veriler
- bildirilmemiş kimlik bilgileri veya izin gereksinimleri
- şüpheli kurulum talimatları
- kimliğe bürünme
- kötü niyetli kayıtlar veya ticari marka kötüye kullanımı
- [Kabul edilebilir kullanım](/clawhub/acceptable-usage) ilkesini ihlal eden içerik

Bir skill sayfasındaki **Skill'i bildir** düğmesini veya paketler için paket
raporlama komutunu/API'sini kullanın.

ClawHub raporlarını, üçüncü taraf bir skill'in veya Plugin'in kendi kaynak
kodundaki güvenlik açıkları için kullanmayın. Bunları doğrudan yayıncıya veya
listelemede bağlantısı verilen kaynak deposuna bildirin. ClawHub üçüncü taraf
skill veya Plugin kodunu bakımını yapmaz ya da yamaz.

`openclaw/clawhub` için GitHub Security Advisories, ClawHub'ın kendisindeki
güvenlik açıkları içindir. Örnekler arasında web sitesi, API, CLI, kayıt,
kimlik doğrulama, tarama, moderasyon veya indirme/kurulum güven sınırlarındaki
hatalar bulunur. ClawHub advisory'lerini üçüncü taraf skill'ler veya Plugin'lerdeki
güvenlik açıkları için kullanmayın.

İyi raporlar belirli ve eyleme geçirilebilirdir. Raporlamanın kötüye kullanımı
başlı başına hesap işlemine yol açabilir.

## Kuruluş ve ad alanı talepleri

Kuruluş, marka, paket kapsamı, sahip tanıtıcısı veya ad alanı sahipliği
anlaşmazlıkları; ürün içi rapor akışı veya hesap itiraz formu yerine
[Kuruluş ve Ad Alanı Talepleri](/clawhub/namespace-claims) sürecini kullanmalıdır.

Bir ad alanının ayrılması, devredilmesi, yeniden adlandırılması, gizlenmesi,
karantinaya alınması, takma ad verilmesi veya başka şekilde incelenmesi gerektiğine
dair hassas olmayan kanıtları ClawHub ekibinin incelemesine ihtiyaç duyduğunuzda
bu süreci kullanın. Herkese açık bir issue'ya sırlar, özel belgeler, özel hukuki
dosyalar, kişisel kimlik belgeleri, API token'ları veya DNS challenge token'ları
eklemeyin.

## Moderasyon bekletmeleri

Bazı ciddi bulgular veya politika sorunları, bir yayıncıyı ya da listelemeyi
moderasyon bekletmesine alabilir. Bu olduğunda, etkilenen içerik herkese açık
keşiften gizlenebilir veya gelecekteki yayınlar sorun incelenene kadar gizli
başlayabilir.

Moderasyon bekletmeleri, ClawHub yüksek riskli vakaları çözerken kullanıcıları
korumayı amaçlar. Yanlış pozitif doğrulandığında da kaldırılabilirler.

## Gizli veya engellenmiş listelemeler

Bir listeleme herkese açık kurulum yüzeylerinde bekletilmiş, gizlenmiş,
karantinaya alınmış, iptal edilmiş veya başka şekilde kullanılamaz durumda
olabilir.

Bu durumlardan birini görürseniz, sahip sorunu çözmedikçe veya moderasyon
listelemeyi geri yüklemedikçe sürümü kurmayın.

Sahipler, kendi bekletilmiş veya gizli listelemeleri için tanı bilgilerini
görmeye devam edebilir. Bu tanı bilgileri, ne olduğunu ve listelemenin herkese
açık yüzeylere dönebilmesi için neyin değişmesi gerektiğini açıklamaya yardımcı
olur.

## Yasaklar ve hesap durumu

ClawHub politikasını ihlal eden hesaplar yayınlama erişimini kaybedebilir. Ciddi
kötüye kullanım; hesap yasaklarına, token iptaline, gizli içeriğe veya kaldırılmış
listelemelere yol açabilir. Yayıncı kötüye kullanım baskısı sinyalleri günlük
olarak kontrol edilir. ClawHub'ın olası yasak eşiğine ulaşan sinyaller otomatik
uyarıyı tetikleyebilir. Uyarı son tarihinden sonraki uygun ilk tarama yayıncıyı
hâlâ olası yasak eşiğine yerleştirirse, ClawHub hesap işlemini otomatik olarak
uygulayabilir. Daha düşük güvenli ve sınırlı zamansal inceleme sinyalleri
otomatik yaptırım dışında kalır.

Silinmiş, yasaklanmış veya devre dışı bırakılmış hesaplar ClawHub API token'larını
kullanamaz. CLI kimlik doğrulaması bir hesap işleminden sonra başarısız olmaya
başlarsa, hesap durumunu incelemek için web arayüzünde oturum açın. Oturum açma
veya normal CLI erişimi bir yasak ya da devre dışı bırakılmış hesap nedeniyle
engelleniyorsa, kurtarma incelemesi için
[ClawHub itiraz formunu](https://appeals.openclaw.ai/) kullanın.

Tarayıcı tarafından tetiklenen bir e-posta bir skill veya Plugin sürümünü kötü
amaçlı olarak adlandırıyorsa, engellenen gönderilmiş sürüm için saklanan tarama
sonuçlarını indirin:
`clawhub scan download <slug> --version <version>`. Plugin'ler için
`--kind plugin` ekleyin. Tarama çıktısını inceleyin, listelemeyi düzeltin, sürüm
numarasını artırın ve düzeltilmiş sürümü yükleyin.

## Yayıncı rehberi

Yanlış pozitifleri azaltmak ve kullanıcı güvenini artırmak için:

- adları, özetleri, etiketleri ve değişiklik günlüklerini doğru tutun
- gerekli ortam değişkenlerini ve izinleri bildirin
- karartılmış kurulum komutlarından kaçının
- mümkün olduğunda kaynağa bağlantı verin
- Plugin'leri yayınlamadan önce dry run kullanın
- kullanıcılar veya moderatörler sürüm davranışı hakkında soru sorarsa açıkça yanıt verin
