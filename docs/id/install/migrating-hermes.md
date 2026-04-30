---
read_when:
    - Anda beralih dari Hermes dan ingin mempertahankan konfigurasi model, prompt, memori, dan Skills Anda
    - Anda ingin mengetahui apa saja yang diimpor OpenClaw secara otomatis dan apa saja yang tetap hanya tersedia di arsip
    - Anda memerlukan jalur migrasi yang bersih dan berbasis skrip (CI, laptop baru, automasi)
summary: Beralih dari Hermes ke OpenClaw dengan impor yang dipratinjau dan dapat dikembalikan
title: Bermigrasi dari Hermes
x-i18n:
    generated_at: "2026-04-30T09:56:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 01f8a71e524b31c85864be63e54fc8a2057ecb06a73aac9e6fb107fc0c49757d
    source_path: install/migrating-hermes.md
    workflow: 16
---

OpenClaw mengimpor state Hermes melalui penyedia migrasi bawaan. Penyedia ini meninjau semuanya sebelum mengubah state, menyamarkan secret dalam rencana dan laporan, serta membuat backup terverifikasi sebelum apply.

<Note>
Impor memerlukan setup OpenClaw yang baru. Jika Anda sudah memiliki state OpenClaw lokal, reset config, credentials, sessions, dan workspace terlebih dahulu, atau gunakan `openclaw migrate` secara langsung dengan `--overwrite` setelah meninjau rencananya.
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
    Gunakan `openclaw migrate` untuk eksekusi berskrip atau berulang. Lihat [`openclaw migrate`](/id/cli/migrate) untuk referensi lengkap.

    ```bash
    openclaw migrate hermes --dry-run    # preview only
    openclaw migrate apply hermes --yes  # apply with confirmation skipped
    ```

    Tambahkan `--from <path>` saat Hermes berada di luar `~/.hermes`.

  </Tab>
</Tabs>

## Apa yang diimpor

<AccordionGroup>
  <Accordion title="Konfigurasi model">
    - Pilihan model default dari Hermes `config.yaml`.
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
    Default config memori untuk memori file OpenClaw. Penyedia memori eksternal seperti Honcho dicatat sebagai item arsip atau tinjauan manual agar Anda dapat memindahkannya secara sengaja.
  </Accordion>
  <Accordion title="Skills">
    Skills dengan file `SKILL.md` di bawah `skills/<name>/` disalin, bersama dengan nilai config per skill dari `skills.config`.
  </Accordion>
  <Accordion title="Kunci API (ikut serta)">
    Atur `--include-secrets` untuk mengimpor kunci `.env` yang didukung: `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `OPENROUTER_API_KEY`, `GOOGLE_API_KEY`, `GEMINI_API_KEY`, `GROQ_API_KEY`, `XAI_API_KEY`, `MISTRAL_API_KEY`, `DEEPSEEK_API_KEY`. Tanpa flag tersebut, secret tidak pernah disalin.
  </Accordion>
</AccordionGroup>

## Yang tetap hanya diarsipkan

Penyedia menyalin ini ke direktori laporan migrasi untuk tinjauan manual, tetapi **tidak** memuatnya ke config atau credentials OpenClaw live:

- `plugins/`
- `sessions/`
- `logs/`
- `cron/`
- `mcp-tokens/`
- `auth.json`
- `state.db`

OpenClaw menolak mengeksekusi atau memercayai state ini secara otomatis karena format dan asumsi kepercayaan dapat bergeser antar sistem. Pindahkan yang Anda butuhkan secara manual setelah meninjau arsip.

## Alur yang direkomendasikan

<Steps>
  <Step title="Tinjau rencana">
    ```bash
    openclaw migrate hermes --dry-run
    ```

    Rencana mencantumkan semua hal yang akan berubah, termasuk konflik, item yang dilewati, dan item sensitif apa pun. Output rencana menyamarkan kunci bertingkat yang tampak seperti secret.

  </Step>
  <Step title="Terapkan dengan backup">
    ```bash
    openclaw migrate apply hermes --yes
    ```

    OpenClaw membuat dan memverifikasi backup sebelum menerapkan. Jika Anda perlu mengimpor kunci API, tambahkan `--include-secrets`.

  </Step>
  <Step title="Jalankan doctor">
    ```bash
    openclaw doctor
    ```

    [Doctor](/id/gateway/doctor) menerapkan ulang migrasi config yang tertunda dan memeriksa masalah yang muncul selama impor.

  </Step>
  <Step title="Restart dan verifikasi">
    ```bash
    openclaw gateway restart
    openclaw status
    ```

    Pastikan Gateway sehat dan model, memori, serta skills yang diimpor sudah dimuat.

  </Step>
</Steps>

## Penanganan konflik

Apply menolak melanjutkan saat rencana melaporkan konflik (file atau nilai config sudah ada di target).

<Warning>
Jalankan ulang dengan `--overwrite` hanya saat mengganti target yang sudah ada memang disengaja. Penyedia mungkin tetap menulis backup tingkat item untuk file yang ditimpa di direktori laporan migrasi.
</Warning>

Untuk instalasi OpenClaw baru, konflik jarang terjadi. Konflik biasanya muncul saat Anda menjalankan ulang impor pada setup yang sudah memiliki editan pengguna.

Jika konflik muncul di tengah apply (misalnya, race tak terduga pada file config), Hermes menandai item config dependen yang tersisa sebagai `skipped` dengan alasan `blocked by earlier apply conflict`, bukan menulisnya sebagian. Laporan migrasi mencatat setiap item yang diblokir agar Anda dapat menyelesaikan konflik asal dan menjalankan ulang impor.

## Secret

Secret tidak pernah diimpor secara default.

- Jalankan `openclaw migrate apply hermes --yes` terlebih dahulu untuk mengimpor state non-secret.
- Jika Anda juga ingin kunci `.env` yang didukung disalin, jalankan ulang dengan `--include-secrets`.
- Untuk credentials yang dikelola SecretRef, konfigurasikan sumber SecretRef setelah impor selesai.

## Output JSON untuk otomasi

```bash
openclaw migrate hermes --dry-run --json
openclaw migrate apply hermes --json --yes
```

Dengan `--json` dan tanpa `--yes`, apply mencetak rencana dan tidak mengubah state. Ini adalah mode paling aman untuk CI dan skrip bersama.

## Pemecahan masalah

<AccordionGroup>
  <Accordion title="Apply menolak dengan konflik">
    Periksa output rencana. Setiap konflik mengidentifikasi path sumber dan target yang sudah ada. Putuskan per item apakah akan melewati, mengedit target, atau menjalankan ulang dengan `--overwrite`.
  </Accordion>
  <Accordion title="Hermes berada di luar ~/.hermes">
    Berikan `--from /actual/path` (CLI) atau `--import-source /actual/path` (onboarding).
  </Accordion>
  <Accordion title="Onboarding menolak mengimpor pada setup yang sudah ada">
    Impor onboarding memerlukan setup baru. Reset state dan lakukan onboarding ulang, atau gunakan `openclaw migrate apply hermes` secara langsung, yang mendukung `--overwrite` dan kontrol backup eksplisit.
  </Accordion>
  <Accordion title="Kunci API tidak terimpor">
    `--include-secrets` wajib digunakan, dan hanya kunci yang tercantum di atas yang dikenali. Variabel lain di `.env` diabaikan.
  </Accordion>
</AccordionGroup>

## Terkait

- [`openclaw migrate`](/id/cli/migrate): referensi CLI lengkap, kontrak Plugin, dan bentuk JSON.
- [Onboarding](/id/cli/onboard): alur wizard dan flag non-interaktif.
- [Migrasi](/id/install/migrating): memindahkan instalasi OpenClaw antar mesin.
- [Doctor](/id/gateway/doctor): pemeriksaan kesehatan pascamigrasi.
- [Workspace agen](/id/concepts/agent-workspace): tempat `SOUL.md`, `AGENTS.md`, dan file memori berada.
