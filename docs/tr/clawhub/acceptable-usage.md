---
read_when:
    - Kötüye kullanım veya politika ihlalleri için yüklemeleri inceleme
    - Moderasyon belgeleri veya inceleyici çalışma kılavuzları yazma
    - Bir skill’in gizlenip gizlenmeyeceğine veya bir kullanıcının yasaklanıp yasaklanmayacağına karar verme
sidebarTitle: Acceptable Usage
summary: 'Pazar yeri politikası: ClawHub''ın nelere izin verdiği ve neleri barındırmayacağı.'
title: Kabul Edilebilir Kullanım
x-i18n:
    generated_at: "2026-07-02T01:09:15Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ace357e7a3e9f4d242f113ad791b254e94ae8a841dd9a864a77c5bac15713132
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Kabul Edilebilir Kullanım

ClawHub, OpenClaw için Skills, Plugin’ler, paketler ve marketplace meta verilerini barındırır.
İçeriğin veya yayımlama davranışının ClawHub’da yer alıp almaması gerektiğine karar vermek için bu sayfayı kullanın.

Bu kurallar bir listelemenin ne yaptığına, kullanıcılardan ne çalıştırmalarını istediğine, kendini nasıl temsil ettiğine ve yayımcıların ClawHub’ın keşif, kurulum ve güven yüzeylerini nasıl kullandığına uygulanır. Moderasyon durumları ve hesap itibarı için bkz.
[Moderasyon ve Hesap Güvenliği](/clawhub/moderation). Telif hakkı veya diğer hak talepleri için bkz. [İçerik Hakları Talepleri](/clawhub/content-rights).

## İzin verilen içerik

ClawHub; yararlı, anlaşılır ve iyi niyetle yayımlanan içeriği memnuniyetle karşılar.

| Kategori                                         | İzin verildiği durum                                                                                                                      |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Geliştirici üretkenliği                           | Listeleme kullanıcıların yazılım geliştirmesine, test etmesine, taşımasına, hata ayıklamasına, belgelemesine veya çalıştırmasına yardımcı olur.                                               |
| UI, veri ve otomasyon iş akışları               | Kapsam açıktır, gerekli kimlik bilgileri açıkça belirtilmiştir ve riskli eylemler inceleme, dry-run, önizleme veya onay yolları içerir. |
| Savunma amaçlı güvenlik, moderasyon ve kötüye kullanım incelemesi | Araç yetkili inceleme için konumlandırılmıştır, kanıtları korur ve insan onayı sınırlarını açık tutar.                          |
| Kişisel veya ekip iş akışları                       | İş akışı rızaya dayalı hesaplar, şeffaf kurulum ve açık izinler kullanır.                                            |
| Bakımı yapılan kataloglar                              | Her listeleme farklı, yararlı, doğru biçimde açıklanmış ve makul ölçüde bakımı yapılmıştır.                                                |

Bağlam önemlidir. Aynı konu, dar bir savunma amaçlı veya rızaya dayalı ortamda kabul edilebilirken, kötüye kullanım iş akışı olarak paketlendiğinde kabul edilemez olabilir.

## İzin verilmeyen içerik

ClawHub, ana amacı kötüye kullanım, aldatma, güvensiz yürütme veya hak ihlali olan içeriği barındırmaz.

| Kategori                                                    | İzin verilmez                                                                                                                                                                                                                                                                                                   |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Yetkisiz erişim veya güvenlik atlatma                      | Kimlik doğrulama atlatma, hesap ele geçirme, rate-limit kötüye kullanımı, canlı çağrı veya ajan ele geçirme, yeniden kullanılabilir oturum hırsızlığı ya da onaylanmamış kullanıcılar için eşleştirme akışlarını otomatik onaylama.                                                                                                                                                   |
| Platform kötüye kullanımı ve yasak atlatma                              | Yasaklardan sonra gizli hesaplar, hesap ısıtma veya toplama, sahte etkileşim, çok hesaplı otomasyon, toplu gönderim, spam botları ya da tespitten kaçınmak için oluşturulmuş otomasyon.                                                                                                                                          |
| Dolandırıcılık, aldatmacalar ve yanıltıcı finansal iş akışları             | Sahte sertifikalar veya faturalar, yanıltıcı ödeme akışları, dolandırıcılık amaçlı erişim, sahte sosyal kanıt, dolandırıcılık için sentetik kimlik iş akışları ya da açık insan onayı olmadan harcama/ücretlendirme araçları.                                                                                                                    |
| Gizliliği ihlal eden zenginleştirme veya gözetim                 | Spam için kişi kazıma, doxxing, takip, istenmeyen erişimle birlikte potansiyel müşteri çıkarımı, gizli izleme, rıza dışı biyometrik eşleştirme ya da sızdırılmış veri veya ihlal dökümlerinin kullanımı.                                                                                                                  |
| Rıza dışı taklit veya kimlik manipülasyonu       | Yüz değiştirme, dijital ikizler, klonlanmış influencer’lar, sahte kişilikler ya da taklit etmek veya yanıltmak için kullanılan diğer araçlar.                                                                                                                                                                                                 |
| Açık cinsel içerik veya güvenliği devre dışı bırakılmış yetişkin içerik üretimi | NSFW görüntü, video veya içerik üretimi; üçüncü taraf API’ler etrafında yetişkin içerik sarmalayıcıları; ya da birincil amacı açık cinsel içerik olan listelemeler.                                                                                                                                                       |
| Gizli, güvensiz veya yanıltıcı yürütme gereksinimleri        | Gizlenmiş kurulum komutları, net incelenebilirlik olmadan `sh` veya `bash` ile çalıştırılan indirilmiş içerik gibi pipe-to-shell kurucular, beyan edilmemiş gizli bilgi veya özel anahtar gereksinimleri, net incelenebilirlik olmadan uzak `npx @latest` yürütmesi ya da listelemenin çalışmak için gerçekten neye ihtiyaç duyduğunu gizleyen meta veriler. |
| Telif hakkını ihlal eden veya hakları ihlal eden materyal           | Başkasının skill’ini, plugin’ini, dokümanlarını, marka varlıklarını veya özel mülkiyetli kodunu izinsiz yeniden yayımlamak; lisans koşullarını ihlal etmek; ya da özgün yazarı veya yayımcıyı taklit etmek.                                                                                                                            |

## İzin verilmeyen marketplace davranışı

ClawHub ayrıca yayımcıların marketplace’i nasıl kullandığını da inceler. ClawHub’ı keşfi, metrikleri, güven sinyallerini, moderasyon sistemlerini veya kullanıcı dikkatini manipüle etmek için kullanmayın.

İzin verilmeyen marketplace davranışları şunları içerir:

- gerçek kullanıcı değeri taşıdığı görünmeyen, düşük emekli, tekrarlı, yer tutucu veya
  makine tarafından oluşturulmuş çok sayıda listelemeyi toplu yayımlamak
- arama veya kategori yüzeylerini neredeyse aynı skills veya plugin’lerle doldurmak
- az veya hiç kullanım, bakım, kaynak netliği ya da anlamlı farklılaşma olmadan yüzlerce listeleme yayımlamak
- kurulumları, indirmeleri, yıldızları veya diğer etkileşim metriklerini otomasyon, kendi kendine kurulum döngüleri, sahte hesaplar, koordineli etkinlik,
  ücretli etkileşim ya da diğer organik olmayan davranışlarla yapay olarak artırmak
- moderasyonu, yasakları, yayımcı sınırlarını veya marketplace incelemesini atlatmak için hesap oluşturmak veya döndürmek
- sahiplik, kaynak, yetenekler, güvenlik duruşu, kurulum gereksinimleri veya başka bir proje ya da yayımcıyla ilişki konusunda kullanıcıları yanıltmak
- altında yatan sorunu düzeltmeden daha önce gizlenmiş, kaldırılmış veya engellenmiş içeriği tekrar tekrar yüklemek

Yüksek hacimli yayımlama otomatik olarak kötüye kullanım değildir. Listelemeler anlamlı biçimde farklı, doğru açıklanmış, bakımı yapılmış ve gerçek kullanıcılar tarafından kullanılıyorsa büyük kataloglar kabul edilebilir. Büyük kataloglar, hacim ince, tekrarlı, yanıltıcı, bakımsız veya yapay olarak öne çıkarılmış listelemelerle birleştiğinde güven ve güvenlik sorunu haline gelir.

## İçerik hakları

ClawHub’daki içeriğin telif hakkınızı veya diğer haklarınızı ihlal ettiğine inanıyorsanız [İçerik Hakları Talepleri](/clawhub/content-rights) sayfasını kullanın. Listeleme aynı zamanda güvensiz, kötü amaçlı veya yanıltıcı değilse telif hakkı veya hak talepleri için normal marketplace raporlarını kullanmayın.

## İnceleme ve yaptırım

ClawHub, güvensiz içeriği veya kötüye kullanım niteliğindeki yayımlama davranışını belirlemek için otomatik kontroller, istatistiksel kötüye kullanım sinyalleri, kullanıcı raporları ve personel incelemesi kullanabilir. Bir sinyal tek başına kötüye kullanımı kanıtlamaz; ClawHub’ın neyin incelenmesi gerektiğine karar vermesine yardımcı olur.

Şunları yapabiliriz:

- ihlal eden listelemeleri gizlemek, beklemeye almak, kaldırmak, soft-delete yapmak veya kaynak türü için desteklendiği durumlarda hard-delete yapmak
- güvensiz sürümler için indirmeleri veya kurulumları engellemek
- API token’larını iptal etmek
- ilişkili içeriği soft-delete yapmak
- yayımlama erişimini kısıtlamak
- tekrarlayan veya ciddi ihlalcileri yasaklamak

Açık kötüye kullanım durumlarında önce uyarı verme garantisi vermeyiz. Raporlar, moderasyon bekletmeleri, gizli listelemeler, yasaklar ve hesap itibarı için bkz.
[Moderasyon ve Hesap Güvenliği](/clawhub/moderation).
