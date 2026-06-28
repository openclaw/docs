---
read_when:
    - Bir beceriyi veya Plugin'i yayımlama
    - Sahip veya paket kapsamı hatalarında hata ayıklama
    - Yayımlama kullanıcı arayüzü, CLI veya arka uç davranışı ekleme
summary: ClawHub yayınlamasının Skills, Plugin'ler, sahipler, kapsamlar, sürümler ve inceleme için nasıl çalıştığı.
x-i18n:
    generated_at: "2026-06-28T00:19:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5c0270c0bc3316d970feddfc689c1125e1c90a62beeb40d8098dc6a6752cfa70
    source_path: clawhub/publishing.md
    workflow: 16
---

# Yayınlama

Yayınlama, seçtiğiniz sahip altında ClawHub'a bir skill klasörü veya Plugin paketi gönderir. ClawHub, token'ınızın o sahip için yayınlama yapabildiğini kontrol eder; meta verileri, adı, sürümü, dosyaları ve kaynak bilgilerini doğrular, ardından sürümü depolar ve otomatik güvenlik kontrollerini başlatır.

Doğrulama başarısız olursa hiçbir şey yayınlanmaz. Yeni sürümler ayrıca inceleme bitene kadar normal kurulum ve indirme yüzeylerinin dışında kalabilir.

## Skills

En basit yayınlama yolu CLI'dir. Oturum açın, ardından yerel bir skill klasörü yayınlayın:

```bash
clawhub login
clawhub skill publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --owner <owner>
```

Bir kuruluş sahibi adına yayınlarken `--owner <handle>` kullanın. Kimliği doğrulanmış kullanıcı olarak yayınlamak için bunu atlayın. Yayınlama, değişmemiş içeriği atlar. Yeni bir skill `1.0.0` sürümünden başlar ve sonraki değişiklikler bir sonraki yama sürümünü otomatik olarak yayınlar. `--version` seçeneğini yalnızca açık bir sürüme ihtiyacınız olduğunda geçirin.

Katalog depoları için ClawHub'ın yeniden kullanılabilir
[`skill-publish.yml` workflow](https://github.com/openclaw/clawhub/blob/main/.github/workflows/skill-publish.yml)
dosyasını kullanın. Bu, `root` altındaki her doğrudan skill klasörü için (varsayılan:
`skills`) veya yalnızca `skill_path` olarak sağlanan klasör için `skill publish` çağırır.

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

Yayınlamadan yeni ve değişen Skills önizlemesi için `dry_run: true` kullanın.

## Plugins

Plugins npm tarzı paket adları kullanır. Kapsamlı paket adları, adın ilk bölümünde sahibi içerir:

```text
@owner/package-name
```

Kapsam, seçilen yayınlama sahibiyle eşleşmelidir. Paketinizin adı
`@openclaw/dronzer` ise yalnızca `@openclaw` olarak yayınlanabilir. `@vintageayu` olarak yayınlıyorsanız paketi `@vintageayu/dronzer` olarak yeniden adlandırın.

Bu, bir paketin yayıncının kontrol etmediği bir kuruluş ad alanını sahiplenmesini engeller.

ClawHub üzerinde zaten sahiplenilmiş veya ayrılmış bir kuruluşun, markanın, paket kapsamının, sahip tanıtıcısının ya da ad alanının hak sahibi sizseniz, herkese açık ve hassas olmayan kanıtlarla bir
[Kuruluş / Ad Alanı Talebi issue](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml)
açın. Nelerin dahil edileceği ve nelerin herkese açık issue'ların dışında tutulacağı için
[Kuruluş ve Ad Alanı Talepleri](/tr/clawhub/namespace-claims) bölümüne bakın.

### Bir Plugin Yayınlamadan Önce

- Paket kapsamıyla eşleşen bir sahip seçin.
- `openclaw.plugin.json` dosyasını ekleyin. Kod Plugins için ayrıca `openclaw.compat.pluginApi` ve `openclaw.build.openclawVersion` içeren `package.json` gerekir.
- Özel bir Plugin kartı simgesi göstermek için herhangi bir HTTPS görsel URL'siyle birlikte `openclaw.plugin.json` dosyasına `icon` ekleyin.
- Kaynak depo ve tam commit meta verilerini ekleyin veya bunları algılayabilmesi için CLI'yi GitHub destekli bir checkout'tan kullanın.
- Yayınlamadan önce `clawhub package validate <source>` çalıştırın. Paket, manifest, SDK import'u veya artifact bulguları için
  [Plugin doğrulama düzeltmeleri](/tr/clawhub/plugin-validation-fixes) bölümüne bakın.
- Sürüm oluşturmadan önce `clawhub package publish <source> --dry-run` çalıştırın.
- Yeni sürümlerin, otomatik güvenlik kontrolleri ve doğrulama tamamlanana kadar herkese açık kurulum yüzeylerinin dışında kalmasını bekleyin.

### Paketler için Güvenilir Yayınlama

Paket güvenilir yayınlama iki adımlı bir kurulumdur:

1. Paketi normal manuel veya token ile kimliği doğrulanmış `clawhub package publish` üzerinden bir kez yayınlayın. Bu, paket satırını oluşturur ve güvenilir yayıncı yapılandırmasını değiştirebilecek paket yöneticilerini belirler.
2. Bir paket yöneticisi GitHub Actions güvenilir yayıncı yapılandırmasını ayarlar:

```bash
clawhub package trusted-publisher set @owner/package-name \
  --repository owner/repo \
  --workflow-filename package-publish.yml
```

Yapılandırma ayarlandıktan sonra, gelecekte desteklenen GitHub Actions yayınları depoda uzun ömürlü bir ClawHub token'ı saklamadan OIDC/güvenilir yayınlama kullanabilir. Yapılandırılan depo ve workflow dosya adı, GitHub Actions OIDC claim'iyle eşleşmelidir. Ayrıca `--environment <name>` geçirirseniz GitHub Actions environment claim'i bu adla tam olarak eşleşmelidir.

ClawHub, güvenilir yayıncı yapılandırması ayarlandığında yapılandırılan GitHub deposunu doğrular. Herkese açık depolar, herkese açık GitHub meta verileri aracılığıyla doğrulanabilir. Özel depolar için ClawHub'ın o depoya GitHub erişimine sahip olması gerekir; örneğin gelecekteki bir ClawHub GitHub App kurulumu veya başka bir yetkili GitHub entegrasyonu aracılığıyla.

Geçerli yeniden kullanılabilir paket yayınlama workflow'u, `id-token: write` kullanılabilir olduğunda `workflow_dispatch` yayınları için gizli anahtarsız güvenilir yayınlamayı destekler. Tag-push gerçek yayınları hâlâ `clawhub_token` gerektirir; bu nedenle tag sürümleri, ilk yayınlar, güvenilir olmayan paketler veya acil durum yayınları için `CLAWHUB_TOKEN` kullanılabilir tutun.

Yapılandırmayı inceleyin veya kaldırın:

```bash
clawhub package trusted-publisher get @owner/package-name
clawhub package trusted-publisher delete @owner/package-name
```

Güvenilir yayıncı yapılandırmasını silmek geri alma yoludur. Bir paket yöneticisi yapılandırmayı yeniden ayarlayana kadar gelecekteki güvenilir yayın token üretimini devre dışı bırakır.

## SSS

### Paket kapsamı seçilen sahiple eşleşmelidir

Paket kapsamı ve seçilen sahip eşleşmezse ClawHub yayını reddeder:

```text
Package scope "@openclaw" must match selected owner "@vintageayu".
Publish as "@openclaw" or rename this package to "@vintageayu/dronzer".
```

Bunu düzeltmek için ya paket kapsamının adlandırdığı sahibi seçin ya da kapsam, yayınlama yapabildiğiniz sahiple eşleşecek şekilde paketi yeniden adlandırın.

Paket adı zaten doğru kapsama sahipse ancak paket yanlış yayıncıya aitse bunun yerine sahipliği aktarın:

```sh
clawhub package transfer @opik/opik-openclaw --to opik
```

Paket veya skill aktarımını yalnızca hem geçerli sahibi hem de hedef yayıncı üzerinde yönetici erişiminiz olduğunda kullanın. Paket aktarımı, yönetemediğiniz bir kapsamda yayınlama yapmanıza izin vermez.

Geçerli sahibe erişiminiz yoksa ancak kuruluşunuzun, projenizin veya markanızın ad alanının hak sahibi olduğuna inanıyorsanız, personel incelemesi için herkese açık ve hassas olmayan kanıtlarla bir
[Kuruluş / Ad Alanı Talebi issue](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml)
açın. Başvurmadan önce
[Kuruluş ve Ad Alanı Talepleri](/tr/clawhub/namespace-claims) bölümüne bakın.

Bu, kuruluş ad alanlarını korur. `@openclaw/dronzer` adlı bir paket `@openclaw` ad alanını sahiplenir, bu nedenle yalnızca `@openclaw` sahibine erişimi olan yayıncılar bunu yayınlayabilir.
