---
read_when:
    - Yüklemeleri kötüye kullanım veya politika ihlalleri açısından inceleme
    - Moderasyon belgeleri veya inceleyici runbook'ları yazma
    - Bir Skills öğesinin gizlenip gizlenmemesine veya bir kullanıcının yasaklanıp yasaklanmamasına karar verme
sidebarTitle: Acceptable Usage
summary: 'Pazar yeri politikası: ClawHub''ın nelere izin verdiği ve neleri barındırmayacağı.'
title: Kabul Edilebilir Kullanım
x-i18n:
    generated_at: "2026-07-04T04:02:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ace357e7a3e9f4d242f113ad791b254e94ae8a841dd9a864a77c5bac15713132
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Kabul Edilebilir Kullanım

ClawHub, OpenClaw için Skills, plugin'ler, paketler ve pazar yeri meta verilerini barındırır.
İçerik veya yayınlama davranışının ClawHub'a ait olup olmadığına karar vermek için bu sayfayı kullanın.

Bu kurallar bir listelemenin ne yaptığı, kullanıcılardan ne çalıştırmalarını istediği, kendini nasıl temsil ettiği ve yayıncıların ClawHub'ın keşif, kurulum ve güven yüzeylerini nasıl kullandığı için geçerlidir. Moderasyon durumları ve hesap itibarı için bkz. [Moderasyon ve Hesap Güvenliği](/clawhub/moderation). Telif hakkı veya diğer hak talepleri için bkz. [İçerik Hakları Talepleri](/tr/clawhub/content-rights).

## İzin verilen içerik

ClawHub; yararlı, anlaşılır ve iyi niyetle yayımlanan içeriği memnuniyetle karşılar.

| Kategori                                         | Şu durumda izin verilir                                                                                                                      |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Geliştirici üretkenliği                           | Listeleme, kullanıcıların yazılım oluşturmasına, test etmesine, taşımasına, hata ayıklamasına, belgelemesine veya işletmesine yardımcı olur.                                               |
| UI, veri ve otomasyon iş akışları               | Kapsam açıktır, gerekli kimlik bilgileri açıkça belirtilmiştir ve riskli eylemler inceleme, deneme çalıştırması, önizleme veya onay yolları içerir. |
| Savunmacı güvenlik, moderasyon ve kötüye kullanım incelemesi | Araç yetkili inceleme için konumlandırılmıştır, kanıtları korur ve insan onayı sınırlarını açık tutar.                          |
| Kişisel veya ekip iş akışları                       | İş akışı rızaya dayalı hesaplar, şeffaf kurulum ve açık izinler kullanır.                                            |
| Bakımı yapılan kataloglar                              | Her listeleme ayrıdır, yararlıdır, doğru biçimde açıklanmıştır ve makul ölçüde bakımı yapılır.                                                |

Bağlam önemlidir. Aynı konu, dar kapsamlı savunmacı veya rızaya dayalı bir ortamda kabul edilebilirken kötüye kullanım iş akışı olarak paketlendiğinde kabul edilemez olabilir.

## İzin verilmeyen içerik

ClawHub; temel amacı kötüye kullanım, aldatma, güvenli olmayan yürütme veya hak ihlali olan içeriği barındırmaz.

| Kategori                                                    | İzin verilmez                                                                                                                                                                                                                                                                                                   |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Yetkisiz erişim veya güvenliği aşma                      | Kimlik doğrulama aşma, hesap ele geçirme, hız sınırı kötüye kullanımı, canlı çağrı veya ajan ele geçirme, yeniden kullanılabilir oturum hırsızlığı ya da onaylanmamış kullanıcılar için eşleştirme akışlarını otomatik onaylama.                                                                                                                                                   |
| Platform kötüye kullanımı ve yasaklardan kaçınma                              | Yasaklardan sonra gizli hesaplar, hesap ısıtma veya çiftliği, sahte etkileşim, çoklu hesap otomasyonu, toplu paylaşım, spam botları ya da tespitten kaçınmak için oluşturulmuş otomasyon.                                                                                                                                          |
| Dolandırıcılık, sahtekarlık ve aldatıcı finansal iş akışları             | Sahte sertifikalar veya faturalar, aldatıcı ödeme akışları, dolandırıcılık amaçlı iletişim, sahte sosyal kanıt, dolandırıcılık için sentetik kimlik iş akışları ya da açık insan onayı olmadan harcama/ücretlendirme araçları.                                                                                                                    |
| Gizliliği ihlal eden zenginleştirme veya gözetim                 | Spam için kişi toplama, doxxing, takip, istenmeyen iletişimle eşleştirilmiş potansiyel müşteri çıkarımı, gizli izleme, rıza dışı biyometrik eşleştirme ya da sızdırılmış veri veya ihlal dökümlerinin kullanımı.                                                                                                                  |
| Rıza dışı kimliğe bürünme veya kimlik manipülasyonu       | Yüz değiştirme, dijital ikizler, klonlanmış influencer'lar, sahte kişilikler veya kimliğe bürünmek ya da yanıltmak için kullanılan diğer araçlar.                                                                                                                                                                                                 |
| Açık cinsel içerik veya güvenlik devre dışı bırakılmış yetişkin içerik üretimi | NSFW görsel, video veya içerik üretimi; üçüncü taraf API'ler etrafında yetişkin içerik sarmalayıcıları; ya da birincil amacı açık cinsel içerik olan listelemeler.                                                                                                                                                       |
| Gizli, güvenli olmayan veya yanıltıcı yürütme gereksinimleri        | Karartılmış kurulum komutları, indirilen içeriğin açıkça incelenebilir olmadan `sh` veya `bash` ile çalıştırıldığı kabuğa yönlendirmeli yükleyiciler, beyan edilmemiş gizli anahtar veya özel anahtar gereksinimleri, açıkça incelenebilir olmadan uzaktan `npx @latest` yürütme ya da listelemenin çalışmak için gerçekte neye ihtiyaç duyduğunu gizleyen meta veriler. |
| Telif hakkını ihlal eden veya hakları ihlal eden materyal           | Başkasının Skill'ini, plugin'ini, dokümanlarını, marka varlıklarını veya özel mülkiyetli kodunu izinsiz yeniden yayımlamak; lisans koşullarını ihlal etmek; ya da özgün yazar veya yayıncı gibi davranmak.                                                                                                                            |

## İzin verilmeyen pazar yeri davranışı

ClawHub, yayıncıların pazar yerini nasıl kullandığını da inceler. ClawHub'ı keşfi, metrikleri, güven sinyallerini, moderasyon sistemlerini veya kullanıcı dikkatini manipüle etmek için kullanmayın.

İzin verilmeyen pazar yeri davranışı şunları içerir:

- gerçek kullanıcı değeri varmış gibi görünmeyen çok sayıda düşük çabalı, tekrarlı, yer tutucu veya makine tarafından üretilmiş listelemeyi toplu yayımlamak
- arama veya kategori yüzeylerini neredeyse aynı Skills ya da plugin'lerle doldurmak
- çok az kullanım, bakım, kaynak açıklığı veya anlamlı farklılaşma ile yüzlerce listeleme yayımlamak
- kurulumları, indirmeleri, yıldızları veya diğer etkileşim metriklerini otomasyon, kendi kendine kurulum döngüleri, sahte hesaplar, koordineli etkinlik, ücretli etkileşim ya da diğer organik olmayan davranışlarla yapay olarak şişirmek
- moderasyondan, yasaklardan, yayıncı sınırlarından veya pazar yeri incelemesinden kaçınmak için hesap oluşturmak ya da döndürmek
- kullanıcıları sahiplik, kaynak, yetenekler, güvenlik duruşu, kurulum gereksinimleri veya başka bir proje ya da yayıncıyla ilişki konusunda yanıltmak
- zaten gizlenmiş, kaldırılmış veya engellenmiş içeriği temel sorunu düzeltmeden tekrar tekrar yüklemek

Yüksek hacimli yayınlama otomatik olarak kötüye kullanım değildir. Listelemeler anlamlı biçimde farklı, doğru açıklanmış, bakımı yapılmış ve gerçek kullanıcılar tarafından kullanılıyorsa büyük kataloglar kabul edilebilir. Büyük kataloglar; hacim ince, tekrarlı, yanıltıcı, bakımı yapılmayan veya yapay olarak öne çıkarılan listelemelerle birleştiğinde güven ve güvenlik sorunu haline gelir.

## İçerik hakları

ClawHub'daki içeriğin telif hakkınızı veya diğer haklarınızı ihlal ettiğini düşünüyorsanız [İçerik Hakları Talepleri](/tr/clawhub/content-rights) sayfasını kullanın. Listeleme aynı zamanda güvenli değil, kötü amaçlı veya yanıltıcı değilse telif hakkı ya da hak talepleri için normal pazar yeri raporlarını kullanmayın.

## İnceleme ve yaptırım

ClawHub; güvenli olmayan içerikleri veya kötüye kullanıma dayalı yayınlama davranışını belirlemek için otomatik kontroller, istatistiksel kötüye kullanım sinyalleri, kullanıcı raporları ve personel incelemesi kullanabilir. Bir sinyal tek başına kötüye kullanımı kanıtlamaz; ClawHub'ın neyin incelenmesi gerektiğine karar vermesine yardımcı olur.

Şunları yapabiliriz:

- ihlal eden listelemeleri gizlemek, beklemeye almak, kaldırmak, geçici olarak silmek veya kaynak türü için desteklendiğinde kalıcı olarak silmek
- güvenli olmayan sürümler için indirmeleri veya kurulumları engellemek
- API belirteçlerini iptal etmek
- ilişkili içeriği geçici olarak silmek
- yayınlama erişimini kısıtlamak
- tekrarlayan veya ağır ihlal yapanları yasaklamak

Açık kötüye kullanım için önce uyarı yapılan yaptırımı garanti etmeyiz. Raporlar, moderasyon bekletmeleri, gizli listelemeler, yasaklar ve hesap itibarı için bkz. [Moderasyon ve Hesap Güvenliği](/clawhub/moderation).
