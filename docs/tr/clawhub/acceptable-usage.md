---
read_when:
    - Kötüye kullanım veya politika ihlalleri için yüklemeleri inceleme
    - Moderasyon belgeleri veya inceleyici runbook’ları yazma
    - Bir skill'in gizlenip gizlenmemesine veya bir kullanıcının yasaklanıp yasaklanmamasına karar verme
sidebarTitle: Acceptable Usage
summary: 'Pazar yeri ilkesi: ClawHub''ın nelere izin verdiği ve neleri barındırmayacağı.'
title: Kabul Edilebilir Kullanım
x-i18n:
    generated_at: "2026-07-02T17:43:55Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ace357e7a3e9f4d242f113ad791b254e94ae8a841dd9a864a77c5bac15713132
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Kabul Edilebilir Kullanım

ClawHub, OpenClaw için becerileri, pluginleri, paketleri ve pazar yeri meta verilerini barındırır.
İçeriğin veya yayımlama davranışının ClawHub'a ait olup olmadığına karar vermek için bu sayfayı kullanın.

Bu kurallar; bir listelemenin ne yaptığı, kullanıcılardan ne çalıştırmalarını istediği, kendini nasıl temsil ettiği ve yayımcıların ClawHub'ın keşif, yükleme ve güven yüzeylerini nasıl kullandığı için geçerlidir. Moderasyon durumları ve hesap durumu için [Moderasyon ve Hesap Güvenliği](/clawhub/moderation) bölümüne bakın. Telif hakkı veya diğer hak talepleri için [İçerik Hakları Talepleri](/clawhub/content-rights) bölümüne bakın.

## İzin verilen içerik

ClawHub; yararlı, anlaşılır ve iyi niyetle yayımlanan içerikleri memnuniyetle karşılar.

| Kategori                                         | Ne zaman izin verilir                                                                                                             |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Geliştirici üretkenliği                          | Listeleme, kullanıcıların yazılım geliştirmesine, test etmesine, taşımasına, hata ayıklamasına, belgelemesine veya işletmesine yardımcı olur. |
| UI, veri ve otomasyon iş akışları                | Kapsam nettir, gerekli kimlik bilgileri açıktır ve riskli eylemler inceleme, deneme çalıştırması, önizleme veya onay yolları içerir. |
| Savunma amaçlı güvenlik, moderasyon ve kötüye kullanım incelemesi | Araç yetkili inceleme için çerçevelenir, kanıtları korur ve insan onayı sınırlarını net tutar.                          |
| Kişisel veya ekip iş akışları                    | İş akışı, rızaya dayalı hesaplar, şeffaf kurulum ve açık izinler kullanır.                                            |
| Bakımı yapılan kataloglar                        | Her listeleme farklı, yararlı, doğru açıklanmış ve makul şekilde bakımı yapılmış durumdadır.                                                |

Bağlam önemlidir. Aynı konu, dar kapsamlı savunma amaçlı veya rızaya dayalı bir ortamda kabul edilebilirken, kötüye kullanım iş akışı olarak paketlendiğinde kabul edilemez olabilir.

## İzin verilmeyen içerik

ClawHub; ana amacı kötüye kullanım, aldatma, güvenli olmayan yürütme veya hak ihlali olan içerikleri barındırmaz.

| Kategori                                                    | İzin verilmez                                                                                                                                                                                                                                                                                                   |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Yetkisiz erişim veya güvenlik atlatma                       | Kimlik doğrulama atlatma, hesap ele geçirme, hız sınırı kötüye kullanımı, canlı çağrı veya aracı ele geçirme, yeniden kullanılabilir oturum hırsızlığı ya da onaylanmamış kullanıcılar için eşleştirme akışlarını otomatik onaylama.                                                                                                                                                   |
| Platform kötüye kullanımı ve yasak atlatma                  | Yasaklardan sonra gizli hesaplar, hesap ısıtma veya çiftçiliği, sahte etkileşim, çoklu hesap otomasyonu, toplu gönderi paylaşımı, spam botları veya tespitten kaçınmak için oluşturulmuş otomasyon.                                                                                                                                          |
| Dolandırıcılık, sahtekarlık ve aldatıcı finansal iş akışları | Sahte sertifikalar veya faturalar, aldatıcı ödeme akışları, dolandırıcılık amaçlı erişim, sahte sosyal kanıt, dolandırıcılık için sentetik kimlik iş akışları ya da açık insan onayı olmadan harcama/ücretlendirme araçları.                                                                                                                    |
| Gizliliği ihlal eden zenginleştirme veya gözetim            | Spam için kişi kazıma, doxxing, takip, istenmeyen erişimle eşleştirilmiş potansiyel müşteri çıkarımı, gizli izleme, rıza dışı biyometrik eşleştirme ya da sızdırılmış veri veya ihlal dökümlerinin kullanımı.                                                                                                                  |
| Rıza dışı kimliğe bürünme veya kimlik manipülasyonu         | Yüz değiştirme, dijital ikizler, klonlanmış influencerlar, sahte kişilikler veya kimliğe bürünmek ya da yanıltmak için kullanılan diğer araçlar.                                                                                                                                                                                                 |
| Açık cinsel içerik veya güvenliği devre dışı bırakılmış yetişkin üretimi | NSFW görüntü, video veya içerik üretimi; üçüncü taraf API'leri etrafında yetişkin içerik sarmalayıcıları; ya da birincil amacı açık cinsel içerik olan listelemeler.                                                                                                                                                       |
| Gizli, güvenli olmayan veya yanıltıcı yürütme gereksinimleri | Gizlenmiş yükleme komutları, açıkça incelenebilirlik olmadan `sh` veya `bash` ile çalıştırılan indirilmiş içerik gibi pipe-to-shell yükleyicileri, beyan edilmemiş gizli anahtar veya özel anahtar gereksinimleri, açık incelenebilirlik olmadan uzaktan `npx @latest` yürütme ya da listelemenin çalışmak için gerçekten neye ihtiyaç duyduğunu gizleyen meta veriler. |
| Telif hakkını ihlal eden veya hakları ihlal eden materyal   | Başkasının becerisini, pluginini, belgelerini, marka varlıklarını veya tescilli kodunu izinsiz yeniden yayımlamak; lisans koşullarını ihlal etmek; ya da özgün yazarın veya yayımcının kimliğine bürünmek.                                                                                                                            |

## İzin verilmeyen pazar yeri davranışı

ClawHub, yayımcıların pazar yerini nasıl kullandığını da inceler. ClawHub'ı keşfi, metrikleri, güven sinyallerini, moderasyon sistemlerini veya kullanıcı dikkatini manipüle etmek için kullanmayın.

İzin verilmeyen pazar yeri davranışları şunları içerir:

- gerçek kullanıcı değeri varmış gibi görünmeyen, düşük çabalı, yinelenen, yer tutucu veya makine tarafından üretilmiş çok sayıda listelemeyi toplu yayımlama
- arama veya kategori yüzeylerini birbirine çok benzeyen beceriler veya pluginlerle doldurma
- kullanım, bakım, kaynak netliği veya anlamlı farklılaştırması çok az olan ya da hiç olmayan yüzlerce listeleme yayımlama
- yüklemeleri, indirmeleri, yıldızları veya diğer etkileşim metriklerini otomasyon, kendi kendine yükleme döngüleri, sahte hesaplar, koordineli etkinlik, ücretli etkileşim veya diğer organik olmayan davranışlarla yapay olarak şişirme
- moderasyondan, yasaklardan, yayımcı sınırlarından veya pazar yeri incelemesinden kaçmak için hesap oluşturma veya hesapları döndürme
- sahiplik, kaynak, yetenekler, güvenlik duruşu, yükleme gereksinimleri veya başka bir proje ya da yayımcıyla ilişki konusunda kullanıcıları yanıltma
- temel sorunu düzeltmeden daha önce gizlenmiş, kaldırılmış veya engellenmiş içeriği tekrar tekrar yükleme

Yüksek hacimli yayımlama otomatik olarak kötüye kullanım değildir. Listelemeler anlamlı biçimde farklı, doğru açıklanmış, bakımı yapılmış ve gerçek kullanıcılar tarafından kullanılıyor olduğunda büyük kataloglar kabul edilebilir. Hacim; zayıf, yinelenen, yanıltıcı, bakımı yapılmamış veya yapay olarak öne çıkarılmış listelemelerle eşleştiğinde büyük kataloglar bir güven ve emniyet sorununa dönüşür.

## İçerik hakları

ClawHub'daki içeriğin telif hakkınızı veya diğer haklarınızı ihlal ettiğini düşünüyorsanız [İçerik Hakları Talepleri](/clawhub/content-rights) bölümünü kullanın. Listeleme aynı zamanda güvensiz, kötü amaçlı veya yanıltıcı değilse telif hakkı veya hak talepleri için normal pazar yeri raporlarını kullanmayın.

## İnceleme ve yaptırım

ClawHub, güvenli olmayan içeriği veya kötüye kullanımlı yayımlama davranışını belirlemek için otomatik kontroller, istatistiksel kötüye kullanım sinyalleri, kullanıcı raporları ve personel incelemesi kullanabilir. Bir sinyal tek başına kötüye kullanımı kanıtlamaz; ClawHub'ın neyin incelenmesi gerektiğine karar vermesine yardımcı olur.

Şunları yapabiliriz:

- ihlal eden listelemeleri gizlemek, beklemeye almak, kaldırmak, soft-delete yapmak veya kaynak türü için desteklendiği durumlarda hard-delete yapmak
- güvenli olmayan sürümler için indirmeleri veya yüklemeleri engellemek
- API tokenlarını iptal etmek
- ilişkili içeriği soft-delete yapmak
- yayımlama erişimini kısıtlamak
- tekrarlayan veya ağır ihlal yapanları yasaklamak

Açık kötüye kullanım için önce uyarı uygulamasını garanti etmiyoruz. Raporlar, moderasyon bekletmeleri, gizli listelemeler, yasaklar ve hesap durumu için [Moderasyon ve Hesap Güvenliği](/clawhub/moderation) bölümüne bakın.
