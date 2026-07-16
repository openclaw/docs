---
read_when:
    - Anda ingin mengobrol dengan OpenClaw untuk penyiapan atau perbaikan
    - Anda sedang melakukan penyiapan awal dengan panduan orientasi pengguna.
    - Anda ingin menetapkan jalur ruang kerja default
    - Anda memerlukan flag penyiapan khusus baseline untuk skrip
summary: Referensi CLI untuk `openclaw setup` (percakapan agen sistem dengan fallback orientasi awal)
title: Penyiapan
x-i18n:
    generated_at: "2026-07-16T18:02:44Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 3395dbfe94c2f9686757fff85db709f0a9ed0ac9579e8e3c80ee1d51038f8e18
    source_path: cli/setup.md
    workflow: 16
---

# `openclaw setup`

`openclaw setup` adalah titik masuk agen sistem. Pada sistem yang telah dikonfigurasi, menjalankan
`openclaw setup` tanpa argumen akan membuka obrolan OpenClaw interaktif. Pada sistem baru, perintah tersebut
akan beralih ke orientasi terpandu. Gunakan `-m`/`--message` untuk satu permintaan atau
`--baseline` untuk menginisialisasi folder konfigurasi/ruang kerja tanpa wizard.

Urutan perutean:

1. Setiap opsi orientasi (`--wizard`, `--baseline`, ruang kerja, atur ulang,
   noninteraktif, alur, mode, Gateway, daemon, lewati, impor, jarak jauh, atau opsi
   autentikasi) menjalankan orientasi persis seperti yang dilakukan `openclaw onboard`.
2. `-m`/`--message` atau `--yes` menjalankan agen sistem.
3. Tanpa opsi perutean, sistem interaktif yang telah dikonfigurasi akan membuka OpenClaw. Sistem
   baru menjalankan orientasi. Pada sistem yang telah dikonfigurasi, `--json` mencetak
   ikhtisar sistem bahkan tanpa TTY; opsi orientasi mempertahankan
   ringkasan JSON orientasi.

Dalam mode terpandu, `--workspace <dir>` adalah ruang kerja yang diusulkan kepada OpenClaw;
ruang kerja tersebut hanya disimpan setelah Anda menyetujui usulan itu. Penyiapan dasar, klasik, dan
noninteraktif menyimpan ruang kerja yang diberikan melalui alur normalnya.

Deteksi inferensi terpandu berjalan pada host Gateway di macOS atau Linux. CLI
dan aplikasi macOS memanggil detektor milik Gateway yang sama, yang memeriksa
model yang dikonfigurasi, login CLI yang didukung, variabel lingkungan kunci API, serta
model Ollama atau LM Studio yang telah terinstal. Model lokal tidak pernah diunduh oleh
proses otomatis ini; kandidat yang dipilih harus menjawab penyelesaian nyata sebelum
konfigurasi penyedia dan modelnya disimpan.

`setup` menerima flag orientasi yang sama dengan `openclaw onboard`, termasuk
autentikasi (`--auth-choice`, `--token`, flag kunci penyedia), Gateway
(`--gateway-port`, `--gateway-bind`, `--gateway-auth`, `--install-daemon`),
Tailscale (`--tailscale`), atur ulang (`--reset`, `--reset-scope`), alur
(`--flow quickstart|advanced|manual|import`), dan flag lewati
(`--skip-channels`, `--skip-skills`, `--skip-bootstrap`, `--skip-search`,
`--skip-health`, `--skip-ui`, `--skip-hooks`). Lihat [Orientasi](/id/cli/onboard) dan
[otomatisasi CLI](/id/start/wizard-cli-automation) untuk referensi flag lengkap dan
contoh noninteraktif. `openclaw onboard --modern` tetap menjadi entri kompatibilitas
untuk asisten OpenClaw yang sama dengan gerbang inferensi.

<Note>
`openclaw setup` ditujukan untuk instalasi dengan konfigurasi yang dapat diubah. Dalam mode Nix (`OPENCLAW_NIX_MODE=1`), OpenClaw menolak penulisan penyiapan karena file konfigurasi dikelola oleh Nix. Gunakan [Mulai Cepat nix-openclaw](https://github.com/openclaw/nix-openclaw#quick-start) pihak pertama atau konfigurasi sumber yang setara untuk paket Nix lainnya.
</Note>

## Opsi

| Flag                       | Deskripsi                                                                                           |
| -------------------------- | ----------------------------------------------------------------------------------------------------- |
| `-m, --message <text>`     | Jalankan satu permintaan OpenClaw.                                                                             |
| `--yes`                    | Setujui penulisan konfigurasi persisten untuk satu permintaan `--message`.                                         |
| `--workspace <dir>`        | Usulan ruang kerja dalam mode terpandu; disimpan langsung oleh penyiapan dasar, klasik, dan noninteraktif. |
| `--baseline`               | Buat folder konfigurasi dasar/ruang kerja/sesi tanpa orientasi.                                  |
| `--wizard`                 | Paksa orientasi interaktif.                                                                         |
| `--non-interactive`        | Jalankan orientasi tanpa perintah interaktif.                                                                       |
| `--accept-risk`            | Akui risiko akses agen ke seluruh sistem; wajib digunakan bersama `--non-interactive`.                         |
| `--mode <mode>`            | Mode orientasi: `local` atau `remote`.                                                                 |
| `--flow <flow>`            | Alur orientasi: `quickstart`, `advanced`, `manual`, atau `import`.                                        |
| `--reset`                  | Atur ulang konfigurasi + kredensial + sesi sebelum orientasi (ruang kerja hanya dengan `--reset-scope full`).   |
| `--reset-scope <scope>`    | Cakupan pengaturan ulang: `config`, `config+creds+sessions`, atau `full`.                                            |
| `--import-from <provider>` | Penyedia migrasi yang akan dijalankan selama orientasi.                                                          |
| `--import-source <path>`   | Direktori utama agen sumber untuk `--import-from`.                                                                |
| `--import-secrets`         | Impor rahasia yang didukung selama migrasi orientasi.                                                 |
| `--remote-url <url>`       | URL WebSocket Gateway jarak jauh.                                                                         |
| `--remote-token <token>`   | Token Gateway jarak jauh (opsional).                                                                      |
| `--json`                   | Sistem yang dikonfigurasi: ikhtisar OpenClaw. Rute orientasi: ringkasan orientasi.                           |

`--classic` dan `--non-interactive` saling eksklusif: mode klasik membuka
wizard interaktif, sedangkan penyiapan noninteraktif menggunakan jalur otomatisasi.

### Mode dasar

`openclaw setup --baseline` mempertahankan perilaku lama yang hanya menggunakan mode dasar: perintah ini
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

- Setelah penyiapan dasar, jalankan `openclaw onboard` untuk perjalanan terpandu lengkap, `openclaw configure` untuk perubahan yang ditargetkan, atau `openclaw channels add` untuk menambahkan akun saluran.
- Jika status Hermes terdeteksi, orientasi interaktif dapat menawarkan migrasi secara otomatis. Orientasi impor memerlukan penyiapan baru; gunakan [Migrasi](/id/cli/migrate) untuk rencana uji coba, pencadangan, dan mode penimpaan di luar orientasi.

## Terkait

- [Referensi CLI](/id/cli)
- [Orientasi](/id/cli/onboard)
- [Orientasi (CLI)](/id/start/wizard)
- [Memulai](/id/start/getting-started)
- [Ikhtisar instalasi](/id/install)
