---
read_when:
    - Vous utilisez des messages privés en mode d’appairage et devez approuver les expéditeurs
summary: Référence de la CLI pour `openclaw pairing` (approuver/lister les demandes d’appairage)
title: Appairage
x-i18n:
    generated_at: "2026-04-30T07:19:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: bffc70a8c08e298f42c8fbc2238fce06993572e72f333e87ad18dea3cf33fab5
    source_path: cli/pairing.md
    workflow: 16
---

# `openclaw pairing`

Approuver ou inspecter les demandes d’appairage par message direct (pour les canaux qui prennent en charge l’appairage).

Connexe :

- Flux d’appairage : [Appairage](/fr/channels/pairing)

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

Lister les demandes d’appairage en attente pour un canal.

Options :

- `[channel]` : identifiant de canal positionnel
- `--channel <channel>` : identifiant de canal explicite
- `--account <accountId>` : identifiant de compte pour les canaux multicomptes
- `--json` : sortie lisible par machine

Notes :

- Si plusieurs canaux compatibles avec l’appairage sont configurés, vous devez fournir un canal soit positionnellement, soit avec `--channel`.
- Les canaux d’extension sont autorisés tant que l’identifiant du canal est valide.

## `pairing approve`

Approuver un code d’appairage en attente et autoriser cet expéditeur.

Utilisation :

- `openclaw pairing approve <channel> <code>`
- `openclaw pairing approve --channel <channel> <code>`
- `openclaw pairing approve <code>` lorsqu’exactement un canal compatible avec l’appairage est configuré

Options :

- `--channel <channel>` : identifiant de canal explicite
- `--account <accountId>` : identifiant de compte pour les canaux multicomptes
- `--notify` : envoyer une confirmation au demandeur sur le même canal

Initialisation du propriétaire :

- Si `commands.ownerAllowFrom` est vide lorsque vous approuvez un code d’appairage, OpenClaw enregistre aussi l’expéditeur approuvé comme propriétaire des commandes, en utilisant une entrée limitée au canal telle que `telegram:123456789`.
- Cela initialise uniquement le premier propriétaire. Les approbations d’appairage ultérieures ne remplacent ni n’étendent `commands.ownerAllowFrom`.
- Le propriétaire des commandes est le compte opérateur humain autorisé à exécuter les commandes réservées au propriétaire et à approuver les actions dangereuses telles que `/diagnostics`, `/export-trajectory`, `/config` et les approbations exec.

## Notes

- Saisie du canal : transmettez-le positionnellement (`pairing list telegram`) ou avec `--channel <channel>`.
- `pairing list` prend en charge `--account <accountId>` pour les canaux multicomptes.
- `pairing approve` prend en charge `--account <accountId>` et `--notify`.
- Si un seul canal compatible avec l’appairage est configuré, `pairing approve <code>` est autorisé.
- Si vous avez approuvé un expéditeur avant l’existence de cette initialisation, exécutez `openclaw doctor` ; il avertit lorsqu’aucun propriétaire des commandes n’est configuré et affiche la commande `openclaw config set commands.ownerAllowFrom ...` pour corriger cela.

## Connexe

- [Référence CLI](/fr/cli)
- [Appairage des canaux](/fr/channels/pairing)
