---
read_when:
    - Hangi env değişkenlerinin yüklendiğini ve hangi sırayla yüklendiğini bilmeniz gerekiyor
    - Gateway içindeki eksik API anahtarlarında hata ayıklıyorsunuz
    - Sağlayıcı auth veya dağıtım ortamlarını belgeliyorsunuz
summary: OpenClaw'ın ortam değişkenlerini nereden yüklediği ve öncelik sırası
title: Ortam Değişkenleri
x-i18n:
    generated_at: "2026-04-05T13:55:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: a80aea69ca2ffe19a4e93140f05dd81fd576955562ff9913135d38a685a0353c
    source_path: help/environment.md
    workflow: 15
---

# Ortam değişkenleri

OpenClaw ortam değişkenlerini birden çok kaynaktan alır. Kural şudur: **mevcut değerler asla geçersiz kılınmaz**.

## Öncelik (en yüksek → en düşük)

1. **Süreç ortamı** (Gateway sürecinin üst shell/daemon'dan zaten aldığı şeyler).
2. **Geçerli çalışma dizinindeki `.env`** (dotenv varsayılanı; geçersiz kılmaz).
3. `~/.openclaw/.env` konumundaki **genel `.env`** (veya `$OPENCLAW_STATE_DIR/.env`; geçersiz kılmaz).
4. `~/.openclaw/openclaw.json` içindeki **config `env` bloğu** (yalnızca eksikse uygulanır).
5. **İsteğe bağlı login-shell içe aktarma** (`env.shellEnv.enabled` veya `OPENCLAW_LOAD_SHELL_ENV=1`), yalnızca beklenen anahtarlar eksikse uygulanır.

Varsayılan durum dizinini kullanan yeni Ubuntu kurulumlarında OpenClaw, genel `.env` sonrasında `~/.config/openclaw/gateway.env` dosyasını da bir uyumluluk fallback'i olarak değerlendirir. Her iki dosya da varsa ve çelişiyorsa OpenClaw `~/.openclaw/.env` dosyasını korur ve bir uyarı yazdırır.

Config dosyası tamamen eksikse 4. adım atlanır; etkinse shell içe aktarma yine çalışır.

## Config `env` bloğu

Satır içi env değişkenlerini ayarlamanın iki eşdeğer yolu vardır (ikisi de geçersiz kılmaz):

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

## Shell env içe aktarma

`env.shellEnv`, login shell'inizi çalıştırır ve yalnızca **eksik** beklenen anahtarları içe aktarır:

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

Eşdeğer env değişkenleri:

- `OPENCLAW_LOAD_SHELL_ENV=1`
- `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`

## Çalışma zamanında enjekte edilen env değişkenleri

OpenClaw ayrıca başlatılan alt süreçlere bağlam işaretleyicileri de enjekte eder:

- `OPENCLAW_SHELL=exec`: `exec` aracı üzerinden çalıştırılan komutlar için ayarlanır.
- `OPENCLAW_SHELL=acp`: ACP çalışma zamanı arka uç süreç başlatmaları için ayarlanır (örneğin `acpx`).
- `OPENCLAW_SHELL=acp-client`: `openclaw acp client`, ACP bridge sürecini başlattığında ayarlanır.
- `OPENCLAW_SHELL=tui-local`: yerel TUI `!` shell komutları için ayarlanır.

Bunlar çalışma zamanı işaretleyicileridir (gerekli kullanıcı config'i değildir). Shell/profile mantığında
bağlama özel kurallar uygulamak için kullanılabilirler.

## UI env değişkenleri

- `OPENCLAW_THEME=light`: terminaliniz açık arka plana sahipse açık TUI paletini zorla.
- `OPENCLAW_THEME=dark`: koyu TUI paletini zorla.
- `COLORFGBG`: terminaliniz bunu dışa aktarıyorsa OpenClaw, TUI paletini otomatik seçmek için arka plan rengi ipucunu kullanır.

## Config içinde env değişkeni yer değiştirme

`${VAR_NAME}` söz dizimini kullanarak env değişkenlerine doğrudan config string değerleri içinde başvurabilirsiniz:

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

Tam ayrıntılar için bkz. [Configuration: Env var substitution](/gateway/configuration-reference#env-var-substitution).

## Secret refs ve `${ENV}` string'leri

OpenClaw, env tabanlı iki deseni destekler:

- Config değerlerinde `${VAR}` string yer değiştirmesi.
- Gizli veri referanslarını destekleyen alanlar için SecretRef nesneleri (`{ source: "env", provider: "default", id: "VAR" }`).

Her ikisi de etkinleştirme sırasında süreç env'sinden çözümlenir. SecretRef ayrıntıları [Secrets Management](/gateway/secrets) içinde belgelenmiştir.

## Yolla ilgili env değişkenleri

| Değişken              | Amaç                                                                                                                                                                           |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `OPENCLAW_HOME`       | Tüm dahili yol çözümlemeleri için kullanılan ana dizini geçersiz kılar (`~/.openclaw/`, aracı dizinleri, oturumlar, kimlik bilgileri). OpenClaw'ı ayrılmış bir hizmet kullanıcısı olarak çalıştırırken yararlıdır. |
| `OPENCLAW_STATE_DIR`  | Durum dizinini geçersiz kılar (varsayılan `~/.openclaw`).                                                                                                                      |
| `OPENCLAW_CONFIG_PATH`| Config dosyası yolunu geçersiz kılar (varsayılan `~/.openclaw/openclaw.json`).                                                                                                |

## Günlükleme

| Değişken            | Amaç                                                                                                                                                                                        |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_LOG_LEVEL` | Hem dosya hem de konsol için günlük düzeyini geçersiz kılar (ör. `debug`, `trace`). Config içindeki `logging.level` ve `logging.consoleLevel` değerlerinden önceliklidir. Geçersiz değerler uyarıyla yok sayılır. |

### `OPENCLAW_HOME`

Ayarlanmışsa `OPENCLAW_HOME`, tüm dahili yol çözümlemesi için sistem ana dizininin (`$HOME` / `os.homedir()`) yerini alır. Bu, headless hizmet hesapları için tam dosya sistemi yalıtımı sağlar.

**Öncelik:** `OPENCLAW_HOME` > `$HOME` > `USERPROFILE` > `os.homedir()`

**Örnek** (macOS LaunchDaemon):

```xml
<key>EnvironmentVariables</key>
<dict>
  <key>OPENCLAW_HOME</key>
  <string>/Users/user</string>
</dict>
```

`OPENCLAW_HOME`, kullanım öncesinde `$HOME` ile genişletilen tilde yolu olarak da ayarlanabilir (ör. `~/svc`).

## nvm kullanıcıları: `web_fetch` TLS hataları

Node.js, sistem paket yöneticisi yerine **nvm** ile kurulduysa yerleşik `fetch()`,
nvm'nin paketlenmiş CA deposunu kullanır; bu depoda modern kök CA'lar eksik olabilir (Let's Encrypt için ISRG Root X1/X2,
DigiCert Global Root G2 vb.). Bu da `web_fetch` aracının çoğu HTTPS sitesinde `"fetch failed"` ile başarısız olmasına neden olur.

Linux'ta OpenClaw, nvm'yi otomatik olarak algılar ve düzeltmeyi gerçek başlatma ortamında uygular:

- `openclaw gateway install`, `NODE_EXTRA_CA_CERTS` değerini systemd hizmet ortamına yazar
- `openclaw` CLI giriş noktası, Node başlatılmadan önce `NODE_EXTRA_CA_CERTS` ayarlı şekilde kendini yeniden çalıştırır

**Elle düzeltme** (eski sürümler veya doğrudan `node ...` başlatmaları için):

OpenClaw'ı başlatmadan önce değişkeni dışa aktarın:

```bash
export NODE_EXTRA_CA_CERTS=/etc/ssl/certs/ca-certificates.crt
openclaw gateway run
```

Bu değişken için yalnızca `~/.openclaw/.env` dosyasına yazmaya güvenmeyin; Node
`NODE_EXTRA_CA_CERTS` değerini süreç başlangıcında okur.

## İlgili

- [Gateway configuration](/gateway/configuration)
- [FAQ: env vars and .env loading](/help/faq#env-vars-and-env-loading)
- [Models overview](/concepts/models)
