---
read_when:
    - Você quer que o Prometheus, o Grafana, o VictoriaMetrics ou outro coletor faça a coleta das métricas do OpenClaw Gateway
    - Você precisa dos nomes das métricas do Prometheus e da política de rótulos para painéis ou alertas
    - Você quer métricas sem executar um coletor OpenTelemetry
sidebarTitle: Prometheus
summary: Exponha os diagnósticos do OpenClaw como métricas de texto do Prometheus por meio do Plugin diagnostics-prometheus
title: Métricas do Prometheus
x-i18n:
    generated_at: "2026-05-06T17:56:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 864e2a343266d84baaaaca9d8e494359198a3b43e8663ec8dcfcd4e2e4c6c004
    source_path: gateway/prometheus.md
    workflow: 16
---

OpenClaw pode expor métricas de diagnóstico por meio do plugin oficial `diagnostics-prometheus`. Ele escuta diagnósticos internos confiáveis e renderiza um endpoint de texto Prometheus em:

```text
GET /api/diagnostics/prometheus
```

O tipo de conteúdo é `text/plain; version=0.0.4; charset=utf-8`, o formato padrão de exposição do Prometheus.

<Warning>
A rota usa autenticação do Gateway (escopo de operador). Não a exponha como um endpoint público não autenticado `/metrics`. Colete-a pelo mesmo caminho de autenticação que você usa para outras APIs de operador.
</Warning>

Para traces, logs, envio OTLP e atributos semânticos GenAI do OpenTelemetry, consulte [exportação OpenTelemetry](/pt-BR/gateway/opentelemetry).

## Início rápido

<Steps>
  <Step title="Install the plugin">
    ```bash
    openclaw plugins install clawhub:@openclaw/diagnostics-prometheus
    ```
  </Step>
  <Step title="Enable the plugin">
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
  <Step title="Restart the Gateway">
    A rota HTTP é registrada na inicialização do plugin, então recarregue após habilitar.
  </Step>
  <Step title="Scrape the protected route">
    Envie a mesma autenticação do Gateway que seus clientes operadores usam:

    ```bash
    curl -H "Authorization: Bearer $OPENCLAW_GATEWAY_TOKEN" \
      http://127.0.0.1:18789/api/diagnostics/prometheus
    ```

  </Step>
  <Step title="Wire Prometheus">
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

| Métrica                                       | Tipo      | Rótulos                                                                                   |
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
| `openclaw_message_delivery_started_total`     | counter   | `channel`, `delivery_kind`                                                                |
| `openclaw_message_delivery_total`             | counter   | `channel`, `delivery_kind`, `error_category`, `outcome`                                   |
| `openclaw_message_delivery_duration_seconds`  | histogram | `channel`, `delivery_kind`, `error_category`, `outcome`                                   |
| `openclaw_talk_event_total`                   | counter   | `brain`, `event_type`, `mode`, `provider`, `transport`                                    |
| `openclaw_talk_event_duration_seconds`        | histogram | `brain`, `event_type`, `mode`, `provider`, `transport`                                    |
| `openclaw_talk_audio_bytes`                   | histogram | `brain`, `event_type`, `mode`, `provider`, `transport`                                    |
| `openclaw_queue_lane_size`                    | gauge     | `lane`                                                                                    |
| `openclaw_queue_lane_wait_seconds`            | histogram | `lane`                                                                                    |
| `openclaw_session_state_total`                | counter   | `reason`, `state`                                                                         |
| `openclaw_session_queue_depth`                | gauge     | `state`                                                                                   |
| `openclaw_session_recovery_total`             | counter   | `action`, `active_work_kind`, `state`, `status`                                           |
| `openclaw_session_recovery_age_seconds`       | histogram | `action`, `active_work_kind`, `state`, `status`                                           |
| `openclaw_memory_bytes`                       | gauge     | `kind`                                                                                    |
| `openclaw_memory_rss_bytes`                   | histogram | nenhum                                                                                    |
| `openclaw_memory_pressure_total`              | counter   | `level`, `reason`                                                                         |
| `openclaw_telemetry_exporter_total`           | counter   | `exporter`, `reason`, `signal`, `status`                                                  |
| `openclaw_prometheus_series_dropped_total`    | counter   | nenhum                                                                                    |

## Política de rótulos

<AccordionGroup>
  <Accordion title="Bounded, low-cardinality labels">
    Os rótulos do Prometheus permanecem limitados e com baixa cardinalidade. O exportador não emite identificadores de diagnóstico brutos, como `runId`, `sessionKey`, `sessionId`, `callId`, `toolCallId`, IDs de mensagens, IDs de chat ou IDs de solicitação de provedores.

    Os valores dos rótulos são redigidos e devem corresponder à política de caracteres de baixa cardinalidade do OpenClaw. Valores que falham na política são substituídos por `unknown`, `other` ou `none`, dependendo da métrica.

  </Accordion>
  <Accordion title="Limite de séries e contabilização de excedente">
    O exportador limita as séries temporais mantidas na memória a **2048** séries no total entre contadores, medidores e histogramas. Novas séries além desse limite são descartadas, e `openclaw_prometheus_series_dropped_total` é incrementado em um a cada vez.

    Monitore esse contador como um sinal forte de que um atributo upstream está vazando valores de alta cardinalidade. O exportador nunca aumenta o limite automaticamente; se ele subir, corrija a origem em vez de desativar o limite.

  </Accordion>
  <Accordion title="O que nunca aparece na saída do Prometheus">
    - texto de prompt, texto de resposta, entradas de ferramentas, saídas de ferramentas, prompts do sistema
    - transcrições de conversas, payloads de áudio, IDs de chamadas, IDs de salas, tokens de handoff, IDs de turnos e IDs brutos de sessão
    - IDs brutos de requisição de provedores (apenas hashes limitados, quando aplicável, em spans — nunca em métricas)
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

# Dropped Prometheus series (cardinality alarm)
increase(openclaw_prometheus_series_dropped_total[15m]) > 0
```

<Tip>
Prefira `gen_ai_client_token_usage` para dashboards entre provedores: ele segue as convenções semânticas GenAI do OpenTelemetry e é consistente com métricas de serviços GenAI que não são OpenClaw.
</Tip>

## Escolhendo entre exportação para Prometheus e OpenTelemetry

O OpenClaw oferece suporte às duas superfícies de forma independente. Você pode executar uma, ambas ou nenhuma.

<Tabs>
  <Tab title="diagnostics-prometheus">
    - Modelo de **pull**: o Prometheus coleta `/api/diagnostics/prometheus`.
    - Nenhum coletor externo é necessário.
    - Autenticado pela autenticação normal do Gateway.
    - A superfície é apenas de métricas (sem traces nem logs).
    - Melhor para stacks já padronizadas em Prometheus + Grafana.

  </Tab>
  <Tab title="diagnostics-otel">
    - Modelo de **push**: o OpenClaw envia OTLP/HTTP para um coletor ou backend compatível com OTLP.
    - A superfície inclui métricas, traces e logs.
    - Conecta-se ao Prometheus por meio de um OpenTelemetry Collector (exportador `prometheus` ou `prometheusremotewrite`) quando você precisa de ambos.
    - Consulte [exportação para OpenTelemetry](/pt-BR/gateway/opentelemetry) para o catálogo completo.

  </Tab>
</Tabs>

## Solução de problemas

<AccordionGroup>
  <Accordion title="Corpo de resposta vazio">
    - Verifique `diagnostics.enabled: true` na configuração.
    - Confirme que o plugin está habilitado e carregado com `openclaw plugins list --enabled`.
    - Gere algum tráfego; contadores e histogramas só emitem linhas após pelo menos um evento.

  </Accordion>
  <Accordion title="401 / não autorizado">
    O endpoint exige o escopo de operador do Gateway (`auth: "gateway"` com `gatewayRuntimeScopeSurface: "trusted-operator"`). Use o mesmo token ou senha que o Prometheus usa para qualquer outra rota de operador do Gateway. Não há modo público não autenticado.
  </Accordion>
  <Accordion title="`openclaw_prometheus_series_dropped_total` está subindo">
    Um novo atributo está excedendo o limite de **2048** séries. Inspecione métricas recentes em busca de um rótulo com cardinalidade inesperadamente alta e corrija-o na origem. O exportador descarta intencionalmente novas séries em vez de reescrever rótulos silenciosamente.
  </Accordion>
  <Accordion title="O Prometheus mostra séries obsoletas após uma reinicialização">
    O plugin mantém estado apenas na memória. Após uma reinicialização do Gateway, os contadores são redefinidos para zero e os medidores reiniciam no próximo valor relatado. Use `rate()` e `increase()` do PromQL para lidar com redefinições corretamente.
  </Accordion>
</AccordionGroup>

## Relacionado

- [Exportação de diagnósticos](/pt-BR/gateway/diagnostics) — zip de diagnósticos local para pacotes de suporte
- [Saúde e prontidão](/pt-BR/gateway/health) — sondas `/healthz` e `/readyz`
- [Registro em log](/pt-BR/logging) — registro em log baseado em arquivos
- [Exportação do OpenTelemetry](/pt-BR/gateway/opentelemetry) — envio OTLP para rastreamentos, métricas e registros
