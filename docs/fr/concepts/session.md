---
read_when:
    - Vous souhaitez comprendre le routage et l’isolation des sessions
    - Vous souhaitez configurer la portée des messages privés pour les configurations multi-utilisateurs
summary: Comment OpenClaw gère les sessions de conversation
title: Gestion des sessions
x-i18n:
    generated_at: "2026-04-23T07:03:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: d099ef7f3b484cf0fa45ddbf5648a7497d6509209e4de08c8484102eca073a2b
    source_path: concepts/session.md
    workflow: 15
---

# Gestion des sessions

OpenClaw organise les conversations en **sessions**. Chaque message est routé vers une
session selon sa provenance — messages privés, discussions de groupe, tâches Cron, etc.

## Comment les messages sont routés

| Source          | Comportement                    |
| --------------- | ------------------------------- |
| Messages privés | Session partagée par défaut     |
| Discussions de groupe | Isolées par groupe        |
| Salles/canaux   | Isolés par salle                |
| Tâches Cron     | Nouvelle session à chaque exécution |
| Webhook         | Isolés par hook                 |

## Isolation des messages privés

Par défaut, tous les messages privés partagent une seule session pour assurer la continuité. Cela convient
aux configurations mono-utilisateur.

<Warning>
Si plusieurs personnes peuvent envoyer des messages à votre agent, activez l’isolation des messages privés. Sinon, tous les
utilisateurs partagent le même contexte de conversation — les messages privés d’Alice seraient
visibles par Bob.
</Warning>

**La solution :**

```json5
{
  session: {
    dmScope: "per-channel-peer", // isole par canal + expéditeur
  },
}
```

Autres options :

- `main` (par défaut) — tous les messages privés partagent une seule session.
- `per-peer` — isole par expéditeur (tous canaux confondus).
- `per-channel-peer` — isole par canal + expéditeur (recommandé).
- `per-account-channel-peer` — isole par compte + canal + expéditeur.

<Tip>
Si une même personne vous contacte depuis plusieurs canaux, utilisez
`session.identityLinks` pour lier ses identités afin qu’elles partagent une seule session.
</Tip>

Vérifiez votre configuration avec `openclaw security audit`.

## Cycle de vie des sessions

Les sessions sont réutilisées jusqu’à leur expiration :

- **Réinitialisation quotidienne** (par défaut) — nouvelle session à 4 h 00, heure locale, sur l’hôte du Gateway.
- **Réinitialisation après inactivité** (facultative) — nouvelle session après une période d’inactivité. Définissez
  `session.reset.idleMinutes`.
- **Réinitialisation manuelle** — saisissez `/new` ou `/reset` dans le chat. `/new <model>` change également de modèle.

Lorsque des réinitialisations quotidiennes et après inactivité sont toutes deux configurées, la première à expirer l’emporte.

Les sessions avec une session CLI active appartenant au fournisseur ne sont pas coupées par la
valeur quotidienne implicite par défaut. Utilisez `/reset` ou configurez `session.reset` explicitement lorsque ces
sessions doivent expirer selon un temporisateur.

## Où se trouve l’état

Tout l’état de session appartient au **Gateway**. Les clients UI interrogent le Gateway pour
obtenir les données de session.

- **Stockage :** `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- **Transcriptions :** `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`

## Maintenance des sessions

OpenClaw limite automatiquement le stockage des sessions au fil du temps. Par défaut, il fonctionne
en mode `warn` (signale ce qui serait nettoyé). Définissez `session.maintenance.mode`
sur `"enforce"` pour un nettoyage automatique :

```json5
{
  session: {
    maintenance: {
      mode: "enforce",
      pruneAfter: "30d",
      maxEntries: 500,
    },
  },
}
```

Prévisualisez avec `openclaw sessions cleanup --dry-run`.

## Inspection des sessions

- `openclaw status` — chemin du stockage des sessions et activité récente.
- `openclaw sessions --json` — toutes les sessions (filtrez avec `--active <minutes>`).
- `/status` dans le chat — utilisation du contexte, modèle et bascules.
- `/context list` — ce qui se trouve dans le prompt système.

## Pour aller plus loin

- [Session Pruning](/fr/concepts/session-pruning) — réduction des résultats d’outil
- [Compaction](/fr/concepts/compaction) — synthèse des longues conversations
- [Session Tools](/fr/concepts/session-tool) — outils d’agent pour le travail inter-sessions
- [Session Management Deep Dive](/fr/reference/session-management-compaction) —
  schéma de stockage, transcriptions, politique d’envoi, métadonnées d’origine et configuration avancée
- [Multi-Agent](/fr/concepts/multi-agent) — routage et isolation des sessions entre agents
- [Background Tasks](/fr/automation/tasks) — comment le travail détaché crée des enregistrements de tâche avec des références de session
- [Channel Routing](/fr/channels/channel-routing) — comment les messages entrants sont routés vers les sessions
