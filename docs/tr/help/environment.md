---
read_when:
    - Hangi ortam değişkenlerinin hangi sırayla yüklendiğini bilmeniz gerekir
    - Gateway'de eksik API anahtarlarında hata ayıklıyorsunuz
    - Sağlayıcı kimlik doğrulamasını veya dağıtım ortamlarını belgeliyorsunuz
summary: OpenClaw'un ortam değişkenlerini yüklediği yerler ve öncelik sırası
title: Ortam değişkenleri
x-i18n:
    generated_at: "2026-07-12T11:49:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e0010465008969ea1ebf7bb79d01ee86b7be20f7b6d0d90da72d8b0a3b1ed273
    source_path: help/environment.md
    workflow: 16
---

OpenClaw, ortam değişkenlerini birden çok kaynaktan alır. Kural şudur: **mevcut değerleri asla geçersiz kılma**.
Çalışma alanı `.env` dosyaları daha düşük güven düzeyine sahip bir kaynaktır: OpenClaw, öncelik sırasını uygulamadan önce çalışma alanı `.env` dosyalarındaki sağlayıcı kimlik bilgilerini ve korumalı çalışma zamanı denetimlerini yok sayar.

## Öncelik sırası (en yüksekten en düşüğe)

1. **İşlem ortamı** (Gateway işleminin üst kabuktan/daemon'dan zaten aldığı değerler).
2. **Geçerli çalışma dizinindeki `.env`** (dotenv varsayılanı; mevcut değerleri geçersiz kılmaz; sağlayıcı kimlik bilgileri ve korumalı çalışma zamanı denetimleri yok sayılır).
3. `~/.openclaw/.env` konumundaki **genel `.env`** (`$OPENCLAW_STATE_DIR/.env` olarak da bilinir; sağlayıcı API anahtarları için önerilir; mevcut değerleri geçersiz kılmaz).
4. `~/.openclaw/openclaw.json` içindeki **yapılandırma `env` bloğu** (yalnızca değer eksikse uygulanır).
5. **İsteğe bağlı oturum açma kabuğu içe aktarımı** (`env.shellEnv.enabled` veya `OPENCLAW_LOAD_SHELL_ENV=1`); yalnızca eksik olan beklenen anahtarlara uygulanır.

Varsayılan durum dizinini kullanan yeni Ubuntu kurulumlarında OpenClaw, genel `.env` dosyasından sonra `~/.config/openclaw/gateway.env` dosyasını da uyumluluk amaçlı geri dönüş seçeneği olarak değerlendirir. Her iki dosya da mevcutsa ve değerleri çelişiyorsa OpenClaw, `~/.openclaw/.env` değerini korur ve bir uyarı yazdırır.

Yapılandırma dosyası tamamen eksikse 4. adım atlanır; kabuk içe aktarımı etkinse yine çalışır.

## Sağlayıcı kimlik bilgileri ve çalışma alanı `.env` dosyası

Sağlayıcı API anahtarlarını yalnızca bir çalışma alanı `.env` dosyasında tutmayın. OpenClaw, bilinen tüm sağlayıcı kimlik doğrulama ortam değişkenleri (örneğin `GEMINI_API_KEY`, `GOOGLE_API_KEY`, `XAI_API_KEY`, `MISTRAL_API_KEY`, `GROQ_API_KEY`, `DEEPSEEK_API_KEY`, `PERPLEXITY_API_KEY`, `BRAVE_API_KEY`, `TAVILY_API_KEY`, `EXA_API_KEY`, `FIRECRAWL_API_KEY`) dahil olmak üzere çok sayıda sağlayıcı kimlik bilgisi ve uç nokta yönlendirme anahtarını çalışma alanı `.env` dosyalarından engeller. Ayrıca `_API_HOST`, `_BASE_URL` veya `_HOMESERVER` ile biten tüm anahtarlar ile `OPENCLAW_*`, `CLAWHUB_*`, `ANTHROPIC_API_KEY_*` ve `OPENAI_API_KEY_*` ad alanlarının tamamı engellenir.

Bunun yerine sağlayıcı kimlik bilgileri için şu güvenilir kaynaklardan birini kullanın:

- Kabuk, launchd/systemd birimi, kapsayıcı gizli değeri veya CI gizli değeri gibi Gateway işlem ortamı.
- `~/.openclaw/.env` veya `$OPENCLAW_STATE_DIR/.env` konumundaki genel çalışma zamanı dotenv dosyası.
- `~/.openclaw/openclaw.json` içindeki yapılandırma `env` bloğu.
- `env.shellEnv.enabled` veya `OPENCLAW_LOAD_SHELL_ENV=1` etkinleştirildiğinde isteğe bağlı oturum açma kabuğu içe aktarımı.

Sağlayıcı anahtarlarını daha önce yalnızca bir çalışma alanı `.env` dosyasında sakladıysanız bunları yukarıdaki güvenilir kaynaklardan birine taşıyın. Çalışma alanı `.env` dosyası; kimlik bilgisi, uç nokta yönlendirmesi, ana makine geçersiz kılması veya `OPENCLAW_*` çalışma zamanı denetimi olmayan sıradan proje değişkenlerini sağlamaya devam edebilir.

Güvenlik gerekçesi için [Çalışma alanı `.env` dosyaları](/tr/gateway/security#workspace-env-files) bölümüne bakın.

## Yapılandırma `env` bloğu

Satır içi ortam değişkenlerini ayarlamanın eşdeğer iki yolu vardır (ikisi de mevcut değerleri geçersiz kılmaz):

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

Yapılandırma `env` bloğu yalnızca değişmez dize değerlerini kabul eder. `file:...` değerlerini genişletmez; örneğin `XAI_API_KEY: "file:secrets/xai-api-key.txt"` sağlayıcılara tam olarak bu dize biçiminde iletilir.

Dosya destekli sağlayıcı anahtarları için bunu destekleyen kimlik bilgisi alanında bir SecretRef kullanın:

```json5
{
  secrets: {
    providers: {
      xai_key_file: {
        source: "file",
        path: "~/.openclaw/secrets/xai-api-key.txt",
        mode: "singleValue",
      },
    },
  },
  models: {
    providers: {
      xai: {
        apiKey: { source: "file", provider: "xai_key_file", id: "value" },
      },
    },
  },
}
```

Desteklenen alanlar için [Gizli Değer Yönetimi](/tr/gateway/secrets) ve [SecretRef kimlik bilgisi yüzeyi](/tr/reference/secretref-credential-surface) bölümlerine bakın.

## Kabuk ortamı içe aktarımı

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

Eşdeğer ortam değişkenleri:

- `OPENCLAW_LOAD_SHELL_ENV=1`
- `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000` (varsayılan `15000`)

## Exec kabuk anlık görüntüleri

Windows dışındaki Gateway ana makinelerinde bash ve zsh `exec` komutları varsayılan olarak bir başlangıç anlık görüntüsü kullanır.
Bu yolu devre dışı bırakmak için Gateway işlem ortamında `OPENCLAW_EXEC_SHELL_SNAPSHOT=0` değerini ayarlayın.
`false`, `no` ve `off` değerleri de bu özelliği devre dışı bırakır. Çağrı başına `exec.env` değerleri anlık görüntüleri açıp kapatamaz veya anlık görüntü önbelleğini başka bir konuma yönlendiremez.

## Çalışma zamanında eklenen ortam değişkenleri

OpenClaw, başlatılan alt işlemlere bağlam işaretçileri de ekler:

- `OPENCLAW_SHELL=exec`: `exec` aracı üzerinden çalıştırılan komutlar için ayarlanır.
- `OPENCLAW_SHELL=acp-client`: ACP köprü işlemini başlattığında `openclaw acp client` için ayarlanır.
- `OPENCLAW_SHELL=tui-local`: yerel TUI `!` kabuk komutları için ayarlanır.
- `OPENCLAW_CLI=1`: CLI giriş noktası tarafından başlatılan alt işlemler için ayarlanır.

Bunlar çalışma zamanı işaretçileridir (kullanıcı yapılandırması olarak gerekli değildir). Bağlama özgü kuralları uygulamak için kabuk/profil mantığında kullanılabilirler.

## Kullanıcı arayüzü ortam değişkenleri

- `OPENCLAW_THEME=light`: terminalinizin arka planı açıksa açık TUI paletini zorunlu kılar.
- `OPENCLAW_THEME=dark`: koyu TUI paletini zorunlu kılar.
- `COLORFGBG`: terminaliniz bu değişkeni dışa aktarıyorsa OpenClaw, TUI paletini otomatik seçmek için arka plan rengi ipucunu kullanır.

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

Tüm ayrıntılar için [Yapılandırma: Ortam değişkeni ikamesi](/tr/gateway/configuration-reference#env-var-substitution) bölümüne bakın.

## Gizli değer başvuruları ve `${ENV}` dizeleri

OpenClaw, ortam tarafından yönlendirilen iki kalıbı destekler:

- Yapılandırma değerlerinde `${VAR}` dize ikamesi.
- Gizli değer başvurularını destekleyen alanlar için SecretRef nesneleri (`{ source: "env", provider: "default", id: "VAR" }`).

Her ikisi de etkinleştirme sırasında işlem ortamından çözümlenir. SecretRef ayrıntıları [Gizli Değer Yönetimi](/tr/gateway/secrets) bölümünde belgelenmiştir.
Yapılandırma `env` bloğunun kendisi SecretRef nesnelerini veya `file:...` kısa gösterim değerlerini çözümlemez.

## Yolla ilgili ortam değişkenleri

| Değişken                 | Amaç                                                                                                                                                                                                                                 |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_HOME`          | Dahili OpenClaw yol varsayılanları için kullanılan giriş dizinini geçersiz kılar (`~/.openclaw/`, ajan dizinleri, oturumlar, kimlik bilgileri, yükleyici ilk kurulumu ve varsayılan geliştirme çalışma kopyası). OpenClaw özel bir hizmet kullanıcısı olarak çalıştırıldığında kullanışlıdır. |
| `OPENCLAW_STATE_DIR`     | Durum dizinini geçersiz kılar (varsayılan `~/.openclaw`).                                                                                                                                                                                   |
| `OPENCLAW_CONFIG_PATH`   | Yapılandırma dosyası yolunu geçersiz kılar (varsayılan `~/.openclaw/openclaw.json`).                                                                                                                                                                    |
| `OPENCLAW_INCLUDE_ROOTS` | `$include` yönergelerinin yapılandırma dizini dışındaki dosyaları çözümleyebileceği dizinlerin yol listesi (varsayılan: yoktur; `$include` yapılandırma diziniyle sınırlıdır). Tilde genişletmesi uygulanır.                                                         |

## Günlük kaydı

| Değişken                         | Amaç                                                                                                                                                                                      |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_LOG_LEVEL`             | Hem dosya hem de konsol için günlük düzeyini geçersiz kılar (örneğin `debug`, `trace`). Yapılandırmadaki `logging.level` ve `logging.consoleLevel` değerlerinden önceliklidir. Geçersiz değerler bir uyarıyla yok sayılır. |
| `OPENCLAW_DEBUG_MODEL_TRANSPORT` | Genel hata ayıklama günlüklerini etkinleştirmeden `info` düzeyinde hedefli model isteği/yanıtı zamanlama tanılamaları üretir.                                                                                  |
| `OPENCLAW_DEBUG_MODEL_PAYLOAD`   | Model yükü tanılamaları: `summary`, `tools` veya `full-redacted`. `full-redacted` boyutla sınırlandırılır ve hassas kısımları gizlenir ancak istem/ileti metni içerebilir.                                               |
| `OPENCLAW_DEBUG_SSE`             | Akış tanılamaları: ilk/tamamlandı zamanlaması için `events`, hassas kısımları gizlenmiş ilk beş SSE olayını dahil etmek için `peek`.                                                                                 |
| `OPENCLAW_DEBUG_CODE_MODE`       | Sağlayıcı araçlarının gizlenmesi ve kompakt doğrudan denetim/zorlama dahil kod modu model yüzeyi tanılamaları.                                                                                  |

### `OPENCLAW_HOME`

`OPENCLAW_HOME` ayarlandığında, dahili OpenClaw yol varsayılanları için sistem giriş dizininin (`$HOME` / `os.homedir()`) yerini alır. Buna varsayılan durum dizini, yapılandırma yolu, ajan dizinleri, kimlik bilgileri, yükleyici ilk kurulum çalışma alanı ve `openclaw update --channel dev` tarafından kullanılan varsayılan geliştirme çalışma kopyası dahildir.

**Öncelik sırası:** `OPENCLAW_HOME` > `$HOME` > `USERPROFILE` > Android'de Termux `PREFIX` giriş dizini geri dönüşü > `os.homedir()`

**Örnek** (macOS LaunchDaemon):

```xml
<key>EnvironmentVariables</key>
<dict>
  <key>OPENCLAW_HOME</key>
  <string>/Users/user</string>
</dict>
```

`OPENCLAW_HOME`, tilde içeren bir yola da ayarlanabilir (örneğin `~/svc`); bu yol kullanılmadan önce aynı işletim sistemi giriş dizini geri dönüş zinciri kullanılarak genişletilir.

`OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH` ve `OPENCLAW_GIT_DIR` gibi açık yol değişkenleri yine önceliklidir. Kabuk başlangıç dosyası algılama, paket yöneticisi kurulumu ve ana makine `~` genişletmesi gibi işletim sistemi hesabıyla ilgili görevler gerçek sistem giriş dizinini kullanmaya devam edebilir.

## nvm kullanıcıları: web_fetch TLS hataları

Node.js, sistem paket yöneticisi yerine **nvm** aracılığıyla yüklendiyse yerleşik `fetch()`, nvm ile birlikte gelen CA deposunu kullanır; bu depoda güncel kök CA'lar (Let's Encrypt için ISRG Root X1/X2, DigiCert Global Root G2 vb.) eksik olabilir. Bu durum, çoğu HTTPS sitesinde `web_fetch` işleminin `"fetch failed"` hatasıyla başarısız olmasına neden olur.

Linux'ta OpenClaw, nvm'yi otomatik olarak algılar ve düzeltmeyi gerçek başlangıç ortamında uygular:

- `openclaw gateway install`, `NODE_EXTRA_CA_CERTS` değerini systemd hizmet ortamına yazar
- `openclaw` CLI giriş noktası, Node başlatılmadan önce `NODE_EXTRA_CA_CERTS` ayarlanmış hâlde kendisini yeniden çalıştırır

**Elle düzeltme (eski sürümler veya doğrudan `node ...` başlatmaları için):**

OpenClaw'ı başlatmadan önce değişkeni dışa aktarın:

```bash
export NODE_EXTRA_CA_CERTS=/etc/ssl/certs/ca-certificates.crt
openclaw gateway run
```

Bu değişken için yalnızca `~/.openclaw/.env` dosyasına yazmaya güvenmeyin; Node, `NODE_EXTRA_CA_CERTS` değerini işlem başlangıcında okur.

## Eski ortam değişkenleri

OpenClaw yalnızca `OPENCLAW_*` ortam değişkenlerini okur. Önceki sürümlerde kullanılan eski `CLAWDBOT_*` ve `MOLTBOT_*` önekleri sessizce yok sayılır.

Gateway işlemi başlatıldığında bunlardan herhangi biri hâlâ ayarlıysa OpenClaw, algılanan önekleri ve toplam sayıyı listeleyen tek bir Node kullanımdan kaldırma uyarısı (`OPENCLAW_LEGACY_ENV_VARS`) üretir. Eski öneki `OPENCLAW_` ile değiştirerek her değeri yeniden adlandırın (örneğin `CLAWDBOT_GATEWAY_TOKEN` yerine `OPENCLAW_GATEWAY_TOKEN`); eski adların hiçbir etkisi yoktur.

## İlgili konular

- [Gateway yapılandırması](/tr/gateway/configuration)
- [SSS: ortam değişkenleri ve .env yükleme](/tr/help/faq#env-vars-and-env-loading)
- [Modellere genel bakış](/tr/concepts/models)
