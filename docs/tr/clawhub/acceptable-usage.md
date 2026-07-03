---
read_when:
    - Yüklemeleri kötüye kullanım veya politika ihlalleri açısından inceleme
    - Moderasyon belgeleri veya gözden geçiren çalışma kitapları yazma
    - Bir skill’in gizlenip gizlenmeyeceğine veya bir kullanıcının yasaklanıp yasaklanmayacağına karar verme
sidebarTitle: Acceptable Usage
summary: 'Marketplace politikası: ClawHub’ın nelere izin verdiği ve neleri barındırmayacağı.'
title: Kabul Edilebilir Kullanım
x-i18n:
    generated_at: "2026-07-03T17:38:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ace357e7a3e9f4d242f113ad791b254e94ae8a841dd9a864a77c5bac15713132
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Kabul Edilebilir Kullanım

ClawHub, OpenClaw için Skills, Plugin'ler, paketler ve pazar yeri meta verilerini barındırır.
İçeriğin veya yayımlama davranışının ClawHub'da yer alıp almaması gerektiğine karar vermek için bu sayfayı kullanın.

Bu kurallar bir listelemenin ne yaptığına, kullanıcılardan ne çalıştırmalarını istediğine, kendisini nasıl temsil ettiğine ve yayımcıların ClawHub'ın keşif, yükleme ve güven yüzeylerini nasıl kullandığına uygulanır. Moderasyon durumları ve hesap itibarı için bkz.
[Moderasyon ve Hesap Güvenliği](/clawhub/moderation). Telif hakkı veya diğer hak talepleri için bkz. [İçerik Hakları Talepleri](/clawhub/content-rights).

## İzin verilen içerik

ClawHub; yararlı, anlaşılır ve iyi niyetle yayımlanan içeriği memnuniyetle karşılar.

| Kategori                                         | Şu durumlarda izin verilir                                                                                                                      |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Geliştirici üretkenliği                           | Listeleme, kullanıcıların yazılım geliştirmesine, test etmesine, taşımasına, hata ayıklamasına, belgelemesine veya işletmesine yardımcı olur.                                               |
| UI, veri ve otomasyon iş akışları               | Kapsam açıktır, gerekli kimlik bilgileri açıkça belirtilmiştir ve riskli eylemler inceleme, kuru çalıştırma, önizleme veya onay yolları içerir. |
| Savunma amaçlı güvenlik, moderasyon ve kötüye kullanım incelemesi | Araç yetkili inceleme için konumlandırılmıştır, kanıtları korur ve insan onayı sınırlarını açık tutar.                          |
| Kişisel veya ekip iş akışları                       | İş akışı, rızaya dayalı hesaplar, şeffaf kurulum ve açık izinler kullanır.                                            |
| Bakımı yapılan kataloglar                              | Her listeleme ayrı, yararlı, doğru açıklanmış ve makul ölçüde bakımı yapılmış durumdadır.                                                |

Bağlam önemlidir. Aynı konu, dar kapsamlı savunma amaçlı veya rızaya dayalı bir ortamda kabul edilebilirken, kötüye kullanım iş akışı olarak paketlendiğinde kabul edilemez olabilir.

## İzin verilmeyen içerik

ClawHub; ana amacı kötüye kullanım, aldatma, güvenli olmayan yürütme veya hak ihlali olan içeriği barındırmaz.

| Kategori                                                    | İzin verilmez                                                                                                                                                                                                                                                                                                   |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Yetkisiz erişim veya güvenlik atlatma                      | Kimlik doğrulama atlatma, hesap ele geçirme, hız sınırı kötüye kullanımı, canlı çağrı veya ajan ele geçirme, yeniden kullanılabilir oturum hırsızlığı ya da onaylanmamış kullanıcılar için eşleştirme akışlarını otomatik onaylama.                                                                                                                                                   |
| Platform kötüye kullanımı ve yasak atlatma                              | Yasaklardan sonra gizli hesaplar, hesap ısıtma veya çiftçiliği, sahte etkileşim, çoklu hesap otomasyonu, toplu gönderi, spam botları veya tespit edilmekten kaçınmak için oluşturulmuş otomasyon.                                                                                                                                          |
| Dolandırıcılık, aldatmacalar ve yanıltıcı finansal iş akışları             | Sahte sertifikalar veya faturalar, aldatıcı ödeme akışları, dolandırıcılık amaçlı erişim, sahte sosyal kanıt, dolandırıcılık için sentetik kimlik iş akışları ya da açık insan onayı olmadan harcama/ücretlendirme araçları.                                                                                                                    |
| Gizliliği ihlal eden zenginleştirme veya gözetim                 | Spam için kişi kazıma, doxxing, takip, istenmeyen erişimle eşleştirilmiş potansiyel müşteri çıkarımı, gizli izleme, rıza dışı biyometrik eşleştirme ya da sızdırılmış veri veya ihlal dökümlerinin kullanımı.                                                                                                                  |
| Rıza dışı taklit veya kimlik manipülasyonu       | Yüz değiştirme, dijital ikizler, klonlanmış fenomenler, sahte kişilikler veya taklit etmek ya da yanıltmak için kullanılan diğer araçlar.                                                                                                                                                                                                 |
| Müstehcen cinsel içerik veya güvenliği devre dışı bırakılmış yetişkin üretimi | NSFW görsel, video veya içerik üretimi; üçüncü taraf API'leri etrafında yetişkin içerik sarmalayıcıları; ya da birincil amacı müstehcen cinsel içerik olan listelemeler.                                                                                                                                                       |
| Gizli, güvenli olmayan veya yanıltıcı yürütme gereksinimleri        | Karartılmış yükleme komutları, açık inceleme olanağı olmadan `sh` veya `bash` ile çalıştırılan indirilmiş içerik gibi pipe-to-shell yükleyiciler, beyan edilmemiş gizli bilgi veya özel anahtar gereksinimleri, açık inceleme olanağı olmadan uzak `npx @latest` yürütmesi ya da listelemenin çalışmak için gerçekte neye ihtiyaç duyduğunu gizleyen meta veriler. |
| Telif hakkını ihlal eden veya hakları ihlal eden materyal           | Başkasının skill'ini, Plugin'ini, dokümantasyonunu, marka varlıklarını veya özel mülk kodunu izinsiz yeniden yayımlama; lisans koşullarını ihlal etme; ya da özgün yazarın veya yayımcının kimliğine bürünme.                                                                                                                            |

## İzin verilmeyen pazar yeri davranışı

ClawHub, yayımcıların pazar yerini nasıl kullandığını da inceler. ClawHub'ı keşfi, metrikleri, güven sinyallerini, moderasyon sistemlerini veya kullanıcı dikkatini manipüle etmek için kullanmayın.

İzin verilmeyen pazar yeri davranışı şunları içerir:

- gerçek kullanıcı değeri varmış gibi görünmeyen çok sayıda düşük emekli, yinelenen, yer tutucu veya makine tarafından oluşturulmuş listelemeyi toplu yayımlamak
- arama veya kategori yüzeylerini neredeyse aynı Skills ya da Plugin'lerle doldurmak
- çok az veya hiç kullanım, bakım, kaynak açıklığı ya da anlamlı farklılaşma olmadan yüzlerce listeleme yayımlamak
- yüklemeleri, indirmeleri, yıldızları veya diğer etkileşim metriklerini otomasyon, kendi kendine yükleme döngüleri, sahte hesaplar, koordineli etkinlik, ücretli etkileşim veya diğer organik olmayan davranışlarla yapay olarak artırmak
- moderasyonu, yasakları, yayımcı sınırlarını veya pazar yeri incelemesini atlatmak için hesap oluşturmak ya da döndürmek
- kullanıcıları sahiplik, kaynak, yetenekler, güvenlik duruşu, yükleme gereksinimleri veya başka bir proje ya da yayımcıyla bağlantı konusunda yanıltmak
- altta yatan sorunu düzeltmeden daha önce gizlenmiş, kaldırılmış veya engellenmiş içeriği tekrar tekrar yüklemek

Yüksek hacimli yayımlama otomatik olarak kötüye kullanım değildir. Listelemeler anlamlı şekilde farklı, doğru açıklanmış, bakımı yapılmış ve gerçek kullanıcılar tarafından kullanılıyor olduğunda büyük kataloglar kabul edilebilir. Büyük kataloglar; hacim zayıf, yinelenen, yanıltıcı, bakımsız veya yapay olarak öne çıkarılmış listelemelerle birleştiğinde bir güven ve güvenlik sorunu haline gelir.

## İçerik hakları

ClawHub'daki içeriğin telif hakkınızı veya diğer haklarınızı ihlal ettiğine inanıyorsanız [İçerik Hakları Talepleri](/clawhub/content-rights) sayfasını kullanın. Listeleme aynı zamanda güvenli değil, kötü amaçlı veya yanıltıcı değilse telif hakkı ya da hak talepleri için normal pazar yeri raporlarını kullanmayın.

## İnceleme ve yaptırım

ClawHub, güvenli olmayan içeriği veya kötüye kullanıma dayalı yayımlama davranışını belirlemek için otomatik kontroller, istatistiksel kötüye kullanım sinyalleri, kullanıcı raporları ve personel incelemesi kullanabilir. Bir sinyal tek başına kötüye kullanımı kanıtlamaz; ClawHub'ın neyin incelenmesi gerektiğine karar vermesine yardımcı olur.

Şunları yapabiliriz:

- ihlal eden listelemeleri gizlemek, beklemeye almak, kaldırmak, soft-delete yapmak veya kaynak türü için desteklendiğinde hard-delete yapmak
- güvenli olmayan sürümler için indirmeleri veya yüklemeleri engellemek
- API token'larını iptal etmek
- ilişkili içeriği soft-delete yapmak
- yayımlama erişimini kısıtlamak
- tekrarlayan veya ağır ihlalde bulunanları yasaklamak

Açık kötüye kullanım için önce uyarı yapılacağını garanti etmeyiz. Raporlar, moderasyon bekletmeleri, gizli listelemeler, yasaklar ve hesap itibarı için bkz.
[Moderasyon ve Hesap Güvenliği](/clawhub/moderation).
