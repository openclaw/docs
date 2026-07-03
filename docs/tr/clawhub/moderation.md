---
read_when:
    - Bir Skills, Plugin veya paket bildirme
    - Bekletilen, gizli veya engellenmiş bir listelemeden kurtarma
    - ClawHub moderasyonunu, yasaklamaları veya hesap durumunu anlama
sidebarTitle: Moderation and Account Safety
summary: ClawHub raporlarının, moderasyon bekletmelerinin, gizli listelemelerin, yasakların ve hesap durumunun nasıl işlediği.
title: Moderasyon ve Hesap Güvenliği
x-i18n:
    generated_at: "2026-07-03T23:40:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 54c1e0860411e6599923ef4d7db65d5cd5406ec63bf67c52968b4f99d893ffef
    source_path: clawhub/moderation.md
    workflow: 16
---

# Moderasyon ve Hesap Güvenliği

ClawHub yayımlamaya açıktır, ancak herkese açık keşif ve kurulum yüzeylerinin yine de koruma sınırlarına ihtiyacı vardır. Raporlar, moderasyon bekletmeleri, gizli listelemeler ve hesap işlemleri; bir sürüm veya hesap güvensiz, yanıltıcı ya da politika dışı göründüğünde kullanıcıları korumaya yardımcı olur.

Bu sayfa moderasyon ve hesap durumunu kapsar. `Pass`, `Review`, `Warn`, `Malicious` gibi denetim etiketleri ve risk seviyesi için bkz. [Güvenlik Denetimleri](/clawhub/security-audits).

Ayrıca bkz. [Güvenlik](/clawhub/security) ve [Kabul edilebilir kullanım](/clawhub/acceptable-usage). Telif hakkı veya diğer içerik haklarıyla ilgili endişeler için [İçerik Hakları Talepleri](/clawhub/content-rights) bölümünü kullanın.

## Raporlar

Oturum açmış kullanıcılar Skills, plugin'ler ve paketler hakkında rapor gönderebilir.

ClawHub raporlarını yalnızca aşağıdakiler gibi güvensiz pazaryeri içerikleri için kullanın:

- kötü amaçlı listelemeler
- yanıltıcı metadata
- beyan edilmemiş kimlik bilgileri veya izin gereksinimleri
- şüpheli kurulum talimatları
- kimliğe bürünme
- kötü niyetli kayıtlar veya ticari marka kötüye kullanımı
- [Kabul edilebilir kullanım](/clawhub/acceptable-usage) politikasını ihlal eden içerik

Bir skill sayfasındaki **Skill bildir** düğmesini veya paketler için paket raporlama komutunu/API'sini kullanın.

ClawHub raporlarını, üçüncü taraf bir skill'in veya plugin'in kendi kaynak kodundaki güvenlik açıkları için kullanmayın. Bunları doğrudan listelemede bağlantısı verilen yayımcıya veya kaynak depoya bildirin. ClawHub, üçüncü taraf skill veya plugin kodunu sürdürmez ya da yamalamaz.

`openclaw/clawhub` için GitHub Security Advisories, ClawHub'ın kendisindeki güvenlik açıkları içindir. Örnekler arasında web sitesi, API, CLI, kayıt defteri, kimlik doğrulama, tarama, moderasyon veya indirme/kurulum güven sınırlarındaki hatalar yer alır. ClawHub advisories'i üçüncü taraf Skills veya plugin'lerdeki güvenlik açıkları için kullanmayın.

İyi raporlar belirli ve uygulanabilirdir. Raporlama özelliğinin kötüye kullanımı da hesap işlemine yol açabilir.

## Kuruluş ve ad alanı talepleri

Kuruluş, marka, paket kapsamı, sahip kullanıcı adı veya ad alanı sahipliği anlaşmazlıkları, ürün içi rapor akışını ya da hesap itiraz formunu değil [Kuruluş ve Ad Alanı Talepleri](/clawhub/namespace-claims) sürecini kullanmalıdır.

ClawHub personelinin bir ad alanının ayrılması, devredilmesi, yeniden adlandırılması, gizlenmesi, karantinaya alınması, diğer ada bağlanması veya başka şekilde incelenmesi gerektiğine dair hassas olmayan kanıtları incelemesine ihtiyacınız olduğunda bu süreci kullanın. Herkese açık bir issue içine sırlar, özel belgeler, özel yasal dosyalar, kişisel kimlik belgeleri, API token'ları veya DNS doğrulama token'ları eklemeyin.

## Moderasyon bekletmeleri

Bazı ciddi bulgular veya politika sorunları, bir yayımcıyı ya da listelemeyi moderasyon bekletmesine alabilir. Bu gerçekleştiğinde, etkilenen içerik herkese açık keşiften gizlenebilir veya gelecekteki yayımlar sorun incelenene kadar gizli başlayabilir.

Moderasyon bekletmeleri, ClawHub yüksek riskli vakaları çözerken kullanıcıları korumak içindir. Yanlış pozitif doğrulandığında da kaldırılabilirler.

## Gizli veya engellenmiş listelemeler

Bir listeleme herkese açık kurulum yüzeylerinde bekletiliyor, gizlenmiş, karantinaya alınmış, iptal edilmiş veya başka şekilde kullanılamaz durumda olabilir.

Bu durumlardan birini görürseniz, sahip sorunu çözmedikçe veya moderasyon listelemeyi geri yüklemedikçe sürümü kurmayın.

Sahipler, kendi bekletilen veya gizli listelemeleri için tanılamaları hâlâ görebilir. Bu tanılamalar ne olduğunu ve listelemenin herkese açık yüzeylere dönebilmesi için neyin değişmesi gerektiğini açıklamaya yardımcı olur.

## Yasaklar ve hesap durumu

ClawHub politikasını ihlal eden hesaplar yayımlama erişimini kaybedebilir. Ağır kötüye kullanım, hesap yasaklarına, token iptaline, gizli içeriğe veya kaldırılmış listelemelere neden olabilir. Yayımcı kötüye kullanım baskısı sinyalleri günlük olarak kontrol edilir. ClawHub'ın olası yasak eşiğine ulaşan sinyaller otomatik bir uyarıyı tetikleyebilir. Uyarı son tarihinden sonraki bir sonraki uygun tarama yayımcıyı hâlâ olası yasak eşiğinde gösterirse, ClawHub hesap işlemini otomatik olarak uygulayabilir. Daha düşük güvenli ve sınırlı zamansal inceleme sinyalleri otomatik yaptırımın dışında kalır.

Silinen, yasaklanan veya devre dışı bırakılan hesaplar ClawHub API token'larını kullanamaz. Hesap işleminden sonra CLI kimlik doğrulaması başarısız olmaya başlarsa, hesap durumunu incelemek için web UI'ında oturum açın. Oturum açma veya normal CLI erişimi bir yasak ya da devre dışı bırakılmış hesap nedeniyle engellenmişse, kurtarma incelemesi için [ClawHub itiraz formunu](https://appeals.openclaw.ai/) kullanın.

Tarayıcı tarafından tetiklenen bir e-posta bir skill veya plugin sürümünü kötü amaçlı olarak adlandırıyorsa, engellenen gönderilmiş sürümün saklanan tarama sonuçlarını indirin: `clawhub scan download <slug> --version <version>`. Plugin'ler için `--kind plugin` ekleyin. Tarama çıktısını inceleyin, listelemeyi düzeltin, sürüm numarasını artırın ve düzeltilmiş sürümü yükleyin.

## Yayımcı rehberliği

Yanlış pozitifleri azaltmak ve kullanıcı güvenini artırmak için:

- adları, özetleri, etiketleri ve değişiklik günlüklerini doğru tutun
- gerekli ortam değişkenlerini ve izinleri beyan edin
- gizlenmiş kurulum komutlarından kaçının
- mümkün olduğunda kaynağa bağlantı verin
- plugin yayımlamadan önce deneme çalıştırmaları kullanın
- kullanıcılar veya moderatörler sürüm davranışı hakkında soru sorarsa net yanıt verin
