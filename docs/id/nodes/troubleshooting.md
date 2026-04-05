---
read_when:
    - Node terhubung tetapi tool camera/canvas/screen/exec gagal
    - Anda memerlukan model mental pairing node versus approvals
summary: Memecahkan masalah pairing node, persyaratan foreground, izin, dan kegagalan tool
title: Pemecahan Masalah Node
x-i18n:
    generated_at: "2026-04-05T13:59:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: c2e431e6a35c482a655e01460bef9fab5d5a5ae7dc46f8f992ee51100f5c937e
    source_path: nodes/troubleshooting.md
    workflow: 15
---

# Pemecahan masalah node

Gunakan halaman ini saat node terlihat di status tetapi tool node gagal.

## Urutan perintah

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Lalu jalankan pemeriksaan khusus node:

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
```

Sinyal sehat:

- Node terhubung dan sudah dipasangkan untuk peran `node`.
- `nodes describe` mencakup kapabilitas yang Anda panggil.
- Exec approvals menunjukkan mode/allowlist yang diharapkan.

## Persyaratan foreground

`canvas.*`, `camera.*`, dan `screen.*` hanya dapat digunakan di foreground pada node iOS/Android.

Pemeriksaan dan perbaikan cepat:

```bash
openclaw nodes describe --node <idOrNameOrIp>
openclaw nodes canvas snapshot --node <idOrNameOrIp>
openclaw logs --follow
```

Jika Anda melihat `NODE_BACKGROUND_UNAVAILABLE`, bawa app node ke foreground lalu coba lagi.

## Matriks izin

| Kapabilitas                 | iOS                                     | Android                                      | app node macOS                 | Kode kegagalan yang umum       |
| --------------------------- | --------------------------------------- | -------------------------------------------- | ------------------------------ | ------------------------------ |
| `camera.snap`, `camera.clip` | Camera (+ mic untuk audio clip)         | Camera (+ mic untuk audio clip)              | Camera (+ mic untuk audio clip) | `*_PERMISSION_REQUIRED`        |
| `screen.record`             | Screen Recording (+ mic opsional)       | Prompt screen capture (+ mic opsional)       | Screen Recording               | `*_PERMISSION_REQUIRED`        |
| `location.get`              | While Using atau Always (tergantung mode) | Lokasi Foreground/Background berdasarkan mode | Izin Location                  | `LOCATION_PERMISSION_REQUIRED` |
| `system.run`                | n/a (jalur host node)                   | n/a (jalur host node)                        | Exec approvals diperlukan      | `SYSTEM_RUN_DENIED`            |

## Pairing versus approvals

Ini adalah gerbang yang berbeda:

1. **Device pairing**: apakah node ini dapat terhubung ke gateway?
2. **Kebijakan perintah node Gateway**: apakah ID perintah RPC diizinkan oleh `gateway.nodes.allowCommands` / `denyCommands` dan default platform?
3. **Exec approvals**: apakah node ini dapat menjalankan perintah shell tertentu secara lokal?

Pemeriksaan cepat:

```bash
openclaw devices list
openclaw nodes status
openclaw approvals get --node <idOrNameOrIp>
openclaw approvals allowlist add --node <idOrNameOrIp> "/usr/bin/uname"
```

Jika pairing belum ada, setujui device node terlebih dahulu.
Jika `nodes describe` tidak memiliki suatu perintah, periksa kebijakan perintah node gateway dan apakah node benar-benar mendeklarasikan perintah tersebut saat terhubung.
Jika pairing baik-baik saja tetapi `system.run` gagal, perbaiki exec approvals/allowlist pada node tersebut.

Pairing node adalah gerbang identitas/kepercayaan, bukan permukaan persetujuan per perintah. Untuk `system.run`, kebijakan per node berada di file exec approvals milik node tersebut (`openclaw approvals get --node ...`), bukan di catatan pairing gateway.

Untuk eksekusi `host=node` yang didukung persetujuan, gateway juga mengikat eksekusi ke
`systemRunPlan` kanonis yang telah disiapkan. Jika pemanggil berikutnya mengubah perintah/cwd atau
metadata sesi sebelum eksekusi yang telah disetujui diteruskan, gateway menolak
eksekusi tersebut sebagai ketidakcocokan persetujuan alih-alih mempercayai payload yang telah diedit.

## Kode error node yang umum

- `NODE_BACKGROUND_UNAVAILABLE` → app berada di background; bawa ke foreground.
- `CAMERA_DISABLED` → toggle kamera dinonaktifkan di pengaturan node.
- `*_PERMISSION_REQUIRED` → izin OS hilang/ditolak.
- `LOCATION_DISABLED` → mode lokasi mati.
- `LOCATION_PERMISSION_REQUIRED` → mode lokasi yang diminta belum diberikan.
- `LOCATION_BACKGROUND_UNAVAILABLE` → app berada di background tetapi hanya memiliki izin While Using.
- `SYSTEM_RUN_DENIED: approval required` → permintaan exec memerlukan persetujuan eksplisit.
- `SYSTEM_RUN_DENIED: allowlist miss` → perintah diblokir oleh mode allowlist.
  Pada host node Windows, bentuk shell-wrapper seperti `cmd.exe /c ...` diperlakukan sebagai kegagalan allowlist dalam
  mode allowlist kecuali disetujui melalui alur ask.

## Siklus pemulihan cepat

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
```

Jika masih buntu:

- Setujui ulang device pairing.
- Buka kembali app node (foreground).
- Berikan ulang izin OS.
- Buat ulang/sesuaikan kebijakan exec approval.

Terkait:

- [/nodes/index](/nodes/index)
- [/nodes/camera](/nodes/camera)
- [/nodes/location-command](/nodes/location-command)
- [/tools/exec-approvals](/tools/exec-approvals)
- [/gateway/pairing](/id/gateway/pairing)
