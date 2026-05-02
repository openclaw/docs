---
read_when:
    - Sorun giderme merkezi, daha derin tanılama için sizi buraya yönlendirdi.
    - Tam komutlar içeren tutarlı, belirti temelli operasyon kılavuzu bölümlerine ihtiyacınız var
sidebarTitle: Troubleshooting
summary: Gateway, kanallar, otomasyon, düğümler ve tarayıcı için ayrıntılı sorun giderme kılavuzu
title: Sorun giderme
x-i18n:
    generated_at: "2026-05-02T08:56:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 815fbbca4d12b4b9c65b1172e07606d0eaf4c64df7fd6ca23a8f8d104b78c2a9
    source_path: gateway/troubleshooting.md
    workflow: 16
---

Bu sayfa ayrıntılı çalışma kılavuzudur. Önce hızlı triyaj akışını istiyorsanız [/help/troubleshooting](/tr/help/troubleshooting) ile başlayın.

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

- `openclaw gateway status`, `Runtime: running`, `Connectivity probe: ok` ve bir `Capability: ...` satırı gösterir.
- `openclaw doctor`, engelleyici yapılandırma/hizmet sorunu bildirmez.
- `openclaw channels status --probe`, hesap bazında canlı aktarım durumunu ve desteklendiği yerlerde `works` veya `audit ok` gibi yoklama/denetim sonuçlarını gösterir.

## Bölünmüş kurulumlar ve daha yeni yapılandırma koruması

Bir Gateway hizmeti güncellemeden sonra beklenmedik şekilde durduğunda veya günlükler bir `openclaw` ikilisinin `openclaw.json` dosyasını en son yazan sürümden daha eski olduğunu gösterdiğinde bunu kullanın.

OpenClaw, yapılandırma yazımlarını `meta.lastTouchedVersion` ile damgalar. Salt okunur komutlar daha yeni bir OpenClaw tarafından yazılmış yapılandırmayı yine inceleyebilir, ancak süreç ve hizmet değişiklikleri daha eski bir ikiliyle devam etmeyi reddeder. Engellenen eylemler arasında Gateway hizmetini başlatma, durdurma, yeniden başlatma, kaldırma, zorunlu hizmet yeniden kurulumu, hizmet modunda Gateway başlatma ve `gateway --force` port temizliği bulunur.

```bash
which openclaw
openclaw --version
openclaw gateway status --deep
openclaw config get meta.lastTouchedVersion
```

<Steps>
  <Step title="PATH'i düzelt">
    `PATH` değerini, `openclaw` daha yeni kuruluma çözümlenecek şekilde düzeltin, ardından eylemi yeniden çalıştırın.
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
Yalnızca bilinçli sürüm düşürme veya acil kurtarma için, tek komut için `OPENCLAW_ALLOW_OLDER_BINARY_DESTRUCTIVE_ACTIONS=1` ayarlayın. Normal çalışmada ayarsız bırakın.
</Warning>

## Uzun bağlam için Anthropic 429 ek kullanım gerekli

Günlükler/hatalar şunu içerdiğinde bunu kullanın: `HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

Şunları arayın:

- Seçilen Anthropic Opus/Sonnet modelinde `params.context1m: true` var.
- Geçerli Anthropic kimlik bilgisi uzun bağlam kullanımı için uygun değil.
- İstekler yalnızca 1M beta yolunu gerektiren uzun oturumlarda/model çalıştırmalarında başarısız oluyor.

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

## Yerel OpenAI uyumlu arka uç doğrudan yoklamaları geçiyor ama agent çalıştırmaları başarısız oluyor

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

Şunları arayın:

- doğrudan küçük çağrılar başarılı oluyor, ancak OpenClaw çalıştırmaları yalnızca daha büyük istemlerde başarısız oluyor
- aynı yalın model kimliğiyle doğrudan `/v1/chat/completions`
  çalışmasına rağmen `model_not_found` veya 404 hataları
- `messages[].content` için dize beklediğini belirten arka uç hataları
- OpenAI uyumlu yerel arka uçla aralıklı `incomplete turn detected ... stopReason=stop payloads=0` uyarıları
- yalnızca daha büyük istem-token sayıları veya tam agent çalışma zamanı istemleriyle görünen arka uç çökmeleri

<AccordionGroup>
  <Accordion title="Yaygın imzalar">
    - Yerel MLX/vLLM tarzı sunucuda `model_not_found` → `baseUrl` değerinin `/v1` içerdiğini, `/v1/chat/completions` arka uçları için `api` değerinin `"openai-completions"` olduğunu ve `models.providers.<provider>.models[].id` değerinin yalın sağlayıcı-yerel kimlik olduğunu doğrulayın. Örneğin `mlx/mlx-community/Qwen3-30B-A3B-6bit` gibi sağlayıcı önekiyle bir kez seçin; katalog girdisini `mlx-community/Qwen3-30B-A3B-6bit` olarak tutun.
    - `messages[...].content: invalid type: sequence, expected a string` → arka uç yapılandırılmış Chat Completions içerik parçalarını reddediyor. Düzeltme: `models.providers.<provider>.models[].compat.requiresStringContent: true` ayarlayın.
    - `incomplete turn detected ... stopReason=stop payloads=0` → arka uç Chat Completions isteğini tamamladı ancak o tur için kullanıcıya görünür assistant metni döndürmedi. OpenClaw, yeniden oynatması güvenli boş OpenAI uyumlu turları bir kez yeniden dener; kalıcı hatalar genellikle arka ucun boş/metin dışı içerik yaydığı veya final-answer metnini bastırdığı anlamına gelir.
    - doğrudan küçük istekler başarılı oluyor, ancak OpenClaw agent çalıştırmaları arka uç/model çökmeleriyle başarısız oluyor (örneğin bazı `inferrs` derlemelerinde Gemma) → OpenClaw aktarımı büyük olasılıkla zaten doğru; arka uç daha büyük agent çalışma zamanı istem biçiminde başarısız oluyor.
    - araçlar devre dışı bırakıldıktan sonra hatalar azalıyor ama kaybolmuyor → araç şemaları baskının bir parçasıydı, ancak kalan sorun hâlâ yukarı akış model/sunucu kapasitesi veya bir arka uç hatasıdır.

  </Accordion>
  <Accordion title="Düzeltme seçenekleri">
    1. Yalnızca dize kabul eden Chat Completions arka uçları için `compat.requiresStringContent: true` ayarlayın.
    2. OpenClaw'ın araç şeması yüzeyini güvenilir şekilde işleyemeyen modeller/arka uçlar için `compat.supportsTools: false` ayarlayın.
    3. Mümkün olduğunda istem baskısını azaltın: daha küçük çalışma alanı başlangıcı, daha kısa oturum geçmişi, daha hafif yerel model veya daha güçlü uzun bağlam desteği olan bir arka uç.
    4. Küçük doğrudan istekler geçmeye devam ederken OpenClaw agent turları hâlâ arka uç içinde çöküyorsa, bunu yukarı akış sunucu/model sınırlaması olarak ele alın ve kabul edilen yük biçimiyle orada yeniden üretim bildirin.
  </Accordion>
</AccordionGroup>

İlgili:

- [Yapılandırma](/tr/gateway/configuration)
- [Yerel modeller](/tr/gateway/local-models)
- [OpenAI uyumlu uç noktalar](/tr/gateway/configuration-reference#openai-compatible-endpoints)

## Yanıt yok

Kanallar ayaktaysa ama hiçbir şey yanıt vermiyorsa, herhangi bir şeyi yeniden bağlamadan önce yönlendirme ve politikayı kontrol edin.

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

Şunları arayın:

- DM gönderenleri için eşleştirme beklemede.
- Grup bahsetme geçitleri (`requireMention`, `mentionPatterns`).
- Kanal/grup izin listesi uyumsuzlukları.

Yaygın imzalar:

- `drop guild message (mention required` → grup mesajı bahsetme yapılana kadar yok sayıldı.
- `pairing request` → gönderenin onaya ihtiyacı var.
- `blocked` / `allowlist` → gönderen/kanal politika tarafından filtrelendi.

İlgili:

- [Kanal sorun giderme](/tr/channels/troubleshooting)
- [Gruplar](/tr/channels/groups)
- [Eşleştirme](/tr/channels/pairing)

## Dashboard kontrol UI bağlantısı

Dashboard/kontrol UI bağlanmadığında URL'yi, kimlik doğrulama modunu ve güvenli bağlam varsayımlarını doğrulayın.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

Şunları arayın:

- Doğru yoklama URL'si ve dashboard URL'si.
- İstemci ve Gateway arasında kimlik doğrulama modu/token uyumsuzluğu.
- Cihaz kimliği gerektiği yerde HTTP kullanımı.

<AccordionGroup>
  <Accordion title="Bağlantı / kimlik doğrulama imzaları">
    - `device identity required` → güvenli olmayan bağlam veya eksik cihaz kimlik doğrulaması.
    - `origin not allowed` → tarayıcı `Origin`, `gateway.controlUi.allowedOrigins` içinde değil (veya açık bir izin listesi olmadan local loopback olmayan bir tarayıcı origin'inden bağlanıyorsunuz).
    - `device nonce required` / `device nonce mismatch` → istemci, challenge tabanlı cihaz kimlik doğrulama akışını (`connect.challenge` + `device.nonce`) tamamlamıyor.
    - `device signature invalid` / `device signature expired` → istemci geçerli el sıkışması için yanlış yükü (veya eski zaman damgasını) imzaladı.
    - `AUTH_TOKEN_MISMATCH` ve `canRetryWithDeviceToken=true` → istemci önbelleğe alınmış cihaz token'ıyla güvenilir tek bir yeniden deneme yapabilir.
    - Bu önbelleğe alınmış token yeniden denemesi, eşleştirilmiş cihaz token'ıyla saklanan önbelleğe alınmış kapsam kümesini yeniden kullanır. Açık `deviceToken` / açık `scopes` çağıranları bunun yerine istedikleri kapsam kümesini korur.
    - Bu yeniden deneme yolu dışında, bağlantı kimlik doğrulama önceliği önce açık paylaşılan token/parola, ardından açık `deviceToken`, ardından saklanan cihaz token'ı, ardından bootstrap token'ıdır.
    - Asenkron Tailscale Serve Control UI yolunda, aynı `{scope, ip}` için başarısız girişimler, sınırlayıcı hatayı kaydetmeden önce serileştirilir. Bu nedenle aynı istemciden iki kötü eşzamanlı yeniden deneme, iki düz uyumsuzluk yerine ikinci denemede `retry later` gösterebilir.
    - Tarayıcı-origin local loopback istemcisinden `too many failed authentication attempts (retry later)` → aynı normalize edilmiş `Origin` kaynaklı yinelenen hatalar geçici olarak kilitlenir; başka bir localhost origin'i ayrı bir kova kullanır.
    - bu yeniden denemeden sonra yinelenen `unauthorized` → paylaşılan token/cihaz token'ı kayması; token yapılandırmasını yenileyin ve gerekirse cihaz token'ını yeniden onaylayın/döndürün.
    - `gateway connect failed:` → yanlış host/port/url hedefi.

  </Accordion>
</AccordionGroup>

### Kimlik doğrulama ayrıntı kodları hızlı haritası

Sonraki eylemi seçmek için başarısız `connect` yanıtındaki `error.details.code` değerini kullanın:

| Ayrıntı kodu                | Anlamı                                                                                                                                                                                           | Önerilen eylem                                                                                                                                                                                                                                                                                  |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`         | İstemci gerekli paylaşılan token'ı göndermedi.                                                                                                                                                 | Token'ı istemciye yapıştırın/ayarlayın ve yeniden deneyin. Dashboard yolları için: `openclaw config get gateway.auth.token`, ardından Control UI ayarlarına yapıştırın.                                                                                                                                              |
| `AUTH_TOKEN_MISMATCH`        | Paylaşılan token, gateway kimlik doğrulama token'ıyla eşleşmedi.                                                                                                                                               | `canRetryWithDeviceToken=true` ise, güvenilir bir yeniden denemeye izin verin. Önbelleğe alınmış token yeniden denemeleri depolanmış onaylı kapsamları yeniden kullanır; açık `deviceToken` / `scopes` çağıranları istenen kapsamları korur. Hala başarısız oluyorsa [token drift recovery checklist](/tr/cli/devices#token-drift-recovery-checklist) listesini çalıştırın. |
| `AUTH_DEVICE_TOKEN_MISMATCH` | Önbelleğe alınmış cihaz başına token eski veya iptal edilmiş.                                                                                                                                                 | [devices CLI](/tr/cli/devices) kullanarak cihaz token'ını döndürün/yeniden onaylayın, ardından yeniden bağlanın.                                                                                                                                                                                                        |
| `PAIRING_REQUIRED`           | Cihaz kimliğinin onaylanması gerekiyor. `not-paired`, `scope-upgrade`, `role-upgrade` veya `metadata-upgrade` için `error.details.reason` değerini denetleyin ve varsa `requestId` / `remediationHint` kullanın. | Bekleyen isteği onaylayın: `openclaw devices list`, ardından `openclaw devices approve <requestId>`. Kapsam/rol yükseltmeleri, istenen erişimi inceledikten sonra aynı akışı kullanır.                                                                                                               |

<Note>
Paylaşılan gateway token'ı/parolasıyla kimliği doğrulanan doğrudan loopback backend RPC'leri, CLI'nin eşleştirilmiş cihaz kapsamı temel çizgisine bağlı olmamalıdır. Alt ajanlar veya diğer dahili çağrılar `scope-upgrade` ile hala başarısız oluyorsa, çağıranın `client.id: "gateway-client"` ve `client.mode: "backend"` kullandığını ve açık bir `deviceIdentity` veya cihaz token'ı zorlamadığını doğrulayın.
</Note>

Cihaz kimlik doğrulama v2 geçiş denetimi:

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

Günlüklerde nonce/imza hataları görünüyorsa, bağlanan istemciyi güncelleyin ve doğrulayın:

<Steps>
  <Step title="connect.challenge bekleyin">
    İstemci, gateway tarafından verilen `connect.challenge` için bekler.
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
- `openclaw devices rotate --scope ...`, yalnızca çağıran oturumunun zaten sahip olduğu operatör kapsamlarını isteyebilir

İlgili:

- [Yapılandırma](/tr/gateway/configuration) (gateway kimlik doğrulama modları)
- [Control UI](/tr/web/control-ui)
- [Cihazlar](/tr/cli/devices)
- [Uzaktan erişim](/tr/gateway/remote)
- [Güvenilir proxy kimlik doğrulaması](/tr/gateway/trusted-proxy-auth)

## Gateway hizmeti çalışmıyor

Hizmet yüklü olduğu halde süreç ayakta kalmıyorsa bunu kullanın.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # also scan system-level services
```

Şunları arayın:

- Çıkış ipuçlarıyla `Runtime: stopped`.
- Hizmet yapılandırma uyuşmazlığı (`Config (cli)` ile `Config (service)`).
- Bağlantı noktası/dinleyici çakışmaları.
- `--deep` kullanıldığında ek launchd/systemd/schtasks kurulumları.
- `Other gateway-like services detected (best effort)` temizleme ipuçları.

<AccordionGroup>
  <Accordion title="Yaygın imzalar">
    - `Gateway start blocked: set gateway.mode=local` veya `existing config is missing gateway.mode` → yerel gateway modu etkin değil ya da yapılandırma dosyası ezildi ve `gateway.mode` kayboldu. Düzeltme: yapılandırmanızda `gateway.mode="local"` ayarlayın ya da beklenen yerel mod yapılandırmasını yeniden damgalamak için `openclaw onboard --mode local` / `openclaw setup` komutunu yeniden çalıştırın. OpenClaw'u Podman üzerinden çalıştırıyorsanız varsayılan yapılandırma yolu `~/.openclaw/openclaw.json` olur.
    - `refusing to bind gateway ... without auth` → geçerli bir gateway kimlik doğrulama yolu olmadan local loopback dışı bağlama (token/parola veya yapılandırılmışsa güvenilir proxy).
    - `another gateway instance is already listening` / `EADDRINUSE` → bağlantı noktası çakışması.
    - `Other gateway-like services detected (best effort)` → eski veya paralel launchd/systemd/schtasks birimleri var. Çoğu kurulum makine başına tek gateway tutmalıdır; birden fazla gerekiyorsa bağlantı noktalarını + yapılandırma/durum/çalışma alanını izole edin. Bkz. [/gateway#multiple-gateways-same-host](/tr/gateway#multiple-gateways-same-host).
    - doctor'dan `System-level OpenClaw gateway service detected` → kullanıcı düzeyi hizmet eksikken bir systemd sistem birimi var. Doctor'ın bir kullanıcı hizmeti yüklemesine izin vermeden önce yinelemeyi kaldırın veya devre dışı bırakın ya da sistem birimi amaçlanan supervisor ise `OPENCLAW_SERVICE_REPAIR_POLICY=external` ayarlayın.
    - `Gateway service port does not match current gateway config` → kurulu supervisor hala eski `--port` değerini sabitliyor. `openclaw doctor --fix` veya `openclaw gateway install --force` çalıştırın, ardından gateway hizmetini yeniden başlatın.

  </Accordion>
</AccordionGroup>

İlgili:

- [Arka plan exec ve süreç aracı](/tr/gateway/background-process)
- [Yapılandırma](/tr/gateway/configuration)
- [Doctor](/tr/gateway/doctor)

## Gateway son iyi bilinen yapılandırmayı geri yükledi

Gateway başlatıldığında, ancak günlükler `openclaw.json` dosyasını geri yüklediğini söylüyorsa bunu kullanın.

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
    - Reddedilen yapılandırma başlangıç veya sıcak yeniden yükleme sırasında doğrulamadan geçmedi.
    - OpenClaw, reddedilen payload'u `.clobbered.*` olarak korudu.
    - Etkin yapılandırma, son doğrulanmış son iyi bilinen kopyadan geri yüklendi.
    - Bir sonraki ana ajan turu, reddedilen yapılandırmayı körlemesine yeniden yazmaması için uyarılır.
    - Tüm doğrulama sorunları `plugins.entries.<id>...` altındaysa OpenClaw dosyanın tamamını geri yüklemezdi. Plugin'e yerel hatalar görünür kalırken ilgisiz kullanıcı ayarları etkin yapılandırmada kalır.

  </Accordion>
  <Accordion title="İnceleme ve onarım">
    ```bash
    CONFIG="$(openclaw config file)"
    ls -lt "$CONFIG".clobbered.* "$CONFIG".rejected.* 2>/dev/null | head
    diff -u "$CONFIG" "$(ls -t "$CONFIG".clobbered.* 2>/dev/null | head -n 1)"
    openclaw config validate
    openclaw doctor
    ```
  </Accordion>
  <Accordion title="Yaygın imzalar">
    - `.clobbered.*` var → harici bir doğrudan düzenleme veya başlangıç okuması geri yüklendi.
    - `.rejected.*` var → OpenClaw'a ait bir yapılandırma yazımı, commit öncesinde şema veya ezme denetimlerinde başarısız oldu.
    - `Config write rejected:` → yazma gerekli şekli düşürmeye, dosyayı keskin biçimde küçültmeye veya geçersiz yapılandırmayı kalıcı hale getirmeye çalıştı.
    - `Rejected validation details:` → kurtarma günlüğü veya ana ajan bildirimi, geri yüklemeye neden olan `agents.defaults.execution` veya `gateway.auth.password.source` gibi şema yolunu içerir.
    - `missing-meta-vs-last-good`, `gateway-mode-missing-vs-last-good` veya `size-drop-vs-last-good:*` → başlangıç, son iyi bilinen yedekle karşılaştırıldığında alanları veya boyutu kaybettiği için geçerli dosyayı ezilmiş kabul etti.
    - `Config last-known-good promotion skipped` → aday, `***` gibi redakte edilmiş gizli bilgi yer tutucuları içeriyordu.

  </Accordion>
  <Accordion title="Düzeltme seçenekleri">
    1. Doğruysa geri yüklenen etkin yapılandırmayı koruyun.
    2. `.clobbered.*` veya `.rejected.*` içinden yalnızca amaçlanan anahtarları kopyalayın, ardından bunları `openclaw config set` veya `config.patch` ile uygulayın.
    3. Yeniden başlatmadan önce `openclaw config validate` çalıştırın.
    4. Elle düzenlerseniz yalnızca değiştirmek istediğiniz kısmi nesneyi değil, JSON5 yapılandırmasının tamamını koruyun.
  </Accordion>
</AccordionGroup>

İlgili:

- [Config](/tr/cli/config)
- [Yapılandırma: sıcak yeniden yükleme](/tr/gateway/configuration#config-hot-reload)
- [Yapılandırma: katı doğrulama](/tr/gateway/configuration#strict-validation)
- [Doctor](/tr/gateway/doctor)

## Gateway probe uyarıları

`openclaw gateway probe` bir şeye ulaştığında, ancak yine de bir uyarı bloğu yazdırdığında bunu kullanın.

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

Şunları arayın:

- JSON çıktısında `warnings[].code` ve `primaryTargetId`.
- Uyarının SSH fallback, birden çok gateway, eksik kapsamlar veya çözümlenmemiş kimlik doğrulama referansları hakkında olup olmadığı.

Yaygın imzalar:

- `SSH tunnel failed to start; falling back to direct probes.` → SSH kurulumu başarısız oldu, ancak komut yine de doğrudan yapılandırılmış/local loopback hedeflerini denedi.
- `multiple reachable gateways detected` → birden fazla hedef yanıtladı. Genellikle bu, kasıtlı çoklu gateway kurulumu veya eski/yinelenen dinleyiciler anlamına gelir.
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → bağlantı çalıştı, ancak ayrıntı RPC'si kapsamla sınırlı; cihaz kimliğini eşleştirin veya `operator.read` içeren kimlik bilgileri kullanın.
- `Gateway accepted the WebSocket connection, but follow-up read diagnostics failed` → bağlantı çalıştı, ancak tam tanılama RPC seti zaman aşımına uğradı veya başarısız oldu. Bunu zayıflamış tanılara sahip erişilebilir bir Gateway olarak ele alın; `--json` çıktısında `connect.ok` ve `connect.rpcOk` değerlerini karşılaştırın.
- `Capability: pairing-pending` veya `gateway closed (1008): pairing required` → gateway yanıtladı, ancak bu istemcinin normal operatör erişiminden önce hala eşleştirme/onay alması gerekiyor.
- çözümlenmemiş `gateway.auth.*` / `gateway.remote.*` SecretRef uyarı metni → başarısız hedef için bu komut yolunda kimlik doğrulama materyali kullanılamıyordu.

İlgili:

- [Gateway](/tr/cli/gateway)
- [Aynı ana makinede birden çok gateway](/tr/gateway#multiple-gateways-same-host)
- [Uzaktan erişim](/tr/gateway/remote)

## Kanal bağlı, mesajlar akmıyor

Kanal durumu bağlıysa ancak mesaj akışı ölmüşse, politika, izinler ve kanala özgü teslim kurallarına odaklanın.

```bash
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw status --deep
openclaw logs --follow
openclaw config get channels
```

Şunları arayın:

- DM ilkesi (`pairing`, `allowlist`, `open`, `disabled`).
- Grup allowlist'i ve bahsetme gereksinimleri.
- Eksik kanal API izinleri/kapsamları.

Yaygın belirtiler:

- `mention required` → ileti, grup bahsetme ilkesi tarafından yok sayıldı.
- `pairing` / bekleyen onay izleri → gönderici onaylı değil.
- `missing_scope`, `not_in_channel`, `Forbidden`, `401/403` → kanal kimlik doğrulama/izin sorunu.

İlgili:

- [Kanal sorun giderme](/tr/channels/troubleshooting)
- [Discord](/tr/channels/discord)
- [Telegram](/tr/channels/telegram)
- [WhatsApp](/tr/channels/whatsapp)

## Cron ve Heartbeat teslimi

Cron veya Heartbeat çalışmadıysa ya da teslim etmediyse, önce zamanlayıcı durumunu, sonra teslim hedefini doğrulayın.

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
  <Accordion title="Yaygın belirtiler">
    - `cron: scheduler disabled; jobs will not run automatically` → cron devre dışı.
    - `cron: timer tick failed` → zamanlayıcı tik'i başarısız oldu; dosya/günlük/çalışma zamanı hatalarını denetleyin.
    - `heartbeat skipped` ile `reason=quiet-hours` → etkin saatler aralığının dışında.
    - `heartbeat skipped` ile `reason=empty-heartbeat-file` → `HEARTBEAT.md` var ama yalnızca boş satırlar / markdown başlıkları içeriyor, bu nedenle OpenClaw model çağrısını atlar.
    - `heartbeat skipped` ile `reason=no-tasks-due` → `HEARTBEAT.md` bir `tasks:` bloğu içeriyor, ancak bu tik'te hiçbir görevin zamanı gelmemiş.
    - `heartbeat: unknown accountId` → Heartbeat teslim hedefi için geçersiz hesap kimliği.
    - `heartbeat skipped` ile `reason=dm-blocked` → Heartbeat hedefi, `agents.defaults.heartbeat.directPolicy` (veya ajan başına geçersiz kılma) `block` olarak ayarlanmışken DM tarzı bir hedefe çözümlendi.

  </Accordion>
</AccordionGroup>

İlgili:

- [Heartbeat](/tr/gateway/heartbeat)
- [Zamanlanmış görevler](/tr/automation/cron-jobs)
- [Zamanlanmış görevler: sorun giderme](/tr/automation/cron-jobs#troubleshooting)

## Node eşleşmiş, araç başarısız oluyor

Bir Node eşleşmişse ancak araçlar başarısız oluyorsa, ön plan, izin ve onay durumunu yalıtın.

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

Şunları arayın:

- Beklenen yeteneklerle çevrimiçi Node.
- Kamera/mikrofon/konum/ekran için işletim sistemi izinleri.
- Exec onayları ve allowlist durumu.

Yaygın belirtiler:

- `NODE_BACKGROUND_UNAVAILABLE` → Node uygulaması ön planda olmalıdır.
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → eksik işletim sistemi izni.
- `SYSTEM_RUN_DENIED: approval required` → exec onayı beklemede.
- `SYSTEM_RUN_DENIED: allowlist miss` → komut allowlist tarafından engellendi.

İlgili:

- [Exec onayları](/tr/tools/exec-approvals)
- [Node sorun giderme](/tr/nodes/troubleshooting)
- [Nodes](/tr/nodes/index)

## Tarayıcı aracı başarısız oluyor

Gateway sağlıklı olduğu halde tarayıcı aracı eylemleri başarısız olduğunda bunu kullanın.

```bash
openclaw browser status
openclaw browser start --browser-profile openclaw
openclaw browser profiles
openclaw logs --follow
openclaw doctor
```

Şunları arayın:

- `plugins.allow` ayarlanmış mı ve `browser` içeriyor mu.
- Geçerli tarayıcı yürütülebilir dosya yolu.
- CDP profil erişilebilirliği.
- `existing-session` / `user` profilleri için yerel Chrome kullanılabilirliği.

<AccordionGroup>
  <Accordion title="Plugin / yürütülebilir dosya belirtileri">
    - `unknown command "browser"` veya `unknown command 'browser'` → paketlenmiş tarayıcı Plugin'i `plugins.allow` tarafından dışlanmış.
    - `browser.enabled=true` iken tarayıcı aracı eksik / kullanılamaz → `plugins.allow`, `browser` öğesini dışlıyor, bu yüzden Plugin hiç yüklenmedi.
    - `Failed to start Chrome CDP on port` → tarayıcı işlemi başlatılamadı.
    - `browser.executablePath not found` → yapılandırılmış yol geçersiz.
    - `browser.cdpUrl must be http(s) or ws(s)` → yapılandırılmış CDP URL'si `file:` veya `ftp:` gibi desteklenmeyen bir şema kullanıyor.
    - `browser.cdpUrl has invalid port` → yapılandırılmış CDP URL'sinde hatalı veya aralık dışı bir bağlantı noktası var.
    - `Playwright is not available in this gateway build; '<feature>' is unsupported.` → geçerli Gateway kurulumu çekirdek tarayıcı çalışma zamanı bağımlılığından yoksun; OpenClaw'u yeniden kurun veya güncelleyin, ardından Gateway'i yeniden başlatın. ARIA anlık görüntüleri ve temel sayfa ekran görüntüleri hâlâ çalışabilir, ancak gezinme, AI anlık görüntüleri, CSS seçici öğe ekran görüntüleri ve PDF dışa aktarma kullanılamaz kalır.

  </Accordion>
  <Accordion title="Chrome MCP / mevcut oturum belirtileri">
    - `Could not find DevToolsActivePort for chrome` → Chrome MCP mevcut oturumu, seçilen tarayıcı veri dizinine henüz bağlanamadı. Tarayıcı inceleme sayfasını açın, uzaktan hata ayıklamayı etkinleştirin, tarayıcıyı açık tutun, ilk bağlanma istemini onaylayın, sonra yeniden deneyin. Oturum açmış durum gerekmiyorsa, yönetilen `openclaw` profilini tercih edin.
    - `No Chrome tabs found for profile="user"` → Chrome MCP bağlanma profilinde açık yerel Chrome sekmesi yok.
    - `Remote CDP for profile "<name>" is not reachable` → yapılandırılmış uzak CDP uç noktasına Gateway ana makinesinden erişilemiyor.
    - `Browser attachOnly is enabled ... not reachable` veya `Browser attachOnly is enabled and CDP websocket ... is not reachable` → yalnızca bağlanma profili erişilebilir bir hedefe sahip değil ya da HTTP uç noktası yanıt verdi ama CDP WebSocket hâlâ açılamadı.

  </Accordion>
  <Accordion title="Öğe / ekran görüntüsü / yükleme belirtileri">
    - `fullPage is not supported for element screenshots` → ekran görüntüsü isteği `--full-page` ile `--ref` veya `--element` öğesini birlikte kullandı.
    - `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → Chrome MCP / `existing-session` ekran görüntüsü çağrıları CSS `--element` değil, sayfa yakalama veya anlık görüntü `--ref` kullanmalıdır.
    - `existing-session file uploads do not support element selectors; use ref/inputRef.` → Chrome MCP yükleme hook'ları CSS seçicileri değil, anlık görüntü ref'leri gerektirir.
    - `existing-session file uploads currently support one file at a time.` → Chrome MCP profillerinde çağrı başına bir yükleme gönderin.
    - `existing-session dialog handling does not support timeoutMs.` → Chrome MCP profillerindeki iletişim kutusu hook'ları zaman aşımı geçersiz kılmalarını desteklemez.
    - `existing-session type does not support timeoutMs overrides.` → `profile="user"` / Chrome MCP mevcut oturum profillerinde `act:type` için `timeoutMs` kullanmayın veya özel zaman aşımı gerektiğinde yönetilen/CDP tarayıcı profili kullanın.
    - `existing-session evaluate does not support timeoutMs overrides.` → `profile="user"` / Chrome MCP mevcut oturum profillerinde `act:evaluate` için `timeoutMs` kullanmayın veya özel zaman aşımı gerektiğinde yönetilen/CDP tarayıcı profili kullanın.
    - `response body is not supported for existing-session profiles yet.` → `responsebody` hâlâ yönetilen tarayıcı veya ham CDP profili gerektirir.
    - yalnızca bağlanma veya uzak CDP profillerinde eski görüntü alanı / koyu mod / yerel ayar / çevrimdışı geçersiz kılmaları → tüm Gateway'i yeniden başlatmadan etkin denetim oturumunu kapatmak ve Playwright/CDP öykünme durumunu serbest bırakmak için `openclaw browser stop --browser-profile <name>` çalıştırın.

  </Accordion>
</AccordionGroup>

İlgili:

- [Tarayıcı (OpenClaw tarafından yönetilen)](/tr/tools/browser)
- [Tarayıcı sorun giderme](/tr/tools/browser-linux-troubleshooting)

## Yükselttiyseniz ve bir şey aniden bozulduysa

Yükseltme sonrası bozulmaların çoğu yapılandırma sapması veya artık zorlanan daha katı varsayılanlardır.

<AccordionGroup>
  <Accordion title="1. Kimlik doğrulama ve URL geçersiz kılma davranışı değişti">
    ```bash
    openclaw gateway status
    openclaw config get gateway.mode
    openclaw config get gateway.remote.url
    openclaw config get gateway.auth.mode
    ```

    Denetlenecekler:

    - `gateway.mode=remote` ise CLI çağrıları, yerel hizmetiniz sorunsuzken uzağı hedefliyor olabilir.
    - Açık `--url` çağrıları saklanan kimlik bilgilerine geri dönmez.

    Yaygın belirtiler:

    - `gateway connect failed:` → yanlış URL hedefi.
    - `unauthorized` → uç nokta erişilebilir ama kimlik doğrulama yanlış.

  </Accordion>
  <Accordion title="2. Bağlama ve kimlik doğrulama korumaları daha katı">
    ```bash
    openclaw config get gateway.bind
    openclaw config get gateway.auth.mode
    openclaw config get gateway.auth.token
    openclaw gateway status
    openclaw logs --follow
    ```

    Denetlenecekler:

    - loopback dışı bağlamalar (`lan`, `tailnet`, `custom`) geçerli bir Gateway kimlik doğrulama yolu gerektirir: paylaşılan token/parola kimlik doğrulaması veya doğru yapılandırılmış loopback dışı `trusted-proxy` dağıtımı.
    - `gateway.token` gibi eski anahtarlar `gateway.auth.token` yerine geçmez.

    Yaygın belirtiler:

    - `refusing to bind gateway ... without auth` → geçerli bir Gateway kimlik doğrulama yolu olmadan loopback dışı bağlama.
    - Çalışma zamanı çalışırken `Connectivity probe: failed` → Gateway canlı ama geçerli kimlik doğrulama/url ile erişilemez.

  </Accordion>
  <Accordion title="3. Eşleştirme ve cihaz kimliği durumu değişti">
    ```bash
    openclaw devices list
    openclaw pairing list --channel <channel> [--account <id>]
    openclaw logs --follow
    openclaw doctor
    ```

    Denetlenecekler:

    - Dashboard/Node'lar için bekleyen cihaz onayları.
    - İlke veya kimlik değişikliklerinden sonra bekleyen DM eşleştirme onayları.

    Yaygın belirtiler:

    - `device identity required` → cihaz kimlik doğrulaması karşılanmadı.
    - `pairing required` → gönderici/cihaz onaylanmalıdır.

  </Accordion>
</AccordionGroup>

Denetimlerden sonra hizmet yapılandırması ve çalışma zamanı hâlâ uyuşmuyorsa, hizmet meta verilerini aynı profil/durum dizininden yeniden kurun:

```bash
openclaw gateway install --force
openclaw gateway restart
```

İlgili:

- [Kimlik doğrulama](/tr/gateway/authentication)
- [Arka plan exec ve işlem aracı](/tr/gateway/background-process)
- [Gateway sahipli eşleştirme](/tr/gateway/pairing)

## İlgili

- [Doctor](/tr/gateway/doctor)
- [SSS](/tr/help/faq)
- [Gateway çalıştırma kitabı](/tr/gateway)
