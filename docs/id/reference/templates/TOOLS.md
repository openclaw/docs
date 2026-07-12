---
read_when:
    - Melakukan bootstrap ruang kerja secara manual
summary: Templat ruang kerja untuk TOOLS.md
title: Templat TOOLS.md
x-i18n:
    generated_at: "2026-07-12T14:38:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 20eab78b3b117566a1d33a70873e70ff2d5099543aa44e2719dc8d0797099afe
    source_path: reference/templates/TOOLS.md
    workflow: 16
---

# TOOLS.md - Catatan Lokal

Skills menentukan _cara_ alat bekerja. Berkas ini ditujukan untuk hal-hal spesifik milik _Anda_ — segala sesuatu yang unik dalam penyiapan Anda: nama dan lokasi kamera, host dan alias SSH, suara TTS pilihan, nama pengeras suara/ruangan, nama panggilan perangkat, serta apa pun yang khusus untuk lingkungan Anda.

## Contoh

```markdown
### Kamera

- ruang-keluarga → Area utama, sudut lebar 180°
- pintu-depan → Pintu masuk, dipicu oleh gerakan

### SSH

- server-rumah → 192.168.1.100, pengguna: admin

### TTS

- Suara pilihan: "Nova" (hangat, sedikit beraksen Britania)
- Pengeras suara bawaan: HomePod Dapur
```

## Mengapa Dipisahkan?

Skills digunakan bersama. Penyiapan Anda adalah milik Anda. Memisahkan keduanya berarti Anda dapat memperbarui Skills tanpa kehilangan catatan, serta membagikan Skills tanpa membocorkan infrastruktur Anda.

---

Tambahkan apa pun yang membantu Anda menjalankan tugas. Ini adalah lembar contekan Anda.

## Terkait

- [Ruang kerja agen](/id/concepts/agent-workspace)
