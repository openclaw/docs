---
read_when:
    - Vous avez besoin d’un hook de Plugin ou d’un outil pour demander confirmation avant l’exécution d’un effet secondaire
    - Vous devez configurer l’emplacement où les demandes d’approbation des plugins sont envoyées
    - Vous choisissez entre les outils facultatifs, les approbations d’exécution et les approbations de Plugins
sidebarTitle: Permission requests
summary: Demander aux utilisateurs d’approuver les appels d’outils des plugins et les demandes d’autorisation gérées par les plugins
title: Demandes d’autorisation des Plugins
x-i18n:
    generated_at: "2026-07-12T15:36:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 675534212e70cc7b2e7bdc801955929c6a8156b08d620483edf0133afc3bfdaa
    source_path: plugins/plugin-permission-requests.md
    workflow: 16
---

Les demandes d’autorisation des Plugins permettent au code d’un Plugin de suspendre un appel d’outil ou une opération appartenant au Plugin jusqu’à ce qu’un utilisateur l’approuve ou la refuse. Elles utilisent le flux `plugin.approval.*` du Gateway et les mêmes interfaces d’approbation qui gèrent les boutons d’approbation dans les conversations et les commandes `/approve`.

Utilisez les demandes d’autorisation des Plugins pour les autorisations des Plugins et des applications. Elles ne remplacent pas les approbations d’exécution de l’hôte, les listes d’autorisation facultatives d’outils ni l’examen natif des autorisations de Codex.

## Choisir le contrôle approprié

Choisissez le contrôle correspondant au point de décision dont vous avez besoin :

| Contrôle                             | Quand l’utiliser                                                              | Ce qu’il contrôle                                                                                                  |
| ------------------------------------ | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| Outils facultatifs                   | Un outil ne doit pas être visible par le modèle avant l’adhésion de l’utilisateur. | L’exposition des outils via `tools.allow`.                                                                         |
| Demandes d’autorisation des Plugins  | Un hook de Plugin ou une opération appartenant au Plugin doit demander une approbation avant l’exécution d’une action. | L’approbation à l’exécution via `plugin.approval.*`.                                                               |
| Approbations d’exécution             | Une commande de l’hôte ou un outil de type shell nécessite l’approbation de l’opérateur. | La politique d’exécution de l’hôte et les listes d’autorisation d’exécution persistantes.                          |
| Demandes d’autorisation natives de Codex | Codex demande une approbation avant des actions natives du shell, des fichiers, de MCP ou du serveur d’applications. | La gestion des approbations du serveur d’applications ou des hooks natifs de Codex, acheminée via les approbations de Plugins lorsqu’OpenClaw contrôle l’invite. |
| Sollicitations d’approbation MCP     | Un serveur MCP de Codex demande l’approbation d’un appel d’outil.              | Les réponses d’approbation MCP transmises via les approbations de Plugins d’OpenClaw.                              |

Les outils facultatifs constituent un contrôle au moment de la découverte. Les demandes d’autorisation des Plugins constituent un contrôle à chaque appel. Utilisez les deux lorsqu’un outil sensible doit nécessiter une adhésion explicite avant que le modèle puisse le voir, puis une approbation avant l’exécution de l’action.

## Demander une approbation avant un appel d’outil

La plupart des invites créées par des Plugins doivent commencer dans un hook `before_tool_call`. Le hook s’exécute après que le modèle a sélectionné un outil et avant qu’OpenClaw ne l’exécute :

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

export default definePluginEntry({
  id: "deploy-policy",
  name: "Deploy Policy",
  register(api) {
    api.on("before_tool_call", async (event) => {
      if (event.toolName !== "deploy_service") {
        return;
      }

      const environment =
        typeof event.params.environment === "string" ? event.params.environment : "unknown";

      return {
        requireApproval: {
          title: "Deploy service",
          description: `Deploy service to ${environment}.`,
          severity: environment === "production" ? "critical" : "warning",
          allowedDecisions:
            environment === "production"
              ? ["allow-once", "deny"]
              : ["allow-once", "allow-always", "deny"],
          timeoutMs: 120_000,
          onResolution(decision) {
            console.log(`deploy approval resolved: ${decision}`);
          },
        },
      };
    });
  },
});
```

Rédigez le texte de l’invite pour la personne qui approuvera l’action :

- Gardez `title` court et centré sur l’action ; le Gateway le limite à 80 caractères.
- Gardez `description` précis et bien délimité ; le Gateway le limite à 512 caractères.
- Incluez l’action, la cible et le risque. N’incluez pas de secrets, de jetons ni de charges utiles privées qui ne doivent pas apparaître dans les interfaces d’approbation des conversations.
- `severity` vaut par défaut `"warning"` lorsqu’il est omis. Utilisez `"critical"` uniquement pour les actions où une mauvaise décision pourrait endommager la production ou entraîner une perte de données.
- `allowedDecisions` vaut par défaut `["allow-once", "allow-always", "deny"]` lorsqu’il est omis. Transmettez `["allow-once", "deny"]` lorsqu’une confiance persistante n’est pas sûre pour cette action.
- `timeoutMs` vaut par défaut 120000 (2 minutes) et est plafonné à 600000 (10 minutes), quelle que soit la valeur demandée.

## Comportement des décisions

OpenClaw crée une approbation en attente avec un ID `plugin:`, la transmet aux interfaces d’approbation disponibles et attend une décision.

| Décision          | Résultat                                                                    |
| ----------------- | --------------------------------------------------------------------------- |
| `allow-once`      | L’appel actuel se poursuit.                                                 |
| `allow-always`    | L’appel actuel se poursuit et la décision est transmise au Plugin.          |
| `deny`            | L’appel est bloqué avec un résultat d’outil indiquant le refus.             |
| Expiration du délai | L’appel est bloqué.                                                       |
| Annulation        | L’appel est bloqué lorsque l’exécution est interrompue.                     |
| Aucun canal d’approbation | L’appel est bloqué, car aucune interface d’approbation connectée ne peut le résoudre. |

Seules les décisions exactes `allow-once` et `allow-always` autorisées par la demande permettent l’exécution. Les décisions inconnues, mal formées, non concordantes, manquantes ou arrivées après expiration du délai entraînent un refus par défaut. L’ancien champ `timeoutBehavior` reste accepté pour assurer la compatibilité des Plugins, mais il est obsolète et ignoré ; ne le définissez pas dans de nouveaux hooks.

`allow-always` n’est persistant que lorsque le Plugin ou l’environnement d’exécution demandeur met en œuvre cette persistance. Pour les hooks `before_tool_call.requireApproval` ordinaires, OpenClaw traite `allow-once` et `allow-always` comme des décisions d’approbation pour l’appel actuel et transmet la valeur résolue à `onResolution`. Si votre Plugin propose `allow-always`, documentez et implémentez précisément les futurs appels auxquels cette décision accorde sa confiance.

Si le hook renvoie également `params`, OpenClaw n’applique ces modifications de paramètres qu’après la réussite de l’approbation. Un hook de priorité inférieure peut encore bloquer l’appel après qu’un hook de priorité supérieure a demandé une approbation.

`allowedDecisions` limite les boutons et les commandes présentés à l’utilisateur. Le Gateway rejette toute tentative de résolution avec une décision que la demande ne proposait pas.

## Acheminer les invites d’approbation

Les invites d’approbation peuvent être résolues dans des interfaces locales ou dans des canaux de conversation prenant en charge la gestion des approbations. Pour transférer les invites d’approbation de Plugins vers des cibles de conversation explicites, configurez `approvals.plugin` :

```json5
{
  approvals: {
    plugin: {
      enabled: true,
      mode: "targets",
      agentFilter: ["main"],
      targets: [{ channel: "slack", to: "U12345678" }],
    },
  },
}
```

`approvals.plugin` est indépendant de `approvals.exec`. L’activation du transfert des approbations d’exécution n’achemine pas les invites d’approbation des Plugins, et l’activation du transfert des approbations des Plugins ne modifie pas la politique d’exécution de l’hôte.

Lorsqu’une invite contient un texte d’approbation manuelle, résolvez-la avec l’une des décisions proposées :

```text
/approve <id> allow-once
/approve <id> allow-always
/approve <id> deny
```

Consultez [Approbations d’exécution avancées](/fr/tools/exec-approvals-advanced#plugin-approval-forwarding) pour le modèle complet de transfert, le comportement d’approbation dans la même conversation, la livraison native par canal et les règles d’approbateur propres à chaque canal.

## Autorisations natives de Codex

Les invites d’autorisation natives de Codex peuvent également transiter par les approbations de Plugins, mais leur responsabilité diffère de celle des hooks créés par les Plugins.

- Les demandes d’approbation du serveur d’applications de Codex sont acheminées via OpenClaw après l’examen de Codex.
- Le relais du hook natif `permission_request` peut effectuer une demande via `plugin.approval.request` lorsque ce relais est activé.
- Les sollicitations d’approbation d’outils MCP sont acheminées via les approbations de Plugins lorsque Codex définit `_meta.codex_approval_kind` sur `"mcp_tool_call"`.

Consultez [Environnement d’exécution du harnais Codex](/fr/plugins/codex-harness-runtime#native-permissions-and-mcp-elicitations) pour le comportement propre à Codex et les règles de repli.

## Résolution des problèmes

**L’outil indique que les approbations de Plugins ne sont pas disponibles.** Aucune interface d’approbation ni aucun canal d’approbation configuré n’a accepté la demande. Connectez un client capable de gérer les approbations, utilisez un canal prenant en charge `/approve` dans la même conversation ou configurez `approvals.plugin`.

**`allow-always` apparaît, mais l’appel suivant demande à nouveau une approbation.** Le flux générique d’approbation des Plugins ne conserve pas automatiquement la confiance pour les hooks arbitraires. Conservez la confiance appartenant au Plugin dans votre Plugin après `onResolution("allow-always")`, ou ne proposez que `allow-once` et `deny`.

**`/approve` rejette la décision.** La demande a restreint `allowedDecisions`. Utilisez l’une des décisions affichées dans l’invite.

**Une invite Discord, Matrix, Slack ou Telegram est acheminée différemment des approbations d’exécution.** Les approbations des Plugins et les approbations d’exécution utilisent des configurations distinctes et peuvent appliquer des contrôles d’autorisation différents. Vérifiez `approvals.plugin` et la prise en charge des approbations de Plugins par le canal au lieu de vérifier uniquement `approvals.exec`.

## Pages connexes

- [Hooks de Plugins](/fr/plugins/hooks#tool-call-policy)
- [Création de Plugins](/fr/plugins/building-plugins#registering-tools)
- [Approbations d’exécution avancées](/fr/tools/exec-approvals-advanced#plugin-approval-forwarding)
- [Protocole du Gateway](/fr/gateway/protocol)
- [Environnement d’exécution du harnais Codex](/fr/plugins/codex-harness-runtime#native-permissions-and-mcp-elicitations)
