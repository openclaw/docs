---
read_when:
    - Hangi ortam değişkenlerinin hangi sırayla yüklendiğini bilmeniz gerekir
    - Gateway'de eksik API anahtarlarıyla ilgili hata ayıklıyorsunuz
    - Sağlayıcı kimlik doğrulamasını veya dağıtım ortamlarını belgeliyorsunuz
summary: OpenClaw'ın ortam değişkenlerini nereden yüklediği ve öncelik sırası
title: Ortam değişkenleri
x-i18n:
    generated_at: "2026-05-11T20:31:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: b4b91e9bb3c386292f11a3ffe5ae718a74a800bd19fe95073da990d881e6069d
    source_path: help/environment.md
    workflow: 16
---

OpenClaw, ortam değişkenlerini birden çok kaynaktan çeker. Kural şudur: **mevcut değerleri asla geçersiz kılma**.

## Öncelik (en yüksek → en düşük)

1. **Süreç ortamı** (Gateway sürecinin üst kabuk/daemon'dan zaten sahip olduğu değerler).
2. **Geçerli çalışma dizinindeki `.env`** (dotenv varsayılanı; geçersiz kılmaz).
3. **Global `.env`** konumu `~/.openclaw/.env` (diğer adıyla `$OPENCLAW_STATE_DIR/.env`; geçersiz kılmaz).
4. `~/.openclaw/openclaw.json` içindeki **yapılandırma `env` bloğu** (yalnızca eksikse uygulanır).
5. **İsteğe bağlı login-shell içe aktarımı** (`env.shellEnv.enabled` veya `OPENCLAW_LOAD_SHELL_ENV=1`), yalnızca eksik beklenen anahtarlar için uygulanır.

Varsayılan durum dizinini kullanan yeni Ubuntu kurulumlarında OpenClaw, global `.env` sonrasında uyumluluk yedeği olarak `~/.config/openclaw/gateway.env` dosyasını da değerlendirir. İki dosya da varsa ve uyuşmuyorsa OpenClaw `~/.openclaw/.env` dosyasını korur ve bir uyarı yazdırır.

Yapılandırma dosyası tamamen eksikse 4. adım atlanır; kabuk içe aktarımı etkinse yine çalışır.

## Yapılandırma `env` bloğu

Satır içi ortam değişkenlerini ayarlamanın eşdeğer iki yolu (ikisi de geçersiz kılmaz):

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

## Kabuk ortamı içe aktarımı

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

Ortam değişkeni eşdeğerleri:

- `OPENCLAW_LOAD_SHELL_ENV=1`
- `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`

## Çalışma zamanında enjekte edilen ortam değişkenleri

OpenClaw ayrıca başlatılan alt süreçlere bağlam işaretleyicileri enjekte eder:

- `OPENCLAW_SHELL=exec`: `exec` aracı üzerinden çalıştırılan komutlar için ayarlanır.
- `OPENCLAW_SHELL=acp`: ACP çalışma zamanı arka uç süreç başlatmaları için ayarlanır (örneğin `acpx`).
- `OPENCLAW_SHELL=acp-client`: ACP köprü sürecini başlattığında `openclaw acp client` için ayarlanır.
- `OPENCLAW_SHELL=tui-local`: yerel TUI `!` kabuk komutları için ayarlanır.

Bunlar çalışma zamanı işaretleyicileridir (gerekli kullanıcı yapılandırması değildir). Bağlama özgü kurallar uygulamak için kabuk/profil mantığında kullanılabilirler.

## UI ortam değişkenleri

- `OPENCLAW_THEME=light`: terminaliniz açık renkli bir arka plana sahipse açık TUI paletini zorunlu kılar.
- `OPENCLAW_THEME=dark`: koyu TUI paletini zorunlu kılar.
- `COLORFGBG`: terminaliniz bunu dışa aktarıyorsa OpenClaw, TUI paletini otomatik seçmek için arka plan rengi ipucunu kullanır.

## Yapılandırmada ortam değişkeni ikamesi

`${VAR_NAME}` söz dizimini kullanarak yapılandırma dizesi değerlerinde ortam değişkenlerine doğrudan başvurabilirsiniz:

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

Tam ayrıntılar için [Yapılandırma: Ortam değişkeni ikamesi](/tr/gateway/configuration-reference#env-var-substitution) bölümüne bakın.

## Gizli referansları ve `${ENV}` dizeleri

OpenClaw, ortam odaklı iki deseni destekler:

- Yapılandırma değerlerinde `${VAR}` dize ikamesi.
- Gizli referanslarını destekleyen alanlar için SecretRef nesneleri (`{ source: "env", provider: "default", id: "VAR" }`).

İkisi de etkinleştirme zamanında süreç ortamından çözümlenir. SecretRef ayrıntıları [Gizli Anahtar Yönetimi](/tr/gateway/secrets) bölümünde belgelenmiştir.

## Yolla ilgili ortam değişkenleri

| Değişken                 | Amaç                                                                                                                                                                                     |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_HOME`          | Tüm dahili yol çözümlemesi için kullanılan giriş dizinini geçersiz kılar (`~/.openclaw/`, ajan dizinleri, oturumlar, kimlik bilgileri). OpenClaw özel bir hizmet kullanıcısı olarak çalıştırılırken kullanışlıdır. |
| `OPENCLAW_STATE_DIR`     | Durum dizinini geçersiz kılar (varsayılan `~/.openclaw`).                                                                                                                               |
| `OPENCLAW_CONFIG_PATH`   | Yapılandırma dosyası yolunu geçersiz kılar (varsayılan `~/.openclaw/openclaw.json`).                                                                                                    |
| `OPENCLAW_INCLUDE_ROOTS` | `$include` yönergelerinin yapılandırma dizini dışındaki dosyaları çözümleyebileceği dizinlerin yol listesi (varsayılan: yok — `$include` yapılandırma diziniyle sınırlıdır). Tilde genişletilir. |

## Günlükleme

| Değişken                         | Amaç                                                                                                                                                                                                 |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_LOG_LEVEL`             | Hem dosya hem konsol için günlük seviyesini geçersiz kılar (örn. `debug`, `trace`). Yapılandırmadaki `logging.level` ve `logging.consoleLevel` değerlerine göre önceliklidir. Geçersiz değerler bir uyarıyla yok sayılır. |
| `OPENCLAW_DEBUG_MODEL_TRANSPORT` | Global hata ayıklama günlüklerini etkinleştirmeden `info` seviyesinde hedefli model istek/yanıt zamanlama tanılamaları yayar.                                                                         |
| `OPENCLAW_DEBUG_MODEL_PAYLOAD`   | Model yükü tanılamaları: `summary`, `tools` veya `full-redacted`. `full-redacted` sınırlandırılır ve redakte edilir ancak istem/ileti metni içerebilir.                                               |
| `OPENCLAW_DEBUG_SSE`             | Akış tanılamaları: ilk/tamamlandı zamanlaması için `events`, ilk beş redakte edilmiş SSE olayını dahil etmek için `peek`.                                                                            |
| `OPENCLAW_DEBUG_CODE_MODE`       | Sağlayıcı-aracı gizleme ve yalnızca exec/wait zorlaması dahil kod modu model yüzeyi tanılamaları.                                                                                                    |

### `OPENCLAW_HOME`

Ayarlı olduğunda `OPENCLAW_HOME`, tüm dahili yol çözümlemesi için sistem giriş dizininin (`$HOME` / `os.homedir()`) yerini alır. Bu, başsız hizmet hesapları için tam dosya sistemi yalıtımı sağlar.

**Öncelik:** `OPENCLAW_HOME` > `$HOME` > `USERPROFILE` > `os.homedir()`

**Örnek** (macOS LaunchDaemon):

```xml
<key>EnvironmentVariables</key>
<dict>
  <key>OPENCLAW_HOME</key>
  <string>/Users/user</string>
</dict>
```

`OPENCLAW_HOME` ayrıca tilde yolu olarak da ayarlanabilir (örn. `~/svc`); bu yol kullanılmadan önce `$HOME` kullanılarak genişletilir.

## nvm kullanıcıları: web_fetch TLS hataları

Node.js **nvm** üzerinden kurulduysa (sistem paket yöneticisiyle değil), yerleşik `fetch()`
nvm'nin paketlenmiş CA deposunu kullanır; bu depo modern kök CA'ları eksik olabilir (Let's Encrypt için ISRG Root X1/X2,
DigiCert Global Root G2 vb.). Bu, `web_fetch` aracının çoğu HTTPS sitesinde `"fetch failed"` hatasıyla başarısız olmasına neden olur.

Linux'ta OpenClaw, nvm'yi otomatik algılar ve düzeltmeyi gerçek başlangıç ortamında uygular:

- `openclaw gateway install`, `NODE_EXTRA_CA_CERTS` değerini systemd hizmet ortamına yazar
- `openclaw` CLI giriş noktası, Node başlatılmadan önce `NODE_EXTRA_CA_CERTS` ayarlı olacak şekilde kendini yeniden çalıştırır

**Elle düzeltme (eski sürümler veya doğrudan `node ...` başlatmaları için):**

OpenClaw'ı başlatmadan önce değişkeni dışa aktarın:

```bash
export NODE_EXTRA_CA_CERTS=/etc/ssl/certs/ca-certificates.crt
openclaw gateway run
```

Bu değişken için yalnızca `~/.openclaw/.env` dosyasına yazmaya güvenmeyin; Node
`NODE_EXTRA_CA_CERTS` değerini süreç başlangıcında okur.

## Eski ortam değişkenleri

OpenClaw yalnızca `OPENCLAW_*` ortam değişkenlerini okur. Önceki sürümlerdeki eski
`CLAWDBOT_*` ve `MOLTBOT_*` önekleri sessizce yok sayılır.

Başlangıçta Gateway sürecinde bunlardan herhangi biri hâlâ ayarlıysa OpenClaw,
algılanan önekleri ve toplam sayıyı listeleyen tek bir Node kullanımdan kaldırma uyarısı
(`OPENCLAW_LEGACY_ENV_VARS`) yayar. Her değeri, eski öneki `OPENCLAW_` ile değiştirerek yeniden adlandırın
(örneğin `CLAWDBOT_GATEWAY_TOKEN` →
`OPENCLAW_GATEWAY_TOKEN`); eski adların hiçbir etkisi yoktur.

## İlgili

- [Gateway yapılandırması](/tr/gateway/configuration)
- [SSS: ortam değişkenleri ve .env yükleme](/tr/help/faq#env-vars-and-env-loading)
- [Modellere genel bakış](/tr/concepts/models)
