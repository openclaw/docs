---
read_when:
    - Menyesuaikan UI menu Mac atau logika status
summary: Logika status bilah menu dan apa yang ditampilkan kepada pengguna
title: Bilah menu
x-i18n:
    generated_at: "2026-05-06T09:20:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: c569ced20b2f6a639d52d373cc8b55a42d7c015a0b234d5154ce67ac03c2eaf6
    source_path: platforms/mac/menu-bar.md
    workflow: 16
---

## Yang ditampilkan

- Kami menampilkan status kerja agent saat ini di ikon bilah menu dan di baris status pertama pada menu.
- Status kesehatan disembunyikan saat pekerjaan aktif; status tersebut kembali saat semua sesi menganggur.
- Submenu "Konteks" root berisi sesi terbaru alih-alih memperluasnya langsung di menu root.
- Blok "Node" di menu root hanya mencantumkan **perangkat** (node yang dipasangkan melalui `node.list`), bukan entri klien/kehadiran.
- Bagian "Penggunaan" root muncul di bawah Konteks saat snapshot penggunaan provider tersedia, diikuti detail biaya penggunaan saat tersedia.

## Model status

- Sesi: event datang dengan `runId` (per-run) ditambah `sessionKey` di payload. Sesi "utama" adalah key `main`; jika tidak ada, kami fallback ke sesi yang paling baru diperbarui.
- Prioritas: utama selalu menang. Jika utama aktif, statusnya langsung ditampilkan. Jika utama menganggur, sesi non-utama yang paling baru aktif akan ditampilkan. Kami tidak bolak-balik di tengah aktivitas; kami hanya beralih saat sesi saat ini menjadi menganggur atau utama menjadi aktif.
- Jenis aktivitas:
  - `job`: eksekusi perintah tingkat tinggi (`state: started|streaming|done|error`).
  - `tool`: `phase: start|result` dengan `toolName` dan `meta/args`.

## Enum IconState (Swift)

- `idle`
- `workingMain(ActivityKind)`
- `workingOther(ActivityKind)`
- `overridden(ActivityKind)` (override debug)

### ActivityKind → glyph

- `exec` → 💻
- `read` → 📄
- `write` → ✍️
- `edit` → 📝
- `attach` → 📎
- default → 🛠️

### Pemetaan visual

- `idle`: critter normal.
- `workingMain`: badge dengan glyph, tint penuh, animasi kaki "working".
- `workingOther`: badge dengan glyph, tint redup, tanpa scurry.
- `overridden`: menggunakan glyph/tint yang dipilih terlepas dari aktivitas.

## Submenu Konteks

- Menu root menampilkan satu baris "Konteks" dengan jumlah/status sesi dan membuka submenu.
- Header submenu Konteks menampilkan jumlah sesi aktif selama 24 jam terakhir.
- Setiap baris sesi mempertahankan bilah token, usia, pratinjau, thinking/verbose, reset, compact, dan aksi hapusnya.
- Pesan pemuatan, terputus, dan error pemuatan sesi muncul di dalam submenu Konteks.
- Detail penggunaan provider dan biaya penggunaan tetap berada di level root di bawah Konteks agar tetap bisa dilihat sekilas tanpa membuka submenu.

## Teks baris status (menu)

- Saat pekerjaan aktif: `<Session role> · <activity label>`
  - Contoh: `Main · exec: pnpm test`, `Other · read: apps/macos/Sources/OpenClaw/AppState.swift`.
- Saat menganggur: fallback ke ringkasan kesehatan.

## Ingesti event

- Sumber: event `agent` control-channel (`ControlChannel.handleAgentEvent`).
- Field yang di-parse:
  - `stream: "job"` dengan `data.state` untuk mulai/berhenti.
  - `stream: "tool"` dengan `data.phase`, `name`, `meta`/`args` opsional.
- Label:
  - `exec`: baris pertama dari `args.command`.
  - `read`/`write`: path yang dipersingkat.
  - `edit`: path ditambah jenis perubahan yang diinferensikan dari jumlah `meta`/diff.
  - fallback: nama tool.

## Override debug

- Settings ▸ Debug ▸ pemilih "Override ikon":
  - `System (auto)` (default)
  - `Working: main` (per jenis tool)
  - `Working: other` (per jenis tool)
  - `Idle`
- Disimpan melalui `@AppStorage("iconOverride")`; dipetakan ke `IconState.overridden`.

## Checklist pengujian

- Picu job sesi utama: verifikasi ikon langsung beralih dan baris status menampilkan label utama.
- Picu job sesi non-utama saat utama menganggur: ikon/status menampilkan non-utama; tetap stabil hingga selesai.
- Mulai utama saat yang lain aktif: ikon langsung beralih ke utama.
- Burst tool cepat: pastikan badge tidak berkedip (grace TTL pada hasil tool).
- Baris kesehatan muncul kembali setelah semua sesi menganggur.

## Terkait

- [Aplikasi macOS](/id/platforms/macos)
- [Ikon bilah menu](/id/platforms/mac/icon)
