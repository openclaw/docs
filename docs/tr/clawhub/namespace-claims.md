---
read_when:
    - Bir kuruluşu, markayı, paket kapsamını, sahip kullanıcı adını, skill kısa adını veya paket ad alanını talep etme
    - Zaten sahiplenilmiş veya ayrılmış bir ad alanını çözümleme
    - Rapor, itiraz veya ad alanı talebi kullanıp kullanmamaya karar verme
sidebarTitle: Org and Namespace Claims
summary: Kuruluş, marka, sahip kullanıcı adı, paket kapsamı, skill-slug veya ad alanı sahipliği anlaşmazlıkları için ClawHub incelemesi nasıl istenir.
title: Kuruluş ve Ad Alanı Talepleri
x-i18n:
    generated_at: "2026-06-28T07:42:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 77a4d8090b55298c401154d116d93d4f8139d40983a45982288d8e48bcea40fb
    source_path: clawhub/namespace-claims.md
    workflow: 16
---

# Kuruluş ve Ad Alanı Talepleri

ClawHub; sahip tanıtıcılarını, kuruluş tanıtıcılarını, Skills slug'larını, Plugin paket adlarını ve
paket kapsamlarını herkese açık ad alanları olarak kullanır. Bir ad alanı gerçek dünyadaki
bir projeye, markaya, paket ekosistemine veya kuruluşa ait gibi görünüyorsa ancak ClawHub üzerinde
zaten talep edilmiş, ayrılmış, yanıltıcı ya da ihtilaflıysa, ekibin bunu
[Kuruluş / Ad Alanı Talebi issue formu](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml) ile
incelemesini isteyin.

Bu yolu herkese açık, hassas olmayan sahiplik incelemeleri için kullanın. Ad alanı talepleri için
ürün içi raporları veya hesap itiraz formunu kullanmayın.

## Ne Zaman Talep Açılmalı

ClawHub ekibinin, gerçek dünyadaki sahiplik nedeniyle bir ad alanının
ayrılması, devredilmesi, yeniden adlandırılması, gizlenmesi, karantinaya alınması, takma ad verilmesi
veya başka bir şekilde değiştirilmesi gerekip gerekmediğini incelemesi gerektiğine inanıyorsanız
bir ad alanı talebi açın.

Örnekler:

- GitHub kuruluşunuzla, projenizle, şirketinizle veya topluluğunuzla eşleşen bir kuruluş tanıtıcısı
- yalnızca eşleşen ClawHub sahibi altında yayımlanması gereken `@example-org/*` gibi bir paket kapsamı
- bir projeyi taklit ediyor gibi görünen bir Skills slug'ı veya Plugin paket adı
- marka, ticari marka, proje yeniden adlandırması veya paket geçmişi ihtilafı
- hak sahibi ad alanı sahibini engelleyen silinmiş, etkin olmayan veya ulaşılamayan bir sahip

Listeleme, sahiplik ihtilafının ötesinde güvensiz, kötü amaçlı veya yanıltıcıysa,
ilgili moderasyon ya da güvenlik yönergelerini de izleyin. Ad alanı talebi
formu sahiplik incelemesi içindir; acil güvenlik açığı bildirimi için değildir.

## Başvurmadan Önce

Önce ad alanıyla eşleşen sahip üzerinden yayımlama yaptığınızı doğrulayın.
Plugin paketleri için `@example-org/example-plugin` gibi kapsamlı adlar,
eşleşen `example-org` sahibi olarak yayımlanmalıdır.

Mevcut sahibi yönetebiliyorsanız, etkilenen kaynağı yayımlayarak,
yeniden adlandırarak, devrederek, gizleyerek veya silerek ad alanını doğrudan düzeltin. Mevcut sahibi
yönetemediğinizde veya ekibin bir ihtilafı çözmesi gerektiğinde talep kullanın.

## Dahil Edilecek Kanıtlar

Herkese açık, hassas olmayan kanıtlar kullanın. Yararlı kanıtlar şunları içerir:

- GitHub kuruluşu, deposu, sürümü veya bakımcı geçmişi
- ad alanını belirten resmi proje belgeleri
- alan adı veya resmi e-posta alan adı kanıtı
- npm, PyPI, crates.io veya diğer paket kayıt kapsamı denetimi
- herkese açık olarak tartışılması güvenli olan ticari marka, marka veya proje sahipliği kanıtı
- kaynak depo geçmişi, paket geçmişi veya herkese açık yeniden adlandırma duyuruları
- ihtilaflı ClawHub sahibine, Skills'e, Plugin'e, pakete veya issue'ya bağlantılar

Her bağlantının neyi kanıtladığını açıklayın. Ekip, özel kimlik bilgilerine veya sırlara ihtiyaç duymadan
ilişkiyi anlayabilmelidir.

## Neler Dahil Edilmemeli

Herkese açık bir GitHub issue'suna sır veya özel kanıt koymayın. Şunları dahil etmeyin:

- API token'ları, imzalama anahtarları veya kimlik bilgileri
- DNS doğrulama token'ları
- özel yasal dosyalar veya sözleşmeler
- kişisel kimlik belgeleri
- özel e-postalar, özel güvenlik raporları veya gizli müşteri verileri

Talep formu, hassas kanıtlar için özel bir ekip kanalının gerekip gerekmediğini sorar.
Hassas materyali herkese açık olarak göndermek yerine bu seçeneği kullanın.

## Olası Sonuçlar

Kanıtlara ve riske bağlı olarak ClawHub ekibi bir ad alanını ayırabilir,
sahipliği devredebilir, bir kaynağı yeniden adlandırabilir, mevcut bir listelemeyi gizleyebilir veya karantinaya alabilir,
takma ad ya da yönlendirme ekleyebilir, daha fazla kanıt isteyebilir veya isteği reddedebilir.

Ad alanı incelemesi, eşleşen her adın devredileceğini garanti etmez.
Ekip herkese açık kanıtları, mevcut kullanımı, güvenlik riskini ve kullanıcı etkisini değerlendirir.

## İlgili Belgeler

- [Yayımlama](/tr/clawhub/publishing)
- [Sorun Giderme](/tr/clawhub/troubleshooting#publish-fails-because-a-namespace-is-claimed-or-reserved)
- [Moderasyon ve Hesap Güvenliği](/tr/clawhub/moderation)
- [Güvenlik](/tr/clawhub/security)
