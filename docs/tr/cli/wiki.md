---
read_when:
    - memory-wiki CLI'sini kullanmak istiyorsunuz
    - '`openclaw wiki` öğesini belgeliyor veya değiştiriyorsunuz'
summary: '`openclaw wiki` için CLI referansı (memory-wiki kasası durumu, arama, derleme, lint denetimi, uygulama, köprü ve Obsidian yardımcıları)'
title: Viki
x-i18n:
    generated_at: "2026-04-30T09:15:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 67fe56c9bff7b24570f890733314857dd261fca8233051681a83c171656ff27d
    source_path: cli/wiki.md
    workflow: 16
---

# `openclaw wiki`

`memory-wiki` kasasını inceleyin ve bakımını yapın.

Paketle birlikte gelen `memory-wiki` Plugin'i tarafından sağlanır.

İlgili:

- [Memory Wiki Plugin'i](/tr/plugins/memory-wiki)
- [Belleğe Genel Bakış](/tr/concepts/memory)
- [CLI: bellek](/tr/cli/memory)

## Ne için kullanılır

Aşağıdakilere sahip derlenmiş bir bilgi kasası istediğinizde `openclaw wiki` kullanın:

- wiki'ye özgü arama ve sayfa okumaları
- kaynak bakımından zengin sentezler
- çelişki ve güncellik raporları
- active memory Plugin'inden köprü içe aktarımları
- isteğe bağlı Obsidian CLI yardımcıları

## Yaygın komutlar

```bash
openclaw wiki status
openclaw wiki doctor
openclaw wiki init
openclaw wiki ingest ./notes/alpha.md
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

Geçerli kasa modunu, durumunu ve Obsidian CLI kullanılabilirliğini inceleyin.

Kasanın başlatılıp başlatılmadığından, köprü modunun sağlıklı olup olmadığından
veya Obsidian entegrasyonunun kullanılabilir olup olmadığından emin değilseniz
önce bunu kullanın.

Köprü modu etkin olduğunda ve bellek yapıtlarını okuyacak şekilde
yapılandırıldığında, bu komut çalışan Gateway'i sorgular; böylece agent/runtime
belleğiyle aynı active memory Plugin bağlamını görür.

### `wiki doctor`

Wiki durum kontrollerini çalıştırın ve yapılandırma ya da kasa sorunlarını gösterin.

Köprü modu etkin olduğunda ve bellek yapıtlarını okuyacak şekilde
yapılandırıldığında, bu komut raporu oluşturmadan önce çalışan Gateway'i
sorgular. Devre dışı köprü içe aktarımları ve bellek yapıtlarını okumayan köprü
yapılandırmaları yerel/çevrimdışı kalır.

Tipik sorunlar şunları içerir:

- herkese açık bellek yapıtları olmadan köprü modunun etkinleştirilmesi
- geçersiz veya eksik kasa düzeni
- Obsidian modu beklendiğinde harici Obsidian CLI'nin eksik olması

### `wiki init`

Wiki kasası düzenini ve başlangıç sayfalarını oluşturun.

Bu, üst düzey dizinler ve önbellek dizinleri dahil olmak üzere kök yapıyı başlatır.

### `wiki ingest <path-or-url>`

İçeriği wiki kaynak katmanına içe aktarın.

Notlar:

- URL içe aktarımı `ingest.allowUrlIngest` tarafından denetlenir
- içe aktarılan kaynak sayfaları kaynak bilgisini frontmatter içinde tutar
- etkinleştirildiğinde içe aktarımdan sonra otomatik derleme çalışabilir

### `wiki compile`

Dizinleri, ilişkili blokları, panoları ve derlenmiş özetleri yeniden oluşturun.

Bu, aşağıdaki konumlara kararlı makineye yönelik yapıtlar yazar:

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

`render.createDashboards` etkinse derleme, rapor sayfalarını da yeniler.

### `wiki lint`

Kasayı lint edin ve şunları raporlayın:

- yapısal sorunlar
- kaynak boşlukları
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

Wiki'ye özgü sıralama veya kaynak ayrıntıları istediğinizde `wiki search`
kullanın. Tek bir geniş ortak hatırlama geçişi için, active memory Plugin'i
ortak arama sunuyorsa `openclaw memory search` tercih edin.

Arama modları agent'ın doğru yüzeyi seçmesine yardımcı olur:

- `find-person`: takma adlar, kullanıcı adları, sosyal hesaplar, kanonik kimlikler ve kişi sayfaları
- `route-question`: kime sorulacağı/en iyi ne için kullanılacağı ipuçları ve ilişki bağlamı
- `source-evidence`: kaynak sayfaları ve yapılandırılmış kanıt alanları
- `raw-claim`: iddia/kanıt meta verileriyle yapılandırılmış iddia metni

Örnekler:

```bash
openclaw wiki search "bgroux" --mode find-person
openclaw wiki search "who knows Teams rollout?" --mode route-question
openclaw wiki search "maintainer-whois" --mode source-evidence
openclaw wiki search "strong route Teams" --mode raw-claim --json
```

Bir sonuç yapılandırılmış bir iddiayla eşleştiğinde metin çıktısı `Claim:` ve
`Evidence:` satırlarını içerir. JSON çıktısı ayrıca agent tarafında ayrıntıya
inmek için `matchedClaimId`, `matchedClaimStatus`, `matchedClaimConfidence`,
`evidenceKinds` ve `evidenceSourceIds` alanlarını sunar.

### `wiki get <lookup>`

Bir wiki sayfasını kimliğe veya göreli yola göre okuyun.

Örnekler:

```bash
openclaw wiki get entity.alpha
openclaw wiki get syntheses/alpha-summary.md --from 1 --lines 80
```

### `wiki apply`

Serbest biçimli sayfa müdahalesi olmadan dar kapsamlı değişiklikler uygulayın.

Desteklenen akışlar şunları içerir:

- bir sentez sayfası oluşturma/güncelleme
- sayfa meta verilerini güncelleme
- kaynak kimlikleri ekleme
- sorular ekleme
- çelişkiler ekleme
- güvenilirlik/durum güncelleme
- yapılandırılmış iddialar yazma

Bu komut, yönetilen blokları elle düzenlemeden wiki'nin güvenli şekilde
gelişebilmesi için vardır.

### `wiki bridge import`

Active memory Plugin'inden herkese açık bellek yapıtlarını köprü destekli kaynak
sayfalarına içe aktarın.

En son dışa aktarılmış bellek yapıtlarının wiki kasasına çekilmesini
istediğinizde bunu `bridge` modunda kullanın.

Etkin köprü yapıt okumaları için CLI, içe aktarımı Gateway RPC üzerinden
yönlendirir; böylece içe aktarma runtime bellek Plugin bağlamını kullanır. Köprü
içe aktarımları devre dışıysa veya yapıt okumaları kapatılmışsa komut
yerel/çevrimdışı sıfır içe aktarım davranışını korur.

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

Bunlar, `obsidian.useOfficialCli` etkin olduğunda `PATH` üzerinde resmi
`obsidian` CLI'yi gerektirir.

## Pratik kullanım kılavuzu

- Kaynak ve sayfa kimliği önemli olduğunda `wiki search` + `wiki get` kullanın.
- Yönetilen oluşturulmuş bölümleri elle düzenlemek yerine `wiki apply` kullanın.
- Çelişkili veya düşük güvenilirlikli içeriğe güvenmeden önce `wiki lint` kullanın.
- Toplu içe aktarımlardan veya kaynak değişikliklerinden sonra panoların ve
  derlenmiş özetlerin hemen güncel olmasını istediğinizde `wiki compile` kullanın.
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

Tam yapılandırma modeli için [Memory Wiki Plugin'i](/tr/plugins/memory-wiki) sayfasına bakın.

## İlgili

- [CLI referansı](/tr/cli)
- [Memory wiki](/tr/plugins/memory-wiki)
