---
read_when:
    - Bir kuruluşu, markayı, paket kapsamını, sahip tanıtıcısını, skill slug'ını veya paket ad alanını talep etme
    - Bir ad alanını çözümleme zaten talep edilmiş veya ayrılmış
    - Rapor, itiraz veya ad alanı talebi kullanılıp kullanılmayacağına karar verme
sidebarTitle: Org and Namespace Claims
summary: Org, marka, sahip kullanıcı adı, paket kapsamı, skill-slug veya namespace sahipliği anlaşmazlıkları için ClawHub incelemesi nasıl talep edilir.
title: Kuruluş ve Ad Alanı Talepleri
x-i18n:
    generated_at: "2026-07-03T23:39:59Z"
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
zaten talep edilmiş, ayrılmış, yanıltıcı ya da ihtilaflıysa, personelden bunu
[Kuruluş / Ad Alanı Talebi sorun formu](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml)
ile incelemesini isteyin.

Bu yolu herkese açık, hassas olmayan sahiplik incelemesi için kullanın. Ad alanı talepleri için
ürün içi raporları veya hesap itiraz formunu kullanmayın.

## Ne Zaman Talep Açılmalı

ClawHub personelinin gerçek dünyadaki sahiplik nedeniyle bir ad alanının ayrılması,
devredilmesi, yeniden adlandırılması, gizlenmesi, karantinaya alınması, takma ad verilmesi
veya başka şekilde değiştirilmesi gerekip gerekmediğini incelemesi gerektiğini düşünüyorsanız
bir ad alanı talebi açın.

Örnekler şunları içerir:

- GitHub kuruluşunuzla, projenizle, şirketinizle veya topluluğunuzla eşleşen bir kuruluş tanıtıcısı
- yalnızca eşleşen ClawHub sahibi altında yayımlanması gereken `@example-org/*` gibi bir paket kapsamı
- bir projeyi taklit ediyor gibi görünen bir Skills slug'ı veya Plugin paket adı
- bir marka, ticari marka, proje yeniden adlandırması veya paket geçmişi ihtilafı
- hak sahibi ad alanı sahibini engelleyen silinmiş, etkin olmayan veya ulaşılamayan bir sahip

Listeleme sahiplik ihtilafının ötesinde güvensiz, kötü amaçlı veya yanıltıcıysa,
ilgili moderasyon ya da güvenlik yönergelerini de izleyin. Ad alanı talep formu,
acil güvenlik açığı bildirimi için değil, sahiplik incelemesi içindir.

## Başvurmadan Önce

Önce ad alanıyla eşleşen sahip olarak yayımladığınızı doğrulayın.
Plugin paketleri için `@example-org/example-plugin` gibi kapsamlı adlar,
eşleşen `example-org` sahibi olarak yayımlanmalıdır.

Mevcut sahibi yönetebiliyorsanız, etkilenen kaynağı yayımlayarak, yeniden adlandırarak,
devrederek, gizleyerek veya silerek ad alanını doğrudan düzeltin. Mevcut sahibi
yönetemediğinizde veya personelin bir ihtilafı çözmesi gerektiğinde talep kullanın.

## Eklenecek Kanıtlar

Herkese açık, hassas olmayan kanıtlar kullanın. Yararlı kanıtlar şunları içerir:

- GitHub kuruluşu, deposu, sürümü veya bakımcı geçmişi
- ad alanını belirten resmi proje belgeleri
- alan adı veya resmi e-posta alan adı kanıtı
- npm, PyPI, crates.io veya başka paket kayıt kapsamı kontrolü
- herkese açık olarak tartışılması güvenli olan ticari marka, marka veya proje sahipliği kanıtı
- kaynak deposu geçmişi, paket geçmişi veya herkese açık yeniden adlandırma duyuruları
- ihtilaflı ClawHub sahibi, Skills, Plugin, paket veya soruna bağlantılar

Her bağlantının neyi kanıtladığını açıklayın. Personel, özel kimlik bilgilerine veya
gizli bilgilere ihtiyaç duymadan ilişkiyi anlayabilmelidir.

## Neler Eklenmemeli

Herkese açık bir GitHub sorununa gizli bilgiler veya özel kanıt koymayın. Şunları eklemeyin:

- API token'ları, imzalama anahtarları veya kimlik bilgileri
- DNS doğrulama token'ları
- özel yasal dosyalar veya sözleşmeler
- kişisel kimlik belgeleri
- özel e-postalar, özel güvenlik raporları veya gizli müşteri verileri

Talep formu, hassas kanıtlar için özel bir personel kanalının gerekip gerekmediğini sorar.
Hassas materyali herkese açık olarak göndermek yerine bu seçeneği kullanın.

## Olası Sonuçlar

Kanıta ve riske bağlı olarak ClawHub personeli bir ad alanını ayırabilir,
sahipliği devredebilir, bir kaynağı yeniden adlandırabilir, mevcut bir listelemeyi
gizleyebilir veya karantinaya alabilir, bir takma ad ya da yönlendirme ekleyebilir,
daha fazla kanıt isteyebilir ya da isteği reddedebilir.

Ad alanı incelemesi, eşleşen her adın devredileceğini garanti etmez.
Personel; herkese açık kanıtları, mevcut kullanımı, güvenlik riskini ve kullanıcı etkisini değerlendirir.

## İlgili Belgeler

- [Yayımlama](/tr/clawhub/publishing)
- [Sorun Giderme](/clawhub/troubleshooting#publish-fails-because-a-namespace-is-claimed-or-reserved)
- [Moderasyon ve Hesap Güvenliği](/clawhub/moderation)
- [Güvenlik](/clawhub/security)
