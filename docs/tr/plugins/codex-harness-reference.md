---
read_when:
    - Codex test düzeneğindeki her yapılandırma alanına ihtiyacınız var
    - App-server aktarımını, kimlik doğrulamayı, keşfi veya zaman aşımı davranışını değiştiriyorsunuz
    - Codex harness başlatmasını, model keşfini veya ortam yalıtımını hata ayıklıyorsunuz
summary: Codex harness için yapılandırma, kimlik doğrulama, keşif ve uygulama sunucusu başvurusu
title: Codex test düzeneği referansı
x-i18n:
    generated_at: "2026-07-01T08:24:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 02dd72f9d85d2ea5fa45533a402d640786f17bdbe2242b7c1b8cd99405561a25
    source_path: plugins/codex-harness-reference.md
    workflow: 16
---

Bu referans, birlikte gelen `codex` Plugin için ayrıntılı yapılandırmayı kapsar. Kurulum ve yönlendirme kararları için
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

| Alan                       | Varsayılan               | Anlam                                                                                                                                          |
| -------------------------- | ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `discovery`                | etkin                    | Codex app-server `model/list` için model keşfi ayarları.                                                                                       |
| `appServer`                | yönetilen stdio app-server | Taşıma, komut, kimlik doğrulama, onay, sandbox ve zaman aşımı ayarları.                                                                        |
| `codexDynamicToolsLoading` | `"searchable"`           | OpenClaw dinamik araçlarını doğrudan başlangıç Codex araç bağlamına koymak için `"direct"` kullanın.                                           |
| `codexDynamicToolsExclude` | `[]`                     | Codex app-server turlarından çıkarılacak ek OpenClaw dinamik araç adları.                                                                      |
| `codexPlugins`             | devre dışı               | Taşınmış, kaynaktan yüklenen seçilmiş Pluginler için yerel Codex Plugin/uygulama desteği. Bkz. [Yerel Codex Pluginleri](/tr/plugins/codex-native-plugins). |
| `computerUse`              | devre dışı               | Codex Computer Use kurulumu. Bkz. [Codex Computer Use](/tr/plugins/codex-computer-use).                                                          |

## App-server taşıması

Varsayılan olarak OpenClaw, birlikte gelen Plugin ile gönderilen yönetilen Codex ikili dosyasını başlatır:

```bash
codex app-server --listen stdio://
```

Bu, app-server sürümünün yerelde kurulu olabilecek ayrı bir Codex CLI yerine birlikte gelen `codex` Pluginine bağlı kalmasını sağlar. Yalnızca bilerek farklı bir çalıştırılabilir dosya çalıştırmak istediğinizde
`appServer.command` ayarlayın.

Zaten çalışmakta olan bir app-server için WebSocket taşımasını kullanın:

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
| --------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                                   | `"stdio"`                                             | `"stdio"` Codex'i başlatır; `"websocket"` `url` öğesine bağlanır.                                                                                                                                                                                                                                                                                                                              |
| `command`                                     | yönetilen Codex ikili dosyası                         | stdio aktarımı için çalıştırılabilir dosya. Yönetilen ikili dosyayı kullanmak için ayarlanmamış bırakın.                                                                                                                                                                                                                                                                                       |
| `args`                                        | `["app-server", "--listen", "stdio://"]`              | stdio aktarımı için argümanlar.                                                                                                                                                                                                                                                                                                                                                                |
| `url`                                         | ayarlanmamış                                          | WebSocket app-server URL'si.                                                                                                                                                                                                                                                                                                                                                                   |
| `authToken`                                   | ayarlanmamış                                          | WebSocket aktarımı için Bearer token. Değişmez bir dizeyi veya `${CODEX_APP_SERVER_TOKEN}` gibi SecretInput değerini kabul eder.                                                                                                                                                                                                                                                               |
| `headers`                                     | `{}`                                                  | Ek WebSocket üstbilgileri. Üstbilgi değerleri, örneğin `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"` şeklinde değişmez dizeleri veya SecretInput değerlerini kabul eder.                                                                                                                                                                                                     |
| `clearEnv`                                    | `[]`                                                  | OpenClaw devralınan ortamını oluşturduktan sonra başlatılan stdio app-server sürecinden kaldırılan ek ortam değişkeni adları.                                                                                                                                                                                                                                                                  |
| `remoteWorkspaceRoot`                         | ayarlanmamış                                          | Uzak Codex app-server çalışma alanı kökü. Ayarlandığında OpenClaw, çözümlenen OpenClaw çalışma alanından yerel çalışma alanı kökünü çıkarır, geçerli cwd sonekini bu uzak kök altında korur ve Codex'e yalnızca son app-server cwd değerini gönderir. cwd çözümlenen OpenClaw çalışma alanı kökünün dışındaysa, OpenClaw uzak app-server'a gateway yerel bir yol göndermek yerine kapalı başarısız olur. |
| `requestTimeoutMs`                            | `60000`                                               | app-server denetim düzlemi çağrıları için zaman aşımı.                                                                                                                                                                                                                                                                                                                                         |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                               | Codex bir turn kabul ettikten sonra veya OpenClaw `turn/completed` beklerken turn kapsamlı bir app-server isteğinden sonraki sessiz pencere.                                                                                                                                                                                                                                                    |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                              | OpenClaw `turn/completed` beklerken bir araç devri, yerel araç tamamlanması, araç sonrası ham assistant ilerlemesi, ham reasoning tamamlanması veya reasoning ilerlemesi sonrasında kullanılan tamamlanma boşta kalma ve ilerleme koruması. Bunu, araç sonrası sentezin son assistant yayın bütçesinden meşru biçimde daha uzun süre sessiz kalabileceği güvenilir veya ağır iş yükleri için kullanın. |
| `mode`                                        | yerel Codex gereksinimleri YOLO'ya izin vermedikçe `"yolo"` | YOLO veya guardian tarafından incelenen yürütme için ön ayar.                                                                                                                                                                                                                                                                                                                                  |
| `approvalPolicy`                              | `"never"` veya izin verilen bir guardian onay politikası | Thread başlatma, sürdürme ve turn'e gönderilen yerel Codex onay politikası.                                                                                                                                                                                                                                                                                                                     |
| `sandbox`                                     | `"danger-full-access"` veya izin verilen bir guardian sandbox | Thread başlatma ve sürdürmeye gönderilen yerel Codex sandbox modu. Etkin OpenClaw sandbox'ları `danger-full-access` turn'lerini Codex `workspace-write` değerine daraltır; turn ağ bayrağı OpenClaw sandbox çıkışını izler.                                                                                                                                                                      |
| `approvalsReviewer`                           | `"user"` veya izin verilen bir guardian inceleyici     | İzin verildiğinde Codex'in yerel onay istemlerini incelemesine izin vermek için `"auto_review"` kullanın.                                                                                                                                                                                                                                                                                       |
| `defaultWorkspaceDir`                         | geçerli süreç dizini                                  | `--cwd` atlandığında `/codex bind` tarafından kullanılan çalışma alanı.                                                                                                                                                                                                                                                                                                                         |
| `serviceTier`                                 | ayarlanmamış                                          | İsteğe bağlı Codex app-server hizmet katmanı. `"priority"` hızlı mod yönlendirmesini etkinleştirir, `"flex"` flex işlemeyi ister ve `null` geçersiz kılmayı temizler. Eski `"fast"`, `"priority"` olarak kabul edilir.                                                                                                                                                                           |
| `networkProxy`                                | devre dışı                                            | app-server komutları için Codex izin profili ağ kullanımına dahil olun. OpenClaw, seçilen `permissions.<profile>.network` yapılandırmasını tanımlar ve `sandbox` göndermek yerine bunu `default_permissions` ile seçer.                                                                                                                                                                         |
| `experimental.sandboxExecServer`              | `false`                                               | Yerel Codex yürütmesinin etkin OpenClaw sandbox'ı içinde çalışabilmesi için OpenClaw sandbox destekli bir Codex ortamını Codex app-server 0.132.0 veya daha yeni sürümlere kaydeden önizleme dahil olma seçeneği.                                                                                                                                                                                |

`appServer.networkProxy`, Codex sandbox sözleşmesini değiştirdiği için açıktır.
Etkinleştirildiğinde OpenClaw, oluşturulan izin profilinin Codex yönetimli ağı
başlatabilmesi için Codex thread yapılandırmasında `features.network_proxy.enabled` ve
`default_permissions` değerlerini de ayarlar. Varsayılan olarak OpenClaw, profil
gövdesinden çakışmaya dayanıklı bir `openclaw-network-<fingerprint>` profil adı
oluşturur; `profileName` öğesini yalnızca kararlı bir yerel ad gerektiğinde kullanın.

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
`networkProxy` etkinleştirildiğinde oluşturulan izin profili için çalışma alanı
tarzı dosya sistemi erişimi kullanılır. Codex yönetimli ağ zorlaması sandbox'lı
ağdır, bu nedenle tam erişimli bir profil giden trafiği korumaz.

Plugin, eski veya sürümsüz app-server el sıkışmalarını engeller. Codex app-server
kararlı sürüm `0.125.0` veya daha yenisini bildirmelidir.

OpenClaw, loopback olmayan WebSocket uygulama sunucusu URL'lerini uzak kabul eder ve `appServer.authToken` ya da bir `Authorization` üst bilgisi üzerinden kimlik taşıyan WebSocket kimlik doğrulaması gerektirir. `appServer.authToken` ve her `appServer.headers.*` değeri bir SecretInput olabilir; secrets çalışma zamanı, OpenClaw uygulama sunucusu başlatma seçeneklerini oluşturmadan önce SecretRef'leri ve env kısaltmalarını çözümler ve çözümlenmemiş yapılandırılmış SecretRef'ler herhangi bir token veya üst bilgi gönderilmeden önce başarısız olur. Yerel Codex Plugin'leri yapılandırıldığında OpenClaw, bu Plugin'leri yüklemek veya yenilemek için bağlı uygulama sunucusunun Plugin denetim düzlemini kullanır ve ardından Plugin'e ait uygulamaların Codex iş parçacığında görünür olması için uygulama envanterini yeniler. `app/list` hâlâ yetkili envanter ve meta veri kaynağıdır, ancak listelenmiş erişilebilir bir uygulama için Codex şu anda onu devre dışı olarak işaretlese bile `thread/start` isteğinin `config.apps[appId].enabled = true` gönderip göndermeyeceğine OpenClaw ilkesi karar verir. Bilinmeyen veya eksik uygulama kimlikleri kapalı durumda başarısız kalır; bu yol yalnızca `plugin/install` üzerinden marketplace Plugin'lerini etkinleştirir ve envanteri yeniler. OpenClaw'ı yalnızca OpenClaw tarafından yönetilen Plugin yüklemelerini ve uygulama envanteri yenilemelerini kabul edeceğine güvenilen uzak uygulama sunucularına bağlayın.

## Onay ve sandbox modları

Yerel stdio uygulama sunucusu oturumları varsayılan olarak YOLO modundadır:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` ve
`sandbox: "danger-full-access"`. Bu güvenilir yerel operatör duruşu, gözetimsiz OpenClaw dönüşlerinin ve Heartbeat'lerin, yanıtlayacak kimsenin olmadığı yerel onay istemleri olmadan ilerlemesini sağlar.

Codex'in yerel sistem gereksinimleri dosyası örtük YOLO onay, gözden geçiren veya sandbox değerlerine izin vermiyorsa OpenClaw örtük varsayılanı bunun yerine guardian olarak ele alır ve izin verilen guardian izinlerini seçer. `tools.exec.mode: "auto"` ayrıca guardian tarafından gözden geçirilen Codex onaylarını zorunlu kılar ve güvenli olmayan eski `approvalPolicy: "never"` veya `sandbox: "danger-full-access"` geçersiz kılmalarını korumaz; kasıtlı bir onaysız duruş için `tools.exec.mode: "full"` ayarlayın. Aynı gereksinimler dosyasındaki ana makine adıyla eşleşen `[[remote_sandbox_config]]` girdileri, sandbox varsayılan kararı için dikkate alınır.

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

`guardian` ön ayarı, bu değerlere izin verildiğinde `approvalPolicy: "on-request"`, `approvalsReviewer: "auto_review"` ve `sandbox: "workspace-write"` olarak genişler. Tek tek ilke alanları `mode` değerini geçersiz kılar. Eski `guardian_subagent` gözden geçiren değeri hâlâ uyumluluk takma adı olarak kabul edilir, ancak yeni yapılandırmalar `auto_review` kullanmalıdır.

Bir OpenClaw sandbox'ı etkin olduğunda, yerel Codex uygulama sunucusu işlemi yine Gateway ana makinesinde çalışır. Bu nedenle OpenClaw, Codex ana makine tarafı sandbox kullanımını OpenClaw sandbox arka ucuna eşdeğer saymak yerine o dönüş için Codex yerel Code Mode'u, kullanıcı MCP sunucularını ve uygulama destekli Plugin yürütmesini devre dışı bırakır. Normal exec/process araçları kullanılabilir olduğunda kabuk erişimi, `sandbox_exec` ve `sandbox_process` gibi OpenClaw sandbox destekli dinamik araçlar üzerinden sunulur.

Ubuntu/AppArmor ana makinelerinde, etkin OpenClaw sandbox kullanımı olmadan yerel Codex `workspace-write` modunu kasıtlı olarak çalıştırdığınızda Codex bwrap, kabuk komutu başlamadan önce `workspace-write` altında başarısız olabilir. `bwrap: setting up uid map: Permission denied` veya `bwrap: loopback: Failed RTM_NEWADDR: Operation not permitted` görürseniz, daha geniş Docker konteyner ayrıcalıkları vermek yerine `openclaw doctor` çalıştırın ve OpenClaw hizmet kullanıcısı için bildirilen ana makine namespace ilkesini düzeltin. Hizmet işlemi için kapsamlı bir AppArmor profili tercih edin; `kernel.apparmor_restrict_unprivileged_userns=0` yedeği ana makine genelindedir ve güvenlik ödünleri vardır.

## Sandbox'lı yerel yürütme

Kararlı varsayılan kapalı durumda başarısız olmaktır: etkin OpenClaw sandbox kullanımı, aksi halde Codex uygulama sunucusu ana makinesinden çalışacak yerel Codex yürütme yüzeylerini devre dışı bırakır. Codex'in uzak ortam desteğini OpenClaw'ın sandbox arka ucuyla denemek istediğinizde yalnızca `appServer.experimental.sandboxExecServer: true` kullanın. Bu önizleme yolu Codex uygulama sunucusu 0.132.0 veya daha yenisini gerektirir.

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

Bayrak açık olduğunda ve geçerli OpenClaw oturumu sandbox'lı olduğunda OpenClaw, etkin sandbox tarafından desteklenen bir local loopback exec-server başlatır, bunu Codex uygulama sunucusuna kaydeder ve Codex iş parçacığını ve dönüşünü OpenClaw'a ait bu ortamla başlatır. Uygulama sunucusu ortamı kaydedemezse çalıştırma, sessizce ana makine yürütmesine geri dönmek yerine kapalı durumda başarısız olur.

Bu önizleme yolu yalnızca yereldir. Uzak bir WebSocket uygulama sunucusu aynı ana makinede çalışmıyorsa loopback exec-server'a erişemez, bu nedenle OpenClaw bu kombinasyonu reddeder.

## Kimlik doğrulama ve ortam yalıtımı

Kimlik doğrulama şu sırayla seçilir:

1. Aracı için açık bir OpenClaw Codex kimlik doğrulama profili.
2. Bu aracının Codex home dizinindeki uygulama sunucusunun mevcut hesabı.
3. Yalnızca yerel stdio uygulama sunucusu başlatmaları için, uygulama sunucusu hesabı yoksa ve OpenAI kimlik doğrulaması hâlâ gerekiyorsa `CODEX_API_KEY`, ardından `OPENAI_API_KEY`.

OpenClaw ChatGPT abonelik tarzı bir Codex kimlik doğrulama profili gördüğünde, oluşturulan Codex alt işleminden `CODEX_API_KEY` ve `OPENAI_API_KEY` değerlerini kaldırır. Bu, Gateway düzeyindeki API anahtarlarını embeddings veya doğrudan OpenAI modelleri için kullanılabilir tutarken yerel Codex uygulama sunucusu dönüşlerinin yanlışlıkla API üzerinden faturalandırılmasını engeller.

Açık Codex API anahtarı profilleri ve yerel stdio env anahtarı yedeği, devralınan alt işlem env yerine uygulama sunucusu girişini kullanır. WebSocket uygulama sunucusu bağlantıları Gateway env API anahtarı yedeğini almaz; açık bir kimlik doğrulama profili veya uzak uygulama sunucusunun kendi hesabını kullanın.

Stdio uygulama sunucusu başlatmaları varsayılan olarak OpenClaw'ın işlem ortamını devralır. OpenClaw, Codex uygulama sunucusu hesap köprüsünün sahibidir ve `CODEX_HOME` değerini ilgili aracının OpenClaw state dizini altında aracı başına bir dizine ayarlar. Bu, Codex yapılandırmasını, hesaplarını, Plugin önbelleğini/verilerini ve iş parçacığı durumunu operatörün kişisel `~/.codex` home dizininden sızdırmak yerine OpenClaw aracına kapsamlar.

OpenClaw normal yerel uygulama sunucusu başlatmaları için `HOME` değerini yeniden yazmaz. `openclaw`, `gh`, `git`, bulut CLI'leri ve kabuk komutları gibi Codex tarafından çalıştırılan alt işlemler normal işlem home dizinini görür ve kullanıcı home yapılandırmasını ve token'larını bulabilir. Codex ayrıca `$HOME/.agents/skills` ve `$HOME/.agents/plugins/marketplace.json` keşfedebilir; bu `.agents` keşfi kasıtlı olarak operatör home diziniyle paylaşılır ve yalıtılmış `~/.codex` durumundan ayrıdır.

OpenClaw Plugin'leri ve OpenClaw Skills anlık görüntüleri yine OpenClaw'ın kendi Plugin kayıt defteri ve Skills yükleyicisi üzerinden akar. Kişisel Codex `~/.codex` varlıkları akmaz. Bir Codex home dizininden OpenClaw aracısının parçası olması gereken kullanışlı Codex CLI Skills veya Plugin'leriniz varsa bunların envanterini açıkça çıkarın:

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

Bir dağıtım ek ortam yalıtımı gerektiriyorsa bu değişkenleri `appServer.clearEnv` içine ekleyin:

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

`appServer.clearEnv` yalnızca oluşturulan Codex uygulama sunucusu alt işlemini etkiler. OpenClaw yerel başlatma normalizasyonu sırasında `CODEX_HOME` ve `HOME` değerlerini bu listeden kaldırır: `CODEX_HOME` aracı başına kalır ve `HOME` devralınmış kalır, böylece alt işlemler normal kullanıcı home durumunu kullanabilir.

## Dinamik araçlar

Codex dinamik araçları varsayılan olarak `searchable` yüklemeye ayarlıdır. OpenClaw, Codex'e özgü workspace işlemlerini yineleyen dinamik araçları sunmaz:

- `read`
- `write`
- `edit`
- `apply_patch`
- `exec`
- `process`
- `update_plan`

Mesajlaşma, medya, cron, tarayıcı, düğümler, Gateway, `heartbeat_respond` ve `web_search` gibi kalan OpenClaw entegrasyon araçlarının çoğu, `openclaw` namespace'i altında Codex araç araması üzerinden kullanılabilir. Bu, başlangıç model bağlamını daha küçük tutar. `sessions_yield` ve yalnızca mesaj aracı kaynaklı yanıtlar doğrudan kalır çünkü bunlar dönüş denetimi sözleşmeleridir. `sessions_spawn` aranabilir kalır, böylece Codex'in yerel `spawn_agent` özelliği birincil Codex alt aracı yüzeyi olmaya devam eder; açık OpenClaw veya ACP delegasyonu ise `openclaw` dinamik araç namespace'i üzerinden hâlâ kullanılabilir.

`codexDynamicToolsLoading: "direct"` değerini yalnızca ertelenmiş dinamik araçları arayamayan özel bir Codex uygulama sunucusuna bağlanırken veya tam araç yükünü hata ayıklarken ayarlayın.

## Zaman aşımları

OpenClaw'a ait dinamik araç çağrıları `appServer.requestTimeoutMs` değerinden bağımsız olarak sınırlanır. Her Codex `item/tool/call` isteği, şu sırayla ilk kullanılabilir zaman aşımını kullanır:

- Pozitif bir çağrı başına `timeoutMs` argümanı.
- `image_generate` için `agents.defaults.imageGenerationModel.timeoutMs`.
- Yapılandırılmış bir zaman aşımı olmadan `image_generate` için 120 saniyelik görüntü oluşturma varsayılanı.
- Medya anlama `image` aracı için, milisaniyeye dönüştürülmüş `tools.media.image.timeoutSeconds` veya 60 saniyelik medya varsayılanı. Görüntü anlama için bu, isteğin kendisine uygulanır ve önceki hazırlık çalışmaları tarafından azaltılmaz.
- 90 saniyelik dinamik araç varsayılanı.

Bu watchdog, dış dinamik `item/tool/call` bütçesidir. Sağlayıcıya özgü istek zaman aşımları bu çağrının içinde çalışır ve kendi zaman aşımı semantiklerini korur. Dinamik araç bütçeleri 600000 ms ile sınırlandırılır. Zaman aşımında OpenClaw, desteklendiği yerde araç sinyalini iptal eder ve Codex'e başarısız bir dinamik araç yanıtı döndürür, böylece oturum `processing` durumunda bırakılmak yerine dönüş devam edebilir.

Codex bir dönüşü kabul ettikten sonra ve OpenClaw dönüş kapsamlı bir uygulama sunucusu isteğine yanıt verdikten sonra harness, Codex'in geçerli dönüşte ilerleme kaydetmesini ve sonunda yerel dönüşü `turn/completed` ile bitirmesini bekler. Uygulama sunucusu `appServer.turnCompletionIdleTimeoutMs` boyunca sessiz kalırsa OpenClaw en iyi çabayla Codex dönüşünü kesintiye uğratır, tanısal bir zaman aşımı kaydeder ve OpenClaw oturum hattını serbest bırakır; böylece takip eden sohbet mesajları bayat bir yerel dönüşün arkasında kuyruğa alınmaz.

Aynı tur için terminal olmayan çoğu bildirim, bu kısa watchdog’u devreden çıkarır
çünkü Codex turun hâlâ canlı olduğunu kanıtlamıştır. Araç devirleri daha uzun
bir araç sonrası boşta kalma bütçesi kullanır: OpenClaw bir `item/tool/call`
yanıtı döndürdükten sonra, `commandExecution` gibi yerel araç öğeleri
tamamlandıktan sonra, ham `custom_tool_call_output` tamamlanmalarından sonra ve
araç sonrası ham asistan ilerlemesi, ham akıl yürütme tamamlanmaları veya akıl
yürütme ilerlemesinden sonra. Koruyucu, yapılandırıldığında
`appServer.postToolRawAssistantCompletionIdleTimeoutMs` kullanır ve aksi halde
varsayılan olarak beş dakikaya ayarlanır. Aynı araç sonrası bütçesi, Codex bir
sonraki geçerli tur olayını yaymadan önceki sessiz sentez penceresi için
ilerleme watchdog’unu da uzatır. Akıl yürütme tamamlanmalarını, commentary
`agentMessage` tamamlanmalarını ve araç öncesi ham akıl yürütme veya asistan
ilerlemesini otomatik bir son yanıt izleyebilir; bu nedenle oturum şeridini
hemen serbest bırakmak yerine araç sonrası yanıt koruyucusunu kullanırlar.
Yalnızca son/commentary olmayan tamamlanmış `agentMessage` öğeleri ve araç
öncesi ham asistan tamamlanmaları asistan çıktısı serbest bırakmasını kurar:
Codex ardından `turn/completed` olmadan sessiz kalırsa, OpenClaw en iyi çabayla
yerel turu keser ve oturum şeridini serbest bırakır. Asistan, araç, etkin öğe
veya yan etki kanıtı olmayan tur tamamlama boşta kalma zaman aşımları dahil,
yeniden oynatması güvenli stdio app-server hataları, taze bir app-server
denemesinde bir kez yeniden denenir. Güvenli olmayan zaman aşımları yine de
takılı app-server istemcisini kullanımdan kaldırır ve OpenClaw oturum şeridini
serbest bırakır. Ayrıca otomatik olarak yeniden oynatılmak yerine bayat yerel
iş parçacığı bağlamasını temizler. Tamamlama izleme zaman aşımları Codex’e özgü
zaman aşımı metni gösterir: yeniden oynatması güvenli durumlar yanıtın eksik
olabileceğini söylerken, güvenli olmayan durumlar kullanıcıya yeniden denemeden
önce mevcut durumu doğrulamasını söyler. Genel zaman aşımı tanılamaları, son
app-server bildirim yöntemi, ham asistan yanıt öğesi kimliği/türü/rolü, etkin
istek/öğe sayıları ve kurulmuş izleme durumu gibi yapısal alanları içerir. Son
bildirim ham bir asistan yanıt öğesiyse, sınırlı bir asistan metin önizlemesi de
içerirler. Ham istem veya araç içeriği içermezler.

## Model keşfi

Varsayılan olarak Codex Plugin, kullanılabilir modeller için app-server’a sorar.
Model kullanılabilirliği Codex app-server tarafından yönetilir; bu nedenle liste,
OpenClaw paketlenen `@openai/codex` sürümünü yükselttiğinde veya bir dağıtım
`appServer.command` değerini farklı bir Codex ikilisine yönlendirdiğinde
değişebilir. Kullanılabilirlik hesap kapsamlı da olabilir. Bu çalışma düzeneği
ve hesap için canlı kataloğu görmek üzere çalışan bir Gateway üzerinde
`/codex models` kullanın.

Keşif başarısız olursa veya zaman aşımına uğrarsa OpenClaw şunlar için paketli
bir yedek katalog kullanır:

- GPT-5.5
- GPT-5.4 mini

Geçerli paketli çalışma düzeneği `@openai/codex` `0.142.4` sürümüdür. GPT-5.6
etkin bir çalışma alanında bu paketli app-server’a karşı yapılan bir
`model/list` yoklaması şu genel seçici satırlarını döndürdü:

| Model kimliği         | Girdi kipleri  | Akıl yürütme eforları                 |
| --------------------- | -------------- | ------------------------------------ |
| `gpt-5.6-sol`         | metin, görüntü | low, medium, high, xhigh, max, ultra |
| `gpt-5.6-terra`       | metin, görüntü | low, medium, high, xhigh, max, ultra |
| `gpt-5.6-luna`        | metin, görüntü | low, medium, high, xhigh, max        |
| `gpt-5.5`             | metin, görüntü | low, medium, high, xhigh             |
| `gpt-5.4`             | metin, görüntü | low, medium, high, xhigh             |
| `gpt-5.4-mini`        | metin, görüntü | low, medium, high, xhigh             |
| `gpt-5.4-pro`         | metin, görüntü | medium, high, xhigh                  |
| `gpt-5.3-codex-spark` | metin          | low, medium, high, xhigh             |

GPT-5.6 erişimi sınırlı önizleme sırasında hesap kapsamlıdır. `max` bir model
akıl yürütme eforudur. `ultra`, standart bir OpenAI akıl yürütme eforu değil,
ayrı Codex çok aracılı orkestrasyon metadata’sıdır.

Gizli modeller, dahili veya özelleşmiş akışlar için app-server kataloğu
tarafından döndürülebilir, ancak normal model seçici seçenekleri değildir.

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

Başlangıcın Codex’i yoklamasından kaçınmasını ve yalnızca yedek kataloğu
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

## Çalışma alanı önyükleme dosyaları

Codex, yerel proje belgeleri keşfi aracılığıyla `AGENTS.md` dosyasını kendisi
işler. OpenClaw sentetik Codex proje belgesi dosyaları yazmaz veya persona
dosyaları için Codex yedek dosya adlarına bağlı değildir; çünkü Codex yedekleri
yalnızca `AGENTS.md` eksik olduğunda geçerlidir.

OpenClaw çalışma alanı denkliği için Codex çalışma düzeneği diğer önyükleme
dosyalarını çözer. `SOUL.md`, `IDENTITY.md`, `TOOLS.md` ve `USER.md`, etkin
ajanı, kullanılabilir çalışma alanı rehberliğini ve kullanıcı profilini
tanımladıkları için OpenClaw Codex geliştirici talimatları olarak iletilir. Kısa
OpenClaw Skills listesi, tur kapsamlı iş birliği geliştirici talimatları olarak
iletilir. `HEARTBEAT.md` içeriği enjekte edilmez; heartbeat turları, dosya var
olduğunda ve boş olmadığında onu okumak için iş birliği modu işaretçisi alır.
Yapılandırılmış ajan çalışma alanındaki `MEMORY.md` içeriği, bu çalışma alanı
için bellek araçları kullanılabildiğinde yerel Codex tur girdisine yapıştırılmaz;
var olduğunda çalışma düzeneği tur kapsamlı iş birliği geliştirici talimatlarına
küçük bir çalışma alanı belleği işaretçisi ekler ve dayanıklı bellek ilgili
olduğunda Codex `memory_search` veya `memory_get` kullanmalıdır. Araçlar devre
dışıysa, bellek araması kullanılamıyorsa veya etkin çalışma alanı ajan bellek
çalışma alanından farklıysa, `MEMORY.md` normal sınırlı tur bağlamı yolunu
kullanır. `BOOTSTRAP.md` mevcut olduğunda OpenClaw tur girdisi başvuru bağlamı
olarak iletilir.

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
`plugins.entries.codex.config.appServer.mode: "guardian"` kullanın veya tek
seferlik yerel test için `OPENCLAW_CODEX_APP_SERVER_MODE=guardian` kullanın.
Tekrarlanabilir dağıtımlar için yapılandırma tercih edilir; çünkü Plugin
davranışını Codex çalışma düzeneği kurulumunun geri kalanıyla aynı gözden
geçirilmiş dosyada tutar.

## İlgili

- [Codex çalışma düzeneği](/tr/plugins/codex-harness)
- [Codex çalışma düzeneği çalışma zamanı](/tr/plugins/codex-harness-runtime)
- [Yerel Codex Plugin’leri](/tr/plugins/codex-native-plugins)
- [Codex Computer Use](/tr/plugins/codex-computer-use)
- [OpenAI sağlayıcısı](/tr/providers/openai)
- [Yapılandırma başvurusu](/tr/gateway/configuration-reference)
