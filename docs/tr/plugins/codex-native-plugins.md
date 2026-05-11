---
read_when:
    - Codex modu OpenClaw ajanlarının yerel Codex Plugin'lerini kullanmasını istiyorsunuz
    - Kaynaktan yüklenmiş, OpenAI tarafından seçilmiş Codex Plugin'lerini geçiriyorsunuz
    - codexPlugins, uygulama envanteri, yıkıcı eylemler veya Plugin uygulama tanılarıyla ilgili sorun gideriyorsunuz
summary: Taşınmış yerel Codex Plugin'lerini Codex modu OpenClaw ajanları için yapılandırın
title: Yerel Codex Plugin'leri
x-i18n:
    generated_at: "2026-05-11T20:34:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 64e8f552e65b3f1c1c62bc1ba1abfc1bf592d1bdc7fbbe2a484f3eb9955159f0
    source_path: plugins/codex-native-plugins.md
    workflow: 16
---

Yerel Codex Plugin desteği, Codex modundaki bir OpenClaw ajanının, OpenClaw turunu işleyen aynı Codex iş parçacığı içinde Codex app-server'ın kendi uygulama ve Plugin yeteneklerini kullanmasını sağlar.

OpenClaw, Codex Plugin öğelerini sentetik `codex_plugin_*` OpenClaw dinamik araçlarına dönüştürmez. Plugin çağrıları yerel Codex transkriptinde kalır ve uygulama destekli MCP yürütmesini Codex app-server üstlenir.

Bu sayfayı temel [Codex harness](/tr/plugins/codex-harness) çalıştıktan sonra kullanın.

## Gereksinimler

- Seçilen OpenClaw ajan çalışma zamanı yerel Codex harness olmalıdır.
- `plugins.entries.codex.enabled` true olmalıdır.
- `plugins.entries.codex.config.codexPlugins.enabled` true olmalıdır.
- V1, yalnızca geçişin kaynak Codex ana dizininde kaynaktan kurulmuş olarak gözlemlediği `openai-curated` Plugin öğelerini destekler.
- Hedef Codex app-server beklenen marketplace, Plugin ve uygulama envanterini görebilmelidir.

`codexPlugins`, PI çalıştırmaları, normal OpenAI sağlayıcı çalıştırmaları, ACP konuşma bağlamaları veya diğer harness'lar üzerinde etkili değildir; çünkü bu yollar yerel `apps` yapılandırmasıyla Codex app-server iş parçacıkları oluşturmaz.

## Hızlı Başlangıç

Kaynak Codex ana dizininden geçiş önizlemesi alın:

```bash
openclaw migrate codex --dry-run
```

Plan doğru göründüğünde geçişi uygulayın:

```bash
openclaw migrate apply codex --yes
```

Geçiş, uygun Plugin öğeleri için açık `codexPlugins` girdileri yazar ve seçilen Plugin öğeleri için Codex app-server `plugin/install` çağrısı yapar. Tipik bir geçirilmiş yapılandırma şöyle görünür:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          codexPlugins: {
            enabled: true,
            allow_destructive_actions: false,
            plugins: {
              "google-calendar": {
                enabled: true,
                marketplaceName: "openai-curated",
                pluginName: "google-calendar",
              },
            },
          },
        },
      },
    },
  },
}
```

`codexPlugins` değiştirildikten sonra gelecekteki Codex harness oturumlarının güncellenmiş uygulama kümesiyle başlaması için `/new`, `/reset` kullanın veya Gateway'i yeniden başlatın.

## Yerel Plugin kurulumunun çalışma şekli

Entegrasyonun üç ayrı durumu vardır:

- Kurulu: Codex, hedef app-server çalışma zamanında yerel Plugin paketine sahiptir.
- Etkin: OpenClaw yapılandırması, Plugin öğesini Codex harness turları için kullanılabilir yapmaya izin verir.
- Erişilebilir: Codex app-server, Plugin öğesinin uygulama girdilerinin etkin hesap için kullanılabilir olduğunu ve geçirilmiş Plugin kimliğiyle eşlenebildiğini onaylar.

Geçiş, kalıcı kurulum/uygunluk adımıdır. Çalışma zamanı uygulama envanteri erişilebilirlik denetimidir. Ardından Codex harness oturum kurulumu, etkin ve erişilebilir Plugin uygulamaları için kısıtlayıcı bir iş parçacığı uygulama yapılandırması hesaplar.

İş parçacığı uygulama yapılandırması, OpenClaw bir Codex harness oturumu oluşturduğunda veya eski bir Codex iş parçacığı bağlamasını değiştirdiğinde hesaplanır. Her turda yeniden hesaplanmaz.

## V1 destek sınırı

V1 kasıtlı olarak dardır:

- Yalnızca kaynak Codex app-server envanterinde zaten yüklü olan `openai-curated` Plugin'leri geçişe uygundur.
- Geçiş, `marketplaceName` ve `pluginName` ile açık Plugin kimlikleri yazar; yerel `marketplacePath` önbellek yollarını yazmaz.
- `codexPlugins.enabled` genel etkinleştirme anahtarıdır.
- `plugins["*"]` joker karakteri yoktur ve keyfi yükleme yetkisi veren bir yapılandırma anahtarı yoktur.
- Desteklenmeyen marketplace'ler, önbelleğe alınmış Plugin paketleri, hook'lar ve Codex yapılandırma dosyaları, manuel inceleme için geçiş raporunda korunur.

## Uygulama envanteri ve sahiplik

OpenClaw, Codex uygulama envanterini app-server `app/list` üzerinden okur, bir saat boyunca önbelleğe alır ve eski ya da eksik girdileri eşzamansız olarak yeniler.

Bir Plugin uygulaması yalnızca OpenClaw onu kararlı sahiplik üzerinden geçirilen Plugin'e eşleyebildiğinde açığa çıkar:

- Plugin ayrıntısından tam uygulama kimliği
- bilinen MCP sunucu adı
- benzersiz kararlı metadata

Yalnızca görünen ada dayalı veya belirsiz sahiplik, bir sonraki envanter yenilemesi sahipliği kanıtlayana kadar hariç tutulur.

## İş parçacığı uygulama yapılandırması

OpenClaw, Codex iş parçacığı için kısıtlayıcı bir `config.apps` yaması enjekte eder:
`_default` devre dışı bırakılır ve yalnızca etkinleştirilmiş geçirilen Plugin'lerin sahip olduğu uygulamalar etkinleştirilir.

OpenClaw, uygulama düzeyindeki `destructive_enabled` değerini geçerli genel veya Plugin başına `allow_destructive_actions` politikasından ayarlar ve Codex'in kendi yerel uygulama aracı anotasyonlarından yıkıcı araç metadata'sını uygulamasına izin verir. `_default` uygulama yapılandırması `open_world_enabled: false` ile devre dışı bırakılır. Etkin Plugin uygulamaları `open_world_enabled: true` ile yayılır; OpenClaw ayrı bir Plugin açık dünya politika düğmesi sunmaz ve Plugin başına yıkıcı araç adı reddetme listeleri tutmaz.

Araç onay modu, Plugin uygulamaları için varsayılan olarak otomatiktir; böylece yıkıcı olmayan okuma araçları aynı iş parçacığında bir onay kullanıcı arayüzü olmadan çalışabilir. Yıkıcı araçlar, her uygulamanın `destructive_enabled` politikası tarafından denetlenmeye devam eder.

## Yıkıcı eylem politikası

Yıkıcı Plugin elicitation'ları varsayılan olarak kapalı kalır:

- Genel `allow_destructive_actions` varsayılanı `false` değeridir.
- Plugin başına `allow_destructive_actions`, o Plugin için genel politikayı geçersiz kılar.
- Politika `false` olduğunda OpenClaw deterministik bir ret döndürür.
- Politika `true` olduğunda OpenClaw yalnızca bir boolean onay alanı gibi bir onay yanıtına eşleyebildiği güvenli şemaları otomatik kabul eder.
- Eksik Plugin kimliği, belirsiz sahiplik, eksik tur kimliği, yanlış tur kimliği veya güvenli olmayan elicitation şeması, istem göstermek yerine reddedilir.

## Sorun giderme

**`auth_required`:** geçiş Plugin'i yükledi, ancak uygulamalarından birinin hâlâ kimlik doğrulamasına ihtiyacı var. Açık Plugin girdisi, yeniden yetkilendirip etkinleştirene kadar devre dışı olarak yazılır.

**`marketplace_missing` veya `plugin_missing`:** hedef Codex app-server beklenen `openai-curated` marketplace'i veya Plugin'i göremiyor. Geçişi hedef çalışma zamanı üzerinde yeniden çalıştırın veya Codex app-server Plugin durumunu inceleyin.

**`app_inventory_missing` veya `app_inventory_stale`:** uygulama hazır olma durumu boş veya eski bir önbellekten geldi. OpenClaw eşzamansız bir yenileme planlar ve sahiplik ile hazır olma durumu bilinene kadar Plugin uygulamalarını hariç tutar.

**`app_ownership_ambiguous`:** uygulama envanteri yalnızca görünen adla eşleştiği için uygulama Codex iş parçacığına açığa çıkarılmaz.

**Yapılandırma değişti ancak agent Plugin'i göremiyor:** `/new`, `/reset` kullanın veya Gateway'i yeniden başlatın. Mevcut Codex iş parçacığı bağlamaları, OpenClaw yeni bir harness oturumu kurana veya eski bir bağlamayı değiştirene kadar başladıkları uygulama yapılandırmasını korur.

**Yıkıcı eylem reddediliyor:** genel ve Plugin başına `allow_destructive_actions` değerlerini kontrol edin. Politika true olsa bile güvenli olmayan elicitation şemaları ve belirsiz Plugin kimliği yine kapalı kalır.

## İlgili

- [Codex harness](/tr/plugins/codex-harness)
- [Codex harness başvurusu](/tr/plugins/codex-harness-reference)
- [Codex harness çalışma zamanı](/tr/plugins/codex-harness-runtime)
- [Yapılandırma başvurusu](/tr/gateway/configuration-reference#codex-harness-plugin-config)
- [Migrate CLI](/tr/cli/migrate)
