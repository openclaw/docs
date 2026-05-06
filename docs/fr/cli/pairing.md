---
read_when:
    - Vous utilisez des messages privés en mode d’appairage et devez approuver les expéditeurs
summary: Référence CLI pour `openclaw pairing` (approuver/lister les demandes d’appairage)
title: Appairage
x-i18n:
    generated_at: "2026-05-06T17:54:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: 022018239ab1134b18986be42b8e019f412a1a730a9671f422979909c4a31dc5
    source_path: cli/pairing.md
    workflow: 16
---

# `openclaw pairing`

Approuver ou inspecter les demandes d’association par message privé (pour les canaux qui prennent en charge l’association).

Connexe :

- Flux d’association : [Association](/fr/channels/pairing)

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

Lister les demandes d’association en attente pour un canal.

Options :

- `[channel]` : identifiant de canal positionnel
- `--channel <channel>` : identifiant de canal explicite
- `--account <accountId>` : identifiant de compte pour les canaux à plusieurs comptes
- `--json` : sortie lisible par machine

Notes :

- Si plusieurs canaux compatibles avec l’association sont configurés, vous devez fournir un canal, soit de manière positionnelle, soit avec `--channel`.
- Les canaux d’extension sont autorisés tant que l’identifiant de canal est valide.

## `pairing approve`

Approuver un code d’association en attente et autoriser cet expéditeur.

Utilisation :

- `openclaw pairing approve <channel> <code>`
- `openclaw pairing approve --channel <channel> <code>`
- `openclaw pairing approve <code>` lorsqu’exactement un canal compatible avec l’association est configuré

Options :

- `--channel <channel>` : identifiant de canal explicite
- `--account <accountId>` : identifiant de compte pour les canaux à plusieurs comptes
- `--notify` : envoyer une confirmation au demandeur sur le même canal

Amorçage du propriétaire :

- Si `commands.ownerAllowFrom` est vide lorsque vous approuvez un code d’association, OpenClaw enregistre aussi l’expéditeur approuvé comme propriétaire des commandes, au moyen d’une entrée limitée au canal telle que `telegram:123456789`.
- Cela n’amorce que le premier propriétaire. Les approbations d’association ultérieures ne remplacent ni n’étendent `commands.ownerAllowFrom`.
- Le propriétaire des commandes est le compte de l’opérateur humain autorisé à exécuter les commandes réservées au propriétaire et à approuver les actions dangereuses telles que `/diagnostics`, `/export-trajectory`, `/config` et les approbations d’exécution.

## Notes

- Entrée de canal : transmettez-la de manière positionnelle (`pairing list telegram`) ou avec `--channel <channel>`.
- `pairing list` prend en charge `--account <accountId>` pour les canaux à plusieurs comptes.
- `pairing approve` prend en charge `--account <accountId>` et `--notify`.
- Si un seul canal compatible avec l’association est configuré, `pairing approve <code>` est autorisé.
- Si vous avez approuvé un expéditeur avant l’existence de cet amorçage, exécutez `openclaw doctor` ; il avertit lorsqu’aucun propriétaire des commandes n’est configuré et affiche la commande `openclaw config set commands.ownerAllowFrom ...` pour corriger le problème.

## Connexe

- [Référence CLI](/fr/cli)
- [Association de canal](/fr/channels/pairing)
