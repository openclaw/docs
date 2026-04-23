---
read_when:
    - Vous souhaitez modifier les approbations exec depuis la CLI
    - Vous devez gérer les listes d’autorisation sur des hôtes Gateway ou Node
summary: Référence CLI pour `openclaw approvals` et `openclaw exec-policy`
title: approbations
x-i18n:
    generated_at: "2026-04-23T07:00:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4e4e031df737e3bdde97ece81fe50eafbb4384557b40c6d52cf2395cf30721a3
    source_path: cli/approvals.md
    workflow: 15
---

# `openclaw approvals`

Gérez les approbations exec pour l’**hôte local**, l’**hôte Gateway** ou un **hôte Node**.
Par défaut, les commandes ciblent le fichier d’approbations local sur le disque. Utilisez `--gateway` pour cibler la Gateway, ou `--node` pour cibler un Node spécifique.

Alias : `openclaw exec-approvals`

Connexe :

- Approbations exec : [Approbations exec](/fr/tools/exec-approvals)
- Nodes : [Nodes](/fr/nodes)

## `openclaw exec-policy`

`openclaw exec-policy` est la commande pratique locale pour garder la configuration demandée
`tools.exec.*` et le fichier d’approbations de l’hôte local alignés en une seule étape.

Utilisez-la lorsque vous souhaitez :

- inspecter la politique locale demandée, le fichier d’approbations de l’hôte et la fusion effective
- appliquer un préréglage local tel que YOLO ou deny-all
- synchroniser `tools.exec.*` local et `~/.openclaw/exec-approvals.json` local

Exemples :

```bash
openclaw exec-policy show
openclaw exec-policy show --json

openclaw exec-policy preset yolo
openclaw exec-policy preset cautious --json

openclaw exec-policy set --host gateway --security full --ask off --ask-fallback full
```

Modes de sortie :

- sans `--json` : affiche la vue tabulaire lisible par un humain
- `--json` : affiche une sortie structurée lisible par machine

Portée actuelle :

- `exec-policy` est **local uniquement**
- il met à jour ensemble le fichier de configuration local et le fichier d’approbations local
- il ne **pousse pas** la politique vers l’hôte Gateway ou un hôte Node
- `--host node` est rejeté dans cette commande, car les approbations exec du Node sont récupérées depuis le Node à l’exécution et doivent plutôt être gérées via des commandes d’approbations ciblant le Node
- `openclaw exec-policy show` marque les portées `host=node` comme gérées par le Node à l’exécution au lieu de dériver une politique effective à partir du fichier d’approbations local

Si vous devez modifier directement les approbations d’hôte distant, continuez à utiliser `openclaw approvals set --gateway`
ou `openclaw approvals set --node <id|name|ip>`.

## Commandes courantes

```bash
openclaw approvals get
openclaw approvals get --node <id|name|ip>
openclaw approvals get --gateway
```

`openclaw approvals get` affiche désormais la politique exec effective pour les cibles locales, Gateway et Node :

- politique demandée `tools.exec`
- politique du fichier d’approbations de l’hôte
- résultat effectif après application des règles de priorité

La priorité est intentionnelle :

- le fichier d’approbations de l’hôte est la source de vérité applicable
- la politique demandée `tools.exec` peut restreindre ou élargir l’intention, mais le résultat effectif est toujours dérivé des règles de l’hôte
- `--node` combine le fichier d’approbations de l’hôte Node avec la politique `tools.exec` de la Gateway, car les deux s’appliquent toujours à l’exécution
- si la configuration de la Gateway n’est pas disponible, la CLI se replie sur l’instantané des approbations du Node et indique que la politique finale d’exécution n’a pas pu être calculée

## Remplacer les approbations à partir d’un fichier

```bash
openclaw approvals set --file ./exec-approvals.json
openclaw approvals set --stdin <<'EOF'
{ version: 1, defaults: { security: "full", ask: "off" } }
EOF
openclaw approvals set --node <id|name|ip> --file ./exec-approvals.json
openclaw approvals set --gateway --file ./exec-approvals.json
```

`set` accepte JSON5, pas seulement du JSON strict. Utilisez soit `--file`, soit `--stdin`, pas les deux.

## Exemple « Ne jamais demander » / YOLO

Pour un hôte qui ne doit jamais s’arrêter sur les approbations exec, définissez les valeurs par défaut des approbations d’hôte sur `full` + `off` :

```bash
openclaw approvals set --stdin <<'EOF'
{
  version: 1,
  defaults: {
    security: "full",
    ask: "off",
    askFallback: "full"
  }
}
EOF
```

Variante Node :

```bash
openclaw approvals set --node <id|name|ip> --stdin <<'EOF'
{
  version: 1,
  defaults: {
    security: "full",
    ask: "off",
    askFallback: "full"
  }
}
EOF
```

Cela modifie uniquement le **fichier d’approbations de l’hôte**. Pour garder la politique OpenClaw demandée alignée, définissez également :

```bash
openclaw config set tools.exec.host gateway
openclaw config set tools.exec.security full
openclaw config set tools.exec.ask off
```

Pourquoi `tools.exec.host=gateway` dans cet exemple :

- `host=auto` signifie toujours « sandbox si disponible, sinon Gateway ».
- YOLO concerne les approbations, pas le routage.
- Si vous voulez une exécution sur l’hôte même lorsqu’un sandbox est configuré, rendez le choix de l’hôte explicite avec `gateway` ou `/exec host=gateway`.

Cela correspond au comportement YOLO actuel par défaut pour l’hôte. Resserrez-le si vous souhaitez des approbations.

Raccourci local :

```bash
openclaw exec-policy preset yolo
```

Ce raccourci local met à jour à la fois la configuration locale demandée `tools.exec.*` et les
valeurs par défaut des approbations locales ensemble. Il est équivalent dans son intention à la configuration manuelle en deux étapes ci-dessus, mais uniquement pour la machine locale.

## Assistants de liste d’autorisation

```bash
openclaw approvals allowlist add "~/Projects/**/bin/rg"
openclaw approvals allowlist add --agent main --node <id|name|ip> "/usr/bin/uptime"
openclaw approvals allowlist add --agent "*" "/usr/bin/uname"

openclaw approvals allowlist remove "~/Projects/**/bin/rg"
```

## Options courantes

`get`, `set` et `allowlist add|remove` prennent tous en charge :

- `--node <id|name|ip>`
- `--gateway`
- options RPC Node partagées : `--url`, `--token`, `--timeout`, `--json`

Remarques sur le ciblage :

- sans indicateurs de cible, cela vise le fichier d’approbations local sur disque
- `--gateway` cible le fichier d’approbations de l’hôte Gateway
- `--node` cible un hôte Node après résolution de l’id, du nom, de l’IP ou du préfixe d’id

`allowlist add|remove` prend aussi en charge :

- `--agent <id>` (par défaut `*`)

## Remarques

- `--node` utilise le même résolveur que `openclaw nodes` (id, nom, ip ou préfixe d’id).
- `--agent` vaut par défaut `"*"`, ce qui s’applique à tous les agents.
- L’hôte Node doit annoncer `system.execApprovals.get/set` (application macOS ou hôte Node sans interface).
- Les fichiers d’approbations sont stockés par hôte dans `~/.openclaw/exec-approvals.json`.
