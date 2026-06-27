---
read_when:
    - Il vous faut un hook de Plugin ou un outil pour demander avant l’exécution d’un effet de bord
    - Vous devez configurer l’emplacement où les invites d’approbation de Plugin sont envoyées
    - Vous choisissez entre les outils facultatifs, les approbations d’exécution et les approbations de Plugin
sidebarTitle: Permission requests
summary: Demander aux utilisateurs d’approuver les appels aux outils de Plugin et les invites d’autorisation propres aux Plugins
title: Demandes d’autorisation de Plugin
x-i18n:
    generated_at: "2026-06-27T17:51:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 72b860e9f8ddef80c70e943ec05353cbc0a917577382289649432a58c3ce6bd0
    source_path: plugins/plugin-permission-requests.md
    workflow: 16
---

Les demandes d'autorisation de Plugin permettent au code du Plugin de suspendre un appel d'outil ou une opération appartenant au Plugin jusqu'à ce qu'un utilisateur l'approuve ou le refuse. Elles utilisent le flux Gateway `plugin.approval.*` et les mêmes surfaces d'interface d'approbation qui gèrent les boutons d'approbation dans le chat et les commandes `/approve`.

Utilisez les demandes d'autorisation de Plugin pour les autorisations de Plugin/application. Elles ne remplacent pas les approbations d'exécution de l'hôte, les listes d'autorisation d'outils facultatives ni la revue d'autorisation native de Codex.

## Choisir le bon point de contrôle

Choisissez le point de contrôle qui correspond au point de décision dont vous avez besoin :

| Point de contrôle                 | À utiliser lorsque                                                         | Ce qu'il contrôle                                                                                                         |
| --------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Outils facultatifs                | Un outil ne doit pas être visible par le modèle avant l'adhésion de l'utilisateur. | Exposition des outils via `tools.allow`.                                                                                  |
| Demandes d'autorisation de Plugin | Un hook de Plugin ou une opération appartenant au Plugin doit demander avant l'exécution d'une action. | Approbation à l'exécution via `plugin.approval.*`.                                                                         |
| Approbations exec                 | Une commande hôte ou un outil de type shell nécessite l'approbation de l'opérateur. | Politique d'exécution de l'hôte et listes d'autorisation exec durables.                                                   |
| Demandes d'autorisation natives de Codex | Codex demande avant les actions natives de shell, fichier, MCP ou serveur d'application. | Gestion des approbations du serveur d'application Codex ou des hooks natifs, acheminée via les approbations de Plugin quand OpenClaw possède l'invite. |
| Sollicitations d'approbation MCP  | Un serveur Codex MCP demande l'approbation d'un appel d'outil.             | Réponses d'approbation MCP relayées via les approbations de Plugin OpenClaw.                                              |

Les outils facultatifs sont un point de contrôle au moment de la découverte. Les demandes d'autorisation de Plugin sont un point de contrôle par appel. Utilisez les deux lorsqu'un outil sensible doit nécessiter une adhésion explicite avant que le modèle puisse le voir et une approbation avant l'exécution de l'action.

## Demander l'approbation avant un appel d'outil

La plupart des invites rédigées par un Plugin doivent commencer dans un hook `before_tool_call`. Le hook s'exécute après que le modèle a sélectionné un outil et avant qu'OpenClaw ne l'exécute :

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
          timeoutBehavior: "deny",
          onResolution(decision) {
            console.log(`deploy approval resolved: ${decision}`);
          },
        },
      };
    });
  },
});
```

Rédigez le texte de l'invite pour la personne qui approuvera l'action :

- Gardez `title` court et centré sur l'action. Le Gateway accepte jusqu'à 80 caractères.
- Gardez `description` précise et bornée. Le Gateway accepte jusqu'à 256 caractères.
- Incluez l'action, la cible et le risque. N'incluez pas de secrets, de jetons ni de charges utiles privées qui ne doivent pas apparaître dans les surfaces d'approbation du chat.
- Utilisez `severity: "critical"` uniquement pour les actions où une mauvaise décision pourrait causer des dommages en production ou une perte de données.
- Utilisez `allowedDecisions: ["allow-once", "deny"]` lorsque la confiance persistante est dangereuse pour cette action.

## Comportement des décisions

OpenClaw crée une approbation en attente avec un ID `plugin:`, la transmet aux surfaces d'approbation disponibles et attend une décision.

| Décision          | Résultat                                                                  |
| ----------------- | ------------------------------------------------------------------------- |
| `allow-once`      | L'appel actuel continue.                                                  |
| `allow-always`    | L'appel actuel continue et la décision est transmise au Plugin.           |
| `deny`            | L'appel est bloqué avec un résultat d'outil refusé.                       |
| Expiration        | L'appel est bloqué sauf si `timeoutBehavior` vaut `"allow"`.              |
| Annulation        | L'appel est bloqué lorsque l'exécution est abandonnée.                    |
| Aucune route d'approbation | L'appel est bloqué car aucune surface d'approbation connectée ne peut le résoudre. |

`allow-always` n'est durable que lorsque le Plugin ou le runtime demandeur implémente cette persistance. Pour les hooks ordinaires `before_tool_call.requireApproval`, OpenClaw traite `allow-once` et `allow-always` comme des décisions d'approbation pour l'appel actuel et transmet la valeur résolue à `onResolution`. Si votre Plugin propose `allow-always`, documentez et implémentez exactement les futurs appels auxquels il accorde sa confiance.

Si le hook renvoie aussi `params`, OpenClaw applique ces changements de paramètres uniquement après la réussite de l'approbation. Un hook de priorité inférieure peut toujours bloquer après qu'un hook de priorité supérieure a demandé l'approbation.

`allowedDecisions` limite les boutons et les commandes affichés à l'utilisateur. Le Gateway rejette toute tentative de résolution pour une décision que la demande ne proposait pas.

## Acheminer les invites d'approbation

Les invites d'approbation peuvent être résolues dans des surfaces d'interface locales ou dans des canaux de chat qui prennent en charge la gestion des approbations. Pour transférer les invites d'approbation de Plugin vers des cibles de chat explicites, configurez `approvals.plugin` :

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

`approvals.plugin` est indépendant de `approvals.exec`. Activer le transfert des approbations exec n'achemine pas les invites d'approbation de Plugin, et activer le transfert des approbations de Plugin ne modifie pas la politique d'exécution de l'hôte.

Lorsqu'une invite inclut un texte d'approbation manuel, résolvez-la avec l'une des décisions proposées :

```text
/approve <id> allow-once
/approve <id> allow-always
/approve <id> deny
```

Consultez [Approbations exec avancées](/fr/tools/exec-approvals-advanced#plugin-approval-forwarding) pour le modèle complet de transfert, le comportement d'approbation dans le même chat, la livraison native par canal et les règles d'approbateur propres à chaque canal.

## Autorisations natives Codex

Les invites d'autorisation natives Codex peuvent aussi passer par les approbations de Plugin, mais leur propriété diffère de celle des hooks rédigés par un Plugin.

- Les demandes d'approbation du serveur d'application Codex sont acheminées via OpenClaw après la revue Codex.
- Le relais de hook natif `permission_request` peut demander via `plugin.approval.request` lorsque ce relais est activé.
- Les sollicitations d'approbation d'outil MCP sont acheminées via les approbations de Plugin lorsque Codex marque `_meta.codex_approval_kind` comme `"mcp_tool_call"`.

Consultez [Runtime du harnais Codex](/fr/plugins/codex-harness-runtime#native-permissions-and-mcp-elicitations) pour le comportement propre à Codex et les règles de repli.

## Dépannage

**L'outil indique que les approbations de Plugin ne sont pas disponibles.** Aucune interface d'approbation ou route d'approbation configurée n'a accepté la demande. Connectez un client capable d'approuver, utilisez un canal qui prend en charge `/approve` dans le même chat, ou configurez `approvals.plugin`.

**`allow-always` apparaît, mais l'appel suivant redemande une approbation.** Le flux générique d'approbation de Plugin ne persiste pas automatiquement la confiance pour des hooks arbitraires. Persistez la confiance appartenant au Plugin dans votre Plugin après `onResolution("allow-always")`, ou proposez uniquement `allow-once` et `deny`.

**`/approve` rejette la décision.** La demande a restreint `allowedDecisions`. Utilisez l'une des décisions affichées dans l'invite.

**Une invite Slack, Discord, Telegram ou Matrix est acheminée différemment des approbations exec.** Les approbations de Plugin et les approbations exec utilisent une configuration séparée et peuvent utiliser des vérifications d'autorisation différentes. Vérifiez `approvals.plugin` et la prise en charge des approbations de Plugin par le canal au lieu de vérifier seulement `approvals.exec`.

## Connexe

- [Hooks de Plugin](/fr/plugins/hooks#tool-call-policy)
- [Créer des Plugins](/fr/plugins/building-plugins#registering-agent-tools)
- [Approbations exec avancées](/fr/tools/exec-approvals-advanced#plugin-approval-forwarding)
- [Protocole Gateway](/fr/gateway/protocol)
- [Runtime du harnais Codex](/fr/plugins/codex-harness-runtime#native-permissions-and-mcp-elicitations)
