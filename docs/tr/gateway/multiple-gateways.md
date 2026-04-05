---
read_when:
    - Aynı makinede birden fazla Gateway çalıştırıyorsunuz
    - Her Gateway için yalıtılmış config/durum/portlara ihtiyacınız var
summary: OpenClaw'da tek ana makinede birden fazla Gateway çalıştırma (yalıtım, portlar ve profiller)
title: Birden Fazla Gateway
x-i18n:
    generated_at: "2026-04-05T13:53:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: 061f204bf56b28c6bd0e2c9aee6c561a8a162ca219060117fea4d3a007f01899
    source_path: gateway/multiple-gateways.md
    workflow: 15
---

# Birden Fazla Gateway (aynı ana makine)

Çoğu kurulum tek bir Gateway kullanmalıdır çünkü tek bir Gateway birden fazla mesajlaşma bağlantısını ve ajanı yönetebilir. Daha güçlü yalıtım veya yedeklilik gerekiyorsa (örneğin bir kurtarma botu), yalıtılmış profiller/portlarla ayrı Gateway'ler çalıştırın.

## Yalıtım kontrol listesi (zorunlu)

- `OPENCLAW_CONFIG_PATH` — örnek başına config dosyası
- `OPENCLAW_STATE_DIR` — örnek başına oturumlar, kimlik bilgileri, önbellekler
- `agents.defaults.workspace` — örnek başına çalışma alanı kökü
- `gateway.port` (veya `--port`) — örnek başına benzersiz
- Türetilmiş portlar (browser/canvas) çakışmamalıdır

Bunlar paylaşılırsa config yarışları ve port çakışmaları yaşarsınız.

## Önerilen: profiller (`--profile`)

Profiller `OPENCLAW_STATE_DIR` + `OPENCLAW_CONFIG_PATH` kapsamını otomatik ayarlar ve hizmet adlarına sonek ekler.

```bash
# ana
openclaw --profile main setup
openclaw --profile main gateway --port 18789

# kurtarma
openclaw --profile rescue setup
openclaw --profile rescue gateway --port 19001
```

Profil başına hizmetler:

```bash
openclaw --profile main gateway install
openclaw --profile rescue gateway install
```

## Kurtarma botu kılavuzu

Aynı ana makinede ikinci bir Gateway'i şu bileşenlerin kendisine ait sürümleriyle çalıştırın:

- profil/config
- durum dizini
- çalışma alanı
- temel port (artı türetilmiş portlar)

Bu, birincil bot kapalıysa kurtarma botunun hata ayıklama yapabilmesini veya config değişiklikleri uygulayabilmesini sağlayacak şekilde onu ana bottan yalıtılmış tutar.

Port aralığı: türetilmiş browser/canvas/CDP portlarının asla çakışmaması için temel portlar arasında en az 20 port bırakın.

### Nasıl kurulur (kurtarma botu)

```bash
# Ana bot (mevcut veya yeni, --profile parametresi olmadan)
# 18789 portunda + Chrome CDC/Canvas/... portlarında çalışır
openclaw onboard
openclaw gateway install

# Kurtarma botu (yalıtılmış profil + portlar)
openclaw --profile rescue onboard
# Notlar:
# - çalışma alanı adı varsayılan olarak -rescue son eki alır
# - Port en az 18789 + 20 port olmalıdır,
#   daha iyisi 19789 gibi tamamen farklı bir temel port seçmektir,
# - ilk kurulumun geri kalanı normal ile aynıdır

# Hizmeti kurmak için (kurulum sırasında otomatik olmadıysa)
openclaw --profile rescue gateway install
```

## Port eşlemesi (türetilmiş)

Temel port = `gateway.port` (veya `OPENCLAW_GATEWAY_PORT` / `--port`).

- browser kontrol hizmeti portu = temel + 2 (yalnızca loopback)
- canvas host, Gateway HTTP sunucusunda sunulur (`gateway.port` ile aynı port)
- Browser profil CDP portları `browser.controlPort + 9 .. + 108` aralığından otomatik tahsis edilir

Bunlardan herhangi birini config veya env içinde geçersiz kılarsanız, örnek başına benzersiz tutmanız gerekir.

## Browser/CDP notları (yaygın tuzak)

- Birden fazla örnekte `browser.cdpUrl` değerini aynı değerlere **sabitlemeyin**.
- Her örneğin kendi browser kontrol portuna ve CDP aralığına ihtiyacı vardır (gateway portundan türetilir).
- Açık CDP portlarına ihtiyacınız varsa, örnek başına `browser.profiles.<name>.cdpPort` ayarlayın.
- Uzak Chrome için `browser.profiles.<name>.cdpUrl` kullanın (profil başına, örnek başına).

## Manuel env örneği

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/main.json \
OPENCLAW_STATE_DIR=~/.openclaw-main \
openclaw gateway --port 18789

OPENCLAW_CONFIG_PATH=~/.openclaw/rescue.json \
OPENCLAW_STATE_DIR=~/.openclaw-rescue \
openclaw gateway --port 19001
```

## Hızlı denetimler

```bash
openclaw --profile main gateway status --deep
openclaw --profile rescue gateway status --deep
openclaw --profile rescue gateway probe
openclaw --profile main status
openclaw --profile rescue status
openclaw --profile rescue browser status
```

Yorumlama:

- `gateway status --deep`, eski kurulumlardan kalmış launchd/systemd/schtasks hizmetlerini yakalamaya yardımcı olur.
- `multiple reachable gateways detected` gibi `gateway probe` uyarı metinleri yalnızca kasıtlı olarak birden fazla yalıtılmış gateway çalıştırdığınızda beklenir.
