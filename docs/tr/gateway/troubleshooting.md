---
read_when:
    - Sorun giderme merkezi sizi daha derin tanılama için buraya yönlendirdiğinde
    - Kesin komutlarla kararlı belirti tabanlı çalışma kitabı bölümlerine ihtiyaç duyduğunuzda
summary: Gateway, kanallar, otomasyon, düğümler ve tarayıcı için ayrıntılı sorun giderme çalışma kitabı
title: Sorun Giderme
x-i18n:
    generated_at: "2026-04-05T13:55:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 028226726e6adc45ca61d41510a953c4e21a3e85f3082af9e8085745c6ac3ec1
    source_path: gateway/troubleshooting.md
    workflow: 15
---

# Gateway sorun giderme

Bu sayfa ayrıntılı çalışma kitabıdır.
Önce hızlı triyaj akışını istiyorsanız [/help/troubleshooting](/help/troubleshooting) ile başlayın.

## Komut sıralaması

Önce bunları, şu sırayla çalıştırın:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Beklenen sağlıklı sinyaller:

- `openclaw gateway status`, `Runtime: running` ve `RPC probe: ok` gösterir.
- `openclaw doctor`, engelleyici config/hizmet sorunu bildirmez.
- `openclaw channels status --probe`, hesap başına canlı taşıma durumunu ve
  desteklenen yerlerde `works` veya `audit ok` gibi yoklama/denetim sonuçlarını gösterir.

## Anthropic 429 uzun bağlam için ek kullanım gerekli

Günlüklerde/hatalarda şunlar varsa bunu kullanın:
`HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

Şunları arayın:

- Seçilen Anthropic Opus/Sonnet modelinde `params.context1m: true` var.
- Mevcut Anthropic kimlik bilgisi uzun bağlam kullanımı için uygun değil.
- İstekler yalnızca 1M beta yolunu gerektiren uzun oturumlarda/model çalıştırmalarında başarısız oluyor.

Düzeltme seçenekleri:

1. Normal bağlam penceresine dönmek için o modelde `context1m` değerini devre dışı bırakın.
2. Faturalandırmalı bir Anthropic API anahtarı kullanın veya Anthropic OAuth/abonelik hesabında Anthropic Extra Usage özelliğini etkinleştirin.
3. Anthropic uzun bağlam istekleri reddedildiğinde çalıştırmaların devam etmesi için geri dönüş modelleri yapılandırın.

İlgili:

- [/providers/anthropic](/providers/anthropic)
- [/reference/token-use](/reference/token-use)
- [/help/faq#why-am-i-seeing-http-429-ratelimiterror-from-anthropic](/help/faq#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## Yanıt yok

Kanallar açıksa ancak hiçbir şey yanıt vermiyorsa herhangi bir şeyi yeniden bağlamadan önce yönlendirmeyi ve politikayı denetleyin.

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

Şunları arayın:

- DM göndericileri için bekleyen eşleştirme.
- Grup bahsetme kısıtlaması (`requireMention`, `mentionPatterns`).
- Kanal/grup izin listesi uyuşmazlıkları.

Yaygın imzalar:

- `drop guild message (mention required` → grup mesajı bahsedilene kadar yok sayılır.
- `pairing request` → göndericinin onaylanması gerekir.
- `blocked` / `allowlist` → gönderici/kanal politika tarafından filtrelendi.

İlgili:

- [/channels/troubleshooting](/tr/channels/troubleshooting)
- [/channels/pairing](/tr/channels/pairing)
- [/channels/groups](/tr/channels/groups)

## Dashboard control UI bağlantısı

Dashboard/control UI bağlanmıyorsa URL'yi, auth modunu ve güvenli bağlam varsayımlarını doğrulayın.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

Şunları arayın:

- Doğru yoklama URL'si ve dashboard URL'si.
- İstemci ile gateway arasında auth modu/token uyuşmazlığı.
- Cihaz kimliği gerektiğinde HTTP kullanımı.

Yaygın imzalar:

- `device identity required` → güvenli olmayan bağlam veya eksik cihaz auth'u.
- `origin not allowed` → tarayıcı `Origin` değeri `gateway.controlUi.allowedOrigins` içinde değil
  (veya açık bir
  izin listesi olmadan loopback olmayan bir tarayıcı origin'inden bağlanıyorsunuz).
- `device nonce required` / `device nonce mismatch` → istemci meydan okumaya dayalı cihaz auth akışını
  (`connect.challenge` + `device.nonce`) tamamlamıyor.
- `device signature invalid` / `device signature expired` → istemci geçerli el sıkışma için yanlış
  yükü (veya eski zaman damgasını) imzaladı.
- `AUTH_TOKEN_MISMATCH` ve `canRetryWithDeviceToken=true` → istemci önbelleğe alınmış cihaz token'ı ile bir güvenilir yeniden deneme yapabilir.
- Bu önbellekli token yeniden denemesi, eşlenmiş
  cihaz token'ı ile saklanan önbellekli kapsam kümesini yeniden kullanır. Açık `deviceToken` / açık `scopes` çağıranları kendi
  istenen kapsam kümesini korur.
- Bu yeniden deneme yolunun dışında, bağlanma auth önceliği önce açık paylaşılan
  token/parola, sonra açık `deviceToken`, sonra saklanan cihaz token'ı,
  sonra bootstrap token'dır.
- Zaman uyumsuz Tailscale Serve Control UI yolunda, aynı
  `{scope, ip}` için başarısız denemeler sınırlayıcı hatayı kaydetmeden önce serileştirilir. Bu nedenle aynı istemciden iki kötü eşzamanlı yeniden deneme, iki sade uyuşmazlık yerine ikinci denemede `retry later`
  gösterebilir.
- Tarayıcı origin'li bir loopback istemcisinden `too many failed authentication attempts (retry later)` →
  aynı normalize edilmiş `Origin` üzerinden tekrarlanan başarısızlıklar geçici olarak kilitlenir; başka bir localhost origin'i ayrı bir kova kullanır.
- Bu yeniden denemeden sonra tekrarlanan `unauthorized` → paylaşılan token/cihaz token'ı sapması; gerekirse token config'ini yenileyin ve cihaz token'ını yeniden onaylayın/döndürün.
- `gateway connect failed:` → yanlış ana makine/bağlantı noktası/url hedefi.

### Auth ayrıntı kodları hızlı eşleştirme

Sonraki eylemi seçmek için başarısız `connect` yanıtındaki `error.details.code` değerini kullanın:

| Ayrıntı kodu                | Anlamı                                                   | Önerilen eylem                                                                                                                                                                                                                                                                                 |
| --------------------------- | -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`        | İstemci gerekli paylaşılan token'ı göndermedi.           | İstemcide token'ı yapıştırın/ayarlayın ve yeniden deneyin. Dashboard yolları için: `openclaw config get gateway.auth.token`, sonra bunu Control UI ayarlarına yapıştırın.                                                                                                                   |
| `AUTH_TOKEN_MISMATCH`       | Paylaşılan token, gateway auth token'ı ile eşleşmedi.    | `canRetryWithDeviceToken=true` ise bir güvenilir yeniden denemeye izin verin. Önbellekli token yeniden denemeleri saklanan onaylı kapsamları yeniden kullanır; açık `deviceToken` / `scopes` çağıranları istenen kapsamları korur. Hâlâ başarısızsa [token sapması kurtarma denetim listesini](/cli/devices#token-drift-recovery-checklist) çalıştırın. |
| `AUTH_DEVICE_TOKEN_MISMATCH` | Cihaz başına önbellekli token eski veya iptal edilmiş.   | [devices CLI](/cli/devices) kullanarak cihaz token'ını döndürün/yeniden onaylayın, sonra yeniden bağlanın.                                                                                                                                                                                   |
| `PAIRING_REQUIRED`          | Cihaz kimliği biliniyor ama bu rol için onaylı değil.    | Bekleyen isteği onaylayın: `openclaw devices list`, sonra `openclaw devices approve <requestId>`.                                                                                                                                                                                            |

Cihaz auth v2 geçiş denetimi:

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

Günlüklerde nonce/imza hataları görünüyorsa bağlanan istemciyi güncelleyin ve şunları doğrulayın:

1. `connect.challenge` bekliyor
2. meydan okumaya bağlı yükü imzalıyor
3. aynı meydan okuma nonce değeriyle `connect.params.device.nonce` gönderiyor

`openclaw devices rotate` / `revoke` / `remove` beklenmedik şekilde reddedilirse:

- eşlenmiş cihaz token oturumları yalnızca **kendi** cihazlarını yönetebilir; ancak
  çağıran aynı zamanda `operator.admin` yetkisine sahipse farklıdır
- `openclaw devices rotate --scope ...`, yalnızca
  çağıran oturumun zaten sahip olduğu operatör kapsamlarını isteyebilir

İlgili:

- [/web/control-ui](/web/control-ui)
- [/gateway/configuration](/gateway/configuration) (gateway auth modları)
- [/gateway/trusted-proxy-auth](/gateway/trusted-proxy-auth)
- [/gateway/remote](/gateway/remote)
- [/cli/devices](/cli/devices)

## Gateway hizmeti çalışmıyor

Hizmet kurulu ama süreç ayakta kalmıyorsa bunu kullanın.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # sistem düzeyi hizmetleri de tarar
```

Şunları arayın:

- Çıkış ipuçlarıyla birlikte `Runtime: stopped`.
- Hizmet config uyuşmazlığı (`Config (cli)` ve `Config (service)`).
- Bağlantı noktası/dinleyici çakışmaları.
- `--deep` kullanıldığında ek launchd/systemd/schtasks kurulumları.
- `Other gateway-like services detected (best effort)` temizleme ipuçları.

Yaygın imzalar:

- `Gateway start blocked: set gateway.mode=local` veya `existing config is missing gateway.mode` → yerel gateway modu etkin değil ya da config dosyası bozulup `gateway.mode` değerini kaybetmiş. Düzeltme: config'inizde `gateway.mode="local"` ayarlayın veya beklenen yerel mod config'ini yeniden damgalamak için `openclaw onboard --mode local` / `openclaw setup` komutunu tekrar çalıştırın. OpenClaw'ı Podman üzerinden çalıştırıyorsanız varsayılan config yolu `~/.openclaw/openclaw.json` olur.
- `refusing to bind gateway ... without auth` → geçerli bir gateway auth yolu olmadan loopback dışı bağlama (token/parola veya yapılandırılmışsa trusted-proxy).
- `another gateway instance is already listening` / `EADDRINUSE` → bağlantı noktası çakışması.
- `Other gateway-like services detected (best effort)` → eski veya paralel launchd/systemd/schtasks birimleri var. Çoğu kurulum makine başına bir gateway tutmalıdır; birden fazlasına gerçekten ihtiyacınız varsa bağlantı noktalarını + config/durumu/çalışma alanını yalıtın. Bkz. [/gateway#multiple-gateways-same-host](/gateway#multiple-gateways-same-host).

İlgili:

- [/gateway/background-process](/gateway/background-process)
- [/gateway/configuration](/gateway/configuration)
- [/gateway/doctor](/gateway/doctor)

## Gateway yoklama uyarıları

`openclaw gateway probe` bir şeye ulaşıyor ama yine de uyarı bloğu yazdırıyorsa bunu kullanın.

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

Şunları arayın:

- JSON çıktısında `warnings[].code` ve `primaryTargetId`.
- Uyarının SSH geri dönüşü, birden fazla gateway, eksik kapsamlar veya çözümlenmemiş auth ref'leriyle ilgili olup olmadığı.

Yaygın imzalar:

- `SSH tunnel failed to start; falling back to direct probes.` → SSH kurulumu başarısız oldu, ancak komut yine de doğrudan yapılandırılmış/loopback hedefleri denedi.
- `multiple reachable gateways detected` → birden fazla hedef yanıt verdi. Bu genellikle kasıtlı çoklu gateway kurulumu veya eski/çift dinleyiciler anlamına gelir.
- `Probe diagnostics are limited by gateway scopes (missing operator.read)` → bağlantı çalıştı, ancak ayrıntı RPC'si kapsamlarla sınırlı; cihaz kimliğini eşleyin veya `operator.read` içeren kimlik bilgileri kullanın.
- çözümlenmemiş `gateway.auth.*` / `gateway.remote.*` SecretRef uyarı metni → başarısız hedef için bu komut yolunda auth materyali kullanılamadı.

İlgili:

- [/cli/gateway](/cli/gateway)
- [/gateway#multiple-gateways-same-host](/gateway#multiple-gateways-same-host)
- [/gateway/remote](/gateway/remote)

## Kanal bağlı ama mesajlar akmıyor

Kanal durumu bağlıysa ama mesaj akışı durmuşsa politika, izinler ve kanala özgü teslim kurallarına odaklanın.

```bash
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw status --deep
openclaw logs --follow
openclaw config get channels
```

Şunları arayın:

- DM politikası (`pairing`, `allowlist`, `open`, `disabled`).
- Grup izin listesi ve bahsetme gereksinimleri.
- Eksik kanal API izinleri/kapsamları.

Yaygın imzalar:

- `mention required` → mesaj grup bahsetme politikası nedeniyle yok sayıldı.
- `pairing` / bekleyen onay izleri → gönderici onaylanmamış.
- `missing_scope`, `not_in_channel`, `Forbidden`, `401/403` → kanal auth/izin sorunu.

İlgili:

- [/channels/troubleshooting](/tr/channels/troubleshooting)
- [/channels/whatsapp](/tr/channels/whatsapp)
- [/channels/telegram](/tr/channels/telegram)
- [/channels/discord](/tr/channels/discord)

## Cron ve heartbeat teslimatı

Cron veya heartbeat çalışmadıysa ya da teslim edilmediyse önce zamanlayıcı durumunu, sonra teslim hedefini doğrulayın.

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

Şunları arayın:

- Cron etkin ve sonraki uyanma mevcut.
- İş çalıştırma geçmişi durumu (`ok`, `skipped`, `error`).
- Heartbeat atlama nedenleri (`quiet-hours`, `requests-in-flight`, `alerts-disabled`, `empty-heartbeat-file`, `no-tasks-due`).

Yaygın imzalar:

- `cron: scheduler disabled; jobs will not run automatically` → cron devre dışı.
- `cron: timer tick failed` → zamanlayıcı tik'i başarısız; dosya/günlük/çalışma zamanı hatalarını denetleyin.
- `heartbeat skipped` ve `reason=quiet-hours` → etkin saatler penceresinin dışında.
- `heartbeat skipped` ve `reason=empty-heartbeat-file` → `HEARTBEAT.md` var ancak yalnızca boş satırlar / markdown başlıkları içeriyor, bu yüzden OpenClaw model çağrısını atlıyor.
- `heartbeat skipped` ve `reason=no-tasks-due` → `HEARTBEAT.md` bir `tasks:` bloğu içeriyor, ancak bu tik'te görevlerin hiçbiri zamanı gelmiş değil.
- `heartbeat: unknown accountId` → heartbeat teslim hedefi için geçersiz hesap kimliği.
- `heartbeat skipped` ve `reason=dm-blocked` → heartbeat hedefi DM tarzı bir hedefe çözümlendi ancak `agents.defaults.heartbeat.directPolicy` (veya agent başına geçersiz kılma) `block` olarak ayarlı.

İlgili:

- [/automation/cron-jobs#troubleshooting](/tr/automation/cron-jobs#troubleshooting)
- [/automation/cron-jobs](/tr/automation/cron-jobs)
- [/gateway/heartbeat](/gateway/heartbeat)

## Düğüm eşlenmiş ama araç başarısız oluyor

Bir düğüm eşlenmiş ancak araçlar başarısız oluyorsa ön plan, izin ve onay durumunu yalıtın.

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

Şunları arayın:

- Beklenen yeteneklerle çevrimiçi düğüm.
- Kamera/mikrofon/konum/ekran için işletim sistemi izinleri.
- `exec` onayları ve izin listesi durumu.

Yaygın imzalar:

- `NODE_BACKGROUND_UNAVAILABLE` → düğüm uygulaması ön planda olmalıdır.
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → eksik işletim sistemi izni.
- `SYSTEM_RUN_DENIED: approval required` → `exec` onayı bekliyor.
- `SYSTEM_RUN_DENIED: allowlist miss` → komut izin listesi tarafından engellendi.

İlgili:

- [/nodes/troubleshooting](/nodes/troubleshooting)
- [/nodes/index](/nodes/index)
- [/tools/exec-approvals](/tools/exec-approvals)

## Tarayıcı aracı başarısız oluyor

Gateway'in kendisi sağlıklı olsa bile tarayıcı aracı eylemleri başarısız oluyorsa bunu kullanın.

```bash
openclaw browser status
openclaw browser start --browser-profile openclaw
openclaw browser profiles
openclaw logs --follow
openclaw doctor
```

Şunları arayın:

- `plugins.allow` ayarlı mı ve `browser` içeriyor mu.
- Geçerli tarayıcı yürütülebilir dosya yolu.
- CDP profil erişilebilirliği.
- `existing-session` / `user` profilleri için yerel Chrome kullanılabilirliği.

Yaygın imzalar:

- `unknown command "browser"` veya `unknown command 'browser'` → paketlenmiş tarayıcı eklentisi `plugins.allow` tarafından hariç tutulmuş.
- `browser.enabled=true` iken tarayıcı aracı eksik / kullanılamıyor → `plugins.allow`, `browser` değerini hariç tutuyor, bu nedenle eklenti hiç yüklenmedi.
- `Failed to start Chrome CDP on port` → tarayıcı süreci başlatılamadı.
- `browser.executablePath not found` → yapılandırılmış yol geçersiz.
- `browser.cdpUrl must be http(s) or ws(s)` → yapılandırılmış CDP URL'si `file:` veya `ftp:` gibi desteklenmeyen bir şema kullanıyor.
- `browser.cdpUrl has invalid port` → yapılandırılmış CDP URL'sinde bozuk veya aralık dışı bağlantı noktası var.
- `No Chrome tabs found for profile="user"` → Chrome MCP ekleme profilinde açık yerel Chrome sekmesi yok.
- `Remote CDP for profile "<name>" is not reachable` → yapılandırılmış uzak CDP uç noktasına gateway ana makinesinden ulaşılamıyor.
- `Browser attachOnly is enabled ... not reachable` veya `Browser attachOnly is enabled and CDP websocket ... is not reachable` → yalnızca ekleme profili için erişilebilir hedef yok veya HTTP uç noktası yanıt verse bile CDP WebSocket yine de açılamadı.
- `Playwright is not available in this gateway build; '<feature>' is unsupported.` → mevcut gateway kurulumu tam Playwright paketini içermiyor; ARIA anlık görüntüleri ve temel sayfa ekran görüntüleri yine de çalışabilir, ancak gezinme, AI anlık görüntüleri, CSS seçici öğe ekran görüntüleri ve PDF dışa aktarma kullanılamaz kalır.
- `fullPage is not supported for element screenshots` → ekran görüntüsü isteği `--full-page` ile `--ref` veya `--element` değerlerini birlikte kullandı.
- `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → Chrome MCP / `existing-session` ekran görüntüsü çağrıları CSS `--element` değil, sayfa yakalama veya anlık görüntü `--ref` kullanmalıdır.
- `existing-session file uploads do not support element selectors; use ref/inputRef.` → Chrome MCP yükleme hook'ları CSS seçicileri değil, anlık görüntü ref'leri gerektirir.
- `existing-session file uploads currently support one file at a time.` → Chrome MCP profillerinde çağrı başına bir yükleme gönderin.
- `existing-session dialog handling does not support timeoutMs.` → Chrome MCP profillerindeki diyalog hook'ları zaman aşımı geçersiz kılmalarını desteklemez.
- `response body is not supported for existing-session profiles yet.` → `responsebody` hâlâ yönetilen tarayıcı veya ham CDP profili gerektirir.
- yalnızca ekleme veya uzak CDP profillerinde eski viewport / koyu mod / yerel ayar / çevrimdışı geçersiz kılmaları → tüm gateway'i yeniden başlatmadan etkin denetim oturumunu kapatmak ve Playwright/CDP öykünme durumunu serbest bırakmak için `openclaw browser stop --browser-profile <name>` çalıştırın.

İlgili:

- [/tools/browser-linux-troubleshooting](/tools/browser-linux-troubleshooting)
- [/tools/browser](/tools/browser)

## Yükselttiniz ve bir şey aniden bozulduysa

Yükseltme sonrası bozulmaların çoğu config sapması veya artık zorunlu kılınan daha katı varsayılanlardan kaynaklanır.

### 1) Auth ve URL geçersiz kılma davranışı değişti

```bash
openclaw gateway status
openclaw config get gateway.mode
openclaw config get gateway.remote.url
openclaw config get gateway.auth.mode
```

Neyi denetlemeli:

- `gateway.mode=remote` ise CLI çağrıları yerel hizmetiniz düzgün olsa bile uzak hedefi kullanıyor olabilir.
- Açık `--url` çağrıları saklanan kimlik bilgilerine geri dönmez.

Yaygın imzalar:

- `gateway connect failed:` → yanlış URL hedefi.
- `unauthorized` → uç noktaya ulaşılıyor ama auth yanlış.

### 2) Bağlama ve auth korumaları daha katı

```bash
openclaw config get gateway.bind
openclaw config get gateway.auth.mode
openclaw config get gateway.auth.token
openclaw gateway status
openclaw logs --follow
```

Neyi denetlemeli:

- Loopback dışı bağlamalar (`lan`, `tailnet`, `custom`) geçerli bir gateway auth yolu gerektirir: paylaşılan token/parola auth'u veya doğru yapılandırılmış loopback dışı `trusted-proxy` dağıtımı.
- `gateway.token` gibi eski anahtarlar `gateway.auth.token` yerine geçmez.

Yaygın imzalar:

- `refusing to bind gateway ... without auth` → geçerli gateway auth yolu olmadan loopback dışı bağlama.
- Çalışma zamanı çalışırken `RPC probe: failed` → gateway canlı ama mevcut auth/url ile erişilemiyor.

### 3) Eşleştirme ve cihaz kimliği durumu değişti

```bash
openclaw devices list
openclaw pairing list --channel <channel> [--account <id>]
openclaw logs --follow
openclaw doctor
```

Neyi denetlemeli:

- Dashboard/düğümler için bekleyen cihaz onayları.
- Politika veya kimlik değişikliklerinden sonra bekleyen DM eşleştirme onayları.

Yaygın imzalar:

- `device identity required` → cihaz auth'u karşılanmamış.
- `pairing required` → göndericinin/cihazın onaylanması gerekiyor.

Hizmet config'i ve çalışma zamanı denetimlerden sonra hâlâ uyuşmuyorsa hizmet meta verilerini aynı profil/durum dizininden yeniden kurun:

```bash
openclaw gateway install --force
openclaw gateway restart
```

İlgili:

- [/gateway/pairing](/gateway/pairing)
- [/gateway/authentication](/gateway/authentication)
- [/gateway/background-process](/gateway/background-process)
