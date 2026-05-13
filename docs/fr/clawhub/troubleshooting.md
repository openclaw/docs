---
read_when:
    - La CLI ClawHub ou les commandes du registre OpenClaw échouent
    - Impossible d’installer, de publier ou de mettre à jour un paquet
summary: Résolution des problèmes de connexion à ClawHub, d’installation, de publication, de synchronisation, de mise à jour et d’API.
x-i18n:
    generated_at: "2026-05-13T05:33:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3e23936085ebc5422d71df8a9feffbbe56ce562de8d203462d712cc58f88a0ed
    source_path: clawhub/troubleshooting.md
    workflow: 16
---

# Dépannage

## `clawhub login` ouvre un navigateur, mais ne se termine jamais

La CLI lance un serveur de rappel local de courte durée pendant la connexion via le navigateur.

- Assurez-vous que votre navigateur peut accéder à `http://127.0.0.1:<port>/callback`.
- Vérifiez les règles du pare-feu local, du VPN et du proxy si le rappel n'arrive jamais.
- Dans les environnements sans interface graphique, créez un jeton d'API dans l'interface web ClawHub et exécutez :

```bash
clawhub login --token clh_...
```

## `whoami` ou `publish` renvoie `Unauthorized` (401)

- Reconnectez-vous avec `clawhub login`.
- Si vous utilisez un chemin de configuration personnalisé, vérifiez que `CLAWHUB_CONFIG_PATH` pointe vers le
  fichier qui contient votre jeton actuel.
- Si vous utilisez un jeton d'API, vérifiez qu'il n'a pas été révoqué dans l'interface web.

## La recherche ou l'installation renvoie `Rate limit exceeded` (429)

Lisez les informations de nouvelle tentative dans la réponse :

- `Retry-After` : secondes à attendre avant de réessayer.
- `RateLimit-Remaining` et `RateLimit-Limit` : votre budget actuel.
- `RateLimit-Reset` ou `X-RateLimit-Reset` : moment de réinitialisation.

Si de nombreux utilisateurs partagent une même IP de sortie, les limites d'IP anonymes peuvent être atteintes même lorsque chaque
personne n'envoie que quelques requêtes. Connectez-vous lorsque c'est possible et réessayez après le
délai indiqué.

## La recherche ou l'installation échoue derrière un proxy

La CLI respecte les variables de proxy standard :

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
clawhub search "my query"
```

Les noms pris en charge incluent `HTTPS_PROXY`, `HTTP_PROXY`, `https_proxy` et
`http_proxy`.

## Une skill n'apparaît pas dans la recherche

- Vérifiez le slug exact ou la page du propriétaire si vous la connaissez.
- Vérifiez que la release est publique et qu'elle n'est pas retenue par l'analyse ou la modération.
- Si vous possédez la skill, connectez-vous et inspectez-la :

```bash
clawhub inspect <skill-slug>
```

Les diagnostics visibles par le propriétaire peuvent expliquer l'état de l'analyse, du blocage de téléversement ou de la modération.

## La publication échoue parce que des métadonnées requises sont manquantes

Pour les skills, vérifiez le frontmatter de `SKILL.md`. Les variables d'environnement et
outils requis doivent être déclarés afin que les utilisateurs et les analyseurs puissent comprendre le paquet.

Pour les plugins, vérifiez les métadonnées de compatibilité de `package.json`. Les publications de code-plugin
nécessitent des champs de compatibilité OpenClaw tels que `openclaw.compat.pluginApi` et
`openclaw.build.openclawVersion`.

Prévisualisez d'abord la charge utile de publication :

```bash
clawhub package publish <source> --family code-plugin --dry-run
```

## La publication échoue avec une erreur de propriétaire GitHub ou de source

ClawHub utilise l'identité GitHub et l'attribution de source pour relier les paquets à leurs
éditeurs.

- Assurez-vous d'être connecté avec le compte GitHub qui possède le paquet ou peut le publier.
- Vérifiez que l'URL source est publique ou accessible à ClawHub.
- Pour les sources GitHub, utilisez `owner/repo`, `owner/repo@ref` ou une URL GitHub complète.

## `sync` indique qu'aucune skill n'a été trouvée

`sync` recherche des dossiers contenant `SKILL.md` ou `skill.md`.

Faites-le pointer vers les racines que vous souhaitez analyser :

```bash
clawhub sync --root /path/to/skills
```

Prévisualisez d'abord si vous n'êtes pas sûr de ce qui sera publié :

```bash
clawhub sync --all --dry-run --no-input
```

## `update` refuse à cause de modifications locales

Les fichiers locaux ne correspondent à aucune version connue de ClawHub. Choisissez une option :

- Conserver les modifications locales et ignorer la mise à jour.
- Écraser avec la version publiée :

```bash
clawhub update <slug> --force
```

- Publier votre copie modifiée sous un nouveau slug ou un fork.

## L'installation d'un plugin échoue dans OpenClaw

- Utilisez une source ClawHub explicite :

```bash
openclaw plugins install clawhub:<package>
```

- Vérifiez la page de détail du paquet pour connaître l'état de l'analyse et les métadonnées de compatibilité.
- Vérifiez que votre version d'OpenClaw satisfait la plage de compatibilité
  annoncée du paquet.
- Si le paquet est masqué, retenu ou bloqué, il peut ne pas être installable tant que
  le propriétaire n'a pas résolu le problème.

## Les requêtes de l'API publique échouent

- Respectez les en-têtes de nouvelle tentative `429` et mettez en cache les réponses publiques de liste/recherche.
- Renvoyez les utilisateurs vers la fiche ClawHub canonique.
- Ne répliquez pas le contenu masqué, privé, retenu ou bloqué par la modération en dehors de la
  surface de l'API publique.

Consultez [API HTTP](/fr/clawhub/http-api) pour plus de détails sur les points de terminaison.
