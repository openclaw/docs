---
read_when:
    - Vous souhaitez déclencher des exécutions d’agent depuis des scripts ou la ligne de commande
    - Vous devez transmettre par programmation les réponses de l’agent à un canal de discussion
summary: Exécutez des tours d’agent depuis la CLI et envoyez éventuellement les réponses aux canaux
title: Envoi de l’agent
x-i18n:
    generated_at: "2026-07-12T16:00:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 23ad57735bd43a2bba5add571e9572da0fbe7b516a70515c674e1ababaab081a
    source_path: tools/agent-send.md
    workflow: 16
---

`openclaw agent` exécute un seul tour d’agent depuis la ligne de commande sans
message de discussion entrant. Utilisez-le pour les workflows scriptés, les tests et
la distribution programmatique. Référence complète des options et du comportement :
[Référence de la CLI de l’agent](/fr/cli/agent).

## Démarrage rapide

<Steps>
  <Step title="Exécuter un tour d’agent simple">
    ```bash
    openclaw agent --agent main --message "Quel temps fait-il aujourd’hui ?"
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
    openclaw agent --agent ops --message "Résumer les journaux"

    # Cibler un numéro de téléphone (dérive la clé de session)
    openclaw agent --to +15555550123 --message "Mise à jour de l’état"

    # Réutiliser une session existante
    openclaw agent --session-id abc123 --message "Continuer la tâche"

    # Cibler une clé de session exacte
    openclaw agent --session-key agent:ops:incident-42 --message "Résumer l’état"
    ```

  </Step>

  <Step title="Distribuer la réponse à un canal">
    ```bash
    # Distribuer à WhatsApp (canal par défaut)
    openclaw agent --to +15555550123 --message "Rapport prêt" --deliver

    # Distribuer à Slack
    openclaw agent --agent ops --message "Générer le rapport" \
      --deliver --reply-channel slack --reply-to "#reports"
    ```

  </Step>
</Steps>

## Options

| Option                      | Description                                                                     |
| --------------------------- | ------------------------------------------------------------------------------- |
| `--message <text>`          | Message en ligne à envoyer                                                      |
| `--message-file <path>`     | Lire le message depuis un fichier UTF-8 valide                                  |
| `--to <dest>`               | Dériver la clé de session d’une cible (téléphone, identifiant de discussion)    |
| `--session-key <key>`       | Utiliser une clé de session explicite                                           |
| `--agent <id>`              | Cibler un agent configuré (utilise sa session `main`)                           |
| `--session-id <id>`         | Réutiliser une session existante par identifiant                                |
| `--model <id>`              | Remplacer le modèle pour cette exécution (`provider/model` ou identifiant de modèle) |
| `--local`                   | Forcer le runtime intégré local (ignorer le Gateway)                            |
| `--deliver`                 | Envoyer la réponse à un canal de discussion                                     |
| `--channel <name>`          | Canal de distribution ; avec `--agent` + `--to`, s’applique aussi à la portée des messages privés |
| `--reply-to <target>`       | Remplacer la cible de distribution                                              |
| `--reply-channel <name>`    | Remplacer le canal de distribution                                              |
| `--reply-account <id>`      | Remplacer l’identifiant du compte de distribution                               |
| `--thinking <level>`        | Définir le niveau de réflexion pour le profil de modèle sélectionné             |
| `--verbose <on\|full\|off>` | Conserver le niveau de verbosité pour la session (`full` journalise aussi la sortie des outils) |
| `--timeout <seconds>`       | Remplacer le délai d’expiration de l’agent (600 par défaut, ou valeur de configuration) |
| `--json`                    | Produire une sortie JSON structurée                                             |

## Comportement

- Par défaut, la CLI passe **par le Gateway**. Ajoutez `--local` pour forcer le
  runtime intégré sur la machine actuelle.
- Transmettez exactement l’une des options `--message` ou `--message-file`. Les messages de fichier conservent
  le contenu multiligne après suppression d’un éventuel BOM UTF-8.
- Si la requête au Gateway échoue, la CLI **se replie** sur l’exécution intégrée
  locale ; un délai d’expiration du Gateway entraîne un repli avec une nouvelle session au lieu de mettre en concurrence la
  transcription d’origine.
- Sélection de la session : `--to` dérive la clé de session (les cibles de groupe/canal
  conservent leur isolation ; les discussions directes sont regroupées dans `main`). Lorsque `--agent`,
  `--channel` et `--to` sont utilisés ensemble, le routage suit le destinataire canonique
  du canal et `session.dmScope`. Les identités stables utilisées uniquement pour les envois sortants emploient une
  session appartenant au fournisseur, isolée de la session principale de l’agent.
- `--session-key` sélectionne une clé explicite. Les clés préfixées par un agent doivent utiliser
  `agent:<agent-id>:<session-key>`, et `--agent` doit correspondre à cet identifiant d’agent lorsque
  les deux sont fournis. Les clés simples qui ne sont pas des sentinelles sont limitées à `--agent` lorsqu’il est
  fourni ; par exemple, `--agent ops --session-key incident-42` est routé vers
  `agent:ops:incident-42`. Sans `--agent`, les clés simples qui ne sont pas des sentinelles sont limitées
  à l’agent configuré par défaut. Les valeurs littérales `global` et `unknown` restent
  sans portée uniquement lorsqu’aucun `--agent` n’est fourni ; le chemin de repli intégré
  résout ces sessions sentinelles vers l’agent configuré par défaut.
- `--reply-channel` et `--reply-account` affectent uniquement la distribution.
- Les options de réflexion et de verbosité sont conservées dans le stockage de la session.
- Sortie : texte brut par défaut, ou `--json` pour une charge utile structurée accompagnée de métadonnées.
- Avec `--json --deliver`, le JSON inclut l’état de distribution pour les envois
  effectués, supprimés, partiels et échoués. Consultez
  [État de distribution JSON](/fr/cli/agent#json-delivery-status).

## Exemples

```bash
# Tour simple avec une sortie JSON
openclaw agent --to +15555550123 --message "Tracer les journaux" --verbose on --json

# Tour avec remplacement du modèle
openclaw agent --agent ops --model openai/gpt-5.4 --message "Résumer les journaux"

# Tour avec un niveau de réflexion
openclaw agent --session-id 1234 --message "Résumer la boîte de réception" --thinking medium

# Invite multiligne depuis un fichier
openclaw agent --agent ops --message-file ./task.md

# Clé de session exacte
openclaw agent --session-key agent:ops:incident-42 --message "Résumer l’état"

# Ancienne clé limitée à un agent
openclaw agent --agent ops --session-key incident-42 --message "Résumer l’état"

# Distribuer à un canal différent de celui de la session
openclaw agent --agent ops --message "Alerte" --deliver --reply-channel telegram --reply-to "@admin"
```

## Pages connexes

<CardGroup cols={2}>
  <Card title="Référence de la CLI de l’agent" href="/fr/cli/agent" icon="terminal">
    Référence complète des options de `openclaw agent`.
  </Card>
  <Card title="Sous-agents" href="/fr/tools/subagents" icon="users">
    Lancement de sous-agents en arrière-plan.
  </Card>
  <Card title="Sessions" href="/fr/concepts/session" icon="comments">
    Fonctionnement des clés de session et résolution par `--to`, `--agent` et `--session-id`.
  </Card>
  <Card title="Commandes slash" href="/fr/tools/slash-commands" icon="slash">
    Catalogue de commandes natives utilisé dans les sessions d’agent.
  </Card>
</CardGroup>
