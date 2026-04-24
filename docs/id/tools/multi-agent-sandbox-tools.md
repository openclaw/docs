---
read_when: “You want per-agent sandboxing or per-agent tool allow/deny policies in a multi-agent gateway.”
status: active
summary: “Sandbox per agen + pembatasan alat, prioritas, dan contoh”
title: Sandbox & alat multi-agen
x-i18n:
    generated_at: "2026-04-24T09:31:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7239e28825759efb060b821f87f5ebd9a7f3b720b30ff16dc076b186e47fcde9
    source_path: tools/multi-agent-sandbox-tools.md
    workflow: 15
---

# Konfigurasi Sandbox & Alat Multi-Agen

Setiap agen dalam penyiapan multi-agen dapat meng-override kebijakan sandbox dan alat
global. Halaman ini membahas konfigurasi per agen, aturan prioritas, dan
contoh.

- **Backend dan mode sandbox**: lihat [Sandboxing](/id/gateway/sandboxing).
- **Debugging alat yang diblokir**: lihat [Sandbox vs Tool Policy vs Elevated](/id/gateway/sandbox-vs-tool-policy-vs-elevated) dan `openclaw sandbox explain`.
- **Exec elevated**: lihat [Elevated Mode](/id/tools/elevated).

Autentikasi bersifat per agen: setiap agen membaca dari penyimpanan autentikasi `agentDir` miliknya
sendiri di `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`.
Kredensial **tidak** dibagikan antar agen. Jangan pernah menggunakan ulang `agentDir` di beberapa agen.
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

- agen `main`: Berjalan di host, akses alat penuh
- agen `family`: Berjalan di Docker (satu kontainer per agen), hanya alat `read`

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

### Contoh 2b: Profil coding global + agen khusus messaging

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

- agen default mendapatkan alat coding
- agen `support` hanya untuk messaging (+ alat Slack)

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
          "mode": "off" // Override: main tidak pernah di-sandbox
        }
      },
      {
        "id": "public",
        "workspace": "~/.openclaw/workspace-public",
        "sandbox": {
          "mode": "all", // Override: public selalu di-sandbox
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

Saat konfigurasi global (`agents.defaults.*`) dan konfigurasi khusus agen (`agents.list[].*`) sama-sama ada:

### Konfigurasi Sandbox

Pengaturan khusus agen meng-override pengaturan global:

```text
agents.list[].sandbox.mode > agents.defaults.sandbox.mode
agents.list[].sandbox.scope > agents.defaults.sandbox.scope
agents.list[].sandbox.workspaceRoot > agents.defaults.sandbox.workspaceRoot
agents.list[].sandbox.workspaceAccess > agents.defaults.sandbox.workspaceAccess
agents.list[].sandbox.docker.* > agents.defaults.sandbox.docker.*
agents.list[].sandbox.browser.* > agents.defaults.sandbox.browser.*
agents.list[].sandbox.prune.* > agents.defaults.sandbox.prune.*
```

**Catatan:**

- `agents.list[].sandbox.{docker,browser,prune}.*` meng-override `agents.defaults.sandbox.{docker,browser,prune}.*` untuk agen tersebut (diabaikan saat scope sandbox di-resolve menjadi `"shared"`).

### Pembatasan Alat

Urutan pemfilterannya adalah:

1. **Profil alat** (`tools.profile` atau `agents.list[].tools.profile`)
2. **Profil alat provider** (`tools.byProvider[provider].profile` atau `agents.list[].tools.byProvider[provider].profile`)
3. **Kebijakan alat global** (`tools.allow` / `tools.deny`)
4. **Kebijakan alat provider** (`tools.byProvider[provider].allow/deny`)
5. **Kebijakan alat khusus agen** (`agents.list[].tools.allow/deny`)
6. **Kebijakan provider agen** (`agents.list[].tools.byProvider[provider].allow/deny`)
7. **Kebijakan alat sandbox** (`tools.sandbox.tools` atau `agents.list[].tools.sandbox.tools`)
8. **Kebijakan alat subagen** (`tools.subagents.tools`, jika berlaku)

Setiap level dapat semakin membatasi alat, tetapi tidak dapat mengembalikan alat yang sudah ditolak dari level sebelumnya.
Jika `agents.list[].tools.sandbox.tools` ditetapkan, nilainya menggantikan `tools.sandbox.tools` untuk agen tersebut.
Jika `agents.list[].tools.profile` ditetapkan, nilainya meng-override `tools.profile` untuk agen tersebut.
Kunci alat provider menerima `provider` (misalnya `google-antigravity`) atau `provider/model` (misalnya `openai/gpt-5.4`).

Kebijakan alat mendukung singkatan `group:*` yang diperluas menjadi beberapa alat. Lihat [Kelompok alat](/id/gateway/sandbox-vs-tool-policy-vs-elevated#tool-groups-shorthands) untuk daftar lengkapnya.

Override elevated per agen (`agents.list[].tools.elevated`) dapat lebih membatasi exec elevated untuk agen tertentu. Lihat [Elevated Mode](/id/tools/elevated) untuk detailnya.

---

## Migrasi dari Agen Tunggal

**Sebelum (agen tunggal):**

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

**Sesudah (multi-agen dengan profil berbeda):**

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

Konfigurasi legacy `agent.*` dimigrasikan oleh `openclaw doctor`; ke depannya, utamakan `agents.defaults` + `agents.list`.

---

## Contoh Pembatasan Alat

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

`sessions_history` dalam profil ini tetap mengembalikan tampilan recall yang dibatasi dan disanitasi alih-alih dump transkrip mentah. Recall asisten menghapus tag thinking,
scaffolding `<relevant-memories>`, payload XML tool-call teks biasa
(termasuk `<tool_call>...</tool_call>`,
`<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
`<function_calls>...</function_calls>`, dan blok tool-call yang terpotong),
scaffolding tool-call yang diturunkan, token kontrol model ASCII/full-width yang bocor,
dan XML tool-call MiniMax yang malformed sebelum redaksi/pemotongan.

---

## Jebakan Umum: "non-main"

`agents.defaults.sandbox.mode: "non-main"` didasarkan pada `session.mainKey` (default `"main"`),
bukan id agen. Sesi grup/channel selalu mendapatkan key mereka sendiri, sehingga
dianggap non-main dan akan di-sandbox. Jika Anda ingin sebuah agen tidak pernah
di-sandbox, setel `agents.list[].sandbox.mode: "off"`.

---

## Pengujian

Setelah mengonfigurasi sandbox dan alat multi-agen:

1. **Periksa resolusi agen:**

   ```exec
   openclaw agents list --bindings
   ```

2. **Verifikasi kontainer sandbox:**

   ```exec
   docker ps --filter "name=openclaw-sbx-"
   ```

3. **Uji pembatasan alat:**
   - Kirim pesan yang memerlukan alat yang dibatasi
   - Verifikasi agen tidak dapat menggunakan alat yang ditolak

4. **Pantau log:**

   ```exec
   tail -f "${OPENCLAW_STATE_DIR:-$HOME/.openclaw}/logs/gateway.log" | grep -E "routing|sandbox|tools"
   ```

---

## Pemecahan Masalah

### Agen tidak di-sandbox meskipun `mode: "all"`

- Periksa apakah ada `agents.defaults.sandbox.mode` global yang meng-override-nya
- Konfigurasi khusus agen memiliki prioritas, jadi setel `agents.list[].sandbox.mode: "all"`

### Alat masih tersedia meskipun ada daftar deny

- Periksa urutan pemfilteran alat: global → agen → sandbox → subagen
- Setiap level hanya bisa semakin membatasi, bukan mengembalikan akses
- Verifikasi dengan log: `[tools] filtering tools for agent:${agentId}`

### Kontainer tidak terisolasi per agen

- Setel `scope: "agent"` di konfigurasi sandbox khusus agen
- Default-nya adalah `"session"` yang membuat satu kontainer per sesi

---

## Terkait

- [Sandboxing](/id/gateway/sandboxing) -- referensi sandbox lengkap (mode, scope, backend, image)
- [Sandbox vs Tool Policy vs Elevated](/id/gateway/sandbox-vs-tool-policy-vs-elevated) -- debugging "mengapa ini diblokir?"
- [Elevated Mode](/id/tools/elevated)
- [Perutean Multi-Agen](/id/concepts/multi-agent)
- [Konfigurasi Sandbox](/id/gateway/config-agents#agentsdefaultssandbox)
- [Manajemen Sesi](/id/concepts/session)
