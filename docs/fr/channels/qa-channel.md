---
read_when:
    - Vous intégrez le transport de QA synthétique à une exécution de test locale ou en CI
    - Vous avez besoin de la surface de configuration qa-channel intégrée
    - Vous améliorez progressivement l’automatisation de l’assurance qualité de bout en bout
summary: Plugin de canal synthétique de type Slack pour des scénarios d’assurance qualité OpenClaw déterministes
title: Canal d’assurance qualité
x-i18n:
    generated_at: "2026-07-16T12:57:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: a43c35e197116a6bd44b238010eb508aed23dea99ab872d10e6fc853b5f4d4a7
    source_path: channels/qa-channel.md
    workflow: 16
---

`qa-channel` est un transport synthétique de messages local au dépôt pour le contrôle qualité automatisé d’OpenClaw (`extensions/qa-channel`, paquet privé, exclu des installations empaquetées). Il ne s’agit pas d’un canal de production : il sert à exercer la même frontière de Plugin de canal que les transports réels, tout en conservant un état déterministe et entièrement inspectable.

## Fonctionnement

- Grammaire de cible de classe Slack :
  - `dm:<user>`
  - `channel:<room>`
  - `group:<room>`
  - `thread:<room>/<thread>`
- Les conversations partagées `channel:` et `group:` sont présentées aux agents comme des tours dans des salons de groupe/canal, afin d’exercer la même politique de routage des réponses visibles et des outils de messagerie que celle utilisée par Discord, Slack, Telegram et les transports similaires.
- Bus synthétique reposant sur HTTP pour l’injection de messages entrants, la capture des transcriptions sortantes, la création de fils de discussion, les réactions, les modifications, les suppressions et les actions de recherche/lecture.
- Exécuteur d’autovérification côté hôte qui écrit un rapport Markdown dans `.artifacts/qa-e2e/`.

## Configuration

```json
{
  "channels": {
    "qa-channel": {
      "baseUrl": "http://127.0.0.1:43123",
      "botUserId": "openclaw",
      "botDisplayName": "OpenClaw QA",
      "allowFrom": ["*"],
      "pollTimeoutMs": 1000
    }
  }
}
```

Clés de compte :

- `enabled` - interrupteur principal de ce compte.
- `name` - libellé d’affichage facultatif.
- `baseUrl` - URL du bus synthétique. Le compte est considéré comme configuré dès que cette valeur est définie.
- `botUserId` - identifiant utilisateur du bot synthétique utilisé dans la grammaire de cible (valeur par défaut : `openclaw`).
- `botDisplayName` - nom d’affichage des messages sortants (valeur par défaut : `OpenClaw QA`).
- `pollTimeoutMs` - fenêtre d’attente de l’interrogation longue. Entier compris entre 100 et 30000 (valeur par défaut : 1000).
- `allowFrom` - liste d’autorisation des expéditeurs (identifiants utilisateur ou `"*"` ; valeur par défaut : `["*"]`). Les messages privés appliquent
  toujours la politique `open` ; la politique de groupe avec liste d’autorisation utilise également ces
  identifiants d’expéditeur synthétiques.
- `groupPolicy` - politique des salons partagés : `"open"` (valeur par défaut), `"allowlist"` ou
  `"disabled"`.
- `groupAllowFrom` - liste d’autorisation facultative des expéditeurs des salons partagés. Lorsqu’elle est omise sous
  `"allowlist"`, QA Channel utilise `allowFrom` comme solution de repli.
- `groups.<room>.requireMention` - exige une mention du bot avant de répondre dans un
  salon de groupe/canal spécifique (valeur par défaut : false). `groups."*"` définit la valeur par défaut ;
  les paramètres `tools` / `toolsBySender` propres à chaque salon définissent les dérogations à la politique des outils.
- `defaultTo` - cible de repli lorsqu’aucune cible n’est fournie.
- `actions.messages` / `actions.reactions` / `actions.search` / `actions.threads` - contrôle de l’accès aux outils pour chaque action.

Clés multicomptes au niveau supérieur :

- `accounts` - ensemble de dérogations nommées propres à chaque compte, indexées par identifiant de compte.
- `defaultAccount` - identifiant de compte préféré lorsque plusieurs comptes sont configurés.

## Exécuteurs

Autovérification côté hôte (écrit un rapport Markdown sous `.artifacts/qa-e2e/`) :

```bash
pnpm qa:e2e
```

Cette commande passe par `qa-lab`, démarre le bus de contrôle qualité intégré au dépôt, initialise la tranche d’exécution `qa-channel` et exécute une autovérification déterministe.

Suite complète de scénarios reposant sur le dépôt :

```bash
pnpm openclaw qa suite
```

Exécute les scénarios en parallèle sur la voie du Gateway de contrôle qualité. Consultez la [présentation du contrôle qualité](/fr/concepts/qa-e2e-automation) pour les scénarios, les profils et les modes de fournisseur.

Site de contrôle qualité reposant sur Docker (Gateway + interface de débogage QA Lab dans une même pile) :

```bash
pnpm qa:lab:up
```

Construit le site de contrôle qualité, démarre la pile Gateway + QA Lab reposant sur Docker et affiche l’URL de QA Lab. Vous pouvez ensuite sélectionner des scénarios, choisir la voie du modèle, lancer des exécutions individuelles et suivre les résultats en direct. Le débogueur QA Lab est distinct du paquet Control UI distribué.

## Voir aussi

- [Présentation du contrôle qualité](/fr/concepts/qa-e2e-automation) - pile globale, adaptateurs de transport, profils Matrix et création de scénarios
- [Appairage](/fr/channels/pairing)
- [Groupes](/fr/channels/groups)
- [Présentation des canaux](/fr/channels)
