---
read_when:
    - Sorun giderme merkezi, daha ayrıntılı tanılama için sizi buraya yönlendirdi
    - Kesin komutlar içeren kararlı, belirti tabanlı operasyon rehberi bölümlerine ihtiyacınız var
sidebarTitle: Troubleshooting
summary: Gateway, kanallar, otomasyon, düğümler ve tarayıcı için derinlemesine sorun giderme kılavuzu
title: Sorun giderme
x-i18n:
    generated_at: "2026-05-03T21:34:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 19422615706ca09124b19dd3e21b2c13391d6daf2b1807e01b4ce2047d02e522
    source_path: gateway/troubleshooting.md
    workflow: 16
---

Bu sayfa ayrıntılı çalıştırma kitabıdır. Önce hızlı triyaj akışını istiyorsanız [/help/troubleshooting](/tr/help/troubleshooting) sayfasından başlayın.

## Komut basamağı

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
- `openclaw channels status --probe`, hesap başına canlı aktarım durumunu ve desteklendiği yerlerde `works` veya `audit ok` gibi probe/denetim sonuçlarını gösterir.

## Bölünmüş kurulumlar ve daha yeni yapılandırma koruması

Bunu, bir Gateway hizmeti güncellemeden sonra beklenmedik şekilde durduğunda veya günlükler bir `openclaw` ikilisinin `openclaw.json` dosyasını en son yazan sürümden daha eski olduğunu gösterdiğinde kullanın.

OpenClaw, yapılandırma yazma işlemlerini `meta.lastTouchedVersion` ile damgalar. Salt okunur komutlar daha yeni bir OpenClaw tarafından yazılmış bir yapılandırmayı hâlâ inceleyebilir, ancak işlem ve hizmet mutasyonları daha eski bir ikiliden devam etmeyi reddeder. Engellenen eylemler arasında Gateway hizmetini başlatma, durdurma, yeniden başlatma, kaldırma, zorunlu hizmet yeniden kurulumu, hizmet modu Gateway başlatması ve `gateway --force` port temizliği bulunur.

```bash
which openclaw
openclaw --version
openclaw gateway status --deep
openclaw config get meta.lastTouchedVersion
```

<Steps>
  <Step title="PATH'i düzelt">
    `PATH` öğesini `openclaw` daha yeni kuruluma çözümlenecek şekilde düzeltin, ardından eylemi yeniden çalıştırın.
  </Step>
  <Step title="Gateway hizmetini yeniden kur">
    Amaçlanan Gateway hizmetini daha yeni kurulumdan yeniden kurun:

    ```bash
    openclaw gateway install --force
    openclaw gateway restart
    ```

  </Step>
  <Step title="Eski sarmalayıcıları kaldır">
    Hâlâ eski bir `openclaw` ikilisine işaret eden bayat sistem paketi veya eski sarmalayıcı girdilerini kaldırın.
  </Step>
</Steps>

<Warning>
Yalnızca bilinçli sürüm düşürme veya acil kurtarma için, tek komut için `OPENCLAW_ALLOW_OLDER_BINARY_DESTRUCTIVE_ACTIONS=1` ayarlayın. Normal çalışma için ayarsız bırakın.
</Warning>

## Uzun bağlam için Anthropic 429 ek kullanım gerekli

Bunu, günlükler/hatalar şunu içerdiğinde kullanın: `HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

Şunları arayın:

- Seçilen Anthropic Opus/Sonnet modelinde `params.context1m: true` bulunur.
- Geçerli Anthropic kimlik bilgisi uzun bağlam kullanımı için uygun değildir.
- İstekler yalnızca 1M beta yoluna ihtiyaç duyan uzun oturumlarda/model çalıştırmalarında başarısız olur.

Düzeltme seçenekleri:

<Steps>
  <Step title="context1m'yi devre dışı bırak">
    Normal bağlam penceresine geri dönmek için o modelde `context1m` öğesini devre dışı bırakın.
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

## Yerel OpenAI uyumlu arka uç doğrudan probe kontrollerini geçiyor ama ajan çalıştırmaları başarısız oluyor

Bunu şu durumlarda kullanın:

- `curl ... /v1/models` çalışır
- küçük doğrudan `/v1/chat/completions` çağrıları çalışır
- OpenClaw model çalıştırmaları yalnızca normal ajan dönüşlerinde başarısız olur

```bash
curl http://127.0.0.1:1234/v1/models
curl http://127.0.0.1:1234/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"<id>","messages":[{"role":"user","content":"hi"}],"stream":false}'
openclaw infer model run --model <provider/model> --prompt "hi" --json
openclaw logs --follow
```

Şunları arayın:

- doğrudan küçük çağrılar başarılı olur, ancak OpenClaw çalıştırmaları yalnızca daha büyük istemlerde başarısız olur
- doğrudan `/v1/chat/completions` aynı yalın model kimliğiyle çalışmasına rağmen `model_not_found` veya 404 hataları
- `messages[].content` için dize beklendiğini belirten arka uç hataları
- OpenAI uyumlu yerel arka uçla aralıklı `incomplete turn detected ... stopReason=stop payloads=0` uyarıları
- yalnızca daha büyük istem-token sayıları veya tam ajan çalışma zamanı istemleriyle ortaya çıkan arka uç çökmeleri

<AccordionGroup>
  <Accordion title="Yaygın imzalar">
    - Yerel MLX/vLLM tarzı sunucuda `model_not_found` → `baseUrl` değerinin `/v1` içerdiğini, `/v1/chat/completions` arka uçları için `api` değerinin `"openai-completions"` olduğunu ve `models.providers.<provider>.models[].id` değerinin yalın sağlayıcı-yerel kimlik olduğunu doğrulayın. Bunu sağlayıcı önekiyle bir kez seçin, örneğin `mlx/mlx-community/Qwen3-30B-A3B-6bit`; katalog girdisini `mlx-community/Qwen3-30B-A3B-6bit` olarak tutun.
    - `messages[...].content: invalid type: sequence, expected a string` → arka uç yapılandırılmış Chat Completions içerik parçalarını reddediyor. Düzeltme: `models.providers.<provider>.models[].compat.requiresStringContent: true` ayarlayın.
    - `incomplete turn detected ... stopReason=stop payloads=0` → arka uç Chat Completions isteğini tamamladı ancak o dönüş için kullanıcıya görünür asistan metni döndürmedi. OpenClaw, yeniden oynatması güvenli boş OpenAI uyumlu dönüşleri bir kez yeniden dener; kalıcı hatalar genellikle arka ucun boş/metin olmayan içerik yaydığı veya son yanıt metnini bastırdığı anlamına gelir.
    - doğrudan küçük istekler başarılı olur, ancak OpenClaw ajan çalıştırmaları arka uç/model çökmeleriyle başarısız olur (örneğin bazı `inferrs` derlemelerinde Gemma) → OpenClaw aktarımı muhtemelen zaten doğrudur; arka uç daha büyük ajan çalışma zamanı istem biçiminde başarısız oluyordur.
    - araçlar devre dışı bırakıldıktan sonra hatalar azalır ancak kaybolmaz → araç şemaları baskının bir parçasıydı, ancak kalan sorun hâlâ yukarı akış model/sunucu kapasitesi veya bir arka uç hatasıdır.

  </Accordion>
  <Accordion title="Düzeltme seçenekleri">
    1. Yalnızca dize kabul eden Chat Completions arka uçları için `compat.requiresStringContent: true` ayarlayın.
    2. OpenClaw'ın araç şeması yüzeyini güvenilir şekilde işleyemeyen modeller/arka uçlar için `compat.supportsTools: false` ayarlayın.
    3. Mümkün olduğunda istem baskısını azaltın: daha küçük çalışma alanı önyüklemesi, daha kısa oturum geçmişi, daha hafif yerel model veya daha güçlü uzun bağlam desteğine sahip bir arka uç.
    4. Küçük doğrudan istekler geçmeye devam ederken OpenClaw ajan dönüşleri hâlâ arka uç içinde çöküyorsa, bunu yukarı akış sunucu/model sınırlaması olarak ele alın ve kabul edilen yük biçimiyle orada bir yeniden üretim kaydı açın.
  </Accordion>
</AccordionGroup>

İlgili:

- [Yapılandırma](/tr/gateway/configuration)
- [Yerel modeller](/tr/gateway/local-models)
- [OpenAI uyumlu uç noktalar](/tr/gateway/configuration-reference#openai-compatible-endpoints)

## Yanıt yok

Kanallar çalışır durumdaysa ancak hiçbir şey yanıt vermiyorsa, herhangi bir şeyi yeniden bağlamadan önce yönlendirmeyi ve politikayı kontrol edin.

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

Şunları arayın:

- DM göndericileri için eşleştirme bekliyor.
- Grup bahsi kapılaması (`requireMention`, `mentionPatterns`).
- Kanal/grup izin listesi uyumsuzlukları.

Yaygın imzalar:

- `drop guild message (mention required` → grup iletisi bahse kadar yok sayılır.
- `pairing request` → gönderenin onaya ihtiyacı var.
- `blocked` / `allowlist` → gönderen/kanal politika tarafından filtrelendi.

İlgili:

- [Kanal sorun giderme](/tr/channels/troubleshooting)
- [Gruplar](/tr/channels/groups)
- [Eşleştirme](/tr/channels/pairing)

## Pano kontrol UI bağlantısı

Pano/kontrol UI bağlanmadığında URL'yi, kimlik doğrulama modunu ve güvenli bağlam varsayımlarını doğrulayın.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

Şunları arayın:

- Doğru probe URL'si ve pano URL'si.
- İstemci ile Gateway arasında kimlik doğrulama modu/token uyumsuzluğu.
- Cihaz kimliği gerektiği yerde HTTP kullanımı.

<AccordionGroup>
  <Accordion title="Bağlantı / kimlik doğrulama imzaları">
    - `device identity required` → güvenli olmayan bağlam veya eksik cihaz kimlik doğrulaması.
    - `origin not allowed` → tarayıcı `Origin` değeri `gateway.controlUi.allowedOrigins` içinde değil (veya açık bir izin listesi olmadan local loopback olmayan bir tarayıcı origin'inden bağlanıyorsunuz).
    - `device nonce required` / `device nonce mismatch` → istemci, challenge tabanlı cihaz kimlik doğrulama akışını (`connect.challenge` + `device.nonce`) tamamlamıyor.
    - `device signature invalid` / `device signature expired` → istemci, geçerli el sıkışma için yanlış yükü (veya bayat zaman damgasını) imzaladı.
    - `AUTH_TOKEN_MISMATCH` ile `canRetryWithDeviceToken=true` → istemci, önbelleğe alınmış cihaz token'ı ile bir güvenilir yeniden deneme yapabilir.
    - Bu önbelleğe alınmış token yeniden denemesi, eşleştirilmiş cihaz token'ı ile saklanan önbelleğe alınmış kapsam kümesini yeniden kullanır. Açık `deviceToken` / açık `scopes` çağıranları bunun yerine istedikleri kapsam kümesini korur.
    - Bu yeniden deneme yolunun dışında, bağlantı kimlik doğrulama önceliği önce açık paylaşılan token/parola, sonra açık `deviceToken`, sonra saklanan cihaz token'ı, sonra önyükleme token'ıdır.
    - Zaman uyumsuz Tailscale Serve Control UI yolunda, aynı `{scope, ip}` için başarısız girişimler, sınırlayıcı hatayı kaydetmeden önce serileştirilir. Bu nedenle aynı istemciden gelen iki kötü eşzamanlı yeniden deneme, iki düz uyumsuzluk yerine ikinci denemede `retry later` gösterebilir.
    - Tarayıcı origin'li local loopback istemcisinden `too many failed authentication attempts (retry later)` → aynı normalleştirilmiş `Origin` kaynaklı tekrarlanan hatalar geçici olarak kilitlenir; başka bir localhost origin'i ayrı bir kova kullanır.
    - bu yeniden denemeden sonra tekrarlanan `unauthorized` → paylaşılan token/cihaz token'ı sapması; token yapılandırmasını yenileyin ve gerekiyorsa cihaz token'ını yeniden onaylayın/döndürün.
    - `gateway connect failed:` → yanlış ana makine/port/url hedefi.

  </Accordion>
</AccordionGroup>

### Kimlik doğrulama ayrıntı kodları hızlı haritası

Sonraki eylemi seçmek için başarısız `connect` yanıtındaki `error.details.code` değerini kullanın:

| Ayrıntı kodu                  | Anlam                                                                                                                                                                                      | Önerilen eylem                                                                                                                                                                                                                                                                       |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`         | İstemci gerekli paylaşılan token'ı göndermedi.                                                                                                                                                 | İstemcide token'ı yapıştırın/ayarlayın ve yeniden deneyin. Pano yolları için: `openclaw config get gateway.auth.token` ardından Control UI ayarlarına yapıştırın.                                                                                                                                              |
| `AUTH_TOKEN_MISMATCH`        | Paylaşılan token Gateway kimlik doğrulama token'ı ile eşleşmedi.                                                                                                                                               | `canRetryWithDeviceToken=true` ise, güvenilir bir yeniden denemeye izin verin. Önbelleğe alınmış token yeniden denemeleri, depolanan onaylı kapsamları yeniden kullanır; açık `deviceToken` / `scopes` çağıranlar istenen kapsamları korur. Hâlâ başarısız oluyorsa [token sapması kurtarma kontrol listesini](/tr/cli/devices#token-drift-recovery-checklist) çalıştırın. |
| `AUTH_DEVICE_TOKEN_MISMATCH` | Önbelleğe alınmış cihaz başına token güncel değil veya iptal edilmiş.                                                                                                                                                 | [Cihazlar CLI](/tr/cli/devices) kullanarak cihaz token'ını döndürün/yeniden onaylayın, ardından yeniden bağlanın.                                                                                                                                                                                                        |
| `PAIRING_REQUIRED`           | Cihaz kimliğinin onaylanması gerekiyor. `not-paired`, `scope-upgrade`, `role-upgrade` veya `metadata-upgrade` için `error.details.reason` değerini kontrol edin ve varsa `requestId` / `remediationHint` kullanın. | Bekleyen isteği onaylayın: `openclaw devices list` ardından `openclaw devices approve <requestId>`. Kapsam/rol yükseltmeleri, istenen erişimi gözden geçirdikten sonra aynı akışı kullanır.                                                                                                               |

<Note>
Paylaşılan Gateway token'ı/parolası ile kimliği doğrulanan doğrudan loopback arka uç RPC'leri, CLI'nin eşleştirilmiş cihaz kapsamı temel değerine bağlı olmamalıdır. Alt ajanlar veya diğer dahili çağrılar hâlâ `scope-upgrade` ile başarısız oluyorsa, çağıranın `client.id: "gateway-client"` ve `client.mode: "backend"` kullandığını ve açık bir `deviceIdentity` veya cihaz token'ı zorlamadığını doğrulayın.
</Note>

Cihaz kimlik doğrulaması v2 geçiş kontrolü:

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

Günlükler nonce/imza hataları gösteriyorsa, bağlanan istemciyi güncelleyin ve doğrulayın:

<Steps>
  <Step title="connect.challenge için bekleyin">
    İstemci, Gateway tarafından verilen `connect.challenge` için bekler.
  </Step>
  <Step title="Payload'u imzalayın">
    İstemci, challenge'a bağlı payload'u imzalar.
  </Step>
  <Step title="Cihaz nonce değerini gönderin">
    İstemci, aynı challenge nonce değeriyle `connect.params.device.nonce` gönderir.
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
- [Güvenilir proxy kimlik doğrulaması](/tr/gateway/trusted-proxy-auth)

## Gateway hizmeti çalışmıyor

Bunu, hizmet kurulu olduğu hâlde süreç ayakta kalmadığında kullanın.

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
  <Accordion title="Yaygın imzalar">
    - `Gateway start blocked: set gateway.mode=local` veya `existing config is missing gateway.mode` → yerel Gateway modu etkin değil ya da yapılandırma dosyasının üzerine yazıldı ve `gateway.mode` kayboldu. Düzeltme: yapılandırmanızda `gateway.mode="local"` ayarlayın veya beklenen yerel mod yapılandırmasını yeniden damgalamak için `openclaw onboard --mode local` / `openclaw setup` komutunu yeniden çalıştırın. OpenClaw'ı Podman üzerinden çalıştırıyorsanız varsayılan yapılandırma yolu `~/.openclaw/openclaw.json` olur.
    - `refusing to bind gateway ... without auth` → geçerli bir Gateway kimlik doğrulama yolu olmadan non-loopback bağlama (token/parola veya yapılandırılmışsa güvenilir proxy).
    - `another gateway instance is already listening` / `EADDRINUSE` → bağlantı noktası çakışması.
    - `Other gateway-like services detected (best effort)` → güncel olmayan veya paralel launchd/systemd/schtasks birimleri var. Çoğu kurulum makine başına tek Gateway tutmalıdır; birden fazlasına gerçekten ihtiyacınız varsa bağlantı noktalarını + yapılandırma/durum/çalışma alanını yalıtın. Bkz. [/gateway#multiple-gateways-same-host](/tr/gateway#multiple-gateways-same-host).
    - Doctor'dan `System-level OpenClaw gateway service detected` → kullanıcı düzeyi hizmet eksikken bir systemd sistem birimi var. Doctor'ın kullanıcı hizmeti kurmasına izin vermeden önce yinelemeyi kaldırın veya devre dışı bırakın ya da sistem birimi amaçlanan gözetleyiciyse `OPENCLAW_SERVICE_REPAIR_POLICY=external` ayarlayın.
    - `Gateway service port does not match current gateway config` → kurulu gözetleyici hâlâ eski `--port` değerini sabitliyor. `openclaw doctor --fix` veya `openclaw gateway install --force` çalıştırın, ardından Gateway hizmetini yeniden başlatın.

  </Accordion>
</AccordionGroup>

İlgili:

- [Arka plan yürütme ve süreç aracı](/tr/gateway/background-process)
- [Yapılandırma](/tr/gateway/configuration)
- [Doctor](/tr/gateway/doctor)

## Gateway geçersiz yapılandırmayı reddetti

Bunu, Gateway başlangıcı `Invalid config` ile başarısız olduğunda veya sıcak yeniden yükleme günlükleri
geçersiz bir düzenlemeyi atladığını söylediğinde kullanın.

```bash
openclaw logs --follow
openclaw config file
openclaw config validate
openclaw doctor
```

Şunlara bakın:

- `Invalid config at ...`
- `config reload skipped (invalid config): ...`
- `Config write rejected: ...`
- Etkin yapılandırmanın yanında zaman damgalı bir `openclaw.json.rejected.*` dosyası
- `doctor --fix` bozuk bir doğrudan düzenlemeyi onardıysa zaman damgalı bir `openclaw.json.clobbered.*` dosyası

<AccordionGroup>
  <Accordion title="Ne oldu">
    - Yapılandırma başlangıçta, sıcak yeniden yükleme sırasında veya OpenClaw'a ait bir yazma sırasında doğrulamadan geçmedi.
    - Gateway başlangıcı `openclaw.json` dosyasını yeniden yazmak yerine kapalı şekilde başarısız olur.
    - Sıcak yeniden yükleme, geçersiz harici düzenlemeleri atlar ve geçerli çalışma zamanı yapılandırmasını etkin tutar.
    - OpenClaw'a ait yazmalar, geçersiz/yıkıcı payload'ları commit öncesi reddeder ve `.rejected.*` olarak kaydeder.
    - `openclaw doctor --fix` onarımın sahibidir. JSON olmayan önekleri kaldırabilir veya reddedilen payload'u `.clobbered.*` olarak korurken bilinen son iyi kopyayı geri yükleyebilir.

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
    - `.clobbered.*` var → doctor, etkin yapılandırmayı onarırken bozuk bir harici düzenlemeyi korudu.
    - `.rejected.*` var → OpenClaw'a ait bir yapılandırma yazması, commit öncesi şema veya clobber kontrollerinden geçemedi.
    - `Config write rejected:` → yazma, gerekli şekli bırakmaya, dosyayı keskin şekilde küçültmeye veya geçersiz yapılandırmayı kalıcılaştırmaya çalıştı.
    - `config reload skipped (invalid config):` → doğrudan düzenleme doğrulamadan geçemedi ve çalışan Gateway tarafından yok sayıldı.
    - `Invalid config at ...` → başlangıç, Gateway hizmetleri başlamadan önce başarısız oldu.
    - `missing-meta-vs-last-good`, `gateway-mode-missing-vs-last-good` veya `size-drop-vs-last-good:*` → OpenClaw'a ait bir yazma, bilinen son iyi yedekle karşılaştırıldığında alanları veya boyutu kaybettiği için reddedildi.
    - `Config last-known-good promotion skipped` → aday, `***` gibi redakte edilmiş gizli değer yer tutucuları içeriyordu.

  </Accordion>
  <Accordion title="Düzeltme seçenekleri">
    1. Doctor'ın önekli/clobbered yapılandırmayı onarmasına veya bilinen son iyi sürümü geri yüklemesine izin vermek için `openclaw doctor --fix` çalıştırın.
    2. `.clobbered.*` veya `.rejected.*` içinden yalnızca amaçlanan anahtarları kopyalayın, ardından bunları `openclaw config set` veya `config.patch` ile uygulayın.
    3. Yeniden başlatmadan önce `openclaw config validate` çalıştırın.
    4. Elle düzenleme yapıyorsanız değiştirmek istediğiniz kısmi nesneyi değil, tam JSON5 yapılandırmasını koruyun.
  </Accordion>
</AccordionGroup>

İlgili:

- [Yapılandırma](/tr/cli/config)
- [Yapılandırma: sıcak yeniden yükleme](/tr/gateway/configuration#config-hot-reload)
- [Yapılandırma: sıkı doğrulama](/tr/gateway/configuration#strict-validation)
- [Doctor](/tr/gateway/doctor)

## Gateway yoklama uyarıları

Bunu, `openclaw gateway probe` bir şeye ulaştığında ancak yine de bir uyarı bloğu yazdırdığında kullanın.

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

Şunlara bakın:

- JSON çıktısında `warnings[].code` ve `primaryTargetId`.
- Uyarının SSH yedeği, birden çok Gateway, eksik kapsamlar veya çözümlenmemiş kimlik doğrulama referanslarıyla ilgili olup olmadığı.

Yaygın imzalar:

- `SSH tunnel failed to start; falling back to direct probes.` → SSH kurulumu başarısız oldu, ancak komut yine de doğrudan yapılandırılmış/loopback hedefleri denedi.
- `multiple reachable gateways detected` → birden fazla hedef yanıt verdi. Bu genellikle kasıtlı bir çoklu Gateway kurulumu veya güncel olmayan/yinelenen dinleyiciler anlamına gelir.
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → bağlantı çalıştı, ancak ayrıntı RPC kapsamla sınırlı; cihaz kimliğini eşleştirin veya `operator.read` içeren kimlik bilgileri kullanın.
- `Gateway accepted the WebSocket connection, but follow-up read diagnostics failed` → bağlantı çalıştı, ancak tam tanılama RPC seti zaman aşımına uğradı veya başarısız oldu. Bunu tanılaması zayıflamış erişilebilir bir Gateway olarak ele alın; `--json` çıktısında `connect.ok` ve `connect.rpcOk` değerlerini karşılaştırın.
- `Capability: pairing-pending` veya `gateway closed (1008): pairing required` → Gateway yanıt verdi, ancak bu istemcinin normal operatör erişiminden önce hâlâ eşleştirme/onay alması gerekiyor.
- çözümlenmemiş `gateway.auth.*` / `gateway.remote.*` SecretRef uyarı metni → başarısız hedef için bu komut yolunda kimlik doğrulama materyali kullanılamadı.

İlgili:

- [Gateway](/tr/cli/gateway)
- [Aynı ana makinede birden çok Gateway](/tr/gateway#multiple-gateways-same-host)
- [Uzaktan erişim](/tr/gateway/remote)

## Kanal bağlı, mesajlar akmıyor

Kanal durumu bağlıysa ancak mesaj akışı ölmüşse, ilkeye, izinlere ve kanala özel teslim kurallarına odaklanın.

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
- `pairing` / bekleyen onay izleri → gönderen onaylanmamış.
- `missing_scope`, `not_in_channel`, `Forbidden`, `401/403` → kanal kimlik doğrulama/izin sorunu.

İlgili:

- [Kanal sorun giderme](/tr/channels/troubleshooting)
- [Discord](/tr/channels/discord)
- [Telegram](/tr/channels/telegram)
- [WhatsApp](/tr/channels/whatsapp)

## Cron ve heartbeat teslimi

Cron veya heartbeat çalışmadıysa ya da teslim etmediyse önce zamanlayıcı durumunu, ardından teslim hedefini doğrulayın.

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

Şunlara bakın:

- Cron etkin ve sonraki uyanma mevcut.
- İş çalışma geçmişi durumu (`ok`, `skipped`, `error`).
- Heartbeat atlama nedenleri (`quiet-hours`, `requests-in-flight`, `cron-in-progress`, `lanes-busy`, `alerts-disabled`, `empty-heartbeat-file`, `no-tasks-due`).

<AccordionGroup>
  <Accordion title="Yaygın imzalar">
    - `cron: scheduler disabled; jobs will not run automatically` → cron devre dışı.
    - `cron: timer tick failed` → zamanlayıcı tik işlemi başarısız oldu; dosya/günlük/çalışma zamanı hatalarını kontrol edin.
    - `heartbeat skipped` ve `reason=quiet-hours` → etkin saatler penceresinin dışında.
    - `heartbeat skipped` ve `reason=empty-heartbeat-file` → `HEARTBEAT.md` var ancak yalnızca boş satırlar / markdown başlıkları içeriyor, bu yüzden OpenClaw model çağrısını atlar.
    - `heartbeat skipped` ve `reason=no-tasks-due` → `HEARTBEAT.md` bir `tasks:` bloğu içeriyor, ancak bu tikte hiçbir görevin zamanı gelmemiş.
    - `heartbeat: unknown accountId` → heartbeat teslim hedefi için geçersiz hesap kimliği.
    - `heartbeat skipped` ve `reason=dm-blocked` → heartbeat hedefi DM tarzı bir hedefe çözümlendi, ancak `agents.defaults.heartbeat.directPolicy` (veya ajan bazlı geçersiz kılma) `block` olarak ayarlı.

  </Accordion>
</AccordionGroup>

İlgili:

- [Heartbeat](/tr/gateway/heartbeat)
- [Zamanlanmış görevler](/tr/automation/cron-jobs)
- [Zamanlanmış görevler: sorun giderme](/tr/automation/cron-jobs#troubleshooting)

## Node eşleştirildi, araç başarısız

Bir node eşleştirilmişse ancak araçlar başarısız oluyorsa ön plan, izin ve onay durumunu yalıtın.

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

Şunlara bakın:

- Node çevrimiçi ve beklenen yeteneklere sahip.
- Kamera/mikrofon/konum/ekran için işletim sistemi izinleri verilmiş.
- Exec onayları ve izin listesi durumu.

Yaygın imzalar:

- `NODE_BACKGROUND_UNAVAILABLE` → node uygulaması ön planda olmalıdır.
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → işletim sistemi izni eksik.
- `SYSTEM_RUN_DENIED: approval required` → exec onayı bekliyor.
- `SYSTEM_RUN_DENIED: allowlist miss` → komut izin listesi tarafından engellendi.

İlgili:

- [Exec onayları](/tr/tools/exec-approvals)
- [Node sorun giderme](/tr/nodes/troubleshooting)
- [Nodes](/tr/nodes/index)

## Tarayıcı aracı başarısız

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
- Geçerli tarayıcı çalıştırılabilir dosya yolu.
- CDP profiline erişilebilirlik.
- `existing-session` / `user` profilleri için yerel Chrome kullanılabilirliği.

<AccordionGroup>
  <Accordion title="Plugin / çalıştırılabilir dosya imzaları">
    - `unknown command "browser"` veya `unknown command 'browser'` → birlikte gelen tarayıcı plugin'i `plugins.allow` tarafından dışlanmış.
    - `browser.enabled=true` iken tarayıcı aracı eksik / kullanılamıyor → `plugins.allow`, `browser` öğesini dışlıyor; bu yüzden plugin hiç yüklenmedi.
    - `Failed to start Chrome CDP on port` → tarayıcı süreci başlatılamadı.
    - `browser.executablePath not found` → yapılandırılmış yol geçersiz.
    - `browser.cdpUrl must be http(s) or ws(s)` → yapılandırılmış CDP URL'si `file:` veya `ftp:` gibi desteklenmeyen bir şema kullanıyor.
    - `browser.cdpUrl has invalid port` → yapılandırılmış CDP URL'sinde hatalı veya aralık dışında bir bağlantı noktası var.
    - `Playwright is not available in this gateway build; '<feature>' is unsupported.` → mevcut gateway kurulumu çekirdek tarayıcı çalışma zamanı bağımlılığından yoksun; OpenClaw'ı yeniden kurun veya güncelleyin, ardından gateway'i yeniden başlatın. ARIA anlık görüntüleri ve temel sayfa ekran görüntüleri yine de çalışabilir, ancak gezinme, AI anlık görüntüleri, CSS seçici öğe ekran görüntüleri ve PDF dışa aktarma kullanılamaz kalır.

  </Accordion>
  <Accordion title="Chrome MCP / existing-session imzaları">
    - `Could not find DevToolsActivePort for chrome` → Chrome MCP existing-session, seçilen tarayıcı veri dizinine henüz bağlanamadı. Tarayıcı inceleme sayfasını açın, uzaktan hata ayıklamayı etkinleştirin, tarayıcıyı açık tutun, ilk bağlanma istemini onaylayın, sonra yeniden deneyin. Oturum açılmış durum gerekmiyorsa yönetilen `openclaw` profilini tercih edin.
    - `No Chrome tabs found for profile="user"` → Chrome MCP bağlanma profilinde açık yerel Chrome sekmesi yok.
    - `Remote CDP for profile "<name>" is not reachable` → yapılandırılmış uzak CDP uç noktasına gateway ana makinesinden erişilemiyor.
    - `Browser attachOnly is enabled ... not reachable` veya `Browser attachOnly is enabled and CDP websocket ... is not reachable` → yalnızca bağlanma profilinde erişilebilir hedef yok ya da HTTP uç noktası yanıt verdi ancak CDP WebSocket yine de açılamadı.

  </Accordion>
  <Accordion title="Öğe / ekran görüntüsü / yükleme imzaları">
    - `fullPage is not supported for element screenshots` → ekran görüntüsü isteği `--full-page` ile `--ref` veya `--element` öğesini birlikte kullandı.
    - `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → Chrome MCP / `existing-session` ekran görüntüsü çağrıları CSS `--element` değil, sayfa yakalama veya anlık görüntü `--ref` kullanmalıdır.
    - `existing-session file uploads do not support element selectors; use ref/inputRef.` → Chrome MCP yükleme kancaları CSS seçicileri değil, anlık görüntü ref'leri gerektirir.
    - `existing-session file uploads currently support one file at a time.` → Chrome MCP profillerinde çağrı başına bir yükleme gönderin.
    - `existing-session dialog handling does not support timeoutMs.` → Chrome MCP profillerindeki iletişim kutusu kancaları zaman aşımı geçersiz kılmalarını desteklemez.
    - `existing-session type does not support timeoutMs overrides.` → `profile="user"` / Chrome MCP existing-session profillerinde `act:type` için `timeoutMs` değerini atlayın veya özel zaman aşımı gerekiyorsa yönetilen/CDP tarayıcı profili kullanın.
    - `existing-session evaluate does not support timeoutMs overrides.` → `profile="user"` / Chrome MCP existing-session profillerinde `act:evaluate` için `timeoutMs` değerini atlayın veya özel zaman aşımı gerekiyorsa yönetilen/CDP tarayıcı profili kullanın.
    - `response body is not supported for existing-session profiles yet.` → `responsebody` hâlâ yönetilen bir tarayıcı veya ham CDP profili gerektirir.
    - yalnızca bağlanma veya uzak CDP profillerinde eski kalmış görünüm alanı / karanlık mod / yerel ayar / çevrimdışı geçersiz kılmaları → etkin denetim oturumunu kapatmak ve tüm gateway'i yeniden başlatmadan Playwright/CDP emülasyon durumunu serbest bırakmak için `openclaw browser stop --browser-profile <name>` çalıştırın.

  </Accordion>
</AccordionGroup>

İlgili:

- [Tarayıcı (OpenClaw tarafından yönetilen)](/tr/tools/browser)
- [Tarayıcı sorun giderme](/tr/tools/browser-linux-troubleshooting)

## Yükselttiyseniz ve bir şey aniden bozulduysa

Yükseltme sonrası bozulmaların çoğu yapılandırma kayması veya artık uygulanmakta olan daha sıkı varsayılanlardan kaynaklanır.

<AccordionGroup>
  <Accordion title="1. Kimlik doğrulama ve URL geçersiz kılma davranışı değişti">
    ```bash
    openclaw gateway status
    openclaw config get gateway.mode
    openclaw config get gateway.remote.url
    openclaw config get gateway.auth.mode
    ```

    Kontrol edilecekler:

    - `gateway.mode=remote` ise, yerel hizmetiniz sorunsuzken CLI çağrıları uzak hedefe gidiyor olabilir.
    - Açık `--url` çağrıları depolanan kimlik bilgilerine geri dönmez.

    Yaygın imzalar:

    - `gateway connect failed:` → yanlış URL hedefi.
    - `unauthorized` → uç noktaya erişilebiliyor ancak kimlik doğrulama yanlış.

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

    - local loopback dışı bağlamalar (`lan`, `tailnet`, `custom`) geçerli bir gateway kimlik doğrulama yolu gerektirir: paylaşılan token/parola kimlik doğrulaması veya doğru yapılandırılmış local loopback dışı `trusted-proxy` dağıtımı.
    - `gateway.token` gibi eski anahtarlar `gateway.auth.token` yerine geçmez.

    Yaygın imzalar:

    - `refusing to bind gateway ... without auth` → geçerli bir gateway kimlik doğrulama yolu olmadan local loopback dışı bağlama.
    - Çalışma zamanı çalışırken `Connectivity probe: failed` → gateway çalışıyor ancak mevcut kimlik doğrulama/url ile erişilemiyor.

  </Accordion>
  <Accordion title="3. Eşleştirme ve cihaz kimliği durumu değişti">
    ```bash
    openclaw devices list
    openclaw pairing list --channel <channel> [--account <id>]
    openclaw logs --follow
    openclaw doctor
    ```

    Kontrol edilecekler:

    - Pano/nodes için bekleyen cihaz onayları.
    - İlke veya kimlik değişikliklerinden sonra bekleyen DM eşleştirme onayları.

    Yaygın imzalar:

    - `device identity required` → cihaz kimlik doğrulaması sağlanmadı.
    - `pairing required` → gönderen/cihaz onaylanmalıdır.

  </Accordion>
</AccordionGroup>

Hizmet yapılandırması ve çalışma zamanı kontrollerden sonra hâlâ uyuşmuyorsa hizmet meta verilerini aynı profil/durum dizininden yeniden kurun:

```bash
openclaw gateway install --force
openclaw gateway restart
```

İlgili:

- [Kimlik doğrulama](/tr/gateway/authentication)
- [Arka plan exec ve süreç aracı](/tr/gateway/background-process)
- [Gateway sahipli eşleştirme](/tr/gateway/pairing)

## İlgili

- [Doctor](/tr/gateway/doctor)
- [SSS](/tr/help/faq)
- [Gateway runbook](/tr/gateway)
