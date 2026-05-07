---
read_when:
    - Yerel bir yapay zeka CLI arka uç Plugin'i oluşturuyorsunuz
    - acme-cli/model gibi model referansları için bir arka uç kaydetmek istiyorsunuz
    - Üçüncü taraf bir CLI'yi OpenClaw'ın metin yedek çalıştırıcısına eşlemeniz gerekir
sidebarTitle: CLI backend plugins
summary: Yerel bir yapay zekâ CLI arka ucu kaydeden bir Plugin oluşturun
title: CLI arka uç Plugin'leri oluşturma
x-i18n:
    generated_at: "2026-05-07T13:23:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9fcd604d35eb20d91350d5201236f22edfe7bb7e52eb19e89bceb8025dd3a29b
    source_path: plugins/cli-backend-plugins.md
    workflow: 16
---

CLI arka uç Plugin'leri, OpenClaw'ın bir yerel AI CLI'yi metin çıkarımı
arka ucu olarak çağırmasını sağlar. Arka uç, model referanslarında sağlayıcı
öneki olarak görünür:

```text
acme-cli/acme-large
```

Yukarı akış entegrasyonu zaten yerel bir komut olarak sunuluyorsa, CLI yerel
oturum açma durumunu yönetiyorsa veya API sağlayıcıları kullanılamadığında CLI
yararlı bir yedekse bir CLI arka ucu kullanın.

<Info>
  Yukarı akış hizmeti normal bir HTTP model API'si sunuyorsa bunun yerine bir
  [sağlayıcı Plugin'i](/tr/plugins/sdk-provider-plugins) yazın. Yukarı akış
  çalışma zamanı eksiksiz ajan oturumlarını, araç olaylarını, Compaction'ı veya
  arka plan görev durumunu yönetiyorsa bir [ajan koşum takımı](/tr/plugins/sdk-agent-harness) kullanın.
</Info>

## Plugin'in sahip olduğu şeyler

Bir CLI arka uç Plugin'inin üç sözleşmesi vardır:

| Sözleşme             | Dosya                  | Amaç                                                      |
| -------------------- | ---------------------- | --------------------------------------------------------- |
| Paket girişi         | `package.json`         | OpenClaw'ı Plugin çalışma zamanı modülüne yönlendirir    |
| Manifest sahipliği   | `openclaw.plugin.json` | Çalışma zamanı yüklenmeden önce arka uç kimliğini bildirir |
| Çalışma zamanı kaydı | `index.ts`             | Komut varsayılanlarıyla `api.registerCliBackend(...)` çağırır |

Manifest, keşif meta verisidir. CLI'yi çalıştırmaz ve çalışma zamanı
davranışını kaydetmez. Çalışma zamanı davranışı, Plugin girişi
`api.registerCliBackend(...)` çağırdığında başlar.

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

    Yayımlanan paketler derlenmiş JavaScript çalışma zamanı dosyalarıyla
    gönderilmelidir. Kaynak girişiniz `./src/index.ts` ise derlenmiş JavaScript
    eş dosyasını işaret eden `openclaw.runtimeExtensions` ekleyin.
    [Giriş noktaları](/tr/plugins/sdk-entrypoints) bölümüne bakın.

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

    `cliBackends`, çalışma zamanı sahipliği listesidir. Yapılandırma veya model
    seçimi `acme-cli/...` belirttiğinde OpenClaw'ın Plugin'i otomatik yüklemesini
    sağlar.

    `setup.cliBackends`, tanımlayıcı öncelikli kurulum yüzeyidir. Model keşfi,
    ilk katılım veya durumun Plugin çalışma zamanını yüklemeden arka ucu
    tanıması gerekiyorsa bunu ekleyin. `requiresRuntime: false` değerini yalnızca
    bu statik tanımlayıcılar kurulum için yeterliyse kullanın.

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

    Arka uç kimliği, manifest `cliBackends` girdisiyle eşleşmelidir. Kayıtlı
    `config` yalnızca varsayılandır; çalışma zamanında
    `agents.defaults.cliBackends.acme-cli` altındaki kullanıcı yapılandırması
    bunun üzerine birleştirilir.

  </Step>
</Steps>

## Yapılandırma şekli

`CliBackendConfig`, OpenClaw'ın CLI'yi nasıl başlatıp ayrıştıracağını açıklar:

| Alan                                      | Kullanım                                                    |
| ----------------------------------------- | ----------------------------------------------------------- |
| `command`                                 | İkili adı veya mutlak komut yolu                            |
| `args`                                    | Yeni çalıştırmalar için temel argv                          |
| `resumeArgs`                              | Sürdürülen oturumlar için alternatif argv; `{sessionId}` destekler |
| `output` / `resumeOutput`                 | Ayrıştırıcı: `json`, `jsonl` veya `text`                    |
| `input`                                   | İstem aktarımı: `arg` veya `stdin`                          |
| `modelArg`                                | Model kimliğinden önce kullanılan bayrak                    |
| `modelAliases`                            | OpenClaw model kimliklerini CLI'ye özgü kimliklerle eşleştirir |
| `sessionArg` / `sessionArgs`              | Oturum kimliğinin nasıl geçirileceği                        |
| `sessionMode`                             | `always`, `existing` veya `none`                            |
| `sessionIdFields`                         | OpenClaw'ın CLI çıktısından okuduğu JSON alanları           |
| `systemPromptArg` / `systemPromptFileArg` | Sistem istemi aktarımı                                      |
| `systemPromptWhen`                        | `first`, `always` veya `never`                              |
| `imageArg` / `imageMode`                  | Görsel yolu desteği                                         |
| `serialize`                               | Aynı arka uç çalıştırmalarını sıralı tutar                  |
| `reliability.watchdog`                    | Çıktı yok zaman aşımı ayarı                                 |

CLI ile eşleşen en küçük statik yapılandırmayı tercih edin. Plugin geri
çağrılarını yalnızca gerçekten arka uca ait davranışlar için ekleyin.

## Gelişmiş arka uç kancaları

`CliBackendPlugin` şunları da tanımlayabilir:

| Kanca                              | Kullanım                                                   |
| ---------------------------------- | ---------------------------------------------------------- |
| `normalizeConfig(config, context)` | Birleştirme sonrasında eski kullanıcı yapılandırmasını yeniden yazar |
| `resolveExecutionArgs(ctx)`        | Düşünme eforu gibi istek kapsamlı bayraklar ekler          |
| `prepareExecution(ctx)`            | Başlatmadan önce geçici kimlik doğrulama veya yapılandırma köprüleri oluşturur |
| `transformSystemPrompt(ctx)`       | CLI'ye özel son bir sistem istemi dönüşümü uygular         |
| `textTransforms`                   | Çift yönlü istem/çıktı değiştirmeleri                      |
| `defaultAuthProfileId`             | Belirli bir OpenClaw kimlik doğrulama profilini tercih eder |
| `authEpochMode`                    | Kimlik doğrulama değişikliklerinin saklanan CLI oturumlarını nasıl geçersiz kılacağını belirler |
| `nativeToolMode`                   | CLI'nin her zaman açık yerel araçlara sahip olup olmadığını bildirir |
| `bundleMcp` / `bundleMcpMode`      | OpenClaw'ın loopback MCP araç köprüsüne dahil olur         |

Bu kancaları sağlayıcıya ait tutun. Bir arka uç kancası davranışı ifade
edebiliyorsa çekirdeğe CLI'ye özel dallar eklemeyin.

## MCP araç köprüsü

CLI arka uçları varsayılan olarak OpenClaw araçlarını almaz. CLI bir MCP
yapılandırmasını tüketebiliyorsa açıkça dahil olun:

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

| Mod                      | Kullanım                                                       |
| ------------------------ | -------------------------------------------------------------- |
| `claude-config-file`     | MCP yapılandırma dosyası kabul eden CLI'ler                    |
| `codex-config-overrides` | argv üzerinde yapılandırma geçersiz kılmaları kabul eden CLI'ler |
| `gemini-system-settings` | MCP ayarlarını sistem ayarları dizininden okuyan CLI'ler       |

Köprüyü yalnızca CLI gerçekten bunu tüketebiliyorsa etkinleştirin. CLI'nin
devre dışı bırakılamayan kendi yerleşik araç katmanı varsa `nativeToolMode:
"always-on"` ayarlayın; böylece bir çağıran yerel araç olmamasını gerektirdiğinde
OpenClaw kapalı şekilde hata verebilir.

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

Kullanıcıların ihtiyaç duyma olasılığı en yüksek olan minimum geçersiz kılmayı
belgeleyin. Bu genellikle yalnızca ikili `PATH` dışında olduğunda `command`
olur.

## Doğrulama

Paketlenmiş Plugin'ler için oluşturucu ve kurulum kaydı etrafında odaklı bir
test ekleyin, ardından Plugin'in hedefli test hattını çalıştırın:

```bash
pnpm test extensions/acme-cli
```

Yerel veya yüklü Plugin'ler için keşfi ve bir gerçek model çalıştırmasını
doğrulayın:

```bash
openclaw plugins inspect acme-cli --runtime --json
openclaw agent --message "reply exactly: backend ok" --model acme-cli/acme-large
```

Arka uç görselleri veya MCP'yi destekliyorsa bu yolları gerçek CLI ile kanıtlayan
canlı bir smoke testi ekleyin. İstem, görsel, MCP veya oturum sürdürme davranışı
için statik incelemeye güvenmeyin.

## Kontrol listesi

<Check>`package.json`, yayımlanan paketler için `openclaw.extensions` ve derlenmiş çalışma zamanı girişlerine sahip</Check>
<Check>`openclaw.plugin.json`, `cliBackends` ve bilinçli `activation.onStartup` bildirir</Check>
<Check>Kurulum/model keşfinin arka ucu soğuk durumda görmesi gerekiyorsa `setup.cliBackends` mevcuttur</Check>
<Check>`api.registerCliBackend(...)`, manifest ile aynı arka uç kimliğini kullanır</Check>
<Check>`agents.defaults.cliBackends.<id>` altındaki kullanıcı geçersiz kılmaları hâlâ kazanır</Check>
<Check>Oturum, sistem istemi, görsel ve çıktı ayrıştırıcı ayarları gerçek CLI sözleşmesiyle eşleşir</Check>
<Check>Hedefli testler ve en az bir canlı CLI smoke testi arka uç yolunu kanıtlar</Check>

## İlgili

- [CLI arka uçları](/tr/gateway/cli-backends) - kullanıcı yapılandırması ve çalışma zamanı davranışı
- [Plugin oluşturma](/tr/plugins/building-plugins) - paket ve manifest temelleri
- [Plugin SDK genel bakışı](/tr/plugins/sdk-overview) - kayıt API başvurusu
- [Plugin manifesti](/tr/plugins/manifest) - `cliBackends` ve kurulum tanımlayıcıları
- [Ajan koşum takımı](/tr/plugins/sdk-agent-harness) - tam harici ajan çalışma zamanları
