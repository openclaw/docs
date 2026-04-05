---
read_when:
    - Menerapkan persetujuan pairing node tanpa UI macOS
    - Menambahkan alur CLI untuk menyetujui node jarak jauh
    - Memperluas protokol gateway dengan manajemen node
summary: Pairing node milik Gateway (Opsi B) untuk iOS dan node jarak jauh lainnya
title: Pairing Milik Gateway
x-i18n:
    generated_at: "2026-04-05T13:54:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8f90818c84daeb190f27df7413e23362372806f2c4250e4954295fbf6df70233
    source_path: gateway/pairing.md
    workflow: 15
---

# Pairing milik Gateway (Opsi B)

Dalam pairing milik Gateway, **Gateway** adalah sumber kebenaran untuk node mana
yang diizinkan bergabung. UI (app macOS, klien masa depan) hanyalah frontend yang
menyetujui atau menolak permintaan yang tertunda.

**Penting:** Node WS menggunakan **pairing perangkat** (role `node`) selama `connect`.
`node.pair.*` adalah penyimpanan pairing terpisah dan **tidak** mengontrol handshake WS.
Hanya klien yang secara eksplisit memanggil `node.pair.*` yang menggunakan alur ini.

## Konsep

- **Permintaan tertunda**: sebuah node meminta untuk bergabung; memerlukan persetujuan.
- **Node terpairing**: node yang disetujui dengan token auth yang diterbitkan.
- **Transport**: endpoint WS Gateway meneruskan permintaan tetapi tidak memutuskan
  keanggotaan. (Dukungan bridge TCP lama telah dihapus.)

## Cara kerja pairing

1. Sebuah node terhubung ke WS Gateway dan meminta pairing.
2. Gateway menyimpan **permintaan tertunda** dan menghasilkan `node.pair.requested`.
3. Anda menyetujui atau menolak permintaan tersebut (CLI atau UI).
4. Saat disetujui, Gateway menerbitkan **token baru** (token dirotasi saat re-pair).
5. Node terhubung kembali menggunakan token tersebut dan sekarang berstatus “paired”.

Permintaan tertunda kedaluwarsa secara otomatis setelah **5 menit**.

## Alur kerja CLI (ramah headless)

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes status
openclaw nodes rename --node <id|name|ip> --name "Living Room iPad"
```

`nodes status` menampilkan node yang terpairing/terhubung dan kapabilitasnya.

## Permukaan API (protokol gateway)

Event:

- `node.pair.requested` — dihasilkan saat permintaan tertunda baru dibuat.
- `node.pair.resolved` — dihasilkan saat permintaan disetujui/ditolak/kedaluwarsa.

Metode:

- `node.pair.request` — membuat atau menggunakan kembali permintaan tertunda.
- `node.pair.list` — menampilkan node tertunda + terpairing (`operator.pairing`).
- `node.pair.approve` — menyetujui permintaan tertunda (menerbitkan token).
- `node.pair.reject` — menolak permintaan tertunda.
- `node.pair.verify` — memverifikasi `{ nodeId, token }`.

Catatan:

- `node.pair.request` bersifat idempoten per node: panggilan berulang mengembalikan
  permintaan tertunda yang sama.
- Permintaan berulang untuk node tertunda yang sama juga menyegarkan metadata node yang disimpan
  dan snapshot perintah terdeklarasi allowlist terbaru untuk visibilitas operator.
- Persetujuan **selalu** menghasilkan token baru; tidak ada token yang pernah dikembalikan dari
  `node.pair.request`.
- Permintaan dapat menyertakan `silent: true` sebagai petunjuk untuk alur persetujuan otomatis.
- `node.pair.approve` menggunakan perintah yang dideklarasikan oleh permintaan tertunda untuk menegakkan
  cakupan persetujuan tambahan:
  - permintaan tanpa perintah: `operator.pairing`
  - permintaan perintah non-exec: `operator.pairing` + `operator.write`
  - permintaan `system.run` / `system.run.prepare` / `system.which`:
    `operator.pairing` + `operator.admin`

Penting:

- Pairing node adalah alur kepercayaan/identitas ditambah penerbitan token.
- Ini **tidak** menyematkan permukaan perintah node live per node.
- Perintah node live berasal dari apa yang dideklarasikan node saat connect setelah
  kebijakan perintah node global gateway (`gateway.nodes.allowCommands` /
  `denyCommands`) diterapkan.
- Kebijakan allow/ask `system.run` per node berada pada node di
  `exec.approvals.node.*`, bukan di catatan pairing.

## Pengontrolan perintah node (2026.3.31+)

<Warning>
**Perubahan yang memutus kompatibilitas:** Mulai `2026.3.31`, perintah node dinonaktifkan hingga pairing node disetujui. Pairing perangkat saja tidak lagi cukup untuk mengekspos perintah node yang dideklarasikan.
</Warning>

Saat sebuah node terhubung untuk pertama kali, pairing diminta secara otomatis. Sampai permintaan pairing disetujui, semua perintah node tertunda dari node tersebut difilter dan tidak akan dieksekusi. Setelah kepercayaan dibangun melalui persetujuan pairing, perintah yang dideklarasikan node menjadi tersedia sesuai kebijakan perintah normal.

Ini berarti:

- Node yang sebelumnya mengandalkan pairing perangkat saja untuk mengekspos perintah kini harus menyelesaikan pairing node.
- Perintah yang diantrikan sebelum persetujuan pairing dibatalkan, bukan ditunda.

## Batas kepercayaan event node (2026.3.31+)

<Warning>
**Perubahan yang memutus kompatibilitas:** Eksekusi yang berasal dari node kini tetap berada pada permukaan tepercaya yang diperkecil.
</Warning>

Ringkasan yang berasal dari node dan event sesi terkait dibatasi pada permukaan tepercaya yang dituju. Alur berbasis notifikasi atau dipicu node yang sebelumnya mengandalkan akses tool host atau sesi yang lebih luas mungkin perlu disesuaikan. Hardening ini memastikan bahwa event node tidak dapat meningkat menjadi akses tool tingkat host di luar yang diizinkan oleh batas kepercayaan node.

## Persetujuan otomatis (app macOS)

App macOS dapat secara opsional mencoba **persetujuan senyap** ketika:

- permintaan ditandai `silent`, dan
- app dapat memverifikasi koneksi SSH ke host gateway menggunakan pengguna yang sama.

Jika persetujuan senyap gagal, alur akan kembali ke prompt normal “Approve/Reject”.

## Penyimpanan (lokal, privat)

Status pairing disimpan di bawah direktori state Gateway (default `~/.openclaw`):

- `~/.openclaw/nodes/paired.json`
- `~/.openclaw/nodes/pending.json`

Jika Anda mengganti `OPENCLAW_STATE_DIR`, folder `nodes/` ikut berpindah.

Catatan keamanan:

- Token adalah secret; perlakukan `paired.json` sebagai data sensitif.
- Merotasi token memerlukan persetujuan ulang (atau menghapus entri node).

## Perilaku transport

- Transport bersifat **stateless**; tidak menyimpan keanggotaan.
- Jika Gateway offline atau pairing dinonaktifkan, node tidak dapat melakukan pairing.
- Jika Gateway berada dalam mode remote, pairing tetap terjadi terhadap penyimpanan Gateway remote.
