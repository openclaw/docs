---
read_when:
    - memory-wiki CLI'yi kullanmak istiyorsunuz
    - '`openclaw wiki` öğesini belgeliyor veya değiştiriyorsunuz'
summary: '`openclaw wiki` için CLI başvurusu (memory-wiki kasası durumu, arama, derleme, lint, apply, bridge ve Obsidian yardımcıları)'
title: Wiki
x-i18n:
    generated_at: "2026-04-24T09:04:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: c25f7046ef0c29ed74204a5349edc2aa20ce79a355f49211a0ba0df4a5e4db3a
    source_path: cli/wiki.md
    workflow: 15
---

# `openclaw wiki`

`memory-wiki` kasasını inceleyin ve bakımını yapın.

Paketlenmiş `memory-wiki` Plugin'i tarafından sağlanır.

İlgili:

- [Memory Wiki Plugin'i](/tr/plugins/memory-wiki)
- [Belleğe Genel Bakış](/tr/concepts/memory)
- [CLI: bellek](/tr/cli/memory)

## Ne için kullanılır

Aşağıdakilere sahip derlenmiş bir bilgi kasası istediğinizde `openclaw wiki` kullanın:

- wiki-yerel arama ve sayfa okuma
- kaynak bilgisi zengin sentezler
- çelişki ve güncellik raporları
- etkin bellek Plugin'inden köprü içe aktarımları
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

Kasanın başlatılıp başlatılmadığından, köprü modunun
sağlıklı olup olmadığından veya Obsidian entegrasyonunun kullanılabilir olup olmadığından emin değilseniz önce bunu kullanın.

### `wiki doctor`

Wiki sağlık denetimlerini çalıştırın ve yapılandırma veya kasa sorunlarını ortaya çıkarın.

Tipik sorunlar şunları içerir:

- genel bellek yapıtları olmadan etkin köprü modu
- geçersiz veya eksik kasa düzeni
- Obsidian modu beklenirken harici Obsidian CLI'nın eksik olması

### `wiki init`

Wiki kasa düzenini ve başlangıç sayfalarını oluşturun.

Bu, üst düzey dizinler ve önbellek
dizinleri dahil kök yapıyı başlatır.

### `wiki ingest <path-or-url>`

İçeriği wiki kaynak katmanına içe aktarın.

Notlar:

- URL içe aktarma `ingest.allowUrlIngest` tarafından kontrol edilir
- içe aktarılan kaynak sayfalar frontmatter içinde kaynak bilgisini korur
- etkinse, içe aktarmadan sonra otomatik derleme çalışabilir

### `wiki compile`

Dizinleri, ilgili blokları, panoları ve derlenmiş özetleri yeniden oluşturun.

Bu, şu konumlarda kararlı makineye dönük yapıtlar yazar:

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

`render.createDashboards` etkinse, derleme ayrıca rapor sayfalarını da yeniler.

### `wiki lint`

Kasayı lint edin ve şunları raporlayın:

- yapısal sorunlar
- kaynak bilgisi boşlukları
- çelişkiler
- açık sorular
- düşük güvenli sayfalar/iddialar
- eski sayfalar/iddialar

Anlamlı wiki güncellemelerinden sonra bunu çalıştırın.

### `wiki search <query>`

Wiki içeriğinde arama yapın.

Davranış yapılandırmaya bağlıdır:

- `search.backend`: `shared` veya `local`
- `search.corpus`: `wiki`, `memory` veya `all`

Wiki'ye özgü sıralama veya kaynak bilgisi ayrıntıları istediğinizde `wiki search` kullanın.
Tek ve geniş bir paylaşımlı geri çağırma geçişi için, etkin
bellek Plugin'i paylaşımlı aramayı sunuyorsa `openclaw memory search` tercih edin.

### `wiki get <lookup>`

Bir wiki sayfasını kimlik veya göreli yol ile okuyun.

Örnekler:

```bash
openclaw wiki get entity.alpha
openclaw wiki get syntheses/alpha-summary.md --from 1 --lines 80
```

### `wiki apply`

Serbest biçimli sayfa cerrahisi olmadan dar kapsamlı değişiklikler uygulayın.

Desteklenen akışlar şunları içerir:

- sentez sayfası oluşturma/güncelleme
- sayfa meta verisini güncelleme
- kaynak kimlikleri ekleme
- sorular ekleme
- çelişkiler ekleme
- güven/durum güncelleme
- yapılandırılmış iddialar yazma

Bu komut, wiki'nin yönetilen blokları elle düzenlemeden
güvenle gelişebilmesi için vardır.

### `wiki bridge import`

Etkin bellek Plugin'inden gelen genel bellek yapıtlarını köprü destekli
kaynak sayfalara içe aktarın.

En son dışa aktarılmış bellek yapıtlarının
wiki kasasına çekilmesini istediğinizde bunu `bridge` modunda kullanın.

### `wiki unsafe-local import`

`unsafe-local` modunda açıkça yapılandırılmış yerel yollardan içe aktarın.

Bu bilinçli olarak deneyseldir ve yalnızca aynı makine içindir.

### `wiki obsidian ...`

Obsidian dostu modda çalışan kasalar için Obsidian yardımcı komutları.

Alt komutlar:

- `status`
- `search`
- `open`
- `command`
- `daily`

`obsidian.useOfficialCli` etkin olduğunda bunlar `PATH` içinde resmi `obsidian` CLI gerektirir.

## Pratik kullanım rehberi

- Kaynak bilgisi ve sayfa kimliği önemliyse `wiki search` + `wiki get` kullanın.
- Yönetilen üretilmiş bölümleri elle düzenlemek yerine `wiki apply` kullanın.
- Çelişkili veya düşük güvenli içeriğe güvenmeden önce `wiki lint` kullanın.
- Toplu içe aktarımlardan veya kaynak değişikliklerinden sonra, yeni panolar ve derlenmiş özetleri hemen istiyorsanız `wiki compile` kullanın.
- Köprü modu yeni dışa aktarılmış bellek yapıtlarına bağlıysa `wiki bridge import` kullanın.

## Yapılandırma bağlantıları

`openclaw wiki` davranışı şunlarla şekillenir:

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
