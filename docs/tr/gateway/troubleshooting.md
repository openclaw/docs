---
read_when:
    - Sorun giderme merkezi daha derin tanılama için sizi buraya yönlendirdi
    - Kesin komutlarla kararlı, belirti tabanlı runbook bölümlerine ihtiyacınız var
sidebarTitle: Troubleshooting
summary: Gateway, kanallar, otomasyon, düğümler ve tarayıcı için derin sorun giderme çalışma kitabı
title: Sorun giderme
x-i18n:
    generated_at: "2026-06-28T00:39:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4ce8e8aed5c3e00be5b093875222962c22883472802e164534dae32adc5365c5
    source_path: gateway/troubleshooting.md
    workflow: 16
---

Bu sayfa ayrıntılı çalıştırma kılavuzudur. Önce hızlı triyaj akışını istiyorsanız [/help/troubleshooting](/tr/help/troubleshooting) ile başlayın.

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
- `openclaw channels status --probe`, canlı hesap bazında aktarım durumunu ve desteklendiği yerde `works` veya `audit ok` gibi prob/denetim sonuçlarını gösterir.

## Güncellemeden sonra

Bunu, güncelleme tamamlandığında ancak Gateway kapalı olduğunda, kanallar boş olduğunda veya
model çağrıları 401'lerle başarısız olmaya başladığında kullanın.

```bash
openclaw status --all
openclaw update status --json
openclaw gateway status --deep
openclaw doctor --fix
openclaw gateway restart
```

Şunlara bakın:

- `openclaw status` / `openclaw status --all` içinde `Update restart`. Bekleyen veya
  başarısız devirler, çalıştırılacak sonraki komutu içerir.
- Channels altında `plugin load failed: dependency tree corrupted; run openclaw doctor --fix`.
  Bu, kanal yapılandırmasının hâlâ var olduğu, ancak Plugin
  kaydının kanal yüklenmeden önce başarısız olduğu anlamına gelir.
- yeniden kimlik doğrulamadan sonra sağlayıcı 401'leri. `openclaw doctor --fix`, eski
  ajan başına OAuth kimlik doğrulama gölgelerini denetler ve eski kopyaları kaldırır; böylece tüm ajanlar
  geçerli paylaşılan profili çözer.

## Bölünmüş kurulumlar ve daha yeni yapılandırma koruması

Bunu, bir Gateway hizmeti bir güncellemeden sonra beklenmedik şekilde durduğunda veya günlükler bir `openclaw` ikilisinin `openclaw.json` dosyasını son yazan sürümden daha eski olduğunu gösterdiğinde kullanın.

OpenClaw, yapılandırma yazmalarını `meta.lastTouchedVersion` ile damgalar. Salt okunur komutlar, daha yeni bir OpenClaw tarafından yazılmış yapılandırmayı yine de inceleyebilir, ancak işlem ve hizmet mutasyonları daha eski bir ikiliden devam etmeyi reddeder. Engellenen eylemler arasında gateway hizmetini başlatma, durdurma, yeniden başlatma, kaldırma, zorunlu hizmet yeniden kurulumu, hizmet modunda gateway başlatma ve `gateway --force` port temizleme yer alır.

```bash
which openclaw
openclaw --version
openclaw gateway status --deep
openclaw config get meta.lastTouchedVersion
```

<Steps>
  <Step title="PATH'i düzeltin">
    `PATH` değerini, `openclaw` daha yeni kuruluma çözümlenecek şekilde düzeltin, ardından eylemi yeniden çalıştırın.
  </Step>
  <Step title="Gateway hizmetini yeniden kurun">
    Amaçlanan gateway hizmetini daha yeni kurulumdan yeniden kurun:

    ```bash
    openclaw gateway install --force
    openclaw gateway restart
    ```

  </Step>
  <Step title="Eski sarmalayıcıları kaldırın">
    Hâlâ eski bir `openclaw` ikilisini işaret eden eski sistem paketi veya eski sarmalayıcı girdilerini kaldırın.
  </Step>
</Steps>

<Warning>
Yalnızca kasıtlı sürüm düşürme veya acil kurtarma için tek komutta `OPENCLAW_ALLOW_OLDER_BINARY_DESTRUCTIVE_ACTIONS=1` ayarlayın. Normal işlem için ayarsız bırakın.
</Warning>

## Geri alma sonrası protokol uyuşmazlığı

Bunu, OpenClaw sürümünü düşürdükten veya geri aldıktan sonra günlükler `protocol mismatch` yazdırmaya devam ettiğinde kullanın. Bu, daha eski bir Gateway çalıştığı, ancak daha yeni bir yerel istemci işleminin hâlâ daha eski Gateway'in konuşamadığı bir protokol aralığıyla yeniden bağlanmaya çalıştığı anlamına gelir.

```bash
openclaw --version
which -a openclaw
openclaw gateway status --deep
openclaw doctor --deep
openclaw logs --follow
```

Şunlara bakın:

- Gateway günlüklerinde `protocol mismatch ... client=... v<version> min=<n> max=<n> expected=<n>`.
- `openclaw gateway status --deep` içinde `Established clients:` veya `openclaw doctor --deep` içinde `Gateway clients`. Bu, işletim sistemi izin verdiğinde PID'ler ve komut satırları dahil olmak üzere Gateway portuna bağlı etkin TCP istemcilerini listeler.
- Komut satırı geri aldığınız daha yeni OpenClaw kurulumunu veya sarmalayıcısını işaret eden bir istemci işlemi.

Düzeltme:

1. `gateway status --deep` tarafından gösterilen eski OpenClaw istemci işlemini durdurun veya yeniden başlatın.
2. Yerel panolar, düzenleyiciler, uygulama sunucusu yardımcıları veya uzun süre çalışan `openclaw logs --follow` kabukları gibi OpenClaw'ı gömen uygulamaları veya sarmalayıcıları yeniden başlatın.
3. `openclaw gateway status --deep` veya `openclaw doctor --deep` komutunu yeniden çalıştırın ve eski istemci PID'sinin gittiğini doğrulayın.

Daha eski bir Gateway'in daha yeni uyumsuz bir protokolü kabul etmesini sağlamayın. Protokol artışları kablo sözleşmesini korur; geri alma kurtarması bir işlem/sürüm temizleme sorunudur.

## Skill sembolik bağlantısı yol kaçışı olarak atlandı

Günlükler şunu içerdiğinde bunu kullanın:

```text
Skipping escaped skill path outside its configured root: ... reason=symlink-escape
```

OpenClaw her skill kökünü bir kapsama sınırı olarak ele alır. `~/.agents/skills`, `<workspace>/.agents/skills`, `<workspace>/skills` veya
`~/.openclaw/skills` altındaki bir sembolik bağlantı, gerçek hedefi açıkça güvenilir olarak tanımlanmadıkça o kökün dışına çözümlendiğinde atlanır.

Bağlantıyı inceleyin:

```bash
ls -l ~/.agents/skills/<name>
realpath ~/.agents/skills/<name>
openclaw config get skills.load
```

Hedef kasıtlıysa hem doğrudan skill kökünü hem de
izin verilen sembolik bağlantı hedefini yapılandırın:

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

Ardından yeni bir oturum başlatın veya skills izleyicisinin yenilenmesini bekleyin. Çalışan işlem yapılandırma değişikliğinden eskiyse
gateway'i yeniden başlatın.

`~`, `/` veya tüm senkronize edilmiş proje klasörü gibi geniş hedefler kullanmayın.
`allowSymlinkTargets` kapsamını, güvenilir
`SKILL.md` dizinlerini içeren gerçek skill köküyle sınırlı tutun.

Skill Workshop apply'in bu güvenilir sembolik bağlantılı
çalışma alanı skill yollarına da yazması gerekiyorsa `skills.workshop.allowSymlinkTargetWrites` ayarını etkinleştirin.
Salt okunur paylaşılan skill kökleri için devre dışı bırakın.

İlgili:

- [Skills yapılandırması](/tr/tools/skills-config#symlinked-skill-roots)
- [Yapılandırma örnekleri](/tr/gateway/configuration-examples#symlinked-sibling-skill-repo)

## Anthropic 429 uzun bağlam için ek kullanım gerektiriyor

Günlükler/hatalar şunu içerdiğinde bunu kullanın: `HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

Şunlara bakın:

- Seçilen Anthropic modeli, GA özellikli 1M Claude 4.x modelidir veya modelde eski `params.context1m: true` vardır.
- Geçerli Anthropic kimlik bilgisi uzun bağlam kullanımı için uygun değildir.
- İstekler yalnızca 1M bağlam yoluna ihtiyaç duyan uzun oturumlarda/model çalıştırmalarında başarısız olur.

Düzeltme seçenekleri:

<Steps>
  <Step title="Standart bağlam penceresi kullanın">
    Standart pencereli bir modele geçin veya 1M bağlam için GA özellikli olmayan eski
    model yapılandırmasından `context1m` değerini kaldırın.
  </Step>
  <Step title="Uygun kimlik bilgisi kullanın">
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

## Yukarı akış 403 engellenmiş yanıtları

Bunu, yukarı akış LLM sağlayıcısı `Your request was blocked` gibi genel bir `403` döndürdüğünde kullanın.

Bunun her zaman bir OpenClaw yapılandırma sorunu olduğunu varsaymayın. Yanıt, OpenAI uyumlu bir uç noktanın önündeki CDN, WAF, bot yönetimi kuralı veya ters proxy gibi bir yukarı akış güvenlik katmanından gelebilir.

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
```

Şunlara bakın:

- aynı sağlayıcı altındaki birden fazla modelin aynı şekilde başarısız olması
- normal sağlayıcı API hatası yerine HTML veya genel güvenlik metni
- aynı istek zamanı için sağlayıcı tarafı güvenlik olayları
- normal SDK biçimli istekler başarısız olurken küçük bir doğrudan `curl` probunun başarılı olması

Kanıt bir WAF/CDN engeline işaret ettiğinde önce sağlayıcı tarafı filtrelemeyi düzeltin. OpenClaw'ın kullandığı API yolu için dar kapsamlı bir izin veya atlama kuralını tercih edin ve tüm site için korumayı devre dışı bırakmaktan kaçının.

<Warning>
Başarılı bir minimal `curl`, gerçek SDK tarzı isteklerin aynı yukarı akış güvenlik katmanından geçeceğini garanti etmez.
</Warning>

İlgili:

- [OpenAI uyumlu uç noktalar](/tr/gateway/configuration-reference#openai-compatible-endpoints)
- [Sağlayıcı yapılandırması](/tr/providers)
- [Günlükler](/tr/logging)

## Yerel OpenAI uyumlu arka uç doğrudan probları geçiyor ancak ajan çalıştırmaları başarısız oluyor

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

Şunlara bakın:

- doğrudan küçük çağrılar başarılı olur, ancak OpenClaw çalıştırmaları yalnızca daha büyük promptlarda başarısız olur
- doğrudan `/v1/chat/completions` aynı çıplak model kimliğiyle çalışsa bile `model_not_found` veya 404 hataları
- `messages[].content` için dize beklediğini belirten arka uç hataları
- OpenAI uyumlu yerel arka uçla aralıklı `incomplete turn detected ... stopReason=stop payloads=0` uyarıları
- yalnızca daha büyük prompt-token sayıları veya tam ajan çalışma zamanı promptlarında görünen arka uç çökmeleri

<AccordionGroup>
  <Accordion title="Yaygın imzalar">
    - Yerel MLX/vLLM tarzı sunucuyla `model_not_found` → `baseUrl` değerinin `/v1` içerdiğini, `/v1/chat/completions` arka uçları için `api` değerinin `"openai-completions"` olduğunu ve `models.providers.<provider>.models[].id` değerinin çıplak sağlayıcı-yerel kimlik olduğunu doğrulayın. Bunu sağlayıcı önekiyle bir kez seçin, örneğin `mlx/mlx-community/Qwen3-30B-A3B-6bit`; katalog girdisini `mlx-community/Qwen3-30B-A3B-6bit` olarak tutun.
    - `messages[...].content: invalid type: sequence, expected a string` → arka uç yapılandırılmış Chat Completions içerik parçalarını reddeder. Düzeltme: `models.providers.<provider>.models[].compat.requiresStringContent: true` ayarlayın.
    - `validation.keys` veya `["role","content"]` gibi izin verilen ileti anahtarları → arka uç, Chat Completions iletilerinde OpenAI tarzı yeniden oynatma meta verilerini reddeder. Düzeltme: `models.providers.<provider>.models[].compat.strictMessageKeys: true` ayarlayın.
    - `incomplete turn detected ... stopReason=stop payloads=0` → arka uç Chat Completions isteğini tamamladı ancak o tur için kullanıcıya görünür asistan metni döndürmedi. OpenClaw, yeniden oynatma açısından güvenli boş OpenAI uyumlu turları bir kez yeniden dener; kalıcı başarısızlıklar genellikle arka ucun boş/metin dışı içerik yaydığı veya son yanıt metnini bastırdığı anlamına gelir.
    - doğrudan küçük istekler başarılı olur, ancak OpenClaw ajan çalıştırmaları arka uç/model çökmeleriyle başarısız olur (örneğin bazı `inferrs` derlemelerinde Gemma) → OpenClaw aktarımı muhtemelen zaten doğrudur; arka uç daha büyük ajan çalışma zamanı prompt biçiminde başarısız oluyordur.
    - araçlar devre dışı bırakıldıktan sonra hatalar azalır ancak kaybolmaz → araç şemaları baskının bir parçasıydı, ancak kalan sorun hâlâ yukarı akış model/sunucu kapasitesi veya bir arka uç hatasıdır.

  </Accordion>
  <Accordion title="Düzeltme seçenekleri">
    1. Yalnızca dize kabul eden Chat Completions arka uçları için `compat.requiresStringContent: true` ayarlayın.
    2. Her iletide yalnızca `role` ve `content` kabul eden katı Chat Completions arka uçları için `compat.strictMessageKeys: true` ayarlayın.
    3. OpenClaw'ın araç şeması yüzeyini güvenilir biçimde işleyemeyen modeller/arka uçlar için `compat.supportsTools: false` ayarlayın.
    4. Mümkün olduğunda prompt baskısını azaltın: daha küçük çalışma alanı başlangıcı, daha kısa oturum geçmişi, daha hafif yerel model veya daha güçlü uzun bağlam desteğine sahip bir arka uç.
    5. Küçük doğrudan istekler geçmeye devam ederken OpenClaw ajan turları hâlâ arka uç içinde çöküyorsa bunu yukarı akış sunucu/model sınırlaması olarak ele alın ve kabul edilen yük biçimiyle orada bir repro dosyalayın.
  </Accordion>
</AccordionGroup>

İlgili:

- [Yapılandırma](/tr/gateway/configuration)
- [Yerel modeller](/tr/gateway/local-models)
- [OpenAI uyumlu uç noktalar](/tr/gateway/configuration-reference#openai-compatible-endpoints)

## Yanıt yok

Kanallar çalışıyor ancak hiçbir şey yanıt vermiyorsa, herhangi bir şeyi yeniden bağlamadan önce yönlendirmeyi ve politikayı kontrol edin.

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

Şunlara bakın:

- DM gönderenleri için eşleştirme beklemede.
- Grup bahsi kapısı (`requireMention`, `mentionPatterns`).
- Kanal/grup izin listesi uyumsuzlukları.

Yaygın imzalar:

- `drop guild message (mention required` → grup mesajı bahsedilene kadar yok sayıldı.
- `pairing request` → gönderenin onaya ihtiyacı var.
- `blocked` / `allowlist` → gönderen/kanal politika tarafından filtrelendi.

İlgili:

- [Kanal sorun giderme](/tr/channels/troubleshooting)
- [Gruplar](/tr/channels/groups)
- [Eşleştirme](/tr/channels/pairing)

## Pano kontrol UI bağlantısı

Pano/kontrol UI bağlanmıyorsa URL'yi, kimlik doğrulama modunu ve güvenli bağlam varsayımlarını doğrulayın.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

Şunlara bakın:

- Doğru yoklama URL'si ve pano URL'si.
- İstemci ile gateway arasında kimlik doğrulama modu/token uyumsuzluğu.
- Cihaz kimliği gerektiği halde HTTP kullanımı.

Bir güncellemeden sonra yerel tarayıcı `127.0.0.1:18789` adresine bağlanamıyorsa, önce yerel Gateway hizmetini kurtarın ve panoyu sunduğunu doğrulayın:

```bash
openclaw gateway restart
lsof -i :18789
curl http://127.0.0.1:18789
```

`curl` OpenClaw HTML döndürürse Gateway çalışıyordur ve kalan sorun büyük olasılıkla tarayıcı önbelleği, eski bir derin bağlantı veya bayat sekme durumudur. `http://127.0.0.1:18789` adresini doğrudan açın ve panodan ilerleyin. Yeniden başlatma hizmeti çalışır durumda bırakmıyorsa `openclaw gateway start` çalıştırın ve `openclaw gateway status` durumunu yeniden kontrol edin.

<AccordionGroup>
  <Accordion title="Bağlantı / kimlik doğrulama imzaları">
    - `device identity required` → güvenli olmayan bağlam veya eksik cihaz kimlik doğrulaması.
    - `origin not allowed` → tarayıcı `Origin` değeri `gateway.controlUi.allowedOrigins` içinde değil (veya açık bir izin listesi olmadan loopback olmayan bir tarayıcı kaynağından bağlanıyorsunuz).
    - `device nonce required` / `device nonce mismatch` → istemci, challenge tabanlı cihaz kimlik doğrulama akışını tamamlamıyor (`connect.challenge` + `device.nonce`).
    - `device signature invalid` / `device signature expired` → istemci, geçerli el sıkışma için yanlış yükü (veya bayat zaman damgasını) imzaladı.
    - `AUTH_TOKEN_MISMATCH` ile `canRetryWithDeviceToken=true` → istemci, önbelleğe alınmış cihaz token'ı ile güvenilir bir yeniden deneme yapabilir.
    - Bu önbelleğe alınmış token yeniden denemesi, eşleştirilmiş cihaz token'ı ile saklanan önbelleğe alınmış kapsam kümesini yeniden kullanır. Açık `deviceToken` / açık `scopes` çağıranları bunun yerine istedikleri kapsam kümesini korur.
    - `AUTH_SCOPE_MISMATCH` → cihaz token'ı tanındı, ancak onaylanmış kapsamları bu bağlantı isteğini kapsamıyor; paylaşılan gateway token'ını döndürmek yerine yeniden eşleştirin veya istenen kapsam sözleşmesini onaylayın.
    - Bu yeniden deneme yolu dışında, bağlantı kimlik doğrulama önceliği önce açık paylaşılan token/parola, sonra açık `deviceToken`, sonra saklanan cihaz token'ı, sonra bootstrap token'ıdır.
    - Asenkron Tailscale Serve Control UI yolunda, aynı `{scope, ip}` için başarısız girişimler, sınırlayıcı hatayı kaydetmeden önce sıraya alınır. Bu nedenle aynı istemciden gelen iki kötü eşzamanlı yeniden deneme, iki düz uyumsuzluk yerine ikinci denemede `retry later` gösterebilir.
    - Tarayıcı kaynaklı loopback istemcisinden `too many failed authentication attempts (retry later)` → aynı normalize edilmiş `Origin` değerinden tekrarlanan hatalar geçici olarak kilitlenir; başka bir localhost kaynağı ayrı bir bucket kullanır.
    - Bu yeniden denemeden sonra tekrarlanan `unauthorized` → paylaşılan token/cihaz token'ı kayması; token yapılandırmasını yenileyin ve gerekirse cihaz token'ını yeniden onaylayın/döndürün.
    - `gateway connect failed:` → yanlış host/port/url hedefi.

  </Accordion>
</AccordionGroup>

### Kimlik doğrulama ayrıntı kodları hızlı haritası

Sonraki eylemi seçmek için başarısız `connect` yanıtındaki `error.details.code` değerini kullanın:

| Ayrıntı kodu                 | Anlamı                                                                                                                                                                                       | Önerilen eylem                                                                                                                                                                                                                                                                          |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`         | İstemci gerekli paylaşılan token'ı göndermedi.                                                                                                                                               | Token'ı istemciye yapıştırın/ayarlayın ve yeniden deneyin. Pano yolları için: `openclaw config get gateway.auth.token` ardından Control UI ayarlarına yapıştırın.                                                                                                                      |
| `AUTH_TOKEN_MISMATCH`        | Paylaşılan token, gateway kimlik doğrulama token'ı ile eşleşmedi.                                                                                                                            | `canRetryWithDeviceToken=true` ise bir güvenilir yeniden denemeye izin verin. Önbelleğe alınmış token yeniden denemeleri saklanan onaylı kapsamları yeniden kullanır; açık `deviceToken` / `scopes` çağıranları istenen kapsamları korur. Hâlâ başarısız oluyorsa [token kayması kurtarma kontrol listesini](/tr/cli/devices#token-drift-recovery-checklist) çalıştırın. |
| `AUTH_DEVICE_TOKEN_MISMATCH` | Önbelleğe alınmış cihaz başına token bayat veya iptal edilmiş.                                                                                                                               | [Cihazlar CLI](/tr/cli/devices) kullanarak cihaz token'ını döndürün/yeniden onaylayın, ardından yeniden bağlanın.                                                                                                                                                                         |
| `AUTH_SCOPE_MISMATCH`        | Cihaz token'ı geçerli, ancak onaylı rol/kapsamları bu bağlantı isteğini kapsamıyor.                                                                                                          | Cihazı yeniden eşleştirin veya istenen kapsam sözleşmesini onaylayın; bunu paylaşılan token kayması olarak ele almayın.                                                                                                                                                                 |
| `PAIRING_REQUIRED`           | Cihaz kimliğinin onaya ihtiyacı var. `not-paired`, `scope-upgrade`, `role-upgrade` veya `metadata-upgrade` için `error.details.reason` değerini kontrol edin ve varsa `requestId` / `remediationHint` kullanın. | Bekleyen isteği onaylayın: `openclaw devices list` ardından `openclaw devices approve <requestId>`. Kapsam/rol yükseltmeleri, istenen erişimi gözden geçirdikten sonra aynı akışı kullanır.                                                                                              |

<Note>
Paylaşılan gateway token'ı/parolası ile kimliği doğrulanan doğrudan loopback backend RPC'leri, CLI'nin eşleştirilmiş cihaz kapsam temel çizgisine bağlı olmamalıdır. Alt ajanlar veya diğer dahili çağrılar hâlâ `scope-upgrade` ile başarısız oluyorsa çağıranın `client.id: "gateway-client"` ve `client.mode: "backend"` kullandığını ve açık bir `deviceIdentity` veya cihaz token'ı zorlamadığını doğrulayın.
</Note>

Cihaz kimlik doğrulama v2 migration kontrolü:

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

Günlükler nonce/imza hataları gösteriyorsa bağlanan istemciyi güncelleyin ve doğrulayın:

<Steps>
  <Step title="connect.challenge bekleyin">
    İstemci, gateway tarafından verilen `connect.challenge` değerini bekler.
  </Step>
  <Step title="Yükü imzalayın">
    İstemci, challenge'a bağlı yükü imzalar.
  </Step>
  <Step title="Cihaz nonce değerini gönderin">
    İstemci, aynı challenge nonce değeriyle `connect.params.device.nonce` gönderir.
  </Step>
</Steps>

`openclaw devices rotate` / `revoke` / `remove` beklenmedik şekilde reddedilirse:

- eşleştirilmiş cihaz token oturumları, çağıranda ayrıca `operator.admin` yoksa yalnızca **kendi** cihazlarını yönetebilir
- `openclaw devices rotate --scope ...` yalnızca çağıran oturumun zaten sahip olduğu operatör kapsamlarını isteyebilir

İlgili:

- [Yapılandırma](/tr/gateway/configuration) (gateway kimlik doğrulama modları)
- [Control UI](/tr/web/control-ui)
- [Cihazlar](/tr/cli/devices)
- [Uzaktan erişim](/tr/gateway/remote)
- [Güvenilir proxy kimlik doğrulaması](/tr/gateway/trusted-proxy-auth)

## Gateway hizmeti çalışmıyor

Hizmet yüklü ancak süreç ayakta kalmıyorsa bunu kullanın.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # sistem düzeyindeki hizmetleri de tara
```

Şunlara bakın:

- Çıkış ipuçlarıyla birlikte `Runtime: stopped`.
- Hizmet yapılandırması uyumsuzluğu (`Config (cli)` ve `Config (service)`).
- Port/dinleyici çakışmaları.
- `--deep` kullanıldığında ek launchd/systemd/schtasks kurulumları.
- `Other gateway-like services detected (best effort)` temizleme ipuçları.

<AccordionGroup>
  <Accordion title="Yaygın imzalar">
    - `Gateway start blocked: set gateway.mode=local` veya `existing config is missing gateway.mode` → yerel gateway modu etkin değil ya da yapılandırma dosyasının üzerine yazılmış ve `gateway.mode` kaybedilmiş. Düzeltme: yapılandırmanızda `gateway.mode="local"` ayarlayın veya beklenen yerel mod yapılandırmasını yeniden damgalamak için `openclaw onboard --mode local` / `openclaw setup` komutunu yeniden çalıştırın. OpenClaw'u Podman üzerinden çalıştırıyorsanız varsayılan yapılandırma yolu `~/.openclaw/openclaw.json` olur.
    - `refusing to bind gateway ... without auth` → geçerli bir gateway kimlik doğrulama yolu (token/parola veya yapılandırıldıysa güvenilir proxy) olmadan loopback dışı bağlama.
    - `another gateway instance is already listening` / `EADDRINUSE` → port çakışması.
    - `Other gateway-like services detected (best effort)` → bayat veya paralel launchd/systemd/schtasks birimleri var. Çoğu kurulum makine başına bir gateway tutmalıdır; birden fazlasına gerçekten ihtiyacınız varsa portları + yapılandırmayı/durumu/çalışma alanını yalıtın. Bkz. [/gateway#multiple-gateways-same-host](/tr/gateway#multiple-gateways-same-host).
    - doctor'dan `System-level OpenClaw gateway service detected` → kullanıcı düzeyi hizmet eksikken bir systemd sistem birimi var. Doctor'ın kullanıcı hizmeti yüklemesine izin vermeden önce kopyayı kaldırın veya devre dışı bırakın ya da sistem birimi amaçlanan denetleyiciyse `OPENCLAW_SERVICE_REPAIR_POLICY=external` ayarlayın.
    - `Gateway service port does not match current gateway config` → yüklü denetleyici hâlâ eski `--port` değerini sabitliyor. `openclaw doctor --fix` veya `openclaw gateway install --force` çalıştırın, ardından gateway hizmetini yeniden başlatın.

  </Accordion>
</AccordionGroup>

İlgili:

- [Arka plan yürütme ve süreç aracı](/tr/gateway/background-process)
- [Yapılandırma](/tr/gateway/configuration)
- [Doctor](/tr/gateway/doctor)

## macOS gateway sessizce yanıt vermeyi durduruyor, ardından panoya dokunduğunuzda devam ediyor

macOS host üzerindeki kanallar (Telegram, WhatsApp vb.) dakikalardan saatlere kadar sessiz kaldığında ve Control UI'yi açtığınız, SSH ile bağlandığınız veya host ile başka şekilde etkileşime geçtiğiniz anda gateway geri gelmiş göründüğünde bunu kullanın. Genellikle `openclaw status` içinde belirgin bir belirti olmaz, çünkü baktığınız zamana kadar gateway yeniden canlıdır.

```bash
ls ~/.openclaw/logs/stability/ | tail -5
openclaw gateway stability --bundle latest
pmset -g log | grep -iE "sleep|wake|maintenance" | tail -50
launchctl print gui/$UID/ai.openclaw.gateway | grep -E "state|last exit|runs"
```

Şunları arayın:

- `~/.openclaw/logs/stability/` içinde `error.code` değeri `ENETDOWN`, `ENETUNREACH`, `EHOSTUNREACH` veya `ECONNREFUSED` gibi geçici bir ağ koduna ayarlanmış bir veya daha fazla `*-uncaught_exception.json` paketi.
- Çökme zaman damgalarıyla hizalanmış `Entering Sleep state due to 'Maintenance Sleep'` veya `en0 driver is slow (msg: WillChangeState to 0)` gibi `pmset -g log` satırları. Power Nap / Maintenance Sleep, Wi-Fi sürücüsünü kısa süreliğine 0 durumuna alır; bu pencereye denk gelen herhangi bir giden `connect()`, aksi halde tam ağ bağlantısına sahip bir konakta bile `ENETDOWN` ile başarısız olabilir.
- Özellikle çökme ile sonraki başlatma arasındaki boşluk saniyeler yerine yaklaşık bir saat olduğunda, bir çıkış kodu ve birden çok yakın tarihli `runs` ile `state = not running` gösteren `launchctl print` çıktısı. macOS launchd, çökme patlamasından sonra belgelendirilmemiş bir yeniden başlatma koruma kapısı uygular; bu kapı, etkileşimli oturum açma, pano bağlantısı veya `launchctl kickstart` gibi harici bir tetikleyici onu yeniden etkinleştirene kadar `KeepAlive=true` ayarını dikkate almayı durdurabilir.

Yaygın belirtiler:

- `error.code` değeri `ENETDOWN` veya kardeş bir kod olan ve çağrı yığını Node `net` `lookupAndConnect` / `Socket.connect` içine işaret eden bir kararlılık paketi. OpenClaw `2026.5.26` ve daha yeni sürümler bunları zararsız geçici ağ hataları olarak sınıflandırır, bu nedenle artık üst düzey yakalanmamış işleyiciye yayılmazlar; daha eski bir sürümdeyseniz önce yükseltin.
- Control UI'ye bağlandığınız veya konağa SSH ile girdiğiniz anda biten uzun sessiz dönemler: launchd yeniden başlatma kapısını yeniden etkinleştiren şey, panonun Gateway'e yaptığı herhangi bir işlem değil, kullanıcı tarafından görülebilen etkinliktir.
- `~/Library/Logs/openclaw/gateway.log` içinde karşılık gelen `received SIG*; shutting down` satırı olmadan gün boyunca artan `runs` sayısı: temiz kapanışlar bir sinyal günlüğe kaydeder; geçici çökmeler kaydetmez.

Ne yapmalı:

1. `2026.5.26` öncesi bir sürüm çalıştırıyorsanız **Gateway'i yükseltin**. Yükseltmeden sonra gelecekteki `ENETDOWN` hataları süreci sonlandırmak yerine uyarı olarak günlüğe kaydedilir.
2. Her zaman açık sunucular olarak çalışması amaçlanan Mac mini / masaüstü konaklarda **bakım uykusu etkinliğini azaltın**:

   ```bash
   sudo pmset -a sleep 0 disksleep 0 standby 0 powernap 0
   ```

   Bu, altta yatan sürücü dalgalanmasını önemli ölçüde azaltır, ancak tamamen ortadan kaldırmaz. Sistem, bu bayraklardan bağımsız olarak TCP keepalive ve mDNS bakımı için yine de bazı bakım uykuları gerçekleştirebilir.

3. launchd tarafından beklemeye alınan gelecekteki bir çökme patlamasının hızla yakalanması için **bir canlılık watchdog'u ekleyin**:

   ```bash
   # Example launchd-aware liveness check, suitable for a 5-minute cron or LaunchAgent
   state=$(launchctl print gui/$UID/ai.openclaw.gateway 2>/dev/null | awk -F'= ' '/state =/ {print $2; exit}')
   if [ "$state" != "running" ]; then
     launchctl kickstart -k gui/$UID/ai.openclaw.gateway
   fi
   ```

   Amaç, yeniden başlatma kapısını harici olarak yeniden etkinleştirmektir; macOS'ta bir çökme patlamasından sonra yalnızca `KeepAlive=true` yeterli değildir.

İlgili:

- [macOS platform notları](/tr/platforms/macos)
- [Günlükleme](/tr/logging)
- [Doctor](/tr/gateway/doctor)

## Yüksek bellek kullanımı sırasında Gateway çıkıyor

Bunu, Gateway yük altında kaybolduğunda, supervisor OOM tarzı bir yeniden başlatma bildirdiğinde veya günlüklerde `critical memory pressure bundle written` ifadesi geçtiğinde kullanın.

```bash
openclaw gateway status --deep
openclaw logs --follow
openclaw gateway stability --bundle latest
openclaw gateway diagnostics export
```

Şunları arayın:

- En son kararlılık paketinde `Reason: diagnostic.memory.pressure.critical`.
- `critical/rss_threshold`, `critical/heap_threshold` veya `critical/rss_growth` ile `Memory pressure:`.
- Heap sınırına yakın `V8 heap:` değerleri.
- `agents/<agent>/sessions/<session>.jsonl` veya `sessions/<session>.jsonl` gibi `Largest session files:` girdileri.
- Gateway bir container veya bellekle sınırlı hizmet içinde çalıştığında Linux cgroup bellek sayaçları.

Yaygın belirtiler:

- `critical memory pressure bundle written` yeniden başlatmadan kısa süre önce görünür → OpenClaw, OOM öncesi bir kararlılık paketi yakaladı. `openclaw gateway stability --bundle latest` ile inceleyin.
- Gateway günlüklerinde `memory pressure: level=critical ... memoryPressureSnapshot=disabled` görünür → OpenClaw kritik bellek baskısı algıladı, ancak OOM öncesi kararlılık anlık görüntüsü kapalıdır.
- `Largest session files:` çok büyük bir düzeltilmiş transcript yolunu işaret eder → yeniden başlatmadan önce tutulan oturum geçmişini azaltın, oturum büyümesini inceleyin veya eski transcript'leri etkin depodan çıkarın.
- `V8 heap:` kullanılan baytları heap sınırına yakındır → prompt/oturum baskısını düşürün, eşzamanlı işi azaltın veya iş yükünün beklendiğini doğruladıktan sonra Node heap sınırını yükseltin.
- `Memory pressure: critical/rss_growth` → bellek tek bir örnekleme penceresinde hızla büyüdü. Büyük bir içe aktarma, kontrolden çıkan araç çıktısı, yinelenen yeniden denemeler veya kuyruğa alınmış agent işlerinden oluşan bir toplu iş için en son günlükleri kontrol edin.
- Günlüklerde kritik bellek baskısı görünür, ancak paket yoktur → varsayılan budur. Gelecekteki kritik bellek baskısı olaylarında OOM öncesi kararlılık paketini yakalamak için `diagnostics.memoryPressureSnapshot: true` ayarlayın.

Kararlılık paketi yük içermez. Mesaj metni, webhook gövdeleri, kimlik bilgileri, token'lar, çerezler veya ham oturum kimlikleri değil; operasyonel bellek kanıtı ve düzeltilmiş göreli dosya yolları içerir. Hata raporlarına ham günlükleri kopyalamak yerine tanılama dışa aktarımını ekleyin.

İlgili:

- [Gateway sağlığı](/tr/gateway/health)
- [Tanılama dışa aktarma](/tr/gateway/diagnostics)
- [Oturumlar](/tr/cli/sessions)

## Gateway geçersiz yapılandırmayı reddetti

Bunu, Gateway başlangıcı `Invalid config` ile başarısız olduğunda veya sıcak yeniden yükleme günlükleri
geçersiz bir düzenlemeyi atladığını söylediğinde kullanın.

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
- OpenClaw her yapılandırma yolu için en son 32 `.clobbered.*` dosyasını tutar ve daha eskileri döndürür

<AccordionGroup>
  <Accordion title="Ne oldu">
    - Yapılandırma başlangıç, sıcak yeniden yükleme veya OpenClaw'a ait bir yazma sırasında doğrulanmadı.
    - Gateway başlangıcı `openclaw.json` dosyasını yeniden yazmak yerine kapalı biçimde başarısız olur.
    - Sıcak yeniden yükleme geçersiz harici düzenlemeleri atlar ve geçerli çalışma zamanı yapılandırmasını etkin tutar.
    - OpenClaw'a ait yazmalar, commit öncesinde geçersiz/yıkıcı yükleri reddeder ve `.rejected.*` olarak kaydeder.
    - Onarımın sahibi `openclaw doctor --fix` komutudur. JSON olmayan önekleri kaldırabilir veya reddedilen yükü `.clobbered.*` olarak korurken son bilinen iyi kopyayı geri yükleyebilir.
    - Bir yapılandırma yolu için çok sayıda onarım gerçekleştiğinde OpenClaw, en yeni onarılmış yükün hâlâ kullanılabilir olması için eski `.clobbered.*` dosyalarını döndürür.

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
    - `.clobbered.*` var → doctor, etkin yapılandırmayı onarırken bozuk bir harici düzenlemeyi korudu.
    - `.rejected.*` var → OpenClaw'a ait bir yapılandırma yazması, commit öncesinde schema veya üzerine yazma kontrollerinden geçemedi.
    - `Config write rejected:` → yazma, gerekli şekli düşürmeye, dosyayı keskin biçimde küçültmeye veya geçersiz yapılandırmayı kalıcılaştırmaya çalıştı.
    - `config reload skipped (invalid config):` → doğrudan bir düzenleme doğrulamadan geçemedi ve çalışan Gateway tarafından yok sayıldı.
    - `Invalid config at ...` → Gateway hizmetleri başlatılmadan önce başlangıç başarısız oldu.
    - `missing-meta-vs-last-good`, `gateway-mode-missing-vs-last-good` veya `size-drop-vs-last-good:*` → OpenClaw'a ait bir yazma, son bilinen iyi yedekle karşılaştırıldığında alanları veya boyutu kaybettiği için reddedildi.
    - `Config last-known-good promotion skipped` → aday, `***` gibi düzeltilmiş secret yer tutucuları içeriyordu.

  </Accordion>
  <Accordion title="Düzeltme seçenekleri">
    1. doctor'ın önekli/üzerine yazılmış yapılandırmayı onarmasına veya son bilinen iyiyi geri yüklemesine izin vermek için `openclaw doctor --fix` çalıştırın.
    2. `.clobbered.*` veya `.rejected.*` içinden yalnızca amaçlanan anahtarları kopyalayın, ardından bunları `openclaw config set` veya `config.patch` ile uygulayın.
    3. Yeniden başlatmadan önce `openclaw config validate` çalıştırın.
    4. Elle düzenleme yaparsanız, değiştirmek istediğiniz kısmi nesneyi değil, tam JSON5 yapılandırmasını koruyun.
  </Accordion>
</AccordionGroup>

İlgili:

- [Yapılandırma](/tr/cli/config)
- [Yapılandırma: sıcak yeniden yükleme](/tr/gateway/configuration#config-hot-reload)
- [Yapılandırma: sıkı doğrulama](/tr/gateway/configuration#strict-validation)
- [Doctor](/tr/gateway/doctor)

## Gateway probe uyarıları

Bunu, `openclaw gateway probe` bir şeye ulaştığında, ancak yine de bir uyarı bloğu yazdırdığında kullanın.

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

Şunları arayın:

- JSON çıktısında `warnings[].code` ve `primaryTargetId`.
- Uyarının SSH fallback, birden çok Gateway, eksik kapsamlar veya çözümlenmemiş auth ref'leri hakkında olup olmadığı.

Yaygın belirtiler:

- `SSH tunnel failed to start; falling back to direct probes.` → SSH kurulumu başarısız oldu, ancak komut yine de doğrudan yapılandırılmış/loopback hedefleri denedi.
- `multiple reachable gateway identities detected` → farklı Gateway'ler yanıt verdi veya OpenClaw ulaşılabilir hedeflerin aynı Gateway olduğunu kanıtlayamadı. Aynı Gateway'e giden bir SSH tüneli, proxy URL'si veya yapılandırılmış uzak URL, taşıma bağlantı noktaları farklı olsa bile birden çok taşımalı tek Gateway olarak değerlendirilir.
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → bağlantı çalıştı, ancak ayrıntı RPC kapsamla sınırlı; cihaz kimliğini eşleştirin veya `operator.read` içeren kimlik bilgilerini kullanın.
- `Gateway accepted the WebSocket connection, but follow-up read diagnostics failed` → bağlantı çalıştı, ancak tam tanılama RPC seti zaman aşımına uğradı veya başarısız oldu. Bunu, tanılamaları zayıflamış ulaşılabilir bir Gateway olarak değerlendirin; `--json` çıktısında `connect.ok` ve `connect.rpcOk` değerlerini karşılaştırın.
- `Capability: pairing-pending` veya `gateway closed (1008): pairing required` → Gateway yanıt verdi, ancak bu istemcinin normal operator erişiminden önce hâlâ eşleştirme/onaya ihtiyacı var.
- çözümlenmemiş `gateway.auth.*` / `gateway.remote.*` SecretRef uyarı metni → başarısız hedef için bu komut yolunda auth materyali kullanılamıyordu.

İlgili:

- [Gateway](/tr/cli/gateway)
- [Aynı konakta birden çok Gateway](/tr/gateway#multiple-gateways-same-host)
- [Uzak erişim](/tr/gateway/remote)

## Kanal bağlı, mesajlar akmıyor

Kanal durumu bağlıysa ancak mesaj akışı durmuşsa, policy, izinler ve kanala özgü teslim kurallarına odaklanın.

```bash
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw status --deep
openclaw logs --follow
openclaw config get channels
```

Şunları arayın:

- DM policy (`pairing`, `allowlist`, `open`, `disabled`).
- Grup allowlist'i ve bahsetme gereksinimleri.
- Eksik kanal API izinleri/kapsamları.

Yaygın belirtiler:

- `mention required` → mesaj grup bahsetme policy'si tarafından yok sayıldı.
- `pairing` / bekleyen onay izleri → gönderen onaylı değil.
- `missing_scope`, `not_in_channel`, `Forbidden`, `401/403` → kanal auth/izin sorunu.

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
  <Accordion title="Common signatures">
    - `cron: scheduler disabled; jobs will not run automatically` → cron devre dışı.
    - `cron: timer tick failed` → zamanlayıcı tik işlemi başarısız oldu; dosya/günlük/çalışma zamanı hatalarını kontrol edin.
    - `heartbeat skipped` ve `reason=quiet-hours` → etkin saatler penceresinin dışında.
    - `heartbeat skipped` ve `reason=empty-heartbeat-file` → `HEARTBEAT.md` var ancak yalnızca boşluk, yorum, başlık, fence veya boş kontrol listesi iskeleti içeriyor; bu yüzden OpenClaw model çağrısını atlar.
    - `heartbeat skipped` ve `reason=no-tasks-due` → `HEARTBEAT.md` bir `tasks:` bloğu içeriyor, ancak bu tikte hiçbir görevin zamanı gelmemiş.
    - `heartbeat: unknown accountId` → Heartbeat teslim hedefi için geçersiz hesap kimliği.
    - `heartbeat skipped` ve `reason=dm-blocked` → Heartbeat hedefi DM tarzı bir hedefe çözümlenirken `agents.defaults.heartbeat.directPolicy` (veya ajan bazlı geçersiz kılma) `block` olarak ayarlanmış.

  </Accordion>
</AccordionGroup>

İlgili:

- [Heartbeat](/tr/gateway/heartbeat)
- [Zamanlanmış görevler](/tr/automation/cron-jobs)
- [Zamanlanmış görevler: sorun giderme](/tr/automation/cron-jobs#troubleshooting)

## Node eşleştirilmiş, araç başarısız oluyor

Bir Node eşleştirilmiş ancak araçlar başarısız oluyorsa ön plan, izin ve onay durumunu yalıtın.

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

Şunları arayın:

- Beklenen yeteneklerle Node çevrim içi.
- Kamera/mikrofon/konum/ekran için işletim sistemi izinleri.
- Exec onayları ve izin listesi durumu.

Yaygın imzalar:

- `NODE_BACKGROUND_UNAVAILABLE` → Node uygulaması ön planda olmalıdır.
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → işletim sistemi izni eksik.
- `SYSTEM_RUN_DENIED: approval required` → exec onayı bekliyor.
- `SYSTEM_RUN_DENIED: allowlist miss` → komut izin listesi tarafından engellendi.

İlgili:

- [Exec onayları](/tr/tools/exec-approvals)
- [Node sorun giderme](/tr/nodes/troubleshooting)
- [Node'lar](/tr/nodes/index)

## Tarayıcı aracı başarısız oluyor

Gateway sağlıklı olsa bile tarayıcı aracı eylemleri başarısız olduğunda bunu kullanın.

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
    - `unknown command "browser"` veya `unknown command 'browser'` → paketlenmiş tarayıcı Plugin'i `plugins.allow` tarafından hariç tutulmuş.
    - `browser.enabled=true` iken tarayıcı aracı eksik / kullanılamaz → `plugins.allow`, `browser` öğesini hariç tutuyor; bu yüzden Plugin hiç yüklenmedi.
    - `Failed to start Chrome CDP on port` → tarayıcı işlemi başlatılamadı.
    - `browser.executablePath not found` → yapılandırılmış yol geçersiz.
    - `browser.cdpUrl must be http(s) or ws(s)` → yapılandırılmış CDP URL'si `file:` veya `ftp:` gibi desteklenmeyen bir şema kullanıyor.
    - `browser.cdpUrl has invalid port` → yapılandırılmış CDP URL'si hatalı veya aralık dışında bir bağlantı noktasına sahip.
    - `Playwright is not available in this gateway build; '<feature>' is unsupported.` → geçerli Gateway kurulumu çekirdek tarayıcı çalışma zamanı bağımlılığından yoksun; OpenClaw'ı yeniden kurun veya güncelleyin, ardından Gateway'i yeniden başlatın. ARIA anlık görüntüleri ve temel sayfa ekran görüntüleri yine çalışabilir, ancak gezinme, AI anlık görüntüleri, CSS seçici öğe ekran görüntüleri ve PDF dışa aktarma kullanılamaz kalır.

  </Accordion>
  <Accordion title="Chrome MCP / existing-session signatures">
    - `Could not find DevToolsActivePort for chrome` → Chrome MCP existing-session henüz seçili tarayıcı veri dizinine bağlanamadı. Tarayıcı inceleme sayfasını açın, uzaktan hata ayıklamayı etkinleştirin, tarayıcıyı açık tutun, ilk bağlanma istemini onaylayın ve yeniden deneyin. Oturum açılmış durum gerekmiyorsa yönetilen `openclaw` profilini tercih edin.
    - `No Chrome tabs found for profile="user"` → Chrome MCP bağlanma profilinde açık yerel Chrome sekmesi yok.
    - `Remote CDP for profile "<name>" is not reachable` → yapılandırılmış uzak CDP uç noktasına Gateway ana makinesinden erişilemiyor.
    - `Browser attachOnly is enabled ... not reachable` veya `Browser attachOnly is enabled and CDP websocket ... is not reachable` → yalnızca bağlanma profili için erişilebilir hedef yok veya HTTP uç noktası yanıt verdi ancak CDP WebSocket yine de açılamadı.

  </Accordion>
  <Accordion title="Element / screenshot / upload signatures">
    - `fullPage is not supported for element screenshots` → ekran görüntüsü isteği `--full-page` ile `--ref` veya `--element` öğesini birlikte kullandı.
    - `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → Chrome MCP / `existing-session` ekran görüntüsü çağrıları CSS `--element` değil, sayfa yakalama veya anlık görüntü `--ref` kullanmalıdır.
    - `existing-session file uploads do not support element selectors; use ref/inputRef.` → Chrome MCP yükleme hook'ları CSS seçicileri değil, anlık görüntü ref'leri gerektirir.
    - `existing-session file uploads currently support one file at a time.` → Chrome MCP profillerinde çağrı başına bir yükleme gönderin.
    - `existing-session dialog handling does not support timeoutMs.` → Chrome MCP profillerindeki iletişim kutusu hook'ları zaman aşımı geçersiz kılmalarını desteklemez.
    - `existing-session type does not support timeoutMs overrides.` → `profile="user"` / Chrome MCP existing-session profillerinde `act:type` için `timeoutMs` öğesini atlayın veya özel zaman aşımı gerektiğinde yönetilen/CDP tarayıcı profili kullanın.
    - `existing-session evaluate does not support timeoutMs overrides.` → `profile="user"` / Chrome MCP existing-session profillerinde `act:evaluate` için `timeoutMs` öğesini atlayın veya özel zaman aşımı gerektiğinde yönetilen/CDP tarayıcı profili kullanın.
    - `response body is not supported for existing-session profiles yet.` → `responsebody` hâlâ yönetilen tarayıcı veya ham CDP profili gerektirir.
    - yalnızca bağlanma veya uzak CDP profillerinde eski kalmış görünüm alanı / koyu mod / yerel ayar / çevrim dışı geçersiz kılmaları → etkin kontrol oturumunu kapatmak ve tüm Gateway'i yeniden başlatmadan Playwright/CDP öykünme durumunu serbest bırakmak için `openclaw browser stop --browser-profile <name>` çalıştırın.

  </Accordion>
</AccordionGroup>

İlgili:

- [Tarayıcı (OpenClaw tarafından yönetilen)](/tr/tools/browser)
- [Tarayıcı sorun giderme](/tr/tools/browser-linux-troubleshooting)

## Yükselttiyseniz ve bir şey aniden bozulduysa

Yükseltme sonrası bozulmaların çoğu yapılandırma sapması veya artık uygulanan daha katı varsayılanlardan kaynaklanır.

<AccordionGroup>
  <Accordion title="1. Auth and URL override behavior changed">
    ```bash
    openclaw gateway status
    openclaw config get gateway.mode
    openclaw config get gateway.remote.url
    openclaw config get gateway.auth.mode
    ```

    Kontrol edilecekler:

    - `gateway.mode=remote` ise CLI çağrıları, yerel hizmetiniz sorunsuzken uzağı hedefliyor olabilir.
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

    Kontrol edilecekler:

    - local loopback olmayan bağlamalar (`lan`, `tailnet`, `custom`) geçerli bir Gateway auth yolu gerektirir: paylaşılan token/parola auth ya da doğru yapılandırılmış local loopback olmayan `trusted-proxy` dağıtımı.
    - `gateway.token` gibi eski anahtarlar `gateway.auth.token` yerine geçmez.

    Yaygın imzalar:

    - `refusing to bind gateway ... without auth` → geçerli Gateway auth yolu olmadan local loopback olmayan bağlama.
    - Çalışma zamanı çalışırken `Connectivity probe: failed` → Gateway canlı ancak geçerli auth/url ile erişilemez.

  </Accordion>
  <Accordion title="3. Pairing and device identity state changed">
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

    - `device identity required` → cihaz auth koşulu sağlanmamış.
    - `pairing required` → gönderen/cihaz onaylanmalıdır.

  </Accordion>
</AccordionGroup>

Kontrollerden sonra hizmet yapılandırması ve çalışma zamanı hâlâ uyuşmuyorsa hizmet meta verilerini aynı profil/durum dizininden yeniden kurun:

```bash
openclaw gateway install --force
openclaw gateway restart
```

İlgili:

- [Kimlik doğrulama](/tr/gateway/authentication)
- [Arka plan exec ve işlem aracı](/tr/gateway/background-process)
- [Gateway'e ait eşleştirme](/tr/gateway/pairing)

## İlgili

- [Doctor](/tr/gateway/doctor)
- [SSS](/tr/help/faq)
- [Gateway çalışma kitabı](/tr/gateway)
