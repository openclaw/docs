---
read_when:
    - Anda ingin memahami perutean dan isolasi sesi
    - Anda ingin mengonfigurasi cakupan DM untuk pengaturan multi-pengguna
summary: Bagaimana OpenClaw mengelola sesi percakapan
title: Manajemen Sesi
x-i18n:
    generated_at: "2026-04-05T13:52:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: ab985781e54b22a034489dafa4b52cc204b1a5da22ee9b62edc7f6697512cea1
    source_path: concepts/session.md
    workflow: 15
---

# Manajemen Sesi

OpenClaw mengatur percakapan ke dalam **sesi**. Setiap pesan dirutekan ke sebuah
sesi berdasarkan asalnya -- DM, obrolan grup, tugas cron, dan sebagainya.

## Bagaimana pesan dirutekan

| Source          | Behavior                    |
| --------------- | --------------------------- |
| Pesan langsung  | Sesi bersama secara default |
| Obrolan grup    | Terisolasi per grup         |
| Room/channel    | Terisolasi per room         |
| Tugas cron      | Sesi baru per eksekusi      |
| Webhook         | Terisolasi per hook         |

## Isolasi DM

Secara default, semua DM berbagi satu sesi untuk menjaga kontinuitas. Ini cocok untuk
pengaturan pengguna tunggal.

<Warning>
Jika beberapa orang dapat mengirim pesan ke agen Anda, aktifkan isolasi DM. Tanpanya, semua
pengguna berbagi konteks percakapan yang sama -- pesan pribadi Alice akan
terlihat oleh Bob.
</Warning>

**Perbaikannya:**

```json5
{
  session: {
    dmScope: "per-channel-peer", // isolate by channel + sender
  },
}
```

Opsi lainnya:

- `main` (default) -- semua DM berbagi satu sesi.
- `per-peer` -- terisolasi menurut pengirim (lintas channel).
- `per-channel-peer` -- terisolasi menurut channel + pengirim (disarankan).
- `per-account-channel-peer` -- terisolasi menurut akun + channel + pengirim.

<Tip>
Jika orang yang sama menghubungi Anda dari beberapa channel, gunakan
`session.identityLinks` untuk menautkan identitas mereka agar mereka berbagi satu sesi.
</Tip>

Verifikasi pengaturan Anda dengan `openclaw security audit`.

## Siklus hidup sesi

Sesi digunakan kembali sampai kedaluwarsa:

- **Reset harian** (default) -- sesi baru pada pukul 4:00 pagi waktu lokal di host
  gateway.
- **Reset idle** (opsional) -- sesi baru setelah periode tidak aktif. Atur
  `session.reset.idleMinutes`.
- **Reset manual** -- ketik `/new` atau `/reset` di chat. `/new <model>` juga
  mengganti model.

Saat reset harian dan idle sama-sama dikonfigurasi, yang kedaluwarsa lebih dulu yang berlaku.

## Tempat status disimpan

Semua status sesi dimiliki oleh **gateway**. Klien UI mengueri gateway untuk
data sesi.

- **Penyimpanan:** `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- **Transkrip:** `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`

## Pemeliharaan sesi

OpenClaw secara otomatis membatasi penyimpanan sesi seiring waktu. Secara default, OpenClaw berjalan
dalam mode `warn` (melaporkan apa yang akan dibersihkan). Setel `session.maintenance.mode`
ke `"enforce"` untuk pembersihan otomatis:

```json5
{
  session: {
    maintenance: {
      mode: "enforce",
      pruneAfter: "30d",
      maxEntries: 500,
    },
  },
}
```

Pratinjau dengan `openclaw sessions cleanup --dry-run`.

## Memeriksa sesi

- `openclaw status` -- path penyimpanan sesi dan aktivitas terbaru.
- `openclaw sessions --json` -- semua sesi (filter dengan `--active <minutes>`).
- `/status` di chat -- penggunaan konteks, model, dan toggle.
- `/context list` -- apa yang ada di prompt sistem.

## Bacaan lanjutan

- [Pemangkasan Sesi](/concepts/session-pruning) -- memangkas hasil tool
- [Pemadatan](/concepts/compaction) -- merangkum percakapan panjang
- [Tool Sesi](/concepts/session-tool) -- tool agen untuk pekerjaan lintas sesi
- [Pendalaman Manajemen Sesi](/reference/session-management-compaction) --
  skema penyimpanan, transkrip, kebijakan pengiriman, metadata asal, dan config lanjutan
- [Multi-Agent](/concepts/multi-agent) — perutean dan isolasi sesi lintas agen
- [Tugas Latar Belakang](/id/automation/tasks) — bagaimana pekerjaan yang dilepas membuat catatan tugas dengan referensi sesi
- [Perutean Channel](/id/channels/channel-routing) — bagaimana pesan masuk dirutekan ke sesi
