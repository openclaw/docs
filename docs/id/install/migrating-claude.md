---
read_when:
    - Anda beralih dari Claude Code atau Claude Desktop dan ingin mempertahankan instruksi, server MCP, dan Skills
    - Anda perlu memahami apa yang diimpor OpenClaw secara otomatis dan apa yang tetap hanya arsip
summary: Pindahkan keadaan lokal Claude Code dan Claude Desktop ke OpenClaw dengan impor yang dipratinjau
title: Bermigrasi dari Claude
x-i18n:
    generated_at: "2026-04-30T09:56:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1b44eda85f3a3714d7d360d04fdd2c99a692fa6491f12e73847c5f08d702a62c
    source_path: install/migrating-claude.md
    workflow: 16
---

OpenClaw mengimpor state Claude lokal melalui penyedia migrasi Claude bawaan. Penyedia menampilkan pratinjau setiap item sebelum mengubah state, menyamarkan rahasia dalam rencana dan laporan, serta membuat cadangan terverifikasi sebelum diterapkan.

<Note>
Impor onboarding memerlukan penyiapan OpenClaw yang baru. Jika Anda sudah memiliki state OpenClaw lokal, reset konfigurasi, kredensial, sesi, dan ruang kerja terlebih dahulu, atau gunakan `openclaw migrate` secara langsung dengan `--overwrite` setelah meninjau rencananya.
</Note>

## Dua cara untuk mengimpor

<Tabs>
  <Tab title="Wizard onboarding">
    Wizard menawarkan Claude saat mendeteksi state Claude lokal.

    ```bash
    openclaw onboard --flow import
    ```

    Atau arahkan ke sumber tertentu:

    ```bash
    openclaw onboard --import-from claude --import-source ~/.claude
    ```

  </Tab>
  <Tab title="CLI">
    Gunakan `openclaw migrate` untuk eksekusi berskrip atau berulang. Lihat [`openclaw migrate`](/id/cli/migrate) untuk referensi lengkap.

    ```bash
    openclaw migrate claude --dry-run
    openclaw migrate apply claude --yes
    ```

    Tambahkan `--from <path>` untuk mengimpor home Claude Code atau root proyek tertentu.

  </Tab>
</Tabs>

## Apa yang diimpor

<AccordionGroup>
  <Accordion title="Instruksi dan memori">
    - Konten proyek `CLAUDE.md` dan `.claude/CLAUDE.md` disalin atau ditambahkan ke `AGENTS.md` ruang kerja agen OpenClaw.
    - Konten pengguna `~/.claude/CLAUDE.md` ditambahkan ke `USER.md` ruang kerja.

  </Accordion>
  <Accordion title="Server MCP">
    Definisi server MCP diimpor dari `.mcp.json` proyek, Claude Code `~/.claude.json`, dan Claude Desktop `claude_desktop_config.json` jika ada.
  </Accordion>
  <Accordion title="Skills dan perintah">
    - Skills Claude dengan file `SKILL.md` disalin ke direktori Skills ruang kerja OpenClaw.
    - File Markdown perintah Claude di bawah `.claude/commands/` atau `~/.claude/commands/` dikonversi menjadi Skills OpenClaw dengan `disable-model-invocation: true`.

  </Accordion>
</AccordionGroup>

## Apa yang tetap hanya arsip

Penyedia menyalin ini ke laporan migrasi untuk peninjauan manual, tetapi **tidak** memuatnya ke konfigurasi OpenClaw aktif:

- Hook Claude
- Izin Claude dan allowlist alat yang luas
- Default lingkungan Claude
- `CLAUDE.local.md`
- `.claude/rules/`
- Subagen Claude di bawah `.claude/agents/` atau `~/.claude/agents/`
- Cache, rencana, dan direktori riwayat proyek Claude Code
- Ekstensi Claude Desktop dan kredensial yang disimpan OS

OpenClaw menolak menjalankan hook, memercayai allowlist izin, atau mendekode state kredensial OAuth dan Desktop yang buram secara otomatis. Pindahkan yang Anda perlukan secara manual setelah meninjau arsip.

## Pemilihan sumber

Tanpa `--from`, OpenClaw memeriksa home Claude Code default di `~/.claude`, file state Claude Code `~/.claude.json` yang disampel, dan konfigurasi MCP Claude Desktop di macOS.

Saat `--from` menunjuk ke root proyek, OpenClaw hanya mengimpor file Claude proyek tersebut seperti `CLAUDE.md`, `.claude/settings.json`, `.claude/commands/`, `.claude/skills/`, dan `.mcp.json`. Itu tidak membaca home Claude global Anda selama impor root proyek.

## Alur yang direkomendasikan

<Steps>
  <Step title="Pratinjau rencana">
    ```bash
    openclaw migrate claude --dry-run
    ```

    Rencana mencantumkan semua yang akan berubah, termasuk konflik, item yang dilewati, dan nilai sensitif yang disamarkan dari field MCP `env` atau `headers` bersarang.

  </Step>
  <Step title="Terapkan dengan cadangan">
    ```bash
    openclaw migrate apply claude --yes
    ```

    OpenClaw membuat dan memverifikasi cadangan sebelum menerapkan.

  </Step>
  <Step title="Jalankan doctor">
    ```bash
    openclaw doctor
    ```

    [Doctor](/id/gateway/doctor) memeriksa masalah konfigurasi atau state setelah impor.

  </Step>
  <Step title="Mulai ulang dan verifikasi">
    ```bash
    openclaw gateway restart
    openclaw status
    ```

    Pastikan Gateway sehat dan instruksi, server MCP, serta Skills yang diimpor sudah dimuat.

  </Step>
</Steps>

## Penanganan konflik

Penerapan menolak melanjutkan saat rencana melaporkan konflik (file atau nilai konfigurasi sudah ada di target).

<Warning>
Jalankan ulang dengan `--overwrite` hanya saat penggantian target yang ada memang disengaja. Penyedia mungkin tetap menulis cadangan tingkat item untuk file yang ditimpa di direktori laporan migrasi.
</Warning>

Untuk instalasi OpenClaw baru, konflik jarang terjadi. Konflik biasanya muncul saat Anda menjalankan ulang impor pada penyiapan yang sudah memiliki editan pengguna.

## Output JSON untuk otomatisasi

```bash
openclaw migrate claude --dry-run --json
openclaw migrate apply claude --json --yes
```

Dengan `--json` dan tanpa `--yes`, penerapan mencetak rencana dan tidak mengubah state. Ini adalah mode paling aman untuk CI dan skrip bersama.

## Pemecahan masalah

<AccordionGroup>
  <Accordion title="State Claude berada di luar ~/.claude">
    Teruskan `--from /actual/path` (CLI) atau `--import-source /actual/path` (onboarding).
  </Accordion>
  <Accordion title="Onboarding menolak mengimpor pada penyiapan yang sudah ada">
    Impor onboarding memerlukan penyiapan baru. Reset state lalu onboarding ulang, atau gunakan `openclaw migrate apply claude` secara langsung, yang mendukung `--overwrite` dan kontrol cadangan eksplisit.
  </Accordion>
  <Accordion title="Server MCP dari Claude Desktop tidak terimpor">
    Claude Desktop membaca `claude_desktop_config.json` dari path khusus platform. Arahkan `--from` ke direktori file tersebut jika OpenClaw tidak mendeteksinya secara otomatis.
  </Accordion>
  <Accordion title="Perintah Claude menjadi Skills dengan pemanggilan model dinonaktifkan">
    Ini sesuai desain. Perintah Claude dipicu pengguna, jadi OpenClaw mengimpornya sebagai Skills dengan `disable-model-invocation: true`. Edit frontmatter setiap Skill jika Anda ingin agen memanggilnya secara otomatis.
  </Accordion>
</AccordionGroup>

## Terkait

- [`openclaw migrate`](/id/cli/migrate): referensi CLI lengkap, kontrak Plugin, dan bentuk JSON.
- [Panduan migrasi](/id/install/migrating): semua jalur migrasi.
- [Bermigrasi dari Hermes](/id/install/migrating-hermes): jalur impor lintas sistem lainnya.
- [Onboarding](/id/cli/onboard): alur wizard dan flag noninteraktif.
- [Doctor](/id/gateway/doctor): pemeriksaan kesehatan pascamigrasi.
- [Ruang kerja agen](/id/concepts/agent-workspace): tempat `AGENTS.md`, `USER.md`, dan Skills berada.
