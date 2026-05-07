---
read_when:
    - Arka plan görev kayıtlarını incelemek, denetlemek veya iptal etmek istiyorsunuz
    - '`openclaw tasks flow` altında TaskFlow komutlarını belgeliyorsunuz'
summary: '`openclaw tasks` için CLI başvurusu (arka plan görev defteri ve TaskFlow durumu)'
title: '`openclaw tasks`'
x-i18n:
    generated_at: "2026-05-07T13:15:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: ca3f05d7c2a3fa7790ad6059ce15721ebffb548ac4a2c627188ac17986442dc6
    source_path: cli/tasks.md
    workflow: 16
---

Dayanıklı arka plan görevlerini ve Task Flow durumunu inceleyin. Alt komut verilmediğinde,
`openclaw tasks`, `openclaw tasks list` ile eşdeğerdir.

Yaşam döngüsü ve teslim modeli için [Arka Plan Görevleri](/tr/automation/tasks) bölümüne bakın.

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

## Kök Seçenekler

- `--json`: JSON çıktısı verir.
- `--runtime <name>`: türe göre filtreler: `subagent`, `acp`, `cron` veya `cli`.
- `--status <name>`: duruma göre filtreler: `queued`, `running`, `succeeded`, `failed`, `timed_out`, `cancelled` veya `lost`.

## Alt Komutlar

### `list`

```bash
openclaw tasks list [--runtime <name>] [--status <name>] [--json]
```

İzlenen arka plan görevlerini en yeniden en eskiye doğru listeler.

### `show`

```bash
openclaw tasks show <lookup> [--json]
```

Görev kimliğine, çalıştırma kimliğine veya oturum anahtarına göre tek bir görevi gösterir.

### `notify`

```bash
openclaw tasks notify <lookup> <done_only|state_changes|silent>
```

Çalışan bir görevin bildirim ilkesini değiştirir.

### `cancel`

```bash
openclaw tasks cancel <lookup>
```

Çalışan bir arka plan görevini iptal eder.

### `audit`

```bash
openclaw tasks audit [--severity <warn|error>] [--code <name>] [--limit <n>] [--json]
```

Eski, kayıp, teslimi başarısız olmuş veya başka şekilde tutarsız görev ve Task Flow kayıtlarını ortaya çıkarır. `cleanupAfter` süresine kadar tutulan kayıp görevler uyarıdır; süresi dolmuş veya damgalanmamış kayıp görevler hatadır.

### `maintenance`

```bash
openclaw tasks maintenance [--apply] [--json]
```

Görev ve Task Flow uzlaştırmasını, temizlik damgalamasını ve budamayı önizler veya uygular.
Cron görevleri için uzlaştırma, eski bir etkin görevi `lost` olarak işaretlemeden önce kalıcı çalıştırma günlüklerini/iş durumunu kullanır; böylece tamamlanmış cron çalıştırmaları yalnızca bellek içi Gateway çalışma zamanı durumu kaybolduğu için hatalı denetim hatalarına dönüşmez. Çevrim dışı CLI denetimi, Gateway'in süreç yerel cron etkin iş kümesi için otoritatif değildir. Çalıştırma kimliği/kaynak kimliği olan CLI görevleri, canlı Gateway çalıştırma bağlamları kaybolduğunda, eski bir alt oturum satırı kalsa bile `lost` olarak işaretlenir.

### `flow`

```bash
openclaw tasks flow list [--status <name>] [--json]
openclaw tasks flow show <lookup> [--json]
openclaw tasks flow cancel <lookup>
```

Görev defteri altındaki dayanıklı Task Flow durumunu inceler veya iptal eder.

## İlgili

- [CLI başvurusu](/tr/cli)
- [Arka plan görevleri](/tr/automation/tasks)
