---
read_when:
    - Model kimlik doğrulamasında veya OAuth süre sonunu ayıklama
    - Kimlik doğrulama veya kimlik bilgisi depolamayı belgeleme
summary: 'Model kimlik doğrulaması: OAuth, API anahtarları, Claude CLI yeniden kullanımı ve Anthropic setup-token'
title: Kimlik Doğrulama
x-i18n:
    generated_at: "2026-06-28T00:32:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4b33eff2386ba48797c96b99f3eb80df4df2d5baab9c42b73fc8e5e722f0767b
    source_path: gateway/authentication.md
    workflow: 16
---

<Note>
Bu sayfa **model sağlayıcı** kimlik doğrulama başvurusudur (API anahtarları, OAuth, Claude CLI yeniden kullanımı ve Anthropic setup-token). **Gateway bağlantısı** kimlik doğrulaması (token, parola, trusted-proxy) için [Yapılandırma](/tr/gateway/configuration) ve [Trusted Proxy Kimlik Doğrulaması](/tr/gateway/trusted-proxy-auth) bölümlerine bakın.
</Note>

OpenClaw model sağlayıcıları için OAuth ve API anahtarlarını destekler. Sürekli açık Gateway
ana makineleri için API anahtarları genellikle en öngörülebilir seçenektir. Abonelik/OAuth
akışları, sağlayıcı hesap modelinizle eşleştiğinde de desteklenir.

Tam OAuth akışı ve depolama
düzeni için [/concepts/oauth](/tr/concepts/oauth) bölümüne bakın.
SecretRef tabanlı kimlik doğrulama (`env`/`file`/`exec` sağlayıcıları) için [Gizli Bilgi Yönetimi](/tr/gateway/secrets) bölümüne bakın.
`models status --probe` tarafından kullanılan kimlik bilgisi uygunluğu/neden kodu kuralları için
[Kimlik Doğrulama Bilgisi Semantiği](/tr/auth-credential-semantics) bölümüne bakın.

## Önerilen kurulum (API anahtarı, herhangi bir sağlayıcı)

Uzun ömürlü bir Gateway çalıştırıyorsanız, seçtiğiniz sağlayıcı için bir API anahtarıyla
başlayın.
Özellikle Anthropic için API anahtarı kimlik doğrulaması hâlâ en öngörülebilir sunucu
kurulumudur, ancak OpenClaw yerel bir Claude CLI oturum açma bilgisinin yeniden kullanılmasını da destekler.

1. Sağlayıcı konsolunuzda bir API anahtarı oluşturun.
2. Bunu **Gateway ana makinesine** (`openclaw gateway` çalıştıran makineye) koyun.

```bash
export <PROVIDER>_API_KEY="..."
openclaw models status
```

3. Gateway systemd/launchd altında çalışıyorsa, daemon'ın okuyabilmesi için
   anahtarı `~/.openclaw/.env` içine koymayı tercih edin:

```bash
cat >> ~/.openclaw/.env <<'EOF'
<PROVIDER>_API_KEY=...
EOF
```

Ardından daemon'ı yeniden başlatın (veya Gateway işleminizi yeniden başlatın) ve tekrar kontrol edin:

```bash
openclaw models status
openclaw doctor
```

Env var'ları kendiniz yönetmek istemiyorsanız, ilk kurulum daemon kullanımı için
API anahtarlarını saklayabilir: `openclaw onboard`.

Env devralma (`env.shellEnv`,
`~/.openclaw/.env`, systemd/launchd) ayrıntıları için [Yardım](/tr/help) bölümüne bakın.

## Anthropic: Claude CLI ve token uyumluluğu

Anthropic setup-token kimlik doğrulaması, desteklenen bir token
yolu olarak OpenClaw'da hâlâ kullanılabilir. Anthropic çalışanları daha sonra OpenClaw tarzı Claude CLI kullanımına
yeniden izin verildiğini bize bildirdi; bu nedenle OpenClaw, Anthropic yeni bir politika yayımlamadıkça
Claude CLI yeniden kullanımını ve `claude -p` kullanımını bu entegrasyon için
onaylanmış kabul eder. Ana makinede Claude CLI yeniden kullanımı mevcutsa, artık tercih edilen yol budur.

Uzun ömürlü Gateway ana makineleri için Anthropic API anahtarı hâlâ en öngörülebilir
kurulumdur. Aynı ana makinede mevcut bir Claude oturumunu yeniden kullanmak istiyorsanız,
ilk kurulum/yapılandırma içinde Anthropic Claude CLI yolunu kullanın.

Claude CLI yeniden kullanımı için önerilen ana makine kurulumu:

```bash
# Run on the gateway host
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

Bu iki adımlı bir kurulumdur:

1. Claude Code'un kendisini Gateway ana makinesinde Anthropic'e oturum açtırın.
2. OpenClaw'a Anthropic model seçimini yerel `claude-cli`
   arka ucuna geçirmesini ve eşleşen OpenClaw kimlik doğrulama profilini saklamasını söyleyin.

`claude`, `PATH` üzerinde değilse önce Claude Code'u yükleyin ya da
`agents.defaults.cliBackends.claude-cli.command` değerini gerçek binary yoluna ayarlayın.

Manuel token girişi (herhangi bir sağlayıcı; ajan başına SQLite kimlik doğrulama deposunu yazar + yapılandırmayı günceller):

```bash
openclaw models auth paste-token --provider openrouter
```

Kimlik doğrulama profili deposu yalnızca kimlik bilgilerini tutar. Eski `auth-profiles.json` dosyaları bu kanonik şekli kullanıyordu:

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

OpenClaw artık kimlik doğrulama profillerini her ajanın `openclaw-agent.sqlite` dosyasından okur. Daha eski bir kurulumda hâlâ `auth-profiles.json`, `auth-state.json` veya `{ "openrouter": { "apiKey": "..." } }` gibi düz bir kimlik doğrulama profili dosyası varsa, bunu SQLite'a içe aktarmak için `openclaw doctor --fix` çalıştırın; doctor, özgün JSON dosyalarının yanında zaman damgalı yedekler tutar. `baseUrl`, `api`, model kimlikleri, üstbilgiler ve zaman aşımları gibi uç nokta ayrıntıları kimlik doğrulama profillerinde değil, `openclaw.json` veya `models.json` içinde `models.providers.<id>` altında yer almalıdır.

Bedrock `auth: "aws-sdk"` gibi harici kimlik doğrulama rotaları da kimlik bilgisi değildir. Adlandırılmış bir Bedrock rotası istiyorsanız, `openclaw.json` içine `auth.profiles.<id>.mode: "aws-sdk"` koyun; kimlik doğrulama profili deposuna `type: "aws-sdk"` yazmayın. `openclaw doctor --fix`, eski AWS SDK işaretleyicilerini kimlik bilgisi deposundan yapılandırma metaverilerine taşır.

Kimlik doğrulama profili ref'leri statik kimlik bilgileri için de desteklenir:

- `api_key` kimlik bilgileri `keyRef: { source, provider, id }` kullanabilir
- `token` kimlik bilgileri `tokenRef: { source, provider, id }` kullanabilir
- OAuth modundaki profiller SecretRef kimlik bilgilerini desteklemez; `auth.profiles.<id>.mode` `"oauth"` olarak ayarlanmışsa, bu profil için SecretRef destekli `keyRef`/`tokenRef` girdisi reddedilir.

Otomasyona uygun kontrol (süresi dolmuş/eksik olduğunda çıkış `1`, süresi dolmak üzere olduğunda `2`):

```bash
openclaw models status --check
```

Canlı kimlik doğrulama yoklamaları:

```bash
openclaw models status --probe
```

Notlar:

- Yoklama satırları kimlik doğrulama profillerinden, env kimlik bilgilerinden veya `models.json` içinden gelebilir.
- Açık `auth.order.<provider>` saklanan bir profili atlıyorsa, yoklama bu profili denemek yerine
  `excluded_by_auth_order` bildirir.
- Kimlik doğrulama mevcutsa ancak OpenClaw bu sağlayıcı için yoklanabilir bir model adayı
  çözemiyorsa, yoklama `status: no_model` bildirir.
- Hız sınırı bekleme süreleri model kapsamlı olabilir. Bir model için bekleme süresinde olan bir profil,
  aynı sağlayıcıdaki kardeş bir model için yine de kullanılabilir olabilir.

İsteğe bağlı operasyon betikleri (systemd/Termux) burada belgelenmiştir:
[Kimlik doğrulama izleme betikleri](/tr/help/scripts#auth-monitoring-scripts)

## Anthropic notu

Anthropic `claude-cli` arka ucu yeniden desteklenmektedir.

- Anthropic çalışanları bu OpenClaw entegrasyon yoluna yeniden izin verildiğini bize bildirdi.
- Bu nedenle OpenClaw, Anthropic yeni bir politika yayımlamadıkça Claude CLI yeniden kullanımını ve `claude -p` kullanımını
  Anthropic destekli çalıştırmalar için onaylanmış kabul eder.
- Anthropic API anahtarları, uzun ömürlü Gateway
  ana makineleri ve açık sunucu tarafı faturalandırma kontrolü için en öngörülebilir seçenek olmaya devam eder.

## Model kimlik doğrulama durumunu denetleme

```bash
openclaw models status
openclaw doctor
```

## API anahtarı rotasyonu davranışı (Gateway)

Bazı sağlayıcılar, bir API çağrısı sağlayıcı hız sınırına
takıldığında isteği alternatif anahtarlarla yeniden denemeyi destekler.

- Öncelik sırası:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY` (tek geçersiz kılma)
  - `<PROVIDER>_API_KEYS`
  - `<PROVIDER>_API_KEY`
  - `<PROVIDER>_API_KEY_*`
- Google sağlayıcıları ek bir geri dönüş olarak `GOOGLE_API_KEY` değerini de içerir.
- Aynı anahtar listesi kullanımdan önce tekilleştirilir.
- OpenClaw yalnızca hız sınırı hataları için bir sonraki anahtarla yeniden dener (örneğin
  `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many concurrent
requests`, `ThrottlingException`, `concurrency limit reached` veya
  `workers_ai ... quota limit exceeded`).
- Hız sınırı dışı hatalar alternatif anahtarlarla yeniden denenmez.
- Tüm anahtarlar başarısız olursa, son denemeden gelen son hata döndürülür.

## Gateway çalışırken sağlayıcı kimlik doğrulamasını kaldırma

Sağlayıcı kimlik doğrulaması Gateway denetim düzlemi üzerinden kaldırıldığında, OpenClaw
bu sağlayıcı için kaydedilmiş kimlik doğrulama profillerini siler ve seçili model sağlayıcısı kaldırılan sağlayıcıyla eşleşen
aktif sohbet veya ajan çalıştırmalarını iptal eder. İptal edilen çalıştırmalar,
bağlı istemcilerin çalıştırmanın kimlik bilgileri kaldırıldığı için
durdurulduğunu gösterebilmesi için `stopReason: "auth-revoked"` ile
normal sohbet iptali ve yaşam döngüsü olaylarını yayar.

Kaydedilmiş kimlik doğrulamayı kaldırmak, sağlayıcıdaki anahtarları iptal etmez. Sağlayıcı tarafında geçersiz kılma gerektiğinde
anahtarı sağlayıcı panosunda döndürün veya iptal edin.

## Hangi kimlik bilgisinin kullanılacağını denetleme

### OpenAI ve eski `openai-codex` kimlikleri

OpenAI API anahtarı profilleri ve ChatGPT/Codex OAuth profilleri, ikisi de kanonik
sağlayıcı kimliği `openai` kullanır. Yeni yapılandırma `openai:*` profil kimliklerini ve
`auth.order.openai` kullanmalıdır.

Daha eski yapılandırmada, kimlik doğrulama profili kimliklerinde veya
`auth.order.openai-codex` içinde `openai-codex` görürseniz, bunu eski migrasyon girdisi olarak kabul edin. Yeni
`openai-codex` profilleri oluşturmayın. Şunu çalıştırın:

```bash
openclaw doctor --fix
openclaw models auth list --provider openai
```

Doctor, eski `openai-codex:*` profil kimliklerini ve
`auth.order.openai-codex` girdilerini kanonik `openai` kimlik doğrulama rotasına yeniden yazar. OpenAI'ye özel model/çalışma zamanı yönlendirmesi için [OpenAI](/tr/providers/openai) bölümüne bakın.

### Oturum açma sırasında (CLI)

Oturum açma sırasında adlandırılmış kimlik doğrulama profillerini destekleyen sağlayıcılar için
`openclaw models auth login --provider <id> --profile-id <profileId>` kullanın.

```bash
openclaw models auth login --provider openai --profile-id openai:ritsuko
openclaw models auth login --provider openai --profile-id openai:lain
```

Bu, aynı sağlayıcı için birden çok OAuth oturumunu
tek bir ajan içinde ayrı tutmanın en kolay yoludur.

Kaydedilmiş bir sağlayıcı profili takılmış, süresi dolmuş veya yanlış hesaba bağlıysa ve normal oturum açma komutu onu yeniden kullanmaya devam ediyorsa `--force` kullanın. `--force`, seçili ajan dizinindeki
bu sağlayıcı için kaydedilmiş kimlik doğrulama profillerini siler, ardından
aynı sağlayıcı kimlik doğrulama akışını yeniden çalıştırır. Sağlayıcıdaki kimlik bilgilerini iptal etmez;
sağlayıcı tarafında geçersiz kılma gerektiğinde bunları sağlayıcı panosunda
döndürün veya iptal edin.

```bash
openclaw models auth login --provider anthropic --force
```

### Oturum başına (sohbet komutu)

Geçerli oturum için belirli bir sağlayıcı kimlik bilgisini sabitlemek üzere `/model <alias-or-id>@<profileId>` kullanın (örnek profil kimlikleri: `anthropic:default`, `anthropic:work`).

Kompakt bir seçici için `/model` (veya `/model list`) kullanın; tam görünüm için `/model status` kullanın (adaylar + sonraki kimlik doğrulama profili, yapılandırıldığında sağlayıcı uç nokta ayrıntılarıyla birlikte).

### Ajan başına (CLI geçersiz kılma)

Bir ajan için açık bir kimlik doğrulama profili sırası geçersiz kılması ayarlayın (o ajanın SQLite kimlik doğrulama durumunda saklanır):

```bash
openclaw models auth order get --provider anthropic
openclaw models auth order set --provider anthropic anthropic:default
openclaw models auth order clear --provider anthropic
```

Belirli bir ajanı hedeflemek için `--agent <id>` kullanın; yapılandırılmış varsayılan ajanı kullanmak için bunu atlayın.
Sıra sorunlarında hata ayıklarken, `openclaw models status --probe` atlanan
saklanan profilleri sessizce atlamak yerine `excluded_by_auth_order` olarak gösterir.
Bekleme süresi sorunlarında hata ayıklarken, hız sınırı bekleme sürelerinin
tüm sağlayıcı profili yerine tek bir model kimliğine bağlı olabileceğini unutmayın.

Zaten çalışan bir sohbet için kimlik doğrulama sırasını veya profil sabitlemesini değiştirirseniz,
yeni bir oturum başlatmak için o sohbette `/new` veya `/reset` gönderin. Mevcut
oturumlar sıfırlanana kadar geçerli model/profil seçimlerini koruyabilir.

## Sorun giderme

### "No credentials found"

Anthropic profili eksikse, **Gateway ana makinesinde** bir Anthropic API anahtarı yapılandırın
veya Anthropic setup-token yolunu ayarlayın, ardından tekrar kontrol edin:

```bash
openclaw models status
```

### Token süresi doluyor/doldu

Hangi profilin süresinin dolduğunu doğrulamak için `openclaw models status` çalıştırın. Bir
Anthropic token profili eksikse veya süresi dolmuşsa, bu kurulumu
setup-token ile yenileyin ya da bir Anthropic API anahtarına geçin.

## İlgili

- [Gizli bilgi yönetimi](/tr/gateway/secrets)
- [Uzak erişim](/tr/gateway/remote)
- [Kimlik doğrulama depolaması](/tr/concepts/oauth)
