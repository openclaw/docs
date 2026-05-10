---
read_when:
    - Bir beceri veya Plugin yayımlama
    - Sahip veya paket kapsamı hatalarında hata ayıklama
    - Yayınlama kullanıcı arayüzü, CLI veya arka uç davranışı ekleme
summary: Skills, Plugin, sahipler, kapsamlar, sürümler ve inceleme için ClawHub'da yayımlamanın nasıl çalıştığı.
x-i18n:
    generated_at: "2026-05-10T19:26:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 61de013f0ac82acbf20f99c3e0c92c8e31d3de14e9ee64f7bc7659d522747089
    source_path: clawhub/publishing.md
    workflow: 16
---

# Yayınlama

ClawHub yayınlama işlemi sahip kapsamlıdır: her yayınlama bir yayıncıyı hedefler ve
sunucu, oturum açmış kullanıcının orada yayınlama izni olup olmadığına karar verir.

## Sahipler

Sahip, `@alice` veya `@openclaw` gibi bir ClawHub yayıncı tanıtıcısıdır.
Kullanıcılar için kişisel sahipler oluşturulur. Kuruluş sahiplerinin birden çok üyesi olabilir.

Yayınladığınızda, kişisel sahibinizi kullanır veya yayıncı erişiminizin olduğu
bir kuruluş sahibini seçersiniz.

## Skills

Skills, bir skill klasöründen yayımlanır. Herkese açık sayfa şöyledir:

```text
https://clawhub.ai/<owner>/<slug>
```

Örnek:

```text
https://clawhub.ai/alice/review-helper
```

Yayınlama isteği seçilen sahibi, slug’ı, sürümü, değişiklik günlüğünü ve
dosyaları içerir. Sunucu, sürümü oluşturmadan önce aktörün o sahip adına
yayınlama yapabildiğini doğrular.

Yeni bir sürüm yayımlarken mevcut bir skill’i başka bir sahibe taşımak için
yeni sahibi seçin ve sahiplik taşımasını açıkça onaylayın. CLI/API içinde,
hedef sahibi ve taşıma onayını geçirin:

```sh
clawhub skill publish ./review-helper --owner openclaw --migrate-owner --version 1.2.0
```

Skill sahibi taşıması, hem mevcut sahipte hem de hedef sahipte yönetici veya
sahip erişimi gerektirir. Skill’i, sürüm geçmişini, istatistikleri,
yorumları, fork’ları, alias’ları ve denetim izini korur; eski sahip URL’leri
alias/yönlendirme yolu üzerinden çalışmaya devam eder.

## Pluginler

Pluginler npm tarzı paket adları kullanır. Kapsamlı paket adları, adın ilk
bölümünde sahibi içerir:

```text
@owner/package-name
```

Kapsam, seçilen yayınlama sahibiyle eşleşmelidir. Paketiniz
`@openclaw/dronzer` olarak adlandırılmışsa, yalnızca `@openclaw` olarak
yayımlanabilir. `@vintageayu` olarak yayımlıyorsanız, paketi
`@vintageayu/dronzer` olarak yeniden adlandırın.

Bu, bir paketin yayıncının denetlemediği bir kuruluş ad alanını sahiplenmesini
önler.

## Sürüm Akışı

1. UI, CLI veya GitHub iş akışı paket meta verilerini ve dosyaları toplar.
2. Yayınlama isteği, seçilen sahiple birlikte ClawHub’a gönderilir.
3. Sunucu sahip izinlerini, paket kapsamını, paket adını, sürümü,
   dosya sınırlarını ve kaynak meta verilerini doğrular.
4. ClawHub sürümü depolar ve otomatik güvenlik kontrollerini başlatır.
5. Yeni sürümler, inceleme ve doğrulama tamamlanana kadar normal
   kurulum/indirme yüzeylerinden gizlenir.

Doğrulama başarısız olursa sürüm oluşturulmaz.

## SSS

### Paket kapsamı seçilen sahiple eşleşmelidir

Paket kapsamı ve seçilen sahip eşleşmezse ClawHub yayınlamayı reddeder:

```text
Package scope "@openclaw" must match selected owner "@vintageayu".
Publish as "@openclaw" or rename this package to "@vintageayu/dronzer".
```

Bunu düzeltmek için paket kapsamının adlandırdığı sahibi seçin ya da kapsam,
yayınlama yapabildiğiniz sahiple eşleşecek şekilde paketi yeniden adlandırın.

Paket adı zaten doğru kapsama sahipse ancak paket yanlış yayıncıya aitse,
bunun yerine sahipliği aktarın:

```sh
clawhub package transfer @opik/opik-openclaw --to opik
```

Paket aktarımını yalnızca hem mevcut paket sahibine hem de hedef yayıncıya
yönetici erişiminiz olduğunda kullanın. Yönetemediğiniz bir kapsamda yayınlama
yapmanızı sağlamaz.

Bu, kuruluş ad alanlarını korur. `@openclaw/dronzer` adlı bir paket
`@openclaw` ad alanını sahiplenir; bu yüzden yalnızca `@openclaw` sahibine
erişimi olan yayıncılar onu yayımlayabilir.
