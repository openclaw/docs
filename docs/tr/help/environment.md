---
read_when:
    - Hangi ortam değişkenlerinin yüklendiğini ve hangi sırayla yüklendiğini bilmeniz gerekir
    - Gateway'de eksik API anahtarları sorununu gideriyorsunuz
    - Sağlayıcı kimlik doğrulamasını veya dağıtım ortamlarını belgeliyorsunuz
summary: OpenClaw ortam değişkenlerini nereden yükler ve öncelik sırası
title: Ortam değişkenleri
x-i18n:
    generated_at: "2026-06-28T00:40:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7e36f93efe29f9cc0e9942659c323a635d21fcaa436427dcb21f5694e5d0458b
    source_path: help/environment.md
    workflow: 16
---

OpenClaw ortam değişkenlerini birden fazla kaynaktan çeker. Kural şudur: **mevcut değerleri asla geçersiz kılma**.
Çalışma alanı `.env` dosyaları daha düşük güvenilirlikte bir kaynaktır: OpenClaw önceliği uygulamadan önce çalışma alanı `.env` içindeki sağlayıcı kimlik bilgilerini ve korumalı çalışma zamanı denetimlerini yok sayar.

## Öncelik (en yüksek → en düşük)

1. **İşlem ortamı** (Gateway işleminin üst kabuk/daemon'dan zaten aldığı ortam).
2. **Geçerli çalışma dizinindeki `.env`** (dotenv varsayılanı; geçersiz kılmaz; sağlayıcı kimlik bilgileri ve korumalı çalışma zamanı denetimleri yok sayılır).
3. **Genel `.env`**: `~/.openclaw/.env` (diğer adıyla `$OPENCLAW_STATE_DIR/.env`; sağlayıcı API anahtarları için önerilir; geçersiz kılmaz).
4. **Yapılandırma `env` bloğu**: `~/.openclaw/openclaw.json` içinde (yalnızca eksikse uygulanır).
5. **İsteğe bağlı oturum açma kabuğu içe aktarımı** (`env.shellEnv.enabled` veya `OPENCLAW_LOAD_SHELL_ENV=1`), yalnızca eksik beklenen anahtarlar için uygulanır.

Varsayılan durum dizinini kullanan yeni Ubuntu kurulumlarında OpenClaw, genel `.env` sonrasında `~/.config/openclaw/gateway.env` dosyasını da uyumluluk yedeği olarak değerlendirir. Her iki dosya da varsa ve uyuşmuyorsa, OpenClaw `~/.openclaw/.env` değerlerini korur ve bir uyarı yazdırır.

Yapılandırma dosyası tamamen eksikse 4. adım atlanır; etkinleştirilmişse kabuk içe aktarımı yine çalışır.

## Sağlayıcı kimlik bilgileri ve çalışma alanı `.env`

Sağlayıcı API anahtarlarını yalnızca bir çalışma alanı `.env` dosyasında tutmayın. OpenClaw, çalışma alanı `.env` dosyalarından gelen sağlayıcı kimlik bilgisi ortam değişkenlerini yok sayar; buna `GEMINI_API_KEY`, `GOOGLE_API_KEY`, `XAI_API_KEY`, `MISTRAL_API_KEY`, `GROQ_API_KEY`, `DEEPSEEK_API_KEY`, `PERPLEXITY_API_KEY`, `BRAVE_API_KEY`, `TAVILY_API_KEY`, `EXA_API_KEY` ve `FIRECRAWL_API_KEY` gibi yaygın anahtarlar dahildir.

Sağlayıcı kimlik bilgileri için şu güvenilir kaynaklardan birini kullanın:

- Bir kabuk, launchd/systemd birimi, kapsayıcı sırrı veya CI sırrı gibi Gateway işlem ortamı.
- `~/.openclaw/.env` veya `$OPENCLAW_STATE_DIR/.env` konumundaki genel çalışma zamanı dotenv dosyası.
- `~/.openclaw/openclaw.json` içindeki yapılandırma `env` bloğu.
- `env.shellEnv.enabled` veya `OPENCLAW_LOAD_SHELL_ENV=1` etkin olduğunda isteğe bağlı oturum açma kabuğu içe aktarımı.

Daha önce sağlayıcı anahtarlarını yalnızca bir çalışma alanı `.env` içinde sakladıysanız, bunları yukarıdaki güvenilir kaynaklardan birine taşıyın. Çalışma alanı `.env`, kimlik bilgisi, uç nokta yönlendirmesi, ana makine geçersiz kılması veya `OPENCLAW_*` çalışma zamanı denetimi olmayan sıradan proje değişkenlerini sağlamaya devam edebilir.

Güvenlik gerekçesi için [Çalışma alanı `.env` dosyaları](/tr/gateway/security#workspace-env-files) bölümüne bakın.

## Yapılandırma `env` bloğu

Satır içi env değişkenlerini ayarlamanın eşdeğer iki yolu (ikisi de geçersiz kılmaz):

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

Yapılandırma `env` bloğu yalnızca düz string değerleri kabul eder. `file:...` değerlerini genişletmez; örneğin `XAI_API_KEY: "file:secrets/xai-api-key.txt"` sağlayıcılara tam olarak bu string olarak iletilir.

Dosya destekli sağlayıcı anahtarları için, bunu destekleyen kimlik bilgisi alanında bir SecretRef kullanın:

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

Desteklenen alanlar için [Sır Yönetimi](/tr/gateway/secrets) ve [SecretRef kimlik bilgisi yüzeyi](/tr/reference/secretref-credential-surface) bölümlerine bakın.

## Kabuk env içe aktarımı

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

Env değişkeni eşdeğerleri:

- `OPENCLAW_LOAD_SHELL_ENV=1`
- `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`

## Exec kabuk anlık görüntüleri

Windows dışındaki Gateway ana makinelerinde, bash ve zsh `exec` komutları varsayılan olarak bir başlangıç anlık görüntüsü kullanır.
Bu yolu devre dışı bırakmak için Gateway işlem ortamında `OPENCLAW_EXEC_SHELL_SNAPSHOT=0` ayarlayın.
`false`, `no` ve `off` değerleri de bunu devre dışı bırakır. Çağrı başına `exec.env` değerleri anlık görüntüleri açıp kapatamaz veya anlık görüntü önbelleğini yeniden yönlendiremez.

## Çalışma zamanı tarafından enjekte edilen env değişkenleri

OpenClaw, oluşturulan alt işlemlere bağlam işaretleri de enjekte eder:

- `OPENCLAW_SHELL=exec`: `exec` aracı üzerinden çalıştırılan komutlar için ayarlanır.
- `OPENCLAW_SHELL=acp`: ACP çalışma zamanı arka uç işlem oluşturma işlemleri için ayarlanır (örneğin `acpx`).
- `OPENCLAW_SHELL=acp-client`: ACP köprü işlemini oluşturduğunda `openclaw acp client` için ayarlanır.
- `OPENCLAW_SHELL=tui-local`: yerel TUI `!` kabuk komutları için ayarlanır.
- `OPENCLAW_CLI=1`: CLI giriş noktası tarafından oluşturulan alt işlemler için ayarlanır.

Bunlar çalışma zamanı işaretleridir (gerekli kullanıcı yapılandırması değildir). Bağlama özel kurallar uygulamak için kabuk/profil mantığında kullanılabilirler.

## UI env değişkenleri

- `OPENCLAW_THEME=light`: terminaliniz açık arka plana sahipse açık TUI paletini zorlar.
- `OPENCLAW_THEME=dark`: koyu TUI paletini zorlar.
- `COLORFGBG`: terminaliniz bunu dışa aktarıyorsa OpenClaw, TUI paletini otomatik seçmek için arka plan rengi ipucunu kullanır.

## Yapılandırmada env değişkeni yer değiştirmesi

`${VAR_NAME}` söz dizimini kullanarak yapılandırma string değerlerinde env değişkenlerine doğrudan başvurabilirsiniz:

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

Tüm ayrıntılar için [Yapılandırma: Env değişkeni yer değiştirmesi](/tr/gateway/configuration-reference#env-var-substitution) bölümüne bakın.

## Secret ref'ler ve `${ENV}` string'leri

OpenClaw iki env odaklı deseni destekler:

- Yapılandırma değerlerinde `${VAR}` string yer değiştirmesi.
- Sır başvurularını destekleyen alanlar için SecretRef nesneleri (`{ source: "env", provider: "default", id: "VAR" }`).

Her ikisi de etkinleştirme sırasında işlem env değerlerinden çözümlenir. SecretRef ayrıntıları [Sır Yönetimi](/tr/gateway/secrets) içinde belgelenmiştir.
Yapılandırma `env` bloğunun kendisi SecretRef'leri veya `file:...` kısa değerlerini çözümlemez.

## Yol ile ilgili env değişkenleri

| Değişken                 | Amaç                                                                                                                                                                                                                                 |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `OPENCLAW_HOME`          | İç OpenClaw yol varsayılanları için kullanılan ev dizinini geçersiz kılar (`~/.openclaw/`, aracı dizinleri, oturumlar, kimlik bilgileri, yükleyici ilk kurulum süreci ve varsayılan geliştirme checkout'u). OpenClaw'ı ayrılmış bir hizmet kullanıcısı olarak çalıştırırken kullanışlıdır. |
| `OPENCLAW_STATE_DIR`     | Durum dizinini geçersiz kılar (varsayılan `~/.openclaw`).                                                                                                                                                                           |
| `OPENCLAW_CONFIG_PATH`   | Yapılandırma dosyası yolunu geçersiz kılar (varsayılan `~/.openclaw/openclaw.json`).                                                                                                                                                 |
| `OPENCLAW_INCLUDE_ROOTS` | `$include` yönergelerinin yapılandırma dizini dışındaki dosyaları çözümleyebileceği dizinlerin yol listesi (varsayılan: yok — `$include` yapılandırma diziniyle sınırlıdır). Tilde genişletilir.                                    |

## Günlükleme

| Değişken                         | Amaç                                                                                                                                                                                      |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_LOG_LEVEL`             | Hem dosya hem konsol için günlük düzeyini geçersiz kılar (örn. `debug`, `trace`). Yapılandırmadaki `logging.level` ve `logging.consoleLevel` değerlerinden önceliklidir. Geçersiz değerler bir uyarıyla yok sayılır. |
| `OPENCLAW_DEBUG_MODEL_TRANSPORT` | Genel hata ayıklama günlüklerini etkinleştirmeden `info` düzeyinde hedefli model istek/yanıt zamanlama tanılamaları yayar.                                                               |
| `OPENCLAW_DEBUG_MODEL_PAYLOAD`   | Model yükü tanılamaları: `summary`, `tools` veya `full-redacted`. `full-redacted` sınırlandırılır ve redakte edilir ancak istem/mesaj metni içerebilir.                                  |
| `OPENCLAW_DEBUG_SSE`             | Akış tanılamaları: ilk/tamamlandı zamanlaması için `events`, ilk beş redakte edilmiş SSE olayını dahil etmek için `peek`.                                                                |
| `OPENCLAW_DEBUG_CODE_MODE`       | Sağlayıcı araç gizleme ve yalnızca exec/wait zorlaması dahil olmak üzere kod modu model yüzeyi tanılamaları.                                                                              |

### `OPENCLAW_HOME`

Ayarlanırsa `OPENCLAW_HOME`, iç OpenClaw yol varsayılanları için sistem ev dizininin (`$HOME` / `os.homedir()`) yerini alır. Buna varsayılan durum dizini, yapılandırma yolu, aracı dizinleri, kimlik bilgileri, yükleyici ilk kurulum çalışma alanı ve `openclaw update --channel dev` tarafından kullanılan varsayılan geliştirme checkout'u dahildir.

**Öncelik:** `OPENCLAW_HOME` > `$HOME` > `USERPROFILE` > Android üzerinde Termux `PREFIX` ev yedeği > `os.homedir()`

**Örnek** (macOS LaunchDaemon):

```xml
<key>EnvironmentVariables</key>
<dict>
  <key>OPENCLAW_HOME</key>
  <string>/Users/user</string>
</dict>
```

`OPENCLAW_HOME`, bir tilde yolu olarak da ayarlanabilir (örn. `~/svc`); bu yol kullanılmadan önce aynı işletim sistemi ev yedeği zinciri kullanılarak genişletilir.

`OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH` ve `OPENCLAW_GIT_DIR` gibi açık yol değişkenleri yine önceliklidir. Kabuk başlangıç dosyası algılama, paket yöneticisi kurulumu ve ana makine `~` genişletmesi gibi işletim sistemi hesabı görevleri yine gerçek sistem evini kullanabilir.

## nvm kullanıcıları: web_fetch TLS hataları

Node.js sistem paket yöneticisiyle değil **nvm** ile yüklendiyse, yerleşik `fetch()` nvm'nin paketlenmiş CA deposunu kullanır; bu depoda modern kök CA'lar eksik olabilir (Let's Encrypt için ISRG Root X1/X2, DigiCert Global Root G2 vb.). Bu, çoğu HTTPS sitesinde `web_fetch` işleminin `"fetch failed"` ile başarısız olmasına neden olur.

Linux üzerinde OpenClaw, nvm'yi otomatik olarak algılar ve düzeltmeyi gerçek başlangıç ortamında uygular:

- `openclaw gateway install`, systemd hizmet ortamına `NODE_EXTRA_CA_CERTS` yazar
- `openclaw` CLI giriş noktası, Node başlangıcından önce `NODE_EXTRA_CA_CERTS` ayarlanmış şekilde kendisini yeniden exec eder

**Elle düzeltme (eski sürümler veya doğrudan `node ...` başlatmaları için):**

OpenClaw'ı başlatmadan önce değişkeni dışa aktarın:

```bash
export NODE_EXTRA_CA_CERTS=/etc/ssl/certs/ca-certificates.crt
openclaw gateway run
```

Bu değişken için yalnızca `~/.openclaw/.env` dosyasına yazmaya güvenmeyin; Node, `NODE_EXTRA_CA_CERTS` değerini işlem başlangıcında okur.

## Eski ortam değişkenleri

OpenClaw yalnızca `OPENCLAW_*` ortam değişkenlerini okur. Önceki sürümlerden kalan eski `CLAWDBOT_*` ve `MOLTBOT_*` önekleri sessizce yok sayılır.

Başlangıçta Gateway işleminde bunlardan herhangi biri hâlâ ayarlıysa, OpenClaw algılanan önekleri ve toplam sayıyı listeleyen tek bir Node kullanımdan kaldırma uyarısı (`OPENCLAW_LEGACY_ENV_VARS`) yayar. Eski öneki `OPENCLAW_` ile değiştirerek her değeri yeniden adlandırın (örneğin `CLAWDBOT_GATEWAY_TOKEN` → `OPENCLAW_GATEWAY_TOKEN`); eski adların hiçbir etkisi yoktur.

## İlgili

- [Gateway yapılandırması](/tr/gateway/configuration)
- [SSS: env değişkenleri ve .env yükleme](/tr/help/faq#env-vars-and-env-loading)
- [Modellere genel bakış](/tr/concepts/models)
