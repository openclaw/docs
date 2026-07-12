---
read_when:
    - Anda ingin menggunakan LongCat-2.0 dengan OpenClaw
    - Anda memerlukan kunci API LongCat atau batasan model
summary: Penyiapan API LongCat untuk LongCat-2.0
title: LongCat
x-i18n:
    generated_at: "2026-07-12T14:36:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7c447f9c42e6547a69d2124debcb685c32fe59de29bfc551e18e791d9f280584
    source_path: providers/longcat.md
    workflow: 16
---

[LongCat](https://longcat.ai) menyediakan API terkelola untuk LongCat-2.0, sebuah
model penalaran yang dibuat untuk pemrograman dan beban kerja berbasis agen. OpenClaw menyediakan
plugin resmi `longcat` untuk endpoint LongCat yang kompatibel dengan OpenAI.

| Properti       | Nilai                                |
| -------------- | ------------------------------------ |
| Penyedia       | `longcat`                            |
| Autentikasi    | `LONGCAT_API_KEY`                    |
| API            | Chat Completions kompatibel OpenAI   |
| URL dasar      | `https://api.longcat.chat/openai`    |
| Model          | `longcat/LongCat-2.0`                |
| Konteks        | 1.048.576 token                      |
| Keluaran maks. | 131.072 token                        |
| Masukan        | Teks                                 |

## Instal Plugin

Instal paket resmi, lalu mulai ulang Gateway:

```bash
openclaw plugins install @openclaw/longcat-provider
openclaw gateway restart
```

## Memulai

<Steps>
  <Step title="Buat kunci API">
    Masuk ke [Platform API LongCat](https://longcat.chat/platform/) dan
    buat kunci di halaman [Kunci API](https://longcat.chat/platform/api_keys).
  </Step>
  <Step title="Jalankan orientasi awal">
    ```bash
    openclaw onboard --auth-choice longcat-api-key
    ```
  </Step>
  <Step title="Verifikasi model">
    ```bash
    openclaw models list --provider longcat
    ```
  </Step>
</Steps>

Orientasi awal menambahkan katalog terkelola dan memilih `longcat/LongCat-2.0` jika belum
ada model utama yang dikonfigurasi.

### Penyiapan noninteraktif

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice longcat-api-key \
  --longcat-api-key "$LONGCAT_API_KEY"
```

## Perilaku penalaran

LongCat menyediakan kontrol berpikir biner. OpenClaw memetakan tingkat berpikir yang diaktifkan
ke `thinking: { type: "enabled" }` dan `/think off` ke
`thinking: { type: "disabled" }`. Saat ini LongCat tidak mendokumentasikan
`reasoning_effort`, sehingga OpenClaw tidak mengirimkannya.

LongCat mengembalikan penalaran dalam `reasoning_content`. OpenClaw mempertahankan kolom tersebut
ketika memutar ulang giliran pemanggilan alat oleh asisten agar sesi agen multigiliran mempertahankan
bentuk pesan yang diharapkan penyedia.

## Harga

Katalog bawaan menggunakan harga bayar sesuai pemakaian LongCat dalam USD per satu juta
token: $0,75 untuk masukan tanpa cache, $0,015 untuk masukan dengan cache, dan $2,95 untuk keluaran. LongCat mungkin
menawarkan diskon sementara; [halaman harga](https://longcat.chat/platform/docs/Pricing/LongCat-2.0.html)
dan catatan penagihan Anda merupakan sumber yang berlaku.

## LongCat-2.0 yang dihosting sendiri

Penyedia `longcat` ditujukan untuk API terkelola LongCat. Untuk bobot terbuka di
[Hugging Face](https://huggingface.co/meituan-longcat/LongCat-2.0), sajikan
model melalui runtime yang kompatibel dengan OpenAI dan gunakan penyedia
[vLLM](/id/providers/vllm) atau [SGLang](/id/providers/sglang) OpenClaw yang sudah ada.

Pertahankan pengidentifikasi model runtime yang tepat dalam katalog penyedia yang dihosting sendiri;
jangan arahkan penerapan lokal melalui `longcat/LongCat-2.0`.

## Pemecahan masalah

<AccordionGroup>
  <Accordion title="Kunci berfungsi di shell tetapi tidak di Gateway">
    Proses Gateway yang dikelola daemon tidak mewarisi setiap variabel shell
    interaktif. Letakkan `LONGCAT_API_KEY` di `~/.openclaw/.env`, konfigurasikan melalui
    orientasi awal, atau gunakan referensi rahasia yang disetujui.
  </Accordion>

  <Accordion title="Permintaan gagal dengan 402 atau 429">
    `402` berarti akun tidak memiliki kuota token yang memadai. `429` berarti kunci API
    mencapai batas laju. Periksa [penggunaan LongCat](https://longcat.chat/platform/usage)
    dan coba lagi permintaan yang dibatasi lajunya setelah periode tunggu penyedia.
  </Accordion>

  <Accordion title="Model tidak muncul">
    Jalankan `openclaw plugins list` dan pastikan plugin `longcat`
    diaktifkan, lalu jalankan `openclaw models list --provider longcat`.
  </Accordion>
</AccordionGroup>

## Terkait

<CardGroup cols={2}>
  <Card title="Penyedia model" href="/id/concepts/model-providers" icon="layers">
    Konfigurasi penyedia, referensi model, dan perilaku pengalihan saat gagal.
  </Card>
  <Card title="Dokumentasi API LongCat" href="https://longcat.chat/platform/docs/" icon="arrow-up-right-from-square">
    Endpoint API terkelola, autentikasi, batas, dan contoh.
  </Card>
  <Card title="Kartu model LongCat-2.0" href="https://huggingface.co/meituan-longcat/LongCat-2.0" icon="arrow-up-right-from-square">
    Arsitektur, panduan penerapan, dan detail model.
  </Card>
  <Card title="Rahasia" href="/id/gateway/secrets" icon="key">
    Simpan kredensial penyedia tanpa menyematkan teks biasa dalam konfigurasi.
  </Card>
</CardGroup>
