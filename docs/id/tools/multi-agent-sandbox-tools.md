---
read_when: You want per-agent sandboxing or per-agent tool allow/deny policies in a multi-agent gateway.
sidebarTitle: Multi-agent sandbox and tools
status: active
summary: Pembatasan sandbox + tool per agen, prioritas, dan contoh
title: Sandbox dan tool multi-agen
x-i18n:
    generated_at: "2026-04-26T11:40:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8b8d24252b03dbcd00a5eefcc8e58bd51577a99ae057008f19a0acc4016413ea
    source_path: tools/multi-agent-sandbox-tools.md
    workflow: 15
---

Setiap agen dalam penyiapan multi-agen dapat mengoverride kebijakan sandbox dan tool global. Halaman ini membahas konfigurasi per agen, aturan prioritas, dan contoh.

<CardGroup cols={3}>
  <Card title="Sandboxing" href="/id/gateway/sandboxing">
    Backend dan mode — referensi sandbox lengkap.
  </Card>
  <Card title="Sandbox vs kebijakan tool vs elevated" href="/id/gateway/sandbox-vs-tool-policy-vs-elevated">
    Debug "mengapa ini diblokir?"
  </Card>
  <Card title="Mode elevated" href="/id/tools/elevated">
    Elevated exec untuk pengirim tepercaya.
  </Card>
</CardGroup>

<Warning>
Autentikasi bersifat per agen: setiap agen membaca dari penyimpanan autentikasi `agentDir` miliknya sendiri di `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`. Kredensial **tidak** dibagikan antar agen. Jangan pernah menggunakan ulang `agentDir` di beberapa agen. Jika Anda ingin berbagi kredensial, salin `auth-profiles.json` ke `agentDir` agen lain.
</Warning>

---

## Contoh konfigurasi

<AccordionGroup>
  <Accordion title="Contoh 1: Agen pribadi + agen keluarga yang dibatasi">
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

    - agen `main`: berjalan di host, akses tool penuh.
    - agen `family`: berjalan di Docker (satu container per agen), hanya tool `read`.

  </Accordion>
  <Accordion title="Contoh 2: Agen kerja dengan sandbox bersama">
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
  </Accordion>
  <Accordion title="Contoh 2b: Profil coding global + agen hanya pesan">
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

    - agen default mendapatkan tool coding.
    - agen `support` hanya untuk pesan (+ tool Slack).

  </Accordion>
  <Accordion title="Contoh 3: Mode sandbox berbeda per agen">
    ```json
    {
      "agents": {
        "defaults": {
          "sandbox": {
            "mode": "non-main",
            "scope": "session"
          }
        },
        "list": [
          {
            "id": "main",
            "workspace": "~/.openclaw/workspace",
            "sandbox": {
              "mode": "off"
            }
          },
          {
            "id": "public",
            "workspace": "~/.openclaw/workspace-public",
            "sandbox": {
              "mode": "all",
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
  </Accordion>
</AccordionGroup>

---

## Prioritas konfigurasi

Saat konfigurasi global (`agents.defaults.*`) dan konfigurasi khusus agen (`agents.list[].*`) sama-sama ada:

### Konfigurasi sandbox

Pengaturan khusus agen mengoverride pengaturan global:

```
agents.list[].sandbox.mode > agents.defaults.sandbox.mode
agents.list[].sandbox.scope > agents.defaults.sandbox.scope
agents.list[].sandbox.workspaceRoot > agents.defaults.sandbox.workspaceRoot
agents.list[].sandbox.workspaceAccess > agents.defaults.sandbox.workspaceAccess
agents.list[].sandbox.docker.* > agents.defaults.sandbox.docker.*
agents.list[].sandbox.browser.* > agents.defaults.sandbox.browser.*
agents.list[].sandbox.prune.* > agents.defaults.sandbox.prune.*
```

<Note>
`agents.list[].sandbox.{docker,browser,prune}.*` mengoverride `agents.defaults.sandbox.{docker,browser,prune}.*` untuk agen tersebut (diabaikan saat cakupan sandbox diresolusikan ke `"shared"`).
</Note>

### Pembatasan tool

Urutan pemfilteran adalah:

<Steps>
  <Step title="Profil tool">
    `tools.profile` atau `agents.list[].tools.profile`.
  </Step>
  <Step title="Profil tool provider">
    `tools.byProvider[provider].profile` atau `agents.list[].tools.byProvider[provider].profile`.
  </Step>
  <Step title="Kebijakan tool global">
    `tools.allow` / `tools.deny`.
  </Step>
  <Step title="Kebijakan tool provider">
    `tools.byProvider[provider].allow/deny`.
  </Step>
  <Step title="Kebijakan tool khusus agen">
    `agents.list[].tools.allow/deny`.
  </Step>
  <Step title="Kebijakan provider agen">
    `agents.list[].tools.byProvider[provider].allow/deny`.
  </Step>
  <Step title="Kebijakan tool sandbox">
    `tools.sandbox.tools` atau `agents.list[].tools.sandbox.tools`.
  </Step>
  <Step title="Kebijakan tool subagen">
    `tools.subagents.tools`, jika berlaku.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Aturan prioritas">
    - Setiap level dapat lebih membatasi tool, tetapi tidak dapat memberikan kembali tool yang telah ditolak oleh level sebelumnya.
    - Jika `agents.list[].tools.sandbox.tools` disetel, itu menggantikan `tools.sandbox.tools` untuk agen tersebut.
    - Jika `agents.list[].tools.profile` disetel, itu mengoverride `tools.profile` untuk agen tersebut.
    - Key tool provider menerima `provider` (misalnya `google-antigravity`) atau `provider/model` (misalnya `openai/gpt-5.4`).
  </Accordion>
  <Accordion title="Perilaku allowlist kosong">
    Jika allowlist eksplisit mana pun dalam rantai itu membuat proses berjalan tanpa tool yang dapat dipanggil, OpenClaw berhenti sebelum mengirim prompt ke model. Ini disengaja: agen yang dikonfigurasi dengan tool yang tidak ada seperti `agents.list[].tools.allow: ["query_db"]` seharusnya gagal dengan jelas sampai plugin yang mendaftarkan `query_db` diaktifkan, bukan melanjutkan sebagai agen hanya-teks.
  </Accordion>
</AccordionGroup>

Kebijakan tool mendukung singkatan `group:*` yang diperluas menjadi beberapa tool. Lihat [Grup tool](/id/gateway/sandbox-vs-tool-policy-vs-elevated#tool-groups-shorthands) untuk daftar lengkapnya.

Override elevated per agen (`agents.list[].tools.elevated`) dapat lebih membatasi elevated exec untuk agen tertentu. Lihat [Mode elevated](/id/tools/elevated) untuk detail.

---

## Migrasi dari agen tunggal

<Tabs>
  <Tab title="Sebelum (agen tunggal)">
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
  </Tab>
  <Tab title="Sesudah (multi-agen)">
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
  </Tab>
</Tabs>

<Note>
Konfigurasi lama `agent.*` dimigrasikan oleh `openclaw doctor`; ke depannya lebih baik gunakan `agents.defaults` + `agents.list`.
</Note>

---

## Contoh pembatasan tool

<Tabs>
  <Tab title="Agen hanya-baca">
    ```json
    {
      "tools": {
        "allow": ["read"],
        "deny": ["exec", "write", "edit", "apply_patch", "process"]
      }
    }
    ```
  </Tab>
  <Tab title="Eksekusi aman (tanpa modifikasi file)">
    ```json
    {
      "tools": {
        "allow": ["read", "exec", "process"],
        "deny": ["write", "edit", "apply_patch", "browser", "gateway"]
      }
    }
    ```
  </Tab>
  <Tab title="Hanya komunikasi">
    ```json
    {
      "tools": {
        "sessions": { "visibility": "tree" },
        "allow": ["sessions_list", "sessions_send", "sessions_history", "session_status"],
        "deny": ["exec", "write", "edit", "apply_patch", "read", "browser"]
      }
    }
    ```

    `sessions_history` dalam profil ini tetap mengembalikan tampilan recall terbatas yang telah disanitasi alih-alih dump transkrip mentah. Recall asisten menghapus tag thinking, scaffolding `<relevant-memories>`, payload XML pemanggilan tool teks biasa (termasuk `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>`, dan blok pemanggilan tool yang dipotong), scaffolding pemanggilan tool yang diturunkan, token kontrol model ASCII/full-width yang bocor, dan XML pemanggilan tool MiniMax yang malformed sebelum redaksi/pemotongan.

  </Tab>
</Tabs>

---

## Jebakan umum: "non-main"

<Warning>
`agents.defaults.sandbox.mode: "non-main"` didasarkan pada `session.mainKey` (default `"main"`), bukan ID agen. Sesi grup/channel selalu mendapatkan key mereka sendiri, sehingga diperlakukan sebagai non-main dan akan disandbox. Jika Anda ingin sebuah agen tidak pernah disandbox, setel `agents.list[].sandbox.mode: "off"`.
</Warning>

---

## Pengujian

Setelah mengonfigurasi sandbox dan tool multi-agen:

<Steps>
  <Step title="Periksa resolusi agen">
    ```bash
    openclaw agents list --bindings
    ```
  </Step>
  <Step title="Verifikasi container sandbox">
    ```bash
    docker ps --filter "name=openclaw-sbx-"
    ```
  </Step>
  <Step title="Uji pembatasan tool">
    - Kirim pesan yang memerlukan tool terbatas.
    - Verifikasi bahwa agen tidak dapat menggunakan tool yang ditolak.
  </Step>
  <Step title="Pantau log">
    ```bash
    tail -f "${OPENCLAW_STATE_DIR:-$HOME/.openclaw}/logs/gateway.log" | grep -E "routing|sandbox|tools"
    ```
  </Step>
</Steps>

---

## Pemecahan masalah

<AccordionGroup>
  <Accordion title="Agen tidak disandbox meskipun `mode: 'all'`">
    - Periksa apakah ada `agents.defaults.sandbox.mode` global yang mengoverridenya.
    - Konfigurasi khusus agen memiliki prioritas, jadi setel `agents.list[].sandbox.mode: "all"`.
  </Accordion>
  <Accordion title="Tool masih tersedia meskipun ada daftar deny">
    - Periksa urutan pemfilteran tool: global → agen → sandbox → subagen.
    - Setiap level hanya dapat lebih membatasi, bukan memberikan kembali.
    - Verifikasi dengan log: `[tools] filtering tools for agent:${agentId}`.
  </Accordion>
  <Accordion title="Container tidak terisolasi per agen">
    - Setel `scope: "agent"` dalam konfigurasi sandbox khusus agen.
    - Default adalah `"session"` yang membuat satu container per sesi.
  </Accordion>
</AccordionGroup>

---

## Terkait

- [Mode elevated](/id/tools/elevated)
- [Routing multi-agen](/id/concepts/multi-agent)
- [Konfigurasi sandbox](/id/gateway/config-agents#agentsdefaultssandbox)
- [Sandbox vs kebijakan tool vs elevated](/id/gateway/sandbox-vs-tool-policy-vs-elevated) — debug "mengapa ini diblokir?"
- [Sandboxing](/id/gateway/sandboxing) — referensi sandbox lengkap (mode, cakupan, backend, image)
- [Manajemen sesi](/id/concepts/session)
