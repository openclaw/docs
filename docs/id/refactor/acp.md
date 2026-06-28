---
read_when:
    - Refaktorisasi siklus hidup sesi ACP atau pembersihan proses ACPX
    - Melakukan debug pada proses yatim ACPX, penggunaan ulang PID, atau keamanan pembersihan multi-Gateway
    - Mengubah visibilitas sessions_list untuk sesi ACP atau subagen yang dibuat
    - Merancang metadata kepemilikan untuk tugas latar belakang, sesi ACP, atau lease proses
sidebarTitle: ACP lifecycle refactor
summary: Rencana migrasi untuk membuat kepemilikan sesi ACP dan proses ACPX menjadi eksplisit
title: Refaktorisasi siklus hidup ACP
x-i18n:
    generated_at: "2026-05-07T13:25:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: b7f4ee447e0b436601c68251c26c1b897a642f6a8b1886d18647b62817996792
    source_path: refactor/acp.md
    workflow: 16
    postprocess_version: locale-links-v1
---

ACP lifecycle saat ini berfungsi, tetapi terlalu banyak hal disimpulkan setelah kejadian.
Pembersihan proses merekonstruksi kepemilikan dari PID, string perintah, jalur
pembungkus, dan tabel proses langsung. Visibilitas sesi merekonstruksi kepemilikan
dari string kunci sesi ditambah pencarian sekunder `sessions.list({ spawnedBy })`.
Itu memungkinkan perbaikan sempit, tetapi juga membuat kasus tepi mudah terlewat:
penggunaan ulang PID, perintah yang dikutip, cucu adaptor, akar status multi-Gateway,
`cancel` versus `close`, dan visibilitas `tree` versus `all` semuanya menjadi tempat
terpisah untuk menemukan ulang aturan kepemilikan yang sama.

Refaktor ini menjadikan kepemilikan sebagai konsep kelas satu. Tujuannya bukan
permukaan produk ACP baru; tujuannya adalah kontrak internal yang lebih aman untuk
perilaku ACP dan ACPX yang sudah ada.

## Tujuan

- Pembersihan tidak pernah mengirim sinyal ke proses kecuali bukti langsung saat ini cocok dengan
  sewa milik OpenClaw.
- `cancel`, `close`, dan pembersihan saat startup memiliki maksud siklus hidup yang berbeda.
- `sessions_list`, `sessions_history`, `sessions_send`, dan pemeriksaan status menggunakan
  model sesi milik peminta yang sama.
- Instalasi multi-Gateway tidak dapat membersihkan pembungkus ACPX milik satu sama lain.
- Rekaman sesi ACPX lama tetap berfungsi selama migrasi.
- Runtime tetap dimiliki Plugin; core tidak mempelajari detail paket ACPX.

## Bukan tujuan

- Mengganti ACPX atau mengubah permukaan perintah publik `/acp`.
- Memindahkan perilaku adaptor ACP khusus vendor ke core.
- Mengharuskan pengguna membersihkan status secara manual sebelum meningkatkan versi.
- Membuat `cancel` menutup sesi ACP yang dapat digunakan ulang.

## Model Target

### Identitas Instans Gateway

Setiap proses Gateway harus memiliki id instans runtime yang stabil:

```ts
type GatewayInstanceId = string;
```

Id ini dapat dihasilkan saat startup Gateway dan dipertahankan dalam status selama masa hidup
instalasi tersebut. Ini bukan rahasia keamanan; ini adalah pembeda kepemilikan yang digunakan
untuk menghindari kekeliruan antara proses ACP milik satu Gateway dan proses milik Gateway lain.

### Kepemilikan Sesi ACP

Setiap sesi ACP yang dimunculkan harus memiliki metadata kepemilikan yang dinormalisasi:

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

Itu menghapus panggilan sekunder tersembunyi `sessions.list({ spawnedBy })` dari
pemeriksaan visibilitas. Anak ACP lintas agen yang dimunculkan dimiliki oleh peminta karena
barisnya menyatakan demikian, bukan karena kueri kedua kebetulan menemukannya.

### Sewa Proses ACPX

Setiap peluncuran pembungkus yang dihasilkan harus membuat rekaman sewa:

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

Proses pembungkus harus menerima id sewa dan id instans Gateway di lingkungannya:

```sh
OPENCLAW_ACPX_LEASE_ID=...
OPENCLAW_GATEWAY_INSTANCE_ID=...
```

Jika platform memungkinkan, verifikasi harus mengutamakan metadata proses langsung
yang tidak dapat dikacaukan oleh kutipan perintah:

- PID akar masih ada
- jalur pembungkus langsung berada di bawah `wrapperRoot`
- grup proses cocok dengan sewa jika tersedia
- lingkungan berisi id sewa yang diharapkan jika dapat dibaca
- hash perintah atau jalur executable cocok dengan sewa

Jika proses langsung tidak dapat diverifikasi, pembersihan gagal secara tertutup.

## Pengendali Siklus Hidup

Perkenalkan satu pengendali siklus hidup ACPX yang memiliki sewa proses dan kebijakan
pembersihan:

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

`cancelTurn` hanya meminta pembatalan giliran. Ini tidak boleh membersihkan proses
pembungkus atau adaptor yang dapat digunakan ulang.

`closeSession` boleh membersihkan, tetapi hanya setelah memuat rekaman sesi,
memuat sewa, dan memverifikasi bahwa pohon proses langsung masih menjadi milik
sewa tersebut.

`reapStartupOrphans` dimulai dari sewa terbuka dalam status. Ini boleh menggunakan tabel
proses untuk menemukan turunan, tetapi tidak boleh memindai perintah sembarang yang tampak
seperti ACP terlebih dahulu lalu memutuskan bahwa perintah itu mungkin milik kita.

## Kontrak Pembungkus

Pembungkus yang dihasilkan harus tetap kecil. Pembungkus harus:

- memulai adaptor dalam grup proses jika didukung
- meneruskan sinyal terminasi normal ke grup proses
- mendeteksi kematian induk
- saat induk mati, mengirim SIGTERM, lalu menjaga pembungkus tetap hidup sampai fallback SIGKILL
  berjalan
- melaporkan PID akar dan id grup proses kembali ke pengendali siklus hidup jika
  tersedia

Pembungkus tidak boleh menentukan kebijakan sesi. Pembungkus hanya menegakkan pembersihan
pohon proses lokal untuk grup adaptornya sendiri.

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
- `tree`: sesi peminta ditambah baris yang dimiliki oleh atau dimunculkan dari peminta.
- `all`: semua baris agen yang sama, baris lintas agen yang diizinkan a2a, dan baris lintas agen
  yang dimunculkan dan dimiliki peminta bahkan ketika a2a umum dinonaktifkan.
- `agent`: hanya agen yang sama, kecuali hubungan pemilik eksplisit menyatakan bahwa baris
  tersebut milik peminta.

Ini membuat `tree` dan `all` monotonik: `all` tidak boleh menyembunyikan anak milik peminta yang
akan ditampilkan oleh `tree`.

## Rencana Migrasi

### Fase 1: Tambahkan Identitas Dan Sewa

- Tambahkan `gatewayInstanceId` ke status Gateway.
- Tambahkan penyimpanan sewa ACPX di bawah direktori status ACPX.
- Tulis sewa sebelum memunculkan pembungkus yang dihasilkan.
- Simpan `leaseId` pada rekaman sesi ACPX baru.
- Pertahankan bidang PID dan perintah yang ada untuk rekaman lama.

### Fase 2: Pembersihan Mengutamakan Sewa

- Ubah pembersihan penutupan agar memuat `leaseId` terlebih dahulu.
- Verifikasi kepemilikan proses langsung terhadap sewa sebelum mengirim sinyal.
- Pertahankan fallback PID akar dan akar pembungkus saat ini hanya untuk rekaman lama.
- Tandai sewa sebagai `closed` setelah pembersihan terverifikasi.
- Tandai sewa sebagai `lost` ketika proses sudah hilang sebelum pembersihan.

### Fase 3: Pembersihan Startup Mengutamakan Sewa

- Pembersihan startup memindai sewa terbuka.
- Untuk setiap sewa, verifikasi proses akar dan kumpulkan turunan.
- Bersihkan pohon terverifikasi dari anak terlebih dahulu.
- Kedaluwarsakan sewa lama `closed` dan `lost` dengan jendela retensi terbatas.
- Pertahankan pemindaian penanda perintah hanya sebagai fallback lama sementara, dijaga oleh
  akar pembungkus dan instans Gateway jika memungkinkan.

### Fase 4: Baris Kepemilikan Sesi

- Tambahkan metadata kepemilikan ke baris sesi Gateway.
- Ajarkan penulis ACPX, subagen, tugas latar belakang, dan penyimpanan sesi untuk mengisi
  `ownerSessionKey` atau `spawnedBy`.
- Ubah pemeriksaan visibilitas sesi agar menggunakan metadata baris.
- Hapus pencarian sekunder `sessions.list({ spawnedBy })` pada waktu visibilitas.

### Fase 5: Hapus Heuristik Lama

Setelah satu jendela rilis:

- berhenti mengandalkan string perintah akar yang disimpan untuk pembersihan ACPX non-lama
- hapus pemindaian startup penanda perintah
- hapus pencarian daftar fallback visibilitas
- pertahankan perilaku defensif gagal-tertutup untuk sewa yang hilang atau tidak dapat diverifikasi

## Pengujian

Tambahkan dua suite berbasis tabel.

Simulator siklus hidup proses:

- PID digunakan ulang oleh proses yang tidak terkait
- PID digunakan ulang oleh akar pembungkus milik Gateway lain
- perintah pembungkus yang disimpan dikutip shell, perintah `ps` langsung tidak
- anak adaptor keluar, cucu tetap berada dalam grup proses
- fallback SIGTERM saat kematian induk mencapai SIGKILL
- daftar proses tidak tersedia
- sewa basi dengan proses yang hilang
- yatim startup dengan pembungkus, anak adaptor, dan cucu

Matriks visibilitas sesi:

- `self`, `tree`, `agent`, `all`
- a2a diaktifkan dan dinonaktifkan
- baris agen yang sama
- baris lintas agen
- baris ACP lintas agen yang dimunculkan dan dimiliki peminta
- peminta sandbox dibatasi ke `tree`
- tindakan daftar, riwayat, kirim, dan status

Invarian penting: anak yang dimunculkan dan dimiliki peminta terlihat di mana pun
visibilitas terkonfigurasi menyertakan pohon sesi peminta, dan `all` tidak kurang
mampu daripada `tree`.

## Catatan Kompatibilitas

Rekaman sesi lama mungkin tidak memiliki `leaseId`. Rekaman tersebut harus menggunakan jalur
pembersihan lama yang gagal-tertutup:

- mewajibkan proses akar langsung
- mewajibkan kepemilikan akar pembungkus saat pembungkus yang dihasilkan diharapkan
- mewajibkan kesesuaian perintah untuk akar non-pembungkus
- jangan pernah mengirim sinyal hanya berdasarkan metadata PID tersimpan yang basi

Jika rekaman lama tidak dapat diverifikasi, biarkan saja. Pembersihan sewa startup dan
jendela rilis berikutnya pada akhirnya harus menghentikan fallback tersebut.

## Kriteria Keberhasilan

- Menutup sesi ACPX lama atau basi tidak dapat mematikan proses milik Gateway lain.
- Kematian induk tidak meninggalkan cucu adaptor yang bandel tetap berjalan.
- `cancel` membatalkan giliran aktif tanpa menutup sesi yang dapat digunakan ulang.
- `sessions_list` dapat menampilkan anak ACP lintas agen milik peminta di bawah `tree` dan `all`.
- Pembersihan startup digerakkan oleh sewa, bukan pemindaian string perintah yang luas.
- Pengujian matriks proses dan visibilitas terfokus mencakup setiap kasus tepi yang
  sebelumnya memerlukan perbaikan tinjauan satu per satu.
