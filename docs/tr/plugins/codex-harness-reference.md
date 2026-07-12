---
read_when:
    - Her Codex harness yapılandırma alanına ihtiyacınız var
    - Uygulama sunucusunun aktarım, kimlik doğrulama, keşif veya zaman aşımı davranışını değiştiriyorsunuz
    - Codex çalışma düzeneği başlatma, model keşfi veya ortam yalıtımı sorunlarını ayıklıyorsunuz
summary: Codex çalışma düzeneği için yapılandırma, kimlik doğrulama, keşif ve uygulama sunucusu başvurusu
title: Codex çalışma düzeni referansı
x-i18n:
    generated_at: "2026-07-12T12:31:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eb3dcb14d9dbd70a225c13f239369b6d9d2cc0b0681aa29265f528287a6a8e4c
    source_path: plugins/codex-harness-reference.md
    workflow: 16
---

Bu başvuru, resmi `codex` Plugin'i için ayrıntılı yapılandırmayı kapsar.
Kurulum ve yönlendirme kararları için
[Codex çalıştırma ortamı](/tr/plugins/codex-harness) ile başlayın.

## Plugin yapılandırma yüzeyi

Tüm Codex çalıştırma ortamı ayarları `plugins.entries.codex.config` altında bulunur.

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

| Alan                       | Varsayılan                 | Anlamı                                                                                                                                                                                                 |
| -------------------------- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `discovery`                | etkin                      | Codex app-server `model/list` için model keşfi ayarları.                                                                                                                                                |
| `appServer`                | yönetilen stdio app-server | Aktarım, komut, kimlik doğrulama, onay, sanal alan ve zaman aşımı ayarları. Olağan çalıştırma ortamı varsayılan olarak aracı kapsamlı durumu kullanır.                                                    |
| `codexDynamicToolsLoading` | `"searchable"`             | OpenClaw dinamik araçlarını doğrudan ilk Codex araç bağlamına yerleştirmek için `"direct"` kullanın.                                                                                                    |
| `codexDynamicToolsExclude` | `[]`                       | Codex app-server dönüşlerinden hariç tutulacak ek OpenClaw dinamik araç adları.                                                                                                                        |
| `codexPlugins`             | devre dışı                 | Bağlı hesap uygulamalarına isteğe bağlı erişim dâhil, yerel Codex Plugin/uygulama desteği. Bkz. [Yerel Codex Plugin'leri](/tr/plugins/codex-native-plugins).                                                  |
| `computerUse`              | devre dışı                 | Codex Bilgisayar Kullanımı kurulumu. Bkz. [Codex Bilgisayar Kullanımı](/tr/plugins/codex-computer-use).                                                                                                    |
| `supervision`              | devre dışı                 | Arşivlenmemiş yerel oturum kataloğu, yerel dal devamı ve aracı araç politikası. Bkz. [Codex gözetimi](/plugins/codex-supervision).                                                                       |

## Gözetim

Gözetim, Gateway bilgisayarındaki ve katılımı etkinleştirilmiş eşleştirilmiş
Node'lardaki arşivlenmemiş Codex oturumlarını listeler. Bunu aracı çalıştırma
ortamından bağımsız olarak etkinleştirin:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          supervision: {
            enabled: true,
          },
        },
      },
    },
  },
}
```

`supervision` alanları:

| Alan                  | Varsayılan             | Anlamı                                                                                                                                                                                                                                                                            |
| --------------------- | ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`             | `false`                | Yerel oturum kataloğunu duyurur ve Gateway üzerinde, Codex Sessions sayfası için katılımı etkinleştirilmiş eşleştirilmiş Node kataloglarını birleştirir.                                                                                                                            |
| `endpoints`           | yerleşik yerel uç nokta | Korunan Codex gözetim aracısı ve bağımsız MCP araçları için uyumluluk ve gelişmiş uç nokta hedefleri. İnsan kataloğu ve dal akışı bu hedefleri yok sayar ve `appServer` üzerinden çözümlenen gözetim App Server'ını kullanır.                                                         |
| `allowRawTranscripts` | `false`                | Gözetim etkinken, otonom aracının veya bağımsız MCP'nin transkriptleri ve transkriptten türetilen liste alanlarını okumasına izin verir. Yalnızca meta veri içeren `codex_threads` okumaları kullanılabilir durumda kalır. Kimliği doğrulanmış Control UI devamını denetlemez.         |
| `allowWriteControls`  | `false`                | Gözetim etkinken, otonom `codex_threads` çatallama, yeniden adlandırma, arşivleme ve arşivden çıkarma değişiklikleriyle birlikte bağımsız MCP gönderme, yönlendirme ve kesme işlemlerine izin verir. Diğer bağlama, ana makine, durum veya onay denetimlerini atlamaz.                  |

Uç nokta girdileri şu alanları kabul eder:

| Alan           | Uygulandığı yer | Anlamı                                                                        |
| -------------- | --------------- | ----------------------------------------------------------------------------- |
| `id`           | tümü            | Kararlı uç nokta kimliği.                                                     |
| `label`        | tümü            | İsteğe bağlı görüntüleme etiketi.                                             |
| `transport`    | tümü            | `"stdio-proxy"` veya `"websocket"`.                                           |
| `command`      | `stdio-proxy`   | İsteğe bağlı App Server komutu.                                               |
| `args`         | `stdio-proxy`   | İsteğe bağlı komut bağımsız değişkenleri.                                     |
| `cwd`          | `stdio-proxy`   | İsteğe bağlı alt süreç çalışma dizini.                                        |
| `url`          | `websocket`     | Gerekli WebSocket veya desteklenen yerel yuva URL'si.                         |
| `authTokenEnv` | `websocket`     | Değeri uç noktanın kimliğini doğrulayan isteğe bağlı ortam değişkeni.          |

**Codex Sessions** sayfası Plugin'in gözetim App Server'ını kullanır ve yalnızca
arşivlenmemiş oturumları gösterir. Açık `appServer` bağlantı ayarları olmadan bu
bağlantı, yönetilen kullanıcı ana dizini stdio'sudur. Saklanan veya boşta olan
satırlar, son kalıcı kaynak dönüşüne kadarki sınırlı kullanıcı ve asistan
geçmişiyle modele kilitli bir Sohbet oluşturabilir. Özel bağlaması; anlık görüntü
çatallamasını, kurallı `appServer` kaynak dalını, geçmiş eklemeyi ve sonraki
dönüşleri bu bağlantıda tutar. İlk kurallı başlangıç, çatallamanın döndürdüğü
çifti kullanır. Sonraki sürdürmelerde OpenClaw model ve sağlayıcı geçersiz
kılmaları kullanılmaz; böylece Codex, kurallı iş parçacığının kalıcı çiftini geri
yükler. Ayrı bir yerel değişiklik bu çifti güncelleyebilir ancak dış model ve
yedek zinciri hiçbir zaman onun yerine geçmez. Saklanan ve boşta olan satırlar,
başka çalıştırıcı olmadığı onaylandıktan sonra arşivlenebilir; ancak başka bir
etkin OpenClaw bağlaması tam hedefin veya hedefin arşivlenmemiş oluşturulmuş
alt öğelerinden birinin sahibi olduğunda arşivlenemez. OpenClaw, Codex'in alt öğe
sayfalandırmasını izler ve numaralandırma hataları, döngüler veya güvenlik sınırı
tükenmesi durumunda kapalı kalır. Onay, bilinmeyen yerel istemcileri ve
durumdan arşivlemeye geçiş yarışını kapsamaya devam eder. Gözetimli, modele kilitli
bir Sohbet, yerel bağlamayı korurken silinemez. Etkin kaynaklar dal oluşturamaz
veya arşivlenemez ancak mevcut gözetimli bir Sohbet yine de açılabilir.
Eşleştirilmiş Node satırlarının tümü salt okunur kalır; Node aktarımı henüz
çalıştırma ortamının gerektirdiği akış yaşam döngüsünü sağlamaz.

Tek başına `appServer.homeScope: "user"`, yönetilen çalıştırma ortamı sürecinin
hangi Codex ana dizinini kullandığını değiştirir; filo kataloğunu yayımlamaz.
Gözetimi etkinleştirmek, çalıştırma ortamının varsayılanını değiştirmez. Bunun
yerine ayrı gözetim bağlantısı, açık `appServer` bağlantı ayarları olmadığında
varsayılan olarak yönetilen kullanıcı ana dizini stdio'sunu kullanır. Açık
ayarlar bu bağlantı için uygulanır. Bekleyen ve kaydedilmiş gözetimli bağlamalar,
her dönüş için bu bağlantıyı korur; devre dışı bırakılan gözetim veya bağlantı/
yaşam döngüsü sapması, aracı ana dizini çalıştırma ortamına geri dönmek yerine
kapalı kalır. Varsayılan bağlantı, yerel Codex istemcileriyle saklanan oturumları
paylaşır; süreçlerine özgü etkinlik durumunu paylaşmaz.

Eski `plugins.entries.codex-supervisor` ayarları kullanımdan kaldırılmıştır.
Eski girdiyi, uç nokta tanımlarını, politika bayraklarını ve Plugin izin/ret
başvurularını bu bloğa taşımak için `openclaw doctor --fix` komutunu çalıştırın.
Çakışmalarda açık kurallı `codex.config.supervision` değerleri önceliklidir.

## App-server aktarımı

Olağan çalıştırma ortamı dönüşleri için OpenClaw, resmi Plugin ile gönderilen
yönetilen Codex ikili dosyasını başlatır (şu anda `@openai/codex` `0.144.1`):

```bash
codex app-server --listen stdio://
```

Bu, app-server sürümünü yerel olarak yüklenmiş olabilecek ayrı bir Codex CLI
yerine resmi `codex` Plugin'ine bağlı tutar. Yalnızca bilinçli olarak farklı bir
yürütülebilir dosya kullanmak istediğinizde `appServer.command` değerini
ayarlayın. Varsayılan yalıtılmış aracı ana dizinine sahip olağan yönetilen
dönüşler, bir macOS masaüstü paketi yüklü olsa bile bu sabitlenmiş paketi tercih
eder. [Bilgisayar Kullanımı](/tr/plugins/codex-computer-use) etkinleştirildiğinde
veya `homeScope` değeri `"user"` olup yerel Bilgisayar Kullanımı durumunu
yükleyebildiğinde, yönetilen başlatma bunun yerine gerekli macOS izinlerine
sahip masaüstü uygulaması ikili dosyasını tercih eder. Aynı masaüstü öncelikli
kuralı, yalıtılmış bir aracı ana dizininin etkin Codex yapılandırması yerel
Bilgisayar Kullanımını etkinleştirdiğinde de geçerlidir. Herhangi bir masaüstü
uygulama paketi yüklü değilse OpenClaw, sabitlenmiş paket ikili dosyasına geri
döner.

Yürütülebilir dosya devri ve yerel yapılandırma sınırlaması, çalışan tek bir
Gateway sürecindeki istemcileri koordine eder. Başka bir süreç yerel Codex Plugin
yapılandırmasını değiştirdikten sonra Gateway'i yeniden başlatın.

Gözetim ayrı bir bağlantı çözümler. Açık `appServer` bağlantı ayarları yoksa,
`homeScope: "user"` ile yönetilen stdio kullanır; olağan çalıştırma ortamı ise
`homeScope: "agent"` ile yönetilen stdio olarak kalır. Açık bağlantı ayarları her
iki yol tarafından da uygulanır. Olağan çalıştırma ortamının `$CODEX_HOME`
(veya `~/.codex`) dizinini yerel istemcilerle paylaşması gerektiğinde
`homeScope: "user"` değerini açıkça ayarlayın. Özel bir gözetimli bağlama, olağan
çalıştırma ortamı varsayılanından bağımsız olarak gözetim bağlantısını kullanır.
Bağımsız App Server süreçleri ayrı canlı durum ve onay durumunu korur.

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
| `transport`                                   | `"stdio"`                                              | `"stdio"`, Codex'i başlatır; açıkça belirtilen `"unix"`, yerel denetim soketine bağlanır; `"websocket"`, `url` adresine bağlanır.                                                                                                                                                                                                                                                                |
| `homeScope`                                   | `"agent"`                                              | `"agent"`, sıradan çalıştırma düzeneği durumunu her OpenClaw ajanı için yalıtır. `"user"`, yerel `$CODEX_HOME` veya `~/.codex` dizinini paylaşan, yerel kimlik doğrulamayı kullanan ve yalnızca sahibin iş parçacığı yönetimini etkinleştiren açık bir katılım seçeneğidir. Kullanıcı kapsamı, yerel stdio veya Unix aktarımını destekler. Ayrı gözetim bağlantısı için ayarlanmamış bir değer, stdio ya da Unix için `"user"`, WebSocket için `"agent"` olarak çözümlenir. |
| `command`                                     | yönetilen Codex ikili dosyası                          | stdio aktarımı için yürütülebilir dosya. Yönetilen ikili dosyayı kullanmak için ayarlamayın.                                                                                                                                                                                                                                                                                                     |
| `args`                                        | `["app-server", "--listen", "stdio://"]`               | stdio aktarımı için bağımsız değişkenler.                                                                                                                                                                                                                                                                                                                                                       |
| `url`                                         | ayarlanmamış                                           | WebSocket App Server URL'si veya `unix://` URL'si. Açıkça belirtilmiş boş bir Unix yolu, standart kullanıcı ana dizini denetim soketini seçer.                                                                                                                                                                                                                                                   |
| `authToken`                                   | ayarlanmamış                                           | WebSocket aktarımı için Bearer belirteci. Düz metin bir dizeyi veya `${CODEX_APP_SERVER_TOKEN}` gibi bir SecretInput değerini kabul eder.                                                                                                                                                                                                                                                        |
| `headers`                                     | `{}`                                                   | Ek WebSocket üstbilgileri. Üstbilgi değerleri, örneğin `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"` biçiminde düz metin dizeleri veya SecretInput değerlerini kabul eder.                                                                                                                                                                                                     |
| `clearEnv`                                    | `[]`                                                   | OpenClaw devralınan ortamı oluşturduktan sonra, başlatılan stdio app-server işleminden kaldırılan ek ortam değişkeni adları.                                                                                                                                                                                                                                                                     |
| `remoteWorkspaceRoot`                         | ayarlanmamış                                           | Uzak Codex app-server çalışma alanı kökü. Ayarlandığında OpenClaw, yerel çalışma alanı kökünü çözümlenen OpenClaw çalışma alanından çıkarır, geçerli cwd son ekini bu uzak kök altında korur ve Codex'e yalnızca son app-server cwd değerini gönderir. cwd, çözümlenen OpenClaw çalışma alanı kökünün dışındaysa OpenClaw, uzaktaki app-server'a Gateway'e yerel bir yol göndermek yerine güvenli biçimde başarısız olur. |
| `requestTimeoutMs`                            | `60000`                                                | app-server denetim düzlemi çağrıları için zaman aşımı.                                                                                                                                                                                                                                                                                                                                          |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                                | OpenClaw `turn/completed` olayını beklerken, Codex'in bir turu kabul etmesinden veya tur kapsamlı bir app-server isteğinden sonraki sessiz bekleme aralığı.                                                                                                                                                                                                                                      |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                               | OpenClaw `turn/completed` olayını beklerken bir araç devrinden, yerel araç tamamlanmasından, araç sonrası ham asistan ilerlemesinden, ham akıl yürütme tamamlanmasından veya akıl yürütme ilerlemesinden sonra kullanılan tamamlanma-boşta kalma ve ilerleme koruması. Araç sonrası sentezin, son asistan yayın bütçesinden meşru olarak daha uzun süre sessiz kalabildiği güvenilir veya ağır iş yüklerinde bunu kullanın. |
| `mode`                                        | yerel Codex gereksinimleri YOLO'ya izin vermediği sürece `"yolo"` | YOLO veya koruyucu tarafından incelenen yürütme için ön ayar.                                                                                                                                                                                                                                                                                                                          |
| `approvalPolicy`                              | `"never"` veya izin verilen bir koruyucu onay politikası | İş parçacığı başlatılırken, sürdürülürken ve tur sırasında gönderilen yerel Codex onay politikası.                                                                                                                                                                                                                                                                                              |
| `sandbox`                                     | `"danger-full-access"` veya izin verilen bir koruyucu sandbox'ı | İş parçacığı başlatılırken ve sürdürülürken gönderilen yerel Codex sandbox modu. Etkin OpenClaw sandbox'ları, `danger-full-access` turlarını Codex `workspace-write` ile sınırlar; turun ağ bayrağı, OpenClaw sandbox çıkış ayarını izler.                                                                                                                                                         |
| `approvalsReviewer`                           | `"user"` veya izin verilen bir koruyucu inceleyici     | İzin verildiğinde Codex'in yerel onay istemlerini incelemesini sağlamak için `"auto_review"` kullanın.                                                                                                                                                                                                                                                                                           |
| `defaultWorkspaceDir`                         | geçerli işlem dizini                                   | `--cwd` belirtilmediğinde `/codex bind` tarafından kullanılan çalışma alanı.                                                                                                                                                                                                                                                                                                                     |
| `serviceTier`                                 | ayarlanmamış                                           | İsteğe bağlı Codex app-server hizmet katmanı. `"priority"` hızlı mod yönlendirmesini etkinleştirir, `"flex"` esnek işlemeyi ister ve `null` geçersiz kılmayı temizler. Eski `"fast"` değeri `"priority"` olarak kabul edilir.                                                                                                                                                                      |
| `networkProxy`                                | devre dışı                                             | app-server komutları için Codex izin profili ağ kullanımına açıkça katılmayı sağlar. OpenClaw, seçilen `permissions.<profile>.network` yapılandırmasını tanımlar ve `sandbox` göndermek yerine bunu `default_permissions` ile seçer.                                                                                                                                                                |
| `experimental.sandboxExecServer`              | `false`                                                | Yerel Codex yürütmesinin etkin OpenClaw sandbox'ı içinde çalışabilmesi için desteklenen Codex app-server'a OpenClaw sandbox destekli bir Codex ortamı kaydeden önizleme amaçlı açık katılım seçeneği.                                                                                                                                                                                            |

`appServer.networkProxy`, Codex sandbox sözleşmesini değiştirdiği için açıkça
belirtilir. Etkinleştirildiğinde OpenClaw, oluşturulan izin profilinin Codex
tarafından yönetilen ağ kullanımını başlatabilmesi için Codex iş parçacığı
yapılandırmasında `features.network_proxy.enabled` ve `default_permissions`
değerlerini de ayarlar. OpenClaw varsayılan olarak profil gövdesinden çakışmaya
dayanıklı bir `openclaw-network-<fingerprint>` profil adı oluşturur; `profileName`
seçeneğini yalnızca kararlı bir yerel ad gerektiğinde kullanın.

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
`networkProxy` etkinleştirildiğinde oluşturulan izin profili bunun yerine çalışma alanı tarzı
dosya sistemi erişimini kullanır. Codex tarafından yönetilen ağ uygulaması korumalı alanlı
ağ iletişimidir; bu nedenle tam erişim profili giden trafiği korumaz.

Plugin, eski veya sürümsüz app-server el sıkışmalarını engeller: Codex app-server,
kararlı `0.143.0` veya daha yeni bir sürüm bildirmelidir.

OpenClaw, local loopback olmayan WebSocket app-server URL'lerini uzak olarak değerlendirir ve
`appServer.authToken` ya da bir `Authorization` üst bilgisi aracılığıyla
kimlik taşıyan WebSocket kimlik doğrulaması gerektirir. `appServer.authToken` ve her
`appServer.headers.*` değeri bir SecretInput olabilir; sır çalışma zamanı, OpenClaw
app-server başlatma seçeneklerini oluşturmadan önce SecretRef'leri ve ortam değişkeni
kısa gösterimini çözümler; çözümlenmemiş yapılandırılmış SecretRef'ler ise herhangi bir
belirteç veya üst bilgi gönderilmeden önce başarısız olur. Yerel Codex pluginleri
yapılandırıldığında OpenClaw, bu pluginleri kurmak veya yenilemek için bağlı app-server'ın
plugin kontrol düzlemini kullanır ve ardından uygulama envanterini yenileyerek plugin
sahipli uygulamaların Codex iş parçacığı tarafından görülebilmesini sağlar. `app/list`
envanter ve meta veriler için yetkili kaynak olmaya devam eder; ancak Codex şu anda
uygulamayı devre dışı olarak işaretlese bile, listelenen erişilebilir bir uygulama için
`thread/start` çağrısının `config.apps[appId].enabled = true` gönderip göndermeyeceğine
OpenClaw ilkesi karar verir. Bilinmeyen veya eksik uygulama kimlikleri kapalı başarısızlık
davranışını korur; bu yol yalnızca `plugin/install` aracılığıyla pazar yeri pluginlerini
etkinleştirir ve envanteri yeniler. OpenClaw'ı yalnızca OpenClaw tarafından yönetilen
plugin kurulumlarını ve uygulama envanteri yenilemelerini kabul edeceğine güvenilen
uzak app-server'lara bağlayın.

## Onay ve korumalı alan modları

Yerel stdio app-server oturumları varsayılan olarak YOLO modunu kullanır:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` ve
`sandbox: "danger-full-access"`. Bu güvenilir yerel operatör yaklaşımı, gözetimsiz
OpenClaw işlemlerinin ve heartbeat'lerin, yanıtlayacak kimsenin bulunmadığı yerel onay
istemlerine takılmadan ilerlemesini sağlar.

Codex'in yerel sistem gereksinimleri dosyası örtük YOLO onayı, inceleyicisi veya
korumalı alan değerlerine izin vermiyorsa OpenClaw, örtük varsayılanı bunun yerine
koruyucu olarak değerlendirir ve izin verilen koruyucu izinlerini seçer.
`tools.exec.mode: "auto"` ayrıca koruyucu tarafından incelenen Codex onaylarını zorunlu
kılar ve güvenli olmayan eski `approvalPolicy: "never"` veya
`sandbox: "danger-full-access"` geçersiz kılmalarını korumaz; bilinçli olarak onaysız
bir yaklaşım için `tools.exec.mode: "full"` ayarlayın. Aynı gereksinimler dosyasındaki
ana bilgisayar adıyla eşleşen `[[remote_sandbox_config]]` girdileri, korumalı alan
varsayılanı kararında dikkate alınır.

Codex'in koruyucu tarafından incelenen onayları için `appServer.mode: "guardian"` ayarlayın:

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

Bu değerlere izin verildiğinde `guardian` ön ayarı
`approvalPolicy: "on-request"`, `approvalsReviewer: "auto_review"` ve
`sandbox: "workspace-write"` olarak genişletilir. Tekil ilke alanları `mode` değerini
geçersiz kılar. Eski `guardian_subagent` inceleyici değeri uyumluluk takma adı olarak
hâlâ kabul edilir; ancak yeni yapılandırmalar `auto_review` kullanmalıdır.

Bir OpenClaw korumalı alanı etkinken yerel Codex app-server işlemi yine de Gateway
ana bilgisayarında çalışır. Bu nedenle OpenClaw, Codex'in ana bilgisayar tarafındaki
korumalı alanını OpenClaw korumalı alan arka ucuyla eşdeğer saymak yerine, söz konusu
işlem için Codex'in yerel Kod Modu'nu, kullanıcı MCP sunucularını ve uygulama destekli
plugin yürütmesini devre dışı bırakır. Normal yürütme/işlem araçları kullanılabilir
olduğunda kabuk erişimi, `sandbox_exec` ve `sandbox_process` gibi OpenClaw korumalı alan
destekli dinamik araçlar aracılığıyla sunulur.

<Note>
Docker destekli OpenClaw korumalı alan ana bilgisayarlarında
(`agents.defaults.sandbox.mode` bir Docker arka ucuna ayarlandığında),
`openclaw doctor`; ana bilgisayarın, korumalı alan kapsayıcısı içindeki
`workspace-write` kabuk yürütmesi için iç içe Codex `bwrap` tarafından gereken
ayrıcalıksız kullanıcı ad alanlarına ve Docker korumalı alan ağ çıkışı devre dışıysa
ağ ad alanlarına izin verip vermediğini sınar. Başarısız bir sınama, Ubuntu/AppArmor
ana bilgisayarlarında genellikle `bwrap: setting up uid map: Permission denied` veya
`bwrap: loopback: Failed RTM_NEWADDR: Operation not permitted` olarak görünür.
OpenClaw hizmet kullanıcısı için bildirilen ana bilgisayar ad alanı ilkesini düzeltin
ve Gateway'i yeniden başlatın; ana bilgisayar genelindeki
`kernel.apparmor_restrict_unprivileged_userns=0` geri dönüşü yerine hizmet işlemi için
kapsamı daraltılmış bir AppArmor profili tercih edin ve yalnızca iç içe `bwrap`
gereksinimini karşılamak için Docker kapsayıcısına daha geniş ayrıcalıklar vermeyin.
</Note>

## Korumalı alanda yerel yürütme

Kararlı varsayılan kapalı başarısızlıktır: etkin OpenClaw korumalı alanı, aksi takdirde
Codex app-server ana bilgisayarından çalışacak yerel Codex yürütme yüzeylerini devre
dışı bırakır. Codex'in uzak ortam desteğini OpenClaw'ın korumalı alan arka ucuyla
denemek istiyorsanız yalnızca `appServer.experimental.sandboxExecServer: true`
kullanın. Bu ön izleme yolu, desteklenen tüm Codex app-server sürümleriyle çalışır.

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

Bayrak açıkken ve geçerli OpenClaw oturumu korumalı alandayken OpenClaw, etkin
korumalı alan tarafından desteklenen bir local loopback exec-server başlatır, bunu
Codex app-server'a kaydeder ve Codex iş parçacığı ile işlemini OpenClaw sahipli bu
ortamla başlatır. App-server ortamı kaydedemezse çalışma, sessizce ana bilgisayar
yürütmesine geri dönmek yerine kapalı biçimde başarısız olur.

Bu ön izleme yolu yalnızca yereldir. Uzak bir WebSocket app-server, aynı ana
bilgisayarda çalışmadığı sürece local loopback exec-server'a erişemez; bu nedenle
OpenClaw bu birleşimi reddeder.

## Kimlik doğrulama ve ortam yalıtımı

Varsayılan aracı başına ana dizinde kimlik doğrulama şu sırayla seçilir:

1. Aracı için açıkça belirtilmiş bir OpenClaw Codex kimlik doğrulama profili.
2. App-server'ın söz konusu aracının Codex ana dizinindeki mevcut hesabı.
3. Yalnızca yerel stdio app-server başlatmaları için, app-server hesabı bulunmadığında
   ve OpenAI kimlik doğrulaması hâlâ gerektiğinde önce `CODEX_API_KEY`, ardından
   `OPENAI_API_KEY`.

OpenClaw, ChatGPT aboneliği tarzında bir Codex kimlik doğrulama profili gördüğünde
(OAuth veya belirteç kimlik bilgisi türü), başlatılan Codex alt işleminden
`CODEX_API_KEY` ve `OPENAI_API_KEY` değişkenlerini kaldırır. Böylece Gateway düzeyindeki
API anahtarları yerleştirmeler veya doğrudan OpenAI modelleri için kullanılabilir
kalırken yerel Codex app-server işlemlerinin yanlışlıkla API üzerinden
ücretlendirilmesi önlenir.

Açık Codex API anahtarı profilleri ve yerel stdio ortam anahtarı geri dönüşü, devralınan
alt işlem ortamı yerine app-server oturum açma mekanizmasını kullanır. WebSocket
app-server bağlantıları Gateway ortamındaki API anahtarı geri dönüşünü almaz; açık bir
kimlik doğrulama profili veya uzak app-server'ın kendi hesabını kullanın.

Stdio app-server başlatmaları varsayılan olarak OpenClaw'ın işlem ortamını devralır.
OpenClaw, Codex app-server hesap köprüsünün sahibidir ve `CODEX_HOME` değişkenini söz
konusu aracının OpenClaw durumu altındaki aracıya özel bir dizine ayarlar. Böylece
Codex yapılandırması, hesapları, plugin önbelleği/verileri ve iş parçacığı durumu,
operatörün kişisel `~/.codex` ana dizininden sızmak yerine OpenClaw aracısı kapsamında
tutulur.

Yerel Codex durumunu Codex Desktop ve CLI ile paylaşmak için
`appServer.homeScope: "user"` ayarlayın. Bu yerel kullanıcı ana dizini modu, yönetilen
stdio ve açık Unix aktarımını destekler. Ayarlanmışsa `$CODEX_HOME`, aksi hâlde
`~/.codex` kullanılır; buna yerel kimlik doğrulama, yapılandırma, pluginler ve iş
parçacıkları dahildir. OpenClaw, app-server için kimlik doğrulama profili köprüsünü
atlar. Doğrulanmış sahip işlemleri, bu iş parçacıklarını listelemek (isteğe bağlı bir
`search` filtresiyle), okumak, çatallamak, yeniden adlandırmak, arşivlemek ve arşivden
çıkarmak için `codex_threads` kullanabilir. Bir iş parçacığını OpenClaw'da sürdürmeden
önce çatallayın; bağımsız Codex işlemleri aynı iş parçacığındaki eşzamanlı yazıcıları
koordine etmez.

Bu `homeScope` tercihi sıradan çalıştırma düzeneği oturumlarına uygulanır. Codex
Sessions aracılığıyla oluşturulan bir Chat bunun yerine özel gözetim bağlantısını
kullanır; bu bağlantı, kanonik dal ve gelecekteki sürdürmeler için yerel bağlantının
kimlik doğrulama ve sağlayıcı yapılandırmasını korur.

Modeli kilitli, gözetimli bir Chat içinde `codex_threads`, farklı bir çatalı bağlayamaz
veya Chat'e bağlı yerel iş parçacığını arşivleyemez. Listeleme ve yalnızca meta veri
okuma kullanılabilir durumda kalır. Ham döküm okumaları `allowRawTranscripts`
gerektirir; bu seçenek devre dışıyken yerel arama döküm ön izlemeleriyle
eşleşebileceğinden liste araması da reddedilir. Başka bir OpenClaw Chat'in sahibi
olmadığı ilişkisiz bir iş parçacığını yeniden adlandırmak, arşivden çıkarmak, bağımsız
olarak çatallamak ve arşivlemek `allowWriteControls` gerektirir. İki seçenek de kilitli
bağlamayı aşmaz.

OpenClaw, normal yerel app-server başlatmaları için `HOME` değerini yeniden yazmaz.
`openclaw`, `gh`, `git`, bulut CLI'ları ve kabuk komutları gibi Codex tarafından
çalıştırılan alt işlemler normal işlem ana dizinini görür ve kullanıcı ana dizinindeki
yapılandırma ile belirteçleri bulabilir. Codex ayrıca `$HOME/.agents/skills` ve
`$HOME/.agents/plugins/marketplace.json` öğelerini keşfedebilir; bu `.agents` keşfi
bilinçli olarak operatör ana diziniyle paylaşılır ve yalıtılmış `~/.codex` durumundan
ayrıdır.

Varsayılan aracı kapsamında OpenClaw pluginleri ve OpenClaw Skills anlık görüntüleri,
OpenClaw'ın kendi plugin kayıt defteri ve Skills yükleyicisi üzerinden akmaya devam
eder; kişisel Codex `~/.codex` varlıkları etmez. Yalıtılmış bir OpenClaw aracısının
parçası olması gereken bir Codex ana dizininden yararlı Codex CLI Skills veya
pluginleriniz varsa bunların envanterini açıkça çıkarın:

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

Bir dağıtım ek ortam yalıtımı gerektiriyorsa bu değişkenleri `appServer.clearEnv`
alanına ekleyin:

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

`appServer.clearEnv` yalnızca başlatılan Codex app-server alt işlemini etkiler.
OpenClaw, yerel başlatma normalleştirmesi sırasında `CODEX_HOME` ve `HOME` değerlerini
bu listeden kaldırır: `CODEX_HOME` seçilen aracı veya kullanıcı kapsamını göstermeye
devam eder; `HOME` ise alt işlemlerin normal kullanıcı ana dizini durumunu
kullanabilmesi için devralınmaya devam eder.

## Dinamik araçlar

Codex dinamik araçları varsayılan olarak `searchable` yüklemeyi kullanır ve
`openclaw` ad alanı altında `deferLoading: true` ile sunulur. OpenClaw, Codex'in yerel
çalışma alanı işlemlerini veya Codex'in kendi araç arama yüzeyini yineleyen dinamik
araçları sunmaz:

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

Mesajlaşma, medya, cron, tarayıcı, Node'lar, Gateway, `heartbeat_respond` ve
`web_search` gibi kalan OpenClaw entegrasyon araçlarının çoğu, bu ad alanı altındaki
Codex araç araması üzerinden kullanılabilir. Bu, başlangıçtaki model bağlamını daha
küçük tutar. Codex araç araması kullanılamayabileceği veya yalnızca bağlayıcılardan
oluşan bir evrene çözümlenebileceği için küçük bir araç kümesi
`codexDynamicToolsLoading` değerinden bağımsız olarak doğrudan çağrılabilir durumda
kalır: `agents_list`, `sessions_spawn` ve `sessions_yield`. Geliştirici talimatları,
normal Codex alt aracılarını Codex'e özgü alt aracı çalışmaları için yerel
`spawn_agent` kullanımına yönlendirmeye devam ederken `sessions_spawn`, açık OpenClaw
veya ACP yetkilendirmesi için kullanılabilir durumda kalır. Yalnızca mesaj aracı
kullanan kaynak yanıtları da doğrudan kalır; çünkü bu bir işlem denetimi sözleşmesidir.

OpenClaw `computer` aracı dâhil olmak üzere `catalogMode: "direct-only"` olarak
işaretlenen araçlar `openclaw_direct` altında gruplanır. OpenClaw, operatör tarafından
sağlanan girdileri değiştirmeden bu ad alanını Codex'in
`code_mode.direct_only_tool_namespaces` listesine ekler. Böylece Codex, bu araçları iç
içe Kod Modu `tools.*` çağrıları üzerinden yönlendirmek yerine normal ve yalnızca kod
modu iş parçacıklarında `DirectModelOnly` olarak sunar. Bu sınır, görüntü içeren
sonuçlar için gereklidir: iç içe Kod Modu serileştirmesi görüntü çıktısını metne
düzleştirir ve bu da bir sonraki bilgisayar eylemi için gereken ekran görüntüsünü
atar.

`codexDynamicToolsLoading: "direct"` seçeneğini yalnızca ertelenmiş dinamik araçlarda
arama yapamayan özel bir Codex app-server'a bağlanırken veya tam araç yükünde hata
ayıklarken ayarlayın.

## Zaman aşımları

OpenClaw'a ait dinamik araç çağrıları, `appServer.requestTimeoutMs` değerinden
bağımsız olarak sınırlandırılır. Her Codex `item/tool/call` isteği, aşağıdaki
sıraya göre kullanılabilir ilk zaman aşımını kullanır:

- Çağrı başına pozitif bir `timeoutMs` bağımsız değişkeni.
- `image_generate` için `agents.defaults.imageGenerationModel.timeoutMs`.
- Yapılandırılmış bir zaman aşımı olmadan `image_generate` için 120 saniyelik
  varsayılan görüntü oluşturma süresi.
- Medya anlama `image` aracı için milisaniyeye dönüştürülmüş
  `tools.media.image.timeoutSeconds` veya 60 saniyelik varsayılan medya süresi.
  Görüntü anlama için bu süre isteğin kendisine uygulanır ve önceki hazırlık
  çalışmaları nedeniyle azaltılmaz.
- `message` aracı için sabit 120 saniyelik varsayılan süre.
- 90 saniyelik varsayılan dinamik araç süresi.

Bu gözetleyici, dış dinamik `item/tool/call` bütçesidir. Sağlayıcıya özgü
istek zaman aşımları bu çağrının içinde çalışır ve kendi zaman aşımı
anlamlarını korur. Dinamik araç bütçeleri 600000 ms ile sınırlıdır. Zaman aşımı
durumunda OpenClaw, desteklendiği yerlerde araç sinyalini iptal eder ve oturumu
`processing` durumunda bırakmak yerine turun devam edebilmesi için Codex'e
başarısız bir dinamik araç yanıtı döndürür.

Codex bir turu kabul ettikten ve OpenClaw tur kapsamındaki bir uygulama
sunucusu isteğine yanıt verdikten sonra çalıştırma düzeneği, Codex'in mevcut
turda ilerleme kaydetmesini ve sonunda yerel turu `turn/completed` ile
tamamlamasını bekler. Uygulama sunucusu `appServer.turnCompletionIdleTimeoutMs`
süresince sessiz kalırsa OpenClaw, Codex turunu mümkün olan en iyi şekilde
kesintiye uğratır, tanılama amaçlı bir zaman aşımı kaydeder ve sonraki sohbet
mesajlarının güncelliğini yitirmiş bir yerel turun arkasında kuyruğa alınmaması
için OpenClaw oturum hattını serbest bırakır.

Aynı tura ilişkin terminal olmayan bildirimlerin çoğu, Codex turun hâlâ etkin
olduğunu kanıtladığı için bu kısa gözetleyiciyi devre dışı bırakır. Araç
aktarımları daha uzun bir araç sonrası boşta kalma bütçesi kullanır: OpenClaw
bir `item/tool/call` yanıtı döndürdükten, `commandExecution` gibi yerel araç
öğeleri tamamlandıktan, ham `custom_tool_call_output` tamamlanmalarından ve
araç sonrası ham asistan ilerlemesi, ham akıl yürütme tamamlanmaları veya akıl
yürütme ilerlemesinden sonra. Koruma, yapılandırıldığında
`appServer.postToolRawAssistantCompletionIdleTimeoutMs` değerini kullanır;
aksi takdirde varsayılan olarak beş dakikadır. Aynı araç sonrası bütçe, Codex
bir sonraki mevcut tur olayını yayınlamadan önceki sessiz sentez penceresinde
ilerleme gözetleyicisini de uzatır. Akıl yürütme tamamlanmalarını, açıklama
niteliğindeki `agentMessage` tamamlanmalarını ve araç öncesi ham akıl yürütme
veya asistan ilerlemesini otomatik bir nihai yanıt izleyebileceğinden, bunlar
oturum hattını hemen serbest bırakmak yerine ilerleme sonrası yanıt korumasını
kullanır. Yalnızca nihai/açıklama niteliğinde olmayan tamamlanmış
`agentMessage` öğeleri ve araç öncesi ham asistan tamamlanmaları, asistan
çıktısı serbest bırakma mekanizmasını etkinleştirir: Codex daha sonra
`turn/completed` olmadan sessiz kalırsa OpenClaw, yerel turu mümkün olan en iyi
şekilde kesintiye uğratır ve oturum hattını serbest bırakır. Asistan, araç,
etkin öğe veya yan etki kanıtı bulunmayan tur tamamlama boşta kalma zaman
aşımları dâhil olmak üzere yeniden oynatılması güvenli stdio uygulama sunucusu
hataları, yeni bir uygulama sunucusu denemesinde bir kez yeniden denenir.
Güvenli olmayan zaman aşımları yine de takılı kalan uygulama sunucusu
istemcisini kullanımdan kaldırır ve OpenClaw oturum hattını serbest bırakır.
Ayrıca otomatik olarak yeniden oynatmak yerine güncelliğini yitirmiş yerel
iş parçacığı bağlamasını temizler. Tamamlama izleme zaman aşımları, Codex'e
özgü zaman aşımı metni gösterir: yeniden oynatılması güvenli durumlarda yanıtın
eksik olabileceği belirtilirken güvenli olmayan durumlarda kullanıcıya yeniden
denemeden önce mevcut durumu doğrulaması söylenir. Genel zaman aşımı
tanılamaları; son uygulama sunucusu bildirim yöntemi, ham asistan yanıtı öğe
kimliği/türü/rolü, etkin istek/öğe sayıları ve etkinleştirilmiş izleme durumu
gibi yapısal alanları içerir. Son bildirim ham bir asistan yanıtı öğesiyse
sınırlı bir asistan metni önizlemesi de içerir. Ham istem veya araç içeriğini
içermez.

## Model keşfi

Codex Plugin'i varsayılan olarak uygulama sunucusundan kullanılabilir modelleri
ister. Model kullanılabilirliği Codex uygulama sunucusunun sorumluluğundadır;
bu nedenle OpenClaw, paketlenmiş `@openai/codex` sürümünü yükselttiğinde veya
bir dağıtım `appServer.command` değerini farklı bir Codex ikili dosyasına
yönlendirdiğinde liste değişebilir. Kullanılabilirlik hesap kapsamlı da
olabilir. Söz konusu çalıştırma düzeneği ve hesaba ait canlı kataloğu görmek
için çalışan bir Gateway üzerinde `/codex models` komutunu kullanın.

Keşif başarısız olursa veya zaman aşımına uğrarsa OpenClaw, paketlenmiş bir
yedek katalog kullanır:

| Model kimliği   | Görünen ad   | Akıl yürütme düzeyleri   |
| --------------- | ------------ | ------------------------ |
| `gpt-5.5`       | gpt-5.5      | low, medium, high, xhigh |
| `gpt-5.4-mini`  | GPT-5.4-Mini | low, medium, high, xhigh |

<Note>
Mevcut paketlenmiş çalıştırma düzeneği `@openai/codex` `0.144.1` sürümüdür.
Bu paketlenmiş uygulama sunucusuna yönelik bir `model/list` yoklaması, aşağıdaki
genel seçici satırlarını döndürmüştür:

| Model kimliği    | Girdi kipleri | Akıl yürütme düzeyleri               |
| ---------------- | ------------- | ------------------------------------ |
| `gpt-5.6-sol`    | metin, görüntü | low, medium, high, xhigh, max, ultra |
| `gpt-5.6-terra`  | metin, görüntü | low, medium, high, xhigh, max, ultra |
| `gpt-5.6-luna`   | metin, görüntü | low, medium, high, xhigh, max        |
| `gpt-5.5`        | metin, görüntü | low, medium, high, xhigh             |
| `gpt-5.4`        | metin, görüntü | low, medium, high, xhigh             |
| `gpt-5.4-mini`   | metin, görüntü | low, medium, high, xhigh             |
| `gpt-5.2`        | metin, görüntü | low, medium, high, xhigh             |

Uygulama sunucusu kataloğu `ultra` bildirebilir; OpenClaw akıl yürütme
denetimleri şu anda `max` düzeyine kadar seçenek sunar.

Canlı seçici satırları hesap kapsamlıdır ve hesaba, Codex kataloğuna veya
paketlenmiş sürüme göre değişebilir; belirli bir zamana ait tabloya güvenmek
yerine güncel liste için `/codex models` komutunu çalıştırın. Gizli modeller
de normal model seçici seçenekleri olmadan dâhilî veya uzmanlaşmış akışlar için
uygulama sunucusu kataloğunda görünebilir.
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

Başlangıçta Codex yoklamasını önlemek ve yalnızca yedek kataloğu kullanmak
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

## Çalışma alanı önyükleme dosyaları

Codex, yerel proje belgesi keşfi aracılığıyla `AGENTS.md` dosyasını kendisi
işler. Codex yedekleri yalnızca `AGENTS.md` eksik olduğunda geçerli olduğundan
OpenClaw, yapay Codex proje belgesi dosyaları yazmaz veya kişilik dosyaları
için Codex yedek dosya adlarına bağımlı olmaz.

OpenClaw çalışma alanı eşdeğerliği için Codex çalıştırma düzeneği, diğer
önyükleme dosyalarını geliştirici talimatları olarak iletir, ancak bunu aynı
şekilde yapmaz:

- `TOOLS.md`, **devralınan** Codex geliştirici talimatları olarak iletilir;
  böylece tur sırasında başlatılan yerel Codex alt ajanları da bunu görür.
- `SOUL.md`, `IDENTITY.md` ve `USER.md`, **tur kapsamlı** iş birliği
  talimatları olarak iletilir. Yerel Codex alt ajanları bunları devralmaz;
  böylece alt ajan turları üst ajanın kişiliğini ve kullanıcı profilini
  edinmez.
- Yüklenen kompakt OpenClaw Skills listesi de tur kapsamlı iş birliği
  geliştirici talimatları olarak iletilir; dolayısıyla yerel Codex alt ajanları
  bunu da devralmaz.
- `HEARTBEAT.md` içeriği eklenmez; heartbeat turları, dosya mevcut ve boş
  değilse dosyayı okumaya yönelik iş birliği kipi işaretçisi alır.
- Yapılandırılmış ajan çalışma alanındaki `MEMORY.md` içeriği, söz konusu
  çalışma alanı için bellek araçları kullanılabildiğinde yerel Codex tur
  girdisine yapıştırılmaz; dosya mevcutsa çalıştırma düzeneği, tur kapsamlı iş
  birliği geliştirici talimatlarına küçük bir çalışma alanı belleği işaretçisi
  ekler ve kalıcı bellek ilgili olduğunda Codex `memory_search` veya
  `memory_get` kullanmalıdır. Araçlar devre dışıysa, bellek araması
  kullanılamıyorsa veya etkin çalışma alanı ajan belleği çalışma alanından
  farklıysa `MEMORY.md`, bunun yerine normal sınırlı tur bağlamı yolunu
  kullanır.
- `BOOTSTRAP.md` mevcut olduğunda OpenClaw tur girdisi başvuru bağlamı olarak
  iletilir.

## Ortam geçersiz kılmaları

Yerel testler için ortam geçersiz kılmaları kullanılmaya devam eder:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`appServer.command` ayarlanmamışsa `OPENCLAW_CODEX_APP_SERVER_BIN`, yönetilen
ikili dosyayı atlar.

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` kaldırılmıştır. Bunun yerine
`plugins.entries.codex.config.appServer.mode: "guardian"` kullanın veya tek
seferlik yerel test için `OPENCLAW_CODEX_APP_SERVER_MODE=guardian` kullanın.
Tekrarlanabilir dağıtımlarda yapılandırma tercih edilir; çünkü Plugin
davranışını Codex çalıştırma düzeneği ayarlarının geri kalanıyla aynı
incelenmiş dosyada tutar.

## İlgili

- [Codex çalıştırma düzeneği](/tr/plugins/codex-harness)
- [Codex çalıştırma düzeneği çalışma zamanı](/tr/plugins/codex-harness-runtime)
- [Codex gözetimi](/plugins/codex-supervision)
- [Yerel Codex Plugin'leri](/tr/plugins/codex-native-plugins)
- [Codex Bilgisayar Kullanımı](/tr/plugins/codex-computer-use)
- [OpenAI sağlayıcısı](/tr/providers/openai)
- [Yapılandırma başvurusu](/tr/gateway/configuration-reference)
