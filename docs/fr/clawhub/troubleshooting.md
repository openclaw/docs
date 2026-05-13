---
read_when:
    - Les commandes CLI ClawHub ou du registre OpenClaw échouent
    - Un paquet ne peut pas être installé, publié ou mis à jour
summary: Résolution des problèmes de connexion, d’installation, de publication, de synchronisation, de mise à jour et d’API de ClawHub.
x-i18n:
    generated_at: "2026-05-13T04:18:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3e23936085ebc5422d71df8a9feffbbe56ce562de8d203462d712cc58f88a0ed
    source_path: clawhub/troubleshooting.md
    workflow: 16
---

# Dépannage

## `clawhub login` ouvre un navigateur mais ne se termine jamais

La CLI démarre un serveur de rappel local de courte durée pendant la connexion via navigateur.

- Assurez-vous que votre navigateur peut atteindre `http://127.0.0.1:<port>/callback`.
- Vérifiez les règles du pare-feu local, du VPN et du proxy si le rappel n’arrive jamais.
- Dans les environnements sans interface graphique, créez un jeton d’API dans l’interface web de ClawHub et exécutez :

```bash
clawhub login --token clh_...
```

## `whoami` ou `publish` renvoie `Unauthorized` (401)

- Reconnectez-vous avec `clawhub login`.
- Si vous utilisez un chemin de configuration personnalisé, confirmez que `CLAWHUB_CONFIG_PATH` pointe vers le
  fichier qui contient votre jeton actuel.
- Si vous utilisez un jeton d’API, confirmez qu’il n’a pas été révoqué dans l’interface web.

## La recherche ou l’installation renvoie `Rate limit exceeded` (429)

Lisez les informations de nouvelle tentative dans la réponse :

- `Retry-After` : secondes à attendre avant de réessayer.
- `RateLimit-Remaining` et `RateLimit-Limit` : votre budget actuel.
- `RateLimit-Reset` ou `X-RateLimit-Reset` : moment de réinitialisation.

Si de nombreux utilisateurs partagent une même adresse IP de sortie, les limites d’IP anonymes peuvent être atteintes même si chaque
personne n’envoie que quelques requêtes. Connectez-vous lorsque c’est possible et réessayez après le
délai indiqué.

## La recherche ou l’installation échoue derrière un proxy

La CLI respecte les variables de proxy standard :

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
clawhub search "my query"
```

Les noms pris en charge incluent `HTTPS_PROXY`, `HTTP_PROXY`, `https_proxy` et
`http_proxy`.

## Une skill n’apparaît pas dans la recherche

- Vérifiez le slug exact ou la page du propriétaire si vous le connaissez.
- Confirmez que la version publiée est publique et qu’elle n’est pas retenue par l’analyse ou la modération.
- Si vous possédez la skill, connectez-vous et inspectez-la :

```bash
clawhub inspect <skill-slug>
```

Les diagnostics visibles par le propriétaire peuvent expliquer l’état d’analyse, de blocage d’importation ou de modération.

## La publication échoue car des métadonnées obligatoires sont manquantes

Pour les skills, vérifiez le frontmatter de `SKILL.md`. Les variables d’environnement et
outils requis doivent être déclarés afin que les utilisateurs et les scanners puissent comprendre le package.

Pour les plugins, vérifiez les métadonnées de compatibilité dans `package.json`. Les publications de plugins de code
nécessitent des champs de compatibilité OpenClaw tels que `openclaw.compat.pluginApi` et
`openclaw.build.openclawVersion`.

Prévisualisez d’abord la charge utile de publication :

```bash
clawhub package publish <source> --family code-plugin --dry-run
```

## La publication échoue avec une erreur de propriétaire GitHub ou de source

ClawHub utilise l’identité GitHub et l’attribution de source pour relier les packages à leurs
éditeurs.

- Assurez-vous d’être connecté avec le compte GitHub qui possède ou peut publier
  le package.
- Vérifiez que l’URL source est publique ou accessible à ClawHub.
- Pour les sources GitHub, utilisez `owner/repo`, `owner/repo@ref` ou une URL GitHub complète.

## `sync` indique qu’aucune skill n’a été trouvée

`sync` recherche les dossiers contenant `SKILL.md` ou `skill.md`.

Pointez-le vers les racines que vous souhaitez analyser :

```bash
clawhub sync --root /path/to/skills
```

Prévisualisez d’abord si vous ne savez pas ce qui sera publié :

```bash
clawhub sync --all --dry-run --no-input
```

## `update` refuse à cause de modifications locales

Les fichiers locaux ne correspondent à aucune version connue de ClawHub. Choisissez une option :

- Conserver les modifications locales et ignorer la mise à jour.
- Remplacer par la version publiée :

```bash
clawhub update <slug> --force
```

- Publier votre copie modifiée sous forme de nouveau slug ou de fork.

## L’installation d’un plugin échoue dans OpenClaw

- Utilisez une source ClawHub explicite :

```bash
openclaw plugins install clawhub:<package>
```

- Vérifiez la page de détail du package pour connaître l’état de l’analyse et les métadonnées de compatibilité.
- Confirmez que votre version d’OpenClaw satisfait la plage de compatibilité
  annoncée du package.
- Si le package est masqué, retenu ou bloqué, il peut ne pas être installable tant que
  le propriétaire n’a pas résolu le problème.

## Les requêtes à l’API publique échouent

- Respectez les en-têtes de nouvelle tentative `429` et mettez en cache les réponses de liste/recherche publiques.
- Renvoyez les utilisateurs vers la fiche ClawHub canonique.
- Ne reproduisez pas de contenu masqué, privé, retenu ou bloqué par la modération en dehors de la
  surface de l’API publique.

Consultez [API HTTP](/fr/clawhub/http-api) pour les détails des points de terminaison.
