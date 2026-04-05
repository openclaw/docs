---
read_when:
    - Men-debug autentikasi model atau kedaluwarsa OAuth
    - Mendokumentasikan autentikasi atau penyimpanan kredensial
summary: 'Autentikasi model: OAuth, kunci API, dan penggunaan ulang Claude CLI'
title: Autentikasi
x-i18n:
    generated_at: "2026-04-05T13:53:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1c0ceee7d10fe8d10345f32889b63425d81773f3a08d8ecd3fd88d965b207ddc
    source_path: gateway/authentication.md
    workflow: 15
---

# Autentikasi (Penyedia Model)

<Note>
Halaman ini membahas autentikasi **penyedia model** (kunci API, OAuth, penggunaan ulang Claude CLI). Untuk autentikasi **koneksi gateway** (token, kata sandi, trusted-proxy), lihat [Configuration](/gateway/configuration) dan [Trusted Proxy Auth](/gateway/trusted-proxy-auth).
</Note>

OpenClaw mendukung OAuth dan kunci API untuk penyedia model. Untuk host gateway
yang selalu aktif, kunci API biasanya merupakan opsi yang paling dapat diprediksi. Alur
langganan/OAuth juga didukung jika sesuai dengan model akun penyedia Anda.

Lihat [/concepts/oauth](/concepts/oauth) untuk alur OAuth lengkap dan tata letak
penyimpanan.
Untuk autentikasi berbasis SecretRef (penyedia `env`/`file`/`exec`), lihat [Secrets Management](/gateway/secrets).
Untuk aturan kelayakan kredensial/kode alasan yang digunakan oleh `models status --probe`, lihat
[Semantik Kredensial Auth](/id/auth-credential-semantics).

## Penyiapan yang direkomendasikan (kunci API, penyedia apa pun)

Jika Anda menjalankan gateway jangka panjang, mulailah dengan kunci API untuk
penyedia pilihan Anda.
Khusus untuk Anthropic, autentikasi kunci API adalah jalur yang aman. Penggunaan ulang Claude CLI adalah
jalur penyiapan bergaya langganan lain yang didukung.

1. Buat kunci API di konsol penyedia Anda.
2. Letakkan kunci itu di **host gateway** (mesin yang menjalankan `openclaw gateway`).

```bash
export <PROVIDER>_API_KEY="..."
openclaw models status
```

3. Jika Gateway berjalan di bawah systemd/launchd, sebaiknya letakkan kunci di
   `~/.openclaw/.env` agar daemon dapat membacanya:

```bash
cat >> ~/.openclaw/.env <<'EOF'
<PROVIDER>_API_KEY=...
EOF
```

Lalu mulai ulang daemon (atau mulai ulang proses Gateway Anda) dan periksa kembali:

```bash
openclaw models status
openclaw doctor
```

Jika Anda lebih memilih untuk tidak mengelola env vars sendiri, onboarding dapat menyimpan
kunci API untuk penggunaan daemon: `openclaw onboard`.

Lihat [Help](/help) untuk detail tentang pewarisan env (`env.shellEnv`,
`~/.openclaw/.env`, systemd/launchd).

## Anthropic: kompatibilitas token lama

Autentikasi token setup Anthropic masih tersedia di OpenClaw sebagai
jalur lama/manual. Dokumentasi publik Claude Code Anthropic masih membahas penggunaan terminal
Claude Code secara langsung di bawah paket Claude, tetapi Anthropic secara terpisah memberi tahu
pengguna OpenClaw bahwa jalur login Claude **OpenClaw** dihitung sebagai penggunaan harness pihak ketiga dan memerlukan **Extra Usage** yang ditagih terpisah dari
langganan.

Untuk jalur penyiapan yang paling jelas, gunakan kunci API Anthropic atau migrasikan ke Claude CLI
di host gateway.

Entri token manual (penyedia apa pun; menulis `auth-profiles.json` + memperbarui config):

```bash
openclaw models auth paste-token --provider openrouter
```

Referensi profil auth juga didukung untuk kredensial statis:

- Kredensial `api_key` dapat menggunakan `keyRef: { source, provider, id }`
- Kredensial `token` dapat menggunakan `tokenRef: { source, provider, id }`
- Profil mode OAuth tidak mendukung kredensial SecretRef; jika `auth.profiles.<id>.mode` disetel ke `"oauth"`, input `keyRef`/`tokenRef` berbasis SecretRef untuk profil tersebut akan ditolak.

Pemeriksaan yang ramah otomatisasi (keluar `1` saat kedaluwarsa/tidak ada, `2` saat akan kedaluwarsa):

```bash
openclaw models status --check
```

Probe autentikasi langsung:

```bash
openclaw models status --probe
```

Catatan:

- Baris probe dapat berasal dari profil auth, kredensial env, atau `models.json`.
- Jika `auth.order.<provider>` eksplisit menghilangkan profil yang tersimpan, probe melaporkan
  `excluded_by_auth_order` untuk profil tersebut alih-alih mencobanya.
- Jika autentikasi ada tetapi OpenClaw tidak dapat me-resolve kandidat model yang dapat diprobe untuk
  penyedia itu, probe melaporkan `status: no_model`.
- Cooldown rate limit dapat dibatasi pada model. Profil yang sedang cooldown untuk satu
  model masih dapat digunakan untuk model saudara pada penyedia yang sama.

Script operasi opsional (systemd/Termux) didokumentasikan di sini:
[Script pemantauan auth](/help/scripts#auth-monitoring-scripts)

## Anthropic: migrasi Claude CLI

Jika Claude CLI sudah terinstal dan sudah login di host gateway, Anda dapat
mengalihkan penyiapan Anthropic yang ada ke backend CLI. Ini adalah
jalur migrasi OpenClaw yang didukung untuk menggunakan ulang login Claude CLI lokal di
host tersebut.

Prasyarat:

- `claude` terinstal di host gateway
- Claude CLI sudah login di sana dengan `claude auth login`

```bash
openclaw models auth login --provider anthropic --method cli --set-default
```

Ini mempertahankan profil auth Anthropic Anda yang ada untuk rollback, tetapi mengubah
pemilihan model default menjadi `claude-cli/...` dan menambahkan entri allowlist Claude CLI
yang sesuai di bawah `agents.defaults.models`.

Verifikasi:

```bash
openclaw models status
```

Pintasan onboarding:

```bash
openclaw onboard --auth-choice anthropic-cli
```

`openclaw onboard` interaktif dan `openclaw configure` tetap lebih memilih Claude CLI
untuk Anthropic, tetapi token setup Anthropic kembali tersedia sebagai
jalur lama/manual dan harus digunakan dengan ekspektasi penagihan Extra Usage.

## Memeriksa status autentikasi model

```bash
openclaw models status
openclaw doctor
```

## Perilaku rotasi kunci API (gateway)

Beberapa penyedia mendukung percobaan ulang permintaan dengan kunci alternatif ketika panggilan API
mencapai rate limit penyedia.

- Urutan prioritas:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY` (override tunggal)
  - `<PROVIDER>_API_KEYS`
  - `<PROVIDER>_API_KEY`
  - `<PROVIDER>_API_KEY_*`
- Penyedia Google juga menyertakan `GOOGLE_API_KEY` sebagai fallback tambahan.
- Daftar kunci yang sama dihapus duplikasinya sebelum digunakan.
- OpenClaw mencoba ulang dengan kunci berikutnya hanya untuk kesalahan rate limit (misalnya
  `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many concurrent
requests`, `ThrottlingException`, `concurrency limit reached`, atau
  `workers_ai ... quota limit exceeded`).
- Kesalahan non-rate-limit tidak dicoba ulang dengan kunci alternatif.
- Jika semua kunci gagal, kesalahan akhir dari percobaan terakhir akan dikembalikan.

## Mengontrol kredensial yang digunakan

### Per sesi (perintah chat)

Gunakan `/model <alias-or-id>@<profileId>` untuk menyematkan kredensial penyedia tertentu untuk sesi saat ini (contoh ID profil: `anthropic:default`, `anthropic:work`).

Gunakan `/model` (atau `/model list`) untuk pemilih ringkas; gunakan `/model status` untuk tampilan lengkap (kandidat + profil auth berikutnya, beserta detail endpoint penyedia saat dikonfigurasi).

### Per agen (override CLI)

Setel override urutan profil auth eksplisit untuk suatu agen (disimpan di `auth-profiles.json` milik agen tersebut):

```bash
openclaw models auth order get --provider anthropic
openclaw models auth order set --provider anthropic anthropic:default
openclaw models auth order clear --provider anthropic
```

Gunakan `--agent <id>` untuk menargetkan agen tertentu; hilangkan untuk menggunakan agen default yang dikonfigurasi.
Saat Anda men-debug masalah urutan, `openclaw models status --probe` menampilkan profil tersimpan
yang dihilangkan sebagai `excluded_by_auth_order` alih-alih melewatinya secara diam-diam.
Saat Anda men-debug masalah cooldown, ingat bahwa cooldown rate limit dapat terkait
dengan satu ID model, bukan seluruh profil penyedia.

## Pemecahan masalah

### "No credentials found"

Jika profil Anthropic tidak ada, migrasikan penyiapan itu ke Claude CLI atau kunci API
di **host gateway**, lalu periksa kembali:

```bash
openclaw models status
```

### Token akan kedaluwarsa/sudah kedaluwarsa

Jalankan `openclaw models status` untuk memastikan profil mana yang akan kedaluwarsa. Jika profil token Anthropic lama
tidak ada atau sudah kedaluwarsa, migrasikan penyiapan itu ke Claude CLI
atau kunci API.

## Persyaratan Claude CLI

Hanya diperlukan untuk jalur penggunaan ulang Claude CLI Anthropic:

- Claude Code CLI terinstal (perintah `claude` tersedia)
