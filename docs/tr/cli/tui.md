---
read_when:
    - Gateway için bir terminal arayüzü istiyorsunuz (uzaktan kullanıma uygun)
    - Betiklerden url/token/session geçirmek istiyorsunuz
    - TUI'yi Gateway olmadan yerel gömülü modda çalıştırmak istiyorsunuz
    - '`openclaw chat` veya `openclaw tui --local` kullanmak istiyorsunuz'
summary: Gateway destekli veya yerel gömülü terminal arayüzü için `openclaw tui` CLI başvurusu
title: TUI
x-i18n:
    generated_at: "2026-04-24T09:04:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: c3b3d337c55411fbcbae3bda85d9ca8d0f1b2a4224b5d4c9bbc5f96c41c5363c
    source_path: cli/tui.md
    workflow: 15
---

# `openclaw tui`

Gateway'e bağlı terminal arayüzünü açın veya bunu yerel gömülü
modda çalıştırın.

İlgili:

- TUI kılavuzu: [TUI](/tr/web/tui)

Notlar:

- `chat` ve `terminal`, `openclaw tui --local` için takma adlardır.
- `--local`, `--url`, `--token` veya `--password` ile birlikte kullanılamaz.
- `tui`, mümkün olduğunda token/password kimlik doğrulaması için yapılandırılmış Gateway SecretRef'lerini çözer (`env`/`file`/`exec` sağlayıcıları).
- Yapılandırılmış bir agent çalışma alanı dizini içinden başlatıldığında TUI, oturum anahtarı varsayılanı için o agent'i otomatik seçer (`--session` açıkça `agent:<id>:...` değilse).
- Yerel mod, gömülü agent çalışma zamanını doğrudan kullanır. Yerel araçların çoğu çalışır, ancak yalnızca Gateway özellikleri kullanılamaz.
- Yerel mod, TUI komut yüzeyine `/auth [provider]` ekler.
- Plugin onay kapıları yerel modda da geçerlidir. Onay gerektiren araçlar terminalde karar ister; Gateway devrede olmadığı için hiçbir şey sessizce otomatik onaylanmaz.

## Örnekler

```bash
openclaw chat
openclaw tui --local
openclaw tui
openclaw tui --url ws://127.0.0.1:18789 --token <token>
openclaw tui --session main --deliver
openclaw chat --message "Yapılandırmamı belgelere göre karşılaştır ve neyi düzeltmem gerektiğini söyle"
# bir agent çalışma alanı içinden çalıştırıldığında, o agent'i otomatik çıkarır
openclaw tui --session bugfix
```

## Yapılandırma onarım döngüsü

Geçerli yapılandırma zaten doğrulanıyorsa ve gömülü
agent'in bunu incelemesini, belgelerle karşılaştırmasını ve aynı terminalden onarmaya yardım etmesini istiyorsanız yerel modu kullanın:

`openclaw config validate` zaten başarısız oluyorsa önce `openclaw configure` veya
`openclaw doctor --fix` kullanın. `openclaw chat`, geçersiz
yapılandırma korumasını atlamaz.

```bash
openclaw chat
```

Sonra TUI içinde:

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

Hedefli düzeltmeleri `openclaw config set` veya `openclaw configure` ile uygulayın, sonra
`openclaw config validate` komutunu yeniden çalıştırın. Bkz. [TUI](/tr/web/tui) ve [Config](/tr/cli/config).

## İlgili

- [CLI reference](/tr/cli)
- [TUI](/tr/web/tui)
