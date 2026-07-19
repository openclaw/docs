---
read_when:
    - Anda ingin Prometheus, Grafana, VictoriaMetrics, atau scraper lain mengumpulkan metrik OpenClaw Gateway
    - Anda memerlukan nama metrik Prometheus dan kebijakan label untuk dasbor atau peringatan
    - Anda menginginkan metrik tanpa menjalankan kolektor OpenTelemetry
sidebarTitle: Prometheus
summary: Ekspos diagnostik OpenClaw sebagai metrik teks Prometheus melalui plugin diagnostics-prometheus
title: Metrik Prometheus
x-i18n:
    generated_at: "2026-07-19T05:05:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 9d04a46bdb401df3cdd2571b973f2a60f264862cf74da02c5a9cfa1de6ea9ffe
    source_path: gateway/prometheus.md
    workflow: 16
---

OpenClaw dapat mengekspos metrik diagnostik melalui plugin resmi
`diagnostics-prometheus`. Plugin ini menerima diagnostik tepercaya serta
peristiwa diagnostik yang ditandai secara internal dan dimiliki dispatcher (sinyal antrean, memori, dan
pemulihan sesi), lalu menyajikan endpoint teks Prometheus di:

```text
GET /api/diagnostics/prometheus
```

Jenis kontennya adalah `text/plain; version=0.0.4; charset=utf-8`, yaitu format eksposisi
standar Prometheus.

<Warning>
Rute ini menggunakan autentikasi Gateway (cakupan operator, permukaan operator tepercaya). Jangan mengeksposnya sebagai endpoint `/metrics` publik tanpa autentikasi. Ambil metrik melalui jalur autentikasi yang sama dengan yang digunakan untuk API operator lainnya.
</Warning>

Untuk pelacakan, log, push OTLP, dan atribut semantik GenAI OpenTelemetry, lihat [ekspor OpenTelemetry](/id/gateway/opentelemetry).

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
`diagnostics.enabled` secara default bernilai `true`; atur ke `false` hanya dalam lingkungan yang dibatasi secara ketat. Jika nilainya `false`, plugin tetap mendaftarkan rute HTTP, tetapi tidak ada peristiwa diagnostik yang mengalir ke pengekspor, sehingga responsnya kosong.
</Note>

## Metrik yang diekspor

| Metrik                                           | Jenis     | Label                                                                                     |
| ------------------------------------------------ | --------- | ----------------------------------------------------------------------------------------- |
| `openclaw_run_completed_total`                   | penghitung | `channel`, `model`, `outcome`, `provider`, `trigger`                                      |
| `openclaw_run_duration_seconds`                  | histogram | `channel`, `model`, `outcome`, `provider`, `trigger`                                      |
| `openclaw_model_call_total`                      | penghitung | `api`, `error_category`, `model`, `observation_unit`, `outcome`, `provider`, `transport`  |
| `openclaw_model_call_duration_seconds`           | histogram | `api`, `error_category`, `model`, `observation_unit`, `outcome`, `provider`, `transport`  |
| `openclaw_model_failover_total`                  | penghitung | `from_model`, `from_provider`, `lane`, `reason`, `suspended`, `to_model`, `to_provider`   |
| `openclaw_model_tokens_total`                    | penghitung | `agent`, `channel`, `model`, `provider`, `token_type`                                     |
| `openclaw_gen_ai_client_token_usage`             | histogram | `model`, `provider`, `token_type`                                                         |
| `openclaw_model_cost_usd_total`                  | penghitung | `agent`, `channel`, `model`, `provider`                                                   |
| `openclaw_model_usage_duration_seconds`          | histogram | `agent`, `channel`, `model`, `provider`                                                   |
| `openclaw_skill_used_total`                      | penghitung | `activation`, `agent`, `skill`, `source`                                                  |
| `openclaw_tool_execution_total`                  | penghitung | `error_category`, `outcome`, `params_kind`, `tool`, `tool_owner`, `tool_source`           |
| `openclaw_tool_execution_duration_seconds`       | histogram | `error_category`, `outcome`, `params_kind`, `tool`, `tool_owner`, `tool_source`           |
| `openclaw_tool_execution_blocked_total`          | penghitung | `denied_reason`, `params_kind`, `tool`, `tool_owner`, `tool_source`                       |
| `openclaw_harness_run_total`                     | penghitung | `channel`, `error_category`, `harness`, `model`, `outcome`, `phase`, `plugin`, `provider` |
| `openclaw_harness_run_duration_seconds`          | histogram | `channel`, `error_category`, `harness`, `model`, `outcome`, `phase`, `plugin`, `provider` |
| `openclaw_webhook_received_total`                | penghitung | `channel`, `webhook`                                                                      |
| `openclaw_webhook_error_total`                   | penghitung | `channel`, `webhook`                                                                      |
| `openclaw_webhook_duration_seconds`              | histogram | `channel`, `webhook`                                                                      |
| `openclaw_message_received_total`                | penghitung | `channel`, `source`                                                                       |
| `openclaw_message_dispatch_started_total`        | penghitung | `channel`, `source`                                                                       |
| `openclaw_message_dispatch_completed_total`      | penghitung | `channel`, `outcome`, `reason`, `source`                                                  |
| `openclaw_message_dispatch_duration_seconds`     | histogram | `channel`, `outcome`, `reason`, `source`                                                  |
| `openclaw_message_processed_total`               | penghitung | `channel`, `outcome`, `reason`                                                            |
| `openclaw_message_processed_duration_seconds`    | histogram | `channel`, `outcome`, `reason`                                                            |
| `openclaw_message_delivery_started_total`        | penghitung | `channel`, `delivery_kind`                                                                |
| `openclaw_message_delivery_total`                | penghitung | `channel`, `delivery_kind`, `error_category`, `outcome`                                   |
| `openclaw_message_delivery_duration_seconds`     | histogram | `channel`, `delivery_kind`, `error_category`, `outcome`                                   |
| `openclaw_talk_event_total`                      | penghitung | `brain`, `event_type`, `mode`, `provider`, `transport`                                    |
| `openclaw_talk_event_duration_seconds`           | histogram | `brain`, `event_type`, `mode`, `provider`, `transport`                                    |
| `openclaw_talk_audio_bytes`                      | histogram | `brain`, `event_type`, `mode`, `provider`, `transport`                                    |
| `openclaw_queue_lane_size`                       | pengukur  | `lane`                                                                                    |
| `openclaw_queue_lane_wait_seconds`               | histogram | `lane`                                                                                    |
| `openclaw_session_state_total`                   | penghitung | `reason`, `state`                                                                         |
| `openclaw_session_queue_depth`                   | pengukur  | `state`                                                                                   |
| `openclaw_session_turn_created_total`            | penghitung | `agent`, `channel`, `trigger`                                                             |
| `openclaw_session_stuck_total`                   | penghitung | `reason`, `state`                                                                         |
| `openclaw_session_stuck_age_seconds`             | histogram | `reason`, `state`                                                                         |
| `openclaw_session_recovery_total`                | penghitung | `action`, `active_work_kind`, `state`, `status`                                           |
| `openclaw_session_recovery_age_seconds`          | histogram | `action`, `active_work_kind`, `state`, `status`                                           |
| `openclaw_liveness_warning_total`                | penghitung | `reason`                                                                                  |
| `openclaw_liveness_sessions`                     | pengukur  | `state`                                                                                   |
| `openclaw_liveness_event_loop_delay_p99_seconds` | histogram | `reason`                                                                                  |
| `openclaw_liveness_event_loop_delay_max_seconds` | histogram | `reason`                                                                                  |
| `openclaw_liveness_event_loop_utilization_ratio` | histogram | `reason`                                                                                  |
| `openclaw_liveness_cpu_core_ratio`               | histogram | `reason`                                                                                  |
| `openclaw_payload_large_total`                   | penghitung | `action`, `channel`, `plugin`, `reason`, `surface`                                        |
| `openclaw_payload_large_bytes`                   | histogram | `action`, `channel`, `plugin`, `reason`, `surface`                                        |
| `openclaw_memory_bytes`                          | pengukur  | `kind`                                                                                    |
| `openclaw_memory_rss_bytes`                      | histogram | tidak ada                                                                                 |
| `openclaw_memory_pressure_total`                 | penghitung | `level`, `reason`                                                                         |
| `openclaw_telemetry_exporter_total`              | penghitung | `exporter`, `reason`, `signal`, `status`                                                  |
| `openclaw_prometheus_series_dropped_total`       | penghitung | tidak ada                                                                                 |
| `openclaw_diagnostic_async_queue_dropped_total`  | penghitung | `drop_class`                                                                              |
| `openclaw_diagnostic_async_queue_length`         | pengukur  | tidak ada                                                                                 |

Untuk metrik panggilan model, `observation_unit="request"` mengukur satu permintaan
provider yang dapat diamati. `observation_unit="turn"` mengukur satu giliran agen Claude Code
atau Codex CLI sintetis yang dapat berisi beberapa permintaan provider tersembunyi.
Pisahkan deret tersebut saat membandingkan latensi.

## Kebijakan label

<AccordionGroup>
  <Accordion title="Label terbatas dengan kardinalitas rendah">
    Label Prometheus tetap terbatas dan berkardinalitas rendah. Eksportir tidak memancarkan pengidentifikasi diagnostik mentah seperti `runId`, `sessionKey`, `sessionId`, `callId`, `toolCallId`, ID pesan, ID obrolan, atau ID permintaan provider.

    Nilai label disunting dan harus sesuai dengan kebijakan karakter berkardinalitas rendah OpenClaw. Nilai yang tidak memenuhi kebijakan diganti dengan `unknown`, `other`, atau `none`, bergantung pada metriknya. Label yang tampak seperti kunci sesi agen bercakupan juga diganti dengan `unknown`.

  </Accordion>
  <Accordion title="Batas deret dan penghitungan luapan">
    Eksportir membatasi deret waktu yang dipertahankan dalam memori hingga **2048** deret untuk gabungan penghitung, pengukur, dan histogram. Deret baru yang melampaui batas tersebut dibuang, dan `openclaw_prometheus_series_dropped_total` bertambah satu setiap kali hal itu terjadi.

    Pantau penghitung ini sebagai sinyal tegas bahwa atribut di hulu membocorkan nilai berkardinalitas tinggi. Eksportir tidak pernah menaikkan batas secara otomatis; jika penghitung ini meningkat, perbaiki sumbernya alih-alih menonaktifkan batas.

  </Accordion>
  <Accordion title="Hal yang tidak pernah muncul dalam keluaran Prometheus">
    - teks prompt, teks respons, masukan alat, keluaran alat, prompt sistem
    - transkrip percakapan, muatan audio, ID panggilan, ID ruang, token serah terima, ID giliran, dan ID sesi mentah
    - ID permintaan provider mentah (hanya hash terbatas, jika berlaku, pada span — tidak pernah pada metrik)
    - kunci sesi dan ID sesi
    - nama host, jalur file, nilai rahasia

  </Accordion>
</AccordionGroup>

## Resep PromQL

```promql
# Token per menit, dipisahkan berdasarkan provider
sum by (provider) (rate(openclaw_model_tokens_total[1m]))

# Pengeluaran (USD) selama satu jam terakhir, berdasarkan model
sum by (model) (increase(openclaw_model_cost_usd_total[1h]))

# Persentil ke-95 durasi eksekusi model
histogram_quantile(
  0.95,
  sum by (le, provider, model)
    (rate(openclaw_run_duration_seconds_bucket[5m]))
)

# SLO waktu tunggu antrean (persentil ke-95 di bawah 2 detik)
histogram_quantile(
  0.95,
  sum by (le, lane) (rate(openclaw_queue_lane_wait_seconds_bucket[5m]))
) < 2

# Penggunaan Skills, dipisahkan berdasarkan sumber terbatas
sum by (skill, source) (increase(openclaw_skill_used_total[24h]))

# Deret Prometheus yang dibuang (alarm kardinalitas)
increase(openclaw_prometheus_series_dropped_total[15m]) > 0
```

<Tip>
Utamakan `gen_ai_client_token_usage` untuk dasbor lintas-provider: metrik ini mengikuti konvensi semantik GenAI OpenTelemetry dan konsisten dengan metrik dari layanan GenAI non-OpenClaw.
</Tip>

## Memilih antara ekspor Prometheus dan OpenTelemetry

OpenClaw mendukung kedua antarmuka secara independen. Anda dapat menjalankan salah satunya, keduanya, atau tidak satu pun.

<Tabs>
  <Tab title="diagnostics-prometheus">
    - Model **tarik**: Prometheus mengambil `/api/diagnostics/prometheus`.
    - Tidak memerlukan pengumpul eksternal.
    - Diautentikasi melalui autentikasi Gateway normal.
    - Antarmuka hanya mencakup metrik (tanpa jejak atau log).
    - Paling sesuai untuk tumpukan yang telah distandardisasi pada Prometheus + Grafana.

  </Tab>
  <Tab title="diagnostics-otel">
    - Model **dorong**: OpenClaw mengirim OTLP/HTTP ke pengumpul atau backend yang kompatibel dengan OTLP.
    - Antarmuka mencakup metrik, jejak, dan log.
    - Terhubung ke Prometheus melalui OpenTelemetry Collector (eksportir `prometheus` atau `prometheusremotewrite`) saat Anda memerlukan keduanya.
    - Lihat [Ekspor OpenTelemetry](/id/gateway/opentelemetry) untuk katalog lengkap.

  </Tab>
</Tabs>

## Pemecahan masalah

<AccordionGroup>
  <Accordion title="Isi respons kosong">
    - Periksa bahwa `diagnostics.enabled` tidak diatur ke `false` dalam konfigurasi (nilai bawaannya adalah `true`).
    - Pastikan Plugin diaktifkan dan dimuat dengan `openclaw plugins list --enabled`.
    - Hasilkan sejumlah lalu lintas; penghitung dan histogram hanya memancarkan baris setelah setidaknya satu peristiwa.

  </Accordion>
  <Accordion title="401 / tidak terotorisasi">
    Endpoint memerlukan cakupan operator Gateway (`auth: "gateway"` dengan `gatewayRuntimeScopeSurface: "trusted-operator"`). Gunakan token atau kata sandi yang sama dengan yang digunakan Prometheus untuk rute operator Gateway lainnya. Tidak tersedia mode publik tanpa autentikasi.
  </Accordion>
  <Accordion title="`openclaw_prometheus_series_dropped_total` terus meningkat">
    Atribut baru melampaui batas **2048** deret. Periksa metrik terbaru untuk menemukan label dengan kardinalitas tinggi yang tidak terduga, lalu perbaiki di sumbernya. Eksportir sengaja membuang deret baru alih-alih menulis ulang label secara diam-diam.
  </Accordion>
  <Accordion title="Prometheus menampilkan deret kedaluwarsa setelah dimulai ulang">
    Plugin hanya menyimpan status dalam memori. Setelah Gateway dimulai ulang, penghitung kembali ke nol dan pengukur dimulai ulang pada nilai berikutnya yang dilaporkan. Gunakan `rate()` dan `increase()` PromQL untuk menangani pengaturan ulang dengan benar.
  </Accordion>
</AccordionGroup>

## Terkait

- [Ekspor diagnostik](/id/gateway/diagnostics) — berkas zip diagnostik lokal untuk bundel dukungan
- [Kesehatan dan kesiapan](/id/gateway/health) — probe `/healthz` dan `/readyz`
- [Pencatatan](/id/logging) — pencatatan berbasis file
- [Ekspor OpenTelemetry](/id/gateway/opentelemetry) — dorongan OTLP untuk jejak, metrik, dan log
