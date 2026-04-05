---
read_when:
    - Saat mengerjakan resolusi profil auth atau perutean kredensial
    - Saat men-debug kegagalan auth model atau urutan profil
summary: Semantik kanonis kelayakan kredensial dan resolusi untuk profil auth
title: Semantik Kredensial Auth
x-i18n:
    generated_at: "2026-04-05T13:42:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: a4cd3e16cd25eb22c5e707311d06a19df1a59747ee3261c2d32c534a245fd7fb
    source_path: auth-credential-semantics.md
    workflow: 15
---

# Semantik Kredensial Auth

Dokumen ini mendefinisikan semantik kanonis kelayakan kredensial dan resolusi yang digunakan di seluruh:

- `resolveAuthProfileOrder`
- `resolveApiKeyForProfile`
- `models status --probe`
- `doctor-auth`

Tujuannya adalah menjaga perilaku saat pemilihan dan saat runtime tetap selaras.

## Kode Alasan Probe yang Stabil

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

1. Profil token tidak memenuhi syarat ketika `token` dan `tokenRef` sama-sama tidak ada.
2. `expires` bersifat opsional.
3. Jika `expires` ada, nilainya harus berupa angka hingga yang lebih besar dari `0`.
4. Jika `expires` tidak valid (`NaN`, `0`, negatif, tidak hingga, atau tipe yang salah), profil tidak memenuhi syarat dengan `invalid_expires`.
5. Jika `expires` berada di masa lalu, profil tidak memenuhi syarat dengan `expired`.
6. `tokenRef` tidak melewati validasi `expires`.

### Aturan resolusi

1. Semantik resolver cocok dengan semantik kelayakan untuk `expires`.
2. Untuk profil yang memenuhi syarat, materi token dapat diresolusikan dari nilai inline atau `tokenRef`.
3. Ref yang tidak dapat diresolusikan menghasilkan `unresolved_ref` dalam output `models status --probe`.

## Pemfilteran Urutan Auth Eksplisit

- Ketika `auth.order.<provider>` atau override urutan auth-store ditetapkan untuk suatu
  provider, `models status --probe` hanya mem-probe id profil yang tetap berada dalam
  urutan auth yang telah diresolusikan untuk provider tersebut.
- Profil tersimpan untuk provider tersebut yang dihilangkan dari urutan eksplisit
  tidak akan dicoba secara diam-diam nanti. Output probe melaporkannya dengan
  `reasonCode: excluded_by_auth_order` dan detail
  `Dikecualikan oleh auth.order untuk provider ini.`

## Resolusi Target Probe

- Target probe dapat berasal dari profil auth, kredensial environment, atau
  `models.json`.
- Jika suatu provider memiliki kredensial tetapi OpenClaw tidak dapat meresolusikan kandidat
  model yang dapat di-probe untuknya, `models status --probe` melaporkan `status: no_model` dengan
  `reasonCode: no_model`.

## Guard Kebijakan OAuth SecretRef

- Input SecretRef hanya untuk kredensial statis.
- Jika kredensial profil adalah `type: "oauth"`, objek SecretRef tidak didukung untuk materi kredensial profil tersebut.
- Jika `auth.profiles.<id>.mode` adalah `"oauth"`, input `keyRef`/`tokenRef` berbasis SecretRef untuk profil tersebut ditolak.
- Pelanggaran merupakan kegagalan keras dalam jalur resolusi auth saat startup/reload.

## Pesan yang Kompatibel dengan Versi Lama

Untuk kompatibilitas skrip, error probe mempertahankan baris pertama ini tanpa perubahan:

`Auth profile credentials are missing or expired.`

Detail yang ramah bagi manusia dan kode alasan yang stabil dapat ditambahkan pada baris berikutnya.
