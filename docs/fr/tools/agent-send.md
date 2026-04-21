---
read_when:
    - Vous souhaitez déclencher des exécutions d’agent depuis des scripts ou la ligne de commande
    - Vous devez remettre les réponses d’agent à un canal de discussion de manière programmatique
summary: Exécutez des tours d’agent depuis la CLI et, éventuellement, remettez les réponses aux canaux
title: Envoi d’agent
x-i18n:
    generated_at: "2026-04-21T13:36:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0550ad38efb2711f267a62b905fd150987a98801247de780ed3df97f27245704
    source_path: tools/agent-send.md
    workflow: 15
---

# Envoi d’agent

`openclaw agent` exécute un seul tour d’agent depuis la ligne de commande sans nécessiter
de message de discussion entrant. Utilisez-le pour les workflows scriptés, les tests et la
remise programmatique.

## Démarrage rapide

<Steps>
  <Step title="Exécuter un tour d’agent simple">
    ```bash
    openclaw agent --message "Quel temps fait-il aujourd’hui ?"
    ```

    Cette commande envoie le message via Gateway et affiche la réponse.

  </Step>

  <Step title="Cibler un agent ou une session spécifique">
    ```bash
    # Cibler un agent spécifique
    openclaw agent --agent ops --message "Résume les journaux"

    # Cibler un numéro de téléphone (dérive une clé de session)
    openclaw agent --to +15555550123 --message "Mise à jour du statut"

    # Réutiliser une session existante
    openclaw agent --session-id abc123 --message "Continuer la tâche"
    ```

  </Step>

  <Step title="Remettre la réponse à un canal">
    ```bash
    # Remettre sur WhatsApp (canal par défaut)
    openclaw agent --to +15555550123 --message "Rapport prêt" --deliver

    # Remettre sur Slack
    openclaw agent --agent ops --message "Générer un rapport" \
      --deliver --reply-channel slack --reply-to "#reports"
    ```

  </Step>
</Steps>

## Indicateurs

| Flag                          | Description                                                  |
| ----------------------------- | ------------------------------------------------------------ |
| `--message \<text\>`          | Message à envoyer (requis)                                   |
| `--to \<dest\>`               | Dériver une clé de session à partir d’une cible (téléphone, id de discussion) |
| `--agent \<id\>`              | Cibler un agent configuré (utilise sa session `main`)        |
| `--session-id \<id\>`         | Réutiliser une session existante par id                      |
| `--local`                     | Forcer le runtime embarqué local (ignorer Gateway)           |
| `--deliver`                   | Envoyer la réponse à un canal de discussion                  |
| `--channel \<name\>`          | Canal de remise (whatsapp, telegram, discord, slack, etc.)   |
| `--reply-to \<target\>`       | Surcharge de la cible de remise                              |
| `--reply-channel \<name\>`    | Surcharge du canal de remise                                 |
| `--reply-account \<id\>`      | Surcharge de l’id de compte de remise                        |
| `--thinking \<level\>`        | Définir le niveau de réflexion pour le profil de modèle sélectionné |
| `--verbose \<on\|full\|off\>` | Définir le niveau de verbosité                               |
| `--timeout \<seconds\>`       | Surcharger le délai d’expiration de l’agent                  |
| `--json`                      | Produire une sortie JSON structurée                          |

## Comportement

- Par défaut, la CLI passe **par Gateway**. Ajoutez `--local` pour forcer le
  runtime embarqué sur la machine actuelle.
- Si Gateway est inaccessible, la CLI **retombe** sur l’exécution embarquée locale.
- Sélection de session : `--to` dérive la clé de session (les cibles de
  groupe/canal préservent l’isolation ; les discussions directes sont ramenées à `main`).
- Les indicateurs thinking et verbose persistent dans le stockage de session.
- Sortie : texte brut par défaut, ou `--json` pour une charge utile structurée + métadonnées.

## Exemples

```bash
# Tour simple avec sortie JSON
openclaw agent --to +15555550123 --message "Tracer les journaux" --verbose on --json

# Tour avec niveau de réflexion
openclaw agent --session-id 1234 --message "Résume la boîte de réception" --thinking medium

# Remettre vers un canal différent de la session
openclaw agent --agent ops --message "Alerte" --deliver --reply-channel telegram --reply-to "@admin"
```

## Voir aussi

- [Référence CLI agent](/cli/agent)
- [Sous-agents](/fr/tools/subagents) — génération de sous-agents en arrière-plan
- [Sessions](/fr/concepts/session) — fonctionnement des clés de session
