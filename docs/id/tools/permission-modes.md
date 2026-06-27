---
read_when:
    - Memilih auto, ask, allowlist, full, atau deny untuk izin perintah
    - Mengonfigurasi persetujuan yang ditinjau Codex Guardian melalui tools.exec.mode
    - Membandingkan persetujuan eksekusi OpenClaw dengan izin harness ACPX
summary: Mode izin untuk eksekusi host, persetujuan Codex Guardian, dan sesi harness ACPX
title: Mode izin
x-i18n:
    generated_at: "2026-06-27T18:20:13Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6ce89cadb45b3b96ce9ab62b35c06610d02f0ff02f15ef7d2128c59fbebb325a
    source_path: tools/permission-modes.md
    workflow: 16
---

Mode izin menentukan seberapa besar otoritas yang dimiliki agen sebelum dapat menjalankan perintah host, menulis file, atau meminta akses tambahan ke harness backend. Mulai dengan `tools.exec.mode: "auto"` saat Anda ingin OpenClaw menggunakan allowlist terlebih dahulu, lalu auto-review native Codex atau rute persetujuan manusia untuk yang tidak cocok.

<Note>
  Mode izin terpisah dari `tools.exec.host=auto`. `tools.exec.host`
  memilih tempat perintah dijalankan. `tools.exec.mode` memilih bagaimana exec host
  disetujui.
</Note>

## Default yang direkomendasikan

Gunakan `auto` untuk agen pengodean yang memerlukan akses host yang berguna tanpa menjadikan setiap ketidakcocokan sebagai prompt manusia:

```bash
openclaw config set tools.exec.mode auto
openclaw approvals get
openclaw gateway restart
```

Lalu verifikasi kebijakan efektif:

```bash
openclaw exec-policy show
```

Dalam mode `auto`, OpenClaw menjalankan pencocokan allowlist deterministik secara langsung. Ketidakcocokan persetujuan melewati auto reviewer native OpenClaw terlebih dahulu, lalu fallback ke rute persetujuan manusia yang dikonfigurasi saat diperlukan.

## Mode exec host OpenClaw

`tools.exec.mode` adalah permukaan kebijakan ternormalisasi untuk `exec` host.

| Mode        | Perilaku                                               | Gunakan saat                                                     |
| ----------- | ------------------------------------------------------ | ---------------------------------------------------------------- |
| `deny`      | Blokir exec host.                                      | Tidak ada perintah host yang diizinkan.                          |
| `allowlist` | Jalankan hanya perintah yang ada di allowlist.         | Anda memiliki kumpulan perintah yang diketahui aman.             |
| `ask`       | Jalankan pencocokan allowlist dan minta saat tidak cocok. | Manusia harus meninjau perintah baru.                         |
| `auto`      | Jalankan pencocokan allowlist, lalu gunakan auto-review. | Sesi pengodean memerlukan akses praktis yang terlindungi.      |
| `full`      | Jalankan exec host tanpa prompt.                       | Host/sesi tepercaya ini harus melewati gerbang persetujuan.      |

Untuk kebijakan exec host lengkap, file persetujuan lokal, skema allowlist, bin aman, dan perilaku penerusan, lihat [Persetujuan exec](/id/tools/exec-approvals).

## Pemetaan Codex Guardian

Untuk sesi app-server native Codex, `tools.exec.mode: "auto"` dipetakan ke persetujuan yang ditinjau Codex Guardian saat persyaratan Codex lokal mengizinkannya. OpenClaw biasanya mengirim:

| Kolom Codex        | Nilai umum        |
| ------------------ | ----------------- |
| `approvalPolicy`    | `on-request`      |
| `approvalsReviewer` | `auto_review`     |
| `sandbox`           | `workspace-write` |

Dalam mode `auto`, OpenClaw tidak mempertahankan override Codex lama yang tidak aman seperti `approvalPolicy: "never"` atau `sandbox: "danger-full-access"`. Gunakan `tools.exec.mode: "full"` hanya saat Anda sengaja menginginkan postur tanpa persetujuan.

Untuk penyiapan app-server, urutan auth, dan detail runtime native Codex, lihat [Harness Codex](/id/plugins/codex-harness).

## Izin harness ACPX

Sesi ACPX bersifat non-interaktif, jadi sesi tersebut tidak dapat mengeklik prompt izin TTY. ACPX menggunakan pengaturan tingkat harness terpisah di bawah `plugins.entries.acpx.config`:

| Pengaturan                 | Nilai umum      | Makna                                      |
| -------------------------- | --------------- | ------------------------------------------ |
| `permissionMode`            | `approve-reads` | Setujui otomatis hanya pembacaan.          |
| `permissionMode`            | `approve-all`   | Setujui otomatis penulisan dan perintah shell. |
| `permissionMode`            | `deny-all`      | Tolak semua prompt izin.                   |
| `nonInteractivePermissions` | `fail`          | Batalkan saat prompt akan diperlukan.      |
| `nonInteractivePermissions` | `deny`          | Tolak prompt dan lanjutkan jika memungkinkan. |

Atur izin ACPX secara terpisah dari persetujuan exec OpenClaw:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
openclaw gateway restart
```

Gunakan `approve-all` sebagai padanan break-glass ACPX untuk sesi harness tanpa prompt. Untuk detail penyiapan dan mode kegagalan, lihat [Penyiapan agen ACP](/id/tools/acp-agents-setup#permission-configuration).

## Memilih mode

| Tujuan                                        | Konfigurasi                                                |
| --------------------------------------------- | ---------------------------------------------------------- |
| Blokir perintah host sepenuhnya               | `tools.exec.mode: "deny"`                                  |
| Izinkan hanya perintah yang diketahui aman berjalan | `tools.exec.mode: "allowlist"`                       |
| Minta manusia untuk setiap bentuk perintah baru | `tools.exec.mode: "ask"`                                 |
| Gunakan auto-review Codex/OpenClaw sebelum manusia | `tools.exec.mode: "auto"`                              |
| Lewati persetujuan exec host sepenuhnya       | `tools.exec.mode: "full"` ditambah file persetujuan host yang cocok |
| Buat sesi ACPX non-interaktif dapat menulis/exec | `plugins.entries.acpx.config.permissionMode: "approve-all"` |

Jika perintah masih memunculkan prompt atau gagal setelah mengubah mode, periksa kedua lapisan:

```bash
openclaw approvals get
openclaw exec-policy show
```

Exec host menggunakan hasil yang lebih ketat dari konfigurasi OpenClaw dan file persetujuan lokal host. Izin harness ACPX tidak melonggarkan persetujuan exec host, dan persetujuan exec host tidak melonggarkan prompt harness ACPX.

## Terkait

- [Persetujuan exec](/id/tools/exec-approvals)
- [Persetujuan exec - lanjutan](/id/tools/exec-approvals-advanced)
- [Harness Codex](/id/plugins/codex-harness)
- [Penyiapan agen ACP](/id/tools/acp-agents-setup#permission-configuration)
