---
read_when:
    - Çıkarımla belirlenen takip taahhütlerini incelemek istiyorsunuz
    - Bekleyen kontrol bildirimlerini kapatmak istiyorsunuz
    - Heartbeat'in ne iletebileceğini denetliyorsunuz
summary: '`openclaw commitments` için CLI referansı (çıkarılan takipleri inceleyin ve kapatın)'
title: '`openclaw commitments`'
x-i18n:
    generated_at: "2026-04-30T09:11:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 37d5e5dca25cf649a5069360aa4e41fcc33d042dea99f643b98c07189c58f21c
    source_path: cli/commitments.md
    workflow: 16
---

Çıkarılan takip taahhütlerini listeleyin ve yönetin.

Taahhütler, konuşma bağlamından oluşturulan, katılım gerektiren ve kısa ömürlü takip bellekleridir. Kavramsal kılavuz için [Çıkarılan taahhütler](/tr/concepts/commitments) bölümüne bakın.

Alt komut olmadan, `openclaw commitments` bekleyen taahhütleri listeler.

## Kullanım

```bash
openclaw commitments [--all] [--agent <id>] [--status <status>] [--json]
openclaw commitments list [--all] [--agent <id>] [--status <status>] [--json]
openclaw commitments dismiss <id...> [--json]
```

## Seçenekler

- `--all`: yalnızca bekleyen taahhütler yerine tüm durumları gösterir.
- `--agent <id>`: tek bir ajan kimliğine göre filtreler.
- `--status <status>`: duruma göre filtreler. Değerler: `pending`, `sent`,
  `dismissed`, `snoozed` veya `expired`.
- `--json`: makine tarafından okunabilir JSON çıktısı verir.

## Örnekler

Bekleyen taahhütleri listeleyin:

```bash
openclaw commitments
```

Saklanan her taahhüdü listeleyin:

```bash
openclaw commitments --all
```

Tek bir ajana göre filtreleyin:

```bash
openclaw commitments --agent main
```

Ertelenmiş taahhütleri bulun:

```bash
openclaw commitments --status snoozed
```

Bir veya daha fazla taahhüdü kapatın:

```bash
openclaw commitments dismiss cm_abc123 cm_def456
```

JSON olarak dışa aktarın:

```bash
openclaw commitments --all --json
```

## Çıktı

Metin çıktısı şunları içerir:

- taahhüt kimliği
- durum
- tür
- en erken son tarih
- kapsam
- önerilen yoklama metni

JSON çıktısı ayrıca taahhüt deposu yolunu ve saklanan kayıtların tamamını içerir.

## İlgili

- [Çıkarılan taahhütler](/tr/concepts/commitments)
- [Belleğe genel bakış](/tr/concepts/memory)
- [Heartbeat](/tr/gateway/heartbeat)
- [Zamanlanmış görevler](/tr/automation/cron-jobs)
