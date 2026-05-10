---
read_when:
    - Codex modundaki OpenClaw ajanlarının yerel Codex Plugin’lerini kullanmasını istiyorsunuz
    - Kaynaktan yüklenmiş, OpenAI tarafından seçilmiş Codex Plugin'lerini taşıyorsunuz
    - codexPlugins, uygulama envanteri, yıkıcı eylemler veya Plugin uygulaması tanılamalarıyla ilgili sorunları gideriyorsunuz
summary: Taşınan yerel Codex Plugin'lerini Codex modu OpenClaw ajanları için yapılandırın
title: Yerel Codex Plugin'leri
x-i18n:
    generated_at: "2026-05-10T19:45:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1b9116a479ffb68e3566f6113d9ec9d2a3c33df2dd27ff539f2f27110c7b9d9f
    source_path: plugins/codex-native-plugins.md
    workflow: 16
---

Yerel Codex Plugin desteği, Codex modundaki bir OpenClaw ajanının, OpenClaw turunu işleyen aynı Codex iş parçacığı içinde Codex app-server'ın kendi uygulama ve Plugin yeteneklerini kullanmasını sağlar.

OpenClaw, Codex pluginlerini sentetik `codex_plugin_*` OpenClaw dinamik araçlarına çevirmez. Plugin çağrıları yerel Codex transkriptinde kalır ve uygulama destekli MCP yürütmesini Codex app-server üstlenir.

Bu sayfayı temel [Codex harness](/tr/plugins/codex-harness) çalıştıktan sonra kullanın.

## Gereksinimler

- Seçilen OpenClaw ajan çalışma zamanı yerel Codex harness olmalıdır.
- `plugins.entries.codex.enabled` true olmalıdır.
- `plugins.entries.codex.config.codexPlugins.enabled` true olmalıdır.
- V1 yalnızca geçişin kaynak Codex ana dizininde kaynak üzerinden yüklü olarak gözlemlediği `openai-curated` pluginlerini destekler.
- Hedef Codex app-server beklenen marketplace, Plugin ve uygulama envanterini görebilmelidir.

`codexPlugins`; PI çalıştırmaları, normal OpenAI sağlayıcı çalıştırmaları, ACP konuşma bağlamaları veya diğer harnessler üzerinde etkili değildir, çünkü bu yollar yerel `apps` yapılandırmasına sahip Codex app-server iş parçacıkları oluşturmaz.

## Hızlı başlangıç

Kaynak Codex ana dizininden geçişi önizleyin:

```bash
openclaw migrate codex --dry-run
```

Plan doğru göründüğünde geçişi uygulayın:

```bash
openclaw migrate apply codex --yes
```

Geçiş, uygun pluginler için açık `codexPlugins` girdileri yazar ve seçilen pluginler için Codex app-server `plugin/install` çağırır. Tipik bir geçirilmiş yapılandırma şöyle görünür:

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

`codexPlugins` değiştirildikten sonra, gelecekteki Codex harness oturumlarının güncellenmiş uygulama kümesiyle başlaması için `/new`, `/reset` kullanın veya gateway'i yeniden başlatın.

## Yerel Plugin kurulumunun çalışma biçimi

Entegrasyonun üç ayrı durumu vardır:

- Yüklü: Codex, yerel Plugin paketine hedef app-server çalışma zamanında sahiptir.
- Etkin: OpenClaw yapılandırması, Pluginin Codex harness turlarına sunulmasına izin verir.
- Erişilebilir: Codex app-server, Pluginin uygulama girdilerinin etkin hesap için kullanılabilir olduğunu ve geçirilmiş Plugin kimliğine eşlenebildiğini doğrular.

Geçiş, kalıcı kurulum/uygunluk adımıdır. Çalışma zamanı uygulama envanteri erişilebilirlik kontrolüdür. Codex harness oturum kurulumu daha sonra etkin ve erişilebilir Plugin uygulamaları için kısıtlayıcı bir iş parçacığı uygulama yapılandırması hesaplar.

İş parçacığı uygulama yapılandırması, OpenClaw bir Codex harness oturumu kurduğunda veya eski bir Codex iş parçacığı bağlamasını değiştirdiğinde hesaplanır. Her turda yeniden hesaplanmaz.

## V1 destek sınırı

V1 bilinçli olarak dardır:

- Yalnızca kaynak Codex app-server envanterinde zaten yüklü olan `openai-curated` pluginleri geçişe uygundur.
- Geçiş, `marketplaceName` ve `pluginName` ile açık Plugin kimlikleri yazar; yerel `marketplacePath` önbellek yolları yazmaz.
- `codexPlugins.enabled` genel etkinleştirme anahtarıdır.
- `plugins["*"]` joker karakteri ve keyfi kurulum yetkisi veren bir yapılandırma anahtarı yoktur.
- Desteklenmeyen marketplace'ler, önbelleğe alınmış Plugin paketleri, hook'lar ve Codex yapılandırma dosyaları manuel inceleme için geçiş raporunda korunur.

## Uygulama envanteri ve sahiplik

OpenClaw, Codex uygulama envanterini app-server `app/list` üzerinden okur, bir saat önbelleğe alır ve eski veya eksik girdileri asenkron olarak yeniler.

Bir Plugin uygulaması yalnızca OpenClaw onu kararlı sahiplik üzerinden geçirilmiş Pluginle tekrar eşleyebildiğinde açığa çıkar:

- Plugin ayrıntısından tam uygulama kimliği
- bilinen MCP sunucu adı
- benzersiz kararlı metadata

Yalnızca görünen ada dayalı veya belirsiz sahiplik, sonraki envanter yenilemesi sahipliği kanıtlayana kadar hariç tutulur.

## İş parçacığı uygulama yapılandırması

OpenClaw, Codex iş parçacığı için kısıtlayıcı bir `config.apps` yaması enjekte eder: `_default` devre dışı bırakılır ve yalnızca etkin geçirilmiş pluginlerin sahip olduğu uygulamalar etkinleştirilir.

OpenClaw, uygulama düzeyi `destructive_enabled` değerini etkili genel veya Plugin başına `allow_destructive_actions` ilkesinden ayarlar ve Codex'in yerel uygulama aracı anotasyonlarından yıkıcı araç metadata'sını uygulamasına izin verir. `_default` uygulama yapılandırması `open_world_enabled: false` ile devre dışı bırakılır. Etkin Plugin uygulamaları `open_world_enabled: true` ile yayımlanır; OpenClaw ayrı bir Plugin open-world ilke düğmesi açığa çıkarmaz ve Plugin başına yıkıcı araç adı reddetme listeleri tutmaz.

OpenClaw aynı iş parçacığı yolunda etkileşimli bir uygulama-elicitation kullanıcı arayüzüne sahip olmadığı için, araç onay modu Plugin uygulamaları için varsayılan olarak sorulur.

## Yıkıcı eylem ilkesi

Yıkıcı Plugin elicitation'ları varsayılan olarak kapalı kalır:

- Genel `allow_destructive_actions` varsayılanı `false` değeridir.
- Plugin başına `allow_destructive_actions`, o Plugin için genel ilkeyi geçersiz kılar.
- İlke `false` olduğunda OpenClaw deterministik bir ret döndürür.
- İlke `true` olduğunda OpenClaw yalnızca boolean onay alanı gibi bir onay yanıtına eşleyebildiği güvenli şemaları otomatik kabul eder.
- Eksik Plugin kimliği, belirsiz sahiplik, eksik tur kimliği, yanlış tur kimliği veya güvenli olmayan elicitation şeması, sormak yerine reddedilir.

## Sorun giderme

**`auth_required`:** geçiş Plugini yükledi, ancak uygulamalarından biri hâlâ kimlik doğrulama gerektiriyor. Açık Plugin girdisi, yeniden yetkilendirip etkinleştirene kadar devre dışı yazılır.

**`marketplace_missing` veya `plugin_missing`:** hedef Codex app-server beklenen `openai-curated` marketplace'i veya Plugini göremiyor. Geçişi hedef çalışma zamanına karşı yeniden çalıştırın veya Codex app-server Plugin durumunu inceleyin.

**`app_inventory_missing` veya `app_inventory_stale`:** uygulama hazır olma durumu boş veya eski bir önbellekten geldi. OpenClaw asenkron bir yenileme zamanlar ve sahiplik ile hazır olma durumu bilinena kadar Plugin uygulamalarını hariç tutar.

**`app_ownership_ambiguous`:** uygulama envanteri yalnızca görünen ada göre eşleştiği için uygulama Codex iş parçacığına açığa çıkarılmaz.

**Yapılandırma değişti ancak ajan Plugini göremiyor:** `/new`, `/reset` kullanın veya gateway'i yeniden başlatın. Mevcut Codex iş parçacığı bağlamaları, OpenClaw yeni bir harness oturumu kurana veya eski bir bağlamayı değiştirene kadar başladıkları uygulama yapılandırmasını korur.

**Yıkıcı eylem reddediliyor:** genel ve Plugin başına `allow_destructive_actions` değerlerini kontrol edin. İlke true olsa bile, güvenli olmayan elicitation şemaları ve belirsiz Plugin kimliği kapalı kalmaya devam eder.

## İlgili

- [Codex harness](/tr/plugins/codex-harness)
- [Codex harness referansı](/tr/plugins/codex-harness-reference)
- [Codex harness çalışma zamanı](/tr/plugins/codex-harness-runtime)
- [Yapılandırma referansı](/tr/gateway/configuration-reference#codex-harness-plugin-config)
- [Migrate CLI](/tr/cli/migrate)
