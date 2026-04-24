---
read_when:
    - Anda sedang mengubah runtime agen tertanam atau registry harness
    - Anda sedang mendaftarkan harness agen dari Plugin bawaan atau tepercaya
    - Anda perlu memahami hubungan Plugin Codex dengan provider model
sidebarTitle: Agent Harness
summary: Permukaan SDK eksperimental untuk Plugin yang menggantikan executor agen tertanam tingkat rendah
title: Plugin harness agen
x-i18n:
    generated_at: "2026-04-24T09:19:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: af76c2a3ebe54c87920954b58126ee59538c0e6d3d1b4ba44890c1f5079fabc2
    source_path: plugins/sdk-agent-harness.md
    workflow: 15
---

**Harness agen** adalah executor tingkat rendah untuk satu giliran agen OpenClaw
yang sudah disiapkan. Ini bukan provider model, bukan kanal, dan bukan registry alat.

Gunakan permukaan ini hanya untuk Plugin native bawaan atau tepercaya. Kontraknya
masih eksperimental karena tipe parameternya sengaja mencerminkan embedded runner saat ini.

## Kapan menggunakan harness

Daftarkan harness agen ketika suatu keluarga model memiliki runtime sesi native
sendiri dan transport provider OpenClaw normal merupakan abstraksi yang salah.

Contoh:

- server coding-agent native yang memiliki thread dan Compaction
- CLI atau daemon lokal yang harus men-stream peristiwa plan/reasoning/alat native
- runtime model yang memerlukan resume id sendiri selain transkrip sesi OpenClaw

**Jangan** mendaftarkan harness hanya untuk menambahkan API LLM baru. Untuk API model HTTP atau
WebSocket normal, buat [Provider Plugin](/id/plugins/sdk-provider-plugins).

## Yang tetap dimiliki inti

Sebelum harness dipilih, OpenClaw sudah menyelesaikan:

- provider dan model
- state auth runtime
- tingkat thinking dan anggaran konteks
- file transkrip/sesi OpenClaw
- workspace, sandbox, dan kebijakan alat
- callback balasan kanal dan callback streaming
- kebijakan fallback model dan live model switching

Pemisahan itu disengaja. Harness menjalankan percobaan yang sudah disiapkan; harness tidak memilih
provider, mengganti pengiriman kanal, atau diam-diam mengganti model.

## Mendaftarkan harness

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
    // params.onAgentEvent, dan field percobaan siap lainnya.
    return await runMyNativeTurn(params);
  },
};

export default definePluginEntry({
  id: "my-native-agent",
  name: "My Native Agent",
  description: "Menjalankan model terpilih melalui daemon agen native.",
  register(api) {
    api.registerAgentHarness(myHarness);
  },
});
```

## Kebijakan pemilihan

OpenClaw memilih harness setelah resolusi provider/model:

1. Id harness yang tercatat pada sesi yang sudah ada menang, sehingga perubahan config/env tidak
   melakukan hot-switch transkrip itu ke runtime lain.
2. `OPENCLAW_AGENT_RUNTIME=<id>` memaksa harness terdaftar dengan id tersebut untuk
   sesi yang belum disematkan.
3. `OPENCLAW_AGENT_RUNTIME=pi` memaksa harness PI bawaan.
4. `OPENCLAW_AGENT_RUNTIME=auto` meminta harness terdaftar apakah harness tersebut mendukung
   provider/model yang sudah diselesaikan.
5. Jika tidak ada harness terdaftar yang cocok, OpenClaw menggunakan PI kecuali fallback PI
   dinonaktifkan.

Kegagalan harness Plugin muncul sebagai kegagalan eksekusi. Dalam mode `auto`, fallback PI
hanya digunakan saat tidak ada harness Plugin terdaftar yang mendukung
provider/model yang telah diselesaikan. Setelah sebuah harness Plugin mengklaim eksekusi, OpenClaw tidak
memutar ulang giliran yang sama melalui PI karena itu dapat mengubah semantik auth/runtime
atau menggandakan efek samping.

Id harness yang dipilih dipertahankan bersama id sesi setelah eksekusi tertanam.
Sesi lama yang dibuat sebelum adanya pin harness diperlakukan sebagai terpin PI setelah
memiliki riwayat transkrip. Gunakan sesi baru/reset saat berganti antara PI dan
harness Plugin native. `/status` menampilkan id harness non-default seperti `codex`
di samping `Fast`; PI tetap disembunyikan karena merupakan jalur kompatibilitas default.
Jika harness yang dipilih tampak mengejutkan, aktifkan logging debug `agents/harness` dan
periksa catatan terstruktur `agent harness selected` milik gateway. Catatan ini mencakup
id harness yang dipilih, alasan pemilihan, kebijakan runtime/fallback, dan, dalam
mode `auto`, hasil dukungan dari setiap kandidat Plugin.

Plugin Codex bawaan mendaftarkan `codex` sebagai id harness-nya. Inti memperlakukan itu
sebagai id harness Plugin biasa; alias khusus Codex berada di Plugin
atau konfigurasi operator, bukan di selector runtime bersama.

## Pasangan provider plus harness

Sebagian besar harness juga sebaiknya mendaftarkan provider. Provider membuat referensi model,
status auth, metadata model, dan pemilihan `/model` terlihat oleh bagian lain dari
OpenClaw. Lalu harness mengklaim provider itu di `supports(...)`.

Plugin Codex bawaan mengikuti pola ini:

- id provider: `codex`
- referensi model pengguna: `openai/gpt-5.5` plus `embeddedHarness.runtime: "codex"`;
  referensi lama `codex/gpt-*` tetap diterima untuk kompatibilitas
- id harness: `codex`
- auth: ketersediaan provider sintetis, karena harness Codex memiliki
  login/sesi Codex native
- permintaan app-server: OpenClaw mengirim id model apa adanya ke Codex dan membiarkan
  harness berbicara dengan protokol app-server native

Plugin Codex bersifat aditif. Referensi `openai/gpt-*` biasa tetap menggunakan
jalur provider OpenClaw normal kecuali Anda memaksa harness Codex dengan
`embeddedHarness.runtime: "codex"`. Referensi lama `codex/gpt-*` tetap memilih
provider dan harness Codex untuk kompatibilitas.

Untuk penyiapan operator, contoh prefix model, dan konfigurasi khusus Codex, lihat
[Codex Harness](/id/plugins/codex-harness).

OpenClaw memerlukan app-server Codex `0.118.0` atau yang lebih baru. Plugin Codex memeriksa
handshake inisialisasi app-server dan memblokir server yang lebih lama atau tanpa versi sehingga
OpenClaw hanya berjalan terhadap permukaan protokol yang sudah diuji.

### Middleware hasil alat app-server Codex

Plugin bawaan juga dapat melampirkan middleware `tool_result` khusus app-server Codex melalui `api.registerCodexAppServerExtensionFactory(...)` ketika
manifest-nya mendeklarasikan `contracts.embeddedExtensionFactories: ["codex-app-server"]`.
Ini adalah seam Plugin tepercaya untuk transformasi hasil alat async yang perlu
berjalan di dalam harness Codex native sebelum output alat diproyeksikan kembali
ke transkrip OpenClaw.

### Mode harness Codex native

Harness `codex` bawaan adalah mode Codex native untuk giliran agen
OpenClaw tertanam. Aktifkan dahulu Plugin `codex` bawaan, dan sertakan `codex` di
`plugins.allow` jika konfigurasi Anda menggunakan allowlist yang restriktif. Konfigurasi app-server native sebaiknya menggunakan `openai/gpt-*` dengan `embeddedHarness.runtime: "codex"`.
Gunakan `openai-codex/*` untuk OAuth Codex melalui PI. Referensi model
legacy `codex/*` tetap menjadi alias kompatibilitas untuk harness native.

Ketika mode ini berjalan, Codex memiliki thread id native, perilaku resume,
Compaction, dan eksekusi app-server. OpenClaw tetap memiliki kanal chat,
cermin transkrip yang terlihat, kebijakan alat, persetujuan, pengiriman media, dan pemilihan sesi. Gunakan `embeddedHarness.runtime: "codex"` dengan
`embeddedHarness.fallback: "none"` ketika Anda perlu membuktikan bahwa hanya jalur
app-server Codex yang dapat mengklaim eksekusi. Konfigurasi itu hanya merupakan guard pemilihan:
kegagalan app-server Codex sudah gagal langsung alih-alih retry melalui PI.

## Menonaktifkan fallback PI

Secara default, OpenClaw menjalankan agen tertanam dengan `agents.defaults.embeddedHarness`
diatur ke `{ runtime: "auto", fallback: "pi" }`. Dalam mode `auto`, harness Plugin
terdaftar dapat mengklaim pasangan provider/model. Jika tidak ada yang cocok, OpenClaw fallback
ke PI.

Atur `fallback: "none"` ketika Anda membutuhkan kegagalan pemilihan harness Plugin
jika tidak ada, alih-alih menggunakan PI. Kegagalan harness Plugin yang terpilih sudah gagal keras.
Ini tidak memblokir `runtime: "pi"` eksplisit atau `OPENCLAW_AGENT_RUNTIME=pi`.

Untuk eksekusi tertanam khusus Codex:

```json
{
  "agents": {
    "defaults": {
      "model": "openai/gpt-5.5",
      "embeddedHarness": {
        "runtime": "codex",
        "fallback": "none"
      }
    }
  }
}
```

Jika Anda ingin harness Plugin terdaftar apa pun mengklaim model yang cocok tetapi tidak pernah
ingin OpenClaw diam-diam fallback ke PI, pertahankan `runtime: "auto"` dan nonaktifkan
fallback:

```json
{
  "agents": {
    "defaults": {
      "embeddedHarness": {
        "runtime": "auto",
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
      "embeddedHarness": {
        "runtime": "auto",
        "fallback": "pi"
      }
    },
    "list": [
      {
        "id": "codex-only",
        "model": "openai/gpt-5.5",
        "embeddedHarness": {
          "runtime": "codex",
          "fallback": "none"
        }
      }
    ]
  }
}
```

`OPENCLAW_AGENT_RUNTIME` tetap mengoverride runtime yang dikonfigurasi. Gunakan
`OPENCLAW_AGENT_HARNESS_FALLBACK=none` untuk menonaktifkan fallback PI dari
environment.

```bash
OPENCLAW_AGENT_RUNTIME=codex \
OPENCLAW_AGENT_HARNESS_FALLBACK=none \
openclaw gateway run
```

Dengan fallback dinonaktifkan, sebuah sesi gagal lebih awal ketika harness yang diminta tidak
terdaftar, tidak mendukung provider/model yang telah diselesaikan, atau gagal sebelum
menghasilkan efek samping giliran. Itu disengaja untuk deployment khusus Codex dan
untuk live test yang harus membuktikan bahwa jalur app-server Codex benar-benar digunakan.

Pengaturan ini hanya mengendalikan harness agen tertanam. Pengaturan ini tidak menonaktifkan
perutean model khusus provider untuk gambar, video, musik, TTS, PDF, atau yang lainnya.

## Sesi native dan cermin transkrip

Sebuah harness dapat menyimpan session id native, thread id, atau token resume di sisi daemon.
Pertahankan binding itu secara eksplisit terkait dengan sesi OpenClaw, dan terus
mencerminkan output asisten/alat yang terlihat pengguna ke dalam transkrip OpenClaw.

Transkrip OpenClaw tetap menjadi lapisan kompatibilitas untuk:

- riwayat sesi yang terlihat kanal
- pencarian dan pengindeksan transkrip
- beralih kembali ke harness PI bawaan pada giliran berikutnya
- perilaku generik `/new`, `/reset`, dan penghapusan sesi

Jika harness Anda menyimpan binding sidecar, implementasikan `reset(...)` agar OpenClaw dapat
membersihkannya ketika sesi OpenClaw pemilik direset.

## Hasil alat dan media

Inti membangun daftar alat OpenClaw dan meneruskannya ke percobaan yang sudah disiapkan.
Ketika harness mengeksekusi pemanggilan alat dinamis, kembalikan hasil alat kembali melalui
bentuk hasil harness alih-alih mengirim media kanal sendiri.

Ini menjaga output teks, gambar, video, musik, TTS, persetujuan, dan alat pesan
tetap berada pada jalur pengiriman yang sama seperti eksekusi yang didukung PI.

## Batasan saat ini

- Path import publik bersifat generik, tetapi beberapa alias tipe attempt/result masih
  membawa nama `Pi` demi kompatibilitas.
- Instalasi harness pihak ketiga bersifat eksperimental. Utamakan Provider Plugin
  sampai Anda benar-benar memerlukan runtime sesi native.
- Pergantian harness didukung antar giliran. Jangan mengganti harness di tengah
  giliran setelah alat native, persetujuan, teks asisten, atau pengiriman pesan
  mulai berjalan.

## Terkait

- [Ikhtisar SDK](/id/plugins/sdk-overview)
- [Runtime Helpers](/id/plugins/sdk-runtime)
- [Provider Plugins](/id/plugins/sdk-provider-plugins)
- [Codex Harness](/id/plugins/codex-harness)
- [Provider Model](/id/concepts/model-providers)
