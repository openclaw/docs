---
read_when:
    - Les commandes ClawHub CLI ou du registre OpenClaw échouent
    - Un package ne peut pas être installé, publié ou mis à jour
summary: Résolution des problèmes de connexion, d’installation, de publication, de synchronisation, de mise à jour et d’API de ClawHub.
x-i18n:
    generated_at: "2026-05-12T12:50:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3e23936085ebc5422d71df8a9feffbbe56ce562de8d203462d712cc58f88a0ed
    source_path: clawhub/troubleshooting.md
    workflow: 16
---

# Dépannage

## `clawhub login` ouvre un navigateur mais ne se termine jamais

La CLI démarre un serveur de rappel local à courte durée de vie pendant la connexion via navigateur.

- Assurez-vous que votre navigateur peut atteindre `http://127.0.0.1:<port>/callback`.
- Vérifiez les règles du pare-feu local, du VPN et du proxy si le rappel n’arrive jamais.
- Dans les environnements sans interface graphique, créez un jeton d’API dans l’interface web ClawHub et exécutez :

```bash
clawhub login --token clh_...
```

## `whoami` ou `publish` renvoie `Unauthorized` (401)

- Connectez-vous à nouveau avec `clawhub login`.
- Si vous utilisez un chemin de configuration personnalisé, vérifiez que `CLAWHUB_CONFIG_PATH` pointe vers le
  fichier qui contient votre jeton actuel.
- Si vous utilisez un jeton d’API, vérifiez qu’il n’a pas été révoqué dans l’interface web.

## La recherche ou l’installation renvoie `Rate limit exceeded` (429)

Lisez les informations de nouvelle tentative dans la réponse :

- `Retry-After` : secondes à attendre avant de réessayer.
- `RateLimit-Remaining` et `RateLimit-Limit` : votre budget actuel.
- `RateLimit-Reset` ou `X-RateLimit-Reset` : moment de réinitialisation.

Si de nombreux utilisateurs partagent une même adresse IP de sortie, les limites IP anonymes peuvent être atteintes même lorsque chaque
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

- Vérifiez le slug exact ou la page du propriétaire si vous les connaissez.
- Vérifiez que la version est publique et n’est pas retenue par l’analyse ou la modération.
- Si vous possédez la skill, connectez-vous et inspectez-la :

```bash
clawhub inspect <skill-slug>
```

Les diagnostics visibles par le propriétaire peuvent expliquer l’état d’analyse, de blocage au téléversement ou de modération.

## La publication échoue parce que des métadonnées requises sont manquantes

Pour les skills, vérifiez le frontmatter de `SKILL.md`. Les variables d’environnement et
outils requis doivent être déclarés afin que les utilisateurs et les analyseurs puissent comprendre le paquet.

Pour les Plugins, vérifiez les métadonnées de compatibilité de `package.json`. Les publications de Plugins de code
nécessitent des champs de compatibilité OpenClaw tels que `openclaw.compat.pluginApi` et
`openclaw.build.openclawVersion`.

Prévisualisez d’abord la charge utile de publication :

```bash
clawhub package publish <source> --family code-plugin --dry-run
```

## La publication échoue avec une erreur de propriétaire GitHub ou de source

ClawHub utilise l’identité GitHub et l’attribution de source pour associer les paquets à leurs
éditeurs.

- Assurez-vous d’être connecté avec le compte GitHub qui possède ou peut publier
  le paquet.
- Vérifiez que l’URL source est publique ou accessible à ClawHub.
- Pour les sources GitHub, utilisez `owner/repo`, `owner/repo@ref` ou une URL GitHub complète.

## `sync` indique qu’aucune skill n’a été trouvée

`sync` recherche les dossiers contenant `SKILL.md` ou `skill.md`.

Faites-le pointer vers les racines que vous voulez analyser :

```bash
clawhub sync --root /path/to/skills
```

Prévisualisez d’abord si vous ne savez pas ce qui sera publié :

```bash
clawhub sync --all --dry-run --no-input
```

## `update` refuse à cause de modifications locales

Les fichiers locaux ne correspondent à aucune version connue par ClawHub. Choisissez une option :

- Conserver les modifications locales et ignorer la mise à jour.
- Remplacer par la version publiée :

```bash
clawhub update <slug> --force
```

- Publier votre copie modifiée sous un nouveau slug ou fork.

## L’installation d’un Plugin échoue dans OpenClaw

- Utilisez une source ClawHub explicite :

```bash
openclaw plugins install clawhub:<package>
```

- Vérifiez la page de détail du paquet pour l’état d’analyse et les métadonnées de compatibilité.
- Vérifiez que votre version d’OpenClaw satisfait la plage de compatibilité
  annoncée par le paquet.
- Si le paquet est masqué, retenu ou bloqué, il peut ne pas être installable tant que
  le propriétaire n’a pas résolu le problème.

## Les requêtes d’API publique échouent

- Respectez les en-têtes de nouvelle tentative `429` et mettez en cache les réponses publiques de liste/recherche.
- Redirigez les utilisateurs vers la fiche ClawHub canonique.
- Ne répliquez pas de contenu masqué, privé, retenu ou bloqué par la modération en dehors de la
  surface de l’API publique.

Consultez [API HTTP](/fr/clawhub/http-api) pour les détails des points de terminaison.
