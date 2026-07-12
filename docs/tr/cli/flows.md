---
read_when:
    - Eski belgelerde veya sürüm notlarında `openclaw flows` ile karşılaşabilirsiniz
    - Hızlı bir TaskFlow inceleme başvurusu istiyorsunuz
summary: 'Yönlendirme: akış komutları `openclaw tasks flow` altında bulunur'
title: Akışlar (yönlendirme)
x-i18n:
    generated_at: "2026-07-12T11:35:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 05d27154190d6087649612d81ce15f0cbc9459aa89ab22211582c18f4fc2943c
    source_path: cli/flows.md
    workflow: 16
---

# `openclaw tasks flow`

Üst düzey bir `openclaw flows` komutu yoktur. Kalıcı TaskFlow inceleme işlevleri `openclaw tasks flow` altında yer alır.

## Alt komutlar

```bash
openclaw tasks flow list   [--json] [--status <name>]
openclaw tasks flow show   <lookup> [--json]
openclaw tasks flow cancel <lookup>
```

| Alt komut | Açıklama                       | Bağımsız değişkenler / seçenekler                                                               |
| ---------- | ------------------------------ | ----------------------------------------------------------------------------------------------- |
| `list`     | İzlenen TaskFlow'ları listeler. | `--json` makinece okunabilir çıktı; `--status <name>` filtresi (aşağıdaki durum değerlerine bakın). |
| `show`     | Bir TaskFlow'u gösterir.        | `<lookup>` akış kimliği veya sahip anahtarı; `--json` makinece okunabilir çıktı.                 |
| `cancel`   | Çalışan bir TaskFlow'u iptal eder. | `<lookup>` akış kimliği veya sahip anahtarı.                                                  |

`<lookup>`, bir akış kimliğini (`list` / `show` tarafından döndürülür) veya akışın sahip anahtarını (sahip alt sistemin akışı izlemek için kullandığı kararlı tanımlayıcı) kabul eder.

### Durum filtresi değerleri

`list` üzerindeki `--status` şu değerlerden birini kabul eder: `queued`, `running`, `waiting`, `blocked`, `succeeded`, `failed`, `cancelled`, `lost`.

## Örnekler

```bash
openclaw tasks flow list
openclaw tasks flow list --status running
openclaw tasks flow list --json
openclaw tasks flow show flow_abc123
openclaw tasks flow show flow_abc123 --json
openclaw tasks flow cancel flow_abc123
```

TaskFlow kavramları ve oluşturma hakkında bilgi için [TaskFlow](/tr/automation/taskflow) sayfasına bakın. Üst `tasks` komutu için [tasks CLI başvurusu](/tr/cli/tasks) sayfasına bakın.

## İlgili

- [CLI başvurusu](/tr/cli)
- [Otomasyon](/tr/automation)
- [TaskFlow](/tr/automation/taskflow)
