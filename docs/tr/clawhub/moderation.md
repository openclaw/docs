---
read_when:
    - Bir skill, plugin veya paketi bildirme
    - Tutulan, gizli veya engellenmiş bir listelemeden kurtarma
    - |-
      OpenClaw_docs_i18n_input>
      ClawHub moderasyonunu, yasaklamaları veya hesap durumunu anlama
sidebarTitle: Moderation and Account Safety
summary: ClawHub raporlarının, moderasyon bekletmelerinin, gizli listelemelerin, yasaklamaların ve hesap durumunun nasıl işlediği.
title: Moderasyon ve Hesap Güvenliği
x-i18n:
    generated_at: "2026-06-28T20:41:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 54c1e0860411e6599923ef4d7db65d5cd5406ec63bf67c52968b4f99d893ffef
    source_path: clawhub/moderation.md
    workflow: 16
---

# Moderasyon ve Hesap Güvenliği

ClawHub yayımlamaya açıktır, ancak herkese açık keşif ve kurulum yüzeyleri yine de
koruma önlemlerine ihtiyaç duyar. Raporlar, moderasyon bekletmeleri, gizli listelemeler ve hesap işlemleri,
bir sürüm veya hesap güvensiz, yanıltıcı ya da politika dışı göründüğünde kullanıcıları
korumaya yardımcı olur.

Bu sayfa moderasyon ve hesap durumunu kapsar. `Pass`, `Review`, `Warn`, `Malicious`
gibi denetim etiketleri ve risk seviyesi için bkz.
[Güvenlik Denetimleri](/tr/clawhub/security-audits).

Ayrıca bkz. [Güvenlik](/tr/clawhub/security) ve
[Kabul edilebilir kullanım](/tr/clawhub/acceptable-usage). Telif hakkı veya diğer içerik
haklarıyla ilgili endişeler için [İçerik Hakları Talepleri](/tr/clawhub/content-rights) sayfasını kullanın.

## Raporlar

Oturum açmış kullanıcılar Skills, Pluginler ve paketleri raporlayabilir.

ClawHub raporlarını yalnızca güvenli olmayan pazar yeri içerikleri için kullanın, örneğin:

- kötü amaçlı listelemeler
- yanıltıcı üst veriler
- beyan edilmemiş kimlik bilgileri veya izin gereksinimleri
- şüpheli kurulum talimatları
- kimliğe bürünme
- kötü niyetli kayıtlar veya ticari marka kötüye kullanımı
- [Kabul edilebilir kullanım](/tr/clawhub/acceptable-usage) kurallarını ihlal eden içerik

Bir skill sayfasındaki **Skill'i bildir** düğmesini veya paketler için paket raporlama
komutunu/API'sini kullanın.

Üçüncü taraf bir skill'in veya Plugin'in kendi kaynak kodundaki güvenlik açıkları için
ClawHub raporlarını kullanmayın. Bunları doğrudan yayımcıya veya listelemede bağlantısı verilen
kaynak deposuna bildirin. ClawHub üçüncü taraf skill veya Plugin kodunu bakımını yapmaz ya da yamalamaz.

`openclaw/clawhub` için GitHub Security Advisories, ClawHub'ın kendisindeki
güvenlik açıkları içindir. Örnekler arasında web sitesi, API, CLI, kayıt defteri, kimlik doğrulama,
tarama, moderasyon veya indirme/kurulum güven sınırlarındaki hatalar yer alır. Üçüncü taraf
Skills veya Pluginlerdeki güvenlik açıkları için ClawHub advisories kullanmayın.

İyi raporlar belirli ve uygulanabilirdir. Raporlamanın kötüye kullanılması da
hesap işlemine yol açabilir.

## Kuruluş ve ad alanı talepleri

Kuruluş, marka, paket kapsamı, sahip kullanıcı adı veya ad alanı sahipliği anlaşmazlıkları,
ürün içi rapor akışını ya da hesap itiraz formunu değil,
[Kuruluş ve Ad Alanı Talepleri](/tr/clawhub/namespace-claims) sürecini kullanmalıdır.

Bir ad alanının rezerve edilmesi, devredilmesi, yeniden adlandırılması, gizlenmesi, karantinaya alınması, takma ad verilmesi
veya başka şekilde incelenmesi gerektiğine dair hassas olmayan kanıtları ClawHub personelinin incelemesine ihtiyaç duyduğunuzda
bu süreci kullanın. Herkese açık bir issue içine sırlar, özel belgeler, özel hukuki dosyalar,
kişisel kimlik belgeleri, API token'ları veya DNS challenge token'ları eklemeyin.

## Moderasyon bekletmeleri

Bazı ciddi bulgular veya politika sorunları bir yayımcıyı ya da listelemeyi
moderasyon bekletmesine alabilir. Bu olduğunda, etkilenen içerik herkese açık
keşiften gizlenebilir veya gelecekteki yayımlar sorun incelenene kadar gizli başlayabilir.

Moderasyon bekletmeleri, ClawHub yüksek riskli vakaları çözerken kullanıcıları korumayı amaçlar.
Yanlış pozitif doğrulandığında da kaldırılabilirler.

## Gizli veya engellenmiş listelemeler

Bir listeleme herkese açık kurulum yüzeylerinde bekletilmiş, gizlenmiş, karantinaya alınmış, iptal edilmiş
veya başka şekilde kullanılamaz durumda olabilir.

Bu durumlardan birini görürseniz, sahibi sorunu çözmedikçe veya moderasyon listelemeyi geri yüklemedikçe
sürümü kurmayın.

Sahipler, kendi bekletilmiş veya gizli listelemeleri için tanılamaları yine de görebilir. Bu
tanılamalar ne olduğunu ve listelemenin herkese açık yüzeylere dönebilmesi için neyin değişmesi gerektiğini
açıklamaya yardımcı olur.

## Yasaklar ve hesap durumu

ClawHub politikasını ihlal eden hesaplar yayımlama erişimini kaybedebilir. Ciddi kötüye kullanım
hesap yasaklarına, token iptaline, gizli içeriğe veya kaldırılmış listelemelere yol açabilir.
Yayımcı kötüye kullanım baskısı sinyalleri günlük olarak kontrol edilir. ClawHub'ın olası yasak eşiğine
ulaşan sinyaller otomatik bir uyarıyı tetikleyebilir. Uyarı son tarihinden sonraki bir sonraki
uygun tarama yayımcıyı hâlâ olası yasak eşiğine yerleştirirse, ClawHub hesap işlemini
otomatik olarak uygulayabilir. Daha düşük güvenli ve sınırlı zamansal inceleme sinyalleri otomatik
yaptırımın dışında kalır.

Silinmiş, yasaklanmış veya devre dışı bırakılmış hesaplar ClawHub API token'larını kullanamaz. Hesap işleminden
sonra CLI kimlik doğrulaması başarısız olmaya başlarsa, hesap durumunu incelemek için web UI'ında oturum açın.
Oturum açma veya normal CLI erişimi bir yasak ya da devre dışı bırakılmış hesap tarafından engelleniyorsa,
kurtarma incelemesi için [ClawHub itiraz formunu](https://appeals.openclaw.ai/) kullanın.

Tarayıcı tarafından tetiklenen bir e-posta bir skill veya Plugin sürümünü kötü amaçlı olarak adlandırıyorsa,
engellenen gönderilmiş sürüm için saklanan tarama sonuçlarını indirin:
`clawhub scan download <slug> --version <version>`. Pluginler için
`--kind plugin` ekleyin. Tarama çıktısını inceleyin, listelemeyi düzeltin, sürüm
numarasını artırın ve düzeltilmiş sürümü yükleyin.

## Yayımcı rehberi

Yanlış pozitifleri azaltmak ve kullanıcı güvenini artırmak için:

- adları, özetleri, etiketleri ve değişiklik günlüklerini doğru tutun
- gerekli ortam değişkenlerini ve izinleri beyan edin
- gizlenmiş kurulum komutlarından kaçının
- mümkün olduğunda kaynağa bağlantı verin
- Pluginleri yayımlamadan önce deneme çalıştırmaları kullanın
- kullanıcılar veya moderatörler sürüm davranışı hakkında soru sorarsa açıkça yanıt verin
