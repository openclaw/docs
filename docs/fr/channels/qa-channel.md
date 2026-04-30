---
read_when:
    - Vous intégrez le transport d’assurance qualité synthétique dans une exécution de test locale ou en CI
    - Vous avez besoin de la surface de configuration qa-channel incluse
    - Vous itérez sur l’automatisation de l’assurance qualité de bout en bout
summary: Plugin de canal synthétique de type Slack pour des scénarios d’assurance qualité OpenClaw déterministes
title: Canal QA
x-i18n:
    generated_at: "2026-04-30T07:14:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: e1de1f52da1a14c845cf2a536ddc6f36ab52ed6364f68d9ece32ce272e2a2f96
    source_path: channels/qa-channel.md
    workflow: 16
---

`qa-channel` est un transport de messages synthétique intégré pour la QA automatisée d'OpenClaw. Ce n'est pas un canal de production : il existe pour exercer la même frontière de Plugin de canal que celle utilisée par les transports réels, tout en gardant l'état déterministe et entièrement inspectable.

## Ce qu'il fait

- Grammaire de cible de classe Slack :
  - `dm:<user>`
  - `channel:<room>`
  - `thread:<room>/<thread>`
- Bus synthétique adossé à HTTP pour l'injection de messages entrants, la capture de transcriptions sortantes, la création de fils de discussion, les réactions, les modifications, les suppressions et les actions de recherche/lecture.
- Lanceur d'auto-vérification côté hôte qui écrit un rapport Markdown dans `.artifacts/qa-e2e/`.

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

- `enabled` — interrupteur principal pour ce compte.
- `name` — libellé d'affichage facultatif.
- `baseUrl` — URL du bus synthétique.
- `botUserId` — identifiant utilisateur du bot de style Matrix utilisé dans la grammaire de cible.
- `botDisplayName` — nom d'affichage pour les messages sortants.
- `pollTimeoutMs` — fenêtre d'attente de long-polling. Entier compris entre 100 et 30000.
- `allowFrom` — liste d'autorisation des expéditeurs (identifiants utilisateur ou `"*"`).
- `defaultTo` — cible de repli lorsqu'aucune n'est fournie.
- `actions.messages` / `actions.reactions` / `actions.search` / `actions.threads` — contrôle d'accès aux outils par action.

Clés multi-comptes au niveau supérieur :

- `accounts` — enregistrement des remplacements nommés par compte, indexés par identifiant de compte.
- `defaultAccount` — identifiant de compte préféré lorsque plusieurs sont configurés.

## Lanceurs

Auto-vérification côté hôte (écrit un rapport Markdown sous `.artifacts/qa-e2e/`) :

```bash
pnpm qa:e2e
```

Cela passe par `qa-lab`, démarre le bus QA dans le dépôt, lance la tranche d'exécution `qa-channel` intégrée et exécute une auto-vérification déterministe.

Suite complète de scénarios adossée au dépôt :

```bash
pnpm openclaw qa suite
```

Exécute les scénarios en parallèle sur la voie Gateway QA. Consultez la [vue d'ensemble QA](/fr/concepts/qa-e2e-automation) pour les scénarios, les profils et les modes de fournisseur.

Site QA adossé à Docker (Gateway + interface de débogage QA Lab dans une seule pile) :

```bash
pnpm qa:lab:up
```

Construit le site QA, démarre la pile Gateway + QA Lab adossée à Docker et affiche l'URL QA Lab. À partir de là, vous pouvez choisir des scénarios, sélectionner la voie de modèle, lancer des exécutions individuelles et suivre les résultats en direct. Le débogueur QA Lab est distinct du bundle Control UI livré.

## Connexe

- [Vue d'ensemble QA](/fr/concepts/qa-e2e-automation) — pile globale, adaptateurs de transport, création de scénarios
- [QA Matrix](/fr/concepts/qa-matrix) — exemple de lanceur avec transport réel qui pilote un véritable canal
- [Appairage](/fr/channels/pairing)
- [Groupes](/fr/channels/groups)
- [Vue d'ensemble des canaux](/fr/channels)
