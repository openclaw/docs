---
read_when:
    - Mengerjakan resolusi profil autentikasi atau perutean kredensial
    - Men-debug kegagalan autentikasi model atau urutan profil
summary: Semantik kelayakan dan resolusi kredensial kanonis untuk profil autentikasi
title: Semantik kredensial autentikasi
x-i18n:
    generated_at: "2026-04-30T21:02:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 39b9f96159d5a7b793983d07c37a73139a0904abbbc8831267807d6acf5c0037
    source_path: auth-credential-semantics.md
    workflow: 16
---

Dokumen ini mendefinisikan semantik kelayakan dan resolusi kredensial kanonis yang digunakan di seluruh:

- `resolveAuthProfileOrder`
- `resolveApiKeyForProfile`
- `models status --probe`
- `doctor-auth`

Tujuannya adalah menjaga perilaku saat pemilihan dan saat runtime tetap selaras.

## Kode alasan probe stabil

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
4. Jika `expires` tidak valid (`NaN`, `0`, negatif, tidak terbatas, atau jenisnya salah), profil tidak memenuhi syarat dengan `invalid_expires`.
5. Jika `expires` berada di masa lalu, profil tidak memenuhi syarat dengan `expired`.
6. `tokenRef` tidak melewati validasi `expires`.

### Aturan resolusi

1. Semantik resolver cocok dengan semantik kelayakan untuk `expires`.
2. Untuk profil yang memenuhi syarat, material token dapat diresolusi dari nilai inline atau `tokenRef`.
3. Referensi yang tidak dapat diresolusi menghasilkan `unresolved_ref` dalam keluaran `models status --probe`.

## Portabilitas salinan agen

Pewarisan auth agen bersifat read-through. Ketika agen tidak memiliki profil lokal, agen tersebut dapat meresolusi profil dari penyimpanan agen default/utama saat runtime tanpa menyalin material rahasia ke `auth-profiles.json` miliknya sendiri.

Alur salin eksplisit, seperti `openclaw agents add`, menggunakan kebijakan portabilitas ini:

- Profil `api_key` portabel kecuali `copyToAgents: false`.
- Profil `token` portabel kecuali `copyToAgents: false`.
- Profil `oauth` tidak portabel secara default karena token penyegaran dapat bersifat sekali pakai atau sensitif terhadap rotasi.
- Alur OAuth milik penyedia dapat memilih ikut serta dengan `copyToAgents: true` hanya ketika penyalinan material penyegaran lintas agen diketahui aman.

Profil yang tidak portabel tetap tersedia melalui pewarisan read-through kecuali agen target masuk secara terpisah dan membuat profil lokalnya sendiri.

## Pemfilteran urutan auth eksplisit

- Ketika `auth.order.<provider>` atau override urutan penyimpanan auth ditetapkan untuk sebuah penyedia, `models status --probe` hanya mem-probe id profil yang tetap berada dalam urutan auth yang diresolusi untuk penyedia tersebut.
- Profil tersimpan untuk penyedia tersebut yang dihilangkan dari urutan eksplisit tidak dicoba diam-diam nanti. Keluaran probe melaporkannya dengan `reasonCode: excluded_by_auth_order` dan detail `Excluded by auth.order for this provider.`

## Resolusi target probe

- Target probe dapat berasal dari profil auth, kredensial lingkungan, atau `models.json`.
- Jika sebuah penyedia memiliki kredensial tetapi OpenClaw tidak dapat meresolusi kandidat model yang dapat di-probe untuknya, `models status --probe` melaporkan `status: no_model` dengan `reasonCode: no_model`.

## Penemuan kredensial CLI eksternal

- Kredensial khusus runtime yang dimiliki oleh CLI eksternal hanya ditemukan ketika penyedia, runtime, atau profil auth berada dalam cakupan operasi saat ini, atau ketika profil lokal tersimpan untuk sumber eksternal tersebut sudah ada.
- Pemanggil penyimpanan auth sebaiknya memilih mode penemuan CLI eksternal yang eksplisit: `none` untuk auth persisten/plugin saja, `existing` untuk menyegarkan profil CLI eksternal yang sudah tersimpan, atau `scoped` untuk kumpulan penyedia/profil konkret.
- Jalur baca-saja/status meneruskan `allowKeychainPrompt: false`; jalur tersebut hanya menggunakan kredensial CLI eksternal berbasis file dan tidak membaca atau menggunakan ulang hasil macOS Keychain.

## Penjaga Kebijakan SecretRef OAuth

- Input SecretRef hanya untuk kredensial statis.
- Jika kredensial profil adalah `type: "oauth"`, objek SecretRef tidak didukung untuk material kredensial profil tersebut.
- Jika `auth.profiles.<id>.mode` adalah `"oauth"`, input `keyRef`/`tokenRef` berbasis SecretRef untuk profil tersebut ditolak.
- Pelanggaran merupakan kegagalan keras dalam jalur resolusi auth saat startup/reload.

## Pesan yang Kompatibel dengan Legacy

Untuk kompatibilitas skrip, kesalahan probe mempertahankan baris pertama ini tanpa perubahan:

`Auth profile credentials are missing or expired.`

Detail yang ramah manusia dan kode alasan stabil dapat ditambahkan pada baris berikutnya.

## Terkait

- [Manajemen rahasia](/id/gateway/secrets)
- [Penyimpanan auth](/id/concepts/oauth)
