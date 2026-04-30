---
read_when:
    - Mengerjakan penyelesaian profil autentikasi atau perutean kredensial
    - Pemecahan masalah kegagalan autentikasi model atau urutan profil
summary: Semantik kelayakan dan resolusi kredensial kanonis untuk profil autentikasi
title: Semantik kredensial autentikasi
x-i18n:
    generated_at: "2026-04-30T09:32:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0525a71d3f08b7aa95e2f06acc6c23d87cd92d6b5fe4fc050ecf2b7caff84b3f
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

Kredensial token (`type: "token"`) mendukung `token` sebaris dan/atau `tokenRef`.

### Aturan kelayakan

1. Profil token tidak memenuhi syarat ketika `token` dan `tokenRef` sama-sama tidak ada.
2. `expires` bersifat opsional.
3. Jika `expires` ada, nilainya harus berupa angka terbatas yang lebih besar dari `0`.
4. Jika `expires` tidak valid (`NaN`, `0`, negatif, tidak terbatas, atau tipe salah), profil tidak memenuhi syarat dengan `invalid_expires`.
5. Jika `expires` berada di masa lalu, profil tidak memenuhi syarat dengan `expired`.
6. `tokenRef` tidak melewati validasi `expires`.

### Aturan resolusi

1. Semantik resolver cocok dengan semantik kelayakan untuk `expires`.
2. Untuk profil yang memenuhi syarat, material token dapat diresolusikan dari nilai sebaris atau `tokenRef`.
3. Ref yang tidak dapat diresolusikan menghasilkan `unresolved_ref` dalam keluaran `models status --probe`.

## Portabilitas salinan agen

Pewarisan autentikasi agen bersifat read-through. Ketika agen tidak memiliki profil lokal, agen tersebut dapat meresolusikan profil dari penyimpanan agen default/utama saat runtime tanpa menyalin material rahasia ke dalam `auth-profiles.json` miliknya sendiri.

Alur penyalinan eksplisit, seperti `openclaw agents add`, menggunakan kebijakan portabilitas ini:

- Profil `api_key` portabel kecuali `copyToAgents: false`.
- Profil `token` portabel kecuali `copyToAgents: false`.
- Profil `oauth` tidak portabel secara default karena token refresh dapat bersifat sekali pakai atau sensitif terhadap rotasi.
- Alur OAuth milik provider dapat ikut serta dengan `copyToAgents: true` hanya ketika penyalinan material refresh lintas agen diketahui aman.

Profil yang tidak portabel tetap tersedia melalui pewarisan read-through kecuali agen target masuk secara terpisah dan membuat profil lokalnya sendiri.

## Pemfilteran urutan autentikasi eksplisit

- Ketika `auth.order.<provider>` atau penggantian urutan auth-store ditetapkan untuk suatu provider, `models status --probe` hanya memeriksa id profil yang tetap berada dalam urutan autentikasi yang diresolusikan untuk provider tersebut.
- Profil tersimpan untuk provider tersebut yang dihilangkan dari urutan eksplisit tidak dicoba diam-diam nanti. Keluaran probe melaporkannya dengan `reasonCode: excluded_by_auth_order` dan detail `Excluded by auth.order for this provider.`

## Resolusi target probe

- Target probe dapat berasal dari profil autentikasi, kredensial lingkungan, atau `models.json`.
- Jika provider memiliki kredensial tetapi OpenClaw tidak dapat meresolusikan kandidat model yang dapat diprobe untuknya, `models status --probe` melaporkan `status: no_model` dengan `reasonCode: no_model`.

## Penemuan kredensial CLI eksternal

- Kredensial khusus runtime milik CLI eksternal ditemukan hanya ketika provider, runtime, atau profil autentikasi berada dalam cakupan operasi saat ini, atau ketika profil lokal tersimpan untuk sumber eksternal tersebut sudah ada.
- Jalur baca-saja/status meneruskan `allowKeychainPrompt: false`; jalur tersebut hanya menggunakan kredensial CLI eksternal berbasis file dan tidak membaca atau menggunakan ulang hasil macOS Keychain.

## Pelindung Kebijakan SecretRef OAuth

- Input SecretRef hanya untuk kredensial statis.
- Jika kredensial profil adalah `type: "oauth"`, objek SecretRef tidak didukung untuk material kredensial profil tersebut.
- Jika `auth.profiles.<id>.mode` adalah `"oauth"`, input `keyRef`/`tokenRef` berbasis SecretRef untuk profil tersebut ditolak.
- Pelanggaran adalah kegagalan keras dalam jalur resolusi autentikasi startup/reload.

## Pesan yang Kompatibel dengan Legacy

Untuk kompatibilitas skrip, kesalahan probe mempertahankan baris pertama ini tanpa perubahan:

`Auth profile credentials are missing or expired.`

Detail yang ramah manusia dan kode alasan yang stabil dapat ditambahkan pada baris berikutnya.

## Terkait

- [Manajemen rahasia](/id/gateway/secrets)
- [Penyimpanan autentikasi](/id/concepts/oauth)
