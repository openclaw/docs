---
read_when:
    - Mengubah perilaku ikon bilah menu
summary: Status dan animasi ikon bilah menu untuk OpenClaw di macOS
title: Ikon Bilah Menu
x-i18n:
    generated_at: "2026-04-05T14:00:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: a67a6e6bbdc2b611ba365d3be3dd83f9e24025d02366bc35ffcce9f0b121872b
    source_path: platforms/mac/icon.md
    workflow: 15
---

# Status Ikon Bilah Menu

Penulis: steipete · Diperbarui: 2025-12-06 · Cakupan: aplikasi macOS (`apps/macos`)

- **Idle:** Animasi ikon normal (berkedip, sesekali bergoyang).
- **Paused:** Item status menggunakan `appearsDisabled`; tidak ada gerakan.
- **Pemicu suara (telinga besar):** Detektor voice wake memanggil `AppState.triggerVoiceEars(ttl: nil)` saat wake word terdengar, menjaga `earBoostActive=true` selama ujaran ditangkap. Telinga membesar (1.9x), mendapatkan lubang telinga melingkar agar mudah dibaca, lalu turun melalui `stopVoiceEars()` setelah 1 detik hening. Hanya dipicu dari pipeline suara dalam aplikasi.
- **Working (agent berjalan):** `AppState.isWorking=true` menggerakkan gerakan mikro “ekor/kaki berlarian”: goyangan kaki lebih cepat dan sedikit offset selama pekerjaan masih berlangsung. Saat ini diaktifkan di sekitar proses agent WebChat; tambahkan toggle yang sama di sekitar tugas panjang lainnya saat Anda menghubungkannya.

Titik pengkabelan

- Voice wake: runtime/tester memanggil `AppState.triggerVoiceEars(ttl: nil)` saat terpicu dan `stopVoiceEars()` setelah 1 detik hening agar sesuai dengan jendela penangkapan.
- Aktivitas agent: setel `AppStateStore.shared.setWorking(true/false)` di sekitar rentang kerja (sudah dilakukan di pemanggilan agent WebChat). Jaga rentangnya tetap singkat dan reset di blok `defer` agar animasi tidak macet.

Bentuk & ukuran

- Ikon dasar digambar di `CritterIconRenderer.makeIcon(blink:legWiggle:earWiggle:earScale:earHoles:)`.
- Skala telinga default adalah `1.0`; boost suara menetapkan `earScale=1.9` dan mengaktifkan `earHoles=true` tanpa mengubah frame keseluruhan (gambar template 18×18 pt yang dirender ke backing store Retina 36×36 px).
- Scurry menggunakan goyangan kaki hingga ~1.0 dengan sedikit goyangan horizontal; ini bersifat aditif terhadap goyangan idle yang sudah ada.

Catatan perilaku

- Tidak ada toggle CLI/broker eksternal untuk telinga/working; pertahankan ini tetap internal pada sinyal milik aplikasi sendiri untuk menghindari perubahan yang tidak disengaja.
- Jaga TTL tetap singkat (&lt;10 detik) agar ikon cepat kembali ke kondisi dasar jika suatu pekerjaan macet.
