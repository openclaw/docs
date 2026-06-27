---
read_when:
    - Anda beralih dari Hermes dan ingin mempertahankan konfigurasi model, prompt, memori, dan Skills Anda
    - Anda ingin mengetahui apa yang diimpor OpenClaw secara otomatis dan apa yang tetap hanya arsip
    - Anda memerlukan jalur migrasi yang bersih dan terskrip (CI, laptop baru, otomatisasi)
summary: Pindah dari Hermes ke OpenClaw dengan impor yang dipratinjau dan dapat dibalik
title: Bermigrasi dari Hermes
x-i18n:
    generated_at: "2026-06-27T17:38:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4f2a2bfea4fd276e3392261e8ecea09d147424636efb200ced1deb86ac0161b5
    source_path: install/migrating-hermes.md
    workflow: 16
---

OpenClaw mengimpor status Hermes melalui penyedia migrasi bawaan. Penyedia ini mempratinjau semuanya sebelum mengubah status, menyamarkan rahasia dalam rencana dan laporan, serta membuat cadangan terverifikasi sebelum menerapkan.

<Note>
Impor memerlukan penyiapan OpenClaw yang baru. Jika Anda sudah memiliki status OpenClaw lokal, reset konfigurasi, kredensial, sesi, dan workspace terlebih dahulu, atau gunakan `openclaw migrate` langsung dengan `--overwrite` setelah meninjau rencana.
</Note>

## Dua cara untuk mengimpor

<Tabs>
  <Tab title="Wizard onboarding">
    Jalur tercepat. Wizard mendeteksi Hermes di `~/.hermes` dan menampilkan pratinjau sebelum menerapkan.

    ```bash
    openclaw onboard --flow import
    ```

    Atau arahkan ke sumber tertentu:

    ```bash
    openclaw onboard --import-from hermes --import-source ~/.hermes
    ```

  </Tab>
  <Tab title="CLI">
    Gunakan `openclaw migrate` untuk eksekusi berskrip atau yang dapat diulang. Lihat [`openclaw migrate`](/id/cli/migrate) untuk referensi lengkap.

    ```bash
    openclaw migrate hermes --dry-run    # preview only
    openclaw migrate apply hermes --yes  # apply with confirmation skipped
    ```

    Tambahkan `--from <path>` saat Hermes berada di luar `~/.hermes`.

  </Tab>
</Tabs>

## Yang diimpor

<AccordionGroup>
  <Accordion title="Konfigurasi model">
    - Pilihan model default dari `config.yaml` Hermes.
    - Penyedia model yang dikonfigurasi dan endpoint kustom yang kompatibel dengan OpenAI dari `providers` dan `custom_providers`.

  </Accordion>
  <Accordion title="Server MCP">
    Definisi server MCP dari `mcp_servers` atau `mcp.servers`.
  </Accordion>
  <Accordion title="File workspace">
    - `SOUL.md` dan `AGENTS.md` disalin ke workspace agen OpenClaw.
    - `memories/MEMORY.md` dan `memories/USER.md` **ditambahkan** ke file memori OpenClaw yang sesuai, bukan menimpanya.

  </Accordion>
  <Accordion title="Konfigurasi memori">
    Default konfigurasi memori untuk memori file OpenClaw. Penyedia memori eksternal seperti Honcho dicatat sebagai item arsip atau peninjauan manual agar Anda dapat memindahkannya secara sengaja.
  </Accordion>
  <Accordion title="Skills">
    Skills dengan file `SKILL.md` di bawah `skills/<name>/` disalin, beserta nilai konfigurasi per-Skills dari `skills.config`.
  </Accordion>
  <Accordion title="Kredensial auth">
    `openclaw migrate` interaktif bertanya sebelum mengimpor kredensial auth, dengan ya dipilih secara default. Impor yang diterima mencakup kredensial OAuth OpenAI OpenCode dari `auth.json` OpenCode, entri OpenCode dan GitHub Copilot dari `auth.json` OpenCode, serta [kunci `.env` yang didukung](/id/cli/migrate#supported-env-keys). Entri OAuth `auth.json` Hermes adalah status legacy dan ditampilkan sebagai pekerjaan reauth/doctor manual, bukan diimpor ke auth aktif. Gunakan `--include-secrets` untuk impor kredensial `openclaw migrate` non-interaktif, `--no-auth-credentials` untuk melewatinya, atau onboarding `--import-secrets` saat mengimpor dari wizard onboarding.
  </Accordion>
</AccordionGroup>

## Yang tetap hanya arsip

Penyedia menyalin ini ke direktori laporan migrasi untuk peninjauan manual, tetapi **tidak** memuatnya ke konfigurasi atau kredensial OpenClaw aktif:

- `plugins/`
- `sessions/`
- `logs/`
- `cron/`
- `mcp-tokens/`
- `state.db`

OpenClaw menolak mengeksekusi atau memercayai status ini secara otomatis karena format dan asumsi kepercayaan dapat bergeser antar sistem. Pindahkan yang Anda butuhkan secara manual setelah meninjau arsip.

## Alur yang direkomendasikan

<Steps>
  <Step title="Pratinjau rencana">
    ```bash
    openclaw migrate hermes --dry-run
    ```

    Rencana mencantumkan semua yang akan berubah, termasuk konflik, item yang dilewati, dan item sensitif apa pun. Output rencana menyamarkan kunci bertingkat yang terlihat seperti rahasia.

  </Step>
  <Step title="Terapkan dengan cadangan">
    ```bash
    openclaw migrate apply hermes --yes
    ```

    OpenClaw membuat dan memverifikasi cadangan sebelum menerapkan. Contoh non-interaktif ini mengimpor status non-rahasia. Jalankan tanpa `--yes` untuk menjawab prompt kredensial, atau tambahkan `--include-secrets` untuk menyertakan kredensial yang didukung dalam eksekusi tanpa pengawasan.

  </Step>
  <Step title="Jalankan doctor">
    ```bash
    openclaw doctor
    ```

    [Doctor](/id/gateway/doctor) menerapkan ulang migrasi konfigurasi yang tertunda dan memeriksa masalah yang muncul selama impor.

  </Step>
  <Step title="Mulai ulang dan verifikasi">
    ```bash
    openclaw gateway restart
    openclaw status
    ```

    Pastikan Gateway sehat dan model, memori, serta Skills yang diimpor sudah dimuat.

  </Step>
</Steps>

## Penanganan konflik

Penerapan menolak melanjutkan saat rencana melaporkan konflik (file atau nilai konfigurasi sudah ada di target).

<Warning>
Jalankan ulang dengan `--overwrite` hanya saat mengganti target yang ada memang disengaja. Penyedia mungkin tetap menulis cadangan tingkat item untuk file yang ditimpa di direktori laporan migrasi.
</Warning>

Untuk instalasi OpenClaw baru, konflik jarang terjadi. Biasanya konflik muncul saat Anda menjalankan ulang impor pada penyiapan yang sudah memiliki editan pengguna.

Jika konflik muncul di tengah penerapan (misalnya, race tak terduga pada file konfigurasi), Hermes menandai item konfigurasi dependen yang tersisa sebagai `skipped` dengan alasan `blocked by earlier apply conflict`, bukan menuliskannya sebagian. Laporan migrasi mencatat setiap item yang diblokir sehingga Anda dapat menyelesaikan konflik asli dan menjalankan ulang impor.

## Rahasia

`openclaw migrate` interaktif bertanya apakah akan mengimpor kredensial auth yang terdeteksi, dengan ya dipilih secara default.

- Menerima prompt mengimpor kredensial OAuth OpenAI OpenCode dari `auth.json` OpenCode, entri OpenCode dan GitHub Copilot dari `auth.json` OpenCode, serta [kunci `.env` yang didukung](/id/cli/migrate#supported-env-keys). Entri OAuth `auth.json` Hermes dilaporkan untuk reauth OpenAI manual atau perbaikan doctor.
- Gunakan `--no-auth-credentials` atau pilih tidak pada prompt untuk hanya mengimpor status non-rahasia.
- Gunakan `--include-secrets` saat menjalankan tanpa pengawasan dengan `--yes`.
- Gunakan onboarding `--import-secrets` saat mengimpor kredensial dari wizard onboarding.
- Untuk kredensial yang dikelola SecretRef, konfigurasikan sumber SecretRef setelah impor selesai.

## Output JSON untuk automasi

```bash
openclaw migrate hermes --dry-run --json
openclaw migrate apply hermes --json --yes
```

Dengan `--json` dan tanpa `--yes`, penerapan mencetak rencana dan tidak mengubah status. Ini adalah mode paling aman untuk CI dan skrip bersama.

## Pemecahan masalah

<AccordionGroup>
  <Accordion title="Penerapan menolak karena konflik">
    Periksa output rencana. Setiap konflik mengidentifikasi path sumber dan target yang sudah ada. Putuskan per item apakah akan melewati, mengedit target, atau menjalankan ulang dengan `--overwrite`.
  </Accordion>
  <Accordion title="Hermes berada di luar ~/.hermes">
    Berikan `--from /actual/path` (CLI) atau `--import-source /actual/path` (onboarding).
  </Accordion>
  <Accordion title="Onboarding menolak mengimpor pada penyiapan yang sudah ada">
    Impor onboarding memerlukan penyiapan baru. Reset status dan lakukan onboarding ulang, atau gunakan `openclaw migrate apply hermes` langsung, yang mendukung `--overwrite` dan kontrol cadangan eksplisit.
  </Accordion>
  <Accordion title="Kunci API tidak terimpor">
    `openclaw migrate` interaktif mengimpor kunci API hanya saat Anda menerima prompt kredensial. Eksekusi `--yes` non-interaktif memerlukan `--include-secrets`; impor onboarding memerlukan `--import-secrets`. Hanya [kunci `.env` yang didukung](/id/cli/migrate#supported-env-keys) yang dikenali; variabel lain di `.env` diabaikan.
  </Accordion>
</AccordionGroup>

## Terkait

- [`openclaw migrate`](/id/cli/migrate): referensi CLI lengkap, kontrak Plugin, dan bentuk JSON.
- [Onboarding](/id/cli/onboard): alur wizard dan flag non-interaktif.
- [Migrasi](/id/install/migrating): memindahkan instalasi OpenClaw antar mesin.
- [Doctor](/id/gateway/doctor): pemeriksaan kesehatan pascamigrasi.
- [Workspace agen](/id/concepts/agent-workspace): tempat `SOUL.md`, `AGENTS.md`, dan file memori berada.
