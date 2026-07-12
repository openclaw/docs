---
read_when:
    - Échec de la CLI ClawHub ou des commandes de registre OpenClaw
    - Un package ne peut pas être installé, publié ni mis à jour.
summary: Résolution des problèmes de connexion, d’installation, de publication, de mise à jour et d’API de ClawHub.
x-i18n:
    generated_at: "2026-07-12T02:40:38Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fc789fcc891cf8c44b5d1a10d38a4e6dd4dec9474d8d13f8058ea1c3392a9f91
    source_path: clawhub/troubleshooting.md
    workflow: 16
---

# Dépannage

## `clawhub login` ouvre un navigateur, mais ne se termine jamais

La CLI démarre un serveur de rappel local de courte durée pendant la connexion via le navigateur.

- Assurez-vous que votre navigateur peut accéder à `http://127.0.0.1:<port>/callback`.
- Vérifiez les règles locales du pare-feu, du VPN et du proxy si le rappel n'arrive jamais.
- Dans les environnements sans interface graphique, créez un jeton d'API dans l'interface web de ClawHub, puis exécutez :

```bash
clawhub login --token clh_...
```

## `whoami` ou `publish` renvoie `Unauthorized` (401)

- Reconnectez-vous avec `clawhub login`.
- Si vous utilisez un chemin de configuration personnalisé, vérifiez que `CLAWHUB_CONFIG_PATH` pointe vers le
  fichier contenant votre jeton actuel.
- Si vous utilisez un jeton d'API, vérifiez qu'il n'a pas été révoqué dans l'interface web.

## La recherche ou l'installation renvoie `Rate limit exceeded` (429)

Consultez les informations de nouvelle tentative dans la réponse :

- `Retry-After` : nombre de secondes à attendre avant de réessayer.
- `RateLimit-Limit` : limite appliquée à cette requête.
- `RateLimit-Remaining` : votre quota restant exact lorsque l'en-tête est présent. En cas de réponse `429`, il vaut `0`.
- `RateLimit-Reset` ou `X-RateLimit-Reset` : moment de la réinitialisation.

Si de nombreux utilisateurs partagent une même adresse IP de sortie, les limites applicables aux adresses IP anonymes peuvent être atteintes même si chaque
personne n'envoie que quelques requêtes. Connectez-vous lorsque cela est possible et réessayez après le
délai indiqué.

## La recherche ou l'installation échoue derrière un proxy

La CLI respecte les variables de proxy standard :

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
clawhub search "my query"
```

Les noms pris en charge incluent `HTTPS_PROXY`, `HTTP_PROXY`, `https_proxy` et
`http_proxy`.

## Une Skills n'apparaît pas dans la recherche

- Vérifiez le slug exact ou la page du propriétaire si vous les connaissez.
- Vérifiez que la version est publique et qu'elle n'est pas retenue par une analyse ou la modération.
- Si vous êtes propriétaire de la Skills, connectez-vous et examinez-la :

```bash
clawhub inspect @openclaw/demo
```

Les diagnostics visibles par le propriétaire peuvent expliquer l'état de l'analyse, du contrôle de téléversement ou de la modération.

## La publication échoue, car des métadonnées requises sont absentes

Pour les Skills, vérifiez le frontmatter de `SKILL.md`. Les variables d'environnement et les
outils requis doivent être déclarés afin que les utilisateurs et les analyseurs puissent comprendre le paquet.

Pour les plugins, vérifiez les métadonnées de compatibilité dans `package.json`. La publication de plugins de code
nécessite des champs de compatibilité avec OpenClaw tels que `openclaw.compat.pluginApi` et
`openclaw.build.openclawVersion`.

Prévisualisez d'abord la charge utile de publication :

```bash
clawhub package publish <source> --family code-plugin --dry-run
```

## La publication échoue en raison d'une erreur liée au propriétaire ou à la source GitHub

ClawHub utilise l'identité GitHub et l'attribution de la source pour associer les paquets à leurs
éditeurs.

- Assurez-vous d'être connecté avec le compte GitHub qui possède le paquet ou qui est autorisé à le publier.
- Vérifiez que l'URL source est publique ou accessible à ClawHub.
- Pour les sources GitHub, utilisez `owner/repo`, `owner/repo@ref` ou une URL GitHub complète.

## La publication échoue, car un espace de noms est revendiqué ou réservé

Si une publication échoue parce que l'identifiant du propriétaire, l'espace de noms de l'organisation, la portée du paquet, le
slug de la Skills ou le nom du paquet est déjà revendiqué ou réservé, vérifiez d'abord que vous
publiez avec le propriétaire correspondant à l'espace de noms. Pour les paquets de plugins,
les noms avec portée tels que `@example-org/example-plugin` doivent être publiés sous le
propriétaire `example-org` correspondant.

Si vous estimez que votre organisation, votre projet ou votre marque est le propriétaire légitime de l'espace de noms, mais
que vous ne pouvez pas gérer le propriétaire ClawHub actuel, ouvrez un
[problème de revendication d'organisation ou d'espace de noms](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml)
avec des preuves publiques et non sensibles. Consultez
[Revendications d'organisations et d'espaces de noms](/clawhub/namespace-claims) pour savoir quelles preuves fournir et quels éléments
ne pas inclure dans les problèmes publics.

## `sync` indique qu'aucune Skills n'a été trouvée

`sync` recherche les dossiers contenant `SKILL.md` ou `skill.md`.

Indiquez-lui les racines que vous souhaitez analyser :

```bash
clawhub sync --root /path/to/skills
```

Commencez par une prévisualisation si vous ne savez pas exactement ce qui sera publié :

```bash
clawhub sync --all --dry-run --no-input
```

## `update` refuse de continuer en raison de modifications locales

Les fichiers locaux ne correspondent à aucune version connue de ClawHub. Choisissez une option :

- Conservez les modifications locales et ignorez la mise à jour.
- Remplacez-les par la version publiée :

```bash
clawhub update @openclaw/demo --force
```

- Publiez votre copie modifiée sous un nouveau slug ou comme fork.

## L'installation d'un Plugin échoue dans OpenClaw

- Utilisez une source ClawHub explicite :

```bash
openclaw plugins install clawhub:<package>
```

- Consultez la page détaillée du paquet pour connaître l'état de l'analyse et les métadonnées de compatibilité.
- Vérifiez que votre version d'OpenClaw satisfait la plage de compatibilité annoncée
  par le paquet.
- Si le paquet est masqué, retenu ou bloqué, il peut ne pas être installable tant que
  le propriétaire n'a pas résolu le problème.

## Les requêtes adressées à l'API publique échouent

- Respectez les en-têtes de nouvelle tentative `429` et mettez en cache les réponses publiques de liste et de recherche.
- Renvoyez les utilisateurs vers la fiche ClawHub canonique.
- Ne reproduisez pas le contenu masqué, privé, retenu ou bloqué par la modération en dehors de la
  surface de l'API publique.

Consultez [API HTTP](/clawhub/http-api) pour plus de détails sur les points de terminaison.
