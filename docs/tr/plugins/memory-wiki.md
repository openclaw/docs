---
read_when:
    - Düz `MEMORY.md` notlarının ötesinde kalıcı bilgi istiyorsunuz
    - Paketle gelen memory-wiki Plugin'ini yapılandırıyorsunuz
    - wiki_search, wiki_get veya köprü modunu anlamak istiyorsunuz
summary: 'memory-wiki: provenance, iddialar, panolar ve köprü modu içeren derlenmiş bilgi kasası'
title: Bellek wiki'si
x-i18n:
    generated_at: "2026-04-24T09:21:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: d9b2637514878a87f57f1f7d19128f0a4f622852c1a25d632410cb679f081b8e
    source_path: plugins/memory-wiki.md
    workflow: 15
---

`memory-wiki`, dayanıklı belleği derlenmiş
bir bilgi kasasına dönüştüren paketle gelen bir Plugin'dir.

Etkin bellek Plugin'inin yerini **almaz**. Etkin bellek Plugin'i hâlâ
geri çağırmaya, yükseltmeye, indekslemeye ve Dreaming'e sahiptir. `memory-wiki`, bunun yanında durur
ve dayanıklı bilgiyi gezilebilir bir wiki'ye; deterministik sayfalar,
yapılandırılmış iddialar, provenance, panolar ve makine tarafından okunabilir özetlerle derler.

Belleğin, bir Markdown dosyaları yığını gibi değil de
daha çok bakımı yapılan bir bilgi katmanı gibi davranmasını istediğinizde kullanın.

## Ne ekler

- Deterministik sayfa düzenine sahip özel bir wiki kasası
- Yalnızca düzyazı değil, yapılandırılmış iddia ve kanıt metadata'sı
- Sayfa düzeyinde provenance, güven, çelişkiler ve açık sorular
- Aracı/çalışma zamanı tüketicileri için derlenmiş özetler
- Wiki'ye özgü search/get/apply/lint araçları
- Etkin bellek Plugin'inden genel yapıtlara aktarma yapan isteğe bağlı köprü modu
- İsteğe bağlı Obsidian uyumlu render modu ve CLI entegrasyonu

## Bellekle nasıl uyum sağlar

Ayrımı şöyle düşünün:

| Katman                                                  | Sahibi olduğu şeyler                                                                            |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Etkin bellek Plugin'i (`memory-core`, QMD, Honcho vb.) | Geri çağırma, anlamsal arama, yükseltme, Dreaming, bellek çalışma zamanı                        |
| `memory-wiki`                                           | Derlenmiş wiki sayfaları, provenance açısından zengin sentezler, panolar, wiki'ye özgü search/get/apply |

Etkin bellek Plugin'i paylaşılan geri çağırma yapılarını açığa çıkarıyorsa OpenClaw,
`memory_search corpus=all` ile tek geçişte
her iki katmanı da arayabilir.

Wiki'ye özgü sıralamaya, provenance'a veya doğrudan sayfa erişimine ihtiyacınız olduğunda
bunun yerine wiki'ye özgü yerel araçları kullanın.

## Önerilen hibrit desen

Yerel öncelikli kurulumlar için güçlü bir varsayılan şudur:

- Geri çağırma ve geniş anlamsal arama için etkin bellek arka ucu olarak QMD
- Dayanıklı sentezlenmiş bilgi sayfaları için `bridge` modunda `memory-wiki`

Bu ayrım iyi çalışır çünkü her katman odaklı kalır:

- QMD ham notları, oturum dışa aktarımlarını ve ek koleksiyonları aranabilir tutar
- `memory-wiki` kararlı varlıkları, iddiaları, panoları ve kaynak sayfaları derler

Pratik kural:

- Bellek genelinde tek bir geniş geri çağırma geçişi istediğinizde `memory_search` kullanın
- Provenance farkındalıklı wiki sonuçları istediğinizde `wiki_search` ve `wiki_get` kullanın
- Paylaşılan aramanın her iki katmana yayılmasını istediğinizde `memory_search corpus=all` kullanın

Köprü modu sıfır dışa aktarılmış yapı bildiriyorsa etkin bellek Plugin'i şu anda
henüz genel köprü girdilerini açığa çıkarmıyordur. Önce `openclaw wiki doctor` çalıştırın,
ardından etkin bellek Plugin'inin genel yapıları desteklediğini doğrulayın.

## Kasa modları

`memory-wiki`, üç kasa modunu destekler:

### `isolated`

Kendi kasası, kendi kaynakları, `memory-core`'a bağımlılık yok.

Wiki'nin kendi küratörlüğü yapılmış bilgi deposu olmasını istediğinizde bunu kullanın.

### `bridge`

Etkin bellek Plugin'inden genel bellek yapılarını ve bellek olaylarını
genel Plugin SDK sınırları üzerinden okur.

Wiki'nin, özel Plugin iç işleyişine girmeden bellek Plugin'inin
dışa aktarılan yapılarını derlemesini ve düzenlemesini istediğinizde bunu kullanın.

Köprü modu şunları indeksleyebilir:

- dışa aktarılan bellek yapıları
- Dreaming raporları
- günlük notlar
- bellek kök dosyaları
- bellek olay günlükleri

### `unsafe-local`

Yerel özel yollar için açık aynı makine kaçış kapısı.

Bu mod bilinçli olarak deneyseldir ve taşınabilir değildir. Bunu yalnızca
güven sınırını anladığınızda ve özellikle köprü modunun sağlayamadığı
yerel dosya sistemi erişimine ihtiyaç duyduğunuzda kullanın.

## Kasa düzeni

Plugin, şöyle bir kasa başlatır:

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

Yönetilen içerik üretilen blokların içinde kalır. İnsan not blokları korunur.

Ana sayfa grupları şunlardır:

- `sources/` içe aktarılan ham malzeme ve köprü destekli sayfalar için
- `entities/` dayanıklı şeyler, insanlar, sistemler, projeler ve nesneler için
- `concepts/` fikirler, soyutlamalar, desenler ve ilkeler için
- `syntheses/` derlenmiş özetler ve bakımı yapılan birleştirmeler için
- `reports/` üretilen panolar için

## Yapılandırılmış iddialar ve kanıtlar

Sayfalar yalnızca serbest biçimli metin değil, yapılandırılmış `claims` frontmatter'ı taşıyabilir.

Her iddia şunları içerebilir:

- `id`
- `text`
- `status`
- `confidence`
- `evidence[]`
- `updatedAt`

Kanıt girdileri şunları içerebilir:

- `sourceId`
- `path`
- `lines`
- `weight`
- `note`
- `updatedAt`

Wiki'yi pasif bir not
dökümünden çok bir inanç katmanı gibi davranır hâle getiren şey budur. İddialar izlenebilir, puanlanabilir, itiraz edilebilir ve kaynaklara geri çözülebilir.

## Derleme işlem hattı

Derleme adımı wiki sayfalarını okur, özetleri normalize eder ve kararlı
makineye dönük yapıları şu konumlara çıkarır:

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

Bu özetler, aracıların ve çalışma zamanı kodunun Markdown
sayfalarını kazımasına gerek kalmaması için vardır.

Derlenmiş çıktı ayrıca şunları da besler:

- search/get akışları için ilk geçiş wiki indeksleme
- sahip sayfalara geri claim-id çözümleme
- sıkıştırılmış istem ekleri
- rapor/pano üretimi

## Panolar ve sağlık raporları

`render.createDashboards` etkin olduğunda derleme, `reports/`
altında panoları sürdürür.

Yerleşik raporlar şunları içerir:

- `reports/open-questions.md`
- `reports/contradictions.md`
- `reports/low-confidence.md`
- `reports/claim-health.md`
- `reports/stale-pages.md`

Bu raporlar şunları izler:

- çelişki not kümelemeleri
- yarışan iddia kümeleri
- yapılandırılmış kanıtı eksik iddialar
- düşük güvenli sayfalar ve iddialar
- bayat veya bilinmeyen tazelik
- çözülmemiş sorular içeren sayfalar

## Arama ve getirme

`memory-wiki`, iki arama arka ucunu destekler:

- `shared`: kullanılabilir olduğunda paylaşılan bellek arama akışını kullanır
- `local`: wiki'yi yerelde arar

Ayrıca üç corpus destekler:

- `wiki`
- `memory`
- `all`

Önemli davranış:

- `wiki_search` ve `wiki_get`, mümkün olduğunda ilk geçişte derlenmiş özetleri kullanır
- claim kimlikleri sahip sayfaya geri çözülebilir
- contested/stale/fresh iddialar sıralamayı etkiler
- provenance etiketleri sonuçlara kadar yaşayabilir

Pratik kural:

- Tek bir geniş geri çağırma geçişi için `memory_search corpus=all` kullanın
- Wiki'ye özgü sıralama,
  provenance veya sayfa düzeyinde inanç yapısı önemsediğinizde `wiki_search` + `wiki_get` kullanın

## Aracı araçları

Plugin şu araçları kaydeder:

- `wiki_status`
- `wiki_search`
- `wiki_get`
- `wiki_apply`
- `wiki_lint`

Yaptıkları şeyler:

- `wiki_status`: geçerli kasa modu, sağlık durumu, Obsidian CLI kullanılabilirliği
- `wiki_search`: wiki sayfalarını ve yapılandırıldığında paylaşılan bellek corpus'larını arar
- `wiki_get`: bir wiki sayfasını kimlik/yol ile okur veya paylaşılan bellek corpus'una geri döner
- `wiki_apply`: serbest biçimli sayfa ameliyatı olmadan dar sentez/metadata mutasyonları
- `wiki_lint`: yapısal kontroller, provenance boşlukları, çelişkiler, açık sorular

Plugin ayrıca dışlayıcı olmayan bir bellek corpus eki de kaydeder, böylece etkin bellek
Plugin'i corpus seçimini desteklediğinde paylaşılan
`memory_search` ve `memory_get` wiki'ye ulaşabilir.

## İstem ve bağlam davranışı

`context.includeCompiledDigestPrompt` etkin olduğunda bellek istem bölümleri,
`agent-digest.json` içinden sıkıştırılmış derlenmiş bir anlık görüntü ekler.

Bu anlık görüntü bilinçli olarak küçük ve yüksek sinyallidir:

- yalnızca en üst sayfalar
- yalnızca en üst iddialar
- çelişki sayısı
- soru sayısı
- güven/tazelik niteleyicileri

Bu katılımlıdır çünkü istem şeklini değiştirir ve çoğunlukla bağlam motorları
veya bellek eklerini açıkça tüketen eski istem oluşturma için yararlıdır.

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

Temel geçişler:

- `vaultMode`: `isolated`, `bridge`, `unsafe-local`
- `vault.renderMode`: `native` veya `obsidian`
- `bridge.readMemoryArtifacts`: etkin bellek Plugin'inin genel yapılarını içe aktarır
- `bridge.followMemoryEvents`: köprü modunda olay günlüklerini dahil eder
- `search.backend`: `shared` veya `local`
- `search.corpus`: `wiki`, `memory` veya `all`
- `context.includeCompiledDigestPrompt`: bellek istem bölümlerine sıkıştırılmış özet anlık görüntüsü ekler
- `render.createBacklinks`: deterministik ilgili bloklar üretir
- `render.createDashboards`: pano sayfaları üretir

### Örnek: QMD + köprü modu

Geri çağırma için QMD, bakımı yapılan
bilgi katmanı için `memory-wiki` istediğinizde bunu kullanın:

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

Bu, şunları korur:

- Etkin bellek geri çağırmasından QMD sorumlu kalır
- `memory-wiki`, derlenmiş sayfalara ve panolara odaklanır
- Derlenmiş özet istemlerini kasıtlı olarak etkinleştirene kadar istem şekli değişmez

## CLI

`memory-wiki`, ayrıca üst düzey bir CLI yüzeyi de açar:

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

Tam komut başvurusu için bkz. [CLI: wiki](/tr/cli/wiki).

## Obsidian desteği

`vault.renderMode`, `obsidian` olduğunda Plugin, Obsidian uyumlu
Markdown yazar ve isteğe bağlı olarak resmi `obsidian` CLI'yi kullanabilir.

Desteklenen iş akışları şunları içerir:

- durum yoklaması
- kasa araması
- bir sayfa açma
- bir Obsidian komutu çağırma
- günlük nota atlama

Bu isteğe bağlıdır. Wiki, Obsidian olmadan da yerel modda çalışır.

## Önerilen iş akışı

1. Geri çağırma/yükseltme/Dreaming için etkin bellek Plugin'inizi koruyun.
2. `memory-wiki` etkinleştirin.
3. Açıkça köprü modu istemediğiniz sürece `isolated` modla başlayın.
4. Provenance önemli olduğunda `wiki_search` / `wiki_get` kullanın.
5. Dar sentezler veya metadata güncellemeleri için `wiki_apply` kullanın.
6. Anlamlı değişikliklerden sonra `wiki_lint` çalıştırın.
7. Bayatlık/çelişki görünürlüğü istiyorsanız panoları açın.

## İlgili belgeler

- [Bellek Genel Bakışı](/tr/concepts/memory)
- [CLI: memory](/tr/cli/memory)
- [CLI: wiki](/tr/cli/wiki)
- [Plugin SDK genel bakışı](/tr/plugins/sdk-overview)
