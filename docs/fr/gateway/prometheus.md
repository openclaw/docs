---
read_when:
    - Vous souhaitez que Prometheus, Grafana, VictoriaMetrics ou un autre collecteur récupère les métriques du Gateway OpenClaw
    - Vous avez besoin des noms de métriques Prometheus et de la politique relative aux libellés pour les tableaux de bord ou les alertes
    - Vous souhaitez obtenir des métriques sans exécuter de collecteur OpenTelemetry
sidebarTitle: Prometheus
summary: Exposez les diagnostics d’OpenClaw sous forme de métriques texte Prometheus grâce au Plugin diagnostics-prometheus
title: Métriques Prometheus
x-i18n:
    generated_at: "2026-07-12T02:52:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8a3975a9a79f32f1e9731b819613fdf6b9ffeee20bc71c841b9a6d7a5e0052f4
    source_path: gateway/prometheus.md
    workflow: 16
---

  OpenClaw peut exposer des métriques de diagnostic par l’intermédiaire du plugin officiel
  `diagnostics-prometheus`. Il écoute les diagnostics de confiance ainsi que
  les événements de diagnostic marqués en interne et gérés par le répartiteur (signaux de file d’attente, de mémoire et
  de récupération de session), puis fournit un point de terminaison texte Prometheus à l’adresse suivante :

  ```text
  GET /api/diagnostics/prometheus
  ```

  Le type de contenu est `text/plain; version=0.0.4; charset=utf-8`, soit le format
  d’exposition standard de Prometheus.

  <Warning>
  La route utilise l’authentification du Gateway (périmètre opérateur, surface réservée aux opérateurs de confiance). Ne l’exposez pas comme un point de terminaison public `/metrics` sans authentification. Collectez ses données via le même mécanisme d’authentification que celui utilisé pour les autres API d’opérateur.
  </Warning>

  Pour les traces, les journaux, l’envoi OTLP et les attributs sémantiques GenAI d’OpenTelemetry, consultez [Exportation OpenTelemetry](/fr/gateway/opentelemetry).

  ## Démarrage rapide

  <Steps>
  <Step title="Installer le plugin">
    ```bash
    openclaw plugins install clawhub:@openclaw/diagnostics-prometheus
    ```
  </Step>
  <Step title="Activer le plugin">
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
    La route HTTP est enregistrée au démarrage du plugin ; rechargez donc le Gateway après l’activation.
  </Step>
  <Step title="Collecter les données de la route protégée">
    Envoyez les mêmes informations d’authentification du Gateway que celles utilisées par vos clients opérateurs :

    ```bash
    curl -H "Authorization: Bearer $OPENCLAW_GATEWAY_TOKEN" \
      http://127.0.0.1:18789/api/diagnostics/prometheus
    ```

  </Step>
  <Step title="Connecter Prometheus">
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
`diagnostics.enabled` vaut `true` par défaut ; définissez-le sur `false` uniquement dans des environnements soumis à des contraintes strictes. S’il vaut `false`, le Plugin enregistre toujours la route HTTP, mais aucun événement de diagnostic n’est transmis à l’exportateur, de sorte que la réponse est vide.
</Note>

## Métriques exportées

| Métrique                                         | Type      | Libellés                                                                                  |
| ------------------------------------------------ | --------- | ----------------------------------------------------------------------------------------- |
| `openclaw_run_completed_total`                   | compteur  | `channel`, `model`, `outcome`, `provider`, `trigger`                                      |
| `openclaw_run_duration_seconds`                  | histogramme | `channel`, `model`, `outcome`, `provider`, `trigger`                                    |
| `openclaw_model_call_total`                      | compteur  | `api`, `error_category`, `model`, `outcome`, `provider`, `transport`                      |
| `openclaw_model_call_duration_seconds`           | histogramme | `api`, `error_category`, `model`, `outcome`, `provider`, `transport`                    |
| `openclaw_model_failover_total`                  | compteur  | `from_model`, `from_provider`, `lane`, `reason`, `suspended`, `to_model`, `to_provider`   |
| `openclaw_model_tokens_total`                    | compteur  | `agent`, `channel`, `model`, `provider`, `token_type`                                     |
| `openclaw_gen_ai_client_token_usage`             | histogramme | `model`, `provider`, `token_type`                                                       |
| `openclaw_model_cost_usd_total`                  | compteur  | `agent`, `channel`, `model`, `provider`                                                   |
| `openclaw_model_usage_duration_seconds`          | histogramme | `agent`, `channel`, `model`, `provider`                                                 |
| `openclaw_skill_used_total`                      | compteur  | `activation`, `agent`, `skill`, `source`                                                  |
| `openclaw_tool_execution_total`                  | compteur  | `error_category`, `outcome`, `params_kind`, `tool`, `tool_owner`, `tool_source`           |
| `openclaw_tool_execution_duration_seconds`       | histogramme | `error_category`, `outcome`, `params_kind`, `tool`, `tool_owner`, `tool_source`         |
| `openclaw_tool_execution_blocked_total`          | compteur  | `denied_reason`, `params_kind`, `tool`, `tool_owner`, `tool_source`                       |
| `openclaw_harness_run_total`                     | compteur  | `channel`, `error_category`, `harness`, `model`, `outcome`, `phase`, `plugin`, `provider` |
| `openclaw_harness_run_duration_seconds`          | histogramme | `channel`, `error_category`, `harness`, `model`, `outcome`, `phase`, `plugin`, `provider` |
| `openclaw_webhook_received_total`                | compteur  | `channel`, `webhook`                                                                      |
| `openclaw_webhook_error_total`                   | compteur  | `channel`, `webhook`                                                                      |
| `openclaw_webhook_duration_seconds`              | histogramme | `channel`, `webhook`                                                                    |
| `openclaw_message_received_total`                | compteur  | `channel`, `source`                                                                       |
| `openclaw_message_dispatch_started_total`        | compteur  | `channel`, `source`                                                                       |
| `openclaw_message_dispatch_completed_total`      | compteur  | `channel`, `outcome`, `reason`, `source`                                                  |
| `openclaw_message_dispatch_duration_seconds`     | histogramme | `channel`, `outcome`, `reason`, `source`                                                |
| `openclaw_message_processed_total`               | compteur  | `channel`, `outcome`, `reason`                                                            |
| `openclaw_message_processed_duration_seconds`    | histogramme | `channel`, `outcome`, `reason`                                                          |
| `openclaw_message_delivery_started_total`        | compteur  | `channel`, `delivery_kind`                                                                |
| `openclaw_message_delivery_total`                | compteur  | `channel`, `delivery_kind`, `error_category`, `outcome`                                   |
| `openclaw_message_delivery_duration_seconds`     | histogramme | `channel`, `delivery_kind`, `error_category`, `outcome`                                 |
| `openclaw_talk_event_total`                      | compteur  | `brain`, `event_type`, `mode`, `provider`, `transport`                                    |
| `openclaw_talk_event_duration_seconds`           | histogramme | `brain`, `event_type`, `mode`, `provider`, `transport`                                  |
| `openclaw_talk_audio_bytes`                      | histogramme | `brain`, `event_type`, `mode`, `provider`, `transport`                                  |
| `openclaw_queue_lane_size`                       | jauge     | `lane`                                                                                    |
| `openclaw_queue_lane_wait_seconds`               | histogramme | `lane`                                                                                  |
| `openclaw_session_state_total`                   | compteur  | `reason`, `state`                                                                         |
| `openclaw_session_queue_depth`                   | jauge     | `state`                                                                                   |
| `openclaw_session_turn_created_total`            | compteur  | `agent`, `channel`, `trigger`                                                             |
| `openclaw_session_stuck_total`                   | compteur  | `reason`, `state`                                                                         |
| `openclaw_session_stuck_age_seconds`             | histogramme | `reason`, `state`                                                                       |
| `openclaw_session_recovery_total`                | compteur  | `action`, `active_work_kind`, `state`, `status`                                           |
| `openclaw_session_recovery_age_seconds`          | histogramme | `action`, `active_work_kind`, `state`, `status`                                         |
| `openclaw_liveness_warning_total`                | compteur  | `reason`                                                                                  |
| `openclaw_liveness_sessions`                     | jauge     | `state`                                                                                   |
| `openclaw_liveness_event_loop_delay_p99_seconds` | histogramme | `reason`                                                                                |
| `openclaw_liveness_event_loop_delay_max_seconds` | histogramme | `reason`                                                                                |
| `openclaw_liveness_event_loop_utilization_ratio` | histogramme | `reason`                                                                                |
| `openclaw_liveness_cpu_core_ratio`               | histogramme | `reason`                                                                                |
| `openclaw_payload_large_total`                   | compteur  | `action`, `channel`, `plugin`, `reason`, `surface`                                        |
| `openclaw_payload_large_bytes`                   | histogramme | `action`, `channel`, `plugin`, `reason`, `surface`                                      |
| `openclaw_memory_bytes`                          | jauge     | `kind`                                                                                    |
| `openclaw_memory_rss_bytes`                      | histogramme | aucun                                                                                   |
| `openclaw_memory_pressure_total`                 | compteur  | `level`, `reason`                                                                         |
| `openclaw_telemetry_exporter_total`              | compteur  | `exporter`, `reason`, `signal`, `status`                                                  |
| `openclaw_prometheus_series_dropped_total`       | compteur  | aucun                                                                                     |
| `openclaw_diagnostic_async_queue_dropped_total`  | compteur  | `drop_class`                                                                              |
| `openclaw_diagnostic_async_queue_length`         | jauge     | aucun                                                                                     |

## Politique relative aux libellés

<AccordionGroup>
  <Accordion title="Libellés bornés à faible cardinalité">
    Les libellés Prometheus restent bornés et présentent une faible cardinalité. L’exportateur n’émet pas d’identifiants de diagnostic bruts tels que `runId`, `sessionKey`, `sessionId`, `callId`, `toolCallId`, les identifiants de message, les identifiants de conversation ou les identifiants de requête du fournisseur.

    Les valeurs des libellés sont expurgées et doivent respecter la politique d’OpenClaw relative aux caractères à faible cardinalité. Les valeurs qui ne respectent pas cette politique sont remplacées par `unknown`, `other` ou `none`, selon la métrique. Les libellés qui ressemblent à des clés de session d’agent délimitées par une portée sont également remplacés par `unknown`.

  </Accordion>
  <Accordion title="Limite des séries et comptabilisation des dépassements">
    L’exportateur limite à **2048** le nombre total de séries temporelles conservées en mémoire pour les compteurs, les jauges et les histogrammes. Toute nouvelle série dépassant cette limite est ignorée, et `openclaw_prometheus_series_dropped_total` est incrémenté de un à chaque fois.

    Surveillez ce compteur : il indique clairement qu’un attribut en amont laisse échapper des valeurs à forte cardinalité. L’exportateur ne relève jamais automatiquement la limite ; si le compteur augmente, corrigez la source plutôt que de désactiver la limite.

  </Accordion>
  <Accordion title="Ce qui n’apparaît jamais dans la sortie Prometheus">
    - texte des invites, texte des réponses, entrées des outils, sorties des outils, invites système
    - transcriptions des conversations, charges utiles audio, identifiants d’appel, identifiants de salle, jetons de transfert, identifiants de tour et identifiants de session bruts
    - identifiants bruts des requêtes des fournisseurs (uniquement des hachages bornés, le cas échéant, dans les traces — jamais dans les métriques)
    - clés de session et identifiants de session
    - noms d’hôte, chemins de fichiers, valeurs secrètes

  </Accordion>
</AccordionGroup>

## Recettes PromQL

```promql
# Jetons par minute, répartis par fournisseur
sum by (provider) (rate(openclaw_model_tokens_total[1m]))

# Dépenses (USD) au cours de la dernière heure, par modèle
sum by (model) (increase(openclaw_model_cost_usd_total[1h]))

# 95e centile de la durée d’exécution du modèle
histogram_quantile(
  0.95,
  sum by (le, provider, model)
    (rate(openclaw_run_duration_seconds_bucket[5m]))
)

# SLO du temps d’attente dans la file (95e centile inférieur à 2 s)
histogram_quantile(
  0.95,
  sum by (le, lane) (rate(openclaw_queue_lane_wait_seconds_bucket[5m]))
) < 2

# Utilisation des Skills, répartie par source bornée
sum by (skill, source) (increase(openclaw_skill_used_total[24h]))

# Séries Prometheus ignorées (alarme de cardinalité)
increase(openclaw_prometheus_series_dropped_total[15m]) > 0
```

<Tip>
Préférez `gen_ai_client_token_usage` pour les tableaux de bord multifournisseurs : cette métrique respecte les conventions sémantiques GenAI d’OpenTelemetry et reste cohérente avec celles des services GenAI autres qu’OpenClaw.
</Tip>

## Choisir entre l’export Prometheus et OpenTelemetry

OpenClaw prend en charge les deux interfaces indépendamment. Vous pouvez utiliser l’une, les deux ou aucune.

<Tabs>
  <Tab title="diagnostics-prometheus">
    - Modèle **Pull** : Prometheus collecte `/api/diagnostics/prometheus`.
    - Aucun collecteur externe requis.
    - Authentification assurée par le mécanisme habituel du Gateway.
    - L’interface fournit uniquement des métriques (sans traces ni journaux).
    - Solution idéale pour les infrastructures déjà standardisées sur Prometheus et Grafana.

  </Tab>
  <Tab title="diagnostics-otel">
    - Modèle **Push** : OpenClaw envoie des données OTLP/HTTP à un collecteur ou à un système dorsal compatible avec OTLP.
    - L’interface comprend les métriques, les traces et les journaux.
    - Assure la liaison avec Prometheus au moyen d’un collecteur OpenTelemetry (exportateur `prometheus` ou `prometheusremotewrite`) lorsque les deux sont nécessaires.
    - Consultez [Export OpenTelemetry](/fr/gateway/opentelemetry) pour obtenir le catalogue complet.

  </Tab>
</Tabs>

## Dépannage

<AccordionGroup>
  <Accordion title="Corps de réponse vide">
    - Vérifiez que `diagnostics.enabled` n’est pas défini sur `false` dans la configuration (sa valeur par défaut est `true`).
    - Confirmez que le Plugin est activé et chargé avec `openclaw plugins list --enabled`.
    - Générez du trafic ; les compteurs et les histogrammes n’émettent des lignes qu’après au moins un événement.

  </Accordion>
  <Accordion title="401 / non autorisé">
    Le point de terminaison nécessite la portée opérateur du Gateway (`auth: "gateway"` avec `gatewayRuntimeScopeSurface: "trusted-operator"`). Utilisez le même jeton ou mot de passe que celui employé par Prometheus pour toute autre route opérateur du Gateway. Aucun mode public sans authentification n’est disponible.
  </Accordion>
  <Accordion title="`openclaw_prometheus_series_dropped_total` augmente">
    Un nouvel attribut dépasse la limite de **2048** séries. Examinez les métriques récentes afin de repérer une étiquette présentant une cardinalité anormalement élevée, puis corrigez-la à la source. L’exportateur ignore volontairement les nouvelles séries au lieu de réécrire silencieusement les étiquettes.
  </Accordion>
  <Accordion title="Prometheus affiche des séries obsolètes après un redémarrage">
    Le Plugin conserve son état uniquement en mémoire. Après le redémarrage du Gateway, les compteurs sont remis à zéro et les jauges reprennent à la prochaine valeur signalée. Utilisez les fonctions PromQL `rate()` et `increase()` pour gérer proprement les réinitialisations.
  </Accordion>
</AccordionGroup>

## Voir aussi

- [Export des diagnostics](/fr/gateway/diagnostics) — archive ZIP des diagnostics locaux destinée aux dossiers d’assistance
- [État de santé et disponibilité](/fr/gateway/health) — sondes `/healthz` et `/readyz`
- [Journalisation](/fr/logging) — journalisation dans des fichiers
- [Export OpenTelemetry](/fr/gateway/opentelemetry) — envoi OTLP des traces, métriques et journaux
