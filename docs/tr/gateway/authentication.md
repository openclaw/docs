---
read_when:
    - Model kimlik doğrulamasını veya OAuth süresinin dolmasını hata ayıklama
    - Kimlik doğrulamayı veya kimlik bilgisi depolamayı belgelendirme
summary: 'Model kimlik doğrulaması: OAuth, API anahtarları, Claude CLI yeniden kullanımı ve Anthropic setup-token'
title: Kimlik doğrulama
x-i18n:
    generated_at: "2026-04-24T09:07:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 371aa5a66bcec5c0271c6b7dcb0fcbb05a075f61ffd2c67616b6ea3a48f54934
    source_path: gateway/authentication.md
    workflow: 15
---

# Kimlik doğrulama (Model Sağlayıcıları)

<Note>
Bu sayfa **model sağlayıcısı** kimlik doğrulamasını kapsar (API anahtarları, OAuth, Claude CLI yeniden kullanımı ve Anthropic setup-token). **Gateway bağlantısı** kimlik doğrulaması için (token, password, trusted-proxy), bkz. [Configuration](/tr/gateway/configuration) ve [Trusted Proxy Auth](/tr/gateway/trusted-proxy-auth).
</Note>

OpenClaw, model sağlayıcıları için OAuth ve API anahtarlarını destekler. Her zaman açık gateway
sunucuları için API anahtarları genellikle en öngörülebilir seçenektir. Abonelik/OAuth
akışları da sağlayıcı hesap modelinize uyduğunda desteklenir.

Tam OAuth akışı ve depolama
düzeni için bkz. [/concepts/oauth](/tr/concepts/oauth).
SecretRef tabanlı kimlik doğrulama (`env`/`file`/`exec` sağlayıcıları) için bkz. [Secrets Management](/tr/gateway/secrets).
`models status --probe` tarafından kullanılan kimlik bilgisi uygunluğu/gerekçe kodu kuralları için
bkz. [Auth Credential Semantics](/tr/auth-credential-semantics).

## Önerilen kurulum (API anahtarı, herhangi bir sağlayıcı)

Uzun ömürlü bir gateway çalıştırıyorsanız, seçtiğiniz
sağlayıcı için bir API anahtarıyla başlayın.
Özellikle Anthropic için, API anahtarı kimlik doğrulaması hâlâ en öngörülebilir sunucu
kurulumudur, ancak OpenClaw yerel bir Claude CLI girişini yeniden kullanmayı da destekler.

1. Sağlayıcı konsolunuzda bir API anahtarı oluşturun.
2. Bunu **gateway sunucusuna** (`openclaw gateway` çalıştıran makineye) koyun.

```bash
export <PROVIDER>_API_KEY="..."
openclaw models status
```

3. Gateway systemd/launchd altında çalışıyorsa, daemon'un bunu okuyabilmesi için
   anahtarı `~/.openclaw/.env` içine koymayı tercih edin:

```bash
cat >> ~/.openclaw/.env <<'EOF'
<PROVIDER>_API_KEY=...
EOF
```

Sonra daemon'u yeniden başlatın (veya Gateway sürecinizi yeniden başlatın) ve yeniden kontrol edin:

```bash
openclaw models status
openclaw doctor
```

Ortam değişkenlerini kendiniz yönetmek istemiyorsanız, onboarding
daemon kullanımı için API anahtarlarını saklayabilir: `openclaw onboard`.

Ortam devralma ayrıntıları için [Help](/tr/help) bölümüne bakın (`env.shellEnv`,
`~/.openclaw/.env`, systemd/launchd).

## Anthropic: Claude CLI ve token uyumluluğu

Anthropic setup-token kimlik doğrulaması, OpenClaw'da desteklenen bir token
yolu olarak hâlâ kullanılabilir. Anthropic çalışanları o zamandan beri bize OpenClaw tarzı Claude CLI kullanımının
yeniden izinli olduğunu söyledi; bu yüzden OpenClaw, Anthropic yeni bir politika yayımlamadığı sürece
Claude CLI yeniden kullanımını ve `claude -p` kullanımını bu entegrasyon için
izinli kabul eder. Claude CLI yeniden kullanımı sunucuda mevcut olduğunda artık tercih edilen yol budur.

Uzun ömürlü gateway sunucuları için Anthropic API anahtarı hâlâ en öngörülebilir
kurulumdur. Aynı sunucudaki mevcut bir Claude girişini yeniden kullanmak istiyorsanız,
onboarding/configure içinde Anthropic Claude CLI yolunu kullanın.

Claude CLI yeniden kullanımı için önerilen sunucu kurulumu:

```bash
# Gateway sunucusunda çalıştırın
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

Bu iki adımlı bir kurulumdur:

1. Claude Code'un kendisini gateway sunucusunda Anthropic'e giriş yaptırın.
2. OpenClaw'a Anthropic model seçimini yerel `claude-cli`
   backend'ine geçirmesini ve eşleşen OpenClaw auth profilini saklamasını söyleyin.

`claude`, `PATH` üzerinde değilse ya önce Claude Code'u kurun ya da
`agents.defaults.cliBackends.claude-cli.command` değerini gerçek ikili dosya yoluna ayarlayın.

Elle token girişi (herhangi bir sağlayıcı; `auth-profiles.json` yazar + config'i günceller):

```bash
openclaw models auth paste-token --provider openrouter
```

Statik kimlik bilgileri için auth profil referansları da desteklenir:

- `api_key` kimlik bilgileri `keyRef: { source, provider, id }` kullanabilir
- `token` kimlik bilgileri `tokenRef: { source, provider, id }` kullanabilir
- OAuth modu profilleri SecretRef kimlik bilgilerini desteklemez; `auth.profiles.<id>.mode` değeri `"oauth"` olarak ayarlanmışsa, o profil için SecretRef destekli `keyRef`/`tokenRef` girdisi reddedilir.

Otomasyon dostu kontrol (süresi dolmuş/eksik olduğunda çıkış `1`, süresi dolmak üzereyse `2`):

```bash
openclaw models status --check
```

Canlı kimlik doğrulama probe'ları:

```bash
openclaw models status --probe
```

Notlar:

- Probe satırları auth profillerinden, env kimlik bilgilerinden veya `models.json` içinden gelebilir.
- Açık `auth.order.<provider>`, saklanan bir profili dışarıda bırakırsa probe,
  onu denemek yerine o profil için `excluded_by_auth_order` bildirir.
- Kimlik doğrulama mevcutsa ama OpenClaw o sağlayıcı için probe edilebilir bir model adayı çözemiyorsa,
  probe `status: no_model` bildirir.
- Rate-limit cooldown'ları model kapsamlı olabilir. Bir
  model için cooldown durumundaki bir profil, aynı sağlayıcıdaki kardeş bir model için yine de kullanılabilir olabilir.

İsteğe bağlı operasyon betikleri (systemd/Termux) burada belgelenmiştir:
[Auth monitoring scripts](/tr/help/scripts#auth-monitoring-scripts)

## Anthropic notu

Anthropic `claude-cli` backend'i yeniden desteklenmektedir.

- Anthropic çalışanları bize bu OpenClaw entegrasyon yoluna yeniden izin verildiğini söyledi.
- Bu nedenle OpenClaw, Anthropic yeni bir politika yayımlamadığı sürece
  Claude CLI yeniden kullanımını ve `claude -p` kullanımını
  Anthropic destekli çalıştırmalar için izinli kabul eder.
- Anthropic API anahtarları, uzun ömürlü gateway
  sunucuları ve açık sunucu tarafı faturalandırma denetimi için en öngörülebilir seçenek olmaya devam eder.

## Model kimlik doğrulama durumunu kontrol etme

```bash
openclaw models status
openclaw doctor
```

## API anahtarı döndürme davranışı (gateway)

Bazı sağlayıcılar, bir API çağrısı sağlayıcı rate limit'ine
çarptığında alternatif anahtarlarla isteği yeniden denemeyi destekler.

- Öncelik sırası:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY` (tek geçersiz kılma)
  - `<PROVIDER>_API_KEYS`
  - `<PROVIDER>_API_KEY`
  - `<PROVIDER>_API_KEY_*`
- Google sağlayıcıları ek fallback olarak `GOOGLE_API_KEY` değerini de içerir.
- Aynı anahtar listesi kullanılmadan önce tekilleştirilir.
- OpenClaw bir sonraki anahtarla yalnızca rate-limit hataları için yeniden dener (örneğin
  `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many concurrent
requests`, `ThrottlingException`, `concurrency limit reached` veya
  `workers_ai ... quota limit exceeded`).
- Rate-limit olmayan hatalar alternatif anahtarlarla yeniden denenmez.
- Tüm anahtarlar başarısız olursa, son denemenin nihai hatası döndürülür.

## Hangi kimlik bilgisinin kullanılacağını denetleme

### Oturum başına (sohbet komutu)

Geçerli oturum için belirli bir sağlayıcı kimlik bilgisini sabitlemek amacıyla `/model <alias-or-id>@<profileId>` kullanın (örnek profil kimlikleri: `anthropic:default`, `anthropic:work`).

Kompakt bir seçici için `/model` (veya `/model list`), tam görünüm için `/model status` kullanın (adaylar + sonraki auth profili ve yapılandırıldığında sağlayıcı uç nokta ayrıntıları).

### Aracı başına (CLI geçersiz kılması)

Bir aracı için açık bir auth profil sırası geçersiz kılması ayarlayın (o aracının `auth-state.json` dosyasında saklanır):

```bash
openclaw models auth order get --provider anthropic
openclaw models auth order set --provider anthropic anthropic:default
openclaw models auth order clear --provider anthropic
```

Belirli bir aracıyı hedeflemek için `--agent <id>` kullanın; yapılandırılmış varsayılan aracıyı kullanmak için bunu atlayın.
Sıra sorunlarını hata ayıklarken, `openclaw models status --probe`, atlanan
saklı profilleri sessizce atlamak yerine `excluded_by_auth_order` olarak gösterir.
Cooldown sorunlarını hata ayıklarken, rate-limit cooldown'larının tüm sağlayıcı profiline değil,
tek bir model kimliğine bağlı olabileceğini unutmayın.

## Sorun giderme

### "No credentials found"

Anthropic profili eksikse, **gateway sunucusunda**
bir Anthropic API anahtarı yapılandırın veya Anthropic setup-token yolunu ayarlayın, sonra yeniden kontrol edin:

```bash
openclaw models status
```

### Token süresi doluyor/dolmuş

Hangi profilin süresinin dolduğunu doğrulamak için `openclaw models status` çalıştırın. Bir
Anthropic token profili eksikse veya süresi dolmuşsa, bu kurulumu
setup-token ile yenileyin veya bir Anthropic API anahtarına geçin.

## İlgili

- [Secrets management](/tr/gateway/secrets)
- [Remote access](/tr/gateway/remote)
- [Auth storage](/tr/concepts/oauth)
