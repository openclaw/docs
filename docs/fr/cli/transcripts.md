---
read_when:
    - Vous souhaitez lire les résumés de transcriptions stockés depuis le terminal
    - Vous devez indiquer le chemin d’accès à un résumé Markdown des transcriptions.
    - Vous déboguez la structure de stockage des transcriptions du cœur.
summary: Référence de la CLI pour `openclaw transcripts` (répertorier, afficher et localiser les transcriptions stockées)
title: CLI des transcriptions
x-i18n:
    generated_at: "2026-07-12T15:17:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: dde02e924339c64cf6acd5c4b6162785dcfccf4a1df2aac0d9d52d5306511579
    source_path: cli/transcripts.md
    workflow: 16
---

# `openclaw transcripts`

Inspecteur en lecture seule des transcriptions écrites par l’outil d’agent `transcripts`.
La capture, l’importation et la synthèse s’effectuent au moyen de cet outil, et non de cette CLI.

Les artefacts se trouvent dans le répertoire d’état :

```text
$OPENCLAW_STATE_DIR/transcripts/YYYY-MM-DD/<session>/
  metadata.json
  transcript.jsonl
  summary.json
  summary.md
```

Le répertoire d’état par défaut est `~/.openclaw` ; remplacez-le avec `OPENCLAW_STATE_DIR`.
Le répertoire de date provient de l’heure de début de la session ; le répertoire de session est
un slug compatible avec le système de fichiers dérivé de l’identifiant de session.

## Commandes

```bash
openclaw transcripts list
openclaw transcripts show <session>
openclaw transcripts show YYYY-MM-DD/<session>
openclaw transcripts path <session>
openclaw transcripts path YYYY-MM-DD/<session>
openclaw transcripts path <session> --dir
openclaw transcripts path <session> --metadata
openclaw transcripts path <session> --transcript
openclaw transcripts list --json
openclaw transcripts show <session> --json
openclaw transcripts path <session> --json
```

| Commande                      | Description                                                     |
| ----------------------------- | --------------------------------------------------------------- |
| `list`                        | Répertorie les sessions stockées.                               |
| `show <session>`              | Affiche le fichier `summary.md` stocké.                          |
| `path <session>`              | Affiche le chemin de `summary.md`.                               |
| `path <session> --dir`        | Affiche le répertoire de la session.                             |
| `path <session> --metadata`   | Affiche `metadata.json`.                                        |
| `path <session> --transcript` | Affiche `transcript.jsonl`.                                      |
| `--json`                      | Affiche une sortie lisible par machine (toute sous-commande).    |

`<session>` accepte soit un identifiant de session seul, soit un sélecteur
qualifié par une date (`YYYY-MM-DD/<session>`). Utilisez la forme qualifiée lorsque le même
identifiant de session apparaît sur plusieurs jours, par exemple `openclaw transcripts show
2026-05-22/standup`. Les identifiants de session par défaut comprennent un horodatage et un
suffixe aléatoire ; n’attribuez un identifiant fixe à une session que s’il est unique pour la journée.

## Sortie

`list` affiche une ligne séparée par des tabulations pour chaque session : sélecteur, heure de début, titre,
chemin du résumé.

```text
2026-05-22/standup  2026-05-22T09:00:00.000Z  Réunion hebdomadaire  /Users/user/.openclaw/transcripts/2026-05-22/standup/summary.md
```

Le sélecteur est la valeur la plus sûre à transmettre de nouveau à `show` ou `path`.

`list --json` renvoie des objets contenant `sessionId`, `selector`, `date`, `title`,
`startedAt`, `stoppedAt`, `source`, `path`, `summaryPath`, `hasSummary`.

`show --json` renvoie les métadonnées stockées de la session, le sélecteur, le répertoire de
session, le chemin du résumé et le texte Markdown du résumé.

`path --json` renvoie le chemin sélectionné et indique si ce fichier existe.

## Plusieurs sessions par jour

Les sessions sont regroupées par date, puis par identifiant de session. Dix réunions le même jour deviennent
dix dossiers frères :

```text
~/.openclaw/transcripts/2026-05-22/
  transcript-2026-05-22T09-00-00-000Z-a1b2c3d4/
  transcript-2026-05-22T10-30-00-000Z-b2c3d4e5/
  standup/
```

Utilisez les identifiants générés par défaut pour l’automatisation. Utilisez un identifiant fixe comme `standup` uniquement
s’il ne se répète pas à la même date.

## Résumés manquants

Les sessions en direct écrivent `summary.md` lorsque la session s’arrête ; les transcriptions importées
l’écrivent immédiatement après l’importation. Une session peut apparaître dans `list` sans
résumé tant que la capture est encore active, si un fournisseur a échoué pendant l’arrêt ou si
les métadonnées ont été écrites avant l’arrivée de toute intervention.

Utilisez `path <session> --transcript` pour inspecter la transcription brute en ajout seul,
ou exécutez l’action `summarize` de l’outil `transcripts` pour régénérer le résumé
Markdown.

## Configuration

La capture est facultative (les sources en direct peuvent rejoindre et enregistrer le son des réunions). Activez-la
avec :

```json
{
  "transcripts": {
    "enabled": true,
    "maxUtterances": 2000
  }
}
```

- `enabled` (valeur par défaut : `false`) : active l’outil.
- `maxUtterances` (valeur par défaut : `2000`, limitée à 1-10000) : taille du tampon d’interventions par
  session.

Configurez les sources à démarrage automatique avec `transcripts.autoStart`. Chaque entrée est
activée par sa présence ; omettez une entrée pour désactiver cette source. `discord-voice`
est la source intégrée compatible avec le démarrage automatique et nécessite `guildId` et
`channelId` :

```json
{
  "transcripts": {
    "enabled": true,
    "autoStart": [
      {
        "providerId": "discord-voice",
        "guildId": "1234567890",
        "channelId": "2345678901"
      }
    ]
  }
}
```
