---
read_when:
    - Codex modundaki OpenClaw ajanlarının yerel Codex eklentilerini kullanmasını istiyorsunuz
    - Kaynak koddan kurulmuş, OpenAI tarafından seçilmiş Codex pluginlerini taşıyorsunuz
    - Mevcut bir çalışma alanı dizini Codex Plugin'ini yapılandırıyorsunuz
    - codexPlugins, uygulama envanteri, yıkıcı işlemler veya plugin uygulaması tanılamalarıyla ilgili sorunları gideriyorsunuz
summary: Codex modundaki OpenClaw ajanları için yerel Codex Pluginlerini yapılandırın
title: Yerel Codex pluginleri
x-i18n:
    generated_at: "2026-07-12T12:31:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0b1cfa39838d4dbd1f33a1e5b7f52faec4b033f9fa98ef5c029003177c2e27e5
    source_path: plugins/codex-native-plugins.md
    workflow: 16
---

Yerel Codex Plugin desteği, Codex modundaki bir OpenClaw aracısının, OpenClaw turunu
işleyen aynı Codex iş parçacığı içinde Codex app-server'ın kendi uygulama ve Plugin
yeteneklerini kullanmasına olanak tanır. Plugin çağrıları yerel Codex transkriptinde
kalır; uygulama destekli MCP yürütmesini Codex app-server yönetir. OpenClaw,
Codex Pluginlerini yapay `codex_plugin_*` OpenClaw dinamik araçlarına dönüştürmez.

Bu sayfayı, temel [Codex çalıştırma sistemi](/tr/plugins/codex-harness) çalışmaya
başladıktan sonra kullanın.

## Gereksinimler

- Aracı çalışma zamanı, yerel Codex çalıştırma sistemi olmalıdır.
- `plugins.entries.codex.enabled`, `true` olmalıdır.
- `plugins.entries.codex.config.codexPlugins.enabled`, `true` olmalıdır.
- Hedef Codex app-server, beklenen pazar yeri, Plugin ve uygulama envanterini görebilmelidir.
- Geçiş yalnızca kaynak Codex ana dizininde kaynaktan yüklenmiş olarak gözlemlediği
  `openai-curated` Pluginlerini destekler.
- Elle yapılandırılan `workspace-directory` Pluginleri, `plugin/list` çağrısı
  `marketplaceKinds` kabul eden ve yolsuz çalışma alanı özetlerinde
  `remotePluginId` içeren bir Codex app-server gerektirir. Plugin zaten yüklenmiş
  ve etkinleştirilmiş olmalı, sahip olduğu uygulamalara da `app/list` içinde
  erişilebilmelidir.

`codexPlugins`, OpenClaw sağlayıcısı çalıştırmalarını, ACP konuşma
bağlamalarını veya diğer çalıştırma sistemlerini etkilemez; çünkü bu yollar,
yerel `apps` yapılandırmasına sahip Codex app-server iş parçacıkları oluşturmaz.

OpenAI tarafındaki Codex hesabı, uygulama kullanılabilirliği ve çalışma alanı
uygulama/Plugin denetimleri, oturum açılmış Codex hesabından gelir. OpenAI hesap
ve yönetici modeli için
[ChatGPT planınızla Codex'i kullanma](https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan)
sayfasına bakın.

## Hızlı başlangıç

Kaynak Codex ana dizininden geçişi önizleyin:

```bash
openclaw migrate codex --dry-run
```

Geçişin kaynak `app/list` çağrısını yapmasını ve yerel etkinleştirmeyi
planlamadan önce sahip olunan her uygulamanın mevcut, etkin ve erişilebilir
olmasını zorunlu kılmak için `--verify-plugin-apps` ekleyin:

```bash
openclaw migrate codex --dry-run --verify-plugin-apps
```

Plan doğru görünüyorsa geçişi uygulayın:

```bash
openclaw migrate apply codex --yes
```

Geçiş, uygun Pluginler için açık `codexPlugins` girdileri yazar ve seçilen
Pluginler için Codex app-server `plugin/install` çağrısını yapar. Geçirilmiş bir
yapılandırma şöyle görünür:

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

Geçiş `openai-curated` ile sınırlı kalır. Mevcut bir `workspace-directory`
Plugini kullanmak için onu, `plugin/list` tarafından döndürülen pazar yeri
nitelemeli tam `summary.id` değeriyle elle ekleyin. Örneğin Codex,
`example-plugin@workspace-directory` döndürürse görüntüleme adı yerine bu tam
değeri yapılandırın:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          codexPlugins: {
            enabled: true,
            plugins: {
              "example-plugin": {
                enabled: true,
                marketplaceName: "workspace-directory",
                pluginName: "example-plugin@workspace-directory",
              },
            },
          },
        },
      },
    },
  },
}
```

OpenClaw, bir `workspace-directory` Plugini için `plugin/install` çağrısı yapmaz
veya kimlik doğrulaması başlatmaz. OpenClaw ilkesini eklemeden veya
etkinleştirmeden önce Plugini Codex'te yükleyin, etkinleştirin ve kimliğini
doğrulayın. Yanıt tam pazar yeri, Plugin kimliği, ayrıntı kimliği veya uygulama
hazırlığı kanıtını içermediğinde OpenClaw uygulamaları gizli tutar. Codex açık
çalışma alanı `plugin/list` isteğini reddederse OpenClaw, etkinleştirilmiş her
çalışma alanı Plugini için `marketplace_missing` bildirir ve bağımsız olarak
keşfedilen seçilmiş Pluginleri kullanılabilir tutar.

Bir `codexPlugins` değişikliğinden sonra yeni Codex konuşmaları, güncellenen
uygulama kümesini otomatik olarak alır. Geçerli konuşmayı yenilemek için `/new`
veya `/reset` çalıştırın. Plugin etkinleştirme/devre dışı bırakma değişiklikleri
için Gateway'in yeniden başlatılması gerekmez.

## Pluginleri sohbetten yönetme

`/codex plugins`, Codex çalıştırma sistemini kullandığınız aynı sohbetten
yapılandırılmış yerel Codex Pluginlerini inceler veya değiştirir:

```text
/codex plugins
/codex plugins list
/codex plugins disable google-calendar
/codex plugins enable google-calendar
```

`/codex plugins`, `/codex plugins list` için bir diğer addır. Liste,
`plugins.entries.codex.config.codexPlugins.plugins` içindeki yapılandırılmış her
Pluginin anahtarını, açık/kapalı durumunu, Codex Plugin adını ve pazar yerini
gösterir.

`enable`/`disable` yalnızca `~/.openclaw/openclaw.json` dosyasına yazar;
`~/.codex/config.toml` dosyasını hiçbir zaman düzenlemez veya yeni Codex
Pluginleri yüklemez. Bunları yalnızca sahip ya da `operator.admin` kapsamına
sahip bir Gateway istemcisi çalıştırabilir.

Yapılandırılmış bir Plugini etkinleştirmek, genel `codexPlugins.enabled`
anahtarını da açar. Geçiş `auth_required` döndürdüğü için seçilmiş bir Plugin
devre dışı olarak yazıldıysa OpenClaw'da etkinleştirmeden önce uygulamayı
Codex'te yeniden yetkilendirin. Bir `workspace-directory` girdisini burada
etkinleştirmek yalnızca OpenClaw ilkesini değiştirir; Plugin ve uygulama
Codex'te zaten etkin olmalıdır.

## Yerel Plugin kurulumu nasıl çalışır?

Entegrasyon üç durumu izler:

| Durum       | Anlamı                                                                                                                                 |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Yüklü       | Codex, hedef app-server çalışma zamanında Plugin paketine sahiptir.                                                                    |
| Etkin       | Codex, Pluginin etkin olduğunu bildirir ve OpenClaw yapılandırması Codex çalıştırma sistemi turlarında kullanılmasına izin verir.      |
| Erişilebilir | Codex app-server, Pluginin uygulama girdilerinin etkin hesapta kullanılabildiğini ve yapılandırılmış Plugin kimliğiyle eşleştiğini doğrular. |

`openai-curated` Pluginleri için geçiş, kalıcı yükleme/uygunluk adımıdır:

- Planlama sırasında OpenClaw, kaynak Codex `plugin/read` ayrıntılarını okur ve
  kaynak Codex app-server hesabının bir ChatGPT abonelik hesabı olduğunu
  denetler. ChatGPT olmayan veya eksik bir hesap yanıtı, uygulama destekli
  Pluginleri `codex_subscription_required` ile atlar.
- Geçiş varsayılan olarak kaynak `app/list` çağrısını atlar: hesap kapısından
  geçen uygulama destekli kaynak Pluginler, kaynak uygulama erişilebilirliği
  doğrulanmadan planlanır; hesap sorgulama aktarım hataları ise
  `codex_account_unavailable` ile atlanır.
- `--verify-plugin-apps` kullanıldığında geçiş, yeni bir kaynak `app/list`
  anlık görüntüsü alır ve yerel etkinleştirmeyi planlamadan önce sahip olunan
  her uygulamanın mevcut, etkin ve erişilebilir olmasını zorunlu kılar. Bu
  durumda hesap sorgulama aktarım hataları, doğrudan atlanmak yerine kaynak
  uygulama envanteri kapısına geçer.

`workspace-directory` Pluginlerinin kurulumu OpenClaw dışında gerçekleşir.
OpenClaw bu pazar yerini yalnızca en az bir etkin çalışma alanı girdisi
yapılandırıldığında sorgular, her Plugini tam `summary.id` değeriyle çözümler ve
mevcut `plugin/read` sahiplik denetimleriyle `app/list` hazırlık denetimlerini
yeniden kullanır. Yüklenmemiş, devre dışı, erişilemez veya kimliği doğrulanmamış
bir Plugin hiçbir uygulamayı açığa çıkarmaz; OpenClaw yükleme veya kimlik
doğrulaması yapmaya çalışmaz.

Çalışma zamanı uygulama envanteri, hem geçirilmiş seçilmiş Pluginler hem de elle
yapılandırılmış çalışma alanı Pluginleri için hedef oturum erişilebilirliği
denetimidir. Codex çalıştırma sistemi oturum kurulumu, etkin ve erişilebilir
Plugin uygulamalarından kısıtlayıcı bir iş parçacığı uygulama yapılandırması
hesaplar; bu yapılandırma her turda yeniden hesaplanmaz. Bu nedenle
`/codex plugins enable`/`disable` yalnızca yeni Codex konuşmalarını etkiler.
Geçerli konuşmada değişikliği almak için `/new` veya `/reset` kullanın.

## V1 destek sınırı

- Yalnızca kaynak Codex app-server envanterinde zaten yüklü olan
  `openai-curated` Pluginleri geçişe uygundur.
- Çalışma zamanı ayrıca `plugin/list` uygulamasının `marketplaceKinds`
  desteklediği ve yolsuz çalışma alanı özetleri için `remotePluginId` döndürdüğü
  app-server derlemelerinde açık `workspace-directory` girdilerini destekler.
  Bu girdiler pazar yeri nitelemeli tam `summary.id` değerlerini kullanmalı ve
  zaten yüklenmiş, etkin ve uygulama açısından erişilebilir olmalıdır.
  Reddedilen bir çalışma alanı listeleme isteği, mevcut Plugin başına
  `marketplace_missing` tanılamasını üretir; eksik pazar yeri, Plugin, ayrıntı
  veya uygulama kanıtı hiçbir çalışma alanı uygulamasını açığa çıkarmaz.
  Varsayılan liste isteğinden gelen seçilmiş envanter kullanılmaya devam eder.
- Uygulama destekli kaynak Pluginler, geçiş zamanındaki abonelik kapısından
  geçmelidir. `--verify-plugin-apps`, kaynak uygulama envanteri kapısını ekler.
  Abonelik kapısına takılan hesaplar ve doğrulama modunda erişilemeyen, devre
  dışı veya eksik kaynak uygulamalar ya da uygulama envanteri yenileme hataları,
  etkin yapılandırma girdileri yerine atlanan elle işlem öğeleri olarak
  bildirilir. Okunamayan Plugin ayrıntıları, uygulama envanteri kapısından önce
  atlanır.
- Geçiş açık Plugin kimlikleri (`marketplaceName` ve `pluginName`) yazar; yerel
  `marketplacePath` önbellek yollarını yazmaz.
- `codexPlugins.enabled` tek genel etkinleştirme anahtarıdır; rastgele yükleme
  yetkisi veren bir `plugins["*"]` joker karakteri veya yapılandırma anahtarı
  yoktur.
- Seçilmiş olmayan pazar yerleri, önbelleğe alınmış Plugin paketleri, kancalar
  ve Codex yapılandırma dosyaları otomatik olarak etkinleştirilmek yerine elle
  inceleme için geçiş raporunda korunur. Çalışma zamanı, elle yapılandırılmış
  `workspace-directory` girdilerini kabul eder; diğer pazar yerleri
  desteklenmez.

## Uygulama envanteri ve sahiplik

OpenClaw, Codex uygulama envanterini app-server `app/list` üzerinden okur, bir
saat boyunca bellekte önbelleğe alır ve eski ya da eksik girdileri eşzamansız
olarak yeniler. Önbellek işleme özeldir; CLI veya Gateway yeniden
başlatıldığında silinir ve OpenClaw onu bir sonraki `app/list` okumasından
yeniden oluşturur.

Geçiş ve çalışma zamanı ayrı önbellek anahtarları kullanır:

- Kaynak geçiş doğrulaması, kaynak Codex ana dizinini ve başlatma seçeneklerini
  kullanır. Yalnızca `--verify-plugin-apps` ile çalışır ve söz konusu planlama
  çalıştırması için yeni bir kaynak `app/list` dolaşımını zorunlu kılar.
- Hedef çalışma zamanı kurulumu, iş parçacığı uygulama yapılandırmasını
  oluştururken hedef aracının Codex app-server kimliğini kullanır. Seçilmiş
  Plugin etkinleştirmesi bu hedef önbellek anahtarını geçersiz kılar, ardından
  `plugin/install` sonrasında zorunlu olarak yeniler. `workspace-directory`
  kurulumu bu etkinleştirme yolunu hiçbir zaman çalıştırmaz.

Bir Plugin uygulaması yalnızca OpenClaw onu kararlı sahiplik üzerinden
yapılandırılmış Plugine geri eşleyebildiğinde açığa çıkarılır: Plugin
ayrıntısındaki tam uygulama kimliği, bilinen bir MCP sunucusu adı veya benzersiz
kararlı meta veri. Yalnızca görüntüleme adına dayalı veya belirsiz sahiplik, bir
sonraki envanter yenilemesi sahipliği kanıtlayana kadar hariç tutulur.

## Bağlı hesap uygulamaları

Sahip tarafından işletilen aracılar, eşleşen bir Plugin paketi gerektirmeden
Codex hesaplarına zaten bağlı olan tüm uygulamaları kullanmayı seçebilir:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          codexPlugins: {
            enabled: true,
            allow_all_plugins: true,
            allow_destructive_actions: "auto",
          },
        },
      },
    },
  },
}
```

`allow_all_plugins: true`, yeni bir yerel Codex iş parçacığı oluşturulduğunda
tam bir `app/list` anlık görüntüsü alır ve yalnızca o hesap için erişilebilir
olarak işaretlenen uygulamaları kabul eder. Uygulamaları genel olarak yüklemez,
kimliklerini doğrulamaz veya etkinleştirmez. Mevcut iş parçacıkları kalıcı
uygulama kümelerini korur; yeni bağlanan veya erişimi kaldırılan uygulamaları
almak için `/new`, `/reset` kullanın ya da Gateway'i yeniden başlatın.

Hesap uygulamaları; `true`, `false`, `"auto"` veya `"ask"` kabul eden genel
`codexPlugins.allow_destructive_actions` değerini devralır. Açık Plugin başına
ilke, çakışan uygulama kimlikleri için genel ilkeyi geçersiz kılar. Envanter
hataları, kısıtlamasız bir varsayılana geri dönmek yerine güvenli biçimde
başarısız olur.

## İş parçacığı uygulama yapılandırması

OpenClaw, Codex iş parçacığı için kısıtlayıcı bir `config.apps` yaması ekler:
`_default` devre dışı bırakılır ve yalnızca etkinleştirilmiş yapılandırılmış pluginlerin sahip olduğu veya
`allow_all_plugins` tarafından kabul edilen erişilebilir hesap uygulamaları etkinleştirilir.

Her uygulamadaki `destructive_enabled`, geçerli genel veya
plugin başına `allow_destructive_actions` politikasından gelir; `true`, `"auto"` ve `"ask"`
değerlerinin tümü `destructive_enabled: true` ayarını yaparken `false`, bunu `false` olarak ayarlar. Codex,
yerel uygulama aracı ek açıklamalarındaki yıkıcı araç meta verilerini uygulamaya devam eder.
`_default`, `open_world_enabled: false` ile devre dışı bırakılır; etkinleştirilmiş plugin uygulamaları
`open_world_enabled: true` değerini alır. OpenClaw, plugin düzeyinde ayrı bir
açık dünya politikası ayarı sunmaz ve plugin başına
yıkıcı araç adı engelleme listeleri tutmaz.

Araç onay modu, kabul edilen uygulamalar için varsayılan olarak otomatiktir; böylece yıkıcı olmayan
okuma araçları aynı iş parçacığında onay istemi olmadan çalışır. Yıkıcı araçlar,
her uygulamanın `destructive_enabled` politikası tarafından denetlenmeye devam eder.

## Yıkıcı eylem politikası

Yapılandırılmış Codex pluginleri için yıkıcı plugin bilgi taleplerine varsayılan olarak izin verilir;
güvenli olmayan şemalar ve belirsiz sahiplik ise güvenli biçimde reddedilir:

- Genel `allow_destructive_actions` varsayılan olarak `true` değerindedir.
- Plugin başına `allow_destructive_actions`, söz konusu plugin için genel politikayı
  geçersiz kılar.
- `false`: OpenClaw, belirlenimsel bir ret yanıtı döndürür.
- `true`: OpenClaw yalnızca bir boole onay alanı gibi, onay
  yanıtına eşleyebildiği güvenli şemaları otomatik olarak kabul eder.
- `"auto"`: OpenClaw, yıkıcı plugin eylemlerini Codex'e sunar, ardından
  sahipliği kanıtlanmış MCP onay bilgi taleplerini Codex onay yanıtını
  döndürmeden önce OpenClaw plugin onaylarına dönüştürür.
- `"ask"`: OpenClaw, `"auto"` ile aynı Codex yazma/yıkıcı eylem denetimini
  kullanır, iş parçacığı başlamadan önce uygulama için kalıcı Codex araç başına
  onay geçersiz kılmalarını temizler ve kalıcı onayların sonraki yazma eylemi
  istemlerini engelleyememesi için yalnızca tek seferlik onay veya ret sunar.
  OpenClaw, `"ask"` kullanan kabul edilmiş her uygulama için Codex'in insan onayları
  inceleyicisini seçer; böylece Codex onay bilgi taleplerini OpenClaw'a gönderir.
  Diğer uygulamalar ve uygulama dışı iş parçacığı onayları, yapılandırılmış
  inceleyicilerini ve politikalarını korur.
- Eksik plugin kimliği, belirsiz sahiplik, eksik veya eşleşmeyen
  işlem kimliği ya da güvenli olmayan bir bilgi talebi şeması, istem göstermek yerine reddedilir.

## Sorun giderme

| Kod                                               | Anlamı                                                                                                                                        | Çözüm                                                                                                                     |
| ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `auth_required`                                   | Geçiş plugin'i yükledi ancak uygulamalarından biri hâlâ kimlik doğrulaması gerektiriyor. Yeniden yetkilendirene kadar girdi devre dışı olarak yazılır. | Uygulamayı Codex'te yeniden yetkilendirin, ardından plugin'i OpenClaw'da etkinleştirin.                                    |
| `app_inaccessible`, `app_disabled`, `app_missing` | `--verify-plugin-apps` kullanıldığında kaynak Codex uygulama envanteri, sahip olunan tüm uygulamaları mevcut, etkin ve erişilebilir olarak göstermedi. | Uygulamayı Codex'te yeniden yetkilendirin veya etkinleştirin, ardından geçişi `--verify-plugin-apps` ile yeniden çalıştırın. |
| `app_inventory_unavailable`                       | Katı kaynak uygulama doğrulaması istendi ancak kaynak Codex uygulama envanteri yenilenemedi.                                                    | Kaynak Codex uygulama sunucusu erişimini düzeltin veya daha hızlı hesap denetimli planı kabul etmek için `--verify-plugin-apps` olmadan yeniden deneyin. |
| `codex_subscription_required`                     | Kaynak Codex uygulama sunucusu hesabı bir ChatGPT abonelik hesabı değildi.                                                                     | Codex uygulamasında abonelik kimlik doğrulamasıyla oturum açın, ardından geçişi yeniden çalıştırın.                         |
| `codex_account_unavailable`                       | Kaynak Codex uygulama sunucusu hesabı okunamadı.                                                                                               | Kaynak Codex uygulama sunucusu kimlik doğrulamasını düzeltin veya uygunluğa kaynak uygulama envanterinin karar vermesi için `--verify-plugin-apps` ile yeniden çalıştırın. |
| `marketplace_missing`, `plugin_missing`           | Pazar yeri veya tam plugin kullanılamıyor; açık çalışma alanı katalog isteği reddedilmiş olabilir; çalışma alanı uygulamaları güvenli biçimde reddedilir. | Aşağıda açıklanan uyumlu uygulama sunucusu sözleşmesini ve tam kimliği doğrulayın.                                         |
| `plugin_detail_unavailable`                       | OpenClaw, plugin sahipliği ayrıntılarını okuyamadı.                                                                                            | Hedef uygulama sunucusunun `plugin/list` ve `plugin/read` yanıtlarını inceleyin.                                           |
| `plugin_disabled`                                 | Codex, plugin'in yüklü ancak devre dışı olduğunu bildiriyor.                                                                                   | Seçkili etkinleştirme bunu düzeltebilir; yeniden denemeden önce Codex'te bir çalışma alanı plugin'ini etkinleştirin.        |
| `plugin_activation_failed`                        | Plugin etkinleştirmesi tamamlanmadı.                                                                                                           | Pazar yeri, kimlik doğrulama, yenileme veya çalışma alanı hazır olma hatalarını ayırt etmek için ekli tanılamayı kullanın.  |
| `app_inventory_missing`, `app_inventory_stale`    | Uygulama hazır olma durumu boş veya güncelliğini yitirmiş bir önbellekten geldi.                                                               | OpenClaw otomatik olarak eşzamansız yenileme zamanlar; sahiplik ve hazır olma durumu bilininceye kadar plugin uygulamaları hariç tutulur. |
| `app_ownership_ambiguous`                         | Uygulama envanteri yalnızca görünen ada göre eşleşti.                                                                                          | Daha sonraki bir yenileme sahipliği kanıtlayana kadar uygulama Codex iş parçacığından gizli kalır.                         |

**Çalışma alanı plugin'i yüklü ancak görünmüyor:** çalışma alanı
`plugin/list` sonucunun tam yapılandırılmış kimliği yüklü ve etkin olarak bildirdiğini doğrulayın,
ardından `app/list` sonucunun sahip olunan her uygulamayı aynı Codex
hesabı için erişilebilir olarak bildirdiğini doğrulayın. OpenClaw, hesap
envanteri uygulamayı şu anda devre dışı olarak bildirse bile erişilebilir bir uygulamayı iş parçacığı için etkinleştirebilir.
Gateway uygulama envanterini önbelleğe aldıktan sonra bu durumu değiştirdiyseniz,
bir saatlik önbellek yenilemesini bekleyin veya Gateway'i yeniden başlatın, ardından
`/new` ya da `/reset` kullanın. OpenClaw, çalışma alanı pluginlerini onarmaz veya bunların kimliğini doğrulamaz.
Açık çalışma alanı liste isteği reddedilirse, etkinleştirilmiş her çalışma alanı
girdisi `marketplace_missing` bildirir; ilgisiz seçkili girdiler varsayılan liste
yanıtından ilerlemeye devam eder.

`plugin_detail_unavailable` için yolsuz bir çalışma alanı özeti
`remotePluginId` içermelidir; bu seçici veya sonraki
`plugin/read` sonucu kullanılamadığında OpenClaw, sahip olunan uygulamaları gizli tutar.
`plugin_activation_failed` için seçkili pluginler pazar yeri, kimlik doğrulama veya
yükleme sonrası yenileme hatası bildirebilir. Bir çalışma alanı plugin'i, hâlihazırda
etkin değilse bu kodu bildirir; onu OpenClaw dışında yükleyin, etkinleştirin ve kimliğini doğrulayın.

**Yapılandırma değişti ancak aracı plugin'i göremiyor:** yapılandırılmış durumu
doğrulamak için `/codex plugins list` komutunu, ardından `/new` veya `/reset` komutunu çalıştırın.
Mevcut Codex iş parçacığı bağlamaları, OpenClaw yeni bir çalıştırma altyapısı oturumu
oluşturana veya güncelliğini yitirmiş bir bağlamanın yerini alana kadar başlangıçtaki uygulama
yapılandırmalarını korur.

**Yıkıcı eylem reddediliyor:** genel ve plugin başına
`allow_destructive_actions` değerlerini denetleyin. `true`, `"auto"` veya `"ask"` kullanıldığında bile
güvenli olmayan bilgi talebi şemaları ve belirsiz plugin kimliği güvenli biçimde reddedilmeye devam eder.

## İlgili

- [Codex çalıştırma altyapısı](/tr/plugins/codex-harness)
- [Codex çalıştırma altyapısı başvurusu](/tr/plugins/codex-harness-reference)
- [Codex çalıştırma altyapısı çalışma zamanı](/tr/plugins/codex-harness-runtime)
- [Yapılandırma başvurusu](/tr/gateway/configuration-reference#codex-harness-plugin-config)
- [Geçiş CLI'si](/tr/cli/migrate)
