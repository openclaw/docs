---
read_when:
    - Bir kuruluş, marka, paket kapsamı, sahip kullanıcı adı, skill slug’ı veya paket ad alanını talep etme
    - Zaten alınmış veya ayrılmış bir ad alanını çözümleme
    - Rapor, itiraz veya ad alanı talebi kullanıp kullanmamaya karar verme
sidebarTitle: Org and Namespace Claims
summary: Kuruluş, marka, sahip tanıtıcısı, paket kapsamı, skill slug'ı veya ad alanı sahipliği anlaşmazlıkları için ClawHub incelemesi nasıl talep edilir.
title: Kuruluş ve Ad Alanı Talepleri
x-i18n:
    generated_at: "2026-07-04T10:57:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 77a4d8090b55298c401154d116d93d4f8139d40983a45982288d8e48bcea40fb
    source_path: clawhub/namespace-claims.md
    workflow: 16
---

# Kuruluş ve Ad Alanı Talepleri

ClawHub; sahip tanıtıcılarını, kuruluş tanıtıcılarını, skill slug'larını, plugin paket adlarını ve
paket kapsamlarını herkese açık ad alanları olarak kullanır. Bir ad alanı
gerçek dünyadaki bir projeye, markaya, paket ekosistemine veya kuruluşa ait gibi
görünüyor ancak ClawHub üzerinde zaten talep edilmiş, ayrılmış, yanıltıcı ya da
ihtilaflıysa, personelden bunu
[Kuruluş / Ad Alanı Talebi sorun formu](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml)
ile incelemesini isteyin.

Bu yolu herkese açık, hassas olmayan sahiplik incelemeleri için kullanın. Ad alanı
talepleri için ürün içi raporları veya hesap itiraz formunu kullanmayın.

## Ne Zaman Talep Açılmalı

ClawHub personelinin gerçek dünya sahipliği nedeniyle bir ad alanının ayrılması,
devredilmesi, yeniden adlandırılması, gizlenmesi, karantinaya alınması, diğer ad
atanması veya başka şekilde değiştirilmesi gerekip gerekmediğini incelemesi
gerektiğine inanıyorsanız bir ad alanı talebi açın.

Örnekler şunları içerir:

- GitHub kuruluşunuz, projeniz, şirketiniz veya topluluğunuzla eşleşen bir kuruluş tanıtıcısı
- yalnızca eşleşen ClawHub sahibi altında yayımlanması gereken `@example-org/*` gibi bir paket kapsamı
- bir projeyi taklit ediyor gibi görünen bir skill slug'ı veya plugin paket adı
- bir marka, ticari marka, proje yeniden adlandırması veya paket geçmişi ihtilafı
- hak sahibi ad alanı sahibini engelleyen silinmiş, etkin olmayan veya ulaşılamayan bir sahip

Listeleme sahiplik ihtilafının ötesinde güvensiz, kötü amaçlı veya yanıltıcıysa,
ilgili moderasyon veya güvenlik rehberliğini de izleyin. Ad alanı talep formu
sahiplik incelemesi içindir; acil güvenlik açığı bildirimi için değildir.

## Başvurmadan Önce

Önce ad alanıyla eşleşen sahiple yayımladığınızı doğrulayın. Plugin paketleri
için `@example-org/example-plugin` gibi kapsamlı adlar, eşleşen `example-org`
sahibi olarak yayımlanmalıdır.

Geçerli sahibi yönetebiliyorsanız, etkilenen kaynağı yayımlayarak, yeniden
adlandırarak, devrederek, gizleyerek veya silerek ad alanını doğrudan düzeltin.
Geçerli sahibi yönetemediğinizde veya personelin bir ihtilafı çözmesi gerektiğinde
talep kullanın.

## Eklenecek Kanıtlar

Herkese açık, hassas olmayan kanıtlar kullanın. Yararlı kanıtlar şunları içerir:

- GitHub kuruluşu, depo, sürüm veya bakımcı geçmişi
- ad alanını belirten resmi proje belgeleri
- alan adı veya resmi e-posta alan adı kanıtı
- npm, PyPI, crates.io veya diğer paket kayıt kapsamı kontrolü
- herkese açık olarak tartışılması güvenli olan ticari marka, marka veya proje sahipliği kanıtı
- kaynak deposu geçmişi, paket geçmişi veya herkese açık yeniden adlandırma duyuruları
- ihtilaflı ClawHub sahibi, skill, plugin, paket veya soruna bağlantılar

Her bağlantının neyi kanıtladığını açıklayın. Personel, özel kimlik bilgilerine
veya gizli bilgilere ihtiyaç duymadan ilişkiyi anlayabilmelidir.

## Neleri Eklememeli

Herkese açık bir GitHub sorununa gizli bilgiler veya özel kanıtlar koymayın.
Şunları eklemeyin:

- API token'ları, imzalama anahtarları veya kimlik bilgileri
- DNS doğrulama token'ları
- özel yasal dosyalar veya sözleşmeler
- kişisel kimlik belgeleri
- özel e-postalar, özel güvenlik raporları veya gizli müşteri verileri

Talep formu, hassas kanıtların özel bir personel kanalı gerektirip gerektirmediğini sorar.
Hassas materyali herkese açık olarak paylaşmak yerine bu seçeneği kullanın.

## Olası Sonuçlar

Kanıta ve riske bağlı olarak ClawHub personeli bir ad alanını ayırabilir,
sahipliği devredebilir, bir kaynağı yeniden adlandırabilir, mevcut bir listelemeyi
gizleyebilir veya karantinaya alabilir, bir diğer ad ya da yönlendirme ekleyebilir,
daha fazla kanıt isteyebilir ya da isteği reddedebilir.

Ad alanı incelemesi, eşleşen her adın devredileceğini garanti etmez.
Personel; herkese açık kanıtları, mevcut kullanımı, güvenlik riskini ve kullanıcı etkisini değerlendirir.

## İlgili Belgeler

- [Yayımlama](/tr/clawhub/publishing)
- [Sorun Giderme](/clawhub/troubleshooting#publish-fails-because-a-namespace-is-claimed-or-reserved)
- [Moderasyon ve Hesap Güvenliği](/clawhub/moderation)
- [Güvenlik](/clawhub/security)
