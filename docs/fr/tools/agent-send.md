---
read_when:
    - Vous souhaitez déclencher des exécutions d’agent depuis des scripts ou la ligne de commande
    - Vous devez transmettre les réponses de l’agent à un canal de discussion par programmation
summary: Exécuter des tours d’agent depuis la CLI et transmettre éventuellement les réponses aux canaux
title: Envoi de l’agent
x-i18n:
    generated_at: "2026-06-27T18:15:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 25026258a5a47c87fbf99689de5ea16d827b11af07bc5ce4f6c3e2bda6466b46
    source_path: tools/agent-send.md
    workflow: 16
---

`openclaw agent` exécute un seul tour d’agent depuis la ligne de commande sans nécessiter
de message de chat entrant. Utilisez-le pour les workflows scriptés, les tests et la
livraison programmatique.

## Démarrage rapide

<Steps>
  <Step title="Exécuter un tour d’agent simple">
    ```bash
    openclaw agent --agent main --message "What is the weather today?"
    ```

    Cela envoie le message via le Gateway et affiche la réponse.

  </Step>

  <Step title="Envoyer une invite multiligne depuis un fichier">
    ```bash
    openclaw agent --agent ops --message-file ./task.md
    ```

    Cela lit un fichier UTF-8 valide comme corps du message de l’agent.

  </Step>

  <Step title="Cibler un agent ou une session spécifique">
    ```bash
    # Target a specific agent
    openclaw agent --agent ops --message "Summarize logs"

    # Target a phone number (derives session key)
    openclaw agent --to +15555550123 --message "Status update"

    # Reuse an existing session
    openclaw agent --session-id abc123 --message "Continue the task"

    # Target an exact session key
    openclaw agent --session-key agent:ops:incident-42 --message "Summarize status"
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

## Indicateurs

| Indicateur                    | Description                                                       |
| ----------------------------- | ----------------------------------------------------------------- |
| `--message \<text\>`          | Message en ligne à envoyer                                        |
| `--message-file \<path\>`     | Lire le message depuis un fichier UTF-8 valide                    |
| `--to \<dest\>`               | Dériver la clé de session depuis une cible (téléphone, id de chat) |
| `--session-key \<key\>`       | Utiliser une clé de session explicite                             |
| `--agent \<id\>`              | Cibler un agent configuré (utilise sa session `main`)             |
| `--session-id \<id\>`         | Réutiliser une session existante par id                           |
| `--local`                     | Forcer le runtime intégré local (ignorer le Gateway)              |
| `--deliver`                   | Envoyer la réponse à un canal de chat                             |
| `--channel \<name\>`          | Canal de livraison (whatsapp, telegram, discord, slack, etc.)     |
| `--reply-to \<target\>`       | Remplacement de la cible de livraison                             |
| `--reply-channel \<name\>`    | Remplacement du canal de livraison                                |
| `--reply-account \<id\>`      | Remplacement de l’id de compte de livraison                       |
| `--thinking \<level\>`        | Définir le niveau de réflexion pour le profil de modèle sélectionné |
| `--verbose \<on\|full\|off\>` | Définir le niveau de verbosité                                    |
| `--timeout \<seconds\>`       | Remplacer le délai d’expiration de l’agent                        |
| `--json`                      | Produire du JSON structuré                                        |

## Comportement

- Par défaut, la CLI passe **par le Gateway**. Ajoutez `--local` pour forcer le
  runtime intégré sur la machine actuelle.
- Passez exactement l’un des deux : `--message` ou `--message-file`. Les messages issus de fichiers conservent
  le contenu multiligne après suppression d’un BOM UTF-8 facultatif.
- Si le Gateway est injoignable, la CLI **se rabat** sur l’exécution intégrée locale.
- Sélection de session : `--to` dérive la clé de session (les cibles de groupe/canal
  conservent l’isolation ; les chats directs se replient sur `main`).
- `--session-key` sélectionne une clé explicite. Les clés préfixées par agent doivent utiliser
  `agent:<agent-id>:<session-key>`, et `--agent` doit correspondre à cet id d’agent lorsque
  les deux sont fournis. Les clés nues non sentinelles sont limitées à `--agent` lorsqu’il est
  fourni ; par exemple, `--agent ops --session-key incident-42` achemine vers
  `agent:ops:incident-42`. Sans `--agent`, les clés nues non sentinelles sont limitées
  à l’agent par défaut configuré. Les littéraux `global` et `unknown` restent
  sans portée uniquement lorsqu’aucun `--agent` n’est fourni ; dans ce cas, le repli intégré
  et la propriété du stockage utilisent l’agent par défaut configuré.
- Les indicateurs de réflexion et de verbosité persistent dans le stockage de session.
- Sortie : texte brut par défaut, ou `--json` pour une charge utile structurée + métadonnées.
- Avec `--json --deliver`, le JSON inclut l’état de livraison pour les envois effectués,
  supprimés, partiels et échoués. Consultez
  [État de livraison JSON](/fr/cli/agent#json-delivery-status).

## Exemples

```bash
# Simple turn with JSON output
openclaw agent --to +15555550123 --message "Trace logs" --verbose on --json

# Turn with thinking level
openclaw agent --session-id 1234 --message "Summarize inbox" --thinking medium

# Multiline prompt from a file
openclaw agent --agent ops --message-file ./task.md

# Exact session key
openclaw agent --session-key agent:ops:incident-42 --message "Summarize status"

# Legacy key scoped to an agent
openclaw agent --agent ops --session-key incident-42 --message "Summarize status"

# Deliver to a different channel than the session
openclaw agent --agent ops --message "Alert" --deliver --reply-channel telegram --reply-to "@admin"
```

## Connexe

<CardGroup cols={2}>
  <Card title="Référence de la CLI d’agent" href="/fr/cli/agent" icon="terminal">
    Référence complète des indicateurs et options de `openclaw agent`.
  </Card>
  <Card title="Sous-agents" href="/fr/tools/subagents" icon="users">
    Lancement de sous-agents en arrière-plan.
  </Card>
  <Card title="Sessions" href="/fr/concepts/session" icon="comments">
    Fonctionnement des clés de session et manière dont `--to`, `--agent` et `--session-id` les résolvent.
  </Card>
  <Card title="Commandes slash" href="/fr/tools/slash-commands" icon="slash">
    Catalogue de commandes natives utilisé dans les sessions d’agent.
  </Card>
</CardGroup>
