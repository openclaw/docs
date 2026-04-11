---
read_when:
    - Sorun giderme merkezi sizi daha ayrıntılı teşhis için buraya yönlendirdi
    - Tam komutlarla kararlı, belirti temelli çalışma kılavuzu bölümlerine ihtiyacınız var
summary: Gateway, kanallar, otomasyon, düğümler ve tarayıcı için ayrıntılı sorun giderme çalışma kılavuzu
title: Sorun Giderme
x-i18n:
    generated_at: "2026-04-11T02:45:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7ef2faccba26ede307861504043a6415bc1f12dc64407771106f63ddc5b107f5
    source_path: gateway/troubleshooting.md
    workflow: 15
---

# Gateway sorun giderme

Bu sayfa ayrıntılı çalışma kılavuzudur.
Önce hızlı ön inceleme akışını istiyorsanız [/help/troubleshooting](/tr/help/troubleshooting) ile başlayın.

## Komut basamakları

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
- `openclaw doctor`, engelleyici yapılandırma/hizmet sorunu olmadığını bildirir.
- `openclaw channels status --probe`, canlı hesap başına taşıma durumu ile birlikte
  desteklenen yerlerde `works` veya `audit ok` gibi probe/denetim sonuçlarını gösterir.

## Uzun bağlam için ek kullanım gerektiren Anthropic 429

Günlüklerde/hatalarda şu ifade geçtiğinde bunu kullanın:
`HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

Bakılacaklar:

- Seçilen Anthropic Opus/Sonnet modelinde `params.context1m: true` var.
- Geçerli Anthropic kimlik bilgisi uzun bağlam kullanımı için uygun değil.
- İstekler yalnızca 1M beta yolunu gerektiren uzun oturumlarda/model çalıştırmalarında başarısız oluyor.

Düzeltme seçenekleri:

1. Normal bağlam penceresine geri dönmek için bu modelde `context1m` özelliğini devre dışı bırakın.
2. Uzun bağlam istekleri için uygun bir Anthropic kimlik bilgisi kullanın veya bir Anthropic API anahtarına geçin.
3. Anthropic uzun bağlam istekleri reddedildiğinde çalıştırmaların sürmesi için geri dönüş modelleri yapılandırın.

İlgili:

- [/providers/anthropic](/tr/providers/anthropic)
- [/reference/token-use](/tr/reference/token-use)
- [/help/faq#why-am-i-seeing-http-429-ratelimiterror-from-anthropic](/tr/help/faq#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## Yerel OpenAI uyumlu arka uç doğrudan probe'ları geçiyor ama aracı çalıştırmaları başarısız oluyor

Şu durumlarda bunu kullanın:

- `curl ... /v1/models` çalışıyor
- küçük doğrudan `/v1/chat/completions` çağrıları çalışıyor
- OpenClaw model çalıştırmaları yalnızca normal aracı dönüşlerinde başarısız oluyor

```bash
curl http://127.0.0.1:1234/v1/models
curl http://127.0.0.1:1234/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"<id>","messages":[{"role":"user","content":"hi"}],"stream":false}'
openclaw infer model run --model <provider/model> --prompt "hi" --json
openclaw logs --follow
```

Bakılacaklar:

- doğrudan küçük çağrılar başarılı, ancak OpenClaw çalıştırmaları yalnızca daha büyük istemlerde başarısız oluyor
- `messages[].content` için bir dize bekleyen arka uç hataları
- yalnızca daha büyük istem-token sayılarında veya tam aracı çalışma zamanı
  istemlerinde görünen arka uç çökmeleri

Yaygın imzalar:

- `messages[...].content: invalid type: sequence, expected a string` → arka uç,
  yapılandırılmış Chat Completions içerik parçalarını reddediyor. Düzeltme:
  `models.providers.<provider>.models[].compat.requiresStringContent: true` ayarlayın.
- doğrudan küçük istekler başarılı, ancak OpenClaw aracı çalıştırmaları arka uç/model
  çökmeleriyle başarısız oluyor (örneğin bazı `inferrs` derlemelerinde Gemma) → OpenClaw taşıma katmanı
  büyük olasılıkla zaten doğru; arka uç daha büyük aracı çalışma zamanı
  istem biçiminde başarısız oluyor.
- araçlar devre dışı bırakıldıktan sonra hatalar azalıyor ama kaybolmuyor → araç şemaları
  baskının bir parçasıydı, ancak kalan sorun hâlâ yukarı akış model/sunucu
  kapasitesi veya bir arka uç hatası.

Düzeltme seçenekleri:

1. Yalnızca dize destekleyen Chat Completions arka uçları için `compat.requiresStringContent: true` ayarlayın.
2. OpenClaw'ın araç şeması yüzeyini güvenilir biçimde işleyemeyen model/arka uçlar için
   `compat.supportsTools: false` ayarlayın.
3. Mümkün olduğunda istem baskısını azaltın: daha küçük çalışma alanı bootstrap'ı, daha kısa
   oturum geçmişi, daha hafif yerel model veya daha güçlü uzun bağlam desteğine sahip bir arka uç.
4. Doğrudan küçük istekler geçmeye devam ederken OpenClaw aracı dönüşleri hâlâ arka uç içinde çöküyorsa,
   bunu yukarı akış sunucu/model sınırlaması olarak değerlendirin ve kabul edilen payload biçimiyle
   birlikte oraya yeniden üretim raporu gönderin.

İlgili:

- [/gateway/local-models](/tr/gateway/local-models)
- [/gateway/configuration](/tr/gateway/configuration)
- [/gateway/configuration-reference#openai-compatible-endpoints](/tr/gateway/configuration-reference#openai-compatible-endpoints)

## Yanıt yok

Kanallar açıksa ancak hiçbir şey yanıt vermiyorsa, herhangi bir şeyi yeniden bağlamadan önce yönlendirme ve ilkeyi kontrol edin.

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

Bakılacaklar:

- DM göndericileri için eşleştirmenin beklemede olması.
- Grup bahsetme geçidi (`requireMention`, `mentionPatterns`).
- Kanal/grup izin listesi uyuşmazlıkları.

Yaygın imzalar:

- `drop guild message (mention required` → grup mesajı, bahsetme yapılana kadar yok sayılır.
- `pairing request` → göndericinin onaya ihtiyacı var.
- `blocked` / `allowlist` → gönderici/kanal ilke tarafından filtrelendi.

İlgili:

- [/channels/troubleshooting](/tr/channels/troubleshooting)
- [/channels/pairing](/tr/channels/pairing)
- [/channels/groups](/tr/channels/groups)

## Dashboard Control UI bağlantısı

Dashboard/Control UI bağlanmıyorsa URL, kimlik doğrulama modu ve güvenli bağlam varsayımlarını doğrulayın.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

Bakılacaklar:

- Doğru probe URL'si ve dashboard URL'si.
- İstemci ile gateway arasında kimlik doğrulama modu/token uyuşmazlığı.
- Cihaz kimliği gerektiğinde HTTP kullanımı.

Yaygın imzalar:

- `device identity required` → güvenli olmayan bağlam veya eksik cihaz kimlik doğrulaması.
- `origin not allowed` → tarayıcı `Origin` değeri `gateway.controlUi.allowedOrigins`
  içinde değil (veya açık bir izin listesi olmadan loopback dışı bir tarayıcı origin'inden bağlanıyorsunuz).
- `device nonce required` / `device nonce mismatch` → istemci, sınama tabanlı cihaz kimlik doğrulama
  akışını (`connect.challenge` + `device.nonce`) tamamlamıyor.
- `device signature invalid` / `device signature expired` → istemci mevcut el sıkışma için yanlış
  payload'ı (veya eski bir zaman damgasını) imzaladı.
- `AUTH_TOKEN_MISMATCH` ve `canRetryWithDeviceToken=true` → istemci önbelleğe alınmış cihaz tokenı ile bir güvenilir yeniden deneme yapabilir.
- Bu önbelleğe alınmış token yeniden denemesi, eşleştirilmiş
  cihaz tokenı ile birlikte saklanan önbelleğe alınmış kapsam kümesini yeniden kullanır. Açık `deviceToken` / açık `scopes`
  çağıranlar ise istenen kapsam kümesini korur.
- Bu yeniden deneme yolunun dışında, bağlanma kimlik doğrulaması önceliği sırasıyla açık paylaşılan
  token/parola, sonra açık `deviceToken`, sonra saklanan cihaz tokenı,
  sonra bootstrap tokenıdır.
- Eşzamansız Tailscale Serve Control UI yolunda, aynı
  `{scope, ip}` için başarısız denemeler, sınırlayıcı başarısızlığı kaydetmeden önce serileştirilir. Bu nedenle aynı istemciden gelen iki kötü eşzamanlı yeniden deneme,
  iki düz uyuşmazlık yerine ikinci denemede `retry later`
  gösterebilir.
- Tarayıcı origin'li bir loopback istemcisinden gelen `too many failed authentication attempts (retry later)` →
  aynı normalize edilmiş `Origin` için tekrarlanan başarısızlıklar geçici olarak kilitlenir; başka bir localhost origin'i ayrı bir kova kullanır.
- Bu yeniden denemeden sonra tekrarlanan `unauthorized` → paylaşılan token/cihaz tokenı sapması; gerekirse token yapılandırmasını yenileyin ve cihaz tokenını yeniden onaylayın/döndürün.
- `gateway connect failed:` → yanlış ana bilgisayar/port/url hedefi.

### Kimlik doğrulama ayrıntı kodları hızlı eşleştirme

Sonraki eylemi seçmek için başarısız `connect` yanıtındaki `error.details.code` değerini kullanın:

| Ayrıntı kodu                | Anlamı                                                   | Önerilen eylem                                                                                                                                                                                                                                                                              |
| --------------------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`        | İstemci gerekli paylaşılan tokenı göndermedi.            | Tokenı istemciye yapıştırın/ayarlayın ve yeniden deneyin. Dashboard yolları için: `openclaw config get gateway.auth.token`, ardından bunu Control UI ayarlarına yapıştırın.                                                                                                             |
| `AUTH_TOKEN_MISMATCH`       | Paylaşılan token, gateway auth tokenıyla eşleşmedi.      | `canRetryWithDeviceToken=true` ise bir güvenilir yeniden denemeye izin verin. Önbelleğe alınmış token yeniden denemeleri saklanan onaylı kapsamları yeniden kullanır; açık `deviceToken` / `scopes` çağıranlar istenen kapsamları korur. Hâlâ başarısız olursa [token drift recovery checklist](/cli/devices#token-drift-recovery-checklist) çalıştırın. |
| `AUTH_DEVICE_TOKEN_MISMATCH` | Cihaz başına önbelleğe alınmış token eski veya iptal edilmiş. | [devices CLI](/cli/devices) kullanarak cihaz tokenını döndürün/yeniden onaylayın, sonra yeniden bağlanın.                                                                                                                                                                                 |
| `PAIRING_REQUIRED`          | Cihaz kimliği biliniyor ancak bu rol için onaylanmamış.  | Bekleyen isteği onaylayın: `openclaw devices list`, ardından `openclaw devices approve <requestId>`.                                                                                                                                                                                      |

Device auth v2 geçiş kontrolü:

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

Günlüklerde nonce/imza hataları görünüyorsa, bağlanan istemciyi güncelleyin ve şunları doğrulayın:

1. `connect.challenge` bekler
2. challenge'a bağlı payload'ı imzalar
3. aynı challenge nonce ile `connect.params.device.nonce` gönderir

`openclaw devices rotate` / `revoke` / `remove` beklenmedik şekilde reddedilirse:

- eşleştirilmiş cihaz tokenı oturumları yalnızca **kendi**
  cihazlarını yönetebilir; çağıranın ayrıca `operator.admin` yetkisi varsa bu kısıt kalkar
- `openclaw devices rotate --scope ...` yalnızca çağıran oturumun zaten sahip olduğu
  operator kapsamlarını isteyebilir

İlgili:

- [/web/control-ui](/web/control-ui)
- [/gateway/configuration](/tr/gateway/configuration) (gateway auth modları)
- [/gateway/trusted-proxy-auth](/tr/gateway/trusted-proxy-auth)
- [/gateway/remote](/tr/gateway/remote)
- [/cli/devices](/cli/devices)

## Gateway hizmeti çalışmıyor

Hizmet kuruluysa ancak süreç ayakta kalmıyorsa bunu kullanın.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # sistem düzeyi hizmetleri de tara
```

Bakılacaklar:

- Çıkış ipuçlarıyla birlikte `Runtime: stopped`.
- Hizmet yapılandırması uyuşmazlığı (`Config (cli)` ve `Config (service)`).
- Port/dinleyici çakışmaları.
- `--deep` kullanıldığında ek launchd/systemd/schtasks kurulumları.
- `Other gateway-like services detected (best effort)` temizleme ipuçları.

Yaygın imzalar:

- `Gateway start blocked: set gateway.mode=local` veya `existing config is missing gateway.mode` → yerel gateway modu etkin değil ya da yapılandırma dosyası bozulmuş ve `gateway.mode` değerini kaybetmiş. Düzeltme: yapılandırmanızda `gateway.mode="local"` ayarlayın ya da beklenen yerel mod yapılandırmasını yeniden damgalamak için `openclaw onboard --mode local` / `openclaw setup` komutunu yeniden çalıştırın. OpenClaw'ı Podman üzerinden çalıştırıyorsanız varsayılan yapılandırma yolu `~/.openclaw/openclaw.json` olur.
- `refusing to bind gateway ... without auth` → geçerli bir gateway auth yolu olmadan loopback dışı bağlama (token/parola veya yapılandırıldığı yerde trusted-proxy).
- `another gateway instance is already listening` / `EADDRINUSE` → port çakışması.
- `Other gateway-like services detected (best effort)` → eski veya paralel launchd/systemd/schtasks birimleri mevcut. Çoğu kurulum makine başına tek bir gateway kullanmalıdır; birden fazlasına gerçekten ihtiyacınız varsa port + yapılandırma/durum/çalışma alanını yalıtın. Bkz. [/gateway#multiple-gateways-same-host](/tr/gateway#multiple-gateways-same-host).

İlgili:

- [/gateway/background-process](/tr/gateway/background-process)
- [/gateway/configuration](/tr/gateway/configuration)
- [/gateway/doctor](/tr/gateway/doctor)

## Gateway probe uyarıları

`openclaw gateway probe` bir şeye ulaşıyor ancak yine de bir uyarı bloğu yazdırıyorsa bunu kullanın.

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

Bakılacaklar:

- JSON çıktısındaki `warnings[].code` ve `primaryTargetId`.
- Uyarının SSH geri dönüşü, birden fazla gateway, eksik kapsamlar veya çözümlenmemiş auth referansları hakkında olup olmadığı.

Yaygın imzalar:

- `SSH tunnel failed to start; falling back to direct probes.` → SSH kurulumu başarısız oldu, ancak komut yine de doğrudan yapılandırılmış/loopback hedefleri denedi.
- `multiple reachable gateways detected` → birden fazla hedef yanıt verdi. Bu genellikle kasıtlı bir çoklu gateway kurulumu veya eski/çift dinleyiciler anlamına gelir.
- `Probe diagnostics are limited by gateway scopes (missing operator.read)` → bağlantı kuruldu, ancak ayrıntı RPC'si kapsamlarla sınırlı; cihaz kimliğini eşleştirin veya `operator.read` yetkisine sahip kimlik bilgileri kullanın.
- çözümlenmemiş `gateway.auth.*` / `gateway.remote.*` SecretRef uyarı metni → auth materyali bu komut yolunda başarısız hedef için kullanılamıyordu.

İlgili:

- [/cli/gateway](/cli/gateway)
- [/gateway#multiple-gateways-same-host](/tr/gateway#multiple-gateways-same-host)
- [/gateway/remote](/tr/gateway/remote)

## Kanal bağlı ama mesajlar akmıyor

Kanal durumu bağlıysa ancak mesaj akışı durmuşsa, ilke, izinler ve kanala özgü teslim kurallarına odaklanın.

```bash
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw status --deep
openclaw logs --follow
openclaw config get channels
```

Bakılacaklar:

- DM ilkesi (`pairing`, `allowlist`, `open`, `disabled`).
- Grup izin listesi ve bahsetme gereksinimleri.
- Eksik kanal API izinleri/kapsamları.

Yaygın imzalar:

- `mention required` → mesaj, grup bahsetme ilkesi nedeniyle yok sayıldı.
- `pairing` / bekleyen onay izleri → gönderici onaylanmamış.
- `missing_scope`, `not_in_channel`, `Forbidden`, `401/403` → kanal auth/izin sorunu.

İlgili:

- [/channels/troubleshooting](/tr/channels/troubleshooting)
- [/channels/whatsapp](/tr/channels/whatsapp)
- [/channels/telegram](/tr/channels/telegram)
- [/channels/discord](/tr/channels/discord)

## Cron ve heartbeat teslimi

Cron veya heartbeat çalışmadıysa ya da teslim edilmediyse, önce zamanlayıcı durumunu, ardından teslim hedefini doğrulayın.

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

Bakılacaklar:

- Cron etkin ve bir sonraki uyanma zamanı mevcut.
- İş çalıştırma geçmişi durumu (`ok`, `skipped`, `error`).
- Heartbeat atlama nedenleri (`quiet-hours`, `requests-in-flight`, `alerts-disabled`, `empty-heartbeat-file`, `no-tasks-due`).

Yaygın imzalar:

- `cron: scheduler disabled; jobs will not run automatically` → cron devre dışı.
- `cron: timer tick failed` → zamanlayıcı tik'i başarısız oldu; dosya/günlük/çalışma zamanı hatalarını kontrol edin.
- `heartbeat skipped` ve `reason=quiet-hours` → etkin saatler penceresinin dışında.
- `heartbeat skipped` ve `reason=empty-heartbeat-file` → `HEARTBEAT.md` var ancak yalnızca boş satırlar / markdown başlıkları içeriyor, bu yüzden OpenClaw model çağrısını atlıyor.
- `heartbeat skipped` ve `reason=no-tasks-due` → `HEARTBEAT.md` bir `tasks:` bloğu içeriyor, ancak bu tik'te görevlerin hiçbiri zamanı gelmemiş.
- `heartbeat: unknown accountId` → heartbeat teslim hedefi için geçersiz hesap kimliği.
- `heartbeat skipped` ve `reason=dm-blocked` → heartbeat hedefi DM tarzı bir hedefe çözümlendi, ancak `agents.defaults.heartbeat.directPolicy` (veya aracı başına geçersiz kılma) `block` olarak ayarlı.

İlgili:

- [/automation/cron-jobs#troubleshooting](/tr/automation/cron-jobs#troubleshooting)
- [/automation/cron-jobs](/tr/automation/cron-jobs)
- [/gateway/heartbeat](/tr/gateway/heartbeat)

## Eşleştirilmiş düğüm aracı başarısız oluyor

Bir düğüm eşleştirilmişse ancak araçlar başarısız oluyorsa, ön plan, izin ve onay durumunu yalıtın.

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

Bakılacaklar:

- Düğüm beklenen yeteneklerle çevrimiçi.
- Kamera/mikrofon/konum/ekran için işletim sistemi izinleri verilmiş.
- Exec onayları ve izin listesi durumu.

Yaygın imzalar:

- `NODE_BACKGROUND_UNAVAILABLE` → düğüm uygulaması ön planda olmalı.
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → eksik işletim sistemi izni.
- `SYSTEM_RUN_DENIED: approval required` → exec onayı beklemede.
- `SYSTEM_RUN_DENIED: allowlist miss` → komut izin listesi tarafından engellendi.

İlgili:

- [/nodes/troubleshooting](/tr/nodes/troubleshooting)
- [/nodes/index](/tr/nodes/index)
- [/tools/exec-approvals](/tr/tools/exec-approvals)

## Browser aracı başarısız oluyor

Gateway'in kendisi sağlıklı olsa bile browser aracı eylemleri başarısız olduğunda bunu kullanın.

```bash
openclaw browser status
openclaw browser start --browser-profile openclaw
openclaw browser profiles
openclaw logs --follow
openclaw doctor
```

Bakılacaklar:

- `plugins.allow` ayarlı mı ve `browser` içeriyor mu.
- Geçerli browser yürütülebilir dosya yolu.
- CDP profiline erişilebilirlik.
- `existing-session` / `user` profilleri için yerel Chrome kullanılabilirliği.

Yaygın imzalar:

- `unknown command "browser"` veya `unknown command 'browser'` → paketli browser eklentisi `plugins.allow` tarafından hariç tutuluyor.
- `browser.enabled=true` iken browser aracı eksik / kullanılamıyor → `plugins.allow`, `browser` öğesini hariç tutuyor, bu yüzden eklenti hiç yüklenmedi.
- `Failed to start Chrome CDP on port` → browser süreci başlatılamadı.
- `browser.executablePath not found` → yapılandırılmış yol geçersiz.
- `browser.cdpUrl must be http(s) or ws(s)` → yapılandırılmış CDP URL'si `file:` veya `ftp:` gibi desteklenmeyen bir şema kullanıyor.
- `browser.cdpUrl has invalid port` → yapılandırılmış CDP URL'sinde kötü veya aralık dışı bir port var.
- `No Chrome tabs found for profile="user"` → Chrome MCP attach profilinde açık yerel Chrome sekmesi yok.
- `Remote CDP for profile "<name>" is not reachable` → yapılandırılmış uzak CDP uç noktasına gateway ana bilgisayarından ulaşılamıyor.
- `Browser attachOnly is enabled ... not reachable` veya `Browser attachOnly is enabled and CDP websocket ... is not reachable` → yalnızca iliştirme profili için erişilebilir bir hedef yok ya da HTTP uç noktası yanıt verdi ancak CDP WebSocket yine de açılamadı.
- `Playwright is not available in this gateway build; '<feature>' is unsupported.` → geçerli gateway kurulumu tam Playwright paketini içermiyor; ARIA anlık görüntüleri ve temel sayfa ekran görüntüleri yine de çalışabilir, ancak gezinme, AI anlık görüntüleri, CSS seçici öğe ekran görüntüleri ve PDF dışa aktarma kullanılamaz durumda kalır.
- `fullPage is not supported for element screenshots` → ekran görüntüsü isteği `--full-page` ile `--ref` veya `--element` öğelerini birlikte kullandı.
- `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → Chrome MCP / `existing-session` ekran görüntüsü çağrıları CSS `--element` değil, sayfa yakalama veya bir anlık görüntü `--ref` kullanmalıdır.
- `existing-session file uploads do not support element selectors; use ref/inputRef.` → Chrome MCP dosya yükleme kancaları CSS seçicileri değil, anlık görüntü referansları gerektirir.
- `existing-session file uploads currently support one file at a time.` → Chrome MCP profillerinde çağrı başına bir yükleme gönderin.
- `existing-session dialog handling does not support timeoutMs.` → Chrome MCP profillerindeki iletişim kutusu kancaları zaman aşımı geçersiz kılmalarını desteklemez.
- `response body is not supported for existing-session profiles yet.` → `responsebody` hâlâ yönetilen bir browser veya ham CDP profili gerektirir.
- yalnızca iliştirme veya uzak CDP profillerinde eski viewport / koyu mod / yerel ayar / çevrimdışı geçersiz kılmaları → tüm gateway'i yeniden başlatmadan etkin kontrol oturumunu kapatmak ve Playwright/CDP öykünme durumunu serbest bırakmak için `openclaw browser stop --browser-profile <name>` çalıştırın.

İlgili:

- [/tools/browser-linux-troubleshooting](/tr/tools/browser-linux-troubleshooting)
- [/tools/browser](/tr/tools/browser)

## Yükseltmeden sonra aniden bir şey bozulduysa

Yükseltme sonrası bozulmaların çoğu yapılandırma sapması veya artık uygulanan daha katı varsayılanlardan kaynaklanır.

### 1) Auth ve URL geçersiz kılma davranışı değişti

```bash
openclaw gateway status
openclaw config get gateway.mode
openclaw config get gateway.remote.url
openclaw config get gateway.auth.mode
```

Kontrol edilecekler:

- `gateway.mode=remote` ise CLI çağrıları uzak hedefe gidiyor olabilir; yerel hizmetiniz iyi durumda olsa bile.
- Açık `--url` çağrıları saklanan kimlik bilgilerine geri dönmez.

Yaygın imzalar:

- `gateway connect failed:` → yanlış URL hedefi.
- `unauthorized` → uç noktaya ulaşılıyor ancak auth yanlış.

### 2) Bind ve auth korumaları daha katı

```bash
openclaw config get gateway.bind
openclaw config get gateway.auth.mode
openclaw config get gateway.auth.token
openclaw gateway status
openclaw logs --follow
```

Kontrol edilecekler:

- Loopback dışı bağlamalar (`lan`, `tailnet`, `custom`) geçerli bir gateway auth yolu gerektirir: paylaşılan token/parola auth veya doğru yapılandırılmış loopback dışı `trusted-proxy` dağıtımı.
- `gateway.token` gibi eski anahtarlar `gateway.auth.token` yerine geçmez.

Yaygın imzalar:

- `refusing to bind gateway ... without auth` → geçerli bir gateway auth yolu olmadan loopback dışı bağlama.
- Çalışma zamanı çalışıyor olsa da `RPC probe: failed` → gateway canlı ancak mevcut auth/url ile erişilemiyor.

### 3) Eşleştirme ve cihaz kimliği durumu değişti

```bash
openclaw devices list
openclaw pairing list --channel <channel> [--account <id>]
openclaw logs --follow
openclaw doctor
```

Kontrol edilecekler:

- Dashboard/düğümler için bekleyen cihaz onayları.
- İlke veya kimlik değişikliklerinden sonra bekleyen DM eşleştirme onayları.

Yaygın imzalar:

- `device identity required` → cihaz auth karşılanmadı.
- `pairing required` → gönderici/cihaz onaylanmalı.

Kontrollerden sonra hizmet yapılandırması ve çalışma zamanı hâlâ uyuşmuyorsa, aynı profil/durum dizininden hizmet meta verilerini yeniden kurun:

```bash
openclaw gateway install --force
openclaw gateway restart
```

İlgili:

- [/gateway/pairing](/tr/gateway/pairing)
- [/gateway/authentication](/tr/gateway/authentication)
- [/gateway/background-process](/tr/gateway/background-process)
