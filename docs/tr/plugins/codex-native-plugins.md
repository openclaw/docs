---
read_when:
    - Codex modundaki OpenClaw ajanlarının yerel Codex Plugin'lerini kullanmasını istiyorsunuz
    - Kaynaktan yüklenmiş, OpenAI tarafından seçilmiş Codex Plugin'lerini taşıyorsunuz
    - codexPlugins, uygulama envanteri, yıkıcı işlemler veya Plugin uygulama tanılamalarıyla ilgili sorun gideriyorsunuz
summary: Taşınmış yerel Codex Plugin'lerini Codex modundaki OpenClaw ajanları için yapılandırın
title: Yerel Codex Plugin'leri
x-i18n:
    generated_at: "2026-06-28T00:52:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 82d8eb7ca7c10db5220c49426f5e9db5992ee751d48b2ac8c89e93773fc87776
    source_path: plugins/codex-native-plugins.md
    workflow: 16
---

Yerel Codex Plugin desteği, Codex modu bir OpenClaw aracısının OpenClaw turunu işleyen aynı Codex iş parçacığı içinde Codex app-server'ın kendi uygulama ve Plugin yeteneklerini kullanmasını sağlar.

OpenClaw, Codex Plugin'lerini yapay `codex_plugin_*` OpenClaw dinamik araçlarına çevirmez. Plugin çağrıları yerel Codex dökümünde kalır ve uygulama destekli MCP yürütmenin sahibi Codex app-server'dır.

Bu sayfayı temel [Codex harness](/tr/plugins/codex-harness) çalıştıktan sonra kullanın.

## Gereksinimler

- Seçili OpenClaw aracı çalışma zamanı yerel Codex harness olmalıdır.
- `plugins.entries.codex.enabled` true olmalıdır.
- `plugins.entries.codex.config.codexPlugins.enabled` true olmalıdır.
- V1 yalnızca geçişin kaynak Codex ana dizininde kaynak olarak kurulmuş gözlemlediği `openai-curated` Plugin'leri destekler.
- Hedef Codex app-server beklenen marketplace, Plugin ve uygulama envanterini görebilmelidir.

`codexPlugins`, OpenClaw çalıştırmaları, normal OpenAI sağlayıcı çalıştırmaları, ACP konuşma bağlamaları veya diğer harness'lar üzerinde etkili değildir; çünkü bu yollar yerel `apps` yapılandırmasıyla Codex app-server iş parçacıkları oluşturmaz.

OpenAI tarafındaki Codex erişimi, uygulama kullanılabilirliği ve çalışma alanı uygulama/Plugin denetimleri, oturum açılmış Codex hesabından gelir. OpenAI hesabı ve yönetici modeli için bkz. [Codex'i ChatGPT planınızla kullanma](https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan).

## Hızlı başlangıç

Kaynak Codex ana dizininden geçişi önizleyin:

```bash
openclaw migrate codex --dry-run
```

Yerel Plugin etkinleştirmesini planlamadan önce geçişin kaynak uygulama erişilebilirliğini denetlemesini istediğinizde sıkı kaynak uygulama doğrulamasını kullanın:

```bash
openclaw migrate codex --dry-run --verify-plugin-apps
```

Plan doğru göründüğünde geçişi uygulayın:

```bash
openclaw migrate apply codex --yes
```

Geçiş, uygun Plugin'ler için açık `codexPlugins` girdileri yazar ve seçili Plugin'ler için Codex app-server `plugin/install` çağırır. Tipik bir geçirilmiş yapılandırma şöyle görünür:

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

`codexPlugins` değiştirildikten sonra yeni Codex konuşmaları güncellenmiş uygulama kümesini otomatik olarak alır. Geçerli konuşmayı yenilemek için `/new` veya `/reset` kullanın. Plugin etkinleştirme veya devre dışı bırakma değişiklikleri için Gateway'in yeniden başlatılması gerekmez.

## Sohbetten Plugin'leri yönetin

Codex harness'ı kullandığınız aynı sohbetten yapılandırılmış yerel Codex Plugin'lerini incelemek veya değiştirmek istediğinizde `/codex plugins` kullanın:

```text
/codex plugins
/codex plugins list
/codex plugins disable google-calendar
/codex plugins enable google-calendar
```

`/codex plugins`, `/codex plugins list` için bir takma addır. Liste çıktısı, `plugins.entries.codex.config.codexPlugins.plugins` içindeki yapılandırılmış Plugin anahtarlarını, açık/kapalı durumunu, Codex Plugin adını ve marketplace'i gösterir.

`enable` ve `disable` yalnızca `~/.openclaw/openclaw.json` konumundaki OpenClaw yapılandırmasına yazar; `~/.codex/config.toml` dosyasını düzenlemez veya yeni Codex Plugin'leri kurmaz. Yalnızca sahip ya da `operator.admin` kapsamına sahip bir Gateway istemcisi Plugin durumunu değiştirebilir.

Yapılandırılmış bir Plugin'i etkinleştirmek, genel `codexPlugins.enabled` anahtarını da açar. Plugin, geçiş `auth_required` döndürdüğü için devre dışı yazıldıysa OpenClaw'da etkinleştirmeden önce uygulamayı Codex'te yeniden yetkilendirin.

## Yerel Plugin kurulumu nasıl çalışır?

Entegrasyonun üç ayrı durumu vardır:

- Kurulu: Codex, hedef app-server çalışma zamanında yerel Plugin paketine sahiptir.
- Etkin: OpenClaw yapılandırması, Plugin'i Codex harness turlarına sunmaya isteklidir.
- Erişilebilir: Codex app-server, Plugin'in uygulama girdilerinin etkin hesap için kullanılabilir olduğunu ve geçirilen Plugin kimliğiyle eşlenebildiğini doğrular.

Geçiş, kalıcı kurulum/uygunluk adımıdır. Planlama sırasında OpenClaw, kaynak Codex `plugin/read` ayrıntılarını okur ve kaynak Codex app-server hesap yanıtının bir ChatGPT abonelik hesabı olduğunu denetler. ChatGPT olmayan veya eksik hesap yanıtları, uygulama destekli Plugin'leri `codex_subscription_required` ile atlar. Varsayılan olarak geçiş, kaynak `app/list` çağırmaz; hesap kapısından geçen uygulama destekli kaynak Plugin'ler, kaynak uygulama erişilebilirliği doğrulaması olmadan planlanır ve hesap arama aktarım hataları `codex_account_unavailable` ile atlanır. `--verify-plugin-apps` ile geçiş, yeni bir kaynak `app/list` anlık görüntüsü alır ve yerel etkinleştirmeyi planlamadan önce sahip olunan her uygulamanın mevcut, etkin ve erişilebilir olmasını gerektirir. Bu modda hesap arama aktarım hataları kaynak uygulama envanteri kapısına düşer. Çalışma zamanı uygulama envanteri, geçişten sonraki hedef oturum erişilebilirliği denetimidir. Codex harness oturum kurulumu daha sonra etkin ve erişilebilir Plugin uygulamaları için kısıtlayıcı bir iş parçacığı uygulama yapılandırması hesaplar.

İş parçacığı uygulama yapılandırması, OpenClaw bir Codex harness oturumu kurduğunda veya eski bir Codex iş parçacığı bağlamasını değiştirdiğinde hesaplanır. Her turda yeniden hesaplanmaz; bu yüzden `/codex plugins enable` ve `/codex plugins disable` yeni Codex konuşmalarını etkiler. Geçerli konuşmanın güncellenmiş uygulama kümesini alması gerektiğinde `/new` veya `/reset` kullanın.

## V1 destek sınırı

V1 kasıtlı olarak dardır:

- Yalnızca kaynak Codex app-server envanterinde zaten kurulu olan `openai-curated` Plugin'ler geçişe uygundur.
- Uygulama destekli kaynak Plugin'ler, geçiş zamanı abonelik kapısından geçmelidir. `--verify-plugin-apps`, kaynak uygulama envanteri kapısını ekler. Abonelik kapısına takılan hesaplar ve doğrulama modunda erişilemeyen, devre dışı, eksik kaynak uygulamalar veya kaynak uygulama envanteri yenileme hataları, etkin yapılandırma girdileri yerine atlanan manuel öğeler olarak raporlanır. Okunamayan Plugin ayrıntıları, kaynak uygulama envanteri kapısından önce atlanır.
- Geçiş, `marketplaceName` ve `pluginName` ile açık Plugin kimlikleri yazar; yerel `marketplacePath` önbellek yolları yazmaz.
- `codexPlugins.enabled`, genel etkinleştirme anahtarıdır.
- `plugins["*"]` joker karakteri yoktur ve keyfi kurulum yetkisi veren bir yapılandırma anahtarı yoktur.
- Desteklenmeyen marketplace'ler, önbelleğe alınmış Plugin paketleri, hook'lar ve Codex yapılandırma dosyaları manuel inceleme için geçiş raporunda korunur.

## Uygulama envanteri ve sahiplik

OpenClaw, Codex uygulama envanterini app-server `app/list` üzerinden okur, bir saat önbelleğe alır ve eski veya eksik girdileri asenkron olarak yeniler. Önbellek yalnızca bellektedir; CLI veya Gateway yeniden başlatıldığında düşer ve OpenClaw bunu sonraki `app/list` okumasından yeniden oluşturur.

Geçiş ve çalışma zamanı ayrı önbellek anahtarları kullanır:

- Kaynak geçiş doğrulaması, kaynak Codex ana dizinini ve kaynak app-server başlatma seçeneklerini kullanır. Bu yalnızca `--verify-plugin-apps` ayarlandığında çalışır ve o planlama çalıştırması için yeni bir kaynak `app/list` dolaşımını zorlar.
- Hedef çalışma zamanı kurulumu, Codex iş parçacığı uygulama yapılandırmasını oluştururken hedef aracının Codex app-server kimliğini kullanır. Plugin etkinleştirme, bu hedef önbellek anahtarını geçersiz kılar ve ardından `plugin/install` sonrasında zorunlu olarak yeniler.

Bir Plugin uygulaması yalnızca OpenClaw onu kararlı sahiplik üzerinden geçirilen Plugin'e geri eşleyebildiğinde gösterilir:

- Plugin ayrıntısından tam uygulama kimliği
- bilinen MCP sunucu adı
- benzersiz kararlı metadata

Yalnızca görünen adla eşleşen veya belirsiz sahiplik, bir sonraki envanter yenilemesi sahipliği kanıtlayana kadar dışlanır.

## İş parçacığı uygulama yapılandırması

OpenClaw, Codex iş parçacığı için kısıtlayıcı bir `config.apps` yamasi enjekte eder: `_default` devre dışı bırakılır ve yalnızca etkin geçirilen Plugin'lerin sahip olduğu uygulamalar etkinleştirilir.

OpenClaw, uygulama düzeyi `destructive_enabled` değerini etkili genel veya Plugin başına `allow_destructive_actions` politikasından ayarlar ve yerel uygulama aracı ek açıklamalarından yıkıcı araç metadata'sını Codex'in uygulamasına bırakır. `true`, `"auto"` ve `"always"` `destructive_enabled: true` ayarlar; `false` bunu false yapar. `_default` uygulama yapılandırması `open_world_enabled: false` ile devre dışı bırakılır. Etkin Plugin uygulamaları `open_world_enabled: true` ile yayımlanır; OpenClaw ayrı bir Plugin açık dünya ilkesi düğmesi sunmaz ve Plugin başına yıkıcı araç adı engelleme listeleri tutmaz.

Araç onay modu, Plugin uygulamaları için varsayılan olarak otomatiktir; böylece yıkıcı olmayan okuma araçları aynı iş parçacığında bir onay UI'ı olmadan çalışabilir. Yıkıcı araçlar, her uygulamanın `destructive_enabled` politikası tarafından denetlenmeye devam eder.

## Yıkıcı eylem politikası

Yıkıcı Plugin elicitation'ları, geçirilmiş Codex Plugin'leri için varsayılan olarak izinlidir; güvenli olmayan şemalar ve belirsiz sahiplik ise yine kapalı başarısız olur:

- Genel `allow_destructive_actions` varsayılanı `true` değeridir.
- Plugin başına `allow_destructive_actions`, o Plugin için genel politikayı geçersiz kılar.
- Politika `false` olduğunda OpenClaw deterministik bir ret döndürür.
- Politika `true` olduğunda OpenClaw yalnızca onay yanıtına eşleyebildiği güvenli şemaları, örneğin boolean onay alanını, otomatik kabul eder.
- Politika `"auto"` olduğunda OpenClaw yıkıcı Plugin eylemlerini Codex'e sunar, ancak sahipliği kanıtlanmış MCP onay elicitation'larını Codex onay yanıtını döndürmeden önce OpenClaw Plugin onaylarına çevirir.
- Politika `"always"` olduğunda OpenClaw, `"auto"` ile aynı Codex yazma/yıkıcı kapılamasını kullanır, iş parçacığı başlamadan önce uygulama için kalıcı Codex araç başına onay geçersiz kılmalarını temizler ve yalnızca tek seferlik onay veya ret sunar; böylece kalıcı onaylar daha sonraki yazma eylemi istemlerini bastıramaz.
- Eksik Plugin kimliği, belirsiz sahiplik, eksik tur kimliği, yanlış tur kimliği veya güvenli olmayan elicitation şeması istem göstermek yerine reddeder.

## Sorun giderme

**`auth_required`:** geçiş Plugin'i kurdu, ancak uygulamalarından biri hâlâ kimlik doğrulaması gerektiriyor. Açık Plugin girdisi, yeniden yetkilendirip etkinleştirene kadar devre dışı yazılır.

**`app_inaccessible`, `app_disabled` veya `app_missing`:**
geçiş Plugin'i kurmadı; çünkü `--verify-plugin-apps` ayarlıyken kaynak Codex uygulama envanteri, sahip olunan tüm uygulamaları mevcut, etkin ve erişilebilir olarak göstermedi. Uygulamayı Codex'te yeniden yetkilendirin veya etkinleştirin, ardından geçişi `--verify-plugin-apps` ile yeniden çalıştırın.

**`app_inventory_unavailable`:** geçiş Plugin'i kurmadı; çünkü sıkı kaynak uygulama doğrulaması istendi ve kaynak Codex uygulama envanteri yenilemesi başarısız oldu. Kaynak Codex app-server erişimini düzeltin veya daha hızlı hesap kapılı planı kabul ediyorsanız `--verify-plugin-apps` olmadan yeniden deneyin.

**`codex_subscription_required`:** geçiş, uygulama destekli Plugin'i kurmadı; çünkü kaynak Codex app-server hesabı bir ChatGPT abonelik hesabıyla oturum açmamıştı. Abonelik yetkilendirmesiyle Codex uygulamasında oturum açın, ardından geçişi yeniden çalıştırın.

**`codex_account_unavailable`:** geçiş, uygulama destekli Plugin'i kurmadı; çünkü kaynak Codex app-server hesabı okunamadı. Kaynak Codex app-server kimlik doğrulamasını düzeltin veya hesap araması başarısız olduğunda uygunluğa kaynak uygulama envanterinin karar vermesini istiyorsanız `--verify-plugin-apps` ile yeniden çalıştırın.

**`marketplace_missing` veya `plugin_missing`:** hedef Codex app-server beklenen `openai-curated` marketplace'i veya Plugin'i göremiyor. Geçişi hedef çalışma zamanına karşı yeniden çalıştırın ya da Codex app-server Plugin durumunu inceleyin.

**`app_inventory_missing` veya `app_inventory_stale`:** uygulama hazır olma durumu boş veya eski bir önbellekten geldi. OpenClaw asenkron yenileme zamanlar ve sahiplik ile hazır olma durumu bilininceye kadar Plugin uygulamalarını dışlar.

**`app_ownership_ambiguous`:** uygulama envanteri yalnızca görünen ada göre eşleştiği için uygulama Codex iş parçacığına gösterilmez.

**Yapılandırma değişti ancak aracı Plugin'i göremiyor:** yapılandırılmış durumu doğrulamak için `/codex plugins list` kullanın, ardından `/new` veya `/reset` kullanın. Mevcut Codex iş parçacığı bağlamaları, OpenClaw yeni bir harness oturumu kurana veya eski bir bağlamayı değiştirene kadar başladıkları uygulama yapılandırmasını korur.

**Yıkıcı eylem reddedildi:** genel ve Plugin başına
`allow_destructive_actions` değerlerini denetleyin. Politika true, `"auto"` veya
`"always"` olsa bile, güvenli olmayan elicitation şemaları ve belirsiz Plugin kimliği yine de
kapalı şekilde başarısız olur.

## İlgili

- [Codex harness'ı](/tr/plugins/codex-harness)
- [Codex harness başvurusu](/tr/plugins/codex-harness-reference)
- [Codex harness çalışma zamanı](/tr/plugins/codex-harness-runtime)
- [Yapılandırma başvurusu](/tr/gateway/configuration-reference#codex-harness-plugin-config)
- [CLI geçişi](/tr/cli/migrate)
