---
read_when:
    - Bir kuruluşu, markayı, paket kapsamını, sahip kullanıcı adını, beceri kısa adını veya paket ad alanını sahiplenme
    - Zaten alınmış veya ayrılmış bir ad alanını çözümleme
    - Bildirim, itiraz veya ad alanı talebinden hangisinin kullanılacağına karar verme
sidebarTitle: Org and Namespace Claims
summary: Kuruluş, marka, sahip kullanıcı adı, paket kapsamı, Skills kısa adı veya ad alanı sahipliği anlaşmazlıkları için ClawHub incelemesi talep etme.
title: Kuruluş ve Ad Alanı Talepleri
x-i18n:
    generated_at: "2026-07-12T11:32:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 77a4d8090b55298c401154d116d93d4f8139d40983a45982288d8e48bcea40fb
    source_path: clawhub/namespace-claims.md
    workflow: 16
---

# Kuruluş ve Ad Alanı Talepleri

ClawHub; sahip tanıtıcılarını, kuruluş tanıtıcılarını, skill kısa adlarını, plugin paket adlarını ve paket kapsamlarını herkese açık ad alanları olarak kullanır. Bir ad alanı gerçek dünyadaki bir projeye, markaya, paket ekosistemine veya kuruluşa ait gibi görünüyor ancak ClawHub üzerinde önceden talep edilmiş, ayrılmış, yanıltıcı veya ihtilaflıysa personelden bunu [Kuruluş / Ad Alanı Talebi sorun formu](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml) aracılığıyla incelemesini isteyin.

Bu yolu, herkese açık ve hassas olmayan sahiplik incelemeleri için kullanın. Ad alanı talepleri için ürün içi bildirimleri veya hesap itiraz formunu kullanmayın.

## Ne Zaman Talep Açılmalı?

ClawHub personelinin gerçek dünyadaki sahiplik nedeniyle bir ad alanının ayrılması, devredilmesi, yeniden adlandırılması, gizlenmesi, karantinaya alınması, diğer adla ilişkilendirilmesi veya başka bir şekilde değiştirilmesi gerekip gerekmediğini incelemesi gerektiğini düşünüyorsanız bir ad alanı talebi açın.

Örnekler:

- GitHub kuruluşunuzla, projenizle, şirketinizle veya topluluğunuzla eşleşen bir kuruluş tanıtıcısı
- yalnızca eşleşen ClawHub sahibi altında yayımlanması gereken `@example-org/*` gibi bir paket kapsamı
- bir projeyi taklit ediyor gibi görünen bir skill kısa adı veya plugin paket adı
- bir marka, ticari marka, proje yeniden adlandırma veya paket geçmişi ihtilafı
- ad alanının hak sahibi olan kişinin kullanımını engelleyen silinmiş, etkin olmayan veya ulaşılamayan bir sahip

Listeleme, sahiplik ihtilafının ötesinde güvensiz, kötü amaçlı veya yanıltıcıysa ilgili moderasyon ya da güvenlik yönergelerini de izleyin. Ad alanı talep formu, sahiplik incelemesi içindir; acil güvenlik açığı bildirimi için değildir.

## Başvuru Yapmadan Önce

Öncelikle ad alanıyla eşleşen sahip üzerinden yayın yaptığınızı doğrulayın. Plugin paketlerinde `@example-org/example-plugin` gibi kapsamlı adlar, eşleşen `example-org` sahibi olarak yayımlanmalıdır.

Mevcut sahibi yönetebiliyorsanız etkilenen kaynağı yayımlayarak, yeniden adlandırarak, devrederek, gizleyerek veya silerek ad alanını doğrudan düzeltin. Mevcut sahibi yönetemediğinizde veya bir ihtilafın personel tarafından çözümlenmesi gerektiğinde talep oluşturun.

## Eklenecek Kanıtlar

Herkese açık ve hassas olmayan kanıtlar kullanın. Yararlı kanıtlar şunlardır:

- GitHub kuruluşu, deposu, sürümü veya bakım sorumlusu geçmişi
- ad alanını belirten resmî proje belgeleri
- alan adı veya resmî e-posta alan adı kanıtı
- npm, PyPI, crates.io veya başka bir paket kayıt sistemi kapsamının denetimi
- herkese açık biçimde tartışılması güvenli olan ticari marka, marka veya proje sahipliği kanıtı
- kaynak deposu geçmişi, paket geçmişi veya herkese açık yeniden adlandırma duyuruları
- ihtilaflı ClawHub sahibine, skill'e, plugin'e, pakete veya soruna giden bağlantılar

Her bağlantının neyi kanıtladığını açıklayın. Personel, özel kimlik bilgilerine veya gizli bilgilere ihtiyaç duymadan ilişkiyi anlayabilmelidir.

## Eklenmemesi Gerekenler

Herkese açık bir GitHub sorununa gizli bilgi veya özel kanıt eklemeyin. Şunları eklemeyin:

- API token'ları, imzalama anahtarları veya kimlik bilgileri
- DNS doğrulama token'ları
- özel hukuki dosyalar veya sözleşmeler
- kişisel kimlik belgeleri
- özel e-postalar, özel güvenlik raporları veya gizli müşteri verileri

Talep formu, hassas kanıtların özel bir personel kanalı gerektirip gerektirmediğini sorar. Hassas materyalleri herkese açık olarak yayımlamak yerine bu seçeneği kullanın.

## Olası Sonuçlar

Kanıtlara ve riske bağlı olarak ClawHub personeli bir ad alanını ayırabilir, sahipliği devredebilir, bir kaynağı yeniden adlandırabilir, mevcut bir listelemeyi gizleyebilir veya karantinaya alabilir, diğer ad ya da yönlendirme ekleyebilir, daha fazla kanıt isteyebilir veya talebi reddedebilir.

Ad alanı incelemesi, eşleşen her adın devredileceğini garanti etmez. Personel herkese açık kanıtları, mevcut kullanımı, güvenlik riskini ve kullanıcı etkisini değerlendirir.

## İlgili Belgeler

- [Yayımlama](/tr/clawhub/publishing)
- [Sorun Giderme](/clawhub/troubleshooting#publish-fails-because-a-namespace-is-claimed-or-reserved)
- [Moderasyon ve Hesap Güvenliği](/clawhub/moderation)
- [Güvenlik](/clawhub/security)
