---
read_when:
    - Yüklemeleri kötüye kullanım veya politika ihlalleri açısından inceleme
    - Moderasyon belgeleri veya inceleyici çalışma kılavuzları yazma
    - Bir skill’in gizlenip gizlenmeyeceğine veya bir kullanıcının yasaklanıp yasaklanmayacağına karar verme
sidebarTitle: Acceptable Usage
summary: 'Pazar yeri politikası: ClawHub''ın nelere izin verdiği ve neleri barındırmayacağı.'
title: Kabul Edilebilir Kullanım
x-i18n:
    generated_at: "2026-06-28T05:07:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ace357e7a3e9f4d242f113ad791b254e94ae8a841dd9a864a77c5bac15713132
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Kabul Edilebilir Kullanım

ClawHub, OpenClaw için Skills, Plugin'ler, paketler ve pazar yeri meta verilerini barındırır.
İçeriğin veya yayımlama davranışının ClawHub'da yer alıp almaması gerektiğine
karar vermek için bu sayfayı kullanın.

Bu kurallar, bir listelemenin ne yaptığına, kullanıcılardan ne çalıştırmalarını
istediğine, kendini nasıl temsil ettiğine ve yayıncıların ClawHub'ın keşif,
kurulum ve güven yüzeylerini nasıl kullandığına uygulanır. Moderasyon durumları
ve hesap itibarı için bkz. [Moderasyon ve Hesap Güvenliği](/tr/clawhub/moderation).
Telif hakkı veya diğer hak iddiaları için bkz.
[İçerik Hakları Talepleri](/tr/clawhub/content-rights).

## İzin verilen içerik

ClawHub; faydalı, anlaşılır ve iyi niyetle yayımlanmış içeriği memnuniyetle karşılar.

| Kategori                                         | Ne zaman izin verilir                                                                                                             |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Geliştirici üretkenliği                          | Listeleme, kullanıcıların yazılım oluşturmasına, test etmesine, taşımasına, hata ayıklamasına, belgelemesine veya işletmesine yardımcı olur. |
| UI, veri ve otomasyon iş akışları                | Kapsam nettir, gerekli kimlik bilgileri açıktır ve riskli eylemler inceleme, kuru çalıştırma, önizleme veya onay yolları içerir. |
| Savunmacı güvenlik, moderasyon ve kötüye kullanım incelemesi | Araç yetkili inceleme için konumlandırılmıştır, kanıtları korur ve insan onayı sınırlarını net tutar.                            |
| Kişisel veya ekip iş akışları                    | İş akışı rızaya dayalı hesaplar, şeffaf kurulum ve açık izinler kullanır.                                                         |
| Bakımı yapılan kataloglar                        | Her listeleme ayırt edilebilir, faydalı, doğru açıklanmış ve makul ölçüde bakımı yapılmış durumdadır.                            |

Bağlam önemlidir. Aynı konu, dar kapsamlı savunmacı veya rızaya dayalı bir
ortamda kabul edilebilirken, kötüye kullanım iş akışı olarak paketlendiğinde
kabul edilemez olabilir.

## Yasaklanan içerik

ClawHub, ana amacı kötüye kullanım, aldatma, güvenli olmayan yürütme veya hak
ihlali olan içerikleri barındırmaz.

| Kategori                                                    | İzin verilmez                                                                                                                                                                                                                                                                                                 |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Yetkisiz erişim veya güvenlik aşma                          | Kimlik doğrulama atlatma, hesap ele geçirme, hız sınırı kötüye kullanımı, canlı çağrı veya ajan ele geçirme, yeniden kullanılabilir oturum hırsızlığı ya da onaylanmamış kullanıcılar için eşleştirme akışlarını otomatik onaylama.                                                                        |
| Platform kötüye kullanımı ve yasaklardan kaçınma            | Yasaklardan sonra gizli hesaplar, hesap ısıtma veya toplama, sahte etkileşim, çok hesaplı otomasyon, toplu gönderi, spam botları ya da tespit edilmekten kaçınmak için oluşturulmuş otomasyon.                                                                                                               |
| Dolandırıcılık, aldatmacalar ve yanıltıcı finansal iş akışları | Sahte sertifikalar veya faturalar, aldatıcı ödeme akışları, dolandırıcılık amaçlı erişimler, sahte sosyal kanıt, dolandırıcılık için sentetik kimlik iş akışları ya da açık insan onayı olmadan harcama/ücretlendirme araçları.                                                                             |
| Gizliliği ihlal eden zenginleştirme veya gözetim            | Spam için kişi kazıma, doxxing, takip, istenmeyen iletişimle birlikte potansiyel müşteri çıkarma, gizli izleme, rıza dışı biyometrik eşleştirme ya da sızdırılmış veri veya ihlal dökümlerinin kullanımı.                                                                                                    |
| Rıza dışı taklit veya kimlik manipülasyonu                  | Yüz değiştirme, dijital ikizler, klonlanmış etkileyiciler, sahte kişilikler ya da taklit etmek veya yanıltmak için kullanılan diğer araçlar.                                                                                                                                                                  |
| Açık cinsel içerik veya güvenliği devre dışı bırakılmış yetişkin içerik üretimi | NSFW görüntü, video veya içerik üretimi; üçüncü taraf API'ler etrafında yetişkin içerik sarmalayıcıları; ya da birincil amacı açık cinsel içerik olan listelemeler.                                                                                                                                          |
| Gizli, güvenli olmayan veya yanıltıcı yürütme gereksinimleri | Gizlenmiş kurulum komutları, indirilen içeriğin açık inceleme olanağı olmadan `sh` veya `bash` ile çalıştırılması gibi pipe-to-shell kurucular, beyan edilmemiş gizli anahtar veya özel anahtar gereksinimleri, açık inceleme olanağı olmadan uzak `npx @latest` yürütmesi ya da listelemenin çalışmak için gerçekte neye ihtiyaç duyduğunu gizleyen meta veriler. |
| Telif hakkını ihlal eden veya hakları çiğneyen materyal     | Başkasının Skill'ini, Plugin'ini, belgelerini, marka varlıklarını veya tescilli kodunu izinsiz yeniden yayımlamak; lisans koşullarını ihlal etmek; ya da özgün yazar veya yayıncıyı taklit etmek.                                                                                                            |

## Yasaklanan pazar yeri davranışı

ClawHub, yayıncıların pazar yerini nasıl kullandığını da inceler. ClawHub'ı
keşfi, metrikleri, güven sinyallerini, moderasyon sistemlerini veya kullanıcı
dikkatini manipüle etmek için kullanmayın.

Yasaklanan pazar yeri davranışı şunları içerir:

- gerçek kullanıcı değeri varmış gibi görünmeyen, düşük emekli, yinelenen, yer
  tutucu veya makine tarafından üretilmiş çok sayıda listelemeyi toplu yayımlamak
- arama veya kategori yüzeylerini neredeyse aynı Skills ya da Plugin'lerle doldurmak
- kullanım, bakım, kaynak açıklığı veya anlamlı farklılaşması çok az olan ya da
  hiç olmayan yüzlerce listeleme yayımlamak
- kurulumları, indirmeleri, yıldızları veya diğer etkileşim metriklerini
  otomasyon, kendi kendine kurulum döngüleri, sahte hesaplar, koordineli
  etkinlik, ücretli etkileşim veya diğer organik olmayan davranışlarla yapay
  olarak şişirmek
- moderasyondan, yasaklardan, yayıncı sınırlarından veya pazar yeri
  incelemesinden kaçınmak için hesap oluşturmak veya hesapları döndürmek
- sahiplik, kaynak, yetenekler, güvenlik duruşu, kurulum gereksinimleri veya
  başka bir proje ya da yayıncıyla ilişki konusunda kullanıcıları yanıltmak
- temel sorunu düzeltmeden daha önce gizlenmiş, kaldırılmış veya engellenmiş
  içeriği tekrar tekrar yüklemek

Yüksek hacimli yayımlama otomatik olarak kötüye kullanım değildir. Listelemeler
anlamlı biçimde farklı, doğru açıklanmış, bakımı yapılmış ve gerçek kullanıcılar
tarafından kullanılıyor olduğunda büyük kataloglar kabul edilebilir. Hacim; zayıf,
yinelenen, yanıltıcı, bakımsız veya yapay olarak öne çıkarılmış listelemelerle
birleştiğinde büyük kataloglar bir güven ve güvenlik sorununa dönüşür.

## İçerik hakları

ClawHub'daki içeriğin telif hakkınızı veya diğer haklarınızı ihlal ettiğine
inanıyorsanız [İçerik Hakları Talepleri](/tr/clawhub/content-rights) sayfasını
kullanın. Listeleme aynı zamanda güvenli değil, kötü amaçlı veya yanıltıcı
değilse, telif hakkı veya hak iddiaları için normal pazar yeri raporlarını
kullanmayın.

## İnceleme ve yaptırım

ClawHub, güvenli olmayan içeriği veya kötüye kullanım niteliğindeki yayımlama
davranışını belirlemek için otomatik kontroller, istatistiksel kötüye kullanım
sinyalleri, kullanıcı raporları ve personel incelemesi kullanabilir. Bir sinyal
tek başına kötüye kullanımı kanıtlamaz; ClawHub'ın neyin incelenmesi gerektiğine
karar vermesine yardımcı olur.

Şunları yapabiliriz:

- ihlalde bulunan listelemeleri gizlemek, bekletmek, kaldırmak, geçici olarak
  silmek veya kaynak türü için destekleniyorsa kalıcı olarak silmek
- güvenli olmayan sürümler için indirmeleri veya kurulumları engellemek
- API belirteçlerini iptal etmek
- ilişkili içeriği geçici olarak silmek
- yayımlama erişimini kısıtlamak
- tekrar eden veya ağır ihlal gerçekleştirenleri yasaklamak

Açık kötüye kullanım için önce uyarı verilen yaptırımı garanti etmiyoruz.
Raporlar, moderasyon bekletmeleri, gizli listelemeler, yasaklar ve hesap itibarı
için bkz. [Moderasyon ve Hesap Güvenliği](/tr/clawhub/moderation).
