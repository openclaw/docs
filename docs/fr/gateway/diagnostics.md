---
read_when:
    - Préparer un rapport de bug ou une demande de support
    - Déboguer les plantages du Gateway, les redémarrages, la pression mémoire ou les payloads surdimensionnés
    - Examiner quelles données de diagnostic sont enregistrées ou masquées
summary: Créer des bundles de diagnostic Gateway partageables pour les rapports de bug
title: Export de diagnostics
x-i18n:
    generated_at: "2026-04-26T11:28:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 64866d929ed42f8484aa7c153e3056bad7b594d9e02705c095b7005f3094ec36
    source_path: gateway/diagnostics.md
    workflow: 15
---

OpenClaw peut créer un zip de diagnostic local qui peut être joint en toute sécurité à des rapports de bug. Il combine un état Gateway assaini, la santé, les logs, la structure de la config et les événements récents de stabilité sans payload.

## Démarrage rapide

```bash
openclaw gateway diagnostics export
```

La commande affiche le chemin du zip écrit. Pour choisir un chemin :

```bash
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
```

Pour l’automatisation :

```bash
openclaw gateway diagnostics export --json
```

## Ce que contient l’export

Le zip inclut :

- `summary.md` : vue d’ensemble lisible par un humain pour le support.
- `diagnostics.json` : résumé lisible par machine de la config, des logs, de l’état, de la santé et des données de stabilité.
- `manifest.json` : métadonnées d’export et liste des fichiers.
- Structure de config assainie et détails de config non secrets.
- Résumés de logs assainis et lignes récentes de logs masquées.
- Instantanés d’état et de santé du Gateway au mieux.
- `stability/latest.json` : bundle de stabilité persisté le plus récent, lorsqu’il est disponible.

L’export est utile même lorsque le Gateway n’est pas en bonne santé. Si le Gateway ne peut pas répondre aux requêtes d’état ou de santé, les logs locaux, la structure de la config et le bundle de stabilité le plus récent sont quand même collectés lorsqu’ils sont disponibles.

## Modèle de confidentialité

Les diagnostics sont conçus pour être partageables. L’export conserve les données opérationnelles qui aident au débogage, telles que :

- noms de sous-systèmes, identifiants de Plugin, identifiants de fournisseur, identifiants de canal et modes configurés
- codes d’état, durées, nombres d’octets, état de file d’attente et mesures mémoire
- métadonnées de logs assainies et messages opérationnels masqués
- structure de la config et paramètres de fonctionnalités non secrets

L’export omet ou masque :

- texte des discussions, prompts, instructions, corps de Webhook et sorties d’outils
- identifiants, clés API, tokens, cookies et valeurs secrètes
- corps bruts de requête ou de réponse
- identifiants de compte, identifiants de message, identifiants de session bruts, noms d’hôte et noms d’utilisateur locaux

Lorsqu’un message de log ressemble à du texte de payload utilisateur, de discussion, de prompt ou d’outil, l’export conserve uniquement le fait qu’un message a été omis et le nombre d’octets.

## Enregistreur de stabilité

Le Gateway enregistre par défaut un flux de stabilité borné et sans payload lorsque les diagnostics sont activés. Il concerne les faits opérationnels, pas le contenu.

Inspectez l’enregistreur en direct :

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --json
```

Inspectez le bundle de stabilité persisté le plus récent après une sortie fatale, un délai d’arrêt dépassé ou un échec de démarrage après redémarrage :

```bash
openclaw gateway stability --bundle latest
```

Créez un zip de diagnostic à partir du bundle persisté le plus récent :

```bash
openclaw gateway stability --bundle latest --export
```

Les bundles persistés se trouvent sous `~/.openclaw/logs/stability/` lorsque des événements existent.

## Options utiles

```bash
openclaw gateway diagnostics export \
  --output openclaw-diagnostics.zip \
  --log-lines 5000 \
  --log-bytes 1000000
```

- `--output <path>` : écrire vers un chemin zip spécifique.
- `--log-lines <count>` : nombre maximal de lignes de logs assainies à inclure.
- `--log-bytes <bytes>` : nombre maximal d’octets de logs à inspecter.
- `--url <url>` : URL WebSocket du Gateway pour les instantanés d’état et de santé.
- `--token <token>` : token du Gateway pour les instantanés d’état et de santé.
- `--password <password>` : mot de passe du Gateway pour les instantanés d’état et de santé.
- `--timeout <ms>` : délai d’expiration des instantanés d’état et de santé.
- `--no-stability-bundle` : ignorer la recherche du bundle de stabilité persisté.
- `--json` : afficher les métadonnées d’export lisibles par machine.

## Désactiver les diagnostics

Les diagnostics sont activés par défaut. Pour désactiver l’enregistreur de stabilité et la collecte d’événements de diagnostic :

```json5
{
  diagnostics: {
    enabled: false,
  },
}
```

La désactivation des diagnostics réduit le niveau de détail des rapports de bug. Elle n’affecte pas la journalisation normale du Gateway.

## Lié

- [Vérifications de santé](/fr/gateway/health)
- [CLI Gateway](/fr/cli/gateway#gateway-diagnostics-export)
- [Protocole Gateway](/fr/gateway/protocol#system-and-identity)
- [Journalisation](/fr/logging)
- [Export OpenTelemetry](/fr/gateway/opentelemetry) — flux séparé pour diffuser les diagnostics vers un collecteur
