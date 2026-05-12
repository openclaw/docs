---
read_when:
    - Giden kanallar için Markdown biçimlendirmesini veya parçalamayı değiştiriyorsunuz
    - Yeni bir kanal biçimlendiricisi veya stil eşlemesi ekliyorsunuz
    - Kanallar genelinde biçimlendirme regresyonlarında hata ayıklıyorsunuz
summary: Giden kanallar için Markdown biçimlendirme işlem hattı
title: Markdown biçimlendirmesi
x-i18n:
    generated_at: "2026-05-12T12:50:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8db92aaf1063ebcbd8630dfcb8ca0a4e9eeb1c64f5b8868bf11c836777180515
    source_path: concepts/markdown-formatting.md
    workflow: 16
---

OpenClaw, kanala özgü çıktıyı işlemeden önce giden Markdown içeriğini paylaşılan bir ara temsile (IR) dönüştürerek biçimlendirir. IR, kaynak metni olduğu gibi korurken stil/bağlantı aralıklarını taşır; böylece parçalara ayırma ve işleme kanallar arasında tutarlı kalabilir.

## Hedefler

- **Tutarlılık:** tek ayrıştırma adımı, birden çok işleyici.
- **Güvenli parçalara ayırma:** metni işlemeden önce bölerek satır içi biçimlendirmenin parçalar arasında asla bozulmamasını sağlama.
- **Kanala uyum:** aynı IR'yi Markdown yeniden ayrıştırılmadan Slack mrkdwn, Telegram HTML ve Signal stil aralıklarına eşleme.

## İş hattı

1. **Markdown ayrıştır -> IR**
   - IR, düz metin artı stil aralıkları (kalın/italik/üstü çizili/kod/spoiler) ve bağlantı aralıklarından oluşur.
   - Ofsetler UTF-16 kod birimleridir, böylece Signal stil aralıkları API'siyle hizalanır.
   - Tablolar yalnızca bir kanal tablo dönüştürmeyi seçtiğinde ayrıştırılır.
2. **IR'yi parçalara ayır (önce biçim)**
   - Parçalara ayırma, işlemeden önce IR metni üzerinde gerçekleşir.
   - Satır içi biçimlendirme parçalar arasında bölünmez; aralıklar parça başına dilimlenir.
3. **Kanal başına işle**
   - **Slack:** mrkdwn belirteçleri (kalın/italik/üstü çizili/kod), bağlantılar `<url|label>` olarak.
   - **Telegram:** HTML etiketleri (`<b>`, `<i>`, `<s>`, `<code>`, `<pre><code>`, `<a href>`).
   - **Signal:** düz metin + `text-style` aralıkları; etiket farklıysa bağlantılar `label (url)` olur.

## IR örneği

Girdi Markdown:

```markdown
Hello **world** - see [docs](https://docs.openclaw.ai).
```

IR (şematik):

```json
{
  "text": "Hello world - see docs.",
  "styles": [{ "start": 6, "end": 11, "style": "bold" }],
  "links": [{ "start": 19, "end": 23, "href": "https://docs.openclaw.ai" }]
}
```

## Nerede kullanılır

- Slack, Telegram ve Signal giden bağdaştırıcıları IR'den işler.
- Diğer kanallar (WhatsApp, iMessage, Microsoft Teams, Discord) hâlâ düz metin veya kendi biçimlendirme kurallarını kullanır; etkinleştirildiğinde Markdown tablo dönüştürme, parçalara ayırmadan önce uygulanır.

## Tablo işleme

Markdown tabloları sohbet istemcileri arasında tutarlı şekilde desteklenmez. Kanal başına (ve hesap başına) dönüştürmeyi kontrol etmek için `markdown.tables` kullanın.

- `code`: tabloları kod blokları olarak işler (çoğu kanal için varsayılan).
- `bullets`: her satırı madde işaretlerine dönüştürür (Matrix, Signal ve WhatsApp için varsayılan).
- `off`: tablo ayrıştırmayı ve dönüştürmeyi devre dışı bırakır; ham tablo metni olduğu gibi geçer.

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

- Parça sınırları kanal bağdaştırıcılarından/yapılandırmadan gelir ve IR metnine uygulanır.
- Kod çitleri, kanalların bunları doğru işlemesi için sonunda satır sonu olan tek bir blok olarak korunur.
- Liste önekleri ve blok alıntı önekleri IR metninin parçasıdır, bu yüzden parçalara ayırma önek ortasında bölmez.
- Satır içi stiller (kalın/italik/üstü çizili/satır içi kod/spoiler) parçalar arasında asla bölünmez; işleyici her parçanın içinde stilleri yeniden açar.

Kanallar arasında parçalara ayırma davranışı hakkında daha fazlasına ihtiyacınız varsa bkz.
[Streaming + chunking](/tr/concepts/streaming).

## Bağlantı ilkesi

- **Slack:** `[label](url)` -> `<url|label>`; çıplak URL'ler çıplak kalır. Çift bağlantı oluşturmayı önlemek için ayrıştırma sırasında otomatik bağlantı devre dışıdır.
- **Telegram:** `[label](url)` -> `<a href="url">label</a>` (HTML ayrıştırma modu).
- **Signal:** etiket URL ile eşleşmediği sürece `[label](url)` -> `label (url)`.

## Spoilerlar

Spoiler işaretleri (`||spoiler||`) yalnızca Signal için ayrıştırılır; burada SPOILER stil aralıklarına eşlenir. Diğer kanallar bunları düz metin olarak ele alır.

## Kanal biçimlendiricisi ekleme veya güncelleme

1. **Bir kez ayrıştır:** kanala uygun seçeneklerle (otomatik bağlantı, başlık stili, blok alıntı öneki) paylaşılan `markdownToIR(...)` yardımcısını kullanın.
2. **İşle:** `renderMarkdownWithMarkers(...)` ve bir stil işareti haritası (veya Signal stil aralıkları) ile bir işleyici uygulayın.
3. **Parçalara ayır:** işlemeden önce `chunkMarkdownIR(...)` çağırın; her parçayı işleyin.
4. **Bağdaştırıcıyı bağla:** yeni parçalayıcıyı ve işleyiciyi kullanmak için kanal giden bağdaştırıcısını güncelleyin.
5. **Test et:** kanal parçalara ayırma kullanıyorsa biçim testleri ve bir giden teslimat testi ekleyin veya güncelleyin.

## Sık karşılaşılan tuzaklar

- Slack açılı ayraç belirteçleri (`<@U123>`, `<#C123>`, `<https://...>`) korunmalıdır; ham HTML'yi güvenli şekilde kaçışlayın.
- Telegram HTML, bozuk işaretlemeyi önlemek için etiket dışındaki metnin kaçışlanmasını gerektirir.
- Signal stil aralıkları UTF-16 ofsetlerine bağlıdır; kod noktası ofsetleri kullanmayın.
- Çitli kod blokları için sondaki satır sonlarını koruyun, böylece kapanış işaretleri kendi satırlarına yerleşir.

## İlgili

<CardGroup cols={2}>
  <Card title="Streaming ve parçalara ayırma" href="/tr/concepts/streaming" icon="bars-staggered">
    Giden streaming davranışı, parça sınırları ve kanala özgü teslimat.
  </Card>
  <Card title="Sistem istemi" href="/tr/concepts/system-prompt" icon="message-lines">
    Enjekte edilen çalışma alanı dosyaları dahil, modelin konuşmadan önce gördükleri.
  </Card>
</CardGroup>
