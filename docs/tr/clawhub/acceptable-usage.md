---
read_when:
    - Yüklemeleri kötüye kullanım veya politika ihlalleri açısından inceleme
    - Moderasyon belgeleri veya inceleyici çalışma kılavuzları yazma
    - Bir becerinin gizlenip gizlenmemesine ya da bir kullanıcının yasaklanıp yasaklanmamasına karar verme
summary: 'Pazar yeri politikası: ClawHub''ın nelere izin verdiği ve neleri barındırmayacağı.'
x-i18n:
    generated_at: "2026-05-12T04:09:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1bacb9c526d1c5698355f2538ba0f8d6acf3e8a9b7b7c12b98ec7680edde16f0
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Kabul Edilebilir Kullanım

Bu sayfa, ClawHub’ın kabul ettiği Skills ve içerik türlerini ve barındırmayacağı kötüye kullanım iş akışlarını açıklar.

Bu kurallar bilinçli olarak pratiktir. Yalnızca tekil anahtar kelimelerle değil, en çok uçtan uca kötüye kullanım iş akışlarıyla ilgileniyoruz. Bir Skill savunmaları aşmak, platformları kötüye kullanmak, insanları dolandırmak, gizliliği ihlal etmek veya rıza dışı davranışları mümkün kılmak için oluşturulmuşsa, ClawHub’da yeri yoktur.

## Açıkça kabul ettiğimiz son örüntüler

- Gerçek bileşenler, anlamsal token’lar, erişilebilir durumlar ve test edilmiş kullanıcı akışları kullanan frontend ve tasarım sistemi çalışmaları.
- Tek seferlik markup yerine kurulu kaynak bileşenleri, proje alias’larını ve belgelenmiş varyantları kullanan shadcn/ui bileşimi.
- Yorumları koruyan, somut UI5 türleri kullanan ve üretilmiş kontrol arayüzlerini incelenebilir tutan UI5 JavaScript’ten TypeScript’e dönüştürme.
- Kanıt gösteren ve insan onayı sınırlarını açık tutan savunma amaçlı güvenlik incelemesi, moderasyon araçları ve kötüye kullanım tespit prompt’ları.
- Açık kimlik bilgileri, şeffaf kurulum ve dry-run veya önizleme modlarıyla kişisel ya da ekip hesapları için rızaya dayalı iş akışı otomasyonu.
- Destekledikleri yazılımla sınırlı dokümantasyon, geçiş runbook’ları, geliştirici yardımcı araçları ve test fixture’ları.

## Kabul edilmeyenler

- Güvenlik aşma veya yetkisiz erişim iş akışları.
  - Örnekler: kimlik doğrulama atlatma, hesap ele geçirme, CAPTCHA atlatma, Cloudflare veya bot karşıtı sistemlerden kaçınma, hız sınırı atlatma, korumaları yenmek üzere tasarlanmış gizli scraping, canlı çağrı veya agent ele geçirme, yeniden kullanılabilir oturum hırsızlığı, onaylanmamış kullanıcılar için eşleştirme akışlarını otomatik onaylama.

- Platform kötüye kullanımı ve yasaklardan kaçınma.
  - Örnekler: yasaklardan sonra gizli hesaplar, hesap ısıtma/çiftçiliği, sahte etkileşim, karma veya takipçi yetiştirme, çok hesaplı otomasyon, toplu gönderim, spam botları, tespit edilmekten kaçınmak için oluşturulmuş marketplace veya sosyal otomasyon.

- Dolandırıcılık, aldatmacalar ve yanıltıcı finansal iş akışları.
  - Örnekler: sahte sertifikalar, sahte faturalar, yanıltıcı ödeme akışları, dolandırıcılık amaçlı erişim, sahte sosyal kanıt, açık insan onayı ve şeffaf kontroller olmadan harcama veya ücretlendirme yapılmasını sağlayan araçlar ya da dolandırıcılık için hesap oluşturmak üzere tasarlanmış sentetik kimlik iş akışları.

- Gizliliği ihlal eden scraping, zenginleştirme veya gözetim.
  - Örnekler: spam için geniş ölçekte iletişim bilgisi scraping’i, doxxing, takip, istenmeyen erişimle birlikte kullanılan lead çıkarımı, gizli izleme, açık rıza olmadan kullanılan yüz arama veya biyometrik eşleştirme ya da sızdırılmış verileri veya ihlal dökümlerini satın alma, yayımlama, indirme veya operasyonel hale getirme.

- Rıza dışı taklit veya yanıltıcı kimlik manipülasyonu.
  - Örnekler: face swap, dijital ikizler, sahte personalar, klonlanmış influencer’lar veya taklit etmek ya da yanıltmak için kullanılan diğer kimlik manipülasyonu araçları.

- Açık cinsel içerik ve güvenlik devre dışı bırakılmış yetişkin içerik üretimi.
  - Örnekler: NSFW görsel/video/içerik üretimi, üçüncü taraf API’ler etrafında yetişkin içerik wrapper’ları veya birincil amacı açık cinsel içerik olan Skills.

- Gizli, güvenli olmayan veya yanıltıcı yürütme gereksinimleri.
  - Örnekler: gizlenmiş kurulum komutları, `curl | sh`, beyan edilmemiş gizli bilgi gereksinimleri, beyan edilmemiş özel anahtar kullanımı, net incelenebilirlik olmadan uzak `npx @latest` yürütmesi, Skill’in çalışmak için gerçekten neye ihtiyaç duyduğunu gizleyen yanıltıcı metadata.

## Açıkça kabul etmediğimiz son örüntüler

- “Marketplace yasaklarından sonra gizli satıcı hesapları oluştur.”
- “Telegram eşleştirmesini, onaylanmamış kullanıcılar eşleştirme kodlarını otomatik alacak şekilde değiştir.”
- “Reddit/Twitter hesaplarını tespit edilemeyen otomasyonla geliştir.”
- “Keyfi kullanım için profesyonel sertifikalar veya faturalar oluştur.”
- “Güvenlik kontrolleri devre dışı bırakılmış şekilde NSFW içerik üret.”
- “Lead’leri scrape et, kişileri zenginleştir ve geniş ölçekte soğuk erişim başlat.”
- “Sızdırılmış verileri veya ihlal dökümlerini satın al, yayımla veya indir.”
- “Sentetik kimliklerle veya CAPTCHA çözerek toplu e-posta ya da sosyal hesap oluştur.”

## İnceleyiciler için notlar

- Bağlam önemlidir. Aynı konu, dar bir savunma veya rızaya dayalı ortamda meşru olabilirken kötüye kullanım iş akışı olarak paketlendiğinde kabul edilemez olabilir.
- Bir Skill açıkça kaçınma, aldatma veya rıza dışı kullanım için optimize edilmişse eyleme geçme yönünde eğilim göstermeliyiz.
- Bu kategorilerde tekrarlanan yüklemeler, içeriğin gizlenmesi ve hesabın yasaklanması için gerekçedir.

## Yaptırım

- İhlal eden Skills’i gizleyebilir, kaldırabilir veya kalıcı olarak silebiliriz.
- Token’ları iptal edebilir, ilişkili içeriği soft-delete yapabilir ve tekrarlayan veya ağır ihlalcileri yasaklayabiliriz.
- Açık kötüye kullanım için önce uyarı yaptırımını garanti etmeyiz.
