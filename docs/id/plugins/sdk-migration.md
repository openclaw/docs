---
read_when:
    - Anda melihat peringatan OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - Anda melihat peringatan OPENCLAW_EXTENSION_API_DEPRECATED
    - Anda menggunakan api.registerEmbeddedExtensionFactory sebelum OpenClaw 2026.4.25
    - Anda sedang memperbarui Plugin ke arsitektur Plugin modern
    - Anda memelihara Plugin OpenClaw eksternal
sidebarTitle: Migrate to SDK
summary: Migrasikan dari lapisan kompatibilitas mundur lama ke SDK plugin modern
title: Migrasi SDK Plugin
x-i18n:
    generated_at: "2026-07-01T08:32:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8f05bd42cc0a6fc53f6670377b4330bb452b2a06f4d0542a494875970ee81e08
    source_path: plugins/sdk-migration.md
    workflow: 16
---

OpenClaw telah berpindah dari lapisan kompatibilitas mundur yang luas ke arsitektur Plugin modern dengan impor yang terfokus dan terdokumentasi. Jika Plugin Anda dibuat sebelum arsitektur baru, panduan ini membantu Anda melakukan migrasi.

## Apa yang berubah

Sistem Plugin lama menyediakan dua permukaan yang sangat terbuka yang memungkinkan Plugin mengimpor apa pun yang dibutuhkan dari satu titik masuk:

- **`openclaw/plugin-sdk/compat`** - satu impor yang mengekspor ulang puluhan helper. Ini diperkenalkan untuk menjaga Plugin lama berbasis hook tetap berfungsi saat arsitektur Plugin baru sedang dibangun.
- **`openclaw/plugin-sdk/infra-runtime`** - barrel helper runtime yang luas yang mencampur event sistem, status Heartbeat, antrean pengiriman, helper fetch/proxy, helper file, tipe approval, dan utilitas yang tidak terkait.
- **`openclaw/plugin-sdk/config-runtime`** - barrel kompatibilitas konfigurasi yang luas yang masih membawa helper load/write langsung yang sudah usang selama jendela migrasi.
- **`openclaw/extension-api`** - bridge yang memberi Plugin akses langsung ke helper sisi host seperti embedded agent runner.
- **`api.registerEmbeddedExtensionFactory(...)`** - hook ekstensi bundled khusus embedded-runner yang sudah dihapus yang dapat mengamati event embedded-runner seperti `tool_result`.

Permukaan impor yang luas sekarang **sudah usang**. Permukaan itu masih berfungsi saat runtime, tetapi Plugin baru tidak boleh menggunakannya, dan Plugin yang sudah ada sebaiknya bermigrasi sebelum rilis mayor berikutnya menghapusnya. API pendaftaran factory ekstensi khusus embedded-runner telah dihapus; gunakan middleware tool-result sebagai gantinya.

OpenClaw tidak menghapus atau menafsirkan ulang perilaku Plugin terdokumentasi dalam perubahan yang sama yang memperkenalkan penggantinya. Perubahan kontrak yang breaking harus lebih dulu melalui adapter kompatibilitas, diagnostik, dokumentasi, dan jendela deprecation. Ini berlaku untuk impor SDK, field manifest, API setup, hook, dan perilaku pendaftaran runtime.

<Warning>
  Lapisan kompatibilitas mundur akan dihapus dalam rilis mayor mendatang.
  Plugin yang masih mengimpor dari permukaan ini akan rusak saat itu terjadi.
  Pendaftaran factory ekstensi embedded lama sudah tidak dimuat lagi.
</Warning>

## Mengapa ini berubah

Pendekatan lama menyebabkan masalah:

- **Startup lambat** - mengimpor satu helper memuat puluhan modul yang tidak terkait
- **Dependensi sirkular** - ekspor ulang yang luas memudahkan terbentuknya siklus impor
- **Permukaan API tidak jelas** - tidak ada cara untuk mengetahui ekspor mana yang stabil vs internal

SDK Plugin modern memperbaiki ini: setiap path impor (`openclaw/plugin-sdk/\<subpath\>`) adalah modul kecil yang mandiri dengan tujuan yang jelas dan kontrak terdokumentasi.

Seam kemudahan provider lama untuk saluran bundled juga sudah dihapus. Seam helper bermerek saluran adalah pintasan mono-repo privat, bukan kontrak Plugin yang stabil. Gunakan subpath SDK generik yang sempit sebagai gantinya. Di dalam workspace Plugin bundled, simpan helper milik provider di `api.ts` atau `runtime-api.ts` milik Plugin tersebut.

Contoh provider bundled saat ini:

- Anthropic menyimpan helper stream khusus Claude di seam `api.ts` / `contract-api.ts` miliknya sendiri
- OpenAI menyimpan builder provider, helper model default, dan builder provider realtime di `api.ts` miliknya sendiri
- OpenRouter menyimpan builder provider dan helper onboarding/konfigurasi di `api.ts` miliknya sendiri

## Rencana migrasi Talk dan suara realtime

Kode Talk realtime voice, telephony, meeting, dan browser sedang dipindahkan dari pencatatan turn lokal permukaan ke controller sesi Talk bersama yang diekspor oleh `openclaw/plugin-sdk/realtime-voice`. Controller baru memiliki envelope event Talk umum, status turn aktif, status capture, status output-audio, riwayat event terbaru, dan penolakan stale-turn. Plugin provider harus tetap memiliki sesi realtime khusus vendor; Plugin permukaan harus tetap memiliki keunikan capture, playback, telephony, dan meeting.

Migrasi Talk ini sengaja memutus kompatibilitas secara bersih:

1. Pertahankan controller/runtime primitive bersama di
   `plugin-sdk/realtime-voice`.
2. Pindahkan permukaan bundled ke controller bersama: browser relay,
   managed-room handoff, voice-call realtime, voice-call streaming STT, Google
   Meet realtime, dan native push-to-talk.
3. Ganti keluarga RPC Talk lama dengan API final `talk.session.*` dan
   `talk.client.*`.
4. Iklankan satu saluran event Talk live di Gateway
   `hello-ok.features.events`: `talk.event`.
5. Hapus endpoint HTTP realtime lama dan path override instruksi saat request apa pun.

Kode baru tidak boleh memanggil `createTalkEventSequencer(...)` secara langsung kecuali sedang mengimplementasikan adapter level rendah atau fixture pengujian. Utamakan controller bersama agar event berscope turn tidak dapat dipancarkan tanpa turn id, panggilan `turnEnd` / `turnCancel` yang stale tidak dapat menghapus turn aktif yang lebih baru, dan event lifecycle output-audio tetap konsisten di telephony, meeting, browser relay, managed-room handoff, dan klien Talk native.

Bentuk API publik target adalah:

```typescript
// Gateway-owned Talk session API.
await gateway.request("talk.session.create", {
  mode: "realtime",
  transport: "gateway-relay",
  brain: "agent-consult",
  sessionKey: "main",
});
await gateway.request("talk.session.appendAudio", { sessionId, audioBase64 });
await gateway.request("talk.session.cancelOutput", { sessionId, reason: "barge-in" });
await gateway.request("talk.session.submitToolResult", {
  sessionId,
  callId,
  result: { status: "working" },
  options: { willContinue: true },
});
await gateway.request("talk.session.submitToolResult", {
  sessionId,
  callId,
  result: { status: "already_delivered" },
  options: { suppressResponse: true },
});
await gateway.request("talk.session.submitToolResult", { sessionId, callId, result });
await gateway.request("talk.session.close", { sessionId });

// Client-owned provider session API.
await gateway.request("talk.client.create", {
  mode: "realtime",
  transport: "webrtc",
  brain: "agent-consult",
  sessionKey: "main",
});
await gateway.request("talk.client.toolCall", { sessionKey, callId, name, args });
await gateway.request("talk.client.steer", { sessionKey, text, mode: "steer" });
```

Sesi WebRTC/provider-websocket milik browser menggunakan `talk.client.create`, karena browser memiliki negosiasi provider dan transport media sementara Gateway memiliki kredensial, instruksi, dan kebijakan tool. `talk.session.*` adalah permukaan umum yang dikelola Gateway untuk gateway-relay realtime, transkripsi gateway-relay, dan sesi STT/TTS native managed-room.

Konfigurasi lama yang menempatkan selector realtime di samping `talk.provider` / `talk.providers` harus diperbaiki dengan `openclaw doctor --fix`; runtime Talk tidak menafsirkan ulang konfigurasi provider speech/TTS sebagai konfigurasi provider realtime.

Kombinasi `talk.session.create` yang didukung sengaja dibuat kecil:

| Mode            | Transport       | Brain           | Pemilik            | Catatan                                                                                                            |
| --------------- | --------------- | --------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `realtime`      | `gateway-relay` | `agent-consult` | Gateway            | Audio provider full-duplex dijembatani melalui Gateway; panggilan tool dirutekan melalui tool agent-consult.       |
| `transcription` | `gateway-relay` | `none`          | Gateway            | Hanya streaming STT; caller mengirim audio input dan menerima event transkrip.                                     |
| `stt-tts`       | `managed-room`  | `agent-consult` | Native/client room | Room bergaya push-to-talk dan walkie-talkie tempat klien memiliki capture/playback dan Gateway memiliki status turn. |
| `stt-tts`       | `managed-room`  | `direct-tools`  | Native/client room | Mode room khusus admin untuk permukaan first-party tepercaya yang mengeksekusi action tool Gateway secara langsung. |

Peta metode yang dihapus:

| Lama                             | Baru                                                     |
| -------------------------------- | -------------------------------------------------------- |
| `talk.realtime.session`          | `talk.client.create`                                     |
| `talk.realtime.toolCall`         | `talk.client.toolCall`                                   |
| `talk.realtime.relayAudio`       | `talk.session.appendAudio`                               |
| `talk.realtime.relayCancel`      | `talk.session.cancelOutput` atau `talk.session.cancelTurn` |
| `talk.realtime.relayToolResult`  | `talk.session.submitToolResult`                          |
| `talk.realtime.relayStop`        | `talk.session.close`                                     |
| `talk.transcription.session`     | `talk.session.create({ mode: "transcription" })`         |
| `talk.transcription.relayAudio`  | `talk.session.appendAudio`                               |
| `talk.transcription.relayCancel` | `talk.session.cancelTurn`                                |
| `talk.transcription.relayStop`   | `talk.session.close`                                     |
| `talk.handoff.create`            | `talk.session.create({ transport: "managed-room" })`     |
| `talk.handoff.join`              | `talk.session.join`                                      |
| `talk.handoff.revoke`            | `talk.session.close`                                     |

Kosakata kontrol terpadu juga sengaja dibuat sempit:

  | Metode                          | Berlaku untuk                                           | Kontrak                                                                                                                                                                                    |
  | ------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
  | `talk.session.appendAudio`      | `realtime/gateway-relay`, `transcription/gateway-relay` | Tambahkan potongan audio PCM base64 ke sesi penyedia yang dimiliki oleh koneksi Gateway yang sama.                                                                                         |
  | `talk.session.startTurn`        | `stt-tts/managed-room`                                  | Mulai giliran pengguna managed-room.                                                                                                                                                       |
  | `talk.session.endTurn`          | `stt-tts/managed-room`                                  | Akhiri giliran aktif setelah validasi giliran kedaluwarsa.                                                                                                                                 |
  | `talk.session.cancelTurn`       | semua sesi milik Gateway                                | Batalkan pekerjaan capture/penyedia/agen/TTS aktif untuk suatu giliran.                                                                                                                    |
  | `talk.session.cancelOutput`     | `realtime/gateway-relay`                                | Hentikan keluaran audio asisten tanpa harus mengakhiri giliran pengguna.                                                                                                                   |
  | `talk.session.submitToolResult` | `realtime/gateway-relay`                                | Selesaikan panggilan alat penyedia yang dipancarkan oleh relay; teruskan `options.willContinue` untuk keluaran sementara atau `options.suppressResponse` untuk memenuhi panggilan tanpa respons asisten lain. |
  | `talk.session.steer`            | sesi Talk yang didukung agen                            | Kirim kontrol lisan `status`, `steer`, `cancel`, atau `followup` ke run tertanam aktif yang diselesaikan dari sesi Talk.                                                                   |
  | `talk.session.close`            | semua sesi terpadu                                      | Hentikan sesi relay atau cabut status managed-room, lalu lupakan id sesi terpadu.                                                                                                          |

  Jangan memperkenalkan kasus khusus penyedia atau platform di inti agar ini berfungsi.
  Inti memiliki semantik sesi Talk. Plugin penyedia memiliki penyiapan sesi vendor.
  Panggilan suara dan Google Meet memiliki adaptor telepon/rapat. Browser dan aplikasi
  native memiliki UX capture/pemutaran perangkat.

  ## Kebijakan kompatibilitas

  Untuk Plugin eksternal, pekerjaan kompatibilitas mengikuti urutan ini:

  1. tambahkan kontrak baru
  2. pertahankan perilaku lama yang dihubungkan melalui adaptor kompatibilitas
  3. keluarkan diagnostik atau peringatan yang menyebutkan jalur lama dan penggantinya
  4. cakup kedua jalur dalam pengujian
  5. dokumentasikan deprekasi dan jalur migrasi
  6. hapus hanya setelah jendela migrasi yang diumumkan, biasanya dalam rilis mayor

  Maintainer dapat mengaudit antrean migrasi saat ini dengan
  `pnpm plugins:boundary-report`. Gunakan `pnpm plugins:boundary-report:summary` untuk
  jumlah ringkas, `--owner <id>` untuk satu Plugin atau pemilik kompatibilitas, dan
  `pnpm plugins:boundary-report:ci` ketika gate CI harus gagal pada catatan
  kompatibilitas yang jatuh tempo, impor SDK reserved lintas pemilik, atau subpath SDK
  reserved yang tidak digunakan. Laporan mengelompokkan catatan
  kompatibilitas yang dideprekasi berdasarkan tanggal penghapusan, menghitung referensi kode/dok lokal,
  menampilkan impor SDK reserved lintas pemilik, dan merangkum bridge SDK
  memory-host privat agar pembersihan kompatibilitas tetap eksplisit alih-alih
  bergantung pada pencarian ad hoc. Subpath SDK reserved harus memiliki penggunaan pemilik yang dilacak;
  ekspor helper reserved yang tidak digunakan harus dihapus dari SDK publik.

  Jika suatu field manifest masih diterima, penulis Plugin dapat terus menggunakannya hingga
  dokumentasi dan diagnostik menyatakan sebaliknya. Kode baru harus memilih pengganti
  yang terdokumentasi, tetapi Plugin yang ada tidak boleh rusak selama rilis minor
  biasa.

  ## Cara bermigrasi

  <Steps>
  <Step title="Migrate runtime config load/write helpers">
    Plugin bawaan harus berhenti memanggil
    `api.runtime.config.loadConfig()` dan
    `api.runtime.config.writeConfigFile(...)` secara langsung. Pilih config yang sudah
    diteruskan ke jalur panggilan aktif. Handler berumur panjang yang membutuhkan
    snapshot proses saat ini dapat menggunakan `api.runtime.config.current()`. Alat agen
    berumur panjang harus menggunakan `ctx.getRuntimeConfig()` milik konteks alat di dalam
    `execute` agar alat yang dibuat sebelum penulisan config tetap melihat config runtime
    yang telah diperbarui.

    Penulisan config harus melalui helper transaksional dan memilih kebijakan
    setelah-penulisan:

    ```typescript
    await api.runtime.config.mutateConfigFile({
      afterWrite: { mode: "auto" },
      mutate(draft) {
        draft.plugins ??= {};
      },
    });
    ```

    Gunakan `afterWrite: { mode: "restart", reason: "..." }` ketika pemanggil tahu
    perubahan memerlukan restart gateway yang bersih, dan
    `afterWrite: { mode: "none", reason: "..." }` hanya ketika pemanggil memiliki tindak
    lanjut dan sengaja ingin menekan perencana reload.
    Hasil mutasi menyertakan ringkasan `followUp` bertipe untuk pengujian dan logging;
    gateway tetap bertanggung jawab untuk menerapkan atau menjadwalkan restart.
    `loadConfig` dan `writeConfigFile` tetap sebagai helper kompatibilitas yang
    dideprekasi untuk Plugin eksternal selama jendela migrasi dan memperingatkan sekali dengan
    kode kompatibilitas `runtime-config-load-write`. Plugin bawaan dan kode runtime repo
    dilindungi oleh guardrail pemindai di
    `pnpm check:deprecated-api-usage` dan
    `pnpm check:no-runtime-action-load-config`: penggunaan Plugin produksi baru
    langsung gagal, penulisan config langsung gagal, metode server gateway harus menggunakan
    snapshot runtime permintaan, helper kirim/aksi/klien channel runtime
    harus menerima config dari boundary-nya, dan modul runtime berumur panjang memiliki
    nol panggilan ambient `loadConfig()` yang diizinkan.

    Kode Plugin baru juga harus menghindari impor barrel kompatibilitas luas
    `openclaw/plugin-sdk/config-runtime`. Gunakan subpath SDK sempit yang sesuai
    dengan pekerjaannya:

    | Kebutuhan | Impor |
    | --- | --- |
    | Tipe config seperti `OpenClawConfig` | `openclaw/plugin-sdk/config-contracts` |
    | Assertion config yang sudah dimuat dan lookup config entri Plugin | `openclaw/plugin-sdk/plugin-config-runtime` |
    | Pembacaan snapshot runtime saat ini | `openclaw/plugin-sdk/runtime-config-snapshot` |
    | Penulisan config | `openclaw/plugin-sdk/config-mutation` |
    | Helper store sesi | `openclaw/plugin-sdk/session-store-runtime` |
    | Config tabel Markdown | `openclaw/plugin-sdk/markdown-table-runtime` |
    | Helper runtime kebijakan grup | `openclaw/plugin-sdk/runtime-group-policy` |
    | Resolusi input secret | `openclaw/plugin-sdk/secret-input-runtime` |
    | Override model/sesi | `openclaw/plugin-sdk/model-session-runtime` |

    Plugin bawaan dan pengujiannya dilindungi pemindai dari barrel luas
    agar impor dan mock tetap lokal pada perilaku yang mereka butuhkan. Barrel luas
    masih ada untuk kompatibilitas eksternal, tetapi kode baru tidak boleh
    bergantung padanya.

  </Step>

  <Step title="Migrate embedded tool-result extensions to middleware">
    Plugin bawaan harus mengganti handler hasil alat khusus embedded-runner
    `api.registerEmbeddedExtensionFactory(...)` dengan middleware netral-runtime.

    ```typescript
    // OpenClaw and Codex runtime dynamic tools
    api.registerAgentToolResultMiddleware(async (event) => {
      return compactToolResult(event);
    }, {
      runtimes: ["openclaw", "codex"],
    });
    ```

    Perbarui manifest Plugin pada saat yang sama:

    ```json
    {
      "contracts": {
        "agentToolResultMiddleware": ["openclaw", "codex"]
      }
    }
    ```

    Plugin terpasang juga dapat mendaftarkan middleware hasil alat ketika mereka
    diaktifkan secara eksplisit dan mendeklarasikan setiap runtime yang ditargetkan di
    `contracts.agentToolResultMiddleware`. Pendaftaran middleware terpasang yang tidak dideklarasikan
    ditolak.

  </Step>

  <Step title="Migrate approval-native handlers to capability facts">
    Plugin channel berkemampuan persetujuan kini mengekspos perilaku persetujuan native melalui
    `approvalCapability.nativeRuntime` plus registry konteks-runtime bersama.

    Perubahan utama:

    - Ganti `approvalCapability.handler.loadRuntime(...)` dengan
      `approvalCapability.nativeRuntime`
    - Pindahkan auth/pengiriman khusus persetujuan dari wiring lama `plugin.auth` /
      `plugin.approvals` ke `approvalCapability`
    - `ChannelPlugin.approvals` telah dihapus dari kontrak channel-plugin publik;
      pindahkan field pengiriman/native/render ke `approvalCapability`
    - `plugin.auth` tetap hanya untuk alur login/logout channel; hook auth persetujuan
      di sana tidak lagi dibaca oleh inti
    - Daftarkan objek runtime milik channel seperti klien, token, atau aplikasi Bolt
      melalui `openclaw/plugin-sdk/channel-runtime-context`
    - Jangan kirim pemberitahuan reroute milik Plugin dari handler persetujuan native;
      inti kini memiliki pemberitahuan diarahkan-ke-tempat-lain dari hasil pengiriman aktual
    - Saat meneruskan `channelRuntime` ke `createChannelManager(...)`, sediakan
      permukaan `createPluginRuntime().channel` yang nyata. Stub parsial ditolak.

    Lihat `/plugins/sdk-channel-plugins` untuk layout kapabilitas persetujuan saat ini.

  </Step>

  <Step title="Audit Windows wrapper fallback behavior">
    Jika Plugin Anda menggunakan `openclaw/plugin-sdk/windows-spawn`, wrapper Windows
    `.cmd`/`.bat` yang tidak terselesaikan kini gagal tertutup kecuali Anda secara eksplisit meneruskan
    `allowShellFallback: true`.

    ```typescript
    // Before
    const program = applyWindowsSpawnProgramPolicy({ candidate });

    // After
    const program = applyWindowsSpawnProgramPolicy({
      candidate,
      // Only set this for trusted compatibility callers that intentionally
      // accept shell-mediated fallback.
      allowShellFallback: true,
    });
    ```

    Jika pemanggil Anda tidak sengaja bergantung pada fallback shell, jangan setel
    `allowShellFallback` dan tangani error yang dilempar sebagai gantinya.

  </Step>

  <Step title="Find deprecated imports">
    Cari Plugin Anda untuk impor dari salah satu permukaan yang dideprekasi:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "plugin-sdk/infra-runtime" my-plugin/
    grep -r "plugin-sdk/config-runtime" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="Replace with focused imports">
    Setiap ekspor dari permukaan lama dipetakan ke jalur impor modern tertentu:

    ```typescript
    // Before (deprecated backwards-compatibility layer)
    import {
      createChannelReplyPipeline,
      createPluginRuntimeStore,
      resolveControlCommandGate,
    } from "openclaw/plugin-sdk/compat";

    // After (modern focused imports)
    import { createChannelReplyPipeline } from "openclaw/plugin-sdk/channel-reply-pipeline";
    import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
    import { resolveControlCommandGate } from "openclaw/plugin-sdk/command-auth";
    ```

    Untuk helper sisi host, gunakan runtime Plugin yang diinjeksi alih-alih mengimpor
    secara langsung:

    ```typescript
    // Before (deprecated extension-api bridge)
    import { runEmbeddedAgent } from "openclaw/extension-api";
    const result = await runEmbeddedAgent({ sessionId, prompt });

    // After (injected runtime)
    const result = await api.runtime.agent.runEmbeddedAgent({ sessionId, prompt });
    ```

    Pola yang sama berlaku untuk helper bridge lama lainnya:

    | Impor lama | Padanan modern |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | helper penyimpanan sesi | `api.runtime.agent.session.*` |

  </Step>

  <Step title="Ganti impor infra-runtime yang luas">
    `openclaw/plugin-sdk/infra-runtime` masih ada untuk kompatibilitas
    eksternal, tetapi kode baru sebaiknya mengimpor permukaan helper terfokus
    yang benar-benar dibutuhkannya:

    | Kebutuhan | Impor |
    | --- | --- |
    | Helper antrean peristiwa sistem | `openclaw/plugin-sdk/system-event-runtime` |
    | Helper bangun, peristiwa, dan visibilitas Heartbeat | `openclaw/plugin-sdk/heartbeat-runtime` |
    | Pengurasan antrean pengiriman tertunda | `openclaw/plugin-sdk/delivery-queue-runtime` |
    | Telemetri aktivitas kanal | `openclaw/plugin-sdk/channel-activity-runtime` |
    | Cache dedupe dalam memori | `openclaw/plugin-sdk/dedupe-runtime` |
    | Helper jalur file/media lokal yang aman | `openclaw/plugin-sdk/file-access-runtime` |
    | Fetch yang sadar dispatcher | `openclaw/plugin-sdk/runtime-fetch` |
    | Helper proxy dan fetch yang dilindungi | `openclaw/plugin-sdk/fetch-runtime` |
    | Tipe kebijakan dispatcher SSRF | `openclaw/plugin-sdk/ssrf-dispatcher` |
    | Tipe permintaan/penyelesaian persetujuan | `openclaw/plugin-sdk/approval-runtime` |
    | Helper payload balasan persetujuan dan perintah | `openclaw/plugin-sdk/approval-reply-runtime` |
    | Helper pemformatan kesalahan | `openclaw/plugin-sdk/error-runtime` |
    | Penantian kesiapan transport | `openclaw/plugin-sdk/transport-ready-runtime` |
    | Helper token aman | `openclaw/plugin-sdk/secure-random-runtime` |
    | Konkurensi tugas asinkron terbatas | `openclaw/plugin-sdk/concurrency-runtime` |
    | Koersi numerik | `openclaw/plugin-sdk/number-runtime` |
    | Kunci asinkron lokal proses | `openclaw/plugin-sdk/async-lock-runtime` |
    | Kunci file | `openclaw/plugin-sdk/file-lock` |

    Plugin bawaan dilindungi pemindai dari `infra-runtime`, sehingga kode repo
    tidak dapat mundur ke barrel yang luas.

  </Step>

  <Step title="Migrasikan helper rute kanal">
    Kode rute kanal baru sebaiknya menggunakan `openclaw/plugin-sdk/channel-route`.
    Nama route-key dan comparable-target yang lebih lama tetap ada sebagai alias
    kompatibilitas selama jendela migrasi, tetapi plugin baru sebaiknya menggunakan
    nama rute yang menjelaskan perilakunya secara langsung:

    | Helper lama | Helper modern |
    | --- | --- |
    | `channelRouteIdentityKey(...)` | `channelRouteDedupeKey(...)` |
    | `channelRouteKey(...)` | `channelRouteCompactKey(...)` |
    | `ComparableChannelTarget` | `ChannelRouteParsedTarget` |
    | `comparableChannelTargetsMatch(...)` | `channelRouteTargetsMatchExact(...)` |
    | `comparableChannelTargetsShareRoute(...)` | `channelRouteTargetsShareConversation(...)` |

    Helper rute modern menormalkan `{ channel, to, accountId, threadId }`
    secara konsisten di seluruh persetujuan native, penekanan balasan, dedupe
    masuk, pengiriman Cron, dan perutean sesi.

    Jangan tambahkan penggunaan baru `ChannelMessagingAdapter.parseExplicitTarget` atau
    helper loaded-route yang didukung parser (`parseExplicitTargetForLoadedChannel`
    atau `resolveRouteTargetForLoadedChannel`) atau
    `resolveChannelRouteTargetWithParser(...)` dari `plugin-sdk/channel-route`.
    Hook tersebut sudah deprecated dan hanya tetap ada untuk plugin lama selama
    jendela migrasi. Plugin kanal baru sebaiknya menggunakan
    `messaging.targetResolver.resolveTarget(...)` untuk normalisasi id target
    dan fallback saat direktori tidak ditemukan, `messaging.inferTargetChatType(...)` saat core
    memerlukan jenis peer awal, dan `messaging.resolveOutboundSessionRoute(...)`
    untuk sesi native penyedia dan identitas thread.

  </Step>

  <Step title="Build dan uji">
    ```bash
    pnpm build
    pnpm test -- my-plugin/
    ```
  </Step>
</Steps>

## Referensi jalur impor

  <Accordion title="Common import path table">
  | Jalur impor | Tujuan | Ekspor utama |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | Helper entri plugin kanonis | `definePluginEntry` |
  | `plugin-sdk/core` | Ekspor ulang payung legacy untuk definisi/builder entri channel | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Ekspor skema konfigurasi root | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Helper entri penyedia tunggal | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Definisi dan builder entri channel terfokus | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Helper wizard penyiapan bersama | Penerjemah penyiapan, prompt allowlist, builder status penyiapan |
  | `plugin-sdk/setup-runtime` | Helper runtime saat penyiapan | `createSetupTranslator`, adaptor patch penyiapan yang aman diimpor, helper catatan pencarian, `promptResolvedAllowFrom`, `splitSetupEntries`, proksi penyiapan terdelegasi |
  | `plugin-sdk/setup-adapter-runtime` | Alias adaptor penyiapan yang tidak digunakan lagi | Gunakan `plugin-sdk/setup-runtime` |
  | `plugin-sdk/setup-tools` | Helper alat penyiapan | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Helper multi-akun | Helper daftar akun/konfigurasi/gerbang tindakan |
  | `plugin-sdk/account-id` | Helper ID akun | `DEFAULT_ACCOUNT_ID`, normalisasi ID akun |
  | `plugin-sdk/account-resolution` | Helper pencarian akun | Helper pencarian akun + fallback default |
  | `plugin-sdk/account-helpers` | Helper akun sempit | Helper daftar akun/tindakan akun |
  | `plugin-sdk/channel-setup` | Adaptor wizard penyiapan | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, plus `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | Primitif pemasangan DM | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Pengawatan prefiks balasan, pengetikan, dan pengiriman sumber | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
  | `plugin-sdk/channel-config-helpers` | Factory adaptor konfigurasi dan helper akses DM | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
  | `plugin-sdk/channel-config-schema` | Builder skema konfigurasi | Hanya primitif skema konfigurasi channel bersama dan builder generik |
  | `plugin-sdk/bundled-channel-config-schema` | Skema konfigurasi bawaan | Hanya plugin bawaan yang dikelola OpenClaw; plugin baru harus menentukan skema lokal plugin |
  | `plugin-sdk/channel-config-schema-legacy` | Skema konfigurasi bawaan yang tidak digunakan lagi | Hanya alias kompatibilitas; gunakan `plugin-sdk/bundled-channel-config-schema` untuk plugin bawaan yang dikelola |
  | `plugin-sdk/telegram-command-config` | Helper konfigurasi perintah Telegram | Normalisasi nama perintah, pemangkasan deskripsi, validasi duplikat/konflik |
  | `plugin-sdk/channel-policy` | Resolusi kebijakan Grup/DM | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Facade kompatibilitas yang tidak digunakan lagi | Gunakan `plugin-sdk/channel-outbound` |
  | `plugin-sdk/inbound-envelope` | Helper envelope masuk | Helper rute bersama + builder envelope |
  | `plugin-sdk/channel-inbound` | Helper penerimaan masuk | Pembuatan konteks, pemformatan, root, runner, pengiriman balasan siap, dan predikat dispatch |
  | `plugin-sdk/messaging-targets` | Jalur impor parsing target yang tidak digunakan lagi | Gunakan `plugin-sdk/channel-targets` untuk helper parsing target generik, `plugin-sdk/channel-route` untuk perbandingan rute, dan `messaging.targetResolver` / `messaging.resolveOutboundSessionRoute` milik plugin untuk resolusi target spesifik penyedia |
  | `plugin-sdk/outbound-media` | Helper media keluar | Pemuatan media keluar bersama |
  | `plugin-sdk/outbound-send-deps` | Facade kompatibilitas yang tidak digunakan lagi | Gunakan `plugin-sdk/channel-outbound` |
  | `plugin-sdk/channel-outbound` | Helper siklus hidup pesan keluar | Adaptor pesan, tanda terima, helper pengiriman tahan lama, helper pratinjau/streaming langsung, opsi balasan, helper siklus hidup, identitas keluar, dan perencanaan payload |
  | `plugin-sdk/channel-streaming` | Facade kompatibilitas yang tidak digunakan lagi | Gunakan `plugin-sdk/channel-outbound` |
  | `plugin-sdk/outbound-runtime` | Facade kompatibilitas yang tidak digunakan lagi | Gunakan `plugin-sdk/channel-outbound` |
  | `plugin-sdk/thread-bindings-runtime` | Helper pengikatan thread | Siklus hidup pengikatan thread dan helper adaptor |
  | `plugin-sdk/agent-media-payload` | Helper payload media legacy | Builder payload media agen untuk tata letak kolom legacy |
  | `plugin-sdk/channel-runtime` | Shim kompatibilitas yang tidak digunakan lagi | Hanya utilitas runtime channel legacy |
  | `plugin-sdk/channel-send-result` | Tipe hasil pengiriman | Tipe hasil balasan |
  | `plugin-sdk/runtime-store` | Penyimpanan plugin persisten | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Helper runtime luas | Helper runtime/logging/cadangan/pemasangan plugin |
  | `plugin-sdk/runtime-env` | Helper env runtime sempit | Helper logger/env runtime, timeout, percobaan ulang, dan backoff |
  | `plugin-sdk/plugin-runtime` | Helper runtime plugin bersama | Helper perintah/hook/http/interaktif plugin |
  | `plugin-sdk/hook-runtime` | Helper pipeline hook | Helper pipeline Webhook/internal hook bersama |
  | `plugin-sdk/lazy-runtime` | Helper runtime lazy | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Helper proses | Helper exec bersama |
  | `plugin-sdk/cli-runtime` | Helper runtime CLI | Pemformatan perintah, penantian, helper versi |
  | `plugin-sdk/gateway-runtime` | Helper Gateway | Klien Gateway, helper mulai siap event-loop, dan helper patch status channel |
  | `plugin-sdk/config-runtime` | Shim kompatibilitas konfigurasi yang tidak digunakan lagi | Utamakan `config-contracts`, `plugin-config-runtime`, `runtime-config-snapshot`, dan `config-mutation` |
  | `plugin-sdk/telegram-command-config` | Helper perintah Telegram | Helper validasi perintah Telegram yang stabil terhadap fallback saat permukaan kontrak Telegram bawaan tidak tersedia |
  | `plugin-sdk/approval-runtime` | Helper prompt persetujuan | Payload persetujuan exec/plugin, helper kapabilitas/profil persetujuan, helper perutean/runtime persetujuan native, dan pemformatan jalur tampilan persetujuan terstruktur |
  | `plugin-sdk/approval-auth-runtime` | Helper auth persetujuan | Resolusi pemberi persetujuan, auth tindakan chat yang sama |
  | `plugin-sdk/approval-client-runtime` | Helper klien persetujuan | Helper profil/filter persetujuan exec native |
  | `plugin-sdk/approval-delivery-runtime` | Helper pengiriman persetujuan | Adaptor kapabilitas/pengiriman persetujuan native |
  | `plugin-sdk/approval-gateway-runtime` | Helper Gateway persetujuan | Helper resolusi Gateway persetujuan bersama |
  | `plugin-sdk/approval-handler-adapter-runtime` | Helper adaptor persetujuan | Helper pemuatan adaptor persetujuan native ringan untuk entrypoint channel panas |
  | `plugin-sdk/approval-handler-runtime` | Helper handler persetujuan | Helper runtime handler persetujuan yang lebih luas; utamakan batas adaptor/Gateway yang lebih sempit saat sudah cukup |
  | `plugin-sdk/approval-native-runtime` | Helper target persetujuan | Helper pengikatan target/akun persetujuan native |
  | `plugin-sdk/approval-reply-runtime` | Helper balasan persetujuan | Helper payload balasan persetujuan exec/plugin |
  | `plugin-sdk/channel-runtime-context` | Helper konteks runtime channel | Helper register/get/watch konteks runtime channel generik |
  | `plugin-sdk/security-runtime` | Helper keamanan | Helper bersama untuk kepercayaan, gerbang DM, file/jalur berbatas root, konten eksternal, dan pengumpulan rahasia |
  | `plugin-sdk/ssrf-policy` | Helper kebijakan SSRF | Helper kebijakan allowlist host dan jaringan privat |
  | `plugin-sdk/ssrf-runtime` | Helper runtime SSRF | Dispatcher tersemat, fetch terlindungi, helper kebijakan SSRF |
  | `plugin-sdk/system-event-runtime` | Helper event sistem | `enqueueSystemEvent`, `peekSystemEventEntries` |
  | `plugin-sdk/heartbeat-runtime` | Helper Heartbeat | Helper bangun, event, dan visibilitas Heartbeat |
  | `plugin-sdk/delivery-queue-runtime` | Helper antrean pengiriman | `drainPendingDeliveries` |
  | `plugin-sdk/channel-activity-runtime` | Helper aktivitas channel | `recordChannelActivity` |
  | `plugin-sdk/dedupe-runtime` | Helper dedupe | Cache dedupe dalam memori |
  | `plugin-sdk/file-access-runtime` | Helper akses file | Helper jalur file/media lokal aman |
  | `plugin-sdk/transport-ready-runtime` | Helper kesiapan transport | `waitForTransportReady` |
  | `plugin-sdk/exec-approvals-runtime` | Helper kebijakan persetujuan exec | `loadExecApprovals`, `resolveExecApprovalsFromFile`, `ExecApprovalsFile` |
  | `plugin-sdk/collection-runtime` | Helper cache berbatas | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Helper gerbang diagnostik | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Helper pemformatan error | `formatUncaughtError`, `isApprovalNotFoundError`, helper grafik error |
  | `plugin-sdk/fetch-runtime` | Helper fetch/proksi terbungkus | `resolveFetch`, helper proksi, helper opsi EnvHttpProxyAgent |
  | `plugin-sdk/host-runtime` | Helper normalisasi host | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Helper percobaan ulang | `RetryConfig`, `retryAsync`, runner kebijakan |
  | `plugin-sdk/allow-from` | Pemformatan allowlist dan pemetaan input | `formatAllowFromLowercase`, `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Helper gerbang perintah dan permukaan perintah | `resolveControlCommandGate`, helper otorisasi pengirim, helper registri perintah termasuk pemformatan menu argumen dinamis |
  | `plugin-sdk/command-status` | Perender status/bantuan perintah | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | Parsing input rahasia | Helper input rahasia |
  | `plugin-sdk/webhook-ingress` | Helper permintaan Webhook | Utilitas target Webhook |
  | `plugin-sdk/webhook-request-guards` | Helper guard body Webhook | Helper baca/batas body permintaan |
  | `plugin-sdk/reply-runtime` | Runtime balasan bersama | Dispatch masuk, Heartbeat, perencana balasan, chunking |
  | `plugin-sdk/reply-dispatch-runtime` | Helper dispatch balasan sempit | Finalisasi, dispatch penyedia, dan helper label percakapan |
  | `plugin-sdk/reply-history` | Helper riwayat balasan | `createChannelHistoryWindow`; ekspor kompatibilitas helper peta yang tidak digunakan lagi seperti `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, dan `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Perencanaan referensi balasan | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Helper chunk balasan | Helper chunking teks/markdown |
  | `plugin-sdk/session-store-runtime` | Helper penyimpanan sesi | Helper jalur penyimpanan + updated-at |
  | `plugin-sdk/state-paths` | Helper jalur state | Helper direktori state dan OAuth |
  | `plugin-sdk/routing` | Pembantu perutean/kunci sesi | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, pembantu normalisasi kunci sesi |
  | `plugin-sdk/status-helpers` | Pembantu status channel | Pembuat ringkasan status channel/akun, default status runtime, pembantu metadata masalah |
  | `plugin-sdk/target-resolver-runtime` | Pembantu penyelesai target | Pembantu penyelesai target bersama |
  | `plugin-sdk/string-normalization-runtime` | Pembantu normalisasi string | Pembantu normalisasi slug/string |
  | `plugin-sdk/request-url` | Pembantu URL permintaan | Ekstrak URL string dari input mirip permintaan |
  | `plugin-sdk/run-command` | Pembantu perintah berwaktu | Runner perintah berwaktu dengan stdout/stderr yang dinormalisasi |
  | `plugin-sdk/param-readers` | Pembaca param | Pembaca param umum untuk tool/CLI |
  | `plugin-sdk/tool-payload` | Ekstraksi payload tool | Ekstrak payload ternormalisasi dari objek hasil tool |
  | `plugin-sdk/tool-send` | Ekstraksi pengiriman tool | Ekstrak bidang target pengiriman kanonis dari argumen tool |
  | `plugin-sdk/temp-path` | Pembantu path sementara | Pembantu path unduhan sementara bersama |
  | `plugin-sdk/logging-core` | Pembantu logging | Pembantu logger subsistem dan redaksi |
  | `plugin-sdk/markdown-table-runtime` | Pembantu tabel Markdown | Pembantu mode tabel Markdown |
  | `plugin-sdk/reply-payload` | Tipe balasan pesan | Tipe payload balasan |
  | `plugin-sdk/provider-setup` | Pembantu penyiapan penyedia lokal/dihosting sendiri yang dikurasi | Pembantu penemuan/konfigurasi penyedia yang dihosting sendiri |
  | `plugin-sdk/self-hosted-provider-setup` | Pembantu penyiapan penyedia yang dihosting sendiri dan kompatibel dengan OpenAI secara terfokus | Pembantu penemuan/konfigurasi penyedia yang dihosting sendiri yang sama |
  | `plugin-sdk/provider-auth-runtime` | Pembantu autentikasi runtime penyedia | Pembantu resolusi kunci API runtime |
  | `plugin-sdk/provider-auth-api-key` | Pembantu penyiapan kunci API penyedia | Pembantu onboarding/penulisan profil kunci API |
  | `plugin-sdk/provider-auth-result` | Pembantu hasil autentikasi penyedia | Pembuat hasil autentikasi OAuth standar |
  | `plugin-sdk/provider-selection-runtime` | Pembantu pemilihan penyedia | Pemilihan penyedia terkonfigurasi-atau-otomatis dan penggabungan konfigurasi penyedia mentah |
  | `plugin-sdk/provider-env-vars` | Pembantu variabel lingkungan penyedia | Pembantu pencarian variabel lingkungan autentikasi penyedia |
  | `plugin-sdk/provider-model-shared` | Pembantu model/replay penyedia bersama | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, pembuat kebijakan replay bersama, pembantu endpoint penyedia, dan pembantu normalisasi ID model |
  | `plugin-sdk/provider-catalog-shared` | Pembantu katalog penyedia bersama | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Patch onboarding penyedia | Pembantu konfigurasi onboarding |
  | `plugin-sdk/provider-http` | Pembantu HTTP penyedia | Pembantu kapabilitas HTTP/endpoint penyedia generik, termasuk pembantu formulir multipart transkripsi audio |
  | `plugin-sdk/provider-web-fetch` | Pembantu web-fetch penyedia | Pembantu pendaftaran/cache penyedia web-fetch |
  | `plugin-sdk/provider-web-search-config-contract` | Pembantu konfigurasi web-search penyedia | Pembantu konfigurasi/kredensial web-search yang sempit untuk penyedia yang tidak memerlukan wiring pengaktifan plugin |
  | `plugin-sdk/provider-web-search-contract` | Pembantu kontrak web-search penyedia | Pembantu kontrak konfigurasi/kredensial web-search yang sempit seperti `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`, serta setter/getter kredensial berskup |
  | `plugin-sdk/provider-web-search` | Pembantu web-search penyedia | Pembantu pendaftaran/cache/runtime penyedia web-search |
  | `plugin-sdk/provider-tools` | Pembantu kompatibilitas tool/skema penyedia | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, serta pembersihan skema + diagnostik DeepSeek/Gemini/OpenAI |
  | `plugin-sdk/provider-usage` | Pembantu penggunaan penyedia | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage`, dan pembantu penggunaan penyedia lainnya |
  | `plugin-sdk/provider-stream` | Pembantu wrapper stream penyedia | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, tipe wrapper stream, dan pembantu wrapper bersama Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/provider-transport-runtime` | Pembantu transport penyedia | Pembantu transport penyedia native seperti fetch terjaga, ekstraksi teks hasil tool, transformasi pesan transport, dan stream event transport yang dapat ditulis |
  | `plugin-sdk/keyed-async-queue` | Antrean async terurut | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Pembantu media bersama | Pembantu pengambilan/transformasi/penyimpanan media, probing dimensi video berbasis ffprobe, dan pembuat payload media |
  | `plugin-sdk/media-generation-runtime` | Pembantu pembuatan media bersama | Pembantu failover bersama, pemilihan kandidat, dan pesan model yang tidak ada untuk pembuatan gambar/video/musik |
  | `plugin-sdk/media-understanding` | Pembantu pemahaman media | Tipe penyedia pemahaman media plus ekspor pembantu gambar/audio yang menghadap penyedia |
  | `plugin-sdk/text-runtime` | Ekspor kompatibilitas teks luas yang tidak digunakan lagi | Gunakan `string-coerce-runtime`, `text-chunking`, `text-utility-runtime`, dan `logging-core` |
  | `plugin-sdk/text-chunking` | Pembantu pemotongan teks | Pembantu pemotongan teks keluar |
  | `plugin-sdk/speech` | Pembantu ucapan | Tipe penyedia ucapan plus pembantu arahan, registry, validasi yang menghadap penyedia, dan pembuat TTS yang kompatibel dengan OpenAI |
  | `plugin-sdk/speech-core` | Inti ucapan bersama | Tipe penyedia ucapan, registry, arahan, normalisasi |
  | `plugin-sdk/realtime-transcription` | Pembantu transkripsi realtime | Tipe penyedia, pembantu registry, dan pembantu sesi WebSocket bersama |
  | `plugin-sdk/realtime-voice` | Pembantu suara realtime | Tipe penyedia, pembantu registry/resolusi, pembantu sesi bridge, antrean talk-back agen bersama, kontrol suara run aktif, kesehatan transkrip/event, penekanan echo, pencocokan pertanyaan konsultasi, koordinasi konsultasi paksa, pelacakan konteks giliran, pelacakan aktivitas output, dan pembantu konsultasi konteks cepat |
  | `plugin-sdk/image-generation` | Pembantu pembuatan gambar | Tipe penyedia pembuatan gambar plus pembantu aset/data URL gambar dan pembuat penyedia gambar yang kompatibel dengan OpenAI |
  | `plugin-sdk/image-generation-core` | Inti pembuatan gambar bersama | Tipe pembuatan gambar, failover, autentikasi, dan pembantu registry |
  | `plugin-sdk/music-generation` | Pembantu pembuatan musik | Tipe penyedia/permintaan/hasil pembuatan musik |
  | `plugin-sdk/music-generation-core` | Inti pembuatan musik bersama | Tipe pembuatan musik, pembantu failover, pencarian penyedia, dan parsing ref model |
  | `plugin-sdk/video-generation` | Pembantu pembuatan video | Tipe penyedia/permintaan/hasil pembuatan video |
  | `plugin-sdk/video-generation-core` | Inti pembuatan video bersama | Tipe pembuatan video, pembantu failover, pencarian penyedia, dan parsing ref model |
  | `plugin-sdk/interactive-runtime` | Pembantu balasan interaktif | Normalisasi/reduksi payload balasan interaktif |
  | `plugin-sdk/channel-config-primitives` | Primitif konfigurasi channel | Primitif skema konfigurasi channel yang sempit |
  | `plugin-sdk/channel-config-writes` | Pembantu penulisan konfigurasi channel | Pembantu otorisasi penulisan konfigurasi channel |
  | `plugin-sdk/channel-plugin-common` | Prelude channel bersama | Ekspor prelude Plugin channel bersama |
  | `plugin-sdk/channel-status` | Pembantu status channel | Pembantu snapshot/ringkasan status channel bersama |
  | `plugin-sdk/allowlist-config-edit` | Pembantu konfigurasi allowlist | Pembantu edit/baca konfigurasi allowlist |
  | `plugin-sdk/group-access` | Pembantu akses grup | Pembantu keputusan akses grup bersama |
  | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | Fasad kompatibilitas yang tidak digunakan lagi | Gunakan `plugin-sdk/channel-inbound` |
  | `plugin-sdk/direct-dm-guard-policy` | Pembantu guard Direct-DM | Pembantu kebijakan guard pra-crypto yang sempit |
  | `plugin-sdk/extension-shared` | Pembantu ekstensi bersama | Primitif pembantu channel/status pasif dan proxy ambient |
  | `plugin-sdk/webhook-targets` | Pembantu target Webhook | Registry target Webhook dan pembantu instalasi rute |
  | `plugin-sdk/webhook-path` | Alias path webhook yang tidak digunakan lagi | Gunakan `plugin-sdk/webhook-ingress` |
  | `plugin-sdk/web-media` | Pembantu media web bersama | Pembantu pemuatan media jarak jauh/lokal |
  | `plugin-sdk/zod` | Ekspor ulang kompatibilitas Zod yang tidak digunakan lagi | Impor `zod` dari `zod` secara langsung |
  | `plugin-sdk/memory-core` | Pembantu memory-core terbundel | Permukaan pembantu manajer/konfigurasi/file/CLI memori |
  | `plugin-sdk/memory-core-engine-runtime` | Fasad runtime mesin memori | Fasad runtime indeks/pencarian memori |
  | `plugin-sdk/memory-core-host-embedding-registry` | Registry embedding memori | Pembantu registry penyedia embedding memori ringan |
  | `plugin-sdk/memory-core-host-engine-foundation` | Mesin foundation host memori | Ekspor mesin foundation host memori |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Mesin embedding host memori | Kontrak embedding memori, akses registry, penyedia lokal, dan pembantu batch/jarak jauh generik; penyedia jarak jauh konkret berada di Plugin pemiliknya |
  | `plugin-sdk/memory-core-host-engine-qmd` | Mesin QMD host memori | Ekspor mesin QMD host memori |
  | `plugin-sdk/memory-core-host-engine-storage` | Mesin penyimpanan host memori | Ekspor mesin penyimpanan host memori |
  | `plugin-sdk/memory-core-host-multimodal` | Pembantu multimodal host memori | Pembantu multimodal host memori |
  | `plugin-sdk/memory-core-host-query` | Pembantu kueri host memori | Pembantu kueri host memori |
  | `plugin-sdk/memory-core-host-secret` | Pembantu rahasia host memori | Pembantu rahasia host memori |
  | `plugin-sdk/memory-core-host-events` | Alias event memori yang tidak digunakan lagi | Gunakan `plugin-sdk/memory-host-events` |
  | `plugin-sdk/memory-core-host-status` | Pembantu status host memori | Pembantu status host memori |
  | `plugin-sdk/memory-core-host-runtime-cli` | Runtime CLI host memori | Pembantu runtime CLI host memori |
  | `plugin-sdk/memory-core-host-runtime-core` | Runtime inti host memori | Pembantu runtime inti host memori |
  | `plugin-sdk/memory-core-host-runtime-files` | Pembantu file/runtime host memori | Pembantu file/runtime host memori |
  | `plugin-sdk/memory-host-core` | Alias runtime inti host memori | Alias netral-vendor untuk pembantu runtime inti host memori |
  | `plugin-sdk/memory-host-events` | Alias jurnal event host memori | Alias netral-vendor untuk pembantu jurnal event host memori |
  | `plugin-sdk/memory-host-files` | Alias file/runtime memori yang tidak digunakan lagi | Gunakan `plugin-sdk/memory-core-host-runtime-files` |
  | `plugin-sdk/memory-host-markdown` | Pembantu markdown terkelola | Pembantu markdown-terkelola bersama untuk Plugin yang berdekatan dengan memori |
  | `plugin-sdk/memory-host-search` | Fasad pencarian Active Memory | Fasad runtime manajer pencarian Active Memory lazy |
  | `plugin-sdk/memory-host-status` | Alias status host memori yang tidak digunakan lagi | Gunakan `plugin-sdk/memory-core-host-status` |
  | `plugin-sdk/testing` | Utilitas pengujian | Barrel kompatibilitas lokal-repo yang tidak digunakan lagi; gunakan subpath pengujian lokal-repo yang terfokus seperti `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/channel-target-testing`, `plugin-sdk/test-env`, dan `plugin-sdk/test-fixtures` |
</Accordion>

Tabel ini sengaja merupakan subset migrasi umum, bukan seluruh permukaan SDK.
Inventaris entrypoint compiler berada di
`scripts/lib/plugin-sdk-entrypoints.json`; ekspor paket dihasilkan dari
subset publik.

Seam pembantu Plugin bawaan yang dicadangkan telah dihentikan dari peta ekspor
SDK publik kecuali facade kompatibilitas yang didokumentasikan secara eksplisit
seperti shim `plugin-sdk/discord` yang sudah deprecated dan dipertahankan untuk
paket `@openclaw/discord@2026.3.13` yang telah dipublikasikan. Pembantu khusus
pemilik berada di dalam paket plugin pemiliknya; perilaku host bersama harus
bergerak melalui kontrak SDK generik seperti `plugin-sdk/gateway-runtime`,
`plugin-sdk/security-runtime`, dan `plugin-sdk/plugin-config-runtime`.

Gunakan impor tersempit yang cocok dengan tugasnya. Jika Anda tidak dapat
menemukan ekspor, periksa sumber di `src/plugin-sdk/` atau tanyakan kepada
maintainer kontrak generik mana yang seharusnya memilikinya.

## Deprecation aktif

Deprecation yang lebih sempit yang berlaku di seluruh SDK plugin, kontrak
provider, permukaan runtime, dan manifest. Masing-masing masih berfungsi hari
ini tetapi akan dihapus dalam rilis mayor mendatang. Entri di bawah setiap item
memetakan API lama ke pengganti kanonisnya.

<AccordionGroup>
  <Accordion title="pembangun bantuan command-auth → command-status">
    **Lama (`openclaw/plugin-sdk/command-auth`)**: `buildCommandsMessage`,
    `buildCommandsMessagePaginated`, `buildHelpMessage`.

    **Baru (`openclaw/plugin-sdk/command-status`)**: signature yang sama, ekspor
    yang sama - hanya diimpor dari subpath yang lebih sempit. `command-auth`
    mengekspor ulang semuanya sebagai stub kompatibilitas.

    ```typescript
    // Before
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-auth";

    // After
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-status";
    ```

  </Accordion>

  <Accordion title="Pembantu gating penyebutan → resolveInboundMentionDecision">
    **Lama**: `resolveInboundMentionRequirement({ facts, policy })` dan
    `shouldDropInboundForMention(...)` dari
    `openclaw/plugin-sdk/channel-inbound` atau
    `openclaw/plugin-sdk/channel-mention-gating`.

    **Baru**: `resolveInboundMentionDecision({ facts, policy })` - mengembalikan
    satu objek keputusan alih-alih dua panggilan terpisah.

    Plugin kanal downstream (Slack, Discord, Matrix, MS Teams) sudah
    beralih.

  </Accordion>

  <Accordion title="Shim runtime kanal dan pembantu aksi kanal">
    `openclaw/plugin-sdk/channel-runtime` adalah shim kompatibilitas untuk
    plugin kanal lama. Jangan mengimpornya dari kode baru; gunakan
    `openclaw/plugin-sdk/channel-runtime-context` untuk mendaftarkan objek
    runtime.

    Pembantu `channelActions*` di `openclaw/plugin-sdk/channel-actions` sudah
    deprecated bersama ekspor kanal "actions" mentah. Ekspos kemampuan melalui
    permukaan `presentation` semantik sebagai gantinya - plugin kanal
    mendeklarasikan apa yang mereka render (kartu, tombol, pilihan) alih-alih
    nama aksi mentah mana yang mereka terima.

  </Accordion>

  <Accordion title="Pembantu tool() provider pencarian web → createTool() pada plugin">
    **Lama**: factory `tool()` dari `openclaw/plugin-sdk/provider-web-search`.

    **Baru**: implementasikan `createTool(...)` langsung pada plugin provider.
    OpenClaw tidak lagi memerlukan pembantu SDK untuk mendaftarkan wrapper tool.

  </Accordion>

  <Accordion title="Envelope kanal plaintext → BodyForAgent">
    **Lama**: `formatInboundEnvelope(...)` (dan
    `ChannelMessageForAgent.channelEnvelope`) untuk membangun envelope prompt
    plaintext datar dari pesan kanal inbound.

    **Baru**: `BodyForAgent` plus blok konteks pengguna terstruktur. Plugin
    kanal melampirkan metadata routing (thread, topik, reply-to, reaksi) sebagai
    field bertipe alih-alih menggabungkannya ke string prompt. Pembantu
    `formatAgentEnvelope(...)` masih didukung untuk envelope hasil sintesis
    yang menghadap asisten, tetapi envelope plaintext inbound sedang
    dihentikan.

    Area terdampak: `inbound_claim`, `message_received`, dan plugin kanal
    kustom apa pun yang melakukan post-processing teks `channelEnvelope`.

  </Accordion>

  <Accordion title="hook deactivate → gateway_stop">
    **Lama**: `api.on("deactivate", handler)`.

    **Baru**: `api.on("gateway_stop", handler)`. Event dan konteksnya adalah
    kontrak pembersihan shutdown yang sama; hanya nama hook yang berubah.

    ```typescript
    // Before
    api.on("deactivate", async (event, ctx) => {
      await stopPluginService(ctx);
    });

    // After
    api.on("gateway_stop", async (event, ctx) => {
      await stopPluginService(ctx);
    });
    ```

    `deactivate` tetap terhubung sebagai alias kompatibilitas yang deprecated
    hingga setelah 2026-08-16.

  </Accordion>

  <Accordion title="hook subagent_spawning → pengikatan thread core">
    **Lama**: `api.on("subagent_spawning", handler)` yang mengembalikan
    `threadBindingReady` atau `deliveryOrigin`.

    **Baru**: biarkan core menyiapkan binding subagent `thread: true` melalui
    adapter pengikatan sesi kanal. Gunakan `api.on("subagent_spawned", handler)`
    hanya untuk observasi pascapeluncuran.

    ```typescript
    // Before
    api.on("subagent_spawning", async () => ({
      status: "ok",
      threadBindingReady: true,
      deliveryOrigin: { channel: "discord", to: "channel:123", threadId: "456" },
    }));

    // After
    api.on("subagent_spawned", async (event) => {
      await observeSubagentLaunch(event);
    });
    ```

    `subagent_spawning`, `PluginHookSubagentSpawningEvent`,
    `PluginHookSubagentSpawningResult`, dan
    `SubagentLifecycleHookRunner.runSubagentSpawning(...)` tetap hanya sebagai
    permukaan kompatibilitas deprecated sementara plugin eksternal bermigrasi.

  </Accordion>

  <Accordion title="Tipe discovery provider → tipe katalog provider">
    Empat alias tipe discovery kini merupakan wrapper tipis di atas tipe era
    katalog:

    | Alias lama                | Tipe baru                 |
    | ------------------------- | ------------------------- |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`    |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext`  |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`   |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`   |

    Ditambah bag statis `ProviderCapabilities` legacy - plugin provider harus
    menggunakan hook provider eksplisit seperti `buildReplayPolicy`,
    `normalizeToolSchemas`, dan `wrapStreamFn` alih-alih objek statis.

  </Accordion>

  <Accordion title="Hook kebijakan Thinking → resolveThinkingProfile">
    **Lama** (tiga hook terpisah pada `ProviderThinkingPolicy`):
    `isBinaryThinking(ctx)`, `supportsXHighThinking(ctx)`, dan
    `resolveDefaultThinkingLevel(ctx)`.

    **Baru**: satu `resolveThinkingProfile(ctx)` yang mengembalikan
    `ProviderThinkingProfile` dengan `id` kanonis, `label` opsional, dan daftar
    level berperingkat. OpenClaw menurunkan nilai tersimpan yang stale menurut
    peringkat profil secara otomatis.

    Konteks mencakup `provider`, `modelId`, `reasoning` gabungan opsional,
    dan fakta `compat` model gabungan opsional. Plugin provider dapat
    menggunakan fakta katalog tersebut untuk mengekspos profil khusus model
    hanya ketika kontrak permintaan yang dikonfigurasi mendukungnya.

    Implementasikan satu hook alih-alih tiga. Hook legacy tetap berfungsi selama
    jendela deprecation tetapi tidak dikomposisikan dengan hasil profil.

  </Accordion>

  <Accordion title="Provider auth eksternal → contracts.externalAuthProviders">
    **Lama**: mengimplementasikan hook auth eksternal tanpa mendeklarasikan
    provider tersebut di manifest plugin.

    **Baru**: deklarasikan `contracts.externalAuthProviders` di manifest plugin
    **dan** implementasikan `resolveExternalAuthProfiles(...)`.

    ```json
    {
      "contracts": {
        "externalAuthProviders": ["anthropic", "openai"]
      }
    }
    ```

  </Accordion>

  <Accordion title="Lookup env-var provider → setup.providers[].envVars">
    Field manifest **lama**: `providerAuthEnvVars: { anthropic: ["ANTHROPIC_API_KEY"] }`.

    **Baru**: cerminkan lookup env-var yang sama ke `setup.providers[].envVars`
    pada manifest. Ini mengonsolidasikan metadata env setup/status di satu
    tempat dan menghindari boot runtime plugin hanya untuk menjawab lookup
    env-var.

    `providerAuthEnvVars` tetap didukung melalui adapter kompatibilitas hingga
    jendela deprecation ditutup.

  </Accordion>

  <Accordion title="Registrasi plugin memori → registerMemoryCapability">
    **Lama**: tiga panggilan terpisah -
    `api.registerMemoryPromptSection(...)`,
    `api.registerMemoryFlushPlan(...)`,
    `api.registerMemoryRuntime(...)`.

    **Baru**: satu panggilan pada API memory-state -
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`.

    Slot yang sama, satu panggilan registrasi. Pembantu prompt dan korpus
    aditif (`registerMemoryPromptSupplement`, `registerMemoryCorpusSupplement`)
    tidak terdampak.

  </Accordion>

  <Accordion title="API provider embedding memori">
    **Lama**: `api.registerMemoryEmbeddingProvider(...)` plus
    `contracts.memoryEmbeddingProviders`.

    **Baru**: `api.registerEmbeddingProvider(...)` plus
    `contracts.embeddingProviders`.

    Kontrak provider embedding generik dapat digunakan kembali di luar memori
    dan merupakan jalur yang didukung untuk provider baru. API registrasi
    khusus memori tetap terhubung sebagai kompatibilitas deprecated sementara
    provider yang ada bermigrasi. Laporan inspeksi plugin melaporkan penggunaan
    non-bundled sebagai utang kompatibilitas.

  </Accordion>

  <Accordion title="Tipe pesan sesi subagent diganti nama">
    Dua alias tipe legacy masih diekspor dari `src/plugins/runtime/types.ts`:

    | Lama                          | Baru                            |
    | ----------------------------- | ------------------------------- |
    | `SubagentReadSessionParams`   | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`   | `SubagentGetSessionMessagesResult` |

    Metode runtime `readSession` sudah deprecated dan digantikan oleh
    `getSessionMessages`. Signature sama; metode lama meneruskan panggilan ke
    metode baru.

  </Accordion>

  <Accordion title="runtime.tasks.flow → runtime.tasks.managedFlows">
    **Lama**: `runtime.tasks.flow` (tunggal) mengembalikan accessor task-flow
    live.

    **Baru**: `runtime.tasks.managedFlows` mempertahankan runtime mutasi
    TaskFlow terkelola untuk plugin yang membuat, memperbarui, membatalkan,
    atau menjalankan tugas turunan dari flow. Gunakan `runtime.tasks.flows`
    ketika plugin hanya memerlukan pembacaan berbasis DTO.

    ```typescript
    // Before
    const flow = api.runtime.tasks.flow.fromToolContext(ctx);
    // After
    const flow = api.runtime.tasks.managedFlows.fromToolContext(ctx);
    ```

  </Accordion>

  <Accordion title="Factory ekstensi tertanam → middleware hasil tool agen">
    Dibahas di "Cara bermigrasi → Migrasikan ekstensi hasil tool tertanam ke
    middleware" di atas. Disertakan di sini demi kelengkapan: jalur khusus
    embedded-runner yang dihapus
    `api.registerEmbeddedExtensionFactory(...)` digantikan oleh
    `api.registerAgentToolResultMiddleware(...)` dengan daftar runtime eksplisit
    di `contracts.agentToolResultMiddleware`.
  </Accordion>

  <Accordion title="Alias OpenClawSchemaType → OpenClawConfig">
    `OpenClawSchemaType` yang diekspor ulang dari `openclaw/plugin-sdk` kini
    merupakan alias satu baris untuk `OpenClawConfig`. Utamakan nama kanonis.

    ```typescript
    // Before
    import type { OpenClawSchemaType } from "openclaw/plugin-sdk";
    // After
    import type { OpenClawConfig } from "openclaw/plugin-sdk/config-schema";
    ```

  </Accordion>
</AccordionGroup>

<Note>
Deprecation tingkat ekstensi (di dalam plugin kanal/provider bawaan di bawah
`extensions/`) dilacak di dalam barrel `api.ts` dan `runtime-api.ts` mereka
sendiri. Hal itu tidak memengaruhi kontrak plugin pihak ketiga dan tidak
dicantumkan di sini. Jika Anda menggunakan barrel lokal plugin bawaan secara
langsung, baca komentar deprecation di barrel tersebut sebelum upgrade.
</Note>

## Linimasa penghapusan

| Kapan                  | Apa yang terjadi                                                       |
| ---------------------- | ----------------------------------------------------------------------- |
| **Sekarang**           | Permukaan yang sudah tidak digunakan memunculkan peringatan runtime     |
| **Rilis mayor berikutnya** | Permukaan yang sudah tidak digunakan akan dihapus; plugin yang masih menggunakannya akan gagal |

Semua plugin inti sudah dimigrasikan. Plugin eksternal harus bermigrasi
sebelum rilis mayor berikutnya.

## Menekan peringatan untuk sementara

Atur variabel lingkungan ini saat Anda mengerjakan migrasi:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

Ini adalah jalan keluar sementara, bukan solusi permanen.

## Terkait

- [Memulai](/id/plugins/building-plugins) - buat plugin pertama Anda
- [Ikhtisar SDK](/id/plugins/sdk-overview) - referensi lengkap impor subpath
- [Plugin Channel](/id/plugins/sdk-channel-plugins) - membuat plugin channel
- [Plugin Provider](/id/plugins/sdk-provider-plugins) - membuat plugin provider
- [Internal Plugin](/id/plugins/architecture) - pembahasan mendalam arsitektur
- [Manifes Plugin](/id/plugins/manifest) - referensi skema manifes
