---
read_when:
    - Concevoir la supervision d’une flotte Codex
    - Créer des outils OpenClaw qui lisent, pilotent ou lancent des sessions Codex
    - Choisir entre un déploiement local, Cloudflare et VPS pour Codex supervisé
summary: Plan de supervision de flotte pour les sessions du serveur d’application Codex contrôlées par OpenClaw.
title: Superviseur Claw
x-i18n:
    generated_at: "2026-06-27T18:13:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ecdd58730011c94796c6df1d757606aad7112d2f36f30921541ac7f5d46ad91f
    source_path: specs/claw-supervisor.md
    workflow: 16
---

# Superviseur Claw

## Objectif

Le superviseur Claw permet à une instance OpenClaw toujours active de surveiller et de piloter une flotte de sessions Codex sans modifier l’expérience utilisateur Codex normale. Un utilisateur peut se connecter à un hôte en SSH, démarrer Codex, travailler dans la TUI, tout en permettant au superviseur de lire la session, de l’orienter, de l’interrompre, de lancer des sessions connexes et d’accepter des transferts. Les sessions Codex peuvent aussi rappeler OpenClaw via MCP.

## Modèle produit

Codex reste la surface de travail principale. OpenClaw supervise Codex au lieu de masquer Codex dans un sous-agent OpenClaw opaque.

Le Plugin OpenClaw s’appelle `codex-supervisor`. `crabfleet` reste le profil de déploiement
et de flotte d’hôtes pour les machines CRAB plutôt que le nom du Plugin réutilisable.

Le modèle comporte trois rôles :

- Codex rattaché à un humain : une TUI Codex interactive normale lancée via un app-server partagé.
- Codex autonome : un fil app-server Codex lancé par le superviseur, auquel un humain peut se rattacher plus tard.
- Claw superviseur : un agent OpenClaw toujours actif avec des outils pour l’état de la flotte, la lecture des transcriptions, l’orientation, l’interruption, le lancement et le transfert.

OpenClaw peut utiliser en interne sa machinerie de sous-agents existante, mais le contrat externe est une session Codex attachable avec un identifiant de fil Codex.

## Architecture

```text
user SSH session
  -> codex --remote unix://... or ws://...
      -> local codex app-server daemon
          <-> host sidecar / supervisor connector
              <-> OpenClaw fleet supervisor
                  <-> supervisor MCP exposed back to Codex
```

Chaque hôte compatible Codex exécute :

- Démon app-server Codex.
- Un lanceur qui démarre toujours Codex interactif avec `--remote`.
- Un connecteur qui enregistre les points de terminaison app-server et les fils actifs auprès du superviseur.

Le superviseur exécute :

- Registre des points de terminaison.
- Registre des sessions.
- Pool de clients JSON-RPC pour app-server Codex.
- Serveur MCP pour les appels de Codex vers Claw.
- Outils OpenClaw pour le contrôle de Claw vers Codex.
- Moteur de politiques pour les actions autonomes, les approbations et la prévention des boucles.

## Contrat app-server Codex

Utiliser les API app-server Codex comme plan de contrôle canonique :

- `initialize`, `initialized`
- `thread/loaded/list`
- `thread/list`
- `thread/read`
- `thread/resume`
- `thread/start`
- `turn/start`
- `turn/steer`
- `turn/interrupt`
- `model/list`

Codex interactif doit être lancé avec `codex --remote <endpoint>` afin que la TUI et le superviseur se connectent au même app-server. `codex exec` autonome n’est pas aujourd’hui une session partagée en direct ; utiliser les API app-server pour le travail autonome jusqu’à ce que Codex prenne en charge `exec --remote`.

## Registre des sessions

Le superviseur stocke un enregistrement par fil Codex observé :

```json
{
  "sessionId": "codex-thread-id",
  "endpointId": "host-a",
  "host": "host-a.example",
  "workspace": "/workspace/repo",
  "repo": "owner/repo",
  "branch": "feature/example",
  "source": "vscode",
  "status": "idle",
  "humanAttached": true,
  "lastSeenAt": "2026-05-28T10:00:00.000Z",
  "summary": "Short working-state summary"
}
```

L’implémentation locale peut dériver la plupart des champs des métadonnées de fil Codex. Le déploiement de flotte doit enrichir les enregistrements avec l’identité de l’hôte, l’état d’attachement utilisateur, l’état git et la santé du sidecar.

## Surface MCP pour Codex

Chaque Codex supervisé reçoit un serveur MCP nommé `openclaw-codex-supervisor`.

Outils :

- `codex_sessions_list` : lister les sessions Codex visibles.
- `codex_session_read` : lire une transcription.
- `codex_session_send` : envoyer un message à un fil inactif ou orienter un fil actif.
- `codex_session_interrupt` : interrompre le tour actif.
- `codex_endpoint_probe` : vérifier la connectivité du point de terminaison.
- `claw_report_progress` : publier l’état actuel de la tâche au superviseur.
- `claw_ask` : demander de l’aide ou une délégation au superviseur.
- `codex_spawn` : créer une nouvelle session Codex autonome.
- `codex_handoff` : demander une prise de relais par un humain ou un pair.

Ressources :

- `codex://sessions`
- `codex://sessions/{sessionId}`
- `codex://sessions/{sessionId}/transcript`

## Surface de contrôle Claw

Le Claw toujours actif reçoit les mêmes primitives que les outils internes :

- lister les sessions et les points de terminaison
- lire les transcriptions
- envoyer/orienter du texte
- interrompre le travail actif
- lancer de nouvelles sessions
- résumer et attribuer des sessions
- diffuser des instructions à un groupe filtré
- marquer des sessions comme bloquées, terminées ou abandonnées

Comportement des outils :

- Si un fil cible est inactif, `codex_session_send` correspond à `turn/start`.
- Si un fil cible est actif et qu’un identifiant de tour en cours est visible, il correspond à `turn/steer`.
- Si le tour actif ne peut pas être identifié, l’outil échoue en mode fermé au lieu de créer un tour sans rapport.
- Les contrôles d’écriture MCP exposés à Codex restent désactivés sauf si une politique de confiance réservée au superviseur les active.
- Les lectures brutes de transcription restent désactivées sauf si une politique de confiance réservée au superviseur les active.
- Les valeurs par défaut d’approbation autonome refusent les approbations d’outils/fichiers sauf si une politique explicite indique le contraire.

## Flux de lancement

Connexion interactive à l’hôte :

1. L’utilisateur se connecte en SSH à un hôte CRAB.
2. Le service SSH démarre ou vérifie `codex app-server daemon start`.
3. Le wrapper de connexion lance `codex --remote unix:// --cd <workspace>`.
4. Le connecteur d’hôte enregistre le point de terminaison et le fil chargé.
5. Le superviseur émet un événement de flotte à haute priorité : nouvelle session Codex, espace de travail, état rattaché à un humain, aperçu de la tâche actuelle.
6. Le Claw superviseur peut lire et orienter immédiatement.

Lancement autonome :

1. Le superviseur sélectionne l’hôte et l’espace de travail.
2. Le connecteur d’hôte ouvre ou reprend un fil app-server Codex.
3. Le superviseur démarre le premier tour avec le texte de la tâche et la configuration MCP.
4. Le registre des sessions le marque comme autonome et attachable.
5. Un humain peut s’y rattacher plus tard avec `codex --remote <endpoint> resume <threadId>` une fois que Codex prendra en charge cette UX exacte, ou via le flux de reprise actuel sur le même app-server.

## Déploiement

Plan de contrôle préféré :

- Les connecteurs d’hôte maintiennent des connexions WebSocket sortantes vers le superviseur.
- L’état du superviseur réside dans le stockage Gateway d’OpenClaw.
- L’app-server Codex reste local à chaque hôte ; ne jamais exposer un app-server brut non authentifié à l’Internet public.

Viabilité de Cloudflare :

- Adapté au registre, aux objets durables, au fan-in WebSocket, au routage léger d’événements et aux points de terminaison MCP/Gateway publics.
- Insuffisant à lui seul pour le contrôle direct d’hôtes privés, car Workers ne peut pas composer des sockets Unix privés arbitraires ni des app-servers local loopback.
- Utiliser Cloudflare lorsque chaque connecteur d’hôte appelle le serveur central via WebSocket sortant.

Solution de repli VPS :

- Utiliser un service Hetzner lorsque le contrôle de processus longue durée, les tunnels SSH, le routage de réseau privé ou l’accès au système de fichiers local sont nécessaires.
- Conserver le même protocole : connecteurs d’hôte sortants, registre superviseur central, app-server Codex local.

## Sécurité

- La liaison par défaut est une socket Unix locale.
- L’app-server distant utilise un jeton ou une authentification bearer signée.
- Le connecteur d’hôte s’authentifie auprès du superviseur avec un jeton d’hôte limité.
- Les outils du superviseur appliquent une politique par session : lecture, orientation, interruption, lancement, approbation.
- Les messages inter-agents incluent `originSessionId` ; l’auto-écho est supprimé.
- La diffusion nécessite un filtre explicite et un nombre borné de cibles.
- Les lectures de transcription expurgent les secrets à la frontière OpenClaw.
- Les demandes d’approbation sont refusées par défaut pour les tours provenant du superviseur, sauf si une politique les autorise.

## Plan d’implémentation

Phase 1 : MVP du superviseur local

- Ajouter un client JSON-RPC d’app-server Codex pour proxy stdio et points de terminaison WebSocket.
- Ajouter le registre des points de terminaison/sessions du superviseur.
- Ajouter les outils MCP : lister, lire, envoyer, interrompre, sonder.
- Ajouter la configuration d’environnement locale pour les points de terminaison.
- Ajouter des tests de faux app-server et un smoke test local avec un app-server réel.

Phase 2 : intégration OpenClaw

- Enregistrer les outils du superviseur dans le Plugin `codex-supervisor`.
- Injecter le MCP du superviseur dans la configuration des fils Codex.
- Ajouter les résumés de session au contexte de l’agent.
- Ajouter des notifications d’événements lorsque de nouveaux fils Codex apparaissent.
- Ajouter une configuration de politique pour l’envoi/l’interruption/le lancement autonomes.

Phase 3 : connecteur de flotte

- Le sidecar d’hôte enregistre le point de terminaison app-server, les métadonnées d’hôte, les métadonnées git/espace de travail et l’état d’attachement humain.
- Ajouter un connecteur WebSocket sortant pour le plan de contrôle Cloudflare ou VPS.
- Ajouter la reconnexion, le Heartbeat et le nettoyage des sessions obsolètes.
- Ajouter le wrapper de lanceur SSH CRAB.

Phase 4 : fonctionnement autonome

- Ajouter les flux de lancement/reprise/prise de relais.
- Ajouter la diffusion et la délégation.
- Ajouter les rapports d’avancement et les résumés d’état de tâche.
- Ajouter la prévention des boucles et les limites de débit.
- Ajouter des vues de tableau de bord.

Phase 5 : multi-Claw

- Fragmenter les sessions par groupe.
- Ajouter le leadership/bail pour chaque session.
- Ajouter le journal d’audit et la relecture.
- Ajouter l’escalade entre groupes Claw.

## Tests d’acceptation

- Un humain lance la TUI Codex via un app-server partagé.
- Le superviseur liste le fil actif via `thread/loaded/list`.
- Le superviseur lit la transcription via `thread/read`.
- Le superviseur envoie du texte à un fil inactif via `turn/start`.
- Le superviseur oriente un fil actif via `turn/steer`.
- L’interruption du superviseur arrête un tour actif via `turn/interrupt`.
- Codex appelle le MCP du superviseur et liste les sessions paires.
- Un Codex autonome est lancé puis rattaché à un humain.
- Un connecteur d’hôte perdu marque les sessions comme obsolètes sans supprimer l’historique.

## Questions ouvertes

- UX exacte d’attachement de la TUI Codex pour un fil app-server lancé sans TUI.
- Déterminer si Codex doit ajouter `exec --remote` pour les exécutions sans interface partagées en direct.
- Propriétaire de l’état durable : base de données OpenClaw Gateway, Cloudflare Durable Object ou base de données VPS.
- Granularité de la politique d’approbation pour les tours provenant du superviseur.
- Quelle quantité de résumé de transcription doit être injectée dans le contexte du Claw toujours actif plutôt que conservée comme outil/ressource.
