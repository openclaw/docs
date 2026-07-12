---
read_when:
    - Resolução reiterada de referências de segredos em tempo de execução
    - Auditando resíduos de texto simples e referências não resolvidas
    - Configurando SecretRefs e aplicando alterações de depuração unidirecional
summary: Referência da CLI para `openclaw secrets` (recarregar, auditar, configurar, aplicar)
title: Segredos
x-i18n:
    generated_at: "2026-07-12T15:02:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: d1ac0d0f6e29ae52d9dd03e3333665062ccd961ed22a2b06ca7fa7fde128e177
    source_path: cli/secrets.md
    workflow: 16
---

# `openclaw secrets`

Gerencie SecretRefs e mantenha íntegro o snapshot ativo do runtime.

| Comando     | Função                                                                                                                                                                                         |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `reload`    | RPC do Gateway (`secrets.reload`): resolve novamente as referências e substitui o snapshot do runtime somente em caso de sucesso total (sem gravações na configuração)                                                                      |
| `audit`     | Verificação somente leitura dos armazenamentos de configuração/autenticação/modelos gerados e dos resíduos legados em busca de texto simples, referências não resolvidas e desvios de precedência (referências exec ignoradas, exceto com `--allow-exec`)                      |
| `configure` | Planejador interativo para configuração de provedores, mapeamento de destinos e pré-verificação (requer uma TTY)                                                                                                       |
| `apply`     | Executa um plano salvo (`--dry-run` apenas valida e ignora verificações de exec por padrão; o modo de gravação rejeita planos que contêm exec, exceto com `--allow-exec`) e depois remove resíduos de texto simples dos destinos especificados |

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

Códigos de saída para CI/gates:

- `audit --check` retorna `1` quando há constatações.
- Referências não resolvidas retornam `2` (independentemente de `--check`).

Relacionado: [Gerenciamento de segredos](/pt-BR/gateway/secrets) · [Superfície de credenciais do SecretRef](/pt-BR/reference/secretref-credential-surface) · [Segurança](/pt-BR/gateway/security)

## Recarregar o snapshot do runtime

```bash
openclaw secrets reload
openclaw secrets reload --json
openclaw secrets reload --url ws://127.0.0.1:18789 --token <token>
```

Usa o método RPC do Gateway `secrets.reload`. Se a resolução falhar, o Gateway mantém o último snapshot válido conhecido e retorna um erro (sem ativação parcial). A resposta JSON inclui `warningCount`.

Opções: `--url <url>`, `--token <token>`, `--timeout <ms>`, `--json`.

## Auditoria

Verifica o estado do OpenClaw em busca de:

- armazenamento de segredos em texto simples
- referências não resolvidas
- desvio de precedência (credenciais de `auth-profiles.json` sobrepondo referências de `openclaw.json`)
- resíduos no `agents/*/agent/models.json` gerado (valores `apiKey` do provedor e cabeçalhos confidenciais do provedor)
- resíduos legados (entradas do armazenamento de autenticação legado, lembretes de OAuth)

A detecção de cabeçalhos confidenciais de provedores baseia-se em heurísticas de nomes: ela sinaliza cabeçalhos cujo nome corresponde a fragmentos comuns de autenticação/credenciais (`authorization`, `x-api-key`, `token`, `secret`, `password`, `credential`).

```bash
openclaw secrets audit
openclaw secrets audit --check
openclaw secrets audit --json
openclaw secrets audit --allow-exec
```

Formato do relatório:

- `status`: `clean | findings | unresolved`
- `resolution`: `refsChecked`, `skippedExecRefs`, `resolvabilityComplete`
- `summary`: `plaintextCount`, `unresolvedRefCount`, `shadowedRefCount`, `legacyResidueCount`
- códigos de constatação: `PLAINTEXT_FOUND`, `REF_UNRESOLVED`, `REF_SHADOWED`, `LEGACY_RESIDUE`

## Configurar (assistente interativo)

Crie interativamente alterações de provedores e SecretRefs, execute a pré-verificação e, opcionalmente, aplique-as:

```bash
openclaw secrets configure
openclaw secrets configure --plan-out /tmp/openclaw-secrets-plan.json
openclaw secrets configure --apply --yes
openclaw secrets configure --providers-only
openclaw secrets configure --skip-provider-setup
openclaw secrets configure --agent ops
openclaw secrets configure --json
```

Fluxo: primeiro, configuração de provedores (adicionar/editar/remover aliases de `secrets.providers`), depois, mapeamento de credenciais (selecionar campos, atribuir referências `{source, provider, id}`) e, por fim, pré-verificação e aplicação opcional.

Flags:

- `--providers-only`: configura apenas `secrets.providers` e ignora o mapeamento de credenciais
- `--skip-provider-setup`: ignora a configuração de provedores e mapeia credenciais para provedores existentes
- `--agent <id>`: restringe a descoberta de destinos e as gravações de `auth-profiles.json` ao armazenamento de um agente
- `--allow-exec`: permite verificações de SecretRef do tipo exec durante a pré-verificação/aplicação (pode executar comandos do provedor)

`--providers-only` e `--skip-provider-setup` não podem ser combinados.

Observações:

- Requer um TTY interativo.
- Abrange campos que contêm segredos em `openclaw.json`, além de `auth-profiles.json` para o escopo de agente selecionado; superfície canônica compatível: [Superfície de credenciais SecretRef](/pt-BR/reference/secretref-credential-surface).
- Permite criar novos mapeamentos de `auth-profiles.json` diretamente no fluxo do seletor.
- Executa a resolução de pré-verificação antes da aplicação.
- Os planos gerados têm, por padrão, as opções de remoção habilitadas (`scrubEnv`, `scrubAuthProfilesForProviderTargets`, `scrubLegacyAuthJson`). A aplicação é irreversível para valores de texto simples removidos.
- Sem `--apply`, a CLI ainda exibe a confirmação `Apply this plan now?` após a pré-verificação.
- Com `--apply` (e sem `--yes`), a CLI exibe uma confirmação adicional para a migração irreversível.
- `--json` imprime o plano e o relatório de pré-verificação, mas ainda requer um TTY interativo.

### Segurança do provedor exec

Instalações do Homebrew geralmente expõem binários por meio de links simbólicos em `/opt/homebrew/bin/*`. Defina `allowSymlinkCommand: true` somente quando necessário para caminhos confiáveis de gerenciadores de pacotes, em conjunto com `trustedDirs` (por exemplo, `["/opt/homebrew"]`). No Windows, se a verificação de ACL não estiver disponível para o caminho de um provedor, o OpenClaw bloqueia a operação por segurança; somente para caminhos confiáveis, defina `allowInsecurePath: true` nesse provedor para ignorar a verificação de segurança do caminho.

## Aplicar um plano salvo

```bash
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --json
```

`--dry-run` valida a pré-verificação sem gravar arquivos; as verificações de SecretRef do tipo exec são ignoradas por padrão na simulação. O modo de gravação rejeita planos que contenham SecretRefs ou provedores do tipo exec, a menos que `--allow-exec` seja usado. Use `--allow-exec` para autorizar verificações e execuções de provedores exec em qualquer um dos modos.

O que `apply` pode atualizar:

- `openclaw.json` (destinos de SecretRef + inserções/atualizações e exclusões de provedores)
- `auth-profiles.json` (remoção de dados dos destinos de provedores)
- resíduos do `auth.json` legado
- chaves de segredo conhecidas em `~/.openclaw/.env` cujos valores foram migrados

Detalhes do contrato do plano (caminhos de destino permitidos, regras de validação e semântica de falhas): [Contrato do plano de aplicação de segredos](/pt-BR/gateway/secrets-plan-contract).

### Por que não há backups para reversão

`secrets apply` intencionalmente não grava backups para reversão que contenham valores antigos em texto simples. A segurança resulta de uma pré-verificação rigorosa e de uma aplicação praticamente atômica, com tentativa de restauração em memória em caso de falha.

## Exemplo

```bash
openclaw secrets audit --check
openclaw secrets configure
openclaw secrets audit --check
```

Se `audit --check` ainda relatar ocorrências em texto simples, atualize os demais caminhos de destino relatados e execute a auditoria novamente.

## Relacionado

- [Referência da CLI](/pt-BR/cli)
- [Gerenciamento de segredos](/pt-BR/gateway/secrets)
- [SecretRefs do Vault](/plugins/vault)
