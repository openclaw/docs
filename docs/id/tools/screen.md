---
read_when:
    - Anda ingin agen membagi, memfokuskan, menutup, atau menavigasi panel UI Kontrol
    - Anda ingin agen menampilkan atau menyembunyikan panel bilah samping, terminal, atau peramban
    - Anda memerlukan kapabilitas ui.command dan kontrak fan-out
sidebarTitle: Screen
summary: Biarkan agen mengatur Control UI yang terhubung
title: Layar
x-i18n:
    generated_at: "2026-07-19T05:23:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: df2215db96af29fa6b0db8abad79a0a2787a194dab6d00f9ef32f45521907ae1
    source_path: tools/screen.md
    workflow: 16
---

Alat `screen` memungkinkan agen mengatur Control UI berbasis peramban. Alat ini merupakan
permukaan tata letak dan navigasi bertipe, bukan alat pengambilan tangkapan layar atau
otomatisasi peramban.

Alat ini hanya tersedia ketika klien asal mengiklankan kapabilitas
`ui-commands`. Setidaknya satu Control UI yang mendukung harus tetap
terhubung saat alat dijalankan; jika tidak, Gateway akan mengembalikan `UNAVAILABLE`.

## Tindakan

| Tindakan                          | Efek                                           | Masukan opsional                                      |
| --------------------------------- | ---------------------------------------------- | ----------------------------------------------------- |
| `split_right`                | Membagi panel sesi target ke kanan             | `sessionKey` (secara default menggunakan sesi saat ini) |
| `split_down`                | Membagi panel sesi target ke bawah             | `sessionKey` (secara default menggunakan sesi saat ini) |
| `close_pane`                | Menutup panel sesi target                      | `sessionKey` (secara default menggunakan sesi saat ini) |
| `focus`                | Memfokuskan panel sesi target                  | `sessionKey` (secara default menggunakan sesi saat ini) |
| `navigate`                | Membuka sesi target                            | `sessionKey` (secara default menggunakan sesi saat ini) |
| `sidebar_show` / `sidebar_hide` | Menampilkan atau menyembunyikan bilah sisi utama | -                                                |
| `terminal_show` / `terminal_hide` | Menampilkan atau menyembunyikan panel terminal operator | `dock` (`bottom` atau `right`) saat ditampilkan |
| `browser_show` / `browser_hide` | Menampilkan atau menyembunyikan panel peramban | `dock` (`bottom` atau `right`) saat ditampilkan |

Perintah yang berhasil akan mengembalikan `{ "ok": true }` setelah Gateway menyiarkan
peristiwa bertipe `ui.command`.

## Perutean dan keamanan

Protokol v1 secara sengaja mengirimkan perintah ke setiap Control UI terhubung yang
mengiklankan `ui-commands`; perintah tersebut tidak menargetkan satu tab peramban. Hal ini penting ketika
operator yang sama membuka beberapa dasbor.

RPC Gateway memerlukan `operator.write`. Alat ini hanya dapat mengubah status
tampilan: alat ini tidak dapat membaca piksel, mengambil tangkapan layar, mengeklik konten
halaman secara arbitrer, atau melewati izin panel sesi dan operator yang
dipilih.

## Terkait

- [Control UI](/id/web/control-ui)
- [Protokol Gateway](/id/gateway/protocol#method-families)
- [Alat peramban](/id/tools/browser)
