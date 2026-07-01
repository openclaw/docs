---
read_when:
    - Yüklemeleri kötüye kullanım veya politika ihlalleri açısından inceleme
    - Moderasyon belgeleri veya inceleyici çalışma kılavuzları yazma
    - Bir skill'in gizlenip gizlenmemesine veya bir kullanıcının yasaklanıp yasaklanmamasına karar verme
sidebarTitle: Acceptable Usage
summary: 'Pazar yeri ilkesi: ClawHub''ın nelere izin verdiği ve neleri barındırmayacağı.'
title: Kabul Edilebilir Kullanım
x-i18n:
    generated_at: "2026-07-01T18:17:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ace357e7a3e9f4d242f113ad791b254e94ae8a841dd9a864a77c5bac15713132
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Kabul Edilebilir Kullanım

ClawHub, OpenClaw için Skills, Plugin'ler, paketler ve pazaryeri meta verilerini barındırır.
İçeriğin veya yayımlama davranışının ClawHub'da yer alıp almadığına karar vermek için
bu sayfayı kullanın.

Bu kurallar bir listelemenin ne yaptığı, kullanıcılardan ne çalıştırmalarını istediği,
kendisini nasıl temsil ettiği ve yayıncıların ClawHub'ın keşif, yükleme ve güven
yüzeylerini nasıl kullandığı için geçerlidir. Moderasyon durumları ve hesap itibarı için
[Moderasyon ve Hesap Güvenliği](/clawhub/moderation) sayfasına bakın. Telif hakkı veya diğer hak
talepleri için [İçerik Hakları Talepleri](/tr/clawhub/content-rights) sayfasına bakın.

## İzin verilen içerik

ClawHub yararlı, anlaşılır ve iyi niyetle yayımlanan içerikleri memnuniyetle karşılar.

| Kategori                                         | Şu durumlarda izin verilir                                                                                                                      |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Geliştirici verimliliği                           | Listeleme, kullanıcıların yazılım geliştirmesine, test etmesine, taşımasına, hata ayıklamasına, belgelemesine veya işletmesine yardımcı olur.                                               |
| UI, veri ve otomasyon iş akışları               | Kapsam açıktır, gerekli kimlik bilgileri açıkça belirtilmiştir ve riskli eylemler inceleme, kuru çalıştırma, önizleme veya onay yolları içerir. |
| Savunma amaçlı güvenlik, moderasyon ve kötüye kullanım incelemesi | Araç yetkili inceleme için konumlandırılmıştır, kanıtları korur ve insan onayı sınırlarını açık tutar.                          |
| Kişisel veya ekip iş akışları                       | İş akışı rızaya dayalı hesaplar, şeffaf kurulum ve açık izinler kullanır.                                            |
| Bakımı yapılan kataloglar                              | Her listeleme ayırt edilebilir, yararlı, doğru şekilde açıklanmış ve makul düzeyde bakımı yapılmıştır.                                                |

Bağlam önemlidir. Aynı konu, dar kapsamlı savunma amaçlı veya rızaya dayalı bir
ortamda kabul edilebilirken, kötüye kullanım iş akışı olarak paketlendiğinde kabul edilemez olabilir.

## İzin verilmeyen içerik

ClawHub, ana amacı kötüye kullanım, aldatma, güvensiz
çalıştırma veya hak ihlali olan içerikleri barındırmaz.

| Kategori                                                    | İzin verilmez                                                                                                                                                                                                                                                                                                   |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Yetkisiz erişim veya güvenlik atlatma                      | Kimlik doğrulama atlatma, hesap ele geçirme, hız sınırı kötüye kullanımı, canlı çağrı veya ajan ele geçirme, yeniden kullanılabilir oturum hırsızlığı ya da onaylanmamış kullanıcılar için eşleştirme akışlarını otomatik onaylama.                                                                                                                                                   |
| Platform kötüye kullanımı ve yasak aşma                              | Yasaklardan sonra gizli hesaplar, hesap ısıtma veya çiftçiliği, sahte etkileşim, çoklu hesap otomasyonu, toplu gönderi, spam botları veya tespitten kaçınmak için oluşturulmuş otomasyon.                                                                                                                                          |
| Dolandırıcılık, aldatmacalar ve yanıltıcı finansal iş akışları             | Sahte sertifikalar veya faturalar, yanıltıcı ödeme akışları, dolandırıcılık amaçlı erişim, sahte sosyal kanıt, dolandırıcılık için sentetik kimlik iş akışları ya da açık insan onayı olmadan harcama/ücretlendirme araçları.                                                                                                                    |
| Gizliliği ihlal eden zenginleştirme veya gözetim                 | Spam için kişi kazıma, doxxing, takip, istenmeyen erişimle birlikte potansiyel müşteri çıkarma, gizli izleme, rıza dışı biyometrik eşleştirme ya da sızdırılmış veri veya ihlal dökümleri kullanımı.                                                                                                                  |
| Rıza dışı kimliğe bürünme veya kimlik manipülasyonu       | Yüz değiştirme, dijital ikizler, klonlanmış influencer'lar, sahte kişilikler veya kimliğe bürünmek ya da yanıltmak için kullanılan diğer araçlar.                                                                                                                                                                                                 |
| Açık cinsel içerik veya güvenliği devre dışı bırakılmış yetişkin içerik üretimi | NSFW görüntü, video veya içerik üretimi; üçüncü taraf API'leri etrafında yetişkin içerik sarmalayıcıları; ya da birincil amacı açık cinsel içerik olan listelemeler.                                                                                                                                                       |
| Gizli, güvensiz veya yanıltıcı çalıştırma gereksinimleri        | Gizlenmiş yükleme komutları, indirilen içeriğin net incelenebilirlik olmadan `sh` veya `bash` ile çalıştırılması gibi pipe-to-shell yükleyiciler, beyan edilmemiş gizli bilgi veya özel anahtar gereksinimleri, net incelenebilirlik olmadan uzak `npx @latest` çalıştırma ya da listelemenin çalışmak için gerçekten neye ihtiyaç duyduğunu gizleyen meta veriler. |
| Telif hakkını ihlal eden veya hakları ihlal eden materyal           | Başkasının skill'ini, plugin'ini, belgelerini, marka varlıklarını veya tescilli kodunu izinsiz yeniden yayımlamak; lisans koşullarını ihlal etmek; ya da özgün yazar veya yayıncı gibi davranmak.                                                                                                                            |

## İzin verilmeyen pazaryeri davranışı

ClawHub ayrıca yayıncıların pazaryerini nasıl kullandığını da inceler. ClawHub'ı
keşfi, metrikleri, güven sinyallerini, moderasyon sistemlerini veya kullanıcı
dikkatini manipüle etmek için kullanmayın.

İzin verilmeyen pazaryeri davranışları şunları içerir:

- gerçek kullanıcı değeri taşıyor gibi görünmeyen düşük emekli, yinelenen, yer tutucu veya
  makine tarafından üretilmiş çok sayıda listelemeyi toplu yayımlamak
- arama veya kategori yüzeylerini neredeyse aynı Skills ya da Plugin'lerle doldurmak
- çok az kullanım, bakım, kaynak
  netliği veya anlamlı farklılaşma içeren yüzlerce listeleme yayımlamak
- yüklemeleri, indirmeleri, yıldızları veya diğer etkileşim
  metriklerini otomasyon, kendi kendine yükleme döngüleri, sahte hesaplar, koordineli
  etkinlik, ücretli etkileşim veya diğer organik olmayan davranışlarla yapay olarak şişirmek
- moderasyondan, yasaklardan, yayıncı sınırlarından veya
  pazaryeri incelemesinden kaçınmak için hesap oluşturmak ya da döndürmek
- kullanıcıları sahiplik, kaynak, yetenekler, güvenlik duruşu,
  yükleme gereksinimleri veya başka bir proje ya da yayıncıyla ilişki konusunda yanıltmak
- altta yatan sorunu düzeltmeden daha önce gizlenmiş, kaldırılmış veya engellenmiş
  içeriği tekrar tekrar yüklemek

Yüksek hacimli yayımlama otomatik olarak kötüye kullanım değildir. Listelemeler anlamlı
şekilde farklı, doğru şekilde açıklanmış, bakımı yapılmış ve gerçek kullanıcılar tarafından
kullanılıyorsa büyük kataloglar kabul edilebilir. Hacim; zayıf, yinelenen, yanıltıcı, bakımsız veya
yapay olarak öne çıkarılmış listelemelerle birlikte olduğunda büyük kataloglar bir güven ve güvenlik sorunu haline gelir.

## İçerik hakları

ClawHub'daki içeriğin telif hakkınızı veya diğer haklarınızı ihlal ettiğine inanıyorsanız
[İçerik Hakları Talepleri](/tr/clawhub/content-rights) sayfasını kullanın. Listeleme aynı zamanda güvensiz,
kötü amaçlı veya yanıltıcı değilse telif hakkı veya hak talepleri için normal pazaryeri
raporlarını kullanmayın.

## İnceleme ve yaptırım

ClawHub, güvensiz içeriği veya kötüye kullanıma yönelik yayımlama davranışını belirlemek için
otomatik kontroller, istatistiksel kötüye kullanım sinyalleri, kullanıcı raporları ve
personel incelemesi kullanabilir. Bir sinyal tek başına kötüye kullanımı kanıtlamaz; ClawHub'ın neyin incelenmesi gerektiğine karar vermesine yardımcı olur.

Şunları yapabiliriz:

- ihlal eden listelemeleri gizlemek, bekletmek, kaldırmak, soft-delete yapmak veya kaynak türü için destekleniyorsa
  hard-delete yapmak
- güvensiz sürümler için indirmeleri veya yüklemeleri engellemek
- API token'larını iptal etmek
- ilişkili içeriği soft-delete yapmak
- yayımlama erişimini kısıtlamak
- tekrarlayan veya ağır ihlal yapanları yasaklamak

Açık kötüye kullanım için önce uyarı yapılacağını garanti etmeyiz. Raporlar, moderasyon bekletmeleri,
gizli listelemeler, yasaklar ve hesap itibarı için
[Moderasyon ve Hesap Güvenliği](/clawhub/moderation) sayfasına bakın.
