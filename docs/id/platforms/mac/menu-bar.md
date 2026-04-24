---
read_when:
    - Menyesuaikan UI menu mac atau logika status
summary: Logika status menu bar dan apa yang ditampilkan kepada pengguna
title: Menu bar
x-i18n:
    generated_at: "2026-04-24T09:17:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 89b03f3b0f9e56057d4cbf10bd1252372c65a2b2ae5e0405a844e9a59b51405d
    source_path: platforms/mac/menu-bar.md
    workflow: 15
---

# Logika Status Menu Bar

## Apa yang ditampilkan

- Kami menampilkan state pekerjaan agen saat ini di ikon menu bar dan di baris status pertama menu.
- Status kesehatan disembunyikan saat pekerjaan aktif; status itu kembali ketika semua sesi idle.
- Blok “Nodes” di menu hanya mencantumkan **perangkat** (Node yang dipasangkan melalui `node.list`), bukan entri klien/presence.
- Bagian “Usage” muncul di bawah Context ketika snapshot penggunaan provider tersedia.

## Model state

- Sesi: peristiwa datang dengan `runId` (per-eksekusi) plus `sessionKey` di payload. Sesi “main” adalah kunci `main`; jika tidak ada, kami fallback ke sesi yang terakhir diperbarui.
- Prioritas: main selalu menang. Jika main aktif, state-nya langsung ditampilkan. Jika main idle, sesi non-main yang paling baru aktif yang ditampilkan. Kami tidak bolak-balik di tengah aktivitas; kami hanya berpindah ketika sesi saat ini menjadi idle atau main menjadi aktif.
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
- `workingMain`: badge dengan glyph, tint penuh, animasi kaki “working”.
- `workingOther`: badge dengan glyph, tint redup, tanpa scurry.
- `overridden`: menggunakan glyph/tint yang dipilih tanpa memedulikan aktivitas.

## Teks baris status (menu)

- Saat pekerjaan aktif: `<Session role> · <activity label>`
  - Contoh: `Main · exec: pnpm test`, `Other · read: apps/macos/Sources/OpenClaw/AppState.swift`.
- Saat idle: fallback ke ringkasan kesehatan.

## Ingestion peristiwa

- Sumber: peristiwa `agent` pada control-channel (`ControlChannel.handleAgentEvent`).
- Field yang di-parse:
  - `stream: "job"` dengan `data.state` untuk mulai/berhenti.
  - `stream: "tool"` dengan `data.phase`, `name`, opsional `meta`/`args`.
- Label:
  - `exec`: baris pertama `args.command`.
  - `read`/`write`: path yang dipendekkan.
  - `edit`: path plus jenis perubahan yang disimpulkan dari jumlah `meta`/diff.
  - fallback: nama alat.

## Override debug

- Settings ▸ Debug ▸ pemilih “Icon override”:
  - `System (auto)` (default)
  - `Working: main` (per jenis alat)
  - `Working: other` (per jenis alat)
  - `Idle`
- Disimpan melalui `@AppStorage("iconOverride")`; dipetakan ke `IconState.overridden`.

## Daftar periksa pengujian

- Picu job sesi main: verifikasi ikon langsung beralih dan baris status menampilkan label main.
- Picu job sesi non-main saat main idle: ikon/status menampilkan non-main; tetap stabil sampai selesai.
- Mulai main saat other aktif: ikon langsung beralih ke main.
- Burst alat cepat: pastikan badge tidak berkedip (grace TTL pada hasil alat).
- Baris kesehatan muncul kembali setelah semua sesi idle.

## Terkait

- [Aplikasi macOS](/id/platforms/macos)
- [Ikon menu bar](/id/platforms/mac/icon)
