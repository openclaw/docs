---
read_when:
    - memory-wiki CLI’yi kullanmak istiyorsunuz
    - '`openclaw wiki` belgeliyorsunuz veya değiştiriyorsunuz'
summary: '`openclaw wiki` için CLI başvurusu (memory-wiki kasası durumu, arama, derleme, lint, uygulama, köprü ve Obsidian yardımcıları)'
title: Viki
x-i18n:
    generated_at: "2026-06-28T00:26:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c6679a5aad41a19dbcad6075c190c3eb533e3ba13a6d5018d56988a23b2d9023
    source_path: cli/wiki.md
    workflow: 16
---

# `openclaw wiki`

`memory-wiki` kasasını inceleyin ve bakımını yapın.

Birlikte gelen `memory-wiki` Plugin'i tarafından sağlanır.

İlgili:

- [Memory Wiki Plugin'i](/tr/plugins/memory-wiki)
- [Bellek Genel Bakışı](/tr/concepts/memory)
- [CLI: bellek](/tr/cli/memory)

## Ne için kullanılır

Aşağıdakileri içeren derlenmiş bir bilgi kasası istediğinizde `openclaw wiki` kullanın:

- wiki'ye özgü arama ve sayfa okumaları
- kaynak bilgisi açısından zengin sentezler
- çelişki ve güncellik raporları
- active memory Plugin'inden köprü içe aktarımları
- isteğe bağlı Obsidian CLI yardımcıları

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

openclaw wiki obsidian status
openclaw wiki obsidian search "alpha"
openclaw wiki obsidian open syntheses/alpha-summary.md
openclaw wiki obsidian command workspace:quick-switcher
openclaw wiki obsidian daily
```

## Komutlar

### `wiki status`

Geçerli kasa modunu, sağlığını ve Obsidian CLI kullanılabilirliğini inceleyin.

Kasanın başlatılıp başlatılmadığından, köprü modunun sağlıklı olup olmadığından veya Obsidian entegrasyonunun kullanılabilir olup olmadığından emin değilseniz önce bunu kullanın.

Köprü modu etkin olduğunda ve bellek yapıtlarını okuyacak şekilde yapılandırıldığında, bu komut çalışan Gateway'i sorgular; böylece ajan/çalışma zamanı belleğiyle aynı active memory Plugin'i bağlamını görür.

### `wiki doctor`

Wiki sağlık denetimlerini çalıştırın ve yapılandırma ya da kasa sorunlarını gösterin.

Köprü modu etkin olduğunda ve bellek yapıtlarını okuyacak şekilde yapılandırıldığında, bu komut raporu oluşturmadan önce çalışan Gateway'i sorgular. Devre dışı bırakılmış köprü içe aktarımları ve bellek yapıtlarını okumayan köprü yapılandırmaları yerel/çevrimdışı kalır.

Tipik sorunlar şunları içerir:

- genel bellek yapıtları olmadan etkinleştirilmiş köprü modu
- geçersiz veya eksik kasa düzeni
- Obsidian modu beklendiğinde eksik harici Obsidian CLI

### `wiki init`

Wiki kasa düzenini ve başlangıç sayfalarını oluşturun.

Bu, üst düzey dizinler ve önbellek dizinleri dahil olmak üzere kök yapıyı başlatır.

### `wiki ingest <path-or-url>`

İçeriği wiki kaynak katmanına aktarın.

Notlar:

- URL içe aktarımı `ingest.allowUrlIngest` tarafından denetlenir
- içe aktarılan kaynak sayfalar kaynak bilgisini frontmatter içinde tutar
- etkinleştirildiğinde içe aktarmadan sonra otomatik derleme çalışabilir

### `wiki okf import <path>`

Paketinden çıkarılmış bir Open Knowledge Format paketini wiki kavram sayfalarına içe aktarın.

İçe aktarıcı, OKF dizin ağacındaki ayrılmış olmayan her `.md` kavram belgesini okur, boş olmayan bir `type` alanı gerektirir ve bilinmeyen OKF `type` değerlerini genel kavramlar olarak ele alır. Ayrılmış OKF `index.md` ve `log.md` dosyaları kavram olarak içe aktarılmaz.

İçe aktarılan sayfalar `concepts/` altında düzleştirilir; böylece mevcut wiki derleme, arama, getirme, özet ve pano akışları bunları hemen görür. Özgün OKF kavram kimliği, `type`, `resource`, `tags`, zaman damgası, kaynak yolu ve tam frontmatter sayfa frontmatter'ında korunur. Dahili OKF markdown bağlantıları oluşturulan wiki sayfalarına yeniden yazılır; bozuk veya harici bağlantılar değiştirilmeden bırakılır.

Örnekler:

```bash
openclaw wiki okf import ./bundles/ga4
openclaw wiki okf import ./bundles/ga4 --json
openclaw wiki search "BigQuery Table" --mode source-evidence --json
openclaw wiki get <path-from-json-result>
```

### `wiki compile`

Dizinleri, ilgili blokları, panoları ve derlenmiş özetleri yeniden oluşturun.

Bu, kararlı makineye yönelik yapıtları şuraya yazar:

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

`render.createDashboards` etkinse derleme rapor sayfalarını da yeniler.

### `wiki lint`

Kasayı denetleyin ve şunları raporlayın:

- yapısal sorunlar
- kaynak bilgisi boşlukları
- çelişkiler
- açık sorular
- düşük güvenilirlikli sayfalar/iddialar
- eski sayfalar/iddialar

Bunu anlamlı wiki güncellemelerinden sonra çalıştırın.

### `wiki search <query>`

Wiki içeriğinde arama yapın.

Davranış yapılandırmaya bağlıdır:

- `search.backend`: `shared` veya `local`
- `search.corpus`: `wiki`, `memory` veya `all`
- `--mode`: `auto`, `find-person`, `route-question`, `source-evidence` veya
  `raw-claim`

Wiki'ye özgü sıralama veya kaynak bilgisi ayrıntıları istediğinizde `wiki search` kullanın. Geniş kapsamlı tek bir ortak hatırlama geçişi için, active memory Plugin'i ortak aramayı sunuyorsa `openclaw memory search` tercih edin.

Arama modları ajanın doğru yüzeyi seçmesine yardımcı olur:

- `find-person`: takma adlar, kullanıcı adları, sosyal hesaplar, kanonik kimlikler ve kişi sayfaları
- `route-question`: kime sorulacağı/en iyi ne için kullanılacağı ipuçları ve ilişki bağlamı
- `source-evidence`: kaynak sayfalar ve yapılandırılmış kanıt alanları
- `raw-claim`: iddia/kanıt meta verileriyle yapılandırılmış iddia metni

Örnekler:

```bash
openclaw wiki search "bgroux" --mode find-person
openclaw wiki search "who knows Teams rollout?" --mode route-question
openclaw wiki search "maintainer-whois" --mode source-evidence
openclaw wiki search "strong route Teams" --mode raw-claim --json
```

Bir sonuç yapılandırılmış bir iddiayla eşleştiğinde metin çıktısı `Claim:` ve `Evidence:` satırlarını içerir. JSON çıktısı ayrıca ajan tarafı ayrıntılı inceleme için `matchedClaimId`, `matchedClaimStatus`, `matchedClaimConfidence`, `evidenceKinds` ve `evidenceSourceIds` alanlarını sunar.

### `wiki get <lookup>`

Bir wiki sayfasını kimliğe veya göreli yola göre okuyun.

Örnekler:

```bash
openclaw wiki get entity.alpha
openclaw wiki get syntheses/alpha-summary.md --from 1 --lines 80
```

### `wiki apply`

Serbest biçimli sayfa düzenlemesi yapmadan dar kapsamlı değişiklikler uygulayın.

Desteklenen akışlar şunları içerir:

- sentez sayfası oluşturma/güncelleme
- sayfa meta verilerini güncelleme
- kaynak kimlikleri ekleme
- soru ekleme
- çelişki ekleme
- güvenilirlik/durum güncelleme
- yapılandırılmış iddialar yazma

Bu komut, yönetilen blokları elle düzenlemeden wiki'nin güvenli şekilde gelişebilmesi için vardır.

### `wiki bridge import`

Active memory Plugin'inden genel bellek yapıtlarını köprü destekli kaynak sayfalara içe aktarın.

Wiki kasasına en son dışa aktarılmış bellek yapıtlarının çekilmesini istediğinizde bunu `bridge` modunda kullanın.

Etkin köprü yapıtı okumalarında CLI, içe aktarımı Gateway RPC üzerinden yönlendirir; böylece içe aktarma çalışma zamanı bellek Plugin'i bağlamını kullanır. Köprü içe aktarımları devre dışıysa veya yapıt okumaları kapalıysa komut yerel/çevrimdışı sıfır içe aktarma davranışını korur.

### `wiki unsafe-local import`

`unsafe-local` modunda açıkça yapılandırılmış yerel yollardan içe aktarın.

Bu özellikle deneysel ve yalnızca aynı makine içindir.

### `wiki obsidian ...`

Obsidian dostu modda çalışan kasalar için Obsidian yardımcı komutları.

Alt komutlar:

- `status`
- `search`
- `open`
- `command`
- `daily`

Bunlar, `obsidian.useOfficialCli` etkin olduğunda `PATH` üzerinde resmi `obsidian` CLI'yi gerektirir.

## Pratik kullanım kılavuzu

- Kaynak bilgisi ve sayfa kimliği önemli olduğunda `wiki search` + `wiki get` kullanın.
- Yönetilen oluşturulmuş bölümleri elle düzenlemek yerine `wiki apply` kullanın.
- Çelişkili veya düşük güvenilirlikli içeriğe güvenmeden önce `wiki lint` kullanın.
- Toplu içe aktarımlardan veya kaynak değişikliklerinden sonra panoların ve derlenmiş özetlerin hemen güncel olmasını istediğinizde `wiki compile` kullanın.
- Bir veri kataloğu, dokümantasyon dışa aktarımı veya ajan zenginleştirme işlem hattı zaten OKF markdown paketleri yayıyorsa `wiki okf import` kullanın.
- Köprü modu yeni dışa aktarılmış bellek yapıtlarına bağlı olduğunda `wiki bridge import` kullanın.

## Yapılandırma bağlantıları

`openclaw wiki` davranışı şunlar tarafından şekillendirilir:

- `plugins.entries.memory-wiki.config.vaultMode`
- `plugins.entries.memory-wiki.config.search.backend`
- `plugins.entries.memory-wiki.config.search.corpus`
- `plugins.entries.memory-wiki.config.bridge.*`
- `plugins.entries.memory-wiki.config.obsidian.*`
- `plugins.entries.memory-wiki.config.render.*`
- `plugins.entries.memory-wiki.config.context.includeCompiledDigestPrompt`

Tam yapılandırma modeli için [Memory Wiki Plugin'i](/tr/plugins/memory-wiki) bölümüne bakın.

## İlgili

- [CLI başvurusu](/tr/cli)
- [Memory wiki](/tr/plugins/memory-wiki)
