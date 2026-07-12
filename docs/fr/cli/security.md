---
read_when:
    - Vous souhaitez effectuer un audit de sécurité rapide de la configuration et de l’état
    - Vous souhaitez appliquer des suggestions de « correction » sûres (autorisations, renforcement des valeurs par défaut)
summary: Référence de la CLI pour `openclaw security` (auditer et corriger les erreurs de configuration courantes en matière de sécurité)
title: Sécurité
x-i18n:
    generated_at: "2026-07-12T15:13:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 613d1afa63e46a7dc3474d0b175cf2389703a86b00f861b4140d64e11c28ece5
    source_path: cli/security.md
    workflow: 16
---

# `openclaw security`

Outils de sécurité : audit et correctifs sûrs facultatifs. Voir aussi : [Sécurité](/fr/gateway/security).

```bash
openclaw security audit
openclaw security audit --deep
openclaw security audit --deep --password <password>
openclaw security audit --deep --token <token>
openclaw security audit --auth password --password <password>
openclaw security audit --fix
openclaw security audit --json
```

## Modes d’audit

La commande simple `security audit` reste sur le chemin à froid de la configuration, du système de fichiers et de la lecture seule : elle ne découvre pas les collecteurs de sécurité d’exécution des plugins, afin que les audits courants ne chargent pas l’environnement d’exécution de chaque plugin installé. `--deep` ajoute des sondes en direct du Gateway, exécutées au mieux, ainsi que les collecteurs d’audit de sécurité appartenant aux plugins (les appelants internes explicites peuvent également choisir d’utiliser ces collecteurs lorsqu’ils disposent déjà d’une portée d’exécution appropriée).

Si l’authentification par mot de passe du Gateway est fournie uniquement au démarrage, transmettez la même valeur avec `--auth password --password <password>` afin que l’audit puisse la comparer à `hooks.token`.

## Éléments vérifiés

**Modèle de confiance et messages privés**

- Avertit lorsque plusieurs expéditeurs de messages privés partagent la session principale et recommande un mode sécurisé pour les messages privés : `session.dmScope="per-channel-peer"` (ou `per-account-channel-peer` pour les canaux multicomptes) pour les boîtes de réception partagées. Il s’agit d’un renforcement pour la coopération et les boîtes de réception partagées, et non d’une isolation entre opérateurs qui ne se font pas mutuellement confiance ; séparez les périmètres de confiance à l’aide de gateways distincts (ou d’utilisateurs du système d’exploitation ou d’hôtes distincts).
- Émet `security.trust_model.multi_user_heuristic` lorsque la configuration suggère une entrée probablement partagée entre plusieurs utilisateurs (par exemple, une politique ouverte pour les messages privés ou les groupes, des cibles de groupe configurées ou des règles d’expéditeur avec caractères génériques) — le modèle de confiance par défaut d’OpenClaw est celui d’un assistant personnel (un seul opérateur), et non une isolation mutualisée hostile. Pour les configurations intentionnellement partagées entre plusieurs utilisateurs : placez toutes les sessions dans un bac à sable, limitez l’accès au système de fichiers à l’espace de travail et ne stockez aucune identité ni aucun identifiant d’authentification personnel ou privé dans cet environnement d’exécution.
- Avertit lorsque de petits modèles (paramètres `<=300B`) sont utilisés sans bac à sable et avec les outils Web ou de navigateur activés.

**Webhook/hooks**

Au démarrage, un avertissement de sécurité non bloquant est consigné, et l’audit signale la réutilisation par `hooks.token` des valeurs actives d’authentification par secret partagé du Gateway (`gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN`, `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`). Il avertit également lorsque :

- `hooks.token` est court
- `hooks.path="/"`
- `hooks.defaultSessionKey` n’est pas défini
- `hooks.allowedAgentIds` n’est pas restreint
- les substitutions de `sessionKey` par requête sont activées
- les substitutions sont activées sans `hooks.allowedSessionKeyPrefixes`

Exécutez `openclaw doctor --fix` pour renouveler un `hooks.token` persistant réutilisé, puis mettez à jour les expéditeurs de hooks externes afin qu’ils utilisent le nouveau jeton.

**Bac à sable/outils**

- Avertit lorsque des paramètres Docker du bac à sable sont configurés alors que le mode bac à sable est désactivé.
- Avertit lorsque `gateway.nodes.denyCommands` utilise des entrées inconnues ou ressemblant à des motifs, mais inefficaces (la correspondance porte uniquement sur le nom exact de la commande du Node, et non sur le filtrage du texte de l’interpréteur de commandes).
- Avertit lorsque `gateway.nodes.allowCommands` active explicitement des commandes Node dangereuses.
- Avertit lorsque la valeur globale `tools.profile="minimal"` est remplacée par des profils d’outils d’agents.
- Avertit lorsque les outils d’écriture et de modification sont désactivés, mais que `exec` reste disponible sans périmètre contraignant du système de fichiers du bac à sable.
- Avertit lorsque des messages privés ou des groupes ouverts exposent des outils d’exécution ou de système de fichiers sans protections de bac à sable ou d’espace de travail.
- Avertit lorsque les outils de plugins installés peuvent être accessibles dans le cadre d’une politique d’outils permissive.

**Navigateur du bac à sable**

- Avertit lorsque le navigateur du bac à sable utilise le réseau Docker `bridge` sans `sandbox.browser.cdpSourceRange`.
- Signale les modes réseau Docker dangereux pour le bac à sable, notamment `host` et les jonctions d’espaces de noms `container:*`.
- Avertit lorsque des conteneurs Docker existants du navigateur du bac à sable ont des étiquettes de hachage absentes ou obsolètes (par exemple, les conteneurs antérieurs à la migration auxquels il manque `openclaw.browserConfigEpoch`) et recommande `openclaw sandbox recreate --browser --all`.

**Réseau/découverte**

- Signale `gateway.allowRealIpFallback=true` (risque d’usurpation d’en-tête si les proxys sont mal configurés).
- Signale `discovery.mdns.mode="full"` (fuite de métadonnées par les enregistrements TXT mDNS).
- Avertit lorsque `gateway.auth.mode="none"` laisse les API HTTP du Gateway accessibles sans secret partagé (`/tools/invoke` ainsi que tout point de terminaison `/v1/*` activé).

**Plugins/canaux**

- Avertit lorsque les enregistrements d’installation de plugins/hooks basés sur npm ne sont pas épinglés, ne contiennent pas de métadonnées d’intégrité ou divergent des versions des paquets actuellement installés.
- Avertit lorsque les listes d’autorisation des canaux reposent sur des noms/adresses e-mail/étiquettes modifiables plutôt que sur des identifiants stables (pour les portées Discord, Slack, Google Chat, Microsoft Teams, Mattermost et IRC, le cas échéant).

Les paramètres préfixés par `dangerous`/`dangerously` sont des dérogations explicites de dernier recours destinées aux opérateurs ; l’activation de l’un d’eux ne constitue pas, à elle seule, un signalement de vulnérabilité de sécurité. Pour l’inventaire complet des paramètres dangereux, consultez « Résumé des indicateurs non sécurisés ou dangereux » dans [Sécurité](/fr/gateway/security).

## Comportement de SecretRef

`security audit` résout les SecretRefs pris en charge en mode lecture seule pour les chemins ciblés. Si une SecretRef n’est pas disponible dans le chemin de commande actuel, l’audit se poursuit et signale `secretDiagnostics` au lieu de s’arrêter brutalement. `--token` et `--password` remplacent uniquement l’authentification de la vérification approfondie pour cette invocation de commande ; ils ne réécrivent ni la configuration ni les mappages SecretRef.

## Suppressions

Acceptez les constats persistants intentionnels avec `security.audit.suppressions`. Chaque suppression correspond à un `checkId` exact et peut être restreinte avec les sous-chaînes `titleIncludes` et/ou `detailIncludes`, sans distinction entre majuscules et minuscules :

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

Les constats supprimés sont retirés du `summary` actif et de la liste `findings`. La sortie JSON les conserve sous `suppressedFindings` à des fins d’auditabilité. Lorsque des suppressions sont configurées, la sortie active conserve également un constat informatif `security.audit.suppressions.active` non supprimable afin que les lecteurs puissent savoir que l’audit a été filtré. Les indicateurs de configuration dangereux donnent lieu à un constat par indicateur, de sorte que l’acceptation d’un indicateur dangereux ne masque pas les autres indicateurs activés qui partagent le même checkId `config.insecure_or_dangerous_flags`.

Comme les suppressions peuvent masquer un risque persistant, leur ajout ou leur suppression au moyen de commandes shell exécutées par un agent nécessite une approbation d’exécution, sauf si l’exécution utilise déjà `security="full"` et `ask="off"` pour une automatisation locale fiable.

## Sortie JSON

```bash
openclaw security audit --json | jq '.summary'
openclaw security audit --deep --json | jq '.findings[] | select(.severity=="critical") | .checkId'
```

Avec `--fix --json`, la sortie inclut à la fois les actions correctives et le rapport final :

```bash
openclaw security audit --fix --json | jq '{fix: .fix.ok, summary: .report.summary}'
```

## Ce que modifie `--fix`

Applique des corrections sûres et déterministes :

- remplace les valeurs courantes `groupPolicy="open"` par `groupPolicy="allowlist"` (y compris les variantes de compte dans les canaux pris en charge)
- lorsque la politique de groupe WhatsApp passe à `allowlist`, initialise `groupAllowFrom` à partir du fichier `allowFrom` enregistré si cette liste existe et que la configuration ne définit pas déjà `allowFrom`
- fait passer `logging.redactSensitive` de `"off"` à `"tools"`
- renforce les autorisations pour l’état, la configuration et les fichiers sensibles courants (`credentials/*.json`, `auth-profiles.json`, `openclaw-agent.sqlite` et les anciens artefacts de session)
- renforce également les autorisations des fichiers de configuration inclus référencés depuis `openclaw.json`
- utilise `chmod` sur les hôtes POSIX et réinitialise les autorisations avec `icacls` sous Windows

`--fix` ne permet **pas** de :

- renouveler les jetons, mots de passe ou clés d’API
- désactiver les outils (`gateway`, `cron`, `exec`, etc.)
- modifier les choix d’adresse d’écoute, d’authentification ou d’exposition réseau du Gateway
- supprimer ou réécrire les plugins ou Skills

## Voir aussi

- [Référence de la CLI](/fr/cli)
- [Audit de sécurité](/fr/gateway/security)
