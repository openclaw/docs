---
read_when:
    - Menyesuaikan UI menu Mac atau logika status
summary: Logika status bilah menu dan apa yang ditampilkan kepada pengguna
title: Bilah menu
x-i18n:
    generated_at: "2026-05-01T09:26:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 340b86a2e222fb1fe7fda4f0f0434127af1393a64348ea033ea284ba52866beb
    source_path: platforms/mac/menu-bar.md
    workflow: 16
---

# Logika Status Bilah Menu

## Yang ditampilkan

- Kami menampilkan status kerja agen saat ini pada ikon bilah menu dan pada baris status pertama di menu.
- Status kesehatan disembunyikan saat pekerjaan sedang aktif; status ini kembali saat semua sesi idle.
- Submenu “Konteks” root berisi sesi terbaru alih-alih memperluasnya langsung di menu root.
- Blok “Node” di menu root hanya mencantumkan **perangkat** (node yang dipasangkan melalui `node.list`), bukan entri klien/kehadiran.
- Bagian “Penggunaan” root muncul di bawah Konteks saat snapshot penggunaan penyedia tersedia, diikuti detail biaya penggunaan jika tersedia.

## Model status

- Sesi: peristiwa datang dengan `runId` (per-run) plus `sessionKey` di payload. Sesi “utama” adalah kunci `main`; jika tidak ada, kami kembali ke sesi yang paling baru diperbarui.
- Prioritas: utama selalu menang. Jika utama aktif, statusnya langsung ditampilkan. Jika utama idle, sesi non-utama yang paling baru aktif akan ditampilkan. Kami tidak bolak-balik di tengah aktivitas; kami hanya beralih saat sesi saat ini menjadi idle atau utama menjadi aktif.
- Jenis aktivitas:
  - `job`: eksekusi perintah tingkat tinggi (`state: started|streaming|done|error`).
  - `tool`: `phase: start|result` dengan `toolName` dan `meta/args`.

## Enum IconState (Swift)

- `idle`
- `workingMain(ActivityKind)`
- `workingOther(ActivityKind)`
- `overridden(ActivityKind)` (override debug)

### ActivityKind → glif

- `exec` → 💻
- `read` → 📄
- `write` → ✍️
- `edit` → 📝
- `attach` → 📎
- default → 🛠️

### Pemetaan visual

- `idle`: makhluk normal.
- `workingMain`: badge dengan glif, tint penuh, animasi kaki “bekerja”.
- `workingOther`: badge dengan glif, tint diredam, tanpa gerakan cepat.
- `overridden`: menggunakan glif/tint yang dipilih terlepas dari aktivitas.

## Submenu Konteks

- Menu root menampilkan satu baris “Konteks” dengan jumlah/status sesi dan membuka submenu.
- Header submenu Konteks menampilkan jumlah sesi aktif selama 24 jam terakhir.
- Setiap baris sesi mempertahankan bilah token, umur, pratinjau, berpikir/verbose, reset, compact, dan tindakan hapusnya.
- Pesan pemuatan, terputus, dan kesalahan pemuatan sesi muncul di dalam submenu Konteks.
- Penggunaan penyedia dan detail biaya penggunaan tetap berada di tingkat root di bawah Konteks agar tetap dapat dilihat sekilas tanpa membuka submenu.

## Teks baris status (menu)

- Saat pekerjaan aktif: `<Session role> · <activity label>`
  - Contoh: `Main · exec: pnpm test`, `Other · read: apps/macos/Sources/OpenClaw/AppState.swift`.
- Saat idle: kembali ke ringkasan kesehatan.

## Ingesti peristiwa

- Sumber: peristiwa `agent` control-channel (`ControlChannel.handleAgentEvent`).
- Bidang yang diurai:
  - `stream: "job"` dengan `data.state` untuk mulai/berhenti.
  - `stream: "tool"` dengan `data.phase`, `name`, opsional `meta`/`args`.
- Label:
  - `exec`: baris pertama dari `args.command`.
  - `read`/`write`: jalur yang dipersingkat.
  - `edit`: jalur plus jenis perubahan yang disimpulkan dari jumlah `meta`/diff.
  - fallback: nama alat.

## Override debug

- Pengaturan ▸ Debug ▸ pemilih “Override ikon”:
  - `System (auto)` (default)
  - `Working: main` (per jenis alat)
  - `Working: other` (per jenis alat)
  - `Idle`
- Disimpan melalui `@AppStorage("iconOverride")`; dipetakan ke `IconState.overridden`.

## Checklist pengujian

- Picu job sesi utama: verifikasi ikon langsung beralih dan baris status menampilkan label utama.
- Picu job sesi non-utama saat utama idle: ikon/status menampilkan non-utama; tetap stabil hingga selesai.
- Mulai utama saat yang lain aktif: ikon langsung beralih ke utama.
- Burst alat cepat: pastikan badge tidak berkedip (tenggang TTL pada hasil alat).
- Baris kesehatan muncul kembali setelah semua sesi idle.

## Terkait

- [aplikasi macOS](/id/platforms/macos)
- [Ikon bilah menu](/id/platforms/mac/icon)
