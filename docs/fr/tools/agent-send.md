---
read_when:
    - Vous souhaitez déclencher des exécutions d’agent depuis des scripts ou la ligne de commande
    - Vous devez envoyer par programmation les réponses de l’agent à un canal de discussion.
summary: Exécutez des tours d’agent depuis la CLI et transmettez éventuellement les réponses aux canaux
title: Envoi de l’agent
x-i18n:
    generated_at: "2026-07-12T03:10:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 23ad57735bd43a2bba5add571e9572da0fbe7b516a70515c674e1ababaab081a
    source_path: tools/agent-send.md
    workflow: 16
---

`openclaw agent` exécute un seul tour d’agent depuis la ligne de commande sans
message de discussion entrant. Utilisez-le pour les workflows scriptés, les tests et
la distribution automatisée. Référence complète des options et du comportement :
[Référence de la CLI de l’agent](/fr/cli/agent).

## Démarrage rapide

<Steps>
  <Step title="Exécuter un tour d’agent simple">
    ```bash
    openclaw agent --agent main --message "What is the weather today?"
    ```

    Envoie le message via le Gateway et affiche la réponse.

  </Step>

  <Step title="Envoyer une invite multiligne depuis un fichier">
    ```bash
    openclaw agent --agent ops --message-file ./task.md
    ```

    Lit un fichier UTF-8 valide comme corps du message de l’agent.

  </Step>

  <Step title="Cibler un agent ou une session spécifique">
    ```bash
    # Cibler un agent spécifique
    openclaw agent --agent ops --message "Summarize logs"

    # Cibler un numéro de téléphone (dérive la clé de session)
    openclaw agent --to +15555550123 --message "Status update"

    # Réutiliser une session existante
    openclaw agent --session-id abc123 --message "Continue the task"

    # Cibler une clé de session exacte
    openclaw agent --session-key agent:ops:incident-42 --message "Summarize status"
    ```

  </Step>

  <Step title="Distribuer la réponse sur un canal">
    ```bash
    # Distribuer sur WhatsApp (canal par défaut)
    openclaw agent --to +15555550123 --message "Report ready" --deliver

    # Distribuer sur Slack
    openclaw agent --agent ops --message "Generate report" \
      --deliver --reply-channel slack --reply-to "#reports"
    ```

  </Step>
</Steps>

## Options

| Option                      | Description                                                                 |
| --------------------------- | --------------------------------------------------------------------------- |
| `--message <text>`          | Message en ligne à envoyer                                                  |
| `--message-file <path>`     | Lire le message depuis un fichier UTF-8 valide                              |
| `--to <dest>`               | Dériver la clé de session d’une cible (téléphone, identifiant de discussion) |
| `--session-key <key>`       | Utiliser une clé de session explicite                                       |
| `--agent <id>`              | Cibler un agent configuré (utilise sa session `main`)                        |
| `--session-id <id>`         | Réutiliser une session existante par identifiant                            |
| `--model <id>`              | Remplacer le modèle pour cette exécution (`provider/model` ou identifiant de modèle) |
| `--local`                   | Forcer l’environnement d’exécution intégré local (ignorer le Gateway)       |
| `--deliver`                 | Envoyer la réponse à un canal de discussion                                 |
| `--channel <name>`          | Canal de distribution ; avec `--agent` + `--to`, s’applique aussi à la portée des messages privés |
| `--reply-to <target>`       | Remplacer la cible de distribution                                          |
| `--reply-channel <name>`    | Remplacer le canal de distribution                                          |
| `--reply-account <id>`      | Remplacer l’identifiant du compte de distribution                           |
| `--thinking <level>`        | Définir le niveau de réflexion pour le profil de modèle sélectionné         |
| `--verbose <on\|full\|off>` | Conserver le niveau de verbosité pour la session (`full` journalise également la sortie des outils) |
| `--timeout <seconds>`       | Remplacer le délai d’expiration de l’agent (600 par défaut, ou valeur de configuration) |
| `--json`                    | Produire une sortie JSON structurée                                         |

## Comportement

- Par défaut, la CLI passe **par le Gateway**. Ajoutez `--local` pour forcer
  l’environnement d’exécution intégré sur la machine actuelle.
- Transmettez exactement l’une des options `--message` ou `--message-file`. Les messages de fichier conservent
  le contenu multiligne après la suppression d’un éventuel BOM UTF-8.
- Si la requête au Gateway échoue, la CLI **se rabat** sur l’exécution intégrée
  locale ; en cas d’expiration du délai du Gateway, elle se rabat sur une nouvelle session au lieu de mettre en concurrence
  la transcription d’origine.
- Sélection de la session : `--to` dérive la clé de session (les cibles de
  groupe/canal conservent leur isolation ; les discussions directes sont regroupées dans `main`). Lorsque `--agent`,
  `--channel` et `--to` sont utilisés ensemble, le routage suit le destinataire canonique
  du canal et `session.dmScope`. Les identités stables utilisées uniquement pour les envois sortants emploient une
  session détenue par le fournisseur et isolée de la session principale de l’agent.
- `--session-key` sélectionne une clé explicite. Les clés préfixées par un agent doivent utiliser
  `agent:<agent-id>:<session-key>`, et `--agent` doit correspondre à cet identifiant d’agent lorsque
  les deux sont fournis. Les clés simples qui ne sont pas des sentinelles sont limitées à `--agent` lorsqu’il est
  fourni ; par exemple, `--agent ops --session-key incident-42` dirige vers
  `agent:ops:incident-42`. Sans `--agent`, les clés simples qui ne sont pas des sentinelles sont limitées
  à l’agent configuré par défaut. Les valeurs littérales `global` et `unknown` restent
  sans portée uniquement lorsqu’aucun `--agent` n’est fourni ; le chemin de repli intégré
  résout ces sessions sentinelles vers l’agent configuré par défaut.
- `--reply-channel` et `--reply-account` affectent uniquement la distribution.
- Les options de réflexion et de verbosité sont conservées dans le stockage de session.
- Sortie : texte brut par défaut, ou `--json` pour une charge utile structurée accompagnée de métadonnées.
- Avec `--json --deliver`, le JSON inclut l’état de distribution des envois
  effectués, supprimés, partiels et ayant échoué. Consultez
  [État de distribution JSON](/fr/cli/agent#json-delivery-status).

## Exemples

```bash
# Tour simple avec sortie JSON
openclaw agent --to +15555550123 --message "Trace logs" --verbose on --json

# Tour avec remplacement du modèle
openclaw agent --agent ops --model openai/gpt-5.4 --message "Summarize logs"

# Tour avec niveau de réflexion
openclaw agent --session-id 1234 --message "Summarize inbox" --thinking medium

# Invite multiligne depuis un fichier
openclaw agent --agent ops --message-file ./task.md

# Clé de session exacte
openclaw agent --session-key agent:ops:incident-42 --message "Summarize status"

# Ancienne clé limitée à un agent
openclaw agent --agent ops --session-key incident-42 --message "Summarize status"

# Distribuer sur un canal différent de celui de la session
openclaw agent --agent ops --message "Alert" --deliver --reply-channel telegram --reply-to "@admin"
```

## Rubriques connexes

<CardGroup cols={2}>
  <Card title="Référence de la CLI de l’agent" href="/fr/cli/agent" icon="terminal">
    Référence complète des options de `openclaw agent`.
  </Card>
  <Card title="Sous-agents" href="/fr/tools/subagents" icon="users">
    Lancement de sous-agents en arrière-plan.
  </Card>
  <Card title="Sessions" href="/fr/concepts/session" icon="comments">
    Fonctionnement des clés de session et manière dont `--to`, `--agent` et `--session-id` les résolvent.
  </Card>
  <Card title="Commandes à barre oblique" href="/fr/tools/slash-commands" icon="slash">
    Catalogue de commandes natives utilisé dans les sessions d’agent.
  </Card>
</CardGroup>
