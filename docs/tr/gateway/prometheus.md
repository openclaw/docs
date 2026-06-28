---
read_when:
    - Prometheus, Grafana, VictoriaMetrics veya başka bir toplayıcının OpenClaw Gateway metriklerini toplamasını istiyorsunuz
    - Panolar veya uyarılar için Prometheus metrik adlarına ve etiket politikasına ihtiyacınız var
    - OpenTelemetry kolektörü çalıştırmadan metrikler istiyorsunuz
sidebarTitle: Prometheus
summary: OpenClaw tanılamalarını diagnostics-prometheus Plugin aracılığıyla Prometheus metin metrikleri olarak sun
title: Prometheus metrikleri
x-i18n:
    generated_at: "2026-06-28T00:37:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f9d3f6cf5af2e3770cd3a86e968fe25d2c3b3b87524ba1d229ef585671d320a8
    source_path: gateway/prometheus.md
    workflow: 16
---

  OpenClaw, resmi `diagnostics-prometheus` Plugin aracılığıyla tanılama metriklerini sunabilir. Güvenilir tanılamaları ve çekirdeğin yaydığı Gateway kararlılık olaylarını dinler, ardından şu adreste bir Prometheus metin uç noktası oluşturur:

  ```text
  GET /api/diagnostics/prometheus
  ```

  İçerik türü, standart Prometheus gösterim biçimi olan `text/plain; version=0.0.4; charset=utf-8` değeridir.

  <Warning>
  Rota, Gateway kimlik doğrulamasını (operatör kapsamı) kullanır. Bunu herkese açık, kimlik doğrulamasız bir `/metrics` uç noktası olarak sunmayın. Diğer operatör API'leri için kullandığınız aynı kimlik doğrulama yolu üzerinden toplayın.
  </Warning>

  İzler, günlükler, OTLP push ve OpenTelemetry GenAI semantik öznitelikleri için bkz. [OpenTelemetry dışa aktarma](/tr/gateway/opentelemetry).

  ## Hızlı başlangıç

  <Steps>
  <Step title="Plugin'i yükleyin">
    ```bash
    openclaw plugins install clawhub:@openclaw/diagnostics-prometheus
    ```
  </Step>
  <Step title="Plugin'i etkinleştirin">
    <Tabs>
      <Tab title="Yapılandırma">
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
  <Step title="Gateway'i yeniden başlatın">
    HTTP rotası Plugin başlangıcında kaydedilir, bu yüzden etkinleştirdikten sonra yeniden yükleyin.
  </Step>
  <Step title="Korumalı rotayı toplayın">
    Operatör istemcilerinizin kullandığı aynı gateway kimlik doğrulamasını gönderin:

    ```bash
    curl -H "Authorization: Bearer $OPENCLAW_GATEWAY_TOKEN" \
      http://127.0.0.1:18789/api/diagnostics/prometheus
    ```

  </Step>
  <Step title="Prometheus'u Bağla">
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
`diagnostics.enabled: true` gereklidir. Bu olmadan Plugin HTTP rotasını yine kaydeder, ancak dışa aktarıcıya hiçbir tanılama olayı akmaz; bu nedenle yanıt boş olur.
</Note>

## Dışa aktarılan metrikler

| Metrik                                           | Tür       | Etiketler                                                                                 |
| ------------------------------------------------ | --------- | ----------------------------------------------------------------------------------------- |
| `openclaw_run_completed_total`                   | sayaç     | `channel`, `model`, `outcome`, `provider`, `trigger`                                      |
| `openclaw_run_duration_seconds`                  | histogram | `channel`, `model`, `outcome`, `provider`, `trigger`                                      |
| `openclaw_model_call_total`                      | sayaç     | `api`, `error_category`, `model`, `outcome`, `provider`, `transport`                      |
| `openclaw_model_call_duration_seconds`           | histogram | `api`, `error_category`, `model`, `outcome`, `provider`, `transport`                      |
| `openclaw_model_failover_total`                  | sayaç     | `from_model`, `from_provider`, `lane`, `reason`, `suspended`, `to_model`, `to_provider`   |
| `openclaw_model_tokens_total`                    | sayaç     | `agent`, `channel`, `model`, `provider`, `token_type`                                     |
| `openclaw_gen_ai_client_token_usage`             | histogram | `model`, `provider`, `token_type`                                                         |
| `openclaw_model_cost_usd_total`                  | sayaç     | `agent`, `channel`, `model`, `provider`                                                   |
| `openclaw_skill_used_total`                      | sayaç     | `activation`, `agent`, `skill`, `source`                                                  |
| `openclaw_tool_execution_total`                  | sayaç     | `error_category`, `outcome`, `params_kind`, `tool`, `tool_owner`, `tool_source`           |
| `openclaw_tool_execution_duration_seconds`       | histogram | `error_category`, `outcome`, `params_kind`, `tool`, `tool_owner`, `tool_source`           |
| `openclaw_tool_execution_blocked_total`          | sayaç     | `denied_reason`, `params_kind`, `tool`, `tool_owner`, `tool_source`                       |
| `openclaw_harness_run_total`                     | sayaç     | `channel`, `error_category`, `harness`, `model`, `outcome`, `phase`, `plugin`, `provider` |
| `openclaw_harness_run_duration_seconds`          | histogram | `channel`, `error_category`, `harness`, `model`, `outcome`, `phase`, `plugin`, `provider` |
| `openclaw_webhook_received_total`                | sayaç     | `channel`, `webhook`                                                                      |
| `openclaw_webhook_error_total`                   | sayaç     | `channel`, `webhook`                                                                      |
| `openclaw_webhook_duration_seconds`              | histogram | `channel`, `webhook`                                                                      |
| `openclaw_message_received_total`                | sayaç     | `channel`, `source`                                                                       |
| `openclaw_message_dispatch_started_total`        | sayaç     | `channel`, `source`                                                                       |
| `openclaw_message_dispatch_completed_total`      | sayaç     | `channel`, `outcome`, `reason`, `source`                                                  |
| `openclaw_message_dispatch_duration_seconds`     | histogram | `channel`, `outcome`, `reason`, `source`                                                  |
| `openclaw_message_processed_total`               | sayaç     | `channel`, `outcome`, `reason`                                                            |
| `openclaw_message_processed_duration_seconds`    | histogram | `channel`, `outcome`, `reason`                                                            |
| `openclaw_message_delivery_started_total`        | sayaç     | `channel`, `delivery_kind`                                                                |
| `openclaw_message_delivery_total`                | sayaç     | `channel`, `delivery_kind`, `error_category`, `outcome`                                   |
| `openclaw_message_delivery_duration_seconds`     | histogram | `channel`, `delivery_kind`, `error_category`, `outcome`                                   |
| `openclaw_talk_event_total`                      | sayaç     | `brain`, `event_type`, `mode`, `provider`, `transport`                                    |
| `openclaw_talk_event_duration_seconds`           | histogram | `brain`, `event_type`, `mode`, `provider`, `transport`                                    |
| `openclaw_talk_audio_bytes`                      | histogram | `brain`, `event_type`, `mode`, `provider`, `transport`                                    |
| `openclaw_queue_lane_size`                       | gösterge  | `lane`                                                                                    |
| `openclaw_queue_lane_wait_seconds`               | histogram | `lane`                                                                                    |
| `openclaw_session_state_total`                   | sayaç     | `reason`, `state`                                                                         |
| `openclaw_session_queue_depth`                   | gösterge  | `state`                                                                                   |
| `openclaw_session_turn_created_total`            | sayaç     | `agent`, `channel`, `trigger`                                                             |
| `openclaw_session_stuck_total`                   | sayaç     | `reason`, `state`                                                                         |
| `openclaw_session_stuck_age_seconds`             | histogram | `reason`, `state`                                                                         |
| `openclaw_session_recovery_total`                | sayaç     | `action`, `active_work_kind`, `state`, `status`                                           |
| `openclaw_session_recovery_age_seconds`          | histogram | `action`, `active_work_kind`, `state`, `status`                                           |
| `openclaw_liveness_warning_total`                | sayaç     | `reason`                                                                                  |
| `openclaw_liveness_sessions`                     | gösterge  | `state`                                                                                   |
| `openclaw_liveness_event_loop_delay_p99_seconds` | histogram | `reason`                                                                                  |
| `openclaw_liveness_event_loop_delay_max_seconds` | histogram | `reason`                                                                                  |
| `openclaw_liveness_event_loop_utilization_ratio` | histogram | `reason`                                                                                  |
| `openclaw_liveness_cpu_core_ratio`               | histogram | `reason`                                                                                  |
| `openclaw_payload_large_total`                   | sayaç     | `action`, `channel`, `plugin`, `reason`, `surface`                                        |
| `openclaw_payload_large_bytes`                   | histogram | `action`, `channel`, `plugin`, `reason`, `surface`                                        |
| `openclaw_memory_bytes`                          | gösterge  | `kind`                                                                                    |
| `openclaw_memory_rss_bytes`                      | histogram | yok                                                                                       |
| `openclaw_memory_pressure_total`                 | sayaç     | `level`, `reason`                                                                         |
| `openclaw_telemetry_exporter_total`              | sayaç     | `exporter`, `reason`, `signal`, `status`                                                  |
| `openclaw_prometheus_series_dropped_total`       | sayaç     | yok                                                                                       |

## Etiket ilkesi

<AccordionGroup>
  <Accordion title="Sınırlı, düşük kardinaliteli etiketler">
    Prometheus etiketleri sınırlı ve düşük kardinaliteli kalır. Dışa aktarıcı `runId`, `sessionKey`, `sessionId`, `callId`, `toolCallId`, ileti kimlikleri, sohbet kimlikleri veya sağlayıcı istek kimlikleri gibi ham tanılama tanımlayıcıları yaymaz.

    Etiket değerleri redakte edilir ve OpenClaw'ın düşük kardinaliteli karakter ilkesiyle eşleşmelidir. İlkeyi karşılamayan değerler metriğe bağlı olarak `unknown`, `other` veya `none` ile değiştirilir. Kapsamlı aracı oturum anahtarlarına benzeyen etiketler de `unknown` ile değiştirilir.

  </Accordion>
  <Accordion title="Seri sınırı ve taşma muhasebesi">
    Dışa aktarıcı; sayaçlar, göstergeler ve histogramlar genelinde bellekte tutulan zaman serilerini toplam **2048** seriyle sınırlar. Bu sınırın ötesindeki yeni seriler bırakılır ve `openclaw_prometheus_series_dropped_total` her seferinde bir artar.

    Bu sayacı, yukarı akıştaki bir özniteliğin yüksek kardinaliteli değerler sızdırdığına dair kesin bir sinyal olarak izleyin. Dışa aktarıcı sınırı hiçbir zaman otomatik olarak kaldırmaz; sayaç yükselirse sınırı devre dışı bırakmak yerine kaynağı düzeltin.

  </Accordion>
  <Accordion title="What never appears in Prometheus output">
    - istem metni, yanıt metni, araç girdileri, araç çıktıları, sistem istemleri
    - Talk dökümleri, ses yükleri, çağrı kimlikleri, oda kimlikleri, devretme belirteçleri, tur kimlikleri ve ham oturum kimlikleri
    - ham sağlayıcı istek kimlikleri (yalnızca uygulanabildiğinde span'lerde sınırlı hash'ler; metriklerde asla)
    - oturum anahtarları ve oturum kimlikleri
    - ana makine adları, dosya yolları, gizli değerler

  </Accordion>
</AccordionGroup>

## PromQL tarifleri

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
Sağlayıcılar arası panolar için `gen_ai_client_token_usage` kullanmayı tercih edin: OpenTelemetry GenAI semantik kurallarını izler ve OpenClaw dışı GenAI hizmetlerinden gelen metriklerle tutarlıdır.
</Tip>

## Prometheus ve OpenTelemetry dışa aktarımı arasında seçim yapma

OpenClaw her iki yüzeyi de bağımsız olarak destekler. Birini, ikisini birden ya da hiçbirini çalıştırabilirsiniz.

<Tabs>
  <Tab title="diagnostics-prometheus">
    - **Pull** modeli: Prometheus `/api/diagnostics/prometheus` adresini kazır.
    - Harici toplayıcı gerekmez.
    - Normal Gateway kimlik doğrulaması üzerinden kimlik doğrulaması yapılır.
    - Yüzey yalnızca metriklerden oluşur (iz veya günlük yoktur).
    - Zaten Prometheus + Grafana üzerinde standartlaşmış yığınlar için en uygunudur.

  </Tab>
  <Tab title="diagnostics-otel">
    - **Push** modeli: OpenClaw, OTLP/HTTP'yi bir toplayıcıya veya OTLP uyumlu arka uca gönderir.
    - Yüzey metrikleri, izleri ve günlükleri içerir.
    - İkisine de ihtiyaç duyduğunuzda bir OpenTelemetry Collector (`prometheus` veya `prometheusremotewrite` dışa aktarıcısı) üzerinden Prometheus'a köprü kurar.
    - Tam katalog için [OpenTelemetry dışa aktarımı](/tr/gateway/opentelemetry) bölümüne bakın.

  </Tab>
</Tabs>

## Sorun giderme

<AccordionGroup>
  <Accordion title="Empty response body">
    - Yapılandırmada `diagnostics.enabled: true` ayarını kontrol edin.
    - Plugin'in etkinleştirildiğini ve `openclaw plugins list --enabled` ile yüklendiğini doğrulayın.
    - Biraz trafik üretin; sayaçlar ve histogramlar yalnızca en az bir olaydan sonra satır yayar.

  </Accordion>
  <Accordion title="401 / unauthorized">
    Uç nokta Gateway operatör kapsamını gerektirir (`gatewayRuntimeScopeSurface: "trusted-operator"` ile `auth: "gateway"`). Prometheus'un diğer Gateway operatör rotaları için kullandığı aynı belirteci veya parolayı kullanın. Herkese açık, kimlik doğrulamasız mod yoktur.
  </Accordion>
  <Accordion title="`openclaw_prometheus_series_dropped_total` is climbing">
    Yeni bir öznitelik **2048** seri sınırını aşıyor. Beklenmedik derecede yüksek kardinaliteli bir etiket için son metrikleri inceleyin ve sorunu kaynağında düzeltin. Dışa aktarıcı, etiketleri sessizce yeniden yazmak yerine yeni serileri kasıtlı olarak düşürür.
  </Accordion>
  <Accordion title="Prometheus shows stale series after a restart">
    Plugin durumu yalnızca bellekte tutar. Gateway yeniden başlatıldıktan sonra sayaçlar sıfırlanır ve göstergeler bir sonraki bildirilen değerlerinde yeniden başlar. Sıfırlamaları temiz şekilde işlemek için PromQL `rate()` ve `increase()` kullanın.
  </Accordion>
</AccordionGroup>

## İlgili

- [Tanılama dışa aktarımı](/tr/gateway/diagnostics) — destek paketleri için yerel tanılama zip'i
- [Sağlık ve hazır olma](/tr/gateway/health) — `/healthz` ve `/readyz` yoklamaları
- [Günlükleme](/tr/logging) — dosya tabanlı günlükleme
- [OpenTelemetry dışa aktarımı](/tr/gateway/opentelemetry) — izler, metrikler ve günlükler için OTLP push
