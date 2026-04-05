---
read_when: “You want per-agent sandboxing or per-agent tool allow/deny policies in a multi-agent gateway.”
status: active
summary: “Sandbox + pembatasan tool per agen, prioritas, dan contoh”
title: Sandbox & Tools Multi-Agent
x-i18n:
    generated_at: "2026-04-05T14:09:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 07985f7c8fae860a7b9bf685904903a4a8f90249e95e4179cf0775a1208c0597
    source_path: tools/multi-agent-sandbox-tools.md
    workflow: 15
---

# Konfigurasi Sandbox & Tools Multi-Agent

Setiap agen dalam pengaturan multi-agent dapat menimpa kebijakan sandbox dan
tool global. Halaman ini membahas konfigurasi per agen, aturan prioritas, dan
contoh.

- **Backend dan mode sandbox**: lihat [Sandboxing](/id/gateway/sandboxing).
- **Men-debug tool yang diblokir**: lihat [Sandbox vs Tool Policy vs Elevated](/id/gateway/sandbox-vs-tool-policy-vs-elevated) dan `openclaw sandbox explain`.
- **Exec elevated**: lihat [Elevated Mode](/tools/elevated).

Auth bersifat per agen: setiap agen membaca dari penyimpanan auth `agentDir` miliknya sendiri di
`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`.
Kredensial **tidak** dibagikan antar agen. Jangan pernah menggunakan ulang `agentDir` antar agen.
Jika Anda ingin berbagi kredensial, salin `auth-profiles.json` ke `agentDir` agen lainnya.

---

## Contoh Konfigurasi

### Contoh 1: Agen Pribadi + Agen Keluarga yang Dibatasi

```json
{
  "agents": {
    "list": [
      {
        "id": "main",
        "default": true,
        "name": "Asisten Pribadi",
        "workspace": "~/.openclaw/workspace",
        "sandbox": { "mode": "off" }
      },
      {
        "id": "family",
        "name": "Bot Keluarga",
        "workspace": "~/.openclaw/workspace-family",
        "sandbox": {
          "mode": "all",
          "scope": "agent"
        },
        "tools": {
          "allow": ["read"],
          "deny": ["exec", "write", "edit", "apply_patch", "process", "browser"]
        }
      }
    ]
  },
  "bindings": [
    {
      "agentId": "family",
      "match": {
        "provider": "whatsapp",
        "accountId": "*",
        "peer": {
          "kind": "group",
          "id": "120363424282127706@g.us"
        }
      }
    }
  ]
}
```

**Hasil:**

- agen `main`: Berjalan di host, akses tool penuh
- agen `family`: Berjalan di Docker (satu container per agen), hanya tool `read`

---

### Contoh 2: Agen Kerja dengan Sandbox Bersama

```json
{
  "agents": {
    "list": [
      {
        "id": "personal",
        "workspace": "~/.openclaw/workspace-personal",
        "sandbox": { "mode": "off" }
      },
      {
        "id": "work",
        "workspace": "~/.openclaw/workspace-work",
        "sandbox": {
          "mode": "all",
          "scope": "shared",
          "workspaceRoot": "/tmp/work-sandboxes"
        },
        "tools": {
          "allow": ["read", "write", "apply_patch", "exec"],
          "deny": ["browser", "gateway", "discord"]
        }
      }
    ]
  }
}
```

---

### Contoh 2b: Profil coding global + agen khusus pesan

```json
{
  "tools": { "profile": "coding" },
  "agents": {
    "list": [
      {
        "id": "support",
        "tools": { "profile": "messaging", "allow": ["slack"] }
      }
    ]
  }
}
```

**Hasil:**

- agen default mendapatkan tool coding
- agen `support` hanya untuk pesan (+ tool Slack)

---

### Contoh 3: Mode Sandbox Berbeda per Agen

```json
{
  "agents": {
    "defaults": {
      "sandbox": {
        "mode": "non-main", // Default global
        "scope": "session"
      }
    },
    "list": [
      {
        "id": "main",
        "workspace": "~/.openclaw/workspace",
        "sandbox": {
          "mode": "off" // Override: main tidak pernah disandbox
        }
      },
      {
        "id": "public",
        "workspace": "~/.openclaw/workspace-public",
        "sandbox": {
          "mode": "all", // Override: public selalu disandbox
          "scope": "agent"
        },
        "tools": {
          "allow": ["read"],
          "deny": ["exec", "write", "edit", "apply_patch"]
        }
      }
    ]
  }
}
```

---

## Prioritas Konfigurasi

Saat config global (`agents.defaults.*`) dan config khusus agen (`agents.list[].*`) sama-sama ada:

### Config Sandbox

Pengaturan khusus agen menimpa pengaturan global:

```
agents.list[].sandbox.mode > agents.defaults.sandbox.mode
agents.list[].sandbox.scope > agents.defaults.sandbox.scope
agents.list[].sandbox.workspaceRoot > agents.defaults.sandbox.workspaceRoot
agents.list[].sandbox.workspaceAccess > agents.defaults.sandbox.workspaceAccess
agents.list[].sandbox.docker.* > agents.defaults.sandbox.docker.*
agents.list[].sandbox.browser.* > agents.defaults.sandbox.browser.*
agents.list[].sandbox.prune.* > agents.defaults.sandbox.prune.*
```

**Catatan:**

- `agents.list[].sandbox.{docker,browser,prune}.*` menimpa `agents.defaults.sandbox.{docker,browser,prune}.*` untuk agen tersebut (diabaikan saat cakupan sandbox teresolusi menjadi `"shared"`).

### Pembatasan Tool

Urutan pemfilterannya adalah:

1. **Profil tool** (`tools.profile` atau `agents.list[].tools.profile`)
2. **Profil tool provider** (`tools.byProvider[provider].profile` atau `agents.list[].tools.byProvider[provider].profile`)
3. **Kebijakan tool global** (`tools.allow` / `tools.deny`)
4. **Kebijakan tool provider** (`tools.byProvider[provider].allow/deny`)
5. **Kebijakan tool khusus agen** (`agents.list[].tools.allow/deny`)
6. **Kebijakan provider agen** (`agents.list[].tools.byProvider[provider].allow/deny`)
7. **Kebijakan tool sandbox** (`tools.sandbox.tools` atau `agents.list[].tools.sandbox.tools`)
8. **Kebijakan tool subagen** (`tools.subagents.tools`, jika berlaku)

Setiap level dapat makin membatasi tool, tetapi tidak dapat mengembalikan tool yang sudah ditolak oleh level sebelumnya.
Jika `agents.list[].tools.sandbox.tools` disetel, nilainya menggantikan `tools.sandbox.tools` untuk agen tersebut.
Jika `agents.list[].tools.profile` disetel, nilainya menimpa `tools.profile` untuk agen tersebut.
Kunci tool provider menerima `provider` (misalnya `google-antigravity`) atau `provider/model` (misalnya `openai/gpt-5.4`).

Kebijakan tool mendukung shorthand `group:*` yang berkembang menjadi beberapa tool. Lihat [Kelompok tool](/id/gateway/sandbox-vs-tool-policy-vs-elevated#tool-groups-shorthands) untuk daftar lengkapnya.

Override elevated per agen (`agents.list[].tools.elevated`) dapat makin membatasi exec elevated untuk agen tertentu. Lihat [Elevated Mode](/tools/elevated) untuk detailnya.

---

## Migrasi dari Single Agent

**Sebelum (single agent):**

```json
{
  "agents": {
    "defaults": {
      "workspace": "~/.openclaw/workspace",
      "sandbox": {
        "mode": "non-main"
      }
    }
  },
  "tools": {
    "sandbox": {
      "tools": {
        "allow": ["read", "write", "apply_patch", "exec"],
        "deny": []
      }
    }
  }
}
```

**Sesudah (multi-agent dengan profil berbeda):**

```json
{
  "agents": {
    "list": [
      {
        "id": "main",
        "default": true,
        "workspace": "~/.openclaw/workspace",
        "sandbox": { "mode": "off" }
      }
    ]
  }
}
```

Config lama `agent.*` dimigrasikan oleh `openclaw doctor`; ke depannya, utamakan `agents.defaults` + `agents.list`.

---

## Contoh Pembatasan Tool

### Agen Hanya-Baca

```json
{
  "tools": {
    "allow": ["read"],
    "deny": ["exec", "write", "edit", "apply_patch", "process"]
  }
}
```

### Agen Eksekusi Aman (tanpa modifikasi file)

```json
{
  "tools": {
    "allow": ["read", "exec", "process"],
    "deny": ["write", "edit", "apply_patch", "browser", "gateway"]
  }
}
```

### Agen Khusus Komunikasi

```json
{
  "tools": {
    "sessions": { "visibility": "tree" },
    "allow": ["sessions_list", "sessions_send", "sessions_history", "session_status"],
    "deny": ["exec", "write", "edit", "apply_patch", "read", "browser"]
  }
}
```

`sessions_history` dalam profil ini tetap mengembalikan tampilan recall
yang dibatasi dan disanitasi, bukan dump transkrip mentah. Recall asisten menghapus tag thinking,
scaffolding `<relevant-memories>`, payload XML tool-call teks biasa
(termasuk `<tool_call>...</tool_call>`,
`<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
`<function_calls>...</function_calls>`, dan blok tool-call yang terpotong),
scaffolding tool-call yang diturunkan, token kontrol model ASCII/full-width
yang bocor, dan XML tool-call MiniMax yang cacat sebelum redaksi/trunkasi.

---

## Jebakan Umum: "non-main"

`agents.defaults.sandbox.mode: "non-main"` didasarkan pada `session.mainKey` (default `"main"`),
bukan id agen. Sesi grup/channel selalu mendapatkan key-nya sendiri, jadi
mereka diperlakukan sebagai non-main dan akan disandbox. Jika Anda ingin suatu agen tidak pernah
disandbox, setel `agents.list[].sandbox.mode: "off"`.

---

## Pengujian

Setelah mengonfigurasi sandbox dan tool multi-agent:

1. **Periksa resolusi agen:**

   ```exec
   openclaw agents list --bindings
   ```

2. **Verifikasi container sandbox:**

   ```exec
   docker ps --filter "name=openclaw-sbx-"
   ```

3. **Uji pembatasan tool:**
   - Kirim pesan yang memerlukan tool yang dibatasi
   - Verifikasi bahwa agen tidak dapat menggunakan tool yang ditolak

4. **Pantau log:**

   ```exec
   tail -f "${OPENCLAW_STATE_DIR:-$HOME/.openclaw}/logs/gateway.log" | grep -E "routing|sandbox|tools"
   ```

---

## Pemecahan Masalah

### Agen tidak disandbox meskipun `mode: "all"`

- Periksa apakah ada `agents.defaults.sandbox.mode` global yang menimpanya
- Config khusus agen memiliki prioritas lebih tinggi, jadi setel `agents.list[].sandbox.mode: "all"`

### Tool masih tersedia meskipun ada deny list

- Periksa urutan pemfilteran tool: global → agen → sandbox → subagen
- Setiap level hanya dapat makin membatasi, bukan mengembalikan akses
- Verifikasi dengan log: `[tools] filtering tools for agent:${agentId}`

### Container tidak terisolasi per agen

- Setel `scope: "agent"` dalam config sandbox khusus agen
- Default-nya adalah `"session"` yang membuat satu container per sesi

---

## Lihat juga

- [Sandboxing](/id/gateway/sandboxing) -- referensi sandbox lengkap (mode, cakupan, backend, image)
- [Sandbox vs Tool Policy vs Elevated](/id/gateway/sandbox-vs-tool-policy-vs-elevated) -- debugging "mengapa ini diblokir?"
- [Elevated Mode](/tools/elevated)
- [Routing Multi-Agent](/id/concepts/multi-agent)
- [Konfigurasi Sandbox](/id/gateway/configuration-reference#agentsdefaultssandbox)
- [Manajemen Sesi](/id/concepts/session)
