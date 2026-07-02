---
read_when:
    - Kuruluş, marka, paket kapsamı, sahip kullanıcı adı, skill kısa adı veya paket ad alanı talep etme
    - Zaten sahiplenilmiş veya ayrılmış bir namespace'i çözümleme
    - Rapor, itiraz veya ad alanı talebi kullanıp kullanmayacağınıza karar verme
sidebarTitle: Org and Namespace Claims
summary: Kuruluş, marka, sahip kullanıcı adı, paket kapsamı, beceri kısa adı veya ad alanı sahipliği anlaşmazlıkları için ClawHub incelemesinin nasıl talep edileceği.
title: Kurum ve Ad Alanı Talepleri
x-i18n:
    generated_at: "2026-07-02T14:09:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 77a4d8090b55298c401154d116d93d4f8139d40983a45982288d8e48bcea40fb
    source_path: clawhub/namespace-claims.md
    workflow: 16
---

# Kuruluş ve Ad Alanı Talepleri

ClawHub; sahip kullanıcı adlarını, kuruluş kullanıcı adlarını, beceri slug'larını, Plugin paket adlarını ve
paket kapsamlarını herkese açık ad alanları olarak kullanır. Bir ad alanı
gerçek dünyadaki bir projeye, markaya, paket ekosistemine veya kuruluşa ait
gibi görünüyorsa ancak ClawHub üzerinde zaten talep edilmiş, rezerve edilmiş,
yanıltıcı ya da ihtilaflı durumdaysa, ekibin bunu
[Kuruluş / Ad Alanı Talebi issue formu](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml)
ile incelemesini isteyin.

Bu yolu herkese açık, hassas olmayan sahiplik incelemeleri için kullanın. Ad
alanı talepleri için ürün içi raporları veya hesap itiraz formunu kullanmayın.

## Ne Zaman Talep Açılır

ClawHub ekibinin, gerçek dünyadaki sahiplik nedeniyle bir ad alanının rezerve
edilmesi, devredilmesi, yeniden adlandırılması, gizlenmesi, karantinaya alınması,
takma ad verilmesi veya başka şekilde değiştirilmesi gerekip gerekmediğini
incelemesi gerektiğine inanıyorsanız bir ad alanı talebi açın.

Örnekler şunları içerir:

- GitHub kuruluşunuzla, projenizle, şirketinizle veya topluluğunuzla eşleşen bir kuruluş kullanıcı adı
- yalnızca eşleşen ClawHub sahibi altında yayımlanması gereken `@example-org/*`
  gibi bir paket kapsamı
- bir projeyi taklit ediyor gibi görünen bir beceri slug'ı veya Plugin paket adı
- bir marka, ticari marka, proje yeniden adlandırması veya paket geçmişi ihtilafı
- hak sahibi ad alanı sahibini engelleyen silinmiş, etkin olmayan veya
  ulaşılamayan bir sahip

Listeleme, sahiplik ihtilafının ötesinde güvensiz, kötü niyetli veya
yanıltıcıysa, ilgili moderasyon veya güvenlik yönergelerini de izleyin. Ad alanı
talep formu sahiplik incelemesi içindir, acil güvenlik açığı bildirimi için
değildir.

## Başvurmadan Önce

Önce ad alanıyla eşleşen sahip üzerinden yayımlama yaptığınızı doğrulayın.
Plugin paketleri için `@example-org/example-plugin` gibi kapsamlı adlar,
eşleşen `example-org` sahibi olarak yayımlanmalıdır.

Mevcut sahibi yönetebiliyorsanız, etkilenen kaynağı yayımlayarak, yeniden
adlandırarak, devrederek, gizleyerek veya silerek ad alanını doğrudan düzeltin.
Mevcut sahibi yönetemediğinizde veya bir ihtilafı ekibin çözmesi gerektiğinde
talep kullanın.

## Eklenecek Kanıtlar

Herkese açık, hassas olmayan kanıt kullanın. Yararlı kanıtlar şunları içerir:

- GitHub kuruluşu, deposu, sürümü veya bakımcı geçmişi
- ad alanını adlandıran resmi proje dokümantasyonu
- alan adı veya resmi e-posta alan adı kanıtı
- npm, PyPI, crates.io veya diğer paket kayıt kapsamı kontrolü
- herkese açık şekilde tartışılması güvenli olan ticari marka, marka veya proje
  sahipliği kanıtı
- kaynak depo geçmişi, paket geçmişi veya herkese açık yeniden adlandırma duyuruları
- ihtilaflı ClawHub sahibi, becerisi, Plugin'i, paketi veya issue'suna bağlantılar

Her bağlantının neyi kanıtladığını açıklayın. Ekip, özel kimlik bilgilerine veya
sırlara ihtiyaç duymadan ilişkiyi anlayabilmelidir.

## Neler Eklenmemeli

Herkese açık bir GitHub issue'suna sır veya özel kanıt koymayın. Şunları
eklemeyin:

- API token'ları, imzalama anahtarları veya kimlik bilgileri
- DNS challenge token'ları
- özel yasal dosyalar veya sözleşmeler
- kişisel kimlik belgeleri
- özel e-postalar, özel güvenlik raporları veya gizli müşteri verileri

Talep formu, hassas kanıtlar için özel bir ekip kanalına ihtiyaç olup olmadığını
sorar. Hassas materyali herkese açık şekilde yayımlamak yerine bu seçeneği
kullanın.

## Olası Sonuçlar

Kanıta ve riske bağlı olarak ClawHub ekibi bir ad alanını rezerve edebilir,
sahipliği devredebilir, bir kaynağı yeniden adlandırabilir, mevcut bir
listelemeyi gizleyebilir veya karantinaya alabilir, bir takma ad ya da
yönlendirme ekleyebilir, daha fazla kanıt isteyebilir veya isteği reddedebilir.

Ad alanı incelemesi, eşleşen her adın devredileceğini garanti etmez. Ekip,
herkese açık kanıtları, mevcut kullanımı, güvenlik riskini ve kullanıcı etkisini
değerlendirir.

## İlgili Dokümanlar

- [Yayımlama](/tr/clawhub/publishing)
- [Sorun Giderme](/clawhub/troubleshooting#publish-fails-because-a-namespace-is-claimed-or-reserved)
- [Moderasyon ve Hesap Güvenliği](/clawhub/moderation)
- [Güvenlik](/clawhub/security)
