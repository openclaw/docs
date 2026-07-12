---
read_when:
    - Arka plan görev kayıtlarını incelemek, denetlemek veya iptal etmek istiyorsunuz
    - '`openclaw tasks flow` altında Task Flow komutlarını belgeliyorsunuz.'
summary: '`openclaw tasks` için CLI başvurusu (arka plan görev kaydı ve TaskFlow durumu)'
title: '`openclaw tasks`'
x-i18n:
    generated_at: "2026-07-12T12:12:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b03a4aa9fab12b6e5773259a76a1e89fd6e6398c73e5b0533a31e5e3a3894f9c
    source_path: cli/tasks.md
    workflow: 16
---

Kalıcı arka plan görevlerini ve TaskFlow durumunu inceleyin. Alt komut belirtilmediğinde,
`openclaw tasks`, `openclaw tasks list` ile eşdeğerdir.

Yaşam döngüsü ve teslimat modeli için [Arka Plan Görevleri](/tr/automation/tasks)
sayfasına; bulguların tam açıklamaları için bu sayfadaki `tasks audit` bölümüne bakın.

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

| Bayrak             | Açıklama                                                                                               |
| ------------------ | ------------------------------------------------------------------------------------------------------ |
| `--json`           | JSON çıktısı verir.                                                                                    |
| `--runtime <name>` | Türe göre filtreler: `subagent`, `acp`, `cron` veya `cli`.                                             |
| `--status <name>`  | Duruma göre filtreler: `queued`, `running`, `succeeded`, `failed`, `timed_out`, `cancelled` veya `lost`. |

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

Eskimiş, kayıp, teslimatı başarısız olmuş veya başka bir şekilde tutarsız görev ve
TaskFlow kayıtlarını ortaya çıkarır. `cleanupAfter` zamanına kadar tutulan kayıp görevler
uyarıdır; süresi dolmuş veya zaman damgası eklenmemiş kayıp görevler hatadır.

`--code`, görev kodlarını (`stale_queued`, `stale_running`, `lost`,
`delivery_failed`, `missing_cleanup`, `inconsistent_timestamps`) ve TaskFlow
kodlarını (`restore_failed`, `stale_waiting`, `stale_blocked`,
`cancel_stuck`, `missing_linked_tasks`, `blocked_task_missing`) kabul eder. Her
kodun önem derecesi ve tetikleyici ayrıntıları için
[Arka Plan Görevleri](/tr/automation/tasks) sayfasına bakın.

### `maintenance`

```bash
openclaw tasks maintenance [--apply] [--json]
```

Görev ve TaskFlow uzlaştırmasını, temizleme damgalamasını, budamayı ve eskimiş
Cron çalıştırma oturumu kayıt defteri temizliğini önizler veya uygular.

Cron görevlerinde uzlaştırma, eski ve etkin bir görevi `lost` olarak işaretlemeden
önce kalıcı çalıştırma günlüklerini ve iş durumunu kullanır; böylece tamamlanmış Cron
çalıştırmaları, yalnızca Gateway'in bellek içi çalışma zamanı durumu artık mevcut olmadığı
için hatalı denetim sonuçlarına dönüşmez. Çevrimdışı CLI denetimi, Gateway'in işleme
yerel etkin Cron işleri kümesi için yetkili kaynak değildir. Çalıştırma kimliği/kaynak
kimliği bulunan CLI görevleri, eski bir alt oturum satırı kalsa bile canlı Gateway
çalıştırma bağlamları artık mevcut olmadığında `lost` olarak işaretlenir.

Bakım uygulandığında, çalışmakta olan Cron işleri korunurken ve Cron dışı oturum
satırlarına dokunulmadan 7 günden eski `cron:<jobId>:run:<uuid>` oturum kayıt
defteri satırları da budanır.

### `flow`

```bash
openclaw tasks flow list [--status <name>] [--json]
openclaw tasks flow show <lookup> [--json]
openclaw tasks flow cancel <lookup>
```

Görev defterindeki kalıcı TaskFlow durumunu inceler veya iptal eder.
`flow list --status`; `queued`, `running`, `waiting`, `blocked`,
`succeeded`, `failed`, `cancelled` veya `lost` değerlerini kabul eder.

## İlgili Kaynaklar

- [CLI başvurusu](/tr/cli)
- [Arka plan görevleri](/tr/automation/tasks)
