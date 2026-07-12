---
read_when:
    - Choisir auto, ask, allowlist, full ou deny pour les autorisations de commande
    - Configuration des approbations examinées par Codex Guardian via `tools.exec.mode`
    - Comparaison des approbations d’exécution d’OpenClaw avec les autorisations du harnais ACPX
summary: Modes d’autorisation pour l’exécution sur l’hôte, les approbations de Codex Guardian et les sessions du harnais ACPX
title: Modes d’autorisation
x-i18n:
    generated_at: "2026-07-12T03:10:29Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f580e66508c1f69e868ed26a62d88a675f86a4d1ca738650dc5af82e967f3ac3
    source_path: tools/permission-modes.md
    workflow: 16
---

Les modes d’autorisation déterminent le niveau d’autorité dont dispose un agent avant d’exécuter des commandes sur l’hôte, d’écrire des fichiers ou de demander un accès supplémentaire à un harnais d’exécution backend.

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

Vérifiez ensuite la politique effective :

```bash
openclaw exec-policy show
```

## Modes d’exécution sur l’hôte d’OpenClaw

`tools.exec.mode` est l’interface de politique normalisée pour l’`exec` sur l’hôte. Chaque mode correspond à une paire sous-jacente `security` (degré de rigueur de la liste d’autorisation) et `ask` (demande de confirmation en cas d’absence de correspondance) :

| Mode        | security / ask          | Comportement                                                                                                                         | À utiliser lorsque                                                       |
| ----------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------ |
| `deny`      | `deny` / `off`          | Bloque entièrement l’exécution sur l’hôte.                                                                                           | Aucune commande sur l’hôte n’est autorisée.                              |
| `allowlist` | `allowlist` / `off`     | Exécute uniquement les commandes figurant dans la liste d’autorisation ; refuse silencieusement les autres.                          | Vous disposez d’un ensemble de commandes dont la sûreté est établie.     |
| `ask`       | `allowlist` / `on-miss` | Exécute les commandes correspondant à la liste d’autorisation ; demande confirmation à une personne pour les autres.                 | Une personne doit examiner chaque nouvelle forme de commande.            |
| `auto`      | `allowlist` / `on-miss` | Exécute les commandes correspondant à la liste d’autorisation ; soumet les autres à un examen automatique avant de demander à une personne de les approuver. | Les sessions de programmation nécessitent un accès pratique et encadré. |
| `full`      | `full` / `off`          | Exécute des commandes sur l’hôte sans demander de confirmation.                                                                      | Cet hôte ou cette session de confiance doit ignorer les contrôles d’approbation. |

`ask` et `auto` partagent les mêmes paramètres de liste d’autorisation et de demande de confirmation ; `auto` active en plus l’examinateur automatique natif, qui statue lui-même sur les commandes sans correspondance et ne les transmet à la procédure d’approbation humaine configurée que lorsqu’il ne peut pas les approuver en toute sécurité.

Pour consulter l’ensemble de la politique d’exécution sur l’hôte, le fichier local d’approbations, le schéma de la liste d’autorisation, les binaires sûrs et le comportement de transfert, consultez [Approbations d’exécution](/fr/tools/exec-approvals).

## Correspondance avec Codex Guardian

Pour les sessions natives du serveur d’application Codex, `tools.exec.mode: "auto"` oriente Codex vers des approbations examinées par Guardian lorsque les exigences locales de Codex le permettent. Valeurs généralement obtenues :

| Champ Codex          | Valeur habituelle |
| -------------------- | ----------------- |
| `approvalPolicy`     | `on-request`      |
| `approvalsReviewer`  | `auto_review`     |
| `sandbox`            | `workspace-write` |

Le mode `auto` impose cette politique à la place de toute dérogation configurée pour le bac à sable ou les approbations de Codex ; il ne conserve donc pas les anciennes combinaisons non sûres telles que `approvalPolicy: "never"` avec `sandbox: "danger-full-access"`. `tools.exec.mode: "deny"` et `"allowlist"` bloquent entièrement l’exécution locale du serveur d’application Codex. Utilisez `tools.exec.mode: "full"` uniquement si vous souhaitez délibérément un fonctionnement sans approbation.

Pour la configuration du serveur d’application, l’ordre d’authentification et les détails de l’environnement d’exécution natif de Codex, consultez [Harnais d’exécution Codex](/fr/plugins/codex-harness).

## Autorisations du harnais d’exécution ACPX

Les sessions ACPX sont non interactives et ne peuvent donc pas accepter une demande d’autorisation dans un TTY. ACPX utilise des paramètres distincts au niveau du harnais d’exécution sous `plugins.entries.acpx.config` :

| Paramètre                   | Valeurs         | Signification                                                    |
| --------------------------- | --------------- | ---------------------------------------------------------------- |
| `permissionMode`            | `approve-reads` | Approuve automatiquement les lectures uniquement.                |
| `permissionMode`            | `approve-all`   | Approuve automatiquement les écritures et les commandes du shell. |
| `permissionMode`            | `deny-all`      | Refuse toutes les demandes d’autorisation.                       |
| `nonInteractivePermissions` | `fail`          | Interrompt l’exécution lorsqu’une confirmation serait nécessaire. |
| `nonInteractivePermissions` | `deny`          | Refuse la demande et poursuit l’exécution lorsque cela est possible. |

Configurez les autorisations ACPX séparément des approbations d’exécution d’OpenClaw :

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
openclaw gateway restart
```

Utilisez `approve-all` comme équivalent ACPX d’urgence d’une session de harnais d’exécution sans demande de confirmation. Pour en savoir plus sur la configuration et les modes d’échec, consultez [Configuration des agents ACP](/fr/tools/acp-agents-setup#permission-configuration).

## Choix d’un mode

| Objectif                                                        | Configuration                                                |
| --------------------------------------------------------------- | ------------------------------------------------------------ |
| Bloquer complètement les commandes sur l’hôte                   | `tools.exec.mode: "deny"`                                    |
| Autoriser uniquement l’exécution des commandes reconnues comme sûres | `tools.exec.mode: "allowlist"`                          |
| Demander confirmation à une personne pour chaque nouvelle forme de commande | `tools.exec.mode: "ask"`                           |
| Utiliser l’examen automatique de Codex/OpenClaw avant de solliciter une personne | `tools.exec.mode: "auto"`                       |
| Ignorer entièrement les approbations d’exécution sur l’hôte     | `tools.exec.mode: "full"` avec un fichier d’approbations de l’hôte correspondant |
| Autoriser les sessions ACPX non interactives à écrire et à exécuter des commandes | `plugins.entries.acpx.config.permissionMode: "approve-all"` |

Si une commande demande toujours une confirmation ou échoue après le changement de mode, examinez les deux couches :

```bash
openclaw approvals get
openclaw exec-policy show
```

L’exécution sur l’hôte applique le résultat le plus strict entre la configuration d’OpenClaw et le fichier local d’approbations de l’hôte. Les autorisations du harnais d’exécution ACPX n’assouplissent pas les approbations d’exécution sur l’hôte, et celles-ci n’assouplissent pas les demandes d’autorisation du harnais d’exécution ACPX.

## Voir aussi

- [Approbations d’exécution](/fr/tools/exec-approvals)
- [Approbations d’exécution — avancé](/fr/tools/exec-approvals-advanced)
- [Harnais d’exécution Codex](/fr/plugins/codex-harness)
- [Configuration des agents ACP](/fr/tools/acp-agents-setup#permission-configuration)
