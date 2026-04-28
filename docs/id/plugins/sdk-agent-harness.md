---
read_when:
    - Anda sedang mengubah runtime agen tersemat atau registri harness
    - Anda sedang mendaftarkan harness agen dari Plugin bawaan atau tepercaya
    - Anda perlu memahami bagaimana Plugin Codex berhubungan dengan provider model
sidebarTitle: Agent Harness
summary: Surface SDK eksperimental untuk Plugin yang menggantikan eksekutor agen tersemat tingkat rendah
title: Plugin harness agen
x-i18n:
  refreshed_at: '2026-04-28T05:23:26Z'
  generated_at: "2026-04-26T11:35:15Z"
  model: gpt-5.4
  provider: openai
  source_hash: 340fc6207dabc6ffe7ffb9c07ca9e80e76f1034d4978c41279dc826468302181
  source_path: plugins/sdk-agent-harness.md
  workflow: 15
---

Sebuah **harness agen** adalah eksekutor tingkat rendah untuk satu giliran agen OpenClaw
yang sudah dipersiapkan. Ini bukan provider model, bukan saluran, dan bukan registri tool.
Untuk model mental yang berhadapan dengan pengguna, lihat [Runtime agen](/id/concepts/agent-runtimes).

Gunakan surface ini hanya untuk Plugin native bawaan atau tepercaya. Kontrak ini
masih eksperimental karena tipe parameternya sengaja mencerminkan runner tersemat saat ini.

## Kapan menggunakan harness

Daftarkan harness agen ketika sebuah keluarga model memiliki runtime sesi native
sendiri dan transport provider OpenClaw normal adalah abstraksi yang salah.

Contoh:

- server coding-agent native yang memiliki thread dan Compaction sendiri
- CLI atau daemon lokal yang harus melakukan streaming event plan/reasoning/tool native
- runtime model yang memerlukan id resume sendiri selain transkrip sesi OpenClaw

Jangan mendaftarkan harness hanya untuk menambahkan API LLM baru. Untuk API model HTTP atau
WebSocket normal, bangun [Plugin provider](/id/plugins/sdk-provider-plugins).

## Yang tetap dimiliki core

Sebelum sebuah harness dipilih, OpenClaw sudah me-resolve:

- provider dan model
- status auth runtime
- level thinking dan anggaran konteks
- file transkrip/sesi OpenClaw
- workspace, sandbox, dan kebijakan tool
- callback balasan saluran dan callback streaming
- kebijakan fallback model dan perpindahan model langsung

Pemisahan itu disengaja. Sebuah harness menjalankan upaya yang sudah dipersiapkan; harness tidak memilih
provider, tidak mengganti pengiriman saluran, dan tidak mengganti model secara diam-diam.

Upaya yang sudah dipersiapkan juga menyertakan `params.runtimePlan`, bundel kebijakan milik OpenClaw untuk keputusan runtime yang harus tetap dibagi antara harness PI dan native:

- `runtimePlan.tools.normalize(...)` dan
  `runtimePlan.tools.logDiagnostics(...)` untuk kebijakan skema tool yang sadar-provider
- `runtimePlan.transcript.resolvePolicy(...)` untuk sanitasi transkrip dan
  kebijakan perbaikan pemanggilan tool
- `runtimePlan.delivery.isSilentPayload(...)` untuk penekanan pengiriman `NO_REPLY` dan media bersama
- `runtimePlan.outcome.classifyRunResult(...)` untuk klasifikasi fallback model
- `runtimePlan.observability` untuk metadata provider/model/harness yang telah di-resolve

Harness boleh menggunakan plan untuk keputusan yang perlu cocok dengan perilaku PI, tetapi
tetap harus memperlakukannya sebagai status upaya milik host. Jangan memutasinya atau menggunakannya untuk
mengganti provider/model di dalam satu giliran.

## Daftarkan sebuah harness

**Import:** `openclaw/plugin-sdk/agent-harness`

```typescript
import type { AgentHarness } from "openclaw/plugin-sdk/agent-harness";
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

const myHarness: AgentHarness = {
  id: "my-harness",
  label: "Harness agen native saya",

  supports(ctx) {
    return ctx.provider === "my-provider"
      ? { supported: true, priority: 100 }
      : { supported: false };
  },

  async runAttempt(params) {
    // Mulai atau lanjutkan thread native Anda.
    // Gunakan params.prompt, params.tools, params.images, params.onPartialReply,
    // params.onAgentEvent, dan field upaya yang sudah dipersiapkan lainnya.
    return await runMyNativeTurn(params);
  },
};

export default definePluginEntry({
  id: "my-native-agent",
  name: "Agen Native Saya",
  description: "Menjalankan model terpilih melalui daemon agen native.",
  register(api) {
    api.registerAgentHarness(myHarness);
  },
});
```

## Kebijakan pemilihan

OpenClaw memilih harness setelah resolusi provider/model:

1. ID harness yang tercatat pada sesi yang sudah ada menang, sehingga perubahan config/env tidak
   melakukan hot-switch transkrip tersebut ke runtime lain.
2. `OPENCLAW_AGENT_RUNTIME=<id>` memaksa harness terdaftar dengan id tersebut untuk
   sesi yang belum dipin.
3. `OPENCLAW_AGENT_RUNTIME=pi` memaksa harness PI bawaan.
4. `OPENCLAW_AGENT_RUNTIME=auto` meminta harness terdaftar apakah mereka mendukung
   provider/model yang sudah di-resolve.
5. Jika tidak ada harness terdaftar yang cocok, OpenClaw menggunakan PI kecuali fallback PI
   dinonaktifkan.

Kegagalan harness Plugin muncul sebagai kegagalan eksekusi. Dalam mode `auto`, fallback PI
hanya digunakan ketika tidak ada harness Plugin terdaftar yang mendukung
provider/model yang di-resolve. Setelah sebuah harness Plugin telah mengklaim sebuah eksekusi, OpenClaw tidak
memutar ulang giliran yang sama melalui PI karena hal itu dapat mengubah semantik auth/runtime
atau menggandakan efek samping.

ID harness yang dipilih dipersistenkan bersama id sesi setelah eksekusi tersemat.
Sesi lama yang dibuat sebelum pin harness diperlakukan sebagai ter-pin ke PI setelah
memiliki riwayat transkrip. Gunakan sesi baru/reset saat berpindah antara PI dan
harness Plugin native. `/status` menampilkan id harness non-default seperti `codex`
di samping `Fast`; PI tetap disembunyikan karena itulah jalur kompatibilitas default.
Jika harness yang dipilih mengejutkan, aktifkan logging debug `agents/harness` dan
periksa record terstruktur `agent harness selected` milik gateway. Record itu menyertakan
id harness yang dipilih, alasan pemilihan, kebijakan runtime/fallback, dan, dalam
mode `auto`, hasil dukungan tiap kandidat Plugin.

Plugin Codex bawaan mendaftarkan `codex` sebagai id harness-nya. Core memperlakukan itu
sebagai id harness Plugin biasa; alias yang spesifik Codex seharusnya berada di Plugin
atau konfigurasi operator, bukan di selector runtime bersama.

## Pairing provider plus harness

Sebagian besar harness juga sebaiknya mendaftarkan provider. Provider membuat ref model,
status auth, metadata model, dan pemilihan `/model` terlihat oleh bagian lain dari
OpenClaw. Harness kemudian mengklaim provider tersebut di `supports(...)`.

Plugin Codex bawaan mengikuti pola ini:

- ref model pengguna yang disukai: `openai/gpt-5.5` plus
  `agentRuntime.id: "codex"`
- ref kompatibilitas: ref lama `codex/gpt-*` tetap diterima, tetapi konfigurasi baru
  tidak boleh menggunakannya sebagai ref provider/model normal
- id harness: `codex`
- auth: ketersediaan provider sintetis, karena harness Codex memiliki login/sesi Codex
  native
- permintaan app-server: OpenClaw mengirim id model polos ke Codex dan membiarkan
  harness berbicara dengan protokol app-server native

Plugin Codex bersifat aditif. Ref `openai/gpt-*` biasa tetap menggunakan
jalur provider OpenClaw normal kecuali Anda memaksa harness Codex dengan
`agentRuntime.id: "codex"`. Ref `codex/gpt-*` yang lebih lama tetap memilih
provider dan harness Codex untuk kompatibilitas.

Untuk penyiapan operator, contoh prefiks model, dan konfigurasi hanya-Codex, lihat
[Harness Codex](/id/plugins/codex-harness).

OpenClaw mensyaratkan Codex app-server `0.125.0` atau yang lebih baru. Plugin Codex memeriksa
handshake initialize app-server dan memblokir server yang lebih lama atau tanpa versi sehingga
OpenClaw hanya berjalan terhadap surface protokol yang telah diuji. Batas bawah
`0.125.0` mencakup dukungan payload hook MCP native yang masuk di
Codex `0.124.0`, sambil memin OpenClaw ke lini stabil baru yang telah diuji.

### Middleware hasil tool

Plugin bawaan dapat melampirkan middleware hasil tool yang netral terhadap runtime melalui
`api.registerAgentToolResultMiddleware(...)` ketika manifest mereka mendeklarasikan
id runtime yang ditargetkan di `contracts.agentToolResultMiddleware`. Seam tepercaya
ini ditujukan untuk transformasi hasil tool async yang harus berjalan sebelum PI atau Codex
memasukkan output tool kembali ke model.

Plugin bawaan lama masih dapat menggunakan
`api.registerCodexAppServerExtensionFactory(...)` untuk middleware yang khusus
untuk Codex app-server, tetapi transformasi hasil baru sebaiknya menggunakan API yang netral terhadap runtime.
Hook `api.registerEmbeddedExtensionFactory(...)` yang khusus Pi telah dihapus;
transformasi hasil tool Pi harus menggunakan middleware yang netral terhadap runtime.

### Klasifikasi outcome terminal

Harness native yang memiliki proyeksi protokolnya sendiri dapat menggunakan
`classifyAgentHarnessTerminalOutcome(...)` dari
`openclaw/plugin-sdk/agent-harness-runtime` ketika giliran yang selesai tidak menghasilkan
teks asisten yang terlihat. Helper ini mengembalikan `empty`, `reasoning-only`, atau
`planning-only` sehingga kebijakan fallback OpenClaw dapat memutuskan apakah perlu retry pada
model yang berbeda. Helper ini sengaja membiarkan error prompt, giliran yang masih berjalan, dan balasan senyap yang disengaja seperti `NO_REPLY` tanpa klasifikasi.

### Mode harness Codex native

Harness `codex` bawaan adalah mode Codex native untuk giliran agen OpenClaw tersemat.
Aktifkan dulu Plugin `codex` bawaan, dan sertakan `codex` dalam
`plugins.allow` jika konfigurasi Anda menggunakan allowlist yang ketat. Konfigurasi app-server native seharusnya menggunakan `openai/gpt-*` dengan `agentRuntime.id: "codex"`.
Gunakan `openai-codex/*` untuk OAuth Codex melalui PI. Ref model `codex/*` lama tetap menjadi alias kompatibilitas untuk harness native.

Saat mode ini berjalan, Codex memiliki id thread native, perilaku resume,
Compaction, dan eksekusi app-server. OpenClaw tetap memiliki saluran obrolan,
mirror transkrip yang terlihat, kebijakan tool, approval, pengiriman media, dan pemilihan sesi. Gunakan `agentRuntime.id: "codex"` tanpa override `fallback`
saat Anda perlu membuktikan bahwa hanya jalur Codex app-server yang dapat mengklaim eksekusi.
Runtime Plugin eksplisit sudah gagal secara tertutup secara default. Set `fallback: "pi"`
hanya ketika Anda memang sengaja ingin PI menangani pemilihan harness yang hilang. Kegagalan Codex
app-server sudah langsung gagal alih-alih retry melalui PI.

## Nonaktifkan fallback PI

Secara default, OpenClaw menjalankan agen tersemat dengan `agents.defaults.agentRuntime`
diset ke `{ id: "auto", fallback: "pi" }`. Dalam mode `auto`, Plugin
harness terdaftar dapat mengklaim pasangan provider/model. Jika tidak ada yang cocok, OpenClaw fallback ke PI.

Dalam mode `auto`, set `fallback: "none"` ketika Anda membutuhkan kegagalan pada pemilihan harness Plugin yang hilang alih-alih menggunakan PI. Runtime Plugin eksplisit seperti
`runtime: "codex"` sudah gagal secara tertutup secara default, kecuali `fallback: "pi"` diset dalam scope konfigurasi atau override environment yang sama. Kegagalan harness Plugin yang terpilih selalu gagal keras. Ini tidak memblokir `runtime: "pi"` atau
`OPENCLAW_AGENT_RUNTIME=pi` yang eksplisit.

Untuk eksekusi tersemat hanya-Codex:

```json
{
  "agents": {
    "defaults": {
      "model": "openai/gpt-5.5",
      "agentRuntime": {
        "id": "codex"
      }
    }
  }
}
```

Jika Anda ingin harness Plugin terdaftar apa pun mengklaim model yang cocok tetapi tidak pernah
ingin OpenClaw fallback diam-diam ke PI, pertahankan `runtime: "auto"` dan nonaktifkan
fallback:

```json
{
  "agents": {
    "defaults": {
      "agentRuntime": {
        "id": "auto",
        "fallback": "none"
      }
    }
  }
}
```

Override per-agen menggunakan bentuk yang sama:

```json
{
  "agents": {
    "defaults": {
      "agentRuntime": {
        "id": "auto",
        "fallback": "pi"
      }
    },
    "list": [
      {
        "id": "codex-only",
        "model": "openai/gpt-5.5",
        "agentRuntime": {
          "id": "codex",
          "fallback": "none"
        }
      }
    ]
  }
}
```

`OPENCLAW_AGENT_RUNTIME` tetap menimpa runtime yang dikonfigurasi. Gunakan
`OPENCLAW_AGENT_HARNESS_FALLBACK=none` untuk menonaktifkan fallback PI dari
environment.

```bash
OPENCLAW_AGENT_RUNTIME=codex \
OPENCLAW_AGENT_HARNESS_FALLBACK=none \
openclaw gateway run
```

Dengan fallback dinonaktifkan, sebuah sesi gagal lebih awal ketika harness yang diminta tidak
terdaftar, tidak mendukung provider/model yang di-resolve, atau gagal sebelum
menghasilkan efek samping giliran. Itu disengaja untuk deployment hanya-Codex dan
untuk live test yang harus membuktikan bahwa jalur Codex app-server benar-benar sedang digunakan.

Pengaturan ini hanya mengontrol harness agen tersemat. Ini tidak menonaktifkan
perutean model spesifik provider untuk gambar, video, musik, TTS, PDF, atau lainnya.

## Sesi native dan mirror transkrip

Sebuah harness dapat menyimpan id sesi native, id thread, atau token resume sisi daemon.
Pertahankan pengikatan itu secara eksplisit terkait dengan sesi OpenClaw, dan terus
mirror output asisten/tool yang terlihat pengguna ke dalam transkrip OpenClaw.

Transkrip OpenClaw tetap menjadi lapisan kompatibilitas untuk:

- riwayat sesi yang terlihat di saluran
- pencarian dan pengindeksan transkrip
- berpindah kembali ke harness PI bawaan pada giliran berikutnya
- perilaku generik `/new`, `/reset`, dan penghapusan sesi

Jika harness Anda menyimpan sidecar binding, implementasikan `reset(...)` agar OpenClaw dapat
menghapusnya saat sesi OpenClaw pemilik di-reset.

## Hasil tool dan media

Core membangun daftar tool OpenClaw dan meneruskannya ke upaya yang telah dipersiapkan.
Saat sebuah harness mengeksekusi pemanggilan tool dinamis, kembalikan hasil tool melalui
bentuk hasil harness alih-alih mengirim media saluran sendiri.

Ini menjaga output teks, gambar, video, musik, TTS, approval, dan tool pesan
tetap pada jalur pengiriman yang sama seperti eksekusi yang didukung PI.

## Batas saat ini

- Path import publik bersifat generik, tetapi beberapa alias tipe upaya/hasil masih
  membawa nama `Pi` demi kompatibilitas.
- Instalasi harness pihak ketiga masih eksperimental. Pilih Plugin provider
  sampai Anda benar-benar membutuhkan runtime sesi native.
- Pergantian harness didukung antar-giliran. Jangan mengganti harness di
  tengah giliran setelah tool native, approval, teks asisten, atau pengiriman
  pesan sudah dimulai.

## Terkait

- [Ringkasan SDK](/id/plugins/sdk-overview)
- [Pembantu Runtime](/id/plugins/sdk-runtime)
- [Plugin Provider](/id/plugins/sdk-provider-plugins)
- [Harness Codex](/id/plugins/codex-harness)
- [Provider Model](/id/concepts/model-providers)
