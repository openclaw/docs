---
read_when:
    - Mengubah perilaku ikon bilah menu
summary: Status dan animasi ikon bilah menu untuk OpenClaw di macOS
title: Ikon bilah menu
x-i18n:
    generated_at: "2026-05-06T09:20:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5497927721ff7486e9585a8a3edc2d5140408b2b0707acdcef2388e87bca20ec
    source_path: platforms/mac/icon.md
    workflow: 16
    postprocess_version: locale-links-v1
---

# Status Ikon Bilah Menu

Penulis: steipete · Diperbarui: 2025-12-06 · Cakupan: aplikasi macOS (`apps/macos`)

- **Diam:** Animasi ikon normal (berkedip, sesekali bergoyang).
- **Dijeda:** Item status menggunakan `appearsDisabled`; tidak ada gerakan.
- **Pemicu suara (telinga besar):** Pendeteksi bangun suara memanggil `AppState.triggerVoiceEars(ttl: nil)` ketika kata bangun terdengar, mempertahankan `earBoostActive=true` saat ucapan ditangkap. Telinga membesar (1.9x), mendapatkan lubang telinga bundar agar lebih mudah dibaca, lalu turun melalui `stopVoiceEars()` setelah 1 dtk hening. Hanya dipicu dari pipeline suara di dalam aplikasi.
- **Bekerja (agen berjalan):** `AppState.isWorking=true` menjalankan mikrogerakan "ekor/kaki berlari kecil": goyangan kaki lebih cepat dan sedikit offset saat pekerjaan sedang berlangsung. Saat ini diaktifkan/dinonaktifkan di sekitar eksekusi agen WebChat; tambahkan toggle yang sama di sekitar tugas panjang lainnya saat Anda menghubungkannya.

Titik integrasi

- Bangun suara: panggilan runtime/tester `AppState.triggerVoiceEars(ttl: nil)` saat pemicu dan `stopVoiceEars()` setelah 1 dtk hening agar cocok dengan jendela tangkapan.
- Aktivitas agen: tetapkan `AppStateStore.shared.setWorking(true/false)` di sekitar rentang pekerjaan (sudah dilakukan dalam panggilan agen WebChat). Pertahankan rentang tetap pendek dan reset dalam blok `defer` untuk menghindari animasi yang macet.

Bentuk & ukuran

- Ikon dasar digambar di `CritterIconRenderer.makeIcon(blink:legWiggle:earWiggle:earScale:earHoles:)`.
- Skala telinga default ke `1.0`; boost suara menetapkan `earScale=1.9` dan mengaktifkan `earHoles=true` tanpa mengubah frame keseluruhan (gambar templat 18×18 pt dirender ke backing store Retina 36×36 px).
- Lari kecil menggunakan goyangan kaki hingga ~1.0 dengan goyangan horizontal kecil; ini ditambahkan ke goyangan diam yang sudah ada.

Catatan perilaku

- Tidak ada toggle CLI/broker eksternal untuk telinga/bekerja; pertahankan tetap internal pada sinyal aplikasi sendiri untuk menghindari perubahan status yang tidak disengaja.
- Pertahankan TTL pendek (&lt;10 dtk) agar ikon kembali ke baseline dengan cepat jika pekerjaan macet.

## Terkait

- [Bilah menu](/id/platforms/mac/menu-bar)
- [aplikasi macOS](/id/platforms/macos)
