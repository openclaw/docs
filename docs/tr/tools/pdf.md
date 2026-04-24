---
read_when:
    - Aracılardan PDF'leri analiz etmek istiyorsunuz
    - Tam `pdf` araç parametrelerine ve sınırlamalarına ihtiyacınız var
    - Yerel PDF modu ile çıkarım fallback'ini hata ayıklıyorsunuz
summary: Yerel sağlayıcı desteği ve çıkarım fallback'i ile bir veya daha fazla PDF belgeyi analiz edin
title: PDF aracı
x-i18n:
    generated_at: "2026-04-24T09:36:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 945838d1e1164a15720ca76eb156f9f299bf7f603f4591c8fa557b43e4cc93a8
    source_path: tools/pdf.md
    workflow: 15
---

`pdf`, bir veya daha fazla PDF belgeyi analiz eder ve metin döndürür.

Hızlı davranış özeti:

- Anthropic ve Google model sağlayıcıları için yerel sağlayıcı modu.
- Diğer sağlayıcılar için çıkarım fallback modu (önce metni çıkarır, gerektiğinde sayfa görsellerini kullanır).
- Tekli (`pdf`) veya çoklu (`pdfs`) girişi destekler, çağrı başına en fazla 10 PDF.

## Kullanılabilirlik

Araç yalnızca OpenClaw aracı için PDF yetenekli bir model config'ini çözebildiğinde kaydedilir:

1. `agents.defaults.pdfModel`
2. fallback olarak `agents.defaults.imageModel`
3. fallback olarak aracının çözümlenmiş session/default modeli
4. yerel PDF sağlayıcıları auth destekliyse, genel görsel fallback adaylarının önünde tercih edilirler

Kullanılabilir bir model çözümlenemezse `pdf` aracı açığa çıkarılmaz.

Kullanılabilirlik notları:

- Fallback zinciri auth farkındalığına sahiptir. Yapılandırılmış bir `provider/model`, yalnızca
  OpenClaw o sağlayıcı için aracı adına gerçekten kimlik doğrulayabiliyorsa sayılır.
- Yerel PDF sağlayıcıları şu anda yalnızca **Anthropic** ve **Google**'dır.
- Çözümlenmiş session/default sağlayıcı zaten yapılandırılmış bir vision/PDF
  modeline sahipse, PDF aracı diğer auth destekli sağlayıcılara fallback yapmadan
  önce bunu yeniden kullanır.

## Girdi başvurusu

<ParamField path="pdf" type="string">
Bir PDF yolu veya URL'si.
</ParamField>

<ParamField path="pdfs" type="string[]">
Birden fazla PDF yolu veya URL'si, toplam en fazla 10.
</ParamField>

<ParamField path="prompt" type="string" default="Analyze this PDF document.">
Analiz prompt'u.
</ParamField>

<ParamField path="pages" type="string">
`1-5` veya `1,3,7-9` gibi sayfa filtresi.
</ParamField>

<ParamField path="model" type="string">
`provider/model` biçiminde isteğe bağlı model geçersiz kılması.
</ParamField>

<ParamField path="maxBytesMb" type="number">
PDF başına MB cinsinden boyut sınırı. Varsayılan olarak `agents.defaults.pdfMaxBytesMb` veya `10`.
</ParamField>

Girdi notları:

- `pdf` ile `pdfs`, yüklemeden önce birleştirilir ve yinelenenler kaldırılır.
- Hiç PDF girdisi verilmezse araç hata verir.
- `pages`, 1 tabanlı sayfa numaraları olarak ayrıştırılır, yinelenenler kaldırılır, sıralanır ve yapılandırılmış azami sayfa sayısına kırpılır.
- `maxBytesMb`, varsayılan olarak `agents.defaults.pdfMaxBytesMb` veya `10` olur.

## Desteklenen PDF başvuruları

- yerel dosya yolu (`~` genişletmesi dahil)
- `file://` URL
- `http://` ve `https://` URL

Başvuru notları:

- Diğer URI şemaları (örneğin `ftp://`) `unsupported_pdf_reference` ile reddedilir.
- Sandbox modunda uzak `http(s)` URL'leri reddedilir.
- Yalnızca workspace dosya politikası etkin olduğunda, izin verilen köklerin dışındaki yerel dosya yolları reddedilir.

## Yürütme modları

### Yerel sağlayıcı modu

Yerel mod, `anthropic` ve `google` sağlayıcıları için kullanılır.
Araç, ham PDF baytlarını doğrudan sağlayıcı API'lerine gönderir.

Yerel mod sınırları:

- `pages` desteklenmez. Ayarlanırsa araç hata döndürür.
- Çoklu PDF girdisi desteklenir; her PDF, prompt'tan önce yerel bir belge bloğu /
  satır içi PDF parçası olarak gönderilir.

### Çıkarım fallback modu

Fallback modu, yerel olmayan sağlayıcılar için kullanılır.

Akış:

1. Seçilen sayfalardan metni çıkarır (`agents.defaults.pdfMaxPages` değerine kadar, varsayılan `20`).
2. Çıkarılan metin uzunluğu `200` karakterin altındaysa, seçilen sayfaları PNG görsellerine render eder ve ekler.
3. Çıkarılan içeriği prompt ile birlikte seçilen modele gönderir.

Fallback ayrıntıları:

- Sayfa görseli çıkarımı `4,000,000` piksellik bir bütçe kullanır.
- Hedef model görsel girdisini desteklemiyorsa ve çıkarılabilir metin yoksa araç hata verir.
- Metin çıkarımı başarılıysa ancak görsel çıkarımı metin-only bir modelde vision gerektiriyorsa,
  OpenClaw render edilen görselleri bırakır ve çıkarılan metinle devam eder.
- Çıkarım fallback'i `pdfjs-dist` (ve görsel render için `@napi-rs/canvas`) gerektirir.

## Config

```json5
{
  agents: {
    defaults: {
      pdfModel: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["openai/gpt-5.4-mini"],
      },
      pdfMaxBytesMb: 10,
      pdfMaxPages: 20,
    },
  },
}
```

Tam alan ayrıntıları için bkz. [Configuration Reference](/tr/gateway/configuration-reference).

## Çıktı ayrıntıları

Araç, `content[0].text` içinde metin ve `details` içinde yapılandırılmış meta veri döndürür.

Yaygın `details` alanları:

- `model`: çözümlenmiş model ref'i (`provider/model`)
- `native`: yerel sağlayıcı modu için `true`, fallback için `false`
- `attempts`: başarıdan önce başarısız olan fallback denemeleri

Yol alanları:

- tek PDF girdisi: `details.pdf`
- çoklu PDF girdileri: `pdf` girdileriyle `details.pdfs[]`
- sandbox yol yeniden yazım meta verisi (uygulanıyorsa): `rewrittenFrom`

## Hata davranışı

- Eksik PDF girdisi: `pdf required: provide a path or URL to a PDF document` fırlatır
- Çok fazla PDF: `details.error = "too_many_pdfs"` içinde yapılandırılmış hata döndürür
- Desteklenmeyen başvuru şeması: `details.error = "unsupported_pdf_reference"` döndürür
- `pages` ile yerel mod: açık `pages is not supported with native PDF providers` hatası fırlatır

## Örnekler

Tek PDF:

```json
{
  "pdf": "/tmp/report.pdf",
  "prompt": "Summarize this report in 5 bullets"
}
```

Birden fazla PDF:

```json
{
  "pdfs": ["/tmp/q1.pdf", "/tmp/q2.pdf"],
  "prompt": "Compare risks and timeline changes across both documents"
}
```

Sayfa filtreli fallback model:

```json
{
  "pdf": "https://example.com/report.pdf",
  "pages": "1-3,7",
  "model": "openai/gpt-5.4-mini",
  "prompt": "Extract only customer-impacting incidents"
}
```

## İlgili

- [Tools Overview](/tr/tools) — mevcut tüm aracı araçları
- [Configuration Reference](/tr/gateway/config-agents#agent-defaults) — `pdfMaxBytesMb` ve `pdfMaxPages` config'i
