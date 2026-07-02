---
read_when:
    - Codex modundaki OpenClaw ajanlarının yerel Codex Plugin'lerini kullanmasını istiyorsunuz
    - Kaynaktan kurulmuş openai-curated Codex Plugin'lerini taşıyorsunuz
    - codexPlugins, uygulama envanteri, yıkıcı eylemler veya Plugin uygulama tanılamalarıyla ilgili sorun gideriyorsunuz
summary: Codex modu OpenClaw ajanları için taşınmış yerel Codex Plugin'lerini yapılandırın
title: Yerel Codex Plugin'leri
x-i18n:
    generated_at: "2026-07-02T01:11:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 11a883137ba89936cf564a45b22c9e76097af669e2ef6c70c8c710bb2b79d3c0
    source_path: plugins/codex-native-plugins.md
    workflow: 16
---

Yerel Codex plugin desteği, Codex modundaki bir OpenClaw agent'ının OpenClaw dönüşünü işleyen aynı Codex thread'i içinde Codex app-server'ın kendi app ve plugin yeteneklerini kullanmasını sağlar.

OpenClaw, Codex plugin'lerini yapay `codex_plugin_*` OpenClaw dinamik araçlarına çevirmez. Plugin çağrıları yerel Codex transcript'inde kalır ve app destekli MCP yürütmesinin sahibi Codex app-server'dır.

Bu sayfayı, temel [Codex harness](/tr/plugins/codex-harness) çalıştıktan sonra kullanın.

## Gereksinimler

- Seçilen OpenClaw agent runtime'ı yerel Codex harness olmalıdır.
- `plugins.entries.codex.enabled` true olmalıdır.
- `plugins.entries.codex.config.codexPlugins.enabled` true olmalıdır.
- V1 yalnızca migration'ın kaynak Codex home içinde kaynak olarak kurulmuş gözlemlediği `openai-curated` plugin'lerini destekler.
- Hedef Codex app-server'ın beklenen marketplace, plugin ve app envanterini görebilmesi gerekir.

`codexPlugins`; OpenClaw çalıştırmaları, normal OpenAI provider çalıştırmaları, ACP conversation bağlamaları veya diğer harness'lar üzerinde etkili değildir, çünkü bu yollar yerel `apps` config ile Codex app-server thread'leri oluşturmaz.

OpenAI tarafındaki Codex erişimi, app kullanılabilirliği ve workspace app/plugin denetimleri, oturum açılmış Codex hesabından gelir. OpenAI hesabı ve admin modeli için bkz. [ChatGPT planınızla Codex kullanma](https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan).

## Hızlı başlangıç

Kaynak Codex home'dan migration'ı önizleyin:

```bash
openclaw migrate codex --dry-run
```

Migration'ın yerel plugin etkinleştirmesini planlamadan önce kaynak app erişilebilirliğini denetlemesini istediğinizde katı kaynak app doğrulamasını kullanın:

```bash
openclaw migrate codex --dry-run --verify-plugin-apps
```

Plan doğru göründüğünde migration'ı uygulayın:

```bash
openclaw migrate apply codex --yes
```

Migration, uygun plugin'ler için açık `codexPlugins` girdileri yazar ve seçilen plugin'ler için Codex app-server `plugin/install` çağrısı yapar. Tipik bir migration uygulanmış config şöyle görünür:

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

`codexPlugins` değiştirildikten sonra yeni Codex conversation'ları güncellenmiş app kümesini otomatik olarak alır. Geçerli conversation'ı yenilemek için `/new` veya `/reset` kullanın. Plugin etkinleştirme veya devre dışı bırakma değişiklikleri için gateway'i yeniden başlatmak gerekmez.

## Chat'ten plugin'leri yönetin

Codex harness'ı çalıştırdığınız aynı chat'ten yapılandırılmış yerel Codex plugin'lerini incelemek veya değiştirmek istediğinizde `/codex plugins` kullanın:

```text
/codex plugins
/codex plugins list
/codex plugins disable google-calendar
/codex plugins enable google-calendar
```

`/codex plugins`, `/codex plugins list` için bir alias'tır. Liste çıktısı, `plugins.entries.codex.config.codexPlugins.plugins` içinden yapılandırılmış plugin anahtarlarını, açık/kapalı durumunu, Codex plugin adını ve marketplace'i gösterir.

`enable` ve `disable` yalnızca `~/.openclaw/openclaw.json` konumundaki OpenClaw config'e yazar; `~/.codex/config.toml` dosyasını düzenlemez veya yeni Codex plugin'leri kurmaz. Plugin durumunu yalnızca owner veya `operator.admin` scope'una sahip bir gateway client değiştirebilir.

Yapılandırılmış bir plugin'i etkinleştirmek, global `codexPlugins.enabled` anahtarını da açar. Plugin, migration `auth_required` döndürdüğü için devre dışı yazıldıysa, OpenClaw'da etkinleştirmeden önce app'i Codex'te yeniden yetkilendirin.

## Yerel plugin kurulumu nasıl çalışır

Entegrasyonun üç ayrı durumu vardır:

- Kurulu: Codex, hedef app-server runtime'ında yerel plugin bundle'a sahiptir.
- Etkin: OpenClaw config, plugin'i Codex harness dönüşleri için kullanılabilir yapmaya isteklidir.
- Erişilebilir: Codex app-server, plugin'in app girdilerinin etkin hesap için kullanılabilir olduğunu ve migration uygulanmış plugin kimliğine eşlenebildiğini onaylar.

Migration, kalıcı kurulum/uygunluk adımıdır. Planlama sırasında OpenClaw, kaynak Codex `plugin/read` ayrıntılarını okur ve kaynak Codex app-server hesap yanıtının bir ChatGPT abonelik hesabı olduğunu denetler. ChatGPT olmayan veya eksik hesap yanıtları, app destekli plugin'leri `codex_subscription_required` ile atlar. Varsayılan olarak migration kaynak `app/list` çağrısı yapmaz; hesap geçidini geçen app destekli kaynak plugin'ler, kaynak app erişilebilirlik doğrulaması olmadan planlanır ve hesap arama transport hataları `codex_account_unavailable` ile atlanır. `--verify-plugin-apps` ile migration yeni bir kaynak `app/list` anlık görüntüsü alır ve yerel etkinleştirmeyi planlamadan önce sahip olunan her app'in mevcut, etkin ve erişilebilir olmasını gerektirir. Bu modda, hesap arama transport hataları kaynak app envanteri geçidine düşer. Runtime app envanteri, migration sonrası hedef oturum erişilebilirlik denetimidir. Ardından Codex harness oturum kurulumu, etkin ve erişilebilir plugin app'leri için kısıtlayıcı bir thread app config hesaplar.

Thread app config, OpenClaw bir Codex harness oturumu kurduğunda veya eski bir Codex thread bağlamasını değiştirdiğinde hesaplanır. Her dönüşte yeniden hesaplanmaz; bu nedenle `/codex plugins enable` ve `/codex plugins disable` yeni Codex conversation'larını etkiler. Geçerli conversation'ın güncellenmiş app kümesini alması gerektiğinde `/new` veya `/reset` kullanın.

## V1 destek sınırı

V1 bilinçli olarak dardır:

- Yalnızca kaynak Codex app-server envanterinde zaten kurulu olan `openai-curated` plugin'leri migration'a uygundur.
- App destekli kaynak plugin'ler, migration zamanındaki abonelik geçidini geçmelidir. `--verify-plugin-apps` kaynak app envanteri geçidini ekler. Abonelik geçidine takılan hesaplar ve doğrulama modunda erişilemeyen, devre dışı, eksik kaynak app'ler veya kaynak app envanteri yenileme hataları, etkin config girdileri yerine atlanmış manuel öğeler olarak raporlanır. Okunamayan plugin ayrıntıları, kaynak app envanteri geçidinden önce atlanır.
- Migration, `marketplaceName` ve `pluginName` ile açık plugin kimlikleri yazar; yerel `marketplacePath` cache yolları yazmaz.
- `codexPlugins.enabled` global etkinleştirme anahtarıdır.
- `plugins["*"]` wildcard'ı ve keyfi kurulum yetkisi veren bir config anahtarı yoktur.
- Desteklenmeyen marketplace'ler, cache'lenmiş plugin bundle'ları, hook'lar ve Codex config dosyaları manuel inceleme için migration raporunda korunur.

## App envanteri ve sahiplik

OpenClaw, Codex app envanterini app-server `app/list` üzerinden okur, bir saat cache'ler ve eski veya eksik girdileri asenkron olarak yeniler. Cache yalnızca bellektedir; CLI veya gateway yeniden başlatıldığında düşer ve OpenClaw bunu bir sonraki `app/list` okumasından yeniden oluşturur.

Migration ve runtime ayrı cache anahtarları kullanır:

- Kaynak migration doğrulaması, kaynak Codex home'u ve kaynak app-server başlatma seçeneklerini kullanır. Bu yalnızca `--verify-plugin-apps` ayarlandığında çalışır ve o planlama çalıştırması için yeni bir kaynak `app/list` dolaşımını zorunlu kılar.
- Hedef runtime kurulumu, Codex thread app config'i oluştururken hedef agent'ın Codex app-server kimliğini kullanır. Plugin etkinleştirme, bu hedef cache anahtarını geçersiz kılar ve ardından `plugin/install` sonrasında onu zorla yeniler.

Bir plugin app'i yalnızca OpenClaw onu kararlı sahiplik üzerinden migration uygulanmış plugin'e geri eşleyebildiğinde gösterilir:

- plugin ayrıntısından tam app id
- bilinen MCP server adı
- benzersiz kararlı metadata

Yalnızca görünen adla eşleşen veya belirsiz sahiplik, bir sonraki envanter yenilemesi sahipliği kanıtlayana kadar hariç tutulur.

## Thread app config

OpenClaw, Codex thread'i için kısıtlayıcı bir `config.apps` patch'i enjekte eder: `_default` devre dışıdır ve yalnızca etkin migration uygulanmış plugin'lerin sahibi olduğu app'ler etkinleştirilir.

OpenClaw, app düzeyi `destructive_enabled` değerini etkili global veya plugin başına `allow_destructive_actions` politikasından ayarlar ve Codex'in yerel app tool annotation'larından destructive tool metadata'sını uygulamasına izin verir. `true`, `"auto"` ve `"ask"` `destructive_enabled: true` olarak ayarlar; `false` bunu false yapar. `_default` app config'i `open_world_enabled: false` ile devre dışı bırakılır. Etkin plugin app'leri `open_world_enabled: true` ile yayımlanır; OpenClaw ayrı bir plugin open-world policy knob'u sunmaz ve plugin başına destructive tool-name deny list'leri tutmaz.

Tool approval modu, plugin app'leri için varsayılan olarak otomatiktir; böylece destructive olmayan okuma araçları aynı thread approval UI olmadan çalışabilir. Destructive araçlar, her app'in `destructive_enabled` politikası tarafından denetlenmeye devam eder.

## Destructive action policy

Destructive plugin elicitation'larına migration uygulanmış Codex plugin'leri için varsayılan olarak izin verilir; güvenli olmayan schema'lar ve belirsiz sahiplik ise yine fail closed olur:

- Global `allow_destructive_actions` varsayılan olarak `true` olur.
- Plugin başına `allow_destructive_actions`, o plugin için global politikayı geçersiz kılar.
- Politika `false` olduğunda OpenClaw deterministik bir ret döndürür.
- Politika `true` olduğunda OpenClaw yalnızca boolean approve field gibi bir approval response'a eşleyebildiği güvenli schema'ları otomatik kabul eder.
- Politika `"auto"` olduğunda OpenClaw, destructive plugin action'larını Codex'e gösterir ancak sahipliği kanıtlanmış MCP approval elicitation'larını Codex approval response'u döndürmeden önce OpenClaw plugin approval'larına dönüştürür.
- Politika `"ask"` olduğunda OpenClaw `"auto"` ile aynı Codex yazma/destructive gating'i kullanır, thread başlamadan önce app için kalıcı Codex araç başına approval override'larını temizler ve kalıcı approval'ların daha sonraki write-action prompt'larını bastıramaması için yalnızca tek seferlik approval veya denial sunar.
- `"ask"` kullanan her kabul edilmiş app için OpenClaw, Codex'in approval elicitation'larını OpenClaw'a göndermesi amacıyla o app için Codex'in human approvals reviewer'ını seçer. Diğer app'ler ve app olmayan thread approval'ları yapılandırılmış reviewer ve politikalarını korur.
- Eksik plugin kimliği, belirsiz sahiplik, eksik turn id, yanlış turn id veya güvenli olmayan elicitation schema'sı, prompt göstermek yerine reddeder.

## Sorun giderme

**`auth_required`:** migration plugin'i kurdu, ancak app'lerinden birinin hâlâ authentication'a ihtiyacı var. Açık plugin girdisi, siz yeniden yetkilendirip etkinleştirene kadar devre dışı yazılır.

**`app_inaccessible`, `app_disabled` veya `app_missing`:**
migration plugin'i kurmadı çünkü kaynak Codex app envanteri, `--verify-plugin-apps` ayarlıyken sahip olunan tüm app'leri mevcut, etkin ve erişilebilir olarak göstermedi. App'i Codex'te yeniden yetkilendirin veya etkinleştirin, ardından migration'ı `--verify-plugin-apps` ile yeniden çalıştırın.

**`app_inventory_unavailable`:** migration plugin'i kurmadı çünkü katı kaynak app doğrulaması istendi ve kaynak Codex app envanteri yenilemesi başarısız oldu. Kaynak Codex app-server erişimini düzeltin veya daha hızlı hesap geçitli planı kabul ediyorsanız `--verify-plugin-apps` olmadan yeniden deneyin.

**`codex_subscription_required`:** migration app destekli plugin'i kurmadı çünkü kaynak Codex app-server hesabı bir ChatGPT abonelik hesabıyla oturum açmamıştı. Codex app'te abonelik auth ile oturum açın, ardından migration'ı yeniden çalıştırın.

**`codex_account_unavailable`:** migration app destekli plugin'i kurmadı çünkü kaynak Codex app-server hesabı okunamadı. Kaynak Codex app-server auth'unu düzeltin veya hesap araması başarısız olduğunda uygunluğu kaynak app envanterinin belirlemesini istiyorsanız `--verify-plugin-apps` ile yeniden çalıştırın.

**`marketplace_missing` veya `plugin_missing`:** hedef Codex app-server, beklenen `openai-curated` marketplace'i veya plugin'i göremiyor. Migration'ı hedef runtime'a karşı yeniden çalıştırın veya Codex app-server plugin durumunu inceleyin.

**`app_inventory_missing` veya `app_inventory_stale`:** app readiness boş veya eski bir cache'ten geldi. OpenClaw asenkron yenileme zamanlar ve sahiplik ile readiness bilinene kadar plugin app'lerini hariç tutar.

**`app_ownership_ambiguous`:** app envanteri yalnızca görünen ada göre eşleşti, bu yüzden app Codex thread'ine gösterilmez.

**Yapılandırma değişti ancak ajan Plugin öğesini göremiyor:** yapılandırılmış durumu doğrulamak için `/codex plugins
list` kullanın, ardından `/new` veya `/reset` kullanın. Mevcut
Codex iş parçacığı bağlamaları, OpenClaw yeni bir harness oturumu kurana veya güncelliğini yitirmiş bir bağlamayı değiştirene kadar başladıkları uygulama yapılandırmasını korur.

**Yıkıcı eylem reddedilir:** genel ve Plugin başına
`allow_destructive_actions` değerlerini denetleyin. İlke true, `"auto"` veya
`"ask"` olsa bile, güvenli olmayan elicitation şemaları ve belirsiz Plugin kimliği yine de kapalı varsayımla başarısız olur.

## İlgili

- [Codex harness](/tr/plugins/codex-harness)
- [Codex harness referansı](/tr/plugins/codex-harness-reference)
- [Codex harness çalışma zamanı](/tr/plugins/codex-harness-runtime)
- [Yapılandırma referansı](/tr/gateway/configuration-reference#codex-harness-plugin-config)
- [CLI'yı taşı](/tr/cli/migrate)
