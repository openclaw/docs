---
read_when: You want per-agent sandboxing or per-agent tool allow/deny policies in a multi-agent gateway.
sidebarTitle: Multi-agent sandbox and tools
status: active
summary: Sandbox per agen + pembatasan alat, prioritas, dan contoh
title: Sandbox dan alat multi-agen
x-i18n:
    generated_at: "2026-05-10T19:55:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: c988613438f2d179b859902d3f7a39a1e29b60a0e2ae6ed598bb5f5881cf0b9f
    source_path: tools/multi-agent-sandbox-tools.md
    workflow: 16
---

Setiap agen dalam pengaturan multi-agen dapat mengganti sandbox global dan kebijakan alat. Halaman ini membahas konfigurasi per agen, aturan prioritas, dan contoh.

<CardGroup cols={3}>
  <Card title="Sandboxing" href="/id/gateway/sandboxing">
    Backend dan mode — referensi lengkap sandbox.
  </Card>
  <Card title="Sandbox vs kebijakan alat vs elevated" href="/id/gateway/sandbox-vs-tool-policy-vs-elevated">
    Debug "mengapa ini diblokir?"
  </Card>
  <Card title="Mode elevated" href="/id/tools/elevated">
    Exec elevated untuk pengirim tepercaya.
  </Card>
</CardGroup>

<Warning>
Auth dicakup berdasarkan agen: setiap agen memiliki penyimpanan auth `agentDir` sendiri di `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`. Jangan pernah menggunakan kembali `agentDir` di beberapa agen. Agen dapat membaca profil auth agen default/utama saat tidak memiliki profil lokal, tetapi token refresh OAuth tidak dikloning ke penyimpanan agen sekunder. Jika Anda menyalin kredensial secara manual, salin hanya profil `api_key` atau `token` statis yang portabel.
</Warning>

---

## Contoh konfigurasi

<AccordionGroup>
  <Accordion title="Contoh 1: Agen pribadi + agen keluarga terbatas">
    ```json
    {
      "agents": {
        "list": [
          {
            "id": "main",
            "default": true,
            "name": "Personal Assistant",
            "workspace": "~/.openclaw/workspace",
            "sandbox": { "mode": "off" }
          },
          {
            "id": "family",
            "name": "Family Bot",
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

    - Agen `main`: berjalan di host, akses alat penuh.
    - Agen `family`: berjalan di Docker (satu kontainer per agen), hanya alat `read`.

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
  <Accordion title="Contoh 2b: Profil coding global + agen khusus pesan">
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

    - agen default mendapatkan alat coding.
    - agen `support` hanya untuk pesan (+ alat Slack).

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

Pengaturan khusus agen menggantikan pengaturan global:

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
`agents.list[].sandbox.{docker,browser,prune}.*` menggantikan `agents.defaults.sandbox.{docker,browser,prune}.*` untuk agen tersebut (diabaikan saat cakupan sandbox terselesaikan menjadi `"shared"`).
</Note>

### Pembatasan alat

Urutan pemfilterannya adalah:

<Steps>
  <Step title="Profil alat">
    `tools.profile` atau `agents.list[].tools.profile`.
  </Step>
  <Step title="Profil alat penyedia">
    `tools.byProvider[provider].profile` atau `agents.list[].tools.byProvider[provider].profile`.
  </Step>
  <Step title="Kebijakan alat global">
    `tools.allow` / `tools.deny`.
  </Step>
  <Step title="Kebijakan alat penyedia">
    `tools.byProvider[provider].allow/deny`.
  </Step>
  <Step title="Kebijakan alat khusus agen">
    `agents.list[].tools.allow/deny`.
  </Step>
  <Step title="Kebijakan penyedia agen">
    `agents.list[].tools.byProvider[provider].allow/deny`.
  </Step>
  <Step title="Kebijakan alat sandbox">
    `tools.sandbox.tools` atau `agents.list[].tools.sandbox.tools`.
  </Step>
  <Step title="Kebijakan alat subagen">
    `tools.subagents.tools`, jika berlaku.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Aturan prioritas">
    - Setiap level dapat semakin membatasi alat, tetapi tidak dapat memberikan kembali alat yang sudah ditolak dari level sebelumnya.
    - Jika `agents.list[].tools.sandbox.tools` diatur, nilai tersebut menggantikan `tools.sandbox.tools` untuk agen tersebut.
    - Jika `agents.list[].tools.profile` diatur, nilai tersebut menggantikan `tools.profile` untuk agen tersebut.
    - Kunci alat penyedia menerima `provider` (mis. `google-antigravity`) atau `provider/model` (mis. `openai/gpt-5.4`).

  </Accordion>
  <Accordion title="Perilaku allowlist kosong">
    Jika allowlist eksplisit mana pun dalam rantai tersebut membuat run tidak memiliki alat yang dapat dipanggil, OpenClaw berhenti sebelum mengirim prompt ke model. Ini disengaja: agen yang dikonfigurasi dengan alat yang hilang seperti `agents.list[].tools.allow: ["query_db"]` harus gagal dengan jelas sampai Plugin yang mendaftarkan `query_db` diaktifkan, bukan melanjutkan sebagai agen khusus teks.
  </Accordion>
</AccordionGroup>

Kebijakan alat mendukung singkatan `group:*` yang diperluas menjadi beberapa alat. Lihat [Grup alat](/id/gateway/sandbox-vs-tool-policy-vs-elevated#tool-groups-shorthands) untuk daftar lengkap.

Override elevated per agen (`agents.list[].tools.elevated`) dapat semakin membatasi exec elevated untuk agen tertentu. Lihat [Mode elevated](/id/tools/elevated) untuk detail.

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
Konfigurasi `agent.*` lama dimigrasikan oleh `openclaw doctor`; untuk ke depannya, lebih baik gunakan `agents.defaults` + `agents.list`.
</Note>

---

## Contoh pembatasan alat

<Tabs>
  <Tab title="Agen baca-saja">
    ```json
    {
      "tools": {
        "allow": ["read"],
        "deny": ["exec", "write", "edit", "apply_patch", "process"]
      }
    }
    ```
  </Tab>
  <Tab title="Eksekusi shell dengan alat filesystem dinonaktifkan">
    ```json
    {
      "tools": {
        "allow": ["read", "exec", "process"],
        "deny": ["write", "edit", "apply_patch", "browser", "gateway"]
      }
    }
    ```

    <Warning>
    Kebijakan ini menonaktifkan alat filesystem OpenClaw, tetapi `exec` tetap merupakan shell dan dapat menulis file di mana pun host atau filesystem sandbox yang dipilih mengizinkan. Untuk agen baca-saja, tolak `exec` dan `process`, atau gabungkan akses shell dengan kontrol filesystem sandbox seperti `agents.defaults.sandbox.workspaceAccess: "ro"` atau `"none"`.
    </Warning>

  </Tab>
  <Tab title="Khusus komunikasi">
    ```json
    {
      "tools": {
        "sessions": { "visibility": "tree" },
        "allow": ["sessions_list", "sessions_send", "sessions_history", "session_status"],
        "deny": ["exec", "write", "edit", "apply_patch", "read", "browser"]
      }
    }
    ```

    `sessions_history` dalam profil ini tetap mengembalikan tampilan recall yang dibatasi dan disanitasi, bukan dump transkrip mentah. Recall asisten menghapus tag thinking, scaffolding `<relevant-memories>`, payload XML tool-call teks polos (termasuk `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>`, dan blok tool-call yang dipotong), scaffolding tool-call yang diturunkan, token kontrol model ASCII/full-width yang bocor, dan XML tool-call MiniMax yang malformed sebelum redaksi/pemotongan.

  </Tab>
</Tabs>

---

## Kendala umum: "non-main"

<Warning>
`agents.defaults.sandbox.mode: "non-main"` didasarkan pada `session.mainKey` (default `"main"`), bukan id agen. Sesi grup/channel selalu mendapatkan kuncinya sendiri, sehingga diperlakukan sebagai non-main dan akan disandbox. Jika Anda ingin sebuah agen tidak pernah disandbox, atur `agents.list[].sandbox.mode: "off"`.
</Warning>

---

## Pengujian

Setelah mengonfigurasi sandbox dan alat multi-agen:

<Steps>
  <Step title="Periksa resolusi agen">
    ```bash
    openclaw agents list --bindings
    ```
  </Step>
  <Step title="Verifikasi kontainer sandbox">
    ```bash
    docker ps --filter "name=openclaw-sbx-"
    ```
  </Step>
  <Step title="Uji pembatasan alat">
    - Kirim pesan yang memerlukan alat terbatas.
    - Verifikasi bahwa agen tidak dapat menggunakan alat yang ditolak.

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
    - Periksa apakah ada `agents.defaults.sandbox.mode` global yang menggantikannya.
    - Konfigurasi khusus agen memiliki prioritas, jadi atur `agents.list[].sandbox.mode: "all"`.

  </Accordion>
  <Accordion title="Alat masih tersedia meskipun ada daftar deny">
    - Periksa urutan pemfilteran alat: global → agen → sandbox → subagen.
    - Setiap level hanya dapat semakin membatasi, bukan memberikan kembali.
    - Verifikasi dengan log: `[tools] filtering tools for agent:${agentId}`.

  </Accordion>
  <Accordion title="Kontainer tidak terisolasi per agen">
    - Atur `scope: "agent"` dalam konfigurasi sandbox khusus agen.
    - Default-nya adalah `"session"` yang membuat satu kontainer per sesi.

  </Accordion>
</AccordionGroup>

---

## Terkait

- [Mode hak akses tinggi](/id/tools/elevated)
- [Perutean multi-agen](/id/concepts/multi-agent)
- [Konfigurasi isolasi](/id/gateway/config-agents#agentsdefaultssandbox)
- [Isolasi vs kebijakan alat vs hak akses tinggi](/id/gateway/sandbox-vs-tool-policy-vs-elevated) — men-debug "mengapa ini diblokir?"
- [Isolasi](/id/gateway/sandboxing) — referensi isolasi lengkap (mode, cakupan, backend, image)
- [Pengelolaan sesi](/id/concepts/session)
