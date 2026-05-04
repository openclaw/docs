---
read_when:
    - Basit MEMORY.md notlarının ötesinde kalıcı bilgi istiyorsunuz
    - Paketle birlikte gelen memory-wiki Plugin'ini yapılandırıyorsunuz
    - wiki_search, wiki_get veya köprü modunu anlamak istiyorsunuz
summary: 'memory-wiki: kaynak bilgisi, iddialar, panolar ve köprü modu içeren derlenmiş bilgi kasası'
title: Bellek wiki'si
x-i18n:
    generated_at: "2026-05-04T07:07:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: b070177b7c1217e9102bc57680b4009265e3584ede7ad6dc3ba7b6393260fefe
    source_path: plugins/memory-wiki.md
    workflow: 16
---

`memory-wiki`, kalıcı belleği derlenmiş bir bilgi kasasına dönüştüren paketlenmiş bir Plugin'dir.

Active Memory Plugin'inin yerini **almaz**. Active Memory Plugin'i hâlâ geri çağırma, yükseltme, indeksleme ve Dreaming işlemlerinin sahibidir. `memory-wiki` onun yanında durur ve kalıcı bilgiyi deterministik sayfalar, yapılandırılmış iddialar, köken bilgisi, panolar ve makine tarafından okunabilir özetlerle gezilebilir bir wiki'ye derler.

Belleğin bir Markdown dosyaları yığını gibi değil, sürdürülen bir bilgi katmanı gibi davranmasını istediğinizde kullanın.

## Neler ekler

- Deterministik sayfa düzenine sahip özel bir wiki kasası
- Yalnızca düz metin değil, yapılandırılmış iddia ve kanıt metadatası
- Sayfa düzeyinde köken bilgisi, güven, çelişkiler ve açık sorular
- Aracı/çalışma zamanı tüketicileri için derlenmiş özetler
- Wiki'ye özgü search/get/apply/lint araçları
- Active Memory Plugin'inden herkese açık yapıtları içe aktaran isteğe bağlı köprü modu
- İsteğe bağlı Obsidian dostu render modu ve CLI entegrasyonu

## Bellek ile nasıl uyum sağlar

Ayrımı şöyle düşünebilirsiniz:

| Katman                                                  | Sahip olduğu alan                                                                           |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Active Memory Plugin'i (`memory-core`, QMD, Honcho vb.) | Geri çağırma, anlamsal arama, yükseltme, Dreaming, bellek çalışma zamanı                   |
| `memory-wiki`                                           | Derlenmiş wiki sayfaları, köken açısından zengin sentezler, panolar, wiki'ye özgü search/get/apply |

Active Memory Plugin'i paylaşılan geri çağırma yapıtlarını sunarsa OpenClaw,
`memory_search corpus=all` ile tek geçişte iki katmanda da arama yapabilir.

Wiki'ye özgü sıralama, köken bilgisi veya doğrudan sayfa erişimi gerektiğinde
bunun yerine wiki'ye özgü araçları kullanın.

## Önerilen hibrit kalıp

Yerel öncelikli kurulumlar için güçlü bir varsayılan şudur:

- Geri çağırma ve geniş anlamsal arama için Active Memory arka ucu olarak QMD
- Kalıcı sentezlenmiş bilgi sayfaları için `bridge` modunda `memory-wiki`

Bu ayrım iyi çalışır çünkü her katman odağını korur:

- QMD ham notları, oturum dışa aktarımlarını ve ek koleksiyonları aranabilir tutar
- `memory-wiki` kararlı varlıkları, iddiaları, panoları ve kaynak sayfalarını derler

Pratik kural:

- bellek genelinde tek bir geniş geri çağırma geçişi istediğinizde `memory_search` kullanın
- köken bilgisine duyarlı wiki sonuçları istediğinizde `wiki_search` ve `wiki_get` kullanın
- paylaşılan aramanın iki katmanı da kapsamasını istediğinizde `memory_search corpus=all` kullanın

Köprü modu sıfır dışa aktarılmış yapıt bildirirse Active Memory Plugin'i şu anda
herkese açık köprü girdileri sunmuyor demektir. Önce `openclaw wiki doctor` çalıştırın,
ardından Active Memory Plugin'inin herkese açık yapıtları desteklediğini doğrulayın.

Köprü modu etkin olduğunda ve `bridge.readMemoryArtifacts` etkinleştirildiğinde
`openclaw wiki status`, `openclaw wiki doctor` ve `openclaw wiki bridge
import` çalışan Gateway üzerinden okur. Bu, CLI köprü kontrollerini çalışma zamanı
bellek Plugin bağlamıyla uyumlu tutar. Köprü devre dışıysa veya yapıt okumaları
kapatıldıysa bu komutlar yerel/çevrimdışı davranışlarını korur.

## Kasa modları

`memory-wiki` üç kasa modunu destekler:

### `isolated`

Kendi kasası, kendi kaynakları vardır; `memory-core` bağımlılığı yoktur.

Wiki'nin kendi düzenlenmiş bilgi deposu olmasını istediğinizde bunu kullanın.

### `bridge`

Active Memory Plugin'inden herkese açık bellek yapıtlarını ve bellek olaylarını,
herkese açık Plugin SDK uçları üzerinden okur.

Wiki'nin, özel Plugin iç ayrıntılarına erişmeden bellek Plugin'inin dışa aktardığı
yapıtları derlemesini ve düzenlemesini istediğinizde bunu kullanın.

Köprü modu şunları indeksleyebilir:

- dışa aktarılmış bellek yapıtları
- Dreaming raporları
- günlük notlar
- bellek kök dosyaları
- bellek olay günlükleri

### `unsafe-local`

Yerel özel yollar için açık aynı makine kaçış yolu.

Bu mod bilinçli olarak deneysel ve taşınabilir değildir. Yalnızca güven sınırını
anladığınızda ve köprü modunun sağlayamadığı yerel dosya sistemi erişimine özellikle
ihtiyaç duyduğunuzda kullanın.

## Kasa düzeni

Plugin kasayı şöyle başlatır:

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

Yönetilen içerik oluşturulmuş blokların içinde kalır. İnsan notu blokları korunur.

Ana sayfa grupları şunlardır:

- içe aktarılmış ham materyal ve köprü destekli sayfalar için `sources/`
- kalıcı şeyler, kişiler, sistemler, projeler ve nesneler için `entities/`
- fikirler, soyutlamalar, kalıplar ve ilkeler için `concepts/`
- derlenmiş özetler ve sürdürülen toplu görünümler için `syntheses/`
- oluşturulmuş panolar için `reports/`

## Yapılandırılmış iddialar ve kanıt

Sayfalar yalnızca serbest biçimli metin değil, yapılandırılmış `claims` frontmatter'ı da taşıyabilir.

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

Wiki'nin pasif bir not dökümünden çok bir inanç katmanı gibi davranmasını sağlayan şey budur. İddialar izlenebilir, puanlanabilir, tartışılabilir ve kaynaklara geri bağlanarak çözülebilir.

## Aracıya dönük varlık metadatası

Varlık sayfaları, aracı kullanımı için yönlendirme metadatası da taşıyabilir. Bu genel
frontmatter'dır; dolayısıyla kişiler, ekipler, sistemler, projeler veya diğer herhangi bir
varlık türü için çalışır.

Yaygın alanlar şunlardır:

- `entityType`: örneğin `person`, `team`, `system` veya `project`
- `canonicalId`: diğer adlar ve içe aktarımlar genelinde kullanılan kararlı kimlik anahtarı
- `aliases`: aynı sayfaya çözülmesi gereken adlar, kullanıcı adları veya etiketler
- `privacyTier`: `public`, `local-private`, `sensitive` veya `confirm-before-use`
- `bestUsedFor` / `notEnoughFor`: kompakt yönlendirme ipuçları
- `lastRefreshedAt`: sayfa düzenleme zamanından ayrı kaynak yenileme zaman damgası
- `personCard`: kullanıcı adları, sosyal hesaplar,
  e-postalar, saat dilimi, kulvar, sorulacak konular, sorulmaması gerekenler, güven ve gizlilik
  içeren isteğe bağlı kişiye özgü yönlendirme kartı
- `relationships`: hedef, tür, ağırlık,
  güven, kanıt türü, gizlilik katmanı ve not içeren ilgili sayfalara tipli kenarlar

Bir kişi wiki'si için aracı genellikle
`reports/person-agent-directory.md` ile başlamalı, ardından iletişim ayrıntılarını veya çıkarılmış olguları kullanmadan önce `wiki_get` ile kişi sayfasını açmalıdır.

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

Derleme adımı wiki sayfalarını okur, özetleri normalleştirir ve şu konumların altında
kararlı makineye dönük yapıtlar üretir:

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

Bu özetler, aracıların ve çalışma zamanı kodunun Markdown sayfalarını kazımak zorunda kalmaması için vardır.

Derlenmiş çıktı ayrıca şunları destekler:

- search/get akışları için ilk geçiş wiki indeksleme
- iddia kimliğinden sahip sayfalara geri arama
- kompakt prompt ekleri
- rapor/pano oluşturma

## Panolar ve sağlık raporları

`render.createDashboards` etkinleştirildiğinde derleme, panoları `reports/` altında sürdürür.

Yerleşik raporlar şunlardır:

- `reports/open-questions.md`
- `reports/contradictions.md`
- `reports/low-confidence.md`
- `reports/claim-health.md`
- `reports/stale-pages.md`
- `reports/person-agent-directory.md`
- `reports/relationship-graph.md`
- `reports/provenance-coverage.md`
- `reports/privacy-review.md`

Bu raporlar şu tür şeyleri izler:

- çelişki notu kümeleri
- rakip iddia kümeleri
- yapılandırılmış kanıtı eksik iddialar
- düşük güvenli sayfalar ve iddialar
- bayat veya bilinmeyen güncellik
- çözülmemiş soruları olan sayfalar
- kişi/varlık yönlendirme kartları
- yapılandırılmış ilişki kenarları
- kanıt sınıfı kapsamı
- kullanımdan önce inceleme gerektiren herkese açık olmayan gizlilik katmanları

## Arama ve getirme

`memory-wiki` iki arama arka ucunu destekler:

- `shared`: mevcut olduğunda paylaşılan bellek arama akışını kullan
- `local`: wiki'yi yerel olarak ara

Ayrıca üç derlemi destekler:

- `wiki`
- `memory`
- `all`

Önemli davranış:

- `wiki_search` ve `wiki_get`, mümkün olduğunda ilk geçiş olarak derlenmiş özetleri kullanır
- iddia kimlikleri sahip sayfaya geri çözülebilir
- tartışmalı/bayat/güncel iddialar sıralamayı etkiler
- köken bilgisi etiketleri sonuçlara taşınabilir
- arama modu kişi arama, soru yönlendirme, kaynak
  kanıtı veya ham iddialar için sıralamayı ağırlıklandırabilir

Pratik kural:

- tek bir geniş geri çağırma geçişi için `memory_search corpus=all` kullanın
- wiki'ye özgü sıralama,
  köken bilgisi veya sayfa düzeyinde inanç yapısı sizin için önemli olduğunda `wiki_search` + `wiki_get` kullanın

Arama modları:

- `auto`: dengeli varsayılan
- `find-person`: kişi benzeri varlıkları, diğer adları, kullanıcı adlarını, sosyal hesapları ve
  kanonik kimlikleri öne çıkarır
- `route-question`: aracı kartlarını, sorulacak konu ipuçlarını, en iyi kullanım ipuçlarını ve
  ilişki bağlamını öne çıkarır
- `source-evidence`: kaynak sayfaları ve yapılandırılmış kanıt metadatasını öne çıkarır
- `raw-claim`: eşleşen yapılandırılmış iddiaları öne çıkarır ve sonuçlarda iddia/kanıt
  metadatası döndürür

Bir sonuç yapılandırılmış bir iddiayla eşleştiğinde `wiki_search`,
ayrıntılar yükünde `matchedClaimId`, `matchedClaimStatus`, `matchedClaimConfidence`,
`evidenceKinds` ve `evidenceSourceIds` döndürebilir. Metin çıktısı
mevcut olduğunda kompakt `Claim:` ve `Evidence:` satırlarını da içerir.

## Aracı araçları

Plugin şu araçları kaydeder:

- `wiki_status`
- `wiki_search`
- `wiki_get`
- `wiki_apply`
- `wiki_lint`

Yaptıkları işler:

- `wiki_status`: mevcut kasa modu, sağlık, Obsidian CLI kullanılabilirliği
- `wiki_search`: wiki sayfalarında ve yapılandırıldığında paylaşılan bellek derlemlerinde arama yapar;
  kişi arama, soru yönlendirme, kaynak kanıtı veya ham
  iddia ayrıntılandırması için `mode` kabul eder
- `wiki_get`: bir wiki sayfasını id/path ile okur veya paylaşılan bellek derlemine geri döner
- `wiki_apply`: serbest biçimli sayfa ameliyatı olmadan dar sentez/metadata değişiklikleri
- `wiki_lint`: yapısal kontroller, köken bilgisi boşlukları, çelişkiler, açık sorular

Plugin ayrıca dışlayıcı olmayan bir bellek derlemi eki kaydeder; böylece Active Memory
Plugin'i derlem seçimini desteklediğinde paylaşılan `memory_search` ve `memory_get` wiki'ye ulaşabilir.

## Prompt ve bağlam davranışı

`context.includeCompiledDigestPrompt` etkinleştirildiğinde bellek prompt bölümleri,
`agent-digest.json` içinden kompakt derlenmiş bir anlık görüntü ekler.

Bu anlık görüntü bilinçli olarak küçük ve yüksek sinyallidir:

- yalnızca en üst sayfalar
- yalnızca en üst iddialar
- çelişki sayısı
- soru sayısı
- güven/güncellik niteleyicileri

Bu isteğe bağlıdır çünkü prompt biçimini değiştirir ve esas olarak bellek eklerini açıkça tüketen bağlam
motorları veya eski prompt derleme için kullanışlıdır.

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
- `bridge.readMemoryArtifacts`: Active Memory Plugin genel artefaktlarını içe aktar
- `bridge.followMemoryEvents`: köprü modunda olay günlüklerini dahil et
- `search.backend`: `shared` veya `local`
- `search.corpus`: `wiki`, `memory` veya `all`
- `context.includeCompiledDigestPrompt`: bellek istemi bölümlerine kompakt özet anlık görüntüsünü ekle
- `render.createBacklinks`: deterministik ilgili bloklar oluştur
- `render.createDashboards`: pano sayfaları oluştur

### Örnek: QMD + köprü modu

Bunu, hatırlama için QMD ve sürdürülen bir bilgi katmanı için `memory-wiki` istediğinizde kullanın:

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

- Active Memory hatırlamasından QMD sorumlu kalır
- `memory-wiki` derlenmiş sayfalara ve panolara odaklanır
- derlenmiş özet istemlerini bilerek etkinleştirene kadar istem biçimi değişmez

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

`vault.renderMode`, `obsidian` olduğunda Plugin, Obsidian dostu Markdown yazar ve isteğe bağlı olarak resmi `obsidian` CLI aracını kullanabilir.

Desteklenen iş akışları şunları içerir:

- durum yoklama
- kasa arama
- bir sayfa açma
- bir Obsidian komutu çağırma
- günlük nota atlama

Bu isteğe bağlıdır. Wiki, Obsidian olmadan yerel modda da çalışır.

## Önerilen iş akışı

1. Hatırlama/yükseltme/Dreaming için Active Memory Plugin'inizi koruyun.
2. `memory-wiki` öğesini etkinleştirin.
3. Açıkça köprü modunu istemiyorsanız `isolated` moduyla başlayın.
4. Kaynak bilgisi önemli olduğunda `wiki_search` / `wiki_get` kullanın.
5. Dar kapsamlı sentezler veya meta veri güncellemeleri için `wiki_apply` kullanın.
6. Anlamlı değişikliklerden sonra `wiki_lint` çalıştırın.
7. Eskime/çelişki görünürlüğü istiyorsanız panoları açın.

## İlgili belgeler

- [Bellek Genel Bakışı](/tr/concepts/memory)
- [CLI: memory](/tr/cli/memory)
- [CLI: wiki](/tr/cli/wiki)
- [Plugin SDK genel bakışı](/tr/plugins/sdk-overview)
