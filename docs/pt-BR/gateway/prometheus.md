---
read_when:
    - Você quer que o Prometheus, Grafana, VictoriaMetrics ou outro coletor reúna métricas do Gateway do OpenClaw
    - Você precisa dos nomes das métricas do Prometheus e da política de rótulos para painéis ou alertas
    - Você quer métricas sem executar um coletor OpenTelemetry
sidebarTitle: Prometheus
summary: Exponha os diagnósticos do OpenClaw como métricas de texto do Prometheus por meio do plugin diagnostics-prometheus
title: Métricas do Prometheus
x-i18n:
    generated_at: "2026-07-12T15:14:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 8a3975a9a79f32f1e9731b819613fdf6b9ffeee20bc71c841b9a6d7a5e0052f4
    source_path: gateway/prometheus.md
    workflow: 16
---

  O OpenClaw pode expor métricas de diagnóstico por meio do plugin oficial
  `diagnostics-prometheus`. Ele monitora diagnósticos confiáveis, além de
  eventos de diagnóstico marcados internamente e gerenciados pelo dispatcher
  (sinais de fila, memória e recuperação de sessão), e disponibiliza um endpoint
  de texto do Prometheus em:

  ```text
  GET /api/diagnostics/prometheus
  ```

  O tipo de conteúdo é `text/plain; version=0.0.4; charset=utf-8`, o formato
  padrão de exposição do Prometheus.

  <Warning>
  A rota usa a autenticação do Gateway (escopo de operador, superfície de operador confiável). Não a exponha como um endpoint público `/metrics` sem autenticação. Colete as métricas pelo mesmo caminho de autenticação usado para outras APIs de operador.
  </Warning>

  Para rastreamentos, logs, envio por OTLP e atributos semânticos de IA generativa do OpenTelemetry, consulte [Exportação do OpenTelemetry](/pt-BR/gateway/opentelemetry).

  ## Início rápido

  <Steps>
  <Step title="Instalar o plugin">
    ```bash
    openclaw plugins install clawhub:@openclaw/diagnostics-prometheus
    ```
  </Step>
  <Step title="Ativar o plugin">
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
  <Step title="Reiniciar o Gateway">
    A rota HTTP é registrada na inicialização do plugin; portanto, recarregue após ativá-lo.
  </Step>
  <Step title="Coletar dados da rota protegida">
    Envie a mesma autenticação do Gateway usada pelos seus clientes de operador:

    ```bash
    curl -H "Authorization: Bearer $OPENCLAW_GATEWAY_TOKEN" \
      http://127.0.0.1:18789/api/diagnostics/prometheus
    ```

  </Step>
  <Step title="Conecte o Prometheus">
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
O valor padrão de `diagnostics.enabled` é `true`; defina-o como `false` somente em ambientes com restrições rigorosas. Se ele for `false`, o plugin ainda registrará a rota HTTP, mas nenhum evento de diagnóstico será encaminhado ao exportador, portanto a resposta estará vazia.
</Note>

## Métricas exportadas

| Métrica                                          | Tipo      | Rótulos                                                                                   |
| ------------------------------------------------ | --------- | ----------------------------------------------------------------------------------------- |
| `openclaw_run_completed_total`                   | contador  | `channel`, `model`, `outcome`, `provider`, `trigger`                                      |
| `openclaw_run_duration_seconds`                  | histograma | `channel`, `model`, `outcome`, `provider`, `trigger`                                      |
| `openclaw_model_call_total`                      | contador  | `api`, `error_category`, `model`, `outcome`, `provider`, `transport`                      |
| `openclaw_model_call_duration_seconds`           | histograma | `api`, `error_category`, `model`, `outcome`, `provider`, `transport`                      |
| `openclaw_model_failover_total`                  | contador  | `from_model`, `from_provider`, `lane`, `reason`, `suspended`, `to_model`, `to_provider`   |
| `openclaw_model_tokens_total`                    | contador  | `agent`, `channel`, `model`, `provider`, `token_type`                                     |
| `openclaw_gen_ai_client_token_usage`             | histograma | `model`, `provider`, `token_type`                                                         |
| `openclaw_model_cost_usd_total`                  | contador  | `agent`, `channel`, `model`, `provider`                                                   |
| `openclaw_model_usage_duration_seconds`          | histograma | `agent`, `channel`, `model`, `provider`                                                   |
| `openclaw_skill_used_total`                      | contador  | `activation`, `agent`, `skill`, `source`                                                  |
| `openclaw_tool_execution_total`                  | contador  | `error_category`, `outcome`, `params_kind`, `tool`, `tool_owner`, `tool_source`           |
| `openclaw_tool_execution_duration_seconds`       | histograma | `error_category`, `outcome`, `params_kind`, `tool`, `tool_owner`, `tool_source`           |
| `openclaw_tool_execution_blocked_total`          | contador  | `denied_reason`, `params_kind`, `tool`, `tool_owner`, `tool_source`                       |
| `openclaw_harness_run_total`                     | contador  | `channel`, `error_category`, `harness`, `model`, `outcome`, `phase`, `plugin`, `provider` |
| `openclaw_harness_run_duration_seconds`          | histograma | `channel`, `error_category`, `harness`, `model`, `outcome`, `phase`, `plugin`, `provider` |
| `openclaw_webhook_received_total`                | contador  | `channel`, `webhook`                                                                      |
| `openclaw_webhook_error_total`                   | contador  | `channel`, `webhook`                                                                      |
| `openclaw_webhook_duration_seconds`              | histograma | `channel`, `webhook`                                                                      |
| `openclaw_message_received_total`                | contador  | `channel`, `source`                                                                       |
| `openclaw_message_dispatch_started_total`        | contador  | `channel`, `source`                                                                       |
| `openclaw_message_dispatch_completed_total`      | contador  | `channel`, `outcome`, `reason`, `source`                                                  |
| `openclaw_message_dispatch_duration_seconds`     | histograma | `channel`, `outcome`, `reason`, `source`                                                  |
| `openclaw_message_processed_total`               | contador  | `channel`, `outcome`, `reason`                                                            |
| `openclaw_message_processed_duration_seconds`    | histograma | `channel`, `outcome`, `reason`                                                            |
| `openclaw_message_delivery_started_total`        | contador  | `channel`, `delivery_kind`                                                                |
| `openclaw_message_delivery_total`                | contador  | `channel`, `delivery_kind`, `error_category`, `outcome`                                   |
| `openclaw_message_delivery_duration_seconds`     | histograma | `channel`, `delivery_kind`, `error_category`, `outcome`                                   |
| `openclaw_talk_event_total`                      | contador  | `brain`, `event_type`, `mode`, `provider`, `transport`                                    |
| `openclaw_talk_event_duration_seconds`           | histograma | `brain`, `event_type`, `mode`, `provider`, `transport`                                    |
| `openclaw_talk_audio_bytes`                      | histograma | `brain`, `event_type`, `mode`, `provider`, `transport`                                    |
| `openclaw_queue_lane_size`                       | medidor   | `lane`                                                                                    |
| `openclaw_queue_lane_wait_seconds`               | histograma | `lane`                                                                                    |
| `openclaw_session_state_total`                   | contador  | `reason`, `state`                                                                         |
| `openclaw_session_queue_depth`                   | medidor   | `state`                                                                                   |
| `openclaw_session_turn_created_total`            | contador  | `agent`, `channel`, `trigger`                                                             |
| `openclaw_session_stuck_total`                   | contador  | `reason`, `state`                                                                         |
| `openclaw_session_stuck_age_seconds`             | histograma | `reason`, `state`                                                                         |
| `openclaw_session_recovery_total`                | contador  | `action`, `active_work_kind`, `state`, `status`                                           |
| `openclaw_session_recovery_age_seconds`          | histograma | `action`, `active_work_kind`, `state`, `status`                                           |
| `openclaw_liveness_warning_total`                | contador  | `reason`                                                                                  |
| `openclaw_liveness_sessions`                     | medidor   | `state`                                                                                   |
| `openclaw_liveness_event_loop_delay_p99_seconds` | histograma | `reason`                                                                                  |
| `openclaw_liveness_event_loop_delay_max_seconds` | histograma | `reason`                                                                                  |
| `openclaw_liveness_event_loop_utilization_ratio` | histograma | `reason`                                                                                  |
| `openclaw_liveness_cpu_core_ratio`               | histograma | `reason`                                                                                  |
| `openclaw_payload_large_total`                   | contador  | `action`, `channel`, `plugin`, `reason`, `surface`                                        |
| `openclaw_payload_large_bytes`                   | histograma | `action`, `channel`, `plugin`, `reason`, `surface`                                        |
| `openclaw_memory_bytes`                          | medidor   | `kind`                                                                                    |
| `openclaw_memory_rss_bytes`                      | histograma | nenhum                                                                                    |
| `openclaw_memory_pressure_total`                 | contador  | `level`, `reason`                                                                         |
| `openclaw_telemetry_exporter_total`              | contador  | `exporter`, `reason`, `signal`, `status`                                                  |
| `openclaw_prometheus_series_dropped_total`       | contador  | nenhum                                                                                    |
| `openclaw_diagnostic_async_queue_dropped_total`  | contador  | `drop_class`                                                                              |
| `openclaw_diagnostic_async_queue_length`         | medidor   | nenhum                                                                                    |

## Política de rótulos

<AccordionGroup>
  <Accordion title="Rótulos limitados e de baixa cardinalidade">
    Os rótulos do Prometheus permanecem limitados e têm baixa cardinalidade. O exportador não emite identificadores brutos de diagnóstico, como `runId`, `sessionKey`, `sessionId`, `callId`, `toolCallId`, IDs de mensagens, IDs de chats ou IDs de solicitações do provedor.

    Os valores dos rótulos são ocultados e devem corresponder à política de caracteres de baixa cardinalidade do OpenClaw. Os valores que não atendem à política são substituídos por `unknown`, `other` ou `none`, dependendo da métrica. Rótulos que se parecem com chaves de sessão de agente com escopo também são substituídos por `unknown`.

  </Accordion>
  <Accordion title="Limite de séries e contabilização de excedentes">
    O exportador limita as séries temporais mantidas na memória a **2048** séries no total, somando contadores, medidores e histogramas. Novas séries além desse limite são descartadas, e `openclaw_prometheus_series_dropped_total` é incrementado em um a cada ocorrência.

    Monitore esse contador como um sinal inequívoco de que algum atributo na origem está vazando valores de alta cardinalidade. O exportador nunca aumenta o limite automaticamente; se o contador subir, corrija a origem em vez de desabilitar o limite.

  </Accordion>
  <Accordion title="O que nunca aparece na saída do Prometheus">
    - texto do prompt, texto da resposta, entradas de ferramentas, saídas de ferramentas, prompts do sistema
    - transcrições de conversas, cargas de áudio, IDs de chamadas, IDs de salas, tokens de transferência, IDs de turnos e IDs de sessão brutos
    - IDs de solicitação brutos do provedor (somente hashes de cardinalidade limitada, quando aplicável, em spans — nunca em métricas)
    - chaves e IDs de sessão
    - nomes de host, caminhos de arquivos, valores secretos

  </Accordion>
</AccordionGroup>

## Receitas de PromQL

```promql
# Tokens por minuto, separados por provedor
sum by (provider) (rate(openclaw_model_tokens_total[1m]))

# Gastos (USD) na última hora, por modelo
sum by (model) (increase(openclaw_model_cost_usd_total[1h]))

# 95º percentil da duração da execução do modelo
histogram_quantile(
  0.95,
  sum by (le, provider, model)
    (rate(openclaw_run_duration_seconds_bucket[5m]))
)

# SLO do tempo de espera na fila (95º percentil abaixo de 2s)
histogram_quantile(
  0.95,
  sum by (le, lane) (rate(openclaw_queue_lane_wait_seconds_bucket[5m]))
) < 2

# Uso de Skills, separado por origem de cardinalidade limitada
sum by (skill, source) (increase(openclaw_skill_used_total[24h]))

# Séries do Prometheus descartadas (alarme de cardinalidade)
increase(openclaw_prometheus_series_dropped_total[15m]) > 0
```

<Tip>
Prefira `gen_ai_client_token_usage` para painéis entre provedores: essa métrica segue as convenções semânticas de GenAI do OpenTelemetry e é consistente com métricas de serviços de GenAI que não são do OpenClaw.
</Tip>

## Escolha entre a exportação do Prometheus e do OpenTelemetry

O OpenClaw oferece suporte às duas superfícies de forma independente. Você pode executar uma delas, ambas ou nenhuma.

<Tabs>
  <Tab title="diagnostics-prometheus">
    - Modelo de **pull**: o Prometheus coleta `/api/diagnostics/prometheus`.
    - Nenhum coletor externo é necessário.
    - Autenticado pela autenticação normal do Gateway.
    - A superfície inclui somente métricas (sem traces nem logs).
    - Ideal para stacks já padronizadas em Prometheus + Grafana.

  </Tab>
  <Tab title="diagnostics-otel">
    - Modelo de **push**: o OpenClaw envia OTLP/HTTP para um coletor ou backend compatível com OTLP.
    - A superfície inclui métricas, traces e logs.
    - Integra-se ao Prometheus por meio de um OpenTelemetry Collector (exportador `prometheus` ou `prometheusremotewrite`) quando você precisa de ambos.
    - Consulte [Exportação do OpenTelemetry](/pt-BR/gateway/opentelemetry) para ver o catálogo completo.

  </Tab>
</Tabs>

## Solução de problemas

<AccordionGroup>
  <Accordion title="Corpo da resposta vazio">
    - Verifique se `diagnostics.enabled` não está definido como `false` na configuração (o padrão é `true`).
    - Confirme se o plugin está habilitado e carregado com `openclaw plugins list --enabled`.
    - Gere algum tráfego; contadores e histogramas só emitem linhas após pelo menos um evento.

  </Accordion>
  <Accordion title="401 / não autorizado">
    O endpoint exige o escopo de operador do Gateway (`auth: "gateway"` com `gatewayRuntimeScopeSurface: "trusted-operator"`). Use o mesmo token ou senha que o Prometheus usa para qualquer outra rota de operador do Gateway. Não há modo público sem autenticação.
  </Accordion>
  <Accordion title="`openclaw_prometheus_series_dropped_total` está aumentando">
    Um novo atributo está excedendo o limite de **2048** séries. Inspecione as métricas recentes em busca de um rótulo com cardinalidade inesperadamente alta e corrija-o na origem. O exportador descarta intencionalmente as novas séries em vez de reescrever silenciosamente os rótulos.
  </Accordion>
  <Accordion title="O Prometheus mostra séries obsoletas após uma reinicialização">
    O plugin mantém o estado somente na memória. Após a reinicialização do Gateway, os contadores voltam a zero e os medidores reiniciam com o próximo valor informado. Use `rate()` e `increase()` do PromQL para tratar as reinicializações de forma adequada.
  </Accordion>
</AccordionGroup>

## Relacionado

- [Exportação de diagnósticos](/pt-BR/gateway/diagnostics) — arquivo zip de diagnósticos locais para pacotes de suporte
- [Integridade e prontidão](/pt-BR/gateway/health) — sondagens `/healthz` e `/readyz`
- [Registro em log](/pt-BR/logging) — registro em log baseado em arquivos
- [Exportação do OpenTelemetry](/pt-BR/gateway/opentelemetry) — push via OTLP para traces, métricas e logs
