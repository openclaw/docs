---
read_when:
    - Anda sedang menghubungkan permukaan penggunaan/kuota penyedia
    - Anda perlu menjelaskan perilaku pelacakan penggunaan atau persyaratan autentikasi
summary: Permukaan pelacakan penggunaan dan persyaratan kredensial
title: Pelacakan penggunaan
x-i18n:
    generated_at: "2026-05-02T09:19:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4faa5daff55668a6be73981b730edece51939d99954e784907c99fb101fcaaa7
    source_path: concepts/usage-tracking.md
    workflow: 16
---

## Apa ini

- Mengambil penggunaan/kuota penyedia langsung dari endpoint penggunaan mereka.
- Tidak ada estimasi biaya; hanya jendela yang dilaporkan penyedia.
- Output status yang mudah dibaca manusia dinormalisasi menjadi `X% left`, bahkan ketika API upstream melaporkan kuota yang dikonsumsi, kuota tersisa, atau hanya hitungan mentah.
- `/status` tingkat sesi dan `session_status` dapat beralih ke entri penggunaan transkrip terbaru ketika snapshot sesi langsung minim. Fallback tersebut mengisi penghitung token/cache yang hilang, dapat memulihkan label model runtime aktif, dan memilih total berorientasi prompt yang lebih besar ketika metadata sesi hilang atau lebih kecil. Nilai langsung bukan nol yang sudah ada tetap diutamakan.

## Di mana ini muncul

- `/status` di chat: kartu status kaya emoji dengan token sesi + estimasi biaya (hanya kunci API). Penggunaan penyedia ditampilkan untuk **penyedia model saat ini** jika tersedia sebagai jendela `X% left` yang dinormalisasi.
- `/usage off|tokens|full` di chat: footer penggunaan per respons (OAuth hanya menampilkan token).
- `/usage cost` di chat: ringkasan biaya lokal yang diagregasi dari log sesi OpenClaw.
- CLI: `openclaw status --usage` mencetak rincian lengkap per penyedia.
- CLI: `openclaw channels list` mencetak snapshot penggunaan yang sama bersama konfigurasi penyedia (gunakan `--no-usage` untuk melewati).
- Bilah menu macOS: bagian “Penggunaan” di bawah Konteks (hanya jika tersedia).

## Penyedia + kredensial

- **Anthropic (Claude)**: token OAuth dalam profil autentikasi.
- **GitHub Copilot**: token OAuth dalam profil autentikasi.
- **Gemini CLI**: token OAuth dalam profil autentikasi.
  - Penggunaan JSON beralih ke `stats`; `stats.cached` dinormalisasi menjadi `cacheRead`.
- **OpenAI Codex**: token OAuth dalam profil autentikasi (`accountId` digunakan jika ada).
- **MiniMax**: kunci API atau profil autentikasi OAuth MiniMax. OpenClaw memperlakukan `minimax`, `minimax-cn`, dan `minimax-portal` sebagai permukaan kuota MiniMax yang sama, mengutamakan OAuth MiniMax tersimpan jika ada, dan jika tidak beralih ke `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`, atau `MINIMAX_API_KEY`.
  Polling penggunaan menurunkan host Coding Plan dari `models.providers.minimax-portal.baseUrl` atau `models.providers.minimax.baseUrl` jika dikonfigurasi, dan jika tidak menggunakan host MiniMax CN.
  Kolom mentah `usage_percent` / `usagePercent` MiniMax berarti kuota **tersisa**, sehingga OpenClaw membaliknya sebelum ditampilkan; kolom berbasis hitungan diutamakan jika ada.
  - Label jendela coding-plan berasal dari kolom jam/menit penyedia jika ada, lalu beralih ke rentang `start_time` / `end_time`.
  - Jika endpoint coding-plan mengembalikan `model_remains`, OpenClaw mengutamakan entri model chat, menurunkan label jendela dari timestamp ketika kolom eksplisit `window_hours` / `window_minutes` tidak ada, dan menyertakan nama model dalam label paket.
- **Xiaomi MiMo**: kunci API melalui env/konfig/penyimpanan autentikasi (`XIAOMI_API_KEY`).
- **z.ai**: kunci API melalui env/konfig/penyimpanan autentikasi.

Penggunaan disembunyikan ketika tidak ada autentikasi penggunaan penyedia yang dapat digunakan. Penyedia dapat menyediakan logika autentikasi penggunaan khusus Plugin; jika tidak, OpenClaw beralih ke pencocokan kredensial OAuth/kunci API dari profil autentikasi, variabel lingkungan, atau konfigurasi.

## Terkait

- [Penggunaan token dan biaya](/id/reference/token-use)
- [Penggunaan dan biaya API](/id/reference/api-usage-costs)
- [Caching prompt](/id/reference/prompt-caching)
