---
read_when:
    - Anda sedang mengubah runtime agen tertanam atau registri harness
    - Anda mendaftarkan harness agen dari plugin bawaan atau tepercaya
    - Anda perlu memahami hubungan antara plugin Codex dan penyedia model
sidebarTitle: Agent Harness
summary: Permukaan SDK eksperimental untuk plugin yang menggantikan eksekutor agen tertanam tingkat rendah
title: Plugin harness agen
x-i18n:
    generated_at: "2026-07-19T05:29:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: a43049c126b4defd347b56c31da1b6482e050aa294c3a84673cca59fa5909241
    source_path: plugins/sdk-agent-harness.md
    workflow: 16
---

**Harness agen** adalah eksekutor tingkat rendah untuk satu giliran agen OpenClaw yang
telah disiapkan. Ini bukan penyedia model, bukan kanal, dan bukan registri alat. Untuk
model mental yang berorientasi pada pengguna, lihat [Runtime agen](/id/concepts/agent-runtimes).

Gunakan permukaan ini hanya untuk plugin native bawaan atau tepercaya. Kontrak ini
masih eksperimental karena tipe parameternya sengaja mencerminkan runner tertanam
saat ini.

## Kapan menggunakan harness

Daftarkan harness agen ketika suatu keluarga model memiliki runtime sesi
native sendiri dan transportasi penyedia OpenClaw normal merupakan abstraksi yang keliru:

- server agen pengodean native yang mengelola thread dan Compaction
- CLI atau daemon lokal yang harus melakukan streaming peristiwa rencana/penalaran/alat native
- runtime model yang memerlukan id pelanjutannya sendiri selain transkrip
  sesi OpenClaw

**Jangan** mendaftarkan harness hanya untuk menambahkan API LLM baru. Untuk API model
HTTP atau WebSocket normal, buat [plugin penyedia](/id/plugins/sdk-provider-plugins).

## Hal yang tetap dikelola inti

Sebelum harness dipilih, OpenClaw telah menentukan:

- penyedia dan model
- status autentikasi runtime, kecuali harness menyatakan bahwa ia mengelola bootstrap autentikasi
- tingkat pemikiran dan anggaran konteks
- file transkrip/sesi OpenClaw
- ruang kerja, sandbox, dan kebijakan alat
- callback balasan kanal dan callback streaming
- kebijakan fallback model dan pergantian model langsung

Harness menjalankan percobaan yang telah disiapkan; harness tidak memilih penyedia,
menggantikan pengiriman kanal, atau mengganti model secara diam-diam.

### Bootstrap autentikasi yang dikelola harness

Secara default, inti menentukan kredensial penyedia sebelum memanggil harness. Harness
tepercaya yang dapat melakukan autentikasi melalui runtime native-nya sendiri dapat menetapkan
`authBootstrap: "harness"` pada pendaftaran statis `AgentHarness` miliknya. Inti kemudian
melewati bootstrap kredensial penyedia generiknya dan kegagalan karena kredensial tidak tersedia
untuk setiap percobaan yang diklaim oleh harness tersebut.

Inti tetap meneruskan profil autentikasi OpenClaw yang kompatibel dan dipilih atau
diurutkan secara eksplisit beserta penyimpanan tercakupnya jika tersedia. Harness harus
menentukan profil tersebut atau kredensial native-nya sebelum mengirim permintaan model,
menjaga rahasia tetap tercakup pada percobaan, dan menampilkan kegagalan autentikasi yang
dapat ditindaklanjuti. Jangan tetapkan kapabilitas ini pada harness yang hanya terkadang
mengelola autentikasi.

### Artefak runtime penyiapan terverifikasi

Harness lokal yang dapat menyediakan inferensi untuk penyiapan pertama kali harus mengesahkan
implementasi yang menyelesaikan pemeriksaan. Ketika
`params.captureRuntimeArtifact` bernilai true, kembalikan
`result.runtimeArtifact` buram dengan id stabil dan sidik jari konten. Daftarkan
kapabilitas `runtimeArtifact.validate(...)` yang cocok untuk memeriksa ulang ikatan tersebut
tanpa memuat harness lain atau memindai plugin yang tidak terkait.

Kelanjutan OpenClaw terverifikasi juga meneruskan `params.expectedRuntimeArtifact`.
Harness harus membandingkannya dengan proses native yang tepat yang diperolehnya dan gagal
sebelum memulai atau melanjutkan thread native jika keduanya berbeda. Giliran agen
biasa menghilangkan kedua kolom tersebut, sehingga hashing konten tidak memasuki jalur panas
permintaan normal. Harness jarak jauh/WebSocket memerlukan kontrak pengesahan server sebelum
dapat berpartisipasi; string versi saja bukan identitas artefak.

Percobaan yang telah disiapkan juga mencakup `params.runtimePlan`, yaitu paket kebijakan
yang dikelola OpenClaw untuk keputusan runtime yang harus tetap dibagikan antara OpenClaw dan
harness native:

- `runtimePlan.tools.normalize(...)` dan `runtimePlan.tools.logDiagnostics(...)`
  untuk kebijakan skema alat yang memperhitungkan penyedia
- `runtimePlan.transcript.resolvePolicy(...)` untuk sanitasi transkrip dan
  kebijakan perbaikan pemanggilan alat
- `runtimePlan.delivery.isSilentPayload(...)` untuk `NO_REPLY` bersama dan
  penekanan pengiriman media
- `runtimePlan.outcome.classifyRunResult(...)` untuk klasifikasi fallback
  model
- `runtimePlan.observability` untuk metadata penyedia/model/harness yang telah ditentukan

Harness dapat menggunakan rencana tersebut untuk keputusan yang harus sesuai dengan perilaku
OpenClaw, tetapi perlakukan sebagai status percobaan yang dikelola host: jangan mengubahnya
atau menggunakannya untuk mengganti penyedia/model di dalam satu giliran.

### Kontrak transportasi permintaan

`supports(ctx)` menerima transportasi model yang telah ditentukan dalam `ctx.modelProvider`.
Dua fakta tanpa rahasia yang dikelola penyedia menjelaskan rute yang dipilih:

- `runtimePolicy.compatibleIds` mencantumkan id runtime yang dinyatakan penyedia
  kompatibel dengan rute konkret tersebut. Tidak adanya kebijakan berarti penyedia tidak
  menyatakan kompatibilitas tingkat rute; ini bukan izin untuk mengasumsikan dukungan.
- `requestTransportOverrides: "none"` berarti tidak ada penggantian permintaan
  penyedia/model yang dibuat secara eksplisit yang harus direproduksi. `"present"` berarti terdapat
  header yang dibuat secara eksplisit, transportasi autentikasi, proksi, TLS, layanan lokal,
  perilaku jaringan privat, atau parameter permintaan. Fakta tersebut tidak mengekspos
  nilai-nilai itu.

Kembalikan `{ supported: false, reason }` ketika harness tidak dapat mereproduksi
transportasi yang telah disiapkan. Jangan menyimpulkan dukungan dengan membaca konfigurasi mentah setelah pemilihan.
Ketika penyiapan autentikasi menghasilkan beberapa rute percobaan ulang, satu harness harus mendukung
semuanya sebelum pengiriman. Pemilihan implisit menggunakan OpenClaw jika tidak ada plugin yang dapat
mengelola seluruh rangkaian; pemilihan plugin yang eksplisit atau tersimpan akan gagal secara tertutup.

## Mendaftarkan harness

**Impor:** `openclaw/plugin-sdk/agent-harness`

```typescript
import type { AgentHarness } from "openclaw/plugin-sdk/agent-harness";
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

const myHarness: AgentHarness = {
  id: "my-harness",
  label: "Harness agen native saya",

  supports(ctx) {
    const routeSupportsHarness =
      ctx.modelProvider?.runtimePolicy?.compatibleIds.includes("my-harness") === true;
    const canReproduceRequest = ctx.modelProvider?.requestTransportOverrides !== "present";
    return ctx.provider === "my-provider" && routeSupportsHarness && canReproduceRequest
      ? { supported: true, priority: 100 }
      : { supported: false, reason: "rute efektif tidak kompatibel dengan harness" };
  },

  async runAttempt(params) {
    // Mulai atau lanjutkan thread native Anda.
    // Gunakan params.prompt, params.tools, params.images, params.onPartialReply,
    // params.onAgentEvent, dan kolom percobaan lain yang telah disiapkan.
    return await runMyNativeTurn(params);
  },
};

export default definePluginEntry({
  id: "my-native-agent",
  name: "Agen Native Saya",
  description: "Menjalankan model yang dipilih melalui daemon agen native.",
  register(api) {
    api.registerAgentHarness(myHarness);
  },
});
```

`authBootstrap` sengaja tidak disertakan dalam contoh generik ini. Tambahkan
`authBootstrap: "harness"` hanya ketika harness memenuhi kontrak di atas.

### Eksekusi yang didelegasikan

Pemilik harness dapat menetapkan `delegatedExecutionPluginIds` ke id plugin
tepercaya yang perlu mengeksekusi sesi terkunci-model yang sudah ada, seperti transportasi
suara yang melanjutkan percakapan berbasis Codex. Ini adalah persetujuan statis pemilik,
bukan daftar izin inti. Pertahankan cakupannya tetap sempit.

Delegasi hanya menerima penerimaan pekerjaan dan eksekusi tertanam. OpenClaw memerlukan
kunci sesi, jalur penyimpanan, dan id sesi tersimpan yang tepat; `modelSelectionLocked:
true`; serta nilai `agentHarnessId` dan `agentHarnessRuntimeOverride` yang cocok.
Eksekusi kemudian dicakup melalui pemilik harness. Pembuatan, penambalan,
pengaturan ulang, penghapusan, pengarsipan sesi, dan mutasi Gateway tetap hanya dapat dilakukan pemilik.

## Kebijakan pemilihan

OpenClaw memilih harness setelah penentuan penyedia/model:

1. Kebijakan runtime tercakup-model memiliki prioritas.
2. Kebijakan runtime tercakup-penyedia berada di urutan berikutnya.
3. `auto` menanyakan kepada harness terdaftar apakah mereka mendukung rute efektif
   yang telah ditentukan. Awalan penyedia/model saja tidak pernah memilih harness.
4. Jika tidak ada harness terdaftar yang cocok, OpenClaw menggunakan runtime tertanamnya.

Kegagalan harness plugin ditampilkan sebagai kegagalan eksekusi. Dalam mode `auto`,
fallback tertanam hanya berlaku ketika tidak ada harness plugin terdaftar yang mendukung
penyedia/model yang telah ditentukan. Setelah harness plugin mengklaim suatu eksekusi, OpenClaw tidak
memutar ulang giliran yang sama melalui runtime lain karena hal tersebut dapat mengubah
semantik autentikasi/runtime atau menduplikasi efek samping.

Kebijakan runtime yang dikonfigurasi tetap menjadi otoritas untuk runtime yang diinginkan. Sesi
tersimpan `agentHarnessId` mempertahankan kepemilikan transkrip native-nya
selagi penyiapan rute/autentikasi masih berlangsung. Keduanya tidak membuat rute yang tidak kompatibel
menjadi kompatibel: setelah fakta yang disiapkan tersedia, harness yang dipilih atau disematkan
harus mendukungnya atau eksekusi akan gagal secara tertutup. `/status` menampilkan runtime efektif
yang dipilih berdasarkan kebijakan, kepemilikan tersimpan, dan dukungan rute.
Status yang disiapkan bersifat eksplisit: `runtimePolicy` yang tidak tersedia tetap tidak dinyatakan,
alih-alih disimpulkan dari kolom transportasi apa pun yang kebetulan tersedia.
Ketika autentikasi yang dikelola harness membiarkan beberapa rute fisik belum ditentukan,
fakta dukungan yang disiapkan merupakan irisan id runtime kompatibel dari rute-rute tersebut dan
melaporkan penggantian permintaan jika kandidat mana pun memilikinya. Oleh karena itu, satu kandidat
yang tidak dinyatakan membuat kompatibilitas native kosong; `preparedAuth.source: "harness"`
adalah pemilik autentikasi, bukan izin untuk menyimpulkan dukungan rute.

Jika harness yang dipilih tidak sesuai dugaan, aktifkan pencatatan log debug `agents/harness`
dan periksa catatan terstruktur `agent harness selected` milik gateway: catatan tersebut
mencakup id harness yang dipilih, alasan pemilihan, kebijakan runtime/fallback,
dan, dalam mode `auto`, hasil dukungan setiap kandidat plugin.

Plugin Codex bawaan mendaftarkan `codex` sebagai id harness-nya. Inti memperlakukan
id tersebut sebagai id harness plugin biasa; alias khusus Codex berada di plugin
atau konfigurasi operator, bukan di pemilih runtime bersama.

## Pemasangan penyedia dan harness

Sebagian besar harness juga sebaiknya mendaftarkan penyedia. Penyedia membuat referensi model,
status autentikasi, metadata model, dan pemilihan `/model` terlihat oleh bagian lain
OpenClaw. Harness kemudian mengklaim penyedia tersebut dalam `supports(...)`.

Plugin Codex bawaan mengikuti pola ini:

- referensi model pengguna yang disarankan: `openai/gpt-5.6-sol`
- referensi kompatibilitas: referensi lama `codex/gpt-*` tetap diterima, tetapi konfigurasi
  baru tidak boleh menggunakannya sebagai referensi penyedia/model normal
- id harness: `codex`
- autentikasi: ketersediaan penyedia sintetis karena harness Codex mengelola
  login/sesi Codex native
- permintaan app-server: OpenClaw mengirim id model polos ke Codex dan membiarkan
  harness berkomunikasi dengan protokol app-server native

Plugin Codex bersifat aditif. Ketika kebijakan runtime tidak ditetapkan atau `auto`,
OpenAI dapat memilih Codex hanya ketika kontrak rute yang dikelola penyedianya menyatakan
`codex` kompatibel: rute resmi HTTPS Platform Responses atau ChatGPT Responses
yang tepat tanpa penggantian permintaan yang dibuat secara eksplisit. Awalan `openai/*` saja tidak pernah
memilih Codex. Endpoint khusus, adaptor Completions, dan perilaku permintaan yang dibuat secara eksplisit
tetap menggunakan OpenClaw. Endpoint HTTP resmi tanpa enkripsi ditolak. Referensi lama `codex/gpt-*`
tetap menjadi input kompatibilitas. Lihat
[Runtime agen implisit OpenAI](/id/providers/openai#implicit-agent-runtime).

Untuk penyiapan operator, contoh awalan model, dan konfigurasi khusus Codex, lihat
[Harness Codex](/id/plugins/codex-harness).

Plugin Codex memberlakukan versi app-server minimum yang didokumentasikan dalam
[Harness Codex](/id/plugins/codex-harness). Plugin ini memeriksa handshake inisialisasi dan
memblokir server lama atau tanpa versi, sehingga OpenClaw hanya berjalan pada permukaan
protokol yang telah diuji.

### Middleware hasil alat

Plugin bawaan dan plugin terinstal yang diaktifkan secara eksplisit dengan kontrak
manifes yang cocok dapat melampirkan middleware hasil alat yang netral terhadap runtime melalui
`api.registerAgentToolResultMiddleware(...)` ketika manifesnya menyatakan
id runtime yang ditargetkan dalam `contracts.agentToolResultMiddleware`. Seam tepercaya ini
ditujukan untuk transformasi hasil alat asinkron yang harus dijalankan sebelum OpenClaw atau
Codex memasukkan kembali keluaran alat ke dalam model.

Plugin bawaan lama masih dapat menggunakan
`api.registerCodexAppServerExtensionFactory(...)` untuk middleware khusus app-server Codex,
tetapi transformasi hasil baru harus menggunakan API yang netral terhadap runtime. Hook
`api.registerEmbeddedExtensionFactory(...)` yang khusus untuk embedded runner telah
dihapus; transformasi hasil alat tertanam harus menggunakan middleware yang netral terhadap runtime.

### Klasifikasi hasil terminal

Harness native yang memiliki proyeksi protokolnya sendiri dapat menggunakan
`classifyAgentHarnessTerminalOutcome(...)` dari
`openclaw/plugin-sdk/agent-harness-runtime` ketika giliran yang selesai tidak menghasilkan
teks asisten yang terlihat. Pembantu ini mengembalikan `empty`, `reasoning-only`, atau
`planning-only` agar kebijakan fallback OpenClaw dapat memutuskan apakah akan mencoba ulang dengan
model lain. `planning-only` memerlukan bidang `planText` eksplisit
milik harness; OpenClaw tidak menyimpulkannya dari prosa asisten. Pembantu ini
secara sengaja tidak mengklasifikasikan kesalahan prompt, giliran yang sedang berlangsung, dan
balasan yang sengaja dibuat senyap seperti `NO_REPLY`.

### Efek samping akhir agen

Harness native harus memanggil `runAgentEndSideEffects(...)` dari
`openclaw/plugin-sdk/agent-harness-runtime` setelah menyelesaikan suatu percobaan. Fungsi ini
menjalankan hook portabel `agent_end` dan pengambilan riset OpenClaw
tanpa menunda balasan interaktif. Gunakan `awaitAgentEndSideEffects(...)` untuk
proses lokal noninteraktif ketika percobaan tidak boleh diselesaikan hingga
efek samping tersebut selesai. Kedua pembantu menerima payload `{ event, ctx }` yang sama dengan
`runAgentHarnessAgentEndHook(...)`; kegagalannya tidak mengubah hasil
percobaan yang telah selesai.

### Permukaan input pengguna dan alat

Harness native yang mengekspos permintaan input pengguna pada tingkat runtime harus menggunakan
pembantu input pengguna dari `openclaw/plugin-sdk/agent-harness-runtime` untuk memformat
prompt, mengirimkannya melalui jalur balasan pemblokiran OpenClaw, dan menormalkan
jawaban pilihan/bentuk bebas kembali ke bentuk respons native runtime. Pembantu ini
menjaga konsistensi penyajian kanal/TUI sementara setiap harness mempertahankan
penguraian protokol dan siklus hidup permintaan tertundanya sendiri.

Harness native yang memerlukan perutean alat ringkas seperti PI harus menggunakan
`createAgentHarnessToolSurfaceRuntime(...)` dari
`openclaw/plugin-sdk/agent-harness-tool-runtime`. Pembantu ini menangani
pemilihan kontrol pencarian alat/mode kode, default ramping untuk model lokal,
pemfilteran skema yang kompatibel dengan runtime, eksekusi katalog tersembunyi, hidrasi
direktori, dan pembersihan katalog. Harness tetap menangani konversi alat
khusus SDK dan callback eksekusi nativenya sendiri.

### Mode harness Codex native

Harness bawaan `codex` adalah mode Codex native untuk giliran agen OpenClaw
tertanam. Aktifkan Plugin bawaan `codex` terlebih dahulu, dan sertakan `codex` dalam
`plugins.allow` jika konfigurasi Anda menggunakan daftar izin yang ketat. Konfigurasi app-server
native harus menggunakan `openai/gpt-*`; giliran agen OpenAI memilih harness Codex
hanya ketika rute efektif menyatakan kompatibilitas Codex. Referensi model Codex
lama harus diperbaiki dengan `openclaw doctor --fix`, dan referensi model `codex/*`
lama tetap menjadi alias kompatibilitas untuk harness native.

Ketika mode ini berjalan, Codex menangani id utas native, perilaku pelanjutan,
Compaction, dan eksekusi app-server. OpenClaw tetap menangani kanal percakapan,
cerminan transkrip yang terlihat, kebijakan alat, persetujuan, pengiriman media, dan pemilihan
sesi. Gunakan penyedia/model `agentRuntime.id: "codex"` ketika Anda perlu
membuktikan bahwa hanya jalur app-server Codex yang dapat mengambil alih proses. Runtime Plugin
eksplisit gagal secara tertutup; kegagalan pemilihan app-server Codex dan kegagalan runtime
tidak dicoba ulang melalui runtime lain.

## Ketegasan runtime

Secara default, OpenClaw menggunakan kebijakan runtime penyedia/model `auto`: harness
Plugin yang terdaftar dapat mengambil alih rute efektif yang kompatibel, dan runtime
tertanam menangani giliran ketika tidak ada yang cocok. Prefiks penyedia/model saja tidak pernah
memilih harness. Gunakan runtime Plugin penyedia/model eksplisit seperti
`agentRuntime.id: "codex"` ketika ketiadaan pemilihan harness harus menyebabkan kegagalan,
bukan perutean melalui runtime tertanam. Pemilihan eksplisit tidak membuat
rute yang tidak kompatibel menjadi kompatibel. Kegagalan harness Plugin yang dipilih selalu
menyebabkan kegagalan keras. Hal ini tidak memblokir
`agentRuntime.id: "openclaw"` penyedia/model eksplisit.

Untuk proses tertanam khusus Codex:

```json
{
  "models": {
    "providers": {
      "openai": {
        "agentRuntime": {
          "id": "codex"
        }
      }
    }
  },
  "agents": {
    "defaults": {
      "model": "openai/gpt-5.6-sol"
    }
  }
}
```

Jika Anda menginginkan backend CLI untuk satu model kanonis, tempatkan runtime pada
entri model tersebut:

```json
{
  "agents": {
    "defaults": {
      "model": "anthropic/claude-opus-4-8",
      "models": {
        "anthropic/claude-opus-4-8": {
          "agentRuntime": {
            "id": "claude-cli"
          }
        }
      }
    }
  }
}
```

Penimpaan per agen menggunakan bentuk dengan cakupan model yang sama:

```json
{
  "agents": {
    "list": [
      {
        "id": "codex-only",
        "model": "openai/gpt-5.6-sol",
        "models": {
          "openai/gpt-5.6-sol": {
            "agentRuntime": { "id": "codex" }
          }
        }
      }
    ]
  }
}
```

Contoh runtime seluruh agen lama seperti berikut diabaikan:

```json
{
  "agents": {
    "defaults": {
      "agentRuntime": {
        "id": "codex"
      }
    }
  }
}
```

Dengan runtime Plugin eksplisit, sesi gagal lebih awal ketika harness yang diminta
tidak terdaftar, tidak mendukung penyedia/model yang telah diselesaikan, atau
gagal sebelum menghasilkan efek samping giliran. Hal tersebut disengaja untuk deployment khusus
Codex dan untuk pengujian langsung yang harus membuktikan bahwa jalur app-server Codex
benar-benar digunakan.

Pengaturan ini hanya mengontrol harness agen tertanam. Pengaturan ini tidak menonaktifkan
perutean model khusus penyedia untuk gambar, video, musik, TTS, PDF, atau lainnya.

## Sesi native dan cerminan transkrip

Harness dapat menyimpan id sesi native, id utas, atau token pelanjutan
di sisi daemon. Pertahankan pengikatan tersebut agar secara eksplisit terkait dengan sesi OpenClaw, dan
terus cerminkan keluaran asisten/alat yang terlihat oleh pengguna ke dalam
transkrip OpenClaw.

Transkrip OpenClaw tetap menjadi lapisan kompatibilitas untuk:

- riwayat sesi yang terlihat di kanal
- pencarian dan pengindeksan transkrip
- beralih kembali ke harness bawaan OpenClaw pada giliran berikutnya
- perilaku generik `/new`, `/reset`, dan penghapusan sesi

Jika harness Anda menyimpan pengikatan sidecar, implementasikan `reset(...)` agar OpenClaw
dapat menghapusnya ketika sesi OpenClaw pemiliknya diatur ulang.

## Hasil alat dan media

Inti menyusun daftar alat OpenClaw dan meneruskannya ke
percobaan yang telah disiapkan. Ketika harness menjalankan panggilan alat dinamis, kembalikan hasil alat
melalui bentuk hasil harness, bukan dengan mengirimkan media kanal
sendiri.

Hal ini menjaga keluaran teks, gambar, video, musik, TTS, persetujuan, dan alat perpesanan
pada jalur pengiriman yang sama dengan proses yang didukung OpenClaw.

Tetapkan `AgentHarnessAttemptResult.hostOwnedToolMediaUrls` hanya untuk artefak native
yang dibuat dan disimpan sendiri oleh runtime harness tepercaya. Setiap entri juga harus
muncul dalam `toolMediaUrls`. Jangan pernah menyertakan media alat dinamis yang dipilih model atau
alat OpenClaw. Pada rute `message_tool_only`, asal-usul terbatas ini memungkinkan
artefak runtime native bertahan dari penekanan balasan sumber; kebijakan pengiriman normal
dan penerimaan ruang sekitar tetap berlaku.

### Hasil alat terminal

`AgentHarnessAttemptParams.observeToolTerminal` adalah akumulator hasil terminal
yang dikelola host. Harness yang menjalankan alat dinamis OpenClaw atau alat native
harus memanggilnya ketika setiap alat mencapai satu hasil terminal, sebelum
hasil percobaan diselesaikan. Harness yang tidak menjalankan alat tidak perlu
memanggilnya.

Laporkan fakta dari batas eksekusi:

- Teruskan id panggilan protokol jika ada, nama alat kanonis, dan
  argumen yang benar-benar mencapai alat setelah persiapan atau penulisan ulang hook.
- Tetapkan `executionStarted: false` ketika validasi, persetujuan, atau pengaman lain
  menghentikan panggilan sebelum implementasi alat dimulai. Setelah dispatch mungkin
  terjadi, laporkan `true` secara konservatif.
- Laporkan `outcome: "success"` atau `outcome: "failure"`. Sertakan bidang kegagalan
  terstruktur yang tersedia dari runtime, bukan menyimpulkan kegagalan dari
  teks tampilan.
- Gunakan `nativeMutation` hanya untuk alat native yang tidak menggunakan definisi alat
  OpenClaw. Berikan fakta mutasi dan pemutaran ulang yang dikelola protokol di sana; jangan
  menyalin pengklasifikasi mutasi OpenClaw ke dalam harness.

Callback mengembalikan resolusi kanonis untuk panggilan tersebut. Bawa
`lastToolError` miliknya ke dalam `AgentHarnessAttemptResult` dan gunakan fakta eksekusi,
argumen, serta efek sampingnya dalam proyeksi harness, bukan menurunkan
status paralel. Host mempertahankan kegagalan mutasi yang belum terselesaikan di seluruh alat
berhasil yang tidak terkait dan hanya menghapusnya setelah tindakan yang cocok berhasil.

Callback tetap opsional demi kompatibilitas sumber dengan harness eksperimental
lama. Opsional bukan berarti dapat diabaikan untuk harness yang menjalankan alat:
tanpa laporan terminal, OpenClaw tidak dapat mempertahankan kebenaran kegagalan alat mutasi
di seluruh panggilan alat berikutnya, termasuk penyelesaian Heartbeat senyap.

## Keterbatasan saat ini

- Jalur impor publik bersifat generik, tetapi beberapa alias tipe percobaan/hasil
  masih menggunakan nama lama demi kompatibilitas.
- Instalasi harness pihak ketiga bersifat eksperimental. Utamakan Plugin penyedia
  hingga Anda memerlukan runtime sesi native.
- Pergantian harness didukung antargiliran. Jangan mengganti harness di
  tengah giliran setelah alat native, persetujuan, teks asisten, atau pengiriman
  pesan telah dimulai.

## Terkait

- [Ikhtisar SDK](/id/plugins/sdk-overview)
- [Pembantu Runtime](/id/plugins/sdk-runtime)
- [Plugin Penyedia](/id/plugins/sdk-provider-plugins)
- [Harness Codex](/id/plugins/codex-harness)
- [Penyedia Model](/id/concepts/model-providers)
