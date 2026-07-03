---
read_when:
    - Yüklemeleri kötüye kullanım veya politika ihlalleri açısından inceleme
    - Moderasyon dokümanları veya gözden geçiren çalışma kitapları yazma
    - Bir skill'in gizlenip gizlenmemesine veya bir kullanıcının yasaklanıp yasaklanmamasına karar verme
sidebarTitle: Acceptable Usage
summary: 'Marketplace ilkesi: ClawHub’ın nelere izin verdiği ve neleri barındırmayacağı.'
title: Kabul Edilebilir Kullanım
x-i18n:
    generated_at: "2026-07-03T01:02:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ace357e7a3e9f4d242f113ad791b254e94ae8a841dd9a864a77c5bac15713132
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Kabul Edilebilir Kullanım

ClawHub, OpenClaw için Skills, Plugin, paketler ve pazar yeri meta verilerini barındırır.
İçeriğin veya yayımlama davranışının ClawHub'a ait olup olmadığına karar vermek için bu sayfayı kullanın.

Bu kurallar, bir listelemenin ne yaptığına, kullanıcılardan ne çalıştırmalarını istediğine, kendini nasıl temsil ettiğine ve yayıncıların ClawHub'ın keşif, kurulum ve güven yüzeylerini nasıl kullandığına uygulanır. Moderasyon durumları ve hesap itibarı için bkz. [Moderasyon ve Hesap Güvenliği](/clawhub/moderation). Telif hakkı veya diğer hak talepleri için bkz. [İçerik Hakları Talepleri](/tr/clawhub/content-rights).

## İzin verilen içerik

ClawHub; yararlı, anlaşılır ve iyi niyetle yayımlanmış içeriği memnuniyetle karşılar.

| Kategori                                         | Şu durumlarda izin verilir                                                                                                      |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| Geliştirici üretkenliği                          | Listeleme, kullanıcıların yazılım geliştirmesine, test etmesine, taşımasına, hata ayıklamasına, belgelemesine veya işletmesine yardımcı olur. |
| UI, veri ve otomasyon iş akışları                | Kapsam nettir, gerekli kimlik bilgileri açıkça belirtilir ve riskli eylemler inceleme, dry-run, önizleme veya onay yolları içerir. |
| Savunma amaçlı güvenlik, moderasyon ve kötüye kullanım incelemesi | Araç yetkili inceleme için konumlandırılmıştır, kanıtları korur ve insan onayı sınırlarını net tutar.                          |
| Kişisel veya ekip iş akışları                    | İş akışı rızaya dayalı hesaplar, şeffaf kurulum ve açık izinler kullanır.                                                       |
| Bakımı yapılan kataloglar                        | Her listeleme ayırt edilebilir, yararlı, doğru tanımlanmış ve makul ölçüde bakımı yapılmıştır.                                  |

Bağlam önemlidir. Aynı konu, dar kapsamlı savunma amaçlı veya rızaya dayalı bir ortamda kabul edilebilirken, bir kötüye kullanım iş akışı olarak paketlendiğinde kabul edilemez olabilir.

## İzin verilmeyen içerik

ClawHub, ana amacı kötüye kullanım, aldatma, güvenli olmayan yürütme veya hak ihlali olan içeriği barındırmaz.

| Kategori                                                    | İzin verilmez                                                                                                                                                                                                                                                                                                   |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Yetkisiz erişim veya güvenlik atlatma                       | Kimlik doğrulama atlatma, hesap ele geçirme, hız sınırı kötüye kullanımı, canlı çağrı veya ajan ele geçirme, yeniden kullanılabilir oturum hırsızlığı ya da onaylanmamış kullanıcılar için eşleştirme akışlarını otomatik onaylama.                                                                                                                                                   |
| Platform kötüye kullanımı ve yasaklardan kaçınma            | Yasaklardan sonra gizli hesaplar, hesap ısıtma veya çiftçiliği, sahte etkileşim, çoklu hesap otomasyonu, toplu gönderi, spam botları veya tespit edilmekten kaçınmak için oluşturulmuş otomasyon.                                                                                                                                          |
| Dolandırıcılık, sahtekarlık ve aldatıcı finansal iş akışları | Sahte sertifikalar veya faturalar, aldatıcı ödeme akışları, dolandırıcılık amaçlı erişim, sahte sosyal kanıt, dolandırıcılık için sentetik kimlik iş akışları ya da açık insan onayı olmadan harcama/ücretlendirme araçları.                                                                                                                    |
| Gizliliği ihlal eden zenginleştirme veya gözetim            | Spam için kişi kazıma, doxxing, takip, istenmeyen erişimle birlikte lead çıkarma, gizli izleme, rıza dışı biyometrik eşleştirme ya da sızdırılmış veri veya ihlal dökümlerinin kullanımı.                                                                                                                  |
| Rıza dışı taklit veya kimlik manipülasyonu                  | Face swap, dijital ikizler, klonlanmış influencer'lar, sahte kişiler veya taklit etmek ya da yanıltmak için kullanılan diğer araçlar.                                                                                                                                                                                                 |
| Açık cinsel içerik veya güvenliği devre dışı bırakılmış yetişkin içerik üretimi | NSFW görsel, video veya içerik üretimi; üçüncü taraf API'ler etrafında yetişkin içerik sarmalayıcıları; ya da birincil amacı açık cinsel içerik olan listelemeler.                                                                                                                                                       |
| Gizli, güvenli olmayan veya yanıltıcı yürütme gereksinimleri | Gizlenmiş kurulum komutları, açık incelenebilirlik olmadan indirilen içeriğin `sh` veya `bash` ile çalıştırılması gibi pipe-to-shell kurulumları, beyan edilmemiş gizli anahtar veya özel anahtar gereksinimleri, açık incelenebilirlik olmadan uzaktan `npx @latest` yürütme ya da listelemenin çalışması için gerçekten neye ihtiyaç duyduğunu gizleyen meta veriler. |
| Telif hakkını ihlal eden veya hakları ihlal eden materyal   | Başkasının skill, plugin, dokümantasyon, marka varlıkları veya tescilli kodunu izinsiz yeniden yayımlamak; lisans koşullarını ihlal etmek; ya da özgün yazarı veya yayıncıyı taklit etmek.                                                                                                                            |

## İzin verilmeyen pazar yeri davranışı

ClawHub, yayıncıların pazar yerini nasıl kullandığını da inceler. Keşfi, metrikleri, güven sinyallerini, moderasyon sistemlerini veya kullanıcı dikkatini manipüle etmek için ClawHub'ı kullanmayın.

İzin verilmeyen pazar yeri davranışları şunları içerir:

- gerçek kullanıcı değeri taşıyor gibi görünmeyen çok sayıda düşük emekli, yinelemeli, yer tutucu veya makine tarafından üretilmiş listelemeyi toplu yayımlamak
- arama veya kategori yüzeylerini neredeyse aynı Skills ya da Plugin'lerle doldurmak
- çok az kullanım, bakım, kaynak netliği veya anlamlı farklılaşma içeren ya da hiç içermeyen yüzlerce listeleme yayımlamak
- kurulumları, indirmeleri, yıldızları veya diğer etkileşim metriklerini otomasyon, kendi kendine kurulum döngüleri, sahte hesaplar, koordine etkinlik, ücretli etkileşim veya diğer organik olmayan davranışlarla yapay olarak şişirmek
- moderasyondan, yasaklardan, yayıncı limitlerinden veya pazar yeri incelemesinden kaçınmak için hesap oluşturmak ya da döndürmek
- kullanıcıları sahiplik, kaynak, yetenekler, güvenlik duruşu, kurulum gereksinimleri veya başka bir proje ya da yayıncıyla bağlantı konusunda yanıltmak
- temel sorunu düzeltmeden daha önce gizlenmiş, kaldırılmış veya engellenmiş içeriği tekrar tekrar yüklemek

Yüksek hacimli yayımlama otomatik olarak kötüye kullanım değildir. Büyük kataloglar, listelemeler anlamlı biçimde farklı, doğru tanımlanmış, bakımı yapılmış ve gerçek kullanıcılar tarafından kullanılıyor olduğunda kabul edilebilir. Büyük kataloglar; hacim ince, yinelemeli, yanıltıcı, bakımı yapılmayan veya yapay olarak tanıtılan listelemelerle birleştiğinde bir güven ve güvenlik sorunu haline gelir.

## İçerik hakları

ClawHub'daki içeriğin telif hakkınızı veya diğer haklarınızı ihlal ettiğine inanıyorsanız [İçerik Hakları Talepleri](/tr/clawhub/content-rights) sayfasını kullanın. Listeleme aynı zamanda güvenli değil, kötü amaçlı veya yanıltıcı değilse telif hakkı ya da hak talepleri için normal pazar yeri raporlarını kullanmayın.

## İnceleme ve yaptırım

ClawHub, güvenli olmayan içeriği veya kötüye kullanıma yönelik yayımlama davranışını belirlemek için otomatik kontroller, istatistiksel kötüye kullanım sinyalleri, kullanıcı raporları ve personel incelemesi kullanabilir. Bir sinyal tek başına kötüye kullanımı kanıtlamaz; ClawHub'ın neyin inceleme gerektirdiğine karar vermesine yardımcı olur.

Şunları yapabiliriz:

- ihlal eden listelemeleri gizlemek, bekletmek, kaldırmak, geçici silmek veya kaynak türü için desteklendiği yerlerde kalıcı silmek
- güvenli olmayan sürümler için indirmeleri veya kurulumları engellemek
- API tokenlarını iptal etmek
- ilişkili içeriği geçici silmek
- yayımlama erişimini kısıtlamak
- tekrarlayan veya ciddi ihlal yapanları yasaklamak

Açık kötüye kullanım durumlarında önce uyarı yapılacağını garanti etmeyiz. Raporlar, moderasyon bekletmeleri, gizli listelemeler, yasaklar ve hesap itibarı için bkz. [Moderasyon ve Hesap Güvenliği](/clawhub/moderation).
