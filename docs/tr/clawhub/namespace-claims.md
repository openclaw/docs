---
read_when:
    - Bir kuruluşu, markayı, paket kapsamını, sahip kullanıcı adını, skill slug'ını veya paket ad alanını sahiplenme
    - Zaten sahiplenilmiş veya ayrılmış bir ad alanını çözümleme
    - Bir rapor, itiraz veya ad alanı talebi kullanıp kullanmayacağınıza karar verme
sidebarTitle: Org and Namespace Claims
summary: Kuruluş, marka, sahip tanıtıcısı, paket kapsamı, skill-slug veya ad alanı sahipliği anlaşmazlıkları için ClawHub incelemesi isteme yöntemi.
title: Kuruluş ve Ad Alanı Talepleri
x-i18n:
    generated_at: "2026-07-01T08:22:05Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 77a4d8090b55298c401154d116d93d4f8139d40983a45982288d8e48bcea40fb
    source_path: clawhub/namespace-claims.md
    workflow: 16
---

# Kuruluş ve Ad Alanı Talepleri

ClawHub; sahip kullanıcı adlarını, kuruluş kullanıcı adlarını, Skills slug'larını, Plugin paket adlarını ve
paket kapsamlarını herkese açık ad alanları olarak kullanır. Bir ad alanı
gerçek dünyadaki bir projeye, markaya, paket ekosistemine veya kuruluşa ait gibi
görünüyor ancak ClawHub üzerinde zaten talep edilmiş, rezerve edilmiş, yanıltıcı
veya ihtilaflıysa, personelden bunu
[Kuruluş / Ad Alanı Talebi sorun formu](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml)
ile incelemesini isteyin.

Bu yolu herkese açık, hassas olmayan sahiplik incelemesi için kullanın. Ad alanı
talepleri için ürün içi raporları veya hesap itiraz formunu kullanmayın.

## Ne Zaman Talep Açılmalı

ClawHub personelinin bir ad alanının gerçek dünyadaki sahiplik nedeniyle
rezerve edilmesi, devredilmesi, yeniden adlandırılması, gizlenmesi, karantinaya
alınması, diğer ad atanması veya başka şekilde değiştirilmesi gerekip gerekmediğini
incelemesi gerektiğine inanıyorsanız bir ad alanı talebi açın.

Örnekler:

- GitHub kuruluşunuz, projeniz, şirketiniz veya topluluğunuzla eşleşen bir kuruluş kullanıcı adı
- yalnızca eşleşen ClawHub sahibi altında yayımlanması gereken `@example-org/*` gibi bir paket kapsamı
- bir projeyi taklit ediyor gibi görünen bir Skills slug'ı veya Plugin paket adı
- marka, ticari marka, proje yeniden adlandırması veya paket geçmişi ihtilafı
- hak sahibi ad alanı sahibini engelleyen silinmiş, etkin olmayan veya ulaşılamayan bir sahip

Listeleme, sahiplik ihtilafının ötesinde güvensiz, kötü niyetli veya yanıltıcıysa,
ilgili moderasyon veya güvenlik yönergelerini de izleyin. Ad alanı talep formu,
acil güvenlik açığı bildirimi için değil, sahiplik incelemesi içindir.

## Başvurmadan Önce

Önce ad alanıyla eşleşen sahip ile yayımlama yaptığınızı doğrulayın.
Plugin paketleri için `@example-org/example-plugin` gibi kapsamlı adlar,
eşleşen `example-org` sahibi olarak yayımlanmalıdır.

Mevcut sahibi yönetebiliyorsanız, etkilenen kaynağı yayımlayarak, yeniden
adlandırarak, devrederek, gizleyerek veya silerek ad alanını doğrudan düzeltin.
Mevcut sahibi yönetemediğinizde veya bir ihtilafı personelin çözmesi
gerektiğinde talep kullanın.

## Dahil Edilecek Kanıtlar

Herkese açık, hassas olmayan kanıtlar kullanın. Yararlı kanıtlar şunları içerir:

- GitHub kuruluşu, deposu, sürümü veya bakımcı geçmişi
- ad alanını belirten resmi proje belgeleri
- alan adı veya resmi e-posta alan adı kanıtı
- npm, PyPI, crates.io veya başka paket kayıt kapsamı denetimi
- herkese açık olarak tartışılması güvenli olan ticari marka, marka veya proje sahipliği kanıtı
- kaynak depo geçmişi, paket geçmişi veya herkese açık yeniden adlandırma duyuruları
- ihtilaflı ClawHub sahibine, Skills'e, Plugin'e, pakete veya soruna bağlantılar

Her bağlantının neyi kanıtladığını açıklayın. Personel, özel kimlik bilgilerine
veya sırlara ihtiyaç duymadan ilişkiyi anlayabilmelidir.

## Neler Dahil Edilmemeli

Herkese açık bir GitHub sorununa sır veya özel kanıt koymayın. Şunları dahil etmeyin:

- API token'ları, imzalama anahtarları veya kimlik bilgileri
- DNS doğrulama token'ları
- özel yasal dosyalar veya sözleşmeler
- kişisel kimlik belgeleri
- özel e-postalar, özel güvenlik raporları veya gizli müşteri verileri

Talep formu, hassas kanıtlar için özel bir personel kanalının gerekip gerekmediğini sorar.
Hassas materyali herkese açık olarak göndermek yerine bu seçeneği kullanın.

## Olası Sonuçlar

Kanıta ve riske bağlı olarak ClawHub personeli bir ad alanını rezerve edebilir,
sahipliği devredebilir, bir kaynağı yeniden adlandırabilir, mevcut bir listelemeyi
gizleyebilir veya karantinaya alabilir, bir diğer ad veya yönlendirme ekleyebilir,
daha fazla kanıt isteyebilir ya da isteği reddedebilir.

Ad alanı incelemesi, eşleşen her adın devredileceğini garanti etmez.
Personel; herkese açık kanıtları, mevcut kullanımı, güvenlik riskini ve kullanıcı etkisini değerlendirir.

## İlgili Belgeler

- [Yayımlama](/tr/clawhub/publishing)
- [Sorun Giderme](/clawhub/troubleshooting#publish-fails-because-a-namespace-is-claimed-or-reserved)
- [Moderasyon ve Hesap Güvenliği](/clawhub/moderation)
- [Güvenlik](/clawhub/security)
