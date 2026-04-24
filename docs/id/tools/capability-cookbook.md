---
read_when:
    - Menambahkan kapabilitas inti baru dan permukaan registrasi Plugin
    - Menentukan apakah kode sebaiknya berada di inti, Plugin vendor, atau Plugin fitur
    - Menghubungkan helper runtime baru untuk channel atau tool
sidebarTitle: Adding Capabilities
summary: Panduan kontributor untuk menambahkan kapabilitas bersama baru ke sistem Plugin OpenClaw
title: Menambahkan kapabilitas (panduan kontributor)
x-i18n:
    generated_at: "2026-04-24T09:29:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 864506dd3f61aa64e7c997c9d9e05ce0ad70c80a26a734d4f83b2e80331be4ab
    source_path: tools/capability-cookbook.md
    workflow: 15
---

<Info>
  Ini adalah **panduan kontributor** untuk developer inti OpenClaw. Jika Anda
  sedang membangun Plugin eksternal, lihat [Membangun Plugin](/id/plugins/building-plugins)
  sebagai gantinya.
</Info>

Gunakan ini saat OpenClaw membutuhkan domain baru seperti generasi gambar, generasi video, atau area fitur masa depan lain yang didukung vendor.

Aturannya:

- plugin = batas kepemilikan
- capability = kontrak inti bersama

Artinya Anda tidak seharusnya memulai dengan menghubungkan vendor secara langsung ke channel atau
tool. Mulailah dengan mendefinisikan capability.

## Kapan membuat capability

Buat capability baru ketika semua ini benar:

1. lebih dari satu vendor secara masuk akal bisa mengimplementasikannya
2. channel, tool, atau Plugin fitur seharusnya menggunakannya tanpa peduli
   pada vendornya
3. inti perlu memiliki fallback, kebijakan, konfigurasi, atau perilaku pengiriman

Jika pekerjaan hanya milik vendor dan belum ada kontrak bersama, berhenti dan definisikan
kontraknya terlebih dahulu.

## Urutan standar

1. Definisikan kontrak inti yang bertipe.
2. Tambahkan registrasi Plugin untuk kontrak tersebut.
3. Tambahkan helper runtime bersama.
4. Hubungkan satu Plugin vendor nyata sebagai pembuktian.
5. Pindahkan consumer fitur/channel ke helper runtime.
6. Tambahkan contract test.
7. Dokumentasikan konfigurasi yang menghadap operator dan model kepemilikan.

## Apa yang diletakkan di mana

Inti:

- tipe request/response
- registry provider + resolusi
- perilaku fallback
- skema konfigurasi plus metadata dokumen `title` / `description` yang dipropagasikan pada node objek bersarang, wildcard, item-array, dan komposisi
- permukaan helper runtime

Plugin vendor:

- panggilan API vendor
- penanganan auth vendor
- normalisasi permintaan khusus vendor
- registrasi implementasi capability

Plugin fitur/channel:

- memanggil `api.runtime.*` atau helper `plugin-sdk/*-runtime` yang cocok
- tidak pernah memanggil implementasi vendor secara langsung

## Provider dan batas Harness

Gunakan hook provider saat perilaku tersebut milik kontrak provider model
alih-alih loop agen generik. Contohnya mencakup param permintaan khusus provider setelah pemilihan transport, preferensi auth-profile, overlay prompt, dan routing fallback tindak lanjut setelah failover model/profile.

Gunakan hook agent harness saat perilaku tersebut milik runtime yang
mengeksekusi sebuah giliran. Harness dapat mengklasifikasikan hasil upaya yang berhasil tetapi tidak dapat digunakan seperti respons kosong, hanya reasoning, atau hanya planning sehingga kebijakan fallback model luar dapat membuat keputusan retry.

Jaga kedua batas ini tetap sempit:

- inti memiliki kebijakan retry/fallback
- Plugin provider memiliki petunjuk request/auth/routing khusus provider
- Plugin harness memiliki klasifikasi upaya khusus runtime
- Plugin pihak ketiga mengembalikan petunjuk, bukan mutasi langsung terhadap status inti

## Checklist file

Untuk capability baru, perkirakan Anda akan menyentuh area ini:

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
- satu atau lebih paket Plugin bundled
- config/docs/tests

## Contoh: generasi gambar

Generasi gambar mengikuti bentuk standar:

1. inti mendefinisikan `ImageGenerationProvider`
2. inti mengekspos `registerImageGenerationProvider(...)`
3. inti mengekspos `runtime.imageGeneration.generate(...)`
4. Plugin `openai`, `google`, `fal`, dan `minimax` mendaftarkan implementasi yang didukung vendor
5. vendor di masa depan dapat mendaftarkan kontrak yang sama tanpa mengubah channel/tool

Kunci konfigurasi dipisahkan dari routing vision-analysis:

- `agents.defaults.imageModel` = menganalisis gambar
- `agents.defaults.imageGenerationModel` = menghasilkan gambar

Jaga keduanya terpisah agar fallback dan kebijakan tetap eksplisit.

## Checklist review

Sebelum merilis capability baru, verifikasi:

- tidak ada channel/tool yang mengimpor kode vendor secara langsung
- helper runtime adalah jalur bersama
- setidaknya satu contract test menegaskan kepemilikan bundled
- dokumen konfigurasi menyebutkan model/kunci konfigurasi baru
- dokumen Plugin menjelaskan batas kepemilikan

Jika sebuah PR melewati lapisan capability dan meng-hardcode perilaku vendor ke dalam
channel/tool, kembalikan PR itu dan definisikan kontraknya terlebih dahulu.

## Terkait

- [Plugin](/id/tools/plugin)
- [Membuat skill](/id/tools/creating-skills)
- [Tools dan Plugin](/id/tools)
