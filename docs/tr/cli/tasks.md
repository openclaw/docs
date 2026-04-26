---
read_when:
    - Arka plan görev kayıtlarını incelemek, denetlemek veya iptal etmek istiyorsunuz
    - '`openclaw tasks flow` altında TaskFlow komutlarını belgeliyorsunuz'
summary: '`openclaw tasks` için CLI başvurusu (arka plan görev kaydı ve TaskFlow durumu)'
title: '`openclaw tasks`'
x-i18n:
    generated_at: "2026-04-26T11:26:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6e61fb0b67a2bdd932b29543199fb219890f256260a66881c8e7ffeb9fadee33
    source_path: cli/tasks.md
    workflow: 15
---

Dayanıklı arka plan görevlerini ve TaskFlow durumunu inceleyin. Alt komut olmadan,
`openclaw tasks`, `openclaw tasks list` ile aynıdır.

Yaşam döngüsü ve teslim modeli için bkz. [Arka Plan Görevleri](/tr/automation/tasks).

## Kullanım

```bash
openclaw tasks
openclaw tasks list
openclaw tasks list --runtime acp
openclaw tasks list --status running
openclaw tasks show <lookup>
openclaw tasks notify <lookup> state_changes
openclaw tasks cancel <lookup>
openclaw tasks audit
openclaw tasks maintenance
openclaw tasks maintenance --apply
openclaw tasks flow list
openclaw tasks flow show <lookup>
openclaw tasks flow cancel <lookup>
```

## Kök Seçenekleri

- `--json`: JSON çıktısı verir.
- `--runtime <name>`: türe göre filtreler: `subagent`, `acp`, `cron` veya `cli`.
- `--status <name>`: duruma göre filtreler: `queued`, `running`, `succeeded`, `failed`, `timed_out`, `cancelled` veya `lost`.

## Alt komutlar

### `list`

```bash
openclaw tasks list [--runtime <name>] [--status <name>] [--json]
```

İzlenen arka plan görevlerini en yeniden en eskiye listeler.

### `show`

```bash
openclaw tasks show <lookup> [--json]
```

Bir görevi görev kimliğine, çalışma kimliğine veya oturum anahtarına göre gösterir.

### `notify`

```bash
openclaw tasks notify <lookup> <done_only|state_changes|silent>
```

Çalışan bir görevin bildirim politikasını değiştirir.

### `cancel`

```bash
openclaw tasks cancel <lookup>
```

Çalışan bir arka plan görevini iptal eder.

### `audit`

```bash
openclaw tasks audit [--severity <warn|error>] [--code <name>] [--limit <n>] [--json]
```

Bayat, kayıp, teslimatı başarısız olmuş veya başka şekilde tutarsız görev ve TaskFlow kayıtlarını ortaya çıkarır. `cleanupAfter` süresine kadar tutulan kayıp görevler uyarıdır; süresi dolmuş veya damgalanmamış kayıp görevler hatadır.

### `maintenance`

```bash
openclaw tasks maintenance [--apply] [--json]
```

Görev ve TaskFlow uzlaştırmasını, temizleme damgalamasını ve budamayı önizler veya uygular.
Cron görevleri için uzlaştırma, eski bir etkin görevi `lost` olarak işaretlemeden önce
kalıcı çalışma günlüklerini/iş durumunu kullanır; böylece tamamlanmış cron çalışmaları,
yalnızca bellekteki Gateway çalışma zamanı durumu artık olmadığı için sahte denetim hataları
haline gelmez. Çevrimdışı CLI denetimi, Gateway'in süreç-yerel cron etkin iş kümesi için
yetkili değildir.

### `flow`

```bash
openclaw tasks flow list [--status <name>] [--json]
openclaw tasks flow show <lookup> [--json]
openclaw tasks flow cancel <lookup>
```

Görev kaydı altındaki dayanıklı TaskFlow durumunu inceler veya iptal eder.

## İlgili

- [CLI başvurusu](/tr/cli)
- [Arka plan görevleri](/tr/automation/tasks)
