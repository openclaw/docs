---
read_when:
    - Menyesuaikan UI menu Mac atau logika status
summary: Logika status bilah menu dan hal yang ditampilkan kepada pengguna
title: Bilah menu
x-i18n:
    generated_at: "2026-07-19T05:00:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: d53cd15109864b88010f41ccf4c46ea7fff6721bc6632630d83a558084cb2d62
    source_path: platforms/mac/menu-bar.md
    workflow: 16
---

## Yang ditampilkan

- Status kerja agen saat ini ditampilkan pada ikon bilah menu dan pada baris status pertama di menu.
- Status kesehatan disembunyikan saat pekerjaan aktif; status tersebut muncul kembali setelah semua sesi menganggur.
- Item "Konteks" di tingkat akar membuka submenu berisi sesi terbaru, alih-alih memperluasnya di menu akar.
- Blok "Node" di menu akar hanya mencantumkan **perangkat** yang dipasangkan (dari `node.list`), bukan entri klien/kehadiran.
- Bagian "Penggunaan" di tingkat akar muncul di bawah Konteks saat snapshot penggunaan penyedia tersedia, diikuti oleh detail biaya jika tersedia.
- **Obrolan Cepat** membuka penyusun sesi utama mengambang; pintasan globalnya saat ini ditampilkan di samping item tersebut.

## Model status

- Sumber: `WorkActivityStore` (`apps/macos/Sources/OpenClaw/WorkActivityStore.swift`).
- Peristiwa diterima sebagai `ControlAgentEvent` dengan `runId`; penangan (`ControlChannel.routeWorkActivity`) membaca `sessionKey` dari muatan peristiwa dan menggunakan `"main"` sebagai nilai default jika tidak ada.
- Prioritas: sesi utama (`sessionKey == "main"` secara default) selalu didahulukan. Jika sesi utama aktif, statusnya langsung ditampilkan. Jika sesi utama menganggur, sesi nonutama yang terakhir aktif akan ditampilkan sebagai gantinya. Penyimpanan tidak beralih di tengah aktivitas; penyimpanan hanya beralih saat sesi saat ini menjadi menganggur atau sesi utama menjadi aktif.
- Jenis aktivitas:
  - `job`: eksekusi perintah tingkat tinggi (`state: started|streaming|done|error|...`).
  - `tool`: `phase: start|result` dengan `name`, `meta`/`args` opsional.

## Enum IconState (Swift)

- `idle`
- `workingMain(ActivityKind)`
- `workingOther(ActivityKind)`
- `overridden(ActivityKind)` (penggantian debug)

### ActivityKind -> simbol lencana

`ActivityKind` membungkus `ToolKind` (`bash`, `read`, `write`, `edit`, `attach`, `other`) atau `job` tanpa pembungkus. Masing-masing dipetakan ke lencana SF Symbol yang digambar di atas ikon makhluk (`IconState.badgeSymbolName`):

| Jenis            | Simbol                             |
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
- `workingOther`: lencana dengan simbol, rona redup (prominensi `.secondary`), tanpa gerakan bergegas.
- `overridden`: menggunakan simbol/rona yang dipilih tanpa memedulikan aktivitas sebenarnya.

## Submenu Konteks

- Menu akar menampilkan satu baris "Konteks" dengan jumlah/status sesi; baris tersebut membuka submenu (`MenuSessionsInjector`).
- Header submenu menampilkan jumlah sesi aktif selama 24 jam terakhir.
- Setiap baris sesi mempertahankan bilah token, usia, pratinjau, tombol beralih berpikir/verbose, serta tindakan atur ulang, ringkas, dan hapus.
- Pesan pemuatan, terputus, dan kesalahan pemuatan sesi ditampilkan di dalam submenu Konteks.
- Bagian penggunaan dan biaya tetap berada di tingkat akar di bawah Konteks agar dapat dilihat sekilas tanpa membuka submenu.

## Teks baris status (menu)

- Saat pekerjaan aktif: `<Session role> · <activity label>` (`"\(roleLabel) · \(activity.label)"` dalam `MenuContentView`), dengan label peran berupa `Main` atau `Other`.
- Saat menganggur: kembali ke ringkasan kesehatan.

## Penyerapan peristiwa

- Sumber: peristiwa `agent` saluran kontrol, yang dirutekan oleh `ControlChannel.routeWorkActivity(from:)`.
- Bidang yang diurai:
  - `stream: "job"` dengan `data.state` untuk mulai/berhenti.
  - `stream: "tool"` dengan `data.phase`, `data.name`, `data.meta`/`data.args` opsional.
- Label alat berasal dari `ToolDisplayRegistry.resolve(name:args:meta:)`; nama yang tidak terselesaikan kembali menggunakan nama alat mentah.

## Penggantian debug

- Pemilih Settings > Debug > "Icon override":
  - `System (auto)` (default)
  - `Working: main` / `Working: other` (per jenis alat: bash, baca, tulis, edit, lainnya)
  - `Idle`
- Disimpan di bawah kunci `openclaw.iconOverride` pada `UserDefaults`; dipetakan ke `IconState.overridden`.

## Daftar periksa pengujian

- Picu pekerjaan sesi utama: ikon langsung beralih dan baris status menampilkan label utama.
- Picu pekerjaan sesi nonutama saat sesi utama menganggur: ikon/status menampilkan sesi nonutama; tetap stabil hingga pekerjaan selesai.
- Mulai sesi utama saat sesi lain aktif: ikon langsung beralih ke sesi utama.
- Rentetan alat yang cepat: lencana tidak berkedip (jendela tenggang 2 detik sebelum menghapus alat yang telah selesai, `WorkActivityStore.toolResultGrace`).
- Baris kesehatan muncul kembali setelah semua sesi menganggur.

## Terkait

- [Aplikasi macOS](/id/platforms/macos)
- [Ikon bilah menu](/id/platforms/mac/icon)
