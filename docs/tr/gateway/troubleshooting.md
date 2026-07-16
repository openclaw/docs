---
read_when:
    - Sorun giderme merkezi, daha ayrıntılı tanılama için sizi buraya yönlendirdi
    - Tam komutlar içeren, belirtilere dayalı kararlı çalışma kılavuzu bölümlerine ihtiyacınız var
sidebarTitle: Troubleshooting
summary: Gateway, kanallar, otomasyon, Node'lar ve tarayıcı için ayrıntılı sorun giderme çalışma kılavuzu
title: Sorun Giderme
x-i18n:
    generated_at: "2026-07-16T17:27:44Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f53064a0d42e601ec1a1904fc9d0e8ebb9def7a2fb9d2579c7f10ca675b8f7fd
    source_path: gateway/troubleshooting.md
    workflow: 16
---

Bu, ayrıntılı çalışma kılavuzudur. Önce hızlı triyaj akışı için [/help/troubleshooting](/tr/help/troubleshooting) sayfasından başlayın.

## Komut sıralaması

Şu sırayla çalıştırın:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Sağlıklı durum göstergeleri:

- `openclaw gateway status`, `Runtime: running`, `Connectivity probe: ok` ve bir `Capability: ...` satırı gösterir.
- `openclaw doctor`, engelleyici yapılandırma/hizmet sorunu olmadığını bildirir.
- `openclaw channels status --probe`, hesap başına canlı aktarım durumunu ve desteklendiği yerlerde `works` veya `audit ok` gösterir.

## Güncellemeden sonra

Bir güncelleme tamamlandığı hâlde Gateway çalışmıyorsa, kanallar boşsa veya model çağrıları 401 hatalarıyla başarısız oluyorsa kullanın.

```bash
openclaw status --all
openclaw update status --json
openclaw gateway status --deep
openclaw doctor --fix
openclaw gateway restart
```

Şunları arayın:

- `openclaw status` / `openclaw status --all` içindeki `Update restart`. Bekleyen veya başarısız devirler, çalıştırılacak sonraki komutu içerir.
- Kanallar altındaki `plugin load failed: dependency tree corrupted; run openclaw doctor --fix`: kanal yapılandırması hâlâ mevcuttur ancak kanal yüklenemeden önce Plugin kaydı başarısız olmuştur.
- Yeniden kimlik doğrulamasından sonra sağlayıcı 401 hataları: `openclaw doctor --fix`, ajan başına eski OAuth kimlik doğrulama gölge kopyalarını denetler ve tüm ajanların geçerli paylaşılan profili çözümlemesi için eski kopyaları kaldırır.

## Bölünmüş kurulumlar ve daha yeni yapılandırma koruması

Bir güncellemeden sonra Gateway hizmeti beklenmedik biçimde durduğunda veya günlükler bir `openclaw` ikili dosyasının `openclaw.json` dosyasına son yazan sürümden daha eski olduğunu gösterdiğinde kullanın.

OpenClaw, yapılandırma yazma işlemlerini `meta.lastTouchedVersion` ile damgalar. Salt okunur komutlar daha yeni bir OpenClaw tarafından yazılmış yapılandırmayı inceleyebilir ancak işlem ve hizmet değişikliklerinin daha eski bir ikili dosyadan çalıştırılması reddedilir. Engellenen eylemler: Gateway hizmetini başlatma/durdurma/yeniden başlatma/kaldırma, zorunlu hizmet yeniden kurulumu, hizmet modunda Gateway başlatma ve `gateway --force` bağlantı noktası temizliği.

```bash
which openclaw
openclaw --version
openclaw gateway status --deep
openclaw config get meta.lastTouchedVersion
```

<Steps>
  <Step title="PATH'i düzeltin">
    `openclaw` daha yeni kuruluma çözümlenecek şekilde `PATH` değerini düzeltin, ardından eylemi yeniden çalıştırın.
  </Step>
  <Step title="Gateway hizmetini yeniden kurun">
    Amaçlanan Gateway hizmetini daha yeni kurulumdan yeniden kurun:

    ```bash
    openclaw gateway install --force
    openclaw gateway restart
    ```

  </Step>
  <Step title="Eski sarmalayıcıları kaldırın">
    Hâlâ eski bir `openclaw` ikili dosyasına işaret eden eski sistem paketi veya sarmalayıcı girdilerini kaldırın.
  </Step>
</Steps>

<Warning>
Yalnızca bilinçli sürüm düşürme veya acil kurtarma için tek komut kapsamında `OPENCLAW_ALLOW_OLDER_BINARY_DESTRUCTIVE_ACTIONS=1` ayarlayın. Normal çalışma sırasında ayarlamayın.
</Warning>

## Geri almadan sonra protokol uyuşmazlığı

Sürüm düşürme veya geri alma işleminden sonra günlükler sürekli `protocol mismatch` yazdırıyorsa kullanın. Daha eski bir Gateway çalışmaktadır ancak daha yeni bir yerel istemci işlemi, eski Gateway'in kullanamadığı bir protokol aralığıyla yeniden bağlanmayı sürdürmektedir.

```bash
openclaw --version
which -a openclaw
openclaw gateway status --deep
openclaw doctor --deep
openclaw logs --follow
```

Şunları arayın:

- Gateway günlüklerindeki `protocol mismatch ... client=... v<version> min=<n> max=<n> expected=<n>`.
- `openclaw gateway status --deep` içindeki `Established clients:` veya `openclaw doctor --deep` içindeki `Gateway clients`: işletim sistemi izin verdiğinde PID'ler ve komut satırlarıyla birlikte Gateway bağlantı noktasına bağlı etkin TCP istemcileri.
- Komut satırı, geri aldığınız daha yeni OpenClaw kurulumunu veya sarmalayıcıyı gösteren bir istemci işlemi.

Düzeltme:

1. `gateway status --deep` tarafından gösterilen eski OpenClaw istemci işlemini durdurun veya yeniden başlatın.
2. OpenClaw'u gömülü olarak kullanan uygulamaları veya sarmalayıcıları yeniden başlatın: yerel panolar, düzenleyiciler, uygulama sunucusu yardımcıları veya uzun süre çalışan `openclaw logs --follow` kabukları.
3. `openclaw gateway status --deep` veya `openclaw doctor --deep` komutunu yeniden çalıştırın ve eski istemci PID'sinin kaybolduğunu doğrulayın.

Daha eski bir Gateway'in daha yeni ve uyumsuz bir protokolü kabul etmesini sağlamayın. Protokol sürüm yükseltmeleri kablo üzerindeki sözleşmeyi korur; geri alma kurtarması bir işlem/sürüm temizleme sorunudur.

## Yol dışına çıkma nedeniyle Skill sembolik bağlantısının atlanması

Günlükler şunu içerdiğinde kullanın:

```text
Yapılandırılmış kökünün dışına çıkan skill yolu atlanıyor: ... reason=symlink-escape
```

Her skill kökü bir sınırlama sınırıdır. `~/.agents/skills`, `<workspace>/.agents/skills`, `<workspace>/skills` veya `~/.openclaw/skills` altındaki bir sembolik bağlantı, gerçek hedefi açıkça güvenilir olarak belirtilmediği sürece bu kökün dışına çözümlendiğinde atlanır.

Bağlantıyı inceleyin:

```bash
ls -l ~/.agents/skills/<name>
realpath ~/.agents/skills/<name>
openclaw config get skills.load
```

Hedef bilinçli olarak seçildiyse hem doğrudan skill kökünü hem de izin verilen sembolik bağlantı hedefini yapılandırın:

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

Ardından yeni bir oturum başlatın veya skills izleyicisinin yenilenmesini bekleyin. Çalışan işlem yapılandırma değişikliğinden önce başlatıldıysa Gateway'i yeniden başlatın.

`~`, `/` veya eşitlenmiş bir proje klasörünün tamamı gibi geniş hedefler kullanmayın. `allowSymlinkTargets` kapsamını, güvenilir `SKILL.md` dizinlerini içeren gerçek skill köküyle sınırlı tutun.

Skill Workshop uygulama işleminin güvenilir sembolik bağlantılı çalışma alanı skill yolları üzerinden de yazması gerekiyorsa `skills.workshop.allowSymlinkTargetWrites` seçeneğini etkinleştirin. Salt okunur paylaşılan skill köklerinde devre dışı tutun.

İlgili:

- [Skills yapılandırması](/tr/tools/skills-config#symlinked-skill-roots)
- [Yapılandırma örnekleri](/tr/gateway/configuration-examples#symlinked-sibling-skill-repo)

## Anthropic 429: uzun bağlam için ek kullanım gerekli

Günlükler/hatalar `HTTP 429: rate_limit_error: Extra usage is required for long context requests` içerdiğinde kullanın.

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

Şunları arayın:

- Seçilen Anthropic modeli, genel kullanıma sunulmuş 1M destekli bir Claude 4.x modelidir (Opus 4.6/4.7/4.8, Sonnet 4.6) veya model yapılandırması hâlâ eski `params.context1m: true` değerini taşımaktadır.
- Geçerli Anthropic kimlik bilgisi uzun bağlam kullanımı için uygun değildir.
- İstekler yalnızca 1M bağlam yoluna ihtiyaç duyan uzun oturumlarda/model çalıştırmalarında başarısız olur.

Düzeltme seçenekleri:

<Steps>
  <Step title="Standart bir bağlam penceresi kullanın">
    Standart pencereli bir modele geçin veya 1M bağlam için genel kullanıma uygun olmayan eski
    model yapılandırmasından eski `context1m` değerini kaldırın.
  </Step>
  <Step title="Uygun bir kimlik bilgisi kullanın">
    Uzun bağlam istekleri için uygun bir Anthropic kimlik bilgisi kullanın veya bir Anthropic API anahtarına geçin.
  </Step>
  <Step title="Yedek modelleri yapılandırın">
    Anthropic uzun bağlam istekleri reddedildiğinde çalıştırmaların devam etmesi için yedek modelleri yapılandırın.
  </Step>
</Steps>

İlgili:

- [Anthropic](/tr/providers/anthropic)
- [Token kullanımı ve maliyetler](/tr/reference/token-use)
- [Anthropic'ten neden HTTP 429 görüyorum?](/tr/help/faq-first-run#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## Üst sağlayıcıdan gelen engellenmiş 403 yanıtları

Üst LLM sağlayıcısı `Your request was blocked` gibi genel bir `403` döndürdüğünde kullanın.

Bunun her zaman bir OpenClaw yapılandırma sorunu olduğunu varsaymayın. Yanıt, OpenAI uyumlu bir uç noktanın önündeki CDN, WAF, bot yönetimi kuralı veya ters proxy gibi bir üst güvenlik katmanından gelebilir.

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
```

Şunları arayın:

- Aynı sağlayıcı altındaki birden fazla modelin aynı şekilde başarısız olması.
- Normal bir sağlayıcı API hatası yerine HTML veya genel güvenlik metni.
- Aynı istek zamanına ait sağlayıcı tarafı güvenlik olayları.
- Küçük bir doğrudan `curl` yoklaması başarılı olurken normal SDK biçimli isteklerin başarısız olması.

Kanıtlar bir WAF/CDN engellemesini gösterdiğinde önce sağlayıcı tarafındaki filtrelemeyi düzeltin. OpenClaw'un kullandığı API yolu için dar kapsamlı bir izin verme veya atlama kuralını tercih edin ve sitenin tamamında korumayı devre dışı bırakmaktan kaçının.

<Warning>
Başarılı bir asgari `curl`, gerçek SDK tarzı isteklerin aynı üst güvenlik katmanından geçeceğini garanti etmez.
</Warning>

İlgili:

- [OpenAI uyumlu uç noktalar](/tr/gateway/configuration-reference#openai-compatible-endpoints)
- [Sağlayıcı yapılandırması](/tr/providers)
- [Günlükler](/tr/logging)

## Yerel OpenAI uyumlu arka uç doğrudan yoklamaları geçiyor ancak ajan çalıştırmaları başarısız oluyor

Şu durumlarda kullanın:

- `curl ... /v1/models` çalışır.
- Küçük doğrudan `/v1/chat/completions` çağrıları çalışır.
- OpenClaw model çalıştırmaları yalnızca normal ajan turlarında başarısız olur.

```bash
curl http://127.0.0.1:1234/v1/models
curl http://127.0.0.1:1234/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"<id>","messages":[{"role":"user","content":"merhaba"}],"stream":false}'
openclaw infer model run --model <provider/model> --prompt "merhaba" --json
openclaw logs --follow
```

Şunları arayın:

- Küçük doğrudan çağrılar başarılı olur ancak OpenClaw çalıştırmaları yalnızca daha büyük istemlerde başarısız olur.
- Doğrudan `/v1/chat/completions` aynı yalın model kimliğiyle çalışmasına rağmen `model_not_found` veya 404 hataları.
- `messages[].content` değerinin bir dize olmasını beklediğini belirten arka uç hataları.
- OpenAI uyumlu yerel bir arka uçta aralıklı `incomplete turn detected ... stopReason=stop payloads=0` uyarıları.
- Yalnızca daha yüksek istem-token sayılarında veya tam ajan çalışma zamanı istemlerinde görülen arka uç çökmeleri.

<AccordionGroup>
  <Accordion title="Yaygın belirtiler">
    - Yerel MLX/vLLM tarzı bir sunucuda `model_not_found`: `baseUrl` değerinin `/v1` içerdiğini, `/v1/chat/completions` arka uçları için `api` değerinin `"openai-completions"` olduğunu ve `models.providers.<provider>.models[].id` değerinin yalın sağlayıcı yerel kimliği olduğunu doğrulayın. Örneğin `mlx/mlx-community/Qwen3-30B-A3B-6bit` biçiminde sağlayıcı önekiyle bir kez seçin; katalog girdisini `mlx-community/Qwen3-30B-A3B-6bit` olarak tutun.
    - `messages[...].content: invalid type: sequence, expected a string`: arka uç, yapılandırılmış Chat Completions içerik parçalarını reddeder. Düzeltme: `models.providers.<provider>.models[].compat.requiresStringContent: true` ayarlayın.
    - `validation.keys` veya `["role","content"]` gibi izin verilen ileti anahtarları: arka uç, Chat Completions iletilerindeki OpenAI tarzı yeniden oynatma meta verilerini reddeder. Düzeltme: `models.providers.<provider>.models[].compat.strictMessageKeys: true` ayarlayın.
    - `incomplete turn detected ... stopReason=stop payloads=0`: arka uç Chat Completions isteğini tamamlamış ancak bu tur için kullanıcıya görünür bir asistan metni döndürmemiştir. OpenClaw, yeniden oynatılması güvenli boş OpenAI uyumlu turları bir kez yeniden dener; kalıcı hatalar genellikle arka ucun boş/metin dışı içerik yaydığı veya nihai yanıt metnini bastırdığı anlamına gelir.
    - Doğrudan küçük istekler başarılı olur ancak OpenClaw ajan çalıştırmaları arka uç/model çökmeleriyle başarısız olur (örneğin bazı `inferrs` derlemelerinde Gemma): OpenClaw aktarımı büyük olasılıkla zaten doğrudur; arka uç daha büyük ajan çalışma zamanı istem biçiminde başarısız olmaktadır.
    - Araçlar devre dışı bırakıldıktan sonra hatalar azalır ancak kaybolmaz: araç şemaları baskının bir parçasıdır ancak kalan sorun hâlâ üst model/sunucu kapasitesi veya bir arka uç hatasıdır.

  </Accordion>
  <Accordion title="Düzeltme seçenekleri">
    1. Yalnızca dize destekleyen Chat Completions arka uçları için `compat.requiresStringContent: true` ayarlayın.
    2. Her iletide yalnızca `role` ve `content` kabul eden katı Chat Completions arka uçları için `compat.strictMessageKeys: true` ayarlayın.
    3. OpenClaw'un araç şeması yüzeyini güvenilir biçimde işleyemeyen modeller/arka uçlar için `compat.supportsTools: false` ayarlayın.
    4. Mümkün olduğunda istem baskısını azaltın: daha küçük çalışma alanı önyüklemesi, daha kısa oturum geçmişi, daha hafif bir yerel model veya daha güçlü uzun bağlam desteğine sahip bir arka uç.
    5. Küçük doğrudan istekler başarılı olmaya devam ederken OpenClaw ajan turları arka uç içinde hâlâ çöküyorsa bunu bir üst sunucu/model sınırlaması olarak değerlendirin ve kabul edilen yük biçimiyle orada bir yeniden üretim kaydı oluşturun.
  </Accordion>
</AccordionGroup>

İlgili:

- [Yapılandırma](/tr/gateway/configuration)
- [Yerel modeller](/tr/gateway/local-models)
- [OpenAI uyumlu uç noktalar](/tr/gateway/configuration-reference#openai-compatible-endpoints)

## Yanıt yok

Kanallar çalışıyor ancak hiçbir şey yanıt vermiyorsa herhangi bir şeyi yeniden bağlamadan önce yönlendirmeyi ve politikayı kontrol edin.

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

Şunları arayın:

- DM gönderenleri için eşleştirme bekliyor.
- Grup bahsetme kısıtlaması (`requireMention`, `mentionPatterns`).
- Kanal/grup izin listesi uyuşmazlıkları.

Yaygın belirtiler:

- `drop guild message (mention required` → grup mesajı bahsedilene kadar yok sayılır.
- `pairing request` → gönderenin onaylanması gerekir.
- `blocked` / `allowlist` → gönderen/kanal politika tarafından filtrelendi.

İlgili konular:

- [Kanal sorunlarını giderme](/tr/channels/troubleshooting)
- [Gruplar](/tr/channels/groups)
- [Eşleştirme](/tr/channels/pairing)

## Pano kontrol arayüzü bağlantısı

Pano/kontrol arayüzü bağlanmıyorsa URL'yi, kimlik doğrulama modunu ve güvenli bağlam varsayımlarını doğrulayın.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

Şunları arayın:

- Doğru yoklama URL'si ve pano URL'si.
- İstemci ile gateway arasında kimlik doğrulama modu/token uyuşmazlığı.
- Cihaz kimliğinin gerekli olduğu yerde HTTP kullanımı.

Bir güncellemeden sonra yerel tarayıcı `127.0.0.1:18789` adresine bağlanamıyorsa önce yerel Gateway hizmetini kurtarın ve panoyu sunduğunu doğrulayın:

```bash
openclaw gateway restart
lsof -i :18789
curl http://127.0.0.1:18789
```

`curl` OpenClaw HTML'si döndürürse Gateway çalışıyordur ve kalan sorun büyük olasılıkla tarayıcı önbelleği, eski bir derin bağlantı veya güncelliğini yitirmiş sekme durumudur. `http://127.0.0.1:18789` adresini doğrudan açın ve panodan ilerleyin. Yeniden başlatma sonrasında hizmet çalışır durumda kalmazsa `openclaw gateway start` komutunu çalıştırın ve `openclaw gateway status` değerini yeniden kontrol edin.

<AccordionGroup>
  <Accordion title="Bağlantı / kimlik doğrulama belirtileri">
    - `device identity required` → güvenli olmayan bağlam veya eksik cihaz kimlik doğrulaması.
    - `origin not allowed` → tarayıcı `Origin`, `gateway.controlUi.allowedOrigins` içinde değil (veya açık bir izin listesi olmadan loopback dışı bir tarayıcı kaynağından bağlanıyorsunuz).
    - `device nonce required` / `device nonce mismatch` → istemci, sorgulamaya dayalı cihaz kimlik doğrulama akışını tamamlamıyor (`connect.challenge` + `device.nonce`).
    - `device signature invalid` / `device signature expired` → istemci, mevcut el sıkışma için yanlış yükü (veya eski zaman damgasını) imzaladı.
    - `AUTH_TOKEN_MISMATCH` ile `canRetryWithDeviceToken=true` → istemci, önbelleğe alınmış cihaz tokenıyla tek bir güvenilir yeniden deneme yapabilir.
    - Önbelleğe alınmış tokenla yapılan bu yeniden deneme, eşleştirilmiş cihaz tokenıyla saklanan önbelleğe alınmış kapsam kümesini yeniden kullanır. Açıkça `deviceToken` / açıkça `scopes` kullanan çağıranlar bunun yerine istedikleri kapsam kümesini korur.
    - `AUTH_SCOPE_MISMATCH` → cihaz tokenı tanındı ancak onaylanmış kapsamları bu bağlantı isteğini kapsamıyor; paylaşılan gateway tokenını döndürmek yerine yeniden eşleştirin veya istenen kapsam sözleşmesini onaylayın.
    - Bu yeniden deneme yolunun dışında bağlantı kimlik doğrulama önceliği şöyledir: önce açıkça belirtilen paylaşılan token/parola, ardından açıkça belirtilen `deviceToken`, sonra saklanan cihaz tokenı ve son olarak önyükleme tokenı.
    - Asenkron Tailscale Serve Kontrol Arayüzü yolunda aynı `{scope, ip}` için başarısız denemeler, sınırlayıcı hatayı kaydetmeden önce sıralı hâle getirilir. Bu nedenle aynı istemciden eş zamanlı iki hatalı yeniden denemenin ikincisinde iki sıradan uyuşmazlık yerine `retry later` görülebilir.
    - Tarayıcı kaynaklı loopback istemcisinden `too many failed authentication attempts (retry later)` → aynı normalleştirilmiş `Origin` üzerinden tekrarlanan hatalar geçici olarak engellenir; başka bir localhost kaynağı ayrı bir dilim kullanır.
    - Bu yeniden denemeden sonra tekrarlanan `unauthorized` → paylaşılan token/cihaz tokenı ayrışması; token yapılandırmasını yenileyin ve gerekirse cihaz tokenını yeniden onaylayın/döndürün.
    - `gateway connect failed:` → yanlış ana makine/port/URL hedefi.

  </Accordion>
</AccordionGroup>

### Kimlik doğrulama ayrıntı kodları hızlı eşlemesi

Sonraki işlemi seçmek için başarısız `connect` yanıtındaki `error.details.code` değerini kullanın:

| Ayrıntı kodu                  | Anlamı                                                                                                                                                                                      | Önerilen işlem                                                                                                                                                                                                                                                                       |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`         | İstemci gerekli paylaşılan tokenı göndermedi.                                                                                                                                                 | Tokenı istemciye yapıştırın/ayarlayın ve yeniden deneyin. Pano yolları için: `openclaw config get gateway.auth.token`, ardından Kontrol Arayüzü ayarlarına yapıştırın.                                                                                                                                              |
| `AUTH_TOKEN_MISMATCH`        | Paylaşılan token, gateway kimlik doğrulama tokenıyla eşleşmedi.                                                                                                                                               | `canRetryWithDeviceToken=true` ise tek bir güvenilir yeniden denemeye izin verin. Önbelleğe alınmış tokenla yeniden denemeler, saklanan onaylanmış kapsamları yeniden kullanır; açıkça `deviceToken` / `scopes` kullanan çağıranlar istenen kapsamları korur. Hâlâ başarısız olursa [token ayrışmasını kurtarma kontrol listesini](/tr/cli/devices#token-drift-recovery-checklist) uygulayın. |
| `AUTH_DEVICE_TOKEN_MISMATCH` | Cihaz başına önbelleğe alınmış token eski veya iptal edilmiş.                                                                                                                                                 | [Cihazlar CLI'sını](/tr/cli/devices) kullanarak cihaz tokenını döndürün/yeniden onaylayın, ardından yeniden bağlanın.                                                                                                                                                                                                        |
| `AUTH_SCOPE_MISMATCH`        | Cihaz tokenı geçerli ancak onaylanmış rolü/kapsamları bu bağlantı isteğini kapsamıyor.                                                                                                       | Cihazı yeniden eşleştirin veya istenen kapsam sözleşmesini onaylayın; bunu paylaşılan token ayrışması olarak değerlendirmeyin.                                                                                                                                                                                     |
| `PAIRING_REQUIRED`           | Cihaz kimliğinin onaylanması gerekiyor. `error.details.reason` içinde `not-paired`, `scope-upgrade`, `role-upgrade` veya `metadata-upgrade` değerini kontrol edin; varsa `requestId` / `remediationHint` kullanın. | Bekleyen isteği onaylayın: `openclaw devices list`, ardından `openclaw devices approve <requestId>`. Kapsam/rol yükseltmeleri, istenen erişimi inceledikten sonra aynı akışı kullanır.                                                                                                               |

<Note>
Paylaşılan gateway tokenı/parolasıyla kimliği doğrulanan doğrudan loopback arka uç RPC'leri, CLI'ın eşleştirilmiş cihaz kapsamı temel değerine bağlı olmamalıdır. Alt ajanlar veya diğer dahili çağrılar hâlâ `scope-upgrade` ile başarısız oluyorsa çağıranın `client.id: "gateway-client"` ve `client.mode: "backend"` kullandığını ve açıkça bir `deviceIdentity` veya cihaz tokenı zorlamadığını doğrulayın.
</Note>

Cihaz kimlik doğrulaması v2 geçiş kontrolü:

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

Günlüklerde nonce/imza hataları görünüyorsa bağlanan istemciyi güncelleyin ve istemciyi doğrulayın:

<Steps>
  <Step title="connect.challenge değerini bekleyin">
    İstemci, gateway tarafından verilen `connect.challenge` değerini bekler.
  </Step>
  <Step title="Yükü imzalayın">
    İstemci, sorgulamaya bağlı yükü imzalar.
  </Step>
  <Step title="Cihaz nonce değerini gönderin">
    İstemci, aynı sorgulama nonce değeriyle `connect.params.device.nonce` gönderir.
  </Step>
</Steps>

`openclaw devices rotate` / `revoke` / `remove` beklenmedik biçimde reddedilirse:

- Eşleştirilmiş cihaz tokenı oturumları, çağıranda ayrıca `operator.admin` olmadığı sürece yalnızca **kendi** cihazlarını yönetebilir.
- `openclaw devices rotate --scope ...` yalnızca çağıran oturumun zaten sahip olduğu operatör kapsamlarını isteyebilir.

İlgili konular:

- [Yapılandırma](/tr/gateway/configuration) (gateway kimlik doğrulama modları)
- [Kontrol Arayüzü](/tr/web/control-ui)
- [Cihazlar](/tr/cli/devices)
- [Uzaktan erişim](/tr/gateway/remote)
- [Güvenilir proxy kimlik doğrulaması](/tr/gateway/trusted-proxy-auth)

## Gateway hizmeti çalışmıyor

Hizmet yüklü olduğu hâlde süreç çalışır durumda kalmıyorsa kullanın.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # sistem düzeyindeki hizmetleri de tara
```

Şunları arayın:

- Çıkış ipuçlarıyla birlikte `Runtime: stopped`.
- Hizmet yapılandırması uyuşmazlığı (`Config (cli)` ile `Config (service)`).
- Port/dinleyici çakışmaları.
- `--deep` kullanıldığında fazladan launchd/systemd/schtasks kurulumları.
- `Other gateway-like services detected (best effort)` temizleme ipuçları.

<AccordionGroup>
  <Accordion title="Yaygın belirtiler">
    - `Gateway start blocked: set gateway.mode=local` veya `existing config is missing gateway.mode` → yerel gateway modu etkin değil ya da yapılandırma dosyasının üzerine yazılmış ve `gateway.mode` kaybolmuş. Düzeltme: yapılandırmanızda `gateway.mode="local"` değerini ayarlayın veya beklenen yerel mod yapılandırmasını yeniden damgalamak için `openclaw onboard --mode local` / `openclaw setup` komutunu yeniden çalıştırın. OpenClaw'ı Podman üzerinden çalıştırıyorsanız varsayılan yapılandırma yolu `~/.openclaw/openclaw.json` şeklindedir.
    - `refusing to bind gateway ... without auth` → geçerli bir gateway kimlik doğrulama yolu (token/parola veya yapılandırıldığı yerde güvenilir proxy) olmadan loopback dışı bağlama.
    - `another gateway instance is already listening` / `EADDRINUSE` → port çakışması.
    - `Other gateway-like services detected (best effort)` → eski veya paralel launchd/systemd/schtasks birimleri mevcut. Çoğu kurulumda makine başına tek bir gateway kullanılmalıdır; birden fazlasına gerçekten ihtiyacınız varsa portları + yapılandırmayı/durumu/çalışma alanını yalıtın. Bkz. [/gateway#multiple-gateways-same-host](/tr/gateway#multiple-gateways-same-host).
    - Doctor'dan `System-level OpenClaw gateway service detected` → kullanıcı düzeyindeki hizmet eksikken bir systemd sistem birimi mevcut. Doctor'ın kullanıcı hizmeti yüklemesine izin vermeden önce yinelenen birimi kaldırın veya devre dışı bırakın; sistem birimi amaçlanan denetleyiciyse `OPENCLAW_SERVICE_REPAIR_POLICY=external` değerini ayarlayın.
    - `Gateway service port does not match current gateway config` → yüklü denetleyici hâlâ eski `--port` değerini sabitliyor. `openclaw doctor --fix` veya `openclaw gateway install --force` komutunu çalıştırın, ardından gateway hizmetini yeniden başlatın.

  </Accordion>
</AccordionGroup>

İlgili konular:

- [Arka planda yürütme ve süreç aracı](/tr/gateway/background-process)
- [Yapılandırma](/tr/gateway/configuration)
- [Doctor](/tr/gateway/doctor)

## macOS gateway sessizce yanıt vermeyi durduruyor, ardından panoya dokunduğunuzda devam ediyor

macOS ana makinesindeki kanallar (Telegram, WhatsApp vb.) zaman zaman dakikalarca veya saatlerce sessiz kaldığında ve Control UI'yi açtığınız, SSH ile bağlandığınız ya da ana makineyle başka bir şekilde etkileşime geçtiğiniz anda Gateway yeniden çalışmaya başlıyor gibi göründüğünde kullanın. Genellikle `openclaw status` içinde belirgin bir belirti olmaz; çünkü kontrol ettiğiniz sırada Gateway yeniden çalışır durumdadır.

```bash
ls ~/.openclaw/logs/stability/ | tail -5
openclaw gateway stability --bundle latest
pmset -g log | grep -iE "sleep|wake|maintenance" | tail -50
launchctl print gui/$UID/ai.openclaw.gateway | grep -E "state|last exit|runs"
```

Şunları arayın:

- `~/.openclaw/logs/stability/` içinde `error.code` değeri `ENETDOWN`, `ENETUNREACH`, `EHOSTUNREACH` veya `ECONNREFUSED` gibi geçici bir ağ koduna ayarlanmış bir ya da daha fazla `*-uncaught_exception.json` paketi.
- Çökme zaman damgalarıyla örtüşen `Entering Sleep state due to 'Maintenance Sleep'` veya `en0 driver is slow (msg: WillChangeState to 0)` gibi `pmset -g log` satırları. Power Nap / Maintenance Sleep, Wi-Fi sürücüsünü kısa süreliğine 0 durumuna geçirir; bu aralığa denk gelen herhangi bir giden `connect()`, normalde tam ağ bağlantısına sahip bir ana makinede bile `ENETDOWN` ile başarısız olabilir.
- Özellikle çökme ile sonraki başlatma arasındaki süre saniyeler yerine yaklaşık bir saat olduğunda, çıkış koduyla birlikte yakın zamanda birden çok `runs` içeren `state = not running` gösteren `launchctl print` çıktısı. macOS launchd, art arda çökmelerden sonra belgelenmemiş bir yeniden başlatma koruma geçidi uygular; bu geçit, etkileşimli oturum açma, pano bağlantısı veya `launchctl kickstart` gibi harici bir tetikleyici geçidi yeniden etkinleştirene kadar `KeepAlive=true` ayarının dikkate alınmasını durdurabilir.

Yaygın belirtiler:

- `error.code` değeri `ENETDOWN` veya benzer bir kod olan ve çağrı yığını Node `net` `lookupAndConnect` / `Socket.connect` içine işaret eden bir kararlılık paketi. OpenClaw `2026.5.26` ve daha yeni sürümler bunları zararsız geçici ağ hataları olarak sınıflandırır; böylece artık üst düzey yakalanmamış hata işleyicisine yayılmazlar. Daha eski bir sürüm kullanıyorsanız önce yükseltin.
- Control UI'ye bağlandığınız veya ana makineye SSH ile eriştiğiniz anda sona eren uzun sessiz dönemler: launchd'nin yeniden başlatma geçidini yeniden etkinleştiren şey, panonun Gateway üzerinde yaptığı herhangi bir işlem değil, kullanıcı tarafından görülebilen etkinliktir.
- Gün boyunca karşılık gelen bir `received SIG*; shutting down` satırı `~/Library/Logs/openclaw/gateway.log` içinde bulunmadan artan `runs` sayısı: düzgün kapatmalar bir sinyal kaydeder; geçici çökmeler kaydetmez.

Yapılacaklar:

1. `2026.5.26` öncesi bir sürüm kullanıyorsanız **Gateway'i yükseltin**. Yükseltmeden sonra gelecekteki `ENETDOWN` hataları, işlemi sonlandırmak yerine uyarı olarak günlüğe kaydedilir.
2. Sürekli açık sunucular olarak çalışması amaçlanan Mac mini / masaüstü ana makinelerde **bakım uykusu etkinliğini azaltın**:

   ```bash
   sudo pmset -a sleep 0 disksleep 0 standby 0 powernap 0
   ```

   Bu, temeldeki sürücü kesintisini önemli ölçüde azaltır ancak tamamen ortadan kaldırmaz. Sistem, bu bayraklardan bağımsız olarak TCP keepalive ve mDNS bakımı için bazı bakım uykularını gerçekleştirmeye devam edebilir.

3. launchd tarafından beklemeye alınan gelecekteki bir çökme serisinin hızla algılanması için **bir canlılık izleyicisi ekleyin**:

   ```bash
   # 5 dakikalık bir Cron veya LaunchAgent için uygun, launchd'yi dikkate alan örnek canlılık denetimi
   state=$(launchctl print gui/$UID/ai.openclaw.gateway 2>/dev/null | awk -F'= ' '/state =/ {print $2; exit}')
   if [ "$state" != "running" ]; then
     launchctl kickstart -k gui/$UID/ai.openclaw.gateway
   fi
   ```

   Amaç, yeniden başlatma geçidini harici olarak yeniden etkinleştirmektir; macOS'te art arda çökmelerden sonra tek başına `KeepAlive=true` yeterli değildir.

İlgili:

- [macOS platform notları](/tr/platforms/macos)
- [Günlük kaydı](/tr/logging)
- [Doctor](/tr/gateway/doctor)

## Yinelenen Gateway/Node LaunchAgent'larıyla macOS launchd gözetmen döngüsü

Bir macOS kurulumu birkaç saniyede bir yeniden başlatılmaya devam ettiğinde, `openclaw`
sağlık denetimleri sağlıklı ve kullanılamaz durumları arasında gidip geldiğinde ve hizmet
çalışıyor gibi görünmesine rağmen kanal dağıtımı durduğunda bunu kullanın.

Bu durum, hem `ai.openclaw.gateway` hem de
`ai.openclaw.node` LaunchAgent'larının etkin olduğu ve her birinin
`OPENCLAW_LAUNCHD_LABEL` eklediği eski kurulumlarda gözlemlenmiştir. Bu durumda OpenClaw, launchd
gözetimini algılayabilir, yeniden başlatma işlemini launchd'ye devretmeye çalışabilir ve tek bir kararlı Gateway işlemi yerine hızlı bir
`EADDRINUSE`/yeniden başlatma döngüsüne girebilir.

```bash
for i in 1 2 3 4; do
  ps aux | grep 'openclaw.*index.js' | grep -v grep | awk '{print $2}'
  sleep 10
done

openclaw gateway status --deep
openclaw node status
launchctl print gui/$UID/ai.openclaw.gateway | grep -E 'state|last exit|runs'
tail -n 80 ~/Library/Logs/openclaw/gateway.log
```

Şunları arayın:

- 30 saniyelik örnek boyunca tek bir kararlı işlem yerine birden fazla Gateway PID'si.
- `gateway.log` içinde `EADDRINUSE`, `another gateway instance is already listening` veya yinelenen
  yeniden başlatma/devir satırları.
- Yalnızca tek bir yönetilen Gateway hizmeti çalıştırması gereken bir ana makinede hem `~/Library/LaunchAgents/ai.openclaw.gateway.plist` hem de
  `~/Library/LaunchAgents/ai.openclaw.node.plist` öğesinin aynı anda yüklenmiş olması.

Yapılacaklar:

1. Bu ana makinede yalnızca Gateway hizmeti çalışacaksa yönetilen Node
   hizmetini OpenClaw aracılığıyla kaldırın. Uzak Node özellikleri için Node
   hizmetini etkin olarak kullanıyorsanız **bu adımı atlayın**; hizmetin kaldırılması bu ana makinedeki
   söz konusu özellikleri durdurur:

   ```bash
   openclaw node uninstall
   ```

2. OpenClaw'ı başlatmadan önce devralınan launchd
   işaretlerini temizleyen kalıcı bir Gateway sarmalayıcısı kurun. Desteklenen `--wrapper` seçeneğini kullanın;
   `~/.openclaw/service-env/` altındaki oluşturulmuş dosyayı düzenlemeyin; çünkü hizmetin
   yeniden kurulması, güncellenmesi ve Doctor onarımı bu dosyayı yeniden oluşturur:

   ```bash
   mkdir -p ~/.local/bin
   cat >~/.local/bin/openclaw-launchd-workaround <<'EOF'
   #!/bin/sh
   set -eu
   unset OPENCLAW_LAUNCHD_LABEL LAUNCH_JOB_LABEL LAUNCH_JOB_NAME XPC_SERVICE_NAME || true
   exec openclaw "$@"
   EOF
   chmod 700 ~/.local/bin/openclaw-launchd-workaround

   openclaw gateway install \
     --wrapper ~/.local/bin/openclaw-launchd-workaround \
     --force
   ```

   `gateway install` zorunlu yeniden kurulumlar, güncellemeler ve doctor onarımları
   boyunca sarmalayıcı yolunu korur.

3. Gateway'in yalnızca dinlemede değil, kararlı ve RPC hizmeti veriyor olduğunu doğrulayın:

   ```bash
   openclaw gateway status --deep --require-rpc

   for i in 1 2 3 4; do
     ps aux | grep 'openclaw.*index.js' | grep -v grep | awk '{print $2}'
     sleep 10
   done
   ```

   PID örneği, sürekli değişen bir PID kümesi yerine tek bir kararlı işlem
   göstermeli ve gelen kanal yönlendirmesi devam etmelidir.

4. Temeldeki ikili LaunchAgent döngüsünün düzeltildiği bir sürüme
   yükselttikten sonra geçici çözümü kaldırın ve normal yönetilen hizmeti yeniden kurun:

   ```bash
   OPENCLAW_WRAPPER= openclaw gateway install --force
   rm ~/.local/bin/openclaw-launchd-workaround
   ```

İlgili:

- [macOS platform notları](/tr/platforms/mac/bundled-gateway)
- [Doctor](/tr/gateway/doctor)
- [Gateway CLI](/tr/cli/gateway)

## Yüksek bellek kullanımı sırasında Gateway kapanıyor

Gateway yük altında kaybolduğunda, denetleyici OOM türünde bir yeniden başlatma bildirdiğinde veya günlüklerde `critical memory pressure bundle written` ifadesi geçtiğinde kullanın.

```bash
openclaw gateway status --deep
openclaw logs --follow
openclaw gateway stability --bundle latest
openclaw gateway diagnostics export
```

Şunları arayın:

- En son kararlılık paketinde `Reason: diagnostic.memory.pressure.critical`.
- `critical/rss_threshold`, `critical/heap_threshold` veya `critical/rss_growth` ile birlikte `Memory pressure:`.
- Yığın sınırına yakın `V8 heap:` değerleri.
- `agents/<agent>/sessions/<session>.jsonl` veya `sessions/<session>.jsonl` gibi `Largest session files:` girdileri.
- Gateway bir kapsayıcı veya belleği sınırlı hizmet içinde çalışırken Linux cgroup bellek sayaçları.

Yaygın belirtiler:

- `critical memory pressure bundle written` yeniden başlatmadan kısa süre önce görünür → OpenClaw, OOM öncesi kararlılık paketini yakalamıştır. Paketi `openclaw gateway stability --bundle latest` ile inceleyin.
- `memory pressure: level=critical ... memoryPressureSnapshot=disabled` Gateway günlüklerinde görünür → OpenClaw kritik bellek baskısı algılamıştır ancak OOM öncesi kararlılık anlık görüntüsü kapalıdır.
- `Largest session files:` çok büyük, redakte edilmiş bir transkript yolunu gösterir → tutulan oturum geçmişini azaltın, oturum büyümesini inceleyin veya yeniden başlatmadan önce eski transkriptleri etkin depodan çıkarın.
- `V8 heap:` kullanılan baytları yığın sınırına yakındır → istem/oturum baskısını azaltın, eşzamanlı işi azaltın veya yalnızca iş yükünün beklendiğini doğruladıktan sonra Node yığın sınırını yükseltin.
- `Memory pressure: critical/rss_growth` → bellek tek bir örnekleme aralığında hızla büyümüştür. Büyük bir içe aktarma, kontrolden çıkan araç çıktısı, yinelenen denemeler veya kuyruğa alınmış bir grup agent işi için en son günlükleri kontrol edin.
- Günlüklerde kritik bellek baskısı görünür ancak paket yoktur → varsayılan davranış budur. Gelecekteki kritik bellek baskısı olaylarında OOM öncesi kararlılık paketini yakalamak için `diagnostics.memoryPressureSnapshot: true` değerini ayarlayın.

Kararlılık paketi yük içermez. İleti metni, webhook gövdeleri, kimlik bilgileri, token'lar, çerezler veya ham oturum kimlikleri değil; operasyonel bellek kanıtları ve redakte edilmiş göreli dosya yolları içerir. Hata raporlarına ham günlükleri kopyalamak yerine tanılama dışa aktarımını ekleyin.

İlgili:

- [Gateway durumu](/tr/gateway/health)
- [Tanılama dışa aktarımı](/tr/gateway/diagnostics)
- [Oturumlar](/tr/cli/sessions)

## Gateway geçersiz yapılandırmayı reddetti

Gateway başlatma işlemi `Invalid config` ile başarısız olduğunda veya çalışırken yeniden yükleme günlükleri geçersiz bir düzenlemeyi atladığını belirttiğinde kullanın.

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
- Etkin yapılandırmanın yanında zaman damgalı bir `openclaw.json.rejected.*` dosyası.
- `doctor --fix` bozuk bir doğrudan düzenlemeyi onardıysa zaman damgalı bir `openclaw.json.clobbered.*` dosyası.
- OpenClaw, her yapılandırma yolu için en son 32 `.clobbered.*` dosyasını tutar ve daha eskilerini dönüşümlü olarak kaldırır.

<AccordionGroup>
  <Accordion title="Ne oldu">
    - Yapılandırma; başlatma, çalışırken yeniden yükleme veya OpenClaw tarafından gerçekleştirilen bir yazma işlemi sırasında doğrulanamadı.
    - Gateway başlatma işlemi, `openclaw.json` dosyasını yeniden yazmak yerine güvenli biçimde başarısız olur.
    - Çalışırken yeniden yükleme, geçersiz harici düzenlemeleri atlar ve mevcut çalışma zamanı yapılandırmasını etkin tutar.
    - OpenClaw tarafından gerçekleştirilen yazma işlemleri, geçersiz/yıkıcı yükleri kaydetmeden önce reddeder ve `.rejected.*` dosyasını kaydeder.
    - Onarımın sahibi `openclaw doctor --fix` olur. JSON olmayan önekleri kaldırabilir veya reddedilen yükü `.clobbered.*` olarak korurken bilinen son sağlam kopyayı geri yükleyebilir.
    - Tek bir yapılandırma yolu için çok sayıda onarım gerçekleştiğinde OpenClaw, en yeni onarılmış yükün kullanılabilir kalması için eski `.clobbered.*` dosyalarını dönüşümlü olarak kaldırır.

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
  <Accordion title="Yaygın belirtiler">
    - `.clobbered.*` mevcut → doctor, etkin yapılandırmayı onarırken bozuk bir harici düzenlemeyi korudu.
    - `.rejected.*` mevcut → OpenClaw tarafından gerçekleştirilen bir yapılandırma yazma işlemi, kaydetme öncesinde şema veya üzerine yazma denetimlerinden geçemedi.
    - `Config write rejected:` → yazma işlemi gerekli yapıyı kaldırmaya, dosyayı ciddi ölçüde küçültmeye veya geçersiz yapılandırmayı kalıcı hâle getirmeye çalıştı.
    - `config reload skipped (invalid config):` → doğrudan düzenleme doğrulamadan geçemedi ve çalışan Gateway tarafından yok sayıldı.
    - `Invalid config at ...` → başlatma, Gateway hizmetleri çalıştırılmadan önce başarısız oldu.
    - `missing-meta-vs-last-good`, `gateway-mode-missing-vs-last-good` veya `size-drop-vs-last-good:*` → OpenClaw tarafından gerçekleştirilen bir yazma işlemi, bilinen son iyi yedeklemeye kıyasla alanları veya boyutu kaybettiği için reddedildi.
    - `Config last-known-good promotion skipped` → aday, `***` gibi gizlenmiş gizli bilgi yer tutucuları içeriyordu.

  </Accordion>
  <Accordion title="Düzeltme seçenekleri">
    1. doctor aracının önekli/üzerine yazılmış yapılandırmayı onarması veya bilinen son iyi sürümü geri yüklemesi için `openclaw doctor --fix` komutunu çalıştırın.
    2. Yalnızca amaçlanan anahtarları `.clobbered.*` veya `.rejected.*` içinden kopyalayın, ardından bunları `openclaw config set` veya `config.patch` ile uygulayın.
    3. Yeniden başlatmadan önce `openclaw config validate` komutunu çalıştırın.
    4. Elle düzenlerseniz yalnızca değiştirmek istediğiniz kısmi nesneyi değil, JSON5 yapılandırmasının tamamını koruyun.
  </Accordion>
</AccordionGroup>

İlgili:

- [Yapılandırma](/tr/cli/config)
- [Yapılandırma: çalışırken yeniden yükleme](/tr/gateway/configuration#config-hot-reload)
- [Yapılandırma: katı doğrulama](/tr/gateway/configuration#strict-validation)
- [Doctor](/tr/gateway/doctor)

## Gateway yoklama uyarıları

`openclaw gateway probe` bir şeye ulaştığı hâlde yine de bir uyarı bloğu yazdırdığında kullanın.

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

Şunlara bakın:

- JSON çıktısındaki `warnings[].code` ve `primaryTargetId`.
- Uyarının SSH geri dönüşü, birden fazla Gateway, eksik kapsamlar veya çözümlenmemiş kimlik doğrulama başvuruları hakkında olup olmadığı.

Yaygın belirtiler:

- `SSH tunnel failed to start; falling back to direct probes.` → SSH kurulumu başarısız oldu ancak komut yine de doğrudan yapılandırılmış/geri döngü hedeflerini denedi.
- `multiple reachable gateway identities detected` → farklı Gateway'ler yanıt verdi veya OpenClaw, erişilebilir hedeflerin aynı Gateway olduğunu kanıtlayamadı. Aynı Gateway'e giden bir SSH tüneli, proxy URL'si veya yapılandırılmış uzak URL, aktarım bağlantı noktaları farklı olsa bile birden fazla aktarıma sahip tek bir Gateway olarak değerlendirilir.
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → bağlantı kuruldu ancak ayrıntı RPC'si kapsamla sınırlı; cihaz kimliğini eşleştirin veya `operator.read` kapsamına sahip kimlik bilgileri kullanın.
- `Gateway accepted the WebSocket connection, but follow-up read diagnostics failed` → bağlantı kuruldu ancak tam tanılama RPC kümesi zaman aşımına uğradı veya başarısız oldu. Bunu tanılama özellikleri kısıtlanmış erişilebilir bir Gateway olarak değerlendirin; `--json` çıktısındaki `connect.ok` ve `connect.rpcOk` değerlerini karşılaştırın.
- `Capability: pairing-pending` veya `gateway closed (1008): pairing required` → Gateway yanıt verdi ancak bu istemcinin normal operatör erişiminden önce hâlâ eşleştirilmesi/onaylanması gerekiyor.
- Çözümlenmemiş `gateway.auth.*` / `gateway.remote.*` SecretRef uyarı metni → başarısız hedef için bu komut yolunda kimlik doğrulama malzemesi kullanılamıyordu.

İlgili:

- [Gateway](/tr/cli/gateway)
- [Aynı ana makinede birden fazla Gateway](/tr/gateway#multiple-gateways-same-host)
- [Uzaktan erişim](/tr/gateway/remote)

## Kanal bağlı ancak iletiler akmıyor

Kanal durumu bağlıysa ancak ileti akışı durmuşsa ilkeye, izinlere ve kanala özgü teslimat kurallarına odaklanın.

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

Yaygın belirtiler:

- `mention required` → ileti, grup bahsetme ilkesi tarafından yok sayıldı.
- `pairing` / bekleyen onay izleri → gönderen onaylanmamış.
- `missing_scope`, `not_in_channel`, `Forbidden`, `401/403` → kanal kimlik doğrulaması/izinleri sorunu.

İlgili:

- [Kanal sorunlarını giderme](/tr/channels/troubleshooting)
- [Discord](/tr/channels/discord)
- [Telegram](/tr/channels/telegram)
- [WhatsApp](/tr/channels/whatsapp)

## Cron ve Heartbeat teslimatı

Cron veya Heartbeat çalışmadıysa ya da teslimat yapmadıysa önce zamanlayıcı durumunu, ardından teslimat hedefini doğrulayın.

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

Şunlara bakın:

- Cron'un etkin olması ve sonraki uyanma zamanının bulunması.
- İş çalıştırma geçmişinin durumu (`ok`, `skipped`, `error`).
- Heartbeat atlama nedenleri (`quiet-hours`, `requests-in-flight`, `cron-in-progress`, `lanes-busy`, `alerts-disabled`, `empty-heartbeat-file`, `no-tasks-due`).

<AccordionGroup>
  <Accordion title="Yaygın belirtiler">
    - `cron: scheduler disabled; jobs will not run automatically` → Cron devre dışı.
    - `cron: timer tick failed` → zamanlayıcı çevrimi başarısız oldu; dosya/günlük/çalışma zamanı hatalarını kontrol edin.
    - `heartbeat skipped` ile `reason=quiet-hours` → etkin saatler penceresinin dışında.
    - `heartbeat skipped` ile `reason=empty-heartbeat-file` → `HEARTBEAT.md` mevcut ancak yalnızca boşluk, yorum, başlık, çit veya boş kontrol listesi iskeleti içeriyor; bu nedenle OpenClaw model çağrısını atlıyor.
    - `heartbeat skipped` ile `reason=no-tasks-due` → `HEARTBEAT.md` bir `tasks:` bloğu içeriyor ancak bu çevrimde hiçbir görevin zamanı gelmemiş.
    - `heartbeat: unknown accountId` → Heartbeat teslimat hedefi için geçersiz hesap kimliği.
    - `heartbeat skipped` ile `reason=dm-blocked` → Heartbeat hedefi, `agents.defaults.heartbeat.directPolicy` (veya aracı başına geçersiz kılma) `block` olarak ayarlanmışken DM tarzı bir hedefe çözümlendi.

  </Accordion>
</AccordionGroup>

İlgili:

- [Heartbeat](/tr/gateway/heartbeat)
- [Zamanlanmış görevler](/tr/automation/cron-jobs)
- [Zamanlanmış görevler: sorun giderme](/tr/automation/cron-jobs#troubleshooting)

## Node eşleştirildi ancak araç başarısız oluyor

Bir Node eşleştirildiği hâlde araçlar başarısız oluyorsa ön plan, izin ve onay durumlarını ayrı ayrı inceleyin.

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

Şunlara bakın:

- Node'un beklenen yeteneklerle çevrimiçi olması.
- Kamera/mikrofon/konum/ekran için işletim sistemi izinleri.
- Çalıştırma onayları ve izin listesi durumu.

Yaygın belirtiler:

- `NODE_BACKGROUND_UNAVAILABLE` → Node uygulaması ön planda olmalıdır.
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → işletim sistemi izni eksik.
- `SYSTEM_RUN_DENIED: approval required` → çalıştırma onayı bekliyor.
- `SYSTEM_RUN_DENIED: allowlist miss` → komut izin listesi tarafından engellendi.

İlgili:

- [Çalıştırma onayları](/tr/tools/exec-approvals)
- [Node sorunlarını giderme](/tr/nodes/troubleshooting)
- [Node'lar](/tr/nodes/index)

## Tarayıcı aracı başarısız oluyor

Gateway'in kendisi sağlıklı olduğu hâlde tarayıcı aracı eylemleri başarısız olduğunda kullanın.

```bash
openclaw browser status
openclaw browser start --browser-profile openclaw
openclaw browser profiles
openclaw logs --follow
openclaw doctor
```

Şunlara bakın:

- `plugins.allow` ayarının yapılıp yapılmadığına ve `browser` değerini içerip içermediğine.
- Geçerli tarayıcı yürütülebilir dosya yolu.
- CDP profilinin erişilebilirliği.
- `existing-session` / `user` profilleri için yerel Chrome kullanılabilirliği.

<AccordionGroup>
  <Accordion title="Plugin / yürütülebilir dosya belirtileri">
    - `unknown command "browser"` veya `unknown command 'browser'` → paketle birlikte gelen tarayıcı Plugin'i `plugins.allow` tarafından hariç tutuluyor.
    - `browser.enabled=true` iken tarayıcı aracı eksik / kullanılamıyor → `plugins.allow`, `browser` değerini hariç tutuyor; bu nedenle Plugin hiç yüklenmedi.
    - `Failed to start Chrome CDP on port` → tarayıcı işlemi başlatılamadı.
    - `browser.executablePath not found` → yapılandırılmış yol geçersiz.
    - `browser.cdpUrl must be http(s) or ws(s)` → yapılandırılmış CDP URL'si `file:` veya `ftp:` gibi desteklenmeyen bir şema kullanıyor.
    - `browser.cdpUrl has invalid port` → yapılandırılmış CDP URL'sindeki bağlantı noktası hatalı veya aralık dışında.
    - `Playwright is not available in this gateway build; '<feature>' is unsupported.` → mevcut Gateway kurulumunda temel tarayıcı çalışma zamanı bağımlılığı eksik; OpenClaw'u yeniden yükleyin veya güncelleyin, ardından Gateway'i yeniden başlatın. ARIA anlık görüntüleri ve temel sayfa ekran görüntüleri çalışmaya devam edebilir ancak gezinme, AI anlık görüntüleri, CSS seçicili öğe ekran görüntüleri ve PDF dışa aktarma kullanılamaz.

  </Accordion>
  <Accordion title="Chrome MCP / mevcut oturum belirtileri">
    - `Could not find DevToolsActivePort for chrome` → Chrome MCP mevcut oturumu henüz seçilen tarayıcı veri dizinine bağlanamadı. Tarayıcı inceleme sayfasını açın, uzaktan hata ayıklamayı etkinleştirin, tarayıcıyı açık tutun, ilk bağlantı istemini onaylayın ve yeniden deneyin. Oturum açılmış durum gerekli değilse yönetilen `openclaw` profilini tercih edin.
    - `No browser tabs found for profile="user"` → Chrome MCP bağlantı profilinde açık yerel Chrome sekmesi yok.
    - `Remote CDP for profile "<name>" is not reachable` → yapılandırılmış uzak CDP uç noktasına Gateway ana makinesinden erişilemiyor.
    - `Browser attachOnly is enabled ... not reachable` veya `Browser attachOnly is enabled and CDP websocket ... is not reachable` → yalnızca bağlantı profili için erişilebilir hedef yok ya da HTTP uç noktası yanıt verdi ancak CDP WebSocket yine de açılamadı.

  </Accordion>
  <Accordion title="Öğe / ekran görüntüsü / yükleme belirtileri">
    - `fullPage is not supported for element screenshots` → ekran görüntüsü isteği `--full-page` ile `--ref` veya `--element` değerlerini birlikte kullandı.
    - `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → Chrome MCP / `existing-session` ekran görüntüsü çağrıları CSS `--element` yerine sayfa yakalamayı veya anlık görüntü `--ref` değerini kullanmalıdır.
    - `existing-session file uploads do not support element selectors; use ref/inputRef.` → Chrome MCP yükleme kancaları CSS seçiciler yerine anlık görüntü başvuruları gerektirir.
    - `existing-session file uploads currently support one file at a time.` → Chrome MCP profillerinde çağrı başına bir yükleme gönderin.
    - `existing-session dialog handling does not support timeoutMs.` → Chrome MCP profillerindeki iletişim kutusu kancaları zaman aşımı geçersiz kılmalarını desteklemez.
    - `existing-session type does not support timeoutMs overrides.` → `profile="user"` / Chrome MCP mevcut oturum profillerinde `act:type` için `timeoutMs` değerini belirtmeyin veya özel bir zaman aşımı gerektiğinde yönetilen/CDP tarayıcı profili kullanın.
    - `response body is not supported for existing-session profiles yet.` → `responsebody` hâlâ yönetilen bir tarayıcı veya ham CDP profili gerektirir.
    - Yalnızca bağlantı veya uzak CDP profillerinde eski görünüm alanı / koyu mod / yerel ayar / çevrimdışı geçersiz kılmaları → tüm Gateway'i yeniden başlatmadan etkin denetim oturumunu kapatmak ve Playwright/CDP öykünme durumunu serbest bırakmak için `openclaw browser stop --browser-profile <name>` komutunu çalıştırın.

  </Accordion>
</AccordionGroup>

İlgili:

- [Tarayıcı (OpenClaw tarafından yönetilen)](/tr/tools/browser)
- [Tarayıcı sorunlarını giderme](/tr/tools/browser-linux-troubleshooting)

## Yükseltme yaptıysanız ve bir şey aniden bozulduysa

Yükseltme sonrasındaki bozulmaların çoğu, yapılandırma sapmasından veya artık uygulanan daha katı varsayılanlardan kaynaklanır.

<AccordionGroup>
  <Accordion title="1. Kimlik doğrulama ve URL geçersiz kılma davranışı değişti">
    ```bash
    openclaw gateway status
    openclaw config get gateway.mode
    openclaw config get gateway.remote.url
    openclaw config get gateway.auth.mode
    ```

    Kontrol edilecekler:

    - Eğer `gateway.mode=remote` ise, yerel hizmetiniz sorunsuz olsa da CLI çağrıları uzak hedefe yöneliyor olabilir.
    - Açıkça belirtilen `--url` çağrıları, saklanan kimlik bilgilerine geri dönmez.

    Yaygın belirtiler:

    - `gateway connect failed:` → yanlış URL hedefi.
    - `unauthorized` → uç noktaya erişilebiliyor ancak kimlik doğrulama yanlış.

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

    - Geri döngü dışı bağlamalar (`lan`, `tailnet`, `custom`) geçerli bir Gateway kimlik doğrulama yolu gerektirir: paylaşılan belirteç/parola kimlik doğrulaması veya doğru yapılandırılmış bir geri döngü dışı `trusted-proxy` dağıtımı.
    - `gateway.token` gibi eski anahtarlar, `gateway.auth.token` yerine geçmez.

    Yaygın belirtiler:

    - `refusing to bind gateway ... without auth` → geçerli bir Gateway kimlik doğrulama yolu olmadan geri döngü dışı bağlama.
    - Çalışma zamanı çalışırken `Connectivity probe: failed` → Gateway etkin ancak mevcut kimlik doğrulama/URL ile erişilemiyor.

  </Accordion>
  <Accordion title="3. Eşleştirme ve cihaz kimliği durumu değişti">
    ```bash
    openclaw devices list
    openclaw pairing list --channel <channel> [--account <id>]
    openclaw logs --follow
    openclaw doctor
    ```

    Kontrol edilecekler:

    - Kontrol paneli/Node'lar için bekleyen cihaz onayları.
    - İlke veya kimlik değişikliklerinden sonra bekleyen doğrudan mesaj eşleştirme onayları.

    Yaygın belirtiler:

    - `device identity required` → cihaz kimlik doğrulaması karşılanmadı.
    - `pairing required` → gönderen/cihaz onaylanmalıdır.

  </Accordion>
</AccordionGroup>

Kontrollerden sonra hizmet yapılandırması ile çalışma zamanı hâlâ uyuşmuyorsa hizmet meta verilerini aynı profil/durum dizininden yeniden yükleyin:

```bash
openclaw gateway install --force
openclaw gateway restart
```

İlgili:

- [Kimlik doğrulama](/tr/gateway/authentication)
- [Arka planda yürütme ve işlem aracı](/tr/gateway/background-process)
- [Node eşleştirme](/tr/gateway/pairing)

## İlgili

- [Doctor](/tr/gateway/doctor)
- [SSS](/tr/help/faq)
- [Gateway çalışma kitabı](/tr/gateway)
