---
read_when:
    - Vous souhaitez effectuer un audit de sécurité rapide de la configuration et de l’état
    - Vous souhaitez appliquer des suggestions de « correction » sûres (permissions, durcir les valeurs par défaut)
summary: Référence CLI pour `openclaw security` (auditer et corriger les pièges de sécurité courants)
title: Sécurité
x-i18n:
    generated_at: "2026-05-02T07:02:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 44eb50368cb54441782a7c4e20fab24d0488b80c9a1eedf8e1eb31dc8d7a9cf6
    source_path: cli/security.md
    workflow: 16
---

# `openclaw security`

Outils de sécurité (audit + corrections facultatives).

Connexe :

- Guide de sécurité : [Sécurité](/fr/gateway/security)

## Audit

```bash
openclaw security audit
openclaw security audit --deep
openclaw security audit --deep --password <password>
openclaw security audit --deep --token <token>
openclaw security audit --fix
openclaw security audit --json
```

La commande simple `security audit` reste sur le chemin froid de configuration/système de fichiers/lecture seule. Elle ne découvre pas par défaut les collecteurs de sécurité du runtime des plugins ; ainsi, les audits courants ne chargent pas le runtime de chaque plugin installé. Utilisez `--deep` pour inclure les sondes Gateway en direct au mieux et les collecteurs d’audit de sécurité appartenant aux plugins ; les appelants internes explicites peuvent aussi choisir d’activer ces collecteurs appartenant aux plugins lorsqu’ils disposent déjà d’une portée de runtime appropriée.

L’audit avertit lorsque plusieurs expéditeurs de DM partagent la session principale et recommande le **mode DM sécurisé** : `session.dmScope="per-channel-peer"` (ou `per-account-channel-peer` pour les canaux multi-comptes) pour les boîtes de réception partagées.
Cela vise le renforcement des boîtes de réception coopératives/partagées. Un Gateway unique partagé par des opérateurs qui ne se font pas mutuellement confiance ou sont adversariaux n’est pas une configuration recommandée ; séparez les frontières de confiance avec des gateways distincts (ou des utilisateurs/hôtes d’OS distincts).
Il émet aussi `security.trust_model.multi_user_heuristic` lorsque la configuration suggère une entrée probablement partagée entre utilisateurs (par exemple une politique de DM/groupe ouverte, des cibles de groupe configurées ou des règles d’expéditeur génériques), et rappelle qu’OpenClaw utilise par défaut un modèle de confiance d’assistant personnel.
Pour les configurations partagées entre utilisateurs intentionnelles, les recommandations d’audit sont de placer toutes les sessions en sandbox, de limiter l’accès au système de fichiers à l’espace de travail et de garder les identités ou identifiants personnels/privés hors de ce runtime.
Il avertit aussi lorsque de petits modèles (`<=300B`) sont utilisés sans sandboxing et avec des outils web/navigateur activés.
Pour l’entrée Webhook, il avertit lorsque `hooks.token` réutilise le jeton Gateway, lorsque `hooks.token` est court, lorsque `hooks.path="/"`, lorsque `hooks.defaultSessionKey` n’est pas défini, lorsque `hooks.allowedAgentIds` n’est pas restreint, lorsque les remplacements `sessionKey` de requête sont activés, et lorsque les remplacements sont activés sans `hooks.allowedSessionKeyPrefixes`.
Il avertit aussi lorsque des paramètres Docker de sandbox sont configurés alors que le mode sandbox est désactivé, lorsque `gateway.nodes.denyCommands` utilise des entrées inefficaces ressemblant à des motifs ou inconnues (correspondance exacte du nom de commande de nœud uniquement, pas de filtrage du texte shell), lorsque `gateway.nodes.allowCommands` active explicitement des commandes de nœud dangereuses, lorsque le profil global `tools.profile="minimal"` est remplacé par des profils d’outils d’agent, lorsque des groupes ouverts exposent des outils de runtime/système de fichiers sans protections de sandbox/espace de travail, et lorsque des outils de plugins installés peuvent être accessibles avec une politique d’outils permissive.
Il signale aussi `gateway.allowRealIpFallback=true` (risque d’usurpation d’en-tête si les proxys sont mal configurés) et `discovery.mdns.mode="full"` (fuite de métadonnées via les enregistrements TXT mDNS).
Il avertit aussi lorsque le navigateur sandbox utilise le réseau Docker `bridge` sans `sandbox.browser.cdpSourceRange`.
Il signale aussi les modes réseau Docker sandbox dangereux (y compris `host` et les jonctions d’espace de noms `container:*`).
Il avertit aussi lorsque des conteneurs Docker de navigateur sandbox existants ont des étiquettes de hachage manquantes/obsolètes (par exemple des conteneurs pré-migration sans `openclaw.browserConfigEpoch`) et recommande `openclaw sandbox recreate --browser --all`.
Il avertit aussi lorsque les enregistrements d’installation de plugins/hooks basés sur npm ne sont pas épinglés, n’ont pas de métadonnées d’intégrité ou divergent des versions de paquets actuellement installées.
Il avertit lorsque les listes d’autorisation de canaux reposent sur des noms/e-mails/tags mutables plutôt que sur des ID stables (Discord, Slack, Google Chat, Microsoft Teams, Mattermost, portées IRC le cas échéant).
Il avertit lorsque `gateway.auth.mode="none"` laisse les API HTTP Gateway accessibles sans secret partagé (`/tools/invoke` plus tout point de terminaison `/v1/*` activé).
Les paramètres préfixés par `dangerous`/`dangerously` sont des dérogations explicites d’opérateur en cas d’urgence ; en activer un ne constitue pas, en soi, un rapport de vulnérabilité de sécurité.
Pour l’inventaire complet des paramètres dangereux, consultez la section « Résumé des indicateurs non sécurisés ou dangereux » dans [Sécurité](/fr/gateway/security).

Comportement SecretRef :

- `security audit` résout les SecretRefs pris en charge en mode lecture seule pour ses chemins ciblés.
- Si un SecretRef est indisponible dans le chemin de commande actuel, l’audit continue et signale `secretDiagnostics` (au lieu de planter).
- `--token` et `--password` ne remplacent l’authentification des sondes approfondies que pour cette invocation de commande ; ils ne réécrivent pas la configuration ni les mappages SecretRef.

## Sortie JSON

Utilisez `--json` pour les vérifications CI/politique :

```bash
openclaw security audit --json | jq '.summary'
openclaw security audit --deep --json | jq '.findings[] | select(.severity=="critical") | .checkId'
```

Si `--fix` et `--json` sont combinés, la sortie inclut à la fois les actions de correction et le rapport final :

```bash
openclaw security audit --fix --json | jq '{fix: .fix.ok, summary: .report.summary}'
```

## Ce que `--fix` modifie

`--fix` applique des remédiations sûres et déterministes :

- bascule les valeurs courantes `groupPolicy="open"` vers `groupPolicy="allowlist"` (y compris les variantes de compte dans les canaux pris en charge)
- lorsque la politique de groupe WhatsApp bascule vers `allowlist`, initialise `groupAllowFrom` depuis
  le fichier `allowFrom` stocké lorsque cette liste existe et que la configuration ne définit pas déjà
  `allowFrom`
- définit `logging.redactSensitive` de `"off"` à `"tools"`
- renforce les permissions pour l’état/la configuration et les fichiers sensibles courants
  (`credentials/*.json`, `auth-profiles.json`, `sessions.json`, fichiers `*.jsonl`
  de session)
- renforce aussi les fichiers d’inclusion de configuration référencés depuis `openclaw.json`
- utilise `chmod` sur les hôtes POSIX et des réinitialisations `icacls` sur Windows

`--fix` ne fait **pas** ce qui suit :

- faire tourner les jetons/mots de passe/clés d’API
- désactiver des outils (`gateway`, `cron`, `exec`, etc.)
- modifier les choix d’exposition de liaison/authentification/réseau du gateway
- supprimer ou réécrire des plugins/skills

## Connexe

- [Référence CLI](/fr/cli)
- [Audit de sécurité](/fr/gateway/security)
