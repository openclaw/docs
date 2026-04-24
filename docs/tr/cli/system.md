---
read_when:
    - Bir cron işi oluşturmadan bir sistem olayını kuyruğa almak istiyorsunuz
    - Heartbeat'leri etkinleştirmeniz veya devre dışı bırakmanız gerekiyor
    - Sistem varlığı girdilerini incelemek istiyorsunuz
summary: '`openclaw system` için CLI başvurusu (sistem olayları, Heartbeat, varlık durumu)'
title: Sistem
x-i18n:
    generated_at: "2026-04-24T09:04:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0f4be30b0b2d18ee5653071d6375cebeb9fc94733e30bdb7b89a19c286df880b
    source_path: cli/system.md
    workflow: 15
---

# `openclaw system`

Gateway için sistem düzeyi yardımcıları: sistem olaylarını kuyruğa alma, Heartbeat'leri denetleme
ve varlık durumunu görüntüleme.

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

**Ana** oturumda bir sistem olayını kuyruğa alın. Sonraki Heartbeat bunu
istem içine `System:` satırı olarak ekleyecektir. Heartbeat'i hemen
tetiklemek için `--mode now` kullanın; `next-heartbeat` sonraki zamanlanmış tıklamayı bekler.

Bayraklar:

- `--text <text>`: zorunlu sistem olayı metni.
- `--mode <mode>`: `now` veya `next-heartbeat` (varsayılan).
- `--json`: makine tarafından okunabilir çıktı.
- `--url`, `--token`, `--timeout`, `--expect-final`: paylaşılan Gateway RPC bayrakları.

## `system heartbeat last|enable|disable`

Heartbeat denetimleri:

- `last`: son Heartbeat olayını gösterir.
- `enable`: Heartbeat'leri yeniden açar (devre dışı bırakıldılarsa bunu kullanın).
- `disable`: Heartbeat'leri duraklatır.

Bayraklar:

- `--json`: makine tarafından okunabilir çıktı.
- `--url`, `--token`, `--timeout`, `--expect-final`: paylaşılan Gateway RPC bayrakları.

## `system presence`

Gateway'in bildiği geçerli sistem varlığı girdilerini listeleyin (Node'lar,
örnekler ve benzeri durum satırları).

Bayraklar:

- `--json`: makine tarafından okunabilir çıktı.
- `--url`, `--token`, `--timeout`, `--expect-final`: paylaşılan Gateway RPC bayrakları.

## Notlar

- Geçerli yapılandırmanızdan (yerel veya uzak) erişilebilir, çalışan bir Gateway gerektirir.
- Sistem olayları geçicidir ve yeniden başlatmalar arasında kalıcı değildir.

## İlgili

- [CLI başvurusu](/tr/cli)
