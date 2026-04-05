---
read_when:
    - Giden kanallar için markdown biçimlendirmesini veya parçalara ayırmayı değiştiriyorsunuz
    - Yeni bir kanal biçimlendiricisi veya stil eşlemesi ekliyorsunuz
    - Kanallar arasında biçimlendirme gerilemelerini ayıklıyorsunuz
summary: Giden kanallar için Markdown biçimlendirme işlem hattı
title: Markdown Formatting
x-i18n:
    generated_at: "2026-04-05T13:50:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: f3794674e30e265208d14a986ba9bdc4ba52e0cb69c446094f95ca6c674e4566
    source_path: concepts/markdown-formatting.md
    workflow: 15
---

# Markdown biçimlendirme

OpenClaw, giden Markdown’ı kanala özgü çıktı oluşturmadan önce paylaşılan bir
ara gösterime (IR) dönüştürerek biçimlendirir. IR, kaynak metni olduğu gibi
korurken stil/bağlantı aralıklarını taşır; böylece parçalara ayırma ve işleme
kanallar arasında tutarlı kalabilir.

## Hedefler

- **Tutarlılık:** tek ayrıştırma adımı, birden çok işleyici.
- **Güvenli parçalara ayırma:** metni işlemeden önce bölün, böylece satır içi biçimlendirme hiçbir zaman
  parçalar arasında bozulmaz.
- **Kanala uyum:** aynı IR’yi yeniden Markdown ayrıştırması yapmadan Slack mrkdwn, Telegram HTML ve Signal
  stil aralıklarına eşleyin.

## İşlem hattı

1. **Markdown -> IR ayrıştır**
   - IR, düz metin ile stil aralıklarından (bold/italic/strike/code/spoiler) ve bağlantı aralıklarından oluşur.
   - Ofsetler UTF-16 kod birimleridir, böylece Signal stil aralıkları API’siyle hizalanır.
   - Tablolar yalnızca bir kanal tablo dönüştürmeyi seçtiğinde ayrıştırılır.
2. **IR’yi parçalara ayır (önce biçim)**
   - Parçalara ayırma, işlemden önce IR metni üzerinde gerçekleşir.
   - Satır içi biçimlendirme parçalar arasında bölünmez; aralıklar parça başına dilimlenir.
3. **Kanal başına işle**
   - **Slack:** mrkdwn belirteçleri (bold/italic/strike/code), bağlantılar `<url|label>` olarak.
   - **Telegram:** HTML etiketleri (`<b>`, `<i>`, `<s>`, `<code>`, `<pre><code>`, `<a href>`).
   - **Signal:** düz metin + `text-style` aralıkları; etiket farklı olduğunda bağlantılar `label (url)` olur.

## IR örneği

Girdi Markdown:

```markdown
Hello **world** — see [docs](https://docs.openclaw.ai).
```

IR (şematik):

```json
{
  "text": "Hello world — see docs.",
  "styles": [{ "start": 6, "end": 11, "style": "bold" }],
  "links": [{ "start": 19, "end": 23, "href": "https://docs.openclaw.ai" }]
}
```

## Nerede kullanılır

- Slack, Telegram ve Signal giden adaptörleri IR’den işlem yapar.
- Diğer kanallar (WhatsApp, iMessage, Microsoft Teams, Discord) hâlâ düz metin veya
  kendi biçimlendirme kurallarını kullanır; Markdown tablo dönüştürme etkinse
  parçalara ayırmadan önce uygulanır.

## Tablo işleme

Markdown tabloları sohbet istemcileri arasında tutarlı şekilde desteklenmez. Kanal başına
(ve hesap başına) dönüştürmeyi kontrol etmek için
`markdown.tables` kullanın.

- `code`: tabloları kod blokları olarak işle (çoğu kanal için varsayılan).
- `bullets`: her satırı madde işaretlerine dönüştür (Signal + WhatsApp için varsayılan).
- `off`: tablo ayrıştırmayı ve dönüştürmeyi devre dışı bırak; ham tablo metni olduğu gibi geçer.

Yapılandırma anahtarları:

```yaml
channels:
  discord:
    markdown:
      tables: code
    accounts:
      work:
        markdown:
          tables: off
```

## Parçalara ayırma kuralları

- Parça sınırları kanal adaptörlerinden/yapılandırmadan gelir ve IR metnine uygulanır.
- Kod çitleri, kanalların bunları doğru
  işlemesi için sondaki bir satır sonuyla birlikte tek bir blok olarak korunur.
- Liste önekleri ve blockquote önekleri IR metninin parçasıdır, bu yüzden parçalara ayırma
  öneğin ortasında bölünmez.
- Satır içi stiller (bold/italic/strike/inline-code/spoiler) hiçbir zaman
  parçalar arasında bölünmez; işleyici her parçanın içinde stilleri yeniden açar.

Kanallar arasında parçalara ayırma davranışı hakkında daha fazlasına ihtiyacınız varsa
[Streaming + chunking](/concepts/streaming) bölümüne bakın.

## Bağlantı ilkesi

- **Slack:** `[label](url)` -> `<url|label>`; yalın URL’ler yalın kalır. Çift bağlantı oluşmasını önlemek için
  ayrıştırma sırasında otomatik bağlantı kapatılır.
- **Telegram:** `[label](url)` -> `<a href="url">label</a>` (HTML ayrıştırma modu).
- **Signal:** etiket URL ile eşleşmediği sürece `[label](url)` -> `label (url)`.

## Spoiler’lar

Spoiler işaretleyicileri (`||spoiler||`) yalnızca Signal için ayrıştırılır; burada bunlar
SPOILER stil aralıklarına eşlenir. Diğer kanallar bunları düz metin olarak ele alır.

## Bir kanal biçimlendiricisi nasıl eklenir veya güncellenir

1. **Bir kez ayrıştır:** kanala uygun
   seçeneklerle (autolink, heading style, blockquote prefix) paylaşılan `markdownToIR(...)` yardımcısını kullanın.
2. **İşle:** `renderMarkdownWithMarkers(...)` ve bir
   stil işaretleyici eşlemesiyle (veya Signal stil aralıklarıyla) bir işleyici uygulayın.
3. **Parçalara ayır:** işlemden önce `chunkMarkdownIR(...)` çağırın; her parçayı işleyin.
4. **Adaptörü bağla:** yeni parçalayıcıyı
   ve işleyiciyi kullanacak şekilde kanal giden adaptörünü güncelleyin.
5. **Test et:** kanal
   parçalara ayırma kullanıyorsa biçim testleri ve bir giden teslim testi ekleyin veya güncelleyin.

## Yaygın dikkat edilmesi gerekenler

- Slack köşeli ayraç belirteçleri (`<@U123>`, `<#C123>`, `<https://...>`) korunmalıdır;
  ham HTML’yi güvenli biçimde escape edin.
- Telegram HTML, bozuk biçimlendirmeyi önlemek için etiket dışındaki metni escape etmeyi gerektirir.
- Signal stil aralıkları UTF-16 ofsetlerine bağlıdır; kod noktası ofsetleri kullanmayın.
- Kapanış işaretleyicilerinin
  kendi satırlarına gelmesi için fenced code block’lar için sondaki satır sonlarını koruyun.
