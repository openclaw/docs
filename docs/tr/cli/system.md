---
read_when:
    - Bir Cron işi oluşturmadan bir sistem olayını kuyruğa almak istiyorsunuz
    - Heartbeat'leri etkinleştirmeniz veya devre dışı bırakmanız gerekir
    - Sistem varlık girdilerini incelemek istiyorsunuz
summary: '`openclaw system` için CLI referansı (sistem olayları, Heartbeat, varlık durumu)'
title: Sistem
x-i18n:
    generated_at: "2026-05-11T20:27:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2810fb064ea4afeac24ca0d71419913a664bbec0721cabdb09196075914f4864
    source_path: cli/system.md
    workflow: 16
    postprocess_version: locale-links-v1
---

# `openclaw system`

Gateway için sistem düzeyi yardımcılar: sistem olaylarını kuyruğa alır, Heartbeat'leri kontrol eder
ve varlık durumunu görüntüler.

Tüm `system` alt komutları Gateway RPC kullanır ve paylaşılan istemci bayraklarını kabul eder:

- `--url <url>`
- `--token <token>`
- `--timeout <ms>`
- `--expect-final`

## Yaygın komutlar

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
openclaw system event --text "Check for urgent follow-ups" --url ws://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
openclaw system heartbeat enable
openclaw system heartbeat last
openclaw system presence
```

## `system event`

Varsayılan olarak **main** oturumda bir sistem olayını kuyruğa alır. Sonraki Heartbeat
bunu istemde bir `System:` satırı olarak enjekte eder. Heartbeat'i hemen tetiklemek
için `--mode now` kullanın; `next-heartbeat` bir sonraki zamanlanmış işareti bekler.

Belirli bir oturumu hedeflemek için `--session-key` iletin (örneğin bir
async-task tamamlanmasını, onu başlatan kanala geri aktarmak için).

> **`--session-key` ile zamanlama istisnası:** `--session-key` sağlandığında,
> `--mode next-heartbeat` bir sonraki zamanlanmış işareti beklemek yerine
> hemen hedeflenen bir uyandırmaya indirgenir. Hedeflenen uyandırmalar Heartbeat amacı olarak
> `immediate` kullanır; böylece aksi halde bir `event` amaçlı uyandırmayı
> erteleyecek (ve fiilen düşürecek) çalıştırıcının zamanı gelmemiş kapısını atlarlar. Gecikmeli
> teslim istiyorsanız, `--session-key` kullanmayın; böylece olay main oturuma düşer ve
> bir sonraki normal Heartbeat ile ilerler.

Bayraklar:

- `--text <text>`: gerekli sistem olayı metni.
- `--mode <mode>`: `now` veya `next-heartbeat` (varsayılan).
- `--session-key <sessionKey>`: isteğe bağlı; ajanın main oturumu yerine
  belirli bir ajan oturumunu hedefler. Çözümlenen ajana ait olmayan anahtarlar
  ajanın main oturumuna geri döner.
- `--json`: makine tarafından okunabilir çıktı.
- `--url`, `--token`, `--timeout`, `--expect-final`: paylaşılan Gateway RPC bayrakları.

## `system heartbeat last|enable|disable`

Heartbeat kontrolleri:

- `last`: son Heartbeat olayını gösterir.
- `enable`: Heartbeat'leri yeniden açar (devre dışı bırakılmışlarsa bunu kullanın).
- `disable`: Heartbeat'leri duraklatır.

Bayraklar:

- `--json`: makine tarafından okunabilir çıktı.
- `--url`, `--token`, `--timeout`, `--expect-final`: paylaşılan Gateway RPC bayrakları.

## `system presence`

Gateway'in bildiği geçerli sistem varlığı girdilerini listeler (düğümler,
örnekler ve benzer durum satırları).

Bayraklar:

- `--json`: makine tarafından okunabilir çıktı.
- `--url`, `--token`, `--timeout`, `--expect-final`: paylaşılan Gateway RPC bayrakları.

## Notlar

- Mevcut yapılandırmanızla erişilebilen çalışan bir Gateway gerektirir (yerel veya uzak).
- Sistem olayları geçicidir ve yeniden başlatmalar arasında kalıcı değildir.

## İlgili

- [CLI başvurusu](/tr/cli)
