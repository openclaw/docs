---
read_when:
    - Tam CLI ilk kullanıma hazırlama süreci olmadan ilk çalıştırma kurulumunu yapıyorsunuz
    - Varsayılan çalışma alanı yolunu ayarlamak istiyorsunuz
    - Her bayrağı ve kurulumun temel ile sihirbaz modu arasında nasıl karar verdiğini bilmeniz gerekir
summary: '`openclaw setup` için CLI referansı (yapılandırmayı ve çalışma alanını başlatır, isteğe bağlı olarak ilk kurulumu çalıştırır)'
title: Kurulum
x-i18n:
    generated_at: "2026-06-28T00:25:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 42bc570cf4c43338d6ca6202aace7c9d669fb1ac6d8bd8b61a591086fff2896a
    source_path: cli/setup.md
    workflow: 16
---

# `openclaw setup`

Temel yapılandırmayı ve ajan çalışma alanını başlatın. Herhangi bir onboarding bayrağı mevcutsa sihirbazı da çalıştırır.

<Note>
`openclaw setup`, değiştirilebilir yapılandırma kurulumları içindir. Nix modunda (`OPENCLAW_NIX_MODE=1`) OpenClaw, yapılandırma dosyası Nix tarafından yönetildiği için kurulum yazmalarını reddeder. Birinci taraf [nix-openclaw Hızlı Başlangıç](https://github.com/openclaw/nix-openclaw#quick-start) kılavuzunu veya başka bir Nix paketi için eşdeğer kaynak yapılandırmasını kullanın.
</Note>

## Seçenekler

| Bayrak                     | Açıklama                                                                                         |
| -------------------------- | ------------------------------------------------------------------------------------------------ |
| `--workspace <dir>`        | Ajan çalışma alanı dizini (varsayılan `~/.openclaw/workspace`; `agents.defaults.workspace` olarak saklanır). |
| `--wizard`                 | Etkileşimli onboarding çalıştırır.                                                              |
| `--non-interactive`        | Onboarding işlemini istemler olmadan çalıştırır.                                                 |
| `--accept-risk`            | Tam sistem ajan erişimi riskini kabul eder; `--non-interactive` ile gereklidir.                  |
| `--mode <mode>`            | Onboarding modu: `local` veya `remote`.                                                          |
| `--import-from <provider>` | Onboarding sırasında çalıştırılacak geçiş sağlayıcısı.                                          |
| `--import-source <path>`   | `--import-from` için kaynak ajan ana dizini.                                                     |
| `--import-secrets`         | Onboarding geçişi sırasında desteklenen gizli bilgileri içe aktarır.                             |
| `--remote-url <url>`       | Uzak Gateway WebSocket URL'si.                                                                    |
| `--remote-token <token>`   | Uzak Gateway token'ı (isteğe bağlı).                                                             |

### Sihirbazın otomatik tetiklenmesi

`openclaw setup`, `--wizard` olmadan bile bu bayraklardan herhangi biri açıkça mevcut olduğunda sihirbazı çalıştırır:

`--wizard`, `--non-interactive`, `--accept-risk`, `--mode`, `--import-from`, `--import-source`, `--import-secrets`, `--remote-url`, `--remote-token`.

## Örnekler

```bash
openclaw setup
openclaw setup --workspace ~/.openclaw/workspace
openclaw setup --wizard
openclaw setup --wizard --import-from hermes --import-source ~/.hermes
openclaw setup --non-interactive --accept-risk --mode remote --remote-url wss://gateway-host:18789 --remote-token <token>
```

## Notlar

- Düz `openclaw setup`, tam onboarding akışını çalıştırmadan yapılandırmayı ve çalışma alanını başlatır.
- Düz kurulumdan sonra, tam rehberli süreç için `openclaw onboard`, hedefli değişiklikler için `openclaw configure` veya kanal hesapları eklemek için `openclaw channels add` çalıştırın.
- Hermes durumu algılanırsa etkileşimli onboarding otomatik olarak geçiş önerebilir. İçe aktarmalı onboarding yeni bir kurulum gerektirir; onboarding dışında deneme çalıştırması planları, yedeklemeler ve üzerine yazma modu için [Geçiş](/tr/cli/migrate) bölümünü kullanın.

## İlgili

- [CLI başvurusu](/tr/cli)
- [Onboarding (CLI)](/tr/start/wizard)
- [Başlarken](/tr/start/getting-started)
- [Kuruluma genel bakış](/tr/install)
