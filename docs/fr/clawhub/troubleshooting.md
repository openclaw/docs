---
read_when:
    - Les commandes CLI de ClawHub ou du registre OpenClaw échouent
    - Un package ne peut pas être installé, publié ou mis à jour
summary: Dépannage des problèmes de connexion, d’installation, de publication, de mise à jour et d’API de ClawHub.
x-i18n:
    generated_at: "2026-07-04T03:44:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fc789fcc891cf8c44b5d1a10d38a4e6dd4dec9474d8d13f8058ea1c3392a9f91
    source_path: clawhub/troubleshooting.md
    workflow: 16
---

# Dépannage

## `clawhub login` ouvre un navigateur mais ne se termine jamais

La CLI démarre un serveur de rappel local de courte durée pendant la connexion via le navigateur.

- Assurez-vous que votre navigateur peut accéder à `http://127.0.0.1:<port>/callback`.
- Vérifiez les règles du pare-feu local, du VPN et du proxy si le rappel n’arrive jamais.
- Dans les environnements sans interface graphique, créez un jeton d’API dans l’interface web ClawHub et exécutez :

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

- `Retry-After` : nombre de secondes à attendre avant de réessayer.
- `RateLimit-Limit` : la limite appliquée à cette requête.
- `RateLimit-Remaining` : votre budget restant exact lorsque l’en-tête est présent. Sur `429`, il vaut `0`.
- `RateLimit-Reset` ou `X-RateLimit-Reset` : moment de réinitialisation.

Si de nombreux utilisateurs partagent une même IP de sortie, les limites d’IP anonymes peuvent être atteintes même lorsque chaque
personne n’envoie que quelques requêtes. Connectez-vous lorsque c’est possible et réessayez après le délai
indiqué.

## La recherche ou l’installation échoue derrière un proxy

La CLI respecte les variables de proxy standard :

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
clawhub search "my query"
```

Les noms pris en charge incluent `HTTPS_PROXY`, `HTTP_PROXY`, `https_proxy` et
`http_proxy`.

## Un skill n’apparaît pas dans la recherche

- Vérifiez le slug exact ou la page du propriétaire si vous les connaissez.
- Confirmez que la version est publique et qu’elle n’est pas retenue par l’analyse ou la modération.
- Si vous possédez le skill, connectez-vous et inspectez-le :

```bash
clawhub inspect @openclaw/demo
```

Les diagnostics visibles par le propriétaire peuvent expliquer l’état de l’analyse, du blocage d’envoi ou de la modération.

## La publication échoue parce que des métadonnées requises sont manquantes

Pour les skills, vérifiez le frontmatter de `SKILL.md`. Les variables d’environnement et
outils requis doivent être déclarés afin que les utilisateurs et les analyseurs puissent comprendre le package.

Pour les plugins, vérifiez les métadonnées de compatibilité de `package.json`. Les publications de plugins de code
nécessitent des champs de compatibilité OpenClaw tels que `openclaw.compat.pluginApi` et
`openclaw.build.openclawVersion`.

Prévisualisez d’abord la charge utile de publication :

```bash
clawhub package publish <source> --family code-plugin --dry-run
```

## La publication échoue avec une erreur de propriétaire GitHub ou de source

ClawHub utilise l’identité GitHub et l’attribution de source pour relier les packages à leurs
éditeurs.

- Assurez-vous d’être connecté avec le compte GitHub qui possède le package ou peut le publier.
- Vérifiez que l’URL source est publique ou accessible à ClawHub.
- Pour les sources GitHub, utilisez `owner/repo`, `owner/repo@ref` ou une URL GitHub complète.

## La publication échoue parce qu’un espace de noms est revendiqué ou réservé

Si une publication échoue parce que l’identifiant du propriétaire, l’espace de noms de l’organisation, la portée du package, le slug du skill
ou le nom du package est déjà revendiqué ou réservé, confirmez d’abord que vous
publiez avec le propriétaire correspondant à l’espace de noms. Pour les packages de plugins,
les noms délimités comme `@example-org/example-plugin` doivent être publiés sous le
propriétaire `example-org` correspondant.

Si vous pensez que votre organisation, projet ou marque est le propriétaire légitime de l’espace de noms mais
que vous ne pouvez pas gérer le propriétaire ClawHub actuel, ouvrez une
[issue de revendication d’organisation / d’espace de noms](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml)
avec des preuves publiques et non sensibles. Consultez
[Revendications d’organisation et d’espace de noms](/clawhub/namespace-claims) pour obtenir des conseils sur les preuves et savoir ce
qu’il faut exclure des issues publiques.

## `sync` indique qu’aucun skill n’a été trouvé

`sync` recherche les dossiers contenant `SKILL.md` ou `skill.md`.

Pointez-le vers les racines que vous voulez analyser :

```bash
clawhub sync --root /path/to/skills
```

Prévisualisez d’abord si vous ne savez pas exactement ce qui sera publié :

```bash
clawhub sync --all --dry-run --no-input
```

## `update` refuse à cause de modifications locales

Les fichiers locaux ne correspondent à aucune version connue de ClawHub. Choisissez une option :

- Conservez les modifications locales et ignorez la mise à jour.
- Remplacez-les par la version publiée :

```bash
clawhub update @openclaw/demo --force
```

- Publiez votre copie modifiée avec un nouveau slug ou comme fork.

## L’installation d’un plugin échoue dans OpenClaw

- Utilisez une source ClawHub explicite :

```bash
openclaw plugins install clawhub:<package>
```

- Vérifiez la page de détails du package pour connaître l’état de l’analyse et les métadonnées de compatibilité.
- Confirmez que votre version d’OpenClaw satisfait la plage de compatibilité
  annoncée par le package.
- Si le package est masqué, retenu ou bloqué, il peut ne pas être installable tant que
  le propriétaire n’a pas résolu le problème.

## Les requêtes d’API publiques échouent

- Respectez les en-têtes de nouvelle tentative `429` et mettez en cache les réponses publiques de liste/recherche.
- Renvoyez les utilisateurs vers la fiche ClawHub canonique.
- Ne dupliquez pas le contenu masqué, privé, retenu ou bloqué par la modération en dehors de la
  surface de l’API publique.

Consultez [API HTTP](/clawhub/http-api) pour plus de détails sur les endpoints.
