---
read_when:
    - Tüm Codex harness yapılandırma alanlarına ihtiyacınız var
    - Uygulama sunucusu taşıma, kimlik doğrulama, keşif veya zaman aşımı davranışını değiştiriyorsunuz
    - Codex harness başlatmasını, model keşfini veya ortam yalıtımını hata ayıklıyorsunuz
summary: Codex harness için yapılandırma, kimlik doğrulama, keşif ve uygulama sunucusu başvurusu
title: Codex harness başvurusu
x-i18n:
    generated_at: "2026-07-04T10:59:10Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 43c905586346c8d7c255b58b706eb82543fd1ca05588e459a257e8f9f4cf36d4
    source_path: plugins/codex-harness-reference.md
    workflow: 16
---

Bu referans, birlikte gelen `codex` Plugin'inin ayrıntılı yapılandırmasını kapsar. Kurulum ve yönlendirme kararları için
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
| `appServer`                | yönetilen stdio app-server | Taşıma, komut, kimlik doğrulama, onay, sandbox ve zaman aşımı ayarları.                                                                  |
| `codexDynamicToolsLoading` | `"searchable"`          | OpenClaw dinamik araçlarını doğrudan başlangıç Codex araç bağlamına koymak için `"direct"` kullanın.                                      |
| `codexDynamicToolsExclude` | `[]`                    | Codex app-server dönüşlerinden çıkarılacak ek OpenClaw dinamik araç adları.                                                               |
| `codexPlugins`             | devre dışı              | Taşınmış, kaynak kurulumlu seçilmiş Plugin'ler için yerel Codex Plugin/uygulama desteği. Bkz. [Yerel Codex Plugin'leri](/tr/plugins/codex-native-plugins). |
| `computerUse`              | devre dışı              | Codex Computer Use kurulumu. Bkz. [Codex Computer Use](/tr/plugins/codex-computer-use).                                                      |

## App-server taşıması

Varsayılan olarak OpenClaw, birlikte gelen Plugin ile gönderilen yönetilen Codex ikilisini başlatır:

```bash
codex app-server --listen stdio://
```

Bu, app-server sürümünü yerelde kurulu olabilecek ayrı Codex CLI yerine birlikte gelen `codex` Plugin'ine bağlı tutar. `appServer.command` değerini yalnızca bilerek farklı bir yürütülebilir dosya çalıştırmak istediğinizde ayarlayın.

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

| Alan                                          | Varsayılan                                            | Anlam                                                                                                                                                                                                                                                                                                                                                                                          |
| --------------------------------------------- | ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                                   | `"stdio"`                                             | `"stdio"` Codex'i başlatır; `"websocket"` `url` adresine bağlanır.                                                                                                                                                                                                                                                                                                                            |
| `homeScope`                                   | `"agent"`                                             | `"agent"` Codex durumunu her OpenClaw ajanı için yalıtır. `"user"` yerel `$CODEX_HOME` veya `~/.codex` değerini paylaşır, yerel kimlik doğrulamayı kullanır ve yalnızca sahip tarafından kullanılabilen iş parçacığı yönetimini etkinleştirir. Kullanıcı kapsamı stdio gerektirir.                                                                                                             |
| `command`                                     | yönetilen Codex ikili dosyası                         | Stdio aktarımı için çalıştırılabilir dosya. Yönetilen ikili dosyayı kullanmak için ayarlanmamış bırakın.                                                                                                                                                                                                                                                                                       |
| `args`                                        | `["app-server", "--listen", "stdio://"]`              | Stdio aktarımı için argümanlar.                                                                                                                                                                                                                                                                                                                                                                |
| `url`                                         | ayarlanmamış                                          | WebSocket app-server URL'si.                                                                                                                                                                                                                                                                                                                                                                   |
| `authToken`                                   | ayarlanmamış                                          | WebSocket aktarımı için Bearer belirteci. Değişmez bir dizeyi veya `${CODEX_APP_SERVER_TOKEN}` gibi SecretInput değerini kabul eder.                                                                                                                                                                                                                                                           |
| `headers`                                     | `{}`                                                  | Ek WebSocket başlıkları. Başlık değerleri değişmez dizeleri veya SecretInput değerlerini kabul eder, örneğin `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"`.                                                                                                                                                                                                                 |
| `clearEnv`                                    | `[]`                                                  | OpenClaw devralınan ortamını oluşturduktan sonra başlatılan stdio app-server sürecinden kaldırılan ek ortam değişkeni adları.                                                                                                                                                                                                                                                                  |
| `remoteWorkspaceRoot`                         | ayarlanmamış                                          | Uzak Codex app-server çalışma alanı kökü. Ayarlandığında OpenClaw, yerel çalışma alanı kökünü çözümlenen OpenClaw çalışma alanından çıkarır, geçerli cwd sonekini bu uzak kök altında korur ve yalnızca son app-server cwd değerini Codex'e gönderir. cwd çözümlenen OpenClaw çalışma alanı kökünün dışındaysa OpenClaw, uzak app-server'a gateway'e yerel bir yol göndermek yerine kapalı şekilde başarısız olur. |
| `requestTimeoutMs`                            | `60000`                                               | App-server kontrol düzlemi çağrıları için zaman aşımı.                                                                                                                                                                                                                                                                                                                                         |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                               | Codex bir turu kabul ettikten sonra veya OpenClaw `turn/completed` beklerken tur kapsamlı bir app-server isteğinden sonraki sessiz pencere.                                                                                                                                                                                                                                                     |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                              | OpenClaw `turn/completed` beklerken bir araç devrinden, yerel araç tamamlanmasından, araç sonrası ham asistan ilerlemesinden, ham akıl yürütme tamamlanmasından veya akıl yürütme ilerlemesinden sonra kullanılan tamamlama-boşta ve ilerleme koruması. Bunu, araç sonrası sentezin son asistan yayımlama bütçesinden meşru şekilde daha uzun süre sessiz kalabileceği güvenilir veya ağır iş yükleri için kullanın. |
| `mode`                                        | yerel Codex gereksinimleri YOLO'ya izin vermedikçe `"yolo"` | YOLO veya guardian incelemeli yürütme için ön ayar.                                                                                                                                                                                                                                                                                                                                            |
| `approvalPolicy`                              | `"never"` veya izin verilen bir guardian onay ilkesi   | İş parçacığı başlatma, sürdürme ve tura gönderilen yerel Codex onay ilkesi.                                                                                                                                                                                                                                                                                                                    |
| `sandbox`                                     | `"danger-full-access"` veya izin verilen bir guardian sandbox | İş parçacığı başlatma ve sürdürmeye gönderilen yerel Codex sandbox modu. Etkin OpenClaw sandbox'ları `danger-full-access` turlarını Codex `workspace-write` düzeyine daraltır; tur ağ bayrağı OpenClaw sandbox çıkışını izler.                                                                                                                                                                   |
| `approvalsReviewer`                           | `"user"` veya izin verilen bir guardian inceleyici     | İzin verildiğinde Codex'in yerel onay istemlerini incelemesine izin vermek için `"auto_review"` kullanın.                                                                                                                                                                                                                                                                                       |
| `defaultWorkspaceDir`                         | geçerli süreç dizini                                  | `--cwd` atlandığında `/codex bind` tarafından kullanılan çalışma alanı.                                                                                                                                                                                                                                                                                                                         |
| `serviceTier`                                 | ayarlanmamış                                          | İsteğe bağlı Codex app-server hizmet katmanı. `"priority"` hızlı mod yönlendirmesini etkinleştirir, `"flex"` flex işlemeyi ister ve `null` geçersiz kılmayı temizler. Eski `"fast"`, `"priority"` olarak kabul edilir.                                                                                                                                                                         |
| `networkProxy`                                | devre dışı                                            | App-server komutları için Codex izin profili ağını kullanmayı seçin. OpenClaw, seçilen `permissions.<profile>.network` yapılandırmasını tanımlar ve `sandbox` göndermek yerine `default_permissions` ile seçer.                                                                                                                                                                                |
| `experimental.sandboxExecServer`              | `false`                                               | Yerel Codex yürütmesinin etkin OpenClaw sandbox'ı içinde çalışabilmesi için Codex app-server 0.132.0 veya daha yenisiyle OpenClaw sandbox destekli bir Codex ortamı kaydeden önizleme katılımı.                                                                                                                                                                                                 |

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

Normal uygulama sunucusu çalışma zamanı `danger-full-access` olacaksa,
`networkProxy` etkinleştirildiğinde oluşturulan izin profili için çalışma alanı
tarzı dosya sistemi erişimi kullanılır. Codex tarafından yönetilen ağ
zorlaması korumalı alanlı ağdır, bu yüzden tam erişimli bir profil giden trafiği
korumaz.

Plugin, eski veya sürümsüz uygulama sunucusu el sıkışmalarını engeller. Codex
uygulama sunucusu kararlı `0.125.0` veya daha yeni bir sürüm bildirmelidir.

OpenClaw, loopback olmayan WebSocket uygulama sunucusu URL'lerini uzak olarak
değerlendirir ve `appServer.authToken` ya da bir `Authorization` üst bilgisi
üzerinden kimlik taşıyan WebSocket kimlik doğrulaması gerektirir.
`appServer.authToken` ve her `appServer.headers.*` değeri bir SecretInput
olabilir; sırlar çalışma zamanı, OpenClaw uygulama sunucusu başlatma
seçeneklerini oluşturmadan önce SecretRef'leri ve env kısayollarını çözümler ve
çözümlenmemiş yapılandırılmış SecretRef'ler herhangi bir belirteç ya da üst
bilgi gönderilmeden önce başarısız olur. Yerel Codex pluginleri
yapılandırıldığında, OpenClaw bu pluginleri yüklemek veya yenilemek için bağlı
uygulama sunucusunun plugin denetim düzlemini kullanır ve ardından plugin
sahipli uygulamaların Codex iş parçacığında görünür olması için uygulama
envanterini yeniler. `app/list` hâlâ yetkili envanter ve meta veri kaynağıdır,
ancak OpenClaw ilkesi, Codex şu anda devre dışı olarak işaretlese bile listelenen
erişilebilir bir uygulama için `thread/start` isteğinin
`config.apps[appId].enabled = true` gönderip göndermeyeceğine karar verir.
Bilinmeyen veya eksik uygulama kimlikleri kapalı hata vermeye devam eder; bu yol
yalnızca marketplace pluginlerini `plugin/install` üzerinden etkinleştirir ve
envanteri yeniler. OpenClaw'ı yalnızca OpenClaw tarafından yönetilen plugin
kurulumlarını ve uygulama envanteri yenilemelerini kabul edeceğine güvenilen
uzak uygulama sunucularına bağlayın.

## Onay ve korumalı alan modları

Yerel stdio uygulama sunucusu oturumları varsayılan olarak YOLO modundadır:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` ve
`sandbox: "danger-full-access"`. Bu güvenilen yerel operatör duruşu, gözetimsiz
OpenClaw turlarının ve Heartbeat'lerin, yanıtlayacak kimse yokken yerel onay
istemleri olmadan ilerlemesini sağlar.

Codex'in yerel sistem gereksinimleri dosyası örtük YOLO onay, gözden geçiren
veya korumalı alan değerlerine izin vermiyorsa, OpenClaw örtük varsayılanı
bunun yerine guardian olarak değerlendirir ve izin verilen guardian izinlerini
seçer. `tools.exec.mode: "auto"` ayrıca guardian tarafından gözden geçirilen
Codex onaylarını zorunlu kılar ve güvenli olmayan eski
`approvalPolicy: "never"` veya `sandbox: "danger-full-access"` geçersiz
kılmalarını korumaz; kasıtlı bir onaysız duruş için `tools.exec.mode: "full"`
ayarlayın. Aynı gereksinimler dosyasındaki ana makine adıyla eşleşen
`[[remote_sandbox_config]]` girdileri, korumalı alan varsayılanı kararı için
dikkate alınır.

Codex guardian tarafından gözden geçirilen onaylar için `appServer.mode:
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
            serviceTier: "priority",
          },
        },
      },
    },
  },
}
```

`guardian` ön ayarı, bu değerlere izin verildiğinde `approvalPolicy:
"on-request"`, `approvalsReviewer: "auto_review"` ve `sandbox:
"workspace-write"` değerlerine genişler. Tek tek ilke alanları `mode` değerini
geçersiz kılar. Eski `guardian_subagent` gözden geçiren değeri hâlâ uyumluluk
takma adı olarak kabul edilir, ancak yeni yapılandırmalar `auto_review`
kullanmalıdır.

Bir OpenClaw korumalı alanı etkin olduğunda, yerel Codex uygulama sunucusu
süreci hâlâ Gateway ana makinesinde çalışır. Bu nedenle OpenClaw, Codex ana
makine tarafı korumalı alanını OpenClaw korumalı alan arka ucu ile eşdeğer
görmek yerine, o tur için Codex yerel Code Mode'u, kullanıcı MCP sunucularını ve
uygulama destekli plugin yürütmeyi devre dışı bırakır. Normal exec/process
araçları kullanılabilir olduğunda kabuk erişimi, `sandbox_exec` ve
`sandbox_process` gibi OpenClaw korumalı alan destekli dinamik araçlar üzerinden
sunulur.

Ubuntu/AppArmor ana makinelerinde, etkin OpenClaw korumalı alanı olmadan yerel
Codex `workspace-write` modunu bilinçli olarak çalıştırdığınızda Codex bwrap,
kabuk komutu başlamadan önce `workspace-write` altında başarısız olabilir.
`bwrap: setting up uid map: Permission denied` veya
`bwrap: loopback: Failed RTM_NEWADDR: Operation not permitted` görürseniz, daha
geniş Docker konteyner ayrıcalıkları vermek yerine `openclaw doctor` çalıştırın
ve OpenClaw hizmet kullanıcısı için bildirilen ana makine ad alanı ilkesini
düzeltin. Hizmet süreci için kapsamlı bir AppArmor profili tercih edin;
`kernel.apparmor_restrict_unprivileged_userns=0` geri dönüşü ana makine
genelindedir ve güvenlik ödünleşimleri vardır.

## Korumalı alanlı yerel yürütme

Kararlı varsayılan kapalı hata vermedir: etkin OpenClaw korumalı alanı,
aksi durumda Codex uygulama sunucusu ana makinesinden çalışacak yerel Codex
yürütme yüzeylerini devre dışı bırakır. Codex'in uzak ortam desteğini
OpenClaw'ın korumalı alan arka ucu ile denemek istediğinizde yalnızca
`appServer.experimental.sandboxExecServer: true` kullanın. Bu önizleme yolu
Codex uygulama sunucusu 0.132.0 veya daha yeni bir sürüm gerektirir.

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

Bayrak açıkken ve geçerli OpenClaw oturumu korumalı alandayken, OpenClaw etkin
korumalı alan tarafından desteklenen bir local loopback exec-server başlatır,
bunu Codex uygulama sunucusuna kaydeder ve Codex iş parçacığını ve turunu bu
OpenClaw sahipli ortamla başlatır. Uygulama sunucusu ortamı kaydedemezse,
çalıştırma sessizce ana makine yürütmesine geri dönmek yerine kapalı hata verir.

Bu önizleme yolu yalnızca yereldir. Uzak bir WebSocket uygulama sunucusu, aynı
ana makinede çalışmıyorsa loopback exec-server'a erişemez, bu yüzden OpenClaw
bu birleşimi reddeder.

## Kimlik doğrulaması ve ortam yalıtımı

Varsayılan ajan başına home içinde, kimlik doğrulaması şu sırayla seçilir:

1. Ajan için açık bir OpenClaw Codex kimlik doğrulama profili.
2. O ajanın Codex home içindeki uygulama sunucusunun mevcut hesabı.
3. Yalnızca yerel stdio uygulama sunucusu başlatmaları için, uygulama sunucusu
   hesabı yoksa ve OpenAI kimlik doğrulaması hâlâ gerekiyorsa `CODEX_API_KEY`,
   ardından `OPENAI_API_KEY`.

OpenClaw, ChatGPT abonelik tarzı bir Codex kimlik doğrulama profili gördüğünde,
oluşturulan Codex alt sürecinden `CODEX_API_KEY` ve `OPENAI_API_KEY`
değişkenlerini kaldırır. Bu, Gateway düzeyi API anahtarlarını embeddings veya
doğrudan OpenAI modelleri için kullanılabilir tutarken yerel Codex uygulama
sunucusu turlarının yanlışlıkla API üzerinden ücretlendirilmesini önler.

Açık Codex API anahtarı profilleri ve yerel stdio env anahtarı geri dönüşü,
devralınan alt süreç env yerine uygulama sunucusu oturum açmasını kullanır.
WebSocket uygulama sunucusu bağlantıları Gateway env API anahtarı geri dönüşünü
almaz; açık bir kimlik doğrulama profili veya uzak uygulama sunucusunun kendi
hesabını kullanın.

Stdio uygulama sunucusu başlatmaları varsayılan olarak OpenClaw'ın süreç
ortamını devralır. OpenClaw, Codex uygulama sunucusu hesap köprüsüne sahiptir ve
`CODEX_HOME` değerini o ajanın OpenClaw durumu altında ajan başına bir dizine
ayarlar. Bu, Codex yapılandırmasını, hesaplarını, plugin önbelleğini/verilerini
ve iş parçacığı durumunu operatörün kişisel `~/.codex` home dizininden sızmak
yerine OpenClaw ajanı kapsamında tutar.

Yerel Codex durumunu Codex Desktop ve CLI ile paylaşmak için
`appServer.homeScope: "user"` ayarlayın. Bu yalnızca yerel stdio modu, ayarlıysa
`$CODEX_HOME`, aksi halde `~/.codex` kullanır; yerel kimlik doğrulaması,
yapılandırma, pluginler ve iş parçacıkları buna dahildir. OpenClaw, uygulama
sunucusu için kimlik doğrulama profili köprüsünü atlar. Doğrulanmış sahip
turları, bu iş parçacıklarını listelemek, aramak, okumak, çatallamak, yeniden
adlandırmak, arşivlemek ve geri yüklemek için `codex_threads` kullanabilir. Bir
iş parçacığını OpenClaw'da sürdürmeden önce çatallayın; bağımsız Codex süreçleri
aynı iş parçacığı için eşzamanlı yazıcıları koordine etmez.

OpenClaw normal yerel uygulama sunucusu başlatmaları için `HOME` değerini
yeniden yazmaz. `openclaw`, `gh`, `git`, bulut CLI'ları ve kabuk komutları gibi
Codex tarafından çalıştırılan alt süreçler normal süreç home değerini görür ve
kullanıcı home yapılandırmasını ve belirteçlerini bulabilir. Codex ayrıca
`$HOME/.agents/skills` ve `$HOME/.agents/plugins/marketplace.json` öğelerini
keşfedebilir; bu `.agents` keşfi kasıtlı olarak operatör home ile paylaşılır ve
yalıtılmış `~/.codex` durumundan ayrıdır.

Varsayılan ajan kapsamında, OpenClaw pluginleri ve OpenClaw skill anlık
görüntüleri hâlâ OpenClaw'ın kendi plugin kaydı ve skill yükleyicisi üzerinden
akar; kişisel Codex `~/.codex` varlıkları akmaz. Bir Codex home dizininden
yalıtılmış bir OpenClaw ajanının parçası olması gereken yararlı Codex CLI
Skills veya pluginleriniz varsa, bunların envanterini açıkça çıkarın:

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

Bir dağıtım ek ortam yalıtımı gerektiriyorsa, bu değişkenleri
`appServer.clearEnv` içine ekleyin:

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

`appServer.clearEnv` yalnızca oluşturulan Codex uygulama sunucusu alt sürecini
etkiler. OpenClaw, yerel başlatma normalleştirmesi sırasında `CODEX_HOME` ve
`HOME` değerlerini bu listeden kaldırır: `CODEX_HOME` seçili ajan veya kullanıcı
kapsamını göstermeye devam eder ve `HOME` devralınmış kalır, böylece alt
süreçler normal kullanıcı home durumunu kullanabilir.

## Dinamik araçlar

Codex dinamik araçları varsayılan olarak `searchable` yüklemeye ayarlanır.
OpenClaw, Codex'e özgü çalışma alanı işlemlerini çoğaltan dinamik araçları
sunmaz:

- `read`
- `write`
- `edit`
- `apply_patch`
- `exec`
- `process`
- `update_plan`

Mesajlaşma, medya, cron, tarayıcı, düğümler, gateway, `heartbeat_respond` ve
`web_search` gibi kalan OpenClaw entegrasyon araçlarının çoğu, `openclaw` ad
alanı altında Codex araç araması üzerinden kullanılabilir. Bu, başlangıç model
bağlamını daha küçük tutar. `sessions_yield` ve yalnızca mesaj aracı kaynaklı
yanıtlar doğrudan kalır çünkü bunlar tur denetimi sözleşmeleridir.
`sessions_spawn` aranabilir kalır, böylece Codex'in yerel `spawn_agent` yüzeyi
birincil Codex alt ajan yüzeyi olmaya devam eder; açık OpenClaw veya ACP
delegasyonu ise `openclaw` dinamik araç ad alanı üzerinden hâlâ kullanılabilir.

`codexDynamicToolsLoading: "direct"` değerini yalnızca ertelenmiş dinamik
araçları arayamayan özel bir Codex uygulama sunucusuna bağlanırken veya tam araç
yükünü hata ayıklarken ayarlayın.

## Zaman aşımları

OpenClaw sahipli dinamik araç çağrıları `appServer.requestTimeoutMs` değerinden
bağımsız olarak sınırlandırılır. Her Codex `item/tool/call` isteği şu sıradaki
ilk kullanılabilir zaman aşımını kullanır:

- Pozitif bir çağrı başına `timeoutMs` argümanı.
- `image_generate` için `agents.defaults.imageGenerationModel.timeoutMs`.
- Yapılandırılmış bir zaman aşımı olmayan `image_generate` için 120 saniyelik
  görsel üretimi varsayılanı.
- Medya anlama `image` aracı için, milisaniyeye dönüştürülen
  `tools.media.image.timeoutSeconds` veya 60 saniyelik medya varsayılanı. Görsel
  anlama için bu, isteğin kendisine uygulanır ve daha önceki hazırlık çalışması
  tarafından azaltılmaz.
- 90 saniyelik dinamik araç varsayılanı.

Bu izleyici, dış dinamik `item/tool/call` bütçesidir. Sağlayıcıya özgü istek
zaman aşımları bu çağrının içinde çalışır ve kendi zaman aşımı semantiklerini
korur. Dinamik araç bütçeleri 600000 ms ile sınırlıdır. Zaman aşımında OpenClaw,
desteklendiğinde araç sinyalini iptal eder ve Codex'e başarısız bir dinamik araç
yanıtı döndürür; böylece tur, oturumu `processing` durumunda bırakmak yerine
devam edebilir.

Codex bir turu kabul ettikten ve OpenClaw tur kapsamlı bir uygulama sunucusu
isteğine yanıt verdikten sonra, harness Codex'in geçerli turda ilerleme
kaydetmesini ve en sonunda yerel turu `turn/completed` ile bitirmesini bekler.
Uygulama sunucusu `appServer.turnCompletionIdleTimeoutMs` boyunca sessiz kalırsa,
OpenClaw en iyi çabayla Codex turunu kesintiye uğratır, tanısal bir zaman aşımı
kaydeder ve takip eden sohbet mesajlarının bayat bir yerel turun arkasında
kuyruğa girmemesi için OpenClaw oturum hattını serbest bırakır.

Aynı tur için çoğu terminal olmayan bildirim bu kısa watchdog'u devreden çıkarır
çünkü Codex turun hâlâ canlı olduğunu kanıtlamıştır. Araç devirleri daha uzun
bir araç sonrası boşta kalma bütçesi kullanır: OpenClaw bir `item/tool/call`
yanıtı döndürdükten sonra, `commandExecution` gibi yerel araç öğeleri
tamamlandıktan sonra, ham `custom_tool_call_output` tamamlanmalarından sonra ve
araç sonrası ham asistan ilerlemesi, ham muhakeme tamamlanmaları veya muhakeme
ilerlemesinden sonra. Koruma, yapılandırıldığında
`appServer.postToolRawAssistantCompletionIdleTimeoutMs` kullanır; aksi halde
varsayılan olarak beş dakika kullanır. Aynı araç sonrası bütçe, Codex sonraki
geçerli tur olayını yayımlamadan önceki sessiz sentez penceresi için ilerleme
watchdog'unu da uzatır. Muhakeme tamamlanmaları, commentary
`agentMessage` tamamlanmaları ve araç öncesi ham muhakeme veya asistan ilerlemesi
otomatik bir son yanıtla izlenebilir; bu yüzden oturum hattını hemen serbest
bırakmak yerine ilerleme sonrası yanıt korumasını kullanırlar. Yalnızca
son/commentary olmayan tamamlanmış `agentMessage` öğeleri ve araç öncesi ham
asistan tamamlanmaları asistan çıktısı serbest bırakmasını kurar: Codex daha
sonra `turn/completed` olmadan sessiz kalırsa, OpenClaw en iyi çabayla yerel
turu keser ve oturum hattını serbest bırakır. Asistan, araç, etkin öğe veya yan
etki kanıtı olmadan tur tamamlanma boşta kalma zaman aşımları dahil, yeniden
oynatması güvenli stdio uygulama sunucusu hataları taze bir uygulama sunucusu
denemesinde bir kez yeniden denenir. Güvenli olmayan zaman aşımları yine de
takılmış uygulama sunucusu istemcisini emekliye ayırır ve OpenClaw oturum
hattını serbest bırakır. Ayrıca otomatik olarak yeniden oynatılmak yerine bayat
yerel thread bağlamasını temizlerler. Tamamlanma izleme zaman aşımları Codex'e
özgü zaman aşımı metni gösterir: yeniden oynatması güvenli durumlar yanıtın
eksik olabileceğini söylerken, güvenli olmayan durumlar kullanıcıya yeniden
denemeden önce geçerli durumu doğrulamasını söyler. Genel zaman aşımı
tanılamaları son uygulama sunucusu bildirim yöntemi, ham asistan yanıt öğesi
kimliği/türü/rolü, etkin istek/öğe sayıları ve kurulmuş izleme durumu gibi
yapısal alanlar içerir. Son bildirim ham bir asistan yanıt öğesiyse, ayrıca
sınırlı bir asistan metni önizlemesi içerirler. Ham prompt veya araç içeriği
içermezler.

## Model keşfi

Varsayılan olarak Codex Plugin'i uygulama sunucusundan kullanılabilir modelleri
ister. Model kullanılabilirliğinin sahibi Codex uygulama sunucusudur; bu yüzden
OpenClaw paketlenmiş `@openai/codex` sürümünü yükselttiğinde veya bir dağıtım
`appServer.command` öğesini farklı bir Codex ikilisine yönlendirdiğinde liste
değişebilir. Kullanılabilirlik hesap kapsamlı da olabilir. Bu harness ve hesap
için canlı kataloğu görmek üzere çalışan bir gateway'de `/codex models` kullanın.

Keşif başarısız olursa veya zaman aşımına uğrarsa, OpenClaw şu öğeler için
paketlenmiş bir yedek katalog kullanır:

- GPT-5.5
- GPT-5.4 mini

Geçerli paketlenmiş harness `@openai/codex` `0.142.4` sürümüdür. GPT-5.6 etkin
bir çalışma alanında bu paketlenmiş uygulama sunucusuna karşı yapılan bir
`model/list` yoklaması şu genel seçici satırlarını döndürdü:

| Model kimliği         | Girdi modaliteleri | Muhakeme eforları                    |
| --------------------- | ------------------ | ------------------------------------ |
| `gpt-5.6-sol`         | text, image        | low, medium, high, xhigh, max, ultra |
| `gpt-5.6-terra`       | text, image        | low, medium, high, xhigh, max, ultra |
| `gpt-5.6-luna`        | text, image        | low, medium, high, xhigh, max        |
| `gpt-5.5`             | text, image        | low, medium, high, xhigh             |
| `gpt-5.4`             | text, image        | low, medium, high, xhigh             |
| `gpt-5.4-mini`        | text, image        | low, medium, high, xhigh             |
| `gpt-5.4-pro`         | text, image        | medium, high, xhigh                  |
| `gpt-5.3-codex-spark` | text               | low, medium, high, xhigh             |

GPT-5.6 erişimi sınırlı önizleme sırasında hesap kapsamlıdır. `max` bir model
muhakeme eforudur. `ultra`, standart bir OpenAI muhakeme eforu değil, ayrı Codex
çok ajanlı orkestrasyon meta verisidir.

Gizli modeller uygulama sunucusu kataloğu tarafından dahili veya özelleşmiş
akışlar için döndürülebilir, ancak normal model seçici seçenekleri değildir.

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

Başlangıcın Codex yoklamasından kaçınmasını ve yalnızca yedek kataloğu
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

Codex, yerel proje dokümanı keşfi aracılığıyla `AGENTS.md` dosyasını kendisi
işler. OpenClaw sentetik Codex proje dokümanı dosyaları yazmaz veya persona
dosyaları için Codex yedek dosya adlarına bağlı değildir, çünkü Codex yedekleri
yalnızca `AGENTS.md` eksik olduğunda geçerlidir.

OpenClaw çalışma alanı eşliği için Codex harness diğer başlatma dosyalarını
çözer. `SOUL.md`, `IDENTITY.md`, `TOOLS.md` ve `USER.md`; etkin ajanı,
kullanılabilir çalışma alanı rehberliğini ve kullanıcı profilini tanımladıkları
için OpenClaw Codex geliştirici talimatları olarak iletilir. Kompakt OpenClaw
Skills listesi, tur kapsamlı iş birliği geliştirici talimatları olarak iletilir.
`HEARTBEAT.md` içeriği enjekte edilmez; heartbeat turları, dosya mevcut ve boş
değilse dosyayı okumak için bir iş birliği modu işaretçisi alır. Yapılandırılmış
ajan çalışma alanındaki `MEMORY.md` içeriği, o çalışma alanı için bellek araçları
kullanılabilir olduğunda yerel Codex tur girdisine yapıştırılmaz; mevcut
olduğunda harness, tur kapsamlı iş birliği geliştirici talimatlarına küçük bir
çalışma alanı belleği işaretçisi ekler ve kalıcı bellek ilgili olduğunda Codex
`memory_search` veya `memory_get` kullanmalıdır. Araçlar devre dışıysa, bellek
araması kullanılamıyorsa veya etkin çalışma alanı ajan bellek çalışma alanından
farklıysa, `MEMORY.md` normal sınırlı tur bağlamı yolunu kullanır.
`BOOTSTRAP.md` mevcut olduğunda OpenClaw tur girdisi referans bağlamı olarak
iletilir.

## Ortam geçersiz kılmaları

Ortam geçersiz kılmaları yerel testler için kullanılabilir kalır:

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
Yinelenebilir dağıtımlar için yapılandırma tercih edilir, çünkü Plugin
davranışını Codex harness kurulumunun geri kalanıyla aynı gözden geçirilmiş
dosyada tutar.

## İlgili

- [Codex harness](/tr/plugins/codex-harness)
- [Codex harness çalışma zamanı](/tr/plugins/codex-harness-runtime)
- [Yerel Codex Plugin'leri](/tr/plugins/codex-native-plugins)
- [Codex Bilgisayar Kullanımı](/tr/plugins/codex-computer-use)
- [OpenAI sağlayıcısı](/tr/providers/openai)
- [Yapılandırma başvurusu](/tr/gateway/configuration-reference)
