---
read_when:
    - Resolução repetida de referências de segredos em tempo de execução
    - Auditando resíduos de texto simples e referências não resolvidas
    - Configurando SecretRefs e aplicando alterações de limpeza unidirecional
summary: Referência da CLI para `openclaw secrets` (recarregar, auditar, configurar, aplicar)
title: Segredos
x-i18n:
    generated_at: "2026-07-11T23:50:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d1ac0d0f6e29ae52d9dd03e3333665062ccd961ed22a2b06ca7fa7fde128e177
    source_path: cli/secrets.md
    workflow: 16
---

# `openclaw secrets`

Gerencie SecretRefs e mantenha íntegro o snapshot ativo do ambiente de execução.

| Comando     | Função                                                                                                                                                                                                                           |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `reload`    | RPC do Gateway (`secrets.reload`): resolve novamente as referências e substitui o snapshot do ambiente de execução somente em caso de sucesso total (sem gravar configurações)                                                    |
| `audit`     | Verificação somente leitura dos armazenamentos de configuração, autenticação e modelos gerados, além de resíduos legados, em busca de texto simples, referências não resolvidas e desvios de precedência (referências `exec` são ignoradas, a menos que `--allow-exec` seja usado) |
| `configure` | Planejador interativo para configurar provedores, mapear destinos e executar a verificação preliminar (requer um TTY)                                                                                                             |
| `apply`     | Executa um plano salvo (`--dry-run` apenas valida e ignora verificações de execução por padrão; o modo de gravação rejeita planos que contenham execução, a menos que `--allow-exec` seja usado) e depois remove resíduos de texto simples dos destinos |

Fluxo recomendado para operadores:

```bash
openclaw secrets audit --check
openclaw secrets configure
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
openclaw secrets audit --check
openclaw secrets reload
```

Se o plano incluir SecretRefs/provedores `exec`, passe `--allow-exec` nos comandos `apply` de simulação e de gravação.

Códigos de saída para CI/bloqueios:

- `audit --check` retorna `1` quando há constatações.
- Referências não resolvidas retornam `2` (independentemente de `--check`).

Relacionado: [Gerenciamento de segredos](/pt-BR/gateway/secrets) · [Superfície de credenciais SecretRef](/pt-BR/reference/secretref-credential-surface) · [Segurança](/pt-BR/gateway/security)

## Recarregar o snapshot do ambiente de execução

```bash
openclaw secrets reload
openclaw secrets reload --json
openclaw secrets reload --url ws://127.0.0.1:18789 --token <token>
```

Usa o método RPC `secrets.reload` do Gateway. Se a resolução falhar, o Gateway mantém o último snapshot válido conhecido e retorna um erro (sem ativação parcial). A resposta JSON inclui `warningCount`.

Opções: `--url <url>`, `--token <token>`, `--timeout <ms>`, `--json`.

## Auditoria

Verifica o estado do OpenClaw em busca de:

- armazenamento de segredos em texto simples
- referências não resolvidas
- desvio de precedência (credenciais de `auth-profiles.json` que sobrepõem referências de `openclaw.json`)
- resíduos em `agents/*/agent/models.json` gerados (valores `apiKey` do provedor e cabeçalhos confidenciais do provedor)
- resíduos legados (entradas do armazenamento de autenticação legado, lembretes de OAuth)

A detecção de cabeçalhos confidenciais de provedores se baseia em heurísticas de nome: ela sinaliza cabeçalhos cujo nome corresponde a fragmentos comuns de autenticação/credenciais (`authorization`, `x-api-key`, `token`, `secret`, `password`, `credential`).

```bash
openclaw secrets audit
openclaw secrets audit --check
openclaw secrets audit --json
openclaw secrets audit --allow-exec
```

Estrutura do relatório:

- `status`: `clean | findings | unresolved`
- `resolution`: `refsChecked`, `skippedExecRefs`, `resolvabilityComplete`
- `summary`: `plaintextCount`, `unresolvedRefCount`, `shadowedRefCount`, `legacyResidueCount`
- códigos de constatação: `PLAINTEXT_FOUND`, `REF_UNRESOLVED`, `REF_SHADOWED`, `LEGACY_RESIDUE`

## Configuração (assistente interativo)

Crie interativamente alterações de provedores e SecretRefs, execute a verificação preliminar e, opcionalmente, aplique-as:

```bash
openclaw secrets configure
openclaw secrets configure --plan-out /tmp/openclaw-secrets-plan.json
openclaw secrets configure --apply --yes
openclaw secrets configure --providers-only
openclaw secrets configure --skip-provider-setup
openclaw secrets configure --agent ops
openclaw secrets configure --json
```

Fluxo: primeiro, configuração de provedores (adicionar/editar/remover aliases de `secrets.providers`); depois, mapeamento de credenciais (selecionar campos e atribuir referências `{source, provider, id}`); por fim, verificação preliminar e aplicação opcional.

Opções:

- `--providers-only`: configura apenas `secrets.providers` e ignora o mapeamento de credenciais
- `--skip-provider-setup`: ignora a configuração de provedores e mapeia credenciais para provedores existentes
- `--agent <id>`: restringe a descoberta de destinos e as gravações em `auth-profiles.json` ao armazenamento de um agente
- `--allow-exec`: permite verificações de SecretRefs `exec` durante a verificação preliminar/aplicação (pode executar comandos do provedor)

`--providers-only` e `--skip-provider-setup` não podem ser combinados.

Observações:

- Requer um TTY interativo.
- Abrange campos que contêm segredos em `openclaw.json`, além de `auth-profiles.json` para o escopo de agente selecionado; superfície canônica compatível: [Superfície de credenciais SecretRef](/pt-BR/reference/secretref-credential-surface).
- Permite criar novos mapeamentos em `auth-profiles.json` diretamente no fluxo do seletor.
- Executa a resolução preliminar antes da aplicação.
- Por padrão, os planos gerados têm as opções de remoção habilitadas (`scrubEnv`, `scrubAuthProfilesForProviderTargets`, `scrubLegacyAuthJson`). A aplicação dos valores em texto simples removidos é irreversível.
- Sem `--apply`, a CLI ainda exibe a pergunta `Apply this plan now?` após a verificação preliminar.
- Com `--apply` (e sem `--yes`), a CLI exibe uma confirmação adicional de migração irreversível.
- `--json` imprime o plano e o relatório de verificação preliminar, mas ainda requer um TTY interativo.

### Segurança de provedores exec

Instalações do Homebrew frequentemente expõem binários por links simbólicos em `/opt/homebrew/bin/*`. Defina `allowSymlinkCommand: true` somente quando necessário para caminhos confiáveis de gerenciadores de pacotes, em conjunto com `trustedDirs` (por exemplo, `["/opt/homebrew"]`). No Windows, se a verificação de ACL não estiver disponível para o caminho de um provedor, o OpenClaw interrompe a operação por segurança; somente para caminhos confiáveis, defina `allowInsecurePath: true` nesse provedor para ignorar a verificação de segurança do caminho.

## Aplicar um plano salvo

```bash
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --json
```

`--dry-run` valida a verificação preliminar sem gravar arquivos; por padrão, as verificações de SecretRefs `exec` são ignoradas na simulação. O modo de gravação rejeita planos que contenham SecretRefs/provedores exec, a menos que `--allow-exec` seja usado. Use `--allow-exec` para autorizar verificações/execução de provedores exec em qualquer um dos modos.

O que `apply` pode atualizar:

- `openclaw.json` (destinos SecretRef + inserções/atualizações/exclusões de provedores)
- `auth-profiles.json` (remoção de dados em destinos de provedores)
- resíduos no `auth.json` legado
- chaves de segredo conhecidas em `~/.openclaw/.env` cujos valores foram migrados

Detalhes do contrato do plano (caminhos de destino permitidos, regras de validação e semântica de falhas): [Contrato do plano de aplicação de segredos](/pt-BR/gateway/secrets-plan-contract).

### Por que não há backups para reversão

`secrets apply` intencionalmente não grava backups de reversão que contenham valores antigos em texto simples. A segurança é fornecida por uma verificação preliminar rigorosa e uma aplicação quase atômica, com restauração em memória realizada em caráter de melhor esforço em caso de falha.

## Exemplo

```bash
openclaw secrets audit --check
openclaw secrets configure
openclaw secrets audit --check
```

Se `audit --check` ainda relatar constatações de texto simples, atualize os demais caminhos de destino informados e execute a auditoria novamente.

## Relacionados

- [Referência da CLI](/pt-BR/cli)
- [Gerenciamento de segredos](/pt-BR/gateway/secrets)
- [SecretRefs do Vault](/plugins/vault)
