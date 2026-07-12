---
read_when:
    - Anda ingin Prometheus, Grafana, VictoriaMetrics, atau scraper lain mengumpulkan metrik Gateway OpenClaw
    - Anda memerlukan nama metrik Prometheus dan kebijakan label untuk dasbor atau peringatan
    - Anda menginginkan metrik tanpa menjalankan kolektor OpenTelemetry
sidebarTitle: Prometheus
summary: Ekspos diagnostik OpenClaw sebagai metrik teks Prometheus melalui plugin diagnostics-prometheus
title: Metrik Prometheus
x-i18n:
    generated_at: "2026-07-12T14:14:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8a3975a9a79f32f1e9731b819613fdf6b9ffeee20bc71c841b9a6d7a5e0052f4
    source_path: gateway/prometheus.md
    workflow: 16
---

  OpenClaw dapat mengekspos metrik diagnostik melalui plugin resmi
  `diagnostics-prometheus`. Plugin ini menerima diagnostik tepercaya serta
  peristiwa diagnostik yang diberi tag secara internal dan dimiliki dispatcher (sinyal antrean, memori, dan
  pemulihan sesi), lalu menyajikan endpoint teks Prometheus di:

  ```text
  GET /api/diagnostics/prometheus
  ```

  Tipe kontennya adalah `text/plain; version=0.0.4; charset=utf-8`, yaitu format
  eksposisi standar Prometheus.

  <Warning>
  Rute ini menggunakan autentikasi Gateway (cakupan operator, permukaan operator tepercaya). Jangan mengeksposnya sebagai endpoint `/metrics` publik tanpa autentikasi. Ambil metrik melalui jalur autentikasi yang sama dengan yang Anda gunakan untuk API operator lainnya.
  </Warning>

  Untuk pelacakan, log, pengiriman OTLP, dan atribut semantik OpenTelemetry GenAI, lihat [Ekspor OpenTelemetry](/id/gateway/opentelemetry).

  ## Mulai cepat

  <Steps>
  <Step title="Instal plugin">
    ```bash
    openclaw plugins install clawhub:@openclaw/diagnostics-prometheus
    ```
  </Step>
  <Step title="Aktifkan plugin">
    <Tabs>
      <Tab title="Konfigurasi">
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
    Rute HTTP didaftarkan saat plugin dimulai, jadi muat ulang setelah mengaktifkannya.
  </Step>
  <Step title="Ambil metrik dari rute yang dilindungi">
    Kirim autentikasi Gateway yang sama dengan yang digunakan klien operator Anda:

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
`diagnostics.enabled` secara default bernilai `true`; atur menjadi `false` hanya di lingkungan yang sangat dibatasi. Jika nilainya `false`, plugin tetap mendaftarkan rute HTTP, tetapi tidak ada peristiwa diagnostik yang mengalir ke pengekspor, sehingga responsnya kosong.
</Note>

## Metrik yang diekspor

| Metrik                                           | Jenis     | Label                                                                                     |
| ------------------------------------------------ | --------- | ----------------------------------------------------------------------------------------- |
| `openclaw_run_completed_total`                   | pencacah  | `channel`, `model`, `outcome`, `provider`, `trigger`                                      |
| `openclaw_run_duration_seconds`                  | histogram | `channel`, `model`, `outcome`, `provider`, `trigger`                                      |
| `openclaw_model_call_total`                      | pencacah  | `api`, `error_category`, `model`, `outcome`, `provider`, `transport`                      |
| `openclaw_model_call_duration_seconds`           | histogram | `api`, `error_category`, `model`, `outcome`, `provider`, `transport`                      |
| `openclaw_model_failover_total`                  | pencacah  | `from_model`, `from_provider`, `lane`, `reason`, `suspended`, `to_model`, `to_provider`   |
| `openclaw_model_tokens_total`                    | pencacah  | `agent`, `channel`, `model`, `provider`, `token_type`                                     |
| `openclaw_gen_ai_client_token_usage`             | histogram | `model`, `provider`, `token_type`                                                         |
| `openclaw_model_cost_usd_total`                  | pencacah  | `agent`, `channel`, `model`, `provider`                                                   |
| `openclaw_model_usage_duration_seconds`          | histogram | `agent`, `channel`, `model`, `provider`                                                   |
| `openclaw_skill_used_total`                      | pencacah  | `activation`, `agent`, `skill`, `source`                                                  |
| `openclaw_tool_execution_total`                  | pencacah  | `error_category`, `outcome`, `params_kind`, `tool`, `tool_owner`, `tool_source`           |
| `openclaw_tool_execution_duration_seconds`       | histogram | `error_category`, `outcome`, `params_kind`, `tool`, `tool_owner`, `tool_source`           |
| `openclaw_tool_execution_blocked_total`          | pencacah  | `denied_reason`, `params_kind`, `tool`, `tool_owner`, `tool_source`                       |
| `openclaw_harness_run_total`                     | pencacah  | `channel`, `error_category`, `harness`, `model`, `outcome`, `phase`, `plugin`, `provider` |
| `openclaw_harness_run_duration_seconds`          | histogram | `channel`, `error_category`, `harness`, `model`, `outcome`, `phase`, `plugin`, `provider` |
| `openclaw_webhook_received_total`                | pencacah  | `channel`, `webhook`                                                                      |
| `openclaw_webhook_error_total`                   | pencacah  | `channel`, `webhook`                                                                      |
| `openclaw_webhook_duration_seconds`              | histogram | `channel`, `webhook`                                                                      |
| `openclaw_message_received_total`                | pencacah  | `channel`, `source`                                                                       |
| `openclaw_message_dispatch_started_total`        | pencacah  | `channel`, `source`                                                                       |
| `openclaw_message_dispatch_completed_total`      | pencacah  | `channel`, `outcome`, `reason`, `source`                                                  |
| `openclaw_message_dispatch_duration_seconds`     | histogram | `channel`, `outcome`, `reason`, `source`                                                  |
| `openclaw_message_processed_total`               | pencacah  | `channel`, `outcome`, `reason`                                                            |
| `openclaw_message_processed_duration_seconds`    | histogram | `channel`, `outcome`, `reason`                                                            |
| `openclaw_message_delivery_started_total`        | pencacah  | `channel`, `delivery_kind`                                                                |
| `openclaw_message_delivery_total`                | pencacah  | `channel`, `delivery_kind`, `error_category`, `outcome`                                   |
| `openclaw_message_delivery_duration_seconds`     | histogram | `channel`, `delivery_kind`, `error_category`, `outcome`                                   |
| `openclaw_talk_event_total`                      | pencacah  | `brain`, `event_type`, `mode`, `provider`, `transport`                                    |
| `openclaw_talk_event_duration_seconds`           | histogram | `brain`, `event_type`, `mode`, `provider`, `transport`                                    |
| `openclaw_talk_audio_bytes`                      | histogram | `brain`, `event_type`, `mode`, `provider`, `transport`                                    |
| `openclaw_queue_lane_size`                       | pengukur  | `lane`                                                                                    |
| `openclaw_queue_lane_wait_seconds`               | histogram | `lane`                                                                                    |
| `openclaw_session_state_total`                   | pencacah  | `reason`, `state`                                                                         |
| `openclaw_session_queue_depth`                   | pengukur  | `state`                                                                                   |
| `openclaw_session_turn_created_total`            | pencacah  | `agent`, `channel`, `trigger`                                                             |
| `openclaw_session_stuck_total`                   | pencacah  | `reason`, `state`                                                                         |
| `openclaw_session_stuck_age_seconds`             | histogram | `reason`, `state`                                                                         |
| `openclaw_session_recovery_total`                | pencacah  | `action`, `active_work_kind`, `state`, `status`                                           |
| `openclaw_session_recovery_age_seconds`          | histogram | `action`, `active_work_kind`, `state`, `status`                                           |
| `openclaw_liveness_warning_total`                | pencacah  | `reason`                                                                                  |
| `openclaw_liveness_sessions`                     | pengukur  | `state`                                                                                   |
| `openclaw_liveness_event_loop_delay_p99_seconds` | histogram | `reason`                                                                                  |
| `openclaw_liveness_event_loop_delay_max_seconds` | histogram | `reason`                                                                                  |
| `openclaw_liveness_event_loop_utilization_ratio` | histogram | `reason`                                                                                  |
| `openclaw_liveness_cpu_core_ratio`               | histogram | `reason`                                                                                  |
| `openclaw_payload_large_total`                   | pencacah  | `action`, `channel`, `plugin`, `reason`, `surface`                                        |
| `openclaw_payload_large_bytes`                   | histogram | `action`, `channel`, `plugin`, `reason`, `surface`                                        |
| `openclaw_memory_bytes`                          | pengukur  | `kind`                                                                                    |
| `openclaw_memory_rss_bytes`                      | histogram | tidak ada                                                                                 |
| `openclaw_memory_pressure_total`                 | pencacah  | `level`, `reason`                                                                         |
| `openclaw_telemetry_exporter_total`              | pencacah  | `exporter`, `reason`, `signal`, `status`                                                  |
| `openclaw_prometheus_series_dropped_total`       | pencacah  | tidak ada                                                                                 |
| `openclaw_diagnostic_async_queue_dropped_total`  | pencacah  | `drop_class`                                                                              |
| `openclaw_diagnostic_async_queue_length`         | pengukur  | tidak ada                                                                                 |

## Kebijakan label

<AccordionGroup>
  <Accordion title="Label terbatas dengan kardinalitas rendah">
    Label Prometheus tetap terbatas dan berkardinalitas rendah. Pengekspor tidak memancarkan pengidentifikasi diagnostik mentah seperti `runId`, `sessionKey`, `sessionId`, `callId`, `toolCallId`, ID pesan, ID obrolan, atau ID permintaan penyedia.

    Nilai label disunting dan harus sesuai dengan kebijakan karakter berkardinalitas rendah OpenClaw. Nilai yang tidak memenuhi kebijakan diganti dengan `unknown`, `other`, atau `none`, bergantung pada metriknya. Label yang terlihat seperti kunci sesi agen bercakupan juga diganti dengan `unknown`.

  </Accordion>
  <Accordion title="Batas seri dan penghitungan kelebihan">
    Eksportir membatasi seri waktu yang dipertahankan dalam memori hingga **2048** seri secara gabungan di seluruh penghitung, gauge, dan histogram. Seri baru yang melampaui batas tersebut dibuang, dan `openclaw_prometheus_series_dropped_total` bertambah satu setiap kali hal itu terjadi.

    Pantau penghitung ini sebagai sinyal tegas bahwa suatu atribut di hulu membocorkan nilai berkardinalitas tinggi. Eksportir tidak pernah menaikkan batas secara otomatis; jika penghitung ini meningkat, perbaiki sumbernya alih-alih menonaktifkan batas tersebut.

  </Accordion>
  <Accordion title="Yang tidak pernah muncul dalam keluaran Prometheus">
    - teks prompt, teks respons, masukan alat, keluaran alat, prompt sistem
    - transkrip Talk, muatan audio, ID panggilan, ID ruang, token serah terima, ID giliran, dan ID sesi mentah
    - ID permintaan penyedia mentah (hanya hash terbatas, jika berlaku, pada span—tidak pernah pada metrik)
    - kunci sesi dan ID sesi
    - nama host, jalur berkas, nilai rahasia

  </Accordion>
</AccordionGroup>

## Resep PromQL

```promql
# Token per menit, dipisahkan berdasarkan penyedia
sum by (provider) (rate(openclaw_model_tokens_total[1m]))

# Pengeluaran (USD) selama satu jam terakhir, berdasarkan model
sum by (model) (increase(openclaw_model_cost_usd_total[1h]))

# Persentil ke-95 durasi eksekusi model
histogram_quantile(
  0.95,
  sum by (le, provider, model)
    (rate(openclaw_run_duration_seconds_bucket[5m]))
)

# SLO waktu tunggu antrean (persentil ke-95 di bawah 2 dtk)
histogram_quantile(
  0.95,
  sum by (le, lane) (rate(openclaw_queue_lane_wait_seconds_bucket[5m]))
) < 2

# Penggunaan Skill, dipisahkan berdasarkan sumber terbatas
sum by (skill, source) (increase(openclaw_skill_used_total[24h]))

# Seri Prometheus yang dibuang (alarm kardinalitas)
increase(openclaw_prometheus_series_dropped_total[15m]) > 0
```

<Tip>
Utamakan `gen_ai_client_token_usage` untuk dasbor lintas penyedia: metrik ini mengikuti konvensi semantik GenAI OpenTelemetry dan konsisten dengan metrik dari layanan GenAI non-OpenClaw.
</Tip>

## Memilih antara ekspor Prometheus dan OpenTelemetry

OpenClaw mendukung kedua antarmuka secara independen. Anda dapat menjalankan salah satunya, keduanya, atau tidak keduanya.

<Tabs>
  <Tab title="diagnostics-prometheus">
    - Model **tarik**: Prometheus mengambil data dari `/api/diagnostics/prometheus`.
    - Tidak memerlukan kolektor eksternal.
    - Diautentikasi melalui autentikasi Gateway normal.
    - Antarmuka hanya mencakup metrik (tanpa pelacakan atau log).
    - Paling sesuai untuk tumpukan yang sudah distandardisasi pada Prometheus + Grafana.

  </Tab>
  <Tab title="diagnostics-otel">
    - Model **dorong**: OpenClaw mengirimkan OTLP/HTTP ke kolektor atau backend yang kompatibel dengan OTLP.
    - Antarmuka mencakup metrik, pelacakan, dan log.
    - Terhubung ke Prometheus melalui OpenTelemetry Collector (eksportir `prometheus` atau `prometheusremotewrite`) ketika Anda memerlukan keduanya.
    - Lihat [Ekspor OpenTelemetry](/id/gateway/opentelemetry) untuk katalog lengkap.

  </Tab>
</Tabs>

## Pemecahan masalah

<AccordionGroup>
  <Accordion title="Isi respons kosong">
    - Periksa bahwa `diagnostics.enabled` tidak ditetapkan ke `false` dalam konfigurasi (nilai bawaannya adalah `true`).
    - Pastikan Plugin diaktifkan dan dimuat dengan `openclaw plugins list --enabled`.
    - Hasilkan sejumlah lalu lintas; penghitung dan histogram hanya menghasilkan baris setelah setidaknya satu peristiwa.

  </Accordion>
  <Accordion title="401 / tidak diotorisasi">
    Titik akhir memerlukan cakupan operator Gateway (`auth: "gateway"` dengan `gatewayRuntimeScopeSurface: "trusted-operator"`). Gunakan token atau kata sandi yang sama dengan yang digunakan Prometheus untuk rute operator Gateway lainnya. Tidak ada mode publik tanpa autentikasi.
  </Accordion>
  <Accordion title="`openclaw_prometheus_series_dropped_total` terus meningkat">
    Atribut baru melampaui batas **2048** seri. Periksa metrik terkini untuk menemukan label dengan kardinalitas tinggi yang tidak terduga, lalu perbaiki pada sumbernya. Eksportir sengaja membuang seri baru alih-alih secara diam-diam menulis ulang label.
  </Accordion>
  <Accordion title="Prometheus menampilkan seri usang setelah dimulai ulang">
    Plugin hanya menyimpan status dalam memori. Setelah Gateway dimulai ulang, penghitung diatur ulang ke nol dan gauge dimulai kembali pada nilai berikutnya yang dilaporkan. Gunakan `rate()` dan `increase()` PromQL untuk menangani pengaturan ulang dengan baik.
  </Accordion>
</AccordionGroup>

## Terkait

- [Ekspor diagnostik](/id/gateway/diagnostics) — berkas zip diagnostik lokal untuk bundel dukungan
- [Kesehatan dan kesiapan](/id/gateway/health) — probe `/healthz` dan `/readyz`
- [Pencatatan log](/id/logging) — pencatatan log berbasis berkas
- [Ekspor OpenTelemetry](/id/gateway/opentelemetry) — pengiriman OTLP untuk pelacakan, metrik, dan log
