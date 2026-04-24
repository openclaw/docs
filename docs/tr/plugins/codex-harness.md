---
read_when:
    - Paketlenmiş Codex app-server test altyapısını kullanmak istiyorsunuz
    - Codex model referanslarına ve yapılandırma örneklerine ihtiyacınız var
    - Yalnızca Codex kullanılan dağıtımlarda Pi geri dönüşünü devre dışı bırakmak istiyorsunuz
summary: OpenClaw gömülü agent turlarını paketlenmiş Codex app-server test altyapısı üzerinden çalıştırma
title: Codex test altyapısı
x-i18n:
    generated_at: "2026-04-24T09:21:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: c02b1e6cbaaefee858db7ebd7e306261683278ed9375bca6fe74855ca84eabd8
    source_path: plugins/codex-harness.md
    workflow: 15
---

Paketlenmiş `codex` Plugin'i, OpenClaw'ın gömülü agent turlarını
yerleşik PI test altyapısı yerine Codex app-server üzerinden çalıştırmasını sağlar.

Bunu, düşük düzey agent oturumunun Codex'e ait olmasını istediğinizde kullanın: model
keşfi, yerel thread sürdürme, yerel Compaction ve app-server yürütmesi.
OpenClaw yine de sohbet kanallarını, oturum dosyalarını, model seçimini, araçları,
onayları, medya teslimini ve görünür transcript yansıtmasını yönetir.

Yerel Codex turları, OpenClaw Plugin kancalarını ortak uyumluluk katmanı olarak korur.
Bunlar süreç içi OpenClaw kancalarıdır, Codex `hooks.json` komut kancaları değildir:

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `after_tool_call`
- yansıtılmış transcript kayıtları için `before_message_write`
- `agent_end`

Paketlenmiş Plugin'ler, async `tool_result` middleware eklemek için bir Codex app-server uzantı fabrikası da kaydedebilir. Bu middleware, OpenClaw dinamik araçları için OpenClaw aracı çalıştırdıktan sonra ve sonuç Codex'e döndürülmeden önce çalışır. Bu, OpenClaw'a ait transcript araç-sonuç yazımlarını dönüştüren ortak `tool_result_persist` Plugin kancasından ayrıdır.

Test altyapısı varsayılan olarak kapalıdır. Yeni yapılandırmalar OpenAI model referanslarını
kanonik olarak `openai/gpt-*` biçiminde tutmalı ve yerel app-server yürütmesini istediklerinde
`embeddedHarness.runtime: "codex"` veya `OPENCLAW_AGENT_RUNTIME=codex` ile açıkça zorlamalıdır.
Eski `codex/*` model referansları uyumluluk için hâlâ test altyapısını otomatik seçer.

## Doğru model önekini seçin

OpenAI ailesi yollar öneke duyarlıdır. PI üzerinden Codex OAuth istiyorsanız `openai-codex/*` kullanın; doğrudan OpenAI API erişimi istediğinizde veya yerel Codex app-server test altyapısını zorluyorsanız `openai/*` kullanın:

| Model ref                                             | Çalışma zamanı yolu                            | Şu durumda kullanın                                                          |
| ----------------------------------------------------- | ---------------------------------------------- | ---------------------------------------------------------------------------- |
| `openai/gpt-5.4`                                      | OpenClaw/PI altyapısı üzerinden OpenAI sağlayıcısı | `OPENAI_API_KEY` ile güncel doğrudan OpenAI Platform API erişimi istiyorsunuz. |
| `openai-codex/gpt-5.5`                                | OpenClaw/PI üzerinden OpenAI Codex OAuth       | Varsayılan PI çalıştırıcısıyla ChatGPT/Codex abonelik kimlik doğrulaması istiyorsunuz. |
| `openai/gpt-5.5` + `embeddedHarness.runtime: "codex"` | Codex app-server test altyapısı                | Gömülü agent turu için yerel Codex app-server yürütmesi istiyorsunuz.        |

GPT-5.5 şu anda OpenClaw'da yalnızca abonelik/OAuth ile kullanılabilir. PI OAuth için
`openai-codex/gpt-5.5`, Codex app-server test altyapısı için ise `openai/gpt-5.5`
kullanın. `openai/gpt-5.5` için doğrudan API anahtarı erişimi,
OpenAI GPT-5.5'i herkese açık API'de etkinleştirdiğinde desteklenecektir.

Eski `codex/gpt-*` referansları uyumluluk takma adları olarak kabul edilmeye devam eder. Yeni PI
Codex OAuth yapılandırmaları `openai-codex/gpt-*` kullanmalıdır; yeni yerel app-server
test altyapısı yapılandırmaları ise `openai/gpt-*` ve `embeddedHarness.runtime:
"codex"` kullanmalıdır.

`agents.defaults.imageModel` da aynı önek ayrımını izler. Görüntü anlamanın OpenAI
Codex OAuth sağlayıcı yolu üzerinden çalışmasını istediğinizde `openai-codex/gpt-*` kullanın.
Görüntü anlamanın sınırlı bir Codex app-server turu üzerinden çalışmasını istediğinizde `codex/gpt-*` kullanın.
Codex app-server modeli görüntü girdisi desteği ilan etmelidir; yalnızca metin destekleyen Codex modelleri medya turu başlamadan başarısız olur.

Geçerli oturum için etkin test altyapısını doğrulamak üzere `/status` kullanın. Seçim şaşırtıcıysa `agents/harness` alt sistemi için hata ayıklama günlüklerini etkinleştirin
ve Gateway'in yapılandırılmış `agent harness selected` kaydını inceleyin. Bu kayıt,
seçilen test altyapısı kimliğini, seçim nedenini, çalışma zamanı/geri dönüş ilkesini ve
`auto` modunda her Plugin adayının destek sonucunu içerir.

Test altyapısı seçimi canlı bir oturum denetimi değildir. Bir gömülü tur çalıştığında
OpenClaw o oturum için seçilen test altyapısı kimliğini kaydeder ve aynı oturum kimliğindeki
sonraki turlarda da onu kullanmaya devam eder. Gelecekteki oturumların başka bir test altyapısı kullanmasını istediğinizde `embeddedHarness` yapılandırmasını veya
`OPENCLAW_AGENT_RUNTIME` değerini değiştirin; mevcut bir konuşmayı PI ile Codex arasında değiştirmeden önce yeni bir oturum başlatmak için `/new` veya `/reset` kullanın.
Bu, tek bir transcript'in birbiriyle uyumsuz iki yerel oturum sistemi üzerinden yeniden oynatılmasını önler.

Test altyapısı sabitlemeleri gelmeden önce oluşturulmuş eski oturumlar, transcript geçmişleri varsa PI'ye sabitlenmiş kabul edilir. Yapılandırmayı değiştirdikten sonra o konuşmayı Codex'e geçirmek için `/new` veya `/reset` kullanın.

`/status`, örneğin `Fast · codex` gibi `Fast` yanında etkin PI olmayan test altyapısını gösterir.
Varsayılan PI test altyapısı `Runner: pi (embedded)` olarak kalır ve ayrı bir test altyapısı rozeti eklemez.

## Gereksinimler

- Paketlenmiş `codex` Plugin'i kullanılabilir durumda olan OpenClaw.
- Codex app-server `0.118.0` veya daha yeni.
- App-server işlemi için kullanılabilir Codex kimlik doğrulaması.

Plugin, daha eski veya sürüm bilgisi olmayan app-server el sıkışmalarını engeller. Bu,
OpenClaw'ı test edildiği protokol yüzeyinde tutar.

Canlı ve Docker smoke testlerinde kimlik doğrulama genellikle `OPENAI_API_KEY` üzerinden gelir; ayrıca
`~/.codex/auth.json` ve `~/.codex/config.toml` gibi isteğe bağlı Codex CLI dosyaları da kullanılabilir.
Yerel Codex app-server'ınızın kullandığı aynı kimlik doğrulama materyalini kullanın.

## En küçük yapılandırma

`openai/gpt-5.5` kullanın, paketlenmiş Plugin'i etkinleştirin ve `codex` test altyapısını zorlayın:

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
      model: "openai/gpt-5.5",
      embeddedHarness: {
        runtime: "codex",
        fallback: "none",
      },
    },
  },
}
```

Yapılandırmanız `plugins.allow` kullanıyorsa `codex` değerini de oraya ekleyin:

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

`agents.defaults.model` veya bir agent modelini
`codex/<model>` olarak ayarlayan eski yapılandırmalar, paketlenmiş `codex` Plugin'ini hâlâ otomatik etkinleştirir. Yeni yapılandırmalar
yukarıdaki açık `embeddedHarness` girdisiyle birlikte `openai/<model>` tercih etmelidir.

## Diğer modelleri değiştirmeden Codex ekleme

Eski `codex/*` referanslarının Codex'i, diğer her şey için de PI'yi seçmesini istediğinizde `runtime: "auto"` kullanın.
Yeni yapılandırmalarda, test altyapısını kullanması gereken agent'larda açık `runtime: "codex"` tercih edin.

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
        primary: "openai/gpt-5.5",
        fallbacks: ["openai/gpt-5.5", "anthropic/claude-opus-4-6"],
      },
      models: {
        "openai/gpt-5.5": { alias: "gpt" },
        "anthropic/claude-opus-4-6": { alias: "opus" },
      },
      embeddedHarness: {
        runtime: "codex",
        fallback: "pi",
      },
    },
  },
}
```

Bu yapıyla:

- `/model gpt` veya `/model openai/gpt-5.5`, bu yapılandırma için Codex app-server test altyapısını kullanır.
- `/model opus`, Anthropic sağlayıcı yolunu kullanır.
- Codex olmayan bir model seçilirse PI uyumluluk test altyapısı olarak kalır.

## Yalnızca Codex kullanılan dağıtımlar

Her gömülü agent turunun Codex test altyapısını kullandığını kanıtlamanız gerektiğinde
PI geri dönüşünü devre dışı bırakın:

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
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

Geri dönüş devre dışıyken, Codex Plugin'i devre dışıysa,
app-server çok eskiyse veya app-server başlatılamıyorsa OpenClaw erken başarısız olur.

## Agent başına Codex

Varsayılan agent normal
otomatik seçim davranışını korurken tek bir agent'ı yalnızca Codex yapabilirsiniz:

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
        model: "openai/gpt-5.5",
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
OpenClaw oturumu oluşturur ve Codex test altyapısı gerektiğinde kendi sidecar app-server
thread'ini oluşturur veya sürdürür. `/reset`, bu thread için OpenClaw oturum bağını temizler
ve sonraki turun test altyapısını mevcut yapılandırmadan yeniden çözmesine izin verir.

## Model keşfi

Varsayılan olarak Codex Plugin'i app-server'dan kullanılabilir modelleri ister. Eğer
keşif başarısız olur veya zaman aşımına uğrarsa şunlar için paketlenmiş bir geri dönüş kataloğu kullanır:

- GPT-5.5
- GPT-5.4 mini
- GPT-5.2

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

Başlangıçta Codex'i yoklamaktan kaçınmak ve geri dönüş kataloğuna bağlı kalmak istediğinizde
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

## App-server bağlantısı ve ilkesi

Varsayılan olarak Plugin, Codex'i yerelde şu komutla başlatır:

```bash
codex app-server --listen stdio://
```

Varsayılan olarak OpenClaw, yerel Codex test altyapısı oturumlarını YOLO modunda başlatır:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` ve
`sandbox: "danger-full-access"`. Bu, otonom Heartbeat'ler için kullanılan güvenilir yerel işletici duruşudur:
Codex, kimsenin yanıtlamak için başında olmadığı yerel onay istemlerinde durmadan shell ve ağ araçlarını kullanabilir.

Codex guardian tarafından gözden geçirilen onaylara katılmak için `appServer.mode:
"guardian"` ayarlayın:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            mode: "guardian",
            serviceTier: "fast",
          },
        },
      },
    },
  },
}
```

Guardian, yerel bir Codex onay gözden geçiricisidir. Codex sandbox dışına çıkmak, çalışma alanı dışına yazmak veya ağ erişimi gibi izinler eklemek istediğinde, bu onay isteğini insan istemi yerine bir reviewer alt agent'ına yönlendirir. Reviewer, Codex'in risk çerçevesini uygular ve belirli isteği onaylar veya reddeder. YOLO modundan daha fazla güvenlik önlemi istediğinizde ancak gözetimsiz agent'ların ilerleme kaydetmesini de istediğinizde Guardian kullanın.

`guardian` ön ayarı `approvalPolicy: "on-request"`, `approvalsReviewer: "guardian_subagent"` ve `sandbox: "workspace-write"` değerlerine genişler. Tekil ilke alanları yine de `mode` değerini geçersiz kılar; bu nedenle gelişmiş dağıtımlar ön ayarı açık seçimlerle karıştırabilir.

Zaten çalışan bir app-server için WebSocket taşıma türünü kullanın:

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

| Alan                | Varsayılan                               | Anlamı                                                                                                    |
| ------------------- | ---------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `transport`         | `"stdio"`                                | `"stdio"` Codex'i başlatır; `"websocket"` `url` adresine bağlanır.                                       |
| `command`           | `"codex"`                                | stdio taşıma türü için çalıştırılabilir dosya.                                                            |
| `args`              | `["app-server", "--listen", "stdio://"]` | stdio taşıma türü için bağımsız değişkenler.                                                              |
| `url`               | ayarlanmamış                             | WebSocket app-server URL'si.                                                                              |
| `authToken`         | ayarlanmamış                             | WebSocket taşıma türü için Bearer token.                                                                  |
| `headers`           | `{}`                                     | Ek WebSocket başlıkları.                                                                                  |
| `requestTimeoutMs`  | `60000`                                  | app-server kontrol düzlemi çağrıları için zaman aşımı.                                                   |
| `mode`              | `"yolo"`                                 | YOLO veya guardian tarafından gözden geçirilen yürütme için ön ayar.                                     |
| `approvalPolicy`    | `"never"`                                | Thread başlatma/sürdürme/tur aşamasına gönderilen yerel Codex onay ilkesi.                               |
| `sandbox`           | `"danger-full-access"`                   | Thread başlatma/sürdürme aşamasına gönderilen yerel Codex sandbox modu.                                  |
| `approvalsReviewer` | `"user"`                                 | Codex Guardian'ın istemleri gözden geçirmesi için `"guardian_subagent"` kullanın.                        |
| `serviceTier`       | ayarlanmamış                             | İsteğe bağlı Codex app-server hizmet katmanı: `"fast"`, `"flex"` veya `null`. Geçersiz eski değerler yok sayılır. |

Eski ortam değişkenleri, eşleşen yapılandırma alanı ayarlanmamışsa yerel test için geri dönüş olarak hâlâ çalışır:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` kaldırıldı. Bunun yerine
`plugins.entries.codex.config.appServer.mode: "guardian"` veya
tek seferlik yerel test için `OPENCLAW_CODEX_APP_SERVER_MODE=guardian` kullanın. Tekrarlanabilir dağıtımlar için yapılandırma tercih edilir; çünkü Plugin davranışını Codex test altyapısı kurulumunun geri kalanıyla aynı incelenmiş dosyada tutar.

## Yaygın tarifler

Varsayılan stdio taşıma türüyle yerel Codex:

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

PI geri dönüşü devre dışı bırakılmış, yalnızca Codex test altyapısı doğrulaması:

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

Guardian tarafından gözden geçirilen Codex onayları:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            mode: "guardian",
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

Model değiştirme OpenClaw tarafından denetlenmeye devam eder. Bir OpenClaw oturumu
mevcut bir Codex thread'ine bağlandığında, sonraki tur şu anda seçili olan
OpenAI modelini, sağlayıcıyı, onay ilkesini, sandbox'ı ve hizmet katmanını yeniden
app-server'a gönderir. `openai/gpt-5.5` modelinden `openai/gpt-5.2` modeline geçmek,
thread bağını korur ancak Codex'ten yeni seçilen modelle devam etmesini ister.

## Codex komutu

Paketlenmiş Plugin, yetkili slash komutu olarak `/codex` kaydeder. Bu komut
geneldir ve OpenClaw metin komutlarını destekleyen her kanalda çalışır.

Yaygın biçimler:

- `/codex status`, canlı app-server bağlantısını, modelleri, hesabı, hız sınırlarını, MCP sunucularını ve Skills'i gösterir.
- `/codex models`, canlı Codex app-server modellerini listeler.
- `/codex threads [filter]`, son Codex thread'lerini listeler.
- `/codex resume <thread-id>`, geçerli OpenClaw oturumunu mevcut bir Codex thread'ine bağlar.
- `/codex compact`, Codex app-server'dan bağlı thread üzerinde Compaction yapmasını ister.
- `/codex review`, bağlı thread için yerel Codex incelemesini başlatır.
- `/codex account`, hesap ve hız sınırı durumunu gösterir.
- `/codex mcp`, Codex app-server MCP sunucu durumunu listeler.
- `/codex skills`, Codex app-server Skills listesini gösterir.

`/codex resume`, test altyapısının normal turlar için kullandığı aynı sidecar bağ dosyasını yazar.
Sonraki iletide OpenClaw bu Codex thread'ini sürdürür, şu anda seçili
OpenClaw modelini app-server'a geçirir ve genişletilmiş geçmişi
etkin tutar.

Komut yüzeyi Codex app-server `0.118.0` veya daha yenisini gerektirir. Tekil
kontrol yöntemleri, gelecekteki veya özel bir app-server bu JSON-RPC yöntemini sunmuyorsa
`unsupported by this Codex app-server` olarak bildirilir.

## Kanca sınırları

Codex test altyapısının üç kanca katmanı vardır:

| Katman                                | Sahip                    | Amaç                                                                |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| OpenClaw Plugin kancaları             | OpenClaw                 | PI ve Codex test altyapıları arasında ürün/Plugin uyumluluğu.       |
| Codex app-server uzantı middleware'i  | Paketlenmiş OpenClaw Plugin'leri | OpenClaw dinamik araçları etrafında tur başına uyarlayıcı davranışı. |
| Codex yerel kancaları                 | Codex                    | Codex yapılandırmasından düşük düzey Codex yaşam döngüsü ve yerel araç ilkesi. |

OpenClaw, OpenClaw Plugin davranışını yönlendirmek için proje veya genel Codex `hooks.json` dosyalarını kullanmaz. Codex yerel kancaları,
shell ilkesi, yerel araç sonucu incelemesi, durdurma işleme ve yerel Compaction/model yaşam döngüsü gibi Codex'e ait işlemler için yararlıdır; ancak bunlar OpenClaw Plugin API'si değildir.

OpenClaw dinamik araçları için Codex çağrıyı istedikten sonra aracı OpenClaw yürütür; bu nedenle
OpenClaw, test altyapısı uyarlayıcısında sahip olduğu Plugin ve middleware davranışını tetikler.
Codex yerel araçları için kanonik araç kaydı Codex'e aittir.
OpenClaw seçili olayları yansıtabilir, ancak Codex bu işlemi app-server veya yerel kanca
geri çağrıları üzerinden sunmadığı sürece yerel Codex thread'ini yeniden yazamaz.

Daha yeni Codex app-server derlemeleri yerel Compaction ve model yaşam döngüsü
kanca olaylarını sunduğunda OpenClaw bu protokol desteğini sürüm kapısı arkasında tutmalı ve
anlamların dürüst olduğu yerlerde olayları mevcut OpenClaw kanca sözleşmesine eşlemelidir.
O zamana kadar OpenClaw'ın `before_compaction`, `after_compaction`, `llm_input` ve
`llm_output` olayları uyarlayıcı düzeyi gözlemlerdir; Codex'in iç istek veya Compaction yüklerinin bire bir yakalanmış hâli değildir.

Codex yerel `hook/started` ve `hook/completed` app-server bildirimleri, yörünge ve hata ayıklama için `codex_app_server.hook` agent olayları olarak yansıtılır.
Bunlar OpenClaw Plugin kancalarını çağırmaz.

## Araçlar, medya ve Compaction

Codex test altyapısı yalnızca düşük düzey gömülü agent yürütücüsünü değiştirir.

OpenClaw yine de araç listesini oluşturur ve test altyapısından dinamik araç sonuçlarını alır.
Metin, görseller, video, müzik, TTS, onaylar ve mesajlaşma aracı çıktısı normal OpenClaw teslim yolu üzerinden akmaya devam eder.

Codex MCP araç onay istemleri, Codex `_meta.codex_approval_kind` değerini
`"mcp_tool_call"` olarak işaretlediğinde OpenClaw'ın Plugin onay akışı üzerinden yönlendirilir. Codex `request_user_input` istemleri, kaynağı olan sohbete geri gönderilir ve sıraya alınan sonraki takip iletisi ek bağlam olarak yönlendirilmek yerine bu yerel
sunucu isteğine yanıt verir. Diğer MCP istem talepleri yine kapalı şekilde başarısız olur.

Seçili model Codex test altyapısını kullandığında yerel thread Compaction işlemi Codex app-server'a devredilir.
OpenClaw kanal geçmişi, arama, `/new`, `/reset` ve gelecekteki model veya test altyapısı değişimi için bir transcript yansıtması tutar. Bu yansıtmaya kullanıcı istemi, son asistan metni ve app-server bunları yayarsa hafif Codex
akıl yürütme veya plan kayıtları da dahildir. Şu anda OpenClaw yalnızca yerel Compaction başlangıç ve tamamlanma sinyallerini kaydeder. Henüz insan tarafından okunabilir bir Compaction özeti veya Codex'in Compaction sonrasında hangi girdileri tuttuğuna dair denetlenebilir bir liste sunmaz.

Kanonik yerel thread Codex'e ait olduğu için `tool_result_persist` şu anda
Codex yerel araç sonucu kayıtlarını yeniden yazmaz. Yalnızca
OpenClaw'ın kendisine ait bir oturum transcript araç sonucunu yazdığı durumlarda uygulanır.

Medya üretimi PI gerektirmez. Görsel, video, müzik, PDF, TTS ve medya
anlama; `agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel` ve
`messages.tts` gibi eşleşen sağlayıcı/model ayarlarını kullanmaya devam eder.

## Sorun giderme

**`/model` içinde Codex görünmüyor:** `plugins.entries.codex.enabled` değerini etkinleştirin,
`embeddedHarness.runtime: "codex"` ile bir `openai/gpt-*` model seçin (veya eski bir
`codex/*` referansı kullanın) ve `plugins.allow` değerinin `codex`i dışlayıp dışlamadığını denetleyin.

**OpenClaw, Codex yerine PI kullanıyor:** hiçbir Codex test altyapısı çalıştırmayı sahiplenmezse
OpenClaw uyumluluk arka ucu olarak PI kullanabilir. Test sırasında Codex seçimini zorlamak için
`embeddedHarness.runtime: "codex"` ayarlayın veya hiçbir Plugin test altyapısı eşleşmediğinde başarısız olmak için
`embeddedHarness.fallback: "none"` kullanın. Codex app-server bir kez seçildiğinde
başarısızlıkları ek geri dönüş yapılandırması olmadan doğrudan görünür.

**App-server reddediliyor:** app-server el sıkışmasının
`0.118.0` veya daha yeni bir sürüm bildirmesi için Codex'i yükseltin.

**Model keşfi yavaş:** `plugins.entries.codex.config.discovery.timeoutMs`
değerini düşürün veya keşfi devre dışı bırakın.

**WebSocket taşıma türü hemen başarısız oluyor:** `appServer.url`, `authToken`
ve uzak app-server'ın aynı Codex app-server protokol sürümünü konuştuğunu denetleyin.

**Codex olmayan bir model PI kullanıyor:** `embeddedHarness.runtime: "codex"` değerini zorlamadıysanız
(veya eski bir `codex/*` referansı seçmediyseniz) bu beklenen davranıştır. Düz
`openai/gpt-*` ve diğer sağlayıcı referansları normal sağlayıcı yollarında kalır.

## İlgili

- [Agent Harness Plugin'leri](/tr/plugins/sdk-agent-harness)
- [Model sağlayıcıları](/tr/concepts/model-providers)
- [Yapılandırma başvurusu](/tr/gateway/configuration-reference)
- [Test](/tr/help/testing-live#live-codex-app-server-harness-smoke)
