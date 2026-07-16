---
read_when:
    - Aynı makinede birden fazla Gateway çalıştırma
    - Gateway başına yalıtılmış yapılandırma/durum/bağlantı noktaları gerekir
summary: Tek bir ana makinede birden fazla OpenClaw Gateway çalıştırma (yalıtım, bağlantı noktaları ve profiller)
title: Birden çok Gateway
x-i18n:
    generated_at: "2026-07-16T17:11:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 655fa865a98064d7c017a7c2eb08ea9a9683002d96a3dbe45a8c16cbd3c86ba1
    source_path: gateway/multiple-gateways.md
    workflow: 16
---

Çoğu kurulum için tek bir Gateway yeterlidir; tek bir Gateway, birden fazla mesajlaşma bağlantısını ve ajanı yönetir. Ayrı Gateway'leri yalıtılmış profiller/portlarla yalnızca daha güçlü yalıtım veya yedeklilik gerektiğinde (ör. bir kurtarma botu) çalıştırın.

## Kurtarma botu hızlı başlangıcı

En basit kurtarma botu kurulumu:

- Ana botu varsayılan profilde tutun.
- Kurtarma botunu kendi Telegram bot token'ıyla `--profile rescue` üzerinde çalıştırın.
- Kurtarma botuna farklı bir temel port atayın; ör. `19789`.

Bu sayede birincil bot çalışmıyorsa kurtarma botu hata ayıklayabilir veya yapılandırma değişiklikleri uygulayabilir. Türetilen tarayıcı/CDP portlarının hiçbir zaman çakışmaması için temel portlar arasında en az 20 port bırakın.

```bash
# Kurtarma botu (ayrı Telegram botu, ayrı profil, port 19789)
openclaw --profile rescue onboard
openclaw --profile rescue gateway install --port 19789
```

Ana botunuz zaten çalışıyorsa genellikle gerekenlerin tümü budur. İlk katılım kurtarma hizmetini zaten kurduysa son `gateway install` adımını atlayın.

`openclaw --profile rescue onboard` sırasında:

- Kurtarma hesabına ayrılmış ayrı bir Telegram bot token'ı kullanın (yalnızca operatörlere açık tutması kolaydır, ana botun kanal/uygulama kurulumundan bağımsızdır ve DM tabanlı basit bir kurtarma yolu sağlar).
- `rescue` profil adını koruyun.
- Ana botunkinden en az 20 daha yüksek bir temel port kullanın.
- Zaten kendiniz bir çalışma alanı yönetmiyorsanız varsayılan kurtarma çalışma alanını kabul edin.

### `--profile rescue onboard` neleri değiştirir?

`--profile rescue onboard`, normal ilk katılım akışını çalıştırır ancak her şeyi ayrı bir profile yazar; böylece kurtarma botunun kendine ait şunları olur:

- Profil/yapılandırma dosyası
- Durum dizini
- Çalışma alanı (varsayılan: `~/.openclaw/workspace-rescue`)
- Yönetilen hizmet adı
- Temel port (ve türetilen portlar)
- Telegram bot token'ı

Bunun dışında istemler normal ilk katılımla aynıdır.

## Genel çoklu Gateway kurulumu

Aynı yalıtım kalıbı, tek bir ana makinedeki herhangi bir Gateway çifti veya grubu için çalışır; her ek Gateway'e kendine ait adlandırılmış bir profil ve temel port verin:

```bash
# ana (varsayılan profil)
openclaw setup
openclaw gateway --port 18789

# ek Gateway
openclaw --profile ops setup
openclaw --profile ops gateway --port 19789
```

Her iki tarafta adlandırılmış profiller de kullanılabilir:

```bash
openclaw --profile main setup
openclaw --profile main gateway --port 18789

openclaw --profile ops setup
openclaw --profile ops gateway --port 19789
```

Hizmetler de aynı kalıbı izler:

```bash
openclaw gateway install
openclaw --profile ops gateway install --port 19789
```

Yedek operatör hattı için kurtarma botu hızlı başlangıcını; farklı kanallar, kiracılar, çalışma alanları veya operasyonel roller genelinde uzun süre çalışan birden fazla Gateway için genel profil kalıbını kullanın.

## Yalıtım denetim listesi

Her Gateway örneği için şunları benzersiz tutun:

| Ayar                         | Amaç                                         |
| ---------------------------- | -------------------------------------------- |
| `OPENCLAW_CONFIG_PATH`       | Örneğe özel yapılandırma dosyası             |
| `OPENCLAW_STATE_DIR`         | Örneğe özel oturumlar, kimlik bilgileri, önbellekler |
| `agents.defaults.workspace`  | Örneğe özel çalışma alanı kökü               |
| `gateway.port` (veya `--port`) | Her örnek için benzersiz                     |
| Türetilen tarayıcı/CDP portları | Aşağıya bakın                            |

Bunlardan herhangi birinin paylaşılması yapılandırma, durum veya port çakışmalarına neden olur. Gateway başlangıcı,
`OPENCLAW_ALLOW_MULTI_GATEWAY=1` yapılandırma başına tekil örnek denetimini atlasa bile
durum dizininin benzersiz sahipliğini zorunlu kılar.

## Port eşlemesi (türetilen)

Temel port = `gateway.port` (veya `OPENCLAW_GATEWAY_PORT` / `--port`).

- Tarayıcı denetim hizmeti portu = temel + 2 (yalnızca geri döngü).
- Canvas ana makinesi doğrudan Gateway HTTP sunucusunda sunulur (`gateway.port` ile aynı port).
- Tarayıcı profili CDP portları, `browser control port + 9` ile `+ 108` arasından otomatik olarak ayrılır.

Bunlardan herhangi birini yapılandırmada veya ortam değişkenlerinde geçersiz kılarsanız her örnek için benzersiz tutmanız gerekir.

## Tarayıcı/CDP notları (yaygın tuzak)

- `browser.cdpUrl` değerini birden fazla örnekte aynı değere **sabitlemeyin**.
- Her örneğin kendine ait tarayıcı denetim portuna ve CDP aralığına (Gateway portundan türetilir) ihtiyacı vardır.
- Açık CDP portları için her örnekte `browser.profiles.<name>.cdpPort` değerini ayarlayın.
- Uzak Chrome için `browser.profiles.<name>.cdpUrl` kullanın (profil ve örnek başına).

## Manuel ortam değişkeni örneği

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/main.json \
OPENCLAW_STATE_DIR=~/.openclaw \
openclaw gateway --port 18789

OPENCLAW_CONFIG_PATH=~/.openclaw/rescue.json \
OPENCLAW_STATE_DIR=~/.openclaw-rescue \
openclaw gateway --port 19789
```

## Hızlı denetimler

```bash
openclaw gateway status --deep
openclaw --profile rescue gateway status --deep
openclaw --profile rescue gateway probe
openclaw status
openclaw --profile rescue status
openclaw --profile rescue browser status
```

- `gateway status --deep`, eski kurulumlardan kalan güncelliğini yitirmiş launchd/systemd/schtasks hizmetlerini yakalar.
- `gateway probe` içindeki `multiple reachable gateway identities detected` gibi uyarı metinleri, yalnızca bilerek birden fazla yalıtılmış Gateway çalıştırdığınızda veya OpenClaw erişilebilir yoklama hedeflerinin aynı Gateway olduğunu kanıtlayamadığında beklenir. Aynı Gateway'e giden bir SSH tüneli, proxy URL'si veya yapılandırılmış uzak URL, aktarım portları farklı olsa bile birden fazla aktarıma sahip tek bir Gateway'dir.

## İlgili

- [Gateway çalışma kılavuzu](/tr/gateway)
- [Gateway kilidi](/tr/gateway/gateway-lock)
- [Yapılandırma](/tr/gateway/configuration)
