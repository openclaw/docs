---
read_when:
    - Mengonfigurasi grup siaran
    - Men-debug balasan multi-agen di WhatsApp
sidebarTitle: Broadcast groups
status: experimental
summary: Siarkan pesan WhatsApp ke beberapa agen
title: Grup siaran
x-i18n:
    generated_at: "2026-04-26T11:23:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: b7b36710d9cc3eb4e2b8ba3d57031bd020aedbb6a502b400ec02a835a320d609
    source_path: channels/broadcast-groups.md
    workflow: 15
---

<Note>
**Status:** Eksperimental. Ditambahkan pada 2026.1.9.
</Note>

## Ringkasan

Grup Siaran memungkinkan beberapa agen memproses dan merespons pesan yang sama secara bersamaan. Ini memungkinkan Anda membuat tim agen khusus yang bekerja bersama dalam satu grup WhatsApp atau DM — semuanya menggunakan satu nomor telepon.

Cakupan saat ini: **WhatsApp saja** (saluran web).

Grup siaran dievaluasi setelah allowlist saluran dan aturan aktivasi grup. Dalam grup WhatsApp, ini berarti siaran terjadi ketika OpenClaw biasanya akan membalas (misalnya: saat disebut, tergantung pada pengaturan grup Anda).

## Kasus penggunaan

<AccordionGroup>
  <Accordion title="1. Tim agen khusus">
    Terapkan beberapa agen dengan tanggung jawab yang atomik dan terfokus:

    ```
    Group: "Development Team"
    Agents:
      - CodeReviewer (reviews code snippets)
      - DocumentationBot (generates docs)
      - SecurityAuditor (checks for vulnerabilities)
      - TestGenerator (suggests test cases)
    ```

    Setiap agen memproses pesan yang sama dan memberikan perspektif spesialisnya.

  </Accordion>
  <Accordion title="2. Dukungan multibahasa">
    ```
    Group: "International Support"
    Agents:
      - Agent_EN (responds in English)
      - Agent_DE (responds in German)
      - Agent_ES (responds in Spanish)
    ```
  </Accordion>
  <Accordion title="3. Alur kerja jaminan kualitas">
    ```
    Group: "Customer Support"
    Agents:
      - SupportAgent (provides answer)
      - QAAgent (reviews quality, only responds if issues found)
    ```
  </Accordion>
  <Accordion title="4. Otomatisasi tugas">
    ```
    Group: "Project Management"
    Agents:
      - TaskTracker (updates task database)
      - TimeLogger (logs time spent)
      - ReportGenerator (creates summaries)
    ```
  </Accordion>
</AccordionGroup>

## Konfigurasi

### Penyiapan dasar

Tambahkan bagian tingkat atas `broadcast` (di samping `bindings`). Key adalah ID peer WhatsApp:

- obrolan grup: JID grup (mis. `120363403215116621@g.us`)
- DM: nomor telepon E.164 (mis. `+15551234567`)

```json
{
  "broadcast": {
    "120363403215116621@g.us": ["alfred", "baerbel", "assistant3"]
  }
}
```

**Hasil:** Saat OpenClaw akan membalas di obrolan ini, OpenClaw akan menjalankan ketiga agen.

### Strategi pemrosesan

Kontrol cara agen memproses pesan:

<Tabs>
  <Tab title="parallel (default)">
    Semua agen memproses secara bersamaan:

    ```json
    {
      "broadcast": {
        "strategy": "parallel",
        "120363403215116621@g.us": ["alfred", "baerbel"]
      }
    }
    ```

  </Tab>
  <Tab title="sequential">
    Agen memproses secara berurutan (satu menunggu yang sebelumnya selesai):

    ```json
    {
      "broadcast": {
        "strategy": "sequential",
        "120363403215116621@g.us": ["alfred", "baerbel"]
      }
    }
    ```

  </Tab>
</Tabs>

### Contoh lengkap

```json
{
  "agents": {
    "list": [
      {
        "id": "code-reviewer",
        "name": "Code Reviewer",
        "workspace": "/path/to/code-reviewer",
        "sandbox": { "mode": "all" }
      },
      {
        "id": "security-auditor",
        "name": "Security Auditor",
        "workspace": "/path/to/security-auditor",
        "sandbox": { "mode": "all" }
      },
      {
        "id": "docs-generator",
        "name": "Documentation Generator",
        "workspace": "/path/to/docs-generator",
        "sandbox": { "mode": "all" }
      }
    ]
  },
  "broadcast": {
    "strategy": "parallel",
    "120363403215116621@g.us": ["code-reviewer", "security-auditor", "docs-generator"],
    "120363424282127706@g.us": ["support-en", "support-de"],
    "+15555550123": ["assistant", "logger"]
  }
}
```

## Cara kerjanya

### Alur pesan

<Steps>
  <Step title="Pesan masuk tiba">
    Sebuah pesan grup WhatsApp atau DM tiba.
  </Step>
  <Step title="Pemeriksaan siaran">
    Sistem memeriksa apakah ID peer ada di `broadcast`.
  </Step>
  <Step title="Jika ada dalam daftar siaran">
    - Semua agen yang terdaftar memproses pesan.
    - Setiap agen memiliki key sesi sendiri dan konteks yang terisolasi.
    - Agen memproses secara paralel (default) atau berurutan.

  </Step>
  <Step title="Jika tidak ada dalam daftar siaran">
    Perutean normal berlaku (binding pertama yang cocok).
  </Step>
</Steps>

<Note>
Grup siaran tidak melewati allowlist saluran atau aturan aktivasi grup (mention/perintah/dll.). Grup siaran hanya mengubah _agen mana yang dijalankan_ saat sebuah pesan memenuhi syarat untuk diproses.
</Note>

### Isolasi sesi

Setiap agen dalam grup siaran mempertahankan hal-hal berikut secara benar-benar terpisah:

- **Key sesi** (`agent:alfred:whatsapp:group:120363...` vs `agent:baerbel:whatsapp:group:120363...`)
- **Riwayat percakapan** (agen tidak melihat pesan agen lain)
- **Workspace** (sandbox terpisah jika dikonfigurasi)
- **Akses tool** (daftar allow/deny yang berbeda)
- **Memori/konteks** (`IDENTITY.md`, `SOUL.md`, dll. yang terpisah)
- **Buffer konteks grup** (pesan grup terbaru yang digunakan untuk konteks) dibagikan per peer, sehingga semua agen siaran melihat konteks yang sama saat dipicu

Ini memungkinkan setiap agen memiliki:

- Kepribadian yang berbeda
- Akses tool yang berbeda (mis. hanya baca vs. baca-tulis)
- Model yang berbeda (mis. opus vs. sonnet)
- Skills yang berbeda terpasang

### Contoh: sesi terisolasi

Dalam grup `120363403215116621@g.us` dengan agen `["alfred", "baerbel"]`:

<Tabs>
  <Tab title="Konteks Alfred">
    ```
    Session: agent:alfred:whatsapp:group:120363403215116621@g.us
    History: [user message, alfred's previous responses]
    Workspace: /Users/user/openclaw-alfred/
    Tools: read, write, exec
    ```
  </Tab>
  <Tab title="Konteks Bärbel">
    ```
    Session: agent:baerbel:whatsapp:group:120363403215116621@g.us
    History: [user message, baerbel's previous responses]
    Workspace: /Users/user/openclaw-baerbel/
    Tools: read only
    ```
  </Tab>
</Tabs>

## Praktik terbaik

<AccordionGroup>
  <Accordion title="1. Jaga agen tetap terfokus">
    Rancang setiap agen dengan satu tanggung jawab yang jelas:

    ```json
    {
      "broadcast": {
        "DEV_GROUP": ["formatter", "linter", "tester"]
      }
    }
    ```

    ✅ **Baik:** Setiap agen punya satu tugas. ❌ **Buruk:** Satu agen "dev-helper" generik.

  </Accordion>
  <Accordion title="2. Gunakan nama yang deskriptif">
    Buat jelas apa yang dilakukan setiap agen:

    ```json
    {
      "agents": {
        "security-scanner": { "name": "Security Scanner" },
        "code-formatter": { "name": "Code Formatter" },
        "test-generator": { "name": "Test Generator" }
      }
    }
    ```

  </Accordion>
  <Accordion title="3. Konfigurasikan akses tool yang berbeda">
    Berikan agen hanya tool yang mereka butuhkan:

    ```json
    {
      "agents": {
        "reviewer": {
          "tools": { "allow": ["read", "exec"] } // Hanya baca
        },
        "fixer": {
          "tools": { "allow": ["read", "write", "edit", "exec"] } // Baca-tulis
        }
      }
    }
    ```

  </Accordion>
  <Accordion title="4. Pantau performa">
    Dengan banyak agen, pertimbangkan:

    - Menggunakan `"strategy": "parallel"` (default) untuk kecepatan
    - Membatasi grup siaran menjadi 5-10 agen
    - Menggunakan model yang lebih cepat untuk agen yang lebih sederhana

  </Accordion>
  <Accordion title="5. Tangani kegagalan dengan baik">
    Agen gagal secara independen. Error pada satu agen tidak memblokir agen lain:

    ```
    Message → [Agent A ✓, Agent B ✗ error, Agent C ✓]
    Result: Agent A and C respond, Agent B logs error
    ```

  </Accordion>
</AccordionGroup>

## Kompatibilitas

### Provider

Grup siaran saat ini bekerja dengan:

- ✅ WhatsApp (diimplementasikan)
- 🚧 Telegram (direncanakan)
- 🚧 Discord (direncanakan)
- 🚧 Slack (direncanakan)

### Perutean

Grup siaran bekerja berdampingan dengan perutean yang ada:

```json
{
  "bindings": [
    {
      "match": { "channel": "whatsapp", "peer": { "kind": "group", "id": "GROUP_A" } },
      "agentId": "alfred"
    }
  ],
  "broadcast": {
    "GROUP_B": ["agent1", "agent2"]
  }
}
```

- `GROUP_A`: Hanya alfred yang merespons (perutean normal).
- `GROUP_B`: agent1 DAN agent2 merespons (siaran).

<Note>
**Prioritas:** `broadcast` lebih diprioritaskan daripada `bindings`.
</Note>

## Pemecahan masalah

<AccordionGroup>
  <Accordion title="Agen tidak merespons">
    **Periksa:**

    1. ID agen ada di `agents.list`.
    2. Format ID peer benar (mis. `120363403215116621@g.us`).
    3. Agen tidak ada dalam daftar deny.

    **Debug:**

    ```bash
    tail -f ~/.openclaw/logs/gateway.log | grep broadcast
    ```

  </Accordion>
  <Accordion title="Hanya satu agen yang merespons">
    **Penyebab:** ID peer mungkin ada di `bindings` tetapi tidak di `broadcast`.

    **Perbaikan:** Tambahkan ke konfigurasi siaran atau hapus dari bindings.

  </Accordion>
  <Accordion title="Masalah performa">
    Jika lambat dengan banyak agen:

    - Kurangi jumlah agen per grup.
    - Gunakan model yang lebih ringan (sonnet alih-alih opus).
    - Periksa waktu startup sandbox.

  </Accordion>
</AccordionGroup>

## Contoh

<AccordionGroup>
  <Accordion title="Example 1: Code review team">
    ```json
    {
      "broadcast": {
        "strategy": "parallel",
        "120363403215116621@g.us": [
          "code-formatter",
          "security-scanner",
          "test-coverage",
          "docs-checker"
        ]
      },
      "agents": {
        "list": [
          {
            "id": "code-formatter",
            "workspace": "~/agents/formatter",
            "tools": { "allow": ["read", "write"] }
          },
          {
            "id": "security-scanner",
            "workspace": "~/agents/security",
            "tools": { "allow": ["read", "exec"] }
          },
          {
            "id": "test-coverage",
            "workspace": "~/agents/testing",
            "tools": { "allow": ["read", "exec"] }
          },
          { "id": "docs-checker", "workspace": "~/agents/docs", "tools": { "allow": ["read"] } }
        ]
      }
    }
    ```

    **Pengguna mengirim:** Cuplikan kode.

    **Respons:**

    - code-formatter: "Memperbaiki indentasi dan menambahkan type hint"
    - security-scanner: "⚠️ Kerentanan SQL injection di baris 12"
    - test-coverage: "Cakupan 45%, tidak ada pengujian untuk kasus error"
    - docs-checker: "Docstring tidak ada untuk fungsi `process_data`"

  </Accordion>
  <Accordion title="Example 2: Multi-language support">
    ```json
    {
      "broadcast": {
        "strategy": "sequential",
        "+15555550123": ["detect-language", "translator-en", "translator-de"]
      },
      "agents": {
        "list": [
          { "id": "detect-language", "workspace": "~/agents/lang-detect" },
          { "id": "translator-en", "workspace": "~/agents/translate-en" },
          { "id": "translator-de", "workspace": "~/agents/translate-de" }
        ]
      }
    }
    ```
  </Accordion>
</AccordionGroup>

## Referensi API

### Skema konfigurasi

```typescript
interface OpenClawConfig {
  broadcast?: {
    strategy?: "parallel" | "sequential";
    [peerId: string]: string[];
  };
}
```

### Field

<ParamField path="strategy" type='"parallel" | "sequential"' default='"parallel"'>
  Cara memproses agen. `parallel` menjalankan semua agen secara bersamaan; `sequential` menjalankannya sesuai urutan array.
</ParamField>
<ParamField path="[peerId]" type="string[]">
  JID grup WhatsApp, nomor E.164, atau ID peer lain. Nilainya adalah array ID agen yang harus memproses pesan.
</ParamField>

## Batasan

1. **Maks. agen:** Tidak ada batas keras, tetapi 10+ agen mungkin lambat.
2. **Konteks bersama:** Agen tidak melihat respons satu sama lain (sesuai desain).
3. **Urutan pesan:** Respons paralel dapat tiba dalam urutan apa pun.
4. **Batas laju:** Semua agen dihitung terhadap batas laju WhatsApp.

## Penyempurnaan mendatang

Fitur yang direncanakan:

- [ ] Mode konteks bersama (agen melihat respons satu sama lain)
- [ ] Koordinasi agen (agen dapat saling memberi sinyal)
- [ ] Pemilihan agen dinamis (memilih agen berdasarkan isi pesan)
- [ ] Prioritas agen (beberapa agen merespons lebih dulu daripada yang lain)

## Terkait

- [Perutean saluran](/id/channels/channel-routing)
- [Grup](/id/channels/groups)
- [Tool sandbox multi-agen](/id/tools/multi-agent-sandbox-tools)
- [Pairing](/id/channels/pairing)
- [Manajemen sesi](/id/concepts/session)
