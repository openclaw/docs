---
read_when:
    - Bir kuruluşu, markayı, paket kapsamını, sahip kullanıcı adını, skill slug’ını veya paket ad alanını talep etme
    - Zaten talep edilmiş veya ayrılmış bir ad alanını çözümleme
    - Rapor, itiraz veya ad alanı talebi kullanıp kullanmamaya karar verme
sidebarTitle: Org and Namespace Claims
summary: Kuruluş, marka, sahip-kullanıcı adı, paket-kapsamı, skill-slug veya namespace sahipliği anlaşmazlıkları için ClawHub incelemesinin nasıl isteneceği.
title: Kuruluş ve Ad Alanı Talepleri
x-i18n:
    generated_at: "2026-07-04T20:39:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 77a4d8090b55298c401154d116d93d4f8139d40983a45982288d8e48bcea40fb
    source_path: clawhub/namespace-claims.md
    workflow: 16
---

# Kuruluş ve Ad Alanı Hak Talepleri

ClawHub, sahip tanıtıcılarını, kuruluş tanıtıcılarını, skill slug'larını, Plugin paket adlarını ve
paket kapsamlarını herkese açık ad alanları olarak kullanır. Bir ad alanı gerçek dünyadaki bir
projeye, markaya, paket ekosistemine veya kuruluşa ait gibi görünüyor ancak ClawHub üzerinde
zaten talep edilmiş, rezerve edilmiş, yanıltıcı ya da ihtilaflıysa, personelden bunu
[Kuruluş / Ad Alanı Hak Talebi issue formu](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml)
ile incelemesini isteyin.

Bu yolu herkese açık, hassas olmayan sahiplik incelemesi için kullanın. Ad alanı hak talepleri için
ürün içi raporları veya hesap itiraz formunu kullanmayın.

## Ne Zaman Hak Talebi Açılmalı

ClawHub personelinin, gerçek dünyadaki sahiplik nedeniyle bir ad alanının rezerve edilmesi,
devredilmesi, yeniden adlandırılması, gizlenmesi, karantinaya alınması, takma ad verilmesi
veya başka şekilde değiştirilmesi gerekip gerekmediğini incelemesi gerektiğini düşündüğünüzde
bir ad alanı hak talebi açın.

Örnekler şunları içerir:

- GitHub kuruluşunuz, projeniz, şirketiniz veya topluluğunuzla eşleşen bir kuruluş tanıtıcısı
- yalnızca eşleşen ClawHub sahibi altında yayımlanması gereken `@example-org/*` gibi bir paket kapsamı
- bir projeyi taklit ediyor gibi görünen bir skill slug'ı veya Plugin paket adı
- bir marka, ticari marka, proje yeniden adlandırması veya paket geçmişi ihtilafı
- hak sahibi ad alanı sahibini engelleyen silinmiş, etkin olmayan veya ulaşılamayan bir sahip

Listeleme, sahiplik ihtilafının ötesinde güvensiz, kötü niyetli veya yanıltıcıysa, ilgili moderasyon
veya güvenlik rehberliğini de izleyin. Ad alanı hak talebi formu sahiplik incelemesi içindir,
acil güvenlik açığı bildirimi için değildir.

## Başvurmadan Önce

Önce ad alanıyla eşleşen sahip üzerinden yayımladığınızı doğrulayın.
Plugin paketleri için `@example-org/example-plugin` gibi kapsamlı adlar, eşleşen
`example-org` sahibi olarak yayımlanmalıdır.

Geçerli sahibi yönetebiliyorsanız, etkilenen kaynağı yayımlayarak, yeniden adlandırarak,
devrederek, gizleyerek veya silerek ad alanını doğrudan düzeltin. Geçerli sahibi yönetemediğinizde
veya personelin bir ihtilafı çözmesi gerektiğinde hak talebi kullanın.

## Dahil Edilecek Kanıtlar

Herkese açık, hassas olmayan kanıtlar kullanın. Yararlı kanıtlar şunları içerir:

- GitHub kuruluşu, deposu, sürümü veya bakımcı geçmişi
- ad alanını belirten resmi proje belgeleri
- alan adı veya resmi e-posta alanı kanıtı
- npm, PyPI, crates.io veya diğer paket kayıt kapsamı denetimi
- herkese açık olarak tartışılması güvenli olan ticari marka, marka veya proje sahipliği kanıtı
- kaynak depo geçmişi, paket geçmişi veya herkese açık yeniden adlandırma duyuruları
- ihtilaflı ClawHub sahibine, skill'e, Plugin'e, pakete veya issue'ya bağlantılar

Her bağlantının neyi kanıtladığını açıklayın. Personel, özel kimlik bilgilerine veya sırlara
ihtiyaç duymadan ilişkiyi anlayabilmelidir.

## Neler Dahil Edilmemeli

Herkese açık bir GitHub issue'suna sır veya özel kanıt koymayın. Şunları dahil etmeyin:

- API token'ları, imzalama anahtarları veya kimlik bilgileri
- DNS doğrulama token'ları
- özel hukuki dosyalar veya sözleşmeler
- kişisel kimlik belgeleri
- özel e-postalar, özel güvenlik raporları veya gizli müşteri verileri

Hak talebi formu, hassas kanıtların özel bir personel kanalı gerektirip gerektirmediğini sorar.
Hassas materyali herkese açık olarak paylaşmak yerine bu seçeneği kullanın.

## Olası Sonuçlar

Kanıta ve riske bağlı olarak ClawHub personeli bir ad alanını rezerve edebilir, sahipliği
devredebilir, bir kaynağı yeniden adlandırabilir, mevcut bir listelemeyi gizleyebilir veya
karantinaya alabilir, bir takma ad veya yönlendirme ekleyebilir, daha fazla kanıt isteyebilir
ya da talebi reddedebilir.

Ad alanı incelemesi, eşleşen her adın devredileceğini garanti etmez. Personel herkese açık
kanıtı, mevcut kullanımı, güvenlik riskini ve kullanıcı etkisini değerlendirir.

## İlgili Belgeler

- [Yayımlama](/tr/clawhub/publishing)
- [Sorun Giderme](/clawhub/troubleshooting#publish-fails-because-a-namespace-is-claimed-or-reserved)
- [Moderasyon ve Hesap Güvenliği](/clawhub/moderation)
- [Güvenlik](/clawhub/security)
