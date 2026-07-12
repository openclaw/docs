---
read_when:
    - Anda bermigrasi dari Hermes dan ingin mempertahankan konfigurasi model, prompt, memori, serta Skills Anda
    - Anda ingin mengetahui apa yang diimpor OpenClaw secara otomatis dan apa yang tetap hanya ada dalam arsip
    - Anda memerlukan jalur migrasi berbasis skrip yang bersih (CI, laptop baru, otomatisasi)
summary: Beralih dari Hermes ke OpenClaw dengan impor yang dapat dipratinjau dan dibatalkan
title: Bermigrasi dari Hermes
x-i18n:
    generated_at: "2026-07-12T14:18:00Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dd9012efb084c00dfe55bb841fea3cc6908c08b528492f1552bf226f125961e6
    source_path: install/migrating-hermes.md
    workflow: 16
---

Penyedia migrasi Hermes bawaan mendeteksi status di `~/.hermes`, menampilkan pratinjau setiap perubahan sebelum menerapkannya, menyamarkan rahasia dalam rencana dan laporan, serta membuat cadangan OpenClaw yang telah diverifikasi sebelum menyentuh apa pun.

<Note>
Impor memerlukan penyiapan OpenClaw baru. Jika Anda sudah memiliki status OpenClaw lokal, atur ulang konfigurasi, kredensial, sesi, dan ruang kerja terlebih dahulu, atau gunakan `openclaw migrate apply hermes` secara langsung dengan `--overwrite` setelah meninjau rencana.
</Note>

## Dua cara untuk mengimpor

<Tabs>
  <Tab title="Wizard orientasi">
    Mendeteksi Hermes di `~/.hermes` dan menampilkan pratinjau sebelum menerapkan.

    ```bash
    openclaw onboard --flow import
    ```

    Atau arahkan ke sumber tertentu:

    ```bash
    openclaw onboard --import-from hermes --import-source ~/.hermes
    ```

  </Tab>
  <Tab title="CLI">
    Gunakan `openclaw migrate` untuk proses terotomatisasi atau yang dapat diulang. Lihat [`openclaw migrate`](/id/cli/migrate) untuk referensi lengkap.

    ```bash
    openclaw migrate hermes --dry-run    # hanya pratinjau
    openclaw migrate apply hermes --yes  # terapkan tanpa meminta konfirmasi
    ```

    Tambahkan `--from <path>` jika Hermes berada di luar `~/.hermes`.

  </Tab>
</Tabs>

## Yang diimpor

<AccordionGroup>
  <Accordion title="Konfigurasi model">
    - Pemilihan model default dari `config.yaml` Hermes.
    - Penyedia model yang dikonfigurasi dan titik akhir kustom yang kompatibel dengan OpenAI dari `providers` dan `custom_providers`.

  </Accordion>
  <Accordion title="Server MCP">
    Definisi server MCP dari `mcp_servers` atau `mcp.servers`.
  </Accordion>
  <Accordion title="Berkas ruang kerja">
    - `SOUL.md` dan `AGENTS.md` disalin ke ruang kerja agen OpenClaw.
    - `memories/MEMORY.md` dan `memories/USER.md` **ditambahkan** ke berkas memori OpenClaw yang sesuai, bukan menimpanya.

  </Accordion>
  <Accordion title="Konfigurasi memori">
    Default konfigurasi memori untuk memori berkas OpenClaw. Penyedia memori eksternal seperti Honcho dicatat sebagai item arsip atau tinjauan manual agar Anda dapat memindahkannya secara sengaja.
  </Accordion>
  <Accordion title="Skills">
    Skills yang memiliki berkas `SKILL.md` di bawah `skills/<name>/` disalin bersama nilai konfigurasi per Skills dari `skills.config`.
  </Accordion>
  <Accordion title="Kredensial autentikasi">
    `openclaw migrate` interaktif meminta konfirmasi sebelum mengimpor kredensial autentikasi, dengan ya dipilih secara default. Jika disetujui, entri OAuth OpenCode OpenAI dan GitHub Copilot dari `auth.json` milik OpenCode akan diimpor, bersama [kunci `.env` Hermes yang didukung](/id/cli/migrate#supported-env-keys). Entri OAuth dalam `auth.json` milik Hermes sendiri merupakan status lama: entri tersebut ditampilkan sebagai item autentikasi ulang manual/doctor, bukan diimpor ke autentikasi aktif. Gunakan `--include-secrets` untuk mengimpor kredensial dalam proses noninteraktif, `--no-auth-credentials` untuk sepenuhnya melewati impor kredensial, atau flag `--import-secrets` milik wizard orientasi.
  </Accordion>
</AccordionGroup>

## Yang tetap hanya menjadi arsip

Penyedia menyalin item berikut ke direktori laporan migrasi untuk ditinjau secara manual, tetapi **tidak** memuatnya ke konfigurasi atau kredensial aktif OpenClaw:

- `plugins/`
- `sessions/`
- `logs/`
- `cron/`
- `mcp-tokens/`
- `state.db`

OpenClaw menolak mengeksekusi atau memercayai status ini secara otomatis karena format dan asumsi kepercayaan dapat berbeda seiring waktu antar sistem. Pindahkan secara manual hal yang Anda perlukan setelah meninjau arsip.

## Alur yang disarankan

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

    OpenClaw membuat dan memverifikasi cadangan sebelum menerapkan. Contoh noninteraktif ini hanya mengimpor status yang tidak bersifat rahasia. Jalankan tanpa `--yes` untuk menjawab permintaan kredensial secara interaktif, atau tambahkan `--include-secrets` untuk menyertakan kredensial yang didukung dalam proses tanpa pengawasan.

  </Step>
  <Step title="Jalankan doctor">
    ```bash
    openclaw doctor
    ```

    [Doctor](/id/gateway/doctor) menerapkan kembali migrasi konfigurasi yang masih tertunda dan memeriksa masalah yang muncul selama impor.

  </Step>
  <Step title="Mulai ulang dan verifikasi">
    ```bash
    openclaw gateway restart
    openclaw status
    ```

    Pastikan Gateway dalam kondisi sehat dan model, memori, serta Skills yang diimpor telah dimuat.

  </Step>
</Steps>

## Penanganan konflik

Penerapan menolak untuk melanjutkan ketika rencana melaporkan konflik (berkas atau nilai konfigurasi sudah ada di target).

<Warning>
Jalankan ulang dengan `--overwrite` hanya jika penggantian target yang ada memang disengaja. Penyedia mungkin tetap membuat cadangan tingkat item untuk berkas yang ditimpa di direktori laporan migrasi.
</Warning>

Konflik jarang terjadi pada instalasi baru. Konflik biasanya muncul ketika Anda menjalankan ulang impor pada penyiapan yang sudah memiliki perubahan pengguna.

Jika konflik muncul di tengah penerapan (misalnya, kondisi pacu yang tidak terduga pada berkas konfigurasi), Hermes menandai item konfigurasi dependen yang tersisa sebagai `skipped` dengan alasan `blocked by earlier apply conflict`, alih-alih menulisnya sebagian. Laporan migrasi mencatat setiap item yang terblokir agar Anda dapat menyelesaikan konflik awal dan menjalankan ulang impor.

## Rahasia

`openclaw migrate` interaktif menanyakan apakah kredensial autentikasi yang terdeteksi akan diimpor, dengan ya dipilih secara default.

- Jika disetujui, entri OAuth OpenCode OpenAI dan GitHub Copilot dari `auth.json` milik OpenCode akan diimpor, bersama [kunci `.env` yang didukung](/id/cli/migrate#supported-env-keys). Entri OAuth dalam `auth.json` milik Hermes sendiri dilaporkan untuk autentikasi ulang OpenAI secara manual atau perbaikan melalui doctor.
- Gunakan `--no-auth-credentials`, atau jawab tidak pada permintaan, untuk hanya mengimpor status yang tidak bersifat rahasia.
- Gunakan `--include-secrets` untuk mengimpor kredensial dalam proses `--yes` tanpa pengawasan.
- Gunakan flag `--import-secrets` milik wizard orientasi untuk mengimpor kredensial dari wizard.

## Keluaran JSON untuk otomatisasi

```bash
openclaw migrate hermes --dry-run --json
openclaw migrate apply hermes --json --yes
```

Dengan `--json` dan tanpa `--yes`, penerapan mencetak rencana dan tidak mengubah status—mode paling aman untuk CI dan skrip bersama.

## Pemecahan masalah

<AccordionGroup>
  <Accordion title="Penerapan ditolak karena konflik">
    Periksa keluaran rencana. Setiap konflik mengidentifikasi jalur sumber dan target yang sudah ada. Tentukan untuk setiap item apakah akan melewatinya, mengedit target, atau menjalankan ulang dengan `--overwrite`.
  </Accordion>
  <Accordion title="Hermes berada di luar ~/.hermes">
    Berikan `--from /actual/path` (CLI) atau `--import-source /actual/path` (orientasi).
  </Accordion>
  <Accordion title="Orientasi menolak mengimpor pada penyiapan yang sudah ada">
    Impor melalui orientasi memerlukan penyiapan baru. Atur ulang status dan lakukan orientasi ulang, atau gunakan `openclaw migrate apply hermes` secara langsung, yang mendukung `--overwrite` dan kontrol cadangan eksplisit.
  </Accordion>
  <Accordion title="Kunci API tidak diimpor">
    `openclaw migrate` interaktif hanya mengimpor kunci API jika Anda menyetujui permintaan kredensial. Proses `--yes` noninteraktif memerlukan `--include-secrets`; impor melalui orientasi memerlukan `--import-secrets`. Hanya [kunci `.env` yang didukung](/id/cli/migrate#supported-env-keys) yang dikenali—variabel `.env` lainnya diabaikan.
  </Accordion>
</AccordionGroup>

## Terkait

- [`openclaw migrate`](/id/cli/migrate): referensi CLI lengkap, kontrak Plugin, dan struktur JSON.
- [Orientasi](/id/cli/onboard): alur wizard dan flag noninteraktif.
- [Migrasi](/id/install/migrating): memindahkan instalasi OpenClaw antar mesin.
- [Doctor](/id/gateway/doctor): pemeriksaan kondisi setelah migrasi.
- [Ruang kerja agen](/id/concepts/agent-workspace): lokasi `SOUL.md`, `AGENTS.md`, dan berkas memori.
