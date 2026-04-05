---
read_when:
    - Menyiapkan workspace secara manual
summary: Templat workspace untuk TOOLS.md
title: Templat TOOLS.md
x-i18n:
    generated_at: "2026-04-05T14:05:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: eed204d57e7221ae0455a87272da2b0730d6aee6ddd2446a851703276e4a96b7
    source_path: reference/templates/TOOLS.md
    workflow: 15
---

# TOOLS.md - Catatan Lokal

Skills mendefinisikan _bagaimana_ tool bekerja. File ini untuk hal-hal yang spesifik bagi _Anda_ — hal-hal yang unik untuk pengaturan Anda.

## Apa yang Masuk ke Sini

Hal-hal seperti:

- Nama dan lokasi kamera
- Host dan alias SSH
- Suara pilihan untuk TTS
- Nama speaker/ruangan
- Nama panggilan perangkat
- Apa pun yang spesifik terhadap lingkungan

## Contoh

```markdown
### Cameras

- living-room → Area utama, sudut lebar 180°
- front-door → Pintu masuk, dipicu gerakan

### SSH

- home-server → 192.168.1.100, pengguna: admin

### TTS

- Suara pilihan: "Nova" (hangat, sedikit British)
- Speaker default: Kitchen HomePod
```

## Mengapa Dipisahkan?

Skills bersifat bersama. Pengaturan Anda adalah milik Anda. Memisahkannya berarti Anda dapat memperbarui Skills tanpa kehilangan catatan Anda, dan berbagi Skills tanpa membocorkan infrastruktur Anda.

---

Tambahkan apa pun yang membantu Anda melakukan pekerjaan Anda. Ini adalah lembar contekan Anda.
