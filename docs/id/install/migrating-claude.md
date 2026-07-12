---
read_when:
    - Anda beralih dari Claude Code atau Claude Desktop dan ingin mempertahankan instruksi, server MCP, dan Skills
    - Anda perlu memahami apa yang diimpor OpenClaw secara otomatis dan apa yang tetap hanya sebagai arsip
summary: Pindahkan status lokal Claude Code dan Claude Desktop ke OpenClaw dengan pratinjau impor
title: Bermigrasi dari Claude
x-i18n:
    generated_at: "2026-07-12T14:19:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f31088b749a1bebe39b16f519b1817ffeb71ca31e8cbf46fd59db6ff603dbe0f
    source_path: install/migrating-claude.md
    workflow: 16
---

OpenClaw mengimpor status Claude lokal melalui penyedia migrasi Claude bawaan. Penyedia ini menampilkan pratinjau setiap item sebelum mengubah status, menyamarkan rahasia dalam rencana dan laporan, serta membuat cadangan terverifikasi sebelum penerapan.

<Note>
Impor orientasi memerlukan penyiapan OpenClaw baru. Jika Anda sudah memiliki status OpenClaw lokal, atur ulang konfigurasi, kredensial, sesi, dan ruang kerja terlebih dahulu, atau gunakan `openclaw migrate` secara langsung dengan `--overwrite` setelah meninjau rencana.
</Note>

## Dua cara untuk mengimpor

<Tabs>
  <Tab title="Wisaya orientasi">
    Wisaya menawarkan Claude ketika mendeteksi status Claude lokal.

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

    Tambahkan `--from <path>` untuk mengimpor direktori utama Claude Code atau akar proyek tertentu.

  </Tab>
</Tabs>

## Yang diimpor

<AccordionGroup>
  <Accordion title="Instruksi dan memori">
    - Konten `CLAUDE.md` dan `.claude/CLAUDE.md` proyek disalin atau ditambahkan ke `AGENTS.md` di ruang kerja agen OpenClaw.
    - Konten `~/.claude/CLAUDE.md` pengguna ditambahkan ke `USER.md` di ruang kerja.

  </Accordion>
  <Accordion title="Server MCP">
    Definisi server MCP diimpor dari `.mcp.json` proyek, `~/.claude.json` Claude Code, dan `claude_desktop_config.json` Claude Desktop jika tersedia.
  </Accordion>
  <Accordion title="Skills dan perintah">
    - Skills Claude yang memiliki berkas `SKILL.md` disalin ke direktori Skills di ruang kerja OpenClaw.
    - Berkas Markdown perintah Claude di bawah `.claude/commands/` atau `~/.claude/commands/` dikonversi menjadi Skills OpenClaw dengan `disable-model-invocation: true`.

  </Accordion>
</AccordionGroup>

## Yang hanya disimpan sebagai arsip

Penyedia menyalin item berikut ke laporan migrasi untuk ditinjau secara manual, tetapi **tidak** memuatnya ke konfigurasi aktif OpenClaw:

- Hook Claude
- Izin Claude dan daftar luas alat yang diizinkan
- Nilai bawaan lingkungan Claude
- `CLAUDE.local.md`
- `.claude/rules/`
- Subagen Claude di bawah `.claude/agents/` atau `~/.claude/agents/`
- Direktori cache, rencana, dan riwayat proyek Claude Code
- Ekstensi Claude Desktop dan kredensial yang disimpan oleh sistem operasi

OpenClaw menolak mengeksekusi hook, memercayai daftar izin, atau secara otomatis mendekode status kredensial OAuth dan Desktop yang tidak transparan. Pindahkan secara manual hal-hal yang Anda perlukan setelah meninjau arsip.

## Pemilihan sumber

Tanpa `--from`, OpenClaw memeriksa direktori utama Claude Code bawaan di `~/.claude`, berkas status sampel Claude Code `~/.claude.json`, dan konfigurasi MCP Claude Desktop di macOS.

Ketika `--from` mengarah ke akar proyek, OpenClaw hanya mengimpor berkas Claude milik proyek tersebut, seperti `CLAUDE.md`, `.claude/settings.json`, `.claude/commands/`, `.claude/skills/`, dan `.mcp.json`. OpenClaw tidak membaca direktori utama Claude global Anda selama impor dari akar proyek.

## Alur yang direkomendasikan

<Steps>
  <Step title="Pratinjau rencana">
    ```bash
    openclaw migrate claude --dry-run
    ```

    Rencana mencantumkan semua hal yang akan berubah, termasuk konflik, item yang dilewati, dan nilai sensitif yang disamarkan dari bidang MCP `env` atau `headers` bertingkat.

  </Step>
  <Step title="Terapkan dengan cadangan">
    ```bash
    openclaw migrate apply claude --yes
    ```

    OpenClaw membuat dan memverifikasi cadangan sebelum menerapkan perubahan.

  </Step>
  <Step title="Jalankan doctor">
    ```bash
    openclaw doctor
    ```

    [Doctor](/id/gateway/doctor) memeriksa masalah konfigurasi atau status setelah impor.

  </Step>
  <Step title="Mulai ulang dan verifikasi">
    ```bash
    openclaw gateway restart
    openclaw status
    ```

    Pastikan Gateway berfungsi dengan baik dan instruksi, server MCP, serta Skills yang diimpor telah dimuat.

  </Step>
</Steps>

## Penanganan konflik

Penerapan menolak melanjutkan ketika rencana melaporkan konflik (berkas atau nilai konfigurasi sudah ada di target).

<Warning>
Jalankan kembali dengan `--overwrite` hanya jika Anda memang bermaksud mengganti target yang sudah ada. Penyedia mungkin tetap menulis cadangan tingkat item untuk berkas yang ditimpa ke direktori laporan migrasi.
</Warning>

Pada instalasi OpenClaw baru, konflik jarang terjadi. Konflik biasanya muncul ketika Anda menjalankan ulang impor pada penyiapan yang sudah memiliki perubahan pengguna.

## Keluaran JSON untuk otomatisasi

```bash
openclaw migrate claude --dry-run --json
openclaw migrate apply claude --json --yes
```

`--yes` wajib digunakan untuk `migrate apply` di luar terminal interaktif; tanpanya, OpenClaw menghasilkan kesalahan alih-alih menerapkan perubahan, sehingga skrip dan CI harus meneruskan `--yes` secara eksplisit. Tampilkan pratinjau terlebih dahulu dengan `--dry-run --json`, lalu terapkan dengan `--json --yes` setelah rencana terlihat benar.

## Pemecahan masalah

<AccordionGroup>
  <Accordion title="Status Claude berada di luar ~/.claude">
    Teruskan `--from /actual/path` (CLI) atau `--import-source /actual/path` (orientasi).
  </Accordion>
  <Accordion title="Orientasi menolak mengimpor pada penyiapan yang sudah ada">
    Impor orientasi memerlukan penyiapan baru. Atur ulang status dan jalankan kembali orientasi, atau gunakan `openclaw migrate apply claude` secara langsung, yang mendukung `--overwrite` dan kontrol cadangan eksplisit.
  </Accordion>
  <Accordion title="Server MCP dari Claude Desktop tidak diimpor">
    Claude Desktop membaca `claude_desktop_config.json` dari jalur khusus platform. Arahkan `--from` ke direktori berkas tersebut jika OpenClaw tidak mendeteksinya secara otomatis.
  </Accordion>
  <Accordion title="Perintah Claude menjadi Skills dengan pemanggilan model dinonaktifkan">
    Ini memang disengaja. Perintah Claude dipicu oleh pengguna, sehingga OpenClaw mengimpornya sebagai Skills dengan `disable-model-invocation: true`. Edit frontmatter setiap Skill jika Anda ingin agen memanggilnya secara otomatis.
  </Accordion>
</AccordionGroup>

## Terkait

- [`openclaw migrate`](/id/cli/migrate): referensi CLI lengkap, kontrak Plugin, dan struktur JSON.
- [Panduan migrasi](/id/install/migrating): semua jalur migrasi.
- [Bermigrasi dari Hermes](/id/install/migrating-hermes): jalur impor lintas sistem lainnya.
- [Orientasi](/id/cli/onboard): alur wisaya dan flag noninteraktif.
- [Doctor](/id/gateway/doctor): pemeriksaan kesehatan setelah migrasi.
- [Ruang kerja agen](/id/concepts/agent-workspace): tempat `AGENTS.md`, `USER.md`, dan Skills berada.
