---
read_when:
    - Tam CLI ilk kurulum süreci olmadan ilk çalıştırma kurulumu yapıyorsunuz
    - Varsayılan çalışma alanı yolunu ayarlamak istiyorsunuz
summary: '`openclaw setup` için CLI referansı (yapılandırmayı + çalışma alanını başlat)'
title: Kurulum
x-i18n:
    generated_at: "2026-05-02T20:43:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 805f60c81f5fc216fc446641efe0bcb60bb6c34b3a50a6fc9e767461206e5f90
    source_path: cli/setup.md
    workflow: 16
---

# `openclaw setup`

`~/.openclaw/openclaw.json` dosyasını ve ajan çalışma alanını başlatın.

İlgili:

- Başlarken: [Başlarken](/tr/start/getting-started)
- CLI ilk kullanıma hazırlama: [İlk kullanıma hazırlama (CLI)](/tr/start/wizard)

## Örnekler

```bash
openclaw setup
openclaw setup --workspace ~/.openclaw/workspace
openclaw setup --wizard
openclaw setup --wizard --import-from hermes --import-source ~/.hermes
openclaw setup --non-interactive --mode remote --remote-url wss://gateway-host:18789 --remote-token <token>
```

## Seçenekler

- `--workspace <dir>`: ajan çalışma alanı dizini (`agents.defaults.workspace` olarak saklanır)
- `--wizard`: ilk kullanıma hazırlamayı çalıştır
- `--non-interactive`: ilk kullanıma hazırlamayı istemler olmadan çalıştır
- `--mode <local|remote>`: ilk kullanıma hazırlama modu
- `--import-from <provider>`: ilk kullanıma hazırlama sırasında çalıştırılacak geçiş sağlayıcısı
- `--import-source <path>`: `--import-from` için kaynak ajan ana dizini
- `--import-secrets`: ilk kullanıma hazırlama geçişi sırasında desteklenen sırları içe aktar
- `--remote-url <url>`: uzak Gateway WebSocket URL'si
- `--remote-token <token>`: uzak Gateway token'ı

İlk kullanıma hazırlamayı setup üzerinden çalıştırmak için:

```bash
openclaw setup --wizard
```

Notlar:

- Düz `openclaw setup`, tam ilk kullanıma hazırlama akışı olmadan yapılandırmayı ve çalışma alanını başlatır.
- Düz setup sonrasında modelleri, kanalları, Gateway'i, Plugin'leri, Skills'i veya sağlık kontrollerini seçmek için `openclaw configure` komutunu çalıştırın.
- Herhangi bir ilk kullanıma hazırlama bayrağı mevcut olduğunda ilk kullanıma hazırlama otomatik çalışır (`--wizard`, `--non-interactive`, `--mode`, `--import-from`, `--import-source`, `--import-secrets`, `--remote-url`, `--remote-token`).
- Hermes durumu algılanırsa etkileşimli ilk kullanıma hazırlama geçişi otomatik olarak önerebilir. İçe aktarma ile ilk kullanıma hazırlama taze bir setup gerektirir; ilk kullanıma hazırlama dışında deneme çalıştırması planları, yedeklemeler ve üzerine yazma modu için [Geçiş](/tr/cli/migrate) sayfasını kullanın.

## İlgili

- [CLI referansı](/tr/cli)
- [Kurulum genel bakışı](/tr/install)
