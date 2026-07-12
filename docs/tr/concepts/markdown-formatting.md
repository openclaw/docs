---
read_when:
    - Giden kanallar için Markdown biçimlendirmesini veya parçalamayı değiştiriyorsunuz
    - Yeni bir kanal biçimlendiricisi veya stil eşlemesi ekliyorsunuz
    - Kanallar genelindeki biçimlendirme gerilemelerinde hata ayıklıyorsunuz
summary: Giden kanallar için Markdown biçimlendirme işlem hattı
title: Markdown biçimlendirmesi
x-i18n:
    generated_at: "2026-07-12T12:14:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f9a35fd9a6386068e1e3bec73ec6e692f49239b468f42dd737f919b1c6a88e41
    source_path: concepts/markdown-formatting.md
    workflow: 16
---

OpenClaw, kanala özgü çıktıyı oluşturmadan önce giden Markdown içeriğini ortak bir ara gösterime
(IR) dönüştürür. IR, düz metni biçem/bağlantı aralıklarıyla birlikte tutar; böylece tek bir ayrıştırma
adımı tüm kanalları besler ve parçalara ayırma işlemi biçimlendirmeyi hiçbir zaman bir aralığın
ortasından bölmez.

## İşlem hattı

1. **Markdown'ı IR'ye ayrıştırma** (`markdownToIR`) - düz metin ile biçem aralıkları
   (kalın, italik, üstü çizili, kod, kod bloğu, spoiler, blok alıntı,
   1-6 düzey başlık) ve bağlantı aralıkları. Konumlar UTF-16 kod birimleriyle belirtilir; böylece Signal biçem
   aralıkları doğrudan API'siyle hizalanır. Tablolar yalnızca kanal
   bir tablo modunu etkinleştirdiğinde ayrıştırılır.
2. **IR'yi parçalara ayırma** (`chunkMarkdownIR` / `renderMarkdownIRChunksWithinLimit`)
   - bölme işlemi oluşturmadan önce IR metni üzerinde gerçekleşir; böylece satır içi biçemler ve
     bağlantılar bir sınırda kopmak yerine her parça için dilimlenir.
3. **Kanala göre oluşturma** (`renderMarkdownWithMarkers`) - bir biçem işaretçisi eşlemesi,
   aralıkları kanalın yerel işaretlemesine dönüştürür.

| Kanal                                                            | Oluşturucu                                                                           | Notlar                                                                                   |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------- |
| Slack                                                            | mrkdwn belirteçleri (`*kalın*`, `_italik_`, `` `kod` ``, kod çitleri)                | Bağlantılar `<url\|etiket>` biçimine dönüşür; çift bağlantılandırmayı önlemek için ayrıştırma sırasında otomatik bağlantı devre dışıdır |
| Telegram                                                         | HTML etiketleri (`<b>`, `<i>`, `<s>`, `<code>`, `<pre><code>`, `<a href>`, `<tg-spoiler>`) | `richMessages` açıkken zengin ileti tablolarını ve başlıkları (`<h1>`-`<h6>`) da destekler |
| Signal                                                           | düz metin + `text-style` aralıkları                                                   | Etiket URL'den farklıysa bağlantılar `etiket (url)` biçiminde oluşturulur                |
| Discord, WhatsApp, iMessage, Microsoft Teams ve diğer kanallar   | düz metin                                                                            | IR tabanlı biçemlendirme yoktur; Markdown tablo dönüşümü yine `convertMarkdownTables` aracılığıyla çalışır |

## IR örneği

Girdi Markdown'ı:
__OC_I18N_900000__
IR (şematik):
__OC_I18N_900001__
## Tablo işleme

`markdown.tables`, bir kanalın Markdown tablolarını kanal ve isteğe bağlı olarak hesap
bazında nasıl dönüştüreceğini denetler:

| Mod       | Davranış                                                                             |
| --------- | ------------------------------------------------------------------------------------ |
| `code`    | Kod bloğu içinde hizalanmış bir ASCII tablosu olarak oluşturur (varsayılan geri dönüş) |
| `bullets` | Her satırı `etiket: değer` madde işaretlerine dönüştürür                              |
| `block`   | Aktarım destekliyorsa yerel tabloları korur; aksi durumda `code` moduna geri döner    |
| `off`     | Tablo ayrıştırmayı devre dışı bırakır; ham tablo metni değiştirilmeden geçirilir      |

Kanal bazlı Plugin varsayılanları: Signal, WhatsApp ve Matrix varsayılan olarak
`bullets`; Mattermost varsayılan olarak `off`; Telegram varsayılan olarak `block` kullanır (hesapta
`richMessages` etkin değilse `code` olarak çözümlenir). Açık bir Plugin varsayılanı
olmayan tüm kanallar `code` moduna geri döner.
__OC_I18N_900002__
## Parçalara ayırma kuralları

- Parça sınırları kanal adaptörlerinden/yapılandırmasından gelir ve oluşturulan
  çıktıya değil IR metnine uygulanır.
- Çitli kod blokları, kanalların kapanış çitini doğru biçimde oluşturabilmesi için
  sonunda yeni satır bulunan tek bir blok olarak tutulur.
- Liste ve blok alıntı önekleri IR metninin parçasıdır; bu nedenle parçalara ayırma
  işlemi hiçbir zaman önekin ortasından bölmez.
- Satır içi biçemler hiçbir zaman parçalar arasında bölünmez; oluşturucu, açık bir
  biçemi sonraki parçanın başında yeniden açar.

Kanallar arasındaki parça sınırı ve teslim davranışı için [Akış ve parçalara ayırma](/concepts/streaming)
bölümüne bakın.

## Bağlantı politikası

- **Slack:** `[etiket](url)` -> `<url|etiket>`; yalın URL'ler yalın kalır.
- **Telegram:** `[etiket](url)` -> `<a href="url">etiket</a>` (HTML ayrıştırma modu).
- **Signal:** Etiket zaten URL ile eşleşmiyorsa `[etiket](url)` -> `etiket (url)`.

## Spoiler'lar

Spoiler işaretçileri (`||spoiler||`) Signal için (`SPOILER`
biçem aralıklarına eşlenir) ve Telegram için (`<tg-spoiler>` öğesine eşlenir) ayrıştırılır. Diğer kanallar
`||...||` ifadesini düz metin olarak değerlendirir.

## Kanal biçimlendiricisi ekleme veya güncelleme

1. Kanala uygun seçenekleri (`autolink`, `headingStyle`, `blockquotePrefix`, `tableMode`)
   geçirerek `markdownToIR(...)` ile **bir kez ayrıştırın**.
2. `renderMarkdownWithMarkers(...)` ve bir biçem işaretçisi eşlemesiyle **oluşturun** (veya
   Signal gibi aktarımlar için özel biçem aralığı mantığı kullanın).
3. Her parçayı oluşturmadan önce `chunkMarkdownIR(...)` veya
   `renderMarkdownIRChunksWithinLimit(...)` ile **parçalara ayırın**.
4. **Adaptörü bağlayarak** giden gönderim yolundan yeni parçalayıcıyı ve oluşturucuyu
   çağırmasını sağlayın.
5. Biçim testleriyle ve kanal parçalara ayırıyorsa bir giden teslim testiyle **test edin**.

## Yaygın sorunlar

- Slack açılı ayraç belirteçleri (`<@U123>`, `<#C123>`, `<https://...>`)
  kaçış işleminden etkilenmemelidir; ham HTML yine de güvenli biçimde kaçırılmalıdır.
- Telegram HTML'sinde işaretlemenin bozulmasını önlemek için etiketlerin dışındaki metin kaçırılmalıdır.
- Signal biçem aralıkları kod noktası konumlarını değil, UTF-16 konumlarını kullanır.
- Kapanış işaretçisinin kendi satırında yer alması için çitli kod bloklarının sonundaki
  yeni satırları koruyun.

## İlgili

<CardGroup cols={2}>
  <Card title="Akış ve parçalara ayırma" href="/tr/concepts/streaming" icon="bars-staggered">
    Giden akış davranışı, parça sınırları ve kanala özgü teslim.
  </Card>
  <Card title="Sistem istemi" href="/tr/concepts/system-prompt" icon="message-lines">
    Eklenen çalışma alanı dosyaları dahil olmak üzere modelin konuşmadan önce gördükleri.
  </Card>
</CardGroup>
