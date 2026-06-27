---
read_when:
    - Vous voulez lire les résumés de transcription stockés depuis le terminal
    - Vous avez besoin du chemin vers un résumé Markdown des transcriptions
    - Vous déboguez la disposition du stockage des transcriptions principales
summary: Référence CLI pour `openclaw transcripts` (lister, afficher et localiser les transcriptions stockées)
title: CLI des transcriptions
x-i18n:
    generated_at: "2026-06-27T17:21:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ae6010cfb4e051182f1c48d0d728b30d054542e1e7983ff15a2432840193f9c0
    source_path: cli/transcripts.md
    workflow: 16
---

# `openclaw transcripts`

Inspecter les transcriptions écrites par l’outil principal `transcripts` d’OpenClaw. Cette CLI est
en lecture seule ; la capture, l’importation et la synthèse appartiennent à l’outil d’agent et
aux sources de démarrage automatique configurées.

Utilisez la CLI lorsque vous voulez retrouver les notes d’hier, ouvrir le fichier Markdown dans
un éditeur, fournir une transcription à un autre outil ou déboguer l’emplacement où une session a été enregistrée sur
le disque. Elle ne démarre ni n’arrête la capture.

Les artefacts se trouvent sous le répertoire d’état d’OpenClaw :

```text
$OPENCLAW_STATE_DIR/transcripts/YYYY-MM-DD/<session>/
  metadata.json
  transcript.jsonl
  summary.json
  summary.md
```

Le répertoire d’état par défaut est `~/.openclaw` ; définissez `OPENCLAW_STATE_DIR` pour en utiliser un
autre. Le répertoire de date provient de l’heure de début de la session, et le
répertoire de session est un segment de système de fichiers sûr dérivé de l’id de session.

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

- `list` : lister les sessions stockées, le sélecteur qualifié par date, l’heure de début, le titre et le chemin de `summary.md`.
- `show <session>` : afficher le fichier `summary.md` stocké.
- `path <session>` : afficher le chemin de `summary.md`.
- `path <session> --dir` : afficher le répertoire de session.
- `path <session> --metadata` : afficher `metadata.json`.
- `path <session> --transcript` : afficher `transcript.jsonl`.
- `--json` : afficher une sortie lisible par machine.

Lorsqu’un id de session lisible par un humain se répète sur plusieurs jours, utilisez le sélecteur qualifié par date
fourni par `list`, par exemple `openclaw transcripts show 2026-05-22/standup`.
Les ids de session par défaut incluent un horodatage et un suffixe aléatoire ; configurez des
ids de session fixes uniquement lorsqu’ils sont uniques au sein de la journée.

## Sortie

`list` affiche une session par ligne :

```text
2026-05-22/standup  2026-05-22T09:00:00.000Z  Weekly standup  /Users/alex/.openclaw/transcripts/2026-05-22/standup/summary.md
```

La sortie est séparée par des tabulations. Les colonnes sont le sélecteur, l’heure de début, le titre et le
chemin du résumé. Le sélecteur est la valeur la plus sûre à repasser à `show` ou `path`.

`list --json` affiche des objets avec :

- `sessionId`
- `selector`
- `date`
- `title`
- `startedAt`
- `stoppedAt`
- `source`
- `path`
- `summaryPath`
- `hasSummary`

`show --json` renvoie les métadonnées de session stockées, le sélecteur, le répertoire de session,
le chemin du résumé et le texte Markdown du résumé. `path --json` renvoie le chemin sélectionné
et indique si ce fichier existe.

## Nombreuses réunions par jour

Transcripts regroupe les sessions par date, puis par id de session. Dix réunions en une
journée deviennent dix dossiers frères :

```text
~/.openclaw/transcripts/2026-05-22/
  transcript-2026-05-22T09-00-00-000Z-a1b2c3d4/
  transcript-2026-05-22T10-30-00-000Z-b2c3d4e5/
  standup/
```

Utilisez les ids générés par défaut pour la plupart des automatisations. Utilisez un id fixe tel que `standup`
uniquement lorsque le même id ne sera pas utilisé deux fois à la même date.

## Résumés manquants

Les sessions en direct écrivent `summary.md` lorsque la session s’arrête. Les transcriptions importées
écrivent `summary.md` immédiatement après l’importation. Une session peut encore apparaître dans
`list` sans résumé lorsque la capture est active, qu’un fournisseur a échoué pendant l’arrêt,
ou que les métadonnées ont été écrites avant l’arrivée de toute prise de parole.

Utilisez `path <session> --transcript` pour inspecter la transcription en ajout uniquement, et utilisez
l’action `summarize` de l’outil `transcripts` pour régénérer le résumé Markdown.

## Configuration

La capture de transcription est facultative, car les sources en direct peuvent rejoindre et enregistrer l’audio
d’une réunion. Activez l’outil avec `transcripts.enabled` au niveau supérieur :

```json
{
  "transcripts": {
    "enabled": true,
    "maxUtterances": 2000
  }
}
```

Configurez les sources de démarrage automatique avec `transcripts.autoStart` dans `openclaw.json`.
Chaque entrée est activée par sa présence ; omettez une entrée pour désactiver cette source.

```json
{
  "transcripts": {
    "enabled": true,
    "autoStart": [
      {
        "providerId": "discord-voice",
        "guildId": "1234567890",
        "channelId": "2345678901"
      },
      {
        "providerId": "slack-huddle",
        "accountId": "workspace",
        "channelId": "C123"
      }
    ]
  }
}
```
