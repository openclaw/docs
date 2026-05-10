---
read_when:
    - İlk çalıştırma kurulumunu tam CLI başlangıç yönlendirmesi olmadan yapıyorsunuz
    - Varsayılan çalışma alanı yolunu ayarlamak istiyorsunuz
    - Her bayrağa ve kurulumun temel mod ile sihirbaz modu arasında nasıl karar verdiğine ihtiyacınız var
summary: '`openclaw setup` için CLI başvurusu (yapılandırmayı ve çalışma alanını başlatır, isteğe bağlı olarak ilk kurulum akışını çalıştırır)'
title: Kurulum
x-i18n:
    generated_at: "2026-05-10T19:30:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 55f0d771bb07c4c69293a470d54f4b6bb108ee521889bfb944fe450b24938b5e
    source_path: cli/setup.md
    workflow: 16
---

# `openclaw setup`

Temel yapılandırmayı ve ajan çalışma alanını başlatın. Herhangi bir başlangıç bayrağı mevcutsa sihirbazı da çalıştırır.

<Note>
`openclaw setup`, değiştirilebilir yapılandırma kurulumları içindir. Nix modunda (`OPENCLAW_NIX_MODE=1`) yapılandırma dosyası Nix tarafından yönetildiği için OpenClaw kurulum yazmalarını reddeder. Birinci taraf [nix-openclaw Hızlı Başlangıç](https://github.com/openclaw/nix-openclaw#quick-start) kılavuzunu veya başka bir Nix paketi için eşdeğer kaynak yapılandırmasını kullanın.
</Note>

## Seçenekler

| Bayrak                     | Açıklama                                                                                           |
| -------------------------- | -------------------------------------------------------------------------------------------------- |
| `--workspace <dir>`        | Ajan çalışma alanı dizini (varsayılan `~/.openclaw/workspace`; `agents.defaults.workspace` olarak saklanır). |
| `--wizard`                 | Etkileşimli başlangıcı çalıştır.                                                                   |
| `--non-interactive`        | Başlangıcı istemler olmadan çalıştır.                                                              |
| `--mode <mode>`            | Başlangıç modu: `local` veya `remote`.                                                             |
| `--import-from <provider>` | Başlangıç sırasında çalıştırılacak geçiş sağlayıcısı.                                              |
| `--import-source <path>`   | `--import-from` için kaynak ajan ana dizini.                                                       |
| `--import-secrets`         | Başlangıç geçişi sırasında desteklenen gizli bilgileri içe aktar.                                  |
| `--remote-url <url>`       | Uzak Gateway WebSocket URL'si.                                                                     |
| `--remote-token <token>`   | Uzak Gateway token'ı (isteğe bağlı).                                                               |

### Sihirbaz otomatik tetikleyicisi

`openclaw setup`, `--wizard` olmadan bile bu bayraklardan herhangi biri açıkça mevcut olduğunda sihirbazı çalıştırır:

`--wizard`, `--non-interactive`, `--mode`, `--import-from`, `--import-source`, `--import-secrets`, `--remote-url`, `--remote-token`.

## Örnekler

```bash
openclaw setup
openclaw setup --workspace ~/.openclaw/workspace
openclaw setup --wizard
openclaw setup --wizard --import-from hermes --import-source ~/.hermes
openclaw setup --non-interactive --mode remote --remote-url wss://gateway-host:18789 --remote-token <token>
```

## Notlar

- Düz `openclaw setup`, tam başlangıç akışını çalıştırmadan yapılandırmayı ve çalışma alanını başlatır.
- Düz kurulumdan sonra, tam kılavuzlu yolculuk için `openclaw onboard`, hedefli değişiklikler için `openclaw configure` veya kanal hesapları eklemek için `openclaw channels add` çalıştırın.
- Hermes durumu algılanırsa etkileşimli başlangıç otomatik olarak geçiş önerebilir. İçe aktarmalı başlangıç yeni bir kurulum gerektirir; başlangıç dışında kuru çalıştırma planları, yedekler ve üzerine yazma modu için [Geçiş](/tr/cli/migrate) kullanın.

## İlgili

- [CLI başvurusu](/tr/cli)
- [Başlangıç (CLI)](/tr/start/wizard)
- [Başlarken](/tr/start/getting-started)
- [Kuruluma genel bakış](/tr/install)
