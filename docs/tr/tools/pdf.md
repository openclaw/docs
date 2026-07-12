---
read_when:
    - Ajanlardan gelen PDF'leri analiz etmek istiyorsunuz
    - Tam PDF aracı parametrelerine ve sınırlarına ihtiyacınız var
    - Yerel PDF modu ile ayıklama geri dönüşü arasındaki farkın hatalarını ayıklıyorsunuz
summary: Yerel sağlayıcı desteği ve ayıklama geri dönüşüyle bir veya daha fazla PDF belgesini analiz edin
title: PDF aracı
x-i18n:
    generated_at: "2026-07-12T12:49:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 54bde94a2b70fd209c70c13a1e75dc81c6cbebca7f6d56776bf37fa62cd78254
    source_path: tools/pdf.md
    workflow: 16
---

`pdf`, bir veya daha fazla PDF belgesini analiz eder ve metin döndürür. Anthropic ve Google modellerinde yerel belge girdisini kullanır; diğer tüm sağlayıcılarda ise metin/görüntü ayıklamaya geri döner.

## Kullanılabilirlik

Araç yalnızca OpenClaw, agent için PDF özellikli bir model çözümleyebildiğinde kaydedilir. Çözümleme sırası:

1. `agents.defaults.pdfModel` (açıkça belirtilen birincil/yedek modeller)
2. `agents.defaults.imageModel` (açıkça belirtilen birincil/yedek modeller)
3. Sağlayıcısı yerel PDF girdisini destekliyorsa (Anthropic, Google) veya yapılandırılmış bir görsel modeli zaten varsa agent'ın çözümlenmiş oturum/varsayılan modeli
4. Önce yerel PDF sağlayıcıları tercih edilerek, kullanılabilir kimlik doğrulamasına sahip otomatik algılanmış görüntü/görsel özellikli sağlayıcılar

Her yedek aday kullanılmadan önce kimlik doğrulaması açısından denetlenir; dolayısıyla yapılandırılmış bir `provider/model`, yalnızca OpenClaw ilgili sağlayıcıda agent için kimlik doğrulaması yapabiliyorsa geçerli sayılır. Kullanılabilir bir model çözümlenemezse `pdf` aracı kullanıma sunulmaz.

## Girdi başvurusu

<ParamField path="pdf" type="string">
Tek bir PDF yolu veya URL'si.
</ParamField>

<ParamField path="pdfs" type="string[]">
Toplamda en fazla 10 olmak üzere birden fazla PDF yolu veya URL'si.
</ParamField>

<ParamField path="prompt" type="string" default="Analyze this PDF document.">
Analiz istemi.
</ParamField>

<ParamField path="pages" type="string">
`1-5` veya `1,3,7-9` gibi sayfa filtresi. Yerel sağlayıcı modunda desteklenmez.
</ParamField>

<ParamField path="password" type="string">
Şifrelenmiş PDF'lerin parolası. İstekteki tüm PDF'lere uygulanır; yalnızca ayıklama yedek modunda kullanılır.
</ParamField>

<ParamField path="model" type="string">
`provider/model` biçiminde isteğe bağlı model geçersiz kılma değeri.
</ParamField>

<ParamField path="maxBytesMb" type="number">
PDF başına MB cinsinden boyut sınırı. Varsayılan olarak `agents.defaults.pdfMaxBytesMb`, ayarlanmamışsa `10` kullanılır.
</ParamField>

Notlar:

- `pdf` ve `pdfs`, yüklemeden önce birleştirilir ve yinelenenler kaldırılır; en az biri gereklidir.
- `pages`, 1 tabanlı sayfa numaraları olarak ayrıştırılır; yinelenenler kaldırılır, sıralanır ve `agents.defaults.pdfMaxPages` (varsayılan `20`) değerine göre sınırlandırılır. Sınırlar içindeki hiçbir sayfayla eşleşmeyen bir aralık, model çağrısından önce hataya neden olur.

## Desteklenen PDF başvuruları

- Yerel dosya yolu (`~` genişletmesi dâhil)
- `file://` URL'si
- `http://` ve `https://` URL'si
- `media://inbound/<id>` gibi OpenClaw tarafından yönetilen gelen başvurular

Diğer URI şemaları (örneğin `ftp://`) `details.error = "unsupported_pdf_reference"` döndürür. Araç korumalı alanda çalıştırıldığında uzak `http(s)` URL'leri reddedilir. Yalnızca çalışma alanına izin veren dosya ilkesi etkinse izin verilen köklerin dışındaki yerel yollar reddedilir; OpenClaw'ın gelen medya deposundaki yönetilen gelen başvurulara ve yeniden oynatılan yollara yine izin verilir.

## Yürütme modları

### Yerel sağlayıcı modu

`anthropic` ve `google` sağlayıcıları için kullanılır (şu anda yerel PDF belgesi desteği bildiren tek sağlayıcılar). Ham PDF baytları, dosya başına yerel belge/satır içi PDF parçası olarak doğrudan sağlayıcı API'sine gönderilir.

Sınırlar:

- `pages` desteklenmez; ayarlanırsa araç `pages is not supported with native PDF providers` hatasını verir.
- `password` desteklenmez; ayarlanırsa araç `password is not supported with native PDF providers` hatasını verir. Şifrelenmiş PDF'ler için yerel olmayan bir model kullanın.

### Ayıklama yedek modu

Diğer tüm sağlayıcılar için kullanılır.

1. Metin ve görüntü ayıklama amacıyla `clawpdf` paketini (PDFium WebAssembly) kullanan, paketle birlikte sunulan `document-extract` Plugin'i aracılığıyla seçili sayfalardan (`agents.defaults.pdfMaxPages` değerine kadar, varsayılan `20`) metni ayıklayın.
2. Ayıklanan metin `200` karakterden kısaysa aynı sayfaları PNG görüntülerine dönüştürün. Görüntü oluşturma bütçesi toplam `4,000,000` pikseldir ve görüntü gerektiren tüm sayfalar arasında paylaşılır (sayfa başına değil, kalan sayfa başına orantılı olarak tahsis edilir); bu nedenle zaten yeterli metin içeren sayfalar görüntü oluşturma işlemini tamamen atlar.
3. Ayıklanan metni (ve oluşturulan görüntüleri) istemle birlikte seçili modele gönderin.

Ayrıntılar:

- Şifrelenmiş PDF'ler üst düzey `password` parametresiyle açılır.
- Model görüntü girdisini desteklemiyorsa ve ayıklanabilir metin yoksa araç hata verir.
- Görüntü oluşturma başarısız olursa OpenClaw görüntüleri çıkarır ve ayıklanan metinle devam eder.
- Hedef model yalnızca metin destekliyorsa ve ayıklama görüntü ürettiyse OpenClaw görüntüleri çıkarır ve yalnızca metni gönderir.

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

| Anahtar                         | Varsayılan     | Anlamı                                                                                                             |
| ------------------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------ |
| `agents.defaults.pdfModel`      | ayarlanmamış   | Açıkça belirtilen birincil/yedek PDF modelleri; `imageModel`'e, ardından oturum modeline geri döner.                |
| `agents.defaults.pdfMaxBytesMb` | `10`           | PDF başına MB cinsinden boyut sınırı.                                                                               |
| `agents.defaults.pdfMaxPages`   | `20`           | PDF başına işlenen en fazla sayfa sayısı.                                                                           |

Tüm alan ayrıntıları için [Yapılandırma Başvurusu](/tr/gateway/config-agents#agent-defaults) bölümüne bakın.

## Çıktı ayrıntıları

Araç, `content[0].text` içinde metin ve `details` içinde yapılandırılmış meta veriler döndürür.

Yaygın `details` alanları:

- `model`: çözümlenen model başvurusu (`provider/model`)
- `native`: yerel sağlayıcı modu için `true`, yedek mod için `false`
- `attempts`: başarıdan önce başarısız olan yedek denemeleri

Yol alanları:

- Tek PDF girdisi: `details.pdf`
- Birden fazla PDF girdisi: `pdf` girdileri içeren `details.pdfs[]`
- Korumalı alan yolunu yeniden yazma meta verileri (uygun olduğunda): `rewrittenFrom`

## Hata davranışı

| Koşul                            | Sonuç                                                          |
| -------------------------------- | -------------------------------------------------------------- |
| PDF girdisi yok                  | `pdf required: provide a path or URL to a PDF document` hatasını verir |
| 10'dan fazla PDF                 | `details.error = "too_many_pdfs"`                              |
| Desteklenmeyen başvuru şeması    | `details.error = "unsupported_pdf_reference"`                  |
| Yerel sağlayıcıyla `pages`       | `pages is not supported with native PDF providers` hatasını verir |
| Yerel sağlayıcıyla `password`    | `password is not supported with native PDF providers` hatasını verir |

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

Sayfa filtreli yedek model:

```json
{
  "pdf": "https://example.com/report.pdf",
  "pages": "1-3,7",
  "model": "openai/gpt-5.4-mini",
  "prompt": "Extract only customer-impacting incidents"
}
```

Ayıklama yedeğiyle şifrelenmiş PDF:

```json
{
  "pdf": "/tmp/locked.pdf",
  "password": "example-password",
  "model": "openai/gpt-5.4-mini",
  "prompt": "Summarize this contract"
}
```

## İlgili

- [Araçlara Genel Bakış](/tr/tools) - kullanılabilir tüm agent araçları
- [Yapılandırma Başvurusu](/tr/gateway/config-agents#agent-defaults) - pdfMaxBytesMb ve pdfMaxPages yapılandırması
