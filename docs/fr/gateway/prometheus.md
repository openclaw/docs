---
read_when:
    - Vous voulez que Prometheus, Grafana, VictoriaMetrics ou un autre scraper collecte les métriques de la Gateway OpenClaw
    - Vous avez besoin des noms de métriques Prometheus et de la politique de labels pour les tableaux de bord ou les alertes
    - Vous voulez des métriques sans exécuter de collecteur OpenTelemetry
sidebarTitle: Prometheus
summary: Exposer les diagnostics OpenClaw sous forme de métriques texte Prometheus via le Plugin diagnostics-prometheus
title: Métriques Prometheus
x-i18n:
    generated_at: "2026-04-26T11:30:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 29fd3e4658ceffe20f078e8e38b61c685ea9df518ca04ca34abf2085166eb481
    source_path: gateway/prometheus.md
    workflow: 15
---

OpenClaw peut exposer les métriques de diagnostic via le Plugin intégré `diagnostics-prometheus`. Il écoute les diagnostics internes de confiance et génère un endpoint texte Prometheus à l’adresse :

```text
GET /api/diagnostics/prometheus
```

Le type de contenu est `text/plain; version=0.0.4; charset=utf-8`, le format d’exposition standard de Prometheus.

<Warning>
La route utilise l’authentification Gateway (portée operator). Ne l’exposez pas comme endpoint `/metrics` public non authentifié. Faites-la scraper via le même chemin d’authentification que celui utilisé pour vos autres API operator.
</Warning>

Pour les traces, journaux, envoi OTLP push et attributs sémantiques OpenTelemetry GenAI, voir [OpenTelemetry export](/fr/gateway/opentelemetry).

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
  <Step title="Redémarrer la Gateway">
    La route HTTP est enregistrée au démarrage du Plugin, donc rechargez après activation.
  </Step>
  <Step title="Scraper la route protégée">
    Envoyez la même authentification gateway que celle utilisée par vos clients operator :

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
`diagnostics.enabled: true` est requis. Sans cela, le Plugin enregistre quand même la route HTTP mais aucun événement de diagnostic n’alimente l’exporteur, donc la réponse est vide.
</Note>

## Métriques exportées

| Métrique                                      | Type      | Labels                                                                                    |
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
| `openclaw_memory_rss_bytes`                   | histogram | none                                                                                      |
| `openclaw_memory_pressure_total`              | counter   | `level`, `reason`                                                                         |
| `openclaw_telemetry_exporter_total`           | counter   | `exporter`, `reason`, `signal`, `status`                                                  |
| `openclaw_prometheus_series_dropped_total`    | counter   | none                                                                                      |

## Politique de labels

<AccordionGroup>
  <Accordion title="Labels bornés à faible cardinalité">
    Les labels Prometheus restent bornés et à faible cardinalité. L’exporteur n’émet pas d’identifiants de diagnostic bruts tels que `runId`, `sessionKey`, `sessionId`, `callId`, `toolCallId`, IDs de message, IDs de chat ou IDs de requête fournisseur.

    Les valeurs de label sont expurgées et doivent respecter la politique de caractères à faible cardinalité d’OpenClaw. Les valeurs qui ne respectent pas cette politique sont remplacées par `unknown`, `other` ou `none`, selon la métrique.

  </Accordion>
  <Accordion title="Plafond de séries et comptabilisation des dépassements">
    L’exporteur limite les séries temporelles conservées en mémoire à **2048** séries au total, compteurs, gauges et histogrammes confondus. Les nouvelles séries au-delà de ce plafond sont supprimées, et `openclaw_prometheus_series_dropped_total` s’incrémente de un à chaque occurrence.

    Surveillez ce compteur comme signal fort qu’un attribut en amont fuit des valeurs à forte cardinalité. L’exporteur ne relève jamais automatiquement ce plafond ; s’il augmente, corrigez la source au lieu de désactiver le plafond.

  </Accordion>
  <Accordion title="Ce qui n’apparaît jamais dans la sortie Prometheus">
    - texte d’invite, texte de réponse, entrées d’outil, sorties d’outil, prompts système
    - IDs de requête fournisseur bruts (uniquement des hachages bornés, le cas échéant, sur les spans — jamais sur les métriques)
    - clés de session et IDs de session
    - noms d’hôte, chemins de fichier, valeurs secrètes

  </Accordion>
</AccordionGroup>

## Recettes PromQL

```promql
# Jetons par minute, ventilés par fournisseur
sum by (provider) (rate(openclaw_model_tokens_total[1m]))

# Dépenses (USD) sur la dernière heure, par modèle
sum by (model) (increase(openclaw_model_cost_usd_total[1h]))

# 95e percentile de durée d’exécution du modèle
histogram_quantile(
  0.95,
  sum by (le, provider, model)
    (rate(openclaw_run_duration_seconds_bucket[5m]))
)

# SLO de temps d’attente en file (95p sous 2s)
histogram_quantile(
  0.95,
  sum by (le, lane) (rate(openclaw_queue_lane_wait_seconds_bucket[5m]))
) < 2

# Séries Prometheus supprimées (alarme de cardinalité)
increase(openclaw_prometheus_series_dropped_total[15m]) > 0
```

<Tip>
Préférez `gen_ai_client_token_usage` pour les tableaux de bord inter-fournisseurs : il suit les conventions sémantiques OpenTelemetry GenAI et reste cohérent avec les métriques des services GenAI non OpenClaw.
</Tip>

## Choisir entre Prometheus et OpenTelemetry export

OpenClaw prend en charge les deux surfaces indépendamment. Vous pouvez exécuter l’une, l’autre, les deux ou aucune.

<Tabs>
  <Tab title="diagnostics-prometheus">
    - Modèle **pull** : Prometheus scrape `/api/diagnostics/prometheus`.
    - Aucun collecteur externe requis.
    - Authentifié via l’authentification Gateway normale.
    - Surface limitée aux métriques (pas de traces ni de journaux).
    - Idéal pour les piles déjà standardisées sur Prometheus + Grafana.

  </Tab>
  <Tab title="diagnostics-otel">
    - Modèle **push** : OpenClaw envoie OTLP/HTTP vers un collecteur ou un backend compatible OTLP.
    - La surface inclut métriques, traces et journaux.
    - Fait le pont vers Prometheus via un OpenTelemetry Collector (exporteur `prometheus` ou `prometheusremotewrite`) lorsque vous avez besoin des deux.
    - Voir [OpenTelemetry export](/fr/gateway/opentelemetry) pour le catalogue complet.

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
    L’endpoint requiert la portée operator Gateway (`auth: "gateway"` avec `gatewayRuntimeScopeSurface: "trusted-operator"`). Utilisez le même jeton ou mot de passe que Prometheus utilise pour n’importe quelle autre route operator Gateway. Il n’existe pas de mode public non authentifié.
  </Accordion>
  <Accordion title="`openclaw_prometheus_series_dropped_total` augmente">
    Un nouvel attribut dépasse le plafond de **2048** séries. Inspectez les métriques récentes pour détecter un label à cardinalité anormalement élevée et corrigez-le à la source. L’exporteur supprime volontairement les nouvelles séries au lieu de réécrire silencieusement les labels.
  </Accordion>
  <Accordion title="Prometheus affiche des séries obsolètes après un redémarrage">
    Le Plugin conserve son état uniquement en mémoire. Après un redémarrage de la Gateway, les compteurs repartent à zéro et les gauges redémarrent à leur prochaine valeur rapportée. Utilisez `rate()` et `increase()` en PromQL pour gérer proprement les remises à zéro.
  </Accordion>
</AccordionGroup>

## Associé

- [Export de diagnostics](/fr/gateway/diagnostics) — zip local de diagnostics pour les bundles de support
- [État de santé et readiness](/fr/gateway/health) — sondes `/healthz` et `/readyz`
- [Journalisation](/fr/logging) — journalisation basée sur des fichiers
- [OpenTelemetry export](/fr/gateway/opentelemetry) — envoi OTLP push pour les traces, métriques et journaux
