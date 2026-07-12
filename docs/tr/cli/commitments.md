---
read_when:
    - Çıkarımsanan takip taahhütlerini incelemek istiyorsunuz
    - Bekleyen yoklamaları kapatmak istiyorsunuz
    - Heartbeat'in neler iletebileceğini denetliyorsunuz
summary: '`openclaw commitments` için CLI başvurusu (çıkarılan takip görevlerini inceleme ve kaldırma)'
title: '`openclaw commitments`'
x-i18n:
    generated_at: "2026-07-12T12:09:35Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4323273a5d73975532f4728dc5e40c5d59e0c6d2e31a538f96bf3451e3fdf4d9
    source_path: cli/commitments.md
    workflow: 16
---

Çıkarılan takip taahhütlerini listeleyin ve yönetin.

Taahhütler isteğe bağlıdır (`commitments.enabled`); konuşma bağlamından oluşturulan ve Heartbeat tarafından iletilen kısa ömürlü takip anılarıdır. Kavramsal kılavuz ve yapılandırma için [Çıkarılan taahhütler](/tr/concepts/commitments) bölümüne bakın.

Alt komut verilmediğinde `openclaw commitments`, bekleyen taahhütleri listeler.

## Kullanım

```bash
openclaw commitments [--all] [--agent <id>] [--status <status>] [--json]
openclaw commitments list [--all] [--agent <id>] [--status <status>] [--json]
openclaw commitments dismiss <id...> [--json]
```

## Seçenekler

- `--all`: yalnızca bekleyen taahhütler yerine tüm durumları gösterir.
- `--agent <id>`: sonuçları tek bir aracı kimliğine göre filtreler.
- `--status <status>`: duruma göre filtreler. Değerler: `pending`, `sent`, `dismissed`, `snoozed` veya `expired`. Bilinmeyen değerlerde hata ile çıkılır.
- `--json`: makine tarafından okunabilir JSON çıktısı üretir.

`dismiss`, belirtilen taahhüt kimliklerini `dismissed` olarak işaretler; böylece Heartbeat bunları iletmez.

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

Metin çıktısı; taahhüt sayısını, depo yolunu, etkin filtreleri ve her taahhüt için bir satırı yazdırır:

- taahhüt kimliği
- durum
- tür (`event_check_in`, `deadline_check`, `care_check_in` veya `open_loop`)
- en erken vade zamanı
- kapsam (aracı/kanal/hedef)
- önerilen durum sorma metni

JSON çıktısı; sayıyı, etkin durum ve aracı filtrelerini, taahhüt deposunun yolunu ve saklanan kayıtların tamamını içerir.

## İlgili

- [Çıkarılan taahhütler](/tr/concepts/commitments)
- [Belleğe genel bakış](/tr/concepts/memory)
- [Heartbeat](/tr/gateway/heartbeat)
- [Zamanlanmış görevler](/tr/automation/cron-jobs)
