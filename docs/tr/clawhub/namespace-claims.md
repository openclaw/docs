---
read_when:
    - Bir kuruluş, marka, paket kapsamı, sahip kullanıcı adı, skill slug veya paket ad alanı talep etme
    - Zaten talep edilmiş veya ayrılmış bir ad alanını çözümleme
    - Rapor, itiraz veya ad alanı talebi kullanıp kullanmayacağınıza karar verme
sidebarTitle: Org and Namespace Claims
summary: Kuruluş, marka, sahip tanıtıcısı, paket kapsamı, skill-slug veya ad alanı sahipliği anlaşmazlıkları için ClawHub incelemesinin nasıl talep edileceği.
title: Kuruluş ve Ad Alanı Talepleri
x-i18n:
    generated_at: "2026-07-01T15:29:04Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 77a4d8090b55298c401154d116d93d4f8139d40983a45982288d8e48bcea40fb
    source_path: clawhub/namespace-claims.md
    workflow: 16
---

# Kuruluş ve Ad Alanı Hak Talepleri

ClawHub; sahip kullanıcı adlarını, kuruluş kullanıcı adlarını, Skills kısa adlarını, Plugin paket adlarını ve
paket kapsamlarını herkese açık ad alanları olarak kullanır. Bir ad alanı gerçek dünyadaki bir
projeye, markaya, paket ekosistemine veya kuruluşa ait gibi görünüyor ancak ClawHub üzerinde
zaten talep edilmiş, ayrılmış, yanıltıcı ya da ihtilaflıysa, personelden bunu
[Kuruluş / Ad Alanı Hak Talebi sorun formu](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml)
ile incelemesini isteyin.

Bu yolu herkese açık, hassas olmayan sahiplik incelemeleri için kullanın. Ad alanı hak talepleri için ürün içi
raporları veya hesap itiraz formunu kullanmayın.

## Ne Zaman Hak Talebi Açılmalı

Gerçek dünyadaki sahiplik nedeniyle bir ad alanının ayrılması, devredilmesi, yeniden adlandırılması,
gizlenmesi, karantinaya alınması, takma ad verilmesi veya başka şekilde değiştirilmesi gerekip gerekmediğini
ClawHub personelinin incelemesi gerektiğini düşündüğünüzde bir ad alanı hak talebi açın.

Örnekler şunları içerir:

- GitHub kuruluşunuzla, projenizle, şirketinizle veya topluluğunuzla eşleşen bir kuruluş kullanıcı adı
- yalnızca eşleşen ClawHub sahibi altında yayınlanması gereken `@example-org/*` gibi bir paket kapsamı
- bir projeyi taklit ediyor gibi görünen bir Skills kısa adı veya Plugin paket adı
- bir marka, ticari marka, proje yeniden adlandırması veya paket geçmişi anlaşmazlığı
- hak sahibi ad alanı sahibini engelleyen silinmiş, etkin olmayan veya ulaşılamayan bir sahip

Listeleme sahiplik anlaşmazlığının ötesinde güvensiz, kötü amaçlı veya yanıltıcıysa,
ilgili moderasyon ya da güvenlik yönergelerini de izleyin. Ad alanı hak talebi
formu sahiplik incelemesi içindir, acil güvenlik açığı bildirimi için değildir.

## Başvuru Yapmadan Önce

Önce ad alanıyla eşleşen sahiple yayın yaptığınızı doğrulayın.
Plugin paketleri için `@example-org/example-plugin` gibi kapsamlı adlar,
eşleşen `example-org` sahibi olarak yayınlanmalıdır.

Geçerli sahibi yönetebiliyorsanız, etkilenen kaynağı yayınlayarak,
yeniden adlandırarak, devrederek, gizleyerek veya silerek ad alanını doğrudan düzeltin. Geçerli sahibi
yönetemediğinizde veya personelin bir anlaşmazlığı çözmesi gerektiğinde hak talebi kullanın.

## Eklenmesi Gereken Kanıtlar

Herkese açık, hassas olmayan kanıtlar kullanın. Yararlı kanıtlar şunları içerir:

- GitHub kuruluşu, deposu, sürümü veya bakımcı geçmişi
- ad alanını belirten resmi proje belgeleri
- alan adı veya resmi e-posta alan adı kanıtı
- npm, PyPI, crates.io veya başka paket kayıt kapsamı denetimi
- herkese açık şekilde tartışılması güvenli olan ticari marka, marka veya proje sahipliği kanıtı
- kaynak depo geçmişi, paket geçmişi veya herkese açık yeniden adlandırma duyuruları
- ihtilaflı ClawHub sahibine, Skills’e, Plugin’e, pakete veya soruna bağlantılar

Her bağlantının neyi kanıtladığını açıklayın. Personel, özel kimlik bilgilerine veya gizli bilgilere
ihtiyaç duymadan ilişkiyi anlayabilmelidir.

## Neler Eklenmemeli

Herkese açık bir GitHub sorununa gizli bilgiler veya özel kanıtlar koymayın. Şunları eklemeyin:

- API token’ları, imzalama anahtarları veya kimlik bilgileri
- DNS sınama token’ları
- özel hukuki dosyalar veya sözleşmeler
- kişisel kimlik belgeleri
- özel e-postalar, özel güvenlik raporları veya gizli müşteri verileri

Hak talebi formu, hassas kanıtlar için özel bir personel kanalına ihtiyaç olup olmadığını sorar.
Hassas materyali herkese açık şekilde göndermek yerine bu seçeneği kullanın.

## Olası Sonuçlar

Kanıtlara ve riske bağlı olarak ClawHub personeli bir ad alanını ayırabilir,
sahipliği devredebilir, bir kaynağı yeniden adlandırabilir, mevcut bir listelemeyi gizleyebilir veya karantinaya alabilir,
takma ad ya da yönlendirme ekleyebilir, daha fazla kanıt isteyebilir ya da isteği reddedebilir.

Ad alanı incelemesi, eşleşen her adın devredileceğini garanti etmez.
Personel; herkese açık kanıtları, mevcut kullanımı, güvenlik riskini ve kullanıcı etkisini değerlendirir.

## İlgili Belgeler

- [Yayınlama](/tr/clawhub/publishing)
- [Sorun Giderme](/clawhub/troubleshooting#publish-fails-because-a-namespace-is-claimed-or-reserved)
- [Moderasyon ve Hesap Güvenliği](/clawhub/moderation)
- [Güvenlik](/clawhub/security)
