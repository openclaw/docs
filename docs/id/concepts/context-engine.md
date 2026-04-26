---
read_when:
    - Anda ingin memahami cara OpenClaw merakit konteks model
    - Anda sedang beralih antara mesin lama dan mesin Plugin
    - Anda sedang membangun Plugin mesin konteks
sidebarTitle: Context engine
summary: 'Mesin konteks: perakitan konteks yang dapat dipasang, Compaction, dan siklus hidup subagent'
title: Mesin konteks
x-i18n:
    generated_at: "2026-04-26T11:26:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6a362f26cde3abca7c15487fa43a411f21e3114491e27a752ca06454add60481
    source_path: concepts/context-engine.md
    workflow: 15
---

Sebuah **mesin konteks** mengontrol bagaimana OpenClaw membangun konteks model untuk setiap run: pesan mana yang disertakan, bagaimana merangkum riwayat lama, dan bagaimana mengelola konteks melintasi batas subagent.

OpenClaw dikirim dengan mesin bawaan `legacy` dan menggunakannya secara default — sebagian besar pengguna tidak perlu mengubah ini. Instal dan pilih mesin Plugin hanya jika Anda menginginkan perilaku perakitan, Compaction, atau recall lintas sesi yang berbeda.

## Mulai cepat

<Steps>
  <Step title="Periksa mesin mana yang aktif">
    ```bash
    openclaw doctor
    # atau periksa config secara langsung:
    cat ~/.openclaw/openclaw.json | jq '.plugins.slots.contextEngine'
    ```
  </Step>
  <Step title="Instal mesin Plugin">
    Plugin mesin konteks diinstal seperti Plugin OpenClaw lainnya.

    <Tabs>
      <Tab title="Dari npm">
        ```bash
        openclaw plugins install @martian-engineering/lossless-claw
        ```
      </Tab>
      <Tab title="Dari path lokal">
        ```bash
        openclaw plugins install -l ./my-context-engine
        ```
      </Tab>
    </Tabs>

  </Step>
  <Step title="Aktifkan dan pilih mesinnya">
    ```json5
    // openclaw.json
    {
      plugins: {
        slots: {
          contextEngine: "lossless-claw", // harus cocok dengan id mesin terdaftar milik Plugin
        },
        entries: {
          "lossless-claw": {
            enabled: true,
            // Config khusus Plugin diletakkan di sini (lihat dokumentasi Plugin)
          },
        },
      },
    }
    ```

    Mulai ulang Gateway setelah menginstal dan mengonfigurasi.

  </Step>
  <Step title="Beralih kembali ke legacy (opsional)">
    Setel `contextEngine` ke `"legacy"` (atau hapus kunci tersebut sepenuhnya — `"legacy"` adalah default).
  </Step>
</Steps>

## Cara kerjanya

Setiap kali OpenClaw menjalankan prompt model, mesin konteks berpartisipasi pada empat titik siklus hidup:

<AccordionGroup>
  <Accordion title="1. Ingest">
    Dipanggil saat pesan baru ditambahkan ke sesi. Mesin dapat menyimpan atau mengindeks pesan di penyimpanan datanya sendiri.
  </Accordion>
  <Accordion title="2. Assemble">
    Dipanggil sebelum setiap run model. Mesin mengembalikan kumpulan pesan berurutan (dan `systemPromptAddition` opsional) yang muat dalam anggaran token.
  </Accordion>
  <Accordion title="3. Compact">
    Dipanggil saat jendela konteks penuh, atau saat pengguna menjalankan `/compact`. Mesin merangkum riwayat lama untuk membebaskan ruang.
  </Accordion>
  <Accordion title="4. After turn">
    Dipanggil setelah run selesai. Mesin dapat menyimpan state, memicu Compaction latar belakang, atau memperbarui indeks.
  </Accordion>
</AccordionGroup>

Untuk harness Codex non-ACP bawaan, OpenClaw menerapkan siklus hidup yang sama dengan memproyeksikan konteks yang dirakit ke instruksi pengembang Codex dan prompt giliran saat ini. Codex tetap memiliki riwayat thread bawaan dan compactor bawaannya sendiri.

### Siklus hidup subagent (opsional)

OpenClaw memanggil dua hook siklus hidup subagent opsional:

<ParamField path="prepareSubagentSpawn" type="method">
  Siapkan state konteks bersama sebelum run child dimulai. Hook menerima kunci sesi parent/child, `contextMode` (`isolated` atau `fork`), id/file transkrip yang tersedia, dan TTL opsional. Jika hook mengembalikan handle rollback, OpenClaw akan memanggilnya saat spawn gagal setelah persiapan berhasil.
</ParamField>
<ParamField path="onSubagentEnded" type="method">
  Bersihkan saat sesi subagent selesai atau dibersihkan.
</ParamField>

### Penambahan prompt sistem

Metode `assemble` dapat mengembalikan string `systemPromptAddition`. OpenClaw menambahkan ini di awal prompt sistem untuk run tersebut. Ini memungkinkan mesin menyuntikkan panduan recall dinamis, instruksi retrieval, atau petunjuk sadar konteks tanpa memerlukan file workspace statis.

## Mesin legacy

Mesin `legacy` bawaan mempertahankan perilaku asli OpenClaw:

- **Ingest**: no-op (manajer sesi menangani persistensi pesan secara langsung).
- **Assemble**: pass-through (pipeline sanitize → validate → limit yang sudah ada di runtime menangani perakitan konteks).
- **Compact**: mendelegasikan ke Compaction peringkasan bawaan, yang membuat satu ringkasan dari pesan lama dan menjaga pesan terbaru tetap utuh.
- **After turn**: no-op.

Mesin legacy tidak mendaftarkan alat atau menyediakan `systemPromptAddition`.

Saat `plugins.slots.contextEngine` tidak disetel (atau disetel ke `"legacy"`), mesin ini digunakan secara otomatis.

## Mesin Plugin

Sebuah Plugin dapat mendaftarkan mesin konteks menggunakan API Plugin:

```ts
import { buildMemorySystemPromptAddition } from "openclaw/plugin-sdk/core";

export default function register(api) {
  api.registerContextEngine("my-engine", () => ({
    info: {
      id: "my-engine",
      name: "My Context Engine",
      ownsCompaction: true,
    },

    async ingest({ sessionId, message, isHeartbeat }) {
      // Simpan pesan di penyimpanan data Anda
      return { ingested: true };
    },

    async assemble({ sessionId, messages, tokenBudget, availableTools, citationsMode }) {
      // Kembalikan pesan yang muat dalam anggaran
      return {
        messages: buildContext(messages, tokenBudget),
        estimatedTokens: countTokens(messages),
        systemPromptAddition: buildMemorySystemPromptAddition({
          availableTools: availableTools ?? new Set(),
          citationsMode,
        }),
      };
    },

    async compact({ sessionId, force }) {
      // Ringkas konteks lama
      return { ok: true, compacted: true };
    },
  }));
}
```

Lalu aktifkan di config:

```json5
{
  plugins: {
    slots: {
      contextEngine: "my-engine",
    },
    entries: {
      "my-engine": {
        enabled: true,
      },
    },
  },
}
```

### Antarmuka ContextEngine

Anggota yang wajib:

| Member             | Kind     | Purpose                                                  |
| ------------------ | -------- | -------------------------------------------------------- |
| `info`             | Property | Id, nama, versi mesin, dan apakah mesin memiliki Compaction sendiri |
| `ingest(params)`   | Method   | Menyimpan satu pesan                                     |
| `assemble(params)` | Method   | Membangun konteks untuk sebuah run model (mengembalikan `AssembleResult`) |
| `compact(params)`  | Method   | Merangkum/mengurangi konteks                             |

`assemble` mengembalikan sebuah `AssembleResult` dengan:

<ParamField path="messages" type="Message[]" required>
  Pesan berurutan yang akan dikirim ke model.
</ParamField>
<ParamField path="estimatedTokens" type="number" required>
  Estimasi mesin atas total token dalam konteks yang dirakit. OpenClaw menggunakan ini untuk keputusan ambang Compaction dan pelaporan diagnostik.
</ParamField>
<ParamField path="systemPromptAddition" type="string">
  Ditambahkan di awal prompt sistem.
</ParamField>

Anggota opsional:

| Member                         | Kind   | Purpose                                                                                                         |
| ------------------------------ | ------ | --------------------------------------------------------------------------------------------------------------- |
| `bootstrap(params)`            | Method | Menginisialisasi state mesin untuk sebuah sesi. Dipanggil sekali saat mesin pertama kali melihat sebuah sesi (misalnya, impor riwayat). |
| `ingestBatch(params)`          | Method | Meng-ingest giliran yang telah selesai sebagai batch. Dipanggil setelah run selesai, dengan semua pesan dari giliran itu sekaligus. |
| `afterTurn(params)`            | Method | Pekerjaan siklus hidup pasca-run (menyimpan state, memicu Compaction latar belakang).                          |
| `prepareSubagentSpawn(params)` | Method | Menyiapkan state bersama untuk sesi child sebelum dimulai.                                                      |
| `onSubagentEnded(params)`      | Method | Membersihkan setelah subagent berakhir.                                                                         |
| `dispose()`                    | Method | Melepaskan resource. Dipanggil saat shutdown Gateway atau reload Plugin — bukan per sesi.                      |

### ownsCompaction

`ownsCompaction` mengontrol apakah auto-Compaction bawaan Pi di dalam-attempt tetap diaktifkan untuk run tersebut:

<AccordionGroup>
  <Accordion title="ownsCompaction: true">
    Mesin memiliki perilaku Compaction. OpenClaw menonaktifkan auto-Compaction bawaan Pi untuk run tersebut, dan implementasi `compact()` milik mesin bertanggung jawab atas `/compact`, overflow recovery Compaction, dan Compaction proaktif apa pun yang ingin dilakukannya di `afterTurn()`. OpenClaw masih dapat menjalankan perlindungan overflow pra-prompt; saat memprediksi transkrip penuh akan overflow, jalur pemulihan akan memanggil `compact()` milik mesin aktif sebelum mengirim prompt lain.
  </Accordion>
  <Accordion title="ownsCompaction: false or unset">
    Auto-Compaction bawaan Pi masih dapat berjalan selama eksekusi prompt, tetapi metode `compact()` milik mesin aktif tetap dipanggil untuk `/compact` dan overflow recovery.
  </Accordion>
</AccordionGroup>

<Warning>
`ownsCompaction: false` **tidak** berarti OpenClaw otomatis fallback ke jalur Compaction milik mesin legacy.
</Warning>

Artinya ada dua pola Plugin yang valid:

<Tabs>
  <Tab title="Mode owning">
    Implementasikan algoritme Compaction Anda sendiri dan setel `ownsCompaction: true`.
  </Tab>
  <Tab title="Mode delegating">
    Setel `ownsCompaction: false` dan biarkan `compact()` memanggil `delegateCompactionToRuntime(...)` dari `openclaw/plugin-sdk/core` untuk menggunakan perilaku Compaction bawaan OpenClaw.
  </Tab>
</Tabs>

`compact()` no-op tidak aman untuk mesin aktif non-owning karena menonaktifkan jalur normal `/compact` dan overflow-recovery Compaction untuk slot mesin tersebut.

## Referensi konfigurasi

```json5
{
  plugins: {
    slots: {
      // Pilih mesin konteks aktif. Default: "legacy".
      // Setel ke id Plugin untuk menggunakan mesin Plugin.
      contextEngine: "legacy",
    },
  },
}
```

<Note>
Slot ini eksklusif saat runtime — hanya satu mesin konteks terdaftar yang di-resolve untuk run atau operasi Compaction tertentu. Plugin `kind: "context-engine"` lain yang diaktifkan tetap dapat dimuat dan menjalankan kode pendaftarannya; `plugins.slots.contextEngine` hanya memilih id mesin terdaftar mana yang di-resolve oleh OpenClaw saat membutuhkan mesin konteks.
</Note>

<Note>
**Pencopotan Plugin:** saat Anda mencopot Plugin yang saat ini dipilih sebagai `plugins.slots.contextEngine`, OpenClaw mereset slot itu kembali ke default (`legacy`). Perilaku reset yang sama juga berlaku untuk `plugins.slots.memory`. Tidak diperlukan edit config manual.
</Note>

## Hubungan dengan Compaction dan memori

<AccordionGroup>
  <Accordion title="Compaction">
    Compaction adalah salah satu tanggung jawab mesin konteks. Mesin legacy mendelegasikan ke peringkasan bawaan OpenClaw. Mesin Plugin dapat mengimplementasikan strategi Compaction apa pun (ringkasan DAG, retrieval vektor, dll.).
  </Accordion>
  <Accordion title="Plugin memori">
    Plugin memori (`plugins.slots.memory`) terpisah dari mesin konteks. Plugin memori menyediakan pencarian/retrieval; mesin konteks mengontrol apa yang dilihat model. Keduanya dapat bekerja bersama — mesin konteks dapat menggunakan data Plugin memori selama perakitan. Mesin Plugin yang menginginkan jalur prompt Active Memory sebaiknya memilih `buildMemorySystemPromptAddition(...)` dari `openclaw/plugin-sdk/core`, yang mengubah bagian prompt memori aktif menjadi `systemPromptAddition` siap-tempel di awal. Jika mesin memerlukan kontrol tingkat lebih rendah, mesin tetap dapat mengambil baris mentah dari `openclaw/plugin-sdk/memory-host-core` melalui `buildActiveMemoryPromptSection(...)`.
  </Accordion>
  <Accordion title="Pemangkasan sesi">
    Pemangkasan hasil tool lama di memori tetap berjalan terlepas dari mesin konteks mana yang aktif.
  </Accordion>
</AccordionGroup>

## Tips

- Gunakan `openclaw doctor` untuk memverifikasi bahwa mesin Anda dimuat dengan benar.
- Jika beralih mesin, sesi yang ada tetap berlanjut dengan riwayatnya saat ini. Mesin baru mengambil alih untuk run berikutnya.
- Error mesin dicatat di log dan ditampilkan dalam diagnostik. Jika mesin Plugin gagal didaftarkan atau id mesin yang dipilih tidak dapat di-resolve, OpenClaw tidak melakukan fallback secara otomatis; run akan gagal sampai Anda memperbaiki Plugin tersebut atau mengembalikan `plugins.slots.contextEngine` ke `"legacy"`.
- Untuk pengembangan, gunakan `openclaw plugins install -l ./my-engine` untuk menautkan direktori Plugin lokal tanpa menyalinnya.

## Terkait

- [Compaction](/id/concepts/compaction) — merangkum percakapan panjang
- [Konteks](/id/concepts/context) — bagaimana konteks dibangun untuk giliran agent
- [Arsitektur Plugin](/id/plugins/architecture) — mendaftarkan Plugin mesin konteks
- [Manifest Plugin](/id/plugins/manifest) — field manifest Plugin
- [Plugin](/id/tools/plugin) — ikhtisar Plugin
