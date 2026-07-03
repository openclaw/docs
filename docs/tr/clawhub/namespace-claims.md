---
read_when:
    - Bir kuruluşu, markayı, paket kapsamını, sahip tanıtıcısını, beceri slug'ını veya paket ad alanını talep etme
    - Zaten sahiplenilmiş veya ayrılmış bir ad alanını çözümleme
    - Rapor, itiraz veya ad alanı talebi kullanılıp kullanılmayacağına karar verme
sidebarTitle: Org and Namespace Claims
summary: Kuruluş, marka, sahip tanıtıcısı, paket kapsamı, skill-slug veya ad alanı sahipliği anlaşmazlıkları için ClawHub incelemesi nasıl talep edilir.
title: Kuruluş ve Ad Alanı Talepleri
x-i18n:
    generated_at: "2026-07-03T09:53:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 77a4d8090b55298c401154d116d93d4f8139d40983a45982288d8e48bcea40fb
    source_path: clawhub/namespace-claims.md
    workflow: 16
---

# Organizasyon ve Ad Alanı Talepleri

ClawHub, sahip kullanıcı adlarını, organizasyon kullanıcı adlarını, skill slug'larını, Plugin paket adlarını ve
paket kapsamlarını herkese açık ad alanları olarak kullanır. Bir ad alanı
gerçek dünyadaki bir projeye, markaya, paket ekosistemine veya organizasyona ait
görünüyor ancak ClawHub üzerinde zaten talep edilmiş, ayrılmış, yanıltıcı ya da
ihtilaflıysa, personelden bunu
[Organizasyon / Ad Alanı Talebi issue formu](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml)
ile incelemesini isteyin.

Bu yolu herkese açık, hassas olmayan sahiplik incelemesi için kullanın. Ad alanı
talepleri için ürün içi raporları veya hesap itiraz formunu kullanmayın.

## Ne Zaman Talep Açılmalı

ClawHub personelinin gerçek dünyadaki sahiplik nedeniyle bir ad alanının
ayrılması, devredilmesi, yeniden adlandırılması, gizlenmesi, karantinaya alınması,
alias eklenmesi veya başka şekilde değiştirilmesi gerekip gerekmediğini
incelemesi gerektiğine inanıyorsanız bir ad alanı talebi açın.

Örnekler şunları içerir:

- GitHub organizasyonunuz, projeniz, şirketiniz veya topluluğunuzla eşleşen bir organizasyon kullanıcı adı
- yalnızca eşleşen ClawHub sahibi altında yayımlanması gereken `@example-org/*` gibi bir paket kapsamı
- bir projeyi taklit ediyor gibi görünen bir skill slug'ı veya Plugin paket adı
- bir marka, ticari marka, proje yeniden adlandırması veya paket geçmişi ihtilafı
- hak sahibi ad alanı sahibini engelleyen silinmiş, etkin olmayan veya ulaşılamayan bir sahip

Listeleme sahiplik ihtilafının ötesinde güvensiz, kötü amaçlı veya yanıltıcıysa,
ilgili moderasyon veya güvenlik yönergelerini de izleyin. Ad alanı talep formu,
acil güvenlik açığı bildirimi için değil, sahiplik incelemesi içindir.

## Başvurmadan Önce

Önce, ad alanıyla eşleşen sahip üzerinden yayımladığınızı doğrulayın.
Plugin paketleri için `@example-org/example-plugin` gibi kapsamlı adlar,
eşleşen `example-org` sahibi olarak yayımlanmalıdır.

Geçerli sahibi yönetebiliyorsanız, etkilenen kaynağı yayımlayarak, yeniden
adlandırarak, devrederek, gizleyerek veya silerek ad alanını doğrudan düzeltin.
Geçerli sahibi yönetemediğinizde veya personelin bir ihtilafı çözmesi
gerektiğinde talep kullanın.

## Eklenecek Kanıtlar

Herkese açık, hassas olmayan kanıtlar kullanın. Yararlı kanıtlar şunları içerir:

- GitHub organizasyonu, depo, sürüm veya bakımcı geçmişi
- ad alanını adlandıran resmi proje belgeleri
- alan adı veya resmi e-posta alan adı kanıtı
- npm, PyPI, crates.io veya diğer paket kayıt kapsamı denetimi
- herkese açık şekilde tartışılması güvenli olan ticari marka, marka veya proje sahipliği kanıtı
- kaynak depo geçmişi, paket geçmişi veya herkese açık yeniden adlandırma bildirimleri
- ihtilaflı ClawHub sahibine, skill'e, Plugin'e, pakete veya issue'ya bağlantılar

Her bağlantının neyi kanıtladığını açıklayın. Personel, özel kimlik bilgilerine
veya sırlara ihtiyaç duymadan ilişkiyi anlayabilmelidir.

## Neler Eklenmemeli

Herkese açık bir GitHub issue'suna sır veya özel kanıt koymayın. Şunları eklemeyin:

- API token'ları, imzalama anahtarları veya kimlik bilgileri
- DNS challenge token'ları
- özel yasal dosyalar veya sözleşmeler
- kişisel kimlik belgeleri
- özel e-postalar, özel güvenlik raporları veya gizli müşteri verileri

Talep formu, hassas kanıtlar için özel bir personel kanalına ihtiyaç olup
olmadığını sorar. Hassas materyali herkese açık şekilde göndermek yerine bu
seçeneği kullanın.

## Olası Sonuçlar

Kanıta ve riske bağlı olarak, ClawHub personeli bir ad alanını ayırabilir,
sahipliği devredebilir, bir kaynağı yeniden adlandırabilir, mevcut bir listelemeyi
gizleyebilir veya karantinaya alabilir, bir alias ya da yönlendirme ekleyebilir,
daha fazla kanıt isteyebilir veya isteği reddedebilir.

Ad alanı incelemesi, eşleşen her adın devredileceğini garanti etmez.
Personel herkese açık kanıtları, mevcut kullanımı, güvenlik riskini ve kullanıcı etkisini değerlendirir.

## İlgili Belgeler

- [Yayımlama](/tr/clawhub/publishing)
- [Sorun giderme](/clawhub/troubleshooting#publish-fails-because-a-namespace-is-claimed-or-reserved)
- [Moderasyon ve Hesap Güvenliği](/clawhub/moderation)
- [Güvenlik](/clawhub/security)
