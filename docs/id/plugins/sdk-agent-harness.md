---
read_when:
    - Anda sedang mengubah runtime agen tertanam atau registri harness
    - Anda sedang mendaftarkan harness agen dari Plugin bawaan atau tepercaya
    - Anda perlu memahami bagaimana Plugin Codex berhubungan dengan penyedia model
sidebarTitle: Agent Harness
summary: Antarmuka SDK eksperimental untuk Plugin yang menggantikan eksekutor agen tertanam tingkat rendah
title: Plugin kerangka agen
x-i18n:
    generated_at: "2026-05-07T13:23:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: ab47fbedbd429a4c0e72da0057a88be34528b69804fa1e7af795f377c4907f55
    source_path: plugins/sdk-agent-harness.md
    workflow: 16
---

**Harness agen** adalah eksekutor tingkat rendah untuk satu giliran agen OpenClaw
yang sudah disiapkan. Ini bukan penyedia model, bukan saluran, dan bukan registry alat.
Untuk model mental yang menghadap pengguna, lihat [Runtime agen](/id/concepts/agent-runtimes).

Gunakan permukaan ini hanya untuk plugin native bawaan atau tepercaya. Kontraknya
masih eksperimental karena tipe parameter sengaja mencerminkan runner tertanam saat ini.

## Kapan menggunakan harness

Daftarkan harness agen ketika suatu keluarga model memiliki runtime sesi native
sendiri dan transport penyedia OpenClaw normal adalah abstraksi yang keliru.

Contoh:

- server agen pengodean native yang memiliki thread dan compaction
- CLI lokal atau daemon yang harus melakukan streaming event rencana/penalaran/alat native
- runtime model yang membutuhkan id resume sendiri selain transkrip sesi OpenClaw

Jangan **daftarkan** harness hanya untuk menambahkan API LLM baru. Untuk API model
HTTP atau WebSocket normal, buat [plugin penyedia](/id/plugins/sdk-provider-plugins).

## Yang masih dimiliki core

Sebelum harness dipilih, OpenClaw sudah menyelesaikan:

- penyedia dan model
- status auth runtime
- tingkat berpikir dan anggaran konteks
- file transkrip/sesi OpenClaw
- workspace, sandbox, dan kebijakan alat
- callback balasan saluran dan callback streaming
- fallback model dan kebijakan pergantian model live

Pemisahan itu disengaja. Harness menjalankan attempt yang sudah disiapkan; ia tidak memilih
penyedia, mengganti pengiriman saluran, atau mengganti model secara diam-diam.

Attempt yang disiapkan juga menyertakan `params.runtimePlan`, bundle kebijakan milik OpenClaw
untuk keputusan runtime yang harus tetap dibagikan di seluruh harness PI dan native:

- `runtimePlan.tools.normalize(...)` dan
  `runtimePlan.tools.logDiagnostics(...)` untuk kebijakan skema alat yang sadar penyedia
- `runtimePlan.transcript.resolvePolicy(...)` untuk sanitasi transkrip dan
  kebijakan perbaikan tool-call
- `runtimePlan.delivery.isSilentPayload(...)` untuk `NO_REPLY` bersama dan penekanan
  pengiriman media
- `runtimePlan.outcome.classifyRunResult(...)` untuk klasifikasi fallback model
- `runtimePlan.observability` untuk metadata penyedia/model/harness yang terselesaikan

Harness boleh menggunakan rencana untuk keputusan yang perlu cocok dengan perilaku PI, tetapi
tetap harus memperlakukannya sebagai status attempt milik host. Jangan memutasinya atau menggunakannya
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

1. Id harness yang tercatat pada sesi yang ada menang, sehingga perubahan config/env tidak
   hot-switch transkrip itu ke runtime lain.
2. `OPENCLAW_AGENT_RUNTIME=<id>` memaksa harness terdaftar dengan id itu untuk
   sesi yang belum dipin.
3. `OPENCLAW_AGENT_RUNTIME=pi` memaksa harness PI bawaan.
4. `OPENCLAW_AGENT_RUNTIME=auto` meminta harness terdaftar apakah mereka mendukung
   penyedia/model yang terselesaikan.
5. Jika tidak ada harness terdaftar yang cocok, OpenClaw menggunakan PI kecuali fallback PI
   dinonaktifkan.

Kegagalan harness plugin muncul sebagai kegagalan run. Dalam mode `auto`, fallback PI
hanya digunakan ketika tidak ada harness plugin terdaftar yang mendukung
penyedia/model yang terselesaikan. Setelah harness plugin mengklaim sebuah run, OpenClaw tidak
memutar ulang giliran yang sama melalui PI karena itu dapat mengubah semantik auth/runtime
atau menggandakan efek samping.

Id harness yang dipilih dipersistenkan dengan id sesi setelah run tertanam.
Sesi legacy yang dibuat sebelum pin harness diperlakukan sebagai dipin ke PI setelah
memiliki riwayat transkrip. Gunakan sesi baru/reset saat beralih antara PI dan
harness plugin native. `/status` menampilkan id harness non-default seperti `codex`
di samping `Fast`; PI tetap disembunyikan karena merupakan jalur kompatibilitas default.
Jika harness yang dipilih mengejutkan, aktifkan logging debug `agents/harness` dan
periksa record terstruktur `agent harness selected` milik gateway. Record itu mencakup
id harness terpilih, alasan pemilihan, kebijakan runtime/fallback, dan, dalam
mode `auto`, hasil dukungan setiap kandidat plugin.

Plugin Codex bawaan mendaftarkan `codex` sebagai id harness-nya. Core memperlakukannya
sebagai id harness plugin biasa; alias khusus Codex berada di plugin
atau config operator, bukan di selector runtime bersama.

## Pemasangan penyedia plus harness

Sebagian besar harness juga harus mendaftarkan penyedia. Penyedia membuat ref model,
status auth, metadata model, dan pemilihan `/model` terlihat oleh bagian OpenClaw lainnya.
Harness lalu mengklaim penyedia itu di `supports(...)`.

Plugin Codex bawaan mengikuti pola ini:

- ref model pengguna yang disukai: `openai/gpt-5.5` plus
  `agentRuntime.id: "codex"`
- ref kompatibilitas: ref legacy `codex/gpt-*` tetap diterima, tetapi config baru
  tidak boleh menggunakannya sebagai ref penyedia/model normal
- id harness: `codex`
- auth: ketersediaan penyedia sintetis, karena harness Codex memiliki
  login/sesi Codex native
- request app-server: OpenClaw mengirim id model murni ke Codex dan membiarkan
  harness berbicara ke protokol app-server native

Plugin Codex bersifat aditif. Ref `openai/gpt-*` biasa tetap menggunakan
jalur penyedia OpenClaw normal kecuali Anda memaksa harness Codex dengan
`agentRuntime.id: "codex"`. Ref `codex/gpt-*` lama tetap memilih
penyedia dan harness Codex untuk kompatibilitas.

Untuk setup operator, contoh prefix model, dan config khusus Codex, lihat
[Harness Codex](/id/plugins/codex-harness).

OpenClaw memerlukan app-server Codex `0.125.0` atau lebih baru. Plugin Codex memeriksa
handshake initialize app-server dan memblokir server yang lebih lama atau tanpa versi agar
OpenClaw hanya berjalan pada permukaan protokol yang sudah diuji. Batas minimum
`0.125.0` mencakup dukungan payload hook MCP native yang masuk di
Codex `0.124.0`, sekaligus memin OpenClaw ke lini stabil terbaru yang sudah diuji.

### Middleware hasil alat

Plugin bawaan dapat melampirkan middleware hasil alat yang netral terhadap runtime melalui
`api.registerAgentToolResultMiddleware(...)` ketika manifest mereka mendeklarasikan
id runtime target di `contracts.agentToolResultMiddleware`. Seam tepercaya ini
ditujukan untuk transform hasil alat async yang harus berjalan sebelum PI atau Codex memberi
output alat kembali ke model.

Plugin bawaan legacy masih dapat menggunakan
`api.registerCodexAppServerExtensionFactory(...)` untuk middleware khusus app-server Codex,
tetapi transform hasil baru harus menggunakan API netral-runtime.
Hook khusus Pi `api.registerEmbeddedExtensionFactory(...)` telah dihapus;
transform hasil alat Pi harus menggunakan middleware netral-runtime.

### Klasifikasi outcome terminal

Harness native yang memiliki proyeksi protokolnya sendiri dapat menggunakan
`classifyAgentHarnessTerminalOutcome(...)` dari
`openclaw/plugin-sdk/agent-harness-runtime` ketika giliran yang selesai tidak menghasilkan
teks asisten yang terlihat. Helper mengembalikan `empty`, `reasoning-only`, atau
`planning-only` sehingga kebijakan fallback OpenClaw dapat memutuskan apakah akan mencoba ulang pada
model berbeda. Ini sengaja membiarkan error prompt, giliran yang masih berjalan, dan
balasan senyap yang disengaja seperti `NO_REPLY` tidak diklasifikasikan.

### Mode harness Codex native

Harness `codex` bawaan adalah mode Codex native untuk giliran agen OpenClaw
tertanam. Aktifkan plugin `codex` bawaan terlebih dahulu, dan sertakan `codex` dalam
`plugins.allow` jika config Anda menggunakan allowlist yang restriktif. Config app-server native
harus menggunakan `openai/gpt-*`; giliran agen OpenAI memilih harness Codex
secara default. Route legacy `openai-codex/*` harus diperbaiki dengan
`openclaw doctor --fix`, dan ref model legacy `codex/*` tetap menjadi alias kompatibilitas
untuk harness native.

Saat mode ini berjalan, Codex memiliki id thread native, perilaku resume,
compaction, dan eksekusi app-server. OpenClaw masih memiliki saluran chat,
mirror transkrip yang terlihat, kebijakan alat, approval, pengiriman media, dan pemilihan
sesi. Gunakan `agentRuntime.id: "codex"` ketika Anda perlu membuktikan bahwa hanya
jalur app-server Codex yang dapat mengklaim run tersebut. Runtime plugin eksplisit gagal tertutup;
kegagalan pemilihan app-server Codex dan kegagalan runtime tidak dicoba ulang melalui
PI.

## Ketegasan runtime

Secara default, OpenClaw menjalankan agen tertanam dengan OpenClaw Pi. Dalam mode `auto`,
harness plugin terdaftar dapat mengklaim pasangan penyedia/model, dan PI menangani
giliran ketika tidak ada yang cocok. Gunakan runtime plugin eksplisit seperti
`agentRuntime.id: "codex"` ketika pemilihan harness yang hilang harus gagal alih-alih
dirutekan melalui PI. Kegagalan harness plugin terpilih selalu gagal keras. Ini
tidak memblokir `agentRuntime.id: "pi"` atau
`OPENCLAW_AGENT_RUNTIME=pi` yang eksplisit.

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

Jika Anda ingin harness plugin terdaftar apa pun mengklaim model yang cocok dan selain itu
menggunakan PI, setel `id: "auto"`:

```json
{
  "agents": {
    "defaults": {
      "agentRuntime": {
        "id": "auto"
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
      "agentRuntime": { "id": "auto" }
    },
    "list": [
      {
        "id": "codex-only",
        "model": "openai/gpt-5.5",
        "agentRuntime": { "id": "codex" }
      }
    ]
  }
}
```

`OPENCLAW_AGENT_RUNTIME` tetap mengoverride runtime yang dikonfigurasi.

```bash
OPENCLAW_AGENT_RUNTIME=codex openclaw gateway run
```

Dengan runtime plugin eksplisit, sebuah sesi gagal lebih awal ketika harness yang diminta
tidak terdaftar, tidak mendukung penyedia/model yang terselesaikan, atau
gagal sebelum menghasilkan efek samping giliran. Itu disengaja untuk deployment khusus Codex
dan untuk pengujian live yang harus membuktikan bahwa jalur app-server Codex
benar-benar digunakan.

Setelan ini hanya mengontrol harness agen tertanam. Ini tidak menonaktifkan
routing model khusus penyedia untuk gambar, video, musik, TTS, PDF, atau lainnya.

## Sesi native dan mirror transkrip

Harness dapat menyimpan id sesi native, id thread, atau token resume sisi daemon.
Jaga binding itu tetap secara eksplisit dikaitkan dengan sesi OpenClaw, dan tetap
mirror output asisten/alat yang terlihat pengguna ke dalam transkrip OpenClaw.

Transkrip OpenClaw tetap menjadi lapisan kompatibilitas untuk:

- riwayat sesi yang terlihat di saluran
- pencarian dan pengindeksan transkrip
- beralih kembali ke harness PI bawaan pada giliran berikutnya
- perilaku generik `/new`, `/reset`, dan penghapusan sesi

Jika harness Anda menyimpan binding sidecar, implementasikan `reset(...)` agar OpenClaw dapat
menghapusnya ketika sesi OpenClaw pemilik direset.

## Hasil alat dan media

Core menyusun daftar alat OpenClaw dan meneruskannya ke attempt yang disiapkan.
Ketika harness mengeksekusi pemanggilan alat dinamis, kembalikan hasil alat melalui
bentuk hasil harness alih-alih mengirim media saluran sendiri.

Ini menjaga output teks, gambar, video, musik, TTS, approval, dan alat perpesanan
pada jalur pengiriman yang sama seperti run yang didukung PI.

## Batasan saat ini

- Jalur impor publik bersifat generik, tetapi beberapa alias tipe percobaan/hasil masih
  membawa nama `Pi` untuk kompatibilitas.
- Instalasi harness pihak ketiga bersifat eksperimental. Utamakan Plugin penyedia
  hingga Anda memerlukan runtime sesi native.
- Peralihan harness didukung lintas giliran. Jangan beralih harness di
  tengah giliran setelah alat native, persetujuan, teks asisten, atau pengiriman
  pesan telah dimulai.

## Terkait

- [Ikhtisar SDK](/id/plugins/sdk-overview)
- [Helper Runtime](/id/plugins/sdk-runtime)
- [Plugin Penyedia](/id/plugins/sdk-provider-plugins)
- [Harness Codex](/id/plugins/codex-harness)
- [Penyedia Model](/id/concepts/model-providers)
