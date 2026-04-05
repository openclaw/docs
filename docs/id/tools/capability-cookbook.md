---
read_when:
    - Menambahkan kapabilitas inti baru dan permukaan registrasi plugin
    - Menentukan apakah kode sebaiknya berada di inti, plugin vendor, atau plugin fitur
    - Menghubungkan helper runtime baru untuk channel atau tools
sidebarTitle: Adding Capabilities
summary: Panduan kontributor untuk menambahkan kapabilitas bersama baru ke sistem plugin OpenClaw
title: Menambahkan Kapabilitas (Panduan Kontributor)
x-i18n:
    generated_at: "2026-04-05T14:07:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 29604d88e6df5205b835d71f3078b6223c58b6294135c3e201756c1bcac33ea3
    source_path: tools/capability-cookbook.md
    workflow: 15
---

# Menambahkan Kapabilitas

<Info>
  Ini adalah **panduan kontributor** untuk pengembang inti OpenClaw. Jika Anda
  sedang membangun plugin eksternal, lihat [Building Plugins](/id/plugins/building-plugins)
  sebagai gantinya.
</Info>

Gunakan ini saat OpenClaw membutuhkan domain baru seperti pembuatan gambar, pembuatan video, atau area fitur masa depan yang didukung vendor.

Aturannya:

- plugin = batas kepemilikan
- capability = kontrak inti bersama

Artinya Anda tidak boleh memulai dengan langsung menghubungkan vendor ke channel atau
tool. Mulailah dengan mendefinisikan kapabilitasnya.

## Kapan membuat kapabilitas

Buat kapabilitas baru jika semua hal berikut benar:

1. lebih dari satu vendor secara masuk akal dapat mengimplementasikannya
2. channel, tools, atau plugin fitur seharusnya menggunakannya tanpa peduli
   vendornya
3. inti perlu memiliki fallback, kebijakan, config, atau perilaku pengiriman

Jika pekerjaan itu hanya khusus vendor dan belum ada kontrak bersama, hentikan
dan definisikan kontraknya terlebih dahulu.

## Urutan standar

1. Definisikan kontrak inti bertipe.
2. Tambahkan registrasi plugin untuk kontrak tersebut.
3. Tambahkan helper runtime bersama.
4. Hubungkan satu plugin vendor nyata sebagai bukti.
5. Pindahkan konsumen fitur/channel ke helper runtime.
6. Tambahkan contract test.
7. Dokumentasikan config yang menghadap operator dan model kepemilikannya.

## Apa yang berada di mana

Inti:

- tipe request/response
- registri provider + resolusi
- perilaku fallback
- schema config plus metadata docs `title` / `description` yang dipropagasikan pada node objek bertingkat, wildcard, item array, dan komposisi
- permukaan helper runtime

Plugin vendor:

- panggilan API vendor
- penanganan auth vendor
- normalisasi request khusus vendor
- registrasi implementasi kapabilitas

Plugin fitur/channel:

- memanggil `api.runtime.*` atau helper `plugin-sdk/*-runtime` yang sesuai
- jangan pernah memanggil implementasi vendor secara langsung

## Checklist file

Untuk kapabilitas baru, perkirakan akan menyentuh area-area ini:

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
- satu atau lebih paket plugin bawaan
- config/docs/test

## Contoh: pembuatan gambar

Pembuatan gambar mengikuti bentuk standar:

1. inti mendefinisikan `ImageGenerationProvider`
2. inti mengekspos `registerImageGenerationProvider(...)`
3. inti mengekspos `runtime.imageGeneration.generate(...)`
4. plugin `openai`, `google`, `fal`, dan `minimax` mendaftarkan implementasi yang didukung vendor
5. vendor mendatang dapat mendaftarkan kontrak yang sama tanpa mengubah channel/tools

Kunci config dipisahkan dari routing analisis visi:

- `agents.defaults.imageModel` = menganalisis gambar
- `agents.defaults.imageGenerationModel` = menghasilkan gambar

Pisahkan keduanya agar fallback dan kebijakan tetap eksplisit.

## Checklist peninjauan

Sebelum merilis kapabilitas baru, verifikasi:

- tidak ada channel/tool yang mengimpor kode vendor secara langsung
- helper runtime adalah jalur bersama
- setidaknya satu contract test menegaskan kepemilikan bawaan
- docs config menyebutkan model/kunci config baru
- docs plugin menjelaskan batas kepemilikan

Jika sebuah PR melewati lapisan kapabilitas dan meng-hardcode perilaku vendor ke dalam
channel/tool, kembalikan PR itu dan definisikan kontraknya terlebih dahulu.
