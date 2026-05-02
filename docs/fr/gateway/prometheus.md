---
read_when:
    - Vous souhaitez que Prometheus, Grafana, VictoriaMetrics ou un autre collecteur recueille les métriques d’OpenClaw Gateway
    - Vous avez besoin des noms des métriques Prometheus et de la politique relative aux étiquettes pour les tableaux de bord ou les alertes
    - Vous voulez des métriques sans exécuter de collecteur OpenTelemetry
sidebarTitle: Prometheus
summary: Exposer les diagnostics OpenClaw sous forme de métriques texte Prometheus via le plugin diagnostics-prometheus
title: Métriques Prometheus
x-i18n:
    generated_at: "2026-05-02T20:46:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 49df17348c5b63c4b5f3c05f3378d43764e5de985135ad30c1e74ef607e0dd37
    source_path: gateway/prometheus.md
    workflow: 16
---

OpenClaw peut exposer des métriques de diagnostic via le plugin officiel `diagnostics-prometheus`. Il écoute les diagnostics internes de confiance et restitue un endpoint texte Prometheus à l’adresse :

```text
GET /api/diagnostics/prometheus
```

Le type de contenu est `text/plain; version=0.0.4; charset=utf-8`, le format d’exposition Prometheus standard.

<Warning>
La route utilise l’authentification Gateway (portée opérateur). Ne l’exposez pas comme endpoint public non authentifié `/metrics`. Scrapez-la via le même chemin d’authentification que celui utilisé pour vos autres API opérateur.
</Warning>

Pour les traces, les journaux, le push OTLP et les attributs sémantiques OpenTelemetry GenAI, consultez [Export OpenTelemetry](/fr/gateway/opentelemetry).

## Démarrage rapide

<Steps>
  <Step title="Installer le plugin">
    ```bash
    openclaw plugins install clawhub:@openclaw/diagnostics-prometheus
    ```
  </Step>
  <Step title="Activer le plugin">
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
  <Step title="Redémarrer le Gateway">
    La route HTTP est enregistrée au démarrage du plugin ; rechargez donc après l’activation.
  </Step>
  <Step title="Scraper la route protégée">
    Envoyez la même authentification gateway que celle utilisée par vos clients opérateur :

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
`diagnostics.enabled: true` est requis. Sans cela, le plugin enregistre quand même la route HTTP, mais aucun événement de diagnostic n’arrive dans l’exporteur ; la réponse est donc vide.
</Note>

## Métriques exportées

| Métrique                                      | Type        | Libellés                                                                                  |
| --------------------------------------------- | ----------- | ----------------------------------------------------------------------------------------- |
| `openclaw_run_completed_total`                | compteur    | `channel`, `model`, `outcome`, `provider`, `trigger`                                      |
| `openclaw_run_duration_seconds`               | histogramme | `channel`, `model`, `outcome`, `provider`, `trigger`                                      |
| `openclaw_model_call_total`                   | compteur    | `api`, `error_category`, `model`, `outcome`, `provider`, `transport`                      |
| `openclaw_model_call_duration_seconds`        | histogramme | `api`, `error_category`, `model`, `outcome`, `provider`, `transport`                      |
| `openclaw_model_tokens_total`                 | compteur    | `agent`, `channel`, `model`, `provider`, `token_type`                                     |
| `openclaw_gen_ai_client_token_usage`          | histogramme | `model`, `provider`, `token_type`                                                         |
| `openclaw_model_cost_usd_total`               | compteur    | `agent`, `channel`, `model`, `provider`                                                   |
| `openclaw_tool_execution_total`               | compteur    | `error_category`, `outcome`, `params_kind`, `tool`                                        |
| `openclaw_tool_execution_duration_seconds`    | histogramme | `error_category`, `outcome`, `params_kind`, `tool`                                        |
| `openclaw_harness_run_total`                  | compteur    | `channel`, `error_category`, `harness`, `model`, `outcome`, `phase`, `plugin`, `provider` |
| `openclaw_harness_run_duration_seconds`       | histogramme | `channel`, `error_category`, `harness`, `model`, `outcome`, `phase`, `plugin`, `provider` |
| `openclaw_message_processed_total`            | compteur    | `channel`, `outcome`, `reason`                                                            |
| `openclaw_message_processed_duration_seconds` | histogramme | `channel`, `outcome`, `reason`                                                            |
| `openclaw_message_delivery_total`             | compteur    | `channel`, `delivery_kind`, `error_category`, `outcome`                                   |
| `openclaw_message_delivery_duration_seconds`  | histogramme | `channel`, `delivery_kind`, `error_category`, `outcome`                                   |
| `openclaw_queue_lane_size`                    | jauge       | `lane`                                                                                    |
| `openclaw_queue_lane_wait_seconds`            | histogramme | `lane`                                                                                    |
| `openclaw_session_state_total`                | compteur    | `reason`, `state`                                                                         |
| `openclaw_session_queue_depth`                | jauge       | `state`                                                                                   |
| `openclaw_memory_bytes`                       | jauge       | `kind`                                                                                    |
| `openclaw_memory_rss_bytes`                   | histogramme | aucun                                                                                     |
| `openclaw_memory_pressure_total`              | compteur    | `level`, `reason`                                                                         |
| `openclaw_telemetry_exporter_total`           | compteur    | `exporter`, `reason`, `signal`, `status`                                                  |
| `openclaw_prometheus_series_dropped_total`    | compteur    | aucun                                                                                     |

## Politique de libellés

<AccordionGroup>
  <Accordion title="Libellés bornés et à faible cardinalité">
    Les libellés Prometheus restent bornés et à faible cardinalité. L’exporteur n’émet pas d’identifiants de diagnostic bruts tels que `runId`, `sessionKey`, `sessionId`, `callId`, `toolCallId`, les ID de message, les ID de chat ou les ID de requête fournisseur.

    Les valeurs des libellés sont expurgées et doivent correspondre à la politique de caractères à faible cardinalité d’OpenClaw. Les valeurs qui échouent à cette politique sont remplacées par `unknown`, `other` ou `none`, selon la métrique.

  </Accordion>
  <Accordion title="Plafond des séries et comptabilisation des dépassements">
    L’exporteur limite les séries temporelles conservées en mémoire à **2048** séries au total pour les compteurs, jauges et histogrammes combinés. Les nouvelles séries au-delà de ce plafond sont abandonnées, et `openclaw_prometheus_series_dropped_total` est incrémenté de un à chaque fois.

    Surveillez ce compteur comme un signal fort indiquant qu’un attribut en amont fuit des valeurs à forte cardinalité. L’exporteur ne relève jamais automatiquement le plafond ; s’il augmente, corrigez la source plutôt que de désactiver le plafond.

  </Accordion>
  <Accordion title="Ce qui n’apparaît jamais dans la sortie Prometheus">
    - texte de prompt, texte de réponse, entrées d’outils, sorties d’outils, prompts système
    - ID de requête fournisseur bruts (uniquement des hachages bornés, le cas échéant, sur les spans — jamais sur les métriques)
    - clés de session et ID de session
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

# Dropped Prometheus series (cardinality alarm)
increase(openclaw_prometheus_series_dropped_total[15m]) > 0
```

<Tip>
Préférez `gen_ai_client_token_usage` pour les tableaux de bord multi-fournisseurs : il suit les conventions sémantiques OpenTelemetry GenAI et reste cohérent avec les métriques de services GenAI non OpenClaw.
</Tip>

## Choisir entre Prometheus et l’export OpenTelemetry

OpenClaw prend en charge les deux surfaces indépendamment. Vous pouvez utiliser l’une, les deux, ou aucune.

<Tabs>
  <Tab title="diagnostics-prometheus">
    - Modèle **pull** : Prometheus scrape `/api/diagnostics/prometheus`.
    - Aucun collecteur externe requis.
    - Authentifié via l’authentification Gateway normale.
    - La surface couvre uniquement les métriques (pas de traces ni de journaux).
    - Idéal pour les piles déjà standardisées sur Prometheus + Grafana.

  </Tab>
  <Tab title="diagnostics-otel">
    - Modèle **push** : OpenClaw envoie OTLP/HTTP vers un collecteur ou un backend compatible OTLP.
    - La surface inclut les métriques, les traces et les journaux.
    - Se connecte à Prometheus via un OpenTelemetry Collector (exporteur `prometheus` ou `prometheusremotewrite`) lorsque vous avez besoin des deux.
    - Consultez [Export OpenTelemetry](/fr/gateway/opentelemetry) pour le catalogue complet.

  </Tab>
</Tabs>

## Dépannage

<AccordionGroup>
  <Accordion title="Corps de réponse vide">
    - Vérifiez `diagnostics.enabled: true` dans la configuration.
    - Confirmez que le plugin est activé et chargé avec `openclaw plugins list --enabled`.
    - Générez du trafic ; les compteurs et histogrammes n’émettent des lignes qu’après au moins un événement.

  </Accordion>
  <Accordion title="401 / non autorisé">
    L’endpoint exige la portée opérateur du Gateway (`auth: "gateway"` avec `gatewayRuntimeScopeSurface: "trusted-operator"`). Utilisez le même token ou mot de passe que Prometheus utilise pour toute autre route opérateur du Gateway. Il n’existe aucun mode public non authentifié.
  </Accordion>
  <Accordion title="`openclaw_prometheus_series_dropped_total` augmente">
    Un nouvel attribut dépasse le plafond de **2048** séries. Inspectez les métriques récentes pour trouver un libellé à cardinalité anormalement élevée, puis corrigez-le à la source. L’exporteur abandonne volontairement les nouvelles séries au lieu de réécrire silencieusement les libellés.
  </Accordion>
  <Accordion title="Prometheus affiche des séries obsolètes après un redémarrage">
    Le plugin conserve l’état uniquement en mémoire. Après un redémarrage du Gateway, les compteurs reviennent à zéro et les jauges redémarrent à leur prochaine valeur signalée. Utilisez `rate()` et `increase()` dans PromQL pour gérer proprement les réinitialisations.
  </Accordion>
</AccordionGroup>

## Connexe

- [Export des diagnostics](/fr/gateway/diagnostics) — zip de diagnostics local pour les bundles de support
- [Santé et disponibilité](/fr/gateway/health) — sondes `/healthz` et `/readyz`
- [Journalisation](/fr/logging) — journalisation basée sur des fichiers
- [Export OpenTelemetry](/fr/gateway/opentelemetry) — push OTLP pour les traces, métriques et journaux
