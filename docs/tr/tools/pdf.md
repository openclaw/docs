---
read_when:
    - Ajanlardan gelen PDF'leri analiz etmek istiyorsunuz
    - Kesin PDF aracı parametrelerine ve sınırlarına ihtiyacınız var
    - Yerel PDF modu ile çıkarma fallback'ini hata ayıklıyorsunuz
summary: Yerel sağlayıcı desteği ve çıkarma yedeğiyle bir veya daha fazla PDF belgesini analiz edin
title: PDF aracı
x-i18n:
    generated_at: "2026-06-28T01:24:40Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6cce4328a7457f30b8c64abdcfa94b6a5d5649c2bcdfde3187288b11a0e154b1
    source_path: tools/pdf.md
    workflow: 16
---

`pdf`, bir veya daha fazla PDF belgesini analiz eder ve metin döndürür.

Hızlı davranış:

- Anthropic ve Google model sağlayıcıları için yerel sağlayıcı modu.
- Diğer sağlayıcılar için çıkarma geri dönüş modu (önce metni, gerektiğinde sayfa görüntülerini çıkarır).
- Tek (`pdf`) veya çoklu (`pdfs`) girişi destekler; çağrı başına en fazla 10 PDF.

## Kullanılabilirlik

Araç yalnızca OpenClaw, ajan için PDF özellikli bir model yapılandırmasını çözümleyebildiğinde kaydedilir:

1. `agents.defaults.pdfModel`
2. `agents.defaults.imageModel` değerine geri dönüş
3. ajanın çözümlenmiş oturum/varsayılan modeline geri dönüş
4. yerel PDF sağlayıcıları kimlik doğrulama destekliyse, genel görüntü geri dönüş adaylarından önce onları tercih et

Kullanılabilir bir model çözümlenemezse `pdf` aracı sunulmaz.

Kullanılabilirlik notları:

- Geri dönüş zinciri kimlik doğrulamanın farkındadır. Yapılandırılmış bir `provider/model` yalnızca
  OpenClaw o sağlayıcıda ajan için gerçekten kimlik doğrulayabiliyorsa sayılır.
- Yerel PDF sağlayıcıları şu anda **Anthropic** ve **Google**dır.
- Çözümlenmiş oturum/varsayılan sağlayıcının zaten yapılandırılmış bir görme/PDF
  modeli varsa PDF aracı, diğer kimlik doğrulama destekli
  sağlayıcılara geri dönmeden önce bunu yeniden kullanır.

## Girdi referansı

<ParamField path="pdf" type="string">
Bir PDF yolu veya URL'si.
</ParamField>

<ParamField path="pdfs" type="string[]">
Toplamda en fazla 10 olmak üzere birden fazla PDF yolu veya URL'si.
</ParamField>

<ParamField path="prompt" type="string" default="Analyze this PDF document.">
Analiz istemi.
</ParamField>

<ParamField path="pages" type="string">
`1-5` veya `1,3,7-9` gibi sayfa filtresi.
</ParamField>

<ParamField path="password" type="string">
Çıkarma geri dönüş modunda şifrelenmiş PDF'ler için parola.
</ParamField>

<ParamField path="model" type="string">
`provider/model` biçiminde isteğe bağlı model geçersiz kılması.
</ParamField>

<ParamField path="maxBytesMb" type="number">
PDF başına MB cinsinden boyut sınırı. Varsayılan olarak `agents.defaults.pdfMaxBytesMb` veya `10` kullanılır.
</ParamField>

Girdi notları:

- `pdf` ve `pdfs`, yüklemeden önce birleştirilir ve yinelenenler kaldırılır.
- PDF girdisi sağlanmazsa araç hata verir.
- `pages`, 1 tabanlı sayfa numaraları olarak ayrıştırılır; yinelenenler kaldırılır, sıralanır ve yapılandırılmış maksimum sayfa sayısına sınırlandırılır.
- `password`, istekteki her PDF için geçerlidir ve yalnızca çıkarma geri dönüş modu tarafından kullanılır.
- `maxBytesMb` varsayılan olarak `agents.defaults.pdfMaxBytesMb` veya `10` kullanır.

## Desteklenen PDF referansları

- yerel dosya yolu (`~` genişletmesi dahil)
- `file://` URL'si
- `http://` ve `https://` URL'si
- `media://inbound/<id>` gibi OpenClaw tarafından yönetilen gelen referanslar

Referans notları:

- Diğer URI şemaları (örneğin `ftp://`) `unsupported_pdf_reference` ile reddedilir.
- Sandbox modunda, uzak `http(s)` URL'leri reddedilir.
- Yalnızca çalışma alanı dosya ilkesi etkinleştirildiğinde, izin verilen köklerin dışındaki yerel dosya yolları reddedilir.
- OpenClaw'ın gelen medya deposu altındaki yönetilen gelen referanslara ve yeniden oynatılan yollara, yalnızca çalışma alanı dosya ilkesiyle izin verilir.

## Çalıştırma modları

### Yerel sağlayıcı modu

Yerel mod, `anthropic` ve `google` sağlayıcıları için kullanılır.
Araç, ham PDF baytlarını doğrudan sağlayıcı API'lerine gönderir.

Yerel mod sınırları:

- `pages` desteklenmez. Ayarlanırsa araç hata döndürür.
- `password` desteklenmez. Şifrelenmiş PDF'leri analiz etmek için yerel olmayan bir model kullanın.
- Çoklu PDF girdisi desteklenir; her PDF, istemden önce yerel belge bloğu /
  satır içi PDF parçası olarak gönderilir.

### Çıkarma geri dönüş modu

Geri dönüş modu, yerel olmayan sağlayıcılar için kullanılır.

Akış:

1. Seçilen sayfalardan metin çıkar (`agents.defaults.pdfMaxPages` değerine kadar, varsayılan `20`).
2. Çıkarılan metin uzunluğu `200` karakterin altındaysa, seçilen sayfaları PNG görüntülerine dönüştür ve dahil et.
3. Çıkarılan içeriği ve istemi seçilen modele gönder.

Geri dönüş ayrıntıları:

- Sayfa görüntüsü çıkarma, `4,000,000` piksel bütçesi kullanır.
- Şifrelenmiş PDF'ler üst düzey `password` parametresiyle açılabilir.
- Hedef model görüntü girişini desteklemiyorsa ve çıkarılabilir metin yoksa araç hata verir.
- Metin çıkarma başarılı olursa ancak görüntü çıkarma yalnızca metin destekleyen bir modelde görme gerektirirse,
  OpenClaw oluşturulan görüntüleri bırakır ve çıkarılan metinle devam eder.
- Çıkarma geri dönüşü, paketlenmiş `document-extract` Plugin'ini kullanır. Plugin,
  PDFium WebAssembly aracılığıyla metin çıkarma ve görüntü oluşturma sağlayan
  `clawpdf` öğesinin sahibidir.

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

Tüm alan ayrıntıları için [Yapılandırma Referansı](/tr/gateway/configuration-reference) bölümüne bakın.

## Çıktı ayrıntıları

Araç, metni `content[0].text` içinde ve yapılandırılmış meta verileri `details` içinde döndürür.

Yaygın `details` alanları:

- `model`: çözümlenmiş model referansı (`provider/model`)
- `native`: yerel sağlayıcı modu için `true`, geri dönüş için `false`
- `attempts`: başarıdan önce başarısız olan geri dönüş denemeleri

Yol alanları:

- tek PDF girdisi: `details.pdf`
- birden fazla PDF girdisi: `pdf` girdileriyle `details.pdfs[]`
- sandbox yolu yeniden yazma meta verileri (geçerli olduğunda): `rewrittenFrom`

## Hata davranışı

- Eksik PDF girdisi: `pdf required: provide a path or URL to a PDF document` fırlatır
- Çok fazla PDF: `details.error = "too_many_pdfs"` içinde yapılandırılmış hata döndürür
- Desteklenmeyen referans şeması: `details.error = "unsupported_pdf_reference"` döndürür
- `pages` ile yerel mod: açık bir `pages is not supported with native PDF providers` hatası fırlatır

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

Sayfa filtreli geri dönüş modeli:

```json
{
  "pdf": "https://example.com/report.pdf",
  "pages": "1-3,7",
  "model": "openai/gpt-5.4-mini",
  "prompt": "Extract only customer-impacting incidents"
}
```

Çıkarma geri dönüşüyle şifrelenmiş PDF:

```json
{
  "pdf": "/tmp/locked.pdf",
  "password": "example-password",
  "model": "openai/gpt-5.4-mini",
  "prompt": "Summarize this contract"
}
```

## İlgili

- [Araçlara Genel Bakış](/tr/tools) - kullanılabilir tüm ajan araçları
- [Yapılandırma Referansı](/tr/gateway/config-agents#agent-defaults) - pdfMaxBytesMb ve pdfMaxPages yapılandırması
