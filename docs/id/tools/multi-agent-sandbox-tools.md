---
read_when: You want per-agent sandboxing or per-agent tool allow/deny policies in a multi-agent gateway.
sidebarTitle: Multi-agent sandbox and tools
status: active
summary: Sandbox dan pembatasan alat per agen, presedensi, dan contoh
title: Sandbox dan alat multi-agent
x-i18n:
    generated_at: "2026-05-11T20:36:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8d11af55e30996a89e665b258604108a93f4c4271fbe4edfd1caf54864e40f01
    source_path: tools/multi-agent-sandbox-tools.md
    workflow: 16
    postprocess_version: locale-links-v1
---

Setiap agen dalam penyiapan multi-agen dapat menimpa kebijakan sandbox dan alat global. Halaman ini membahas konfigurasi per agen, aturan prioritas, dan contoh.

<CardGroup cols={3}>
  <Card title="Sandboxing" href="/id/gateway/sandboxing">
    Backend dan mode — referensi sandbox lengkap.
  </Card>
  <Card title="Sandbox vs tool policy vs elevated" href="/id/gateway/sandbox-vs-tool-policy-vs-elevated">
    Debug "mengapa ini diblokir?"
  </Card>
  <Card title="Elevated mode" href="/id/tools/elevated">
    Exec elevated untuk pengirim tepercaya.
  </Card>
</CardGroup>

<Warning>
Autentikasi dicakup berdasarkan agen: setiap agen memiliki penyimpanan autentikasi `agentDir` sendiri di `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`. Jangan pernah menggunakan ulang `agentDir` antar agen. Agen dapat membaca hingga ke profil autentikasi agen default/utama ketika tidak memiliki profil lokal, tetapi token refresh OAuth tidak dikloning ke penyimpanan agen sekunder. Jika Anda menyalin kredensial secara manual, salin hanya profil `api_key` atau `token` statis yang portabel.
</Warning>

---

## Contoh konfigurasi

<AccordionGroup>
  <Accordion title="Example 1: Personal + restricted family agent">
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
              "allow": ["read", "message"],
              "deny": ["exec", "write", "edit", "apply_patch", "process", "browser"],
              "message": {
                "crossContext": {
                  "allowWithinProvider": false,
                  "allowAcrossProviders": false
                }
              }
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
    - Agen `family`: berjalan di Docker (satu kontainer per agen), hanya pengiriman pesan `read` dan percakapan saat ini.

  </Accordion>
  <Accordion title="Example 2: Work agent with shared sandbox">
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
  <Accordion title="Example 2b: Global coding profile + messaging-only agent">
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
    - agen `support` hanya untuk perpesanan (+ alat Slack).

  </Accordion>
  <Accordion title="Example 3: Different sandbox modes per agent">
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

Ketika konfigurasi global (`agents.defaults.*`) dan konfigurasi khusus agen (`agents.list[].*`) sama-sama ada:

### Konfigurasi sandbox

Pengaturan khusus agen menimpa global:

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
`agents.list[].sandbox.{docker,browser,prune}.*` menimpa `agents.defaults.sandbox.{docker,browser,prune}.*` untuk agen tersebut (diabaikan ketika cakupan sandbox diselesaikan menjadi `"shared"`).
</Note>

### Pembatasan alat

Urutan pemfilterannya adalah:

<Steps>
  <Step title="Tool profile">
    `tools.profile` atau `agents.list[].tools.profile`.
  </Step>
  <Step title="Provider tool profile">
    `tools.byProvider[provider].profile` atau `agents.list[].tools.byProvider[provider].profile`.
  </Step>
  <Step title="Global tool policy">
    `tools.allow` / `tools.deny`.
  </Step>
  <Step title="Provider tool policy">
    `tools.byProvider[provider].allow/deny`.
  </Step>
  <Step title="Agent-specific tool policy">
    `agents.list[].tools.allow/deny`.
  </Step>
  <Step title="Agent provider policy">
    `agents.list[].tools.byProvider[provider].allow/deny`.
  </Step>
  <Step title="Sandbox tool policy">
    `tools.sandbox.tools` atau `agents.list[].tools.sandbox.tools`.
  </Step>
  <Step title="Subagent tool policy">
    `tools.subagents.tools`, jika berlaku.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Precedence rules">
    - Setiap tingkat dapat semakin membatasi alat, tetapi tidak dapat mengaktifkan kembali alat yang telah ditolak dari tingkat sebelumnya.
    - Jika `agents.list[].tools.sandbox.tools` ditetapkan, nilai itu menggantikan `tools.sandbox.tools` untuk agen tersebut.
    - Jika `agents.list[].tools.profile` ditetapkan, nilai itu menimpa `tools.profile` untuk agen tersebut.
    - Kunci alat penyedia menerima `provider` (misalnya `google-antigravity`) atau `provider/model` (misalnya `openai/gpt-5.4`).

  </Accordion>
  <Accordion title="Empty allowlist behavior">
    Jika allowlist eksplisit apa pun dalam rantai tersebut membuat proses berjalan tanpa alat yang dapat dipanggil, OpenClaw berhenti sebelum mengirimkan prompt ke model. Ini disengaja: agen yang dikonfigurasi dengan alat yang hilang seperti `agents.list[].tools.allow: ["query_db"]` harus gagal dengan jelas sampai Plugin yang mendaftarkan `query_db` diaktifkan, bukan berlanjut sebagai agen teks saja.
  </Accordion>
</AccordionGroup>

Kebijakan alat mendukung singkatan `group:*` yang diperluas menjadi beberapa alat. Lihat [Grup alat](/id/gateway/sandbox-vs-tool-policy-vs-elevated#tool-groups-shorthands) untuk daftar lengkapnya.

Timpa elevated per agen (`agents.list[].tools.elevated`) dapat semakin membatasi exec elevated untuk agen tertentu. Lihat [Mode elevated](/id/tools/elevated) untuk detail.

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
Konfigurasi `agent.*` lama dimigrasikan oleh `openclaw doctor`; selanjutnya, utamakan `agents.defaults` + `agents.list`.
</Note>

---

## Contoh pembatasan alat

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
  <Tab title="Eksekusi shell dengan alat sistem file dinonaktifkan">
    ```json
    {
      "tools": {
        "allow": ["read", "exec", "process"],
        "deny": ["write", "edit", "apply_patch", "browser", "gateway"]
      }
    }
    ```

    <Warning>
    Kebijakan ini menonaktifkan alat sistem file OpenClaw, tetapi `exec` tetap merupakan shell dan dapat menulis file di mana pun host atau sistem file sandbox yang dipilih mengizinkan. Untuk agen hanya-baca, tolak `exec` dan `process`, atau gabungkan akses shell dengan kontrol sistem file sandbox seperti `agents.defaults.sandbox.workspaceAccess: "ro"` atau `"none"`.
    </Warning>

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

    `sessions_history` dalam profil ini tetap mengembalikan tampilan ingatan yang terbatas dan telah disanitasi, bukan dump transkrip mentah. Ingatan asisten menghapus tag berpikir, scaffolding `<relevant-memories>`, payload XML pemanggilan alat teks biasa (termasuk `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>`, dan blok pemanggilan alat yang terpotong), scaffolding pemanggilan alat yang diturunkan, token kontrol model ASCII/lebar-penuh yang bocor, dan XML pemanggilan alat MiniMax yang tidak valid sebelum redaksi/pemotongan.

  </Tab>
</Tabs>

---

## Kekeliruan umum: "non-main"

<Warning>
`agents.defaults.sandbox.mode: "non-main"` didasarkan pada `session.mainKey` (default `"main"`), bukan id agen. Sesi grup/channel selalu mendapatkan kuncinya sendiri, sehingga diperlakukan sebagai non-main dan akan disandbox. Jika Anda ingin agen tidak pernah disandbox, atur `agents.list[].sandbox.mode: "off"`.
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
    - Periksa apakah ada `agents.defaults.sandbox.mode` global yang menimpanya.
    - Konfigurasi khusus agen memiliki prioritas, jadi atur `agents.list[].sandbox.mode: "all"`.

  </Accordion>
  <Accordion title="Alat masih tersedia meskipun ada daftar penolakan">
    - Periksa urutan pemfilteran alat: global → agen → sandbox → subagen.
    - Setiap tingkat hanya dapat membatasi lebih lanjut, bukan memberikan kembali.
    - Verifikasi dengan log: `[tools] filtering tools for agent:${agentId}`.

  </Accordion>
  <Accordion title="Kontainer tidak diisolasi per agen">
    - Atur `scope: "agent"` dalam konfigurasi sandbox khusus agen.
    - Default-nya adalah `"session"` yang membuat satu kontainer per sesi.

  </Accordion>
</AccordionGroup>

---

## Terkait

- [Mode elevated](/id/tools/elevated)
- [Perutean multi-agent](/id/concepts/multi-agent)
- [Konfigurasi sandbox](/id/gateway/config-agents#agentsdefaultssandbox)
- [Sandbox vs kebijakan alat vs elevated](/id/gateway/sandbox-vs-tool-policy-vs-elevated) — men-debug "mengapa ini diblokir?"
- [Sandboxing](/id/gateway/sandboxing) — referensi sandbox lengkap (mode, cakupan, backend, image)
- [Manajemen sesi](/id/concepts/session)
