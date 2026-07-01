---
read_when:
    - Yüklemeleri kötüye kullanım veya politika ihlalleri açısından inceleme
    - Moderasyon belgeleri veya inceleyici çalışma kılavuzları yazma
    - Bir skill'in gizlenip gizlenmeyeceğine veya bir kullanıcının yasaklanıp yasaklanmayacağına karar verme
sidebarTitle: Acceptable Usage
summary: 'Pazar yeri politikası: ClawHub''ın nelere izin verdiği ve neleri barındırmayacağı.'
title: Kabul Edilebilir Kullanım
x-i18n:
    generated_at: "2026-07-01T20:32:38Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ace357e7a3e9f4d242f113ad791b254e94ae8a841dd9a864a77c5bac15713132
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Kabul Edilebilir Kullanım

ClawHub, OpenClaw için Skills, Plugin'ler, paketler ve pazar yeri meta verilerini barındırır.
İçeriğin veya yayımlama davranışının ClawHub'a ait olup olmadığına karar vermek için
bu sayfayı kullanın.

Bu kurallar, bir listelemenin ne yaptığı, kullanıcılardan ne çalıştırmalarını istediği, kendini
nasıl temsil ettiği ve yayıncıların ClawHub'ın keşif, kurulum ve güven yüzeylerini
nasıl kullandığı için geçerlidir. Moderasyon durumları ve hesap konumu için bkz.
[Moderasyon ve Hesap Güvenliği](/clawhub/moderation). Telif hakkı veya diğer hak
talepleri için bkz. [İçerik Hakları Talepleri](/tr/clawhub/content-rights).

## İzin verilen içerik

ClawHub; yararlı, anlaşılır ve iyi niyetle yayımlanmış içerikleri memnuniyetle karşılar.

| Kategori                                         | İzin verildiği durumlar                                                                                                                      |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Geliştirici üretkenliği                          | Listeleme, kullanıcıların yazılım oluşturmasına, test etmesine, taşımasına, hata ayıklamasına, belgelemesine veya işletmesine yardımcı olur.                                               |
| UI, veri ve otomasyon iş akışları                | Kapsam açıktır, gerekli kimlik bilgileri açıkça belirtilir ve riskli eylemler inceleme, deneme çalıştırması, önizleme veya onay yolları içerir. |
| Savunmaya yönelik güvenlik, moderasyon ve kötüye kullanım incelemesi | Araç yetkili inceleme için çerçevelenir, kanıtları korur ve insan onayı sınırlarını açık tutar.                          |
| Kişisel veya ekip iş akışları                    | İş akışı rızaya dayalı hesaplar, şeffaf kurulum ve açık izinler kullanır.                                            |
| Bakımı yapılan kataloglar                        | Her listeleme farklı, yararlı, doğru şekilde açıklanmış ve makul ölçüde bakımı yapılmış durumdadır.                                                |

Bağlam önemlidir. Aynı konu, dar kapsamlı savunma amaçlı veya rızaya dayalı bir
ortamda kabul edilebilirken, kötüye kullanım iş akışı olarak paketlendiğinde kabul edilemez olabilir.

## İzin verilmeyen içerik

ClawHub, ana amacı kötüye kullanım, aldatma, güvenli olmayan çalıştırma veya hak
ihlali olan içerikleri barındırmaz.

| Kategori                                                    | İzin verilmez                                                                                                                                                                                                                                                                                                   |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Yetkisiz erişim veya güvenlik atlatma                       | Kimlik doğrulama atlatma, hesap ele geçirme, hız sınırı kötüye kullanımı, canlı çağrı veya agent ele geçirme, yeniden kullanılabilir oturum hırsızlığı ya da onaylanmamış kullanıcılar için eşleştirme akışlarını otomatik onaylama.                                                                                                                                                   |
| Platform kötüye kullanımı ve yasak atlatma                  | Yasaklardan sonra gizli hesaplar, hesap ısıtma veya çiftliği, sahte etkileşim, çok hesaplı otomasyon, toplu paylaşım, spam botları ya da tespitten kaçınmak için oluşturulmuş otomasyon.                                                                                                                                          |
| Dolandırıcılık, sahtekarlıklar ve aldatıcı finansal iş akışları | Sahte sertifikalar veya faturalar, aldatıcı ödeme akışları, dolandırıcılık amaçlı erişim, sahte sosyal kanıt, dolandırıcılık için sentetik kimlik iş akışları ya da açık insan onayı olmadan harcama/ücretlendirme araçları.                                                                                                                    |
| Gizliliği ihlal eden zenginleştirme veya gözetim            | Spam için kişi kazıma, doxxing, taciz amaçlı takip, istenmeyen erişimle eşleştirilmiş potansiyel müşteri çıkarımı, gizli izleme, rıza dışı biyometrik eşleştirme ya da sızdırılmış veri veya ihlal dökümlerinin kullanımı.                                                                                                                  |
| Rıza dışı taklit veya kimlik manipülasyonu                  | Yüz değiştirme, dijital ikizler, klonlanmış etkileyiciler, sahte personelar ya da taklit etmek veya yanıltmak için kullanılan diğer araçlar.                                                                                                                                                                                                 |
| Açık cinsel içerik veya güvenliği devre dışı bırakılmış yetişkin içerik üretimi | NSFW görüntü, video veya içerik üretimi; üçüncü taraf API'leri etrafında yetişkin içerik sarmalayıcıları; ya da birincil amacı açık cinsel içerik olan listelemeler.                                                                                                                                                       |
| Gizli, güvenli olmayan veya yanıltıcı çalıştırma gereksinimleri | Karartılmış kurulum komutları, indirilen içeriğin açık incelenebilirlik olmadan `sh` veya `bash` ile çalıştırılması gibi pipe-to-shell kurucular, beyan edilmemiş gizli anahtar veya özel anahtar gereksinimleri, açık incelenebilirlik olmadan uzaktan `npx @latest` çalıştırma ya da listelemenin gerçekten çalışmak için neye ihtiyaç duyduğunu gizleyen meta veriler. |
| Telif hakkını ihlal eden veya hakları ihlal eden materyal   | Başkasının Skill'ini, Plugin'ini, belgelerini, marka varlıklarını veya tescilli kodunu izinsiz yeniden yayımlamak; lisans koşullarını ihlal etmek; ya da özgün yazarı veya yayıncıyı taklit etmek.                                                                                                                            |

## İzin verilmeyen pazar yeri davranışı

ClawHub, yayıncıların pazar yerini nasıl kullandığını da inceler. ClawHub'ı
keşfi, metrikleri, güven sinyallerini, moderasyon sistemlerini veya kullanıcı
dikkatini manipüle etmek için kullanmayın.

İzin verilmeyen pazar yeri davranışı şunları içerir:

- gerçek kullanıcı değeri taşıyor gibi görünmeyen çok sayıda düşük emekli,
  tekrarlayıcı, yer tutucu veya makine tarafından oluşturulmuş listelemeyi toplu yayımlamak
- arama veya kategori yüzeylerini neredeyse aynı Skills veya Plugin'lerle doldurmak
- çok az veya hiç kullanım, bakım, kaynak açıklığı ya da anlamlı farklılaşma
  olmadan yüzlerce listeleme yayımlamak
- kurulumları, indirmeleri, yıldızları veya diğer etkileşim
  metriklerini otomasyon, kendi kendine kurulum döngüleri, sahte hesaplar, koordineli
  faaliyet, ücretli etkileşim veya diğer organik olmayan davranışlarla yapay olarak şişirmek
- moderasyonu, yasakları, yayıncı limitlerini veya pazar yeri incelemesini
  atlatmak için hesap oluşturmak veya hesap döndürmek
- sahiplik, kaynak, yetenekler, güvenlik duruşu,
  kurulum gereksinimleri ya da başka bir proje veya yayıncıyla bağlantı konusunda kullanıcıları yanıltmak
- altta yatan sorunu düzeltmeden daha önce gizlenmiş, kaldırılmış veya engellenmiş
  içeriği tekrar tekrar yüklemek

Yüksek hacimli yayımlama otomatik olarak kötüye kullanım değildir. Büyük kataloglar,
listelemeler anlamlı biçimde farklı, doğru açıklanmış, bakımı yapılmış
ve gerçek kullanıcılar tarafından kullanılıyor olduğunda kabul edilebilir. Büyük kataloglar,
hacim zayıf, tekrarlayıcı, yanıltıcı, bakımsız veya
yapay olarak tanıtılan listelemelerle birleştiğinde bir güven ve güvenlik sorunu haline gelir.

## İçerik hakları

ClawHub üzerindeki içeriğin telif hakkınızı veya diğer haklarınızı ihlal ettiğine inanıyorsanız,
[İçerik Hakları Talepleri](/tr/clawhub/content-rights) sayfasını kullanın. Listeleme aynı zamanda güvenli olmayan,
kötü amaçlı veya yanıltıcı değilse, telif hakkı veya hak talepleri için normal pazar yeri
raporlarını kullanmayın.

## İnceleme ve yaptırım

ClawHub, güvenli olmayan içeriği veya kötüye kullanılan yayımlama davranışını belirlemek için
otomatik kontroller, istatistiksel kötüye kullanım sinyalleri, kullanıcı raporları ve
personel incelemesi kullanabilir. Bir sinyal tek başına kötüye kullanımı kanıtlamaz; ClawHub'ın
neyin incelemeye ihtiyaç duyduğuna karar vermesine yardımcı olur.

Şunları yapabiliriz:

- ihlal eden listelemeleri gizlemek, bekletmek, kaldırmak, geçici olarak silmek veya kaynak türü için desteklendiği durumlarda
  kalıcı olarak silmek
- güvenli olmayan sürümler için indirmeleri veya kurulumları engellemek
- API token'larını iptal etmek
- ilişkili içeriği geçici olarak silmek
- yayımlama erişimini kısıtlamak
- tekrar eden veya ağır ihlal yapanları yasaklamak

Açık kötüye kullanım için önce uyarı yapılan bir yaptırımı garanti etmeyiz. Raporlar, moderasyon bekletmeleri,
gizli listelemeler, yasaklar ve hesap konumu için bkz.
[Moderasyon ve Hesap Güvenliği](/clawhub/moderation).
