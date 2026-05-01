---
read_when:
    - Sorun giderme merkezi, daha ayrıntılı tanılama için sizi buraya yönlendirdi
    - Kesin komutlar içeren kararlı, belirti temelli runbook bölümlerine ihtiyacınız var
sidebarTitle: Troubleshooting
summary: Gateway, kanallar, otomasyon, düğümler ve tarayıcı için derinlemesine sorun giderme kılavuzu
title: Sorun giderme
x-i18n:
    generated_at: "2026-05-01T09:01:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: a808dcfd8527b041f629cff24308550f961e9eeb4d7d4ce6f1ce84dff6bbef89
    source_path: gateway/troubleshooting.md
    workflow: 16
---

Bu sayfa derin çalıştırma kitabıdır. Önce hızlı triyaj akışını istiyorsanız [/help/troubleshooting](/tr/help/troubleshooting) sayfasından başlayın.

## Komut merdiveni

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
- `openclaw doctor`, engelleyici yapılandırma/hizmet sorunu bildirmez.
- `openclaw channels status --probe`, hesap başına canlı aktarım durumunu ve desteklendiği yerlerde `works` veya `audit ok` gibi yoklama/denetim sonuçlarını gösterir.

## Bölünmüş kurulumlar ve daha yeni yapılandırma koruması

Bunu, bir Gateway hizmeti güncellemeden sonra beklenmedik şekilde durduğunda veya günlükler bir `openclaw` ikilisinin `openclaw.json` dosyasını en son yazan sürümden daha eski olduğunu gösterdiğinde kullanın.

OpenClaw, yapılandırma yazımlarını `meta.lastTouchedVersion` ile damgalar. Salt okunur komutlar daha yeni bir OpenClaw tarafından yazılmış yapılandırmayı yine de inceleyebilir, ancak süreç ve hizmet değişiklikleri eski bir ikiliden devam etmeyi reddeder. Engellenen eylemler arasında Gateway hizmetini başlatma, durdurma, yeniden başlatma, kaldırma, zorunlu hizmet yeniden kurulumu, hizmet modunda Gateway başlatma ve `gateway --force` port temizliği bulunur.

```bash
which openclaw
openclaw --version
openclaw gateway status --deep
openclaw config get meta.lastTouchedVersion
```

<Steps>
  <Step title="PATH'i düzelt">
    `openclaw` daha yeni kuruluma çözümlenecek şekilde `PATH` değerini düzeltin, ardından eylemi yeniden çalıştırın.
  </Step>
  <Step title="Gateway hizmetini yeniden kur">
    Amaçlanan Gateway hizmetini daha yeni kurulumdan yeniden kurun:

    ```bash
    openclaw gateway install --force
    openclaw gateway restart
    ```

  </Step>
  <Step title="Eski sarmalayıcıları kaldır">
    Hâlâ eski bir `openclaw` ikilisine işaret eden eski sistem paketi veya eski sarmalayıcı girdilerini kaldırın.
  </Step>
</Steps>

<Warning>
Yalnızca kasıtlı sürüm düşürme veya acil kurtarma için, tek komutta `OPENCLAW_ALLOW_OLDER_BINARY_DESTRUCTIVE_ACTIONS=1` ayarını yapın. Normal işlem için ayarı boş bırakın.
</Warning>

## Uzun bağlam için Anthropic 429 ek kullanım gerektirir

Günlükler/hatalar şunu içerdiğinde bunu kullanın: `HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

Şunları arayın:

- Seçili Anthropic Opus/Sonnet modelinde `params.context1m: true` var.
- Mevcut Anthropic kimlik bilgisi uzun bağlam kullanımına uygun değil.
- İstekler yalnızca 1M beta yolunu gerektiren uzun oturumlarda/model çalıştırmalarında başarısız oluyor.

Düzeltme seçenekleri:

<Steps>
  <Step title="context1m ayarını devre dışı bırak">
    Normal bağlam penceresine geri dönmek için o modelde `context1m` ayarını devre dışı bırakın.
  </Step>
  <Step title="Uygun bir kimlik bilgisi kullan">
    Uzun bağlam istekleri için uygun bir Anthropic kimlik bilgisi kullanın veya bir Anthropic API anahtarına geçin.
  </Step>
  <Step title="Yedek modelleri yapılandır">
    Anthropic uzun bağlam istekleri reddedildiğinde çalıştırmaların devam etmesi için yedek modelleri yapılandırın.
  </Step>
</Steps>

İlgili:

- [Anthropic](/tr/providers/anthropic)
- [Token kullanımı ve maliyetler](/tr/reference/token-use)
- [Neden Anthropic'ten HTTP 429 görüyorum?](/tr/help/faq-first-run#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## Yerel OpenAI uyumlu arka uç doğrudan yoklamalardan geçiyor ancak ajan çalıştırmaları başarısız oluyor

Bunu şu durumlarda kullanın:

- `curl ... /v1/models` çalışıyor
- küçük doğrudan `/v1/chat/completions` çağrıları çalışıyor
- OpenClaw model çalıştırmaları yalnızca normal ajan turlarında başarısız oluyor

```bash
curl http://127.0.0.1:1234/v1/models
curl http://127.0.0.1:1234/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"<id>","messages":[{"role":"user","content":"hi"}],"stream":false}'
openclaw infer model run --model <provider/model> --prompt "hi" --json
openclaw logs --follow
```

Şunları arayın:

- doğrudan küçük çağrılar başarılı oluyor, ancak OpenClaw çalıştırmaları yalnızca daha büyük istemlerde başarısız oluyor
- aynı yalın model kimliğiyle doğrudan `/v1/chat/completions`
  çalışmasına rağmen `model_not_found` veya 404 hataları
- `messages[].content` için dize beklediğini belirten arka uç hataları
- OpenAI uyumlu yerel arka uçla aralıklı `incomplete turn detected ... stopReason=stop payloads=0` uyarıları
- yalnızca daha büyük istem-token sayıları veya tam ajan çalışma zamanı istemleriyle ortaya çıkan arka uç çökmeleri

<AccordionGroup>
  <Accordion title="Yaygın imzalar">
    - Yerel MLX/vLLM tarzı sunucuda `model_not_found` → `baseUrl` değerinin `/v1` içerdiğini, `/v1/chat/completions` arka uçları için `api` değerinin `"openai-completions"` olduğunu ve `models.providers.<provider>.models[].id` değerinin yalın sağlayıcı-yerel kimlik olduğunu doğrulayın. Örneğin `mlx/mlx-community/Qwen3-30B-A3B-6bit` gibi sağlayıcı önekiyle bir kez seçin; katalog girdisini `mlx-community/Qwen3-30B-A3B-6bit` olarak tutun.
    - `messages[...].content: invalid type: sequence, expected a string` → arka uç yapılandırılmış Chat Completions içerik parçalarını reddediyor. Düzeltme: `models.providers.<provider>.models[].compat.requiresStringContent: true` ayarlayın.
    - `incomplete turn detected ... stopReason=stop payloads=0` → arka uç Chat Completions isteğini tamamladı ancak o tur için kullanıcıya görünür asistan metni döndürmedi. OpenClaw, yeniden oynatılması güvenli boş OpenAI uyumlu turları bir kez yeniden dener; kalıcı hatalar genellikle arka ucun boş/metin dışı içerik ürettiği veya son yanıt metnini bastırdığı anlamına gelir.
    - doğrudan küçük istekler başarılı oluyor, ancak OpenClaw ajan çalıştırmaları arka uç/model çökmeleriyle başarısız oluyor (örneğin bazı `inferrs` derlemelerinde Gemma) → OpenClaw aktarımı büyük olasılıkla zaten doğru; arka uç daha büyük ajan çalışma zamanı istem biçiminde başarısız oluyor.
    - araçları devre dışı bıraktıktan sonra hatalar azalıyor ancak kaybolmuyor → araç şemaları baskının bir parçasıydı, ancak kalan sorun hâlâ üst akış model/sunucu kapasitesi veya arka uç hatasıdır.

  </Accordion>
  <Accordion title="Düzeltme seçenekleri">
    1. Yalnızca dize destekleyen Chat Completions arka uçları için `compat.requiresStringContent: true` ayarlayın.
    2. OpenClaw'ın araç şeması yüzeyini güvenilir şekilde işleyemeyen modeller/arka uçlar için `compat.supportsTools: false` ayarlayın.
    3. Mümkün olan yerlerde istem baskısını azaltın: daha küçük çalışma alanı başlangıcı, daha kısa oturum geçmişi, daha hafif yerel model veya daha güçlü uzun bağlam desteğine sahip bir arka uç.
    4. Küçük doğrudan istekler geçmeye devam ederken OpenClaw ajan turları hâlâ arka uç içinde çöküyorsa, bunu üst akış sunucu/model sınırlaması olarak ele alın ve kabul edilen yük biçimiyle birlikte oraya bir yeniden üretim kaydı açın.
  </Accordion>
</AccordionGroup>

İlgili:

- [Yapılandırma](/tr/gateway/configuration)
- [Yerel modeller](/tr/gateway/local-models)
- [OpenAI uyumlu uç noktalar](/tr/gateway/configuration-reference#openai-compatible-endpoints)

## Yanıt yok

Kanallar çalışır durumdaysa ancak hiçbir şey yanıt vermiyorsa, herhangi bir şeyi yeniden bağlamadan önce yönlendirme ve politikayı kontrol edin.

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

Şunları arayın:

- DM gönderenleri için eşleştirme beklemede.
- Grup bahsetme geçidi (`requireMention`, `mentionPatterns`).
- Kanal/grup izin listesi uyumsuzlukları.

Yaygın imzalar:

- `drop guild message (mention required` → grup mesajı bahsetme yapılana kadar yok sayıldı.
- `pairing request` → gönderenin onaya ihtiyacı var.
- `blocked` / `allowlist` → gönderen/kanal politika tarafından filtrelendi.

İlgili:

- [Kanal sorun giderme](/tr/channels/troubleshooting)
- [Gruplar](/tr/channels/groups)
- [Eşleştirme](/tr/channels/pairing)

## Pano kontrol kullanıcı arayüzü bağlantısı

Pano/kontrol kullanıcı arayüzü bağlanmadığında URL'yi, kimlik doğrulama modunu ve güvenli bağlam varsayımlarını doğrulayın.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

Şunları arayın:

- Doğru yoklama URL'si ve pano URL'si.
- İstemci ve Gateway arasında kimlik doğrulama modu/token uyuşmazlığı.
- Cihaz kimliğinin gerekli olduğu yerde HTTP kullanımı.

<AccordionGroup>
  <Accordion title="Bağlantı / kimlik doğrulama imzaları">
    - `device identity required` → güvenli olmayan bağlam veya eksik cihaz kimlik doğrulaması.
    - `origin not allowed` → tarayıcı `Origin` değeri `gateway.controlUi.allowedOrigins` içinde değil (veya açık bir izin listesi olmadan local loopback olmayan bir tarayıcı kaynağından bağlanıyorsunuz).
    - `device nonce required` / `device nonce mismatch` → istemci, sınamaya dayalı cihaz kimlik doğrulama akışını tamamlamıyor (`connect.challenge` + `device.nonce`).
    - `device signature invalid` / `device signature expired` → istemci mevcut el sıkışma için yanlış yükü (veya eski zaman damgasını) imzaladı.
    - `AUTH_TOKEN_MISMATCH` ile `canRetryWithDeviceToken=true` → istemci önbelleğe alınmış cihaz token'ı ile güvenilir bir yeniden deneme yapabilir.
    - Bu önbelleğe alınmış token yeniden denemesi, eşleştirilmiş cihaz token'ıyla depolanan önbelleğe alınmış kapsam kümesini yeniden kullanır. Açık `deviceToken` / açık `scopes` çağırıcıları bunun yerine kendi istenen kapsam kümesini korur.
    - Bu yeniden deneme yolunun dışında, bağlantı kimlik doğrulama önceliği önce açık paylaşılan token/parola, sonra açık `deviceToken`, sonra depolanmış cihaz token'ı, sonra başlangıç token'ıdır.
    - Eşzamansız Tailscale Serve Control UI yolunda, aynı `{scope, ip}` için başarısız denemeler, sınırlayıcı başarısızlığı kaydetmeden önce serileştirilir. Bu nedenle aynı istemciden iki hatalı eşzamanlı yeniden deneme, iki düz uyuşmazlık yerine ikinci denemede `retry later` olarak görünebilir.
    - Tarayıcı kaynaklı local loopback istemcisinden `too many failed authentication attempts (retry later)` → aynı normalleştirilmiş `Origin` üzerinden tekrarlanan hatalar geçici olarak kilitlenir; başka bir localhost kaynağı ayrı bir kova kullanır.
    - bu yeniden denemeden sonra tekrarlanan `unauthorized` → paylaşılan token/cihaz token'ı sapması; token yapılandırmasını yenileyin ve gerekirse cihaz token'ını yeniden onaylayın/döndürün.
    - `gateway connect failed:` → yanlış ana makine/port/url hedefi.

  </Accordion>
</AccordionGroup>

### Kimlik doğrulama ayrıntı kodları hızlı haritası

Sonraki eylemi seçmek için başarısız `connect` yanıtındaki `error.details.code` değerini kullanın:

| Ayrıntı kodu                 | Anlamı                                                                                                                                                                                       | Önerilen eylem                                                                                                                                                                                                                                                                           |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`         | İstemci gerekli paylaşılan belirteci göndermedi.                                                                                                                                             | İstemcide belirteci yapıştırın/ayarlayın ve yeniden deneyin. Pano yolları için: `openclaw config get gateway.auth.token`, ardından Control UI ayarlarına yapıştırın.                                                                                                                     |
| `AUTH_TOKEN_MISMATCH`        | Paylaşılan belirteç Gateway kimlik doğrulama belirteciyle eşleşmedi.                                                                                                                         | `canRetryWithDeviceToken=true` ise bir güvenilir yeniden denemeye izin verin. Önbelleğe alınmış belirteç yeniden denemeleri saklanan onaylı kapsamları yeniden kullanır; açık `deviceToken` / `scopes` çağıranları istenen kapsamları korur. Hâlâ başarısız oluyorsa [belirteç sapması kurtarma kontrol listesini](/tr/cli/devices#token-drift-recovery-checklist) çalıştırın. |
| `AUTH_DEVICE_TOKEN_MISMATCH` | Önbelleğe alınmış cihaz başına belirteç eski veya iptal edilmiş.                                                                                                                             | [devices CLI](/tr/cli/devices) kullanarak cihaz belirtecini döndürün/yeniden onaylayın, ardından yeniden bağlanın.                                                                                                                                                                           |
| `PAIRING_REQUIRED`           | Cihaz kimliğinin onaylanması gerekiyor. `not-paired`, `scope-upgrade`, `role-upgrade` veya `metadata-upgrade` için `error.details.reason` değerini kontrol edin ve varsa `requestId` / `remediationHint` kullanın. | Bekleyen isteği onaylayın: `openclaw devices list`, ardından `openclaw devices approve <requestId>`. Kapsam/rol yükseltmeleri, istenen erişimi gözden geçirdikten sonra aynı akışı kullanır.                                                                                              |

<Note>
Paylaşılan Gateway belirteci/parolasıyla kimliği doğrulanan doğrudan geri döngü arka uç RPC'leri, CLI'nin eşlenmiş cihaz kapsam temel çizgisine bağlı olmamalıdır. Alt ajanlar veya diğer dahili çağrılar hâlâ `scope-upgrade` ile başarısız oluyorsa, çağıranın `client.id: "gateway-client"` ve `client.mode: "backend"` kullandığını ve açık bir `deviceIdentity` veya cihaz belirteci zorlamadığını doğrulayın.
</Note>

Cihaz kimlik doğrulaması v2 geçiş denetimi:

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

Günlükler nonce/imza hataları gösteriyorsa, bağlanan istemciyi güncelleyin ve doğrulayın:

<Steps>
  <Step title="Wait for connect.challenge">
    İstemci, Gateway tarafından verilen `connect.challenge` değerini bekler.
  </Step>
  <Step title="Sign the payload">
    İstemci, challenge'a bağlı yükü imzalar.
  </Step>
  <Step title="Send the device nonce">
    İstemci, aynı challenge nonce'u ile `connect.params.device.nonce` gönderir.
  </Step>
</Steps>

`openclaw devices rotate` / `revoke` / `remove` beklenmedik şekilde reddedilirse:

- eşlenmiş cihaz belirteci oturumları, çağıranın ayrıca `operator.admin` yetkisi yoksa yalnızca **kendi** cihazını yönetebilir
- `openclaw devices rotate --scope ...` yalnızca çağıran oturumun zaten sahip olduğu operatör kapsamlarını isteyebilir

İlgili:

- [Yapılandırma](/tr/gateway/configuration) (Gateway kimlik doğrulama modları)
- [Control UI](/tr/web/control-ui)
- [Cihazlar](/tr/cli/devices)
- [Uzaktan erişim](/tr/gateway/remote)
- [Güvenilir proxy kimlik doğrulaması](/tr/gateway/trusted-proxy-auth)

## Gateway hizmeti çalışmıyor

Hizmet kurulu olduğu halde süreç ayakta kalmıyorsa bunu kullanın.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # also scan system-level services
```

Şunlara bakın:

- Çıkış ipuçlarıyla birlikte `Runtime: stopped`.
- Hizmet yapılandırması uyuşmazlığı (`Config (cli)` ile `Config (service)`).
- Bağlantı noktası/dinleyici çakışmaları.
- `--deep` kullanıldığında ek launchd/systemd/schtasks kurulumları.
- `Other gateway-like services detected (best effort)` temizleme ipuçları.

<AccordionGroup>
  <Accordion title="Common signatures">
    - `Gateway start blocked: set gateway.mode=local` veya `existing config is missing gateway.mode` → yerel Gateway modu etkin değil ya da yapılandırma dosyasının üzerine yazılmış ve `gateway.mode` kaybolmuş. Düzeltme: yapılandırmanızda `gateway.mode="local"` ayarlayın veya beklenen yerel mod yapılandırmasını yeniden damgalamak için `openclaw onboard --mode local` / `openclaw setup` komutunu yeniden çalıştırın. OpenClaw'ı Podman üzerinden çalıştırıyorsanız varsayılan yapılandırma yolu `~/.openclaw/openclaw.json` olur.
    - `refusing to bind gateway ... without auth` → geçerli bir Gateway kimlik doğrulama yolu (belirteç/parola veya yapılandırılmışsa güvenilir proxy) olmadan geri döngü dışı bağlama.
    - `another gateway instance is already listening` / `EADDRINUSE` → bağlantı noktası çakışması.
    - `Other gateway-like services detected (best effort)` → eski veya paralel launchd/systemd/schtasks birimleri var. Çoğu kurulum makine başına tek Gateway tutmalıdır; birden fazlasına gerçekten ihtiyacınız varsa bağlantı noktalarını + yapılandırmayı/durumu/çalışma alanını yalıtın. Bkz. [/gateway#multiple-gateways-same-host](/tr/gateway#multiple-gateways-same-host).
    - Doctor'dan `System-level OpenClaw gateway service detected` → kullanıcı düzeyi hizmet yokken bir systemd sistem birimi var. Doctor'ın kullanıcı hizmeti kurmasına izin vermeden önce yinelenen birimi kaldırın veya devre dışı bırakın ya da sistem birimi amaçlanan denetleyiciyse `OPENCLAW_SERVICE_REPAIR_POLICY=external` ayarlayın.
    - `Gateway service port does not match current gateway config` → kurulu denetleyici hâlâ eski `--port` değerini sabitliyor. `openclaw doctor --fix` veya `openclaw gateway install --force` çalıştırın, ardından Gateway hizmetini yeniden başlatın.

  </Accordion>
</AccordionGroup>

İlgili:

- [Arka plan yürütme ve süreç aracı](/tr/gateway/background-process)
- [Yapılandırma](/tr/gateway/configuration)
- [Doctor](/tr/gateway/doctor)

## Gateway bilinen son iyi yapılandırmayı geri yükledi

Gateway başlıyor ancak günlükler `openclaw.json` dosyasının geri yüklendiğini söylüyorsa bunu kullanın.

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
- `Config recovery warning` ile başlayan bir ana ajan sistem olayı

<AccordionGroup>
  <Accordion title="What happened">
    - Reddedilen yapılandırma, başlatma veya sıcak yeniden yükleme sırasında doğrulanmadı.
    - OpenClaw reddedilen yükü `.clobbered.*` olarak korudu.
    - Etkin yapılandırma, doğrulanmış son bilinen iyi kopyadan geri yüklendi.
    - Sonraki ana ajan turu, reddedilen yapılandırmayı körlemesine yeniden yazmaması için uyarılır.
    - Tüm doğrulama sorunları `plugins.entries.<id>...` altında olsaydı OpenClaw dosyanın tamamını geri yüklemezdi. Plugin yerelindeki hatalar görünür kalırken ilgisiz kullanıcı ayarları etkin yapılandırmada kalır.

  </Accordion>
  <Accordion title="Inspect and repair">
    ```bash
    CONFIG="$(openclaw config file)"
    ls -lt "$CONFIG".clobbered.* "$CONFIG".rejected.* 2>/dev/null | head
    diff -u "$CONFIG" "$(ls -t "$CONFIG".clobbered.* 2>/dev/null | head -n 1)"
    openclaw config validate
    openclaw doctor
    ```
  </Accordion>
  <Accordion title="Common signatures">
    - `.clobbered.*` var → harici doğrudan düzenleme veya başlatma okuması geri yüklendi.
    - `.rejected.*` var → OpenClaw'a ait bir yapılandırma yazımı, işleme alınmadan önce şema veya üzerine yazma denetimlerinde başarısız oldu.
    - `Config write rejected:` → yazma işlemi gerekli şekli kaldırmaya, dosyayı keskin biçimde küçültmeye veya geçersiz yapılandırmayı kalıcılaştırmaya çalıştı.
    - `Rejected validation details:` → kurtarma günlüğü veya ana ajan bildirimi, geri yüklemeye neden olan şema yolunu içerir; örneğin `agents.defaults.execution` veya `gateway.auth.password.source`.
    - `missing-meta-vs-last-good`, `gateway-mode-missing-vs-last-good` veya `size-drop-vs-last-good:*` → başlatma, mevcut dosyayı son bilinen iyi yedeğe kıyasla alan veya boyut kaybettiği için üzerine yazılmış kabul etti.
    - `Config last-known-good promotion skipped` → aday, `***` gibi maskelenmiş gizli yer tutucuları içeriyordu.

  </Accordion>
  <Accordion title="Fix options">
    1. Doğruysa geri yüklenen etkin yapılandırmayı koruyun.
    2. Yalnızca amaçlanan anahtarları `.clobbered.*` veya `.rejected.*` içinden kopyalayın, ardından bunları `openclaw config set` veya `config.patch` ile uygulayın.
    3. Yeniden başlatmadan önce `openclaw config validate` çalıştırın.
    4. Elle düzenliyorsanız, değiştirmek istediğiniz kısmi nesneyi değil tam JSON5 yapılandırmasını koruyun.
  </Accordion>
</AccordionGroup>

İlgili:

- [Config](/tr/cli/config)
- [Yapılandırma: sıcak yeniden yükleme](/tr/gateway/configuration#config-hot-reload)
- [Yapılandırma: katı doğrulama](/tr/gateway/configuration#strict-validation)
- [Doctor](/tr/gateway/doctor)

## Gateway probe uyarıları

`openclaw gateway probe` bir şeye ulaşıyor ancak yine de bir uyarı bloğu yazdırıyorsa bunu kullanın.

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

Şunlara bakın:

- JSON çıktısında `warnings[].code` ve `primaryTargetId`.
- Uyarının SSH geri dönüşü, birden fazla Gateway, eksik kapsamlar veya çözümlenmemiş kimlik doğrulama başvuruları hakkında olup olmadığı.

Yaygın imzalar:

- `SSH tunnel failed to start; falling back to direct probes.` → SSH kurulumu başarısız oldu, ancak komut yine de doğrudan yapılandırılmış/geri döngü hedeflerini denedi.
- `multiple reachable gateways detected` → birden fazla hedef yanıt verdi. Genellikle bu, kasıtlı bir çoklu Gateway kurulumu veya eski/yinelenen dinleyiciler anlamına gelir.
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → bağlantı çalıştı, ancak ayrıntı RPC'si kapsamla sınırlı; cihaz kimliğini eşleyin veya `operator.read` içeren kimlik bilgileri kullanın.
- `Gateway accepted the WebSocket connection, but follow-up read diagnostics failed` → bağlantı çalıştı, ancak tam tanılama RPC seti zaman aşımına uğradı veya başarısız oldu. Bunu, tanılamaları kısıtlı olan erişilebilir bir Gateway olarak değerlendirin; `--json` çıktısında `connect.ok` ve `connect.rpcOk` değerlerini karşılaştırın.
- `Capability: pairing-pending` veya `gateway closed (1008): pairing required` → Gateway yanıt verdi, ancak bu istemcinin normal operatör erişiminden önce hâlâ eşleme/onay alması gerekiyor.
- çözümlenmemiş `gateway.auth.*` / `gateway.remote.*` SecretRef uyarı metni → başarısız hedef için bu komut yolunda kimlik doğrulama materyali kullanılamadı.

İlgili:

- [Gateway](/tr/cli/gateway)
- [Aynı ana bilgisayarda birden fazla Gateway](/tr/gateway#multiple-gateways-same-host)
- [Uzaktan erişim](/tr/gateway/remote)

## Kanal bağlı, iletiler akmıyor

Kanal durumu bağlıysa ancak ileti akışı durmuşsa ilkeye, izinlere ve kanala özgü teslim kurallarına odaklanın.

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

- `mention required` → ileti, grup bahsetme ilkesi tarafından yok sayıldı.
- `pairing` / bekleyen onay izleri → gönderen onaylı değil.
- `missing_scope`, `not_in_channel`, `Forbidden`, `401/403` → kanal kimlik doğrulama/izin sorunu.

İlgili:

- [Kanal sorun giderme](/tr/channels/troubleshooting)
- [Discord](/tr/channels/discord)
- [Telegram](/tr/channels/telegram)
- [WhatsApp](/tr/channels/whatsapp)

## Cron ve Heartbeat teslimi

Cron veya Heartbeat çalışmadıysa ya da teslim etmediyse önce zamanlayıcı durumunu, ardından teslim hedefini doğrulayın.

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
- Heartbeat atlama nedenleri (`quiet-hours`, `requests-in-flight`, `cron-in-progress`, `lanes-busy`, `alerts-disabled`, `empty-heartbeat-file`, `no-tasks-due`).

<AccordionGroup>
  <Accordion title="Common signatures">
    - `cron: scheduler disabled; jobs will not run automatically` → cron devre dışı.
    - `cron: timer tick failed` → zamanlayıcı tik işlemi başarısız oldu; dosya/günlük/çalışma zamanı hatalarını denetleyin.
    - `heartbeat skipped` with `reason=quiet-hours` → etkin saatler penceresinin dışında.
    - `heartbeat skipped` with `reason=empty-heartbeat-file` → `HEARTBEAT.md` var ancak yalnızca boş satırlar / markdown başlıkları içeriyor, bu yüzden OpenClaw model çağrısını atlar.
    - `heartbeat skipped` with `reason=no-tasks-due` → `HEARTBEAT.md` bir `tasks:` bloğu içeriyor, ancak bu tikte görevlerin hiçbiri gelmiş değil.
    - `heartbeat: unknown accountId` → Heartbeat teslim hedefi için geçersiz hesap kimliği.
    - `heartbeat skipped` with `reason=dm-blocked` → Heartbeat hedefi, `agents.defaults.heartbeat.directPolicy` (veya aracı başına geçersiz kılma) `block` olarak ayarlıyken DM tarzı bir hedefe çözümlendi.

  </Accordion>
</AccordionGroup>

İlgili:

- [Heartbeat](/tr/gateway/heartbeat)
- [Zamanlanmış görevler](/tr/automation/cron-jobs)
- [Zamanlanmış görevler: sorun giderme](/tr/automation/cron-jobs#troubleshooting)

## Node eşleştirildi, araç başarısız oluyor

Bir Node eşleştirilmişse ancak araçlar başarısız oluyorsa ön plan, izin ve onay durumunu izole edin.

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

Şunları arayın:

- Beklenen yeteneklerle Node çevrimiçi.
- Kamera/mikrofon/konum/ekran için işletim sistemi izinleri.
- Exec onayları ve izin listesi durumu.

Yaygın imzalar:

- `NODE_BACKGROUND_UNAVAILABLE` → Node uygulaması ön planda olmalıdır.
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → eksik işletim sistemi izni.
- `SYSTEM_RUN_DENIED: approval required` → exec onayı bekliyor.
- `SYSTEM_RUN_DENIED: allowlist miss` → komut izin listesi tarafından engellendi.

İlgili:

- [Exec onayları](/tr/tools/exec-approvals)
- [Node sorun giderme](/tr/nodes/troubleshooting)
- [Nodes](/tr/nodes/index)

## Tarayıcı aracı başarısız oluyor

Gateway'in kendisi sağlıklıyken tarayıcı aracı eylemleri başarısız olduğunda bunu kullanın.

```bash
openclaw browser status
openclaw browser start --browser-profile openclaw
openclaw browser profiles
openclaw logs --follow
openclaw doctor
```

Şunları arayın:

- `plugins.allow` ayarlanmış mı ve `browser` içeriyor mu.
- Geçerli tarayıcı çalıştırılabilir dosya yolu.
- CDP profil erişilebilirliği.
- `existing-session` / `user` profilleri için yerel Chrome kullanılabilirliği.

<AccordionGroup>
  <Accordion title="Plugin / executable signatures">
    - `unknown command "browser"` or `unknown command 'browser'` → paketli tarayıcı Plugin'i `plugins.allow` tarafından dışlanmış.
    - tarayıcı aracı eksik / kullanılamıyor, `browser.enabled=true` iken → `plugins.allow`, `browser` öğesini dışlıyor, bu yüzden Plugin hiç yüklenmedi.
    - `Failed to start Chrome CDP on port` → tarayıcı işlemi başlatılamadı.
    - `browser.executablePath not found` → yapılandırılmış yol geçersiz.
    - `browser.cdpUrl must be http(s) or ws(s)` → yapılandırılmış CDP URL'si `file:` veya `ftp:` gibi desteklenmeyen bir şema kullanıyor.
    - `browser.cdpUrl has invalid port` → yapılandırılmış CDP URL'sinde hatalı veya aralık dışında bir bağlantı noktası var.
    - `Playwright is not available in this gateway build; '<feature>' is unsupported.` → geçerli Gateway kurulumu, paketli tarayıcı Plugin'inin `playwright-core` çalışma zamanı bağımlılığından yoksun; `openclaw doctor --fix` çalıştırın, ardından Gateway'i yeniden başlatın. ARIA anlık görüntüleri ve temel sayfa ekran görüntüleri yine de çalışabilir, ancak gezinme, AI anlık görüntüleri, CSS seçici öğe ekran görüntüleri ve PDF dışa aktarma kullanılamaz kalır.

  </Accordion>
  <Accordion title="Chrome MCP / existing-session signatures">
    - `Could not find DevToolsActivePort for chrome` → Chrome MCP existing-session henüz seçilen tarayıcı veri dizinine bağlanamadı. Tarayıcı inceleme sayfasını açın, uzaktan hata ayıklamayı etkinleştirin, tarayıcıyı açık tutun, ilk bağlanma istemini onaylayın, ardından yeniden deneyin. Oturum açılmış durum gerekli değilse yönetilen `openclaw` profilini tercih edin.
    - `No Chrome tabs found for profile="user"` → Chrome MCP bağlanma profilinde açık yerel Chrome sekmesi yok.
    - `Remote CDP for profile "<name>" is not reachable` → yapılandırılmış uzak CDP uç noktasına Gateway ana makinesinden erişilemiyor.
    - `Browser attachOnly is enabled ... not reachable` or `Browser attachOnly is enabled and CDP websocket ... is not reachable` → yalnızca bağlanma profili için erişilebilir hedef yok veya HTTP uç noktası yanıt verdi ancak CDP WebSocket yine de açılamadı.

  </Accordion>
  <Accordion title="Element / screenshot / upload signatures">
    - `fullPage is not supported for element screenshots` → ekran görüntüsü isteği `--full-page` ile `--ref` veya `--element` öğesini birlikte kullandı.
    - `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → Chrome MCP / `existing-session` ekran görüntüsü çağrıları CSS `--element` değil, sayfa yakalama veya anlık görüntü `--ref` kullanmalıdır.
    - `existing-session file uploads do not support element selectors; use ref/inputRef.` → Chrome MCP yükleme kancaları CSS seçicileri değil, anlık görüntü referansları gerektirir.
    - `existing-session file uploads currently support one file at a time.` → Chrome MCP profillerinde çağrı başına bir yükleme gönderin.
    - `existing-session dialog handling does not support timeoutMs.` → Chrome MCP profillerindeki iletişim kutusu kancaları zaman aşımı geçersiz kılmalarını desteklemez.
    - `existing-session type does not support timeoutMs overrides.` → `profile="user"` / Chrome MCP existing-session profillerinde `act:type` için `timeoutMs` öğesini atlayın veya özel zaman aşımı gerekiyorsa yönetilen/CDP tarayıcı profili kullanın.
    - `existing-session evaluate does not support timeoutMs overrides.` → `profile="user"` / Chrome MCP existing-session profillerinde `act:evaluate` için `timeoutMs` öğesini atlayın veya özel zaman aşımı gerekiyorsa yönetilen/CDP tarayıcı profili kullanın.
    - `response body is not supported for existing-session profiles yet.` → `responsebody` hâlâ yönetilen tarayıcı veya ham CDP profili gerektirir.
    - yalnızca bağlanma veya uzak CDP profillerinde eski viewport / koyu mod / yerel ayar / çevrimdışı geçersiz kılmaları → tüm Gateway'i yeniden başlatmadan etkin denetim oturumunu kapatmak ve Playwright/CDP öykünme durumunu serbest bırakmak için `openclaw browser stop --browser-profile <name>` çalıştırın.

  </Accordion>
</AccordionGroup>

İlgili:

- [Tarayıcı (OpenClaw tarafından yönetilen)](/tr/tools/browser)
- [Tarayıcı sorun giderme](/tr/tools/browser-linux-troubleshooting)

## Yükselttiyseniz ve bir şey aniden bozulduysa

Yükseltme sonrası bozulmaların çoğu yapılandırma sapması veya artık uygulanan daha katı varsayılanlardır.

<AccordionGroup>
  <Accordion title="1. Auth and URL override behavior changed">
    ```bash
    openclaw gateway status
    openclaw config get gateway.mode
    openclaw config get gateway.remote.url
    openclaw config get gateway.auth.mode
    ```

    Denetlenecekler:

    - `gateway.mode=remote` ise CLI çağrıları, yerel hizmetiniz sorunsuzken uzak hedefe gidiyor olabilir.
    - Açık `--url` çağrıları kayıtlı kimlik bilgilerine geri dönmez.

    Yaygın imzalar:

    - `gateway connect failed:` → yanlış URL hedefi.
    - `unauthorized` → uç nokta erişilebilir ancak auth yanlış.

  </Accordion>
  <Accordion title="2. Bind and auth guardrails are stricter">
    ```bash
    openclaw config get gateway.bind
    openclaw config get gateway.auth.mode
    openclaw config get gateway.auth.token
    openclaw gateway status
    openclaw logs --follow
    ```

    Denetlenecekler:

    - local loopback dışı bağlamalar (`lan`, `tailnet`, `custom`) geçerli bir Gateway auth yolu gerektirir: paylaşılan token/parola auth ya da doğru yapılandırılmış local loopback dışı `trusted-proxy` dağıtımı.
    - `gateway.token` gibi eski anahtarlar `gateway.auth.token` yerine geçmez.

    Yaygın imzalar:

    - `refusing to bind gateway ... without auth` → geçerli Gateway auth yolu olmadan local loopback dışı bağlama.
    - `Connectivity probe: failed` çalışma zamanı çalışırken → Gateway canlı ancak geçerli auth/url ile erişilemez.

  </Accordion>
  <Accordion title="3. Pairing and device identity state changed">
    ```bash
    openclaw devices list
    openclaw pairing list --channel <channel> [--account <id>]
    openclaw logs --follow
    openclaw doctor
    ```

    Denetlenecekler:

    - pano/Node'lar için bekleyen cihaz onayları.
    - İlke veya kimlik değişikliklerinden sonra bekleyen DM eşleştirme onayları.

    Yaygın imzalar:

    - `device identity required` → cihaz auth karşılanmadı.
    - `pairing required` → gönderen/cihaz onaylanmalıdır.

  </Accordion>
</AccordionGroup>

Denetimlerden sonra hizmet yapılandırması ve çalışma zamanı hâlâ uyuşmuyorsa hizmet meta verilerini aynı profil/durum dizininden yeniden kurun:

```bash
openclaw gateway install --force
openclaw gateway restart
```

İlgili:

- [Authentication](/tr/gateway/authentication)
- [Arka plan exec ve işlem aracı](/tr/gateway/background-process)
- [Gateway sahipli eşleştirme](/tr/gateway/pairing)

## İlgili

- [Doctor](/tr/gateway/doctor)
- [SSS](/tr/help/faq)
- [Gateway runbook](/tr/gateway)
