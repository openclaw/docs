---
read_when:
    - Yüklemeleri kötüye kullanım veya politika ihlalleri açısından inceleme
    - Moderasyon belgeleri veya gözden geçiren çalışma kılavuzları yazma
    - Bir skill'in gizlenmesi veya bir kullanıcının yasaklanması gerekip gerekmediğine karar verme
sidebarTitle: Acceptable Usage
summary: 'Pazar yeri politikası: ClawHub''ın nelere izin verdiği ve neleri barındırmayacağı.'
title: Kabul Edilebilir Kullanım
x-i18n:
    generated_at: "2026-07-04T15:30:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ace357e7a3e9f4d242f113ad791b254e94ae8a841dd9a864a77c5bac15713132
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Kabul Edilebilir Kullanım

ClawHub, OpenClaw için Skills, Plugin'ler, paketler ve pazaryeri meta verilerini barındırır.
İçeriğin veya yayınlama davranışının ClawHub'da yer alıp almaması gerektiğine
karar vermek için bu sayfayı kullanın.

Bu kurallar bir listelemenin ne yaptığına, kullanıcılardan ne çalıştırmalarını
istediğine, kendini nasıl temsil ettiğine ve yayıncıların ClawHub'ın keşif, kurulum
ve güven yüzeylerini nasıl kullandığına uygulanır. Moderasyon durumları ve hesap
itibarı için bkz. [Moderasyon ve Hesap Güvenliği](/clawhub/moderation). Telif hakkı
veya diğer hak talepleri için bkz. [İçerik Hakları Talepleri](/tr/clawhub/content-rights).

## İzin verilen içerik

ClawHub; yararlı, anlaşılır ve iyi niyetle yayımlanan içeriği memnuniyetle kabul eder.

| Kategori                                          | Şu durumlarda izin verilir                                                                                                               |
| ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Geliştirici üretkenliği                           | Listeleme, kullanıcıların yazılım geliştirmesine, test etmesine, taşımasına, hata ayıklamasına, belgelemesine veya işletmesine yardımcı olur. |
| UI, veri ve otomasyon iş akışları                 | Kapsam nettir, gerekli kimlik bilgileri açıkça belirtilmiştir ve riskli eylemler inceleme, kuru çalıştırma, önizleme veya onay yolları içerir. |
| Savunmacı güvenlik, moderasyon ve kötüye kullanım incelemesi | Araç yetkili inceleme için çerçevelenmiştir, kanıtları korur ve insan onayı sınırlarını net tutar.                                      |
| Kişisel veya ekip iş akışları                     | İş akışı rızaya dayalı hesaplar, şeffaf kurulum ve açık izinler kullanır.                                                               |
| Bakımı yapılan kataloglar                         | Her listeleme ayırt edilebilir, yararlı, doğru şekilde açıklanmış ve makul ölçüde bakımı yapılmıştır.                                  |

Bağlam önemlidir. Aynı konu, dar kapsamlı savunmacı veya rızaya dayalı bir ortamda
kabul edilebilirken, kötüye kullanım iş akışı olarak paketlendiğinde kabul edilemez olabilir.

## İzin verilmeyen içerik

ClawHub, ana amacı kötüye kullanım, aldatma, güvensiz çalıştırma veya hak ihlali
olan içerikleri barındırmaz.

| Kategori                                                    | İzin verilmez                                                                                                                                                                                                                                                                                                   |
| ----------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Yetkisiz erişim veya güvenlik atlatma                       | Kimlik doğrulama atlatma, hesap ele geçirme, hız sınırı kötüye kullanımı, canlı çağrı veya ajan ele geçirme, yeniden kullanılabilir oturum hırsızlığı ya da onaylanmamış kullanıcılar için eşleştirme akışlarını otomatik onaylama.                                                                            |
| Platform kötüye kullanımı ve yasak aşma                     | Yasaklardan sonra gizli hesaplar, hesap ısıtma veya çiftçiliği, sahte etkileşim, çok hesaplı otomasyon, toplu gönderim, spam botları veya tespit edilmekten kaçınmak için oluşturulmuş otomasyon.                                                                                                              |
| Dolandırıcılık, sahtekarlık ve aldatıcı finansal iş akışları | Sahte sertifikalar veya faturalar, aldatıcı ödeme akışları, dolandırıcılık amaçlı erişim, sahte sosyal kanıt, dolandırıcılık için sentetik kimlik iş akışları ya da net insan onayı olmadan harcama/ücretlendirme araçları.                                                                                     |
| Gizliliği ihlal eden zenginleştirme veya gözetim            | Spam için kişi kazıma, doxxing, takip, istenmeyen erişimle birlikte kullanılan potansiyel müşteri çıkarımı, gizli izleme, rıza dışı biyometrik eşleştirme ya da sızdırılmış veri veya ihlal dökümlerinin kullanımı.                                                                                              |
| Rıza dışı taklit veya kimlik manipülasyonu                  | Yüz değiştirme, dijital ikizler, klonlanmış influencer'lar, sahte kişilikler veya taklit etmek ya da yanıltmak için kullanılan diğer araçlar.                                                                                                                                                                  |
| Açık cinsel içerik veya güvenlikleri devre dışı bırakılmış yetişkin içerik üretimi | NSFW görsel, video veya içerik üretimi; üçüncü taraf API'ler etrafında yetişkin içerik sarmalayıcıları; ya da birincil amacı açık cinsel içerik olan listelemeler.                                                                                                                                              |
| Gizli, güvensiz veya yanıltıcı çalıştırma gereksinimleri    | Gizlenmiş kurulum komutları, açık inceleme olanağı olmadan indirilen içeriğin `sh` veya `bash` ile çalıştırılması gibi pipe-to-shell kurulumları, beyan edilmemiş secret veya özel anahtar gereksinimleri, açık inceleme olanağı olmadan uzak `npx @latest` çalıştırması ya da listelemenin çalışmak için gerçekte neye ihtiyaç duyduğunu gizleyen meta veriler. |
| Telif hakkını ihlal eden veya hakları ihlal eden materyal   | Başkasının Skills'ini, Plugin'ini, belgelerini, marka varlıklarını veya tescilli kodunu izinsiz yeniden yayımlamak; lisans koşullarını ihlal etmek; ya da özgün yazarı veya yayıncıyı taklit etmek.                                                                                                             |

## İzin verilmeyen pazaryeri davranışı

ClawHub, yayıncıların pazaryerini nasıl kullandığını da inceler. ClawHub'ı keşfi,
metrikleri, güven sinyallerini, moderasyon sistemlerini veya kullanıcı dikkatini
manipüle etmek için kullanmayın.

İzin verilmeyen pazaryeri davranışları şunları içerir:

- gerçek kullanıcı değeri var gibi görünmeyen çok sayıda düşük çabalı, yinelenen,
  yer tutucu veya makine tarafından oluşturulmuş listelemeyi toplu yayımlamak
- arama veya kategori yüzeylerini neredeyse aynı Skills ya da Plugin'lerle doldurmak
- çok az ya da hiç kullanım, bakım, kaynak netliği veya anlamlı farklılaşma
  içermeyen yüzlerce listeleme yayımlamak
- kurulumları, indirmeleri, yıldızları veya diğer etkileşim metriklerini otomasyon,
  kendi kendine kurulum döngüleri, sahte hesaplar, koordineli etkinlik, ücretli
  etkileşim ya da diğer organik olmayan davranışlarla yapay olarak şişirmek
- moderasyonu, yasakları, yayıncı sınırlarını veya pazaryeri incelemesini aşmak için
  hesap oluşturmak ya da hesapları döndürmek
- kullanıcıları sahiplik, kaynak, yetenekler, güvenlik duruşu, kurulum gereksinimleri
  veya başka bir proje ya da yayıncıyla ilişki konusunda yanıltmak
- altta yatan sorunu düzeltmeden daha önce gizlenmiş, kaldırılmış veya engellenmiş
  içeriği tekrar tekrar yüklemek

Yüksek hacimli yayıncılık otomatik olarak kötüye kullanım değildir. Büyük kataloglar,
listelemeler anlamlı biçimde farklı, doğru şekilde açıklanmış, bakımı yapılmış ve
gerçek kullanıcılar tarafından kullanılıyor olduğunda kabul edilebilir. Büyük kataloglar,
hacim ince, yinelenen, yanıltıcı, bakımsız veya yapay olarak öne çıkarılmış
listelemelerle birleştiğinde güven ve emniyet sorunu haline gelir.

## İçerik hakları

ClawHub'daki içeriğin telif hakkınızı veya diğer haklarınızı ihlal ettiğine
inanıyorsanız [İçerik Hakları Talepleri](/tr/clawhub/content-rights) sayfasını kullanın.
Listeleme aynı zamanda güvensiz, kötü amaçlı veya yanıltıcı değilse telif hakkı ya da
hak talepleri için normal pazaryeri raporlarını kullanmayın.

## İnceleme ve yaptırım

ClawHub, güvensiz içeriği veya kötüye kullanılan yayınlama davranışını belirlemek için
otomatik kontroller, istatistiksel kötüye kullanım sinyalleri, kullanıcı raporları ve
personel incelemesi kullanabilir. Bir sinyal tek başına kötüye kullanımı kanıtlamaz;
ClawHub'ın neyin inceleme gerektirdiğine karar vermesine yardımcı olur.

Şunları yapabiliriz:

- ihlal eden listelemeleri gizlemek, beklemeye almak, kaldırmak, soft-delete yapmak
  veya kaynak türü için desteklendiği durumlarda hard-delete yapmak
- güvensiz sürümler için indirmeleri veya kurulumları engellemek
- API token'larını iptal etmek
- ilişkili içeriği soft-delete yapmak
- yayınlama erişimini kısıtlamak
- tekrarlayan veya ağır ihlal yapanları yasaklamak

Açık kötüye kullanım durumlarında önce uyarı yapılacağını garanti etmeyiz. Raporlar,
moderasyon bekletmeleri, gizli listelemeler, yasaklar ve hesap itibarı için bkz.
[Moderasyon ve Hesap Güvenliği](/clawhub/moderation).
