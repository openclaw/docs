---
read_when:
    - Menerapkan persetujuan penyandingan Node tanpa UI macOS
    - Menambahkan alur CLI untuk menyetujui node jarak jauh
    - Memperluas protokol Gateway dengan manajemen Node
summary: Pemasangan node milik Gateway (Opsi B) untuk iOS dan node jarak jauh lainnya
title: Penyandingan yang dikelola Gateway
x-i18n:
    generated_at: "2026-05-03T09:16:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: f0ce46d487990860ac572c27cc9dd83839e87329132e2624944660bafaf723de
    source_path: gateway/pairing.md
    workflow: 16
---

Dalam pairing milik Gateway, **Gateway** adalah sumber kebenaran untuk Node mana yang
diizinkan bergabung. UI (aplikasi macOS, klien mendatang) hanyalah frontend yang
menyetujui atau menolak permintaan tertunda.

**Penting:** Node WS menggunakan **pairing perangkat** (peran `node`) selama `connect`.
`node.pair.*` adalah penyimpanan pairing terpisah dan **tidak** mengendalikan handshake WS.
Hanya klien yang secara eksplisit memanggil `node.pair.*` yang menggunakan alur ini.

## Konsep

- **Permintaan tertunda**: sebuah Node meminta bergabung; memerlukan persetujuan.
- **Node ter-pairing**: Node yang disetujui dengan token autentikasi yang diterbitkan.
- **Transport**: endpoint WS Gateway meneruskan permintaan tetapi tidak memutuskan
  keanggotaan. (Dukungan bridge TCP lama telah dihapus.)

## Cara kerja pairing

1. Sebuah Node terhubung ke WS Gateway dan meminta pairing.
2. Gateway menyimpan **permintaan tertunda** dan memancarkan `node.pair.requested`.
3. Anda menyetujui atau menolak permintaan (CLI atau UI).
4. Setelah disetujui, Gateway menerbitkan **token baru** (token dirotasi saat pairing ulang).
5. Node terhubung kembali menggunakan token dan kini “ter-pairing”.

Permintaan tertunda kedaluwarsa otomatis setelah **5 menit**.

## Alur kerja CLI (ramah headless)

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes status
openclaw nodes remove --node <id|name|ip>
openclaw nodes rename --node <id|name|ip> --name "Living Room iPad"
```

`nodes status` menampilkan Node yang ter-pairing/terhubung beserta kapabilitasnya.

## Permukaan API (protokol gateway)

Peristiwa:

- `node.pair.requested` — dipancarkan saat permintaan tertunda baru dibuat.
- `node.pair.resolved` — dipancarkan saat permintaan disetujui/ditolak/kedaluwarsa.

Metode:

- `node.pair.request` — membuat atau menggunakan ulang permintaan tertunda.
- `node.pair.list` — menampilkan daftar Node tertunda + ter-pairing (`operator.pairing`).
- `node.pair.approve` — menyetujui permintaan tertunda (menerbitkan token).
- `node.pair.reject` — menolak permintaan tertunda.
- `node.pair.remove` — menghapus entri Node ter-pairing yang basi.
- `node.pair.verify` — memverifikasi `{ nodeId, token }`.

Catatan:

- `node.pair.request` bersifat idempoten per Node: panggilan berulang mengembalikan
  permintaan tertunda yang sama.
- Permintaan berulang untuk Node tertunda yang sama juga menyegarkan metadata Node
  yang tersimpan dan snapshot perintah terdeklarasi yang diizinkan terbaru untuk visibilitas operator.
- Persetujuan **selalu** menghasilkan token baru; tidak ada token yang pernah dikembalikan dari
  `node.pair.request`.
- Level cakupan operator dan pemeriksaan saat persetujuan diringkas dalam
  [Cakupan operator](/id/gateway/operator-scopes).
- Permintaan dapat menyertakan `silent: true` sebagai petunjuk untuk alur persetujuan otomatis.
- `node.pair.approve` menggunakan perintah terdeklarasi milik permintaan tertunda untuk memberlakukan
  cakupan persetujuan ekstra:
  - permintaan tanpa perintah: `operator.pairing`
  - permintaan perintah non-exec: `operator.pairing` + `operator.write`
  - permintaan `system.run` / `system.run.prepare` / `system.which`:
    `operator.pairing` + `operator.admin`

<Warning>
Pairing Node adalah alur kepercayaan dan identitas ditambah penerbitan token. Ini **tidak** menyematkan permukaan perintah Node langsung per Node.

- Perintah Node langsung berasal dari apa yang dideklarasikan Node saat connect setelah kebijakan perintah Node global Gateway (`gateway.nodes.allowCommands` dan `denyCommands`) diterapkan.
- Kebijakan izinkan dan tanya `system.run` per Node berada pada Node di `exec.approvals.node.*`, bukan dalam catatan pairing.

</Warning>

## Pembatasan perintah Node (2026.3.31+)

<Warning>
**Perubahan breaking:** Mulai `2026.3.31`, perintah Node dinonaktifkan sampai pairing Node disetujui. Pairing perangkat saja tidak lagi cukup untuk mengekspos perintah Node yang dideklarasikan.
</Warning>

Saat sebuah Node terhubung untuk pertama kalinya, pairing diminta secara otomatis. Sampai permintaan pairing disetujui, semua perintah Node tertunda dari Node tersebut difilter dan tidak akan dijalankan. Setelah kepercayaan ditetapkan melalui persetujuan pairing, perintah yang dideklarasikan Node menjadi tersedia sesuai kebijakan perintah normal.

Ini berarti:

- Node yang sebelumnya hanya mengandalkan pairing perangkat untuk mengekspos perintah kini harus menyelesaikan pairing Node.
- Perintah yang diantrekan sebelum persetujuan pairing dibuang, bukan ditunda.

## Batas kepercayaan peristiwa Node (2026.3.31+)

<Warning>
**Perubahan breaking:** Run yang berasal dari Node kini tetap berada pada permukaan tepercaya yang dikurangi.
</Warning>

Ringkasan yang berasal dari Node dan peristiwa sesi terkait dibatasi pada permukaan tepercaya yang dimaksud. Alur yang digerakkan notifikasi atau dipicu Node yang sebelumnya mengandalkan akses tool host atau sesi yang lebih luas mungkin perlu disesuaikan. Penguatan ini memastikan peristiwa Node tidak dapat meningkat menjadi akses tool tingkat host melampaui yang diizinkan batas kepercayaan Node.

Pembaruan kehadiran Node yang tahan lama mengikuti batas identitas yang sama. Peristiwa `node.presence.alive`
diterima hanya dari sesi perangkat Node yang diautentikasi dan memperbarui metadata pairing hanya ketika
identitas perangkat/Node sudah ter-pairing. Nilai `client.id` yang dideklarasikan sendiri tidak cukup untuk menulis
status terakhir terlihat.

## Persetujuan otomatis (aplikasi macOS)

Aplikasi macOS dapat secara opsional mencoba **persetujuan diam-diam** ketika:

- permintaan ditandai `silent`, dan
- aplikasi dapat memverifikasi koneksi SSH ke host gateway menggunakan pengguna yang sama.

Jika persetujuan diam-diam gagal, alur kembali ke prompt normal “Setujui/Tolak”.

## Persetujuan otomatis perangkat trusted-CIDR

Pairing perangkat WS untuk `role: node` tetap manual secara default. Untuk jaringan
Node privat tempat Gateway sudah memercayai jalur jaringan, operator dapat
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

- Dinonaktifkan ketika `gateway.nodes.pairing.autoApproveCidrs` tidak disetel.
- Tidak ada mode persetujuan otomatis menyeluruh untuk LAN atau jaringan privat.
- Hanya pairing perangkat `role: node` baru tanpa cakupan yang diminta yang memenuhi syarat.
- Klien operator, browser, Control UI, dan WebChat tetap manual.
- Peningkatan peran, cakupan, metadata, dan kunci publik tetap manual.
- Jalur header trusted-proxy local loopback pada host yang sama tidak memenuhi syarat karena
  jalur tersebut dapat dipalsukan oleh pemanggil lokal.

## Persetujuan otomatis peningkatan metadata

Ketika perangkat yang sudah ter-pairing terhubung kembali hanya dengan perubahan metadata
non-sensitif (misalnya, nama tampilan atau petunjuk platform klien), OpenClaw memperlakukan
itu sebagai `metadata-upgrade`. Persetujuan otomatis diam-diam bersifat sempit: hanya berlaku
untuk koneksi ulang lokal non-browser tepercaya yang sudah membuktikan kepemilikan kredensial lokal
atau bersama, termasuk koneksi ulang aplikasi native pada host yang sama setelah perubahan
metadata versi OS. Klien browser/Control UI dan klien jarak jauh tetap menggunakan
alur persetujuan ulang eksplisit. Peningkatan cakupan (read ke write/admin) dan
perubahan kunci publik **tidak** memenuhi syarat untuk persetujuan otomatis metadata-upgrade —
keduanya tetap menjadi permintaan persetujuan ulang eksplisit.

## Pembantu pairing QR

`/pair qr` merender payload pairing sebagai media terstruktur agar klien mobile dan
browser dapat memindainya secara langsung.

Menghapus perangkat juga membersihkan permintaan pairing tertunda yang basi untuk
id perangkat tersebut, sehingga `nodes pending` tidak menampilkan baris yatim setelah pencabutan.

## Lokalitas dan header yang diteruskan

Pairing Gateway memperlakukan koneksi sebagai loopback hanya ketika socket mentah
dan semua bukti proxy upstream sepakat. Jika sebuah permintaan tiba pada loopback tetapi
membawa header `X-Forwarded-For` / `X-Forwarded-Host` / `X-Forwarded-Proto`
yang menunjuk ke asal non-lokal, bukti header yang diteruskan tersebut mendiskualifikasi
klaim lokalitas loopback. Jalur pairing kemudian memerlukan persetujuan eksplisit
alih-alih secara diam-diam memperlakukan permintaan sebagai connect dari host yang sama. Lihat
[Autentikasi Trusted Proxy](/id/gateway/trusted-proxy-auth) untuk aturan ekuivalen pada
autentikasi operator.

## Penyimpanan (lokal, privat)

Status pairing disimpan di bawah direktori status Gateway (default `~/.openclaw`):

- `~/.openclaw/nodes/paired.json`
- `~/.openclaw/nodes/pending.json`

Jika Anda menimpa `OPENCLAW_STATE_DIR`, folder `nodes/` ikut berpindah.

Catatan keamanan:

- Token adalah rahasia; perlakukan `paired.json` sebagai sensitif.
- Merotasi token memerlukan persetujuan ulang (atau menghapus entri Node).

## Perilaku transport

- Transport bersifat **stateless**; tidak menyimpan keanggotaan.
- Jika Gateway offline atau pairing dinonaktifkan, Node tidak dapat melakukan pairing.
- Jika Gateway berada dalam mode jarak jauh, pairing tetap terjadi terhadap penyimpanan Gateway jarak jauh.

## Terkait

- [Pairing channel](/id/channels/pairing)
- [Node](/id/nodes)
- [CLI perangkat](/id/cli/devices)
