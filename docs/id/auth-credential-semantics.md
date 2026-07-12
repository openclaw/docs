---
read_when:
    - Menangani resolusi profil autentikasi atau perutean kredensial
    - Men-debug kegagalan autentikasi model atau urutan profil
summary: Semantik kelayakan dan resolusi kredensial kanonis untuk profil autentikasi
title: Semantik kredensial autentikasi
x-i18n:
    generated_at: "2026-07-12T13:57:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6b0516b1bb23f400d5ac5fd39a628736034440216ac22823eef061b38564dff0
    source_path: auth-credential-semantics.md
    workflow: 16
---

Semantik ini menjaga perilaku autentikasi saat pemilihan dan saat runtime tetap selaras. Semantik ini digunakan bersama oleh:

- `resolveAuthProfileOrder` (pengurutan profil)
- `resolveApiKeyForProfile` (resolusi kredensial runtime)
- `openclaw models status --probe`
- pemeriksaan autentikasi `openclaw doctor` (`doctor-auth`)

## Kode alasan probe yang stabil

Hasil probe membawa kelompok `status` (`ok`, `auth`, `rate_limit`, `billing`, `timeout`, `format`, `unknown`, `no_model`) serta `reasonCode` yang stabil ketika probe tidak pernah mencapai pemanggilan model:

| `reasonCode`             | Arti                                                                                          |
| ------------------------ | --------------------------------------------------------------------------------------------- |
| `excluded_by_auth_order` | Profil tidak disertakan dalam urutan autentikasi eksplisit untuk penyedianya.                  |
| `missing_credential`     | Tidak ada kredensial inline atau SecretRef yang dikonfigurasi.                                 |
| `expired`                | Token `expires` sudah melewati waktunya.                                                       |
| `invalid_expires`        | `expires` bukan stempel waktu Unix dalam milidetik yang positif dan valid.                     |
| `unresolved_ref`         | SecretRef yang dikonfigurasi tidak dapat diresolusi.                                           |
| `ineligible_profile`     | Profil tidak kompatibel dengan konfigurasi penyedia (termasuk masukan kunci yang tidak valid). |
| `no_model`               | Kredensial tersedia, tetapi tidak ada kandidat model yang dapat diprobe yang berhasil diresolusi. |

Pemeriksaan kelayakan melaporkan `ok` sebagai kode alasan untuk kredensial yang dapat digunakan.

## Kredensial token

Kredensial token (`type: "token"`) mendukung `token` inline dan/atau `tokenRef`.

### Aturan kelayakan

1. Profil token tidak memenuhi syarat ketika `token` dan `tokenRef` sama-sama tidak tersedia (`missing_credential`).
2. `expires` bersifat opsional. Jika tersedia, nilainya harus berupa jumlah milidetik epoch Unix terbatas yang lebih besar dari `0` dan tidak melebihi stempel waktu maksimum `Date` JavaScript (8640000000000000).
3. Jika `expires` tidak valid (tipe salah, `NaN`, `0`, negatif, tidak terbatas, atau melampaui nilai maksimum tersebut), profil tidak memenuhi syarat dengan `invalid_expires`.
4. Jika `expires` sudah berlalu, profil tidak memenuhi syarat dengan `expired`.
5. `tokenRef` tidak melewati validasi `expires`.

### Aturan resolusi

1. Semantik resolver sesuai dengan semantik kelayakan untuk `expires`.
2. Untuk profil yang memenuhi syarat, materi token dapat diresolusi dari nilai inline atau `tokenRef`.
3. Referensi yang tidak dapat diresolusi menghasilkan `unresolved_ref` dalam keluaran `models status --probe`.

## Portabilitas penyalinan agen

Pewarisan autentikasi agen menggunakan pembacaan langsung. Ketika agen tidak memiliki profil lokal, agen tersebut meresolusi profil dari penyimpanan agen utama/bawaan saat runtime tanpa menyalin materi rahasia ke penyimpanan kredensialnya sendiri (`agents/<agentId>/agent/openclaw-agent.sqlite`).

Alur penyalinan eksplisit, seperti `openclaw agents add`, menggunakan kebijakan portabilitas ini:

- Profil `api_key` dan `token` bersifat portabel kecuali jika `copyToAgents: false`.
- Profil `oauth` secara bawaan tidak bersifat portabel karena token penyegaran dapat bersifat sekali pakai atau sensitif terhadap rotasi.
- Alur OAuth milik penyedia dapat mengaktifkannya dengan `copyToAgents: true` hanya jika penyalinan materi penyegaran antaragen diketahui aman; pengaktifan ini hanya berlaku ketika profil membawa materi akses/penyegaran inline.

Profil yang tidak portabel tetap tersedia melalui pewarisan pembacaan langsung, kecuali agen tujuan masuk secara terpisah dan membuat profil lokalnya sendiri.

## Rute autentikasi khusus konfigurasi

Entri `auth.profiles` dengan `mode: "aws-sdk"` merupakan metadata perutean, bukan kredensial tersimpan. Entri ini valid ketika penyedia tujuan menggunakan `models.providers.<id>.auth: "aws-sdk"`, yaitu rute yang ditulis oleh penyiapan Amazon Bedrock milik Plugin. ID profil ini dapat muncul dalam `auth.order` dan penggantian sesi meskipun tidak ada entri yang sesuai dalam penyimpanan kredensial.

Jangan menulis `type: "aws-sdk"` ke penyimpanan kredensial; kredensial tersimpan hanya berupa `api_key`, `token`, atau `oauth`. Jika `auth-profiles.json` lama memiliki penanda seperti itu, `openclaw doctor --fix` memindahkannya ke `auth.profiles` dan menghapus penanda tersebut dari penyimpanan.

## Pemfilteran urutan autentikasi eksplisit

- Ketika `auth.order.<provider>` atau penggantian urutan penyimpanan autentikasi ditetapkan untuk suatu penyedia, `models status --probe` hanya memprobe ID profil yang tetap berada dalam urutan autentikasi hasil resolusi untuk penyedia tersebut. Penggantian tersimpan lebih diutamakan daripada konfigurasi `auth.order`.
- Profil tersimpan untuk penyedia tersebut yang tidak disertakan dalam urutan eksplisit tidak dicoba secara diam-diam di kemudian waktu. Keluaran probe melaporkannya dengan `reasonCode: excluded_by_auth_order` dan detail `Dikecualikan oleh auth.order untuk penyedia ini.`

## Resolusi target probe

- Target probe dapat berasal dari profil autentikasi, kredensial lingkungan, atau `models.json` (`source` hasil: `profile`, `env`, `models.json`).
- Jika penyedia memiliki kredensial tetapi OpenClaw tidak dapat meresolusi kandidat model yang dapat diprobe untuknya, `models status --probe` melaporkan `status: no_model` dengan `reasonCode: no_model`.

## Penemuan kredensial CLI eksternal

- Kredensial khusus runtime yang dimiliki CLI eksternal (Claude CLI untuk `claude-cli`, Codex CLI untuk `openai`, MiniMax CLI untuk `minimax-portal`) hanya ditemukan ketika penyedia, runtime, atau profil autentikasi berada dalam cakupan operasi saat ini, atau ketika profil lokal tersimpan untuk sumber eksternal tersebut sudah ada.
- Pemanggil penyimpanan autentikasi memilih mode penemuan CLI eksternal secara eksplisit: `none` hanya untuk autentikasi tersimpan/Plugin, `existing` untuk menyegarkan profil CLI eksternal yang sudah tersimpan, atau `scoped` untuk sekumpulan penyedia/profil tertentu.
- Jalur hanya-baca/status meneruskan `allowKeychainPrompt: false`; jalur tersebut hanya menggunakan kredensial CLI eksternal berbasis berkas dan tidak membaca atau menggunakan kembali hasil macOS Keychain.

## Pengaman kebijakan SecretRef OAuth

Masukan SecretRef hanya ditujukan untuk kredensial statis. Kredensial OAuth dapat berubah saat runtime (alur penyegaran menyimpan token yang telah dirotasi), sehingga materi OAuth berbasis SecretRef akan membagi status yang dapat berubah ke beberapa penyimpanan.

- Jika kredensial profil memiliki `type: "oauth"`, objek SecretRef ditolak untuk semua bidang materi kredensial pada profil tersebut.
- Jika `auth.profiles.<id>.mode` adalah `"oauth"`, masukan `keyRef`/`tokenRef` berbasis SecretRef untuk profil tersebut ditolak.
- Pelanggaran merupakan kegagalan fatal (galat yang dilempar) dalam jalur persiapan rahasia saat mulai/muat ulang dan resolusi profil.

## Pesan yang kompatibel dengan versi lama

Demi kompatibilitas skrip, galat probe mempertahankan baris pertama ini tanpa perubahan:

`Auth profile credentials are missing or expired.`

Detail yang mudah dipahami dan kode alasan yang stabil menyusul pada baris-baris berikutnya dalam bentuk `↳ Auth reason [code]: ...`.

## Terkait

- [Pengelolaan rahasia](/id/gateway/secrets)
- [Penyimpanan autentikasi](/id/concepts/oauth)
