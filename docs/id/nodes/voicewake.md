---
read_when:
    - Mengubah perilaku atau nilai default kata pemicu suara
    - Menambahkan platform node baru yang memerlukan sinkronisasi kata pemicu
summary: Kata pemicu suara global (dikelola oleh Gateway) dan cara penyinkronannya di seluruh node
title: Aktivasi suara
x-i18n:
    generated_at: "2026-07-16T18:20:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: aef2a5bba664ce10fb6ab457bb6d202639dcc6c0a9df61567e7cb402c290bbec
    source_path: nodes/voicewake.md
    workflow: 16
---

Kata pemicu adalah **satu daftar global yang dimiliki oleh Gateway** — tidak ada daftar khusus per Node. Setiap Node atau UI aplikasi dapat mengedit daftar tersebut; Gateway menyimpan perubahan dan menyiarkannya ke setiap klien yang terhubung.

- **macOS**: tombol aktif/nonaktif Voice Wake lokal. Memerlukan macOS 26+; lihat [Pemicu suara (macOS)](/id/platforms/mac/voicewake) untuk detail runtime/PTT.
- **iOS**: tombol aktif/nonaktif Voice Wake lokal di Settings.
- **Android**: tombol aktif/nonaktif Voice Wake lokal dan editor kata pemicu di Settings → Voice. Memerlukan pengenalan ucapan pada perangkat Android.

## Penyimpanan

Kata pemicu dan aturan perutean berada di basis data status Gateway, `~/.openclaw/state/openclaw.sqlite` secara default (ganti dengan `OPENCLAW_STATE_DIR`), dalam tabel `voicewake_triggers`, `voicewake_routing_config`, `voicewake_routing_routes`. `settings/voicewake.json` dan `settings/voicewake-routing.json` versi lama hanya merupakan masukan migrasi `openclaw doctor --fix` — runtime tidak pernah membacanya.

## Protokol

### Daftar pemicu

| Metode          | Parameter                | Hasil                    |
| --------------- | ------------------------ | ------------------------ |
| `voicewake.get` | tidak ada                | `{ triggers: string[] }` |
| `voicewake.set` | `{ triggers: string[] }` | `{ triggers: string[] }` |

`voicewake.set` menormalisasi masukan: memangkas spasi kosong, menghapus entri kosong, mempertahankan paling banyak 32 pemicu, dan memotong masing-masing menjadi 64 unit kode UTF-16 tanpa memisahkan pasangan pengganti. Hasil kosong akan kembali menggunakan nilai default bawaan (`openclaw`, `claude`, `computer`).

### Perutean (pemicu ke target)

| Metode                  | Parameter                            | Hasil                                |
| ----------------------- | ------------------------------------ | ------------------------------------ |
| `voicewake.routing.get` | tidak ada                            | `{ config: VoiceWakeRoutingConfig }` |
| `voicewake.routing.set` | `{ config: VoiceWakeRoutingConfig }` | `{ config: VoiceWakeRoutingConfig }` |

```json
{
  "version": 1,
  "defaultTarget": { "mode": "current" },
  "routes": [{ "trigger": "robot wake", "target": { "sessionKey": "agent:main:main" } }],
  "updatedAtMs": 1730000000000
}
```

Setiap `target` rute mendukung tepat salah satu dari:

- `{ "mode": "current" }`
- `{ "agentId": "main" }`
- `{ "sessionKey": "agent:main:main" }`

Batas: paling banyak 32 rute, teks pemicu paling banyak 64 karakter. Pemicu rute dinormalisasi untuk pencocokan dan pendeteksian duplikat dengan mengubahnya menjadi huruf kecil, menghapus tanda baca di awal/akhir setiap kata, dan menyatukan spasi kosong (`"Hey, Bot!!"` dan `"hey bot"` cocok dan dihitung sebagai duplikat) — normalisasi ini lebih ketat daripada pemangkasan biasa yang digunakan untuk daftar pemicu global di atas.

### Peristiwa

| Peristiwa                   | Payload                              |
| --------------------------- | ------------------------------------ |
| `voicewake.changed`         | `{ triggers: string[] }`             |
| `voicewake.routing.changed` | `{ config: VoiceWakeRoutingConfig }` |

Keduanya disiarkan ke setiap klien WebSocket dengan cakupan baca (aplikasi macOS, WebChat, dan sejenisnya) serta ke setiap Node yang terhubung. Node juga menerima keduanya sebagai pengiriman snapshot awal segera setelah terhubung.

## Perilaku klien

- **macOS**: memanggil `voicewake.set`/`voicewake.get` dan memantau `voicewake.changed` agar tetap sinkron dengan klien lain.
- **iOS**: memanggil `voicewake.set`/`voicewake.get` dan memantau `voicewake.changed` agar pendeteksian kata pemicu lokal tetap responsif.
- **Android**: memanggil `voicewake.set`/`voicewake.get`, memantau `voicewake.changed`, dan mengiklankan `voiceWake` saat diaktifkan. Pengenalan tetap berlangsung pada perangkat dan hanya di latar depan; proses ini dijeda saat audio sedang digunakan oleh Talk, dikte manual, perekaman catatan suara, atau ucapan pesan.

## Terkait

- [Mode Talk](/id/nodes/talk)
- [Audio dan catatan suara](/id/nodes/audio)
- [Pemahaman media](/id/nodes/media-understanding)
