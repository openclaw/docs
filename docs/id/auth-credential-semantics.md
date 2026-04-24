---
read_when:
    - Bekerja pada resolusi profil autentikasi atau perutean kredensial
    - Men-debug kegagalan autentikasi model atau urutan profil
summary: Semantik kanonis kelayakan kredensial dan resolusi untuk profil autentikasi
title: Semantik kredensial autentikasi
x-i18n:
    generated_at: "2026-04-24T08:57:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: b45da872b9ab177acbac08ce353b6ee31b6a068477ace52e5e5eda32a848d8bb
    source_path: auth-credential-semantics.md
    workflow: 15
---

Dokumen ini mendefinisikan semantik kanonis kelayakan kredensial dan resolusi yang digunakan di seluruh:

- `resolveAuthProfileOrder`
- `resolveApiKeyForProfile`
- `models status --probe`
- `doctor-auth`

Tujuannya adalah menjaga agar perilaku saat pemilihan dan saat runtime tetap selaras.

## Kode Alasan Probe Stabil

- `ok`
- `excluded_by_auth_order`
- `missing_credential`
- `invalid_expires`
- `expired`
- `unresolved_ref`
- `no_model`

## Kredensial Token

Kredensial token (`type: "token"`) mendukung `token` inline dan/atau `tokenRef`.

### Aturan kelayakan

1. Profil token tidak memenuhi syarat ketika `token` dan `tokenRef` keduanya tidak ada.
2. `expires` bersifat opsional.
3. Jika `expires` ada, nilainya harus berupa angka terhingga yang lebih besar dari `0`.
4. Jika `expires` tidak valid (`NaN`, `0`, negatif, tidak terhingga, atau tipe yang salah), profil tidak memenuhi syarat dengan `invalid_expires`.
5. Jika `expires` sudah lewat, profil tidak memenuhi syarat dengan `expired`.
6. `tokenRef` tidak melewati validasi `expires`.

### Aturan resolusi

1. Semantik resolver cocok dengan semantik kelayakan untuk `expires`.
2. Untuk profil yang memenuhi syarat, materi token dapat diresolusikan dari nilai inline atau `tokenRef`.
3. Ref yang tidak dapat diresolusikan menghasilkan `unresolved_ref` dalam output `models status --probe`.

## Pemfilteran Urutan Autentikasi Eksplisit

- Ketika `auth.order.<provider>` atau override urutan auth-store ditetapkan untuk suatu
  penyedia, `models status --probe` hanya mem-probe id profil yang tetap ada dalam
  urutan autentikasi hasil resolusi untuk penyedia tersebut.
- Profil tersimpan untuk penyedia tersebut yang dihilangkan dari urutan eksplisit
  tidak akan dicoba secara diam-diam nanti. Output probe melaporkannya dengan
  `reasonCode: excluded_by_auth_order` dan detail
  `Excluded by auth.order for this provider.`

## Resolusi Target Probe

- Target probe dapat berasal dari profil autentikasi, kredensial environment, atau
  `models.json`.
- Jika suatu penyedia memiliki kredensial tetapi OpenClaw tidak dapat meresolusikan
  kandidat model yang dapat di-probe untuknya, `models status --probe` melaporkan
  `status: no_model` dengan `reasonCode: no_model`.

## Pengaman Kebijakan OAuth SecretRef

- Input SecretRef hanya untuk kredensial statis.
- Jika kredensial profil adalah `type: "oauth"`, objek SecretRef tidak didukung untuk materi kredensial profil tersebut.
- Jika `auth.profiles.<id>.mode` adalah `"oauth"`, input `keyRef`/`tokenRef` berbasis SecretRef untuk profil tersebut ditolak.
- Pelanggaran merupakan kegagalan keras dalam jalur resolusi auth saat startup/reload.

## Pesan Kompatibel dengan Versi Lama

Untuk kompatibilitas skrip, galat probe mempertahankan baris pertama ini tanpa perubahan:

`Auth profile credentials are missing or expired.`

Detail yang ramah manusia dan kode alasan stabil dapat ditambahkan pada baris berikutnya.

## Terkait

- [Manajemen secret](/id/gateway/secrets)
- [Penyimpanan autentikasi](/id/concepts/oauth)
