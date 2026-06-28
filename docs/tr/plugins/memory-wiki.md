---
read_when:
    - Düz MEMORY.md notlarının ötesinde kalıcı bilgi istiyorsunuz
    - Bundled memory-wiki plugin'ini yapılandırıyorsunuz
    - wiki_search, wiki_get veya köprü modunu anlamak istiyorsunuz
summary: 'memory-wiki: kaynak bilgisi, iddialar, panolar ve köprü modu içeren derlenmiş bilgi kasası'
title: Bellek wiki
x-i18n:
    generated_at: "2026-06-28T00:55:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 91512fbab8bfa87d3be29a75c217f99dbae11d9d7065fcc5ae9aa2c51847ec42
    source_path: plugins/memory-wiki.md
    workflow: 16
---

`memory-wiki`, kalıcı belleği derlenmiş bir bilgi kasasına dönüştüren paketlenmiş bir Plugin'dir.

Active Memory Plugin'inin yerini **almaz**. Active Memory Plugin'i hâlâ hatırlama, yükseltme, indeksleme ve Dreaming işlemlerinin sahibidir. `memory-wiki` onun yanında durur ve kalıcı bilgiyi belirlenimci sayfalar, yapılandırılmış iddialar, kaynak bilgisi, panolar ve makine tarafından okunabilir özetler içeren gezilebilir bir wiki'ye derler.

Belleğin bir Markdown dosyaları yığını gibi değil, bakımı yapılan bir bilgi katmanı gibi davranmasını istediğinizde kullanın.

## Ne ekler?

- Belirlenimci sayfa düzenine sahip özel bir wiki kasası
- Yalnızca düz yazı değil, yapılandırılmış iddia ve kanıt üst verisi
- Sayfa düzeyinde kaynak bilgisi, güven, çelişkiler ve açık sorular
- Aracı/çalışma zamanı tüketicileri için derlenmiş özetler
- Wiki'ye özgü search/get/apply/lint araçları
- Open Knowledge Format içe aktarımlarını derlenmiş wiki kavramlarına dönüştürme
- Active Memory Plugin'inden genel yapıtları içe aktaran isteğe bağlı köprü modu
- İsteğe bağlı Obsidian dostu işleme modu ve CLI entegrasyonu

## Bellekle nasıl uyum sağlar?

Ayrımı şöyle düşünün:

| Katman                                                  | Sahip olduğu                                                                                  |
| ------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Active Memory Plugin'i (`memory-core`, QMD, Honcho vb.) | Hatırlama, anlamsal arama, yükseltme, Dreaming, bellek çalışma zamanı                         |
| `memory-wiki`                                           | Derlenmiş wiki sayfaları, kaynak bilgisi açısından zengin sentezler, panolar, wiki'ye özgü search/get/apply |

Active Memory Plugin'i paylaşılan hatırlama yapıtlarını açığa çıkarıyorsa OpenClaw,
`memory_search corpus=all` ile iki katmanı da tek geçişte arayabilir.

Wiki'ye özgü sıralama, kaynak bilgisi veya doğrudan sayfa erişimi gerektiğinde bunun yerine wiki'ye özgü araçları kullanın.

## Önerilen hibrit desen

Yerel öncelikli kurulumlar için güçlü bir varsayılan şudur:

- Hatırlama ve geniş anlamsal arama için Active Memory arka ucu olarak QMD
- Kalıcı sentezlenmiş bilgi sayfaları için `bridge` modunda `memory-wiki`

Bu ayrım iyi çalışır çünkü her katman odaklı kalır:

- QMD, ham notları, oturum dışa aktarımlarını ve ek koleksiyonları aranabilir tutar
- `memory-wiki`, kararlı varlıkları, iddiaları, panoları ve kaynak sayfaları derler

Pratik kural:

- bellek genelinde tek bir geniş hatırlama geçişi istediğinizde `memory_search` kullanın
- kaynak bilgisine duyarlı wiki sonuçları istediğinizde `wiki_search` ve `wiki_get` kullanın
- paylaşılan aramanın iki katmanı da kapsamasını istediğinizde `memory_search corpus=all` kullanın

Köprü modu sıfır dışa aktarılmış yapıt bildiriyorsa Active Memory Plugin'i şu anda genel köprü girdilerini henüz açığa çıkarmıyor demektir. Önce `openclaw wiki doctor` çalıştırın, ardından Active Memory Plugin'inin genel yapıtları desteklediğini doğrulayın.

Köprü modu etkin olduğunda ve `bridge.readMemoryArtifacts` etkinleştirildiğinde,
`openclaw wiki status`, `openclaw wiki doctor` ve `openclaw wiki bridge
import` çalışan Gateway üzerinden okur. Bu, CLI köprü denetimlerini çalışma zamanı bellek Plugin bağlamıyla uyumlu tutar. Köprü devre dışıysa veya yapıt okumaları kapalıysa, bu komutlar yerel/çevrimdışı davranışlarını korur.

## Kasa modları

`memory-wiki` üç kasa modunu destekler:

### `isolated`

Kendi kasası, kendi kaynakları; `memory-core` bağımlılığı yoktur.

Wiki'nin kendi seçilmiş bilgi deposu olmasını istediğinizde bunu kullanın.

### `bridge`

Active Memory Plugin'inden genel Plugin SDK sınırları üzerinden genel bellek yapıtlarını ve bellek olaylarını okur.

Wiki'nin, bellek Plugin'inin dışa aktarılmış yapıtlarını özel Plugin iç yapısına erişmeden derleyip düzenlemesini istediğinizde bunu kullanın.

Köprü modu şunları indeksleyebilir:

- dışa aktarılmış bellek yapıtları
- Dreaming raporları
- günlük notlar
- bellek kök dosyaları
- bellek olay günlükleri

### `unsafe-local`

Yerel özel yollar için açık aynı makine kaçış kapısı.

Bu mod bilinçli olarak deneysel ve taşınabilir değildir. Yalnızca güven sınırını anladığınızda ve köprü modunun sağlayamadığı yerel dosya sistemi erişimine özellikle ihtiyaç duyduğunuzda kullanın.

## Kasa düzeni

Plugin bir kasayı şöyle başlatır:

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

Yönetilen içerik oluşturulan blokların içinde kalır. İnsan notu blokları korunur.

Ana sayfa grupları şunlardır:

- içe aktarılmış ham malzeme ve köprü destekli sayfalar için `sources/`
- kalıcı şeyler, kişiler, sistemler, projeler ve nesneler için `entities/`
- fikirler, soyutlamalar, desenler ve ilkeler için `concepts/`
- derlenmiş özetler ve bakımı yapılan toplamalar için `syntheses/`
- oluşturulan panolar için `reports/`

## Open Knowledge Format içe aktarımları

`memory-wiki`, açılmış Open Knowledge Format paketlerini şu komutla içe aktarabilir:

```bash
openclaw wiki okf import ./bundles/ga4
```

Bir veri kataloğu, dokümantasyon tarayıcısı veya zenginleştirme aracısı zaten OKF üretiyorsa en temiz uyum budur: OKF'yi taşınabilir değişim yapıtı olarak tutun, ardından `memory-wiki`'nin bunu OpenClaw'a özgü kavram sayfalarına ve derlenmiş özetlere dönüştürmesine izin verin.

İçe aktarıcı OKF v0.1 biçimini izler:

- ayrılmış olmayan `.md` dosyaları kavram belgeleridir
- içe aktarılan her kavramın boş olmayan bir `type` frontmatter alanına ihtiyacı vardır
- bilinmeyen OKF `type` değerleri kabul edilir
- ayrılmış `index.md` ve `log.md` dosyaları kavram olarak içe aktarılmaz
- bozuk veya harici markdown bağlantıları korunur

İçe aktarılan kavram sayfaları `concepts/` altında düzleştirilir; böylece mevcut derleme, arama, getirme, pano ve istem özeti yolları ikinci bir wiki ağacı eklemeden bunları görür. Her sayfa özgün OKF kavram kimliğini, kaynak yolunu, `type`, `resource`, `tags`, zaman damgasını ve tüm üretici frontmatter'ını korur. Dahili OKF bağlantıları oluşturulan wiki kavram sayfalarına yeniden yazılır ve ayrıca `kind: okf-link` ile yapılandırılmış `relationships` girdileri olarak yayılır.

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

Wiki'nin pasif bir not dökümünden çok inanç katmanı gibi davranmasını sağlayan budur. İddialar izlenebilir, puanlanabilir, itiraz edilebilir ve kaynaklara geri bağlanarak çözümlenebilir.

## Aracıya dönük varlık üst verisi

Varlık sayfaları, aracı kullanımı için yönlendirme üst verisi de taşıyabilir. Bu genel frontmatter'dır; dolayısıyla kişiler, ekipler, sistemler, projeler veya başka herhangi bir varlık türü için çalışır.

Yaygın alanlar şunlardır:

- `entityType`: örneğin `person`, `team`, `system` veya `project`
- `canonicalId`: takma adlar ve içe aktarımlar genelinde kullanılan kararlı kimlik anahtarı
- `aliases`: aynı sayfaya çözümlenmesi gereken adlar, kullanıcı adları veya etiketler
- `privacyTier`: `public`, `local-private`, `sensitive` veya `confirm-before-use`
- `bestUsedFor` / `notEnoughFor`: kompakt yönlendirme ipuçları
- `lastRefreshedAt`: sayfa düzenleme zamanından ayrı kaynak yenileme zaman damgası
- `personCard`: kullanıcı adları, sosyal bağlantılar, e-postalar, saat dilimi, hat, sorulacak konular, sorulmaması gereken konular, güven ve gizlilik içeren isteğe bağlı kişiye özgü yönlendirme kartı
- `relationships`: hedef, tür, ağırlık, güven, kanıt türü, gizlilik katmanı ve not içeren ilgili sayfalara türlendirilmiş kenarlar

Bir kişi wiki'si için aracı genellikle `reports/person-agent-directory.md` ile başlamalı, ardından iletişim ayrıntılarını veya çıkarılan olguları kullanmadan önce kişi sayfasını `wiki_get` ile açmalıdır.

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

Derleme adımı wiki sayfalarını okur, özetleri normalleştirir ve kararlı makineye dönük yapıtları şuraya yayar:

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

Bu özetler, aracıların ve çalışma zamanı kodunun Markdown sayfalarını kazımasına gerek kalmaması için vardır.

Derlenmiş çıktı ayrıca şunları destekler:

- search/get akışları için ilk geçiş wiki indeksleme
- iddia kimliğinden sahip sayfaya geri arama
- kompakt istem ekleri
- rapor/pano oluşturma

## Panolar ve sağlık raporları

`render.createDashboards` etkinleştirildiğinde derleme, `reports/` altında panoları korur.

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

Bu raporlar şunlar gibi konuları izler:

- çelişki notu kümeleri
- rakip iddia kümeleri
- yapılandırılmış kanıtı eksik iddialar
- düşük güvenli sayfalar ve iddialar
- eski veya bilinmeyen güncellik
- çözülmemiş soruları olan sayfalar
- kişi/varlık yönlendirme kartları
- yapılandırılmış ilişki kenarları
- kanıt sınıfı kapsamı
- kullanılmadan önce inceleme gerektiren genel olmayan gizlilik katmanları

## Arama ve getirme

`memory-wiki` iki arama arka ucunu destekler:

- `shared`: kullanılabilir olduğunda paylaşılan bellek arama akışını kullanır
- `local`: wiki'yi yerel olarak arar

Ayrıca üç külliyatı destekler:

- `wiki`
- `memory`
- `all`

Önemli davranış:

- `wiki_search` ve `wiki_get` mümkün olduğunda ilk geçiş olarak derlenmiş özetleri kullanır
- iddia kimlikleri sahip sayfaya geri çözümlenebilir
- itirazlı/eski/güncel iddialar sıralamayı etkiler
- kaynak bilgisi etiketleri sonuçlara taşınabilir
- arama modu kişi bulma, soru yönlendirme, kaynak kanıtı veya ham iddialar için sıralamayı yönlendirebilir

Pratik kural:

- tek bir geniş hatırlama geçişi için `memory_search corpus=all` kullanın
- wiki'ye özgü sıralama, kaynak bilgisi veya sayfa düzeyinde inanç yapısı önemli olduğunda `wiki_search` + `wiki_get` kullanın

Arama modları:

- `auto`: dengeli varsayılan
- `find-person`: kişiye benzeyen varlıkları, takma adları, kullanıcı adlarını, sosyal bağlantıları ve kanonik kimlikleri öne çıkarır
- `route-question`: aracı kartlarını, sorulacak konu ipuçlarını, en iyi kullanım ipuçlarını ve ilişki bağlamını öne çıkarır
- `source-evidence`: kaynak sayfaları ve yapılandırılmış kanıt üst verisini öne çıkarır
- `raw-claim`: eşleşen yapılandırılmış iddiaları öne çıkarır ve sonuçlarda iddia/kanıt üst verisi döndürür

Bir sonuç yapılandırılmış bir iddiayla eşleştiğinde `wiki_search`, ayrıntı yükünde `matchedClaimId`, `matchedClaimStatus`, `matchedClaimConfidence`, `evidenceKinds` ve `evidenceSourceIds` döndürebilir. Metin çıktısı da mevcut olduğunda kompakt `Claim:` ve `Evidence:` satırlarını içerir.

## Aracı araçları

Plugin şu araçları kaydeder:

- `wiki_status`
- `wiki_search`
- `wiki_get`
- `wiki_apply`
- `wiki_lint`

Ne yaptıkları:

- `wiki_status`: geçerli kasa modu, sağlık, Obsidian CLI kullanılabilirliği
- `wiki_search`: wiki sayfalarını ve yapılandırıldığında paylaşılan bellek külliyatlarını arar; kişi bulma, soru yönlendirme, kaynak kanıtı veya ham iddia ayrıntısına inme için `mode` kabul eder
- `wiki_get`: bir wiki sayfasını kimliğe/yola göre okur veya paylaşılan bellek külliyatına geri döner
- `wiki_apply`: serbest biçimli sayfa ameliyatı olmadan dar sentez/üst veri mutasyonları
- `wiki_lint`: yapısal denetimler, kaynak bilgisi boşlukları, çelişkiler, açık sorular

Plugin ayrıca münhasır olmayan bir bellek derlemi eki kaydeder; böylece paylaşılan
`memory_search` ve `memory_get`, Active Memory Plugin'i derlem seçimini
desteklediğinde wiki'ye erişebilir.

## İstem ve bağlam davranışı

`context.includeCompiledDigestPrompt` etkinleştirildiğinde, bellek istemi bölümleri
`agent-digest.json` içinden kompakt bir derlenmiş anlık görüntü ekler.

Bu anlık görüntü bilerek küçük ve yüksek sinyallidir:

- yalnızca en önemli sayfalar
- yalnızca en önemli iddialar
- çelişki sayısı
- soru sayısı
- güven/güncellik niteleyicileri

Bu, istem şeklini değiştirdiği ve özellikle bellek eklerini açıkça tüketen bağlam
motorları veya eski istem birleştirme için yararlı olduğu için isteğe bağlıdır.

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

Temel anahtarlar:

- `vaultMode`: `isolated`, `bridge`, `unsafe-local`
- `vault.renderMode`: `native` veya `obsidian`
- `bridge.readMemoryArtifacts`: Active Memory Plugin'inin herkese açık yapılarını içe aktar
- `bridge.followMemoryEvents`: köprü modunda olay günlüklerini dahil et
- `search.backend`: `shared` veya `local`
- `search.corpus`: `wiki`, `memory` veya `all`
- `context.includeCompiledDigestPrompt`: bellek istemi bölümlerine kompakt özet anlık görüntüsünü ekle
- `render.createBacklinks`: deterministik ilgili bloklar oluştur
- `render.createDashboards`: pano sayfaları oluştur

### Örnek: QMD + köprü modu

Bunu, geri çağırma için QMD ve bakımı yapılan bir bilgi katmanı için
`memory-wiki` istediğinizde kullanın:

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

Bu şunları korur:

- Active Memory geri çağırmadan QMD sorumlu kalır
- `memory-wiki` derlenmiş sayfalara ve panolara odaklanır
- derlenmiş özet istemlerini bilerek etkinleştirene kadar istem şekli değişmez

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

Tam komut başvurusu için [CLI: wiki](/tr/cli/wiki) bölümüne bakın.

## Obsidian desteği

`vault.renderMode` `obsidian` olduğunda Plugin, Obsidian dostu
Markdown yazar ve isteğe bağlı olarak resmi `obsidian` CLI'sini kullanabilir.

Desteklenen iş akışları şunları içerir:

- durum yoklama
- vault araması
- bir sayfayı açma
- bir Obsidian komutunu çağırma
- günlük nota atlama

Bu isteğe bağlıdır. Wiki, Obsidian olmadan yerel modda da çalışır.

## Önerilen iş akışı

1. Active Memory Plugin'inizi geri çağırma/yükseltme/Dreaming için koruyun.
2. `memory-wiki` özelliğini etkinleştirin.
3. Köprü modunu açıkça istemediğiniz sürece `isolated` moduyla başlayın.
4. Köken bilgisi önemli olduğunda `wiki_search` / `wiki_get` kullanın.
5. Dar kapsamlı sentezler veya meta veri güncellemeleri için `wiki_apply` kullanın.
6. Anlamlı değişikliklerden sonra `wiki_lint` çalıştırın.
7. Eski/çelişki görünürlüğü istiyorsanız panoları açın.

## İlgili dokümanlar

- [Belleğe Genel Bakış](/tr/concepts/memory)
- [CLI: memory](/tr/cli/memory)
- [CLI: wiki](/tr/cli/wiki)
- [Plugin SDK'ye genel bakış](/tr/plugins/sdk-overview)
