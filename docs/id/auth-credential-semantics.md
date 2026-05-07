---
read_when:
    - Menangani resolusi profil autentikasi atau perutean kredensial
    - Men-debug kegagalan autentikasi model atau urutan profil
summary: Semantik kelayakan dan resolusi kredensial kanonis untuk profil autentikasi
title: Semantik kredensial autentikasi
x-i18n:
    generated_at: "2026-05-07T13:13:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2d916ff95ca2ac1fe21e66f64b887b1df1e6b97d7dcc681e5bb9a9dee8ce9473
    source_path: auth-credential-semantics.md
    workflow: 16
---

Dokumen ini mendefinisikan semantik kelayakan dan resolusi kredensial kanonis yang digunakan di seluruh:

- `resolveAuthProfileOrder`
- `resolveApiKeyForProfile`
- `models status --probe`
- `doctor-auth`

Tujuannya adalah menjaga perilaku saat pemilihan dan runtime tetap selaras.

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
4. Jika `expires` tidak valid (`NaN`, `0`, negatif, tidak terbatas, atau tipe salah), profil tidak memenuhi syarat dengan `invalid_expires`.
5. Jika `expires` berada di masa lalu, profil tidak memenuhi syarat dengan `expired`.
6. `tokenRef` tidak melewati validasi `expires`.

### Aturan resolusi

1. Semantik resolver cocok dengan semantik kelayakan untuk `expires`.
2. Untuk profil yang memenuhi syarat, material token dapat diresolusikan dari nilai inline atau `tokenRef`.
3. Ref yang tidak dapat diresolusikan menghasilkan `unresolved_ref` dalam output `models status --probe`.

## Portabilitas salinan agen

Pewarisan auth agen bersifat read-through. Ketika agen tidak memiliki profil lokal, agen dapat meresolusikan profil dari penyimpanan agen default/utama saat runtime tanpa menyalin material rahasia ke `auth-profiles.json` miliknya sendiri.

Alur penyalinan eksplisit, seperti `openclaw agents add`, menggunakan kebijakan portabilitas ini:

- Profil `api_key` bersifat portabel kecuali `copyToAgents: false`.
- Profil `token` bersifat portabel kecuali `copyToAgents: false`.
- Profil `oauth` tidak portabel secara default karena token refresh dapat bersifat sekali pakai atau sensitif terhadap rotasi.
- Alur OAuth milik penyedia dapat ikut serta dengan `copyToAgents: true` hanya ketika penyalinan material refresh antar agen diketahui aman.

Profil non-portabel tetap tersedia melalui pewarisan read-through kecuali agen target masuk secara terpisah dan membuat profil lokalnya sendiri.

## Rute auth khusus konfigurasi

Entri `auth.profiles` dengan `mode: "aws-sdk"` adalah metadata perutean, bukan kredensial tersimpan. Entri tersebut valid ketika penyedia target menggunakan `models.providers.<id>.auth: "aws-sdk"` atau rute AWS SDK default Amazon Bedrock bawaan. Id profil ini dapat muncul di `auth.order` dan override sesi meskipun tidak ada entri yang cocok di `auth-profiles.json`.

Jangan tulis `type: "aws-sdk"` ke `auth-profiles.json`. Jika instalasi lama memiliki penanda seperti itu, `openclaw doctor --fix` memindahkannya ke `auth.profiles` dan menghapus penanda dari penyimpanan kredensial.

## Pemfilteran urutan auth eksplisit

- Ketika `auth.order.<provider>` atau override urutan auth-store diatur untuk sebuah penyedia, `models status --probe` hanya mem-probe id profil yang tetap berada dalam urutan auth yang diresolusikan untuk penyedia tersebut.
- Profil tersimpan untuk penyedia tersebut yang dihilangkan dari urutan eksplisit tidak dicoba diam-diam nanti. Output probe melaporkannya dengan `reasonCode: excluded_by_auth_order` dan detail `Excluded by auth.order for this provider.`

## Resolusi target probe

- Target probe dapat berasal dari profil auth, kredensial lingkungan, atau `models.json`.
- Jika sebuah penyedia memiliki kredensial tetapi OpenClaw tidak dapat meresolusikan kandidat model yang dapat di-probe untuknya, `models status --probe` melaporkan `status: no_model` dengan `reasonCode: no_model`.

## Penemuan kredensial CLI eksternal

- Kredensial khusus runtime yang dimiliki oleh CLI eksternal hanya ditemukan ketika penyedia, runtime, atau profil auth berada dalam cakupan operasi saat ini, atau ketika profil lokal tersimpan untuk sumber eksternal tersebut sudah ada.
- Pemanggil auth-store harus memilih mode penemuan CLI eksternal eksplisit: `none` hanya untuk auth tersimpan/Plugin, `existing` untuk menyegarkan profil CLI eksternal yang sudah tersimpan, atau `scoped` untuk set penyedia/profil konkret.
- Jalur baca-saja/status meneruskan `allowKeychainPrompt: false`; jalur tersebut hanya menggunakan kredensial CLI eksternal berbasis file dan tidak membaca atau menggunakan ulang hasil macOS Keychain.

## Guard Kebijakan OAuth SecretRef

- Input SecretRef hanya untuk kredensial statis.
- Jika kredensial profil adalah `type: "oauth"`, objek SecretRef tidak didukung untuk material kredensial profil tersebut.
- Jika `auth.profiles.<id>.mode` adalah `"oauth"`, input `keyRef`/`tokenRef` berbasis SecretRef untuk profil tersebut ditolak.
- Pelanggaran adalah kegagalan keras dalam jalur resolusi auth startup/reload.

## Pesan yang Kompatibel dengan Legacy

Untuk kompatibilitas skrip, error probe mempertahankan baris pertama ini tanpa perubahan:

`Auth profile credentials are missing or expired.`

Detail yang ramah manusia dan kode alasan stabil dapat ditambahkan pada baris berikutnya.

## Terkait

- [Manajemen rahasia](/id/gateway/secrets)
- [Penyimpanan auth](/id/concepts/oauth)
