---
read_when:
    - Bir Skills, Plugin veya paket bildirme
    - Tutulan, gizli veya engellenmiş bir listelemeden kurtarma
    - ClawHub moderasyonunu, yasaklamaları veya hesap durumunu anlama
sidebarTitle: Moderation and Account Safety
summary: ClawHub raporlarının, moderasyon bekletmelerinin, gizli listelemelerin, yasakların ve hesap durumunun nasıl çalıştığı.
title: Moderasyon ve Hesap Güvenliği
x-i18n:
    generated_at: "2026-07-04T04:02:37Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 54c1e0860411e6599923ef4d7db65d5cd5406ec63bf67c52968b4f99d893ffef
    source_path: clawhub/moderation.md
    workflow: 16
---

# Moderasyon ve Hesap Güvenliği

ClawHub yayımlamaya açıktır, ancak herkese açık keşif ve kurulum yüzeyleri yine
de koruma önlemlerine ihtiyaç duyar. Raporlar, moderasyon bekletmeleri, gizli
listelemeler ve hesap işlemleri; bir sürüm veya hesap güvensiz, yanıltıcı ya da
politika dışı göründüğünde kullanıcıları korumaya yardımcı olur.

Bu sayfa moderasyonu ve hesap durumunu kapsar. `Pass`, `Review`, `Warn`,
`Malicious` gibi denetim etiketleri ve risk düzeyi için bkz.
[Güvenlik Denetimleri](/clawhub/security-audits).

Ayrıca bkz. [Güvenlik](/clawhub/security) ve
[Kabul edilebilir kullanım](/clawhub/acceptable-usage). Telif hakkı veya diğer
içerik haklarıyla ilgili endişeler için [İçerik Hakları Talepleri](/clawhub/content-rights)
sayfasını kullanın.

## Raporlar

Oturum açmış kullanıcılar Skills, Plugin'ler ve paketleri raporlayabilir.

ClawHub raporlarını yalnızca aşağıdakiler gibi güvenli olmayan pazar yeri
içerikleri için kullanın:

- kötü amaçlı listelemeler
- yanıltıcı meta veriler
- beyan edilmemiş kimlik bilgileri veya izin gereksinimleri
- şüpheli kurulum talimatları
- kimliğe bürünme
- kötü niyetli kayıtlar veya ticari marka kötüye kullanımı
- [Kabul edilebilir kullanım](/clawhub/acceptable-usage) kurallarını ihlal eden içerik

Bir Skills sayfasındaki **Skills'i raporla** düğmesini veya paketler için paket
raporlama komutunu/API'sini kullanın.

Üçüncü taraf bir Skills'in veya Plugin'in kendi kaynak kodundaki güvenlik
açıkları için ClawHub raporlarını kullanmayın. Bunları doğrudan yayıncıya veya
listelemede bağlantısı verilen kaynak deposuna bildirin. ClawHub, üçüncü taraf
Skills veya Plugin kodunun bakımını yapmaz ya da yama uygulamaz.

`openclaw/clawhub` için GitHub Security Advisories, ClawHub'ın kendisindeki
güvenlik açıkları içindir. Örnekler; web sitesi, API, CLI, kayıt defteri, kimlik
doğrulama, tarama, moderasyon veya indirme/kurulum güven sınırlarındaki hataları
içerir. Üçüncü taraf Skills veya Plugin'lerdeki güvenlik açıkları için ClawHub
güvenlik duyurularını kullanmayın.

İyi raporlar belirli ve işlem yapılabilir niteliktedir. Raporlamanın kötüye
kullanılması da hesap işlemine yol açabilir.

## Kuruluş ve ad alanı talepleri

Kuruluş, marka, paket kapsamı, sahip kullanıcı adı veya ad alanı sahipliği
anlaşmazlıkları; ürün içi rapor akışını veya hesap itiraz formunu değil,
[Kuruluş ve Ad Alanı Talepleri](/clawhub/namespace-claims) sürecini kullanmalıdır.

Bir ad alanının ayrılması, devredilmesi, yeniden adlandırılması, gizlenmesi,
karantinaya alınması, diğer ad verilmesi veya başka şekilde incelenmesi
gerektiğine dair hassas olmayan kanıtları ClawHub personelinin incelemesine
ihtiyaç duyduğunuzda bu süreci kullanın. Herkese açık bir konuya sırlar, özel
belgeler, özel hukuki dosyalar, kişisel kimlik belgeleri, API belirteçleri veya
DNS doğrulama belirteçleri eklemeyin.

## Moderasyon bekletmeleri

Bazı ciddi bulgular veya politika sorunları, bir yayıncıyı ya da listelemeyi
moderasyon bekletmesine alabilir. Bu durumda etkilenen içerik herkese açık
keşiften gizlenebilir veya gelecekteki yayımlar, sorun incelenene kadar gizli
başlayabilir.

Moderasyon bekletmeleri, ClawHub yüksek riskli durumları çözerken kullanıcıları
korumak içindir. Yanlış pozitif doğrulandığında da kaldırılabilirler.

## Gizli veya engellenmiş listelemeler

Bir listeleme herkese açık kurulum yüzeylerinde bekletilmiş, gizlenmiş,
karantinaya alınmış, iptal edilmiş veya başka şekilde kullanılamaz olabilir.

Bu durumlardan birini görürseniz, sahip sorunu çözmedikçe veya moderasyon
listelemeyi geri yüklemedikçe sürümü kurmayın.

Sahipler, kendi bekletilmiş veya gizli listelemeleri için tanılamaları görmeye
devam edebilir. Bu tanılamalar ne olduğunu ve listelemenin herkese açık yüzeylere
dönebilmesi için neyin değişmesi gerektiğini açıklamaya yardımcı olur.

## Yasaklamalar ve hesap durumu

ClawHub politikasını ihlal eden hesaplar yayımlama erişimini kaybedebilir. Ciddi
kötüye kullanım; hesap yasaklarına, belirteç iptaline, gizli içeriğe veya
kaldırılmış listelemelere yol açabilir. Yayıncı kötüye kullanım baskısı
sinyalleri günlük olarak kontrol edilir. ClawHub'ın olası yasaklama eşiğine
ulaşan sinyaller otomatik bir uyarıyı tetikleyebilir. Uyarı son tarihinden
sonraki ilk uygun tarama yayıncıyı hâlâ olası yasaklama eşiğine yerleştirirse,
ClawHub hesap işlemini otomatik olarak uygulayabilir. Daha düşük güvenilirlikli
ve sınırlı zamansal inceleme sinyalleri otomatik yaptırımın dışında kalır.

Silinmiş, yasaklanmış veya devre dışı bırakılmış hesaplar ClawHub API
belirteçlerini kullanamaz. Hesap işleminden sonra CLI kimlik doğrulaması
başarısız olmaya başlarsa, hesap durumunu incelemek için web arayüzünde oturum
açın. Oturum açma veya normal CLI erişimi bir yasak ya da devre dışı bırakılmış
hesap nedeniyle engellenmişse, kurtarma incelemesi için [ClawHub itiraz formunu](https://appeals.openclaw.ai/)
kullanın.

Tarayıcı tarafından tetiklenen bir e-posta bir Skills veya Plugin sürümünü kötü
amaçlı olarak adlandırıyorsa, engellenen gönderilmiş sürüm için saklanan tarama
sonuçlarını indirin: `clawhub scan download <slug> --version <version>`.
Plugin'ler için `--kind plugin` ekleyin. Tarama çıktısını inceleyin, listelemeyi
düzeltin, sürüm numarasını artırın ve düzeltilmiş sürümü yükleyin.

## Yayıncı rehberi

Yanlış pozitifleri azaltmak ve kullanıcı güvenini artırmak için:

- adları, özetleri, etiketleri ve değişiklik günlüklerini doğru tutun
- gerekli ortam değişkenlerini ve izinleri beyan edin
- gizlenmiş kurulum komutlarından kaçının
- mümkün olduğunda kaynağa bağlantı verin
- Plugin'leri yayımlamadan önce kuru çalıştırmaları kullanın
- kullanıcılar veya moderatörler sürüm davranışı hakkında soru sorarsa açık yanıt verin
