---
read_when:
    - Yüklemeleri kötüye kullanım veya politika ihlalleri açısından inceleme
    - Moderasyon belgeleri veya gözden geçiren çalışma kılavuzları yazma
    - Bir becerinin gizlenip gizlenmeyeceğine veya bir kullanıcının yasaklanıp yasaklanmayacağına karar verme
sidebarTitle: Acceptable Usage
summary: 'Pazar yeri politikası: ClawHub''ın nelere izin verdiği ve neleri barındırmayacağı.'
title: Kabul Edilebilir Kullanım
x-i18n:
    generated_at: "2026-07-01T13:16:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ace357e7a3e9f4d242f113ad791b254e94ae8a841dd9a864a77c5bac15713132
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Kabul Edilebilir Kullanım

ClawHub, OpenClaw için Skills, Plugin'ler, paketler ve pazar yeri meta verileri barındırır.
İçeriğin veya yayımlama davranışının ClawHub'da yer alıp almadığına karar vermek için
bu sayfayı kullanın.

Bu kurallar bir listelemenin ne yaptığı, kullanıcılardan ne çalıştırmalarını istediği,
kendisini nasıl temsil ettiği ve yayıncıların ClawHub'ın keşif, kurulum ve güven
yüzeylerini nasıl kullandığı için geçerlidir. Moderasyon durumları ve hesap itibarı için
[Moderasyon ve Hesap Güvenliği](/clawhub/moderation) bölümüne bakın. Telif hakkı veya diğer hak
talepleri için [İçerik Hakları Talepleri](/tr/clawhub/content-rights) bölümüne bakın.

## İzin verilen içerik

ClawHub; yararlı, anlaşılır ve iyi niyetle yayımlanmış içerikleri memnuniyetle karşılar.

| Kategori                                         | Şu durumda izin verilir                                                                                                                      |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Geliştirici üretkenliği                          | Listeleme, kullanıcıların yazılım oluşturmasına, test etmesine, taşımasına, hata ayıklamasına, belgelemesine veya işletmesine yardımcı olur. |
| UI, veri ve otomasyon iş akışları                | Kapsam nettir, gerekli kimlik bilgileri açıktır ve riskli eylemler inceleme, kuru çalışma, önizleme veya onay yolları içerir. |
| Savunma amaçlı güvenlik, moderasyon ve kötüye kullanım incelemesi | Araç yetkili inceleme için konumlandırılmıştır, kanıtları korur ve insan onayı sınırlarını net tutar. |
| Kişisel veya ekip iş akışları                    | İş akışı rızaya dayalı hesaplar, şeffaf kurulum ve açık izinler kullanır. |
| Bakımı sürdürülen kataloglar                     | Her listeleme ayrı, yararlı, doğru açıklanmış ve makul ölçüde bakımı yapılan niteliktedir. |

Bağlam önemlidir. Aynı konu, dar kapsamlı savunma amaçlı veya rızaya dayalı bir
ortamda kabul edilebilirken, kötüye kullanım iş akışı olarak paketlendiğinde
kabul edilemez olabilir.

## İzin verilmeyen içerik

ClawHub, temel amacı kötüye kullanım, aldatma, güvenli olmayan yürütme veya hak
ihlali olan içerikleri barındırmaz.

| Kategori                                                    | İzin verilmez                                                                                                                                                                                                                                                                                                   |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Yetkisiz erişim veya güvenlik atlatma                       | Kimlik doğrulama atlatma, hesap ele geçirme, hız sınırı kötüye kullanımı, canlı çağrı veya agent ele geçirme, yeniden kullanılabilir oturum hırsızlığı ya da onaylanmamış kullanıcılar için eşleştirme akışlarını otomatik onaylama. |
| Platform kötüye kullanımı ve yasak aşma                     | Yasaklardan sonra gizli hesaplar, hesap ısıtma veya çiftçiliği, sahte etkileşim, çok hesaplı otomasyon, toplu paylaşım, spam botları veya tespitten kaçınmak için oluşturulmuş otomasyon. |
| Dolandırıcılık, sahtekarlık ve aldatıcı finansal iş akışları | Sahte sertifikalar veya faturalar, aldatıcı ödeme akışları, dolandırıcılık amaçlı erişim, sahte sosyal kanıt, dolandırıcılık için sentetik kimlik iş akışları ya da açık insan onayı olmadan harcama/ücretlendirme araçları. |
| Gizliliği ihlal eden zenginleştirme veya gözetim             | Spam için kişi toplama, doxxing, takip, istenmeyen erişimle birlikte müşteri adayı çıkarma, gizli izleme, rıza dışı biyometrik eşleştirme ya da sızdırılmış veri veya ihlal dökümlerinin kullanımı. |
| Rıza dışı taklit veya kimlik manipülasyonu                  | Yüz değiştirme, dijital ikizler, klonlanmış influencer'lar, sahte kişilikler ya da taklit etmek veya yanıltmak için kullanılan diğer araçlar. |
| Açık cinsel içerik veya güvenliği devre dışı bırakılmış yetişkin içerik üretimi | NSFW görsel, video veya içerik üretimi; üçüncü taraf API'ler etrafında yetişkin içerik sarmalayıcıları; ya da birincil amacı açık cinsel içerik olan listelemeler. |
| Gizli, güvenli olmayan veya yanıltıcı yürütme gereksinimleri | Gizlenmiş kurulum komutları, net incelenebilirlik olmadan indirilen içeriğin `sh` veya `bash` ile çalıştırıldığı pipe-to-shell kurucuları, beyan edilmemiş secret veya özel anahtar gereksinimleri, net incelenebilirlik olmadan uzaktan `npx @latest` yürütmesi ya da listelemenin çalışmak için gerçekten neye ihtiyaç duyduğunu gizleyen meta veriler. |
| Telif hakkını ihlal eden veya hakları ihlal eden materyal    | Başkasının skill'ini, plugin'ini, dokümanlarını, marka varlıklarını veya özel mülk kodunu izinsiz yeniden yayımlama; lisans koşullarını ihlal etme; ya da özgün yazarın veya yayıncının kimliğine bürünme. |

## İzin verilmeyen pazar yeri davranışı

ClawHub, yayıncıların pazar yerini nasıl kullandığını da inceler. ClawHub'ı
keşfi, metrikleri, güven sinyallerini, moderasyon sistemlerini veya kullanıcı
dikkatini manipüle etmek için kullanmayın.

İzin verilmeyen pazar yeri davranışları şunları içerir:

- gerçek kullanıcı değeri taşıyor gibi görünmeyen çok sayıda düşük emekli,
  yinelenen, yer tutucu veya makine tarafından üretilmiş listelemeyi topluca yayımlamak
- arama veya kategori yüzeylerini neredeyse aynı skill'ler veya plugin'lerle doldurmak
- çok az kullanımı, bakımı, kaynak açıklığı veya anlamlı farklılaşması olan ya da hiç olmayan
  yüzlerce listeleme yayımlamak
- kurulumları, indirmeleri, yıldızları veya diğer etkileşim metriklerini otomasyon,
  kendi kendine kurulum döngüleri, sahte hesaplar, koordineli etkinlik,
  ücretli etkileşim veya diğer organik olmayan davranışlarla yapay olarak şişirmek
- moderasyondan, yasaklardan, yayıncı sınırlarından veya pazar yeri incelemesinden kaçmak için
  hesap oluşturmak veya hesapları döndürmek
- kullanıcıları sahiplik, kaynak, yetenekler, güvenlik duruşu, kurulum gereksinimleri
  veya başka bir proje ya da yayıncıyla bağlantı konusunda yanıltmak
- temel sorunu çözmeden, zaten gizlenmiş, kaldırılmış veya engellenmiş içeriği
  tekrar tekrar yüklemek

Yüksek hacimli yayımlama otomatik olarak kötüye kullanım değildir. Büyük kataloglar,
listelemeler anlamlı şekilde farklı, doğru açıklanmış, bakımı yapılan ve gerçek
kullanıcılar tarafından kullanılan nitelikte olduğunda kabul edilebilir. Hacim;
zayıf, yinelenen, yanıltıcı, bakımsız veya yapay olarak öne çıkarılan
listelemelerle birleştiğinde büyük kataloglar bir güven ve güvenlik sorununa dönüşür.

## İçerik hakları

ClawHub'daki içeriğin telif hakkınızı veya diğer haklarınızı ihlal ettiğine inanıyorsanız
[İçerik Hakları Talepleri](/tr/clawhub/content-rights) bölümünü kullanın. Listeleme aynı zamanda
güvenli değil, kötü amaçlı veya yanıltıcı değilse telif hakkı veya hak talepleri için normal pazar yeri
raporlarını kullanmayın.

## İnceleme ve yaptırım

ClawHub, güvenli olmayan içeriği veya kötüye kullanım niteliğindeki yayımlama davranışını belirlemek için
otomatik kontroller, istatistiksel kötüye kullanım sinyalleri, kullanıcı raporları ve
personel incelemesi kullanabilir. Bir sinyal tek başına kötüye kullanımı kanıtlamaz;
ClawHub'ın neyin incelenmesi gerektiğine karar vermesine yardımcı olur.

Şunları yapabiliriz:

- ihlal eden listelemeleri gizlemek, bekletmek, kaldırmak, geçici olarak silmek veya kaynak türü için desteklendiğinde
  kalıcı olarak silmek
- güvenli olmayan sürümler için indirmeleri veya kurulumları engellemek
- API token'larını iptal etmek
- ilişkili içeriği geçici olarak silmek
- yayımlama erişimini kısıtlamak
- tekrar eden veya ağır ihlal yapanları yasaklamak

Açık kötüye kullanım için önce uyarı yapılacağını garanti etmiyoruz. Raporlar,
moderasyon bekletmeleri, gizli listelemeler, yasaklar ve hesap itibarı için
[Moderasyon ve Hesap Güvenliği](/clawhub/moderation) bölümüne bakın.
