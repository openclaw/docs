---
read_when:
    - Model kimlik doğrulaması veya OAuth süresinin dolmasıyla ilgili hata ayıklama
    - Kimlik doğrulamayı veya kimlik bilgileri depolamasını belgeleme
summary: 'Model kimlik doğrulaması: OAuth, API anahtarları, Claude CLI''ın yeniden kullanımı ve Anthropic kurulum belirteci'
title: Kimlik doğrulama
x-i18n:
    generated_at: "2026-07-12T12:17:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 002877002323297f0ff24fdeb5283bf998215f902b0cbd3b152f7ba9085a852a
    source_path: gateway/authentication.md
    workflow: 16
---

<Note>
Bu sayfa **model sağlayıcısı** kimlik doğrulamasını (API anahtarları, OAuth, Claude CLI yeniden kullanımı, Anthropic kurulum belirteci) kapsar. **Gateway bağlantısı** kimlik doğrulaması (belirteç, parola, güvenilir proxy) için [Yapılandırma](/tr/gateway/configuration) ve [Güvenilir Proxy Kimlik Doğrulaması](/tr/gateway/trusted-proxy-auth) bölümlerine bakın.
</Note>

OpenClaw, model sağlayıcıları için OAuth ve API anahtarlarını destekler. Sürekli çalışan bir Gateway ana makinesi için API anahtarı en öngörülebilir seçenektir; abonelik/OAuth akışları da sağlayıcı hesabı modelinizle uyumlu olduklarında çalışır.

- OAuth akışının tamamı ve depolama düzeni: [/concepts/oauth](/tr/concepts/oauth)
- SecretRef tabanlı kimlik doğrulama (`env`/`file`/`exec` sağlayıcıları): [Gizli Değer Yönetimi](/tr/gateway/secrets)
- `models status --probe` tarafından kullanılan kimlik bilgisi uygunluğu/neden kodları: [Kimlik Doğrulama Bilgisi Semantiği](/tr/auth-credential-semantics)

## Önerilen kurulum: API anahtarı (herhangi bir sağlayıcı)

1. Sağlayıcı konsolunuzda bir API anahtarı oluşturun.
2. Anahtarı **Gateway ana makinesine** (`openclaw gateway` komutunu çalıştıran makineye) yerleştirin:

```bash
export <PROVIDER>_API_KEY="..."
openclaw models status
```

3. Gateway systemd/launchd altında çalışıyorsa arka plan hizmetinin okuyabilmesi için anahtarı `~/.openclaw/.env` dosyasına yerleştirin:

```bash
cat >> ~/.openclaw/.env <<'EOF'
<PROVIDER>_API_KEY=...
EOF
```

4. Gateway işlemini (veya arka plan hizmetini) yeniden başlatın, ardından tekrar denetleyin:

```bash
openclaw models status
openclaw doctor
```

Ortam değişkenlerini kendiniz yönetmek istemiyorsanız `openclaw onboard`, API anahtarlarını arka plan hizmetinin kullanımı için de saklayabilir. Ortam yükleme önceliğinin tamamı (`env.shellEnv`, `~/.openclaw/.env`, systemd/launchd) için [Ortam değişkenleri](/tr/help/environment) bölümüne bakın.

## Anthropic: Claude CLI yeniden kullanımı

Anthropic kurulum belirteciyle kimlik doğrulama desteklenen bir yöntem olmaya devam eder. Claude CLI yeniden kullanımı (`claude -p` tarzı kullanım) da bu entegrasyon için desteklenir; ana makinede bir Claude CLI oturumu mevcut olduğunda yerel/masaüstü kullanım için tercih edilen yöntem budur. Uzun süre çalışan Gateway ana makineleri için açık sunucu tarafı faturalandırma denetimi sağlayan Anthropic API anahtarı hâlâ en öngörülebilir seçenektir.

Claude CLI yeniden kullanımı için ana makine kurulumu:

```bash
# Run on the gateway host
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

Bu işlem iki adımdan oluşur: ana makinede Claude Code ile Anthropic oturumu açın, ardından OpenClaw'a Anthropic model seçimini yerel `claude-cli` arka ucu üzerinden yönlendirmesini ve eşleşen OpenClaw kimlik doğrulama profilini saklamasını söyleyin.

`claude`, `PATH` içinde değilse Claude Code'u yükleyin veya `agents.defaults.cliBackends.claude-cli.command` değerini ikili dosyanın yoluna ayarlayın.

## Belirteci elle girme

Herhangi bir sağlayıcıyla çalışır; ajan başına SQLite kimlik doğrulama deposuna yazar ve yapılandırmayı günceller:

```bash
openclaw models auth paste-token --provider openrouter
```

OpenClaw, kimlik doğrulama profillerini her ajanın `openclaw-agent.sqlite` dosyasından okur. Uç nokta ayrıntıları (`baseUrl`, `api`, model kimlikleri, üstbilgiler, zaman aşımları) kimlik doğrulama profillerinde değil, `openclaw.json` veya `models.json` içindeki `models.providers.<id>` altında yer almalıdır.

Eski bir kurulumda hâlâ `auth-profiles.json`, `auth-state.json` veya `{ "openrouter": { "apiKey": "..." } }` gibi düz bir yapı varsa bunları SQLite'a aktarmak için `openclaw doctor --fix` komutunu çalıştırın; doctor, zaman damgalı yedekleri özgün JSON dosyalarının yanında tutar.

Bedrock `auth: "aws-sdk"` gibi harici kimlik doğrulama yolları kimlik bilgisi değildir. Adlandırılmış bir Bedrock yolu için `openclaw.json` içinde `auth.profiles.<id>.mode: "aws-sdk"` ayarlayın; kimlik doğrulama profili deposuna `type: "aws-sdk"` yazmayın. `openclaw doctor --fix`, eski AWS SDK işaretleyicilerini kimlik bilgisi deposundan yapılandırma meta verilerine taşır.

### SecretRef destekli kimlik bilgileri

- `api_key` kimlik bilgileri `keyRef: { source, provider, id }` kullanabilir
- `token` kimlik bilgileri `tokenRef: { source, provider, id }` kullanabilir
- OAuth modundaki profiller SecretRef kimlik bilgilerini reddeder: `auth.profiles.<id>.mode` değeri `"oauth"` ise bu profil için SecretRef destekli bir `keyRef`/`tokenRef` reddedilir.

## Model kimlik doğrulama durumunu denetleme

```bash
openclaw models status
openclaw doctor
```

Otomasyona uygun denetim; süresi dolmuş/eksik olduğunda `1`, süresi dolmak üzere olduğunda `2` koduyla çıkar:

```bash
openclaw models status --check
```

Canlı kimlik doğrulama yoklamaları (kapsamı daraltmak için `--probe-provider`, `--probe-profile`, `--probe-timeout`, `--probe-concurrency` veya `--probe-max-tokens` ekleyin):

```bash
openclaw models status --probe
```

Notlar:

- Yoklama satırları kimlik doğrulama profillerinden, ortam kimlik bilgilerinden veya `models.json` dosyasından gelebilir.
- `auth.order.<provider>` saklanan bir profili içermiyorsa yoklama, o profili denemek yerine `excluded_by_auth_order` bildirir.
- Kimlik doğrulama mevcut olduğu hâlde OpenClaw bu sağlayıcı için yoklanabilir bir model çözümleyemezse yoklama `status: no_model` bildirir.
- Hız sınırı bekleme süreleri model kapsamlı olabilir: bir model için bekleme süresinde olan profil, aynı sağlayıcıdaki benzer bir modele hizmet vermeye devam edebilir.

İsteğe bağlı işletim betikleri (systemd/Termux): [Kimlik doğrulama izleme betikleri](/tr/help/scripts#auth-monitoring-scripts).

## API anahtarı döndürme (Gateway)

Bazı sağlayıcılar, bir çağrı sağlayıcının hız sınırına takıldığında isteği yapılandırılmış alternatif bir anahtarla yeniden dener.

Sağlayıcı başına anahtar öncelik sırası:

1. `OPENCLAW_LIVE_<PROVIDER>_KEY` (tek geçersiz kılma, tek bir anahtarı sabitler)
2. `<PROVIDER>_API_KEYS` (virgül/boşluk/noktalı virgülle ayrılmış liste)
3. `<PROVIDER>_API_KEY`
4. `<PROVIDER>_API_KEY_*` (bu ön eke sahip herhangi bir ortam değişkeni)

Google sağlayıcıları (`google`, `google-vertex`) ayrıca yedek olarak `GOOGLE_API_KEY` değerini kullanır. Birleştirilmiş listedeki yinelenen değerler kullanılmadan önce kaldırılır.

OpenClaw yalnızca hata iletisi şunlardan biriyle eşleştiğinde sonraki anahtara geçer: `rate_limit`, `rate limit`, `429`, `quota exceeded`/`quota_exceeded`, `resource exhausted`/`resource_exhausted` veya `too many requests`. Diğer hatalar alternatif anahtarlarla yeniden denenmez. Tüm anahtarlar başarısız olursa son denemedeki hata döndürülür.

<Note>
`ThrottlingException`, `concurrency limit reached` veya `workers_ai ... quota limit exceeded` gibi sağlayıcıya özgü ifadeler, yukarıdaki API anahtarı döndürmeden ayrı bir mekanizma olan **yük devretme/yeniden deneme sınıflandırmasını** (yinelenen başarısızlıklarda modeller veya sağlayıcılar arasında geçiş yapma) yönlendirir.
</Note>

Kaydedilmiş kimlik doğrulamayı kaldırmak, sağlayıcıdaki anahtarı geçersiz kılmaz; sağlayıcı tarafında geçersiz kılmanız gerektiğinde anahtarı sağlayıcı panosunda döndürün veya iptal edin.

## Gateway çalışırken sağlayıcı kimlik doğrulamasını kaldırma

Sağlayıcı kimlik doğrulamasını Gateway denetim düzlemi üzerinden kaldırdığınızda OpenClaw, bu sağlayıcının kaydedilmiş kimlik doğrulama profillerini siler ve seçilen model sağlayıcısı kaldırılan sağlayıcıyla eşleşen etkin sohbet/ajan çalıştırmalarını iptal eder. İptal edilen çalıştırmalar, `stopReason: "auth-revoked"` ile normal iptal/yaşam döngüsü olaylarını yayınlar; böylece bağlı istemciler, kimlik bilgileri kaldırıldığı için çalıştırmanın durduğunu gösterebilir.

## Hangi kimlik bilgisinin kullanılacağını denetleme

### OpenAI ve eski `openai-codex` kimlikleri

OpenAI API anahtarı profilleri ile ChatGPT/Codex OAuth profillerinin ikisi de kurallı sağlayıcı kimliği `openai` değerini kullanır. Yeni yapılandırmalarda `openai:*` profil kimliklerini ve `auth.order.openai` değerini kullanın.

Eski yapılandırmalarda, kimlik doğrulama profili kimliklerinde veya `auth.order.openai-codex` içinde `openai-codex` görürseniz bunu eski taşıma girdisi olarak değerlendirin; yeni `openai-codex` profilleri oluşturmayın. Şunları çalıştırın:

```bash
openclaw doctor --fix
openclaw models auth list --provider openai
```

Doctor, eski `openai-codex:*` profil kimliklerini ve `auth.order.openai-codex` girdilerini kurallı `openai` yoluna yeniden yazar. OpenAI'a özgü model/çalışma zamanı yönlendirmesi için [OpenAI](/tr/providers/openai) bölümüne bakın.

### Oturum açma sırasında (CLI)

```bash
openclaw models auth login --provider openai --profile-id openai:ritsuko
openclaw models auth login --provider openai --profile-id openai:lain
```

`--profile-id`, aynı sağlayıcının birden fazla OAuth oturumunu tek bir ajan içinde ayrı tutar.

`--force`, seçilen ajan dizininde o sağlayıcıya ait kaydedilmiş kimlik doğrulama profillerini siler ve ardından aynı kimlik doğrulama akışını yeniden çalıştırır. Kaydedilmiş bir profil takıldığında, süresi dolduğunda veya yanlış hesaba bağlı olduğunda kullanın. Bu seçenek, sağlayıcıdaki kimlik bilgilerini iptal etmez.

```bash
openclaw models auth login --provider anthropic --force
```

### Oturum başına (sohbet komutu)

- `/model <alias-or-id>@<profileId>`, geçerli oturum için belirli bir sağlayıcı kimlik bilgisini sabitler (örnek profil kimlikleri: `anthropic:default`, `anthropic:work`).
- `/model` (veya `/model list`) kompakt bir seçici gösterir; `/model status` tam görünümü (adaylar + sonraki kimlik doğrulama profili ve yapılandırılmışsa sağlayıcı uç noktası ayrıntıları) gösterir.

Zaten çalışmakta olan bir sohbetin kimlik doğrulama sırasını veya profil sabitlemesini değiştirirseniz yeni bir oturum başlatmak için `/new` veya `/reset` gönderin; mevcut oturumlar sıfırlanana kadar geçerli model/profil seçimlerini korur.

### Ajan başına (CLI geçersiz kılması)

Kimlik doğrulama sırası geçersiz kılmaları, ilgili ajanın SQLite kimlik doğrulama durumunda saklanır:

```bash
openclaw models auth order get --provider anthropic
openclaw models auth order set --provider anthropic anthropic:default
openclaw models auth order clear --provider anthropic
```

Belirli bir ajanı hedeflemek için `--agent <id>` kullanın; yapılandırılmış varsayılan ajanı kullanmak için bu seçeneği belirtmeyin. `openclaw models status --probe`, dışarıda bırakılan saklanmış profilleri sessizce atlamak yerine `excluded_by_auth_order` olarak gösterir.

## Sorun giderme

### "Kimlik bilgisi bulunamadı"

**Gateway ana makinesinde** bir Anthropic API anahtarı yapılandırın veya Anthropic kurulum belirteci yolunu ayarlayın, ardından tekrar denetleyin:

```bash
openclaw models status
```

### Süresi dolmak üzere olan/dolmuş belirteç

Hangi profilin süresinin dolmak üzere olduğunu görmek için `openclaw models status` komutunu çalıştırın. Bir Anthropic belirteç profili eksikse veya süresi dolmuşsa kurulum belirteci aracılığıyla yenileyin ya da Anthropic API anahtarına geçin.

## İlgili konular

- [Gizli değer yönetimi](/tr/gateway/secrets)
- [Uzaktan erişim](/tr/gateway/remote)
- [Kimlik doğrulama depolaması](/tr/concepts/oauth)
