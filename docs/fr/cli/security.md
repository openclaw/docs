---
read_when:
    - Vous souhaitez exécuter un audit de sécurité rapide sur la configuration/l’état
    - Vous souhaitez appliquer des suggestions de « correction » sûres (autorisations, durcir les valeurs par défaut)
summary: Référence CLI pour `openclaw security` (auditer et corriger les erreurs de sécurité courantes)
title: security
x-i18n:
    generated_at: "2026-04-23T07:02:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 92b80468403b7d329391c40add9ae9c0e2423f5c6ff162291fa13ab91ace985d
    source_path: cli/security.md
    workflow: 15
---

# `openclaw security`

Outils de sécurité (audit + corrections facultatives).

Liens associés :

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

L’audit avertit lorsque plusieurs expéditeurs DM partagent la session principale et recommande le **mode DM sécurisé** : `session.dmScope="per-channel-peer"` (ou `per-account-channel-peer` pour les canaux multi-comptes) pour les boîtes de réception partagées.
Cela concerne le durcissement des boîtes de réception coopératives/partagées. Une seule Gateway partagée entre des opérateurs mutuellement non fiables/adverses n’est pas une configuration recommandée ; séparez les limites de confiance avec des passerelles distinctes (ou des utilisateurs OS/hôtes distincts).
Il émet aussi `security.trust_model.multi_user_heuristic` lorsque la configuration suggère probablement une entrée multi-utilisateur partagée (par exemple politique DM/groupe ouverte, cibles de groupe configurées ou règles d’expéditeur génériques), et rappelle qu’OpenClaw repose par défaut sur un modèle de confiance d’assistant personnel.
Pour les configurations multi-utilisateur intentionnelles, la recommandation de l’audit est d’isoler toutes les sessions, de limiter l’accès au système de fichiers à l’espace de travail et de garder les identités ou identifiants personnels/privés hors de ce runtime.
Il avertit aussi lorsque de petits modèles (`<=300B`) sont utilisés sans isolation alors que les outils web/navigateur sont activés.
Pour l’entrée Webhook, il avertit lorsque `hooks.token` réutilise le jeton Gateway, lorsque `hooks.token` est court, lorsque `hooks.path="/"`, lorsque `hooks.defaultSessionKey` n’est pas défini, lorsque `hooks.allowedAgentIds` n’est pas restreint, lorsque les surcharges de `sessionKey` de requête sont activées et lorsque les surcharges sont activées sans `hooks.allowedSessionKeyPrefixes`.
Il avertit aussi lorsque les paramètres Docker de sandbox sont configurés alors que le mode sandbox est désactivé, lorsque `gateway.nodes.denyCommands` utilise des entrées inefficaces de type motif/inconnues (correspondance exacte uniquement sur les noms de commande de Node, pas de filtrage du texte shell), lorsque `gateway.nodes.allowCommands` active explicitement des commandes Node dangereuses, lorsque `tools.profile="minimal"` global est surchargé par des profils d’outils d’agent, lorsque des groupes ouverts exposent des outils runtime/système de fichiers sans garde-fous d’isolation/espace de travail, et lorsque les outils de Plugin installés peuvent être accessibles sous une politique d’outils permissive.
Il signale aussi `gateway.allowRealIpFallback=true` (risque d’usurpation d’en-tête si les proxys sont mal configurés) et `discovery.mdns.mode="full"` (fuite de métadonnées via les enregistrements mDNS TXT).
Il avertit aussi lorsque le navigateur sandbox utilise le réseau Docker `bridge` sans `sandbox.browser.cdpSourceRange`.
Il signale également les modes réseau Docker de sandbox dangereux (y compris `host` et les jonctions d’espace de noms `container:*`).
Il avertit aussi lorsque les conteneurs Docker navigateur sandbox existants ont des labels de hachage manquants/obsolètes (par exemple des conteneurs antérieurs à la migration sans `openclaw.browserConfigEpoch`) et recommande `openclaw sandbox recreate --browser --all`.
Il avertit aussi lorsque les enregistrements d’installation de Plugin/hook basés sur npm ne sont pas épinglés, n’ont pas de métadonnées d’intégrité ou divergent des versions de paquets actuellement installées.
Il avertit lorsque les listes d’autorisation de canal s’appuient sur des noms/emails/tags modifiables plutôt que sur des ID stables (Discord, Slack, Google Chat, Microsoft Teams, Mattermost, portées IRC le cas échéant).
Il avertit lorsque `gateway.auth.mode="none"` laisse les API HTTP Gateway accessibles sans secret partagé (`/tools/invoke` plus tout point de terminaison `/v1/*` activé).
Les paramètres préfixés par `dangerous`/`dangerously` sont des surcharges opérateur explicites de type break-glass ; en activer un ne constitue pas, à lui seul, un signalement de vulnérabilité de sécurité.
Pour l’inventaire complet des paramètres dangereux, voir la section « Insecure or dangerous flags summary » dans [Sécurité](/fr/gateway/security).

Comportement de SecretRef :

- `security audit` résout les SecretRefs pris en charge en mode lecture seule pour ses chemins ciblés.
- Si un SecretRef n’est pas disponible dans le chemin de commande actuel, l’audit continue et signale `secretDiagnostics` (au lieu de planter).
- `--token` et `--password` ne surchargent l’authentification des sondes profondes que pour cette invocation de commande ; ils ne réécrivent ni la configuration ni les mappages SecretRef.

## Sortie JSON

Utilisez `--json` pour les vérifications de stratégie/CI :

```bash
openclaw security audit --json | jq '.summary'
openclaw security audit --deep --json | jq '.findings[] | select(.severity=="critical") | .checkId'
```

Si `--fix` et `--json` sont combinés, la sortie inclut à la fois les actions de correction et le rapport final :

```bash
openclaw security audit --fix --json | jq '{fix: .fix.ok, summary: .report.summary}'
```

## Ce que modifie `--fix`

`--fix` applique des remédiations sûres et déterministes :

- fait passer les `groupPolicy="open"` courants à `groupPolicy="allowlist"` (y compris les variantes par compte dans les canaux pris en charge)
- lorsque la politique de groupe WhatsApp passe à `allowlist`, alimente `groupAllowFrom` à partir
  du fichier `allowFrom` stocké lorsque cette liste existe et que la configuration ne
  définit pas déjà `allowFrom`
- définit `logging.redactSensitive` de `"off"` à `"tools"`
- renforce les autorisations pour les fichiers d’état/configuration et les fichiers sensibles courants
  (`credentials/*.json`, `auth-profiles.json`, `sessions.json`, session
  `*.jsonl`)
- renforce aussi les fichiers inclus de configuration référencés depuis `openclaw.json`
- utilise `chmod` sur les hôtes POSIX et des réinitialisations `icacls` sous Windows

`--fix` ne fait **pas** :

- rotation des jetons/mots de passe/clés API
- désactivation des outils (`gateway`, `cron`, `exec`, etc.)
- modification des choix de bind/auth/exposition réseau de Gateway
- suppression ou réécriture des Plugins/Skills
