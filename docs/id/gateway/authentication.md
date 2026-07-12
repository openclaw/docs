---
read_when:
    - Men-debug autentikasi model atau kedaluwarsa OAuth
    - Mendokumentasikan autentikasi atau penyimpanan kredensial
summary: 'Autentikasi model: OAuth, kunci API, penggunaan kembali CLI Claude, dan token penyiapan Anthropic'
title: Autentikasi
x-i18n:
    generated_at: "2026-07-12T14:12:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 002877002323297f0ff24fdeb5283bf998215f902b0cbd3b152f7ba9085a852a
    source_path: gateway/authentication.md
    workflow: 16
---

<Note>
Halaman ini membahas autentikasi **penyedia model** (kunci API, OAuth, penggunaan ulang Claude CLI, token penyiapan Anthropic). Untuk autentikasi **koneksi Gateway** (token, kata sandi, proksi tepercaya), lihat [Konfigurasi](/id/gateway/configuration) dan [Autentikasi Proksi Tepercaya](/id/gateway/trusted-proxy-auth).
</Note>

OpenClaw mendukung OAuth dan kunci API untuk penyedia model. Untuk host Gateway yang selalu aktif, kunci API adalah opsi yang paling dapat diprediksi; alur langganan/OAuth juga dapat digunakan jika sesuai dengan model akun penyedia Anda.

- Alur OAuth lengkap dan tata letak penyimpanan: [/concepts/oauth](/id/concepts/oauth)
- Autentikasi berbasis SecretRef (penyedia `env`/`file`/`exec`): [Pengelolaan Rahasia](/id/gateway/secrets)
- Kode kelayakan/alasan kredensial yang digunakan oleh `models status --probe`: [Semantik Kredensial Autentikasi](/id/auth-credential-semantics)

## Penyiapan yang disarankan: kunci API (penyedia apa pun)

1. Buat kunci API di konsol penyedia Anda.
2. Tempatkan kunci tersebut di **host Gateway** (mesin yang menjalankan `openclaw gateway`):

```bash
export <PROVIDER>_API_KEY="..."
openclaw models status
```

3. Jika Gateway berjalan di bawah systemd/launchd, tempatkan kunci di `~/.openclaw/.env` agar daemon dapat membacanya:

```bash
cat >> ~/.openclaw/.env <<'EOF'
<PROVIDER>_API_KEY=...
EOF
```

4. Mulai ulang proses Gateway (atau daemon), lalu periksa kembali:

```bash
openclaw models status
openclaw doctor
```

`openclaw onboard` juga dapat menyimpan kunci API untuk digunakan daemon jika Anda tidak ingin mengelola variabel lingkungan sendiri. Lihat [Variabel lingkungan](/id/help/environment) untuk urutan prioritas pemuatan lingkungan lengkap (`env.shellEnv`, `~/.openclaw/.env`, systemd/launchd).

## Anthropic: penggunaan ulang Claude CLI

Autentikasi token penyiapan Anthropic tetap menjadi jalur yang didukung. Penggunaan ulang Claude CLI (penggunaan bergaya `claude -p`) juga diizinkan untuk integrasi ini; jika proses masuk Claude CLI tersedia di host, itulah jalur yang diutamakan untuk penggunaan lokal/desktop. Untuk host Gateway berumur panjang, kunci API Anthropic tetap menjadi pilihan yang paling dapat diprediksi, dengan kontrol penagihan sisi server yang eksplisit.

Penyiapan host untuk penggunaan ulang Claude CLI:

```bash
# Run on the gateway host
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

Proses ini terdiri dari dua langkah: masuk ke Anthropic melalui Claude Code di host, lalu beri tahu OpenClaw agar merutekan pemilihan model Anthropic melalui backend lokal `claude-cli` dan menyimpan profil autentikasi OpenClaw yang sesuai.

Jika `claude` tidak ada di `PATH`, instal Claude Code atau atur `agents.defaults.cliBackends.claude-cli.command` ke jalur biner.

## Entri token secara manual

Dapat digunakan untuk penyedia apa pun; menulis penyimpanan autentikasi SQLite per agen dan memperbarui konfigurasi:

```bash
openclaw models auth paste-token --provider openrouter
```

OpenClaw membaca profil autentikasi dari `openclaw-agent.sqlite` milik setiap agen. Detail endpoint (`baseUrl`, `api`, ID model, header, batas waktu) harus ditempatkan di bawah `models.providers.<id>` dalam `openclaw.json` atau `models.json`, bukan dalam profil autentikasi.

Jika instalasi lama masih memiliki `auth-profiles.json`, `auth-state.json`, atau bentuk datar seperti `{ "openrouter": { "apiKey": "..." } }`, jalankan `openclaw doctor --fix` untuk mengimpornya ke SQLite; doctor menyimpan cadangan dengan stempel waktu di samping berkas JSON asli.

Rute autentikasi eksternal seperti `auth: "aws-sdk"` milik Bedrock bukanlah kredensial. Untuk rute Bedrock bernama, atur `auth.profiles.<id>.mode: "aws-sdk"` dalam `openclaw.json` — jangan tulis `type: "aws-sdk"` ke penyimpanan profil autentikasi. `openclaw doctor --fix` memigrasikan penanda AWS SDK lama dari penyimpanan kredensial ke metadata konfigurasi.

### Kredensial berbasis SecretRef

- Kredensial `api_key` dapat menggunakan `keyRef: { source, provider, id }`
- Kredensial `token` dapat menggunakan `tokenRef: { source, provider, id }`
- Profil bermode OAuth menolak kredensial SecretRef: jika `auth.profiles.<id>.mode` adalah `"oauth"`, `keyRef`/`tokenRef` berbasis SecretRef untuk profil tersebut akan ditolak.

## Memeriksa status autentikasi model

```bash
openclaw models status
openclaw doctor
```

Pemeriksaan yang ramah otomatisasi, keluar dengan `1` jika kedaluwarsa/tidak ada, `2` jika akan segera kedaluwarsa:

```bash
openclaw models status --check
```

Probe autentikasi langsung (tambahkan `--probe-provider`, `--probe-profile`, `--probe-timeout`, `--probe-concurrency`, atau `--probe-max-tokens` untuk mempersempit cakupan):

```bash
openclaw models status --probe
```

Catatan:

- Baris probe dapat berasal dari profil autentikasi, kredensial lingkungan, atau `models.json`.
- Jika `auth.order.<provider>` menghilangkan profil yang tersimpan, probe melaporkan `excluded_by_auth_order` untuk profil tersebut alih-alih mencobanya.
- Jika autentikasi tersedia tetapi OpenClaw tidak dapat menentukan model yang dapat diuji untuk penyedia tersebut, probe melaporkan `status: no_model`.
- Masa jeda pembatasan laju dapat memiliki cakupan per model: profil yang sedang dalam masa jeda untuk satu model masih dapat melayani model sejawat pada penyedia yang sama.

Skrip operasional opsional (systemd/Termux): [Skrip pemantauan autentikasi](/id/help/scripts#auth-monitoring-scripts).

## Rotasi kunci API (Gateway)

Beberapa penyedia mencoba ulang permintaan dengan kunci alternatif yang dikonfigurasi ketika suatu panggilan terkena batas laju penyedia.

Urutan prioritas kunci per penyedia:

1. `OPENCLAW_LIVE_<PROVIDER>_KEY` (penimpaan tunggal, menetapkan satu kunci)
2. `<PROVIDER>_API_KEYS` (daftar yang dipisahkan koma/spasi/titik koma)
3. `<PROVIDER>_API_KEY`
4. `<PROVIDER>_API_KEY_*` (variabel lingkungan apa pun dengan prefiks ini)

Penyedia Google (`google`, `google-vertex`) juga beralih ke `GOOGLE_API_KEY` sebagai cadangan. Duplikat dihapus dari daftar gabungan sebelum digunakan.

OpenClaw berotasi ke kunci berikutnya hanya ketika pesan kesalahan cocok dengan: `rate_limit`, `rate limit`, `429`, `quota exceeded`/`quota_exceeded`, `resource exhausted`/`resource_exhausted`, atau `too many requests`. Kesalahan lain tidak dicoba ulang dengan kunci alternatif. Jika semua kunci gagal, kesalahan terakhir dari percobaan terakhir akan dikembalikan.

<Note>
Frasa khusus penyedia seperti `ThrottlingException`, `concurrency limit reached`, atau `workers_ai ... quota limit exceeded` menentukan **klasifikasi failover/percobaan ulang** (beralih model atau penyedia saat terjadi kegagalan berulang), mekanisme yang terpisah dari rotasi kunci API di atas.
</Note>

Menghapus autentikasi yang tersimpan tidak mencabut kunci di penyedia — rotasi atau cabut kunci tersebut di dasbor penyedia ketika Anda memerlukan pembatalan dari sisi penyedia.

## Menghapus autentikasi penyedia saat Gateway sedang berjalan

Ketika Anda menghapus autentikasi penyedia melalui bidang kontrol Gateway, OpenClaw menghapus profil autentikasi yang tersimpan untuk penyedia tersebut dan membatalkan percakapan/proses agen aktif yang penyedia model pilihannya cocok dengan penyedia yang dihapus. Proses yang dibatalkan memancarkan peristiwa pembatalan/siklus hidup normal dengan `stopReason: "auth-revoked"`, sehingga klien yang terhubung dapat menunjukkan bahwa proses dihentikan karena kredensial telah dihapus.

## Mengendalikan kredensial yang digunakan

### OpenAI dan ID `openai-codex` lama

Profil kunci API OpenAI dan profil OAuth ChatGPT/Codex sama-sama menggunakan ID penyedia kanonis `openai`. Gunakan ID profil `openai:*` dan `auth.order.openai` untuk konfigurasi baru.

Jika Anda melihat `openai-codex` dalam konfigurasi lama, ID profil autentikasi, atau `auth.order.openai-codex`, perlakukan sebagai masukan migrasi lama — jangan membuat profil `openai-codex` baru. Jalankan:

```bash
openclaw doctor --fix
openclaw models auth list --provider openai
```

Doctor menulis ulang ID profil `openai-codex:*` dan entri `auth.order.openai-codex` lama ke rute kanonis `openai`. Untuk perutean model/runtime khusus OpenAI, lihat [OpenAI](/id/providers/openai).

### Saat masuk (CLI)

```bash
openclaw models auth login --provider openai --profile-id openai:ritsuko
openclaw models auth login --provider openai --profile-id openai:lain
```

`--profile-id` menjaga beberapa proses masuk OAuth untuk penyedia yang sama tetap terpisah dalam satu agen.

`--force` menghapus profil autentikasi yang tersimpan untuk penyedia tersebut di direktori agen yang dipilih, lalu menjalankan kembali alur autentikasi yang sama. Gunakan ketika profil tersimpan macet, kedaluwarsa, atau terikat ke akun yang salah. Opsi ini tidak mencabut kredensial di penyedia.

```bash
openclaw models auth login --provider anthropic --force
```

### Per sesi (perintah percakapan)

- `/model <alias-or-id>@<profileId>` menetapkan kredensial penyedia tertentu untuk sesi saat ini (contoh ID profil: `anthropic:default`, `anthropic:work`).
- `/model` (atau `/model list`) menampilkan pemilih ringkas; `/model status` menampilkan tampilan lengkap (kandidat + profil autentikasi berikutnya, serta detail endpoint penyedia jika dikonfigurasi).

Jika Anda mengubah urutan autentikasi atau penetapan profil untuk percakapan yang sudah berjalan, kirim `/new` atau `/reset` untuk memulai sesi baru — sesi yang sudah ada mempertahankan pilihan model/profil saat ini hingga diatur ulang.

### Per agen (penimpaan CLI)

Penimpaan urutan autentikasi disimpan dalam status autentikasi SQLite milik agen tersebut:

```bash
openclaw models auth order get --provider anthropic
openclaw models auth order set --provider anthropic anthropic:default
openclaw models auth order clear --provider anthropic
```

Gunakan `--agent <id>` untuk menargetkan agen tertentu; hilangkan opsi tersebut untuk menggunakan agen default yang dikonfigurasi. `openclaw models status --probe` menampilkan profil tersimpan yang dihilangkan sebagai `excluded_by_auth_order`, alih-alih melewatinya secara diam-diam.

## Pemecahan masalah

### "Tidak ditemukan kredensial"

Konfigurasikan kunci API Anthropic di **host Gateway**, atau siapkan jalur token penyiapan Anthropic, lalu periksa kembali:

```bash
openclaw models status
```

### Token akan segera kedaluwarsa/sudah kedaluwarsa

Jalankan `openclaw models status` untuk melihat profil mana yang akan segera kedaluwarsa. Jika profil token Anthropic tidak ada atau sudah kedaluwarsa, segarkan melalui token penyiapan atau migrasikan ke kunci API Anthropic.

## Terkait

- [Pengelolaan rahasia](/id/gateway/secrets)
- [Akses jarak jauh](/id/gateway/remote)
- [Penyimpanan autentikasi](/id/concepts/oauth)
