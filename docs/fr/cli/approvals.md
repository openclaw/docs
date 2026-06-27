---
read_when:
    - Vous souhaitez modifier les approbations d’exécution depuis la CLI
    - Vous devez gérer les listes d’autorisation sur les hôtes Gateway ou Node
summary: Référence CLI pour `openclaw approvals` et `openclaw exec-policy`
title: Approbations
x-i18n:
    generated_at: "2026-06-27T17:17:26Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e5521622ee48237d3cc9feaa54906d026dfb15da4c9b9b17655cd59b35cae19d
    source_path: cli/approvals.md
    workflow: 16
---

# `openclaw approvals`

Gérez les approbations d’exécution pour l’**hôte local**, l’**hôte Gateway** ou un **hôte Node**.
Par défaut, les commandes ciblent le fichier local d’approbations sur le disque. Utilisez `--gateway` pour cibler le Gateway, ou `--node` pour cibler un Node spécifique.

Alias : `openclaw exec-approvals`

Connexe :

- Approbations d’exécution : [Approbations d’exécution](/fr/tools/exec-approvals)
- Nœuds : [Nœuds](/fr/nodes)

## `openclaw exec-policy`

`openclaw exec-policy` est la commande locale pratique pour maintenir la configuration
`tools.exec.*` demandée et le fichier d’approbations de l’hôte local alignés en une seule étape.

Utilisez-la lorsque vous voulez :

- inspecter la politique locale demandée, le fichier d’approbations de l’hôte et la fusion effective
- appliquer un préréglage local comme YOLO ou refus global
- synchroniser `tools.exec.*` local et le fichier d’approbations de l’hôte local

Exemples :

```bash
openclaw exec-policy show
openclaw exec-policy show --json

openclaw exec-policy preset yolo
openclaw exec-policy preset cautious --json

openclaw exec-policy set --host gateway --security full --ask off --ask-fallback full
```

Modes de sortie :

- sans `--json` : affiche la vue en tableau lisible par l’humain
- `--json` : affiche une sortie structurée lisible par machine

Portée actuelle :

- `exec-policy` est **uniquement local**
- elle met à jour ensemble le fichier de configuration local et le fichier d’approbations local
- elle ne pousse **pas** la politique vers l’hôte Gateway ni vers un hôte Node
- `--host node` est rejeté dans cette commande, car les approbations d’exécution Node sont récupérées depuis le Node à l’exécution et doivent plutôt être gérées au moyen de commandes d’approbations ciblant le Node
- `openclaw exec-policy show` marque les portées `host=node` comme gérées par le Node à l’exécution au lieu de dériver une politique effective depuis le fichier local d’approbations

Si vous devez modifier directement les approbations d’hôtes distants, continuez à utiliser `openclaw approvals set --gateway`
ou `openclaw approvals set --node <id|name|ip>`.

## Commandes courantes

```bash
openclaw approvals get
openclaw approvals get --node <id|name|ip>
openclaw approvals get --gateway
```

`openclaw approvals get` affiche désormais la politique d’exécution effective pour les cibles locales, Gateway et Node :

- politique `tools.exec` demandée
- politique du fichier d’approbations de l’hôte
- résultat effectif après application des règles de priorité

La priorité est intentionnelle :

- le fichier d’approbations de l’hôte est la source de vérité applicable
- la politique `tools.exec` demandée peut restreindre ou élargir l’intention, mais le résultat effectif est toujours dérivé des règles de l’hôte
- `--node` combine le fichier d’approbations de l’hôte Node avec la politique `tools.exec` du Gateway, car les deux s’appliquent encore à l’exécution
- si la configuration du Gateway est indisponible, la CLI se rabat sur l’instantané des approbations Node et indique que la politique finale à l’exécution n’a pas pu être calculée

## Remplacer les approbations depuis un fichier

```bash
openclaw approvals set --file ./exec-approvals.json
openclaw approvals set --stdin <<'EOF'
{ version: 1, defaults: { security: "full", ask: "off", askFallback: "full" } }
EOF
openclaw approvals set --node <id|name|ip> --file ./exec-approvals.json
openclaw approvals set --gateway --file ./exec-approvals.json
```

`set` accepte JSON5, pas seulement JSON strict. Utilisez soit `--file`, soit `--stdin`, mais pas les deux.

## Exemple « Ne jamais demander » / YOLO

Pour un hôte qui ne doit jamais s’arrêter sur les approbations d’exécution, définissez les valeurs par défaut des approbations de l’hôte sur `full` + `off` :

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

Cela modifie uniquement le **fichier d’approbations de l’hôte**. Pour conserver la politique OpenClaw demandée alignée, définissez aussi :

```bash
openclaw config set tools.exec.host gateway
openclaw config set tools.exec.security full
openclaw config set tools.exec.ask off
```

Pourquoi `tools.exec.host=gateway` dans cet exemple :

- `host=auto` signifie toujours « bac à sable lorsque disponible, sinon Gateway ».
- YOLO concerne les approbations, pas le routage.
- Si vous voulez l’exécution sur l’hôte même lorsqu’un bac à sable est configuré, rendez le choix de l’hôte explicite avec `gateway` ou `/exec host=gateway`.

`askFallback` omis vaut par défaut `deny`. Définissez explicitement `askFallback: "full"`
lors de la mise à niveau d’un hôte sans interface utilisateur qui doit conserver le comportement sans demande.

Raccourci local :

```bash
openclaw exec-policy preset yolo
```

Ce raccourci local met à jour ensemble la configuration locale `tools.exec.*` demandée et les
valeurs par défaut des approbations locales. Son intention est équivalente à la configuration
manuelle en deux étapes ci-dessus, mais seulement pour la machine locale.

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

Notes de ciblage :

- aucune option de cible signifie le fichier local d’approbations sur le disque
- `--gateway` cible le fichier d’approbations de l’hôte Gateway
- `--node` cible un hôte Node après résolution de l’id, du nom, de l’IP ou du préfixe d’id

`allowlist add|remove` prend aussi en charge :

- `--agent <id>` (par défaut `*`)

## Notes

- `--node` utilise le même résolveur que `openclaw nodes` (id, nom, ip ou préfixe d’id).
- `--agent` vaut par défaut `"*"`, ce qui s’applique à tous les agents.
- L’hôte Node doit annoncer `system.execApprovals.get/set` (app macOS ou hôte Node sans interface).
- Les fichiers d’approbations sont stockés par hôte dans le répertoire d’état OpenClaw
  (`$OPENCLAW_STATE_DIR/exec-approvals.json`, ou
  `~/.openclaw/exec-approvals.json` lorsque la variable n’est pas définie).

## Connexe

- [Référence CLI](/fr/cli)
- [Approbations d’exécution](/fr/tools/exec-approvals)
