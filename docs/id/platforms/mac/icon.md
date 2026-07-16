---
read_when:
    - Mengubah perilaku ikon bilah menu
summary: Status ikon dan animasi bilah menu untuk OpenClaw di macOS
title: Ikon bilah menu
x-i18n:
    generated_at: "2026-07-16T18:17:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8a38f1253f0c376ef2ce6c0ae339b67084c472c764964bcc7ad21e10133e2b47
    source_path: platforms/mac/icon.md
    workflow: 16
---

# Status Ikon Bilah Menu

Cakupan: aplikasi macOS (`apps/macos`). Rendering: `CritterIconRenderer.makeIcon(...)`. Pengaitan animasi/status: `CritterStatusLabel` + `CritterStatusLabel+Behavior.swift`.

## Status

| Status                | Pemicu                                    | Visual                                                                                              |
| --------------------- | ----------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Diam                  | Bawaan                                    | Animasi kedip/goyang normal; mata terbuka tetap memiliki kilau mengilap                            |
| Dijeda                | `isPaused=true`                           | Antena terkulai ("tidak bertugas") dengan mata terbuka; tanpa gerakan                               |
| Tidur                 | Gateway terputus/tidak dikonfigurasi      | Antena terkulai dan mata menutup menjadi kelopak `⌣ ⌣`; tanpa gerakan                  |
| Merayakan             | Pesan terkirim (`sendCelebrationTick`)      | Mata menampilkan sekilas lengkungan `∩ ∩` yang gembira selama ~0.9s disertai tendangan kaki |
| Bangun suara (telinga besar) | Kata pemicu terdengar              | Antena menegak dan menjadi lebih tinggi (`earScale=1.9`); turun setelah hening                  |
| Bekerja               | `isWorking=true` atau `IconState` aktif | Goyangan kaki lebih cepat (`legWiggle` hingga `1.0`) ditambah sedikit pergeseran horizontal; ditambahkan ke goyangan saat diam |

Lencana aktivitas alat (kepingan SF Symbol, misalnya `chevron.left.slash.chevron.right` untuk eksekusi) dapat dirender di atas ikon makhluk yang sama ketika suatu sesi memiliki pekerjaan atau alat aktif. Lencana tersebut berasal dari `IconState`/`ActivityKind`; lihat [Bilah menu](/id/platforms/mac/menu-bar) untuk model status lengkap.

## Telinga bangun suara

- Pemicu: `AppStateStore.shared.triggerVoiceEars(ttl: nil)`, dipanggil dari alur pengambilan bangun suara (`VoiceWakeRuntime`) dan dari perangkat debug/pengujian bangun suara (`VoiceWakeTester`, `VoiceWakeOverlayController`).
- Berhenti: `stopVoiceEars()`, dipanggil saat pengambilan diselesaikan.
- Jendela hening sebelum penyelesaian: biasanya `2.0s`, atau `5.0s` jika hanya kata pemicu yang terdengar dan tidak ada ucapan lanjutan (`VoiceWakeRuntime.silenceWindow` / `triggerOnlySilenceWindow`).
- Saat ditingkatkan, pengatur waktu kedip/goyang/kaki/telinga saat diam ditangguhkan (`earBoostActive` mengatur tugas animasi di `CritterStatusLabel+Behavior`).

## Bentuk dan ukuran

- Kanvas: gambar templat 18x18pt, dirender ke penyimpanan pendukung bitmap 36x36px (2x) agar ikon tetap tajam di Retina.
- Skala telinga secara bawaan adalah `1.0`; peningkatan suara menetapkan `earScale=1.9` tanpa mengubah bingkai keseluruhan.
- `antennaDroop` (0-1) melipat antena ke bawah untuk pose dijeda dan tidur.
- Gerakan cepat kaki menggunakan `legWiggle` hingga `1.0` dengan sedikit goyangan horizontal.

## Catatan perilaku

- Tidak ada pengalih CLI/broker eksternal untuk telinga atau status bekerja; keduanya dikendalikan secara internal oleh sinyal aplikasi (`AppState.setWorking`, `AppState.triggerVoiceEars`) guna menghindari gerakan naik-turun yang tidak disengaja.
- Pertahankan TTL baru tetap singkat (jauh di bawah 10s) agar ikon cepat kembali ke kondisi dasar jika suatu pekerjaan macet.

## Terkait

- [Bilah menu](/id/platforms/mac/menu-bar)
- [Aplikasi macOS](/id/platforms/macos)
