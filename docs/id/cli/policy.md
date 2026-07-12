---
read_when:
    - Anda ingin memeriksa pengaturan OpenClaw berdasarkan policy.jsonc yang telah disusun
    - Anda ingin temuan kebijakan dalam lint doctor
    - Anda memerlukan hash pengesahan kebijakan sebagai bukti audit
summary: Referensi CLI untuk pemeriksaan kepatuhan `openclaw policy`
title: Kebijakan
x-i18n:
    generated_at: "2026-07-12T14:02:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 280f9ed1e741786f85dfed978690eb18a03c8fbde20e0d01e31a9d215ae0a128
    source_path: cli/policy.md
    workflow: 16
---

# `openclaw policy`

`openclaw policy` disediakan oleh Plugin Policy bawaan. Ini adalah lapisan
kesesuaian perusahaan di atas pengaturan OpenClaw yang sudah ada, bukan sistem
konfigurasi kedua. Anda menulis persyaratan dalam `policy.jsonc`; OpenClaw
mengamati ruang kerja aktif sebagai bukti; policy melaporkan penyimpangan melalui
`doctor --lint`. Policy tidak memberlakukan pemanggilan alat atau menulis ulang
perilaku waktu proses pada saat permintaan, dan tidak mengesahkan penyimpanan
kredensial per agen seperti `auth-profiles.json`.

Policy memeriksa kanal yang dikonfigurasi, server MCP, penyedia model, postur
SSRF jaringan, akses masuk/kanal, paparan Gateway dan postur perintah node,
akses ruang kerja agen, postur sandbox, postur penanganan data, postur penyedia
rahasia/profil autentikasi, serta metadata alat yang diatur (`TOOLS.md`). Gunakan
ini saat ruang kerja memerlukan pernyataan yang bertahan lama dan dapat diperiksa,
seperti "Telegram tidak boleh diaktifkan" atau "alat yang diatur harus menyatakan
metadata risiko dan pemilik." Jika Anda hanya memerlukan perilaku lokal tanpa
pengesahan atau deteksi penyimpangan, konfigurasi biasa sudah cukup.

## Mulai cepat

```bash
openclaw plugins enable policy
```

Plugin tetap aktif meskipun `policy.jsonc` tidak ada, sehingga doctor dapat
melaporkan artefak yang hilang alih-alih melewatkan pemeriksaan secara diam-diam.

Tulis `policy.jsonc` secara manual; berkas ini tidak dihasilkan dari pengaturan
saat ini. Setiap bagian tingkat teratas adalah ruang nama aturan: pemeriksaan
hanya berjalan jika terdapat aturan konkret di bawahnya (bagian atau kunci yang
tidak didukung gagal sebagai `policy/policy-jsonc-invalid`, bukan diabaikan
secara diam-diam). Contoh minimal yang mencakup setiap bagian yang didukung:

```jsonc
{
  "channels": {
    "denyRules": [
      {
        "id": "no-telegram",
        "when": { "provider": "telegram" },
        "reason": "Telegram is not approved for this workspace.",
      },
    ],
  },
  "mcp": {
    "servers": {
      "allow": ["docs"],
      "deny": ["untrusted"],
    },
  },
  "models": {
    "providers": {
      "allow": ["openai", "anthropic"],
      "deny": ["openrouter"],
    },
  },
  "network": {
    "privateNetwork": {
      "allow": false,
    },
  },
  "ingress": {
    "session": {
      "requireDmScope": "per-channel-peer",
    },
    "channels": {
      "allowDmPolicies": ["pairing", "allowlist", "disabled"],
      "denyOpenGroups": true,
      "requireMentionInGroups": true,
    },
  },
  "gateway": {
    "exposure": {
      "allowNonLoopbackBind": false,
      "allowTailscaleFunnel": false,
    },
    "auth": {
      "requireAuth": true,
      "requireExplicitRateLimit": true,
    },
    "controlUi": {
      "allowInsecure": false,
    },
    "remote": {
      "allow": false,
    },
    "http": {
      "denyEndpoints": ["chatCompletions", "responses"],
      "requireUrlAllowlists": true,
    },
    "nodes": {
      "denyCommands": ["system.run"],
    },
  },
  "agents": {
    "workspace": {
      "allowedAccess": ["none", "ro"],
      "denyTools": ["exec", "process", "write", "edit", "apply_patch"],
    },
  },
  "dataHandling": {
    "sensitiveLogging": {
      "requireRedaction": true,
    },
    "telemetry": {
      "denyContentCapture": true,
    },
    "retention": {
      "requireSessionMaintenance": true,
    },
    "memory": {
      "denySessionTranscriptIndexing": true,
    },
  },
  "secrets": {
    "requireManagedProviders": true,
    "denySources": ["exec"],
    "allowInsecureProviders": false,
  },
  "auth": {
    "profiles": {
      "requireMetadata": ["provider", "mode"],
      "allowModes": ["api_key", "token"],
    },
  },
  "execApprovals": {
    "requireFile": true,
    "defaults": { "allowSecurity": ["deny"] },
    "agents": {
      "allowSecurity": ["deny", "allowlist"],
      "allowAutoAllowSkills": false,
      "allowlist": { "expected": ["deploy", "status"] },
    },
  },
  "tools": {
    "requireMetadata": ["risk", "sensitivity", "owner"],
    "profiles": {
      "allow": ["messaging", "minimal"],
    },
    "fs": {
      "requireWorkspaceOnly": true,
    },
    "exec": {
      "allowSecurity": ["deny", "allowlist"],
      "requireAsk": ["always"],
      "allowHosts": ["sandbox"],
    },
    "elevated": {
      "allow": false,
    },
    "denyTools": ["group:runtime", "group:fs"],
  },
}
```

Catatan lintas bagian yang tidak terlihat jelas dari tabel aturan di bawah:

- Menghilangkan `gateway.bind` saat melarang pengikatan selain loopback berarti
  Anda menerima nilai baku waktu proses; tetapkan `gateway.bind: "loopback"`
  untuk kesesuaian yang ketat.
- Untuk agen hanya-baca, tetapkan `mode` sandbox ke `all` atau `non-main` pada
  nilai baku/agen yang berlaku dan `workspaceAccess` ke `none` atau `ro`. Mode
  sandbox yang hilang atau bernilai `off` tidak memenuhi policy hanya-baca.
- `agents.workspace.denyTools` menerima `exec`, `process`, `write`, `edit`,
  `apply_patch`. Grup penolakan alat konfigurasi `group:fs` (mutasi berkas) dan
  `group:runtime` (shell/proses) memenuhi postur yang setara.
- Pemeriksaan persetujuan eksekusi membaca artefak `exec-approvals.json` aktif
  hanya jika aturan `execApprovals` tersedia; artefak yang hilang atau tidak
  valid merupakan bukti yang tidak dapat diamati, bukan kelulusan sintetis.
- Bukti rahasia dan profil autentikasi hanya mencatat postur penyedia/sumber dan
  metadata SecretRef, tidak pernah nilai mentah. Policy tidak membaca atau
  mengesahkan penyimpanan kredensial per agen seperti `auth-profiles.json`.
- Bukti penanganan data hanya merupakan postur tingkat konfigurasi (mode
  redaksi, pengalih pengambilan telemetri, mode pemeliharaan sesi, pengaturan
  pengindeksan transkrip). Ini tidak memeriksa log, ekspor telemetri, transkrip,
  atau berkas memori, dan hasil yang bersih tidak membuktikan bahwa tidak ada
  data pribadi atau rahasia di dalamnya.

### Referensi aturan policy

Setiap aturan di bawah bersifat opsional; pemeriksaan hanya berjalan jika aturan
tersebut tersedia. Keadaan yang diamati adalah konfigurasi OpenClaw atau metadata
ruang kerja yang sudah ada.

#### Lapisan cakupan

Gunakan `scopes.<scopeName>` ketika agen atau kanal tertentu memerlukan policy
yang lebih ketat daripada garis dasar tingkat teratas. Nama cakupan hanyalah
label; pencocokan menggunakan pemilih di dalam cakupan. Lapisan bersifat aditif:
aturan global tetap berjalan, dan aturan bercakupan dapat menambahkan temuannya
sendiri terhadap bukti yang sama.

| Pemilih      | Bagian yang didukung                                                             | Gunakan ketika                                         |
| ------------ | -------------------------------------------------------------------------------- | ------------------------------------------------------ |
| `agentIds`   | `tools`, `agents.workspace`, `sandbox`, `dataHandling.memory`, `execApprovals`   | Satu atau beberapa agen waktu proses memerlukan aturan yang lebih ketat. |
| `channelIds` | `ingress.channels`                                                               | Satu atau beberapa kanal memerlukan aturan akses masuk yang lebih ketat. |

Jika entri `agentIds` tidak tersedia di `agents.list[]`, OpenClaw mengevaluasi
aturan bercakupan terhadap postur global/nilai baku yang diwarisi untuk ID agen
waktu proses tersebut, alih-alih melewatinya.

```jsonc
{
  "tools": {
    "exec": {
      "allowHosts": ["sandbox", "node"],
    },
  },
  "sandbox": {
    "requireMode": ["all", "non-main"],
  },
  "scopes": {
    "release-workspace": {
      "agentIds": ["release-agent", "review-agent"],
      "agents": {
        "workspace": {
          "allowedAccess": ["none", "ro"],
        },
      },
    },
    "release-lockdown": {
      "agentIds": ["release-agent"],
      "tools": {
        "exec": {
          "allowHosts": ["sandbox"],
          "allowSecurity": ["deny", "allowlist"],
          "requireAsk": ["always"],
        },
        "denyTools": ["exec", "process", "write", "edit", "apply_patch"],
      },
      "sandbox": {
        "requireMode": ["all"],
        "allowBackends": ["docker"],
      },
      "dataHandling": {
        "memory": {
          "denySessionTranscriptIndexing": true,
        },
      },
    },
    "shell-sandbox": {
      "agentIds": ["shell-agent"],
      "sandbox": {
        "allowBackends": ["openshell"],
        "containers": {
          "requireReadOnlyMounts": false,
        },
      },
    },
    "telegram-ingress": {
      "channelIds": ["telegram"],
      "ingress": {
        "channels": {
          "allowDmPolicies": ["pairing"],
          "denyOpenGroups": true,
          "requireMentionInGroups": true,
        },
      },
    },
  },
}
```

Agen yang sama dapat muncul dalam beberapa cakupan jika setiap cakupan mengatur
bidang yang berbeda, seperti di atas. Bidang bercakupan yang berulang untuk agen
yang sama harus sama ketat atau lebih ketat; klaim duplikat yang lebih lemah
ditolak (daftar izin adalah himpunan bagian, daftar larangan adalah himpunan
bagian super, dan boolean wajib bersifat tetap).

Aturan postur kontainer (`sandbox.containers.*`) hanya diperiksa terhadap bukti
yang dapat diekspos oleh backend sandbox agen yang cocok. Jika backend tidak
dapat mengamati aturan yang Anda aktifkan untuknya, policy melaporkan
`policy/sandbox-container-posture-unobservable` alih-alih meluluskannya;
batasi cakupan aturan kontainer ke grup agen yang menggunakan backend yang dapat
mengeksposnya.

`ingress.session.requireDmScope` tingkat teratas tetap bersifat global;
`session.dmScope` bukan bukti yang dapat diatribusikan ke kanal, sehingga tidak
dapat dibatasi cakupannya oleh `channelIds`.

Setiap cakupan yang tersedia dalam `policy.jsonc` harus valid dan dapat
diberlakukan.

#### Kanal

| Bidang policy                         | Keadaan yang diamati                       | Gunakan ketika                                                   |
| ------------------------------------- | ------------------------------------------ | ---------------------------------------------------------------- |
| `channels.denyRules[].when.provider`  | Penyedia dan status aktif `channels.*`     | Melarang kanal yang dikonfigurasi dari penyedia seperti `telegram`. |
| `channels.denyRules[].reason`         | Pesan temuan dan konteks petunjuk perbaikan | Menjelaskan alasan penyedia tersebut dilarang.                    |

#### Server MCP

| Bidang policy       | Keadaan yang diamati | Gunakan ketika                                                    |
| ------------------- | --------------------- | ----------------------------------------------------------------- |
| `mcp.servers.allow` | ID `mcp.servers.*`    | Mewajibkan setiap server MCP yang dikonfigurasi berada dalam daftar izin. |
| `mcp.servers.deny`  | ID `mcp.servers.*`    | Melarang ID server MCP tertentu yang dikonfigurasi.               |

#### Penyedia model

| Bidang policy             | Keadaan yang diamati                                  | Gunakan ketika                                                                         |
| ------------------------- | ----------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `models.providers.allow`  | ID `models.providers.*` dan referensi model terpilih  | Mewajibkan penyedia yang dikonfigurasi dan referensi model terpilih menggunakan penyedia yang disetujui. |
| `models.providers.deny`   | ID `models.providers.*` dan referensi model terpilih  | Melarang penyedia yang dikonfigurasi dan referensi model terpilih berdasarkan ID penyedia. |

#### Jaringan

| Bidang policy                   | Keadaan yang diamati                  | Gunakan ketika                                                         |
| ------------------------------- | ------------------------------------- | ---------------------------------------------------------------------- |
| `network.privateNetwork.allow`  | Jalur lolos SSRF jaringan privat      | Tetapkan ke `false` untuk mewajibkan akses jaringan privat tetap dinonaktifkan. |

#### Akses masuk dan kanal

| Bidang kebijakan                           | Status yang diamati                                             | Gunakan ketika                                                                  |
| ------------------------------------------ | --------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `ingress.session.requireDmScope`           | `session.dmScope`                                               | Memerlukan cakupan isolasi pesan langsung yang telah ditinjau.                  |
| `ingress.channels.allowDmPolicies`         | `channels.*.dmPolicy` dan bidang kebijakan DM kanal lama         | Hanya mengizinkan kebijakan kanal pesan langsung yang telah ditinjau.           |
| `ingress.channels.denyOpenGroups`          | Kebijakan ingress kanal, akun, dan grup                          | Menolak ingress grup terbuka untuk kanal dan akun yang dikonfigurasi.           |
| `ingress.channels.requireMentionInGroups`  | Konfigurasi gerbang penyebutan kanal, akun, grup, guild, dan bertingkat | Memerlukan gerbang penyebutan ketika ingress grup terbuka atau dibatasi penyebutan. |

#### Gateway

| Bidang kebijakan                         | Status yang diamati                             | Gunakan ketika                                                                                  |
| ---------------------------------------- | ----------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `gateway.exposure.allowNonLoopbackBind`  | `gateway.bind`                                  | Atur ke `false` untuk mewajibkan pengikatan Gateway ke loopback.                                |
| `gateway.exposure.allowTailscaleFunnel`  | Postur serve/funnel Gateway Tailscale           | Atur ke `false` untuk menolak eksposur Tailscale Funnel.                                        |
| `gateway.auth.requireAuth`               | `gateway.auth.mode`                             | Atur ke `true` untuk menolak autentikasi Gateway yang dinonaktifkan.                            |
| `gateway.auth.requireExplicitRateLimit`  | `gateway.auth.rateLimit`                        | Atur ke `true` untuk mewajibkan konfigurasi batas laju autentikasi yang eksplisit.              |
| `gateway.controlUi.allowInsecure`        | Opsi autentikasi/perangkat/origin tidak aman pada UI Kontrol | Atur ke `false` untuk menolak opsi eksposur UI Kontrol yang tidak aman.                         |
| `gateway.remote.allow`                   | Mode/konfigurasi Gateway jarak jauh             | Atur ke `false` untuk menolak mode Gateway jarak jauh.                                          |
| `gateway.http.denyEndpoints`             | Titik akhir API HTTP Gateway                    | Tolak ID titik akhir seperti `chatCompletions` atau `responses`.                                |
| `gateway.http.requireUrlAllowlists`      | Input pengambilan URL HTTP Gateway              | Atur ke `true` untuk mewajibkan daftar izin URL pada input pengambilan URL.                     |
| `gateway.nodes.denyCommands`             | `gateway.nodes.denyCommands`                    | Memerlukan ID perintah node yang tepat, seperti `system.run`, agar ditolak dalam konfigurasi OpenClaw. |

`gateway.nodes.denyCommands` adalah aturan superset penolakan yang tepat dan peka huruf besar-kecil.
Gunakan ketika kebijakan harus membuktikan bahwa perintah node berhak istimewa secara eksplisit
ditolak oleh konfigurasi OpenClaw. Deployment yang sengaja mengizinkan perintah node berhak istimewa
harus memperbarui `policy.jsonc` setelah peninjauan, alih-alih hanya mengandalkan
`gateway.nodes.allowCommands`.

#### Ruang kerja agen

| Bidang kebijakan                  | Status yang diamati                                                                    | Gunakan ketika                                                                                  |
| --------------------------------- | -------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `agents.workspace.allowedAccess`  | `agents.defaults.sandbox.workspaceAccess` dan `agents.list[].sandbox.workspaceAccess` | Hanya mengizinkan nilai akses ruang kerja sandbox seperti `none` atau `ro`.                    |
| `agents.workspace.denyTools`      | Konfigurasi penolakan alat global dan per agen                                         | Memerlukan alat mutasi (`exec`, `process`, `write`, `edit`, `apply_patch`) agar ditolak.       |

#### Postur sandbox

| Bidang kebijakan                                      | Status yang diamati                                      | Gunakan ketika                                                          |
| ----------------------------------------------------- | ------------------------------------------------------- | ----------------------------------------------------------------------- |
| `sandbox.requireMode`                                 | `agents.defaults.sandbox.mode` dan mode per agen        | Hanya mengizinkan mode sandbox yang telah ditinjau seperti `all` atau `non-main`. |
| `sandbox.allowBackends`                               | `agents.defaults.sandbox.backend` dan backend per agen  | Hanya mengizinkan backend sandbox yang telah ditinjau seperti `docker`. |
| `sandbox.containers.denyHostNetwork`                  | Mode jaringan sandbox/peramban berbasis kontainer      | Menolak mode jaringan hos.                                              |
| `sandbox.containers.denyContainerNamespaceJoin`       | Mode jaringan sandbox/peramban berbasis kontainer      | Menolak bergabung dengan namespace jaringan kontainer lain.             |
| `sandbox.containers.requireReadOnlyMounts`            | Mode mount sandbox/peramban berbasis kontainer         | Memerlukan mount hanya-baca.                                            |
| `sandbox.containers.denyContainerRuntimeSocketMounts` | Target mount sandbox/peramban berbasis kontainer       | Menolak mount soket runtime kontainer.                                  |
| `sandbox.containers.denyUnconfinedProfiles`           | Postur profil keamanan kontainer                       | Menolak profil keamanan kontainer tanpa pembatasan.                     |
| `sandbox.browser.requireCdpSourceRange`               | Rentang sumber CDP peramban sandbox                    | Memerlukan eksposur CDP peramban untuk mendeklarasikan rentang sumber.  |

Kebijakan memperlakukan `sandbox.mode` yang tidak ada sebagai nilai baku implisitnya, yaitu `off`, sehingga
`sandbox.requireMode` melaporkan sandbox baru atau yang belum dikonfigurasi sebagai berada di luar
daftar izin seperti `["all"]`.

#### Penanganan Data

| Bidang kebijakan                                    | Status yang diamati                                                                   | Gunakan ketika                                                                 |
| --------------------------------------------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------ |
| `dataHandling.sensitiveLogging.requireRedaction`    | `logging.redactSensitive`                                                            | Atur ke `true` untuk menolak `logging.redactSensitive: "off"`.                 |
| `dataHandling.telemetry.denyContentCapture`         | `diagnostics.otel.captureContent`                                                    | Atur ke `true` untuk menolak pengambilan konten telemetri.                     |
| `dataHandling.retention.requireSessionMaintenance`  | `session.maintenance.mode`                                                           | Atur ke `true` untuk mewajibkan mode pemeliharaan sesi efektif `enforce`.      |
| `dataHandling.memory.denySessionTranscriptIndexing` | `memory.qmd.sessions.enabled` dan `agents.*.memorySearch.experimental.sessionMemory` | Atur ke `true` untuk menolak pengindeksan transkrip sesi ke dalam memori.      |

#### Rahasia

| Bidang kebijakan                   | Status yang diamati                                          | Gunakan ketika                                                                |
| ---------------------------------- | ------------------------------------------------------------ | ----------------------------------------------------------------------------- |
| `secrets.requireManagedProviders`  | SecretRef konfigurasi dan deklarasi `secrets.providers.*`    | Atur ke `true` untuk mewajibkan SecretRef menunjuk ke penyedia yang dideklarasikan. |
| `secrets.denySources`              | Sumber penyedia rahasia dan sumber SecretRef                  | Tolak sumber seperti `exec`, `file`, atau nama sumber lain yang dikonfigurasi. |
| `secrets.allowInsecureProviders`   | Penanda postur penyedia rahasia yang tidak aman               | Atur ke `false` untuk menolak penyedia yang memilih postur tidak aman.        |

#### Persetujuan exec

Pemeriksaan persetujuan exec membaca artefak runtime `exec-approvals.json`:
`~/.openclaw/exec-approvals.json` secara baku, atau
`$OPENCLAW_STATE_DIR/exec-approvals.json` ketika `OPENCLAW_STATE_DIR` ditetapkan.
Aturan postur di bawah `execApprovals.defaults.*` atau `execApprovals.agents.*`
memerlukan bukti artefak yang dapat dibaca; artefak yang tidak ada atau tidak valid dilaporkan sebagai
bukti yang tidak dapat diamati, bukan kelulusan berdasarkan upaya terbaik. Setelah dapat dibaca, bidang
yang dihilangkan mewarisi nilai baku runtime: `defaults.security` yang tidak ada bernilai `full`, dan
keamanan agen yang tidak ada mewarisi nilai baku tersebut. Bukti mencakup `defaults`,
`agents.*`, `agents.*.allowlist[].pattern`, `argPattern` opsional, postur efektif
`autoAllowSkills`, dan sumber entri — tidak pernah mencakup jalur/token soket,
`commandText`, `lastUsedCommand`, jalur yang telah diresolusi, atau stempel waktu.

| Bidang kebijakan                              | Status yang diamati                                                                     | Gunakan ketika                                                                                       |
| --------------------------------------------- | --------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `execApprovals.requireFile`                   | Jalur `exec-approvals.json` runtime yang aktif                                          | Atur ke `true` untuk mewajibkan artefak persetujuan ada dan dapat diurai.                            |
| `execApprovals.defaults.allowSecurity`        | `defaults.security`, dengan nilai baku `full`                                           | Hanya mengizinkan mode keamanan persetujuan baku yang disetujui.                                     |
| `execApprovals.agents.allowSecurity`          | `agents.*.security`, yang mewarisi nilai baku                                           | Hanya mengizinkan mode keamanan persetujuan efektif per agen yang disetujui.                          |
| `execApprovals.agents.allowAutoAllowSkills`   | `defaults.autoAllowSkills` dan `agents.*.autoAllowSkills`, yang mewarisi nilai baku runtime | Atur ke `false` untuk mewajibkan daftar izin manual yang ketat tanpa persetujuan CLI skill implisit. |
| `execApprovals.agents.allowlist.expected`     | Gabungan pola `agents.*.allowlist[]` dan entri argPattern opsional                      | Memerlukan daftar izin persetujuan agar cocok dengan kumpulan pola yang telah ditinjau.              |

Contoh: wajibkan artefak persetujuan, tolak nilai baku yang permisif, dan izinkan
hanya postur persetujuan exec yang telah ditinjau untuk agen yang dipilih.

```jsonc
{
  "execApprovals": {
    "requireFile": true,
    "defaults": {
      // Security modes: "deny", "allowlist", or "full".
      // This default permits only the locked-down deny posture.
      "allowSecurity": ["deny"],
    },
  },
  "scopes": {
    "restricted-shell": {
      "agentIds": ["family-agent", "groups-agent"],
      "execApprovals": {
        "agents": {
          // Selected agents may use reviewed allowlist posture, but not "full".
          "allowSecurity": ["allowlist"],
          // false means skill CLIs must appear in the reviewed allowlist instead of
          // being implicitly approved by autoAllowSkills.
          "allowAutoAllowSkills": false,
          "allowlist": {
            "expected": [
              // Simple entry: exact reviewed executable pattern with no argPattern.
              "travel-hub",
              // Constrained entry: pattern plus reviewed argument regex.
              { "pattern": "calendar-cli", "argPattern": "^sync\\b" },
              "/bin/date",
            ],
          },
        },
      },
    },
  },
}
```

#### Profil autentikasi

| Bidang kebijakan               | Status yang diamati                           | Gunakan ketika                                                                                              |
| ------------------------------ | --------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `auth.profiles.requireMetadata` | Metadata penyedia dan mode `auth.profiles.*`  | Mewajibkan kunci metadata seperti `provider` dan `mode` pada profil autentikasi konfigurasi.                 |
| `auth.profiles.allowModes`      | `auth.profiles.*.mode`                        | Hanya mengizinkan mode profil autentikasi yang didukung seperti `api_key`, `aws-sdk`, `oauth`, atau `token`. |

#### Metadata alat

| Bidang kebijakan        | Status yang diamati              | Gunakan ketika                                                                                         |
| ----------------------- | -------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `tools.requireMetadata` | Deklarasi `TOOLS.md` yang diatur | Mewajibkan alat yang diatur untuk mendeklarasikan kunci metadata seperti `risk`, `sensitivity`, atau `owner`. |

#### Postur alat

| Bidang kebijakan                | Status yang diamati                                         | Gunakan ketika                                                                                                          |
| ------------------------------- | ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `tools.profiles.allow`          | `tools.profile` dan `agents.list[].tools.profile`           | Hanya mengizinkan ID profil alat seperti `minimal`, `messaging`, atau `coding`.                                          |
| `tools.fs.requireWorkspaceOnly` | `tools.fs.workspaceOnly` dan penggantian `tools.fs` per agen | Atur ke `true` untuk mewajibkan postur alat sistem berkas yang terbatas hanya pada ruang kerja.                         |
| `tools.exec.allowSecurity`      | `tools.exec.security` dan keamanan eksekusi per agen        | Hanya mengizinkan mode keamanan eksekusi seperti `deny` atau `allowlist`.                                                |
| `tools.exec.requireAsk`         | `tools.exec.ask` dan mode permintaan eksekusi per agen      | Mewajibkan postur persetujuan seperti `always`.                                                                          |
| `tools.exec.allowHosts`         | `tools.exec.host` dan perutean host eksekusi per agen       | Hanya mengizinkan mode perutean host eksekusi seperti `sandbox`.                                                         |
| `tools.elevated.allow`          | `tools.elevated.enabled` dan postur hak tinggi per agen     | Atur ke `false` untuk mewajibkan mode alat dengan hak tinggi tetap dinonaktifkan.                                        |
| `tools.alsoAllow.expected`      | `tools.alsoAllow` dan `tools.alsoAllow` per agen            | Mewajibkan entri `alsoAllow` yang sama persis dan melaporkan pemberian alat tambahan yang hilang atau tidak diharapkan. |
| `tools.denyTools`               | `tools.deny` dan `agents.list[].tools.deny`                 | Mewajibkan daftar penolakan alat yang dikonfigurasi menyertakan ID atau grup alat seperti `group:runtime` dan `group:fs`. |

## Menjalankan pemeriksaan

Jalankan pemeriksaan khusus kebijakan selama penyusunan:

```bash
openclaw policy check
openclaw policy check --json
openclaw policy check --severity-min error
```

`policy check` hanya menjalankan kumpulan pemeriksaan kebijakan serta menghasilkan bukti, temuan,
dan hash pengesahan. Temuan yang sama juga muncul dalam
`openclaw doctor --lint` saat Plugin Policy diaktifkan.

Bandingkan berkas kebijakan operator dengan tolok ukur yang telah disusun:

```bash
openclaw policy compare --baseline official.policy.jsonc
openclaw policy compare --baseline official.policy.jsonc --policy policy.jsonc --json
```

`policy compare` memeriksa sintaks berkas kebijakan terhadap sintaks berkas kebijakan; perintah ini
tidak memeriksa status runtime, bukti, kredensial, atau rahasia. Perintah ini menggunakan
metadata aturan yang sama dengan yang mengatur lapisan cakupan: daftar izin harus tetap sama atau
lebih sempit, daftar penolakan harus tetap sama atau lebih luas, nilai boolean wajib harus
mempertahankan nilainya, string berurutan hanya boleh bergerak menuju ujung yang lebih ketat dari
urutan yang dikonfigurasi, dan daftar eksak harus cocok. Tolok ukur dapat berupa
kebijakan yang disusun organisasi; kebijakan yang diperiksa dapat menambahkan nilai yang lebih ketat atau
aturan tambahan. Aturan tingkat atas yang diperiksa dapat memenuhi aturan tolok ukur bercakupan jika
sama ketat atau lebih ketat. Nama cakupan tidak harus sama antarberkas;
perbandingan dikunci berdasarkan pemilih (`agentIds`/`channelIds`) dan bidang.

Hasil perbandingan bersih (`--json`):

```json
{
  "ok": true,
  "baselinePath": "official.policy.jsonc",
  "policyPath": "policy.jsonc",
  "rulesChecked": 3,
  "findings": []
}
```

Keluaran bersih `policy check --json` menyertakan hash stabil yang dapat dicatat oleh operator atau
pengawas:

```json
{
  "ok": true,
  "attestation": {
    "policy": {
      "path": "policy.jsonc",
      "hash": "sha256:..."
    },
    "workspace": {
      "scope": "policy",
      "hash": "sha256:..."
    },
    "findingsHash": "sha256:...",
    "attestationHash": "sha256:..."
  },
  "checksRun": 5,
  "checksSkipped": 0,
  "findings": []
}
```

## Mengonfigurasi kebijakan

Konfigurasi kebijakan berada di bawah `plugins.entries.policy.config`.

```jsonc
{
  "plugins": {
    "entries": {
      "policy": {
        "enabled": true,
        "config": {
          "enabled": true,
          "path": "policy.jsonc",
          "workspaceRepairs": false,
          "expectedHash": "sha256:...",
          "expectedAttestationHash": "sha256:...",
        },
      },
    },
  },
}
```

| Pengaturan                | Tujuan                                                                    |
| ------------------------- | ------------------------------------------------------------------------- |
| `enabled`                 | Mengaktifkan pemeriksaan kebijakan bahkan sebelum `policy.jsonc` tersedia. |
| `workspaceRepairs`        | Mengizinkan `doctor --fix` mengedit pengaturan ruang kerja yang dikelola kebijakan. |
| `expectedHash`            | Penguncian hash opsional untuk artefak kebijakan yang disetujui.          |
| `expectedAttestationHash` | Penguncian hash opsional untuk pemeriksaan kebijakan bersih terakhir yang diterima. |
| `path`                    | Lokasi artefak kebijakan yang relatif terhadap ruang kerja.               |

Atur `plugins.entries.policy.config.enabled` ke `false` untuk menonaktifkan pemeriksaan
kebijakan bagi suatu ruang kerja tanpa menghapus Plugin.

## Menerima status kebijakan

Contoh keluaran JSON:

```json
{
  "ok": true,
  "attestation": {
    "checkedAt": "2026-05-10T20:00:00.000Z",
    "policy": {
      "path": "policy.jsonc",
      "hash": "sha256:..."
    },
    "workspace": {
      "scope": "policy",
      "hash": "sha256:..."
    },
    "findingsHash": "sha256:...",
    "attestationHash": "sha256:..."
  },
  "evidence": {
    "channels": [
      {
        "id": "telegram",
        "provider": "telegram",
        "source": "oc://openclaw.config/channels/telegram",
        "enabled": false
      }
    ],
    "mcpServers": [
      {
        "id": "docs",
        "transport": "stdio",
        "source": "oc://openclaw.config/mcp/servers/docs",
        "command": "npx"
      }
    ],
    "modelProviders": [
      {
        "id": "openai",
        "source": "oc://openclaw.config/models/providers/openai"
      }
    ],
    "modelRefs": [
      {
        "ref": "openai/gpt-5.6-sol",
        "provider": "openai",
        "model": "gpt-5.6-sol",
        "source": "oc://openclaw.config/agents/defaults/model"
      }
    ],
    "network": [
      {
        "id": "browser-private-network",
        "source": "oc://openclaw.config/browser/ssrfPolicy/dangerouslyAllowPrivateNetwork",
        "value": false
      }
    ],
    "gatewayExposure": [
      {
        "id": "gateway-bind",
        "kind": "bind",
        "source": "oc://openclaw.config/gateway/bind",
        "value": "loopback",
        "nonLoopback": false,
        "explicit": true
      }
    ],
    "agentWorkspace": [
      {
        "id": "agents-defaults-workspace-access",
        "kind": "workspaceAccess",
        "source": "oc://openclaw.config/agents/defaults/sandbox/workspaceAccess",
        "scope": "defaults",
        "value": "ro",
        "sandboxMode": "all",
        "sandboxModeSource": "oc://openclaw.config/agents/defaults/sandbox/mode",
        "sandboxEnabled": true,
        "explicit": true
      },
      {
        "id": "agents-defaults-tool-exec",
        "kind": "toolDeny",
        "source": "oc://openclaw.config/tools/deny",
        "scope": "defaults",
        "tool": "exec",
        "denied": true,
        "explicit": true
      }
    ],
    "secrets": [
      {
        "id": "vault",
        "kind": "provider",
        "source": "oc://openclaw.config/secrets/providers/vault",
        "providerSource": "env"
      },
      {
        "id": "oc://openclaw.config/models/providers/openai/apiKey",
        "kind": "input",
        "source": "oc://openclaw.config/models/providers/openai/apiKey",
        "provenance": "secretRef",
        "refSource": "env",
        "refProvider": "vault"
      }
    ],
    "authProfiles": [
      {
        "id": "github",
        "source": "oc://openclaw.config/auth/profiles/github",
        "validMetadata": true,
        "provider": "github",
        "mode": "token"
      }
    ],
    "tools": [
      {
        "id": "deploy",
        "source": "oc://TOOLS.md/tools/deploy",
        "line": 12,
        "risk": "critical",
        "sensitivity": "restricted",
        "capabilities": ["IRREVERSIBLE_EXTERNAL"]
      }
    ]
  },
  "checksRun": 30,
  "checksSkipped": 0,
  "findings": []
}
```

`attestation.policy.hash` mengidentifikasi artefak aturan yang disusun. `evidence`
mencatat status OpenClaw yang diamati dan digunakan oleh pemeriksaan, sedangkan
`workspace.hash` mengidentifikasi muatan bukti tersebut. `findingsHash` mengidentifikasi
kumpulan temuan yang tepat. `checkedAt` mencatat waktu pemeriksaan dijalankan.
`attestationHash` mengidentifikasi klaim stabil (hash kebijakan, hash bukti,
hash temuan, dan status bersih/kotor) serta secara sengaja mengecualikan `checkedAt`,
sehingga status kebijakan yang sama selalu menghasilkan hash pengesahan yang sama. Bersama-sama,
keempat nilai ini membentuk tupel audit untuk satu pemeriksaan kebijakan.

Jika Gateway atau pengawas menggunakan kebijakan untuk memblokir, menyetujui, atau memberi anotasi pada
tindakan runtime, komponen tersebut harus mencatat hash pengesahan dari pemeriksaan bersih
terakhir. `checkedAt` tetap berada dalam keluaran JSON untuk log audit, tetapi bukan bagian dari
hash stabil.

Siklus hidup penerimaan status kebijakan:

1. Susun atau tinjau `policy.jsonc`.
2. Jalankan `openclaw policy check --json`.
3. Jika bersih, catat `attestation.policy.hash` sebagai `expectedHash`.
4. Catat `attestation.attestationHash` sebagai `expectedAttestationHash`.
5. Jalankan kembali `openclaw doctor --lint` dalam CI atau gerbang rilis.

Jika aturan kebijakan diubah secara sengaja, perbarui kedua hash yang diterima dari
pemeriksaan bersih. Jika hanya pengaturan ruang kerja yang berubah (kebijakan tetap sama),
biasanya hanya `expectedAttestationHash` yang berubah.

Mengaktifkan atau meningkatkan aturan `agents.workspace` menambahkan bukti `agentWorkspace`
ke hash ruang kerja dan hash atestasi; tinjau bukti baru dan
perbarui hash atestasi yang diterima setelah mengaktifkannya. Mengaktifkan atau meningkatkan
aturan postur alat menambahkan bukti `toolPosture` dengan cara yang sama.

`openclaw policy watch` menjalankan ulang pemeriksaan dan melaporkan ketika bukti saat ini
tidak lagi cocok dengan `expectedAttestationHash`:

```bash
openclaw policy watch --json
```

Gunakan `--once` dalam CI atau skrip yang memerlukan satu evaluasi penyimpangan. Tanpa
`--once`, perintah ini melakukan polling setiap dua detik secara default; gunakan `--interval-ms` untuk mengubah
interval.

## Temuan

| ID pemeriksaan                                           | Temuan                                                                                                  |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `policy/policy-jsonc-missing`                            | Kebijakan diaktifkan tetapi `policy.jsonc` tidak ada.                                                   |
| `policy/policy-jsonc-invalid`                            | Kebijakan tidak dapat diurai atau berisi entri aturan yang tidak valid.                                 |
| `policy/policy-hash-mismatch`                            | Kebijakan tidak cocok dengan `expectedHash` yang dikonfigurasi.                                         |
| `policy/attestation-hash-mismatch`                       | Bukti kebijakan saat ini tidak lagi cocok dengan atestasi yang diterima.                                |
| `policy/policy-conformance-invalid`                      | Berkas kebijakan dasar atau yang diperiksa memiliki sintaks perbandingan yang tidak valid.              |
| `policy/policy-conformance-missing`                      | Berkas kebijakan yang diperiksa tidak memiliki aturan yang diwajibkan oleh berkas kebijakan dasar.      |
| `policy/policy-conformance-weaker`                       | Berkas kebijakan yang diperiksa memiliki nilai yang lebih lemah daripada berkas kebijakan dasar.        |
| `policy/channels-denied-provider`                        | Kanal yang diaktifkan cocok dengan aturan penolakan kanal.                                              |
| `policy/mcp-denied-server`                               | Server MCP yang dikonfigurasi ditolak oleh kebijakan.                                                   |
| `policy/mcp-unapproved-server`                           | Server MCP yang dikonfigurasi berada di luar daftar izin.                                               |
| `policy/models-denied-provider`                          | Penyedia model atau referensi model yang dikonfigurasi menggunakan penyedia yang ditolak.               |
| `policy/models-unapproved-provider`                      | Penyedia model atau referensi model yang dikonfigurasi berada di luar daftar izin.                      |
| `policy/network-private-access-enabled`                  | Jalur keluar SSRF jaringan privat diaktifkan ketika kebijakan menolaknya.                               |
| `policy/ingress-dm-policy-unapproved`                    | Kebijakan DM kanal berada di luar daftar izin kebijakan.                                                |
| `policy/ingress-dm-scope-unapproved`                     | `session.dmScope` tidak cocok dengan cakupan isolasi DM yang diwajibkan kebijakan.                       |
| `policy/ingress-open-groups-denied`                      | Kebijakan grup kanal adalah `open` sementara kebijakan menolak ingress grup terbuka.                    |
| `policy/ingress-group-mention-required`                  | Entri kanal atau grup menonaktifkan gerbang penyebutan sementara kebijakan mewajibkannya.               |
| `policy/gateway-non-loopback-bind`                       | Postur pengikatan Gateway mengizinkan eksposur non-loopback ketika kebijakan menolaknya.                 |
| `policy/gateway-auth-disabled`                           | Autentikasi Gateway dinonaktifkan ketika kebijakan mewajibkan autentikasi.                               |
| `policy/gateway-rate-limit-missing`                      | Postur pembatasan laju autentikasi Gateway tidak dinyatakan secara eksplisit ketika diwajibkan kebijakan. |
| `policy/gateway-control-ui-insecure`                     | Opsi eksposur tidak aman UI Kontrol Gateway diaktifkan.                                                 |
| `policy/gateway-tailscale-funnel`                        | Eksposur Funnel Tailscale Gateway diaktifkan ketika kebijakan menolaknya.                               |
| `policy/gateway-remote-enabled`                          | Mode jarak jauh Gateway aktif ketika kebijakan menolaknya.                                              |
| `policy/gateway-http-endpoint-enabled`                   | Titik akhir API HTTP Gateway diaktifkan meskipun ditolak oleh kebijakan.                                |
| `policy/gateway-http-url-fetch-unrestricted`             | Masukan pengambilan URL HTTP Gateway tidak memiliki daftar izin URL yang diwajibkan.                    |
| `policy/gateway-node-command-denied`                     | Perintah Node yang ditolak kebijakan tidak ditolak oleh konfigurasi OpenClaw.                           |
| `policy/agents-workspace-access-denied`                  | Mode sandbox agen atau akses ruang kerja berada di luar daftar izin kebijakan.                          |
| `policy/agents-tool-not-denied`                          | Konfigurasi agen atau default tidak menolak alat yang diwajibkan untuk ditolak oleh kebijakan.          |
| `policy/tools-profile-unapproved`                        | Profil alat global atau per agen yang dikonfigurasi berada di luar daftar izin.                         |
| `policy/tools-fs-workspace-only-required`                | Alat sistem berkas tidak dikonfigurasi dengan postur jalur khusus ruang kerja.                          |
| `policy/tools-exec-security-unapproved`                  | Mode keamanan eksekusi berada di luar daftar izin kebijakan.                                            |
| `policy/tools-exec-ask-unapproved`                       | Mode permintaan eksekusi berada di luar daftar izin kebijakan.                                          |
| `policy/tools-exec-host-unapproved`                      | Perutean host eksekusi berada di luar daftar izin kebijakan.                                            |
| `policy/tools-elevated-enabled`                          | Mode alat dengan hak istimewa diaktifkan ketika kebijakan menolaknya.                                  |
| `policy/tools-also-allow-missing`                        | Daftar `alsoAllow` yang dikonfigurasi tidak memiliki entri yang diwajibkan kebijakan.                   |
| `policy/tools-also-allow-unexpected`                     | Daftar `alsoAllow` yang dikonfigurasi menyertakan entri yang tidak diharapkan oleh kebijakan.           |
| `policy/tools-required-deny-missing`                     | Daftar penolakan alat global atau per agen tidak menyertakan alat yang wajib ditolak.                   |
| `policy/sandbox-mode-unapproved`                         | Mode sandbox berada di luar daftar izin kebijakan.                                                      |
| `policy/sandbox-backend-unapproved`                      | Backend sandbox berada di luar daftar izin kebijakan.                                                   |
| `policy/sandbox-container-posture-unobservable`          | Aturan postur kontainer diaktifkan untuk backend yang tidak dapat mengamatinya.                         |
| `policy/sandbox-container-host-network-denied`           | Sandbox atau peramban berbasis kontainer menggunakan mode jaringan host.                               |
| `policy/sandbox-container-namespace-join-denied`         | Sandbox atau peramban berbasis kontainer bergabung dengan namespace kontainer lain.                    |
| `policy/sandbox-container-mount-mode-required`           | Mount sandbox atau peramban berbasis kontainer tidak bersifat hanya-baca.                              |
| `policy/sandbox-container-runtime-socket-mount`          | Mount sandbox atau peramban berbasis kontainer mengekspos soket runtime kontainer.                     |
| `policy/sandbox-container-unconfined-profile`            | Profil sandbox kontainer tidak dibatasi ketika kebijakan menolaknya.                                   |
| `policy/sandbox-browser-cdp-source-range-missing`        | Rentang sumber CDP peramban sandbox tidak ada ketika kebijakan mewajibkannya.                           |
| `policy/data-handling-redaction-disabled`                | Redaksi pencatatan sensitif dinonaktifkan ketika kebijakan mewajibkannya.                               |
| `policy/data-handling-telemetry-content-capture`         | Pengambilan konten telemetri diaktifkan ketika kebijakan menolaknya.                                    |
| `policy/data-handling-session-retention-not-enforced`    | Pemeliharaan retensi sesi tidak diberlakukan ketika kebijakan mewajibkannya.                            |
| `policy/data-handling-session-transcript-memory-enabled` | Pengindeksan memori transkrip sesi diaktifkan ketika kebijakan menolaknya.                              |
| `policy/secrets-unmanaged-provider`                      | SecretRef konfigurasi merujuk ke penyedia yang tidak dideklarasikan di bawah `secrets.providers`.      |
| `policy/secrets-denied-provider-source`                  | Penyedia rahasia konfigurasi atau SecretRef menggunakan sumber yang ditolak oleh kebijakan.             |
| `policy/secrets-insecure-provider`                       | Penyedia rahasia memilih postur tidak aman ketika kebijakan menolaknya.                                |
| `policy/auth-profile-invalid-metadata`                   | Profil autentikasi konfigurasi tidak memiliki metadata penyedia atau mode yang valid.                   |
| `policy/auth-profile-unapproved-mode`                    | Mode profil autentikasi konfigurasi berada di luar daftar izin kebijakan.                              |
| `policy/exec-approvals-missing`                          | Kebijakan mewajibkan `exec-approvals.json`, tetapi artefak tersebut tidak ada.                          |
| `policy/exec-approvals-invalid`                          | Artefak persetujuan eksekusi yang dikonfigurasi tidak dapat diurai.                                    |
| `policy/exec-approvals-default-security-unapproved`      | Default persetujuan eksekusi menggunakan mode keamanan di luar daftar izin kebijakan.                  |
| `policy/exec-approvals-agent-security-unapproved`        | Mode keamanan persetujuan eksekusi efektif per agen berada di luar daftar izin.                        |
| `policy/exec-approvals-auto-allow-skills-enabled`        | Agen persetujuan eksekusi secara implisit mengizinkan otomatis CLI Skills ketika kebijakan menolaknya. |
| `policy/exec-approvals-allowlist-missing`                | Daftar izin persetujuan tidak memiliki pola yang diwajibkan kebijakan.                                 |
| `policy/exec-approvals-allowlist-unexpected`             | Daftar izin persetujuan menyertakan pola yang tidak diharapkan oleh kebijakan.                          |
| `policy/tools-missing-risk-level`                        | Deklarasi alat yang diatur tidak memiliki metadata risiko.                                             |
| `policy/tools-unknown-risk-level`                        | Deklarasi alat yang diatur menggunakan nilai risiko yang tidak dikenal.                                |
| `policy/tools-missing-sensitivity-token`                 | Deklarasi alat yang diatur tidak memiliki metadata sensitivitas.                                       |
| `policy/tools-missing-owner`                             | Deklarasi alat yang diatur tidak memiliki metadata pemilik.                                            |
| `policy/tools-unknown-sensitivity-token`                 | Deklarasi alat yang diatur menggunakan nilai sensitivitas yang tidak dikenal.                          |

Sebuah temuan dapat menyertakan `target` (hal di ruang kerja yang diamati dan
tidak sesuai) serta `requirement` (aturan yang ditulis yang menyebabkannya menjadi temuan).
Saat ini keduanya merupakan string alamat `oc://`, tetapi nama bidang menggambarkan peran
kebijakan, bukan format alamat.

Contoh temuan:

```json
{
  "checkId": "policy/channels-denied-provider",
  "severity": "error",
  "message": "Channel 'telegram' uses denied provider 'telegram'.",
  "source": "policy",
  "path": "openclaw config",
  "ocPath": "oc://openclaw.config/channels/telegram",
  "target": "oc://openclaw.config/channels/telegram",
  "requirement": "oc://policy.jsonc/channels/denyRules/#0",
  "fixHint": "Telegram is not approved for this workspace."
}
```

```json
{
  "checkId": "policy/tools-missing-risk-level",
  "severity": "error",
  "message": "TOOLS.md tool 'deploy' has no explicit risk classification.",
  "source": "policy",
  "path": "TOOLS.md",
  "line": 12,
  "ocPath": "oc://TOOLS.md/tools/deploy",
  "target": "oc://TOOLS.md/tools/deploy",
  "requirement": "oc://policy.jsonc/tools/requireMetadata"
}
```

```json
{
  "checkId": "policy/mcp-unapproved-server",
  "severity": "error",
  "message": "Server MCP 'remote' tidak tercantum dalam daftar izin kebijakan.",
  "source": "policy",
  "path": "openclaw config",
  "ocPath": "oc://openclaw.config/mcp/servers/remote",
  "target": "oc://openclaw.config/mcp/servers/remote",
  "requirement": "oc://policy.jsonc/mcp/servers/allow"
}
```

```json
{
  "checkId": "policy/models-unapproved-provider",
  "severity": "error",
  "message": "Referensi model 'anthropic/claude-sonnet-4.7' menggunakan penyedia 'anthropic' yang tidak disetujui.",
  "source": "policy",
  "path": "openclaw config",
  "ocPath": "oc://openclaw.config/agents/defaults/model/fallbacks/#0",
  "target": "oc://openclaw.config/agents/defaults/model/fallbacks/#0",
  "requirement": "oc://policy.jsonc/models/providers/allow"
}
```

```json
{
  "checkId": "policy/network-private-access-enabled",
  "severity": "error",
  "message": "Pengaturan jaringan 'browser-private-network' mengizinkan akses ke jaringan privat.",
  "source": "policy",
  "path": "openclaw config",
  "ocPath": "oc://openclaw.config/browser/ssrfPolicy/dangerouslyAllowPrivateNetwork",
  "target": "oc://openclaw.config/browser/ssrfPolicy/dangerouslyAllowPrivateNetwork",
  "requirement": "oc://policy.jsonc/network/privateNetwork/allow"
}
```

```json
{
  "checkId": "policy/gateway-non-loopback-bind",
  "severity": "error",
  "message": "Pengaturan pengikatan Gateway 'gateway-bind' mengizinkan paparan non-loopback.",
  "source": "policy",
  "path": "openclaw config",
  "ocPath": "oc://openclaw.config/gateway/bind",
  "target": "oc://openclaw.config/gateway/bind",
  "requirement": "oc://policy.jsonc/gateway/exposure/allowNonLoopbackBind"
}
```

```json
{
  "checkId": "policy/gateway-node-command-denied",
  "severity": "error",
  "message": "Perintah node Gateway 'system.run' ditolak oleh kebijakan, tetapi tidak ditolak oleh konfigurasi OpenClaw.",
  "source": "policy",
  "path": "openclaw config",
  "ocPath": "oc://openclaw.config/gateway/nodes/denyCommands",
  "target": "oc://openclaw.config/gateway/nodes/denyCommands",
  "requirement": "oc://policy.jsonc/gateway/nodes/denyCommands",
  "fixHint": "Tambahkan 'system.run' ke gateway.nodes.denyCommands atau perbarui kebijakan setelah ditinjau."
}
```

```json
{
  "checkId": "policy/agents-workspace-access-denied",
  "severity": "error",
  "message": "Akses ruang kerja sandbox agents.defaults 'rw' tidak diizinkan oleh kebijakan.",
  "source": "policy",
  "path": "openclaw config",
  "ocPath": "oc://openclaw.config/agents/defaults/sandbox/workspaceAccess",
  "target": "oc://openclaw.config/agents/defaults/sandbox/workspaceAccess",
  "requirement": "oc://policy.jsonc/agents/workspace/allowedAccess"
}
```

## Perbaikan

`doctor --lint` dan `policy check` bersifat hanya-baca.

`doctor --fix` hanya mengedit pengaturan ruang kerja yang dikelola kebijakan jika
`workspaceRepairs` diaktifkan secara eksplisit; jika tidak, pemeriksaan melaporkan
hal yang akan diperbaiki dan membiarkan pengaturan tetap tidak berubah.

Dalam versi ini, perbaikan dapat menonaktifkan kanal yang ditolak oleh
`channels.denyRules` dan menerapkan perbaikan pembatasan otomatis yang tercantum
di bawah ini. Aktifkan `workspaceRepairs` hanya setelah berkas kebijakan ditinjau,
karena aturan yang valid dapat mengubah konfigurasi ruang kerja:

- atur `tools.elevated.enabled=false` ketika kebijakan global melarang alat dengan hak akses tinggi
- tambahkan id alat wajib-tolak yang belum ada ke `tools.deny` atau
  `agents.list[].tools.deny` ketika kebijakan mengharuskan alat tersebut ditolak
- atur sakelar `gateway.controlUi.*` yang tidak aman menjadi `false`
- atur `gateway.mode=local` ketika kebijakan menolak mode Gateway jarak jauh
- atur jalur `gateway.http.endpoints.*.enabled` yang dilaporkan menjadi `false`
  ketika kebijakan menolak titik akhir API HTTP Gateway
- atur jalur `groupPolicy` masuk kanal yang dilaporkan menjadi `allowlist` ketika
  kebijakan menolak masuknya grup terbuka
- atur jalur `requireMention` masuk kanal yang dilaporkan menjadi `true` ketika
  kebijakan mewajibkan penyebutan dalam grup
- atur `logging.redactSensitive=tools` ketika kebijakan mewajibkan penyamaran
  pencatatan sensitif
- atur `diagnostics.otel.captureContent=false`, atau
  `diagnostics.otel.captureContent.enabled=false` untuk pengaturan pengambilan
  telemetri berbentuk objek, ketika kebijakan menolak pengambilan konten telemetri

Perbaikan alat dengan hak akses tinggi yang tercakup hanya dideteksi. Perbaikan
penanganan data yang tercakup juga dilewati ketika temuan melaporkan konfigurasi
pencatatan atau telemetri bersama, karena mengubah pengaturan bersama akan
memengaruhi lebih dari target kebijakan yang tercakup.

Perbaikan wajib-tolak yang tercakup dilewati ketika temuan melaporkan
`tools.deny` akar yang diwarisi, karena menambahkan alat wajib tersebut ke
konfigurasi akar akan memengaruhi lebih dari target kebijakan yang tercakup.
Perbaikan wajib-tolak lokal agen dapat memperbarui jalur
`agents.list[].tools.deny` yang dilaporkan.

Perbaikan masuk kanal yang tercakup dilewati ketika temuan melaporkan
`channels.defaults.*` yang diwarisi, karena mengubah nilai default kanal bersama
akan memengaruhi lebih dari target kebijakan yang tercakup. Temuan daftar izin
pengambilan URL HTTP Gateway tetap harus ditangani secara manual karena perbaikan
otomatis tidak dapat memilih nilai daftar izin URL titik akhir yang benar.

Temuan pengikatan dan perintah node Gateway tetap memerlukan peninjauan. Ketika
`policy/gateway-non-loopback-bind` atau `policy/gateway-node-command-denied`
dapat dipetakan ke jalur konfigurasi, `doctor --fix` melaporkan perubahan
`gateway.bind` atau `gateway.nodes.denyCommands` yang diusulkan sebagai panduan
pratinjau yang dilewati. Perintah tersebut tidak menerapkan perubahan, dan temuan
tidak dianggap telah diperbaiki hingga operator meninjau dan memperbarui
konfigurasi atau kebijakan.

```jsonc
{
  "plugins": {
    "entries": {
      "policy": {
        "config": {
          "workspaceRepairs": true,
        },
      },
    },
  },
}
```

## Kode keluar

| Perintah         | `0`                                                        | `1`                                                                      | `2`                               |
| ---------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------ | --------------------------------- |
| `policy check`   | Tidak ada temuan pada ambang batas.                         | Satu atau beberapa temuan memenuhi ambang batas.                         | Kegagalan argumen atau waktu proses. |
| `policy compare` | Berkas kebijakan setidaknya seketat garis dasar.            | Berkas kebijakan tidak valid, tidak ada, atau lebih lemah dari aturan garis dasar. | Kegagalan argumen atau waktu proses. |
| `policy watch`   | Tidak ada temuan dan hash yang diterima masih berlaku.      | Terdapat temuan atau pengesahan yang diterima sudah kedaluwarsa.         | Kegagalan argumen atau waktu proses. |

## Terkait

- [Mode lint Doctor](/id/cli/doctor#lint-mode)
- [CLI jalur](/id/cli/path)
