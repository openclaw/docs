---
read_when:
    - Model kimlik doğrulaması veya OAuth süresinin dolmasında hata ayıklıyorsunuz
    - Kimlik doğrulamayı veya kimlik bilgisi depolamayı belgeliyorsunuz
summary: 'Model kimlik doğrulaması: OAuth, API anahtarları ve Claude CLI yeniden kullanımı'
title: Kimlik Doğrulama
x-i18n:
    generated_at: "2026-04-05T13:52:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1c0ceee7d10fe8d10345f32889b63425d81773f3a08d8ecd3fd88d965b207ddc
    source_path: gateway/authentication.md
    workflow: 15
---

# Kimlik Doğrulama (Model Sağlayıcıları)

<Note>
Bu sayfa **model sağlayıcısı** kimlik doğrulamasını kapsar (API anahtarları, OAuth, Claude CLI yeniden kullanımı). **Gateway bağlantısı** kimlik doğrulaması için (token, parola, trusted-proxy), bkz. [Configuration](/gateway/configuration) ve [Trusted Proxy Auth](/gateway/trusted-proxy-auth).
</Note>

OpenClaw, model sağlayıcıları için OAuth ve API anahtarlarını destekler. Her zaman açık gateway
host'ları için API anahtarları genellikle en öngörülebilir seçenektir. Abonelik/OAuth
akışları da sağlayıcı hesap modelinize uyduğunda desteklenir.

Tam OAuth akışı ve depolama düzeni için bkz.
[/concepts/oauth](/concepts/oauth).
SecretRef tabanlı kimlik doğrulama için (`env`/`file`/`exec` sağlayıcıları), bkz. [Secrets Management](/gateway/secrets).
`models status --probe` tarafından kullanılan kimlik bilgisi uygunluğu/gerekçe kodu kuralları için bkz.
[Auth Credential Semantics](/tr/auth-credential-semantics).

## Önerilen kurulum (API anahtarı, herhangi bir sağlayıcı)

Uzun ömürlü bir gateway çalıştırıyorsanız seçtiğiniz
sağlayıcı için bir API anahtarı ile başlayın.
Özellikle Anthropic için API anahtarı kimlik doğrulaması güvenli yoldur. Claude CLI yeniden kullanımı,
desteklenen diğer abonelik tarzı kurulum yoludur.

1. Sağlayıcı konsolunuzda bir API anahtarı oluşturun.
2. Bunu **gateway host** üzerine koyun (`openclaw gateway` çalıştıran makine).

```bash
export <PROVIDER>_API_KEY="..."
openclaw models status
```

3. Gateway systemd/launchd altında çalışıyorsa anahtarı
   `~/.openclaw/.env` içine koymayı tercih edin, böylece daemon bunu okuyabilir:

```bash
cat >> ~/.openclaw/.env <<'EOF'
<PROVIDER>_API_KEY=...
EOF
```

Ardından daemon'u yeniden başlatın (veya Gateway sürecinizi yeniden başlatın) ve tekrar kontrol edin:

```bash
openclaw models status
openclaw doctor
```

Ortam değişkenlerini kendiniz yönetmek istemiyorsanız onboarding
daemon kullanımı için API anahtarlarını saklayabilir: `openclaw onboard`.

Ortam devralma (`env.shellEnv`,
`~/.openclaw/.env`, systemd/launchd) ayrıntıları için bkz. [Help](/help).

## Anthropic: legacy token uyumluluğu

Anthropic setup-token kimlik doğrulaması OpenClaw içinde
legacy/el ile kullanılan bir yol olarak hâlâ kullanılabilir. Anthropic'in herkese açık Claude Code belgeleri hâlâ doğrudan
Claude Code terminal kullanımını Claude planları altında kapsıyor, ancak Anthropic ayrıca
OpenClaw kullanıcılarına **OpenClaw** Claude-login yolunun üçüncü taraf
harness kullanımı sayıldığını ve abonelikten ayrı olarak faturalandırılan
**Extra Usage** gerektirdiğini bildirdi.

En net kurulum yolu için bir Anthropic API anahtarı kullanın veya Gateway
host üzerinde Claude CLI'ye geçiş yapın.

El ile token girişi (herhangi bir sağlayıcı; `auth-profiles.json` yazar + config'i günceller):

```bash
openclaw models auth paste-token --provider openrouter
```

Statik kimlik bilgileri için auth profil başvuruları da desteklenir:

- `api_key` kimlik bilgileri `keyRef: { source, provider, id }` kullanabilir
- `token` kimlik bilgileri `tokenRef: { source, provider, id }` kullanabilir
- OAuth modundaki profiller SecretRef kimlik bilgilerini desteklemez; `auth.profiles.<id>.mode` `"oauth"` olarak ayarlıysa, bu profil için SecretRef destekli `keyRef`/`tokenRef` girdisi reddedilir.

Otomasyon dostu kontrol (sona ermiş/eksik olduğunda `1`, süresi dolmak üzereyken `2` ile çıkar):

```bash
openclaw models status --check
```

Canlı kimlik doğrulama probları:

```bash
openclaw models status --probe
```

Notlar:

- Prob satırları auth profillerinden, env kimlik bilgilerinden veya `models.json` içinden gelebilir.
- Açık `auth.order.<provider>` depolanmış bir profili dışlıyorsa, prob
  bu profil için sessizce atlamak yerine `excluded_by_auth_order`
  bildirir.
- Kimlik doğrulama varsa ancak OpenClaw bu sağlayıcı için
  problanabilir bir model adayı çözemiyorsa, prob `status: no_model` bildirir.
- Oran sınırı cooldown'ları modele özgü olabilir. Bir
  model için cooldown durumunda olan bir profil, aynı sağlayıcıdaki kardeş bir model için yine de kullanılabilir olabilir.

İsteğe bağlı operasyon script'leri (systemd/Termux) burada belgelenmiştir:
[Auth monitoring scripts](/help/scripts#auth-monitoring-scripts)

## Anthropic: Claude CLI geçişi

Claude CLI gateway host'ta zaten kurulu ve oturum açılmışsa,
mevcut bir Anthropic kurulumunu CLI backend'ine
geçirebilirsiniz. Bu, o
host üzerindeki yerel Claude CLI oturum açmasını yeniden kullanmak için desteklenen bir OpenClaw geçiş yoludur.

Ön koşullar:

- `claude` gateway host'ta kurulu
- Claude CLI burada zaten `claude auth login` ile oturum açmış

```bash
openclaw models auth login --provider anthropic --method cli --set-default
```

Bu, mevcut Anthropic auth profillerinizi geri alma için korur, ancak
varsayılan model seçimini `claude-cli/...` olarak değiştirir ve eşleşen Claude CLI
allowlist girdilerini `agents.defaults.models` altına ekler.

Doğrulama:

```bash
openclaw models status
```

Onboarding kısayolu:

```bash
openclaw onboard --auth-choice anthropic-cli
```

Etkileşimli `openclaw onboard` ve `openclaw configure` hâlâ Anthropic için Claude CLI'yi tercih eder,
ancak Anthropic setup-token yine legacy/el ile kullanılan bir yol olarak kullanılabilir
ve **Extra Usage** faturalama beklentisiyle kullanılmalıdır.

## Model kimlik doğrulama durumunu kontrol etme

```bash
openclaw models status
openclaw doctor
```

## API anahtarı döndürme davranışı (gateway)

Bazı sağlayıcılar, bir API çağrısı
sağlayıcı oran sınırına takıldığında isteğin alternatif anahtarlarla yeniden denenmesini destekler.

- Öncelik sırası:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY` (tek geçersiz kılma)
  - `<PROVIDER>_API_KEYS`
  - `<PROVIDER>_API_KEY`
  - `<PROVIDER>_API_KEY_*`
- Google sağlayıcıları ek bir fallback olarak `GOOGLE_API_KEY` değerini de içerir.
- Aynı anahtar listesi kullanımdan önce tekilleştirilir.
- OpenClaw yalnızca oran sınırı hataları için bir sonraki anahtarla yeniden dener (örneğin
  `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many concurrent
requests`, `ThrottlingException`, `concurrency limit reached` veya
  `workers_ai ... quota limit exceeded`).
- Oran sınırı dışındaki hatalar alternatif anahtarlarla yeniden denenmez.
- Tüm anahtarlar başarısız olursa, son denemenin son hatası döndürülür.

## Hangi kimlik bilgisinin kullanılacağını kontrol etme

### Oturum başına (sohbet komutu)

Geçerli oturum için belirli bir sağlayıcı kimlik bilgisini sabitlemek üzere `/model <alias-or-id>@<profileId>` kullanın (örnek profil kimlikleri: `anthropic:default`, `anthropic:work`).

Kompakt bir seçici için `/model` (veya `/model list`), tam görünüm için `/model status` kullanın (adaylar + sonraki auth profili ve yapılandırılmışsa sağlayıcı uç nokta ayrıntıları).

### Agent başına (CLI geçersiz kılma)

Bir agent için açık auth profil sırası geçersiz kılmasını ayarlayın (o agent'ın `auth-profiles.json` dosyasında saklanır):

```bash
openclaw models auth order get --provider anthropic
openclaw models auth order set --provider anthropic anthropic:default
openclaw models auth order clear --provider anthropic
```

Belirli bir agent'ı hedeflemek için `--agent <id>` kullanın; yapılandırılmış varsayılan agent'ı kullanmak için bunu atlayın.
Sıra sorunlarında hata ayıklarken `openclaw models status --probe`,
atlanan depolanmış profilleri sessizce atlamak yerine `excluded_by_auth_order` olarak gösterir.
Cooldown sorunlarında hata ayıklarken oran sınırı cooldown'larının tüm sağlayıcı profiline değil,
tek bir model kimliğine bağlı olabileceğini unutmayın.

## Sorun giderme

### "Kimlik bilgisi bulunamadı"

Anthropic profili eksikse bu kurulumu **gateway host** üzerinde Claude CLI'ye veya bir API
anahtarına taşıyın, ardından tekrar kontrol edin:

```bash
openclaw models status
```

### Token süresi doluyor/dolmuş

Hangi profilin süresinin dolduğunu doğrulamak için `openclaw models status` çalıştırın. Legacy
Anthropic token profili eksikse veya süresi dolmuşsa bu kurulumu Claude CLI'ye
veya bir API anahtarına taşıyın.

## Claude CLI gereksinimleri

Yalnızca Anthropic Claude CLI yeniden kullanım yolu için gereklidir:

- Claude Code CLI kurulu (`claude` komutu kullanılabilir)
