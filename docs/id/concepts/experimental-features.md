---
read_when:
    - Anda melihat kunci konfigurasi `.experimental` dan ingin mengetahui apakah kunci tersebut stabil
    - Anda ingin mencoba fitur runtime pratinjau tanpa menyamakannya dengan default normal
    - Anda menginginkan satu tempat untuk menemukan flag eksperimental yang saat ini didokumentasikan
summary: Arti flag eksperimental di OpenClaw dan flag mana yang saat ini didokumentasikan
title: Fitur eksperimental
x-i18n:
    generated_at: "2026-07-21T12:43:00Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: ba3a3e13b308c572b02076e131143845d4ad4c2a28847aabec1496012e29a6f7
    source_path: concepts/experimental-features.md
    workflow: 16
---

Fitur eksperimental adalah permukaan pratinjau di balik flag eksplisit. Fitur tersebut memerlukan lebih banyak penggunaan di dunia nyata sebelum mendapatkan nilai default yang stabil atau kontrak jangka panjang.

- Dinonaktifkan secara default kecuali dokumentasi menjelaskan aturan penyiapan otomatis yang terbatas.
- Bentuk dan perilakunya dapat berubah lebih cepat daripada konfigurasi stabil.
- Utamakan jalur stabil jika sudah tersedia.
- Terapkan secara luas hanya setelah mengujinya terlebih dahulu di lingkungan yang lebih kecil.

## Flag yang saat ini didokumentasikan

| Permukaan               | Kunci                                                                                      | Gunakan ketika                                                                                                                       | Selengkapnya                                                                                  |
| ------------------------ | ------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Runtime model lokal      | `agents.defaults.experimental.localModelLean`, `agents.list[].experimental.localModelLean` | Backend lokal yang lebih kecil atau lebih ketat tidak mampu menangani seluruh permukaan alat default OpenClaw                       | [Model Lokal](/id/gateway/local-models)                                                          |
| Pencarian memori         | `agents.defaults.memorySearch.experimental.sessionMemory`                                  | Anda ingin `memory_search` mengindeks transkrip sesi sebelumnya dan bersedia menanggung biaya penyimpanan/pengindeksan tambahan | [Referensi konfigurasi memori](/id/reference/memory-config#session-memory-search-experimental)   |
| Harness Codex            | `plugins.entries.codex.config.appServer.experimental.sandboxExecServer`                    | Anda ingin app-server Codex native 0.132.0 atau yang lebih baru menargetkan exec-server OpenClaw yang didukung sandbox alih-alih menonaktifkan Mode Kode | [Referensi harness Codex](/id/plugins/codex-harness-reference#sandboxed-native-execution)        |
| Alat perencanaan terstruktur | `tools.experimental.planTool`                                                              | Anda ingin alat `update_plan` terstruktur tersedia untuk pelacakan pekerjaan bertahap dalam runtime dan UI yang kompatibel    | [Referensi konfigurasi Gateway](/id/gateway/config-tools#toolsexperimental)                      |
| Mode Kode                | `tools.codeMode.enabled`                                                                   | Anda ingin akses ringkas yang diorkestrasi kode ke katalog alat OpenClaw tersembunyi                                               | [Mode Kode](/id/tools/code-mode)                                                                 |
| Swarm                    | `tools.swarm.enabled`                                                                      | Anda ingin skrip Mode Kode mengorkestrasi kelompok subagen terbatas secara paralel                                                | [Swarm](/id/tools/swarm)                                                                         |

## Lab UI Kontrol

Buka **Settings → Agents & Tools → Labs** untuk mengelola eksperimen yang memiliki
sakelar UI Kontrol. Mengaktifkan atau menonaktifkan lab akan langsung menambal
konfigurasi Gateway kanonis; halaman hanya menampilkan petunjuk untuk memulai ulang
ketika fitur memerlukannya.

Mode Kode dan Swarm adalah entri Lab yang saat ini disertakan. Kedua sakelar
menulis kunci konfigurasi tervalidasi yang sudah ada dan biasanya berlaku untuk
proses agen berikutnya tanpa memulai ulang Gateway.

## Mode ringan model lokal

`agents.defaults.experimental.localModelLean: true` menghapus alat opsional kelas berat dari permukaan langsung agen pada setiap giliran: `browser`, `cron`, `message`, `image_generate`, `music_generate`, `video_generate`, `tts`, dan `pdf`. Alat yang diizinkan secara eksplisit atau diperlukan untuk pengiriman tetap tersedia, meskipun Pencarian Alat dapat mengatalogkannya alih-alih menampilkannya secara langsung. Mode ringan juga menetapkan katalog plugin/MCP/klien secara default ke Pencarian Alat terstruktur (`tool_search`, `tool_describe`, `tool_call`) ketika `tools.toolSearch` belum ditetapkan. Gunakan `agents.list[].experimental.localModelLean` untuk membatasi ini ke satu agen.

Selama orientasi, rute inferensi `ollama` atau `lmstudio` yang terverifikasi secara otomatis menetapkan `agents.defaults.experimental.localModelLean: true` ketika nilai tersebut tidak ada. OpenClaw mencatat bahwa pengaturan tersebut berasal dari orientasi, sehingga rute nonlokal terverifikasi berikutnya hanya menghapus pengaturan otomatis tersebut. `true` atau `false` yang dikonfigurasi secara eksplisit dipertahankan. Penyedia lain yang dihosting sendiri dan kompatibel dengan OpenAI tidak disimpulkan dari nama model atau URL.

Jika Anda sudah menyetel Pencarian Alat secara global, OpenClaw membiarkan konfigurasi tersebut tanpa perubahan. Tetapkan `tools.toolSearch: false` untuk memilih keluar dari default Pencarian Alat mode ringan.

Dalam mode `tools` terstruktur, proses ringan mempertahankan `exec` tetap terlihat langsung di samping kontrol Pencarian Alat sehingga model lokal yang disetel untuk pengodean masih dapat memilih jalur shell yang sudah dikenalnya. Ini hanya mengubah visibilitas skema: kebijakan alat normal, sandboxing, dan persetujuan eksekusi tetap berlaku. Mode `code` dan `directory` yang eksplisit mempertahankan perilaku Compaction normalnya.

### Mengapa alat-alat ini

Alat-alat ini memiliki deskripsi terpanjang, bentuk parameter terluas, atau kemungkinan tertinggi untuk mengalihkan perhatian model kecil dari alur pengodean dan percakapan normal. Pada backend dengan konteks kecil atau yang kompatibel dengan OpenAI secara lebih ketat, inilah perbedaan antara:

- Skema alat dapat dimuat dalam prompt dibandingkan mendesak keluar riwayat percakapan.
- Model memilih alat yang tepat dibandingkan menghasilkan panggilan alat yang tidak valid akibat terlalu banyak skema serupa.
- Adaptor Chat Completions tetap berada dalam batas keluaran terstruktur dibandingkan mengalami galat 400 akibat ukuran payload panggilan alat.

Menghapusnya hanya memperpendek daftar alat langsung. Model tetap memiliki `read`, `write`, `edit`, `exec`, `apply_patch`, pemahaman gambar, pencarian/pengambilan web (jika dikonfigurasi), memori, serta alat sesi/agen. Katalog tambahan tetap dapat dijangkau melalui Pencarian Alat kecuali Anda menetapkan `tools.toolSearch: false`; izin alat eksplisit dapat mengikutsertakan kembali agen ringan ke dalam alur kerja yang telah dipangkas.

### Kapan perlu mengaktifkannya

Aktifkan mode ringan setelah Anda membuktikan bahwa model dapat berkomunikasi dengan Gateway, tetapi giliran agen penuh tidak berfungsi semestinya:

1. `openclaw infer model run --gateway --model <ref> --prompt "Reply with exactly: pong"` berhasil.
2. Giliran agen normal gagal akibat panggilan alat yang tidak valid, prompt yang terlalu besar, atau model mengabaikan alatnya.
3. Mengalihkan `localModelLean: true` mengatasi kegagalan tersebut.

### Kapan perlu membiarkannya nonaktif

Jika backend Anda menangani runtime default lengkap tanpa masalah, biarkan ini nonaktif. Ini adalah solusi sementara untuk tumpukan lokal yang memerlukan permukaan alat lebih kecil, bukan default untuk model yang dihosting atau sistem lokal dengan sumber daya memadai.

Mode ringan tidak menggantikan `tools.profile`, `tools.allow`/`tools.deny`, atau jalan keluar `compat.supportsTools: false` model. Untuk permukaan alat yang lebih sempit secara permanen pada agen tertentu, utamakan kontrol stabil tersebut.

### Aktifkan

```json5
{
  agents: {
    defaults: {
      experimental: {
        localModelLean: true,
      },
    },
  },
}
```

Hanya untuk satu agen:

```json5
{
  agents: {
    list: [
      {
        id: "local",
        model: "lmstudio/gemma-4-e4b-it",
        experimental: {
          localModelLean: true,
        },
      },
    ],
  },
}
```

Mulai ulang Gateway setelah mengubah flag. Pemfilteran ringan menghapus `browser`, `cron`, `message`, `image_generate`, `music_generate`, `video_generate`, `tts`, dan `pdf` kecuali Anda secara eksplisit mempertahankannya dengan `tools.allow` atau `tools.alsoAllow`; Pencarian Alat mungkin masih mengatalogkan alat yang dipertahankan alih-alih menampilkannya secara langsung.

## Eksperimental bukan berarti tersembunyi

Fitur eksperimental harus dinyatakan dengan jelas dalam dokumentasi dan jalur konfigurasinya sendiri, bukan disembunyikan di balik kontrol default yang tampak stabil.

## Terkait

- [Fitur](/id/concepts/features)
- [Saluran rilis](/id/install/development-channels)
