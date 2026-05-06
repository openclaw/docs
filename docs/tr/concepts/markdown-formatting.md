---
read_when:
    - Giden kanallar için Markdown biçimlendirmesini veya parçalara ayırmayı değiştiriyorsunuz
    - Yeni bir kanal biçimlendiricisi veya stil eşlemesi ekliyorsunuz
    - Kanallar genelindeki biçimlendirme regresyonlarında hata ayıklıyorsunuz
summary: Giden kanallar için Markdown biçimlendirme işlem hattı
title: Markdown biçimlendirmesi
x-i18n:
    generated_at: "2026-05-06T09:08:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: e9dcc75cec0462d610f2b5bbd258a2686b15eeb4b9d369ee4d7727571da7edcc
    source_path: concepts/markdown-formatting.md
    workflow: 16
---

OpenClaw, çıkış Markdown'ını kanala özgü çıktıyı oluşturmadan önce paylaşılan bir ara
temsile (IR) dönüştürerek biçimlendirir. IR, kaynak metni olduğu gibi korurken
stil/bağlantı aralıklarını taşır; böylece parçalara ayırma ve render işlemi
kanallar arasında tutarlı kalabilir.

## Hedefler

- **Tutarlılık:** tek ayrıştırma adımı, birden çok renderer.
- **Güvenli parçalara ayırma:** metni render işleminden önce bölerek satır içi biçimlendirmenin
  parçalar arasında bozulmasını önleme.
- **Kanala uygunluk:** aynı IR'yi Markdown'ı yeniden ayrıştırmadan Slack mrkdwn, Telegram HTML ve Signal
  stil aralıklarına eşleme.

## Pipeline

1. **Markdown'ı ayrıştır -> IR**
   - IR, düz metin ile stil aralıklarından (kalın/italik/üstü çizili/kod/spoiler) ve bağlantı aralıklarından oluşur.
   - Ofsetler UTF-16 kod birimleridir; böylece Signal stil aralıkları API'siyle hizalanır.
   - Tablolar yalnızca bir kanal tablo dönüştürmeyi etkinleştirdiğinde ayrıştırılır.
2. **IR'yi parçalara ayır (önce biçim)**
   - Parçalara ayırma, render işleminden önce IR metni üzerinde gerçekleşir.
   - Satır içi biçimlendirme parçalar arasında bölünmez; aralıklar her parça için dilimlenir.
3. **Kanal başına render et**
   - **Slack:** mrkdwn belirteçleri (kalın/italik/üstü çizili/kod), bağlantılar `<url|label>` olarak.
   - **Telegram:** HTML etiketleri (`<b>`, `<i>`, `<s>`, `<code>`, `<pre><code>`, `<a href>`).
   - **Signal:** düz metin + `text-style` aralıkları; etiket farklıysa bağlantılar `label (url)` olur.

## IR örneği

Girdi Markdown'ı:

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

- Slack, Telegram ve Signal çıkış bağdaştırıcıları IR'den render eder.
- Diğer kanallar (WhatsApp, iMessage, Microsoft Teams, Discord) hâlâ düz metin veya
  kendi biçimlendirme kurallarını kullanır; etkinleştirildiğinde Markdown tablo dönüştürme
  parçalara ayırmadan önce uygulanır.

## Tablo işleme

Markdown tabloları sohbet istemcileri arasında tutarlı şekilde desteklenmez.
Kanal başına (ve hesap başına) dönüştürmeyi denetlemek için `markdown.tables` kullanın.

- `code`: tabloları kod blokları olarak render et (çoğu kanal için varsayılan).
- `bullets`: her satırı madde işaretlerine dönüştür (Signal + WhatsApp için varsayılan).
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
- Kod blokları, kanalların doğru render etmesi için sonunda yeni satır bulunan tek bir blok olarak korunur.
- Liste önekleri ve alıntı bloğu önekleri IR metninin parçasıdır; bu yüzden parçalara ayırma
  önekin ortasında bölmez.
- Satır içi stiller (kalın/italik/üstü çizili/satır içi kod/spoiler) hiçbir zaman parçalar arasında
  bölünmez; renderer her parçanın içinde stilleri yeniden açar.

Kanallar arasında parçalara ayırma davranışı hakkında daha fazlasına ihtiyacınız varsa
[Streaming + parçalara ayırma](/tr/concepts/streaming) bölümüne bakın.

## Bağlantı ilkesi

- **Slack:** `[label](url)` -> `<url|label>`; çıplak URL'ler çıplak kalır. Çift bağlantılamayı
  önlemek için ayrıştırma sırasında otomatik bağlantı devre dışıdır.
- **Telegram:** `[label](url)` -> `<a href="url">label</a>` (HTML ayrıştırma modu).
- **Signal:** etiket URL ile eşleşmediği sürece `[label](url)` -> `label (url)`.

## Spoiler'lar

Spoiler işaretleri (`||spoiler||`) yalnızca Signal için ayrıştırılır; burada
SPOILER stil aralıklarına eşlenir. Diğer kanallar bunları düz metin olarak ele alır.

## Bir kanal biçimlendirici nasıl eklenir veya güncellenir

1. **Bir kez ayrıştır:** kanala uygun seçeneklerle (autolink, başlık stili, alıntı bloğu öneki)
   paylaşılan `markdownToIR(...)` yardımcısını kullanın.
2. **Render et:** `renderMarkdownWithMarkers(...)` ve bir stil işaretçisi eşlemesiyle
   (veya Signal stil aralıklarıyla) bir renderer uygulayın.
3. **Parçalara ayır:** render işleminden önce `chunkMarkdownIR(...)` çağırın; her parçayı render edin.
4. **Bağdaştırıcıyı bağla:** kanal çıkış bağdaştırıcısını yeni parçalara ayırıcıyı
   ve renderer'ı kullanacak şekilde güncelleyin.
5. **Test et:** kanal parçalara ayırmayı kullanıyorsa biçim testleri ve bir çıkış teslim testi ekleyin veya güncelleyin.

## Yaygın dikkat noktaları

- Slack açılı ayraç belirteçleri (`<@U123>`, `<#C123>`, `<https://...>`) korunmalıdır;
  ham HTML'yi güvenli şekilde kaçışlayın.
- Telegram HTML, bozuk işaretlemeyi önlemek için etiketlerin dışındaki metnin kaçışlanmasını gerektirir.
- Signal stil aralıkları UTF-16 ofsetlerine bağlıdır; kod noktası ofsetleri kullanmayın.
- Çitli kod blokları için sondaki yeni satırları koruyun; böylece kapanış işaretçileri
  kendi satırlarına denk gelir.

## İlgili

<CardGroup cols={2}>
  <Card title="Streaming ve parçalara ayırma" href="/tr/concepts/streaming" icon="bars-staggered">
    Çıkış Streaming davranışı, parça sınırları ve kanala özgü teslim.
  </Card>
  <Card title="Sistem istemi" href="/tr/concepts/system-prompt" icon="message-lines">
    Modele konuşmadan önce gösterilenler; enjekte edilen çalışma alanı dosyaları dahil.
  </Card>
</CardGroup>
