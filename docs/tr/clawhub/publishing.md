---
read_when:
    - Bir beceriyi veya Plugin'i yayımlama
    - Sahip veya paket kapsamı hatalarında hata ayıklama
    - Yayınlama kullanıcı arayüzü, CLI veya arka uç davranışı ekleme
summary: ClawHub yayımlamasının Skills, Plugin'ler, sahipler, kapsamlar, sürümler ve inceleme için nasıl çalıştığı.
x-i18n:
    generated_at: "2026-05-11T20:24:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: 566c37b7845159ad100837e34bed7c60411bba6a0b3436ab899fe5e345237727
    source_path: clawhub/publishing.md
    workflow: 16
---

# Yayınlama

ClawHub yayınlama sahip kapsamlıdır: her yayın bir yayıncıyı hedefler ve
sunucu, oturum açmış kullanıcının orada yayın yapmasına izin verilip verilmediğine karar verir.

## Sahipler

Sahip, `@alice` veya `@openclaw` gibi bir ClawHub yayıncı tanıtıcısıdır.
Kişisel sahipler kullanıcılar için oluşturulur. Kuruluş sahiplerinin birden çok üyesi olabilir.

Yayınlarken kişisel sahibinizi kullanırsınız ya da yayıncı erişiminizin olduğu
bir kuruluş sahibini seçersiniz.

## Skills

Skills bir skill klasöründen yayınlanır. Herkese açık sayfa şudur:

```text
https://clawhub.ai/<owner>/<slug>
```

Örnek:

```text
https://clawhub.ai/alice/review-helper
```

Yayın isteği seçilen sahibi, slug değerini, sürümü, değişiklik günlüğünü ve
dosyaları içerir. Sunucu, sürümü oluşturmadan önce aktörün o sahip adına yayın
yapabildiğini doğrular.

Yeni bir sürüm yayınlarken mevcut bir skill'i başka bir sahibe taşımak için
yeni sahibi seçin ve sahiplik taşımasını açıkça onaylayın. CLI/API'de hedef
sahibi ve taşıma katılımını iletin:

```sh
clawhub skill publish ./review-helper --owner openclaw --migrate-owner --version 1.2.0
```

Skill sahip taşıması, hem mevcut sahipte hem de hedef sahipte yönetici veya
sahip erişimi gerektirir. Skill'i, sürüm geçmişini, istatistikleri, yorumları,
fork'ları, takma adları ve denetim izini korur; eski sahip URL'leri
takma ad/yönlendirme yolu üzerinden çalışmaya devam eder.

## Pluginler

Pluginler npm tarzı paket adları kullanır. Kapsamlı paket adları, adın ilk
bölümünde sahibi içerir:

```text
@owner/package-name
```

Kapsam, seçilen yayın sahibiyle eşleşmelidir. Paketinizin adı
`@openclaw/dronzer` ise yalnızca `@openclaw` olarak yayınlanabilir. `@vintageayu`
olarak yayınlarsanız paketi `@vintageayu/dronzer` olarak yeniden adlandırın.

Bu, bir paketin yayıncının kontrol etmediği bir kuruluş ad alanını sahiplenmesini
önler.

## Sürüm Akışı

1. UI, CLI veya GitHub workflow paket meta verilerini ve dosyaları toplar.
2. Yayın isteği seçilen sahiple birlikte ClawHub'a gönderilir.
3. Sunucu sahip izinlerini, paket kapsamını, paket adını, sürümü, dosya
   sınırlarını ve kaynak meta verilerini doğrular.
4. ClawHub sürümü depolar ve otomatik güvenlik denetimlerini başlatır.
5. Yeni sürümler, inceleme ve doğrulama tamamlanana kadar normal
   yükleme/indirme yüzeylerinden gizlenir.

Doğrulama başarısız olursa sürüm oluşturulmaz.

## SSS

### Paket kapsamı seçilen sahiple eşleşmelidir

Paket kapsamı ve seçilen sahip eşleşmezse ClawHub yayını reddeder:

```text
Package scope "@openclaw" must match selected owner "@vintageayu".
Publish as "@openclaw" or rename this package to "@vintageayu/dronzer".
```

Bunu düzeltmek için ya paket kapsamının adlandırdığı sahibi seçin ya da
kapsam, yayın yapabileceğiniz sahiple eşleşecek şekilde paketi yeniden adlandırın.

Paket adı zaten doğru kapsama sahipse ancak paket yanlış yayıncıya aitse
bunun yerine sahipliği aktarın:

```sh
clawhub package transfer @opik/opik-openclaw --to opik
```

Paket veya skill aktarımını yalnızca hem mevcut sahipte hem de hedef yayıncıda
yönetici erişiminiz olduğunda kullanın. Paket aktarımı, yönetemediğiniz bir
kapsamda yayın yapmanızı sağlamaz.

Bu, kuruluş ad alanlarını korur. `@openclaw/dronzer` adlı bir paket
`@openclaw` ad alanını sahiplenir; bu nedenle yalnızca `@openclaw` sahibine
erişimi olan yayıncılar bunu yayınlayabilir.
