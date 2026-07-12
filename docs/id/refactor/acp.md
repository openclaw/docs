---
read_when:
    - Pemfaktoran ulang siklus hidup sesi ACP atau pembersihan proses ACPX
    - Men-debug proses yatim ACPX, penggunaan ulang PID, atau keamanan pembersihan multi-Gateway
    - Mengubah visibilitas sessions_list untuk sesi ACP atau subagen yang dibuat secara dinamis
    - Merancang metadata kepemilikan untuk tugas latar belakang, sesi ACP, atau sewa proses
sidebarTitle: ACP lifecycle refactor
summary: Rencana migrasi untuk memperjelas kepemilikan sesi ACP dan proses ACPX
title: Refaktor siklus hidup ACP
x-i18n:
    generated_at: "2026-07-12T14:35:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b7f4ee447e0b436601c68251c26c1b897a642f6a8b1886d18647b62817996792
    source_path: refactor/acp.md
    workflow: 16
---

Siklus hidup ACP saat ini berfungsi, tetapi terlalu banyak bagiannya disimpulkan setelah kejadian.
Pembersihan proses merekonstruksi kepemilikan dari PID, string perintah, jalur
pembungkus, dan tabel proses aktif. Visibilitas sesi merekonstruksi kepemilikan
dari string kunci sesi ditambah pencarian sekunder `sessions.list({ spawnedBy })`.
Hal itu memungkinkan perbaikan yang terfokus, tetapi juga membuat kasus khusus
mudah terlewat: penggunaan ulang PID, perintah yang diberi tanda kutip, proses
turunan tingkat lanjut dari adaptor, akar status multi-Gateway, `cancel` versus
`close`, serta visibilitas `tree` versus `all` menjadi tempat-tempat terpisah
untuk menemukan kembali aturan kepemilikan yang sama.

Refaktor ini menjadikan kepemilikan sebagai konsep utama. Tujuannya bukan
permukaan produk ACP baru, melainkan kontrak internal yang lebih aman untuk
perilaku ACP dan ACPX yang sudah ada.

## Tujuan

- Pembersihan tidak pernah mengirim sinyal ke proses kecuali bukti aktif saat
  ini cocok dengan sewa yang dimiliki OpenClaw.
- `cancel`, `close`, dan pembersihan saat mulai memiliki maksud siklus hidup
  yang berbeda.
- `sessions_list`, `sessions_history`, `sessions_send`, dan pemeriksaan status
  menggunakan model sesi milik peminta yang sama.
- Instalasi multi-Gateway tidak dapat membersihkan pembungkus ACPX milik satu
  sama lain.
- Catatan sesi ACPX lama tetap berfungsi selama migrasi.
- Runtime tetap dimiliki Plugin; inti tidak mempelajari detail paket ACPX.

## Bukan tujuan

- Mengganti ACPX atau mengubah permukaan perintah publik `/acp`.
- Memindahkan perilaku adaptor ACP khusus vendor ke inti.
- Mengharuskan pengguna membersihkan status secara manual sebelum meningkatkan
  versi.
- Membuat `cancel` menutup sesi ACP yang dapat digunakan kembali.

## Model Sasaran

### Identitas Instans Gateway

Setiap proses Gateway harus memiliki ID instans runtime yang stabil:

```ts
type GatewayInstanceId = string;
```

ID ini dapat dibuat saat Gateway dimulai dan dipertahankan dalam status selama
masa hidup instalasi tersebut. Ini bukan rahasia keamanan; ini adalah pembeda
kepemilikan yang digunakan untuk menghindari kekeliruan antara proses ACP milik
satu Gateway dan proses milik Gateway lain.

### Kepemilikan Sesi ACP

Setiap sesi ACP yang dibuat harus memiliki metadata kepemilikan yang
dinormalisasi:

```ts
type AcpSessionOwner = {
  sessionKey: string;
  spawnedBy?: string;
  parentSessionKey?: string;
  ownerSessionKey: string;
  agentId: string;
  backend: "acpx";
  gatewayInstanceId: GatewayInstanceId;
  createdAt: number;
};
```

Gateway harus mengembalikan bidang-bidang ini pada baris sesi jika diketahui.
Pemfilteran visibilitas harus berupa pemeriksaan murni atas metadata baris:

```ts
canSeeSessionRow({
  row,
  requesterSessionKey,
  visibility,
  a2aPolicy,
});
```

Hal ini menghapus pemanggilan sekunder tersembunyi
`sessions.list({ spawnedBy })` dari pemeriksaan visibilitas. Sesi anak ACP lintas
agen yang dibuat dianggap milik peminta karena baris tersebut menyatakannya,
bukan karena kueri kedua kebetulan menemukannya.

### Sewa Proses ACPX

Setiap peluncuran pembungkus yang dibuat harus menghasilkan catatan sewa:

```ts
type AcpxProcessLease = {
  leaseId: string;
  gatewayInstanceId: GatewayInstanceId;
  sessionKey: string;
  wrapperRoot: string;
  wrapperPath: string;
  rootPid: number;
  processGroupId?: number;
  commandHash: string;
  startedAt: number;
  state: "open" | "closing" | "closed" | "lost";
};
```

Proses pembungkus harus menerima ID sewa dan ID instans Gateway melalui
lingkungannya:

```sh
OPENCLAW_ACPX_LEASE_ID=...
OPENCLAW_GATEWAY_INSTANCE_ID=...
```

Jika platform mendukungnya, verifikasi harus mengutamakan metadata proses aktif
yang tidak dapat disalahartikan akibat pengutipan perintah:

- PID akar masih ada
- jalur pembungkus aktif berada di bawah `wrapperRoot`
- grup proses cocok dengan sewa jika tersedia
- lingkungan berisi ID sewa yang diharapkan jika dapat dibaca
- hash perintah atau jalur berkas yang dapat dieksekusi cocok dengan sewa

Jika proses aktif tidak dapat diverifikasi, pembersihan harus gagal secara
tertutup.

## Pengontrol Siklus Hidup

Perkenalkan satu pengontrol siklus hidup ACPX yang memiliki sewa proses dan
kebijakan pembersihan:

```ts
interface AcpxLifecycleController {
  ensureSession(input: AcpRuntimeEnsureInput): Promise<AcpRuntimeHandle>;
  cancelTurn(handle: AcpRuntimeHandle): Promise<void>;
  closeSession(input: {
    handle: AcpRuntimeHandle;
    discardPersistentState?: boolean;
    reason?: string;
  }): Promise<void>;
  reapStartupOrphans(): Promise<void>;
  verifyOwnedTree(lease: AcpxProcessLease): Promise<OwnedProcessTree | null>;
}
```

`cancelTurn` hanya meminta pembatalan giliran. Operasi ini tidak boleh
membersihkan proses pembungkus atau adaptor yang dapat digunakan kembali.

`closeSession` boleh melakukan pembersihan, tetapi hanya setelah memuat catatan
sesi, memuat sewa, dan memverifikasi bahwa pohon proses aktif masih menjadi
milik sewa tersebut.

`reapStartupOrphans` dimulai dari sewa terbuka dalam status. Operasi ini dapat
menggunakan tabel proses untuk menemukan turunan, tetapi tidak boleh terlebih
dahulu memindai perintah sembarang yang tampak seperti ACP lalu memutuskan bahwa
perintah tersebut mungkin milik kita.

## Kontrak Pembungkus

Pembungkus yang dibuat harus tetap ringkas. Pembungkus harus:

- memulai adaptor dalam grup proses jika didukung
- meneruskan sinyal penghentian normal ke grup proses
- mendeteksi kematian induk
- saat induk mati, mengirim SIGTERM, lalu menjaga pembungkus tetap hidup hingga
  mekanisme cadangan SIGKILL dijalankan
- melaporkan PID akar dan ID grup proses kembali ke pengontrol siklus hidup jika
  tersedia

Pembungkus tidak boleh menentukan kebijakan sesi. Pembungkus hanya menerapkan
pembersihan pohon proses lokal untuk grup adaptornya sendiri.

## Kontrak Visibilitas Sesi

Visibilitas harus menggunakan kepemilikan baris yang dinormalisasi:

```ts
type SessionVisibilityInput = {
  requesterSessionKey: string;
  row: {
    key: string;
    agentId: string;
    ownerSessionKey?: string;
    spawnedBy?: string;
    parentSessionKey?: string;
  };
  visibility: "self" | "tree" | "agent" | "all";
  a2aPolicy: AgentToAgentPolicy;
};
```

Aturan:

- `self`: hanya sesi peminta.
- `tree`: sesi peminta ditambah baris yang dimiliki oleh atau dibuat dari
  peminta.
- `all`: semua baris agen yang sama, baris lintas agen yang diizinkan a2a, dan
  baris lintas agen yang dibuat serta dimiliki peminta meskipun a2a umum
  dinonaktifkan.
- `agent`: hanya agen yang sama, kecuali hubungan pemilik eksplisit menyatakan
  bahwa baris tersebut milik peminta.

Hal ini membuat `tree` dan `all` monoton: `all` tidak boleh menyembunyikan sesi
anak milik peminta yang akan ditampilkan oleh `tree`.

## Rencana Migrasi

### Fase 1: Tambahkan Identitas dan Sewa

- Tambahkan `gatewayInstanceId` ke status Gateway.
- Tambahkan penyimpanan sewa ACPX di bawah direktori status ACPX.
- Tulis sewa sebelum membuat pembungkus yang dihasilkan.
- Simpan `leaseId` pada catatan sesi ACPX baru.
- Pertahankan bidang PID dan perintah yang ada untuk catatan lama.

### Fase 2: Pembersihan yang Mengutamakan Sewa

- Ubah pembersihan penutupan agar memuat `leaseId` terlebih dahulu.
- Verifikasi kepemilikan proses aktif terhadap sewa sebelum mengirim sinyal.
- Pertahankan mekanisme cadangan PID akar dan akar pembungkus saat ini hanya
  untuk catatan lama.
- Tandai sewa sebagai `closed` setelah pembersihan terverifikasi.
- Tandai sewa sebagai `lost` jika proses sudah tidak ada sebelum pembersihan.

### Fase 3: Pembersihan Saat Mulai yang Mengutamakan Sewa

- Pembersihan saat mulai memindai sewa terbuka.
- Untuk setiap sewa, verifikasi proses akar dan kumpulkan turunannya.
- Bersihkan pohon terverifikasi dengan mendahulukan proses anak.
- Kedaluwarsakan sewa `closed` dan `lost` lama dengan jangka retensi terbatas.
- Pertahankan pemindaian penanda perintah hanya sebagai mekanisme cadangan lama
  sementara, yang dibatasi oleh akar pembungkus dan instans Gateway jika
  memungkinkan.

### Fase 4: Baris Kepemilikan Sesi

- Tambahkan metadata kepemilikan ke baris sesi Gateway.
- Ajarkan penulis ACPX, subagen, tugas latar belakang, dan penyimpanan sesi
  untuk mengisi `ownerSessionKey` atau `spawnedBy`.
- Konversikan pemeriksaan visibilitas sesi agar menggunakan metadata baris.
- Hapus pencarian sekunder `sessions.list({ spawnedBy })` pada saat pemeriksaan
  visibilitas.

### Fase 5: Hapus Heuristik Lama

Setelah satu periode rilis:

- berhenti mengandalkan string perintah akar yang disimpan untuk pembersihan
  ACPX nonlama
- hapus pemindaian penanda perintah saat mulai
- hapus pencarian daftar cadangan untuk visibilitas
- pertahankan perilaku defensif gagal-tertutup untuk sewa yang hilang atau
  tidak dapat diverifikasi

## Pengujian

Tambahkan dua rangkaian pengujian berbasis tabel.

Simulator siklus hidup proses:

- PID digunakan kembali oleh proses yang tidak terkait
- PID digunakan kembali oleh akar pembungkus milik Gateway lain
- perintah pembungkus tersimpan diberi tanda kutip shell, sedangkan perintah
  `ps` aktif tidak
- proses anak adaptor berhenti, tetapi proses turunannya tetap berada dalam grup
  proses
- mekanisme cadangan SIGTERM saat induk mati mencapai SIGKILL
- daftar proses tidak tersedia
- sewa usang dengan proses yang hilang
- proses yatim saat mulai dengan pembungkus, proses anak adaptor, dan proses
  turunannya

Matriks visibilitas sesi:

- `self`, `tree`, `agent`, `all`
- a2a diaktifkan dan dinonaktifkan
- baris agen yang sama
- baris lintas agen
- baris ACP lintas agen yang dibuat dan dimiliki peminta
- peminta dalam sandbox dibatasi ke `tree`
- tindakan daftar, riwayat, kirim, dan status

Invarian penting: sesi anak yang dibuat dan dimiliki peminta terlihat di mana
pun visibilitas yang dikonfigurasi mencakup pohon sesi peminta, dan `all` tidak
kurang mampu dibandingkan `tree`.

## Catatan Kompatibilitas

Catatan sesi lama mungkin tidak memiliki `leaseId`. Catatan tersebut harus
menggunakan jalur pembersihan lama yang gagal secara tertutup:

- mewajibkan proses akar aktif
- mewajibkan kepemilikan akar pembungkus jika pembungkus yang dihasilkan
  diharapkan
- mewajibkan kecocokan perintah untuk akar nonpembungkus
- tidak pernah mengirim sinyal hanya berdasarkan metadata PID tersimpan yang
  usang

Jika catatan lama tidak dapat diverifikasi, biarkan tetap berjalan. Pembersihan
sewa saat mulai dan periode rilis berikutnya pada akhirnya harus menghentikan
penggunaan mekanisme cadangan tersebut.

## Kriteria Keberhasilan

- Menutup sesi ACPX lama atau usang tidak dapat menghentikan proses milik
  Gateway lain.
- Kematian induk tidak meninggalkan proses turunan adaptor yang membandel tetap
  berjalan.
- `cancel` membatalkan giliran aktif tanpa menutup sesi yang dapat digunakan
  kembali.
- `sessions_list` dapat menampilkan sesi anak ACP lintas agen milik peminta
  dalam `tree` maupun `all`.
- Pembersihan saat mulai digerakkan oleh sewa, bukan pemindaian string perintah
  secara luas.
- Pengujian matriks proses dan visibilitas yang terfokus mencakup setiap kasus
  khusus yang sebelumnya memerlukan perbaikan tinjauan satu per satu.
