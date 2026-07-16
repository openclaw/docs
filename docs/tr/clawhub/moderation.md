---
read_when:
    - Bir skill'i, plugin'i veya paketi bildirme
    - Beklemeye alınmış, gizlenmiş veya engellenmiş bir listelemeyi kurtarma
    - ClawHub moderasyonu, yasaklamaları veya hesap durumunu anlama
sidebarTitle: Moderation and Account Safety
summary: ClawHub raporlarının, moderasyon bekletmelerinin, gizli listelemelerin, yasaklamaların ve hesap durumunun nasıl işlediği.
title: Moderasyon ve Hesap Güvenliği
x-i18n:
    generated_at: "2026-07-16T16:54:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 54c1e0860411e6599923ef4d7db65d5cd5406ec63bf67c52968b4f99d893ffef
    source_path: clawhub/moderation.md
    workflow: 16
---

# Moderasyon ve Hesap Güvenliği

ClawHub yayınlamaya açıktır, ancak herkese açık keşif ve yükleme yüzeyleri yine de
koruyucu önlemler gerektirir. Bildirimler, moderasyon bekletmeleri, gizli listelemeler ve hesap işlemleri,
bir sürüm veya hesap güvensiz, yanıltıcı ya da politika dışı göründüğünde kullanıcıların
korunmasına yardımcı olur.

Bu sayfa moderasyonu ve hesap durumunu kapsar. `Pass`,
`Review`, `Warn`, `Malicious` ve risk düzeyi gibi denetim etiketleri için
[Güvenlik Denetimleri](/clawhub/security-audits) sayfasına bakın.

Ayrıca [Güvenlik](/clawhub/security) ve
[Kabul Edilebilir Kullanım](/clawhub/acceptable-usage) sayfalarına bakın. Telif hakkı veya diğer içerik
haklarıyla ilgili endişeler için [İçerik Hakları Talepleri](/clawhub/content-rights) sayfasını kullanın.

## Bildirimler

Oturum açmış kullanıcılar Skills, Plugin'ler ve paketleri bildirebilir.

ClawHub bildirimlerini yalnızca aşağıdakiler gibi güvenli olmayan pazar yeri içerikleri için kullanın:

- kötü amaçlı listelemeler
- yanıltıcı meta veriler
- beyan edilmemiş kimlik bilgileri veya izin gereksinimleri
- şüpheli yükleme talimatları
- kimliğe bürünme
- kötü niyetli kayıtlar veya ticari markanın kötüye kullanılması
- [Kabul Edilebilir Kullanım](/clawhub/acceptable-usage) politikasını ihlal eden içerikler

Bir skill sayfasındaki **Skill'i bildir** düğmesini veya paketler için paket bildirme
komutunu/API'sini kullanın.

ClawHub bildirimlerini üçüncü taraf bir skill'in veya
Plugin'in kendi kaynak kodundaki güvenlik açıkları için kullanmayın. Bunları doğrudan yayıncıya veya listelemede
bağlantısı verilen kaynak deposuna bildirin. ClawHub, üçüncü taraf
skill veya Plugin kodunun bakımını yapmaz ya da bu kodu yamalamaz.

`openclaw/clawhub` için GitHub Güvenlik Danışmaları, ClawHub'ın
kendisindeki güvenlik açıklarına yöneliktir. Web sitesi, API, CLI, kayıt defteri, kimlik doğrulama,
tarama, moderasyon veya indirme/yükleme güven sınırlarındaki hatalar buna örnektir. ClawHub
danışmalarını üçüncü taraf Skills veya Plugin'lerdeki güvenlik açıkları için kullanmayın.

İyi bildirimler belirli ve eyleme dönüktür. Bildirim sisteminin kötüye kullanılması da
hesap işlemine yol açabilir.

## Kuruluş ve ad alanı hak talepleri

Kuruluş, marka, paket kapsamı, sahip kullanıcı adı veya ad alanı sahipliği anlaşmazlıklarında,
ürün içi bildirim akışı ya da hesap itiraz formu yerine
[Kuruluş ve Ad Alanı Hak Talepleri](/clawhub/namespace-claims) süreci kullanılmalıdır.

Bir ad alanının ayrılması, aktarılması, yeniden adlandırılması, gizlenmesi, karantinaya alınması, diğer adla ilişkilendirilmesi
veya başka bir şekilde incelenmesi gerektiğine dair hassas olmayan kanıtları ClawHub personelinin incelemesi gerektiğinde
bu süreci kullanın. Herkese açık bir soruna gizli bilgiler, özel belgeler, özel hukuki
dosyalar, kişisel kimlik belgeleri, API token'ları veya DNS doğrulama token'ları
eklemeyin.

## Moderasyon bekletmeleri

Bazı ciddi bulgular veya politika sorunları, bir yayıncının ya da listelemenin
moderasyon kapsamında bekletilmesine neden olabilir. Bu durumda, etkilenen içerik herkese açık
keşiften gizlenebilir veya gelecekteki yayınlar sorun incelenene kadar gizli olarak başlayabilir.

Moderasyon bekletmeleri, ClawHub yüksek riskli
vakaları çözüme kavuştururken kullanıcıları korumayı amaçlar. Yanlış pozitif doğrulandığında da kaldırılabilirler.

## Gizli veya engellenmiş listelemeler

Bir listeleme herkese açık yükleme yüzeylerinde bekletilmiş, gizlenmiş, karantinaya alınmış, iptal edilmiş veya
başka bir şekilde kullanılamaz durumda olabilir.

Bu durumlardan birini görürseniz, sahibi
sorunu çözmedikçe veya moderasyon listelemeyi geri yüklemedikçe sürümü yüklemeyin.

Sahipler, bekletilmiş veya gizlenmiş kendi listelemelerine ilişkin tanılamaları görmeye devam edebilir. Bu
tanılamalar, ne olduğunu ve listelemenin herkese açık yüzeylere
dönebilmesi için nelerin değişmesi gerektiğini açıklamaya yardımcı olur.

## Yasaklamalar ve hesap durumu

ClawHub politikasını ihlal eden hesaplar yayınlama erişimini kaybedebilir. Ciddi kötüye kullanım,
hesap yasaklamaları, token iptali, gizli içerik veya kaldırılmış listelemelerle
sonuçlanabilir. Yayıncıların kötüye kullanım baskısı sinyalleri günlük olarak kontrol edilir. ClawHub'ın
olası yasaklama eşiğine ulaşan sinyaller otomatik bir uyarıyı tetikleyebilir. Uyarı son tarihinden
sonraki ilk uygun tarama yayıncıyı hâlâ olası yasaklama
eşiğinde gösterirse ClawHub hesap işlemini otomatik olarak uygulayabilir.
Daha düşük güven düzeyine sahip ve zaman açısından sınırlı inceleme sinyalleri otomatik
yaptırımın dışında tutulur.

Silinmiş, yasaklanmış veya devre dışı bırakılmış hesaplar ClawHub API token'larını kullanamaz. Bir hesap işleminden
sonra CLI kimlik doğrulaması başarısız olmaya başlarsa hesap
durumunu incelemek için web arayüzünde oturum açın. Yasaklama veya devre dışı bırakılmış hesap nedeniyle oturum açma ya da normal CLI erişimi engellenmişse
kurtarma incelemesi için [ClawHub itiraz formunu](https://appeals.openclaw.ai/) kullanın.

Tarayıcı tarafından tetiklenen bir e-posta, bir skill veya Plugin sürümünü kötü amaçlı olarak tanımlıyorsa
engellenen gönderilmiş sürümün saklanan tarama sonuçlarını indirin:
`clawhub scan download <slug> --version <version>`. Plugin'ler için
`--kind plugin` ekleyin. Tarama çıktısını inceleyin, listelemeyi düzeltin, sürüm
numarasını artırın ve düzeltilmiş sürümü yükleyin.

## Yayıncılar için rehberlik

Yanlış pozitifleri azaltmak ve kullanıcı güvenini artırmak için:

- adları, özetleri, etiketleri ve değişiklik günlüklerini doğru tutun
- gerekli ortam değişkenlerini ve izinleri beyan edin
- gizlenmiş yükleme komutlarından kaçının
- mümkün olduğunda kaynağa bağlantı verin
- Plugin'leri yayınlamadan önce deneme çalıştırmaları kullanın
- kullanıcılar veya moderatörler sürüm davranışı hakkında soru sorarsa açıkça yanıt verin
