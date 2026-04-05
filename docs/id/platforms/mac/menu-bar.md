---
read_when:
    - Menyesuaikan UI menu Mac atau logika status
summary: Logika status bilah menu dan apa yang ditampilkan kepada pengguna
title: Bilah Menu
x-i18n:
    generated_at: "2026-04-05T14:00:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8eb73c0e671a76aae4ebb653c65147610bf3e6d3c9c0943d150e292e7761d16d
    source_path: platforms/mac/menu-bar.md
    workflow: 15
---

# Logika Status Bilah Menu

## Apa yang ditampilkan

- Kami menampilkan status pekerjaan agen saat ini pada ikon bilah menu dan pada baris status pertama di menu.
- Status kesehatan disembunyikan saat pekerjaan aktif; status itu kembali saat semua sesi idle.
- Blok “Nodes” di menu hanya mencantumkan **perangkat** (node yang dipasangkan melalui `node.list`), bukan entri client/presence.
- Bagian “Usage” muncul di bawah Context saat snapshot penggunaan provider tersedia.

## Model state

- Sesi: event tiba dengan `runId` (per-eksekusi) ditambah `sessionKey` di payload. Sesi “main” adalah kunci `main`; jika tidak ada, kami fallback ke sesi yang terakhir diperbarui.
- Prioritas: main selalu menang. Jika main aktif, state-nya langsung ditampilkan. Jika main idle, sesi non‑main yang paling baru aktif akan ditampilkan. Kami tidak bolak-balik di tengah aktivitas; kami hanya berpindah saat sesi saat ini menjadi idle atau main menjadi aktif.
- Jenis aktivitas:
  - `job`: eksekusi perintah tingkat tinggi (`state: started|streaming|done|error`).
  - `tool`: `phase: start|result` dengan `toolName` dan `meta/args`.

## Enum `IconState` (Swift)

- `idle`
- `workingMain(ActivityKind)`
- `workingOther(ActivityKind)`
- `overridden(ActivityKind)` (override debug)

### `ActivityKind` → glyph

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
- `overridden`: menggunakan glyph/tint yang dipilih terlepas dari aktivitas.

## Teks baris status (menu)

- Saat pekerjaan aktif: `<Session role> · <activity label>`
  - Contoh: `Main · exec: pnpm test`, `Other · read: apps/macos/Sources/OpenClaw/AppState.swift`.
- Saat idle: fallback ke ringkasan kesehatan.

## Ingest event

- Sumber: event `agent` control-channel (`ControlChannel.handleAgentEvent`).
- Field yang di-parse:
  - `stream: "job"` dengan `data.state` untuk mulai/berhenti.
  - `stream: "tool"` dengan `data.phase`, `name`, `meta`/`args` opsional.
- Label:
  - `exec`: baris pertama `args.command`.
  - `read`/`write`: path yang dipendekkan.
  - `edit`: path plus jenis perubahan yang disimpulkan dari `meta`/jumlah diff.
  - fallback: nama tool.

## Override debug

- Settings ▸ Debug ▸ pemilih “Icon override”:
  - `System (auto)` (default)
  - `Working: main` (per jenis tool)
  - `Working: other` (per jenis tool)
  - `Idle`
- Disimpan melalui `@AppStorage("iconOverride")`; dipetakan ke `IconState.overridden`.

## Daftar periksa pengujian

- Picu job sesi main: verifikasi ikon langsung berpindah dan baris status menampilkan label main.
- Picu job sesi non‑main saat main idle: ikon/status menampilkan non‑main; tetap stabil sampai selesai.
- Mulai main saat yang lain aktif: ikon langsung beralih ke main.
- Ledakan tool cepat: pastikan badge tidak berkedip (masa tenggang TTL pada hasil tool).
- Baris kesehatan muncul kembali setelah semua sesi idle.
