---
read_when:
    - Bir cron işi oluşturmadan bir sistem olayını kuyruğa almak istiyorsunuz
    - Heartbeat'leri etkinleştirmeniz veya devre dışı bırakmanız gerekir
    - Sistem varlığı kayıtlarını incelemek istiyorsunuz
summary: '`openclaw system` için CLI başvurusu (sistem olayları, Heartbeat, iletişim durumu)'
title: Sistem
x-i18n:
    generated_at: "2026-07-12T11:36:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: aaca206d8b463fd33f9e3cb21382bbf36469e9daa2706d8a9e2c7fab14b76e7a
    source_path: cli/system.md
    workflow: 16
---

# `openclaw system`

Gateway için sistem düzeyinde yardımcılar: sistem olaylarını kuyruğa ekleyin, Heartbeat'leri denetleyin ve çevrimiçi durumunu görüntüleyin.

Tüm `system` alt komutları Gateway RPC kullanır ve ortak istemci bayraklarını kabul eder:

| Bayrak            | Varsayılan                           | Açıklama                                                                                                                                                                                                 |
| ----------------- | ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--url <url>`     | yapılandırıldığında `gateway.remote.url` | Gateway WebSocket URL'si.                                                                                                                                                                            |
| `--token <token>` | yok                                  | Gateway belirteci (gerekiyorsa).                                                                                                                                                                         |
| `--timeout <ms>`  | `30000`                              | Milisaniye cinsinden RPC zaman aşımı.                                                                                                                                                                    |
| `--expect-final`  | kapalı                               | Son yanıtı (agent) bekleyin.                                                                                                                                                                             |
| `--json`          | kapalı                               | JSON çıktısı verin. `heartbeat last/enable/disable` ve `system presence`, bu bayraktan bağımsız olarak her zaman ham RPC JSON yükünü yazdırır; `system event`, JSON ile düz bir `ok` satırı arasında geçiş yapmak için bu bayrağı kullanır. |

## Yaygın komutlar

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
openclaw system event --text "Check for urgent follow-ups" --url ws://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
openclaw system heartbeat enable
openclaw system heartbeat last
openclaw system presence
```

## `system event`

Varsayılan olarak **ana** oturumda bir sistem olayını kuyruğa ekler. Bir sonraki Heartbeat, bunu isteme bir `System:` satırı olarak ekler. Heartbeat'i hemen tetiklemek için `--mode now` kullanın; `next-heartbeat` (varsayılan) bir sonraki zamanlanmış işareti bekler.

Belirli bir oturumu hedeflemek için `--session-key` iletin; örneğin, eşzamansız bir görevin tamamlanmasını onu başlatan kanala geri aktarmak için.

<Note>
**`--session-key` ile zamanlama istisnası:** `--session-key` sağlandığında, `--mode next-heartbeat` bir sonraki zamanlanmış işareti beklemek yerine anında hedeflenmiş uyandırmaya dönüşür. Hedeflenmiş uyandırmalar `immediate` Heartbeat amacını kullanır; böylece aksi takdirde `event` amaçlı bir uyandırmayı erteleyecek (ve fiilen düşürecek) olan çalıştırıcının henüz zamanı gelmedi kapısını atlar. Gecikmeli teslimat istiyorsanız olayın ana oturuma ulaşması ve bir sonraki düzenli Heartbeat ile iletilmesi için `--session-key` seçeneğini kullanmayın.
</Note>

Bayraklar:

- `--text <text>`: gerekli sistem olayı metni.
- `--mode <mode>`: `now` veya `next-heartbeat` (varsayılan).
- `--session-key <sessionKey>`: isteğe bağlıdır; agent'ın ana oturumu yerine belirli bir agent oturumunu hedefler. Çözümlenen agent'a ait olmayan anahtarlar agent'ın ana oturumuna geri döner.

## `system heartbeat last|enable|disable`

- `last`: son Heartbeat olayını gösterir.
- `enable`: Heartbeat'leri yeniden açar (devre dışı bırakılmışlarsa bunu kullanın).
- `disable`: Heartbeat'leri duraklatır.

## `system presence`

Gateway'in bildiği mevcut sistem çevrimiçi durumu girdilerini (Node'lar, örnekler ve benzer durum satırları) listeler.

## Notlar

- Geçerli yapılandırmanız üzerinden erişilebilen, çalışan bir Gateway gerektirir (yerel veya uzak).
- Sistem olayları geçicidir ve yeniden başlatmalar arasında kalıcı olarak saklanmaz.

## İlgili

- [CLI başvurusu](/tr/cli)
