---
read_when:
    - Menyiapkan awal ruang kerja secara manual
summary: Templat ruang kerja untuk HEARTBEAT.md
title: Templat HEARTBEAT.md
x-i18n:
    generated_at: "2026-07-12T14:37:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1605f546995e0bdcb11f9bf905173b14aca25cfad664fe2c7644d18c2b4142e2
    source_path: reference/templates/HEARTBEAT.md
    workflow: 16
---

# Templat HEARTBEAT.md

`HEARTBEAT.md` berada di ruang kerja agen dan memuat daftar periksa Heartbeat berkala. Biarkan kosong, atau hanya berisi spasi kosong, komentar Markdown, judul ATX, kerangka daftar kosong (`- `, `* [ ]`), atau penanda pagar, agar OpenClaw sepenuhnya melewati pemanggilan model Heartbeat (`reason=empty-heartbeat-file`).

Konten bawaan yang disertakan:

```markdown
<!-- Templat Heartbeat; konten yang hanya berisi komentar mencegah pemanggilan API Heartbeat terjadwal. -->

# Biarkan berkas ini kosong (atau hanya berisi komentar) untuk melewati pemanggilan API Heartbeat.

# Tambahkan tugas di bawah saat Anda ingin agen memeriksa sesuatu secara berkala.
```

Tambahkan tugas singkat di bawah baris komentar hanya saat Anda menginginkan pemeriksaan berkala. Jaga agar tetap ringkas: setiap siklus Heartbeat membaca berkas ini (secara bawaan setiap 30 menit), sehingga instruksi yang terlalu panjang menghabiskan token setiap kali aktif.

Untuk pemeriksaan yang hanya dijalankan saat jatuh tempo, alih-alih daftar periksa biasa, gunakan blok `tasks:` terstruktur dengan bidang `interval` dan `prompt` per tugas; lihat [HEARTBEAT.md](/id/gateway/heartbeat#heartbeatmd-optional) untuk format dan perilakunya.

## Terkait

- [Heartbeat](/id/gateway/heartbeat)
- [Konfigurasi Heartbeat](/id/gateway/config-agents)
