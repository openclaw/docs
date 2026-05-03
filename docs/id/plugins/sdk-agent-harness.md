---
read_when:
    - Anda sedang mengubah runtime agen tertanam atau registri harness
    - Anda sedang mendaftarkan harness agen dari Plugin bawaan atau tepercaya
    - Anda perlu memahami bagaimana Plugin Codex berhubungan dengan penyedia model
sidebarTitle: Agent Harness
summary: Permukaan SDK eksperimental untuk plugin yang menggantikan eksekutor agen tertanam tingkat rendah
title: Plugin harness agen
x-i18n:
    generated_at: "2026-05-03T09:22:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: ed416bbb433fc502c60fd8c24d20cd0f862d45472ff2eb0e2484b256b58f1b35
    source_path: plugins/sdk-agent-harness.md
    workflow: 16
---

**agent harness** adalah eksekutor tingkat rendah untuk satu giliran agent OpenClaw yang sudah disiapkan. Ini bukan penyedia model, bukan saluran, dan bukan registri alat. Untuk model mental yang berorientasi pengguna, lihat [runtime agent](/id/concepts/agent-runtimes).

Gunakan permukaan ini hanya untuk Plugin native bawaan atau tepercaya. Kontrak ini masih eksperimental karena jenis parameternya sengaja mencerminkan runner tertanam saat ini.

## Kapan menggunakan harness

Daftarkan agent harness ketika keluarga model memiliki runtime sesi native sendiri dan transport penyedia OpenClaw normal bukan abstraksi yang tepat.

Contoh:

- server coding-agent native yang memiliki thread dan Compaction
- CLI atau daemon lokal yang harus melakukan stream peristiwa rencana/penalaran/alat native
- runtime model yang memerlukan id resume sendiri selain transkrip sesi OpenClaw

Jangan daftarkan harness hanya untuk menambahkan API LLM baru. Untuk API model HTTP atau WebSocket normal, buat [Plugin penyedia](/id/plugins/sdk-provider-plugins).

## Apa yang tetap dimiliki core

Sebelum harness dipilih, OpenClaw sudah menyelesaikan:

- penyedia dan model
- status autentikasi runtime
- tingkat berpikir dan anggaran konteks
- file transkrip/sesi OpenClaw
- workspace, sandbox, dan kebijakan alat
- callback balasan saluran dan callback streaming
- fallback model dan kebijakan peralihan model live

Pemisahan itu disengaja. Harness menjalankan upaya yang sudah disiapkan; harness tidak memilih penyedia, mengganti pengiriman saluran, atau mengganti model secara diam-diam.

Upaya yang disiapkan juga menyertakan `params.runtimePlan`, sebuah bundel kebijakan milik OpenClaw untuk keputusan runtime yang harus tetap dibagikan antara PI dan harness native:

- `runtimePlan.tools.normalize(...)` dan
  `runtimePlan.tools.logDiagnostics(...)` untuk kebijakan skema alat yang sadar penyedia
- `runtimePlan.transcript.resolvePolicy(...)` untuk sanitasi transkrip dan kebijakan perbaikan panggilan alat
- `runtimePlan.delivery.isSilentPayload(...)` untuk `NO_REPLY` bersama dan penekanan pengiriman media
- `runtimePlan.outcome.classifyRunResult(...)` untuk klasifikasi fallback model
- `runtimePlan.observability` untuk metadata penyedia/model/harness yang sudah diselesaikan

Harness dapat menggunakan rencana tersebut untuk keputusan yang perlu cocok dengan perilaku PI, tetapi tetap harus memperlakukannya sebagai status upaya milik host. Jangan memutasinya atau menggunakannya untuk mengganti penyedia/model di dalam satu giliran.

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

OpenClaw memilih harness setelah penyedia/model diselesaikan:

1. id harness yang tercatat pada sesi yang sudah ada menang, sehingga perubahan config/env tidak mengalihkan transkrip tersebut secara langsung ke runtime lain.
2. `OPENCLAW_AGENT_RUNTIME=<id>` memaksa harness terdaftar dengan id tersebut untuk sesi yang belum dipasangkan.
3. `OPENCLAW_AGENT_RUNTIME=pi` memaksa harness PI bawaan.
4. `OPENCLAW_AGENT_RUNTIME=auto` meminta harness terdaftar menyatakan apakah mereka mendukung penyedia/model yang sudah diselesaikan.
5. Jika tidak ada harness terdaftar yang cocok, OpenClaw menggunakan PI kecuali fallback PI dinonaktifkan.

Kegagalan harness Plugin muncul sebagai kegagalan run. Dalam mode `auto`, fallback PI hanya digunakan ketika tidak ada harness Plugin terdaftar yang mendukung penyedia/model yang sudah diselesaikan. Setelah harness Plugin mengklaim sebuah run, OpenClaw tidak memutar ulang giliran yang sama melalui PI karena itu dapat mengubah semantik autentikasi/runtime atau menggandakan efek samping.

id harness terpilih dipertahankan bersama id sesi setelah run tertanam. Sesi lama yang dibuat sebelum pin harness diperlakukan sebagai sudah dipin ke PI setelah memiliki riwayat transkrip. Gunakan sesi baru/direset saat berpindah antara PI dan harness Plugin native. `/status` menampilkan id harness non-default seperti `codex` di sebelah `Fast`; PI tetap disembunyikan karena merupakan jalur kompatibilitas default. Jika harness yang dipilih mengejutkan, aktifkan logging debug `agents/harness` dan periksa catatan terstruktur `agent harness selected` milik gateway. Catatan itu menyertakan id harness terpilih, alasan pemilihan, kebijakan runtime/fallback, dan, dalam mode `auto`, hasil dukungan setiap kandidat Plugin.

Plugin Codex bawaan mendaftarkan `codex` sebagai id harness-nya. Core memperlakukannya sebagai id harness Plugin biasa; alias khusus Codex berada di Plugin atau config operator, bukan di pemilih runtime bersama.

## Penyandingan penyedia plus harness

Sebagian besar harness juga harus mendaftarkan penyedia. Penyedia membuat ref model, status autentikasi, metadata model, dan pilihan `/model` terlihat oleh bagian OpenClaw lainnya. Harness kemudian mengklaim penyedia tersebut di `supports(...)`.

Plugin Codex bawaan mengikuti pola ini:

- ref model pengguna yang disukai: `openai/gpt-5.5` plus
  `agentRuntime.id: "codex"`
- ref kompatibilitas: ref lama `codex/gpt-*` tetap diterima, tetapi config baru tidak boleh menggunakannya sebagai ref penyedia/model normal
- id harness: `codex`
- autentikasi: ketersediaan penyedia sintetis, karena harness Codex memiliki login/sesi Codex native
- permintaan app-server: OpenClaw mengirim id model polos ke Codex dan membiarkan harness berbicara dengan protokol app-server native

Plugin Codex bersifat aditif. Ref `openai/gpt-*` biasa tetap menggunakan jalur penyedia OpenClaw normal kecuali Anda memaksa harness Codex dengan `agentRuntime.id: "codex"`. Ref lama `codex/gpt-*` masih memilih penyedia dan harness Codex untuk kompatibilitas.

Untuk penyiapan operator, contoh prefiks model, dan config khusus Codex, lihat [Codex Harness](/id/plugins/codex-harness).

OpenClaw memerlukan app-server Codex `0.125.0` atau lebih baru. Plugin Codex memeriksa handshake inisialisasi app-server dan memblokir server yang lebih lama atau tidak berversi sehingga OpenClaw hanya berjalan terhadap permukaan protokol yang sudah diuji. Batas minimum `0.125.0` mencakup dukungan payload hook MCP native yang hadir di Codex `0.124.0`, sambil mematok OpenClaw ke lini stabil lebih baru yang sudah diuji.

### Middleware hasil alat

Plugin bawaan dapat melampirkan middleware hasil alat yang netral runtime melalui `api.registerAgentToolResultMiddleware(...)` ketika manifesnya mendeklarasikan id runtime target di `contracts.agentToolResultMiddleware`. Seam tepercaya ini ditujukan untuk transformasi hasil alat async yang harus berjalan sebelum PI atau Codex memasukkan output alat kembali ke model.

Plugin bawaan lama masih dapat menggunakan `api.registerCodexAppServerExtensionFactory(...)` untuk middleware khusus app-server Codex, tetapi transformasi hasil baru harus menggunakan API netral runtime. Hook khusus Pi `api.registerEmbeddedExtensionFactory(...)` telah dihapus; transformasi hasil alat Pi harus menggunakan middleware netral runtime.

### Klasifikasi hasil terminal

Harness native yang memiliki proyeksi protokol sendiri dapat menggunakan `classifyAgentHarnessTerminalOutcome(...)` dari `openclaw/plugin-sdk/agent-harness-runtime` ketika giliran yang selesai tidak menghasilkan teks asisten yang terlihat. Helper mengembalikan `empty`, `reasoning-only`, atau `planning-only` sehingga kebijakan fallback OpenClaw dapat memutuskan apakah akan mencoba ulang pada model lain. Helper ini sengaja tidak mengklasifikasikan error prompt, giliran yang masih berjalan, dan balasan diam yang disengaja seperti `NO_REPLY`.

### Mode harness Codex native

Harness `codex` bawaan adalah mode Codex native untuk giliran agent OpenClaw tertanam. Aktifkan Plugin `codex` bawaan terlebih dahulu, dan sertakan `codex` dalam `plugins.allow` jika config Anda menggunakan allowlist restriktif. Config app-server native harus menggunakan `openai/gpt-*` dengan `agentRuntime.id: "codex"`. Gunakan `openai-codex/*` untuk OAuth Codex melalui PI. Ref model lama `codex/*` tetap menjadi alias kompatibilitas untuk harness native.

Saat mode ini berjalan, Codex memiliki id thread native, perilaku resume, Compaction, dan eksekusi app-server. OpenClaw tetap memiliki saluran chat, mirror transkrip yang terlihat, kebijakan alat, persetujuan, pengiriman media, dan pemilihan sesi. Gunakan `agentRuntime.id: "codex"` ketika Anda perlu membuktikan bahwa hanya jalur app-server Codex yang dapat mengklaim run. Runtime Plugin eksplisit gagal secara tertutup; kegagalan pemilihan app-server Codex dan kegagalan runtime tidak dicoba ulang melalui PI.

## Ketegasan runtime

Secara default, OpenClaw menjalankan agent tertanam dengan OpenClaw Pi. Dalam mode `auto`, harness Plugin terdaftar dapat mengklaim pasangan penyedia/model, dan PI menangani giliran ketika tidak ada yang cocok. Gunakan runtime Plugin eksplisit seperti `agentRuntime.id: "codex"` ketika pemilihan harness yang hilang harus gagal alih-alih dirutekan melalui PI. Kegagalan harness Plugin terpilih selalu gagal keras. Ini tidak memblokir `agentRuntime.id: "pi"` eksplisit atau `OPENCLAW_AGENT_RUNTIME=pi`.

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

Jika Anda ingin harness Plugin terdaftar mana pun mengklaim model yang cocok dan selain itu menggunakan PI, tetapkan `id: "auto"`:

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

Override per-agent menggunakan bentuk yang sama:

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

`OPENCLAW_AGENT_RUNTIME` tetap menimpa runtime yang dikonfigurasi.

```bash
OPENCLAW_AGENT_RUNTIME=codex openclaw gateway run
```

Dengan runtime Plugin eksplisit, sesi gagal sejak awal ketika harness yang diminta tidak terdaftar, tidak mendukung penyedia/model yang sudah diselesaikan, atau gagal sebelum menghasilkan efek samping giliran. Ini disengaja untuk deployment khusus Codex dan untuk pengujian live yang harus membuktikan bahwa jalur app-server Codex benar-benar digunakan.

Pengaturan ini hanya mengontrol harness agent tertanam. Pengaturan ini tidak menonaktifkan routing model khusus penyedia untuk gambar, video, musik, TTS, PDF, atau lainnya.

## Sesi native dan mirror transkrip

Harness dapat menyimpan id sesi native, id thread, atau token resume di sisi daemon. Jaga agar binding tersebut secara eksplisit dikaitkan dengan sesi OpenClaw, dan tetap mirror output asisten/alat yang terlihat pengguna ke dalam transkrip OpenClaw.

Transkrip OpenClaw tetap menjadi lapisan kompatibilitas untuk:

- riwayat sesi yang terlihat saluran
- pencarian dan pengindeksan transkrip
- beralih kembali ke harness PI bawaan pada giliran berikutnya
- perilaku umum `/new`, `/reset`, dan penghapusan sesi

Jika harness Anda menyimpan binding sidecar, implementasikan `reset(...)` sehingga OpenClaw dapat menghapusnya saat sesi OpenClaw pemilik direset.

## Hasil alat dan media

Core menyusun daftar alat OpenClaw dan meneruskannya ke upaya yang disiapkan. Ketika harness menjalankan panggilan alat dinamis, kembalikan hasil alat melalui bentuk hasil harness alih-alih mengirim media saluran sendiri.

Ini menjaga output teks, gambar, video, musik, TTS, persetujuan, dan alat perpesanan pada jalur pengiriman yang sama seperti run yang didukung PI.

## Batasan saat ini

- Jalur impor publik bersifat generik, tetapi beberapa alias tipe upaya/hasil masih
  memakai nama `Pi` demi kompatibilitas.
- Instalasi harness pihak ketiga bersifat eksperimental. Utamakan Plugin penyedia
  hingga Anda memerlukan runtime sesi native.
- Pergantian harness didukung lintas giliran. Jangan mengganti harness di
  tengah giliran setelah alat native, persetujuan, teks asisten, atau pengiriman
  pesan sudah dimulai.

## Terkait

- [Ikhtisar SDK](/id/plugins/sdk-overview)
- [Helper Runtime](/id/plugins/sdk-runtime)
- [Plugin Penyedia](/id/plugins/sdk-provider-plugins)
- [Harness Codex](/id/plugins/codex-harness)
- [Penyedia Model](/id/concepts/model-providers)
