---
read_when:
    - Choisir auto, ask, allowlist, full ou deny pour les autorisations de commande
    - Configuration des approbations examinées par Codex Guardian via tools.exec.mode
    - Comparaison des approbations d’exécution d’OpenClaw avec les autorisations du harnais ACPX
summary: Modes d’autorisation pour l’exécution sur l’hôte, les approbations de Codex Guardian et les sessions du harnais ACPX
title: Modes d’autorisation
x-i18n:
    generated_at: "2026-07-12T16:05:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: f580e66508c1f69e868ed26a62d88a675f86a4d1ca738650dc5af82e967f3ac3
    source_path: tools/permission-modes.md
    workflow: 16
---

Les modes d’autorisation déterminent le niveau d’autorité dont dispose un agent avant d’exécuter des commandes sur l’hôte, d’écrire des fichiers ou de demander un accès supplémentaire à un environnement d’exécution backend.

<Note>
  Le mode d’autorisation est distinct de `tools.exec.host=auto`. `tools.exec.host`
  détermine où une commande s’exécute. `tools.exec.mode` détermine comment
  l’exécution sur l’hôte est approuvée.
</Note>

## Valeur par défaut recommandée

Utilisez `auto` pour les agents de programmation qui ont besoin d’un accès utile à l’hôte sans que chaque commande non reconnue nécessite une intervention humaine :

```bash
openclaw config set tools.exec.mode auto
openclaw approvals get
openclaw gateway restart
```

Vérifiez ensuite la stratégie effective :

```bash
openclaw exec-policy show
```

## Modes d’exécution sur l’hôte d’OpenClaw

`tools.exec.mode` est l’interface de stratégie normalisée pour `exec` sur l’hôte. Chaque mode correspond à une paire sous-jacente composée de `security` (rigueur de la liste d’autorisation) et de `ask` (demande en cas d’absence de correspondance) :

| Mode        | security / ask          | Comportement                                                                                                             | À utiliser lorsque                                                      |
| ----------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------- |
| `deny`      | `deny` / `off`          | Bloque entièrement l’exécution sur l’hôte.                                                                               | Aucune commande sur l’hôte n’est autorisée.                             |
| `allowlist` | `allowlist` / `off`     | Exécute uniquement les commandes figurant dans la liste d’autorisation ; refuse silencieusement les autres.             | Vous disposez d’un ensemble de commandes dont la sûreté est établie.    |
| `ask`       | `allowlist` / `on-miss` | Exécute les commandes correspondant à la liste d’autorisation ; consulte un humain pour les autres.                     | Un humain doit examiner chaque nouvelle commande.                       |
| `auto`      | `allowlist` / `on-miss` | Exécute les commandes correspondant à la liste d’autorisation ; soumet les autres à un examen automatique avant de demander une approbation humaine. | Les sessions de programmation nécessitent un accès pratique et encadré. |
| `full`      | `full` / `off`          | Exécute les commandes sur l’hôte sans demander d’approbation.                                                            | Cet hôte ou cette session de confiance doit ignorer les contrôles d’approbation. |

`ask` et `auto` partagent les mêmes paramètres de liste d’autorisation et de demande ; `auto` active en plus l’examinateur automatique natif, qui décide lui-même pour les commandes non reconnues et ne les transmet à la procédure d’approbation humaine configurée que lorsqu’il ne peut pas les approuver en toute sécurité.

Pour obtenir la stratégie complète d’exécution sur l’hôte, le fichier d’approbations local, le schéma de la liste d’autorisation, les exécutables sûrs et le comportement de transfert, consultez [Approbations d’exécution](/fr/tools/exec-approvals).

## Correspondance avec Codex Guardian

Pour les sessions natives du serveur d’application Codex, `tools.exec.mode: "auto"` oriente Codex vers des approbations examinées par Guardian lorsque les exigences locales de Codex le permettent. Valeurs généralement obtenues :

| Champ Codex         | Valeur habituelle |
| ------------------- | ----------------- |
| `approvalPolicy`    | `on-request`      |
| `approvalsReviewer` | `auto_review`     |
| `sandbox`           | `workspace-write` |

Le mode `auto` impose cette stratégie à la place de toute dérogation configurée pour le bac à sable ou les approbations Codex ; il ne conserve donc pas les anciennes combinaisons non sûres telles que `approvalPolicy: "never"` avec `sandbox: "danger-full-access"`. `tools.exec.mode: "deny"` et `"allowlist"` bloquent entièrement l’exécution locale du serveur d’application Codex. Utilisez `tools.exec.mode: "full"` uniquement lorsque vous souhaitez délibérément un fonctionnement sans approbation.

Pour la configuration du serveur d’application, l’ordre d’authentification et les détails de l’environnement d’exécution natif de Codex, consultez [Environnement d’exécution Codex](/fr/plugins/codex-harness).

## Autorisations de l’environnement d’exécution ACPX

Les sessions ACPX ne sont pas interactives et ne peuvent donc pas répondre à une invite d’autorisation dans un TTY. ACPX utilise des paramètres distincts au niveau de l’environnement d’exécution sous `plugins.entries.acpx.config` :

| Paramètre                   | Valeurs         | Signification                                         |
| --------------------------- | --------------- | ----------------------------------------------------- |
| `permissionMode`            | `approve-reads` | Approuve automatiquement les lectures uniquement.     |
| `permissionMode`            | `approve-all`   | Approuve automatiquement les écritures et les commandes shell. |
| `permissionMode`            | `deny-all`      | Refuse toutes les demandes d’autorisation.             |
| `nonInteractivePermissions` | `fail`          | Abandonne lorsqu’une demande serait nécessaire.        |
| `nonInteractivePermissions` | `deny`          | Refuse la demande et continue lorsque cela est possible. |

Configurez les autorisations ACPX séparément des approbations d’exécution OpenClaw :

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
openclaw gateway restart
```

Utilisez `approve-all` comme équivalent ACPX d’urgence d’une session d’environnement d’exécution sans invite. Pour les détails de configuration et les modes d’échec, consultez [Configuration des agents ACP](/fr/tools/acp-agents-setup#permission-configuration).

## Choisir un mode

| Objectif                                                       | Configuration                                               |
| -------------------------------------------------------------- | ----------------------------------------------------------- |
| Bloquer complètement les commandes sur l’hôte                  | `tools.exec.mode: "deny"`                                   |
| Autoriser uniquement l’exécution des commandes réputées sûres  | `tools.exec.mode: "allowlist"`                              |
| Consulter un humain pour chaque nouvelle forme de commande     | `tools.exec.mode: "ask"`                                    |
| Utiliser l’examen automatique de Codex/OpenClaw avant l’humain | `tools.exec.mode: "auto"`                                   |
| Ignorer entièrement les approbations d’exécution sur l’hôte    | `tools.exec.mode: "full"` plus le fichier d’approbations de l’hôte correspondant |
| Autoriser les sessions ACPX non interactives à écrire/exécuter | `plugins.entries.acpx.config.permissionMode: "approve-all"` |

Si une commande déclenche toujours une demande ou échoue après le changement de mode, examinez les deux couches :

```bash
openclaw approvals get
openclaw exec-policy show
```

L’exécution sur l’hôte applique le résultat le plus strict entre la configuration OpenClaw et le fichier d’approbations local à l’hôte. Les autorisations de l’environnement d’exécution ACPX n’assouplissent pas les approbations d’exécution sur l’hôte, et celles-ci n’assouplissent pas les demandes d’autorisation de l’environnement d’exécution ACPX.

## Voir aussi

- [Approbations d’exécution](/fr/tools/exec-approvals)
- [Approbations d’exécution — avancé](/fr/tools/exec-approvals-advanced)
- [Environnement d’exécution Codex](/fr/plugins/codex-harness)
- [Configuration des agents ACP](/fr/tools/acp-agents-setup#permission-configuration)
