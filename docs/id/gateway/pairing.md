---
read_when:
    - Mengimplementasikan persetujuan penyandingan Node tanpa antarmuka pengguna macOS
    - Menambahkan alur CLI untuk menyetujui node jarak jauh
    - Memperluas protokol Gateway dengan manajemen Node
summary: Penyandingan node milik Gateway (Opsi B) untuk iOS dan node jarak jauh lainnya
title: Penyandingan milik Gateway
x-i18n:
    generated_at: "2026-04-30T09:51:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5c662b8f5c1bb44cfc306d42ae19ba1c8bc36e0d96130d730b322ee07e02cad8
    source_path: gateway/pairing.md
    workflow: 16
---

Dalam pairing yang dimiliki Gateway, **Gateway** adalah sumber kebenaran untuk node mana yang
diizinkan bergabung. UI (aplikasi macOS, klien masa depan) hanyalah frontend yang
menyetujui atau menolak permintaan tertunda.

**Penting:** Node WS menggunakan **pairing perangkat** (role `node`) selama `connect`.
`node.pair.*` adalah penyimpanan pairing terpisah dan **tidak** mengendalikan handshake WS.
Hanya klien yang secara eksplisit memanggil `node.pair.*` yang menggunakan alur ini.

## Konsep

- **Permintaan tertunda**: node meminta untuk bergabung; memerlukan persetujuan.
- **Node yang dipasangkan**: node yang disetujui dengan token auth yang diterbitkan.
- **Transport**: endpoint WS Gateway meneruskan permintaan tetapi tidak memutuskan
  keanggotaan. (Dukungan bridge TCP lama telah dihapus.)

## Cara kerja pairing

1. Node terhubung ke WS Gateway dan meminta pairing.
2. Gateway menyimpan **permintaan tertunda** dan memancarkan `node.pair.requested`.
3. Anda menyetujui atau menolak permintaan (CLI atau UI).
4. Saat disetujui, Gateway menerbitkan **token baru** (token dirotasi saat re-pair).
5. Node terhubung kembali menggunakan token dan kini “dipasangkan”.

Permintaan tertunda kedaluwarsa secara otomatis setelah **5 menit**.

## Alur kerja CLI (ramah headless)

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes status
openclaw nodes remove --node <id|name|ip>
openclaw nodes rename --node <id|name|ip> --name "Living Room iPad"
```

`nodes status` menampilkan node yang dipasangkan/terhubung dan kapabilitasnya.

## Permukaan API (protokol Gateway)

Peristiwa:

- `node.pair.requested` — dipancarkan saat permintaan tertunda baru dibuat.
- `node.pair.resolved` — dipancarkan saat permintaan disetujui/ditolak/kedaluwarsa.

Metode:

- `node.pair.request` — membuat atau menggunakan kembali permintaan tertunda.
- `node.pair.list` — mencantumkan node tertunda + yang dipasangkan (`operator.pairing`).
- `node.pair.approve` — menyetujui permintaan tertunda (menerbitkan token).
- `node.pair.reject` — menolak permintaan tertunda.
- `node.pair.remove` — menghapus entri node berpasangan yang usang.
- `node.pair.verify` — memverifikasi `{ nodeId, token }`.

Catatan:

- `node.pair.request` bersifat idempoten per node: panggilan berulang mengembalikan
  permintaan tertunda yang sama.
- Permintaan berulang untuk node tertunda yang sama juga menyegarkan metadata node yang tersimpan
  dan snapshot perintah terdeklarasi yang diizinkan terbaru untuk visibilitas operator.
- Persetujuan **selalu** menghasilkan token baru; tidak ada token yang pernah dikembalikan dari
  `node.pair.request`.
- Permintaan dapat menyertakan `silent: true` sebagai petunjuk untuk alur persetujuan otomatis.
- `node.pair.approve` menggunakan perintah terdeklarasi dari permintaan tertunda untuk menegakkan
  cakupan persetujuan tambahan:
  - permintaan tanpa perintah: `operator.pairing`
  - permintaan perintah non-exec: `operator.pairing` + `operator.write`
  - permintaan `system.run` / `system.run.prepare` / `system.which`:
    `operator.pairing` + `operator.admin`

<Warning>
Pairing Node adalah alur kepercayaan dan identitas plus penerbitan token. Alur ini **tidak** mem-pin permukaan perintah node live per node.

- Perintah node live berasal dari apa yang dideklarasikan node saat connect setelah kebijakan perintah node global gateway (`gateway.nodes.allowCommands` dan `denyCommands`) diterapkan.
- Kebijakan izin dan tanya per-node `system.run` berada pada node di `exec.approvals.node.*`, bukan di catatan pairing.

</Warning>

## Gating perintah Node (2026.3.31+)

<Warning>
**Perubahan breaking:** Mulai `2026.3.31`, perintah node dinonaktifkan sampai pairing node disetujui. Pairing perangkat saja tidak lagi cukup untuk mengekspos perintah node yang dideklarasikan.
</Warning>

Saat node terhubung untuk pertama kali, pairing diminta secara otomatis. Sampai permintaan pairing disetujui, semua perintah node tertunda dari node tersebut difilter dan tidak akan dieksekusi. Setelah kepercayaan dibuat melalui persetujuan pairing, perintah yang dideklarasikan node menjadi tersedia sesuai kebijakan perintah normal.

Ini berarti:

- Node yang sebelumnya hanya mengandalkan pairing perangkat untuk mengekspos perintah kini harus menyelesaikan pairing node.
- Perintah yang diantrekan sebelum persetujuan pairing dibuang, bukan ditangguhkan.

## Batas kepercayaan peristiwa Node (2026.3.31+)

<Warning>
**Perubahan breaking:** Run yang berasal dari node kini tetap berada pada permukaan tepercaya yang dikurangi.
</Warning>

Ringkasan yang berasal dari node dan peristiwa sesi terkait dibatasi ke permukaan tepercaya yang dimaksud. Alur yang digerakkan notifikasi atau dipicu node yang sebelumnya mengandalkan akses tool host atau sesi yang lebih luas mungkin perlu disesuaikan. Pengerasan ini memastikan bahwa peristiwa node tidak dapat meningkat menjadi akses tool tingkat host di luar yang diizinkan oleh batas kepercayaan node.

Pembaruan kehadiran node yang persisten mengikuti batas identitas yang sama. Peristiwa `node.presence.alive`
hanya diterima dari sesi perangkat node yang terautentikasi dan memperbarui metadata pairing hanya ketika
identitas perangkat/node sudah dipasangkan. Nilai `client.id` yang dideklarasikan sendiri tidak cukup untuk menulis
status terakhir terlihat.

## Persetujuan otomatis (aplikasi macOS)

Aplikasi macOS dapat secara opsional mencoba **persetujuan senyap** ketika:

- permintaan ditandai `silent`, dan
- aplikasi dapat memverifikasi koneksi SSH ke host gateway menggunakan pengguna yang sama.

Jika persetujuan senyap gagal, alur kembali ke prompt “Setujui/Tolak” normal.

## Persetujuan otomatis perangkat CIDR tepercaya

Pairing perangkat WS untuk `role: node` tetap manual secara default. Untuk jaringan
node privat tempat Gateway sudah memercayai jalur jaringan, operator dapat
ikut serta dengan CIDR eksplisit atau IP persis:

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

- Dinonaktifkan saat `gateway.nodes.pairing.autoApproveCidrs` tidak disetel.
- Tidak ada mode persetujuan otomatis LAN menyeluruh atau jaringan privat.
- Hanya pairing perangkat `role: node` baru tanpa cakupan yang diminta yang memenuhi syarat.
- Klien operator, browser, Control UI, dan WebChat tetap manual.
- Peningkatan role, cakupan, metadata, dan kunci publik tetap manual.
- Jalur header proxy tepercaya loopback host-sama tidak memenuhi syarat karena jalur itu
  dapat dipalsukan oleh pemanggil lokal.

## Persetujuan otomatis peningkatan metadata

Saat perangkat yang sudah dipasangkan terhubung kembali hanya dengan perubahan metadata
yang tidak sensitif (misalnya, nama tampilan atau petunjuk platform klien), OpenClaw memperlakukannya
sebagai `metadata-upgrade`. Persetujuan otomatis senyap bersifat sempit: hanya berlaku
untuk rekoneksi lokal non-browser tepercaya yang sudah membuktikan kepemilikan kredensial lokal
atau bersama, termasuk rekoneksi aplikasi native host-sama setelah perubahan metadata
versi OS. Klien browser/Control UI dan klien remote tetap
menggunakan alur persetujuan ulang eksplisit. Peningkatan cakupan (read ke write/admin) dan
perubahan kunci publik **tidak** memenuhi syarat untuk persetujuan otomatis metadata-upgrade —
semuanya tetap sebagai permintaan persetujuan ulang eksplisit.

## Pembantu pairing QR

`/pair qr` merender payload pairing sebagai media terstruktur sehingga klien mobile dan
browser dapat memindainya secara langsung.

Menghapus perangkat juga membersihkan permintaan pairing tertunda yang usang untuk
id perangkat tersebut, sehingga `nodes pending` tidak menampilkan baris yatim setelah pencabutan.

## Lokalitas dan header yang diteruskan

Pairing Gateway memperlakukan koneksi sebagai loopback hanya ketika socket mentah
dan bukti proxy upstream apa pun sepakat. Jika permintaan tiba pada loopback tetapi
membawa header `X-Forwarded-For` / `X-Forwarded-Host` / `X-Forwarded-Proto`
yang menunjuk ke asal non-lokal, bukti forwarded-header tersebut mendiskualifikasi
klaim lokalitas loopback. Jalur pairing kemudian memerlukan persetujuan eksplisit
alih-alih secara senyap memperlakukan permintaan sebagai connect host-sama. Lihat
[Auth Proxy Tepercaya](/id/gateway/trusted-proxy-auth) untuk aturan yang setara pada
auth operator.

## Penyimpanan (lokal, privat)

Status pairing disimpan di bawah direktori status Gateway (default `~/.openclaw`):

- `~/.openclaw/nodes/paired.json`
- `~/.openclaw/nodes/pending.json`

Jika Anda menimpa `OPENCLAW_STATE_DIR`, folder `nodes/` ikut berpindah dengannya.

Catatan keamanan:

- Token adalah rahasia; perlakukan `paired.json` sebagai sensitif.
- Merotasi token memerlukan persetujuan ulang (atau menghapus entri node).

## Perilaku transport

- Transport bersifat **stateless**; tidak menyimpan keanggotaan.
- Jika Gateway offline atau pairing dinonaktifkan, node tidak dapat pairing.
- Jika Gateway berada dalam mode remote, pairing tetap terjadi terhadap penyimpanan Gateway remote.

## Terkait

- [Pairing channel](/id/channels/pairing)
- [Node](/id/nodes)
- [CLI Perangkat](/id/cli/devices)
