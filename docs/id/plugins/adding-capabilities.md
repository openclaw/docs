---
read_when:
    - Menambahkan kapabilitas inti baru dan antarmuka pendaftaran Plugin
    - Menentukan apakah kode seharusnya berada di inti, plugin vendor, atau plugin fitur
    - Menghubungkan helper runtime baru untuk kanal atau alat
sidebarTitle: Adding capabilities
summary: Panduan kontributor untuk menambahkan kapabilitas bersama baru ke sistem plugin OpenClaw
title: Menambahkan kemampuan (panduan kontributor)
x-i18n:
    generated_at: "2026-07-12T14:22:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3534b7521ab8183d91399cded8a3b397be46bf9bd18f2fdb88a8947bad67ffaa
    source_path: plugins/adding-capabilities.md
    workflow: 16
---

<Info>
  Ini adalah **panduan kontributor** bagi pengembang inti OpenClaw. Jika Anda
  sedang membuat plugin eksternal, lihat [Membuat plugin](/id/plugins/building-plugins)
  sebagai gantinya. Untuk referensi arsitektur mendalam (model kapabilitas, kepemilikan,
  alur pemuatan, pembantu runtime), lihat [Internal Plugin](/id/plugins/architecture).
</Info>

Gunakan panduan ini saat OpenClaw memerlukan domain bersama baru seperti embedding, pembuatan
gambar, pembuatan video, atau area fitur masa depan yang didukung vendor.

Aturannya:

- **plugin** = batas kepemilikan
- **kapabilitas** = kontrak inti bersama

Jangan hubungkan vendor secara langsung ke kanal atau alat. Definisikan kapabilitasnya terlebih dahulu.

## Kapan harus membuat kapabilitas

Buat kapabilitas baru hanya jika **semua** hal berikut terpenuhi:

1. Lebih dari satu vendor secara masuk akal dapat mengimplementasikannya.
2. Kanal, alat, atau plugin fitur harus dapat menggunakannya tanpa perlu mengetahui vendornya.
3. Inti perlu memiliki perilaku fallback, kebijakan, konfigurasi, atau pengiriman.

Jika pekerjaan hanya khusus untuk vendor dan belum ada kontrak bersama, definisikan kontraknya terlebih dahulu.

## Urutan standar

1. Definisikan kontrak inti bertipe.
2. Tambahkan pendaftaran plugin untuk kontrak tersebut.
3. Tambahkan pembantu runtime bersama.
4. Hubungkan satu plugin vendor nyata sebagai bukti.
5. Pindahkan konsumen fitur/kanal ke pembantu runtime.
6. Tambahkan pengujian kontrak.
7. Dokumentasikan konfigurasi yang ditujukan bagi operator dan model kepemilikannya.

## Penempatan komponen

| Lapisan                    | Memiliki                                                                                                                                                                                                                              |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Inti**                   | Tipe permintaan/respons; registri dan resolusi penyedia; perilaku fallback; skema konfigurasi dengan metadata dokumentasi `title`/`description` yang diteruskan pada simpul objek bertingkat, wildcard, item larik, dan komposisi; permukaan pembantu runtime. |
| **Plugin vendor**          | Panggilan API vendor, penanganan autentikasi vendor, normalisasi permintaan khusus vendor, dan pendaftaran implementasi kapabilitas.                                                                                                   |
| **Plugin fitur/kanal**     | Memanggil `api.runtime.*` atau pembantu `plugin-sdk/*-runtime` yang sesuai. Tidak pernah memanggil implementasi vendor secara langsung.                                                                                                |

## Titik integrasi penyedia dan harness

Gunakan **hook penyedia** ketika perilaku merupakan bagian dari kontrak penyedia model, bukan loop agen generik. Contohnya mencakup parameter permintaan khusus penyedia setelah pemilihan transportasi, preferensi profil autentikasi, overlay prompt, dan perutean fallback lanjutan setelah failover model/profil.

Gunakan **hook harness agen** ketika perilaku merupakan bagian dari runtime yang menjalankan suatu giliran. Harness dapat mengklasifikasikan hasil protokol eksplisit seperti keluaran kosong, penalaran tanpa keluaran yang terlihat, atau rencana terstruktur tanpa jawaban akhir agar kebijakan fallback model luar dapat menentukan keputusan percobaan ulang.

Jaga agar kedua titik integrasi tetap sempit:

- Inti memiliki kebijakan percobaan ulang/fallback.
- Plugin penyedia memiliki petunjuk permintaan/autentikasi/perutean khusus penyedia.
- Plugin harness memiliki klasifikasi percobaan khusus runtime.
- Plugin pihak ketiga mengembalikan petunjuk, bukan mutasi langsung terhadap status inti.

## Daftar periksa berkas

Untuk kapabilitas baru, bersiaplah menyentuh area berikut:

- `src/<capability>/types.ts`
- `src/<capability>/...registry/runtime.ts`
- `src/plugins/types.ts`
- `src/plugins/registry.ts`
- `src/plugins/captured-registration.ts`
- `src/plugins/contracts/registry.ts`
- `src/plugins/runtime/types-core.ts`
- `src/plugins/runtime/index.ts`
- `src/plugin-sdk/<capability>.ts`
- `src/plugin-sdk/<capability>-runtime.ts`
- Satu atau beberapa paket plugin bawaan.
- Konfigurasi, dokumentasi, pengujian.

## Contoh lengkap: pembuatan gambar

Pembuatan gambar mengikuti struktur standar:

1. Inti mendefinisikan `ImageGenerationProvider`.
2. Inti mengekspos `registerImageGenerationProvider(...)`.
3. Inti mengekspos `api.runtime.imageGeneration.generate(...)` dan `.listProviders(...)`.
4. Plugin vendor (`comfy`, `deepinfra`, `fal`, `google`, `litellm`, `microsoft-foundry`, `minimax`, `openai`, `openrouter`, `vydra`, `xai`) mendaftarkan implementasi yang didukung vendor.
5. Vendor mendatang mendaftarkan kontrak yang sama tanpa mengubah kanal/alat.

Kunci konfigurasi sengaja dipisahkan dari perutean analisis penglihatan:

- `agents.defaults.imageModel` menganalisis gambar.
- `agents.defaults.imageGenerationModel` menghasilkan gambar.

Pertahankan keduanya secara terpisah agar fallback dan kebijakan tetap eksplisit.

## Penyedia embedding

Gunakan `registerEmbeddingProvider(...)` / kontrak `embeddingProviders` untuk
penyedia embedding vektor yang dapat digunakan kembali. Kontrak ini sengaja lebih luas
daripada memori: alat, pencarian, pengambilan, pengimpor, atau plugin fitur masa depan
dapat menggunakan embedding tanpa bergantung pada mesin memori. Pencarian memori
juga menggunakan `embeddingProviders` generik.

API pendaftaran lama yang khusus untuk memori dan kontrak `memoryEmbeddingProviders`
sudah tidak digunakan lagi. Gunakan `registerEmbeddingProvider` dan
`embeddingProviders` untuk semua penyedia embedding baru.

## Daftar periksa peninjauan

Sebelum merilis kapabilitas baru, verifikasi:

- Tidak ada kanal/alat yang mengimpor kode vendor secara langsung.
- Pembantu runtime menjadi jalur bersama.
- Setidaknya satu pengujian kontrak memverifikasi kepemilikan bawaan.
- Dokumentasi konfigurasi menyebutkan model/kunci konfigurasi baru.
- Dokumentasi plugin menjelaskan batas kepemilikan.

Jika sebuah PR melewati lapisan kapabilitas dan menanamkan perilaku vendor langsung ke kanal/alat, kembalikan PR tersebut dan definisikan kontraknya terlebih dahulu.

## Terkait

- [Internal Plugin](/id/plugins/architecture) — model kapabilitas, kepemilikan, alur pemuatan, pembantu runtime.
- [Membuat plugin](/id/plugins/building-plugins) — tutorial plugin pertama.
- [Ikhtisar SDK](/id/plugins/sdk-overview) — peta impor dan referensi API pendaftaran.
- [Membuat Skills](/id/tools/creating-skills) — permukaan kontributor pendamping.
