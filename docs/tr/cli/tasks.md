---
read_when:
    - Arka plan görev kayıtlarını incelemek, denetlemek veya iptal etmek istiyorsunuz
    - '`openclaw tasks flow` altında TaskFlow komutlarını belgeliyorsunuz'
summary: '`openclaw tasks` için CLI başvurusu (arka plan görev kaydı ve TaskFlow durumu)'
title: '`openclaw tasks`'
x-i18n:
    generated_at: "2026-04-24T09:04:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 55aab29821578bf8c09e1b6cd5bbeb5e3dae4438e453b418fa7e8420412c8152
    source_path: cli/tasks.md
    workflow: 15
---

Dayanıklı arka plan görevlerini ve TaskFlow durumunu inceleyin. Alt komut olmadan,
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

- `--json`: JSON çıktısı.
- `--runtime <name>`: türe göre filtrele: `subagent`, `acp`, `cron` veya `cli`.
- `--status <name>`: duruma göre filtrele: `queued`, `running`, `succeeded`, `failed`, `timed_out`, `cancelled` veya `lost`.

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

Tek bir görevi görev kimliğine, çalıştırma kimliğine veya oturum anahtarına göre gösterir.

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

Eski, kayıp, teslimatı başarısız olmuş veya başka şekilde tutarsız görev ve Task Flow kayıtlarını ortaya çıkarır.

### `maintenance`

```bash
openclaw tasks maintenance [--apply] [--json]
```

Görev ve Task Flow uzlaştırmasını, temizleme damgalamasını ve budamayı önizler veya uygular.

### `flow`

```bash
openclaw tasks flow list [--status <name>] [--json]
openclaw tasks flow show <lookup> [--json]
openclaw tasks flow cancel <lookup>
```

Görev kaydı altındaki dayanıklı Task Flow durumunu inceler veya iptal eder.

## İlgili

- [CLI başvurusu](/tr/cli)
- [Arka plan görevleri](/tr/automation/tasks)
