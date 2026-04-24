---
read_when:
    - Melakukan bootstrap workspace secara manual
summary: Templat workspace untuk TOOLS.md
title: Templat TOOLS.md
x-i18n:
    generated_at: "2026-04-24T09:27:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: 810b088129bfd963ffe603a7e0a07d099fd2551bf13ebcb702905e1b8135d017
    source_path: reference/templates/TOOLS.md
    workflow: 15
---

# TOOLS.md - Catatan Lokal

Skills mendefinisikan _bagaimana_ alat bekerja. File ini untuk hal-hal spesifik _milik Anda_ — hal-hal yang unik untuk penyiapan Anda.

## Apa yang Masuk ke Sini

Hal-hal seperti:

- Nama dan lokasi kamera
- Host dan alias SSH
- Suara pilihan untuk TTS
- Nama speaker/ruangan
- Nama panggilan perangkat
- Apa pun yang spesifik terhadap environment

## Contoh

```markdown
### Kamera

- living-room → Area utama, sudut lebar 180°
- front-door → Pintu masuk, dipicu gerakan

### SSH

- home-server → 192.168.1.100, user: admin

### TTS

- Suara pilihan: "Nova" (hangat, sedikit British)
- Speaker default: Kitchen HomePod
```

## Mengapa Dipisah?

Skills bersifat bersama. Penyiapan Anda adalah milik Anda. Memisahkannya berarti Anda dapat memperbarui Skills tanpa kehilangan catatan Anda, dan membagikan Skills tanpa membocorkan infrastruktur Anda.

---

Tambahkan apa pun yang membantu Anda melakukan pekerjaan Anda. Ini adalah lembar contekan Anda.

## Terkait

- [Workspace agen](/id/concepts/agent-workspace)
