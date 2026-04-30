---
read_when:
    - Model kimlik doğrulamasında veya OAuth süresinin dolmasında hata ayıklama
    - Kimlik doğrulamayı veya kimlik bilgisi depolamayı belgeleme
summary: 'Model kimlik doğrulaması: OAuth, API anahtarları, Claude CLI yeniden kullanımı ve Anthropic setup-token'
title: Kimlik doğrulama
x-i18n:
    generated_at: "2026-04-30T09:19:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 225adf26963183f8b5ecc76ca7bdc143f6a8800797fbd4be9d53d65b434f36c7
    source_path: gateway/authentication.md
    workflow: 16
---

<Note>
Bu sayfa **model sağlayıcı** kimlik doğrulama başvurusudur (API anahtarları, OAuth, Claude CLI yeniden kullanımı ve Anthropic kurulum belirteci). **Gateway bağlantısı** kimlik doğrulaması (belirteç, parola, güvenilir proxy) için [Yapılandırma](/tr/gateway/configuration) ve [Güvenilir Proxy Kimlik Doğrulaması](/tr/gateway/trusted-proxy-auth) bölümlerine bakın.
</Note>

OpenClaw, model sağlayıcıları için OAuth ve API anahtarlarını destekler. Sürekli açık Gateway
ana makinelerinde API anahtarları genellikle en öngörülebilir seçenektir. Abonelik/OAuth
akışları, sağlayıcı hesap modelinizle eşleştiğinde de desteklenir.

Tam OAuth akışı ve depolama
düzeni için [/concepts/oauth](/tr/concepts/oauth) bölümüne bakın.
SecretRef tabanlı kimlik doğrulama (`env`/`file`/`exec` sağlayıcıları) için [Gizli Bilgi Yönetimi](/tr/gateway/secrets) bölümüne bakın.
`models status --probe` tarafından kullanılan kimlik bilgisi uygunluğu/neden kodu kuralları için
[Kimlik Doğrulama Bilgisi Semantiği](/tr/auth-credential-semantics) bölümüne bakın.

## Önerilen kurulum (API anahtarı, herhangi bir sağlayıcı)

Uzun ömürlü bir Gateway çalıştırıyorsanız, seçtiğiniz
sağlayıcı için bir API anahtarıyla başlayın.
Özellikle Anthropic için API anahtarı kimlik doğrulaması hâlâ en öngörülebilir sunucu
kurulumudur, ancak OpenClaw yerel bir Claude CLI oturum açma bilgisinin yeniden kullanılmasını da destekler.

1. Sağlayıcı konsolunuzda bir API anahtarı oluşturun.
2. Bunu **Gateway ana makinesine** (`openclaw gateway` çalıştıran makineye) yerleştirin.

```bash
export <PROVIDER>_API_KEY="..."
openclaw models status
```

3. Gateway systemd/launchd altında çalışıyorsa, daemon’un okuyabilmesi için
   anahtarı `~/.openclaw/.env` içine koymayı tercih edin:

```bash
cat >> ~/.openclaw/.env <<'EOF'
<PROVIDER>_API_KEY=...
EOF
```

Ardından daemon’u yeniden başlatın (veya Gateway sürecinizi yeniden başlatın) ve yeniden denetleyin:

```bash
openclaw models status
openclaw doctor
```

Env değişkenlerini kendiniz yönetmek istemiyorsanız, ilk kurulum
API anahtarlarını daemon kullanımı için depolayabilir: `openclaw onboard`.

Env devralma (`env.shellEnv`,
`~/.openclaw/.env`, systemd/launchd) ayrıntıları için [Yardım](/tr/help) bölümüne bakın.

## Anthropic: Claude CLI ve belirteç uyumluluğu

Anthropic kurulum belirteci kimlik doğrulaması, desteklenen bir belirteç
yolu olarak OpenClaw içinde hâlâ kullanılabilir. Anthropic çalışanları daha sonra bize OpenClaw tarzı Claude CLI kullanımına
yeniden izin verildiğini söyledi, bu nedenle OpenClaw, Anthropic yeni bir politika yayımlamadığı sürece Claude CLI yeniden kullanımını ve `claude -p` kullanımını
bu entegrasyon için onaylanmış kabul eder. Ana makinede
Claude CLI yeniden kullanımı mevcutsa, artık tercih edilen yol budur.

Uzun ömürlü Gateway ana makineleri için Anthropic API anahtarı hâlâ en öngörülebilir
kurulumdur. Aynı ana makinede mevcut bir Claude oturumunu yeniden kullanmak istiyorsanız, ilk kurulum/yapılandırma içinde
Anthropic Claude CLI yolunu kullanın.

Claude CLI yeniden kullanımı için önerilen ana makine kurulumu:

```bash
# Run on the gateway host
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

Bu iki adımlı bir kurulumdur:

1. Claude Code’u Gateway ana makinesinde Anthropic’e oturum açtırın.
2. OpenClaw’a Anthropic model seçimini yerel `claude-cli`
   arka ucuna geçirmesini ve eşleşen OpenClaw kimlik doğrulama profilini depolamasını söyleyin.

`claude`, `PATH` üzerinde değilse, önce Claude Code’u kurun veya
`agents.defaults.cliBackends.claude-cli.command` değerini gerçek ikili dosya yoluna ayarlayın.

Manuel belirteç girişi (herhangi bir sağlayıcı; `auth-profiles.json` yazar + yapılandırmayı günceller):

```bash
openclaw models auth paste-token --provider openrouter
```

`auth-profiles.json` yalnızca kimlik bilgilerini depolar. Kanonik şekil şöyledir:

```json
{
  "version": 1,
  "profiles": {
    "openrouter:default": {
      "type": "api_key",
      "provider": "openrouter",
      "key": "OPENROUTER_API_KEY"
    }
  }
}
```

OpenClaw çalışma zamanında kanonik `version` + `profiles` şeklini bekler. Daha eski bir kurulumda hâlâ `{ "openrouter": { "apiKey": "..." } }` gibi düz bir dosya varsa, bunu bir `openrouter:default` API anahtarı profili olarak yeniden yazmak için `openclaw doctor --fix` komutunu çalıştırın; doctor, özgün dosyanın yanına bir `.legacy-flat.*.bak` kopyası koyar. `baseUrl`, `api`, model kimlikleri, başlıklar ve zaman aşımları gibi uç nokta ayrıntıları `auth-profiles.json` içinde değil, `openclaw.json` veya `models.json` içindeki `models.providers.<id>` altında yer almalıdır.

Kimlik doğrulama profili ref’leri statik kimlik bilgileri için de desteklenir:

- `api_key` kimlik bilgileri `keyRef: { source, provider, id }` kullanabilir
- `token` kimlik bilgileri `tokenRef: { source, provider, id }` kullanabilir
- OAuth modundaki profiller SecretRef kimlik bilgilerini desteklemez; `auth.profiles.<id>.mode`, `"oauth"` olarak ayarlanmışsa, o profil için SecretRef destekli `keyRef`/`tokenRef` girdisi reddedilir.

Otomasyona uygun denetim (süresi dolduğunda/eksik olduğunda çıkış `1`, süresi dolmak üzere olduğunda `2`):

```bash
openclaw models status --check
```

Canlı kimlik doğrulama yoklamaları:

```bash
openclaw models status --probe
```

Notlar:

- Yoklama satırları kimlik doğrulama profillerinden, env kimlik bilgilerinden veya `models.json` içinden gelebilir.
- Açık `auth.order.<provider>` depolanmış bir profili atlıyorsa, yoklama bu profil için denemek yerine
  `excluded_by_auth_order` bildirir.
- Kimlik doğrulama mevcutsa ancak OpenClaw o sağlayıcı için yoklanabilir bir model adayı çözemiyorsa,
  yoklama `status: no_model` bildirir.
- Hız sınırı bekleme süreleri model kapsamlı olabilir. Bir model için beklemede olan bir profil,
  aynı sağlayıcıdaki kardeş bir model için hâlâ kullanılabilir olabilir.

İsteğe bağlı operasyon betikleri (systemd/Termux) burada belgelenmiştir:
[Kimlik doğrulama izleme betikleri](/tr/help/scripts#auth-monitoring-scripts)

## Anthropic notu

Anthropic `claude-cli` arka ucu yeniden desteklenmektedir.

- Anthropic çalışanları bize bu OpenClaw entegrasyon yoluna yeniden izin verildiğini söyledi.
- Bu nedenle OpenClaw, Anthropic yeni bir politika yayımlamadığı sürece Claude CLI yeniden kullanımını ve `claude -p` kullanımını Anthropic destekli çalıştırmalar için onaylanmış
  kabul eder.
- Anthropic API anahtarları, uzun ömürlü Gateway
  ana makineleri ve açık sunucu tarafı faturalandırma denetimi için en öngörülebilir seçenek olmaya devam eder.

## Model kimlik doğrulama durumunu denetleme

```bash
openclaw models status
openclaw doctor
```

## API anahtarı döndürme davranışı (Gateway)

Bazı sağlayıcılar, bir API çağrısı sağlayıcı hız sınırına
ulaştığında isteği alternatif anahtarlarla yeniden denemeyi destekler.

- Öncelik sırası:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY` (tek geçersiz kılma)
  - `<PROVIDER>_API_KEYS`
  - `<PROVIDER>_API_KEY`
  - `<PROVIDER>_API_KEY_*`
- Google sağlayıcıları ek bir geri dönüş olarak `GOOGLE_API_KEY` de içerir.
- Aynı anahtar listesi kullanılmadan önce yinelenenlerden arındırılır.
- OpenClaw yalnızca hız sınırı hataları için bir sonraki anahtarla yeniden dener (örneğin
  `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many concurrent
requests`, `ThrottlingException`, `concurrency limit reached` veya
  `workers_ai ... quota limit exceeded`).
- Hız sınırı dışındaki hatalar alternatif anahtarlarla yeniden denenmez.
- Tüm anahtarlar başarısız olursa, son denemeden gelen nihai hata döndürülür.

## Hangi kimlik bilgisinin kullanılacağını denetleme

### Oturum başına (sohbet komutu)

Geçerli oturum için belirli bir sağlayıcı kimlik bilgisini sabitlemek üzere `/model <alias-or-id>@<profileId>` kullanın (örnek profil kimlikleri: `anthropic:default`, `anthropic:work`).

Kompakt bir seçici için `/model` (veya `/model list`) kullanın; tam görünüm için `/model status` kullanın (adaylar + sonraki kimlik doğrulama profili, ayrıca yapılandırıldığında sağlayıcı uç nokta ayrıntıları).

### Ajan başına (CLI geçersiz kılma)

Bir ajan için açık bir kimlik doğrulama profili sırası geçersiz kılması ayarlayın (o ajanın `auth-state.json` dosyasında depolanır):

```bash
openclaw models auth order get --provider anthropic
openclaw models auth order set --provider anthropic anthropic:default
openclaw models auth order clear --provider anthropic
```

Belirli bir ajanı hedeflemek için `--agent <id>` kullanın; yapılandırılmış varsayılan ajanı kullanmak için bunu atlayın.
Sıra sorunlarını hata ayıklarken, `openclaw models status --probe` atlanan
depolanmış profilleri sessizce atlamak yerine `excluded_by_auth_order` olarak gösterir.
Bekleme süresi sorunlarını hata ayıklarken, hız sınırı bekleme sürelerinin
tüm sağlayıcı profili yerine tek bir model kimliğine bağlı olabileceğini unutmayın.

## Sorun giderme

### "Kimlik bilgisi bulunamadı"

Anthropic profili eksikse,
**Gateway ana makinesinde** bir Anthropic API anahtarı yapılandırın veya Anthropic kurulum belirteci yolunu ayarlayın, ardından yeniden denetleyin:

```bash
openclaw models status
```

### Belirtecin süresi doluyor/dolmuş

Hangi profilin süresinin dolduğunu doğrulamak için `openclaw models status` çalıştırın. Bir
Anthropic belirteç profili eksikse veya süresi dolmuşsa, bu kurulumu
kurulum belirteciyle yenileyin veya bir Anthropic API anahtarına geçin.

## İlgili

- [Gizli bilgi yönetimi](/tr/gateway/secrets)
- [Uzaktan erişim](/tr/gateway/remote)
- [Kimlik doğrulama depolaması](/tr/concepts/oauth)
