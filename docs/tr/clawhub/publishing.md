---
read_when:
    - Bir skill veya plugin yayımlama
    - Sahip veya paket kapsamı hatalarında hata ayıklama
    - Yayımlama kullanıcı arayüzü, CLI veya arka uç davranışı ekleme
summary: Skills, Plugin'ler, sahipler, kapsamlar, sürümler ve inceleme için ClawHub'da yayımlamanın işleyişi.
x-i18n:
    generated_at: "2026-07-12T12:07:00Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5c0270c0bc3316d970feddfc689c1125e1c90a62beeb40d8098dc6a6752cfa70
    source_path: clawhub/publishing.md
    workflow: 16
---

# Yayımlama

Yayımlama, bir skill klasörünü veya Plugin paketini seçtiğiniz sahibin altında ClawHub'a gönderir. ClawHub, token'ınızın bu sahip adına yayımlama yapabildiğini denetler; meta verileri, adı, sürümü, dosyaları ve kaynak bilgilerini doğrular; ardından sürümü depolar ve otomatik güvenlik denetimlerini başlatır.

Doğrulama başarısız olursa hiçbir şey yayımlanmaz. Yeni sürümler, inceleme tamamlanana kadar normal kurulum ve indirme yüzeylerinde de yer almayabilir.

## Skills

En basit yayımlama yolu CLI'dır. Oturum açın, ardından yerel bir skill klasörünü yayımlayın:

```bash
clawhub login
clawhub skill publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --owner <owner>
```

Bir kuruluş sahibi adına yayımlarken `--owner <handle>` kullanın. Kimliği doğrulanmış kullanıcı olarak yayımlamak için bunu atlayın. Yayımlama, değişmemiş içeriği atlar. Yeni bir skill `1.0.0` sürümüyle başlar ve sonraki değişiklikler bir sonraki yama sürümünü otomatik olarak yayımlar. Yalnızca açıkça belirli bir sürüme ihtiyacınız olduğunda `--version` iletin.

Katalog depoları için ClawHub'ın yeniden kullanılabilir [`skill-publish.yml` iş akışını](https://github.com/openclaw/clawhub/blob/main/.github/workflows/skill-publish.yml) kullanın. Bu iş akışı, `root` altındaki (varsayılan: `skills`) her bir doğrudan skill klasörü veya yalnızca `skill_path` olarak sağlanan klasör için `skill publish` komutunu çağırır.

```yaml
jobs:
  publish:
    uses: openclaw/clawhub/.github/workflows/skill-publish.yml@main
    with:
      owner: <owner>
      dry_run: false
    secrets:
      clawhub_token: ${{ secrets.CLAWHUB_TOKEN }}
```

Yeni ve değiştirilmiş skill'leri yayımlamadan önizlemek için `dry_run: true` kullanın.

## Pluginler

Pluginler npm tarzı paket adları kullanır. Kapsamlı paket adları, adın ilk bölümünde sahibi içerir:

```text
@owner/package-name
```

Kapsam, seçilen yayımlama sahibiyle eşleşmelidir. Paketinizin adı `@openclaw/dronzer` ise yalnızca `@openclaw` olarak yayımlanabilir. `@vintageayu` olarak yayımlıyorsanız paketi `@vintageayu/dronzer` olarak yeniden adlandırın.

Bu, bir paketin yayımlayıcının denetlemediği bir kuruluş ad alanı üzerinde hak iddia etmesini önler.

ClawHub'da zaten sahiplenilmiş veya ayrılmış bir kuruluşun, markanın, paket kapsamının, sahip tanıtıcısının ya da ad alanının hak sahibiyseniz, herkese açık ve hassas olmayan kanıtlarla bir [Kuruluş / Ad Alanı Hak Talebi sorunu](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml) açın. Nelerin ekleneceği ve herkese açık sorunların dışında tutulması gerekenler için [Kuruluş ve Ad Alanı Hak Talepleri](/clawhub/namespace-claims) bölümüne bakın.

### Bir Plugin Yayımlamadan Önce

- Paket kapsamıyla eşleşen bir sahip seçin.
- `openclaw.plugin.json` dosyasını ekleyin. Kod Pluginleri ayrıca `openclaw.compat.pluginApi` ve `openclaw.build.openclawVersion` alanlarını içeren bir `package.json` dosyasına ihtiyaç duyar.
- Özel bir Plugin kartı simgesi göstermek için `openclaw.plugin.json` dosyasına herhangi bir HTTPS görsel URL'sini içeren `icon` alanını ekleyin.
- Kaynak deposunu ve tam commit meta verilerini ekleyin ya da CLI'ın bunları algılayabilmesi için CLI'ı GitHub destekli bir çalışma kopyasından kullanın.
- Yayımlamadan önce `clawhub package validate <source>` komutunu çalıştırın. Paket, manifest, SDK içe aktarımı veya yapıt bulguları için [Plugin doğrulama düzeltmeleri](/clawhub/plugin-validation-fixes) bölümüne bakın.
- Bir sürüm oluşturmadan önce `clawhub package publish <source> --dry-run` komutunu çalıştırın.
- Otomatik güvenlik denetimleri ve doğrulama tamamlanana kadar yeni sürümlerin herkese açık kurulum yüzeylerinde yer almamasını bekleyin.

### Paketler İçin Güvenilir Yayımlama

Paketler için güvenilir yayımlama iki adımlı bir kurulumdur:

1. Paketi normal, manuel veya token ile kimliği doğrulanmış `clawhub package publish` komutuyla bir kez yayımlayın. Bu işlem paket kaydını oluşturur ve güvenilir yayımlayıcı yapılandırmasını değiştirebilecek paket yöneticilerini belirler.
2. Bir paket yöneticisi, GitHub Actions güvenilir yayımlayıcı yapılandırmasını ayarlar:

```bash
clawhub package trusted-publisher set @owner/package-name \
  --repository owner/repo \
  --workflow-filename package-publish.yml
```

Yapılandırma ayarlandıktan sonra, gelecekte desteklenen GitHub Actions yayımlamaları, depoda uzun ömürlü bir ClawHub token'ı saklamadan OIDC/güvenilir yayımlama kullanabilir. Yapılandırılan depo ve iş akışı dosya adı, GitHub Actions OIDC talebiyle eşleşmelidir. Ayrıca `--environment <name>` iletirseniz GitHub Actions ortam talebi bu adla tam olarak eşleşmelidir.

ClawHub, güvenilir yayımlayıcı yapılandırması ayarlanırken yapılandırılan GitHub deposunu doğrular. Herkese açık depolar, herkese açık GitHub meta verileri üzerinden doğrulanabilir. Özel depolar, örneğin gelecekteki bir ClawHub GitHub App kurulumu veya başka bir yetkilendirilmiş GitHub entegrasyonu aracılığıyla ClawHub'ın söz konusu depoya GitHub erişimine sahip olmasını gerektirir.

Mevcut yeniden kullanılabilir paket yayımlama iş akışı, `id-token: write` kullanılabildiğinde `workflow_dispatch` yayımlamaları için secretsız güvenilir yayımlamayı destekler. Etiket gönderimiyle yapılan gerçek yayımlamalar hâlâ `clawhub_token` gerektirir; bu nedenle etiket sürümleri, ilk yayımlamalar, güvenilmeyen paketler veya acil durum yayımlamaları için `CLAWHUB_TOKEN` değerini kullanılabilir durumda tutun.

Yapılandırmayı incelemek veya kaldırmak için:

```bash
clawhub package trusted-publisher get @owner/package-name
clawhub package trusted-publisher delete @owner/package-name
```

Güvenilir yayımlayıcı yapılandırmasını silmek geri alma yoludur. Bir paket yöneticisi yapılandırmayı yeniden ayarlayana kadar gelecekteki güvenilir yayımlama token'larının oluşturulmasını devre dışı bırakır.

## SSS

### Paket kapsamı seçilen sahiple eşleşmelidir

Paket kapsamı ile seçilen sahip eşleşmezse ClawHub yayımlamayı reddeder:

```text
Package scope "@openclaw" must match selected owner "@vintageayu".
Publish as "@openclaw" or rename this package to "@vintageayu/dronzer".
```

Bunu düzeltmek için paket kapsamının belirttiği sahibi seçin veya paketi, kapsam yayımlama yapabildiğiniz sahiple eşleşecek şekilde yeniden adlandırın.

Paket adı zaten doğru kapsama sahipse ancak paket yanlış yayımlayıcıya aitse bunun yerine sahipliği aktarın:

```sh
clawhub package transfer @opik/opik-openclaw --to opik
```

Paket veya skill aktarımını yalnızca hem mevcut sahibe hem de hedef yayımlayıcıya yönetici erişiminiz olduğunda kullanın. Paket aktarımı, yönetemediğiniz bir kapsamda yayımlama yapmanıza izin vermez.

Mevcut sahibe erişiminiz yoksa ancak kuruluşunuzun, projenizin veya markanızın ad alanının hak sahibi olduğuna inanıyorsanız personel incelemesi için herkese açık ve hassas olmayan kanıtlarla bir [Kuruluş / Ad Alanı Hak Talebi sorunu](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml) açın. Başvurmadan önce [Kuruluş ve Ad Alanı Hak Talepleri](/clawhub/namespace-claims) bölümüne bakın.

Bu, kuruluş ad alanlarını korur. `@openclaw/dronzer` adlı bir paket `@openclaw` ad alanı üzerinde hak iddia eder; bu nedenle paketi yalnızca `@openclaw` sahibine erişimi olan yayımlayıcılar yayımlayabilir.
