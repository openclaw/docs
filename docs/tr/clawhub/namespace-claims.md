---
read_when:
    - Kuruluş, marka, paket kapsamı, sahip kullanıcı adı, skill slug'ı veya paket ad alanı talep etme
    - Zaten talep edilmiş veya ayrılmış bir ad alanını çözme
    - Rapor, itiraz veya ad alanı talebi kullanıp kullanmamaya karar verme
sidebarTitle: Org and Namespace Claims
summary: Org, marka, sahip kullanıcı adı, paket kapsamı, skill-slug veya ad alanı sahipliği anlaşmazlıkları için ClawHub incelemesi nasıl istenir.
title: Kuruluş ve Ad Alanı Talepleri
x-i18n:
    generated_at: "2026-06-30T22:30:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 77a4d8090b55298c401154d116d93d4f8139d40983a45982288d8e48bcea40fb
    source_path: clawhub/namespace-claims.md
    workflow: 16
---

# Kuruluş ve Ad Alanı Talepleri

ClawHub, sahip tanıtıcılarını, kuruluş tanıtıcılarını, beceri slug'larını, Plugin paket adlarını ve
paket kapsamlarını genel ad alanları olarak kullanır. Bir ad alanı gerçek dünyadaki
bir projeye, markaya, paket ekosistemine veya kuruluşa ait gibi görünüyorsa ancak
ClawHub üzerinde zaten sahiplenilmiş, ayrılmış, yanıltıcı veya tartışmalıysa, personelden bunu
[Kuruluş / Ad Alanı Talebi sorun formu](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml)
ile incelemesini isteyin.

Bu yolu herkese açık, hassas olmayan sahiplik incelemesi için kullanın. Ad alanı
talepleri için ürün içi raporları veya hesap itiraz formunu kullanmayın.

## Ne Zaman Talep Açılmalı

ClawHub personelinin, gerçek dünya sahipliği nedeniyle bir ad alanının ayrılması,
devredilmesi, yeniden adlandırılması, gizlenmesi, karantinaya alınması, diğer adla ilişkilendirilmesi
veya başka şekilde değiştirilmesi gerekip gerekmediğini incelemesi gerektiğine inanıyorsanız
bir ad alanı talebi açın.

Örnekler şunları içerir:

- GitHub kuruluşunuz, projeniz, şirketiniz veya topluluğunuzla eşleşen bir kuruluş tanıtıcısı
- yalnızca eşleşen ClawHub sahibi altında yayımlanması gereken `@example-org/*` gibi bir paket kapsamı
- bir projeyi taklit ediyor gibi görünen bir beceri slug'ı veya Plugin paket adı
- marka, ticari marka, proje yeniden adlandırması veya paket geçmişi anlaşmazlığı
- hak sahibi ad alanı sahibini engelleyen silinmiş, etkin olmayan veya ulaşılamayan bir sahip

Liste, sahiplik anlaşmazlığının ötesinde güvensiz, kötü amaçlı veya yanıltıcıysa,
ilgili moderasyon veya güvenlik rehberliğini de izleyin. Ad alanı talebi
formu sahiplik incelemesi içindir, acil güvenlik açığı bildirimi için değildir.

## Başvurmadan Önce

Önce ad alanıyla eşleşen sahip ile yayımladığınızı doğrulayın.
Plugin paketleri için `@example-org/example-plugin` gibi kapsamlı adlar,
eşleşen `example-org` sahibi olarak yayımlanmalıdır.

Geçerli sahibi yönetebiliyorsanız, etkilenen kaynağı yayımlayarak, yeniden
adlandırarak, devrederek, gizleyerek veya silerek ad alanını doğrudan düzeltin.
Geçerli sahibi yönetemediğinizde veya personelin bir anlaşmazlığı çözmesi
gerektiğinde talep kullanın.

## Dahil Edilecek Kanıtlar

Herkese açık, hassas olmayan kanıt kullanın. Yararlı kanıtlar şunları içerir:

- GitHub kuruluşu, deposu, sürümü veya bakımcı geçmişi
- ad alanını adlandıran resmi proje dokümanları
- alan adı veya resmi e-posta alan adı kanıtı
- npm, PyPI, crates.io veya diğer paket kayıt kapsamı denetimi
- herkese açık şekilde tartışılması güvenli olan ticari marka, marka veya proje sahipliği kanıtı
- kaynak depo geçmişi, paket geçmişi veya herkese açık yeniden adlandırma duyuruları
- tartışmalı ClawHub sahibi, becerisi, Plugin'i, paketi veya sorununa bağlantılar

Her bağlantının neyi kanıtladığını açıklayın. Personel, özel kimlik bilgilerine
veya gizli bilgilere ihtiyaç duymadan ilişkiyi anlayabilmelidir.

## Neler Dahil Edilmemeli

Herkese açık bir GitHub sorununa gizli bilgiler veya özel kanıt koymayın. Şunları dahil etmeyin:

- API token'ları, imzalama anahtarları veya kimlik bilgileri
- DNS doğrulama token'ları
- özel yasal dosyalar veya sözleşmeler
- kişisel kimlik belgeleri
- özel e-postalar, özel güvenlik raporları veya gizli müşteri verileri

Talep formu, hassas kanıtlar için özel bir personel kanalının gerekip gerekmediğini sorar.
Hassas materyali herkese açık olarak yayımlamak yerine bu seçeneği kullanın.

## Olası Sonuçlar

Kanıta ve riske bağlı olarak, ClawHub personeli bir ad alanını ayırabilir,
sahipliği devredebilir, bir kaynağı yeniden adlandırabilir, mevcut bir listeyi
gizleyebilir veya karantinaya alabilir, bir diğer ad veya yönlendirme ekleyebilir,
daha fazla kanıt isteyebilir ya da isteği reddedebilir.

Ad alanı incelemesi, eşleşen her adın devredileceğini garanti etmez.
Personel, herkese açık kanıtları, mevcut kullanımı, güvenlik riskini ve kullanıcı etkisini değerlendirir.

## İlgili Dokümanlar

- [Yayınlama](/tr/clawhub/publishing)
- [Sorun Giderme](/clawhub/troubleshooting#publish-fails-because-a-namespace-is-claimed-or-reserved)
- [Moderasyon ve Hesap Güvenliği](/clawhub/moderation)
- [Güvenlik](/clawhub/security)
