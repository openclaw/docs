---
read_when:
    - Bir cron işi oluşturmadan bir sistem olayı kuyruğa almak istediğinizde
    - Heartbeat'leri etkinleştirmeniz veya devre dışı bırakmanız gerektiğinde
    - Sistem presence girdilerini incelemek istediğinizde
summary: '`openclaw system` için CLI başvurusu (sistem olayları, heartbeat, presence)'
title: system
x-i18n:
    generated_at: "2026-04-05T13:49:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: a7d19afde9d9cde8a79b0bb8cec6e5673466f4cb9b575fb40111fc32f4eee5d7
    source_path: cli/system.md
    workflow: 15
---

# `openclaw system`

Gateway için sistem düzeyinde yardımcılar: sistem olaylarını kuyruğa alma, heartbeat'leri kontrol etme
ve presence görüntüleme.

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

**Ana** oturumda bir sistem olayını kuyruğa alın. Bir sonraki heartbeat, bunu
istem içine `System:` satırı olarak ekleyecektir. Heartbeat'i hemen tetiklemek için `--mode now`
kullanın; `next-heartbeat`, bir sonraki zamanlanmış tik'i bekler.

Bayraklar:

- `--text <text>`: gerekli sistem olayı metni.
- `--mode <mode>`: `now` veya `next-heartbeat` (varsayılan).
- `--json`: makine tarafından okunabilir çıktı.
- `--url`, `--token`, `--timeout`, `--expect-final`: paylaşılan Gateway RPC bayrakları.

## `system heartbeat last|enable|disable`

Heartbeat denetimleri:

- `last`: son heartbeat olayını göster.
- `enable`: heartbeat'leri yeniden aç (devre dışı bırakıldıysa bunu kullanın).
- `disable`: heartbeat'leri duraklat.

Bayraklar:

- `--json`: makine tarafından okunabilir çıktı.
- `--url`, `--token`, `--timeout`, `--expect-final`: paylaşılan Gateway RPC bayrakları.

## `system presence`

Gateway'in bildiği geçerli sistem presence girdilerini listeleyin (düğümler,
örnekler ve benzeri durum satırları).

Bayraklar:

- `--json`: makine tarafından okunabilir çıktı.
- `--url`, `--token`, `--timeout`, `--expect-final`: paylaşılan Gateway RPC bayrakları.

## Notlar

- Mevcut yapılandırmanızdan (yerel veya uzak) erişilebilen çalışan bir Gateway gerektirir.
- Sistem olayları geçicidir ve yeniden başlatmalar arasında kalıcı değildir.
