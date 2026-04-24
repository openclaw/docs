---
read_when:
    - Resolver novamente refs de segredos em runtime
    - Auditar resíduos em texto simples e refs não resolvidas
    - Configurar SecretRefs e aplicar alterações unidirecionais de limpeza
summary: Referência da CLI para `openclaw secrets` (recarregar, auditar, configurar, aplicar)
title: Segredos
x-i18n:
    generated_at: "2026-04-24T05:46:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6fe1933ca6a9f2a24fbbe20fa3b83bf8f6493ea6c94061e135b4e1b48c33d62c
    source_path: cli/secrets.md
    workflow: 15
---

# `openclaw secrets`

Use `openclaw secrets` para gerenciar SecretRefs e manter o snapshot ativo de runtime íntegro.

Funções dos comandos:

- `reload`: RPC do gateway (`secrets.reload`) que resolve novamente refs e troca o snapshot de runtime apenas em caso de sucesso completo (sem gravações na configuração).
- `audit`: varredura somente leitura de armazenamentos de configuração/auth/modelos gerados e resíduos legados em busca de texto simples, refs não resolvidas e deriva de precedência (refs de exec são ignoradas a menos que `--allow-exec` seja definido).
- `configure`: planejador interativo para configuração de provider, mapeamento de destino e preflight (TTY obrigatório).
- `apply`: executa um plano salvo (`--dry-run` apenas para validação; dry-run ignora verificações de exec por padrão, e o modo de gravação rejeita planos com exec, a menos que `--allow-exec` seja definido), depois limpa resíduos de texto simples dos destinos selecionados.

Loop recomendado para operadores:

```bash
openclaw secrets audit --check
openclaw secrets configure
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
openclaw secrets audit --check
openclaw secrets reload
```

Se o seu plano incluir providers/SecretRefs `exec`, passe `--allow-exec` tanto nos comandos de apply em dry-run quanto nos de gravação.

Observação sobre código de saída para CI/validações:

- `audit --check` retorna `1` quando há achados.
- refs não resolvidas retornam `2`.

Relacionado:

- Guia de segredos: [Gerenciamento de segredos](/pt-BR/gateway/secrets)
- Superfície de credenciais: [Superfície de credenciais SecretRef](/pt-BR/reference/secretref-credential-surface)
- Guia de segurança: [Segurança](/pt-BR/gateway/security)

## Recarregar snapshot de runtime

Resolva novamente refs de segredos e troque atomicamente o snapshot de runtime.

```bash
openclaw secrets reload
openclaw secrets reload --json
openclaw secrets reload --url ws://127.0.0.1:18789 --token <token>
```

Observações:

- Usa o método RPC do gateway `secrets.reload`.
- Se a resolução falhar, o gateway mantém o último snapshot válido conhecido e retorna um erro (sem ativação parcial).
- A resposta JSON inclui `warningCount`.

Opções:

- `--url <url>`
- `--token <token>`
- `--timeout <ms>`
- `--json`

## Auditar

Examine o estado do OpenClaw em busca de:

- armazenamento de segredos em texto simples
- refs não resolvidas
- deriva de precedência (credenciais em `auth-profiles.json` sobrescrevendo refs de `openclaw.json`)
- resíduos gerados em `agents/*/agent/models.json` (valores `apiKey` de providers e cabeçalhos sensíveis de provider)
- resíduos legados (entradas do armazenamento legado de auth, lembretes de OAuth)

Observação sobre resíduos em cabeçalhos:

- A detecção de cabeçalhos sensíveis de provider é baseada em heurística de nome (nomes e fragmentos comuns de cabeçalhos de autenticação/credencial, como `authorization`, `x-api-key`, `token`, `secret`, `password` e `credential`).

```bash
openclaw secrets audit
openclaw secrets audit --check
openclaw secrets audit --json
openclaw secrets audit --allow-exec
```

Comportamento de saída:

- `--check` sai com código diferente de zero quando há achados.
- refs não resolvidas saem com código diferente de zero de prioridade mais alta.

Destaques do formato do relatório:

- `status`: `clean | findings | unresolved`
- `resolution`: `refsChecked`, `skippedExecRefs`, `resolvabilityComplete`
- `summary`: `plaintextCount`, `unresolvedRefCount`, `shadowedRefCount`, `legacyResidueCount`
- códigos de achado:
  - `PLAINTEXT_FOUND`
  - `REF_UNRESOLVED`
  - `REF_SHADOWED`
  - `LEGACY_RESIDUE`

## Configurar (helper interativo)

Crie interativamente mudanças de provider e SecretRef, execute preflight e, opcionalmente, aplique:

```bash
openclaw secrets configure
openclaw secrets configure --plan-out /tmp/openclaw-secrets-plan.json
openclaw secrets configure --apply --yes
openclaw secrets configure --providers-only
openclaw secrets configure --skip-provider-setup
openclaw secrets configure --agent ops
openclaw secrets configure --json
```

Fluxo:

- Primeiro configuração do provider (`add/edit/remove` para aliases em `secrets.providers`).
- Depois mapeamento de credenciais (selecionar campos e atribuir refs `{source, provider, id}`).
- Por fim preflight e apply opcional.

Flags:

- `--providers-only`: configura apenas `secrets.providers`, ignora mapeamento de credenciais.
- `--skip-provider-setup`: ignora configuração de provider e mapeia credenciais para providers existentes.
- `--agent <id>`: limita a descoberta de destinos e gravações de `auth-profiles.json` a um armazenamento de agente.
- `--allow-exec`: permite verificações de SecretRef exec durante preflight/apply (pode executar comandos do provider).

Observações:

- Exige um TTY interativo.
- Você não pode combinar `--providers-only` com `--skip-provider-setup`.
- `configure` tem como alvo campos que contêm segredos em `openclaw.json` e também `auth-profiles.json` para o escopo de agente selecionado.
- `configure` oferece suporte à criação de novos mapeamentos em `auth-profiles.json` diretamente no fluxo de seleção.
- Superfície canônica compatível: [Superfície de credenciais SecretRef](/pt-BR/reference/secretref-credential-surface).
- Ele executa resolução de preflight antes do apply.
- Se o preflight/apply incluir refs exec, mantenha `--allow-exec` definido nas duas etapas.
- Planos gerados ativam por padrão opções de limpeza (`scrubEnv`, `scrubAuthProfilesForProviderTargets`, `scrubLegacyAuthJson` todos ativados).
- O caminho de apply é unidirecional para valores em texto simples limpos.
- Sem `--apply`, a CLI ainda pergunta `Apply this plan now?` após o preflight.
- Com `--apply` (e sem `--yes`), a CLI pede uma confirmação extra irreversível.
- `--json` imprime o plano + relatório de preflight, mas o comando ainda exige um TTY interativo.

Observação de segurança para provider exec:

- Instalações do Homebrew frequentemente expõem binários com links simbólicos em `/opt/homebrew/bin/*`.
- Defina `allowSymlinkCommand: true` apenas quando necessário para caminhos confiáveis de gerenciador de pacotes e combine isso com `trustedDirs` (por exemplo `["/opt/homebrew"]`).
- No Windows, se a verificação de ACL não estiver disponível para um caminho de provider, o OpenClaw falha de forma fechada. Apenas para caminhos confiáveis, defina `allowInsecurePath: true` nesse provider para ignorar verificações de segurança de caminho.

## Aplicar um plano salvo

Aplique ou execute preflight de um plano gerado anteriormente:

```bash
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --json
```

Comportamento de exec:

- `--dry-run` valida o preflight sem gravar arquivos.
- Verificações de SecretRef exec são ignoradas por padrão em dry-run.
- O modo de gravação rejeita planos que contenham SecretRefs/providers exec, a menos que `--allow-exec` seja definido.
- Use `--allow-exec` para optar por verificações/execução de provider exec em qualquer modo.

Detalhes do contrato do plano (caminhos de destino permitidos, regras de validação e semântica de falha):

- [Contrato de plano de apply de segredos](/pt-BR/gateway/secrets-plan-contract)

O que `apply` pode atualizar:

- `openclaw.json` (destinos de SecretRef + upserts/exclusões de provider)
- `auth-profiles.json` (limpeza de destinos de provider)
- resíduos legados em `auth.json`
- chaves de segredo conhecidas em `~/.openclaw/.env` cujos valores foram migrados

## Por que não há backups para rollback

`secrets apply` intencionalmente não grava backups de rollback contendo valores antigos em texto simples.

A segurança vem de preflight rigoroso + apply quase atômico com restauração em memória em melhor esforço em caso de falha.

## Exemplo

```bash
openclaw secrets audit --check
openclaw secrets configure
openclaw secrets audit --check
```

Se `audit --check` ainda relatar achados de texto simples, atualize os caminhos de destino restantes informados e execute a auditoria novamente.

## Relacionado

- [Referência da CLI](/pt-BR/cli)
- [Gerenciamento de segredos](/pt-BR/gateway/secrets)
