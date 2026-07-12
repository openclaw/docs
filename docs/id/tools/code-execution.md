---
read_when:
    - Anda ingin mengaktifkan atau mengonfigurasi code_execution
    - Anda menginginkan analisis jarak jauh tanpa akses shell lokal
    - Anda ingin menggabungkan x_search atau web_search dengan analisis Python jarak jauh
summary: 'code_execution: jalankan analisis Python jarak jauh dalam sandbox dengan xAI'
title: Eksekusi kode
x-i18n:
    generated_at: "2026-07-12T14:45:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1ab391daed9154f113535e6d241c45d5c08c22abdc012148a9f0f2ae5ec548b3
    source_path: tools/code-execution.md
    workflow: 16
---

`code_execution` menjalankan analisis Python jarak jauh dalam sandbox pada Responses API xAI
(`https://api.x.ai/v1/responses`, endpoint yang sama dengan yang digunakan `x_search`). Alat ini
didaftarkan oleh plugin bawaan `xai` berdasarkan kontrak `tools`.

<Warning>
  `code_execution` berjalan di server xAI. xAI mengenakan biaya $5 per 1.000 panggilan alat,
  ditambah token masukan dan keluaran model.
</Warning>

| Properti           | Nilai                                                                             |
| ------------------ | --------------------------------------------------------------------------------- |
| Nama alat          | `code_execution`                                                                  |
| Plugin penyedia    | `xai` (bawaan, `enabledByDefault: true`)                                          |
| Autentikasi        | Profil autentikasi xAI, `XAI_API_KEY`, atau `plugins.entries.xai.config.webSearch.apiKey` |
| Model default      | `grok-4.3`                                                                        |
| Batas waktu default | 30 detik                                                                         |
| `maxTurns` default | tidak ditetapkan (xAI menerapkan batas internalnya sendiri)                       |

Gunakan alat ini untuk perhitungan, tabulasi, statistik cepat, dan
analisis bergaya bagan, termasuk data yang dikembalikan oleh `x_search` atau
`web_search`. Alat ini tidak memiliki akses ke berkas lokal, shell, repositori,
atau perangkat tersanding Anda, dan tidak mempertahankan status di antara
panggilan, jadi perlakukan setiap panggilan sebagai analisis sementara, bukan
sesi notebook. Untuk data X terbaru, jalankan [`x_search`](/id/tools/web#x_search)
terlebih dahulu dan salurkan hasilnya.

Untuk eksekusi lokal, gunakan [`exec`](/id/tools/exec) sebagai gantinya.

## Penyiapan

<Steps>
  <Step title="Berikan kredensial xAI">
    OAuth memerlukan langganan SuperGrok atau X Premium yang memenuhi syarat
    (verifikasi kode perangkat, sehingga dapat digunakan dari host jarak jauh tanpa
    callback localhost):

    ```bash
    openclaw models auth login --provider xai --method oauth
    ```

    Selama instalasi baru, pilihan yang sama tersedia dalam proses orientasi:

    ```bash
    openclaw onboard --install-daemon --auth-choice xai-oauth
    ```

    Atau kunci API:

    ```bash
    openclaw models auth login --provider xai --method api-key
    export XAI_API_KEY=xai-...
    ```

    Atau melalui konfigurasi:

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              webSearch: {
                apiKey: "xai-...",
              },
            },
          },
        },
      },
    }
    ```

    Ketiga metode ini juga mendukung `x_search` dan `web_search` Grok.

  </Step>

  <Step title="Aktifkan dan sesuaikan code_execution">
    Jika `enabled` tidak dicantumkan, `code_execution` hanya ditampilkan ketika
    penyedia model aktif adalah `xai` dan kredensial xAI berhasil ditemukan.
    Untuk model aktif dengan penyedia non-xAI yang diketahui, tetapkan
    `plugins.entries.xai.config.codeExecution.enabled` ke `true` untuk memilih
    penggunaan lintas penyedia. Jika penyedia model aktif tidak ada atau tidak
    dapat ditentukan, alat tetap disembunyikan. Tetapkan `enabled` ke `false`
    untuk menonaktifkannya bagi setiap penyedia. Kredensial xAI selalu diperlukan.

    Gunakan blok yang sama untuk mengganti model, batas giliran, atau batas waktu:

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              codeExecution: {
                enabled: true, // diperlukan untuk penyedia model non-xAI yang diketahui
                model: "grok-4.3", // mengganti model eksekusi kode xAI default
                maxTurns: 2,            // batas opsional untuk giliran alat internal
                timeoutSeconds: 30,     // batas waktu permintaan (default: 30)
              },
            },
          },
        },
      },
    }
    ```

  </Step>

  <Step title="Mulai ulang Gateway">
    ```bash
    openclaw gateway restart
    ```

    `code_execution` muncul dalam daftar alat agen setelah plugin xAI
    mendaftar ulang dan pemeriksaan penyedia, pengaktifan, serta autentikasi di atas berhasil.

  </Step>
</Steps>

## Cara menggunakannya

Nyatakan tujuan analisis secara eksplisit; alat ini menerima satu parameter `task`,
jadi kirim permintaan lengkap dan semua data sebaris dalam satu prompt:

```text
Gunakan code_execution untuk menghitung rata-rata bergerak 7 hari bagi angka-angka ini: ...
```

```text
Gunakan x_search untuk menemukan postingan yang menyebut OpenClaw minggu ini, lalu gunakan code_execution untuk menghitungnya berdasarkan hari.
```

```text
Gunakan web_search untuk mengumpulkan angka tolok ukur AI terbaru, lalu gunakan code_execution untuk membandingkan perubahan persentase.
```

## Kesalahan

Tanpa autentikasi, alat mengembalikan kesalahan JSON terstruktur (bukan
pengecualian yang dilempar), sehingga agen dapat mengoreksi dirinya sendiri:

```json
{
  "error": "missing_xai_api_key",
  "message": "code_execution memerlukan kredensial xAI. Jalankan `openclaw onboard --auth-choice xai-oauth` untuk masuk dengan Grok, jalankan `openclaw onboard --auth-choice xai-api-key`, tetapkan `XAI_API_KEY` di lingkungan Gateway, atau konfigurasikan `plugins.entries.xai.config.webSearch.apiKey`.",
  "docs": "https://docs.openclaw.ai/tools/code-execution"
}
```

## Terkait

<CardGroup cols={2}>
  <Card title="Alat Exec" href="/id/tools/exec" icon="terminal">
    Eksekusi shell lokal pada mesin atau Node tersanding Anda.
  </Card>
  <Card title="Persetujuan Exec" href="/id/tools/exec-approvals" icon="shield">
    Kebijakan izinkan/tolak untuk eksekusi shell.
  </Card>
  <Card title="Alat web" href="/id/tools/web" icon="globe">
    `web_search`, `x_search`, dan `web_fetch`.
  </Card>
  <Card title="Penyedia xAI" href="/id/providers/xai" icon="microchip">
    Model Grok, pencarian web/X, dan konfigurasi eksekusi kode.
  </Card>
</CardGroup>
