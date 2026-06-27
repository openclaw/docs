---
read_when:
    - Você quer que Prometheus, Grafana, VictoriaMetrics ou outro scraper colete métricas do Gateway do OpenClaw
    - Você precisa dos nomes das métricas do Prometheus e da política de labels para dashboards ou alertas
    - Você quer métricas sem executar um coletor OpenTelemetry
sidebarTitle: Prometheus
summary: Exponha os diagnósticos do OpenClaw como métricas em texto do Prometheus por meio do Plugin diagnostics-prometheus
title: Métricas do Prometheus
x-i18n:
    generated_at: "2026-06-27T17:33:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f9d3f6cf5af2e3770cd3a86e968fe25d2c3b3b87524ba1d229ef585671d320a8
    source_path: gateway/prometheus.md
    workflow: 16
---

  O OpenClaw pode expor métricas de diagnóstico por meio do plugin oficial `diagnostics-prometheus`. Ele escuta diagnósticos confiáveis e eventos de estabilidade do Gateway emitidos pelo núcleo, depois renderiza um endpoint de texto do Prometheus em:

  ```text
  GET /api/diagnostics/prometheus
  ```

  O tipo de conteúdo é `text/plain; version=0.0.4; charset=utf-8`, o formato de exposição padrão do Prometheus.

  <Warning>
  A rota usa autenticação do Gateway (escopo de operador). Não a exponha como um endpoint público `/metrics` sem autenticação. Colete-a pelo mesmo caminho de autenticação que você usa para outras APIs de operador.
  </Warning>

  Para traces, logs, envio por OTLP e atributos semânticos GenAI do OpenTelemetry, consulte [Exportação do OpenTelemetry](/pt-BR/gateway/opentelemetry).

  ## Início rápido

  <Steps>
  <Step title="Instale o plugin">
    ```bash
    openclaw plugins install clawhub:@openclaw/diagnostics-prometheus
    ```
  </Step>
  <Step title="Habilite o plugin">
    <Tabs>
      <Tab title="Configuração">
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
  <Step title="Reinicie o Gateway">
    A rota HTTP é registrada na inicialização do plugin, então recarregue após habilitá-lo.
  </Step>
  <Step title="Colete a rota protegida">
    Envie a mesma autenticação do Gateway que seus clientes operadores usam:

    ```bash
    curl -H "Authorization: Bearer $OPENCLAW_GATEWAY_TOKEN" \
      http://127.0.0.1:18789/api/diagnostics/prometheus
    ```

  </Step>
  <Step title="Conectar o Prometheus">
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
`diagnostics.enabled: true` é obrigatório. Sem isso, o plugin ainda registra a rota HTTP, mas nenhum evento de diagnóstico flui para o exportador, então a resposta fica vazia.
</Note>

## Métricas exportadas

| Métrica                                          | Tipo      | Rótulos                                                                                   |
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
| `openclaw_memory_rss_bytes`                      | histogram | nenhum                                                                                    |
| `openclaw_memory_pressure_total`                 | counter   | `level`, `reason`                                                                         |
| `openclaw_telemetry_exporter_total`              | counter   | `exporter`, `reason`, `signal`, `status`                                                  |
| `openclaw_prometheus_series_dropped_total`       | counter   | nenhum                                                                                    |

## Política de rótulos

<AccordionGroup>
  <Accordion title="Rótulos delimitados e de baixa cardinalidade">
    Os rótulos do Prometheus permanecem delimitados e com baixa cardinalidade. O exportador não emite identificadores brutos de diagnóstico, como `runId`, `sessionKey`, `sessionId`, `callId`, `toolCallId`, IDs de mensagens, IDs de chats ou IDs de solicitação de provedores.

    Os valores dos rótulos são redigidos e devem corresponder à política de caracteres de baixa cardinalidade do OpenClaw. Valores que não passam na política são substituídos por `unknown`, `other` ou `none`, dependendo da métrica. Rótulos que parecem chaves de sessão de agente com escopo também são substituídos por `unknown`.

  </Accordion>
  <Accordion title="Limite de séries e contabilização de excedente">
    O exportador limita as séries temporais mantidas na memória a **2048** séries no total entre contadores, medidores e histogramas. Novas séries além desse limite são descartadas, e `openclaw_prometheus_series_dropped_total` é incrementado em um a cada vez.

    Monitore esse contador como um sinal forte de que um atributo upstream está vazando valores de alta cardinalidade. O exportador nunca aumenta o limite automaticamente; se ele subir, corrija a origem em vez de desabilitar o limite.

  </Accordion>
  <Accordion title="O que nunca aparece na saída do Prometheus">
    - texto de prompt, texto de resposta, entradas de ferramentas, saídas de ferramentas, prompts de sistema
    - transcrições de conversa, payloads de áudio, IDs de chamadas, IDs de sala, tokens de transferência, IDs de turno e IDs de sessão brutos
    - IDs de solicitação brutos do provedor (apenas hashes limitados, quando aplicável, em spans — nunca em métricas)
    - chaves de sessão e IDs de sessão
    - nomes de host, caminhos de arquivos, valores secretos

  </Accordion>
</AccordionGroup>

## Receitas de PromQL

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
Prefira `gen_ai_client_token_usage` para painéis entre provedores: ela segue as convenções semânticas GenAI do OpenTelemetry e é consistente com métricas de serviços GenAI que não são do OpenClaw.
</Tip>

## Como escolher entre exportação Prometheus e OpenTelemetry

O OpenClaw oferece suporte às duas superfícies de forma independente. Você pode executar uma delas, as duas ou nenhuma.

<Tabs>
  <Tab title="diagnostics-prometheus">
    - Modelo **pull**: o Prometheus faz scrape de `/api/diagnostics/prometheus`.
    - Nenhum coletor externo é necessário.
    - Autenticado pela autenticação normal do Gateway.
    - A superfície é apenas de métricas (sem traces nem logs).
    - Melhor para stacks já padronizadas em Prometheus + Grafana.

  </Tab>
  <Tab title="diagnostics-otel">
    - Modelo **push**: o OpenClaw envia OTLP/HTTP para um coletor ou backend compatível com OTLP.
    - A superfície inclui métricas, traces e logs.
    - Faz ponte com o Prometheus por meio de um OpenTelemetry Collector (exportador `prometheus` ou `prometheusremotewrite`) quando você precisa dos dois.
    - Consulte [Exportação OpenTelemetry](/pt-BR/gateway/opentelemetry) para o catálogo completo.

  </Tab>
</Tabs>

## Solução de problemas

<AccordionGroup>
  <Accordion title="Corpo de resposta vazio">
    - Verifique `diagnostics.enabled: true` na configuração.
    - Confirme que o Plugin está habilitado e carregado com `openclaw plugins list --enabled`.
    - Gere algum tráfego; contadores e histogramas só emitem linhas após pelo menos um evento.

  </Accordion>
  <Accordion title="401 / não autorizado">
    O endpoint exige o escopo de operador do Gateway (`auth: "gateway"` com `gatewayRuntimeScopeSurface: "trusted-operator"`). Use o mesmo token ou senha que o Prometheus usa para qualquer outra rota de operador do Gateway. Não há modo público não autenticado.
  </Accordion>
  <Accordion title="`openclaw_prometheus_series_dropped_total` está subindo">
    Um novo atributo está excedendo o limite de **2048** séries. Inspecione as métricas recentes em busca de um rótulo com cardinalidade inesperadamente alta e corrija-o na origem. O exportador descarta intencionalmente novas séries em vez de reescrever rótulos silenciosamente.
  </Accordion>
  <Accordion title="O Prometheus mostra séries obsoletas após uma reinicialização">
    O Plugin mantém estado apenas em memória. Após uma reinicialização do Gateway, os contadores voltam a zero e os gauges reiniciam no próximo valor relatado. Use `rate()` e `increase()` do PromQL para lidar com resets de forma limpa.
  </Accordion>
</AccordionGroup>

## Relacionado

- [Exportação de diagnósticos](/pt-BR/gateway/diagnostics) — zip de diagnósticos local para pacotes de suporte
- [Integridade e prontidão](/pt-BR/gateway/health) — probes `/healthz` e `/readyz`
- [Logging](/pt-BR/logging) — logging baseado em arquivo
- [Exportação OpenTelemetry](/pt-BR/gateway/opentelemetry) — push OTLP para traces, métricas e logs
