---
read_when:
    - Hangi ortam değişkenlerinin hangi sırayla yüklendiğini bilmeniz gerekir
    - Gateway'de eksik API anahtarları için hata ayıklama yapıyorsunuz
    - Sağlayıcı kimlik doğrulamasını veya dağıtım ortamlarını belgeliyorsunuz
summary: OpenClaw'in ortam değişkenlerini nereden yüklediği ve öncelik sırası
title: Ortam değişkenleri
x-i18n:
    generated_at: "2026-04-30T09:26:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: d19b9053207a088b3eb39d03e36fc2d415295feb80da51bd71339884466b101b
    source_path: help/environment.md
    workflow: 16
---

OpenClaw ortam değişkenlerini birden fazla kaynaktan alır. Kural şudur: **mevcut değerlerin üzerine asla yazma**.

## Öncelik (en yüksek → en düşük)

1. **İşlem ortamı** (Gateway işleminin üst kabuk/daemon'dan zaten aldığı değerler).
2. **Geçerli çalışma dizinindeki `.env`** (dotenv varsayılanı; üzerine yazmaz).
3. **Genel `.env`** konumu `~/.openclaw/.env` (diğer adıyla `$OPENCLAW_STATE_DIR/.env`; üzerine yazmaz).
4. **Yapılandırma `env` bloğu** içinde `~/.openclaw/openclaw.json` (yalnızca eksikse uygulanır).
5. **İsteğe bağlı oturum açma kabuğu içe aktarması** (`env.shellEnv.enabled` veya `OPENCLAW_LOAD_SHELL_ENV=1`), yalnızca eksik beklenen anahtarlar için uygulanır.

Varsayılan durum dizinini kullanan yeni Ubuntu kurulumlarında OpenClaw, genel `.env` sonrasında uyumluluk geri dönüşü olarak `~/.config/openclaw/gateway.env` dosyasını da değerlendirir. İki dosya da varsa ve çakışıyorsa OpenClaw `~/.openclaw/.env` dosyasını korur ve bir uyarı yazdırır.

Yapılandırma dosyası tamamen eksikse 4. adım atlanır; kabuk içe aktarması etkinleştirilmişse yine çalışır.

## Yapılandırma `env` bloğu

Satır içi ortam değişkenlerini ayarlamak için iki eşdeğer yol (ikisi de üzerine yazmaz):

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

## Kabuk ortamı içe aktarması

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

OpenClaw, başlatılan alt işlemlere bağlam işaretleyicileri de enjekte eder:

- `OPENCLAW_SHELL=exec`: `exec` aracı üzerinden çalıştırılan komutlar için ayarlanır.
- `OPENCLAW_SHELL=acp`: ACP çalışma zamanı arka uç işlem başlatmaları için ayarlanır (örneğin `acpx`).
- `OPENCLAW_SHELL=acp-client`: ACP köprü işlemini başlattığında `openclaw acp client` için ayarlanır.
- `OPENCLAW_SHELL=tui-local`: yerel TUI `!` kabuk komutları için ayarlanır.

Bunlar çalışma zamanı işaretleyicileridir (zorunlu kullanıcı yapılandırması değildir). Kabuk/profil mantığında
bağlama özgü kurallar uygulamak için kullanılabilirler.

## UI ortam değişkenleri

- `OPENCLAW_THEME=light`: terminalinizin arka planı açıksa açık TUI paletini zorla kullanır.
- `OPENCLAW_THEME=dark`: koyu TUI paletini zorla kullanır.
- `COLORFGBG`: terminaliniz bunu dışa aktarıyorsa OpenClaw, TUI paletini otomatik seçmek için arka plan rengi ipucunu kullanır.

## Yapılandırmada ortam değişkeni ikamesi

`${VAR_NAME}` sözdizimini kullanarak yapılandırma dizesi değerlerinde ortam değişkenlerine doğrudan başvurabilirsiniz:

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

Tüm ayrıntılar için bkz. [Yapılandırma: Ortam değişkeni ikamesi](/tr/gateway/configuration-reference#env-var-substitution).

## Gizli bilgi başvuruları ve `${ENV}` dizeleri

OpenClaw ortam değişkeni temelli iki kalıbı destekler:

- Yapılandırma değerlerinde `${VAR}` dize ikamesi.
- Gizli bilgi başvurularını destekleyen alanlar için SecretRef nesneleri (`{ source: "env", provider: "default", id: "VAR" }`).

İkisi de etkinleştirme zamanında işlem ortamından çözümlenir. SecretRef ayrıntıları [Gizli Bilgi Yönetimi](/tr/gateway/secrets) bölümünde belgelenmiştir.

## Yolla ilgili ortam değişkenleri

| Değişken               | Amaç                                                                                                                                                                          |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_HOME`        | Tüm iç yol çözümlemesi için kullanılan ana dizini geçersiz kılar (`~/.openclaw/`, agent dizinleri, oturumlar, kimlik bilgileri). OpenClaw'u özel bir hizmet kullanıcısı olarak çalıştırırken yararlıdır. |
| `OPENCLAW_STATE_DIR`   | Durum dizinini geçersiz kılar (varsayılan `~/.openclaw`).                                                                                                                            |
| `OPENCLAW_CONFIG_PATH` | Yapılandırma dosyası yolunu geçersiz kılar (varsayılan `~/.openclaw/openclaw.json`).                                                                                                             |

## Günlükleme

| Değişken             | Amaç                                                                                                                                                                                      |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_LOG_LEVEL` | Hem dosya hem de konsol için günlük düzeyini geçersiz kılar (örn. `debug`, `trace`). Yapılandırmadaki `logging.level` ve `logging.consoleLevel` değerlerine göre önceliklidir. Geçersiz değerler uyarıyla yok sayılır. |

### `OPENCLAW_HOME`

Ayarlanırsa `OPENCLAW_HOME`, tüm iç yol çözümlemesi için sistem ana dizininin (`$HOME` / `os.homedir()`) yerini alır. Bu, başsız hizmet hesapları için tam dosya sistemi yalıtımı sağlar.

**Öncelik:** `OPENCLAW_HOME` > `$HOME` > `USERPROFILE` > `os.homedir()`

**Örnek** (macOS LaunchDaemon):

```xml
<key>EnvironmentVariables</key>
<dict>
  <key>OPENCLAW_HOME</key>
  <string>/Users/user</string>
</dict>
```

`OPENCLAW_HOME`, tilde yolu olarak da ayarlanabilir (örn. `~/svc`); bu yol kullanılmadan önce `$HOME` kullanılarak genişletilir.

## nvm kullanıcıları: web_fetch TLS hataları

Node.js **nvm** üzerinden yüklendiyse (sistem paket yöneticisiyle değil), yerleşik `fetch()`
nvm'in paketlenmiş CA deposunu kullanır; bu depoda modern kök CA'lar eksik olabilir (Let's Encrypt için ISRG Root X1/X2,
DigiCert Global Root G2 vb.). Bu, çoğu HTTPS sitesinde `web_fetch` işleminin `"fetch failed"` ile başarısız olmasına neden olur.

Linux'ta OpenClaw nvm'i otomatik algılar ve düzeltmeyi gerçek başlangıç ortamında uygular:

- `openclaw gateway install`, `NODE_EXTRA_CA_CERTS` değerini systemd hizmet ortamına yazar
- `openclaw` CLI giriş noktası, Node başlatılmadan önce `NODE_EXTRA_CA_CERTS` ayarlı olacak şekilde kendisini yeniden yürütür

**Manuel düzeltme (eski sürümler veya doğrudan `node ...` başlatmaları için):**

OpenClaw'u başlatmadan önce değişkeni dışa aktarın:

```bash
export NODE_EXTRA_CA_CERTS=/etc/ssl/certs/ca-certificates.crt
openclaw gateway run
```

Bu değişken için yalnızca `~/.openclaw/.env` dosyasına yazmaya güvenmeyin; Node,
`NODE_EXTRA_CA_CERTS` değerini işlem başlangıcında okur.

## Eski ortam değişkenleri

OpenClaw yalnızca `OPENCLAW_*` ortam değişkenlerini okur. Önceki sürümlerden kalan eski
`CLAWDBOT_*` ve `MOLTBOT_*` önekleri sessizce
yok sayılır.

Başlangıçta Gateway işleminde hâlâ bunlardan herhangi biri ayarlıysa OpenClaw,
algılanan önekleri ve toplam sayıyı listeleyen tek bir Node kullanımdan kaldırma uyarısı (`OPENCLAW_LEGACY_ENV_VARS`) yayar.
Eski öneki `OPENCLAW_` ile değiştirerek her değeri yeniden adlandırın (örneğin `CLAWDBOT_GATEWAY_TOKEN` →
`OPENCLAW_GATEWAY_TOKEN`); eski adların hiçbir etkisi yoktur.

## İlgili

- [Gateway yapılandırması](/tr/gateway/configuration)
- [SSS: ortam değişkenleri ve .env yükleme](/tr/help/faq#env-vars-and-env-loading)
- [Modellere genel bakış](/tr/concepts/models)
