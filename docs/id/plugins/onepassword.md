---
read_when:
    - Anda ingin agen meminta rahasia 1Password yang telah dikurasi
    - Anda memerlukan kebijakan persetujuan per rahasia dan riwayat audit
    - Anda sedang mengonfigurasi akun layanan 1Password untuk OpenClaw
summary: Gunakan plugin 1Password opsional sebagai perantara rahasia agen yang diaudit
title: Broker rahasia 1Password
x-i18n:
    generated_at: "2026-07-19T05:28:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 255ab4fd2c63754fef29d3ea87dcedc9ca2bd2f34bec1f81139e2ce5b6acdba2
    source_path: plugins/onepassword.md
    workflow: 16
---

# Broker rahasia 1Password

Plugin `onepassword` yang disertakan menyediakan satu alat yang dikendalikan kebijakan bagi agen untuk
membaca kumpulan bidang 1Password yang telah dikurasi. Plugin ini dinonaktifkan secara default dan tidak
melakukan apa pun hingga `plugins.entries.onepassword.config` tersedia.

Ini adalah alat agen, bukan penyedia SecretRef. Alat ini tidak menyuntikkan variabel
lingkungan atau me-resolve rahasia konfigurasi OpenClaw.

## Model keamanan

- Hanya autentikasi akun layanan. Token tetap berada dalam file kredensial lokal
  dan tidak pernah diterima dalam `openclaw.json`.
- Hanya registri yang dikurasi. Agen dapat mencantumkan slug yang dikonfigurasi, tetapi plugin tidak pernah
  menginventarisasi vault 1Password.
- Kebijakan `auto`, `approve`, atau `deny` per slug.
- Izin persetujuan kedaluwarsa. Nilai yang di-cache tidak pernah melewati kebijakan saat ini.
- Setiap upaya akses dicatat dalam status SQLite bersama milik OpenClaw. Baris audit
  mencakup alasan yang diberikan; pastikan alasan tidak sensitif. Broker
  tidak pernah menyalin nilai yang diambil atau token layanan ke dalam baris audit.
- Setelah eksekusi alat saat ini, persistensi transkrip milik OpenClaw
  mengganti nilai `get` yang berhasil dengan metadata yang disunting.
- Nilai tersebut terlihat oleh model untuk eksekusi itu. Jika model menyalinnya ke dalam
  pemanggilan alat atau balasan berikutnya, catatan terpisah tersebut berada di luar hook persistensi
  plugin ini. Pertahankan kebijakan tetap sempit dan jangan meminta model mengulangi
  suatu nilai.
- Plugin memanggil `op` satu kali untuk setiap cache miss. Plugin tidak mencoba ulang batas laju atau
  kegagalan lainnya.
- Setiap pemanggilan `op` berjalan dengan lingkungan minimal yang menonaktifkan integrasi
  aplikasi desktop 1Password (`OP_LOAD_DESKTOP_APP_SETTINGS=false`,
  `OP_BIOMETRIC_UNLOCK_ENABLED=false`), sehingga aplikasi 1Password yang terinstal pada
  host Gateway tidak pernah memicu dialog biometrik atau izin macOS.

Berikan akses baca kepada akun layanan hanya untuk vault dan item yang didaftarkan dalam
konfigurasi plugin.

## Sebelum memulai

Anda memerlukan:

- CLI 1Password (`op`) yang terinstal pada host Gateway
- akun layanan 1Password dengan akses ke item yang dipilih
- file token khusus akun layanan

Aktifkan plugin yang disertakan:

```bash
openclaw plugins enable onepassword
```

Buat direktori dan file token di bawah direktori status OpenClaw:

```bash
mkdir -p ~/.openclaw/credentials/onepassword
chmod 700 ~/.openclaw/credentials/onepassword
printf '%s' "$OP_SERVICE_ACCOUNT_TOKEN" > \
  ~/.openclaw/credentials/onepassword/service-account-token
chmod 600 ~/.openclaw/credentials/onepassword/service-account-token
unset OP_SERVICE_ACCOUNT_TOKEN
```

Saat `OPENCLAW_STATE_DIR` ditetapkan, ganti `~/.openclaw` dengan direktori tersebut.
Plugin memperingatkan satu kali saat file token dapat dibaca atau ditulis oleh grup atau
pengguna lain.

## Mengonfigurasi rahasia terdaftar

Tambahkan konfigurasi plugin ke `openclaw.json`:

```jsonc
{
  "plugins": {
    "entries": {
      "onepassword": {
        "enabled": true,
        "config": {
          "vault": "Automation",
          "defaultPolicy": "approve",
          "cacheTtlSeconds": 300,
          "grantTtlHours": 720,
          "opTimeoutMs": 15000,
          "items": {
            "repository-token": {
              "item": "Repository automation token",
              "field": "credential",
              "policy": "approve",
              "description": "Token for repository automation",
            },
            "model-key": {
              "item": "Model provider key",
              "vault": "Agent credentials",
              "policy": "auto",
            },
          },
        },
      },
    },
  },
}
```

Slug menggunakan huruf kecil, angka, dan tanda hubung, diawali dengan huruf atau
angka, serta memuat paling banyak 64 karakter. Registri dapat memuat hingga 32
slug; deskripsi dapat memuat hingga 200 karakter. `field` menerima satu label
atau ID bidang, tidak boleh memuat koma, dan nilai default-nya adalah `credential`.
`vault` tingkat item menggantikan vault default. `opBin` dapat menetapkan jalur
absolut ke executable `op`; jika tidak, plugin me-resolve `op` dari `PATH`.
Judul item tidak boleh diawali dengan tanda hubung.

## Menggunakan alat agen

Nama alatnya adalah `onepassword`.

Cantumkan slug terdaftar:

```json
{ "action": "list" }
```

Hasilnya hanya memuat slug, deskripsi, kebijakan, dan apakah izin tetap
aktif. Hasil tersebut tidak pernah memuat nilai rahasia dan tidak mengkueri 1Password.

Minta satu rahasia:

```json
{
  "action": "get",
  "slug": "repository-token",
  "reason": "Authenticate the requested repository operation"
}
```

`reason` wajib diisi, tidak boleh kosong, dan dibatasi hingga 300 karakter.
`get` yang berhasil mengembalikan nilai beserta slug, judul item, dan
label bidang yang dikonfigurasi.

Skema alat juga mendeklarasikan parameter internal `authorizationNonce`. Lapisan
kebijakan menyuntikkannya setelah mengevaluasi permintaan untuk menyerahkan otorisasi
kepada pemanggilan alat yang mengeksekusi. Jangan pernah menetapkannya secara manual: hook kebijakan menimpa
setiap nilai yang diberikan, dan nilai yang tidak dikenal menyebabkan permintaan gagal.

## Tingkat kebijakan dan persetujuan

- `auto`: segera ambil dan audit permintaan.
- `deny`: blokir dan audit permintaan.
- `approve`: gunakan izin tetap yang belum kedaluwarsa, atau minta manusia untuk mengizinkan sekali,
  selalu mengizinkan, atau menolak.

Izinkan sekali hanya mengotorisasi pemanggilan alat saat ini. Selalu izinkan menulis izin tetap
untuk agen dan slug tersebut ke SQLite; agen lain harus mendapatkan
persetujuan masing-masing. OpenClaw menawarkan selalu izinkan hanya saat pemanggil memiliki identitas agen
yang konkret. Izin tersebut kedaluwarsa setelah `grantTtlHours`, dengan nilai default 720 jam.
Persetujuan yang tidak diselesaikan atau kehabisan waktu akan menolak permintaan; waktu tunggu persetujuan
maksimum adalah 600 detik. Plugin menyimpan hingga 1.024 izin tetap; pada
batas tersebut, izin terlama dikeluarkan dan agennya harus menyetujui akses berikutnya.

Setiap otorisasi yang dievaluasi hanya dapat digunakan satu kali dan diserahkan kepada pemanggilan alat
yang mengeksekusi melalui status SQLite bersama, sehingga penyerahan tersebut juga berfungsi saat lebih dari satu
instans plugin aktif dalam proses Gateway. Otorisasi yang tidak digunakan kedaluwarsa
setelah jendela persetujuan 600 detik.

Cache dalam memori memiliki nilai default 300 detik dan dibatasi oleh registri slug
yang dikonfigurasi. Tetapkan `cacheTtlSeconds` ke `0` untuk menonaktifkannya. Kebijakan dievaluasi
sebelum setiap pencarian cache, dan cache hit diaudit. Pemuatan ulang konfigurasi runtime
berlaku pada setiap batas kebijakan dan eksekusi; menonaktifkan plugin atau
menghapus, menolak, atau mengubah target slug akan membatalkan otorisasi tertunda dan
nilai yang di-cache.

## Memeriksa status dan riwayat audit

Tampilkan kesiapan dan jumlah registri:

```bash
openclaw onepassword status
```

Perintah ini melaporkan apakah file token tersedia, apakah `op` berhasil di-resolve beserta jalurnya,
jumlah item terdaftar, dan jumlah per kebijakan. Perintah ini tidak pernah membaca atau mencetak
token maupun nilai rahasia.

Tampilkan 50 baris audit terbaru:

```bash
openclaw onepassword audit
openclaw onepassword audit --limit 100
```

Baris diurutkan dari yang terbaru dan menampilkan stempel waktu, agen, slug, hasil, `errorCode`
saat upaya gagal, serta alasan yang dipotong. Alasan disimpan sebagaimana
diberikan; broker tidak pernah menambahkan nilai yang diambil ke log audit.

## Perilaku CLI 1Password

Setiap cache miss menjalankan `op item get` dengan item, vault, dan pemilih
bidang persis yang dikonfigurasi, output JSON, batas waktu terbatas, dan `--cache=false`. Proses anak
hanya menerima bidang tersebut, bukan item lengkap. Hanya
`OP_SERVICE_ACCOUNT_TOKEN` dan `HOME` yang tersedia dalam lingkungan proses anak.

Plugin melakukan satu upaya. Error `RATE_LIMITED` harus ditangani dengan menunggu
sebelum permintaan agen berikutnya; plugin tidak membuat perulangan percobaan ulang
otomatis.

## Kode error

Upaya yang gagal memuat satu kode error tertutup dalam hasil alat dan baris
audit.

Error akses 1Password:

| Kode              | Arti                                                             |
| ----------------- | ---------------------------------------------------------------- |
| `TOKEN_MISSING`   | File token tidak tersedia atau kosong                            |
| `OP_NOT_FOUND`    | Binary `op` tidak dapat di-resolve                               |
| `ITEM_NOT_FOUND`  | Item yang dikonfigurasi tidak ada dalam vault                    |
| `FIELD_NOT_FOUND` | Bidang yang dikonfigurasi tidak ada pada item; label yang tersedia dicantumkan |
| `RATE_LIMITED`    | Batas laju akun layanan 1Password tercapai                       |
| `AUTH_FAILED`     | Autentikasi akun layanan gagal                                   |
| `TIMEOUT`         | `op` melampaui `opTimeoutMs`                                 |
| `OP_ERROR`        | Kegagalan `op` lainnya atau output tidak valid                   |

Error kebijakan dan validasi:

| Kode                                               | Arti                                                                         |
| -------------------------------------------------- | ---------------------------------------------------------------------------- |
| `INVALID_ACTION`, `INVALID_REASON`, `INVALID_SLUG` | Permintaan gagal dalam validasi input                                        |
| `UNKNOWN_SLUG`                                     | Slug tidak ada dalam registri yang dikonfigurasi                             |
| `TOOL_CALL_ID_MISSING`                             | Pemanggilan tiba tanpa ID pemanggilan alat                                   |
| `POLICY_NOT_EVALUATED`                             | Tidak ada otorisasi yang cocok untuk pemanggilan ini; permintaan tidak disetujui kebijakan |
| `POLICY_CHANGED`                                   | Konfigurasi berubah antara persetujuan dan eksekusi                          |
| `GRANT_EXPIRED`                                    | Izin tetap kedaluwarsa sebelum eksekusi                                      |
| `APPROVAL_CANCELLED`                               | Proses dibatalkan saat persetujuan masih tertunda                            |
