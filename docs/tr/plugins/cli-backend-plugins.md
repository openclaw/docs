---
read_when:
    - Yerel bir yapay zeka CLI arka uç Plugin oluşturuyorsunuz
    - acme-cli/model gibi model referansları için bir arka uç kaydetmek istiyorsunuz
    - Üçüncü taraf bir CLI'yi OpenClaw'ın metin yedek çalıştırıcısına eşlemeniz gerekir
sidebarTitle: CLI backend plugins
summary: Yerel bir AI CLI arka ucu kaydeden bir Plugin oluşturun
title: CLI arka uç Plugin'leri oluşturma
x-i18n:
    generated_at: "2026-06-28T00:50:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d91c2b712a821005303c6cbb0ccbd8f263c8c30c5dbd6ed05b842c47c63f0542
    source_path: plugins/cli-backend-plugins.md
    workflow: 16
---

CLI arka uç Plugin'leri, OpenClaw'ın metin çıkarımı arka ucu olarak yerel bir AI CLI'ı çağırmasını sağlar. Arka uç, model referanslarında sağlayıcı ön eki olarak görünür:

```text
acme-cli/acme-large
```

Yukarı akış entegrasyonu zaten yerel bir komut olarak sunuluyorsa, CLI yerel oturum açma durumuna sahipse veya API sağlayıcıları kullanılamadığında CLI kullanışlı bir yedekse CLI arka ucu kullanın.

<Info>
  Yukarı akış hizmeti normal bir HTTP model API'si sunuyorsa bunun yerine bir
  [sağlayıcı Plugin'i](/tr/plugins/sdk-provider-plugins) yazın. Yukarı akış
  çalışma zamanı tam aracı oturumlarına, araç olaylarına, compaction'a veya arka plan
  görev durumuna sahipse bir [aracı harness'ı](/tr/plugins/sdk-agent-harness) kullanın.
</Info>

## Plugin'in sahip oldukları

Bir CLI arka uç Plugin'inin üç sözleşmesi vardır:

| Sözleşme             | Dosya                  | Amaç                                                       |
| -------------------- | ---------------------- | --------------------------------------------------------- |
| Paket girişi         | `package.json`         | OpenClaw'ı Plugin çalışma zamanı modülüne yönlendirir     |
| Manifest sahipliği   | `openclaw.plugin.json` | Çalışma zamanı yüklenmeden önce arka uç kimliğini bildirir |
| Çalışma zamanı kaydı | `index.ts`             | Komut varsayılanlarıyla `api.registerCliBackend(...)` çağırır |

Manifest keşif meta verisidir. CLI'ı çalıştırmaz ve çalışma zamanı davranışını kaydetmez. Çalışma zamanı davranışı, Plugin girişi `api.registerCliBackend(...)` çağırdığında başlar.

## Minimal arka uç Plugin'i

<Steps>
  <Step title="Paket meta verisi oluştur">
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

    Yayımlanan paketler derlenmiş JavaScript çalışma zamanı dosyaları göndermelidir. Kaynak
    girişiniz `./src/index.ts` ise derlenmiş JavaScript eş dosyasını gösteren
    `openclaw.runtimeExtensions` ekleyin. Bkz. [Giriş noktaları](/tr/plugins/sdk-entrypoints).

  </Step>

  <Step title="Arka uç sahipliğini bildir">
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

    `cliBackends`, çalışma zamanı sahiplik listesidir. Yapılandırma veya model seçimi
    `acme-cli/...` ifadesinden bahsettiğinde OpenClaw'ın Plugin'i otomatik yüklemesini sağlar.

    `setup.cliBackends`, önce tanımlayıcı kurulum yüzeyidir. Model keşfi, ilk kurulum veya durumun
    Plugin çalışma zamanı yüklenmeden arka ucu tanıması gerektiğinde ekleyin. `requiresRuntime: false`
    yalnızca bu statik tanımlayıcılar kurulum için yeterli olduğunda kullanın.

  </Step>

  <Step title="Arka ucu kaydet">
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

    Arka uç kimliği manifest `cliBackends` girdisiyle eşleşmelidir. Kaydedilen
    `config` yalnızca varsayılandır; `agents.defaults.cliBackends.acme-cli` altındaki
    kullanıcı yapılandırması çalışma zamanında bunun üzerine birleştirilir.

  </Step>
</Steps>

## Yapılandırma şekli

`CliBackendConfig`, OpenClaw'ın CLI'ı nasıl başlatıp ayrıştırması gerektiğini açıklar:

| Alan                                      | Kullanım                                                    |
| ----------------------------------------- | ----------------------------------------------------------- |
| `command`                                 | İkili adı veya mutlak komut yolu                            |
| `args`                                    | Yeni çalıştırmalar için temel argv                          |
| `resumeArgs`                              | Sürdürülen oturumlar için alternatif argv; `{sessionId}` destekler |
| `output` / `resumeOutput`                 | Ayrıştırıcı: `json`, `jsonl` veya `text`                    |
| `input`                                   | İstem taşıma: `arg` veya `stdin`                            |
| `modelArg`                                | Model kimliğinden önce kullanılan bayrak                    |
| `modelAliases`                            | OpenClaw model kimliklerini CLI'a özgü kimliklerle eşler    |
| `sessionArg` / `sessionArgs`              | Oturum kimliğinin nasıl geçirileceği                        |
| `sessionMode`                             | `always`, `existing` veya `none`                            |
| `sessionIdFields`                         | OpenClaw'ın CLI çıktısından okuduğu JSON alanları           |
| `systemPromptArg` / `systemPromptFileArg` | Sistem istemi taşıma                                        |
| `systemPromptWhen`                        | `first`, `always` veya `never`                              |
| `imageArg` / `imageMode`                  | Görsel yolu desteği                                         |
| `serialize`                               | Aynı arka uç çalıştırmalarını sıralı tut                    |
| `reliability.watchdog`                    | Çıktı yok zaman aşımı ayarı                                 |

CLI ile eşleşen en küçük statik yapılandırmayı tercih edin. Plugin geri çağrılarını yalnızca gerçekten arka uca ait davranışlar için ekleyin.

## Gelişmiş arka uç hook'ları

`CliBackendPlugin` şunları da tanımlayabilir:

| Hook                               | Kullanım                                                                    |
| ---------------------------------- | --------------------------------------------------------------------------- |
| `normalizeConfig(config, context)` | Birleştirme sonrası eski kullanıcı yapılandırmasını yeniden yaz             |
| `resolveExecutionArgs(ctx)`        | Düşünme çabası veya yan soru yalıtımı gibi istek kapsamlı bayraklar ekle    |
| `prepareExecution(ctx)`            | Başlatmadan önce geçici kimlik doğrulama veya yapılandırma köprüleri oluştur |
| `transformSystemPrompt(ctx)`       | Son bir CLI'a özgü sistem istemi dönüşümü uygula                            |
| `textTransforms`                   | Çift yönlü istem/çıktı değiştirmeleri                                       |
| `defaultAuthProfileId`             | Belirli bir OpenClaw kimlik doğrulama profilini tercih et                   |
| `authEpochMode`                    | Kimlik doğrulama değişikliklerinin saklanan CLI oturumlarını nasıl geçersiz kılacağını belirle |
| `nativeToolMode`                   | CLI'ın her zaman açık yerel araçları olup olmadığını bildir                 |
| `sideQuestionToolMode`             | `/btw` yan soruları için devre dışı yerel araçları bildir                   |
| `bundleMcp` / `bundleMcpMode`      | OpenClaw'ın loopback MCP araç köprüsüne katıl                               |
| `ownsNativeCompaction`             | Arka uç kendi compaction'ına sahiptir - OpenClaw erteler                    |

Bu hook'ları sağlayıcının sahipliğinde tutun. Bir arka uç hook'ı davranışı ifade edebiliyorsa çekirdeğe CLI'a özgü dallar eklemeyin.

`ctx.executionMode`, normal dönüşler için `"agent"` ve geçici `/btw` çağrıları için `"side-question"` değeridir. CLI'ın BTW için yerel araçları, oturum kalıcılığını veya sürdürme davranışını devre dışı bırakmak gibi farklı tek seferlik bayraklara ihtiyacı olduğunda bunu kullanın. Bir arka uç normalde `nativeToolMode: "always-on"` değerine sahipse ancak yan soru argv'si bu araçları güvenilir biçimde devre dışı bırakıyorsa `sideQuestionToolMode: "disabled"` da ayarlayın; aksi halde BTW araçsız CLI çalıştırması gerektirdiğinde OpenClaw güvenli şekilde kapalı kalır.

### `ownsNativeCompaction`: OpenClaw compaction'ından çıkma

Arka ucunuz **kendi** transkriptini sıkıştıran bir aracı çalıştırıyorsa
`ownsNativeCompaction: true` ayarlayın; böylece OpenClaw'ın koruma özetleyicisi onun oturumlarında asla çalışmaz - CLI compaction yaşam döngüsü no-op döndürür ve dönüş devam eder. `claude-cli`, Claude Code dahili olarak ve harness uç noktası olmadan sıkıştırdığı için bunu bildirir. Codex gibi yerel harness oturumları bunun yerine harness compaction uç noktalarına yönlendirilmeye devam eder.

**Bunu yalnızca aşağıdakilerin tümü geçerliyse bildirin**, aksi halde ertelenmiş bütçe üstü bir oturum bütçe üstünde kalabilir / bayatlayabilir (OpenClaw artık onu kurtarmaz):

- arka uç, penceresine yaklaştıkça kendi transkriptini güvenilir biçimde sıkıştırır veya sınırlar;
- sıkıştırılmış durumun dönüşler arasında kalması için sürdürülebilir bir oturum saklar
  (örn. `--resume` / `--session-id`);
- yerel harness compaction oturumu değildir - eşleşen `agentHarnessId` oturumları
  bunun yerine harness uç noktasına yönlendirilir.

## MCP araç köprüsü

CLI arka uçları varsayılan olarak OpenClaw araçlarını almaz. CLI bir MCP yapılandırmasını tüketebiliyorsa açıkça dahil edin:

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

Desteklenen köprü modları şunlardır:

| Mod                      | Kullanım                                                        |
| ------------------------ | --------------------------------------------------------------- |
| `claude-config-file`     | MCP yapılandırma dosyası kabul eden CLI'lar                     |
| `codex-config-overrides` | argv üzerinde yapılandırma geçersiz kılmaları kabul eden CLI'lar |
| `gemini-system-settings` | MCP ayarlarını sistem ayarları dizininden okuyan CLI'lar        |

Köprüyü yalnızca CLI gerçekten tüketebiliyorsa etkinleştirin. CLI'ın devre dışı bırakılamayan kendi yerleşik araç katmanı varsa `nativeToolMode:
"always-on"` ayarlayın; böylece çağıran taraf yerel araç istemediğinde OpenClaw güvenli şekilde kapalı kalabilir.

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
        primary: "openai/gpt-5.5",
        fallbacks: ["acme-cli/large"],
      },
    },
  },
}
```

Kullanıcıların ihtiyaç duyması muhtemel en küçük geçersiz kılmayı belgeleyin. Bu genellikle yalnızca ikili `PATH` dışında olduğunda `command` olur.

## Doğrulama

Paketle gelen pluginler için, builder ve kurulum kaydı etrafında odaklı bir test ekleyin, ardından pluginin hedeflenen test hattını çalıştırın:

```bash
pnpm test extensions/acme-cli
```

Yerel veya yüklü pluginler için keşfi ve bir gerçek model çalıştırmasını doğrulayın:

```bash
openclaw plugins inspect acme-cli --runtime --json
openclaw agent --message "reply exactly: backend ok" --model acme-cli/acme-large
```

Backend görüntüleri veya MCP'yi destekliyorsa, bu yolları gerçek CLI ile kanıtlayan canlı bir smoke testi ekleyin. İstem, görüntü, MCP veya oturum sürdürme davranışı için statik incelemeye güvenmeyin.

## Kontrol Listesi

<Check>`package.json`, yayımlanan paketler için `openclaw.extensions` ve derlenmiş runtime girişlerine sahip</Check>
<Check>`openclaw.plugin.json`, `cliBackends` ve kasıtlı `activation.onStartup` bildirir</Check>
<Check>Kurulum/model keşfinin backend'i soğuk halde görmesi gerektiğinde `setup.cliBackends` mevcut</Check>
<Check>`api.registerCliBackend(...)`, manifest ile aynı backend kimliğini kullanır</Check>
<Check>`agents.defaults.cliBackends.<id>` altındaki kullanıcı geçersiz kılmaları hâlâ önceliklidir</Check>
<Check>Oturum, sistem istemi, görüntü ve çıktı ayrıştırıcı ayarları gerçek CLI sözleşmesiyle eşleşir</Check>
<Check>Hedeflenen testler ve en az bir canlı CLI smoke testi backend yolunu kanıtlar</Check>

## İlgili

- [CLI backendleri](/tr/gateway/cli-backends) - kullanıcı yapılandırması ve runtime davranışı
- [Plugin oluşturma](/tr/plugins/building-plugins) - paket ve manifest temelleri
- [Plugin SDK genel bakışı](/tr/plugins/sdk-overview) - kayıt API başvurusu
- [Plugin manifesti](/tr/plugins/manifest) - `cliBackends` ve kurulum tanımlayıcıları
- [Agent harness](/tr/plugins/sdk-agent-harness) - tam harici agent runtimeları
