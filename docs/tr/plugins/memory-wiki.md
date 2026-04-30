---
read_when:
    - Basit MEMORY.md notlarının ötesinde kalıcı bilgi istiyorsunuz
    - Birlikte gelen memory-wiki Plugin'i yapılandırıyorsunuz
    - wiki_search, wiki_get veya köprü modunu anlamak istiyorsunuz
summary: 'memory-wiki: köken bilgisi, iddialar, panolar ve köprü modu içeren derlenmiş bilgi kasası'
title: Bellek vikisi
x-i18n:
    generated_at: "2026-04-30T09:35:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 744d569f8b0c9b668ea54dc057f808544359eaae87d5557de2e6acd1b31acd89
    source_path: plugins/memory-wiki.md
    workflow: 16
---

`memory-wiki`, kalıcı belleği derlenmiş bir bilgi kasasına dönüştüren paketlenmiş bir Plugin'dir.

Aktif bellek Plugin'inin yerini **almaz**. Aktif bellek Plugin'i hâlâ
geri çağırma, yükseltme, indeksleme ve dreaming işlemlerinden sorumludur. `memory-wiki` onun yanında
durur ve kalıcı bilgiyi deterministik sayfalara, yapılandırılmış iddialara,
köken bilgisine, panolara ve makine tarafından okunabilir özetlere sahip gezilebilir bir wikiye derler.

Belleğin bir Markdown dosyaları yığınından çok, bakımı yapılan bir bilgi katmanı gibi
davranmasını istediğinizde bunu kullanın.

## Neler ekler

- Deterministik sayfa düzenine sahip özel bir wiki kasası
- Yalnızca düz metin değil, yapılandırılmış iddia ve kanıt meta verisi
- Sayfa düzeyinde köken bilgisi, güven, çelişkiler ve açık sorular
- Aracı/çalışma zamanı tüketicileri için derlenmiş özetler
- Wiki'ye özgü search/get/apply/lint araçları
- Aktif bellek Plugin'inden herkese açık yapıları içe aktaran isteğe bağlı köprü modu
- İsteğe bağlı Obsidian dostu render modu ve CLI entegrasyonu

## Bellekle nasıl uyum sağlar

Ayrımı şöyle düşünebilirsiniz:

| Katman                                                  | Sorumluluk                                                                                 |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Aktif bellek Plugin'i (`memory-core`, QMD, Honcho, vb.) | Geri çağırma, semantik arama, yükseltme, dreaming, bellek çalışma zamanı                   |
| `memory-wiki`                                           | Derlenmiş wiki sayfaları, köken bilgisi zengin sentezler, panolar, wiki'ye özgü search/get/apply |

Aktif bellek Plugin'i paylaşılan geri çağırma yapılarını açığa çıkarırsa, OpenClaw
`memory_search corpus=all` ile her iki katmanda tek geçişte arama yapabilir.

Wiki'ye özgü sıralama, köken bilgisi veya doğrudan sayfa erişimi gerektiğinde bunun yerine
wiki'ye özgü araçları kullanın.

## Önerilen hibrit desen

Yerel öncelikli kurulumlar için güçlü bir varsayılan şudur:

- Geri çağırma ve geniş semantik arama için aktif bellek arka ucu olarak QMD
- Kalıcı sentezlenmiş bilgi sayfaları için `bridge` modunda `memory-wiki`

Bu ayrım iyi çalışır çünkü her katman odağını korur:

- QMD, ham notları, oturum dışa aktarımlarını ve ek koleksiyonları aranabilir tutar
- `memory-wiki`, kararlı varlıkları, iddiaları, panoları ve kaynak sayfaları derler

Pratik kural:

- bellek genelinde tek bir geniş geri çağırma geçişi istediğinizde `memory_search` kullanın
- köken bilgisine duyarlı wiki sonuçları istediğinizde `wiki_search` ve `wiki_get` kullanın
- paylaşılan aramanın her iki katmanı da kapsamasını istediğinizde `memory_search corpus=all` kullanın

Köprü modu sıfır dışa aktarılmış yapı bildirirse, aktif bellek Plugin'i
şu anda herkese açık köprü girdilerini henüz açığa çıkarmıyordur. Önce `openclaw wiki doctor` çalıştırın,
ardından aktif bellek Plugin'inin herkese açık yapıları desteklediğini doğrulayın.

Köprü modu aktifken ve `bridge.readMemoryArtifacts` etkinleştirildiğinde,
`openclaw wiki status`, `openclaw wiki doctor` ve `openclaw wiki bridge
import` çalışan Gateway üzerinden okur. Bu, CLI köprü kontrollerini
çalışma zamanı bellek Plugin'i bağlamıyla hizalı tutar. Köprü devre dışıysa veya yapı okumaları
kapatılmışsa, bu komutlar yerel/çevrimdışı davranışlarını korur.

## Kasa modları

`memory-wiki` üç kasa modunu destekler:

### `isolated`

Kendi kasası, kendi kaynakları, `memory-core` bağımlılığı yok.

Wiki'nin kendi seçilmiş bilgi deposu olmasını istediğinizde bunu kullanın.

### `bridge`

Aktif bellek Plugin'inden herkese açık bellek yapılarını ve bellek olaylarını
herkese açık Plugin SDK sınırları üzerinden okur.

Wiki'nin, özel Plugin iç yapılarına erişmeden bellek Plugin'inin
dışa aktarılmış yapılarını derleyip düzenlemesini istediğinizde bunu kullanın.

Köprü modu şunları indeksleyebilir:

- dışa aktarılmış bellek yapıları
- dream raporları
- günlük notlar
- bellek kök dosyaları
- bellek olay günlükleri

### `unsafe-local`

Yerel özel yollar için açık aynı makine kaçış kapısı.

Bu mod özellikle deneysel ve taşınabilir değildir. Yalnızca güven sınırını
anladığınızda ve köprü modunun sağlayamadığı yerel dosya sistemi erişimine
özellikle ihtiyaç duyduğunuzda kullanın.

## Kasa düzeni

Plugin, kasayı şöyle başlatır:

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

Yönetilen içerik, oluşturulmuş blokların içinde kalır. İnsan notu blokları korunur.

Ana sayfa grupları şunlardır:

- içe aktarılmış ham materyal ve köprü destekli sayfalar için `sources/`
- kalıcı şeyler, kişiler, sistemler, projeler ve nesneler için `entities/`
- fikirler, soyutlamalar, desenler ve politikalar için `concepts/`
- derlenmiş özetler ve bakımı yapılan toplu görünümler için `syntheses/`
- oluşturulmuş panolar için `reports/`

## Yapılandırılmış iddialar ve kanıt

Sayfalar yalnızca serbest biçimli metin değil, yapılandırılmış `claims` frontmatter'ı taşıyabilir.

Her iddia şunları içerebilir:

- `id`
- `text`
- `status`
- `confidence`
- `evidence[]`
- `updatedAt`

Kanıt girdileri şunları içerebilir:

- `kind`
- `sourceId`
- `path`
- `lines`
- `weight`
- `confidence`
- `privacyTier`
- `note`
- `updatedAt`

Wiki'nin pasif bir not dökümünden çok bir inanç katmanı gibi davranmasını sağlayan şey budur.
İddialar izlenebilir, puanlanabilir, tartışılabilir ve kaynaklara geri bağlanarak çözümlenebilir.

## Aracıya yönelik varlık meta verisi

Varlık sayfaları, aracı kullanımı için yönlendirme meta verisi de taşıyabilir. Bu genel
frontmatter'dır, bu yüzden kişiler, ekipler, sistemler, projeler veya başka herhangi bir
varlık türü için çalışır.

Yaygın alanlar şunları içerir:

- `entityType`: örneğin `person`, `team`, `system` veya `project`
- `canonicalId`: takma adlar ve içe aktarımlar genelinde kullanılan kararlı kimlik anahtarı
- `aliases`: aynı sayfaya çözümlenmesi gereken adlar, kullanıcı adları veya etiketler
- `privacyTier`: `public`, `local-private`, `sensitive` veya `confirm-before-use`
- `bestUsedFor` / `notEnoughFor`: kompakt yönlendirme ipuçları
- `lastRefreshedAt`: sayfa düzenleme zamanından ayrı kaynak yenileme zaman damgası
- `personCard`: kullanıcı adları, sosyal profiller,
  e-postalar, saat dilimi, kulvar, sorulacak konular, sorulmaması gerekenler, güven ve gizlilik içeren isteğe bağlı kişiye özgü yönlendirme kartı
- `relationships`: hedef, tür, ağırlık,
  güven, kanıt türü, gizlilik katmanı ve not içeren ilgili sayfalara tipli kenarlar

Bir kişiler wikisi için aracı genellikle
`reports/person-agent-directory.md` ile başlamalı, ardından kişi ayrıntılarını veya çıkarımsal gerçekleri kullanmadan önce
`wiki_get` ile kişi sayfasını açmalıdır.

Örnek:

```yaml
pageType: entity
entityType: person
id: entity.brad-groux
canonicalId: maintainer.brad-groux
aliases:
  - Brad
  - bgroux
privacyTier: local-private
bestUsedFor:
  - Microsoft Teams and Azure routing
notEnoughFor:
  - legal approval
lastRefreshedAt: "2026-04-29T00:00:00.000Z"
personCard:
  handles:
    - "@bgroux"
  socials:
    - "https://x.example/bgroux"
  emails:
    - brad@example.com
  timezone: America/Chicago
  lane: Microsoft ecosystem
  askFor:
    - Teams rollout questions
  avoidAskingFor:
    - unrelated billing decisions
  confidence: 0.8
  privacyTier: confirm-before-use
relationships:
  - targetId: entity.alice
    targetTitle: Alice
    kind: collaborates-with
    confidence: 0.7
    evidenceKind: discrawl-stat
claims:
  - id: claim.brad.teams
    text: Brad is useful for Microsoft Teams routing.
    status: supported
    confidence: 0.9
    evidence:
      - kind: maintainer-whois
        sourceId: source.maintainers
        privacyTier: local-private
```

## Derleme hattı

Derleme adımı wiki sayfalarını okur, özetleri normalleştirir ve kararlı
makineye yönelik yapıları şuraya yazar:

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

Bu özetler, aracıların ve çalışma zamanı kodunun Markdown sayfalarını kazımasını gerektirmemek için vardır.

Derlenmiş çıktı ayrıca şunları destekler:

- search/get akışları için ilk geçiş wiki indekslemesi
- iddia kimliği aramasından sahip sayfalara geri bağlanma
- kompakt istem ekleri
- rapor/pano oluşturma

## Panolar ve sağlık raporları

`render.createDashboards` etkinleştirildiğinde, derleme `reports/` altında panoları korur.

Yerleşik raporlar şunları içerir:

- `reports/open-questions.md`
- `reports/contradictions.md`
- `reports/low-confidence.md`
- `reports/claim-health.md`
- `reports/stale-pages.md`
- `reports/person-agent-directory.md`
- `reports/relationship-graph.md`
- `reports/provenance-coverage.md`
- `reports/privacy-review.md`

Bu raporlar şunları izler:

- çelişki notu kümeleri
- rekabet eden iddia kümeleri
- yapılandırılmış kanıtı eksik iddialar
- düşük güvenli sayfalar ve iddialar
- bayat veya bilinmeyen güncellik
- çözümlenmemiş soruları olan sayfalar
- kişi/varlık yönlendirme kartları
- yapılandırılmış ilişki kenarları
- kanıt sınıfı kapsamı
- kullanımdan önce inceleme gerektiren herkese açık olmayan gizlilik katmanları

## Arama ve getirme

`memory-wiki` iki arama arka ucunu destekler:

- `shared`: kullanılabilir olduğunda paylaşılan bellek arama akışını kullan
- `local`: wikiyi yerel olarak ara

Ayrıca üç corpus'u destekler:

- `wiki`
- `memory`
- `all`

Önemli davranış:

- `wiki_search` ve `wiki_get` mümkün olduğunda derlenmiş özetleri ilk geçiş olarak kullanır
- iddia kimlikleri sahip sayfaya geri çözümlenebilir
- tartışmalı/bayat/güncel iddialar sıralamayı etkiler
- köken bilgisi etiketleri sonuçlarda kalabilir
- arama modu kişi aramaya, soru yönlendirmeye, kaynak
  kanıtına veya ham iddialara göre sıralamayı eğebilir

Pratik kural:

- tek bir geniş geri çağırma geçişi için `memory_search corpus=all` kullanın
- wiki'ye özgü sıralama,
  köken bilgisi veya sayfa düzeyinde inanç yapısı önemliyse `wiki_search` + `wiki_get` kullanın

Arama modları:

- `auto`: dengeli varsayılan
- `find-person`: kişiye benzeyen varlıkları, takma adları, kullanıcı adlarını, sosyal profilleri ve
  kanonik kimlikleri öne çıkar
- `route-question`: aracı kartlarını, sorulacak konu ipuçlarını, en uygun kullanım ipuçlarını ve
  ilişki bağlamını öne çıkar
- `source-evidence`: kaynak sayfaları ve yapılandırılmış kanıt meta verisini öne çıkar
- `raw-claim`: eşleşen yapılandırılmış iddiaları öne çıkarır ve sonuçlarda iddia/kanıt
  meta verisini döndürür

Bir sonuç yapılandırılmış bir iddiayla eşleştiğinde, `wiki_search` ayrıntı yükünde
`matchedClaimId`, `matchedClaimStatus`, `matchedClaimConfidence`,
`evidenceKinds` ve `evidenceSourceIds` döndürebilir. Metin çıktısı
mevcut olduğunda kompakt `Claim:` ve `Evidence:` satırlarını da içerir.

## Aracı araçları

Plugin şu araçları kaydeder:

- `wiki_status`
- `wiki_search`
- `wiki_get`
- `wiki_apply`
- `wiki_lint`

Ne yaparlar:

- `wiki_status`: mevcut kasa modu, sağlık, Obsidian CLI kullanılabilirliği
- `wiki_search`: wiki sayfalarında ve yapılandırıldığında paylaşılan bellek corpus'larında arama yapar;
  kişi arama, soru yönlendirme, kaynak kanıtı veya ham
  iddia ayrıntı incelemesi için `mode` kabul eder
- `wiki_get`: bir wiki sayfasını id/yol ile okur veya paylaşılan bellek corpus'una geri döner
- `wiki_apply`: serbest biçimli sayfa cerrahisi olmadan dar sentez/meta veri mutasyonları
- `wiki_lint`: yapısal kontroller, köken bilgisi boşlukları, çelişkiler, açık sorular

Plugin ayrıca dışlayıcı olmayan bir bellek corpus eki kaydeder, böylece aktif bellek
Plugin'i corpus seçimini desteklediğinde paylaşılan
`memory_search` ve `memory_get` wikiye erişebilir.

## İstem ve bağlam davranışı

`context.includeCompiledDigestPrompt` etkinleştirildiğinde, bellek istem bölümleri
`agent-digest.json` içinden kompakt bir derlenmiş anlık görüntü ekler.

Bu anlık görüntü özellikle küçük ve yüksek sinyallidir:

- yalnızca en önemli sayfalar
- yalnızca en önemli iddialar
- çelişki sayısı
- soru sayısı
- güven/güncellik niteleyicileri

Bu isteğe bağlıdır çünkü istem şeklini değiştirir ve esas olarak bellek eklerini açıkça tüketen bağlam
motorları veya eski istem derleme için kullanışlıdır.

## Yapılandırma

Yapılandırmayı `plugins.entries.memory-wiki.config` altına koyun:

```json5
{
  plugins: {
    entries: {
      "memory-wiki": {
        enabled: true,
        config: {
          vaultMode: "isolated",
          vault: {
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

Anahtar geçişler:

- `vaultMode`: `isolated`, `bridge`, `unsafe-local`
- `vault.renderMode`: `native` veya `obsidian`
- `bridge.readMemoryArtifacts`: Active Memory Plugin herkese açık yapıtlarını içe aktar
- `bridge.followMemoryEvents`: köprü modunda olay günlüklerini dahil et
- `search.backend`: `shared` veya `local`
- `search.corpus`: `wiki`, `memory` veya `all`
- `context.includeCompiledDigestPrompt`: bellek istemi bölümlerine kompakt özet anlık görüntüsü ekle
- `render.createBacklinks`: deterministik ilgili bloklar oluştur
- `render.createDashboards`: pano sayfaları oluştur

### Örnek: QMD + köprü modu

Hatırlama için QMD ve bakımı yapılan bir bilgi katmanı için `memory-wiki`
istediğinizde bunu kullanın:

```json5
{
  memory: {
    backend: "qmd",
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

Bu şunları korur:

- Active Memory hatırlamasından QMD sorumlu kalır
- `memory-wiki` derlenmiş sayfalara ve panolara odaklanır
- derlenmiş özet istemlerini bilerek etkinleştirene kadar istem biçimi değişmeden kalır

## CLI

`memory-wiki` ayrıca üst düzey bir CLI yüzeyi sunar:

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

Tam komut referansı için bkz. [CLI: wiki](/tr/cli/wiki).

## Obsidian desteği

`vault.renderMode`, `obsidian` olduğunda Plugin, Obsidian dostu
Markdown yazar ve isteğe bağlı olarak resmi `obsidian` CLI aracını kullanabilir.

Desteklenen iş akışları şunları içerir:

- durum yoklama
- kasa araması
- bir sayfa açma
- bir Obsidian komutu çağırma
- günlük nota atlama

Bu isteğe bağlıdır. Wiki, Obsidian olmadan yerel modda çalışmaya devam eder.

## Önerilen iş akışı

1. Hatırlama/yükseltme/Dreaming için Active Memory Plugin'inizi koruyun.
2. `memory-wiki` özelliğini etkinleştirin.
3. Açıkça köprü modu istemiyorsanız `isolated` moduyla başlayın.
4. Kaynak bilgisi önemli olduğunda `wiki_search` / `wiki_get` kullanın.
5. Dar kapsamlı sentezler veya meta veri güncellemeleri için `wiki_apply` kullanın.
6. Anlamlı değişikliklerden sonra `wiki_lint` çalıştırın.
7. Eski/çelişkili bilgi görünürlüğü istiyorsanız panoları açın.

## İlgili dokümanlar

- [Belleğe Genel Bakış](/tr/concepts/memory)
- [CLI: memory](/tr/cli/memory)
- [CLI: wiki](/tr/cli/wiki)
- [Plugin SDK genel bakış](/tr/plugins/sdk-overview)
