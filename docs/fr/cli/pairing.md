---
read_when:
    - Vous utilisez des messages privés en mode d’association et devez approuver les expéditeurs
summary: Référence de la CLI pour `openclaw pairing` (approuver/répertorier les demandes d’appairage)
title: Appairage
x-i18n:
    generated_at: "2026-07-16T13:06:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 740459efe4d0fa2e9fa04a20b944592fed3dc9a22211658e1418c1e49a736997
    source_path: cli/pairing.md
    workflow: 16
---

# `openclaw pairing`

Approuvez ou examinez les demandes d’association par message privé pour les canaux prenant en charge l’association (messages privés de discussion uniquement — l’association de nœuds/appareils utilise `openclaw devices`).

Voir aussi : [Processus d’association](/fr/channels/pairing)

## Commandes

```bash
openclaw pairing list telegram
openclaw pairing list --channel telegram --account work
openclaw pairing list telegram --json

openclaw pairing approve <code>
openclaw pairing approve telegram <code>
openclaw pairing approve --channel telegram --account work <code> --notify
```

## `pairing list`

Répertoriez les demandes d’association en attente pour un canal.

| Option                  | Description                           |
| ----------------------- | ------------------------------------- |
| `[channel]`             | identifiant de canal positionnel                 |
| `--channel <channel>`   | identifiant de canal explicite                   |
| `--account <accountId>` | identifiant de compte pour les canaux multicomptes |
| `--json`                | sortie lisible par une machine               |

Si plusieurs canaux prenant en charge l’association sont configurés, indiquez un canal de manière positionnelle ou avec `--channel`. Les canaux d’extension fonctionnent tant que l’identifiant du canal est valide.

## `pairing approve`

Approuvez un code d’association en attente et autorisez cet expéditeur.

Utilisation :

- `openclaw pairing approve <channel> <code>`
- `openclaw pairing approve --channel <channel> <code>`
- `openclaw pairing approve <code>` lorsqu’un seul canal prenant en charge l’association est configuré

Options : `--channel <channel>`, `--account <accountId>`, `--notify` (envoyer une confirmation au demandeur sur le même canal).

### Initialisation du propriétaire

Si `commands.ownerAllowFrom` est vide lorsque vous approuvez un code d’association, OpenClaw enregistre également l’expéditeur approuvé comme propriétaire des commandes, au moyen d’une entrée propre au canal telle que `telegram:123456789`. Cela initialise uniquement le premier propriétaire — les approbations d’association ultérieures ne remplacent ni n’étendent jamais `commands.ownerAllowFrom`.

Le propriétaire des commandes est le compte de l’opérateur humain autorisé à exécuter les commandes réservées au propriétaire et à approuver les actions dangereuses telles que `/diagnostics`, `/export-session`, `/export-trajectory`, `/config` et les approbations d’exécution. L’association permet uniquement à un expéditeur de communiquer avec l’agent ; elle ne lui accorde pas à elle seule de privilèges de propriétaire au-delà de cette initialisation unique.

Si vous avez approuvé un expéditeur avant l’existence de cette initialisation, exécutez `openclaw doctor` ; cette commande affiche un avertissement lorsqu’aucun propriétaire des commandes n’est configuré et indique la commande `openclaw config set commands.ownerAllowFrom ...` exacte permettant de corriger le problème.

## Voir aussi

- [Référence de la CLI](/fr/cli)
- [Association de canaux](/fr/channels/pairing)
