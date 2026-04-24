---
read_when:
    - Giden kanallar için Markdown biçimlendirmesini veya parçalamayı değiştiriyorsunuz
    - Yeni bir kanal biçimlendiricisi veya stil eşlemesi ekliyorsunuz
    - Kanallar arasında biçimlendirme gerilemelerini ayıklıyorsunuz
summary: Giden kanallar için Markdown biçimlendirme işlem hattı
title: Markdown biçimlendirme
x-i18n:
    generated_at: "2026-04-24T09:05:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: cf052e11fe9fd075a4337ffa555391c7003a346240b57bb65054c3f08401dfd9
    source_path: concepts/markdown-formatting.md
    workflow: 15
---

OpenClaw, giden Markdown'ı kanala özgü çıktıyı oluşturmadan önce paylaşılan bir ara gösterime (IR) dönüştürerek biçimlendirir. IR, kaynak metni bozulmadan tutarken stil/bağlantı aralıklarını taşır; böylece parçalama ve oluşturma kanallar arasında tutarlı kalabilir.

## Hedefler

- **Tutarlılık:** tek ayrıştırma adımı, birden fazla oluşturucu.
- **Güvenli parçalama:** satır içi biçimlendirme parçalar arasında asla bozulmasın diye metni oluşturmadan önce bölme.
- **Kanal uyumu:** aynı IR'yi Markdown'ı yeniden ayrıştırmadan Slack mrkdwn, Telegram HTML ve Signal stil aralıklarına eşleme.

## İşlem hattı

1. **Markdown -> IR ayrıştır**
   - IR, düz metin artı stil aralıkları (kalın/italik/üstü çizili/kod/spoiler) ve bağlantı aralıklarıdır.
   - Ofsetler UTF-16 kod birimleridir; böylece Signal stil aralıkları API'siyle hizalanır.
   - Tablolar yalnızca bir kanal tablo dönüştürmeyi seçtiğinde ayrıştırılır.
2. **IR'yi parçala (önce biçim)**
   - Parçalama, oluşturmadan önce IR metni üzerinde gerçekleşir.
   - Satır içi biçimlendirme parçalar arasında bölünmez; aralıklar parça başına dilimlenir.
3. **Kanal başına oluştur**
   - **Slack:** mrkdwn belirteçleri (kalın/italik/üstü çizili/kod), bağlantılar `<url|label>` olarak.
   - **Telegram:** HTML etiketleri (`<b>`, `<i>`, `<s>`, `<code>`, `<pre><code>`, `<a href>`).
   - **Signal:** düz metin + `text-style` aralıkları; etiket farklıysa bağlantılar `label (url)` olur.

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

## Kullanıldığı yerler

- Slack, Telegram ve Signal giden bağdaştırıcıları IR'den oluşturur.
- Diğer kanallar (WhatsApp, iMessage, Microsoft Teams, Discord) hâlâ düz metin veya kendi biçimlendirme kurallarını kullanır; etkinleştirildiğinde Markdown tablo dönüştürme parçalamadan önce uygulanır.

## Tablo işleme

Markdown tabloları sohbet istemcileri arasında tutarlı biçimde desteklenmez. Kanal başına (ve hesap başına) dönüştürmeyi denetlemek için `markdown.tables` kullanın.

- `code`: tabloları kod blokları olarak oluşturur (çoğu kanal için varsayılan).
- `bullets`: her satırı madde işaretlerine dönüştürür (Signal + WhatsApp için varsayılan).
- `off`: tablo ayrıştırma ve dönüştürmeyi devre dışı bırakır; ham tablo metni olduğu gibi geçer.

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

## Parçalama kuralları

- Parça sınırları kanal bağdaştırıcılarından/yapılandırmasından gelir ve IR metnine uygulanır.
- Kod çitleri, kanalların doğru oluşturabilmesi için sondaki yeni satırla birlikte tek bir blok olarak korunur.
- Liste önekleri ve alıntı bloğu önekleri IR metninin parçasıdır; bu yüzden parçalama önek ortasında bölünmez.
- Satır içi stiller (kalın/italik/üstü çizili/satır içi kod/spoiler) asla parçalar arasında bölünmez; oluşturucu stilleri her parçanın içinde yeniden açar.

Kanallar arasında parçalama davranışı hakkında daha fazla bilgiye ihtiyacınız varsa [Akış + parçalama](/tr/concepts/streaming) sayfasına bakın.

## Bağlantı ilkesi

- **Slack:** `[label](url)` -> `<url|label>`; çıplak URL'ler çıplak kalır. Çifte bağlantıyı önlemek için ayrıştırma sırasında otomatik bağlantı kapalıdır.
- **Telegram:** `[label](url)` -> `<a href="url">label</a>` (HTML ayrıştırma modu).
- **Signal:** `[label](url)` -> etiket URL ile eşleşmiyorsa `label (url)`.

## Spoiler'lar

Spoiler işaretleri (`||spoiler||`) yalnızca Signal için ayrıştırılır; burada SPOILER stil aralıklarına eşlenir. Diğer kanallar bunları düz metin olarak ele alır.

## Kanal biçimlendiricisi nasıl eklenir veya güncellenir

1. **Bir kez ayrıştırın:** kanala uygun seçeneklerle (otomatik bağlantı, başlık stili, alıntı bloğu öneki) paylaşılan `markdownToIR(...)` yardımcısını kullanın.
2. **Oluşturun:** `renderMarkdownWithMarkers(...)` ve bir stil işaretleyici eşlemesiyle (veya Signal stil aralıklarıyla) bir oluşturucu uygulayın.
3. **Parçalayın:** oluşturmadan önce `chunkMarkdownIR(...)` çağırın; her parçayı oluşturun.
4. **Bağdaştırıcıyı bağlayın:** kanal giden bağdaştırıcısını yeni parçalayıcı ve oluşturucuyu kullanacak şekilde güncelleyin.
5. **Test edin:** biçim testleri ekleyin veya güncelleyin ve kanal parçalama kullanıyorsa bir giden teslim testi ekleyin.

## Yaygın tuzaklar

- Slack köşeli ayraç belirteçleri (`<@U123>`, `<#C123>`, `<https://...>`) korunmalıdır; ham HTML'yi güvenli biçimde kaçışlayın.
- Telegram HTML, bozuk işaretlemeyi önlemek için etiket dışındaki metnin kaçışlanmasını gerektirir.
- Signal stil aralıkları UTF-16 ofsetlerine bağlıdır; kod noktası ofsetleri kullanmayın.
- Çitli kod blokları için sondaki yeni satırları koruyun; böylece kapanış işaretleri kendi satırlarına gelir.

## İlgili

- [Akış ve parçalama](/tr/concepts/streaming)
- [Sistem istemi](/tr/concepts/system-prompt)
