---
read_when:
    - Mengimplementasikan persetujuan pairing node tanpa UI macOS
    - Menambahkan alur CLI untuk menyetujui node jarak jauh
    - Memperluas protokol gateway dengan manajemen node
summary: Pairing node yang dimiliki Gateway (Opsi B) untuk iOS dan node jarak jauh lainnya
title: Pairing yang dimiliki Gateway
x-i18n:
    generated_at: "2026-04-26T11:29:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 436391f7576b7285733eb4a8283b73d7b4c52f22b227dd915c09313cfec776bd
    source_path: gateway/pairing.md
    workflow: 15
---

Dalam pairing yang dimiliki Gateway, **Gateway** adalah sumber kebenaran untuk menentukan node mana yang diizinkan bergabung. UI (aplikasi macOS, klien masa depan) hanyalah frontend yang menyetujui atau menolak permintaan yang tertunda.

**Penting:** Node WS menggunakan **device pairing** (role `node`) selama `connect`.
`node.pair.*` adalah penyimpanan pairing terpisah dan **tidak** mengatur handshake WS.
Hanya klien yang secara eksplisit memanggil `node.pair.*` yang menggunakan alur ini.

## Konsep

- **Permintaan tertunda**: sebuah node meminta untuk bergabung; memerlukan persetujuan.
- **Node yang dipasangkan**: node yang disetujui dengan token auth yang telah diterbitkan.
- **Transport**: endpoint WS Gateway meneruskan permintaan tetapi tidak memutuskan
  keanggotaan. (Dukungan bridge TCP lama telah dihapus.)

## Cara kerja pairing

1. Sebuah node terhubung ke Gateway WS dan meminta pairing.
2. Gateway menyimpan **permintaan tertunda** dan memancarkan `node.pair.requested`.
3. Anda menyetujui atau menolak permintaan tersebut (CLI atau UI).
4. Saat disetujui, Gateway menerbitkan **token baru** (token dirotasi saat re-pair).
5. Node terhubung kembali menggunakan token dan kini berstatus “paired”.

Permintaan tertunda kedaluwarsa secara otomatis setelah **5 menit**.

## Alur kerja CLI (ramah headless)

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes status
openclaw nodes rename --node <id|name|ip> --name "iPad Ruang Tamu"
```

`nodes status` menampilkan node yang paired/terhubung dan kapabilitasnya.

## Surface API (protokol gateway)

Peristiwa:

- `node.pair.requested` — dipancarkan saat permintaan tertunda baru dibuat.
- `node.pair.resolved` — dipancarkan saat permintaan disetujui/ditolak/kedaluwarsa.

Metode:

- `node.pair.request` — membuat atau menggunakan ulang permintaan tertunda.
- `node.pair.list` — mencantumkan node tertunda + paired (`operator.pairing`).
- `node.pair.approve` — menyetujui permintaan tertunda (menerbitkan token).
- `node.pair.reject` — menolak permintaan tertunda.
- `node.pair.verify` — memverifikasi `{ nodeId, token }`.

Catatan:

- `node.pair.request` bersifat idempoten per node: panggilan berulang mengembalikan
  permintaan tertunda yang sama.
- Permintaan berulang untuk node tertunda yang sama juga me-refresh metadata node
  yang tersimpan dan snapshot perintah yang dideklarasikan dan masuk allowlist terbaru untuk visibilitas operator.
- Persetujuan **selalu** menghasilkan token baru; tidak ada token yang pernah dikembalikan dari
  `node.pair.request`.
- Permintaan dapat menyertakan `silent: true` sebagai petunjuk untuk alur auto-approval.
- `node.pair.approve` menggunakan declared commands dari permintaan tertunda untuk menerapkan
  scope persetujuan tambahan:
  - permintaan tanpa perintah: `operator.pairing`
  - permintaan perintah non-exec: `operator.pairing` + `operator.write`
  - permintaan `system.run` / `system.run.prepare` / `system.which`:
    `operator.pairing` + `operator.admin`

Penting:

- Node pairing adalah alur kepercayaan/identitas plus penerbitan token.
- Ini **tidak** menyematkan surface perintah node live per node.
- Perintah node live berasal dari apa yang dideklarasikan node saat connect setelah
  kebijakan perintah node global gateway (`gateway.nodes.allowCommands` /
  `denyCommands`) diterapkan.
- Kebijakan allow/ask `system.run` per node berada di node itu sendiri dalam
  `exec.approvals.node.*`, bukan di catatan pairing.

## Gating perintah node (2026.3.31+)

<Warning>
**Perubahan yang merusak:** Mulai `2026.3.31`, perintah node dinonaktifkan sampai node pairing disetujui. Device pairing saja tidak lagi cukup untuk mengekspos declared commands node.
</Warning>

Saat sebuah node terhubung untuk pertama kalinya, pairing diminta secara otomatis. Sampai permintaan pairing disetujui, semua perintah node tertunda dari node tersebut difilter dan tidak akan dieksekusi. Setelah kepercayaan dibentuk melalui persetujuan pairing, declared commands node menjadi tersedia sesuai kebijakan perintah normal.

Ini berarti:

- Node yang sebelumnya bergantung hanya pada device pairing untuk mengekspos perintah sekarang harus menyelesaikan node pairing.
- Perintah yang diantrekan sebelum persetujuan pairing dibuang, bukan ditunda.

## Batas kepercayaan peristiwa node (2026.3.31+)

<Warning>
**Perubahan yang merusak:** Run yang berasal dari node sekarang tetap berada pada surface tepercaya yang lebih terbatas.
</Warning>

Ringkasan yang berasal dari node dan peristiwa sesi terkait dibatasi ke surface tepercaya yang dimaksudkan. Alur berbasis notifikasi atau dipicu node yang sebelumnya bergantung pada akses tool host atau sesi yang lebih luas mungkin perlu disesuaikan. Hardening ini memastikan bahwa peristiwa node tidak dapat meningkat menjadi akses tool tingkat host di luar yang diizinkan oleh batas kepercayaan node.

## Auto-approval (aplikasi macOS)

Aplikasi macOS secara opsional dapat mencoba **silent approval** ketika:

- permintaan ditandai `silent`, dan
- aplikasi dapat memverifikasi koneksi SSH ke host gateway menggunakan pengguna yang sama.

Jika silent approval gagal, alur akan fallback ke prompt “Approve/Reject” normal.

## Auto-approval perangkat Trusted-CIDR

WS device pairing untuk `role: node` tetap manual secara default. Untuk jaringan
node privat tempat Gateway sudah mempercayai jalur jaringan, operator dapat
memilih secara eksplisit dengan CIDR atau IP yang tepat:

```json5
{
  gateway: {
    nodes: {
      pairing: {
        autoApproveCidrs: ["192.168.1.0/24"],
      },
    },
  },
}
```

Batas keamanan:

- Dinonaktifkan ketika `gateway.nodes.pairing.autoApproveCidrs` tidak diatur.
- Tidak ada mode auto-approve menyeluruh untuk LAN atau jaringan privat.
- Hanya device pairing `role: node` baru tanpa scope yang diminta yang memenuhi syarat.
- Klien operator, browser, Control UI, dan WebChat tetap manual.
- Upgrade role, scope, metadata, dan public key tetap manual.
- Jalur header trusted-proxy loopback pada host yang sama tidak memenuhi syarat karena
  jalur itu dapat dipalsukan oleh pemanggil lokal.

## Auto-approval upgrade metadata

Ketika perangkat yang sudah paired terhubung kembali hanya dengan perubahan metadata
yang tidak sensitif (misalnya nama tampilan atau petunjuk platform klien), OpenClaw memperlakukannya
sebagai `metadata-upgrade`. Silent auto-approval bersifat sempit: ini hanya berlaku
untuk reconnect lokal non-browser tepercaya yang sudah membuktikan kepemilikan
kredensial lokal atau bersama, termasuk reconnect aplikasi native pada host yang sama setelah
perubahan metadata versi OS. Klien browser/Control UI dan klien jarak jauh tetap
menggunakan alur persetujuan ulang eksplisit. Upgrade scope (read ke write/admin) dan
perubahan public key **tidak** memenuhi syarat untuk auto-approval metadata-upgrade —
tetap menjadi permintaan persetujuan ulang eksplisit.

## Helper QR pairing

`/pair qr` merender payload pairing sebagai media terstruktur sehingga klien mobile dan
browser dapat langsung memindainya.

Menghapus perangkat juga membersihkan permintaan pairing tertunda yang stale untuk
id perangkat tersebut, sehingga `nodes pending` tidak menampilkan baris yatim setelah revoke.

## Lokalitas dan header yang diteruskan

Gateway pairing memperlakukan koneksi sebagai loopback hanya ketika soket mentah
dan bukti proxy upstream sama-sama sepakat. Jika permintaan tiba melalui loopback tetapi
membawa header `X-Forwarded-For` / `X-Forwarded-Host` / `X-Forwarded-Proto` yang
menunjuk ke asal non-lokal, bukti header yang diteruskan itu menggugurkan klaim
lokalitas loopback. Jalur pairing kemudian memerlukan persetujuan eksplisit alih-alih
secara diam-diam memperlakukan permintaan sebagai koneksi pada host yang sama. Lihat
[Auth Trusted Proxy](/id/gateway/trusted-proxy-auth) untuk aturan yang setara pada
auth operator.

## Penyimpanan (lokal, privat)

Status pairing disimpan di bawah direktori status Gateway (default `~/.openclaw`):

- `~/.openclaw/nodes/paired.json`
- `~/.openclaw/nodes/pending.json`

Jika Anda mengoverride `OPENCLAW_STATE_DIR`, folder `nodes/` ikut berpindah.

Catatan keamanan:

- Token adalah secret; perlakukan `paired.json` sebagai sensitif.
- Merotasi token memerlukan persetujuan ulang (atau menghapus entri node).

## Perilaku transport

- Transport bersifat **stateless**; transport tidak menyimpan keanggotaan.
- Jika Gateway offline atau pairing dinonaktifkan, node tidak dapat melakukan pairing.
- Jika Gateway dalam mode remote, pairing tetap terjadi terhadap penyimpanan milik Gateway remote.

## Terkait

- [Pairing channel](/id/channels/pairing)
- [Nodes](/id/nodes)
- [CLI Devices](/id/cli/devices)
