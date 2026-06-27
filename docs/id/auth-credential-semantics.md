---
read_when:
    - Mengerjakan resolusi profil autentikasi atau perutean kredensial
    - Men-debug kegagalan autentikasi model atau urutan profil
summary: Semantik kelayakan dan resolusi kredensial kanonis untuk profil auth
title: Semantik kredensial autentikasi
x-i18n:
    generated_at: "2026-06-27T17:08:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 591c0384e1d43512252aaa7b362141b6bc93183b30b5847168758f86127f0663
    source_path: auth-credential-semantics.md
    workflow: 16
---

Dokumen ini mendefinisikan semantik kelayakan dan resolusi kredensial kanonis yang digunakan di seluruh:

- `resolveAuthProfileOrder`
- `resolveApiKeyForProfile`
- `models status --probe`
- `doctor-auth`

Tujuannya adalah menjaga perilaku saat pemilihan dan runtime tetap selaras.

## Kode alasan probe yang stabil

- `ok`
- `excluded_by_auth_order`
- `missing_credential`
- `invalid_expires`
- `expired`
- `unresolved_ref`
- `no_model`

## Kredensial token

Kredensial token (`type: "token"`) mendukung `token` inline dan/atau `tokenRef`.

### Aturan kelayakan

1. Profil token tidak memenuhi syarat ketika `token` dan `tokenRef` sama-sama tidak ada.
2. `expires` bersifat opsional.
3. Jika `expires` ada, nilainya harus berupa angka terbatas yang lebih besar dari `0`.
4. Jika `expires` tidak valid (`NaN`, `0`, negatif, tidak terbatas, atau tipe salah), profil tidak memenuhi syarat dengan `invalid_expires`.
5. Jika `expires` berada di masa lalu, profil tidak memenuhi syarat dengan `expired`.
6. `tokenRef` tidak melewati validasi `expires`.

### Aturan resolusi

1. Semantik resolver cocok dengan semantik kelayakan untuk `expires`.
2. Untuk profil yang memenuhi syarat, materi token dapat di-resolve dari nilai inline atau `tokenRef`.
3. Ref yang tidak dapat di-resolve menghasilkan `unresolved_ref` dalam output `models status --probe`.

## Portabilitas salinan agen

Pewarisan autentikasi agen bersifat read-through. Ketika agen tidak memiliki profil lokal, agen
dapat me-resolve profil dari penyimpanan agen default/utama pada runtime tanpa
menyalin materi rahasia ke `auth-profiles.json` miliknya sendiri.

Alur salin eksplisit, seperti `openclaw agents add`, menggunakan kebijakan portabilitas ini:

- Profil `api_key` portabel kecuali `copyToAgents: false`.
- Profil `token` portabel kecuali `copyToAgents: false`.
- Profil `oauth` secara default tidak portabel karena token refresh dapat bersifat
  sekali pakai atau sensitif terhadap rotasi.
- Alur OAuth milik provider dapat ikut serta dengan `copyToAgents: true` hanya ketika
  penyalinan materi refresh lintas agen diketahui aman.

Profil non-portabel tetap tersedia melalui pewarisan read-through kecuali
agen target masuk secara terpisah dan membuat profil lokalnya sendiri.

## Rute autentikasi khusus konfigurasi

Entri `auth.profiles` dengan `mode: "aws-sdk"` adalah metadata routing, bukan kredensial
tersimpan. Entri tersebut valid ketika provider target menggunakan
`models.providers.<id>.auth: "aws-sdk"` atau rute AWS SDK penyiapan Amazon Bedrock milik plugin.
Id profil ini dapat muncul dalam `auth.order` dan penimpaan sesi
meskipun tidak ada entri yang cocok di `auth-profiles.json`.

Jangan tulis `type: "aws-sdk"` ke dalam `auth-profiles.json`. Jika instalasi lama
memiliki penanda seperti itu, `openclaw doctor --fix` memindahkannya ke `auth.profiles` dan
menghapus penanda tersebut dari penyimpanan kredensial.

## Pemfilteran urutan autentikasi eksplisit

- Ketika `auth.order.<provider>` atau penimpaan urutan auth-store ditetapkan untuk sebuah
  provider, `models status --probe` hanya mem-probe id profil yang tetap berada dalam
  urutan autentikasi yang di-resolve untuk provider tersebut.
- Profil tersimpan untuk provider tersebut yang dihilangkan dari urutan eksplisit
  tidak dicoba diam-diam nanti. Output probe melaporkannya dengan
  `reasonCode: excluded_by_auth_order` dan detail
  `Excluded by auth.order for this provider.`

## Resolusi target probe

- Target probe dapat berasal dari profil autentikasi, kredensial lingkungan, atau
  `models.json`.
- Jika sebuah provider memiliki kredensial tetapi OpenClaw tidak dapat me-resolve kandidat model
  yang dapat di-probe untuknya, `models status --probe` melaporkan `status: no_model` dengan
  `reasonCode: no_model`.

## Penemuan kredensial CLI eksternal

- Kredensial khusus runtime yang dimiliki oleh CLI eksternal ditemukan hanya ketika
  provider, runtime, atau profil autentikasi berada dalam cakupan operasi saat ini, atau
  ketika profil lokal tersimpan untuk sumber eksternal tersebut sudah ada.
- Pemanggil auth-store sebaiknya memilih mode penemuan CLI eksternal yang eksplisit:
  `none` hanya untuk autentikasi persisten/plugin, `existing` untuk menyegarkan profil CLI eksternal
  yang sudah tersimpan, atau `scoped` untuk set provider/profil konkret.
- Jalur baca-saja/status meneruskan `allowKeychainPrompt: false`; jalur tersebut hanya menggunakan
  kredensial CLI eksternal berbasis file dan tidak membaca atau menggunakan kembali hasil macOS Keychain.

## Penjaga Kebijakan OAuth SecretRef

- Input SecretRef hanya untuk kredensial statis.
- Jika kredensial profil adalah `type: "oauth"`, objek SecretRef tidak didukung untuk materi kredensial profil tersebut.
- Jika `auth.profiles.<id>.mode` adalah `"oauth"`, input `keyRef`/`tokenRef` berbasis SecretRef untuk profil tersebut ditolak.
- Pelanggaran adalah kegagalan keras dalam jalur resolusi autentikasi startup/reload.

## Pesan yang Kompatibel dengan Sistem Lama

Untuk kompatibilitas skrip, kesalahan probe mempertahankan baris pertama ini tanpa perubahan:

`Auth profile credentials are missing or expired.`

Detail yang ramah manusia dan kode alasan stabil dapat ditambahkan pada baris berikutnya.

## Terkait

- [Manajemen rahasia](/id/gateway/secrets)
- [Penyimpanan autentikasi](/id/concepts/oauth)
