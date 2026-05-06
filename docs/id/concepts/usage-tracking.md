---
read_when:
    - Anda sedang menghubungkan antarmuka penggunaan/kuota penyedia
    - Anda perlu menjelaskan perilaku pelacakan penggunaan atau persyaratan autentikasi
summary: Area pelacakan penggunaan dan persyaratan kredensial
title: Pelacakan penggunaan
x-i18n:
    generated_at: "2026-05-06T09:10:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: 14210813bf3c078a1323b1560a1a3da586f55880e05a9b310e1b6a2d5490f956
    source_path: concepts/usage-tracking.md
    workflow: 16
---

## Apa Ini

- Mengambil penggunaan/kuota penyedia langsung dari endpoint penggunaan mereka.
- Tidak ada estimasi biaya; hanya jendela yang dilaporkan penyedia.
- Output status yang mudah dibaca manusia dinormalisasi menjadi `X% left`, bahkan ketika
  API upstream melaporkan kuota terpakai, kuota tersisa, atau hanya hitungan mentah.
- `/status` tingkat sesi dan `session_status` dapat beralih ke entri penggunaan
  transkrip terbaru ketika snapshot sesi live minim. Fallback tersebut mengisi penghitung token/cache yang hilang, dapat memulihkan label model runtime aktif, dan memilih total yang berorientasi prompt yang lebih besar ketika metadata sesi hilang atau lebih kecil. Nilai live bukan nol yang sudah ada tetap diutamakan.

## Tempat Ditampilkan

- `/status` di chat: kartu status kaya emoji dengan token sesi + estimasi biaya (hanya API key). Penggunaan penyedia ditampilkan untuk **penyedia model saat ini** jika tersedia sebagai jendela `X% left` yang dinormalisasi.
- `/usage off|tokens|full` di chat: footer penggunaan per respons (OAuth hanya menampilkan token).
- `/usage cost` di chat: ringkasan biaya lokal yang diagregasikan dari log sesi OpenClaw.
- CLI: `openclaw status --usage` mencetak perincian lengkap per penyedia.
- CLI: `openclaw channels list` mencetak snapshot penggunaan yang sama bersama konfigurasi penyedia (gunakan `--no-usage` untuk melewati).
- Bilah menu macOS: bagian "Penggunaan" di bawah Konteks (hanya jika tersedia).

## Penyedia + kredensial

- **Anthropic (Claude)**: token OAuth dalam profil autentikasi.
- **GitHub Copilot**: token OAuth dalam profil autentikasi.
- **Gemini CLI**: token OAuth dalam profil autentikasi.
  - Penggunaan JSON beralih ke `stats`; `stats.cached` dinormalisasi menjadi
    `cacheRead`.
- **OpenAI Codex**: token OAuth dalam profil autentikasi (`accountId` digunakan jika ada).
- **MiniMax**: API key atau profil autentikasi OAuth MiniMax. OpenClaw memperlakukan
  `minimax`, `minimax-cn`, dan `minimax-portal` sebagai permukaan kuota MiniMax yang sama, memprioritaskan OAuth MiniMax tersimpan jika ada, dan jika tidak beralih
  ke `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`, atau `MINIMAX_API_KEY`.
  Polling penggunaan mendapatkan host Coding Plan dari `models.providers.minimax-portal.baseUrl`
  atau `models.providers.minimax.baseUrl` jika dikonfigurasi, dan jika tidak menggunakan
  host MiniMax CN.
  Kolom mentah MiniMax `usage_percent` / `usagePercent` berarti kuota **tersisa**,
  sehingga OpenClaw membaliknya sebelum ditampilkan; kolom berbasis hitungan diutamakan jika ada.
  - Label jendela coding-plan berasal dari kolom jam/menit penyedia jika ada,
    lalu beralih ke rentang `start_time` / `end_time`.
  - Jika endpoint coding-plan mengembalikan `model_remains`, OpenClaw memprioritaskan
    entri model chat, mendapatkan label jendela dari timestamp ketika kolom eksplisit
    `window_hours` / `window_minutes` tidak ada, dan menyertakan nama model
    dalam label paket.
- **Xiaomi MiMo**: API key melalui env/config/auth store (`XIAOMI_API_KEY`).
- **z.ai**: API key melalui env/config/auth store.

Penggunaan disembunyikan ketika auth penggunaan penyedia yang dapat digunakan tidak dapat diselesaikan. Penyedia
dapat menyediakan logika auth penggunaan khusus plugin; jika tidak, OpenClaw beralih ke
kredensial OAuth/API-key yang cocok dari profil autentikasi, variabel lingkungan,
atau konfigurasi.

## Terkait

- [Penggunaan token dan biaya](/id/reference/token-use)
- [Penggunaan API dan biaya](/id/reference/api-usage-costs)
- [Caching prompt](/id/reference/prompt-caching)
