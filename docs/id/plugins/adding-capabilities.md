---
read_when:
    - Menambahkan kapabilitas inti baru dan permukaan pendaftaran plugin
    - Menentukan apakah kode termasuk dalam core, plugin vendor, atau plugin fitur
    - Menghubungkan helper runtime baru untuk channel atau alat
sidebarTitle: Adding capabilities
summary: Panduan kontributor untuk menambahkan kapabilitas bersama baru ke sistem Plugin OpenClaw
title: Menambahkan kapabilitas (panduan kontributor)
x-i18n:
    generated_at: "2026-06-27T17:43:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b8a25122a7b76ff5bbb7616748d5fad2397502f9accb5428134a75d65e872034
    source_path: plugins/adding-capabilities.md
    workflow: 16
---

<Info>
  Ini adalah **panduan kontributor** untuk pengembang inti OpenClaw. Jika Anda
  membangun plugin eksternal, lihat [Membangun plugin](/id/plugins/building-plugins)
  sebagai gantinya. Untuk referensi arsitektur mendalam (model kapabilitas, kepemilikan,
  pipeline pemuatan, helper runtime), lihat [Internal plugin](/id/plugins/architecture).
</Info>

Gunakan ini ketika OpenClaw membutuhkan domain bersama baru seperti embedding, pembuatan gambar, pembuatan video, atau area fitur masa depan yang didukung vendor.

Aturannya:

- **plugin** = batas kepemilikan
- **kapabilitas** = kontrak inti bersama

Jangan mulai dengan menghubungkan vendor langsung ke channel atau tool. Mulailah dengan mendefinisikan kapabilitas.

## Kapan membuat kapabilitas

Buat kapabilitas baru ketika **semua** hal berikut benar:

1. Lebih dari satu vendor secara masuk akal dapat mengimplementasikannya.
2. Channel, tool, atau plugin fitur harus dapat menggunakannya tanpa peduli tentang vendornya.
3. Inti perlu memiliki perilaku fallback, kebijakan, konfigurasi, atau pengiriman.

Jika pekerjaannya hanya untuk vendor dan belum ada kontrak bersama, berhenti dan definisikan kontraknya terlebih dahulu.

## Urutan standar

1. Definisikan kontrak inti bertipe.
2. Tambahkan registrasi plugin untuk kontrak tersebut.
3. Tambahkan helper runtime bersama.
4. Hubungkan satu plugin vendor nyata sebagai bukti.
5. Pindahkan konsumen fitur/channel ke helper runtime.
6. Tambahkan pengujian kontrak.
7. Dokumentasikan konfigurasi yang terlihat oleh operator dan model kepemilikannya.

## Apa ditempatkan di mana

**Inti:**

- Tipe permintaan/respons.
- Registry provider + resolusi.
- Perilaku fallback.
- Skema konfigurasi dengan metadata dokumentasi `title` / `description` yang dipropagasikan pada node objek bertingkat, wildcard, item array, dan komposisi.
- Permukaan helper runtime.

**Plugin vendor:**

- Panggilan API vendor.
- Penanganan autentikasi vendor.
- Normalisasi permintaan khusus vendor.
- Registrasi implementasi kapabilitas.

**Plugin fitur/channel:**

- Memanggil `api.runtime.*` atau helper `plugin-sdk/*-runtime` yang sesuai.
- Tidak pernah memanggil implementasi vendor secara langsung.

## Seam provider dan harness

Gunakan **hook provider** ketika perilaku tersebut termasuk dalam kontrak provider model, bukan loop agen generik. Contohnya mencakup parameter permintaan khusus provider setelah pemilihan transport, preferensi profil autentikasi, overlay prompt, dan routing fallback lanjutan setelah failover model/profil.

Gunakan **hook harness agen** ketika perilaku tersebut termasuk dalam runtime yang mengeksekusi sebuah giliran. Harness dapat mengklasifikasikan hasil protokol eksplisit seperti output kosong, reasoning tanpa output terlihat, atau rencana terstruktur tanpa jawaban akhir agar kebijakan fallback model luar dapat membuat keputusan retry.

Jaga kedua seam tetap sempit:

- Inti memiliki kebijakan retry/fallback.
- Plugin provider memiliki petunjuk permintaan/autentikasi/routing khusus provider.
- Plugin harness memiliki klasifikasi percobaan khusus runtime.
- Plugin pihak ketiga mengembalikan petunjuk, bukan mutasi langsung pada state inti.

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
- Satu atau beberapa paket plugin bundel.
- Konfigurasi, dokumentasi, pengujian.

## Contoh kerja: pembuatan gambar

Pembuatan gambar mengikuti bentuk standar:

1. Inti mendefinisikan `ImageGenerationProvider`.
2. Inti mengekspos `registerImageGenerationProvider(...)`.
3. Inti mengekspos `runtime.imageGeneration.generate(...)`.
4. Plugin `openai`, `google`, `fal`, dan `minimax` mendaftarkan implementasi yang didukung vendor.
5. Vendor masa depan mendaftarkan kontrak yang sama tanpa mengubah channel/tool.

Kunci konfigurasi sengaja dipisahkan dari routing analisis visi:

- `agents.defaults.imageModel` menganalisis gambar.
- `agents.defaults.imageGenerationModel` menghasilkan gambar.

Jaga keduanya tetap terpisah agar fallback dan kebijakan tetap eksplisit.

## Provider embedding

Gunakan `embeddingProviders` untuk provider embedding vektor yang dapat digunakan ulang. Kontrak ini sengaja lebih luas daripada memori: tool, pencarian, retrieval, importer, atau plugin fitur masa depan dapat menggunakan embedding tanpa bergantung pada mesin memori.

Pencarian memori dapat menggunakan `embeddingProviders` generik. Kontrak lama `memoryEmbeddingProviders` adalah kompatibilitas yang sudah deprecated sementara provider khusus memori yang ada bermigrasi; provider embedding baru yang dapat digunakan ulang harus menggunakan `embeddingProviders`.

## Checklist review

Sebelum mengirim kapabilitas baru, verifikasi:

- Tidak ada channel/tool yang mengimpor kode vendor secara langsung.
- Helper runtime adalah jalur bersama.
- Setidaknya satu pengujian kontrak menegaskan kepemilikan bundel.
- Dokumentasi konfigurasi menyebutkan model/kunci konfigurasi baru.
- Dokumentasi plugin menjelaskan batas kepemilikan.

Jika sebuah PR melewati lapisan kapabilitas dan meng-hardcode perilaku vendor ke dalam channel/tool, kembalikan dan definisikan kontraknya terlebih dahulu.

## Terkait

- [Internal plugin](/id/plugins/architecture) — model kapabilitas, kepemilikan, pipeline pemuatan, helper runtime.
- [Membangun plugin](/id/plugins/building-plugins) — tutorial plugin pertama.
- [Ikhtisar SDK](/id/plugins/sdk-overview) — peta impor dan referensi API registrasi.
- [Membuat skills](/id/tools/creating-skills) — permukaan kontributor pendamping.
