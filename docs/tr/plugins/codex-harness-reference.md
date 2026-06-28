---
read_when:
    - Tüm Codex harness yapılandırma alanlarına ihtiyacınız var
    - Uygulama sunucusu taşıma, kimlik doğrulama, keşif veya zaman aşımı davranışını değiştiriyorsunuz
    - Codex harness başlangıcında, model keşfinde veya ortam yalıtımında hata ayıklıyorsunuz
summary: Codex harness için yapılandırma, kimlik doğrulama, keşif ve uygulama sunucusu başvurusu
title: Codex harness referansı
x-i18n:
    generated_at: "2026-06-28T00:51:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 32da817c262a61769b78b16c10e508175c730a568c2ba6321595c430815526a5
    source_path: plugins/codex-harness-reference.md
    workflow: 16
---

Bu başvuru, paketle birlikte gelen `codex` Plugin'i için ayrıntılı yapılandırmayı kapsar. Kurulum ve yönlendirme kararları için
[Codex çalıştırma altyapısı](/tr/plugins/codex-harness) ile başlayın.

## Plugin yapılandırma yüzeyi

Tüm Codex çalıştırma altyapısı ayarları `plugins.entries.codex.config` altında bulunur.

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

| Alan                       | Varsayılan              | Anlamı                                                                                                                                             |
| -------------------------- | ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `discovery`                | etkin                   | Codex app-server `model/list` için model keşfi ayarları.                                                                                           |
| `appServer`                | yönetilen stdio app-server | Aktarım, komut, kimlik doğrulama, onay, sandbox ve zaman aşımı ayarları.                                                                        |
| `codexDynamicToolsLoading` | `"searchable"`          | OpenClaw dinamik araçlarını doğrudan ilk Codex araç bağlamına koymak için `"direct"` kullanın.                                                     |
| `codexDynamicToolsExclude` | `[]`                    | Codex app-server dönüşlerinden hariç tutulacak ek OpenClaw dinamik araç adları.                                                                    |
| `codexPlugins`             | devre dışı              | Taşınmış, kaynaktan kurulmuş seçilmiş Plugin'ler için yerel Codex Plugin/uygulama desteği. Bkz. [Yerel Codex Plugin'leri](/tr/plugins/codex-native-plugins). |
| `computerUse`              | devre dışı              | Codex Computer Use kurulumu. Bkz. [Codex Computer Use](/tr/plugins/codex-computer-use).                                                               |

## App-server aktarımı

Varsayılan olarak OpenClaw, paketle birlikte gelen Plugin ile gönderilen yönetilen Codex ikili dosyasını başlatır:

```bash
codex app-server --listen stdio://
```

Bu, app-server sürümünü yerelde kurulu olabilecek herhangi bir ayrı Codex CLI yerine paketle birlikte gelen `codex` Plugin'ine bağlı tutar. `appServer.command` değerini yalnızca bilerek farklı bir yürütülebilir dosya çalıştırmak istediğinizde ayarlayın.

Zaten çalışmakta olan bir app-server için WebSocket aktarımını kullanın:

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

| Alan                                          | Varsayılan                                            | Anlam                                                                                                                                                                                                                                                                                                                                                                                            |
| --------------------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `transport`                                   | `"stdio"`                                              | `"stdio"` Codex'i başlatır; `"websocket"` `url` adresine bağlanır.                                                                                                                                                                                                                                                                                                                               |
| `command`                                     | yönetilen Codex ikili dosyası                         | stdio aktarımı için yürütülebilir dosya. Yönetilen ikili dosyayı kullanmak için ayarlanmamış bırakın.                                                                                                                                                                                                                                                                                            |
| `args`                                        | `["app-server", "--listen", "stdio://"]`               | stdio aktarımı için bağımsız değişkenler.                                                                                                                                                                                                                                                                                                                                                        |
| `url`                                         | ayarlanmamış                                          | WebSocket app-server URL'si.                                                                                                                                                                                                                                                                                                                                                                     |
| `authToken`                                   | ayarlanmamış                                          | WebSocket aktarımı için Bearer belirteci. Bir düz dizeyi veya `${CODEX_APP_SERVER_TOKEN}` gibi bir SecretInput'u kabul eder.                                                                                                                                                                                                                                                                     |
| `headers`                                     | `{}`                                                   | Ek WebSocket üstbilgileri. Üstbilgi değerleri düz dizeleri veya SecretInput değerlerini kabul eder, örneğin `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"`.                                                                                                                                                                                                                     |
| `clearEnv`                                    | `[]`                                                   | OpenClaw devralınan ortamını oluşturduktan sonra başlatılan stdio app-server sürecinden kaldırılan ek ortam değişkeni adları.                                                                                                                                                                                                                                                                    |
| `remoteWorkspaceRoot`                         | ayarlanmamış                                          | Uzak Codex app-server çalışma alanı kökü. Ayarlandığında OpenClaw, yerel çalışma alanı kökünü çözümlenen OpenClaw çalışma alanından çıkarır, geçerli cwd son ekini bu uzak kök altında korur ve Codex'e yalnızca son app-server cwd değerini gönderir. cwd, çözümlenen OpenClaw çalışma alanı kökünün dışındaysa OpenClaw, uzak app-server'a gateway-yerel bir yol göndermek yerine güvenli biçimde başarısız olur. |
| `requestTimeoutMs`                            | `60000`                                                | app-server kontrol düzlemi çağrıları için zaman aşımı.                                                                                                                                                                                                                                                                                                                                           |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                                | Codex bir turn kabul ettikten sonra veya OpenClaw `turn/completed` beklerken turn kapsamlı bir app-server isteğinden sonra sessiz pencere.                                                                                                                                                                                                                                                        |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                               | OpenClaw `turn/completed` beklerken bir araç devrinden, yerel araç tamamlanmasından, araç sonrası ham assistant ilerlemesinden, ham reasoning tamamlanmasından veya reasoning ilerlemesinden sonra kullanılan tamamlama boşta kalma ve ilerleme koruması. Bunu, araç sonrası sentezin son assistant yayımlama bütçesinden daha uzun süre haklı olarak sessiz kalabileceği güvenilir veya ağır iş yükleri için kullanın. |
| `mode`                                        | yerel Codex gereksinimleri YOLO'ya izin vermediği sürece `"yolo"` | YOLO veya guardian incelemeli yürütme için ön ayar.                                                                                                                                                                                                                                                                                                                                              |
| `approvalPolicy`                              | `"never"` veya izin verilen bir guardian onay ilkesi   | Thread başlatma, sürdürme ve turn işlemlerine gönderilen yerel Codex onay ilkesi.                                                                                                                                                                                                                                                                                                                |
| `sandbox`                                     | `"danger-full-access"` veya izin verilen bir guardian sandbox | Thread başlatma ve sürdürme işlemlerine gönderilen yerel Codex sandbox modu. Etkin OpenClaw sandbox'ları `danger-full-access` turn'lerini Codex `workspace-write` ile daraltır; turn ağ bayrağı OpenClaw sandbox çıkışını izler.                                                                                                                                                                  |
| `approvalsReviewer`                           | `"user"` veya izin verilen bir guardian inceleyici     | İzin verildiğinde Codex'in yerel onay istemlerini incelemesine izin vermek için `"auto_review"` kullanın.                                                                                                                                                                                                                                                                                        |
| `defaultWorkspaceDir`                         | geçerli süreç dizini                                  | `--cwd` atlandığında `/codex bind` tarafından kullanılan çalışma alanı.                                                                                                                                                                                                                                                                                                                          |
| `serviceTier`                                 | ayarlanmamış                                          | İsteğe bağlı Codex app-server hizmet katmanı. `"priority"` hızlı mod yönlendirmesini etkinleştirir, `"flex"` flex işlemeyi ister ve `null` geçersiz kılmayı temizler. Eski `"fast"`, `"priority"` olarak kabul edilir.                                                                                                                                                                            |
| `networkProxy`                                | devre dışı                                            | app-server komutları için Codex permissions-profile ağ kullanımını etkinleştirir. OpenClaw, seçilen `permissions.<profile>.network` yapılandırmasını tanımlar ve bunu `sandbox` göndermek yerine `default_permissions` ile seçer.                                                                                                                                                                |
| `experimental.sandboxExecServer`              | `false`                                                | Yerel Codex yürütmesinin etkin OpenClaw sandbox içinde çalışabilmesi için Codex app-server 0.132.0 veya daha yenisine OpenClaw sandbox destekli bir Codex ortamı kaydeden önizleme katılımı.                                                                                                                                                                                                     |

`appServer.networkProxy`, Codex sandbox sözleşmesini değiştirdiği için
açıktır. Etkinleştirildiğinde OpenClaw, üretilen izin profilinin Codex
tarafından yönetilen ağı başlatabilmesi için Codex thread yapılandırmasında
`features.network_proxy.enabled` ve `default_permissions` değerlerini de
ayarlar. Varsayılan olarak OpenClaw, profil gövdesinden çakışmaya dayanıklı bir
`openclaw-network-<fingerprint>` profil adı üretir; `profileName` değerini
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

Normal app-server çalışma zamanı `danger-full-access` olacaksa, `networkProxy`
etkinleştirildiğinde üretilen izin profili için çalışma alanı tarzı dosya
sistemi erişimi kullanılır. Codex tarafından yönetilen ağ denetimi sandbox'lı
ağdır, bu nedenle tam erişimli bir profil giden trafiği korumaz.

Plugin, daha eski veya sürümsüz app-server el sıkışmalarını engeller. Codex
app-server, kararlı `0.125.0` veya daha yeni bir sürüm bildirmelidir.

OpenClaw, loopback olmayan WebSocket uygulama sunucusu URL’lerini uzak olarak değerlendirir ve `appServer.authToken` ya da bir `Authorization` üst bilgisi üzerinden kimlik taşıyan WebSocket kimlik doğrulaması gerektirir. `appServer.authToken` ve her `appServer.headers.*` değeri bir SecretInput olabilir; secrets çalışma zamanı, OpenClaw uygulama sunucusu başlatma seçeneklerini oluşturmadan önce SecretRef’leri ve env kısayolunu çözümler; çözümlenmemiş yapılandırılmış SecretRef’ler herhangi bir token veya üst bilgi gönderilmeden önce başarısız olur. Yerel Codex Plugin’leri yapılandırıldığında OpenClaw, bu Plugin’leri yüklemek veya yenilemek için bağlı uygulama sunucusunun Plugin kontrol düzlemini kullanır ve ardından uygulama envanterini yeniler; böylece Plugin’e ait uygulamalar Codex iş parçacığı tarafından görülebilir. `app/list` hâlâ yetkili envanter ve meta veri kaynağıdır, ancak listelenmiş erişilebilir bir uygulama için Codex şu anda devre dışı olarak işaretlese bile `thread/start` çağrısının `config.apps[appId].enabled = true` gönderip göndermeyeceğine OpenClaw ilkesi karar verir. Bilinmeyen veya eksik uygulama kimlikleri kapalı başarısız kalır; bu yol yalnızca `plugin/install` üzerinden marketplace Plugin’lerini etkinleştirir ve envanteri yeniler. OpenClaw’ı yalnızca OpenClaw tarafından yönetilen Plugin kurulumlarını ve uygulama envanteri yenilemelerini kabul etmesine güvenilen uzak uygulama sunucularına bağlayın.

## Onay ve sandbox modları

Yerel stdio uygulama sunucusu oturumları varsayılan olarak YOLO modundadır:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` ve
`sandbox: "danger-full-access"`. Bu güvenilir yerel operatör duruşu, gözetimsiz OpenClaw turlarının ve heartbeats’in, yanıtlayacak kimse yokken yerel onay istemlerine takılmadan ilerlemesini sağlar.

Codex’in yerel sistem gereksinimleri dosyası örtük YOLO onayı, inceleyici veya sandbox değerlerine izin vermiyorsa OpenClaw örtük varsayılanı bunun yerine guardian olarak değerlendirir ve izin verilen guardian yetkilerini seçer. `tools.exec.mode: "auto"` ayrıca guardian tarafından incelenen Codex onaylarını zorunlu kılar ve güvenli olmayan eski `approvalPolicy: "never"` veya `sandbox: "danger-full-access"` geçersiz kılmalarını korumaz; bilinçli bir onaysız duruş için `tools.exec.mode: "full"` ayarlayın. Aynı gereksinimler dosyasındaki ana makine adıyla eşleşen `[[remote_sandbox_config]]` girdileri sandbox varsayılanı kararında dikkate alınır.

Codex guardian tarafından incelenen onaylar için `appServer.mode: "guardian"` ayarlayın:

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
`approvalsReviewer: "auto_review"` ve `sandbox: "workspace-write"` olarak genişler. Tek tek ilke alanları `mode` değerini geçersiz kılar. Eski `guardian_subagent` inceleyici değeri uyumluluk takma adı olarak hâlâ kabul edilir, ancak yeni yapılandırmalar `auto_review` kullanmalıdır.

Bir OpenClaw sandbox’ı etkin olduğunda, yerel Codex uygulama sunucusu süreci yine de Gateway ana makinesinde çalışır. Bu nedenle OpenClaw, Codex ana makine tarafı sandbox kullanımını OpenClaw sandbox arka ucuyla eşdeğer kabul etmek yerine, o tur için Codex yerel Code Mode’u, kullanıcı MCP sunucularını ve uygulama destekli Plugin yürütmeyi devre dışı bırakır. Normal exec/process araçları kullanılabilir olduğunda kabuk erişimi, `sandbox_exec` ve `sandbox_process` gibi OpenClaw sandbox destekli dinamik araçlar üzerinden sunulur.

Ubuntu/AppArmor ana makinelerinde, etkin OpenClaw sandbox kullanımı olmadan yerel Codex `workspace-write` seçeneğini bilinçli olarak çalıştırdığınızda Codex bwrap, kabuk komutu başlamadan önce `workspace-write` altında başarısız olabilir. `bwrap: setting up uid map: Permission denied` veya
`bwrap: loopback: Failed RTM_NEWADDR: Operation not permitted` görürseniz daha geniş Docker konteyner ayrıcalıkları vermek yerine `openclaw doctor` çalıştırın ve OpenClaw hizmet kullanıcısı için bildirilen ana makine namespace ilkesini düzeltin. Hizmet süreci için kapsamlı bir AppArmor profili tercih edin; `kernel.apparmor_restrict_unprivileged_userns=0` geri dönüşü ana makine genelindedir ve güvenlik ödünleşimleri vardır.

## Sandbox’lı yerel yürütme

Kararlı varsayılan kapalı başarısızdır: etkin OpenClaw sandbox kullanımı, aksi halde Codex uygulama sunucusu ana makinesinden çalışacak yerel Codex yürütme yüzeylerini devre dışı bırakır. `appServer.experimental.sandboxExecServer: true` seçeneğini yalnızca Codex’in uzak ortam desteğini OpenClaw’ın sandbox arka ucuyla denemek istediğinizde kullanın. Bu önizleme yolu Codex uygulama sunucusu 0.132.0 veya daha yenisini gerektirir.

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

Bayrak açık olduğunda ve geçerli OpenClaw oturumu sandbox’lıysa OpenClaw, etkin sandbox tarafından desteklenen bir local loopback exec-server başlatır, bunu Codex uygulama sunucusuna kaydeder ve Codex iş parçacığını ve turunu OpenClaw’a ait bu ortamla başlatır. Uygulama sunucusu ortamı kaydedemezse çalışma sessizce ana makine yürütmesine geri dönmek yerine kapalı başarısız olur.

Bu önizleme yolu yalnızca yereldir. Uzak WebSocket uygulama sunucusu aynı ana makinede çalışmadığı sürece loopback exec-server’a erişemez; bu nedenle OpenClaw bu birleşimi reddeder.

## Kimlik doğrulama ve ortam izolasyonu

Kimlik doğrulama şu sırayla seçilir:

1. Ajan için açık bir OpenClaw Codex kimlik doğrulama profili.
2. Uygulama sunucusunun, o ajanın Codex home’undaki mevcut hesabı.
3. Yalnızca yerel stdio uygulama sunucusu başlatmaları için, uygulama sunucusu hesabı yoksa ve OpenAI kimlik doğrulaması hâlâ gerekiyorsa `CODEX_API_KEY`, ardından
   `OPENAI_API_KEY`.

OpenClaw ChatGPT abonelik tarzı bir Codex kimlik doğrulama profili gördüğünde, oluşturulan Codex alt sürecinden `CODEX_API_KEY` ve `OPENAI_API_KEY` değerlerini kaldırır. Bu, Gateway düzeyindeki API anahtarlarını embedding’ler veya doğrudan OpenAI modelleri için kullanılabilir tutarken yerel Codex uygulama sunucusu turlarının yanlışlıkla API üzerinden faturalandırılmasını önler.

Açık Codex API anahtarı profilleri ve yerel stdio env anahtarı geri dönüşü, devralınmış alt süreç env yerine uygulama sunucusu oturum açmasını kullanır. WebSocket uygulama sunucusu bağlantıları Gateway env API anahtarı geri dönüşünü almaz; açık bir kimlik doğrulama profili veya uzak uygulama sunucusunun kendi hesabını kullanın.

Stdio uygulama sunucusu başlatmaları varsayılan olarak OpenClaw’ın süreç ortamını devralır. OpenClaw, Codex uygulama sunucusu hesap köprüsünün sahibidir ve `CODEX_HOME` değerini o ajanın OpenClaw durumu altında ajan başına bir dizine ayarlar. Bu, Codex yapılandırmasını, hesaplarını, Plugin önbelleğini/verilerini ve iş parçacığı durumunu operatörün kişisel `~/.codex` home’undan sızdırmak yerine OpenClaw ajanına kapsamlar.

OpenClaw normal yerel uygulama sunucusu başlatmaları için `HOME` değerini yeniden yazmaz. `openclaw`, `gh`, `git`, bulut CLI’ları ve kabuk komutları gibi Codex tarafından çalıştırılan alt süreçler normal süreç home’unu görür ve kullanıcı home yapılandırmasını ve token’larını bulabilir. Codex ayrıca `$HOME/.agents/skills` ve `$HOME/.agents/plugins/marketplace.json` öğelerini keşfedebilir; bu `.agents` keşfi bilerek operatör home’u ile paylaşılır ve izole `~/.codex` durumundan ayrıdır.

OpenClaw Plugin’leri ve OpenClaw skill anlık görüntüleri hâlâ OpenClaw’ın kendi Plugin kayıt defteri ve skill yükleyicisi üzerinden akar. Kişisel Codex `~/.codex` varlıkları akmaz. Bir OpenClaw ajanının parçası olması gereken yararlı Codex CLI skill’leriniz veya Plugin’leriniz varsa bunları açıkça envantere alın:

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

Bir dağıtım ek ortam izolasyonuna ihtiyaç duyarsa bu değişkenleri `appServer.clearEnv` öğesine ekleyin:

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

`appServer.clearEnv` yalnızca oluşturulan Codex uygulama sunucusu alt sürecini etkiler. OpenClaw, yerel başlatma normalizasyonu sırasında `CODEX_HOME` ve `HOME` değerlerini bu listeden kaldırır: `CODEX_HOME` ajan başına kalır ve `HOME` alt süreçlerin normal kullanıcı home durumunu kullanabilmesi için devralınmış kalır.

## Dinamik araçlar

Codex dinamik araçları varsayılan olarak `searchable` yüklemeye ayarlıdır. OpenClaw, Codex’e yerel çalışma alanı işlemlerini yineleyen dinamik araçları sunmaz:

- `read`
- `write`
- `edit`
- `apply_patch`
- `exec`
- `process`
- `update_plan`

Mesajlaşma, medya, cron, tarayıcı, düğümler, Gateway, `heartbeat_respond` ve `web_search` gibi kalan OpenClaw entegrasyon araçlarının çoğu `openclaw` namespace’i altında Codex araç araması üzerinden kullanılabilir. Bu, başlangıç model bağlamını daha küçük tutar. `sessions_yield` ve yalnızca mesaj aracı kaynak yanıtları doğrudan kalır, çünkü bunlar tur kontrol sözleşmeleridir. `sessions_spawn` aranabilir kalır; böylece Codex’in yerel `spawn_agent` yüzeyi birincil Codex alt ajan yüzeyi olarak kalırken, açık OpenClaw veya ACP delegasyonu `openclaw` dinamik araç namespace’i üzerinden hâlâ kullanılabilir.

`codexDynamicToolsLoading: "direct"` seçeneğini yalnızca ertelenmiş dinamik araçları arayamayan özel bir Codex uygulama sunucusuna bağlanırken veya tam araç yükünde hata ayıklarken ayarlayın.

## Zaman aşımları

OpenClaw’a ait dinamik araç çağrıları `appServer.requestTimeoutMs` değerinden bağımsız olarak sınırlandırılır. Her Codex `item/tool/call` isteği, kullanılabilen ilk zaman aşımını şu sırayla kullanır:

- Pozitif bir çağrı başına `timeoutMs` bağımsız değişkeni.
- `image_generate` için `agents.defaults.imageGenerationModel.timeoutMs`.
- Yapılandırılmış zaman aşımı olmayan `image_generate` için 120 saniyelik görüntü oluşturma varsayılanı.
- Medya anlama `image` aracı için `tools.media.image.timeoutSeconds` değerinin milisaniyeye dönüştürülmüş hâli veya 60 saniyelik medya varsayılanı. Görüntü anlama için bu, isteğin kendisine uygulanır ve önceki hazırlık çalışmaları tarafından azaltılmaz.
- 90 saniyelik dinamik araç varsayılanı.

Bu watchdog, dış dinamik `item/tool/call` bütçesidir. Sağlayıcıya özgü istek zaman aşımları bu çağrının içinde çalışır ve kendi zaman aşımı semantiklerini korur. Dinamik araç bütçeleri 600000 ms ile sınırlandırılır. Zaman aşımında OpenClaw, desteklendiğinde araç sinyalini iptal eder ve Codex’e başarısız bir dinamik araç yanıtı döndürür; böylece oturum `processing` durumunda kalmak yerine tur devam edebilir.

Codex bir turu kabul ettikten ve OpenClaw tur kapsamlı bir uygulama sunucusu isteğine yanıt verdikten sonra harness, Codex’in geçerli turda ilerleme kaydetmesini ve sonunda yerel turu `turn/completed` ile bitirmesini bekler. Uygulama sunucusu `appServer.turnCompletionIdleTimeoutMs` boyunca sessiz kalırsa OpenClaw en iyi çabayla Codex turunu keser, tanısal bir zaman aşımı kaydeder ve takip sohbet mesajlarının bayat bir yerel turun arkasında kuyruğa alınmaması için OpenClaw oturum şeridini serbest bırakır.

Aynı turn için terminal olmayan bildirimlerin çoğu bu kısa watchdog'u devre dışı bırakır
çünkü Codex turn'ün hâlâ canlı olduğunu kanıtlamıştır. Araç devirleri daha uzun
bir araç sonrası boşta kalma bütçesi kullanır: OpenClaw bir `item/tool/call` yanıtı döndürdükten sonra, `commandExecution` gibi
yerel araç öğeleri tamamlandıktan sonra, ham
`custom_tool_call_output` tamamlanmalarından sonra ve araç sonrası ham assistant
ilerlemesi, ham reasoning tamamlanmaları veya reasoning ilerlemesinden sonra. Koruma,
yapılandırıldığında `appServer.postToolRawAssistantCompletionIdleTimeoutMs` kullanır ve
aksi halde varsayılan olarak beş dakikaya ayarlanır. Aynı araç sonrası bütçe, Codex bir sonraki
geçerli turn olayını yayımlamadan önceki sessiz sentez penceresi için
ilerleme watchdog'unu da uzatır. Reasoning tamamlanmaları, commentary
`agentMessage` tamamlanmaları ve araç öncesi ham reasoning veya assistant ilerlemesi
otomatik bir son yanıtla takip edilebilir; bu nedenle oturum şeridini hemen
serbest bırakmak yerine araç sonrası yanıt korumasını kullanırlar. Yalnızca
son/commentary olmayan tamamlanmış `agentMessage` öğeleri ve araç öncesi ham assistant
tamamlanmaları assistant çıktısı serbest bırakmasını kurar: Codex daha sonra
`turn/completed` olmadan sessiz kalırsa OpenClaw en iyi çabayla yerel turn'ü keser ve
oturum şeridini serbest bırakır. Assistant, araç, etkin öğe veya
yan etki kanıtı olmayan turn tamamlama boşta kalma zaman aşımları dahil, yeniden oynatma açısından güvenli stdio app-server hataları
yeni bir app-server denemesinde bir kez yeniden denenir. Güvensiz
zaman aşımları yine de takılı app-server istemcisini emekliye ayırır ve OpenClaw
oturum şeridini serbest bırakır. Ayrıca otomatik olarak yeniden oynatılmak yerine
eski yerel thread bağlamasını temizlerler. Tamamlama izleme zaman aşımları Codex'e özgü zaman aşımı
metnini gösterir: yeniden oynatma açısından güvenli durumlar yanıtın eksik olabileceğini söylerken,
güvensiz durumlar kullanıcıya yeniden denemeden önce geçerli durumu doğrulamasını
söyler. Genel zaman aşımı tanılamaları, son app-server bildirim yöntemi,
ham assistant yanıt öğesi id/type/role, etkin istek/öğe sayıları ve kurulmuş
izleme durumu gibi yapısal alanları içerir. Son bildirim ham assistant yanıt öğesi olduğunda,
sınırlı bir assistant metin önizlemesi de içerirler. Ham prompt veya
araç içeriği içermezler.

## Model keşfi

Varsayılan olarak Codex plugin'i kullanılabilir modelleri app-server'dan ister. Model
kullanılabilirliğinin sahibi Codex app-server'dır; bu nedenle OpenClaw paketlenmiş
`@openai/codex` sürümünü yükselttiğinde veya bir dağıtım
`appServer.command` değerini farklı bir Codex ikili dosyasına yönlendirdiğinde liste değişebilir.
Kullanılabilirlik hesaba bağlı da olabilir. Bu harness ve hesap için canlı kataloğu görmek üzere
çalışan bir gateway üzerinde `/codex models` kullanın.

Keşif başarısız olursa veya zaman aşımına uğrarsa OpenClaw şunlar için paketlenmiş bir yedek katalog kullanır:

- GPT-5.5
- GPT-5.4 mini
- GPT-5.2

Geçerli paketlenmiş harness `@openai/codex` `0.139.0` sürümüdür. Bu paketlenmiş app-server'a yönelik bir `model/list` yoklaması
şunu döndürdü:

| Model kimliği   | Varsayılan | Gizli | Girdi kipleri | Reasoning eforları       |
| --------------- | ---------- | ----- | ------------- | ------------------------ |
| `gpt-5.5`       | Evet       | Hayır | text, image   | low, medium, high, xhigh |
| `gpt-5.4`       | Hayır      | Hayır | text, image   | low, medium, high, xhigh |
| `gpt-5.4-mini`  | Hayır      | Hayır | text, image   | low, medium, high, xhigh |
| `gpt-5.3-codex` | Hayır      | Hayır | text, image   | low, medium, high, xhigh |
| `gpt-5.2`       | Hayır      | Hayır | text, image   | low, medium, high, xhigh |

Gizli modeller app-server kataloğu tarafından dahili veya
özel akışlar için döndürülebilir, ancak normal model seçici seçenekleri değildir.

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

Başlangıcın Codex'i yoklamaktan kaçınmasını ve yalnızca
yedek kataloğu kullanmasını istediğinizde keşfi devre dışı bırakın:

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

Codex, yerel proje belgesi keşfi üzerinden `AGENTS.md` dosyasını kendisi işler. OpenClaw,
sentetik Codex proje belgesi dosyaları yazmaz veya persona dosyaları için Codex yedek
dosya adlarına bağlı kalmaz; çünkü Codex yedekleri yalnızca
`AGENTS.md` eksik olduğunda uygulanır.

OpenClaw çalışma alanı eşliği için Codex harness diğer bootstrap
dosyalarını çözümler. `SOUL.md`, `IDENTITY.md`, `TOOLS.md` ve `USER.md`,
etkin ajanı, kullanılabilir çalışma alanı yönergelerini ve kullanıcı profilini tanımladıkları için
OpenClaw Codex geliştirici talimatları olarak iletilir. Kompakt OpenClaw skills
listesi, turn kapsamlı iş birliği geliştirici talimatları olarak iletilir.
`HEARTBEAT.md` içeriği enjekte edilmez; heartbeat turn'leri, dosya mevcut ve boş değilse
dosyayı okumaya yönelik bir iş birliği modu işaretçisi alır. Yapılandırılmış ajan çalışma alanından gelen
`MEMORY.md` içeriği, bu çalışma alanı için memory araçları kullanılabilir olduğunda
yerel Codex turn girdisine yapıştırılmaz; mevcut olduğunda harness,
turn kapsamlı iş birliği geliştirici talimatlarına küçük bir çalışma alanı belleği işaretçisi ekler
ve dayanıklı bellek ilgili olduğunda Codex `memory_search` veya `memory_get` kullanmalıdır.
Araçlar devre dışıysa, bellek araması kullanılamıyorsa veya
etkin çalışma alanı ajan bellek çalışma alanından farklıysa, `MEMORY.md`
normal sınırlı turn bağlamı yolunu kullanır.
`BOOTSTRAP.md` mevcut olduğunda OpenClaw turn girdisi referans
bağlamı olarak iletilir.

## Ortam geçersiz kılmaları

Ortam geçersiz kılmaları yerel test için kullanılabilir kalır:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN`, `appServer.command` ayarlanmamış olduğunda
yönetilen ikili dosyayı atlar.

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` kaldırıldı. Bunun yerine
`plugins.entries.codex.config.appServer.mode: "guardian"` kullanın veya
tek seferlik yerel test için `OPENCLAW_CODEX_APP_SERVER_MODE=guardian` kullanın. Tekrarlanabilir dağıtımlar için
yapılandırma tercih edilir; çünkü plugin davranışını Codex harness kurulumunun geri kalanıyla
aynı incelenmiş dosyada tutar.

## İlgili

- [Codex harness](/tr/plugins/codex-harness)
- [Codex harness runtime](/tr/plugins/codex-harness-runtime)
- [Yerel Codex plugins](/tr/plugins/codex-native-plugins)
- [Codex Computer Use](/tr/plugins/codex-computer-use)
- [OpenAI provider](/tr/providers/openai)
- [Yapılandırma referansı](/tr/gateway/configuration-reference)
