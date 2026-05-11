---
read_when:
    - Sorun giderme merkezi, daha ayrıntılı tanılama için sizi buraya yönlendirdi
    - Tam komutlar içeren kararlı, belirti temelli çalıştırma kılavuzu bölümlerine ihtiyacınız var
sidebarTitle: Troubleshooting
summary: Gateway, kanallar, otomasyon, Node'lar ve tarayıcı için derinlemesine sorun giderme kılavuzu
title: Sorun giderme
x-i18n:
    generated_at: "2026-05-11T20:30:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 146a593493ce265da9a24660e8a9fc2effa25cae16cf00bf77cc1f2fec84275d
    source_path: gateway/troubleshooting.md
    workflow: 16
---

Bu sayfa ayrıntılı operasyon kılavuzudur. Önce hızlı triyaj akışını istiyorsanız [/help/troubleshooting](/tr/help/troubleshooting) ile başlayın.

## Komut sıralaması

Önce bunları bu sırayla çalıştırın:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Beklenen sağlıklı işaretler:

- `openclaw gateway status`, `Runtime: running`, `Connectivity probe: ok` ve bir `Capability: ...` satırı gösterir.
- `openclaw doctor`, engelleyici yapılandırma/hizmet sorunu bildirmez.
- `openclaw channels status --probe`, hesap başına canlı aktarım durumunu ve desteklendiği yerlerde `works` veya `audit ok` gibi yoklama/denetim sonuçlarını gösterir.

## Ayrışmış kurulumlar ve daha yeni yapılandırma koruması

Bunu, bir Gateway hizmeti güncellemeden sonra beklenmedik şekilde durduğunda veya günlükler bir `openclaw` ikilisinin `openclaw.json` dosyasını en son yazan sürümden eski olduğunu gösterdiğinde kullanın.

OpenClaw, yapılandırma yazımlarını `meta.lastTouchedVersion` ile damgalar. Salt okunur komutlar daha yeni bir OpenClaw tarafından yazılmış yapılandırmayı hâlâ inceleyebilir, ancak süreç ve hizmet değişiklikleri daha eski bir ikiliden devam etmeyi reddeder. Engellenen eylemler arasında Gateway hizmetini başlatma, durdurma, yeniden başlatma, kaldırma, zorunlu hizmet yeniden kurulumu, hizmet modunda Gateway başlatma ve `gateway --force` port temizliği bulunur.

```bash
which openclaw
openclaw --version
openclaw gateway status --deep
openclaw config get meta.lastTouchedVersion
```

<Steps>
  <Step title="PATH’i düzelt">
    `PATH` değerini, `openclaw` daha yeni kuruluma çözümlenecek şekilde düzeltin, ardından eylemi yeniden çalıştırın.
  </Step>
  <Step title="Gateway hizmetini yeniden kur">
    Hedeflenen Gateway hizmetini daha yeni kurulumdan yeniden kurun:

    ```bash
    openclaw gateway install --force
    openclaw gateway restart
    ```

  </Step>
  <Step title="Eski sarmalayıcıları kaldır">
    Hâlâ eski bir `openclaw` ikilisine işaret eden eski sistem paketi veya eski sarmalayıcı girişlerini kaldırın.
  </Step>
</Steps>

<Warning>
Yalnızca bilinçli sürüm düşürme veya acil kurtarma için, tek komutta `OPENCLAW_ALLOW_OLDER_BINARY_DESTRUCTIVE_ACTIONS=1` ayarlayın. Normal kullanımda ayarsız bırakın.
</Warning>

## Yol kaçışı olduğu için Skill sembolik bağlantısı atlandı

Bunu günlüklerde şunu gördüğünüzde kullanın:

```text
Skipping escaped skill path outside its configured root: ... reason=symlink-escape
```

OpenClaw, her skill kökünü bir kapsama sınırı olarak değerlendirir. `~/.agents/skills`, `<workspace>/.agents/skills`, `<workspace>/skills` veya `~/.openclaw/skills` altındaki bir sembolik bağlantı, gerçek hedefi bu kökün dışına çözümlendiğinde, hedef açıkça güvenilir olarak işaretlenmedikçe atlanır.

Bağlantıyı inceleyin:

```bash
ls -l ~/.agents/skills/<name>
realpath ~/.agents/skills/<name>
openclaw config get skills.load
```

Hedef kasıtlıysa, hem doğrudan skill kökünü hem de izin verilen sembolik bağlantı hedefini yapılandırın:

```json5
{
  skills: {
    load: {
      extraDirs: ["~/Projects/manager/skills"],
      allowSymlinkTargets: ["~/Projects/manager/skills"],
    },
  },
}
```

Ardından yeni bir oturum başlatın veya Skills izleyicisinin yenilenmesini bekleyin. Çalışan süreç yapılandırma değişikliğinden eskiyse Gateway’i yeniden başlatın.

`~`, `/` veya eşitlenen proje klasörünün tamamı gibi geniş hedefler kullanmayın. `allowSymlinkTargets` kapsamını, güvenilir `SKILL.md` dizinlerini içeren gerçek skill köküyle sınırlı tutun.

İlgili:

- [Skills yapılandırması](/tr/tools/skills-config#symlinked-sibling-repos)
- [Yapılandırma örnekleri](/tr/gateway/configuration-examples#symlinked-sibling-skill-repo)

## Uzun bağlam için Anthropic 429 ek kullanım gerekli

Bunu günlükler/hatalar şunu içerdiğinde kullanın: `HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

Şunları arayın:

- Seçili Anthropic Opus/Sonnet modelinde `params.context1m: true` vardır.
- Geçerli Anthropic kimlik bilgisi uzun bağlam kullanımı için uygun değildir.
- İstekler yalnızca 1M beta yoluna ihtiyaç duyan uzun oturumlarda/model çalıştırmalarında başarısız olur.

Düzeltme seçenekleri:

<Steps>
  <Step title="context1m’yi devre dışı bırak">
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
- [Token kullanımı ve maliyetleri](/tr/reference/token-use)
- [Neden Anthropic’ten HTTP 429 görüyorum?](/tr/help/faq-first-run#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## Yerel OpenAI uyumlu arka uç doğrudan yoklamalardan geçiyor ancak ajan çalıştırmaları başarısız oluyor

Bunu şu durumlarda kullanın:

- `curl ... /v1/models` çalışır
- küçük doğrudan `/v1/chat/completions` çağrıları çalışır
- OpenClaw model çalıştırmaları yalnızca normal ajan turlarında başarısız olur

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
- aynı yalın model id ile doğrudan `/v1/chat/completions` çalışmasına rağmen `model_not_found` veya 404 hataları
- `messages[].content` için dize bekleyen arka uç hataları
- OpenAI uyumlu yerel bir arka uçla aralıklı `incomplete turn detected ... stopReason=stop payloads=0` uyarıları
- yalnızca daha büyük istem-token sayılarında veya tam ajan çalışma zamanı istemlerinde görünen arka uç çökmeleri

<AccordionGroup>
  <Accordion title="Yaygın belirtiler">
    - Yerel MLX/vLLM tarzı bir sunucuda `model_not_found` → `baseUrl` değerinin `/v1` içerdiğini, `/v1/chat/completions` arka uçları için `api` değerinin `"openai-completions"` olduğunu ve `models.providers.<provider>.models[].id` değerinin yalın sağlayıcı-yerel id olduğunu doğrulayın. Bunu sağlayıcı önekiyle bir kez seçin, örneğin `mlx/mlx-community/Qwen3-30B-A3B-6bit`; katalog girdisini `mlx-community/Qwen3-30B-A3B-6bit` olarak tutun.
    - `messages[...].content: invalid type: sequence, expected a string` → arka uç yapılandırılmış Chat Completions içerik parçalarını reddediyor. Düzeltme: `models.providers.<provider>.models[].compat.requiresStringContent: true` ayarlayın.
    - `validation.keys` veya `["role","content"]` gibi izin verilen ileti anahtarları → arka uç Chat Completions iletilerindeki OpenAI tarzı yeniden oynatma meta verisini reddediyor. Düzeltme: `models.providers.<provider>.models[].compat.strictMessageKeys: true` ayarlayın.
    - `incomplete turn detected ... stopReason=stop payloads=0` → arka uç Chat Completions isteğini tamamladı ancak o tur için kullanıcıya görünür asistan metni döndürmedi. OpenClaw, yeniden oynatması güvenli boş OpenAI uyumlu turları bir kez yeniden dener; kalıcı hatalar genellikle arka ucun boş/metin olmayan içerik yaydığı veya son yanıt metnini bastırdığı anlamına gelir.
    - doğrudan küçük istekler başarılı olur, ancak OpenClaw ajan çalıştırmaları arka uç/model çökmeleriyle başarısız olursa (örneğin bazı `inferrs` derlemelerinde Gemma) → OpenClaw aktarımı büyük olasılıkla zaten doğrudur; arka uç daha büyük ajan çalışma zamanı istem biçiminde başarısız oluyordur.
    - araçlar devre dışı bırakıldıktan sonra hatalar azalır ancak kaybolmaz → araç şemaları baskının bir parçasıydı, ancak kalan sorun hâlâ yukarı akış model/sunucu kapasitesi veya arka uç hatasıdır.

  </Accordion>
  <Accordion title="Düzeltme seçenekleri">
    1. Yalnızca dize kabul eden Chat Completions arka uçları için `compat.requiresStringContent: true` ayarlayın.
    2. Her iletide yalnızca `role` ve `content` kabul eden katı Chat Completions arka uçları için `compat.strictMessageKeys: true` ayarlayın.
    3. OpenClaw'ın araç şeması yüzeyini güvenilir biçimde işleyemeyen modeller/arka uçlar için `compat.supportsTools: false` ayarlayın.
    4. Mümkün olan yerlerde istem baskısını azaltın: daha küçük çalışma alanı önyüklemesi, daha kısa oturum geçmişi, daha hafif yerel model veya daha güçlü uzun bağlam desteğine sahip bir arka uç.
    5. Küçük doğrudan istekler geçmeye devam ederken OpenClaw ajan turları hâlâ arka uç içinde çöküyorsa, bunu yukarı akış sunucu/model sınırlaması olarak ele alın ve kabul edilen yük biçimiyle birlikte oraya bir yeniden üretim raporu gönderin.
  </Accordion>
</AccordionGroup>

İlgili:

- [Yapılandırma](/tr/gateway/configuration)
- [Yerel modeller](/tr/gateway/local-models)
- [OpenAI uyumlu uç noktalar](/tr/gateway/configuration-reference#openai-compatible-endpoints)

## Yanıt yok

Kanallar çalışır durumdaysa ancak hiçbir şey yanıt vermiyorsa, herhangi bir şeyi yeniden bağlamadan önce yönlendirme ve ilkeyi kontrol edin.

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

Şunları arayın:

- DM gönderenleri için bekleyen eşleştirme.
- Grup bahsetme kısıtlaması (`requireMention`, `mentionPatterns`).
- Kanal/grup izin listesi uyuşmazlıkları.

Yaygın belirtiler:

- `drop guild message (mention required` → grup iletisi bahsedilene kadar yok sayılır.
- `pairing request` → gönderenin onaya ihtiyacı vardır.
- `blocked` / `allowlist` → gönderen/kanal ilke tarafından filtrelendi.

İlgili:

- [Kanal sorun giderme](/tr/channels/troubleshooting)
- [Gruplar](/tr/channels/groups)
- [Eşleştirme](/tr/channels/pairing)

## Pano denetim kullanıcı arayüzü bağlantısı

Pano/denetim kullanıcı arayüzü bağlanmadığında URL, kimlik doğrulama modu ve güvenli bağlam varsayımlarını doğrulayın.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

Şunları arayın:

- Doğru yoklama URL’si ve pano URL’si.
- İstemci ile Gateway arasında kimlik doğrulama modu/token uyuşmazlığı.
- Cihaz kimliğinin gerekli olduğu yerde HTTP kullanımı.

<AccordionGroup>
  <Accordion title="Bağlanma / kimlik doğrulama belirtileri">
    - `device identity required` → güvenli olmayan bağlam veya eksik cihaz kimlik doğrulaması.
    - `origin not allowed` → tarayıcı `Origin` değeri `gateway.controlUi.allowedOrigins` içinde değil (veya açık izin listesi olmadan loopback olmayan bir tarayıcı kökeninden bağlanıyorsunuz).
    - `device nonce required` / `device nonce mismatch` → istemci, challenge tabanlı cihaz kimlik doğrulama akışını (`connect.challenge` + `device.nonce`) tamamlamıyor.
    - `device signature invalid` / `device signature expired` → istemci, geçerli el sıkışma için yanlış yükü (veya eski zaman damgasını) imzaladı.
    - `AUTH_TOKEN_MISMATCH` ve `canRetryWithDeviceToken=true` → istemci, önbelleğe alınmış cihaz token’ı ile bir güvenilir yeniden deneme yapabilir.
    - Bu önbelleğe alınmış token yeniden denemesi, eşleştirilmiş cihaz token’ıyla saklanan önbelleğe alınmış kapsam kümesini yeniden kullanır. Açık `deviceToken` / açık `scopes` çağıranları ise istenen kapsam kümesini korur.
    - `AUTH_SCOPE_MISMATCH` → cihaz token’ı tanındı, ancak onaylanmış kapsamları bu connect isteğini kapsamıyor; paylaşılan Gateway token’ını döndürmek yerine yeniden eşleştirin veya istenen kapsam sözleşmesini onaylayın.
    - Bu yeniden deneme yolu dışında, connect kimlik doğrulama önceliği önce açık paylaşılan token/parola, ardından açık `deviceToken`, ardından saklanan cihaz token’ı, ardından bootstrap token’dır.
    - Zaman uyumsuz Tailscale Serve Control UI yolunda, aynı `{scope, ip}` için başarısız girişimler, sınırlayıcı hatayı kaydetmeden önce seri hale getirilir. Bu nedenle aynı istemciden iki hatalı eşzamanlı yeniden deneme, iki sade uyuşmazlık yerine ikinci denemede `retry later` gösterebilir.
    - Tarayıcı kökenli loopback istemciden `too many failed authentication attempts (retry later)` → aynı normalize edilmiş `Origin` değerinden gelen tekrarlı hatalar geçici olarak kilitlenir; başka bir localhost kökeni ayrı bir kova kullanır.
    - bu yeniden denemeden sonra tekrarlanan `unauthorized` → paylaşılan token/cihaz token’ı sapması; token yapılandırmasını yenileyin ve gerekirse cihaz token’ını yeniden onaylayın/döndürün.
    - `gateway connect failed:` → yanlış host/port/url hedefi.

  </Accordion>
</AccordionGroup>

### Kimlik doğrulama ayrıntı kodları hızlı haritası

Sonraki eylemi seçmek için başarısız `connect` yanıtındaki `error.details.code` değerini kullanın:

| Ayrıntı kodu                  | Anlam                                                                                                                                                                                      | Önerilen eylem                                                                                                                                                                                                                                                                       |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`         | İstemci gerekli paylaşılan belirteci göndermedi.                                                                                                                                                 | İstemcide belirteci yapıştırın/ayarlayın ve yeniden deneyin. Pano yolları için: `openclaw config get gateway.auth.token`, ardından Denetim UI ayarlarına yapıştırın.                                                                                                                                              |
| `AUTH_TOKEN_MISMATCH`        | Paylaşılan belirteç Gateway kimlik doğrulama belirteciyle eşleşmedi.                                                                                                                                               | `canRetryWithDeviceToken=true` ise bir güvenilir yeniden denemeye izin verin. Önbelleğe alınmış belirteç yeniden denemeleri depolanan onaylı kapsamları yeniden kullanır; açık `deviceToken` / `scopes` çağıranları istenen kapsamları korur. Hâlâ başarısız olursa [belirteç sapması kurtarma kontrol listesini](/tr/cli/devices#token-drift-recovery-checklist) çalıştırın. |
| `AUTH_DEVICE_TOKEN_MISMATCH` | Önbelleğe alınmış cihaz başına belirteç eski veya iptal edilmiş.                                                                                                                                                 | [Cihazlar CLI](/tr/cli/devices) kullanarak cihaz belirtecini döndürün/yeniden onaylayın, ardından yeniden bağlanın.                                                                                                                                                                                                        |
| `AUTH_SCOPE_MISMATCH`        | Cihaz belirteci geçerli, ancak onaylı rolü/kapsamları bu bağlantı isteğini kapsamıyor.                                                                                                       | Cihazı yeniden eşleyin veya istenen kapsam sözleşmesini onaylayın; bunu paylaşılan belirteç sapması olarak değerlendirmeyin.                                                                                                                                                                                     |
| `PAIRING_REQUIRED`           | Cihaz kimliğinin onaylanması gerekiyor. `not-paired`, `scope-upgrade`, `role-upgrade` veya `metadata-upgrade` için `error.details.reason` alanını kontrol edin ve varsa `requestId` / `remediationHint` kullanın. | Bekleyen isteği onaylayın: `openclaw devices list`, ardından `openclaw devices approve <requestId>`. Kapsam/rol yükseltmeleri, istenen erişimi inceledikten sonra aynı akışı kullanır.                                                                                                               |

<Note>
Paylaşılan Gateway belirteci/parolasıyla kimliği doğrulanan doğrudan loopback backend RPC'leri, CLI'ın eşlenmiş cihaz kapsam temel çizgisine bağlı olmamalıdır. Alt aracılar veya diğer dahili çağrılar hâlâ `scope-upgrade` ile başarısız oluyorsa çağıranın `client.id: "gateway-client"` ve `client.mode: "backend"` kullandığını ve açık bir `deviceIdentity` veya cihaz belirteci zorlamadığını doğrulayın.
</Note>

Cihaz kimlik doğrulama v2 geçiş kontrolü:

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

Günlükler nonce/imza hataları gösteriyorsa bağlanan istemciyi güncelleyin ve doğrulayın:

<Steps>
  <Step title="connect.challenge bekleyin">
    İstemci, Gateway tarafından verilen `connect.challenge` öğesini bekler.
  </Step>
  <Step title="Yükü imzalayın">
    İstemci, meydan okumaya bağlı yükü imzalar.
  </Step>
  <Step title="Cihaz nonce değerini gönderin">
    İstemci, aynı meydan okuma nonce değeriyle `connect.params.device.nonce` gönderir.
  </Step>
</Steps>

`openclaw devices rotate` / `revoke` / `remove` beklenmedik şekilde reddedilirse:

- eşlenmiş cihaz belirteci oturumları, çağıranda ayrıca `operator.admin` yoksa yalnızca **kendi** cihazını yönetebilir
- `openclaw devices rotate --scope ...` yalnızca çağıran oturumun zaten sahip olduğu operatör kapsamlarını isteyebilir

İlgili:

- [Yapılandırma](/tr/gateway/configuration) (Gateway kimlik doğrulama modları)
- [Denetim UI](/tr/web/control-ui)
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
openclaw gateway status --deep   # sistem düzeyi hizmetleri de tara
```

Şunlara bakın:

- Çıkış ipuçlarıyla birlikte `Runtime: stopped`.
- Hizmet yapılandırma uyumsuzluğu (`Config (cli)` ile `Config (service)`).
- Bağlantı noktası/dinleyici çakışmaları.
- `--deep` kullanıldığında ek launchd/systemd/schtasks kurulumları.
- `Other gateway-like services detected (best effort)` temizleme ipuçları.

<AccordionGroup>
  <Accordion title="Yaygın imzalar">
    - `Gateway start blocked: set gateway.mode=local` veya `existing config is missing gateway.mode` → yerel Gateway modu etkin değil ya da yapılandırma dosyasının üzerine yazılmış ve `gateway.mode` kaybolmuş. Düzeltme: yapılandırmanızda `gateway.mode="local"` ayarlayın veya beklenen yerel mod yapılandırmasını yeniden damgalamak için `openclaw onboard --mode local` / `openclaw setup` komutunu yeniden çalıştırın. OpenClaw'ı Podman üzerinden çalıştırıyorsanız varsayılan yapılandırma yolu `~/.openclaw/openclaw.json` olur.
    - `refusing to bind gateway ... without auth` → geçerli bir Gateway kimlik doğrulama yolu olmadan loopback dışı bağlama (belirteç/parola veya yapılandırılmışsa güvenilir proxy).
    - `another gateway instance is already listening` / `EADDRINUSE` → bağlantı noktası çakışması.
    - `Other gateway-like services detected (best effort)` → eski veya paralel launchd/systemd/schtasks birimleri var. Çoğu kurulumda makine başına tek Gateway tutulmalıdır; birden fazla gerekiyorsa bağlantı noktalarını + yapılandırma/durum/çalışma alanını yalıtın. Bkz. [/gateway#multiple-gateways-same-host](/tr/gateway#multiple-gateways-same-host).
    - Doctor'dan `System-level OpenClaw gateway service detected` → kullanıcı düzeyi hizmet eksikken bir systemd sistem birimi var. Doctor'ın kullanıcı hizmeti kurmasına izin vermeden önce kopyayı kaldırın veya devre dışı bırakın ya da sistem birimi amaçlanan gözetmen ise `OPENCLAW_SERVICE_REPAIR_POLICY=external` ayarlayın.
    - `Gateway service port does not match current gateway config` → kurulu gözetmen hâlâ eski `--port` değerini sabitliyor. `openclaw doctor --fix` veya `openclaw gateway install --force` çalıştırın, ardından Gateway hizmetini yeniden başlatın.

  </Accordion>
</AccordionGroup>

İlgili:

- [Arka plan exec ve süreç aracı](/tr/gateway/background-process)
- [Yapılandırma](/tr/gateway/configuration)
- [Doctor](/tr/gateway/doctor)

## Gateway geçersiz yapılandırmayı reddetti

Gateway başlatması `Invalid config` ile başarısız olduğunda veya sıcak yeniden yükleme günlükleri
geçersiz bir düzenlemeyi atladığını söylediğinde bunu kullanın.

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
    - Yapılandırma başlatma, sıcak yeniden yükleme veya OpenClaw'a ait bir yazma sırasında doğrulanamadı.
    - Gateway başlatması, `openclaw.json` dosyasını yeniden yazmak yerine kapalı şekilde başarısız olur.
    - Sıcak yeniden yükleme geçersiz harici düzenlemeleri atlar ve geçerli çalışma zamanı yapılandırmasını etkin tutar.
    - OpenClaw'a ait yazmalar, geçersiz/yıkıcı yükleri işlemeden önce reddeder ve `.rejected.*` kaydeder.
    - Onarımın sahibi `openclaw doctor --fix` komutudur. JSON olmayan önekleri kaldırabilir veya reddedilen yükü `.clobbered.*` olarak korurken bilinen son iyi kopyayı geri yükleyebilir.

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
    - `.clobbered.*` var → doctor etkin yapılandırmayı onarırken bozuk bir harici düzenlemeyi korudu.
    - `.rejected.*` var → OpenClaw'a ait bir yapılandırma yazması, işlemeden önce şema veya üzerine yazma denetimlerinde başarısız oldu.
    - `Config write rejected:` → yazma, gerekli şekli düşürmeye, dosyayı keskin biçimde küçültmeye veya geçersiz yapılandırmayı kalıcı hale getirmeye çalıştı.
    - `config reload skipped (invalid config):` → doğrudan düzenleme doğrulamadan geçemedi ve çalışan Gateway tarafından yok sayıldı.
    - `Invalid config at ...` → Gateway hizmetleri önyüklenmeden önce başlatma başarısız oldu.
    - `missing-meta-vs-last-good`, `gateway-mode-missing-vs-last-good` veya `size-drop-vs-last-good:*` → OpenClaw'a ait bir yazma, bilinen son iyi yedekle karşılaştırıldığında alanları veya boyutu kaybettiği için reddedildi.
    - `Config last-known-good promotion skipped` → aday, `***` gibi redakte edilmiş gizli bilgi yer tutucuları içeriyordu.

  </Accordion>
  <Accordion title="Düzeltme seçenekleri">
    1. Doctor'ın önekli/üzerine yazılmış yapılandırmayı onarmasına veya bilinen son iyi kopyayı geri yüklemesine izin vermek için `openclaw doctor --fix` çalıştırın.
    2. `.clobbered.*` veya `.rejected.*` içinden yalnızca amaçlanan anahtarları kopyalayın, ardından bunları `openclaw config set` veya `config.patch` ile uygulayın.
    3. Yeniden başlatmadan önce `openclaw config validate` çalıştırın.
    4. Elle düzenleme yaparsanız değiştirmek istediğiniz kısmi nesneyi değil, tam JSON5 yapılandırmasını koruyun.
  </Accordion>
</AccordionGroup>

İlgili:

- [Config](/tr/cli/config)
- [Yapılandırma: sıcak yeniden yükleme](/tr/gateway/configuration#config-hot-reload)
- [Yapılandırma: katı doğrulama](/tr/gateway/configuration#strict-validation)
- [Doctor](/tr/gateway/doctor)

## Gateway yoklama uyarıları

`openclaw gateway probe` bir şeye ulaştığında, ancak yine de bir uyarı bloğu yazdırdığında bunu kullanın.

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

Şunlara bakın:

- JSON çıktısında `warnings[].code` ve `primaryTargetId`.
- Uyarının SSH yedeği, birden çok Gateway, eksik kapsamlar veya çözümlenmemiş kimlik doğrulama başvuruları hakkında olup olmadığı.

Yaygın imzalar:

- `SSH tunnel failed to start; falling back to direct probes.` → SSH kurulumu başarısız oldu, ancak komut yine de doğrudan yapılandırılmış/loopback hedefleri denedi.
- `multiple reachable gateways detected` → birden fazla hedef yanıt verdi. Bu genellikle amaçlı bir çoklu Gateway kurulumu veya eski/kopya dinleyiciler anlamına gelir.
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → bağlantı çalıştı, ancak ayrıntı RPC kapsamla sınırlı; cihaz kimliğini eşleyin veya `operator.read` içeren kimlik bilgileri kullanın.
- `Gateway accepted the WebSocket connection, but follow-up read diagnostics failed` → bağlantı çalıştı, ancak tam tanılama RPC kümesi zaman aşımına uğradı veya başarısız oldu. Bunu tanılamaları bozulmuş erişilebilir bir Gateway olarak değerlendirin; `--json` çıktısında `connect.ok` ve `connect.rpcOk` değerlerini karşılaştırın.
- `Capability: pairing-pending` veya `gateway closed (1008): pairing required` → Gateway yanıt verdi, ancak bu istemcinin normal operatör erişiminden önce hâlâ eşleme/onay alması gerekiyor.
- çözümlenmemiş `gateway.auth.*` / `gateway.remote.*` SecretRef uyarı metni → başarısız hedef için bu komut yolunda kimlik doğrulama materyali kullanılamıyordu.

İlgili:

- [Gateway](/tr/cli/gateway)
- [Aynı ana bilgisayarda birden çok Gateway](/tr/gateway#multiple-gateways-same-host)
- [Uzaktan erişim](/tr/gateway/remote)

## Kanal bağlı, iletiler akmıyor

Kanal durumu bağlıysa ancak ileti akışı durmuşsa politika, izinler ve kanala özgü teslimat kurallarına odaklanın.

```bash
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw status --deep
openclaw logs --follow
openclaw config get channels
```

Şunlara bakın:

- DM politikası (`pairing`, `allowlist`, `open`, `disabled`).
- Grup izin listesi ve bahsetme gereksinimleri.
- Eksik kanal API izinleri/kapsamları.

Yaygın imzalar:

- `mention required` → ileti, grup bahsetme politikası tarafından yok sayıldı.
- `pairing` / bekleyen onay izleri → gönderen onaylanmamış.
- `missing_scope`, `not_in_channel`, `Forbidden`, `401/403` → kanal kimlik doğrulama/izin sorunu.

İlgili:

- [Kanal sorun giderme](/tr/channels/troubleshooting)
- [Discord](/tr/channels/discord)
- [Telegram](/tr/channels/telegram)
- [WhatsApp](/tr/channels/whatsapp)

## Cron ve heartbeat teslimatı

Cron veya heartbeat çalışmadıysa ya da teslim edilmediyse önce zamanlayıcı durumunu, ardından teslimat hedefini doğrulayın.

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
    - `cron: scheduler disabled; jobs will not run automatically` → cron devre dışı.
    - `cron: timer tick failed` → zamanlayıcı tiklemesi başarısız oldu; dosya/günlük/çalışma zamanı hatalarını kontrol edin.
    - `heartbeat skipped` ile `reason=quiet-hours` → etkin saatler penceresinin dışında.
    - `heartbeat skipped` ile `reason=empty-heartbeat-file` → `HEARTBEAT.md` var ancak yalnızca boş satırlar / markdown başlıkları içeriyor, bu nedenle OpenClaw model çağrısını atlar.
    - `heartbeat skipped` ile `reason=no-tasks-due` → `HEARTBEAT.md` bir `tasks:` bloğu içeriyor, ancak bu tikte görevlerden hiçbirinin zamanı gelmemiş.
    - `heartbeat: unknown accountId` → heartbeat teslimat hedefi için geçersiz hesap kimliği.
    - `heartbeat skipped` ile `reason=dm-blocked` → heartbeat hedefi DM tarzı bir hedefe çözümlendi, ancak `agents.defaults.heartbeat.directPolicy` (veya ajan başına geçersiz kılma) `block` olarak ayarlı.

  </Accordion>
</AccordionGroup>

İlgili:

- [Heartbeat](/tr/gateway/heartbeat)
- [Zamanlanmış görevler](/tr/automation/cron-jobs)
- [Zamanlanmış görevler: sorun giderme](/tr/automation/cron-jobs#troubleshooting)

## Node eşleştirildi, araç başarısız oluyor

Bir node eşleştirildiyse ancak araçlar başarısız oluyorsa ön plan, izin ve onay durumunu yalıtın.

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

Şunlara bakın:

- Beklenen yeteneklerle çevrim içi Node.
- Kamera/mikrofon/konum/ekran için işletim sistemi izinleri.
- Exec onayları ve izin listesi durumu.

Yaygın imzalar:

- `NODE_BACKGROUND_UNAVAILABLE` → node uygulaması ön planda olmalıdır.
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → eksik işletim sistemi izni.
- `SYSTEM_RUN_DENIED: approval required` → exec onayı bekliyor.
- `SYSTEM_RUN_DENIED: allowlist miss` → komut izin listesi tarafından engellendi.

İlgili:

- [Exec onayları](/tr/tools/exec-approvals)
- [Node sorun giderme](/tr/nodes/troubleshooting)
- [Nodes](/tr/nodes/index)

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
  <Accordion title="Plugin / yürütülebilir imzaları">
    - `unknown command "browser"` veya `unknown command 'browser'` → paketlenmiş tarayıcı plugin'i `plugins.allow` tarafından hariç tutulmuş.
    - `browser.enabled=true` iken tarayıcı aracı eksik / kullanılamıyor → `plugins.allow`, `browser` öğesini hariç tutuyor; bu nedenle plugin hiç yüklenmedi.
    - `Failed to start Chrome CDP on port` → tarayıcı işlemi başlatılamadı.
    - `browser.executablePath not found` → yapılandırılmış yol geçersiz.
    - `browser.cdpUrl must be http(s) or ws(s)` → yapılandırılmış CDP URL'si `file:` veya `ftp:` gibi desteklenmeyen bir şema kullanıyor.
    - `browser.cdpUrl has invalid port` → yapılandırılmış CDP URL'sinin bağlantı noktası hatalı veya aralık dışında.
    - `Playwright is not available in this gateway build; '<feature>' is unsupported.` → mevcut gateway kurulumu çekirdek tarayıcı çalışma zamanı bağımlılığından yoksun; OpenClaw'ı yeniden kurun veya güncelleyin, ardından gateway'i yeniden başlatın. ARIA anlık görüntüleri ve temel sayfa ekran görüntüleri hâlâ çalışabilir, ancak gezinme, AI anlık görüntüleri, CSS seçicili öğe ekran görüntüleri ve PDF dışa aktarma kullanılamaz kalır.

  </Accordion>
  <Accordion title="Chrome MCP / mevcut oturum imzaları">
    - `Could not find DevToolsActivePort for chrome` → Chrome MCP mevcut oturumu henüz seçilen tarayıcı veri dizinine bağlanamadı. Tarayıcı inceleme sayfasını açın, uzaktan hata ayıklamayı etkinleştirin, tarayıcıyı açık tutun, ilk bağlanma istemini onaylayın ve tekrar deneyin. Oturum açılmış durum gerekli değilse yönetilen `openclaw` profilini tercih edin.
    - `No Chrome tabs found for profile="user"` → Chrome MCP bağlanma profilinde açık yerel Chrome sekmesi yok.
    - `Remote CDP for profile "<name>" is not reachable` → yapılandırılmış uzak CDP uç noktasına gateway ana bilgisayarından erişilemiyor.
    - `Browser attachOnly is enabled ... not reachable` veya `Browser attachOnly is enabled and CDP websocket ... is not reachable` → yalnızca bağlanma profili erişilebilir hedefe sahip değil ya da HTTP uç noktası yanıt verdi ancak CDP WebSocket yine de açılamadı.

  </Accordion>
  <Accordion title="Öğe / ekran görüntüsü / yükleme imzaları">
    - `fullPage is not supported for element screenshots` → ekran görüntüsü isteği `--full-page` ile `--ref` veya `--element` öğesini karıştırdı.
    - `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → Chrome MCP / `existing-session` ekran görüntüsü çağrıları CSS `--element` değil, sayfa yakalama veya anlık görüntü `--ref` kullanmalıdır.
    - `existing-session file uploads do not support element selectors; use ref/inputRef.` → Chrome MCP yükleme kancaları CSS seçicileri değil, anlık görüntü ref'leri gerektirir.
    - `existing-session file uploads currently support one file at a time.` → Chrome MCP profillerinde çağrı başına bir yükleme gönderin.
    - `existing-session dialog handling does not support timeoutMs.` → Chrome MCP profillerindeki iletişim kutusu kancaları zaman aşımı geçersiz kılmalarını desteklemez.
    - `existing-session type does not support timeoutMs overrides.` → `profile="user"` / Chrome MCP mevcut oturum profillerinde `act:type` için `timeoutMs` değerini atlayın veya özel zaman aşımı gerektiğinde yönetilen/CDP tarayıcı profili kullanın.
    - `existing-session evaluate does not support timeoutMs overrides.` → `profile="user"` / Chrome MCP mevcut oturum profillerinde `act:evaluate` için `timeoutMs` değerini atlayın veya özel zaman aşımı gerektiğinde yönetilen/CDP tarayıcı profili kullanın.
    - `response body is not supported for existing-session profiles yet.` → `responsebody` hâlâ yönetilen bir tarayıcı veya ham CDP profili gerektirir.
    - yalnızca bağlanma veya uzak CDP profillerinde eski görünüm alanı / koyu mod / yerel ayar / çevrim dışı geçersiz kılmaları → etkin kontrol oturumunu kapatmak ve tüm gateway'i yeniden başlatmadan Playwright/CDP öykünme durumunu serbest bırakmak için `openclaw browser stop --browser-profile <name>` çalıştırın.

  </Accordion>
</AccordionGroup>

İlgili:

- [Tarayıcı (OpenClaw yönetimli)](/tr/tools/browser)
- [Tarayıcı sorun giderme](/tr/tools/browser-linux-troubleshooting)

## Yükselttiyseniz ve bir şey aniden bozulduysa

Yükseltme sonrası bozulmaların çoğu yapılandırma sapması veya artık uygulanan daha katı varsayılanlardan kaynaklanır.

<AccordionGroup>
  <Accordion title="1. Kimlik doğrulama ve URL geçersiz kılma davranışı değişti">
    ```bash
    openclaw gateway status
    openclaw config get gateway.mode
    openclaw config get gateway.remote.url
    openclaw config get gateway.auth.mode
    ```

    Kontrol edilecekler:

    - `gateway.mode=remote` ise yerel hizmetiniz iyi durumdayken CLI çağrıları uzak hedefe gidiyor olabilir.
    - Açık `--url` çağrıları saklanan kimlik bilgilerine geri dönmez.

    Yaygın imzalar:

    - `gateway connect failed:` → yanlış URL hedefi.
    - `unauthorized` → uç nokta erişilebilir ancak kimlik doğrulama yanlış.

  </Accordion>
  <Accordion title="2. Bağlama ve kimlik doğrulama korumaları daha katı">
    ```bash
    openclaw config get gateway.bind
    openclaw config get gateway.auth.mode
    openclaw config get gateway.auth.token
    openclaw gateway status
    openclaw logs --follow
    ```

    Kontrol edilecekler:

    - local loopback olmayan bağlamalar (`lan`, `tailnet`, `custom`) geçerli bir gateway kimlik doğrulama yolu gerektirir: paylaşılan token/parola kimlik doğrulaması veya doğru yapılandırılmış local loopback olmayan `trusted-proxy` dağıtımı.
    - `gateway.token` gibi eski anahtarlar `gateway.auth.token` yerine geçmez.

    Yaygın imzalar:

    - `refusing to bind gateway ... without auth` → geçerli bir gateway kimlik doğrulama yolu olmadan local loopback olmayan bağlama.
    - Çalışma zamanı çalışırken `Connectivity probe: failed` → gateway canlı, ancak mevcut kimlik doğrulama/url ile erişilemez.

  </Accordion>
  <Accordion title="3. Eşleştirme ve cihaz kimliği durumu değişti">
    ```bash
    openclaw devices list
    openclaw pairing list --channel <channel> [--account <id>]
    openclaw logs --follow
    openclaw doctor
    ```

    Kontrol edilecekler:

    - Pano/node'lar için bekleyen cihaz onayları.
    - Politika veya kimlik değişikliklerinden sonra bekleyen DM eşleştirme onayları.

    Yaygın imzalar:

    - `device identity required` → cihaz kimlik doğrulaması karşılanmadı.
    - `pairing required` → gönderen/cihaz onaylanmalıdır.

  </Accordion>
</AccordionGroup>

Kontrollerden sonra hizmet yapılandırması ve çalışma zamanı hâlâ uyuşmuyorsa aynı profil/durum dizininden hizmet meta verilerini yeniden kurun:

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
- [Gateway runbook](/tr/gateway)
