---
read_when:
    - OpenClaw'ın etkin Mac'i belirlemesini istiyorsunuz
    - Son girdi etkinliğinde veya etkin Node seçiminde hata ayıklıyorsunuz
    - Node bağlantı bildirimlerinin nasıl yönlendirildiğini anlamak istiyorsunuz
summary: En son kullandığınız Mac'i algılayın ve Node uyarılarını oraya yönlendirin
title: Etkin bilgisayar varlığı
x-i18n:
    generated_at: "2026-07-16T17:34:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 2a4ec4607e1e4ef8d989d3c4ece0ee6e0730908a1df76ff52c1898b4307d979b
    source_path: nodes/presence.md
    workflow: 16
---

Etkin bilgisayar varlığı, Gateway'e hangi bağlı macOS Node'unun en son
fiziksel fare veya klavye girdisini aldığını bildirir. OpenClaw bu sinyali
bir Mac'i `active` olarak işaretlemek, aracıya kararlı bir etkin Node ipucu vermek ve
Node bağlantı uyarılarını bulunma olasılığınızın en yüksek olduğu bilgisayara yönlendirmek için kullanır.

Bu, Gateway istemcilerinin canlı
listesi olan [sistem varlığından](/tr/concepts/presence) ve bir mobil Node'un bağlı kabul edilmeden
en son ne zaman uyandığını kaydeden kalıcı `node.presence.alive` işaretlerinden ayrıdır.

## Gereksinimler

- OpenClaw macOS uygulaması eşleştirilmiş ve Node modunda bağlıdır.
- İmzalı OpenClaw uygulamasına **Accessibility** izni verilmiştir.
- Bağlantı uyarıları için **Notifications** izni de verilmiştir ve
  Mac Node'u `system.notify` sunar.

Etkinlik bildirimi şu anda yerel macOS Node'u tarafından uygulanmaktadır. iOS,
Android, watchOS ve başsız Node ana makineleri bağlantı veya arka planda
son görülme durumunu bildirebilir, ancak etkin bilgisayar olarak belirlenmek için yarışmazlar.

## Etkin bilgisayarı kontrol etme

1. macOS uygulamasında **Settings -> Permissions** bölümünü açın ve macOS Sistem Ayarları'nda
   **Accessibility** iznini verin.
2. Mac Node'unun bağlı olduğunu doğrulayın:

   ```bash
   openclaw nodes status --connected
   ```

3. Bu Mac'te fareyi hareket ettirin veya bir tuşa basın, ardından şunu çalıştırın:

   ```bash
   openclaw nodes status
   openclaw nodes describe --node <node-id-or-name>
   ```

En güncel uygun Mac `active` olarak işaretlenir. Durum çıktısı son girdiden
bu yana geçen süreyi gösterir; `describe`, `active`, `lastActiveAtMs` ve `presenceUpdatedAtMs` değerlerini sunar.
Etkinlik bilinçli olarak birleştirildiğinden, yakın zamanda yapılan bir bildirimden sonraki başka bir girdinin
görüntüye yansıması yaklaşık 15 saniye sürebilir.

## Etkinlik nasıl varlığa dönüşür

macOS bildiricisi, HID sisteminin boşta kalma saatini iki saniyede bir örnekler.
Bir Node bağlantısı hazır olduğunda bir kez bildirim yapar, ardından daha yeni fiziksel
etkinliği en fazla 15 saniyede bir bildirir. Boştayken her üç dakikada bir
canlı tutma sinyali gönderir. Çok eski bir örneğin ileri kayarak yanlışlıkla en yeni
bilgisayar hâline gelmemesi için boşta kalma süresi 30 günle sınırlandırılır.

Gateway, etkinliği yalnızca aşağıdakilerin tümü doğru olduğunda kabul eder:

- olay, bu Node kimliği için geçerli kimliği doğrulanmış bağlantıya aittir;
- Node'un etkin `accessibility: true` izni vardır;
- yük, sınırlandırılmış bir tam sayı `idleSeconds` değeri içerir.

Gateway, `lastActiveAtMs` değerini türetmek için kendi gözlem zamanından
`idleSeconds` değerini çıkarır. Node tarafından sağlanan duvar saati zaman damgasına hiçbir zaman güvenmez. Bağlı
uygun Mac'ler arasında en yeni `lastActiveAtMs` kazanır; eşitlik durumunda en
son varlık güncellemesi kullanılır.

Varlık, işleme özgüdür ve bağlantıya bağlıdır. Geçerli
oturumun bağlantısının kesilmesi, aynı Node kimliğini kullanan başka bir oturumla değiştirilmesi veya
Accessibility izninin iptal edilmesi, bu Node'un etkinlik durumunu temizler ve etkin Mac'i yeniden hesaplar.

## Gizlilik ve model bağlamı

OpenClaw girdi içeriğini değil, boşta kalma süresini gönderir. Tuş değerlerini,
fare koordinatlarını, uygulama adlarını, pencere başlıklarını veya ham girdi olaylarını göndermez.
macOS bildiricisi donanım HID durumunu okuduğundan, sentetik bilgisayar denetimi
olayları otomatikleştirilmiş bir Mac'in fiziksel olarak kullandığınız bilgisayar gibi görünmesine neden olmaz.

Sürekli etkinlik, modele sunulan sistem olayları oluşturmaz. Dinamik
çalışma zamanı satırı yalnızca kimliği doğrulanmış Node kimliğini içerir:

```text
active_node=<node-id>
```

İstem enjeksiyonunu ve önbellek değişimini önlemek için kesin zaman damgaları ve Node tarafından denetlenen
görünen adlar istemin dışında tutulur. Aracı güncel ayrıntılara ihtiyaç duyduğunda,
bunun yerine `nodes` aracı `node.list` veya `node.describe` değerini okuyabilir.

## Bağlantı uyarıları nasıl yönlendirilir

Bir Node Gateway el sıkışmasını tamamladıktan sonra OpenClaw, bağlanan Mac'in
ilk etkinlik örneğini gönderebilmesi için 750 milisaniye bekler. Ardından
en güncel etkinliğe sahip, bağlı ve bildirim özelliği bulunan Mac'i dener.

- Birincil teslimat başarılı olursa başka hiçbir Mac uyarıyı almaz.
- Etkin bir Mac yoksa veya birincil teslimat başarısız olursa OpenClaw beş
  saniye bekler ve `system.notify` sunan diğer tüm bağlı Mac'leri dener.
- Aynı Node için yeniden bağlantı uyarısı, gerçek bir teslimat denemesinden sonra beş dakika boyunca
  engellenerek bağlantı dalgalanmasının bir
  bildirim fırtınası oluşturması önlenir.

Uyarılar tam Node bağlantılarına bağlıdır. Bağlantısı kesilmiş veya değiştirilmiş bir kaynak
oturum, önceden zamanlanmış bir uyarıyı tamamlayamaz; bununla birlikte yeni hedef
bağlantı, yedek teslimata katılmaya devam edebilir.

## Sorun giderme

| Belirti                                   | Kontrol                                                                                                                                                                |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Hiçbir satır `active` olarak işaretlenmiyor                 | Yerel bir macOS Node'unun bağlı olduğunu ve `openclaw nodes describe --node <id>` değerinin `permissions.accessibility: true` gösterdiğini doğrulayın.                                          |
| Yanlış Mac etkin kalıyor              | Bu Mac'i fiziksel olarak kullanın, birleştirme aralığını bekleyin, ardından `openclaw nodes status` komutunu yeniden çalıştırın. Sentetik bilgisayar denetimi eylemleri dikkate alınmaz.                        |
| Son girdi verileri kayboluyor                | Mac'in bağlantısının kesilip kesilmediğini, Node oturumunun değiştirilip değiştirilmediğini veya Accessibility izninin iptal edilip edilmediğini kontrol edin. Her koşul etkinliği bilinçli olarak temizler.                       |
| Uyarı birden fazla Mac'te görünüyor         | Birincil teslimat kullanılamadı veya başarısız oldu, bu nedenle gecikmeli yedek teslimat çalıştı. Etkin Mac'in bağlı olduğunu, bildirimlere izin verdiğini ve `system.notify` sunduğunu doğrulayın. |
| Aracı etkin Mac'ten bahsetmiyor | Etkinlik değiştikten sonra yeni bir tur başlatın. Çalışma zamanı ipucu kararlı ve kompakttır; kesin güncel meta veriler için `nodes` aracını kullanın.                                    |

TCC kurtarma işlemi için [macOS izinleri](/tr/platforms/mac/permissions) bölümüne bakın. Node
bağlantısı ve komut hataları için [Node sorun giderme](/tr/nodes/troubleshooting) bölümüne bakın.

## İlgili

- [Node'lar](/tr/nodes)
- [Node CLI](/tr/cli/nodes)
- [Sistem varlığı](/tr/concepts/presence)
- [Gateway protokolü](/tr/gateway/protocol#presence)
- [macOS uygulaması](/tr/platforms/macos)
