---
read_when:
    - Menambahkan kapabilitas inti baru dan permukaan pendaftaran Plugin
    - Menentukan apakah kode harus berada di inti, Plugin vendor, atau Plugin fitur
    - Menghubungkan fungsi pembantu waktu eksekusi baru untuk saluran atau alat
sidebarTitle: Adding capabilities
summary: Panduan kontributor untuk menambahkan kapabilitas bersama baru ke sistem Plugin OpenClaw
title: Menambahkan kapabilitas (panduan kontributor)
x-i18n:
    generated_at: "2026-05-06T09:21:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7e289c95d9dc5924b5cc7b67428386660b83052b6cf6f14fc4f838fc88b7a25c
    source_path: plugins/adding-capabilities.md
    workflow: 16
---

<Info>
  Ini adalah **panduan kontributor** untuk developer inti OpenClaw. Jika Anda
  membangun Plugin eksternal, lihat [Membangun Plugin](/id/plugins/building-plugins)
  sebagai gantinya. Untuk referensi arsitektur mendalam (model kapabilitas, kepemilikan,
  pipeline pemuatan, helper runtime), lihat [Internal Plugin](/id/plugins/architecture).
</Info>

Gunakan ini saat OpenClaw membutuhkan domain bersama baru seperti pembuatan gambar, pembuatan video, atau area fitur masa depan yang didukung vendor.

Aturannya:

- **Plugin** = batas kepemilikan
- **kapabilitas** = kontrak inti bersama

Jangan mulai dengan menghubungkan vendor langsung ke channel atau tool. Mulailah dengan mendefinisikan kapabilitas.

## Kapan membuat kapabilitas

Buat kapabilitas baru saat **semua** hal berikut benar:

1. Lebih dari satu vendor secara masuk akal dapat mengimplementasikannya.
2. Channel, tool, atau Plugin fitur harus dapat mengonsumsinya tanpa peduli pada vendornya.
3. Inti perlu memiliki perilaku fallback, kebijakan, konfigurasi, atau pengiriman.

Jika pekerjaannya hanya untuk vendor dan belum ada kontrak bersama, berhenti dan definisikan kontraknya terlebih dahulu.

## Urutan standar

1. Definisikan kontrak inti bertipe.
2. Tambahkan pendaftaran Plugin untuk kontrak tersebut.
3. Tambahkan helper runtime bersama.
4. Hubungkan satu Plugin vendor nyata sebagai bukti.
5. Pindahkan konsumen fitur/channel ke helper runtime.
6. Tambahkan pengujian kontrak.
7. Dokumentasikan konfigurasi yang dihadapi operator dan model kepemilikan.

## Apa ditempatkan di mana

**Inti:**

- Tipe permintaan/respons.
- Registry penyedia + resolusi.
- Perilaku fallback.
- Skema konfigurasi dengan metadata dokumentasi `title` / `description` yang dipropagasikan pada node objek bertingkat, wildcard, item array, dan komposisi.
- Permukaan helper runtime.

**Plugin vendor:**

- Panggilan API vendor.
- Penanganan autentikasi vendor.
- Normalisasi permintaan khusus vendor.
- Pendaftaran implementasi kapabilitas.

**Plugin fitur/channel:**

- Memanggil `api.runtime.*` atau helper `plugin-sdk/*-runtime` yang sesuai.
- Tidak pernah memanggil implementasi vendor secara langsung.

## Seam penyedia dan harness

Gunakan **hook penyedia** saat perilaku termasuk dalam kontrak penyedia model, bukan loop agen generik. Contohnya mencakup parameter permintaan khusus penyedia setelah pemilihan transport, preferensi profil autentikasi, overlay prompt, dan perutean fallback lanjutan setelah failover model/profil.

Gunakan **hook harness agen** saat perilaku termasuk dalam runtime yang mengeksekusi satu giliran. Harness dapat mengklasifikasikan hasil percobaan yang berhasil tetapi tidak dapat digunakan, seperti respons kosong, hanya penalaran, atau hanya perencanaan, sehingga kebijakan fallback model luar dapat membuat keputusan coba ulang.

Jaga kedua seam tetap sempit:

- Inti memiliki kebijakan coba ulang/fallback.
- Plugin penyedia memiliki petunjuk permintaan/autentikasi/perutean khusus penyedia.
- Plugin harness memiliki klasifikasi percobaan khusus runtime.
- Plugin pihak ketiga mengembalikan petunjuk, bukan mutasi langsung pada status inti.

## Checklist file

Untuk kapabilitas baru, perkirakan menyentuh area berikut:

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
- Satu atau beberapa paket Plugin bundel.
- Konfigurasi, dokumentasi, pengujian.

## Contoh kerja: pembuatan gambar

Pembuatan gambar mengikuti bentuk standar:

1. Inti mendefinisikan `ImageGenerationProvider`.
2. Inti mengekspos `registerImageGenerationProvider(...)`.
3. Inti mengekspos `runtime.imageGeneration.generate(...)`.
4. Plugin `openai`, `google`, `fal`, dan `minimax` mendaftarkan implementasi yang didukung vendor.
5. Vendor masa depan mendaftarkan kontrak yang sama tanpa mengubah channel/tool.

Kunci konfigurasi sengaja dipisahkan dari perutean analisis visi:

- `agents.defaults.imageModel` menganalisis gambar.
- `agents.defaults.imageGenerationModel` menghasilkan gambar.

Pisahkan keduanya agar fallback dan kebijakan tetap eksplisit.

## Checklist tinjauan

Sebelum mengirim kapabilitas baru, verifikasi:

- Tidak ada channel/tool yang mengimpor kode vendor secara langsung.
- Helper runtime adalah jalur bersama.
- Setidaknya satu pengujian kontrak menegaskan kepemilikan bundel.
- Dokumentasi konfigurasi menamai model/kunci konfigurasi baru.
- Dokumentasi Plugin menjelaskan batas kepemilikan.

Jika sebuah PR melewati lapisan kapabilitas dan meng-hardcode perilaku vendor ke dalam channel/tool, kembalikan dan definisikan kontraknya terlebih dahulu.

## Terkait

- [Internal Plugin](/id/plugins/architecture) — model kapabilitas, kepemilikan, pipeline pemuatan, helper runtime.
- [Membangun Plugin](/id/plugins/building-plugins) — tutorial Plugin pertama.
- [Ikhtisar SDK](/id/plugins/sdk-overview) — referensi peta impor dan API pendaftaran.
- [Membuat Skills](/id/tools/creating-skills) — permukaan kontributor pendamping.
