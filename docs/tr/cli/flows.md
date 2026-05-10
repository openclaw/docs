---
read_when:
    - Eski belgelerde veya sürüm notlarında `openclaw flows` ile karşılaşırsınız
    - Hızlı bir TaskFlow inceleme referansı istiyorsunuz
summary: 'Yönlendirme: flow komutları `openclaw tasks flow` altında bulunur'
title: Akışlar (yönlendirme)
x-i18n:
    generated_at: "2026-05-10T19:29:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: b41e8a911cfbba32f3a1af059df34f73443ea7649bce46a5926cdf26c8399c12
    source_path: cli/flows.md
    workflow: 16
---

# `openclaw tasks flow`

Üst düzey bir `openclaw flows` komutu yoktur. Kalıcı TaskFlow incelemesi `openclaw tasks flow` altında yer alır.

## Alt komutlar

```bash
openclaw tasks flow list   [--json] [--status <name>]
openclaw tasks flow show   <lookup> [--json]
openclaw tasks flow cancel <lookup>
```

| Alt komut | Açıklama                   | Argümanlar / seçenekler                                                              |
| ---------- | -------------------------- | ------------------------------------------------------------------------------------- |
| `list`     | İzlenen TaskFlow'ları listele. | `--json` makine tarafından okunabilir çıktı; `--status <name>` filtresi (aşağıdaki durum değerlerine bakın). |
| `show`     | Bir TaskFlow göster.       | `<lookup>` akış kimliği veya sahip anahtarı; `--json` makine tarafından okunabilir çıktı. |
| `cancel`   | Çalışan bir TaskFlow'u iptal et. | `<lookup>` akış kimliği veya sahip anahtarı.                                          |

`<lookup>`, bir akış kimliğini (`list` / `show` tarafından döndürülür) veya akışın sahip anahtarını (sahip olan alt sistemin akışı izlemek için kullandığı kararlı tanımlayıcı) kabul eder.

### Durum filtresi değerleri

`list` üzerindeki `--status` şunlardan birini kabul eder:

`queued`, `running`, `waiting`, `blocked`, `succeeded`, `failed`, `cancelled`, `lost`

## Örnekler

```bash
openclaw tasks flow list
openclaw tasks flow list --status running
openclaw tasks flow list --json
openclaw tasks flow show flow_abc123
openclaw tasks flow show flow_abc123 --json
openclaw tasks flow cancel flow_abc123
```

Tam TaskFlow kavramları ve yazımı için bkz. [TaskFlow](/tr/automation/taskflow). Üst `tasks` komutu için bkz. [tasks CLI başvurusu](/tr/cli/tasks).

## İlgili

- [CLI başvurusu](/tr/cli)
- [Otomasyon](/tr/automation)
- [TaskFlow](/tr/automation/taskflow)
