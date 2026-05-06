---
read_when:
    - Perencanaan modernisasi aplikasi OpenClaw secara menyeluruh
    - Memperbarui standar implementasi frontend untuk pekerjaan aplikasi atau Control UI
    - Mengubah tinjauan kualitas produk yang luas menjadi pekerjaan rekayasa bertahap
summary: Rencana modernisasi aplikasi komprehensif dengan pembaruan keterampilan penyampaian antarmuka depan
title: Rencana modernisasi aplikasi
x-i18n:
    generated_at: "2026-05-06T09:26:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8c97bd9c76492b9e7beb0a2623f583a54b5461bebb848fa3ac7e4495322f6456
    source_path: reference/application-modernization-plan.md
    workflow: 16
---

## Tujuan

Arahkan aplikasi menuju produk yang lebih bersih, lebih cepat, dan lebih mudah dipelihara tanpa
merusak alur kerja saat ini atau menyembunyikan risiko dalam refaktor luas. Pekerjaan harus
masuk sebagai irisan kecil yang dapat ditinjau dengan bukti untuk setiap permukaan yang disentuh.

## Prinsip

- Pertahankan arsitektur saat ini kecuali sebuah batas terbukti menyebabkan churn,
  biaya performa, atau bug yang terlihat pengguna.
- Utamakan patch terkecil yang benar untuk setiap masalah, lalu ulangi.
- Pisahkan perbaikan wajib dari pemolesan opsional agar maintainer dapat memasukkan pekerjaan
  bernilai tinggi tanpa menunggu keputusan subjektif.
- Jaga perilaku yang menghadap Plugin tetap terdokumentasi dan kompatibel ke belakang.
- Verifikasi perilaku yang sudah dirilis, kontrak dependensi, dan pengujian sebelum mengklaim
  sebuah regresi sudah diperbaiki.
- Perbaiki jalur pengguna utama terlebih dahulu: penyiapan awal, autentikasi, chat, penyiapan penyedia,
  pengelolaan Plugin, dan diagnostik.

## Fase 1: Audit baseline

Inventarisasi aplikasi saat ini sebelum mengubahnya.

- Identifikasi alur kerja pengguna teratas dan permukaan kode yang memilikinya.
- Daftar affordance mati, pengaturan duplikat, status error yang tidak jelas, dan jalur render
  yang mahal.
- Catat perintah validasi saat ini untuk setiap permukaan.
- Tandai masalah sebagai wajib, direkomendasikan, atau opsional.
- Dokumentasikan blocker yang diketahui yang membutuhkan tinjauan pemilik, terutama perubahan API, keamanan,
  rilis, dan kontrak Plugin.

Definisi selesai:

- Satu daftar masalah dengan referensi file dari root repo.
- Setiap masalah memiliki tingkat keparahan, permukaan pemilik, dampak pengguna yang diharapkan, dan jalur
  validasi yang diusulkan.
- Tidak ada item pembersihan spekulatif yang dicampur ke dalam perbaikan wajib.

## Fase 2: Pembersihan produk dan UX

Prioritaskan alur kerja yang terlihat dan hilangkan kebingungan.

- Perketat salinan penyiapan awal dan status kosong seputar autentikasi model, status Gateway,
  dan penyiapan Plugin.
- Hapus atau nonaktifkan affordance mati ketika tidak ada tindakan yang mungkin dilakukan.
- Jaga tindakan penting tetap terlihat di berbagai lebar responsif alih-alih menyembunyikannya
  di balik asumsi tata letak yang rapuh.
- Konsolidasikan bahasa status yang berulang agar error memiliki satu sumber kebenaran.
- Tambahkan pengungkapan progresif untuk pengaturan lanjutan sambil menjaga penyiapan inti tetap cepat.

Validasi yang direkomendasikan:

- Jalur sukses manual untuk penyiapan pertama kali dan startup pengguna yang sudah ada.
- Pengujian terfokus untuk logika routing, persistensi konfigurasi, atau derivasi status apa pun.
- Tangkapan layar browser untuk permukaan responsif yang diubah.

## Fase 3: Pengetatan arsitektur frontend

Tingkatkan kemudahan pemeliharaan tanpa penulisan ulang luas.

- Pindahkan transformasi status UI yang berulang ke helper bertipe yang sempit.
- Jaga tanggung jawab pengambilan data, persistensi, dan presentasi tetap terpisah.
- Utamakan hook, store, dan pola komponen yang ada dibandingkan abstraksi baru.
- Pecah komponen yang terlalu besar hanya ketika hal itu mengurangi coupling atau memperjelas pengujian.
- Hindari memperkenalkan status global yang luas untuk interaksi panel lokal.

Guardrail wajib:

- Jangan mengubah perilaku publik sebagai efek samping dari pemecahan file.
- Jaga perilaku aksesibilitas tetap utuh untuk menu, dialog, tab, dan navigasi
  keyboard.
- Verifikasi bahwa status loading, kosong, error, dan optimistis masih dirender.

## Fase 4: Performa dan keandalan

Targetkan rasa sakit yang terukur, bukan optimisasi teoretis yang luas.

- Ukur biaya startup, transisi route, daftar besar, dan transkrip chat.
- Ganti data turunan mahal yang berulang dengan selektor bermemoisasi atau helper yang di-cache
  ketika profiling membuktikan nilainya.
- Kurangi pemindaian jaringan atau filesystem yang dapat dihindari di hot path.
- Jaga pengurutan deterministik untuk input prompt, registry, file, Plugin, dan jaringan
  sebelum konstruksi payload model.
- Tambahkan pengujian regresi ringan untuk helper panas dan batas kontrak.

Definisi selesai:

- Setiap perubahan performa mencatat baseline, dampak yang diharapkan, dampak aktual, dan
  celah yang tersisa.
- Tidak ada patch performa yang masuk semata-mata berdasarkan intuisi ketika pengukuran murah tersedia.

## Fase 5: Pengerasan tipe, kontrak, dan pengujian

Tingkatkan kebenaran pada titik batas yang diandalkan pengguna dan pembuat Plugin.

- Ganti string runtime yang longgar dengan union terdiskriminasi atau daftar kode tertutup.
- Validasi input eksternal dengan helper skema yang ada atau zod.
- Tambahkan pengujian kontrak seputar manifes Plugin, katalog penyedia, pesan protokol
  Gateway, dan perilaku migrasi konfigurasi.
- Simpan jalur kompatibilitas dalam alur doctor atau repair, bukan migrasi tersembunyi
  saat startup.
- Hindari coupling khusus pengujian ke internal Plugin; gunakan fasad SDK dan barrel
  terdokumentasi.

Validasi yang direkomendasikan:

- `pnpm check:changed`
- Pengujian bertarget untuk setiap batas yang diubah.
- `pnpm build` ketika batas lazy, packaging, atau permukaan yang diterbitkan berubah.

## Fase 6: Dokumentasi dan kesiapan rilis

Jaga dokumen yang menghadap pengguna tetap selaras dengan perilaku.

- Perbarui dokumen dengan perubahan perilaku, API, konfigurasi, penyiapan awal, atau Plugin.
- Tambahkan entri changelog hanya untuk perubahan yang terlihat pengguna.
- Jaga terminologi Plugin tetap menghadap pengguna; gunakan nama paket internal hanya ketika
  diperlukan untuk kontributor.
- Konfirmasi instruksi rilis dan instalasi masih cocok dengan permukaan perintah saat ini.

Definisi selesai:

- Dokumen yang relevan diperbarui di branch yang sama dengan perubahan perilaku.
- Pemeriksaan dokumen yang dihasilkan atau drift API lulus ketika disentuh.
- Handoff menyebutkan validasi apa pun yang dilewati dan mengapa validasi itu dilewati.

## Irisan pertama yang direkomendasikan

Mulai dengan pass Control UI dan penyiapan awal yang terbatas cakupannya:

- Audit permukaan penyiapan pertama kali, kesiapan autentikasi penyedia, status Gateway, dan penyiapan
  Plugin.
- Hapus tindakan mati dan perjelas status kegagalan.
- Tambahkan atau perbarui pengujian terfokus untuk derivasi status dan persistensi konfigurasi.
- Jalankan `pnpm check:changed`.

Ini memberikan nilai pengguna tinggi dengan risiko arsitektur terbatas.

## Pembaruan skill frontend

Gunakan bagian ini untuk memperbarui `SKILL.md` berfokus frontend yang disediakan dengan
tugas modernisasi. Jika mengadopsi panduan ini sebagai skill OpenClaw lokal repo,
buat `.agents/skills/openclaw-frontend/SKILL.md` terlebih dahulu, pertahankan frontmatter
yang termasuk dalam skill target tersebut, lalu tambahkan atau ganti panduan body dengan
konten berikut.

```markdown
# Frontend Delivery Standards

Use this skill when implementing or reviewing user-facing React, Next.js,
desktop webview, or app UI work.

## Operating rules

- Start from the existing product workflow and code conventions.
- Prefer the smallest correct patch that improves the current user path.
- Separate required fixes from optional polish in the handoff.
- Do not build marketing pages when the request is for an application surface.
- Keep actions visible and usable across supported viewport sizes.
- Remove dead affordances instead of leaving controls that cannot act.
- Preserve loading, empty, error, success, and permission states.
- Use existing design-system components, hooks, stores, and icons before adding
  new primitives.

## Implementation checklist

1. Identify the primary user task and the component or route that owns it.
2. Read the local component patterns before editing.
3. Patch the narrowest surface that solves the issue.
4. Add responsive constraints for fixed-format controls, toolbars, grids, and
   counters so text and hover states cannot resize the layout unexpectedly.
5. Keep data loading, state derivation, and rendering responsibilities clear.
6. Add tests when logic, persistence, routing, permissions, or shared helpers
   change.
7. Verify the main happy path and the most relevant edge case.

## Visual quality gates

- Text must fit inside its container on mobile and desktop.
- Toolbars may wrap, but controls must remain reachable.
- Buttons should use familiar icons when the icon is clearer than text.
- Cards should be used for repeated items, modals, and framed tools, not for
  every page section.
- Avoid one-note color palettes and decorative backgrounds that compete with
  operational content.
- Dense product surfaces should optimize for scanning, comparison, and repeated
  use.

## Handoff format

Report:

- What changed.
- What user behavior changed.
- Required validation that passed.
- Any validation skipped and the concrete reason.
- Optional follow-up work, clearly separated from required fixes.
```
