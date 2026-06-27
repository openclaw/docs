---
read_when:
    - Anda melihat kunci konfigurasi `.experimental` dan ingin mengetahui apakah kunci itu stabil
    - Anda ingin mencoba fitur runtime pratinjau tanpa mencampuradukkannya dengan default normal
    - Anda ingin satu tempat untuk menemukan flag eksperimental yang saat ini terdokumentasi
summary: Arti flag eksperimental di OpenClaw dan mana saja yang saat ini didokumentasikan
title: Fitur eksperimental
x-i18n:
    generated_at: "2026-06-27T17:23:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a0f42e6b574c5db9508412c9c5d9919d1a54a16fe00edea43664f3a01e8e38f5
    source_path: concepts/experimental-features.md
    workflow: 16
---

Fitur eksperimental di OpenClaw adalah **permukaan pratinjau yang harus diaktifkan secara eksplisit**. Fitur ini
berada di balik flag eksplisit karena masih membutuhkan uji pemakaian nyata sebelum
layak menjadi default stabil atau kontrak publik berumur panjang.

Perlakukan fitur ini berbeda dari config normal:

- Biarkan **nonaktif secara default** kecuali doc terkait meminta Anda mencobanya.
- Perkirakan **bentuk dan perilaku berubah** lebih cepat daripada config stabil.
- Utamakan jalur stabil terlebih dahulu saat jalur itu sudah ada.
- Jika Anda menerapkan OpenClaw secara luas, uji flag eksperimental di lingkungan yang lebih kecil
  sebelum memasukkannya ke baseline bersama.

## Flag yang saat ini terdokumentasi

| Permukaan                | Kunci                                                                                      | Gunakan saat                                                                                                                      | Selengkapnya                                                                                  |
| ------------------------ | ------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Runtime model lokal      | `agents.defaults.experimental.localModelLean`, `agents.list[].experimental.localModelLean` | Backend lokal yang lebih kecil atau lebih ketat tersendat oleh permukaan alat default lengkap OpenClaw                           | [Model Lokal](/id/gateway/local-models)                                                          |
| Pencarian memori         | `agents.defaults.memorySearch.experimental.sessionMemory`                                  | Anda ingin `memory_search` mengindeks transkrip sesi sebelumnya dan menerima biaya penyimpanan/pengindeksan tambahan             | [Referensi konfigurasi memori](/id/reference/memory-config#session-memory-search-experimental)   |
| Harness Codex            | `plugins.entries.codex.config.appServer.experimental.sandboxExecServer`                    | Anda ingin app-server Codex native 0.132.0 atau lebih baru menargetkan exec-server berbasis sandbox OpenClaw alih-alih menonaktifkan Code Mode | [Referensi harness Codex](/id/plugins/codex-harness-reference#sandboxed-native-execution)        |
| Alat perencanaan terstruktur | `tools.experimental.planTool`                                                          | Anda ingin alat `update_plan` terstruktur diekspos untuk pelacakan kerja multi-langkah di runtime dan UI yang kompatibel         | [Referensi konfigurasi Gateway](/id/gateway/config-tools#toolsexperimental)                      |

## Mode ramping model lokal

`agents.defaults.experimental.localModelLean: true` adalah katup pelepas tekanan untuk setup model lokal yang lebih lemah. Saat aktif, OpenClaw menghapus tiga alat default — `browser`, `cron`, dan `message` — dari permukaan alat agent pada setiap giliran. Ini juga menjadikan run tersebut default ke kontrol Pencarian Alat terstruktur saat `tools.toolSearch` tidak dikonfigurasi secara eksplisit, sehingga katalog alat plugin, MCP, atau klien yang lebih besar tetap berada di balik `tool_search`, `tool_describe`, dan `tool_call` alih-alih ditumpahkan ke prompt. Run yang memerlukan pengiriman `message` langsung tetap mempertahankan alat itu secara langsung alih-alih mengaktifkan default Pencarian Alat mode ramping. Gunakan `agents.list[].experimental.localModelLean` untuk mengaktifkan atau menonaktifkan perilaku yang sama untuk satu agent yang dikonfigurasi.

### Mengapa tiga alat ini

Tiga alat ini memiliki deskripsi terbesar dan bentuk parameter terbanyak dalam runtime default OpenClaw. Pada backend kompatibel OpenAI dengan konteks kecil atau lebih ketat, itulah perbedaan antara:

- Skema alat muat dengan rapi dalam prompt vs. mendesak riwayat percakapan.
- Model memilih alat yang tepat vs. menghasilkan panggilan alat yang salah bentuk karena terlalu banyak skema yang tampak mirip.
- Adapter Chat Completions tetap berada dalam batas output terstruktur server vs. memicu 400 karena ukuran payload panggilan alat.

Menghapusnya tidak diam-diam mengubah ulang kabel OpenClaw — ini hanya membuat daftar alat langsung lebih pendek. Model masih memiliki `read`, `write`, `edit`, `exec`, `apply_patch`, pencarian/pengambilan web (saat dikonfigurasi), memori, serta alat sesi/agent yang tersedia. Katalog tambahan tetap dapat dipanggil melalui Pencarian Alat kecuali Anda secara eksplisit menetapkan `tools.toolSearch: false`.

### Kapan mengaktifkannya

Aktifkan mode ramping saat Anda sudah membuktikan bahwa model dapat berbicara ke Gateway tetapi giliran agent lengkap bermasalah. Rantai sinyal tipikalnya adalah:

1. `openclaw infer model run --gateway --model <ref> --prompt "Reply with exactly: pong"` berhasil.
2. Giliran agent normal gagal dengan panggilan alat yang salah bentuk, prompt yang terlalu besar, atau model mengabaikan alatnya.
3. Mengaktifkan `localModelLean: true` mengatasi kegagalan tersebut.

### Kapan membiarkannya nonaktif

Jika backend Anda menangani runtime default lengkap dengan bersih, biarkan ini nonaktif. Mode ramping adalah workaround, bukan default. Fitur ini ada karena beberapa stack lokal memerlukan permukaan alat yang lebih kecil agar berperilaku baik; model hosted dan rig lokal dengan sumber daya memadai tidak memerlukannya.

Mode ramping juga tidak menggantikan `tools.profile`, `tools.allow`/`tools.deny`, atau pintu keluar darurat model `compat.supportsTools: false`. Jika Anda membutuhkan permukaan alat yang lebih sempit secara permanen untuk agent tertentu, utamakan knob stabil tersebut daripada flag eksperimental.

Jika Anda sudah menyesuaikan Pencarian Alat secara global, OpenClaw membiarkan config operator tersebut apa adanya. Tetapkan `tools.toolSearch: false` untuk keluar dari default Pencarian Alat mode ramping.

### Aktifkan

```json5
{
  agents: {
    defaults: {
      experimental: {
        localModelLean: true,
      },
    },
  },
}
```

Untuk satu agent saja:

```json5
{
  agents: {
    list: [
      {
        id: "local",
        model: "lmstudio/gemma-4-e4b-it",
        experimental: {
          localModelLean: true,
        },
      },
    ],
  },
}
```

Mulai ulang Gateway setelah mengubah flag, lalu konfirmasi daftar alat yang dipangkas dengan:

```bash
openclaw status --deep
```

Output status mendalam mencantumkan alat agent yang aktif; `browser`, `cron`, dan `message` seharusnya tidak ada saat mode ramping aktif kecuali mode pengiriman saat ini memaksa balasan `message` langsung.

## Eksperimental bukan berarti tersembunyi

Jika sebuah fitur bersifat eksperimental, OpenClaw harus mengatakannya dengan jelas di docs dan di
jalur config itu sendiri. Yang **tidak** boleh dilakukan adalah menyelundupkan perilaku pratinjau ke dalam
knob default yang tampak stabil dan berpura-pura itu normal. Begitulah permukaan config
menjadi berantakan.

## Terkait

- [Fitur](/id/concepts/features)
- [Kanal rilis](/id/install/development-channels)
