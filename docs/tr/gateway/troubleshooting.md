---
read_when:
    - Sorun giderme merkezi, daha ayrıntılı tanılama için sizi buraya yönlendirdi
    - Kesin komutlar içeren, semptom temelli kararlı operasyon kılavuzu bölümlerine ihtiyacınız var.
sidebarTitle: Troubleshooting
summary: Gateway, kanallar, otomasyon, Node'lar ve tarayıcı için derinlemesine sorun giderme çalıştırma kitabı
title: Sorun giderme
x-i18n:
    generated_at: "2026-04-30T09:25:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: 48735a68daa92678867a9cafb3ceeb37063bb91dee8c4c94e185f74eb0296fcb
    source_path: gateway/troubleshooting.md
    workflow: 16
---

Bu sayfa ayrıntılı çalışma kılavuzudur. Önce hızlı triyaj akışını istiyorsanız [/help/troubleshooting](/tr/help/troubleshooting) ile başlayın.

## Komut merdiveni

Bunları önce, bu sırayla çalıştırın:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Beklenen sağlıklı sinyaller:

- `openclaw gateway status`, `Runtime: running`, `Connectivity probe: ok` ve bir `Capability: ...` satırı gösterir.
- `openclaw doctor` engelleyici yapılandırma/hizmet sorunu bildirmez.
- `openclaw channels status --probe`, hesap başına canlı aktarım durumunu ve desteklendiği yerlerde `works` veya `audit ok` gibi yoklama/denetim sonuçlarını gösterir.

## Bölünmüş kurulumlar ve daha yeni yapılandırma koruması

Bunu, bir güncellemeden sonra Gateway hizmeti beklenmedik şekilde durduğunda veya günlükler bir `openclaw` ikilisinin `openclaw.json` dosyasını en son yazan sürümden daha eski olduğunu gösterdiğinde kullanın.

OpenClaw, yapılandırma yazma işlemlerini `meta.lastTouchedVersion` ile damgalar. Salt okunur komutlar daha yeni bir OpenClaw tarafından yazılmış yapılandırmayı yine de inceleyebilir, ancak işlem ve hizmet değişiklikleri daha eski bir ikiliyle devam etmeyi reddeder. Engellenen eylemler arasında Gateway hizmetini başlatma, durdurma, yeniden başlatma, kaldırma, zorunlu hizmet yeniden kurulumu, hizmet modu Gateway başlatma ve `gateway --force` bağlantı noktası temizliği bulunur.

```bash
which openclaw
openclaw --version
openclaw gateway status --deep
openclaw config get meta.lastTouchedVersion
```

<Steps>
  <Step title="PATH'i düzelt">
    `openclaw` daha yeni kuruluma çözümlenecek şekilde `PATH` değerini düzeltin, sonra eylemi yeniden çalıştırın.
  </Step>
  <Step title="Gateway hizmetini yeniden kur">
    Hedeflenen Gateway hizmetini daha yeni kurulumdan yeniden kurun:

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
Yalnızca kasıtlı sürüm düşürme veya acil kurtarma için, tek komutta `OPENCLAW_ALLOW_OLDER_BINARY_DESTRUCTIVE_ACTIONS=1` ayarlayın. Normal kullanımda ayarsız bırakın.
</Warning>

## Uzun bağlam için Anthropic 429 ek kullanım gerekli

Bunu günlükler/hatalar şunu içerdiğinde kullanın: `HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

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
  <Step title="context1m'yi devre dışı bırak">
    Normal bağlam penceresine geri dönmek için o modelde `context1m` değerini devre dışı bırakın.
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
- [Anthropic'ten neden HTTP 429 görüyorum?](/tr/help/faq-first-run#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## Yerel OpenAI uyumlu backend doğrudan yoklamaları geçiyor ancak agent çalıştırmaları başarısız oluyor

Bunu şu durumlarda kullanın:

- `curl ... /v1/models` çalışıyor
- küçük doğrudan `/v1/chat/completions` çağrıları çalışıyor
- OpenClaw model çalıştırmaları yalnızca normal agent turlarında başarısız oluyor

```bash
curl http://127.0.0.1:1234/v1/models
curl http://127.0.0.1:1234/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"<id>","messages":[{"role":"user","content":"hi"}],"stream":false}'
openclaw infer model run --model <provider/model> --prompt "hi" --json
openclaw logs --follow
```

Şunlara bakın:

- doğrudan küçük çağrılar başarılı oluyor, ancak OpenClaw çalıştırmaları yalnızca daha büyük istemlerde başarısız oluyor
- aynı çıplak model kimliğiyle doğrudan `/v1/chat/completions`
  çalışmasına rağmen `model_not_found` veya 404 hataları
- `messages[].content` için dize bekleyen backend hataları
- OpenAI uyumlu yerel backend ile aralıklı `incomplete turn detected ... stopReason=stop payloads=0` uyarıları
- yalnızca daha büyük istem-token sayıları veya tam agent çalışma zamanı istemleriyle ortaya çıkan backend çökmeleri

<AccordionGroup>
  <Accordion title="Yaygın imzalar">
    - Yerel MLX/vLLM tarzı bir sunucuda `model_not_found` → `baseUrl` değerinin `/v1` içerdiğini, `/v1/chat/completions` backend'leri için `api` değerinin `"openai-completions"` olduğunu ve `models.providers.<provider>.models[].id` değerinin çıplak sağlayıcı-yerel kimlik olduğunu doğrulayın. Bunu sağlayıcı önekiyle bir kez seçin, örneğin `mlx/mlx-community/Qwen3-30B-A3B-6bit`; katalog girdisini `mlx-community/Qwen3-30B-A3B-6bit` olarak tutun.
    - `messages[...].content: invalid type: sequence, expected a string` → backend yapılandırılmış Chat Completions içerik parçalarını reddediyor. Düzeltme: `models.providers.<provider>.models[].compat.requiresStringContent: true` ayarlayın.
    - `incomplete turn detected ... stopReason=stop payloads=0` → backend Chat Completions isteğini tamamladı ancak o tur için kullanıcıya görünür asistan metni döndürmedi. OpenClaw, yeniden oynatması güvenli boş OpenAI uyumlu turları bir kez yeniden dener; kalıcı hatalar genellikle backend'in boş/metin dışı içerik yayımladığı veya son yanıt metnini bastırdığı anlamına gelir.
    - doğrudan küçük istekler başarılı oluyor, ancak OpenClaw agent çalıştırmaları backend/model çökmeleriyle başarısız oluyor (örneğin bazı `inferrs` derlemelerinde Gemma) → OpenClaw aktarımı büyük olasılıkla zaten doğru; backend daha büyük agent çalışma zamanı istem biçiminde başarısız oluyor.
    - araçları devre dışı bıraktıktan sonra hatalar azalıyor ama kaybolmuyor → araç şemaları baskının bir parçasıydı, ancak kalan sorun hâlâ upstream model/sunucu kapasitesi veya bir backend hatasıdır.

  </Accordion>
  <Accordion title="Düzeltme seçenekleri">
    1. Yalnızca dize kabul eden Chat Completions backend'leri için `compat.requiresStringContent: true` ayarlayın.
    2. OpenClaw'ın araç şeması yüzeyini güvenilir şekilde işleyemeyen modeller/backend'ler için `compat.supportsTools: false` ayarlayın.
    3. Mümkün olduğunda istem baskısını azaltın: daha küçük çalışma alanı önyüklemesi, daha kısa oturum geçmişi, daha hafif yerel model veya daha güçlü uzun bağlam desteğine sahip bir backend.
    4. Küçük doğrudan istekler geçmeye devam ederken OpenClaw agent turları backend içinde hâlâ çöküyorsa, bunu upstream sunucu/model sınırlaması olarak ele alın ve kabul edilen yük biçimiyle oraya bir yeniden üretim örneği gönderin.
  </Accordion>
</AccordionGroup>

İlgili:

- [Yapılandırma](/tr/gateway/configuration)
- [Yerel modeller](/tr/gateway/local-models)
- [OpenAI uyumlu endpoint'ler](/tr/gateway/configuration-reference#openai-compatible-endpoints)

## Yanıt yok

Kanallar ayakta ancak hiçbir şey yanıt vermiyorsa, herhangi bir şeyi yeniden bağlamadan önce yönlendirmeyi ve ilkeyi kontrol edin.

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

Şunlara bakın:

- DM gönderenleri için eşleştirme beklemede.
- Grup bahsetme kapısı (`requireMention`, `mentionPatterns`).
- Kanal/grup izin listesi uyumsuzlukları.

Yaygın imzalar:

- `drop guild message (mention required` → grup mesajı bahsetme yapılana kadar yok sayılır.
- `pairing request` → gönderenin onaya ihtiyacı var.
- `blocked` / `allowlist` → gönderen/kanal ilke tarafından filtrelendi.

İlgili:

- [Kanal sorun giderme](/tr/channels/troubleshooting)
- [Gruplar](/tr/channels/groups)
- [Eşleştirme](/tr/channels/pairing)

## Pano denetim arayüzü bağlantısı

Pano/denetim arayüzü bağlanmadığında URL, kimlik doğrulama modu ve güvenli bağlam varsayımlarını doğrulayın.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

Şunlara bakın:

- Doğru yoklama URL'si ve pano URL'si.
- İstemci ile Gateway arasında kimlik doğrulama modu/token uyumsuzluğu.
- Cihaz kimliğinin gerekli olduğu yerde HTTP kullanımı.

<AccordionGroup>
  <Accordion title="Bağlantı / kimlik doğrulama imzaları">
    - `device identity required` → güvenli olmayan bağlam veya eksik cihaz kimlik doğrulaması.
    - `origin not allowed` → tarayıcı `Origin` değeri `gateway.controlUi.allowedOrigins` içinde değil (veya açık bir izin listesi olmadan local loopback olmayan bir tarayıcı kaynağından bağlanıyorsunuz).
    - `device nonce required` / `device nonce mismatch` → istemci, sınama tabanlı cihaz kimlik doğrulama akışını tamamlamıyor (`connect.challenge` + `device.nonce`).
    - `device signature invalid` / `device signature expired` → istemci geçerli el sıkışma için yanlış yükü (veya eski zaman damgasını) imzaladı.
    - `AUTH_TOKEN_MISMATCH` ve `canRetryWithDeviceToken=true` → istemci önbelleğe alınmış cihaz token'ıyla güvenilir bir yeniden deneme yapabilir.
    - Bu önbelleğe alınmış token yeniden denemesi, eşleştirilmiş cihaz token'ıyla depolanan önbelleğe alınmış kapsam kümesini yeniden kullanır. Açık `deviceToken` / açık `scopes` çağıranları bunun yerine istenen kapsam kümesini korur.
    - Bu yeniden deneme yolu dışında, bağlantı kimlik doğrulama önceliği önce açık paylaşılan token/parola, sonra açık `deviceToken`, sonra depolanmış cihaz token'ı, sonra önyükleme token'ıdır.
    - Zaman uyumsuz Tailscale Serve Control UI yolunda, aynı `{scope, ip}` için başarısız girişimler, sınırlayıcı hatayı kaydetmeden önce serileştirilir. Bu nedenle aynı istemciden iki kötü eşzamanlı yeniden deneme, iki düz uyumsuzluk yerine ikinci denemede `retry later` gösterebilir.
    - Tarayıcı kaynaklı bir local loopback istemcisinden `too many failed authentication attempts (retry later)` → aynı normalleştirilmiş `Origin` kaynaklı tekrarlanan hatalar geçici olarak kilitlenir; başka bir localhost kaynağı ayrı bir kova kullanır.
    - bu yeniden denemeden sonra tekrarlanan `unauthorized` → paylaşılan token/cihaz token'ı kayması; token yapılandırmasını yenileyin ve gerekirse cihaz token'ını yeniden onaylayın/döndürün.
    - `gateway connect failed:` → yanlış ana makine/bağlantı noktası/url hedefi.

  </Accordion>
</AccordionGroup>

### Kimlik doğrulama ayrıntı kodları hızlı haritası

Sonraki eylemi seçmek için başarısız `connect` yanıtındaki `error.details.code` değerini kullanın:

| Ayrıntı kodu                 | Anlamı                                                                                                                                                                                       | Önerilen eylem                                                                                                                                                                                                                                                                             |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`         | İstemci, gerekli paylaşılan tokenı göndermedi.                                                                                                                                               | İstemcide tokenı yapıştırın/ayarlayın ve yeniden deneyin. Pano yolları için: `openclaw config get gateway.auth.token`, ardından Control UI ayarlarına yapıştırın.                                                                                                                           |
| `AUTH_TOKEN_MISMATCH`        | Paylaşılan token, Gateway kimlik doğrulama tokenıyla eşleşmedi.                                                                                                                              | `canRetryWithDeviceToken=true` ise güvenilen tek bir yeniden denemeye izin verin. Önbelleğe alınmış token yeniden denemeleri, saklanan onaylı kapsamları yeniden kullanır; açık `deviceToken` / `scopes` çağıranları istenen kapsamları korur. Hâlâ başarısız oluyorsa [token kayması kurtarma kontrol listesini](/tr/cli/devices#token-drift-recovery-checklist) çalıştırın. |
| `AUTH_DEVICE_TOKEN_MISMATCH` | Önbelleğe alınmış cihaz başına token eski veya iptal edilmiş.                                                                                                                                | [Cihazlar CLI](/tr/cli/devices) ile cihaz tokenını döndürün/yeniden onaylayın, ardından yeniden bağlanın.                                                                                                                                                                                      |
| `PAIRING_REQUIRED`           | Cihaz kimliğinin onaylanması gerekiyor. `not-paired`, `scope-upgrade`, `role-upgrade` veya `metadata-upgrade` için `error.details.reason` değerini kontrol edin ve varsa `requestId` / `remediationHint` kullanın. | Bekleyen isteği onaylayın: `openclaw devices list`, ardından `openclaw devices approve <requestId>`. Kapsam/rol yükseltmeleri, istenen erişimi inceledikten sonra aynı akışı kullanır.                                                                                                      |

<Note>
Paylaşılan Gateway tokenı/parolasıyla kimliği doğrulanan doğrudan loopback arka uç RPC'leri, CLI'ın eşleştirilmiş cihaz kapsam taban çizgisine bağlı olmamalıdır. Alt ajanlar veya diğer dahili çağrılar hâlâ `scope-upgrade` ile başarısız oluyorsa, çağıranın `client.id: "gateway-client"` ve `client.mode: "backend"` kullandığını ve açık bir `deviceIdentity` ya da cihaz tokenı zorlamadığını doğrulayın.
</Note>

Cihaz kimlik doğrulaması v2 geçiş kontrolü:

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

Günlükler nonce/imza hataları gösteriyorsa, bağlanan istemciyi güncelleyin ve doğrulayın:

<Steps>
  <Step title="connect.challenge bekleyin">
    İstemci, Gateway tarafından verilen `connect.challenge` değerini bekler.
  </Step>
  <Step title="Payload'u imzalayın">
    İstemci, challenge'a bağlı payload'u imzalar.
  </Step>
  <Step title="Cihaz nonce'unu gönderin">
    İstemci, aynı challenge nonce'u ile `connect.params.device.nonce` gönderir.
  </Step>
</Steps>

`openclaw devices rotate` / `revoke` / `remove` beklenmedik şekilde reddedilirse:

- eşleştirilmiş cihaz token oturumları, çağıranda ayrıca `operator.admin` yoksa yalnızca **kendi** cihazını yönetebilir
- `openclaw devices rotate --scope ...` yalnızca çağıran oturumun zaten sahip olduğu operatör kapsamlarını isteyebilir

İlgili:

- [Yapılandırma](/tr/gateway/configuration) (Gateway kimlik doğrulama modları)
- [Control UI](/tr/web/control-ui)
- [Cihazlar](/tr/cli/devices)
- [Uzaktan erişim](/tr/gateway/remote)
- [Güvenilen proxy kimlik doğrulaması](/tr/gateway/trusted-proxy-auth)

## Gateway hizmeti çalışmıyor

Hizmet kuruluysa ancak süreç ayakta kalmıyorsa bunu kullanın.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # sistem düzeyi hizmetleri de tara
```

Şunları arayın:

- Çıkış ipuçlarıyla birlikte `Runtime: stopped`.
- Hizmet yapılandırması uyumsuzluğu (`Config (cli)` ile `Config (service)`).
- Port/dinleyici çakışmaları.
- `--deep` kullanıldığında ek launchd/systemd/schtasks kurulumları.
- `Other gateway-like services detected (best effort)` temizleme ipuçları.

<AccordionGroup>
  <Accordion title="Yaygın imzalar">
    - `Gateway start blocked: set gateway.mode=local` veya `existing config is missing gateway.mode` → yerel Gateway modu etkin değil ya da yapılandırma dosyasının üzerine yazılmış ve `gateway.mode` kaybolmuş. Düzeltme: yapılandırmanızda `gateway.mode="local"` ayarlayın veya beklenen yerel mod yapılandırmasını yeniden damgalamak için `openclaw onboard --mode local` / `openclaw setup` komutunu yeniden çalıştırın. OpenClaw'ı Podman ile çalıştırıyorsanız varsayılan yapılandırma yolu `~/.openclaw/openclaw.json` olur.
    - `refusing to bind gateway ... without auth` → geçerli bir Gateway kimlik doğrulama yolu olmadan loopback dışı bağlama (token/parola veya yapılandırılmışsa güvenilen proxy).
    - `another gateway instance is already listening` / `EADDRINUSE` → port çakışması.
    - `Other gateway-like services detected (best effort)` → eski veya paralel launchd/systemd/schtasks birimleri var. Çoğu kurulum makine başına tek Gateway tutmalıdır; birden fazlasına gerçekten ihtiyacınız varsa portları + yapılandırma/durum/çalışma alanını yalıtın. Bkz. [/gateway#multiple-gateways-same-host](/tr/gateway#multiple-gateways-same-host).
    - Doctor'dan `System-level OpenClaw gateway service detected` → kullanıcı düzeyi hizmet eksikken bir systemd sistem birimi var. Doctor'ın kullanıcı hizmeti kurmasına izin vermeden önce kopyayı kaldırın veya devre dışı bırakın ya da sistem birimi amaçlanan yönetici ise `OPENCLAW_SERVICE_REPAIR_POLICY=external` ayarlayın.
    - `Gateway service port does not match current gateway config` → kurulu yönetici hâlâ eski `--port` değerini sabitliyor. `openclaw doctor --fix` veya `openclaw gateway install --force` çalıştırın, ardından Gateway hizmetini yeniden başlatın.

  </Accordion>
</AccordionGroup>

İlgili:

- [Arka plan yürütme ve süreç aracı](/tr/gateway/background-process)
- [Yapılandırma](/tr/gateway/configuration)
- [Doctor](/tr/gateway/doctor)

## Gateway bilinen son iyi yapılandırmayı geri yükledi

Gateway başlıyorsa ancak günlükler `openclaw.json` dosyasını geri yüklediğini söylüyorsa bunu kullanın.

```bash
openclaw logs --follow
openclaw config file
openclaw config validate
openclaw doctor
```

Şunları arayın:

- `Config auto-restored from last-known-good`
- `gateway: invalid config was restored from last-known-good backup`
- `config reload restored last-known-good config after invalid-config`
- Etkin yapılandırmanın yanında zaman damgalı bir `openclaw.json.clobbered.*` dosyası
- `Config recovery warning` ile başlayan bir ana ajan sistem olayı

<AccordionGroup>
  <Accordion title="Ne oldu">
    - Reddedilen yapılandırma başlatma veya sıcak yeniden yükleme sırasında doğrulanmadı.
    - OpenClaw reddedilen payload'u `.clobbered.*` olarak korudu.
    - Etkin yapılandırma, son doğrulanmış bilinen son iyi kopyadan geri yüklendi.
    - Sonraki ana ajan turu, reddedilen yapılandırmayı körü körüne yeniden yazmaması için uyarılır.
    - Tüm doğrulama sorunları `plugins.entries.<id>...` altındaysa OpenClaw tüm dosyayı geri yüklemezdi. Plugin'e yerel hatalar görünür kalırken ilgisiz kullanıcı ayarları etkin yapılandırmada kalır.

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
    - `.clobbered.*` var → harici doğrudan düzenleme veya başlatma okuması geri yüklendi.
    - `.rejected.*` var → OpenClaw'a ait bir yapılandırma yazımı, commit öncesinde şema veya üzerine yazma denetimlerinde başarısız oldu.
    - `Config write rejected:` → yazma, gerekli şekli düşürmeye, dosyayı keskin biçimde küçültmeye veya geçersiz yapılandırmayı kalıcılaştırmaya çalıştı.
    - `missing-meta-vs-last-good`, `gateway-mode-missing-vs-last-good` veya `size-drop-vs-last-good:*` → başlatma, mevcut dosyayı son bilinen iyi yedeğe kıyasla alanları veya boyutu kaybettiği için üzerine yazılmış olarak ele aldı.
    - `Config last-known-good promotion skipped` → aday, `***` gibi sansürlenmiş gizli yer tutucular içeriyordu.

  </Accordion>
  <Accordion title="Düzeltme seçenekleri">
    1. Doğruysa geri yüklenen etkin yapılandırmayı koruyun.
    2. Yalnızca amaçlanan anahtarları `.clobbered.*` veya `.rejected.*` içinden kopyalayın, ardından `openclaw config set` ya da `config.patch` ile uygulayın.
    3. Yeniden başlatmadan önce `openclaw config validate` çalıştırın.
    4. Elle düzenliyorsanız yalnızca değiştirmek istediğiniz kısmi nesneyi değil, tam JSON5 yapılandırmasını koruyun.
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

Şunları arayın:

- JSON çıktısında `warnings[].code` ve `primaryTargetId`.
- Uyarının SSH geri dönüşü, birden çok Gateway, eksik kapsamlar veya çözümlenmemiş kimlik doğrulama başvuruları hakkında olup olmadığı.

Yaygın imzalar:

- `SSH tunnel failed to start; falling back to direct probes.` → SSH kurulumu başarısız oldu, ancak komut yine de doğrudan yapılandırılmış/loopback hedeflerini denedi.
- `multiple reachable gateways detected` → birden fazla hedef yanıt verdi. Bu genellikle amaçlı bir çoklu Gateway kurulumu veya eski/kopya dinleyiciler anlamına gelir.
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → bağlantı çalıştı, ancak ayrıntı RPC kapsamla sınırlı; cihaz kimliğini eşleştirin veya `operator.read` ile kimlik bilgileri kullanın.
- `Gateway accepted the WebSocket connection, but follow-up read diagnostics failed` → bağlantı çalıştı, ancak tam tanılama RPC seti zaman aşımına uğradı veya başarısız oldu. Bunu zayıflamış tanılamalara sahip erişilebilir bir Gateway olarak ele alın; `--json` çıktısında `connect.ok` ve `connect.rpcOk` değerlerini karşılaştırın.
- `Capability: pairing-pending` veya `gateway closed (1008): pairing required` → Gateway yanıt verdi, ancak bu istemcinin normal operatör erişiminden önce hâlâ eşleştirme/onaya ihtiyacı var.
- çözümlenmemiş `gateway.auth.*` / `gateway.remote.*` SecretRef uyarı metni → başarısız hedef için bu komut yolunda kimlik doğrulama materyali kullanılamadı.

İlgili:

- [Gateway](/tr/cli/gateway)
- [Aynı ana makinede birden çok Gateway](/tr/gateway#multiple-gateways-same-host)
- [Uzaktan erişim](/tr/gateway/remote)

## Kanal bağlı, mesajlar akmıyor

Kanal durumu bağlıysa ancak mesaj akışı durmuşsa, ilkeye, izinlere ve kanala özgü teslim kurallarına odaklanın.

```bash
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw status --deep
openclaw logs --follow
openclaw config get channels
```

Şunları arayın:

- DM ilkesi (`pairing`, `allowlist`, `open`, `disabled`).
- Grup izin listesi ve bahsetme gereksinimleri.
- Eksik kanal API izinleri/kapsamları.

Yaygın imzalar:

- `mention required` → ileti grup bahsetme ilkesi nedeniyle yok sayıldı.
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

Şunlara bakın:

- Cron etkin ve sonraki uyanma mevcut.
- İş çalıştırma geçmişi durumu (`ok`, `skipped`, `error`).
- Heartbeat atlama nedenleri (`quiet-hours`, `requests-in-flight`, `cron-in-progress`, `lanes-busy`, `alerts-disabled`, `empty-heartbeat-file`, `no-tasks-due`).

<AccordionGroup>
  <Accordion title="Yaygın imzalar">
    - `cron: scheduler disabled; jobs will not run automatically` → Cron devre dışı.
    - `cron: timer tick failed` → zamanlayıcı tıkı başarısız oldu; dosya/günlük/çalışma zamanı hatalarını kontrol edin.
    - `heartbeat skipped` ve `reason=quiet-hours` → etkin saatler penceresinin dışında.
    - `heartbeat skipped` ve `reason=empty-heartbeat-file` → `HEARTBEAT.md` var ancak yalnızca boş satırlar / Markdown başlıkları içeriyor; bu yüzden OpenClaw model çağrısını atlar.
    - `heartbeat skipped` ve `reason=no-tasks-due` → `HEARTBEAT.md` bir `tasks:` bloğu içeriyor, ancak bu tıkta hiçbir görevin zamanı gelmemiş.
    - `heartbeat: unknown accountId` → Heartbeat teslim hedefi için geçersiz hesap kimliği.
    - `heartbeat skipped` ve `reason=dm-blocked` → Heartbeat hedefi, `agents.defaults.heartbeat.directPolicy` (veya ajan bazında geçersiz kılma) `block` olarak ayarlanmışken DM tarzı bir hedefe çözümlendi.

  </Accordion>
</AccordionGroup>

İlgili:

- [Heartbeat](/tr/gateway/heartbeat)
- [Zamanlanmış görevler](/tr/automation/cron-jobs)
- [Zamanlanmış görevler: sorun giderme](/tr/automation/cron-jobs#troubleshooting)

## Node eşleştirildi, araç başarısız oluyor

Bir Node eşleştirilmişse ancak araçlar başarısız oluyorsa ön plan, izin ve onay durumunu yalıtın.

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

Şunlara bakın:

- Beklenen yeteneklere sahip çevrimiçi Node.
- Kamera/mikrofon/konum/ekran için işletim sistemi izinleri.
- Exec onayları ve izin listesi durumu.

Yaygın imzalar:

- `NODE_BACKGROUND_UNAVAILABLE` → Node uygulaması ön planda olmalı.
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → işletim sistemi izni eksik.
- `SYSTEM_RUN_DENIED: approval required` → Exec onayı bekliyor.
- `SYSTEM_RUN_DENIED: allowlist miss` → komut izin listesi tarafından engellendi.

İlgili:

- [Exec onayları](/tr/tools/exec-approvals)
- [Node sorun giderme](/tr/nodes/troubleshooting)
- [Node'lar](/tr/nodes/index)

## Tarayıcı aracı başarısız oluyor

Gateway sağlıklı olmasına rağmen tarayıcı aracı eylemleri başarısız olduğunda bunu kullanın.

```bash
openclaw browser status
openclaw browser start --browser-profile openclaw
openclaw browser profiles
openclaw logs --follow
openclaw doctor
```

Şunlara bakın:

- `plugins.allow` ayarlı mı ve `browser` içeriyor mu.
- Geçerli tarayıcı yürütülebilir dosya yolu.
- CDP profil erişilebilirliği.
- `existing-session` / `user` profilleri için yerel Chrome kullanılabilirliği.

<AccordionGroup>
  <Accordion title="Plugin / yürütülebilir dosya imzaları">
    - `unknown command "browser"` veya `unknown command 'browser'` → paketle gelen tarayıcı Plugin'i `plugins.allow` tarafından hariç tutulmuş.
    - `browser.enabled=true` iken tarayıcı aracı eksik / kullanılamıyor → `plugins.allow`, `browser` öğesini hariç tutuyor; bu yüzden Plugin hiç yüklenmedi.
    - `Failed to start Chrome CDP on port` → tarayıcı süreci başlatılamadı.
    - `browser.executablePath not found` → yapılandırılmış yol geçersiz.
    - `browser.cdpUrl must be http(s) or ws(s)` → yapılandırılmış CDP URL'si `file:` veya `ftp:` gibi desteklenmeyen bir şema kullanıyor.
    - `browser.cdpUrl has invalid port` → yapılandırılmış CDP URL'sinde hatalı veya aralık dışında bir port var.
    - `Playwright is not available in this gateway build; '<feature>' is unsupported.` → geçerli Gateway kurulumu, paketle gelen tarayıcı Plugin'inin `playwright-core` çalışma zamanı bağımlılığından yoksun; `openclaw doctor --fix` çalıştırın, ardından Gateway'i yeniden başlatın. ARIA anlık görüntüleri ve temel sayfa ekran görüntüleri çalışmaya devam edebilir, ancak gezinme, AI anlık görüntüleri, CSS seçici öğe ekran görüntüleri ve PDF dışa aktarma kullanılamaz kalır.

  </Accordion>
  <Accordion title="Chrome MCP / mevcut oturum imzaları">
    - `Could not find DevToolsActivePort for chrome` → Chrome MCP mevcut oturumu, seçilen tarayıcı veri dizinine henüz bağlanamadı. Tarayıcı inceleme sayfasını açın, uzaktan hata ayıklamayı etkinleştirin, tarayıcıyı açık tutun, ilk bağlanma istemini onaylayın, ardından yeniden deneyin. Oturum açılmış durum gerekmiyorsa yönetilen `openclaw` profilini tercih edin.
    - `No Chrome tabs found for profile="user"` → Chrome MCP bağlanma profilinde açık yerel Chrome sekmesi yok.
    - `Remote CDP for profile "<name>" is not reachable` → yapılandırılmış uzak CDP uç noktasına Gateway ana makinesinden erişilemiyor.
    - `Browser attachOnly is enabled ... not reachable` veya `Browser attachOnly is enabled and CDP websocket ... is not reachable` → yalnızca bağlanma profilinin erişilebilir hedefi yok ya da HTTP uç noktası yanıt verdi ancak CDP WebSocket yine de açılamadı.

  </Accordion>
  <Accordion title="Öğe / ekran görüntüsü / yükleme imzaları">
    - `fullPage is not supported for element screenshots` → ekran görüntüsü isteği `--full-page` ile `--ref` veya `--element` öğesini birlikte kullandı.
    - `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → Chrome MCP / `existing-session` ekran görüntüsü çağrıları CSS `--element` değil, sayfa yakalama veya anlık görüntü `--ref` kullanmalıdır.
    - `existing-session file uploads do not support element selectors; use ref/inputRef.` → Chrome MCP yükleme kancaları CSS seçicileri değil, anlık görüntü ref'leri gerektirir.
    - `existing-session file uploads currently support one file at a time.` → Chrome MCP profillerinde çağrı başına bir yükleme gönderin.
    - `existing-session dialog handling does not support timeoutMs.` → Chrome MCP profillerindeki iletişim kutusu kancaları zaman aşımı geçersiz kılmalarını desteklemez.
    - `existing-session type does not support timeoutMs overrides.` → `profile="user"` / Chrome MCP mevcut oturum profillerinde `act:type` için `timeoutMs` değerini çıkarın veya özel zaman aşımı gerektiğinde yönetilen/CDP tarayıcı profili kullanın.
    - `existing-session evaluate does not support timeoutMs overrides.` → `profile="user"` / Chrome MCP mevcut oturum profillerinde `act:evaluate` için `timeoutMs` değerini çıkarın veya özel zaman aşımı gerektiğinde yönetilen/CDP tarayıcı profili kullanın.
    - `response body is not supported for existing-session profiles yet.` → `responsebody` hâlâ yönetilen bir tarayıcı veya ham CDP profili gerektirir.
    - yalnızca bağlanma veya uzak CDP profillerinde eski görüntü alanı / koyu mod / yerel ayar / çevrimdışı geçersiz kılmaları → etkin denetim oturumunu kapatmak ve tüm Gateway'i yeniden başlatmadan Playwright/CDP öykünme durumunu serbest bırakmak için `openclaw browser stop --browser-profile <name>` çalıştırın.

  </Accordion>
</AccordionGroup>

İlgili:

- [Tarayıcı (OpenClaw tarafından yönetilen)](/tr/tools/browser)
- [Tarayıcı sorun giderme](/tr/tools/browser-linux-troubleshooting)

## Yükseltme yaptıysanız ve bir şey aniden bozulduysa

Yükseltme sonrası bozulmaların çoğu yapılandırma kayması veya artık zorunlu tutulan daha sıkı varsayılanlardır.

<AccordionGroup>
  <Accordion title="1. Kimlik doğrulama ve URL geçersiz kılma davranışı değişti">
    ```bash
    openclaw gateway status
    openclaw config get gateway.mode
    openclaw config get gateway.remote.url
    openclaw config get gateway.auth.mode
    ```

    Kontrol edilecekler:

    - `gateway.mode=remote` ise yerel hizmetiniz sorunsuzken CLI çağrıları uzağı hedefliyor olabilir.
    - Açık `--url` çağrıları saklanan kimlik bilgilerine geri dönmez.

    Yaygın imzalar:

    - `gateway connect failed:` → yanlış URL hedefi.
    - `unauthorized` → uç nokta erişilebilir ancak kimlik doğrulama yanlış.

  </Accordion>
  <Accordion title="2. Bağlama ve kimlik doğrulama korumaları daha sıkı">
    ```bash
    openclaw config get gateway.bind
    openclaw config get gateway.auth.mode
    openclaw config get gateway.auth.token
    openclaw gateway status
    openclaw logs --follow
    ```

    Kontrol edilecekler:

    - local loopback dışı bağlamalar (`lan`, `tailnet`, `custom`) geçerli bir Gateway kimlik doğrulama yolu gerektirir: paylaşılan belirteç/parola kimlik doğrulaması veya doğru yapılandırılmış local loopback dışı `trusted-proxy` dağıtımı.
    - `gateway.token` gibi eski anahtarlar `gateway.auth.token` yerine geçmez.

    Yaygın imzalar:

    - `refusing to bind gateway ... without auth` → geçerli bir Gateway kimlik doğrulama yolu olmadan local loopback dışı bağlama.
    - çalışma zamanı çalışırken `Connectivity probe: failed` → Gateway çalışıyor ancak geçerli kimlik doğrulama/URL ile erişilemiyor.

  </Accordion>
  <Accordion title="3. Eşleştirme ve cihaz kimliği durumu değişti">
    ```bash
    openclaw devices list
    openclaw pairing list --channel <channel> [--account <id>]
    openclaw logs --follow
    openclaw doctor
    ```

    Kontrol edilecekler:

    - Pano/Node'lar için bekleyen cihaz onayları.
    - İlke veya kimlik değişikliklerinden sonra bekleyen DM eşleştirme onayları.

    Yaygın imzalar:

    - `device identity required` → cihaz kimlik doğrulaması karşılanmadı.
    - `pairing required` → gönderen/cihaz onaylanmalı.

  </Accordion>
</AccordionGroup>

Kontrollerden sonra hizmet yapılandırması ve çalışma zamanı hâlâ uyuşmuyorsa hizmet meta verilerini aynı profil/durum dizininden yeniden yükleyin:

```bash
openclaw gateway install --force
openclaw gateway restart
```

İlgili:

- [Kimlik doğrulama](/tr/gateway/authentication)
- [Arka plan Exec ve süreç aracı](/tr/gateway/background-process)
- [Gateway'in sahip olduğu eşleştirme](/tr/gateway/pairing)

## İlgili

- [Doctor](/tr/gateway/doctor)
- [SSS](/tr/help/faq)
- [Gateway çalışma kılavuzu](/tr/gateway)
