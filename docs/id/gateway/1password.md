---
read_when:
    - Anda ingin menyimpan kunci API di luar openclaw.json dan di dalam 1Password
    - Anda menjalankan Gateway tanpa antarmuka dan memerlukan autentikasi akun layanan untuk op
    - Anda ingin agen membaca atau menyisipkan rahasia dengan CLI `op`
summary: Selesaikan secret Gateway dengan CLI 1Password dan izinkan agen menggunakan skill 1password yang disertakan
title: 1Password
x-i18n:
    generated_at: "2026-07-16T18:02:29Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: dbe92009cd4409ae8e7235f5462f059783d5ca863557f1a7b12cacd47ee718c9
    source_path: gateway/1password.md
    workflow: 16
---

OpenClaw terintegrasi dengan **1Password** dalam dua cara yang independen:

- **Rahasia konfigurasi:** setiap bidang [SecretRef](/id/gateway/secrets) di `openclaw.json` dapat diresolusikan melalui CLI `op` saat runtime, sehingga kunci API tidak pernah disimpan dalam file konfigurasi.
- **Alur kerja agen:** skill bawaan `1password` mengajarkan agen untuk masuk serta membaca atau menginjeksikan rahasia dengan `op` bagi tugas mereka sendiri.

## Persyaratan

- [CLI 1Password](https://developer.1password.com/docs/cli/get-started/) (`op`) terinstal di host Gateway (`brew install 1password-cli` di macOS).
- Mode autentikasi untuk `op`:
  - **Akun layanan** (disarankan untuk Gateway tanpa antarmuka): ekspor `OP_SERVICE_ACCOUNT_TOKEN` di lingkungan layanan Gateway. Tidak memerlukan aplikasi desktop maupun proses masuk interaktif.
  - **Integrasi aplikasi desktop**: aplikasi 1Password berjalan di mesin yang sama dengan integrasi CLI diaktifkan. Pemanggilan pertama mungkin memicu Touch ID atau autentikasi sistem.
  - **Proses masuk mandiri**: `op signin` meminta autentikasi pada setiap sesi. Dapat digunakan oleh agen melalui skill, tetapi tidak cocok untuk resolusi rahasia konfigurasi pada Gateway tanpa antarmuka.

## Meresolusikan rahasia konfigurasi dengan op

Deklarasikan penyedia rahasia exec yang menjalankan `op read` dengan referensi `op://vault/item/field`, lalu arahkan setiap bidang yang mendukung SecretRef kepadanya:

```json5
{
  secrets: {
    providers: {
      onepassword_openai: {
        source: "exec",
        command: "/opt/homebrew/bin/op",
        allowSymlinkCommand: true, // diperlukan untuk biner Homebrew yang ditautkan secara simbolis
        trustedDirs: ["/opt/homebrew"],
        args: ["read", "op://Personal/OpenClaw QA API Key/password"],
        passEnv: ["HOME"],
        jsonOnly: false,
      },
    },
  },
  models: {
    providers: {
      openai: {
        baseUrl: "https://api.openai.com/v1",
        models: [{ id: "gpt-5", name: "gpt-5" }],
        apiKey: { source: "exec", provider: "onepassword_openai", id: "value" },
      },
    },
  },
}
```

Cara komponen-komponen tersebut bekerja bersama:

- `command` harus berupa path absolut; `trustedDirs` menandai direktorinya sebagai tepercaya, dan `allowSymlinkCommand` diperlukan karena Homebrew menginstal `op` sebagai tautan simbolis.
- `args` meneruskan referensi `op://vault/item/field` apa adanya. OpenClaw tidak mengurai skema `op://` sendiri; biner `op` yang meresolusikannya.
- `passEnv` meneruskan variabel yang tercantum dari lingkungan Gateway. Integrasi aplikasi desktop memerlukan `HOME`; akun layanan juga memerlukan `OP_SERVICE_ACCOUNT_TOKEN` tersedia di lingkungan layanan Gateway (tambahkan ke `passEnv`, atau atur melalui `env` hanya jika Anda menerima bahwa token dapat dibaca dalam file konfigurasi).
- Untuk keluaran bernilai tunggal, pertahankan `id: "value"`. Dengan `jsonOnly: true` dan payload JSON, akses bidang menggunakan id penunjuk JSON.
- Satu entri penyedia per rahasia menjaga referensi tetap dapat diaudit; beri nama penyedia berdasarkan konsumennya (`onepassword_openai`, `onepassword_telegram`).

Lihat [Rahasia Gateway](/id/gateway/secrets) untuk urutan resolusi, caching, dan semantik kegagalan, serta [Permukaan Kredensial SecretRef](/id/reference/secretref-credential-surface) untuk setiap bidang yang menerima SecretRef.

## Penyiapan akun layanan untuk Gateway tanpa antarmuka

1. Buat akun layanan di akun 1Password Anda dan berikan akses baca hanya ke item brankas yang diperlukan Gateway.
2. Sediakan `OP_SERVICE_ACCOUNT_TOKEN` bagi layanan Gateway (plist launchd, unit systemd, atau env kontainer).
3. Tambahkan `"OP_SERVICE_ACCOUNT_TOKEN"` ke daftar `passEnv` penyedia.
4. Verifikasi dari lingkungan host Gateway: `op whoami` seharusnya menampilkan akun layanan tanpa meminta autentikasi.

Pembacaan oleh akun layanan mengharuskan nama brankas dicantumkan secara eksplisit dalam referensi `op://`. Batasi cakupan akun secara ketat; akun tersebut merupakan kredensial bearer.

## Skill 1password untuk agen

OpenClaw menyertakan skill `1password` yang menjadikan agen sebagai operator `op` yang kompeten: skill ini mendeteksi mode autentikasi yang tersedia (akun layanan, integrasi aplikasi desktop, atau proses masuk mandiri), memverifikasi akses dengan `op whoami` sebelum membaca apa pun, dan mengutamakan `op run` / `op inject` daripada menulis nilai rahasia ke disk. Skill ini memerlukan biner `op` dan menawarkan instalasi Homebrew jika biner tersebut tidak tersedia.

Agen menggunakannya untuk alur kerja mereka sendiri, misalnya membaca token deployment di tengah tugas atau menginjeksikan variabel lingkungan ke dalam perintah. Ini terpisah dari resolusi rahasia konfigurasi; Gateway meresolusikan SecretRef tanpa melibatkan skill apa pun.

## Catatan keamanan

- Nilai rahasia yang diresolusikan melalui penyedia exec tetap berada dalam memori Gateway; snapshot konfigurasi dan respons `config.get` menyamarkan bidang SecretRef.
- Jangan pernah menempatkan nilai rahasia dalam `openclaw.json`, log, atau percakapan. Simpan nama item dalam konfigurasi dan nilainya dalam 1Password.
- Jejak audit 1Password menampilkan setiap pembacaan oleh akun layanan, sehingga rotasi kunci dan peninjauan insiden dapat dilakukan secara praktis.

## Pemecahan masalah

- `command not found` atau kesalahan pemunculan proses: gunakan path absolut `op` dan sertakan direktorinya dalam `trustedDirs`.
- `op` berhasil diresolusikan tetapi pembacaan gagal dengan kesalahan tautan simbolis: atur `allowSymlinkCommand: true` untuk instalasi Homebrew.
- `account is not signed in`: untuk akun layanan, pastikan `OP_SERVICE_ACCOUNT_TOKEN` mencapai layanan Gateway dan tercantum dalam `passEnv`; untuk integrasi desktop, pastikan aplikasi berjalan dan tidak terkunci.
- Pembacaan pertama lambat: naikkan `timeoutMs` pada penyedia; proses mulai dingin `op` dapat melampaui batas waktu yang ketat pada host yang sibuk.
