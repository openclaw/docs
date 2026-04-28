---
read_when:
    - Anda ingin Prometheus, Grafana, VictoriaMetrics, atau scraper lain mengumpulkan metrik Gateway OpenClaw
    - Anda memerlukan nama metrik Prometheus dan kebijakan label untuk dashboard atau alert
    - Anda menginginkan metrik tanpa menjalankan kolektor OpenTelemetry
sidebarTitle: Prometheus
summary: Ekspos diagnostik OpenClaw sebagai metrik teks Prometheus melalui Plugin diagnostics-prometheus
title: Metrik Prometheus
x-i18n:
    generated_at: "2026-04-26T11:29:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: 29fd3e4658ceffe20f078e8e38b61c685ea9df518ca04ca34abf2085166eb481
    source_path: gateway/prometheus.md
    workflow: 15
---

OpenClaw dapat mengekspos metrik diagnostik melalui Plugin bawaan `diagnostics-prometheus`. Plugin ini mendengarkan diagnostik internal tepercaya dan merender endpoint teks Prometheus di:

```text
GET /api/diagnostics/prometheus
```

Tipe kontennya adalah `text/plain; version=0.0.4; charset=utf-8`, format eksposisi Prometheus standar.

<Warning>
Rute ini menggunakan autentikasi Gateway (cakupan operator). Jangan mengeksposnya sebagai endpoint `/metrics` publik tanpa autentikasi. Lakukan scrape melalui jalur autentikasi yang sama yang Anda gunakan untuk API operator lainnya.
</Warning>

Untuk trace, log, push OTLP, dan atribut semantik OpenTelemetry GenAI, lihat [OpenTelemetry export](/id/gateway/opentelemetry).

## Mulai cepat

<Steps>
  <Step title="Aktifkan Plugin">
    <Tabs>
      <Tab title="Config">
        ```json5
        {
          plugins: {
            allow: ["diagnostics-prometheus"],
            entries: {
              "diagnostics-prometheus": { enabled: true },
            },
          },
          diagnostics: {
            enabled: true,
          },
        }
        ```
      </Tab>
      <Tab title="CLI">
        ```bash
        openclaw plugins enable diagnostics-prometheus
        ```
      </Tab>
    </Tabs>
  </Step>
  <Step title="Mulai ulang Gateway">
    Rute HTTP didaftarkan saat startup Plugin, jadi lakukan reload setelah mengaktifkannya.
  </Step>
  <Step title="Scrape rute yang dilindungi">
    Kirim autentikasi gateway yang sama seperti yang digunakan klien operator Anda:

    ```bash
    curl -H "Authorization: Bearer $OPENCLAW_GATEWAY_TOKEN" \
      http://127.0.0.1:18789/api/diagnostics/prometheus
    ```

  </Step>
  <Step title="Hubungkan Prometheus">
    ```yaml
    # prometheus.yml
    scrape_configs:
      - job_name: openclaw
        scrape_interval: 30s
        metrics_path: /api/diagnostics/prometheus
        authorization:
          credentials_file: /etc/prometheus/openclaw-gateway-token
        static_configs:
          - targets: ["openclaw-gateway:18789"]
    ```
  </Step>
</Steps>

<Note>
`diagnostics.enabled: true` wajib diaktifkan. Tanpanya, Plugin tetap mendaftarkan rute HTTP tetapi tidak ada peristiwa diagnostik yang mengalir ke exporter, sehingga respons kosong.
</Note>

## Metrik yang diekspor

| Metric                                        | Tipe      | Label                                                                                     |
| --------------------------------------------- | --------- | ----------------------------------------------------------------------------------------- |
| `openclaw_run_completed_total`                | counter   | `channel`, `model`, `outcome`, `provider`, `trigger`                                      |
| `openclaw_run_duration_seconds`               | histogram | `channel`, `model`, `outcome`, `provider`, `trigger`                                      |
| `openclaw_model_call_total`                   | counter   | `api`, `error_category`, `model`, `outcome`, `provider`, `transport`                      |
| `openclaw_model_call_duration_seconds`        | histogram | `api`, `error_category`, `model`, `outcome`, `provider`, `transport`                      |
| `openclaw_model_tokens_total`                 | counter   | `agent`, `channel`, `model`, `provider`, `token_type`                                     |
| `openclaw_gen_ai_client_token_usage`          | histogram | `model`, `provider`, `token_type`                                                         |
| `openclaw_model_cost_usd_total`               | counter   | `agent`, `channel`, `model`, `provider`                                                   |
| `openclaw_tool_execution_total`               | counter   | `error_category`, `outcome`, `params_kind`, `tool`                                        |
| `openclaw_tool_execution_duration_seconds`    | histogram | `error_category`, `outcome`, `params_kind`, `tool`                                        |
| `openclaw_harness_run_total`                  | counter   | `channel`, `error_category`, `harness`, `model`, `outcome`, `phase`, `plugin`, `provider` |
| `openclaw_harness_run_duration_seconds`       | histogram | `channel`, `error_category`, `harness`, `model`, `outcome`, `phase`, `plugin`, `provider` |
| `openclaw_message_processed_total`            | counter   | `channel`, `outcome`, `reason`                                                            |
| `openclaw_message_processed_duration_seconds` | histogram | `channel`, `outcome`, `reason`                                                            |
| `openclaw_message_delivery_total`             | counter   | `channel`, `delivery_kind`, `error_category`, `outcome`                                   |
| `openclaw_message_delivery_duration_seconds`  | histogram | `channel`, `delivery_kind`, `error_category`, `outcome`                                   |
| `openclaw_queue_lane_size`                    | gauge     | `lane`                                                                                    |
| `openclaw_queue_lane_wait_seconds`            | histogram | `lane`                                                                                    |
| `openclaw_session_state_total`                | counter   | `reason`, `state`                                                                         |
| `openclaw_session_queue_depth`                | gauge     | `state`                                                                                   |
| `openclaw_memory_bytes`                       | gauge     | `kind`                                                                                    |
| `openclaw_memory_rss_bytes`                   | histogram | none                                                                                      |
| `openclaw_memory_pressure_total`              | counter   | `level`, `reason`                                                                         |
| `openclaw_telemetry_exporter_total`           | counter   | `exporter`, `reason`, `signal`, `status`                                                  |
| `openclaw_prometheus_series_dropped_total`    | counter   | none                                                                                      |

## Kebijakan label

<AccordionGroup>
  <Accordion title="Label terbatas, dengan kardinalitas rendah">
    Label Prometheus dijaga tetap terbatas dan berkardinalitas rendah. Exporter tidak mengeluarkan pengenal diagnostik mentah seperti `runId`, `sessionKey`, `sessionId`, `callId`, `toolCallId`, ID pesan, ID chat, atau ID permintaan provider.

    Nilai label disamarkan dan harus cocok dengan kebijakan karakter berkardinalitas rendah milik OpenClaw. Nilai yang gagal memenuhi kebijakan diganti dengan `unknown`, `other`, atau `none`, tergantung metriknya.

  </Accordion>
  <Accordion title="Batas seri dan akuntansi overflow">
    Exporter membatasi seri waktu yang dipertahankan di memori hingga **2048** seri untuk gabungan counter, gauge, dan histogram. Seri baru di luar batas itu akan dibuang, dan `openclaw_prometheus_series_dropped_total` bertambah satu setiap kali hal itu terjadi.

    Pantau counter ini sebagai sinyal keras bahwa sebuah atribut di upstream membocorkan nilai berkardinalitas tinggi. Exporter tidak pernah menaikkan batas secara otomatis; jika nilainya naik, perbaiki sumbernya alih-alih menonaktifkan batas.

  </Accordion>
  <Accordion title="Apa yang tidak pernah muncul dalam output Prometheus">
    - teks prompt, teks respons, input tool, output tool, system prompt
    - ID permintaan provider mentah (hanya hash terbatas, bila berlaku, pada span — tidak pernah pada metrik)
    - kunci sesi dan ID sesi
    - hostname, path file, nilai secret

  </Accordion>
</AccordionGroup>

## Resep PromQL

```promql
# Token per menit, dipisah menurut provider
sum by (provider) (rate(openclaw_model_tokens_total[1m]))

# Pengeluaran (USD) selama satu jam terakhir, menurut model
sum by (model) (increase(openclaw_model_cost_usd_total[1h]))

# Persentil ke-95 durasi proses model
histogram_quantile(
  0.95,
  sum by (le, provider, model)
    (rate(openclaw_run_duration_seconds_bucket[5m]))
)

# SLO waktu tunggu antrean (95p di bawah 2 detik)
histogram_quantile(
  0.95,
  sum by (le, lane) (rate(openclaw_queue_lane_wait_seconds_bucket[5m]))
) < 2

# Seri Prometheus yang dibuang (alarm kardinalitas)
increase(openclaw_prometheus_series_dropped_total[15m]) > 0
```

<Tip>
Sebaiknya gunakan `gen_ai_client_token_usage` untuk dashboard lintas provider: metrik ini mengikuti konvensi semantik OpenTelemetry GenAI dan konsisten dengan metrik dari layanan GenAI non-OpenClaw.
</Tip>

## Memilih antara Prometheus dan OpenTelemetry export

OpenClaw mendukung kedua permukaan ini secara independen. Anda dapat menjalankan salah satunya, keduanya, atau tidak sama sekali.

<Tabs>
  <Tab title="diagnostics-prometheus">
    - Model **pull**: Prometheus melakukan scrape ke `/api/diagnostics/prometheus`.
    - Tidak memerlukan kolektor eksternal.
    - Diautentikasi melalui autentikasi Gateway normal.
    - Permukaannya hanya metrik (tanpa trace atau log).
    - Paling cocok untuk stack yang sudah distandardisasi pada Prometheus + Grafana.

  </Tab>
  <Tab title="diagnostics-otel">
    - Model **push**: OpenClaw mengirim OTLP/HTTP ke kolektor atau backend yang kompatibel dengan OTLP.
    - Permukaannya mencakup metrik, trace, dan log.
    - Menjembatani ke Prometheus melalui OpenTelemetry Collector (exporter `prometheus` atau `prometheusremotewrite`) saat Anda memerlukan keduanya.
    - Lihat [OpenTelemetry export](/id/gateway/opentelemetry) untuk katalog lengkapnya.

  </Tab>
</Tabs>

## Pemecahan masalah

<AccordionGroup>
  <Accordion title="Body respons kosong">
    - Periksa `diagnostics.enabled: true` di konfigurasi.
    - Pastikan Plugin aktif dan dimuat dengan `openclaw plugins list --enabled`.
    - Hasilkan beberapa traffic; counter dan histogram hanya mengeluarkan baris setelah setidaknya satu peristiwa.

  </Accordion>
  <Accordion title="401 / unauthorized">
    Endpoint ini memerlukan cakupan operator Gateway (`auth: "gateway"` dengan `gatewayRuntimeScopeSurface: "trusted-operator"`). Gunakan token atau password yang sama seperti yang digunakan Prometheus untuk rute operator Gateway lainnya. Tidak ada mode publik tanpa autentikasi.
  </Accordion>
  <Accordion title="`openclaw_prometheus_series_dropped_total` terus naik">
    Sebuah atribut baru melebihi batas **2048** seri. Periksa metrik terbaru untuk label dengan kardinalitas tinggi yang tidak terduga dan perbaiki di sumbernya. Exporter sengaja membuang seri baru alih-alih menulis ulang label secara diam-diam.
  </Accordion>
  <Accordion title="Prometheus menampilkan seri basi setelah restart">
    Plugin hanya menyimpan status di memori. Setelah Gateway restart, counter di-reset ke nol dan gauge dimulai ulang pada nilai berikutnya yang dilaporkan. Gunakan PromQL `rate()` dan `increase()` untuk menangani reset dengan bersih.
  </Accordion>
</AccordionGroup>

## Terkait

- [Diagnostics export](/id/gateway/diagnostics) — zip diagnostik lokal untuk support bundle
- [Health and readiness](/id/gateway/health) — probe `/healthz` dan `/readyz`
- [Logging](/id/logging) — logging berbasis file
- [OpenTelemetry export](/id/gateway/opentelemetry) — push OTLP untuk trace, metrik, dan log
