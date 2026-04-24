---
read_when:
    - Node terhubung tetapi tool camera/canvas/screen/exec gagal
    - Anda memerlukan model mental pairing node versus approvals
summary: Memecahkan masalah pairing node, persyaratan foreground, izin, dan kegagalan tool
title: Pemecahan masalah node
x-i18n:
    generated_at: "2026-04-24T09:15:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 59c7367d02945e972094b47832164d95573a2aab1122e8ccf6feb80bcfcd95be
    source_path: nodes/troubleshooting.md
    workflow: 15
---

Gunakan halaman ini ketika sebuah node terlihat di status tetapi tool node gagal.

## Tangga perintah

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

- Node terhubung dan dipair untuk role `node`.
- `nodes describe` mencakup kapabilitas yang Anda panggil.
- Persetujuan exec menunjukkan mode/allowlist yang diharapkan.

## Persyaratan foreground

`canvas.*`, `camera.*`, dan `screen.*` hanya foreground pada node iOS/Android.

Pemeriksaan cepat dan perbaikan:

```bash
openclaw nodes describe --node <idOrNameOrIp>
openclaw nodes canvas snapshot --node <idOrNameOrIp>
openclaw logs --follow
```

Jika Anda melihat `NODE_BACKGROUND_UNAVAILABLE`, bawa aplikasi node ke foreground lalu coba lagi.

## Matriks izin

| Kapabilitas                  | iOS                                     | Android                                      | aplikasi node macOS         | Kode kegagalan umum           |
| ---------------------------- | --------------------------------------- | -------------------------------------------- | --------------------------- | ----------------------------- |
| `camera.snap`, `camera.clip` | Kamera (+ mikrofon untuk audio clip)    | Kamera (+ mikrofon untuk audio clip)         | Kamera (+ mikrofon untuk audio clip) | `*_PERMISSION_REQUIRED` |
| `screen.record`              | Screen Recording (+ mikrofon opsional)  | Prompt screen capture (+ mikrofon opsional)  | Screen Recording            | `*_PERMISSION_REQUIRED`       |
| `location.get`               | While Using atau Always (tergantung mode) | Foreground/Background location berdasarkan mode | Izin lokasi               | `LOCATION_PERMISSION_REQUIRED` |
| `system.run`                 | n/a (jalur host node)                   | n/a (jalur host node)                        | Memerlukan persetujuan exec | `SYSTEM_RUN_DENIED`           |

## Pairing versus approvals

Ini adalah gerbang yang berbeda:

1. **Pairing perangkat**: apakah node ini dapat terhubung ke gateway?
2. **Kebijakan perintah node gateway**: apakah ID perintah RPC diizinkan oleh `gateway.nodes.allowCommands` / `denyCommands` dan default platform?
3. **Persetujuan exec**: apakah node ini dapat menjalankan perintah shell tertentu secara lokal?

Pemeriksaan cepat:

```bash
openclaw devices list
openclaw nodes status
openclaw approvals get --node <idOrNameOrIp>
openclaw approvals allowlist add --node <idOrNameOrIp> "/usr/bin/uname"
```

Jika pairing belum ada, setujui perangkat node terlebih dahulu.
Jika `nodes describe` tidak memiliki suatu perintah, periksa kebijakan perintah node gateway dan apakah node benar-benar mendeklarasikan perintah tersebut saat connect.
Jika pairing baik tetapi `system.run` gagal, perbaiki persetujuan exec/allowlist pada node tersebut.

Pairing node adalah gerbang identitas/kepercayaan, bukan permukaan persetujuan per perintah. Untuk `system.run`, kebijakan per-node berada di file persetujuan exec milik node tersebut (`openclaw approvals get --node ...`), bukan di catatan pairing gateway.

Untuk run `host=node` yang didukung persetujuan, gateway juga mengikat eksekusi ke
`systemRunPlan` kanonis yang telah disiapkan. Jika pemanggil berikutnya mengubah command/cwd atau
metadata sesi sebelum run yang disetujui diteruskan, gateway menolak
run tersebut sebagai approval mismatch alih-alih mempercayai payload yang telah diedit.

## Kode error node umum

- `NODE_BACKGROUND_UNAVAILABLE` → aplikasi berada di latar belakang; bawa ke foreground.
- `CAMERA_DISABLED` → toggle kamera dinonaktifkan di pengaturan node.
- `*_PERMISSION_REQUIRED` → izin OS hilang/ditolak.
- `LOCATION_DISABLED` → mode lokasi nonaktif.
- `LOCATION_PERMISSION_REQUIRED` → mode lokasi yang diminta tidak diberikan.
- `LOCATION_BACKGROUND_UNAVAILABLE` → aplikasi berada di latar belakang tetapi hanya memiliki izin While Using.
- `SYSTEM_RUN_DENIED: approval required` → permintaan exec memerlukan persetujuan eksplisit.
- `SYSTEM_RUN_DENIED: allowlist miss` → perintah diblokir oleh mode allowlist.
  Pada host node Windows, bentuk shell-wrapper seperti `cmd.exe /c ...` diperlakukan sebagai allowlist miss dalam
  mode allowlist kecuali disetujui melalui alur ask.

## Loop pemulihan cepat

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
```

Jika masih buntu:

- Setujui ulang pairing perangkat.
- Buka ulang aplikasi node (foreground).
- Beri ulang izin OS.
- Buat ulang/sesuaikan kebijakan persetujuan exec.

Terkait:

- [/nodes/index](/id/nodes/index)
- [/nodes/camera](/id/nodes/camera)
- [/nodes/location-command](/id/nodes/location-command)
- [/tools/exec-approvals](/id/tools/exec-approvals)
- [/gateway/pairing](/id/gateway/pairing)

## Terkait

- [Ikhtisar Nodes](/id/nodes)
- [Pemecahan masalah Gateway](/id/gateway/troubleshooting)
- [Pemecahan masalah kanal](/id/channels/troubleshooting)
