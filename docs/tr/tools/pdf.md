---
read_when:
    - Ajanlardan PDF'leri analiz etmek istiyorsunuz
    - Tam pdf aracı parametrelerine ve sınırlarına ihtiyacınız var
    - Yerel PDF modu ile çıkarım geri dönüşünü hata ayıklıyorsunuz
summary: Bir veya daha fazla PDF belgesini yerel sağlayıcı desteği ve çıkarım geri dönüşüyle analiz edin
title: PDF Aracı
x-i18n:
    generated_at: "2026-04-05T14:13:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: d7aaaa7107d7920e7c31f3e38ac19411706e646186acf520bc02f2c3e49c0517
    source_path: tools/pdf.md
    workflow: 15
---

# PDF aracı

`pdf`, bir veya daha fazla PDF belgesini analiz eder ve metin döndürür.

Hızlı davranış özeti:

- Anthropic ve Google model sağlayıcıları için yerel sağlayıcı modu.
- Diğer sağlayıcılar için çıkarım geri dönüş modu (önce metin çıkarılır, gerektiğinde sayfa görselleri kullanılır).
- Tekli (`pdf`) veya çoklu (`pdfs`) girişi destekler, çağrı başına en fazla 10 PDF.

## Kullanılabilirlik

Araç yalnızca OpenClaw ajan için PDF destekli bir model yapılandırmasını çözümleyebildiğinde kaydedilir:

1. `agents.defaults.pdfModel`
2. geri dönüş olarak `agents.defaults.imageModel`
3. geri dönüş olarak ajanın çözümlenmiş oturum/varsayılan modeli
4. yerel PDF sağlayıcıları kimlik doğrulama destekliyse, genel görsel geri dönüş adaylarından önce bunları tercih edin

Kullanılabilir bir model çözümlenemezse `pdf` aracı gösterilmez.

Kullanılabilirlik notları:

- Geri dönüş zinciri kimlik doğrulama farkındadır. Yapılandırılmış bir `provider/model` yalnızca OpenClaw bu sağlayıcı için ajan adına gerçekten kimlik doğrulaması yapabiliyorsa sayılır.
- Yerel PDF sağlayıcıları şu anda **Anthropic** ve **Google**'dır.
- Çözümlenen oturum/varsayılan sağlayıcıda zaten yapılandırılmış bir vision/PDF modeli varsa, PDF aracı diğer kimlik doğrulama destekli sağlayıcılara geri dönmeden önce bunu yeniden kullanır.

## Girdi başvurusu

- `pdf` (`string`): bir PDF yolu veya URL'si
- `pdfs` (`string[]`): en fazla toplam 10 olmak üzere birden çok PDF yolu veya URL'si
- `prompt` (`string`): analiz istemi, varsayılan `Analyze this PDF document.`
- `pages` (`string`): `1-5` veya `1,3,7-9` gibi sayfa filtresi
- `model` (`string`): isteğe bağlı model geçersiz kılma (`provider/model`)
- `maxBytesMb` (`number`): PDF başına MB cinsinden boyut sınırı

Girdi notları:

- `pdf` ve `pdfs`, yüklemeden önce birleştirilir ve yinelenenler kaldırılır.
- PDF girdisi sağlanmazsa araç hata verir.
- `pages`, 1 tabanlı sayfa numaraları olarak ayrıştırılır, yinelenenler kaldırılır, sıralanır ve yapılandırılmış azami sayfa sayısıyla sınırlandırılır.
- `maxBytesMb` varsayılan olarak `agents.defaults.pdfMaxBytesMb` veya `10` olur.

## Desteklenen PDF başvuruları

- yerel dosya yolu (`~` genişletmesi dahil)
- `file://` URL'si
- `http://` ve `https://` URL'si

Başvuru notları:

- Diğer URI şemaları (örneğin `ftp://`) `unsupported_pdf_reference` ile reddedilir.
- Sandbox modunda uzak `http(s)` URL'leri reddedilir.
- Yalnızca çalışma alanı dosya ilkesi etkinse, izin verilen köklerin dışındaki yerel dosya yolları reddedilir.

## Yürütme modları

### Yerel sağlayıcı modu

Yerel mod, `anthropic` ve `google` sağlayıcısı için kullanılır.
Araç ham PDF baytlarını doğrudan sağlayıcı API'lerine gönderir.

Yerel mod sınırları:

- `pages` desteklenmez. Ayarlanırsa araç bir hata döndürür.
- Çoklu PDF girdisi desteklenir; her PDF istemden önce yerel bir belge bloğu / satır içi PDF parçası olarak gönderilir.

### Çıkarım geri dönüş modu

Geri dönüş modu, yerel olmayan sağlayıcılar için kullanılır.

Akış:

1. Seçilen sayfalardan metin çıkarın (en fazla `agents.defaults.pdfMaxPages`, varsayılan `20`).
2. Çıkarılan metin uzunluğu `200` karakterin altındaysa, seçilen sayfaları PNG görsellerine dönüştürün ve ekleyin.
3. Çıkarılan içerik ile istemi seçilen modele gönderin.

Geri dönüş ayrıntıları:

- Sayfa görseli çıkarımı `4,000,000` piksellik bir bütçe kullanır.
- Hedef model görsel girdisini desteklemiyorsa ve çıkarılabilir metin yoksa araç hata verir.
- Metin çıkarımı başarılıysa ancak görsel çıkarımı yalnızca metin destekleyen bir modelde vision gerektiriyorsa, OpenClaw işlenen görselleri çıkarır ve çıkarılan metinle devam eder.
- Çıkarım geri dönüşü `pdfjs-dist` gerektirir (ve görsel işleme için `@napi-rs/canvas`).

## Yapılandırma

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

Tam alan ayrıntıları için [Yapılandırma Başvurusu](/tr/gateway/configuration-reference) bölümüne bakın.

## Çıktı ayrıntıları

Araç, `content[0].text` içinde metin ve `details` içinde yapılandırılmış meta veriler döndürür.

Yaygın `details` alanları:

- `model`: çözümlenen model başvurusu (`provider/model`)
- `native`: yerel sağlayıcı modu için `true`, geri dönüş için `false`
- `attempts`: başarıdan önce başarısız olan geri dönüş denemeleri

Yol alanları:

- tek PDF girdisi: `details.pdf`
- çoklu PDF girdileri: `pdf` girdileriyle `details.pdfs[]`
- sandbox yol yeniden yazma meta verileri (uygulanabiliyorsa): `rewrittenFrom`

## Hata davranışı

- Eksik PDF girdisi: `pdf required: provide a path or URL to a PDF document` fırlatır
- Çok fazla PDF: `details.error = "too_many_pdfs"` içinde yapılandırılmış hata döndürür
- Desteklenmeyen başvuru şeması: `details.error = "unsupported_pdf_reference"` döndürür
- `pages` ile yerel mod: anlaşılır `pages is not supported with native PDF providers` hatası fırlatır

## Örnekler

Tek PDF:

```json
{
  "pdf": "/tmp/report.pdf",
  "prompt": "Summarize this report in 5 bullets"
}
```

Birden çok PDF:

```json
{
  "pdfs": ["/tmp/q1.pdf", "/tmp/q2.pdf"],
  "prompt": "Compare risks and timeline changes across both documents"
}
```

Sayfa filtreli geri dönüş modeli:

```json
{
  "pdf": "https://example.com/report.pdf",
  "pages": "1-3,7",
  "model": "openai/gpt-5.4-mini",
  "prompt": "Extract only customer-impacting incidents"
}
```

## İlgili

- [Araçlara Genel Bakış](/tr/tools) — mevcut tüm ajan araçları
- [Yapılandırma Başvurusu](/tr/gateway/configuration-reference#agent-defaults) — pdfMaxBytesMb ve pdfMaxPages yapılandırması
