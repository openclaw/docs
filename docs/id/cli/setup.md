---
read_when:
    - Anda ingin mengobrol dengan OpenClaw untuk penyiapan atau perbaikan
    - Anda sedang melakukan penyiapan awal dengan wizard orientasi pengguna
    - Anda ingin menetapkan jalur ruang kerja default
    - Anda memerlukan flag penyiapan khusus baseline untuk skrip
summary: Referensi CLI untuk `openclaw setup` (percakapan agen sistem dengan fallback orientasi)
title: Penyiapan
x-i18n:
    generated_at: "2026-07-19T05:03:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 46b0f485e276786227a68dc7ff57d9492aa7ed4197e471d9aa6fae0082e9c44e
    source_path: cli/setup.md
    workflow: 16
---

# `openclaw setup`

`openclaw setup` adalah titik masuk agen sistem. Pada sistem yang telah dikonfigurasi, perintah
`openclaw setup` tanpa argumen membuka obrolan OpenClaw interaktif. Pada sistem baru, perintah tersebut
beralih ke orientasi terpandu. Gunakan `-m`/`--message` untuk satu permintaan atau
`--baseline` untuk menginisialisasi folder konfigurasi/ruang kerja tanpa wisaya.

Urutan perutean:

1. Opsi orientasi apa pun (`--wizard`, `--baseline`, ruang kerja, reset,
   noninteraktif, alur, mode, Gateway, daemon, lewati, impor, jarak jauh, atau opsi
   autentikasi) menjalankan orientasi persis seperti `openclaw onboard`.
2. `-m`/`--message` atau `--yes` menjalankan agen sistem.
3. Tanpa opsi perutean, sistem interaktif yang telah dikonfigurasi akan membuka OpenClaw. Sistem
   baru menjalankan orientasi. Pada sistem yang telah dikonfigurasi, `--json` mencetak
   ikhtisar sistem bahkan tanpa TTY; opsi orientasi mempertahankan ringkasan JSON
   orientasi.

Dalam mode terpandu, `--workspace <dir>` adalah ruang kerja yang diusulkan kepada OpenClaw;
ruang kerja tersebut hanya disimpan setelah Anda menyetujui usulan itu. Penyiapan dasar, klasik, dan
noninteraktif menyimpan ruang kerja yang diberikan melalui alur normal masing-masing.

Deteksi inferensi terpandu berjalan pada host Gateway di macOS atau Linux. CLI
dan aplikasi macOS memanggil detektor milik Gateway yang sama, yang memeriksa model
yang dikonfigurasi, login CLI yang didukung, variabel lingkungan kunci API, serta
model Ollama atau LM Studio yang sudah terinstal. Model lokal tidak pernah diunduh oleh
proses otomatis ini. Runtime lokal yang terdeteksi diuji secara otomatis setelah kandidat CLI dan
kunci API; ketika tersedia beberapa model lokal, OpenClaw mengutamakan
keluarga instruct terkuat yang mendukung pemanggilan alat. Kandidat terpilih harus memberikan
respons penyelesaian nyata sebelum konfigurasi penyedia dan modelnya disimpan.
CLI Gemini, Antigravity, Pi, dan OpenCode yang terinstal juga dilaporkan ketika
tidak dapat digunakan sebagai rute inferensi yang dapat digunakan kembali untuk penyiapan terpandu.

`setup` menerima flag orientasi yang sama dengan `openclaw onboard`, termasuk
autentikasi (`--auth-choice`, `--token`, flag kunci penyedia), Gateway
(`--gateway-port`, `--gateway-bind`, `--gateway-auth`, `--install-daemon`),
Tailscale (`--tailscale`), reset (`--reset`, `--reset-scope`), alur
(`--flow quickstart|advanced|manual|import`), dan flag lewati
(`--skip-channels`, `--skip-skills`, `--skip-bootstrap`, `--skip-search`,
`--skip-health`, `--skip-ui`, `--skip-hooks`). Lihat [Orientasi](/id/cli/onboard) dan
[Otomatisasi CLI](/id/start/wizard-cli-automation) untuk referensi flag lengkap dan
contoh noninteraktif. `openclaw onboard --modern` tetap menjadi entri kompatibilitas
untuk asisten OpenClaw dengan gerbang inferensi yang sama.

<Note>
`openclaw setup` ditujukan untuk instalasi konfigurasi yang dapat diubah. Dalam mode Nix (`OPENCLAW_NIX_MODE=1`), OpenClaw menolak penulisan penyiapan karena berkas konfigurasi dikelola oleh Nix. Gunakan [Mulai Cepat nix-openclaw](https://github.com/openclaw/nix-openclaw#quick-start) pihak pertama atau konfigurasi sumber yang setara untuk paket Nix lainnya.
</Note>

## Opsi

| Flag                       | Deskripsi                                                                                           |
| -------------------------- | ----------------------------------------------------------------------------------------------------- |
| `-m, --message <text>`     | Jalankan satu permintaan OpenClaw.                                                                             |
| `--yes`                    | Setujui penulisan konfigurasi persisten untuk satu permintaan `--message`.                                         |
| `--workspace <dir>`        | Usulan ruang kerja dalam mode terpandu; disimpan langsung oleh penyiapan dasar, klasik, dan noninteraktif. |
| `--baseline`               | Buat folder konfigurasi dasar/ruang kerja/sesi tanpa orientasi.                                  |
| `--wizard`                 | Paksa orientasi interaktif.                                                                         |
| `--non-interactive`        | Jalankan orientasi tanpa prompt.                                                                       |
| `--accept-risk`            | Akui risiko akses agen ke seluruh sistem; diwajibkan bersama `--non-interactive`.                         |
| `--mode <mode>`            | Mode orientasi: `local` atau `remote`.                                                                 |
| `--flow <flow>`            | Alur orientasi: `quickstart`, `advanced`, `manual`, atau `import`.                                        |
| `--reset`                  | Reset konfigurasi + kredensial + sesi sebelum orientasi (ruang kerja hanya dengan `--reset-scope full`).   |
| `--reset-scope <scope>`    | Cakupan reset: `config`, `config+creds+sessions`, atau `full`.                                            |
| `--import-from <provider>` | Penyedia migrasi yang akan dijalankan selama orientasi.                                                          |
| `--import-source <path>`   | Direktori utama agen sumber untuk `--import-from`.                                                                |
| `--import-secrets`         | Impor rahasia yang didukung selama migrasi orientasi.                                                 |
| `--remote-url <url>`       | URL WebSocket Gateway jarak jauh.                                                                         |
| `--remote-token <token>`   | Token Gateway jarak jauh (opsional).                                                                      |
| `--json`                   | Sistem yang dikonfigurasi: ikhtisar OpenClaw. Rute orientasi: ringkasan orientasi.                           |

`--classic` dan `--non-interactive` saling eksklusif: mode klasik membuka
wisaya dengan prompt, sedangkan penyiapan noninteraktif menggunakan jalur otomatisasi.

### Mode dasar

`openclaw setup --baseline` mempertahankan perilaku lama yang hanya menjalankan mode dasar: perintah ini
membuat direktori konfigurasi, ruang kerja, dan sesi, lalu keluar tanpa
menjalankan orientasi.

## Contoh

```bash
openclaw setup
openclaw setup -m "status"
openclaw setup -m "restart gateway" --yes
openclaw setup --json
openclaw setup --wizard
openclaw setup --baseline
openclaw setup --workspace ~/.openclaw/workspace
openclaw setup --import-from hermes --import-source ~/.hermes
openclaw setup --non-interactive --accept-risk --mode remote --remote-url wss://gateway-host:18789 --remote-token <token>
```

## Catatan

- Setelah penyiapan dasar, jalankan `openclaw onboard` untuk seluruh proses terpandu, `openclaw configure` untuk perubahan yang ditargetkan, atau `openclaw channels add` untuk menambahkan akun saluran.
- Jika status Hermes terdeteksi, orientasi interaktif dapat menawarkan migrasi secara otomatis. Orientasi impor memerlukan penyiapan baru; gunakan [Migrasi](/id/cli/migrate) untuk rencana uji coba, pencadangan, dan mode penimpaan di luar orientasi.

## Terkait

- [Referensi CLI](/id/cli)
- [Orientasi](/id/cli/onboard)
- [Orientasi (CLI)](/id/start/wizard)
- [Memulai](/id/start/getting-started)
- [Ikhtisar instalasi](/id/install)
