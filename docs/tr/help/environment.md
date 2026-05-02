---
read_when:
    - Hangi ortam değişkenlerinin hangi sırayla yüklendiğini bilmeniz gerekir
    - Gateway'de eksik API anahtarlarıyla ilgili hata ayıklıyorsunuz
    - Sağlayıcı kimlik doğrulamasını veya dağıtım ortamlarını belgeliyorsunuz
summary: OpenClaw'ın ortam değişkenlerini nereden yüklediği ve öncelik sırası
title: Ortam değişkenleri
x-i18n:
    generated_at: "2026-05-02T08:56:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 66787dd6f87dcaf81f721465e88dda519421b1a598179f71bce0239bb4791c46
    source_path: help/environment.md
    workflow: 16
---

OpenClaw ortam değişkenlerini birden çok kaynaktan çeker. Kural şudur: **mevcut değerleri asla geçersiz kılma**.

## Öncelik (en yüksek → en düşük)

1. **Süreç ortamı** (Gateway sürecinin üst kabuk/daemon'dan zaten aldığı değerler).
2. **Geçerli çalışma dizinindeki `.env`** (dotenv varsayılanı; geçersiz kılmaz).
3. **Global `.env`**: `~/.openclaw/.env` (diğer adıyla `$OPENCLAW_STATE_DIR/.env`; geçersiz kılmaz).
4. **Yapılandırma `env` bloğu**: `~/.openclaw/openclaw.json` içinde (yalnızca eksikse uygulanır).
5. **İsteğe bağlı oturum açma kabuğu içe aktarması** (`env.shellEnv.enabled` veya `OPENCLAW_LOAD_SHELL_ENV=1`), yalnızca beklenen eksik anahtarlar için uygulanır.

Varsayılan durum dizinini kullanan yeni Ubuntu kurulumlarında OpenClaw, global `.env` sonrasında uyumluluk yedeği olarak `~/.config/openclaw/gateway.env` dosyasını da değerlendirir. İki dosya da varsa ve uyuşmuyorsa OpenClaw `~/.openclaw/.env` değerini korur ve bir uyarı yazdırır.

Yapılandırma dosyası tamamen eksikse 4. adım atlanır; etkinleştirildiyse kabuk içe aktarması yine çalışır.

## Yapılandırma `env` bloğu

Satır içi ortam değişkenlerini ayarlamanın iki eşdeğer yolu (ikisi de geçersiz kılmaz):

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: {
      GROQ_API_KEY: "gsk-...",
    },
  },
}
```

## Kabuk ortamı içe aktarma

`env.shellEnv`, oturum açma kabuğunuzu çalıştırır ve yalnızca **eksik** beklenen anahtarları içe aktarır:

```json5
{
  env: {
    shellEnv: {
      enabled: true,
      timeoutMs: 15000,
    },
  },
}
```

Ortam değişkeni eşdeğerleri:

- `OPENCLAW_LOAD_SHELL_ENV=1`
- `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`

## Çalışma zamanında enjekte edilen ortam değişkenleri

OpenClaw, başlatılan alt süreçlere bağlam işaretleri de enjekte eder:

- `OPENCLAW_SHELL=exec`: `exec` aracı üzerinden çalıştırılan komutlar için ayarlanır.
- `OPENCLAW_SHELL=acp`: ACP çalışma zamanı arka uç süreci başlatmaları için ayarlanır (örneğin `acpx`).
- `OPENCLAW_SHELL=acp-client`: ACP köprü sürecini başlattığında `openclaw acp client` için ayarlanır.
- `OPENCLAW_SHELL=tui-local`: yerel TUI `!` kabuk komutları için ayarlanır.

Bunlar çalışma zamanı işaretleridir (gerekli kullanıcı yapılandırması değildir). Bağlama özgü kurallar uygulamak için kabuk/profil mantığında kullanılabilirler.

## UI ortam değişkenleri

- `OPENCLAW_THEME=light`: terminaliniz açık renkli bir arka plana sahipse açık TUI paletini zorunlu kılar.
- `OPENCLAW_THEME=dark`: koyu TUI paletini zorunlu kılar.
- `COLORFGBG`: terminaliniz bunu dışa aktarıyorsa OpenClaw, TUI paletini otomatik seçmek için arka plan rengi ipucunu kullanır.

## Yapılandırmada ortam değişkeni ikamesi

Yapılandırma dize değerlerinde `${VAR_NAME}` söz dizimini kullanarak ortam değişkenlerine doğrudan başvurabilirsiniz:

```json5
{
  models: {
    providers: {
      "vercel-gateway": {
        apiKey: "${VERCEL_GATEWAY_API_KEY}",
      },
    },
  },
}
```

Tüm ayrıntılar için [Yapılandırma: Ortam değişkeni ikamesi](/tr/gateway/configuration-reference#env-var-substitution) bölümüne bakın.

## Gizli referanslar ile `${ENV}` dizeleri

OpenClaw, ortam değişkeni odaklı iki kalıbı destekler:

- Yapılandırma değerlerinde `${VAR}` dize ikamesi.
- Gizli referansları destekleyen alanlar için SecretRef nesneleri (`{ source: "env", provider: "default", id: "VAR" }`).

İkisi de etkinleştirme zamanında süreç ortamından çözülür. SecretRef ayrıntıları [Gizli Bilgi Yönetimi](/tr/gateway/secrets) bölümünde belgelenmiştir.

## Yol ile ilgili ortam değişkenleri

| Değişken                 | Amaç                                                                                                                                                                                                             |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_HOME`          | Tüm dahili yol çözümlemesi için kullanılan ana dizini geçersiz kılar (`~/.openclaw/`, aracı dizinleri, oturumlar, kimlik bilgileri). OpenClaw'ı ayrılmış bir hizmet kullanıcısı olarak çalıştırırken kullanışlıdır. |
| `OPENCLAW_STATE_DIR`     | Durum dizinini geçersiz kılar (varsayılan `~/.openclaw`).                                                                                                                                                       |
| `OPENCLAW_CONFIG_PATH`   | Yapılandırma dosyası yolunu geçersiz kılar (varsayılan `~/.openclaw/openclaw.json`).                                                                                                                             |
| `OPENCLAW_INCLUDE_ROOTS` | `$include` yönergelerinin yapılandırma dizini dışındaki dosyaları çözümleyebileceği dizinlerin yol listesi (varsayılan: yok — `$include` yapılandırma diziniyle sınırlıdır). Tilde genişletilir.                 |

## Günlükleme

| Değişken             | Amaç                                                                                                                                                                                                 |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_LOG_LEVEL` | Hem dosya hem konsol için günlük düzeyini geçersiz kılar (örn. `debug`, `trace`). Yapılandırmadaki `logging.level` ve `logging.consoleLevel` değerlerine göre önceliklidir. Geçersiz değerler bir uyarıyla yok sayılır. |

### `OPENCLAW_HOME`

Ayarlı olduğunda `OPENCLAW_HOME`, tüm dahili yol çözümlemesi için sistem ana dizininin (`$HOME` / `os.homedir()`) yerini alır. Bu, başsız hizmet hesapları için tam dosya sistemi yalıtımı sağlar.

**Öncelik:** `OPENCLAW_HOME` > `$HOME` > `USERPROFILE` > `os.homedir()`

**Örnek** (macOS LaunchDaemon):

```xml
<key>EnvironmentVariables</key>
<dict>
  <key>OPENCLAW_HOME</key>
  <string>/Users/user</string>
</dict>
```

`OPENCLAW_HOME`, tilde yolu olarak da ayarlanabilir (örn. `~/svc`); kullanılmadan önce `$HOME` kullanılarak genişletilir.

## nvm kullanıcıları: web_fetch TLS hataları

Node.js **nvm** aracılığıyla kurulduysa (sistem paket yöneticisiyle değil), yerleşik `fetch()`, nvm'nin paketlenmiş CA deposunu kullanır; bu depoda modern kök CA'lar eksik olabilir (Let's Encrypt için ISRG Root X1/X2, DigiCert Global Root G2 vb.). Bu durum, çoğu HTTPS sitesinde `web_fetch` işleminin `"fetch failed"` hatasıyla başarısız olmasına neden olur.

Linux'ta OpenClaw, nvm'yi otomatik algılar ve düzeltmeyi gerçek başlangıç ortamında uygular:

- `openclaw gateway install`, systemd hizmet ortamına `NODE_EXTRA_CA_CERTS` yazar
- `openclaw` CLI giriş noktası, Node başlamadan önce `NODE_EXTRA_CA_CERTS` ayarlı olacak şekilde kendini yeniden çalıştırır

**Elle düzeltme (eski sürümler veya doğrudan `node ...` başlatmaları için):**

OpenClaw'ı başlatmadan önce değişkeni dışa aktarın:

```bash
export NODE_EXTRA_CA_CERTS=/etc/ssl/certs/ca-certificates.crt
openclaw gateway run
```

Bu değişken için yalnızca `~/.openclaw/.env` dosyasına yazmaya güvenmeyin; Node, `NODE_EXTRA_CA_CERTS` değerini süreç başlangıcında okur.

## Eski ortam değişkenleri

OpenClaw yalnızca `OPENCLAW_*` ortam değişkenlerini okur. Önceki sürümlerden kalan eski `CLAWDBOT_*` ve `MOLTBOT_*` önekleri sessizce yok sayılır.

Başlangıçta Gateway sürecinde bunlardan herhangi biri hâlâ ayarlıysa OpenClaw, algılanan önekleri ve toplam sayıyı listeleyen tek bir Node kullanımdan kaldırma uyarısı (`OPENCLAW_LEGACY_ENV_VARS`) yayar. Eski öneki `OPENCLAW_` ile değiştirerek her değeri yeniden adlandırın (örneğin `CLAWDBOT_GATEWAY_TOKEN` → `OPENCLAW_GATEWAY_TOKEN`); eski adların hiçbir etkisi yoktur.

## İlgili

- [Gateway yapılandırması](/tr/gateway/configuration)
- [SSS: ortam değişkenleri ve .env yükleme](/tr/help/faq#env-vars-and-env-loading)
- [Modellere genel bakış](/tr/concepts/models)
