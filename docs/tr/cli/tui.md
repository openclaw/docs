---
read_when:
    - Gateway için bir terminal UI istiyorsunuz (uzak kullanıma uygun)
    - Betiklerden url/token/session geçirmek istiyorsunuz
summary: '`openclaw tui` için CLI başvurusu (Gateway''e bağlı terminal UI)'
title: tui
x-i18n:
    generated_at: "2026-04-05T13:49:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: 60e35062c0551f85ce0da604a915b3e1ca2514d00d840afe3b94c529304c2c1a
    source_path: cli/tui.md
    workflow: 15
---

# `openclaw tui`

Gateway'e bağlı terminal UI'yi açın.

İlgili:

- TUI kılavuzu: [TUI](/web/tui)

Notlar:

- `tui`, mümkün olduğunda belirteç/parola kimlik doğrulaması için yapılandırılmış Gateway auth SecretRef'lerini çözümler (`env`/`file`/`exec` sağlayıcıları).
- Yapılandırılmış bir ajan çalışma alanı dizini içinden başlatıldığında, TUI oturum anahtarı varsayılanı için o ajanı otomatik seçer (`--session` açıkça `agent:<id>:...` değilse).

## Örnekler

```bash
openclaw tui
openclaw tui --url ws://127.0.0.1:18789 --token <token>
openclaw tui --session main --deliver
# bir ajan çalışma alanı içinde çalıştırıldığında, o ajanı otomatik olarak çıkarır
openclaw tui --session bugfix
```
