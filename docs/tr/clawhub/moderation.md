---
read_when:
    - Bir skill, plugin veya paketi bildirme
    - Tutulan, gizlenen veya engellenen bir listelemeden kurtarma
    - ClawHub moderasyonunu, yasakları veya hesap durumunu anlama
sidebarTitle: Moderation and Account Safety
summary: ClawHub raporlarının, moderasyon bekletmelerinin, gizli listelemelerin, yasakların ve hesap durumunun nasıl çalıştığı.
title: Moderasyon ve Hesap Güvenliği
x-i18n:
    generated_at: "2026-07-02T08:42:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 54c1e0860411e6599923ef4d7db65d5cd5406ec63bf67c52968b4f99d893ffef
    source_path: clawhub/moderation.md
    workflow: 16
---

# Moderasyon ve Hesap Güvenliği

ClawHub yayımlamaya açıktır, ancak herkese açık keşif ve kurulum yüzeyleri yine de
koruma önlemleri gerektirir. Raporlar, moderasyon bekletmeleri, gizli listelemeler ve hesap işlemleri,
bir sürüm veya hesap güvensiz, yanıltıcı ya da politika dışı göründüğünde
kullanıcıları korumaya yardımcı olur.

Bu sayfa moderasyonu ve hesap durumunu kapsar. `Pass`, `Review`, `Warn`,
`Malicious` gibi denetim etiketleri ve risk düzeyi için
[Güvenlik Denetimleri](/clawhub/security-audits) sayfasına bakın.

Ayrıca [Güvenlik](/clawhub/security) ve
[Kabul edilebilir kullanım](/clawhub/acceptable-usage) sayfalarına bakın. Telif hakkı veya diğer içerik
haklarıyla ilgili endişeler için [İçerik Hakları Talepleri](/clawhub/content-rights) sayfasını kullanın.

## Raporlar

Oturum açmış kullanıcılar Skills'leri, Plugin'leri ve paketleri raporlayabilir.

ClawHub raporlarını yalnızca güvensiz marketplace içeriği için kullanın, örneğin:

- kötü amaçlı listelemeler
- yanıltıcı metadata
- beyan edilmemiş kimlik bilgileri veya izin gereksinimleri
- şüpheli kurulum talimatları
- kimliğe bürünme
- kötü niyetli kayıtlar veya ticari marka kötüye kullanımı
- [Kabul edilebilir kullanım](/clawhub/acceptable-usage) politikasını ihlal eden içerik

Bir Skills sayfasındaki **Skills'i bildir** düğmesini veya paketler için paket raporlama
komutunu/API'sini kullanın.

ClawHub raporlarını üçüncü taraf bir Skills'in veya
Plugin'in kendi kaynak kodundaki güvenlik açıkları için kullanmayın. Bunları doğrudan yayımcıya veya listelemeden bağlantı verilen kaynak
deposuna bildirin. ClawHub üçüncü taraf Skills veya Plugin kodunu bakımını yapmaz ya da yamalamaz.

`openclaw/clawhub` için GitHub Security Advisories, ClawHub'ın
kendisindeki güvenlik açıkları içindir. Örnekler arasında web sitesi, API, CLI, registry, auth,
tarama, moderasyon veya indirme/kurulum güven sınırlarındaki hatalar yer alır. ClawHub
advisory'lerini üçüncü taraf Skills veya Plugin'lerdeki güvenlik açıkları için kullanmayın.

İyi raporlar spesifik ve uygulanabilirdir. Raporlamanın kötüye kullanımı kendi başına
hesap işlemine yol açabilir.

## Kuruluş ve namespace talepleri

Kuruluş, marka, paket kapsamı, sahip kullanıcı adı veya namespace sahipliği anlaşmazlıkları
ürün içi rapor akışını ya da hesap itiraz formunu değil,
[Kuruluş ve Namespace Talepleri](/clawhub/namespace-claims) sürecini kullanmalıdır.

ClawHub personelinin bir namespace'in ayrılması, devredilmesi, yeniden adlandırılması, gizlenmesi, karantinaya alınması, alias verilmesi
veya başka şekilde incelenmesi gerektiğine dair hassas olmayan kanıtı incelemesine ihtiyaç duyduğunuzda
bu süreci kullanın. Herkese açık bir issue'ya sırlar, özel belgeler, özel hukuki
dosyalar, kişisel kimlik belgeleri, API token'ları veya DNS challenge token'ları
eklemeyin.

## Moderasyon bekletmeleri

Bazı ciddi bulgular veya politika sorunları bir yayımcıyı ya da listelemeyi
moderasyon bekletmesine alabilir. Bu olduğunda, etkilenen içerik herkese açık
keşiften gizlenebilir veya gelecekteki yayımlar sorun incelenene kadar gizli başlayabilir.

Moderasyon bekletmeleri, ClawHub yüksek riskli vakaları çözerken kullanıcıları
korumayı amaçlar. Yanlış pozitif doğrulandığında da kaldırılabilirler.

## Gizli veya engellenmiş listelemeler

Bir listeleme herkese açık kurulum yüzeylerinde bekletilmiş, gizlenmiş, karantinaya alınmış, iptal edilmiş
veya başka şekilde kullanılamaz durumda olabilir.

Bu durumlardan birini görürseniz, sahibi sorunu çözmedikçe veya moderasyon geri yüklemedikçe
sürümü kurmayın.

Sahipler, kendi bekletilmiş veya gizli listelemeleri için tanılamaları hâlâ görebilir. Bu
tanılamalar ne olduğunu ve listelemenin herkese açık yüzeylere dönebilmesi için
neyin değişmesi gerektiğini açıklamaya yardımcı olur.

## Yasaklamalar ve hesap durumu

ClawHub politikasını ihlal eden hesaplar yayımlama erişimini kaybedebilir. Ciddi kötüye kullanım
hesap yasaklarına, token iptaline, gizli içeriğe veya kaldırılmış listelemelere
yol açabilir. Yayımcı kötüye kullanım baskısı sinyalleri günlük olarak kontrol edilir. ClawHub'ın
potansiyel yasaklama eşiğine ulaşan sinyaller otomatik bir uyarıyı tetikleyebilir. Uyarı son tarihinden sonraki
bir sonraki uygun tarama yayımcıyı hâlâ potansiyel yasaklama
eşiğine yerleştirirse, ClawHub hesap işlemini otomatik olarak uygulayabilir.
Daha düşük güvenli ve sınırlı zamansal inceleme sinyalleri otomatik
yaptırım dışında kalır.

Silinmiş, yasaklanmış veya devre dışı bırakılmış hesaplar ClawHub API token'larını kullanamaz. Hesap işleminden sonra CLI auth
başarısız olmaya başlarsa, hesap durumunu incelemek için web UI'da oturum açın.
Oturum açma veya normal CLI erişimi bir yasak ya da devre dışı bırakılmış hesap tarafından engelleniyorsa,
kurtarma incelemesi için [ClawHub itiraz formunu](https://appeals.openclaw.ai/) kullanın.

Tarayıcı tarafından tetiklenen bir e-posta bir Skills veya Plugin sürümünü kötü amaçlı olarak adlandırıyorsa,
engellenen gönderilmiş sürüm için saklanan tarama sonuçlarını indirin:
`clawhub scan download <slug> --version <version>`. Plugin'ler için
`--kind plugin` ekleyin. Tarama çıktısını inceleyin, listelemeyi düzeltin, sürüm
numarasını artırın ve düzeltilmiş sürümü yükleyin.

## Yayımcı rehberi

Yanlış pozitifleri azaltmak ve kullanıcı güvenini iyileştirmek için:

- adları, özetleri, etiketleri ve changelog'ları doğru tutun
- gerekli ortam değişkenlerini ve izinleri beyan edin
- karartılmış kurulum komutlarından kaçının
- mümkün olduğunda kaynağa bağlantı verin
- Plugin'leri yayımlamadan önce dry run kullanın
- kullanıcılar veya moderatörler sürüm davranışı hakkında soru sorarsa net yanıt verin
