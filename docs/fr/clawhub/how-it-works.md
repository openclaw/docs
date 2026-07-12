---
read_when:
    - Comprendre les listes, les versions, les installations, la publication et la modération
summary: Fonctionnement des fiches, versions, installations, publications, analyses et mises à jour de ClawHub.
x-i18n:
    generated_at: "2026-07-12T02:39:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 747079343899e42d00f84b00c553447abe0b83f2c4f1c9cdbf54725e34779eaf
    source_path: clawhub/how-it-works.md
    workflow: 16
---

# Fonctionnement de ClawHub

ClawHub est la couche de registre des Skills et Plugins OpenClaw. Il offre aux utilisateurs un
espace pour découvrir des paquets, aux éditeurs un espace pour publier des versions et
fournit à OpenClaw suffisamment de métadonnées pour installer et mettre à jour ces paquets en toute sécurité.

## Enregistrements du registre

Chaque entrée publique est un enregistrement du registre comprenant :

- un propriétaire et un identifiant court ou un nom de paquet
- une ou plusieurs versions publiées
- des métadonnées, un résumé, des fichiers et l’attribution de la source
- des informations de journal des modifications et de balises telles que `latest`
- des indicateurs de téléchargement, d’installation et de favoris
- l’état de l’analyse de sécurité et de la modération

La page de l’entrée constitue l’emplacement de référence où les utilisateurs peuvent examiner ce qu’une Skill ou
un Plugin prétend faire avant de l’installer.

## Skills

Une Skill est un ensemble de textes versionné centré sur `SKILL.md`. Elle peut inclure
des fichiers complémentaires, des exemples, des modèles et des scripts.

ClawHub lit le frontmatter de `SKILL.md` pour connaître le nom de la Skill,
sa description, ses exigences, ses variables d’environnement et ses métadonnées. Des
métadonnées précises sont importantes, car elles aident les utilisateurs à décider s’ils doivent installer la Skill et
permettent aux analyses automatisées de détecter les divergences entre le comportement déclaré et celui observé.

Consultez [Format des Skills](/clawhub/skill-format).

## Plugins

Les Plugins sont des extensions OpenClaw empaquetées. ClawHub stocke les métadonnées des paquets,
les informations de compatibilité, les liens vers les sources, les artefacts et les enregistrements de versions.

Lorsqu’OpenClaw installe un Plugin depuis ClawHub, il vérifie les métadonnées de compatibilité
annoncées avant l’installation. Les enregistrements de paquets peuvent inclure la compatibilité de l’API,
la version minimale du Gateway, les hôtes cibles, les exigences d’environnement et les condensats
des artefacts.

Utilisez une source d’installation ClawHub explicite lorsque vous souhaitez que le registre soit la
source de référence :

```bash
openclaw plugins install clawhub:<package>
```

## Publication

La publication crée un nouvel enregistrement de version immuable. Les éditeurs utilisent la CLI `clawhub`
pour les opérations de registre authentifiées :

```bash
clawhub skill publish ./my-skill
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Utilisez les simulations pour prévisualiser la charge utile résolue avant son téléversement. Les pages publiques
présentent ensuite les métadonnées publiées, les fichiers, l’attribution de la source et l’état de l’analyse.

## Installations et mises à jour

Les commandes d’installation d’OpenClaw utilisent ClawHub comme source de paquets :

```bash
openclaw skills install @openclaw/demo
openclaw plugins install clawhub:<package>
```

OpenClaw enregistre les métadonnées de la source d’installation afin que les mises à jour puissent retrouver ultérieurement
le même paquet du registre. La CLI ClawHub prend également en charge les processus directs d’installation et
de mise à jour des Skills pour les utilisateurs qui souhaitent disposer de dossiers de Skills gérés par le registre en dehors d’un
espace de travail OpenClaw complet.

## État de sécurité

La publication sur ClawHub est ouverte, mais les versions restent soumises à des contrôles de téléversement,
à des vérifications automatisées, aux signalements des utilisateurs et aux interventions des modérateurs.

Les pages publiques affichent des résumés d’analyse lorsqu’ils sont disponibles. Le contenu mis en attente, masqué
ou bloqué peut disparaître des recherches publiques et des processus d’installation, tout en restant
visible par son propriétaire à des fins de diagnostic.

Consultez [Sécurité](/fr/clawhub/security), [Audits de sécurité](/clawhub/security-audits),
[Modération et sécurité des comptes](/fr/clawhub/moderation) et
[Utilisation acceptable](/clawhub/acceptable-usage).

## Accès à l’API

ClawHub expose des API publiques en lecture pour la découverte, la recherche, les détails des paquets et
les téléchargements. Les catalogues tiers peuvent utiliser ces API s’ils renvoient vers l’entrée
ClawHub de référence, respectent les limites de débit et évitent de laisser entendre qu’ils bénéficient d’une approbation.

Consultez [API publique](/clawhub/api) et [API HTTP](/clawhub/http-api).
