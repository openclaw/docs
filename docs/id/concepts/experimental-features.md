---
read_when:
    - Anda melihat kunci konfigurasi `.experimental` dan ingin mengetahui apakah kunci tersebut stabil
    - Anda ingin mencoba fitur runtime pratinjau tanpa menyamakannya dengan default normal
    - Anda ingin satu tempat untuk menemukan flag eksperimental yang saat ini didokumentasikan
summary: Arti flag eksperimental di OpenClaw dan flag mana saja yang saat ini didokumentasikan
title: Fitur eksperimental
x-i18n:
    generated_at: "2026-07-19T05:04:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: c25e5120b0c602c2d143e54f124b760208a08ddfed3d515f73de2b2fd2640d9d
    source_path: concepts/experimental-features.md
    workflow: 16
---

Fitur eksperimental adalah permukaan pratinjau di balik flag eksplisit. Fitur tersebut memerlukan lebih banyak penggunaan di dunia nyata sebelum mendapatkan nilai default yang stabil atau kontrak jangka panjang.

- Nonaktif secara default kecuali dokumentasi menjelaskan aturan penyiapan otomatis yang terbatas.
- Bentuk dan perilakunya dapat berubah lebih cepat daripada konfigurasi stabil.
- Utamakan jalur yang stabil jika sudah tersedia.
- Terapkan secara luas hanya setelah mengujinya terlebih dahulu di lingkungan yang lebih kecil.

## Flag yang saat ini didokumentasikan

| Permukaan               | Kunci                                                                                      | Gunakan ketika                                                                                                                            | Selengkapnya                                                                                     |
| ------------------------ | ------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Runtime model lokal      | `agents.defaults.experimental.localModelLean`, `agents.list[].experimental.localModelLean` | Backend lokal yang lebih kecil atau lebih ketat tidak dapat menangani seluruh permukaan alat default OpenClaw                            | [Model Lokal](/id/gateway/local-models)                                                             |
| Pencarian memori         | `agents.defaults.memorySearch.experimental.sessionMemory`                                  | Anda ingin `memory_search` mengindeks transkrip sesi sebelumnya dan bersedia menanggung biaya penyimpanan/pengindeksan tambahan          | [Referensi konfigurasi memori](/id/reference/memory-config#session-memory-search-experimental)      |
| Harness Codex            | `plugins.entries.codex.config.appServer.experimental.sandboxExecServer`                    | Anda ingin app-server Codex native 0.132.0 atau yang lebih baru menargetkan exec-server yang didukung sandbox OpenClaw alih-alih menonaktifkan Mode Kode | [Referensi harness Codex](/id/plugins/codex-harness-reference#sandboxed-native-execution)           |
| Alat perencanaan terstruktur | `tools.experimental.planTool`                                                              | Anda ingin alat `update_plan` terstruktur tersedia untuk melacak pekerjaan bertahap di runtime dan UI yang kompatibel                    | [Referensi konfigurasi Gateway](/id/gateway/config-tools#toolsexperimental)                          |
| Mode Kode                | `tools.codeMode.enabled`                                                                   | Anda ingin akses ringkas yang diorkestrasi kode ke katalog alat OpenClaw tersembunyi                                                       | [Mode Kode](/id/tools/code-mode)                                                                    |

## Lab Control UI

Buka **Settings → Agents & Tools → Labs** untuk mengelola eksperimen yang memiliki
sakelar Control UI. Mengaktifkan atau menonaktifkan lab akan langsung menambal
konfigurasi Gateway kanonis; halaman hanya menampilkan petunjuk untuk memulai ulang
ketika suatu fitur memerlukannya.

Mode Kode saat ini merupakan satu-satunya entri Labs yang telah dirilis. Swarm belum tersedia:
bentuk konfigurasinya belum dirilis, sehingga Control UI tidak menulis kunci spekulatif
yang akan membuat konfigurasi operator tidak valid.

## Mode ramping model lokal

`agents.defaults.experimental.localModelLean: true` menghapus alat opsional berat dari permukaan langsung agen pada setiap giliran: `browser`, `cron`, `message`, `image_generate`, `music_generate`, `video_generate`, `tts`, dan `pdf`. Alat yang diizinkan secara eksplisit atau diperlukan untuk pengiriman tetap tersedia, meskipun Pencarian Alat dapat mengatalogkannya alih-alih menampilkannya secara langsung. Mode ramping juga menetapkan katalog plugin/MCP/klien secara default ke Pencarian Alat terstruktur (`tool_search`, `tool_describe`, `tool_call`) ketika `tools.toolSearch` belum ditetapkan. Gunakan `agents.list[].experimental.localModelLean` untuk membatasi ini ke satu agen.

Selama onboarding, rute inferensi `ollama` atau `lmstudio` yang telah diverifikasi secara otomatis menetapkan `agents.defaults.experimental.localModelLean: true` ketika nilai tersebut tidak ada. OpenClaw mencatat bahwa pengaturan tersebut berasal dari onboarding, sehingga rute nonlokal terverifikasi berikutnya hanya menghapus pengaturan otomatis tersebut. `true` atau `false` yang dikonfigurasi secara eksplisit akan dipertahankan. Penyedia lain yang dihosting sendiri dan kompatibel dengan OpenAI tidak disimpulkan dari nama model atau URL.

Jika Anda sudah menyesuaikan Pencarian Alat secara global, OpenClaw membiarkan konfigurasi tersebut tetap seperti semula. Tetapkan `tools.toolSearch: false` untuk tidak menggunakan nilai default Pencarian Alat dari mode ramping.

Dalam mode `tools` terstruktur, proses mode ramping mempertahankan `exec` agar terlihat langsung di samping kontrol Pencarian Alat sehingga model lokal yang disesuaikan untuk pengodean tetap dapat memilih jalur shell yang familier. Ini hanya mengubah visibilitas skema: kebijakan alat normal, sandboxing, dan persetujuan eksekusi tetap berlaku. Mode `code` dan `directory` yang eksplisit mempertahankan perilaku Compaction normalnya.

### Alasan memilih alat-alat ini

Alat-alat ini memiliki deskripsi terpanjang, bentuk parameter terluas, atau kemungkinan tertinggi mengalihkan perhatian model kecil dari jalur pengodean dan percakapan normal. Pada backend berkonteks kecil atau backend kompatibel OpenAI yang lebih ketat, hal ini menentukan perbedaan antara:

- Skema alat dapat masuk ke dalam prompt dibandingkan menggeser riwayat percakapan.
- Model memilih alat yang tepat dibandingkan menghasilkan panggilan alat yang tidak valid akibat terlalu banyak skema serupa.
- Adaptor Chat Completions tetap berada dalam batas keluaran terstruktur dibandingkan menghasilkan 400 karena ukuran payload panggilan alat.

Menghapusnya hanya memperpendek daftar alat langsung. Model tetap memiliki `read`, `write`, `edit`, `exec`, `apply_patch`, pemahaman gambar, pencarian/pengambilan web (jika dikonfigurasi), memori, serta alat sesi/agen. Katalog tambahan tetap dapat dijangkau melalui Pencarian Alat kecuali Anda menetapkan `tools.toolSearch: false`; izin alat eksplisit dapat mengikutsertakan kembali agen mode ramping ke dalam alur kerja yang telah dipangkas.

### Kapan harus mengaktifkannya

Aktifkan mode ramping setelah Anda membuktikan bahwa model dapat berkomunikasi dengan Gateway, tetapi giliran agen penuh tidak berfungsi dengan benar:

1. `openclaw infer model run --gateway --model <ref> --prompt "Reply with exactly: pong"` berhasil.
2. Giliran agen normal gagal karena panggilan alat yang tidak valid, prompt terlalu besar, atau model mengabaikan alatnya.
3. Mengalihkan `localModelLean: true` mengatasi kegagalan tersebut.

### Kapan harus membiarkannya nonaktif

Jika backend Anda menangani runtime default lengkap dengan baik, biarkan ini tetap nonaktif. Ini adalah solusi sementara untuk stack lokal yang memerlukan permukaan alat lebih kecil, bukan nilai default untuk model yang dihosting atau perangkat lokal dengan sumber daya memadai.

Mode ramping tidak menggantikan `tools.profile`, `tools.allow`/`tools.deny`, atau jalan keluar `compat.supportsTools: false` model. Untuk permukaan alat yang lebih sempit secara permanen pada agen tertentu, utamakan opsi stabil tersebut.

### Mengaktifkan

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

Untuk satu agen saja:

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

Mulai ulang Gateway setelah mengubah flag. Pemfilteran mode ramping menghapus `browser`, `cron`, `message`, `image_generate`, `music_generate`, `video_generate`, `tts`, dan `pdf` kecuali Anda secara eksplisit mempertahankannya dengan `tools.allow` atau `tools.alsoAllow`; Pencarian Alat mungkin tetap mengatalogkan alat yang dipertahankan alih-alih menampilkannya secara langsung.

## Eksperimental bukan berarti tersembunyi

Fitur eksperimental harus dinyatakan dengan jelas dalam dokumentasi dan jalur konfigurasi itu sendiri, bukan disembunyikan di balik opsi default yang tampak stabil.

## Terkait

- [Fitur](/id/concepts/features)
- [Saluran rilis](/id/install/development-channels)
