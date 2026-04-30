---
read_when:
    - Vous voulez que Prometheus, Grafana, VictoriaMetrics ou un autre collecteur récupère les métriques du Gateway OpenClaw
    - Vous avez besoin des noms des métriques Prometheus et de la politique d’étiquettes pour les tableaux de bord ou les alertes
    - Vous voulez des métriques sans exécuter un collecteur OpenTelemetry
sidebarTitle: Prometheus
summary: Exposer les diagnostics d'OpenClaw sous forme de métriques texte Prometheus via le plugin diagnostics-prometheus
title: Métriques Prometheus
x-i18n:
    generated_at: "2026-04-30T07:28:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: d75a97a0b9dedd89eb25fee83626d8d726917872cc1c3bfcbf6e9634dd168a2b
    source_path: gateway/prometheus.md
    workflow: 16
---

OpenClaw peut exposer des métriques de diagnostic via le Plugin `diagnostics-prometheus` intégré. Il écoute les diagnostics internes de confiance et génère un point de terminaison texte Prometheus à :

```text
GET /api/diagnostics/prometheus
```

Le type de contenu est `text/plain; version=0.0.4; charset=utf-8`, le format d’exposition Prometheus standard.

<Warning>
La route utilise l’authentification Gateway (scope opérateur). Ne l’exposez pas comme point de terminaison public non authentifié `/metrics`. Collectez-la via le même chemin d’authentification que celui utilisé pour les autres API opérateur.
</Warning>

Pour les traces, les journaux, l’envoi OTLP et les attributs sémantiques OpenTelemetry GenAI, consultez [Export OpenTelemetry](/fr/gateway/opentelemetry).

## Démarrage rapide

<Steps>
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
    La route HTTP est enregistrée au démarrage du Plugin ; rechargez donc après l’avoir activé.
  </Step>
  <Step title="Collecter la route protégée">
    Envoyez la même authentification Gateway que celle utilisée par vos clients opérateur :

    ```bash
    curl -H "Authorization: Bearer $OPENCLAW_GATEWAY_TOKEN" \
      http://127.0.0.1:18789/api/diagnostics/prometheus
    ```

  </Step>
  <Step title="Configurer Prometheus">
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
`diagnostics.enabled: true` est requis. Sans cette option, le Plugin enregistre quand même la route HTTP, mais aucun événement de diagnostic n’arrive dans l’exportateur ; la réponse est donc vide.
</Note>

## Métriques exportées

| Métrique                                      | Type      | Libellés                                                                                  |
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
| `openclaw_memory_rss_bytes`                   | histogram | aucun                                                                                     |
| `openclaw_memory_pressure_total`              | counter   | `level`, `reason`                                                                         |
| `openclaw_telemetry_exporter_total`           | counter   | `exporter`, `reason`, `signal`, `status`                                                  |
| `openclaw_prometheus_series_dropped_total`    | counter   | aucun                                                                                     |

## Politique des libellés

<AccordionGroup>
  <Accordion title="Libellés bornés, à faible cardinalité">
    Les libellés Prometheus restent bornés et à faible cardinalité. L’exportateur n’émet pas d’identifiants de diagnostic bruts tels que `runId`, `sessionKey`, `sessionId`, `callId`, `toolCallId`, les ID de messages, les ID de discussions ou les ID de requêtes fournisseur.

    Les valeurs de libellé sont expurgées et doivent respecter la politique de caractères à faible cardinalité d’OpenClaw. Les valeurs qui ne respectent pas la politique sont remplacées par `unknown`, `other` ou `none`, selon la métrique.

  </Accordion>
  <Accordion title="Plafond des séries et comptabilisation du dépassement">
    L’exportateur limite les séries temporelles conservées en mémoire à **2048** séries, compteurs, jauges et histogrammes confondus. Les nouvelles séries au-delà de ce plafond sont abandonnées, et `openclaw_prometheus_series_dropped_total` augmente de un à chaque fois.

    Surveillez ce compteur comme un signal fort indiquant qu’un attribut en amont laisse fuiter des valeurs à haute cardinalité. L’exportateur ne relève jamais le plafond automatiquement ; s’il augmente, corrigez la source plutôt que de désactiver le plafond.

  </Accordion>
  <Accordion title="Ce qui n’apparaît jamais dans la sortie Prometheus">
    - texte de prompt, texte de réponse, entrées d’outils, sorties d’outils, prompts système
    - ID de requêtes fournisseur bruts (uniquement des hachages bornés, le cas échéant, sur les spans — jamais sur les métriques)
    - clés de session et ID de session
    - noms d’hôtes, chemins de fichiers, valeurs secrètes

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

# Dropped Prometheus series (cardinality alarm)
increase(openclaw_prometheus_series_dropped_total[15m]) > 0
```

<Tip>
Préférez `gen_ai_client_token_usage` pour les tableaux de bord multi-fournisseurs : cette métrique suit les conventions sémantiques OpenTelemetry GenAI et reste cohérente avec les métriques des services GenAI non OpenClaw.
</Tip>

## Choisir entre Prometheus et l’export OpenTelemetry

OpenClaw prend en charge les deux surfaces indépendamment. Vous pouvez en exécuter une, les deux, ou aucune.

<Tabs>
  <Tab title="diagnostics-prometheus">
    - Modèle **pull** : Prometheus collecte `/api/diagnostics/prometheus`.
    - Aucun collecteur externe requis.
    - Authentifié via l’authentification Gateway normale.
    - La surface ne contient que des métriques (pas de traces ni de journaux).
    - Idéal pour les piles déjà standardisées sur Prometheus + Grafana.

  </Tab>
  <Tab title="diagnostics-otel">
    - Modèle **push** : OpenClaw envoie OTLP/HTTP à un collecteur ou à un backend compatible OTLP.
    - La surface inclut les métriques, les traces et les journaux.
    - Fait le pont vers Prometheus via un OpenTelemetry Collector (exportateur `prometheus` ou `prometheusremotewrite`) quand vous avez besoin des deux.
    - Consultez [Export OpenTelemetry](/fr/gateway/opentelemetry) pour le catalogue complet.

  </Tab>
</Tabs>

## Dépannage

<AccordionGroup>
  <Accordion title="Corps de réponse vide">
    - Vérifiez `diagnostics.enabled: true` dans la configuration.
    - Confirmez que le Plugin est activé et chargé avec `openclaw plugins list --enabled`.
    - Générez du trafic ; les compteurs et histogrammes n’émettent des lignes qu’après au moins un événement.

  </Accordion>
  <Accordion title="401 / non autorisé">
    Le point de terminaison nécessite le scope opérateur Gateway (`auth: "gateway"` avec `gatewayRuntimeScopeSurface: "trusted-operator"`). Utilisez le même token ou mot de passe que celui utilisé par Prometheus pour toute autre route opérateur Gateway. Il n’existe aucun mode public non authentifié.
  </Accordion>
  <Accordion title="`openclaw_prometheus_series_dropped_total` augmente">
    Un nouvel attribut dépasse le plafond de **2048** séries. Inspectez les métriques récentes pour détecter un libellé à cardinalité étonnamment élevée et corrigez-le à la source. L’exportateur abandonne intentionnellement les nouvelles séries au lieu de réécrire silencieusement les libellés.
  </Accordion>
  <Accordion title="Prometheus affiche des séries obsolètes après un redémarrage">
    Le Plugin conserve l’état uniquement en mémoire. Après un redémarrage du Gateway, les compteurs sont remis à zéro et les jauges reprennent à leur prochaine valeur signalée. Utilisez `rate()` et `increase()` PromQL pour gérer proprement les réinitialisations.
  </Accordion>
</AccordionGroup>

## Associé

- [Export de diagnostics](/fr/gateway/diagnostics) — zip de diagnostics local pour les lots de support
- [Santé et disponibilité](/fr/gateway/health) — sondes `/healthz` et `/readyz`
- [Journalisation](/fr/logging) — journalisation basée sur des fichiers
- [Export OpenTelemetry](/fr/gateway/opentelemetry) — envoi OTLP pour les traces, les métriques et les journaux
