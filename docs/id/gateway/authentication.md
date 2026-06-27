---
read_when:
    - Men-debug auth model atau kedaluwarsa OAuth
    - Mendokumentasikan autentikasi atau penyimpanan kredensial
summary: 'Autentikasi model: OAuth, kunci API, penggunaan ulang Claude CLI, dan setup-token Anthropic'
title: Autentikasi
x-i18n:
    generated_at: "2026-06-27T17:27:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4b33eff2386ba48797c96b99f3eb80df4df2d5baab9c42b73fc8e5e722f0767b
    source_path: gateway/authentication.md
    workflow: 16
---

<Note>
Halaman ini adalah referensi autentikasi **penyedia model** (kunci API, OAuth, penggunaan ulang Claude CLI, dan token penyiapan Anthropic). Untuk autentikasi **koneksi gateway** (token, kata sandi, trusted-proxy), lihat [Konfigurasi](/id/gateway/configuration) dan [Auth Proxy Tepercaya](/id/gateway/trusted-proxy-auth).
</Note>

OpenClaw mendukung OAuth dan kunci API untuk penyedia model. Untuk host gateway yang selalu aktif,
kunci API biasanya merupakan opsi yang paling dapat diprediksi. Alur langganan/OAuth
juga didukung ketika sesuai dengan model akun penyedia Anda.

Lihat [/concepts/oauth](/id/concepts/oauth) untuk alur OAuth lengkap dan tata letak
penyimpanan.
Untuk auth berbasis SecretRef (penyedia `env`/`file`/`exec`), lihat [Manajemen Rahasia](/id/gateway/secrets).
Untuk aturan kelayakan kredensial/kode alasan yang digunakan oleh `models status --probe`, lihat
[Semantik Kredensial Auth](/id/auth-credential-semantics).

## Penyiapan yang disarankan (kunci API, penyedia apa pun)

Jika Anda menjalankan gateway berumur panjang, mulai dengan kunci API untuk
penyedia pilihan Anda.
Khusus untuk Anthropic, auth kunci API masih merupakan penyiapan server yang
paling dapat diprediksi, tetapi OpenClaw juga mendukung penggunaan ulang login Claude CLI lokal.

1. Buat kunci API di konsol penyedia Anda.
2. Letakkan di **host gateway** (mesin yang menjalankan `openclaw gateway`).

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

Lalu mulai ulang daemon (atau mulai ulang proses Gateway Anda) dan periksa ulang:

```bash
openclaw models status
openclaw doctor
```

Jika Anda lebih suka tidak mengelola env var sendiri, onboarding dapat menyimpan
kunci API untuk penggunaan daemon: `openclaw onboard`.

Lihat [Bantuan](/id/help) untuk detail tentang pewarisan env (`env.shellEnv`,
`~/.openclaw/.env`, systemd/launchd).

## Anthropic: kompatibilitas Claude CLI dan token

Auth token penyiapan Anthropic masih tersedia di OpenClaw sebagai jalur token
yang didukung. Staf Anthropic sejak itu memberi tahu kami bahwa penggunaan Claude CLI bergaya OpenClaw
diizinkan lagi, sehingga OpenClaw memperlakukan penggunaan ulang Claude CLI dan penggunaan `claude -p`
sebagai yang disetujui untuk integrasi ini kecuali Anthropic menerbitkan kebijakan baru. Ketika
penggunaan ulang Claude CLI tersedia di host, sekarang itu adalah jalur yang disarankan.

Untuk host gateway berumur panjang, kunci API Anthropic masih merupakan penyiapan
yang paling dapat diprediksi. Jika Anda ingin menggunakan ulang login Claude yang sudah ada di host yang sama, gunakan
jalur Anthropic Claude CLI di onboarding/configure.

Penyiapan host yang disarankan untuk penggunaan ulang Claude CLI:

```bash
# Run on the gateway host
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

Ini adalah penyiapan dua langkah:

1. Masukkan Claude Code sendiri ke Anthropic pada host gateway.
2. Beri tahu OpenClaw untuk mengalihkan pemilihan model Anthropic ke backend `claude-cli`
   lokal dan menyimpan profil auth OpenClaw yang sesuai.

Jika `claude` tidak ada di `PATH`, instal Claude Code terlebih dahulu atau atur
`agents.defaults.cliBackends.claude-cli.command` ke jalur biner yang sebenarnya.

Entri token manual (penyedia apa pun; menulis penyimpanan auth SQLite per agen + memperbarui config):

```bash
openclaw models auth paste-token --provider openrouter
```

Penyimpanan profil auth hanya menyimpan kredensial. File `auth-profiles.json` lama menggunakan bentuk kanonis ini:

```json
{
  "version": 1,
  "profiles": {
    "openrouter:default": {
      "type": "api_key",
      "provider": "openrouter",
      "key": "OPENROUTER_API_KEY"
    }
  }
}
```

OpenClaw sekarang membaca profil auth dari `openclaw-agent.sqlite` milik tiap agen. Jika instalasi lama masih memiliki `auth-profiles.json`, `auth-state.json`, atau file profil auth datar seperti `{ "openrouter": { "apiKey": "..." } }`, jalankan `openclaw doctor --fix` untuk mengimpornya ke SQLite; doctor menyimpan cadangan bertanda waktu di samping file JSON asli. Detail endpoint seperti `baseUrl`, `api`, id model, header, dan timeout berada di bawah `models.providers.<id>` di `openclaw.json` atau `models.json`, bukan di profil auth.

Rute auth eksternal seperti Bedrock `auth: "aws-sdk"` juga bukan kredensial. Jika Anda menginginkan rute Bedrock bernama, letakkan `auth.profiles.<id>.mode: "aws-sdk"` di `openclaw.json`; jangan tulis `type: "aws-sdk"` ke penyimpanan profil auth. `openclaw doctor --fix` memindahkan penanda AWS SDK lama dari penyimpanan kredensial ke metadata config.

Ref profil auth juga didukung untuk kredensial statis:

- Kredensial `api_key` dapat menggunakan `keyRef: { source, provider, id }`
- Kredensial `token` dapat menggunakan `tokenRef: { source, provider, id }`
- Profil mode OAuth tidak mendukung kredensial SecretRef; jika `auth.profiles.<id>.mode` diatur ke `"oauth"`, input `keyRef`/`tokenRef` berbasis SecretRef untuk profil tersebut ditolak.

Pemeriksaan ramah otomatisasi (exit `1` saat kedaluwarsa/hilang, `2` saat akan kedaluwarsa):

```bash
openclaw models status --check
```

Probe auth langsung:

```bash
openclaw models status --probe
```

Catatan:

- Baris probe dapat berasal dari profil auth, kredensial env, atau `models.json`.
- Jika `auth.order.<provider>` eksplisit menghilangkan profil tersimpan, probe melaporkan
  `excluded_by_auth_order` untuk profil tersebut alih-alih mencobanya.
- Jika auth ada tetapi OpenClaw tidak dapat menyelesaikan kandidat model yang dapat diprobe untuk
  penyedia tersebut, probe melaporkan `status: no_model`.
- Cooldown batas laju dapat bersifat tercakup model. Profil yang sedang cooldown untuk satu
  model masih dapat digunakan untuk model saudara pada penyedia yang sama.

Skrip opsional ops (systemd/Termux) didokumentasikan di sini:
[Skrip pemantauan auth](/id/help/scripts#auth-monitoring-scripts)

## Catatan Anthropic

Backend Anthropic `claude-cli` didukung lagi.

- Staf Anthropic memberi tahu kami bahwa jalur integrasi OpenClaw ini diizinkan lagi.
- Karena itu OpenClaw memperlakukan penggunaan ulang Claude CLI dan penggunaan `claude -p` sebagai disetujui
  untuk run yang didukung Anthropic kecuali Anthropic menerbitkan kebijakan baru.
- Kunci API Anthropic tetap menjadi pilihan yang paling dapat diprediksi untuk host gateway
  berumur panjang dan kontrol penagihan sisi server yang eksplisit.

## Memeriksa status auth model

```bash
openclaw models status
openclaw doctor
```

## Perilaku rotasi kunci API (gateway)

Beberapa penyedia mendukung percobaan ulang permintaan dengan kunci alternatif ketika panggilan API
terkena batas laju penyedia.

- Urutan prioritas:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY` (override tunggal)
  - `<PROVIDER>_API_KEYS`
  - `<PROVIDER>_API_KEY`
  - `<PROVIDER>_API_KEY_*`
- Penyedia Google juga menyertakan `GOOGLE_API_KEY` sebagai fallback tambahan.
- Daftar kunci yang sama dideduplikasi sebelum digunakan.
- OpenClaw mencoba ulang dengan kunci berikutnya hanya untuk kesalahan batas laju (misalnya
  `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many concurrent
requests`, `ThrottlingException`, `concurrency limit reached`, atau
  `workers_ai ... quota limit exceeded`).
- Kesalahan non-batas-laju tidak dicoba ulang dengan kunci alternatif.
- Jika semua kunci gagal, kesalahan akhir dari percobaan terakhir dikembalikan.

## Menghapus auth penyedia saat gateway sedang berjalan

Ketika auth penyedia dihapus melalui bidang kendali Gateway, OpenClaw menghapus
profil auth tersimpan untuk penyedia tersebut dan membatalkan chat aktif atau run agen
yang penyedia model pilihannya cocok dengan penyedia yang dihapus. Run yang dibatalkan memancarkan
peristiwa pembatalan chat dan siklus hidup normal dengan
`stopReason: "auth-revoked"`, sehingga klien yang terhubung dapat menunjukkan bahwa run
dihentikan karena kredensial dihapus.

Menghapus auth tersimpan tidak mencabut kunci di penyedia. Rotasi atau cabut
kunci di dasbor penyedia saat Anda memerlukan pembatalan di sisi penyedia.

## Mengontrol kredensial mana yang digunakan

### OpenAI dan id `openai-codex` lama

Profil kunci API OpenAI dan profil OAuth ChatGPT/Codex sama-sama menggunakan id
penyedia kanonis `openai`. Config baru sebaiknya menggunakan id profil `openai:*` dan
`auth.order.openai`.

Jika Anda melihat `openai-codex` di config lama, id profil auth, atau
`auth.order.openai-codex`, perlakukan itu sebagai input migrasi lama. Jangan buat profil
`openai-codex` baru. Jalankan:

```bash
openclaw doctor --fix
openclaw models auth list --provider openai
```

Doctor menulis ulang id profil `openai-codex:*` lama dan entri
`auth.order.openai-codex` ke rute auth kanonis `openai`. Untuk
perutean model/runtime khusus OpenAI, lihat [OpenAI](/id/providers/openai).

### Saat login (CLI)

Gunakan `openclaw models auth login --provider <id> --profile-id <profileId>` untuk
penyedia yang mendukung profil auth bernama saat login.

```bash
openclaw models auth login --provider openai --profile-id openai:ritsuko
openclaw models auth login --provider openai --profile-id openai:lain
```

Ini adalah cara termudah untuk memisahkan beberapa login OAuth untuk penyedia yang sama
di dalam satu agen.

Gunakan `--force` ketika profil penyedia tersimpan macet, kedaluwarsa, atau tertaut ke
akun yang salah dan perintah login normal terus menggunakannya kembali. `--force` menghapus
profil auth tersimpan untuk penyedia tersebut di direktori agen yang dipilih, lalu
menjalankan lagi alur auth penyedia yang sama. Ini tidak mencabut kredensial di
penyedia; rotasi atau cabut kredensial di dasbor penyedia saat Anda memerlukan
pembatalan di sisi penyedia.

```bash
openclaw models auth login --provider anthropic --force
```

### Per sesi (perintah chat)

Gunakan `/model <alias-or-id>@<profileId>` untuk menyematkan kredensial penyedia tertentu untuk sesi saat ini (contoh id profil: `anthropic:default`, `anthropic:work`).

Gunakan `/model` (atau `/model list`) untuk pemilih ringkas; gunakan `/model status` untuk tampilan lengkap (kandidat + profil auth berikutnya, ditambah detail endpoint penyedia saat dikonfigurasi).

### Per agen (override CLI)

Tetapkan override urutan profil auth eksplisit untuk agen (disimpan dalam status auth SQLite agen tersebut):

```bash
openclaw models auth order get --provider anthropic
openclaw models auth order set --provider anthropic anthropic:default
openclaw models auth order clear --provider anthropic
```

Gunakan `--agent <id>` untuk menargetkan agen tertentu; hilangkan untuk menggunakan agen default yang dikonfigurasi.
Saat Anda men-debug masalah urutan, `openclaw models status --probe` menampilkan profil tersimpan yang dihilangkan
sebagai `excluded_by_auth_order` alih-alih melewatinya diam-diam.
Saat Anda men-debug masalah cooldown, ingat bahwa cooldown batas laju dapat terikat
ke satu id model, bukan seluruh profil penyedia.

Jika Anda mengubah urutan auth atau penyematan profil untuk chat yang sudah berjalan,
kirim `/new` atau `/reset` di chat tersebut untuk memulai sesi baru. Sesi yang ada
dapat mempertahankan pilihan model/profil saat ini hingga direset.

## Pemecahan masalah

### "Tidak ada kredensial ditemukan"

Jika profil Anthropic hilang, konfigurasikan kunci API Anthropic pada
**host gateway** atau siapkan jalur token penyiapan Anthropic, lalu periksa ulang:

```bash
openclaw models status
```

### Token akan kedaluwarsa/kedaluwarsa

Jalankan `openclaw models status` untuk memastikan profil mana yang akan kedaluwarsa. Jika
profil token Anthropic hilang atau kedaluwarsa, segarkan penyiapan itu melalui
token penyiapan atau migrasikan ke kunci API Anthropic.

## Terkait

- [Manajemen rahasia](/id/gateway/secrets)
- [Akses jarak jauh](/id/gateway/remote)
- [Penyimpanan auth](/id/concepts/oauth)
