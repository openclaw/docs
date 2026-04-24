---
read_when:
    - Hangi ortam değişkenlerinin yüklendiğini ve hangi sırayla yüklendiğini bilmeniz gerekiyor
    - Gateway'de eksik API anahtarlarında hata ayıklıyorsunuz
    - Sağlayıcı kimlik doğrulamasını veya dağıtım ortamlarını belgeliyorsunuz
summary: OpenClaw'ın ortam değişkenlerini nereden yüklediği ve öncelik sırası
title: Ortam değişkenleri
x-i18n:
    generated_at: "2026-04-24T09:12:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: b0538e07cc2f785224b5f061bdaee982c4c849838e9d637defcc86a5121710df
    source_path: help/environment.md
    workflow: 15
---

OpenClaw ortam değişkenlerini birden fazla kaynaktan alır. Kural şudur: **mevcut değerleri asla geçersiz kılmayın**.

## Öncelik sırası (en yüksek → en düşük)

1. **İşlem ortamı** (Gateway işleminin üst kabuk/daemon'dan zaten sahip olduğu değerler).
2. **Geçerli çalışma dizinindeki `.env`** (dotenv varsayılanı; geçersiz kılmaz).
3. **Genel `.env`**: `~/.openclaw/.env` konumunda (diğer adıyla `$OPENCLAW_STATE_DIR/.env`; geçersiz kılmaz).
4. **`~/.openclaw/openclaw.json` içindeki yapılandırma `env` bloğu** (yalnızca eksikse uygulanır).
5. **İsteğe bağlı login-shell içe aktarma** (`env.shellEnv.enabled` veya `OPENCLAW_LOAD_SHELL_ENV=1`), yalnızca beklenen anahtarlar eksikse uygulanır.

Varsayılan state dizinini kullanan yeni Ubuntu kurulumlarında OpenClaw, genel `.env` sonrasında `~/.config/openclaw/gateway.env` dosyasını da geriye dönük uyumluluk için yedek olarak değerlendirir. Her iki dosya da varsa ve çelişiyorsa, OpenClaw `~/.openclaw/.env` dosyasını korur ve bir uyarı yazdırır.

Yapılandırma dosyası tamamen yoksa 4. adım atlanır; etkinleştirilmişse shell içe aktarma yine de çalışır.

## Yapılandırma `env` bloğu

Satır içi env değişkenleri ayarlamanın iki eşdeğer yolu vardır (ikisinde de geçersiz kılma yapılmaz):

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

Buna karşılık gelen ortam değişkenleri:

- `OPENCLAW_LOAD_SHELL_ENV=1`
- `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`

## Çalışma zamanında enjekte edilen ortam değişkenleri

OpenClaw ayrıca başlatılan alt işlemlere bağlam işaretleyicileri enjekte eder:

- `OPENCLAW_SHELL=exec`: `exec` aracı üzerinden çalıştırılan komutlar için ayarlanır.
- `OPENCLAW_SHELL=acp`: ACP çalışma zamanı arka uç işlem başlatmaları için ayarlanır (örneğin `acpx`).
- `OPENCLAW_SHELL=acp-client`: `openclaw acp client`, ACP köprü işlemini başlattığında ayarlanır.
- `OPENCLAW_SHELL=tui-local`: yerel TUI `!` kabuk komutları için ayarlanır.

Bunlar çalışma zamanı işaretleyicileridir (kullanıcı yapılandırmasında zorunlu değildir). Kabuk/profil mantığında
bağlama özgü kurallar uygulamak için kullanılabilirler.

## UI ortam değişkenleri

- `OPENCLAW_THEME=light`: Terminaliniz açık arka plan kullanıyorsa açık TUI paletini zorlar.
- `OPENCLAW_THEME=dark`: Koyu TUI paletini zorlar.
- `COLORFGBG`: Terminaliniz bunu dışa aktarıyorsa OpenClaw, TUI paletini otomatik seçmek için arka plan renk ipucunu kullanır.

## Yapılandırmada env değişkeni yer değiştirme

Yapılandırmadaki dize değerlerinde env değişkenlerine `${VAR_NAME}` söz dizimini kullanarak doğrudan başvurabilirsiniz:

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

Tüm ayrıntılar için bkz. [Yapılandırma: Env değişkeni yer değiştirme](/tr/gateway/configuration-reference#env-var-substitution).

## Secret ref'leri ve `${ENV}` dizeleri

OpenClaw env odaklı iki kalıbı destekler:

- Yapılandırma değerlerinde `${VAR}` dize yer değiştirmesi.
- Gizli anahtar başvurularını destekleyen alanlar için SecretRef nesneleri (`{ source: "env", provider: "default", id: "VAR" }`).

Her ikisi de etkinleştirme anında işlem ortamından çözümlenir. SecretRef ayrıntıları [Secrets Management](/tr/gateway/secrets) içinde belgelenmiştir.

## Yolla ilgili ortam değişkenleri

| Değişken             | Amaç                                                                                                                                                                              |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_HOME`      | Tüm dahili yol çözümlemesi için kullanılan home dizinini geçersiz kılar (`~/.openclaw/`, ajan dizinleri, oturumlar, kimlik bilgileri). OpenClaw'ı özel bir hizmet kullanıcısı olarak çalıştırırken yararlıdır. |
| `OPENCLAW_STATE_DIR` | State dizinini geçersiz kılar (varsayılan `~/.openclaw`).                                                                                                                         |
| `OPENCLAW_CONFIG_PATH` | Yapılandırma dosyası yolunu geçersiz kılar (varsayılan `~/.openclaw/openclaw.json`).                                                                                           |

## Günlükleme

| Değişken             | Amaç                                                                                                                                                                                        |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_LOG_LEVEL` | Hem dosya hem de konsol için günlük düzeyini geçersiz kılar (ör. `debug`, `trace`). Yapılandırmadaki `logging.level` ve `logging.consoleLevel` değerlerinden daha önceliklidir. Geçersiz değerler bir uyarıyla yok sayılır. |

### `OPENCLAW_HOME`

Ayarlanmışsa `OPENCLAW_HOME`, tüm dahili yol çözümlemesi için sistem home dizininin (`$HOME` / `os.homedir()`) yerini alır. Bu, başsız hizmet hesapları için tam dosya sistemi yalıtımı sağlar.

**Öncelik:** `OPENCLAW_HOME` > `$HOME` > `USERPROFILE` > `os.homedir()`

**Örnek** (macOS LaunchDaemon):

```xml
<key>EnvironmentVariables</key>
<dict>
  <key>OPENCLAW_HOME</key>
  <string>/Users/user</string>
</dict>
```

`OPENCLAW_HOME`, tilde içeren bir yol olarak da ayarlanabilir (ör. `~/svc`); bu durumda kullanılmadan önce `$HOME` kullanılarak genişletilir.

## nvm kullanıcıları: `web_fetch` TLS hataları

Node.js, sistem paket yöneticisi yerine **nvm** ile kurulduysa yerleşik `fetch()`,
nvm'nin birlikte gelen CA deposunu kullanır; bu depoda modern kök CA'lar (Let's Encrypt için ISRG Root X1/X2,
DigiCert Global Root G2 vb.) eksik olabilir. Bu da `web_fetch` işleminin çoğu HTTPS sitede `"fetch failed"` hatası vermesine neden olur.

Linux'ta OpenClaw, nvm'yi otomatik olarak algılar ve düzeltmeyi gerçek başlangıç ortamında uygular:

- `openclaw gateway install`, `NODE_EXTRA_CA_CERTS` değerini systemd hizmet ortamına yazar
- `openclaw` CLI giriş noktası, Node başlatılmadan önce `NODE_EXTRA_CA_CERTS` ayarlanmış şekilde kendisini yeniden çalıştırır

**El ile düzeltme** (eski sürümler veya doğrudan `node ...` başlatmaları için):

OpenClaw'ı başlatmadan önce değişkeni dışa aktarın:

```bash
export NODE_EXTRA_CA_CERTS=/etc/ssl/certs/ca-certificates.crt
openclaw gateway run
```

Bu değişken için yalnızca `~/.openclaw/.env` dosyasına yazmaya güvenmeyin; Node
`NODE_EXTRA_CA_CERTS` değerini işlem başlangıcında okur.

## İlgili

- [Gateway yapılandırması](/tr/gateway/configuration)
- [SSS: env değişkenleri ve .env yükleme](/tr/help/faq#env-vars-and-env-loading)
- [Modellere genel bakış](/tr/concepts/models)
