---
read_when:
    - Mengimplementasikan persetujuan pemasangan node tanpa UI macOS
    - Menambahkan alur CLI untuk menyetujui node jarak jauh
    - Memperluas protokol gateway dengan manajemen node
summary: Pemasangan node yang dimiliki Gateway (Opsi B) untuk iOS dan node jarak jauh lainnya
title: Gateway-owned pairing
x-i18n:
    generated_at: "2026-06-27T17:32:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: aefddafaef419fc59b04ee17dae8ef21685b4f514f4286530bf07362663a8996
    source_path: gateway/pairing.md
    workflow: 16
---

Dalam pairing yang dimiliki Gateway, **Gateway** adalah sumber kebenaran untuk node mana yang
diizinkan bergabung. UI (aplikasi macOS, klien mendatang) hanyalah frontend yang
menyetujui atau menolak permintaan tertunda.

**Penting:** node WS menggunakan **pairing perangkat** (peran `node`) selama `connect`.
`node.pair.*` adalah penyimpanan pairing terpisah dan **tidak** mengatur handshake WS.
Hanya klien yang secara eksplisit memanggil `node.pair.*` yang menggunakan alur ini.

## Konsep

- **Permintaan tertunda**: node meminta bergabung; memerlukan persetujuan.
- **Node yang dipasangkan**: node yang disetujui dengan token auth yang diterbitkan.
- **Transpor**: endpoint WS Gateway meneruskan permintaan tetapi tidak memutuskan
  keanggotaan. (Dukungan bridge TCP lama telah dihapus.)

## Cara kerja pairing

1. Node terhubung ke WS Gateway dan meminta pairing.
2. Gateway menyimpan **permintaan tertunda** dan memancarkan `node.pair.requested`.
3. Anda menyetujui atau menolak permintaan (CLI atau UI).
4. Saat disetujui, Gateway menerbitkan **token baru** (token dirotasi saat pairing ulang).
5. Node terhubung ulang menggunakan token dan kini "dipasangkan".

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

`nodes status` menampilkan node yang dipasangkan/terhubung dan kapabilitasnya.

## Permukaan API (protokol gateway)

Event:

- `node.pair.requested` - dipancarkan saat permintaan tertunda baru dibuat.
- `node.pair.resolved` - dipancarkan saat permintaan disetujui/ditolak/kedaluwarsa.

Metode:

- `node.pair.request` - membuat atau menggunakan ulang permintaan tertunda.
- `node.pair.list` - mencantumkan node tertunda + dipasangkan (`operator.pairing`).
- `node.pair.approve` - menyetujui permintaan tertunda (menerbitkan token).
- `node.pair.reject` - menolak permintaan tertunda.
- `node.pair.remove` - menghapus node yang dipasangkan. Untuk pairing yang didukung perangkat, ini
  mencabut peran `node` milik perangkat: ini mengubah `devices/paired.json` dan
  membatalkan/memutus sesi peran node perangkat tersebut. Perangkat **peran campuran**
  (misalnya juga memegang `operator`) mempertahankan barisnya dan hanya kehilangan peran `node`;
  baris perangkat khusus node dihapus. Ini juga menghapus entri pairing node lama
  yang dimiliki gateway jika cocok. Authz: `operator.pairing` dapat menghapus
  baris node non-operator; pemanggil token perangkat yang mencabut peran node **miliknya sendiri** pada
  perangkat peran campuran juga membutuhkan `operator.admin`.
- `node.pair.verify` - memverifikasi `{ nodeId, token }`.

Catatan:

- `node.pair.request` bersifat idempoten per node: panggilan berulang mengembalikan
  permintaan tertunda yang sama.
- Permintaan berulang untuk node tertunda yang sama juga menyegarkan metadata node yang tersimpan
  dan snapshot perintah terdeklarasi allowlist terbaru untuk visibilitas operator.
- Persetujuan **selalu** menghasilkan token baru; tidak ada token yang pernah dikembalikan dari
  `node.pair.request`.
- Tingkat cakupan operator dan pemeriksaan saat persetujuan dirangkum dalam
  [Cakupan operator](/id/gateway/operator-scopes).
- Permintaan dapat menyertakan `silent: true` sebagai petunjuk untuk alur persetujuan otomatis.
- `node.pair.approve` menggunakan perintah terdeklarasi milik permintaan tertunda untuk memberlakukan
  cakupan persetujuan ekstra:
  - permintaan tanpa perintah: `operator.pairing`
  - permintaan perintah non-exec: `operator.pairing` + `operator.write`
  - permintaan `system.run` / `system.run.prepare` / `system.which`:
    `operator.pairing` + `operator.admin`

<Warning>
Pairing node adalah alur kepercayaan dan identitas plus penerbitan token. Ini **tidak** mem-pin permukaan perintah node live per node.

- Perintah node live berasal dari apa yang dideklarasikan node saat connect setelah kebijakan perintah node global gateway (`gateway.nodes.allowCommands` dan `denyCommands`) diterapkan.
- Kebijakan allow dan ask `system.run` per node berada di node dalam `exec.approvals.node.*`, bukan dalam catatan pairing.

</Warning>

## Pengaturan perintah node (2026.3.31+)

<Warning>
**Perubahan yang merusak kompatibilitas:** Mulai `2026.3.31`, perintah node dinonaktifkan sampai pairing node disetujui. Pairing perangkat saja tidak lagi cukup untuk mengekspos perintah node yang dideklarasikan.
</Warning>

Saat node terhubung untuk pertama kali, pairing diminta secara otomatis. Sampai permintaan pairing disetujui, semua perintah node tertunda dari node tersebut difilter dan tidak akan dieksekusi. Setelah kepercayaan ditetapkan melalui persetujuan pairing, perintah yang dideklarasikan node tersedia sesuai kebijakan perintah normal.

Ini berarti:

- Node yang sebelumnya hanya mengandalkan pairing perangkat untuk mengekspos perintah kini harus menyelesaikan pairing node.
- Perintah yang diantrekan sebelum persetujuan pairing dibuang, bukan ditunda.

## Batas kepercayaan event node (2026.3.31+)

<Warning>
**Perubahan yang merusak kompatibilitas:** Run yang berasal dari node kini tetap berada pada permukaan tepercaya yang dikurangi.
</Warning>

Ringkasan yang berasal dari node dan event sesi terkait dibatasi ke permukaan tepercaya yang dimaksud. Alur yang digerakkan notifikasi atau dipicu node yang sebelumnya mengandalkan akses alat host atau sesi yang lebih luas mungkin perlu disesuaikan. Pengerasan ini memastikan bahwa event node tidak dapat meningkat menjadi akses alat tingkat host di luar yang diizinkan batas kepercayaan node.

Pembaruan keberadaan node yang tahan lama mengikuti batas identitas yang sama. Event `node.presence.alive`
diterima hanya dari sesi perangkat node terautentikasi dan memperbarui metadata pairing hanya saat
identitas perangkat/node sudah dipasangkan. Nilai `client.id` yang dideklarasikan sendiri tidak cukup untuk menulis
status terakhir terlihat.

## Persetujuan otomatis (aplikasi macOS)

Aplikasi macOS secara opsional dapat mencoba **persetujuan senyap** saat:

- permintaan ditandai `silent`, dan
- aplikasi dapat memverifikasi koneksi SSH ke host gateway menggunakan pengguna yang sama.

Jika persetujuan senyap gagal, alur kembali ke prompt "Setujui/Tolak" normal.

## Persetujuan otomatis perangkat Trusted-CIDR

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
- Tidak ada mode persetujuan otomatis blanket untuk LAN atau jaringan privat.
- Hanya pairing perangkat `role: node` baru tanpa cakupan yang diminta yang memenuhi syarat.
- Klien operator, browser, Control UI, dan WebChat tetap manual.
- Peningkatan peran, cakupan, metadata, dan kunci publik tetap manual.
- Jalur header trusted-proxy loopback host yang sama tidak memenuhi syarat karena jalur itu
  dapat dipalsukan oleh pemanggil lokal.

## Persetujuan otomatis peningkatan metadata

Saat perangkat yang sudah dipasangkan terhubung ulang hanya dengan perubahan metadata
non-sensitif (misalnya, nama tampilan atau petunjuk platform klien), OpenClaw memperlakukannya
sebagai `metadata-upgrade`. Persetujuan otomatis senyap bersifat sempit: ini hanya berlaku
untuk koneksi ulang lokal tepercaya non-browser yang sudah membuktikan kepemilikan kredensial lokal
atau bersama, termasuk koneksi ulang aplikasi native host yang sama setelah perubahan metadata
versi OS. Klien browser/Control UI dan klien jarak jauh tetap
menggunakan alur persetujuan ulang eksplisit. Peningkatan cakupan (read ke write/admin) dan
perubahan kunci publik **tidak** memenuhi syarat untuk persetujuan otomatis metadata-upgrade -
semuanya tetap menjadi permintaan persetujuan ulang eksplisit.

## Pembantu pairing QR

`/pair qr` merender payload pairing sebagai media terstruktur sehingga klien mobile dan
browser dapat memindainya secara langsung.

Menghapus perangkat juga membersihkan permintaan pairing tertunda yang usang untuk
id perangkat tersebut, sehingga `nodes pending` tidak menampilkan baris yatim setelah pencabutan.

## Lokalitas dan header yang diteruskan

Pairing Gateway memperlakukan koneksi sebagai loopback hanya saat socket mentah
dan bukti proxy upstream sama-sama sepakat. Jika permintaan tiba di loopback tetapi
membawa bukti header `Forwarded`, `X-Forwarded-*`, atau `X-Real-IP`, bukti
header yang diteruskan itu mendiskualifikasi klaim lokalitas loopback. Jalur pairing
kemudian memerlukan persetujuan eksplisit alih-alih secara senyap memperlakukan permintaan sebagai
koneksi host yang sama. Lihat [Auth Proxy Tepercaya](/id/gateway/trusted-proxy-auth) untuk
aturan yang setara pada auth operator.

## Penyimpanan (lokal, privat)

Status pairing disimpan di bawah direktori status Gateway (default `~/.openclaw`):

- `~/.openclaw/nodes/paired.json`
- `~/.openclaw/nodes/pending.json`

Jika Anda mengganti `OPENCLAW_STATE_DIR`, folder `nodes/` ikut berpindah.

Catatan keamanan:

- Token adalah rahasia; perlakukan `paired.json` sebagai sensitif.
- Merotasi token memerlukan persetujuan ulang (atau menghapus entri node).

## Perilaku transpor

- Transpor bersifat **tanpa status**; tidak menyimpan keanggotaan.
- Jika Gateway offline atau pairing dinonaktifkan, node tidak dapat pairing.
- Jika Gateway berada dalam mode jarak jauh, pairing tetap terjadi terhadap penyimpanan Gateway jarak jauh.

## Terkait

- [Pairing channel](/id/channels/pairing)
- [Node](/id/nodes)
- [CLI perangkat](/id/cli/devices)
