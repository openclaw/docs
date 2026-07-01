---
read_when:
    - Bir org, marka, paket kapsamı, sahip kullanıcı adı, skill slug'ı veya paket ad alanı talep etme
    - Zaten sahiplenilmiş veya ayrılmış bir ad alanını çözümleme
    - Rapor, itiraz veya ad alanı talebi kullanıp kullanmamaya karar verme
sidebarTitle: Org and Namespace Claims
summary: Kuruluş, marka, sahip kullanıcı adı, paket kapsamı, skill-slug veya ad alanı sahipliği anlaşmazlıkları için ClawHub incelemesi nasıl talep edilir.
title: Kuruluş ve Ad Alanı Talepleri
x-i18n:
    generated_at: "2026-07-01T18:17:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 77a4d8090b55298c401154d116d93d4f8139d40983a45982288d8e48bcea40fb
    source_path: clawhub/namespace-claims.md
    workflow: 16
---

# Kuruluş ve Ad Alanı Talepleri

ClawHub; sahip tanıtıcılarını, kuruluş tanıtıcılarını, Skills slug'larını, Plugin paket adlarını ve
paket kapsamlarını herkese açık ad alanları olarak kullanır. Bir ad alanı gerçek dünyadaki bir
projeye, markaya, paket ekosistemine veya kuruluşa ait gibi görünüyorsa ancak ClawHub üzerinde
zaten talep edilmiş, ayrılmış, yanıltıcı veya ihtilaflıysa, personelden bunu
[Kuruluş / Ad Alanı Talebi issue formu](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml)
ile incelemesini isteyin.

Bu yolu herkese açık, hassas olmayan sahiplik incelemesi için kullanın. Ad alanı talepleri için
ürün içi raporları veya hesap itiraz formunu kullanmayın.

## Ne Zaman Talep Açılmalı

ClawHub personelinin, gerçek dünyadaki sahiplik nedeniyle bir ad alanının
ayrılması, aktarılması, yeniden adlandırılması, gizlenmesi, karantinaya alınması, takma ad verilmesi
veya başka şekilde değiştirilmesi gerekip gerekmediğini incelemesi gerektiğine inanıyorsanız
bir ad alanı talebi açın.

Örnekler şunları içerir:

- GitHub kuruluşunuz, projeniz, şirketiniz veya topluluğunuzla eşleşen bir kuruluş tanıtıcısı
- yalnızca eşleşen ClawHub sahibi altında yayımlanması gereken `@example-org/*` gibi bir paket kapsamı
- bir projeyi taklit ediyor gibi görünen bir Skills slug'ı veya Plugin paket adı
- bir marka, ticari marka, proje yeniden adlandırması veya paket geçmişi anlaşmazlığı
- hak sahibi ad alanı sahibini engelleyen silinmiş, etkin olmayan veya ulaşılamayan bir sahip

Listeleme sahiplik anlaşmazlığının ötesinde güvensiz, kötü amaçlı veya yanıltıcıysa,
ilgili moderasyon veya güvenlik rehberliğini de izleyin. Ad alanı talep formu
sahiplik incelemesi içindir, acil güvenlik açığı bildirimi için değildir.

## Başvurmadan Önce

Önce ad alanıyla eşleşen sahiple yayımlama yaptığınızı doğrulayın.
Plugin paketleri için `@example-org/example-plugin` gibi kapsamlı adlar,
eşleşen `example-org` sahibi olarak yayımlanmalıdır.

Geçerli sahibi yönetebiliyorsanız, etkilenen kaynağı yayımlayarak, yeniden adlandırarak,
aktararak, gizleyerek veya silerek ad alanını doğrudan düzeltin. Geçerli sahibi
yönetemediğinizde veya personelin bir anlaşmazlığı çözmesi gerektiğinde talep kullanın.

## Eklenmesi Gereken Kanıtlar

Herkese açık, hassas olmayan kanıtlar kullanın. Yararlı kanıtlar şunları içerir:

- GitHub kuruluşu, deposu, yayını veya bakımcı geçmişi
- ad alanını belirten resmi proje dokümanları
- alan adı veya resmi e-posta alan adı kanıtı
- npm, PyPI, crates.io veya diğer paket kayıt kapsamı denetimi
- herkese açık şekilde tartışılması güvenli olan ticari marka, marka veya proje sahipliği kanıtı
- kaynak deposu geçmişi, paket geçmişi veya herkese açık yeniden adlandırma duyuruları
- ihtilaflı ClawHub sahibine, Skills'e, Plugin'e, pakete veya issue'ya bağlantılar

Her bağlantının neyi kanıtladığını açıklayın. Personel, özel kimlik bilgilerine veya
gizli bilgilere ihtiyaç duymadan ilişkiyi anlayabilmelidir.

## Neler Eklenmemeli

Herkese açık bir GitHub issue'suna gizli bilgiler veya özel kanıtlar koymayın. Şunları eklemeyin:

- API token'ları, imzalama anahtarları veya kimlik bilgileri
- DNS doğrulama token'ları
- özel hukuki dosyalar veya sözleşmeler
- kişisel kimlik belgeleri
- özel e-postalar, özel güvenlik raporları veya gizli müşteri verileri

Talep formu, hassas kanıtlar için özel bir personel kanalına ihtiyaç olup olmadığını sorar.
Hassas materyali herkese açık olarak paylaşmak yerine bu seçeneği kullanın.

## Olası Sonuçlar

Kanıta ve riske bağlı olarak ClawHub personeli bir ad alanını ayırabilir,
sahipliği aktarabilir, bir kaynağı yeniden adlandırabilir, mevcut bir listelemeyi gizleyebilir
veya karantinaya alabilir, bir takma ad veya yönlendirme ekleyebilir, daha fazla kanıt isteyebilir
veya isteği reddedebilir.

Ad alanı incelemesi, eşleşen her adın aktarılacağını garanti etmez.
Personel herkese açık kanıtları, mevcut kullanımı, güvenlik riskini ve kullanıcı etkisini değerlendirir.

## İlgili Dokümanlar

- [Yayımlama](/tr/clawhub/publishing)
- [Sorun Giderme](/clawhub/troubleshooting#publish-fails-because-a-namespace-is-claimed-or-reserved)
- [Moderasyon ve Hesap Güvenliği](/clawhub/moderation)
- [Güvenlik](/clawhub/security)
