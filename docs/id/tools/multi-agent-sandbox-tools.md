---
read_when: You want per-agent sandboxing or per-agent tool allow/deny policies in a multi-agent gateway.
sidebarTitle: Multi-agent sandbox and tools
status: active
summary: Sandbox per agen + pembatasan alat, prioritas, dan contoh
title: Sandbox dan alat multiagen
x-i18n:
    generated_at: "2026-07-12T14:47:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fada3672a0a7ce6eac2a8bffee8329afcd893d97e33d8e9842cb12079397efa6
    source_path: tools/multi-agent-sandbox-tools.md
    workflow: 16
---

Setiap agen dalam penyiapan multiagen dapat mengganti kebijakan sandbox dan alat global. Halaman ini membahas konfigurasi per agen, aturan prioritas, dan contoh.

<CardGroup cols={3}>
  <Card title="Sandbox" href="/id/gateway/sandboxing">
    Backend dan mode — referensi lengkap sandbox.
  </Card>
  <Card title="Sandbox vs kebijakan alat vs elevated" href="/id/gateway/sandbox-vs-tool-policy-vs-elevated">
    Debug "mengapa ini diblokir?"
  </Card>
  <Card title="Mode elevated" href="/id/tools/elevated">
    Eksekusi elevated untuk pengirim tepercaya.
  </Card>
</CardGroup>

<Warning>
Autentikasi dicakup per agen: setiap agen memiliki penyimpanan autentikasi `agentDir` sendiri di `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`. Jangan pernah menggunakan kembali `agentDir` pada agen yang berbeda. Agen dapat membaca profil autentikasi agen default/utama jika tidak memiliki profil lokal, tetapi token penyegaran OAuth tidak dikloning ke penyimpanan agen sekunder. Jika Anda menyalin kredensial secara manual, salin hanya profil statis portabel `api_key` atau `token`.
</Warning>

---

## Contoh konfigurasi

<AccordionGroup>
  <Accordion title="Contoh 1: Agen pribadi + keluarga terbatas">
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

    - Agen `main`: berjalan di host, dengan akses penuh ke alat.
    - Agen `family`: berjalan di Docker (satu kontainer per agen), hanya dapat menggunakan `read` dan mengirim pesan dalam percakapan saat ini.

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
  <Accordion title="Contoh 2b: Profil pengodean global + agen khusus perpesanan">
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

    - agen default mendapatkan alat pengodean.
    - agen `support` hanya dapat menggunakan perpesanan (+ alat Slack).

  </Accordion>
  <Accordion title="Contoh 3: Mode sandbox berbeda untuk setiap agen">
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

Jika konfigurasi global (`agents.defaults.*`) dan khusus agen (`agents.list[].*`) tersedia:

### Konfigurasi sandbox

Pengaturan khusus agen menggantikan pengaturan global:

```text
agents.list[].sandbox.mode > agents.defaults.sandbox.mode
agents.list[].sandbox.scope > agents.defaults.sandbox.scope
agents.list[].sandbox.workspaceRoot > agents.defaults.sandbox.workspaceRoot
agents.list[].sandbox.workspaceAccess > agents.defaults.sandbox.workspaceAccess
agents.list[].sandbox.docker.* > agents.defaults.sandbox.docker.*
agents.list[].sandbox.browser.* > agents.defaults.sandbox.browser.*
agents.list[].sandbox.prune.* > agents.defaults.sandbox.prune.*
```

<Note>
`agents.list[].sandbox.{docker,browser,prune}.*` menggantikan `agents.defaults.sandbox.{docker,browser,prune}.*` untuk agen tersebut (diabaikan jika cakupan sandbox ditetapkan sebagai `"shared"`).
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
    - Setiap tingkat dapat membatasi alat lebih lanjut, tetapi tidak dapat mengizinkan kembali alat yang ditolak pada tingkat sebelumnya.
    - Jika `agents.list[].tools.sandbox.tools` ditetapkan, nilai tersebut menggantikan `tools.sandbox.tools` untuk agen tersebut.
    - Jika `agents.list[].tools.profile` ditetapkan, nilai tersebut menggantikan `tools.profile` untuk agen tersebut.
    - Kunci alat penyedia menerima `provider` (misalnya `google-antigravity`) atau `provider/model` (misalnya `openai/gpt-5.4`).

  </Accordion>
  <Accordion title="Perilaku daftar izin kosong">
    Jika daftar izin eksplisit mana pun dalam rangkaian tersebut membuat proses tidak memiliki alat yang dapat dipanggil, OpenClaw berhenti sebelum mengirimkan prompt ke model. Ini disengaja: agen yang dikonfigurasi dengan alat yang tidak tersedia, seperti `agents.list[].tools.allow: ["query_db"]`, harus gagal secara jelas sampai plugin yang mendaftarkan `query_db` diaktifkan, bukan berlanjut sebagai agen khusus teks.
  </Accordion>
</AccordionGroup>

Kebijakan alat mendukung bentuk singkat `group:*` yang diperluas menjadi beberapa alat. Lihat [Grup alat](/id/gateway/sandbox-vs-tool-policy-vs-elevated#tool-groups-shorthands) untuk daftar lengkap.

Penggantian elevated per agen (`agents.list[].tools.elevated`) dapat membatasi lebih lanjut eksekusi elevated untuk agen tertentu. Lihat [Mode elevated](/id/tools/elevated) untuk detailnya.

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
  <Tab title="Sesudah (multiagen)">
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
Kunci konfigurasi lama `agents.defaults.*`/`agents.list[].*` (seperti `sandbox.perSession`, `agentRuntime`, `embeddedPi`) dimigrasikan oleh `openclaw doctor`; selanjutnya, utamakan `agents.defaults` + `agents.list`.
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
  <Tab title="Eksekusi shell dengan alat sistem berkas dinonaktifkan">
    ```json
    {
      "tools": {
        "allow": ["read", "exec", "process"],
        "deny": ["write", "edit", "apply_patch", "browser", "gateway"]
      }
    }
    ```

    <Warning>
    Kebijakan ini menonaktifkan alat sistem berkas OpenClaw, tetapi `exec` tetap merupakan shell dan dapat menulis berkas di mana pun sistem berkas host atau sandbox yang dipilih mengizinkannya. Untuk agen hanya-baca, tolak `exec` dan `process`, atau gabungkan akses shell dengan kontrol sistem berkas sandbox seperti `agents.defaults.sandbox.workspaceAccess: "ro"` atau `"none"`.
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

    `sessions_history` dalam profil ini tetap mengembalikan tampilan ingatan yang dibatasi dan disanitasi, bukan hasil pembuangan transkrip mentah. Ingatan asisten menghapus tag pemikiran, kerangka `<relevant-memories>`, muatan XML pemanggilan alat dalam teks biasa (termasuk `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>`, dan blok pemanggilan alat yang terpotong), kerangka pemanggilan alat yang diturunkan, token kontrol model ASCII/lebar penuh yang bocor, serta XML pemanggilan alat MiniMax yang tidak valid sebelum penyuntingan/pemotongan.

  </Tab>
</Tabs>

---

## Kesalahan umum: "non-main"

<Warning>
`agents.defaults.sandbox.mode: "non-main"` memeriksa kunci sesi terhadap kunci sesi utama (selalu `"main"`; `session.mainKey` tidak dapat dikonfigurasi oleh pengguna, dan OpenClaw memperingatkan serta mengabaikan nilai lainnya), bukan ID agen. Sesi grup/saluran selalu mendapatkan kuncinya sendiri, sehingga diperlakukan sebagai nonutama dan akan ditempatkan dalam sandbox. Jika Anda ingin agar suatu agen tidak pernah menggunakan sandbox, tetapkan `agents.list[].sandbox.mode: "off"`.
</Warning>

---

## Pengujian

Setelah mengonfigurasi sandbox dan alat multiagen:

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
    openclaw logs --follow | grep -E "routing|sandbox|tools"
    ```
  </Step>
</Steps>

---

## Pemecahan masalah

<AccordionGroup>
  <Accordion title="Agen tidak ditempatkan dalam sandbox meskipun `mode: 'all'`">
    - Periksa apakah ada `agents.defaults.sandbox.mode` global yang menggantikannya.
    - Konfigurasi khusus agen memiliki prioritas, jadi tetapkan `agents.list[].sandbox.mode: "all"`.

  </Accordion>
  <Accordion title="Alat tetap tersedia meskipun ada daftar penolakan">
    - Periksa [urutan pemfilteran lengkap](#tool-restrictions): profil → profil penyedia → kebijakan global → kebijakan penyedia → kebijakan agen → kebijakan penyedia agen → sandbox → subagen.
    - Setiap tingkat hanya dapat membatasi lebih lanjut, bukan memberikan kembali akses.
    - Lihat [Sandbox vs kebijakan alat vs elevated](/id/gateway/sandbox-vs-tool-policy-vs-elevated) untuk penelusuran kesalahan langkah demi langkah.

  </Accordion>
  <Accordion title="Kontainer tidak diisolasi per agen">
    - `scope` bawaan adalah `"agent"` (satu kontainer per ID agen).
    - Atur `scope: "session"` untuk satu kontainer per sesi, atau `scope: "shared"` untuk menggunakan kembali satu kontainer bagi beberapa agen.

  </Accordion>
</AccordionGroup>

---

## Terkait

- [Mode elevated](/id/tools/elevated)
- [Perutean multiagen](/id/concepts/multi-agent)
- [Konfigurasi sandbox](/id/gateway/config-agents#agentsdefaultssandbox)
- [Sandbox vs kebijakan alat vs elevated](/id/gateway/sandbox-vs-tool-policy-vs-elevated) — menelusuri kesalahan "mengapa ini diblokir?"
- [Sandboxing](/id/gateway/sandboxing) — referensi sandbox lengkap (mode, cakupan, backend, image)
- [Pengelolaan sesi](/id/concepts/session)
