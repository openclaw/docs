---
read_when:
    - CLI ilk çalıştırma kurulumunu onboarding sihirbazıyla yapıyorsunuz
    - Varsayılan çalışma alanı yolunu ayarlamak istiyorsunuz
    - Betikler için yalnızca temel yapılandırma bayrağına ihtiyacınız var
summary: '`openclaw setup` için CLI referansı (ilk kurulum için takma ad, temel kurulum bayrakla kullanılabilir)'
title: Kurulum
x-i18n:
    generated_at: "2026-06-30T22:31:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 797c023d5ba27920fbea9828c9bb12f6c10d25dd3aa6fc68fe9c742f432ebb05
    source_path: cli/setup.md
    workflow: 16
---

# `openclaw setup`

Tam CLI ilk kurulum akışını çalıştırın. `openclaw setup`, `openclaw onboard` için bir takma addır; sihirbaz olmadan yalnızca yapılandırma/çalışma alanı klasörlerini başlatmanız gerektiğinde `--baseline` kullanın.

<Note>
`openclaw setup`, değiştirilebilir yapılandırma kurulumları içindir. Nix modunda (`OPENCLAW_NIX_MODE=1`) OpenClaw, yapılandırma dosyası Nix tarafından yönetildiği için kurulum yazma işlemlerini reddeder. Birinci taraf [nix-openclaw Hızlı Başlangıç](https://github.com/openclaw/nix-openclaw#quick-start) kılavuzunu veya başka bir Nix paketi için eşdeğer kaynak yapılandırmasını kullanın.
</Note>

## Seçenekler

| Bayrak                     | Açıklama                                                                                              |
| -------------------------- | ----------------------------------------------------------------------------------------------------- |
| `--workspace <dir>`        | Aracı çalışma alanı dizini (varsayılan `~/.openclaw/workspace`; `agents.defaults.workspace` olarak saklanır). |
| `--baseline`               | İlk kurulum olmadan temel yapılandırma/çalışma alanı/oturum klasörleri oluşturur.                    |
| `--wizard`                 | Uyumluluk için kabul edilir; kurulum varsayılan olarak ilk kurulumu çalıştırır.                       |
| `--non-interactive`        | İlk kurulumu istemler olmadan çalıştırır.                                                            |
| `--accept-risk`            | Tam sistem aracı erişim riskini kabul eder; `--non-interactive` ile gereklidir.                      |
| `--mode <mode>`            | İlk kurulum modu: `local` veya `remote`.                                                             |
| `--import-from <provider>` | İlk kurulum sırasında çalıştırılacak geçiş sağlayıcısı.                                              |
| `--import-source <path>`   | `--import-from` için kaynak aracı ana dizini.                                                        |
| `--import-secrets`         | İlk kurulum geçişi sırasında desteklenen gizli bilgileri içe aktarır.                                |
| `--remote-url <url>`       | Uzak Gateway WebSocket URL'si.                                                                       |
| `--remote-token <token>`   | Uzak Gateway belirteci (isteğe bağlı).                                                               |

### Temel mod

`openclaw setup --baseline`, eski yalnızca temel davranışı korur: yapılandırma, çalışma alanı ve oturum dizinlerini oluşturur, ardından ilk kurulumu çalıştırmadan çıkar.

## Örnekler

```bash
openclaw setup
openclaw setup --baseline
openclaw setup --workspace ~/.openclaw/workspace
openclaw setup --import-from hermes --import-source ~/.hermes
openclaw setup --non-interactive --accept-risk --mode remote --remote-url wss://gateway-host:18789 --remote-token <token>
```

## Notlar

- Düz `openclaw setup`, `openclaw onboard` ile aynı yönlendirmeli akışı çalıştırır.
- Temel kurulumdan sonra tam yönlendirmeli akış için `openclaw setup` veya `openclaw onboard`, hedefli değişiklikler için `openclaw configure` ya da kanal hesapları eklemek için `openclaw channels add` çalıştırın.
- Hermes durumu algılanırsa, etkileşimli ilk kurulum otomatik olarak geçiş sunabilir. İçe aktarma ilk kurulumu yeni bir kurulum gerektirir; ilk kurulum dışında prova çalıştırma planları, yedekler ve üzerine yazma modu için [Geçiş](/tr/cli/migrate) kullanın.

## İlgili

- [CLI başvurusu](/tr/cli)
- [İlk kurulum (CLI)](/tr/start/wizard)
- [Başlarken](/tr/start/getting-started)
- [Kurulum genel bakışı](/tr/install)
