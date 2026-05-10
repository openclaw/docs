---
read_when:
    - Codex koşumunun tüm yapılandırma alanlarına ihtiyacınız var
    - Uygulama sunucusunun taşıma, kimlik doğrulama, keşif veya zaman aşımı davranışını değiştiriyorsunuz
    - Codex harness başlangıcını, model keşfini veya ortam yalıtımını hata ayıklıyorsunuz
summary: Codex düzeneği için yapılandırma, kimlik doğrulama, keşif ve uygulama sunucusu referansı
title: Codex harness başvurusu
x-i18n:
    generated_at: "2026-05-10T19:44:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 72767810c9448015a1ce7f35263dba576151b18c1f4a43ba531d45728241f095
    source_path: plugins/codex-harness-reference.md
    workflow: 16
---

Bu başvuru, paketle birlikte gelen `codex` Plugin için ayrıntılı yapılandırmayı kapsar. Kurulum ve yönlendirme kararları için
[Codex harness](/tr/plugins/codex-harness) ile başlayın.

## Plugin yapılandırma yüzeyi

Tüm Codex harness ayarları `plugins.entries.codex.config` altında bulunur.

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
          appServer: {
            mode: "guardian",
          },
        },
      },
    },
  },
}
```

Desteklenen üst düzey alanlar:

| Alan                       | Varsayılan              | Anlam                                                                                                                                     |
| -------------------------- | ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `discovery`                | etkin                   | Codex app-server `model/list` için model keşfi ayarları.                                                                                  |
| `appServer`                | yönetilen stdio app-server | Aktarım, komut, kimlik doğrulama, onay, sandbox ve zaman aşımı ayarları.                                                                  |
| `codexDynamicToolsLoading` | `"searchable"`          | OpenClaw dinamik araçlarını doğrudan ilk Codex araç bağlamına koymak için `"direct"` kullanın.                                             |
| `codexDynamicToolsExclude` | `[]`                    | Codex app-server dönüşlerinden çıkarılacak ek OpenClaw dinamik araç adları.                                                               |
| `codexPlugins`             | devre dışı              | Taşınmış, kaynak kurulumlu seçili Plugin'ler için yerel Codex Plugin/uygulama desteği. Bkz. [Yerel Codex Plugin'leri](/tr/plugins/codex-native-plugins). |
| `computerUse`              | devre dışı              | Codex Computer Use kurulumu. Bkz. [Codex Computer Use](/tr/plugins/codex-computer-use).                                                      |

## App-server aktarımı

Varsayılan olarak OpenClaw, paketle birlikte gelen Plugin ile gönderilen yönetilen Codex ikilisini başlatır:

```bash
codex app-server --listen stdio://
```

Bu, app-server sürümünü yerelde kurulu olabilecek ayrı Codex CLI yerine paketle gelen `codex` Plugin'e bağlı tutar. `appServer.command` değerini yalnızca bilerek farklı bir çalıştırılabilir dosya çalıştırmak istediğinizde ayarlayın.

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
            url: "ws://gateway-host:39175",
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

| Alan                          | Varsayılan                                             | Anlam                                                                                                                                                                                         |
| ----------------------------- | ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                   | `"stdio"`                                              | `"stdio"` Codex'i başlatır; `"websocket"` `url` değerine bağlanır.                                                                                                                            |
| `command`                     | yönetilen Codex ikilisi                                | stdio aktarımı için çalıştırılabilir dosya. Yönetilen ikiliyi kullanmak için ayarlamadan bırakın.                                                                                              |
| `args`                        | `["app-server", "--listen", "stdio://"]`               | stdio aktarımı için argümanlar.                                                                                                                                                                |
| `url`                         | ayarlanmamış                                           | WebSocket app-server URL'si.                                                                                                                                                                   |
| `authToken`                   | ayarlanmamış                                           | WebSocket aktarımı için Bearer token.                                                                                                                                                          |
| `headers`                     | `{}`                                                   | Ek WebSocket başlıkları.                                                                                                                                                                       |
| `clearEnv`                    | `[]`                                                   | OpenClaw devralınan ortamını oluşturduktan sonra başlatılan stdio app-server sürecinden kaldırılan ek ortam değişkeni adları.                                                                 |
| `requestTimeoutMs`            | `60000`                                                | App-server kontrol düzlemi çağrıları için zaman aşımı.                                                                                                                                         |
| `turnCompletionIdleTimeoutMs` | `60000`                                                | OpenClaw `turn/completed` beklerken dönüş kapsamlı bir app-server isteğinden sonraki sessiz pencere.                                                                                            |
| `mode`                        | yerel Codex gereksinimleri YOLO'ya izin vermiyorsa `"yolo"` dışında | YOLO veya guardian incelemeli yürütme için ön ayar.                                                                                                                                            |
| `approvalPolicy`              | `"never"` veya izin verilen bir guardian onay ilkesi   | İş parçacığı başlatma, sürdürme ve dönüşe gönderilen yerel Codex onay ilkesi.                                                                                                                   |
| `sandbox`                     | `"danger-full-access"` veya izin verilen bir guardian sandbox | İş parçacığı başlatma ve sürdürmeye gönderilen yerel Codex sandbox modu.                                                                                                                       |
| `approvalsReviewer`           | `"user"` veya izin verilen bir guardian inceleyici     | İzin verildiğinde Codex'in yerel onay istemlerini incelemesine izin vermek için `"auto_review"` kullanın.                                                                                       |
| `defaultWorkspaceDir`         | geçerli süreç dizini                                   | `--cwd` atlandığında `/codex bind` tarafından kullanılan çalışma alanı.                                                                                                                         |
| `serviceTier`                 | ayarlanmamış                                           | İsteğe bağlı Codex app-server hizmet katmanı. `"priority"` hızlı mod yönlendirmesini etkinleştirir, `"flex"` esnek işlemeyi ister ve `null` geçersiz kılmayı temizler. Eski `"fast"`, `"priority"` olarak kabul edilir. |

Plugin, daha eski veya sürümlendirilmemiş app-server el sıkışmalarını engeller. Codex app-server kararlı `0.125.0` veya daha yeni bir sürüm bildirmelidir.

## Onay ve sandbox modları

Yerel stdio app-server oturumları varsayılan olarak YOLO moduna ayarlanır:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` ve
`sandbox: "danger-full-access"`. Bu güvenilir yerel operatör duruşu, gözetimsiz OpenClaw dönüşlerinin ve Heartbeat'lerin yanıtlayacak kimse yokken yerel onay istemleri olmadan ilerlemesini sağlar.

Codex'in yerel sistem gereksinimleri dosyası örtük YOLO onayı, inceleyici veya sandbox değerlerine izin vermiyorsa OpenClaw örtük varsayılanı bunun yerine guardian olarak değerlendirir ve izin verilen guardian izinlerini seçer. Aynı gereksinimler dosyasındaki ana makine adıyla eşleşen `[[remote_sandbox_config]]` girdileri, sandbox varsayılan kararı için dikkate alınır.

Codex guardian incelemeli onaylar için `appServer.mode: "guardian"` ayarlayın:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            mode: "guardian",
            serviceTier: "priority",
          },
        },
      },
    },
  },
}
```

`guardian` ön ayarı, bu değerlere izin verildiğinde `approvalPolicy: "on-request"`,
`approvalsReviewer: "auto_review"` ve `sandbox: "workspace-write"` değerlerine genişler. Tekil ilke alanları `mode` değerini geçersiz kılar. Daha eski `guardian_subagent` inceleyici değeri hâlâ uyumluluk takma adı olarak kabul edilir, ancak yeni yapılandırmalar `auto_review` kullanmalıdır.

## Kimlik doğrulama ve ortam yalıtımı

Kimlik doğrulama şu sırayla seçilir:

1. Aracı için açık bir OpenClaw Codex kimlik doğrulama profili.
2. App-server'ın o aracının Codex ana dizinindeki mevcut hesabı.
3. Yalnızca yerel stdio app-server başlatmaları için, app-server hesabı yoksa ve OpenAI kimlik doğrulaması hâlâ gerekiyorsa önce `CODEX_API_KEY`, sonra
   `OPENAI_API_KEY`.

OpenClaw, ChatGPT abonelik tarzı bir Codex kimlik doğrulama profili gördüğünde başlatılan Codex alt sürecinden `CODEX_API_KEY` ve `OPENAI_API_KEY` değerlerini kaldırır. Bu, Gateway düzeyi API anahtarlarını embeddings veya doğrudan OpenAI modelleri için kullanılabilir tutarken yerel Codex app-server dönüşlerinin yanlışlıkla API üzerinden faturalandırılmasını önler.

Açık Codex API anahtarı profilleri ve yerel stdio ortam anahtarı geri dönüşü, devralınan alt süreç ortamı yerine app-server oturum açmasını kullanır. WebSocket app-server bağlantıları Gateway ortam API anahtarı geri dönüşü almaz; açık bir kimlik doğrulama profili veya uzak app-server'ın kendi hesabını kullanın.

Stdio app-server başlatmaları varsayılan olarak OpenClaw'ın süreç ortamını devralır, ancak OpenClaw Codex app-server hesap köprüsünün sahibidir ve hem `CODEX_HOME` hem de `HOME` değerlerini o aracının OpenClaw durumu altındaki aracı başına dizinlere ayarlar. Codex'in kendi skill yükleyicisi `$CODEX_HOME/skills` ve `$HOME/.agents/skills` okur, bu nedenle iki değer de yerel app-server başlatmaları için yalıtılır. Bu, Codex'e özgü skill'leri, Plugin'leri, yapılandırmayı, hesapları ve iş parçacığı durumunu operatörün kişisel Codex CLI ana dizininden sızdırmak yerine OpenClaw aracısına kapsamlar.

OpenClaw Plugin'leri ve OpenClaw skill anlık görüntüleri yine OpenClaw'ın kendi Plugin kayıt defteri ve skill yükleyicisi üzerinden akar. Kişisel Codex CLI varlıkları akmaz. Bir OpenClaw aracısının parçası olması gereken yararlı Codex CLI skill'leriniz veya Plugin'leriniz varsa bunları açıkça envantere alın:

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

Bir dağıtım ek ortam yalıtımına ihtiyaç duyuyorsa bu değişkenleri `appServer.clearEnv` içine ekleyin:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            clearEnv: ["CODEX_API_KEY", "OPENAI_API_KEY"],
          },
        },
      },
    },
  },
}
```

`appServer.clearEnv` yalnızca başlatılan Codex app-server alt sürecini etkiler.
`CODEX_HOME` ve `HOME`, yerel başlatmalarda OpenClaw'ın aracı başına Codex yalıtımı için ayrılmış kalır.

## Dinamik araçlar

Codex dinamik araçları varsayılan olarak `searchable` yüklemeye ayarlanır. OpenClaw, Codex'e özgü çalışma alanı işlemlerini yineleyen dinamik araçları açığa çıkarmaz:

- `read`
- `write`
- `edit`
- `apply_patch`
- `exec`
- `process`
- `update_plan`

Kalan OpenClaw entegrasyon araçları; mesajlaşma, oturumlar, medya, cron,
tarayıcı, nodes, gateway, `heartbeat_respond` ve `web_search` gibi araçlar,
`openclaw` ad alanı altında Codex araç araması üzerinden kullanılabilir. Bu,
başlangıçtaki model bağlamını daha küçük tutar. `sessions_yield` ve yalnızca
mesaj aracına ait kaynak yanıtları doğrudan kalır, çünkü bunlar dönüş denetimi
sözleşmeleridir.

`codexDynamicToolsLoading: "direct"` değerini yalnızca ertelenmiş dinamik
araçları arayamayan özel bir Codex app-server'a bağlanırken veya tam araç
yükünü hata ayıklarken ayarlayın.

## Zaman Aşımları

OpenClaw'a ait dinamik araç çağrıları, `appServer.requestTimeoutMs` değerinden
bağımsız olarak sınırlandırılır. Her Codex `item/tool/call` isteği, bu sırayla
ilk kullanılabilir zaman aşımını kullanır:

- Çağrı başına pozitif bir `timeoutMs` bağımsız değişkeni.
- `image_generate` için `agents.defaults.imageGenerationModel.timeoutMs`.
- Medya anlama `image` aracı için milisaniyeye dönüştürülmüş
  `tools.media.image.timeoutSeconds` ya da 60 saniyelik medya varsayılanı.
- 30 saniyelik dinamik araç varsayılanı.

Dinamik araç bütçeleri 600000 ms ile sınırlandırılır. Zaman aşımında OpenClaw,
desteklendiği yerlerde araç sinyalini iptal eder ve Codex'e başarısız bir
dinamik araç yanıtı döndürür; böylece oturum `processing` durumunda kalmak
yerine dönüş devam edebilir.

OpenClaw, Codex dönüş kapsamlı bir app-server isteğine yanıt verdikten sonra,
harness ayrıca Codex'in yerel dönüşü `turn/completed` ile bitirmesini bekler.
App-server bu yanıttan sonra `appServer.turnCompletionIdleTimeoutMs` süresi
boyunca sessiz kalırsa OpenClaw en iyi çabayla Codex dönüşünü keser, tanılama
amaçlı bir zaman aşımı kaydeder ve takip eden sohbet mesajlarının eski bir
yerel dönüşün arkasında kuyruğa alınmaması için OpenClaw oturum şeridini
serbest bırakır.

Aynı dönüşe ait herhangi bir sonlandırıcı olmayan bildirim,
`rawResponseItem/completed` dahil, bu kısa bekçi zamanlayıcısını devre dışı
bırakır; çünkü Codex dönüşün hâlâ canlı olduğunu kanıtlamıştır. Daha uzun
sonlandırıcı bekçi, gerçekten takılı kalan dönüşleri korumaya devam eder. Zaman
aşımı tanılamaları, son app-server bildirim yöntemini ve ham assistant yanıt
öğeleri için öğe türünü, rolü, kimliği ve sınırlandırılmış bir assistant metin
önizlemesini içerir.

## Model keşfi

Varsayılan olarak Codex Plugin'i, app-server'dan kullanılabilir modelleri ister.
Model kullanılabilirliği Codex app-server'a aittir; bu nedenle liste, OpenClaw
pakete dahil `@openai/codex` sürümünü yükselttiğinde veya bir dağıtım
`appServer.command` değerini farklı bir Codex ikilisine yönelttiğinde
değişebilir. Kullanılabilirlik hesap kapsamlı da olabilir. Bu harness ve hesap
için canlı kataloğu görmek üzere çalışan bir gateway üzerinde `/codex models`
kullanın.

Keşif başarısız olursa veya zaman aşımına uğrarsa OpenClaw şunlar için pakete
dahil yedek kataloğu kullanır:

- GPT-5.5
- GPT-5.4 mini
- GPT-5.2

Geçerli pakete dahil harness `@openai/codex` `0.130.0` sürümüdür. Bu pakete
dahil app-server'a yapılan bir `model/list` yoklaması şunu döndürdü:

| Model kimliği         | Varsayılan | Gizli | Girdi kipleri  | Akıl yürütme eforları    |
| --------------------- | ---------- | ----- | -------------- | ------------------------ |
| `gpt-5.5`             | Evet       | Hayır | metin, görüntü | low, medium, high, xhigh |
| `gpt-5.4`             | Hayır      | Hayır | metin, görüntü | low, medium, high, xhigh |
| `gpt-5.4-mini`        | Hayır      | Hayır | metin, görüntü | low, medium, high, xhigh |
| `gpt-5.3-codex`       | Hayır      | Hayır | metin, görüntü | low, medium, high, xhigh |
| `gpt-5.3-codex-spark` | Hayır      | Hayır | metin          | low, medium, high, xhigh |
| `gpt-5.2`             | Hayır      | Hayır | metin, görüntü | low, medium, high, xhigh |

Gizli modeller app-server kataloğu tarafından dahili veya özelleşmiş akışlar
için döndürülebilir, ancak normal model seçici seçenekleri değildir.

Keşfi `plugins.entries.codex.config.discovery` altında ayarlayın:

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

Başlangıcın Codex'i yoklamaktan kaçınmasını ve yalnızca yedek kataloğu
kullanmasını istediğinizde keşfi devre dışı bırakın:

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

## Çalışma alanı başlatma dosyaları

Codex, yerel proje belgesi keşfi üzerinden `AGENTS.md` dosyasını kendisi
işler. OpenClaw sentetik Codex proje belgesi dosyaları yazmaz veya persona
dosyaları için Codex yedek dosya adlarına bağlı değildir; çünkü Codex
yedekleri yalnızca `AGENTS.md` eksik olduğunda uygulanır.

OpenClaw çalışma alanı eşliği için Codex harness, mevcut olduklarında `SOUL.md`,
`TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` ve
`MEMORY.md` dahil diğer başlatma dosyalarını çözer ve bunları `thread/start` ve
`thread/resume` üzerinde Codex geliştirici talimatları aracılığıyla iletir. Bu,
çalışma alanı personası ve profil bağlamını, `AGENTS.md` dosyasını
çoğaltmadan yerel Codex davranış şekillendirme şeridinde görünür tutar.

## Ortam geçersiz kılmaları

Ortam geçersiz kılmaları yerel test için kullanılabilir kalır:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN`, `appServer.command` ayarlanmamışsa yönetilen
ikiliyi atlar.

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` kaldırıldı. Bunun yerine
`plugins.entries.codex.config.appServer.mode: "guardian"` kullanın ya da tek
seferlik yerel test için `OPENCLAW_CODEX_APP_SERVER_MODE=guardian` kullanın.
Config, tekrarlanabilir dağıtımlar için tercih edilir; çünkü Plugin davranışını
Codex harness kurulumunun geri kalanıyla aynı incelenmiş dosyada tutar.

## İlgili

- [Codex harness](/tr/plugins/codex-harness)
- [Codex harness runtime](/tr/plugins/codex-harness-runtime)
- [Yerel Codex plugins](/tr/plugins/codex-native-plugins)
- [Codex Computer Use](/tr/plugins/codex-computer-use)
- [OpenAI provider](/tr/providers/openai)
- [Yapılandırma başvurusu](/tr/gateway/configuration-reference)
