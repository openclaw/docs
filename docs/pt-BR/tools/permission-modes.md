---
read_when:
    - Escolhendo auto, ask, allowlist, full ou deny para permissões de comandos
    - Configurando aprovações revisadas pelo Codex Guardian por meio de tools.exec.mode
    - Comparação entre as aprovações de execução do OpenClaw e as permissões do ambiente ACPX
summary: Modos de permissão para execução no host, aprovações do Codex Guardian e sessões do ambiente ACPX
title: Modos de permissão
x-i18n:
    generated_at: "2026-07-12T00:27:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f580e66508c1f69e868ed26a62d88a675f86a4d1ca738650dc5af82e967f3ac3
    source_path: tools/permission-modes.md
    workflow: 16
---

Os modos de permissão determinam quanta autoridade um agente possui antes de executar comandos no host, gravar arquivos ou solicitar acesso adicional a um ambiente de execução de backend.

<Note>
  O modo de permissão é separado de `tools.exec.host=auto`. `tools.exec.host`
  determina onde um comando é executado. `tools.exec.mode` determina como a
  execução no host é aprovada.
</Note>

## Padrão recomendado

Use `auto` para agentes de programação que precisam de acesso útil ao host sem transformar cada comando não correspondente em uma solicitação a uma pessoa:

```bash
openclaw config set tools.exec.mode auto
openclaw approvals get
openclaw gateway restart
```

Em seguida, verifique a política efetiva:

```bash
openclaw exec-policy show
```

## Modos de execução no host do OpenClaw

`tools.exec.mode` é a interface de política normalizada para `exec` no host. Cada modo corresponde a um par subjacente de `security` (rigor da lista de permissões) e `ask` (solicitação quando não há correspondência):

| Modo        | security / ask          | Comportamento                                                                                                                   | Use quando                                                      |
| ----------- | ----------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| `deny`      | `deny` / `off`          | Bloqueia completamente a execução no host.                                                                                       | Nenhum comando no host é permitido.                              |
| `allowlist` | `allowlist` / `off`     | Executa somente comandos na lista de permissões; nega silenciosamente os que não correspondem.                                   | Você tem um conjunto conhecido e seguro de comandos.             |
| `ask`       | `allowlist` / `on-miss` | Executa correspondências da lista de permissões; solicita a uma pessoa quando não há correspondência.                            | Uma pessoa deve revisar cada comando novo.                       |
| `auto`      | `allowlist` / `on-miss` | Executa correspondências da lista de permissões; envia as demais para revisão automática antes de recorrer à aprovação humana.   | Sessões de programação precisam de acesso prático e protegido.   |
| `full`      | `full` / `off`          | Executa no host sem solicitações.                                                                                                | Este host ou esta sessão confiável deve ignorar as etapas de aprovação. |

`ask` e `auto` compartilham as mesmas configurações de lista de permissões e solicitação; `auto` também habilita o revisor automático nativo, que decide por conta própria sobre comandos sem correspondência e só os encaminha para a rota de aprovação humana configurada quando não consegue aprová-los com segurança.

Para consultar a política completa de execução no host, o arquivo local de aprovações, o esquema da lista de permissões, os binários seguros e o comportamento de encaminhamento, consulte [Aprovações de execução](/pt-BR/tools/exec-approvals).

## Mapeamento do Codex Guardian

Para sessões nativas do servidor de aplicativo do Codex, `tools.exec.mode: "auto"` direciona o Codex para aprovações revisadas pelo Guardian quando os requisitos locais do Codex permitem. Valores resultantes típicos:

| Campo do Codex      | Valor típico      |
| ------------------- | ----------------- |
| `approvalPolicy`    | `on-request`      |
| `approvalsReviewer` | `auto_review`     |
| `sandbox`           | `workspace-write` |

O modo `auto` impõe essa política sobre quaisquer substituições configuradas de sandbox ou aprovação do Codex, portanto não preserva combinações legadas inseguras, como `approvalPolicy: "never"` com `sandbox: "danger-full-access"`. `tools.exec.mode: "deny"` e `"allowlist"` bloqueiam completamente a execução local pelo servidor de aplicativo do Codex. Use `tools.exec.mode: "full"` somente quando quiser intencionalmente uma configuração sem aprovação.

Para informações sobre a configuração do servidor de aplicativo, a ordem de autenticação e os detalhes do ambiente de execução nativo do Codex, consulte [Ambiente de execução do Codex](/pt-BR/plugins/codex-harness).

## Permissões do ambiente de execução ACPX

As sessões ACPX não são interativas, portanto não podem responder a uma solicitação de permissão em um TTY. O ACPX usa configurações separadas no nível do ambiente de execução em `plugins.entries.acpx.config`:

| Configuração                | Valores         | Significado                                                     |
| --------------------------- | --------------- | --------------------------------------------------------------- |
| `permissionMode`            | `approve-reads` | Aprova automaticamente somente leituras.                        |
| `permissionMode`            | `approve-all`   | Aprova automaticamente gravações e comandos do shell.           |
| `permissionMode`            | `deny-all`      | Nega todas as solicitações de permissão.                         |
| `nonInteractivePermissions` | `fail`          | Interrompe quando uma solicitação seria necessária.              |
| `nonInteractivePermissions` | `deny`          | Nega a solicitação e continua quando possível.                   |

Configure as permissões do ACPX separadamente das aprovações de execução do OpenClaw:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
openclaw gateway restart
```

Use `approve-all` como o equivalente emergencial do ACPX para uma sessão do ambiente de execução sem solicitações. Para detalhes de configuração e modos de falha, consulte [Configuração de agentes ACP](/pt-BR/tools/acp-agents-setup#permission-configuration).

## Escolha de um modo

| Objetivo                                              | Configuração                                                        |
| ----------------------------------------------------- | ------------------------------------------------------------------- |
| Bloquear completamente os comandos no host            | `tools.exec.mode: "deny"`                                           |
| Permitir somente comandos conhecidos e seguros        | `tools.exec.mode: "allowlist"`                                      |
| Solicitar a uma pessoa cada novo formato de comando   | `tools.exec.mode: "ask"`                                            |
| Usar a revisão automática do Codex/OpenClaw antes de pessoas | `tools.exec.mode: "auto"`                                     |
| Ignorar completamente as aprovações de execução no host | `tools.exec.mode: "full"` mais o arquivo correspondente de aprovações do host |
| Permitir gravação/execução em sessões ACPX não interativas | `plugins.entries.acpx.config.permissionMode: "approve-all"`     |

Se um comando ainda solicitar aprovação ou falhar após a alteração do modo, verifique ambas as camadas:

```bash
openclaw approvals get
openclaw exec-policy show
```

A execução no host usa o resultado mais restritivo entre a configuração do OpenClaw e o arquivo local de aprovações do host. As permissões do ambiente de execução ACPX não flexibilizam as aprovações de execução no host, e as aprovações de execução no host não flexibilizam as solicitações do ambiente de execução ACPX.

## Relacionados

- [Aprovações de execução](/pt-BR/tools/exec-approvals)
- [Aprovações de execução — avançado](/pt-BR/tools/exec-approvals-advanced)
- [Ambiente de execução do Codex](/pt-BR/plugins/codex-harness)
- [Configuração de agentes ACP](/pt-BR/tools/acp-agents-setup#permission-configuration)
