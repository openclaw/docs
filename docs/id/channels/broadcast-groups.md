---
read_when:
    - Mengonfigurasi grup siaran
    - Pemecahan masalah balasan multi-agen di WhatsApp
sidebarTitle: Broadcast groups
status: experimental
summary: Siarkan pesan WhatsApp ke beberapa agen
title: Grup siaran
x-i18n:
    generated_at: "2026-04-30T09:32:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: b0de4ccc85bf79e2ceb1dddd60db067309b15b7f876c92e7d591ff0b4b4315ec
    source_path: channels/broadcast-groups.md
    workflow: 16
---

<Note>
**Status:** Eksperimental. Ditambahkan pada 2026.1.9.
</Note>

## Ikhtisar

Grup broadcast memungkinkan beberapa agen memproses dan merespons pesan yang sama secara bersamaan. Ini memungkinkan Anda membuat tim agen khusus yang bekerja bersama dalam satu grup WhatsApp atau DM — semuanya menggunakan satu nomor telepon.

Cakupan saat ini: **hanya WhatsApp** (kanal web).

Grup broadcast dievaluasi setelah daftar izin kanal dan aturan aktivasi grup. Di grup WhatsApp, ini berarti broadcast terjadi ketika OpenClaw biasanya akan membalas (misalnya: saat disebut, tergantung pengaturan grup Anda).

## Kasus penggunaan

<AccordionGroup>
  <Accordion title="1. Tim agen khusus">
    Jalankan beberapa agen dengan tanggung jawab yang atomik dan terfokus:

    ```
    Group: "Development Team"
    Agents:
      - CodeReviewer (reviews code snippets)
      - DocumentationBot (generates docs)
      - SecurityAuditor (checks for vulnerabilities)
      - TestGenerator (suggests test cases)
    ```

    Setiap agen memproses pesan yang sama dan memberikan perspektif khususnya.

  </Accordion>
  <Accordion title="2. Dukungan multi-bahasa">
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

Tambahkan bagian `broadcast` tingkat atas (di samping `bindings`). Kunci adalah ID peer WhatsApp:

- chat grup: JID grup (mis. `120363403215116621@g.us`)
- DM: nomor telepon E.164 (mis. `+15551234567`)

```json
{
  "broadcast": {
    "120363403215116621@g.us": ["alfred", "baerbel", "assistant3"]
  }
}
```

**Hasil:** Ketika OpenClaw akan membalas di chat ini, OpenClaw akan menjalankan ketiga agen.

### Strategi pemrosesan

Kontrol cara agen memproses pesan:

<Tabs>
  <Tab title="paralel (default)">
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
  <Tab title="berurutan">
    Agen memproses sesuai urutan (satu agen menunggu agen sebelumnya selesai):

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
    Pesan grup WhatsApp atau DM tiba.
  </Step>
  <Step title="Pemeriksaan broadcast">
    Sistem memeriksa apakah ID peer ada di `broadcast`.
  </Step>
  <Step title="Jika ada dalam daftar broadcast">
    - Semua agen yang tercantum memproses pesan.
    - Setiap agen memiliki kunci sesi dan konteks terisolasi sendiri.
    - Agen memproses secara paralel (default) atau berurutan.

  </Step>
  <Step title="Jika tidak ada dalam daftar broadcast">
    Perutean normal berlaku (binding pertama yang cocok).
  </Step>
</Steps>

<Note>
Grup broadcast tidak melewati daftar izin kanal atau aturan aktivasi grup (sebutan/perintah/dll.). Grup broadcast hanya mengubah _agen mana yang berjalan_ ketika sebuah pesan memenuhi syarat untuk diproses.
</Note>

### Isolasi sesi

Setiap agen dalam grup broadcast mempertahankan hal berikut secara sepenuhnya terpisah:

- **Kunci sesi** (`agent:alfred:whatsapp:group:120363...` vs `agent:baerbel:whatsapp:group:120363...`)
- **Riwayat percakapan** (agen tidak melihat pesan agen lain)
- **Workspace** (sandbox terpisah jika dikonfigurasi)
- **Akses alat** (daftar izinkan/tolak yang berbeda)
- **Memori/konteks** (IDENTITY.md, SOUL.md, dll. terpisah)
- **Buffer konteks grup** (pesan grup terbaru yang digunakan untuk konteks) dibagikan per peer, sehingga semua agen broadcast melihat konteks yang sama saat dipicu

Ini memungkinkan setiap agen memiliki:

- Kepribadian berbeda
- Akses alat berbeda (mis., hanya baca vs. baca-tulis)
- Model berbeda (mis., opus vs. sonnet)
- Skills berbeda yang terpasang

### Contoh: sesi terisolasi

Di grup `120363403215116621@g.us` dengan agen `["alfred", "baerbel"]`:

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
  <Accordion title="1. Jaga agar agen tetap terfokus">
    Rancang setiap agen dengan satu tanggung jawab yang jelas:

    ```json
    {
      "broadcast": {
        "DEV_GROUP": ["formatter", "linter", "tester"]
      }
    }
    ```

    ✅ **Baik:** Setiap agen memiliki satu pekerjaan. ❌ **Buruk:** Satu agen "dev-helper" generik.

  </Accordion>
  <Accordion title="2. Gunakan nama deskriptif">
    Buat agar jelas apa yang dilakukan setiap agen:

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
  <Accordion title="3. Konfigurasikan akses alat yang berbeda">
    Berikan agen hanya alat yang mereka butuhkan:

    ```json
    {
      "agents": {
        "reviewer": {
          "tools": { "allow": ["read", "exec"] } // Read-only
        },
        "fixer": {
          "tools": { "allow": ["read", "write", "edit", "exec"] } // Read-write
        }
      }
    }
    ```

  </Accordion>
  <Accordion title="4. Pantau performa">
    Dengan banyak agen, pertimbangkan:

    - Menggunakan `"strategy": "parallel"` (default) untuk kecepatan
    - Membatasi grup broadcast menjadi 5-10 agen
    - Menggunakan model yang lebih cepat untuk agen yang lebih sederhana

  </Accordion>
  <Accordion title="5. Tangani kegagalan dengan baik">
    Agen gagal secara independen. Kesalahan satu agen tidak memblokir agen lain:

    ```
    Message → [Agent A ✓, Agent B ✗ error, Agent C ✓]
    Result: Agent A and C respond, Agent B logs error
    ```

  </Accordion>
</AccordionGroup>

## Kompatibilitas

### Penyedia

Grup broadcast saat ini berfungsi dengan:

- ✅ WhatsApp (diimplementasikan)
- 🚧 Telegram (direncanakan)
- 🚧 Discord (direncanakan)
- 🚧 Slack (direncanakan)

### Perutean

Grup broadcast bekerja berdampingan dengan perutean yang sudah ada:

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
- `GROUP_B`: agent1 DAN agent2 merespons (broadcast).

<Note>
**Presedensi:** `broadcast` memiliki prioritas atas `bindings`.
</Note>

## Pemecahan masalah

<AccordionGroup>
  <Accordion title="Agen tidak merespons">
    **Periksa:**

    1. ID agen ada di `agents.list`.
    2. Format ID peer benar (mis., `120363403215116621@g.us`).
    3. Agen tidak ada dalam daftar tolak.

    **Debug:**

    ```bash
    tail -f ~/.openclaw/logs/gateway.log | grep broadcast
    ```

  </Accordion>
  <Accordion title="Hanya satu agen yang merespons">
    **Penyebab:** ID peer mungkin ada di `bindings` tetapi tidak di `broadcast`.

    **Perbaikan:** Tambahkan ke konfigurasi broadcast atau hapus dari bindings.

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
  <Accordion title="Contoh 1: Tim peninjauan kode">
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

    - code-formatter: "Memperbaiki indentasi dan menambahkan petunjuk tipe"
    - security-scanner: "⚠️ Kerentanan injeksi SQL di baris 12"
    - test-coverage: "Cakupan 45%, kurang pengujian untuk kasus kesalahan"
    - docs-checker: "Docstring tidak ada untuk fungsi `process_data`"

  </Accordion>
  <Accordion title="Contoh 2: Dukungan multi-bahasa">
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

### Bidang

<ParamField path="strategy" type='"parallel" | "sequential"' default='"parallel"'>
  Cara memproses agen. `parallel` menjalankan semua agen secara bersamaan; `sequential` menjalankannya sesuai urutan array.
</ParamField>
<ParamField path="[peerId]" type="string[]">
  JID grup WhatsApp, nomor E.164, atau ID peer lain. Nilainya adalah array ID agen yang harus memproses pesan.
</ParamField>

## Batasan

1. **Maks agen:** Tidak ada batas keras, tetapi 10+ agen mungkin lambat.
2. **Konteks bersama:** Agen tidak melihat respons satu sama lain (sesuai desain).
3. **Urutan pesan:** Respons paralel dapat tiba dalam urutan apa pun.
4. **Batas laju:** Semua agen dihitung terhadap batas laju WhatsApp.

## Penyempurnaan mendatang

Fitur yang direncanakan:

- [ ] Mode konteks bersama (agen melihat respons satu sama lain)
- [ ] Koordinasi agen (agen dapat saling memberi sinyal)
- [ ] Pemilihan agen dinamis (memilih agen berdasarkan konten pesan)
- [ ] Prioritas agen (sebagian agen merespons sebelum yang lain)

## Terkait

- [Perutean saluran](/id/channels/channel-routing)
- [Grup](/id/channels/groups)
- [Alat sandbox multi-agen](/id/tools/multi-agent-sandbox-tools)
- [Pemasangan](/id/channels/pairing)
- [Manajemen sesi](/id/concepts/session)
