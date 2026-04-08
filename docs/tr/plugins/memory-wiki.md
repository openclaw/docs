---
read_when:
    - Düz MEMORY.md notlarının ötesinde kalıcı bilgi istiyorsanız
    - Paketlenmiş memory-wiki plugin'ini yapılandırıyorsanız
    - wiki_search, wiki_get veya bridge modunu anlamak istiyorsanız
summary: 'memory-wiki: kaynak, iddialar, panolar ve bridge modu içeren derlenmiş bilgi kasası'
title: Memory Wiki
x-i18n:
    generated_at: "2026-04-08T06:01:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: b78dd6a4ef4451dae6b53197bf0c7c2a2ba846b08e4a3a93c1026366b1598d82
    source_path: plugins/memory-wiki.md
    workflow: 15
---

# Memory Wiki

`memory-wiki`, dayanıklı belleği derlenmiş bir bilgi kasasına dönüştüren paketlenmiş bir plugin'dir.

Etkin bellek plugin'inin yerini **almaz**. Etkin bellek plugin'i geri çağırma, yükseltme, indeksleme ve düşleme işlerinin sahibi olmaya devam eder. `memory-wiki` onun yanında yer alır ve dayanıklı bilgiyi gezilebilir bir wikiye; deterministik sayfalar, yapılandırılmış iddialar, kaynak bilgisi, panolar ve makine tarafından okunabilir özetlerle derler.

Belleğin, bir Markdown dosyaları yığını gibi değil de daha çok bakımı yapılan bir bilgi katmanı gibi davranmasını istediğinizde bunu kullanın.

## Ne ekler

- Deterministik sayfa düzenine sahip özel bir wiki kasası
- Yalnızca düzyazı değil, yapılandırılmış iddia ve kanıt meta verileri
- Sayfa düzeyinde kaynak bilgisi, güven, çelişkiler ve açık sorular
- Aracı/çalışma zamanı tüketicileri için derlenmiş özetler
- Wiki'ye özgü search/get/apply/lint araçları
- Etkin bellek plugin'inden herkese açık yapıtları içe aktaran isteğe bağlı bridge modu
- İsteğe bağlı Obsidian uyumlu render modu ve CLI entegrasyonu

## Bellekle nasıl uyum sağlar

Ayrımı şöyle düşünün:

| Katman                                                  | Sahibi olduğu şeyler                                                                       |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Etkin bellek plugin'i (`memory-core`, QMD, Honcho vb.)  | Geri çağırma, anlamsal arama, yükseltme, düşleme, bellek çalışma zamanı                    |
| `memory-wiki`                                           | Derlenmiş wiki sayfaları, kaynak açısından zengin sentezler, panolar, wiki'ye özgü search/get/apply |

Etkin bellek plugin'i paylaşılan geri çağırma yapıtlarını sunuyorsa, OpenClaw `memory_search corpus=all` ile her iki katmanı da tek geçişte arayabilir.

Wiki'ye özgü sıralama, kaynak bilgisi veya doğrudan sayfa erişimi gerektiğinde bunun yerine wiki'ye özgü araçları kullanın.

## Kasa modları

`memory-wiki` üç kasa modunu destekler:

### `isolated`

Kendi kasası, kendi kaynakları, `memory-core` bağımlılığı yok.

Wiki'nin kendi küratörlüğü yapılmış bilgi deposu olmasını istiyorsanız bunu kullanın.

### `bridge`

Etkin bellek plugin'inden, herkese açık plugin SDK sınırları üzerinden herkese açık bellek yapıtlarını ve bellek olaylarını okur.

Wiki'nin, özel plugin iç yapılarına erişmeden bellek plugin'inin dışa aktardığı yapıtları derleyip düzenlemesini istiyorsanız bunu kullanın.

Bridge modu şunları indeksleyebilir:

- dışa aktarılan bellek yapıtları
- düş raporları
- günlük notlar
- bellek kök dosyaları
- bellek olay günlükleri

### `unsafe-local`

Yerel özel yollar için açık aynı-makine kaçış kapağı.

Bu mod kasıtlı olarak deneyseldir ve taşınabilir değildir. Bunu yalnızca güven sınırını anladığınızda ve özellikle bridge modunun sağlayamadığı yerel dosya sistemi erişimine ihtiyaç duyduğunuzda kullanın.

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

Yönetilen içerik, oluşturulan blokların içinde kalır. İnsan not blokları korunur.

Ana sayfa grupları şunlardır:

- içe aktarılan ham materyal ve bridge destekli sayfalar için `sources/`
- kalıcı şeyler, kişiler, sistemler, projeler ve nesneler için `entities/`
- fikirler, soyutlamalar, örüntüler ve ilkeler için `concepts/`
- derlenmiş özetler ve bakımı yapılan toplulaştırmalar için `syntheses/`
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

Wiki'nin pasif bir not dökümü yerine daha çok bir inanç katmanı gibi davranmasını sağlayan şey budur. İddialar izlenebilir, puanlanabilir, itiraz edilebilir ve tekrar kaynaklara bağlanarak çözülebilir.

## Derleme işlem hattı

Derleme adımı wiki sayfalarını okur, özetleri normalize eder ve şu konumların altında kararlı, makineye dönük yapıtlar üretir:

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

Bu özetler, aracıların ve çalışma zamanı kodunun Markdown sayfalarını kazımasına gerek kalmaması için vardır.

Derlenmiş çıktı ayrıca şunlara güç sağlar:

- search/get akışları için ilk geçiş wiki indeksleme
- sahip sayfalara geri iddia kimliği araması
- kompakt prompt ekleri
- rapor/pano üretimi

## Panolar ve sağlık raporları

`render.createDashboards` etkinleştirildiğinde derleme, `reports/` altında panoları korur.

Yerleşik raporlar şunları içerir:

- `reports/open-questions.md`
- `reports/contradictions.md`
- `reports/low-confidence.md`
- `reports/claim-health.md`
- `reports/stale-pages.md`

Bu raporlar şunları izler:

- çelişki not kümleri
- yarışan iddia kümeleri
- yapılandırılmış kanıtı olmayan iddialar
- düşük güvene sahip sayfalar ve iddialar
- bayat veya bilinmeyen tazelik
- çözülmemiş sorular içeren sayfalar

## Arama ve getirme

`memory-wiki` iki arama arka ucunu destekler:

- `shared`: varsa paylaşılan bellek arama akışını kullan
- `local`: wiki'yi yerelde ara

Ayrıca üç corpus'u destekler:

- `wiki`
- `memory`
- `all`

Önemli davranış:

- `wiki_search` ve `wiki_get`, mümkün olduğunda ilk geçiş olarak derlenmiş özetleri kullanır
- iddia kimlikleri sahip sayfaya geri çözümlenebilir
- itiraz edilmiş/bayat/taze iddialar sıralamayı etkiler
- kaynak etiketleri sonuçlara taşınabilir

Pratik kural:

- tek geniş geri çağırma geçişi için `memory_search corpus=all` kullanın
- wiki'ye özgü sıralama, kaynak bilgisi veya sayfa düzeyinde inanç yapısı sizin için önemliyse `wiki_search` + `wiki_get` kullanın

## Aracı araçları

Plugin şu araçları kaydeder:

- `wiki_status`
- `wiki_search`
- `wiki_get`
- `wiki_apply`
- `wiki_lint`

Yaptıkları işler:

- `wiki_status`: geçerli kasa modu, sağlık durumu, Obsidian CLI kullanılabilirliği
- `wiki_search`: wiki sayfalarını ve yapılandırılmışsa paylaşılan bellek corpus'larını arar
- `wiki_get`: bir wiki sayfasını id/path ile okur veya paylaşılan bellek corpus'una geri döner
- `wiki_apply`: serbest biçimli sayfa cerrahisi olmadan dar sentez/meta veri mutasyonları
- `wiki_lint`: yapısal denetimler, kaynak boşlukları, çelişkiler, açık sorular

Plugin ayrıca özel olmayan bir bellek corpus eki de kaydeder; böylece etkin bellek plugin'i corpus seçimini desteklediğinde paylaşılan `memory_search` ve `memory_get` wiki'ye erişebilir.

## Prompt ve bağlam davranışı

`context.includeCompiledDigestPrompt` etkinleştirildiğinde, bellek prompt bölümleri `agent-digest.json` içinden kompakt bir derlenmiş anlık görüntü ekler.

Bu anlık görüntü kasıtlı olarak küçük ve yüksek sinyallidir:

- yalnızca en üst sayfalar
- yalnızca en üst iddialar
- çelişki sayısı
- soru sayısı
- güven/tazelik niteleyicileri

Bu isteğe bağlıdır çünkü prompt şeklini değiştirir ve çoğunlukla bağlam motorları veya bellek eklerini açıkça tüketen eski prompt derleme yapıları için faydalıdır.

## Yapılandırma

Yapılandırmayı `plugins.entries.memory-wiki.config` altında koyun:

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
- `bridge.readMemoryArtifacts`: etkin bellek plugin'inin herkese açık yapıtlarını içe aktar
- `bridge.followMemoryEvents`: bridge modunda olay günlüklerini dahil et
- `search.backend`: `shared` veya `local`
- `search.corpus`: `wiki`, `memory` veya `all`
- `context.includeCompiledDigestPrompt`: bellek prompt bölümlerine kompakt özet anlık görüntüsünü ekle
- `render.createBacklinks`: deterministik ilgili bloklar oluştur
- `render.createDashboards`: pano sayfaları oluştur

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

Tam komut başvurusu için [CLI: wiki](/cli/wiki) bölümüne bakın.

## Obsidian desteği

`vault.renderMode` `obsidian` olduğunda plugin, Obsidian dostu Markdown yazar ve isteğe bağlı olarak resmî `obsidian` CLI'ını kullanabilir.

Desteklenen iş akışları şunları içerir:

- durum yoklaması
- kasa araması
- bir sayfayı açma
- bir Obsidian komutunu çağırma
- günlük nota atlama

Bu isteğe bağlıdır. Wiki, Obsidian olmadan yerel modda da çalışır.

## Önerilen iş akışı

1. Geri çağırma/yükseltme/düşleme için etkin bellek plugin'inizi koruyun.
2. `memory-wiki` etkinleştirin.
3. Özellikle bridge modu istemiyorsanız `isolated` moduyla başlayın.
4. Kaynak bilgisi önemliyse `wiki_search` / `wiki_get` kullanın.
5. Dar sentezler veya meta veri güncellemeleri için `wiki_apply` kullanın.
6. Anlamlı değişikliklerden sonra `wiki_lint` çalıştırın.
7. Bayatlık/çelişki görünürlüğü istiyorsanız panoları açın.

## İlgili belgeler

- [Belleğe Genel Bakış](/tr/concepts/memory)
- [CLI: memory](/cli/memory)
- [CLI: wiki](/cli/wiki)
- [Plugin SDK genel bakış](/tr/plugins/sdk-overview)
