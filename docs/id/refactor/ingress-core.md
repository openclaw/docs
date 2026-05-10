---
read_when:
    - Mengaudit mengapa refaktor ingress saluran menambahkan terlalu banyak kode
    - Memindahkan kebijakan rute, perintah, peristiwa, aktivasi, atau grup akses dari Plugin yang dibundel ke inti
    - Meninjau apakah helper ingress saluran benar-benar menghapus kode Plugin bawaan
sidebarTitle: Ingress core deletion
summary: Rencana dengan penghapusan terlebih dahulu untuk memindahkan kode perekat penerimaan saluran yang berulang ke inti.
title: Rencana penghapusan inti ingress
x-i18n:
    generated_at: "2026-05-10T19:51:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 71afcf5d4f58c57ecfe7b388325279700a723ec1fcd926f644095106b662c3d0
    source_path: refactor/ingress-core.md
    workflow: 16
---

# Rencana penghapusan inti ingress

Refactor ingress belum sehat selama masih menambahkan ribuan baris bersih. Sentralisasi inti
baru berarti jika kode produksi Plugin bawaan menjadi lebih kecil dan kompatibilitas SDK
pihak ketiga lama dikarantina ke shim SDK/inti.

Bentuk runtime yang diinginkan:

```text
bundled plugin event
  -> extract platform facts locally
  -> resolve shared ingress once when facts are available
  -> branch on generic ingress projections/outcomes
  -> perform platform side effects locally

old third-party helper
  -> SDK compatibility shim
  -> shared ingress-compatible projection where possible
  -> old return shape preserved
```

Plugin bawaan tidak boleh menerjemahkan ingress kembali menjadi bentuk lokal
`AccessResult`, `GroupAccessDecision`, `CommandAuthDecision`, `DmCommandAccess`, atau
`{ allowed, reasonCode }` kecuali tipe tersebut adalah API Plugin publik.

## Anggaran

Diukur terhadap merge-base PR dengan `origin/main`, termasuk file yang belum dilacak.

```text
merge-base            1671e7532adb

current:
core production       +3,922 / -546    = +3,376
docs                  +601 / -17       = +584
other                 +145 / -2        = +143
plugin production     +4,148 / -5,388  = -1,240
tests                 +2,326 / -2,414  = -88
total                 +11,142 / -8,367 = +2,775

required:
plugin production     <= -1,500
core production       <= +1,500, or paid for by larger plugin deletion
tests                 <= +1,000
total                 <= +2,000

stretch:
plugin production     <= -2,500
core production       <= +1,200
total                 <= 0
```

Pembersihan minimum yang tersisa:

```text
plugin production     needs 260 more net deleted lines
total                 needs 775 more net deleted lines
core production       still +1,876 over standalone budget, unless paid down by plugin deletion
```

Penghapusan yang hanya berupa komentar tidak dihitung sebagai pembersihan. Putaran anggaran
sebelumnya terlalu longgar karena menyertakan komentar penjelas QQBot yang dipulihkan; dokumen
ini hanya melacak pergerakan kode executable/dokumentasi/pengujian.

Ukur ulang setelah setiap gelombang pembersihan:

```sh
base=$(git merge-base HEAD origin/main)
git diff --shortstat "$base"
git diff --numstat "$base" -- src/channels/message-access src/plugin-sdk extensions | sort -nr -k1 | head -n 80
pnpm lint:extensions:no-deprecated-channel-access
```

## Diagnosis

Putaran pertama menambahkan kernel ingress bersama, lalu menyisakan terlalu banyak otorisasi
lokal Plugin di sampingnya:

```text
platform facts
  -> shared ingress state and decision
  -> plugin-local DTO or legacy projection
  -> plugin-local if/else ladder
```

Itu menggandakan model. Produksi inti bertambah sekitar 3.376 baris, sementara produksi
Plugin bawaan berkurang 1.240 baris. Itu lebih baik daripada putaran pertama, tetapi belum
masuk anggaran minimum. Perbaikannya tetap mengutamakan penghapusan:

- hapus DTO Plugin yang hanya mengganti nama field ingress
- hapus pengujian yang hanya memeriksa bentuk wrapper
- tambahkan helper inti hanya jika patch yang sama menghapus kode Plugin bawaan
- pertahankan kompatibilitas SDK lama hanya di shim SDK/inti
- kemas ulang inti setelah penghapusan wrapper memperlihatkan bentuk yang stabil

## Hotspot

File produksi bawaan positif yang masih perlu diperkecil:

```text
extensions/telegram/src/ingress.ts                        +126
extensions/discord/src/monitor/dm-command-auth.ts         +101
extensions/signal/src/monitor/access-policy.ts             +92
extensions/feishu/src/policy.ts                            +85
extensions/slack/src/monitor/auth.ts                       +64
extensions/googlechat/src/monitor-access.ts                +59
extensions/nextcloud-talk/src/inbound.ts                   +51
extensions/matrix/src/matrix/monitor/access-state.ts       +49
extensions/irc/src/inbound.ts                              +44
extensions/imessage/src/monitor/inbound-processing.ts      +36
extensions/qa-channel/src/inbound.ts                       +34
extensions/qqbot/src/bridge/sdk-adapter.ts                 +33
extensions/tlon/src/monitor/utils.ts                       +30
extensions/twitch/src/access-control.ts                    +22
extensions/qqbot/src/engine/commands/slash-command-handler.ts +20
extensions/telegram/src/bot-handlers.runtime.ts            +19
```

Branch ini belum masuk anggaran minimum. Pekerjaan tersisa yang relevan untuk peninjauan
harus menghapus alur otorisasi berulang, scaffolding turn, atau pengujian wrapper sebelum
menambahkan abstraksi inti lain.

## Pembacaan Kode Saat Ini

Seam inti yang sehat sudah ada di `src/channels/message-access/runtime.ts`:
ia memiliki adapter identitas, allowlist efektif, pembacaan pairing-store, deskriptor
rute, preset perintah/event, grup akses, dan proyeksi akhir
`ResolvedChannelMessageIngress` yang sudah diselesaikan.

Pertumbuhan yang tersisa sebagian besar adalah glue Plugin yang dilapiskan di atas seam itu:

- `extensions/telegram/src/ingress.ts` membungkus keputusan inti dalam helper
  perintah/event khusus Telegram, lalu call site masih meneruskan allowlist
  ternormalisasi dan daftar pemilik yang sudah dihitung sebelumnya.
- `extensions/discord/src/monitor/dm-command-auth.ts`,
  `extensions/feishu/src/policy.ts`, `extensions/googlechat/src/monitor-access.ts`,
  dan `extensions/matrix/src/matrix/monitor/access-state.ts` masih menyimpan
  DTO kebijakan lokal atau nama keputusan legacy di samping ingress.
- `extensions/signal/src/monitor/access-policy.ts` dengan benar menjaga
  normalisasi identitas Signal dan balasan pairing tetap lokal, tetapi masih memiliki seam
  wrapper yang seharusnya dilebur menjadi konsumsi ingress langsung.
- `extensions/nextcloud-talk/src/inbound.ts`, `extensions/irc/src/inbound.ts`,
  `extensions/qa-channel/src/inbound.ts`, `extensions/zalo/src/monitor.ts`, dan
  `extensions/zalouser/src/monitor.ts` masih mengulang penyusunan rute/envelope/turn
  yang dapat dipindahkan ke helper turn bersama di luar kernel ingress.

Kesimpulan: memindahkan lebih banyak kode ke inti hanya berguna jika menghapus lapisan
wrapper Plugin ini dalam patch yang sama. Menambahkan abstraksi lain sambil mempertahankan
return wrapper hanya mengulang kesalahan.

## Batasan

Inti memiliki kebijakan generik:

- normalisasi dan pencocokan allowlist
- ekspansi grup akses dan diagnostik
- pembacaan allowlist DM dari pairing-store
- gate rute, pengirim, perintah, event, dan aktivasi
- pemetaan admission: dispatch, drop, skip, observe, pairing
- state, keputusan, diagnostik, dan proyeksi kompatibilitas SDK yang sudah diredaksi
- deskriptor generik yang dapat digunakan ulang untuk identitas, rute, perintah, event, aktivasi,
  dan outcome

Plugin memiliki fakta transport dan efek samping:

- keaslian webhook/socket/request
- ekstraksi identitas platform dan lookup API
- default kebijakan khusus channel
- pengiriman pairing challenge, balasan, ack, reaksi, typing, media, riwayat,
  setup, doctor, status, log, dan salinan yang terlihat pengguna

Inti harus tetap agnostik terhadap channel: tidak ada Discord, Slack, Telegram, Matrix, room,
guild, space, klien API, atau default khusus Plugin di
`src/channels/message-access`.

## Aturan Penerimaan

Setiap helper inti baru harus langsung menghapus kode produksi Plugin bawaan.

```text
one bundled caller        reject; keep plugin-local
two bundled callers       accept only if plugin production LOC drops
three or more callers     plugin deletion must be at least 2x new core LOC
compatibility-only helper SDK/core shim only; never bundled hot paths
```

Berhenti dan rancang ulang jika:

- LOC produksi Plugin meningkat
- pengujian tumbuh lebih cepat daripada penyusutan produksi
- hot path bawaan mengembalikan DTO yang hanya mengganti nama `ResolvedChannelMessageIngress`
- helper inti memerlukan id channel, objek platform, klien API, atau
  default khusus channel

## Paket Pekerjaan

1. Bekukan anggaran.
   Letakkan LOC di PR, jaga lint deprecated-ingress tetap hijau, dan sertakan LOC sebelum/sesudah
   dalam commit pembersihan.

2. Hapus seam DTO tipis.
   Ganti return wrapper lokal Plugin dengan `ResolvedChannelMessageIngress`,
   `senderAccess`, `commandAccess`, `routeAccess`, atau `ingress` secara langsung. Mulai
   dengan QQBot, Telegram, Slack, Discord, Signal, Feishu, Matrix, iMessage, dan
   Tlon. Hapus pengujian bentuk wrapper; pertahankan pengujian perilaku.

3. Tambahkan klasifikasi outcome hanya dengan penghapusan.
   Classifier generik dapat mengekspos `dispatch`, `pairing-required`,
   `skip-activation`, `drop-command`, `drop-route`, `drop-sender`, dan
   `drop-ingress`. Ia harus diturunkan dari grafik keputusan, bukan string alasan,
   dan memigrasikan setidaknya tiga Plugin dalam patch yang sama.

4. Tambahkan builder deskriptor rute hanya dengan penghapusan.
   Helper target rute dan pengirim rute generik dapat diterima hanya jika langsung
   memperkecil Plugin yang berat pada rute: Google Chat, IRC, Microsoft Teams,
   Nextcloud Talk, Mattermost, Slack, Zalo, dan Zalo Personal.

5. Tambahkan preset perintah/event hanya dengan penghapusan.
   Sentralisasikan bentuk text-command, native-command, callback, dan origin-subject.
   Konsumen perintah harus default ke tidak terotorisasi ketika tidak ada gate perintah yang berjalan;
   event tidak boleh memulai pairing.

6. Tambahkan preset identitas hanya jika menghapus boilerplate.
   Helper stable-id, stable-id-plus-aliases, phone/e164, dan multi-identifier
   diperbolehkan ketika nilai mentah hanya masuk ke input adapter dan state yang diredaksi menjaga
   id/jumlah tetap opaque.

7. Bagikan penyusunan turn terotorisasi.
   Di luar kernel ingress, hapus scaffolding rute/envelope/konteks/balasan berulang
   dari QA Channel, IRC, Nextcloud Talk, Zalo, dan Zalo Personal.
   Inti dapat memiliki sequencing rute/sesi/envelope/dispatch; Plugin mempertahankan
   pengiriman dan konteks khusus channel.

8. Karantina kompatibilitas.
   Helper SDK deprecated tetap kompatibel secara sumber, tetapi hot path bawaan tidak boleh
   mengimpor facade ingress atau command-auth deprecated. Pengujian kompatibilitas harus
   menggunakan Plugin pihak ketiga palsu, bukan internal Plugin bawaan.

9. Kemas ulang inti.
   Setelah penghapusan wrapper, lebur modul sekali pakai, hapus export yang tidak digunakan, pindahkan
   proyeksi kompatibilitas keluar dari hot path, dan pertahankan pengujian terfokus untuk identitas,
   rute, perintah/event, aktivasi, grup akses, dan shim kompatibilitas.

## Gelombang Penghapusan

Jalankan ini secara berurutan. Setiap gelombang harus menurunkan LOC produksi bawaan.

1. Peleburan wrapper, delta Plugin yang diharapkan: -400 hingga -600.
   Ganti tipe hasil `resolveXAccess`, `resolveXCommandAccess`, dan
   `accessFromIngress` lokal Plugin dengan pembacaan langsung dari
   `ResolvedChannelMessageIngress`. Target pertama: Discord DM command auth,
   kebijakan Feishu, state akses Matrix, ingress Telegram, kebijakan akses Signal,
   adapter SDK QQBot.

2. Helper outcome bersama, delta Plugin yang diharapkan: -200 hingga -350.
   Tambahkan satu classifier generik hanya jika ia menghapus ladder
   `shouldBlockControlCommand`, pairing, activation skip, route block, dan sender
   block yang berulang di setidaknya tiga Plugin.

3. Builder deskriptor rute, delta Plugin yang diharapkan: -200 hingga -350.
   Pindahkan penyusunan deskriptor target rute dan pengirim rute berulang ke helper
   inti. Target pertama: Google Chat, IRC, Microsoft Teams, Nextcloud Talk,
   Mattermost, Slack, Zalo, Zalo Personal.

4. Berbagi penyusunan turn, delta Plugin yang diharapkan: -250 hingga -450.
   Gunakan sequencing rute/sesi/envelope/dispatch bersama untuk Plugin inbound
   sederhana. Target pertama: QA Channel, IRC, Nextcloud Talk, Zalo, Zalo Personal.

5. Pengemasan ulang inti, delta inti yang diharapkan: -300 hingga -700.
   Setelah Plugin mengonsumsi proyeksi runtime secara langsung, hapus modul sekali pakai,
   gabungkan file kecil kembali ke `runtime.ts` atau sibling terfokus, dan jaga file
   kompatibilitas SDK terpisah dari hot path bawaan.

6. Pemangkasan pengujian, delta pengujian yang diharapkan: -300 hingga -600.
   Hapus pengujian yang hanya memeriksa bentuk wrapper yang dihapus. Pertahankan pengujian perilaku untuk
   penolakan perintah, fallback grup, pencocokan origin-subject, activation skip,
   grup akses, pairing, dan redaction.

Bentuk minimum yang diharapkan saat landing setelah gelombang ini:

```text
plugin production     <= -1,500
core production       about +1,800 to +2,200 before final repack
tests                 <= +500
total                 <= +2,000
```

## Jangan Pindahkan

Jangan pindahkan default konfigurasi platform, UX penyiapan, teks doctor/fix, pencarian API,
pemeriksaan keberadaan pemilik Slack, penanganan alias/verifikasi Matrix, penguraian
panggilan balik Telegram, penguraian sintaks perintah, pendaftaran perintah native, penguraian
muatan reaksi, balasan pemasangan, balasan perintah, pengakuan, pengetikan, media, riwayat,
atau log.

## Verifikasi

Loop lokal tertarget:

```sh
pnpm lint:extensions:no-deprecated-channel-access
pnpm test src/channels/message-access/message-access.test.ts src/plugin-sdk/channel-ingress-runtime.test.ts src/plugin-sdk/access-groups.test.ts
pnpm test extensions/<changed-plugin>/src/...
pnpm plugin-sdk:api:check
pnpm config:docs:check
pnpm check:docs
git diff --check
```

Gunakan Testbox untuk bukti gerbang perubahan luas/rangkaian pengujian lengkap setelah tren LOC
berada dalam anggaran.

Setiap paket kerja mencatat:

- LOC sebelum/sesudah menurut kategori
- pembungkus plugin yang dihapus
- LOC pembantu core baru, jika ada
- pengujian tertarget yang dijalankan
- daftar hotspot yang tersisa

## Kriteria Keluar

- impor produksi bawaan tidak memiliki facade channel-access atau command-auth yang sudah tidak digunakan
- kode kompatibilitas diisolasi ke seam SDK/core
- plugin bawaan menggunakan proyeksi ingress atau hasil generik secara langsung
- LOC produksi plugin setidaknya negatif bersih 1.500 terhadap `origin/main`
- LOC produksi core <= +1.500, atau setiap kelebihan dibayar selagi total tetap
  <= +2.000
- pengujian representatif mencakup penyensoran, rute, perintah/peristiwa, aktivasi,
  grup akses, dan perilaku fallback khusus channel
