---
read_when:
    - Vous souhaitez modifier les approbations d’exécution depuis la CLI
    - Vous devez gérer les listes d’autorisation sur les hôtes du Gateway ou des Nodes
summary: Référence de la CLI pour `openclaw approvals` et `openclaw exec-policy`
title: Approbations
x-i18n:
    generated_at: "2026-07-12T02:25:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f5b045a4dee3726a7df2368b704a00464dc9e575bf77747103e34ebdfe0aa2df
    source_path: cli/approvals.md
    workflow: 16
---

# `openclaw approvals`

Gérez les autorisations d’exécution pour **l’hôte local**, **l’hôte du Gateway** ou **un hôte Node**. Sans option de cible, les commandes lisent et écrivent le fichier local des autorisations sur le disque. Utilisez `--gateway` pour cibler le Gateway ou `--node <id|name|ip>` pour cibler un Node précis.

Alias : `openclaw exec-approvals`

Voir aussi : [Autorisations d’exécution](/fr/tools/exec-approvals), [Nodes](/fr/nodes)

## `openclaw exec-policy`

`openclaw exec-policy` est la commande pratique **strictement locale** qui synchronise en une seule étape la configuration `tools.exec.*` demandée et le fichier local des autorisations de l’hôte :

```bash
openclaw exec-policy show
openclaw exec-policy show --json

openclaw exec-policy preset yolo
openclaw exec-policy preset cautious --json

openclaw exec-policy set --host gateway --security full --ask off --ask-fallback full
```

Les préréglages (`yolo`, `cautious`, `deny-all`) appliquent conjointement `host`, `security`, `ask` et `askFallback`. `set` applique uniquement les options que vous transmettez ; chaque valeur acceptée est validée (`--host auto|sandbox|gateway|node`, `--security deny|allowlist|full`, `--ask off|on-miss|always`, `--ask-fallback deny|allowlist|full`).

Portée :

- Met à jour conjointement le fichier de configuration local et le fichier local des autorisations ; ne transmet pas la politique au Gateway ni à un hôte Node.
- `--host node` est refusé : les autorisations d’exécution du Node sont récupérées auprès de celui-ci pendant l’exécution ; la commande locale `exec-policy` ne peut donc pas les synchroniser. Utilisez plutôt `openclaw approvals set --node <id|name|ip>`.
- `exec-policy show` indique que les portées `host=node` sont gérées par le Node pendant l’exécution, au lieu de déduire une politique effective à partir du fichier local des autorisations.

Pour les autorisations d’un hôte distant, utilisez directement `openclaw approvals set --gateway` ou `openclaw approvals set --node <id|name|ip>`.

## Commandes courantes

```bash
openclaw approvals get
openclaw approvals get --node <id|name|ip>
openclaw approvals get --gateway
```

`get` affiche la politique d’exécution effective pour la cible : la politique `tools.exec` demandée, la politique du fichier d’autorisations de l’hôte et le résultat effectif fusionné. Les Nodes dotés d’une politique native de l’hôte, comme l’application compagnon Windows, affichent directement cette politique au lieu d’appliquer les règles de combinaison de la politique du fichier d’autorisations d’OpenClaw.

Pour les Nodes utilisant un fichier, la vue fusionnée nécessite un instantané de politique résolu par l’hôte. Pour les anciens Nodes, la politique effective est indiquée comme indisponible au lieu de supposer que la politique demandée par le Gateway s’applique également à l’hôte.

<Note>
Les substitutions `/exec` propres à chaque session ne sont pas incluses. Exécutez `/exec` dans la session concernée pour consulter ses valeurs par défaut actuelles.
</Note>

Ordre de priorité :

- Le fichier d’autorisations de l’hôte constitue la source de vérité applicable.
- La politique `tools.exec` demandée peut restreindre ou élargir l’intention, mais le résultat effectif est dérivé des règles de l’hôte.
- `--node` combine le fichier d’autorisations de l’hôte Node avec la politique `tools.exec` du Gateway (les deux s’appliquent pendant l’exécution).
- Si la configuration du Gateway est indisponible, la CLI utilise l’instantané des autorisations du Node comme solution de repli et indique que la politique d’exécution finale n’a pas pu être calculée.

## Remplacer les autorisations à partir d’un fichier

```bash
openclaw approvals set --file ./exec-approvals.json
openclaw approvals set --stdin <<'EOF'
{ version: 1, defaults: { security: "full", ask: "off", askFallback: "full" } }
EOF
openclaw approvals set --node <id|name|ip> --file ./exec-approvals.json
openclaw approvals set --gateway --file ./exec-approvals.json
```

`set` accepte le format JSON5, et pas uniquement le format JSON strict. Utilisez soit `--file`, soit `--stdin`, mais pas les deux.

Les Nodes Windows dotés d’une politique native de l’hôte utilisent leur propre structure de politique :

```bash
openclaw approvals set --node <id|name|ip> --stdin <<'EOF'
{
  defaultAction: "deny",
  rules: [{ pattern: "hostname", action: "allow" }]
}
EOF
```

La CLI lit d’abord le hachage actuel du Node et l’envoie avec la mise à jour, de sorte que les modifications locales simultanées soient refusées au lieu d’être écrasées. `rules` est obligatoire, car cette opération remplace la liste complète des règles du Node ; `defaultAction` est facultatif. Un Node qui signale que sa politique native est désactivée ne peut pas être configuré à distance ; activez ou configurez d’abord la politique sur cet hôte. Les politiques natives de l’hôte ne prennent pas en charge les assistants `allowlist add|remove`.

## Exemple « Ne jamais demander » / YOLO

Définissez les valeurs par défaut des autorisations de l’hôte sur `full` + `off` pour un hôte qui ne doit jamais s’interrompre afin de demander une autorisation d’exécution :

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

Pour les Nodes qui exposent un fichier d’autorisations OpenClaw, utilisez le même contenu avec `openclaw approvals set --node <id|name|ip> --stdin`. Les Nodes dotés d’une politique native de l’hôte nécessitent la structure propre à leur propriétaire présentée ci-dessus.

Cette opération modifie uniquement le **fichier d’autorisations de l’hôte**. Pour que la politique OpenClaw demandée reste alignée, définissez également :

```bash
openclaw config set tools.exec.host gateway
openclaw config set tools.exec.security full
openclaw config set tools.exec.ask off
```

`tools.exec.host=gateway` est indiqué explicitement ici, car `host=auto` signifie toujours « bac à sable lorsqu’il est disponible, sinon Gateway » : YOLO concerne les autorisations, pas le routage. Utilisez `gateway` (ou `/exec host=gateway`) lorsque vous souhaitez exécuter des commandes sur l’hôte, même si un bac à sable est configuré.

La valeur par défaut de `askFallback`, lorsqu’elle est omise, est `deny`. Définissez explicitement `askFallback: "full"` lors de la mise à niveau d’un hôte sans interface utilisateur qui doit conserver le comportement sans demande de confirmation.

Raccourci local produisant le même résultat, uniquement sur la machine locale :

```bash
openclaw exec-policy preset yolo
```

## Assistants de liste d’autorisation

```bash
openclaw approvals allowlist add "~/Projects/**/bin/rg"
openclaw approvals allowlist add --agent main --node <id|name|ip> "/usr/bin/uptime"
openclaw approvals allowlist add --agent "*" "/usr/bin/uname"

openclaw approvals allowlist remove "~/Projects/**/bin/rg"
```

## Options courantes

`get`, `set` et `allowlist add|remove` prennent tous en charge :

- `--node <id|name|ip>` (résout un identifiant, un nom, une adresse IP ou un préfixe d’identifiant ; utilise le même mécanisme de résolution que `openclaw nodes`)
- `--gateway`
- les options RPC communes des Nodes : `--url`, `--token`, `--timeout`, `--json`

L’absence d’option de cible désigne le fichier local des autorisations sur le disque.

`allowlist add|remove` prend également en charge `--agent <id>` (valeur par défaut : `"*"`, ce qui applique l’opération à tous les agents).

## Remarques

- L’hôte Node doit annoncer la prise en charge de `system.execApprovals.get/set` (application macOS, hôte Node sans interface graphique ou application compagnon Windows).
- Les fichiers d’autorisations sont stockés séparément sur chaque hôte dans le répertoire d’état d’OpenClaw : `$OPENCLAW_STATE_DIR/exec-approvals.json`, ou `~/.openclaw/exec-approvals.json` lorsque la variable n’est pas définie.

## Voir aussi

- [Référence de la CLI](/fr/cli)
- [Autorisations d’exécution](/fr/tools/exec-approvals)
