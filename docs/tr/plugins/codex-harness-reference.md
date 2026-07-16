---
read_when:
    - Her Codex harness yapılandırma alanına ihtiyacınız var
    - Uygulama sunucusunun aktarım, kimlik doğrulama, keşif veya zaman aşımı davranışını değiştiriyorsunuz
    - Codex donanımının başlatılması, model keşfi veya ortam yalıtımıyla ilgili hata ayıklıyorsunuz
summary: Codex çalışma sistemi için yapılandırma, kimlik doğrulama, keşif ve uygulama sunucusu referansı
title: Codex harness referansı
x-i18n:
    generated_at: "2026-07-16T17:23:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 00dd9050fdc9f2c179012285540f49ada8825f29be1d4630742a4d948a5318a1
    source_path: plugins/codex-harness-reference.md
    workflow: 16
---

Bu referans, resmi `codex` plugin'i için ayrıntılı yapılandırmayı kapsar.
Kurulum ve yönlendirme kararları için
[Codex yürütme ortamı](/tr/plugins/codex-harness) ile başlayın.

## Plugin yapılandırma yüzeyi

Tüm Codex yürütme ortamı ayarları `plugins.entries.codex.config` altında bulunur.

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

Üst düzey alanlar:

| Alan                       | Varsayılan               | Anlamı                                                                                                                                         |
| -------------------------- | ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `discovery`                | etkin                    | Codex app-server `model/list` için model keşfi ayarları.                                                                                       |
| `appServer`                | yönetilen stdio app-server | Aktarım, komut, kimlik doğrulama, onay, korumalı alan ve zaman aşımı ayarları. Olağan yürütme ortamı varsayılan olarak ajan kapsamlı durumu kullanır. |
| `codexDynamicToolsLoading` | `"searchable"`           | OpenClaw dinamik araçlarını doğrudan ilk Codex araç bağlamına yerleştirmek için `"direct"` kullanın.                                          |
| `codexDynamicToolsExclude` | `[]`                     | Codex app-server işlemlerinden hariç tutulacak ek OpenClaw dinamik araç adları.                                                               |
| `codexPlugins`             | devre dışı               | Bağlı hesap uygulamalarına isteğe bağlı erişim dâhil yerel Codex plugin/uygulama desteği. Bkz. [Yerel Codex plugin'leri](/tr/plugins/codex-native-plugins). |
| `computerUse`              | devre dışı               | Codex Computer Use kurulumu. Bkz. [Codex Computer Use](/tr/plugins/codex-computer-use).                                                           |
| `sessionCatalog`           | etkin                    | Kenar çubuğu için yerel Codex oturum keşfi. Sağlayıcıyı veya yürütme ortamını devre dışı bırakmadan keşfi devre dışı bırakmak için `enabled: false` ayarlayın. |
| `supervision`              | devre dışı               | Ajana yönelik yerel oturum dökümü ve yazma denetimi ilkesi. Bkz. [Codex denetimi](/plugins/codex-supervision).                                |

## Denetim

Yerel oturum keşfi, varsayılan olarak Gateway bilgisayarındaki ve katılımı etkinleştirilmiş eşleştirilmiş Node'lardaki arşivlenmemiş Codex oturumlarını listeler. Yalnızca bu kataloğu şu şekilde devre dışı bırakın:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          sessionCatalog: {
            enabled: false,
          },
        },
      },
    },
  },
}
```

`supervision`, ajana yönelik araçları ayrıca denetler:

| Alan                  | Varsayılan              | Anlamı                                                                                                                                                                                                                                    |
| --------------------- | ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`             | `false`                 | Ajana yönelik Codex denetim araçlarını etkinleştirir. Bu, kimliği doğrulanmış operatör oturum kataloğunu denetlemez.                                                                                                                       |
| `endpoints`           | yerleşik yerel uç nokta | Korunan Codex denetim ajanı ve bağımsız MCP araçları için uyumluluk ve gelişmiş uç nokta hedefleri. İnsan kataloğu ve dal akışı bu hedefleri yok sayar ve `appServer` üzerinden çözümlenen denetim App Server'ını kullanır.           |
| `allowRawTranscripts` | `false`                 | Denetim etkinken otonom ajan veya bağımsız MCP döküm okumalarına ve dökümden türetilen liste alanlarına izin verir. Yalnızca `codex_threads` meta veri okumaları kullanılabilir durumda kalır. Kimliği doğrulanmış Control UI devamını denetlemez. |
| `allowWriteControls`  | `false`                 | Denetim etkinken otonom `codex_threads` çatallama, yeniden adlandırma, arşivleme ve arşivden çıkarma değişikliklerinin yanı sıra bağımsız MCP gönderme, yönlendirme ve kesme işlemlerine izin verir. Diğer bağlama, ana makine, durum veya onay kontrollerini atlamaz. |

Uç nokta girdileri şu alanları kabul eder:

| Alan           | Geçerli olduğu yer | Anlamı                                                               |
| -------------- | ------------------- | -------------------------------------------------------------------- |
| `id`           | tümü                | Kararlı uç nokta kimliği.                                            |
| `label`        | tümü                | İsteğe bağlı görüntüleme etiketi.                                    |
| `transport`    | tümü                | `"stdio-proxy"` veya `"websocket"`.                                  |
| `command`      | `stdio-proxy`   | İsteğe bağlı App Server komutu.                                      |
| `args`         | `stdio-proxy`   | İsteğe bağlı komut bağımsız değişkenleri.                             |
| `cwd`          | `stdio-proxy`   | İsteğe bağlı alt süreç çalışma dizini.                               |
| `url`          | `websocket`   | Gerekli WebSocket veya desteklenen yerel soket URL'si.                |
| `authTokenEnv` | `websocket`   | Değeri uç noktanın kimliğini doğrulayan isteğe bağlı ortam değişkeni. |

**Codex Oturumları** sayfası, plugin'in denetim App Server'ını kullanır ve
yalnızca arşivlenmemiş oturumları gösterir. Açık `appServer` bağlantı ayarları
olmadan bu bağlantı, yönetilen kullanıcı ana dizini stdio'sudur. Depolanan veya boşta
olan yerel satırlar, son terminalde kalıcılaştırılmış kaynak işlemine kadar sınırlı
kullanıcı ve asistan geçmişiyle modele kilitli bir Sohbet oluşturabilir. Özel bağlaması;
anlık görüntü çatalını, kurallı `appServer` kaynak dalını, geçmiş eklemeyi ve
sonraki işlemleri bu bağlantıda tutar. İlk kurallı başlatma, çatalın döndürdüğü çifti
kullanır. Sonraki sürdürmeler OpenClaw model ve sağlayıcı geçersiz kılmalarını atlar;
böylece Codex, kurallı iş parçacığının kalıcılaştırılmış çiftini geri yükler. Ayrı bir
yerel değişiklik bu çifti güncelleyebilir ancak dış model ve yedek zinciri hiçbir zaman
onun yerine geçmez. Depolanan ve boşta olan satırlar, başka çalıştırıcı olmadığı
onaylandıktan sonra arşivlenebilir; ancak başka bir etkin OpenClaw bağlaması tam hedefin
veya onun arşivlenmemiş oluşturulmuş alt öğelerinden birinin sahibiyse arşivlenemez.
OpenClaw, Codex'in alt öğe sayfalamasını izler ve numaralandırma hatalarında, döngülerde
veya güvenlik sınırının tükenmesinde kapalı durumda başarısız olur. Onay, bilinmeyen
yerel istemcileri ve durumdan arşivlemeye geçiş yarışını kapsamaya devam eder. Denetlenen,
modele kilitli bir Sohbet, yerel bağlamayı korurken silinemez. Etkin kaynaklar bir dal
oluşturamaz veya arşivlenemez ancak mevcut denetlenen bir Sohbet yine de açılabilir.
Eşleştirilmiş Node'lardaki her satır salt okunur kalır; Node aktarımı henüz yürütme
ortamının gerektirdiği akış yaşam döngüsünü sağlamaz.

Yalnızca `appServer.homeScope: "user"`, yönetilen bir yürütme ortamı sürecinin hangi Codex ana
dizinini kullandığını değiştirir; filo kataloğunu yayımlamaz. Denetimi etkinleştirmek
yürütme ortamının varsayılanını değiştirmez. Bunun yerine, açık `appServer`
bağlantı ayarları olmadığında ayrı denetim bağlantısı varsayılan olarak yönetilen
kullanıcı ana dizini stdio'sunu kullanır. Açık ayarlar bu bağlantı için uygulanır.
Bekleyen ve kaydedilmiş denetimli bağlamalar bu bağlantıyı her işlem için korur;
devre dışı denetim veya bağlantı/yaşam döngüsü sapması, ajan ana dizini yürütme
ortamına geri dönmek yerine kapalı durumda başarısız olur. Varsayılan bağlantı,
yerel Codex istemcileriyle depolanan oturumları paylaşır; süreçlerine özgü etkinlik
durumunu paylaşmaz.

Eski `plugins.entries.codex-supervisor` ayarları kullanımdan kaldırılmıştır. Eski girdiyi, uç nokta
tanımlarını, ilke bayraklarını ve plugin izin/verme-reddetme başvurularını bu bloğa
taşımak için `openclaw doctor --fix` çalıştırın. Çakışmalarda açık kurallı
`codex.config.supervision` değerleri önceliklidir.

## App-server aktarımı

Olağan yürütme ortamı işlemleri için OpenClaw, resmi plugin ile birlikte gönderilen
yönetilen Codex ikili dosyasını başlatır (şu anda `@openai/codex` `0.144.3`):

```bash
codex app-server --listen stdio://
```

Bu, app-server sürümünü yerel olarak kurulmuş olabilecek ayrı bir Codex CLI yerine
resmi `codex` plugin'ine bağlı tutar. Yalnızca kasıtlı olarak farklı bir
yürütülebilir dosya kullanmak istediğinizde `appServer.command` ayarlayın. Varsayılan
yalıtılmış ajan ana dizinine sahip olağan yönetilen işlemler, bir macOS masaüstü paketi
kurulu olsa bile bu sabitlenmiş paketi tercih eder. [Computer Use](/tr/plugins/codex-computer-use)
etkinleştirildiğinde veya `homeScope`, `"user"` olduğunda ve yerel
Computer Use durumunu yükleyebildiğinde, yönetilen başlatma bunun yerine gerekli macOS
izinlerine sahip masaüstü uygulaması ikili dosyasını tercih eder. Aynı önce-masaüstü
kuralı, yalıtılmış bir ajan ana dizininin etkin Codex yapılandırması yerel Computer Use'ı
etkinleştirdiğinde de geçerlidir. Hiçbir masaüstü uygulaması paketi kurulu değilse
OpenClaw, sabitlenmiş paket ikili dosyasına geri döner.

Yürütülebilir dosya devri ve yerel yapılandırma sınırlandırması, çalışan tek bir Gateway
süreci içindeki istemcileri koordine eder. Başka bir süreç yerel Codex plugin
yapılandırmasını değiştirdikten sonra Gateway'i yeniden başlatın.

Denetim ayrı bir bağlantı çözümler. Açık `appServer` bağlantı ayarları yoksa
`homeScope: "user"` ile yönetilen stdio kullanır; olağan yürütme ortamı ise
`homeScope: "agent"` ile yönetilen stdio olarak kalır. Açık bağlantı ayarları her iki
yol tarafından da uygulanır. Olağan yürütme ortamının `$CODEX_HOME` (veya
`~/.codex`) öğesini yerel istemcilerle paylaşması gerektiğinde
`homeScope: "user"` öğesini açıkça ayarlayın. Özel bir denetimli bağlama, olağan
yürütme ortamı varsayılanından bağımsız olarak denetim bağlantısını kullanır. Bağımsız
App Server süreçleri ayrı canlı durum ve onay durumunu korur.

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

`appServer` alanları:

| Alan                                          | Varsayılan                                             | Anlamı                                                                                                                                                                                                                                                                                                                                                                                          |
| --------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                            | `"stdio"`                                     | `"stdio"` Codex'i başlatır; açıkça belirtilen `"unix"` yerel denetim soketine bağlanır; `"websocket"`, `url` hedefine bağlanır.                                                                                                                                                                                                                                |
| `homeScope`                            | `"agent"`                                     | `"agent"`, olağan çalıştırma altyapısı durumunu her OpenClaw aracısı için yalıtır. `"user"`, yerel `$CODEX_HOME` veya `~/.codex` öğesini paylaşan, yerel kimlik doğrulamayı kullanan ve yalnızca sahip tarafından iş parçacığı yönetimini etkinleştiren açık bir katılım seçeneğidir. Kullanıcı kapsamı, yerel stdio veya Unix aktarımını destekler. Ayrı gözetim bağlantısı için ayarlanmamış bir değer, stdio veya Unix için `"user"`, WebSocket için ise `"agent"` olarak çözümlenir. |
| `command`                            | yönetilen Codex ikili dosyası                          | stdio aktarımı için yürütülebilir dosya. Yönetilen ikili dosyayı kullanmak için ayarlamadan bırakın.                                                                                                                                                                                                                                                                                              |
| `args`                            | `["app-server", "--listen", "stdio://"]`                                     | stdio aktarımı için bağımsız değişkenler.                                                                                                                                                                                                                                                                                                                                                        |
| `url`                            | ayarlanmamış                                           | WebSocket App Server URL'si veya `unix://` URL'si. Açıkça belirtilen boş bir Unix yolu, kullanıcı ana dizinindeki standart denetim soketini seçer.                                                                                                                                                                                                                                        |
| `authToken`                            | ayarlanmamış                                           | WebSocket aktarımı için bearer token. Değişmez bir dizeyi veya `${CODEX_APP_SERVER_TOKEN}` gibi bir SecretInput değerini kabul eder.                                                                                                                                                                                                                                                                       |
| `headers`                            | `{}`                                     | Ek WebSocket üstbilgileri. Üstbilgi değerleri, örneğin `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"` gibi değişmez dizeleri veya SecretInput değerlerini kabul eder.                                                                                                                                                                                                                                                          |
| `clearEnv`                            | `[]`                                     | OpenClaw devralınan ortamını oluşturduktan sonra, başlatılan stdio app-server işleminden kaldırılan ek ortam değişkeni adları.                                                                                                                                                                                                                                                                    |
| `remoteWorkspaceRoot`                            | ayarlanmamış                                           | Uzak Codex app-server çalışma alanı kökü. Ayarlandığında OpenClaw, çözümlenen OpenClaw çalışma alanından yerel çalışma alanı kökünü çıkarır, geçerli cwd son ekini bu uzak kök altında korur ve Codex'e yalnızca nihai app-server cwd'sini gönderir. cwd, çözümlenen OpenClaw çalışma alanı kökünün dışındaysa OpenClaw, uzak app-server'a Gateway'e ait yerel bir yol göndermek yerine kapalı durumda başarısız olur. |
| `loopDetectionPreToolUseRelay`                            | `true`                                     | Yalnızca OpenClaw döngü algılaması ve bunun açık politikasızlık işaretçisi için kullanılan Codex `PreToolUse` alt işlemini kurar. Araç başına işlem dallanmasını azaltmak için `false` olarak ayarlayın. Araç öncesi Plugin kancaları ve güvenilir araç politikası, gerekli aktarıcılarını yine de kurar.                                                                                  |
| `requestTimeoutMs`                            | `60000`                                     | app-server denetim düzlemi çağrıları için zaman aşımı.                                                                                                                                                                                                                                                                                                                                           |
| `turnCompletionIdleTimeoutMs`                            | `60000`                                     | OpenClaw `turn/completed` öğesini beklerken, Codex bir turu kabul ettikten veya tur kapsamlı bir app-server isteğinden sonraki sessiz pencere.                                                                                                                                                                                                                                                   |
| `postToolRawAssistantCompletionIdleTimeoutMs`                            | `300000`                                     | OpenClaw `turn/completed` öğesini beklerken bir araç devrinden, yerel araç tamamlanmasından, araç sonrası ham asistan ilerlemesinden, ham akıl yürütme tamamlanmasından veya akıl yürütme ilerlemesinden sonra kullanılan tamamlanma-boşta kalma ve ilerleme koruması. Araç sonrası sentezin nihai asistan yayın bütçesinden meşru biçimde daha uzun süre sessiz kalabildiği güvenilir veya ağır iş yükleri için bunu kullanın. |
| `mode`                            | yerel Codex gereksinimleri YOLO'ya izin vermiyorsa `"yolo"` | YOLO veya koruyucu tarafından incelenen yürütme için ön ayar.                                                                                                                                                                                                                                                                                                                                     |
| `approvalPolicy`                            | `"never"` veya izin verilen bir koruyucu onay politikası | İş parçacığı başlatılırken, sürdürülürken ve tur sırasında gönderilen yerel Codex onay politikası.                                                                                                                                                                                                                                                                                                 |
| `sandbox`                            | `"danger-full-access"` veya izin verilen bir koruyucu korumalı alanı | İş parçacığı başlatılırken ve sürdürülürken gönderilen yerel Codex korumalı alan modu. Etkin OpenClaw korumalı alanları, `danger-full-access` turlarını Codex `workspace-write` ile sınırlar; turun ağ bayrağı OpenClaw korumalı alanının dışarı çıkış ayarını izler.                                                                                                                                     |
| `approvalsReviewer`                            | `"user"` veya izin verilen bir koruyucu inceleyici | İzin verildiğinde Codex'in yerel onay istemlerini incelemesini sağlamak için `"auto_review"` kullanın.                                                                                                                                                                                                                                                                                          |
| `defaultWorkspaceDir`                            | geçerli işlem dizini                                   | `--cwd` atlandığında `/codex bind` tarafından kullanılan çalışma alanı.                                                                                                                                                                                                                                                                                                          |
| `serviceTier`                            | ayarlanmamış                                           | İsteğe bağlı Codex app-server hizmet katmanı. `"priority"` hızlı mod yönlendirmesini etkinleştirir, `"flex"` esnek işleme ister ve `null` geçersiz kılmayı temizler. Eski `"fast"`, `"priority"` olarak kabul edilir.                                                                                                                                         |
| `networkProxy`                            | devre dışı                                             | app-server komutları için Codex izin profili ağ kullanımına katılın. OpenClaw, seçilen `permissions.<profile>.network` yapılandırmasını tanımlar ve `sandbox` göndermek yerine bunu `default_permissions` ile seçer.                                                                                                                                                                                        |
| `experimental.sandboxExecServer`                            | `false`                                     | Yerel Codex yürütmesinin etkin OpenClaw korumalı alanı içinde çalışabilmesi için, desteklenen Codex app-server'a OpenClaw korumalı alanıyla desteklenen bir Codex ortamı kaydeden önizleme katılım seçeneği.                                                                                                                                                                                         |

`appServer.networkProxy`, Codex sandbox sözleşmesini değiştirdiği için açıkça belirtilir. Etkinleştirildiğinde OpenClaw, oluşturulan izin profilinin Codex tarafından yönetilen ağı başlatabilmesi için Codex iş parçacığı yapılandırmasında `features.network_proxy.enabled` ve `default_permissions` değerlerini de ayarlar. OpenClaw varsayılan olarak profil gövdesinden çakışmaya dayanıklı bir `openclaw-network-<fingerprint>` profil adı oluşturur; `profileName` seçeneğini yalnızca kararlı bir yerel ad gerektiğinde kullanın.

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

Normal app-server çalışma zamanı `danger-full-access` olacaksa, `networkProxy` seçeneğinin etkinleştirilmesi oluşturulan izin profili için bunun yerine çalışma alanı tarzı dosya sistemi erişimini kullanır. Codex tarafından yönetilen ağ uygulaması, sandbox içinde çalışan ağdır; dolayısıyla tam erişimli bir profil giden trafiği korumaz.

Plugin, eski veya sürümsüz app-server el sıkışmalarını engeller: Codex app-server, kararlı `0.143.0` sürümünü veya daha yeni bir sürümü bildirmelidir.

OpenClaw, geri döngü dışındaki WebSocket app-server URL'lerini uzak olarak değerlendirir ve `appServer.authToken` ya da bir `Authorization` üst bilgisi aracılığıyla kimlik taşıyan WebSocket kimlik doğrulaması gerektirir. `appServer.authToken` ve her `appServer.headers.*` değeri bir SecretInput olabilir; secrets çalışma zamanı, OpenClaw app-server başlatma seçeneklerini oluşturmadan önce SecretRef'leri ve env kısa gösterimini çözümler ve çözümlenmemiş yapılandırılmış SecretRef'ler herhangi bir token veya üst bilgi gönderilmeden önce başarısız olur. Yerel Codex plugin'leri yapılandırıldığında OpenClaw, bu plugin'leri yüklemek veya yenilemek için bağlı app-server'ın plugin kontrol düzlemini kullanır ve ardından plugin'e ait uygulamaların Codex iş parçacığında görünür olması için uygulama envanterini yeniler. `app/list` hâlâ yetkili envanter ve meta veri kaynağıdır; ancak Codex şu anda devre dışı olarak işaretlese bile, listelenen erişilebilir bir uygulama için `thread/start` işleminin `config.apps[appId].enabled = true` gönderip göndermeyeceğine OpenClaw politikası karar verir. Bilinmeyen veya eksik uygulama kimlikleri güvenli biçimde kapalı kalır; bu yol yalnızca `plugin/install` aracılığıyla pazar yeri plugin'lerini etkinleştirir ve envanteri yeniler. OpenClaw'ı yalnızca OpenClaw tarafından yönetilen plugin yüklemelerini ve uygulama envanteri yenilemelerini kabul edeceğine güvenilen uzak app-server'lara bağlayın.

## Onay ve sandbox modları

Yerel stdio app-server oturumları varsayılan olarak YOLO modunu kullanır:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` ve
`sandbox: "danger-full-access"`. Bu güvenilir yerel operatör yaklaşımı, gözetimsiz OpenClaw dönüşlerinin ve Heartbeat'lerin yanıtlayacak kimsenin bulunmadığı yerel onay istemleri olmadan ilerlemesini sağlar.

Codex'in yerel sistem gereksinimleri dosyası örtük YOLO onayı, inceleyici veya sandbox değerlerine izin vermiyorsa OpenClaw, örtük varsayılanı bunun yerine guardian olarak değerlendirir ve izin verilen guardian izinlerini seçer. `tools.exec.mode: "auto"` ayrıca guardian tarafından incelenen Codex onaylarını zorunlu kılar ve güvenli olmayan eski `approvalPolicy: "never"` veya `sandbox: "danger-full-access"` geçersiz kılmalarını korumaz; onaysız bir yaklaşımı bilerek kullanmak için `tools.exec.mode: "full"` değerini ayarlayın. Aynı gereksinimler dosyasındaki ana bilgisayar adıyla eşleşen `[[remote_sandbox_config]]` girdileri, sandbox varsayılanı kararında dikkate alınır.

Codex'in guardian tarafından incelenen onayları için `appServer.mode: "guardian"` değerini ayarlayın:

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

`guardian` ön ayarı, bu değerlere izin verildiğinde `approvalPolicy: "on-request"`, `approvalsReviewer: "auto_review"` ve `sandbox: "workspace-write"` değerlerine genişler. Tek tek politika alanları `mode` değerini geçersiz kılar. Eski `guardian_subagent` inceleyici değeri hâlâ uyumluluk takma adı olarak kabul edilir, ancak yeni yapılandırmalar `auto_review` kullanmalıdır.

Bir OpenClaw sandbox'ı etkinken yerel Codex app-server işlemi yine Gateway ana bilgisayarında çalışır. Bu nedenle OpenClaw, Codex'in ana bilgisayar tarafındaki sandbox işlevini OpenClaw sandbox arka ucuyla eşdeğer saymak yerine, o dönüş için Codex'in yerel Code Mode'unu, kullanıcı MCP sunucularını ve uygulama destekli plugin yürütmesini devre dışı bırakır. Normal exec/process araçları kullanılabildiğinde kabuk erişimi, `sandbox_exec` ve `sandbox_process` gibi OpenClaw sandbox destekli dinamik araçlar aracılığıyla sunulur.

<Note>
Docker destekli OpenClaw sandbox ana bilgisayarlarında (`agents.defaults.sandbox.mode` bir Docker arka ucuna ayarlandığında), `openclaw doctor`, sandbox kapsayıcısı içindeki `workspace-write` kabuk yürütmesi için iç içe Codex `bwrap` tarafından gereken ayrıcalıksız kullanıcı ad alanlarına ve Docker sandbox ağ çıkışı devre dışı bırakıldığında ağ ad alanlarına ana bilgisayarın izin verip vermediğini sınar. Başarısız bir sınama, Ubuntu/AppArmor ana bilgisayarlarında genellikle `bwrap: setting up uid map: Permission denied` veya `bwrap: loopback: Failed RTM_NEWADDR: Operation not permitted` olarak görünür. OpenClaw hizmet kullanıcısı için bildirilen ana bilgisayar ad alanı politikasını düzeltin ve Gateway'i yeniden başlatın; ana bilgisayar genelindeki `kernel.apparmor_restrict_unprivileged_userns=0` geri dönüşü yerine hizmet işlemi için kapsamlı bir AppArmor profili tercih edin ve yalnızca iç içe `bwrap` gereksinimini karşılamak amacıyla Docker kapsayıcısına daha geniş ayrıcalıklar vermeyin.
</Note>

## Sandbox içinde yerel yürütme

Kararlı varsayılan, güvenli biçimde kapalı olmaktır: etkin OpenClaw sandbox işlevi, aksi hâlde Codex app-server ana bilgisayarından çalışacak yerel Codex yürütme yüzeylerini devre dışı bırakır. Codex'in uzak ortam desteğini OpenClaw'ın sandbox arka ucuyla denemek istediğinizde yalnızca `appServer.experimental.sandboxExecServer: true` seçeneğini kullanın. Bu önizleme yolu, desteklenen tüm Codex app-server sürümleriyle çalışır.

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

Bayrak açıkken ve geçerli OpenClaw oturumu sandbox içindeyken OpenClaw, etkin sandbox tarafından desteklenen yerel bir geri döngü exec-server'ı başlatır, bunu Codex app-server'a kaydeder ve Codex iş parçacığı ile dönüşünü OpenClaw'a ait bu ortamla başlatır. App-server ortamı kaydedemezse çalışma, sessizce ana bilgisayar yürütmesine geri dönmek yerine güvenli biçimde kapalı olarak başarısız olur.

Bu önizleme yolu yalnızca yereldir. Uzak bir WebSocket app-server, aynı ana bilgisayarda çalışmadığı sürece geri döngü exec-server'a erişemez; bu nedenle OpenClaw bu birleşimi reddeder.

## Kimlik doğrulama ve ortam yalıtımı

Varsayılan aracı başına ana dizinde kimlik doğrulaması şu sırayla seçilir:

1. Aracı için açıkça belirtilmiş bir OpenClaw Codex kimlik doğrulama profili.
2. App-server'ın söz konusu aracının Codex ana dizinindeki mevcut hesabı.
3. Yalnızca yerel stdio app-server başlatmalarında, app-server hesabı bulunmadığında ve OpenAI kimlik doğrulaması hâlâ gerektiğinde önce `CODEX_API_KEY`, ardından `OPENAI_API_KEY`.

OpenClaw, ChatGPT aboneliği tarzında bir Codex kimlik doğrulama profili (OAuth veya token kimlik bilgisi türü) gördüğünde, oluşturulan Codex alt işleminden `CODEX_API_KEY` ve `OPENAI_API_KEY` değerlerini kaldırır. Bu, Gateway düzeyindeki API anahtarlarını yerleştirmeler veya doğrudan OpenAI modelleri için kullanılabilir tutarken yerel Codex app-server dönüşlerinin yanlışlıkla API üzerinden faturalandırılmasını önler.

Açık Codex API anahtarı profilleri ve yerel stdio env anahtarı geri dönüşü, devralınan alt işlem env'si yerine app-server oturum açma işlemini kullanır. WebSocket app-server bağlantıları Gateway env API anahtarı geri dönüşünü almaz; açık bir kimlik doğrulama profili veya uzak app-server'ın kendi hesabını kullanın.

Stdio app-server başlatmaları varsayılan olarak OpenClaw'ın işlem ortamını devralır. OpenClaw, Codex app-server hesap köprüsüne sahiptir ve `CODEX_HOME` değerini söz konusu aracının OpenClaw durumu altındaki aracı başına bir dizine ayarlar. Bu, Codex yapılandırmasını, hesaplarını, plugin önbelleğini/verilerini ve iş parçacığı durumunu operatörün kişisel `~/.codex` ana dizininden sızmak yerine OpenClaw aracısıyla sınırlar.

Yerel Codex durumunu Codex Desktop ve CLI ile paylaşmak için `appServer.homeScope: "user"` değerini ayarlayın. Bu yerel kullanıcı ana dizini modu, yönetilen stdio ve açık Unix aktarımını destekler. Ayarlandığında `$CODEX_HOME`, aksi hâlde `~/.codex` kullanır; buna yerel kimlik doğrulaması, yapılandırma, plugin'ler ve iş parçacıkları dahildir. OpenClaw, app-server için kimlik doğrulama profili köprüsünü atlar. Doğrulanmış sahip dönüşleri, bu iş parçacıklarını listelemek (isteğe bağlı `search` filtresiyle), okumak, çatallamak, yeniden adlandırmak, arşivlemek ve arşivden çıkarmak için `codex_threads` kullanabilir. OpenClaw'da devam etmeden önce iş parçacığını çatallayın; bağımsız Codex işlemleri aynı iş parçacığına eşzamanlı yazanları koordine etmez.

Bu `homeScope` kabulü sıradan harness oturumları için geçerlidir. Codex Sessions aracılığıyla oluşturulan bir Chat bunun yerine özel denetim bağlantısını kullanır; bu bağlantı, kurallı dal ve gelecekteki sürdürmeler için yerel bağlantının kimlik doğrulamasını ve sağlayıcı yapılandırmasını korur.

Modeli kilitlenmiş, denetlenen bir Chat'te `codex_threads`, farklı bir çatalı bağlayamaz veya Chat'e bağlı yerel iş parçacığını arşivleyemez. Listeleme ve yalnızca meta veri okuma kullanılabilir kalır. Ham transkript okumaları `allowRawTranscripts` gerektirir; devre dışı bırakıldığında yerel arama transkript önizlemeleriyle eşleşebileceği için liste araması da reddedilir. Başka bir OpenClaw Chat'e ait olmayan, ilgisiz bir iş parçacığını yeniden adlandırmak, arşivden çıkarmak, ayrık şekilde çatallamak ve arşivlemek `allowWriteControls` gerektirir. İki seçenek de kilitli bir bağlamayı atlamaz.

OpenClaw, normal yerel app-server başlatmaları için `HOME` değerini yeniden yazmaz. `openclaw`, `gh`, `git`, bulut CLI'ları ve kabuk komutları gibi Codex tarafından çalıştırılan alt işlemler normal işlem ana dizinini görür ve kullanıcı ana dizini yapılandırması ile token'ları bulabilir. Codex ayrıca `$HOME/.agents/skills` ve `$HOME/.agents/plugins/marketplace.json` öğelerini keşfedebilir; bu `.agents` keşfi operatör ana diziniyle bilerek paylaşılır ve yalıtılmış `~/.codex` durumundan ayrıdır.

Varsayılan aracı kapsamında OpenClaw plugin'leri ve OpenClaw Skills anlık görüntüleri yine OpenClaw'ın kendi plugin kayıt defteri ve skill yükleyicisi üzerinden akar; kişisel Codex `~/.codex` varlıkları akmaz. Yalıtılmış bir OpenClaw aracısının parçası olması gereken bir Codex ana dizininden yararlı Codex CLI skill'leriniz veya plugin'leriniz varsa bunların envanterini açıkça çıkarın:

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

Bir dağıtım ek ortam yalıtımına ihtiyaç duyuyorsa bu değişkenleri `appServer.clearEnv` öğesine ekleyin:

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

`appServer.clearEnv` yalnızca oluşturulan Codex app-server alt işlemini etkiler. OpenClaw, yerel başlatma normalleştirmesi sırasında `CODEX_HOME` ve `HOME` değerlerini bu listeden kaldırır: `CODEX_HOME` seçilen aracı veya kullanıcı kapsamını göstermeye devam eder ve `HOME`, alt işlemlerin normal kullanıcı ana dizini durumunu kullanabilmesi için devralınmaya devam eder.

## Dinamik araçlar

Codex dinamik araçları varsayılan olarak `searchable` yüklemesini kullanır ve `deferLoading: true` ile `openclaw` ad alanı altında sunulur. OpenClaw normalde Codex'in yerel çalışma alanı işlemlerini veya Codex'in kendi araç arama yüzeyini yineleyen dinamik araçları sunmaz:

- `read`
- `write`
- `edit`
- `apply_patch`
- `exec`
- `process`
- `update_plan`
- `tool_call`
- `tool_describe`
- `tool_search`
- `tool_search_code`

Sonlu bir çalışma zamanı izin listesi yerel Code Mode'u devre dışı bıraktığında OpenClaw boş bir yürütme ortamı seçimi gönderir. Bu doğrudan, sandbox'sız durumda OpenClaw, ilkeyle filtrelenmiş `exec` ve `process` araçlarını kabuk geri dönüşü olarak tutar. Çalışma zamanı izin listeleri ve `codexDynamicToolsExclude` uygulanmaya devam eder.

Mesajlaşma, medya, cron, tarayıcı, Node'lar, Gateway, `heartbeat_respond` ve `web_search` gibi kalan OpenClaw entegrasyon araçlarının çoğuna bu ad alanı altındaki Codex araç araması üzerinden erişilebilir. Bu, başlangıçtaki model bağlamını daha küçük tutar. Codex araç araması kullanılamayabileceği veya yalnızca bağlayıcılardan oluşan bir evren çözümleyebileceği için küçük bir araç kümesi, `codexDynamicToolsLoading` ne olursa olsun doğrudan çağrılabilir durumda kalır: `agents_list`, `sessions_spawn` ve `sessions_yield`. Geliştirici talimatları, normal Codex alt ajanlarını Codex'e özgü alt ajan çalışmaları için yerel `spawn_agent` kullanımına yönlendirmeye devam ederken `sessions_spawn`, açık OpenClaw veya ACP delegasyonu için kullanılabilir durumda kalır. Yalnızca mesaj aracını kullanan kaynak yanıtları da doğrudan kalır; çünkü bu, bir tur denetimi sözleşmesidir.

OpenClaw `computer` aracı dâhil olmak üzere `catalogMode: "direct-only"` olarak işaretlenen araçlar, `openclaw_direct` altında gruplandırılır. OpenClaw, operatör tarafından sağlanan girdileri değiştirmeden bu ad alanını Codex'in `code_mode.direct_only_tool_namespaces` listesine ekler. Bu nedenle Codex, bu araçları iç içe Code Mode `tools.*` çağrıları üzerinden yönlendirmek yerine normal ve yalnızca kod modu iş parçacıklarında `DirectModelOnly` olarak kullanıma sunar. Bu sınır, görüntü içeren sonuçlar için gereklidir: iç içe Code Mode serileştirmesi görüntü çıktısını metne düzleştirir ve bu da bir sonraki bilgisayar eylemi için gereken ekran görüntüsünü yok eder.

`codexDynamicToolsLoading: "direct"` değerini yalnızca ertelenmiş dinamik araçları arayamayan özel bir Codex uygulama sunucusuna bağlanırken veya tam araç yükünde hata ayıklarken ayarlayın.

## Zaman aşımları

OpenClaw'a ait dinamik araç çağrıları, `appServer.requestTimeoutMs` değerinden bağımsız olarak sınırlandırılır. Her Codex `item/tool/call` isteği, aşağıdaki sırada kullanılabilir olan ilk zaman aşımını kullanır:

- Çağrı başına pozitif bir `timeoutMs` bağımsız değişkeni.
- `image_generate` için `agents.defaults.imageGenerationModel.timeoutMs`.
- Yapılandırılmış bir zaman aşımı olmadan `image_generate` için 120 saniyelik varsayılan görüntü oluşturma süresi.
- Medya anlama `image` aracı için milisaniyeye dönüştürülmüş `tools.media.image.timeoutSeconds` veya 60 saniyelik varsayılan medya süresi. Görüntü anlama için bu süre isteğin kendisine uygulanır ve daha önceki hazırlık çalışmaları nedeniyle azaltılmaz.
- `message` aracı için sabit 120 saniyelik varsayılan süre.
- 90 saniyelik varsayılan dinamik araç süresi.

Bu gözetleyici, dış dinamik `item/tool/call` bütçesidir. Sağlayıcıya özgü istek zaman aşımları bu çağrının içinde çalışır ve kendi zaman aşımı semantiklerini korur. Dinamik araç bütçeleri 600000 ms ile sınırlandırılır. Zaman aşımında OpenClaw, desteklendiği durumlarda araç sinyalini iptal eder ve oturumu `processing` durumunda bırakmak yerine turun devam edebilmesi için Codex'e başarısız bir dinamik araç yanıtı döndürür.

Codex bir turu kabul ettikten ve OpenClaw tur kapsamlı bir uygulama sunucusu isteğine yanıt verdikten sonra, donanım Codex'in geçerli turda ilerleme kaydetmesini ve sonunda yerel turu `turn/completed` ile tamamlamasını bekler. Uygulama sunucusu `appServer.turnCompletionIdleTimeoutMs` boyunca sessiz kalırsa OpenClaw, Codex turunu elinden gelen şekilde kesintiye uğratır, tanılama amaçlı bir zaman aşımı kaydeder ve sonraki sohbet mesajlarının eski bir yerel turun arkasında kuyruğa alınmaması için OpenClaw oturum kanalını serbest bırakır.

Aynı turdaki terminal olmayan bildirimlerin çoğu, Codex turun hâlâ etkin olduğunu kanıtladığından bu kısa gözetleyiciyi devre dışı bırakır. Araç devirleri daha uzun bir araç sonrası boşta kalma bütçesi kullanır: OpenClaw bir `item/tool/call` yanıtı döndürdükten, `commandExecution` gibi yerel araç öğeleri tamamlandıktan, ham `custom_tool_call_output` tamamlamalarından ve araç sonrası ham asistan ilerlemesi, ham akıl yürütme tamamlamaları veya akıl yürütme ilerlemesinden sonra. Koruma, yapılandırıldığında `appServer.postToolRawAssistantCompletionIdleTimeoutMs` kullanır; aksi takdirde varsayılan olarak beş dakika kullanır. Aynı araç sonrası bütçe, Codex'in bir sonraki geçerli tur olayını yayımlamasından önceki sessiz sentez penceresi için ilerleme gözetleyicisini de uzatır. Akıl yürütme tamamlamalarını, commentary `agentMessage` tamamlamalarını ve araç öncesi ham akıl yürütme veya asistan ilerlemesini otomatik bir nihai yanıt izleyebileceğinden bunlar, oturum kanalını hemen serbest bırakmak yerine ilerleme sonrası yanıt korumasını kullanır. Yalnızca nihai/commentary dışı tamamlanmış `agentMessage` öğeleri ve araç öncesi ham asistan tamamlamaları asistan çıktısı serbest bırakmasını etkinleştirir: Codex daha sonra `turn/completed` olmadan sessiz kalırsa OpenClaw, yerel turu elinden gelen şekilde kesintiye uğratır ve oturum kanalını serbest bırakır. Asistan, araç, etkin öğe veya yan etki kanıtı bulunmayan tur tamamlama boşta kalma zaman aşımları dâhil, yeniden oynatılması güvenli stdio uygulama sunucusu hataları yeni bir uygulama sunucusu denemesinde bir kez yeniden denenir. Güvenli olmayan zaman aşımları yine de takılı kalan uygulama sunucusu istemcisini devreden çıkarır ve OpenClaw oturum kanalını serbest bırakır. Ayrıca otomatik olarak yeniden oynatılmak yerine eski yerel iş parçacığı bağlamasını temizler. Tamamlama izleme zaman aşımları Codex'e özgü zaman aşımı metni gösterir: yeniden oynatılması güvenli durumlarda yanıtın eksik olabileceği belirtilirken güvenli olmayan durumlarda kullanıcıya yeniden denemeden önce mevcut durumu doğrulaması söylenir. Genel zaman aşımı tanılamaları; son uygulama sunucusu bildirim yöntemi, ham asistan yanıtı öğesinin kimliği/türü/rolü, etkin istek/öğe sayıları ve etkinleştirilmiş izleme durumu gibi yapısal alanlar içerir. Son bildirim ham bir asistan yanıtı öğesi olduğunda sınırlı bir asistan metni önizlemesi de içerir. Ham istem veya araç içeriği içermez.

## Model keşfi

Codex Plugin, varsayılan olarak kullanılabilir modelleri uygulama sunucusundan ister. Model kullanılabilirliği Codex uygulama sunucusuna aittir; dolayısıyla OpenClaw, paketlenmiş `@openai/codex` sürümünü yükselttiğinde veya bir dağıtım `appServer.command` değerini farklı bir Codex ikili dosyasına yönlendirdiğinde liste değişebilir. Kullanılabilirlik ayrıca hesap kapsamlı olabilir. İlgili donanım ve hesabın canlı kataloğunu görmek için çalışan bir Gateway üzerinde `/codex models` kullanın.

Keşif başarısız olursa veya zaman aşımına uğrarsa OpenClaw, paketlenmiş bir yedek kataloğu kullanır:

| Model kimliği       | Görünen ad | Akıl yürütme düzeyleri        |
| -------------- | ------------ | ------------------------ |
| `gpt-5.5`      | gpt-5.5      | düşük, orta, yüksek, çok yüksek |
| `gpt-5.4-mini` | GPT-5.4-Mini | düşük, orta, yüksek, çok yüksek |

<Note>
Paketlenmiş mevcut donanım `@openai/codex` `0.144.3` sürümüdür. Bu paketlenmiş uygulama sunucusuna karşı yapılan bir `model/list` yoklaması, aşağıdaki genel seçici satırlarını döndürdü:

| Model kimliği        | Girdi modaliteleri | Akıl yürütme düzeyleri                    |
| --------------- | ---------------- | ------------------------------------ |
| `gpt-5.6-sol`   | metin, görüntü      | düşük, orta, yüksek, çok yüksek, maksimum, ultra |
| `gpt-5.6-terra` | metin, görüntü      | düşük, orta, yüksek, çok yüksek, maksimum, ultra |
| `gpt-5.6-luna`  | metin, görüntü      | düşük, orta, yüksek, çok yüksek, maksimum        |
| `gpt-5.5`       | metin, görüntü      | düşük, orta, yüksek, çok yüksek             |
| `gpt-5.4`       | metin, görüntü      | düşük, orta, yüksek, çok yüksek             |
| `gpt-5.4-mini`  | metin, görüntü      | düşük, orta, yüksek, çok yüksek             |
| `gpt-5.2`       | metin, görüntü      | düşük, orta, yüksek, çok yüksek             |

Uygulama sunucusu kataloğu `ultra` bildirebilir; OpenClaw akıl yürütme denetimleri şu anda `max` düzeyine kadar seçenekler sunar.

Canlı seçici satırları hesap kapsamlıdır ve hesap, Codex kataloğu veya paketlenmiş sürümle birlikte değişebilir; belirli bir zamana ait tabloya güvenmek yerine geçerli liste için `/codex models` çalıştırın. Gizli modeller de normal model seçici seçenekleri olmadan dahili veya özel akışlar için uygulama sunucusu kataloğunda görünebilir.
</Note>

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

Başlangıçta Codex yoklamasından kaçınmak ve yalnızca yedek kataloğu kullanmak istediğinizde keşfi devre dışı bırakın:

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

Codex, yerel proje belgesi keşfi aracılığıyla `AGENTS.md` öğesini kendisi işler. Codex yedekleri yalnızca `AGENTS.md` eksik olduğunda geçerli olduğundan OpenClaw, yapay Codex proje belgesi dosyaları yazmaz veya kişilik dosyaları için Codex yedek dosya adlarına bağımlı olmaz.

OpenClaw çalışma alanıyla eş değerlik için Codex donanımı diğer önyükleme dosyalarını geliştirici talimatları olarak iletir, ancak bunları aynı şekilde iletmez:

- `TOOLS.md`, **devralınan** Codex geliştirici talimatları olarak iletilir; böylece tur sırasında oluşturulan yerel Codex alt ajanları da bunları görür.
- `SOUL.md`, `IDENTITY.md` ve `USER.md`, **tur kapsamlı** iş birliği talimatları olarak iletilir. Yerel Codex alt ajanları bunları devralmaz; bu, alt ajan turlarının üst ajanın kişiliğini ve kullanıcı profilini almasını önler.
- Yüklenen kompakt OpenClaw Skills listesi de tur kapsamlı iş birliği geliştirici talimatları olarak iletilir; böylece yerel Codex alt ajanları bunu da devralmaz.
- `HEARTBEAT.md` içeriği eklenmez; Heartbeat turları, dosya mevcut ve boş değilse dosyayı okumak için iş birliği modu işaretçisi alır.
- Yapılandırılmış ajan çalışma alanındaki `MEMORY.md` içeriği, ilgili çalışma alanında bellek araçları kullanılabildiğinde yerel Codex tur girdisine yapıştırılmaz; dosya mevcutsa donanım, tur kapsamlı iş birliği geliştirici talimatlarına küçük bir çalışma alanı belleği işaretçisi ekler ve kalıcı bellek önemli olduğunda Codex, `memory_search` veya `memory_get` kullanmalıdır. Araçlar devre dışıysa, bellek araması kullanılamıyorsa veya etkin çalışma alanı ajan belleği çalışma alanından farklıysa `MEMORY.md`, normal sınırlı tur bağlamı yolunu kullanır.
- `BOOTSTRAP.md`, mevcut olduğunda OpenClaw tur girdisi başvuru bağlamı olarak iletilir.

## Ortam geçersiz kılmaları

Yerel testler için ortam geçersiz kılmaları kullanılabilir durumda kalır:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`appServer.command` ayarlanmamışsa `OPENCLAW_CODEX_APP_SERVER_BIN`, yönetilen ikili dosyayı atlar.

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` kaldırıldı. Bunun yerine `plugins.entries.codex.config.appServer.mode: "guardian"` veya tek seferlik yerel testler için `OPENCLAW_CODEX_APP_SERVER_MODE=guardian` kullanın. Tekrarlanabilir dağıtımlarda yapılandırma tercih edilir; çünkü Plugin davranışını Codex donanımı kurulumunun geri kalanıyla aynı gözden geçirilmiş dosyada tutar.

## İlgili

- [Codex donanımı](/tr/plugins/codex-harness)
- [Codex donanımı çalışma zamanı](/tr/plugins/codex-harness-runtime)
- [Codex gözetimi](/plugins/codex-supervision)
- [Yerel Codex Plugin'leri](/tr/plugins/codex-native-plugins)
- [Codex Bilgisayar Kullanımı](/tr/plugins/codex-computer-use)
- [OpenAI sağlayıcısı](/tr/providers/openai)
- [Yapılandırma başvurusu](/tr/gateway/configuration-reference)
