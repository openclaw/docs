---
read_when:
    - Sade MEMORY.md notlarının ötesinde kalıcı bilgi istiyorsunuz
    - Paketle birlikte gelen memory-wiki Plugin'ini yapılandırıyorsunuz
    - Tek bir Gateway'deki ajanlar için ayrı wiki kasalarına ihtiyacınız vardır
    - wiki_search, wiki_get veya köprü modunu anlamak istiyorsunuz
summary: 'memory-wiki: kaynak bilgileri, iddialar, panolar ve köprü modu içeren derlenmiş bilgi kasası'
title: Bellek vikisi
x-i18n:
    generated_at: "2026-07-12T12:00:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cf6c046bfa062b9df6deaa0753d992f9dbc45e2506d6ed4fb1a2836141a901c7
    source_path: plugins/memory-wiki.md
    workflow: 16
---

`memory-wiki`, kalıcı bilgiyi gezilebilir bir vikide derleyen, paketle birlikte gelen bir plugindir: deterministik sayfalar, kanıt içeren yapılandırılmış iddialar, kaynak geçmişi, panolar ve makine tarafından okunabilir özetler.

Active Memory plugininin yerini almaz. Hatırlama, yükseltme, indeksleme ve Dreaming, yapılandırılmış bellek arka ucu (`memory-core`, QMD, Honcho vb.) tarafından yönetilmeye devam eder. `memory-wiki` bunun yanında yer alır ve bilgiyi bakımı yapılan bir viki katmanında derler.

| Katman               | Yönettiği alanlar                                                                    |
| -------------------- | ------------------------------------------------------------------------------------ |
| Active Memory plugini | Hatırlama, anlamsal arama, yükseltme, Dreaming, bellek çalışma zamanı                 |
| `memory-wiki`        | Derlenmiş viki sayfaları, kaynak geçmişi açısından zengin sentezler, panolar, viki arama/get/apply |

Pratik kural:

- Yapılandırılmış tüm külliyatlarda tek bir geniş kapsamlı hatırlama geçişi için `memory_search`
- Vikiye özgü sıralama, kaynak geçmişi veya sayfa düzeyinde inanç yapısı istediğinizde `wiki_search` / `wiki_get`
- Active Memory plugini külliyat seçimini desteklediğinde, tek çağrıda iki katmanı da kapsamak için `memory_search corpus=all`

Yaygın bir önce yerel kurulum: hatırlama için Active Memory arka ucu olarak QMD ve kalıcı sentezlenmiş sayfalar için `bridge` modunda `memory-wiki`. [Yapılandırma](#configuration) altındaki QMD + köprü modu örneğine bakın.

Köprü modu dışa aktarılan sıfır yapıt bildiriyorsa Active Memory plugini şu anda herkese açık köprü girdileri sunmuyor demektir. Önce `openclaw wiki doctor` komutunu çalıştırın, ardından Active Memory plugininin herkese açık yapıtları desteklediğini doğrulayın.

## Kasa modları

- `isolated` (varsayılan): kendi kasası ve kaynakları vardır; Active Memory pluginine bağımlı değildir. Bunu bağımsız ve özenle düzenlenen bir bilgi deposu için kullanın.
- `bridge`: herkese açık plugin SDK bağlantı noktaları üzerinden Active Memory plugininden herkese açık bellek yapıtlarını ve olay günlüklerini okur. Bellek plugininin dışa aktardığı yapıtları, özel plugin iç bileşenlerine erişmeden derlemek için bunu kullanın.
- `unsafe-local`: yerel özel yollar için açıkça etkinleştirilen, aynı makineye yönelik bir kaçış yoludur. Bilerek deneysel ve taşınabilir değildir; yalnızca güven sınırını anladığınızda ve köprü modunun sağlayamadığı yerel dosya sistemi erişimine özellikle ihtiyaç duyduğunuzda kullanın.

Kasa modu ve kasa kapsamı birbirinden ayrı seçimlerdir:

- `vaultMode`, viki girdilerinin nereden geldiğini seçer.
- `vault.scope`, tüm ajanların tek bir kasa mı kullanacağını yoksa her ajanın bir alt kasa mı alacağını seçer.

`vault.scope: "global"` varsayılandır ve mevcut tek kasa davranışını korur. Ajanların viki sayfalarını, derlenmiş özetleri, arama sonuçlarını veya yazma işlemlerini paylaşmaması gerektiğinde `isolated` ya da `bridge` moduyla birlikte `vault.scope: "agent"` kullanın. Ajan kapsamı `unsafe-local` moduyla birleştirilemez; çünkü yapılandırılmış bu özel yollar ajanlara ait girdiler değildir. Yapılandırma doğrulaması bu birleşimi reddeder.

Köprü modu, her `bridge.*` yapılandırma anahtarına göre şunları indeksleyebilir:

- dışa aktarılan bellek yapıtları (`indexMemoryRoot`)
- günlük notlar (`indexDailyNotes`)
- Dreaming raporları (`indexDreamReports`)
- bellek olay günlükleri (`followMemoryEvents`)

Köprü modu etkinken ve `bridge.readMemoryArtifacts` etkinleştirildiğinde, `openclaw wiki status`, `openclaw wiki doctor` ve `openclaw wiki bridge
import` çalışan Gateway üzerinden yönlendirilir; böylece ajan/çalışma zamanı belleğiyle aynı Active Memory plugini bağlamını görürler. Köprü devre dışıysa veya yapıt okumaları kapalıysa bu komutlar yerel/çevrimdışı davranışlarını korur.

## Kasa düzeni

```text
<vault>/
  AGENTS.md
  WIKI.md
  index.md
  inbox.md
  entities/
  concepts/
  syntheses/
  sources/
  reports/
  _attachments/
  _views/
  .openclaw-wiki/
```

Yönetilen içerik, oluşturulan blokların içinde kalır; insan tarafından yazılan not blokları yeniden oluşturma işlemleri boyunca korunur.

- `sources/`: içe aktarılan ham malzeme ve köprü/unsafe-local destekli sayfalar
- `entities/`: kalıcı öğeler, kişiler, sistemler, projeler ve nesneler
- `concepts/`: fikirler, soyutlamalar, örüntüler ve politikalar (ayrıca OKF içe aktarımlarının hedefi)
- `syntheses/`: derlenmiş özetler ve bakımı yapılan toplu değerlendirmeler
- `reports/`: oluşturulan panolar

## Open Knowledge Format içe aktarımları

```bash
openclaw wiki okf import ./bundles/ga4
```

Paketinden çıkarılmış bir Open Knowledge Format paketini viki kavram sayfalarına aktarın. Bir veri kataloğu, dokümantasyon tarayıcısı veya zenginleştirme ajanı zaten OKF üretiyorsa uygundur: taşınabilir değişim yapıtı olarak OKF'yi koruyun ve `memory-wiki`nin bunu OpenClaw'a özgü kavram sayfalarına ve derlenmiş özetlere dönüştürmesine izin verin.

- ayrılmış olmayan `.md` dosyaları kavram belgeleridir
- içe aktarılan her kavram, frontmatter bölümünde boş olmayan bir `type` alanı gerektirir; eksik `type`, `missing-type` uyarısı oluşturur ve dosya atlanır
- bilinmeyen `type` değerleri genel kavramlar olarak kabul edilir
- `index.md` ve `log.md` ayrılmıştır ve hiçbir zaman kavram olarak içe aktarılmaz
- bozuk veya harici Markdown bağlantıları değiştirilmeden bırakılır

İçe aktarılan sayfalar `concepts/` altında düzleştirilir; böylece mevcut derleme, arama, get ve pano akışları ikinci bir viki ağacı olmadan bunları görür. Her sayfa özgün OKF kavram kimliğini, kaynak yolunu, `type`, `resource`, `tags`, zaman damgasını ve üreticinin frontmatter bölümünün tamamını korur. Dahili OKF bağlantıları oluşturulan viki kavram sayfalarına yeniden yazılır ve ayrıca `kind: okf-link` içeren yapılandırılmış `relationships` girdileri oluşturur.

## Yapılandırılmış iddialar ve kanıtlar

Sayfalar yalnızca serbest biçimli metin değil, yapılandırılmış `claims` frontmatter verileri taşır. Her iddia `id`, `text`, `status`, `confidence`, `evidence[]` ve `updatedAt` içerebilir. Her kanıt girdisi `kind`, `sourceId`, `path`, `lines`, `weight`, `confidence`, `privacyTier`, `note` ve `updatedAt` içerebilir.

Bu, vikinin pasif bir not yığını gibi değil, bir inanç katmanı gibi davranmasını sağlar. İddialar izlenebilir, puanlanabilir, itiraz edilebilir ve kaynaklara başvurularak çözümlenebilir.

## Ajana yönelik varlık meta verileri

Varlık sayfaları; kişiler, ekipler, sistemler, projeler veya diğer tüm varlık türleri için kullanılabilen genel yönlendirme meta verileri taşır:

- `entityType`: örneğin `person`, `team`, `system`, `project`
- `canonicalId`: takma adlar ve içe aktarımlar arasında kararlı kimlik anahtarı
- `aliases`: aynı sayfaya çözümlenen adlar, kullanıcı adları veya etiketler
- `privacyTier`: serbest biçimli dize; `public` inceleme gerektirmeyen olarak değerlendirilir, diğer tüm değerler (örneğin `local-private`, `sensitive`, `confirm-before-use`) `reports/privacy-review.md` içinde işaretlenir
- `bestUsedFor` / `notEnoughFor`: kısa yönlendirme ipuçları
- `lastRefreshedAt`: sayfa düzenleme zamanından ayrı kaynak yenileme zaman damgası
- `personCard`: isteğe bağlı, kişiye özgü yönlendirme kartı (kullanıcı adları, sosyal hesaplar, e-postalar, saat dilimi, çalışma alanı, başvurulacak konular, başvurulmaması gereken konular, güven düzeyi, gizlilik katmanı)
- `relationships`: ilişkili sayfalara yönelik türlendirilmiş kenarlar (hedef, tür, ağırlık, güven düzeyi, kanıt türü, gizlilik katmanı, not)

Bir kişiler vikisi için `reports/person-agent-directory.md` ile başlayın, ardından iletişim bilgilerini veya çıkarımsal olguları kullanmadan önce kişi sayfasını `wiki_get` ile açın.

<Accordion title="Varlık sayfası örneği">
```yaml
pageType: entity
entityType: person
id: entity.example-person
canonicalId: maintainer.example-person
aliases:
  - Alex
  - example-handle
privacyTier: local-private
bestUsedFor:
  - Örnek ekosistem yönlendirmesi
notEnoughFor:
  - yasal onay
lastRefreshedAt: "2026-04-29T00:00:00.000Z"
personCard:
  handles:
    - "@example-handle"
  socials:
    - "https://x.example/example-handle"
  emails:
    - alex@example.com
  timezone: America/Chicago
  lane: Örnek ekosistem
  askFor:
    - Örnek kullanıma sunma soruları
  avoidAskingFor:
    - ilgisiz faturalandırma kararları
  confidence: 0.8
  privacyTier: confirm-before-use
relationships:
  - targetId: entity.other-person
    targetTitle: Diğer Kişi
    kind: collaborates-with
    confidence: 0.7
    evidenceKind: discrawl-stat
claims:
  - id: claim.example.routing
    text: Alex, örnek ekosistem yönlendirmesi için faydalıdır.
    status: supported
    confidence: 0.9
    evidence:
      - kind: maintainer-whois
        sourceId: source.maintainers
        privacyTier: local-private
```
</Accordion>

## Derleme işlem hattı

Derleme, viki sayfalarını okur, özetleri normalleştirir ve aşağıdaki konumlarda kararlı, makineye yönelik yapıtlar oluşturur:

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

Ajanlar ve çalışma zamanı kodu, Markdown'ı ayrıştırmak yerine bu özetleri okur. Derlenmiş çıktı ayrıca arama/get için ilk geçiş viki indekslemesini, iddia kimliğinden sahibi olan sayfaya geri aramayı, kısa istem eklerini ve rapor oluşturmayı destekler.

## Panolar ve durum raporları

`render.createDashboards` etkinleştirildiğinde derleme, `reports/` altındaki panoların bakımını yapar:

| Rapor                               | İzlediği alanlar                                           |
| ----------------------------------- | ---------------------------------------------------------- |
| `reports/open-questions.md`         | çözümlenmemiş soruları bulunan sayfalar                    |
| `reports/contradictions.md`         | çelişki notu kümeleri                                      |
| `reports/low-confidence.md`         | düşük güven düzeyli sayfalar ve iddialar                    |
| `reports/claim-health.md`           | yapılandırılmış kanıtı eksik iddialar                       |
| `reports/stale-pages.md`            | güncelliğini yitirmiş veya güncelliği bilinmeyen sayfalar   |
| `reports/person-agent-directory.md` | kişi/varlık yönlendirme kartları                            |
| `reports/relationship-graph.md`     | yapılandırılmış ilişki kenarları                            |
| `reports/provenance-coverage.md`    | kanıt sınıfı kapsamı                                        |
| `reports/privacy-review.md`         | kullanım öncesi inceleme gerektiren herkese açık olmayan gizlilik katmanları |

## Arama ve getirme

İki arama arka ucu:

- `shared`: kullanılabilir olduğunda paylaşılan bellek arama akışını kullanır
- `local`: vikiyi yerel olarak arar

Üç külliyat: `wiki`, `memory`, `all`.

- `wiki_search` / `wiki_get`, mümkün olduğunda ilk geçiş olarak derlenmiş özetleri kullanır
- iddia kimlikleri, iddianın sahibi olan sayfaya geri çözümlenir
- itiraz edilmiş/güncelliğini yitirmiş/güncel iddialar sıralamayı etkiler
- kaynak geçmişi etiketleri sonuçlarda korunur

Arama modları (`--mode` / aracın `mode` parametresi):

| Mod               | Öne çıkardıkları                                                 |
| ----------------- | ---------------------------------------------------------------- |
| `auto`            | dengeli varsayılan                                               |
| `find-person`     | kişi benzeri varlıklar, takma adlar, kullanıcı adları, sosyal hesaplar, kanonik kimlikler |
| `route-question`  | ajan kartları, başvurulacak/en uygun kullanım alanı ipuçları, ilişki bağlamı |
| `source-evidence` | kaynak sayfaları ve yapılandırılmış kanıt meta verileri           |
| `raw-claim`       | eşleşen yapılandırılmış iddialar; iddia/kanıt meta verilerini döndürür |

Bir sonuç yapılandırılmış bir iddiayla eşleştiğinde `wiki_search`, ayrıntılar yükünde `matchedClaimId`, `matchedClaimStatus`, `matchedClaimConfidence`, `evidenceKinds` ve `evidenceSourceIds` döndürür. Metin çıktısı, kullanılabilir olduğunda kısa `Claim:` ve `Evidence:` satırlarını içerir.

## Ajan araçları

| Araç          | Amaç                                                                                                                                                                              |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `wiki_status` | geçerli kasa modu ve kapsamı, çözümlenen aracı, sistem durumu, Obsidian CLI kullanılabilirliği                                                                                    |
| `wiki_search` | wiki sayfalarında ve yapılandırıldığında paylaşılan bellek külliyatında arama yapar; kişi arama, soru yönlendirme, kaynak kanıtı veya ham iddia ayrıntılandırması için `mode` kabul eder |
| `wiki_get`    | bir wiki sayfasını kimliğe/yola göre okur; paylaşılan arama etkinse ve arama sonuç vermezse paylaşılan bellek külliyatına başvurur                                                 |
| `wiki_apply`  | serbest biçimli sayfa düzenlemesi olmadan dar kapsamlı sentez/meta veri değişiklikleri yapar                                                                                       |
| `wiki_lint`   | yapısal denetimler, kaynak kökeni eksiklikleri, çelişkiler, açık sorular                                                                                                           |

Plugin ayrıca dışlayıcı olmayan bir bellek külliyatı ek kaynağı kaydeder; böylece etkin bellek
Plugin'i külliyat seçimini desteklediğinde paylaşılan `memory_search` ve
`memory_get` wiki'ye erişebilir.

## İstem ve bağlam davranışı

`context.includeCompiledDigestPrompt` etkinleştirildiğinde bellek istemi bölümlerine
`agent-digest.json` dosyasından derlenmiş kompakt bir anlık görüntü eklenir: yalnızca
en önemli sayfalar, yalnızca en önemli iddialar, çelişki sayısı, soru sayısı ve güven/güncellik
niteleyicileri. İstem yapısını değiştirdiği için bu özellik isteğe bağlıdır; esas olarak
bellek eklerini açıkça kullanan bağlam motorları veya istem oluşturma süreçleri
için önemlidir.

## Yapılandırma

Yapılandırmayı `plugins.entries.memory-wiki.config` altına yerleştirin:

```json5
{
  plugins: {
    entries: {
      "memory-wiki": {
        enabled: true,
        config: {
          vaultMode: "isolated",
          vault: {
            scope: "global",
            path: "~/.openclaw/wiki/main",
            renderMode: "obsidian",
          },
          obsidian: {
            enabled: true,
            useOfficialCli: true,
            vaultName: "OpenClaw Wiki",
            openAfterWrites: false,
          },
          bridge: {
            enabled: false,
            readMemoryArtifacts: true,
            indexDreamReports: true,
            indexDailyNotes: true,
            indexMemoryRoot: true,
            followMemoryEvents: true,
          },
          unsafeLocal: {
            allowPrivateMemoryCoreAccess: false,
            paths: [],
          },
          ingest: {
            autoCompile: true,
            maxConcurrentJobs: 1,
            allowUrlIngest: true,
          },
          search: {
            backend: "shared",
            corpus: "wiki",
          },
          context: {
            includeCompiledDigestPrompt: false,
          },
          render: {
            preserveHumanBlocks: true,
            createBacklinks: true,
            createDashboards: true,
          },
        },
      },
    },
  },
}
```

Temel anahtarlar:

| Anahtar                                    | Değerler / varsayılan                           | Notlar                                                                                       |
| ------------------------------------------ | ----------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `vaultMode`                                | `isolated` (varsayılan), `bridge`, `unsafe-local` | girdi ve entegrasyon davranışını seçer                                                       |
| `vault.scope`                              | `global` (varsayılan), `agent`                  | tek bir paylaşılan kasa veya aracı başına bir alt kasa                                       |
| `vault.path`                               | genel varsayılan `~/.openclaw/wiki/main`        | genel kapsamda tam kasa yolu; aracı kapsamındaki üst dizin varsayılan olarak `~/.openclaw/wiki` |
| `vault.renderMode`                         | `native` (varsayılan), `obsidian`               |                                                                                              |
| `bridge.readMemoryArtifacts`               | varsayılan `true`                               | etkin bellek Plugin'inin herkese açık yapıtlarını içe aktarır                                |
| `bridge.followMemoryEvents`                | varsayılan `true`                               | köprü moduna olay günlüklerini dahil eder                                                    |
| `unsafeLocal.allowPrivateMemoryCoreAccess` | varsayılan `false`                              | `unsafe-local` içe aktarımlarını çalıştırmak için gereklidir                                 |
| `unsafeLocal.paths`                        | varsayılan `[]`                                 | `unsafe-local` modunda içe aktarılacak açıkça belirtilmiş yerel yollar                       |
| `search.backend`                           | `shared` (varsayılan), `local`                  |                                                                                              |
| `search.corpus`                            | `wiki` (varsayılan), `memory`, `all`            |                                                                                              |
| `context.includeCompiledDigestPrompt`      | varsayılan `false`                              | seçilen aracının kompakt özet anlık görüntüsünü bellek istemi bölümlerine ekler              |
| `render.createBacklinks`                   | varsayılan `true`                               | belirlenimci ilişkili bloklar oluşturur                                                      |
| `render.createDashboards`                  | varsayılan `true`                               | gösterge paneli sayfaları oluşturur                                                          |

### Aracı başına kasalar

Yapılandırılmış her aracıya ayrı bir wiki vermek için `vault.scope` değerini
`agent` olarak ayarlayın. Bu kapsamda `vault.path` bir üst dizindir ve OpenClaw,
normalleştirilmiş aracı kimliğini sona ekler:

```json5
{
  agents: {
    list: [{ id: "support" }, { id: "marketing" }],
  },
  plugins: {
    entries: {
      "memory-wiki": {
        enabled: true,
        config: {
          vaultMode: "bridge",
          vault: {
            scope: "agent",
            path: "~/.openclaw/wiki",
          },
          bridge: {
            enabled: true,
            readMemoryArtifacts: true,
          },
        },
      },
    },
  },
}
```

Bu yapılandırma `~/.openclaw/wiki/support` ve
`~/.openclaw/wiki/marketing` yollarına çözümlenir. Aracı kapsamında `vault.path`
atlanırsa üst dizin varsayılan olarak `~/.openclaw/wiki` olur. Bu nedenle varsayılan
`main` aracısı mevcut `~/.openclaw/wiki/main` yolunu korur.

Aracı araçları, derlenmiş istem özetleri ve `memory_search` / `memory_get`
üzerinden sunulan wiki eki, kasayı etkin aracı bağlamından çözümler.
Birden fazla yapılandırılmış aracının bulunduğu bir kurulumdaki CLI ve Gateway
çağrılarında aracıyı `openclaw wiki --agent <agentId> ...` ile veya Gateway
isteğinin `agentId` değeriyle açıkça belirtin. Yalnızca bir aracı yapılandırılmışsa
kimlik belirtilmediğinde varsayılan olarak o kullanılır.

Köprü modunda aracı kapsamındaki içe aktarımlar, herkese açık bir bellek yapıtını
yalnızca `agentIds` alanı seçilen aracıyı içeriyorsa kabul eder. Başka bir aracıya
ait olan, sahiplik meta verisi bulunmayan veya sahibi bilinmeyen yapıtlar atlanır.
Genel kapsam mevcut paylaşılan yapıt davranışını korur.

<Warning>
`vault.scope` değerini değiştirmek mevcut bir kasayı kopyalamaz veya bölmez. Aracı
kapsamında açıkça yapılandırılmış bir `vault.path` üst dizine dönüşür; bu nedenle
üretim aracılarını değiştirmeden önce mevcut sayfaları bilinçli olarak taşıyın veya
içe aktarın. Önce kasayı yedekleyin.

Aracı başına kasalar aynı süreç içindeki bir bilgi sınırıdır; işletim sistemi
güvenlik sınırı değildir. Ana makinenin dosya sistemine erişebilen Plugin'ler ve
korumalı alan dışında çalışan araçlar başka bir aracının dizinini yine de okuyabilir.
Aracılar birbirine güvenmiyorsa [korumalı alan kullanımını](/tr/gateway/sandboxing)
veya [ayrı Gateway profillerini](/tr/gateway/multiple-gateways) kullanın.
</Warning>

### Örnek: QMD + köprü modu

Hatırlama için QMD, sürdürülen bir bilgi katmanı için ise `memory-wiki`
kullanmak istediğinizde bunu kullanın. Her katman kendi odağını korur: QMD ham
notları, oturum dışa aktarımlarını ve ek koleksiyonları aranabilir tutarken
`memory-wiki` kararlı varlıkları, iddiaları, gösterge panellerini ve kaynak
sayfalarını derler.

```json5
{
  memory: {
    backend: "qmd",
  },
  plugins: {
    entries: {
      "memory-wiki": {
        enabled: true,
        config: {
          vaultMode: "bridge",
          bridge: {
            enabled: true,
            readMemoryArtifacts: true,
            indexDreamReports: true,
            indexDailyNotes: true,
            indexMemoryRoot: true,
            followMemoryEvents: true,
          },
          search: {
            backend: "shared",
            corpus: "all",
          },
          context: {
            includeCompiledDigestPrompt: false,
          },
        },
      },
    },
  },
}
```

Bu yapılandırma, etkin bellek hatırlamasının yönetimini QMD'de tutar,
`memory-wiki` bileşenini derlenmiş sayfalara ve gösterge panellerine odaklar;
derlenmiş özet istemlerini bilinçli olarak etkinleştirene kadar istem yapısını
değiştirmez.

## CLI

```bash
openclaw wiki status
openclaw wiki doctor
openclaw wiki init
openclaw wiki ingest ./notes/alpha.md
openclaw wiki compile
openclaw wiki lint
openclaw wiki search "alpha"
openclaw wiki get entity.alpha
openclaw wiki apply synthesis "Alpha Summary" --body "..." --source-id source.alpha
openclaw wiki bridge import
openclaw wiki obsidian status
```

`wiki okf import`, `wiki apply metadata`, `wiki unsafe-local import`,
`wiki chatgpt import` / `wiki chatgpt rollback` ve eksiksiz `wiki obsidian`
alt komut kümesini içeren tam komut başvurusu için [CLI: wiki](/tr/cli/wiki)
sayfasına bakın.

## Obsidian desteği

`vault.renderMode` değeri `obsidian` olduğunda Plugin, Obsidian ile uyumlu
Markdown yazar ve isteğe bağlı olarak durum denetimi, kasa araması, sayfa açma,
komut çağırma ve günlük nota geçiş için resmî `obsidian` CLI'ını kullanabilir.
Bu isteğe bağlıdır; wiki, Obsidian olmadan da yerel modda çalışır.

Aracı kapsamındaki kasalar Obsidian ile uyumlu Markdown kullanmaya devam edebilir,
ancak yapılandırma doğrulaması `vault.scope: "agent"` ile birlikte
`obsidian.useOfficialCli: true` kullanımını reddeder. Geçerli
`obsidian.vaultName` ayarı geneldir ve her aracı için ayrı bir Obsidian kasası
seçemez. Bunun yerine wiki araçlarını ve CLI işlemlerini kullanın veya Obsidian
tarafından işletilen wiki'yi genel kapsamda tutun.

## Önerilen iş akışı

<Steps>
<Step title="Hatırlama için etkin bellek Plugin'ini kullanmayı sürdürün">
Hatırlama, yükseltme ve Dreaming yapılandırılmış bellek arka ucu tarafından yönetilmeye devam eder.
</Step>
<Step title="memory-wiki'yi etkinleştirin">
Köprü modunu açıkça istemiyorsanız `isolated` moduyla başlayın.
</Step>
<Step title="Kaynak kökeni önemli olduğunda wiki_search / wiki_get kullanın">
Wiki'ye özgü sıralama veya sayfa düzeyinde inanç yapısı istediğinizde bunları `memory_search` yerine tercih edin.
</Step>
<Step title="Dar kapsamlı sentezler veya meta veri güncellemeleri için wiki_apply kullanın">
Yönetilen oluşturulmuş blokları elle düzenlemekten kaçının.
</Step>
<Step title="Anlamlı değişikliklerden sonra wiki_lint çalıştırın">
Çelişkileri, açık soruları ve kaynak kökeni eksikliklerini yakalar.
</Step>
<Step title="Eskiyen bilgileri ve çelişkileri görünür kılmak için gösterge panellerini açın">
`render.createDashboards: true` olarak ayarlayın (varsayılan).
</Step>
</Steps>

## İlgili belgeler

- [Belleğe Genel Bakış](/tr/concepts/memory)
- [CLI: bellek](/tr/cli/memory)
- [CLI: wiki](/tr/cli/wiki)
- [Plugin SDK'ya genel bakış](/tr/plugins/sdk-overview)
