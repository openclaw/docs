---
read_when:
    - Yüklemeleri kötüye kullanım veya politika ihlalleri açısından inceleme
    - Moderasyon dokümanları veya inceleyici çalışma kılavuzları yazma
    - Bir skill'in gizlenip gizlenmemesi veya bir kullanıcının yasaklanıp yasaklanmaması kararını verme
sidebarTitle: Acceptable Usage
summary: 'Pazar yeri ilkesi: ClawHub''ın nelere izin verdiği ve neleri barındırmayacağı.'
title: Kabul Edilebilir Kullanım
x-i18n:
    generated_at: "2026-07-02T14:09:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ace357e7a3e9f4d242f113ad791b254e94ae8a841dd9a864a77c5bac15713132
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Kabul Edilebilir Kullanım

ClawHub, OpenClaw için Skills, Plugin'ler, paketler ve marketplace meta verilerini barındırır.
İçeriğin veya yayınlama davranışının ClawHub'a ait olup olmadığına karar vermek için bu sayfayı kullanın.

Bu kurallar, bir listelemenin ne yaptığı, kullanıcılardan ne çalıştırmalarını istediği, kendini nasıl temsil ettiği ve yayıncıların ClawHub'ın keşif, yükleme ve güven yüzeylerini nasıl kullandığı için geçerlidir. Moderasyon durumları ve hesap konumu için bkz. [Moderasyon ve Hesap Güvenliği](/clawhub/moderation). Telif hakkı veya diğer hak talepleri için bkz. [İçerik Hakları Talepleri](/tr/clawhub/content-rights).

## İzin verilen içerik

ClawHub; yararlı, anlaşılır ve iyi niyetle yayınlanan içerikleri memnuniyetle karşılar.

| Kategori                                         | Şu durumlarda izin verilir                                                                                                                      |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Geliştirici üretkenliği                           | Listeleme, kullanıcıların yazılım geliştirmesine, test etmesine, taşımasına, hata ayıklamasına, belgelemesine veya işletmesine yardımcı olur.                                               |
| UI, veri ve otomasyon iş akışları               | Kapsam açıktır, gerekli kimlik bilgileri açıkça belirtilmiştir ve riskli eylemler inceleme, dry-run, önizleme veya onay yolları içerir. |
| Savunma amaçlı güvenlik, moderasyon ve kötüye kullanım incelemesi | Araç yetkili inceleme için çerçevelenmiştir, kanıtları korur ve insan onayı sınırlarını açık tutar.                          |
| Kişisel veya ekip iş akışları                       | İş akışı rızaya dayalı hesaplar, şeffaf kurulum ve açık izinler kullanır.                                            |
| Bakımı yapılan kataloglar                              | Her listeleme ayrı, yararlı, doğru açıklanmış ve makul şekilde bakımı yapılan niteliktedir.                                                |

Bağlam önemlidir. Aynı konu, dar bir savunma amaçlı veya rızaya dayalı ortamda kabul edilebilirken, kötüye kullanım iş akışı olarak paketlendiğinde kabul edilemez olabilir.

## İzin verilmeyen içerik

ClawHub; ana amacı kötüye kullanım, aldatma, güvenli olmayan yürütme veya hak ihlali olan içerikleri barındırmaz.

| Kategori                                                    | İzin verilmez                                                                                                                                                                                                                                                                                                   |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Yetkisiz erişim veya güvenlik atlatma                      | Kimlik doğrulama atlatma, hesap ele geçirme, rate-limit kötüye kullanımı, canlı çağrı veya ajan ele geçirme, yeniden kullanılabilir oturum hırsızlığı ya da onaylanmamış kullanıcılar için eşleştirme akışlarını otomatik onaylama.                                                                                                                                                   |
| Platform kötüye kullanımı ve yasak atlatma                              | Yasaklardan sonra gizli hesaplar, hesap ısıtma veya yetiştirme, sahte etkileşim, çok hesaplı otomasyon, toplu paylaşım, spam botları veya tespit edilmekten kaçınmak için oluşturulmuş otomasyon.                                                                                                                                          |
| Dolandırıcılık, sahtekarlık ve aldatıcı finansal iş akışları             | Sahte sertifikalar veya faturalar, aldatıcı ödeme akışları, dolandırıcılık amaçlı erişim girişimleri, sahte sosyal kanıt, dolandırıcılık için sentetik kimlik iş akışları veya açık insan onayı olmadan harcama/ücretlendirme araçları.                                                                                                                    |
| Gizliliği ihlal eden zenginleştirme veya gözetim                 | Spam için kişi kazıma, doxxing, takip, istenmeyen erişimle eşleştirilmiş müşteri adayı çıkarma, gizli izleme, rıza dışı biyometrik eşleştirme veya sızdırılmış veri ya da ihlal dökümlerinin kullanımı.                                                                                                                  |
| Rıza dışı taklit veya kimlik manipülasyonu       | Yüz değiştirme, dijital ikizler, klonlanmış influencer'lar, sahte personalar veya taklit etmek ya da yanıltmak için kullanılan diğer araçlar.                                                                                                                                                                                                 |
| Açık cinsel içerik veya güvenliği devre dışı bırakılmış yetişkin içerik üretimi | NSFW görsel, video veya içerik üretimi; üçüncü taraf API'leri etrafındaki yetişkin içerik sarmalayıcıları; ya da birincil amacı açık cinsel içerik olan listelemeler.                                                                                                                                                       |
| Gizli, güvenli olmayan veya yanıltıcı yürütme gereksinimleri        | Gizlenmiş yükleme komutları, açıkça incelenebilirlik olmadan `sh` veya `bash` ile çalıştırılan indirilmiş içerik gibi pipe-to-shell yükleyicileri, beyan edilmemiş gizli anahtar veya özel anahtar gereksinimleri, açıkça incelenebilirlik olmadan uzaktan `npx @latest` yürütme veya listelemenin çalışmak için gerçekten neye ihtiyaç duyduğunu gizleyen meta veriler. |
| Telif hakkını ihlal eden veya hakları ihlal eden materyal           | Başkasının skill'ini, Plugin'ini, dokümanlarını, marka varlıklarını veya tescilli kodunu izinsiz yeniden yayınlama; lisans koşullarını ihlal etme; ya da özgün yazarı veya yayıncıyı taklit etme.                                                                                                                            |

## İzin verilmeyen marketplace davranışı

ClawHub, yayıncıların marketplace'i nasıl kullandığını da inceler. ClawHub'ı keşfi, metrikleri, güven sinyallerini, moderasyon sistemlerini veya kullanıcı dikkatini manipüle etmek için kullanmayın.

İzin verilmeyen marketplace davranışları şunları içerir:

- gerçek kullanıcı değeri var gibi görünmeyen, düşük emekli, yinelemeli, yer tutucu veya
  makine tarafından üretilmiş çok sayıda listelemeyi toplu yayınlama
- arama veya kategori yüzeylerini neredeyse aynı Skills ya da Plugin'lerle doldurma
- az ya da hiç kullanım, bakım, kaynak netliği veya anlamlı farklılaşma olmadan
  yüzlerce listeleme yayınlama
- yüklemeleri, indirmeleri, yıldızları veya diğer etkileşim
  metriklerini otomasyon, kendi kendine yükleme döngüleri, sahte hesaplar, koordine
  faaliyet, ücretli etkileşim veya diğer organik olmayan davranışlarla yapay olarak artırma
- moderasyonu, yasakları, yayıncı limitlerini veya
  marketplace incelemesini atlatmak için hesap oluşturma ya da döndürme
- mülkiyet, kaynak, yetenekler, güvenlik duruşu,
  yükleme gereksinimleri veya başka bir proje ya da yayıncıyla ilişki konusunda kullanıcıları yanıltma
- altta yatan sorunu düzeltmeden, daha önce gizlenmiş, kaldırılmış veya engellenmiş
  içerikleri tekrar tekrar yükleme

Yüksek hacimli yayınlama otomatik olarak kötüye kullanım değildir. Listelemeler anlamlı şekilde farklı, doğru açıklanmış, bakımı yapılan ve gerçek kullanıcılar tarafından kullanılan nitelikteyse büyük kataloglar kabul edilebilir. Hacim; zayıf, yinelemeli, yanıltıcı, bakımı yapılmayan veya yapay olarak öne çıkarılan listelemelerle birleştiğinde büyük kataloglar bir güven ve emniyet sorunu haline gelir.

## İçerik hakları

ClawHub'daki içeriğin telif hakkınızı veya diğer haklarınızı ihlal ettiğine inanıyorsanız [İçerik Hakları Talepleri](/tr/clawhub/content-rights) sayfasını kullanın. Listeleme aynı zamanda güvenli değil, kötü amaçlı veya yanıltıcı değilse, telif hakkı ya da hak talepleri için normal marketplace raporlarını kullanmayın.

## İnceleme ve yaptırım

ClawHub, güvenli olmayan içeriği veya kötüye kullanım niteliğindeki yayınlama davranışını belirlemek için otomatik kontroller, istatistiksel kötüye kullanım sinyalleri, kullanıcı raporları ve personel incelemesi kullanabilir. Bir sinyal tek başına kötüye kullanımı kanıtlamaz; ClawHub'ın neyin incelenmesi gerektiğine karar vermesine yardımcı olur.

Şunları yapabiliriz:

- ihlal eden listelemeleri gizleme, bekletme, kaldırma, soft-delete yapma veya kaynak türü için desteklendiğinde
  hard-delete yapma
- güvenli olmayan sürümler için indirmeleri veya yüklemeleri engelleme
- API token'larını iptal etme
- ilişkili içeriği soft-delete yapma
- yayınlama erişimini kısıtlama
- tekrar eden veya ağır ihlalcileri yasaklama

Açık kötüye kullanım için önce uyarı uygulanacağını garanti etmeyiz. Raporlar, moderasyon bekletmeleri, gizli listelemeler, yasaklar ve hesap konumu için bkz. [Moderasyon ve Hesap Güvenliği](/clawhub/moderation).
