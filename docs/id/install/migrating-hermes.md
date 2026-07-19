---
read_when:
    - Anda beralih dari Hermes dan ingin mempertahankan konfigurasi model, prompt, memori, dan Skills Anda
    - Anda ingin mengetahui apa yang diimpor OpenClaw secara otomatis dan apa yang hanya disimpan sebagai arsip
    - Anda memerlukan jalur migrasi yang bersih dan berbasis skrip (CI, laptop baru, otomatisasi)
summary: Beralih dari Hermes ke OpenClaw dengan impor yang dapat dipratinjau dan dibatalkan
title: Bermigrasi dari Hermes
x-i18n:
    generated_at: "2026-07-19T05:08:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 6b75d8bb1c5d40693354a8902e35ade4239dc001705abeee04a004e2cbaaa94c
    source_path: install/migrating-hermes.md
    workflow: 16
---

Penyedia migrasi Hermes bawaan mengikuti `HERMES_HOME` dan profil Hermes aktif, dengan fallback ke `~/.hermes` di macOS/Linux atau `%LOCALAPPDATA%\hermes` di Windows. Penyedia ini menampilkan pratinjau setiap perubahan sebelum menerapkannya, menyamarkan rahasia dalam rencana dan laporan, serta membuat cadangan OpenClaw yang telah diverifikasi sebelum menyentuh apa pun. Jalur `--from` yang ditentukan secara eksplisit selalu diprioritaskan.

<Note>
Impor memerlukan penyiapan OpenClaw baru. Jika Anda sudah memiliki status OpenClaw lokal, atur ulang konfigurasi, kredensial, sesi, dan ruang kerja terlebih dahulu, atau gunakan `openclaw migrate apply hermes` secara langsung dengan `--overwrite` setelah meninjau rencana.
</Note>

## Dua cara untuk mengimpor

<Tabs>
  <Tab title="Wizard orientasi">
    Mendeteksi direktori utama/profil Hermes aktif dan menampilkan pratinjau sebelum menerapkan.

    ```bash
    openclaw onboard --flow import
    ```

    Atau arahkan ke sumber tertentu:

    ```bash
    openclaw onboard --import-from hermes --import-source ~/.hermes
    ```

  </Tab>
  <Tab title="CLI">
    Gunakan `openclaw migrate` untuk eksekusi dengan skrip atau berulang. Lihat [`openclaw migrate`](/id/cli/migrate) untuk referensi lengkap.

    ```bash
    openclaw migrate hermes --dry-run    # hanya pratinjau
    openclaw migrate apply hermes --yes  # terapkan tanpa konfirmasi
    ```

    Tambahkan `--from <path>` untuk menggantikan penemuan direktori utama/profil Hermes.

  </Tab>
</Tabs>

## Yang diimpor

<AccordionGroup>
  <Accordion title="Konfigurasi model">
    - Pemilihan model default dari `config.yaml` Hermes.
    - Penyedia model yang dikonfigurasi dan endpoint khusus dari `model`, `providers`, dan `custom_providers`, termasuk transportasi Hermes Chat Completions, Codex Responses, dan Anthropic Messages saat ini.

  </Accordion>
  <Accordion title="Server MCP">
    Definisi server MCP dari `mcp_servers` atau `mcp.servers`, termasuk status dinonaktifkan, batas waktu, dukungan alat paralel, cakupan OAuth, bidang TLS yang kompatibel, serta kebijakan alat native/resource/prompt. Variabel lingkungan dan header literal memerlukan persetujuan impor kredensial. Pengaturan siklus hidup, sampling, elicitation, preflight, keepalive, bundel CA, kunci klien yang dilindungi kata sandi, dan klien OAuth yang telah didaftarkan sebelumnya yang hanya tersedia di Hermes menjadi item tinjauan manual, bukan konfigurasi OpenClaw yang tidak valid.
  </Accordion>
  <Accordion title="File ruang kerja">
    - `SOUL.md` dan `AGENTS.md` disalin ke ruang kerja agen OpenClaw.
    - `memories/MEMORY.md` dan `memories/USER.md` **ditambahkan** ke file memori OpenClaw yang sesuai, bukan menimpanya.
    - Permukaan khusus memori berperilaku berbeda: halaman memori orientasi dan halaman impor Memory di Control UI menyalin kedua file ini ke bawah `memory/imports/hermes/` untuk pemanggilan kembali terindeks dan membiarkan memori ruang kerja yang ada tetap tidak tersentuh.

  </Accordion>
  <Accordion title="Konfigurasi memori">
    Default konfigurasi memori untuk memori file OpenClaw. Penyedia memori eksternal seperti Honcho dicatat sebagai item arsip atau tinjauan manual agar Anda dapat memindahkannya secara sengaja.
  </Accordion>
  <Accordion title="Skills">
    Skills yang memiliki file `SKILL.md` di mana pun di bawah `skills/` ditemukan secara rekursif, diratakan ke dalam direktori skill ruang kerja OpenClaw, dan disalin beserta file pendukungnya. Nilai konfigurasi per skill dari `skills.config` dipertahankan.
  </Accordion>
  <Accordion title="Kredensial autentikasi">
    `openclaw migrate` interaktif meminta konfirmasi sebelum mengimpor kredensial autentikasi, dengan ya dipilih secara default. Impor yang diterima mencakup entri OAuth OpenAI Codex Hermes saat ini, entri OAuth OpenAI dan GitHub Copilot OpenCode, serta [kunci `.env` Hermes yang didukung](/id/cli/migrate#supported-env-keys). Gunakan `--include-secrets` untuk impor noninteraktif, `--no-auth-credentials` untuk melewati kredensial, atau flag `--import-secrets` pada orientasi. Setelah mengimpor OAuth Hermes, jangan biarkan Hermes dan OpenClaw menggunakan grant penyegaran yang sama; autentikasi ulang salah satu pihak sebelum menjalankan keduanya.
  </Accordion>
</AccordionGroup>

## Yang tetap hanya berupa arsip

Penyedia menyalin hal-hal berikut ke direktori laporan migrasi untuk ditinjau secara manual, tetapi **tidak** memuatnya ke konfigurasi atau kredensial OpenClaw aktif:

- `plugins/`
- `sessions/`
- `logs/`
- `cron/`
- `mcp-tokens/`
- `plans/`, `workspace/`, `skins/`, dan `kanban/`
- Penyimpanan `pairing/` dan `platforms/`, serta status perutean/proses Gateway
- `state.db`, `hermes_state.db`, `projects.db`, `response_store.db`, `memory_store.db`, `verification_evidence.db`, `kanban.db`, dan `retaindb_queue.db`

OpenClaw menolak menjalankan atau memercayai status ini secara otomatis karena format dan asumsi kepercayaan dapat berbeda antar sistem. Pindahkan secara manual hal yang Anda perlukan setelah meninjau arsip.

## Alur yang direkomendasikan

<Steps>
  <Step title="Pratinjau rencana">
    ```bash
    openclaw migrate hermes --dry-run
    ```

    Rencana mencantumkan semua hal yang akan berubah, termasuk konflik, item yang dilewati, dan item sensitif. Kunci bertingkat yang tampak seperti rahasia disamarkan dalam keluaran.

  </Step>
  <Step title="Terapkan dengan cadangan">
    ```bash
    openclaw migrate apply hermes --yes
    ```

    OpenClaw membuat dan memverifikasi cadangan sebelum menerapkan. Contoh noninteraktif ini hanya mengimpor status nonrahasia. Jalankan tanpa `--yes` untuk menjawab permintaan kredensial secara interaktif, atau tambahkan `--include-secrets` untuk menyertakan kredensial yang didukung dalam eksekusi tanpa pengawasan.

  </Step>
  <Step title="Jalankan doctor">
    ```bash
    openclaw doctor
    ```

    [Doctor](/id/gateway/doctor) menerapkan kembali migrasi konfigurasi yang tertunda dan memeriksa masalah yang timbul selama impor.

  </Step>
  <Step title="Mulai ulang dan verifikasi">
    ```bash
    openclaw gateway restart
    openclaw status
    ```

    Pastikan Gateway dalam kondisi sehat dan model, memori, serta skill yang diimpor telah dimuat.

  </Step>
</Steps>

## Penanganan konflik

Penerapan menolak melanjutkan ketika rencana melaporkan konflik (file atau nilai konfigurasi sudah ada di target).

<Warning>
Jalankan ulang dengan `--overwrite` hanya jika penggantian target yang ada memang disengaja. Penyedia mungkin tetap menulis cadangan tingkat item untuk file yang ditimpa ke direktori laporan migrasi.
</Warning>

Konflik jarang terjadi pada instalasi baru. Konflik biasanya muncul ketika Anda menjalankan ulang impor terhadap penyiapan yang sudah memiliki perubahan pengguna.

Jika konflik muncul di tengah penerapan (misalnya, kondisi berpacu yang tidak terduga pada file konfigurasi), item tersebut dilaporkan sebagai konflik sementara file, skill, kredensial, arsip, dan entri konfigurasi yang independen tetap dilanjutkan. Selesaikan item yang berkonflik dan jalankan ulang impor; impor memori yang identik bersifat idempoten.

## Rahasia

`openclaw migrate` interaktif menanyakan apakah kredensial autentikasi yang terdeteksi akan diimpor, dengan ya dipilih secara default.

- Menerima akan mengimpor entri OAuth OpenAI Codex Hermes saat ini, entri OAuth OpenAI dan GitHub Copilot OpenCode, serta [kunci `.env` yang didukung](/id/cli/migrate#supported-env-keys).
- Gunakan `--no-auth-credentials`, atau jawab tidak pada permintaan, untuk hanya mengimpor status nonrahasia.
- Gunakan `--include-secrets` untuk mengimpor kredensial dalam eksekusi `--yes` tanpa pengawasan.
- Gunakan flag `--import-secrets` milik wizard orientasi untuk mengimpor kredensial dari wizard.

## Keluaran JSON untuk otomatisasi

```bash
openclaw migrate hermes --dry-run --json
openclaw migrate apply hermes --json --yes
```

Dengan `--json` dan tanpa `--yes`, penerapan mencetak rencana dan tidak mengubah status — mode teraman untuk CI dan skrip bersama.

## Pemecahan masalah

<AccordionGroup>
  <Accordion title="Penerapan menolak karena konflik">
    Periksa keluaran rencana. Setiap konflik mengidentifikasi jalur sumber dan target yang sudah ada. Tentukan untuk setiap item apakah akan melewatinya, mengedit target, atau menjalankan ulang dengan `--overwrite`.
  </Accordion>
  <Accordion title="Hermes berada di luar ~/.hermes">
    Berikan `--from /actual/path` (CLI) atau `--import-source /actual/path` (orientasi).
  </Accordion>
  <Accordion title="Orientasi menolak mengimpor pada penyiapan yang sudah ada">
    Impor melalui orientasi memerlukan penyiapan baru. Atur ulang status dan lakukan orientasi ulang, atau gunakan `openclaw migrate apply hermes` secara langsung, yang mendukung `--overwrite` dan kontrol cadangan eksplisit.
  </Accordion>
  <Accordion title="Kunci API tidak diimpor">
    `openclaw migrate` interaktif hanya mengimpor kunci API ketika Anda menerima permintaan kredensial. Eksekusi `--yes` noninteraktif memerlukan `--include-secrets`; impor melalui orientasi memerlukan `--import-secrets`. Hanya [kunci `.env` yang didukung](/id/cli/migrate#supported-env-keys) yang dikenali — variabel `.env` lainnya diabaikan.
  </Accordion>
</AccordionGroup>

## Terkait

- [`openclaw migrate`](/id/cli/migrate): referensi CLI lengkap, kontrak Plugin, dan bentuk JSON.
- [Orientasi](/id/cli/onboard): alur wizard dan flag noninteraktif.
- [Migrasi](/id/install/migrating): memindahkan instalasi OpenClaw antarmesin.
- [Doctor](/id/gateway/doctor): pemeriksaan kesehatan pascamigrasi.
- [Ruang kerja agen](/id/concepts/agent-workspace): lokasi `SOUL.md`, `AGENTS.md`, dan file memori.
