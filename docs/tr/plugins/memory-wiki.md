---
read_when:
    - Yalnızca düz `MEMORY.md` notlarının ötesinde kalıcı bilgi istiyorsunuz
    - Paketlenmiş memory-wiki Plugin'ini yapılandırıyorsunuz
    - '`wiki_search`, `wiki_get` veya köprü modunu anlamak istiyorsunuz'
summary: 'memory-wiki: kaynak bilgisi, iddialar, panolar ve köprü modu içeren derlenmiş bilgi kasası'
title: Bellek Viki
x-i18n:
    generated_at: "2026-04-12T23:28:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 44d168a7096f744c56566ecac57499192eb101b4dd8a78e1b92f3aa0d6da3ad1
    source_path: plugins/memory-wiki.md
    workflow: 15
---

# Bellek Viki

`memory-wiki`, dayanıklı belleği derlenmiş bir bilgi kasasına dönüştüren paketlenmiş bir Plugin'dir.

Active Memory Plugin'inin yerini **almaz**. Active Memory Plugin'i hâlâ
geri çağırma, yükseltme, dizinleme ve Dreaming işlemlerinin sahibidir. `memory-wiki` onun yanında yer alır
ve dayanıklı bilgiyi gezinilebilir bir vikiye; deterministik sayfalar,
yapılandırılmış iddialar, kaynak bilgisi, panolar ve makine tarafından okunabilir özetler ile derler.

Belleğin, bir Markdown dosyaları yığınından çok bakımı yapılan bir bilgi katmanı gibi
davranmasını istediğinizde bunu kullanın.

## Ekledikleri

- Deterministik sayfa düzenine sahip özel bir viki kasası
- Yalnızca düz yazı değil, yapılandırılmış iddia ve kanıt meta verileri
- Sayfa düzeyinde kaynak bilgisi, güven, çelişkiler ve açık sorular
- Ajan/çalışma zamanı tüketicileri için derlenmiş özetler
- Vikiye özgü yerel search/get/apply/lint araçları
- Active Memory Plugin'inden genel yapıtları içe aktaran isteğe bağlı köprü modu
- İsteğe bağlı Obsidian uyumlu render modu ve CLI entegrasyonu

## Bellekle nasıl uyum sağlar

Ayrımı şöyle düşünün:

| Katman                                                  | Sahip olduğu şeyler                                                                       |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Active Memory Plugin'i (`memory-core`, QMD, Honcho, vb.) | Geri çağırma, semantik arama, yükseltme, Dreaming, bellek çalışma zamanı                  |
| `memory-wiki`                                           | Derlenmiş viki sayfaları, kaynak bilgisi açısından zengin sentezler, panolar, vikiye özgü search/get/apply |

Active Memory Plugin'i paylaşılan geri çağırma yapıtlarını açığa çıkarıyorsa, OpenClaw
`memory_search corpus=all` ile her iki katmanda da tek geçişte arama yapabilir.

Vikiye özgü sıralama, kaynak bilgisi veya doğrudan sayfa erişimine ihtiyaç duyduğunuzda bunun yerine
vikiye özgü yerel araçları kullanın.

## Önerilen hibrit desen

Yerel öncelikli kurulumlar için güçlü bir varsayılan yapı şudur:

- Geri çağırma ve geniş semantik arama için etkin bellek arka ucu olarak QMD
- Dayanıklı sentezlenmiş bilgi sayfaları için `bridge` modunda `memory-wiki`

Bu ayrım iyi çalışır çünkü her katman odaklı kalır:

- QMD, ham notları, oturum dışa aktarımlarını ve ek koleksiyonları aranabilir tutar
- `memory-wiki`, kararlı varlıkları, iddiaları, panoları ve kaynak sayfaları derler

Pratik kural:

- bellek genelinde tek bir geniş geri çağırma geçişi istediğinizde `memory_search` kullanın
- kaynak bilgisine duyarlı viki sonuçları istediğinizde `wiki_search` ve `wiki_get` kullanın
- paylaşılan aramanın her iki katmana da yayılmasını istediğinizde `memory_search corpus=all` kullanın

Köprü modu sıfır dışa aktarılan yapıt bildiriyorsa, Active Memory Plugin'i şu anda
henüz genel köprü girdileri sunmuyor demektir. Önce `openclaw wiki doctor` çalıştırın,
ardından Active Memory Plugin'inin genel yapıtları desteklediğini doğrulayın.

## Kasa modları

`memory-wiki` üç kasa modunu destekler:

### `isolated`

Kendi kasası, kendi kaynakları; `memory-core` bağımlılığı yoktur.

Vikinin kendi seçilmiş bilgi deposu olmasını istediğinizde bunu kullanın.

### `bridge`

Genel Plugin SDK bağlantıları üzerinden Active Memory Plugin'inden genel bellek yapıtlarını
ve bellek olaylarını okur.

Plugin'in dışa aktardığı yapıtları özel Plugin iç bileşenlerine erişmeden
derleyip düzenlemesini istediğinizde bunu kullanın.

Köprü modu şunları dizinleyebilir:

- dışa aktarılan bellek yapıtları
- rüya raporları
- günlük notlar
- bellek kök dosyaları
- bellek olay günlükleri

### `unsafe-local`

Yerel özel yollar için açıkça aynı makinede kullanılan kaçış kapağı.

Bu mod bilerek deneysel ve taşınabilir değildir. Bunu yalnızca güven sınırını
anladığınızda ve köprü modunun sağlayamadığı yerel dosya sistemi erişimine özellikle
ihtiyaç duyduğunuzda kullanın.

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

Yönetilen içerik, oluşturulan blokların içinde kalır. İnsan not blokları korunur.

Ana sayfa grupları şunlardır:

- içe aktarılan ham materyal ve köprü destekli sayfalar için `sources/`
- dayanıklı şeyler, insanlar, sistemler, projeler ve nesneler için `entities/`
- fikirler, soyutlamalar, desenler ve politikalar için `concepts/`
- derlenmiş özetler ve bakımı yapılan toplu görünümler için `syntheses/`
- oluşturulan panolar için `reports/`

## Yapılandırılmış iddialar ve kanıtlar

Sayfalar yalnızca serbest biçimli metin değil, yapılandırılmış `claims` frontmatter da taşıyabilir.

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

Vikinin pasif bir not dökümünden çok bir inanç katmanı gibi davranmasını sağlayan şey budur.
İddialar izlenebilir, puanlanabilir, itiraz edilebilir ve kaynaklara geri bağlanarak çözülebilir.

## Derleme hattı

Derleme adımı viki sayfalarını okur, özetleri normalize eder ve şu dizin altında
kararlı, makineye dönük yapıtlar üretir:

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

Bu özetler, ajanların ve çalışma zamanı kodunun Markdown
sayfalarını kazımak zorunda kalmaması için vardır.

Derlenmiş çıktı ayrıca şunları da destekler:

- search/get akışları için ilk geçiş viki dizinleme
- sahip sayfalara geri bağlanan claim-id araması
- kompakt istem ekleri
- rapor/pano üretimi

## Panolar ve sağlık raporları

`render.createDashboards` etkinleştirildiğinde, derleme `reports/` altında panoları korur.

Yerleşik raporlar şunları içerir:

- `reports/open-questions.md`
- `reports/contradictions.md`
- `reports/low-confidence.md`
- `reports/claim-health.md`
- `reports/stale-pages.md`

Bu raporlar şu tür durumları izler:

- çelişki not kümelemeleri
- rakip iddia kümelemeleri
- yapılandırılmış kanıtı eksik iddialar
- düşük güvenli sayfalar ve iddialar
- bayat veya bilinmeyen tazelik durumu
- çözülmemiş sorular içeren sayfalar

## Arama ve erişim

`memory-wiki` iki arama arka ucunu destekler:

- `shared`: kullanılabiliyorsa paylaşılan bellek arama akışını kullan
- `local`: vikide yerel arama yap

Ayrıca üç corpus'u destekler:

- `wiki`
- `memory`
- `all`

Önemli davranışlar:

- `wiki_search` ve `wiki_get`, mümkün olduğunda ilk geçiş için derlenmiş özetleri kullanır
- iddia kimlikleri sahip sayfaya geri çözümlenebilir
- itirazlı/bayat/taze iddialar sıralamayı etkiler
- kaynak bilgisi etiketleri sonuçlara taşınabilir

Pratik kural:

- tek bir geniş geri çağırma geçişi için `memory_search corpus=all` kullanın
- vikiye özgü sıralama,
  kaynak bilgisi veya sayfa düzeyinde inanç yapısı önemliyse `wiki_search` + `wiki_get` kullanın

## Ajan araçları

Plugin şu araçları kaydeder:

- `wiki_status`
- `wiki_search`
- `wiki_get`
- `wiki_apply`
- `wiki_lint`

Ne yaptıkları:

- `wiki_status`: mevcut kasa modu, sağlık durumu, Obsidian CLI kullanılabilirliği
- `wiki_search`: viki sayfalarında ve yapılandırıldığında paylaşılan bellek corpus'larında arama yapar
- `wiki_get`: bir viki sayfasını id/path ile okur veya paylaşılan bellek corpus'una geri düşer
- `wiki_apply`: serbest biçimli sayfa cerrahisi olmadan dar kapsamlı sentez/meta veri değişiklikleri yapar
- `wiki_lint`: yapısal kontroller, kaynak bilgisi boşlukları, çelişkiler, açık sorular

Plugin ayrıca dışlayıcı olmayan bir bellek corpus eki kaydeder; böylece paylaşılan
`memory_search` ve `memory_get`, Active Memory Plugin'i corpus seçimini desteklediğinde vikiye erişebilir.

## İstem ve bağlam davranışı

`context.includeCompiledDigestPrompt` etkinleştirildiğinde, bellek istem bölümleri
`agent-digest.json` içinden kompakt bir derlenmiş anlık görüntü ekler.

Bu anlık görüntü bilerek küçük ve yüksek sinyallidir:

- yalnızca en üst sayfalar
- yalnızca en üst iddialar
- çelişki sayısı
- soru sayısı
- güven/tazelik niteleyicileri

Bu özellik isteğe bağlıdır çünkü istem yapısını değiştirir ve esas olarak
bağlam motorları veya bellek eklerini açıkça tüketen eski istem oluşturma
akışları için yararlıdır.

## Yapılandırma

Yapılandırmayı `plugins.entries.memory-wiki.config` altında girin:

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
- `bridge.readMemoryArtifacts`: Active Memory Plugin'i genel yapıtlarını içe aktar
- `bridge.followMemoryEvents`: köprü modunda olay günlüklerini dahil et
- `search.backend`: `shared` veya `local`
- `search.corpus`: `wiki`, `memory` veya `all`
- `context.includeCompiledDigestPrompt`: bellek istem bölümlerine kompakt özet anlık görüntüsü ekle
- `render.createBacklinks`: deterministik ilişkili bloklar üret
- `render.createDashboards`: pano sayfaları üret

### Örnek: QMD + köprü modu

QMD'yi geri çağırma için, `memory-wiki`yi ise bakımı yapılan bir
bilgi katmanı için istediğinizde bunu kullanın:

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

Bu yapı şunları korur:

- etkin bellek geri çağırmasından QMD'yi sorumlu tutar
- `memory-wiki`yi derlenmiş sayfalar ve panolara odaklı tutar
- siz özellikle derlenmiş özet istemlerini etkinleştirene kadar istem şeklini değiştirmez

## CLI

`memory-wiki` ayrıca üst düzey bir CLI yüzeyi de sunar:

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

Tam komut başvurusu için [CLI: wiki](/cli/wiki) bölümüne bakın.

## Obsidian desteği

`vault.renderMode` değeri `obsidian` olduğunda Plugin, Obsidian uyumlu
Markdown yazar ve isteğe bağlı olarak resmî `obsidian` CLI'ını kullanabilir.

Desteklenen iş akışları şunları içerir:

- durum yoklaması
- kasa araması
- bir sayfa açma
- bir Obsidian komutu çağırma
- günlük nota atlama

Bu isteğe bağlıdır. Viki, Obsidian olmadan da native modda çalışır.

## Önerilen iş akışı

1. Geri çağırma/yükseltme/Dreaming için Active Memory Plugin'inizi koruyun.
2. `memory-wiki`yi etkinleştirin.
3. Özellikle köprü modu istemiyorsanız `isolated` modla başlayın.
4. Kaynak bilgisi önemli olduğunda `wiki_search` / `wiki_get` kullanın.
5. Dar kapsamlı sentezler veya meta veri güncellemeleri için `wiki_apply` kullanın.
6. Anlamlı değişikliklerden sonra `wiki_lint` çalıştırın.
7. Bayatlık/çelişki görünürlüğü istiyorsanız panoları açın.

## İlgili dokümanlar

- [Memory Overview](/tr/concepts/memory)
- [CLI: memory](/cli/memory)
- [CLI: wiki](/cli/wiki)
- [Plugin SDK overview](/tr/plugins/sdk-overview)
