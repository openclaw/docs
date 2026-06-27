---
read_when:
    - Mengonfigurasi grup siaran
    - Men-debug balasan multi-agen di WhatsApp
sidebarTitle: Broadcast groups
status: experimental
summary: Siarkan pesan WhatsApp ke beberapa agen
title: Grup siaran
x-i18n:
    generated_at: "2026-06-27T17:09:10Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a89b936322baf0fea7b487cb5354b9fad3fc021abb2970f7cd934b1880da2a0e
    source_path: channels/broadcast-groups.md
    workflow: 16
---

<Note>
**Status:** Eksperimental. Ditambahkan pada 2026.1.9.
</Note>

## Ikhtisar

Grup Siaran memungkinkan beberapa agen memproses dan merespons pesan yang sama secara bersamaan. Ini memungkinkan Anda membuat tim agen khusus yang bekerja bersama dalam satu grup WhatsApp atau DM — semuanya menggunakan satu nomor telepon.

Cakupan saat ini: **hanya WhatsApp** (kanal web).

Grup siaran dievaluasi setelah allowlist kanal dan aturan aktivasi grup. Dalam grup WhatsApp, ini berarti siaran terjadi saat OpenClaw biasanya akan membalas (misalnya: saat disebut, tergantung pengaturan grup Anda).

## Kasus penggunaan

<AccordionGroup>
  <Accordion title="1. Specialized agent teams">
    Terapkan beberapa agen dengan tanggung jawab yang atomik dan terfokus:

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
  <Accordion title="2. Multi-language support">
    ```
    Group: "International Support"
    Agents:
      - Agent_EN (responds in English)
      - Agent_DE (responds in German)
      - Agent_ES (responds in Spanish)
    ```
  </Accordion>
  <Accordion title="3. Quality assurance workflows">
    ```
    Group: "Customer Support"
    Agents:
      - SupportAgent (provides answer)
      - QAAgent (reviews quality, only responds if issues found)
    ```
  </Accordion>
  <Accordion title="4. Task automation">
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

- percakapan grup: JID grup (mis. `120363403215116621@g.us`)
- DM: nomor telepon E.164 (mis. `+15551234567`)

```json
{
  "broadcast": {
    "120363403215116621@g.us": ["alfred", "baerbel", "assistant3"]
  }
}
```

**Hasil:** Saat OpenClaw akan membalas dalam percakapan ini, OpenClaw akan menjalankan ketiga agen.

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
  <Step title="Incoming message arrives">
    Pesan grup WhatsApp atau DM masuk.
  </Step>
  <Step title="Route and admission">
    OpenClaw menerapkan allowlist kanal, aturan aktivasi grup, dan kepemilikan binding ACP yang dikonfigurasi.
  </Step>
  <Step title="Broadcast check">
    Jika tidak ada binding ACP terkonfigurasi yang memiliki rute tersebut, OpenClaw memeriksa apakah ID peer ada di `broadcast`.
  </Step>
  <Step title="If broadcast applies">
    - Semua agen yang tercantum memproses pesan.
    - Setiap agen memiliki kunci sesi dan konteks terisolasi sendiri.
    - Agen memproses secara paralel (default) atau berurutan.

  </Step>
  <Step title="If broadcast does not apply">
    OpenClaw mengirim ke rute biasa atau rute sesi ACP terkonfigurasi yang dipilih selama perutean.
  </Step>
</Steps>

<Note>
Grup siaran tidak melewati allowlist kanal atau aturan aktivasi grup (sebutan/perintah/dll.). Grup siaran hanya mengubah _agen mana yang berjalan_ saat pesan memenuhi syarat untuk diproses.
</Note>

### Isolasi sesi

Setiap agen dalam grup siaran mempertahankan hal-hal yang sepenuhnya terpisah:

- **Kunci sesi** (`agent:alfred:whatsapp:group:120363...` vs `agent:baerbel:whatsapp:group:120363...`)
- **Riwayat percakapan** (agen tidak melihat pesan agen lain)
- **Workspace** (sandbox terpisah jika dikonfigurasi)
- **Akses alat** (daftar izinkan/tolak berbeda)
- **Memori/konteks** (IDENTITY.md, SOUL.md, dll. terpisah)
- **Buffer konteks grup** (pesan grup terbaru yang digunakan untuk konteks) dibagikan per peer, sehingga semua agen siaran melihat konteks yang sama saat dipicu

Ini memungkinkan setiap agen memiliki:

- Kepribadian berbeda
- Akses alat berbeda (mis. hanya baca vs. baca-tulis)
- Model berbeda (mis. opus vs. sonnet)
- Skills berbeda yang terinstal

### Contoh: sesi terisolasi

Dalam grup `120363403215116621@g.us` dengan agen `["alfred", "baerbel"]`:

<Tabs>
  <Tab title="Alfred's context">
    ```
    Session: agent:alfred:whatsapp:group:120363403215116621@g.us
    History: [user message, alfred's previous responses]
    Workspace: /Users/user/openclaw-alfred/
    Tools: read, write, exec
    ```
  </Tab>
  <Tab title="Bärbel's context">
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
  <Accordion title="1. Keep agents focused">
    Rancang setiap agen dengan satu tanggung jawab yang jelas:

    ```json
    {
      "broadcast": {
        "DEV_GROUP": ["formatter", "linter", "tester"]
      }
    }
    ```

    ✅ **Baik:** Setiap agen memiliki satu tugas. ❌ **Buruk:** Satu agen "dev-helper" generik.

  </Accordion>
  <Accordion title="2. Use descriptive names">
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
  <Accordion title="3. Configure different tool access">
    Berikan agen hanya alat yang mereka butuhkan:

    ```json
    {
      "agents": {
        "reviewer": {
          "tools": { "allow": ["read", "exec"] }
        },
        "fixer": {
          "tools": { "allow": ["read", "write", "edit", "exec"] }
        }
      }
    }
    ```

    `reviewer` bersifat hanya baca. `fixer` dapat membaca dan menulis.

  </Accordion>
  <Accordion title="4. Monitor performance">
    Dengan banyak agen, pertimbangkan:

    - Menggunakan `"strategy": "parallel"` (default) untuk kecepatan
    - Membatasi grup siaran menjadi 5-10 agen
    - Menggunakan model yang lebih cepat untuk agen yang lebih sederhana

  </Accordion>
  <Accordion title="5. Handle failures gracefully">
    Agen gagal secara independen. Kesalahan satu agen tidak memblokir yang lain:

    ```
    Message → [Agent A ✓, Agent B ✗ error, Agent C ✓]
    Result: Agent A and C respond, Agent B logs error
    ```

  </Accordion>
</AccordionGroup>

## Kompatibilitas

### Penyedia

Grup siaran saat ini berfungsi dengan:

- ✅ WhatsApp (diimplementasikan)
- 🚧 Telegram (direncanakan)
- 🚧 Discord (direncanakan)
- 🚧 Slack (direncanakan)

### Perutean

Grup siaran bekerja bersama perutean yang ada:

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
**Presedensi:** `broadcast` memiliki prioritas atas binding rute biasa. Binding ACP terkonfigurasi (`bindings[].type="acp"`) bersifat eksklusif: saat ada yang cocok, OpenClaw mengirim ke sesi ACP terkonfigurasi alih-alih siaran fan-out.
</Note>

## Pemecahan masalah

<AccordionGroup>
  <Accordion title="Agents not responding">
    **Periksa:**

    1. ID agen ada di `agents.list`.
    2. Format ID peer benar (mis. `120363403215116621@g.us`).
    3. Agen tidak berada dalam daftar tolak.

    **Debug:**

    ```bash
    tail -f ~/.openclaw/logs/gateway.log | grep broadcast
    ```

  </Accordion>
  <Accordion title="Only one agent responding">
    **Penyebab:** ID peer mungkin berada dalam binding rute biasa tetapi tidak di `broadcast`, atau mungkin cocok dengan binding ACP terkonfigurasi yang eksklusif.

    **Perbaikan:** Tambahkan peer yang terikat rute biasa ke konfigurasi siaran, atau hapus/ubah binding ACP terkonfigurasi jika siaran fan-out diinginkan.

  </Accordion>
  <Accordion title="Performance issues">
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

    - code-formatter: "Memperbaiki indentasi dan menambahkan petunjuk tipe"
    - security-scanner: "⚠️ Kerentanan injeksi SQL pada baris 12"
    - test-coverage: "Cakupan 45%, pengujian untuk kasus kesalahan belum ada"
    - docs-checker: "Docstring untuk fungsi `process_data` belum ada"

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

### Bidang

<ParamField path="strategy" type='"parallel" | "sequential"' default='"parallel"'>
  Cara memproses agen. `parallel` menjalankan semua agen secara bersamaan; `sequential` menjalankannya sesuai urutan array.
</ParamField>
<ParamField path="[peerId]" type="string[]">
  JID grup WhatsApp, nomor E.164, atau ID peer lainnya. Nilainya adalah array ID agen yang harus memproses pesan.
</ParamField>

## Batasan

1. **Agen maksimal:** Tidak ada batas keras, tetapi 10+ agen mungkin lambat.
2. **Konteks bersama:** Agen tidak melihat respons satu sama lain (sesuai desain).
3. **Urutan pesan:** Respons paralel dapat tiba dalam urutan apa pun.
4. **Batas laju:** Semua agen dihitung terhadap batas laju WhatsApp.

## Peningkatan mendatang

Fitur yang direncanakan:

- [ ] Mode konteks bersama (agen melihat respons satu sama lain)
- [ ] Koordinasi agen (agen dapat memberi sinyal satu sama lain)
- [ ] Pemilihan agen dinamis (memilih agen berdasarkan konten pesan)
- [ ] Prioritas agen (beberapa agen merespons sebelum yang lain)

## Terkait

- [Perutean channel](/id/channels/channel-routing)
- [Grup](/id/channels/groups)
- [Alat sandbox multi-agen](/id/tools/multi-agent-sandbox-tools)
- [Pemasangan](/id/channels/pairing)
- [Manajemen sesi](/id/concepts/session)
