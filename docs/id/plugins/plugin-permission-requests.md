---
read_when:
    - Anda memerlukan hook atau alat Plugin untuk meminta konfirmasi sebelum efek samping dijalankan
    - Anda perlu mengonfigurasi ke mana prompt persetujuan Plugin dikirim
    - Anda sedang memutuskan antara alat opsional, persetujuan exec, dan persetujuan Plugin
sidebarTitle: Permission requests
summary: Minta pengguna menyetujui panggilan alat Plugin dan prompt izin milik Plugin
title: Permintaan izin Plugin
x-i18n:
    generated_at: "2026-06-27T17:50:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 72b860e9f8ddef80c70e943ec05353cbc0a917577382289649432a58c3ce6bd0
    source_path: plugins/plugin-permission-requests.md
    workflow: 16
---

Permintaan izin plugin memungkinkan kode plugin menjeda panggilan alat atau operasi
milik plugin hingga pengguna menyetujui atau menolaknya. Permintaan ini menggunakan alur Gateway
`plugin.approval.*` dan permukaan UI persetujuan yang sama yang menangani tombol
persetujuan chat dan perintah `/approve`.

Gunakan permintaan izin plugin untuk izin plugin/aplikasi. Permintaan ini tidak menggantikan
persetujuan eksekusi host, allowlist alat opsional, atau peninjauan izin native
Codex.

## Pilih gate yang tepat

Pilih gate yang cocok dengan titik keputusan yang Anda perlukan:

| Gate                             | Gunakan ketika                                                           | Yang dikontrol                                                                                                      |
| -------------------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------- |
| Alat opsional                    | Sebuah alat tidak boleh terlihat oleh model hingga pengguna ikut serta.  | Eksposur alat melalui `tools.allow`.                                                                                |
| Permintaan izin plugin           | Hook plugin atau operasi milik plugin harus bertanya sebelum satu tindakan berjalan. | Persetujuan runtime melalui `plugin.approval.*`.                                                           |
| Persetujuan eksekusi             | Perintah host atau alat mirip shell memerlukan persetujuan operator.     | Kebijakan eksekusi host dan allowlist eksekusi yang tahan lama.                                                     |
| Permintaan izin native Codex     | Codex bertanya sebelum tindakan native shell, file, MCP, atau app-server. | Penanganan persetujuan app-server atau hook native Codex, dirutekan melalui persetujuan plugin saat OpenClaw memiliki prompt. |
| Elisitasi persetujuan MCP        | Server MCP Codex meminta persetujuan untuk panggilan alat.               | Respons persetujuan MCP yang dijembatani melalui persetujuan plugin OpenClaw.                                       |

Alat opsional adalah gate saat penemuan. Permintaan izin plugin adalah
gate per panggilan. Gunakan keduanya saat alat sensitif harus memerlukan ikut serta
eksplisit sebelum model dapat melihatnya dan persetujuan sebelum tindakan berjalan.

## Minta persetujuan sebelum panggilan alat

Sebagian besar prompt yang dibuat plugin harus dimulai di hook `before_tool_call`. Hook ini
berjalan setelah model memilih alat dan sebelum OpenClaw mengeksekusinya:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

export default definePluginEntry({
  id: "deploy-policy",
  name: "Deploy Policy",
  register(api) {
    api.on("before_tool_call", async (event) => {
      if (event.toolName !== "deploy_service") {
        return;
      }

      const environment =
        typeof event.params.environment === "string" ? event.params.environment : "unknown";

      return {
        requireApproval: {
          title: "Deploy service",
          description: `Deploy service to ${environment}.`,
          severity: environment === "production" ? "critical" : "warning",
          allowedDecisions:
            environment === "production"
              ? ["allow-once", "deny"]
              : ["allow-once", "allow-always", "deny"],
          timeoutMs: 120_000,
          timeoutBehavior: "deny",
          onResolution(decision) {
            console.log(`deploy approval resolved: ${decision}`);
          },
        },
      };
    });
  },
});
```

Tulis teks prompt untuk orang yang akan menyetujui tindakan:

- Buat `title` singkat dan berfokus pada tindakan. Gateway menerima hingga 80
  karakter.
- Buat `description` spesifik dan terbatas. Gateway menerima hingga 256
  karakter.
- Sertakan tindakan, target, dan risiko. Jangan sertakan secret, token, atau
  payload pribadi yang tidak boleh muncul di permukaan persetujuan chat.
- Gunakan `severity: "critical"` hanya untuk tindakan ketika keputusan yang salah dapat
  menyebabkan kerusakan produksi atau kehilangan data.
- Gunakan `allowedDecisions: ["allow-once", "deny"]` saat kepercayaan persisten
  tidak aman untuk tindakan tersebut.

## Perilaku keputusan

OpenClaw membuat persetujuan tertunda dengan ID `plugin:`, mengirimkannya ke
permukaan persetujuan yang tersedia, dan menunggu keputusan.

| Keputusan         | Hasil                                                                     |
| ----------------- | ------------------------------------------------------------------------- |
| `allow-once`      | Panggilan saat ini berlanjut.                                             |
| `allow-always`    | Panggilan saat ini berlanjut dan keputusan diteruskan ke plugin.          |
| `deny`            | Panggilan diblokir dengan hasil alat yang ditolak.                        |
| Timeout           | Panggilan diblokir kecuali `timeoutBehavior` adalah `"allow"`.            |
| Pembatalan        | Panggilan diblokir saat run dibatalkan.                                   |
| Tidak ada rute persetujuan | Panggilan diblokir karena tidak ada permukaan persetujuan terhubung yang dapat menyelesaikannya. |

`allow-always` hanya tahan lama saat plugin atau runtime yang meminta menerapkan
persistensi tersebut. Untuk hook `before_tool_call.requireApproval` biasa,
OpenClaw memperlakukan `allow-once` dan `allow-always` sebagai keputusan persetujuan untuk
panggilan saat ini dan meneruskan nilai terselesaikan ke `onResolution`. Jika plugin Anda
menawarkan `allow-always`, dokumentasikan dan terapkan secara persis panggilan mendatang apa yang
dipercayainya.

Jika hook juga mengembalikan `params`, OpenClaw menerapkan perubahan parameter tersebut hanya
setelah persetujuan berhasil. Hook berprioritas lebih rendah masih dapat memblokir setelah
hook berprioritas lebih tinggi meminta persetujuan.

`allowedDecisions` membatasi tombol dan perintah yang ditampilkan kepada pengguna. Gateway
menolak upaya resolve untuk keputusan apa pun yang tidak ditawarkan oleh permintaan.

## Rutekan prompt persetujuan

Prompt persetujuan dapat diselesaikan di permukaan UI lokal atau di kanal chat yang
mendukung penanganan persetujuan. Untuk meneruskan prompt persetujuan plugin ke target chat
eksplisit, konfigurasikan `approvals.plugin`:

```json5
{
  approvals: {
    plugin: {
      enabled: true,
      mode: "targets",
      agentFilter: ["main"],
      targets: [{ channel: "slack", to: "U12345678" }],
    },
  },
}
```

`approvals.plugin` independen dari `approvals.exec`. Mengaktifkan penerusan persetujuan eksekusi
tidak merutekan prompt persetujuan plugin, dan mengaktifkan penerusan persetujuan plugin
tidak mengubah kebijakan eksekusi host.

Saat prompt menyertakan teks persetujuan manual, selesaikan dengan salah satu keputusan
yang ditawarkan:

```text
/approve <id> allow-once
/approve <id> allow-always
/approve <id> deny
```

Lihat [Persetujuan eksekusi lanjutan](/id/tools/exec-approvals-advanced#plugin-approval-forwarding)
untuk model penerusan lengkap, perilaku persetujuan dalam chat yang sama, pengiriman kanal
native, dan aturan pemberi persetujuan spesifik kanal.

## Izin native Codex

Prompt izin native Codex juga dapat berjalan melalui persetujuan plugin, tetapi
memiliki kepemilikan yang berbeda dari hook yang dibuat plugin.

- Permintaan persetujuan app-server Codex dirutekan melalui OpenClaw setelah peninjauan Codex.
- Relay hook native `permission_request` dapat meminta melalui
  `plugin.approval.request` saat relay tersebut diaktifkan.
- Elisitasi persetujuan alat MCP dirutekan melalui persetujuan plugin saat Codex menandai
  `_meta.codex_approval_kind` sebagai `"mcp_tool_call"`.

Lihat [Runtime harness Codex](/id/plugins/codex-harness-runtime#native-permissions-and-mcp-elicitations)
untuk perilaku khusus Codex dan aturan fallback.

## Pemecahan masalah

**Alat mengatakan persetujuan plugin tidak tersedia.** Tidak ada UI persetujuan atau rute
persetujuan terkonfigurasi yang menerima permintaan. Hubungkan klien yang mampu memberi persetujuan, gunakan
kanal yang mendukung `/approve` dalam chat yang sama, atau konfigurasikan `approvals.plugin`.

**`allow-always` muncul tetapi panggilan berikutnya meminta lagi.** Alur persetujuan plugin
generik tidak otomatis mempertahankan kepercayaan untuk hook arbitrer. Pertahankan
kepercayaan milik plugin di plugin Anda setelah `onResolution("allow-always")`, atau
tawarkan hanya `allow-once` dan `deny`.

**`/approve` menolak keputusan.** Permintaan membatasi
`allowedDecisions`. Gunakan salah satu keputusan yang dicetak dalam prompt.

**Prompt Slack, Discord, Telegram, atau Matrix dirutekan berbeda dari persetujuan eksekusi.** Persetujuan plugin dan persetujuan eksekusi menggunakan konfigurasi terpisah dan dapat menggunakan
pemeriksaan otorisasi yang berbeda. Verifikasi `approvals.plugin` dan dukungan persetujuan
plugin kanal, bukan hanya memeriksa `approvals.exec`.

## Terkait

- [Hook plugin](/id/plugins/hooks#tool-call-policy)
- [Membangun plugin](/id/plugins/building-plugins#registering-agent-tools)
- [Persetujuan eksekusi lanjutan](/id/tools/exec-approvals-advanced#plugin-approval-forwarding)
- [Protokol Gateway](/id/gateway/protocol)
- [Runtime harness Codex](/id/plugins/codex-harness-runtime#native-permissions-and-mcp-elicitations)
