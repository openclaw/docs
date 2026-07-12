---
read_when:
    - Memilih auto, ask, allowlist, full, atau deny untuk izin perintah
    - Mengonfigurasi persetujuan yang ditinjau Codex Guardian melalui tools.exec.mode
    - Membandingkan persetujuan eksekusi OpenClaw dengan izin harness ACPX
summary: Mode izin untuk eksekusi host, persetujuan Codex Guardian, dan sesi harness ACPX
title: Mode izin
x-i18n:
    generated_at: "2026-07-12T14:42:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f580e66508c1f69e868ed26a62d88a675f86a4d1ca738650dc5af82e967f3ac3
    source_path: tools/permission-modes.md
    workflow: 16
---

Mode izin menentukan seberapa besar kewenangan yang dimiliki agen sebelum menjalankan perintah host, menulis file, atau meminta akses tambahan kepada harness backend.

<Note>
  Mode izin terpisah dari `tools.exec.host=auto`. `tools.exec.host`
  menentukan tempat perintah dijalankan. `tools.exec.mode` menentukan cara eksekusi host
  disetujui.
</Note>

## Default yang disarankan

Gunakan `auto` untuk agen pengodean yang memerlukan akses host yang memadai tanpa mengubah setiap ketidakcocokan menjadi permintaan kepada manusia:

```bash
openclaw config set tools.exec.mode auto
openclaw approvals get
openclaw gateway restart
```

Kemudian verifikasi kebijakan yang berlaku:

```bash
openclaw exec-policy show
```

## Mode eksekusi host OpenClaw

`tools.exec.mode` adalah antarmuka kebijakan yang dinormalisasi untuk `exec` host. Setiap mode ditetapkan menjadi pasangan `security` (keketatan daftar izin) dan `ask` (meminta saat tidak cocok) yang mendasarinya:

| Mode        | security / ask          | Perilaku                                                                                                      | Gunakan ketika                                                   |
| ----------- | ----------------------- | ------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| `deny`      | `deny` / `off`          | Blokir eksekusi host sepenuhnya.                                                                              | Tidak ada perintah host yang diizinkan.                           |
| `allowlist` | `allowlist` / `off`     | Jalankan hanya perintah dalam daftar izin; tolak ketidakcocokan tanpa pemberitahuan.                          | Anda memiliki kumpulan perintah yang diketahui aman.             |
| `ask`       | `allowlist` / `on-miss` | Jalankan perintah yang cocok dengan daftar izin; tanyakan kepada manusia jika tidak cocok.                    | Manusia harus meninjau setiap perintah baru.                      |
| `auto`      | `allowlist` / `on-miss` | Jalankan perintah yang cocok dengan daftar izin; kirim ketidakcocokan ke tinjauan otomatis sebelum meminta persetujuan manusia. | Sesi pengodean memerlukan akses praktis yang tetap terlindungi.   |
| `full`      | `full` / `off`          | Jalankan eksekusi host tanpa permintaan persetujuan.                                                          | Host/sesi tepercaya ini tidak perlu melewati gerbang persetujuan. |

`ask` dan `auto` menggunakan pengaturan daftar izin/permintaan yang sama; `auto` juga mengaktifkan peninjau otomatis bawaan, yang memutuskan sendiri ketidakcocokan dan hanya meneruskannya ke jalur persetujuan manusia yang dikonfigurasi jika tidak dapat memberikan persetujuan dengan aman.

Untuk kebijakan eksekusi host lengkap, file persetujuan lokal, skema daftar izin, binari aman, dan perilaku penerusan, lihat [Persetujuan eksekusi](/id/tools/exec-approvals).

## Pemetaan Codex Guardian

Untuk sesi app-server Codex bawaan, `tools.exec.mode: "auto"` mengarahkan Codex ke persetujuan yang ditinjau Guardian jika persyaratan Codex lokal memungkinkannya. Nilai yang biasanya dihasilkan:

| Bidang Codex        | Nilai umum        |
| ------------------- | ----------------- |
| `approvalPolicy`    | `on-request`      |
| `approvalsReviewer` | `auto_review`     |
| `sandbox`           | `workspace-write` |

Mode `auto` memaksakan kebijakan ini di atas semua penggantian sandbox/persetujuan Codex yang dikonfigurasi, sehingga tidak mempertahankan kombinasi lama yang tidak aman seperti `approvalPolicy: "never"` dengan `sandbox: "danger-full-access"`. `tools.exec.mode: "deny"` dan `"allowlist"` sepenuhnya memblokir eksekusi lokal app-server Codex. Gunakan `tools.exec.mode: "full"` hanya jika Anda memang menginginkan postur tanpa persetujuan.

Untuk penyiapan app-server, urutan autentikasi, dan detail runtime Codex bawaan, lihat [Harness Codex](/id/plugins/codex-harness).

## Izin harness ACPX

Sesi ACPX bersifat noninteraktif, sehingga tidak dapat mengeklik permintaan izin TTY. ACPX menggunakan pengaturan tingkat harness yang terpisah di bawah `plugins.entries.acpx.config`:

| Pengaturan                  | Nilai           | Arti                                                   |
| --------------------------- | --------------- | ------------------------------------------------------ |
| `permissionMode`            | `approve-reads` | Setujui pembacaan saja secara otomatis.                 |
| `permissionMode`            | `approve-all`   | Setujui penulisan dan perintah shell secara otomatis.  |
| `permissionMode`            | `deny-all`      | Tolak semua permintaan izin.                            |
| `nonInteractivePermissions` | `fail`          | Batalkan ketika permintaan persetujuan diperlukan.      |
| `nonInteractivePermissions` | `deny`          | Tolak permintaan dan lanjutkan jika memungkinkan.       |

Atur izin ACPX secara terpisah dari persetujuan eksekusi OpenClaw:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
openclaw gateway restart
```

Gunakan `approve-all` sebagai padanan prosedur darurat ACPX untuk sesi harness tanpa permintaan persetujuan. Untuk detail penyiapan dan mode kegagalan, lihat [Penyiapan agen ACP](/id/tools/acp-agents-setup#permission-configuration).

## Memilih mode

| Tujuan                                                   | Konfigurasi                                                        |
| -------------------------------------------------------- | ------------------------------------------------------------------ |
| Memblokir perintah host sepenuhnya                       | `tools.exec.mode: "deny"`                                          |
| Hanya mengizinkan perintah yang diketahui aman          | `tools.exec.mode: "allowlist"`                                     |
| Meminta persetujuan manusia untuk setiap bentuk perintah baru | `tools.exec.mode: "ask"`                                      |
| Menggunakan tinjauan otomatis Codex/OpenClaw sebelum manusia | `tools.exec.mode: "auto"`                                      |
| Melewati persetujuan eksekusi host sepenuhnya            | `tools.exec.mode: "full"` ditambah file persetujuan host yang sesuai |
| Mengizinkan sesi ACPX noninteraktif menulis/mengeksekusi | `plugins.entries.acpx.config.permissionMode: "approve-all"`        |

Jika suatu perintah masih meminta persetujuan atau gagal setelah mode diubah, periksa kedua lapisan:

```bash
openclaw approvals get
openclaw exec-policy show
```

Eksekusi host menggunakan hasil yang lebih ketat antara konfigurasi OpenClaw dan file persetujuan lokal host. Izin harness ACPX tidak melonggarkan persetujuan eksekusi host, dan persetujuan eksekusi host tidak melonggarkan permintaan izin harness ACPX.

## Terkait

- [Persetujuan eksekusi](/id/tools/exec-approvals)
- [Persetujuan eksekusi - lanjutan](/id/tools/exec-approvals-advanced)
- [Harness Codex](/id/plugins/codex-harness)
- [Penyiapan agen ACP](/id/tools/acp-agents-setup#permission-configuration)
