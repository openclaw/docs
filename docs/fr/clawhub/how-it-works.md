---
read_when:
    - Comprendre les listes, les versions, les installations, la publication et la modération
summary: Fonctionnement des fiches, versions, installations, publications, analyses et mises à jour de ClawHub.
x-i18n:
    generated_at: "2026-07-16T13:06:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 747079343899e42d00f84b00c553447abe0b83f2c4f1c9cdbf54725e34779eaf
    source_path: clawhub/how-it-works.md
    workflow: 16
---

# Fonctionnement de ClawHub

ClawHub est la couche de registre des Skills et des Plugins OpenClaw. Il offre aux utilisateurs un
espace pour découvrir des paquets, aux éditeurs un espace pour publier des versions et
fournit à OpenClaw suffisamment de métadonnées pour installer et mettre à jour ces paquets en toute sécurité.

## Enregistrements du registre

Chaque entrée publique est un enregistrement du registre comprenant :

- un propriétaire et un slug ou un nom de paquet
- une ou plusieurs versions publiées
- les métadonnées, le résumé, les fichiers et l’attribution de la source
- le journal des modifications et les informations de balise telles que `latest`
- les indicateurs de téléchargement, d’installation et d’ajout aux favoris
- l’état de l’analyse de sécurité et de la modération

La page de l’entrée est l’emplacement canonique où les utilisateurs peuvent examiner ce qu’une skill ou
un plugin prétend faire avant de l’installer.

## Skills

Une skill est un ensemble de fichiers texte versionné centré sur `SKILL.md`. Elle peut inclure
des fichiers complémentaires, des exemples, des modèles et des scripts.

ClawHub lit le frontmatter de `SKILL.md` pour déterminer le nom de la skill,
sa description, ses exigences, ses variables d’environnement et ses métadonnées. Des
métadonnées exactes sont importantes, car elles aident les utilisateurs à décider s’ils doivent installer la skill et
aident les analyses automatisées à détecter les incohérences entre le comportement déclaré et le comportement observé.

Consultez [Format des skills](/fr/clawhub/skill-format).

## Plugins

Les Plugins sont des extensions OpenClaw empaquetées. ClawHub stocke les métadonnées des paquets,
les informations de compatibilité, les liens vers les sources, les artefacts et les enregistrements de versions.

Lorsque OpenClaw installe un plugin depuis ClawHub, il vérifie les métadonnées de compatibilité
annoncées avant l’installation. Les enregistrements de paquets peuvent inclure la compatibilité de l’API,
la version minimale du Gateway, les hôtes cibles, les exigences d’environnement et les condensés
des artefacts.

Utilisez une source d’installation ClawHub explicite lorsque le registre doit être la
source de référence :

```bash
openclaw plugins install clawhub:<package>
```

## Publication

La publication crée un nouvel enregistrement de version immuable. Les éditeurs utilisent la CLI `clawhub`
pour les flux de travail authentifiés du registre :

```bash
clawhub skill publish ./my-skill
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Utilisez des simulations pour prévisualiser la charge utile résolue avant son téléversement. Les pages publiques
présentent ensuite les métadonnées publiées, les fichiers, l’attribution de la source et l’état de l’analyse.

## Installations et mises à jour

Les commandes d’installation d’OpenClaw utilisent ClawHub comme source de paquets :

```bash
openclaw skills install @openclaw/demo
openclaw plugins install clawhub:<package>
```

OpenClaw enregistre les métadonnées de la source d’installation afin que les mises à jour puissent retrouver ultérieurement
le même paquet du registre. La CLI ClawHub prend également en charge les flux d’installation et
de mise à jour directe des skills pour les utilisateurs qui souhaitent gérer par le registre des dossiers de skills en dehors d’un
espace de travail OpenClaw complet.

## État de sécurité

ClawHub est ouvert à la publication, mais les versions restent soumises à des contrôles lors du téléversement,
à des vérifications automatisées, aux signalements des utilisateurs et aux actions des modérateurs.

Les pages publiques affichent des résumés d’analyse lorsqu’ils sont disponibles. Le contenu retenu, masqué
ou bloqué peut disparaître des résultats de recherche publics et des flux d’installation, tout en restant
visible par son propriétaire à des fins de diagnostic.

Consultez [Sécurité](/clawhub/security), [Audits de sécurité](/clawhub/security-audits),
[Modération et sécurité des comptes](/fr/clawhub/moderation) et
[Utilisation acceptable](/clawhub/acceptable-usage).

## Accès à l’API

ClawHub expose des API publiques en lecture pour la découverte, la recherche, les détails des paquets et
les téléchargements. Les catalogues tiers peuvent utiliser ces API s’ils proposent un lien vers l’entrée
ClawHub canonique, respectent les limites de débit et évitent de laisser entendre qu’ils bénéficient d’une approbation.

Consultez [API publique](/clawhub/api) et [API HTTP](/clawhub/http-api).
