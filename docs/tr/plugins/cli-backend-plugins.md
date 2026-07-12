---
read_when:
    - Yerel bir yapay zekâ CLI arka uç Plugin'i oluşturuyorsunuz
    - acme-cli/model gibi model referansları için bir arka uç kaydetmek istiyorsunuz
    - Üçüncü taraf bir CLI'yi OpenClaw'ın metin yedek çalıştırıcısına eşlemeniz gerekir
sidebarTitle: CLI backend plugins
summary: Yerel bir yapay zekâ CLI arka ucu kaydeden bir Plugin oluşturun
title: CLI arka uç Pluginleri oluşturma
x-i18n:
    generated_at: "2026-07-12T12:27:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6448cdac02a03e5fdf0d802a54189998d97c08769b1b85c8d9963301fa2c5b79
    source_path: plugins/cli-backend-plugins.md
    workflow: 16
---

CLI arka uç pluginleri, OpenClaw'ın metin çıkarımı arka ucu olarak yerel bir yapay zekâ CLI'ını çağırmasını sağlar. Arka uç, model referanslarında bir sağlayıcı öneki olarak görünür:

```text
acme-cli/acme-large
```

Üst sistem entegrasyonu zaten yerel bir komut olarak sunuluyorsa, CLI yerel oturum açma durumunu yönetiyorsa veya API sağlayıcıları kullanılamadığında yedek olarak bir CLI arka ucu kullanın.

<Info>
  Üst sistem hizmeti normal bir HTTP model API'si sunuyorsa bunun yerine bir
  [sağlayıcı plugini](/tr/plugins/sdk-provider-plugins) yazın. Üst sistem çalışma
  zamanı eksiksiz aracı oturumlarını, araç olaylarını, Compaction işlemini veya
  arka plan görev durumunu yönetiyorsa bir [aracı donanımı](/tr/plugins/sdk-agent-harness) kullanın.
</Info>

## Pluginin yönettiği alanlar

Bir CLI arka uç plugininin üç sözleşmesi vardır:

| Sözleşme             | Dosya                  | Amaç                                                      |
| -------------------- | ---------------------- | --------------------------------------------------------- |
| Paket giriş noktası  | `package.json`         | OpenClaw'ı plugin çalışma zamanı modülüne yönlendirir      |
| Manifest sahipliği   | `openclaw.plugin.json` | Çalışma zamanı yüklenmeden önce arka uç kimliğini bildirir |
| Çalışma zamanı kaydı | `index.ts`             | Komut varsayılanlarıyla `api.registerCliBackend(...)` çağrısı yapar |

Manifest, keşif meta verisidir: CLI'ı çalıştırmaz veya çalışma zamanı davranışını kaydetmez. Çalışma zamanı davranışı, plugin giriş noktası `api.registerCliBackend(...)` çağrısı yaptığında başlar.

## En küçük arka uç plugini

<Steps>
  <Step title="Paket meta verilerini oluşturun">
    ```json package.json
    {
      "name": "@acme/openclaw-acme-cli",
      "version": "1.0.0",
      "type": "module",
      "openclaw": {
        "extensions": ["./index.ts"],
        "compat": {
          "pluginApi": ">=2026.3.24-beta.2",
          "minGatewayVersion": "2026.3.24-beta.2"
        },
        "build": {
          "openclawVersion": "2026.3.24-beta.2",
          "pluginSdkVersion": "2026.3.24-beta.2"
        }
      },
      "dependencies": {
        "openclaw": "^2026.3.24"
      },
      "devDependencies": {
        "typescript": "^5.9.0"
      }
    }
    ```

    Yayımlanan paketler, derlenmiş JavaScript çalışma zamanı dosyalarını içermelidir. Kaynak giriş noktanız `./src/index.ts` ise derlenmiş JavaScript eşini gösteren `openclaw.runtimeExtensions` alanını ekleyin. Bkz. [Giriş noktaları](/tr/plugins/sdk-entrypoints).

  </Step>

  <Step title="Arka uç sahipliğini bildirin">
    ```json openclaw.plugin.json
    {
      "id": "acme-cli",
      "name": "Acme CLI",
      "description": "Run Acme's local AI CLI through OpenClaw",
      "cliBackends": ["acme-cli"],
      "setup": {
        "cliBackends": ["acme-cli"],
        "requiresRuntime": false
      },
      "activation": {
        "onStartup": false
      },
      "configSchema": {
        "type": "object",
        "additionalProperties": false
      }
    }
    ```

    `cliBackends`, çalışma zamanı sahipliği listesidir; yapılandırma veya model seçimi `acme-cli/...` ifadesinden bahsettiğinde OpenClaw'ın plugini otomatik olarak yüklemesini sağlar.

    `setup.cliBackends`, önce tanımlayıcı yaklaşımını kullanan kurulum yüzeyidir. Model keşfinin, ilk yapılandırmanın veya durum bilgisinin plugin çalışma zamanı yüklenmeden arka ucu tanıması gerekiyorsa bunu ekleyin. Yalnızca bu statik tanımlayıcılar kurulum için yeterliyse `requiresRuntime: false` kullanın.

  </Step>

  <Step title="Arka ucu kaydedin">
    ```typescript index.ts
    import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
    import {
      CLI_FRESH_WATCHDOG_DEFAULTS,
      CLI_RESUME_WATCHDOG_DEFAULTS,
      type CliBackendPlugin,
    } from "openclaw/plugin-sdk/cli-backend";

    function buildAcmeCliBackend(): CliBackendPlugin {
      return {
        id: "acme-cli",
        liveTest: {
          defaultModelRef: "acme-cli/acme-large",
          defaultImageProbe: false,
          defaultMcpProbe: false,
          docker: {
            npmPackage: "@acme/acme-cli",
            binaryName: "acme",
          },
        },
        config: {
          command: "acme",
          args: ["chat", "--json"],
          output: "json",
          input: "stdin",
          modelArg: "--model",
          sessionArg: "--session",
          sessionMode: "existing",
          sessionIdFields: ["session_id", "conversation_id"],
          systemPromptFileArg: "--system-file",
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
          reliability: {
            watchdog: {
              fresh: { ...CLI_FRESH_WATCHDOG_DEFAULTS },
              resume: { ...CLI_RESUME_WATCHDOG_DEFAULTS },
            },
          },
          serialize: true,
        },
      };
    }

    export default definePluginEntry({
      id: "acme-cli",
      name: "Acme CLI",
      description: "Run Acme's local AI CLI through OpenClaw",
      register(api) {
        api.registerCliBackend(buildAcmeCliBackend());
      },
    });
    ```

    Arka uç kimliği, manifestteki `cliBackends` girdisiyle eşleşmelidir. Kaydedilen `config` yalnızca varsayılandır; `agents.defaults.cliBackends.acme-cli` altındaki kullanıcı yapılandırması çalışma zamanında bunun üzerine birleştirilir.

  </Step>
</Steps>

## Yapılandırma biçimi

`CliBackendConfig`, OpenClaw'ın CLI'ı nasıl başlatıp ayrıştırması gerektiğini açıklar:

| Alan                                                      | Kullanım                                                                           |
| --------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `command`                                                 | İkili dosya adı veya mutlak komut yolu                                              |
| `args`                                                    | Yeni çalıştırmalar için temel argv                                                  |
| `resumeArgs`                                              | Sürdürülen oturumlar için alternatif argv; `{sessionId}` destekler                 |
| `output` / `resumeOutput`                                 | Ayrıştırıcı: `json`, `jsonl` veya `text`                                           |
| `jsonlDialect`                                            | JSONL olay lehçesi: `claude-stream-json` veya `gemini-stream-json`                 |
| `liveSession`                                             | Uzun ömürlü CLI işlemi modu (`claude-stdio`)                                        |
| `input`                                                   | İstem aktarımı: `arg` veya `stdin`                                                  |
| `maxPromptArgChars`                                       | stdin'e geri dönmeden önce `arg` modu için en fazla istem uzunluğu                 |
| `env` / `clearEnv`                                        | Eklenecek ek ortam değişkenleri veya başlatmadan önce kaldırılacak adlar            |
| `modelArg`                                                | Model kimliğinden önce kullanılan bayrak                                            |
| `modelAliases`                                            | OpenClaw model kimliklerini CLI'ın yerel kimlikleriyle eşleştirir                   |
| `sessionArg` / `sessionArgs`                              | Oturum kimliğinin nasıl geçirileceği                                                |
| `sessionMode`                                             | `always`, `existing` veya `none`                                                    |
| `sessionIdFields`                                         | OpenClaw'ın CLI çıktısından okuduğu JSON alanları                                   |
| `systemPromptArg` / `systemPromptFileArg`                 | Sistem istemi aktarımı                                                              |
| `systemPromptFileConfigArg` / `systemPromptFileConfigKey` | Sistem istemi dosyası için yapılandırma geçersiz kılma aktarımı (örneğin `-c`)      |
| `systemPromptMode`                                        | `append` veya `replace`                                                             |
| `systemPromptWhen`                                        | `first`, `always` veya `never`                                                      |
| `imageArg` / `imageMode`                                  | Görsel yolu bayrağı ve birden fazla görselin nasıl geçirileceği (`repeat` veya `list`) |
| `imagePathScope`                                          | Aktarım öncesinde hazırlanmış görsel dosyalarının bulunduğu yer: `temp` veya `workspace` |
| `serialize`                                               | Aynı arka uçtaki çalıştırmaları sıralı tutar                                        |
| `reseedFromRawTranscriptWhenUncompacted`                  | Güvenli oturum sıfırlamaları için Compaction öncesinde sınırlı ham döküm yeniden beslemesini etkinleştirir |
| `reliability.outputLimits`                                | Tek bir canlı CLI turu için tutulan azami ham JSONL karakter/satır sayısı (canlı oturum arka uçları) |
| `reliability.watchdog`                                    | Yeni ve sürdürülen çalıştırmalar için ayrı ayrı çıktısız zaman aşımı ayarı          |

CLI ile eşleşen en küçük statik yapılandırmayı tercih edin. Plugin geri çağrılarını yalnızca gerçekten arka uca ait davranışlar için ekleyin.

## Gelişmiş arka uç kancaları

`CliBackendPlugin` ayrıca şunları tanımlayabilir:

| Kanca                              | Kullanım                                                                    |
| ---------------------------------- | --------------------------------------------------------------------------- |
| `normalizeConfig(config, context)` | Birleştirmeden sonra eski kullanıcı yapılandırmasını yeniden yazar          |
| `resolveExecutionArgs(ctx)`        | Düşünme yoğunluğu veya yan soru yalıtımı gibi istek kapsamlı bayraklar ekler |
| `prepareExecution(ctx)`            | Başlatmadan önce geçici kimlik doğrulama veya yapılandırma köprüleri oluşturur |
| `transformSystemPrompt(ctx)`       | Son bir CLI'a özgü sistem istemi dönüşümü uygular                            |
| `textTransforms`                   | Çift yönlü istem/çıktı değiştirmeleri                                       |
| `defaultAuthProfileId`             | Belirli bir OpenClaw kimlik doğrulama profilini tercih eder                  |
| `authEpochMode`                    | Kimlik doğrulama değişikliklerinin saklanan CLI oturumlarını nasıl geçersiz kılacağını belirler |
| `nativeToolMode`                   | Yerel araçların bulunmadığını, her zaman açık olduğunu veya ana makine tarafından seçilebildiğini bildirir |
| `sideQuestionToolMode`             | `/btw` yan soruları için devre dışı bırakılan yerel araçları bildirir        |
| `bundleMcp` / `bundleMcpMode`      | OpenClaw'ın loopback MCP araç köprüsünü etkinleştirir                        |
| `ownsNativeCompaction`             | Arka uç kendi Compaction işlemini yönetir; OpenClaw bunu arka uca bırakır    |
| `runtimeArtifact`                  | Bir betik başlatıcısını eksiksiz paketlenmiş paket ağacıyla sınırlar         |

Bu kancaları sağlayıcının yönetiminde tutun. Davranış bir arka uç kancasıyla ifade edilebiliyorsa çekirdeğe CLI'a özgü dallar eklemeyin.

`runtimeArtifact` plugin tarafından yönetilir ve kullanıcı tarafından geçersiz kılınamaz. Yalnızca canlı bir çıkarım turu doğrulanmış kurulum yetkisi oluşturduğunda veya bunu yeniden doğruladığında kullanılır; normal CLI çalıştırmaları bunu gerektirmez. Bu bildirime sahip olmayan bir arka uç, doğrulanmış CLI kurulum yetkisi oluşturamaz. Bir `bundled-package-tree` bildirimi, tam `package.json` sahibini adlandırır ve paket giriş noktasının komut olmasını gerektirir. OpenClaw, iç içe bağımlılıklar dâhil olmak üzere sınırlandırılmış eksiksiz kurulu paket ağacının karmasını hesaplar ve başka yere yönlendiren sembolik bağlantılar, bildirilen paketin dışındaki başlatıcılar, gerekli harici bağımlılık bildirimleri, aşırı büyük ağaçlar ve bilinmeyen betikler için güvenli biçimde işlemi reddeder. Bunu yalnızca söz konusu ağaç eksiksiz çıkarım uygulamasını içeriyorsa bildirin; isteğe bağlı araç entegrasyonları harici bir uygulama grafiğini güvenli hâle getirmez.

Aynı arka uç kendi kendine yeterli yerel bir yürütülebilir dosya da sağlıyorsa bunun standart temel adlarını `nativeExecutableNames` içinde listeleyin. Kullanıcı arka uç komutunu geçersiz kılsa bile diğer yerel komutlar doğrulanmamış olarak kalır.

`ctx.executionMode`, normal turlar için `"agent"`, geçici `/btw` çağrıları için
`"side-question"` değeridir. CLI, BTW için yerel araçları, oturum kalıcılığını
veya sürdürme davranışını devre dışı bırakmak gibi farklı tek seferlik bayraklara
ihtiyaç duyduğunda bunu kullanın. Bir arka uç normalde `nativeToolMode:
"always-on"` değerine sahipse ancak yan soru argv'si bu araçları güvenilir biçimde
devre dışı bırakıyorsa `sideQuestionToolMode: "disabled"` değerini de ayarlayın;
aksi takdirde BTW araçsız bir CLI çalıştırması gerektirdiğinde OpenClaw güvenli
biçimde başarısız olur.

`nativeToolMode: "selectable"` değerini yalnızca `resolveExecutionArgs`, tek bir
çalıştırma için arka uca özgü tüm araçları devre dışı bırakabiliyorsa ayarlayın.
Bu kısıtlı çalıştırmalarda `ctx.toolAvailability.native` boş bir demettir ve
`ctx.toolAvailability.mcp`, ana bilgisayar tarafından yalıtılmış tam MCP izin
listesidir. Kanca, çakışan araç bayraklarını değiştirmeli ve her iki değeri de
uygulayan argv'yi döndürmelidir; OpenClaw bunu son yeni veya sürdürme argv'siyle
bir kez çağırır ve arka uç kısıtlamayı uygulayamadığında güvenli biçimde başarısız
olur. Bu bağlamdaki MCP adlarının otomatik olarak onaylanması yalnızca ana
bilgisayarın oluşturulan MCP yapılandırmasını zaten bu sunucular ve araçlarla
sınırlandırmış olması nedeniyle güvenlidir.

### `ownsNativeCompaction`: OpenClaw Compaction özelliğini devre dışı bırakma

Arka ucunuz **kendi** dökümünü sıkıştıran bir ajan çalıştırıyorsa OpenClaw'ın
koruyucu özetleyicisinin bu oturumlarda hiçbir zaman çalışmaması için
`ownsNativeCompaction: true` değerini ayarlayın; CLI Compaction yaşam döngüsü
işlem yapmadan döner ve tur devam eder. `claude-cli`, Claude Code herhangi bir
çalıştırma düzeneği uç noktası olmadan dahili olarak sıkıştırma yaptığı için bunu
bildirir. Codex gibi yerel çalıştırma düzeneği oturumları ise bunun yerine
çalıştırma düzeneklerinin Compaction uç noktasına yönlendirilmeye devam eder.

**Bunu yalnızca aşağıdakilerin tümü geçerliyse bildirin**; aksi takdirde ertelenmiş
ve bütçeyi aşmış bir oturum bütçeyi aşmaya devam edebilir veya eskimeye
başlayabilir (OpenClaw artık onu kurtarmaz):

- arka uç, penceresine yaklaştıkça kendi dökümünü güvenilir biçimde sıkıştırır
  veya sınırlar;
- sıkıştırılmış durumun turlar arasında korunması için sürdürülebilir bir oturumu
  kalıcılaştırır (örneğin `--resume` / `--session-id`);
- yerel çalıştırma düzeneği Compaction oturumu değildir; eşleşen `agentHarnessId`
  oturumları bunun yerine çalıştırma düzeneği uç noktasına yönlendirilir.

## MCP araç köprüsü

CLI arka uçları varsayılan olarak OpenClaw araçlarını almaz. CLI bir MCP
yapılandırmasını kullanabiliyorsa bunu açıkça etkinleştirin:

```typescript
return {
  id: "acme-cli",
  bundleMcp: true,
  bundleMcpMode: "codex-config-overrides",
  config: {
    command: "acme",
    args: ["chat", "--json"],
    output: "json",
  },
};
```

Desteklenen köprü modları:

| Mod                      | Kullanım                                                            |
| ------------------------ | ------------------------------------------------------------------- |
| `claude-config-file`     | Bir MCP yapılandırma dosyasını kabul eden CLI'lar                    |
| `codex-config-overrides` | argv üzerinde yapılandırma geçersiz kılmalarını kabul eden CLI'lar  |
| `gemini-system-settings` | MCP ayarlarını sistem ayarları dizininden okuyan CLI'lar             |

Köprüyü yalnızca CLI gerçekten kullanabiliyorsa etkinleştirin. CLI'ın devre dışı
bırakılamayan kendi yerleşik araç katmanı varsa OpenClaw'ın bir çağıran yerel
araçların bulunmamasını gerektirdiğinde güvenli biçimde başarısız olabilmesi için
`nativeToolMode: "always-on"` değerini ayarlayın. Her yerel aracı çalıştırma
başına devre dışı bırakabiliyorsa yukarıdaki `resolveExecutionArgs` sözleşmesiyle
`"selectable"` değerini kullanın.

## Kullanıcı yapılandırması

Kullanıcılar herhangi bir arka uç varsayılanını geçersiz kılabilir:

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "acme-cli": {
          command: "/opt/acme/bin/acme",
          args: ["chat", "--json", "--profile", "work"],
          modelAliases: {
            large: "acme-large-2026",
          },
        },
      },
      model: {
        primary: "openai/gpt-5.6-sol",
        fallbacks: ["acme-cli/large"],
      },
    },
  },
}
```

Kullanıcıların ihtiyaç duyma olasılığı bulunan asgari geçersiz kılmayı
belgeleyin; ikili dosya `PATH` dışında olduğunda bu genellikle yalnızca
`command` olur.

## Doğrulama

Paketle gelen pluginler için oluşturucu ve kurulum kaydı çevresine odaklanmış
bir test ekleyin, ardından pluginin hedeflenmiş test hattını çalıştırın:

```bash
pnpm test extensions/acme-cli
```

Yerel veya kurulu pluginler için keşfi ve gerçek bir model çalıştırmasını
doğrulayın:

```bash
openclaw plugins inspect acme-cli --runtime --json
openclaw agent --message "reply exactly: backend ok" --model acme-cli/acme-large
```

Arka uç görüntüleri veya MCP'yi destekliyorsa bu yolları gerçek CLI ile
kanıtlayan canlı bir duman testi ekleyin. İstem, görüntü, MCP veya oturum
sürdürme davranışı için statik incelemeye güvenmeyin.

## Kontrol listesi

<Check>`package.json`, yayımlanan paketler için `openclaw.extensions` ve derlenmiş çalışma zamanı girdileri içeriyor</Check>
<Check>`openclaw.plugin.json`, `cliBackends` ve bilinçli olarak seçilmiş `activation.onStartup` değerini bildiriyor</Check>
<Check>Kurulum/model keşfinin arka ucu soğuk durumda görmesi gerekiyorsa `setup.cliBackends` mevcut</Check>
<Check>`api.registerCliBackend(...)`, manifest ile aynı arka uç kimliğini kullanıyor</Check>
<Check>`agents.defaults.cliBackends.<id>` altındaki kullanıcı geçersiz kılmaları hâlâ öncelikli</Check>
<Check>Oturum, sistem istemi, görüntü ve çıktı ayrıştırıcı ayarları gerçek CLI sözleşmesiyle eşleşiyor</Check>
<Check>Hedeflenmiş testler ve en az bir canlı CLI duman testi arka uç yolunu kanıtlıyor</Check>

## İlgili

- [CLI arka uçları](/tr/gateway/cli-backends) - kullanıcı yapılandırması ve çalışma zamanı davranışı
- [Plugin oluşturma](/tr/plugins/building-plugins) - paket ve manifest temelleri
- [Plugin SDK'ya genel bakış](/tr/plugins/sdk-overview) - kayıt API'si başvurusu
- [Plugin manifesti](/tr/plugins/manifest) - `cliBackends` ve kurulum tanımlayıcıları
- [Ajan çalıştırma düzeneği](/tr/plugins/sdk-agent-harness) - tam harici ajan çalışma zamanları
