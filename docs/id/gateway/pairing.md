---
read_when:
    - Mengimplementasikan persetujuan pairing Node tanpa UI macOS
    - Menambahkan alur CLI untuk menyetujui Node remote
    - Memperluas protokol gateway dengan manajemen Node
summary: Pairing Node yang dimiliki Gateway (Opsi B) untuk iOS dan Node remote lainnya
title: Pairing yang dimiliki Gateway
x-i18n:
    generated_at: "2026-04-24T09:09:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 42e1e927db9dd28c8a37881c5b014809e6286ffc00efe6f1a86dd2d55d360c09
    source_path: gateway/pairing.md
    workflow: 15
---

# Pairing yang dimiliki Gateway (Opsi B)

Dalam pairing yang dimiliki Gateway, **Gateway** adalah sumber kebenaran untuk menentukan Node mana
yang diizinkan bergabung. UI (aplikasi macOS, klien masa depan) hanyalah frontend yang
menyetujui atau menolak permintaan tertunda.

**Penting:** Node WS menggunakan **device pairing** (role `node`) saat `connect`.
`node.pair.*` adalah store pairing terpisah dan **tidak** mengendalikan handshake WS.
Hanya klien yang secara eksplisit memanggil `node.pair.*` yang menggunakan alur ini.

## Konsep

- **Pending request**: sebuah Node meminta untuk bergabung; memerlukan persetujuan.
- **Paired node**: Node yang disetujui dengan token auth yang diterbitkan.
- **Transport**: endpoint WS Gateway meneruskan permintaan tetapi tidak memutuskan
  keanggotaan. (Dukungan bridge TCP legacy telah dihapus.)

## Cara kerja pairing

1. Sebuah Node terhubung ke WS Gateway dan meminta pairing.
2. Gateway menyimpan **pending request** dan mengemisikan `node.pair.requested`.
3. Anda menyetujui atau menolak permintaan tersebut (CLI atau UI).
4. Saat disetujui, Gateway menerbitkan **token baru** (token dirotasi saat re-pair).
5. Node terhubung ulang menggunakan token dan kini “paired”.

Pending request kedaluwarsa secara otomatis setelah **5 menit**.

## Alur kerja CLI (ramah headless)

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes status
openclaw nodes rename --node <id|name|ip> --name "Living Room iPad"
```

`nodes status` menampilkan Node yang dipasangkan/terhubung dan kemampuannya.

## Permukaan API (protokol gateway)

Event:

- `node.pair.requested` — diemisikan saat pending request baru dibuat.
- `node.pair.resolved` — diemisikan saat sebuah permintaan disetujui/ditolak/kedaluwarsa.

Metode:

- `node.pair.request` — buat atau gunakan ulang pending request.
- `node.pair.list` — daftar pending + paired Node (`operator.pairing`).
- `node.pair.approve` — setujui pending request (menerbitkan token).
- `node.pair.reject` — tolak pending request.
- `node.pair.verify` — verifikasi `{ nodeId, token }`.

Catatan:

- `node.pair.request` bersifat idempoten per Node: panggilan berulang mengembalikan
  pending request yang sama.
- Permintaan berulang untuk pending Node yang sama juga menyegarkan metadata Node yang tersimpan
  dan snapshot perintah yang dideklarasikan terbaru yang ada di allowlist untuk visibilitas operator.
- Persetujuan **selalu** menghasilkan token baru; token tidak pernah dikembalikan dari
  `node.pair.request`.
- Permintaan dapat menyertakan `silent: true` sebagai petunjuk untuk alur auto-approval.
- `node.pair.approve` menggunakan perintah yang dideklarasikan pada pending request untuk menegakkan
  scope persetujuan tambahan:
  - permintaan tanpa perintah: `operator.pairing`
  - permintaan perintah non-exec: `operator.pairing` + `operator.write`
  - permintaan `system.run` / `system.run.prepare` / `system.which`:
    `operator.pairing` + `operator.admin`

Penting:

- Pairing Node adalah alur kepercayaan/identitas ditambah penerbitan token.
- Pairing ini **tidak** melakukan pin pada permukaan perintah Node live per Node.
- Perintah Node live berasal dari apa yang dideklarasikan Node saat connect setelah
  kebijakan perintah Node global gateway (`gateway.nodes.allowCommands` /
  `denyCommands`) diterapkan.
- Kebijakan allow/ask `system.run` per Node berada di Node dalam
  `exec.approvals.node.*`, bukan dalam record pairing.

## Pembatasan perintah Node (2026.3.31+)

<Warning>
**Perubahan yang memutus kompatibilitas:** Mulai `2026.3.31`, perintah Node dinonaktifkan sampai pairing Node disetujui. Device pairing saja tidak lagi cukup untuk mengekspos perintah Node yang dideklarasikan.
</Warning>

Saat Node terhubung untuk pertama kali, pairing diminta secara otomatis. Sampai permintaan pairing disetujui, semua perintah Node tertunda dari Node tersebut difilter dan tidak akan dieksekusi. Setelah kepercayaan dibangun melalui persetujuan pairing, perintah yang dideklarasikan Node menjadi tersedia dengan tunduk pada kebijakan perintah normal.

Artinya:

- Node yang sebelumnya mengandalkan device pairing saja untuk mengekspos perintah kini harus menyelesaikan pairing Node.
- Perintah yang diantrikan sebelum persetujuan pairing dibuang, bukan ditunda.

## Batas kepercayaan event Node (2026.3.31+)

<Warning>
**Perubahan yang memutus kompatibilitas:** Run yang berasal dari Node kini tetap berada pada permukaan tepercaya yang diperkecil.
</Warning>

Ringkasan yang berasal dari Node dan event sesi terkait dibatasi pada permukaan tepercaya yang dimaksud. Alur yang dipicu notifikasi atau Node yang sebelumnya mengandalkan akses alat host atau sesi yang lebih luas mungkin perlu disesuaikan. Penguatan ini memastikan bahwa event Node tidak dapat meningkat menjadi akses alat tingkat host melampaui apa yang diizinkan oleh batas kepercayaan Node.

## Persetujuan otomatis (aplikasi macOS)

Aplikasi macOS secara opsional dapat mencoba **silent approval** saat:

- permintaan ditandai `silent`, dan
- aplikasi dapat memverifikasi koneksi SSH ke host gateway menggunakan pengguna yang sama.

Jika silent approval gagal, sistem fallback ke prompt “Approve/Reject” normal.

## Auto-approval peningkatan metadata

Saat perangkat yang sudah dipasangkan terhubung ulang hanya dengan perubahan metadata
yang tidak sensitif (misalnya nama tampilan atau petunjuk platform klien), OpenClaw memperlakukannya
sebagai `metadata-upgrade`. Silent auto-approval bersifat sempit: hanya berlaku untuk reconnect CLI/helper lokal tepercaya yang sudah membuktikan kepemilikan token atau kata sandi bersama melalui loopback. Klien browser/UI Control dan klien remote tetap menggunakan alur persetujuan ulang yang eksplisit. Peningkatan scope (read ke
write/admin) dan perubahan kunci publik **tidak** memenuhi syarat untuk metadata-upgrade
auto-approval — keduanya tetap menjadi permintaan persetujuan ulang yang eksplisit.

## Helper pairing QR

`/pair qr` merender payload pairing sebagai media terstruktur sehingga klien seluler dan
browser dapat langsung memindainya.

Menghapus perangkat juga membersihkan pending pairing request basi untuk
id perangkat tersebut, sehingga `nodes pending` tidak menampilkan baris yatim setelah pencabutan.

## Lokalitas dan header yang diteruskan

Pairing Gateway memperlakukan sebuah koneksi sebagai loopback hanya ketika socket mentah
dan bukti proxy upstream sama-sama setuju. Jika permintaan datang di loopback tetapi
membawa header `X-Forwarded-For` / `X-Forwarded-Host` / `X-Forwarded-Proto`
yang menunjuk ke origin non-lokal, bukti header-terusan tersebut menggugurkan
klaim lokalitas loopback. Jalur pairing kemudian memerlukan persetujuan eksplisit
alih-alih diam-diam memperlakukan permintaan sebagai koneksi host yang sama. Lihat
[Trusted Proxy Auth](/id/gateway/trusted-proxy-auth) untuk aturan yang setara pada
auth operator.

## Penyimpanan (lokal, privat)

State pairing disimpan di bawah direktori state Gateway (default `~/.openclaw`):

- `~/.openclaw/nodes/paired.json`
- `~/.openclaw/nodes/pending.json`

Jika Anda mengoverride `OPENCLAW_STATE_DIR`, folder `nodes/` ikut berpindah.

Catatan keamanan:

- Token adalah secret; perlakukan `paired.json` sebagai sensitif.
- Merotasi token memerlukan persetujuan ulang (atau menghapus entri Node).

## Perilaku transport

- Transport bersifat **stateless**; transport tidak menyimpan keanggotaan.
- Jika Gateway offline atau pairing dinonaktifkan, Node tidak dapat melakukan pairing.
- Jika Gateway dalam mode remote, pairing tetap terjadi terhadap store Gateway remote.

## Terkait

- [Channel pairing](/id/channels/pairing)
- [Nodes](/id/nodes)
- [Devices CLI](/id/cli/devices)
