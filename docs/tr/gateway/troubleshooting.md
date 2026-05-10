---
read_when:
    - Sorun giderme merkezi, daha derinlemesine tanılama için sizi buraya yönlendirdi.
    - Tam komutlar içeren kararlı, belirti temelli çalıştırma kılavuzu bölümlerine ihtiyacınız var
sidebarTitle: Troubleshooting
summary: Gateway, kanallar, otomasyon, düğümler ve tarayıcı için derinlemesine sorun giderme kılavuzu
title: Sorun giderme
x-i18n:
    generated_at: "2026-05-10T19:39:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 798016211b615242abca327295c76223ff2dfd3d83dc8a08e396d9e65b9efed4
    source_path: gateway/troubleshooting.md
    workflow: 16
---

Bu sayfa derin runbook'tur. Önce hızlı triyaj akışını istiyorsanız [/help/troubleshooting](/tr/help/troubleshooting) adresinden başlayın.

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
- `openclaw channels status --probe`, hesap başına canlı aktarım durumunu ve desteklendiği yerlerde `works` veya `audit ok` gibi yoklama/denetim sonuçlarını gösterir.

## Split brain kurulumlar ve daha yeni yapılandırma koruması

Bunu, bir Gateway hizmeti güncellemeden sonra beklenmedik şekilde durduğunda veya günlükler bir `openclaw` ikilisinin `openclaw.json` dosyasını en son yazan sürümden daha eski olduğunu gösterdiğinde kullanın.

OpenClaw, yapılandırma yazımlarını `meta.lastTouchedVersion` ile damgalar. Salt okunur komutlar daha yeni bir OpenClaw tarafından yazılmış bir yapılandırmayı yine de inceleyebilir, ancak süreç ve hizmet mutasyonları eski bir ikiliden devam etmeyi reddeder. Engellenen eylemler arasında Gateway hizmetini başlatma, durdurma, yeniden başlatma, kaldırma, zorunlu hizmet yeniden kurulumu, hizmet modunda Gateway başlatma ve `gateway --force` port temizliği bulunur.

```bash
which openclaw
openclaw --version
openclaw gateway status --deep
openclaw config get meta.lastTouchedVersion
```

<Steps>
  <Step title="Fix PATH">
    `PATH` değerini, `openclaw` daha yeni kuruluma çözümlenecek şekilde düzeltin, ardından eylemi yeniden çalıştırın.
  </Step>
  <Step title="Reinstall the gateway service">
    Amaçlanan Gateway hizmetini daha yeni kurulumdan yeniden kurun:

    ```bash
    openclaw gateway install --force
    openclaw gateway restart
    ```

  </Step>
  <Step title="Remove stale wrappers">
    Hâlâ eski bir `openclaw` ikilisine işaret eden eski sistem paketi veya eski wrapper girdilerini kaldırın.
  </Step>
</Steps>

<Warning>
Yalnızca kasıtlı sürüm düşürme veya acil kurtarma için, tek komutta `OPENCLAW_ALLOW_OLDER_BINARY_DESTRUCTIVE_ACTIONS=1` ayarını yapın. Normal kullanımda ayarsız bırakın.
</Warning>

## Skill sembolik bağlantısı yol kaçışı olarak atlandı

Bunu, günlükler şunu içerdiğinde kullanın:

```text
Skipping escaped skill path outside its configured root: ... reason=symlink-escape
```

OpenClaw, her skill kökünü bir sınır olarak ele alır. `~/.agents/skills`, `<workspace>/.agents/skills`, `<workspace>/skills` veya `~/.openclaw/skills` altındaki bir sembolik bağlantı, gerçek hedefi açıkça güvenilir olarak belirtilmedikçe bu kökün dışına çözümlendiğinde atlanır.

Bağlantıyı inceleyin:

```bash
ls -l ~/.agents/skills/<name>
realpath ~/.agents/skills/<name>
openclaw config get skills.load
```

Hedef bilinçliyse, hem doğrudan skill kökünü hem de izin verilen sembolik bağlantı hedefini yapılandırın:

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

Ardından yeni bir oturum başlatın veya skills izleyicisinin yenilenmesini bekleyin. Çalışan süreç yapılandırma değişikliğinden önce başladıysa Gateway'i yeniden başlatın.

`~`, `/` veya bütün bir senkronize proje klasörü gibi geniş hedefler kullanmayın. `allowSymlinkTargets` değerini, güvenilir `SKILL.md` dizinlerini içeren gerçek skill köküyle sınırlı tutun.

İlgili:

- [Skills yapılandırması](/tr/tools/skills-config#symlinked-sibling-repos)
- [Yapılandırma örnekleri](/tr/gateway/configuration-examples#symlinked-sibling-skill-repo)

## Uzun bağlam için Anthropic 429 ekstra kullanım gerekli

Bunu, günlükler/hatalar şunu içerdiğinde kullanın: `HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

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
  <Step title="Disable context1m">
    Normal bağlam penceresine geri dönmek için o modelde `context1m` özelliğini devre dışı bırakın.
  </Step>
  <Step title="Use an eligible credential">
    Uzun bağlam istekleri için uygun bir Anthropic kimlik bilgisi kullanın veya bir Anthropic API anahtarına geçin.
  </Step>
  <Step title="Configure fallback models">
    Anthropic uzun bağlam istekleri reddedildiğinde çalıştırmaların devam etmesi için fallback modelleri yapılandırın.
  </Step>
</Steps>

İlgili:

- [Anthropic](/tr/providers/anthropic)
- [Token kullanımı ve maliyetler](/tr/reference/token-use)
- [Anthropic'ten neden HTTP 429 görüyorum?](/tr/help/faq-first-run#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## Yerel OpenAI uyumlu arka uç doğrudan yoklamaları geçiyor ancak agent çalıştırmaları başarısız oluyor

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

- doğrudan küçük çağrılar başarılı olur, ancak OpenClaw çalıştırmaları yalnızca daha büyük prompt'larda başarısız olur
- doğrudan `/v1/chat/completions` aynı çıplak model kimliğiyle çalışmasına rağmen `model_not_found` veya 404 hataları
- `messages[].content` için string beklediğini belirten arka uç hataları
- OpenAI uyumlu yerel arka uçla aralıklı `incomplete turn detected ... stopReason=stop payloads=0` uyarıları
- yalnızca daha büyük prompt-token sayılarıyla veya tam agent runtime prompt'larıyla görünen arka uç çökmeleri

<AccordionGroup>
  <Accordion title="Common signatures">
    - Yerel MLX/vLLM tarzı bir sunucuda `model_not_found` → `baseUrl` değerinin `/v1` içerdiğini, `/v1/chat/completions` arka uçları için `api` değerinin `"openai-completions"` olduğunu ve `models.providers.<provider>.models[].id` değerinin çıplak sağlayıcı-yerel kimlik olduğunu doğrulayın. Sağlayıcı önekiyle bir kez seçin, örneğin `mlx/mlx-community/Qwen3-30B-A3B-6bit`; katalog girdisini `mlx-community/Qwen3-30B-A3B-6bit` olarak tutun.
    - `messages[...].content: invalid type: sequence, expected a string` → arka uç yapılandırılmış Chat Completions içerik parçalarını reddeder. Düzeltme: `models.providers.<provider>.models[].compat.requiresStringContent: true` ayarlayın.
    - `validation.keys` veya `["role","content"]` gibi izin verilen ileti anahtarları → arka uç, Chat Completions iletilerinde OpenAI tarzı yeniden oynatma metadata'sını reddeder. Düzeltme: `models.providers.<provider>.models[].compat.strictMessageKeys: true` ayarlayın.
    - `incomplete turn detected ... stopReason=stop payloads=0` → arka uç Chat Completions isteğini tamamladı, ancak o tur için kullanıcı tarafından görülebilir asistan metni döndürmedi. OpenClaw, yeniden oynatılması güvenli boş OpenAI uyumlu turları bir kez yeniden dener; kalıcı hatalar genellikle arka ucun boş/metin dışı içerik yaydığı veya final-answer metnini bastırdığı anlamına gelir.
    - doğrudan küçük istekler başarılı olur, ancak OpenClaw agent çalıştırmaları arka uç/model çökmeleriyle başarısız olur (örneğin bazı `inferrs` derlemelerinde Gemma) → OpenClaw aktarımı büyük olasılıkla zaten doğrudur; arka uç daha büyük agent-runtime prompt biçiminde başarısız oluyordur.
    - araçlar devre dışı bırakıldıktan sonra hatalar azalır ama kaybolmaz → araç şemaları baskının bir parçasıydı, ancak kalan sorun hâlâ upstream model/sunucu kapasitesi veya bir arka uç hatasıdır.

  </Accordion>
  <Accordion title="Fix options">
    1. Yalnızca string kabul eden Chat Completions arka uçları için `compat.requiresStringContent: true` ayarlayın.
    2. Her iletide yalnızca `role` ve `content` kabul eden katı Chat Completions arka uçları için `compat.strictMessageKeys: true` ayarlayın.
    3. OpenClaw'ın araç şeması yüzeyini güvenilir şekilde işleyemeyen modeller/arka uçlar için `compat.supportsTools: false` ayarlayın.
    4. Mümkün olduğunda prompt baskısını azaltın: daha küçük çalışma alanı bootstrap'i, daha kısa oturum geçmişi, daha hafif yerel model veya daha güçlü uzun bağlam desteği olan bir arka uç.
    5. Küçük doğrudan istekler geçmeye devam ederken OpenClaw agent turları arka uç içinde hâlâ çöküyorsa, bunu upstream sunucu/model sınırlaması olarak ele alın ve kabul edilen payload biçimiyle oraya bir repro açın.
  </Accordion>
</AccordionGroup>

İlgili:

- [Yapılandırma](/tr/gateway/configuration)
- [Yerel modeller](/tr/gateway/local-models)
- [OpenAI uyumlu endpoint'ler](/tr/gateway/configuration-reference#openai-compatible-endpoints)

## Yanıt yok

Kanallar ayaktaysa ancak hiçbir şey yanıtlamıyorsa, herhangi bir şeyi yeniden bağlamadan önce yönlendirmeyi ve politikayı kontrol edin.

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

Şunları arayın:

- DM gönderenleri için bekleyen eşleştirme.
- Grup mention geçidi (`requireMention`, `mentionPatterns`).
- Kanal/grup izin listesi uyumsuzlukları.

Yaygın imzalar:

- `drop guild message (mention required` → grup iletisi mention'a kadar yok sayılır.
- `pairing request` → gönderenin onaya ihtiyacı var.
- `blocked` / `allowlist` → gönderen/kanal politika tarafından filtrelendi.

İlgili:

- [Kanal sorun giderme](/tr/channels/troubleshooting)
- [Gruplar](/tr/channels/groups)
- [Eşleştirme](/tr/channels/pairing)

## Pano denetim UI bağlantısı

Pano/denetim UI bağlanmadığında URL'yi, kimlik doğrulama modunu ve güvenli bağlam varsayımlarını doğrulayın.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

Şunları arayın:

- Doğru yoklama URL'si ve pano URL'si.
- İstemci ve Gateway arasında kimlik doğrulama modu/token uyumsuzluğu.
- Cihaz kimliği gerekli olduğu halde HTTP kullanımı.

<AccordionGroup>
  <Accordion title="Connect / auth signatures">
    - `device identity required` → güvenli olmayan bağlam veya eksik cihaz kimlik doğrulaması.
    - `origin not allowed` → tarayıcı `Origin` değeri `gateway.controlUi.allowedOrigins` içinde değil (veya açık bir izin listesi olmadan local loopback dışı bir tarayıcı origin'inden bağlanıyorsunuz).
    - `device nonce required` / `device nonce mismatch` → istemci, challenge tabanlı cihaz kimlik doğrulama akışını (`connect.challenge` + `device.nonce`) tamamlamıyor.
    - `device signature invalid` / `device signature expired` → istemci geçerli el sıkışma için yanlış payload'ı (veya eski zaman damgasını) imzaladı.
    - `canRetryWithDeviceToken=true` ile `AUTH_TOKEN_MISMATCH` → istemci, önbelleğe alınmış cihaz token'ıyla bir güvenilir yeniden deneme yapabilir.
    - Bu önbelleğe alınmış token yeniden denemesi, eşleştirilmiş cihaz token'ıyla saklanan önbelleğe alınmış kapsam kümesini yeniden kullanır. Açık `deviceToken` / açık `scopes` çağıranlar bunun yerine istedikleri kapsam kümesini korur.
    - Bu yeniden deneme yolunun dışında, connect kimlik doğrulama önceliği önce açık paylaşılan token/parola, sonra açık `deviceToken`, sonra saklanan cihaz token'ı, ardından bootstrap token'ıdır.
    - Asenkron Tailscale Serve Control UI yolunda, aynı `{scope, ip}` için başarısız denemeler, sınırlayıcı başarısızlığı kaydetmeden önce sıralı hale getirilir. Bu nedenle aynı istemciden gelen iki kötü eşzamanlı yeniden denemenin ikincisi, iki düz uyumsuzluk yerine `retry later` gösterebilir.
    - Tarayıcı-origin local loopback istemcisinden `too many failed authentication attempts (retry later)` → aynı normalize edilmiş `Origin` üzerinden tekrarlanan başarısızlıklar geçici olarak kilitlenir; başka bir localhost origin'i ayrı bir bucket kullanır.
    - bu yeniden denemeden sonra tekrarlanan `unauthorized` → paylaşılan token/cihaz token'ı drift'i; token yapılandırmasını yenileyin ve gerekirse cihaz token'ını yeniden onaylayın/döndürün.
    - `gateway connect failed:` → yanlış host/port/url hedefi.

  </Accordion>
</AccordionGroup>

### Kimlik doğrulama ayrıntı kodları hızlı haritası

Sonraki eylemi seçmek için başarısız `connect` yanıtındaki `error.details.code` değerini kullanın:

| Ayrıntı kodu                 | Anlamı                                                                                                                                                                                       | Önerilen eylem                                                                                                                                                                                                                                                                           |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`         | İstemci gerekli bir paylaşılan belirteci göndermedi.                                                                                                                                         | İstemcide belirteci yapıştırın/ayarlayın ve yeniden deneyin. Pano yolları için: `openclaw config get gateway.auth.token`, ardından Kontrol Kullanıcı Arayüzü ayarlarına yapıştırın.                                                                                                     |
| `AUTH_TOKEN_MISMATCH`        | Paylaşılan belirteç Gateway kimlik doğrulama belirteciyle eşleşmedi.                                                                                                                         | `canRetryWithDeviceToken=true` ise tek bir güvenilir yeniden denemeye izin verin. Önbelleğe alınmış belirteç yeniden denemeleri saklanan onaylı kapsamları yeniden kullanır; açık `deviceToken` / `scopes` çağıranları istenen kapsamları korur. Hâlâ başarısız oluyorsa [belirteç sapması kurtarma kontrol listesini](/tr/cli/devices#token-drift-recovery-checklist) çalıştırın. |
| `AUTH_DEVICE_TOKEN_MISMATCH` | Önbelleğe alınmış cihaz başına belirteç eski veya iptal edilmiş.                                                                                                                             | [Cihazlar CLI](/tr/cli/devices) kullanarak cihaz belirtecini döndürün/yeniden onaylayın, ardından yeniden bağlanın.                                                                                                                                                                        |
| `PAIRING_REQUIRED`           | Cihaz kimliğinin onaya ihtiyacı var. `not-paired`, `scope-upgrade`, `role-upgrade` veya `metadata-upgrade` için `error.details.reason` değerini kontrol edin ve mevcut olduğunda `requestId` / `remediationHint` kullanın. | Bekleyen isteği onaylayın: `openclaw devices list`, ardından `openclaw devices approve <requestId>`. Kapsam/rol yükseltmeleri, istenen erişimi gözden geçirdikten sonra aynı akışı kullanır.                                                                                            |

<Note>
Paylaşılan Gateway belirteci/parolasıyla kimliği doğrulanan doğrudan loopback backend RPC'leri, CLI'nin eşleştirilmiş cihaz kapsam taban çizgisine bağlı olmamalıdır. Alt aracılar veya diğer dahili çağrılar hâlâ `scope-upgrade` ile başarısız oluyorsa çağıranın `client.id: "gateway-client"` ve `client.mode: "backend"` kullandığını ve açık bir `deviceIdentity` veya cihaz belirteci zorlamadığını doğrulayın.
</Note>

Cihaz kimlik doğrulaması v2 geçiş kontrolü:

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

Günlükler nonce/imza hataları gösteriyorsa bağlanan istemciyi güncelleyin ve doğrulayın:

<Steps>
  <Step title="connect.challenge için bekle">
    İstemci, Gateway tarafından verilen `connect.challenge` değerini bekler.
  </Step>
  <Step title="Yükü imzala">
    İstemci, challenge'a bağlı yükü imzalar.
  </Step>
  <Step title="Cihaz nonce değerini gönder">
    İstemci, aynı challenge nonce değeriyle `connect.params.device.nonce` gönderir.
  </Step>
</Steps>

`openclaw devices rotate` / `revoke` / `remove` beklenmedik şekilde reddedilirse:

- eşleştirilmiş cihaz belirteci oturumları, çağıranda ayrıca `operator.admin` yoksa yalnızca **kendi** cihazlarını yönetebilir
- `openclaw devices rotate --scope ...`, yalnızca çağıran oturumun zaten sahip olduğu operatör kapsamlarını isteyebilir

İlgili:

- [Yapılandırma](/tr/gateway/configuration) (Gateway kimlik doğrulama modları)
- [Kontrol Kullanıcı Arayüzü](/tr/web/control-ui)
- [Cihazlar](/tr/cli/devices)
- [Uzaktan erişim](/tr/gateway/remote)
- [Güvenilir proxy kimlik doğrulaması](/tr/gateway/trusted-proxy-auth)

## Gateway hizmeti çalışmıyor

Bunu, hizmet kurulu olduğu ancak süreç ayakta kalmadığı zaman kullanın.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # ayrıca sistem düzeyi hizmetleri tara
```

Şunları arayın:

- Çıkış ipuçlarıyla birlikte `Runtime: stopped`.
- Hizmet yapılandırması uyuşmazlığı (`Config (cli)` ile `Config (service)`).
- Port/dinleyici çakışmaları.
- `--deep` kullanıldığında fazladan launchd/systemd/schtasks kurulumları.
- `Other gateway-like services detected (best effort)` temizleme ipuçları.

<AccordionGroup>
  <Accordion title="Yaygın imzalar">
    - `Gateway start blocked: set gateway.mode=local` veya `existing config is missing gateway.mode` → yerel Gateway modu etkin değil ya da yapılandırma dosyasının üzerine yazılmış ve `gateway.mode` kaybolmuş. Düzeltme: yapılandırmanızda `gateway.mode="local"` ayarlayın veya beklenen yerel mod yapılandırmasını yeniden damgalamak için `openclaw onboard --mode local` / `openclaw setup` komutunu yeniden çalıştırın. OpenClaw'ı Podman üzerinden çalıştırıyorsanız varsayılan yapılandırma yolu `~/.openclaw/openclaw.json` olur.
    - `refusing to bind gateway ... without auth` → geçerli bir Gateway kimlik doğrulama yolu olmadan loopback dışı bağlama (belirteç/parola veya yapılandırılmışsa güvenilir proxy).
    - `another gateway instance is already listening` / `EADDRINUSE` → port çakışması.
    - `Other gateway-like services detected (best effort)` → eski veya paralel launchd/systemd/schtasks birimleri var. Çoğu kurulum makine başına bir Gateway tutmalıdır; birden fazlasına gerçekten ihtiyacınız varsa portları + yapılandırma/durum/çalışma alanını yalıtın. Bkz. [/gateway#multiple-gateways-same-host](/tr/gateway#multiple-gateways-same-host).
    - doctor'dan `System-level OpenClaw gateway service detected` → kullanıcı düzeyi hizmet eksikken bir systemd sistem birimi var. doctor'ın bir kullanıcı hizmeti kurmasına izin vermeden önce kopyayı kaldırın veya devre dışı bırakın ya da sistem birimi amaçlanan denetleyiciyse `OPENCLAW_SERVICE_REPAIR_POLICY=external` ayarlayın.
    - `Gateway service port does not match current gateway config` → kurulu denetleyici hâlâ eski `--port` değerini sabitliyor. `openclaw doctor --fix` veya `openclaw gateway install --force` çalıştırın, ardından Gateway hizmetini yeniden başlatın.

  </Accordion>
</AccordionGroup>

İlgili:

- [Arka plan yürütme ve süreç aracı](/tr/gateway/background-process)
- [Yapılandırma](/tr/gateway/configuration)
- [Doctor](/tr/gateway/doctor)

## Gateway geçersiz yapılandırmayı reddetti

Bunu, Gateway başlatma işlemi `Invalid config` ile başarısız olduğunda veya hot reload günlükleri geçersiz bir düzenlemeyi atladığını söylediğinde kullanın.

```bash
openclaw logs --follow
openclaw config file
openclaw config validate
openclaw doctor
```

Şunları arayın:

- `Invalid config at ...`
- `config reload skipped (invalid config): ...`
- `Config write rejected: ...`
- Etkin yapılandırmanın yanında zaman damgalı bir `openclaw.json.rejected.*` dosyası
- `doctor --fix` bozuk bir doğrudan düzenlemeyi onardıysa zaman damgalı bir `openclaw.json.clobbered.*` dosyası

<AccordionGroup>
  <Accordion title="Ne oldu">
    - Yapılandırma başlatma, hot reload veya OpenClaw sahipli bir yazma sırasında doğrulanamadı.
    - Gateway başlatma, `openclaw.json` dosyasını yeniden yazmak yerine kapalı şekilde başarısız olur.
    - Hot reload, geçersiz harici düzenlemeleri atlar ve mevcut çalışma zamanı yapılandırmasını etkin tutar.
    - OpenClaw sahipli yazmalar, geçersiz/yıkıcı yükleri commit öncesinde reddeder ve `.rejected.*` olarak kaydeder.
    - Onarımın sahibi `openclaw doctor --fix` komutudur. JSON dışı önekleri kaldırabilir veya reddedilen yükü `.clobbered.*` olarak korurken son bilinen iyi kopyayı geri yükleyebilir.

  </Accordion>
  <Accordion title="İncele ve onar">
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
    - `.rejected.*` var → OpenClaw sahipli bir yapılandırma yazması, commit öncesinde şema veya üzerine yazma kontrollerinde başarısız oldu.
    - `Config write rejected:` → yazma, gerekli şekli düşürmeye, dosyayı keskin biçimde küçültmeye veya geçersiz yapılandırmayı kalıcı hale getirmeye çalıştı.
    - `config reload skipped (invalid config):` → doğrudan bir düzenleme doğrulamada başarısız oldu ve çalışan Gateway tarafından yok sayıldı.
    - `Invalid config at ...` → Gateway hizmetleri önyüklenmeden önce başlatma başarısız oldu.
    - `missing-meta-vs-last-good`, `gateway-mode-missing-vs-last-good` veya `size-drop-vs-last-good:*` → OpenClaw sahipli bir yazma, son bilinen iyi yedekle karşılaştırıldığında alanları veya boyutu kaybettiği için reddedildi.
    - `Config last-known-good promotion skipped` → aday, `***` gibi redakte edilmiş gizli bilgi yer tutucuları içeriyordu.

  </Accordion>
  <Accordion title="Düzeltme seçenekleri">
    1. Doctor'ın önekli/üzerine yazılmış yapılandırmayı onarmasına veya son bilinen iyi yapılandırmayı geri yüklemesine izin vermek için `openclaw doctor --fix` çalıştırın.
    2. `.clobbered.*` veya `.rejected.*` içinden yalnızca amaçlanan anahtarları kopyalayın, ardından bunları `openclaw config set` veya `config.patch` ile uygulayın.
    3. Yeniden başlatmadan önce `openclaw config validate` çalıştırın.
    4. Elle düzenliyorsanız yalnızca değiştirmek istediğiniz kısmi nesneyi değil, tam JSON5 yapılandırmasını koruyun.
  </Accordion>
</AccordionGroup>

İlgili:

- [Config](/tr/cli/config)
- [Yapılandırma: hot reload](/tr/gateway/configuration#config-hot-reload)
- [Yapılandırma: sıkı doğrulama](/tr/gateway/configuration#strict-validation)
- [Doctor](/tr/gateway/doctor)

## Gateway yoklama uyarıları

Bunu, `openclaw gateway probe` bir şeye ulaştığında ancak yine de bir uyarı bloğu yazdırdığında kullanın.

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

Şunları arayın:

- JSON çıktısında `warnings[].code` ve `primaryTargetId`.
- Uyarının SSH yedeği, birden çok Gateway, eksik kapsamlar veya çözümlenmemiş kimlik doğrulama referansları hakkında olup olmadığı.

Yaygın imzalar:

- `SSH tunnel failed to start; falling back to direct probes.` → SSH kurulumu başarısız oldu, ancak komut yine de doğrudan yapılandırılmış/loopback hedefleri denedi.
- `multiple reachable gateways detected` → birden fazla hedef yanıt verdi. Bu genellikle kasıtlı bir çoklu Gateway kurulumu veya eski/çoğaltılmış dinleyiciler anlamına gelir.
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → bağlantı çalıştı, ancak ayrıntı RPC kapsamla sınırlı; cihaz kimliğini eşleştirin veya `operator.read` içeren kimlik bilgileri kullanın.
- `Gateway accepted the WebSocket connection, but follow-up read diagnostics failed` → bağlantı çalıştı, ancak tam tanılama RPC kümesi zaman aşımına uğradı veya başarısız oldu. Bunu sınırlı tanılamaya sahip ulaşılabilir bir Gateway olarak değerlendirin; `--json` çıktısında `connect.ok` ve `connect.rpcOk` değerlerini karşılaştırın.
- `Capability: pairing-pending` veya `gateway closed (1008): pairing required` → Gateway yanıt verdi, ancak bu istemcinin normal operatör erişiminden önce hâlâ eşleştirme/onaya ihtiyacı var.
- çözümlenmemiş `gateway.auth.*` / `gateway.remote.*` SecretRef uyarı metni → başarısız hedef için bu komut yolunda kimlik doğrulama malzemesi kullanılamıyordu.

İlgili:

- [Gateway](/tr/cli/gateway)
- [Aynı ana bilgisayarda birden çok Gateway](/tr/gateway#multiple-gateways-same-host)
- [Uzaktan erişim](/tr/gateway/remote)

## Kanal bağlı, iletiler akmıyor

Kanal durumu bağlıysa ancak ileti akışı durmuşsa ilke, izinler ve kanala özgü teslim kurallarına odaklanın.

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

- `mention required` → ileti, grup bahsetme ilkesi tarafından yok sayıldı.
- `pairing` / bekleyen onay izleri → gönderen onaylanmamış.
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
    - `cron: timer tick failed` → zamanlayıcı tik’i başarısız oldu; dosya/günlük/çalışma zamanı hatalarını kontrol edin.
    - `heartbeat skipped` ile `reason=quiet-hours` → etkin saatler penceresinin dışında.
    - `heartbeat skipped` ile `reason=empty-heartbeat-file` → `HEARTBEAT.md` var, ancak yalnızca boş satırlar / markdown başlıkları içeriyor; bu yüzden OpenClaw model çağrısını atlar.
    - `heartbeat skipped` ile `reason=no-tasks-due` → `HEARTBEAT.md` bir `tasks:` bloğu içeriyor, ancak bu tikte hiçbir görevin zamanı gelmemiş.
    - `heartbeat: unknown accountId` → Heartbeat teslim hedefi için geçersiz hesap kimliği.
    - `heartbeat skipped` ile `reason=dm-blocked` → Heartbeat hedefi DM tarzı bir hedefe çözümlendi, ancak `agents.defaults.heartbeat.directPolicy` (veya ajan başına geçersiz kılma) `block` olarak ayarlı.

  </Accordion>
</AccordionGroup>

İlgili:

- [Heartbeat](/tr/gateway/heartbeat)
- [Zamanlanmış görevler](/tr/automation/cron-jobs)
- [Zamanlanmış görevler: sorun giderme](/tr/automation/cron-jobs#troubleshooting)

## Node eşleştirildi, araç başarısız oluyor

Bir Node eşleştirilmiş ancak araçlar başarısız oluyorsa ön plan, izin ve onay durumunu yalıtın.

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

Şunlara bakın:

- Beklenen yeteneklerle çevrimiçi Node.
- Kamera/mikrofon/konum/ekran için işletim sistemi izinleri.
- Exec onayları ve izin listesi durumu.

Yaygın imzalar:

- `NODE_BACKGROUND_UNAVAILABLE` → Node uygulaması ön planda olmalıdır.
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → eksik işletim sistemi izni.
- `SYSTEM_RUN_DENIED: approval required` → Exec onayı bekliyor.
- `SYSTEM_RUN_DENIED: allowlist miss` → komut izin listesi tarafından engellendi.

İlgili:

- [Exec onayları](/tr/tools/exec-approvals)
- [Node sorun giderme](/tr/nodes/troubleshooting)
- [Node’lar](/tr/nodes/index)

## Tarayıcı aracı başarısız oluyor

Gateway sağlıklı olduğu halde tarayıcı aracı eylemleri başarısız olduğunda bunu kullanın.

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
- CDP profil erişilebilirliği.
- `existing-session` / `user` profilleri için yerel Chrome kullanılabilirliği.

<AccordionGroup>
  <Accordion title="Plugin / çalıştırılabilir dosya imzaları">
    - `unknown command "browser"` veya `unknown command 'browser'` → paketli tarayıcı Plugin’i `plugins.allow` tarafından hariç tutuluyor.
    - `browser.enabled=true` iken tarayıcı aracı eksik / kullanılamıyor → `plugins.allow`, `browser` öğesini hariç tutuyor; bu yüzden Plugin hiç yüklenmedi.
    - `Failed to start Chrome CDP on port` → tarayıcı süreci başlatılamadı.
    - `browser.executablePath not found` → yapılandırılmış yol geçersiz.
    - `browser.cdpUrl must be http(s) or ws(s)` → yapılandırılmış CDP URL’si `file:` veya `ftp:` gibi desteklenmeyen bir şema kullanıyor.
    - `browser.cdpUrl has invalid port` → yapılandırılmış CDP URL’sinde hatalı veya aralık dışı bir port var.
    - `Playwright is not available in this gateway build; '<feature>' is unsupported.` → geçerli Gateway kurulumu çekirdek tarayıcı çalışma zamanı bağımlılığından yoksun; OpenClaw’ı yeniden kurun veya güncelleyin, ardından Gateway’i yeniden başlatın. ARIA anlık görüntüleri ve temel sayfa ekran görüntüleri hâlâ çalışabilir, ancak gezinme, AI anlık görüntüleri, CSS seçici öğe ekran görüntüleri ve PDF dışa aktarma kullanılamaz kalır.

  </Accordion>
  <Accordion title="Chrome MCP / existing-session imzaları">
    - `Could not find DevToolsActivePort for chrome` → Chrome MCP existing-session henüz seçilen tarayıcı veri dizinine bağlanamadı. Tarayıcı inceleme sayfasını açın, uzaktan hata ayıklamayı etkinleştirin, tarayıcıyı açık tutun, ilk bağlanma istemini onaylayın, ardından yeniden deneyin. Oturum açmış durum gerekli değilse yönetilen `openclaw` profilini tercih edin.
    - `No Chrome tabs found for profile="user"` → Chrome MCP bağlanma profilinde açık yerel Chrome sekmesi yok.
    - `Remote CDP for profile "<name>" is not reachable` → yapılandırılmış uzak CDP uç noktasına Gateway ana makinesinden erişilemiyor.
    - `Browser attachOnly is enabled ... not reachable` veya `Browser attachOnly is enabled and CDP websocket ... is not reachable` → yalnızca bağlanma profilinde erişilebilir hedef yok ya da HTTP uç noktası yanıt verdi ancak CDP WebSocket yine de açılamadı.

  </Accordion>
  <Accordion title="Öğe / ekran görüntüsü / yükleme imzaları">
    - `fullPage is not supported for element screenshots` → ekran görüntüsü isteği `--full-page` ile `--ref` veya `--element` öğesini birlikte kullandı.
    - `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → Chrome MCP / `existing-session` ekran görüntüsü çağrıları CSS `--element` yerine sayfa yakalama veya bir anlık görüntü `--ref` kullanmalıdır.
    - `existing-session file uploads do not support element selectors; use ref/inputRef.` → Chrome MCP yükleme kancaları CSS seçiciler değil, anlık görüntü ref’leri gerektirir.
    - `existing-session file uploads currently support one file at a time.` → Chrome MCP profillerinde çağrı başına bir yükleme gönderin.
    - `existing-session dialog handling does not support timeoutMs.` → Chrome MCP profillerindeki iletişim kutusu kancaları zaman aşımı geçersiz kılmalarını desteklemez.
    - `existing-session type does not support timeoutMs overrides.` → `profile="user"` / Chrome MCP existing-session profillerinde `act:type` için `timeoutMs` öğesini çıkarın ya da özel zaman aşımı gerektiğinde yönetilen/CDP tarayıcı profili kullanın.
    - `existing-session evaluate does not support timeoutMs overrides.` → `profile="user"` / Chrome MCP existing-session profillerinde `act:evaluate` için `timeoutMs` öğesini çıkarın ya da özel zaman aşımı gerektiğinde yönetilen/CDP tarayıcı profili kullanın.
    - `response body is not supported for existing-session profiles yet.` → `responsebody` hâlâ yönetilen tarayıcı veya ham CDP profili gerektirir.
    - yalnızca bağlanma veya uzak CDP profillerinde bayat görünüm alanı / koyu mod / yerel ayar / çevrimdışı geçersiz kılmaları → etkin kontrol oturumunu kapatmak ve tüm Gateway’i yeniden başlatmadan Playwright/CDP emülasyon durumunu serbest bırakmak için `openclaw browser stop --browser-profile <name>` çalıştırın.

  </Accordion>
</AccordionGroup>

İlgili:

- [Tarayıcı (OpenClaw tarafından yönetilen)](/tr/tools/browser)
- [Tarayıcı sorun giderme](/tr/tools/browser-linux-troubleshooting)

## Yükselttiyseniz ve bir şey aniden bozulduysa

Yükseltme sonrası çoğu bozulma yapılandırma sapmasından veya artık uygulanmakta olan daha katı varsayılanlardan kaynaklanır.

<AccordionGroup>
  <Accordion title="1. Kimlik doğrulama ve URL geçersiz kılma davranışı değişti">
    ```bash
    openclaw gateway status
    openclaw config get gateway.mode
    openclaw config get gateway.remote.url
    openclaw config get gateway.auth.mode
    ```

    Kontrol edilecekler:

    - `gateway.mode=remote` ise CLI çağrıları uzak hedefe gidiyor olabilir, yerel hizmetiniz ise sorunsuz olabilir.
    - Açık `--url` çağrıları saklanan kimlik bilgilerine geri dönmez.

    Yaygın imzalar:

    - `gateway connect failed:` → yanlış URL hedefi.
    - `unauthorized` → uç nokta erişilebilir, ancak kimlik doğrulama yanlış.

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

    - Geri döngü dışı bağlamalar (`lan`, `tailnet`, `custom`) geçerli bir Gateway kimlik doğrulama yolu gerektirir: paylaşılan belirteç/parola kimlik doğrulaması veya doğru yapılandırılmış geri döngü dışı `trusted-proxy` dağıtımı.
    - `gateway.token` gibi eski anahtarlar `gateway.auth.token` yerine geçmez.

    Yaygın imzalar:

    - `refusing to bind gateway ... without auth` → geçerli bir Gateway kimlik doğrulama yolu olmadan geri döngü dışı bağlama.
    - Çalışma zamanı çalışırken `Connectivity probe: failed` → Gateway canlı, ancak geçerli kimlik doğrulama/url ile erişilemiyor.

  </Accordion>
  <Accordion title="3. Eşleştirme ve cihaz kimliği durumu değişti">
    ```bash
    openclaw devices list
    openclaw pairing list --channel <channel> [--account <id>]
    openclaw logs --follow
    openclaw doctor
    ```

    Kontrol edilecekler:

    - Pano/Node’lar için bekleyen cihaz onayları.
    - İlke veya kimlik değişikliklerinden sonra bekleyen DM eşleştirme onayları.

    Yaygın imzalar:

    - `device identity required` → cihaz kimlik doğrulaması karşılanmadı.
    - `pairing required` → gönderen/cihaz onaylanmalıdır.

  </Accordion>
</AccordionGroup>

Denetimlerden sonra hizmet yapılandırması ve çalışma zamanı hâlâ uyuşmuyorsa hizmet meta verilerini aynı profil/durum dizininden yeniden kurun:

```bash
openclaw gateway install --force
openclaw gateway restart
```

İlgili:

- [Kimlik doğrulama](/tr/gateway/authentication)
- [Arka plan Exec ve süreç aracı](/tr/gateway/background-process)
- [Gateway tarafından yönetilen eşleştirme](/tr/gateway/pairing)

## İlgili

- [Doctor](/tr/gateway/doctor)
- [SSS](/tr/help/faq)
- [Gateway çalışma kitabı](/tr/gateway)
