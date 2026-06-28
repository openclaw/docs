---
read_when:
    - Mengaudit alasan refaktor ingress saluran menambahkan terlalu banyak kode
    - Memindahkan kebijakan rute, perintah, peristiwa, aktivasi, atau grup akses dari Plugin terbundel ke inti
    - Meninjau apakah fungsi pembantu ingres saluran benar-benar menghapus kode Plugin yang dibundel
sidebarTitle: Ingress core deletion
summary: Rencana yang mengutamakan penghapusan untuk memindahkan kode perekat ingress saluran yang berulang ke inti.
title: Rencana penghapusan inti ingress
x-i18n:
    generated_at: "2026-05-12T00:59:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1fdf1e7c9636d02c48c4b5d2b4a51470317dd64e2270c7fae779777c0d787afc
    source_path: refactor/ingress-core.md
    workflow: 16
    postprocess_version: locale-links-v1
---

# Rencana penghapusan inti ingress

Refactor ingress tidak sehat selama masih menambahkan ribuan baris bersih. Sentralisasi inti
hanya dihitung ketika kode produksi plugin bawaan menjadi lebih kecil dan
kompatibilitas SDK pihak ketiga lama dikarantina ke shim SDK/inti.

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
`{ allowed, reasonCode }` kecuali tipe tersebut adalah API plugin publik.

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

Penghapusan khusus komentar tidak dihitung sebagai pembersihan. Lintasan anggaran sebelumnya
terlalu longgar karena menyertakan kembali komentar penjelasan QQBot; dokumen ini
hanya melacak perpindahan kode executable/docs/test.

Ukur ulang setelah setiap gelombang pembersihan:

```sh
base=$(git merge-base HEAD origin/main)
git diff --shortstat "$base"
git diff --numstat "$base" -- src/channels/message-access src/plugin-sdk extensions | sort -nr -k1 | head -n 80
pnpm lint:extensions:no-deprecated-channel-access
```

## Diagnosis

Lintasan pertama menambahkan kernel ingress bersama, lalu meninggalkan terlalu banyak
otorisasi lokal plugin di sampingnya:

```text
platform facts
  -> shared ingress state and decision
  -> plugin-local DTO or legacy projection
  -> plugin-local if/else ladder
```

Itu menggandakan model. Produksi inti bertambah sekitar 3.376 baris, sementara
produksi plugin bawaan berkurang 1.240 baris. Itu lebih baik daripada lintasan pertama,
tetapi belum masuk anggaran minimum. Perbaikannya tetap mengutamakan penghapusan:

- hapus DTO plugin yang hanya mengganti nama field ingress
- hapus pengujian yang hanya menegaskan bentuk wrapper
- tambahkan helper inti hanya ketika patch yang sama menghapus kode plugin bawaan
- pertahankan kompatibilitas SDK lama hanya di shim SDK/inti
- kemas ulang inti setelah penghapusan wrapper mengekspos bentuk stabil

## Titik Panas

File produksi bawaan positif yang masih perlu menyusut:

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

Branch belum masuk anggaran minimum. Pekerjaan tersisa yang relevan untuk review
harus menghapus alur otorisasi berulang, scaffolding giliran, atau pengujian
wrapper sebelum menambahkan abstraksi inti lain.

## Pembacaan Kode Saat Ini

Seam inti yang sehat sudah ada di `src/channels/message-access/runtime.ts`:
ia memiliki adapter identitas, allowlist efektif, pembacaan pairing-store,
deskriptor route, preset command/event, grup akses, dan proyeksi akhir
`ResolvedChannelMessageIngress` yang sudah diselesaikan.

Pertumbuhan yang tersisa sebagian besar adalah glue plugin yang dilapiskan di atas seam tersebut:

- `extensions/telegram/src/ingress.ts` membungkus keputusan inti dalam helper
  command/event khusus Telegram, lalu call site masih meneruskan allowlist
  ternormalisasi dan daftar owner yang sudah dihitung sebelumnya.
- `extensions/discord/src/monitor/dm-command-auth.ts`,
  `extensions/feishu/src/policy.ts`, `extensions/googlechat/src/monitor-access.ts`,
  dan `extensions/matrix/src/matrix/monitor/access-state.ts` masih menyimpan
  DTO kebijakan lokal atau nama keputusan legacy di samping ingress.
- `extensions/signal/src/monitor/access-policy.ts` sudah benar mempertahankan
  normalisasi identitas Signal dan balasan pairing secara lokal, tetapi masih
  memiliki seam wrapper yang harus runtuh menjadi konsumsi ingress langsung.
- `extensions/nextcloud-talk/src/inbound.ts`, `extensions/irc/src/inbound.ts`,
  `extensions/qa-channel/src/inbound.ts`, `extensions/zalo/src/monitor.ts`, dan
  `extensions/zalouser/src/monitor.ts` masih mengulang penyusunan route/envelope/turn
  yang dapat dipindahkan ke helper turn bersama di luar kernel ingress.

Kesimpulan: memindahkan lebih banyak kode ke inti hanya berguna jika hal itu
menghapus lapisan wrapper plugin ini dalam patch yang sama. Menambahkan abstraksi lain
sambil membiarkan return wrapper tetap ada mengulang kesalahan yang sama.

## Batas

Inti memiliki kebijakan generik:

- normalisasi dan pencocokan allowlist
- ekspansi grup akses dan diagnostik
- pembacaan allowlist DM pairing-store
- gate route, sender, command, event, dan activation
- pemetaan admission: dispatch, drop, skip, observe, pairing
- state yang direduksi, keputusan, diagnostik, dan proyeksi kompatibilitas SDK
- deskriptor generik yang dapat digunakan ulang untuk identitas, route, command, event, activation,
  dan outcome

Plugin memiliki fakta transport dan efek samping:

- keaslian webhook/socket/request
- ekstraksi identitas platform dan lookup API
- default kebijakan khusus channel
- pengiriman tantangan pairing, balasan, ack, reaction, typing, media, history,
  setup, doctor, status, log, dan salinan yang terlihat pengguna

Inti harus tetap agnostik terhadap channel: tidak ada Discord, Slack, Telegram, Matrix, room,
guild, space, client API, atau default khusus plugin di
`src/channels/message-access`.

## Aturan Penerimaan

Setiap helper inti baru harus langsung menghapus kode produksi plugin bawaan.

```text
one bundled caller        reject; keep plugin-local
two bundled callers       accept only if plugin production LOC drops
three or more callers     plugin deletion must be at least 2x new core LOC
compatibility-only helper SDK/core shim only; never bundled hot paths
```

Berhenti dan rancang ulang jika:

- LOC produksi plugin meningkat
- pengujian bertambah lebih cepat daripada penyusutan produksi
- hot path bawaan mengembalikan DTO yang hanya mengganti nama `ResolvedChannelMessageIngress`
- helper inti membutuhkan id channel, objek platform, client API, atau
  default khusus channel

## Paket Kerja

1. Bekukan anggaran.
   Masukkan LOC ke PR, pastikan lint deprecated-ingress tetap hijau, dan sertakan LOC
   sebelum/sesudah dalam commit pembersihan.

2. Hapus seam DTO tipis.
   Ganti return wrapper lokal plugin dengan `ResolvedChannelMessageIngress`,
   `senderAccess`, `commandAccess`, `routeAccess`, atau `ingress` secara langsung. Mulai
   dengan QQBot, Telegram, Slack, Discord, Signal, Feishu, Matrix, iMessage, dan
   Tlon. Hapus pengujian bentuk wrapper; pertahankan pengujian perilaku.

3. Tambahkan klasifikasi outcome hanya bersama penghapusan.
   Classifier generik dapat mengekspos `dispatch`, `pairing-required`,
   `skip-activation`, `drop-command`, `drop-route`, `drop-sender`, dan
   `drop-ingress`. Ia harus diturunkan dari graph keputusan, bukan string alasan,
   dan memigrasikan setidaknya tiga plugin dalam patch yang sama.

4. Tambahkan builder deskriptor route hanya bersama penghapusan.
   Helper target route generik dan sender route dapat diterima hanya jika langsung
   menyusutkan plugin yang berat di route: Google Chat, IRC, Microsoft Teams,
   Nextcloud Talk, Mattermost, Slack, Zalo, dan Zalo Personal.

5. Tambahkan preset command/event hanya bersama penghapusan.
   Sentralisasikan bentuk text-command, native-command, callback, dan origin-subject.
   Konsumen command harus default ke tidak terotorisasi ketika tidak ada gate command yang berjalan;
   event tidak boleh memulai pairing.

6. Tambahkan preset identitas hanya ketika menghapus boilerplate.
   Helper stable-id, stable-id-plus-aliases, phone/e164, dan multi-identifier
   diperbolehkan ketika nilai mentah hanya masuk input adapter dan state yang direduksi mempertahankan
   id/jumlah buram.

7. Bagikan penyusunan turn terotorisasi.
   Di luar kernel ingress, hapus scaffolding route/envelope/context/reply
   yang berulang dari QA Channel, IRC, Nextcloud Talk, Zalo, dan Zalo Personal.
   Inti dapat memiliki sequencing route/session/envelope/dispatch; plugin mempertahankan
   delivery dan konteks khusus channel.

8. Karantina kompatibilitas.
   Helper SDK yang deprecated tetap kompatibel secara source, tetapi hot path bawaan tidak boleh
   mengimpor ingress deprecated atau facade command-auth. Pengujian kompatibilitas harus
   menggunakan plugin pihak ketiga palsu, bukan internal plugin bawaan.

9. Kemas ulang inti.
   Setelah plugin mengonsumsi proyeksi runtime secara langsung, runtuhkan modul sekali pakai, hapus
   ekspor yang tidak digunakan, pindahkan proyeksi kompatibilitas keluar dari hot path, dan pertahankan
   pengujian terfokus untuk identitas, route, command/event, activation, grup akses, dan shim kompatibilitas.

## Gelombang Penghapusan

Jalankan ini berurutan. Setiap gelombang harus menurunkan LOC produksi bawaan.

1. Runtuhkan wrapper, delta plugin yang diharapkan: -400 hingga -600.
   Ganti tipe hasil `resolveXAccess`, `resolveXCommandAccess`, dan
   `accessFromIngress` lokal plugin dengan pembacaan langsung dari
   `ResolvedChannelMessageIngress`. Target pertama: auth command DM Discord,
   kebijakan Feishu, state akses Matrix, ingress Telegram, kebijakan akses Signal,
   adapter SDK QQBot.

2. Helper outcome bersama, delta plugin yang diharapkan: -200 hingga -350.
   Tambahkan satu classifier generik hanya jika ia menghapus ladder berulang
   `shouldBlockControlCommand`, pairing, activation skip, route block, dan sender
   block di setidaknya tiga plugin.

3. Builder deskriptor route, delta plugin yang diharapkan: -200 hingga -350.
   Pindahkan penyusunan deskriptor target route dan sender route yang berulang ke helper
   inti. Target pertama: Google Chat, IRC, Microsoft Teams, Nextcloud Talk,
   Mattermost, Slack, Zalo, Zalo Personal.

4. Berbagi penyusunan turn, delta plugin yang diharapkan: -250 hingga -450.
   Gunakan sequencing route/session/envelope/dispatch umum untuk plugin inbound
   sederhana. Target pertama: QA Channel, IRC, Nextcloud Talk, Zalo, Zalo Personal.

5. Kemas ulang inti, delta inti yang diharapkan: -300 hingga -700.
   Setelah plugin mengonsumsi proyeksi runtime secara langsung, hapus modul sekali pakai,
   gabungkan file kecil kembali ke `runtime.ts` atau sibling terfokus, dan jaga agar file
   kompatibilitas SDK tetap terpisah dari hot path bawaan.

6. Pemangkasan pengujian, delta pengujian yang diharapkan: -300 hingga -600.
   Hapus pengujian yang hanya menegaskan bentuk wrapper yang dihapus. Pertahankan pengujian perilaku untuk
   penolakan command, fallback grup, pencocokan origin-subject, activation skip,
   grup akses, pairing, dan reduksi.

Bentuk landing minimum yang diharapkan setelah gelombang ini:

```text
plugin production     <= -1,500
core production       about +1,800 to +2,200 before final repack
tests                 <= +500
total                 <= +2,000
```

## Jangan Pindahkan

Jangan pindahkan default konfigurasi platform, UX penyiapan, teks doctor/fix, pencarian API,
pemeriksaan keberadaan owner Slack, penanganan alias/verifikasi Matrix, parsing callback
Telegram, parsing sintaks perintah, pendaftaran perintah native, parsing payload reaksi,
balasan pairing, balasan perintah, ack, pengetikan, media, riwayat,
atau log.

## Verifikasi

Loop lokal terarah:

```sh
pnpm lint:extensions:no-deprecated-channel-access
pnpm test src/channels/message-access/message-access.test.ts src/plugin-sdk/channel-ingress-runtime.test.ts src/plugin-sdk/access-groups.test.ts
pnpm test extensions/<changed-plugin>/src/...
pnpm plugin-sdk:api:check
pnpm config:docs:check
pnpm check:docs
git diff --check
```

Gunakan Testbox untuk bukti gate perubahan luas/suite penuh setelah tren LOC
berada dalam anggaran.

Setiap paket kerja mencatat:

- LOC sebelum/sesudah berdasarkan kategori
- wrapper Plugin yang dihapus
- LOC helper inti baru, jika ada
- pengujian terarah yang dijalankan
- daftar hotspot yang tersisa

## Kriteria Keluar

- impor produksi bawaan tidak memiliki facade channel-access atau command-auth yang usang
- kode kompatibilitas diisolasi ke seam SDK/core
- Plugin bawaan mengonsumsi proyeksi ingress atau outcome generik secara langsung
- LOC produksi Plugin setidaknya negatif bersih 1.500 dibandingkan `origin/main`
- LOC produksi inti adalah `<= +1,500`, atau setiap kelebihan dibayar sementara total
  tetap `<= +2,000`
- pengujian representatif mencakup redaksi, rute, perintah/event, aktivasi,
  access-group, dan perilaku fallback khusus channel
