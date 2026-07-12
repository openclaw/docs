---
read_when:
    - Anda melihat kunci konfigurasi `.experimental` dan ingin mengetahui apakah kunci tersebut stabil
    - Anda ingin mencoba fitur runtime pratinjau tanpa mengacaukannya dengan nilai default normal
    - Anda menginginkan satu tempat untuk menemukan flag eksperimental yang saat ini terdokumentasi
summary: Arti flag eksperimental di OpenClaw dan flag mana yang saat ini didokumentasikan
title: Fitur eksperimental
x-i18n:
    generated_at: "2026-07-12T14:08:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1d4f6d066ef80cad2fb8a54c8aecb9fca5b4ed91cd5a3626dad4ad889dc3e8f2
    source_path: concepts/experimental-features.md
    workflow: 16
---

Fitur eksperimental adalah fitur pratinjau yang harus diaktifkan secara eksplisit melalui flag tertentu. Fitur tersebut memerlukan lebih banyak penggunaan di dunia nyata sebelum mendapatkan pengaturan default yang stabil atau kontrak jangka panjang.

- Dinonaktifkan secara default kecuali dokumentasi meminta Anda mengaktifkannya.
- Bentuk dan perilakunya dapat berubah lebih cepat daripada konfigurasi stabil.
- Utamakan jalur stabil jika sudah tersedia.
- Terapkan secara luas hanya setelah mengujinya terlebih dahulu di lingkungan yang lebih kecil.

## Flag yang saat ini didokumentasikan

| Fitur                    | Kunci                                                                                      | Gunakan ketika                                                                                                                      | Selengkapnya                                                                                  |
| ------------------------ | ------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Runtime model lokal      | `agents.defaults.experimental.localModelLean`, `agents.list[].experimental.localModelLean` | Backend lokal yang lebih kecil atau lebih ketat tidak mampu menangani seluruh rangkaian alat default OpenClaw                       | [Model Lokal](/id/gateway/local-models)                                                          |
| Pencarian memori         | `agents.defaults.memorySearch.experimental.sessionMemory`                                  | Anda ingin `memory_search` mengindeks transkrip sesi sebelumnya dan bersedia menanggung biaya tambahan untuk penyimpanan/pengindeksan | [Referensi konfigurasi memori](/id/reference/memory-config#session-memory-search-experimental)    |
| Harness Codex            | `plugins.entries.codex.config.appServer.experimental.sandboxExecServer`                    | Anda ingin app-server native Codex 0.132.0 atau yang lebih baru menargetkan exec-server berbasis sandbox OpenClaw alih-alih menonaktifkan Mode Kode | [Referensi harness Codex](/id/plugins/codex-harness-reference#sandboxed-native-execution) |
| Alat perencanaan terstruktur | `tools.experimental.planTool`                                                          | Anda ingin alat terstruktur `update_plan` tersedia untuk melacak pekerjaan bertahap dalam runtime dan UI yang kompatibel             | [Referensi konfigurasi Gateway](/id/gateway/config-tools#toolsexperimental)                       |

## Mode ramping model lokal

`agents.defaults.experimental.localModelLean: true` menghapus alat opsional kelas berat dari fitur langsung agen pada setiap giliran: `browser`, `cron`, `message`, `image_generate`, `music_generate`, `video_generate`, `tts`, dan `pdf`. Alat yang diizinkan secara eksplisit atau diperlukan untuk pengiriman tetap tersedia, meskipun Pencarian Alat mungkin mengatalogkannya alih-alih menampilkannya secara langsung. Mode ramping juga menetapkan katalog Plugin/MCP/klien secara default ke Pencarian Alat terstruktur (`tool_search`, `tool_describe`, `tool_call`) ketika `tools.toolSearch` belum ditetapkan. Gunakan `agents.list[].experimental.localModelLean` untuk membatasi pengaturan ini pada satu agen.

Jika Anda telah menyesuaikan Pencarian Alat secara global, OpenClaw membiarkan konfigurasi tersebut apa adanya. Tetapkan `tools.toolSearch: false` untuk menolak pengaturan default Pencarian Alat dalam mode ramping.

Dalam mode `tools` terstruktur, proses mode ramping tetap menampilkan `exec` secara langsung di samping kontrol Pencarian Alat agar model lokal yang dioptimalkan untuk pemrograman masih dapat memilih jalur shell yang familier. Ini hanya mengubah visibilitas skema: kebijakan alat, sandbox, dan persetujuan eksekusi normal tetap berlaku. Mode `code` dan `directory` yang ditetapkan secara eksplisit mempertahankan perilaku Compaction normalnya.

### Mengapa alat-alat ini

Alat-alat ini memiliki deskripsi terpanjang, bentuk parameter terluas, atau kemungkinan tertinggi mengalihkan perhatian model kecil dari alur pemrograman dan percakapan normal. Pada backend kompatibel OpenAI dengan konteks kecil atau aturan lebih ketat, inilah yang membedakan antara:

- Skema alat yang muat dalam prompt dibandingkan dengan yang mendesak riwayat percakapan.
- Model yang memilih alat yang tepat dibandingkan dengan yang menghasilkan panggilan alat cacat akibat terlalu banyak skema serupa.
- Adaptor Chat Completions yang tetap berada dalam batas output terstruktur dibandingkan dengan galat 400 akibat ukuran payload panggilan alat.

Menghapusnya hanya mempersingkat daftar alat langsung. Model masih memiliki `read`, `write`, `edit`, `exec`, `apply_patch`, pemahaman gambar, pencarian/pengambilan web (jika dikonfigurasi), memori, serta alat sesi/agen. Katalog tambahan tetap dapat diakses melalui Pencarian Alat kecuali Anda menetapkan `tools.toolSearch: false`; izin alat eksplisit dapat menyertakan kembali alat tertentu bagi agen mode ramping dalam alur kerja yang telah dipangkas.

### Kapan perlu mengaktifkannya

Aktifkan mode ramping setelah Anda membuktikan bahwa model dapat berkomunikasi dengan Gateway, tetapi giliran agen lengkap berperilaku tidak semestinya:

1. `openclaw infer model run --gateway --model <ref> --prompt "Reply with exactly: pong"` berhasil.
2. Giliran agen normal gagal karena panggilan alat cacat, prompt terlalu besar, atau model mengabaikan alatnya.
3. Mengaktifkan `localModelLean: true` mengatasi kegagalan tersebut.

### Kapan perlu membiarkannya nonaktif

Jika backend Anda menangani runtime default lengkap dengan baik, biarkan pengaturan ini nonaktif. Ini adalah solusi sementara untuk tumpukan lokal yang memerlukan rangkaian alat lebih kecil, bukan pengaturan default untuk model yang dihosting atau perangkat lokal dengan sumber daya memadai.

Mode ramping tidak menggantikan `tools.profile`, `tools.allow`/`tools.deny`, atau jalan keluar `compat.supportsTools: false` pada model. Untuk rangkaian alat yang secara permanen lebih sempit pada agen tertentu, utamakan opsi stabil tersebut.

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

Mulai ulang Gateway setelah mengubah flag. Pemfilteran mode ramping menghapus `browser`, `cron`, `message`, `image_generate`, `music_generate`, `video_generate`, `tts`, dan `pdf`, kecuali Anda secara eksplisit mempertahankannya dengan `tools.allow` atau `tools.alsoAllow`; Pencarian Alat mungkin tetap mengatalogkan alat yang dipertahankan alih-alih menampilkannya secara langsung.

## Eksperimental bukan berarti tersembunyi

Fitur eksperimental harus dinyatakan secara jelas dalam dokumentasi dan jalur konfigurasinya sendiri, bukan disembunyikan di balik opsi default yang terlihat stabil.

## Terkait

- [Fitur](/id/concepts/features)
- [Saluran rilis](/id/install/development-channels)
