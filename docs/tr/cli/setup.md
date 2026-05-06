---
read_when:
    - Tam CLI başlangıç yönlendirmesi olmadan ilk çalıştırma kurulumunu yapıyorsunuz
    - Varsayılan çalışma alanı yolunu ayarlamak istiyorsunuz
summary: '`openclaw setup` için CLI referansı (yapılandırmayı + çalışma alanını başlat)'
title: Kurulum
x-i18n:
    generated_at: "2026-05-06T17:54:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9a47d41f8c6c59395eaa4bc6055fa09f863af819c7920e29969793904180c910
    source_path: cli/setup.md
    workflow: 16
---

# `openclaw setup`

`~/.openclaw/openclaw.json` dosyasını ve aracı çalışma alanını başlatın.

<Note>
`openclaw setup`, değiştirilebilir yapılandırma kurulumları içindir. Nix modunda (`OPENCLAW_NIX_MODE=1`), yapılandırma dosyası Nix tarafından yönetildiği için OpenClaw kurulum yazımlarını reddeder. Aracılar, birinci taraf [nix-openclaw Hızlı Başlangıç](https://github.com/openclaw/nix-openclaw#quick-start) kılavuzunu veya başka bir Nix paketi için eşdeğer kaynak yapılandırmasını kullanmalıdır.
</Note>

İlgili:

- Başlarken: [Başlarken](/tr/start/getting-started)
- CLI katılımı: [Katılım (CLI)](/tr/start/wizard)

## Örnekler

```bash
openclaw setup
openclaw setup --workspace ~/.openclaw/workspace
openclaw setup --wizard
openclaw setup --wizard --import-from hermes --import-source ~/.hermes
openclaw setup --non-interactive --mode remote --remote-url wss://gateway-host:18789 --remote-token <token>
```

## Seçenekler

- `--workspace <dir>`: aracı çalışma alanı dizini (`agents.defaults.workspace` olarak saklanır)
- `--wizard`: katılımı çalıştır
- `--non-interactive`: katılımı istemler olmadan çalıştır
- `--mode <local|remote>`: katılım modu
- `--import-from <provider>`: katılım sırasında çalıştırılacak geçiş sağlayıcısı
- `--import-source <path>`: `--import-from` için kaynak aracı ana dizini
- `--import-secrets`: katılım geçişi sırasında desteklenen gizli bilgileri içe aktar
- `--remote-url <url>`: uzak Gateway WebSocket URL'si
- `--remote-token <token>`: uzak Gateway belirteci

Kurulum üzerinden katılımı çalıştırmak için:

```bash
openclaw setup --wizard
```

Notlar:

- Düz `openclaw setup`, tam katılım akışı olmadan yapılandırmayı ve çalışma alanını başlatır.
- Düz kurulumdan sonra modelleri, kanalları, Gateway'i, Plugin'leri, Skills'i veya sağlık kontrollerini seçmek için `openclaw configure` çalıştırın.
- Herhangi bir katılım bayrağı varsa (`--wizard`, `--non-interactive`, `--mode`, `--import-from`, `--import-source`, `--import-secrets`, `--remote-url`, `--remote-token`) katılım otomatik çalışır.
- Hermes durumu algılanırsa etkileşimli katılım otomatik olarak geçiş önerebilir. İçe aktarma katılımı yeni bir kurulum gerektirir; deneme çalıştırması planları, yedekler ve katılım dışında üzerine yazma modu için [Geçiş](/tr/cli/migrate) kullanın.

## İlgili

- [CLI başvurusu](/tr/cli)
- [Kurulum özeti](/tr/install)
