---
read_when:
    - Men-debug autentikasi model atau kedaluwarsa OAuth
    - Mendokumentasikan autentikasi atau penyimpanan kredensial
summary: 'Autentikasi model: OAuth, API key, penggunaan ulang Claude CLI, dan setup-token Anthropic'
title: Autentikasi
x-i18n:
    generated_at: "2026-04-24T09:06:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 371aa5a66bcec5c0271c6b7dcb0fcbb05a075f61ffd2c67616b6ea3a48f54934
    source_path: gateway/authentication.md
    workflow: 15
---

# Autentikasi (Provider Model)

<Note>
Halaman ini membahas autentikasi **provider model** (API key, OAuth, penggunaan ulang Claude CLI, dan setup-token Anthropic). Untuk autentikasi **koneksi gateway** (token, password, trusted-proxy), lihat [Configuration](/id/gateway/configuration) dan [Trusted Proxy Auth](/id/gateway/trusted-proxy-auth).
</Note>

OpenClaw mendukung OAuth dan API key untuk provider model. Untuk host gateway
yang selalu aktif, API key biasanya merupakan opsi yang paling dapat diprediksi. Alur
langganan/OAuth juga didukung jika sesuai dengan model akun provider Anda.

Lihat [/concepts/oauth](/id/concepts/oauth) untuk alur OAuth lengkap dan tata letak
penyimpanan.
Untuk autentikasi berbasis SecretRef (provider `env`/`file`/`exec`), lihat [Manajemen Secrets](/id/gateway/secrets).
Untuk aturan kelayakan kredensial/kode alasan yang digunakan oleh `models status --probe`, lihat
[Semantik Kredensial Auth](/id/auth-credential-semantics).

## Penyiapan yang direkomendasikan (API key, provider apa pun)

Jika Anda menjalankan gateway berumur panjang, mulailah dengan API key untuk
provider pilihan Anda.
Khusus untuk Anthropic, autentikasi API key tetap merupakan penyiapan server yang paling dapat
diprediksi, tetapi OpenClaw juga mendukung penggunaan ulang login Claude CLI lokal.

1. Buat API key di konsol provider Anda.
2. Letakkan di **host gateway** (mesin yang menjalankan `openclaw gateway`).

```bash
export <PROVIDER>_API_KEY="..."
openclaw models status
```

3. Jika Gateway berjalan di bawah systemd/launchd, sebaiknya letakkan key di
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

Jika Anda lebih suka tidak mengelola variabel env sendiri, onboarding dapat menyimpan
API key untuk penggunaan daemon: `openclaw onboard`.

Lihat [Bantuan](/id/help) untuk detail tentang pewarisan env (`env.shellEnv`,
`~/.openclaw/.env`, systemd/launchd).

## Anthropic: kompatibilitas Claude CLI dan token

Autentikasi setup-token Anthropic masih tersedia di OpenClaw sebagai jalur token
yang didukung. Sejak itu staf Anthropic memberi tahu kami bahwa penggunaan Claude CLI bergaya OpenClaw
diizinkan lagi, sehingga OpenClaw memperlakukan penggunaan ulang Claude CLI dan penggunaan `claude -p`
sebagai hal yang disetujui untuk integrasi ini kecuali Anthropic menerbitkan kebijakan baru. Ketika
penggunaan ulang Claude CLI tersedia di host, itu sekarang menjadi jalur yang lebih diutamakan.

Untuk host gateway berumur panjang, API key Anthropic tetap merupakan penyiapan yang paling dapat diprediksi.
Jika Anda ingin menggunakan ulang login Claude yang sudah ada di host yang sama, gunakan
jalur Anthropic Claude CLI di onboarding/configure.

Penyiapan host yang direkomendasikan untuk penggunaan ulang Claude CLI:

```bash
# Jalankan di host gateway
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

Ini adalah penyiapan dua langkah:

1. Login-kan Claude Code itu sendiri ke Anthropic di host gateway.
2. Beri tahu OpenClaw untuk mengalihkan pemilihan model Anthropic ke backend `claude-cli`
   lokal dan menyimpan profil auth OpenClaw yang sesuai.

Jika `claude` tidak ada di `PATH`, instal Claude Code terlebih dahulu atau setel
`agents.defaults.cliBackends.claude-cli.command` ke path binary yang sebenarnya.

Entri token manual (provider apa pun; menulis `auth-profiles.json` + memperbarui config):

```bash
openclaw models auth paste-token --provider openrouter
```

Ref profil auth juga didukung untuk kredensial statis:

- kredensial `api_key` dapat menggunakan `keyRef: { source, provider, id }`
- kredensial `token` dapat menggunakan `tokenRef: { source, provider, id }`
- Profil mode OAuth tidak mendukung kredensial SecretRef; jika `auth.profiles.<id>.mode` disetel ke `"oauth"`, input `keyRef`/`tokenRef` berbasis SecretRef untuk profil tersebut ditolak.

Pemeriksaan yang ramah otomasi (keluar `1` saat kedaluwarsa/tidak ada, `2` saat akan kedaluwarsa):

```bash
openclaw models status --check
```

Probe auth live:

```bash
openclaw models status --probe
```

Catatan:

- Baris probe dapat berasal dari profil auth, kredensial env, atau `models.json`.
- Jika `auth.order.<provider>` eksplisit menghilangkan profil tersimpan, probe melaporkan
  `excluded_by_auth_order` untuk profil itu alih-alih mencobanya.
- Jika auth ada tetapi OpenClaw tidak dapat menyelesaikan kandidat model yang dapat diprobe untuk
  provider tersebut, probe melaporkan `status: no_model`.
- Cooldown rate-limit dapat bersifat spesifik model. Profil yang sedang cooldown untuk satu
  model masih bisa digunakan untuk model saudara pada provider yang sama.

Skrip opsional ops (systemd/Termux) didokumentasikan di sini:
[Skrip pemantauan auth](/id/help/scripts#auth-monitoring-scripts)

## Catatan Anthropic

Backend `claude-cli` Anthropic kembali didukung.

- Staf Anthropic memberi tahu kami bahwa jalur integrasi OpenClaw ini diizinkan lagi.
- Karena itu, OpenClaw memperlakukan penggunaan ulang Claude CLI dan penggunaan `claude -p` sebagai hal yang disetujui
  untuk eksekusi berbasis Anthropic kecuali Anthropic menerbitkan kebijakan baru.
- API key Anthropic tetap menjadi pilihan yang paling dapat diprediksi untuk host gateway
  berumur panjang dan kontrol billing sisi server yang eksplisit.

## Memeriksa status auth model

```bash
openclaw models status
openclaw doctor
```

## Perilaku rotasi API key (gateway)

Beberapa provider mendukung percobaan ulang permintaan dengan key alternatif saat panggilan API
mengalami rate limit provider.

- Urutan prioritas:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY` (override tunggal)
  - `<PROVIDER>_API_KEYS`
  - `<PROVIDER>_API_KEY`
  - `<PROVIDER>_API_KEY_*`
- Provider Google juga menyertakan `GOOGLE_API_KEY` sebagai fallback tambahan.
- Daftar key yang sama dideduplikasi sebelum digunakan.
- OpenClaw mencoba ulang dengan key berikutnya hanya untuk error rate-limit (misalnya
  `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many concurrent
requests`, `ThrottlingException`, `concurrency limit reached`, atau
  `workers_ai ... quota limit exceeded`).
- Error selain rate-limit tidak dicoba ulang dengan key alternatif.
- Jika semua key gagal, error akhir dari percobaan terakhir akan dikembalikan.

## Mengontrol kredensial mana yang digunakan

### Per sesi (perintah chat)

Gunakan `/model <alias-or-id>@<profileId>` untuk menyematkan kredensial provider tertentu bagi sesi saat ini (contoh ID profil: `anthropic:default`, `anthropic:work`).

Gunakan `/model` (atau `/model list`) untuk pemilih ringkas; gunakan `/model status` untuk tampilan lengkap (kandidat + profil auth berikutnya, ditambah detail endpoint provider saat dikonfigurasi).

### Per agen (override CLI)

Setel override urutan profil auth eksplisit untuk agen (disimpan di `auth-state.json` agen tersebut):

```bash
openclaw models auth order get --provider anthropic
openclaw models auth order set --provider anthropic anthropic:default
openclaw models auth order clear --provider anthropic
```

Gunakan `--agent <id>` untuk menargetkan agen tertentu; hilangkan untuk menggunakan agen default yang dikonfigurasi.
Saat Anda men-debug masalah urutan, `openclaw models status --probe` menampilkan profil tersimpan
yang dihilangkan sebagai `excluded_by_auth_order` alih-alih melewatkannya secara diam-diam.
Saat Anda men-debug masalah cooldown, ingat bahwa cooldown rate-limit dapat terikat
ke satu ID model, bukan seluruh profil provider.

## Pemecahan masalah

### "No credentials found"

Jika profil Anthropic tidak ada, konfigurasikan API key Anthropic pada
**host gateway** atau setel jalur setup-token Anthropic, lalu periksa ulang:

```bash
openclaw models status
```

### Token akan kedaluwarsa/sudah kedaluwarsa

Jalankan `openclaw models status` untuk memastikan profil mana yang akan kedaluwarsa. Jika profil token
Anthropic tidak ada atau kedaluwarsa, segarkan penyiapan tersebut melalui
setup-token atau migrasikan ke API key Anthropic.

## Terkait

- [Manajemen secrets](/id/gateway/secrets)
- [Akses jarak jauh](/id/gateway/remote)
- [Penyimpanan auth](/id/concepts/oauth)
