---
read_when:
    - Bir kuruluş, marka, paket kapsamı, sahip tanıtıcısı, skill slug’ı veya paket ad alanını talep etme
    - Zaten talep edilmiş veya ayrılmış bir ad alanını çözme
    - Rapor, itiraz veya ad alanı talebi kullanıp kullanmamaya karar verme
sidebarTitle: Org and Namespace Claims
summary: Kuruluş, marka, sahip kullanıcı adı, paket kapsamı, skill-slug veya ad alanı sahipliği anlaşmazlıkları için ClawHub incelemesi nasıl talep edilir.
title: Kuruluş ve Ad Alanı Talepleri
x-i18n:
    generated_at: "2026-07-04T18:16:38Z"
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
projeye, markaya, paket ekosistemine veya kuruluşa ait gibi görünüyor ancak ClawHub üzerinde zaten
talep edilmiş, ayrılmış, yanıltıcı ya da ihtilaflıysa, personelden bunu
[Kuruluş / Ad Alanı Talebi sorun formu](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml)
ile incelemesini isteyin.

Bu yolu herkese açık, hassas olmayan sahiplik incelemesi için kullanın. Ad alanı talepleri için ürün içi
raporları veya hesap itiraz formunu kullanmayın.

## Ne Zaman Talep Açılmalı

Gerçek dünyadaki sahiplik nedeniyle bir ad alanının ayrılması, devredilmesi, yeniden adlandırılması,
gizlenmesi, karantinaya alınması, alias verilmesi veya başka şekilde değiştirilmesi gerekip gerekmediğini
ClawHub personelinin incelemesi gerektiğini düşündüğünüzde bir ad alanı talebi açın.

Örnekler şunları içerir:

- GitHub kuruluşunuzla, projenizle, şirketinizle veya topluluğunuzla eşleşen bir kuruluş kullanıcı adı
- yalnızca eşleşen ClawHub sahibi altında yayımlanması gereken `@example-org/*` gibi bir paket kapsamı
- bir projeyi taklit ediyor gibi görünen bir skill slug’ı veya plugin paket adı
- bir marka, ticari marka, proje yeniden adlandırması veya paket geçmişi ihtilafı
- hak sahibi ad alanı sahibini engelleyen silinmiş, etkin olmayan veya erişilemeyen bir sahip

Listeleme sahiplik ihtilafının ötesinde güvensiz, kötü amaçlı veya yanıltıcıysa, ilgili moderasyon veya
güvenlik yönergelerini de izleyin. Ad alanı talep formu sahiplik incelemesi içindir, acil güvenlik açığı
bildirimi için değildir.

## Başvurmadan Önce

Önce ad alanıyla eşleşen sahip ile yayımladığınızı doğrulayın.
Plugin paketleri için `@example-org/example-plugin` gibi kapsamlı adlar, eşleşen
`example-org` sahibi olarak yayımlanmalıdır.

Mevcut sahibi yönetebiliyorsanız, etkilenen kaynağı yayımlayarak, yeniden adlandırarak, devrederek,
gizleyerek veya silerek ad alanını doğrudan düzeltin. Mevcut sahibi yönetemediğinizde veya personelin
bir ihtilafı çözmesi gerektiğinde talep kullanın.

## Dahil Edilecek Kanıtlar

Herkese açık, hassas olmayan kanıtlar kullanın. Yararlı kanıtlar şunları içerir:

- GitHub kuruluşu, deposu, sürümü veya bakımcı geçmişi
- ad alanını adlandıran resmi proje dokümantasyonu
- alan adı veya resmi e-posta alan adı kanıtı
- npm, PyPI, crates.io veya diğer paket kayıt kapsamı denetimi
- herkese açık olarak tartışılması güvenli olan ticari marka, marka veya proje sahipliği kanıtı
- kaynak depo geçmişi, paket geçmişi veya herkese açık yeniden adlandırma bildirimleri
- ihtilaflı ClawHub sahibine, skill’e, plugin’e, pakete veya soruna bağlantılar

Her bağlantının neyi kanıtladığını açıklayın. Personel, özel kimlik bilgilerine veya sırlara ihtiyaç
duymadan ilişkiyi anlayabilmelidir.

## Neler Dahil Edilmemeli

Herkese açık bir GitHub sorununa sırlar veya özel kanıt koymayın. Şunları dahil etmeyin:

- API token’ları, imzalama anahtarları veya kimlik bilgileri
- DNS sınama token’ları
- özel yasal dosyalar veya sözleşmeler
- kişisel kimlik belgeleri
- özel e-postalar, özel güvenlik raporları veya gizli müşteri verileri

Talep formu, hassas kanıtların özel bir personel kanalı gerektirip gerektirmediğini sorar.
Hassas materyali herkese açık olarak göndermek yerine bu seçeneği kullanın.

## Olası Sonuçlar

Kanıta ve riske bağlı olarak, ClawHub personeli bir ad alanını ayırabilir, sahipliği devredebilir, bir kaynağı
yeniden adlandırabilir, mevcut bir listelemeyi gizleyebilir veya karantinaya alabilir, alias ya da yönlendirme
ekleyebilir, daha fazla kanıt isteyebilir veya isteği reddedebilir.

Ad alanı incelemesi, eşleşen her adın devredileceğini garanti etmez.
Personel herkese açık kanıtı, mevcut kullanımı, güvenlik riskini ve kullanıcı etkisini değerlendirir.

## İlgili Dokümanlar

- [Yayımlama](/tr/clawhub/publishing)
- [Sorun Giderme](/clawhub/troubleshooting#publish-fails-because-a-namespace-is-claimed-or-reserved)
- [Moderasyon ve Hesap Güvenliği](/clawhub/moderation)
- [Güvenlik](/clawhub/security)
