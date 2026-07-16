---
read_when:
    - Anda memerlukan hook atau alat Plugin untuk meminta konfirmasi sebelum efek samping dijalankan
    - Anda perlu mengonfigurasi tujuan pengiriman permintaan persetujuan plugin
    - Anda sedang memilih antara alat opsional, persetujuan eksekusi, dan persetujuan plugin
sidebarTitle: Permission requests
summary: Minta pengguna menyetujui panggilan alat Plugin dan permintaan izin yang dimiliki Plugin
title: Permintaan izin Plugin
x-i18n:
    generated_at: "2026-07-16T18:24:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 675534212e70cc7b2e7bdc801955929c6a8156b08d620483edf0133afc3bfdaa
    source_path: plugins/plugin-permission-requests.md
    workflow: 16
---

Permintaan izin Plugin memungkinkan kode Plugin menjeda pemanggilan alat atau operasi milik Plugin
hingga pengguna menyetujui atau menolaknya. Permintaan ini menggunakan alur Gateway
`plugin.approval.*` dan permukaan UI persetujuan yang sama yang menangani tombol
persetujuan dalam obrolan serta perintah `/approve`.

Gunakan permintaan izin Plugin untuk izin Plugin/aplikasi. Permintaan ini tidak menggantikan
persetujuan eksekusi host, daftar izin alat opsional, atau peninjauan izin
native Codex.

## Pilih gerbang yang tepat

Pilih gerbang yang sesuai dengan titik keputusan yang Anda perlukan:

| Gerbang                          | Gunakan ketika                                                               | Hal yang dikontrol                                                                                                      |
| -------------------------------- | ---------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Alat opsional                    | Alat tidak boleh terlihat oleh model hingga pengguna memilih untuk ikut serta. | Eksposur alat melalui `tools.allow`.                                                                               |
| Permintaan izin Plugin           | Hook Plugin atau operasi milik Plugin harus meminta izin sebelum suatu tindakan dijalankan. | Persetujuan runtime melalui `plugin.approval.*`.                                                                  |
| Persetujuan eksekusi             | Perintah host atau alat mirip shell memerlukan persetujuan operator.          | Kebijakan eksekusi host dan daftar izin eksekusi permanen.                                                              |
| Permintaan izin native Codex     | Codex meminta izin sebelum tindakan shell, file, MCP, atau server aplikasi native. | Penanganan persetujuan server aplikasi atau hook native Codex, yang dirutekan melalui persetujuan Plugin ketika OpenClaw memiliki prompt tersebut. |
| Permintaan persetujuan MCP       | Server MCP Codex meminta persetujuan untuk pemanggilan alat.                  | Respons persetujuan MCP yang dijembatani melalui persetujuan Plugin OpenClaw.                                           |

Alat opsional merupakan gerbang saat penemuan. Permintaan izin Plugin merupakan
gerbang per pemanggilan. Gunakan keduanya jika alat sensitif harus memerlukan persetujuan eksplisit
sebelum model dapat melihatnya dan persetujuan sebelum tindakan dijalankan.

## Minta persetujuan sebelum pemanggilan alat

Sebagian besar prompt yang dibuat oleh Plugin sebaiknya dimulai dalam hook `before_tool_call`. Hook tersebut
berjalan setelah model memilih alat dan sebelum OpenClaw menjalankannya:

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

- Buat `title` singkat dan berfokus pada tindakan; Gateway membatasinya hingga 80 karakter.
- Buat `description` spesifik dan terbatas; Gateway membatasinya hingga 512
  karakter.
- Sertakan tindakan, target, dan risiko. Jangan sertakan rahasia, token, atau
  payload privat yang tidak boleh muncul pada permukaan persetujuan dalam obrolan.
- `severity` menggunakan `"warning"` secara default jika dihilangkan. Gunakan `"critical"` hanya untuk
  tindakan yang keputusan kelirunya dapat menyebabkan kerusakan produksi atau kehilangan data.
- `allowedDecisions` menggunakan `["allow-once", "allow-always", "deny"]` secara default jika
  dihilangkan. Teruskan `["allow-once", "deny"]` jika kepercayaan persisten tidak aman untuk
  tindakan tersebut.
- `timeoutMs` secara default bernilai 120000 (2 menit) dan dibatasi hingga 600000 (10
  menit), apa pun nilai yang diminta.

## Perilaku keputusan

OpenClaw membuat persetujuan tertunda dengan ID `plugin:`, mengirimkannya ke
permukaan persetujuan yang tersedia, lalu menunggu keputusan.

| Keputusan         | Hasil                                                                     |
| ----------------- | ------------------------------------------------------------------------- |
| `allow-once`      | Pemanggilan saat ini dilanjutkan.                                         |
| `allow-always`    | Pemanggilan saat ini dilanjutkan dan keputusan diteruskan ke Plugin.       |
| `deny`            | Pemanggilan diblokir dengan hasil alat yang ditolak.                       |
| Batas waktu       | Pemanggilan diblokir.                                                      |
| Pembatalan        | Pemanggilan diblokir ketika proses dijalankan dibatalkan.                  |
| Tidak ada rute persetujuan | Pemanggilan diblokir karena tidak ada permukaan persetujuan terhubung yang dapat menyelesaikannya. |

Hanya keputusan persis `allow-once` dan `allow-always` yang diizinkan oleh
permintaan yang memungkinkan eksekusi. Keputusan yang tidak dikenal, salah format, tidak cocok, tidak ada, dan melewati batas waktu
gagal secara tertutup. Kolom lama `timeoutBehavior` tetap diterima untuk
kompatibilitas Plugin, tetapi sudah tidak digunakan lagi dan diabaikan; jangan tetapkan kolom tersebut dalam hook baru.

`allow-always` hanya bersifat permanen jika Plugin atau runtime yang meminta
mengimplementasikan persistensi tersebut. Untuk hook `before_tool_call.requireApproval` biasa,
OpenClaw memperlakukan `allow-once` dan `allow-always` sebagai keputusan persetujuan untuk
pemanggilan saat ini dan meneruskan nilai yang telah diselesaikan ke `onResolution`. Jika Plugin Anda
menawarkan `allow-always`, dokumentasikan dan implementasikan secara tepat pemanggilan mendatang mana yang
dipercayainya.

Jika hook juga mengembalikan `params`, OpenClaw menerapkan perubahan parameter tersebut hanya
setelah persetujuan berhasil. Hook dengan prioritas lebih rendah masih dapat memblokir setelah
hook dengan prioritas lebih tinggi meminta persetujuan.

`allowedDecisions` membatasi tombol dan perintah yang ditampilkan kepada pengguna.
Gateway menolak upaya penyelesaian untuk keputusan apa pun yang tidak ditawarkan oleh permintaan.

## Rutekan prompt persetujuan

Prompt persetujuan dapat diselesaikan pada permukaan UI lokal atau dalam saluran obrolan yang
mendukung penanganan persetujuan. Untuk meneruskan prompt persetujuan Plugin ke target obrolan
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

`approvals.plugin` tidak bergantung pada `approvals.exec`. Mengaktifkan penerusan persetujuan
eksekusi tidak merutekan prompt persetujuan Plugin, dan mengaktifkan penerusan persetujuan Plugin
tidak mengubah kebijakan eksekusi host.

Jika prompt menyertakan teks persetujuan manual, selesaikan dengan salah satu
keputusan yang ditawarkan:

```text
/approve <id> allow-once
/approve <id> allow-always
/approve <id> deny
```

Lihat [Persetujuan eksekusi lanjutan](/id/tools/exec-approvals-advanced#plugin-approval-forwarding)
untuk model penerusan lengkap, perilaku persetujuan dalam obrolan yang sama, pengiriman saluran
native, dan aturan penyetuju khusus saluran.

## Izin native Codex

Prompt izin native Codex juga dapat melewati persetujuan Plugin, tetapi
memiliki kepemilikan yang berbeda dari hook yang dibuat oleh Plugin.

- Permintaan persetujuan server aplikasi Codex dirutekan melalui OpenClaw setelah peninjauan Codex.
- Relai hook native `permission_request` dapat meminta izin melalui
  `plugin.approval.request` ketika relai tersebut diaktifkan.
- Permintaan persetujuan alat MCP dirutekan melalui persetujuan Plugin ketika Codex menandai
  `_meta.codex_approval_kind` sebagai `"mcp_tool_call"`.

Lihat [Runtime harness Codex](/id/plugins/codex-harness-runtime#native-permissions-and-mcp-elicitations)
untuk perilaku dan aturan fallback khusus Codex.

## Pemecahan masalah

**Alat menyatakan bahwa persetujuan Plugin tidak tersedia.** Tidak ada UI persetujuan atau rute
persetujuan yang dikonfigurasi yang menerima permintaan tersebut. Hubungkan klien yang mendukung persetujuan, gunakan
saluran yang mendukung `/approve` dalam obrolan yang sama, atau konfigurasikan `approvals.plugin`.

**`allow-always` muncul, tetapi pemanggilan berikutnya meminta lagi.** Alur persetujuan Plugin
generik tidak secara otomatis mempertahankan kepercayaan untuk hook arbitrer. Pertahankan
kepercayaan milik Plugin dalam Plugin Anda setelah `onResolution("allow-always")`, atau
tawarkan hanya `allow-once` dan `deny`.

**`/approve` menolak keputusan.** Permintaan membatasi
`allowedDecisions`. Gunakan salah satu keputusan yang tercetak dalam prompt.

**Prompt Discord, Matrix, Slack, atau Telegram dirutekan secara berbeda dari persetujuan
eksekusi.** Persetujuan Plugin dan persetujuan eksekusi menggunakan konfigurasi terpisah dan mungkin menggunakan
pemeriksaan otorisasi yang berbeda. Verifikasi `approvals.plugin` dan dukungan persetujuan
Plugin saluran tersebut, bukan hanya memeriksa `approvals.exec`.

## Terkait

- [Hook Plugin](/id/plugins/hooks#tool-call-policy)
- [Membangun Plugin](/id/plugins/building-plugins#registering-tools)
- [Persetujuan eksekusi lanjutan](/id/tools/exec-approvals-advanced#plugin-approval-forwarding)
- [Protokol Gateway](/id/gateway/protocol)
- [Runtime harness Codex](/id/plugins/codex-harness-runtime#native-permissions-and-mcp-elicitations)
