---
read_when:
    - Çıkarım yoluyla belirlenen takip taahhütlerini incelemek istiyorsunuz
    - Bekleyen yoklamaları kapatmak istiyorsunuz
    - Heartbeat'in neler iletebileceğini denetliyorsunuz
summary: '`openclaw commitments` için CLI referansı (çıkarılan takip işlemlerini inceleme ve kapatma)'
title: '`openclaw commitments`'
x-i18n:
    generated_at: "2026-07-16T16:56:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: db8a7d8f5756ccb18ed0990fcedf50d1072bb67e775c29eefdbd1a7dd795b7b0
    source_path: cli/commitments.md
    workflow: 16
---

Çıkarılan takip taahhütlerini listeleyin ve yönetin.

Taahhütler, konuşma bağlamından oluşturulan ve Heartbeat tarafından iletilen, isteğe bağlı (`commitments.enabled`) ve kısa ömürlü takip anılarıdır.
Kavramsal kılavuz ve yapılandırma için
[Çıkarılan taahhütler](/tr/concepts/commitments) bölümüne bakın.

Alt komut verilmediğinde, `openclaw commitments` bekleyen taahhütleri listeler.

## Kullanım

```bash
openclaw commitments [--all] [--agent <id>] [--status <status>] [--json]
openclaw commitments list [--all] [--agent <id>] [--status <status>] [--json]
openclaw commitments dismiss <id...> [--json]
```

## Seçenekler

- `--all`: yalnızca bekleyen taahhütler yerine tüm durumları gösterir.
- `--agent <id>`: tek bir aracı kimliğine göre filtreler.
- `--status <status>`: duruma göre filtreler. Değerler: `pending`, `sent`,
  `dismissed`, `snoozed` veya `expired`. Bilinmeyen değerlerde hata verilerek çıkılır.
- `--json`: makine tarafından okunabilir JSON çıktısı üretir.

`dismiss`, Heartbeat'in iletmemesi için belirtilen taahhüt kimliklerini `dismissed` olarak işaretler.

## Örnekler

Bekleyen taahhütleri listeleyin:

```bash
openclaw commitments
```

Saklanan tüm taahhütleri listeleyin:

```bash
openclaw commitments --all
```

Tek bir aracıya göre filtreleyin:

```bash
openclaw commitments --agent main
```

Ertelenmiş taahhütleri bulun:

```bash
openclaw commitments --status snoozed
```

Bir veya daha fazla taahhüdü iptal edin:

```bash
openclaw commitments dismiss cm_abc123 cm_def456
```

JSON olarak dışa aktarın:

```bash
openclaw commitments --all --json
```

## Çıktı

Metin çıktısı; taahhüt sayısını, paylaşılan SQLite veritabanı yolunu, etkin filtreleri
ve her taahhüt için bir satırı yazdırır:

- taahhüt kimliği
- durum
- tür (`event_check_in`, `deadline_check`, `care_check_in` veya `open_loop`)
- en erken son tarih
- kapsam (aracı/kanal/hedef)
- önerilen durum yoklama metni

JSON çıktısı; sayıyı, etkin durum ve aracı filtrelerini, paylaşılan SQLite veritabanı yolunu ve saklanan kayıtların tamamını içerir.

## İlgili

- [Çıkarılan taahhütler](/tr/concepts/commitments)
- [Belleğe genel bakış](/tr/concepts/memory)
- [Heartbeat](/tr/gateway/heartbeat)
- [Zamanlanmış görevler](/tr/automation/cron-jobs)
