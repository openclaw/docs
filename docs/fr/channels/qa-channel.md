---
read_when:
    - Vous intégrez le transport de QA synthétique à une exécution de test locale ou en CI
    - Vous avez besoin de l’interface de configuration qa-channel intégrée
    - Vous améliorez de manière itérative l’automatisation de l’assurance qualité de bout en bout
summary: Plugin de canal synthétique de type Slack pour des scénarios d’assurance qualité OpenClaw déterministes
title: Canal d’assurance qualité
x-i18n:
    generated_at: "2026-07-12T02:21:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f33af6ef31515e0cab0ee2540f48f3ffea8aba3d13915dc8cf66111599354187
    source_path: channels/qa-channel.md
    workflow: 16
---

`qa-channel` est un transport synthétique de messages local au dépôt destiné à l’assurance qualité automatisée d’OpenClaw (`extensions/qa-channel`, paquet privé, exclu des installations empaquetées). Ce n’est pas un canal de production : il sert à exercer la même interface de Plugin de canal que les transports réels, tout en conservant un état déterministe et entièrement inspectable.

## Fonctionnement

- Grammaire de cible de type Slack :
  - `dm:<user>`
  - `channel:<room>`
  - `group:<room>`
  - `thread:<room>/<thread>`
- Les conversations partagées `channel:` et `group:` sont présentées aux agents comme des tours de salle de groupe/canal, afin d’exercer la même politique de routage des réponses visibles et des outils de messagerie que Discord, Slack, Telegram et les transports similaires.
- Bus synthétique basé sur HTTP pour l’injection de messages entrants, la capture de la transcription sortante, la création de fils de discussion, les réactions, les modifications, les suppressions et les actions de recherche/lecture.
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

- `enabled` - commutateur principal de ce compte.
- `name` - libellé d’affichage facultatif.
- `baseUrl` - URL du bus synthétique. Le compte est considéré comme configuré dès que cette valeur est définie.
- `botUserId` - identifiant utilisateur du bot synthétique utilisé dans la grammaire de cible (valeur par défaut : `openclaw`).
- `botDisplayName` - nom d’affichage des messages sortants (valeur par défaut : `OpenClaw QA`).
- `pollTimeoutMs` - fenêtre d’attente de l’interrogation longue. Entier compris entre 100 et 30000 (valeur par défaut : 1000).
- `allowFrom` - liste des expéditeurs autorisés (identifiants utilisateur ou `"*"` ; valeur par défaut : `["*"]`). Les messages privés appliquent
  toujours la politique `open` ; la politique de groupe avec liste d’autorisation utilise également ces
  identifiants d’expéditeurs synthétiques.
- `groupPolicy` - politique des salles partagées : `"open"` (valeur par défaut), `"allowlist"` ou
  `"disabled"`.
- `groupAllowFrom` - liste facultative des expéditeurs autorisés dans les salles partagées. Lorsqu’elle est omise avec
  `"allowlist"`, le canal QA utilise `allowFrom` comme solution de repli.
- `groups.<room>.requireMention` - exige une mention du bot avant de répondre dans une
  salle de groupe/canal donnée (valeur par défaut : false). `groups."*"` définit la valeur par défaut ;
  les paramètres `tools` / `toolsBySender` propres à chaque salle définissent les dérogations à la politique des outils.
- `defaultTo` - cible de repli lorsqu’aucune cible n’est fournie.
- `actions.messages` / `actions.reactions` / `actions.search` / `actions.threads` - contrôle de l’accès aux outils pour chaque action.

Clés multicomptes au niveau supérieur :

- `accounts` - ensemble de dérogations nommées propres à chaque compte, indexées par identifiant de compte.
- `defaultAccount` - identifiant de compte privilégié lorsque plusieurs comptes sont configurés.

## Exécuteurs

Autovérification côté hôte (écrit un rapport Markdown sous `.artifacts/qa-e2e/`) :

```bash
pnpm qa:e2e
```

Cette commande passe par `qa-lab`, démarre le bus QA intégré au dépôt, amorce la tranche d’exécution de `qa-channel` et exécute une autovérification déterministe.

Suite complète de scénarios adossée au dépôt :

```bash
pnpm openclaw qa suite
```

Exécute les scénarios en parallèle sur la voie du Gateway QA. Consultez la [présentation de l’assurance qualité](/fr/concepts/qa-e2e-automation) pour les scénarios, les profils et les modes de fournisseur.

Site d’assurance qualité basé sur Docker (Gateway + interface de débogage QA Lab dans une même pile) :

```bash
pnpm qa:lab:up
```

Construit le site d’assurance qualité, démarre la pile Gateway + QA Lab basée sur Docker et affiche l’URL de QA Lab. Vous pouvez ensuite sélectionner des scénarios, choisir la voie du modèle, lancer des exécutions individuelles et suivre les résultats en direct. Le débogueur QA Lab est distinct du paquet Control UI distribué.

## Voir aussi

- [Présentation de l’assurance qualité](/fr/concepts/qa-e2e-automation) - pile globale, adaptateurs de transport, création de scénarios
- [Assurance qualité matricielle](/fr/concepts/qa-matrix) - exemple d’exécuteur avec transport réel qui pilote un véritable canal
- [Association](/fr/channels/pairing)
- [Groupes](/fr/channels/groups)
- [Présentation des canaux](/fr/channels)
