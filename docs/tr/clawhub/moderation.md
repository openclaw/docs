---
read_when:
    - Bir skill, plugin veya paketi bildirme
    - Durdurulmuş, gizli veya engellenmiş bir listelemeyi kurtarma
    - ClawHub moderasyonunu, yasaklamaları veya hesap durumunu anlama
sidebarTitle: Moderation and Account Safety
summary: ClawHub raporlarının, moderasyon bekletmelerinin, gizli listelerin, yasaklamaların ve hesap durumunun nasıl çalıştığı.
title: Moderasyon ve Hesap Güvenliği
x-i18n:
    generated_at: "2026-06-28T05:06:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 54c1e0860411e6599923ef4d7db65d5cd5406ec63bf67c52968b4f99d893ffef
    source_path: clawhub/moderation.md
    workflow: 16
---

# Moderasyon ve Hesap Güvenliği

ClawHub yayımlamaya açıktır, ancak genel keşif ve kurulum yüzeylerinin yine de
koruyucu sınırlara ihtiyacı vardır. Raporlar, moderasyon bekletmeleri, gizli listelemeler
ve hesap işlemleri; bir sürüm veya hesap güvensiz, yanıltıcı ya da politika dışı
göründüğünde kullanıcıları korumaya yardımcı olur.

Bu sayfa moderasyonu ve hesap durumunu kapsar. `Pass`, `Review`, `Warn`,
`Malicious` gibi denetim etiketleri ve risk düzeyi için
[Güvenlik Denetimleri](/tr/clawhub/security-audits) bölümüne bakın.

Ayrıca [Güvenlik](/tr/clawhub/security) ve
[Kabul edilebilir kullanım](/tr/clawhub/acceptable-usage) bölümlerine bakın. Telif hakkı
veya diğer içerik haklarıyla ilgili endişeler için [İçerik Hakları Talepleri](/tr/clawhub/content-rights)
bölümünü kullanın.

## Raporlar

Oturum açmış kullanıcılar becerileri, Plugin'leri ve paketleri raporlayabilir.

ClawHub raporlarını yalnızca aşağıdakiler gibi güvensiz pazar yeri içerikleri için kullanın:

- kötü amaçlı listelemeler
- yanıltıcı metadata
- beyan edilmemiş kimlik bilgileri veya izin gereksinimleri
- şüpheli kurulum yönergeleri
- kimliğe bürünme
- kötü niyetli kayıtlar veya ticari marka kötüye kullanımı
- [Kabul edilebilir kullanım](/tr/clawhub/acceptable-usage) kurallarını ihlal eden içerik

Bir beceri sayfasındaki **Beceriyi bildir** düğmesini veya paketler için paket raporlama
komutunu/API'sini kullanın.

Üçüncü taraf bir becerinin veya Plugin'in kendi kaynak kodundaki güvenlik açıkları için
ClawHub raporlarını kullanmayın. Bunları doğrudan yayımcıya veya listelemede bağlantısı
verilen kaynak deposuna bildirin. ClawHub, üçüncü taraf beceri veya Plugin kodunun
bakımını yapmaz ya da yamalarını sağlamaz.

`openclaw/clawhub` için GitHub Security Advisories, ClawHub'ın kendisindeki güvenlik
açıkları içindir. Örnekler arasında web sitesi, API, CLI, kayıt defteri, kimlik doğrulama,
tarama, moderasyon veya indirme/kurulum güven sınırlarındaki hatalar bulunur. Üçüncü
taraf beceri veya Plugin'lerdeki güvenlik açıkları için ClawHub advisories kullanmayın.

İyi raporlar belirli ve eyleme dönüktür. Raporlamanın kötüye kullanılması da hesap
işlemine yol açabilir.

## Kuruluş ve namespace talepleri

Kuruluş, marka, paket kapsamı, sahip kullanıcı adı veya namespace sahipliği anlaşmazlıkları,
ürün içi rapor akışını ya da hesap itiraz formunu değil
[Kuruluş ve Namespace Talepleri](/tr/clawhub/namespace-claims) sürecini kullanmalıdır.

ClawHub personelinin bir namespace'in ayrılması, devredilmesi, yeniden adlandırılması,
gizlenmesi, karantinaya alınması, alias atanması veya başka şekilde incelenmesi gerektiğine
dair hassas olmayan kanıtları incelemesini istediğinizde bu süreci kullanın. Genel bir
soruna sırlar, özel belgeler, özel hukuki dosyalar, kişisel kimlik belgeleri, API token'ları
veya DNS challenge token'ları eklemeyin.

## Moderasyon bekletmeleri

Bazı ciddi bulgular veya politika sorunları bir yayımcıyı ya da listelemeyi moderasyon
bekletmesine alabilir. Bu olduğunda, etkilenen içerik genel keşiften gizlenebilir veya
gelecekteki yayımlar sorun incelenene kadar gizli başlayabilir.

Moderasyon bekletmeleri, ClawHub yüksek riskli durumları çözerken kullanıcıları korumak
içindir. Yanlış pozitif doğrulandığında bunlar kaldırılabilir.

## Gizli veya engellenmiş listelemeler

Bir listeleme genel kurulum yüzeylerinde bekletiliyor, gizli, karantinaya alınmış,
iptal edilmiş veya başka şekilde kullanılamaz olabilir.

Bu durumlardan birini görürseniz, sahip sorunu çözmedikçe veya moderasyon listelemeyi
geri yüklemedikçe sürümü kurmayın.

Sahipler, kendi bekletilen veya gizli listelemeleri için tanılama bilgilerini görmeye devam
edebilir. Bu tanılama bilgileri ne olduğunu ve listelemenin genel yüzeylere geri dönebilmesi
için neyin değişmesi gerektiğini açıklamaya yardımcı olur.

## Yasaklar ve hesap durumu

ClawHub politikasını ihlal eden hesaplar yayımlama erişimini kaybedebilir. Ciddi kötüye
kullanım hesap yasakları, token iptali, gizli içerik veya kaldırılmış listelemelerle
sonuçlanabilir. Yayımcı kötüye kullanım baskısı sinyalleri günlük olarak kontrol edilir.
ClawHub'ın olası yasak eşiğine ulaşan sinyaller otomatik bir uyarıyı tetikleyebilir.
Uyarı son tarihinden sonraki bir sonraki uygun tarama yayımcıyı hâlâ olası yasak eşiğine
yerleştiriyorsa, ClawHub hesap işlemini otomatik olarak uygulayabilir. Daha düşük güvenli
ve sınırlı zamansal inceleme sinyalleri otomatik yaptırımın dışında kalır.

Silinmiş, yasaklanmış veya devre dışı bırakılmış hesaplar ClawHub API token'larını
kullanamaz. Hesap işleminden sonra CLI kimlik doğrulaması başarısız olmaya başlarsa,
hesap durumunu incelemek için web UI'da oturum açın. Oturum açma veya normal CLI erişimi
bir yasak ya da devre dışı bırakılmış hesap nedeniyle engelleniyorsa, kurtarma incelemesi
için [ClawHub itiraz formunu](https://appeals.openclaw.ai/) kullanın.

Tarayıcı tarafından tetiklenen bir e-posta bir beceri veya Plugin sürümünü kötü amaçlı
olarak adlandırıyorsa, engellenen gönderilmiş sürüm için saklanan tarama sonuçlarını indirin:
`clawhub scan download <slug> --version <version>`. Plugin'ler için `--kind plugin`
ekleyin. Tarama çıktısını inceleyin, listelemeyi düzeltin, sürüm numarasını artırın ve
düzeltilmiş sürümü yükleyin.

## Yayımcı rehberi

Yanlış pozitifleri azaltmak ve kullanıcı güvenini artırmak için:

- adları, özetleri, etiketleri ve changelog'ları doğru tutun
- gerekli environment variable'ları ve izinleri beyan edin
- gizlenmiş kurulum komutlarından kaçının
- mümkün olduğunda kaynağa bağlantı verin
- Plugin yayımlamadan önce dry run kullanın
- kullanıcılar veya moderatörler sürüm davranışı hakkında soru sorarsa açık yanıt verin
