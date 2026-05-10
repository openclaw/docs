---
read_when:
    - Anda sedang mengubah lingkungan eksekusi agen tertanam atau registri rangka uji
    - Anda sedang mendaftarkan harness agen dari Plugin bawaan atau tepercaya
    - Anda perlu memahami bagaimana Plugin Codex berkaitan dengan penyedia model
sidebarTitle: Agent Harness
summary: Antarmuka SDK eksperimental untuk Plugin yang menggantikan eksekutor agen tertanam tingkat rendah
title: Plugin harness agen
x-i18n:
    generated_at: "2026-05-10T19:46:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1685af479a8502ac743b0f520f0afae2cdc905524e48b3a84ce95ffe85c8fb49
    source_path: plugins/sdk-agent-harness.md
    workflow: 16
---

Sebuah **pelaksana agen** adalah eksekutor tingkat rendah untuk satu giliran agen
OpenClaw yang sudah disiapkan. Ini bukan penyedia model, bukan channel, dan
bukan registri alat. Untuk model mental yang terlihat oleh pengguna, lihat
[Runtime agen](/id/concepts/agent-runtimes).

Gunakan permukaan ini hanya untuk Plugin native bawaan atau tepercaya. Kontraknya
masih eksperimental karena tipe parameternya sengaja mencerminkan runner
tertanam saat ini.

## Kapan menggunakan pelaksana

Daftarkan pelaksana agen ketika sebuah keluarga model memiliki runtime sesi
native-nya sendiri dan transport penyedia OpenClaw normal adalah abstraksi yang
keliru.

Contoh:

- server agen pengodean native yang memiliki thread dan Compaction
- CLI atau daemon lokal yang harus melakukan streaming event rencana/penalaran/alat native
- runtime model yang memerlukan id resume sendiri selain transkrip sesi
  OpenClaw

Jangan daftarkan pelaksana hanya untuk menambahkan API LLM baru. Untuk API model
HTTP atau WebSocket normal, bangun [Plugin penyedia](/id/plugins/sdk-provider-plugins).

## Yang tetap dimiliki core

Sebelum pelaksana dipilih, OpenClaw sudah menyelesaikan:

- penyedia dan model
- status auth runtime
- tingkat berpikir dan anggaran konteks
- file transkrip/sesi OpenClaw
- workspace, sandbox, dan kebijakan alat
- callback balasan channel dan callback streaming
- fallback model dan kebijakan pergantian model live

Pemisahan itu disengaja. Pelaksana menjalankan percobaan yang sudah disiapkan;
ia tidak memilih penyedia, mengganti pengiriman channel, atau diam-diam
mengganti model.

Percobaan yang disiapkan juga menyertakan `params.runtimePlan`, bundel
kebijakan milik OpenClaw untuk keputusan runtime yang harus tetap dibagikan di
seluruh pelaksana PI dan native:

- `runtimePlan.tools.normalize(...)` dan
  `runtimePlan.tools.logDiagnostics(...)` untuk kebijakan skema alat yang sadar penyedia
- `runtimePlan.transcript.resolvePolicy(...)` untuk sanitasi transkrip dan
  kebijakan perbaikan panggilan alat
- `runtimePlan.delivery.isSilentPayload(...)` untuk `NO_REPLY` bersama dan
  penekanan pengiriman media
- `runtimePlan.outcome.classifyRunResult(...)` untuk klasifikasi fallback model
- `runtimePlan.observability` untuk metadata penyedia/model/pelaksana yang sudah diselesaikan

Pelaksana dapat menggunakan rencana tersebut untuk keputusan yang perlu cocok
dengan perilaku PI, tetapi tetap harus memperlakukannya sebagai status percobaan
milik host. Jangan mutasi rencana tersebut atau menggunakannya untuk mengganti
penyedia/model di dalam satu giliran.

## Mendaftarkan pelaksana

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

OpenClaw memilih pelaksana setelah penyedia/model diselesaikan:

1. Kebijakan runtime berbasis model menang.
2. Kebijakan runtime berbasis penyedia berikutnya.
3. `auto` menanyakan pelaksana terdaftar apakah mereka mendukung
   penyedia/model yang sudah diselesaikan.
4. Jika tidak ada pelaksana terdaftar yang cocok, OpenClaw menggunakan PI
   kecuali fallback PI dinonaktifkan.

Kegagalan pelaksana Plugin muncul sebagai kegagalan run. Dalam mode `auto`,
fallback PI hanya digunakan ketika tidak ada pelaksana Plugin terdaftar yang
mendukung penyedia/model yang sudah diselesaikan. Setelah pelaksana Plugin
mengklaim run, OpenClaw tidak memutar ulang giliran yang sama melalui PI karena
itu dapat mengubah semantik auth/runtime atau menduplikasi efek samping.

Pin runtime seluruh sesi dan seluruh agen diabaikan oleh pemilihan. Itu
mencakup nilai `agentHarnessId` sesi lama, `agents.defaults.agentRuntime`,
`agents.list[].agentRuntime`, dan `OPENCLAW_AGENT_RUNTIME`. `/status`
menampilkan runtime efektif yang dipilih dari rute penyedia/model.
Jika pelaksana yang dipilih mengejutkan, aktifkan logging debug
`agents/harness` dan periksa record terstruktur `agent harness selected` milik
Gateway. Record tersebut menyertakan id pelaksana yang dipilih, alasan
pemilihan, kebijakan runtime/fallback, dan, dalam mode `auto`, hasil dukungan
setiap kandidat Plugin.

Plugin Codex bawaan mendaftarkan `codex` sebagai id pelaksananya. Core
memperlakukannya sebagai id pelaksana Plugin biasa; alias khusus Codex berada
di Plugin atau konfigurasi operator, bukan di pemilih runtime bersama.

## Pemasangan penyedia plus pelaksana

Sebagian besar pelaksana juga harus mendaftarkan penyedia. Penyedia membuat ref
model, status auth, metadata model, dan pemilihan `/model` terlihat oleh bagian
OpenClaw lainnya. Pelaksana kemudian mengklaim penyedia tersebut di
`supports(...)`.

Plugin Codex bawaan mengikuti pola ini:

- ref model pengguna yang disukai: `openai/gpt-5.5`
- ref kompatibilitas: ref lama `codex/gpt-*` tetap diterima, tetapi konfigurasi
  baru sebaiknya tidak menggunakannya sebagai ref penyedia/model normal
- id pelaksana: `codex`
- auth: ketersediaan penyedia sintetis, karena pelaksana Codex memiliki login/sesi
  Codex native
- permintaan app-server: OpenClaw mengirim id model mentah ke Codex dan membiarkan
  pelaksana berbicara ke protokol app-server native

Plugin Codex bersifat aditif. Ref agen `openai/gpt-*` biasa pada penyedia resmi
OpenAI memilih pelaksana Codex secara default. Ref lama `codex/gpt-*` tetap
memilih penyedia dan pelaksana Codex untuk kompatibilitas.

Untuk penyiapan operator, contoh prefiks model, dan konfigurasi khusus Codex,
lihat [Pelaksana Codex](/id/plugins/codex-harness).

OpenClaw memerlukan app-server Codex `0.125.0` atau lebih baru. Plugin Codex
memeriksa handshake inisialisasi app-server dan memblokir server yang lebih
lama atau tidak berversi sehingga OpenClaw hanya berjalan terhadap permukaan
protokol yang sudah diuji. Batas bawah `0.125.0` mencakup dukungan payload hook
MCP native yang masuk di Codex `0.124.0`, sekaligus mematok OpenClaw ke lini
stabil lebih baru yang sudah diuji.

### Middleware hasil alat

Plugin bawaan dapat melampirkan middleware hasil alat yang netral runtime
melalui `api.registerAgentToolResultMiddleware(...)` ketika manifestnya
mendeklarasikan id runtime target di `contracts.agentToolResultMiddleware`.
Seam tepercaya ini untuk transformasi hasil alat asinkron yang harus berjalan
sebelum PI atau Codex memberi keluaran alat kembali ke model.

Plugin bawaan lama masih dapat menggunakan
`api.registerCodexAppServerExtensionFactory(...)` untuk middleware khusus
app-server Codex, tetapi transformasi hasil baru sebaiknya menggunakan API
netral runtime. Hook khusus Pi `api.registerEmbeddedExtensionFactory(...)`
telah dihapus; transformasi hasil alat Pi harus menggunakan middleware netral
runtime.

### Klasifikasi hasil terminal

Pelaksana native yang memiliki proyeksi protokolnya sendiri dapat menggunakan
`classifyAgentHarnessTerminalOutcome(...)` dari
`openclaw/plugin-sdk/agent-harness-runtime` ketika giliran yang selesai tidak
menghasilkan teks asisten yang terlihat. Helper mengembalikan `empty`,
`reasoning-only`, atau `planning-only` sehingga kebijakan fallback OpenClaw dapat
memutuskan apakah akan mencoba ulang pada model berbeda. Secara sengaja ini
membiarkan error prompt, giliran yang masih berlangsung, dan balasan diam yang
disengaja seperti `NO_REPLY` tanpa klasifikasi.

### Mode pelaksana Codex native

Pelaksana `codex` bawaan adalah mode Codex native untuk giliran agen OpenClaw
tertanam. Aktifkan Plugin `codex` bawaan terlebih dahulu, dan sertakan `codex`
di `plugins.allow` jika konfigurasi Anda menggunakan allowlist yang restriktif.
Konfigurasi app-server native sebaiknya menggunakan `openai/gpt-*`; giliran
agen OpenAI memilih pelaksana Codex secara default. Rute lama `openai-codex/*`
sebaiknya diperbaiki dengan `openclaw doctor --fix`, dan ref model lama
`codex/*` tetap menjadi alias kompatibilitas untuk pelaksana native.

Saat mode ini berjalan, Codex memiliki id thread native, perilaku resume,
Compaction, dan eksekusi app-server. OpenClaw tetap memiliki channel chat,
mirror transkrip yang terlihat, kebijakan alat, persetujuan, pengiriman media,
dan pemilihan sesi. Gunakan penyedia/model `agentRuntime.id: "codex"` ketika
Anda perlu membuktikan bahwa hanya jalur app-server Codex yang dapat mengklaim
run. Runtime Plugin eksplisit gagal tertutup; kegagalan pemilihan app-server
Codex dan kegagalan runtime tidak dicoba ulang melalui PI.

## Kekakuan runtime

Secara default, OpenClaw menggunakan kebijakan runtime penyedia/model `auto`:
pelaksana Plugin terdaftar dapat mengklaim pasangan penyedia/model, dan PI
menangani giliran ketika tidak ada yang cocok. Ref agen OpenAI pada penyedia
resmi OpenAI default ke Codex. Gunakan runtime Plugin penyedia/model eksplisit
seperti `agentRuntime.id: "codex"` ketika pemilihan pelaksana yang hilang harus
gagal alih-alih dirutekan melalui PI. Kegagalan pelaksana Plugin yang dipilih
selalu gagal keras. Ini tidak memblokir `agentRuntime.id: "pi"` penyedia/model
eksplisit.

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

Jika Anda menginginkan backend CLI untuk satu model kanonik, taruh runtime pada
entri model tersebut:

```json
{
  "agents": {
    "defaults": {
      "model": "anthropic/claude-opus-4-7",
      "models": {
        "anthropic/claude-opus-4-7": {
          "agentRuntime": {
            "id": "claude-cli"
          }
        }
      }
    }
  }
}
```

Override per agen menggunakan bentuk berbasis model yang sama:

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

Dengan runtime Plugin eksplisit, sebuah sesi gagal lebih awal ketika pelaksana
yang diminta tidak terdaftar, tidak mendukung penyedia/model yang sudah
diselesaikan, atau gagal sebelum menghasilkan efek samping giliran. Ini
disengaja untuk deployment khusus Codex dan untuk pengujian live yang harus
membuktikan bahwa jalur app-server Codex benar-benar digunakan.

Pengaturan ini hanya mengontrol pelaksana agen tertanam. Ini tidak menonaktifkan
routing model khusus penyedia untuk gambar, video, musik, TTS, PDF, atau
lainnya.

## Sesi native dan mirror transkrip

Pelaksana dapat menyimpan id sesi native, id thread, atau token resume sisi
daemon. Pertahankan binding itu secara eksplisit terkait dengan sesi OpenClaw,
dan tetap mirror keluaran asisten/alat yang terlihat oleh pengguna ke transkrip
OpenClaw.

Transkrip OpenClaw tetap menjadi lapisan kompatibilitas untuk:

- riwayat sesi yang terlihat oleh channel
- pencarian dan pengindeksan transkrip
- beralih kembali ke pelaksana PI bawaan pada giliran berikutnya
- perilaku generik `/new`, `/reset`, dan penghapusan sesi

Jika pelaksana Anda menyimpan binding sidecar, implementasikan `reset(...)`
agar OpenClaw dapat menghapusnya ketika sesi OpenClaw pemiliknya di-reset.

## Hasil alat dan media

Core menyusun daftar alat OpenClaw dan meneruskannya ke percobaan yang
disiapkan. Ketika pelaksana mengeksekusi panggilan alat dinamis, kembalikan
hasil alat melalui bentuk hasil pelaksana alih-alih mengirim media channel
sendiri.

Ini menjaga keluaran teks, gambar, video, musik, TTS, persetujuan, dan alat
pesan pada jalur pengiriman yang sama dengan run yang didukung PI.

## Batasan saat ini

- Jalur impor publik bersifat generik, tetapi beberapa alias tipe percobaan/hasil
  masih membawa nama `Pi` untuk kompatibilitas.
- Instalasi pelaksana pihak ketiga bersifat eksperimental. Pilih Plugin penyedia
  sampai Anda memerlukan runtime sesi native.
- Pergantian pelaksana didukung antar giliran. Jangan mengganti pelaksana di
  tengah giliran setelah alat native, persetujuan, teks asisten, atau pengiriman
  pesan dimulai.

## Terkait

- [Ikhtisar SDK](/id/plugins/sdk-overview)
- [Pembantu Runtime](/id/plugins/sdk-runtime)
- [Plugin Penyedia](/id/plugins/sdk-provider-plugins)
- [Harness Codex](/id/plugins/codex-harness)
- [Penyedia Model](/id/concepts/model-providers)
