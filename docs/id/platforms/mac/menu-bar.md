---
read_when:
    - Menyesuaikan UI menu Mac atau logika status
summary: Logika status bilah menu dan informasi yang ditampilkan kepada pengguna
title: Bilah menu
x-i18n:
    generated_at: "2026-07-12T14:23:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 480a85f383a6495c0e45850a322c0c67c4cc35e21d2d29b4bd86f42fdbf9430a
    source_path: platforms/mac/menu-bar.md
    workflow: 16
---

## Yang ditampilkan

- Status kerja agen saat ini ditampilkan pada ikon bilah menu dan pada baris status pertama di menu.
- Status kesehatan disembunyikan saat pekerjaan aktif; status tersebut kembali setelah semua sesi tidak aktif.
- Item "Konteks" di tingkat akar membuka submenu berisi sesi terbaru, alih-alih memperluasnya di menu akar.
- Blok "Node" di menu akar hanya mencantumkan **perangkat** yang dipasangkan (dari `node.list`), bukan entri klien/kehadiran.
- Bagian "Penggunaan" di tingkat akar muncul di bawah Konteks ketika snapshot penggunaan penyedia tersedia, diikuti detail biaya jika tersedia.

## Model status

- Sumber: `WorkActivityStore` (`apps/macos/Sources/OpenClaw/WorkActivityStore.swift`).
- Peristiwa diterima sebagai `ControlAgentEvent` dengan `runId`; penangan (`ControlChannel.routeWorkActivity`) membaca `sessionKey` dari payload peristiwa dan menggunakan `"main"` sebagai nilai default jika tidak ada.
- Prioritas: sesi utama (`sessionKey == "main"` secara default) selalu diutamakan. Jika sesi utama aktif, statusnya langsung ditampilkan. Jika sesi utama tidak aktif, sesi nonutama yang paling baru aktif akan ditampilkan sebagai gantinya. Penyimpanan tidak berganti di tengah aktivitas; pergantian hanya terjadi ketika sesi saat ini menjadi tidak aktif atau sesi utama menjadi aktif.
- Jenis aktivitas:
  - `job`: eksekusi perintah tingkat tinggi (`state: started|streaming|done|error|...`).
  - `tool`: `phase: start|result` dengan `name`, serta `meta`/`args` opsional.

## Enum IconState (Swift)

- `idle`
- `workingMain(ActivityKind)`
- `workingOther(ActivityKind)`
- `overridden(ActivityKind)` (penggantian untuk debug)

### ActivityKind -> simbol lencana

`ActivityKind` membungkus `ToolKind` (`bash`, `read`, `write`, `edit`, `attach`, `other`) atau `job` mandiri. Masing-masing dipetakan ke lencana SF Symbol yang digambar di atas ikon makhluk (`IconState.badgeSymbolName`):

| Jenis           | Simbol                             |
| --------------- | ---------------------------------- |
| `bash`          | `chevron.left.slash.chevron.right` |
| `read`          | `doc`                              |
| `write`         | `pencil`                           |
| `edit`          | `pencil.tip`                       |
| `attach`        | `paperclip`                        |
| `other` / `job` | `gearshape.fill`                   |

### Pemetaan visual

- `idle`: makhluk normal, tanpa lencana.
- `workingMain`: lencana dengan simbol, rona penuh (prominensi `.primary`), animasi kaki "bekerja".
- `workingOther`: lencana dengan simbol, rona redup (prominensi `.secondary`), tanpa gerakan berlari.
- `overridden`: menggunakan simbol/rona yang dipilih tanpa memperhatikan aktivitas sebenarnya.

## Submenu konteks

- Menu utama menampilkan satu baris "Konteks" dengan jumlah/status sesi; baris tersebut membuka submenu (`MenuSessionsInjector`).
- Header submenu menampilkan jumlah sesi aktif selama 24 jam terakhir.
- Setiap baris sesi tetap memiliki bilah token, usia, pratinjau, pengalih mode berpikir/verbose, serta tindakan atur ulang, padatkan, dan hapus.
- Pesan pemuatan, terputus, dan kesalahan pemuatan sesi ditampilkan di dalam submenu Konteks.
- Bagian penggunaan dan biaya tetap berada di tingkat utama di bawah Konteks agar dapat dilihat sekilas tanpa membuka submenu.

## Teks baris status (menu)

- Saat pekerjaan aktif: `<Session role> · <activity label>` (`"\(roleLabel) · \(activity.label)"` di `MenuContentView`), dengan label peran berupa `Main` atau `Other`.
- Saat tidak aktif: kembali ke ringkasan kesehatan.

## Penyerapan peristiwa

- Sumber: peristiwa `agent` dari saluran kontrol, dirutekan oleh `ControlChannel.routeWorkActivity(from:)`.
- Kolom yang diurai:
  - `stream: "job"` dengan `data.state` untuk mulai/berhenti.
  - `stream: "tool"` dengan `data.phase`, `data.name`, serta `data.meta`/`data.args` opsional.
- Label alat berasal dari `ToolDisplayRegistry.resolve(name:args:meta:)`; nama yang tidak dapat diselesaikan menggunakan nama alat mentah sebagai alternatif.

## Penggantian debug

- Pemilih Settings > Debug > "Icon override":
  - `System (auto)` (bawaan)
  - `Working: main` / `Working: other` (per jenis alat: bash, baca, tulis, edit, lainnya)
  - `Idle`
- Disimpan dengan kunci `UserDefaults` `openclaw.iconOverride`; dipetakan ke `IconState.overridden`.

## Daftar periksa pengujian

- Picu tugas sesi utama: ikon langsung berubah dan baris status menampilkan label utama.
- Picu tugas sesi non-utama saat sesi utama tidak aktif: ikon/status menampilkan sesi non-utama; tetap stabil hingga tugas selesai.
- Mulai sesi utama saat sesi lain aktif: ikon langsung beralih ke sesi utama.
- Rentetan alat yang cepat: lencana tidak berkedip (masa tenggang 2 detik sebelum menghapus alat yang telah selesai, `WorkActivityStore.toolResultGrace`).
- Baris kesehatan muncul kembali setelah semua sesi tidak aktif.

## Terkait

- [Aplikasi macOS](/id/platforms/macos)
- [Ikon bilah menu](/id/platforms/mac/icon)
