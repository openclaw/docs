---
read_when:
    - Mengimplementasikan persetujuan pairing Node tanpa UI macOS
    - Menambahkan alur CLI untuk menyetujui node jarak jauh
    - Memperluas protokol Gateway dengan manajemen Node
summary: Penyandingan node milik Gateway (Opsi B) untuk iOS dan node jarak jauh lainnya
title: Penyandingan yang dikelola Gateway
x-i18n:
    generated_at: "2026-05-06T09:13:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 75713e04e37dcbae151d170e2eb459d0e9b9a799c64a10db731b61d7b53998b4
    source_path: gateway/pairing.md
    workflow: 16
---

Dalam penyandingan milik Gateway, **Gateway** adalah sumber kebenaran untuk menentukan Node mana
yang diizinkan bergabung. UI (aplikasi macOS, klien masa depan) hanyalah antarmuka yang
menyetujui atau menolak permintaan tertunda.

**Penting:** Node WS menggunakan **penyandingan perangkat** (role `node`) selama `connect`.
`node.pair.*` adalah penyimpanan penyandingan terpisah dan **tidak** mengendalikan jabat tangan WS.
Hanya klien yang secara eksplisit memanggil `node.pair.*` yang menggunakan alur ini.

## Konsep

- **Permintaan tertunda**: sebuah Node meminta untuk bergabung; memerlukan persetujuan.
- **Node tersanding**: Node yang disetujui dengan token autentikasi yang diterbitkan.
- **Transpor**: titik akhir WS Gateway meneruskan permintaan tetapi tidak menentukan
  keanggotaan. (Dukungan jembatan TCP lama telah dihapus.)

## Cara kerja penyandingan

1. Sebuah Node terhubung ke WS Gateway dan meminta penyandingan.
2. Gateway menyimpan **permintaan tertunda** dan memancarkan `node.pair.requested`.
3. Anda menyetujui atau menolak permintaan tersebut (CLI atau UI).
4. Saat disetujui, Gateway menerbitkan **token baru** (token dirotasi saat penyandingan ulang).
5. Node terhubung ulang menggunakan token dan sekarang "tersanding".

Permintaan tertunda kedaluwarsa otomatis setelah **5 menit**.

## Alur kerja CLI (ramah tanpa antarmuka grafis)

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes status
openclaw nodes remove --node <id|name|ip>
openclaw nodes rename --node <id|name|ip> --name "Living Room iPad"
```

`nodes status` menampilkan Node yang tersanding/terhubung beserta kapabilitasnya.

## Permukaan API (protokol Gateway)

Peristiwa:

- `node.pair.requested` - dipancarkan ketika permintaan tertunda baru dibuat.
- `node.pair.resolved` - dipancarkan ketika permintaan disetujui/ditolak/kedaluwarsa.

Metode:

- `node.pair.request` - membuat atau menggunakan ulang permintaan tertunda.
- `node.pair.list` - mencantumkan Node tertunda + tersanding (`operator.pairing`).
- `node.pair.approve` - menyetujui permintaan tertunda (menerbitkan token).
- `node.pair.reject` - menolak permintaan tertunda.
- `node.pair.remove` - menghapus entri Node tersanding yang usang.
- `node.pair.verify` - memverifikasi `{ nodeId, token }`.

Catatan:

- `node.pair.request` bersifat idempoten per Node: panggilan berulang mengembalikan permintaan
  tertunda yang sama.
- Permintaan berulang untuk Node tertunda yang sama juga menyegarkan metadata Node yang disimpan
  dan snapshot perintah terdeklarasi terbaru yang diizinkan untuk visibilitas operator.
- Persetujuan **selalu** menghasilkan token baru; tidak ada token yang pernah dikembalikan dari
  `node.pair.request`.
- Tingkat cakupan operator dan pemeriksaan saat persetujuan dirangkum di
  [Cakupan operator](/id/gateway/operator-scopes).
- Permintaan dapat menyertakan `silent: true` sebagai petunjuk untuk alur persetujuan otomatis.
- `node.pair.approve` menggunakan perintah terdeklarasi milik permintaan tertunda untuk menerapkan
  cakupan persetujuan tambahan:
  - permintaan tanpa perintah: `operator.pairing`
  - permintaan perintah non-eksekusi: `operator.pairing` + `operator.write`
  - permintaan `system.run` / `system.run.prepare` / `system.which`:
    `operator.pairing` + `operator.admin`

<Warning>
Penyandingan Node adalah alur kepercayaan dan identitas sekaligus penerbitan token. Alur ini **tidak** mematok permukaan perintah Node aktif per Node.

- Perintah Node aktif berasal dari apa yang dideklarasikan Node saat terhubung setelah kebijakan perintah Node global Gateway (`gateway.nodes.allowCommands` dan `denyCommands`) diterapkan.
- Kebijakan izinkan dan tanya `system.run` per Node berada di Node dalam `exec.approvals.node.*`, bukan dalam catatan penyandingan.

</Warning>

## Pembatasan perintah Node (2026.3.31+)

<Warning>
**Perubahan yang merusak kompatibilitas:** Mulai `2026.3.31`, perintah Node dinonaktifkan sampai penyandingan Node disetujui. Penyandingan perangkat saja tidak lagi cukup untuk mengekspos perintah Node yang dideklarasikan.
</Warning>

Ketika sebuah Node terhubung untuk pertama kali, penyandingan diminta secara otomatis. Sampai permintaan penyandingan disetujui, semua perintah Node tertunda dari Node tersebut difilter dan tidak akan dijalankan. Setelah kepercayaan ditetapkan melalui persetujuan penyandingan, perintah yang dideklarasikan Node menjadi tersedia dengan tetap tunduk pada kebijakan perintah normal.

Ini berarti:

- Node yang sebelumnya hanya mengandalkan penyandingan perangkat untuk mengekspos perintah kini harus menyelesaikan penyandingan Node.
- Perintah yang diantrekan sebelum persetujuan penyandingan dibuang, bukan ditunda.

## Batas kepercayaan peristiwa Node (2026.3.31+)

<Warning>
**Perubahan yang merusak kompatibilitas:** Eksekusi yang berasal dari Node kini tetap berada pada permukaan tepercaya yang dipersempit.
</Warning>

Ringkasan yang berasal dari Node dan peristiwa sesi terkait dibatasi pada permukaan tepercaya yang dimaksudkan. Alur yang dipicu notifikasi atau dipicu Node yang sebelumnya mengandalkan akses alat host atau sesi yang lebih luas mungkin perlu disesuaikan. Pengerasan keamanan ini memastikan peristiwa Node tidak dapat meningkat menjadi akses alat tingkat host di luar batas kepercayaan yang diizinkan Node.

Pembaruan kehadiran Node yang persisten mengikuti batas identitas yang sama. Peristiwa `node.presence.alive`
hanya diterima dari sesi perangkat Node yang terautentikasi dan memperbarui metadata penyandingan hanya ketika
identitas perangkat/Node sudah tersanding. Nilai `client.id` yang dideklarasikan sendiri tidak cukup untuk menulis
status terakhir terlihat.

## Persetujuan otomatis (aplikasi macOS)

Aplikasi macOS dapat secara opsional mencoba **persetujuan senyap** ketika:

- permintaan ditandai `silent`, dan
- aplikasi dapat memverifikasi koneksi SSH ke host Gateway menggunakan pengguna yang sama.

Jika persetujuan senyap gagal, alur akan kembali ke prompt "Setujui/Tolak" normal.

## Persetujuan otomatis perangkat CIDR tepercaya

Penyandingan perangkat WS untuk `role: node` tetap manual secara bawaan. Untuk jaringan
Node privat tempat Gateway sudah memercayai jalur jaringan, operator dapat
memilih ikut serta dengan CIDR eksplisit atau IP persis:

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
- Tidak ada mode persetujuan otomatis menyeluruh untuk LAN atau jaringan privat.
- Hanya penyandingan perangkat `role: node` baru tanpa cakupan yang diminta yang memenuhi syarat.
- Klien operator, browser, Control UI, dan WebChat tetap manual.
- Peningkatan peran, cakupan, metadata, dan kunci publik tetap manual.
- Jalur header proxy tepercaya loopback pada host yang sama tidak memenuhi syarat karena
  jalur tersebut dapat dipalsukan oleh pemanggil lokal.

## Persetujuan otomatis peningkatan metadata

Ketika perangkat yang sudah tersanding terhubung ulang hanya dengan perubahan metadata
yang tidak sensitif (misalnya, nama tampilan atau petunjuk platform klien), OpenClaw memperlakukan
itu sebagai `metadata-upgrade`. Persetujuan otomatis senyap bersifat sempit: hanya berlaku
untuk penyambungan ulang lokal tepercaya non-browser yang sudah membuktikan kepemilikan kredensial lokal
atau bersama, termasuk penyambungan ulang aplikasi asli pada host yang sama setelah perubahan metadata
versi OS. Klien browser/Control UI dan klien jarak jauh tetap
menggunakan alur persetujuan ulang eksplisit. Peningkatan cakupan (baca ke tulis/admin) dan
perubahan kunci publik **tidak** memenuhi syarat untuk persetujuan otomatis peningkatan metadata -
keduanya tetap menjadi permintaan persetujuan ulang eksplisit.

## Pembantu penyandingan QR

`/pair qr` merender payload penyandingan sebagai media terstruktur sehingga klien seluler dan
browser dapat memindainya langsung.

Menghapus perangkat juga membersihkan permintaan penyandingan tertunda yang usang untuk
ID perangkat tersebut, sehingga `nodes pending` tidak menampilkan baris tersisa setelah pencabutan.

## Lokalitas dan header yang diteruskan

Penyandingan Gateway memperlakukan koneksi sebagai loopback hanya ketika socket mentah
dan bukti proxy hulu sama-sama sesuai. Jika permintaan tiba melalui loopback tetapi
membawa header `X-Forwarded-For` / `X-Forwarded-Host` / `X-Forwarded-Proto`
yang menunjuk ke asal non-lokal, bukti header yang diteruskan tersebut menggugurkan
klaim lokalitas loopback. Jalur penyandingan kemudian memerlukan persetujuan eksplisit
alih-alih secara senyap memperlakukan permintaan sebagai koneksi host yang sama. Lihat
[Autentikasi Proxy Tepercaya](/id/gateway/trusted-proxy-auth) untuk aturan setara pada
autentikasi operator.

## Penyimpanan (lokal, privat)

Status penyandingan disimpan di bawah direktori status Gateway (bawaan `~/.openclaw`):

- `~/.openclaw/nodes/paired.json`
- `~/.openclaw/nodes/pending.json`

Jika Anda mengganti `OPENCLAW_STATE_DIR`, folder `nodes/` ikut berpindah.

Catatan keamanan:

- Token adalah rahasia; perlakukan `paired.json` sebagai sensitif.
- Merotasi token memerlukan persetujuan ulang (atau menghapus entri Node).

## Perilaku transpor

- Transpor bersifat **tanpa status**; transpor tidak menyimpan keanggotaan.
- Jika Gateway tidak online atau penyandingan dinonaktifkan, Node tidak dapat melakukan penyandingan.
- Jika Gateway berada dalam mode jarak jauh, penyandingan tetap terjadi terhadap penyimpanan Gateway jarak jauh.

## Terkait

- [Penyandingan saluran](/id/channels/pairing)
- [Node](/id/nodes)
- [CLI Perangkat](/id/cli/devices)
