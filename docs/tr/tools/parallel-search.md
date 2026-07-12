---
read_when:
    - API anahtarı olmadan web araması yapmak istiyorsunuz
    - Parallel'ın ücretli Arama API'sini istiyorsunuz
    - LLM bağlam verimliliğine göre sıralanmış yoğun alıntılar istiyorsunuz
summary: Paralel Arama -- web kaynaklarından LLM için optimize edilmiş yoğun alıntılar
title: Paralel arama
x-i18n:
    generated_at: "2026-07-12T12:53:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eff693f286015b287bbdacf44f11ff6f07f2f7d2605ef6f09259e7402b40515e
    source_path: tools/parallel-search.md
    workflow: 16
---

Parallel Plugin, yapay zekâ ajanları için oluşturulmuş bir web dizininden sıralanmış, LLM için optimize edilmiş alıntılar döndüren iki [Parallel](https://parallel.ai/) `web_search`
sağlayıcısı sunar:

| Sağlayıcı              | id              | Kimlik doğrulama                                                                          |
| ---------------------- | --------------- | ------------------------------------------------------------------------------------------ |
| Parallel Search (Ücretsiz) | `parallel-free` | Yok -- Parallel'ın ücretsiz [Search MCP](https://docs.parallel.ai/integrations/mcp/search-mcp) hizmeti |
| Parallel Search        | `parallel`      | `PARALLEL_API_KEY` -- ücretli Search API, daha yüksek hız sınırları ve hedef ayarlama      |

Birini açıkça seçmek için `tools.web.search.provider` değerini `parallel-free`
veya `parallel` olarak ayarlayın; hiçbiri otomatik olarak algılanmaz.

<Note>
  Doğrudan OpenAI Responses modelleri (`api: "openai-responses"`, sağlayıcı
  `openai`, resmî API temel URL'si), `tools.web.search.provider` ayarlanmamış,
  boş, `"auto"` veya `"openai"` olduğunda OpenAI'ın barındırılan yerel web aramasını
  otomatik olarak kullanır; bu nedenle varsayılan olarak Parallel'ı atlar. Bunları
  bunun yerine Parallel üzerinden yönlendirmek için `tools.web.search.provider`
  değerini `parallel-free` veya `parallel` olarak ayarlayın. Bkz.
  [Web Aramasına genel bakış](/tr/tools/web).
</Note>

## Plugin'i yükleme

```bash
openclaw plugins install @openclaw/parallel-plugin
openclaw gateway restart
```

## API anahtarı (ücretli sağlayıcı)

`parallel-free` anahtar gerektirmez ancak yine de açıkça seçilmelidir. Ücretli
`parallel` sağlayıcısı bir API anahtarı gerektirir:

<Steps>
  <Step title="Hesap oluşturun">
    [platform.parallel.ai](https://platform.parallel.ai) adresinde kaydolun ve
    kontrol panelinizden bir API anahtarı oluşturun.
  </Step>
  <Step title="Anahtarı saklayın">
    Gateway ortamında `PARALLEL_API_KEY` değişkenini ayarlayın veya şununla yapılandırın:

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

## Yapılandırma

```json5
{
  plugins: {
    entries: {
      parallel: {
        config: {
          webSearch: {
            apiKey: "par-...", // PARALLEL_API_KEY ayarlanmışsa isteğe bağlı
            baseUrl: "https://api.parallel.ai", // isteğe bağlı; OpenClaw /v1/search ekler
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        // Ücretsiz Search MCP için "parallel-free" veya burada gösterilen
        // ücretli API destekli sağlayıcı için "parallel".
        provider: "parallel",
      },
    },
  },
}
```

**Ortam alternatifi:** Gateway ortamında `PARALLEL_API_KEY` değişkenini
ayarlayın. Bir Gateway kurulumu için bunu `~/.openclaw/.env` dosyasına ekleyin.

## Temel URL'yi geçersiz kılma

Yalnızca ücretli `parallel` sağlayıcısı için geçerlidir; `parallel-free` her
zaman `https://search.parallel.ai/mcp` adresini kullanır ve bu ayarı yok sayar.

Ücretli istekleri uyumlu bir proxy veya alternatif uç nokta (örneğin
Cloudflare AI Gateway) üzerinden yönlendirmek için
`plugins.entries.parallel.config.webSearch.baseUrl` değerini ayarlayın. OpenClaw,
yalın ana bilgisayarların başına `https://` ekleyerek bunları normalleştirir ve
yol zaten bununla bitmiyorsa `/v1/search` ekler. Çözümlenen uç nokta, arama
önbelleği anahtarının bir parçasıdır; bu nedenle farklı uç noktalardan gelen
sonuçlar hiçbir zaman paylaşılmaz.

## Araç parametreleri

Her iki sağlayıcı da Parallel'ın yerel arama biçimini sunar; böylece model,
doğal dilde bir hedefin yanı sıra birkaç kısa anahtar sözcük sorgusu girer.
Parallel, en iyi sonuçlar için bu eşleştirmeyi
[önerir](https://docs.parallel.ai/search/best-practices).

<ParamField path="objective" type="string" required>
Temel sorunun veya hedefin doğal dilde açıklaması (en fazla 5000 karakter).
Kendi başına anlaşılır olmalıdır.
</ParamField>

<ParamField path="search_queries" type="string[]" required>
Her biri 3-6 sözcükten oluşan kısa anahtar sözcük arama sorguları (1-5 girdi,
her biri en fazla 200 karakter). En iyi sonuçlar için birbirinden farklı 2-3
sorgu sağlayın.
</ParamField>

<ParamField path="count" type="number">
Döndürülecek sonuçlar (1-40).
</ParamField>

<ParamField path="session_id" type="string">
Önceki bir sonucun `sessionId` değerinden alınan isteğe bağlı Parallel oturum
kimliği. Parallel'ın ilişkili çağrıları gruplaması ve sonraki sonuçları
iyileştirmesi için aynı görevdeki takip aramalarında bunu iletin. `parallel`
için en fazla 1000 karakterdir; ücretsiz `parallel-free` Search MCP bunu 100
karakterle sınırlar. Sınırı aşan bir kimlik kaldırılır (ücretli) veya yeni bir
kimlik oluşturulur (ücretsiz).
</ParamField>

<ParamField path="client_model" type="string">
Çağrıyı yapan modelin isteğe bağlı tanımlayıcısı (ör. `claude-opus-4-7`,
`gpt-5.6-sol`), en fazla 100 karakter. Parallel'ın varsayılan ayarları
modelinizin yeteneklerine göre uyarlamasını sağlar. Etkin modelin tam kısa
adını iletin; bunu bir aile takma adına kısaltmayın.
</ParamField>

## Notlar

- Parallel, sonuçları insanların tıklaması için değil, LLM'in akıl yürütme
  açısından faydası için sıralar ve sıkıştırır; tam sayfa içerik yerine sonuç
  başına yoğun alıntılar bekleyin.
- Sonuç alıntıları `excerpts` dizisi olarak döner ve genel `web_search`
  sözleşmesiyle uyumluluk için `description` alanında da birleştirilir.
- Her iki sağlayıcı da bir `session_id` döndürür; OpenClaw, çağıranların takip
  aramalarını gruplandırabilmesi için bunu araç yükünde `sessionId` olarak
  sunar. Parallel tarafından oluşturulan bir oturum kimliği (çağıranın
  sağlamadığı bir kimlik), aynı sorgulara sahip ilgisiz görevlerin bunu
  devralmaması için önbellek girdisinin dışında tutulur.
- Parallel'dan gelen `searchId`, `warnings` ve `usage`, mevcut olduklarında
  aynen aktarılır.
- OpenClaw, çözümlenen sonuç sayısını her zaman Parallel'a
  `advanced_settings.max_results` (`parallel`) olarak iletir veya Parallel'ın
  sabit boyutlu yanıtından sonra `count` değerini istemci tarafında uygular
  (`parallel-free`). Önce çağıranın `count` argümanı, ardından
  `tools.web.search.maxResults` geçerli olur; aksi durumda OpenClaw'ın genel
  `web_search` varsayılanı (5) kullanılır. Parallel'ın kendi API'sinin
  varsayılanı 10'dur.
- Sonuçlar varsayılan olarak 15 dakika önbelleğe alınır (`cacheTtlMinutes`).
- Çağıran bir değer sağlamadığında `parallel-free`, MCP el sıkışması
  aracılığıyla her çağrı için yeni bir `session_id` oluşturur; `parallel` ise
  bu durumda değeri ayarlanmamış bırakır.

## İlgili içerikler

- [Web Aramasına genel bakış](/tr/tools/web) -- tüm sağlayıcılar ve otomatik algılama
- [Exa araması](/tr/tools/exa-search) -- içerik çıkarma özellikli sinir ağı tabanlı arama
- [Perplexity Search](/tr/tools/perplexity-search) -- alan adı filtrelemeli yapılandırılmış sonuçlar
