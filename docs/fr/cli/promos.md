---
read_when:
    - Vous souhaitez essayer une offre promotionnelle gratuite de modèle proposée par ClawHub
    - Vous configurez un fournisseur par le biais d’une promotion plutôt que lors de l’intégration
summary: Référence de la CLI pour `openclaw promos` (répertorier et réclamer les offres promotionnelles de modèles)
title: Promotions
x-i18n:
    generated_at: "2026-07-12T02:32:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 779eab2e9500b7376fabf9accb333e83ff5f84b085d51b7d551b5507b1e73adb
    source_path: cli/promos.md
    workflow: 16
---

# `openclaw promos`

Découvrez et réclamez les offres promotionnelles de modèles publiées sur ClawHub. Réclamer une
promotion configure le fournisseur (authentification et Plugin, si nécessaire) et enregistre
les modèles de la promotion, sans relancer la configuration initiale ni modifier
votre modèle par défaut, sauf si vous le demandez.

Voir aussi :

- Modèle par défaut et solutions de repli : [Modèles](/fr/cli/models)
- Configuration de l’authentification du fournisseur : [Bien démarrer](/fr/start/getting-started)

## Commandes

```bash
openclaw promos list
openclaw promos claim <slug>
openclaw promos claim <slug> --api-key <key> --set-default
```

## `openclaw promos list`

Répertorie les promotions actuellement actives, avec leurs modèles, le modèle par défaut
suggéré, le temps restant et la commande exacte pour les réclamer. `--json` affiche la charge
utile brute.

## `openclaw promos claim <slug>`

Réclame une promotion active :

1. Récupère la promotion depuis ClawHub et vérifie qu’elle se trouve dans sa période de validité.
2. Valide le fournisseur de la promotion, le choix d’authentification et les paquets de Plugin déclarés
   par rapport à votre version installée d’OpenClaw. Les identifiants inconnus ou les incohérences de paquets sont
   refusés : une promotion ne peut jamais amener la CLI à exécuter quoi que ce soit qu’elle ne sache pas déjà
   faire.
3. Réutilise vos identifiants de fournisseur existants lorsque vous en disposez. Sinon, la commande
   vous guide dans le processus d’authentification habituel du fournisseur (en affichant d’abord l’URL d’inscription de la promotion
   permettant d’obtenir une clé gratuite). `--api-key <key>` effectue l’authentification par clé d’API sans
   invite, conformément aux options non interactives de `openclaw onboard` ; pour éviter de placer la
   clé sur la ligne de commande, exportez plutôt la variable d’environnement du fournisseur
   (par exemple `OPENROUTER_API_KEY`) : les identifiants présents dans l’environnement sont
   détectés automatiquement et aucune option n’est nécessaire.
4. Enregistre les modèles de la promotion avec leurs alias. Les alias existants ne sont
   jamais remplacés.
5. Propose de définir le modèle suggéré par la promotion comme modèle par défaut :
   `--set-default` ignore la question ; sinon, aucun de vos paramètres par défaut
   ne change.

Lorsque la période de la promotion prend fin, le fournisseur cesse de proposer les modèles gratuits ;
votre configuration et vos identifiants restent inchangés. Revenez à un autre modèle à tout moment avec
`openclaw models set <model>`.

## Découverte passive dans `models list`

`openclaw models list` affiche également les promotions sans que vous interrogiez ClawHub
directement :

- Les offres actives dont vous n’avez pas configuré les modèles apparaissent dans un groupe
  « Disponible via une promotion » sous le tableau, chacune accompagnée de sa commande de
  réclamation.
- Les modèles que vous avez enregistrés avec `promos claim` portent une étiquette `promo`, qui
  devient `promo ended` une fois la période de l’offre terminée.
- La première fois qu’une nouvelle offre est détectée, une notification unique renvoie vers
  `openclaw promos list`. Les offres que vous avez déjà répertoriées ou réclamées ne sont plus
  jamais annoncées.

Cette fonctionnalité lit une copie mise en cache localement du flux de promotions hébergé par ClawHub
(normalement actualisée une fois par jour au moyen d’une requête conditionnelle, ou plus tôt lorsque
l’instantané mis en cache expire ; les échecs d’actualisation sont ignorés silencieusement). L’actualisation
d’une copie obsolète attend au maximum 2,5 secondes et n’empêche jamais l’affichage de la liste. Les sorties
`--json` et `--plain` restent exploitables par une machine : elles ne contiennent aucune section ni notification
relative aux promotions. Une réclamation est toujours revalidée auprès de l’API ClawHub en direct ; une offre retirée
avant son terme est donc refusée même si elle apparaît encore dans une copie mise en cache.
