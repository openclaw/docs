---
read_when:
    - Bir beceriyi, Plugin’i veya paketi bildirme
    - Bekletilen, gizlenen veya engellenen bir listelemeden kurtarma
    - ClawHub moderasyonunu, yasaklarını veya hesap durumunu anlama
sidebarTitle: Moderation and Account Safety
summary: ClawHub raporlarının, moderasyon bekletmelerinin, gizli listelemelerin, yasaklamaların ve hesap durumunun nasıl çalıştığı.
title: Moderasyon ve Hesap Güvenliği
x-i18n:
    generated_at: "2026-07-03T01:02:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 54c1e0860411e6599923ef4d7db65d5cd5406ec63bf67c52968b4f99d893ffef
    source_path: clawhub/moderation.md
    workflow: 16
---

# Moderasyon ve Hesap Güvenliği

ClawHub yayımlamaya açıktır, ancak herkese açık keşif ve yükleme yüzeylerinin
yine de güvenlik sınırlarına ihtiyacı vardır. Bildirimler, moderasyon
bekletmeleri, gizli listelemeler ve hesap işlemleri; bir sürüm veya hesap
güvensiz, yanıltıcı ya da politika dışı göründüğünde kullanıcıları korumaya
yardım eder.

Bu sayfa moderasyonu ve hesap durumunu kapsar. `Pass`, `Review`, `Warn`,
`Malicious` gibi denetim etiketleri ve risk seviyesi için bkz.
[Güvenlik Denetimleri](/clawhub/security-audits).

Ayrıca bkz. [Güvenlik](/clawhub/security) ve
[Kabul edilebilir kullanım](/clawhub/acceptable-usage). Telif hakkı veya diğer
içerik haklarıyla ilgili endişeler için [İçerik Hakları Talepleri](/clawhub/content-rights)
sayfasını kullanın.

## Bildirimler

Oturum açmış kullanıcılar Skills, Plugin'ler ve paketleri bildirebilir.

ClawHub bildirimlerini yalnızca aşağıdakiler gibi güvensiz pazar yeri içerikleri
için kullanın:

- kötü amaçlı listelemeler
- yanıltıcı metadata
- beyan edilmemiş kimlik bilgileri veya izin gereksinimleri
- şüpheli yükleme talimatları
- kimliğe bürünme
- kötü niyetli kayıtlar veya ticari marka kötüye kullanımı
- [Kabul edilebilir kullanım](/clawhub/acceptable-usage) kurallarını ihlal eden içerik

Bir Skill sayfasındaki **Skill bildir** düğmesini veya paketler için paket bildirme
komutunu/API'sini kullanın.

Üçüncü taraf bir Skill veya Plugin'in kendi kaynak kodundaki güvenlik açıkları
için ClawHub bildirimlerini kullanmayın. Bunları doğrudan yayımcıya veya
listelemeden bağlantı verilen kaynak deposuna bildirin. ClawHub üçüncü taraf
Skill veya Plugin kodunu sürdürmez ya da yamalamaz.

`openclaw/clawhub` için GitHub Güvenlik Danışmanlıkları, ClawHub'ın kendisindeki
güvenlik açıkları içindir. Örnekler arasında web sitesi, API, CLI, kayıt
defteri, kimlik doğrulama, tarama, moderasyon veya indirme/yükleme güven
sınırlarındaki hatalar bulunur. Üçüncü taraf Skills veya Plugin'lerdeki güvenlik
açıkları için ClawHub danışmanlıklarını kullanmayın.

İyi bildirimler belirli ve işlem yapılabilirdir. Bildirim sisteminin kötüye
kullanılması da hesap işlemine yol açabilir.

## Kuruluş ve ad alanı talepleri

Kuruluş, marka, paket kapsamı, sahip kullanıcı adı veya ad alanı sahipliği
uyuşmazlıkları, ürün içi bildirim akışını ya da hesap itiraz formunu değil,
[Kuruluş ve Ad Alanı Talepleri](/clawhub/namespace-claims) sürecini kullanmalıdır.

Bir ad alanının ayrılması, devredilmesi, yeniden adlandırılması, gizlenmesi,
karantinaya alınması, diğer adla eşlenmesi veya başka şekilde incelenmesi
gerektiğine dair hassas olmayan kanıtları ClawHub ekibinin incelemesini
istediğinizde bu süreci kullanın. Herkese açık bir issue içine sırlar, özel
belgeler, özel hukuki dosyalar, kişisel kimlik belgeleri, API token'ları veya
DNS doğrulama token'ları eklemeyin.

## Moderasyon bekletmeleri

Bazı ciddi bulgular veya politika sorunları bir yayımcıyı ya da listelemeyi
moderasyon bekletmesine alabilir. Bu olduğunda, etkilenen içerik herkese açık
keşiften gizlenebilir veya gelecekteki yayımlar sorun incelenene kadar gizli
başlayabilir.

Moderasyon bekletmeleri, ClawHub yüksek riskli vakaları çözerken kullanıcıları
korumayı amaçlar. Yanlış pozitif doğrulandığında da kaldırılabilirler.

## Gizli veya engellenmiş listelemeler

Bir listeleme herkese açık yükleme yüzeylerinde bekletiliyor, gizlenmiş,
karantinaya alınmış, iptal edilmiş veya başka şekilde kullanılamaz durumda
olabilir.

Bu durumlardan birini görürseniz, sahip sorunu çözmedikçe veya moderasyon
listelemeyi geri yüklemedikçe sürümü yüklemeyin.

Sahipler, kendi bekletilen veya gizli listelemeleri için tanılamaları yine de
görebilir. Bu tanılamalar ne olduğunu ve listelemenin herkese açık yüzeylere
dönebilmesi için nelerin değişmesi gerektiğini açıklamaya yardımcı olur.

## Yasaklar ve hesap durumu

ClawHub politikasını ihlal eden hesaplar yayımlama erişimini kaybedebilir. Ciddi
kötüye kullanım hesap yasaklarına, token iptaline, gizli içeriğe veya kaldırılmış
listelemelere neden olabilir. Yayımcı kötüye kullanım baskısı sinyalleri günlük
olarak kontrol edilir. ClawHub'ın olası yasak eşiğine ulaşan sinyaller otomatik
bir uyarı tetikleyebilir. Uyarı son tarihinden sonraki ilk uygun tarama
yayımcıyı hâlâ olası yasak eşiğine yerleştiriyorsa, ClawHub hesap işlemini
otomatik olarak uygulayabilir. Daha düşük güvenli ve sınırlı zamansal inceleme
sinyalleri otomatik yaptırımın dışında tutulur.

Silinmiş, yasaklanmış veya devre dışı bırakılmış hesaplar ClawHub API token'larını
kullanamaz. Hesap işleminden sonra CLI kimlik doğrulaması başarısız olmaya
başlarsa, hesap durumunu incelemek için web UI'da oturum açın. Oturum açma veya
normal CLI erişimi bir yasak ya da devre dışı bırakılmış hesap nedeniyle
engelleniyorsa, kurtarma incelemesi için [ClawHub itiraz formunu](https://appeals.openclaw.ai/)
kullanın.

Tarayıcı tarafından tetiklenen bir e-posta bir Skill veya Plugin sürümünü kötü
amaçlı olarak adlandırıyorsa, engellenen gönderilmiş sürüm için saklanan tarama
sonuçlarını indirin:
`clawhub scan download <slug> --version <version>`. Plugin'ler için
`--kind plugin` ekleyin. Tarama çıktısını inceleyin, listelemeyi düzeltin, sürüm
numarasını artırın ve düzeltilmiş sürümü yükleyin.

## Yayımcı rehberi

Yanlış pozitifleri azaltmak ve kullanıcı güvenini artırmak için:

- adları, özetleri, etiketleri ve değişiklik günlüklerini doğru tutun
- gerekli ortam değişkenlerini ve izinleri beyan edin
- gizlenmiş yükleme komutlarından kaçının
- mümkün olduğunda kaynağa bağlantı verin
- Plugin'leri yayımlamadan önce deneme çalıştırmaları kullanın
- kullanıcılar veya moderatörler sürüm davranışı hakkında soru sorarsa açık yanıt verin
