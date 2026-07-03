---
read_when:
    - Bir kuruluş, marka, paket kapsamı, sahip kullanıcı adı, skill slug’ı veya paket ad alanı üzerinde hak talep etme
    - Aşağıdaki zaten talep edilmiş veya ayrılmış bir ad alanını çözümlüyor
    - Rapor, itiraz veya ad alanı talebi kullanıp kullanmamaya karar verme
sidebarTitle: Org and Namespace Claims
summary: Org, marka, sahip tanıtıcısı, paket kapsamı, skill-slug veya namespace sahipliği anlaşmazlıkları için ClawHub incelemesi nasıl istenir.
title: Kuruluş ve Ad Alanı Talepleri
x-i18n:
    generated_at: "2026-07-03T01:01:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 77a4d8090b55298c401154d116d93d4f8139d40983a45982288d8e48bcea40fb
    source_path: clawhub/namespace-claims.md
    workflow: 16
---

# Kuruluş ve Ad Alanı Talepleri

ClawHub, sahip kullanıcı adlarını, kuruluş kullanıcı adlarını, skill slug’larını, plugin paket adlarını ve
paket kapsamlarını herkese açık ad alanları olarak kullanır. Bir ad alanı gerçek dünyadaki bir
projeye, markaya, paket ekosistemine veya kuruluşa ait gibi görünüyorsa ancak ClawHub üzerinde
zaten talep edilmiş, rezerve edilmiş, yanıltıcı ya da ihtilaflı durumdaysa, ekibin bunu
[Kuruluş / Ad Alanı Talebi sorun formu](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml)
ile incelemesini isteyin.

Bu yolu herkese açık, hassas olmayan sahiplik incelemeleri için kullanın. Ad alanı talepleri için
ürün içi bildirimleri veya hesap itiraz formunu kullanmayın.

## Ne Zaman Talep Açılmalı

ClawHub ekibinin bir ad alanının gerçek dünyadaki sahiplik nedeniyle rezerve edilmesi,
devredilmesi, yeniden adlandırılması, gizlenmesi, karantinaya alınması, takma ad eklenmesi
veya başka şekilde değiştirilmesi gerekip gerekmediğini incelemesi gerektiğini düşünüyorsanız
bir ad alanı talebi açın.

Örnekler:

- GitHub kuruluşunuz, projeniz, şirketiniz veya topluluğunuzla eşleşen bir kuruluş kullanıcı adı
- Yalnızca eşleşen ClawHub sahibi altında yayınlanması gereken `@example-org/*` gibi bir paket kapsamı
- Bir projeyi taklit ediyor gibi görünen bir skill slug’ı veya plugin paket adı
- Bir marka, ticari marka, proje yeniden adlandırması veya paket geçmişi ihtilafı
- Hak sahibi ad alanı sahibini engelleyen silinmiş, etkin olmayan veya ulaşılamayan bir sahip

Liste sahiplik ihtilafının ötesinde güvensiz, kötü amaçlı veya yanıltıcıysa, ilgili moderasyon
veya güvenlik yönergelerini de izleyin. Ad alanı talep formu sahiplik incelemesi içindir,
acil güvenlik açığı bildirimi için değildir.

## Başvurmadan Önce

Önce ad alanıyla eşleşen sahip üzerinden yayın yaptığınızı doğrulayın. Plugin paketleri için
`@example-org/example-plugin` gibi kapsamlı adlar, eşleşen `example-org` sahibi olarak
yayınlanmalıdır.

Mevcut sahibi yönetebiliyorsanız, etkilenen kaynağı yayınlayarak, yeniden adlandırarak,
devrederek, gizleyerek veya silerek ad alanını doğrudan düzeltin. Mevcut sahibi
yönetemediğinizde veya ekibin bir ihtilafı çözmesi gerektiğinde talep kullanın.

## Eklenmesi Gereken Kanıtlar

Herkese açık, hassas olmayan kanıtlar kullanın. Yararlı kanıtlar şunları içerir:

- GitHub kuruluşu, deposu, sürümü veya bakımcı geçmişi
- ad alanını belirten resmi proje dokümanları
- alan adı veya resmi e-posta alan adı kanıtı
- npm, PyPI, crates.io veya diğer paket kayıt kapsamı denetimi
- herkese açık olarak tartışılması güvenli olan ticari marka, marka veya proje sahipliği kanıtı
- kaynak depo geçmişi, paket geçmişi veya herkese açık yeniden adlandırma duyuruları
- ihtilaflı ClawHub sahibi, skill, plugin, paket veya soruna bağlantılar

Her bağlantının neyi kanıtladığını açıklayın. Ekip, özel kimlik bilgilerine veya gizli bilgilere
ihtiyaç duymadan ilişkiyi anlayabilmelidir.

## Neler Eklenmemeli

Herkese açık bir GitHub sorununa gizli bilgiler veya özel kanıtlar koymayın. Şunları eklemeyin:

- API token’ları, imzalama anahtarları veya kimlik bilgileri
- DNS doğrulama token’ları
- özel hukuki dosyalar veya sözleşmeler
- kişisel kimlik belgeleri
- özel e-postalar, özel güvenlik raporları veya gizli müşteri verileri

Talep formu, hassas kanıtlar için özel bir ekip kanalına ihtiyaç olup olmadığını sorar.
Hassas materyali herkese açık olarak paylaşmak yerine bu seçeneği kullanın.

## Olası Sonuçlar

Kanıta ve riske bağlı olarak ClawHub ekibi bir ad alanını rezerve edebilir,
sahipliği devredebilir, bir kaynağı yeniden adlandırabilir, mevcut bir listeyi gizleyebilir
veya karantinaya alabilir, bir takma ad ya da yönlendirme ekleyebilir, daha fazla kanıt
isteyebilir veya isteği reddedebilir.

Ad alanı incelemesi, eşleşen her adın devredileceğini garanti etmez. Ekip; herkese açık
kanıtları, mevcut kullanımı, güvenlik riskini ve kullanıcı etkisini değerlendirir.

## İlgili Dokümanlar

- [Yayınlama](/tr/clawhub/publishing)
- [Sorun giderme](/clawhub/troubleshooting#publish-fails-because-a-namespace-is-claimed-or-reserved)
- [Moderasyon ve Hesap Güvenliği](/clawhub/moderation)
- [Güvenlik](/clawhub/security)
