---
read_when:
    - Paketlenmiş Codex app-server harness kullanmak istiyorsunuz
    - Codex model başvurularına ve yapılandırma örneklerine ihtiyacınız var
    - Yalnızca Codex dağıtımları için PI fallback'i devre dışı bırakmak istiyorsunuz
summary: OpenClaw gömülü agent turlarını paketlenmiş Codex app-server harness üzerinden çalıştırma
title: Codex Harness
x-i18n:
    generated_at: "2026-04-11T02:45:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 60e1dcf4f1a00c63c3ef31d72feac44bce255421c032c58fa4fd67295b3daf23
    source_path: plugins/codex-harness.md
    workflow: 15
---

# Codex Harness

Paketlenmiş `codex` plugin'i, OpenClaw'un gömülü agent turlarını yerleşik PI harness yerine
Codex app-server üzerinden çalıştırmasına olanak tanır.

Bunu, düşük düzey agent oturumunun Codex tarafından yönetilmesini istediğinizde kullanın: model
keşfi, yerel thread devam ettirme, yerel sıkıştırma ve app-server yürütmesi.
OpenClaw yine de sohbet kanallarını, oturum dosyalarını, model seçimini, araçları,
onayları, medya teslimini ve görünür döküm aynasını yönetmeye devam eder.

Harness varsayılan olarak kapalıdır. Yalnızca `codex` plugin'i
etkinleştirildiğinde ve çözümlenen model bir `codex/*` modeli olduğunda ya da
`embeddedHarness.runtime: "codex"` veya `OPENCLAW_AGENT_RUNTIME=codex` açıkça zorlandığında seçilir.
Hiç `codex/*` yapılandırmazsanız mevcut PI, OpenAI, Anthropic, Gemini, local
ve custom-provider çalıştırmaları mevcut davranışlarını korur.

## Doğru model önekini seçin

OpenClaw, OpenAI erişimi ile Codex biçimli erişim için ayrı yollar kullanır:

| Model başvurusu       | Çalışma zamanı yolu                           | Şu durumda kullanın                                                      |
| --------------------- | --------------------------------------------- | ------------------------------------------------------------------------ |
| `openai/gpt-5.4`      | OpenClaw/PI altyapısı üzerinden OpenAI sağlayıcısı | `OPENAI_API_KEY` ile doğrudan OpenAI Platform API erişimi istiyorsunuz. |
| `openai-codex/gpt-5.4` | PI üzerinden OpenAI Codex OAuth sağlayıcısı  | Codex app-server harness olmadan ChatGPT/Codex OAuth istiyorsunuz.      |
| `codex/gpt-5.4`       | Paketlenmiş Codex sağlayıcısı ve Codex harness | Gömülü agent turu için yerel Codex app-server yürütmesi istiyorsunuz.   |

Codex harness yalnızca `codex/*` model başvurularını sahiplenir. Mevcut `openai/*`,
`openai-codex/*`, Anthropic, Gemini, xAI, local ve custom provider başvuruları
normal yollarını korur.

## Gereksinimler

- Paketlenmiş `codex` plugin'i kullanılabilir olan OpenClaw.
- Codex app-server `0.118.0` veya daha yeni.
- App-server süreci için kullanılabilir Codex kimlik doğrulaması.

Plugin, daha eski veya sürümsüz app-server el sıkışmalarını engeller. Bu, OpenClaw'u
test edildiği protokol yüzeyinde tutar.

Canlı ve Docker smoke testleri için kimlik doğrulaması genellikle `OPENAI_API_KEY` ile, ayrıca
`~/.codex/auth.json` ve `~/.codex/config.toml` gibi isteğe bağlı Codex CLI dosyalarıyla gelir.
Yerel Codex app-server'ınızın kullandığı kimlik doğrulama materyalinin aynısını kullanın.

## Minimum yapılandırma

`codex/gpt-5.4` kullanın, paketlenmiş plugin'i etkinleştirin ve `codex` harness'i zorlayın:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
  agents: {
    defaults: {
      model: "codex/gpt-5.4",
      embeddedHarness: {
        runtime: "codex",
        fallback: "none",
      },
    },
  },
}
```

Yapılandırmanız `plugins.allow` kullanıyorsa `codex` öğesini de buraya ekleyin:

```json5
{
  plugins: {
    allow: ["codex"],
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
}
```

`agents.defaults.model` veya bir agent modelini `codex/<model>` olarak ayarlamak da
paketlenmiş `codex` plugin'ini otomatik etkinleştirir. Açık plugin girdisi, paylaşılan yapılandırmalarda
dağıtım amacını belirgin hale getirdiği için yine de yararlıdır.

## Diğer modelleri değiştirmeden Codex ekleme

`codex/*` modelleri için Codex, diğer her şey için PI istiyorsanız `runtime: "auto"` değerini koruyun:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
  agents: {
    defaults: {
      model: {
        primary: "codex/gpt-5.4",
        fallbacks: ["openai/gpt-5.4", "anthropic/claude-opus-4-6"],
      },
      models: {
        "codex/gpt-5.4": { alias: "codex" },
        "codex/gpt-5.4-mini": { alias: "codex-mini" },
        "openai/gpt-5.4": { alias: "gpt" },
        "anthropic/claude-opus-4-6": { alias: "opus" },
      },
      embeddedHarness: {
        runtime: "auto",
        fallback: "pi",
      },
    },
  },
}
```

Bu yapıyla:

- `/model codex` veya `/model codex/gpt-5.4`, Codex app-server harness'i kullanır.
- `/model gpt` veya `/model openai/gpt-5.4`, OpenAI sağlayıcı yolunu kullanır.
- `/model opus`, Anthropic sağlayıcı yolunu kullanır.
- Codex olmayan bir model seçilirse PI uyumluluk harness'i olarak kalır.

## Yalnızca Codex dağıtımları

Her gömülü agent turunun Codex harness kullandığını kanıtlamanız gerekiyorsa
PI fallback'i devre dışı bırakın:

```json5
{
  agents: {
    defaults: {
      model: "codex/gpt-5.4",
      embeddedHarness: {
        runtime: "codex",
        fallback: "none",
      },
    },
  },
}
```

Ortam geçersiz kılması:

```bash
OPENCLAW_AGENT_RUNTIME=codex \
OPENCLAW_AGENT_HARNESS_FALLBACK=none \
openclaw gateway run
```

Fallback devre dışıyken, `codex` plugin'i devre dışıysa,
istenen model bir `codex/*` başvurusu değilse, app-server çok eskiyse veya
app-server başlatılamıyorsa OpenClaw erken aşamada başarısız olur.

## Agent başına Codex

Varsayılan agent normal otomatik seçimi korurken bir agent'ı yalnızca Codex yapabilirsiniz:

```json5
{
  agents: {
    defaults: {
      embeddedHarness: {
        runtime: "auto",
        fallback: "pi",
      },
    },
    list: [
      {
        id: "main",
        default: true,
        model: "anthropic/claude-opus-4-6",
      },
      {
        id: "codex",
        name: "Codex",
        model: "codex/gpt-5.4",
        embeddedHarness: {
          runtime: "codex",
          fallback: "none",
        },
      },
    ],
  },
}
```

Agent ve model değiştirmek için normal oturum komutlarını kullanın. `/new`, yeni bir
OpenClaw oturumu oluşturur ve Codex harness gerektiğinde kendi sidecar app-server
thread'ini oluşturur veya sürdürür. `/reset`, bu thread için OpenClaw oturum bağlamasını temizler.

## Model keşfi

Varsayılan olarak Codex plugin'i, kullanılabilir modelleri app-server'dan ister. Keşif
başarısız olursa veya zaman aşımına uğrarsa paketlenmiş yedek kataloğu kullanır:

- `codex/gpt-5.4`
- `codex/gpt-5.4-mini`
- `codex/gpt-5.2`

Keşfi `plugins.entries.codex.config.discovery` altında ayarlayabilirsiniz:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          discovery: {
            enabled: true,
            timeoutMs: 2500,
          },
        },
      },
    },
  },
}
```

Başlangıçta Codex'i yoklamaktan kaçınmak ve yedek kataloğa bağlı kalmak istediğinizde
keşfi devre dışı bırakın:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          discovery: {
            enabled: false,
          },
        },
      },
    },
  },
}
```

## App-server bağlantısı ve ilke

Varsayılan olarak plugin, Codex'i yerelde şu komutla başlatır:

```bash
codex app-server --listen stdio://
```

Bu varsayılanı koruyup yalnızca Codex yerel ilkesini ayarlayabilirsiniz:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            approvalPolicy: "on-request",
            sandbox: "workspace-write",
            serviceTier: "priority",
          },
        },
      },
    },
  },
}
```

Zaten çalışan bir app-server için WebSocket aktarımını kullanın:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            transport: "websocket",
            url: "ws://127.0.0.1:39175",
            authToken: "${CODEX_APP_SERVER_TOKEN}",
            requestTimeoutMs: 60000,
          },
        },
      },
    },
  },
}
```

Desteklenen `appServer` alanları:

| Alan                | Varsayılan                               | Anlamı                                                                   |
| ------------------- | ---------------------------------------- | ------------------------------------------------------------------------ |
| `transport`         | `"stdio"`                                | `"stdio"` Codex'i başlatır; `"websocket"` `url` adresine bağlanır.      |
| `command`           | `"codex"`                                | stdio aktarımı için yürütülebilir dosya.                                 |
| `args`              | `["app-server", "--listen", "stdio://"]` | stdio aktarımı için argümanlar.                                          |
| `url`               | ayarlanmamış                             | WebSocket app-server URL'si.                                             |
| `authToken`         | ayarlanmamış                             | WebSocket aktarımı için Bearer token.                                    |
| `headers`           | `{}`                                     | Ek WebSocket başlıkları.                                                 |
| `requestTimeoutMs`  | `60000`                                  | App-server control-plane çağrıları için zaman aşımı.                     |
| `approvalPolicy`    | `"never"`                                | Thread başlatma/devam ettirme/tura gönderilen yerel Codex onay ilkesi.   |
| `sandbox`           | `"workspace-write"`                      | Thread başlatma/devam ettirmeye gönderilen yerel Codex sandbox modu.     |
| `approvalsReviewer` | `"user"`                                 | Yerel onayları Codex guardian'ın incelemesi için `"guardian_subagent"` kullanın. |
| `serviceTier`       | ayarlanmamış                             | İsteğe bağlı Codex hizmet katmanı, örneğin `"priority"`.                 |

Eski ortam değişkenleri, eşleşen yapılandırma alanı ayarlanmamışsa yerel testlerde
fallback olarak hâlâ çalışır:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`
- `OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1`

Tekrarlanabilir dağıtımlar için yapılandırma tercih edilir.

## Yaygın tarifler

Varsayılan stdio aktarımıyla yerel Codex:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
}
```

PI fallback devre dışıyken, yalnızca Codex harness doğrulaması:

```json5
{
  embeddedHarness: {
    fallback: "none",
  },
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
}
```

Guardian tarafından incelenen Codex onayları:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            approvalPolicy: "on-request",
            approvalsReviewer: "guardian_subagent",
            sandbox: "workspace-write",
          },
        },
      },
    },
  },
}
```

Açık başlıklarla uzak app-server:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            transport: "websocket",
            url: "ws://gateway-host:39175",
            headers: {
              "X-OpenClaw-Agent": "main",
            },
          },
        },
      },
    },
  },
}
```

Model değiştirme OpenClaw tarafından yönetilmeye devam eder. Bir OpenClaw oturumu
mevcut bir Codex thread'ine bağlandığında sonraki tur, şu anda seçili
`codex/*` modelini, sağlayıcıyı, onay ilkesini, sandbox'ı ve hizmet katmanını
yeniden app-server'a gönderir. `codex/gpt-5.4` modelinden `codex/gpt-5.2` modeline geçmek,
thread bağını korur ancak Codex'ten yeni seçilen modelle devam etmesini ister.

## Codex komutu

Paketlenmiş plugin, yetkili slash komutu olarak `/codex` kaydeder. Bu komut
geneldir ve OpenClaw metin komutlarını destekleyen herhangi bir kanalda çalışır.

Yaygın biçimler:

- `/codex status`, canlı app-server bağlantısını, modelleri, hesabı, oran sınırlarını, MCP sunucularını ve skills'i gösterir.
- `/codex models`, canlı Codex app-server modellerini listeler.
- `/codex threads [filter]`, son Codex thread'lerini listeler.
- `/codex resume <thread-id>`, geçerli OpenClaw oturumunu mevcut bir Codex thread'ine bağlar.
- `/codex compact`, Codex app-server'dan bağlı thread'i sıkıştırmasını ister.
- `/codex review`, bağlı thread için Codex yerel incelemesini başlatır.
- `/codex account`, hesap ve oran sınırı durumunu gösterir.
- `/codex mcp`, Codex app-server MCP sunucu durumunu listeler.
- `/codex skills`, Codex app-server skills'ini listeler.

`/codex resume`, harness'in normal turlar için kullandığı aynı sidecar bağlama dosyasını
yazar. Sonraki mesajda OpenClaw bu Codex thread'ini sürdürür, şu anda seçili
OpenClaw `codex/*` modelini app-server'a iletir ve genişletilmiş geçmişi
etkin tutar.

Komut yüzeyi Codex app-server `0.118.0` veya daha yenisini gerektirir. Gelecekteki
veya özel bir app-server bu JSON-RPC yöntemini sunmuyorsa, tek tek control
yöntemleri `unsupported by this Codex app-server` olarak bildirilir.

## Araçlar, medya ve sıkıştırma

Codex harness yalnızca düşük düzey gömülü agent yürütücüsünü değiştirir.

OpenClaw yine de araç listesini oluşturur ve harness'ten dinamik araç sonuçlarını
alır. Metin, görseller, video, müzik, TTS, onaylar ve mesajlaşma aracı çıktısı
normal OpenClaw teslim yolu üzerinden devam eder.

Seçilen model Codex harness kullandığında, yerel thread sıkıştırması
Codex app-server'a devredilir. OpenClaw kanal geçmişi, arama, `/new`, `/reset`
ve gelecekte model veya harness değiştirme için bir döküm aynası tutar. Bu
ayna, kullanıcı istemini, son assistant metnini ve app-server bunları yaydığında
hafif Codex akıl yürütme veya plan kayıtlarını içerir.

Medya oluşturma PI gerektirmez. Görsel, video, müzik, PDF, TTS ve medya
anlama; `agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel`
ve `messages.tts` gibi eşleşen sağlayıcı/model ayarlarını kullanmaya devam eder.

## Sorun giderme

**Codex `/model` içinde görünmüyor:** `plugins.entries.codex.enabled` değerini etkinleştirin,
bir `codex/*` model başvurusu ayarlayın veya `plugins.allow` değerinin `codex` öğesini
hariç tutup tutmadığını kontrol edin.

**OpenClaw PI'ye fallback yapıyor:** test sırasında `embeddedHarness.fallback: "none"` veya
`OPENCLAW_AGENT_HARNESS_FALLBACK=none` ayarlayın.

**App-server reddediliyor:** app-server el sıkışmasının
`0.118.0` veya daha yeni bir sürüm bildirmesi için Codex'i yükseltin.

**Model keşfi yavaş:** `plugins.entries.codex.config.discovery.timeoutMs` değerini düşürün
veya keşfi devre dışı bırakın.

**WebSocket aktarımı hemen başarısız oluyor:** `appServer.url`, `authToken`
ve uzak app-server'ın aynı Codex app-server protokol sürümünü konuştuğunu kontrol edin.

**Codex olmayan bir model PI kullanıyor:** bu beklenen davranıştır. Codex harness yalnızca
`codex/*` model başvurularını sahiplenir.

## İlgili

- [Agent Harness Plugins](/tr/plugins/sdk-agent-harness)
- [Model Providers](/tr/concepts/model-providers)
- [Configuration Reference](/tr/gateway/configuration-reference)
- [Testing](/tr/help/testing#live-codex-app-server-harness-smoke)
