---
read_when:
    - Mengubah perilaku ikon bilah menu
summary: Status dan animasi ikon bilah menu untuk OpenClaw di macOS
title: Ikon bilah menu
x-i18n:
    generated_at: "2026-04-24T09:17:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6900d702358afcf0481f713ea334236e1abf973d0eeff60eaf0afcf88f9327b2
    source_path: platforms/mac/icon.md
    workflow: 15
---

# Status Ikon Bilah Menu

Penulis: steipete · Diperbarui: 2025-12-06 · Cakupan: aplikasi macOS (`apps/macos`)

- **Idle:** Animasi ikon normal (berkedip, sesekali bergoyang).
- **Paused:** Item status menggunakan `appearsDisabled`; tanpa gerakan.
- **Pemicu suara (telinga besar):** Detektor voice wake memanggil `AppState.triggerVoiceEars(ttl: nil)` saat kata pemicu terdengar, menjaga `earBoostActive=true` selama ujaran ditangkap. Telinga membesar (1.9x), mendapatkan lubang telinga melingkar untuk keterbacaan, lalu turun melalui `stopVoiceEars()` setelah 1 detik tanpa suara. Hanya dipicu dari pipeline suara dalam aplikasi.
- **Working (agen sedang berjalan):** `AppState.isWorking=true` menggerakkan mikro-gerakan “ekor/kaki berlari kecil”: goyangan kaki lebih cepat dan sedikit offset saat pekerjaan sedang berlangsung. Saat ini ditoggle di sekitar run agen WebChat; tambahkan toggle yang sama di sekitar tugas panjang lainnya saat Anda menghubungkannya.

Titik wiring

- Voice wake: runtime/tester memanggil `AppState.triggerVoiceEars(ttl: nil)` saat terpicu dan `stopVoiceEars()` setelah 1 detik tanpa suara agar sesuai dengan jendela penangkapan.
- Aktivitas agen: atur `AppStateStore.shared.setWorking(true/false)` di sekitar rentang kerja (sudah dilakukan di pemanggilan agen WebChat). Jaga rentangnya tetap singkat dan reset di blok `defer` untuk menghindari animasi yang macet.

Bentuk & ukuran

- Ikon dasar digambar di `CritterIconRenderer.makeIcon(blink:legWiggle:earWiggle:earScale:earHoles:)`.
- Skala telinga default adalah `1.0`; boost suara mengatur `earScale=1.9` dan men-toggle `earHoles=true` tanpa mengubah frame keseluruhan (gambar template 18×18 pt yang dirender ke backing store Retina 36×36 px).
- Scurry menggunakan goyangan kaki hingga ~1.0 dengan goyangan horizontal kecil; ini bersifat aditif terhadap goyangan idle yang sudah ada.

Catatan perilaku

- Tidak ada toggle CLI/broker eksternal untuk telinga/working; pertahankan ini tetap internal pada sinyal aplikasi itu sendiri untuk menghindari flapping yang tidak disengaja.
- Jaga TTL tetap singkat (&lt;10s) agar ikon cepat kembali ke baseline jika suatu pekerjaan macet.

## Terkait

- [Bilah menu](/id/platforms/mac/menu-bar)
- [Aplikasi macOS](/id/platforms/macos)
