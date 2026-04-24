---
read_when:
    - Aynı makinede birden fazla Gateway çalıştırma
    - Gateway başına yalıtılmış config/durum/portlara ihtiyacınız var
summary: Tek bir sunucuda birden çok OpenClaw Gateway çalıştırın (yalıtım, portlar ve profiller)
title: Birden çok Gateway
x-i18n:
    generated_at: "2026-04-24T09:10:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1700a0d29ceee3e2a242a8455a3c948895fb25750a2b1bce5c4bd0690a051881
    source_path: gateway/multiple-gateways.md
    workflow: 15
---

# Birden Çok Gateway (aynı sunucu)

Çoğu kurulum tek bir Gateway kullanmalıdır çünkü tek bir Gateway birden çok mesajlaşma bağlantısını ve aracıyı yönetebilir. Daha güçlü yalıtım veya yedeklilik gerekiyorsa (ör. bir kurtarma botu), yalıtılmış profiller/portlarla ayrı Gateway'ler çalıştırın.

## En Çok Önerilen Kurulum

Çoğu kullanıcı için en basit kurtarma botu kurulumu şudur:

- ana botu varsayılan profilde tutun
- kurtarma botunu `--profile rescue` üzerinde çalıştırın
- kurtarma hesabı için tamamen ayrı bir Telegram botu kullanın
- kurtarma botunu `19789` gibi farklı bir temel port üzerinde tutun

Bu, kurtarma botunu ana bottan yalıtılmış tutar; böylece birincil bot kapalıysa
hata ayıklayabilir veya config değişiklikleri uygulayabilir. Türetilmiş browser/canvas/CDP portlarının asla çakışmaması için
temel portlar arasında en az 20 port bırakın.

## Kurtarma Botu Hızlı Başlangıç

Bunu, farklı bir şey yapmak için güçlü bir nedeniniz yoksa varsayılan yol olarak kullanın:

```bash
# Kurtarma botu (ayrı Telegram botu, ayrı profil, port 19789)
openclaw --profile rescue onboard
openclaw --profile rescue gateway install --port 19789
```

Ana botunuz zaten çalışıyorsa genellikle ihtiyacınız olan tek şey budur.

`openclaw --profile rescue onboard` sırasında:

- ayrı Telegram bot token'ını kullanın
- `rescue` profilini koruyun
- ana bottan en az 20 daha yüksek bir temel port kullanın
- zaten kendiniz yönetmiyorsanız varsayılan kurtarma çalışma alanını kabul edin

Onboarding zaten sizin için kurtarma hizmetini kurduysa, son
`gateway install` gerekmez.

## Bu Neden Çalışır

Kurtarma botu bağımsız kalır çünkü kendine ait şunlara sahiptir:

- profil/config
- durum dizini
- çalışma alanı
- temel port (artı türetilmiş portlar)
- Telegram bot token'ı

Çoğu kurulum için kurtarma profili adına tamamen ayrı bir Telegram botu kullanın:

- yalnızca operatör olacak şekilde tutması kolaydır
- ayrı bot token'ı ve kimliği
- ana botun kanal/uygulama kurulumundan bağımsız
- ana bot bozulduğunda basit DM tabanlı kurtarma yolu

## `--profile rescue onboard` Neleri Değiştirir

`openclaw --profile rescue onboard`, normal onboarding akışını kullanır, ancak
her şeyi ayrı bir profile yazar.

Pratikte bu, kurtarma botunun kendine ait şu öğeleri aldığı anlamına gelir:

- config dosyası
- durum dizini
- çalışma alanı (varsayılan olarak `~/.openclaw/workspace-rescue`)
- yönetilen hizmet adı

Bunun dışındaki istemler normal onboarding ile aynıdır.

## Genel Çoklu Gateway Kurulumu

Yukarıdaki kurtarma botu düzeni en kolay varsayılandır, ancak aynı yalıtım
deseni tek bir sunucudaki herhangi bir Gateway çifti veya grubu için çalışır.

Daha genel bir kurulum için, her ek Gateway'e kendi adlandırılmış profilini ve
kendi temel portunu verin:

```bash
# main (varsayılan profil)
openclaw setup
openclaw gateway --port 18789

# ek gateway
openclaw --profile ops setup
openclaw --profile ops gateway --port 19789
```

Her iki Gateway'in de adlandırılmış profilleri kullanmasını istiyorsanız, bu da çalışır:

```bash
openclaw --profile main setup
openclaw --profile main gateway --port 18789

openclaw --profile ops setup
openclaw --profile ops gateway --port 19789
```

Hizmetler de aynı deseni izler:

```bash
openclaw gateway install
openclaw --profile ops gateway install --port 19789
```

Bir yedek operatör hattı istediğinizde kurtarma botu hızlı başlangıcını kullanın. Farklı kanallar, kiracılar, çalışma alanları veya operasyonel roller için
birden çok uzun ömürlü Gateway istediğinizde
genel profil desenini kullanın.

## Yalıtım Kontrol Listesi

Bunları Gateway örneği başına benzersiz tutun:

- `OPENCLAW_CONFIG_PATH` — örnek başına config dosyası
- `OPENCLAW_STATE_DIR` — örnek başına oturumlar, kimlik bilgileri, önbellekler
- `agents.defaults.workspace` — örnek başına çalışma alanı kökü
- `gateway.port` (veya `--port`) — örnek başına benzersiz
- türetilmiş browser/canvas/CDP portları

Bunlar paylaşılırsa config yarışları ve port çakışmalarıyla karşılaşırsınız.

## Port eşlemesi (türetilmiş)

Temel port = `gateway.port` (veya `OPENCLAW_GATEWAY_PORT` / `--port`).

- browser denetim hizmeti portu = temel + 2 (yalnızca loopback)
- canvas host, Gateway HTTP sunucusunda sunulur (`gateway.port` ile aynı port)
- Browser profil CDP portları `browser.controlPort + 9 .. + 108` aralığından otomatik ayrılır

Bunlardan herhangi birini config veya env içinde geçersiz kılıyorsanız, örnek başına benzersiz tutmanız gerekir.

## Browser/CDP notları (yaygın tuzak)

- Birden çok örnekte `browser.cdpUrl` değerini aynı değerlere sabitlemeyin.
- Her örneğin kendi browser denetim portuna ve CDP aralığına ihtiyacı vardır (gateway portundan türetilir).
- Açık CDP portlarına ihtiyacınız varsa, örnek başına `browser.profiles.<name>.cdpPort` ayarlayın.
- Uzak Chrome için `browser.profiles.<name>.cdpUrl` kullanın (profil başına, örnek başına).

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

- `gateway status --deep`, eski kurulumlardan kalmış bayat launchd/systemd/schtasks hizmetlerini yakalamaya yardımcı olur.
- `gateway probe` uyarı metni; örneğin `multiple reachable gateways detected`, yalnızca kasıtlı olarak birden fazla yalıtılmış gateway çalıştırdığınızda beklenir.

## İlgili

- [Gateway runbook](/tr/gateway)
- [Gateway lock](/tr/gateway/gateway-lock)
- [Configuration](/tr/gateway/configuration)
