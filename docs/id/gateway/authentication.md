---
read_when:
    - Men-debug autentikasi model atau kedaluwarsa OAuth
    - Mendokumentasikan autentikasi atau penyimpanan kredensial
summary: 'Autentikasi model: OAuth, kunci API, penggunaan ulang Claude CLI, dan setup-token Anthropic'
title: Autentikasi
x-i18n:
    generated_at: "2026-04-30T09:46:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 225adf26963183f8b5ecc76ca7bdc143f6a8800797fbd4be9d53d65b434f36c7
    source_path: gateway/authentication.md
    workflow: 16
---

<Note>
Halaman ini adalah referensi autentikasi **penyedia model** (kunci API, OAuth, penggunaan ulang Claude CLI, dan setup-token Anthropic). Untuk autentikasi **koneksi Gateway** (token, kata sandi, trusted-proxy), lihat [Konfigurasi](/id/gateway/configuration) dan [Autentikasi Proxy Tepercaya](/id/gateway/trusted-proxy-auth).
</Note>

OpenClaw mendukung OAuth dan kunci API untuk penyedia model. Untuk host Gateway
yang selalu aktif, kunci API biasanya menjadi opsi yang paling mudah diprediksi. Alur
langganan/OAuth juga didukung jika cocok dengan model akun penyedia Anda.

Lihat [/concepts/oauth](/id/concepts/oauth) untuk alur OAuth lengkap dan tata letak
penyimpanan.
Untuk autentikasi berbasis SecretRef (penyedia `env`/`file`/`exec`), lihat [Manajemen Rahasia](/id/gateway/secrets).
Untuk aturan kelayakan kredensial/kode alasan yang digunakan oleh `models status --probe`, lihat
[Semantik Kredensial Autentikasi](/id/auth-credential-semantics).

## Penyiapan yang disarankan (kunci API, penyedia apa pun)

Jika Anda menjalankan Gateway jangka panjang, mulai dengan kunci API untuk
penyedia pilihan Anda.
Khusus untuk Anthropic, autentikasi kunci API tetap merupakan penyiapan server
yang paling mudah diprediksi, tetapi OpenClaw juga mendukung penggunaan ulang login Claude CLI lokal.

1. Buat kunci API di konsol penyedia Anda.
2. Letakkan di **host Gateway** (mesin yang menjalankan `openclaw gateway`).

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

Lalu mulai ulang daemon (atau mulai ulang proses Gateway Anda) dan periksa lagi:

```bash
openclaw models status
openclaw doctor
```

Jika Anda tidak ingin mengelola env vars sendiri, onboarding dapat menyimpan
kunci API untuk penggunaan daemon: `openclaw onboard`.

Lihat [Bantuan](/id/help) untuk detail tentang pewarisan env (`env.shellEnv`,
`~/.openclaw/.env`, systemd/launchd).

## Anthropic: kompatibilitas Claude CLI dan token

Autentikasi setup-token Anthropic tetap tersedia di OpenClaw sebagai jalur token
yang didukung. Staf Anthropic sejak itu memberi tahu kami bahwa penggunaan Claude CLI bergaya OpenClaw
diizinkan lagi, sehingga OpenClaw memperlakukan penggunaan ulang Claude CLI dan penggunaan `claude -p` sebagai
disetujui untuk integrasi ini kecuali Anthropic menerbitkan kebijakan baru. Ketika
penggunaan ulang Claude CLI tersedia di host, itu kini menjadi jalur yang disarankan.

Untuk host Gateway jangka panjang, kunci API Anthropic tetap menjadi penyiapan
yang paling mudah diprediksi. Jika Anda ingin menggunakan ulang login Claude yang sudah ada di host yang sama, gunakan
jalur Anthropic Claude CLI di onboarding/configure.

Penyiapan host yang disarankan untuk penggunaan ulang Claude CLI:

```bash
# Run on the gateway host
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

Ini adalah penyiapan dua langkah:

1. Masukkan Claude Code itu sendiri ke Anthropic pada host Gateway.
2. Beri tahu OpenClaw untuk mengalihkan pemilihan model Anthropic ke backend `claude-cli`
   lokal dan menyimpan profil autentikasi OpenClaw yang sesuai.

Jika `claude` tidak ada di `PATH`, instal Claude Code terlebih dahulu atau atur
`agents.defaults.cliBackends.claude-cli.command` ke path biner sebenarnya.

Entri token manual (penyedia apa pun; menulis `auth-profiles.json` + memperbarui konfigurasi):

```bash
openclaw models auth paste-token --provider openrouter
```

`auth-profiles.json` hanya menyimpan kredensial. Bentuk kanonisnya adalah:

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

OpenClaw mengharapkan bentuk kanonis `version` + `profiles` saat runtime. Jika instalasi lama masih memiliki file datar seperti `{ "openrouter": { "apiKey": "..." } }`, jalankan `openclaw doctor --fix` untuk menulis ulang sebagai profil kunci API `openrouter:default`; doctor menyimpan salinan `.legacy-flat.*.bak` di samping file asli. Detail endpoint seperti `baseUrl`, `api`, id model, header, dan timeout berada di bawah `models.providers.<id>` dalam `openclaw.json` atau `models.json`, bukan di `auth-profiles.json`.

Referensi profil autentikasi juga didukung untuk kredensial statis:

- Kredensial `api_key` dapat menggunakan `keyRef: { source, provider, id }`
- Kredensial `token` dapat menggunakan `tokenRef: { source, provider, id }`
- Profil mode OAuth tidak mendukung kredensial SecretRef; jika `auth.profiles.<id>.mode` diatur ke `"oauth"`, input `keyRef`/`tokenRef` berbasis SecretRef untuk profil tersebut ditolak.

Pemeriksaan ramah otomasi (keluar `1` saat kedaluwarsa/hilang, `2` saat hampir kedaluwarsa):

```bash
openclaw models status --check
```

Probe autentikasi langsung:

```bash
openclaw models status --probe
```

Catatan:

- Baris probe dapat berasal dari profil autentikasi, kredensial env, atau `models.json`.
- Jika `auth.order.<provider>` eksplisit menghilangkan profil tersimpan, probe melaporkan
  `excluded_by_auth_order` untuk profil tersebut alih-alih mencobanya.
- Jika autentikasi ada tetapi OpenClaw tidak dapat menyelesaikan kandidat model yang dapat di-probe untuk
  penyedia tersebut, probe melaporkan `status: no_model`.
- Cooldown batas laju dapat dicakup per model. Profil yang sedang cooldown untuk satu
  model masih dapat digunakan untuk model saudara pada penyedia yang sama.

Skrip operasional opsional (systemd/Termux) didokumentasikan di sini:
[Skrip pemantauan autentikasi](/id/help/scripts#auth-monitoring-scripts)

## Catatan Anthropic

Backend Anthropic `claude-cli` didukung kembali.

- Staf Anthropic memberi tahu kami bahwa jalur integrasi OpenClaw ini diizinkan lagi.
- Karena itu OpenClaw memperlakukan penggunaan ulang Claude CLI dan penggunaan `claude -p` sebagai disetujui
  untuk run yang didukung Anthropic kecuali Anthropic menerbitkan kebijakan baru.
- Kunci API Anthropic tetap menjadi pilihan yang paling mudah diprediksi untuk host Gateway
  jangka panjang dan kontrol penagihan sisi server yang eksplisit.

## Memeriksa status autentikasi model

```bash
openclaw models status
openclaw doctor
```

## Perilaku rotasi kunci API (Gateway)

Beberapa penyedia mendukung percobaan ulang permintaan dengan kunci alternatif ketika panggilan API
mencapai batas laju penyedia.

- Urutan prioritas:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY` (override tunggal)
  - `<PROVIDER>_API_KEYS`
  - `<PROVIDER>_API_KEY`
  - `<PROVIDER>_API_KEY_*`
- Penyedia Google juga menyertakan `GOOGLE_API_KEY` sebagai fallback tambahan.
- Daftar kunci yang sama dideduplikasi sebelum digunakan.
- OpenClaw mencoba ulang dengan kunci berikutnya hanya untuk galat batas laju (misalnya
  `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many concurrent
requests`, `ThrottlingException`, `concurrency limit reached`, atau
  `workers_ai ... quota limit exceeded`).
- Galat non-batas-laju tidak dicoba ulang dengan kunci alternatif.
- Jika semua kunci gagal, galat akhir dari percobaan terakhir dikembalikan.

## Mengontrol kredensial mana yang digunakan

### Per sesi (perintah chat)

Gunakan `/model <alias-or-id>@<profileId>` untuk menyematkan kredensial penyedia tertentu untuk sesi saat ini (contoh id profil: `anthropic:default`, `anthropic:work`).

Gunakan `/model` (atau `/model list`) untuk pemilih ringkas; gunakan `/model status` untuk tampilan lengkap (kandidat + profil autentikasi berikutnya, ditambah detail endpoint penyedia jika dikonfigurasi).

### Per agen (override CLI)

Atur override urutan profil autentikasi eksplisit untuk agen (disimpan di `auth-state.json` agen tersebut):

```bash
openclaw models auth order get --provider anthropic
openclaw models auth order set --provider anthropic anthropic:default
openclaw models auth order clear --provider anthropic
```

Gunakan `--agent <id>` untuk menargetkan agen tertentu; hilangkan untuk menggunakan agen default yang dikonfigurasi.
Saat Anda men-debug masalah urutan, `openclaw models status --probe` menampilkan
profil tersimpan yang dihilangkan sebagai `excluded_by_auth_order` alih-alih melewatinya secara diam-diam.
Saat Anda men-debug masalah cooldown, ingat bahwa cooldown batas laju dapat terikat
pada satu id model, bukan seluruh profil penyedia.

## Pemecahan masalah

### "No credentials found"

Jika profil Anthropic hilang, konfigurasikan kunci API Anthropic pada
**host Gateway** atau siapkan jalur setup-token Anthropic, lalu periksa lagi:

```bash
openclaw models status
```

### Token hampir kedaluwarsa/kedaluwarsa

Jalankan `openclaw models status` untuk mengonfirmasi profil mana yang hampir kedaluwarsa. Jika
profil token Anthropic hilang atau kedaluwarsa, segarkan penyiapan tersebut melalui
setup-token atau migrasikan ke kunci API Anthropic.

## Terkait

- [Manajemen rahasia](/id/gateway/secrets)
- [Akses jarak jauh](/id/gateway/remote)
- [Penyimpanan autentikasi](/id/concepts/oauth)
