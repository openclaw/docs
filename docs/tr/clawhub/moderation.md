---
read_when:
    - Bir Skill, Plugin veya paketi bildirme
    - Tutulan, gizlenen veya engellenen bir listeden kurtarma
    - ClawHub moderasyonunu, yasaklarını veya hesap durumunu anlama
sidebarTitle: Moderation and Account Safety
summary: ClawHub raporlarının, moderasyon bekletmelerinin, gizli listelemelerin, yasakların ve hesap durumunun nasıl çalıştığı.
title: Moderasyon ve Hesap Güvenliği
x-i18n:
    generated_at: "2026-07-01T20:31:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 54c1e0860411e6599923ef4d7db65d5cd5406ec63bf67c52968b4f99d893ffef
    source_path: clawhub/moderation.md
    workflow: 16
---

# Moderasyon ve Hesap Güvenliği

ClawHub yayımlamaya açıktır, ancak herkese açık keşif ve kurulum yüzeyleri yine de
koruma önlemlerine ihtiyaç duyar. Raporlar, moderasyon bekletmeleri, gizli kayıtlar ve hesap işlemleri,
bir sürüm veya hesap güvensiz, yanıltıcı ya da politika dışı göründüğünde
kullanıcıları korumaya yardımcı olur.

Bu sayfa moderasyonu ve hesap durumunu kapsar. `Pass`, `Review`, `Warn`,
`Malicious` gibi denetim etiketleri ve risk düzeyi için
[Güvenlik Denetimleri](/clawhub/security-audits) bölümüne bakın.

Ayrıca [Güvenlik](/clawhub/security) ve
[Kabul edilebilir kullanım](/clawhub/acceptable-usage) bölümlerine bakın. Telif hakkı veya diğer içerik
haklarıyla ilgili endişeler için [İçerik Hakları Talepleri](/clawhub/content-rights) sayfasını kullanın.

## Raporlar

Oturum açmış kullanıcılar Skills, Plugin'ler ve paketleri raporlayabilir.

ClawHub raporlarını yalnızca şu tür güvenli olmayan pazar yeri içerikleri için kullanın:

- kötü amaçlı kayıtlar
- yanıltıcı meta veriler
- beyan edilmemiş kimlik bilgileri veya izin gereksinimleri
- şüpheli kurulum yönergeleri
- kimliğe bürünme
- kötü niyetli kayıtlar veya marka kötüye kullanımı
- [Kabul edilebilir kullanım](/clawhub/acceptable-usage) kurallarını ihlal eden içerik

Bir Skill sayfasındaki **Skill bildir** düğmesini veya paketler için paket raporlama
komutunu/API'sini kullanın.

ClawHub raporlarını, üçüncü taraf bir Skill veya
Plugin'in kendi kaynak kodundaki güvenlik açıkları için kullanmayın. Bunları doğrudan yayıncıya veya kayıtta bağlantısı verilen kaynak
deposuna bildirin. ClawHub üçüncü taraf Skill veya Plugin kodunu
bakımını yapmaz ya da yamalamaz.

`openclaw/clawhub` için GitHub Güvenlik Danışmanları,
ClawHub'ın kendisindeki güvenlik açıkları içindir. Örnekler arasında web sitesi, API, CLI, kayıt defteri, kimlik doğrulama,
tarama, moderasyon veya indirme/kurulum güven sınırları içindeki hatalar bulunur. Üçüncü taraf Skills veya Plugin'lerdeki güvenlik açıkları için ClawHub
danışmanlarını kullanmayın.

İyi raporlar spesifik ve uygulanabilirdir. Raporlamanın kötüye kullanılması da
hesap işlemine yol açabilir.

## Kuruluş ve ad alanı talepleri

Kuruluş, marka, paket kapsamı, sahip kullanıcı adı veya ad alanı sahipliği anlaşmazlıkları,
ürün içi rapor akışını ya da hesap itiraz formunu değil,
[Kuruluş ve Ad Alanı Talepleri](/clawhub/namespace-claims) sürecini kullanmalıdır.

Bir ad alanının ayrılması, devredilmesi, yeniden adlandırılması, gizlenmesi, karantinaya alınması, takma ad verilmesi
veya başka şekilde incelenmesi gerektiğine dair hassas olmayan kanıtı ClawHub personelinin incelemesine ihtiyaç duyduğunuzda bu süreci kullanın. Herkese açık bir issue içinde gizli bilgiler, özel belgeler, özel hukuki
dosyalar, kişisel kimlik belgeleri, API token'ları veya DNS doğrulama token'ları paylaşmayın.

## Moderasyon bekletmeleri

Bazı ciddi bulgular veya politika sorunları, bir yayıncıyı ya da kaydı
moderasyon bekletmesine alabilir. Bu olduğunda, etkilenen içerik herkese açık
keşiften gizlenebilir veya gelecekteki yayımlar sorun incelenene kadar gizli başlayabilir.

Moderasyon bekletmeleri, ClawHub yüksek riskli
vakaları çözerken kullanıcıları korumak içindir. Yanlış pozitif doğrulandığında da kaldırılabilirler.

## Gizli veya engellenmiş kayıtlar

Bir kayıt bekletilmiş, gizlenmiş, karantinaya alınmış, iptal edilmiş veya başka şekilde
herkese açık kurulum yüzeylerinde kullanılamaz olabilir.

Bu durumlardan birini görürseniz, sahibi
sorunu çözene veya moderasyon kaydı geri yükleyene kadar sürümü kurmayın.

Sahipler, kendi bekletilmiş veya gizli kayıtları için tanılamaları yine de görebilir. Bu
tanılamalar ne olduğunu ve kaydın herkese açık yüzeylere
geri dönebilmesi için neyin değişmesi gerektiğini açıklamaya yardımcı olur.

## Yasaklamalar ve hesap durumu

ClawHub politikasını ihlal eden hesaplar yayımlama erişimini kaybedebilir. Ciddi kötüye kullanım,
hesap yasaklarına, token iptaline, gizli içeriğe veya kaldırılmış kayıtlara yol açabilir.
Yayıncı kötüye kullanım baskı sinyalleri günlük olarak kontrol edilir. ClawHub'ın olası yasak eşiğine ulaşan sinyaller
otomatik bir uyarıyı tetikleyebilir. Uyarı son tarihinden sonraki ilk uygun tarama
yayıncıyı hâlâ olası yasak eşiğine yerleştirirse, ClawHub hesap işlemini otomatik olarak uygulayabilir.
Daha düşük güvenilirlikteki ve sınırlı zamansal inceleme sinyalleri otomatik
yaptırımın dışında kalır.

Silinmiş, yasaklanmış veya devre dışı bırakılmış hesaplar ClawHub API token'larını kullanamaz. CLI kimlik doğrulaması
hesap işleminden sonra başarısız olmaya başlarsa, hesap
durumunu incelemek için web kullanıcı arayüzünde oturum açın. Oturum açma veya normal CLI erişimi bir yasak ya da devre dışı bırakılmış hesap nedeniyle engelleniyorsa,
kurtarma incelemesi için [ClawHub itiraz formunu](https://appeals.openclaw.ai/) kullanın.

Tarayıcı tarafından tetiklenen bir e-posta bir Skill veya Plugin sürümünü kötü amaçlı olarak adlandırıyorsa,
engellenen gönderilmiş sürüm için saklanan tarama sonuçlarını indirin:
`clawhub scan download <slug> --version <version>`. Plugin'ler için
`--kind plugin` ekleyin. Tarama çıktısını inceleyin, kaydı düzeltin, sürüm
numarasını artırın ve düzeltilmiş sürümü yükleyin.

## Yayıncı rehberliği

Yanlış pozitifleri azaltmak ve kullanıcı güvenini artırmak için:

- adları, özetleri, etiketleri ve değişiklik günlüklerini doğru tutun
- gerekli ortam değişkenlerini ve izinleri beyan edin
- gizlenmiş kurulum komutlarından kaçının
- mümkün olduğunda kaynağa bağlantı verin
- Plugin'leri yayımlamadan önce kuru çalıştırmalar kullanın
- kullanıcılar veya moderatörler sürüm davranışı hakkında soru sorarsa açıkça yanıt verin
