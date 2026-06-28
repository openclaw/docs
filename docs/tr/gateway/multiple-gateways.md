---
read_when:
    - Aynı makinede birden fazla Gateway çalıştırma
    - Her Gateway için yalıtılmış yapılandırma/durum/bağlantı noktaları gerekir
summary: Tek bir ana makinede birden fazla OpenClaw Gateway çalıştırın (izolasyon, portlar ve profiller)
title: Birden fazla Gateway
x-i18n:
    generated_at: "2026-06-28T00:36:38Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d6f6df481f6ba36749770199ef6eaf94eed33af2bed38d35a31f77b9dbba1913
    source_path: gateway/multiple-gateways.md
    workflow: 16
---

Çoğu kurulum tek bir Gateway kullanmalıdır, çünkü tek bir Gateway birden fazla mesajlaşma bağlantısını ve aracıyı işleyebilir. Daha güçlü yalıtım veya yedeklilik gerekiyorsa (ör. bir kurtarma botu), yalıtılmış profiller/portlarla ayrı Gateway'ler çalıştırın.

## En iyi önerilen kurulum

Çoğu kullanıcı için en basit kurtarma botu kurulumu şudur:

- ana botu varsayılan profilde tutun
- kurtarma botunu `--profile rescue` ile çalıştırın
- kurtarma hesabı için tamamen ayrı bir Telegram botu kullanın
- kurtarma botunu `19789` gibi farklı bir temel portta tutun

Bu, kurtarma botunu ana bottan yalıtılmış tutar; böylece birincil bot kapalıysa hata ayıklayabilir veya yapılandırma değişiklikleri uygulayabilir. Türetilmiş tarayıcı/canvas/CDP portlarının asla çakışmaması için temel portlar arasında en az 20 port bırakın.

## Kurtarma Botu Hızlı Başlangıç

Başka bir şey yapmak için güçlü bir nedeniniz yoksa bunu varsayılan yol olarak kullanın:

```bash
# Rescue bot (separate Telegram bot, separate profile, port 19789)
openclaw --profile rescue onboard
openclaw --profile rescue gateway install --port 19789
```

Ana botunuz zaten çalışıyorsa, genellikle ihtiyacınız olan tek şey budur.

`openclaw --profile rescue onboard` sırasında:

- ayrı Telegram bot belirtecini kullanın
- `rescue` profilini koruyun
- ana bottan en az 20 daha yüksek bir temel port kullanın
- zaten kendiniz yönetmediğiniz sürece varsayılan kurtarma çalışma alanını kabul edin

Onboarding kurtarma hizmetini sizin için zaten kurduysa, son `gateway install` gerekmez.

## Bu neden çalışır

Kurtarma botu bağımsız kalır çünkü kendine ait şunları vardır:

- profil/yapılandırma
- durum dizini
- çalışma alanı
- temel port (artı türetilmiş portlar)
- Telegram bot belirteci

Çoğu kurulum için kurtarma profili adına tamamen ayrı bir Telegram botu kullanın:

- yalnızca operatörlere açık tutması kolaydır
- ayrı bot belirteci ve kimliği
- ana botun kanal/uygulama kurulumundan bağımsızdır
- ana bot bozulduğunda basit DM tabanlı kurtarma yolu sağlar

## `--profile rescue onboard` Neyi Değiştirir

`openclaw --profile rescue onboard` normal onboarding akışını kullanır, ancak her şeyi ayrı bir profile yazar.

Pratikte bu, kurtarma botunun kendine ait şunları alacağı anlamına gelir:

- yapılandırma dosyası
- durum dizini
- çalışma alanı (varsayılan olarak `~/.openclaw/workspace-rescue`)
- yönetilen hizmet adı

İstemler bunun dışında normal onboarding ile aynıdır.

## Genel çoklu Gateway kurulumu

Yukarıdaki kurtarma botu düzeni en kolay varsayılandır, ancak aynı yalıtım deseni tek bir ana makinedeki herhangi bir Gateway çifti veya grubu için çalışır.

Daha genel bir kurulum için her ek Gateway'e kendi adlandırılmış profilini ve kendi temel portunu verin:

```bash
# main (default profile)
openclaw setup
openclaw gateway --port 18789

# extra gateway
openclaw --profile ops setup
openclaw --profile ops gateway --port 19789
```

Her iki Gateway'in de adlandırılmış profiller kullanmasını istiyorsanız, bu da çalışır:

```bash
openclaw --profile main setup
openclaw --profile main gateway --port 18789

openclaw --profile ops setup
openclaw --profile ops gateway --port 19789
```

Hizmetler aynı deseni izler:

```bash
openclaw gateway install
openclaw --profile ops gateway install --port 19789
```

Bir yedek operatör hattı istediğinizde kurtarma botu hızlı başlangıcını kullanın. Farklı kanallar, kiracılar, çalışma alanları veya operasyonel roller için birden fazla uzun ömürlü Gateway istediğinizde genel profil desenini kullanın.

## Yalıtım kontrol listesi

Bunları her Gateway örneği için benzersiz tutun:

- `OPENCLAW_CONFIG_PATH` — örneğe özel yapılandırma dosyası
- `OPENCLAW_STATE_DIR` — örneğe özel oturumlar, kimlik bilgileri, önbellekler
- `agents.defaults.workspace` — örneğe özel çalışma alanı kökü
- `gateway.port` (veya `--port`) — örnek başına benzersiz
- türetilmiş tarayıcı/canvas/CDP portları

Bunlar paylaşılırsa yapılandırma yarışları ve port çakışmaları yaşarsınız.

## Port eşlemesi (türetilmiş)

Temel port = `gateway.port` (veya `OPENCLAW_GATEWAY_PORT` / `--port`).

- tarayıcı denetim hizmeti portu = temel + 2 (yalnızca loopback)
- canvas ana makinesi Gateway HTTP sunucusunda sunulur (`gateway.port` ile aynı port)
- Tarayıcı profili CDP portları `browser.controlPort + 9 .. + 108` aralığından otomatik ayrılır

Bunlardan herhangi birini yapılandırmada veya ortam değişkenlerinde geçersiz kılarsanız, her örnek için benzersiz tutmanız gerekir.

## Tarayıcı/CDP notları (yaygın tuzak)

- `browser.cdpUrl` değerini birden fazla örnekte aynı değerlere **sabitlemeyin**.
- Her örneğin kendi tarayıcı denetim portuna ve CDP aralığına ihtiyacı vardır (gateway portundan türetilir).
- Açık CDP portlarına ihtiyacınız varsa, her örnek için `browser.profiles.<name>.cdpPort` ayarlayın.
- Uzak Chrome: `browser.profiles.<name>.cdpUrl` kullanın (profil başına, örnek başına).

## Manuel env örneği

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/main.json \
OPENCLAW_STATE_DIR=~/.openclaw \
openclaw gateway --port 18789

OPENCLAW_CONFIG_PATH=~/.openclaw/rescue.json \
OPENCLAW_STATE_DIR=~/.openclaw-rescue \
openclaw gateway --port 19789
```

## Hızlı kontroller

```bash
openclaw gateway status --deep
openclaw --profile rescue gateway status --deep
openclaw --profile rescue gateway probe
openclaw status
openclaw --profile rescue status
openclaw --profile rescue browser status
```

Yorumlama:

- `gateway status --deep`, eski kurulumlardan kalan bayat launchd/systemd/schtasks hizmetlerini yakalamaya yardımcı olur.
- `multiple reachable gateway identities detected` gibi `gateway probe` uyarı metinleri yalnızca bilerek birden fazla yalıtılmış gateway çalıştırdığınızda veya OpenClaw erişilebilir yoklama hedeflerinin aynı gateway olduğunu kanıtlayamadığında beklenir. Aynı gateway'e giden bir SSH tüneli, proxy URL'si veya yapılandırılmış uzak URL, taşıma portları farklı olsa bile birden fazla taşımalı tek bir gateway'dir.

## İlgili

- [Gateway çalışma kitabı](/tr/gateway)
- [Gateway kilidi](/tr/gateway/gateway-lock)
- [Yapılandırma](/tr/gateway/configuration)
