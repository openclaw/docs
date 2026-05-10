---
read_when:
    - Arka plan görev kayıtlarını incelemek, denetlemek veya iptal etmek istiyorsunuz
    - Task Flow komutlarını `openclaw tasks flow` altında belgeliyorsunuz
summary: '`openclaw tasks` için CLI başvurusu (arka plan görev defteri ve Task Flow durumu)'
title: '`openclaw tasks`'
x-i18n:
    generated_at: "2026-05-10T19:30:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7bbb97690124a8e59ec5e6a517f33166ad449ee6268894ab132ad9cb69dcaa81
    source_path: cli/tasks.md
    workflow: 16
---

Dayanıklı arka plan görevlerini ve Task Flow durumunu inceleyin. Alt komut olmadan,
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

- `--json`: JSON çıktısı üretir.
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

Görev kimliği, çalıştırma kimliği veya oturum anahtarıyla tek bir görevi gösterir.

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

Bayat, kayıp, teslimi başarısız olmuş veya başka şekilde tutarsız görev ve Task Flow kayıtlarını ortaya çıkarır. `cleanupAfter` zamanına kadar tutulan kayıp görevler uyarıdır; süresi dolmuş veya damgalanmamış kayıp görevler hatadır.

### `maintenance`

```bash
openclaw tasks maintenance [--apply] [--json]
```

Görev ve Task Flow mutabakatını, temizleme damgalamasını, budamayı
ve bayat cron çalıştırma oturumu kayıt defteri temizliğini önizler veya uygular.
Cron görevleri için mutabakat, eski bir etkin görevi `lost` olarak işaretlemeden
önce kalıcı çalıştırma günlüklerini/iş durumunu kullanır; böylece tamamlanmış cron
çalıştırmaları, yalnızca bellek içi Gateway çalışma zamanı durumu kaybolduğu için
yanlış denetim hatalarına dönüşmez. Çevrimdışı CLI denetimi, Gateway'in süreç
yerel cron etkin iş kümesi için yetkili kaynak değildir. Çalıştırma kimliği/kaynak
kimliği olan CLI görevleri, eski bir alt oturum satırı kalsa bile canlı Gateway
çalıştırma bağlamları kaybolduğunda `lost` olarak işaretlenir.
Uygulandığında bakım, şu anda çalışan cron işlerini korurken ve cron olmayan oturum
satırlarına dokunmadan 7 günden eski `cron:<jobId>:run:<uuid>` oturum kayıt defteri
satırlarını da budar.

### `flow`

```bash
openclaw tasks flow list [--status <name>] [--json]
openclaw tasks flow show <lookup> [--json]
openclaw tasks flow cancel <lookup>
```

Görev defteri altındaki dayanıklı Task Flow durumunu inceler veya iptal eder.

## İlgili

- [CLI referansı](/tr/cli)
- [Arka plan görevleri](/tr/automation/tasks)
