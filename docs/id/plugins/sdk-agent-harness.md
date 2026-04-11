---
read_when:
    - Anda sedang mengubah runtime agen tertanam atau registri harness
    - Anda sedang mendaftarkan harness agen dari plugin terbundel atau tepercaya
    - Anda perlu memahami bagaimana plugin Codex berhubungan dengan provider model
sidebarTitle: Agent Harness
summary: Permukaan SDK eksperimental untuk plugin yang menggantikan eksekutor agen tertanam tingkat rendah
title: Plugin Harness Agen
x-i18n:
    generated_at: "2026-04-11T02:46:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: 43c1f2c087230398b0162ed98449f239c8db1e822e51c7dcd40c54fa6c3374e1
    source_path: plugins/sdk-agent-harness.md
    workflow: 15
---

# Plugin Harness Agen

**Harness agen** adalah eksekutor tingkat rendah untuk satu giliran agen OpenClaw
yang sudah disiapkan. Ini bukan provider model, bukan saluran, dan bukan registri alat.

Gunakan permukaan ini hanya untuk plugin native yang terbundel atau tepercaya. Kontrak ini
masih eksperimental karena tipe parameternya sengaja mencerminkan runner
tertanam saat ini.

## Kapan menggunakan harness

Daftarkan harness agen ketika sebuah keluarga model memiliki runtime sesi native
sendiri dan transport provider OpenClaw normal bukan abstraksi yang tepat.

Contoh:

- server agen coding native yang memiliki thread dan compaction sendiri
- CLI atau daemon lokal yang harus melakukan streaming event plan/reasoning/tool native
- runtime model yang membutuhkan resume id sendiri selain transkrip sesi
  OpenClaw

Jangan mendaftarkan harness hanya untuk menambahkan API LLM baru. Untuk API model HTTP atau
WebSocket normal, buat [plugin provider](/id/plugins/sdk-provider-plugins).

## Apa yang masih dimiliki core

Sebelum harness dipilih, OpenClaw sudah menyelesaikan:

- provider dan model
- status auth runtime
- tingkat thinking dan anggaran konteks
- file transkrip/sesi OpenClaw
- workspace, sandbox, dan kebijakan alat
- callback balasan saluran dan callback streaming
- kebijakan fallback model dan perpindahan model live

Pemisahan itu disengaja. Harness menjalankan upaya yang sudah disiapkan; harness tidak memilih
provider, mengganti pengiriman saluran, atau diam-diam mengganti model.

## Mendaftarkan harness

**Import:** `openclaw/plugin-sdk/agent-harness`

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
    // Mulai atau lanjutkan thread native Anda.
    // Gunakan params.prompt, params.tools, params.images, params.onPartialReply,
    // params.onAgentEvent, dan field upaya siap pakai lainnya.
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

OpenClaw memilih harness setelah resolusi provider/model:

1. `OPENCLAW_AGENT_RUNTIME=<id>` memaksa harness terdaftar dengan id tersebut.
2. `OPENCLAW_AGENT_RUNTIME=pi` memaksa harness PI bawaan.
3. `OPENCLAW_AGENT_RUNTIME=auto` meminta harness terdaftar apakah mereka mendukung
   provider/model yang telah diselesaikan.
4. Jika tidak ada harness terdaftar yang cocok, OpenClaw menggunakan PI kecuali fallback PI
   dinonaktifkan.

Kegagalan harness plugin yang dipaksakan akan muncul sebagai kegagalan eksekusi. Dalam mode `auto`,
OpenClaw dapat fallback ke PI ketika harness plugin terpilih gagal sebelum sebuah
giliran menghasilkan efek samping. Setel `OPENCLAW_AGENT_HARNESS_FALLBACK=none` atau
`embeddedHarness.fallback: "none"` untuk menjadikan fallback tersebut sebagai kegagalan keras.

Plugin Codex terbundel mendaftarkan `codex` sebagai id harness-nya. Core memperlakukan itu
sebagai id harness plugin biasa; alias khusus Codex harus berada di plugin
atau config operator, bukan di pemilih runtime bersama.

## Penyandingan provider dan harness

Sebagian besar harness juga sebaiknya mendaftarkan provider. Provider membuat referensi model,
status auth, metadata model, dan pemilihan `/model` terlihat oleh bagian lain dari
OpenClaw. Harness kemudian mengklaim provider itu di `supports(...)`.

Plugin Codex terbundel mengikuti pola ini:

- id provider: `codex`
- referensi model pengguna: `codex/gpt-5.4`, `codex/gpt-5.2`, atau model lain yang dikembalikan
  oleh server aplikasi Codex
- id harness: `codex`
- auth: ketersediaan provider sintetis, karena harness Codex memiliki
  login/sesi Codex native
- permintaan app-server: OpenClaw mengirim id model mentah ke Codex dan membiarkan
  harness berbicara dengan protokol app-server native

Plugin Codex bersifat aditif. Referensi `openai/gpt-*` biasa tetap merupakan referensi provider OpenAI
dan terus menggunakan jalur provider OpenClaw normal. Pilih `codex/gpt-*`
ketika Anda menginginkan auth yang dikelola Codex, penemuan model Codex, thread native, dan
eksekusi app-server Codex. `/model` dapat berpindah di antara model Codex yang dikembalikan
oleh app-server Codex tanpa memerlukan kredensial provider OpenAI.

Untuk penyiapan operator, contoh prefix model, dan config khusus Codex, lihat
[Codex Harness](/id/plugins/codex-harness).

OpenClaw memerlukan app-server Codex `0.118.0` atau yang lebih baru. Plugin Codex memeriksa
handshake inisialisasi app-server dan memblokir server yang lebih lama atau tanpa versi sehingga
OpenClaw hanya berjalan terhadap permukaan protokol yang telah diuji.

## Nonaktifkan fallback PI

Secara default, OpenClaw menjalankan agen tertanam dengan `agents.defaults.embeddedHarness`
disetel ke `{ runtime: "auto", fallback: "pi" }`. Dalam mode `auto`, plugin
harness yang terdaftar dapat mengklaim pasangan provider/model. Jika tidak ada yang cocok, atau jika harness plugin yang dipilih otomatis
gagal sebelum menghasilkan output, OpenClaw fallback ke PI.

Setel `fallback: "none"` ketika Anda perlu membuktikan bahwa harness plugin adalah satu-satunya
runtime yang sedang digunakan. Ini menonaktifkan fallback PI otomatis; ini tidak memblokir
`runtime: "pi"` yang eksplisit atau `OPENCLAW_AGENT_RUNTIME=pi`.

Untuk eksekusi tertanam khusus Codex:

```json
{
  "agents": {
    "defaults": {
      "model": "codex/gpt-5.4",
      "embeddedHarness": {
        "runtime": "codex",
        "fallback": "none"
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
        "model": "codex/gpt-5.4",
        "embeddedHarness": {
          "runtime": "codex",
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

Dengan fallback dinonaktifkan, sesi gagal lebih awal ketika harness yang diminta tidak
terdaftar, tidak mendukung provider/model yang telah diselesaikan, atau gagal sebelum
menghasilkan efek samping giliran. Ini disengaja untuk deployment khusus Codex dan
untuk live test yang harus membuktikan jalur app-server Codex benar-benar digunakan.

Pengaturan ini hanya mengontrol harness agen tertanam. Ini tidak menonaktifkan
perutean model khusus provider untuk image, video, music, TTS, PDF, atau lainnya.

## Sesi native dan mirror transkrip

Harness dapat menyimpan id sesi native, id thread, atau token resume sisi daemon.
Pertahankan keterikatan itu secara eksplisit terkait dengan sesi OpenClaw, dan terus
mirror output asisten/alat yang terlihat pengguna ke dalam transkrip OpenClaw.

Transkrip OpenClaw tetap menjadi lapisan kompatibilitas untuk:

- riwayat sesi yang terlihat di saluran
- pencarian dan pengindeksan transkrip
- beralih kembali ke harness PI bawaan pada giliran berikutnya
- perilaku generik `/new`, `/reset`, dan penghapusan sesi

Jika harness Anda menyimpan sidecar binding, implementasikan `reset(...)` agar OpenClaw dapat
menghapusnya ketika sesi OpenClaw pemilik di-reset.

## Hasil alat dan media

Core membangun daftar alat OpenClaw dan meneruskannya ke upaya yang sudah disiapkan.
Saat harness mengeksekusi pemanggilan alat dinamis, kembalikan hasil alat melalui
bentuk hasil harness alih-alih mengirim media saluran sendiri.

Ini menjaga output text, image, video, music, TTS, persetujuan, dan alat pesan
tetap pada jalur pengiriman yang sama seperti eksekusi berbasis PI.

## Keterbatasan saat ini

- Jalur import publik bersifat generik, tetapi beberapa alias tipe upaya/hasil masih
  membawa nama `Pi` untuk kompatibilitas.
- Instalasi harness pihak ketiga bersifat eksperimental. Pilih plugin provider
  sampai Anda membutuhkan runtime sesi native.
- Perpindahan harness didukung antar giliran. Jangan mengganti harness di
  tengah giliran setelah alat native, persetujuan, text asisten, atau pengiriman
  pesan dimulai.

## Terkait

- [Ikhtisar SDK](/id/plugins/sdk-overview)
- [Helper Runtime](/id/plugins/sdk-runtime)
- [Plugin Provider](/id/plugins/sdk-provider-plugins)
- [Codex Harness](/id/plugins/codex-harness)
- [Provider Model](/id/concepts/model-providers)
