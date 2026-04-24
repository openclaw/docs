---
read_when:
    - Anda ingin memahami perutean dan isolasi sesi
    - Anda ingin mengonfigurasi cakupan DM untuk penyiapan multi-pengguna
summary: Cara OpenClaw mengelola sesi percakapan
title: Pengelolaan sesi
x-i18n:
    generated_at: "2026-04-24T09:05:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: cafff1fd480bdd306f87c818e7cb66bda8440d643fbe9ce5e14b773630b35d37
    source_path: concepts/session.md
    workflow: 15
---

OpenClaw mengatur percakapan ke dalam **sesi**. Setiap pesan diarahkan ke sebuah
sesi berdasarkan asalnya -- DM, chat grup, Cron job, dan sebagainya.

## Cara pesan diarahkan

| Sumber          | Perilaku                    |
| --------------- | --------------------------- |
| Pesan langsung  | Sesi bersama secara default |
| Chat grup       | Diisolasi per grup          |
| Room/channel    | Diisolasi per room          |
| Cron job        | Sesi baru setiap run        |
| Webhook         | Diisolasi per hook          |

## Isolasi DM

Secara default, semua DM berbagi satu sesi untuk kontinuitas. Ini cocok untuk
penyiapan pengguna tunggal.

<Warning>
Jika beberapa orang dapat mengirim pesan ke agen Anda, aktifkan isolasi DM. Tanpanya, semua
pengguna berbagi konteks percakapan yang sama -- pesan pribadi Alice akan terlihat oleh Bob.
</Warning>

**Solusinya:**

```json5
{
  session: {
    dmScope: "per-channel-peer", // isolasi berdasarkan channel + pengirim
  },
}
```

Opsi lainnya:

- `main` (default) -- semua DM berbagi satu sesi.
- `per-peer` -- isolasi berdasarkan pengirim (lintas channel).
- `per-channel-peer` -- isolasi berdasarkan channel + pengirim (disarankan).
- `per-account-channel-peer` -- isolasi berdasarkan akun + channel + pengirim.

<Tip>
Jika orang yang sama menghubungi Anda dari beberapa channel, gunakan
`session.identityLinks` untuk menautkan identitas mereka agar mereka berbagi satu sesi.
</Tip>

Verifikasi penyiapan Anda dengan `openclaw security audit`.

## Siklus hidup sesi

Sesi digunakan kembali sampai kedaluwarsa:

- **Reset harian** (default) -- sesi baru pada pukul 4:00 pagi waktu lokal di host
  gateway.
- **Reset idle** (opsional) -- sesi baru setelah periode tidak aktif. Atur
  `session.reset.idleMinutes`.
- **Reset manual** -- ketik `/new` atau `/reset` di chat. `/new <model>` juga
  mengganti model.

Saat reset harian dan idle sama-sama dikonfigurasi, yang kedaluwarsa lebih dulu yang berlaku.

Sesi dengan sesi CLI milik provider yang aktif tidak dipotong oleh default
harian implisit. Gunakan `/reset` atau konfigurasikan `session.reset` secara eksplisit saat sesi tersebut harus kedaluwarsa berdasarkan timer.

## Tempat status disimpan

Semua status sesi dimiliki oleh **gateway**. Klien UI mengueri gateway untuk
data sesi.

- **Penyimpanan:** `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- **Transkrip:** `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`

## Pemeliharaan sesi

OpenClaw secara otomatis membatasi penyimpanan sesi seiring waktu. Secara default, OpenClaw berjalan
dalam mode `warn` (melaporkan apa yang akan dibersihkan). Atur `session.maintenance.mode`
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

- [Session Pruning](/id/concepts/session-pruning) -- memangkas hasil alat
- [Compaction](/id/concepts/compaction) -- merangkum percakapan panjang
- [Session Tools](/id/concepts/session-tool) -- alat agen untuk pekerjaan lintas sesi
- [Pendalaman Pengelolaan Sesi](/id/reference/session-management-compaction) --
  skema penyimpanan, transkrip, kebijakan pengiriman, metadata asal, dan config lanjutan
- [Multi-Agent](/id/concepts/multi-agent) — perutean dan isolasi sesi lintas agen
- [Tugas Latar Belakang](/id/automation/tasks) — cara pekerjaan yang dilepas membuat catatan tugas dengan referensi sesi
- [Perutean Channel](/id/channels/channel-routing) — cara pesan masuk diarahkan ke sesi

## Terkait

- [Session pruning](/id/concepts/session-pruning)
- [Session tools](/id/concepts/session-tool)
- [Command queue](/id/concepts/queue)
