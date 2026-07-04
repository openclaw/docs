---
read_when:
    - Codex düzeneğinin tüm yapılandırma alanlarına ihtiyacınız var
    - App-server aktarımını, kimlik doğrulamayı, keşfi veya zaman aşımı davranışını değiştiriyorsunuz
    - Codex harness başlangıcında, model keşfinde veya ortam yalıtımında hata ayıklıyorsunuz
summary: Codex harness için yapılandırma, kimlik doğrulama, keşif ve uygulama sunucusu referansı
title: Codex test düzeneği referansı
x-i18n:
    generated_at: "2026-07-04T20:40:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f1ffe2404dd35df36a706c098f99b841a9664baf76ee5d712836bb35d9ac78bc
    source_path: plugins/codex-harness-reference.md
    workflow: 16
---

Bu başvuru, birlikte gelen `codex` Plugin için ayrıntılı yapılandırmayı kapsar. Kurulum ve yönlendirme kararları için
[Codex harness](/tr/plugins/codex-harness) ile başlayın.

## Plugin yapılandırma yüzeyi

Tüm Codex harness ayarları `plugins.entries.codex.config` altında yer alır.

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

| Alan                       | Varsayılan              | Anlam                                                                                                                                                |
| -------------------------- | ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `discovery`                | etkin                   | Codex app-server `model/list` için model keşfi ayarları.                                                                                             |
| `appServer`                | yönetilen stdio app-server | Taşıma, komut, kimlik doğrulama, onay, sandbox ve zaman aşımı ayarları.                                                                           |
| `codexDynamicToolsLoading` | `"searchable"`          | OpenClaw dinamik araçlarını doğrudan ilk Codex araç bağlamına koymak için `"direct"` kullanın.                                                       |
| `codexDynamicToolsExclude` | `[]`                    | Codex app-server dönüşlerinden çıkarılacak ek OpenClaw dinamik araç adları.                                                                          |
| `codexPlugins`             | devre dışı              | Taşınmış kaynak-kurulumlu seçilmiş pluginler için yerel Codex plugin/uygulama desteği. Bkz. [Yerel Codex pluginleri](/tr/plugins/codex-native-plugins). |
| `computerUse`              | devre dışı              | Codex Computer Use kurulumu. Bkz. [Codex Computer Use](/tr/plugins/codex-computer-use).                                                                 |

## App-server taşıması

Varsayılan olarak OpenClaw, birlikte gelen Plugin ile sevk edilen yönetilen Codex ikilisini başlatır:

```bash
codex app-server --listen stdio://
```

Bu, app-server sürümünü yerelde kurulmuş olabilecek ayrı Codex CLI yerine birlikte gelen `codex` Plugin ile bağlantılı tutar. `appServer.command` değerini yalnızca kasıtlı olarak farklı bir yürütülebilir dosya çalıştırmak istediğinizde ayarlayın.

Zaten çalışan bir app-server için WebSocket taşımasını kullanın:

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

| Alan                                          | Varsayılan                                            | Anlam                                                                                                                                                                                                                                                                                                                                                                                              |
| --------------------------------------------- | ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                                   | `"stdio"`                                             | `"stdio"` Codex'i başlatır; `"websocket"` `url` adresine bağlanır.                                                                                                                                                                                                                                                                                                                                 |
| `homeScope`                                   | `"agent"`                                             | `"agent"` Codex durumunu her OpenClaw ajanı için yalıtır. `"user"` yerel `$CODEX_HOME` veya `~/.codex` değerini paylaşır, yerel kimlik doğrulamayı kullanır ve yalnızca sahip için iş parçacığı yönetimini etkinleştirir. Kullanıcı kapsamı stdio gerektirir.                                                                                                                                     |
| `command`                                     | yönetilen Codex ikili dosyası                         | stdio aktarımı için çalıştırılabilir dosya. Yönetilen ikili dosyayı kullanmak için ayarlamadan bırakın.                                                                                                                                                                                                                                                                                            |
| `args`                                        | `["app-server", "--listen", "stdio://"]`              | stdio aktarımı için bağımsız değişkenler.                                                                                                                                                                                                                                                                                                                                                           |
| `url`                                         | ayarlanmamış                                          | WebSocket app-server URL'si.                                                                                                                                                                                                                                                                                                                                                                        |
| `authToken`                                   | ayarlanmamış                                          | WebSocket aktarımı için Bearer belirteci. Değişmez bir dizeyi veya `${CODEX_APP_SERVER_TOKEN}` gibi bir SecretInput değerini kabul eder.                                                                                                                                                                                                                                                            |
| `headers`                                     | `{}`                                                  | Ek WebSocket üst bilgileri. Üst bilgi değerleri, değişmez dizeleri veya örneğin `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"` gibi SecretInput değerlerini kabul eder.                                                                                                                                                                                                            |
| `clearEnv`                                    | `[]`                                                  | OpenClaw devralınan ortamını oluşturduktan sonra başlatılan stdio app-server işleminden kaldırılan ek ortam değişkeni adları.                                                                                                                                                                                                                                                                       |
| `remoteWorkspaceRoot`                         | ayarlanmamış                                          | Uzak Codex app-server çalışma alanı kökü. Ayarlandığında OpenClaw, yerel çalışma alanı kökünü çözümlenen OpenClaw çalışma alanından çıkarır, bu uzak kökün altında geçerli cwd sonekini korur ve Codex'e yalnızca son app-server cwd değerini gönderir. cwd çözümlenen OpenClaw çalışma alanı kökünün dışındaysa OpenClaw, uzak app-server'a gateway yerel yolu göndermek yerine kapalı şekilde başarısız olur. |
| `requestTimeoutMs`                            | `60000`                                               | app-server denetim düzlemi çağrıları için zaman aşımı.                                                                                                                                                                                                                                                                                                                                             |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                               | Codex bir turu kabul ettikten sonra veya OpenClaw `turn/completed` beklerken tur kapsamlı bir app-server isteğinden sonra sessiz pencere.                                                                                                                                                                                                                                                           |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                              | OpenClaw `turn/completed` beklerken bir araç devrinden, yerel araç tamamlanmasından, araç sonrası ham asistan ilerlemesinden, ham akıl yürütme tamamlanmasından veya akıl yürütme ilerlemesinden sonra kullanılan tamamlanma-boşta ve ilerleme koruması. Bunu, araç sonrası sentezin nihai asistan yayın bütçesinden meşru olarak daha uzun süre sessiz kalabileceği güvenilir veya ağır iş yükleri için kullanın. |
| `mode`                                        | yerel Codex gereksinimleri YOLO'ya izin vermedikçe `"yolo"` | YOLO veya guardian tarafından incelenen yürütme için ön ayar.                                                                                                                                                                                                                                                                                                                                      |
| `approvalPolicy`                              | `"never"` veya izin verilen bir guardian onay politikası | İş parçacığı başlatma, sürdürme ve tura gönderilen yerel Codex onay politikası.                                                                                                                                                                                                                                                                                                                    |
| `sandbox`                                     | `"danger-full-access"` veya izin verilen bir guardian sandbox | İş parçacığı başlatma ve sürdürmeye gönderilen yerel Codex sandbox modu. Etkin OpenClaw sandbox'ları `danger-full-access` turlarını Codex `workspace-write` değerine daraltır; turun ağ bayrağı OpenClaw sandbox çıkışını izler.                                                                                                                                                                    |
| `approvalsReviewer`                           | `"user"` veya izin verilen bir guardian inceleyici     | İzin verildiğinde Codex'in yerel onay istemlerini incelemesini sağlamak için `"auto_review"` kullanın.                                                                                                                                                                                                                                                                                             |
| `defaultWorkspaceDir`                         | geçerli işlem dizini                                  | `--cwd` atlandığında `/codex bind` tarafından kullanılan çalışma alanı.                                                                                                                                                                                                                                                                                                                            |
| `serviceTier`                                 | ayarlanmamış                                          | İsteğe bağlı Codex app-server hizmet katmanı. `"priority"` hızlı mod yönlendirmeyi etkinleştirir, `"flex"` esnek işlemeyi ister ve `null` geçersiz kılmayı temizler. Eski `"fast"`, `"priority"` olarak kabul edilir.                                                                                                                                                                               |
| `networkProxy`                                | devre dışı                                            | app-server komutları için Codex izin profili ağ kullanımına katılım sağlar. OpenClaw, seçilen `permissions.<profile>.network` yapılandırmasını tanımlar ve bunu `sandbox` göndermek yerine `default_permissions` ile seçer.                                                                                                                                                                         |
| `experimental.sandboxExecServer`              | `false`                                               | Yerel Codex yürütmesinin etkin OpenClaw sandbox içinde çalışabilmesi için Codex app-server 0.132.0 veya daha yenisiyle OpenClaw sandbox destekli bir Codex ortamı kaydeden önizleme katılımı.                                                                                                                                                                                                      |

`appServer.networkProxy` açıktır çünkü Codex sandbox sözleşmesini değiştirir.
Etkinleştirildiğinde OpenClaw, oluşturulan izin profilinin Codex tarafından
yönetilen ağı başlatabilmesi için Codex iş parçacığı yapılandırmasında
`features.network_proxy.enabled` ve `default_permissions` değerlerini de ayarlar.
Varsayılan olarak OpenClaw, profil gövdesinden çakışmaya dayanıklı bir
`openclaw-network-<fingerprint>` profil adı oluşturur; `profileName` değerini
yalnızca kararlı bir yerel ad gerektiğinde kullanın.

```js
export default {
  plugins: {
    entries: {
      codex: {
        config: {
          appServer: {
            sandbox: "workspace-write",
            networkProxy: {
              enabled: true,
              domains: {
                "api.openai.com": "allow",
                "blocked.example.com": "deny",
              },
              allowUpstreamProxy: true,
              proxyUrl: "http://127.0.0.1:3128",
            },
          },
        },
      },
    },
  },
};
```

Normal app-server çalışma zamanı `danger-full-access` olacaksa,
`networkProxy` etkinleştirildiğinde oluşturulan izin profili için workspace tarzı
dosya sistemi erişimi kullanılır. Codex tarafından yönetilen ağ uygulaması sandbox'lı ağdır,
bu nedenle tam erişimli bir profil giden trafiği korumaz.

Plugin, eski veya sürümlendirilmemiş app-server el sıkışmalarını engeller. Codex app-server,
kararlı sürüm olarak `0.125.0` veya daha yenisini bildirmelidir.

OpenClaw, loopback olmayan WebSocket app-server URL'lerini uzak olarak ele alır ve
`appServer.authToken` ya da bir `Authorization` üstbilgisi üzerinden kimlik taşıyan
WebSocket kimlik doğrulaması gerektirir. `appServer.authToken` ve her `appServer.headers.*`
değeri bir SecretInput olabilir; secrets çalışma zamanı, OpenClaw app-server başlatma seçeneklerini
oluşturmadan önce SecretRefs ve env kısaltmasını çözer; çözümlenmemiş yapılandırılmış
SecretRefs, herhangi bir token veya üstbilgi gönderilmeden önce başarısız olur. Yerel Codex
pluginleri yapılandırıldığında, OpenClaw bu pluginleri yüklemek veya yenilemek için bağlı
app-server'ın plugin kontrol düzlemini kullanır ve ardından plugin tarafından sahip olunan
uygulamaların Codex iş parçacığında görünmesi için uygulama envanterini yeniler. `app/list`
halen yetkili envanter ve meta veri kaynağıdır, ancak OpenClaw ilkesi, Codex şu anda
devre dışı olarak işaretlese bile listelenen erişilebilir bir uygulama için `thread/start`'ın
`config.apps[appId].enabled = true` gönderip göndermeyeceğine karar verir. Bilinmeyen veya
eksik uygulama kimlikleri kapalı başarısız kalır; bu yol yalnızca marketplace pluginlerini
`plugin/install` üzerinden etkinleştirir ve envanteri yeniler. OpenClaw'ı yalnızca
OpenClaw tarafından yönetilen plugin yüklemelerini ve uygulama envanteri yenilemelerini
kabul edeceğine güvenilen uzak app-server'lara bağlayın.

## Onay ve sandbox modları

Yerel stdio app-server oturumları varsayılan olarak YOLO moduna geçer:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` ve
`sandbox: "danger-full-access"`. Bu güvenilir yerel operatör duruşu,
gözetimsiz OpenClaw dönüşlerinin ve Heartbeat'lerin, yanıtlayacak kimsenin olmadığı
yerel onay istemleri olmadan ilerlemesini sağlar.

Codex'in yerel sistem gereksinimleri dosyası örtük YOLO onayına,
gözden geçirene veya sandbox değerlerine izin vermiyorsa, OpenClaw örtük varsayılanı
bunun yerine guardian olarak ele alır ve izin verilen guardian izinlerini seçer.
`tools.exec.mode: "auto"` ayrıca guardian tarafından gözden geçirilen Codex onaylarını
zorunlu kılar ve güvenli olmayan eski `approvalPolicy: "never"` veya
`sandbox: "danger-full-access"` geçersiz kılmalarını korumaz; bilinçli bir onaysız duruş
için `tools.exec.mode: "full"` ayarlayın. Aynı gereksinimler dosyasındaki ana makine adıyla
eşleşen `[[remote_sandbox_config]]` girdileri, sandbox varsayılan kararında dikkate alınır.

Codex guardian tarafından gözden geçirilen onaylar için `appServer.mode: "guardian"` ayarlayın:

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
`approvalsReviewer: "auto_review"` ve `sandbox: "workspace-write"` olarak genişler.
Tekil ilke alanları `mode` değerini geçersiz kılar. Eski `guardian_subagent` gözden geçiren
değeri hâlâ uyumluluk takma adı olarak kabul edilir, ancak yeni yapılandırmalar
`auto_review` kullanmalıdır.

Bir OpenClaw sandbox'ı etkinken, yerel Codex app-server süreci yine de Gateway ana makinesinde
çalışır. Bu nedenle OpenClaw, Codex ana makine tarafı sandbox'ını OpenClaw sandbox arka ucu ile
eşdeğer kabul etmek yerine, o dönüş için Codex yerel Code Mode'u, kullanıcı MCP sunucularını
ve uygulama destekli plugin yürütmesini devre dışı bırakır. Kabuk erişimi, normal exec/process
araçları kullanılabilir olduğunda `sandbox_exec` ve `sandbox_process` gibi OpenClaw sandbox
destekli dinamik araçlar üzerinden sunulur.

Ubuntu/AppArmor ana makinelerinde, etkin OpenClaw sandbox'ı olmadan yerel Codex
`workspace-write` çalıştırmayı bilinçli olarak kullandığınızda, Codex bwrap kabuk komutu
başlamadan önce `workspace-write` altında başarısız olabilir. `bwrap: setting up uid map: Permission denied`
veya `bwrap: loopback: Failed RTM_NEWADDR: Operation not permitted` görürseniz,
daha geniş Docker container ayrıcalıkları vermek yerine `openclaw doctor` çalıştırın ve
OpenClaw hizmet kullanıcısı için bildirilen ana makine namespace ilkesini düzeltin.
Hizmet süreci için kapsamlı bir AppArmor profili tercih edin; `kernel.apparmor_restrict_unprivileged_userns=0`
fallback'i ana makine genelindedir ve güvenlik ödünleşimleri vardır.

## Sandbox'lı yerel yürütme

Kararlı varsayılan kapalı başarısızdır: etkin OpenClaw sandbox'ı, aksi halde Codex app-server
ana makinesinden çalışacak yerel Codex yürütme yüzeylerini devre dışı bırakır.
Codex'in uzak ortam desteğini OpenClaw'ın sandbox arka ucuyla denemek istediğinizde yalnızca
`appServer.experimental.sandboxExecServer: true` kullanın. Bu önizleme yolu Codex app-server
0.132.0 veya daha yenisini gerektirir.

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            experimental: {
              sandboxExecServer: true,
            },
          },
        },
      },
    },
  },
}
```

Bayrak açıkken ve geçerli OpenClaw oturumu sandbox'lıyken, OpenClaw etkin sandbox tarafından
desteklenen bir local loopback exec-server başlatır, bunu Codex app-server'a kaydeder ve
Codex iş parçacığını ve dönüşünü OpenClaw'a ait bu ortamla başlatır. App-server ortamı
kaydedemezse, çalışma sessizce ana makine yürütmesine fallback yapmak yerine kapalı başarısız olur.

Bu önizleme yolu yalnızca yereldir. Uzak bir WebSocket app-server, aynı ana makinede çalışmadığı
sürece loopback exec-server'a erişemez; bu nedenle OpenClaw bu birleşimi reddeder.

## Kimlik doğrulama ve ortam yalıtımı

Varsayılan ajan başına home içinde kimlik doğrulama şu sırayla seçilir:

1. Ajan için açık bir OpenClaw Codex kimlik doğrulama profili.
2. O ajanın Codex home'u içindeki app-server'ın mevcut hesabı.
3. Yalnızca yerel stdio app-server başlatmaları için, app-server hesabı yoksa ve OpenAI
   kimlik doğrulaması hâlâ gerekiyorsa `CODEX_API_KEY`, ardından `OPENAI_API_KEY`.

OpenClaw bir ChatGPT abonelik tarzı Codex kimlik doğrulama profili gördüğünde, başlatılan
Codex alt sürecinden `CODEX_API_KEY` ve `OPENAI_API_KEY` değerlerini kaldırır. Bu, Gateway düzeyi
API anahtarlarını embeddings veya doğrudan OpenAI modelleri için kullanılabilir tutarken yerel
Codex app-server dönüşlerinin yanlışlıkla API üzerinden faturalandırılmasını önler.

Açık Codex API anahtarı profilleri ve yerel stdio env anahtarı fallback'i, miras alınan
alt süreç env yerine app-server oturum açmasını kullanır. WebSocket app-server bağlantıları
Gateway env API anahtarı fallback'i almaz; açık bir kimlik doğrulama profili veya uzak
app-server'ın kendi hesabını kullanın.

Stdio app-server başlatmaları varsayılan olarak OpenClaw'ın süreç ortamını miras alır.
OpenClaw, Codex app-server hesap köprüsüne sahiptir ve `CODEX_HOME` değerini o ajanın
OpenClaw durumu altında ajan başına bir dizine ayarlar. Bu, Codex yapılandırmasının,
hesapların, plugin cache/verisinin ve iş parçacığı durumunun operatörün kişisel `~/.codex`
home'undan sızmak yerine OpenClaw ajanı kapsamında kalmasını sağlar.

Yerel Codex durumunu Codex Desktop ve CLI ile paylaşmak için `appServer.homeScope: "user"`
ayarlayın. Bu yalnızca yerel stdio modu, ayarlandığında `$CODEX_HOME`, aksi halde `~/.codex`
kullanır; yerel kimlik doğrulama, yapılandırma, pluginler ve iş parçacıkları buna dahildir.
OpenClaw, app-server için kimlik doğrulama profili köprüsünü atlar. Doğrulanmış sahip dönüşleri,
bu iş parçacıklarını listelemek, aramak, okumak, fork'lamak, yeniden adlandırmak, arşivlemek ve
geri yüklemek için `codex_threads` kullanabilir. OpenClaw'da devam etmeden önce bir iş parçacığını
fork'layın; bağımsız Codex süreçleri aynı iş parçacığı için eşzamanlı yazıcıları koordine etmez.

OpenClaw normal yerel app-server başlatmaları için `HOME` değerini yeniden yazmaz. `openclaw`,
`gh`, `git`, bulut CLI'ları ve kabuk komutları gibi Codex tarafından çalıştırılan alt süreçler
normal süreç home'unu görür ve kullanıcı home yapılandırmasını ve tokenlarını bulabilir. Codex
ayrıca `$HOME/.agents/skills` ve `$HOME/.agents/plugins/marketplace.json` keşfedebilir; bu
`.agents` keşfi bilinçli olarak operatör home'u ile paylaşılır ve yalıtılmış `~/.codex`
durumundan ayrıdır.

Varsayılan ajan kapsamında, OpenClaw pluginleri ve OpenClaw skill snapshot'ları hâlâ
OpenClaw'ın kendi plugin registry'si ve skill loader'ı üzerinden akar; kişisel Codex
`~/.codex` varlıkları akmaz. Codex home'undan yalıtılmış bir OpenClaw ajanının parçası olması
gereken kullanışlı Codex CLI skills veya pluginleriniz varsa, bunları açıkça envantere alın:

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

Bir dağıtım ek ortam yalıtımı gerektiriyorsa, bu değişkenleri `appServer.clearEnv` öğesine ekleyin:

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
OpenClaw yerel başlatma normalleştirmesi sırasında bu listeden `CODEX_HOME` ve `HOME` değerlerini
kaldırır: `CODEX_HOME` seçilen ajan veya kullanıcı kapsamına işaret etmeye devam eder ve
`HOME`, alt süreçlerin normal kullanıcı home durumunu kullanabilmesi için miras alınmış kalır.

## Dinamik araçlar

Codex dinamik araçları varsayılan olarak `searchable` yüklemeye geçer. OpenClaw, Codex yerel
workspace işlemlerini çoğaltan dinamik araçları sunmaz:

- `read`
- `write`
- `edit`
- `apply_patch`
- `exec`
- `process`
- `update_plan`

Mesajlaşma, medya, cron, tarayıcı, nodes, gateway, `heartbeat_respond` ve `web_search` gibi
kalan OpenClaw entegrasyon araçlarının çoğu, `openclaw` namespace'i altında Codex araç araması
üzerinden kullanılabilir. Bu, ilk model bağlamını daha küçük tutar. `sessions_yield` ve yalnızca
message-tool kaynak yanıtları doğrudan kalır çünkü bunlar dönüş kontrol sözleşmeleridir.
`sessions_spawn`, Codex'in yerel `spawn_agent` yüzeyinin birincil Codex alt ajan yüzeyi kalması
için searchable kalır; açık OpenClaw veya ACP delegasyonu ise yine `openclaw` dinamik araç
namespace'i üzerinden kullanılabilir.

`codexDynamicToolsLoading: "direct"` değerini yalnızca ertelenmiş dinamik araçları arayamayan
özel bir Codex app-server'a bağlanırken veya tam araç yükünde hata ayıklarken ayarlayın.

## Zaman aşımları

OpenClaw'a ait dinamik araç çağrıları `appServer.requestTimeoutMs` değerinden bağımsız olarak
sınırlandırılır. Her Codex `item/tool/call` isteği, bu sıradaki ilk kullanılabilir zaman aşımını
kullanır:

- Pozitif çağrı başına `timeoutMs` argümanı.
- `image_generate` için `agents.defaults.imageGenerationModel.timeoutMs`.
- Yapılandırılmış zaman aşımı olmayan `image_generate` için 120 saniyelik görüntü oluşturma varsayılanı.
- Medya anlama `image` aracı için `tools.media.image.timeoutSeconds` milisaniyeye dönüştürülür
  veya 60 saniyelik medya varsayılanı kullanılır. Görüntü anlama için bu, isteğin kendisine
  uygulanır ve önceki hazırlık çalışmaları tarafından azaltılmaz.
- 90 saniyelik dinamik araç varsayılanı.

Bu watchdog, dış dinamik `item/tool/call` bütçesidir. Sağlayıcıya özgü istek zaman aşımları
bu çağrının içinde çalışır ve kendi zaman aşımı semantiklerini korur. Dinamik araç bütçeleri
600000 ms ile sınırlıdır. Zaman aşımında OpenClaw, desteklendiği yerlerde araç sinyalini iptal
eder ve Codex'e başarısız bir dinamik araç yanıtı döndürür; böylece dönüş, oturumu `processing`
durumunda bırakmak yerine devam edebilir.

Codex bir dönüşü kabul ettikten ve OpenClaw dönüş kapsamlı bir app-server isteğine yanıt verdikten
sonra, harness Codex'in geçerli dönüşte ilerleme kaydetmesini ve sonunda yerel dönüşü
`turn/completed` ile bitirmesini bekler. App-server `appServer.turnCompletionIdleTimeoutMs`
süresince sessiz kalırsa, OpenClaw en iyi çabayla Codex dönüşünü keser, tanılama zaman aşımı
kaydeder ve takip sohbet mesajlarının eski bir yerel dönüşün arkasında kuyruğa girmemesi için
OpenClaw oturum şeridini serbest bırakır.

Aynı tur için çoğu terminal olmayan bildirim bu kısa izleme zamanlayıcısını devre dışı bırakır
çünkü Codex turun hâlâ canlı olduğunu kanıtlamıştır. Araç devirleri daha uzun bir
araç sonrası boşta kalma bütçesi kullanır: OpenClaw bir `item/tool/call` yanıtı
döndürdükten sonra, `commandExecution` gibi yerel araç öğeleri tamamlandıktan
sonra, ham `custom_tool_call_output` tamamlanmalarından sonra ve araç sonrası ham
asistan ilerlemesi, ham akıl yürütme tamamlanmaları veya akıl yürütme ilerlemesinden
sonra. Koruma, yapılandırıldığında
`appServer.postToolRawAssistantCompletionIdleTimeoutMs` değerini kullanır ve
aksi halde varsayılan olarak beş dakikaya ayarlanır. Aynı araç sonrası bütçesi,
Codex bir sonraki geçerli tur olayını yayımlamadan önceki sessiz sentez penceresi
için ilerleme izleme zamanlayıcısını da uzatır. Akıl yürütme tamamlanmaları,
commentary `agentMessage` tamamlanmaları ve araç öncesi ham akıl yürütme veya
asistan ilerlemesini otomatik bir nihai yanıt izleyebilir; bu nedenle bunlar
oturum hattını hemen serbest bırakmak yerine ilerleme sonrası yanıt korumasını
kullanır. Yalnızca nihai/commentary olmayan tamamlanmış `agentMessage` öğeleri
ve araç öncesi ham asistan tamamlanmaları asistan çıktısı serbest bırakmasını
kurar: Codex daha sonra `turn/completed` olmadan sessiz kalırsa OpenClaw en iyi
çabayla yerel turu keser ve oturum hattını serbest bırakır. Asistan, araç,
etkin öğe veya yan etki kanıtı olmayan tur tamamlama boşta kalma zaman aşımları
dahil, yeniden oynatmaya uygun stdio uygulama sunucusu hataları yeni bir
uygulama sunucusu denemesinde bir kez yeniden denenir. Güvenli olmayan zaman
aşımları yine de takılmış uygulama sunucusu istemcisini emekliye ayırır ve
OpenClaw oturum hattını serbest bırakır. Ayrıca eski yerel iş parçacığı bağını
otomatik yeniden oynatmak yerine temizler. Tamamlama izleme zaman aşımları
Codex’e özgü zaman aşımı metni gösterir: yeniden oynatmaya uygun durumlar yanıtın
eksik olabileceğini söylerken, güvenli olmayan durumlar kullanıcıya yeniden
denemeden önce geçerli durumu doğrulamasını söyler. Herkese açık zaman aşımı
tanıları, son uygulama sunucusu bildirim yöntemi, ham asistan yanıt öğesi
kimliği/türü/rolü, etkin istek/öğe sayıları ve kurulmuş izleme durumu gibi yapısal
alanlar içerir. Son bildirim ham bir asistan yanıt öğesiyse, sınırlı bir asistan
metni önizlemesi de içerir. Ham prompt veya araç içeriği içermezler.

## Model keşfi

Varsayılan olarak Codex Plugin, kullanılabilir modeller için uygulama sunucusuna
sorar. Model kullanılabilirliği Codex uygulama sunucusuna aittir; bu nedenle liste,
OpenClaw paketlenen `@openai/codex` sürümünü yükselttiğinde veya bir dağıtım
`appServer.command` değerini farklı bir Codex ikilisine yönlendirdiğinde
değişebilir. Kullanılabilirlik hesap kapsamlı da olabilir. Bu harness ve hesap
için canlı kataloğu görmek üzere çalışan bir Gateway üzerinde `/codex models`
kullanın.

Keşif başarısız olursa veya zaman aşımına uğrarsa OpenClaw şunlar için paketlenmiş
bir yedek katalog kullanır:

- GPT-5.5
- GPT-5.4 mini

Geçerli paketlenmiş harness `@openai/codex` `0.142.5` sürümüdür. Bu paketlenmiş
uygulama sunucusuna yapılan bir `model/list` yoklaması şu herkese açık seçici
satırlarını döndürdü:

| Model kimliği         | Girdi biçimleri | Akıl yürütme düzeyleri   |
| --------------------- | ---------------- | ------------------------ |
| `gpt-5.5`             | metin, görüntü   | low, medium, high, xhigh |
| `gpt-5.4`             | metin, görüntü   | low, medium, high, xhigh |
| `gpt-5.4-mini`        | metin, görüntü   | low, medium, high, xhigh |
| `gpt-5.3-codex-spark` | metin            | low, medium, high, xhigh |

Gizli modeller, dahili veya özelleşmiş akışlar için uygulama sunucusu kataloğu
tarafından döndürülebilir, ancak bunlar normal model seçici seçenekleri değildir.

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

Başlatmanın Codex’i yoklamasını önlemek ve yalnızca yedek kataloğu kullanmak
istediğinizde keşfi devre dışı bırakın:

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

## Çalışma alanı bootstrap dosyaları

Codex, yerel proje dokümanı keşfi aracılığıyla `AGENTS.md` dosyasını kendisi
işler. OpenClaw sentetik Codex proje dokümanı dosyaları yazmaz veya persona
dosyaları için Codex yedek dosya adlarına bağlı değildir; çünkü Codex yedekleri
yalnızca `AGENTS.md` eksik olduğunda uygulanır.

OpenClaw çalışma alanı eşitliği için Codex harness diğer bootstrap dosyalarını
çözer. `SOUL.md`, `IDENTITY.md`, `TOOLS.md` ve `USER.md`, etkin aracı,
kullanılabilir çalışma alanı rehberliğini ve kullanıcı profilini tanımladıkları
için OpenClaw Codex geliştirici talimatları olarak iletilir. Kompakt OpenClaw
Skills listesi, tur kapsamlı iş birliği geliştirici talimatları olarak iletilir.
`HEARTBEAT.md` içeriği enjekte edilmez; heartbeat turları, dosya mevcut ve boş
değil olduğunda dosyayı okumak için iş birliği modu işaretçisi alır. Yapılandırılmış
aracı çalışma alanından gelen `MEMORY.md` içeriği, bu çalışma alanı için bellek
araçları kullanılabilir olduğunda yerel Codex tur girdisine yapıştırılmaz; mevcut
olduğunda harness, tur kapsamlı iş birliği geliştirici talimatlarına küçük bir
çalışma alanı belleği işaretçisi ekler ve kalıcı bellek ilgili olduğunda Codex
`memory_search` veya `memory_get` kullanmalıdır. Araçlar devre dışıysa, bellek
arama kullanılamıyorsa veya etkin çalışma alanı aracı bellek çalışma alanından
farklıysa, `MEMORY.md` normal sınırlı tur bağlamı yolunu kullanır.
`BOOTSTRAP.md` mevcut olduğunda OpenClaw tur girdisi referans bağlamı olarak
iletilir.

## Ortam geçersiz kılmaları

Ortam geçersiz kılmaları yerel test için kullanılabilir kalır:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN`, `appServer.command` ayarlanmamış olduğunda
yönetilen ikiliyi atlar.

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` kaldırıldı. Bunun yerine
`plugins.entries.codex.config.appServer.mode: "guardian"` kullanın veya tek
seferlik yerel test için `OPENCLAW_CODEX_APP_SERVER_MODE=guardian` kullanın.
Tekrarlanabilir dağıtımlar için yapılandırma tercih edilir; çünkü Plugin
davranışını Codex harness kurulumunun geri kalanıyla aynı gözden geçirilmiş dosyada
tutar.

## İlgili

- [Codex harness](/tr/plugins/codex-harness)
- [Codex harness çalışma zamanı](/tr/plugins/codex-harness-runtime)
- [Yerel Codex Plugin’leri](/tr/plugins/codex-native-plugins)
- [Codex Computer Use](/tr/plugins/codex-computer-use)
- [OpenAI sağlayıcısı](/tr/providers/openai)
- [Yapılandırma referansı](/tr/gateway/configuration-reference)
