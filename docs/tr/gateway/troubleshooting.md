---
read_when:
    - Sorun giderme merkezi sizi daha derin tanılama için buraya yönlendirdi
    - Kesin komutlarla kararlı belirti tabanlı runbook bölümlerine ihtiyacınız var
sidebarTitle: Troubleshooting
summary: Gateway, kanallar, otomasyon, Node'lar ve tarayıcı için derin sorun giderme runbook'u
title: Sorun giderme
x-i18n:
    generated_at: "2026-04-26T11:32:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: eacc6b2a0e8522a761dcee0a3b9bc024eefbd7a5ab4118fc090401868a571bcf
    source_path: gateway/troubleshooting.md
    workflow: 15
---

Bu sayfa derin runbook'tur. Önce hızlı triyaj akışını istiyorsanız [/help/troubleshooting](/tr/help/troubleshooting) ile başlayın.

## Komut zinciri

Önce bunları şu sırayla çalıştırın:

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
- `openclaw channels status --probe`, canlı hesap başına taşıma durumu ile desteklendiği yerlerde `works` veya `audit ok` gibi probe/denetim sonuçlarını gösterir.

## Split brain kurulumları ve yeni yapılandırma koruması

Bir güncellemeden sonra bir gateway hizmeti beklenmedik şekilde durursa veya günlükler bir `openclaw` ikilisinin `openclaw.json` dosyasını en son yazan sürümden daha eski olduğunu gösterirse bunu kullanın.

OpenClaw, yapılandırma yazımlarını `meta.lastTouchedVersion` ile damgalar. Salt okunur komutlar yine de daha yeni bir OpenClaw tarafından yazılmış yapılandırmayı inceleyebilir, ancak süreç ve hizmet değişiklikleri daha eski bir ikiliden devam etmeyi reddeder. Engellenen eylemler arasında gateway hizmeti başlatma, durdurma, yeniden başlatma, kaldırma, zorunlu hizmet yeniden kurulumu, hizmet modunda gateway başlangıcı ve `gateway --force` bağlantı noktası temizliği bulunur.

```bash
which openclaw
openclaw --version
openclaw gateway status --deep
openclaw config get meta.lastTouchedVersion
```

<Steps>
  <Step title="PATH'i düzeltin">
    `openclaw` daha yeni kuruluma çözümlenecek şekilde `PATH` değerini düzeltin, sonra eylemi yeniden çalıştırın.
  </Step>
  <Step title="Gateway hizmetini yeniden kurun">
    Amaçlanan gateway hizmetini daha yeni kurulumdan yeniden kurun:

    ```bash
    openclaw gateway install --force
    openclaw gateway restart
    ```

  </Step>
  <Step title="Eski sarmalayıcıları kaldırın">
    Hâlâ eski bir `openclaw` ikilisine işaret eden eski sistem paketi veya eski sarmalayıcı girdilerini kaldırın.
  </Step>
</Steps>

<Warning>
Yalnızca kasıtlı sürüm düşürme veya acil kurtarma için, tek komut için `OPENCLAW_ALLOW_OLDER_BINARY_DESTRUCTIVE_ACTIONS=1` ayarlayın. Normal kullanımda ayarsız bırakın.
</Warning>

## Uzun bağlam için Anthropic 429 ek kullanım gerekiyor

Günlükler/hatalar şu metni içerdiğinde bunu kullanın: `HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

Şunlara bakın:

- Seçili Anthropic Opus/Sonnet modelinde `params.context1m: true` var.
- Geçerli Anthropic kimlik bilgisi uzun bağlam kullanımı için uygun değil.
- İstekler yalnızca 1M beta yoluna ihtiyaç duyan uzun oturumlarda/model çalıştırmalarında başarısız oluyor.

Düzeltme seçenekleri:

<Steps>
  <Step title="context1m'i devre dışı bırakın">
    Normal bağlam penceresine geri dönmek için bu modelde `context1m` değerini devre dışı bırakın.
  </Step>
  <Step title="Uygun bir kimlik bilgisi kullanın">
    Uzun bağlam istekleri için uygun bir Anthropic kimlik bilgisi kullanın veya bir Anthropic API anahtarına geçin.
  </Step>
  <Step title="Geri dönüş modelleri yapılandırın">
    Anthropic uzun bağlam istekleri reddedildiğinde çalıştırmaların devam etmesi için geri dönüş modelleri yapılandırın.
  </Step>
</Steps>

İlgili:

- [Anthropic](/tr/providers/anthropic)
- [Belirteç kullanımı ve maliyetler](/tr/reference/token-use)
- [Anthropic'ten neden HTTP 429 görüyorum?](/tr/help/faq-first-run#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

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

Şunlara bakın:

- doğrudan küçük çağrılar başarılı, ancak OpenClaw çalıştırmaları yalnızca daha büyük istemlerde başarısız oluyor
- `messages[].content` alanının dize beklediğini söyleyen arka uç hataları
- yalnızca daha büyük istem-belirteç sayılarında veya tam aracı çalışma zamanı istemlerinde görünen arka uç çökmeleri

<AccordionGroup>
  <Accordion title="Yaygın imzalar">
    - `messages[...].content: invalid type: sequence, expected a string` → arka uç yapılandırılmış Chat Completions içerik bölümlerini reddediyor. Düzeltme: `models.providers.<provider>.models[].compat.requiresStringContent: true` ayarlayın.
    - doğrudan küçük istekler başarılı, ancak OpenClaw aracı çalıştırmaları arka uç/model çökmeleriyle başarısız oluyor (örneğin bazı `inferrs` derlemelerinde Gemma) → OpenClaw taşıması büyük olasılıkla zaten doğru; arka uç daha büyük aracı çalışma zamanı istem biçiminde başarısız oluyor.
    - araçları devre dışı bıraktıktan sonra hatalar azalıyor ama kaybolmuyor → araç şemaları baskının bir parçasıydı, ancak kalan sorun hâlâ yukarı akış model/sunucu kapasitesi veya bir arka uç hatası.

  </Accordion>
  <Accordion title="Düzeltme seçenekleri">
    1. Yalnızca dize kullanan Chat Completions arka uçları için `compat.requiresStringContent: true` ayarlayın.
    2. OpenClaw'ın araç şeması yüzeyini güvenilir şekilde işleyemeyen modeller/arka uçlar için `compat.supportsTools: false` ayarlayın.
    3. Mümkün olan yerlerde istem baskısını azaltın: daha küçük çalışma alanı önyüklemesi, daha kısa oturum geçmişi, daha hafif yerel model veya daha güçlü uzun bağlam desteği olan bir arka uç.
    4. Doğrudan küçük istekler geçmeye devam ederken OpenClaw aracı dönüşleri hâlâ arka uç içinde çöküyorsa, bunu bir yukarı akış sunucu/model sınırlaması olarak değerlendirin ve kabul edilen yük biçimiyle orada bir yeniden üretim örneği dosyalayın.
  </Accordion>
</AccordionGroup>

İlgili:

- [Yapılandırma](/tr/gateway/configuration)
- [Yerel modeller](/tr/gateway/local-models)
- [OpenAI uyumlu uç noktalar](/tr/gateway/configuration-reference#openai-compatible-endpoints)

## Yanıt yok

Kanallar açıksa ama hiçbir şey yanıt vermiyorsa, herhangi bir şeyi yeniden bağlamadan önce yönlendirme ve ilkeyi kontrol edin.

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

Şunlara bakın:

- DM gönderenleri için eşleştirme beklemede.
- Grup bahsetme geçidi (`requireMention`, `mentionPatterns`).
- Kanal/grup allowlist uyumsuzlukları.

Yaygın imzalar:

- `drop guild message (mention required` → grup mesajı, bahsetmeye kadar yok sayıldı.
- `pairing request` → gönderenin onaylanması gerekiyor.
- `blocked` / `allowlist` → gönderen/kanal ilke tarafından filtrelendi.

İlgili:

- [Kanal sorun giderme](/tr/channels/troubleshooting)
- [Gruplar](/tr/channels/groups)
- [Eşleştirme](/tr/channels/pairing)

## Dashboard Control UI bağlantısı

Dashboard/Control UI bağlanmıyorsa URL, kimlik doğrulama modu ve güvenli bağlam varsayımlarını doğrulayın.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

Şunlara bakın:

- Doğru probe URL'si ve dashboard URL'si.
- İstemci ile gateway arasındaki kimlik doğrulama modu/belirteç uyumsuzluğu.
- Device kimliği gerektiğinde HTTP kullanımı.

<AccordionGroup>
  <Accordion title="Bağlantı / kimlik doğrulama imzaları">
    - `device identity required` → güvenli olmayan bağlam veya eksik device kimlik doğrulaması.
    - `origin not allowed` → tarayıcı `Origin` değeri `gateway.controlUi.allowedOrigins` içinde değil (veya açık bir allowlist olmadan loopback olmayan bir tarayıcı origin'inden bağlanıyorsunuz).
    - `device nonce required` / `device nonce mismatch` → istemci, challenge tabanlı device kimlik doğrulama akışını tamamlamıyor (`connect.challenge` + `device.nonce`).
    - `device signature invalid` / `device signature expired` → istemci geçerli el sıkışma için yanlış yükü (veya eski zaman damgasını) imzaladı.
    - `AUTH_TOKEN_MISMATCH` ve `canRetryWithDeviceToken=true` → istemci önbelleğe alınmış device token ile bir güvenilir yeniden deneme yapabilir.
    - Bu önbelleğe alınmış token yeniden denemesi, eşleştirilmiş device token ile saklanan önbelleğe alınmış kapsam kümesini yeniden kullanır. Açık `deviceToken` / açık `scopes` çağıranları ise istenen kapsam kümesini korur.
    - Bu yeniden deneme yolunun dışında, bağlantı kimlik doğrulama önceliği önce açık paylaşılan token/parola, sonra açık `deviceToken`, sonra saklanan device token, sonra önyükleme token şeklindedir.
    - Asenkron Tailscale Serve Control UI yolunda, aynı `{scope, ip}` için başarısız denemeler sınırlayıcı başarısızlığı kaydetmeden önce serileştirilir. Aynı istemciden gelen iki kötü eşzamanlı yeniden deneme, bu yüzden ikinci denemede iki düz uyumsuzluk yerine `retry later` gösterebilir.
    - Tarayıcı origin'li bir loopback istemcisinden gelen `too many failed authentication attempts (retry later)` → aynı normalize edilmiş `Origin` değerinden gelen tekrar eden hatalar geçici olarak kilitlenir; başka bir localhost origin'i ayrı bir kova kullanır.
    - Bundan sonraki tekrarlayan `unauthorized` → paylaşılan token/device token kayması; gerekirse token yapılandırmasını yenileyin ve device token'i yeniden onaylayın/döndürün.
    - `gateway connect failed:` → yanlış ana makine/bağlantı noktası/url hedefi.

  </Accordion>
</AccordionGroup>

### Kimlik doğrulama ayrıntı kodları hızlı harita

Sonraki eylemi seçmek için başarısız `connect` yanıtındaki `error.details.code` değerini kullanın:

| Ayrıntı kodu                | Anlamı                                                                                                                                                                                       | Önerilen eylem                                                                                                                                                                                                                                                                            |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`        | İstemci gerekli paylaşılan belirteci göndermedi.                                                                                                                                             | Belirteci istemciye yapıştırın/ayarlayın ve yeniden deneyin. Dashboard yolları için: `openclaw config get gateway.auth.token` sonra bunu Control UI ayarlarına yapıştırın.                                                                                                             |
| `AUTH_TOKEN_MISMATCH`       | Paylaşılan belirteç gateway kimlik doğrulama belirteciyle eşleşmedi.                                                                                                                         | `canRetryWithDeviceToken=true` ise bir güvenilir yeniden denemeye izin verin. Önbelleğe alınmış token yeniden denemeleri saklanan onaylı kapsamları yeniden kullanır; açık `deviceToken` / `scopes` çağıranları istenen kapsamları korur. Hâlâ başarısızsa [token kayması kurtarma denetim listesini](/tr/cli/devices#token-drift-recovery-checklist) çalıştırın. |
| `AUTH_DEVICE_TOKEN_MISMATCH` | Önbelleğe alınmış cihaz başına belirteç eski veya iptal edilmiş.                                                                                                                             | [devices CLI](/tr/cli/devices) kullanarak device token'i döndürün/yeniden onaylayın, sonra yeniden bağlanın.                                                                                                                                                                               |
| `PAIRING_REQUIRED`          | Device kimliği onay gerektiriyor. `not-paired`, `scope-upgrade`, `role-upgrade` veya `metadata-upgrade` için `error.details.reason` değerini kontrol edin ve varsa `requestId` / `remediationHint` kullanın. | Bekleyen isteği onaylayın: `openclaw devices list` ardından `openclaw devices approve <requestId>`. Kapsam/rol yükseltmeleri, istenen erişimi gözden geçirdikten sonra aynı akışı kullanır.                                                                                           |

<Note>
Paylaşılan gateway token/parolasıyla kimliği doğrulanmış doğrudan loopback arka uç RPC'leri, CLI'nin eşleştirilmiş cihaz kapsamı temel çizgisine bağlı olmamalıdır. Alt aracılar veya diğer dahili çağrılar hâlâ `scope-upgrade` ile başarısız oluyorsa, çağıranın `client.id: "gateway-client"` ve `client.mode: "backend"` kullandığını ve açık bir `deviceIdentity` veya device token zorlamadığını doğrulayın.
</Note>

Device auth v2 geçiş denetimi:

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

Günlükler nonce/imza hataları gösteriyorsa, bağlanan istemciyi güncelleyin ve şunu doğrulayın:

<Steps>
  <Step title="connect.challenge için bekleyin">
    İstemci, gateway tarafından verilen `connect.challenge` için bekler.
  </Step>
  <Step title="Yükü imzalayın">
    İstemci, challenge'a bağlı yükü imzalar.
  </Step>
  <Step title="Device nonce'u gönderin">
    İstemci, aynı challenge nonce ile `connect.params.device.nonce` gönderir.
  </Step>
</Steps>

`openclaw devices rotate` / `revoke` / `remove` beklenmedik şekilde reddediliyorsa:

- eşleştirilmiş cihaz token oturumları yalnızca **kendi** cihazlarını yönetebilir; çağıran ayrıca `operator.admin` sahibi değilse
- `openclaw devices rotate --scope ...` yalnızca çağıran oturumun zaten sahip olduğu operator kapsamlarını isteyebilir

İlgili:

- [Yapılandırma](/tr/gateway/configuration) (gateway kimlik doğrulama modları)
- [Control UI](/tr/web/control-ui)
- [Devices](/tr/cli/devices)
- [Uzak erişim](/tr/gateway/remote)
- [Trusted proxy auth](/tr/gateway/trusted-proxy-auth)

## Gateway hizmeti çalışmıyor

Hizmet kuruluysa ama süreç ayakta kalmıyorsa bunu kullanın.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # sistem düzeyindeki hizmetleri de tara
```

Şunlara bakın:

- Çıkış ipuçlarıyla birlikte `Runtime: stopped`.
- Hizmet yapılandırması uyumsuzluğu (`Config (cli)` ile `Config (service)`).
- Bağlantı noktası/dinleyici çakışmaları.
- `--deep` kullanıldığında ek launchd/systemd/schtasks kurulumları.
- `Other gateway-like services detected (best effort)` temizlik ipuçları.

<AccordionGroup>
  <Accordion title="Yaygın imzalar">
    - `Gateway start blocked: set gateway.mode=local` veya `existing config is missing gateway.mode` → yerel gateway modu etkin değil veya yapılandırma dosyası bozulup `gateway.mode` alanını kaybetmiş. Düzeltme: yapılandırmanızda `gateway.mode="local"` ayarlayın veya beklenen yerel mod yapılandırmasını yeniden damgalamak için `openclaw onboard --mode local` / `openclaw setup` komutunu yeniden çalıştırın. OpenClaw'ı Podman üzerinden çalıştırıyorsanız, varsayılan yapılandırma yolu `~/.openclaw/openclaw.json` olur.
    - `refusing to bind gateway ... without auth` → geçerli bir gateway kimlik doğrulama yolu olmadan loopback dışı bağlama (token/password veya yapılandırılmışsa trusted-proxy).
    - `another gateway instance is already listening` / `EADDRINUSE` → bağlantı noktası çakışması.
    - `Other gateway-like services detected (best effort)` → eski veya paralel launchd/systemd/schtasks birimleri mevcut. Çoğu kurulum makine başına tek bir gateway tutmalıdır; birden fazlasına ihtiyacınız varsa bağlantı noktalarını + config/state/workspace alanlarını yalıtın. Bkz. [/gateway#multiple-gateways-same-host](/tr/gateway#multiple-gateways-same-host).

  </Accordion>
</AccordionGroup>

İlgili:

- [Arka plan exec ve süreç aracı](/tr/gateway/background-process)
- [Yapılandırma](/tr/gateway/configuration)
- [Doctor](/tr/gateway/doctor)

## Gateway son bilinen iyi yapılandırmayı geri yükledi

Gateway başlıyor ama günlükler `openclaw.json` dosyasını geri yüklediğini söylüyorsa bunu kullanın.

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

<AccordionGroup>
  <Accordion title="Ne oldu">
    - Reddedilen yapılandırma, başlangıç veya sıcak yeniden yükleme sırasında doğrulanmadı.
    - OpenClaw, reddedilen yükü `.clobbered.*` olarak korudu.
    - Etkin yapılandırma, en son doğrulanmış son bilinen iyi kopyadan geri yüklendi.
    - Sonraki ana aracı dönüşü, reddedilen yapılandırmayı körü körüne yeniden yazmaması için uyarılır.
    - Tüm doğrulama sorunları `plugins.entries.<id>...` altında olsaydı, OpenClaw tüm dosyayı geri yüklemezdi. Plugin yerel hataları yüksek sesle kalırken ilgisiz kullanıcı ayarları etkin yapılandırmada kalır.

  </Accordion>
  <Accordion title="İnceleyin ve onarın">
    ```bash
    CONFIG="$(openclaw config file)"
    ls -lt "$CONFIG".clobbered.* "$CONFIG".rejected.* 2>/dev/null | head
    diff -u "$CONFIG" "$(ls -t "$CONFIG".clobbered.* 2>/dev/null | head -n 1)"
    openclaw config validate
    openclaw doctor
    ```
  </Accordion>
  <Accordion title="Yaygın imzalar">
    - `.clobbered.*` mevcut → harici bir doğrudan düzenleme veya başlangıç okuması geri yüklendi.
    - `.rejected.*` mevcut → OpenClaw sahipli bir yapılandırma yazımı commit öncesinde şema veya clobber denetimlerinde başarısız oldu.
    - `Config write rejected:` → yazım, gerekli yapıyı düşürmeye, dosyayı keskin biçimde küçültmeye veya geçersiz yapılandırmayı kalıcılaştırmaya çalıştı.
    - `missing-meta-vs-last-good`, `gateway-mode-missing-vs-last-good` veya `size-drop-vs-last-good:*` → başlangıç, mevcut dosyayı son bilinen iyi yedeğe göre alan veya boyut kaybettiği için clobbered olarak değerlendirdi.
    - `Config last-known-good promotion skipped` → aday, `***` gibi sansürlenmiş gizli bilgi yer tutucuları içeriyordu.

  </Accordion>
  <Accordion title="Düzeltme seçenekleri">
    1. Doğruysa geri yüklenen etkin yapılandırmayı koruyun.
    2. Yalnızca amaçlanan anahtarları `.clobbered.*` veya `.rejected.*` içinden kopyalayın, ardından bunları `openclaw config set` veya `config.patch` ile uygulayın.
    3. Yeniden başlatmadan önce `openclaw config validate` çalıştırın.
    4. Elle düzenleme yapıyorsanız, yalnızca değiştirmek istediğiniz kısmi nesneyi değil, tam JSON5 yapılandırmasını koruyun.
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
- Uyarının SSH geri dönüşü, birden fazla gateway, eksik kapsamlar veya çözümlenmemiş auth ref'ler hakkında olup olmadığı.

Yaygın imzalar:

- `SSH tunnel failed to start; falling back to direct probes.` → SSH kurulumu başarısız oldu, ancak komut yine de doğrudan yapılandırılmış/loopback hedeflerini denedi.
- `multiple reachable gateways detected` → birden fazla hedef yanıt verdi. Genellikle bu kasıtlı bir çoklu gateway kurulumu veya eski/çift dinleyiciler anlamına gelir.
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → bağlantı çalıştı, ancak ayrıntı RPC'si kapsamla sınırlı; device kimliğini eşleştirin veya `operator.read` içeren kimlik bilgileri kullanın.
- `Capability: pairing-pending` veya `gateway closed (1008): pairing required` → gateway yanıt verdi, ancak bu istemci normal operatör erişiminden önce hâlâ eşleştirme/onay gerektiriyor.
- çözümlenmemiş `gateway.auth.*` / `gateway.remote.*` SecretRef uyarı metni → bu komut yolunda başarısız hedef için auth materyali kullanılamıyordu.

İlgili:

- [Gateway](/tr/cli/gateway)
- [Aynı ana makinede birden çok gateway](/tr/gateway#multiple-gateways-same-host)
- [Uzak erişim](/tr/gateway/remote)

## Kanal bağlı, mesajlar akmıyor

Kanal durumu bağlıysa ancak mesaj akışı durmuşsa, ilke, izinler ve kanala özgü teslimat kurallarına odaklanın.

```bash
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw status --deep
openclaw logs --follow
openclaw config get channels
```

Şunlara bakın:

- DM ilkesi (`pairing`, `allowlist`, `open`, `disabled`).
- Grup allowlist'i ve bahsetme gereksinimleri.
- Eksik kanal API izinleri/kapsamları.

Yaygın imzalar:

- `mention required` → mesaj, grup bahsetme ilkesi nedeniyle yok sayıldı.
- `pairing` / bekleyen onay izleri → gönderen onaylı değil.
- `missing_scope`, `not_in_channel`, `Forbidden`, `401/403` → kanal auth/izin sorunu.

İlgili:

- [Kanal sorun giderme](/tr/channels/troubleshooting)
- [Discord](/tr/channels/discord)
- [Telegram](/tr/channels/telegram)
- [WhatsApp](/tr/channels/whatsapp)

## Cron ve Heartbeat teslimatı

Cron veya Heartbeat çalışmadıysa ya da teslim etmediyse, önce zamanlayıcı durumunu, sonra teslimat hedefini doğrulayın.

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

Şunlara bakın:

- Cron etkin ve sonraki uyandırma mevcut.
- İş çalıştırma geçmişi durumu (`ok`, `skipped`, `error`).
- Heartbeat atlama nedenleri (`quiet-hours`, `requests-in-flight`, `alerts-disabled`, `empty-heartbeat-file`, `no-tasks-due`).

<AccordionGroup>
  <Accordion title="Yaygın imzalar">
    - `cron: scheduler disabled; jobs will not run automatically` → cron devre dışı.
    - `cron: timer tick failed` → zamanlayıcı tiki başarısız oldu; dosya/günlük/çalışma zamanı hatalarını kontrol edin.
    - `heartbeat skipped` ve `reason=quiet-hours` → etkin saatler penceresinin dışında.
    - `heartbeat skipped` ve `reason=empty-heartbeat-file` → `HEARTBEAT.md` mevcut ancak yalnızca boş satırlar / markdown başlıkları içeriyor, bu yüzden OpenClaw model çağrısını atlıyor.
    - `heartbeat skipped` ve `reason=no-tasks-due` → `HEARTBEAT.md` bir `tasks:` bloğu içeriyor, ancak görevlerin hiçbiri bu tikte zamanı gelmiş değil.
    - `heartbeat: unknown accountId` → Heartbeat teslimat hedefi için geçersiz hesap kimliği.
    - `heartbeat skipped` ve `reason=dm-blocked` → Heartbeat hedefi DM tarzı bir hedefe çözümlendi, ancak `agents.defaults.heartbeat.directPolicy` (veya aracı başına geçersiz kılma) `block` olarak ayarlı.

  </Accordion>
</AccordionGroup>

İlgili:

- [Heartbeat](/tr/gateway/heartbeat)
- [Zamanlanmış görevler](/tr/automation/cron-jobs)
- [Zamanlanmış görevler: sorun giderme](/tr/automation/cron-jobs#troubleshooting)

## Node eşleştirildi, araç başarısız

Bir Node eşleştirilmiş ama araçlar başarısız oluyorsa, ön plan, izin ve onay durumunu yalıtın.

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

Şunlara bakın:

- Beklenen yeteneklerle birlikte Node çevrimiçi.
- Kamera/mikrofon/konum/ekran için işletim sistemi izinleri.
- Exec onayları ve allowlist durumu.

Yaygın imzalar:

- `NODE_BACKGROUND_UNAVAILABLE` → Node uygulaması ön planda olmalı.
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → eksik işletim sistemi izni.
- `SYSTEM_RUN_DENIED: approval required` → exec onayı beklemede.
- `SYSTEM_RUN_DENIED: allowlist miss` → komut allowlist tarafından engellendi.

İlgili:

- [Exec onayları](/tr/tools/exec-approvals)
- [Node sorun giderme](/tr/nodes/troubleshooting)
- [Nodes](/tr/nodes/index)

## Tarayıcı aracı başarısız

Gateway'in kendisi sağlıklı olsa bile tarayıcı araç eylemleri başarısız olduğunda bunu kullanın.

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

<AccordionGroup>
  <Accordion title="Plugin / yürütülebilir imzaları">
    - `unknown command "browser"` veya `unknown command 'browser'` → paketli browser Plugin'i `plugins.allow` tarafından hariç tutulmuş.
    - `browser.enabled=true` olduğu hâlde browser aracı eksik / kullanılamıyor → `plugins.allow`, `browser` değerini dışlıyor; bu yüzden Plugin hiç yüklenmedi.
    - `Failed to start Chrome CDP on port` → tarayıcı süreci başlatılamadı.
    - `browser.executablePath not found` → yapılandırılmış yol geçersiz.
    - `browser.cdpUrl must be http(s) or ws(s)` → yapılandırılmış CDP URL'si `file:` veya `ftp:` gibi desteklenmeyen bir şema kullanıyor.
    - `browser.cdpUrl has invalid port` → yapılandırılmış CDP URL'sinde kötü veya aralık dışı bir bağlantı noktası var.
    - `Playwright is not available in this gateway build; '<feature>' is unsupported.` → geçerli gateway kurulumu, paketli browser Plugin'inin `playwright-core` çalışma zamanı bağımlılığına sahip değil; `openclaw doctor --fix` çalıştırın, ardından gateway'i yeniden başlatın. ARIA anlık görüntüleri ve temel sayfa ekran görüntüleri yine de çalışabilir, ancak gezinme, AI anlık görüntüleri, CSS seçici öğe ekran görüntüleri ve PDF dışa aktarma kullanılamaz durumda kalır.

  </Accordion>
  <Accordion title="Chrome MCP / existing-session imzaları">
    - `Could not find DevToolsActivePort for chrome` → Chrome MCP existing-session seçilen tarayıcı veri dizinine henüz bağlanamadı. Tarayıcı inspect sayfasını açın, uzaktan hata ayıklamayı etkinleştirin, tarayıcıyı açık tutun, ilk bağlanma istemini onaylayın, sonra yeniden deneyin. Oturum açılmış durum gerekmiyorsa yönetilen `openclaw` profilini tercih edin.
    - `No Chrome tabs found for profile="user"` → Chrome MCP bağlanma profilinin açık yerel Chrome sekmesi yok.
    - `Remote CDP for profile "<name>" is not reachable` → yapılandırılmış uzak CDP uç noktasına gateway ana makinesinden erişilemiyor.
    - `Browser attachOnly is enabled ... not reachable` veya `Browser attachOnly is enabled and CDP websocket ... is not reachable` → yalnızca bağlanmalı profilin erişilebilir hedefi yok veya HTTP uç noktası yanıt verdi ama CDP WebSocket yine de açılamadı.

  </Accordion>
  <Accordion title="Öğe / ekran görüntüsü / yükleme imzaları">
    - `fullPage is not supported for element screenshots` → ekran görüntüsü isteği `--full-page` ile `--ref` veya `--element` seçeneklerini karıştırdı.
    - `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → Chrome MCP / `existing-session` ekran görüntüsü çağrıları CSS `--element` değil, sayfa yakalama veya anlık görüntü `--ref` kullanmalıdır.
    - `existing-session file uploads do not support element selectors; use ref/inputRef.` → Chrome MCP yükleme kancaları CSS seçiciler değil, anlık görüntü başvuruları ister.
    - `existing-session file uploads currently support one file at a time.` → Chrome MCP profillerinde çağrı başına tek yükleme gönderin.
    - `existing-session dialog handling does not support timeoutMs.` → Chrome MCP profillerindeki iletişim kutusu kancaları zaman aşımı geçersiz kılmalarını desteklemez.
    - `existing-session type does not support timeoutMs overrides.` → `profile="user"` / Chrome MCP existing-session profillerinde `act:type` için `timeoutMs` kullanmayın veya özel zaman aşımı gerekiyorsa yönetilen/CDP tarayıcı profili kullanın.
    - `existing-session evaluate does not support timeoutMs overrides.` → `profile="user"` / Chrome MCP existing-session profillerinde `act:evaluate` için `timeoutMs` kullanmayın veya özel zaman aşımı gerekiyorsa yönetilen/CDP tarayıcı profili kullanın.
    - `response body is not supported for existing-session profiles yet.` → `responsebody` hâlâ yönetilen bir tarayıcı veya ham CDP profili gerektirir.
    - yalnızca bağlanmalı veya uzak CDP profillerinde eski viewport / koyu mod / yerel ayar / çevrimdışı geçersiz kılmaları → tüm gateway'i yeniden başlatmadan etkin kontrol oturumunu kapatmak ve Playwright/CDP öykünme durumunu serbest bırakmak için `openclaw browser stop --browser-profile <name>` çalıştırın.

  </Accordion>
</AccordionGroup>

İlgili:

- [Browser (OpenClaw tarafından yönetilen)](/tr/tools/browser)
- [Browser sorun giderme](/tr/tools/browser-linux-troubleshooting)

## Yükselttiniz ve bir şey aniden bozulduysa

Yükseltme sonrası bozulmaların çoğu yapılandırma kayması veya artık uygulanan daha katı varsayılanlardan kaynaklanır.

<AccordionGroup>
  <Accordion title="1. Kimlik doğrulama ve URL geçersiz kılma davranışı değişti">
    ```bash
    openclaw gateway status
    openclaw config get gateway.mode
    openclaw config get gateway.remote.url
    openclaw config get gateway.auth.mode
    ```

    Kontrol edilecekler:

    - `gateway.mode=remote` ise CLI çağrıları uzak hedefe gidiyor olabilir, oysa yerel hizmetiniz sağlam olabilir.
    - Açık `--url` çağrıları saklanan kimlik bilgilerine geri dönmez.

    Yaygın imzalar:

    - `gateway connect failed:` → yanlış URL hedefi.
    - `unauthorized` → uç noktaya erişilebiliyor ama kimlik doğrulama yanlış.

  </Accordion>
  <Accordion title="2. Bağlama ve kimlik doğrulama korkulukları daha katı">
    ```bash
    openclaw config get gateway.bind
    openclaw config get gateway.auth.mode
    openclaw config get gateway.auth.token
    openclaw gateway status
    openclaw logs --follow
    ```

    Kontrol edilecekler:

    - Loopback olmayan bağlamalar (`lan`, `tailnet`, `custom`) geçerli bir gateway kimlik doğrulama yolu gerektirir: paylaşılan token/parola kimlik doğrulaması veya doğru yapılandırılmış loopback olmayan bir `trusted-proxy` dağıtımı.
    - `gateway.token` gibi eski anahtarlar `gateway.auth.token` yerine geçmez.

    Yaygın imzalar:

    - `refusing to bind gateway ... without auth` → geçerli bir gateway kimlik doğrulama yolu olmadan loopback dışı bağlama.
    - Çalışma zamanı çalışırken `Connectivity probe: failed` → gateway canlı ama geçerli auth/url ile erişilemiyor.

  </Accordion>
  <Accordion title="3. Eşleştirme ve device kimliği durumu değişti">
    ```bash
    openclaw devices list
    openclaw pairing list --channel <channel> [--account <id>]
    openclaw logs --follow
    openclaw doctor
    ```

    Kontrol edilecekler:

    - Dashboard/Nodes için bekleyen device onayları.
    - İlke veya kimlik değişikliklerinden sonra bekleyen DM eşleştirme onayları.

    Yaygın imzalar:

    - `device identity required` → device kimlik doğrulaması karşılanmamış.
    - `pairing required` → gönderen/device onaylanmalı.

  </Accordion>
</AccordionGroup>

Denetimlerden sonra hizmet yapılandırması ve çalışma zamanı hâlâ uyuşmuyorsa, hizmet meta verilerini aynı profil/durum dizininden yeniden kurun:

```bash
openclaw gateway install --force
openclaw gateway restart
```

İlgili:

- [Kimlik Doğrulama](/tr/gateway/authentication)
- [Arka plan exec ve süreç aracı](/tr/gateway/background-process)
- [Gateway sahipli eşleştirme](/tr/gateway/pairing)

## İlgili

- [Doctor](/tr/gateway/doctor)
- [SSS](/tr/help/faq)
- [Gateway runbook](/tr/gateway)
