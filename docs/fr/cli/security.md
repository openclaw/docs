---
read_when:
    - Vous voulez exécuter un audit de sécurité rapide sur la configuration/l’état
    - Vous voulez appliquer des suggestions de « correction » sûres (autorisations, resserrer les valeurs par défaut)
summary: Référence CLI pour `openclaw security` (auditer et corriger les pièges de sécurité courants)
title: Sécurité
x-i18n:
    generated_at: "2026-06-27T17:21:06Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 58876d7ab4dd3e5d3f5c915700b08ca234e5ccefdfc35a79e60a31e1fce21774
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

La commande simple `security audit` reste sur le chemin froid configuration/système de fichiers/en lecture seule. Elle ne découvre pas par défaut les collecteurs de sécurité d’exécution des plugins ; les audits courants ne chargent donc pas chaque runtime de plugin installé. Utilisez `--deep` pour inclure des sondes Gateway actives au mieux et les collecteurs d’audit de sécurité appartenant aux plugins ; les appelants internes explicites peuvent aussi activer ces collecteurs appartenant aux plugins lorsqu’ils disposent déjà d’une portée d’exécution appropriée.

L’audit avertit lorsque plusieurs expéditeurs de DM partagent la session principale et recommande le **mode DM sécurisé** : `session.dmScope="per-channel-peer"` (ou `per-account-channel-peer` pour les canaux multi-comptes) pour les boîtes de réception partagées.
Cela sert au renforcement de boîtes de réception coopératives/partagées. Un seul Gateway partagé par des opérateurs mutuellement non fiables ou adversariaux n’est pas une configuration recommandée ; séparez les frontières de confiance avec des Gateway distincts (ou des utilisateurs/hôtes OS distincts).
Il émet aussi `security.trust_model.multi_user_heuristic` lorsque la configuration suggère une entrée probablement partagée entre utilisateurs (par exemple une politique de DM/groupes ouverts, des cibles de groupe configurées ou des règles d’expéditeur génériques), et rappelle qu’OpenClaw utilise par défaut un modèle de confiance d’assistant personnel.
Pour les configurations intentionnellement partagées entre utilisateurs, les recommandations d’audit sont d’isoler toutes les sessions, de limiter l’accès au système de fichiers à l’espace de travail, et de garder les identités ou identifiants personnels/privés hors de ce runtime.
Il avertit aussi lorsque de petits modèles (`<=300B`) sont utilisés sans isolement en bac à sable et avec les outils web/navigateur activés.
Pour l’entrée par webhook, le démarrage journalise un avertissement de sécurité non fatal et l’audit signale la réutilisation par `hooks.token` de valeurs d’authentification par secret partagé Gateway actives, notamment `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` et `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`. Il avertit aussi lorsque :

- `hooks.token` est court
- `hooks.path="/"`
- `hooks.defaultSessionKey` n’est pas défini
- `hooks.allowedAgentIds` n’est pas restreint
- les remplacements `sessionKey` de requête sont activés
- les remplacements sont activés sans `hooks.allowedSessionKeyPrefixes`

Si l’authentification par mot de passe Gateway est fournie uniquement au démarrage, passez la même valeur à `openclaw security audit --auth password --password <password>` afin que l’audit puisse la comparer à `hooks.token`.
Exécutez `openclaw doctor --fix` pour renouveler un `hooks.token` persistant réutilisé, puis mettez à jour les expéditeurs de hooks externes pour utiliser le nouveau jeton de hook.

Il avertit aussi lorsque des paramètres Docker de bac à sable sont configurés alors que le mode bac à sable est désactivé, lorsque `gateway.nodes.denyCommands` utilise des entrées inefficaces de type motif ou inconnues (correspondance exacte du nom de commande de nœud uniquement, pas de filtrage de texte shell), lorsque `gateway.nodes.allowCommands` active explicitement des commandes de nœud dangereuses, lorsque le profil global `tools.profile="minimal"` est remplacé par des profils d’outils d’agent, lorsque les outils d’écriture/édition sont désactivés mais que `exec` reste disponible sans frontière contraignante de système de fichiers en bac à sable, lorsque des DM ou groupes ouverts exposent des outils runtime/système de fichiers sans protections de bac à sable/espace de travail, et lorsque des outils de plugins installés peuvent être accessibles avec une politique d’outils permissive.
Il signale aussi `gateway.allowRealIpFallback=true` (risque d’usurpation d’en-tête si les proxys sont mal configurés) et `discovery.mdns.mode="full"` (fuite de métadonnées via les enregistrements mDNS TXT).
Il avertit aussi lorsque le navigateur en bac à sable utilise le réseau Docker `bridge` sans `sandbox.browser.cdpSourceRange`.
Il signale aussi les modes réseau Docker dangereux du bac à sable (notamment `host` et les rattachements à des espaces de noms `container:*`).
Il avertit aussi lorsque des conteneurs Docker de navigateur en bac à sable existants ont des étiquettes de hachage manquantes ou obsolètes (par exemple des conteneurs pré-migration sans `openclaw.browserConfigEpoch`) et recommande `openclaw sandbox recreate --browser --all`.
Il avertit aussi lorsque les enregistrements d’installation de plugins/hooks basés sur npm ne sont pas épinglés, n’ont pas de métadonnées d’intégrité ou divergent des versions de paquet actuellement installées.
Il avertit lorsque les listes d’autorisation de canaux s’appuient sur des noms/e-mails/étiquettes mutables plutôt que sur des ID stables (Discord, Slack, Google Chat, Microsoft Teams, Mattermost, portées IRC le cas échéant).
Il avertit lorsque `gateway.auth.mode="none"` laisse les API HTTP Gateway accessibles sans secret partagé (`/tools/invoke` plus tout endpoint `/v1/*` activé).
Les paramètres préfixés par `dangerous`/`dangerously` sont des contournements opérateur explicites d’urgence ; en activer un ne constitue pas, en soi, un rapport de vulnérabilité de sécurité.
Pour l’inventaire complet des paramètres dangereux, consultez la section « Résumé des indicateurs non sécurisés ou dangereux » dans [Sécurité](/fr/gateway/security).

Les constats persistants intentionnels peuvent être acceptés avec `security.audit.suppressions`.
Chaque suppression correspond à un `checkId` exact et peut être restreinte avec des sous-chaînes insensibles à la casse
`titleIncludes` et/ou `detailIncludes` :

```json
{
  "security": {
    "audit": {
      "suppressions": [
        {
          "checkId": "plugins.tools_reachable_permissive_policy",
          "detailIncludes": "Enabled extension plugins: gbrain",
          "reason": "trusted local operator plugin"
        }
      ]
    }
  }
}
```

Les constats supprimés sont retirés du `summary` actif et de la liste `findings`.
La sortie JSON les conserve sous `suppressedFindings` à des fins d’auditabilité.
Lorsque des suppressions sont configurées, la sortie active conserve aussi un constat d’information non supprimable
`security.audit.suppressions.active` afin que les lecteurs sachent que l’audit
a été filtré. Les indicateurs de configuration dangereuse sont émis à raison d’un indicateur par constat ; accepter un indicateur dangereux ne masque donc pas d’autres indicateurs activés qui partagent le même `checkId` `config.insecure_or_dangerous_flags`.
Comme les suppressions peuvent masquer un risque persistant, leur ajout ou suppression via
des commandes shell exécutées par un agent requiert une approbation exec, sauf si exec fonctionne déjà
avec `security="full"` et `ask="off"` pour une automatisation locale fiable.

Comportement de SecretRef :

- `security audit` résout les SecretRefs pris en charge en mode lecture seule pour ses chemins ciblés.
- Si une SecretRef est indisponible dans le chemin de commande actuel, l’audit continue et signale `secretDiagnostics` (au lieu de planter).
- `--token` et `--password` remplacent uniquement l’authentification des sondes approfondies pour cette invocation de commande ; ils ne réécrivent pas la configuration ni les mappages SecretRef.

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

## Ce que `--fix` change

`--fix` applique des remédiations sûres et déterministes :

- bascule les `groupPolicy="open"` courants vers `groupPolicy="allowlist"` (y compris les variantes de compte dans les canaux pris en charge)
- lorsque la politique de groupe WhatsApp bascule vers `allowlist`, alimente `groupAllowFrom` depuis
  le fichier `allowFrom` stocké lorsque cette liste existe et que la configuration ne définit pas déjà
  `allowFrom`
- définit `logging.redactSensitive` de `"off"` à `"tools"`
- renforce les permissions pour les fichiers d’état/configuration et les fichiers sensibles courants
  (`credentials/*.json`, `auth-profiles.json`, `sessions.json`, sessions
  `*.jsonl`)
- renforce aussi les fichiers d’inclusion de configuration référencés depuis `openclaw.json`
- utilise `chmod` sur les hôtes POSIX et des réinitialisations `icacls` sur Windows

`--fix` ne fait **pas** :

- renouveler les jetons/mots de passe/clés API
- désactiver les outils (`gateway`, `cron`, `exec`, etc.)
- modifier les choix d’exposition bind/auth/réseau du gateway
- supprimer ou réécrire les plugins/skills

## Connexe

- [Référence CLI](/fr/cli)
- [Audit de sécurité](/fr/gateway/security)
