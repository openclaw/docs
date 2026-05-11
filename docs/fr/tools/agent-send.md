---
read_when:
    - Vous voulez déclencher des exécutions d’agent depuis des scripts ou la ligne de commande
    - Vous devez transmettre les réponses de l’agent à un canal de chat par programmation
summary: Exécutez des tours d’agent depuis la CLI et transmettez éventuellement les réponses aux canaux
title: Envoi de l’agent
x-i18n:
    generated_at: "2026-05-11T20:56:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: a2e1b05414312321e7136867bb8b998754d4a46289cc02764eb61d83f7239af1
    source_path: tools/agent-send.md
    workflow: 16
---

`openclaw agent` exécute un seul tour d’agent depuis la ligne de commande sans nécessiter
de message de discussion entrant. Utilisez-le pour les workflows scriptés, les tests et
la livraison programmatique.

## Démarrage rapide

<Steps>
  <Step title="Exécuter un tour d’agent simple">
    ```bash
    openclaw agent --message "What is the weather today?"
    ```

    Cela envoie le message via le Gateway et affiche la réponse.

  </Step>

  <Step title="Cibler un agent ou une session spécifique">
    ```bash
    # Target a specific agent
    openclaw agent --agent ops --message "Summarize logs"

    # Target a phone number (derives session key)
    openclaw agent --to +15555550123 --message "Status update"

    # Reuse an existing session
    openclaw agent --session-id abc123 --message "Continue the task"
    ```

  </Step>

  <Step title="Livrer la réponse à un canal">
    ```bash
    # Deliver to WhatsApp (default channel)
    openclaw agent --to +15555550123 --message "Report ready" --deliver

    # Deliver to Slack
    openclaw agent --agent ops --message "Generate report" \
      --deliver --reply-channel slack --reply-to "#reports"
    ```

  </Step>
</Steps>

## Options

| Option                        | Description                                                 |
| ----------------------------- | ----------------------------------------------------------- |
| `--message \<text\>`          | Message à envoyer (obligatoire)                             |
| `--to \<dest\>`               | Déduire la clé de session à partir d’une cible (téléphone, identifiant de discussion) |
| `--agent \<id\>`              | Cibler un agent configuré (utilise sa session `main`)       |
| `--session-id \<id\>`         | Réutiliser une session existante par identifiant            |
| `--local`                     | Forcer le runtime intégré local (ignorer le Gateway)        |
| `--deliver`                   | Envoyer la réponse à un canal de discussion                 |
| `--channel \<name\>`          | Canal de livraison (whatsapp, telegram, discord, slack, etc.) |
| `--reply-to \<target\>`       | Remplacement de la cible de livraison                       |
| `--reply-channel \<name\>`    | Remplacement du canal de livraison                          |
| `--reply-account \<id\>`      | Remplacement de l’identifiant du compte de livraison        |
| `--thinking \<level\>`        | Définir le niveau de raisonnement pour le profil de modèle sélectionné |
| `--verbose \<on\|full\|off\>` | Définir le niveau de verbosité                              |
| `--timeout \<seconds\>`       | Remplacer le délai d’expiration de l’agent                  |
| `--json`                      | Produire du JSON structuré                                  |

## Comportement

- Par défaut, la CLI passe **par le Gateway**. Ajoutez `--local` pour forcer le
  runtime intégré sur la machine actuelle.
- Si le Gateway est inaccessible, la CLI **se rabat** sur l’exécution intégrée locale.
- Sélection de session : `--to` déduit la clé de session (les cibles de groupe/canal
  préservent l’isolation ; les discussions directes sont regroupées dans `main`).
- Les options de raisonnement et de verbosité persistent dans le magasin de session.
- Sortie : texte brut par défaut, ou `--json` pour une charge utile structurée + métadonnées.
- Avec `--json --deliver`, le JSON inclut l’état de livraison pour les envois
  envoyés, supprimés, partiels et échoués. Consultez
  [État de livraison JSON](/fr/cli/agent#json-delivery-status).

## Exemples

```bash
# Simple turn with JSON output
openclaw agent --to +15555550123 --message "Trace logs" --verbose on --json

# Turn with thinking level
openclaw agent --session-id 1234 --message "Summarize inbox" --thinking medium

# Deliver to a different channel than the session
openclaw agent --agent ops --message "Alert" --deliver --reply-channel telegram --reply-to "@admin"
```

## Associés

<CardGroup cols={2}>
  <Card title="Référence de la CLI d’agent" href="/fr/cli/agent" icon="terminal">
    Référence complète des options et indicateurs de `openclaw agent`.
  </Card>
  <Card title="Sous-agents" href="/fr/tools/subagents" icon="users">
    Lancement de sous-agents en arrière-plan.
  </Card>
  <Card title="Sessions" href="/fr/concepts/session" icon="comments">
    Fonctionnement des clés de session et résolution de `--to`, `--agent` et `--session-id`.
  </Card>
  <Card title="Commandes slash" href="/fr/tools/slash-commands" icon="slash">
    Catalogue de commandes natives utilisé dans les sessions d’agent.
  </Card>
</CardGroup>
