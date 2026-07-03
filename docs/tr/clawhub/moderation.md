---
read_when:
    - Bir Skill, Plugin veya paketi bildirme
    - Tutulan, gizli veya engellenmiş bir listelemeden kurtarma
    - ClawHub moderasyonunu, yasaklamaları veya hesap durumunu anlama
sidebarTitle: Moderation and Account Safety
summary: ClawHub raporlarının, moderasyon bekletmelerinin, gizli listelemelerin, yasaklamaların ve hesap durumunun nasıl çalıştığı.
title: Moderasyon ve Hesap Güvenliği
x-i18n:
    generated_at: "2026-07-03T09:52:37Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 54c1e0860411e6599923ef4d7db65d5cd5406ec63bf67c52968b4f99d893ffef
    source_path: clawhub/moderation.md
    workflow: 16
---

# Moderasyon ve Hesap Güvenliği

ClawHub yayınlamaya açıktır, ancak genel keşif ve kurulum yüzeyleri yine de
koruma sınırlarına ihtiyaç duyar. Raporlar, moderasyon bekletmeleri, gizli listeler
ve hesap işlemleri; bir sürüm veya hesap güvensiz, yanıltıcı ya da politika dışı
göründüğünde kullanıcıları korumaya yardımcı olur.

Bu sayfa moderasyonu ve hesap durumunu kapsar. `Pass`, `Review`, `Warn`,
`Malicious` gibi denetim etiketleri ve risk seviyesi için
[Güvenlik Denetimleri](/clawhub/security-audits) bölümüne bakın.

Ayrıca [Güvenlik](/clawhub/security) ve
[Kabul edilebilir kullanım](/clawhub/acceptable-usage) bölümlerine bakın. Telif hakkı veya diğer içerik
haklarıyla ilgili konular için [İçerik Hakları İstekleri](/clawhub/content-rights) bölümünü kullanın.

## Raporlar

Oturum açmış kullanıcılar Skills, Plugin'ler ve paketleri raporlayabilir.

ClawHub raporlarını yalnızca güvenli olmayan pazaryeri içeriği için kullanın, örneğin:

- kötü amaçlı listeler
- yanıltıcı meta veriler
- beyan edilmemiş kimlik bilgileri veya izin gereksinimleri
- şüpheli kurulum talimatları
- kimliğe bürünme
- kötü niyetli kayıtlar veya ticari marka kötüye kullanımı
- [Kabul edilebilir kullanım](/clawhub/acceptable-usage) kurallarını ihlal eden içerik

Bir Skills sayfasındaki **Skills bildir** düğmesini veya paketler için paket raporlama
komutunu/API'sini kullanın.

Üçüncü taraf bir Skills veya Plugin'in kendi kaynak kodundaki güvenlik açıkları için
ClawHub raporlarını kullanmayın. Bunları doğrudan yayıncıya veya listeden bağlantı verilen
kaynak deposuna bildirin. ClawHub üçüncü taraf Skills veya Plugin kodunu sürdürmez ya da yamamaz.

`openclaw/clawhub` için GitHub Security Advisories, ClawHub'ın kendisindeki güvenlik açıkları içindir.
Örnekler arasında web sitesi, API, CLI, kayıt defteri, kimlik doğrulama,
tarama, moderasyon veya indirme/kurulum güven sınırlarındaki hatalar bulunur. Üçüncü taraf Skills veya Plugin'lerdeki
güvenlik açıkları için ClawHub advisories kullanmayın.

İyi raporlar belirli ve uygulanabilirdir. Raporlamanın kötüye kullanılması da
hesap işlemine yol açabilir.

## Kuruluş ve ad alanı talepleri

Kuruluş, marka, paket kapsamı, sahip kullanıcı adı veya ad alanı sahipliği anlaşmazlıkları,
ürün içi rapor akışı ya da hesap itiraz formu yerine
[Kuruluş ve Ad Alanı Talepleri](/clawhub/namespace-claims) sürecini kullanmalıdır.

Bir ad alanının ayrılması, devredilmesi, yeniden adlandırılması, gizlenmesi, karantinaya alınması, takma ad verilmesi
veya başka şekilde incelenmesi gerektiğine dair hassas olmayan kanıtların ClawHub personeli tarafından
incelenmesine ihtiyaç duyduğunuzda bu süreci kullanın. Herkese açık bir issue içine gizli bilgiler,
özel belgeler, özel hukuki dosyalar, kişisel kimlik belgeleri, API token'ları
veya DNS doğrulama token'ları eklemeyin.

## Moderasyon bekletmeleri

Bazı ciddi bulgular veya politika sorunları bir yayıncıyı ya da listeyi
moderasyon bekletmesine alabilir. Bu olduğunda, etkilenen içerik genel
keşiften gizlenebilir veya gelecekteki yayınlar sorun incelenene kadar gizli başlayabilir.

Moderasyon bekletmeleri, ClawHub yüksek riskli vakaları çözerken kullanıcıları
korumayı amaçlar. Yanlış pozitif doğrulandığında bunlar kaldırılabilir.

## Gizli veya engellenmiş listeler

Bir liste bekletilebilir, gizlenebilir, karantinaya alınabilir, iptal edilebilir veya
genel kurulum yüzeylerinde başka şekilde kullanılamaz hale gelebilir.

Bu durumlardan birini görürseniz, sahip sorunu çözmedikçe veya moderasyon listeyi geri yüklemedikçe
sürümü kurmayın.

Sahipler, kendi bekletilen veya gizli listeleri için tanılamaları hâlâ görebilir. Bu
tanılamalar ne olduğunu ve listenin genel yüzeylere dönebilmesi için
neyin değişmesi gerektiğini açıklamaya yardımcı olur.

## Yasaklar ve hesap durumu

ClawHub politikasını ihlal eden hesaplar yayınlama erişimini kaybedebilir. Ciddi kötüye kullanım
hesap yasaklarına, token iptaline, gizli içeriğe veya kaldırılmış listelere neden olabilir.
Yayıncı kötüye kullanım baskısı sinyalleri günlük olarak kontrol edilir. ClawHub'ın olası yasaklama
eşiğine ulaşan sinyaller otomatik bir uyarıyı tetikleyebilir. Uyarı son tarihinden sonraki
bir sonraki uygun tarama yayıncıyı hâlâ olası yasaklama eşiğine yerleştirirse,
ClawHub hesap işlemini otomatik olarak uygulayabilir.
Daha düşük güvenli ve sınırlı zamansal inceleme sinyalleri otomatik
yaptırımın dışında tutulur.

Silinen, yasaklanan veya devre dışı bırakılan hesaplar ClawHub API token'larını kullanamaz. Hesap işleminden sonra CLI kimlik doğrulaması
başarısız olmaya başlarsa, hesap durumunu incelemek için web kullanıcı arayüzünde oturum açın.
Oturum açma veya normal CLI erişimi bir yasak ya da devre dışı bırakılmış hesap tarafından engelleniyorsa,
kurtarma incelemesi için [ClawHub itiraz formunu](https://appeals.openclaw.ai/) kullanın.

Tarayıcı tarafından tetiklenen bir e-posta bir Skills veya Plugin sürümünü kötü amaçlı olarak adlandırıyorsa,
engellenen gönderilmiş sürüm için saklanan tarama sonuçlarını indirin:
`clawhub scan download <slug> --version <version>`. Plugin'ler için
`--kind plugin` ekleyin. Tarama çıktısını inceleyin, listeyi düzeltin, sürüm
numarasını artırın ve düzeltilmiş sürümü yükleyin.

## Yayıncı rehberi

Yanlış pozitifleri azaltmak ve kullanıcı güvenini artırmak için:

- adları, özetleri, etiketleri ve değişiklik günlüklerini doğru tutun
- gerekli ortam değişkenlerini ve izinleri beyan edin
- gizlenmiş kurulum komutlarından kaçının
- mümkün olduğunda kaynağa bağlantı verin
- Plugin'leri yayınlamadan önce deneme çalıştırmaları kullanın
- kullanıcılar veya moderatörler sürüm davranışı hakkında soru sorarsa açıkça yanıt verin
