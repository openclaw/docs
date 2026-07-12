---
read_when:
    - Mengonfigurasi grup siaran
    - Men-debug balasan multiagen di WhatsApp
sidebarTitle: Broadcast groups
status: experimental
summary: Siarkan pesan WhatsApp ke beberapa agen
title: Grup siaran
x-i18n:
    generated_at: "2026-07-12T13:58:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2771c15b31592f11293385498b9c89decf84747a9172caafb994a5dca4bbdc06
    source_path: channels/broadcast-groups.md
    workflow: 16
---

<Note>
**Status:** Eksperimental. Ditambahkan pada 2026.1.9. Hanya WhatsApp (kanal web).
</Note>

## Ikhtisar

Grup siaran menjalankan **beberapa agen** pada pesan masuk yang sama. Setiap agen memproses pesan dalam sesinya sendiri yang terisolasi dan mengirimkan balasannya sendiri, sehingga satu nomor WhatsApp dapat menampung tim agen khusus dalam satu obrolan grup atau DM.

Grup siaran dievaluasi setelah daftar izin kanal dan aturan aktivasi grup. Dalam grup WhatsApp, siaran terjadi ketika OpenClaw biasanya akan membalas (misalnya: saat disebut, bergantung pada pengaturan grup Anda). Grup siaran hanya mengubah **agen mana yang dijalankan**, bukan menentukan apakah pesan memenuhi syarat untuk diproses.

Jalur QA WhatsApp langsung mencakup `whatsapp-broadcast-group-fanout`, yang memverifikasi bahwa satu pesan grup yang menyebut akun dapat menghasilkan balasan terlihat yang berbeda dari dua agen yang dikonfigurasi.

## Konfigurasi

### Penyiapan dasar

Tambahkan bagian `broadcast` pada tingkat teratas (di sebelah `bindings`). Kuncinya adalah ID rekan WhatsApp dan nilainya adalah larik ID agen:

- obrolan grup: JID grup (misalnya `120363403215116621@g.us`)
- DM: nomor telepon pengirim dalam format E.164 (misalnya `+15551234567`)

```json
{
  "broadcast": {
    "120363403215116621@g.us": ["alfred", "baerbel", "assistant3"]
  }
}
```

**Hasil:** ketika OpenClaw biasanya akan membalas dalam obrolan ini, OpenClaw menjalankan ketiga agen tersebut.

Setiap ID agen yang dicantumkan harus ada di `agents.list`: validasi konfigurasi melaporkan ID yang tidak dikenal, dan runtime melewatinya dengan peringatan `Broadcast agent <id> not found in agents.list; skipping`.

### Strategi pemrosesan

`broadcast.strategy` menentukan cara agen memproses pesan:

| Strategi             | Perilaku                                                                        |
| -------------------- | ------------------------------------------------------------------------------- |
| `parallel` (bawaan)  | Semua agen memproses secara bersamaan; balasan dapat tiba dalam urutan apa pun. |
| `sequential`         | Agen memproses sesuai urutan larik; masing-masing menunggu agen sebelumnya selesai. |

```json
{
  "broadcast": {
    "strategy": "sequential",
    "120363403215116621@g.us": ["alfred", "baerbel"]
  }
}
```

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
  <Step title="Perutean dan penerimaan">
    OpenClaw menerapkan daftar izin kanal, aturan aktivasi grup, dan kepemilikan pengikatan ACP yang dikonfigurasi.
  </Step>
  <Step title="Pemeriksaan siaran">
    Jika tidak ada pengikatan ACP terkonfigurasi yang memiliki rute tersebut, OpenClaw memeriksa apakah ID rekan ada di `broadcast`.
  </Step>
  <Step title="Jika siaran berlaku">
    - Semua agen yang dicantumkan memproses pesan.
    - Setiap agen memiliki kunci sesi dan konteks terisolasinya sendiri.
    - Agen memproses secara paralel (bawaan) atau berurutan.
    - Lampiran audio ditranskripsikan sekali sebelum disebarkan, sehingga agen berbagi satu transkrip alih-alih melakukan panggilan STT secara terpisah.

  </Step>
  <Step title="Jika siaran tidak berlaku">
    OpenClaw mengirimkan pesan melalui rute biasa atau rute sesi ACP terkonfigurasi yang dipilih selama perutean.
  </Step>
</Steps>

<Note>
Grup siaran tidak melewati daftar izin kanal atau aturan aktivasi grup (penyebutan/perintah/dll.). Grup siaran hanya mengubah _agen mana yang dijalankan_ ketika suatu pesan memenuhi syarat untuk diproses.
</Note>

### Isolasi sesi

Setiap agen dalam grup siaran memiliki komponen berikut yang sepenuhnya terpisah:

- **Kunci sesi** (`agent:alfred:whatsapp:group:120363...` dibandingkan dengan `agent:baerbel:whatsapp:group:120363...`)
- **Riwayat percakapan** (agen tidak melihat balasan agen lain)
- **Ruang kerja** (sandbox terpisah jika dikonfigurasi)
- **Akses alat** (daftar izin/tolak yang berbeda)
- **Memori/konteks** (`IDENTITY.md`, `SOUL.md`, dan sebagainya yang terpisah)

Ada satu pengecualian yang sengaja dibagikan: **buffer konteks grup** (pesan grup terbaru yang digunakan sebagai konteks) dibagikan per rekan, sehingga semua agen siaran melihat konteks yang sama saat dipicu. Buffer ini dikosongkan satu kali setelah penyebaran selesai.

Hal ini memungkinkan setiap agen memiliki kepribadian, model, Skills, dan akses alat yang berbeda (misalnya hanya baca dibandingkan baca-tulis).

### Contoh: sesi terisolasi

Dalam grup `120363403215116621@g.us` dengan agen `["alfred", "baerbel"]`:

<Tabs>
  <Tab title="Konteks Alfred">
    ```text
    Session: agent:alfred:whatsapp:group:120363403215116621@g.us
    History: [user message, alfred's previous responses]
    Workspace: ~/openclaw-alfred/
    Tools: read, write, exec
    ```
  </Tab>
  <Tab title="Konteks Baerbel">
    ```text
    Session: agent:baerbel:whatsapp:group:120363403215116621@g.us
    History: [user message, baerbel's previous responses]
    Workspace: ~/openclaw-baerbel/
    Tools: read only
    ```
  </Tab>
</Tabs>

## Kasus penggunaan

- **Tim agen khusus**: grup pengembangan tempat `code-reviewer`, `security-auditor`, `test-generator`, dan `docs-checker` masing-masing menjawab pesan yang sama dari sudut pandangnya sendiri.
- **Dukungan multibahasa**: satu obrolan dukungan dengan `support-en`, `support-de`, dan `support-es` yang merespons dalam bahasa masing-masing.
- **Jaminan kualitas**: `support-agent` menjawab sementara `qa-agent` meninjau dan hanya merespons ketika menemukan masalah.
- **Otomatisasi tugas**: `task-tracker`, `time-logger`, dan `report-generator` semuanya menggunakan pembaruan status yang sama.

## Praktik terbaik

<AccordionGroup>
  <Accordion title="1. Jaga agar agen tetap terfokus">
    Berikan satu tanggung jawab yang jelas kepada setiap agen (`formatter`, `linter`, `tester`), bukan satu agen "dev-helper" generik.
  </Accordion>
  <Accordion title="2. Gunakan ID dan nama yang deskriptif">
    ```json
    {
      "agents": {
        "list": [
          { "id": "security-scanner", "name": "Security Scanner" },
          { "id": "code-formatter", "name": "Code Formatter" },
          { "id": "test-generator", "name": "Test Generator" }
        ]
      }
    }
    ```
  </Accordion>
  <Accordion title="3. Konfigurasikan akses alat yang berbeda">
    ```json
    {
      "agents": {
        "list": [
          { "id": "reviewer", "tools": { "allow": ["read", "exec"] } },
          { "id": "fixer", "tools": { "allow": ["read", "write", "edit", "exec"] } }
        ]
      }
    }
    ```

    `reviewer` hanya memiliki akses baca. `fixer` dapat membaca dan menulis.

  </Accordion>
  <Accordion title="4. Pantau kinerja">
    Jika menggunakan banyak agen, utamakan `"strategy": "parallel"` (bawaan), batasi grup siaran hanya pada beberapa agen, dan gunakan model yang lebih cepat untuk agen yang lebih sederhana.
  </Accordion>
  <Accordion title="5. Kegagalan tetap terisolasi">
    Agen gagal secara independen. Kesalahan satu agen dicatat (`Broadcast agent <id> failed: ...`) dan tidak memblokir agen lainnya.
  </Accordion>
</AccordionGroup>

## Kompatibilitas

### Penyedia

Grup siaran saat ini hanya diterapkan untuk WhatsApp (kanal web). Kanal lain mengabaikan konfigurasi `broadcast`.

### Perutean

Grup siaran berfungsi bersama perutean yang sudah ada:

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

- `GROUP_A`: hanya alfred yang merespons (perutean normal).
- `GROUP_B`: agent1 DAN agent2 merespons (siaran).

<Note>
**Prioritas:** `broadcast` memiliki prioritas atas pengikatan rute biasa. Pengikatan ACP yang dikonfigurasi (`bindings[].type="acp"`) bersifat eksklusif: ketika salah satunya cocok, OpenClaw mengirimkan pesan ke sesi ACP yang dikonfigurasi alih-alih melakukan penyebaran siaran.
</Note>

## Pemecahan masalah

<AccordionGroup>
  <Accordion title="Agen tidak merespons">
    **Periksa:**

    1. ID agen ada di `agents.list` (validasi konfigurasi menolak ID yang tidak dikenal).
    2. Format ID rekan sudah benar (JID grup seperti `120363403215116621@g.us`, atau E.164 seperti `+15551234567` untuk DM).
    3. Pesan lolos pembatasan normal (aturan penyebutan/aktivasi tetap berlaku).

    **Awakutu:**

    ```bash
    openclaw logs --follow | grep -i broadcast
    ```

    Penyebaran yang berhasil mencatat `Broadcasting message to <n> agents (<strategy>)`.

  </Accordion>
  <Accordion title="Hanya satu agen yang merespons">
    **Penyebab:** ID rekan mungkin ada dalam pengikatan rute biasa, tetapi tidak ada di `broadcast`, atau mungkin cocok dengan pengikatan ACP eksklusif yang dikonfigurasi.

    **Perbaikan:** tambahkan rekan yang terikat ke rute biasa ke konfigurasi siaran, atau hapus/ubah pengikatan ACP yang dikonfigurasi jika penyebaran siaran diinginkan.

  </Accordion>
  <Accordion title="Masalah kinerja">
    Jika lambat saat menggunakan banyak agen: kurangi jumlah agen per grup, gunakan model yang lebih ringan, dan periksa waktu mulai sandbox.
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

    Satu cuplikan kode dalam grup menghasilkan empat balasan: perbaikan pemformatan, temuan keamanan, kekurangan cakupan, dan catatan kecil dokumentasi.

  </Accordion>
  <Accordion title="Contoh 2: Alur multibahasa">
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
  Cara memproses agen. `parallel` menjalankan semua agen secara bersamaan; `sequential` menjalankannya sesuai urutan larik.
</ParamField>
<ParamField path="[peerId]" type="string[]">
  JID grup WhatsApp atau nomor telepon E.164. Nilainya adalah larik ID agen yang semuanya harus memproses pesan dari rekan tersebut.
</ParamField>

## Keterbatasan

1. **Jumlah maksimum agen:** tidak ada batas tegas, tetapi banyak agen (10+) dapat berjalan lambat.
2. **Konteks bersama:** agen tidak melihat respons satu sama lain (sesuai rancangan).
3. **Urutan pesan:** respons paralel dapat tiba dalam urutan apa pun.
4. **Batas laju:** semua balasan berasal dari satu akun WhatsApp, sehingga balasan setiap agen dihitung terhadap batas laju WhatsApp yang sama.

## Terkait

- [Perutean channel](/id/channels/channel-routing)
- [Grup](/id/channels/groups)
- [Alat sandbox multiagen](/id/tools/multi-agent-sandbox-tools)
- [Pemasangan](/id/channels/pairing)
- [Manajemen sesi](/id/concepts/session)
