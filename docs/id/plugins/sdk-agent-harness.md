---
read_when:
    - Anda sedang mengubah runtime agen tertanam atau registri harness
    - Anda sedang mendaftarkan harness agen dari Plugin bawaan atau tepercaya
    - Anda perlu memahami bagaimana Plugin Codex berkaitan dengan penyedia model
sidebarTitle: Agent Harness
summary: Antarmuka SDK eksperimental untuk Plugin yang menggantikan eksekutor agen tertanam tingkat rendah
title: Plugin harness agen
x-i18n:
    generated_at: "2026-05-02T09:28:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: b6e55d2df09c3965e1397be72f19dec2a6ed941ac8b7b01be8eee0f9713400dc
    source_path: plugins/sdk-agent-harness.md
    workflow: 16
---

**Harness agen** adalah eksekutor tingkat rendah untuk satu giliran agen OpenClaw
yang sudah disiapkan. Ini bukan penyedia model, bukan kanal, dan bukan registri alat.
Untuk model mental yang berhadapan dengan pengguna, lihat [Runtime agen](/id/concepts/agent-runtimes).

Gunakan permukaan ini hanya untuk plugin native bawaan atau tepercaya. Kontrak ini
masih eksperimental karena tipe parameternya sengaja mencerminkan runner tertanam
saat ini.

## Kapan menggunakan harness

Daftarkan harness agen ketika sebuah keluarga model memiliki runtime sesi native
sendiri dan transport penyedia OpenClaw normal bukan abstraksi yang tepat.

Contoh:

- server agen coding native yang memiliki thread dan compaction
- CLI atau daemon lokal yang harus melakukan streaming event plan/reasoning/tool native
- runtime model yang membutuhkan id resume sendiri selain transkrip sesi
  OpenClaw

Jangan daftarkan harness hanya untuk menambahkan API LLM baru. Untuk API model
HTTP atau WebSocket normal, buat [plugin penyedia](/id/plugins/sdk-provider-plugins).

## Yang tetap dimiliki core

Sebelum harness dipilih, OpenClaw sudah menyelesaikan:

- penyedia dan model
- status auth runtime
- tingkat berpikir dan anggaran konteks
- file transkrip/sesi OpenClaw
- workspace, sandbox, dan kebijakan alat
- callback balasan kanal dan callback streaming
- kebijakan fallback model dan peralihan model live

Pemisahan itu disengaja. Harness menjalankan attempt yang sudah disiapkan; ia tidak
memilih penyedia, menggantikan pengiriman kanal, atau diam-diam mengganti model.

Attempt yang disiapkan juga menyertakan `params.runtimePlan`, bundel kebijakan
milik OpenClaw untuk keputusan runtime yang harus tetap dibagikan di seluruh PI
dan harness native:

- `runtimePlan.tools.normalize(...)` dan
  `runtimePlan.tools.logDiagnostics(...)` untuk kebijakan skema alat yang sadar penyedia
- `runtimePlan.transcript.resolvePolicy(...)` untuk sanitasi transkrip dan
  kebijakan perbaikan pemanggilan alat
- `runtimePlan.delivery.isSilentPayload(...)` untuk `NO_REPLY` bersama dan
  supresi pengiriman media
- `runtimePlan.outcome.classifyRunResult(...)` untuk klasifikasi fallback model
- `runtimePlan.observability` untuk metadata penyedia/model/harness yang sudah diselesaikan

Harness boleh menggunakan plan untuk keputusan yang harus cocok dengan perilaku PI, tetapi
tetap harus memperlakukannya sebagai status attempt milik host. Jangan memutasinya atau
menggunakannya untuk mengganti penyedia/model di dalam satu giliran.

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

OpenClaw memilih harness setelah penyelesaian penyedia/model:

1. Id harness yang tercatat dari sesi yang sudah ada menang, sehingga perubahan config/env tidak
   mengganti transkrip itu secara langsung ke runtime lain.
2. `OPENCLAW_AGENT_RUNTIME=<id>` memaksa harness terdaftar dengan id tersebut untuk
   sesi yang belum dipin.
3. `OPENCLAW_AGENT_RUNTIME=pi` memaksa harness PI bawaan.
4. `OPENCLAW_AGENT_RUNTIME=auto` meminta harness terdaftar apakah mereka mendukung
   penyedia/model yang sudah diselesaikan.
5. Jika tidak ada harness terdaftar yang cocok, OpenClaw menggunakan PI kecuali fallback PI
   dinonaktifkan.

Kegagalan harness plugin muncul sebagai kegagalan run. Dalam mode `auto`, fallback PI
hanya digunakan ketika tidak ada harness plugin terdaftar yang mendukung
penyedia/model yang sudah diselesaikan. Setelah harness plugin mengklaim sebuah run, OpenClaw tidak
memutar ulang giliran yang sama melalui PI karena itu dapat mengubah semantik auth/runtime
atau menduplikasi efek samping.

Id harness yang dipilih dipertahankan bersama id sesi setelah run tertanam.
Sesi legacy yang dibuat sebelum pin harness diperlakukan sebagai terpin ke PI setelah
memiliki riwayat transkrip. Gunakan sesi baru/reset ketika beralih antara PI dan
harness plugin native. `/status` menampilkan id harness non-default seperti `codex`
di sebelah `Fast`; PI tetap disembunyikan karena merupakan jalur kompatibilitas default.
Jika harness yang dipilih mengejutkan, aktifkan logging debug `agents/harness` dan
periksa record terstruktur `agent harness selected` milik gateway. Record itu menyertakan
id harness yang dipilih, alasan pemilihan, kebijakan runtime/fallback, dan, dalam
mode `auto`, hasil dukungan setiap kandidat plugin.

Plugin Codex bawaan mendaftarkan `codex` sebagai id harness-nya. Core memperlakukan itu
sebagai id harness plugin biasa; alias khusus Codex berada di plugin
atau config operator, bukan di selector runtime bersama.

## Pemasangan penyedia plus harness

Sebagian besar harness juga harus mendaftarkan penyedia. Penyedia membuat ref model,
status auth, metadata model, dan pemilihan `/model` terlihat oleh bagian lain
OpenClaw. Harness kemudian mengklaim penyedia itu di `supports(...)`.

Plugin Codex bawaan mengikuti pola ini:

- ref model pengguna yang disukai: `openai/gpt-5.5` plus
  `agentRuntime.id: "codex"`
- ref kompatibilitas: ref legacy `codex/gpt-*` tetap diterima, tetapi config baru
  tidak boleh menggunakannya sebagai ref penyedia/model normal
- id harness: `codex`
- auth: ketersediaan penyedia sintetis, karena harness Codex memiliki
  login/sesi Codex native
- permintaan app-server: OpenClaw mengirim id model mentah ke Codex dan membiarkan
  harness berbicara dengan protokol app-server native

Plugin Codex bersifat aditif. Ref `openai/gpt-*` biasa tetap menggunakan
jalur penyedia OpenClaw normal kecuali Anda memaksa harness Codex dengan
`agentRuntime.id: "codex"`. Ref `codex/gpt-*` lama masih memilih
penyedia dan harness Codex untuk kompatibilitas.

Untuk penyiapan operator, contoh prefiks model, dan config khusus Codex, lihat
[Harness Codex](/id/plugins/codex-harness).

OpenClaw memerlukan app-server Codex `0.125.0` atau yang lebih baru. Plugin Codex memeriksa
handshake initialize app-server dan memblokir server yang lebih lama atau tanpa versi sehingga
OpenClaw hanya berjalan terhadap permukaan protokol yang telah diuji dengannya. Batas bawah
`0.125.0` mencakup dukungan payload hook MCP native yang masuk di
Codex `0.124.0`, sambil memin OpenClaw ke lini stabil teruji yang lebih baru.

### Middleware hasil alat

Plugin bawaan dapat memasang middleware hasil alat yang netral runtime melalui
`api.registerAgentToolResultMiddleware(...)` ketika manifesnya mendeklarasikan
id runtime target di `contracts.agentToolResultMiddleware`. Seam tepercaya ini
untuk transformasi hasil alat async yang harus berjalan sebelum PI atau Codex memberi
output alat kembali ke model.

Plugin bawaan legacy masih dapat menggunakan
`api.registerCodexAppServerExtensionFactory(...)` untuk middleware khusus app-server Codex,
tetapi transformasi hasil baru harus menggunakan API netral runtime.
Hook khusus Pi `api.registerEmbeddedExtensionFactory(...)` telah dihapus;
transformasi hasil alat Pi harus menggunakan middleware netral runtime.

### Klasifikasi hasil terminal

Harness native yang memiliki proyeksi protokolnya sendiri dapat menggunakan
`classifyAgentHarnessTerminalOutcome(...)` dari
`openclaw/plugin-sdk/agent-harness-runtime` ketika giliran yang selesai tidak menghasilkan
teks asisten yang terlihat. Helper mengembalikan `empty`, `reasoning-only`, atau
`planning-only` sehingga kebijakan fallback OpenClaw dapat memutuskan apakah perlu mencoba ulang pada
model berbeda. Secara sengaja, helper ini membiarkan error prompt, giliran yang sedang berjalan, dan
balasan senyap yang disengaja seperti `NO_REPLY` tidak terklasifikasi.

### Mode harness Codex native

Harness `codex` bawaan adalah mode Codex native untuk giliran agen OpenClaw
tertanam. Aktifkan plugin `codex` bawaan terlebih dahulu, dan sertakan `codex` di
`plugins.allow` jika config Anda menggunakan allowlist restriktif. Config app-server native
harus menggunakan `openai/gpt-*` dengan `agentRuntime.id: "codex"`.
Gunakan `openai-codex/*` untuk OAuth Codex melalui PI. Ref model `codex/*`
legacy tetap menjadi alias kompatibilitas untuk harness native.

Ketika mode ini berjalan, Codex memiliki id thread native, perilaku resume,
compaction, dan eksekusi app-server. OpenClaw tetap memiliki kanal chat,
cermin transkrip yang terlihat, kebijakan alat, persetujuan, pengiriman media, dan pemilihan
sesi. Gunakan `agentRuntime.id: "codex"` tanpa override `fallback`
ketika Anda perlu membuktikan bahwa hanya jalur app-server Codex yang dapat mengklaim run.
Runtime plugin eksplisit sudah fail closed secara default. Setel `fallback: "pi"`
hanya ketika Anda secara sengaja ingin PI menangani pemilihan harness yang hilang. Kegagalan
app-server Codex sudah gagal langsung alih-alih mencoba ulang melalui PI.

## Menonaktifkan fallback PI

Secara default, OpenClaw menjalankan agen tertanam dengan `agents.defaults.agentRuntime`
disetel ke `{ id: "auto", fallback: "pi" }`. Dalam mode `auto`, harness plugin terdaftar
dapat mengklaim pasangan penyedia/model. Jika tidak ada yang cocok, OpenClaw fallback
ke PI.

Dalam mode `auto`, setel `fallback: "none"` ketika Anda membutuhkan pemilihan harness plugin
yang hilang agar gagal alih-alih menggunakan PI. Runtime plugin eksplisit seperti
`agentRuntime.id: "codex"` sudah fail closed secara default, kecuali
`fallback: "pi"` disetel dalam config yang sama atau cakupan override lingkungan.
Kegagalan harness plugin terpilih selalu gagal keras. Ini tidak memblokir
`agentRuntime.id: "pi"` eksplisit atau `OPENCLAW_AGENT_RUNTIME=pi`.

Untuk run tertanam khusus Codex:

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

Jika Anda ingin harness plugin terdaftar mana pun mengklaim model yang cocok tetapi tidak pernah
ingin OpenClaw diam-diam fallback ke PI, pertahankan `runtime: "auto"` dan nonaktifkan
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

Override per agen menggunakan bentuk yang sama:

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

`OPENCLAW_AGENT_RUNTIME` tetap mengesampingkan runtime yang dikonfigurasi. Gunakan
`OPENCLAW_AGENT_HARNESS_FALLBACK=none` untuk menonaktifkan fallback PI dari
lingkungan.

```bash
OPENCLAW_AGENT_RUNTIME=codex \
OPENCLAW_AGENT_HARNESS_FALLBACK=none \
openclaw gateway run
```

Dengan fallback dinonaktifkan, sesi gagal lebih awal ketika harness yang diminta tidak
terdaftar, tidak mendukung penyedia/model yang sudah diselesaikan, atau gagal sebelum
menghasilkan efek samping giliran. Itu disengaja untuk deployment khusus Codex dan
untuk pengujian live yang harus membuktikan jalur app-server Codex benar-benar digunakan.

Pengaturan ini hanya mengontrol harness agen tertanam. Ini tidak menonaktifkan
perutean model khusus penyedia untuk gambar, video, musik, TTS, PDF, atau lainnya.

## Sesi native dan cermin transkrip

Harness dapat menyimpan id sesi native, id thread, atau token resume sisi daemon.
Jaga binding itu secara eksplisit terkait dengan sesi OpenClaw, dan tetap
cerminkan output asisten/alat yang terlihat pengguna ke dalam transkrip OpenClaw.

Transkrip OpenClaw tetap menjadi lapisan kompatibilitas untuk:

- riwayat sesi yang terlihat kanal
- pencarian dan pengindeksan transkrip
- beralih kembali ke harness PI bawaan pada giliran berikutnya
- perilaku `/new`, `/reset`, dan penghapusan sesi generik

Jika harness Anda menyimpan binding sidecar, implementasikan `reset(...)` sehingga OpenClaw dapat
menghapusnya ketika sesi OpenClaw pemilik direset.

## Hasil alat dan media

Core menyusun daftar alat OpenClaw dan meneruskannya ke percobaan yang telah disiapkan.
Saat sebuah harness menjalankan panggilan alat dinamis, kembalikan hasil alat melalui
bentuk hasil harness, alih-alih mengirim media kanal sendiri.

Ini menjaga keluaran teks, gambar, video, musik, TTS, persetujuan, dan alat perpesanan
pada jalur pengiriman yang sama seperti eksekusi yang didukung PI.

## Batasan saat ini

- Jalur impor publik bersifat generik, tetapi beberapa alias tipe percobaan/hasil masih
  memuat nama `Pi` untuk kompatibilitas.
- Pemasangan harness pihak ketiga masih eksperimental. Utamakan Plugin penyedia
  sampai Anda memerlukan runtime sesi native.
- Peralihan harness didukung lintas giliran. Jangan beralih harness di
  tengah giliran setelah alat native, persetujuan, teks asisten, atau pengiriman
  pesan dimulai.

## Terkait

- [Ikhtisar SDK](/id/plugins/sdk-overview)
- [Pembantu Runtime](/id/plugins/sdk-runtime)
- [Plugin Penyedia](/id/plugins/sdk-provider-plugins)
- [Harness Codex](/id/plugins/codex-harness)
- [Penyedia Model](/id/concepts/model-providers)
