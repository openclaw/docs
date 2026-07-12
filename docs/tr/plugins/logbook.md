---
read_when:
    - Control UI'da gününüzün Dayflow tarzı bir zaman çizelgesini istiyorsunuz
    - Paketle birlikte gelen Logbook Pluginini etkinleştiriyor veya yapılandırıyorsunuz
    - Ekran etkinliğine dayalı günlük toplantı özetleri veya günün hatırlanmasını istiyorsunuz
summary: Periyodik ekran görüntülerinden oluşturulan isteğe bağlı otomatik çalışma günlüğü
title: Logbook Plugin'i
x-i18n:
    generated_at: "2026-07-12T12:30:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a3ea1d40d62041417d047fbaf6b02aeb86e76314b8f620f7b9939e2e0c3b9f7e
    source_path: plugins/logbook.md
    workflow: 16
---

Logbook plugini, ekran etkinliğini otomatik bir çalışma günlüğüne dönüştürür. Eşleştirilmiş bir Node'dan düzenli aralıklarla ekran anlık görüntüleri alır, bunları zaman damgalı gözlemler hâlinde özetler ve [Kontrol Arayüzü](/tr/web/control-ui) içinde zaman çizelgesi kartları oluşturur. Ayrıca günlük durum toplantısı notları oluşturabilir ve izlenen bir gün hakkındaki soruları yanıtlayabilir.

OpenClaw'a ait durum, Gateway üzerinde `<state-dir>/logbook/` altında kalır ancak model işlemesi her zaman yerel değildir. Örneklenen ekran görüntüleri yapılandırılmış görüntü rotasına; gözlemler ve zaman çizelgesi metni ise varsayılan ajan modeline gider. Ekran içeriğinin ve bundan türetilen etkinlik metninin makinede kalması gerekiyorsa her iki aşama için de yerel model rotalarını kullanın.

Logbook paketle birlikte gelir ve varsayılan olarak devre dışıdır. Plugin etkinleştirildiğinde `captureEnabled` varsayılan olarak `true` olduğundan Gateway ekran yakalamayı kabul etmiş olur.

## Başlamadan önce

Gereksinimler:

- `screen.snapshot` veya `logbook.snapshot` sunan bağlı bir Node. macOS uygulama Node'u, Ekran Kaydı izni gerektirir. Başsız bir macOS Node ana makinesi (`openclaw node host run`), sistemin `screencapture` aracıyla desteklenen ve plugin tarafından sağlanan `logbook.snapshot` komutunu edinir.
- Paketle gelen Codex plugininin etkinleştirilmiş ve kimlik doğrulamasının yapılmış olması. Codex şu anda Logbook'un gerektirdiği yapılandırılmış görüntü çıkarma sözleşmesini sağlar. `openclaw models auth login --provider openai` ile oturum açın; diğer kimlik doğrulama yolları için [Codex çalışma ortamı](/tr/plugins/codex-harness) bölümüne bakın.
- Çalışan bir varsayılan ajan modeli. Logbook, görüntü işleme geçişinden sonra kartları, durum toplantısı notlarını ve güne ilişkin soru-cevapları sentezlemek için bunu kullanır.

## Hızlı başlangıç

Codex ve Logbook pluginlerini etkinleştirin:

```bash
openclaw plugins enable codex
openclaw plugins enable logbook
```

Belirlenimci başlangıç için açık bir görüntü modeli yapılandırın:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
      logbook: {
        enabled: true,
        config: {
          visionModel: "codex/gpt-5.6-sol",
        },
      },
    },
  },
}
```

`plugins.allow` kullanıyorsanız hem `codex` hem de `logbook` değerlerini ekleyin. Plugin yapılandırmasını değiştirdikten sonra Gateway'i yeniden başlatın, ardından kayıtları inceleyip panoyu açın:

```bash
openclaw gateway restart
openclaw plugins inspect logbook --runtime --json
openclaw nodes status --connected
openclaw nodes describe --node <idOrNameOrIp>
openclaw dashboard
```

Node açıklaması `screen.snapshot` veya `logbook.snapshot` içermelidir. Başsız Node'lar yalnızca plugin etkinleştirildikten sonra `logbook.snapshot` duyurur. Komut eksikse [Node sorun giderme](/tr/nodes/troubleshooting) bölümüne bakın.

Logbook sekmesi yalnızca etkinleştirilmiş bir plugin ve `operator.write` yetkili Kontrol Arayüzü oturumu için görünür. Durum satırı hata olmadan **Yakalanıyor** göstermelidir. Analiz penceresi kapandığında bir zaman çizelgesi kartı görünür; etkinlik yakalandıktan sonra **Şimdi analiz et** seçeneğini de belirleyebilirsiniz.

## Nasıl çalışır?

1. **Yakalama**: Logbook, her `captureIntervalSeconds` süresinde (varsayılan 30 sn.) seçilen Node'un yakalama komutunu çağırır ve ölçeklendirilmiş bir JPEG karesi depolar. Art arda gelen özdeş kareler boşta olarak işaretlenir ve analiz dışında bırakılır.
2. **Gözlemleme**: Bir analiz penceresi (varsayılan 15 dakika) dolduğunda plugin en fazla 16 etkin kare örnekler ve bunları görüntü modeline gönderir. Model, zaman damgalı etkinlik gözlemleri döndürür ("VS Code: store.ts düzenleniyor, bir tür hatası düzeltiliyor"). İki dakikadan uzun bir yakalama boşluğu veya yerel gece yarısı da geçerli pencereyi kapatır.
3. **Sentezleme**: Gözlemler ve mevcut kartların son 45 dakikası; başlık, özet, kategori, ana uygulama ve varsa kısa dikkat dağınıklıkları içeren zaman çizelgesi kartları (her biri 10-60 dakika) hâlinde yeniden düzenlenir.
4. **Temizleme**: `retentionDays` süresinden (varsayılan 14) eski kareler silinir. Kartlar, gözlemler ve önbelleğe alınmış durum toplantısı notları korunur.

Gün sınırları ve zaman çizelgesi saatleri, tarayıcının değil Gateway'in yerel saat dilimini kullanır. Kareler ve SQLite zaman çizelgesi veritabanı `<state-dir>/logbook/` altında bulunur.

## Model ve veri akışı

Logbook iki ayrı model rotası kullanır:

| Aşama                    | Gönderilen veriler                                             | Model rotası                                                         |
| ------------------------ | -------------------------------------------------------------- | -------------------------------------------------------------------- |
| Gözlemleme               | En fazla 16 örneklenmiş JPEG karesi ve yakalanma zamanları     | `visionModel` veya uyumlu, ödünç alınmış bir `tools.media` Codex girdisi |
| Kartları sentezleme      | Zaman damgalı gözlemler ve son zaman çizelgesi kartları        | Plugin LLM çalışma zamanı üzerinden varsayılan ajan modeli            |
| Durum toplantısı oluşturma | Seçilen ve önceki güne ait kartlar                           | Plugin LLM çalışma zamanı üzerinden varsayılan ajan modeli            |
| Gününüzü sorma           | Soru, seçilen günün kartları ve son gözlemler                  | Plugin LLM çalışma zamanı üzerinden varsayılan ajan modeli            |

SQLite veritabanının tamamı hiçbir modele gönderilmez. Ham ekran görüntüleri yalnızca gözlemleme aşamasına gider; kart sentezleme, durum toplantısı ve soru-cevap aşamaları türetilmiş metin alır.

## Yapılandırma

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
      logbook: {
        enabled: true,
        config: {
          captureEnabled: true,
          captureIntervalSeconds: 30,
          analysisIntervalMinutes: 15,
          nodeId: "my-mac",
          screenIndex: 0,
          maxWidth: 1440,
          visionModel: "codex/gpt-5.6-sol",
          retentionDays: 14,
        },
      },
    },
  },
}
```

Tüm Logbook yapılandırma anahtarları isteğe bağlıdır. Sayısal değerler tam sayılara yuvarlanır ve desteklenen aralığa sınırlandırılır.

| Anahtar                   | Varsayılan | Aralık veya değerler       | Davranış                                                                                                    |
| ------------------------- | ---------- | -------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `captureEnabled`          | `true`     | mantıksal değer            | Yeni anlık görüntüler için kalıcı ana anahtar; `false` olduğunda zaman çizelgesi kullanılabilir kalır       |
| `captureIntervalSeconds`  | `30`       | `5`-`600`                  | Yakalama denemeleri arasındaki gecikme                                                                      |
| `analysisIntervalMinutes` | `15`       | `3`-`120`                  | Hedef gözlem penceresi; boşluklar ve gece yarısı pencereyi daha erken kapatabilir                           |
| `nodeId`                  | ayarlanmamış | Node kimliği veya görünen ad | Yakalamayı bağlı tek bir Node'a sabitler; eşleştirme büyük/küçük harfe duyarsızdır                         |
| `screenIndex`             | `0`        | `0`-`16`                   | Sıfır tabanlı ekran dizini                                                                                   |
| `maxWidth`                | `1440`     | `480`-`3840`               | İstenen yakalama boyutu sınırı; başsız macOS bunu en büyük boyuta uygular                                   |
| `visionModel`             | ayarlanmamış | `provider/model`          | Açık yapılandırılmış rota; hatalı biçimlendirilmiş başvurular analizi duraklatır, desteklenmeyen sağlayıcılar toplu işlemleri başarısız kılar |
| `retentionDays`           | `14`       | `1`-`365`                  | Eski kareleri siler; kartlar, gözlemler ve durum toplantısı notları kalır                                   |

`nodeId` olmadan Logbook, `screen.snapshot` sunan bağlı bir uygulama Node'unu tercih eder; ardından `logbook.snapshot` sunan başsız bir Node'a geri döner. Sabitlenmemiş bir kurulumda başarısız olan Node, diğer uygun Node'ların arkasına alınır. Panodaki duraklatma anahtarı yalnızca oturum boyunca geçerlidir ve Gateway yeniden başlatıldığında sıfırlanır; kalıcı olarak durdurmak için `captureEnabled: false` kullanın.

### Görüntü modeli seçimi

Logbook gözlem modelini şu sırayla çözümler:

1. `plugins.entries.logbook.config.visionModel`
2. `tools.media.image.models` altındaki görüntü işleyebilen ilk Codex girdisi
3. `tools.media.models` altındaki görüntü işleyebilen ilk Codex girdisi

Diğer medya sağlayıcıları, Logbook'un gerektirdiği yapılandırılmış çıkarma sözleşmesini şu anda sunmadıkları için atlanır. `tools.media.image.enabled: false` ayarı ödünç alınan medya varsayılanlarını devre dışı bırakır ancak açıkça belirtilen bir Logbook `visionModel` değeri yine de uygulanır.

## Pano sekmesi

- **Zaman çizelgesi**: Her etkinlik için kategori renkleri, ana uygulama, dikkat dağınıklığı etiketleri ve bir anlık görüntü ana karesi içeren genişletilebilir kartlar.
- **Güne genel bakış**: Odaklanma oranı, kategori dağılımı, en çok kullanılan uygulamalar.
- **Günlük durum toplantısı**: Dünü ve bugünü yapıştırılmaya hazır bir güncellemeye dönüştürür.
- **Gününüzü sorun**: İzlenen zaman çizelgesinden yanıtlanan doğal dil soruları ("Gateway PR'ını ne zaman inceledim?").
- **Şimdi analiz et**: Analiz aralığını beklemek yerine geçerli yakalama penceresini hemen kapatır.

## Gateway yöntemleri

Logbook şu Gateway RPC yöntemlerini kaydeder:

| Yöntem                | Parametreler              | Kapsam           | Sonuç                                                                         |
| --------------------- | ------------------------- | ---------------- | ----------------------------------------------------------------------------- |
| `logbook.status`      | yok                       | `operator.read`  | Yakalama, analiz, model, Node, Gateway günü ve Gateway saat dilimi durumu      |
| `logbook.days`        | yok                       | `operator.read`  | Zaman çizelgesi kartı sayıları ve kart zaman sınırları bulunan günler          |
| `logbook.timeline`    | `{ day?: "YYYY-MM-DD" }`  | `operator.read`  | Türetilmiş kartlar ve gün istatistikleri; varsayılan Gateway'in geçerli günüdür |
| `logbook.frames`      | `{ startMs, endMs }`      | `operator.write` | İstenen dönem-milisaniye aralığındaki kare meta verileri                      |
| `logbook.frame`       | `{ frameId }`             | `operator.write` | Base64 olarak tek bir ham JPEG karesi                                         |
| `logbook.standup`     | `{ day?, refresh? }`      | `operator.write` | Bir gün için önbelleğe alınmış veya yeniden oluşturulmuş durum toplantısı metni |
| `logbook.ask`         | `{ day?, question }`      | `operator.write` | Bir gün için zaman çizelgesine dayalı yanıt                                   |
| `logbook.capture.set` | `{ paused }`              | `operator.write` | Yalnızca oturuma özgü duraklatma durumu ve güncellenmiş durum                  |
| `logbook.analyze.now` | yok                       | `operator.write` | Bekleyen analizi başlatır veya neden başlatılamadığını döndürür                |

Okuma yöntemleri işletim durumunu veya türetilmiş metni döndürür. Ham ekran görüntüsü pikselleri, model harcamasına yol açan eylemler ve çalışma zamanı değişiklikleri `operator.write` gerektirir. Kontrol Arayüzü sekmesi de bu eylemleri ve ham kare önizlemelerini sunduğu için `operator.write` gerektirir; salt okunur bir istemci, türetilmiş metin yöntemlerini doğrudan çağırmaya devam edebilir.

## Gizlilik notları

- Anlık görüntüler, gizli bilgiler dâhil ekrandaki her şeyi içerebilir. Kareler, yapılandırılmış gözlem modeline örneklenmiş girdi olarak gönderilmeleri dışında makineden hiçbir zaman ayrılmaz.
- Gözlemler, son kartlar ve sorular; kart sentezleme, durum toplantısı oluşturma veya soru-cevap sırasında varsayılan ajan modeli üzerinden makineden ayrılabilir. Sağlayıcının veri işleme politikasını her iki model rotasına da uygulayın.
- Tamamen yerel bir işlem hattına ihtiyaç duyduğunuzda hem yapılandırılmış gözlem modeli hem de varsayılan ajan modeli için yerel rotalar kullanın.
- Kareler, zaman çizelgesi veritabanı ve geçici yakalamalar yalnızca sahip erişimli dosya izinleriyle yazılır.
- `gateway.nodes.denyCommands` öğesine `screen.snapshot` eklemek, ekran yakalama acil durdurma anahtarıdır: hem uygulama Node'u yakalamasını hem de Logbook'un kendi `logbook.snapshot` komutunu engeller.
- `tools.media.image.enabled: false` ayarı, Logbook'un analiz için medya görüntü modellerini ödünç almasını da durdurur; bu durumda yalnızca plugin yapılandırmasında açıkça belirtilen bir `visionModel` kullanılır.

## Sorun giderme

### Logbook sekmesi eksik

Üç koşulun tamamını denetleyin:

1. `openclaw plugins list --enabled` çıktısı `logbook` içerir.
2. Plugin veya izin listesi değişikliğinden sonra Gateway yeniden başlatılmıştır.
3. Kontrol Arayüzü bağlantısında `operator.write` vardır; salt okunur oturumlar etkileşimli sekme tanımlayıcısını almaz.

`plugins.allow` ayarlanmışsa önerilen yapılandırma için hem `logbook` hem de
`codex` değerlerini içermelidir.

### Yakalama hata bildiriyor

```bash
openclaw nodes status --connected
openclaw nodes describe --node <idOrNameOrIp>
openclaw logs --follow
```

- Node'un `screen.snapshot` veya `logbook.snapshot` sunduğunu doğrulayın.
- Yakalama Mac'inde Ekran Kaydı izni verin.
- `nodeId` yapılandırılmışsa Node kimliğiyle veya görünen adıyla eşleştiğini doğrulayın.
- `gateway.nodes.denyCommands` öğesinin `screen.snapshot` içermediğini
  kontrol edin.

Art arda üç hatadan sonra Logbook, on yakalama döngüsü boyunca bekleme süresini
artırır ve ardından yeniden dener. Sabitlenmemiş bir kurulum, uygun başka bir Node'a geçebilir.

### Yakalamalar başarılı ancak kartlar görünmüyor

- **Model eksik** durumu, uyumlu bir yapılandırılmış görsel algılama rotasının
  bulunmadığı anlamına gelir. Codex Plugin'ini etkinleştirip kimlik doğrulamasını
  yapın veya geçerli ve açıkça belirtilmiş bir `visionModel` ayarlayın. Model
  eksikken yakalanan kareler beklemede kalır ve yapılandırma düzeltildikten sonra
  analiz edilebilir.
- `analysisIntervalMinutes` süresini bekleyin veya etkinlik yakalandıktan sonra
  **Şimdi analiz et** seçeneğini belirleyin.
- Art arda gelen aynı kareler boşta olma kanıtıdır ve analiz toplu işlemlerine
  dahil edilmez. Test etmeden önce görünür ekranı değiştirin.
- En son toplu işlem bir hata gösteriyorsa model veya kimlik doğrulama sorununu
  düzeltin ve **Şimdi analiz et** seçeneğini belirleyin. Modelin tekrar tekrar
  kullanılmasından kaynaklanan harcamaları önlemek için başarısız toplu işlemler
  yalnızca bu açık eylemle yeniden denenir.

## İlgili

- [Plugin'leri yönetme](/tr/plugins/manage-plugins)
- [Codex çalıştırma düzeneği](/tr/plugins/codex-harness)
- [Medya anlama](/tr/nodes/media-understanding)
- [Node'lar](/tr/nodes)
- [Node sorunlarını giderme](/tr/nodes/troubleshooting)
- [Denetim kullanıcı arayüzü](/tr/web/control-ui)
