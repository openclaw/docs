---
read_when:
    - memory-wiki CLI'ını kullanmak istiyorsunuz
    - '`openclaw wiki` belgeliyorsunuz veya değiştiriyorsunuz'
summary: '`openclaw wiki` için CLI referansı (memory-wiki kasası durumu, arama, derleme, lint, uygulama, köprü, ChatGPT içe aktarma ve Obsidian yardımcıları)'
title: Viki
x-i18n:
    generated_at: "2026-07-12T12:12:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0e817fdd101c3fbe8c3c2aa51ab6a5e8e3bc35ce61376e746b7fceb0b87d0154
    source_path: cli/wiki.md
    workflow: 16
---

# `openclaw wiki`

`memory-wiki` kasasını inceleyin ve bakımını yapın. Birlikte gelen `memory-wiki` plugin'i tarafından sağlanır.

İlgili: [Memory Wiki plugin'i](/tr/plugins/memory-wiki), [Belleğe Genel Bakış](/tr/concepts/memory), [CLI: bellek](/tr/cli/memory)

## Yaygın komutlar

```bash
openclaw wiki status
openclaw wiki doctor
openclaw wiki init
openclaw wiki ingest ./notes/alpha.md
openclaw wiki okf import ./knowledge-catalog/okf/bundles/ga4
openclaw wiki compile
openclaw wiki lint
openclaw wiki search "alpha"
openclaw wiki search "who should I ask about Teams?" --mode route-question
openclaw wiki get entity.alpha --from 1 --lines 80

openclaw wiki apply synthesis "Alpha Summary" \
  --body "Short synthesis body" \
  --source-id source.alpha

openclaw wiki apply metadata entity.alpha \
  --source-id source.alpha \
  --status review \
  --question "Still active?"

openclaw wiki bridge import
openclaw wiki unsafe-local import
openclaw wiki chatgpt import --export ./chatgpt-export --dry-run
openclaw wiki chatgpt rollback <run-id>

openclaw wiki obsidian status
openclaw wiki obsidian search "alpha"
openclaw wiki obsidian open syntheses/alpha-summary.md
openclaw wiki obsidian command workspace:quick-switcher
openclaw wiki obsidian daily
```

## Ajan seçimi

`plugins.entries.memory-wiki.config.vault.scope`, `agent` olduğunda kasayı
üst düzey `--agent <id>` seçeneğiyle belirleyin:

```bash
openclaw wiki --agent support status
openclaw wiki --agent support search "refund policy"
openclaw wiki --agent marketing ingest ./campaign-notes.md
```

Birden fazla yapılandırılmış ajanın bulunduğu bir kurulumda, bir komutun rastgele bir varsayılan kasayı okuyamaması veya yazamaması için CLI işlemlerinde `--agent` zorunludur. Yalnızca bir ajan yapılandırılmışsa bu ajan varsayılan olarak kalır. Bilinmeyen ajan kimlikleri, kasa işlemi başlamadan önce hataya neden olur. `vault.scope`, `global` olduğunda bu seçenek belirlenen yolu değiştirmez.

Gateway istemcileri de aynı kuralı izler: ajan kapsamlı, çok ajanlı bir kurulumda kasa destekli `wiki.*` isteklerinde `agentId` iletin. Eksik veya bilinmeyen kimlik hatadır. Ajan turları, wiki araçları, bellek derlemi ekleri ve derlenmiş istem özetleri etkin çalışma zamanı ajan bağlamını zaten taşır.

## Komutlar

### `wiki status`

Kasa modunu ve kapsamını, çözümlenen ajanı, sistem durumunu ve Obsidian CLI kullanılabilirliğini gösterir. Hedeflenen kasanın başlatılıp başlatılmadığını, köprü modunun sağlıklı olup olmadığını veya Obsidian entegrasyonunun kullanılabilirliğini kontrol etmek için önce bunu kullanın.

Köprü modu etkinken ve bellek yapıtlarını okuyacak şekilde yapılandırıldığında bu komut, ajan/çalışma zamanı belleğiyle aynı etkin bellek plugin'i bağlamını görebilmek için çalışan Gateway'i sorgular.

### `wiki doctor`

Wiki sistem durumu kontrollerini çalıştırır ve uygulanabilir düzeltmeleri bildirir. Sistem sağlıklı değilse sıfırdan farklı bir kodla çıkar.

Köprü modu etkinken ve bellek yapıtlarını okuyacak şekilde yapılandırıldığında bu komut, raporu oluşturmadan önce çalışan Gateway'i sorgular. Devre dışı bırakılmış köprü içe aktarımları ve bellek yapıtlarını okumayan köprü yapılandırmaları yerel/çevrimdışı kalır.

Tipik sorunlar:

- herkese açık bellek yapıtları olmadan köprü modunun etkinleştirilmesi
- geçersiz veya eksik kasa düzeni
- Obsidian modu beklendiğinde harici Obsidian CLI'ın eksik olması

### `wiki init`

Üst düzey dizinler ve önbellek dizinleri dâhil olmak üzere wiki kasa düzenini ve başlangıç sayfalarını oluşturur.

### `wiki ingest <path>`

Yerel bir Markdown veya metin dosyasını kaynak sayfası olarak wiki `sources/` klasörüne aktarır. `<path>` yerel bir dosya yolu olmalıdır; şu anda URL'den içe aktarma yoktur. İkili dosyaları reddeder.

İçe aktarılan kaynak sayfaları kaynak bilgisi frontmatter'ı (`sourceType: local-file`, `sourcePath`, `ingestedAt`) taşır. İçe aktarma sonrasında kasa her zaman yeniden derlenir.

Bayraklar: `--title <title>`, kaynak başlığını geçersiz kılar (varsayılan: dosya adından türetilir).

### `wiki okf import <path>`

Paketinden çıkarılmış bir Open Knowledge Format paketini wiki kavram sayfalarına aktarır.

İçe aktarıcı, OKF dizin ağacındaki ayrılmamış her `.md` kavram belgesini okur, boş olmayan bir `type` alanı gerektirir ve bilinmeyen OKF `type` değerlerini genel kavramlar olarak ele alır. Ayrılmış OKF `index.md` ve `log.md` dosyaları kavram olarak içe aktarılmaz.

İçe aktarılan sayfalar `concepts/` altında düzleştirilir; böylece mevcut wiki derleme, arama, alma, özet ve pano akışları bunları hemen görür. Özgün OKF kavram kimliği, `type`, `resource`, `tags`, zaman damgası, kaynak yolu ve tam frontmatter, sayfa frontmatter'ında korunur. Dâhilî OKF Markdown bağlantıları oluşturulan wiki sayfalarına yönlendirilecek şekilde yeniden yazılır; bozuk veya harici bağlantılar değiştirilmeden bırakılır. İçe aktarma sonrasında kasa her zaman yeniden derlenir.

Örnekler:

```bash
openclaw wiki okf import ./bundles/ga4
openclaw wiki okf import ./bundles/ga4 --json
openclaw wiki search "BigQuery Table" --mode source-evidence --json
openclaw wiki get <path-from-json-result>
```

### `wiki compile`

Dizinleri, ilgili blokları, panoları ve derlenmiş özetleri yeniden oluşturur. Kararlı, makineye yönelik yapıtları şuraya yazar:

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

`render.createDashboards` etkinse derleme, rapor sayfalarını da yeniler.

### `wiki lint`

Kasayı denetler ve şunları kapsayan bir rapor yazar:

- yapısal sorunlar (bozuk bağlantılar, eksik/yinelenen kimlikler, eksik sayfa türü veya başlığı, geçersiz frontmatter)
- kaynak bilgisi eksiklikleri (eksik kaynak kimlikleri, eksik içe aktarma kaynak bilgisi)
- çelişkiler (işaretlenmiş çelişkiler, birbiriyle çatışan iddialar)
- açık sorular
- düşük güvenilirlikli sayfalar ve iddialar
- güncelliğini yitirmiş sayfalar ve iddialar

Bunu anlamlı wiki güncellemelerinden sonra çalıştırın.

### `wiki search <query>`

Wiki içeriğinde arama yapar. Davranış yapılandırmaya bağlıdır:

- `search.backend`: `shared` veya `local`
- `search.corpus`: `wiki`, `memory` veya `all`
- `--mode`: `auto`, `find-person`, `route-question`, `source-evidence` veya `raw-claim`

Wiki'ye özgü sıralama ve kaynak bilgisi için `wiki search` kullanın. Etkin bellek plugin'i paylaşılan aramayı sunuyorsa tek bir geniş, paylaşılan hatırlama geçişi için `openclaw memory search` komutunu tercih edin.

Arama modları:

- `find-person`: diğer adlar, kullanıcı adları, sosyal hesaplar, kurallı kimlikler ve kişi sayfaları
- `route-question`: kime-sorulmalı/en-iyi-ne-için-kullanılır ipuçları ve ilişki bağlamı
- `source-evidence`: kaynak sayfaları ve yapılandırılmış kanıt alanları
- `raw-claim`: iddia/kanıt meta verileriyle birlikte yapılandırılmış iddia metni

Örnekler:

```bash
openclaw wiki search "bgroux" --mode find-person
openclaw wiki search "who knows Teams rollout?" --mode route-question
openclaw wiki search "maintainer-whois" --mode source-evidence
openclaw wiki search "strong route Teams" --mode raw-claim --json
```

Bir sonuç yapılandırılmış bir iddiayla eşleştiğinde metin çıktısı `Claim:` ve `Evidence:` satırlarını içerir. JSON çıktısı, ajan tarafında ayrıntılı inceleme için ayrıca `matchedClaimId`, `matchedClaimStatus`, `matchedClaimConfidence`, `evidenceKinds` ve `evidenceSourceIds` alanlarını sunar.

### `wiki get <lookup>`

Bir wiki sayfasını kimliğine veya göreli yoluna göre okur.

```bash
openclaw wiki get entity.alpha
openclaw wiki get syntheses/alpha-summary.md --from 1 --lines 80
```

### `wiki apply`

Serbest biçimli sayfa düzenlemesi yapmadan dar kapsamlı değişiklikler uygular:

- `apply synthesis <title>`: yönetilen bir özet gövdesiyle bir sentez sayfası oluşturur veya yeniler
- `apply metadata <lookup>`: mevcut bir sayfadaki meta verileri günceller

Her ikisi de `--source-id`, `--contradiction`, `--question` (her biri tekrarlanabilir), `--confidence <n>` (0-1) ve `--status <status>` seçeneklerini kabul eder. `apply metadata`, saklanan bir güvenilirlik değerini kaldırmak için ayrıca `--clear-confidence` seçeneğini kabul eder. Yönetilen, oluşturulmuş blokları bozmadan wiki sayfalarını geliştirmek için desteklenen yöntem budur.

### `wiki bridge import`

Etkin bellek plugin'indeki herkese açık bellek yapıtlarını, köprü destekli kaynak sayfalarına aktarır. Dışa aktarılan en son bellek yapıtlarını wiki kasasına çekmek için bunu `bridge` modunda kullanın.

Etkin köprü yapıtı okumalarında CLI, çalışma zamanı bellek plugin'i bağlamını kullanması için içe aktarmayı Gateway RPC üzerinden yönlendirir. Köprü içe aktarımları devre dışıysa veya yapıt okumaları kapalıysa komut yerel/çevrimdışı sıfır içe aktarma davranışını korur. İçe aktarmadan sonraki dizin yenilemesi `ingest.autoCompile` tarafından denetlenir.

### `wiki unsafe-local import`

`unsafe-local` modunda açıkça yapılandırılmış yerel yollardan (`unsafeLocal.paths`) içe aktarır. Bilinçli olarak deneyseldir ve yalnızca aynı makinede çalışır. İçe aktarmadan sonraki dizin yenilemesi `ingest.autoCompile` tarafından denetlenir.

### `wiki chatgpt import`

Bir ChatGPT dışa aktarımını taslak wiki kaynak sayfalarına aktarır.

```bash
openclaw wiki chatgpt import --export ./chatgpt-export
openclaw wiki chatgpt import --export ./conversations.json --dry-run
```

| Bayrak            | Varsayılan | Açıklama                                                        |
| ----------------- | ---------- | --------------------------------------------------------------- |
| `--export <path>` | (zorunlu)  | ChatGPT dışa aktarma dizini veya `conversations.json` yolu.      |
| `--dry-run`       | `false`    | Sayfaları yazmadan oluşturulan/güncellenen/atlanan sayıları gösterir. |

Deneme çalıştırması olmayan ve herhangi bir sayfayı değiştiren içe aktarma, geri alma için gereken bir içe aktarma çalıştırma kimliğini kaydeder ve özette yazdırır.

### `wiki chatgpt rollback <run-id>`

Daha önce uygulanmış bir ChatGPT içe aktarma çalıştırmasını geri alır; oluşturduğu sayfaları kaldırır ve üzerine yazdığı sayfaları geri yükler. Çalıştırma zaten geri alınmışsa hiçbir işlem yapmaz (ve `alreadyRolledBack` bildirir).

### `wiki obsidian ...`

Obsidian uyumlu modda çalışan kasalar için Obsidian yardımcı komutları: `status`, `search`, `open`, `command`, `daily`. `obsidian.useOfficialCli` etkin olduğunda bunlar `PATH` üzerinde resmî `obsidian` CLI'ını gerektirir.

Yapılandırma doğrulaması, `obsidian.vaultName` ajan başına eşleme değil, tek bir genel ayar olduğundan `vault.scope`, `agent` iken `obsidian.useOfficialCli: true` değerini reddeder. Obsidian uyumlu Markdown oluşturma kullanılabilir kalır.

## Pratik kullanım rehberi

- Kaynak bilgisi ve sayfa kimliği önemli olduğunda `wiki search` + `wiki get` kullanın.
- Yönetilen, oluşturulmuş bölümleri elle düzenlemek yerine `wiki apply` kullanın.
- Çelişkili veya düşük güvenilirlikli içeriğe güvenmeden önce `wiki lint` kullanın.
- Yeni panoları ve derlenmiş özetleri hemen istediğinizde toplu içe aktarmalardan veya kaynak değişikliklerinden sonra `wiki compile` kullanın.
- Bir veri kataloğu, dokümantasyon dışa aktarımı veya ajan zenginleştirme işlem hattı zaten OKF Markdown paketleri üretiyorsa `wiki okf import` kullanın.
- Köprü modu yeni dışa aktarılmış bellek yapıtlarına bağlı olduğunda `wiki bridge import` kullanın.

## Yapılandırma bağlantıları

`openclaw wiki` davranışını şunlar şekillendirir:

- `plugins.entries.memory-wiki.config.vaultMode`
- `plugins.entries.memory-wiki.config.vault.scope`
- `plugins.entries.memory-wiki.config.vault.path`
- `plugins.entries.memory-wiki.config.search.backend`
- `plugins.entries.memory-wiki.config.search.corpus`
- `plugins.entries.memory-wiki.config.bridge.*`
- `plugins.entries.memory-wiki.config.obsidian.*`
- `plugins.entries.memory-wiki.config.ingest.autoCompile`
- `plugins.entries.memory-wiki.config.render.*`
- `plugins.entries.memory-wiki.config.context.includeCompiledDigestPrompt`

Tam yapılandırma modeli için [Memory Wiki plugin'i](/tr/plugins/memory-wiki) sayfasına bakın.

## İlgili

- [CLI başvurusu](/tr/cli)
- [Bellek wiki'si](/tr/plugins/memory-wiki)
