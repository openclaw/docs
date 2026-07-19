---
read_when:
    - Menambahkan fitur yang memperluas akses atau otomatisasi
summary: Pertimbangan keamanan dan model ancaman untuk menjalankan Gateway AI dengan akses shell
title: Keamanan
x-i18n:
    generated_at: "2026-07-19T04:58:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: eba4a7196aaf1be0d9e94011f76cb802568686d4af69e24467b87edc472b2738
    source_path: gateway/security/index.md
    workflow: 16
---

<Warning>
  **Model kepercayaan asisten pribadi.** Panduan ini mengasumsikan satu batas
  operator tepercaya per gateway (model pengguna tunggal, asisten pribadi).
  OpenClaw **bukan** batas keamanan multi-tenant yang rentan terhadap serangan untuk beberapa
  pengguna adversarial yang berbagi satu agen atau gateway. Untuk operasi dengan kepercayaan campuran atau
  pengguna adversarial, pisahkan batas kepercayaan: gateway +
  kredensial terpisah, idealnya pengguna OS atau host terpisah.
</Warning>

## Cakupan: model keamanan asisten pribadi

- Didukung: satu batas pengguna/kepercayaan per gateway (utamakan satu pengguna OS/host/VPS per batas).
- Tidak didukung: satu gateway/agen bersama yang digunakan oleh pengguna yang saling tidak percaya atau adversarial.
- Isolasi pengguna adversarial memerlukan gateway terpisah (dan idealnya pengguna OS/host terpisah).
- Jika beberapa pengguna yang tidak tepercaya dapat mengirim pesan ke satu agen berkemampuan alat, mereka berbagi kewenangan alat yang didelegasikan kepada agen tersebut.
- Jika seseorang dapat mengubah status/konfigurasi host Gateway (`~/.openclaw`, termasuk `openclaw.json`), perlakukan mereka sebagai operator tepercaya.
- Di dalam satu Gateway, akses operator terautentikasi merupakan peran bidang kontrol tepercaya, bukan peran tenant per pengguna.
- `sessionKey` (ID sesi, label) adalah pemilih perutean, bukan token otorisasi.

Meng-host beberapa pengguna atau organisasi? Jalankan satu sel Gateway terisolasi per tenant alih-alih berbagi Gateway. Lihat [Hosting multi-tenant](/id/gateway/multi-tenant-hosting).

Sebelum mengubah akses jarak jauh, kebijakan DM, proksi terbalik, atau paparan publik, ikuti [runbook paparan Gateway](/id/gateway/security/exposure-runbook) sebagai daftar periksa pra-penerapan/pemulihan.

## `openclaw security audit`

Jalankan ini setelah setiap perubahan konfigurasi atau sebelum mengekspos permukaan jaringan:

```bash
openclaw security audit
openclaw security audit --deep    # mencoba pemeriksaan Gateway langsung
openclaw security audit --fix     # menerapkan remediasi yang aman
openclaw security audit --json
```

`--fix` sengaja dibatasi cakupannya: mengubah kebijakan grup terbuka menjadi daftar yang diizinkan, memulihkan `logging.redactSensitive: "tools"`, memperketat izin status/konfigurasi/berkas penyertaan (berkas `600`, direktori `700`), dan pada Windows menggunakan pengaturan ulang ACL sebagai pengganti `chmod` POSIX.

### Yang diperiksa audit (gambaran umum)

- **Akses masuk** - kebijakan DM/grup, daftar yang diizinkan: dapatkah orang asing memicu bot?
- **Radius dampak alat** - alat dengan hak istimewa + ruang terbuka: dapatkah injeksi prompt menjadi tindakan shell/berkas/jaringan?
- **Penyimpangan sistem berkas exec** - alat sistem berkas yang mengubah data ditolak sementara `exec`/`process` tetap tersedia tanpa batasan sandbox.
- **Penyimpangan persetujuan exec** - `security="full"`, `autoAllowSkills`, daftar interpreter yang diizinkan tanpa `strictInlineEval`. `security="full"` saja merupakan peringatan postur yang luas, bukan bukti bug - ini adalah default yang dipilih untuk pengaturan asisten pribadi tepercaya; perketat hanya jika model ancaman Anda memerlukan pagar pengaman persetujuan atau daftar yang diizinkan.
- **Paparan jaringan** - bind/autentikasi Gateway, Tailscale Serve/Funnel, token autentikasi yang lemah/pendek.
- **Paparan kontrol peramban** - node jarak jauh, port relay, endpoint CDP jarak jauh.
- **Kebersihan disk lokal** - izin, symlink, penyertaan konfigurasi, jalur folder tersinkronisasi.
- **Plugin** - pemuatan tanpa daftar yang diizinkan secara eksplisit.
- **Penyimpangan kebijakan** - pengaturan Docker sandbox dikonfigurasi tetapi mode sandbox nonaktif; entri `gateway.nodes.denyCommands` yang tampak efektif tetapi hanya cocok dengan ID perintah persis (misalnya `system.run`), bukan teks shell di dalam payload; entri `gateway.nodes.allowCommands` yang berbahaya; `tools.profile="minimal"` global ditimpa per agen; alat milik plugin dapat diakses berdasarkan kebijakan yang permisif.
- **Penyimpangan ekspektasi runtime** - mengasumsikan exec implisit masih berarti `sandbox` ketika `tools.exec.host` sekarang secara default menggunakan `auto`, atau mengatur `tools.exec.host="sandbox"` saat mode sandbox nonaktif.
- **Kebersihan model** - memperingatkan tentang model lama yang dikonfigurasi (peringatan ringan, bukan pemblokiran keras).

Setiap temuan memiliki `checkId` terstruktur (misalnya `gateway.bind_no_auth`, `tools.exec.security_full_configured`). Prefiks: `fs.*` (izin), `gateway.*` (bind/autentikasi/Tailscale/Control UI/proksi tepercaya), `hooks.*`/`browser.*`/`sandbox.*`/`tools.exec.*` (penguatan per permukaan), `plugins.*`/`skills.*` (rantai pasokan), `security.exposure.*` (kebijakan akses x radius dampak alat). Katalog lengkap dengan tingkat keparahan dan dukungan perbaikan otomatis: [Pemeriksaan audit keamanan](/id/gateway/security/audit-checks). Lihat juga [Verifikasi Formal](/id/security/formal-verification).

### Urutan prioritas saat melakukan triase temuan

1. Apa pun yang "terbuka" + alat diaktifkan: batasi DM/grup terlebih dahulu (pemasangan/daftar yang diizinkan), lalu perketat kebijakan alat/sandbox.
2. Paparan jaringan publik (bind LAN, Funnel, autentikasi tidak ada): segera perbaiki.
3. Paparan jarak jauh kontrol peramban: perlakukan seperti akses operator (khusus tailnet, pasangkan node secara disengaja, tanpa paparan publik).
4. Izin: status/konfigurasi/kredensial/autentikasi tidak boleh dapat dibaca oleh grup/semua pengguna.
5. Plugin: muat hanya yang Anda percayai secara eksplisit.
6. Pilihan model: utamakan model modern yang diperkuat terhadap instruksi untuk setiap bot dengan alat.

## Baseline yang diperkuat dalam 60 detik

```json5
{
  gateway: {
    mode: "local",
    bind: "loopback",
    auth: { mode: "token", token: "replace-with-long-random-token" },
  },
  session: {
    dmScope: "per-channel-peer",
  },
  tools: {
    profile: "messaging",
    deny: ["group:automation", "group:runtime", "group:fs", "sessions_spawn", "sessions_send"],
    fs: { workspaceOnly: true },
    exec: { security: "deny", ask: "always" },
    elevated: { enabled: false },
  },
  channels: {
    whatsapp: { dmPolicy: "pairing", groups: { "*": { requireMention: true } } },
  },
}
```

Menjaga Gateway hanya dapat diakses secara lokal, mengisolasi DM, dan menonaktifkan alat bidang kontrol/runtime secara default. Setelah itu, aktifkan kembali alat secara selektif untuk setiap agen tepercaya.

Baseline bawaan untuk giliran agen berbasis obrolan: pengirim yang bukan pemilik tidak dapat menggunakan alat `cron` atau `gateway` terlepas dari konfigurasi.

## Matriks batas kepercayaan

Model ringkas untuk melakukan triase laporan risiko:

| Batas atau kontrol                                       | Artinya                                     | Kesalahpahaman umum                                                                |
| --------------------------------------------------------- | ------------------------------------------------- | ----------------------------------------------------------------------------- |
| `gateway.auth` (token/kata sandi/proksi tepercaya/autentikasi perangkat) | Mengautentikasi pemanggil ke API gateway             | "Agar aman, setiap frame memerlukan tanda tangan per pesan"                    |
| `sessionKey`                                              | Kunci perutean untuk pemilihan konteks/sesi         | "Kunci sesi adalah batas autentikasi pengguna"                                         |
| Pagar pengaman prompt/konten                                 | Mengurangi risiko penyalahgunaan model                           | "Injeksi prompt saja membuktikan adanya bypass autentikasi"                                   |
| `canvas.eval` / evaluasi peramban                          | Kemampuan operator yang disengaja saat diaktifkan      | "Setiap primitif evaluasi JS secara otomatis merupakan kerentanan dalam model kepercayaan ini"           |
| Shell `!` TUI lokal                                       | Eksekusi lokal yang dipicu operator secara eksplisit       | "Perintah praktis shell lokal adalah injeksi jarak jauh"                         |
| Pemasangan node dan perintah node                            | Eksekusi jarak jauh tingkat operator pada perangkat yang dipasangkan | "Kontrol perangkat jarak jauh secara default harus diperlakukan sebagai akses pengguna yang tidak tepercaya" |
| `gateway.nodes.pairing.autoApproveCidrs`                  | Kebijakan pendaftaran node jaringan tepercaya yang memerlukan keikutsertaan     | "Daftar yang diizinkan dan dinonaktifkan secara default secara otomatis merupakan kerentanan pemasangan"       |
| `gateway.nodes.pairing.sshVerify`                         | Pendaftaran node yang diverifikasi dengan kunci melalui SSH operator    | "Persetujuan otomatis yang aktif secara default secara otomatis merupakan kerentanan pemasangan"              |

## Bukan kerentanan berdasarkan desain

<Accordion title="Temuan umum yang ditutup tanpa tindakan">

- Rantai yang hanya berupa injeksi prompt tanpa bypass kebijakan, autentikasi, atau sandbox.
- Klaim yang mengasumsikan operasi multi-tenant yang rentan terhadap serangan pada satu host atau konfigurasi bersama.
- Akses jalur baca operator normal (misalnya `sessions.list` / `sessions.preview` / `chat.history`) yang diklasifikasikan sebagai IDOR dalam pengaturan gateway bersama.
- Temuan penerapan khusus localhost (misalnya HSTS yang tidak ada pada gateway khusus loopback).
- Temuan tanda tangan Webhook masuk Discord untuk jalur masuk yang tidak ada dalam repo ini.
- Metadata pemasangan node yang diperlakukan sebagai lapisan persetujuan kedua per perintah yang tersembunyi untuk `system.run`; batas eksekusi sebenarnya adalah kebijakan perintah node global gateway ditambah persetujuan exec milik node.
- `gateway.nodes.pairing.sshVerify` diperlakukan sebagai kerentanan karena diaktifkan secara default. Fitur ini tidak pernah menyetujui hanya berdasarkan kedekatan jaringan atau keterjangkauan SSH: gateway membaca kembali identitas perangkat melalui SSH (BatchMode, kunci host ketat) dan hanya menyetujui jika kunci perangkat sama persis dengan permintaan yang tertunda, yang mengharuskan pasangan kunci penghubung sudah berada di bawah akun operator pada host yang dikendalikan operator. Pemeriksaan dibatasi pada alamat sumber privat/CGNAT, menggunakan batas kelayakan CIDR tepercaya yang sama (hanya `role: node` baru tanpa cakupan), dan `sshVerify: false` menonaktifkan fitur tersebut.
- `gateway.nodes.pairing.autoApproveCidrs` diperlakukan sebagai kerentanan dengan sendirinya. Fitur ini dinonaktifkan secara default, memerlukan entri CIDR/IP eksplisit, hanya berlaku untuk pemasangan `role: node` pertama kali tanpa cakupan yang diminta, dan tidak pernah menyetujui secara otomatis operator/peramban/Control UI, WebChat, peningkatan peran/cakupan, perubahan metadata atau kunci publik, maupun jalur header proksi tepercaya loopback pada host yang sama (bahkan ketika autentikasi proksi tepercaya loopback diaktifkan).
- Temuan "otorisasi per pengguna tidak ada" yang memperlakukan `sessionKey` sebagai token autentikasi.

</Accordion>

## Kepercayaan Gateway dan node

Perlakukan Gateway dan node sebagai satu domain kepercayaan operator dengan peran berbeda:

- **Gateway**: bidang kontrol dan permukaan kebijakan (`gateway.auth`, kebijakan alat, perutean).
- **Node**: permukaan eksekusi jarak jauh yang dipasangkan dengan Gateway tersebut (perintah, tindakan perangkat, kemampuan lokal host).
- Pemanggil yang diautentikasi ke Gateway dipercaya dalam cakupan Gateway; setelah pemasangan, tindakan node merupakan tindakan operator tepercaya pada node tersebut. Lihat [Cakupan operator](/id/gateway/operator-scopes).
- Klien backend loopback langsung yang diautentikasi dengan token/kata sandi gateway bersama dapat melakukan RPC bidang kontrol internal tanpa memberikan identitas perangkat pengguna. Ini bukan bypass pemasangan jarak jauh atau peramban - klien jaringan, klien node, klien token perangkat, dan identitas perangkat eksplisit tetap melalui penerapan pemasangan dan peningkatan cakupan.
- Persetujuan exec (daftar yang diizinkan + tanyakan) adalah pagar pengaman untuk maksud operator, bukan isolasi multi-tenant yang rentan terhadap serangan. Persetujuan ini mengikat konteks permintaan secara persis dan operand berkas lokal langsung dengan upaya terbaik; persetujuan ini tidak memodelkan secara semantis setiap jalur pemuat runtime/interpreter. Gunakan sandbox dan isolasi host untuk batas yang kuat.
- Default operator tunggal tepercaya: exec host pada `gateway`/`node` diizinkan tanpa prompt persetujuan (`security="full"`, `ask="off"`). Ini adalah UX yang disengaja, bukan kerentanan dengan sendirinya.

Untuk isolasi pengguna yang rentan terhadap serangan, pisahkan batas kepercayaan berdasarkan pengguna OS/host dan jalankan gateway terpisah.

## Model ancaman

Asisten AI Anda dapat menjalankan perintah shell arbitrer, membaca/menulis file, mengakses layanan jaringan, dan mengirim pesan kepada siapa pun (jika diberi akses kanal). Orang yang mengirim pesan kepadanya dapat mencoba mengelabuinya agar melakukan hal-hal buruk, merekayasa secara sosial akses ke data Anda, atau menyelidiki detail infrastruktur.

Sebagian besar kegagalan di sini bukanlah eksploitasi eksotis—melainkan "seseorang mengirim pesan kepada bot dan bot melakukan apa yang diminta." Sikap OpenClaw, secara berurutan:

1. **Identitas terlebih dahulu**—tentukan siapa yang dapat berbicara dengan bot (pemasangan DM/daftar izin/"terbuka" secara eksplisit).
2. **Cakupan berikutnya**—tentukan tempat bot dapat bertindak (daftar izin grup + pembatasan penyebutan, alat, sandboxing, izin perangkat).
3. **Model terakhir**—anggap model dapat dimanipulasi; rancang agar manipulasi memiliki radius dampak terbatas.

## Akses DM: pemasangan, daftar izin, terbuka, dinonaktifkan

Setiap kanal yang mendukung DM memiliki `dmPolicy` (atau `*.dm.policy`), yang membatasi DM masuk sebelum pesan diproses:

| Kebijakan      | Perilaku                                                                                                                                                                                                             |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pairing`   | Default. Pengirim yang tidak dikenal menerima kode pemasangan; bot mengabaikan mereka hingga disetujui. Kode kedaluwarsa setelah 1 jam; DM berulang tidak mengirim ulang kode hingga permintaan baru dibuat. Permintaan tertunda dibatasi hingga 3 per kanal. |
| `allowlist` | Pengirim yang tidak dikenal diblokir, tanpa proses pemasangan.                                                                                                                                                                       |
| `open`      | Siapa pun dapat mengirim DM (publik). Mengharuskan daftar izin kanal menyertakan `"*"` (keikutsertaan eksplisit).                                                                                                                           |
| `disabled`  | DM masuk diabaikan sepenuhnya.                                                                                                                                                                                        |

```bash
openclaw pairing list <channel>
openclaw pairing approve <channel> <code>
```

Detail + file di disk: [Pemasangan](/id/channels/pairing)

Perlakukan `dmPolicy="open"` dan `groupPolicy="open"` sebagai pengaturan pilihan terakhir; utamakan pemasangan + daftar izin kecuali Anda sepenuhnya memercayai setiap anggota ruang.

### Daftar izin (dua lapisan)

- **Daftar izin DM** (`allowFrom` / `channels.discord.allowFrom` / `channels.slack.allowFrom`; lama: `channels.discord.dm.allowFrom`, `channels.slack.dm.allowFrom`): siapa yang dapat mengirim DM kepada bot. Saat `dmPolicy="pairing"`, persetujuan ditulis ke `~/.openclaw/credentials/<channel>-allowFrom.json` (akun default) atau `<channel>-<accountId>-allowFrom.json` (akun non-default), lalu digabungkan dengan daftar izin konfigurasi.
- **Daftar izin grup** (khusus kanal): grup/kanal/guild mana yang diterima bot.
  - `channels.whatsapp.groups`, `channels.telegram.groups`, `channels.imessage.groups`: default per grup seperti `requireMention`; saat ditetapkan, juga berfungsi sebagai daftar izin grup (sertakan `"*"` untuk mempertahankan perilaku izinkan-semua). Sesuaikan pemicu penyebutan dengan `agents.list[].groupChat.mentionPatterns` (misalnya `["@openclaw", "@mybot"]`) agar `requireMention` melakukan pembatasan berdasarkan nama bot Anda sendiri.
  - `groupPolicy="allowlist"` + `groupAllowFrom`: batasi siapa yang dapat memicu bot di dalam sesi grup (WhatsApp/Telegram/Signal/iMessage/Microsoft Teams).
  - `channels.discord.guilds` / `channels.slack.channels`: daftar izin per permukaan + default penyebutan.
  - Urutan pemeriksaan: `groupPolicy`/daftar izin grup terlebih dahulu, lalu aktivasi penyebutan/balasan. Membalas pesan bot (penyebutan implisit) **tidak** melewati `groupAllowFrom`.

Detail: [Konfigurasi](/id/gateway/configuration) dan [Grup](/id/channels/groups)

### Isolasi sesi DM (mode multipengguna)

Secara default, OpenClaw merutekan semua DM ke sesi utama untuk kesinambungan lintas perangkat. Jika beberapa orang dapat mengirim DM kepada bot (DM terbuka atau daftar izin multipengguna), isolasikan sesi DM:

```json5
{ session: { dmScope: "per-channel-peer" } }
```

Nilai `session.dmScope`:

| Nilai                      | Cakupan                                                                  |
| -------------------------- | ---------------------------------------------------------------------- |
| `main` (default konfigurasi)    | Semua DM berbagi satu sesi.                                             |
| `per-channel-peer`         | Setiap pasangan kanal+pengirim mendapatkan konteks DM yang terisolasi (mode DM aman). |
| `per-account-channel-peer` | Seperti di atas, tetapi dipisahkan lebih lanjut berdasarkan akun (kanal multiakun).         |
| `per-peer`                 | Setiap pengirim mendapatkan satu sesi di seluruh kanal dengan jenis yang sama.     |

Orientasi CLI lokal mempertahankan `session.dmScope` yang ditetapkan secara eksplisit dan jika tidak, membiarkannya tidak ditetapkan sehingga default `"main"` berlaku: semua pesan langsung lintas kanal berbagi sesi utama bergulir milik agen (default agen pribadi). Untuk kotak masuk bersama atau multipengguna, tetapkan `session.dmScope: "per-channel-peer"`; `openclaw security audit` merekomendasikan isolasi saat mendeteksi lalu lintas DM multipengguna.

Ini adalah batas konteks perpesanan, bukan batas administrator host. Jika para pengguna saling bermusuhan dan berbagi host/konfigurasi Gateway yang sama, jalankan gateway terpisah untuk setiap batas kepercayaan.

Jika orang yang sama menghubungi Anda melalui beberapa kanal, gunakan `session.identityLinks` untuk menggabungkan sesi-sesi DM tersebut menjadi satu identitas kanonis. Lihat [Manajemen Sesi](/id/concepts/session) dan [Konfigurasi](/id/gateway/configuration).

## Visibilitas konteks versus otorisasi pemicu

Dua konsep terpisah:

- **Otorisasi pemicu**: siapa yang dapat memicu agen (`dmPolicy`, `groupPolicy`, daftar izin, pembatas penyebutan).
- **Visibilitas konteks**: konteks tambahan apa yang mencapai model (isi balasan, teks kutipan, riwayat utas, metadata penerusan).

`contextVisibility` mengontrol konsep kedua:

- `"all"` (default): konteks tambahan dipertahankan sebagaimana diterima.
- `"allowlist"`: konteks tambahan difilter agar hanya berasal dari pengirim yang diizinkan oleh pemeriksaan daftar izin aktif.
- `"allowlist_quote"`: seperti `allowlist`, tetapi tetap mempertahankan satu balasan kutipan eksplisit.

Tetapkan per kanal atau per ruang/percakapan—lihat [Grup](/id/channels/groups#context-visibility-and-allowlists). Laporan yang hanya menunjukkan "model dapat melihat teks kutipan/riwayat dari pengirim yang tidak tercantum dalam daftar izin" merupakan temuan penguatan keamanan yang dapat ditangani dengan `contextVisibility`, bukan penerobosan autentikasi atau sandbox secara tersendiri; laporan yang berdampak pada keamanan tetap memerlukan demonstrasi penerobosan batas kepercayaan.

## Injeksi prompt

Penyerang menyusun pesan yang memanipulasi model agar melakukan tindakan tidak aman ("abaikan instruksi Anda", "tampilkan seluruh sistem file Anda", "ikuti tautan ini dan jalankan perintah"). Injeksi prompt **tidak dapat diatasi** hanya dengan pagar pengaman prompt sistem—itu merupakan panduan lunak; penegakan keras berasal dari kebijakan alat, persetujuan eksekusi, sandboxing, dan daftar izin kanal (yang tetap dapat dinonaktifkan oleh operator sesuai rancangan).

Injeksi prompt tidak memerlukan DM publik: meskipun hanya Anda yang dapat mengirim pesan kepada bot, setiap **konten tidak tepercaya** yang dibacanya (hasil pencarian/pengambilan web, halaman browser, email, dokumen, lampiran, log/kode yang ditempelkan) dapat membawa instruksi berbahaya. Konten itu sendiri merupakan permukaan ancaman, bukan hanya pengirimnya.

Tanda bahaya yang harus dianggap tidak tepercaya:

- "Baca file/URL ini dan lakukan persis seperti yang tertulis."
- "Abaikan prompt sistem atau aturan keselamatan Anda."
- "Ungkapkan instruksi tersembunyi atau keluaran alat Anda."
- "Tempelkan seluruh isi ~/.openclaw atau log Anda."

Hal-hal yang membantu dalam praktik:

- Batasi DM masuk dengan ketat (pemasangan/daftar izin); utamakan pembatasan penyebutan dalam grup; hindari bot yang selalu aktif di ruang publik.
- Perlakukan tautan, lampiran, dan instruksi yang ditempelkan sebagai berbahaya secara default.
- Jalankan eksekusi alat sensitif dalam sandbox; jauhkan rahasia dari sistem file yang dapat dijangkau agen. Sandboxing bersifat opsional: jika mode sandbox nonaktif, `host=auto` implisit mengarah ke host gateway, sedangkan `host=sandbox` eksplisit tetap gagal secara tertutup (runtime sandbox tidak tersedia). Tetapkan `host=gateway` untuk membuat perilaku tersebut eksplisit dalam konfigurasi.
- Batasi alat berisiko tinggi (`exec`, `browser`, `web_fetch`, `web_search`) hanya untuk agen tepercaya atau daftar izin eksplisit.
- Jika Anda memasukkan interpreter ke daftar izin (`python`, `node`, `ruby`, `perl`, `php`, `lua`, `osascript`), aktifkan `tools.exec.strictInlineEval` agar bentuk evaluasi inline (`-c`, `-e`, dan sejenisnya) tetap memerlukan persetujuan eksplisit. Dalam mode daftar izin, setiap segmen heredoc (`<<`) selalu memerlukan persetujuan peninjau atau persetujuan eksplisit, terlepas dari pengutipan—perintah dalam daftar izin tidak dapat menggunakan isi heredoc untuk melewati review daftar izin.
- Kurangi radius dampak dengan menggunakan **agen pembaca** yang hanya-baca atau alatnya dinonaktifkan untuk merangkum konten tidak tepercaya, lalu teruskan ringkasannya kepada agen utama Anda.
- Untuk hook Gmail, sesi bawaan per pesan mengisolasi konteks percakapan, tetapi tidak menghapus izin alat atau ruang kerja agen target. Rutekan email tidak tepercaya ke agen pembaca khusus, terapkan [sandbox per agen dan pembatasan alat](/id/tools/multi-agent-sandbox-tools), serta batasi setiap penyerahan kepada agen utama dengan [`tools.agentToAgent`](/id/gateway/config-tools#toolsagenttoagent). Lihat [integrasi Gmail](/id/gateway/configuration-reference#gmail-integration).
- Biarkan `web_search` / `web_fetch` / `browser` nonaktif untuk agen yang mendukung alat kecuali diperlukan.
- Untuk masukan URL OpenResponses (`input_file` / `input_image`), tetapkan `gateway.http.endpoints.responses.files.urlAllowlist` / `images.urlAllowlist` yang ketat dan pertahankan `maxUrlParts` tetap rendah (daftar izin kosong dianggap tidak ditetapkan). Gunakan `files.allowUrl: false` / `images.allowUrl: false` untuk menonaktifkan pengambilan URL sepenuhnya.
- Jauhkan rahasia dari prompt; teruskan melalui lingkungan/konfigurasi pada host gateway sebagai gantinya.

**Pemilihan model itu penting.** Ketahanan terhadap injeksi prompt tidak seragam di seluruh tingkatan model—model yang lebih kecil/lebih murah lebih rentan terhadap penyalahgunaan alat dan pembajakan instruksi dalam prompt berbahaya.

<Warning>
Untuk agen yang mendukung alat atau agen yang membaca konten tidak tepercaya, risiko injeksi prompt pada model lama/lebih kecil sering kali terlalu tinggi. Jangan jalankan beban kerja tersebut pada tingkatan model yang lemah.
</Warning>

- Gunakan model generasi terbaru dengan tingkatan terbaik untuk setiap bot yang dapat menjalankan alat atau mengakses file/jaringan.
- Jangan gunakan tingkatan yang lebih lama/lemah/kecil untuk agen yang mendukung alat atau kotak masuk tidak tepercaya.
- Jika Anda harus menggunakan model yang lebih kecil, kurangi radius dampak: alat hanya-baca, sandboxing yang kuat, akses sistem file minimal, daftar izin ketat. Aktifkan sandboxing untuk semua sesi dan nonaktifkan `web_search`/`web_fetch`/`browser` kecuali masukan dikontrol secara ketat.
- Untuk asisten pribadi khusus obrolan dengan masukan tepercaya dan tanpa alat, model yang lebih kecil biasanya memadai.

### Konten eksternal dan pembungkusan masukan tidak tepercaya

OpenResponses `input_file` masih disisipkan sebagai konten eksternal yang tidak tepercaya meskipun Gateway mendekodenya secara lokal - blok tersebut membawa penanda batas `<<<EXTERNAL_UNTRUSTED_CONTENT ...>>>` beserta metadata `Source: External` (jalur ini tidak menyertakan banner `SECURITY NOTICE:` yang lebih panjang dan digunakan di tempat lain). Pembungkusan berbasis penanda yang sama berlaku ketika pemahaman media mengekstrak teks dari dokumen terlampir sebelum menambahkannya ke prompt media.

OpenClaw juga menghapus literal token khusus templat obrolan LLM yang umum dihosting mandiri (token peran/giliran Qwen/ChatML, Llama, Gemma, Mistral, Phi, GPT-OSS) dari konten eksternal dan metadata yang dibungkus sebelum mencapai model. Backend kompatibel OpenAI yang dihosting mandiri (vLLM, SGLang, TGI, LM Studio, tumpukan tokenizer Hugging Face khusus) terkadang men-tokenisasi string literal seperti `<|im_start|>` atau `<|start_header_id|>` sebagai token struktural templat obrolan di dalam konten pengguna; tanpa sanitasi ini, teks yang tidak tepercaya dalam halaman yang diambil, isi email, atau keluaran alat isi berkas dapat memalsukan batas peran `assistant`/`system` sintetis. Sanitasi dilakukan pada lapisan pembungkusan konten eksternal, sehingga diterapkan secara seragam di seluruh alat pengambilan/pembacaan dan konten kanal masuk. Penyedia yang dihosting (OpenAI, Anthropic) sudah menerapkan sanitasi sisi permintaan mereka sendiri; pertahankan pembungkusan konten eksternal tetap aktif dan utamakan pengaturan backend yang memisahkan/meng-escape token khusus jika tersedia.

Respons model keluar memiliki sanitizer terpisah yang menghapus `<tool_call>`, `<function_calls>`, `<system-reminder>`, `<previous_response>`, dan kerangka internal serupa yang bocor dari balasan yang terlihat oleh pengguna pada batas akhir pengiriman kanal.

Ini tidak menggantikan `dmPolicy`, daftar izin, persetujuan eksekusi, sandboxing, atau `contextVisibility` - ini menutup satu bypass khusus pada lapisan tokenizer.

### Flag bypass (biarkan nonaktif dalam produksi)

- `hooks.mappings[].allowUnsafeExternalContent`
- `hooks.gmail.allowUnsafeExternalContent`
- Bidang payload Cron `allowUnsafeExternalContent`

Aktifkan hanya untuk sementara guna debugging dengan cakupan yang sangat ketat; jika diaktifkan, isolasikan agen tersebut (sandbox + alat minimal + namespace sesi khusus).

Payload hook merupakan konten yang tidak tepercaya meskipun pengiriman berasal dari sistem yang Anda kendalikan (konten surat/dokumen/web dapat membawa injeksi prompt). Tingkat model yang lemah meningkatkan risiko ini - untuk otomatisasi berbasis hook, utamakan tingkat model modern yang kuat dan pertahankan kebijakan alat yang ketat (`tools.profile: "messaging"` atau lebih ketat), ditambah sandboxing jika memungkinkan.

### Penalaran dan keluaran panjang dalam grup

`/reasoning`, `/verbose`, dan `/trace` dapat mengekspos penalaran internal, keluaran alat, atau diagnostik plugin yang tidak ditujukan untuk kanal publik - hal tersebut dapat mencakup argumen alat, URL, diagnostik plugin, dan data yang dilihat model. Pertahankan agar tetap dinonaktifkan di ruang publik; aktifkan hanya dalam DM tepercaya atau ruang yang dikontrol secara ketat.

## Otorisasi perintah

Perintah garis miring dan direktif hanya dipatuhi untuk pengirim yang diotorisasi, yang ditentukan dari daftar izin/pemasangan kanal beserta `commands.useAccessGroups` (lihat [Konfigurasi](/id/gateway/configuration) dan [Perintah garis miring](/id/tools/slash-commands)). Jika daftar izin kanal kosong atau menyertakan `"*"`, perintah secara efektif terbuka untuk kanal tersebut.

`/exec` adalah kemudahan khusus sesi bagi operator yang diotorisasi - ini tidak menulis konfigurasi atau mengubah sesi lain.

## Alat bidang kontrol

Dua alat bawaan tetap sensitif terhadap bidang kontrol:

- `gateway` membaca konfigurasi dengan `config.schema.lookup` / `config.get`. Alat ini tidak dapat menulis konfigurasi, memperbarui OpenClaw, atau memulai ulang Gateway.
- `cron` membuat tugas terjadwal yang terus berjalan setelah obrolan/tugas awal berakhir.

Alat `gateway` tetap hanya untuk pemilik karena pembacaan konfigurasi dapat mengekspos rahasia dan topologi host. Agen meminta perubahan konfigurasi persisten atau siklus hidup melalui alat delegasi `openclaw`; OpenClaw memetakannya ke operasi bertipe dan memerlukan persetujuan manusia sebelum menerapkannya. Lihat [Agen penyiapan OpenClaw](/id/cli/openclaw#operations-and-approval).

Untuk setiap agen/permukaan yang menangani konten tidak tepercaya, tolak hal berikut secara default:

```json5
{
  tools: {
    deny: ["gateway", "cron", "sessions_spawn", "sessions_send"],
  },
}
```

`commands.restart=false` menonaktifkan `/restart` dan permintaan mulai ulang `SIGUSR1` eksternal. Alat agen `gateway` tidak memiliki tindakan mulai ulang.

## Eksekusi Node (`system.run`)

Jika node macOS dipasangkan, Gateway dapat memanggil `system.run` padanya - ini merupakan eksekusi kode jarak jauh pada Mac tersebut.

- Memerlukan pemasangan node (persetujuan + token). Pemasangan menetapkan identitas/kepercayaan node dan penerbitan token; ini bukan permukaan persetujuan per perintah.
- Gateway menerapkan kebijakan perintah node global yang kasar melalui `gateway.nodes.allowCommands` / `denyCommands`. `denyCommands` hanya mencocokkan nama perintah node secara persis (misalnya `system.run`), bukan teks shell di dalam payload perintah - node yang terhubung kembali dan mengiklankan daftar perintah berbeda bukanlah kerentanan dengan sendirinya jika kebijakan global gateway dan persetujuan eksekusi milik node tetap menegakkan batas tersebut.
- Kebijakan `system.run` per node adalah berkas persetujuan eksekusi milik node itu sendiri (`exec.approvals.node.*`), yang dikontrol di Mac melalui Settings -> Exec approvals (keamanan + tanyakan + daftar izin); kebijakan ini dapat lebih ketat atau lebih longgar daripada kebijakan ID perintah global gateway.
- Node yang menjalankan `security="full"` dan `ask="off"` mengikuti model operator tepercaya default - perilaku yang diharapkan, bukan bug, kecuali penerapan Anda memerlukan sikap yang lebih ketat.
- Mode persetujuan mengikat konteks permintaan yang tepat dan, jika memungkinkan, satu operand skrip/berkas lokal konkret. Jika OpenClaw tidak dapat mengidentifikasi tepat satu berkas lokal langsung untuk perintah interpreter/runtime, eksekusi berbasis persetujuan ditolak alih-alih menjanjikan cakupan semantik penuh.
- Untuk `host=node`, eksekusi berbasis persetujuan juga menyimpan `systemRunPlan` siap pakai yang kanonis; penerusan yang disetujui kemudian menggunakan kembali rencana tersimpan tersebut, dan validasi gateway menolak pengeditan oleh pemanggil terhadap konteks perintah/cwd/sesi setelah permintaan persetujuan dibuat.
- Untuk menonaktifkan eksekusi jarak jauh sepenuhnya: atur keamanan ke `deny` dan hapus pemasangan node untuk Mac tersebut.

## Skills dinamis (watcher / node jarak jauh)

OpenClaw dapat menyegarkan daftar Skills di tengah sesi: watcher Skills memperbarui snapshot pada giliran agen berikutnya ketika `SKILL.md` berubah, dan menghubungkan node macOS dapat membuat Skills khusus macOS memenuhi syarat (berdasarkan pemeriksaan bin). Perlakukan folder Skills sebagai kode tepercaya dan batasi siapa yang dapat mengubahnya.

## Plugin

Plugin berjalan di dalam proses bersama Gateway - perlakukan sebagai kode tepercaya.

- Hanya instal dari sumber yang Anda percayai; utamakan daftar izin `plugins.allow` yang eksplisit; tinjau konfigurasi plugin sebelum mengaktifkannya; mulai ulang Gateway setelah perubahan plugin.
- Menginstal/memperbarui plugin menjalankan kode yang dapat dieksekusi:
  - Jalur instalasi adalah direktori per plugin di bawah akar instalasi plugin yang aktif.
  - Paket ClawHub serta katalog bawaan/resmi OpenClaw merupakan sumber tepercaya. Sumber npm, `npm-pack:`, git, jalur/arsip lokal, atau marketplace arbitrer yang baru akan menampilkan peringatan sebelum instalasi; instalasi noninteraktif memerlukan `--force` setelah Anda meninjau dan memercayai sumber tersebut. `--force` mengonfirmasi asal-usul dan mengizinkan penimpaan; ini tidak melewati `security.installPolicy` atau pemeriksaan keamanan instalasi yang tersisa. Pembaruan menggunakan kembali sumber yang telah dipilih.
  - OpenClaw tidak menjalankan pemblokiran kode berbahaya lokal bawaan selama instalasi/pembaruan. Gunakan `security.installPolicy` untuk keputusan izin/blokir lokal milik operator dan `openclaw security audit --deep` untuk pemindaian diagnostik.
  - Instalasi plugin npm dan git menjalankan konvergensi dependensi pengelola paket hanya selama alur instalasi/pembaruan eksplisit. Jalur dan arsip lokal diperlakukan sebagai paket mandiri; OpenClaw menyalin/merujuknya tanpa menjalankan `npm install`.
  - Utamakan versi persis yang disematkan (`@scope/pkg@1.2.3`) dan periksa kode yang telah dibongkar sebelum mengaktifkannya.
  - `--dangerously-force-unsafe-install` telah usang dan tidak lagi mengubah perilaku instalasi/pembaruan.
  - `security.installPolicy` memungkinkan operator menjalankan perintah lokal tepercaya untuk mengambil keputusan izin/blokir khusus host bagi instalasi Skills dan plugin. Perintah ini berjalan setelah materi sumber disiapkan tetapi sebelum instalasi dilanjutkan, juga berlaku untuk Skills ClawHub, dan tidak dilewati oleh flag tidak aman yang telah usang.

Detail: [Plugin](/id/tools/plugin)

## Sandboxing

Dokumen khusus: [Sandboxing](/id/gateway/sandboxing)

Dua pendekatan yang saling melengkapi:

- **Gateway penuh di Docker** (batas kontainer): [Docker](/id/install/docker)
- **Sandbox alat** (`agents.defaults.sandbox`; gateway host + alat yang diisolasi sandbox; Docker adalah backend default): [Sandboxing](/id/gateway/sandboxing)

<Note>
Untuk mencegah akses lintas agen, pertahankan `agents.defaults.sandbox.scope` pada `"agent"` (default) atau gunakan `"session"` untuk isolasi per sesi yang lebih ketat. `scope: "shared"` menggunakan satu kontainer atau ruang kerja.
</Note>

Akses ruang kerja agen di dalam sandbox (`agents.defaults.sandbox.workspaceAccess`):

- `"none"` (default): alat melihat ruang kerja sandbox di bawah `~/.openclaw/sandboxes`; ruang kerja agen tidak dapat diakses.
- `"ro"`: memasang ruang kerja agen hanya-baca pada `/agent` (menonaktifkan `write`/`edit`/`apply_patch`).
- `"rw"`: memasang ruang kerja agen baca/tulis pada `/workspace`.

`sandbox.docker.binds` tambahan divalidasi terhadap jalur sumber yang dinormalisasi dan dikanonisasi. Daftar tolak jalur yang diblokir mencakup `/etc`, `/private/etc`, `/proc`, `/sys`, `/dev`, `/root`, `/boot`, dan direktori yang umumnya berisi atau menjadi alias soket Docker (`/run`, `/var/run`, dan `docker.sock` di bawahnya), beserta subjalur kredensial HOME (`.aws`, `.cargo`, `.config`, `.docker`, `.gnupg`, `.netrc`, `.npm`, `.ssh`). Trik symlink induk dan alias home kanonis diselesaikan melalui leluhur yang ada dan diperiksa ulang, sehingga tetap gagal secara tertutup jika mengarah ke akar yang diblokir.

<Warning>
`tools.elevated` adalah jalan keluar baseline global yang menjalankan eksekusi di luar sandbox. Host efektifnya adalah `gateway` secara default, atau `node` ketika target eksekusi dikonfigurasi ke `node`. Pertahankan `tools.elevated.allowFrom` tetap ketat dan jangan aktifkan bagi orang asing. Batasi lebih lanjut per agen melalui `agents.list[].tools.elevated`. Lihat [Mode elevated](/id/tools/elevated).
</Warning>

### Batas pengaman delegasi subagen

Jika Anda mengizinkan alat sesi, perlakukan eksekusi subagen yang didelegasikan sebagai keputusan batas lainnya:

- Tolak `sessions_spawn` kecuali agen benar-benar memerlukan delegasi.
- Batasi `agents.defaults.subagents.allowAgents` dan setiap penggantian `agents.list[].subagents.allowAgents` per agen hanya pada agen target yang diketahui aman.
- Untuk alur kerja yang harus tetap berada dalam sandbox, panggil `sessions_spawn` dengan `sandbox: "require"` (default adalah `"inherit"`); `"require"` gagal dengan cepat ketika runtime anak target tidak berada dalam sandbox.

### Mode hanya-baca

Buat profil hanya-baca dengan menggabungkan `agents.defaults.sandbox.workspaceAccess: "ro"` (atau `"none"` untuk tanpa akses ruang kerja) dengan daftar izin/tolak alat yang memblokir `write`, `edit`, `apply_patch`, `exec`, `process`, dan sebagainya.

- `tools.exec.applyPatch.workspaceOnly: true` (default): mencegah `apply_patch` menulis/menghapus di luar direktori ruang kerja meskipun sandbox dinonaktifkan. Tetapkan `false` hanya jika Anda memang menginginkan `apply_patch` mengakses file di luar ruang kerja.
- `tools.fs.workspaceOnly: true` (opsional): membatasi jalur `read`/`write`/`edit`/`apply_patch` dan jalur pemuatan otomatis gambar prompt native ke direktori ruang kerja.
- Pertahankan cakupan root sistem file tetap sempit—hindari root yang luas seperti direktori home Anda untuk ruang kerja agen/sandbox, karena dapat mengekspos file lokal sensitif (misalnya status/konfigurasi di bawah `~/.openclaw`) kepada alat sistem file.

## Profil akses per agen (multiagen)

Setiap agen dapat memiliki kebijakan sandbox + alatnya sendiri: akses penuh, hanya baca, atau tanpa akses. Lihat [Sandbox & Alat Multiagen](/id/tools/multi-agent-sandbox-tools) untuk aturan prioritas.

Pola umum: agen pribadi (akses penuh, tanpa sandbox), agen keluarga/kerja (di-sandbox + alat hanya baca), agen publik (di-sandbox + tanpa alat sistem file/shell).

### Akses penuh (tanpa sandbox)

```json5
{
  agents: {
    list: [
      { id: "personal", workspace: "~/.openclaw/workspace-personal", sandbox: { mode: "off" } },
    ],
  },
}
```

### Alat hanya baca + ruang kerja hanya baca

```json5
{
  agents: {
    list: [
      {
        id: "family",
        workspace: "~/.openclaw/workspace-family",
        sandbox: { mode: "all", scope: "agent", workspaceAccess: "ro" },
        tools: {
          allow: ["read"],
          deny: ["write", "edit", "apply_patch", "exec", "process", "browser"],
        },
      },
    ],
  },
}
```

### Tanpa akses sistem file/shell (perpesanan penyedia diizinkan)

```json5
{
  agents: {
    list: [
      {
        id: "public",
        workspace: "~/.openclaw/workspace-public",
        sandbox: { mode: "all", scope: "agent", workspaceAccess: "none" },
        tools: {
          // Alat sesi dapat mengungkap data transkrip. Cakupan default adalah saat ini + yang dibuat;
          // pembacaan juga mencakup grup agen yang sama yang dipantau melalui kesadaran grup sekitar.
          // Gunakan visibility: "self" untuk mengecualikan sesi yang dipantau tersebut.
          sessions: { visibility: "tree" }, // self | tree | agent | all
          allow: [
            "sessions_list",
            "sessions_history",
            "sessions_send",
            "sessions_spawn",
            "session_status",
            "discord",
            "slack",
            "telegram",
            "whatsapp",
          ],
          deny: [
            "apply_patch",
            "browser",
            "canvas",
            "cron",
            "edit",
            "exec",
            "gateway",
            "image",
            "nodes",
            "process",
            "read",
            "write",
          ],
        },
      },
    ],
  },
}
```

## Risiko kontrol browser

Mengaktifkan kontrol browser memberi model sebuah browser nyata. Jika profil tersebut sudah memiliki sesi login, model dapat mengakses akun dan data itu—perlakukan profil browser sebagai status sensitif.

- Utamakan profil khusus untuk agen (profil `openclaw` default); hindari profil pribadi yang Anda gunakan sehari-hari.
- Pertahankan kontrol browser host tetap dinonaktifkan untuk agen yang di-sandbox kecuali Anda memercayainya.
- API kontrol browser loopback mandiri hanya menerima autentikasi rahasia bersama (autentikasi bearer token Gateway atau kata sandi Gateway)—API ini tidak menggunakan header identitas proksi tepercaya atau Tailscale Serve.
- Perlakukan unduhan browser sebagai masukan tidak tepercaya; utamakan direktori unduhan yang terisolasi.
- Nonaktifkan sinkronisasi browser/pengelola kata sandi di profil agen jika memungkinkan.
- Untuk Gateway jarak jauh, "kontrol browser" setara dengan "akses operator" terhadap apa pun yang dapat dijangkau profil tersebut.
- Pertahankan host Gateway dan Node hanya dapat diakses melalui tailnet; hindari mengekspos port kontrol browser ke LAN atau internet publik.
- Nonaktifkan perutean proksi browser jika tidak diperlukan (`gateway.nodes.browser.mode="off"`).
- Mode sesi yang sudah ada pada Chrome MCP bukan berarti "lebih aman"—mode ini dapat bertindak sebagai Anda pada apa pun yang dapat dijangkau profil Chrome host tersebut.
- Jalankan **host Node** pada mesin browser dan biarkan Gateway memproksikan tindakan browser saat Gateway berada jauh dari browser (lihat [Alat browser](/id/tools/browser)); perlakukan pemasangan Node seperti akses admin, pertahankan Gateway dan host Node pada tailnet yang sama, serta hindari mengekspos port relai/kontrol melalui LAN, internet publik, atau Tailscale Funnel.

### Kebijakan SSRF browser (ketat secara default)

Tujuan privat/internal tetap diblokir kecuali Anda secara eksplisit mengizinkannya.

- Default: `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` tidak ditetapkan, sehingga tujuan privat/internal/penggunaan khusus tetap diblokir. Alias lama `allowPrivateNetwork` masih diterima.
- Keikutsertaan: tetapkan `dangerouslyAllowPrivateNetwork: true` untuk mengizinkan tujuan tersebut.
- Dalam mode ketat, gunakan `hostnameAllowlist` (pola seperti `*.example.com`) dan `allowedHostnames` (pengecualian host yang persis, termasuk nama yang biasanya diblokir seperti `localhost`) untuk pengecualian eksplisit.
- Permintaan navigasi langsung diperiksa terlebih dahulu. Selama tindakan dan masa tenggang terbatas setelah tindakan, interaksi Playwright yang dijaga (klik, klik koordinat, arahkan kursor, seret, gulir, pilih, tekan, ketik, isi formulir, dan evaluasi) mencegat pemuatan dokumen tingkat atas dan subframe yang ditolak kebijakan sebelum byte permintaan HTTP dikirim, lalu melakukan pemeriksaan ulang secara best-effort terhadap URL `http(s)` akhir.
- Sebelum setiap peluncuran baru Chrome terkelola, OpenClaw secara best-effort menonaktifkan prediksi jaringan, sehingga menekan preconnect spekulatif Chromium yang teramati untuk pemuatan yang ditolak tersebut. Ini merupakan pertahanan berlapis, bukan batas kebijakan: browser yang digunakan kembali setelah layanan kontrol dimulai ulang dan backend browser lainnya mungkin tidak menerapkan penguatan yang sama. Perutean halaman tetap merupakan intersepsi tingkat permintaan, bukan firewall jaringan: lompatan pengalihan, permintaan pertama popup, lalu lintas Service Worker, kode halaman yang berjalan setelah jendela penjagaan terbatas, dan beberapa jalur latar belakang/subsumber daya dapat melewatinya. Pemeriksaan URL akhir tetap menjadi pertahanan deteksi/karantina; pencegahan menyeluruh memerlukan isolasi egress di sisi pemilik atau proksi yang menegakkan kebijakan.

```json5
{
  browser: {
    ssrfPolicy: {
      dangerouslyAllowPrivateNetwork: false,
      hostnameAllowlist: ["*.example.com", "example.com"],
      allowedHostnames: ["localhost"],
    },
  },
}
```

## Eksposur jaringan

### Bind, port, firewall

Gateway memultipleks WebSocket + HTTP pada satu port (default `18789`; konfigurasi/flag/env: `gateway.port`, `--port`, `OPENCLAW_GATEWAY_PORT`). Permukaan HTTP tersebut mencakup UI Kontrol (aset SPA, path dasar default `/`) dan host canvas (`/__openclaw__/canvas` dan `/__openclaw__/a2ui`—HTML/JS arbitrer; perlakukan sebagai konten tidak tepercaya saat dimuat dalam browser normal; jangan ekspos ke jaringan/pengguna yang tidak tepercaya atau berbagi origin dengan permukaan web berhak istimewa).

`gateway.bind` mengontrol lokasi Gateway mendengarkan:

- `"loopback"` (default): hanya klien lokal yang dapat terhubung.
- `"lan"`, `"tailnet"`, `"custom"`: memperluas permukaan serangan. Gunakan hanya dengan autentikasi Gateway (token/kata sandi bersama, atau proksi tepercaya yang dikonfigurasi dengan benar) dan firewall yang sesungguhnya.

Pedoman praktis: utamakan Tailscale Serve daripada bind LAN (Serve mempertahankan Gateway pada loopback dan Tailscale menangani akses); jika Anda harus melakukan bind ke LAN, batasi port melalui firewall ke daftar izin IP sumber yang ketat daripada meneruskan port secara luas; jangan pernah mengekspos Gateway tanpa autentikasi pada `0.0.0.0`.

### Publikasi port Docker dengan UFW

Port kontainer yang dipublikasikan (`-p HOST:CONTAINER` atau Compose `ports:`) dirutekan melalui rantai penerusan Docker, bukan hanya aturan `INPUT` host. Tegakkan aturan di `DOCKER-USER` (dievaluasi sebelum aturan penerimaan Docker sendiri); sebagian besar distro modern menggunakan frontend `iptables-nft`, yang tetap menerapkan aturan ini ke backend nftables.

```bash
# /etc/ufw/after.rules (tambahkan sebagai bagian *filter tersendiri)
*filter
:DOCKER-USER - [0:0]
-A DOCKER-USER -m conntrack --ctstate ESTABLISHED,RELATED -j RETURN
-A DOCKER-USER -s 127.0.0.0/8 -j RETURN
-A DOCKER-USER -s 10.0.0.0/8 -j RETURN
-A DOCKER-USER -s 172.16.0.0/12 -j RETURN
-A DOCKER-USER -s 192.168.0.0/16 -j RETURN
-A DOCKER-USER -s 100.64.0.0/10 -j RETURN
-A DOCKER-USER -p tcp --dport 80 -j RETURN
-A DOCKER-USER -p tcp --dport 443 -j RETURN
-A DOCKER-USER -m conntrack --ctstate NEW -j DROP
-A DOCKER-USER -j RETURN
COMMIT
```

IPv6 memiliki tabel terpisah—tambahkan kebijakan yang sesuai di `/etc/ufw/after6.rules` jika IPv6 Docker diaktifkan. Hindari menuliskan nama antarmuka secara tetap (`eth0`) karena nama tersebut bervariasi di berbagai image VPS (`ens3`, `enp*`, dan sebagainya) dan ketidakcocokan dapat secara diam-diam melewati aturan penolakan Anda.

```bash
ufw reload
iptables -S DOCKER-USER
ip6tables -S DOCKER-USER
nmap -sT -p 1-65535 <public-ip> --open
```

Port eksternal yang diharapkan seharusnya hanya yang sengaja Anda ekspos (untuk sebagian besar penyiapan: SSH + port proksi terbalik).

### Penemuan mDNS/Bonjour

Saat Plugin `bonjour` bawaan diaktifkan, Gateway menyiarkan keberadaannya melalui mDNS (`_openclaw-gw._tcp`, port 5353) untuk penemuan perangkat lokal. Mode penuh menyertakan catatan TXT yang mengekspos detail operasional: `cliPath` (path sistem file yang mengungkap nama pengguna dan lokasi instalasi), `sshPort` (mengiklankan ketersediaan SSH), `displayName`/`lanHost` (informasi nama host). Menyiarkan detail infrastruktur mempermudah pengintaian LAN.

- Pertahankan Bonjour tetap dinonaktifkan kecuali penemuan LAN diperlukan—Bonjour dimulai secara otomatis pada host macOS dan bersifat opsional di tempat lain; URL Gateway langsung, Tailnet, SSH, atau DNS-SD area luas menghindari multicast lokal.
- **Mode minimal** (default saat Bonjour diaktifkan, direkomendasikan untuk Gateway yang terekspos) menghilangkan kolom sensitif:

  ```json5
  { discovery: { mdns: { mode: "minimal" } } }
  ```

- **Nonaktif** meniadakan penemuan lokal sambil mempertahankan Plugin tetap diaktifkan:

  ```json5
  { discovery: { mdns: { mode: "off" } } }
  ```

- **Mode penuh** (opsional) menyertakan `cliPath` + `sshPort`:

  ```json5
  { discovery: { mdns: { mode: "full" } } }
  ```

- Atau tetapkan `OPENCLAW_DISABLE_BONJOUR=1` untuk menonaktifkan mDNS tanpa perubahan konfigurasi.

Dalam mode minimal, Gateway menyiarkan `role`, `gatewayPort`, `transport`, tetapi menghilangkan `cliPath`/`sshPort`; aplikasi yang memerlukan path CLI dapat mengambilnya melalui koneksi WebSocket yang diautentikasi.

### Autentikasi WebSocket Gateway

Autentikasi Gateway diwajibkan secara default—tanpa jalur autentikasi valid yang dikonfigurasi, Gateway menolak koneksi WebSocket (gagal secara tertutup). Orientasi awal menghasilkan token secara default (bahkan untuk loopback), sehingga klien lokal harus melakukan autentikasi.

```json5
{ gateway: { auth: { mode: "token", token: "your-token" } } }
```

`openclaw doctor --generate-gateway-token` dapat membuatkannya untuk Anda.

<Note>
`gateway.remote.token` dan `gateway.remote.password` merupakan sumber kredensial klien—keduanya tidak melindungi akses WS lokal dengan sendirinya. Jalur panggilan lokal menggunakan `gateway.remote.*` hanya sebagai fallback ketika `gateway.auth.*` tidak ditetapkan. Jika `gateway.auth.token` atau `gateway.auth.password` dikonfigurasi secara eksplisit melalui SecretRef dan tidak terselesaikan, resolusi gagal secara tertutup (tanpa penyamaran fallback jarak jauh).
</Note>

Sematkan TLS jarak jauh dengan `gateway.remote.tlsFingerprint` saat menggunakan `wss://`. `ws://` tanpa enkripsi diterima untuk loopback, literal IP privat, `.local`, dan URL gateway `*.ts.net` Tailnet; untuk nama DNS privat tepercaya lainnya, tetapkan `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` pada proses klien sebagai langkah darurat (hanya lingkungan proses, bukan kunci `openclaw.json`). Penyandingan seluler dan rute gateway manual/hasil pemindaian Android lebih ketat: teks biasa hanya untuk loopback, sedangkan LAN privat, link-local, `.local`, dan nama host tanpa titik harus menggunakan TLS kecuali Anda secara eksplisit memilih jalur teks biasa jaringan privat tepercaya.

Penyandingan perangkat disetujui otomatis untuk koneksi loopback lokal langsung (ditambah jalur koneksi mandiri backend/lokal-kontainer yang terbatas untuk alur pembantu rahasia bersama tepercaya); koneksi Tailnet dan LAN, termasuk koneksi pada host yang sama ke alamat tailnet, diperlakukan sebagai jarak jauh dan tetap memerlukan persetujuan. Alamat `tailnet` atau alamat `custom` yang di-resolve selain `127.0.0.1` atau `0.0.0.0` menambahkan listener `127.0.0.1` terpisah; hanya koneksi ke listener lokal tersebut yang menerima semantik loopback. Bukti header yang diteruskan pada permintaan loopback membatalkan lokalitas loopback; persetujuan otomatis peningkatan metadata dibatasi secara ketat. Lihat [Penyandingan Gateway](/id/gateway/pairing).

Mode autentikasi:

- `"token"`: token bearer bersama (direkomendasikan untuk sebagian besar penyiapan).
- `"password"`: sebaiknya tetapkan melalui `OPENCLAW_GATEWAY_PASSWORD`.
- `"trusted-proxy"`: percayakan autentikasi pengguna kepada proksi terbalik yang sadar identitas dan teruskan identitas melalui header. Lihat [Autentikasi Proksi Tepercaya](/id/gateway/trusted-proxy-auth).

Daftar periksa rotasi (token/kata sandi): buat/tetapkan rahasia baru (`gateway.auth.token` atau `OPENCLAW_GATEWAY_PASSWORD`); mulai ulang Gateway (atau aplikasi macOS jika aplikasi tersebut mengawasi Gateway); perbarui klien jarak jauh (`gateway.remote.token`/`.password`); pastikan kredensial lama tidak lagi berfungsi.

### Header identitas Tailscale Serve

Saat `gateway.auth.allowTailscale` adalah `true` (default untuk Serve), OpenClaw menerima header identitas Tailscale Serve `tailscale-user-login` untuk autentikasi UI Kontrol/WebSocket. OpenClaw memverifikasi identitas dengan me-resolve alamat `x-forwarded-for` melalui daemon Tailscale lokal (`tailscale whois`) dan mencocokkannya dengan header tersebut - ini hanya dipicu untuk permintaan loopback yang membawa `x-forwarded-for`, `x-forwarded-proto`, dan `x-forwarded-host` sebagaimana disisipkan oleh Tailscale. Untuk pemeriksaan asinkron ini, percobaan yang gagal untuk `{scope, ip}` yang sama diserialkan sebelum pembatas mencatat kegagalan, sehingga percobaan ulang buruk secara bersamaan dari satu klien Serve dapat langsung mengunci percobaan kedua.

Endpoint API HTTP (`/v1/*`, `/tools/invoke`, `/api/channels/*`) tidak menggunakan autentikasi header identitas Tailscale - endpoint tersebut mengikuti mode autentikasi HTTP yang dikonfigurasi pada gateway.

Autentikasi bearer HTTP Gateway pada dasarnya merupakan akses operator yang berlaku sepenuhnya atau tidak sama sekali. Kredensial yang dapat memanggil `/v1/chat/completions`, `/v1/responses`, rute plugin seperti `/api/v1/admin/rpc`, atau `/api/channels/*` merupakan rahasia operator dengan akses penuh untuk gateway tersebut: autentikasi bearer rahasia bersama memulihkan cakupan operator default secara penuh (`operator.admin`, `operator.approvals`, `operator.pairing`, `operator.read`, `operator.talk.secrets`, `operator.write`) dan semantik pemilik untuk giliran agen, dan nilai `x-openclaw-scopes` yang lebih sempit tidak mengurangi jalur rahasia bersama tersebut. Semantik cakupan per permintaan hanya berlaku saat permintaan berasal dari mode yang membawa identitas (autentikasi proksi tepercaya) atau ingress privat tanpa autentikasi yang dinyatakan secara eksplisit; dalam mode tersebut, tidak menyertakan `x-openclaw-scopes` akan menggunakan kembali kumpulan cakupan default operator normal, dan header tingkat pemilik seperti `x-openclaw-model` memerlukan `operator.admin` saat cakupan dipersempit. `/tools/invoke` dan endpoint riwayat sesi HTTP mengikuti aturan rahasia bersama yang sama. Jangan bagikan kredensial ini kepada pemanggil yang tidak tepercaya; gunakan gateway terpisah untuk setiap batas kepercayaan.

Autentikasi Serve tanpa token mengasumsikan host gateway itu sendiri tepercaya - autentikasi ini bukan perlindungan terhadap proses berbahaya pada host yang sama. Jika kode lokal yang tidak tepercaya mungkin berjalan pada host gateway, nonaktifkan `allowTailscale` dan wajibkan autentikasi rahasia bersama eksplisit (`token` atau `password`).

Jangan teruskan header ini dari proksi terbalik Anda sendiri. Jika Anda mengakhiri TLS atau menggunakan proksi di depan gateway, nonaktifkan `allowTailscale` dan sebagai gantinya gunakan autentikasi rahasia bersama atau [Autentikasi Proksi Tepercaya](/id/gateway/trusted-proxy-auth).

Lihat [Tailscale](/id/gateway/tailscale) dan [Ikhtisar web](/id/web).

### Konfigurasi proksi terbalik

Tetapkan `gateway.trustedProxies` agar penanganan IP klien yang diteruskan bekerja dengan benar di belakang nginx/Caddy/Traefik/dll. Saat Gateway mendeteksi header proksi dari alamat yang **tidak** tercantum dalam `trustedProxies`, Gateway tidak akan memperlakukan koneksi sebagai lokal; jika autentikasi gateway dinonaktifkan, koneksi tersebut ditolak. Ini mencegah koneksi yang diproksikan tampak berasal dari localhost dan menerima kepercayaan otomatis.

`trustedProxies` juga memasok data ke `gateway.auth.mode: "trusted-proxy"`, yang lebih ketat: secara default, komponen tersebut gagal secara tertutup pada proksi bersumber loopback. Proksi terbalik loopback pada host yang sama dapat menggunakan `trustedProxies` untuk deteksi klien lokal dan penanganan IP yang diteruskan, tetapi hanya dapat memenuhi mode autentikasi `trusted-proxy` saat `gateway.auth.trustedProxy.allowLoopback = true`; jika tidak, gunakan autentikasi token/kata sandi.

```yaml
gateway:
  trustedProxies:
    - "10.0.0.1" # IP proksi terbalik
  allowRealIpFallback: false # default false; aktifkan hanya jika proksi Anda tidak dapat menyediakan X-Forwarded-For
  auth:
    mode: password
    password: ${OPENCLAW_GATEWAY_PASSWORD}
```

Saat `trustedProxies` ditetapkan, Gateway menggunakan `X-Forwarded-For` untuk menentukan IP klien; `X-Real-IP` diabaikan kecuali `gateway.allowRealIpFallback: true` ditetapkan secara eksplisit. Pastikan proksi Anda **menimpa** `X-Forwarded-For`/`X-Real-IP`, bukan menambahkan nilai ke dalamnya:

```nginx
# baik
proxy_set_header X-Forwarded-For $remote_addr;
proxy_set_header X-Real-IP $remote_addr;

# buruk: mempertahankan/menambahkan nilai tidak tepercaya yang diberikan klien
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
```

Header proksi tepercaya tidak otomatis membuat penyandingan perangkat node menjadi tepercaya - `gateway.nodes.pairing.autoApproveCidrs` adalah kebijakan operator terpisah yang dinonaktifkan secara default, dan jalur header proksi tepercaya bersumber loopback tetap dikecualikan dari persetujuan otomatis node bahkan saat autentikasi proksi tepercaya loopback diaktifkan (karena pemanggil lokal dapat memalsukan header tersebut).

### Catatan HSTS dan origin

- Gateway OpenClaw mengutamakan lokal/loopback. Jika Anda mengakhiri TLS pada proksi terbalik, tetapkan HSTS di sana.
- Jika gateway itu sendiri mengakhiri HTTPS, `gateway.http.securityHeaders.strictTransportSecurity` memancarkan header HSTS dari respons OpenClaw.
- Penerapan UI Kontrol non-loopback secara default memerlukan `gateway.controlUi.allowedOrigins`; `allowedOrigins: ["*"]` adalah kebijakan izinkan-semua yang eksplisit, bukan default yang diperkuat - hindari penggunaannya di luar pengujian lokal yang dikontrol ketat.
- Kegagalan autentikasi origin peramban pada loopback tetap dibatasi lajunya bahkan saat pengecualian loopback umum diaktifkan, tetapi kunci penguncian dibatasi per nilai `Origin` yang dinormalisasi, bukan satu bucket localhost bersama.
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` mengaktifkan mode fallback origin header Host; perlakukan ini sebagai kebijakan berbahaya yang dipilih operator.
- Perlakukan DNS rebinding dan perilaku header host proksi sebagai masalah penguatan penerapan; pertahankan `trustedProxies` tetap ketat dan hindari mengekspos gateway langsung ke internet publik.
- Panduan penerapan terperinci: [Autentikasi Proksi Tepercaya](/id/gateway/trusted-proxy-auth#tls-termination-and-hsts).

### UI Kontrol melalui HTTP

UI Kontrol memerlukan konteks aman (HTTPS atau localhost) untuk menghasilkan identitas perangkat.

- `gateway.controlUi.allowInsecureAuth`: tombol kompatibilitas lokal. Pada localhost, mengizinkan autentikasi UI Kontrol tanpa identitas perangkat saat halaman dimuat melalui HTTP yang tidak aman. Tidak melewati pemeriksaan penyandingan dan tidak melonggarkan persyaratan identitas perangkat jarak jauh (non-localhost). Sebaiknya gunakan HTTPS (Tailscale Serve) atau buka UI di `127.0.0.1`.
- `gateway.controlUi.dangerouslyDisableDeviceAuth`: hanya untuk keadaan darurat, menonaktifkan pemeriksaan identitas perangkat sepenuhnya. Penurunan keamanan yang parah; biarkan nonaktif kecuali sedang aktif melakukan debug dan dapat segera mengembalikannya.
- Terpisah dari flag tersebut, `gateway.auth.mode: "trusted-proxy"` yang berhasil dapat menerima sesi UI Kontrol **operator** tanpa identitas perangkat - perilaku mode autentikasi yang disengaja, bukan pintasan `allowInsecureAuth`, dan perilaku ini tidak mencakup sesi UI Kontrol dengan peran node.

`openclaw security audit` memperingatkan saat `allowInsecureAuth` diaktifkan.

### Flag tidak aman/berbahaya

`openclaw security audit` memunculkan `config.insecure_or_dangerous_flags` untuk setiap switch debug tidak aman/berbahaya yang diketahui dan diaktifkan (satu temuan per flag). Biarkan semuanya tidak ditetapkan dalam produksi. Jika penyembunyian audit dikonfigurasi, `security.audit.suppressions.active` tetap berada dalam keluaran aktif meskipun temuan yang cocok berpindah ke `suppressedFindings`.

<AccordionGroup>
  <Accordion title="Flag yang dilacak oleh audit saat ini">
    - `gateway.controlUi.allowInsecureAuth=true`
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true`
    - `gateway.controlUi.dangerouslyDisableDeviceAuth=true`
    - `security.audit.suppressions configured (<count>)`
    - `hooks.gmail.allowUnsafeExternalContent=true`
    - `hooks.mappings[<index>].allowUnsafeExternalContent=true`
    - `tools.exec.applyPatch.workspaceOnly=false`
    - `plugins.entries.acpx.config.permissionMode=approve-all`

  </Accordion>

  <Accordion title="Semua kunci dangerous*/dangerously* dalam skema konfigurasi">
    UI Kontrol dan peramban:
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback`
    - `gateway.controlUi.dangerouslyDisableDeviceAuth`
    - `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`

    Pencocokan nama kanal (kanal bawaan dan plugin; juga per `accounts.<accountId>` jika berlaku):
    - `channels.discord.dangerouslyAllowNameMatching`
    - `channels.googlechat.dangerouslyAllowNameMatching`
    - `channels.msteams.dangerouslyAllowNameMatching`
    - `channels.slack.dangerouslyAllowNameMatching`
    - `channels.irc.dangerouslyAllowNameMatching` (kanal plugin)
    - `channels.mattermost.dangerouslyAllowNameMatching` (kanal plugin)
    - `channels.synology-chat.dangerouslyAllowNameMatching` (kanal plugin)
    - `channels.synology-chat.dangerouslyAllowInheritedWebhookPath` (kanal plugin)
    - `channels.zalouser.dangerouslyAllowNameMatching` (kanal plugin)

    Eksposur jaringan:
    - `channels.telegram.network.dangerouslyAllowPrivateNetwork` (juga per akun)

    Sandbox Docker (default + per agen):
    - `agents.defaults.sandbox.docker.dangerouslyAllowReservedContainerTargets`
    - `agents.defaults.sandbox.docker.dangerouslyAllowExternalBindSources`
    - `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin`

  </Accordion>
</AccordionGroup>

## Penerapan dan kepercayaan host

- Enkripsi seluruh disk pada host Gateway; utamakan akun pengguna OS khusus untuk Gateway jika host digunakan bersama.
- Penguncian dependensi paket yang dipublikasikan: checkout sumber menggunakan `pnpm-lock.yaml`; paket npm `openclaw` yang dipublikasikan dan paket Plugin npm milik OpenClaw menyertakan `npm-shrinkwrap.json` sehingga instalasi menggunakan grafik dependensi transitif yang telah ditinjau dari rilis, alih-alih menyelesaikan grafik baru pada saat instalasi. Ini merupakan batas penguatan rantai pasok dan reproduktibilitas rilis, bukan sandbox—lihat [shrinkwrap npm](/id/gateway/security/shrinkwrap).
- Operasi berkas aman: OpenClaw menggunakan `@openclaw/fs-safe` untuk akses berkas yang dibatasi pada root, penulisan atomik, ekstraksi arsip, ruang kerja sementara, dan pembantu berkas rahasia. Pembantu Python POSIX opsional secara default **dinonaktifkan**; tetapkan `OPENCLAW_FS_SAFE_PYTHON_MODE=auto` atau `require` hanya jika Anda menginginkan penguatan tambahan untuk mutasi relatif terhadap deskriptor berkas dan dapat mendukung runtime Python. Detail: [Operasi berkas aman](/id/gateway/security/secure-file-operations).
- Risiko ruang kerja Slack bersama: jika semua orang di Slack dapat mengirim pesan kepada bot, risiko utamanya adalah otoritas alat yang didelegasikan—setiap pengirim yang diizinkan dapat memicu pemanggilan alat (`exec`, peramban, alat jaringan/berkas) dalam kebijakan agen, injeksi prompt/konten dari satu pengirim dapat memengaruhi status/perangkat/keluaran bersama, dan jika agen bersama memiliki kredensial/berkas sensitif, setiap pengirim yang diizinkan berpotensi mendorong eksfiltrasi melalui penggunaan alat. Gunakan agen/Gateway terpisah dengan alat minimal untuk alur kerja tim; pertahankan agen yang menangani data pribadi tetap privat.
- Agen yang digunakan bersama oleh perusahaan (pola yang dapat diterima): sesuai jika semua orang yang menggunakan agen berada dalam batas kepercayaan yang sama (misalnya satu tim perusahaan) dan agen dibatasi secara ketat untuk urusan bisnis. Jalankan pada mesin/VM/container khusus, gunakan pengguna OS khusus + peramban/profil/akun khusus, dan jangan masuk ke akun Apple/Google pribadi atau profil pengelola kata sandi/peramban pribadi pada runtime tersebut. Mencampur identitas pribadi dan perusahaan pada runtime yang sama menghilangkan pemisahan dan meningkatkan risiko paparan data pribadi.

## Rahasia pada disk

Anggap apa pun di bawah `~/.openclaw/` (atau `$OPENCLAW_STATE_DIR/`) mungkin berisi rahasia atau data privat:

| Path                                           | Isi                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.json`                                | Konfigurasi dapat mencakup token (gateway, gateway jarak jauh), pengaturan penyedia, dan daftar izin.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `credentials/**`                               | Kredensial saluran (misalnya kredensial WhatsApp), daftar izin pemasangan, impor OAuth lama.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `state/openclaw.sqlite`                        | Status runtime bersama, termasuk token akses/penyegaran OAuth MCP native, rahasia pendaftaran klien dinamis, dan status penemuan.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `agents/<agentId>/agent/openclaw-agent.sqlite` | Status runtime per agen, termasuk profil autentikasi model.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `agents/<agentId>/agent/auth-profiles.json`    | Sumber migrasi autentikasi model lama; doctor mengimpor catatan yang didukung ke basis data SQLite per agen.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `agents/<agentId>/agent/codex-home/**`         | Akun app-server Codex per agen, konfigurasi, skills, plugin, status utas native, diagnostik (default).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `$CODEX_HOME/**` or `~/.codex/**`              | Status runtime Codex native. Harness biasa mengaksesnya hanya dengan `plugins.entries.codex.config.appServer.homeScope: "user"` eksplisit. Koneksi supervisi terpisah mengaksesnya ketika cakupan home yang diresolusikan adalah `"user"`, yang merupakan default untuk stdio atau Unix saat tidak ditetapkan. Berisi akun Codex native, konfigurasi, plugin, dan penyimpanan utas. Supervisi mencantumkan metadata sumber serta mempertahankan cabang native kanonis dari Chat yang dilanjutkan dan giliran berikutnya pada koneksi tersebut; pencabangan menyalin riwayat pengguna dan asisten tersimpan yang dibatasi ke dalam Chat OpenClaw yang terautentikasi dan terkunci pada model. Aktifkan hanya untuk Gateway yang dikendalikan pemilik. Lihat [harness Codex](/id/plugins/codex-harness#share-threads-with-codex-desktop-and-cli) dan [supervisi Codex](/id/plugins/codex-supervision). |
| `secrets.json` (opsional)                      | Muatan rahasia berbasis berkas yang digunakan oleh penyedia SecretRef `file` (`secrets.providers`).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `agents/<agentId>/agent/auth.json`             | Berkas kompatibilitas lama; entri `api_key` statis dibersihkan saat ditemukan.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `agents/<agentId>/agent/openclaw-agent.sqlite` | Status runtime per agen, termasuk baris sesi dan transkrip yang dapat berisi pesan pribadi dan keluaran alat.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `agents/<agentId>/sessions/**`                 | Sumber migrasi dan arsip sesi lama yang dapat berisi pesan pribadi dan keluaran alat.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| paket plugin bawaan                        | Plugin yang terinstal (beserta `node_modules/`-nya).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `sandboxes/**`                                 | Ruang kerja sandbox alat; dapat menumpuk salinan file yang dibaca/ditulis di dalam sandbox.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |

### Peta penyimpanan kredensial

Juga berguna untuk keputusan pencadangan:

- WhatsApp: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- Token bot Telegram: config/env atau `channels.telegram.tokenFile` (hanya berkas biasa; symlink ditolak)
- Token bot Discord: config/env atau SecretRef (penyedia env/file/exec)
- Token Slack: config/env (`channels.slack.*`)
- Daftar izin pemasangan: `~/.openclaw/credentials/<channel>-allowFrom.json` (akun default) / `<channel>-<accountId>-allowFrom.json` (akun non-default)
- Profil autentikasi model: `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite` (`auth_profile_store`)
- Sesi OAuth MCP: `~/.openclaw/state/openclaw.sqlite` (`mcp_oauth_stores`)
- Impor OAuth lama: `~/.openclaw/credentials/oauth.json`

Penguatan: pertahankan izin yang ketat (`700` pada direktori, `600` pada berkas); gunakan enkripsi seluruh disk pada host gateway; utamakan akun pengguna OS khusus jika host digunakan bersama.

### Izin berkas

- `~/.openclaw/openclaw.json`: `600` (hanya pengguna yang dapat membaca/menulis)
- `~/.openclaw`: `700` (hanya pengguna)

`openclaw doctor` dapat memperingatkan dan menawarkan untuk memperketat izin ini.

### Berkas `.env` ruang kerja

OpenClaw memuat berkas `.env` lokal ruang kerja untuk agen dan alat, tetapi tidak pernah mengizinkannya mengganti kontrol runtime gateway secara diam-diam:

- Variabel lingkungan kredensial penyedia diblokir dari berkas `.env` ruang kerja yang tidak tepercaya—misalnya `GEMINI_API_KEY`, `GOOGLE_API_KEY`, `XAI_API_KEY`, `MISTRAL_API_KEY`, `GROQ_API_KEY`, `DEEPSEEK_API_KEY`, `PERPLEXITY_API_KEY`, `BRAVE_API_KEY`, `TAVILY_API_KEY`, `EXA_API_KEY`, `FIRECRAWL_API_KEY`, serta kunci autentikasi penyedia yang dideklarasikan oleh plugin tepercaya yang terpasang. Sebagai gantinya, tempatkan kredensial penyedia di lingkungan proses Gateway, `~/.openclaw/.env` (`$OPENCLAW_STATE_DIR/.env`), blok `env` pada konfigurasi, atau impor shell login opsional.
- Setiap kunci yang diawali dengan `OPENCLAW_` diblokir dari berkas `.env` ruang kerja yang tidak tepercaya, sehingga seluruh namespace runtime dicadangkan agar kontrol `OPENCLAW_*` pada masa mendatang secara default gagal secara tertutup, alih-alih diwarisi secara diam-diam dari konten `.env` yang dimasukkan ke repositori atau disediakan penyerang.
- Pengaturan perutean endpoint saluran dan penyedia juga diblokir dari penggantian melalui `.env` ruang kerja (misalnya `MATRIX_HOMESERVER`, `MATTERMOST_URL`, `IRC_HOST`, `SYNOLOGY_CHAT_INCOMING_URL`, `AZURE_SPEECH_ENDPOINT`, serta kunci lain yang diakhiri dengan `_ENDPOINT`), sehingga ruang kerja yang dikloning tidak dapat mengalihkan lalu lintas konektor bawaan melalui konfigurasi endpoint lokal. Pengaturan ini harus berasal dari lingkungan proses gateway, dotenv runtime global, konfigurasi eksplisit, atau `env.shellEnv`.
- Variabel lingkungan proses/OS tepercaya, dotenv runtime global, `env` konfigurasi, serta impor shell login yang diaktifkan tetap berlaku—pembatasan ini hanya berlaku pada pemuatan berkas `.env` ruang kerja.

Berkas `.env` ruang kerja sering berada di sebelah kode agen, tidak sengaja dimasukkan ke repositori, atau ditulis oleh alat; pemblokiran kredensial penyedia mencegah ruang kerja yang dikloning mengganti akun penyedia dengan akun yang dikendalikan penyerang.

### Log dan transkrip

OpenClaw menyimpan transkrip sesi pada disk di bawah `~/.openclaw/agents/<agentId>/sessions/*.jsonl` untuk kesinambungan sesi dan pengindeksan memori opsional—setiap proses/pengguna yang memiliki akses sistem berkas dapat membacanya. Perlakukan akses disk sebagai batas kepercayaan dan kunci izin `~/.openclaw`; jalankan agen dengan pengguna OS atau host terpisah untuk isolasi yang lebih kuat.

Log Gateway dapat mencakup ringkasan alat, kesalahan, dan URL; transkrip sesi dapat mencakup rahasia yang ditempelkan, isi berkas, keluaran perintah, dan tautan.

- Pertahankan penyuntingan log/transkrip tetap aktif (`logging.redactSensitive: "tools"`, default).
- Tambahkan pola khusus untuk lingkungan Anda melalui `logging.redactPatterns` (token, nama host, URL internal).
- Saat membagikan diagnostik, utamakan `openclaw status --all` (dapat ditempelkan, rahasia disunting) daripada log mentah.
- Hapus transkrip sesi dan berkas log lama jika Anda tidak memerlukan retensi jangka panjang.

Detail: [Pencatatan log](/id/gateway/logging)

## Baseline aman (salin/tempel)

```json5
{
  gateway: {
    mode: "local",
    bind: "loopback",
    port: 18789,
    auth: { mode: "token", token: "your-long-random-token" },
  },
  channels: {
    whatsapp: {
      dmPolicy: "pairing",
      groups: { "*": { requireMention: true } },
    },
  },
}
```

Menjaga Gateway tetap privat, mewajibkan pemasangan DM, dan menghindari bot grup yang selalu aktif. Agar eksekusi alat juga lebih aman, tambahkan sandbox + tolak alat berbahaya untuk setiap agen non-pemilik (lihat "Profil akses per agen" di atas).

### Nomor terpisah (WhatsApp, Signal, Telegram)

Untuk saluran berbasis nomor telepon, pertimbangkan menjalankan asisten pada nomor yang terpisah dari nomor pribadi Anda, sehingga percakapan pribadi tetap privat dan nomor bot menangani otomatisasi dengan batasannya sendiri.

## Respons insiden

### Kendalikan

1. Hentikan: hentikan aplikasi macOS (jika aplikasi tersebut mengawasi Gateway) atau hentikan proses `openclaw gateway` Anda.
2. Tutup paparan: atur `gateway.bind: "loopback"` (atau nonaktifkan Tailscale Funnel/Serve) hingga Anda memahami apa yang terjadi.
3. Bekukan akses: ubah DM/grup berisiko menjadi `dmPolicy: "disabled"` / wajibkan penyebutan, dan hapus setiap entri izinkan-semua `"*"`.

### Rotasi (anggap telah disusupi jika rahasia bocor)

1. Rotasi autentikasi Gateway (`gateway.auth.token` / `OPENCLAW_GATEWAY_PASSWORD`) dan mulai ulang.
2. Rotasi rahasia klien jarak jauh (`gateway.remote.token` / `.password`) pada setiap mesin yang dapat memanggil Gateway.
3. Rotasi kredensial penyedia/API (kredensial WhatsApp, token Slack/Discord, kunci model/API dalam `auth-profiles.json`, serta nilai muatan rahasia terenkripsi jika digunakan).

### Audit

1. Periksa log Gateway: `/tmp/openclaw/openclaw-YYYY-MM-DD.log` (atau `logging.file`).
2. Tinjau transkrip yang relevan: `~/.openclaw/agents/<agentId>/sessions/*.jsonl`.
3. Tinjau perubahan konfigurasi terkini yang mungkin telah memperluas akses: `gateway.bind`, `gateway.auth`, kebijakan DM/grup, `tools.elevated`, perubahan plugin.
4. Jalankan ulang `openclaw security audit --deep` dan pastikan temuan kritis telah diselesaikan.

### Kumpulkan untuk laporan

- Stempel waktu, OS host gateway + versi OpenClaw.
- Transkrip sesi + bagian akhir log singkat (setelah penyuntingan).
- Apa yang dikirim penyerang dan apa yang dilakukan agen.
- Apakah Gateway dipaparkan di luar loopback (LAN/Tailscale Funnel/Serve).

## Pemindaian rahasia

CI menjalankan hook pre-commit `detect-private-key` pada repositori. Jika gagal, hapus atau rotasi materi kunci yang dimasukkan ke repositori, lalu reproduksi secara lokal:

```bash
pre-commit run --all-files detect-private-key
```

## Melaporkan masalah keamanan

Menemukan kerentanan di OpenClaw? Laporkan secara bertanggung jawab:

1. Email: [security@openclaw.ai](mailto:security@openclaw.ai)
2. Jangan publikasikan sebelum diperbaiki.
3. Kami akan mencantumkan kredit untuk Anda (kecuali Anda memilih untuk tetap anonim).
