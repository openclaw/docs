---
read_when:
    - Vous voulez que Prometheus, Grafana, VictoriaMetrics ou un autre collecteur collecte les métriques du Gateway OpenClaw
    - Vous avez besoin des noms de métriques Prometheus et de la politique des libellés pour les tableaux de bord ou les alertes
    - Vous voulez des métriques sans exécuter de collecteur OpenTelemetry
sidebarTitle: Prometheus
summary: Exposer les diagnostics OpenClaw sous forme de métriques texte Prometheus via le Plugin diagnostics-prometheus
title: Métriques Prometheus
x-i18n:
    generated_at: "2026-06-27T17:32:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f9d3f6cf5af2e3770cd3a86e968fe25d2c3b3b87524ba1d229ef585671d320a8
    source_path: gateway/prometheus.md
    workflow: 16
---

  OpenClaw peut exposer des métriques de diagnostic via le Plugin officiel `diagnostics-prometheus`. Il écoute les diagnostics approuvés ainsi que les événements de stabilité du Gateway émis par le noyau, puis affiche un point de terminaison texte Prometheus à :

  ```text
  GET /api/diagnostics/prometheus
  ```

  Le type de contenu est `text/plain; version=0.0.4; charset=utf-8`, le format d’exposition Prometheus standard.

  <Warning>
  La route utilise l’authentification Gateway (portée opérateur). Ne l’exposez pas comme un point de terminaison `/metrics` public non authentifié. Collectez-la via le même chemin d’authentification que celui que vous utilisez pour les autres API opérateur.
  </Warning>

  Pour les traces, les journaux, le push OTLP et les attributs sémantiques OpenTelemetry GenAI, consultez [Export OpenTelemetry](/fr/gateway/opentelemetry).

  ## Démarrage rapide

  <Steps>
  <Step title="Installer le Plugin">
    ```bash
    openclaw plugins install clawhub:@openclaw/diagnostics-prometheus
    ```
  </Step>
  <Step title="Activer le Plugin">
    <Tabs>
      <Tab title="Configuration">
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
  <Step title="Redémarrer le Gateway">
    La route HTTP est enregistrée au démarrage du Plugin ; rechargez donc après l’activation.
  </Step>
  <Step title="Collecter la route protégée">
    Envoyez la même authentification Gateway que celle utilisée par vos clients opérateur :

    ```bash
    curl -H "Authorization: Bearer $OPENCLAW_GATEWAY_TOKEN" \
      http://127.0.0.1:18789/api/diagnostics/prometheus
    ```

  </Step>
  <Step title="Câbler Prometheus">
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
`diagnostics.enabled: true` est requis. Sans cela, le Plugin enregistre toujours la route HTTP, mais aucun événement de diagnostic n’arrive dans l’exportateur ; la réponse est donc vide.
</Note>

## Métriques exportées

| Métrique                                         | Type        | Étiquettes                                                                               |
| ------------------------------------------------ | ----------- | ----------------------------------------------------------------------------------------- |
| `openclaw_run_completed_total`                   | compteur    | `channel`, `model`, `outcome`, `provider`, `trigger`                                      |
| `openclaw_run_duration_seconds`                  | histogramme | `channel`, `model`, `outcome`, `provider`, `trigger`                                      |
| `openclaw_model_call_total`                      | compteur    | `api`, `error_category`, `model`, `outcome`, `provider`, `transport`                      |
| `openclaw_model_call_duration_seconds`           | histogramme | `api`, `error_category`, `model`, `outcome`, `provider`, `transport`                      |
| `openclaw_model_failover_total`                  | compteur    | `from_model`, `from_provider`, `lane`, `reason`, `suspended`, `to_model`, `to_provider`   |
| `openclaw_model_tokens_total`                    | compteur    | `agent`, `channel`, `model`, `provider`, `token_type`                                     |
| `openclaw_gen_ai_client_token_usage`             | histogramme | `model`, `provider`, `token_type`                                                         |
| `openclaw_model_cost_usd_total`                  | compteur    | `agent`, `channel`, `model`, `provider`                                                   |
| `openclaw_skill_used_total`                      | compteur    | `activation`, `agent`, `skill`, `source`                                                  |
| `openclaw_tool_execution_total`                  | compteur    | `error_category`, `outcome`, `params_kind`, `tool`, `tool_owner`, `tool_source`           |
| `openclaw_tool_execution_duration_seconds`       | histogramme | `error_category`, `outcome`, `params_kind`, `tool`, `tool_owner`, `tool_source`           |
| `openclaw_tool_execution_blocked_total`          | compteur    | `denied_reason`, `params_kind`, `tool`, `tool_owner`, `tool_source`                       |
| `openclaw_harness_run_total`                     | compteur    | `channel`, `error_category`, `harness`, `model`, `outcome`, `phase`, `plugin`, `provider` |
| `openclaw_harness_run_duration_seconds`          | histogramme | `channel`, `error_category`, `harness`, `model`, `outcome`, `phase`, `plugin`, `provider` |
| `openclaw_webhook_received_total`                | compteur    | `channel`, `webhook`                                                                      |
| `openclaw_webhook_error_total`                   | compteur    | `channel`, `webhook`                                                                      |
| `openclaw_webhook_duration_seconds`              | histogramme | `channel`, `webhook`                                                                      |
| `openclaw_message_received_total`                | compteur    | `channel`, `source`                                                                       |
| `openclaw_message_dispatch_started_total`        | compteur    | `channel`, `source`                                                                       |
| `openclaw_message_dispatch_completed_total`      | compteur    | `channel`, `outcome`, `reason`, `source`                                                  |
| `openclaw_message_dispatch_duration_seconds`     | histogramme | `channel`, `outcome`, `reason`, `source`                                                  |
| `openclaw_message_processed_total`               | compteur    | `channel`, `outcome`, `reason`                                                            |
| `openclaw_message_processed_duration_seconds`    | histogramme | `channel`, `outcome`, `reason`                                                            |
| `openclaw_message_delivery_started_total`        | compteur    | `channel`, `delivery_kind`                                                                |
| `openclaw_message_delivery_total`                | compteur    | `channel`, `delivery_kind`, `error_category`, `outcome`                                   |
| `openclaw_message_delivery_duration_seconds`     | histogramme | `channel`, `delivery_kind`, `error_category`, `outcome`                                   |
| `openclaw_talk_event_total`                      | compteur    | `brain`, `event_type`, `mode`, `provider`, `transport`                                    |
| `openclaw_talk_event_duration_seconds`           | histogramme | `brain`, `event_type`, `mode`, `provider`, `transport`                                    |
| `openclaw_talk_audio_bytes`                      | histogramme | `brain`, `event_type`, `mode`, `provider`, `transport`                                    |
| `openclaw_queue_lane_size`                       | jauge       | `lane`                                                                                    |
| `openclaw_queue_lane_wait_seconds`               | histogramme | `lane`                                                                                    |
| `openclaw_session_state_total`                   | compteur    | `reason`, `state`                                                                         |
| `openclaw_session_queue_depth`                   | jauge       | `state`                                                                                   |
| `openclaw_session_turn_created_total`            | compteur    | `agent`, `channel`, `trigger`                                                             |
| `openclaw_session_stuck_total`                   | compteur    | `reason`, `state`                                                                         |
| `openclaw_session_stuck_age_seconds`             | histogramme | `reason`, `state`                                                                         |
| `openclaw_session_recovery_total`                | compteur    | `action`, `active_work_kind`, `state`, `status`                                           |
| `openclaw_session_recovery_age_seconds`          | histogramme | `action`, `active_work_kind`, `state`, `status`                                           |
| `openclaw_liveness_warning_total`                | compteur    | `reason`                                                                                  |
| `openclaw_liveness_sessions`                     | jauge       | `state`                                                                                   |
| `openclaw_liveness_event_loop_delay_p99_seconds` | histogramme | `reason`                                                                                  |
| `openclaw_liveness_event_loop_delay_max_seconds` | histogramme | `reason`                                                                                  |
| `openclaw_liveness_event_loop_utilization_ratio` | histogramme | `reason`                                                                                  |
| `openclaw_liveness_cpu_core_ratio`               | histogramme | `reason`                                                                                  |
| `openclaw_payload_large_total`                   | compteur    | `action`, `channel`, `plugin`, `reason`, `surface`                                        |
| `openclaw_payload_large_bytes`                   | histogramme | `action`, `channel`, `plugin`, `reason`, `surface`                                        |
| `openclaw_memory_bytes`                          | jauge       | `kind`                                                                                    |
| `openclaw_memory_rss_bytes`                      | histogramme | aucune                                                                                    |
| `openclaw_memory_pressure_total`                 | compteur    | `level`, `reason`                                                                         |
| `openclaw_telemetry_exporter_total`              | compteur    | `exporter`, `reason`, `signal`, `status`                                                  |
| `openclaw_prometheus_series_dropped_total`       | compteur    | aucune                                                                                    |

## Politique des étiquettes

<AccordionGroup>
  <Accordion title="Étiquettes bornées, à faible cardinalité">
    Les étiquettes Prometheus restent bornées et à faible cardinalité. L’exportateur n’émet pas d’identifiants de diagnostic bruts tels que `runId`, `sessionKey`, `sessionId`, `callId`, `toolCallId`, les ID de message, les ID de discussion ou les ID de requête fournisseur.

    Les valeurs d’étiquette sont expurgées et doivent respecter la politique de caractères à faible cardinalité d’OpenClaw. Les valeurs qui ne respectent pas cette politique sont remplacées par `unknown`, `other` ou `none`, selon la métrique. Les étiquettes qui ressemblent à des clés de session d’agent délimitées sont également remplacées par `unknown`.

  </Accordion>
  <Accordion title="Plafond des séries et comptabilisation des dépassements">
    L’exportateur plafonne les séries temporelles conservées en mémoire à **2048** séries au total, compteurs, jauges et histogrammes confondus. Les nouvelles séries au-delà de ce plafond sont abandonnées, et `openclaw_prometheus_series_dropped_total` est incrémenté de un à chaque fois.

    Surveillez ce compteur comme un signal fort indiquant qu’un attribut en amont laisse fuiter des valeurs à forte cardinalité. L’exportateur n’augmente jamais automatiquement le plafond ; s’il monte, corrigez la source plutôt que de désactiver le plafond.

  </Accordion>
  <Accordion title="What never appears in Prometheus output">
    - texte d’invite, texte de réponse, entrées d’outils, sorties d’outils, invites système
    - transcriptions de conversation, charges audio, identifiants d’appel, identifiants de salle, jetons de transfert, identifiants de tour et identifiants de session bruts
    - identifiants de requête de fournisseur bruts (uniquement des hachages bornés, le cas échéant, sur les spans — jamais sur les métriques)
    - clés de session et identifiants de session
    - noms d’hôte, chemins de fichiers, valeurs secrètes

  </Accordion>
</AccordionGroup>

## Recettes PromQL

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
Préférez `gen_ai_client_token_usage` pour les tableaux de bord multifournisseurs : il suit les conventions sémantiques OpenTelemetry GenAI et reste cohérent avec les métriques des services GenAI non OpenClaw.
</Tip>

## Choisir entre l’export Prometheus et OpenTelemetry

OpenClaw prend en charge les deux surfaces indépendamment. Vous pouvez utiliser l’une, les deux ou aucune.

<Tabs>
  <Tab title="diagnostics-prometheus">
    - Modèle **pull** : Prometheus collecte `/api/diagnostics/prometheus`.
    - Aucun collecteur externe requis.
    - Authentifié via l’authentification Gateway normale.
    - La surface expose uniquement des métriques (pas de traces ni de journaux).
    - Idéal pour les piles déjà standardisées sur Prometheus + Grafana.

  </Tab>
  <Tab title="diagnostics-otel">
    - Modèle **push** : OpenClaw envoie OTLP/HTTP à un collecteur ou à un backend compatible OTLP.
    - La surface inclut les métriques, les traces et les journaux.
    - Fait le pont vers Prometheus via un OpenTelemetry Collector (exportateur `prometheus` ou `prometheusremotewrite`) lorsque vous avez besoin des deux.
    - Consultez [l’export OpenTelemetry](/fr/gateway/opentelemetry) pour le catalogue complet.

  </Tab>
</Tabs>

## Dépannage

<AccordionGroup>
  <Accordion title="Empty response body">
    - Vérifiez `diagnostics.enabled: true` dans la configuration.
    - Confirmez que le Plugin est activé et chargé avec `openclaw plugins list --enabled`.
    - Générez du trafic ; les compteurs et les histogrammes n’émettent des lignes qu’après au moins un événement.

  </Accordion>
  <Accordion title="401 / unauthorized">
    Le point de terminaison nécessite le périmètre opérateur Gateway (`auth: "gateway"` avec `gatewayRuntimeScopeSurface: "trusted-operator"`). Utilisez le même jeton ou mot de passe que Prometheus utilise pour toute autre route opérateur Gateway. Il n’existe aucun mode public non authentifié.
  </Accordion>
  <Accordion title="`openclaw_prometheus_series_dropped_total` is climbing">
    Un nouvel attribut dépasse la limite de **2048** séries. Inspectez les métriques récentes pour repérer une étiquette à cardinalité anormalement élevée et corrigez-la à la source. L’exportateur supprime intentionnellement les nouvelles séries au lieu de réécrire silencieusement les étiquettes.
  </Accordion>
  <Accordion title="Prometheus shows stale series after a restart">
    Le Plugin conserve l’état uniquement en mémoire. Après un redémarrage du Gateway, les compteurs sont remis à zéro et les jauges redémarrent à leur prochaine valeur signalée. Utilisez `rate()` et `increase()` PromQL pour gérer proprement les réinitialisations.
  </Accordion>
</AccordionGroup>

## Connexe

- [Export des diagnostics](/fr/gateway/diagnostics) — zip de diagnostics local pour les bundles de support
- [Santé et disponibilité](/fr/gateway/health) — sondes `/healthz` et `/readyz`
- [Journalisation](/fr/logging) — journalisation basée sur des fichiers
- [Export OpenTelemetry](/fr/gateway/opentelemetry) — push OTLP pour les traces, les métriques et les journaux
