---
read_when:
    - Yüklemeleri kötüye kullanım veya politika ihlalleri açısından inceleme
    - Moderasyon belgeleri veya inceleyici çalışma kılavuzları yazma
    - Bir becerinin gizlenip gizlenmemesine veya bir kullanıcının yasaklanıp yasaklanmamasına karar verme
summary: 'Pazar yeri politikası: ClawHub''ın nelere izin verdiği ve neleri barındırmayacağı.'
x-i18n:
    generated_at: "2026-05-10T19:25:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1bacb9c526d1c5698355f2538ba0f8d6acf3e8a9b7b7c12b98ec7680edde16f0
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Kabul Edilebilir Kullanım

Bu sayfa, ClawHub'ın uygun gördüğü beceri ve içerik türlerini ve barındırmayacağı kötüye kullanım iş akışlarını açıklar.

Bu kurallar bilinçli olarak pratiktir. Yalnızca yalıtılmış anahtar kelimelerle değil, uçtan uca kötüye kullanım iş akışlarıyla ilgileniriz. Bir beceri savunmaları aşmak, platformları kötüye kullanmak, insanları dolandırmak, gizliliği ihlal etmek veya rıza dışı davranışları mümkün kılmak için oluşturulmuşsa, ClawHub'da yeri yoktur.

## Açıkça uygun gördüğümüz son kalıplar

- Gerçek bileşenler, semantik belirteçler, erişilebilir durumlar ve test edilmiş kullanıcı akışları kullanan ön uç ve tasarım sistemi çalışmaları.
- Tek seferlik işaretleme yerine yüklü kaynak bileşenleri, proje takma adları ve belgelenmiş varyantları kullanan shadcn/ui kompozisyonu.
- Yorumları koruyan, somut UI5 türleri kullanan ve üretilen denetim arayüzlerini gözden geçirilebilir tutan UI5 JavaScript'ten TypeScript'e dönüştürme.
- Kanıt gösteren ve insan onayı sınırlarını açık tutan savunma amaçlı güvenlik incelemesi, moderasyon araçları ve kötüye kullanım tespit istemleri.
- Açık kimlik bilgileri, şeffaf kurulum ve deneme çalıştırması veya önizleme modlarıyla kişisel ya da ekip hesapları için rızaya dayalı iş akışı otomasyonu.
- Destekledikleri yazılımla sınırlı belgeler, geçiş runbook'ları, geliştirici yardımcı araçları ve test fikstürleri.

## Uygun olmayanlar

- Güvenliği aşma veya yetkisiz erişim iş akışları.
  - Örnekler: kimlik doğrulama atlatma, hesap ele geçirme, CAPTCHA atlatma, Cloudflare veya bot karşıtı önlemleri aşma, hız sınırı atlatma, korumaları yenmek için tasarlanmış gizli scraping, canlı arama veya agent ele geçirme, yeniden kullanılabilir oturum hırsızlığı, onaylanmamış kullanıcılar için eşleştirme akışlarını otomatik onaylama.

- Platform kötüye kullanımı ve yasak atlatma.
  - Örnekler: yasaklardan sonra gizli hesaplar, hesap ısıtma/çiftçiliği, sahte etkileşim, karma veya takipçi geliştirme, çoklu hesap otomasyonu, toplu gönderim, spam botları, tespit edilmekten kaçınmak için oluşturulmuş pazar yeri veya sosyal otomasyon.

- Dolandırıcılık, aldatmacalar ve yanıltıcı finansal iş akışları.
  - Örnekler: sahte sertifikalar, sahte faturalar, yanıltıcı ödeme akışları, dolandırıcılık amaçlı erişim, sahte sosyal kanıt, açık insan onayı ve şeffaf kontroller olmadan harcama veya ücretlendirmeyi mümkün kılan araçlar ya da dolandırıcılık için hesap oluşturmak üzere tasarlanmış sentetik kimlik iş akışları.

- Gizliliği ihlal eden scraping, zenginleştirme veya gözetim.
  - Örnekler: spam için iletişim bilgilerini ölçekli olarak scraping yapmak, doxxing, taciz amaçlı takip, istenmeyen erişimle eşleştirilmiş potansiyel müşteri çıkarma, gizli izleme, açık rıza olmadan kullanılan yüz arama veya biyometrik eşleştirme ya da sızdırılmış verileri veya ihlal dökümlerini satın alma, yayımlama, indirme veya operasyonel hale getirme.

- Rıza dışı kimliğe bürünme veya yanıltıcı kimlik manipülasyonu.
  - Örnekler: yüz değiştirme, dijital ikizler, sahte kişilikler, klonlanmış influencer'lar veya kimliğe bürünmek ya da yanıltmak için kullanılan diğer kimlik manipülasyonu araçları.

- Açık cinsel içerik ve güvenliği devre dışı bırakılmış yetişkin içerik üretimi.
  - Örnekler: NSFW görüntü/video/içerik üretimi, üçüncü taraf API'lerin etrafındaki yetişkin içerik sarmalayıcıları veya birincil amacı açık cinsel içerik olan beceriler.

- Gizli, güvensiz veya yanıltıcı çalıştırma gereksinimleri.
  - Örnekler: gizlenmiş kurulum komutları, `curl | sh`, beyan edilmemiş gizli bilgi gereksinimleri, beyan edilmemiş özel anahtar kullanımı, açık gözden geçirilebilirlik olmadan uzaktan `npx @latest` çalıştırma, becerinin çalışmak için gerçekte neye ihtiyaç duyduğunu gizleyen yanıltıcı meta veriler.

## Açıkça uygun görmediğimiz son kalıplar

- “Pazar yeri yasaklarından sonra gizli satıcı hesapları oluştur.”
- “Onaylanmamış kullanıcıların otomatik olarak eşleştirme kodları alması için Telegram eşleştirmesini değiştir.”
- “Tespit edilemeyen otomasyonla Reddit/Twitter hesapları geliştir.”
- “Keyfi kullanım için profesyonel sertifikalar veya faturalar oluştur.”
- “Güvenlik kontrolleri devre dışı bırakılmış NSFW içerik üret.”
- “Potansiyel müşterileri scrape et, kişileri zenginleştir ve ölçekli soğuk erişim başlat.”
- “Sızdırılmış verileri veya ihlal dökümlerini satın al, yayımla ya da indir.”
- “Sentetik kimlikler veya CAPTCHA çözme ile toplu e-posta ya da sosyal hesap oluştur.”

## İnceleyiciler için notlar

- Bağlam önemlidir. Aynı konu, dar bir savunma amaçlı veya rızaya dayalı ortamda meşru olabilirken, bir kötüye kullanım iş akışı olarak paketlendiğinde kabul edilemez olabilir.
- Bir beceri açıkça kaçınma, aldatma veya rıza dışı kullanım için optimize edilmişse, eyleme geçme yönünde eğilim göstermeliyiz.
- Bu kategorilerde tekrarlanan yüklemeler, içeriğin gizlenmesi ve hesabın yasaklanması için gerekçedir.

## Yaptırım

- İhlal eden becerileri gizleyebilir, kaldırabilir veya kalıcı olarak silebiliriz.
- Token'ları iptal edebilir, ilişkili içeriği geçici olarak silebilir ve tekrarlayan ya da ağır ihlalde bulunanları yasaklayabiliriz.
- Açık kötüye kullanım için önce uyarı yapılacağını garanti etmeyiz.
