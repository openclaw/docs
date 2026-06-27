---
read_when:
    - Anda ingin Prometheus, Grafana, VictoriaMetrics, atau pengumpul metrik lain mengumpulkan metrik OpenClaw Gateway
    - Anda memerlukan nama metrik Prometheus dan kebijakan label untuk dasbor atau peringatan
    - Anda ingin metrik tanpa menjalankan kolektor OpenTelemetry
sidebarTitle: Prometheus
summary: Ekspos diagnostik OpenClaw sebagai metrik teks Prometheus melalui Plugin diagnostics-prometheus
title: Metrik Prometheus
x-i18n:
    generated_at: "2026-06-27T17:32:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f9d3f6cf5af2e3770cd3a86e968fe25d2c3b3b87524ba1d229ef585671d320a8
    source_path: gateway/prometheus.md
    workflow: 16
---

  OpenClaw dapat mengekspos metrik diagnostik melalui plugin resmi `diagnostics-prometheus`. Plugin ini mendengarkan diagnostik tepercaya beserta peristiwa stabilitas gateway yang dipancarkan core, lalu merender endpoint teks Prometheus di:

  ```text
  GET /api/diagnostics/prometheus
  ```

  Jenis kontennya adalah `text/plain; version=0.0.4; charset=utf-8`, format eksposisi Prometheus standar.

  <Warning>
  Rute ini menggunakan autentikasi Gateway (cakupan operator). Jangan mengeksposnya sebagai endpoint `/metrics` publik tanpa autentikasi. Scrape rute ini melalui jalur autentikasi yang sama dengan yang Anda gunakan untuk API operator lainnya.
  </Warning>

  Untuk trace, log, push OTLP, dan atribut semantik OpenTelemetry GenAI, lihat [Ekspor OpenTelemetry](/id/gateway/opentelemetry).

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
  <Step title="Scrape rute terlindungi">
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
`diagnostics.enabled: true` wajib diaktifkan. Tanpanya, Plugin tetap mendaftarkan rute HTTP tetapi tidak ada peristiwa diagnostik yang mengalir ke pengekspor, sehingga responsnya kosong.
</Note>

## Metrik yang diekspor

| Metrik                                           | Jenis     | Label                                                                                     |
| ------------------------------------------------ | --------- | ----------------------------------------------------------------------------------------- |
| `openclaw_run_completed_total`                   | counter   | `channel`, `model`, `outcome`, `provider`, `trigger`                                      |
| `openclaw_run_duration_seconds`                  | histogram | `channel`, `model`, `outcome`, `provider`, `trigger`                                      |
| `openclaw_model_call_total`                      | counter   | `api`, `error_category`, `model`, `outcome`, `provider`, `transport`                      |
| `openclaw_model_call_duration_seconds`           | histogram | `api`, `error_category`, `model`, `outcome`, `provider`, `transport`                      |
| `openclaw_model_failover_total`                  | counter   | `from_model`, `from_provider`, `lane`, `reason`, `suspended`, `to_model`, `to_provider`   |
| `openclaw_model_tokens_total`                    | counter   | `agent`, `channel`, `model`, `provider`, `token_type`                                     |
| `openclaw_gen_ai_client_token_usage`             | histogram | `model`, `provider`, `token_type`                                                         |
| `openclaw_model_cost_usd_total`                  | counter   | `agent`, `channel`, `model`, `provider`                                                   |
| `openclaw_skill_used_total`                      | counter   | `activation`, `agent`, `skill`, `source`                                                  |
| `openclaw_tool_execution_total`                  | counter   | `error_category`, `outcome`, `params_kind`, `tool`, `tool_owner`, `tool_source`           |
| `openclaw_tool_execution_duration_seconds`       | histogram | `error_category`, `outcome`, `params_kind`, `tool`, `tool_owner`, `tool_source`           |
| `openclaw_tool_execution_blocked_total`          | counter   | `denied_reason`, `params_kind`, `tool`, `tool_owner`, `tool_source`                       |
| `openclaw_harness_run_total`                     | counter   | `channel`, `error_category`, `harness`, `model`, `outcome`, `phase`, `plugin`, `provider` |
| `openclaw_harness_run_duration_seconds`          | histogram | `channel`, `error_category`, `harness`, `model`, `outcome`, `phase`, `plugin`, `provider` |
| `openclaw_webhook_received_total`                | counter   | `channel`, `webhook`                                                                      |
| `openclaw_webhook_error_total`                   | counter   | `channel`, `webhook`                                                                      |
| `openclaw_webhook_duration_seconds`              | histogram | `channel`, `webhook`                                                                      |
| `openclaw_message_received_total`                | counter   | `channel`, `source`                                                                       |
| `openclaw_message_dispatch_started_total`        | counter   | `channel`, `source`                                                                       |
| `openclaw_message_dispatch_completed_total`      | counter   | `channel`, `outcome`, `reason`, `source`                                                  |
| `openclaw_message_dispatch_duration_seconds`     | histogram | `channel`, `outcome`, `reason`, `source`                                                  |
| `openclaw_message_processed_total`               | counter   | `channel`, `outcome`, `reason`                                                            |
| `openclaw_message_processed_duration_seconds`    | histogram | `channel`, `outcome`, `reason`                                                            |
| `openclaw_message_delivery_started_total`        | counter   | `channel`, `delivery_kind`                                                                |
| `openclaw_message_delivery_total`                | counter   | `channel`, `delivery_kind`, `error_category`, `outcome`                                   |
| `openclaw_message_delivery_duration_seconds`     | histogram | `channel`, `delivery_kind`, `error_category`, `outcome`                                   |
| `openclaw_talk_event_total`                      | counter   | `brain`, `event_type`, `mode`, `provider`, `transport`                                    |
| `openclaw_talk_event_duration_seconds`           | histogram | `brain`, `event_type`, `mode`, `provider`, `transport`                                    |
| `openclaw_talk_audio_bytes`                      | histogram | `brain`, `event_type`, `mode`, `provider`, `transport`                                    |
| `openclaw_queue_lane_size`                       | gauge     | `lane`                                                                                    |
| `openclaw_queue_lane_wait_seconds`               | histogram | `lane`                                                                                    |
| `openclaw_session_state_total`                   | counter   | `reason`, `state`                                                                         |
| `openclaw_session_queue_depth`                   | gauge     | `state`                                                                                   |
| `openclaw_session_turn_created_total`            | counter   | `agent`, `channel`, `trigger`                                                             |
| `openclaw_session_stuck_total`                   | counter   | `reason`, `state`                                                                         |
| `openclaw_session_stuck_age_seconds`             | histogram | `reason`, `state`                                                                         |
| `openclaw_session_recovery_total`                | counter   | `action`, `active_work_kind`, `state`, `status`                                           |
| `openclaw_session_recovery_age_seconds`          | histogram | `action`, `active_work_kind`, `state`, `status`                                           |
| `openclaw_liveness_warning_total`                | counter   | `reason`                                                                                  |
| `openclaw_liveness_sessions`                     | gauge     | `state`                                                                                   |
| `openclaw_liveness_event_loop_delay_p99_seconds` | histogram | `reason`                                                                                  |
| `openclaw_liveness_event_loop_delay_max_seconds` | histogram | `reason`                                                                                  |
| `openclaw_liveness_event_loop_utilization_ratio` | histogram | `reason`                                                                                  |
| `openclaw_liveness_cpu_core_ratio`               | histogram | `reason`                                                                                  |
| `openclaw_payload_large_total`                   | counter   | `action`, `channel`, `plugin`, `reason`, `surface`                                        |
| `openclaw_payload_large_bytes`                   | histogram | `action`, `channel`, `plugin`, `reason`, `surface`                                        |
| `openclaw_memory_bytes`                          | gauge     | `kind`                                                                                    |
| `openclaw_memory_rss_bytes`                      | histogram | tidak ada                                                                                 |
| `openclaw_memory_pressure_total`                 | counter   | `level`, `reason`                                                                         |
| `openclaw_telemetry_exporter_total`              | counter   | `exporter`, `reason`, `signal`, `status`                                                  |
| `openclaw_prometheus_series_dropped_total`       | counter   | tidak ada                                                                                 |

## Kebijakan label

<AccordionGroup>
  <Accordion title="Label terbatas dengan kardinalitas rendah">
    Label Prometheus tetap terbatas dan berkardinalitas rendah. Pengekspor tidak memancarkan pengidentifikasi diagnostik mentah seperti `runId`, `sessionKey`, `sessionId`, `callId`, `toolCallId`, ID pesan, ID obrolan, atau ID permintaan penyedia.

    Nilai label disunting dan harus cocok dengan kebijakan karakter berkardinalitas rendah OpenClaw. Nilai yang gagal memenuhi kebijakan diganti dengan `unknown`, `other`, atau `none`, tergantung metriknya. Label yang terlihat seperti kunci sesi agen bercakupan juga diganti dengan `unknown`.

  </Accordion>
  <Accordion title="Batas seri dan pencatatan luapan">
    Pengekspor membatasi seri waktu yang disimpan di memori hingga **2048** seri untuk gabungan counter, gauge, dan histogram. Seri baru di luar batas tersebut dibuang, dan `openclaw_prometheus_series_dropped_total` bertambah satu setiap kali.

    Pantau counter ini sebagai sinyal tegas bahwa atribut di hulu membocorkan nilai berkardinalitas tinggi. Pengekspor tidak pernah menaikkan batas secara otomatis; jika nilainya naik, perbaiki sumbernya alih-alih menonaktifkan batas.

  </Accordion>
  <Accordion title="Yang tidak pernah muncul dalam keluaran Prometheus">
    - teks prompt, teks respons, input alat, output alat, prompt sistem
    - transkrip Talk, payload audio, id panggilan, id ruang, token handoff, id giliran, dan id sesi mentah
    - ID permintaan penyedia mentah (hanya hash terbatas, jika berlaku, pada span — tidak pernah pada metrik)
    - kunci sesi dan ID sesi
    - hostname, jalur file, nilai rahasia

  </Accordion>
</AccordionGroup>

## Resep PromQL

```promql
# Tokens per minute, split by provider
sum by (provider) (rate(openclaw_model_tokens_total[1m]))

# Spend (USD) over the last hour, by model
sum by (model) (increase(openclaw_model_cost_usd_total[1h]))

# 95th percentile model run duration
histogram_quantile(
  0.95,
  sum by (le, provider, model)
    (rate(openclaw_run_duration_seconds_bucket[5m]))
)

# Queue wait time SLO (95p under 2s)
histogram_quantile(
  0.95,
  sum by (le, lane) (rate(openclaw_queue_lane_wait_seconds_bucket[5m]))
) < 2

# Skill usage, split by bounded source
sum by (skill, source) (increase(openclaw_skill_used_total[24h]))

# Dropped Prometheus series (cardinality alarm)
increase(openclaw_prometheus_series_dropped_total[15m]) > 0
```

<Tip>
Utamakan `gen_ai_client_token_usage` untuk dasbor lintas penyedia: metrik ini mengikuti konvensi semantik OpenTelemetry GenAI dan konsisten dengan metrik dari layanan GenAI non-OpenClaw.
</Tip>

## Memilih antara ekspor Prometheus dan OpenTelemetry

OpenClaw mendukung kedua permukaan secara independen. Anda dapat menjalankan salah satu, keduanya, atau tidak keduanya.

<Tabs>
  <Tab title="diagnostics-prometheus">
    - Model **pull**: Prometheus mengambil data dari `/api/diagnostics/prometheus`.
    - Tidak memerlukan kolektor eksternal.
    - Diautentikasi melalui autentikasi Gateway normal.
    - Permukaan hanya berisi metrik (tanpa trace atau log).
    - Paling cocok untuk stack yang sudah distandardisasi pada Prometheus + Grafana.

  </Tab>
  <Tab title="diagnostics-otel">
    - Model **push**: OpenClaw mengirim OTLP/HTTP ke kolektor atau backend yang kompatibel dengan OTLP.
    - Permukaan mencakup metrik, trace, dan log.
    - Menjembatani ke Prometheus melalui OpenTelemetry Collector (eksportir `prometheus` atau `prometheusremotewrite`) saat Anda membutuhkan keduanya.
    - Lihat [Ekspor OpenTelemetry](/id/gateway/opentelemetry) untuk katalog lengkap.

  </Tab>
</Tabs>

## Pemecahan masalah

<AccordionGroup>
  <Accordion title="Isi respons kosong">
    - Periksa `diagnostics.enabled: true` dalam konfigurasi.
    - Pastikan Plugin diaktifkan dan dimuat dengan `openclaw plugins list --enabled`.
    - Hasilkan sebagian traffic; counter dan histogram hanya memancarkan baris setelah setidaknya satu peristiwa.

  </Accordion>
  <Accordion title="401 / tidak terotorisasi">
    Endpoint memerlukan cakupan operator Gateway (`auth: "gateway"` dengan `gatewayRuntimeScopeSurface: "trusted-operator"`). Gunakan token atau kata sandi yang sama yang digunakan Prometheus untuk rute operator Gateway lainnya. Tidak ada mode publik tanpa autentikasi.
  </Accordion>
  <Accordion title="`openclaw_prometheus_series_dropped_total` terus naik">
    Atribut baru melampaui batas **2048** seri. Periksa metrik terbaru untuk label dengan kardinalitas yang sangat tinggi secara tidak terduga dan perbaiki di sumbernya. Eksportir sengaja membuang seri baru alih-alih diam-diam menulis ulang label.
  </Accordion>
  <Accordion title="Prometheus menampilkan seri usang setelah restart">
    Plugin hanya menyimpan status di memori. Setelah Gateway restart, counter direset ke nol dan gauge dimulai ulang pada nilai berikutnya yang dilaporkan. Gunakan PromQL `rate()` dan `increase()` untuk menangani reset dengan bersih.
  </Accordion>
</AccordionGroup>

## Terkait

- [Ekspor diagnostik](/id/gateway/diagnostics) — zip diagnostik lokal untuk bundel dukungan
- [Kesehatan dan kesiapan](/id/gateway/health) — probe `/healthz` dan `/readyz`
- [Logging](/id/logging) — logging berbasis file
- [Ekspor OpenTelemetry](/id/gateway/opentelemetry) — push OTLP untuk trace, metrik, dan log
