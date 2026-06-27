---
read_when:
    - Anda sedang mengubah runtime agen tertanam atau registri harness
    - Anda sedang mendaftarkan harness agen dari Plugin bawaan atau tepercaya
    - Anda perlu memahami bagaimana Plugin Codex berhubungan dengan penyedia model
sidebarTitle: Agent Harness
summary: Permukaan SDK eksperimental untuk plugin yang menggantikan eksekutor agen tertanam tingkat rendah
title: Plugin harness agen
x-i18n:
    generated_at: "2026-06-27T17:58:13Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a368ae480c31c86c30786f91e5cf451c3489c681be8ee3955c1c2bd55e4b49e9
    source_path: plugins/sdk-agent-harness.md
    workflow: 16
---

**Harness agen** adalah eksekutor level rendah untuk satu giliran agen OpenClaw
yang sudah disiapkan. Ini bukan penyedia model, bukan channel, dan bukan registri tool.
Untuk model mental yang berorientasi pengguna, lihat [Runtime agen](/id/concepts/agent-runtimes).

Gunakan permukaan ini hanya untuk Plugin native bawaan atau tepercaya. Kontraknya
masih eksperimental karena tipe parameternya sengaja mencerminkan runner tertanam
saat ini.

## Kapan menggunakan harness

Daftarkan harness agen ketika keluarga model memiliki runtime sesi native-nya
sendiri dan transport penyedia OpenClaw normal bukan abstraksi yang tepat.

Contoh:

- server agen coding native yang memiliki thread dan Compaction
- CLI lokal atau daemon yang harus melakukan streaming event rencana/penalaran/tool native
- runtime model yang membutuhkan id resume-nya sendiri selain transkrip sesi
  OpenClaw

Jangan **pernah** mendaftarkan harness hanya untuk menambahkan API LLM baru. Untuk API model HTTP atau
WebSocket normal, buat [Plugin penyedia](/id/plugins/sdk-provider-plugins).

## Yang masih dimiliki core

Sebelum harness dipilih, OpenClaw sudah menyelesaikan:

- penyedia dan model
- status autentikasi runtime
- tingkat berpikir dan anggaran konteks
- file transkrip/sesi OpenClaw
- workspace, sandbox, dan kebijakan tool
- callback balasan channel dan callback streaming
- kebijakan fallback model dan pergantian model live

Pemisahan itu disengaja. Harness menjalankan upaya yang sudah disiapkan; harness tidak memilih
penyedia, mengganti pengiriman channel, atau diam-diam mengganti model.

Upaya yang disiapkan juga menyertakan `params.runtimePlan`, bundel kebijakan milik
OpenClaw untuk keputusan runtime yang harus tetap dibagikan di seluruh OpenClaw dan
harness native:

- `runtimePlan.tools.normalize(...)` dan
  `runtimePlan.tools.logDiagnostics(...)` untuk kebijakan skema tool yang sadar penyedia
- `runtimePlan.transcript.resolvePolicy(...)` untuk sanitasi transkrip dan
  kebijakan perbaikan panggilan tool
- `runtimePlan.delivery.isSilentPayload(...)` untuk penekanan pengiriman `NO_REPLY` dan media
  bersama
- `runtimePlan.outcome.classifyRunResult(...)` untuk klasifikasi fallback model
- `runtimePlan.observability` untuk metadata penyedia/model/harness yang sudah diselesaikan

Harness boleh menggunakan rencana untuk keputusan yang perlu cocok dengan perilaku OpenClaw, tetapi
tetap harus memperlakukannya sebagai status upaya milik host. Jangan memutasinya atau menggunakannya
untuk mengganti penyedia/model di dalam satu giliran.

## Mendaftarkan harness

**Impor:** `openclaw/plugin-sdk/agent-harness`

```typescript
import type { AgentHarness } from "openclaw/plugin-sdk/agent-harness";
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

const myHarness: AgentHarness = {
  id: "my-harness",
  label: "My native agent harness",

  supports(ctx) {
    return ctx.provider === "my-provider"
      ? { supported: true, priority: 100 }
      : { supported: false };
  },

  async runAttempt(params) {
    // Start or resume your native thread.
    // Use params.prompt, params.tools, params.images, params.onPartialReply,
    // params.onAgentEvent, and the other prepared attempt fields.
    return await runMyNativeTurn(params);
  },
};

export default definePluginEntry({
  id: "my-native-agent",
  name: "My Native Agent",
  description: "Runs selected models through a native agent daemon.",
  register(api) {
    api.registerAgentHarness(myHarness);
  },
});
```

## Kebijakan pemilihan

OpenClaw memilih harness setelah resolusi penyedia/model:

1. Kebijakan runtime yang dicakup model menang.
2. Kebijakan runtime yang dicakup penyedia menyusul.
3. `auto` menanyakan harness terdaftar apakah mereka mendukung
   penyedia/model yang sudah diselesaikan.
4. Jika tidak ada harness terdaftar yang cocok, OpenClaw menggunakan runtime tertanamnya.

Kegagalan harness Plugin muncul sebagai kegagalan run. Dalam mode `auto`, fallback tertanam
hanya digunakan ketika tidak ada harness Plugin terdaftar yang mendukung
penyedia/model yang sudah diselesaikan. Setelah harness Plugin mengklaim sebuah run, OpenClaw tidak
memutar ulang giliran yang sama melalui runtime lain karena itu dapat mengubah
semantik autentikasi/runtime atau menduplikasi efek samping.

Pin runtime seluruh sesi dan seluruh agen diabaikan oleh pemilihan. Itu
mencakup nilai `agentHarnessId` sesi lama, `agents.defaults.agentRuntime`,
`agents.list[].agentRuntime`, dan `OPENCLAW_AGENT_RUNTIME`. `/status` menampilkan
runtime efektif yang dipilih dari rute penyedia/model.
Jika harness yang dipilih terasa mengejutkan, aktifkan logging debug `agents/harness` dan
periksa catatan terstruktur `agent harness selected` milik gateway. Catatan itu menyertakan
id harness yang dipilih, alasan pemilihan, kebijakan runtime/fallback, dan, dalam
mode `auto`, hasil dukungan setiap kandidat Plugin.

Plugin Codex bawaan mendaftarkan `codex` sebagai id harness-nya. Core memperlakukannya
sebagai id harness Plugin biasa; alias khusus Codex berada di Plugin
atau konfigurasi operator, bukan di pemilih runtime bersama.

## Pemasangan penyedia plus harness

Sebagian besar harness juga harus mendaftarkan penyedia. Penyedia membuat referensi model,
status autentikasi, metadata model, dan pemilihan `/model` terlihat oleh seluruh
OpenClaw. Harness kemudian mengklaim penyedia itu di `supports(...)`.

Plugin Codex bawaan mengikuti pola ini:

- referensi model pengguna pilihan: `openai/gpt-5.5`
- referensi kompatibilitas: referensi lama `codex/gpt-*` tetap diterima, tetapi konfigurasi
  baru sebaiknya tidak menggunakannya sebagai referensi penyedia/model normal
- id harness: `codex`
- autentikasi: ketersediaan penyedia sintetis, karena harness Codex memiliki
  login/sesi Codex native
- permintaan app-server: OpenClaw mengirim id model mentah ke Codex dan membiarkan
  harness berbicara dengan protokol app-server native

Plugin Codex bersifat aditif. Referensi agen `openai/gpt-*` biasa pada penyedia resmi
OpenAI memilih harness Codex secara default. Referensi `codex/gpt-*` lama
masih memilih penyedia dan harness Codex untuk kompatibilitas.

Untuk penyiapan operator, contoh prefiks model, dan konfigurasi khusus Codex, lihat
[Harness Codex](/id/plugins/codex-harness).

OpenClaw memerlukan app-server Codex `0.125.0` atau yang lebih baru. Plugin Codex memeriksa
handshake inisialisasi app-server dan memblokir server lama atau tanpa versi sehingga
OpenClaw hanya berjalan terhadap permukaan protokol yang sudah diuji. Batas bawah
`0.125.0` mencakup dukungan payload hook MCP native yang hadir di
Codex `0.124.0`, sekaligus mem-pin OpenClaw ke lini stabil lebih baru yang sudah diuji.

### Middleware hasil tool

Plugin bawaan dan Plugin terinstal yang diaktifkan secara eksplisit dengan kontrak manifes
yang cocok dapat memasang middleware hasil tool yang netral runtime melalui
`api.registerAgentToolResultMiddleware(...)` ketika manifesnya mendeklarasikan
id runtime target di `contracts.agentToolResultMiddleware`. Seam tepercaya ini
ditujukan untuk transformasi hasil tool async yang harus berjalan sebelum OpenClaw atau Codex
memberikan output tool kembali ke model.

Plugin bawaan lama masih dapat menggunakan
`api.registerCodexAppServerExtensionFactory(...)` untuk middleware khusus app-server Codex,
tetapi transformasi hasil baru sebaiknya menggunakan API netral runtime.
Hook khusus runner tertanam `api.registerEmbeddedExtensionFactory(...)` telah dihapus;
transformasi hasil tool tertanam harus menggunakan middleware netral runtime.

### Klasifikasi hasil terminal

Harness native yang memiliki proyeksi protokolnya sendiri dapat menggunakan
`classifyAgentHarnessTerminalOutcome(...)` dari
`openclaw/plugin-sdk/agent-harness-runtime` ketika giliran yang selesai tidak menghasilkan
teks asisten yang terlihat. Helper mengembalikan `empty`, `reasoning-only`, atau
`planning-only` sehingga kebijakan fallback OpenClaw dapat memutuskan apakah perlu mencoba ulang pada
model berbeda. `planning-only` memerlukan field `planText` eksplisit dari harness;
OpenClaw tidak menyimpulkannya dari prosa asisten. Helper ini sengaja
membiarkan error prompt, giliran yang sedang berjalan, dan balasan senyap yang disengaja seperti
`NO_REPLY` tidak terklasifikasi.

### Efek samping akhir agen

Harness native harus memanggil `runAgentEndSideEffects(...)` dari
`openclaw/plugin-sdk/agent-harness-runtime` setelah mereka memfinalisasi sebuah upaya. Ini
mengirim hook portabel `agent_end` dan capture riset OpenClaw tanpa
menunda balasan interaktif. Gunakan `awaitAgentEndSideEffects(...)` untuk run lokal
non-interaktif ketika upaya tidak boleh selesai sampai efek samping tersebut
selesai. Kedua helper menerima payload `{ event, ctx }` yang sama seperti
`runAgentHarnessAgentEndHook(...)`; kegagalannya tidak mengubah hasil upaya
yang sudah selesai.

### Input pengguna dan permukaan tool

Harness native yang mengekspos permintaan input pengguna level runtime harus menggunakan
helper input pengguna dari `openclaw/plugin-sdk/agent-harness-runtime` untuk memformat
prompt, mengirimkannya melalui jalur balasan blocking OpenClaw, dan menormalkan
jawaban pilihan/free-form kembali ke bentuk respons native runtime. Helper ini
menjaga presentasi channel/TUI tetap konsisten sementara setiap harness mempertahankan
parsing protokol dan siklus hidup permintaan tertundanya sendiri.

Harness native yang membutuhkan perutean tool ringkas mirip PI harus menggunakan
`createAgentHarnessToolSurfaceRuntime(...)` dari
`openclaw/plugin-sdk/agent-harness-tool-runtime`. Ini memiliki
pemilihan kontrol pencarian-tool/mode-code, default ramping model lokal,
pemfilteran skema yang kompatibel dengan runtime, eksekusi katalog tersembunyi, hidrasi
direktori, dan pembersihan katalog. Harness tetap memiliki konversi tool
khusus SDK dan callback eksekusi native mereka sendiri.

### Mode harness Codex native

Harness `codex` bawaan adalah mode Codex native untuk giliran agen OpenClaw
tertanam. Aktifkan Plugin `codex` bawaan terlebih dahulu, dan sertakan `codex` di
`plugins.allow` jika konfigurasi Anda menggunakan allowlist ketat. Konfigurasi app-server native
harus menggunakan `openai/gpt-*`; giliran agen OpenAI memilih harness Codex
secara default. Rute referensi model Codex lama harus diperbaiki dengan
`openclaw doctor --fix`, dan referensi model `codex/*` lama tetap menjadi alias
kompatibilitas untuk harness native.

Ketika mode ini berjalan, Codex memiliki id thread native, perilaku resume,
Compaction, dan eksekusi app-server. OpenClaw tetap memiliki channel chat,
cermin transkrip yang terlihat, kebijakan tool, approval, pengiriman media, dan pemilihan
sesi. Gunakan penyedia/model `agentRuntime.id: "codex"` ketika Anda perlu membuktikan
bahwa hanya jalur app-server Codex yang dapat mengklaim run. Runtime Plugin eksplisit
gagal secara tertutup; kegagalan pemilihan app-server Codex dan kegagalan runtime tidak
dicoba ulang melalui runtime lain.

## Ketegasan runtime

Secara default, OpenClaw menggunakan kebijakan runtime penyedia/model `auto`: harness
Plugin terdaftar dapat mengklaim pasangan penyedia/model, dan runtime tertanam
menangani giliran ketika tidak ada yang cocok. Referensi agen OpenAI pada penyedia resmi OpenAI default ke Codex.
Gunakan runtime Plugin penyedia/model eksplisit seperti
`agentRuntime.id: "codex"` ketika pemilihan harness yang hilang harus gagal alih-alih
dirutekan melalui runtime tertanam. Kegagalan harness Plugin terpilih selalu
gagal keras. Ini tidak memblokir `agentRuntime.id: "openclaw"` penyedia/model eksplisit.

Untuk run tertanam khusus Codex:

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
      "model": "openai/gpt-5.5"
    }
  }
}
```

Jika Anda menginginkan backend CLI untuk satu model kanonis, letakkan runtime pada
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

Override per agen menggunakan bentuk bercakupan model yang sama:

```json
{
  "agents": {
    "list": [
      {
        "id": "codex-only",
        "model": "openai/gpt-5.5",
        "models": {
          "openai/gpt-5.5": {
            "agentRuntime": { "id": "codex" }
          }
        }
      }
    ]
  }
}
```

Contoh runtime seluruh agen lama seperti ini diabaikan:

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

Dengan runtime Plugin eksplisit, sebuah sesi gagal lebih awal ketika harness yang diminta tidak terdaftar, tidak mendukung penyedia/model yang diselesaikan, atau gagal sebelum menghasilkan efek samping giliran. Ini disengaja untuk deployment khusus Codex dan untuk pengujian langsung yang harus membuktikan bahwa jalur app-server Codex benar-benar digunakan.

Pengaturan ini hanya mengontrol harness agen tertanam. Ini tidak menonaktifkan perutean model khusus penyedia untuk gambar, video, musik, TTS, PDF, atau lainnya.

## Sesi asli dan pencerminan transkrip

Sebuah harness dapat menyimpan id sesi asli, id utas, atau token lanjutkan di sisi daemon. Jaga agar pengikatan itu secara eksplisit dikaitkan dengan sesi OpenClaw, dan terus cerminkan keluaran asisten/alat yang terlihat pengguna ke dalam transkrip OpenClaw.

Transkrip OpenClaw tetap menjadi lapisan kompatibilitas untuk:

- riwayat sesi yang terlihat di kanal
- pencarian dan pengindeksan transkrip
- beralih kembali ke harness bawaan OpenClaw pada giliran berikutnya
- perilaku umum `/new`, `/reset`, dan penghapusan sesi

Jika harness Anda menyimpan pengikatan pendamping, implementasikan `reset(...)` agar OpenClaw dapat menghapusnya ketika sesi OpenClaw pemilik direset.

## Hasil alat dan media

Core menyusun daftar alat OpenClaw dan meneruskannya ke percobaan yang disiapkan. Ketika sebuah harness menjalankan panggilan alat dinamis, kembalikan hasil alat melalui bentuk hasil harness alih-alih mengirim media kanal sendiri.

Ini menjaga keluaran teks, gambar, video, musik, TTS, persetujuan, dan alat perpesanan pada jalur pengiriman yang sama seperti proses yang didukung OpenClaw.

## Batasan saat ini

- Jalur impor publik bersifat generik, tetapi beberapa alias tipe percobaan/hasil masih membawa nama lama untuk kompatibilitas.
- Instalasi harness pihak ketiga masih eksperimental. Utamakan Plugin penyedia sampai Anda membutuhkan runtime sesi asli.
- Pergantian harness didukung antar-giliran. Jangan mengganti harness di tengah giliran setelah alat asli, persetujuan, teks asisten, atau pengiriman pesan dimulai.

## Terkait

- [Ikhtisar SDK](/id/plugins/sdk-overview)
- [Helper Runtime](/id/plugins/sdk-runtime)
- [Plugin Penyedia](/id/plugins/sdk-provider-plugins)
- [Harness Codex](/id/plugins/codex-harness)
- [Penyedia Model](/id/concepts/model-providers)
