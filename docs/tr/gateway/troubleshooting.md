---
read_when:
    - Sorun giderme merkezi sizi daha derin teşhis için buraya yönlendirdi
    - Tam komutlarla kararlı, belirti temelli çalışma kitabı bölümlerine ihtiyacınız var
summary: Gateway, kanallar, otomasyon, Node'lar ve tarayıcı için derin sorun giderme çalışma kitabı
title: Sorun giderme
x-i18n:
    generated_at: "2026-04-24T09:12:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 20066bdab03f05304b3a620fbadc38e4dc74b740da151c58673dcf5196e5f1e1
    source_path: gateway/troubleshooting.md
    workflow: 15
---

# Gateway sorun giderme

Bu sayfa derin çalışma kitabıdır.
Önce hızlı triyaj akışını istiyorsanız [/help/troubleshooting](/tr/help/troubleshooting) sayfasından başlayın.

## Komut sıralaması

Önce bunları, bu sırayla çalıştırın:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Beklenen sağlıklı sinyaller:

- `openclaw gateway status`, `Runtime: running`, `Connectivity probe: ok` ve bir `Capability: ...` satırı gösterir.
- `openclaw doctor`, engelleyici yapılandırma/hizmet sorunu olmadığını bildirir.
- `openclaw channels status --probe`, canlı hesap başına taşıma durumunu ve
  desteklenen yerlerde `works` veya `audit ok` gibi yoklama/denetim sonuçlarını gösterir.

## Uzun bağlam için ekstra kullanım gerektiren Anthropic 429

Günlüklerde/hatalarda şunu gördüğünüzde bunu kullanın:
`HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

Şunlara bakın:

- Seçilen Anthropic Opus/Sonnet modelinde `params.context1m: true` var.
- Geçerli Anthropic kimlik bilgisi uzun bağlam kullanımı için uygun değil.
- İstekler yalnızca 1M beta yoluna ihtiyaç duyan uzun oturumlarda/model çalıştırmalarında başarısız oluyor.

Düzeltme seçenekleri:

1. Normal bağlam penceresine geri dönmek için o modelde `context1m` değerini kapatın.
2. Uzun bağlam istekleri için uygun bir Anthropic kimlik bilgisi kullanın veya bir Anthropic API anahtarına geçin.
3. Anthropic uzun bağlam istekleri reddedildiğinde çalıştırmaların sürmesi için geri dönüş modelleri yapılandırın.

İlgili:

- [/providers/anthropic](/tr/providers/anthropic)
- [/reference/token-use](/tr/reference/token-use)
- [/help/faq-first-run#why-am-i-seeing-http-429-ratelimiterror-from-anthropic](/tr/help/faq-first-run#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## Yerel OpenAI uyumlu arka uç doğrudan yoklamaları geçiyor ama aracı çalıştırmaları başarısız oluyor

Şu durumlarda bunu kullanın:

- `curl ... /v1/models` çalışıyor
- küçük doğrudan `/v1/chat/completions` çağrıları çalışıyor
- OpenClaw model çalıştırmaları yalnızca normal aracı turlarında başarısız oluyor

```bash
curl http://127.0.0.1:1234/v1/models
curl http://127.0.0.1:1234/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"<id>","messages":[{"role":"user","content":"hi"}],"stream":false}'
openclaw infer model run --model <provider/model> --prompt "hi" --json
openclaw logs --follow
```

Şunlara bakın:

- doğrudan küçük çağrılar başarılı, ancak OpenClaw çalıştırmaları yalnızca daha büyük istemlerde başarısız oluyor
- arka uç hataları `messages[].content` için dize bekliyor
- yalnızca daha büyük istem belirteç sayılarında veya tam aracı
  çalışma zamanı istemlerinde görülen arka uç çöküşleri

Yaygın imzalar:

- `messages[...].content: invalid type: sequence, expected a string` → arka uç
  yapılandırılmış Chat Completions içerik parçalarını reddediyor. Düzeltme: şunu ayarlayın:
  `models.providers.<provider>.models[].compat.requiresStringContent: true`.
- doğrudan küçük istekler başarılı, ancak OpenClaw aracı çalıştırmaları arka uç/model
  çökmeleriyle başarısız oluyor (örneğin bazı `inferrs` derlemelerinde Gemma) → OpenClaw taşıması
  büyük olasılıkla zaten doğru; arka uç daha büyük aracı çalışma zamanı
  istem şekli üzerinde başarısız oluyor.
- araçlar devre dışı bırakıldıktan sonra hatalar azalıyor ama kaybolmuyor → araç şemaları
  baskının bir parçasıydı, ancak kalan sorun hâlâ yukarı akış model/sunucu
  kapasitesi veya bir arka uç hatası.

Düzeltme seçenekleri:

1. Yalnızca dize kullanan Chat Completions arka uçları için `compat.requiresStringContent: true` ayarlayın.
2. OpenClaw'ın araç şeması yüzeyini güvenilir şekilde işleyemeyen model/arka uçlar için `compat.supportsTools: false` ayarlayın.
3. Mümkün olduğunda istem baskısını azaltın: daha küçük çalışma alanı önyüklemesi, daha kısa
   oturum geçmişi, daha hafif yerel model veya daha güçlü uzun bağlam
   desteğine sahip bir arka uç.
4. Küçük doğrudan istekler geçmeye devam ederken OpenClaw aracı turları hâlâ
   arka uç içinde çöküyorsa, bunu yukarı akış sunucu/model sınırlaması olarak değerlendirin ve
   kabul edilen payload şekliyle birlikte orada bir tekrar üretim kaydı açın.

İlgili:

- [/gateway/local-models](/tr/gateway/local-models)
- [/gateway/configuration](/tr/gateway/configuration)
- [/gateway/configuration-reference#openai-compatible-endpoints](/tr/gateway/configuration-reference#openai-compatible-endpoints)

## Yanıt yok

Kanallar açıksa ama hiçbir şey yanıt vermiyorsa, herhangi bir şeyi yeniden bağlamadan önce yönlendirmeyi ve ilkeyi kontrol edin.

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

Şunlara bakın:

- DM göndericileri için eşleştirmenin beklemede olması.
- Grup bahsetme geçitlemesi (`requireMention`, `mentionPatterns`).
- Kanal/grup izin listesi uyuşmazlıkları.

Yaygın imzalar:

- `drop guild message (mention required` → grup mesajı, bahsetmeye kadar yok sayılır.
- `pairing request` → göndericinin onaya ihtiyacı var.
- `blocked` / `allowlist` → gönderici/kanal ilke tarafından filtrelendi.

İlgili:

- [/channels/troubleshooting](/tr/channels/troubleshooting)
- [/channels/pairing](/tr/channels/pairing)
- [/channels/groups](/tr/channels/groups)

## Dashboard control UI bağlantısı

Dashboard/Control UI bağlanmıyorsa, URL'yi, kimlik doğrulama modunu ve güvenli bağlam varsayımlarını doğrulayın.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

Şunlara bakın:

- Doğru yoklama URL'si ve dashboard URL'si.
- İstemci ile gateway arasında auth modu/belirteç uyuşmazlığı.
- Cihaz kimliği gereken yerde HTTP kullanımı.

Yaygın imzalar:

- `device identity required` → güvenli olmayan bağlam veya eksik cihaz kimlik doğrulaması.
- `origin not allowed` → tarayıcı `Origin` değeri `gateway.controlUi.allowedOrigins`
  içinde değil (veya açık izin listesi olmayan loopback dışı bir tarayıcı origin'inden bağlanıyorsunuz).
- `device nonce required` / `device nonce mismatch` → istemci zorluk tabanlı
  cihaz kimlik doğrulama akışını tamamlamıyor (`connect.challenge` + `device.nonce`).
- `device signature invalid` / `device signature expired` → istemci geçerli el sıkışma için yanlış
  payload'ı (veya eski bir zaman damgasını) imzaladı.
- `AUTH_TOKEN_MISMATCH` ve `canRetryWithDeviceToken=true` → istemci önbelleğe alınmış cihaz belirteciyle tek bir güvenilir yeniden deneme yapabilir.
- Bu önbelleğe alınmış belirteç yeniden denemesi, eşleştirilmiş
  cihaz belirteciyle saklanan önbelleğe alınmış kapsam kümesini yeniden kullanır. Açık `deviceToken` / açık `scopes` çağıranları istenen kapsam kümesini korur.
- Bu yeniden deneme yolu dışında, bağlantı auth önceliği önce açık paylaşılan
  belirteç/parola, ardından açık `deviceToken`, ardından saklanan cihaz belirteci,
  sonra bootstrap belirtecidir.
- Eşzamansız Tailscale Serve Control UI yolunda, aynı `{scope, ip}` için başarısız denemeler sınırlayıcı başarısızlığı kaydetmeden önce serileştirilir. Bu nedenle aynı istemciden gelen iki kötü eşzamanlı yeniden deneme, ikinci denemede iki düz uyuşmazlık yerine `retry later` gösterebilir.
- Tarayıcı origin'li bir loopback istemcisinden gelen `too many failed authentication attempts (retry later)` → aynı normalize edilmiş `Origin` içinden gelen tekrarlı başarısızlıklar geçici olarak kilitlenir; başka bir localhost origin'i ayrı bir kovayı kullanır.
- Bundan sonraki tekrarlanan `unauthorized` → paylaşılan belirteç/cihaz belirteci sapması; gerekirse belirteç yapılandırmasını yenileyin ve cihaz belirtecini yeniden onaylayın/döndürün.
- `gateway connect failed:` → yanlış ana makine/port/url hedefi.

### Auth ayrıntı kodları hızlı eşleme

Sonraki eylemi seçmek için başarısız `connect` yanıtındaki `error.details.code` değerini kullanın:

| Ayrıntı kodu                 | Anlamı                                                                                                                                                                                        | Önerilen işlem                                                                                                                                                                                                                                                                             |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `AUTH_TOKEN_MISSING`         | İstemci gerekli paylaşılan belirteci göndermedi.                                                                                                                                              | İstemciye belirteci yapıştırın/ayarlayın ve yeniden deneyin. Dashboard yolları için: `openclaw config get gateway.auth.token`, ardından bunu Control UI ayarlarına yapıştırın.                                                                                                           |
| `AUTH_TOKEN_MISMATCH`        | Paylaşılan belirteç gateway auth belirteciyle eşleşmedi.                                                                                                                                      | `canRetryWithDeviceToken=true` ise tek bir güvenilir yeniden denemeye izin verin. Önbelleğe alınmış belirteç yeniden denemeleri saklanan onaylı kapsamları yeniden kullanır; açık `deviceToken` / `scopes` çağıranları istenen kapsamları korur. Hâlâ başarısızsa [belirteç sapması kurtarma kontrol listesi](/tr/cli/devices#token-drift-recovery-checklist) bölümünü çalıştırın. |
| `AUTH_DEVICE_TOKEN_MISMATCH` | Cihaz başına önbelleğe alınmış belirteç eski veya iptal edilmiş.                                                                                                                              | [devices CLI](/tr/cli/devices) kullanarak cihaz belirtecini döndürün/yeniden onaylayın, sonra yeniden bağlanın.                                                                                                                                                                              |
| `PAIRING_REQUIRED`           | Cihaz kimliğinin onaya ihtiyacı var. `not-paired`, `scope-upgrade`, `role-upgrade` veya `metadata-upgrade` için `error.details.reason` değerini kontrol edin ve varsa `requestId` / `remediationHint` kullanın. | Bekleyen isteği onaylayın: `openclaw devices list`, ardından `openclaw devices approve <requestId>`. Kapsam/rol yükseltmeleri, istenen erişimi inceledikten sonra aynı akışı kullanır.                                                                                                   |

Cihaz auth v2 taşıma denetimi:

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

Günlüklerde nonce/imza hataları görünüyorsa, bağlanan istemciyi güncelleyin ve şunları doğrulayın:

1. `connect.challenge` bekliyor
2. challenge'a bağlı payload'ı imzalıyor
3. aynı challenge nonce ile `connect.params.device.nonce` gönderiyor

`openclaw devices rotate` / `revoke` / `remove` beklenmedik şekilde reddediliyorsa:

- eşleştirilmiş cihaz belirteç oturumları yalnızca **kendi** cihazlarını yönetebilir; şu durum hariç:
  çağıran aynı zamanda `operator.admin` yetkisine sahipse
- `openclaw devices rotate --scope ...`, yalnızca
  çağıran oturumun zaten sahip olduğu operatör kapsamlarını isteyebilir

İlgili:

- [/web/control-ui](/tr/web/control-ui)
- [/gateway/configuration](/tr/gateway/configuration) (gateway auth modları)
- [/gateway/trusted-proxy-auth](/tr/gateway/trusted-proxy-auth)
- [/gateway/remote](/tr/gateway/remote)
- [/cli/devices](/tr/cli/devices)

## Gateway hizmeti çalışmıyor

Hizmet kuruluysa ama süreç ayakta kalmıyorsa bunu kullanın.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # sistem düzeyi hizmetleri de tara
```

Şunlara bakın:

- Çıkış ipuçlarıyla birlikte `Runtime: stopped`.
- Hizmet yapılandırması uyuşmazlığı (`Config (cli)` ve `Config (service)`).
- Port/dinleyici çakışmaları.
- `--deep` kullanıldığında ek launchd/systemd/schtasks kurulumları.
- `Other gateway-like services detected (best effort)` temizleme ipuçları.

Yaygın imzalar:

- `Gateway start blocked: set gateway.mode=local` veya `existing config is missing gateway.mode` → yerel gateway modu etkin değil ya da yapılandırma dosyası bozulmuş ve `gateway.mode` alanını kaybetmiş. Düzeltme: yapılandırmanızda `gateway.mode="local"` ayarlayın veya beklenen yerel mod yapılandırmasını yeniden damgalamak için `openclaw onboard --mode local` / `openclaw setup` komutunu tekrar çalıştırın. OpenClaw'ı Podman ile çalıştırıyorsanız, varsayılan yapılandırma yolu `~/.openclaw/openclaw.json` dosyasıdır.
- `refusing to bind gateway ... without auth` → geçerli bir gateway auth yolu (belirteç/parola veya yapılandırıldıysa trusted-proxy) olmadan loopback dışı bağlama.
- `another gateway instance is already listening` / `EADDRINUSE` → port çakışması.
- `Other gateway-like services detected (best effort)` → eski veya paralel launchd/systemd/schtasks birimleri var. Çoğu kurulum makine başına tek gateway tutmalıdır; birden fazlasına gerçekten ihtiyacınız varsa port + config/state/workspace yalıtın. Bkz. [/gateway#multiple-gateways-same-host](/tr/gateway#multiple-gateways-same-host).

İlgili:

- [/gateway/background-process](/tr/gateway/background-process)
- [/gateway/configuration](/tr/gateway/configuration)
- [/gateway/doctor](/tr/gateway/doctor)

## Gateway son bilinen iyi yapılandırmayı geri yükledi

Gateway başlıyor ama günlüklerde `openclaw.json` dosyasını geri yüklediğini söylüyorsa bunu kullanın.

```bash
openclaw logs --follow
openclaw config file
openclaw config validate
openclaw doctor
```

Şunlara bakın:

- `Config auto-restored from last-known-good`
- `gateway: invalid config was restored from last-known-good backup`
- `config reload restored last-known-good config after invalid-config`
- Etkin yapılandırmanın yanında zaman damgalı bir `openclaw.json.clobbered.*` dosyası
- `Config recovery warning` ile başlayan bir ana aracı sistem olayı

Ne oldu:

- Reddedilen yapılandırma, başlangıç veya sıcak yeniden yükleme sırasında doğrulamayı geçmedi.
- OpenClaw reddedilen payload'ı `.clobbered.*` olarak korudu.
- Etkin yapılandırma son doğrulanmış son bilinen iyi kopyadan geri yüklendi.
- Sonraki ana aracı turu, reddedilen yapılandırmayı körü körüne yeniden yazmaması konusunda uyarılır.

İnceleme ve onarım:

```bash
CONFIG="$(openclaw config file)"
ls -lt "$CONFIG".clobbered.* "$CONFIG".rejected.* 2>/dev/null | head
diff -u "$CONFIG" "$(ls -t "$CONFIG".clobbered.* 2>/dev/null | head -n 1)"
openclaw config validate
openclaw doctor
```

Yaygın imzalar:

- `.clobbered.*` var → harici bir doğrudan düzenleme veya başlangıç okuması geri yüklendi.
- `.rejected.*` var → OpenClaw'a ait bir yapılandırma yazımı, işlenmeden önce şema veya clobber denetimlerinde başarısız oldu.
- `Config write rejected:` → yazım gerekli şekli düşürmeye, dosyayı keskin biçimde küçültmeye veya geçersiz yapılandırma kalıcılaştırmaya çalıştı.
- `missing-meta-vs-last-good`, `gateway-mode-missing-vs-last-good` veya `size-drop-vs-last-good:*` → başlangıç, geçerli dosya alanları veya boyutu son bilinen iyi yedeklemeye göre kaybettiği için dosyayı bozulmuş kabul etti.
- `Config last-known-good promotion skipped` → aday `***` gibi sansürlenmiş gizli yer tutucuları içeriyordu.

Düzeltme seçenekleri:

1. Geri yüklenen etkin yapılandırma doğruysa onu koruyun.
2. Yalnızca amaçlanan anahtarları `.clobbered.*` veya `.rejected.*` dosyasından kopyalayın, sonra bunları `openclaw config set` veya `config.patch` ile uygulayın.
3. Yeniden başlatmadan önce `openclaw config validate` çalıştırın.
4. Elle düzenliyorsanız, değiştirmek istediğiniz kısmi nesneyi değil tam JSON5 yapılandırmasını koruyun.

İlgili:

- [/gateway/configuration#strict-validation](/tr/gateway/configuration#strict-validation)
- [/gateway/configuration#config-hot-reload](/tr/gateway/configuration#config-hot-reload)
- [/cli/config](/tr/cli/config)
- [/gateway/doctor](/tr/gateway/doctor)

## Gateway probe uyarıları

`openclaw gateway probe` bir şeye ulaşıyor ama yine de bir uyarı bloğu yazdırıyorsa bunu kullanın.

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

Şunlara bakın:

- JSON çıktısındaki `warnings[].code` ve `primaryTargetId`.
- Uyarının SSH geri dönüşü, birden çok gateway, eksik kapsamlar veya çözümlenmemiş auth ref'ler hakkında olup olmadığı.

Yaygın imzalar:

- `SSH tunnel failed to start; falling back to direct probes.` → SSH kurulumu başarısız oldu ama komut yine de doğrudan yapılandırılmış/loopback hedeflerini denedi.
- `multiple reachable gateways detected` → birden fazla hedef yanıt verdi. Bu genellikle kasıtlı bir çoklu gateway kurulumu veya eski/yinelenen dinleyiciler anlamına gelir.
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → bağlantı çalıştı ama ayrıntı RPC'si kapsamla sınırlı; cihaz kimliğini eşleştirin veya `operator.read` içeren kimlik bilgileri kullanın.
- `Capability: pairing-pending` veya `gateway closed (1008): pairing required` → gateway yanıt verdi ama bu istemcinin normal operatör erişiminden önce hâlâ eşleştirme/onaya ihtiyacı var.
- çözümlenmemiş `gateway.auth.*` / `gateway.remote.*` SecretRef uyarı metni → auth materyali, başarısız hedef için bu komut yolunda kullanılamadı.

İlgili:

- [/cli/gateway](/tr/cli/gateway)
- [/gateway#multiple-gateways-same-host](/tr/gateway#multiple-gateways-same-host)
- [/gateway/remote](/tr/gateway/remote)

## Kanal bağlı ama mesaj akışı yok

Kanal durumu bağlı görünüyorsa ama mesaj akışı durmuşsa, ilkeye, izinlere ve kanala özgü teslimat kurallarına odaklanın.

```bash
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw status --deep
openclaw logs --follow
openclaw config get channels
```

Şunlara bakın:

- DM ilkesi (`pairing`, `allowlist`, `open`, `disabled`).
- Grup izin listesi ve bahsetme gereksinimleri.
- Eksik kanal API izinleri/kapsamları.

Yaygın imzalar:

- `mention required` → mesaj grup bahsetme ilkesi tarafından yok sayıldı.
- `pairing` / bekleyen onay izleri → gönderici onaylanmamış.
- `missing_scope`, `not_in_channel`, `Forbidden`, `401/403` → kanal auth/izin sorunu.

İlgili:

- [/channels/troubleshooting](/tr/channels/troubleshooting)
- [/channels/whatsapp](/tr/channels/whatsapp)
- [/channels/telegram](/tr/channels/telegram)
- [/channels/discord](/tr/channels/discord)

## Cron ve Heartbeat teslimatı

Cron veya Heartbeat çalışmadıysa ya da teslim etmediyse, önce zamanlayıcı durumunu doğrulayın, sonra teslimat hedefini kontrol edin.

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

Şunlara bakın:

- Cron etkin ve sonraki uyanma mevcut.
- İş çalıştırma geçmişi durumu (`ok`, `skipped`, `error`).
- Heartbeat atlama nedenleri (`quiet-hours`, `requests-in-flight`, `alerts-disabled`, `empty-heartbeat-file`, `no-tasks-due`).

Yaygın imzalar:

- `cron: scheduler disabled; jobs will not run automatically` → cron devre dışı.
- `cron: timer tick failed` → zamanlayıcı tik'i başarısız oldu; dosya/günlük/çalışma zamanı hatalarını kontrol edin.
- `heartbeat skipped` ve `reason=quiet-hours` → etkin saatler penceresinin dışında.
- `heartbeat skipped` ve `reason=empty-heartbeat-file` → `HEARTBEAT.md` var ama yalnızca boş satırlar / markdown başlıkları içeriyor, bu yüzden OpenClaw model çağrısını atlıyor.
- `heartbeat skipped` ve `reason=no-tasks-due` → `HEARTBEAT.md` bir `tasks:` bloğu içeriyor ama bu tikte görevlerin hiçbiri zamanı gelmiş değil.
- `heartbeat: unknown accountId` → Heartbeat teslimat hedefi için geçersiz hesap kimliği.
- `heartbeat skipped` ve `reason=dm-blocked` → Heartbeat hedefi DM tarzı bir hedefe çözümlendi ama `agents.defaults.heartbeat.directPolicy` (veya aracı başına geçersiz kılma) `block` olarak ayarlanmış.

İlgili:

- [/automation/cron-jobs#troubleshooting](/tr/automation/cron-jobs#troubleshooting)
- [/automation/cron-jobs](/tr/automation/cron-jobs)
- [/gateway/heartbeat](/tr/gateway/heartbeat)

## Node eşleştirilmiş ama araç başarısız

Bir Node eşleştirilmişse ama araçlar başarısız oluyorsa, ön plan, izin ve onay durumunu yalıtın.

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

Şunlara bakın:

- Beklenen yeteneklerle çevrimiçi Node.
- Kamera/mikrofon/konum/ekran için OS izinleri.
- Exec onayları ve izin listesi durumu.

Yaygın imzalar:

- `NODE_BACKGROUND_UNAVAILABLE` → Node uygulaması ön planda olmalı.
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → eksik OS izni.
- `SYSTEM_RUN_DENIED: approval required` → exec onayı beklemede.
- `SYSTEM_RUN_DENIED: allowlist miss` → komut izin listesi tarafından engellendi.

İlgili:

- [/nodes/troubleshooting](/tr/nodes/troubleshooting)
- [/nodes/index](/tr/nodes/index)
- [/tools/exec-approvals](/tr/tools/exec-approvals)

## Tarayıcı aracı başarısız

Gateway'in kendisi sağlıklı görünse bile tarayıcı aracı eylemleri başarısız oluyorsa bunu kullanın.

```bash
openclaw browser status
openclaw browser start --browser-profile openclaw
openclaw browser profiles
openclaw logs --follow
openclaw doctor
```

Şunlara bakın:

- `plugins.allow` ayarlı mı ve `browser` içeriyor mu.
- Geçerli tarayıcı yürütülebilir yolu.
- CDP profil erişilebilirliği.
- `existing-session` / `user` profilleri için yerel Chrome kullanılabilirliği.

Yaygın imzalar:

- `unknown command "browser"` veya `unknown command 'browser'` → paketlenmiş browser Plugin'i `plugins.allow` tarafından hariç tutulmuş.
- `browser.enabled=true` iken browser aracı eksik / kullanılamıyor → `plugins.allow`, `browser` öğesini hariç tutuyor, bu yüzden Plugin hiç yüklenmedi.
- `Failed to start Chrome CDP on port` → tarayıcı süreci başlatılamadı.
- `browser.executablePath not found` → yapılandırılmış yol geçersiz.
- `browser.cdpUrl must be http(s) or ws(s)` → yapılandırılmış CDP URL'si `file:` veya `ftp:` gibi desteklenmeyen bir şema kullanıyor.
- `browser.cdpUrl has invalid port` → yapılandırılmış CDP URL'sinde kötü veya aralık dışı bir port var.
- `Could not find DevToolsActivePort for chrome` → Chrome MCP existing-session seçilen tarayıcı veri dizinine henüz bağlanamadı. Tarayıcı inspect sayfasını açın, uzaktan hata ayıklamayı etkinleştirin, tarayıcıyı açık tutun, ilk bağlanma istemini onaylayın ve sonra yeniden deneyin. Oturum açılmış durum gerekmiyorsa, yönetilen `openclaw` profilini tercih edin.
- `No Chrome tabs found for profile="user"` → Chrome MCP bağlanma profilinde açık yerel Chrome sekmesi yok.
- `Remote CDP for profile "<name>" is not reachable` → yapılandırılmış uzak CDP uç noktasına gateway ana makinesinden erişilemiyor.
- `Browser attachOnly is enabled ... not reachable` veya `Browser attachOnly is enabled and CDP websocket ... is not reachable` → attach-only profilinin erişilebilir hedefi yok ya da HTTP uç noktası yanıt verdi ama CDP WebSocket yine de açılamadı.
- `Playwright is not available in this gateway build; '<feature>' is unsupported.` → geçerli gateway kurulumunda paketlenmiş browser Plugin'inin `playwright-core` çalışma zamanı bağımlılığı yok; `openclaw doctor --fix` çalıştırın, sonra gateway'i yeniden başlatın. ARIA anlık görüntüleri ve temel sayfa ekran görüntüleri yine de çalışabilir, ancak gezinme, AI anlık görüntüleri, CSS seçici öğe ekran görüntüleri ve PDF dışa aktarma kullanılamaz kalır.
- `fullPage is not supported for element screenshots` → ekran görüntüsü isteği `--full-page` ile `--ref` veya `--element` değerlerini karıştırdı.
- `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → Chrome MCP / `existing-session` ekran görüntüsü çağrıları CSS `--element` değil, sayfa yakalama veya bir anlık görüntü `--ref` kullanmalıdır.
- `existing-session file uploads do not support element selectors; use ref/inputRef.` → Chrome MCP yükleme kancaları CSS seçicileri değil, anlık görüntü ref'leri gerektirir.
- `existing-session file uploads currently support one file at a time.` → Chrome MCP profillerinde çağrı başına tek yükleme gönderin.
- `existing-session dialog handling does not support timeoutMs.` → Chrome MCP profillerindeki iletişim kutusu kancaları zaman aşımı geçersiz kılmalarını desteklemez.
- `existing-session type does not support timeoutMs overrides.` → `profile="user"` / Chrome MCP existing-session profillerinde `act:type` için `timeoutMs` kullanmayın veya özel zaman aşımı gerektiğinde yönetilen/CDP tarayıcı profili kullanın.
- `existing-session evaluate does not support timeoutMs overrides.` → `profile="user"` / Chrome MCP existing-session profillerinde `act:evaluate` için `timeoutMs` kullanmayın veya özel zaman aşımı gerektiğinde yönetilen/CDP tarayıcı profili kullanın.
- `response body is not supported for existing-session profiles yet.` → `responsebody` hâlâ yönetilen bir tarayıcı veya ham CDP profili gerektirir.
- attach-only veya uzak CDP profillerinde eski viewport / dark-mode / locale / offline geçersiz kılmaları → tüm gateway'i yeniden başlatmadan etkin kontrol oturumunu kapatmak ve Playwright/CDP öykünme durumunu serbest bırakmak için `openclaw browser stop --browser-profile <name>` çalıştırın.

İlgili:

- [/tools/browser-linux-troubleshooting](/tr/tools/browser-linux-troubleshooting)
- [/tools/browser](/tr/tools/browser)

## Yükselttiniz ve bir şey aniden bozulduysa

Yükseltme sonrası bozulmaların çoğu yapılandırma sapması veya artık zorlanan daha katı varsayılanlardır.

### 1) Auth ve URL geçersiz kılma davranışı değişti

```bash
openclaw gateway status
openclaw config get gateway.mode
openclaw config get gateway.remote.url
openclaw config get gateway.auth.mode
```

Kontrol edilmesi gerekenler:

- `gateway.mode=remote` ise, yerel hizmetiniz iyi olsa bile CLI çağrıları uzağı hedefliyor olabilir.
- Açık `--url` çağrıları saklanan kimlik bilgilerine geri dönmez.

Yaygın imzalar:

- `gateway connect failed:` → yanlış URL hedefi.
- `unauthorized` → uç noktaya erişiliyor ama auth yanlış.

### 2) Bağlama ve auth korkulukları daha katı

```bash
openclaw config get gateway.bind
openclaw config get gateway.auth.mode
openclaw config get gateway.auth.token
openclaw gateway status
openclaw logs --follow
```

Kontrol edilmesi gerekenler:

- Loopback dışı bağlamalar (`lan`, `tailnet`, `custom`) geçerli bir gateway auth yolu gerektirir: paylaşılan belirteç/parola auth veya doğru yapılandırılmış loopback dışı `trusted-proxy` dağıtımı.
- `gateway.token` gibi eski anahtarlar `gateway.auth.token` yerine geçmez.

Yaygın imzalar:

- `refusing to bind gateway ... without auth` → geçerli gateway auth yolu olmadan loopback dışı bağlama.
- Çalışma zamanı çalışırken `Connectivity probe: failed` → gateway canlı ama geçerli auth/url ile erişilemez.

### 3) Eşleştirme ve cihaz kimliği durumu değişti

```bash
openclaw devices list
openclaw pairing list --channel <channel> [--account <id>]
openclaw logs --follow
openclaw doctor
```

Kontrol edilmesi gerekenler:

- Dashboard/Node'lar için bekleyen cihaz onayları.
- İlke veya kimlik değişikliklerinden sonra bekleyen DM eşleştirme onayları.

Yaygın imzalar:

- `device identity required` → cihaz auth karşılanmadı.
- `pairing required` → gönderici/cihaz onaylanmalı.

Kontrollerden sonra hizmet yapılandırması ve çalışma zamanı hâlâ uyuşmuyorsa, aynı profil/durum dizininden hizmet üst verilerini yeniden kurun:

```bash
openclaw gateway install --force
openclaw gateway restart
```

İlgili:

- [/gateway/pairing](/tr/gateway/pairing)
- [/gateway/authentication](/tr/gateway/authentication)
- [/gateway/background-process](/tr/gateway/background-process)

## İlgili

- [Gateway çalışma kitabı](/tr/gateway)
- [Doctor](/tr/gateway/doctor)
- [SSS](/tr/help/faq)
