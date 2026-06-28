---
read_when:
    - Yüklemeleri kötüye kullanım veya politika ihlalleri açısından inceleme
    - Moderasyon belgeleri veya incelemeci çalışma kılavuzları yazma
    - Bir skill'in gizlenmesi veya bir kullanıcının yasaklanması gerekip gerekmediğine karar verme
sidebarTitle: Acceptable Usage
summary: 'Pazar yeri politikası: ClawHub''ın nelere izin verdiği ve neleri barındırmayacağı.'
title: Kabul Edilebilir Kullanım
x-i18n:
    generated_at: "2026-06-28T08:15:15Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ace357e7a3e9f4d242f113ad791b254e94ae8a841dd9a864a77c5bac15713132
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Kabul Edilebilir Kullanım

ClawHub, OpenClaw için Skills, Plugin'ler, paketler ve pazar yeri meta verilerini barındırır.
İçeriğin veya yayınlama davranışının ClawHub'da yer alıp almadığına karar vermek için
bu sayfayı kullanın.

Bu kurallar bir listenin ne yaptığı, kullanıcılardan ne çalıştırmalarını istediği, kendini
nasıl temsil ettiği ve yayıncıların ClawHub'ın keşif, kurulum ve güven yüzeylerini
nasıl kullandığı için geçerlidir. Moderasyon durumları ve hesap itibarı için bkz.
[Moderasyon ve Hesap Güvenliği](/tr/clawhub/moderation). Telif hakkı veya diğer hak
talepleri için bkz. [İçerik Hakları Talepleri](/tr/clawhub/content-rights).

## İzin verilen içerik

ClawHub; yararlı, anlaşılır ve iyi niyetle yayınlanan içeriği memnuniyetle karşılar.

| Kategori                                         | Şu durumda izin verilir                                                                                                                      |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Geliştirici üretkenliği                           | Liste, kullanıcıların yazılım oluşturmasına, test etmesine, taşımasına, hatalarını ayıklamasına, belgelemesine veya işletmesine yardımcı olur.                                               |
| UI, veri ve otomasyon iş akışları               | Kapsam nettir, gerekli kimlik bilgileri açıkça belirtilmiştir ve riskli eylemler inceleme, deneme çalıştırması, önizleme veya onay yolları içerir. |
| Savunma amaçlı güvenlik, moderasyon ve kötüye kullanım incelemesi | Araç yetkili inceleme için konumlandırılmıştır, kanıtları korur ve insan onayı sınırlarını net tutar.                          |
| Kişisel veya ekip iş akışları                       | İş akışı rızaya dayalı hesaplar, şeffaf kurulum ve açık izinler kullanır.                                            |
| Bakımı yapılan kataloglar                              | Her liste farklı, yararlı, doğru açıklanmış ve makul ölçüde bakımı yapılmış durumdadır.                                                |

Bağlam önemlidir. Aynı konu, dar kapsamlı bir savunma veya rızaya dayalı ortamda
kabul edilebilirken, kötüye kullanım iş akışı olarak paketlendiğinde kabul edilemez olabilir.

## İzin verilmeyen içerik

ClawHub, ana amacı kötüye kullanım, aldatma, güvenli olmayan yürütme veya hak ihlali
olan içeriği barındırmaz.

| Kategori                                                    | İzin verilmez                                                                                                                                                                                                                                                                                                   |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Yetkisiz erişim veya güvenlik atlatma                      | Kimlik doğrulama atlatma, hesap ele geçirme, hız sınırı kötüye kullanımı, canlı çağrı veya aracı ele geçirme, yeniden kullanılabilir oturum hırsızlığı ya da onaylanmamış kullanıcılar için eşleştirme akışlarını otomatik onaylama.                                                                                                                                                   |
| Platform kötüye kullanımı ve yasak aşma                              | Yasaklardan sonra gizli hesaplar, hesap ısıtma veya çiftçiliği, sahte etkileşim, çok hesaplı otomasyon, toplu paylaşım, spam botları veya tespitten kaçınmak için oluşturulmuş otomasyon.                                                                                                                                          |
| Dolandırıcılık, aldatmacalar ve yanıltıcı finansal iş akışları             | Sahte sertifikalar veya faturalar, aldatıcı ödeme akışları, dolandırıcılık amaçlı erişim, sahte sosyal kanıt, dolandırıcılık için sentetik kimlik iş akışları ya da açık insan onayı olmayan harcama/ücretlendirme araçları.                                                                                                                    |
| Gizliliği ihlal eden zenginleştirme veya gözetim                 | Spam için kişi kazıma, doxxing, ısrarlı takip, istenmeyen erişimle eşleştirilmiş potansiyel müşteri çıkarma, gizli izleme, rıza dışı biyometrik eşleştirme ya da sızdırılmış veri veya ihlal dökümleri kullanımı.                                                                                                                  |
| Rıza dışı taklit veya kimlik manipülasyonu       | Yüz değiştirme, dijital ikizler, klonlanmış influencer'lar, sahte kişilikler veya taklit etmek ya da yanıltmak için kullanılan diğer araçlar.                                                                                                                                                                                                 |
| Açık cinsel içerik veya güvenliği devre dışı bırakılmış yetişkin üretimi | NSFW görüntü, video veya içerik üretimi; üçüncü taraf API'leri etrafında yetişkin içerik sarmalayıcıları; ya da birincil amacı açık cinsel içerik olan listeler.                                                                                                                                                       |
| Gizli, güvenli olmayan veya yanıltıcı yürütme gereksinimleri        | Gizlenmiş kurulum komutları, net inceleme olanağı olmadan `sh` veya `bash` ile çalıştırılan indirilmiş içerik gibi pipe-to-shell kurulumları, beyan edilmemiş gizli bilgi veya özel anahtar gereksinimleri, net inceleme olanağı olmadan uzaktan `npx @latest` yürütmesi ya da listenin çalışmak için gerçekte neye ihtiyaç duyduğunu gizleyen meta veriler. |
| Telif hakkı ihlal eden veya hakları ihlal eden materyal           | Başkasının skill'ini, Plugin'ini, dokümanlarını, marka varlıklarını veya tescilli kodunu izinsiz yeniden yayınlamak; lisans koşullarını ihlal etmek; ya da özgün yazarı veya yayıncıyı taklit etmek.                                                                                                                            |

## İzin verilmeyen pazar yeri davranışı

ClawHub, yayıncıların pazar yerini nasıl kullandığını da inceler. ClawHub'ı
keşfi, metrikleri, güven sinyallerini, moderasyon sistemlerini veya kullanıcı
dikkatini manipüle etmek için kullanmayın.

İzin verilmeyen pazar yeri davranışları şunları içerir:

- gerçek kullanıcı değeri taşıyor gibi görünmeyen, düşük emekli, yinelenen, yer tutucu veya
  makine tarafından oluşturulmuş çok sayıda listeyi toplu yayınlamak
- arama veya kategori yüzeylerini neredeyse aynı Skills veya Plugin'lerle doldurmak
- çok az kullanım, bakım, kaynak netliği veya anlamlı farklılaştırma içeren ya da hiç içermeyen
  yüzlerce liste yayınlamak
- kurulumları, indirmeleri, yıldızları veya diğer etkileşim
  metriklerini otomasyon, kendi kendine kurulum döngüleri, sahte hesaplar, koordineli
  etkinlik, ücretli etkileşim veya diğer organik olmayan davranışlarla yapay olarak şişirmek
- moderasyondan, yasaklardan, yayıncı sınırlarından veya
  pazar yeri incelemesinden kaçınmak için hesap oluşturmak veya hesap döndürmek
- sahiplik, kaynak, yetenekler, güvenlik duruşu,
  kurulum gereksinimleri veya başka bir proje ya da yayıncıyla bağlantı konusunda kullanıcıları yanıltmak
- temel sorun düzeltilmeden zaten gizlenmiş, kaldırılmış veya engellenmiş
  içeriği tekrar tekrar yüklemek

Yüksek hacimli yayınlama otomatik olarak kötüye kullanım değildir. Büyük kataloglar,
listeler anlamlı biçimde farklı, doğru açıklanmış, bakımı yapılmış
ve gerçek kullanıcılar tarafından kullanılıyor olduğunda kabul edilebilir. Büyük kataloglar,
hacim; zayıf, yinelenen, yanıltıcı, bakımsız veya
yapay olarak öne çıkarılmış listelerle eşleştiğinde bir güven ve güvenlik sorunu haline gelir.

## İçerik hakları

ClawHub'daki içeriğin telif hakkınızı veya diğer haklarınızı ihlal ettiğine inanıyorsanız
[İçerik Hakları Talepleri](/tr/clawhub/content-rights) bölümünü kullanın. Liste aynı zamanda güvenli değil,
kötü amaçlı veya yanıltıcı değilse, telif hakkı veya hak talepleri için normal pazar yeri
raporlarını kullanmayın.

## İnceleme ve yaptırım

ClawHub, güvenli olmayan içeriği veya kötüye kullanılan yayınlama davranışını belirlemek için
otomatik kontroller, istatistiksel kötüye kullanım sinyalleri, kullanıcı raporları ve
personel incelemesi kullanabilir. Bir sinyal tek başına kötüye kullanımı kanıtlamaz;
ClawHub'ın neyin incelenmesi gerektiğine karar vermesine yardımcı olur.

Şunları yapabiliriz:

- ihlal eden listeleri gizlemek, bekletmek, kaldırmak, soft-delete yapmak veya kaynak türü için desteklendiği durumlarda
  hard-delete yapmak
- güvenli olmayan sürümler için indirmeleri veya kurulumları engellemek
- API token'larını iptal etmek
- ilişkili içeriği soft-delete yapmak
- yayınlama erişimini kısıtlamak
- tekrarlayan veya ağır ihlalde bulunanları yasaklamak

Açık kötüye kullanım için önce uyarı yapılacağını garanti etmeyiz. Raporlar, moderasyon bekletmeleri,
gizli listeler, yasaklar ve hesap itibarı için bkz.
[Moderasyon ve Hesap Güvenliği](/tr/clawhub/moderation).
