---
read_when:
    - Codex modundaki OpenClaw ajanlarının yerel Codex Plugin'lerini kullanmasını istiyorsunuz
    - Kaynaktan yüklenmiş openai-curated Codex Plugin'lerini geçiriyorsunuz
    - codexPlugins, uygulama envanteri, yıkıcı eylemler veya Plugin uygulaması tanılamalarıyla ilgili sorun gideriyorsunuz
summary: Taşınan yerel Codex Plugin'leri Codex modu OpenClaw ajanları için yapılandırın
title: Yerel Codex Plugin'leri
x-i18n:
    generated_at: "2026-05-12T23:30:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: ddec40cd5f9a74b43d55f327cdcd7088e024392fbafc7f1aa5bd9b136d3ecc13
    source_path: plugins/codex-native-plugins.md
    workflow: 16
---

Yerel Codex Plugin desteği, Codex modundaki bir OpenClaw aracısının, OpenClaw turunu
işleyen aynı Codex iş parçacığı içinde Codex app-server'ın kendi uygulama ve
Plugin yeteneklerini kullanmasını sağlar.

OpenClaw, Codex Plugin'lerini sentetik `codex_plugin_*` OpenClaw dinamik
araçlarına çevirmez. Plugin çağrıları yerel Codex transkriptinde kalır ve
uygulama destekli MCP yürütmesinin sahibi Codex app-server'dır.

Bu sayfayı temel [Codex harness](/tr/plugins/codex-harness) çalıştıktan sonra kullanın.

## Gereksinimler

- Seçilen OpenClaw aracı çalışma zamanı yerel Codex harness olmalıdır.
- `plugins.entries.codex.enabled` true olmalıdır.
- `plugins.entries.codex.config.codexPlugins.enabled` true olmalıdır.
- V1 yalnızca, geçişin kaynak Codex ana dizininde kaynak olarak yüklü olduğunu
  gözlemlediği `openai-curated` Plugin'lerini destekler.
- Hedef Codex app-server, beklenen marketplace, Plugin ve uygulama envanterini
  görebilmelidir.

`codexPlugins`, PI çalıştırmaları, normal OpenAI sağlayıcı çalıştırmaları, ACP
konuşma bağlamaları veya diğer harness'lar üzerinde etkili değildir; çünkü bu
yollar yerel `apps` yapılandırmasıyla Codex app-server iş parçacıkları oluşturmaz.

## Hızlı Başlangıç

Kaynak Codex ana dizininden geçişi önizleyin:

```bash
openclaw migrate codex --dry-run
```

Geçişin yerel Plugin etkinleştirmeyi planlamadan önce kaynak uygulama
erişilebilirliğini denetlemesini istediğinizde katı kaynak uygulama doğrulaması kullanın:

```bash
openclaw migrate codex --dry-run --verify-plugin-apps
```

Plan doğru göründüğünde geçişi uygulayın:

```bash
openclaw migrate apply codex --yes
```

Geçiş, uygun Plugin'ler için açık `codexPlugins` girdileri yazar ve seçilen
Plugin'ler için Codex app-server `plugin/install` çağrısı yapar. Tipik bir
geçirilmiş yapılandırma şöyle görünür:

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

`codexPlugins` değiştirildikten sonra, gelecekteki Codex harness oturumlarının
güncellenmiş uygulama kümesiyle başlaması için `/new`, `/reset` kullanın veya
Gateway'i yeniden başlatın.

## Yerel Plugin kurulumu nasıl çalışır?

Entegrasyonun üç ayrı durumu vardır:

- Yüklü: Codex, hedef app-server çalışma zamanında yerel Plugin paketine sahiptir.
- Etkin: OpenClaw yapılandırması, Plugin'i Codex harness turları için kullanılabilir
  yapmaya isteklidir.
- Erişilebilir: Codex app-server, Plugin'in uygulama girdilerinin etkin hesap için
  kullanılabilir olduğunu ve geçirilmiş Plugin kimliğine eşlenebildiğini doğrular.

Geçiş, kalıcı kurulum/uygunluk adımıdır. Planlama sırasında OpenClaw, kaynak
Codex `plugin/read` ayrıntılarını okur ve kaynak Codex app-server hesap yanıtının
bir ChatGPT abonelik hesabı olduğunu denetler. ChatGPT olmayan veya eksik hesap
yanıtları, uygulama destekli Plugin'leri `codex_subscription_required` ile atlar.
Varsayılan olarak geçiş kaynak `app/list` çağrısı yapmaz; hesap kapısından geçen
uygulama destekli kaynak Plugin'ler, kaynak uygulama erişilebilirliği doğrulaması
olmadan planlanır ve hesap arama taşıma hataları `codex_account_unavailable` ile
atlanır. `--verify-plugin-apps` ile geçiş yeni bir kaynak `app/list` anlık
görüntüsü alır ve yerel etkinleştirmeyi planlamadan önce sahip olunan her
uygulamanın mevcut, etkin ve erişilebilir olmasını gerektirir. Bu modda hesap
arama taşıma hataları kaynak uygulama envanteri kapısına düşer. Çalışma zamanı
uygulama envanteri, geçişten sonraki hedef oturum erişilebilirliği denetimidir.
Codex harness oturum kurulumu daha sonra etkin ve erişilebilir Plugin uygulamaları
için kısıtlayıcı bir iş parçacığı uygulama yapılandırması hesaplar.

İş parçacığı uygulama yapılandırması, OpenClaw bir Codex harness oturumu
kurduğunda veya bayat bir Codex iş parçacığı bağlamasını değiştirdiğinde
hesaplanır. Her turda yeniden hesaplanmaz.

## V1 destek sınırı

V1 bilinçli olarak dar tutulmuştur:

- Yalnızca kaynak Codex app-server envanterinde zaten yüklü olan `openai-curated`
  Plugin'leri geçişe uygundur.
- Uygulama destekli kaynak Plugin'ler geçiş zamanı abonelik kapısından geçmelidir.
  `--verify-plugin-apps` kaynak uygulama envanteri kapısını ekler. Abonelik kapısına
  takılan hesaplar ve doğrulama modunda erişilemeyen, devre dışı, eksik kaynak
  uygulamalar veya kaynak uygulama envanteri yenileme hataları, etkin yapılandırma
  girdileri yerine atlanmış manuel öğeler olarak bildirilir. Okunamayan Plugin
  ayrıntıları kaynak uygulama envanteri kapısından önce atlanır.
- Geçiş, `marketplaceName` ve `pluginName` ile açık Plugin kimlikleri yazar; yerel
  `marketplacePath` önbellek yolları yazmaz.
- `codexPlugins.enabled` genel etkinleştirme anahtarıdır.
- `plugins["*"]` joker karakteri ve rastgele kurulum yetkisi veren bir yapılandırma
  anahtarı yoktur.
- Desteklenmeyen marketplace'ler, önbelleğe alınmış Plugin paketleri, hook'lar ve
  Codex yapılandırma dosyaları manuel inceleme için geçiş raporunda korunur.

## Uygulama envanteri ve sahiplik

OpenClaw, Codex uygulama envanterini app-server `app/list` üzerinden okur, bir
saat boyunca önbelleğe alır ve bayat ya da eksik girdileri asenkron olarak yeniler.
Önbellek yalnızca bellektedir; CLI veya Gateway yeniden başlatıldığında düşer ve
OpenClaw onu sonraki `app/list` okumasından yeniden oluşturur.

Geçiş ve çalışma zamanı ayrı önbellek anahtarları kullanır:

- Kaynak geçiş doğrulaması, kaynak Codex ana dizinini ve kaynak app-server başlatma
  seçeneklerini kullanır. Bu yalnızca `--verify-plugin-apps` ayarlandığında çalışır
  ve o planlama çalıştırması için yeni bir kaynak `app/list` geçişini zorunlu kılar.
- Hedef çalışma zamanı kurulumu, Codex iş parçacığı uygulama yapılandırmasını
  oluştururken hedef aracının Codex app-server kimliğini kullanır. Plugin
  etkinleştirme bu hedef önbellek anahtarını geçersiz kılar ve ardından
  `plugin/install` sonrasında zorla yeniler.

Bir Plugin uygulaması yalnızca OpenClaw onu kararlı sahiplik üzerinden geçirilmiş
Plugin'e geri eşleyebildiğinde açığa çıkarılır:

- Plugin ayrıntısından tam uygulama kimliği
- bilinen MCP sunucu adı
- benzersiz kararlı metadata

Yalnızca görünen ada dayalı veya belirsiz sahiplik, sonraki envanter yenilemesi
sahipliği kanıtlayana kadar dışlanır.

## İş parçacığı uygulama yapılandırması

OpenClaw, Codex iş parçacığı için kısıtlayıcı bir `config.apps` yaması enjekte eder:
`_default` devre dışıdır ve yalnızca etkin geçirilmiş Plugin'lerin sahip olduğu
uygulamalar etkinleştirilir.

OpenClaw, uygulama düzeyi `destructive_enabled` değerini etkili genel veya Plugin
başına `allow_destructive_actions` politikasından ayarlar ve Codex'in yerel
uygulama aracı açıklamalarından yıkıcı araç metadata'sını uygulamasına izin verir.
`_default` uygulama yapılandırması `open_world_enabled: false` ile devre dışı
bırakılır. Etkin Plugin uygulamaları `open_world_enabled: true` ile yayılır;
OpenClaw ayrı bir Plugin açık dünya politika düğmesi sunmaz ve Plugin başına
yıkıcı araç adı engelleme listeleri tutmaz.

Araç onay modu, Plugin uygulamaları için varsayılan olarak otomatiktir; böylece
yıkıcı olmayan okuma araçları aynı iş parçacığında onay kullanıcı arayüzü olmadan
çalışabilir. Yıkıcı araçlar her uygulamanın `destructive_enabled` politikası
tarafından denetlenmeye devam eder.

## Yıkıcı işlem politikası

Geçirilmiş Codex Plugin'leri için yıkıcı Plugin istemleri varsayılan olarak
izinlidir; güvenli olmayan şemalar ve belirsiz sahiplik ise yine kapalı başarısız olur:

- Genel `allow_destructive_actions` varsayılan olarak `true` değerindedir.
- Plugin başına `allow_destructive_actions`, o Plugin için genel politikayı geçersiz kılar.
- Politika `false` olduğunda OpenClaw deterministik bir ret döndürür.
- Politika `true` olduğunda OpenClaw yalnızca bir onay yanıtına eşleyebildiği güvenli
  şemaları otomatik kabul eder; örneğin boolean approve alanı gibi.
- Eksik Plugin kimliği, belirsiz sahiplik, eksik tur kimliği, yanlış tur kimliği
  veya güvenli olmayan istem şeması, kullanıcıya sormak yerine reddedilir.

## Sorun giderme

**`auth_required`:** geçiş Plugin'i yükledi, ancak uygulamalarından biri hâlâ
kimlik doğrulaması gerektiriyor. Açık Plugin girdisi, yeniden yetkilendirip
etkinleştirene kadar devre dışı yazılır.

**`app_inaccessible`, `app_disabled` veya `app_missing`:**
geçiş Plugin'i yüklemedi; çünkü kaynak Codex uygulama envanteri, `--verify-plugin-apps`
ayarlanmışken sahip olunan tüm uygulamaları mevcut, etkin ve erişilebilir olarak
göstermedi. Codex'te uygulamayı yeniden yetkilendirin veya etkinleştirin, ardından
geçişi `--verify-plugin-apps` ile yeniden çalıştırın.

**`app_inventory_unavailable`:** geçiş Plugin'i yüklemedi; çünkü katı kaynak uygulama
doğrulaması istenmişti ve kaynak Codex uygulama envanteri yenilemesi başarısız oldu.
Kaynak Codex app-server erişimini düzeltin veya daha hızlı hesap kapılı planı kabul
ediyorsanız `--verify-plugin-apps` olmadan tekrar deneyin.

**`codex_subscription_required`:** geçiş uygulama destekli Plugin'i yüklemedi; çünkü
kaynak Codex app-server hesabı bir ChatGPT abonelik hesabıyla oturum açmış değildi.
Codex uygulamasında abonelik kimlik doğrulamasıyla oturum açın, ardından geçişi
yeniden çalıştırın.

**`codex_account_unavailable`:** geçiş uygulama destekli Plugin'i yüklemedi; çünkü
kaynak Codex app-server hesabı okunamadı. Kaynak Codex app-server kimlik
doğrulamasını düzeltin veya hesap araması başarısız olduğunda uygunluğu kaynak
uygulama envanterinin belirlemesini istiyorsanız `--verify-plugin-apps` ile yeniden
çalıştırın.

**`marketplace_missing` veya `plugin_missing`:** hedef Codex app-server beklenen
`openai-curated` marketplace'i veya Plugin'i göremiyor. Geçişi hedef çalışma zamanına
karşı yeniden çalıştırın ya da Codex app-server Plugin durumunu inceleyin.

**`app_inventory_missing` veya `app_inventory_stale`:** uygulama hazır olma durumu boş
veya bayat bir önbellekten geldi. OpenClaw asenkron bir yenileme zamanlar ve sahiplik
ile hazır olma durumu bilinene kadar Plugin uygulamalarını dışlar.

**`app_ownership_ambiguous`:** uygulama envanteri yalnızca görünen adla eşleşti, bu
nedenle uygulama Codex iş parçacığına açığa çıkarılmaz.

**Yapılandırma değişti ancak aracı Plugin'i göremiyor:** `/new`, `/reset` kullanın
veya Gateway'i yeniden başlatın. Mevcut Codex iş parçacığı bağlamaları, OpenClaw
yeni bir harness oturumu kurana veya bayat bir bağlamayı değiştirene kadar
başladıkları uygulama yapılandırmasını korur.

**Yıkıcı işlem reddediliyor:** genel ve Plugin başına `allow_destructive_actions`
değerlerini denetleyin. Politika true olduğunda bile güvenli olmayan istem şemaları
ve belirsiz Plugin kimliği kapalı başarısız olur.

## İlgili

- [Codex harness](/tr/plugins/codex-harness)
- [Codex harness referansı](/tr/plugins/codex-harness-reference)
- [Codex harness çalışma zamanı](/tr/plugins/codex-harness-runtime)
- [Yapılandırma referansı](/tr/gateway/configuration-reference#codex-harness-plugin-config)
- [Geçiş CLI](/tr/cli/migrate)
