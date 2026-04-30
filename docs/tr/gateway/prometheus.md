---
read_when:
    - Prometheus, Grafana, VictoriaMetrics veya başka bir kazıyıcının OpenClaw Gateway metriklerini toplamasını istiyorsunuz
    - Panolar veya uyarılar için Prometheus metrik adlarına ve etiket politikasına ihtiyacınız var
    - OpenTelemetry toplayıcısı çalıştırmadan metrikler istiyorsunuz
sidebarTitle: Prometheus
summary: OpenClaw tanılama verilerini diagnostics-prometheus Plugin'i aracılığıyla Prometheus metin metrikleri olarak kullanıma açın
title: Prometheus metrikleri
x-i18n:
    generated_at: "2026-04-30T09:24:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: d75a97a0b9dedd89eb25fee83626d8d726917872cc1c3bfcbf6e9634dd168a2b
    source_path: gateway/prometheus.md
    workflow: 16
---

OpenClaw, paketle birlikte gelen `diagnostics-prometheus` Plugin'i aracılığıyla tanılama metriklerini sunabilir. Güvenilir dahili tanılamaları dinler ve şu adreste Prometheus metin uç noktası oluşturur:

```text
GET /api/diagnostics/prometheus
```

İçerik türü, standart Prometheus sunum biçimi olan `text/plain; version=0.0.4; charset=utf-8` şeklindedir.

<Warning>
Rota Gateway kimlik doğrulamasını kullanır (operatör kapsamı). Bunu herkese açık, kimliği doğrulanmamış bir `/metrics` uç noktası olarak sunmayın. Diğer operatör API'leri için kullandığınız aynı kimlik doğrulama yoluyla kazıyın.
</Warning>

İzler, günlükler, OTLP push ve OpenTelemetry GenAI anlamsal öznitelikleri için bkz. [OpenTelemetry dışa aktarma](/tr/gateway/opentelemetry).

## Hızlı başlangıç

<Steps>
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
    HTTP rotası Plugin başlangıcında kaydedilir, bu nedenle etkinleştirdikten sonra yeniden yükleyin.
  </Step>
  <Step title="Korunan rotayı kazıyın">
    Operatör istemcilerinizin kullandığı aynı Gateway kimlik doğrulamasını gönderin:

    ```bash
    curl -H "Authorization: Bearer $OPENCLAW_GATEWAY_TOKEN" \
      http://127.0.0.1:18789/api/diagnostics/prometheus
    ```

  </Step>
  <Step title="Prometheus'u bağlayın">
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
`diagnostics.enabled: true` gereklidir. Bu olmadan Plugin yine HTTP rotasını kaydeder, ancak dışa aktarıcıya hiçbir tanılama olayı akmaz; bu yüzden yanıt boş olur.
</Note>

## Dışa aktarılan metrikler

| Metrik                                        | Tür       | Etiketler                                                                                 |
| --------------------------------------------- | --------- | ----------------------------------------------------------------------------------------- |
| `openclaw_run_completed_total`                | sayaç     | `channel`, `model`, `outcome`, `provider`, `trigger`                                      |
| `openclaw_run_duration_seconds`               | histogram | `channel`, `model`, `outcome`, `provider`, `trigger`                                      |
| `openclaw_model_call_total`                   | sayaç     | `api`, `error_category`, `model`, `outcome`, `provider`, `transport`                      |
| `openclaw_model_call_duration_seconds`        | histogram | `api`, `error_category`, `model`, `outcome`, `provider`, `transport`                      |
| `openclaw_model_tokens_total`                 | sayaç     | `agent`, `channel`, `model`, `provider`, `token_type`                                     |
| `openclaw_gen_ai_client_token_usage`          | histogram | `model`, `provider`, `token_type`                                                         |
| `openclaw_model_cost_usd_total`               | sayaç     | `agent`, `channel`, `model`, `provider`                                                   |
| `openclaw_tool_execution_total`               | sayaç     | `error_category`, `outcome`, `params_kind`, `tool`                                        |
| `openclaw_tool_execution_duration_seconds`    | histogram | `error_category`, `outcome`, `params_kind`, `tool`                                        |
| `openclaw_harness_run_total`                  | sayaç     | `channel`, `error_category`, `harness`, `model`, `outcome`, `phase`, `plugin`, `provider` |
| `openclaw_harness_run_duration_seconds`       | histogram | `channel`, `error_category`, `harness`, `model`, `outcome`, `phase`, `plugin`, `provider` |
| `openclaw_message_processed_total`            | sayaç     | `channel`, `outcome`, `reason`                                                            |
| `openclaw_message_processed_duration_seconds` | histogram | `channel`, `outcome`, `reason`                                                            |
| `openclaw_message_delivery_total`             | sayaç     | `channel`, `delivery_kind`, `error_category`, `outcome`                                   |
| `openclaw_message_delivery_duration_seconds`  | histogram | `channel`, `delivery_kind`, `error_category`, `outcome`                                   |
| `openclaw_queue_lane_size`                    | gösterge  | `lane`                                                                                    |
| `openclaw_queue_lane_wait_seconds`            | histogram | `lane`                                                                                    |
| `openclaw_session_state_total`                | sayaç     | `reason`, `state`                                                                         |
| `openclaw_session_queue_depth`                | gösterge  | `state`                                                                                   |
| `openclaw_memory_bytes`                       | gösterge  | `kind`                                                                                    |
| `openclaw_memory_rss_bytes`                   | histogram | yok                                                                                       |
| `openclaw_memory_pressure_total`              | sayaç     | `level`, `reason`                                                                         |
| `openclaw_telemetry_exporter_total`           | sayaç     | `exporter`, `reason`, `signal`, `status`                                                  |
| `openclaw_prometheus_series_dropped_total`    | sayaç     | yok                                                                                       |

## Etiket ilkesi

<AccordionGroup>
  <Accordion title="Sınırlı, düşük kardinaliteli etiketler">
    Prometheus etiketleri sınırlı ve düşük kardinaliteli kalır. Dışa aktarıcı `runId`, `sessionKey`, `sessionId`, `callId`, `toolCallId`, ileti kimlikleri, sohbet kimlikleri veya sağlayıcı istek kimlikleri gibi ham tanılama tanımlayıcıları yaymaz.

    Etiket değerleri gizlenir ve OpenClaw'ın düşük kardinaliteli karakter ilkesiyle eşleşmelidir. İlkeyi geçemeyen değerler, metriğe bağlı olarak `unknown`, `other` veya `none` ile değiştirilir.

  </Accordion>
  <Accordion title="Seri sınırı ve taşma muhasebesi">
    Dışa aktarıcı, sayaçlar, göstergeler ve histogramlar genelinde bellekte tutulan zaman serilerini toplamda **2048** seriyle sınırlar. Bu sınırın ötesindeki yeni seriler düşürülür ve `openclaw_prometheus_series_dropped_total` her seferinde bir artar.

    Bu sayacı, yukarı akıştaki bir özniteliğin yüksek kardinaliteli değerler sızdırdığına dair kesin bir sinyal olarak izleyin. Dışa aktarıcı sınırı hiçbir zaman otomatik olarak kaldırmaz; sayı yükselirse sınırı devre dışı bırakmak yerine kaynağı düzeltin.

  </Accordion>
  <Accordion title="Prometheus çıktısında asla görünmeyenler">
    - istem metni, yanıt metni, araç girdileri, araç çıktıları, sistem istemleri
    - ham sağlayıcı istek kimlikleri (yalnızca uygun olduğu durumlarda izlerde sınırlı karmalar; metriklerde asla)
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

# Dropped Prometheus series (cardinality alarm)
increase(openclaw_prometheus_series_dropped_total[15m]) > 0
```

<Tip>
Sağlayıcılar arası panolar için `gen_ai_client_token_usage` tercih edin: OpenTelemetry GenAI anlamsal kurallarını izler ve OpenClaw dışı GenAI hizmetlerinden gelen metriklerle tutarlıdır.
</Tip>

## Prometheus ve OpenTelemetry dışa aktarma arasında seçim yapma

OpenClaw her iki yüzeyi de bağımsız olarak destekler. Birini, ikisini birden veya hiçbirini çalıştırabilirsiniz.

<Tabs>
  <Tab title="diagnostics-prometheus">
    - **Pull** modeli: Prometheus `/api/diagnostics/prometheus` adresini kazır.
    - Harici toplayıcı gerekmez.
    - Normal Gateway kimlik doğrulaması üzerinden kimliği doğrulanır.
    - Yüzey yalnızca metriklerden oluşur (iz veya günlük yoktur).
    - Prometheus + Grafana üzerinde zaten standartlaşmış yığınlar için en uygundur.

  </Tab>
  <Tab title="diagnostics-otel">
    - **Push** modeli: OpenClaw, OTLP/HTTP'yi bir toplayıcıya veya OTLP uyumlu arka uca gönderir.
    - Yüzey metrikleri, izleri ve günlükleri içerir.
    - İkisine de ihtiyaç duyduğunuzda bir OpenTelemetry Collector (`prometheus` veya `prometheusremotewrite` dışa aktarıcısı) üzerinden Prometheus'a köprü kurar.
    - Tam katalog için bkz. [OpenTelemetry dışa aktarma](/tr/gateway/opentelemetry).

  </Tab>
</Tabs>

## Sorun giderme

<AccordionGroup>
  <Accordion title="Boş yanıt gövdesi">
    - Yapılandırmada `diagnostics.enabled: true` değerini kontrol edin.
    - Plugin'in etkinleştirildiğini ve `openclaw plugins list --enabled` ile yüklendiğini doğrulayın.
    - Biraz trafik oluşturun; sayaçlar ve histogramlar yalnızca en az bir olaydan sonra satır yayar.

  </Accordion>
  <Accordion title="401 / yetkisiz">
    Uç nokta Gateway operatör kapsamını gerektirir (`auth: "gateway"` ve `gatewayRuntimeScopeSurface: "trusted-operator"`). Prometheus'un başka herhangi bir Gateway operatör rotası için kullandığı aynı belirteci veya parolayı kullanın. Herkese açık, kimliği doğrulanmamış mod yoktur.
  </Accordion>
  <Accordion title="`openclaw_prometheus_series_dropped_total` yükseliyor">
    Yeni bir öznitelik **2048** seri sınırını aşıyor. Beklenmedik şekilde yüksek kardinaliteli bir etiket için son metrikleri inceleyin ve kaynağında düzeltin. Dışa aktarıcı, etiketleri sessizce yeniden yazmak yerine yeni serileri bilerek düşürür.
  </Accordion>
  <Accordion title="Prometheus yeniden başlatmadan sonra bayat seriler gösteriyor">
    Plugin durumu yalnızca bellekte tutar. Gateway yeniden başlatıldıktan sonra sayaçlar sıfıra döner ve göstergeler bir sonraki bildirilen değerlerinde yeniden başlar. Sıfırlamaları temiz şekilde ele almak için PromQL `rate()` ve `increase()` kullanın.
  </Accordion>
</AccordionGroup>

## İlgili

- [Tanılama dışa aktarma](/tr/gateway/diagnostics) — destek paketleri için yerel tanılama zip dosyası
- [Sağlık ve hazır olma](/tr/gateway/health) — `/healthz` ve `/readyz` yoklamaları
- [Günlük kaydı](/tr/logging) — dosya tabanlı günlük kaydı
- [OpenTelemetry dışa aktarma](/tr/gateway/opentelemetry) — izler, metrikler ve günlükler için OTLP push
