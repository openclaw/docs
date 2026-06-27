---
read_when:
    - Choisir auto, ask, allowlist, full ou deny pour les autorisations de commande
    - Configuration des approbations examinées par Codex Guardian via tools.exec.mode
    - Comparaison des approbations d’exécution OpenClaw avec les permissions du harnais ACPX
summary: Modes d’autorisation pour l’exécution hôte, les approbations Codex Guardian et les sessions de harnais ACPX
title: Modes d’autorisation
x-i18n:
    generated_at: "2026-06-27T18:20:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6ce89cadb45b3b96ce9ab62b35c06610d02f0ff02f15ef7d2128c59fbebb325a
    source_path: tools/permission-modes.md
    workflow: 16
---

Permission modes détermine le niveau d’autorité dont dispose un agent avant de pouvoir exécuter des commandes hôte, écrire des fichiers ou demander un accès supplémentaire à un backend harness. Commencez par `tools.exec.mode: "auto"` lorsque vous voulez qu’OpenClaw utilise d’abord des listes d’autorisation, puis l’auto-review native de Codex ou une voie d’approbation humaine pour les échecs.

<Note>
  Permission mode est distinct de `tools.exec.host=auto`. `tools.exec.host`
  choisit où une commande s’exécute. `tools.exec.mode` choisit comment l’exécution
  hôte est approuvée.
</Note>

## Valeur par défaut recommandée

Utilisez `auto` pour les agents de codage qui ont besoin d’un accès hôte utile sans transformer chaque échec en demande humaine :

```bash
openclaw config set tools.exec.mode auto
openclaw approvals get
openclaw gateway restart
```

Vérifiez ensuite la politique effective :

```bash
openclaw exec-policy show
```

En mode `auto`, OpenClaw exécute directement les correspondances déterministes des listes d’autorisation. Les échecs d’approbation passent d’abord par l’auto-évaluateur natif d’OpenClaw, puis reviennent à la voie d’approbation humaine configurée si nécessaire.

## Modes d’exécution hôte OpenClaw

`tools.exec.mode` est la surface de politique normalisée pour l’`exec` hôte.

| Mode        | Comportement                                              | À utiliser lorsque                                      |
| ----------- | --------------------------------------------------------- | ------------------------------------------------------- |
| `deny`      | Bloque l’exécution hôte.                                  | Aucune commande hôte n’est autorisée.                   |
| `allowlist` | Exécute uniquement les commandes autorisées.              | Vous disposez d’un ensemble de commandes réputées sûres. |
| `ask`       | Exécute les correspondances autorisées et demande en cas d’échec. | Un humain doit examiner les nouvelles commandes.        |
| `auto`      | Exécute les correspondances autorisées, puis utilise l’auto-review. | Les sessions de codage nécessitent un accès pratique et encadré. |
| `full`      | Exécute les commandes hôte sans invite.                   | Cet hôte/cette session de confiance doit ignorer les barrières d’approbation. |

Pour la politique complète d’exécution hôte, le fichier local d’approbations, le schéma de liste d’autorisation, les binaires sûrs et le comportement de transfert, consultez [Approbations exec](/fr/tools/exec-approvals).

## Correspondance Codex Guardian

Pour les sessions natives du serveur d’application Codex, `tools.exec.mode: "auto"` correspond aux approbations examinées par Codex Guardian lorsque les exigences locales de Codex le permettent. OpenClaw envoie généralement :

| Champ Codex         | Valeur typique    |
| ------------------- | ----------------- |
| `approvalPolicy`    | `on-request`      |
| `approvalsReviewer` | `auto_review`     |
| `sandbox`           | `workspace-write` |

En mode `auto`, OpenClaw ne conserve pas les anciens remplacements Codex non sécurisés tels que `approvalPolicy: "never"` ou `sandbox: "danger-full-access"`. Utilisez `tools.exec.mode: "full"` uniquement lorsque vous voulez intentionnellement une posture sans approbation.

Pour la configuration du serveur d’application, l’ordre d’authentification et les détails du runtime Codex natif, consultez le [harnais Codex](/fr/plugins/codex-harness).

## Autorisations du harnais ACPX

Les sessions ACPX sont non interactives, elles ne peuvent donc pas cliquer sur une invite d’autorisation TTY. ACPX utilise des paramètres distincts au niveau du harnais sous `plugins.entries.acpx.config` :

| Paramètre                   | Valeur courante | Signification                                |
| --------------------------- | --------------- | -------------------------------------------- |
| `permissionMode`            | `approve-reads` | Approuver automatiquement les lectures seules. |
| `permissionMode`            | `approve-all`   | Approuver automatiquement les écritures et les commandes shell. |
| `permissionMode`            | `deny-all`      | Refuser toutes les invites d’autorisation.   |
| `nonInteractivePermissions` | `fail`          | Abandonner lorsqu’une invite serait requise. |
| `nonInteractivePermissions` | `deny`          | Refuser l’invite et continuer si possible.   |

Définissez les autorisations ACPX séparément des approbations d’exécution OpenClaw :

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
openclaw gateway restart
```

Utilisez `approve-all` comme équivalent ACPX de secours d’une session de harnais sans invite. Pour les détails de configuration et les modes de défaillance, consultez la [configuration des agents ACP](/fr/tools/acp-agents-setup#permission-configuration).

## Choisir un mode

| Objectif                                      | Configuration                                             |
| --------------------------------------------- | --------------------------------------------------------- |
| Bloquer complètement les commandes hôte       | `tools.exec.mode: "deny"`                                 |
| Autoriser uniquement les commandes connues comme sûres | `tools.exec.mode: "allowlist"`                    |
| Demander à un humain pour chaque nouvelle forme de commande | `tools.exec.mode: "ask"`                         |
| Utiliser la revue automatique Codex/OpenClaw avant les humains | `tools.exec.mode: "auto"`                       |
| Ignorer entièrement les approbations d’exécution hôte | `tools.exec.mode: "full"` plus matching host approvals file |
| Faire écrire/exécuter les sessions ACPX non interactives | `plugins.entries.acpx.config.permissionMode: "approve-all"` |

Si une commande affiche toujours une invite ou échoue après le changement de mode, inspectez les deux couches :

```bash
openclaw approvals get
openclaw exec-policy show
```

L’exécution hôte utilise le résultat le plus strict entre la configuration OpenClaw et le fichier d’approbations local à l’hôte. Les autorisations du harnais ACPX n’assouplissent pas les approbations d’exécution hôte, et les approbations d’exécution hôte n’assouplissent pas les invites du harnais ACPX.

## Connexe

- [Approbations d’exécution](/fr/tools/exec-approvals)
- [Approbations d’exécution - avancé](/fr/tools/exec-approvals-advanced)
- [Harnais Codex](/fr/plugins/codex-harness)
- [Configuration des agents ACP](/fr/tools/acp-agents-setup#permission-configuration)
