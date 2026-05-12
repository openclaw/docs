---
read_when:
    - Codex modundaki OpenClaw ajanlarının yerel Codex Plugin'lerini kullanmasını istiyorsunuz
    - Kaynak koddan yüklenmiş, OpenAI tarafından seçilmiş Codex Plugin'lerini geçiriyorsunuz
    - codexPlugins, uygulama envanteri, yıkıcı eylemler veya Plugin uygulama tanılamalarıyla ilgili sorun gideriyorsunuz
summary: Taşınmış yerel Codex Plugin'lerini Codex modundaki OpenClaw ajanları için yapılandırın
title: Yerel Codex Plugin'leri
x-i18n:
    generated_at: "2026-05-12T00:59:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: d4cc1c7b6a97c6eb27eb10a7b14261ecfd398eff58fbd26cc2979a31e6f6a6c4
    source_path: plugins/codex-native-plugins.md
    workflow: 16
---

Yerel Codex plugin desteği, Codex modundaki bir OpenClaw aracısının, OpenClaw turunu işleyen aynı Codex iş parçacığı içinde Codex app-server'ın kendi uygulama ve Plugin yeteneklerini kullanmasını sağlar.

OpenClaw, Codex Plugin'lerini yapay `codex_plugin_*` OpenClaw dinamik araçlarına çevirmez. Plugin çağrıları yerel Codex transkriptinde kalır ve uygulama destekli MCP yürütmesinin sahibi Codex app-server'dır.

Bu sayfayı temel [Codex harness](/tr/plugins/codex-harness) çalıştıktan sonra kullanın.

## Gereksinimler

- Seçilen OpenClaw aracı çalışma zamanı yerel Codex harness olmalıdır.
- `plugins.entries.codex.enabled` true olmalıdır.
- `plugins.entries.codex.config.codexPlugins.enabled` true olmalıdır.
- V1 yalnızca geçişin kaynak Codex ana dizininde kaynak olarak kurulu gözlemlediği `openai-curated` Plugin'lerini destekler.
- Hedef Codex app-server beklenen marketplace, Plugin ve uygulama envanterini görebilmelidir.

`codexPlugins`, PI çalıştırmaları, normal OpenAI sağlayıcı çalıştırmaları, ACP konuşma bağlamaları veya diğer harness'lar üzerinde etkili değildir; çünkü bu yollar yerel `apps` yapılandırmasıyla Codex app-server iş parçacıkları oluşturmaz.

## Hızlı başlangıç

Kaynak Codex ana dizininden geçişi önizleyin:

```bash
openclaw migrate codex --dry-run
```

Plan doğru görünüyorsa geçişi uygulayın:

```bash
openclaw migrate apply codex --yes
```

Geçiş, uygun Plugin'ler için açık `codexPlugins` girdileri yazar ve seçilen Plugin'ler için Codex app-server `plugin/install` çağrısı yapar. Tipik bir geçirilmiş yapılandırma şöyle görünür:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          codexPlugins: {
            enabled: true,
            allow_destructive_actions: true,
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

`codexPlugins` değiştirildikten sonra gelecekteki Codex harness oturumlarının güncellenmiş uygulama kümesiyle başlaması için `/new`, `/reset` kullanın veya gateway'i yeniden başlatın.

## Yerel Plugin kurulumunun çalışma şekli

Entegrasyonun üç ayrı durumu vardır:

- Kurulu: Codex, hedef app-server çalışma zamanında yerel Plugin paketine sahiptir.
- Etkin: OpenClaw yapılandırması, Plugin'i Codex harness turları için kullanılabilir yapmaya izin verir.
- Erişilebilir: Codex app-server, Plugin'in uygulama girdilerinin etkin hesap için kullanılabilir olduğunu ve geçirilmiş Plugin kimliğiyle eşlenebildiğini doğrular.

Geçiş, kalıcı kurulum/uygunluk adımıdır. Çalışma zamanı uygulama envanteri erişilebilirlik denetimidir. Codex harness oturum kurulumu daha sonra etkin ve erişilebilir Plugin uygulamaları için kısıtlayıcı bir iş parçacığı uygulama yapılandırması hesaplar.

İş parçacığı uygulama yapılandırması, OpenClaw bir Codex harness oturumu kurduğunda veya eskimiş bir Codex iş parçacığı bağlamasının yerini aldığında hesaplanır. Her turda yeniden hesaplanmaz.

## V1 destek sınırı

V1 bilinçli olarak dardır:

- Yalnızca kaynak Codex app-server envanterinde zaten kurulu olan `openai-curated` Plugin'leri geçişe uygundur.
- Geçiş, `marketplaceName` ve `pluginName` ile açık Plugin kimlikleri yazar; yerel `marketplacePath` önbellek yolları yazmaz.
- `codexPlugins.enabled` genel etkinleştirme anahtarıdır.
- `plugins["*"]` jokeri yoktur ve keyfi kurulum yetkisi veren bir yapılandırma anahtarı yoktur.
- Desteklenmeyen marketplace'ler, önbelleğe alınmış Plugin paketleri, hook'lar ve Codex yapılandırma dosyaları manuel inceleme için geçiş raporunda korunur.

## Uygulama envanteri ve sahiplik

OpenClaw, Codex uygulama envanterini app-server `app/list` üzerinden okur, bir saat önbelleğe alır ve eskimiş veya eksik girdileri eşzamansız olarak yeniler.

Bir Plugin uygulaması yalnızca OpenClaw onu kararlı sahiplik aracılığıyla geçirilmiş Plugin'e geri eşleyebildiğinde sunulur:

- Plugin ayrıntısından tam uygulama kimliği
- bilinen MCP sunucu adı
- benzersiz kararlı meta veri

Yalnızca görünen ada dayalı veya belirsiz sahiplik, bir sonraki envanter yenilemesi sahipliği kanıtlayana kadar hariç tutulur.

## İş parçacığı uygulama yapılandırması

OpenClaw, Codex iş parçacığı için kısıtlayıcı bir `config.apps` yaması enjekte eder: `_default` devre dışı bırakılır ve yalnızca etkin geçirilmiş Plugin'lerin sahibi olduğu uygulamalar etkinleştirilir.

OpenClaw, uygulama düzeyi `destructive_enabled` değerini etkili genel veya Plugin başına `allow_destructive_actions` politikasından ayarlar ve Codex'in yerel uygulama aracı anotasyonlarından yıkıcı araç meta verilerini uygulamasına izin verir. `_default` uygulama yapılandırması `open_world_enabled: false` ile devre dışı bırakılır. Etkin Plugin uygulamaları `open_world_enabled: true` ile yayımlanır; OpenClaw ayrı bir Plugin açık dünya politika düğmesi sunmaz ve Plugin başına yıkıcı araç adı engelleme listeleri tutmaz.

Araç onay modu, Plugin uygulamaları için varsayılan olarak otomatiktir; böylece yıkıcı olmayan okuma araçları aynı iş parçacığında onay arayüzü olmadan çalışabilir. Yıkıcı araçlar her uygulamanın `destructive_enabled` politikası tarafından denetlenmeye devam eder.

## Yıkıcı eylem politikası

Geçirilmiş Codex Plugin'leri için yıkıcı Plugin elicitation'larına varsayılan olarak izin verilir; ancak güvensiz şemalar ve belirsiz sahiplik yine kapalı başarısız olur:

- Genel `allow_destructive_actions` varsayılanı `true` değeridir.
- Plugin başına `allow_destructive_actions`, o Plugin için genel politikayı geçersiz kılar.
- Politika `false` olduğunda OpenClaw deterministik bir ret döndürür.
- Politika `true` olduğunda OpenClaw yalnızca onay yanıtına eşleyebildiği güvenli şemaları, örneğin boolean onay alanını, otomatik kabul eder.
- Eksik Plugin kimliği, belirsiz sahiplik, eksik tur kimliği, yanlış tur kimliği veya güvensiz elicitation şeması istemde bulunmak yerine reddedilir.

## Sorun giderme

**`auth_required`:** geçiş Plugin'i kurdu, ancak uygulamalarından biri hâlâ kimlik doğrulaması gerektiriyor. Açık Plugin girdisi, yeniden yetkilendirip etkinleştirene kadar devre dışı olarak yazılır.

**`marketplace_missing` veya `plugin_missing`:** hedef Codex app-server beklenen `openai-curated` marketplace'i veya Plugin'i göremiyor. Geçişi hedef çalışma zamanına karşı yeniden çalıştırın veya Codex app-server Plugin durumunu inceleyin.

**`app_inventory_missing` veya `app_inventory_stale`:** uygulama hazır olma durumu boş veya eskimiş bir önbellekten geldi. OpenClaw eşzamansız bir yenileme zamanlar ve sahiplik ile hazır olma durumu bilininceye kadar Plugin uygulamalarını hariç tutar.

**`app_ownership_ambiguous`:** uygulama envanteri yalnızca görünen adla eşleştiği için uygulama Codex iş parçacığına sunulmaz.

**Yapılandırma değişti ancak aracı Plugin'i göremiyor:** `/new`, `/reset` kullanın veya gateway'i yeniden başlatın. Mevcut Codex iş parçacığı bağlamaları, OpenClaw yeni bir harness oturumu kurana veya eskimiş bir bağlamayı değiştirene kadar başladıkları uygulama yapılandırmasını korur.

**Yıkıcı eylem reddedildi:** genel ve Plugin başına `allow_destructive_actions` değerlerini kontrol edin. Politika true olsa bile, güvensiz elicitation şemaları ve belirsiz Plugin kimliği yine kapalı başarısız olur.

## İlgili

- [Codex harness](/tr/plugins/codex-harness)
- [Codex harness referansı](/tr/plugins/codex-harness-reference)
- [Codex harness çalışma zamanı](/tr/plugins/codex-harness-runtime)
- [Yapılandırma referansı](/tr/gateway/configuration-reference#codex-harness-plugin-config)
- [Migrate CLI](/tr/cli/migrate)
