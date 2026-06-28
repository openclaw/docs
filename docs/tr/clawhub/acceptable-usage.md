---
read_when:
    - Yüklemeleri kötüye kullanım veya politika ihlalleri açısından inceleme
    - Moderasyon belgeleri veya inceleyici çalışma kılavuzları yazma
    - Bir skill'in gizlenip gizlenmeyeceğine veya bir kullanıcının yasaklanıp yasaklanmayacağına karar verme
sidebarTitle: Acceptable Usage
summary: 'Marketplace politikası: ClawHub''ın nelere izin verdiği ve neleri barındırmayacağı.'
title: Kabul Edilebilir Kullanım
x-i18n:
    generated_at: "2026-06-28T07:41:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ace357e7a3e9f4d242f113ad791b254e94ae8a841dd9a864a77c5bac15713132
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Kabul Edilebilir Kullanım

ClawHub, OpenClaw için Skills, Plugin'ler, paketler ve marketplace meta verilerini barındırır.
İçeriğin veya yayınlama davranışının ClawHub'da yer alıp almaması gerektiğine karar vermek için bu sayfayı kullanın.

Bu kurallar, bir listelemenin ne yaptığı, kullanıcılardan ne çalıştırmalarını istediği, kendini nasıl temsil ettiği ve yayıncıların ClawHub'ın keşif, kurulum ve güven yüzeylerini nasıl kullandığı için geçerlidir. Moderasyon durumları ve hesap itibarı için bkz. [Moderasyon ve Hesap Güvenliği](/tr/clawhub/moderation). Telif hakkı veya diğer hak talepleri için bkz. [İçerik Hakları Talepleri](/tr/clawhub/content-rights).

## İzin verilen içerik

ClawHub; yararlı, anlaşılır ve iyi niyetle yayınlanan içerikleri kabul eder.

| Kategori                                         | Şu durumlarda izin verilir                                                                                                                      |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Geliştirici üretkenliği                           | Listeleme, kullanıcıların yazılım geliştirmesine, test etmesine, taşımasına, hata ayıklamasına, belgelemesine veya işletmesine yardımcı olur.                                               |
| UI, veri ve otomasyon iş akışları               | Kapsam açıktır, gerekli kimlik bilgileri açıkça belirtilmiştir ve riskli eylemler inceleme, dry-run, önizleme veya onay yolları içerir. |
| Savunma amaçlı güvenlik, moderasyon ve kötüye kullanım incelemesi | Araç yetkili inceleme için konumlandırılmıştır, kanıtları korur ve insan onayı sınırlarını net tutar.                          |
| Kişisel veya ekip iş akışları                       | İş akışı rızaya dayalı hesaplar, şeffaf kurulum ve açık izinler kullanır.                                            |
| Bakımı yapılan kataloglar                              | Her listeleme farklı, yararlı, doğru açıklanmış ve makul ölçüde bakımı yapılmıştır.                                                |

Bağlam önemlidir. Aynı konu, dar kapsamlı savunma amaçlı veya rızaya dayalı bir ortamda kabul edilebilirken, kötüye kullanım iş akışı olarak paketlendiğinde kabul edilemez olabilir.

## İzin verilmeyen içerik

ClawHub, ana amacı kötüye kullanım, aldatma, güvenli olmayan yürütme veya hak ihlali olan içerikleri barındırmaz.

| Kategori                                                    | İzin verilmez                                                                                                                                                                                                                                                                                                   |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Yetkisiz erişim veya güvenlik atlatma                      | Kimlik doğrulama atlatma, hesap ele geçirme, hız sınırı kötüye kullanımı, canlı çağrı veya agent ele geçirme, yeniden kullanılabilir oturum hırsızlığı ya da onaylanmamış kullanıcılar için eşleştirme akışlarını otomatik onaylama.                                                                                                                                                   |
| Platform kötüye kullanımı ve yasak atlatma                              | Yasaklardan sonra gizli hesaplar, hesap ısıtma veya çiftçiliği, sahte etkileşim, çoklu hesap otomasyonu, toplu gönderi, spam botları veya tespitten kaçınmak için oluşturulmuş otomasyon.                                                                                                                                          |
| Dolandırıcılık, sahtekarlık ve aldatıcı finansal iş akışları             | Sahte sertifikalar veya faturalar, aldatıcı ödeme akışları, dolandırıcılık amaçlı erişim, sahte sosyal kanıt, dolandırıcılık için sentetik kimlik iş akışları ya da açık insan onayı olmadan harcama/ücretlendirme araçları.                                                                                                                    |
| Gizliliği ihlal eden zenginleştirme veya gözetim                 | Spam için kişi kazıma, doxxing, stalking, istenmeyen erişimle birlikte lead çıkarma, gizli izleme, rıza dışı biyometrik eşleştirme ya da sızdırılmış veri veya ihlal dökümlerinin kullanımı.                                                                                                                  |
| Rıza dışı taklit veya kimlik manipülasyonu       | Yüz değiştirme, dijital ikizler, klonlanmış influencer'lar, sahte kişilikler veya taklit etmek ya da yanıltmak için kullanılan diğer araçlar.                                                                                                                                                                                                 |
| Açık cinsel içerik veya güvenlik devre dışı bırakılmış yetişkin üretimi | NSFW görsel, video veya içerik üretimi; üçüncü taraf API'ler etrafında yetişkin içerik sarmalayıcıları; ya da birincil amacı açık cinsel içerik olan listelemeler.                                                                                                                                                       |
| Gizli, güvenli olmayan veya yanıltıcı yürütme gereksinimleri        | Gizlenmiş kurulum komutları, açık inceleme olanağı olmadan indirilen içeriğin `sh` veya `bash` ile çalıştırılması gibi pipe-to-shell kurucular, beyan edilmemiş gizli bilgi veya özel anahtar gereksinimleri, açık inceleme olanağı olmadan uzaktan `npx @latest` yürütme ya da listelemenin çalışmak için gerçekten neye ihtiyaç duyduğunu gizleyen meta veriler. |
| Telif hakkı ihlal eden veya hakları ihlal eden materyal           | Başka birinin skill'ini, plugin'ini, dokümanlarını, marka varlıklarını veya tescilli kodunu izinsiz yeniden yayınlama; lisans koşullarını ihlal etme; ya da özgün yazar veya yayıncıyı taklit etme.                                                                                                                            |

## İzin verilmeyen marketplace davranışı

ClawHub, yayıncıların marketplace'i nasıl kullandığını da inceler. ClawHub'ı keşfi, metrikleri, güven sinyallerini, moderasyon sistemlerini veya kullanıcı dikkatini manipüle etmek için kullanmayın.

İzin verilmeyen marketplace davranışı şunları içerir:

- gerçek kullanıcı değeri varmış gibi görünmeyen çok sayıda düşük emekli, yinelenen, yer tutucu veya
  makine tarafından oluşturulmuş listelemeyi toplu yayınlama
- arama veya kategori yüzeylerini neredeyse aynı Skills veya Plugin'lerle doldurma
- çok az veya hiç kullanım, bakım, kaynak
  açıklığı ya da anlamlı farklılaşma olmayan yüzlerce listeleme yayınlama
- otomasyon, kendi kendine kurulum döngüleri, sahte hesaplar, koordineli
  faaliyet, ücretli etkileşim veya diğer organik olmayan davranışlar yoluyla kurulumları, indirmeleri, yıldızları veya diğer etkileşim
  metriklerini yapay olarak şişirme
- moderasyonu, yasakları, yayıncı sınırlarını veya
  marketplace incelemesini atlatmak için hesap oluşturma ya da döndürme
- kullanıcıları sahiplik, kaynak, yetenekler, güvenlik duruşu,
  kurulum gereksinimleri veya başka bir proje ya da yayıncıyla ilişki konusunda yanıltma
- altta yatan sorunu düzeltmeden daha önce gizlenmiş, kaldırılmış veya engellenmiş
  içeriği tekrar tekrar yükleme

Yüksek hacimli yayınlama otomatik olarak kötüye kullanım değildir. Büyük kataloglar, listelemeler anlamlı biçimde farklı, doğru açıklanmış, bakımı yapılmış ve gerçek kullanıcılar tarafından kullanılıyorsa kabul edilebilir. Hacim; zayıf, yinelenen, yanıltıcı, bakımsız veya yapay olarak öne çıkarılmış listelemelerle birleştiğinde büyük kataloglar bir güven ve güvenlik sorununa dönüşür.

## İçerik hakları

ClawHub'daki içeriğin telif hakkınızı veya diğer haklarınızı ihlal ettiğine inanıyorsanız [İçerik Hakları Talepleri](/tr/clawhub/content-rights) sayfasını kullanın. Listeleme aynı zamanda güvenli değil, kötü amaçlı veya yanıltıcı değilse telif hakkı veya hak talepleri için normal marketplace raporlarını kullanmayın.

## İnceleme ve yaptırım

ClawHub, güvenli olmayan içeriği veya kötüye kullanımlı yayınlama davranışını belirlemek için otomatik kontroller, istatistiksel kötüye kullanım sinyalleri, kullanıcı raporları ve ekip incelemesi kullanabilir. Bir sinyal tek başına kötüye kullanımı kanıtlamaz; ClawHub'ın neyin incelenmesi gerektiğine karar vermesine yardımcı olur.

Şunları yapabiliriz:

- ihlal eden listelemeleri gizleme, bekletme, kaldırma, soft-delete yapma veya kaynak türü için desteklendiğinde
  hard-delete yapma
- güvenli olmayan sürümler için indirmeleri veya kurulumları engelleme
- API token'larını iptal etme
- ilişkili içeriği soft-delete yapma
- yayınlama erişimini kısıtlama
- tekrar eden veya ağır ihlal yapanları yasaklama

Açık kötüye kullanım için önce uyarı uygulamasını garanti etmiyoruz. Raporlar, moderasyon bekletmeleri, gizli listelemeler, yasaklar ve hesap itibarı için bkz. [Moderasyon ve Hesap Güvenliği](/tr/clawhub/moderation).
